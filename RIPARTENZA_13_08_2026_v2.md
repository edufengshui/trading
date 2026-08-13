# RIPARTENZA — 13/08/2026 (fine giornata, completa)

## Bootstrap della prossima sessione
1. `git clone https://github.com/edufengshui/storico-trading.git`
2. `unzip history_full_1h_f.zip` → rinominare il JSON estratto in **`full1h.json`**
3. `npm install lunar-javascript`
4. Verificare il baseline canonico PB:
```
RAFFORZA=1 VUOTO=1 SOPRAF=1 VUOTOSTAG=wang DRENA=1 FLUSSOTI=1 NAYINDEB=1 SKIPCLASH=gm RISCATTO=b node pb_stress.js
```
Deve dare: **4.111 trade · 53,51% · z 3,86 · +17.221 pip**
5. Leggere **`REGISTRO_CORREZIONI_13_08_2026.md`** (1.275 righe, 47 sezioni) — è il documento
   principale, contiene ogni regola con stato, carta sorgente e numeri.

---

## COSA È SUCCESSO OGGI (in una riga)
Il **Liu Yao come sistema direzionale autonomo** è passato da **~50% a 55,10%** su 1.256 carte
(+7.039 pip), sopra il riferimento (il mercato sale il 50,40% dei giorni) su ENTRAMBI i periodi.
Il modulo `liuyao.js` ha acquisito tre sistemi classici che non aveva — **三會, 刑, doppia
timeliness** — più l'ora dal seme, il 回頭剋 corretto, il 暗動 e le regole del Tai Sui.

---

## FILE DA CARICARE — DUE GRUPPI SEPARATI

**Gruppo A — cartella PWA pubblica (fsadvisor.org/trading/):**
- `liuyao.js` · `app.js` · `index.html` · `sw.js` · `.gitignore`
- (`.gitignore` va messo per PRIMO; sw.js già a cache **v39** con liuyao.js e plumblossom.js nel precache)

**Gruppo B — solo repo di backup (MAI nella PWA se fosse separata):**
- `pb_stress.js` (motore di ricerca) · `REGISTRO_CORREZIONI_13_08_2026.md` · questa `RIPARTENZA`

Stato repo a fine giornata: pushato alle 22:27, contiene liuyao.js/sw.js(v39)/app.js/pb_stress.js/
REGISTRO. **Mancava RIPARTENZA_13_08_2026.md** (da caricare).

---

## REGOLE LIU YAO ATTIVE NEL MODULO (liuyao.js)
Lettura classica completa (Na Jia, sei parenti, Shi/Ying, Sei Bestie, 伏神, mutante+trasformato,
旬空, Tai Sui, stato di ogni linea) più:
1. Clash: dal giorno sempre; dall'anno se il ramo è 旺/相; dal mese solo potenzia
2. Combinazione 六合 dal giorno: bloccante, protegge dal clash (servono 2 clash)
3. Vuoto 旬空: dormiente senza clash; risvegliato/eliminato con clash secondo la stagione
4. 動不為空 · 旺不为空
5. Autocombinazione 自合 della mobile (stato "autocombinata", caso −4)
6. 回頭剋 (caso 3) CORRETTO: muore la partenza, non il trasformato; l'arrivo è vivo e agisce
7. 暗動: la linea piena clashata si sposta SENZA mutare; arrivo = ramo alla sua posizione
   nell'esagramma trasformato UNICO (della sola mutante ufficiale)
8. Bloccaggio NON avviene se la linea atterra su una linea in movimento (salda, non lega)
9. 伏神: un parente presente solo come nascosto è fuori dai giochi
10. 日辰臨爻: la linea col ramo del giorno è al massimo della forza
11. 進神/退神: mobile che si muove in ramo stesso elemento; avanza (oraria) vince, retrocede
    (antioraria) perde → vince l'opposto
12. Ora dal seme (oraDalSeme, oraBranch) — aggiunta oggi

## DA AGGIORNARE NEL MODULO
- `stagione()` usa solo l'elemento del mese: implementare la **doppia timeliness** (elemento +
  stagione) — nei 4 mesi di Terra due elementi sono timely insieme (§37). Migliora la copertura
  senza diluire la qualità (Ricchezza timely: 652→823 carte allo stesso 55,8%).

---

## LE SCOPERTE SOLIDE (tutte sopra il riferimento su entrambi i periodi)

**Capolinea del flusso (§20)** — linea viva che riceve e non cede, unica sulla carta:
G 57,23% (325 carte) · W 54,55% · P 54,04% · C 50,82% · B 48,80%. Riproduce la gerarchia.

**Capolinea G DRENATO dal proprio 伏神 (§33)** — la cella più forte: **60,32%** (126 carte,
64,71% nel recente). Nessuna contraddizione con "P sfavorevole" (§12): quando il capolinea è G,
il P non è mai presente in carta (popolazioni disgiunte).

