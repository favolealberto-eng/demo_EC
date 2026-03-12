window.LayoutEstintore = {
    // 1. PARAMETRI DI STRUTTURA (Orizzontale)
    config: {
        canvasW: 1600,
        canvasH: 900,
        planeW: 4.8,
        planeH: 2.7
    },

    hitboxes: [], // Nessuna interazione complessa per ora

    // 2. RECUPERO DATI (Simulazione)
    fetchDati: function (callback) {
        setTimeout(() => {
            callback({
                scadenza_polvere: "15/10/2026",
                scadenza_collaudo: "15/10/2032",
                ultima_revisione: "15/04/2023",
                tecnico: "Mario Rossi",
                pressione_ok: true,
                sigillo_integro: true,
                tubo_ok: true
            });
        }, 100);
    },

    // 3. DISEGNO DEL CARTELLINO MANUTENZIONE
    draw: function (ctx, dati, config) {
        const W = 1600, H = 900;
        ctx.clearRect(0, 0, W, H);

        // --- SFONDO SCURO ---
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, '#0d1f3c');
        bgGrad.addColorStop(0.5, '#0f2d1f');
        bgGrad.addColorStop(1, '#0d1f3c');
        ctx.fillStyle = bgGrad;
        ctx.beginPath(); ctx.roundRect(0, 0, W, H, 40); ctx.fill();

        // Bordo ambra
        ctx.strokeStyle = 'rgba(245,158,11,0.35)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(2, 2, W - 4, H - 4, 39); ctx.stroke();

        // --- CALCOLO STATO (logica invariata) ---
        const nomeUpper = config && config.nome ? config.nome.toUpperCase() : "ESTINTORE";

        let statoColore = "#22c55e";
        let testoStato = "REGOLARE";
        let dateColorBase = "#f1f5f9";

        if (nomeUpper.includes("UFFICIO 2")) {
            statoColore = "#eab308";
            testoStato = "SCADENZA IMMINENTE";
            dati.scadenza_polvere = "10/04/2026";
            dateColorBase = "#fde68a";
        } else if (nomeUpper.includes("UFFICIO 3")) {
            statoColore = "#ef4444";
            testoStato = "MANUTENZIONE SCADUTA";
            dati.scadenza_polvere = "15/01/2025";
            dati.pressione_ok = false;
            dateColorBase = "#fca5a5";
        }

        // --- HEADER STRIP con gradiente ambra→arancio ---
        const hdrGrad = ctx.createLinearGradient(10, 10, 1590, 10);
        hdrGrad.addColorStop(0, '#f59e0b');
        hdrGrad.addColorStop(1, '#ea580c');
        ctx.fillStyle = hdrGrad;
        ctx.beginPath(); ctx.roundRect(10, 10, W - 20, 120, [30, 30, 0, 0]); ctx.fill();

        // Titolo header
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 58px sans-serif'; ctx.textAlign = 'left';
        ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 8;
        ctx.fillText("ESTINTORE: " + nomeUpper, 70, 96);
        ctx.shadowBlur = 0;

        // Bollino stato (in alto a destra, con glow)
        ctx.fillStyle = statoColore;
        ctx.shadowColor = statoColore; ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.arc(1450, 70, 28, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = statoColore;
        ctx.font = 'bold 34px sans-serif'; ctx.textAlign = 'right';
        ctx.shadowColor = statoColore; ctx.shadowBlur = 8;
        ctx.fillText(testoStato, 1400, 82);
        ctx.shadowBlur = 0;

        // --- LINEA SEPARATRICE ---
        ctx.strokeStyle = 'rgba(245,158,11,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(60, 155); ctx.lineTo(1540, 155); ctx.stroke();

        // --- COLONNA SINISTRA: PIANO MANUTENTIVO ---
        // Label sezione
        ctx.fillStyle = 'rgba(245,158,11,0.9)';
        ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText("PIANO MANUTENTIVO", 70, 235);
        ctx.fillStyle = 'rgba(245,158,11,0.35)';
        ctx.fillRect(70, 242, 330, 3);

        // Righe dati
        function drawDataRow(y, labelTxt, valueTxt, valueColor) {
            // Separatore
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(70, y - 35); ctx.lineTo(940, y - 35); ctx.stroke();

            ctx.fillStyle = 'rgba(148,163,184,0.8)';
            ctx.font = '38px sans-serif'; ctx.textAlign = 'left';
            ctx.fillText(labelTxt, 70, y);

            ctx.fillStyle = valueColor || '#f1f5f9';
            ctx.font = 'bold 42px monospace'; ctx.textAlign = 'left';
            ctx.fillText(valueTxt, 680, y);
        }

        drawDataRow(330, "Prossima Revisione Polvere:", dati.scadenza_polvere, dateColorBase);
        drawDataRow(430, "Prossimo Collaudo Bombola:", dati.scadenza_collaudo, '#f1f5f9');
        drawDataRow(530, "Ultima Ispezione Visiva:", dati.ultima_revisione, '#f1f5f9');
        drawDataRow(630, "Tecnico Assegnato:", dati.tecnico, '#f1f5f9');

        // --- COLONNA DESTRA: CHECKLIST ---
        // Card checklist
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.beginPath(); ctx.roundRect(990, 185, 560, 550, 22); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.10)';
        ctx.lineWidth = 1.5; ctx.stroke();

        // Titolo checklist
        ctx.fillStyle = 'rgba(245,158,11,0.9)';
        ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText("CHECKLIST ISPEZIONE", 1020, 252);
        ctx.fillStyle = 'rgba(245,158,11,0.35)';
        ctx.fillRect(1020, 258, 320, 2);

        // Funzione helper checkbox (logica invariata)
        function drawCheckItem(y, testo, superato) {
            // Separatore riga
            ctx.strokeStyle = 'rgba(255,255,255,0.07)';
            ctx.lineWidth = 1;
            if (y > 310) { ctx.beginPath(); ctx.moveTo(1020, y - 30); ctx.lineTo(1520, y - 30); ctx.stroke(); }

            // Box colorato con glow
            const colore = superato ? '#22c55e' : '#ef4444';
            ctx.fillStyle = colore;
            ctx.shadowColor = colore; ctx.shadowBlur = 12;
            ctx.beginPath(); ctx.roundRect(1030, y - 4, 42, 42, 10); ctx.fill();
            ctx.shadowBlur = 0;

            // Spunta/X
            ctx.fillStyle = 'white';
            ctx.font = 'bold 32px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(superato ? "✓" : "✗", 1051, y + 30);

            // Testo
            ctx.textAlign = 'left';
            ctx.fillStyle = '#cbd5e1';
            ctx.font = '34px sans-serif';
            ctx.fillText(testo, 1090, y + 30);
        }

        drawCheckItem(330, "Pressione Manometro OK",     dati.pressione_ok);
        drawCheckItem(430, "Sigillo Sicurezza Integro",  dati.sigillo_integro);
        drawCheckItem(530, "Tubo e Lancia Intatti",      dati.tubo_ok);

        // --- FOOTER ---
        ctx.strokeStyle = 'rgba(245,158,11,0.20)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(60, 775); ctx.lineTo(1540, 775); ctx.stroke();

        ctx.fillStyle = 'rgba(100,116,139,0.6)';
        ctx.font = '28px monospace'; ctx.textAlign = 'right';
        ctx.fillText("ID ASSET: EXT-" + Math.floor(Math.random() * 9000 + 1000), 1540, 825);
        ctx.textAlign = 'left';
        ctx.fillText("Ultimo agg.: " + new Date().toLocaleTimeString(), 70, 825);
    }
};
