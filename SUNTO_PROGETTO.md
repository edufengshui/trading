# Trading Calculator (大六壬) — sunto per nuova chat

Incolla questo documento all'inizio della nuova conversazione, insieme ai file allegati.

## Cos'è il progetto

PWA a `fsadvisor.org/trading/` (repo GitHub `edufengshui/trading`, branch `main`, file in ROOT)
che trasforma il prezzo forex delle 00:00 GMT in una carta di divinazione **大六壬 (Da Liu Ren)**
e genera segnali **LONG / SHORT / NO TRADE**.

Metodo: prezzo alle 00:00 GMT → prime 3 cifre significative → mod 12 (子=1) → 地支
(Earthly Branch) = 占時 → carta 大六壬 (pilastro-giorno + 月將 a 0°/mezzogiorno GMT) → 三傳
(Three Transmissions) → regole del **Livello 1** confermano/smentiscono il trend dato
dall'**EMA(8+1)** sulle chiusure giornaliere → segnale finale.

Edu (l'utente) **non è programmatore**, lavora in italiano, usa Edge, deploya con GitHub
Desktop (Commit → Push origin) + Cloudflare Dashboard (Edit code → Ctrl+A → Canc → incolla →
Deploy). Tutto il testo in-app è in inglese; i termini cinesi vanno sempre accompagnati
dall'inglese.

## File allegati a questa chat

- **`trading-pwa.zip`** — tutti i 12 file della PWA (cache service-worker `v14`). Da estrarre
  DENTRO la cartella `trading` del repo, sovrascrivendo tutto.
- **`worker/index.js`** (o cercalo negli output di questa chat) — il Cloudflare Worker che
  fornisce i dati forex (seed + EMA + storico). Va incollato nell'editor Cloudflare.
- **`backtest.js`** — script Node che fa girare i motori reali (`daliuren.js` + `trend.js`)
  su dati storici per il backtest.
- **`backtest_trades.csv`** — 4.119 trade del backtest (2023-2026), con data, cross, seme,
  ramo, metodo, 三傳, verdetto, segnale, pip.
- **`perdite_recenti.txt`** — 40 trade in perdita con la carta completa, per verifica manuale.

## Stato del motore (daliuren.js + trend.js) — TUTTO VALIDATO

Il motore Livello 1 (`trend.js`) legge i 三傳 e conferma/smentisce il trend. Regole
implementate e validate contro carte di riferimento fornite dall'utente:

- **Base 五行**: M2 genera/uguale a M1 → confermato; M2 drena/controlla M1 → non confermato;
  M1 controlla M2 → confermato salvo M1 vuoto; M2 六合 M1 → non confermato (terminale).
- **Tombe**: tomba del tronco-giorno su M1; M2=tomba di M1 (recuperabile da 冲 di M3, MA non se
  M1 è vuoto); tomba vuota (in 空) non seppellisce.
- **旬空 (Void)**: calcolato sulla **decade del giorno** (非 quella dell'ora — bug corretto).
  M1 vuoto si conferma SOLO se nutrito: M2 genera M1 E M2 è forte (timely o rinforzato da M3
  forte) E M3 non ostacola.
- **月將 (Month General)**: mai vuoto, sempre forte, doppia energia. Se M1 vuoto e M2=月將,
  è M2 a rappresentare il trend (M3 giudica).
- **三會 (trio direzionale)**: 寅卯辰/巳午未/申酉戌/亥子丑. Sequenza oraria → lettura normale;
  antioraria → **ribaltata** (override finale).
- **刑 (Penalty)**: qualunque penalità tra i tre messaggi → non confermato (terminale), tranne
  il caso M2-penalizza-M1 isolato, salvabile da un 冲/六合 di M3 su M2.
- **返吟 (Fan Yin)**: → **NO TRADE**.
- **冲 clash vs 剋 control (regola più recente, validata su USDCAD 15/07/2026)**: quando il
  trend (M1) e il suo giudice (M2) sono SIA una coppia di 冲 (clash, 6 posizioni) SIA in
  relazione di controllo 五行, si confronta la **forza**: 墓 (tomba nel mese corrente, la più
  debole) < 囚/死 < normale < 相 (generato dall'elemento del ramo-mese specifico, o dalla
  stagione ampia) < 旺 (coincide con la stagione ampia). M2 è sempre il "clasher". Se M2 è più
  forte di M1 → il clash sfonda → non confermato. Se M2 è più debole, il clash da solo non
  sfonda; se M3 si lega (六合) a M1 → il trend è protetto (confermato) — e la stessa protezione
  scherma ANCHE dal 刑. Se M2 è debole e non c'è legame, si segue la catena 五行 ordinaria
  senza modifiche.

**Filtro di consolidamento EMA** (in `trend.js`, condiviso da Worker/PWA/backtest): finestra di
10 giorni sulla direzione EMA(8+1); se ≥3 inversioni (i giorni piatti non spezzano la gamba) →
NO TRADE. Soglia confermata dall'utente su esempi reali (screenshot AUDCHF/AUDJPY vs EURUSD).

**EMA(8+1)**: periodo 8, ritardata di 1 barra (valore di oggi = EMA calcolata sulle chiusure
fino a ieri). Direzione = pendenza della linea (sale=blu=up, scende=rossa=down), confrontando
gli ultimi due punti della serie ritardata — NON prezzo-vs-linea.

## Worker Cloudflare (Twelve Data)

URL: `https://trading-forex-seed.decumano16.workers.dev/`. Migrato da TraderMade a Twelve Data
(piano gratuito Basic-8: 800 crediti/giorno, 8/min). Secret `TWELVEDATA_API_KEY`, KV binding
`SEEDS`, cron `10 0 * * *`. **Una sola chiamata daily per cross** (seed dall'open di oggi +
EMA dalle chiusure precedenti, con ordinamento forzato ascendente perché Twelve Data a volte
torna i dati dal più recente).

Endpoint:
- `GET /` — feed cache del giorno (CORS)
- `GET /run` — ricalcola ORA e risponde in sincrono (~70-80s per 9 cross, throttle 8s tra
  chiamate)
- `GET /history?size=800` — barre giornaliere grezze per tutti i 9 cross (per backtest)
- `GET /hourly?size=5000` — barre orarie grezze (per test di uscita infragiornaliera)

Crosses: EURUSD, GBPUSD, USDJPY, USDCHF, AUDUSD, USDCAD, NZDUSD, EURJPY, EURGBP.

## PWA — funzionalità principali

- Bottone "Forex 00:00 GMT" → carica il feed, mostra le pillole dei 9 cross con ramo +
  direzione EMA (↑/↓); i cross **non consolidati** sono marcati ⚠, sbiaditi, ma cliccabili.
  Auto-seleziona il primo cross idoneo.
- Pannello Trend per il cross selezionato: derivazione del seme (visibile passo-passo:
  prezzo→cifre→resto→ramo), direzione EMA con storico ultimi 10 giorni, catena 三傳 con
  verdetto e traccia completa del ragionamento, segnale finale LONG/SHORT/NO TRADE.
- **Bug corretto**: il campo DATE in modalità Forex ora è sincronizzato col feed (prima poteva
  mostrare una data diversa da quella della carta effettivamente visualizzata — causa di
  confusione grave durante la verifica manuale delle carte).
- **Bug corretto**: il filtro di consolidamento fallisce in modo rumoroso (banner rosso) se il
  feed è vecchio/senza i campi necessari, invece di tacere e sembrare "tutto ok".

## Backtest — risultato onesto

4.119 trade completi (2023-10 → 2026-07, esclusa la barra di oggi in corso), entrata 00:00 GMT
open, uscita chiusura giornaliera. **EURUSD ha dati degeneri (open=close) prima del
2025-07-14** sul piano gratuito Twelve Data — esclusi automaticamente dal backtest (fake open
= fake seed, non solo P&L a zero). Altri cross: 1-5% di barre degeneri, escluse.

**Risultato principale** (prima della regola clash-forza più recente, da rilanciare):
- Sistema: ~49.5-49.8% win rate
- Sempre-segui-EMA: 47.3%
- Sempre-contro-EMA: 52.7% (mean reversion reale ma sparisce con lo spread)
- **Test decisivo**: ribaltamento CASUALE alla stessa frequenza del sistema (~59-63%) →
  atteso ~50.5%. Il sistema è STATO SOTTO quell'atteso in quasi tutte le ~30 configurazioni
  testate (13 periodi EMA da 3 a 50, giorno-precedente-come-trend con/senza lunedì, 8 orari di
  uscita 16:00-23:00, 7 soglie di esclusione "pari e patta" 0-30 pip).
- **Conclusione onesta data all'utente**: in nessuna configurazione testata finora il livello
  divinatorio ha aggiunto informazione positiva rispetto al caso. Il motore stesso è stato
  verificato sano (tutti i 9 metodi 三傳 compaiono, tutti i 12 rami dai semi, LONG/SHORT
  bilanciati, zero incoerenze segnale/pnl).

**IMPORTANTE**: il backtest sopra è stato girato PRIMA dell'aggiunta della regola clash-forza
(冲 vs 剋 con confronto di forza + salvataggio 六合) descritta sopra, che ha corretto almeno
2 carte verificate manualmente dall'utente (USDCAD 15/07, e la logica implicata per altri
casi simili). **Il backtest va rilanciato con la versione attuale del motore** prima di trarre
conclusioni definitive — è molto probabile che il risultato resti vicino al caso (il motore
era già stato validato pignolamente carta per carta), ma va verificato, non assunto.

## Errori corretti in questa sessione (per trasparenza, tutti trovati dall'utente)

1. 涉害 (Wading Harm): profondità del danno contata nel verso sbagliato — corretto e validato.
2. 旬空 (Void): calcolato sul pilastro dell'ora invece che sul giorno — corretto.
3. Filtro di consolidamento: falliva in silenzio quando il feed era vecchio — ora fallisce
   rumorosamente (banner rosso).
4. Barra di oggi (incompleta) inclusa nel backtest — esclusa (impatto era comunque marginale,
   0.17% del campione).
5. 刑 (Penalty): applicato solo alle sequenze di terra invece che a tutte le coppie — corretto
   e generalizzato, con salvataggio via 冲/六合 di M3 su M2.
6. Campo DATE della PWA disallineato dal feed in modalità Forex — corretto (causa diretta di
   un'accusa giustificata dell'utente di "carta sbagliata" quando in realtà l'interfaccia
   mentiva sulla data mostrata).
7. **冲 clash vs 剋 control**: il motore ignorava che due rami potessero essere SIA in
   relazione di controllo 五行 SIA in clash (冲) simultaneamente, e non aveva alcun meccanismo
   di salvataggio via 六合 di M3 su M1. Corretto con la regola di forza descritta sopra.

## Prossimi passi suggeriti

1. **Rilanciare il backtest** con `backtest.js` sui dati storici allegati (o richiederne di
   nuovi via `/history`) per confermare se il risultato resta nullo dopo il fix del clash.
2. Continuare a validare i metodi 三傳 non ancora confermati (別責, 八專) quando l'utente porta
   una carta di riferimento.
3. Chiedere all'utente se vuole approfondire ulteriori livelli (天將 Heaven Generals, 六親 Six
   Relations) o altre eccezioni metafisiche emerse controllando altre carte in perdita.
4. Mantenere la disciplina già stabilita: ogni nuova regola va dedotta dalla tradizione/dalle
   correzioni dell'utente su carte REALI verificate, MAI cucita per far salire il backtest.

## Convenzioni di lavoro da rispettare

- Dialogo in italiano, testo in-app in inglese, termini cinesi sempre accompagnati
  dall'inglese.
- File completi, mai patch parziali da incollare a mano.
- `node --check` su ogni file JS prima della consegna.
- Deliverable: zip completo della PWA (`trading-pwa.zip`, tutti i 12 file, cache bump ad ogni
  modifica) + `worker/index.js` separato, quando entrambi cambiano. Solo quello che cambia,
  quando cambia solo uno dei due.
- Istruzioni di click passo-passo per ogni deploy (Edu non è programmatore).
- Bug handling: correggere subito, senza filosofeggiare — Edu è stato esplicito su questo.
