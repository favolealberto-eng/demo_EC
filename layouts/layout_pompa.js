/**
 * LayoutPompa - Modulo Operativo per ispezione manutentiva pompe idrauliche.
 * 
 * Combina metriche in real-time (Portata, Prevalenza, Pressione) con un 
 * sistema integrato di Checklist passo-passo. È in grado di visualizzare
 * dinamicamente immagini o schemi tecnici pre-caricati associati ad ogni attività.
 */
window.LayoutPompa = {
    config: {
        canvasW: 800, canvasH: 1100, planeW: 2.4, planeH: 3.3
    },

    // Stato interno del pannello (main o dettaglio)
    vistaCorrente: 'main',
    immaginiCaricate: {},

    // Le hitbox vengono ora gestite dinamicamente all'interno di draw()
    hitboxes: [],

    /**
     * fetchDati - Sfrutta la base di 'benchmark_energia' per simulare cicli di usura o sforzo.
     * Costruisce payload interattivi inclusivi di checklist manutentive.
     */
    fetchDati: function (callback) {
        const now = new Date();
        const currentSlotIndex = Math.floor(now.getHours() * 4 + now.getMinutes() / 15);
        // Usiamo i dati del benchmark energia scalati per avere un profilo giornaliero realistico
        const pArray = window.getMockDayData ? window.getMockDayData('benchmark_energia') : [];
        const baseP = pArray.length > currentSlotIndex ? parseFloat(pArray[currentSlotIndex]) : 13.0;

        const portata = (baseP * 6).toFixed(0); 
        const prevalenza = (baseP * 2.5).toFixed(0);
        const pressione = (baseP * 0.2).toFixed(1);
        const potenza = (baseP * 1.4).toFixed(1); // Scaliamo la potenza in base al carico
        
        const h_sync = Math.floor(currentSlotIndex / 4).toString().padStart(2, '0');
        const m_sync = ((currentSlotIndex % 4) * 15).toString().padStart(2, '0');
        const str_ora_attuale = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        const testoAgg = `Ultimo agg. ore ${h_sync}:${m_sync} (attuale ${str_ora_attuale})`;

        const datiPompa = {
            id: "PMP-7822",
            nome: "Pompa Centrifuga",
            luogo: "Sala Macchine B",
            testo_aggiornamento: testoAgg,

            // Valori [Attuale, Nominale, Stato] (Stato: 0=OK, 1=Warning, 2=Allarme)
            parametri: [
                { nome: "Portata (Q)", att: portata, nom: 120, unita: "m³/h", stato: baseP > 15 ? 2 : 0 },
                { nome: "Prevalenza (H)", att: prevalenza, nom: 45, unita: "m", stato: baseP > 15 ? 2 : 0 },
                { nome: "Pressione (P)", att: pressione, nom: 4.5, unita: "bar", stato: baseP > 15 ? 2 : 0 },
                { nome: "Potenza (P.att)", att: potenza, nom: 18.5, unita: "kW", stato: baseP > 14 ? 1 : 0 },
                { nome: "Cos φ", att: 0.72, nom: 0.85, unita: "", stato: 1 }
            ],

            checklist: [
                {
                    id: "step_0",
                    titolo: "1. Controllo Filtro a Y",
                    desc: "Verificare l'indicatore di intasamento del filtro a Y. Se la pressione a valle del filtro è < 0.5 bar, procedere alla pulizia della rete metallica interna.",
                    imgFile: "images/pompa/schema_filtro.PNG"
                },
                {
                    id: "step_1",
                    titolo: "2. Ispezione Tenuta Meccanica",
                    desc: "Ricerca di perdite di fluido dal corpo pompa. Una gocciolatura superiore a 10 gocce/minuto indica un'usura eccessiva degli anelli di tenuta.",
                    imgFile: "images/pompa/schema_tenuta.PNG"
                },
                {
                    id: "step_2",
                    titolo: "3. Valvola di Intercettazione",
                    desc: "Assicurarsi che la valvola a farfalla sulla mandata sia aperta al 100%. Una chiusura parziale accidentale genera caduta di prevalenza.",
                    imgFile: "images/pompa/schema_valvola.PNG"
                },
                {
                    id: "step_3",
                    titolo: "4. Giunti e Collettore",
                    desc: "Verificare il serraggio dei bulloni sui giunti antivibranti in aspirazione per escludere infiltrazioni d'aria che causano cavitazione.",
                    imgFile: "images/pompa/schema_giunto.PNG"
                }
            ]
        };

        // Pre-caricamento base per le immagini
        datiPompa.checklist.forEach(step => {
            if (!this.immaginiCaricate[step.id]) {
                const img = new Image();
                img.src = step.imgFile; // Cerca l'immagine nella cartella
                this.immaginiCaricate[step.id] = img;
            }
        });

        callback(datiPompa);
    },

    /**
     * processClick - Intercettore click. Include lo switch agli step checklist
     * o triggera mail di assistenza in caso di anomalia idraulica.
     */
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

    /**
     * draw - Loop renderizzazione UI per AR. 
     * Imposta gli hitbox a runtime per consentire sovrapposizione pulita delle viste (Main/Detail).
     */
    draw: function (ctx, dati, config) {
        // Assegno le hitbox dinamicamente per evitare click fantasma dell'altra vista
        if (this.vistaCorrente === 'main') {
            this.hitboxes = [
                { id: "step_0", x: 40, y: 530, w: 720, h: 90 },
                { id: "step_1", x: 40, y: 610, w: 720, h: 90 },
                { id: "step_2", x: 40, y: 690, w: 720, h: 90 },
                { id: "step_3", x: 40, y: 770, w: 720, h: 90 },
                { id: "assistenza", x: 40, y: 950, w: 720, h: 100 }
            ];
        } else {
            this.hitboxes = [
                { id: "back_pompa", x: 40, y: 950, w: 720, h: 100 }
            ];
        }

        ctx.clearRect(0, 0, 800, 1100);

        // --- SFONDO SCURO GLASSMORPHISM ---
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

        // --- HEADER ---
        const hdrGrad = ctx.createLinearGradient(10, 10, W - 10, 10);
        hdrGrad.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
        hdrGrad.addColorStop(1, 'rgba(8, 145, 178, 0.2)');
        ctx.fillStyle = hdrGrad;
        ctx.beginPath(); ctx.roundRect(0, 0, W, 130, { tl: 40, tr: 40, bl: 0, br: 0 }); ctx.fill();

        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 38px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 8;
        ctx.fillText(`${dati.nome} ID ${dati.id}`, 400, 70);
        ctx.shadowBlur = 0;

        ctx.font = '24px Inter, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(dati.testo_aggiornamento, 400, 110);

        // Linea separatrice bottom header
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.beginPath(); ctx.moveTo(0, 130); ctx.lineTo(W, 130); ctx.stroke();

        // Disegna la vista appropriata
        if (this.vistaCorrente === 'main') {
            this.drawMain(ctx, dati);
        } else {
            this.drawDetail(ctx, dati);
        }
    },

    drawMain: function (ctx, dati) {
        // --- SEZIONE 1: VALORI IN TEMPO REALE ---
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(6,182,212,0.9)';
        ctx.font = 'bold 28px Inter';
        ctx.fillText("PARAMETRI OPERATIVI", 40, 190);

        ctx.fillStyle = 'rgba(6,182,212,0.35)';
        ctx.fillRect(40, 205, 320, 3);

        // Disegno dei 5 parametri
        dati.parametri.forEach((param, i) => {
            const y = 260 + (i * 45);

            // Nome parametro
            ctx.textAlign = 'left';
            ctx.fillStyle = 'rgba(148,163,184,0.9)'; ctx.font = '24px Inter';
            ctx.fillText(param.nome, 40, y);

            // Valori (Attuale) - allineato a destra verso il centro
            ctx.fillStyle = '#f1f5f9'; ctx.font = 'bold 28px Inter';
            ctx.textAlign = 'right';
            ctx.fillText(`${param.att} `, 570, y);

            // [Nominale unità] - allineato a sinistra del centro
            ctx.fillStyle = 'rgba(148,163,184,0.7)'; ctx.font = '22px Inter';
            ctx.textAlign = 'left';
            ctx.fillText(`[${param.nom} ${param.unita}]`, 570, y);

            // Spia Lampeggiante
            const isBlinkOn = Math.floor(Date.now() / 400) % 2 === 0;
            ctx.beginPath();
            ctx.arc(740, y - 8, 12, 0, 2 * Math.PI);

            if (param.stato === 0) {
                ctx.fillStyle = '#22c55e'; // Verde fisso
            } else if (param.stato === 1) {
                ctx.fillStyle = isBlinkOn ? '#eab308' : '#ca8a04'; // Giallo 
                ctx.shadowColor = '#eab308'; ctx.shadowBlur = isBlinkOn ? 15 : 0;
            } else {
                ctx.fillStyle = isBlinkOn ? '#ef4444' : '#b91c1c'; // Rosso 
                ctx.shadowColor = '#ef4444'; ctx.shadowBlur = isBlinkOn ? 15 : 0;
            }
            ctx.fill();
            ctx.shadowBlur = 0; // Reset ombra
        });

        // --- SEZIONE 2: CHECKLIST MANUTENZIONE ---
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(6,182,212,0.9)';
        ctx.font = 'bold 28px Inter';
        ctx.fillText("CHECKLIST DIAGNOSTICA", 40, 520);

        ctx.fillStyle = 'rgba(6,182,212,0.35)';
        ctx.fillRect(40, 535, 340, 3);

        dati.checklist.forEach((step, i) => {
            const y = 580 + (i * 80);

            // Box cliccabile
            const isPinnedCheck = window.isPinned;
            if (!isPinnedCheck) ctx.globalAlpha = 0.4;

            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.beginPath(); ctx.roundRect(40, y - 40, 720, 70, 15); ctx.fill();
            ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; ctx.stroke();

            ctx.fillStyle = '#f1f5f9'; ctx.font = 'bold 22px Inter';
            ctx.fillText(step.titolo, 60, y + 5);

            // Freccia a destra
            ctx.fillStyle = 'rgba(6,182,212,0.8)'; ctx.font = '28px sans-serif';
            ctx.fillText(isPinnedCheck ? "➔" : "🔒", 710, y + 8);

            if (!isPinnedCheck) ctx.globalAlpha = 1.0;
        });

        // --- SEZIONE 3: PULSANTE ASSISTENZA ---
        const btnY = 950;
        ctx.save();
        const btnGrad = ctx.createLinearGradient(40, btnY, 760, btnY + 100);
        btnGrad.addColorStop(0, '#ef4444');
        btnGrad.addColorStop(1, '#b91c1c');
        ctx.fillStyle = btnGrad;
        ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
        ctx.shadowBlur = 15;
        
        const isPinnedAss = window.isPinned;
        if (!isPinnedAss) ctx.globalAlpha = 0.4;

        ctx.beginPath(); ctx.roundRect(40, btnY, 720, 100, 20); ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Inter'; ctx.textAlign = 'center';
        ctx.fillText(isPinnedAss ? "✉ RICHIEDI ASSISTENZA" : "🔒 RICHIEDI ASSISTENZA", 400, btnY + 60);

        if (!isPinnedAss) ctx.globalAlpha = 1.0;
    },

    drawDetail: function (ctx, dati) {
        // Trova i dati dello step cliccato
        const stepCorrente = dati.checklist.find(s => s.id === this.vistaCorrente);

        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(6,182,212,0.9)';
        ctx.font = 'bold 30px Inter';
        ctx.fillText(stepCorrente.titolo, 40, 200);

        // BOX IMMAGINE (Schema con cerchio rosso)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.beginPath(); ctx.roundRect(40, 240, 720, 450, 20); ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.stroke();

        ctx.save();
        ctx.beginPath(); ctx.roundRect(40, 240, 720, 450, 20); ctx.clip();

        // Disegna l'immagine se è caricata e valida
        const img = this.immaginiCaricate[stepCorrente.id];
        if (img && img.complete && img.naturalWidth !== 0) {
            // Adatta l'immagine al box mantenendo le proporzioni
            ctx.drawImage(img, 45, 245, 710, 440);
        } else {
            ctx.fillStyle = 'rgba(148,163,184,0.6)'; ctx.font = '24px Inter'; ctx.textAlign = 'center';
            ctx.fillText("[ Inserimento file immagine: " + stepCorrente.imgFile + " ]", 400, 465);
        }
        ctx.restore();

        // BOX TESTO (Istruzioni)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath(); ctx.roundRect(40, 720, 720, 200, 20); ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.stroke();

        ctx.fillStyle = 'rgba(6,182,212,0.9)'; ctx.font = 'bold 24px Inter'; ctx.textAlign = 'left';
        ctx.fillText("Istruzioni Tecniche:", 70, 770);

        // A capo automatico artigianale per il testo descrittivo
        ctx.fillStyle = '#e2e8f0'; ctx.font = '22px Inter';
        const words = stepCorrente.desc.split(' ');
        let riga = ''; let currentY = 820;
        for (let n = 0; n < words.length; n++) {
            let testRiga = riga + words[n] + ' ';
            if (ctx.measureText(testRiga).width > 660 && n > 0) {
                ctx.fillText(riga, 70, currentY);
                riga = words[n] + ' '; currentY += 35;
            } else { riga = testRiga; }
        }
        ctx.fillText(riga, 70, currentY);

        // PULSANTE INDIETRO
        const btnY = 950;
        ctx.save();
        const btnGrad = ctx.createLinearGradient(40, btnY, 760, btnY + 100);
        btnGrad.addColorStop(0, 'rgba(255,255,255,0.1)');
        btnGrad.addColorStop(1, 'rgba(255,255,255,0.05)');
        ctx.fillStyle = btnGrad;

        const isPinnedBack = window.isPinned;
        if (!isPinnedBack) ctx.globalAlpha = 0.4;

        ctx.beginPath(); ctx.roundRect(40, btnY, 720, 100, 20); ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 32px Inter'; ctx.textAlign = 'center';
        ctx.fillText(isPinnedBack ? "⬅ TORNA AL PANNELLO" : "🔒 TORNA AL PANNELLO", 400, btnY + 60);

        if (!isPinnedBack) ctx.globalAlpha = 1.0;
    }
};