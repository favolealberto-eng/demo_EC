/**
 * LayoutQuadroEl - Dashboard Energetica e Registro Manutenzioni.
 */
window.LayoutQuadroEl = {
    config: {
        canvasW: 1500,
        canvasH: 3600,
        planeW: 3.0,
        planeH: 7.2
    },
    hitboxes: [
        { id: "toggle_grafico", x: 50, y: 3200, w: 1400, h: 220 },
        { id: "dettaglio_kw", x: 50, y: 420, w: 1400, h: 650 }
    ],

    fetchDati: function (callback) {
        if (!window.QuadroElGlobalState) {
            const history = [];
            const hL1 = [], hL2 = [], hL3 = [], hL4 = [];

            // Genera la curva giornaliera di 96 quarti d'ora (24h * 4)
            for (let i = 0; i < 96; i++) {
                const hour = i / 4;
                let pBase = 50;

                if (hour >= 6 && hour < 9) pBase = 50 + (110 - 50) * ((hour - 6) / 3);
                else if (hour >= 9 && hour < 17) pBase = 120 + Math.random() * 20;
                else if (hour >= 17 && hour < 20) pBase = 110 - (110 - 80) * ((hour - 17) / 3);
                else if (hour >= 20) pBase = 80 - (80 - 50) * ((hour - 20) / 4);

                let v = pBase + (Math.random() * 5 - 2.5);

                history.push(v);
                hL1.push(v * 0.4);
                hL2.push(v * 0.25);
                hL3.push(v * 0.15);
                hL4.push(v * 0.2);
            }

            // DATI MOCK DELLA MANUTENZIONE
            let interventiManutenzione = [
                { data: "15/03/2026", operazione: "Sostituzione fusibile rapido L1", scadenza: "15/03/2027", operatore: "Mario Rossi" },
                { data: "02/02/2026", operazione: "Serraggio morsettiere generali", scadenza: "02/02/2028", operatore: "Luigi Bianchi" },
                { data: "12/11/2025", operazione: "Test interruttori differenziali", scadenza: "12/05/2026", operatore: "Anna Neri" },
                { data: "05/09/2025", operazione: "Analisi termografica componenti", scadenza: "05/09/2026", operatore: "Mario Rossi" },
                { data: "22/05/2025", operazione: "Pulizia e aspirazione filtri", scadenza: "22/11/2025", operatore: "Luigi Bianchi" },
                { data: "10/01/2025", operazione: "Taratura relè termici esterni", scadenza: "10/01/2026", operatore: "Ditta Esterna" },
                { data: "18/12/2024", operazione: "Sostituzione scaricatori (SPD)", scadenza: "18/12/2029", operatore: "Anna Neri" }
            ];

            // ORDINAMENTO AUTOMATICO (Più recente prima)
            const parseDate = (d) => { const [G, M, A] = d.split('/'); return new Date(A, M - 1, G).getTime(); };
            interventiManutenzione.sort((a, b) => parseDate(b.data) - parseDate(a.data));

            window.QuadroElGlobalState = {
                curvaIdealeGlobale: history,
                curvaIdealeLinee: { l1: hL1, l2: hL2, l3: hL3, l4: hL4 },
                storicoGlobale: [],
                storicoLinee: { l1: [], l2: [], l3: [], l4: [] },
                vistaSingoleLinee: false,
                isFullscreen: false,
                vistaTabella: false, // Switch Dashboard/Tabella
                selectedRowIndex: null,
                registroManutenzioni: interventiManutenzione
            };
        }

        const now = new Date();
        const currentSlotIndex = Math.floor(now.getHours() * 4 + now.getMinutes() / 15);

        const state = window.QuadroElGlobalState;

        // Storico
        state.storicoGlobale = state.curvaIdealeGlobale.slice(0, currentSlotIndex + 1);
        state.storicoLinee.l1 = state.curvaIdealeLinee.l1.slice(0, currentSlotIndex + 1);
        state.storicoLinee.l2 = state.curvaIdealeLinee.l2.slice(0, currentSlotIndex + 1);
        state.storicoLinee.l3 = state.curvaIdealeLinee.l3.slice(0, currentSlotIndex + 1);
        state.storicoLinee.l4 = state.curvaIdealeLinee.l4.slice(0, currentSlotIndex + 1);

        const potenzaAttuale = state.curvaIdealeGlobale[currentSlotIndex].toFixed(1);
        const line1 = state.curvaIdealeLinee.l1[currentSlotIndex].toFixed(1);
        const line2 = state.curvaIdealeLinee.l2[currentSlotIndex].toFixed(1);
        const line3 = state.curvaIdealeLinee.l3[currentSlotIndex].toFixed(1);
        const line4 = state.curvaIdealeLinee.l4[currentSlotIndex].toFixed(1);

        const tensione = (398.5).toFixed(1);
        const corrente = (potenzaAttuale * 1000 / (Math.sqrt(3) * tensione * 0.9)).toFixed(1);

        // Allarmi
        const getStato = (val, yThresh, rThresh) => parseFloat(val) >= rThresh ? 'CRITICO' : (parseFloat(val) >= yThresh ? 'ATTENZIONE' : 'NORMALE');
        const stL1 = getStato(line1, 45, 52);
        const stL2 = getStato(line2, 32, 38);
        const stL3 = getStato(line3, 20, 25);
        const stL4 = getStato(line4, 26, 32);

        let stato_allarme = 'NORMALE';
        if ([stL1, stL2, stL3, stL4].includes('CRITICO') || parseFloat(potenzaAttuale) > 135) stato_allarme = 'CRITICO';
        else if ([stL1, stL2, stL3, stL4].includes('ATTENZIONE') || parseFloat(potenzaAttuale) > 120) stato_allarme = 'ATTENZIONE';

        const h_sync = Math.floor(currentSlotIndex / 4).toString().padStart(2, '0');
        const m_sync = ((currentSlotIndex % 4) * 15).toString().padStart(2, '0');
        const str_ora_attuale = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

        callback({
            potenza_kw: parseFloat(potenzaAttuale),
            tensione_v: parseFloat(tensione),
            corrente_a: parseFloat(corrente),
            cos_phi: 0.92,
            stato_allarme: stato_allarme,
            testo_aggiornamento: `Ultimo agg. ore ${h_sync}:${m_sync} (attuale ${str_ora_attuale})`,
            linee: [
                { nome: 'Linea Produzione 1', p: parseFloat(line1), stato: stL1 },
                { nome: 'Condizionamento / HVAC', p: parseFloat(line2), stato: stL2 },
                { nome: 'Prese e Illuminazione', p: parseFloat(line3), stato: stL3 },
                { nome: 'Servizi Ausiliari / Altro', p: parseFloat(line4), stato: stL4 }
            ]
        });
    },

    draw: function (ctx, dati, currentConfig) {
        const state = window.QuadroElGlobalState;
        this.hitboxes = []; // Reset dinamico

        // Recupero piano 3D per ridimensionamento
        const markerId = ctx.canvas.id.replace('canvas-', '');
        const plane3D = document.getElementById('plane-' + markerId);

        // =========================================================
        // RAMO A: TABELLA MANUTENZIONI COMPATTATA
        // =========================================================
        if (state.vistaTabella) {
            // Nuove dimensioni più compatte
            const W_TAB = 2200;
            const rowHeight = 100; // Ridotto da 120
            const headerHeight = 240;
            const paddingBottom = 60;
            const H_TAB = headerHeight + (state.registroManutenzioni.length * rowHeight) + paddingBottom;

            // Resize dinamico Canvas e AR
            if (ctx.canvas.width !== W_TAB || ctx.canvas.height !== H_TAB) {
                ctx.canvas.width = W_TAB;
                ctx.canvas.height = H_TAB;
                if (plane3D) {
                    plane3D.setAttribute('width', 5.0); // Leggermente più stretto in AR
                    plane3D.setAttribute('height', 5.0 * (H_TAB / W_TAB));
                }
            }

            ctx.clearRect(0, 0, W_TAB, H_TAB);

            // Sfondo Dark
            ctx.fillStyle = 'rgba(13, 31, 60, 0.95)';
            ctx.beginPath(); ctx.roundRect(0, 0, W_TAB, H_TAB, 40); ctx.fill();
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
            ctx.lineWidth = 4; ctx.stroke();

            // Header
            ctx.fillStyle = '#061325';
            ctx.beginPath(); ctx.roundRect(0, 0, W_TAB, 150, { tl: 40, tr: 40, bl: 0, br: 0 }); ctx.fill();
            ctx.fillStyle = '#f1f5f9';
            ctx.font = 'bold 55px Inter'; // Font ridotto
            ctx.textAlign = 'left';
            ctx.fillText(`🔧 REGISTRO MANUTENZIONI - ID: ${currentConfig.id_macchina || 'QE-01'}`, 60, 95);

            // Colonne (riproporzionate per W=2200)
            const colData = 60;
            const colOp = 350;
            const colScad = 1350;
            const colOpe = 1750;

            let startY = 200;
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 36px Inter';
            ctx.fillText("DATA INT.", colData, startY);
            ctx.fillText("DESCRIZIONE OPERAZIONE", colOp, startY);
            ctx.fillText("PROX. SCADENZA", colScad, startY);
            ctx.fillText("OPERATORE", colOpe, startY);

            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(30, startY + 20); ctx.lineTo(W_TAB - 30, startY + 20); ctx.stroke();

            startY += 30;
            state.registroManutenzioni.forEach((intervento, index) => {
                const yRiga = startY + (index * rowHeight);

                // Evidenziazione Riga
                if (state.selectedRowIndex === index) {
                    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
                    ctx.fillRect(10, yRiga, W_TAB - 20, rowHeight);
                    ctx.fillStyle = '#38bdf8';
                    ctx.fillRect(10, yRiga, 10, rowHeight); // Bordo azzurro a sinistra
                } else {
                    ctx.fillStyle = index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0)';
                    ctx.fillRect(10, yRiga, W_TAB - 20, rowHeight);
                }

                // Hitbox della riga
                this.hitboxes.push({ id: `riga_${index}`, x: 10, y: yRiga, w: W_TAB - 20, h: rowHeight });

                // Testi Riga (centrati verticalmente)
                ctx.textBaseline = 'middle';
                const tY = yRiga + (rowHeight / 2);

                ctx.fillStyle = '#e2e8f0';
                ctx.font = 'bold 34px Inter';
                ctx.fillText(intervento.data, colData, tY);

                ctx.fillStyle = '#f8fafc';
                ctx.font = '34px Inter';
                ctx.fillText(intervento.operazione, colOp, tY);

                // Check Scadenza
                const parseDate = (d) => { const [G, M, A] = d.split('/'); return new Date(A, M - 1, G).getTime(); };
                const oggi = new Date().getTime();
                const scad = parseDate(intervento.scadenza);
                const giorniRimasti = (scad - oggi) / (1000 * 3600 * 24);

                if (giorniRimasti < 0) ctx.fillStyle = '#ef4444'; // Scaduta (Rosso)
                else if (giorniRimasti < 60) ctx.fillStyle = '#facc15'; // Giallo
                else ctx.fillStyle = '#22c55e'; // Verde

                ctx.font = 'bold 34px Inter';
                ctx.fillText(intervento.scadenza, colScad, tY);

                ctx.fillStyle = '#94a3b8';
                ctx.font = '32px Inter';
                ctx.fillText(intervento.operatore, colOpe, tY);

                ctx.textBaseline = 'alphabetic';

                ctx.strokeStyle = 'rgba(255,255,255,0.05)';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(30, yRiga + rowHeight); ctx.lineTo(W_TAB - 30, yRiga + rowHeight); ctx.stroke();
            });

            return; // Fine disegno Tabella
        }

        // =========================================================
        // RAMO B: DASHBOARD ORIGINALE (ESATTAMENTE COME PRIMA)
        // =========================================================
        const w = 1500;
        const h = 3600;

        // Ripristina proporzioni verticali originali
        if (ctx.canvas.width !== w || ctx.canvas.height !== h) {
            ctx.canvas.width = w;
            ctx.canvas.height = h;
            if (plane3D) {
                plane3D.setAttribute('width', 3.0);
                plane3D.setAttribute('height', 7.2);
            }
        }

        // --- GESTIONE MODALITA' LANDSCAPE (A TUTTO SCHERMO HORIZONTAL) ---
        if (state.isFullscreen && (typeof isPinned !== 'undefined' ? isPinned : false)) {
            let isLandscapeDevice = window.innerWidth > window.innerHeight;
            let lW = 3600;
            let lH = 1500;

            if (isLandscapeDevice) {
                if (ctx.canvas.width !== lW) { ctx.canvas.width = lW; ctx.canvas.height = lH; }
                ctx.fillStyle = '#061325';
                ctx.fillRect(0, 0, lW, lH);
            } else {
                // Fallback rotazione per chi tiene il telefono in verticale
                if (ctx.canvas.width !== w) { ctx.canvas.width = w; ctx.canvas.height = h; }
                ctx.fillStyle = '#061325';
                ctx.fillRect(0, 0, w, h);
                ctx.save();
                ctx.translate(w, 0);
                ctx.rotate(Math.PI / 2);
            }

            ctx.fillStyle = '#f1f5f9';
            ctx.font = 'bold 80px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(state.vistaSingoleLinee ? "ANDAMENTO NEL TEMPO (SINGOLE LINEE)" : "ANDAMENTO POTENZA (TOTALE)", lW / 2, 180);

            // Bottone X chiusura in Landscape 
            let btnLy = 80;
            let btnLx = lW - 160;

            ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
            ctx.beginPath();
            ctx.arc(btnLx + 40, btnLy + 40, 50, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 50px Inter';
            ctx.textAlign = 'center';
            ctx.fillText("✖", btnLx + 40, btnLy + 60);

            if (isLandscapeDevice) {
                this.hitboxes.push({ id: "toggle_fs", x: btnLx - 60, y: btnLy - 60, w: 200, h: 200 });
            } else {
                this.hitboxes.push({ id: "toggle_fs", x: w - btnLy - 200, y: btnLx - 100, w: 250, h: 250 });
            }

            let gX = 250, gY = 280, gW = lW - 400, gH = lH - 550;

            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(gX, gY + gH);
            ctx.lineTo(gX + gW, gY + gH);
            ctx.moveTo(gX, gY);
            ctx.lineTo(gX, gY + gH);
            ctx.stroke();

            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 45px Inter';
            ctx.textAlign = 'left';
            ctx.fillText("Potenza [kW]", gX - 100, gY - 40);

            ctx.textAlign = 'center';
            ctx.fillText("Ore della giornata", gX + gW / 2, gY + gH + 110);

            let minVal = 0, maxVal = state.vistaSingoleLinee ? 80 : 160, numSteps = 4;

            ctx.font = '38px Inter';
            for (let i = 0; i <= numSteps; i++) {
                let val = minVal + (maxVal - minVal) * (i / numSteps);
                let yy = (gY + gH) - (i / numSteps) * gH;
                ctx.beginPath(); ctx.moveTo(gX, yy); ctx.lineTo(gX + gW, yy); ctx.stroke();
                ctx.textAlign = 'right'; ctx.fillText(`${val}`, gX - 20, yy + 10);
            }

            for (let j = 0; j <= 24; j += 4) {
                let px = gX + (j / 24) * gW;
                ctx.textAlign = 'center'; ctx.fillText(`${j}:00`, px, gY + gH + 60);
                ctx.beginPath(); ctx.moveTo(px, gY + gH); ctx.lineTo(px, gY + gH + 20); ctx.stroke();
            }

            const drawHLine = (dataPoints, color, thickness, fill) => {
                if (!dataPoints || dataPoints.length === 0) return;
                ctx.beginPath();
                let stepX = gW / 96;
                for (let i = 0; i < dataPoints.length; i++) {
                    let px = gX + i * stepX;
                    let valToDraw = Math.min(dataPoints[i], maxVal);
                    let py = (gY + gH) - ((valToDraw - minVal) / (maxVal - minVal)) * gH;
                    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
                ctx.strokeStyle = color; ctx.lineWidth = thickness; ctx.stroke();
                if (fill) {
                    const lastX = gX + (dataPoints.length - 1) * stepX;
                    ctx.lineTo(lastX, gY + gH); ctx.lineTo(gX, gY + gH); ctx.closePath();
                    const fillGrad = ctx.createLinearGradient(0, gY, 0, gY + gH);
                    fillGrad.addColorStop(0, color); fillGrad.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = fillGrad; ctx.fill();
                }
            };

            if (state.vistaSingoleLinee) {
                drawHLine(state.storicoLinee.l1, '#ef4444', 8, false);
                drawHLine(state.storicoLinee.l2, '#3b82f6', 8, false);
                drawHLine(state.storicoLinee.l3, '#eab308', 8, false);
                drawHLine(state.storicoLinee.l4, '#22c55e', 8, false);

                ctx.font = '45px Inter';
                ctx.fillStyle = '#ef4444'; ctx.fillText("Linea Produzione 1", gX + 400, gY + gH + 180);
                ctx.fillStyle = '#3b82f6'; ctx.fillText("Condizionamento", gX + 1100, gY + gH + 180);
                ctx.fillStyle = '#eab308'; ctx.fillText("Illuminazione", gX + 1800, gY + gH + 180);
                ctx.fillStyle = '#22c55e'; ctx.fillText("Servizi Ausiliari", gX + 2500, gY + gH + 180);
            } else {
                drawHLine(state.storicoGlobale, '#06b6d4', 10, true);
                ctx.fillStyle = '#64748b'; ctx.font = '45px Inter';
                ctx.fillText("Passato", gX + 150, gY + gH + 180);
                ctx.fillText("Presente", gX + gW - 150, gY + gH + 180);
            }

            if (!isLandscapeDevice) ctx.restore();
            return;
        }

        // --- LAYOUT PORTRAIT (NORMALE) ---
        ctx.clearRect(0, 0, w, h);

        if (typeof isPinned !== 'undefined' && isPinned) {
            ctx.fillStyle = '#061325';
            ctx.fillRect(0, 0, w, h);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(0, 0, w, 360);
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
            ctx.beginPath();
            ctx.moveTo(0, 360);
            ctx.lineTo(w, 360);
            ctx.stroke();

            // Applicazione stili per dashboard pinnata (pagina web a tutto schermo, stile commit 51560b)
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
            // Ripristino stili originali
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

            ctx.fillStyle = 'rgba(13, 31, 60, 0.92)';
            ctx.beginPath();
            ctx.roundRect(0, 0, w, h, 60);
            ctx.fill();
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
            ctx.lineWidth = 6;
            ctx.stroke();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.beginPath();
            ctx.roundRect(0, 0, w, 360, { tl: 60, tr: 60, bl: 0, br: 0 });
            ctx.fill();
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
            ctx.beginPath();
            ctx.moveTo(0, 360);
            ctx.lineTo(w, 360);
            ctx.stroke();
        }

        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 100px Inter';
        ctx.textAlign = 'center';
        ctx.fillText("QUADRO ELETTRICO", w / 2, 160);

        ctx.fillStyle = '#06b6d4';
        ctx.font = 'bold 46px Inter';
        ctx.fillText(`ID: ${currentConfig.id_macchina || 'QE-01'}  ·  ${dati.testo_aggiornamento}`, w / 2, 260);

        let colorAllarme = '#22c55e';
        let testAllarme = "SISTEMA OK";

        if (dati.stato_allarme === 'CRITICO') {
            colorAllarme = '#ef4444'; testAllarme = "SOVRACCARICO";
        } else if (dati.stato_allarme === 'ATTENZIONE') {
            colorAllarme = '#facc15'; testAllarme = "ATTENZIONE POTENZA";
        }

        // 2. PANNELLO POTENZA
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.beginPath();
        ctx.roundRect(50, 420, 1400, 650, 40);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '60px Inter';
        ctx.textAlign = 'center';
        ctx.fillText("Potenza Attiva (P)", w / 2, 540);

        const valText = dati.potenza_kw.toString();
        ctx.font = 'bold 280px Inter';
        const valWidth = ctx.measureText(valText).width;

        ctx.fillStyle = dati.stato_allarme === 'NORMALE' ? '#06b6d4' : colorAllarme;
        ctx.textAlign = 'right';
        ctx.fillText(valText, w / 2 + valWidth / 2, 780);

        ctx.font = 'bold 90px Inter';
        ctx.textAlign = 'left';
        ctx.fillText("kW", w / 2 + valWidth / 2 + 20, 780);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#64748b';
        ctx.font = '50px Inter';
        ctx.fillText(`Soglia: ${currentConfig.soglia_kw || 135} kW  |  Stato: ${testAllarme}`, w / 2, 900);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '45px Inter';
        ctx.fillText(`U: ${dati.tensione_v} V   |   I: ${dati.corrente_a} A   |   Cos φ: ${dati.cos_phi}`, w / 2, 990);


        // 3. DISTRIBUZIONE CARICHI CON SPIE
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.beginPath();
        ctx.roundRect(50, 1130, 1400, 700, 40);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();

        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 60px Inter';
        ctx.fillText("DISTRIBUZIONE CARICHI", w / 2, 1240);

        let cy = 1380;
        const lineColors = ['#ef4444', '#3b82f6', '#eab308', '#22c55e'];
        dati.linee.forEach((linea, idx) => {
            const dotColor = lineColors[idx];
            ctx.save();
            ctx.shadowColor = dotColor; ctx.shadowBlur = 20;
            ctx.fillStyle = dotColor;
            ctx.beginPath(); ctx.arc(150, cy - 16, 22, 0, Math.PI * 2); ctx.fill();
            ctx.restore();

            ctx.fillStyle = '#94a3b8';
            ctx.font = '55px Inter';
            ctx.textAlign = 'left';
            ctx.fillText(linea.nome, 220, cy);

            let valColor = '#22c55e';
            if (linea.stato === 'ATTENZIONE') valColor = '#facc15';
            if (linea.stato === 'CRITICO') valColor = '#ef4444';

            ctx.fillStyle = valColor;
            ctx.textAlign = 'right';
            ctx.fillText(`${linea.p} kW`, 1350, cy);
            cy += 120;
        });

        // 4. GRAFICO EVOLUTIVO
        ctx.fillStyle = 'rgba(4, 15, 30, 0.5)';
        ctx.beginPath();
        ctx.roundRect(50, 1900, 1400, 1200, 40);
        ctx.fill();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
        ctx.stroke();

        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 60px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(state.vistaSingoleLinee ? "ANDAMENTO NEL TEMPO (SINGOLE LINEE)" : "ANDAMENTO POTENZA (TOTALE)", w / 2, 2030);

        let expBox = { x: 1250, y: 1920, w: 120, h: 120 };

        const isPinnedExp = typeof isPinned !== 'undefined' ? isPinned : (window.isPinned !== undefined ? window.isPinned : true);
        if (!isPinnedExp) ctx.globalAlpha = 0.4;

        ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
        ctx.beginPath();
        ctx.roundRect(expBox.x, expBox.y, expBox.w, expBox.h, 25);
        ctx.fill();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
        ctx.stroke();
        ctx.fillStyle = '#06b6d4';
        ctx.font = 'bold 80px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(isPinnedExp ? "⛶" : "🔒", expBox.x + expBox.w / 2, expBox.y + expBox.h / 2 + 27);

        if (!isPinnedExp) ctx.globalAlpha = 1.0;

        // Hitboxes Ripristinate Esattamente
        this.hitboxes.push({ id: "toggle_fs", x: 1150, y: 1820, w: 300, h: 300 });
        this.hitboxes.push({ id: "toggle_grafico", x: 50, y: 3200, w: 1400, h: 220 });
        this.hitboxes.push({ id: "dettaglio_kw", x: 50, y: 420, w: 1400, h: 650 });

        let gX = 200, gY = 2120, gW = 1150, gH = 800;

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(gX, gY + gH); ctx.lineTo(gX + gW, gY + gH);
        ctx.moveTo(gX, gY); ctx.lineTo(gX, gY + gH);
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 40px Inter';
        ctx.textAlign = 'left';
        ctx.fillText("Potenza [kW]", gX - 100, gY - 40);

        ctx.textAlign = 'center';
        ctx.fillText("Ore della giornata", gX + gW / 2, gY + gH + 110);

        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillStyle = '#64748b';
        ctx.font = '38px Inter';

        let minVal = 0, maxVal = state.vistaSingoleLinee ? 80 : 160, numSteps = 4;

        for (let i = 0; i <= numSteps; i++) {
            let val = minVal + (maxVal - minVal) * (i / numSteps);
            let y = (gY + gH) - (i / numSteps) * gH;

            ctx.beginPath(); ctx.moveTo(gX, y); ctx.lineTo(gX + gW, y); ctx.stroke();
            ctx.textAlign = 'right'; ctx.fillText(`${val}`, gX - 20, y + 10);
        }

        ctx.fillStyle = '#64748b';
        ctx.font = '32px Inter';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 3;
        for (let j = 0; j <= 24; j += 4) {
            let px = gX + (j / 24) * gW;
            ctx.textAlign = 'center'; ctx.fillText(`${j}:00`, px, gY + gH + 55);
            ctx.beginPath(); ctx.moveTo(px, gY + gH); ctx.lineTo(px, gY + gH + 15); ctx.stroke();
        }

        const drawHistoryLine = (dataPoints, color, thickness, fill) => {
            if (!dataPoints || dataPoints.length === 0) return;
            ctx.beginPath();
            let stepX = gW / 96;

            for (let i = 0; i < dataPoints.length; i++) {
                let px = gX + i * stepX;
                let valToDraw = Math.min(dataPoints[i], maxVal);
                let py = (gY + gH) - ((valToDraw - minVal) / (maxVal - minVal)) * gH;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.strokeStyle = color; ctx.lineWidth = thickness; ctx.stroke();

            if (fill) {
                const lastX = gX + (dataPoints.length - 1) * stepX;
                ctx.lineTo(lastX, gY + gH); ctx.lineTo(gX, gY + gH); ctx.closePath();
                const fillGrad = ctx.createLinearGradient(0, gY, 0, gY + gH);
                fillGrad.addColorStop(0, color); fillGrad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = fillGrad; ctx.fill();
            }
        };

        if (state.vistaSingoleLinee) {
            drawHistoryLine(state.storicoLinee.l1, '#ef4444', 8, false);
            drawHistoryLine(state.storicoLinee.l2, '#3b82f6', 8, false);
            drawHistoryLine(state.storicoLinee.l3, '#eab308', 8, false);
            drawHistoryLine(state.storicoLinee.l4, '#22c55e', 8, false);
        } else {
            drawHistoryLine(state.storicoGlobale, '#06b6d4', 10, true);
        }

        // 5. PULSANTE TOGGLE GRAFICO
        const box = this.hitboxes.find(h => h.id === "toggle_grafico");
        if (box) {
            ctx.save();
            const btnGrad = ctx.createLinearGradient(box.x, box.y, box.x + box.w, box.y + box.h);
            btnGrad.addColorStop(0, '#06b6d4');
            btnGrad.addColorStop(1, '#0891b2');
            ctx.fillStyle = btnGrad;
            ctx.shadowColor = 'rgba(6, 182, 212, 0.4)';
            ctx.shadowBlur = 20;

            const isPinnedTog = typeof isPinned !== 'undefined' ? isPinned : (window.isPinned !== undefined ? window.isPinned : true);
            if (!isPinnedTog) ctx.globalAlpha = 0.4;

            ctx.beginPath(); ctx.roundRect(box.x, box.y, box.w, box.h, 50); ctx.fill();
            ctx.restore();

            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.font = 'bold 60px Inter';
            ctx.fillText(!isPinnedTog ? "🔒 MODIFICA GRAFICO" : (state.vistaSingoleLinee ? "🔄 TORNA A GRAFICO GLOBALE" : "📈 VEDI STORICO SINGOLE LINEE"), box.x + box.w / 2, box.y + box.h / 2 + 22);

            if (!isPinnedTog) ctx.globalAlpha = 1.0;
        }
    },

    processClick: function (boxId) {
        // Gestione Click Tabella Manutenzione
        if (boxId.startsWith("riga_")) {
            const indexRiga = parseInt(boxId.split("_")[1]);
            if (window.QuadroElGlobalState.selectedRowIndex === indexRiga) {
                window.QuadroElGlobalState.selectedRowIndex = null;
            } else {
                window.QuadroElGlobalState.selectedRowIndex = indexRiga;
            }
            return;
        }

        // Gestione Click Dashboard Originale
        if (boxId === "toggle_grafico") {
            if (window.QuadroElGlobalState) {
                window.QuadroElGlobalState.vistaSingoleLinee = !window.QuadroElGlobalState.vistaSingoleLinee;
            }
        } else if (boxId === "toggle_fs") {
            if (window.QuadroElGlobalState) {
                window.QuadroElGlobalState.isFullscreen = !window.QuadroElGlobalState.isFullscreen;
                if (window.QuadroElGlobalState.isFullscreen) {
                    try { document.documentElement.requestFullscreen(); } catch (e) { }
                    try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape'); } catch (e) { }
                } else {
                    try { document.exitFullscreen(); } catch (e) { }
                }
            }
        } else if (boxId === "dettaglio_kw") {
            if (!window.QuadroElGlobalState.isFullscreen && typeof window.apriDettaglio === "function") {
                window.apriDettaglio("benchmark_energia");
            }
        }
    }
};