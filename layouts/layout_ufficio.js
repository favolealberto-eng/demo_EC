/**
 * LayoutUfficio - Directory e Smart-Working Router.
 * 
 * Pannello dedicato all'identificazione degli uffici. Mostra:
 * - Orari flessibili ed effettivi di apertura settimanale
 * - Elenco dei dipendenti assegnati con Ruolo e Avatar
 * - Pulsanti d'interazione rapida per chiamare il Calendario di ogni singolo dipendente
 *   o per generare un link mail to: precompilato.
 */
window.LayoutUfficio = {
    config: {
        canvasW: 800, canvasH: 1100, planeW: 2.4, planeH: 3.3
    },

    vistaCorrente: 'main',
    hitboxes: [],

    /**
     * fetchDati - Simula la connessione al database HR.
     * Calcola gli orari d'apertura dinamicamente rispetto al current Date e 
     * popola gli array delle Agende personali dei dipendenti.
     */
    fetchDati: function (callback) {
        const giorniNomi = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
        const todayIdx = new Date().getDay();
        
        const formatOrari = (idx) => {
            if (idx === 0 || idx === 6) return "Chiuso";
            if (idx === 5) return "08:30 - 12:30"; // Venerdì solo mattina
            return "08:30 - 12:30, 13:30 - 17:30"; // Lun-Gio
        };

        const orari = [];
        for (let i = 0; i < 7; i++) {
            const tempIdx = (todayIdx + i) % 7;
            orari.push({
                giorno: giorniNomi[tempIdx],
                orario: formatOrari(tempIdx),
                isOggi: i === 0
            });
        }

        const dati = {
            id: "UFF-01",
            nome: "Ufficio IT & Sensori",
            luogo: "Piano Principale, Ala Sud",
            orariSettimana: orari,
            persone: [
                {
                    id: "mario",
                    nome: "Ing. Mario Rossi",
                    ruolo: "Area Software",
                    email: "mario.rossi@eurix.com",
                    agendaSettimana: {
                        "Lunedì": [{titolo: "Sviluppo Backend", inizio: 8.5, fine: 12.5}, {titolo: "Riunione Clienti", inizio: 14, fine: 16}],
                        "Martedì": [{titolo: "Code Review", inizio: 9, fine: 11}],
                        "Mercoledì": [{titolo: "Sviluppo AR", inizio: 9, fine: 12.5}, {titolo: "Standup", inizio: 14, fine: 14.5}],
                        "Giovedì": [{titolo: "Test Piattaforma", inizio: 10, fine: 12.5}, {titolo: "Formazione", inizio: 15, fine: 17}],
                        "Venerdì": [{titolo: "Scrum Rétro", inizio: 9, fine: 11.5}]
                    },
                    agendaGiorno: [
                        {titolo: "Scrum e Allineamento", inizio: 9, fine: 10},
                        {titolo: "Sviluppo AR", inizio: 10.5, fine: 12.5}
                    ]
                },
                {
                    id: "luigi",
                    nome: "Geom. Luigi Bianchi",
                    ruolo: "Area Hardware",
                    email: "luigi.bianchi@eurix.com",
                    agendaSettimana: {
                        "Lunedì": [{titolo: "Sopralluogo Impianti", inizio: 8.5, fine: 12}],
                        "Martedì": [{titolo: "Manutenzione Sensori", inizio: 9, fine: 12.5}, {titolo: "Acquisti", inizio: 14, fine: 16}],
                        "Mercoledì": [{titolo: "Installazione", inizio: 10, fine: 12}],
                        "Giovedì": [{titolo: "Calibrazione", inizio: 9, fine: 11.5}],
                        "Venerdì": [{titolo: "Report", inizio: 9, fine: 11}]
                    },
                    agendaGiorno: [
                        {titolo: "Controllo Sensori IAQ", inizio: 9.5, fine: 12}
                    ]
                }
            ]
        };
        callback(dati);
    },
    /**
     * processClick - Smistatore di hot-action.
     * Se l'id intercettato è "agenda_*", esegue un overriding della configurazione 
     * globale per passare l'agenda del dipendente specifico all'UI Calendario di index.html.
     * Se l'id è "mail_*", apre il client di posta dell'utente AR.
     */
    processClick: function (id) {
        if (!this.ultimiDati) return;

        if (id.startsWith("agenda_")) {
            const pid = id.replace("agenda_", "");
            const p = this.ultimiDati.persone.find(x => x.id === pid);
            if (p) {
                try {
                    // Update the global calendar store in index.html
                    if (typeof lastFetchedData !== 'undefined') {
                        lastFetchedData.agendaSettimana = p.agendaSettimana;
                        lastFetchedData.agendaGiorno = p.agendaGiorno;

                        // Temporarily hijack the panel name for the calendar header
                        if (typeof currentConfig !== 'undefined' && currentConfig) {
                            this.nomeOriginale = currentConfig.nome;
                            currentConfig.nome = "Agenda: " + p.nome;
                        }

                        if (typeof apriCalendario === 'function') {
                            apriCalendario();
                            
                            // Restore original name after calendar pulls it asynchronously/synchronously
                            setTimeout(() => {
                                if (typeof currentConfig !== 'undefined' && currentConfig && this.nomeOriginale) {
                                    currentConfig.nome = this.nomeOriginale;
                                }
                            }, 500);
                        }
                    }
                } catch(e) {
                    console.error("Errore apertura agenda", e);
                }
            }
        } else if (id.startsWith("mail_")) {
            const pid = id.replace("mail_", "");
            const p = this.ultimiDati.persone.find(x => x.id === pid);
            if (p) {
                window.location.href = `mailto:${p.email}?subject=Richiesta appuntamento con ${p.nome}&body=Gentile ${p.nome},%0A%0ACon la presente desidero richiedere un appuntamento online presso l'Ufficio Tecnico nei seguenti orari disponibili a calendario:%0A%0A- [Inserire orario preferito]%0A%0AGrazie e cordiali saluti.`;
            }
        }
    },
    /**
     * draw - Logic & Render Method.
     * Oltre al disegno Canvas, istruisce e dimensiona costantemente l'array `hitboxes`
     * basandosi sul numero di dipendenti attivi restituiti dalla fetchDati.
     */
    draw: function (ctx, dati, config) {
        this.ultimoCtx = ctx;
        this.ultimiDati = dati;
        this.ultimoConfig = config;

        // Create hitboxes for contacts
        this.hitboxes = [];
        dati.persone.forEach((p, idx) => {
            const y = 630 + (idx * 210);
            const btnAy = y + 120;
            this.hitboxes.push(
                { id: "agenda_" + p.id, x: 170, y: btnAy, w: 260, h: 50 },
                { id: "mail_" + p.id, x: 450, y: btnAy, w: 260, h: 50 }
            );
        });

        // Fallback robustezza per bug scomparsa
        try {
            if (typeof currentMarkerId !== 'undefined' && currentMarkerId !== null) {
                const c3d = document.getElementById('content-' + currentMarkerId);
                if (c3d && typeof isPinned !== 'undefined' && !isPinned) {
                    c3d.setAttribute('visible', 'true');
                }
            }
        } catch(e) {}

        ctx.clearRect(0, 0, 800, 1100);

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


        // SFONDO SCURO GLASSMORPHISM
        const W = 800; const H = 1100;
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, 'rgba(13, 31, 60, 0.97)');
        bgGrad.addColorStop(0.5, 'rgba(15, 45, 31, 0.97)');
        bgGrad.addColorStop(1, 'rgba(13, 31, 60, 0.97)');
        ctx.fillStyle = bgGrad;
        ctx.beginPath(); ctx.roundRect(0, 0, W, H, 40); ctx.fill();

        // Bordo azzurro/ambra esterno
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.roundRect(2, 2, W - 4, H - 4, 38); ctx.stroke();

        // HEADER
        const hdrGrad = ctx.createLinearGradient(10, 10, W - 10, 10);
        hdrGrad.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
        hdrGrad.addColorStop(1, 'rgba(8, 145, 178, 0.2)');
        ctx.fillStyle = hdrGrad;
        ctx.beginPath(); ctx.roundRect(0, 0, W, 130, { tl: 40, tr: 40, bl: 0, br: 0 }); ctx.fill();

        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 38px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 8;
        ctx.fillText(`${dati.nome}`, 400, 70);
        ctx.shadowBlur = 0;

        ctx.font = '24px Inter, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(dati.luogo.toUpperCase(), 400, 110);

        // Linea separatrice bottom header
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.beginPath(); ctx.moveTo(0, 130); ctx.lineTo(W, 130); ctx.stroke();

        // Ora e data in tempo reale
        const now = new Date();
        const hr = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const sec = String(now.getSeconds()).padStart(2, '0');
        const g = String(now.getDate()).padStart(2, '0');
        const mo = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        
        ctx.textAlign = 'right';
        ctx.font = '500 16px Inter, sans-serif';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
        ctx.fillText(`Dati Live: ${g}/${mo}/${year} ${hr}:${min}:${sec}`, 760, 155);

        // ORARI
        const oggi = dati.orariSettimana[0];
        
        ctx.textAlign = 'left';
        ctx.fillStyle = '#f1f5f9'; ctx.font = 'bold 30px Inter';
        ctx.fillText(`Orari per ${oggi.giorno}:`, 40, 200);
        
        ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 36px Inter';
        ctx.fillText(oggi.orario, 40, 245);

        ctx.fillStyle = 'rgba(6,182,212,0.35)';
        ctx.fillRect(40, 275, 720, 3);
        
        // ALTRI GIORNI
        for (let i = 1; i < 7; i++) {
            const gg = dati.orariSettimana[i];
            const y = 320 + ((i-1) * 36);
            ctx.fillStyle = 'rgba(148,163,184,0.9)'; ctx.font = '22px Inter';
            ctx.fillText(gg.giorno, 40, y);
            
            ctx.textAlign = 'right';
            if (gg.orario === "Chiuso") {
                ctx.fillStyle = '#ef4444';
                ctx.font = 'bold 22px Inter';
            } else {
                ctx.fillStyle = '#f1f5f9';
                ctx.font = '22px Inter';
            }
            ctx.fillText(gg.orario, 760, y);
            ctx.textAlign = 'left';
        }

        // CONTATTI DEL PERSONALE
        ctx.fillStyle = 'rgba(6,182,212,0.9)';
        ctx.font = 'bold 28px Inter';
        ctx.fillText("TEAM E CONTATTI REPARTO", 40, 580);
        ctx.fillStyle = 'rgba(6,182,212,0.35)';
        ctx.fillRect(40, 595, 380, 3);

        const cardH = 190;
        dati.persone.forEach((p, idx) => {
            const y = 630 + (idx * (cardH + 20));
            
            // Sfondo card contatto
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.beginPath(); ctx.roundRect(40, y, 720, cardH, 20); ctx.fill();
            ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.stroke();

            // Avatar cerchio
            ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
            ctx.beginPath(); ctx.arc(100, y + 65, 45, 0, 2*Math.PI); ctx.fill();
            ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)'; ctx.stroke();
            
            ctx.fillStyle = '#f1f5f9'; ctx.font = 'bold 38px Inter'; ctx.textAlign = 'center';
            const iniziali = p.nome.split(" ").map(n => n.charAt(0)).slice(-2).join("").toUpperCase();
            ctx.fillText(iniziali, 100, y + 78);

            // Testo
            ctx.textAlign = 'left';
            ctx.fillStyle = '#f1f5f9'; ctx.font = 'bold 26px Inter';
            ctx.fillText(p.nome, 170, y + 55);
            ctx.fillStyle = '#94a3b8'; ctx.font = '22px Inter';
            ctx.fillText(p.ruolo, 170, y + 85);

            // PULSANTI AZIONE (i loro hitbox corrispondono a questi disegni)
            const btnAy = y + 120;
            
            const isPinnedUff = window.isPinned;
            if (!isPinnedUff) ctx.globalAlpha = 0.4;

            // Pulsante Agenda
            ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
            ctx.beginPath(); ctx.roundRect(170, btnAy, 260, 50, 10); ctx.fill();
            ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)'; ctx.stroke();
            
            ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 18px Inter'; ctx.textAlign = 'center';
            ctx.fillText(isPinnedUff ? "📅 AGENDA PERSONALE" : "🔒 AGENDA PERSONALE", 300, btnAy + 32);

            // Pulsante Mail
            ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
            ctx.beginPath(); ctx.roundRect(450, btnAy, 260, 50, 10); ctx.fill();
            ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)'; ctx.stroke();
            
            ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 18px Inter'; ctx.textAlign = 'center';
            ctx.fillText(isPinnedUff ? "✉ CHIEDI APPUNTAMENTO" : "🔒 CHIEDI APPUNTAMENTO", 580, btnAy + 32);

            if (!isPinnedUff) ctx.globalAlpha = 1.0;
        });
    }
};
