window.LayoutSala = {
    config: {
        canvasW: 800, canvasH: 1000, planeW: 2.4, planeH: 3.0
    },

    // La hitbox per il bottone del calendario
    hitboxes: [
        { id: "calendario", x: 50, y: 800, w: 700, h: 120 }
    ],

    fetchDati: function (callback) {
        // Simuliamo i dati in base a quale sala stiamo inquadrando
        let datiSala = {};

        // I dati per il calendario (orari dalle 8 alle 18)
        let agendaGiorno = [];
        let agendaSettimana = [];

        // Generiamo dati diversi per le due sale
        let idSala = window.currentConfig ? window.currentConfig.id_sala : null;
        if (idSala === "newton") {
            datiSala = {
                stato: "OCCUPATA",
                messaggio: "Occupata fino alle 14:30",
                colore: "#ef4444", // Rosso
                posti: 12,
                dotazioni: ["📺 Schermo 75\"", "📹 Videoconferenza", "🛜 Wi-Fi Ospiti"]
            };
            agendaGiorno = [
                { inizio: 9, fine: 11, titolo: "Allineamento Marketing" },
                { inizio: 12, fine: 14.5, titolo: "Riunione CdA" }, // 14.5 = 14:30
                { inizio: 16, fine: 18, titolo: "Brainstorming" }
            ];
        } else {
            datiSala = {
                stato: "LIBERA",
                messaggio: "Libera fino alle 15:00",
                colore: "#22c55e", // Verde
                posti: 4,
                dotazioni: ["📝 Lavagna", "🛜 Wi-Fi"]
            };
            agendaGiorno = [
                { inizio: 8, fine: 10, titolo: "Colloqui HR" },
                { inizio: 15, fine: 16, titolo: "Call Cliente" }
            ];
        }

        datiSala.agendaGiorno = agendaGiorno;
        callback(datiSala);
    },

    draw: function (ctx, dati, config) {
        // Salviamo l'ID per usarlo nel fetchDati
        this.currentIdSala = config.id_sala;

        ctx.clearRect(0, 0, 800, 1000);

        // Sfondo principale (Bianco arrotondato con ombra)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.roundRect(10, 10, 780, 980, 40); ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = '#e2e8f0'; ctx.stroke();

        // Header (Nome Sala)
        ctx.fillStyle = '#0f172a';
        ctx.beginPath(); ctx.roundRect(10, 10, 780, 150, [40, 40, 0, 0]); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 60px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(config.nome.toUpperCase(), 400, 105);

        // Status Badge (Libera/Occupata)
        ctx.fillStyle = dati.colore + "22"; // Sfondo leggero trasparente
        ctx.beginPath(); ctx.roundRect(50, 200, 700, 150, 20); ctx.fill();
        ctx.lineWidth = 6; ctx.strokeStyle = dati.colore; ctx.stroke();

        ctx.fillStyle = dati.colore;
        ctx.font = 'bold 45px sans-serif';
        ctx.fillText(dati.stato, 400, 265);
        ctx.fillStyle = '#334155';
        ctx.font = '35px sans-serif';
        ctx.fillText(dati.messaggio, 400, 320);

        // Info Sala (Posti e Dotazioni)
        ctx.textAlign = 'left';
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 35px sans-serif';
        ctx.fillText("INFO SALA", 50, 430);
        ctx.fillRect(50, 445, 180, 4);

        ctx.fillStyle = '#0f172a';
        ctx.font = '40px sans-serif';
        ctx.fillText(`👥 Capienza: ${dati.posti} posti a sedere`, 50, 520);

        dati.dotazioni.forEach((dot, index) => {
            ctx.fillText(dot, 50, 590 + (index * 60));
        });

        // Bottone Apri Calendario (Simulato nel Canvas)
        const btnY = 800;
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath(); ctx.roundRect(50, btnY, 700, 120, 20); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText("📅 APRI CALENDARIO", 400, btnY + 75);
    }
};