window.LayoutPompa = {
    config: {
        canvasW: 800, canvasH: 1100, planeW: 2.4, planeH: 3.3
    },

    // Stato interno del pannello (main o dettaglio)
    vistaCorrente: 'main',
    immaginiCaricate: {},

    // Le hitbox variano a seconda della vista
    hitboxes: [
        { id: "step_0", x: 40, y: 480, w: 720, h: 70 },
        { id: "step_1", x: 40, y: 560, w: 720, h: 70 },
        { id: "step_2", x: 40, y: 640, w: 720, h: 70 },
        { id: "step_3", x: 40, y: 720, w: 720, h: 70 },
        { id: "assistenza", x: 40, y: 950, w: 720, h: 100 },
        { id: "back_pompa", x: 40, y: 950, w: 720, h: 100 } // Sovrapposto, usato nel dettaglio
    ],

    fetchDati: function (callback) {
        const datiPompa = {
            id: "PMP-7822",
            nome: "Pompa Centrifuga",
            luogo: "Sala Macchine B",

            // Valori [Attuale, Nominale, Stato] (Stato: 0=OK, 1=Warning, 2=Allarme)
            parametri: [
                { nome: "Portata (Q)", att: 85, nom: 120, unita: "m³/h", stato: 2 },
                { nome: "Prevalenza (H)", att: 32, nom: 45, unita: "m", stato: 2 },
                { nome: "Pressione (P)", att: 3.0, nom: 4.5, unita: "bar", stato: 2 },
                { nome: "Potenza (P.att)", att: 14.2, nom: 18.5, unita: "kW", stato: 1 },
                { nome: "Cos φ", att: 0.72, nom: 0.85, unita: "", stato: 1 }
            ],

            checklist: [
                {
                    id: "step_0",
                    titolo: "1. Controllo Filtro a Y (Aspirazione)",
                    desc: "Verificare l'indicatore di intasamento del filtro a Y. Se la pressione a valle del filtro è < 0.5 bar, procedere alla pulizia della rete metallica interna.",
                    imgFile: "images/pompa/schema_filtro.png" // Nome dell'immagine che creerai
                },
                {
                    id: "step_1",
                    titolo: "2. Ispezione Tenuta Meccanica",
                    desc: "Ricerca di perdite di fluido dal corpo pompa. Una gocciolatura superiore a 10 gocce/minuto indica un'usura eccessiva degli anelli di tenuta.",
                    imgFile: "images/pompa/schema_tenuta.png"
                },
                {
                    id: "step_2",
                    titolo: "3. Verifica Valvola di Intercettazione",
                    desc: "Assicurarsi che la valvola a farfalla sulla mandata sia aperta al 100%. Una chiusura parziale accidentale genera caduta di prevalenza.",
                    imgFile: "images/pompa/schema_valvola.png"
                },
                {
                    id: "step_3",
                    titolo: "4. Controllo Giunti e Collettore",
                    desc: "Verificare il serraggio dei bulloni sui giunti antivibranti in aspirazione per escludere infiltrazioni d'aria che causano cavitazione.",
                    imgFile: "images/pompa/schema_giunto.png"
                }
            ]
        };

        // Pre-caricamento base per le immagini se servono
        datiPompa.checklist.forEach(step => {
            if (!this.immaginiCaricate[step.id]) {
                const img = new Image();
                img.src = step.imgFile; // Cerca l'immagine nella cartella
                this.immaginiCaricate[step.id] = img;
            }
        });

        callback(datiPompa);
    },

    // Funzione che gestisce i click interni di questo layout
    processClick: function (id) {
        if (id.startsWith("step_")) {
            this.vistaCorrente = id;
        } else if (id === "back_pompa") {
            this.vistaCorrente = "main";
        } else if (id === "assistenza") {
            // Apre il client di posta
            window.location.href = `mailto:assistenza@eurix.com?subject=Richiesta assistenza per pompa PMP-7822&body=Segnalazione anomalia su pompa centrifuga in Sala Macchine B. Portata e Prevalenza sotto i valori nominali. Richiesto intervento tecnico.`;
        }
    },

    draw: function (ctx, dati, config) {
        ctx.clearRect(0, 0, 800, 1100);

        // Sfondo principale arrotondato
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.roundRect(10, 10, 780, 1080, 40); ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = '#e2e8f0'; ctx.stroke();

        // HEADER (Titolo)
        ctx.fillStyle = '#0f172a';
        ctx.beginPath(); ctx.roundRect(10, 10, 780, 130, { tl: 40, tr: 40, bl: 0, br: 0 }); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 38px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`${dati.nome} ID ${dati.id}`, 400, 70);
        ctx.font = '24px Inter, sans-serif'; ctx.fillStyle = '#94a3b8';
        ctx.fillText(dati.luogo.toUpperCase(), 400, 110);

        if (this.vistaCorrente === 'main') {
            this.drawMain(ctx, dati);
        } else {
            this.drawDetail(ctx, dati);
        }
    },

    drawMain: function (ctx, dati) {
        // --- SEZIONE 1: VALORI IN TEMPO REALE ---
        ctx.textAlign = 'left';
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 28px Inter';
        ctx.fillText("PARAMETRI OPERATIVI", 40, 190);
        ctx.fillRect(40, 210, 200, 4);

        // Disegno dei 5 parametri
        dati.parametri.forEach((param, i) => {
            const y = 260 + (i * 40);

            // Nome parametro
            ctx.fillStyle = '#64748b'; ctx.font = '24px Inter';
            ctx.fillText(param.nome, 40, y);

            // Valori (Attuale [Nominale])
            ctx.fillStyle = '#0f172a'; ctx.font = 'bold 26px Inter';
            ctx.textAlign = 'right';
            ctx.fillText(`${param.att} `, 580, y);
            ctx.fillStyle = '#94a3b8'; ctx.font = '22px Inter';
            ctx.fillText(`[${param.nom} ${param.unita}]`, 700, y);

            // Spia Lampeggiante
            const isBlinkOn = Math.floor(Date.now() / 400) % 2 === 0;
            ctx.beginPath();
            ctx.arc(740, y - 8, 12, 0, 2 * Math.PI);

            if (param.stato === 0) {
                ctx.fillStyle = '#22c55e'; // Verde fisso
            } else if (param.stato === 1) {
                ctx.fillStyle = isBlinkOn ? '#eab308' : '#fef08a'; // Giallo lampeggiante
            } else {
                ctx.fillStyle = isBlinkOn ? '#ef4444' : '#fca5a5'; // Rosso lampeggiante
                // Effetto alone (glow) per il rosso
                ctx.shadowColor = '#ef4444'; ctx.shadowBlur = isBlinkOn ? 15 : 0;
            }
            ctx.fill();
            ctx.shadowBlur = 0; // Reset ombra
        });

        // --- SEZIONE 2: CHECKLIST MANUTENZIONE ---
        ctx.textAlign = 'left';
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 28px Inter';
        ctx.fillText("CHECKLIST DIAGNOSTICA", 40, 520);
        ctx.fillRect(40, 540, 200, 4);

        dati.checklist.forEach((step, i) => {
            const y = 580 + (i * 80);

            // Box cliccabile
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath(); ctx.roundRect(40, y - 40, 720, 70, 15); ctx.fill();
            ctx.lineWidth = 2; ctx.strokeStyle = '#e2e8f0'; ctx.stroke();

            ctx.fillStyle = '#0f172a'; ctx.font = 'bold 22px Inter';
            ctx.fillText(step.titolo, 60, y + 5);

            // Freccia a destra
            ctx.fillStyle = '#3b82f6'; ctx.font = '28px sans-serif';
            ctx.fillText("➔", 710, y + 8);
        });

        // --- SEZIONE 3: PULSANTE ASSISTENZA ---
        const btnY = 950;
        ctx.fillStyle = '#ef4444'; // Rosso emergenza
        ctx.beginPath(); ctx.roundRect(40, btnY, 720, 100, 20); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Inter'; ctx.textAlign = 'center';
        ctx.fillText("✉ RICHIEDI ASSISTENZA REMOTA", 400, btnY + 60);
    },

    drawDetail: function (ctx, dati) {
        // Trova i dati dello step cliccato
        const stepCorrente = dati.checklist.find(s => s.id === this.vistaCorrente);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 30px Inter';
        ctx.fillText(stepCorrente.titolo, 40, 200);

        // BOX IMMAGINE (Schema con cerchio rosso)
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath(); ctx.roundRect(40, 240, 720, 450, 20); ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = '#cbd5e1'; ctx.stroke();

        // Disegna l'immagine se è caricata e valida
        const img = this.immaginiCaricate[stepCorrente.id];
        if (img && img.complete && img.naturalWidth !== 0) {
            // Adatta l'immagine al box mantenendo le proporzioni
            ctx.drawImage(img, 45, 245, 710, 440);
        } else {
            ctx.fillStyle = '#94a3b8'; ctx.font = '24px Inter'; ctx.textAlign = 'center';
            ctx.fillText("[ Inserisci file: " + stepCorrente.imgFile + " ]", 400, 465);
        }

        // BOX TESTO (Istruzioni)
        ctx.fillStyle = '#eff6ff'; // Sfondo azzurrino
        ctx.beginPath(); ctx.roundRect(40, 720, 720, 200, 20); ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = '#bfdbfe'; ctx.stroke();

        ctx.fillStyle = '#1e3a8a'; ctx.font = 'bold 24px Inter'; ctx.textAlign = 'left';
        ctx.fillText("Istruzioni Tecniche:", 70, 770);

        // A capo automatico artigianale per il testo descrittivo
        ctx.fillStyle = '#334155'; ctx.font = '22px Inter';
        const words = stepCorrente.desc.split(' ');
        let riga = ''; let currentY = 820;
        for (let n = 0; n < words.length; n++) {
            let testRiga = riga + words[n] + ' ';
            if (ctx.measureText(testRiga).width > 650 && n > 0) {
                ctx.fillText(riga, 70, currentY);
                riga = words[n] + ' '; currentY += 35;
            } else { riga = testRiga; }
        }
        ctx.fillText(riga, 70, currentY);

        // PULSANTE INDIETRO
        const btnY = 950;
        ctx.fillStyle = '#334155';
        ctx.beginPath(); ctx.roundRect(40, btnY, 720, 100, 20); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Inter'; ctx.textAlign = 'center';
        ctx.fillText("⬅ TORNA AL PANNELLO", 400, btnY + 60);
    }
};