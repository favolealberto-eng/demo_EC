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
            // Simuliamo lo stato in base al nome (o a un id reale se ci fosse)
            // Lo passeremo tramite config nel 'draw' per semplicità, 
            // ma qui possiamo restituire i dati del cartellino
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
        // --- SFONDO E BORDO ---
        ctx.clearRect(0, 0, 1600, 900);

        ctx.fillStyle = '#f8fafc'; // Bianco
        ctx.beginPath();
        ctx.roundRect(10, 10, 1580, 880, 40);
        ctx.fill();

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 8;
        ctx.stroke();

        // --- CALCOLO STATO (Verde = OK, Giallo = In Scadenza, Rosso = Scaduto) ---
        // Usiamo un trucco: deduciamo lo stato fittizio dal nome configurato,
        // così generiamo i 3 casi richiesti senza complicare la finta API.
        const nomeUpper = config && config.nome ? config.nome.toUpperCase() : "ESTINTORE";

        let statoColore = "#22c55e"; // Verde (OK)
        let testoStato = "REGOLARE";
        let dateColorBase = "#0f172a";

        if (nomeUpper.includes("UFFICIO 2")) {
            statoColore = "#eab308"; // Giallo (In scadenza)
            testoStato = "SCADENZA IMMINENTE";
            dati.scadenza_polvere = "10/04/2026"; // Mettiamola vicina
            dateColorBase = "#ca8a04";
        } else if (nomeUpper.includes("UFFICIO 3")) {
            statoColore = "#ef4444"; // Rosso (Scaduto)
            testoStato = "MANUTENZIONE SCADUTA";
            dati.scadenza_polvere = "15/01/2025"; // Passata
            dati.pressione_ok = false;
            dateColorBase = "#dc2626";
        }

        // --- HEADER TITOLETTO ---
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 60px sans-serif';
        ctx.textAlign = 'left';

        const titolo = "ESTINTORE: " + nomeUpper;
        ctx.fillText(titolo, 80, 120);

        // BOLLINO DI STATO (In alto a destra)
        ctx.fillStyle = statoColore;
        ctx.beginPath();
        ctx.arc(1450, 100, 30, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = statoColore;
        ctx.font = 'bold 35px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(testoStato, 1400, 115);

        // --- LINEA SEPARATRICE ---
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(80, 170);
        ctx.lineTo(1520, 170);
        ctx.stroke();

        // --- COLONNA SINISTRA: DATE IMPORTANTI E DATI ---
        ctx.textAlign = 'left';
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 45px sans-serif';
        ctx.fillText("PIANO MANUTENTIVO", 80, 260);

        ctx.font = '40px sans-serif';
        ctx.fillText("Prossima Revisione Polvere:", 80, 350);
        ctx.fillText("Prossimo Collaudo Bombola:", 80, 450);
        ctx.fillText("Ultima Ispezione Visiva:", 80, 550);
        ctx.fillText("Tecnico Assegnato:", 80, 650);

        ctx.fillStyle = dateColorBase;
        ctx.font = 'bold 45px monospace';
        ctx.fillText(dati.scadenza_polvere, 700, 350);

        ctx.fillStyle = '#0f172a';
        ctx.fillText(dati.scadenza_collaudo, 700, 450);
        ctx.fillText(dati.ultima_revisione, 700, 550);
        ctx.fillText(dati.tecnico, 700, 650);

        // --- COLONNA DESTRA: CHECKLIST ---
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.roundRect(1000, 220, 520, 500, 20);
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#334155';
        ctx.font = 'bold 40px sans-serif';
        ctx.fillText("CHECKLIST ISPEZIONE", 1040, 290);

        // Funzione helper per le checkbox
        function drawCheckItem(y, testo, superato) {
            // Box
            ctx.fillStyle = superato ? '#22c55e' : '#ef4444';
            ctx.beginPath();
            ctx.roundRect(1040, y, 40, 40, 8);
            ctx.fill();

            // Spunta/X
            ctx.fillStyle = 'white';
            ctx.font = 'bold 35px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(superato ? "✓" : "✗", 1060, y + 32);

            // Testo
            ctx.textAlign = 'left';
            ctx.fillStyle = '#475569';
            ctx.font = '35px sans-serif';
            ctx.fillText(testo, 1100, y + 32);
        }

        drawCheckItem(360, "Pressione Manometro OK", dati.pressione_ok);
        drawCheckItem(460, "Sigillo Sicurezza Integro", dati.sigillo_integro);
        drawCheckItem(560, "Tubo e Lancia Intatti", dati.tubo_ok);

        // Footer QR / ID Finto
        ctx.fillStyle = '#94a3b8';
        ctx.font = '30px monospace';
        ctx.textAlign = 'right';
        ctx.fillText("ID ASSET: EXT-" + Math.floor(Math.random() * 9000 + 1000), 1520, 840);
        ctx.textAlign = 'left';
        ctx.fillText("Ultimo agg.: " + new Date().toLocaleTimeString(), 80, 840);
    }
};
