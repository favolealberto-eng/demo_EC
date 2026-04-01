// ==========================================
// TEMPLATE: PANNELLO IAQ (Qualità dell'Aria)
// Risoluzione nativa: 800x1422 (Verticale 9:16)
// Funzione: Fornisce un indicatore visuale con gauge circolare 
// per uno score qualitativo ambientale, più 4 sotto-metri (temperatura, umidità etc).
// ==========================================

window.LayoutIAQ = {
    // 1. PARAMETRI DI STRUTTURA DEL CANVAS AR
    config: {
        canvasW: 800,
        canvasH: 1422,
        planeW: 2.4,
        planeH: 4.27
    },

    // 2. MAPPA DELLE AREE CLICCABILI (Coordinate aggiornate con i nuovi pulsanti)
    hitboxes: [
        { id: "iaq_score", x: 222, y: 311, w: 355, h: 266 },
        { id: "temperatura", x: 53, y: 800, w: 693, h: 78 },
        { id: "umidita", x: 53, y: 898, w: 693, h: 78 },
        { id: "rumore", x: 53, y: 995, w: 693, h: 78 },
        { id: "luce", x: 53, y: 1093, w: 693, h: 78 }
    ],

    // 3. DATABASE FITTIZIO (Simulazione chiamata API globale o sensoristica Edge)
    /**
     * fetchDati - Wrapper di simulazione. Popola dinamicamente tramite la cache giornaliera 
     * in `index.html` il loop dei parametri IAQ. 
     */
    fetchDati: function (callback) {
        setTimeout(() => {
            const now = new Date();
            const currentSlotIndex = Math.floor(now.getHours() * 4 + now.getMinutes() / 15);

            const getMock = (metrica) => {
                const arr = window.getMockDayData ? window.getMockDayData(metrica) : [];
                return arr.length > currentSlotIndex ? parseFloat(arr[currentSlotIndex]) : null;
            };

            const score = getMock('iaq_score') || 8.5;
            const temperatura = getMock('temperatura') || 22.5;
            const umidita = getMock('umidita') || 45;
            const rumore = getMock('rumore') || 40;
            const luce = getMock('luce') || 450;

            const h_sync = Math.floor(currentSlotIndex / 4).toString().padStart(2, '0');
            const m_sync = ((currentSlotIndex % 4) * 15).toString().padStart(2, '0');
            const str_ora_attuale = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
            const testoAggiornamento = `Ultimo agg. ore ${h_sync}:${m_sync} (attuale ${str_ora_attuale})`;

            const mockData = {
                timestamp: now,
                testo_aggiornamento: testoAggiornamento,
                score: score.toFixed(1),
                temperatura: temperatura.toFixed(1),
                umidita: umidita.toFixed(0),
                rumore: rumore.toFixed(0),
                luce: luce.toFixed(0)
            };
            callback(mockData);
        }, 200);
    },

    // 4. MOTORE GRAFICO SPECIFICO
    /**
     * draw - Routine di disegno principale richiamata ogni ~1000ms.
     * Implementa la generazione nativa `canvas2D` di un arco graduato multi-stop
     * (Rosso->Verde) calcolando trigonometricamente la rotazione della lancetta (Freccia).
     */
    draw: function (ctx, dati, config) {
        const W = 800, H = 1422;
        ctx.clearRect(0, 0, W, H);

        if (typeof isPinned !== 'undefined' && isPinned) {
            if (ctx.canvas) {
                ctx.canvas.style.setProperty('width', '100%', 'important');
                ctx.canvas.style.setProperty('height', 'auto', 'important');
                ctx.canvas.style.setProperty('max-height', 'none', 'important');
                ctx.canvas.style.setProperty('max-width', 'none', 'important');
                ctx.canvas.style.setProperty('margin', '0', 'important');
                ctx.canvas.style.setProperty('border-radius', '0', 'important');
                ctx.canvas.style.setProperty('border', 'none', 'important');
                if (ctx.canvas.parentElement) {
                    ctx.canvas.parentElement.style.setProperty('padding', '0', 'important');
                }
            }
        } else {
            if (ctx.canvas) {
                ctx.canvas.style.removeProperty('width');
                ctx.canvas.style.removeProperty('height');
                ctx.canvas.style.removeProperty('max-height');
                ctx.canvas.style.removeProperty('max-width');
                ctx.canvas.style.removeProperty('margin');
                ctx.canvas.style.removeProperty('border-radius');
                ctx.canvas.style.removeProperty('border');
                if (ctx.canvas.parentElement) {
                    ctx.canvas.parentElement.style.removeProperty('padding');
                }
            }
        }


        // --- SFONDO SCURO ---
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, '#0d1f3c');
        bgGrad.addColorStop(0.55, '#0f2d1f');
        bgGrad.addColorStop(1, '#0d1f3c');
        ctx.fillStyle = bgGrad;
        ctx.beginPath(); ctx.roundRect(0, 0, W, H, 44); ctx.fill();

        // Bordo ambra
        ctx.strokeStyle = 'rgba(6,182,212,0.35)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(2, 2, W - 4, H - 4, 43); ctx.stroke();

        // --- HEADER ---
        const hdrGrad = ctx.createLinearGradient(10, 10, W - 10, 10);
        hdrGrad.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
        hdrGrad.addColorStop(1, 'rgba(8, 145, 178, 0.2)');
        ctx.fillStyle = hdrGrad;
        ctx.beginPath(); ctx.roundRect(0, 0, W, 180, { tl: 44, tr: 44, bl: 0, br: 0 }); ctx.fill();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, 180); ctx.lineTo(W, 180); ctx.stroke();

        const titolo = config && config.nome ? config.nome.toUpperCase().replace('_', ' ') : "QUALITÀ DELL'ARIA";
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 48px sans-serif'; ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic'; // Ripristina baseline standard per l'header
        ctx.shadowColor = 'rgba(6,182,212,0.4)'; ctx.shadowBlur = 12;
        ctx.fillText(titolo, W / 2, 98);
        ctx.shadowBlur = 0;

        // Sottotitolo orario
        ctx.fillStyle = 'rgba(148,163,184,0.85)';
        ctx.font = '30px sans-serif';
        ctx.fillText(dati.testo_aggiornamento, W / 2, 151);

        // --- ARCO IAQ (invariato nella logica, restyled) ---
        const cx = 400, cy = 533, radius = 249, thickness = 44;

        // Track di sfondo scuro
        ctx.beginPath();
        ctx.arc(cx, cy, radius, Math.PI, Math.PI * 2);
        ctx.lineWidth = thickness + 9;
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineCap = 'round';
        ctx.stroke();

        // Arco colorato
        const gradient = ctx.createConicGradient(Math.PI, cx, cy);
        gradient.addColorStop(0, '#991b1b');
        gradient.addColorStop(0.125, '#ef4444');
        gradient.addColorStop(0.25, '#eab308');
        gradient.addColorStop(0.375, '#22c55e');
        gradient.addColorStop(0.5, '#15803d');
        gradient.addColorStop(0.6, '#15803d');
        gradient.addColorStop(1, '#991b1b');

        ctx.beginPath();
        ctx.arc(cx, cy, radius, Math.PI, Math.PI * 2);
        ctx.lineWidth = thickness;
        ctx.strokeStyle = gradient;
        ctx.lineCap = 'round';
        ctx.stroke();

        // --- CALCOLO STATO E FRECCIA (logica invariata) ---
        const scoreNum = parseFloat(dati.score);
        let label = "", colorePunteggio = "";

        if (scoreNum < 3) { label = "SCARSA"; colorePunteggio = "#ef4444"; }
        else if (scoreNum < 5) { label = "ACCETTABILE"; colorePunteggio = "#f97316"; }
        else if (scoreNum < 7) { label = "NELLA MEDIA"; colorePunteggio = "#eab308"; }
        else if (scoreNum < 9) { label = "BUONA"; colorePunteggio = "#84cc16"; }
        else { label = "OTTIMA"; colorePunteggio = "#22c55e"; }

        const percentuale = (scoreNum - 1) / 9;
        const angoloFreccia = Math.PI + (percentuale * Math.PI);
        const raggioInterno = radius - (thickness / 2) - 15;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angoloFreccia);
        ctx.beginPath();
        ctx.moveTo(raggioInterno, 0);
        ctx.lineTo(raggioInterno - 22, -13);
        ctx.lineTo(raggioInterno - 22, 13);
        ctx.closePath();
        ctx.fillStyle = '#f1f5f9';
        ctx.shadowColor = 'rgba(255,255,255,0.5)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();

        // [Rimosso l'anello tratteggiato attorno allo score]

        // Valore score
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 129px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = colorePunteggio; ctx.shadowBlur = 20;
        ctx.fillText(dati.score.replace('.', ','), cx, 493);
        ctx.shadowBlur = 0;

        // Label qualità
        ctx.fillStyle = colorePunteggio;
        ctx.font = 'bold 39px sans-serif';
        ctx.shadowColor = colorePunteggio; ctx.shadowBlur = 10;
        ctx.fillText(label, cx, 576);
        ctx.shadowBlur = 0;

        // Scale labels
        ctx.fillStyle = 'rgba(148,163,184,0.7)';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText("1", 151, 622);
        ctx.fillText("10", 650, 622);

        // --- CARD DATI SENSORI ---
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.beginPath(); ctx.roundRect(36, 711, 729, 640, 36); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.10)';
        ctx.lineWidth = 1.5; ctx.stroke();

        // Titolo card
        ctx.fillStyle = 'rgba(6,182,212,0.9)';
        ctx.font = 'bold 27px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('DATI SENSORI AMBIENTALI', 67, 760);
        ctx.fillStyle = 'rgba(6,182,212,0.35)';
        ctx.fillRect(67, 766, 329, 2);


        // --- NUOVA LOGICA DI DISEGNO RIGHE ---
        function drawRigaDato(rowTop, label, valore, unita) {
            const rowH = 78;
            const centerY = rowTop + (rowH / 2); // Calcoliamo il centro verticale esatto della riga

            // Pill background
            ctx.fillStyle = 'rgba(6,182,212,0.07)';
            ctx.beginPath(); ctx.roundRect(53, rowTop, 693, rowH, 18); ctx.fill();

            // Bordo sottile cyan
            ctx.strokeStyle = 'rgba(6,182,212,0.22)';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.roundRect(53, rowTop, 693, rowH, 18); ctx.stroke();

            // Configura l'allineamento verticale al centro
            ctx.textBaseline = 'middle';

            // Label
            ctx.fillStyle = 'rgba(148,163,184,0.90)';
            ctx.font = '34px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(label, 84, centerY);

            // Valore
            ctx.fillStyle = '#f1f5f9';
            ctx.font = 'bold 39px sans-serif'; // Leggermente ridotto per non toccare i bordi
            ctx.textAlign = 'right';
            ctx.fillText(`${valore} ${unita}`, 631, centerY);

            // Pallino verde live indicator
            ctx.fillStyle = '#22c55e';
            ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(675, centerY, 7, 0, Math.PI * 2); // Allineato a centerY e leggermente più piccolo
            ctx.fill();
            ctx.shadowBlur = 0;

            // Chevron '›'
            ctx.fillStyle = 'rgba(6,182,212,0.65)';
            ctx.font = 'bold 41px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('›', 729, centerY);
        }

        // Ora passiamo la coordinata Y superiore (rowTop) della riga
        drawRigaDato(800, "Temperatura", dati.temperatura, "°C");
        drawRigaDato(898, "Umidità", dati.umidita, "%");
        drawRigaDato(995, "Rumore", dati.rumore, "dB");
        drawRigaDato(1093, "Illuminamento", dati.luce, "lux");

        // Footer
        ctx.textBaseline = 'alphabetic'; // Ripristina la baseline standard prima del footer
        ctx.fillStyle = 'rgba(100,116,139,0.55)';
        ctx.font = '25px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('👆 Tocca una riga o lo score per il dettaglio', W / 2, 1324); // Spostato leggermente in alto per stare nella card
    }
}