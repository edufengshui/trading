# REGISTRO LIU YAO — 11/08/2026

Stato: **linea di ricerca APERTA**. Continueremo ad affinare il Liu Yao e poi tenteremo
l'abbinamento PB + LY per tirare fuori il meglio dei due sistemi.

## Infrastruttura costruita (in pb_stress.js, riutilizzabile)

- **Palazzi di Jing Fang**: mappa completa dei 64 esagrammi → palazzo, generazione,
  posizioni Shi (世) e Ying (應). Sequenza canonica: puro s6, 1ª–5ª gen s1–s5, 游魂 s4,
  歸魂 s3. Verificata su Jin 晉 = 游魂 di Qian, Shi 4ª linea (screenshot software Edu).
- **Na Jia**: rami sulle sei linee, tabelle interno/esterno per gli 8 trigrammi.
  Verificate: Kun interno 未巳卯, Li esterno 酉未巳, Kan interno 寅辰午.
- **Parenti**: Brother = ramo dello Shi dello stesso elemento del palazzo.
- Attivazione: `LIUTAG=1` (calcola senza toccare i verdetti), `LIUREP=1` (referto),
  `LFROM`/`LTO` (spacco periodi), `LIUYAO=v1..v4` (verdetto autonomo, scartato).

## Dottrina della linea mobile (Edu, 11/08/2026) — implementata

Elemento efficace della mutante rispetto a Shi:
1. L'arrivo GENERA la partenza (回頭生) → agisce la **partenza rafforzata**
2. La partenza GENERA l'arrivo → agisce **l'arrivo**
3. L'arrivo CONTROLLA la partenza (回頭剋) → linea spezzata, **effetto nullo**
4. La partenza CONTROLLA l'arrivo → agisce **l'arrivo** (come il 2)
5. Stesso elemento → come il 1 (partenza rafforzata) [da confermare con Edu]

Vuoti: la linea che si muove **non è mai vuota** (動不為空); se **l'arrivo è vuoto**
il movimento è **nullo**.

