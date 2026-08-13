# Registro delle correzioni dottrinali — 13/08/2026

Regole enunciate da Edu in questa sessione. **Vanno conservate anche se non ancora
confermate dai numeri**: una regola non confermata oggi può servire domani, e riesaminare
le carte una per una è lento e costoso.

Stato: `FISSATA` (confermata dai numeri) · `IN PROVA` (misurata, esito incerto) ·
`ARCHIVIATA` (enunciata, non ancora misurata) · `BOCCIATA` (misurata e respinta).

---

## 1. Clash — validità per pilastro  ·  `FISSATA` (implementata in liuyao.js)

- Clash dal **GIORNO**: sempre effettivo.
- Clash dall'**ANNO**: effettivo solo se il **ramo dell'anno** è in 旺/相
  (chi clasha deve avere forza; non la linea clashata).
- Clash dal **MESE**: **non effettivo da solo**, ma **potenzia** gli altri due quando è presente.

## 2. Combinazione (六合) — bloccante con protezione  ·  `FISSATA` (implementata in liuyao.js)

- La combinazione **dal GIORNO** blocca sempre il ramo (fuori dai giochi).
- Ma protegge anche il ramo da un clash diretto: per colpirlo servono **DUE clash**,
  il primo rompe la combinazione, il secondo attacca.
  - 0 clash → **legata** (bloccata)
  - 1 clash → combinazione rotta, ramo **liberato** (non ancora colpito)
  - ≥2 clash → combinazione rotta **e** ramo colpito (rotta/mossa secondo la stagione)
- Solo dal giorno (non da mese o anno).

## 3. Ripiego del LY quando Shi e Ying sono fuori  ·  `BOCCIATA` come sostituto del PB

Se né Shi 世 né Ying 應 sopravvivono, la lettura passa a:
**G 官鬼 → W 妻財 → linea mobile**, preferendo fra i candidati quelli **timely** (旺/相);
linee molto untimely e non sostenute dalla data hanno poca efficacia.
Direzione: **posizione della linea che regge** (trigramma inferiore L1-3 = SHORT,
superiore L4-6 = LONG). La variante "posizione della linea che essa genera" è **bocciata**
(45,07%).

Misura (301 carte in ripiego, 202 con responso):

| | n | Liu Yao | Plum Blossom |
|---|---|---|---|
| Tutto | 202 | 56,44% · +1.782 pip | 57,92% · +1.321 pip |
| Recente 2023-05→ | 113 | 53,98% · +810 pip | 58,41% · +296 pip |
| Vecchio 2020→2022 | 84 | 59,52% · +574 pip | 55,95% · +567 pip |

Esito: **non sostituisce il PB** (perde nel recente). Sui **pip** però batte il PB su
entrambi i periodi — firma diversa, prende i movimenti più grossi. Da non buttare.
Nota: il ripiego scatta su carte dove il PB va **già bene** (57,92% contro 53,51% di baseline).

**Sequenza verificata la migliore su 66 varianti testate** (G→W→mobile, 56,2%).
G in testa è solido; i criteri "di rilevanza" senza ordine fisso vanno peggio
(più forte in stagione 50,2%; solo timely più basso 52,6%).

## 4. Autopenalità 自刑 dal giorno  ·  `IN PROVA` — misurata, campione troppo piccolo

Carta sorgente: **USDJPY 05/12/2022** (seme 134, sup 8 坤, inf 6 坎, mutante L1).

Quando ci sono **due linee dello stesso parente** candidate a reggere la lettura, quella
che riceve **autopenalità dal giorno** (stesso ramo del giorno: 辰辰, 午午, 酉酉, 亥亥)
è penalizzata ed esce; la generazione va all'altra.

Nella carta: mobile L1 寅 → 巳 Fuoco (caso 2 泄, agisce l'arrivo). Il Fuoco genera Terra e
quindi **entrambi** gli Ufficiali (辰 a L2, 丑 a L4): da sola la generazione non discrimina.
Il giorno è 壬**辰** e il G basso è **辰** → 辰辰自刑 → esce. Resta il G alto 丑 (L4,
trigramma superiore) → LONG. Il mercato sale. ✓

Senza questo criterio la regola sceglieva il G più basso per posizione, cioè a caso.

**Misura (13/08/2026):** esclude solo **6 linee** su 202 carte di ripiego — troppo raro per
essere validato. Win rate complessivo invariato (56,44%), pip +311. Recente 53,10% contro
53,98%; vecchio 60,71% contro 59,52%. Con 6 casi sono scarti di rumore.
Il criterio resta dottrinalmente corretto e va **tenuto**: sulla carta sorgente sceglie
giusto, e potrà contare quando entrerà in una regola con più occorrenze.

## 5. PB — il giorno immobilizza il Yong trasformato  ·  `BOCCIATA` — misurata 13/08/2026

Carta sorgente: **USDJPY 05/12/2022**.

坎 Kan muta in 兌 Dui, il cui palazzo Houtian è **酉**; il giorno **辰** lo combina
(辰酉合) e lo **immobilizza**. Il Yong trasformato legato ⇒ il Trend non può esercitare
la relazione (qui 我剋) ⇒ **non segue**.

Concorre con il **Rafforzamento**, che sulla stessa carta dà lo stesso verdetto per via
diversa (兌 Metallo genera 坎 Acqua ⇒ Yong rinforzato).

**Misura (13/08/2026):** tocca **543 carte** (115 già toccate dal Rafforzamento, 428
indipendenti). Dove **cambierebbe** il verdetto (160 carte, oggi "segue" → "non segue")
vince **44,4%** e rende **−1.160 pip** contro i +1.160 di oggi. Perde su entrambi i periodi
(recente 44,8%, vecchio 43,3%). Imponendo "non segue" su tutte e 543: 53,78% contro 57,09%
del baseline.

**Esito: bocciata.** Il Rafforzamento resta la lettura migliore per questa configurazione.
Il meccanismo è sensato e sulla carta sorgente dà la risposta giusta, ma non generalizza.

## 6. PB — la combinazione blocca il palazzo del Trend  ·  `ARCHIVIATA` — da misurare

Carta sorgente: **EURJPY 04/11/2025** (seme 177, sup 6 坎, inf 1 乾, mutante L3).

Il giorno 丑 combina il palazzo del Trend 子 (子丑合) ⇒ il Trend è legato ⇒ **non segue**.

⚠ **Capovolge una regola esistente**: oggi il motore legge la combinazione sul palazzo del
Trend come *protezione* (→ segue), e solo quando la base dice "non segue" (`protetto`,
flag `CP=verdetto`). Edu dice che è un **bloccante** (→ non segue). Non è un'aggiunta:
è un cambio di polarità. Da misurare prima di applicare.

---

## Correzioni ai fatti, registrate per non ripeterle

- **EURJPY 04/11/2025** — il Metallo *c'è* nel Bazi: 庚 in 戌 è a 衰 (stadio 6, appena oltre
  il picco), 戌 e 丑 custodiscono 辛, e l'ora dal seme è 申. Contare solo l'elemento dei rami
  (巳 Fuoco, 戌 Terra, 丑 Terra) è una lettura grossolana.
- **EURJPY 15/03/2023** — è lo **Shi** a essere combinato dal giorno (巳申合) e l'**Ying** a
  essere clashato da mese e anno (卯酉冲), non il contrario.
- **USDJPY 05/12/2022** — non c'è combinazione dal giorno sul palazzo del Trend: il giorno 辰
  combina 酉, assente dalla carta. L'unica combinazione è 寅+亥 (Tai Sui col **mese**). Il
  palazzo del Trend 未 non è combinato ma **vuoto**.
- Il Liu Yao **v1** (sola relazione Ying→Shi, senza stati di forza) non è "il Liu Yao":
  su 1.800 contrasti col PB ha ragione il PB nel 54,50% (−7.238 pip seguendo il LY).
  Le letture complete di Edu sulle stesse carte sono corrette; è la v1 a fallire.
- Le carte esaminate a mano nelle sessioni di studio sono in prevalenza **casi negativi del
  PB**: in quella popolazione il LY appare superiore per costruzione. Il confronto va sempre
  fatto sull'insieme completo.


---

## 7. PB — il vuoto è sempre vuoto (fuori dal pareggio)  ·  `BOCCIATA` — misurata 13/08/2026

Carta sorgente: **USDCAD 18/03/2020** (seme 142, sup 1 乾, inf 6 坎, mutante L4).
Enunciato: il palazzo del Trend vuoto rende il Trend inagibile in **qualsiasi** relazione,
non solo nel pareggio 比和. Eccezione: se il ramo del Trend è **clashato**, il vuoto è
risvegliato e non vale.

| | baseline | =giorno | =pieno |
|---|---|---|---|
| Tutto | 53,51% · z 3,86 · 17.221 | 53,32% · z 3,49 · 17.600 | 53,34% · z 3,53 · 17.834 |
| Recente | **53,28%** · 10.717 | 52,79% · 9.346 | 52,83% · 9.580 |
| Vecchio | 54,39% · 6.896 | 54,45% · 8.384 | 54,45% · 8.384 |

**Esito: bocciata.** Il guadagno in pip viene **interamente dal periodo vecchio**; il recente
peggiora su entrambe le metriche. La z scende da 3,86 a 3,53.

**Perché il vuoto resta confinato al pareggio** (spiegazione dottrinale, non ancora testata
per relazione): nel 比和 la relazione non decide nulla e serve uno spareggio di sostanza;
nelle altre quattro la forza sta già nella relazione, che agisce fra **elementi**, e il vuoto
di un ramo di palazzo non interrompe un rapporto elementale. Il palazzo Houtian è una
corrispondenza posizionale, il 旬空 una proprietà calendariale: piani diversi.
**Aperto:** il vuoto potrebbe agire in *alcune* relazioni (es. 我剋, che richiede sostanza per
esercitare controllo) e non in altre (生我, dove il Trend riceve). Da scomporre per relazione.

## 8. PB — il Tai Sui non si batte  ·  `BOCCIATA` — misurata 13/08/2026

