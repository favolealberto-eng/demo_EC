/**
 * LayoutMacchina - Modulo AR per il monitoraggio energetico dei macchinari pesanti.
 * 
 * Basato sullo standard ISO 50001, confronta la Potenza Istantanea (kW) e il 
 * consumo giornaliero simulato con le Baseline di Efficienza Energetica (EnPI).
 */
window.LayoutMacchina = {
    config: {
        canvasW: 800,
        canvasH: 1600,
        planeW: 2.4,
        planeH: 4.8
    },
    hitboxes: [
        { id: "benchmark_energia", x: 50, y: 1420, w: 700, h: 120 }
    ],

    /**
     * fetchDati - Wrapper di simulazione API MQTT/OPC-UA.
     * Genera un profilo di potenza scalando un array base in base all'ora corrente.
     */
    fetchDati: function(callback) {
        const now = new Date();
        const currentSlotIndex = Math.floor(now.getHours() * 4 + now.getMinutes() / 15);
        const pArray = window.getMockDayData ? window.getMockDayData('benchmark_energia') : [];
        const basePotenza = pArray.length > currentSlotIndex ? parseFloat(pArray[currentSlotIndex]) : 13.0;
        
        const potenza_kw = (basePotenza * 3).toFixed(1); 
        const efficienza = (85 + (basePotenza % 5)).toFixed(1); 
        const consumo = Math.round(basePotenza * 8).toFixed(1);
        const ore = 8.5; 
        
        const h_sync = Math.floor(currentSlotIndex / 4).toString().padStart(2, '0');
        const m_sync = ((currentSlotIndex % 4) * 15).toString().padStart(2, '0');
        const str_ora_attuale = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        const testoAggiornamento = `Ultimo agg. ore ${h_sync}:${m_sync} (attuale ${str_ora_attuale})`;

        callback({
            potenza_kw: parseFloat(potenza_kw),
            consumo_giornaliero_kwh: parseFloat(consumo),
            efficienza_perc: parseFloat(efficienza),
            ore_operative: parseFloat(ore),
            baseline_enpi: 12.5,
            enpi_attuale: (basePotenza).toFixed(1),
            testo_aggiornamento: testoAggiornamento
        });
    },
    /**
     * draw - Rendering HUD industriale.
     * Gestisce i livelli di Alert in base alla percentuale di Power Load 
     * e disegna il cruscotto KPI per gli audit ISO 50001.
     */
    draw: function(ctx, dati, currentConfig) {
        const w = this.config.canvasW;
        const h = this.config.canvasH;
        
        ctx.clearRect(0, 0, w, h);

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

        
        // Sfondo dark glassmorphism
        const bgGrad = ctx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, '#0d1f3c');
        bgGrad.addColorStop(0.5, '#0f2d1f');
        bgGrad.addColorStop(1, '#0d1f3c');
        ctx.fillStyle = bgGrad;
        ctx.beginPath();
        ctx.roundRect(0, 0, w, h, 40);
        ctx.fill();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Header
        const hdrGrad = ctx.createLinearGradient(10, 10, w - 10, 10);
        hdrGrad.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
        hdrGrad.addColorStop(1, 'rgba(8, 145, 178, 0.2)');
        ctx.fillStyle = hdrGrad;
        ctx.beginPath();
        ctx.roundRect(0, 0, w, 130, { tl: 40, tr: 40, bl: 0, br: 0 });
        ctx.fill();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.beginPath();
        ctx.moveTo(0, 130);
        ctx.lineTo(w, 130);
        ctx.stroke();

        // Titolo Macchina
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 38px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 8;
        ctx.fillText((currentConfig.nome || "Macchinario").toUpperCase(), w/2, 70);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = '24px Inter, sans-serif';
        ctx.fillText((dati.testo_aggiornamento || "").toUpperCase(), w/2, 110);

        // Spia di Allarme
        const soglia = currentConfig.soglia_kw || 45;
        const perc = dati.potenza_kw / soglia;
        let colorSemaforo = '#22c55e'; // Verde
        let glowSemaforo = 'rgba(34, 197, 94, 0.5)';
        if (perc >= 0.9) {
            colorSemaforo = '#ef4444'; // Rosso (oltre 90%)
            glowSemaforo = 'rgba(239, 68, 68, 0.5)';
        } else if (perc >= 0.7) {
            colorSemaforo = '#facc15'; // Giallo (70-90%)
            glowSemaforo = 'rgba(250, 204, 21, 0.5)';
        }
        ctx.save();
        ctx.shadowColor = glowSemaforo;
        ctx.shadowBlur = 20;
        ctx.fillStyle = colorSemaforo;
        ctx.beginPath();
        ctx.arc(w - 60, 65, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // SEZIONE 1: KPI Energetici
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.beginPath();
        ctx.roundRect(50, 160, 700, 440, 24);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();

        ctx.textAlign = 'left';
        let offsetY = 220;
        const kpis = [
            { label: "Potenza Istantanea:", value: dati.potenza_kw + " kW" },
            { label: "Consumo Giornaliero:", value: dati.consumo_giornaliero_kwh + " kWh" },
            { label: "Efficienza:", value: dati.efficienza_perc + " %" },
            { label: "Ore Operative:", value: dati.ore_operative + " h" }
        ];

        kpis.forEach(kpi => {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '32px Inter';
            ctx.fillText(kpi.label, 80, offsetY);
            ctx.fillStyle = '#f1f5f9';
            ctx.font = 'bold 45px Inter';
            ctx.textAlign = 'right';
            ctx.fillText(kpi.value, 720, offsetY + 2);
            ctx.textAlign = 'left';
            offsetY += 80;
        });

        // Informazione extra sotto i KPI sulla soglia di allarme
        ctx.fillStyle = '#64748b';
        ctx.font = 'italic 24px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`*Soglia allarme impostata a: ${soglia} kW`, w/2, 570);

        // SEZIONE 2: Benchmark Card
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.beginPath();
        ctx.roundRect(50, 630, 700, 750, 24);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();

        ctx.fillStyle = 'rgba(6,182,212,0.9)';
        ctx.textAlign = 'center';
        ctx.font = 'bold 42px Inter';
        ctx.fillText("BENCHMARK ENPI", w/2, 710);
        
        ctx.fillStyle = 'rgba(6,182,212,0.35)';
        let wText = ctx.measureText("BENCHMARK ENPI").width;
        ctx.fillRect(w/2 - wText/2, 725, wText, 3);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '28px Inter';
        ctx.fillText("ENERGY PERFORMANCE INDICATOR", w/2, 770);

        ctx.fillStyle = '#06b6d4';
        ctx.font = 'bold 160px Inter';
        ctx.fillText(dati.enpi_attuale, w/2, 1000);
        
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 36px Inter';
        ctx.fillText(`Baseline ISO 50001: ${dati.baseline_enpi}`, w/2, 1150);

        let diff = (dati.enpi_attuale - dati.baseline_enpi).toFixed(1);
        let statusText = diff > 0 ? `+${diff} (Sopra Baseline)` : `${diff} (Sotto Baseline)`;
        ctx.fillStyle = diff > 0 ? '#ef4444' : '#22c55e';
        ctx.font = 'bold 32px Inter';
        ctx.fillText(statusText, w/2, 1240);

        // SEZIONE 3: Bottone
        const btnBox = this.hitboxes[0];
        ctx.save();
        const btnGrad = ctx.createLinearGradient(btnBox.x, btnBox.y, btnBox.x + btnBox.w, btnBox.y + btnBox.h);
        btnGrad.addColorStop(0, '#06b6d4');
        btnGrad.addColorStop(1, '#0891b2');
        ctx.fillStyle = btnGrad;
        ctx.shadowColor = 'rgba(6, 182, 212, 0.4)';
        ctx.shadowBlur = 20;

        const isPinnedMac = window.isPinned;
        if (!isPinnedMac) ctx.globalAlpha = 0.4;

        ctx.beginPath();
        ctx.roundRect(btnBox.x, btnBox.y, btnBox.w, btnBox.h, 24);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px Inter';
        ctx.fillText("📊 DETTAGLIO GRAFICO", btnBox.x + btnBox.w/2, btnBox.y + 70);

        if (!isPinnedMac) ctx.globalAlpha = 1.0;
    }
};
