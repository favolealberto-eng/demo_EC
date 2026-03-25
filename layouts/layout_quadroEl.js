/**
 * LayoutQuadroEl - Dashboard Energetica e Registro Manutenzioni Orizzontale.
 */
window.LayoutQuadroEl = {
    // Configurazioni di base (verranno sovrascritte dinamicamente)
    config: {
        canvasW: 1500,
        canvasH: 3600,
        planeW: 3.0,
        planeH: 7.2
    },
    hitboxes: [],

    fetchDati: function (callback) {
        if (!window.QuadroElGlobalState) {
            const history = [];
            const hL1 = [], hL2 = [], hL3 = [], hL4 = [];

            // Genera curva giornaliera
            for (let i = 0; i < 96; i++) {
                const hour = i / 4;
                let pBase = 50;
                if (hour >= 6 && hour < 9) pBase = 50 + (110 - 50) * ((hour - 6) / 3);
                else if (hour >= 9 && hour < 17) pBase = 120 + Math.random() * 20;
                else if (hour >= 17 && hour < 20) pBase = 110 - (110 - 80) * ((hour - 17) / 3);
                else if (hour >= 20) pBase = 80 - (80 - 50) * ((hour - 20) / 4);
                let v = pBase + (Math.random() * 5 - 2.5);

                history.push(v);
                hL1.push(v * 0.4); hL2.push(v * 0.25); hL3.push(v * 0.15); hL4.push(v * 0.2);
            }

            // DATI MOCK DELLA MANUTENZIONE (Aggiunta colonna Scadenza)
            let interventiManutenzione = [
                { data: "15/03/2026", operazione: "Sostituzione fusibile rapido L1 e pulizia contatti", scadenza: "15/03/2027", operatore: "Mario Rossi" },
                { data: "02/02/2026", operazione: "Serraggio dinamometrico morsettiere generali", scadenza: "02/02/2028", operatore: "Luigi Bianchi" },
                { data: "12/11/2025", operazione: "Test intervento interruttori differenziali (RCD)", scadenza: "12/05/2026", operatore: "Anna Neri" },
                { data: "05/09/2025", operazione: "Analisi termografica componenti quadro principale", scadenza: "05/09/2026", operatore: "Mario Rossi" },
                { data: "22/05/2025", operazione: "Pulizia e aspirazione filtri ventilazione armadio", scadenza: "22/11/2025", operatore: "Luigi Bianchi" },
                { data: "10/01/2025", operazione: "Taratura relè termici salvamotori linee esterne", scadenza: "10/01/2026", operatore: "Ditta Esterna SpA" },
                { data: "18/12/2024", operazione: "Sostituzione scaricatori di sovratensione (SPD)", scadenza: "18/12/2029", operatore: "Anna Neri" }
            ];

            // ORDINAMENTO AUTOMATICO: Dalla data più recente alla meno recente
            const parseDate = (d) => { const [G, M, A] = d.split('/'); return new Date(A, M - 1, G).getTime(); };
            interventiManutenzione.sort((a, b) => parseDate(b.data) - parseDate(a.data));

            window.QuadroElGlobalState = {
                curvaIdealeGlobale: history,
                curvaIdealeLinee: { l1: hL1, l2: hL2, l3: hL3, l4: hL4 },
                storicoGlobale: [],
                storicoLinee: { l1: [], l2: [], l3: [], l4: [] },
                vistaSingoleLinee: false,
                isFullscreen: false,
                vistaTabella: false,
                selectedRowIndex: null, // Indice riga evidenziata
                registroManutenzioni: interventiManutenzione
            };
        }

        const now = new Date();
        const currentSlotIndex = Math.floor(now.getHours() * 4 + now.getMinutes() / 15);
        const state = window.QuadroElGlobalState;

        state.storicoGlobale = state.curvaIdealeGlobale.slice(0, currentSlotIndex + 1);
        state.storicoLinee.l1 = state.curvaIdealeLinee.l1.slice(0, currentSlotIndex + 1);
        state.storicoLinee.l2 = state.curvaIdealeLinee.l2.slice(0, currentSlotIndex + 1);
        state.storicoLinee.l3 = state.curvaIdealeLinee.l3.slice(0, currentSlotIndex + 1);
        state.storicoLinee.l4 = state.curvaIdealeLinee.l4.slice(0, currentSlotIndex + 1);

        const potenzaAttuale = state.curvaIdealeGlobale[currentSlotIndex].toFixed(1);
        const tensione = (398.5).toFixed(1);
        const corrente = (potenzaAttuale * 1000 / (Math.sqrt(3) * tensione * 0.9)).toFixed(1);

        let stato_allarme = parseFloat(potenzaAttuale) > 135 ? 'CRITICO' : (parseFloat(potenzaAttuale) > 120 ? 'ATTENZIONE' : 'NORMALE');
        const h_sync = Math.floor(currentSlotIndex / 4).toString().padStart(2, '0');
        const m_sync = ((currentSlotIndex % 4) * 15).toString().padStart(2, '0');

        callback({
            potenza_kw: parseFloat(potenzaAttuale),
            tensione_v: parseFloat(tensione),
            corrente_a: parseFloat(corrente),
            cos_phi: 0.92,
            stato_allarme: stato_allarme,
            testo_aggiornamento: `Ultimo agg. ore ${h_sync}:${m_sync}`
        });
    },

    draw: function (ctx, dati, currentConfig) {
        const state = window.QuadroElGlobalState;
        this.hitboxes = [];

        // Recuperiamo l'identificativo del marker dal canvas attuale (es. canvas-QE01 -> QE01)
        const markerId = ctx.canvas.id.replace('canvas-', '');
        const plane3D = document.getElementById('plane-' + markerId);

        // ---------------------------------------------------------
        // RAMO A: VISTA TABELLA MANUTENZIONE (Formato Orizzontale / Excel)
        // ---------------------------------------------------------
        if (state.vistaTabella) {
            // Calcoliamo dinamicamente altezza e larghezza
            const rowHeight = 120;
            const headerHeight = 300;
            const paddingBottom = 100;
            const W_TAB = 2800; // Molto largo per permettere lettura comoda
            const H_TAB = headerHeight + (state.registroManutenzioni.length * rowHeight) + paddingBottom;

            // Applichiamo il resize fisico al Canvas 2D e all'oggetto 3D
            if (ctx.canvas.width !== W_TAB || ctx.canvas.height !== H_TAB) {
                ctx.canvas.width = W_TAB;
                ctx.canvas.height = H_TAB;
                if (plane3D) {
                    plane3D.setAttribute('width', 6.0); // Raddoppia la larghezza in AR
                    plane3D.setAttribute('height', 6.0 * (H_TAB / W_TAB)); // Proporzione esatta
                }
            }

            ctx.clearRect(0, 0, W_TAB, H_TAB);

            // Sfondo Dark
            ctx.fillStyle = 'rgba(13, 31, 60, 0.95)';
            ctx.beginPath(); ctx.roundRect(0, 0, W_TAB, H_TAB, 40); ctx.fill();
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
            ctx.lineWidth = 6; ctx.stroke();

            // Header Titolo
            ctx.fillStyle = '#061325';
            ctx.beginPath(); ctx.roundRect(0, 0, W_TAB, 180, { tl: 40, tr: 40, bl: 0, br: 0 }); ctx.fill();
            ctx.fillStyle = '#f1f5f9';
            ctx.font = 'bold 70px Inter';
            ctx.textAlign = 'left';
            ctx.fillText(`🔧 REGISTRO MANUTENZIONI - ID: ${currentConfig.id_macchina || 'QE-01'}`, 80, 115);

            // Intestazione Colonne (Stile Excel)
            const colData = 80;
            const colOp = 450;
            const colScad = 1800;
            const colOpe = 2300;

            let startY = 250;
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 45px Inter';
            ctx.fillText("DATA INT.", colData, startY);
            ctx.fillText("DESCRIZIONE OPERAZIONE", colOp, startY);
            ctx.fillText("PROX. SCADENZA", colScad, startY);
            ctx.fillText("OPERATORE", colOpe, startY);

            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(40, startY + 30); ctx.lineTo(W_TAB - 40, startY + 30); ctx.stroke();

            // Disegno Righe
            startY += 40;
            state.registroManutenzioni.forEach((intervento, index) => {
                const yRiga = startY + (index * rowHeight);

                // Evidenziazione Riga Selezionata
                if (state.selectedRowIndex === index) {
                    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)'; // Azzurro illuminato
                    ctx.fillRect(10, yRiga, W_TAB - 20, rowHeight);
                    // Bordo laterale
                    ctx.fillStyle = '#38bdf8';
                    ctx.fillRect(10, yRiga, 15, rowHeight);
                } else {
                    // Zebratura righe alternata
                    ctx.fillStyle = index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0)';
                    ctx.fillRect(10, yRiga, W_TAB - 20, rowHeight);
                }

                // Hitbox della riga intera
                this.hitboxes.push({ id: `riga_${index}`, x: 10, y: yRiga, w: W_TAB - 20, h: rowHeight });

                // Testi Riga
                ctx.textBaseline = 'middle';
                const tY = yRiga + (rowHeight / 2);

                ctx.fillStyle = '#e2e8f0';
                ctx.font = 'bold 44px Inter';
                ctx.fillText(intervento.data, colData, tY);

                ctx.fillStyle = '#f8fafc';
                ctx.font = '44px Inter';
                ctx.fillText(intervento.operazione, colOp, tY);

                // Check Scadenza (se è passata o molto vicina la facciamo rossa/gialla)
                const parseDate = (d) => { const [G, M, A] = d.split('/'); return new Date(A, M - 1, G).getTime(); };
                const oggi = new Date().getTime();
                const scad = parseDate(intervento.scadenza);
                const giorniRimasti = (scad - oggi) / (1000 * 3600 * 24);

                if (giorniRimasti < 0) ctx.fillStyle = '#ef4444'; // Scaduta (Rosso)
                else if (giorniRimasti < 60) ctx.fillStyle = '#facc15'; // In scadenza (Giallo)
                else ctx.fillStyle = '#22c55e'; // Ok (Verde)

                ctx.font = 'bold 44px Inter';
                ctx.fillText(intervento.scadenza, colScad, tY);

                ctx.fillStyle = '#94a3b8';
                ctx.font = '42px Inter';
                ctx.fillText(intervento.operatore, colOpe, tY);

                ctx.textBaseline = 'alphabetic'; // Reset baseline

                // Griglia separatoria fine riga
                ctx.strokeStyle = 'rgba(255,255,255,0.05)';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(40, yRiga + rowHeight); ctx.lineTo(W_TAB - 40, yRiga + rowHeight); ctx.stroke();
            });

            return; // Fine disegno Tabella
        }

        // ---------------------------------------------------------
        // RAMO B: VISTA DASHBOARD ENERGETICA (Verticale Originale)
        // ---------------------------------------------------------
        const w = 1500;
        const h = 3600;

        // Ripristina proporzioni verticali per AR e Canvas
        if (ctx.canvas.width !== w || ctx.canvas.height !== h) {
            ctx.canvas.width = w;
            ctx.canvas.height = h;
            if (plane3D) {
                plane3D.setAttribute('width', 3.0);
                plane3D.setAttribute('height', 7.2);
            }
        }

        ctx.clearRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(13, 31, 60, 0.92)';
        ctx.beginPath(); ctx.roundRect(0, 0, w, h, 60); ctx.fill();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
        ctx.lineWidth = 6; ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath(); ctx.roundRect(0, 0, w, 360, { tl: 60, tr: 60, bl: 0, br: 0 }); ctx.fill();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
        ctx.beginPath(); ctx.moveTo(0, 360); ctx.lineTo(w, 360); ctx.stroke();

        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 100px Inter';
        ctx.textAlign = 'center';
        ctx.fillText("QUADRO ELETTRICO", w / 2, 160);

        ctx.fillStyle = '#06b6d4';
        ctx.font = 'bold 46px Inter';
        ctx.fillText(`ID: ${currentConfig.id_macchina || 'QE-01'}  ·  ${dati.testo_aggiornamento}`, w / 2, 260);

        // PANNELLO POTENZA
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.beginPath(); ctx.roundRect(50, 420, 1400, 650, 40); ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '60px Inter';
        ctx.fillText("Potenza Attiva Attuale", w / 2, 540);

        ctx.fillStyle = dati.stato_allarme === 'NORMALE' ? '#06b6d4' : (dati.stato_allarme === 'CRITICO' ? '#ef4444' : '#facc15');
        ctx.font = 'bold 280px Inter';
        ctx.fillText(`${dati.potenza_kw} kW`, w / 2, 800);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '45px Inter';
        ctx.fillText(`U: ${dati.tensione_v} V   |   I: ${dati.corrente_a} A   |   Cos φ: ${dati.cos_phi}`, w / 2, 990);

        // GRAFICO
        ctx.fillStyle = 'rgba(4, 15, 30, 0.5)';
        ctx.beginPath(); ctx.roundRect(50, 1150, 1400, 1200, 40); ctx.fill();

        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 60px Inter';
        ctx.fillText("ANDAMENTO POTENZA (24H)", w / 2, 1280);

        let gX = 200, gY = 1380, gW = 1150, gH = 800;
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(gX, gY + gH); ctx.lineTo(gX + gW, gY + gH); ctx.moveTo(gX, gY); ctx.lineTo(gX, gY + gH); ctx.stroke();

        ctx.fillStyle = '#94a3b8'; ctx.font = '38px Inter';
        for (let i = 0; i <= 4; i++) {
            let val = 0 + (160 - 0) * (i / 4);
            let y = (gY + gH) - (i / 4) * gH;
            ctx.textAlign = 'right'; ctx.fillText(`${val}`, gX - 20, y + 10);
        }
        for (let j = 0; j <= 24; j += 4) {
            let px = gX + (j / 24) * gW;
            ctx.textAlign = 'center'; ctx.fillText(`${j}:00`, px, gY + gH + 55);
        }

        if (state.storicoGlobale && state.storicoGlobale.length > 0) {
            ctx.beginPath();
            let stepX = gW / 96;
            for (let i = 0; i < state.storicoGlobale.length; i++) {
                let px = gX + i * stepX;
                let py = (gY + gH) - (Math.min(state.storicoGlobale[i], 160) / 160) * gH;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 10; ctx.stroke();
        }
    },

    processClick: function (boxId) {
        // Se l'utente tocca una riga della tabella manutenzioni
        if (boxId.startsWith("riga_")) {
            const indexRiga = parseInt(boxId.split("_")[1]);

            // Toggle della selezione (se clicca la riga già selezionata la deseleziona, altrimenti la seleziona)
            if (window.QuadroElGlobalState.selectedRowIndex === indexRiga) {
                window.QuadroElGlobalState.selectedRowIndex = null;
            } else {
                window.QuadroElGlobalState.selectedRowIndex = indexRiga;
            }
        }
    }
};