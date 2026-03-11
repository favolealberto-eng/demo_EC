// ==========================================
// TEMPLATE: PANNELLO IAQ (Qualità dell'Aria)
// Risoluzione nativa: 900x1600 (Verticale 9:16)
// ==========================================

const LayoutIAQ = {
    // 1. PARAMETRI DI STRUTTURA (Letti dal Motore Core)
    config: {
        canvasW: 900,
        canvasH: 1600,
        planeW: 2.7,
        planeH: 4.8
    },

    // 2. MAPPA DELLE AREE CLICCABILI (Per il futuro Drill-down)
    hitboxes: [
        { id: "iaq_score", x: 250, y: 350, w: 400, h: 300 }, // Area centrale dell'arco
        { id: "temperatura", x: 80, y: 1000, w: 740, h: 100 },
        { id: "umidita", x: 80, y: 1120, w: 740, h: 100 },
        { id: "rumore", x: 80, y: 1240, w: 740, h: 100 },
        { id: "luce", x: 80, y: 1360, w: 740, h: 100 }
    ],

    // 3. DATABASE FITTIZIO (Simulazione chiamata API)
    fetchDati: function (callback) {
        // Simuliamo un ritardo di rete di 200ms
        setTimeout(() => {
            const mockData = {
                timestamp: new Date(),
                score: (Math.random() * 2 + 7.5).toFixed(1), // Oscilla tra 7.5 e 9.5
                temperatura: (22.5 + Math.random() * 0.5).toFixed(1),
                umidita: (45 + Math.random() * 2).toFixed(0),
                rumore: (40 + Math.random() * 5).toFixed(0),
                luce: (450 + Math.random() * 20).toFixed(0)
            };
            callback(mockData);
        }, 200);
    },

    // 4. MOTORE GRAFICO SPECIFICO
    draw: function (ctx, dati) {
        // --- SFONDO E BORDO ARMONICO ---
        ctx.clearRect(0, 0, 900, 1600);

        ctx.fillStyle = '#f8fafc'; // Bianco "sporco" molto elegante
        ctx.beginPath();
        ctx.roundRect(10, 10, 880, 1580, 50); // Bordo arrotondato
        ctx.fill();

        ctx.strokeStyle = '#cbd5e1'; // Grigio chiaro per il bordo
        ctx.lineWidth = 8;
        ctx.stroke();

        // --- HEADER TITOLETTO ---
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 55px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("Qualità dell'aria", 450, 120);

        // Orario formattato
        const orario = dati.timestamp.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        ctx.fillStyle = '#94a3b8';
        ctx.font = '35px sans-serif';
        ctx.fillText(`Oggi, ${orario}`, 450, 180);

        // --- ACCELEROMETRO (Arco Graduato) ---
        const cx = 450;
        const cy = 600;
        const radius = 280;
        const thickness = 50;

        // Crea il gradiente da 1 (Rosso) a 10 (Verde)
        const gradient = ctx.createConicGradient(Math.PI, cx, cy);
        gradient.addColorStop(0, '#ef4444'); // Rosso
        gradient.addColorStop(0.25, '#f97316'); // Arancio
        gradient.addColorStop(0.5, '#eab308'); // Giallo
        gradient.addColorStop(0.75, '#84cc16'); // Verde chiaro
        gradient.addColorStop(1, '#22c55e'); // Verde scuro

        ctx.beginPath();
        ctx.arc(cx, cy, radius, Math.PI, Math.PI * 2);
        ctx.lineWidth = thickness;
        ctx.strokeStyle = gradient;
        ctx.lineCap = 'round';
        ctx.stroke();

        // --- CALCOLO PUNTEGGIO E COLORI ---
        const scoreNum = parseFloat(dati.score);
        let label = "";
        let colorePunteggio = "";

        if (scoreNum < 3) { label = "SCARSA"; colorePunteggio = "#ef4444"; }
        else if (scoreNum < 5) { label = "ACCETTABILE"; colorePunteggio = "#f97316"; }
        else if (scoreNum < 7) { label = "NELLA MEDIA"; colorePunteggio = "#eab308"; }
        else if (scoreNum < 9) { label = "BUONA"; colorePunteggio = "#84cc16"; }
        else { label = "OTTIMA"; colorePunteggio = "#22c55e"; }

        // --- FRECCIA TRIANGOLARE INTERNA ---
        // Calcola l'angolo in base al punteggio (1 -> 180°, 10 -> 360°)
        const percentuale = (scoreNum - 1) / 9; // Normalizza da 0 a 1
        const angoloFreccia = Math.PI + (percentuale * Math.PI);
        const raggioInterno = radius - (thickness / 2) - 15;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angoloFreccia);

        // Disegna un piccolo triangolo che punta verso l'arco
        ctx.beginPath();
        ctx.moveTo(raggioInterno, 0); // Punta
        ctx.lineTo(raggioInterno - 25, -15); // Base sx
        ctx.lineTo(raggioInterno - 25, 15);  // Base dx
        ctx.closePath();
        ctx.fillStyle = '#64748b';
        ctx.fill();
        ctx.restore();

        // --- TESTO CENTRALE ACCELEROMETRO ---
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 150px sans-serif';
        // Trasforma 9.4 in 9,4 per formattazione italiana
        ctx.fillText(dati.score.replace('.', ','), 450, 550);

        ctx.fillStyle = colorePunteggio;
        ctx.font = 'bold 45px sans-serif';
        ctx.fillText(label, 450, 650);

        // Min e Max (1 e 10) ai bordi dell'arco
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 35px sans-serif';
        ctx.fillText("1", 170, 700);
        ctx.fillText("10", 730, 700);

        // --- CRUSCOTTO INFERIORE (Metriche) ---
        // Box arrotondato bianco per raggruppare i dati
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(50, 850, 800, 650, 40);
        ctx.fill();
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.textAlign = 'left';

        // Funzione helper per disegnare le singole righe di dati
        function drawRigaDato(y, label, valore, unita) {
            // Testo etichetta (sottolineato graficamente per suggerire il click)
            ctx.fillStyle = '#64748b';
            ctx.font = '40px sans-serif';
            ctx.fillText(label, 100, y);

            // Finta sottolineatura
            const labelWidth = ctx.measureText(label).width;
            ctx.fillRect(100, y + 10, labelWidth, 3);

            // Valore e unità a destra
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 50px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${valore} ${unita}`, 740, y);

            // Pallino verde di stato (tutto OK)
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(800, y - 15, 12, 0, Math.PI * 2);
            ctx.fill();

            ctx.textAlign = 'left'; // reset
        }

        drawRigaDato(1000, "Temperatura", dati.temperatura, "°C");
        drawRigaDato(1120, "Umidità", dati.umidita, "%");
        drawRigaDato(1240, "Rumore", dati.rumore, "dB");
        drawRigaDato(1360, "Illuminamento", dati.luce, "lux");
    }
};