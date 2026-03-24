# Guida per Sviluppatori: Moduli Layout AR

Benvenuto! Questa cartella contiene tutti i moduli JavaScript che costituiscono i pannelli olografici (HUD) per l'applicazione di Realtà Aumentata (AR) di monitoraggio.

Se sei nuovo sul progetto e devi creare, modificare o eseguire il debug di uno di questi pannelli, questa guida ti spiegherà esattamente come funziona l'architettura.

---

## L'Architettura Generale

L'applicazione si basa sull'interazione tra tre componenti fondamentali:

1. **`index.html` (Il Motore Globale):** Gestisce il feed della fotocamera tramite A-Frame e AR.js. Riconosce i marker (es. QR code), rileva i click sullo schermo (Event Delegation) e si occupa del rendering degli oggetti 3D.
2. **`registro.json` (Il Database dei Marker):** Associa ogni **id di un marker** a un **file layout** specifico (uno di quelli in questa cartella). Quando `index.html` vede un marker, consulta il registro per capire quale script di layout caricare e avviare.
3. **`layouts/*.js` (I Componenti Visivi):** Sono i file contenuti in questa cartella. Definiscono l'aspetto visivo 2D del pannello, calcolano i dati tecnici da mostrare e definiscono quali aree sono cliccabili (hitboxes).

---

## Anatomia di un File Layout

Ogni file layout definisce un oggetto globale (es. `window.LayoutPompa`) che deve **obbligatoriamente** contenere i seguenti elementi:

### 1. `config` (Parametri di Struttura)
Imposta le dimensioni fisiche e virtuali del pannello.
```javascript
config: {
    canvasW: 800, // Larghezza del canvas 2D in pixel
    canvasH: 1100, // Altezza del canvas 2D in pixel
    planeW: 2.4, // Larghezza del piano 3D proiettato in metri
    planeH: 3.3  // Altezza del piano 3D proiettato in metri
}
```

### 2. `hitboxes` (Aree Interattive)
Un array di oggetti che definisce le coordinate matematiche per intercettare i click dell'utente. Vengono solitamente aggiornati o sovrascritti nella funzione `draw` a seconda della pagina/scheda aperta in quel momento.
```javascript
hitboxes: [
    { id: "bottone_dettagli", x: 40, y: 950, w: 720, h: 100 }
]
```

### 3. `fetchDati(callback)` (Simulazione Dati / Backend)
Questa funzione è il ponte tra il layout e i dati aziendali. Attualmente simula o preleva i dati fittizi dal file `index.html` (es. `window.getMockDayData`), costruisce un payload JSON (`dati`) e lo restituisce alla `callback`.
In produzione, questa funzione sarà sostituita da vere chiamate API (REST, WebSocket, MQTT).

### 4. `draw(ctx, dati, config)` (Rendering Engine)
Questa funzione viene richiamata dal motore `index.html` circa 1 volta al secondo. Si occupa di "dipingere" letteralmente pixel per pixel i testi, i grafici e la stilizzazione sul `ctx` (Canvas 2D Context).
- Riceve `ctx` per disegnare.
- Riceve `dati` appena "pescati" dal `fetchDati`.
- **Importante:** Svuota sempre il canvas (`ctx.clearRect`) prima di ridisegnare tutto il frame.

### 5. `processClick(idHitbox)` (Gestore Azioni)
Invocato automaticamente in base agli hitboxes. Riceve l'ID del bottone premuto. Qui si inserisce la logica di router (es. passare dalla "vistaMaint" alla "vistaDettaglio") o si lanciano azioni globali (es. aprire il client email dell'utente `window.location.href = "mailto:..."`).

---

## Come creare un nuovo Pannello (Tutorial)

Mettiamo che tu debba creare un nuovo pannello per un **Tapis Roulant**.

1. **Crea il file:** `layout_tapis_roulant.js` dentro questa cartella.
2. **Definisci l'Oggetto:**
   ```javascript
   window.LayoutTapisRoulant = {
       config: { canvasW: 800, canvasH: 1000, planeW: 2.4, planeH: 3.0 },
       hitboxes: [],
       fetchDati: function(callback) {
           callback({ velocita: 12, kmPercorsi: 5.4 });
       },
       draw: function(ctx, dati, config) {
           ctx.clearRect(0, 0, 800, 1000);
           // Disegna qualcosa!
           ctx.fillStyle = "white";
           ctx.font = "40px sans-serif";
           ctx.fillText(`Velocità: ${dati.velocita} km/h`, 50, 100);
       }
   };
   ```
3. **Registra il pannello in `registro.json`:**
   ```json
   "99": {
       "type": "tapis_roulant",
       "nome": "Tapis Roulant Palestra",
       "file": "layouts/layout_tapis_roulant.js",
       "oggetto": "LayoutTapisRoulant"
   }
   ```
4. **Fatto!** Ora, se un utente inquadra il marker AR numero `99`, l'app caricherà automaticamente il tuo modulo e lo dipingerà.

---

## Panoramica dei Moduli Esistenti

*   `layout_appartamento.js`: Cruscotto consumi domestici (ACS, AFS, Riscaldamento).
*   `layout_estintore.js`: Informazioni di sicurezza e checklist ispezioni estintori.
*   `layout_iaq.js`: Indicatore della Qualità dell'Aria (IAQ) con gauge circolare multi-colore.
*   `layout_macchina.js`: Pannello industriale ISO 50001 per testare le Performance Energetiche dei macchinari pesanti.
*   `layout_pannelli_radianti.js`: Controlli per condizionatori con calcolo dinamicodel rischio "punto di rugiada".
*   `layout_pompa.js`: Controlli idraulici in real-time uniti a una checklist diagnostica step-by-step illustrata.
*   `layout_quadroEl.js`: Il pannello più complesso; disegna autonomamente un grafico cartesiano storico per le tensioni elettriche.
*   `layout_rack.js`: Monitoraggio apparati Server e Switch di rete, con inline-dropdown (menu a discesa) cliccando i dispositivi.
*   `layout_sala.js`: Segnaletica per riunioni e integrazione col calendario globale.
*   `layout_ufficio.js`: Hub contatti personale dipartimento IT, comprensivo di orari e action-mailer.

*Buona programmazione!* 
