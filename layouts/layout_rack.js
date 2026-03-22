/**
 * LayoutRack - Visualizzatore in Realtà Aumentata dello stato del Rack di Rete.
 * 
 * Questo pannello è stato progettato per fornire una dashboard compatta che fonde:
 * - Informazioni sommarie di stato (Alimentazione, Temperatura, Connettività).
 * - Mini-grafici di tendenza che espandono il dettaglio in un canvas `Chart.js` globale (`index.html`).
 * - Una lista dinamica dei dispositivi del Rack.
 * - Una visualizzazione di dettaglio *in-line* (overlay) per il singolo dispositivo, gestita tramite state interno.
 * - Una funzione di Call-To-Action (Richiedi Assistenza) tramite un bridge a `mailto:`.
 * 
 * L'approccio di rendering utilizza le API native del Canvas HTML5 (`ctx.roundRect`, `ctx.fillText`, ecc.) 
 * per garantire massime performance (60fps in ambienti AR nativi come A-Frame/AR.js).
 */
window.LayoutRack = {
    // Definizione delle dimensioni base del Canvas virtuale.
    // Queste determinano il rapporto d'aspetto e la risoluzione con cui vengono posizionati gli elementi.
    config: {
        canvasW: 900,
        canvasH: 1600,
        planeW: 1.8,
        planeH: 3.2
    },

    // Array dinamico gestito in draw() - Definisce le aree cliccabili (hitboxes) del canvas.
    // In index.html, l'event listener sul canvas itera questo array per intercettare i click dell'utente.
    hitboxes: [], 

    // Stato locale del componente AR.
    // Evitiamo variabili globali inquinanti per gestire logiche UI interne (come ad es. la selezione di una riga).
    state: {
        selectedDeviceIndex: null // Indice del device attualmente espanso (null = vista elenco).
    },

    /**
     * processClick - Intercetta e gestisce la logica di business derivante da un click su un hitbox.
     * Viene invocata da `index.html` se l'hitbox colpito appartiene a questo layout.
     * 
     * @param {string} hitboxId - L'ID dell'hitbox colpito (es. "dev_0", "assistenza", "temperatura").
     */
    processClick: function(hitboxId) {
        // [1] Chiusura della scheda di dettaglio
        if (hitboxId === "chiudi_detail") {
            this.state.selectedDeviceIndex = null;
            return;
        }

        // [2] Apertura scheda di dettaglio per un dispositivo specifico
        // Analizziamo l'ID dell'hitbox (es "dev_0") per ricavare l'indice dell'array
        if (hitboxId.startsWith("dev_")) {
            const index = parseInt(hitboxId.split("_")[1], 10);
            this.state.selectedDeviceIndex = index;
            return;
        }

        // [3] Azione CTA: Richiesta Assistenza
        // Genera un mailto precompilato sfruttando il configuratore corrente (window.currentConfig) 
        // per fornire subito contesto al team di supporto sul rack scansionato.
        if (hitboxId === "assistenza") {
            const subject = encodeURIComponent(`Richiesta Assistenza per Rack: ${window.currentConfig ? window.currentConfig.nome : 'Sconosciuto'}`);
            const body = encodeURIComponent(`Dettagli Rack:\n- Stato Alimentazione: Attesa Controllo\n- Segnalazione Problema:\n\n[Descrivi il problema per il team di supporto]`);
            window.location.href = `mailto:support@eurix.it?subject=${subject}&body=${body}`;
            return;
        }
        
        // [4] Fallback Generico: Grafici Espansi
        // Hitbox come "traffico_rack" o "temperatura" vengono passati all'architettura globale 
        // in index.html per attivare la modale con il grafico temporale Chart.js.
        if (window.apriDettaglio) {
            window.apriDettaglio(hitboxId);
        }
    },

    /**
     * fetchDati - Wrapper asincrono simulato per l'API fetch dei telemetri (o mock).
     * In un ambiente di produzione, questa funzione dovrà fare una `fetch(API_URL)` 
     * al backend IoT (es. broker MQTT, InfluxDB o Backend Node.js).
     * 
     * @param {function} callback - Ritorna l'oggetto dati renderizzato al loop A-Frame.
     */
    fetchDati: function(callback) {
        const now = new Date();
        const str_ora_attuale = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

        // Dati Generici Rack
        const temp = (22 + Math.random() * 2).toFixed(1);
        const powerStatus = "Normal";
        const connStatus = "Up";
        const devCount = 5;
        const activeDevs = 5;

        // Dati Tabulari: Simulazione risposta DB Inventario / Monitoraggio
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

    /**
     * draw - Core Render Loop per disegnare il marker 3D sul Canvas.
     * Questa funzione gira a circa 1-60fps (gestito da setInterval/requestAnimationFrame).
     * OTTIMIZZAZIONE: mantenere qui le logiche puramente visive, fare elaborazioni pesanti altrove.
     * 
     * @param {CanvasRenderingContext2D} ctx - Il contesto 2D nativo.
     * @param {object} dati - I dati telemetrici passati dalla resolve di fetchDati().
     * @param {object} currentConfig - Configurazioni statiche caricate dal `registro.json`.
     */
    draw: function(ctx, dati, currentConfig) {
        // --- LOGICA DI AGGIORNAMENTO DINAMICO HITBOXES ---
        // Siccome l'UI può assumere due stati (Vista Lista Devices / Dettaglio Singolo),
        // aggiorniamo l'array `hitboxes` in base allo stato in modo che i click "attraversino" correttamente le viste
        // senza overlap accidentali.
        if (this.state.selectedDeviceIndex !== null) {
            // Stato 2: Modal Dettagli aperta (Disabilita l'array lista devices)
            this.hitboxes = [
                { id: "traffico_rack", x: 50, y: 410, w: 380, h: 220 },
                { id: "temperatura", x: 470, y: 410, w: 380, h: 220 },
                { id: "assistenza", x: 50, y: 1420, w: 800, h: 120 },
                { id: "chiudi_detail", x: 740, y: 720, w: 80, h: 60 }
            ];
        } else {
            // Stato 1: Lista Devices Standard Attiva
            this.hitboxes = [
                { id: "traffico_rack", x: 50, y: 410, w: 380, h: 220 },
                { id: "temperatura", x: 470, y: 410, w: 380, h: 220 },
                { id: "assistenza", x: 50, y: 1420, w: 800, h: 120 },
                { id: "dev_0", x: 50, y: 700, w: 800, h: 120 },
                { id: "dev_1", x: 50, y: 830, w: 800, h: 120 },
                { id: "dev_2", x: 50, y: 960, w: 800, h: 120 },
                { id: "dev_3", x: 50, y: 1090, w: 800, h: 120 },
                { id: "dev_4", x: 50, y: 1220, w: 800, h: 120 }
            ];
        }

        const w = this.config.canvasW;
        const h = this.config.canvasH;

        // Pulisce l'intero frame precedente
        ctx.clearRect(0, 0, w, h);

        // --- BACKGROUND PANNELLO (Sfondo Dark Glassmorphism) ---
        ctx.fillStyle = 'rgba(13, 31, 60, 0.85)';
        ctx.beginPath();
        ctx.roundRect(0, 0, w, h, 40);
        ctx.fill();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)'; // Cyan aziendale
        ctx.lineWidth = 4;
        ctx.stroke();

        // --- HEADER ---
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.roundRect(0, 0, w, 220, { tl: 40, tr: 40, bl: 0, br: 0 });
        ctx.fill();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.beginPath();
        ctx.moveTo(0, 220); // Linea demarcazione
        ctx.lineTo(w, 220);
        ctx.stroke();

        // Titolo (es recuperato da "nome" in registro.json)
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 55px Inter';
        ctx.textAlign = 'left';
        ctx.fillText(currentConfig.nome, 50, 90);

        // Subtitle - Gradiente testuale dinamico
        const gradient = ctx.createLinearGradient(50, 0, 800, 0);
        gradient.addColorStop(0, '#06b6d4');
        gradient.addColorStop(1, '#0891b2');
        ctx.fillStyle = gradient;
        ctx.font = 'bold 24px Inter';
        ctx.fillText(dati.testo_aggiornamento, 50, 150);

        // --- SEZIONE 1: INDICATORI GLOBALI (KPI) ---
        // Logica a semafori colorati
        const indCenterY = 310;
        const indicators = [
            { label: "PWR", val: dati.powerStatus, status: dati.powerStatus === "Normal" ? 1 : 0 },
            { label: "TEMP", val: dati.temp + "°C", status: dati.temp < 28 ? 1 : 2 },
            { label: "CONN", val: dati.connStatus, status: dati.connStatus === "Up" ? 1 : 0 },
            { label: "DEV", val: `${dati.activeDevs}/${dati.devCount} Up`, status: dati.activeDevs === dati.devCount ? 1 : 2 }
        ];

        let spacing = (w - 100) / 4;
        indicators.forEach((ind, i) => {
            let cx = 50 + spacing / 2 + (i * spacing); // Centratura automatica delle 4 colonne
            
            ctx.beginPath();
            ctx.arc(cx, indCenterY, 40, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fill();
            
            // Assegnazione mapping semaforo Status
            let color = '#22c55e'; // Verde (OK)
            if (ind.status === 0) color = '#ef4444'; // Rosso (Errore Fisso)
            if (ind.status === 2) color = '#facc15'; // Giallo (Warning)

            ctx.lineWidth = 4;
            ctx.strokeStyle = color;
            ctx.stroke();
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(cx, indCenterY, 12, 0, 2 * Math.PI);
            ctx.fill();

            // Glow Effect del led tramite shadow (Pesante per Performance se abusato: usare ctx.save e restore)
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

        // --- SEZIONE 2: MINI GRAFICI ---
        // (Cliccandoli, la funzione processClick mappa su "traffico_rack" inviando il flag a index.html per la modale chart.js grande)
        
        let boxX = 50;
        let boxY = 410;
        let boxW = 380;
        let boxH = 220;
        
        // Pannello A: TRAFFICO RACK
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
        
        // Pannello B: TEMPERATURA
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

        // --- SEZIONE 3: ELENCO APPARATI RACK (LOGICA DI STATO) ---
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 30px Inter';
        ctx.textAlign = 'left';
        ctx.fillText("DISPOSITIVI RACK", 50, 660);

        // Switch Visivo dipendente da this.state
        if (this.state.selectedDeviceIndex !== null) {
            
            // ============================================
            //  MODALE IN-LINE (DETTAGLIO APPARATO)
            // ============================================
            const device = dati.devices[this.state.selectedDeviceIndex];
            const dx = 50;
            const dy = 700;
            const dw = 800;
            const dh = 680;

            // Sfondo Box dettaglio
            ctx.fillStyle = 'rgba(15, 45, 31, 0.95)'; // Tonalità di base focalizzata, coprente il listato sotto
            ctx.beginPath();
            ctx.roundRect(dx, dy, dw, dh, 24);
            ctx.fill();
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Intestazione Dettaglio
            ctx.fillStyle = '#22c55e';
            ctx.font = 'bold 36px Inter';
            ctx.fillText(device.name, dx + 30, dy + 60);

            // Pulsante [X] di chiusura (colpito da id "chiudi_detail")
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.beginPath();
            ctx.roundRect(dx + dw - 90, dy + 20, 70, 50, 10);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 24px Inter';
            ctx.textAlign = 'center';
            ctx.fillText("X", dx + dw - 55, dy + 55);

            // Costruzione Dizionario Chiave/Valore per il dettaglio tecnico
            ctx.textAlign = 'left';
            const techData = [
                { k: "Indirizzo IP", v: device.ip },
                { k: "Uso Porte Fisiche", v: device.portsInUse },
                { k: "Velocità Negoziata", v: device.linkSpeed },
                { k: "Errori d'Interfaccia", v: device.errors + " ultime 24h" },
                { k: "Sensori PoE", v: device.poeState },
                { k: "Vers. Firmware", v: device.firmware }
            ];

            // Render tabellare
            let rowY = dy + 150;
            techData.forEach(item => {
                // Etichetta (Key)
                ctx.fillStyle = '#94a3b8';
                ctx.font = '24px Inter';
                ctx.fillText(item.k, dx + 40, rowY);
                
                // Valore Parametrico (Value)
                ctx.fillStyle = '#f1f5f9';
                ctx.font = 'bold 28px Inter';
                ctx.textAlign = 'right';
                ctx.fillText(item.v, dx + dw - 40, rowY);
                
                ctx.textAlign = 'left';
                rowY += 60; // Spaziatura griglia Y
            });

            // Container Visivo dei Log Eventi (Finestra in stile terminale)
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.beginPath();
            ctx.roundRect(dx + 30, rowY + 30, dw - 60, 120, 12);
            ctx.fill();
            
            ctx.fillStyle = '#64748b';
            ctx.font = '16px Inter';
            ctx.fillText("LOG EVENTI RECENSI:", dx + 50, rowY + 60);
            
            ctx.fillStyle = '#e2e8f0';
            ctx.font = '18px monospace'; // Segnaliamo visivamente l'output macchina
            ctx.fillText(`> ${device.lastLog}`, dx + 50, rowY + 95);

        } else {

            // ============================================
            //  VISTA COMPATTA DI DEFAULT (LISTA)
            // ============================================
            let listY = 700;
            dati.devices.forEach((dev, index) => {
                // Card Riga Apparato
                ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
                ctx.beginPath();
                ctx.roundRect(50, listY, 800, 110, 16);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                ctx.stroke();

                // Health dot del singolo apparato nella lista
                ctx.fillStyle = dev.errors > 0 ? '#facc15' : '#22c55e'; // Giallo se ha problemi minori, sennò verde
                ctx.beginPath();
                ctx.arc(80, listY + 55, 10, 0, Math.PI * 2);
                ctx.fill();

                // Nomi e summary
                ctx.fillStyle = '#f1f5f9';
                ctx.font = 'bold 28px Inter';
                ctx.textAlign = 'left';
                ctx.fillText(dev.name, 110, listY + 50);
                
                ctx.fillStyle = '#94a3b8';
                ctx.font = '18px Inter';
                ctx.fillText(`Ports: ${dev.portsInUse} | IP: ${dev.ip} | FW: ${dev.firmware}`, 110, listY + 85);

                // Call To action per espansione Riga
                ctx.fillStyle = '#06b6d4';
                ctx.font = 'bold 20px Inter';
                ctx.textAlign = 'right';
                ctx.fillText("DETTAGLI +", 810, listY + 65);

                listY += 130;  // Spazio tra box -> NB: Allineare i valori a queste somme nei hitboxes in draw()!!
            });
        }


        // --- SEZIONE 4: BOTTONE GLOBAL CTA ASSISTENZA ---
        // (Sempre posizionato in fondo allo stream del canvas 1600px - vedi riga id=assistenza in hitboxes)
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

        // Label pulsante Supporto
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px Inter';
        ctx.fillText("✉ RICHIEDI ASSISTENZA", btnBox.x + btnBox.w/2, btnBox.y + 70);
    }
};
