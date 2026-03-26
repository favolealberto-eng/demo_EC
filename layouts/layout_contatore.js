/**
 * TEMPLATE: PANNELLO CONTATORE GENERALE (Data-Driven)
 * Il layout viene generato automaticamente leggendo il file Contatore.csv
 */
window.LayoutContatore = {
    // 1. CONFIGURAZIONE CANVAS
    config: {
        canvasW: 1696,
        canvasH: 2716, // 2516 (immagine) + 200 (header)
        planeW: 4.8,
        planeH: 7.69
    },

    // 2. GESTIONE ASSET (Immagine e CSV)
    imageSrc: 'images/contatore/Contatore.jpg',
    csvSrc: 'Contatore.csv',

    backgroundImage: null,
    imageLoaded: false,
    csvLoaded: false,

    map: { header_hY: 200 }, // Conterrà i dati del CSV
    hitboxes: [],

    // Funzione combinata per caricare sia l'immagine che il CSV
    loadAssets: function (callback) {
        let assetsToLoad = 2;
        let assetsLoaded = 0;

        const onAssetLoaded = () => {
            assetsLoaded++;
            if (assetsLoaded === assetsToLoad) callback();
        };

        // Caricamento Immagine
        if (!this.imageLoaded) {
            this.backgroundImage = new Image();
            this.backgroundImage.src = this.imageSrc;
            this.backgroundImage.onload = () => { this.imageLoaded = true; onAssetLoaded(); };
            this.backgroundImage.onerror = () => { console.error("❌ Errore caricamento immagine sfondo."); onAssetLoaded(); };
        } else {
            onAssetLoaded();
        }

        // Caricamento CSV
        if (!this.csvLoaded) {
            fetch(this.csvSrc)
                .then(response => response.text())
                .then(data => {
                    const rows = data.split('\n');
                    for (let i = 1; i < rows.length; i++) { // Salta la riga di intestazione
                        const row = rows[i].trim();
                        if (row) {
                            const cols = row.split(';');
                            if (cols.length >= 6) {
                                const nomeOggetto = cols[0].trim();
                                this.map[nomeOggetto] = {
                                    cx: parseInt(cols[1].trim(), 10),
                                    cy: parseInt(cols[2].trim(), 10),
                                    w: parseInt(cols[3].trim(), 10),
                                    h: parseInt(cols[4].trim(), 10),
                                    forma: cols[5].trim().toLowerCase()
                                };
                            }
                        }
                    }
                    this.csvLoaded = true;
                    onAssetLoaded();
                })
                .catch(error => {
                    console.error("❌ Errore nel caricamento del CSV:", error);
                    onAssetLoaded();
                });
        } else {
            onAssetLoaded();
        }
    },

    // 3. MOCK DATI IN TEMPO REALE
    fetchDati: function (callback) {
        if (!window.ContatoreGlobalState) {
            window.ContatoreGlobalState = {
                acs_mc: 124.5, afs_mc: 89.2, energy_kwt: 45.7,
                valve_states: ["APERTA", "APERTA", "CHIUSA"],
                vistaDettaglio: false
            };
        }
        const s = window.ContatoreGlobalState;
        const now = new Date();

        s.acs_mc += Math.random() * 0.01;
        s.afs_mc += Math.random() * 0.005;
        s.energy_kwt += Math.random() * 0.02;

        callback({
            timestamp: now,
            dataStr: now.toLocaleDateString('it-IT'),
            oraStr: now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            acs_mc: s.acs_mc.toFixed(2),
            afs_mc: s.afs_mc.toFixed(2),
            valve_hvac: s.valve_states[2],
            energy_kwt: s.energy_kwt.toFixed(1),
            flow_rate: (2.5 + Math.random() * 0.3).toFixed(1),
            temp_supply: (60.2 + (Math.random() * 0.4 - 0.2)).toFixed(1),
            temp_return: (40.1 + (Math.random() * 0.4 - 0.2)).toFixed(1),
            temp_acs_out: (48.5 + (Math.random() * 0.2 - 0.1)).toFixed(1),
            temp_afs_in: (12.1 + (Math.random() * 0.1 - 0.05)).toFixed(1)
        });
    },

    // 4. MOTORE GRAFICO SPECIFICO
    draw: function (ctx, dati, config) {
        const state = window.ContatoreGlobalState;
        this.hitboxes = [];
        const W = this.config.canvasW;
        const H = this.config.canvasH;

        // Assicuriamoci che Immagine e CSV siano pronti
        this.loadAssets(() => {

            ctx.clearRect(0, 0, W, H);

            // =========================================================
            // RAMO A: VISTA DETTAGLI (Stile Pannello Appartamento)
            // =========================================================
            if (state && state.vistaDettaglio) {
                ctx.fillStyle = '#061325'; ctx.fillRect(0, 0, W, H);

                const headerH = 250;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'; ctx.fillRect(0, 0, W, headerH);
                ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)'; ctx.lineWidth = 4;
                ctx.beginPath(); ctx.moveTo(0, headerH); ctx.lineTo(W, headerH); ctx.stroke();

                ctx.fillStyle = '#f1f5f9'; ctx.font = 'bold 90px Inter'; ctx.textAlign = 'left';
                ctx.fillText(`GRUPPO IDRICO - ID: ${config.id_macchina || 'CNT-01'}`, 80, 150);

                const colW = W - 160;
                const colY = headerH + 80;

                ctx.save(); ctx.translate(80, colY);

                ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
                ctx.beginPath(); ctx.roundRect(0, 0, colW, 2200, 40); ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.stroke();

                ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 70px Inter'; ctx.textAlign = 'center';
                ctx.fillText("DETTAGLI E DIAGNOSTICA", colW / 2, 100);
                ctx.fillStyle = '#94a3b8'; ctx.font = '40px Inter';
                ctx.fillText(`Dati live aggiornati alle: ${dati.oraStr}`, colW / 2, 160);

                let dY = 300;
                const drawDetailRiga = (y, label, valore, unita, colorTheme) => {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
                    ctx.beginPath(); ctx.roundRect(40, y - 80, colW - 80, 120, 20); ctx.fill();

                    ctx.fillStyle = '#94a3b8'; ctx.font = '50px Inter'; ctx.textAlign = 'left';
                    ctx.fillText(label, 80, y);

                    ctx.fillStyle = colorTheme || '#f1f5f9'; ctx.font = 'bold 60px Inter'; ctx.textAlign = 'right';
                    ctx.fillText(`${valore} ${unita}`, colW - 80, y);
                };

                drawDetailRiga(dY, "Consumo Acqua Fredda (AFS)", dati.afs_mc, "m³", '#06b6d4'); dY += 150;
                drawDetailRiga(dY, "Consumo Acqua Calda (ACS)", dati.acs_mc, "m³", '#ef4444'); dY += 150;
                drawDetailRiga(dY, "Energia Termica HVAC", dati.energy_kwt, "kWh", '#eab308'); dY += 180;

                ctx.fillStyle = '#64748b'; ctx.font = 'bold 50px Inter'; ctx.textAlign = 'left';
                ctx.fillText("TEMPERATURE E DIFFERENZIALI", 60, dY); dY += 120;

                const dT = (parseFloat(dati.temp_supply) - parseFloat(dati.temp_return)).toFixed(1);
                drawDetailRiga(dY, "Temp. Mandata HVAC", dati.temp_supply, "°C", '#ef4444'); dY += 150;
                drawDetailRiga(dY, "Temp. Ritorno HVAC", dati.temp_return, "°C", '#3b82f6'); dY += 150;
                drawDetailRiga(dY, "Differenziale Termico ΔT", dT, "°C", (dT > 15 ? '#22c55e' : '#facc15'));

                ctx.restore();
                return; // Esce e non disegna l'immagine
            }

            // =========================================================
            // RAMO B: VISTA STANDARD SULL'IMMAGINE
            // =========================================================
            const headerH = this.map.header_hY;

            // 1. DISEGNO HEADER
            const bgGrad = ctx.createLinearGradient(0, 0, W, headerH);
            bgGrad.addColorStop(0, '#0d1f3c'); bgGrad.addColorStop(1, '#061325');
            ctx.fillStyle = bgGrad;
            ctx.beginPath(); ctx.roundRect(0, 0, W, headerH, { tl: 40, tr: 40, bl: 0, br: 0 }); ctx.fill();

            ctx.strokeStyle = 'rgba(6,182,212,1)'; ctx.lineWidth = 6;
            ctx.beginPath(); ctx.moveTo(0, headerH); ctx.lineTo(W, headerH); ctx.stroke();

            ctx.fillStyle = '#f1f5f9'; ctx.font = 'bold 80px Inter'; ctx.textAlign = 'left';
            ctx.fillText(config.nome || "CONTATORE GENERALE", 60, 130);
            ctx.fillStyle = 'rgba(6,182,212,1)'; ctx.font = 'bold 60px Inter'; ctx.textAlign = 'right';
            ctx.fillText(`${dati.dataStr} · ${dati.oraStr}`, W - 60, 130);

            // 2. TRASLAZIONE (Zero matematica sui box!)
            ctx.save();
            ctx.translate(0, headerH);

            if (this.imageLoaded && this.backgroundImage) {
                ctx.drawImage(this.backgroundImage, 0, 0, 1696, 2516);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fillRect(0, 0, 1696, 2516);
            }

            // 3. DISEGNO DINAMICO DA CSV
            this.drawStandardAnnotations(ctx, dati);

            ctx.restore(); // Fine traslazione
        });
    },

    // =========================================================
    // FUNZIONE HELPER: DISEGNO DINAMICO BASATO SUL CSV
    // =========================================================
    drawStandardAnnotations: function (ctx, dati) {
        const m = this.map;

        // Super-funzione che decide da sola cosa disegnare!
        const drawShape = (csvKey, label, valore, unita, colorTheme, isStato = false) => {
            const item = m[csvKey];
            if (!item) return; // Se la riga non c'è nel CSV, semplicemente la ignora!

            const cX = item.cx;
            const cY = item.cy;
            const w = item.w;
            const h = item.h;

            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';

            // --- DISEGNO CERCHIO ---
            if (item.forma === 'cerchio') {
                const raggio = w / 2; // Usa la larghezza come diametro

                ctx.fillStyle = 'rgba(13, 31, 60, 0.85)';
                ctx.beginPath(); ctx.arc(cX, cY, raggio, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = colorTheme || '#06b6d4'; ctx.lineWidth = Math.max(3, w * 0.03);
                ctx.beginPath(); ctx.arc(cX, cY, raggio, 0, Math.PI * 2); ctx.stroke();

                const valSize = Math.floor(w * 0.22);
                const lblSize = Math.floor(w * 0.09);

                ctx.fillStyle = 'rgba(148,163,184,1)'; ctx.font = `bold ${lblSize}px Inter`;
                ctx.fillText(label.toUpperCase(), cX, cY - (w * 0.18));
                ctx.fillStyle = colorTheme || '#f1f5f9'; ctx.font = `bold ${valSize}px Inter`;
                ctx.fillText(valore, cX, cY + (w * 0.05));
                ctx.fillStyle = '#94a3b8'; ctx.font = `${lblSize}px Inter`;
                ctx.fillText(unita, cX, cY + (w * 0.28));
            }

            // --- DISEGNO RETTANGOLO ---
            else if (item.forma === 'rettangolo') {
                const x = cX - (w / 2);
                const y = cY - (h / 2);

                ctx.fillStyle = 'rgba(13, 31, 60, 0.85)';
                ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(20, h * 0.15)); ctx.fill();
                ctx.strokeStyle = isStato ? 'rgba(255,255,255,0.2)' : (colorTheme || '#06b6d4');
                ctx.lineWidth = Math.max(3, Math.min(w, h) * 0.03);
                ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(20, h * 0.15)); ctx.stroke();

                // Gestione Valvola Motorizzata (Stato)
                if (isStato) {
                    let statusColor = (valore === "APERTA") ? "#22c55e" : "#eab308";
                    const fontSize = Math.floor(Math.min(h * 0.35, w * 0.1));
                    const iconRadius = Math.floor(h * 0.15);

                    ctx.fillStyle = statusColor;
                    ctx.beginPath(); ctx.arc(x + (w * 0.15), cY, iconRadius, 0, Math.PI * 2); ctx.fill();

                    ctx.fillStyle = '#94a3b8'; ctx.font = `${fontSize}px Inter`; ctx.textAlign = 'left';
                    ctx.fillText(label, x + (w * 0.15) + iconRadius + 15, cY + 2);
                    ctx.fillStyle = statusColor; ctx.font = `bold ${fontSize}px Inter`;
                    ctx.fillText(valore, x + (w * 0.55), cY + 2);
                }
                // Gestione Scatole Dati (Temperature e Danfoss)
                else {
                    if (h <= 140) { // Riga singola (Temperature)
                        const fontSize = Math.floor(Math.min(h * 0.40, w * 0.15));
                        ctx.fillStyle = '#f1f5f9'; ctx.font = `bold ${fontSize}px Inter`;
                        ctx.fillText(`${valore} ${unita}`, cX, cY + 2);
                    } else { // Multi riga (Danfoss)
                        const valSize = Math.floor(Math.min(h * 0.25, w * 0.2));
                        const lblSize = Math.floor(Math.min(h * 0.12, w * 0.1));

                        ctx.fillStyle = 'rgba(148,163,184,1)'; ctx.font = `bold ${lblSize}px Inter`;
                        ctx.fillText(label.toUpperCase(), cX, y + (h * 0.25));
                        ctx.fillStyle = colorTheme || '#f1f5f9'; ctx.font = `bold ${valSize}px Inter`;
                        ctx.fillText(valore, cX, cY + (h * 0.05));
                        ctx.fillStyle = '#94a3b8'; ctx.font = `${lblSize}px Inter`;
                        ctx.fillText(unita, cX, y + h - (h * 0.15));
                    }
                }
            }
            ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
        };

        // ==========================================
        // COLLEGAMENTO TRA NOMI CSV E DATI VIRTUALI
        // ==========================================
        // (Nome Esatto in Excel) | (Etichetta a schermo) | (Valore) | (Unità) | (Colore Tema) | (È uno stato?)

        drawShape("Portata AFS", "Acqua Fredda", dati.afs_mc, "m³", '#06b6d4');
        drawShape("Portata ACS", "Acqua Calda", dati.acs_mc, "m³", '#ef4444');

        drawShape("Contatore termico Dafnoss", "Energia Termica", dati.energy_kwt, "kWh", '#eab308');

        drawShape("Temperatura acqua calda tecnica (mandata)", "Mandata", dati.temp_supply, "°C", '#ef4444');
        drawShape("Temperatura acqua calda tecnica (ritorno)", "Ritorno", dati.temp_return, "°C", '#3b82f6');
        drawShape("Temperatura AFS", "Temp AFS", dati.temp_afs_in, "°C", '#60a5fa');
        drawShape("Temperatura ACS", "Temp ACS", dati.temp_acs_out, "°C", '#f87171');

        // Passiamo true alla fine per dirgli di comportarsi come una valvola (testo Aperta/Chiusa)
        drawShape("Valvola motorizzata", "MOTORE", dati.valve_hvac, "", null, true);
    }
};