**進神/退神 (§22) + clash sull'arrivo (§23)** — retrocedente vince l'opposto (53,13%); il clash
del giorno sull'ARRIVO porta entrambe le progressioni a **65-67%**.

**Le cinque configurazioni del Tai Sui (§44-47) — forza CONCENTRATA, una cosa alla volta:**
| il Tai Sui... | esito | n | % |
|---|---|---|---|
| blocca la partenza | la linea non parte, nessun segnale | 340 | 51,47% |
| blocca l'arrivo | C/B vincono, G/P perdono | 369 | 51,22% |
| blocca l'arrivo **+ 回頭生** | il trigramma vince | 44 | **72,73%** |
| **urtato** dall'arrivo | il trigramma perde | 301 | 55,15% |
| trattiene **e** subisce l'urto | non tiene, il trigramma vince | 109 | 55,96% |
Principio: ferma→conserva · urtato→distrugge · due fronti→non fa nulla.

**Il salto della linea clashata (§42-43)** — conta dove ARRIVA: salto su W 57,25%; il salto
migliora il G solo se ha forza (timely 50,85→60,00; forte 52,70→63,16; debole nessun effetto).

**飛神空伏神出 (§41)** — G nascosto sotto copertura VUOTA: 36,00% (combinazione dei due fattori).

**三會 col mese (§31)** e **刑 col proprio 伏神 (§34, §38)** — due sistemi nuovi; la 刑 morde
secondo il TIPO di forza (S=stagione, B=Bazi), scomposto in §38.

## PRINCIPIO GENERALE EMERSO (§37, fondamentale)
**TIMELY** (dal mese) = effetto ampio, su tutti gli attori. **FORTE** (giorno/anno) = effetto
concentrato su una linea. Giorno e anno sono forti ma non timely. Questa distinzione scioglie
le contraddizioni sul "chi è forte" e va usata in tutte le regole future.

Corollario sui parenti: **P vale quando cede, G quando trattiene.** G capolinea (fermo) vince
57-60%; G mobile libero fa perdere (46,57%). P è un condotto (§12), non un attore.

---

## TERMOMETRO — LY autonomo con catena di precedenza
mobile distrutta → capolinea G drenato → 刑 col 伏神 (deboli) → capolinea G → 退神 → 三會 col mese.
Risultato: **55,10% su 1.256 carte, +7.039 pip** (recente 54,00%, vecchio 57,06%).
Il 進神 è stato RIMOSSO (rendeva −0,61 pip/trade). Prossimo candidato al taglio: 刑 col 伏神 (51,96%).

---

## PROSSIMI PASSI
1. Aggiornare `stagione()` con la doppia timeliness (§37) nel modulo e nel motore
2. Ricalcolare il termometro inserendo le celle forti di fine giornata: salto su W (57,25%),
   回頭生 con arrivo bloccato dal Tai Sui (72,73%), urto al Tai Sui (55,15%)
3. Estendere la chiave drenato/controllato/nutrito/domina agli altri parenti (W, C, B, G) —
   mai fatta, su P ha separato 59,55% vs 45,16%
4. Cella C allo Shi con W vivo e G assente (41,57%) come filtro NO TRADE
5. Modello di forza per linea (netStr generalizzato, pesato su tutto il Bazi) — il passo grosso
6. Aggiornare SISTEMA_CATENE_v3.md con il baseline DLR corretto: −2.565 pip (mostra ancora −1.611)

## IN OSSERVAZIONE FORWARD (campioni piccoli, verso compatibile)
- Condizione 16: G allo Ying generato dalla mobile (8/8 storico)
- §43a: G esposto che riceve un salto (5 carte)
- §45a: 回頭生 con arrivo bloccato (44 carte, meccanismo chiaro)

## DECISIONI IN SOSPESO
- §29 (暗動 autopenalizzata) misura 52,77% positivo su 307 carte ma Edu l'ha ritirata
  dottrinalmente; la sostituta (cascata) misura 47,84%. Decisione non presa.
- Perché il P nascosto dietro il G dia 5 punti in più (§33): senza spiegazione dottrinale.

---

## REGOLE DI COMUNICAZIONE (Edu non è programmatore)
Partire da cosa fare/vedere sullo schermo, mai dal codice. Un passo per messaggio. Dire prima
cosa confermerà il successo. Risposte sintetiche: risultato secco prima, poche righe dopo.
Carte nel formato obbligatorio (SEGUE/NON SEGUE + pip in cima). Mai "inverte" → "segue/non segue
il trend". Date DD/MM/YYYY. "Steli" non "tronchi". Caratteri cinesi sempre con traduzione italiana.
**File per GitHub: sempre due gruppi separati (PWA pubblica / repo backup), mai una lista sola.**
