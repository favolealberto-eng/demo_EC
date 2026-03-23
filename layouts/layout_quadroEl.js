/**
 * LayoutQuadroEl - Dashboard Energetica per Quadro Elettrico Principale.
 * 
 * Simula i flussi di corrente (kW, Volts, Amperes) e disegna grafici storici 
 * custom-built su Canvas API. Ha uno state controller interno (QuadroElGlobalState)
 * per switchare tra vista globale e spacchettamento per singole linee produttive.
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
    
    /**
     * fetchDati - Inizializza o recupera lo state globale Singleton.
     * Crea proceduralmente 96 slot di dati (quarti d'ora) spalmati sulle 24h
     * simulando carichi realistici su 4 linee di distribuzione differenti.
     */
    fetchDati: function(callback) {
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
            
            window.QuadroElGlobalState = {
                curvaIdealeGlobale: history,
                curvaIdealeLinee: { l1: hL1, l2: hL2, l3: hL3, l4: hL4 },
                storicoGlobale: [],
                storicoLinee: { l1: [], l2: [], l3: [], l4: [] },
                vistaSingoleLinee: false
            };
        }

        const now = new Date();
        const currentSlotIndex = Math.floor(now.getHours() * 4 + now.getMinutes() / 15);
        
        const state = window.QuadroElGlobalState;
        
        // Lo storico fisso comprende gli slot fino all'orario attuale compreso
        state.storicoGlobale = state.curvaIdealeGlobale.slice(0, currentSlotIndex + 1);
        state.storicoLinee.l1 = state.curvaIdealeLinee.l1.slice(0, currentSlotIndex + 1);
        state.storicoLinee.l2 = state.curvaIdealeLinee.l2.slice(0, currentSlotIndex + 1);
        state.storicoLinee.l3 = state.curvaIdealeLinee.l3.slice(0, currentSlotIndex + 1);
        state.storicoLinee.l4 = state.curvaIdealeLinee.l4.slice(0, currentSlotIndex + 1);
        
        // Preleviamo coerentemente i valori dell'istante i-esimo (corrente al 15 min mark)
        const potenzaAttuale = state.curvaIdealeGlobale[currentSlotIndex].toFixed(1);
        const line1 = state.curvaIdealeLinee.l1[currentSlotIndex].toFixed(1);
        const line2 = state.curvaIdealeLinee.l2[currentSlotIndex].toFixed(1);
        const line3 = state.curvaIdealeLinee.l3[currentSlotIndex].toFixed(1);
        const line4 = state.curvaIdealeLinee.l4[currentSlotIndex].toFixed(1);

        const tensione = (398.5).toFixed(1); 
        const corrente = (potenzaAttuale * 1000 / (Math.sqrt(3) * tensione * 0.9)).toFixed(1); 
        
        let stato_allarme = parseFloat(potenzaAttuale) > 135 ? 'CRITICO' : (parseFloat(potenzaAttuale) > 120 ? 'ATTENZIONE' : 'NORMALE');

        // Calcolo testo dell'aggiornamento (es: Ultimo aggiornamento ore 16:30, ora attuale 16:36)
        const h_sync = Math.floor(currentSlotIndex / 4).toString().padStart(2, '0');
        const m_sync = ((currentSlotIndex % 4) * 15).toString().padStart(2, '0');
        const str_ultimo_aggiornamento = `${h_sync}:${m_sync}`;
        const str_ora_attuale = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        
        const testoAggiornamento = `Ultimo agg. ore ${str_ultimo_aggiornamento} (attuale ${str_ora_attuale})`;

        callback({
            potenza_kw: parseFloat(potenzaAttuale),
            tensione_v: parseFloat(tensione),
            corrente_a: parseFloat(corrente),
            cos_phi: 0.92,
            stato_allarme: stato_allarme,
            testo_aggiornamento: testoAggiornamento,
            linee: [
                { nome: 'Linea Produzione 1', p: parseFloat(line1), alert: parseFloat(line1) > 50 },
                { nome: 'Condizionamento / HVAC', p: parseFloat(line2), alert: parseFloat(line2) > 35 },
                { nome: 'Prese e Illuminazione', p: parseFloat(line3), alert: parseFloat(line3) > 25 },
                { nome: 'Servizi Ausiliari / Altro', p: parseFloat(line4), alert: parseFloat(line4) > 30 }
            ]
        });
    },
    /**
     * draw - Motore di tracciamento UI Canvas.
     * Rendering intensivo per i grafici cartesiani lineari (drawHistoryLine)
     * e gestione del toggle button per lo switch del grafico.
     */
    draw: function(ctx, dati, currentConfig) {
        const w = this.config.canvasW;
        const h = this.config.canvasH;
        
        ctx.clearRect(0, 0, w, h);
        
        if (typeof window.isPinned !== 'undefined' && window.isPinned) {
            // Sfondo piatto senza bordi stondati per simulare un sito web
            ctx.fillStyle = '#061325';
            ctx.fillRect(0, 0, w, h);
            
            // 1. HEADER (Piatto)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(0, 0, w, 360);
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
            ctx.beginPath();
            ctx.moveTo(0, 360);
            ctx.lineTo(w, 360);
            ctx.stroke();
        } else {
            // Sfondo dark glassmorphism per AR
            ctx.fillStyle = 'rgba(13, 31, 60, 0.92)';
            ctx.beginPath();
            ctx.roundRect(0, 0, w, h, 60);
            ctx.fill();
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
            ctx.lineWidth = 6;
            ctx.stroke();

            // 1. HEADER (Stondato in alto)
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
        ctx.fillText("QUADRO ELETTRICO", w/2, 160);
        
        ctx.fillStyle = '#06b6d4';
        ctx.font = 'bold 46px Inter';
        ctx.fillText(`ID: ${currentConfig.id_macchina || 'QE-01'}  ·  ${dati.testo_aggiornamento}`, w/2, 260);

        // INDICATORE ALLARME
        let colorAllarme = '#22c55e';
        let glowAllarme = 'rgba(34, 197, 94, 0.6)';
        let testAllarme = "SISTEMA OK";
        
        if (dati.stato_allarme === 'CRITICO') {
            colorAllarme = '#ef4444';
            glowAllarme = 'rgba(239, 68, 68, 0.8)';
            testAllarme = "SOVRACCARICO";
        } else if (dati.stato_allarme === 'ATTENZIONE') {
            colorAllarme = '#facc15'; 
            glowAllarme = 'rgba(250, 204, 21, 0.6)';
            testAllarme = "ATTENZIONE POTENZA";
        }

        // 2. PANNELLO POTENZA (Vertical Layout)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.beginPath();
        ctx.roundRect(50, 420, 1400, 650, 40);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '60px Inter';
        ctx.textAlign = 'center';
        ctx.fillText("Potenza Attiva (P)", w/2, 540);
        
        // FIX: Unità di misura sovrapposta
        const valText = dati.potenza_kw.toString();
        ctx.font = 'bold 280px Inter';
        const valWidth = ctx.measureText(valText).width;
        
        ctx.fillStyle = dati.stato_allarme === 'NORMALE' ? '#06b6d4' : colorAllarme;
        ctx.textAlign = 'right';
        ctx.fillText(valText, w/2 + valWidth/2, 780);
        
        ctx.font = 'bold 90px Inter';
        ctx.textAlign = 'left';
        ctx.fillText("kW", w/2 + valWidth/2 + 20, 780);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#64748b';
        ctx.font = '50px Inter';
        ctx.fillText(`Soglia: ${currentConfig.soglia_kw || 135} kW  |  Stato: ${testAllarme}`, w/2, 900);
        
        ctx.fillStyle = '#94a3b8';
        ctx.font = '45px Inter';
        ctx.fillText(`U: ${dati.tensione_v} V   |   I: ${dati.corrente_a} A   |   Cos φ: ${dati.cos_phi}`, w/2, 990);


        // 3. DISTRIBUZIONE CARICHI CON SPIE
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.beginPath();
        ctx.roundRect(50, 1130, 1400, 700, 40);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();

        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 60px Inter';
        ctx.fillText("DISTRIBUZIONE CARICHI", w/2, 1240);
        
        let cy = 1380;
        dati.linee.forEach(linea => {
            // Spia colorata
            const dotColor = linea.alert ? '#facc15' : '#22c55e';
            ctx.save();
            ctx.shadowColor = dotColor;
            ctx.shadowBlur = 20;
            ctx.fillStyle = dotColor;
            ctx.beginPath();
            ctx.arc(150, cy - 16, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            ctx.fillStyle = '#94a3b8';
            ctx.font = '55px Inter';
            ctx.textAlign = 'left';
            ctx.fillText(linea.nome, 220, cy);
            
            ctx.fillStyle = '#06b6d4';
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

        const state = window.QuadroElGlobalState;
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 60px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(state.vistaSingoleLinee ? "ANDAMENTO NEL TEMPO (SINGOLE LINEE)" : "ANDAMENTO POTENZA (TOTALE)", w/2, 2030);

        let gX = 200;
        let gY = 2120;
        let gW = 1150;
        let gH = 800;

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 4;
        ctx.beginPath();
        // Asse X
        ctx.moveTo(gX, gY + gH);
        ctx.lineTo(gX + gW, gY + gH);
        // Asse Y principale
        ctx.moveTo(gX, gY);
        ctx.lineTo(gX, gY + gH);
        ctx.stroke();

        // Nomi degli assi
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 40px Inter';
        ctx.textAlign = 'left';
        ctx.fillText("Potenza [kW]", gX - 100, gY - 40); // Etichetta Asse Y superiore
        
        ctx.textAlign = 'center';
        ctx.fillText("Ore della giornata", gX + gW/2, gY + gH + 110); // Etichetta Asse X

        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillStyle = '#64748b';
        ctx.font = '38px Inter';
        
        let minVal = 0;
        let maxVal = state.vistaSingoleLinee ? 80 : 160;
        let numSteps = 4;
        
        for(let i=0; i<=numSteps; i++) {
            let val = minVal + (maxVal - minVal) * (i / numSteps);
            let y = (gY + gH) - (i / numSteps) * gH;
            
            ctx.beginPath();
            ctx.moveTo(gX, y);
            ctx.lineTo(gX + gW, y);
            ctx.stroke();
            
            ctx.textAlign = 'right';
            ctx.fillText(`${val}`, gX - 20, y + 10);
        }

        // Funzione per disegnare una singola linea dati (fissata su 96 step (24hx4))
        const drawHistoryLine = (dataPoints, color, thickness, fill) => {
            if(!dataPoints || dataPoints.length === 0) return;
            ctx.beginPath();
            
            // Usiamo 96 come asse fisso per l'intera giornata in modo che la linea si "interrompa" all'orario attuale.
            let stepX = gW / 96; 
            
            for(let i=0; i<dataPoints.length; i++) {
                let px = gX + i * stepX;
                let valToDraw = Math.min(dataPoints[i], maxVal);
                let py = (gY + gH) - ((valToDraw - minVal) / (maxVal - minVal)) * gH;
                if(i===0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = thickness;
            ctx.stroke();
            
            if (fill) {
                // Rientro giù sulla x dell'ultimo punto calcolato
                const lastX = gX + (dataPoints.length - 1) * stepX;
                ctx.lineTo(lastX, gY + gH);
                ctx.lineTo(gX, gY + gH);
                ctx.closePath();
                const fillGrad = ctx.createLinearGradient(0, gY, 0, gY + gH);
                fillGrad.addColorStop(0, color);
                fillGrad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = fillGrad;
                ctx.fill();
            }
        };

        if (state.vistaSingoleLinee) {
            drawHistoryLine(state.storicoLinee.l1, '#ef4444', 8, false); // Rosso
            drawHistoryLine(state.storicoLinee.l2, '#3b82f6', 8, false); // Blu
            drawHistoryLine(state.storicoLinee.l3, '#eab308', 8, false); // Giallo
            drawHistoryLine(state.storicoLinee.l4, '#22c55e', 8, false); // Verde
            
            // Legenda
            ctx.font = '38px Inter';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ef4444'; ctx.fillText("L1", gX + 200, gY + gH + 80);
            ctx.fillStyle = '#3b82f6'; ctx.fillText("L2", gX + 450, gY + gH + 80);
            ctx.fillStyle = '#eab308'; ctx.fillText("L3", gX + 700, gY + gH + 80);
            ctx.fillStyle = '#22c55e'; ctx.fillText("L4", gX + 950, gY + gH + 80);
        } else {
            drawHistoryLine(state.storicoGlobale, '#06b6d4', 10, true); // Ciano
            ctx.fillStyle = '#64748b';
            ctx.font = '40px Inter';
            ctx.textAlign = 'center';
            ctx.fillText("Passato", gX + 150, gY + gH + 80);
            ctx.fillText("Presente", gX + gW - 150, gY + gH + 80);
        }

        // 5. PULSANTE TOGGLE GRAFICO
        const box = this.hitboxes[0];
        ctx.save();
        const btnGrad = ctx.createLinearGradient(box.x, box.y, box.x + box.w, box.y + box.h);
        btnGrad.addColorStop(0, '#06b6d4');
        btnGrad.addColorStop(1, '#0891b2');
        ctx.fillStyle = btnGrad;
        ctx.shadowColor = 'rgba(6, 182, 212, 0.4)';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.roundRect(box.x, box.y, box.w, box.h, 50);
        ctx.fill();
        ctx.restore();
        
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 60px Inter';
        ctx.fillText(state.vistaSingoleLinee ? "🔄 TORNA A GRAFICO GLOBALE" : "📈 VEDI STORICO SINGOLE LINEE", box.x + box.w/2, box.y + box.h/2 + 22);
    },
    
    processClick: function(boxId) {
        if (boxId === "toggle_grafico") {
            if (window.QuadroElGlobalState) {
                window.QuadroElGlobalState.vistaSingoleLinee = !window.QuadroElGlobalState.vistaSingoleLinee;
            }
        } else if (boxId === "dettaglio_kw") {
            if (typeof window.apriDettaglio === "function") {
                window.apriDettaglio("benchmark_energia"); // Utilizziamo benchmark energia come indicatore di dettaglio
            }
        }
    }
};
