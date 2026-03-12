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
        ctx.clearRect(0, 0, 900, 1600);

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.roundRect(10, 10, 880, 1580, 50);
        ctx.fill();

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 8;
        ctx.stroke();

        ctx.fillStyle = '#334155';
        ctx.font = 'bold 55px sans-serif';
        ctx.textAlign = 'center';

        const titolo = config && config.nome ? config.nome.toUpperCase().replace('_', ' ') : "QUALITÀ DELL'ARIA";
        ctx.fillText(titolo, 450, 120);

        const orario = dati.timestamp.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        ctx.fillStyle = '#94a3b8';
        ctx.font = '35px sans-serif';
        ctx.fillText(`Oggi, ${orario}`, 450, 180);

        const cx = 450;
        const cy = 600;
        const radius = 280;
        const thickness = 50;

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

        const scoreNum = parseFloat(dati.score);
        let label = "";
        let colorePunteggio = "";

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
        ctx.fillStyle = '#64748b';
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 150px sans-serif';
        ctx.fillText(dati.score.replace('.', ','), 450, 550);

        ctx.fillStyle = colorePunteggio;
        ctx.font = 'bold 45px sans-serif';
        ctx.fillText(label, 450, 650);

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 35px sans-serif';
        ctx.fillText("1", 170, 700);
        ctx.fillText("10", 730, 700);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(50, 850, 800, 650, 40);
        ctx.fill();
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.textAlign = 'left';

        function drawRigaDato(y, label, valore, unita) {
            ctx.fillStyle = '#64748b';
            ctx.font = '40px sans-serif';
            ctx.fillText(label, 100, y);

            const labelWidth = ctx.measureText(label).width;
            ctx.fillRect(100, y + 10, labelWidth, 3);

            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 50px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${valore} ${unita}`, 740, y);

            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(800, y - 15, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.textAlign = 'left';
        }

        drawRigaDato(1000, "Temperatura", dati.temperatura, "°C");
        drawRigaDato(1120, "Umidità", dati.umidita, "%");
        drawRigaDato(1240, "Rumore", dati.rumore, "dB");
        drawRigaDato(1360, "Illuminamento", dati.luce, "lux");
    }
};