// ==========================================
// TEMPLATE: PANNELLO IAQ (Qualità dell'Aria)
// Risoluzione nativa: 900x1600 (Verticale 9:16)
// ==========================================

window.LayoutIAQ = {
    // 1. PARAMETRI DI STRUTTURA
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

    // 3. DATABASE FITTIZIO (Simulazione chiamata API)
    fetchDati: function (callback) {
        setTimeout(() => {
            const mockData = {
                timestamp: new Date(),
                score: (Math.random() * 2 + 7.5).toFixed(1),
                temperatura: (22.5 + Math.random() * 0.5).toFixed(1),
                umidita: (45 + Math.random() * 2).toFixed(0),
                rumore: (40 + Math.random() * 5).toFixed(0),
                luce: (450 + Math.random() * 20).toFixed(0)
            };
            callback(mockData);
        }, 200);
    },

    // 4. MOTORE GRAFICO SPECIFICO
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
        ctx.strokeStyle = 'rgba(245,158,11,0.35)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(2, 2, W - 4, H - 4, 49); ctx.stroke();

        // --- HEADER ---
        const titolo = config && config.nome ? config.nome.toUpperCase().replace('_', ' ') : "QUALITÀ DELL'ARIA";
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 54px sans-serif'; ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(245,158,11,0.4)'; ctx.shadowBlur = 12;
        ctx.fillText(titolo, W / 2, 110);
        ctx.shadowBlur = 0;

        // Sottotitolo orario
        const orario = dati.timestamp.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        ctx.fillStyle = 'rgba(148,163,184,0.85)';
        ctx.font = '34px sans-serif';
        ctx.fillText(`Aggiornato: ${orario}`, W / 2, 170);

        // Linea separatrice
        ctx.strokeStyle = 'rgba(245,158,11,0.25)';
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
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.beginPath(); ctx.roundRect(40, 800, 820, 720, 40); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.10)';
        ctx.lineWidth = 1.5; ctx.stroke();

        // Titolo card
        ctx.fillStyle = 'rgba(245,158,11,0.9)';
        ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('DATI SENSORI AMBIENTALI', 75, 855);
        ctx.fillStyle = 'rgba(245,158,11,0.35)';
        ctx.fillRect(75, 862, 370, 2);

        ctx.textAlign = 'left';

        function drawRigaDato(y, label, valore, unita) {
            // Separatore riga
            ctx.strokeStyle = 'rgba(255,255,255,0.07)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(75, y - 28); ctx.lineTo(825, y - 28); ctx.stroke();

            // Label
            ctx.fillStyle = 'rgba(148,163,184,0.85)';
            ctx.font = '38px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(label, 90, y);

            // Valore
            ctx.fillStyle = '#f1f5f9';
            ctx.font = 'bold 48px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${valore} ${unita}`, 750, y);

            // Pallino verde live indicator
            ctx.fillStyle = '#22c55e';
            ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.arc(810, y - 14, 10, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.textAlign = 'left';
        }

        drawRigaDato(990,  "Temperatura",  dati.temperatura, "°C");
        drawRigaDato(1110, "Umidità",      dati.umidita,     "%");
        drawRigaDato(1230, "Rumore",       dati.rumore,      "dB");
        drawRigaDato(1350, "Illuminamento",dati.luce,        "lux");

        // Footer
        ctx.fillStyle = 'rgba(100,116,139,0.5)';
        ctx.font = '26px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Tocca una riga per il dettaglio storico', W / 2, 1545);
    }
};