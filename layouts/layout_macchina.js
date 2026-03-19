window.LayoutMacchina = {
    config: {
        canvasW: 900,
        canvasH: 1600,
        planeW: 1.8,
        planeH: 3.2
    },
    hitboxes: [
        { id: "benchmark_energia", x: 50, y: 1420, w: 800, h: 120 }
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
        ctx.roundRect(0, 0, w, 220, { tl: 40, tr: 40, bl: 0, br: 0 });
        ctx.fill();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.beginPath();
        ctx.moveTo(0, 220);
        ctx.lineTo(w, 220);
        ctx.stroke();

        // Titolo Macchina
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 55px Inter';
        ctx.textAlign = 'left';
        ctx.fillText(currentConfig.nome, 50, 90);
        
        // Sottotitolo
        const gradient = ctx.createLinearGradient(50, 0, 800, 0);
        gradient.addColorStop(0, '#06b6d4');
        gradient.addColorStop(1, '#0891b2');
        ctx.fillStyle = gradient;
        ctx.font = 'bold 28px Inter';
        ctx.fillText("ISO 50001 · MONITORAGGIO ENERGETICO", 50, 160);

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
        ctx.shadowBlur = 40;
        ctx.fillStyle = colorSemaforo;
        ctx.beginPath();
        ctx.arc(w - 90, 100, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // SEZIONE 1: KPI Energetici
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.beginPath();
        ctx.roundRect(50, 260, 800, 400, 24);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();

        ctx.textAlign = 'left';
        let offsetY = 320;
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
            ctx.fillText(kpi.value, 820, offsetY + 2);
            ctx.textAlign = 'left';
            offsetY += 80;
        });

        // Informazione extra sotto i KPI sulla soglia di allarme
        ctx.fillStyle = '#64748b';
        ctx.font = 'italic 24px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`*Soglia allarme impostata a: ${soglia} kW`, w/2, 630);

        // SEZIONE 2: Benchmark Card
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.beginPath();
        ctx.roundRect(50, 700, 800, 680, 24);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();

        ctx.fillStyle = '#f1f5f9';
        ctx.textAlign = 'center';
        ctx.font = 'bold 42px Inter';
        ctx.fillText("BENCHMARK EnPI", w/2, 780);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '28px Inter';
        ctx.fillText("Energy Performance Indicator", w/2, 840);

        ctx.fillStyle = '#06b6d4';
        ctx.font = 'bold 160px Inter';
        ctx.fillText(dati.enpi_attuale, w/2, 1050);
        
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 36px Inter';
        ctx.fillText(`Baseline ISO 50001: ${dati.baseline_enpi}`, w/2, 1180);

        let diff = (dati.enpi_attuale - dati.baseline_enpi).toFixed(1);
        let statusText = diff > 0 ? `+${diff} (Sopra Baseline)` : `${diff} (Sotto Baseline)`;
        ctx.fillStyle = diff > 0 ? '#ef4444' : '#22c55e';
        ctx.font = 'bold 32px Inter';
        ctx.fillText(statusText, w/2, 1260);

        // SEZIONE 3: Bottone
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
        ctx.fillText("📊 DETTAGLIO GRAFICO", btnBox.x + btnBox.w/2, btnBox.y + 70);
    }
};