Sospensione dal giorno: se il ramo del giorno COMBINA (六合) o CLASHA (六冲) con
partenza o arrivo → la linea **non produce risultato ora** (lo produrrà quando il
legame si scioglie — fuori dall'orizzonte giornaliero).

Combinazione/clash dell'arrivo con Shi/Ying:
- arrivo COMBINA Shi o Ying → quello riceve la partenza e **"diventa" quella linea**
  (assume l'elemento della partenza)
- arrivo CLASHA Shi o Ying → quello è **invalidato**

Forza delle linee: stagione del mese (旺相休囚死) **+ il ramo del giorno resta forte
e influenza anch'esso** — linea forte se 旺/相 nel mese O sostenuta dal giorno
(stesso elemento o generata dal ramo del giorno).

## Risultato principale — CANDIDATO VIVO

**"Brother sostenuto = veto sui LONG"**: Shi di tipo Brother, valido (non clashato
dall'arrivo), con Ying valido e FORTE che lo genera, con trend EMA in salita → il
LONG fallisce.

| periodo | cella larga | + mutante favorevole |
|---|---|---|
| totale | 135 carte, Long vince 41,5% (z −1,98) | 31 carte, 35,5% |
| recente (05/2023→) | 85 carte, **38,8%** (z −2,06) | 18 carte, 44,4% |
| vecchio (→04/2023) | 50 carte, 46,0% | 13 carte, **23,1%** (z −1,94) |

Quattro celle su quattro sotto il 50% nei due periodi: direzione stabile.
Dose-risposta presente (più sostegno → peggio per il Long). Dottrina dichiarata da
Edu PRIMA di ogni misura ("il Brother è sfavorevole ai guadagni Long").
Il segnale è emerso SOLO con la dottrina completa (in particolare la forza dell'Ying
mese+giorno); le versioni semplificate davano rumore.

Uso futuro naturale: **veto/filtro sui segnali LONG del PB** (le perdite del PB si
concentrano su "segue" long) — da testare nell'abbinamento PB+LY.

## Scartati con i numeri (non riaprire senza dati nuovi)

- **Liu Yao autonomo a relazioni secche** (v1 Ying→Shi, v2 mutante→Shi, v3 misto,
  v4 concordanza): 48–50%, nessun segnale. La mappa dottrinale corretta (Ying genera
  Shi = conferma) misura 48,11%.
- **Lato "conferma dello SHORT"** (B + trend giù + sostegno): segni opposti nei due
  periodi (41,5% recente vs 56,2% vecchio) → rumore. Il 64% della cella raffinata era
  trascinato dal solo periodo vecchio (78,6% su 14 carte vs 50% su 14).
- **Atterraggio della mutante nel vuoto come regola PB** (3 forme): peggiora sempre
  il sistema PB (fino a −0,63 di z). Nota: nel Liu Yao la regola "arrivo vuoto =
  movimento nullo" resta parte della dottrina implementata.

## Numeri di riferimento del sistema PB (invariato, v38 in produzione)

z 3,79 · +16.407 pip · 4.111 trade · win 53,47% · recente 2,97 · vecchio 2,38
(con RISCATTO=b: z 3,86 · +17.221 — riscatto = regola da 4 casi, giudicherà il forward)
Comando canonico: `RAFFORZA=1 VUOTO=1 SOPRAF=1 VUOTOSTAG=wang DRENA=1 FLUSSOTI=1
NAYINDEB=1 SKIPCLASH=gm RISCATTO=b node pb_stress.js`

## Prossimi passi concordati

1. **Affinare il Liu Yao**: pezzi dottrinali ancora mancanti — forza completa linea
   per linea (oltre l'Ying), tombe delle linee, spiriti nascosti (伏神), Sei Bestie,
   caso stesso-elemento della mutante (化進/化退?) da chiarire con Edu.
2. **Consolidare il veto anti-Long**: più carte via forward test; provare la
   definizione sul set PB (quante carte "segue+long" del PB cadono nel veto e con
   che esito).
3. **Abbinamento PB + LY**: quando il LY è affinato, testare l'integrazione per
   tirare fuori il meglio dei due (es. LY come veto direzionale sui segnali PB).

## Primo test di abbinamento PB + LY (11/08/2026, sera)

**Veto anti-Long sul PB: BOCCIATO.** Vetare i segnali LONG del PB nei giorni
Brother-sostenuto fa danno in tutte le gradazioni (up: −1.084 pip, z 3,86→3,70;
all: −1.915; mut: 7 carte, nulla). I 37 LONG vetati erano vincitori netti.

**Spiegazione — la scoperta vera:** nei giorni "Brother sostenuto + trend su"
(126 carte) i due sistemi vedono la stessa fragilita' del rialzo con dottrine diverse:
- il mercato scende il 57,9% di quei giorni (la cella anti-Long del LY era vera);
- il PB, da solo, in quei giorni sceglie NON SEGUE (SHORT) 89 volte su 126 e vince
  il **65,2%** (+1.424 pip);
- e nei 37 giorni in cui insiste sul LONG, vince comunque il **59,5%** (+1.084 pip).

Complessivo della cella: 126 carte, ~63,5% di vittorie, ~20 pip/carta — contro il
53,5% medio del sistema. Il PB dentro la cella distingue i giorni buoni dai cattivi
meglio del veto stesso.

**Verifica dei periodi (11/08/2026, sera) — la cella REGGE:**
- recente (05/2023→): 79 carte, PB vince 64,6% (+1.407 pip); SHORT 68,5%, LONG 56,0%
- vecchio (→04/2023): 47 carte, PB vince 61,7% (+1.101 pip); SHORT 60,0%, LONG 66,7%
Nessuna cella sotto il 56%. Prima volta nella ricerca che un segnale esterno al PB
supera l'esame dei due periodi al primo colpo. ~2,3 sigma sopra la media di sistema
su 126 carte: suggestivo e coerente, non ancora conclusivo (~50 test bruciati il
10-11/08). Il claim onesto: il LY aggiunge informazione che il PB non ha — certifica
il 3% di giorni in cui i verdetti PB valgono ~63% invece di 53%. Il LY non corregge
il PB, lo certifica.

**Lezioni per l'abbinamento:**
1. Il veto secco e' la forma sbagliata: il LY non deve sovrascrivere il PB dove il
   PB e' gia' forte.
2. La cella Brother-sostenuto e' un **amplificatore di confidenza**: i segnali PB
   emessi in quei giorni sono di prima scelta (~63,5% vs 53,5%). Direzioni future:
   sizing differenziato, o etichetta di qualita' sul segnale in PWA.
3. Da esplorare nelle prossime sessioni: altre celle LY come marcatori di confidenza
   (es. Wealth/Officer al Soggetto, Shi forte vs debole), sempre col PB al comando.

Attivazione nel motore: `LIUTAG=1 LYVETO=up|all|mut` (veto, bocciato),
`LYSPACCATO=1` (referto della cella con lo spacco dei verdetti PB).

## Nota di metodo

Siamo a ~40+ varianti testate nella sessione del 10–11/08. Il tetto del rumore per
|z| supera 3. Nessun risultato Liu Yao raggiunge da solo la significatività: il
candidato anti-Long vive sulla coerenza di direzione fra periodi e sulla dottrina
pre-dichiarata, non sulla forza statistica. Il forward test è il giudice.
