window.LayoutRack = {
    config: {
        canvasW: 900,
        canvasH: 1600,
        planeW: 1.8,
        planeH: 3.2
    },
    hitboxes: [
        { id: "traffico_rack", x: 50, y: 360, w: 380, h: 220 },
        { id: "temperatura", x: 470, y: 360, w: 380, h: 220 },
        { id: "assistenza", x: 50, y: 1420, w: 800, h: 120 },
        // Hitboxes for 5 devices (we'll calculate these inside draw but static defining helps if we handle clicks manually)
        { id: "dev_0", x: 50, y: 700, w: 800, h: 120 },
        { id: "dev_1", x: 50, y: 830, w: 800, h: 120 },
        { id: "dev_2", x: 50, y: 960, w: 800, h: 120 },
        { id: "dev_3", x: 50, y: 1090, w: 800, h: 120 },
        { id: "dev_4", x: 50, y: 1220, w: 800, h: 120 },
        { id: "chiudi_detail", x: 740, y: 720, w: 80, h: 60 }
    ],
    // State to hold which device is currently expanded in inline detail
    state: {
        selectedDeviceIndex: null
    },

    processClick: function(hitboxId) {
        if (hitboxId === "chiudi_detail") {
            this.state.selectedDeviceIndex = null;
            return;
        }

        if (hitboxId.startsWith("dev_")) {
            const index = parseInt(hitboxId.split("_")[1], 10);
            if (this.state.selectedDeviceIndex === index) {
                // Toggle off if already open
                this.state.selectedDeviceIndex = null;
            } else {
                this.state.selectedDeviceIndex = index;
            }
            return;
        }

        if (hitboxId === "assistenza") {
            const subject = encodeURIComponent(`Richiesta Assistenza per Rack: ${window.currentConfig ? window.currentConfig.nome : 'Sconosciuto'}`);
            const body = encodeURIComponent(`Dettagli Rack:\n- Stato Alimentazione: Attesa Controllo\n- Segnalazione Problema:\n\n[Descrivi il problema per il team di supporto]`);
            window.location.href = `mailto:support@eurix.it?subject=${subject}&body=${body}`;
            return;
        }
        
        // Let main logic handle things like apriDettaglio
        if (window.apriDettaglio) {
            window.apriDettaglio(hitboxId);
        }
    },

    fetchDati: function(callback) {
        const now = new Date();
        const str_ora_attuale = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

        // Mock statuses
        const temp = (22 + Math.random() * 2).toFixed(1);
        const powerStatus = "Normal";
        const connStatus = "Up";
        const devCount = 5;
        const activeDevs = 5;

        // Mock Devices
        const devices = [
            { name: "Core Switch 1", ip: "10.0.1.254", portsInUse: "48/48", linkSpeed: "10 Gbps", errors: 0, poeState: "On (240W)", firmware: "v15.2(4)", lastLog: "Syslog cleared" },
            { name: "Access Switch A", ip: "10.0.1.201", portsInUse: "32/48", linkSpeed: "1 Gbps", errors: 12, poeState: "On (80W)", firmware: "v15.2(3)", lastLog: "Port 12 spanning tree loop resolved" },
            { name: "Firewall Main", ip: "10.0.1.1", portsInUse: "6/8", linkSpeed: "10 Gbps", errors: 0, poeState: "N/A", firmware: "v7.0.2", lastLog: "VPN tunnel established" },
            { name: "Storage SAN", ip: "10.0.1.50", portsInUse: "4/4", linkSpeed: "25 Gbps", errors: 0, poeState: "N/A", firmware: "v2.1.0", lastLog: "Backup job completed" },
            { name: "Router WAN", ip: "192.168.100.1", portsInUse: "2/4", linkSpeed: "1 Gbps", errors: 5, poeState: "N/A", firmware: "v12.4", lastLog: "BGP route updated" }
        ];

        callback({
            temp: parseFloat(temp),
            powerStatus: powerStatus,
            connStatus: connStatus,
            devCount: devCount,
            activeDevs: activeDevs,
            devices: devices,
            testo_aggiornamento: `Ultimo agg. ore ${str_ora_attuale}`
        });
    },

    draw: function(ctx, dati, currentConfig) {
        const w = this.config.canvasW;
        const h = this.config.canvasH;

        ctx.clearRect(0, 0, w, h);

        // Dark glassmorphism background
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

        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 55px Inter';
        ctx.textAlign = 'left';
        ctx.fillText(currentConfig.nome, 50, 90);

        const gradient = ctx.createLinearGradient(50, 0, 800, 0);
        gradient.addColorStop(0, '#06b6d4');
        gradient.addColorStop(1, '#0891b2');
        ctx.fillStyle = gradient;
        ctx.font = 'bold 24px Inter';
        ctx.fillText(dati.testo_aggiornamento, 50, 150);

        // S1: GENERAL INDICATORS
        // Draw 4 circular indicators evenly spaced horizontally
        const indCenterY = 280;
        const indicators = [
            { label: "PWR", val: dati.powerStatus, status: dati.powerStatus === "Normal" ? 1 : 0 },
            { label: "TEMP", val: dati.temp + "°C", status: dati.temp < 28 ? 1 : 2 },
            { label: "CONN", val: dati.connStatus, status: dati.connStatus === "Up" ? 1 : 0 },
            { label: "DEV", val: `${dati.activeDevs}/${dati.devCount} Up`, status: dati.activeDevs === dati.devCount ? 1 : 2 }
        ];

        let spacing = (w - 100) / 4;
        indicators.forEach((ind, i) => {
            let cx = 50 + spacing / 2 + (i * spacing);
            
            ctx.beginPath();
            ctx.arc(cx, indCenterY, 40, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fill();
            
            let color = '#22c55e'; // default green
            if (ind.status === 0) color = '#ef4444'; // red
            if (ind.status === 2) color = '#facc15'; // yellow

            ctx.lineWidth = 4;
            ctx.strokeStyle = color;
            ctx.stroke();
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(cx, indCenterY, 12, 0, 2 * Math.PI);
            ctx.fill();

            // glow
            ctx.save();
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
            ctx.fillStyle = color;
            ctx.fill();
            ctx.restore();

            ctx.fillStyle = '#94a3b8';
            ctx.font = '600 16px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(ind.label, cx, indCenterY - 55);

            ctx.fillStyle = '#f1f5f9';
            ctx.font = 'bold 20px Inter';
            ctx.fillText(ind.val, cx, indCenterY + 70);
        });

        // S2: MINI CHARTS AREA
        // Traffic Chart Mini Box
        let boxX = 50;
        let boxY = 380;
        let boxW = 380;
        let boxH = 220;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 20);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();

        ctx.fillStyle = '#67e8f9';
        ctx.font = 'bold 24px Inter';
        ctx.textAlign = 'left';
        ctx.fillText("TRAFFICO RACK", boxX + 20, boxY + 40);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px Inter';
        ctx.fillText("Espandi >>", boxX + 20, boxY + 70);
        
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 40px Inter';
        ctx.textAlign = 'center';
        ctx.fillText("8.2 Gbps", boxX + boxW/2, boxY + 140);
        
        // Temperature mini box
        let b2X = 470;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.beginPath();
        ctx.roundRect(b2X, boxY, boxW, boxH, 20);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();

        ctx.fillStyle = '#67e8f9';
        ctx.font = 'bold 24px Inter';
        ctx.textAlign = 'left';
        ctx.fillText("TEMPERATURA", b2X + 20, boxY + 40);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px Inter';
        ctx.fillText("Espandi >>", b2X + 20, boxY + 70);
        
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 40px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(dati.temp + " °C", b2X + boxW/2, boxY + 140);

        // S3: DEVICES LIST OR INLINE DETAIL
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 30px Inter';
        ctx.textAlign = 'left';
        ctx.fillText("DISPOSITIVI RACK", 50, 660);

        if (this.state.selectedDeviceIndex !== null) {
            // DRAW INLINE DETAIL VIEW
            const device = dati.devices[this.state.selectedDeviceIndex];
            const dx = 50;
            const dy = 700;
            const dw = 800;
            const dh = 680;

            ctx.fillStyle = 'rgba(15, 45, 31, 0.95)'; // Highlight green/dark background
            ctx.beginPath();
            ctx.roundRect(dx, dy, dw, dh, 24);
            ctx.fill();
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Header for detail
            ctx.fillStyle = '#22c55e';
            ctx.font = 'bold 36px Inter';
            ctx.fillText(device.name, dx + 30, dy + 60);

            // Close button inside detail
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.beginPath();
            ctx.roundRect(dx + dw - 90, dy + 20, 70, 50, 10);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 24px Inter';
            ctx.textAlign = 'center';
            ctx.fillText("X", dx + dw - 55, dy + 55);

            // Technical Data Layout
            ctx.textAlign = 'left';
            const techData = [
                { k: "IP Address", v: device.ip },
                { k: "Physical Ports Use", v: device.portsInUse },
                { k: "Negotiated Speed", v: device.linkSpeed },
                { k: "Interface Errors", v: device.errors + " last 24h" },
                { k: "PoE State", v: device.poeState },
                { k: "Firmware", v: device.firmware }
            ];

            let rowY = dy + 150;
            techData.forEach(item => {
                ctx.fillStyle = '#94a3b8';
                ctx.font = '24px Inter';
                ctx.fillText(item.k, dx + 40, rowY);
                
                ctx.fillStyle = '#f1f5f9';
                ctx.font = 'bold 28px Inter';
                ctx.textAlign = 'right';
                ctx.fillText(item.v, dx + dw - 40, rowY);
                
                ctx.textAlign = 'left';
                rowY += 60;
            });

            // Log Area inside detail
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.beginPath();
            ctx.roundRect(dx + 30, rowY + 30, dw - 60, 120, 12);
            ctx.fill();
            ctx.fillStyle = '#64748b';
            ctx.font = '16px Inter';
            ctx.fillText("LOG EVENTI RECENSI:", dx + 50, rowY + 60);
            ctx.fillStyle = '#e2e8f0';
            ctx.font = '18px monospace';
            ctx.fillText(`> ${device.lastLog}`, dx + 50, rowY + 95);

        } else {
            // DRAW COMPACT DEVICES LIST
            let listY = 700;
            dati.devices.forEach((dev, index) => {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
                ctx.beginPath();
                ctx.roundRect(50, listY, 800, 110, 16);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                ctx.stroke();

                // Health dot
                ctx.fillStyle = dev.errors > 0 ? '#facc15' : '#22c55e';
                ctx.beginPath();
                ctx.arc(80, listY + 55, 10, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#f1f5f9';
                ctx.font = 'bold 28px Inter';
                ctx.textAlign = 'left';
                ctx.fillText(dev.name, 110, listY + 50);
                
                ctx.fillStyle = '#94a3b8';
                ctx.font = '18px Inter';
                ctx.fillText(`Ports: ${dev.portsInUse} | IP: ${dev.ip} | FW: ${dev.firmware}`, 110, listY + 85);

                ctx.fillStyle = '#06b6d4';
                ctx.font = 'bold 20px Inter';
                ctx.textAlign = 'right';
                ctx.fillText("DETTAGLI +", 810, listY + 65);

                listY += 130;
            });
        }


        // S4: ASSIST ACTION BTN
        const btnBox = this.hitboxes.find(h => h.id === "assistenza");
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
        ctx.fillText("✉ RICHIEDI ASSISTENZA", btnBox.x + btnBox.w/2, btnBox.y + 70);
    }
};
