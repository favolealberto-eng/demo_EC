// ==========================================
// TEMPLATE: PANNELLO ESTINTORE
// ==========================================

const LayoutEstintore = {
    // 1. PARAMETRI DI STRUTTURA
    config: {
        canvasW: 900,
        canvasH: 1600,
        planeW: 2.7,
        planeH: 4.8
    },

    // 2. HITBOX VUOTE
    hitboxes: [],

    // 3. DATABASE (Vuoto)
    fetchDati: function (callback) {
        // Nessun dato per ora
        setTimeout(() => callback({}), 100);
    },

    // 4. DISEGNO (Vuoto)
    draw: function (ctx, dati, config) {
        // Pulisce il canvas e lo lascia trasparente
        ctx.clearRect(0, 0, 900, 1600);
        
        /*
        Se vogliamo mostrare qualcosa:
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.roundRect(50, 50, 800, 1500, 50);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 60px sans-serif';
        ctx.textAlign = 'center';
        const titolo = config && config.nome ? config.nome : "Estintore";
        ctx.fillText(titolo, 450, 800);
        ctx.font = '40px sans-serif';
        ctx.fillText("Interfaccia in costruzione...", 450, 900);
        */
    }
};
