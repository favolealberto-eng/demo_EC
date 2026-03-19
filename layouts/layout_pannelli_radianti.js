window.LayoutPannelliRadianti = {
    config: {
        canvasW: 800, canvasH: 1100, planeW: 2.4, planeH: 3.3
    },

    vistaCorrente: 'main',
    hitboxes: [],

    fetchDati: function (callback) {
        // Simuliamo alcuni dati in tempo reale
        const isRiscaldamento = true; // es. Inverno
        const tMandata = isRiscaldamento ? 35.5 : 15.0;
        const tRitorno = isRiscaldamento ? 30.2 : 18.2;
        const tAmbiente = 21.5;
        const umidita = 45.0; // %
        const dewPoint = tAmbiente - ((100 - umidita) / 5); // Approssimazione di Dew Point
        const rischioCondensa = tAmbiente - dewPoint; 
        
        let statoCondensa = 0; // 0: Verde, 1: Giallo, 2: Rosso
        if (!isRiscaldamento) {
            if (rischioCondensa < 2) statoCondensa = 2;
            else if (rischioCondensa < 4) statoCondensa = 1;
        }

        const dati = {
            id: "PR-01",
            nome: "Pannello Radiante",
            luogo: "Ufficio Direzione",
            modalita: isRiscaldamento ? "RISCALDAMENTO" : "RAFFRESCAMENTO",
            tMandata: tMandata,
            tRitorno: tRitorno,
            potenzaTermica: 1.2, // kW
            tAmbiente: tAmbiente,
            umidita: umidita,
            dewPoint: dewPoint.toFixed(1),
            statoCondensa: statoCondensa,

            // Dati diagnostica
            valvolaModulante: 75, // %
            portata: 120, // l/h
            pressione: 1.8, // bar
            statoPompa: 0 // 0: OK
        };

        // Facciamo variare un po' i dati per mostrare il tempo reale
        const variazione = (Math.random() - 0.5) * 0.2;
        dati.tAmbiente = (parseFloat(dati.tAmbiente) + variazione).toFixed(1);
        dati.tMandata = (parseFloat(dati.tMandata) + variazione).toFixed(1);
        dati.tRitorno = (parseFloat(dati.tRitorno) + variazione).toFixed(1);
        
        callback(dati);
    },

    processClick: function (id) {
        let changed = false;
        if (id === "btn_diagnostica") {
            this.vistaCorrente = "diagnostica";
            changed = true;
        } else if (id === "btn_back") {
            this.vistaCorrente = "main";
            changed = true;
        } else if (id === "btn_pompa") {
            try {
                const pumpId = "9";
                const pumpConfig = registroMacchinari[pumpId];
                if (pumpConfig) {
                    if (!pumpConfig.template) {
                        const script = document.createElement('script');
                        script.src = pumpConfig.file + '?v=' + new Date().getTime();
                        script.onload = () => {
                            pumpConfig.template = window[pumpConfig.oggetto];
                            currentMarkerId = pumpId;
                            startRenderLoop(pumpId, pumpConfig);
                            if(isPinned) {
                                const activeCanvas = document.getElementById('canvas-' + pumpId);
                                const container = document.getElementById('main-view-container');
                                Array.from(container.children).forEach(c => {
                                    if(c.tagName === 'CANVAS') {
                                        c.classList.remove('canvas-pinned');
                                        c.classList.add('hidden-canvas');
                                        document.body.appendChild(c);
                                    }
                                });
                                container.innerHTML = '';
                                container.appendChild(activeCanvas);
                                activeCanvas.classList.remove('hidden-canvas');
                                activeCanvas.classList.add('canvas-pinned');
                            }
                        };
                        document.head.appendChild(script);
                    } else {
                        currentMarkerId = pumpId;
                        startRenderLoop(pumpId, pumpConfig);
                        if(isPinned) {
                            const activeCanvas = document.getElementById('canvas-' + pumpId);
                            const container = document.getElementById('main-view-container');
                            Array.from(container.children).forEach(c => {
                                if(c.tagName === 'CANVAS') {
                                    c.classList.remove('canvas-pinned');
                                    c.classList.add('hidden-canvas');
                                    document.body.appendChild(c);
                                }
                            });
                            container.innerHTML = '';
                            container.appendChild(activeCanvas);
                            activeCanvas.classList.remove('hidden-canvas');
                            activeCanvas.classList.add('canvas-pinned');
                        }
                    }
                }
            } catch (e) {
                console.error("Link alla pompa fallito", e);
            }
        }

        if (changed && this.ultimoCtx && this.ultimiDati && this.ultimoConfig) {
            this.draw(this.ultimoCtx, this.ultimiDati, this.ultimoConfig);
        }
    },

    draw: function (ctx, dati, config) {
        this.ultimoCtx = ctx;
        this.ultimiDati = dati;
        this.ultimoConfig = config;

        if (this.vistaCorrente === 'main') {
            this.hitboxes = [
                { id: "btn_diagnostica", x: 40, y: 950, w: 720, h: 100 }
            ];
        } else {
            this.hitboxes = [
                { id: "btn_pompa", x: 40, y: 820, w: 720, h: 100 },
                { id: "btn_back", x: 40, y: 950, w: 720, h: 100 }
            ];
        }

        ctx.clearRect(0, 0, 800, 1100);

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
        ctx.fillText(`${dati.nome} ${config && config.id_macchina ? config.id_macchina : dati.id}`, 400, 70);
        ctx.shadowBlur = 0;

        ctx.font = '24px Inter, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(dati.luogo.toUpperCase(), 400, 110);

        // Linea separatrice bottom header
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.beginPath(); ctx.moveTo(0, 130); ctx.lineTo(W, 130); ctx.stroke();

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

        if (this.vistaCorrente === 'main') {
            this.drawMain(ctx, dati);
        } else {
            this.drawDiagnostic(ctx, dati);
        }
    },

    drawMain: function (ctx, dati) {
        // BADGE MODALITÀ (Riscaldamento/Raffrescamento)
        const isRisc = dati.modalita === "RISCALDAMENTO";
        const isStandby = false; // Potremmo supportare stand-by
        let badgeColor = isRisc ? '#ef4444' : '#3b82f6';
        if (isStandby) badgeColor = '#64748b';
        
        ctx.fillStyle = badgeColor;
        ctx.beginPath(); ctx.roundRect(40, 160, 260, 45, 10); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px Inter'; ctx.textAlign = 'center';
        ctx.fillText(`MOD: ${dati.modalita}`, 170, 190);

        // VALORI AMBIENTE
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(6,182,212,0.9)';
        ctx.font = 'bold 28px Inter';
        ctx.fillText("PARAMETRI AMBIENTE", 40, 260);
        ctx.fillStyle = 'rgba(6,182,212,0.35)';
        ctx.fillRect(40, 275, 320, 3);

        this.drawRow(ctx, "Temperatura Ambiente", `${dati.tAmbiente}`, "°C", 330);
        this.drawRow(ctx, "Umidità Relativa", `${dati.umidita}`, "%", 400);

        // DEW POINT
        ctx.fillStyle = 'rgba(148,163,184,0.9)'; ctx.font = '24px Inter'; ctx.textAlign = 'left';
        ctx.fillText("Dew Point", 40, 470);
        ctx.fillStyle = '#f1f5f9'; ctx.font = 'bold 28px Inter'; ctx.textAlign = 'right';
        ctx.fillText(`${dati.dewPoint} °C`, 740, 470);

        // RISCHIO CONDENSA (Spia lampeggiante)
        ctx.fillStyle = 'rgba(148,163,184,0.9)'; ctx.font = '24px Inter'; ctx.textAlign = 'left';
        ctx.fillText("Rischio Condensa", 40, 540);
        const isBlinkOn = Math.floor(Date.now() / 400) % 2 === 0;
        ctx.beginPath();
        ctx.arc(728, 532, 12, 0, 2 * Math.PI);
        if (dati.statoCondensa === 0) {
            ctx.fillStyle = '#22c55e'; // Verde
        } else if (dati.statoCondensa === 1) {
            ctx.fillStyle = isBlinkOn ? '#eab308' : '#ca8a04'; // Giallo 
            ctx.shadowColor = '#eab308'; ctx.shadowBlur = isBlinkOn ? 15 : 0;
        } else {
            ctx.fillStyle = isBlinkOn ? '#ef4444' : '#b91c1c'; // Rosso 
            ctx.shadowColor = '#ef4444'; ctx.shadowBlur = isBlinkOn ? 15 : 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0; 
        
        ctx.fillStyle = '#f1f5f9'; ctx.font = '24px Inter'; ctx.textAlign = 'right';
        let rischioText = "Normale";
        if(dati.statoCondensa === 1) rischioText = "Attenzione";
        if(dati.statoCondensa === 2) rischioText = "Pericolo";
        ctx.fillText(rischioText, 705, 540);

        // VALORI CIRCUITO RADIANTI
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(6,182,212,0.9)';
        ctx.font = 'bold 28px Inter';
        ctx.fillText("PARAMETRI CIRCUITO", 40, 630);
        ctx.fillStyle = 'rgba(6,182,212,0.35)';
        ctx.fillRect(40, 645, 320, 3);

        this.drawRow(ctx, "T. Mandata Serbatoio", `${dati.tMandata}`, "°C", 700);
        this.drawRow(ctx, "T. Ritorno Serbatoio", `${dati.tRitorno}`, "°C", 770);
        this.drawRow(ctx, "Potenza Termica Ist.", `${dati.potenzaTermica}`, "kW", 840);

        // PULSANTE DIAGNOSTICA
        const btnY = 950;
        ctx.save();
        const btnGrad = ctx.createLinearGradient(40, btnY, 760, btnY + 100);
        btnGrad.addColorStop(0, 'rgba(6, 182, 212, 0.8)');
        btnGrad.addColorStop(1, 'rgba(8, 145, 178, 0.8)');
        ctx.fillStyle = btnGrad;
        ctx.shadowColor = 'rgba(6, 182, 212, 0.5)';
        ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.roundRect(40, btnY, 720, 100, 20); ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Inter'; ctx.textAlign = 'center';
        ctx.fillText("🛠 MANUTENZIONE & DIAGNOSTICA", 400, btnY + 60);
    },

    drawDiagnostic: function (ctx, dati) {
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(6,182,212,0.9)';
        ctx.font = 'bold 32px Inter';
        ctx.fillText("DIAGNOSTICA IMPIANTO", 40, 200);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath(); ctx.roundRect(40, 240, 720, 350, 20); ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.stroke();

        this.drawRowDiag(ctx, "Apertura Valvola Modulante", `${dati.valvolaModulante}`, "%", 300);
        this.drawRowDiag(ctx, "Portata Circuito", `${dati.portata}`, "l/h", 380);
        this.drawRowDiag(ctx, "Pressione Sistema", `${dati.pressione}`, "bar", 460);
        
        ctx.fillStyle = 'rgba(148,163,184,0.9)'; ctx.font = '26px Inter'; ctx.textAlign = 'left';
        ctx.fillText("Stato Pompa Circolazione", 70, 540);
        ctx.fillStyle = '#22c55e'; ctx.font = 'bold 28px Inter'; ctx.textAlign = 'right';
        ctx.fillText("IN FUNZIONE", 730, 540);

        // PULSANTE LINK POMPA
        const btnP = 820;
        ctx.save();
        const pGrad = ctx.createLinearGradient(40, btnP, 760, btnP + 100);
        pGrad.addColorStop(0, 'rgba(14, 165, 233, 0.8)'); 
        pGrad.addColorStop(1, 'rgba(2, 132, 199, 0.8)');
        ctx.fillStyle = pGrad;
        ctx.shadowColor = 'rgba(14, 165, 233, 0.5)';
        ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.roundRect(40, btnP, 720, 100, 20); ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Inter'; ctx.textAlign = 'center';
        ctx.fillText("⚙ ACCEDI AL PANNELLO POMPA", 400, btnP + 60);

        // PULSANTE BACK
        const btnY = 950;
        ctx.save();
        const btnGrad = ctx.createLinearGradient(40, btnY, 760, btnY + 100);
        btnGrad.addColorStop(0, 'rgba(255,255,255,0.1)');
        btnGrad.addColorStop(1, 'rgba(255,255,255,0.05)');
        ctx.fillStyle = btnGrad;
        ctx.beginPath(); ctx.roundRect(40, btnY, 720, 100, 20); ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.stroke();
        ctx.restore();
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 32px Inter'; ctx.textAlign = 'center';
        ctx.fillText("⬅ TORNA ALLA VISTA PRINCIPALE", 400, btnY + 60);
    },

    drawRow: function(ctx, label, val, unita, y) {
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(148,163,184,0.9)'; ctx.font = '24px Inter';
        ctx.fillText(label, 40, y);
        ctx.fillStyle = '#f1f5f9'; ctx.font = 'bold 28px Inter';
        ctx.textAlign = 'right';
        ctx.fillText(`${val} `, 690, y);
        ctx.fillStyle = 'rgba(148,163,184,0.7)'; ctx.font = '22px Inter';
        ctx.textAlign = 'left';
        ctx.fillText(`[${unita}]`, 690, y);
    },

    drawRowDiag: function(ctx, label, val, unita, y) {
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(148,163,184,0.9)'; ctx.font = '26px Inter';
        ctx.fillText(label, 70, y);
        ctx.fillStyle = '#f1f5f9'; ctx.font = 'bold 28px Inter';
        ctx.textAlign = 'right';
        ctx.fillText(`${val} `, 680, y);
        ctx.fillStyle = 'rgba(148,163,184,0.7)'; ctx.font = '22px Inter';
        ctx.textAlign = 'left';
        ctx.fillText(`[${unita}]`, 680, y);
    }
};
