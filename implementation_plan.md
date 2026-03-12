# Pannello ISO 50001 – Macchina Generica con Benchmark Energetico

Creare un nuovo layout AR per macchine generiche industriali orientato alla **ISO 50001** (Sistema di Gestione dell'Energia), con spia di allarme tricolore dinamica e dettaglio consumi/benchmark. Registrare due macchine della stessa categoria nel JSON.

## Proposed Changes

### Layout Macchina ISO 50001

#### [NEW] [layout_macchina.js](file:///c:/Users/favol/OneDrive%20-%20Politecnico%20di%20Torino/Dekstop/Tirocinio/demo_ar_ec/demo_EC/layouts/layout_macchina.js)

Nuovo layout `window.LayoutMacchina` che segue la stessa architettura degli altri (`config`, `hitboxes`, [fetchDati](file:///c:/Users/favol/OneDrive%20-%20Politecnico%20di%20Torino/Dekstop/Tirocinio/demo_ar_ec/demo_EC/layouts/layout_iaq.js#24-38), [draw](file:///c:/Users/favol/OneDrive%20-%20Politecnico%20di%20Torino/Dekstop/Tirocinio/demo_ar_ec/demo_EC/layouts/layout_estintore.js#27-180)).

**Struttura del canvas** (orizzontale 1600×900, come l'estintore):

| Sezione | Contenuto |
|---------|-----------|
| **Header** | Nome macchina + sottotitolo "ISO 50001 · MONITORAGGIO ENERGETICO" con gradiente ambra→arancio |
| **Spia di allarme** | Cerchio con glow in alto a destra. Cambia colore in base alla potenza attuale: 🟢 verde (< 70% soglia), 🟡 giallo (70-90%), 🔴 rosso (> 90%). Ad ogni [fetchDati](file:///c:/Users/favol/OneDrive%20-%20Politecnico%20di%20Torino/Dekstop/Tirocinio/demo_ar_ec/demo_EC/layouts/layout_iaq.js#24-38) i dati fluttuano e quindi la spia cambia dinamicamente. |
| **Colonna SX – KPI Energetici** | Potenza istantanea (kW), Consumo giornaliero (kWh), Efficienza (%), Ore operative. Ogni riga con valore numerico e indicatore live. |
| **Colonna DX – Benchmark** | Card con EnPI (Energy Performance Indicator) in formato gauge/barra, confronto con baseline ISO 50001, e obiettivo di riduzione. Indicatore visivo se la macchina è sopra/sotto la baseline. |
| **Bottone** | "📊 DETTAGLIO CONSUMI & PREDIZIONE" → apre la detail-view con grafico Chart.js |

**[fetchDati](file:///c:/Users/favol/OneDrive%20-%20Politecnico%20di%20Torino/Dekstop/Tirocinio/demo_ar_ec/demo_EC/layouts/layout_iaq.js#24-38)**: simula dati realistici con fluttuazioni casuali. Include `potenza_kw`, `consumo_giornaliero_kwh`, `efficienza_perc`, `ore_operative`, `soglia_allarme_kw`, `baseline_enpi`, `enpi_attuale`.

**`hitboxes`**: una hitbox per il bottone dettaglio consumi, in modo che cliccando si apra il grafico.

**Dettaglio consumi (via [apriDettaglio](file:///c:/Users/favol/OneDrive%20-%20Politecnico%20di%20Torino/Dekstop/Tirocinio/demo_ar_ec/demo_EC/index.html#1021-1085))**: Il grafico Chart.js mostrerà due dataset sovrapposti: consumo reale (linea ambra) e baseline ISO 50001 (linea tratteggiata verde), per un benchmark visivo immediato. Per fare questo, dovremo estendere leggermente la funzione [apriDettaglio](file:///c:/Users/favol/OneDrive%20-%20Politecnico%20di%20Torino/Dekstop/Tirocinio/demo_ar_ec/demo_EC/index.html#1021-1085) in [index.html](file:///c:/Users/favol/OneDrive%20-%20Politecnico%20di%20Torino/Dekstop/Tirocinio/demo_ar_ec/demo_EC/index.html) per gestire un tipo speciale `benchmark_energia`.

---

### Registro JSON

#### [MODIFY] [registro.json](file:///c:/Users/favol/OneDrive%20-%20Politecnico%20di%20Torino/Dekstop/Tirocinio/demo_ar_ec/demo_EC/registro.json)

Aggiungere due macchine generiche **della stessa categoria** (tipo `"macchina"`) con marker ID `7` e `8`:

```json
"7": {
    "tipo": "macchina",
    "nome": "Compressore Aria CMP-01",
    "id_macchina": "cmp01",
    "soglia_kw": 45,
    "file": "layouts/layout_macchina.js",
    "oggetto": "LayoutMacchina"
},
"8": {
    "tipo": "macchina",
    "nome": "Pompa Idraulica PMP-02",
    "id_macchina": "pmp02",
    "soglia_kw": 30,
    "file": "layouts/layout_macchina.js",
    "oggetto": "LayoutMacchina"
}
```

Le due macchine avranno dati diversi (potenze e soglie diverse) ma lo stesso layout.

---

### Integrazione index.html

#### [MODIFY] [index.html](file:///c:/Users/favol/OneDrive%20-%20Politecnico%20di%20Torino/Dekstop/Tirocinio/demo_ar_ec/demo_EC/index.html)

Estendere la funzione [apriDettaglio](file:///c:/Users/favol/OneDrive%20-%20Politecnico%20di%20Torino/Dekstop/Tirocinio/demo_ar_ec/demo_EC/index.html#1021-1085) per gestire il caso `benchmark_energia`: quando l'utente clicca sul bottone del pannello macchina, il grafico mostra **due linee** (consumo reale vs. baseline) anziché una sola. L'estensione è minimale (~20 righe) e non modifica il comportamento degli altri pannelli.

## Verification Plan

### Manual Verification
1. Aprire [index.html](file:///c:/Users/favol/OneDrive%20-%20Politecnico%20di%20Torino/Dekstop/Tirocinio/demo_ar_ec/demo_EC/index.html) nel browser (o in AR con il marker barcode `7` o `8`)
2. Verificare che il pannello si renderizzi con lo stile dark glassmorphism coerente con gli altri
3. Osservare la **spia di allarme** che cambia colore ad ogni aggiornamento (~1 secondo) in base ai valori simulati
4. Pinnare il pannello e cliccare sul bottone "DETTAGLIO CONSUMI & PREDIZIONE"
5. Verificare che il grafico Chart.js mostri due linee: consumo reale (ambra) e baseline (verde)
6. Chiudere il dettaglio e verificare che si torni al cruscotto
