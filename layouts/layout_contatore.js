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
            this.drawStandardAnnotations(ctx, dati, { cX: 0, cY: this.map.header_hY });

        });
    },

    // Funzione helper per disegnare le annotazioni (pill boxes) in vista standard
    drawStandardAnnotations: function (ctx, dati, offset) {
        ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';

        const map = this.map;
        const ox = offset.cX; const oy = offset.cY;

        // Funzione helper per disegnare un "Pill Box" semitrasparente adattivo
        const drawDataPill = (label, valore, unita, xMap, yMap, wMap, hMap, colorTheme) => {
            // Calcoliamo l'angolo in alto a sinistra dal centro fornito nel CSV
            const w = Math.min(wMap, 450); // Limitiamo larghezza massima per leggibilità
            const h = hMap;
            const x = (xMap + ox) - (w / 2);
            const y = (yMap + oy) - (h / 2);

            // Fondo scuro semitrasparente (stile vetro fumè)
            ctx.fillStyle = 'rgba(13, 31, 60, 0.85)';
            ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();

            // Bordo colorato
            ctx.strokeStyle = colorTheme || '#06b6d4'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.stroke();

            // --- DEBUG: Disegna un mirino rosso ESATTAMENTE sul centro ---
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(xMap + ox, yMap + oy, 15, 0, Math.PI * 2);
            ctx.fill();
            // -------------------------------------------------------------


            // Allineamento verticale testo
            ctx.textBaseline = 'middle';
            const centerY = y + (h / 2);

            // Se l'altezza è bassa (es. tubi temperature), mettiamo tutto sulla stessa riga
            if (h < 80) {
                ctx.fillStyle = '#f1f5f9'; ctx.font = 'bold 36px Inter'; ctx.textAlign = 'center';
                // ctx.fillText(`${label}: ${valore}${unita}`, x + (w / 2), centerY + 4); // Troppo affollato
                ctx.fillText(`${valore}${unita}`, x + (w / 2), centerY + 4);
            }
            // Altrimenti riga etichetta e riga valore
            else {
                // Label (Piccola in alto)
                ctx.fillStyle = 'rgba(148,163,184,1)'; ctx.font = '32px Inter'; ctx.textAlign = 'center';
                ctx.fillText(label.toUpperCase(), x + (w / 2), y + 55);

                // Valore (Grande al centro)
                ctx.fillStyle = colorTheme || '#f1f5f9'; ctx.font = 'bold 65px Inter';
                ctx.fillText(valore, x + (w / 2), centerY + 25);

                // Unità (Piccola sotto il valore)
                ctx.fillStyle = '#94a3b8'; ctx.font = '32px Inter';
                ctx.fillText(unita, x + (w / 2), y + h - 30);
            }
            ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center'; // Reset
        };

        // Funzione helper per disegnare un indicatore di stato valvola
        const drawValveStatusPill = (label, stato, xMap, yMap, wMap, hMap) => {
            const w = Math.min(wMap, 350);
            const h = hMap;
            const x = (xMap + ox) - (w / 2);
            const y = (yMap + oy) - (h / 2);

            ctx.fillStyle = 'rgba(13, 31, 60, 0.85)';
            ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();

            ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.stroke();

            // --- DEBUG: Disegna un mirino rosso ESATTAMENTE sul centro ---
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(xMap + ox, yMap + oy, 15, 0, Math.PI * 2);
            ctx.fill();
            // -------------------------------------------------------------

            // Colore stato (Verde aperto, Giallo chiuso)
            let statusColor = (stato === "APERTA") ? "#22c55e" : "#eab308";

            // Allineamento verticale
            ctx.textBaseline = 'middle';
            const centerY = y + (h / 2);

            // Pallino stato
            ctx.fillStyle = statusColor;
            ctx.beginPath(); ctx.arc(x + 50, centerY, 15, 0, Math.PI * 2); ctx.fill();

            // Testo Label e Stato
            ctx.fillStyle = '#94a3b8'; ctx.font = '36px Inter'; ctx.textAlign = 'left';
            ctx.fillText(label, x + 90, centerY + 4);
            ctx.fillStyle = statusColor; ctx.font = 'bold 36px Inter';
            ctx.fillText(stato, x + 210, centerY + 4);
            ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center';
        };

        const m = map;
        // 1. Contatori volumetrici (Grande rilievo)
        drawDataPill("Acqua Fredda", dati.afs_mc, "m³", m["Contatore Acqua Fredda"].cX, m["Contatore Acqua Fredda"].cY, 420, 200);
        drawDataPill("Acqua Calda", dati.acs_mc, "m³", m["Contatore Acqua Calda"].cX, m["Contatore Acqua Calda"].cY, 420, 200, '#ef4444');

        // 2. Valvole (Indicatore stato)
        drawValveStatusPill("VALVOLA", dati.valve_afs, m["Valvola Acqua Fredda"].cX, m["Valvola Acqua Fredda"].cY, 350, 80);
        drawValveStatusPill("VALVOLA", dati.valve_acs, m["Valvola Acqua Calda"].cX, m["Valvola Acqua Calda"].cY, 350, 80);
        drawValveStatusPill("ATTUATORE", dati.valve_hvac, m["Attuatore Motorizzato"].cX, m["Attuatore Motorizzato"].cY, 400, 100);

        // 3. Misuratore Danfoss (Dati complessi)
        drawDataPill("Energia HVAC", dati.energy_kwt, "kWh", m["Misuratore Danfoss"].cX, m["Misuratore Danfoss"].cY, 450, 220, '#eab308');

        // 4. Temperature (Sottili sui tubi)
        // Usiamo colori Rosso/Blu per mandata/ritorno
        drawDataPill("Mandata", dati.temp_supply, "°C", m["Temp Mandata (Rosso)"].cX, m["Temp Mandata (Rosso)"].cY, 180, 65, '#ef4444');
        drawDataPill("Ritorno", dati.temp_return, "°C", m["Temp Ritorno (Blu)"].cX, m["Temp Ritorno (Blu)"].cY, 180, 65, '#3b82f6');
        drawDataPill("Temp ACS", dati.temp_acs_out, "°C", m["Temp ACS (Rosso sx)"].cX, m["Temp ACS (Rosso sx)"].cY, 180, 65, '#f87171'); // Rosso chiaro
        drawDataPill("Temp AFS", dati.temp_afs_in, "°C", m["Temp AFS (Blu sx)"].cX, m["Temp AFS (Blu sx)"].cY, 180, 65, '#60a5fa');  // Blu chiaro

        // --- HITBOXES DELLA VISTA STANDARD ---
        // Aggiungiamo hitbox sulle annotazioni principali per futuri approfondimenti
        this.hitboxes.push({ id: "apri_dettaglio_acs", x: m["Contatore Acqua Calda"].cX - 210, y: m["Contatore Acqua Calda"].cY - 100, w: 420, h: 200 });
        this.hitboxes.push({ id: "apri_dettaglio_afs", x: m["Contatore Acqua Fredda"].cX - 210, y: m["Contatore Acqua Fredda"].cY - 100, w: 420, h: 200 });
        this.hitboxes.push({ id: "apri_dettaglio_danfoss", x: m["Misuratore Danfoss"].cX - 225, y: m["Misuratore Danfoss"].cY - 110, w: 450, h: 220 });
    },

    // 6. GESTIONE INTERAZIONI ( processClick )
    processClick: function (boxId) {
        // Se non siamo pinnati, non gestiamo i click per ora
        if (!window.isPinned) return;

        console.log("Cliccato oggetto contatore pinnato:", boxId);

        if (boxId === "apri_grafico") {
            // Placeholder: qui si potrebbe aprire una modale con il grafico (stile layout_appartamento)
            alert("Simulazione: Apertura Grafico Storico Energetico...");
        } else if (boxId === "apri_manutenzione") {
            // Placeholder: qui si potrebbe mostrare la cronologia manutenzioni
            alert(`Simulazione: Apertura Registro Manutenzioni.\nUltimo intervento: 15/03/2026 - Sostituzione fusibile L1.`);
        }
    }
};