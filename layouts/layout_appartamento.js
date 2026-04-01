/**
 * LayoutAppartamento - Modulo di visualizzazione AR per il monitoraggio domestico.
 * 
 * Questo layout implementa un pannello interattivo strutturato in due viste principali:
 * 1. 'main': Dashboard generale con i consumi di Acqua Calda (ACS), Fredda (AFS) e Riscaldamento.
 * 2. 'diagnostica': Pannello di analisi tecnica con storico errori, stato dei contatori e soglie.
 * 
 * I dati sono generati tramite la funzione di mock globale e arricchiti con alert fittizi 
 * (es. rilevamento perdite in fasce orarie specifiche).
 */
window.LayoutAppartamento = {
    config: {
        canvasW: 800, 
        canvasH: 1600, 
        planeW: 2.4, 
        planeH: 4.8
    },

    vistaCorrente: 'main', // Determina il router interno: 'main' o 'diagnostica'
    hitboxes: [],          // Array dinamico delle aree cliccabili gestito dal ciclo di draw()

    /**
     * fetchDati - Generatore di dati simulato per i consumi e la sensoristica dell'appartamento.
     * Utilizza i pattern storici forniti in `index.html` calcolando cumulati e anomalie virtuali.
     * 
     * @param {function} callback - Funzione per ritornare i dati elaborati al motore AR.
     */
    fetchDati: function (callback) {
        // Dati mockati
        const now = new Date();
        const currentSlotIndex = Math.floor(now.getHours() * 4 + now.getMinutes() / 15);
        
        // Uso i mock data globali presenti in index.html (es. benchmark_energia map to riscaldamento, etc)
        // Se non esistono li usiamo lo stesso, index.html fallbacks su base = 50.
        // Simuliamo i dati in base all'orario attuale.
        const h_sync = Math.floor(currentSlotIndex / 4).toString().padStart(2, '0');
        const m_sync = ((currentSlotIndex % 4) * 15).toString().padStart(2, '0');
        const str_ora_attuale = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

        // Recuperiamo i dati mock stabili validi per l'intera giornata
        const mockACS = typeof getMockDayData === 'function' ? getMockDayData('acs') : [];
        const mockAFS = typeof getMockDayData === 'function' ? getMockDayData('afs') : [];
        const mockRSC = typeof getMockDayData === 'function' ? getMockDayData('riscaldamento') : [];

        // Estraiamo il valore cumulato coerente con l'ora attuale
        const acsConsumo = mockACS.length > currentSlotIndex ? mockACS.slice(0, currentSlotIndex + 1).reduce((sum, val) => sum + parseFloat(val), 0).toFixed(0) : "45";
        const acsPicco = Math.round(Number(acsConsumo) * 0.15 + 2); // Picco derivato stabilmente
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

        // Simulazione info diagnostica
        const countersStatus = {
            acs: "Online",
            afs: afsAnomalia ? "Warning (Possibile Perdita)" : "Online",
            riscaldamento: "Online"
        };
        const errors = afsAnomalia ? ["Rilevato alert: " + afsAnomaliaText] : [];

        // Stato globale appartamento (Verde, Giallo o Rosso)
        let overallStatus = "ok"; // verde
        if (afsAnomalia) overallStatus = "warning"; // giallo

        callback({
            nome: "Appartamento 101",
            overallStatus: overallStatus,
            str_ora_attuale: str_ora_attuale,
            last_update: `${h_sync}:${m_sync}`,

            acs: {
                consumo: acsConsumo,
                picco: acsPicco,
                trend: acsTrend
            },
            afs: {
                consumo: afsConsumo,
                anomalia: afsAnomalia,
                anomaliaTesto: afsAnomaliaText
            },
            riscaldamento: {
                consumo: rscConsumo,
                media_settimanale: rscMediaSet,
                is_up: rscIsUp
            },
            diagnostica: {
                counters: countersStatus,
                errors: errors,
                soglie: { acs: "300 L/g", afs: "500 L/g", rsc: "20 kWh/g" },
                cumulato_mese: { acs: 850, afs: 3200, rsc: 145 } // valori fittizi mese
            }
        });
    },

    /**
     * processClick - Gestore degli eventi di interazione (click) sugli hitboxes registrati.
     * Permette la navigazione tra le viste interne e l'attivazione dei modali di dettaglio.
     * 
     * @param {string} id - L'identificativo dell'hitbox premuto dall'utente.
     */
    processClick: function (id) {
        // Ignora i click prematuri se i dati non sono ancora stati renderizzati
        if (!this.ultimiDati) return;

        if (id === 'btn_info_acs') {
            if (typeof apriDettaglio === 'function') apriDettaglio('acs');
        } else if (id === 'btn_info_afs') {
            if (typeof apriDettaglio === 'function') apriDettaglio('afs');
        } else if (id === 'btn_info_rsc') {
            if (typeof apriDettaglio === 'function') apriDettaglio('riscaldamento');
        } else if (id === 'btn_diagnostica') {
            this.vistaCorrente = 'diagnostica';
        } else if (id === 'btn_back_main') {
            this.vistaCorrente = 'main';
        } else if (id === 'mail_idraulico') {
            const subject = encodeURIComponent("Richiesta intervento urgente idraulico - Appartamento 101");
            const body = encodeURIComponent("Gentile Idraulico,\n\nSi segnala una possibile anomalia/perdita per l'Acqua Fredda Sanitaria (AFS) nel nostro appartamento.\nSi richiede un vostro check al più presto.\n\nSaluti.");
            window.location.href = `mailto:idraulico.assistenza@azienda.it?subject=${subject}&body=${body}`;
        }
    },

    /**
     * draw - Controller di rendering principale per il canvas.
     * Svuota il contesto grafico e orchestra il disegno chiamando drawMain o drawDiagnostica
     * in base alla variabile state `vistaCorrente`.
     * 
     * @param {CanvasRenderingContext2D} ctx - Contesto 2D su cui renderizzare.
     * @param {object} dati - Payload JSON generato da fetchDati().
     * @param {object} config - Configurazioni globali dal registro macchinari.
     */
    draw: function (ctx, dati, config) {
        this.ultimoCtx = ctx;
        this.ultimiDati = dati;
        this.ultimoConfig = config;
        
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

        this.hitboxes = [];

        // Sfondo dark glassmorphism
        const bgGrad = ctx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, 'rgba(13, 31, 60, 0.97)');
        bgGrad.addColorStop(0.5, 'rgba(15, 45, 31, 0.97)');
        bgGrad.addColorStop(1, 'rgba(13, 31, 60, 0.97)');
        ctx.fillStyle = bgGrad;
        ctx.beginPath();
        ctx.roundRect(0, 0, w, h, 40);
        ctx.fill();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 4;
        ctx.stroke();

        if (this.vistaCorrente === 'main') {
            this.drawMain(ctx, dati, w, h);
        } else {
            this.drawDiagnostica(ctx, dati, w, h);
        }
    },

    /**
     * drawMain - Renderizza la "Vista Principale" (Dashboard Operativa).
     * Disegna i tre blocchi di consumo (ACS, AFS, RSC) e i relativi bottoni di interazione.
     * 
     * @param {CanvasRenderingContext2D} ctx - Contesto 2D.
     * @param {object} dati - Dati telemetrici.
     * @param {number} w - Larghezza canvas.
     * @param {number} h - Altezza canvas.
     */
    drawMain: function(ctx, dati, w, h) {
        // --- HEADER LOGICA ---
        const hdrGrad = ctx.createLinearGradient(10, 10, w - 10, 10);
        hdrGrad.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
        hdrGrad.addColorStop(1, 'rgba(8, 145, 178, 0.2)');
        ctx.fillStyle = hdrGrad;
        ctx.beginPath();
        ctx.roundRect(0, 0, w, 130, { tl: 40, tr: 40, bl: 0, br: 0 });
        ctx.fill();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.beginPath(); ctx.moveTo(0, 130); ctx.lineTo(w, 130); ctx.stroke();

        // Icona/Testo
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 38px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 8;
        ctx.fillText(dati.nome, 400, 70);
        ctx.shadowBlur = 0;

        // Ultimo aggiornamento
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = '24px Inter, sans-serif';
        ctx.fillText(`Ultimo agg: ${dati.last_update} - Ora attuale: ${dati.str_ora_attuale}`, 400, 110);

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
        ctx.shadowBlur = 20;
        ctx.fillStyle = colorSemaforo;
        ctx.beginPath(); ctx.arc(w - 60, 65, 20, 0, Math.PI * 2); ctx.fill();
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
    },

    /**
     * drawDiagnostica - Renderizza la "Vista Diagnostica" (Dettaglio Tecnico).
     * Fornisce informazioni orientate alla manutenzione: ping contatori, log errori e limiti di soglia.
     */
    drawDiagnostica: function(ctx, dati, w, h) {
        // --- HEADER STRUTTURA DIAGNOSTICA ---
        const hdrGrad = ctx.createLinearGradient(10, 10, w - 10, 10);
        hdrGrad.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
        hdrGrad.addColorStop(1, 'rgba(8, 145, 178, 0.2)');
        ctx.fillStyle = hdrGrad;
        ctx.beginPath(); ctx.roundRect(0, 0, w, 130, { tl: 40, tr: 40, bl: 0, br: 0 }); ctx.fill();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)'; ctx.beginPath(); ctx.moveTo(0, 130); ctx.lineTo(w, 130); ctx.stroke();

        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 38px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 8;
        ctx.fillText("DIAGNOSTICA CONTATORI", 400, 70);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = '24px Inter, sans-serif';
        ctx.fillText(`Pannello di controllo ${dati.nome}`, 400, 110);

        // --- CONTENUTO DIAGNOSTICA ---
        let dY = 200;
        ctx.textAlign = 'left';

        // 1. Stato Comunicazione
        ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 30px Inter';
        ctx.fillText("Stato Comunicazione:", 50, dY);
        dY += 50;

        for (const [key, val] of Object.entries(dati.diagnostica.counters)) {
            ctx.fillStyle = '#f1f5f9'; ctx.font = '26px Inter';
            ctx.fillText(`Contatore ${key.toUpperCase()}:`, 80, dY);
            
            ctx.fillStyle = val.includes("Online") ? '#22c55e' : (val.includes("Warning") ? '#facc15' : '#ef4444');
            ctx.textAlign = 'right';
            ctx.font = 'bold 26px Inter';
            ctx.fillText(val, w - 80, dY);
            ctx.textAlign = 'left';
            dY += 45;
        }

        dY += 40;

        // 2. Errori
        ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 30px Inter';
        ctx.fillText("Log Errori Recenti:", 50, dY);
        dY += 50;

        if (dati.diagnostica.errors.length === 0) {
            ctx.fillStyle = '#22c55e'; ctx.font = '24px Inter';
            ctx.fillText("Nessun errore riscontrato nelle ultime 24h.", 80, dY);
            dY += 40;
        } else {
            dati.diagnostica.errors.forEach(err => {
                ctx.fillStyle = '#ef4444'; ctx.font = 'bold 24px Inter';
                ctx.fillText(`• ${err}`, 80, dY);
                dY += 40;
            });
        }

        dY += 40;

        // 3. Soglie Configurate
        ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 30px Inter';
        ctx.fillText("Soglie Alert Impostate:", 50, dY);
        dY += 50;
        for (const [key, val] of Object.entries(dati.diagnostica.soglie)) {
            ctx.fillStyle = '#94a3b8'; ctx.font = '26px Inter';
            ctx.fillText(`LIMITE ${key.toUpperCase()}:`, 80, dY);
            
            ctx.fillStyle = '#f1f5f9'; ctx.textAlign = 'right'; ctx.font = '26px Inter';
            ctx.fillText(val, w - 80, dY);
            ctx.textAlign = 'left';
            dY += 40;
        }

        dY += 40;

        // 4. Cumulato Mese
        ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 30px Inter';
        ctx.fillText("Consumo Cumulato (Mese in corso):", 50, dY);
        dY += 50;
        for (const [key, val] of Object.entries(dati.diagnostica.cumulato_mese)) {
            ctx.fillStyle = '#94a3b8'; ctx.font = '26px Inter';
            ctx.fillText(`TOTALE ${key.toUpperCase()}:`, 80, dY);
            
            ctx.fillStyle = '#0ea5e9'; ctx.textAlign = 'right'; ctx.font = 'bold 28px Inter';
            let unita = key === 'rsc' ? 'kWh' : 'L';
            ctx.fillText(`${val} ${unita}`, w - 80, dY);
            ctx.textAlign = 'left';
            dY += 40;
        }

        // --- BOTTONE TORNA INDIETRO ---
        const btnBoxDiagBack = { id: "btn_back_main", x: 100, y: h - 140, w: 600, h: 80 };
        this.hitboxes.push(btnBoxDiagBack);

        const isPinnedBack = window.isPinned;
        if (!isPinnedBack) ctx.globalAlpha = 0.4;

        ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
        ctx.beginPath(); ctx.roundRect(btnBoxDiagBack.x, btnBoxDiagBack.y, btnBoxDiagBack.w, btnBoxDiagBack.h, 20); ctx.fill();
        ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 1.5; ctx.stroke();

        ctx.fillStyle = '#06b6d4';
        ctx.textAlign = 'center';
        ctx.font = 'bold 30px Inter';
        ctx.fillText(isPinnedBack ? "⬅ TORNA ALLA VISTA PRINCIPALE" : "🔒 TORNA ALLA VISTA PRINCIPALE", w/2, h - 90);

        if (!isPinnedBack) ctx.globalAlpha = 1.0;

    }
};
