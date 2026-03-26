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
                pinnedDetailsView: 'STATISTICHE', // 'STATISTICHE' o 'MANUTENZIONE'
                vistaDashboard: false
            };
        }

        const s = window.ContatoreGlobalState;
        const now = new Date();

        // Simuliamo un leggero incremento/fluttuazione dei dati
        s.acs_mc += Math.random() * 0.01;
        s.afs_mc += Math.random() * 0.005;
        s.energy_kwt += Math.random() * 0.02;

        const currentSlotIndex = Math.floor(now.getHours() * 4 + now.getMinutes() / 15);
        const h_sync = Math.floor(currentSlotIndex / 4).toString().padStart(2, '0');
        const m_sync = ((currentSlotIndex % 4) * 15).toString().padStart(2, '0');
        const str_ora_attuale = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

        const mockACS = typeof getMockDayData === 'function' ? getMockDayData('acs') : [];
        const mockAFS = typeof getMockDayData === 'function' ? getMockDayData('afs') : [];
        const mockRSC = typeof getMockDayData === 'function' ? getMockDayData('riscaldamento') : [];

        const acsConsumo = mockACS.length > currentSlotIndex ? mockACS.slice(0, currentSlotIndex + 1).reduce((sum, val) => sum + parseFloat(val), 0).toFixed(0) : "45";
        const acsPicco = Math.round(Number(acsConsumo) * 0.15 + 2);
        const acsTrend = 5.2; 

        const afsConsumo = mockAFS.length > currentSlotIndex ? mockAFS.slice(0, currentSlotIndex + 1).reduce((sum, val) => sum + parseFloat(val), 0).toFixed(0) : "120";
        
        let afsAnomaliaText = null;
        if (Number(afsConsumo) > 500) {
            afsAnomaliaText = "Superato limite giornaliero (500 L)";
        } else if (now.getHours() >= 9 && now.getHours() <= 11) {
            afsAnomaliaText = "Possibile perdita/consumo continuo";
        }
        const afsAnomalia = afsAnomaliaText !== null;
        
        const rscConsumo = mockRSC.length > currentSlotIndex ? mockRSC.slice(0, currentSlotIndex + 1).reduce((sum, val) => sum + parseFloat(val), 0).toFixed(1) : "2.5";
        const rscMediaSet = 18.5; 
        const rscIsUp = parseFloat(rscConsumo) > (rscMediaSet / 7);

        let overallStatus = "ok";
        if (afsAnomalia) overallStatus = "warning";

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
            temp_afs_in: (12.1 + (Math.random() * 0.1 - 0.05)).toFixed(1),  // AFS sx
            
            // Dati cruscotto Appartamento
            nome: "CONTATORE GENERALE",
            overallStatus: overallStatus,
            str_ora_attuale: str_ora_attuale,
            last_update: `${h_sync}:${m_sync}`,
            acs: { consumo: acsConsumo, picco: acsPicco, trend: acsTrend },
            afs: { consumo: afsConsumo, anomalia: afsAnomalia, anomaliaTesto: afsAnomaliaText },
            riscaldamento: { consumo: rscConsumo, media_settimanale: rscMediaSet, is_up: rscIsUp }
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
                this.drawStandardAnnotations(ctx, dati, { cX: 0, cY: this.map.header_hY });
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

            // AGGIUNTA DASHBOARD: se vistaDashboard è true
            if (window.ContatoreGlobalState && window.ContatoreGlobalState.vistaDashboard) {
                this.hitboxes = [];
                if (ctx.canvas.width !== 800 || ctx.canvas.height !== 1600) {
                    ctx.canvas.width = 800; ctx.canvas.height = 1600;
                    const markerId = ctx.canvas.id.replace('canvas-', '');
                    const plane3D = document.getElementById('plane-' + markerId);
                    if (plane3D) {
                        plane3D.setAttribute('width', 2.2);
                        plane3D.setAttribute('height', 4.4);
                    }
                }

                ctx.fillStyle = 'rgba(13, 31, 60, 0.9)';
                ctx.beginPath();
                ctx.roundRect(0, 0, 800, 1600, 40);
                ctx.fill();
                ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
                ctx.lineWidth = 4;
                ctx.stroke();

                this.drawMain(ctx, dati, 800, 1600);
                return;
            }

            // Ripristina dimensioni Canvas nativo se necessario
            if (ctx.canvas.width !== W || ctx.canvas.height !== H) {
                ctx.canvas.width = W; ctx.canvas.height = H;
                const markerId = ctx.canvas.id.replace('canvas-', '');
                const plane3D = document.getElementById('plane-' + markerId);
                if (plane3D) {
                    plane3D.setAttribute('width', this.config.planeW);
                    plane3D.setAttribute('height', this.config.planeH);
                }
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
    },

    drawMain: function(ctx, dati, w, h) {
        // --- HEADER LOGICA ---
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.roundRect(0, 0, w, 180, { tl: 40, tr: 40, bl: 0, br: 0 });
        ctx.fill();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.beginPath(); ctx.moveTo(0, 180); ctx.lineTo(w, 180); ctx.stroke();

        // Icona/Testo
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 50px Inter';
        ctx.textAlign = 'left';
        ctx.fillText(dati.nome, 50, 80);

        // Ultimo aggiornamento
        ctx.fillStyle = '#94a3b8';
        ctx.font = '24px Inter';
        ctx.fillText(`Ultimo agg: ${dati.last_update} - Ora attuale: ${dati.str_ora_attuale}`, 50, 130);

        // Spia Globale + Icona info globale
        let colorSemaforo = '#22c55e'; // Verde ok
        let glowSemaforo = 'rgba(34, 197, 94, 0.6)';
        if (dati.overallStatus === "warning") {
            colorSemaforo = '#facc15'; // Giallo
            glowSemaforo = 'rgba(250, 204, 21, 0.6)';
        } else if (dati.overallStatus === "error") {
            colorSemaforo = '#ef4444'; // Rosso
            glowSemaforo = 'rgba(239, 68, 68, 0.6)';
        }

        ctx.save();
        ctx.shadowColor = glowSemaforo;
        ctx.shadowBlur = 30;
        ctx.fillStyle = colorSemaforo;
        ctx.beginPath(); ctx.arc(w - 180, 90, 30, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // --- SEZIONI ---
        let currentY = 220;

        // 1. ACS (Acqua Calda Sanitaria)
        currentY = this.drawSection(ctx, currentY, w, "ACS - Acqua Calda", '#0ea5e9', [
            { label: "Consumo Giornaliero:", value: `${dati.acs.consumo} L` },
            { label: "Picco Istantaneo:", value: `${dati.acs.picco} L/min` },
            { label: "Trend Settimanale:", value: `+${dati.acs.trend}% ▲` }
        ], 'btn_info_acs');

        currentY += 40;

        // 2. AFS (Acqua Fredda Sanitaria)
        // Se c'è anomalia inserisco item alert e pulldown mail
        let afsItems = [
            { label: "Consumo Giornaliero:", value: `${dati.afs.consumo} L` }
        ];
        if (dati.afs.anomalia) {
            afsItems.push({ label: "⚠️ ALERT: ", value: dati.afs.anomaliaTesto, valColor: '#ef4444', isAlert: true });
            // Add a mailto button layout inside section
        } else {
            afsItems.push({ label: "Stato Alert:", value: "Nessun problema", valColor: '#22c55e' });
        }
        currentY = this.drawSection(ctx, currentY, w, "AFS - Acqua Fredda", '#3b82f6', afsItems, 'btn_info_afs', dati.afs.anomalia ? 'mail_idraulico' : null);

        currentY += 40;

        // 3. Riscaldamento
        currentY = this.drawSection(ctx, currentY, w, "Riscaldamento", '#f97316', [
            { label: "Consumo Giornaliero:", value: `${dati.riscaldamento.consumo} kWh` },
            { label: "Media Settimanale:", value: `${dati.riscaldamento.media_settimanale} kWh` },
            { label: "Rispetto alla media:", value: dati.riscaldamento.is_up ? '▲ In aumento' : '▼ In calo', valColor: dati.riscaldamento.is_up ? '#ef4444' : '#22c55e' }
        ], 'btn_info_rsc', null, '#f97316' /* mini icon termica implicitamente data da questo colore main */ );


        // --- PULSANTE GLOBALE DIAGNOSTICA ---
        const btnDiagY = currentY + 40;
        const btnBoxDiag = { id: "btn_diagnostica", x: 100, y: btnDiagY, w: 600, h: 90 };
        this.hitboxes.push(btnBoxDiag);

        const isPinned = window.isPinned;
        if (!isPinned) ctx.globalAlpha = 0.4;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath(); ctx.roundRect(btnBoxDiag.x, btnBoxDiag.y, btnBoxDiag.w, btnBoxDiag.h, 45); ctx.fill();
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2; ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.font = 'bold 32px Inter';
        ctx.fillText(isPinned ? "⚙ DIAGNOSTICA E DETTAGLI" : "🔒 DIAGNOSTICA E DETTAGLI", w/2, btnDiagY + 55);

        if (!isPinned) ctx.globalAlpha = 1.0;
    },

    drawSection: function(ctx, y, w, title, colorPrimary, items, infoBtnId, alertMailId = null, extraColorLight = null) {
        const hSec = alertMailId ? 380 : 310;
        const padding = 40;
        const secW = w - (padding * 2);

        // Box
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.beginPath(); ctx.roundRect(padding, y, secW, hSec, 20); ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.stroke();

        // Linea colorata laterale sx
        ctx.fillStyle = colorPrimary;
        ctx.beginPath(); ctx.roundRect(padding, y + 20, 8, hSec - 40, 4); ctx.fill();

        // Titolo sezione
        let iconOffset = 0;
        if (title.includes("Riscaldamento")) {
            ctx.fillStyle = colorPrimary;
            ctx.font = 'bold 36px Inter';
            ctx.textAlign = 'left';
            ctx.fillText("🌡", padding + 30, y + 55);
            iconOffset = 45;
        }

        ctx.fillStyle = '#f1f5f9';
        ctx.textAlign = 'left';
        ctx.font = 'bold 34px Inter';
        ctx.fillText(title, padding + 30 + iconOffset, y + 55);

        // Eventuale spia stato sezione
        if (extraColorLight) {
            ctx.fillStyle = colorPrimary; // Usiamo questo come colore stato "acceso" se c'è
            ctx.beginPath(); ctx.arc(padding + secW - 40, y + 40, 15, 0, Math.PI * 2); ctx.fill();
        }

        // Variabili items
        let itemY = y + 120;
        items.forEach(it => {
            if (it.isAlert) {
                ctx.fillStyle = it.valColor || '#ef4444';
                ctx.font = 'bold 26px Inter';
                ctx.fillText(it.label + it.value, padding + 30, itemY);
            } else {
                ctx.fillStyle = '#94a3b8';
                ctx.font = '26px Inter';
                ctx.fillText(it.label, padding + 30, itemY);
                
                ctx.fillStyle = it.valColor || '#f1f5f9';
                ctx.font = 'bold 32px Inter';
                ctx.textAlign = 'right';
                ctx.fillText(it.value, padding + secW - 30, itemY + 2);
            }
            
            ctx.textAlign = 'left';
            itemY += 50;
        });

        // Eventuale mailto
        if (alertMailId) {
            const mailBtnW = 280;
            const mailBtnH = 50;
            const mailX = padding + secW - 30 - mailBtnW;
            const mailY = itemY;
            
            this.hitboxes.push({ id: alertMailId, x: mailX, y: mailY, w: mailBtnW, h: mailBtnH });
            
            const isPinned = window.isPinned;
            if (!isPinned) ctx.globalAlpha = 0.4;

            ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
            ctx.beginPath(); ctx.roundRect(mailX, mailY, mailBtnW, mailBtnH, 10); ctx.fill();
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)'; ctx.lineWidth = 1; ctx.stroke();

            ctx.fillStyle = '#ef4444'; ctx.textAlign = 'center'; ctx.font = 'bold 20px Inter';
            ctx.fillText(isPinned ? "✉ CONTATTA IDRAULICO" : "🔒 CONTATTA IDRAULICO", mailX + mailBtnW/2, mailY + 33);
            
            if (!isPinned) ctx.globalAlpha = 1.0;

            itemY += 70; // Spazio extra se presente alert
            ctx.textAlign = 'left';
        }

        // Pulsante Maggiori info
        const infoBtnBox = { id: infoBtnId, x: padding + 30, y: y + hSec - 80, w: secW - 60, h: 60 };
        this.hitboxes.push(infoBtnBox);

        const isPinnedInfo = window.isPinned;
        if (!isPinnedInfo) ctx.globalAlpha = 0.4;

        ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
        ctx.beginPath(); ctx.roundRect(infoBtnBox.x, infoBtnBox.y, infoBtnBox.w, infoBtnBox.h, 15); ctx.fill();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
        
        ctx.fillStyle = '#06b6d4';
        ctx.textAlign = 'center';
        ctx.font = 'bold 24px Inter';
        ctx.fillText(isPinnedInfo ? "MAGGIORI INFO 📊" : "🔒 MAGGIORI INFO", infoBtnBox.x + infoBtnBox.w/2, infoBtnBox.y + 40);

        if (!isPinnedInfo) ctx.globalAlpha = 1.0;

        return y + hSec;
    }
};