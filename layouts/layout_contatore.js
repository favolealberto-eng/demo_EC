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
    imageSrc: 'images/contatore/Contatore.jpg',
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

    // 3. MAPPATURA COORDINATE (Dal CSV, aggiunti +200px alla Y del baricentro per l'header)
    // Oggetto: { centroX, centroY, disponibiliW, disponibiliH }
    map: {
        header_hY: 200, // Offset Y dove inizia l'immagine

        // Contatori volumetrici (Cerchi)
        "Contatore Acqua Fredda": { cX: 250, cY: 300 + 200, w: 170, h: 177 },
        "Contatore Acqua Calda": { cX: 750, cY: 300 + 200, w: 170, h: 177 },

        // Valvole di intercettazione (Rettangoli)
        "Valvola Acqua Fredda": { cX: 280, cY: 850 + 200, w: 300, h: 80 },
        "Valvola Acqua Calda": { cX: 780, cY: 850 + 200, w: 300, h: 80 },

        // Misuratore Energetico (Rettangolo)
        "Misuratore Danfoss": { cX: 1250, cY: 600 + 200, w: 400, h: 300 },

        // Attuatore motorizzato (Rettangolo)
        "Attuatore Motorizzato": { cX: 1600, cY: 900 + 200, w: 500, h: 400 },

        // Temperature (Tubi)
        "Temp Mandata (Rosso)": { cX: 1250, cY: 250 + 200, w: 180, h: 60 },
        "Temp Ritorno (Blu)": { cX: 1450, cY: 250 + 200, w: 180, h: 60 },
        "Temp ACS (Rosso sx)": { cX: 500, cY: 1050 + 200, w: 180, h: 60 },
        "Temp AFS (Blu sx)": { cX: 150, cY: 1050 + 200, w: 180, h: 60 } // Aggiunto per simmetria
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

            // ---------------------------------------------------------
            // RAMO A: VISTA PINNATA (STILE PAGINA WEB CON DETTAGLI E PULSANTI)
            // ---------------------------------------------------------
            if (isPinned) {
                // Sfondo solido e pulito stile pagina web
                ctx.fillStyle = '#061325';
                ctx.fillRect(0, 0, W, H);

                // --- HEADER PAGINA (Stile layout_quadroEl) ---
                const headerH = 250;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.fillRect(0, 0, W, headerH);
                ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)'; ctx.lineWidth = 4;
                ctx.beginPath(); ctx.moveTo(0, headerH); ctx.lineTo(W, headerH); ctx.stroke();

                ctx.fillStyle = '#f1f5f9'; ctx.font = 'bold 100px Inter'; ctx.textAlign = 'left';
                ctx.fillText(`CONTATORE GENERALE - ID: ${config.id_macchina || 'QE-01'}`, 80, 160);

                // --- STRUTTURA A COLONNE ---
                const colW = (W - 150) / 2;
                const colY = headerH + 80;

                // COLONNA SINISTRA: IMMAGINE RIDOTTA E ANNOTATA (Per contesto)
                ctx.save();
                const imgScale = 0.9;
                ctx.translate(80, colY);
                ctx.scale(imgScale, imgScale);

                // Disegno immagine ridotta
                if (this.imageLoaded && this.backgroundImage) {
                    ctx.drawImage(this.backgroundImage, 0, 0, 1696, 2516);
                }

                // Disegno le annotazioni ridotte sopra l'immagine
                // (Chiamiamo la funzione di disegno standard ma dentro questa trasformazione)
                ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center';
                this.drawStandardAnnotations(ctx, dati, { cX: 0, cY: 0 }); // Usiamo offset 0 perchè siamo già traslati
                ctx.restore();

                // COLONNA DESTRA: DETTAGLI E PULSANTI (Stile layout_appartamento)
                ctx.save();
                ctx.translate(80 + colW + 80, colY);

                // Container dettagli
                ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
                ctx.beginPath(); ctx.roundRect(0, 0, colW, 1600, 30); ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.stroke();

                // Titolo colonna
                ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 60px Inter'; ctx.textAlign = 'center';
                ctx.fillText("DETTAGLI APPROFONDITI", colW / 2, 90);

                // Sottotitolo ora aggiornata
                ctx.fillStyle = '#94a3b8'; ctx.font = '36px Inter';
                ctx.fillText(`Dati live aggiornati alle: ${dati.oraStr}`, colW / 2, 150);

                // --- ELENCO DETTAGLI (List Riga stile layout_quadroEl) ---
                let dY = 250;
                const drawDetailRiga = (y, label, valore, unita, colorTheme) => {
                    const rowH = 100;
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
                    ctx.beginPath(); ctx.roundRect(40, y - 70, colW - 80, rowH, 15); ctx.fill();

                    ctx.fillStyle = '#94a3b8'; ctx.font = '40px Inter'; ctx.textAlign = 'left';
                    ctx.fillText(label, 70, y);

                    ctx.fillStyle = colorTheme || '#f1f5f9'; ctx.font = 'bold 50px Inter'; ctx.textAlign = 'right';
                    ctx.fillText(`${valore} ${unita}`, colW - 70, y);
                };

                drawDetailRiga(dY, "Consumo Totale Acqua Fredda", dati.afs_mc, "m³"); dY += 130;
                drawDetailRiga(dY, "Consumo Totale Acqua Calda", dati.acs_mc, "m³"); dY += 130;
                drawDetailRiga(dY, "Energia Termica HVAC Accumulata", dati.energy_kwt, "kWh"); dY += 130;
                drawDetailRiga(dY, "Portata Istantanea HVAC", dati.flow_rate, "l/min"); dY += 130;

                // Temperature Details
                ctx.fillStyle = '#64748b'; ctx.font = 'bold 45px Inter'; ctx.textAlign = 'left'; dY += 50;
                ctx.fillText("DIAGNOSTICA TEMPERATURE", 60, dY);
                dY += 80;

                const dT = (parseFloat(dati.temp_supply) - parseFloat(dati.temp_return)).toFixed(1);
                drawDetailRiga(dY, "Temp. Mandata HVAC (Ingresso)", dati.temp_supply, "°C", '#ef4444'); dY += 110;
                drawDetailRiga(dY, "Temp. Ritorno HVAC (Uscita)", dati.temp_return, "°C", '#3b82f6'); dY += 110;
                drawDetailRiga(dY, "Differenziale Termico ΔT", dT, "°C", (dT > 15 ? '#22c55e' : '#facc15')); dY += 110;
                drawDetailRiga(dY, "Temp. Uscita Acqua Calda Sanitaria", dati.temp_acs_out, "°C"); dY += 130;

                // --- PULSANTI INTERATTIVI (In fondo alla colonna) ---
                const btnW = colW - 200, btnH = 150;
                ctx.save(); ctx.translate(100, dY + 100);

                const drawButton = (y, text) => {
                    ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
                    ctx.beginPath(); ctx.roundRect(0, y, btnW, btnH, 30); ctx.fill();
                    ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)'; ctx.lineWidth = 3; ctx.stroke();
                    ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 60px Inter'; ctx.textAlign = 'center';
                    ctx.fillText(`${text}`, btnW / 2, y + btnH / 2 + 20);
                };

                drawButton(0, "STORICO ENERGETICO");
                // Mappiamo hitbox (attenzione, siamo traslati due volte!)
                this.hitboxes.push({ id: "apri_grafico", x: 80 + colW + 80 + 100, y: colY + dY + 100, w: btnW, h: btnH });

                drawButton(200, "ULTIMA MANUTENZIONE");
                this.hitboxes.push({ id: "apri_manutenzione", x: 80 + colW + 80 + 100, y: colY + dY + 300, w: btnW, h: btnH });

                ctx.restore();
                ctx.restore();

                return; // INTERROMPE LA FUNZIONE: non disegniamo il layout standard
            }

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
            this.drawStandardAnnotations(ctx, dati, { cX: 0, cY: 0 });

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