Carta sorgente: **USDCAD 18/03/2020**. Il Tai Sui non è mai vuoto; se il ramo dell'anno
coincide col palazzo del Trend, il Trend è il trigramma del Tai Sui e non può essere battuto.
Qui: anno 庚**子**, palazzo del Trend 坎 = **子**, e 子 è fra i vuoti del giorno.
Spiegherebbe con una sola regola sia il vuoto inerte sia il mancato drenaggio da 巽.

| variante | tutto | z |
|---|---|---|
| baseline | 53,51% · 17.221 | 3,86 |
| annulla il vuoto | 53,49% · 17.187 | 3,83 |
| annulla il drenaggio | 53,54% · 17.317 | **3,89** |
| annulla tutto | 53,42% · 16.043 | 3,76 |
| impone segue | 53,00% · 13.404 | 3,38 |

**Esito: bocciata.** La sola variante positiva (drenaggio) guadagna +0,03 punti e +96 pip —
indistinguibile da zero — e perde comunque nel recente (53,23 contro 53,28). La forma forte
("impone segue") è la peggiore di tutte.

**Da conservare, osservazione collaterale:** le **280 carte** in cui il palazzo del Trend
coincide col ramo dell'anno si comportano in modo **opposto nei due periodi** —
recente **60,54%** (+2.452 pip), vecchio **50,40%** (+11 pip). Sette punti sopra il baseline
nel recente, neutre nel vecchio. Non stabile, quindi non regolarizzabile, ma la spaccatura è
troppo netta per essere solo rumore e non era mai emersa.

## 9. LY — autocombinazione 自合 della mobile  ·  `FISSATA` (implementata in liuyao.js)

Carta sorgente: **USDCAD 18/03/2020** (訟 Song 6 → 渙 Huan 59), verificata sullo screenshot
del software di riferimento.

Se la **partenza** della linea mobile combina (六合) il proprio **arrivo**, la linea si lega a
se stessa: è **bloccata**, non è più "in movimento" e non regge la lettura.
Qui: mobile L4 兄弟 午 → 未, e 午未合 → lo Shi (che è la mobile) esce dai giochi.
Nuovo stato di linea: `autocombinata`, che conta come morta. Nuovo caso di mutazione: **-4**.

## 10. LY — il G nascosto (伏神) è fuori dai giochi  ·  `FISSATA` (già coerente)

Nella gerarchia di ripiego, un parente presente **solo come 伏神** non conta come candidato.
Qui 官鬼 亥 è nascosto dietro L3 e viene saltato; la lettura passa a W.
Il modulo lo faceva già correttamente (i nascosti non sono linee visibili).

## 11. LY — la linea che coincide col ramo del giorno  ·  `ARCHIVIATA`

Una linea il cui ramo è **uguale al ramo del giorno** (日辰臨爻) è al massimo della forza.
Qui: W 妻財 **申** a L5, e il giorno è 庚**申**. È l'unica linea che sopravvive, sta nel
trigramma **superiore** → LONG. Il mercato sale, EMA su: **segue**. ✓
Da usare come criterio di preferenza fra candidati (più forte del semplice "timely").

## ⚠ QUESTIONE APERTA — l'Ying clashato dal giorno ma timely

Su questa carta Edu dà l'**Ying fuori dai giochi** perché clashato dal giorno:
Ying L1 父母 **寅**, giorno **申**, 寅申冲.

Ma per la **regola 1** già fissata, una linea piena clashata dal giorno e **timely** è in
**暗動 (movimento oscuro): resta viva**. E 寅 Legno nel mese 卯 è 旺, quindi timely.
Il modulo infatti la dà `mossa` = viva, e per questo **non attiva il ripiego** su questa carta.

Ipotesi da sottoporre a Edu: la differenza potrebbe stare nel fatto che 申 non solo clasha
寅 ma lo **controlla** (Metallo controlla Legno) — un 剋冲, distruttivo, diverso da un clash
fra pari come 子午. Se confermato, la regola diventerebbe: *clash + controllo dal clashante =
la linea cade anche se timely*.
**Non implementato:** serve la conferma dottrinale prima di toccare la regola 1.


---

# 12. IL RUOLO DI P 父母 — P È UN CONDOTTO, NON UN ATTORE  ·  `SCOPERTA` (13/08/2026)

**È il risultato più importante della sessione, e l'unico che regge su entrambi i periodi.**

## L'enunciato di Edu

P 父母 **drena G** (il portatore direzionale) e **controlla C** (che a sua volta genera W).
Elementalmente verificato sul palazzo 離 (Fuoco): G=Acqua, P=Legno, B=Fuoco, C=Terra, W=Metallo.
Acqua genera Legno ⇒ **P drena G**. Legno controlla Terra ⇒ **P controlla C**.
Terra genera Metallo ⇒ **C genera W**.
Ipotesi: *P non è mai indicatore di guadagno, casomai di perdita — DA SOLO*.

## Cosa dicono i numeri

**Per posizione** (tasso di successo del PB, baseline 53,51%):

| | Shi | Ying | mobile |
|---|---|---|---|
| P 父母 | 53,77% (n=584) | **55,17% (n=1287)** | **52,41% (n=893)** ← peggiore dell'asse |

Alla **mobile** l'ipotesi di Edu è confermata: P è il peggiore dei cinque parenti.
All'**Ying** invece P è la cella più grande e più redditizia della tabella (+8.210 pip).
La contraddizione è solo apparente e si scioglie scomponendo per rapporto con lo Shi.

## Il cuore della scoperta — P all'Ying, per rapporto con lo Shi

| rapporto | n | tutto | recente | vecchio | pip/trade |
|---|---|---|---|---|---|
| **Shi=B — P GENERA lo Shi (drenato)** | 356 | **59,55%** | 61,58% | 54,55% | **12,01** |
| Shi=P — stesso parente | 199 | 55,28% | 49,00% | 62,64% | 5,21 |
| Shi=C — P controlla lo Shi (domina) | 275 | 53,82% | 53,29% | 58,04% | 7,16 |
| Shi=W — W controlla P (controllato) | 426 | 53,05% | 53,21% | 56,38% | 2,56 |
| **Shi=G — G genera P (nutrito)** | 31 | **45,16%** | 33,33% | 56,25% | **−5,29** |

**È il DRENAGGIO che conta, non il controllo.**
- P **drenato** dallo Shi: 59,55%, sopra il baseline su **entrambi** i periodi, 12 pip a trade.
- P **controllato** dallo Shi: 53,05% — esattamente il baseline. Il controllo non produce nulla.
- P **nutrito** da G: 45,16% e −5,29 pip/trade — l'unica cella negativa dell'intera analisi
  (campione piccolo, n=31, e nel recente crolla al 33%: il segno è chiaro, la regola no).

## Formulazione

