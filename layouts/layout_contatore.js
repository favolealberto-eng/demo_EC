/**
 * TEMPLATE: PANNELLO CONTATORE GENERALE
 * Immagine di sfondo annotata con dati dinamici in tempo reale.
 * Vista standard (annotata) e Vista Pinnata (approfondita stile web).
 */
window.LayoutContatore = {
    // 1. CONFIGURAZIONE CANVAS (Basata su immagine 1696x2516 + 200px header superiore)
    config: {
        canvasW: 1696,
        canvasH: 2716, // 2516 (immagine) + 200 (spazio per header)
        planeW: 4.8,   // Larghezza piano 3D in AR
        planeH: 7.69   // Altezza proporzionale 3D
    },

    // 2. GESTIONE IMMAGINE DI SFONDO
    // Imposta qui il percorso corretto della tua immagine
    imageSrc: 'images/contatore/Contatore.png',
    backgroundImage: null,
    imageLoaded: false,

    // Funzione helper per caricare l'immagine una sola volta
    preloadImage: function (callback) {
        if (this.imageLoaded) { callback(); return; }
        this.backgroundImage = new Image();
        this.backgroundImage.src = this.imageSrc;
        this.backgroundImage.onload = () => { this.imageLoaded = true; callback(); };
        this.backgroundImage.onerror = () => { console.error("Errore caricamento immagine sfondo contatore."); callback(); };
    },

    // 3. MAPPATURA COORDINATE (Basata sul tuo file Excel)
    // Oggetto: { centroX, centroY, w (larghezza), h (altezza) }
    map: {
        header_hY: 200, // Offset Y dove inizia l'immagine

        // Valvole in alto a sinistra
        "Valvola Acqua Fredda": { cX: 436, cY: 422, w: 160, h: 160 },
        "Valvola Acqua Calda": { cX: 687, cY: 422, w: 160, h: 160 },

        // Contatori volumetrici (Cerchi)
        "Contatore Acqua Fredda": { cX: 441, cY: 893, w: 350, h: 350 },
        "Contatore Acqua Calda": { cX: 687, cY: 893, w: 350, h: 350 },

        // Temperature (Sui tubi centrali e in basso)
        "Temp Ritorno (Blu)": { cX: 918, cY: 422, w: 300, h: 160 },
        "Temp Mandata (Rosso)": { cX: 1196, cY: 422, w: 300, h: 160 },
        "Temp AFS (Blu sx)": { cX: 441, cY: 1400, w: 200, h: 120 },
        "Temp ACS (Rosso sx)": { cX: 687, cY: 1400, w: 200, h: 120 },

        // Dispositivi di Destra
        "Misuratore Danfoss": { cX: 1016, cY: 1177, w: 350, h: 350 },
        "Attuatore Motorizzato": { cX: 1409, cY: 893, w: 280, h: 420 }
    },

    hitboxes: [], // Reset dinamico

    // 4. MOCK DATI IN TEMPO REALE
    fetchDati: function (callback) {
        // Inizializziamo lo stato persistente se non esiste
        if (!window.ContatoreGlobalState) {
            window.ContatoreGlobalState = {
                acs_mc: 124.5,
                afs_mc: 89.2,
                energy_kwt: 45.7,
                valve_states: ["APERTA", "APERTA", "CHIUSA"], // ACS, AFS, HVAC
                pinnedDetailsView: 'STATISTICHE' // 'STATISTICHE' o 'MANUTENZIONE'
            };
        }

        const s = window.ContatoreGlobalState;
        const now = new Date();

        // Simuliamo un leggero incremento/fluttuazione dei dati
        s.acs_mc += Math.random() * 0.01;
        s.afs_mc += Math.random() * 0.005;
        s.energy_kwt += Math.random() * 0.02;

        const mockData = {
            timestamp: now,
            dataStr: now.toLocaleDateString('it-IT'),
            oraStr: now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),

            // Volumi m3
            acs_mc: s.acs_mc.toFixed(2),
            afs_mc: s.afs_mc.toFixed(2),

            // Stato Valvole
            valve_acs: s.valve_states[0],
            valve_afs: s.valve_states[1],
            valve_hvac: s.valve_states[2],

            // Misuratore Energetico
            energy_kwt: s.energy_kwt.toFixed(1),
            flow_rate: (2.5 + Math.random() * 0.3).toFixed(1), // l/min

            // Temperature (Fluctuating)
            temp_supply: (60.2 + (Math.random() * 0.4 - 0.2)).toFixed(1), // Mandata HVAC
            temp_return: (40.1 + (Math.random() * 0.4 - 0.2)).toFixed(1), // Ritorno HVAC
            temp_acs_out: (48.5 + (Math.random() * 0.2 - 0.1)).toFixed(1), // ACS sx
            temp_afs_in: (12.1 + (Math.random() * 0.1 - 0.05)).toFixed(1)  // AFS sx
        };
        callback(mockData);
    },

    // 5. MOTORE GRAFICO SPECIFICO
    draw: function (ctx, dati, config) {
        const W = this.config.canvasW, H = this.config.canvasH;

        // Assicuriamoci che l'immagine sia caricata prima di procedere
        this.preloadImage(() => {

            ctx.clearRect(0, 0, W, H);
            this.hitboxes = []; // Reset hitboxes dinamiche

            // Recupera lo stato globale per capire se siamo pinnati
            const isPinned = window.isPinned || false;

            // Il RAMO A (Vista doppia) è stato rimosso.
            // Utilizziamo unicamente la VISTA STANDARD in ogni caso.

            // ---------------------------------------------------------
            // RAMO B: VISTA STANDARD (ANNOTATA SOPRA IMMAGINE REALE)
            // ---------------------------------------------------------

            // Ripristina dimensioni Canvas nativo se necessario
            if (ctx.canvas.width !== W || ctx.canvas.height !== H) {
                ctx.canvas.width = W; ctx.canvas.height = H;
            }

            // --- 1. DISEGNO HEADER SUPERIORE ---
            // Sfondo scuro e tecnologico per l'header
            const headBox = { x: 0, y: 0, w: W, h: this.map.header_hY };
            const bgGrad = ctx.createLinearGradient(0, 0, W, headBox.h);
            bgGrad.addColorStop(0, '#0d1f3c'); bgGrad.addColorStop(1, '#061325');
            ctx.fillStyle = bgGrad;
            ctx.beginPath(); ctx.roundRect(headBox.x, headBox.y, headBox.w, headBox.h, { tl: 40, tr: 40, bl: 0, br: 0 }); ctx.fill();

            // Bordo inferiore cyan
            ctx.strokeStyle = 'rgba(6,182,212,1)'; ctx.lineWidth = 6;
            ctx.beginPath(); ctx.moveTo(0, headBox.h); ctx.lineTo(W, headBox.h); ctx.stroke();

            // Nome del contatore (Grande)
            ctx.fillStyle = '#f1f5f9'; ctx.font = 'bold 90px Inter'; ctx.textAlign = 'left';
            ctx.fillText(config.nome || "CONTATORE GENERALE", 80, 130);

            // Data e Ora (Sulla destra, Cyan)
            ctx.fillStyle = 'rgba(6,182,212,1)'; ctx.font = 'bold 60px Inter'; ctx.textAlign = 'right';
            ctx.fillText(`${dati.dataStr} · ${dati.oraStr}`, W - 80, 130);

            // --- 2. DISEGNO IMMAGINE DI SFONDO (Sotto l'header) ---
            if (this.imageLoaded && this.backgroundImage) {
                ctx.drawImage(this.backgroundImage, 0, headBox.h, 1696, 2516);

                // Aggiungiamo un leggero overlay scuro su tutta l'immagine per far risaltare il testo
                ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
                ctx.fillRect(0, headBox.h, 1696, 2516);
            } else {
                // Fallback grigio
                ctx.fillStyle = '#333'; ctx.fillRect(0, headBox.h, 1696, 2516);
                ctx.fillStyle = '#fff'; ctx.font = '50px Inter'; ctx.textAlign = 'center';
                ctx.fillText("Caricamento Immagine...", W / 2, headBox.h + 2516 / 2);
            }

            // --- 3. DISEGNO ANNOTAZIONI DINAMICHE ---
            this.drawStandardAnnotations(ctx, dati);

        });
    },

    // Funzione helper per disegnare le annotazioni in vista standard (Con Auto-Scaling)
    drawStandardAnnotations: function (ctx, dati) {
        const map = this.map;
        // Applichiamo l'offset ESATTAMENTE UNA VOLTA QUI.
        const offsetY = map.header_hY || 200;

        // ==========================================
        // 1. DISEGNO CERCHI (Auto-adattanti)
        // ==========================================
        const drawCircle = (label, valore, unita, cX, cY, diametro, colorTheme) => {
            const x = cX;
            const y = cY + offsetY;
            const raggio = diametro / 2;

            // Sfondo scuro e Bordo
            ctx.fillStyle = 'rgba(13, 31, 60, 0.85)';
            ctx.beginPath(); ctx.arc(x, y, raggio, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = colorTheme || '#06b6d4'; ctx.lineWidth = Math.max(2, diametro * 0.02);
            ctx.beginPath(); ctx.arc(x, y, raggio, 0, Math.PI * 2); ctx.stroke();

            // Calcolo DINAMICO del font in base al diametro!
            const valSize = Math.floor(diametro * 0.22); // Il valore prende il 22% del diametro
            const lblSize = Math.floor(diametro * 0.09); // Le etichette il 9%

            ctx.textBaseline = 'middle'; ctx.textAlign = 'center';

            ctx.fillStyle = 'rgba(148,163,184,1)';
            ctx.font = `bold ${lblSize}px Inter`;
            ctx.fillText(label.toUpperCase(), x, y - (diametro * 0.18));

            ctx.fillStyle = colorTheme || '#f1f5f9';
            ctx.font = `bold ${valSize}px Inter`;
            ctx.fillText(valore, x, y + (diametro * 0.05));

            ctx.fillStyle = '#94a3b8';
            ctx.font = `${lblSize}px Inter`;
            ctx.fillText(unita, x, y + (diametro * 0.28));
        };

        // ==========================================
        // 2. DISEGNO RETTANGOLI (Auto-adattanti)
        // ==========================================
        const drawRect = (label, valore, unita, cX, cY, w, h, colorTheme) => {
            const x = cX - (w / 2);
            const y = (cY + offsetY) - (h / 2);

            ctx.fillStyle = 'rgba(13, 31, 60, 0.85)';
            ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(20, h * 0.2)); ctx.fill();
            ctx.strokeStyle = colorTheme || '#06b6d4'; ctx.lineWidth = Math.max(2, h * 0.03);
            ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(20, h * 0.2)); ctx.stroke();

            ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
            const centerY = y + (h / 2);

            if (h <= 120) {
                // Modello su singola riga (Es. Temperature)
                // Il font si adatta per non sforare né in altezza né in larghezza
                const fontSize = Math.floor(Math.min(h * 0.45, w * 0.18));
                ctx.fillStyle = '#f1f5f9';
                ctx.font = `bold ${fontSize}px Inter`;
                ctx.fillText(`${valore} ${unita}`, cX, centerY + 2);
            } else {
                // Modello multi-riga (Es. Danfoss)
                const valSize = Math.floor(Math.min(h * 0.25, w * 0.2));
                const lblSize = Math.floor(Math.min(h * 0.12, w * 0.1));

                ctx.fillStyle = 'rgba(148,163,184,1)';
                ctx.font = `bold ${lblSize}px Inter`;
                ctx.fillText(label.toUpperCase(), cX, y + (h * 0.25));

                ctx.fillStyle = colorTheme || '#f1f5f9';
                ctx.font = `bold ${valSize}px Inter`;
                ctx.fillText(valore, cX, centerY + (h * 0.05));

                ctx.fillStyle = '#94a3b8';
                ctx.font = `${lblSize}px Inter`;
                ctx.fillText(unita, cX, y + h - (h * 0.15));
            }
        };

        // ==========================================
        // 3. DISEGNO VALVOLE (Auto-adattanti)
        // ==========================================
        const drawValve = (label, stato, cX, cY, w, h) => {
            const x = cX - (w / 2);
            const y = (cY + offsetY) - (h / 2);

            ctx.fillStyle = 'rgba(13, 31, 60, 0.85)';
            ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(20, h * 0.2)); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = Math.max(2, h * 0.03);
            ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(20, h * 0.2)); ctx.stroke();

            let statusColor = (stato === "APERTA") ? "#22c55e" : "#eab308";
            ctx.textBaseline = 'middle';
            const centerY = y + (h / 2);

            // Calcolo font dinamico e posizione pallino
            const fontSize = Math.floor(Math.min(h * 0.35, w * 0.1));
            const iconRadius = Math.floor(h * 0.15);
            const startX = x + (w * 0.15); // Margine sinistro proporzionale

            ctx.fillStyle = statusColor;
            ctx.beginPath(); ctx.arc(startX, centerY, iconRadius, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = '#94a3b8';
            ctx.font = `${fontSize}px Inter`; ctx.textAlign = 'left';
            ctx.fillText(label, startX + iconRadius + 15, centerY + 2);

            ctx.fillStyle = statusColor;
            ctx.font = `bold ${fontSize}px Inter`;
            // Posizioniamo lo stato sulla destra
            ctx.fillText(stato, x + (w * 0.55), centerY + 2);
        };

        // ==========================================
        // ESECUZIONE DISEGNO
        // ==========================================

        // Contatori (CERCHI)
        drawCircle("Acqua Fredda", dati.afs_mc, "m³", map["Contatore Acqua Fredda"].cX, map["Contatore Acqua Fredda"].cY, map["Contatore Acqua Fredda"].w, '#06b6d4');
        drawCircle("Acqua Calda", dati.acs_mc, "m³", map["Contatore Acqua Calda"].cX, map["Contatore Acqua Calda"].cY, map["Contatore Acqua Calda"].w, '#ef4444');

        // Valvole (RETTANGOLI STATO)
        drawValve("VALVOLA", dati.valve_afs, map["Valvola Acqua Fredda"].cX, map["Valvola Acqua Fredda"].cY, map["Valvola Acqua Fredda"].w, map["Valvola Acqua Fredda"].h);
        drawValve("VALVOLA", dati.valve_acs, map["Valvola Acqua Calda"].cX, map["Valvola Acqua Calda"].cY, map["Valvola Acqua Calda"].w, map["Valvola Acqua Calda"].h);
        drawValve("MOTORE", dati.valve_hvac, map["Attuatore Motorizzato"].cX, map["Attuatore Motorizzato"].cY, map["Attuatore Motorizzato"].w, map["Attuatore Motorizzato"].h);

        // Danfoss e Temperature (RETTANGOLI DATI)
        drawRect("Energia Termica", dati.energy_kwt, "kWh", map["Misuratore Danfoss"].cX, map["Misuratore Danfoss"].cY, map["Misuratore Danfoss"].w, map["Misuratore Danfoss"].h, '#eab308');
        drawRect("Mandata", dati.temp_supply, "°C", map["Temp Mandata (Rosso)"].cX, map["Temp Mandata (Rosso)"].cY, map["Temp Mandata (Rosso)"].w, map["Temp Mandata (Rosso)"].h, '#ef4444');
        drawRect("Ritorno", dati.temp_return, "°C", map["Temp Ritorno (Blu)"].cX, map["Temp Ritorno (Blu)"].cY, map["Temp Ritorno (Blu)"].w, map["Temp Ritorno (Blu)"].h, '#3b82f6');
        drawRect("Temp AFS", dati.temp_afs_in, "°C", map["Temp AFS (Blu sx)"].cX, map["Temp AFS (Blu sx)"].cY, map["Temp AFS (Blu sx)"].w, map["Temp AFS (Blu sx)"].h, '#60a5fa');
        drawRect("Temp ACS", dati.temp_acs_out, "°C", map["Temp ACS (Rosso sx)"].cX, map["Temp ACS (Rosso sx)"].cY, map["Temp ACS (Rosso sx)"].w, map["Temp ACS (Rosso sx)"].h, '#f87171');

        // Reset
        ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    },
};