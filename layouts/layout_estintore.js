/**
 * LayoutEstintore - Modulo visualizzatore AR per la Scadenza e Controllo Sicurezza Estintori.
 * 
 * Differisce dagli altri componenti poiché si focalizza su metriche testuali di ispezione 
 * piuttosto che su metriche a campionamento continuo (come energia o temperatura).
 * Fornisce un piano manutentivo e una checklist operativa in formato AR.
 */
window.LayoutEstintore = {
    config: {
        canvasW: 900,
        canvasH: 1600,
        planeW: 1.8,
        planeH: 3.2
    },

    hitboxes: [],  // Nessuna interazione complessa prevista per questo layout (solo visivo)

    /**
     * fetchDati - Simula il caricamento di record anagrafici e ispettivi dal gestionale antincendio.
     */
    fetchDati: function (callback) {
        setTimeout(() => {
            callback({
                scadenza_polvere: "15/10/2026",
                scadenza_collaudo: "15/10/2032",
                ultima_revisione: "15/04/2023",
                tecnico: "Mario Rossi",
                pressione_ok: true,
                sigillo_integro: true,
                tubo_ok: true
            });
        }, 100);
    },

    /**
     * draw - Rendering nativo HTML5 del layout Estintore.
     * Disegna dinamicamente un bollino semaforico basato su un mini-rule engine interno 
     * che simula scadenze imminenti differenziate per il "nome" identificativo del marker.
     */
    draw: function (ctx, dati, config) {
        const W = this.config.canvasW, H = this.config.canvasH;
        ctx.clearRect(0, 0, W, H);

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


        // --- SFONDO SCURO ---
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, '#0d1f3c');
        bgGrad.addColorStop(0.5, '#0f2d1f');
        bgGrad.addColorStop(1, '#0d1f3c');
        ctx.fillStyle = bgGrad;
        ctx.beginPath(); ctx.roundRect(0, 0, W, H, 40); ctx.fill();

        ctx.strokeStyle = 'rgba(6,182,212,0.35)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(2, 2, W - 4, H - 4, 39); ctx.stroke();

        // --- CALCOLO STATO ---
        const nomeUpper = config && config.nome ? config.nome.toUpperCase() : "ESTINTORE";

        let statoColore = "#22c55e";
        let testoStato = "REGOLARE";
        let dateColorBase = "#f1f5f9";

        if (nomeUpper.includes("UFFICIO 2")) {
            statoColore = "#facc15"; // Giallo standard
            testoStato = "SCADENZA IMMINENTE";
            dati.scadenza_polvere = "10/04/2026";
            dateColorBase = "#67e8f9";
        } else if (nomeUpper.includes("UFFICIO 3")) {
            statoColore = "#ef4444";
            testoStato = "MANUTENZIONE SCADUTA";
            dati.scadenza_polvere = "15/01/2025";
            dati.pressione_ok = false;
            dateColorBase = "#fca5a5";
        }

        // --- HEADER ---
        const hdrGrad = ctx.createLinearGradient(10, 10, W-10, 10);
        hdrGrad.addColorStop(0, '#06b6d4');
        hdrGrad.addColorStop(1, '#0891b2');
        ctx.fillStyle = hdrGrad;
        ctx.beginPath(); ctx.roundRect(10, 10, W - 20, 190, [30, 30, 0, 0]); ctx.fill();

        // Titolo header (Spezzato in due righe per via della larghezza ridotta)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 50px sans-serif'; ctx.textAlign = 'left';
        ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 8;
        ctx.fillText("ESTINTORE:", 40, 75);
        ctx.fillText(nomeUpper, 40, 135);
        ctx.shadowBlur = 0;

        // Bollino stato 
        ctx.fillStyle = statoColore;
        ctx.shadowColor = statoColore; ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.arc(W - 70, 70, 35, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = statoColore;
        ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'right';
        ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 4;
        ctx.fillText(testoStato, W - 120, 80);
        ctx.shadowBlur = 0;

        // --- SEZIONE 1: PIANO MANUTENTIVO ---
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.beginPath(); ctx.roundRect(40, 240, 820, 520, 22); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.10)';
        ctx.lineWidth = 1.5; ctx.stroke();

        ctx.fillStyle = 'rgba(6,182,212,0.9)';
        ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText("PIANO MANUTENTIVO", W/2, 300);
        ctx.fillStyle = 'rgba(6,182,212,0.35)';
        ctx.fillRect(W/2 - 200, 315, 400, 3);

        function drawDataRow(y, labelTxt, valueTxt, valueColor) {
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(60, y - 40); ctx.lineTo(W-60, y - 40); ctx.stroke();

            // Stacked text per schermi verticali
            ctx.fillStyle = 'rgba(148,163,184,0.8)';
            ctx.font = '30px sans-serif'; ctx.textAlign = 'left';
            ctx.fillText(labelTxt, 70, y);

            ctx.fillStyle = valueColor || '#f1f5f9';
            ctx.font = 'bold 35px monospace'; ctx.textAlign = 'right';
            ctx.fillText(valueTxt, W-70, y);
        }

        drawDataRow(400, "Prossima Revisione:", dati.scadenza_polvere, dateColorBase);
        drawDataRow(490, "Prossimo Collaudo:", dati.scadenza_collaudo, '#f1f5f9');
        drawDataRow(580, "Ultima Ispezione:", dati.ultima_revisione, '#f1f5f9');
        drawDataRow(670, "Tecnico Assegnato:", dati.tecnico, '#f1f5f9');

        // --- SEZIONE 2: CHECKLIST ---
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.beginPath(); ctx.roundRect(40, 800, 820, 600, 22); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.10)';
        ctx.lineWidth = 1.5; ctx.stroke();

        ctx.fillStyle = 'rgba(6,182,212,0.9)';
        ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText("CHECKLIST ISPEZIONE", W/2, 860);
        ctx.fillStyle = 'rgba(6,182,212,0.35)';
        ctx.fillRect(W/2 - 210, 875, 420, 3);

        function drawCheckItem(y, testo, superato) {
            ctx.strokeStyle = 'rgba(255,255,255,0.07)';
            ctx.lineWidth = 1;
            if (y > 900) { ctx.beginPath(); ctx.moveTo(70, y - 40); ctx.lineTo(W-70, y - 40); ctx.stroke(); }

            const colore = superato ? '#22c55e' : '#ef4444';
            ctx.fillStyle = colore;
            ctx.shadowColor = colore; ctx.shadowBlur = 12;
            ctx.beginPath(); ctx.roundRect(80, y - 20, 50, 50, 10); ctx.fill();
            ctx.shadowBlur = 0;

            ctx.fillStyle = 'white';
            ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(superato ? "✓" : "✗", 105, y + 18);

            // Testo spezzato se lungo o rimpicciolito
            ctx.textAlign = 'left';
            ctx.fillStyle = '#cbd5e1';
            ctx.font = '34px sans-serif';
            ctx.fillText(testo, 160, y + 15);
        }

        drawCheckItem(980, "Pressione Manometro OK", dati.pressione_ok);
        drawCheckItem(1120, "Sigillo di Sicurezza Integro", dati.sigillo_integro);
        drawCheckItem(1260, "Tubo e Lancia Intatti", dati.tubo_ok);

        // --- FOOTER ---
        ctx.strokeStyle = 'rgba(6,182,212,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(40, 1460); ctx.lineTo(W-40, 1460); ctx.stroke();

        ctx.fillStyle = 'rgba(100,116,139,0.9)';
        ctx.font = '28px monospace'; ctx.textAlign = 'center';
        ctx.fillText("ID ASSET: EXT-" + Math.floor(Math.random() * 9000 + 1000), W/2, 1510);
        
        ctx.fillStyle = 'rgba(100,116,139,0.7)';
        ctx.font = '24px Inter';
        ctx.fillText("Ultimo agg.: " + new Date().toLocaleTimeString(), W/2, 1550);
    }
};