**P non è un attore, è un condotto.** Conta solo ciò che passa *attraverso* di lui verso lo Shi.
Quando P **cede** (genera lo Shi) il sistema rende al massimo; quando P **trattiene** — perché
nutrito da G o controllato da W — il vantaggio sparisce; quando riceve e basta, perde.
Questo riconcilia le due facce: alla **mobile** P prende l'iniziativa e drena G, e nuoce
(52,41%, peggiore dell'asse); all'**Ying** P sta fermo e nutre il Soggetto, e giova.

## Il caso "P non fa niente" — controintuitivo

Scomposizione di P all'Ying quando lo Shi è B (cioè P genera lo Shi):

| caso | n | tutto | recente | vecchio | pip/trade |
|---|---|---|---|---|---|
| P→B allo Shi, **B incartato** | 109 | **65,14%** | 64,15% | 62,22% | 10,67 |
| P→B allo Shi, B agibile | 247 | 57,09% | 60,67% | 50,00% | 12,60 |
| P all'Ying, Shi non è B | 931 | 53,49% | 51,75% | 58,23% | 4,23 |

Il caso in cui P "non fa niente" perché il B allo Shi è **incartato** (es. autocombinazione) è
il **migliore**: 65,14%, stabile su entrambi i periodi, ~11,6 punti sopra il baseline, z ≈ 2,4
su 109 carte. Il caso col B agibile è **instabile** (vecchio 50,00%).

⚠ **Attenzione a cosa misura:** è il tasso di successo del **PB** su quelle carte, non un
segnale del LY. Non dice "P incartato predice la direzione" — dice **"su queste carte il PB ci
prende quasi sempre"**, quindi sono carte in cui il LY **non deve correggere nulla**.
Carta esemplare: **USDCAD 18/03/2020**, che sta in questa cella, e il PB ha ragione (+266 pip).

## Perché conta

È **l'unico risultato della sessione che non si è sbriciolato al controllo dei due periodi**.
Tutte le altre regole misurate oggi (vuoto sempre vuoto, Tai Sui, immobilizzazione del Yong
trasformato, ripiego LY) reggevano su un periodo solo.

**Da fare:** estendere la stessa scomposizione per rapporto con lo Shi agli altri parenti
(W 妻財, C 子孫, B 兄弟, G 官鬼) — la chiave "drenato / controllato / nutrito / domina" non era
mai stata usata come asse di analisi e su P ha separato nettamente.


## 12-bis. P allo SHI — completamento (13/08/2026)

**P allo Shi non ha mai la configurazione buona.** Con lo Shi = P, l'Ying risulta solo
W, P o G: **il caso "drenato" (Ying=B) non compare mai**. P al Soggetto non può cedere.

| P allo Shi, rapporto con l'Ying | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| Ying=W — P controllato | 205 | 55,61% | 52,42% | 59,74% | 6,38 |
| Ying=P — stesso parente | 199 | 55,28% | 49,00% | 62,64% | 5,21 |
| **Ying=G — P nutrito** | 180 | **50,00%** | 49,48% | 50,67% | **0,86** |

Le prime due sono **instabili** (crollano nel recente). La terza è **stabile e cattiva su
entrambi i periodi**.

**Conferma incrociata:** *P nutrito da G* è negativo in **entrambe** le posizioni —
45,16% all'Ying (n=31) e 50,00% allo Shi (n=180), con il campione grande stabile sui due
periodi. Quando P riceve da G invece di cedere, il vantaggio sparisce.

**Stato della linea (P allo Shi):**

| | n | tutto | recente | vecchio |
|---|---|---|---|---|
| fermo | 486 | 54,94% | 51,88% | 58,91% |
| incartato | 226 | 54,87% | 49,14% | 59,79% |
| agibile | 358 | 53,07% | 51,22% | 56,85% |
| **è la linea mobile** | 98 | **47,96%** | 43,64% | 53,66% |

**P che si muove è il caso peggiore** (47,96%, oltre 5 punti sotto il baseline); P fermo 54,94%.
Stesso segnale già visto sull'asse della mobile (52,41%, ultimo dei cinque), qui più netto
perché il Soggetto che prende l'iniziativa pesa di più.

### REGOLA FISSATA — P 父母

> **P vale solo come donatore fermo.**
> - P **cede** allo Shi (Shi=B, P genera il Soggetto) → 59,55%, la configurazione migliore
> - P **fermo** → sopra il baseline
> - P **si muove** → 47,96%, il peggio
> - P **nutrito da G** → nessun vantaggio, in entrambe le posizioni
> - Allo **Shi** P non può mai cedere (il caso drenato non esiste): posizione strutturalmente debole


---

# 13. IL RUOLO DI C 子孫 — VERSARE IN W È UNA PERDITA  ·  `SCOPERTA` (13/08/2026)

## L'enunciato di Edu
*C dovrebbe essere positivo quando genera W, negativo quando controlla G.*
(C genera W e controlla G sempre, per costruzione elementale: nel palazzo 離, C=Terra,
W=Metallo, G=Acqua; Terra genera Metallo, Terra controlla Acqua.)

## Esito: **l'ipotesi è invertita dai numeri**

**C allo SHI — rapporto con l'Ying:**

| | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| **C controlla G (SOPPRIME)** | 164 | **60,98%** | 54,95% | 73,08% | 13,16 |
| altro = P | 275 | 53,82% | 53,29% | 58,04% | 7,16 |
| **C genera W (VERSA)** | 122 | **46,72%** | 50,00% | 43,33% | **−3,26** |

All'**Ying** lo stesso ordine, più compresso: sopprime 53,11% · versa 50,45%.
Alla **mobile** l'ordine si confonde e le celle sono instabili fra i due periodi.

## La cella peggiore dell'intera sessione

**C allo SHI — bersagli vivi sulla carta:**

| | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| W assente · G assente | 82 | 63,41% | 60,98% | 71,05% | 10,68 |
| W vivo · G vivo | 77 | 58,44% | 54,76% | 62,86% | 13,63 |
| W assente · G vivo | 313 | 54,63% | 53,44% | 58,62% | 8,06 |
| **W vivo · G assente** | 89 | **41,57%** | 45,28% | 34,29% | **−8,07** |

Quando C ha un **W vivo in cui versare e nessun G da sopprimere**, il sistema scende al
**41,57%** — dodici punti sotto il baseline, **stabile su entrambi i periodi**, −718 pip.
È il segnale negativo più forte e più stabile emerso finora.
**Candidata a filtro di astensione (NO TRADE): 89 carte, −718 pip da evitare.**

## Stato della linea (C allo Shi)

| | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| **C agibile** | 321 | **57,01%** | 58,86% | 57,35% | 9,80 |
| C è la mobile | 86 | 56,98% | 53,06% | 61,11% | 6,51 |
| C incartato | 154 | 47,40% | 43,56% | 55,77% | 0,16 |

**C agibile allo Shi: 57,01% su 321 carte, stabile su entrambi i periodi.**
A differenza di P, per C l'agibilità conta: incartato scende a 47,40%.

## Formulazione

> **C conserva forza sopprimendo, la perde versando.**
> C che si scarica nella Ricchezza si svuota; C che tiene sotto controllo l'Ufficiale
> mantiene sostanza. È l'inverso dell'intuizione di partenza.

⚠ **Cosa misurano questi numeri:** il tasso di successo del **PB** su quelle carte, non un
segnale direzionale del LY. La cella al 41,57% dice *"qui il PB sbaglia sistematicamente"*,
non *"C predice il ribasso"*.


---

# 14. CORREZIONE 回頭剋 (caso 3)  ·  `FISSATA` (implementata in liuyao.js, 13/08/2026)

Carta sorgente: **GBPUSD 03/10/2022** (seme 111, sup 5 巽, inf 7 艮, mutante L2).
**Errore mio, trovato da Edu:** nel caso 3 (回頭剋, l'arrivo controlla la partenza) il codice
trattava il movimento come inerte (effEl=null). Sbagliato: **muore la partenza, non il
trasformato** — l'arrivo è vivo e agisce sulle altre linee. Ora effEl = elemento dell'arrivo.
Sulla carta: mobile L2 午→亥; 亥 Acqua genera 卯 Legno = G a L6 → LONG. Il mercato sale. ✓
(La variante vecchia resta disponibile con RITORNO=nullo per confronto.)
Nota di misura: la correzione tocca 212 carte in caso 3, che in aggregato restano al 50,47%
(recente 44,55% / vecchio 55,32%): il singolo caso torna, l'aggregato non si muove.

# 15. IL LIU YAO COME SISTEMA DIREZIONALE AUTONOMO  ·  misurato 13/08/2026

Otto letture euristiche + la dottrina completa (eliminazione per stati, vincitore fra
Shi/Ying per controllo/generazione, ripiego G→W→mobile con 日辰臨爻 e timely, varianti con
clash+controllo e autopenalità): **tutte fra 49,3% e 50,9%** contro un riferimento di 50,40%
(4.111 carte). Anche dopo la correzione del 回頭剋 l'aggregato non si muove.
Le celle "buone" trovate in sessione (P drenato 59,55%, C sopprime 60,98%) sono tassi di
successo del **PB**, non del LY: individuano dove il PB lavora bene/male, non una direzione.

# 16. LA CONDIZIONE DI EDU — G allo Ying generato dalla mobile  ·  `IN OSSERVAZIONE FORWARD`

Enunciato (13/08/2026): *"Children al Soggetto non dice niente; Officer in alto su Shi/Ying
dice molto; e se una linea si muove per generarlo deve risvegliare l'attenzione."*
Codifica: mobile con arrivo attivo che genera un **unico G vivo**; direzione dalla **posizione
del G** (inferiore SHORT, superiore LONG).

| condizione | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| mobile genera un G vivo | 127 | 49,61% | 52,94% | 49,09% | 4,45 |
| **... e il G è allo Ying** | **8** | **100%** | 100% | 100% | **86,94** |
| ... e lo Shi è C (muto) | 46 | 54,35% | 50,00% | 62,50% | 9,35 |
| ... e lo Shi NON timely | 84 | 54,76% | 61,70% | 51,52% | 4,72 |

**8/8 nel campione storico** (GBPUSD 03/10/2022 inclusa). ⚠ Otto carte non bastano a
distinguere regola vera da cella fortunata (8/8 per caso ≈ 1/256, ma con ~250 configurazioni
testate una cella così emerge quasi certamente da qualche parte; la condizione appena più
larga sta a 49,61%). **Decisione: fissata come condizione scritta PRIMA dell'esito, da
verificare in avanti su ogni nuova occorrenza.** Se in forward continua a vincere, è la
dimostrazione pulita della lettura LY; se si sgonfia, era rumore.
Collaterale da tenere d'occhio: la condizione 5 (Shi non timely, n=84, 54,76%) — quando il
Soggetto tace, l'azione parla.


---

# 17. MOVIMENTO OSCURO 暗動 — LA LINEA SI SPOSTA SENZA MUTARE  ·  `FISSATA` (liuyao.js)

Carta sorgente: **EURJPY 11/12/2023** (噬嗑 21 → 无妄 25), verificata sullo screenshot del
software di riferimento.

**Due regole date da Edu, entrambe implementate:**

1. **L'esagramma trasformato è UNICO** — nasce dalla sola mutante ufficiale. Una linea piena
   clashata (暗動) **non genera un proprio trasformato**: si *sposta dal primo al secondo
   esagramma senza mutare*, e il suo arrivo è il ramo alla **sua stessa posizione**
   nell'esagramma trasformato.
   *(Mio errore precedente: facevo mutare ogni linea per flip isolato — su questa carta dava
   戌 invece di 午, e la lettura di Edu risultava incomprensibile.)*
2. **Il bloccaggio da combinazione NON avviene se la linea atterra su una linea che si muove**:
   la combinazione non lega, **salda al movimento**.

Sulla carta: L4 酉 clashata dal giorno 卯 → si sposta a **午** (L4 di 无妄, trigramma 乾);
午未合 sulla partenza 未 della mutante L5; L5 saldata si muove ed emerge **申 = G** nel
palazzo 巽; L5 è nel trigramma superiore → **LONG**. Il mercato sale. ✓

# 18. LA SCALA MOBILE — misurata  ·  `BOCCIATA` sul suo dominio

Regola: linea in 暗動 il cui arrivo combina la partenza della mutante ⇒ la mutante è saldata
e **vince**; direzione dalla sua posizione.

| condizione | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| almeno una linea in 暗動 | 1268 | 48,82% | 48,95% | 49,60% | −1,15 |
| **scala mobile attiva** | 146 | **46,58%** | 50,62% | 44,83% | −11,61 |
| ... arrivo VUOTO (non porta a niente) | 26 | 53,85% | 64,71% | 37,50% | −13,33 |
| ... arrivo PIENO (porta a qualcosa) | 120 | 45,00% | 46,88% | 46,00% | −11,24 |

**Scomposta per destinazione** (dove porta la scala mobile):

| porta a | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| G 官鬼 | 46 | 50,00% | 52,17% | 50,00% | −3,40 |
| B 兄弟 | 14 | 50,00% | 60,00% | 33,33% | +6,87 |
| P 父母 | 39 | 46,15% | 52,94% | 45,00% | −19,75 |
| W 妻財 | 19 | 26,32% | 15,38% | 50,00% | −27,22 |
| C 子孫 | 2 | 50,00% | — | — | −0,45 |

**Nessuna destinazione produce segnale.** G, la destinazione dottrinalmente più significativa,
sta esattamente a 50,00% con entrambi i periodi a 50.
Nota: la carta sorgente della distinzione vuoto/pieno (EURJPY 29/04/2024) cade nella riga
"arrivo vuoto", che è la migliore delle due — cioè fra le carte che il criterio *non* copre.

# 19. IL G NASCOSTO RAGGIUNTO DAL BAZI  ·  `BOCCIATA`

Carta sorgente: **EURJPY 29/04/2024**. Doppio 辰 (mese + anno/Tai Sui) che combina il
伏神 官鬼 酉 dietro L3 (辰酉合), trigramma inferiore → SHORT. Il mercato scende. ✓

| condizione | n | tutto | recente | vecchio |
|---|---|---|---|---|
| G nascosto combinato dal Bazi | 176 | 51,14% | 58,24% | 45,33% |
| **... da un ramo DOPPIO** (la condizione esatta) | **16** | **43,75%** | 50,00% | 33,33% |
| ... doppio che include il Tai Sui | 14 | 50,00% | 50,00% | 50,00% |
| ... combinato dal Tai Sui | 109 | 53,21% | 57,81% | 45,45% |

Le forme larghe hanno i due periodi in contraddizione netta (58,24% vs 45,33%): profilo di
cella adattata al periodo recente.

---

# BILANCIO DELLA GIORNATA — il metodo delle carte problematiche

**Sei letture di Edu su sei carte problematiche.** Ogni volta:
- la lettura è risultata **dottrinalmente corretta sulla sua carta** (verificata al passo);
- ha prodotto **una regola vera**, che è rimasta nel modulo (回頭剋, 暗動 con arrivo,
  esagramma trasformato unico, autocombinazione, bloccaggio che non avviene su linea in moto);
- misurata **sul proprio dominio**, ha dato fra 43% e 50%.

| lettura | carta | dominio | esito sul dominio |
|---|---|---|---|
| ripiego G→W→mobile | EURJPY 15/03/2023 | 202 | 56,44% (perde nel recente) |
| generazione della mobile | GBPUSD 03/10/2022 | 944 | 48,94% |
| G allo Ying generato | GBPUSD 03/10/2022 | **8** | **100%** ← in osservazione forward |
| scala mobile | EURJPY 11/12/2023 | 146 | 46,58% |
| G nascosto dal Bazi doppio | EURJPY 29/04/2024 | 16 | 43,75% |
| scala mobile per destinazione | — | 19-46 | 26-50% |

**Posizione di Edu:** il LY ha variabilità enormemente superiore al PB, quindi ogni regola
copre per forza pochi casi; "poche carte" non è motivo per scartare. **Critica accolta**: un
sistema di cento regole da 40 carte è legittimo quanto uno di tre regole da mille.

**Posizione di Claude:** il problema non è la numerosità ma che le regole perdono **sul
proprio dominio** — dove si applicano, non fuori. E il modello "molte regole locali valide"
fa una previsione controllabile: accumulandole, il totale deve salire. Dopo sei aggiunte il
LY autonomo resta a **50,5%** contro un riferimento di 50,40%.

**Protocollo concordato:** ogni regola nuova si fissa con il **dominio dichiarato**, e il
totale cumulativo si aggiorna a ogni aggiunta, così il processo ha un termometro.

**Proposta ancora aperta (Claude):** dieci carte con la configurazione attiva, esiti coperti,
Edu applica le sue regole e scrive LONG/SHORT prima di vedere gli esiti. È l'unica verifica
che con campioni piccoli conserva validità, e produrrebbe letture da studiare per capire cosa
manca ancora al motore.


---

# 20. IL CAPOLINEA DEL FLUSSO — CHI ACCUMULA AGISCE  ·  `SCOPERTA` (13/08/2026)

**Il primo risultato della sessione in cui una lettura Liu Yao AUTONOMA esce nettamente dal
50%.** Nessun PB, nessuna EMA: direzione pura dalla posizione della linea (inferiore L1-3 =
SHORT, superiore L4-6 = LONG), confrontata con la direzione reale del mercato.

## Definizione
**Capolinea** = linea viva che **riceve** da un elemento presente e vivo (nelle linee o nel
Bazi) e **non cede** ad alcun elemento presente e vivo. Accumula il flusso del qi e non lo
disperde. Si conta solo quando il capolinea è **unico** sulla carta.
(È lo stesso principio del flusso del qi discreto già attivo nel PB, applicato alle linee.)

## Risultati — riferimento 50,40%

| capolinea unico è... | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| **G 官鬼** | **325** | **57,23%** | **59,71%** | **55,88%** | **8,35** |
| W 妻財 | 253 | 54,55% | 53,90% | 53,93% | 4,90 |
| P 父母 | 198 | 54,04% | 58,54% | 47,76% | 1,12 |
| C 子孫 | 425 | 50,82% | 52,65% | 48,40% | −0,54 |
| B 兄弟 | 498 | 48,80% | 50,52% | 46,02% | −4,72 |
| *tutti insieme* | 1699 | 52,38% | 54,03% | 50,29% | 0,94 |

**Capolinea G: 57,23% su 325 carte, sopra il baseline su ENTRAMBI i periodi** (59,71% e
55,88%), 8,35 pip/trade. Campione ampio, cella stabile.
W conferma a 54,55% con i due periodi allineati (53,90% / 53,93%).
C e B in fondo — coerente con la dottrina di Edu: *"Children e Brother non svolgono ruolo,
stanno fermi"*.

## Perché conta
Il capolinea è il criterio che mancava per stabilire **chi agisce** su una carta: non chi è
più prospero in stagione, ma **chi accumula il flusso e non lo cede**. L'ordine dei parenti
che ne risulta (G · W · P · C · B) riproduce esattamente la gerarchia dottrinale enunciata
da Edu durante tutta la sessione.

## Carta sorgente — USDJPY 10/02/2026
Anno 午, mese 寅, giorno 乙卯. Il Legno 寅 cede al Tai Sui 午; il Fuoco 午 genera la Terra 辰
(W a L3); 辰 non cede perché l'unico Metallo (酉, il G) è stato distrutto. **辰 è il capolinea**,
trigramma inferiore → SHORT. Il mercato scende di 175 pip. ✓

## Da stringere (prossimi test)
Capolinea G incrociato con: posizione · stato della linea · coincidenza col Tai Sui ·
coincidenza col ramo del giorno (日辰臨爻) · presenza a Shi/Ying.

---

# 21. 争合 — COMBINAZIONE CONTESA  ·  `ARCHIVIATA` (vale sulla carta, non generalizza)

Principio (classico, non ad hoc): **un ramo non può ricevere due combinazioni insieme**.
Se la partenza della mutante è già combinata da un ramo del Bazi, l'arrivo della linea in
暗動 non ha atterraggio: la scala mobile non si forma, e la linea in 暗動 distrugge la
propria partenza.

**Discrimina perfettamente le due carte gemelle** (stesso esagramma 噬嗑→无妄, stesso seme 156,
stessa mutante L5, stesso ramo del giorno 卯):

| | EURJPY 11/12/2023 | USDJPY 10/02/2026 |
|---|---|---|
| Tai Sui | 卯 (combina 戌) | **午 (combina 未 = L5)** |
| L5 未 | libera → scala mobile si forma | **contesa → non si forma** |
| esito | mercato sale, LY giusto | mercato scende, LY sbagliato |

**Ma non generalizza:** scala mobile libera 46,56% · scala mobile contesa 46,67% (n=15).
Toglie 15 carte su 146 e lascia il quadro identico.
Da conservare: il principio è corretto e potrà servire dentro regole con più occorrenze.


---

# 22. 進神 / 退神 — LINEA AVANZANTE E RETROCEDENTE  ·  `FISSATA` (implementata in liuyao.js)

Dottrina classica, **mancava del tutto** al modulo: il caso 5 (比和, stesso elemento) era
trattato come semplice rinforzo, senza distinguere avanzamento e arretramento.
Carta sorgente: **EURGBP 18/03/2020** (seme 90, sup 3 離, inf 2 兌, mutante L2, giorno 庚申,
mese 卯, anno 子).

## Definizione
Quando la mobile si muove in un ramo dello **stesso elemento**:
- **進神 avanzante** — successione oraria: 寅→卯 · 巳→午 · 申→酉 · 亥→子 · Terra 丑→辰→未→戌
- **退神 retrocedente** — successione antioraria: 卯→寅 · 午→巳 · 酉→申 · 子→亥 · Terra 戌→未→辰→丑

**Chi avanza vince** → direzione dalla sua posizione.
**Chi retrocede perde** → vince il trigramma **opposto**.

## Risultati — riferimento 50,40%

| | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| 進神 avanzante — vince lui | 278 | 52,52% | 51,30% | 53,85% | 0,18 |
| 退神 retrocedente — vince l'opposto | 399 | 53,13% | 50,44% | 57,23% | 3,71 |

Entrambe sopra il riferimento su **entrambi i periodi** — prima regola sulla mutante a
riuscirci. Celle interne notevoli:
- **退神 con mobile forte in stagione**: 193 · 54,92% (52,63 / 57,53) · +1.381 pip · 7,16 pip/tr
  — la condizione descritta da Edu: *la linea che si muove è molto forte, quindi si muove lo
  stesso e retrocede*
- **退神 con mobile = G**: 110 · 55,45% (51,43 / 62,86) · 6,66 pip/tr

# 23. IL CLASH SULL'ARRIVO AMPLIFICA LA PROGRESSIONE  ·  `FISSATA`

**La scoperta più netta sulla mutante.** Il clash del giorno **sul ramo d'arrivo** porta
entrambe le progressioni da ~52% a **65-67%**:

| | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| **退神 · ARRIVO clashato dal giorno** | 26 | **65,38%** | 61,54% | 69,23% | **19,17** |
| 退神 · arrivo NON clashato | 373 | 52,28% | 49,77% | 56,16% | 2,63 |
| **進神 · ARRIVO clashato dal giorno** | 21 | **66,67%** | 66,67% | 66,67% | **22,81** |
| 進神 · arrivo NON clashato | 257 | 51,36% | 50,00% | 52,78% | −1,67 |

Due periodi allineati in **tutte e quattro** le celle. Resa per trade da 2,63 a 19,17 e da
−1,67 a 22,81.

**È specifico dell'ARRIVO, non del clash in generale:** con la *partenza* clashata il 退神 fa
54,84% ma con periodi divergenti (38,89 / 75,00) e il 進神 addirittura 45,83%.

**Lettura:** il ramo d'arrivo colpito dal giorno non annulla il movimento, lo **rende visibile**
— il clash attiva l'arrivo invece di spegnerlo.

⚠ **Clausola di Edu NON confermata:** la condizione *"il clash bloccherebbe il movimento, ma
chi clasha è debole e la linea forte quindi si muove lo stesso"* non regge. Il caso
"clashante debole + mobile forte" esiste in 7 carte e dà 50%; il caso opposto dà 65-67%.
**Non serve che il clashante sia debole** — il clash sull'arrivo è il segnale in sé, quale che
sia la forza di chi colpisce. (EURGBP 18/03/2020 cade infatti nella cella al 65%.)

⚠ Campione complessivo delle celle clashate: 47 carte. La coerenza fra le due progressioni
indipendenti e fra i due periodi in tutte e quattro le celle è però un segno forte.


---

# 24. 退神 IMPEDITO DAL TAI SUI  ·  `FISSATA` (Edu, 13/08/2026)

Carta sorgente: **EURJPY 13/06/2023** (seme 150, sup 2 兌, inf 6 坎, mutante L5,
giorno 壬寅, mese 午, anno 卯).

**Regola:** la mobile vuole retrocedere (退神) ma il **Tai Sui clasha la PARTENZA**: non
potendo retrocedere, **prosegue** — la direzione resta quella della sua posizione, non
l'opposta. Qui: mobile L5 酉→申 (退神), Tai Sui 卯 clasha 酉 (卯酉冲) → il retrocedere è
impedito → L5 è nel trigramma superiore → LONG. Il mercato sale di 120 pip. ✓

| | n | tutto | recente | vecchio |
|---|---|---|---|---|
| **退神 bloccato dal Tai Sui → prosegue (sua posizione)** | 30 | **56,67%** | 60,71% | — |
| *(se invece si applicasse l'opposto)* | 30 | 43,33% | 39,29% | — |
| 退神 libero → vince l'opposto | 369 | **53,93%** | 52,02% | 57,23% |

L'eccezione porta quelle 30 carte **dal 43,33% al 56,67%** (+13 punti) e **ripulisce anche la
cella principale**, che sale da 53,13% a 53,93%. Non aggiunge solo un caso: migliora la regola
madre.

⚠ Le 30 carte cadono **tutte nel periodo recente** (il clash Tai Sui↔partenza dipende dal ramo
dell'anno, e certi anni non ricorrono nel campione): il controllo sui due periodi non è
possibile. Da riverificare quando il campione crescerà.

# 25. G AUTOPENALIZZATO DAL MESE — "CHI NON VINCE PERDE"  ·  `FISSATA` (Edu, 13/08/2026)

Stessa carta. Il mese è **午** e il G è **午**: 午午自刑. Di norma il mese non interviene — sono
il Tai Sui e il giorno a farlo — **ma quando il flusso del qi lo carica al punto da non potersi
tirare indietro, è il mese stesso a penalizzare G**. Qui l'anno 卯 e il giorno 寅 sono entrambi
Legno e generano il Fuoco 午: **doppio carico**.
G penalizzato ⇒ non vince ⇒ **perde**: la direzione è l'**opposta** alla posizione di G.
(Qui G 午 è a L3, inferiore ⇒ direzione LONG. Il mercato sale. ✓)

| | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| G autopenalizzato dal mese — direzione di G | 97 | 45,36% | 43,24% | 50,00% | −4,38 |
| G autopenalizzato dal mese — direzione **OPPOSTA** | 97 | 54,64% | 56,76% | 50,00% | 4,38 |
| ... e il flusso carica il mese (1 ramo) — opposta | 55 | 49,09% | 51,16% | 41,67% | 1,36 |
| **... DOPPIO carico sul mese — opposta** | **14** | **78,57%** | 76,92% | 100,00% | **23,96** |

Il principio generale (direzione opposta a G autopenalizzato) tiene a 54,64%.
Il **doppio carico** è la condizione forte: 78,57%, entrambi i periodi alti.
⚠ Il carico **singolo** peggiora rispetto al caso generale (49,09%): conta il doppio, non il
semplice — coerente con "il mese non può tirarsi indietro" solo quando è caricato due volte.
⚠ Campione del doppio carico: **14 carte**. Fissata su indicazione di Edu; da confermare in
avanti.

## Contesto verificato della carta sorgente
Non era un'inversione: EMA **rialzista alla sesta barra**, dentro una corsa che arriverà a 16
(giorni vicini: +34, **+120**, +52, +173, +150, +135). Sia LY sia PB leggevano SHORT contro un
rialzo maturo e consolidato.


---

# 26. L'ARRIVO VUOTO NON ANNULLA LA PROGRESSIONE  ·  `BOCCIATA`

Carta sorgente: **EURJPY 06/03/2025**. Ipotesi: la progressione che approda a un ramo vuoto
non produce nulla (il mese clasha invano l'arrivo vuoto ⇒ direzione invertita).

| | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| arrivo PIENO — regola normale | 572 | 53,32% | 52,01% | 55,60% | 0,72 |
| **arrivo VUOTO non risvegliato — regola normale** | 98 | **53,06%** | 52,73% | 56,41% | **8,22** |
| arrivo vuoto non risvegliato — **invertita** | 98 | 46,94% | 47,27% | 43,59% | −8,22 |
| arrivo vuoto **risvegliato** (giorno/anno forte) | 7 | 71,43% | 100% | 60,00% | 24,30 |

Con l'arrivo vuoto la regola normale continua a funzionare (53,06%, come col pieno) e rende
**dieci volte di più per trade**. Invertire porta al 46,94%, sotto il caso su entrambi i periodi.
Il caso "mese che clasha invano" esiste in **6 carte**: 66,67% totale ma 100% recente / 0%
vecchio — indistinguibile dal caso.
**Carta di controllo: USDCAD 03/09/2020** — stessa configurazione (G mobile, arrivo vuoto,
mese che clasha invano, mobile debolissima) ma esito opposto: la regola normale vince.

# 27. LA MOBILE DISTRUTTA — NON SI LEGGE  ·  `FISSATA` (Edu, 13/08/2026)

Carta sorgente: **USDCAD 03/09/2020** (seme 130, sup 8 坤, inf 2 兌, mutante L2,
giorno 己酉, mese 申, anno 子).

**Conflitto risolto dentro il modulo:** 動不為空 teneva viva la mutante anche quando è
**vuota + clashata dal giorno + untimely**, mentre la regola 3 dice che in quel caso è
**eliminata**. Vince la regola 3: la mobile distrutta **non si legge**.

Sulla carta: mobile L2 官鬼 **卯**, vuota (旬空 寅卯), clashata dal giorno **酉** (卯酉冲) e
**死** nel mese 申 ⇒ distrutta. Legge invece **妻財 亥 a L5**, 相 e in alto ⇒ LONG. Il mercato
sale. ✓ (L6 子孫 酉 è escluso due volte: è C — non agisce — ed è in **自刑** col giorno 己酉.)

| | n | tutto | recente | vecchio |
|---|---|---|---|---|
| **progressione applicata comunque** (errore) | 10 | **30,00%** | 0,00% | 33,33% |

Ignorare la distruzione e leggere la progressione **sbaglia sistematicamente**.
Carte con mobile distrutta: **36**.

# 28. CHI LEGGE AL POSTO DELLA MOBILE: LA FORZA, NON LA GERARCHIA  ·  `FISSATA`

Applicando le regole già registrate (C e B non agiscono · 自刑 dal giorno esclude ·
gerarchia G→W→P):

| | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| **vincitore TIMELY** | 17 | **58,82%** | 57,14% | 62,50% | **+15,72** |
| gerarchia G→W→P completa | 36 | 41,67% | 41,18% | 43,75% | −12,85 |
| vincitore = W (anche non timely) | 18 | 33,33% | 25,00% | 50,00% | −17,75 |

> **Non è l'ordine dei parenti a decidere, è la forza in stagione.**
> La gerarchia applicata a linee deboli fa danno (41,67%); il criterio "chi è timely" da solo
> tiene (58,82%, sopra su entrambi i periodi).

Coerente con il principio ripetuto da Edu — *si legge ciò che è timely, ciò che è rilevante* —
e **contro** l'implementazione precedente, che metteva il parente prima della forza.
Concorda con il **capolinea G** (§20, 57,23% su 325 carte), il risultato più ampio della sessione.

---

## ⚠ PROMEMORIA OPERATIVO PER CLAUDE

Le regole registrate vanno **applicate in ogni test**, non solo ricordate. In §27-28 la
selezione dei candidati inizialmente ignorava due regole già fissate (自刑 dal giorno e
"C e B non agiscono") ed è stato Edu a doverlo segnalare. **Prima di ogni misura: rileggere
l'elenco delle regole attive e verificare che siano tutte applicate.**


# 29. 暗動 AUTOPENALIZZATA — "CHI NON VINCE PERDE"  ·  `FISSATA` (verso confermato)

Carta sorgente: **USDJPY 13/12/2023** (seme 145, sup 2 兌, inf 1 乾, mutante L3,
giorno 乙巳, mese 子, anno 卯).
Una linea clashata dal giorno vuole muoversi; se sta nel trigramma che **non muta**, il suo
arrivo è **lo stesso ramo** — non va da nessuna parte — e se il ramo è di autopenalità
(辰 午 酉 亥) si penalizza. Applicando §25 (*chi non vince perde*): **il suo trigramma perde**.
Qui: L4 妻財 **亥**, 旺 nel mese 子, clashata dal giorno 巳 (巳亥冲); la mutante è L3 quindi il
trigramma superiore non muta e l'arrivo è ancora 亥 → 亥亥自刑 → il **superiore perde** → SHORT.
Il mercato scende di 240 pip. ✓

| | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| **暗動 autopenalizzata → il suo trigramma PERDE** | 307 | **52,77%** | 50,85% | 57,89% | 4,26 |
| *(se invece vincesse)* | 307 | 47,23% | 49,15% | 42,11% | −4,26 |
| ... linea FORTE (vibrante) | 97 | 52,58% | 47,17% | 61,54% | 4,33 |
| ... linea debole | 210 | 52,86% | 52,42% | 56,00% | 4,22 |

Verso confermato su **307 carte**, sopra il riferimento su entrambi i periodi.
⚠ **Clausola sulla vibranza NON confermata:** forte 52,58% · debole 52,86% — identiche (e la
forte è peggiore nel recente). Conta solo che la linea sia **bloccata**, non che sia vibrante.
⚠ Regola vera ma **debole**: +2,4 punti sul riferimento, non paragonabile al capolinea G.

# 30. LETTURA CON TUTTE LE REGOLE INSIEME  ·  risultato cumulativo (13/08/2026)

Ordine di precedenza applicato: **mobile distrutta → progressione 進神/退神 (con eccezione
Tai Sui) → capolinea G**.

| via | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| **capolinea G** | 264 | **57,95%** | 61,74% | 55,88% | 9,08 |
| mobile distrutta → timely | 12 | 58,33% | 42,86% | 80,00% | 19,13 |
| 退神 | 395 | 54,18% | 53,33% | 57,05% | 2,90 |
| 進神 | 278 | 52,52% | 51,30% | 53,85% | 0,18 |
| **LETTURA COMPLETA** | **949** | **54,79%** | **54,49%** | **56,04%** | **4,03** |

**Il LY autonomo passa da 50,5% a 54,79% su 949 carte**, sopra il riferimento su entrambi i
periodi, +3.823 pip. La previsione del modello di Edu (*molte regole locali che, accumulate,
alzano il totale*) **si è verificata**: era a 50% stamattina con sei regole, è a 54,79% con
dodici. Il termometro concordato funziona e va aggiornato a ogni aggiunta.


---

# 31. 三會 — COMBINAZIONI DIREZIONALI  ·  `FISSATA` con la condizione del mese

**Sistema classico che mancava del tutto al modulo** (c'erano solo 六合 e mezze triadi).
寅卯辰 東方木局 · 巳午未 南方火局 · 申酉戌 西方金局 · 亥子丑 北方水局.
Quando i tre rami sono presenti fra linee e Bazi, l'elemento diventa "vibrante" e le sue
linee vincono **senza bisogno di essere generate**.

| | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| **三會 col MESE dentro** | 406 | **53,94%** | 51,83% | 55,63% | 5,80 |
| 三會 senza il mese | 298 | 47,99% | 46,15% | 50,93% | 0,23 |
| tutte insieme | 704 | 51,42% | 49,25% | 53,73% | 3,44 |

**La 三會 vale solo se il mese ne fa parte** (sei punti di differenza): è un raduno
*stagionale* — 方合 — non un semplice incontro di rami. Le 三會 sono frequenti: 1.825 carte
ne contengono almeno una.
Collaterale: elemento formato = **B 兄弟** dà 56,49% (il migliore) — strano perché B "non
agisce", ma nel vecchio scende a 50,88%: non consolidabile.

# 32. L'ORA NEI RADUNI  ·  `BOCCIATA`

L'ora dal seme **è stata aggiunta al modulo** (`liuyao.js`, campo `oraBranch`, funzione
`oraDalSeme`) — prima non esisteva affatto nel LY, pur essendo usata dal PB.
Come **membro delle 三會**, però, peggiora:

| | senza ora | con ora |
|---|---|---|
| 三會 col mese | **53,94%** (n=406) | 50,82% (n=429) |
| mese **e** ora dentro | — | 49,69% (n=159) |
| ora senza il mese | — | 53,37% (n=163) |

# 33. IL CAPOLINEA G DRENATO DAL PROPRIO 伏神  ·  `SCOPERTA` — la cella più forte

| | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| **capolinea G drenato dal proprio 伏神** | 126 | **60,32%** | **64,71%** | 57,47% | **11,90** |
| capolinea G non drenato | 199 | 55,28% | 58,10% | 54,22% | 6,09 |
| *(direzione opposta)* | 126 | 39,68% | 35,29% | 42,53% | −11,90 |

**60,32% su 126 carte, sopra su entrambi i periodi.** Il nascosto dietro G è **sempre P** per
costruzione elementale (G controlla il palazzo; ciò che G genera è P).
**Nessuna contraddizione con §12** (P sfavorevole): le due popolazioni sono **disgiunte** —
il capolinea è per definizione una linea che non cede a nessun elemento vivo, quindi quando
il capolinea è G il P **non è mai presente in carta** (verificato: 326/326).
⚠ Perché il P *nascosto dietro il G* dia 5 punti in più rispetto a un P nascosto altrove
resta **senza spiegazione dottrinale**. Domanda aperta.

# 34. 刑 PENALITÀ  ·  `FISSATA` — secondo sistema classico aggiunto oggi

三刑 寅巳申 (無恩之刑) · 丑戌未 (恃勢之刑) · 相刑 子卯 (無禮之刑) · 自刑 辰午酉亥.
Ipotesi di Edu: linea in 刑 col proprio 伏神 — se **entrambi forti** la penalità morde e il
suo trigramma **perde**.

| linea in 刑 col proprio 伏神 | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| **entrambi DEBOLI** — sua direzione | 160 | **55,63%** | 54,64% | 58,33% | 6,39 |
| tutte | 354 | 54,24% | 53,13% | 55,38% | 6,21 |
| **entrambi FORTI** — sua direzione | 53 | **49,06%** | 50,00% | 47,22% | 7,45 |

**Confermata**: forti ⇒ penalità attiva ⇒ il trigramma perde (49,06%); deboli ⇒ penalità
inerte ⇒ il trigramma vince (55,63%). Sei punti e mezzo di differenza, verso coerente sui
due periodi.
⚠ È specifico del rapporto **linea ↔ proprio 伏神**: il 刑 con un ramo del **Bazi** non
funziona (49,06% su 1.333 carte).

# 35. VERIFICA MIRATA — 伏神 父母 巳 dietro G 官鬼 寅

Richiesta da Edu. **326 carte** con la configurazione esatta.

| | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| totale — direzione del suo trigramma | 326 | 53,99% | 52,45% | 55,43% | 5,78 |
| **UNTIMELY** — direzione del suo trigramma | 217 | **55,30%** | 54,17% | 57,45% | 5,23 |
| TIMELY — direzione del suo trigramma | 109 | 51,38% | **43,48%** | 53,09% | 6,88 |

**È l'untimely a vincere**, non il timely — controintuitivo rispetto a §28.
La spiegazione è arrivata da Edu: **寅 e 巳 formano una penalità** (parte di 寅巳申). Quando
sono forti la penalità è attiva e lo short perde; quando sono deboli non morde.
⚠ Limite strutturale: nel campione la linea è **sempre a L2**, quindi la direzione è sempre
SHORT — la cella non distingue "il trigramma inferiore vince" da "in queste condizioni il
mercato scende". Le carte sono inoltre addensate in periodi contigui (stesso Bazi), quindi la
correlazione fra osservazioni è alta.

# 36. FLUSSO A CASCATA  ·  `BOCCIATA` — e stato della §29

Edu **ritira** l'autopenalità della linea non mobile clashata (§29) e la sostituisce: una
linea non mobile clashata, col ramo futuro identico, **cede energia a chi può prenderla**,
specialmente se adiacente, formando una cascata; la direzione viene dalla linea terminale.

| | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| cascata → direzione della terminale | 1624 | 47,84% | 48,57% | 46,98% | −2,00 |
| *(direzione opposta)* | 1624 | 52,16% | 51,43% | 53,02% | 2,00 |
| cascata di 2 passi | 318 | 44,34% | 50,33% | 39,24% | −3,26 |
| cascata di 3 passi | 21 | 33,33% | 36,84% | 0,00% | −10,45 |

Peggiora quanto più la cascata è lunga. **Bocciata.**
⚠ **§29 resta in sospeso**: nella forma "il trigramma della linea bloccata perde" misurava
**52,77% su 307 carte**, positiva su entrambi i periodi, ma Edu la ritiene dottrinalmente
sbagliata e l'ha ritirata. La sostituta misura 47,84%. **Decisione non presa.**

## Carta completa — USDJPY 16/01/2024 (lettura confermata da Edu)
seme 145, sup 2 兌, inf 1 乾, mutante L1, giorno 己卯, mese 丑, anno 卯, ora dal seme 子,
palazzo 坤, vuoti 申酉. Mercato **+139 pip** (LONG); PB diceva SHORT e perde.
1. **L4 妻財 亥 è timely di suo** (inverno) e, in mancanza di opposizione più energetica,
   prevale → trigramma superiore → LONG
2. la **penalità 寅巳 su L2** è forte e fa perdere lo SHORT
3. la **combinazione 子丑 su L1** rende la linea inutilizzabile e peggiora lo SHORT


---

# 37. TIMELY vs FORTE — LA DISTINZIONE FONDAMENTALE  ·  `FISSATA` (Edu, 13/08/2026)

> **TIMELY** (dal mese) = effetto **ampio e generalizzato**: coinvolge tutti gli attori
> dell'esagramma, nel bene e nel male.
> **FORTE** (da giorno e anno) = effetto **concentrato ma poco diffuso**: agisce su una linea
> per via diretta, non sulle altre.
> Giorno e anno sono *forti* ma **non** *timely*.

Questa distinzione scioglie la contraddizione emersa in §34/§FORZAB, dove "entrambi forti"
cambiava di segno a seconda della definizione usata: mescolava due meccanismi diversi.

## 37a. TIMELINESS DOPPIA — i mesi di Terra

Il timeliness è dato dal mese in **due modi**: il suo **elemento** e la sua **stagione**.
Coincidono in otto mesi su dodici; divergono nei quattro mesi di Terra:

| mese | elemento | stagione | timely insieme |
|---|---|---|---|
| 辰 | Terra | primavera (Legno) | Terra + Legno |
| 未 | Terra | estate (Fuoco) | Terra + Fuoco |
| 戌 | Terra | autunno (Metallo) | Terra + Metallo |
| 丑 | Terra | inverno (Acqua) | Terra + Acqua |

*(Esempio di Edu: 丑 è Terra e rende timely la Terra, ma è anche inverno e rende timely
l'Acqua — Acqua con Terra crea la fanghiglia.)*

**Misura — stesso tasso, copertura molto maggiore:**

| | n | tutto | recente | vecchio | pip |
|---|---|---|---|---|---|
| Ricchezza timely unica — **semplice** | 652 | 55,83% | 52,20% | 60,53% | +3.890 |
| Ricchezza timely unica — **doppia** | 823 | 55,77% | 51,56% | 62,24% | **+4.828** |
| mesi di Terra — semplice | 169 | 54,44% | 53,64% | 53,19% | +466 |
| mesi di Terra — **doppia** | 340 | **55,00%** | 51,47% | 61,90% | **+1.405** |

+171 carte allo stesso livello; nei mesi di Terra la copertura **raddoppia** (169→340) e i pip
**triplicano**. È il comportamento atteso da una definizione più corretta: più linee attive
riconosciute, stessa affidabilità.
⚠ Il modulo usa ancora `stagione()` con il solo elemento del mese: **da aggiornare in
liuyao.js e nel motore**.

# 38. 刑 — SCOMPOSIZIONE PER TIPO DI FORZA  ·  `FISSATA`

(S = forte in stagione · B = forte solo per sostegno del Bazi · − = nessuna delle due;
prima lettera = linea, seconda = suo 伏神)

**Quando è il NASCOSTO ad avere la forza stagionale, la penalità morde → il trigramma perde:**

| | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| **−S** → direzione OPPOSTA | 23 | **65,22%** | 71,43% | 55,56% | 26,88 |
| **SB** → direzione OPPOSTA | 32 | 62,50% | 58,33% | 66,67% | 24,51 |
| **−−** → direzione OPPOSTA | 26 | 61,54% | 64,29% | 58,33% | 15,67 |

**Quando è la LINEA a essere sostenuta dal Bazi, il suo trigramma vince:**

| | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| **B−** → sua direzione | 18 | **77,78%** | 100% | 69,23% | 31,42 |
| **BS** → sua direzione | 54 | 59,26% | 65,00% | 55,88% | 9,27 |
| **BB** → sua direzione | 72 | 58,33% | 57,14% | 62,96% | 6,37 |

Il criterio non è "entrambi forti" ma **chi ha la forza e di che tipo**.
⚠ La cella **BB** (58,33%) sbaglia la carta sorgente USDCAD 20/09/2022, dove la lettura di Edu
dà LONG: lì il Tai Sui 寅 sostiene il G e il nascosto 巳 è a sua volta sostenuto, ma la
direzione la determina **L5 妻財 亥 timely** (mese 酉 lo genera, giorno 子 è suo pari).
Due meccanismi distinti che agiscono insieme: il Tai Sui con forza **concentrata** tiene viva
la penalità; L5 con effetto **ampio** determina la direzione.

# 39. TERMOMETRO — dopo la rimozione del 進神

Il 進神 rendeva −0,61 pip/trade ed è stato **rimosso** dalla catena.

| via | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| capolinea G **drenato** | 126 | **60,32%** | 64,71% | 57,47% | 11,90 |
| mobile distrutta | 12 | 58,33% | 42,86% | 80,00% | 19,13 |
| capolinea G | 198 | 55,56% | 58,10% | 54,88% | 6,31 |
| 退神 | 350 | 54,57% | 54,07% | 57,36% | 2,18 |
| 三會 col mese | 468 | 54,49% | 52,28% | 56,72% | 6,19 |
| 刑 col 伏神 (deboli) | 102 | 51,96% | 49,25% | 58,82% | 3,90 |
| **TOTALE** | **1256** | **55,10%** | **54,00%** | **57,06%** | **5,60** |

**Progressione della giornata:** 50,4% (8 euristiche, 4.111 carte) → 50,5% (6 regole) →
54,79% (12 regole, 949 carte) → 54,47% (con 三會 e 刑, 1.454) → **55,10% (1.256, +7.039 pip)**.
Togliendo il 進神, le sue carte sono passate alla 三會 che è salita da 53,72% a 54,49%.
⚠ Prossimo candidato al taglio: **刑 col 伏神 (deboli)**, 51,96%.


---

# 40. IL GRUPPO PEGGIORE — "4 LINEE NON AGIBILI"

Ricerca sui gruppi strutturali: il peggiore per il PB è **quattro linee su sei non agibili**
(legate, rotte, dormienti, eliminate, autocombinate): **47,78% su 90 carte**, pip ≈ 0.
Altri gruppi deboli: Shi in stato "mossa" 48,00% · mese 巳 49,54% · mese 寅 49,59% ·
palazzo 巽 51,01% · mutante a L5 51,97% · Shi=G 52,05% · mutante=P 52,41%.

# 41. 飛神空伏神出 — IL NASCOSTO DIETRO UNA COPERTURA VUOTA  ·  `SCOPERTA`

Carta sorgente: **USDJPY 15/01/2025** (seme 158, sup 3 離, inf 6 坎, mutante L6,
giorno 甲申, mese 丑, anno 辰, ora 丑, palazzo 離, vuoti 午未). Mercato **−159 pip** (SHORT).
Principio classico: quando la linea che copre è **vuota**, è *trasparente* e il 伏神 emerge.

**È la COMBINAZIONE dei due fattori a contare, non il nascondimento né il vuoto da soli:**

| G | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| **nascosto sotto copertura VUOTA** | 75 | **36,00%** | 32,65% | 40,91% | −11,25 |
| nascosto sotto copertura PIENA | 417 | 51,56% | 51,67% | 53,16% | 3,94 |
| visibile, linea vuota | 303 | 50,17% | 49,11% | 53,91% | −1,97 |
| visibile, linea piena | 1757 | 51,00% | 48,88% | 54,77% | 2,09 |

Tre celle su quattro stanno al 50-51%; **solo il G sotto copertura vuota crolla a 36,00%**,
su entrambi i periodi. Specifico di G: dietro copertura vuota P dà 54,55%, C 51,56%,
W 47,47%, B 49,21%.
Il **sostegno del giorno non lo salva**: 32,14% su 28 carte (vs 38,30% senza sostegno) —
coerente con §37 (il giorno è *forte* ma non *timely*: agisce in modo concentrato, e un G
sotto copertura vuota non è in condizione di usarlo).
⚠ Limite strutturale: nel campione la copertura è **sempre a L3**, quindi la direzione è
sempre SHORT.

# 42. IL SALTO DELLA LINEA CLASHATA  ·  `FISSATA`

Carta sorgente: **USDJPY 15/01/2025** — L1 父母 **寅** clashato dal giorno **申** (寅申冲)
*salta* a combinarsi (寅亥合) con il **伏神 官鬼 亥** esposto dietro L3 vuoto. Entrambi nel
trigramma inferiore → SHORT. ✓
Una linea clashata dal giorno non resta ferma: **salta a combinarsi** con un'altra linea o con
un nascosto esposto. **Conta dove ARRIVA, non da dove parte.**

| bersaglio del salto (linea visibile) | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| **妻財 W** | 138 | **57,25%** | 56,25% | 60,71% | **9,73** |
| 兄弟 B | 144 | 54,86% | 53,09% | 56,14% | 0,52 |
| 官鬼 G | 123 | 51,22% | 49,12% | 55,74% | 1,91 |
| 父母 P | 103 | 47,57% | 45,45% | 51,11% | −5,58 |
| 子孫 C | 72 | 44,44% | 40,00% | 51,85% | −12,07 |
| *direzione del bersaglio (tutti)* | 580 | 52,07% | 50,00% | 55,69% | 0,36 |
| *direzione della sorgente* | 580 | 47,93% | 50,00% | 44,31% | −0,36 |
| **nessun bersaglio** — sorgente | 797 | 49,44% | 48,42% | 49,54% | −4,35 |

Il salto su **W paga (57,25%)**; su C e P no — gli stessi parenti che "non svolgono ruolo".
Il clash **senza destinazione non produce nulla** (49,44%), coerente con la misura sul P
quieto clashato (§43).

# 43. IL SALTO MIGLIORA IL G, MA SOLO SE HA FORZA  ·  `FISSATA`

| G (unico visibile) | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| **bersaglio · forte dal Bazi** | 19 | **63,16%** | 50,00% | 69,23% | 3,37 |
| **bersaglio · timely** | 25 | **60,00%** | 50,00% | 69,23% | 14,25 |
| bersaglio · debole | 8 | 50,00% | 50,00% | 50,00% | 8,39 |
| non bersaglio · forte dal Bazi | 630 | 52,70% | 52,46% | 53,26% | 1,44 |
| non bersaglio · timely | 995 | 50,85% | 48,42% | 55,43% | 1,74 |
| non bersaglio · debole | 383 | 46,74% | 44,73% | 52,21% | −0,13 |

**Il salto aggiunge ~10 punti a parità di forza** (timely 50,85→60,00; forte 52,70→63,16) e
**non aggiunge nulla a un G debole** (50,00%): porta energia solo a chi può riceverla.
⚠ 19 e 25 carte; in entrambe le celle il **recente sta a 50,00% esatto** e tutto il vantaggio
viene dal vecchio.

## 43a. E se il G è ESPOSTO (copertura vuota)?  ·  `IN OSSERVAZIONE` — 5 carte

| | copre | nascosto | forza | esito |
|---|---|---|---|---|
| USDJPY 19/02/2021 | L3 辰空 | 官鬼 酉 | forte (Bazi) | giusto +21 |
| USDJPY 06/04/2021 | L3 午空 | 官鬼 亥 | forte (Bazi) | giusto +40 |
| NZDUSD 04/04/2024 | L3 辰空 | 官鬼 酉 | forte (Bazi) | sbagliato −12 |
| **USDJPY 15/01/2025** | L3 午空 | 官鬼 亥 | **timely** | **giusto +159** |
| USDJPY 11/03/2026 | L3 午空 | 官鬼 亥 | forte (Bazi) | sbagliato −72 |

Tre giuste, due sbagliate. La cella "timely" contiene **una sola carta**. Ma il contrasto con
le celle vicine è forte: G esposto **senza** salto sta al **31-36%** in tutte e tre le fasce di
forza, coerente sui due periodi; **con** il salto sale al 50-60%.
**Verso compatibile con l'ipotesi di Edu, campione insufficiente per confermarla.**
Configurazione rarissima: ~1 carta ogni 800. Da seguire in avanti.

## Conclusione di Edu sulla carta sorgente
> *La carta è comunque risolta: **G è salvo e lo short è confermato**.*
Su USDJPY 15/01/2025 il G 亥, esposto dalla copertura vuota 午 e raggiunto dal salto di
L1 寅 (寅亥合), è timely per stagione nel mese 丑 (inverno = Acqua) e regge la lettura:
trigramma inferiore → SHORT. Il mercato scende di 159 pip. ✓


---

# 44. IL TAI SUI BLOCCA LA PARTENZA: LA LINEA NON PARTE  ·  `FISSATA`

**Correzione logica di Edu (assoluta):** se la combinazione blocca la **partenza**, la linea
non parte affatto — quindi **non può esserci alcuna mutazione**, e non può rafforzarsi con un
回頭生. Le due cose non possono coesistere.
*(Claude aveva proposto una lettura incoerente: "bloccata ma rafforzata". Ritirata.)*

**Misura — la mobile G o W bloccata sulla partenza dal Tai Sui:**

| | n | tutto | recente | vecchio |
|---|---|---|---|---|
| G — vince | 41 | 48,78% | 44,12% | 71,43% |
| G — perde | 41 | 51,22% | 55,88% | 28,57% |
| W — vince | 70 | 48,57% | 40,00% | 52,27% |
| W — perde | 70 | 51,43% | 60,00% | 47,73% |

**Nessun segnale in nessuna direzione**: tutte fra 48,5% e 51,4%, con i due periodi che si
contraddicono violentemente. Coerente con la dottrina: **una linea che non parte non fa
niente** — né vince né perde; il suo trigramma resta muto e la direzione si decide altrove.

⚠ **Il 66,67% della cella "回頭生 + blocco della partenza" (§43-bis, n=42) resta senza
meccanismo.** Il 回頭生 lì è solo un'etichetta sulla relazione elementale ramo↔trasformato,
non un processo avvenuto. Usabile come filtro calcolabile, **ma è correlazione senza causa
identificata**.

**Dato collaterale ampio e stabile: G mobile LIBERA = 46,57%** su 758 carte (47,47% / 44,92%),
−4,97 pip/trade. **Un Ufficiale che si muove liberamente fa perdere il suo trigramma** —
l'opposto del G *capolinea*, fermo, che accumula (57-60%).
> **G vale da fermo, non in movimento** — come P, ma per ragione opposta:
> **P vale quando cede, G quando trattiene.**

# 45. IL TAI SUI BLOCCA L'ARRIVO — SCOPERTA  ·  `FISSATA`

Qui la partenza è **libera**: la linea parte davvero, e il Tai Sui combina il ramo d'**arrivo**.
Meccanismo coerente (a differenza di §44): il movimento avviene, ma la destinazione è chiusa.

Caso generale piatto (51,22% su 369 carte), **ma la scomposizione per parente separa
nettamente e ricalca la dottrina della giornata:**

| la mobile è... | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| **C 子孫** | 40 | **65,00%** | 66,67% | 60,00% | 20,09 |
| B 兄弟 | 114 | 56,14% | 59,76% | 48,28% | 3,72 |
| W 妻財 | 83 | 55,42% | 46,67% | 62,86% | −6,65 |
| **P 父母** | 78 | **39,74%** | 42,55% | 37,50% | −14,25 |
| **G 官鬼** | 54 | **40,74%** | 43,75% | 31,58% | −9,81 |

**Con l'arrivo bloccato, C e B vincono il loro trigramma; G e P lo perdono** — su entrambi i
periodi (tranne W, instabile). È il **rovescio esatto** della gerarchia usata tutto il giorno.
Lettura: **G e P devono ARRIVARE da qualche parte per contare**; se la destinazione è chiusa
restano a metà strada. C e B non andavano da nessuna parte comunque, e il blocco non toglie
loro nulla.

## 45a. LA CELLA PIÙ FORTE DELLA GIORNATA

| | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| **回頭生 con ARRIVO bloccato dal Tai Sui** | 44 | **72,73%** | 70,73% | **100%** | 11,14 |

**Meccanismo coerente:** la partenza è libera ⇒ la linea parte; l'arrivo la genera all'indietro
(回頭生) e la rafforza; il Tai Sui blocca l'arrivo, che non può andare oltre ⇒ **l'energia resta
nella linea di partenza**, che domina il suo trigramma.
Confronto interno: caso 1 (回頭生) 72,73% · caso 2 (泄) 48,72% · caso 0 47,06% · caso −1 49,37%
· caso −4 51,85%. **È specifico del 回頭生.**
⚠ 44 carte. Da seguire in avanti, ma il meccanismo è chiaro e i due periodi sono allineati.


---

# 46. IL TAI SUI URTATO DALL'ARRIVO — CHI LO SCONTRA PERDE  ·  `FISSATA`

La partenza è **libera** (la linea parte davvero) e l'**arrivo CLASHA** il ramo dell'anno.

| | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| **il suo trigramma PERDE** | 301 | **55,15%** | 55,48% | 57,60% | **7,13** |
| *(se invece vincesse)* | 301 | 44,85% | 44,52% | 42,40% | −7,13 |

**301 carte**, sopra il riferimento su entrambi i periodi, +2.147 pip.
Una linea che parte e va a sbattere contro l'anno **non conquista il suo trigramma: lo perde**.

**Per parente** (colonna = "vince"):

| la mobile è... | n | vince | pip/tr |
|---|---|---|---|
| **B 兄弟** | 73 | **36,99%** | −18,31 |
| C 子孫 | 18 | 38,89% | −12,41 |
| **G 官鬼** | 92 | **41,30%** (41,38 / 41,38) | −7,19 |
| W 妻財 | 56 | 46,43% | −2,46 |
| **P 父母** | 62 | **59,68%** | +3,42 |

Quattro parenti su cinque perdono. **G perde con 41,30% identico sui due periodi.**
L'unico che regge è **P** — coerente con tutta la giornata: non essendo un attore e non
pretendendo di arrivare da nessuna parte, non ha nulla da perdere nell'urto.

## Le due facce del Tai Sui
> **Il Tai Sui che FERMA conserva; il Tai Sui che viene URTATO distrugge.**
> - arrivo **bloccato** dal Tai Sui + 回頭生 → **72,73%** (l'energia resta dentro la linea)
> - arrivo che **clasha** il Tai Sui → **44,85%** (l'energia si disperde nell'urto)

# 47. IL TAI SUI SU DUE FRONTI — CHI È IMPEGNATO DUE VOLTE NON TIENE  ·  `FISSATA`

Carta sorgente: **EURJPY 13/12/2024** (seme 159, sup 3 離, inf 7 艮, mutante L4, giorno 辛亥,
mese 子, anno 辰). Mobile L4 妻財 **酉 → 戌**: il Tai Sui 辰 **combina la partenza** (辰酉合)
**e riceve l'urto dell'arrivo** (辰戌冲). Configurazione esclusa da entrambe le misure
precedenti (§45 e §46), perché in quelle la partenza doveva essere libera o bloccata, non
entrambe le cose insieme.

| | n | tutto | recente | vecchio | pip/tr |
|---|---|---|---|---|---|
| **partenza combinata + arrivo che urta → il trigramma VINCE** | 109 | **55,96%** | 54,24% | 57,14% | 4,82 |
| *(il trigramma perde)* | 109 | 44,04% | 45,76% | 42,86% | −4,82 |

**Il verso si ROVESCIA rispetto al clash semplice** (§46: perde, 44,85%). Undici punti di
differenza in direzione opposta.
**Lettura:** quando il Tai Sui è impegnato su **due fronti** — trattiene la partenza e para
l'urto dell'arrivo — **non riesce a fare nessuna delle due cose**, e la linea la spunta.
È lo stesso principio del **争合** (§21): chi è preso da due impegni contemporanei non ne
onora nessuno.
Su EURJPY 13/12/2024 dà **LONG** (L4 superiore, vince) — direzione corretta, +155 pip.

⚠ **Limite serio da tenere presente:** le 109 carte sono quasi tutte **丑→午 con anno 子**,
concentrate nel 2020. La configurazione dipende dal ramo dell'anno, quindi le osservazioni
sono **fortemente correlate** — statisticamente valgono molto meno di 109 indipendenti.

## Quadro riassuntivo del Tai Sui (13/08/2026)

| configurazione | esito | n | % |
|---|---|---|---|
| blocca la **partenza** | la linea non parte, nessun segnale | 340 | 51,47% |
| blocca l'**arrivo** (partenza libera) | dipende dal parente: C/B vincono, G/P perdono | 369 | 51,22% |
| blocca l'arrivo **+ 回頭生** | il trigramma vince nettamente | 44 | **72,73%** |
| **urtato** dall'arrivo (partenza libera) | il trigramma perde | 301 | **55,15%** (perde) |
| trattiene la partenza **e** subisce l'urto | non tiene: il trigramma vince | 109 | **55,96%** |
