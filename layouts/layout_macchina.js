window.LayoutMacchina = {
    config: {
        canvasW: 1600,
        canvasH: 900,
        planeW: 3.2,
        planeH: 1.8
    },
    hitboxes: [
        { id: "benchmark_energia", x: 100, y: 750, w: 1400, h: 100 }
    ],
    fetchDati: function(callback) {
        // Dati simulati realistici fluttuanti
        const potenza_kw = (Math.random() * 20 + 30).toFixed(1); // 30-50
        const efficienza = (Math.random() * 10 + 85).toFixed(1); // 85-95
        const consumo = (potenza_kw * 8).toFixed(1);
        const ore = (Math.random() * 2 + 6).toFixed(1); // 6-8
        
        callback({
            potenza_kw: parseFloat(potenza_kw),
            consumo_giornaliero_kwh: parseFloat(consumo),
            efficienza_perc: parseFloat(efficienza),
            ore_operative: parseFloat(ore),
            baseline_enpi: 12.5,
            enpi_attuale: (Math.random() * 2 + 11).toFixed(1) // 11-13
        });
    },
    draw: function(ctx, dati, currentConfig) {
        const w = this.config.canvasW;
        const h = this.config.canvasH;
        
        ctx.clearRect(0, 0, w, h);
        
        // Sfondo dark glassmorphism
        ctx.fillStyle = 'rgba(13, 31, 60, 0.85)';
        ctx.beginPath();
        ctx.roundRect(0, 0, w, h, 40);
        ctx.fill();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Header
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.roundRect(0, 0, w, 150, { tl: 40, tr: 40, bl: 0, br: 0 });
        ctx.fill();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.beginPath();
        ctx.moveTo(0, 150);
        ctx.lineTo(w, 150);
        ctx.stroke();

        // Titolo Macchina
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 60px Inter';
        ctx.textAlign = 'left';
        ctx.fillText(currentConfig.nome, 60, 80);
        
        // Sottotitolo
        const gradient = ctx.createLinearGradient(60, 0, 800, 0);
        gradient.addColorStop(0, '#06b6d4');
        gradient.addColorStop(1, '#0891b2');
        ctx.fillStyle = gradient;
        ctx.font = 'bold 30px Inter';
        ctx.fillText("ISO 50001 · MONITORAGGIO ENERGETICO", 60, 130);

        // Spia di Allarme
        const soglia = currentConfig.soglia_kw || 45;
        const perc = dati.potenza_kw / soglia;
        let colorSemaforo = '#22c55e'; // Verde
        let glowSemaforo = 'rgba(34, 197, 94, 0.5)';
        if (perc >= 0.9) {
            colorSemaforo = '#ef4444'; // Rosso (oltre 90%)
            glowSemaforo = 'rgba(239, 68, 68, 0.5)';
        } else if (perc >= 0.7) {
            colorSemaforo = '#eab308'; // Giallo (70-90%)
            glowSemaforo = 'rgba(234, 179, 8, 0.5)';
        }
        ctx.save();
        ctx.shadowColor = glowSemaforo;
        ctx.shadowBlur = 40;
        ctx.fillStyle = colorSemaforo;
        ctx.beginPath();
        ctx.arc(w - 100, 75, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Colonna SX - KPI Energetici
        ctx.textAlign = 'left';
        
        let offsetY = 250;
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
            ctx.fillText(kpi.value, 460, offsetY + 2);
            offsetY += 100;
        });

        // Informazione extra sotto i KPI sulla soglia di allarme
        ctx.fillStyle = '#64748b';
        ctx.font = 'italic 24px Inter';
        ctx.fillText(`*Soglia allarme impostata a: ${soglia} kW`, 80, 680);

        // Colonna DX - Benchmark Card
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.beginPath();
        ctx.roundRect(850, 200, 680, 500, 24);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();

        ctx.fillStyle = '#f1f5f9';
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px Inter';
        ctx.fillText("BENCHMARK EnPI", 1190, 260);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '24px Inter';
        ctx.fillText("Energy Performance Indicator", 1190, 300);

        ctx.fillStyle = '#06b6d4';
        ctx.font = 'bold 90px Inter';
        ctx.fillText(dati.enpi_attuale, 1190, 420);
        
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 32px Inter';
        ctx.fillText(`Baseline ISO 50001: ${dati.baseline_enpi}`, 1190, 500);

        let diff = (dati.enpi_attuale - dati.baseline_enpi).toFixed(1);
        let statusText = diff > 0 ? `+${diff} (Sopra Baseline)` : `${diff} (Sotto Baseline)`;
        ctx.fillStyle = diff > 0 ? '#ef4444' : '#22c55e';
        ctx.font = 'bold 28px Inter';
        ctx.fillText(statusText, 1190, 560);

        // Bottone
        const btnBox = this.hitboxes[0];
        ctx.save();
        const btnGrad = ctx.createLinearGradient(btnBox.x, btnBox.y, btnBox.x + btnBox.w, btnBox.y + btnBox.h);
        btnGrad.addColorStop(0, '#06b6d4');
        btnGrad.addColorStop(1, '#0891b2');
        ctx.fillStyle = btnGrad;
        ctx.shadowColor = 'rgba(6, 182, 212, 0.4)';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.roundRect(btnBox.x, btnBox.y, btnBox.w, btnBox.h, 24);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px Inter';
        ctx.fillText("📊 DETTAGLIO CONSUMI & PREDIZIONE", btnBox.x + btnBox.w/2, btnBox.y + 64);
    }
};
