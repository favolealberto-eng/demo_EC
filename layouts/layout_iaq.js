// ==========================================
// TEMPLATE: PANNELLO IAQ (Qualità dell'Aria)
// Risoluzione nativa: 900x1600 (Verticale 9:16)
// Funzione: Fornisce un indicatore visuale con gauge circolare 
// per uno score qualitativo ambientale, più 4 sotto-metri (temperatura, umidità etc).
// ==========================================

window.LayoutIAQ = {
    // 1. PARAMETRI DI STRUTTURA DEL CANVAS AR
    config: {
        canvasW: 900,
        canvasH: 1600,
        planeW: 2.7,
        planeH: 4.8
    },

    // 2. MAPPA DELLE AREE CLICCABILI (Coordinate sistemate!)
    hitboxes: [
        { id: "iaq_score", x: 250, y: 350, w: 400, h: 300 }, // Area centrale dell'arco
        { id: "temperatura", x: 80, y: 940, w: 740, h: 100 },
        { id: "umidita", x: 80, y: 1060, w: 740, h: 100 },
        { id: "rumore", x: 80, y: 1180, w: 740, h: 100 },
        { id: "luce", x: 80, y: 1300, w: 740, h: 100 }
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
        const W = 900, H = 1600;
        ctx.clearRect(0, 0, W, H);

        // --- SFONDO SCURO ---
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, '#0d1f3c');
        bgGrad.addColorStop(0.55, '#0f2d1f');
        bgGrad.addColorStop(1, '#0d1f3c');
        ctx.fillStyle = bgGrad;
        ctx.beginPath(); ctx.roundRect(0, 0, W, H, 50); ctx.fill();

        // Bordo ambra
        ctx.strokeStyle = 'rgba(6,182,212,0.35)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(2, 2, W - 4, H - 4, 49); ctx.stroke();

        // --- HEADER ---
        const titolo = config && config.nome ? config.nome.toUpperCase().replace('_', ' ') : "QUALITÀ DELL'ARIA";
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 54px sans-serif'; ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(6,182,212,0.4)'; ctx.shadowBlur = 12;
        ctx.fillText(titolo, W / 2, 110);
        ctx.shadowBlur = 0;

        // Sottotitolo orario
        ctx.fillStyle = 'rgba(148,163,184,0.85)';
        ctx.font = '34px sans-serif';
        ctx.fillText(dati.testo_aggiornamento, W / 2, 170);

        // Linea separatrice
        ctx.strokeStyle = 'rgba(6,182,212,0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(60, 200); ctx.lineTo(840, 200); ctx.stroke();

        // --- ARCO IAQ (invariato nella logica, restyled) ---
        const cx = 450, cy = 600, radius = 280, thickness = 50;

        // Track di sfondo scuro
        ctx.beginPath();
        ctx.arc(cx, cy, radius, Math.PI, Math.PI * 2);
        ctx.lineWidth = thickness + 10;
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
        ctx.lineTo(raggioInterno - 25, -15);
        ctx.lineTo(raggioInterno - 25, 15);
        ctx.closePath();
        ctx.fillStyle = '#f1f5f9';
        ctx.shadowColor = 'rgba(255,255,255,0.5)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();

        // Anello pulsante attorno all'area score — indica che è tappabile
        ctx.beginPath();
        ctx.arc(cx, cy - 60, 200, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(6,182,212,0.18)';
        ctx.lineWidth = 6;
        ctx.setLineDash([18, 12]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Valore score
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 145px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = colorePunteggio; ctx.shadowBlur = 20;
        ctx.fillText(dati.score.replace('.', ','), cx, 555);
        ctx.shadowBlur = 0;

        // Label qualità
        ctx.fillStyle = colorePunteggio;
        ctx.font = 'bold 44px sans-serif';
        ctx.shadowColor = colorePunteggio; ctx.shadowBlur = 10;
        ctx.fillText(label, cx, 648);
        ctx.shadowBlur = 0;

        // Scale labels
        ctx.fillStyle = 'rgba(148,163,184,0.7)';
        ctx.font = 'bold 32px sans-serif';
        ctx.fillText("1", 170, 700);
        ctx.fillText("10", 732, 700);

        // --- CARD DATI SENSORI ---
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.beginPath(); ctx.roundRect(40, 800, 820, 720, 40); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.10)';
        ctx.lineWidth = 1.5; ctx.stroke();

        // Titolo card
        ctx.fillStyle = 'rgba(6,182,212,0.9)';
        ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('DATI SENSORI AMBIENTALI', 75, 855);
        ctx.fillStyle = 'rgba(6,182,212,0.35)';
        ctx.fillRect(75, 862, 370, 2);

        ctx.textAlign = 'left';

        function drawRigaDato(y, label, valore, unita) {
            const rowTop = y - 70;
            const rowH   = 88;

            // Pill background — richiama un bottone cliccabile
            ctx.fillStyle = 'rgba(6,182,212,0.07)';
            ctx.beginPath(); ctx.roundRect(60, rowTop, 780, rowH, 20); ctx.fill();

            // Bordo sottile cyan — segnala interattività
            ctx.strokeStyle = 'rgba(6,182,212,0.22)';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.roundRect(60, rowTop, 780, rowH, 20); ctx.stroke();

            // Label
            ctx.fillStyle = 'rgba(148,163,184,0.90)';
            ctx.font = '38px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(label, 95, y);

            // Valore
            ctx.fillStyle = '#f1f5f9';
            ctx.font = 'bold 48px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${valore} ${unita}`, 710, y);

            // Pallino verde live indicator
            ctx.fillStyle = '#22c55e';
            ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.arc(760, y - 14, 9, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;

            // Chevron '›' — indica navigabilità/interattività
            ctx.fillStyle = 'rgba(6,182,212,0.65)';
            ctx.font = 'bold 46px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('›', 820, y + 4);

            ctx.textAlign = 'left';
        }

        drawRigaDato(990,  "Temperatura",  dati.temperatura, "°C");
        drawRigaDato(1110, "Umidità",      dati.umidita,     "%");
        drawRigaDato(1230, "Rumore",       dati.rumore,      "dB");
        drawRigaDato(1350, "Illuminamento",dati.luce,        "lux");

        // Footer
        ctx.fillStyle = 'rgba(100,116,139,0.55)';
        ctx.font = '28px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(window.isPinned !== false ? '👆 Tocca una riga o lo score per il dettaglio' : '🔒 Fissa il pannello per interagire', W / 2, 1545);
    }
};