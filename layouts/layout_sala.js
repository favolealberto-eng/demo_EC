/**
 * LayoutSala - Modulo di Info-Reception per Sale Riunioni.
 * 
 * Collegato ai sistemi di booking aziendali (simulati). Mostra lo stato in tempo reale
 * (OCCUPATA/LIBERA), la capacità, le dotazioni e permette di lanciare il layout globale
 * "Calendario" iniettando i dati della sala in `index.html`.
 */
window.LayoutSala = {
    config: {
        canvasW: 800, canvasH: 1000, planeW: 2.4, planeH: 3.0
    },

    // La hitbox per il bottone del calendario
    hitboxes: [
        { id: "calendario", x: 50, y: 800, w: 700, h: 120 }
    ],

    /**
     * fetchDati - Motore di simulazione booking. 
     * Ritorna slot calendarizzati ("agendaGiorno" e "agendaSettimana") differenti 
     * a seconda dell'ID sala ('newton' vs altre).
     */
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
            agendaSettimana = {
                "Lunedì": [{ inizio: 9, fine: 11, titolo: "Marketing" }, { inizio: 12, fine: 14.5, titolo: "Riunione CdA" }],
                "Martedì": [{ inizio: 10, fine: 12, titolo: "Call Esterna" }],
                "Mercoledì": [{ inizio: 14, fine: 18, titolo: "Workshop Design" }],
                "Giovedì": [{ inizio: 9, fine: 18, titolo: "Hackathon Interno" }],
                "Venerdì": [{ inizio: 11, fine: 13, titolo: "All Hands" }]
            };
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
            agendaSettimana = {
                "Lunedì": [{ inizio: 8, fine: 10, titolo: "Colloq. HR" }],
                "Martedì": [],
                "Mercoledì": [{ inizio: 14, fine: 15, titolo: "1:1 Manager" }],
                "Giovedì": [{ inizio: 16, fine: 18, titolo: "Corso Sicurezza" }],
                "Venerdì": [{ inizio: 9, fine: 10, titolo: "Sync Team" }]
            };
        }

        datiSala.agendaGiorno = agendaGiorno;
        datiSala.agendaSettimana = agendaSettimana;
        callback(datiSala);
    },
    /**
     * draw - Disegna lo stylesheet AR della Sala Riunioni (Pannello a muro).
     * Mantiene un'estetica minimale per consentire una rapida lettura dello stato (Verde/Rosso).
     */
    draw: function (ctx, dati, config) {
        // Salviamo l'ID per usarlo nel fetchDati
        this.currentIdSala = config.id_sala;

        const W = 800, H = 1000;
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


        // --- SFONDO SCURO PRINCIPALE ---
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, '#0d1f3c');
        bgGrad.addColorStop(0.6, '#0f2d1f');
        bgGrad.addColorStop(1, '#0d1f3c');
        ctx.fillStyle = bgGrad;
        ctx.beginPath(); ctx.roundRect(0, 0, W, H, 40); ctx.fill();

        // Bordo sottile ambra
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(6,182,212,0.35)';
        ctx.beginPath(); ctx.roundRect(2, 2, W - 4, H - 4, 39); ctx.stroke();

        // --- HEADER con gradiente ambra→arancio ---
        const hdrGrad = ctx.createLinearGradient(10, 10, 790, 10);
        hdrGrad.addColorStop(0, '#06b6d4');
        hdrGrad.addColorStop(1, '#0891b2');
        ctx.fillStyle = hdrGrad;
        ctx.beginPath(); ctx.roundRect(10, 10, W - 20, 145, [34, 34, 0, 0]); ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 58px sans-serif'; ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 8;
        ctx.fillText(config.nome.toUpperCase(), 400, 104);
        ctx.shadowBlur = 0;

        // Sottotitolo header
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = '28px sans-serif';
        ctx.fillText('STATO SALA CONFERENZE', 400, 140);

        // --- STATUS BADGE ---
        // Sfondo badge
        ctx.fillStyle = dati.colore + '25';
        ctx.beginPath(); ctx.roundRect(50, 200, 700, 145, 22); ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = dati.colore; ctx.stroke();

        // Pallino stato
        ctx.fillStyle = dati.colore;
        ctx.beginPath(); ctx.arc(110, 265, 22, 0, Math.PI * 2); ctx.fill();
        // Glow
        ctx.shadowColor = dati.colore; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(110, 265, 14, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = dati.colore;
        ctx.font = 'bold 44px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(dati.stato, 155, 278);

        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.font = '33px sans-serif';
        ctx.fillText(dati.messaggio, 155, 325);

        // --- SEPARATORE ---
        ctx.strokeStyle = 'rgba(6,182,212,0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(50, 380); ctx.lineTo(750, 380); ctx.stroke();

        // --- SEZIONE INFO ---
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(6,182,212,0.85)';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText('INFO SALA', 50, 430);
        // Underline
        ctx.fillStyle = 'rgba(6,182,212,0.4)';
        ctx.fillRect(50, 438, 160, 3);

        // Card info
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.beginPath(); ctx.roundRect(50, 455, 700, 310, 18); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.10)';
        ctx.lineWidth = 1.5; ctx.stroke();

        ctx.fillStyle = '#f1f5f9';
        ctx.font = '38px sans-serif';
        ctx.fillText(`👥  Capienza: ${dati.posti} posti a sedere`, 80, 515);

        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(80, 535, 640, 1);

        dati.dotazioni.forEach((dot, index) => {
            ctx.fillStyle = '#cbd5e1';
            ctx.font = '36px sans-serif';
            ctx.fillText(dot, 80, 590 + (index * 58));
        });

        // --- SEPARATORE ---
        ctx.strokeStyle = 'rgba(6,182,212,0.20)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(50, 788); ctx.lineTo(750, 788); ctx.stroke();

        // --- BOTTONE CALENDARIO (brand gradient) ---
        const btnY = 810;
        const btnGrad = ctx.createLinearGradient(50, btnY, 750, btnY);
        btnGrad.addColorStop(0, '#06b6d4');
        btnGrad.addColorStop(1, '#0891b2');
        ctx.fillStyle = btnGrad;

        const isPinnedCal = window.isPinned;
        if (!isPinnedCal) ctx.globalAlpha = 0.4;

        ctx.beginPath(); ctx.roundRect(50, btnY, 700, 118, 20); ctx.fill();

        // Glow del bottone
        ctx.shadowColor = 'rgba(6,182,212,0.45)';
        ctx.shadowBlur = 22;
        ctx.beginPath(); ctx.roundRect(50, btnY, 700, 118, 20); ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 6;
        ctx.fillText(isPinnedCal ? '📅  APRI CALENDARIO' : '🔒 APRI CALENDARIO', 400, btnY + 73);
        ctx.shadowBlur = 0;

        if (!isPinnedCal) ctx.globalAlpha = 1.0;
    }
};