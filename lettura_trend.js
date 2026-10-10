// lettura_trend.js — IL METODO DEL TREND (Edu, 09/10/2026, S54)
// La carta del Liu Yao letta SOLO col sistema del trend: lo Shi rappresenta il trend, la Ying cio' che spinge nella
// direzione opposta; si guarda chi delle due e' logicamente avvantaggiata da quello che succede nell'esagramma.
// Regole dettate da Edu il 09/10/2026 (registro, sezione S54 "le sedi e il trend"), nell'ordine della bozza:
//  1. Shi = trend, Ying = contro-trend; conta chi e' avvantaggiata.
//  2. Cio' che fa l'arrivo della mobile a S o Y le influenza: nutrire S o colpire Y -> segue; colpire S o nutrire Y
//     -> non segue (colpire = controllare o drenare).
//  3. (solo la combinazione trasporta la partenza — non entra qui)
//  4. L'arrivo che genera la mobile stessa tiene il beneficio per se': non nutre una sede.
//  5. La mobile che retrocede non condiziona le sedi.
//  6. Una linea vuota fra la mobile e la sede ferma l'influenza su quella sede.
//  7. La sede di stagione nel mese non si lascia drenare ne' controllare.
//  8. I pilastri che convergono su una sede la rendono forte.
//  9. Il trigono chiuso dall'arrivo con una sede e col mese (o il giorno) avvantaggia quella sede.
// 10. La sede che e' lei stessa la mobile e si fa generare indietro e' avvantaggiata; controllata indietro, colpita.
//     Una sede vuota non puo' beneficiare di nulla.
// 11. Il carattere conta: nutrire una P o una B rafforza chi fa perdere la propria squadra (il segno si rovescia).
//     Solo il nutrire: colpire una P o una B la indebolisce come qualunque sede (EURJPY 07/10/2026 s178, S55).
// 12. Se S e Y sono TUTTE E DUE troppo fuori stagione non possono rappresentare un trend o un contro-trend: il metodo TACE.
//     Perimetro di Claude su "troppo": elemento morto o imprigionato nel mese (controllato dal mese o che lo controlla).
// 7b. La sede di stagione si lascia colpire da un arrivo forte (di stagione), non se e' il ramo stesso del mese (EURJPY 07/10/2026 s178).
// 10b. La sede vuota ma di stagione riceve il nutrimento ("gia' vibrante di suo", NZDUSD 07/10/2026 s56); la sede che si
//     muove non e' vuota alla partenza (AUDUSD 07/10/2026 s69).
// 15. La mobile combinata alla partenza dal mese o dal giorno non si muove (EURGBP 07/10/2026 s84).
// 16. Il mese che e' una G e si combina con lo Shi gli garantisce la vittoria (EURGBP 07/10/2026 s84).
// 17. L'arrivo che punisce una sede la colpisce, anche se genera la mobile stessa (USDJPY 06/10/2026 s157).
// 18. Il trigramma in confusione totale (ogni linea clasha il proprio futuro comune) fa tacere il metodo (AUDUSD 06/10/2026 s69).
// 19. La sede mobile il cui arrivo e' incompatibile (caso -5) non viene generata ne' controllata indietro (EURUSD 05/10/2026 s112).
// 20. Il raduno stagionale chiuso da una sede, dal giorno e dalla mobile la avvantaggia (AUDUSD 05/10/2026 s69).
// 21. Il mese che fa da ponte ferma il controllo solo sulla sede forte di suo, che resta forte (GBPUSD 05/10/2026 s132).
// 22. La sede combinata e controllata dal giorno e' bloccata, fuori dal confronto; la sede generata indietro e' rafforzata
//     qualunque sia il carattere (GBPUSD 06/10/2026 s132).
// 23. Il giorno che drena la sede e la linea ferma accanto che la drena la indeboliscono; il giorno che genera l'arrivo
//     della sede che si autogenera la rafforza ancora (GBPUSD 07/10/2026 s132).
// 24. La sede molto piu' forte dell'altra nel mese e nel giorno e' avvantaggiata; i pilastri con lo stelo che la sede
//     controlla non la rafforzano (EURUSD 30/09/2026 s113).
// 25. La mobile gia' forte che si fa generare indietro rafforza il campo della sede del suo trigramma; la forza ferma delle
//     sedi (24) conta solo se non succede nient'altro (USDCAD 22/09/2026 s140).
// 26. La sede ferma non di stagione clashata dal giorno e' eliminata e vince l'altra (regola di Edu del 05/10/2026).
// 27. (DA VALIDARE) La sede mobile che arriva nel proprio stesso ramo resta ferma e sofferente: vince l'altra.
// 28. L'arrivo incompatibile della mobile va fuori (combina, stesso ramo, clash, genera): clashare una sede la colpisce,
//     generarla la nutre; la Ying che si muove a clashare lo Shi non lo genera piu' (USDJPY 02/09/2026 s160).
// 29. L'arrivo della mobile che e' la tomba di una sede la seppellisce. 30. La linea piu' forte dell'esagramma rafforza il
//     campo in cui sta, anche con la sede vuota (EURUSD 26/08/2026 s116).
// 31. La sede mobile il cui arrivo (anche vuoto) genera l'altra sede la nutre (EURJPY 07/09/2026 s181).
// 14. L'arrivo di una linea incompatibile agisce su Shi e Ying come quello della mobile (EURJPY 07/10/2026 s178, S55).
// 13. La Ying che genera lo Shi avvantaggia il trend, anche se la Ying e' vuota (EURUSD 07/10/2026 s112, S55).
// Esito: segue / non segue / tace, con i punti e il racconto. ctx come trend_ly.js (dayBranch, monthBranch, yearBranch,
// oraBranch, dayStem, yearStem, monthStem, hourStem, emaDir).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LetturaTrend = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var WX = { '子':'Water','丑':'Earth','寅':'Wood','卯':'Wood','辰':'Earth','巳':'Fire','午':'Fire','未':'Earth','申':'Metal','酉':'Metal','戌':'Earth','亥':'Water' };
  var GEN = { Wood:'Fire', Fire:'Earth', Earth:'Metal', Metal:'Water', Water:'Wood' };
  var KE  = { Wood:'Earth', Earth:'Water', Water:'Fire', Fire:'Metal', Metal:'Wood' };
  var COMBINA = { '子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯','辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午' };
  var CLASH = { '子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳' };
  var STELO_EL = { '甲':'Wood','乙':'Wood','丙':'Fire','丁':'Fire','戊':'Earth','己':'Earth','庚':'Metal','辛':'Metal','壬':'Water','癸':'Water' };
  var BESTIA_STELO = { '甲':'青龍','乙':'青龍','丙':'朱雀','丁':'朱雀','戊':'勾陳','己':'螣蛇','庚':'白虎','辛':'白虎','壬':'玄武','癸':'玄武' };
  var TRINE = {};
  [['Water',['申','子','辰']],['Wood',['亥','卯','未']],['Fire',['寅','午','戌']],['Metal',['巳','酉','丑']]].forEach(function (t) { t[1].forEach(function (b) { TRINE[b] = t[1]; }); });

  function leggi(R, c) {
    c = c || {};
    var out = { punti: 0, shi: 0, ying: 0, verdetto: null, dir: null, racconto: [] };
    if (!R || R.error || !R.mutante || !R.mutante.pos) { out.racconto.push('nessuna mobile: il metodo tace'); return out; }
    var S = R.linee[R.shi - 1], Y = R.linee[R.ying - 1], mob = R.linee[R.mutante.pos - 1];
    var mE = c.monthBranch ? WX[c.monthBranch] : null;
    var troppo = function (L) { var e = WX[L.ramo]; return !!mE && (KE[mE] === e || KE[e] === mE); };
    // 21 (Edu, 10/10/2026, S55, GBPUSD 05/10/2026 s132: "S is very strong and the You month mediates between Wei and Zi";
    //    "Non esagerare, S è già forte di suo perché il mese è metallo e l'ora è acqua. Se non fosse stato forte la mediazione
    //    non sarebbe stata utile"): il MESE che sta fra chi controlla e chi e' controllato (chi controlla genera il mese, il
    //    mese genera il controllato) ferma il controllo SOLO se la sede e' forte di suo; allora la sede forte resta in piedi e
    //    conta la sua forza (+1). Il mediato non e' un nutrimento. Sede debole: la mediazione non serve, il controllo passa.
    //    "Forte di suo" = il mese la genera o e' del suo elemento (Edu, 10/10/2026: "Bastava il mese, l'ora è un di più che
    //    aggiunge ulteriore forza"). c.mediazione === false spegne.
    var forteDiSuo = function (L) {
      // Edu (10/10/2026): "Bastava il mese, l'ora è un di più che aggiunge ulteriore forza" -> basta il mese
      var e = WX[L.ramo]; return !!mE && (e === mE || GEN[mE] === e);
    };
    var mediato = function (aEl, eEl, L) { return c.mediazione !== false && !!mE && GEN[aEl] === mE && GEN[mE] === eEl && forteDiSuo(L); };
    var timely = function (L) { var e = WX[L.ramo]; return !!mE && (e === mE || GEN[mE] === e); };
    // 12
    // Edu, 09/10/2026: "Se 'troppo fuori stagione' taglia così tante carte allora non va bene. Diciamo che se tutte e due lo sono."
    if (troppo(S) && troppo(Y)) { out.racconto.push('Shi e Ying sono tutti e due troppo fuori stagione per rappresentare il trend: il metodo tace'); return out; }
    // 18 (Edu, 09/10/2026, S55, AUDUSD 06/10/2026 s69: "Charts like these cannot be read with the trend methods, too much
    //    confusion"): il trigramma in CONFUSIONE TOTALE — ogni sua linea clasha il proprio ramo nel futuro comune (la stessa
    //    confusione totale del motore di lettura, USDJPY 13/02/2024 e 16/10/2024) e almeno una si muove — fa tacere il metodo.
    //    Vale per tutti e due i trigrammi (il basso e' quello delle carte di Edu, l'alto e' simmetria di Claude: c.confusione
    //    === 'basso' lo limita al basso; c.confusione === false spegne).
    if (c.confusione !== false && R.mutante.futuro) {
      var muoveIn = function (p) { return p === mob.pos || (R.incompatibili || []).indexOf(p) >= 0; };
      var trigs = c.confusione === 'basso' ? [[1, 2, 3]] : [[1, 2, 3], [4, 5, 6]];
      for (var tg = 0; tg < trigs.length; tg++) {
        var tr = trigs[tg];
        if (tr.some(muoveIn) && tr.every(function (p) { return CLASH[R.linee[p - 1].ramo] === R.mutante.futuro[p - 1]; })) {
          out.racconto.push('il trigramma ' + (tg === 0 ? 'basso' : 'alto') + ' è in confusione totale (ogni linea clasha il proprio futuro): troppa confusione, il metodo tace');
          return out;
        }
      }
    }
    var dep = R.mutante.ramoDep, arr = R.mutante.ramoArr, aE = arr ? WX[arr] : null, dE = WX[dep];
    var pil = [['anno', c.yearStem, c.yearBranch], ['mese', c.monthStem, c.monthBranch], ['giorno', c.dayStem, c.dayBranch], ['ora', c.hourStem, c.oraBranch]]
      .filter(function (p) { return p[1] && p[2]; });
    var segno = function (L, fav) { // 11: il carattere
      var s = fav ? +1 : -1; if ((fav || c.colpisciPB) && (L.par === 'P' || L.par === 'B')) s = -s; return s;   // 11 solo per il nutrire (Edu, EURJPY 07/10/2026 s178: colpire la Ying P la indebolisce -> segue); c.colpisciPB torna alla forma vecchia
    };
    // pt registra se qualcosa e' successo (serve alla regola 24: la forza ferma conta solo se non succede nient'altro)
    var nutrito = { S: false, Y: false };   // la sede nutrita da un movimento (regole 2 e 31)
    var tocco = { v: false }, _p = { S: 0, Y: 0 }, pt = {};
    ['S', 'Y'].forEach(function (k) { Object.defineProperty(pt, k, { get: function () { return _p[k]; }, set: function (v) { if (v !== _p[k]) tocco.v = true; _p[k] = v; }, enumerable: true }); });
    var sedi = [['S', S, R.shi], ['Y', Y, R.ying]];
    // Chi si muove: la mobile e, dal 09/10/2026 (S55), le linee INCOMPATIBILI, che girano col futuro comune e agiscono su
    // Shi e Ying come la mobile (Edu, EURJPY 07/10/2026 s178: "Si"). c.incompatibili === false torna alla sola mobile.
    var RETRO = { '卯':'寅','午':'巳','酉':'申','子':'亥','丑':'戌','辰':'丑','未':'辰','戌':'未' };
    // 15 (Edu, 09/10/2026, S55, EURGBP 07/10/2026 s84: "L3 non si può muovere per via del mese"): la mobile la cui partenza
    //    e' combinata dal mese (o dal giorno, regola gia' a registro dal 18/09/2026) non si muove e non agisce sulle sedi.
    //    c.partenzaLegata === false torna alla forma vecchia.
    var legataDa = c.partenzaLegata === false ? null : (COMBINA[dep] === c.monthBranch ? 'mese' : COMBINA[dep] === c.dayBranch ? 'giorno' : null);
    if (legataDa) out.racconto.push('la mobile è combinata alla partenza dal ' + legataDa + ': non si muove');
    var chi = [{ pos: mob.pos, dep: dep, arr: (R.mutante.movimentoNullo || legataDa) ? null : arr, retro: R.mutante.progressione === 'retrocedente', tipo: 'l\'arrivo' }];
    if (c.incompatibili !== false && R.incompatibili && R.mutante.futuro) R.incompatibili.forEach(function (ip) {
      var Li = R.linee[ip - 1], ai = R.mutante.futuro[ip - 1];
      // 15 anche per l'incompatibile (AUDUSD 05/10/2026 s69: lo Shi Chou legato dal giorno Zi non gira, "è tutto pari")
      if (Li && c.partenzaLegata !== false && (COMBINA[Li.ramo] === c.monthBranch || COMBINA[Li.ramo] === c.dayBranch)) { out.racconto.push('l\'incompatibile L' + ip + ' è combinata alla partenza dal ' + (COMBINA[Li.ramo] === c.monthBranch ? 'mese' : 'giorno') + ': non gira'); return; }
      if (Li && ai && ai !== Li.ramo) chi.push({ pos: ip, dep: Li.ramo, arr: ai, retro: RETRO[Li.ramo] === ai, tipo: 'l\'arrivo dell\'incompatibile L' + ip });
    });
    sedi.forEach(function (q) {
      var k = q[0], L = q[1], sp = q[2], e = WX[L.ramo], nome = k === 'S' ? 'lo Shi' : 'la Ying';
      chi.forEach(function (m) {
        var mA = m.arr, mAE = mA ? WX[mA] : null, mDE = WX[m.dep];
        if (!mA) return;
        // 10: la sede e' lei stessa la linea che si muove
        if (m.pos === sp) {
          // L'arrivo incompatibile col trigramma trasformato (o punito dal giorno: caso -5) non agisce sulla propria partenza
          // (Edu, 08/10/2026, EURUSD 05/10/2026 s112: "G rimane in controllo"; R85_INCFUORI/MLINCFUORI).
          if (m.pos === mob.pos && R.mutante.casoMut === -5 && c.incFuori !== false) { out.racconto.push('l\'arrivo ' + mA + ' è incompatibile: non agisce su ' + nome + ', che resta com\'è'); return; }
          // Edu (regole del vuoto, 22/09/2026): una linea che si muove non e' mai vuota alla partenza (AUDUSD 07/10/2026 s69:
          // "S si muove per generare indietro" con lo Shi Chou vuoto). c.mobileVuota === true torna alla forma vecchia.
          if (L.vuoto && c.mobileVuota) { out.racconto.push(nome + ' si muove ma è vuoto: non beneficia di nulla'); }
          // Edu, 10/10/2026 (GBPUSD 06/10/2026 s132: "Y rafforzato dalla generazione indietro", la Ying e' una B): la sede
          // generata indietro e' rafforzata qualunque sia il suo carattere (la regola 11 vale per il nutrimento da un'altra linea).
          // c.indietroCarattere === true torna alla forma vecchia.
          else if (GEN[mAE] === e) {
            pt[k] += c.indietroCarattere ? segno(L, true) : 1; out.racconto.push(nome + ' si fa generare indietro: rafforzat' + (k === 'S' ? 'o' : 'a'));
            // 23b (Edu, 10/10/2026, GBPUSD 07/10/2026 s132: "Y si muove per autogenerarsi con l'aiuto del giorno che genera Wu"):
            //     il giorno che genera l'arrivo da' ulteriore forza (+1). c.aiutoGiorno === false spegne.
            if (c.aiutoGiorno !== false && c.dayBranch && GEN[WX[c.dayBranch]] === mAE) { pt[k] += 1; out.racconto.push('il giorno ' + c.dayBranch + ' genera l\'arrivo ' + mA + ': ' + nome + ' si autogenera con l\'aiuto del giorno'); }
          }
          else if (KE[mAE] === e && mediato(mAE, e, L)) { pt[k] += 1; out.racconto.push(nome + ' è forte di suo e il mese ' + c.monthBranch + ' fa da ponte con l\'arrivo ' + mA + ': il controllo indietro non passa, ' + nome + ' resta forte'); }
          else if (KE[mAE] === e) { pt[k] += segno(L, false); out.racconto.push(nome + ' è controllato indietro: colpito'); }
          return;
        }
        if (m.pos === R.shi || m.pos === R.ying) return;   // a muoversi e' l'altra sede: niente azione da lei su questa
        var ok = true;
        if (m.retro) ok = false;                                                                        // 5
        if (GEN[mAE] === mDE) ok = false;                                                               // 4
        var lo = Math.min(m.pos, sp), hi = Math.max(m.pos, sp);
        for (var q2 = lo + 1; q2 < hi; q2++) if (R.linee[q2 - 1].vuoto) ok = false;                     // 6
        if (ok) {
          if (GEN[mAE] === e) { if (L.vuoto && !(c.vuotaVibrante !== false && timely(L))) out.racconto.push(nome + ' è vuoto: il nutrimento di ' + m.tipo.replace('l\'arrivo', 'quell\'arrivo') + ' non arriva'); else { pt[k] += segno(L, true); nutrito[k] = true; out.racconto.push(m.tipo + ' ' + mA + ' nutre ' + nome + (L.vuoto ? ' (vuoto ma di stagione, già vibrante di suo)' : '')); } }
          else if (KE[mAE] === e && mediato(mAE, e, L) && !L.vuoto) { pt[k] += 1; out.racconto.push(nome + ' è forte di suo e il mese ' + c.monthBranch + ' fa da ponte con ' + m.tipo + ' ' + mA + ': il controllo non passa, ' + nome + ' resta forte'); }
          else if (KE[mAE] === e || GEN[e] === mAE) {
            // 7b (Edu, 09/10/2026, S55, EURJPY 07/10/2026 s178: "L5 si muove in una forte Hai che indebolisce Y"): la sede di
            //    stagione si lascia colpire da un arrivo forte (di stagione anche lui nel mese). Perimetro DI CLAUDE che tiene
            //    insieme GBPUSD 15/12/2022 (Ying Zi nel mese Zi: non si lascia drenare): la sede che e' il ramo stesso del mese
            //    resta intoccabile. c.arrivoForte === false torna alla regola 7 com'era.
            var arrForte = c.arrivoForte !== false && !!mE && (mAE === mE || GEN[mE] === mAE) && L.ramo !== c.monthBranch;
            if (timely(L) && !arrForte) out.racconto.push(nome + ' è di stagione: non si lascia ' + (KE[mAE] === e ? 'controllare' : 'drenare'));   // 7
            else { pt[k] += segno(L, false); out.racconto.push(m.tipo + ' ' + (arrForte && timely(L) ? 'forte ' : '') + mA + (KE[mAE] === e ? ' controlla ' : ' drena ') + nome); }
          }
        }
        // 17 (Edu, 09/10/2026, S55, USDJPY 06/10/2026 s157: "L4 si muove per penalizzare Y. Segue il trend"): l'arrivo che
        //    punisce una sede (三刑: Yin->Si->Shen->Yin, Chou->Xu->Wei->Chou, Zi<->Mao) la colpisce, anche quando genera la mobile
        //    stessa (su quella carta l'arrivo Xu genera la partenza You). Non se retrocede, non con una vuota in mezzo, non sulla
        //    sede vuota; la sede di stagione si difende come dal controllo (7/7b). c.penalita === false spegne.
        var PENA = { '寅':'巳','巳':'申','申':'寅','丑':'戌','戌':'未','未':'丑','子':'卯','卯':'子' };
        if (c.penalita !== false && PENA[mA] === L.ramo && !m.retro && !L.vuoto && !(GEN[mAE] === e || KE[mAE] === e || GEN[e] === mAE)) {
          var okP = true; for (var q3 = Math.min(m.pos, sp) + 1; q3 < Math.max(m.pos, sp); q3++) if (R.linee[q3 - 1].vuoto) okP = false;
          var forteP = !!mE && (mAE === mE || GEN[mE] === mAE) && L.ramo !== c.monthBranch;
          if (okP && timely(L) && !forteP) out.racconto.push(nome + ' è di stagione: non si lascia punire');
          else if (okP) { pt[k] += segno(L, false); out.racconto.push(m.tipo + ' ' + mA + ' punisce ' + nome); }
        }
        // 9: il trigono con l'arrivo e il mese/giorno
        if (TRINE[mA] && TRINE[mA].indexOf(L.ramo) >= 0 && L.ramo !== mA && !L.vuoto) {
          var terzo = TRINE[mA].filter(function (b) { return b !== mA && b !== L.ramo; })[0];
          if (terzo === c.monthBranch || terzo === c.dayBranch) { pt[k] += segno(L, true); out.racconto.push(m.tipo + ' ' + mA + ' chiude il trigono con ' + nome + ' e il ' + (terzo === c.monthBranch ? 'mese' : 'giorno') + ': avvantaggiato'); }
        }
      });
      // 8: i pilastri che convergono sulla sede
      if (L.bestia && L.bestia.cn) {
        // Perimetro DI CLAUDE (EURUSD 30/09/2026 s113: tre steli di Fuoco sulla Ying Acqua): il pilastro il cui stelo e'
        // dell'elemento che la sede controlla la impegna, non la rafforza. c.pilastriTutti === true torna alla forma vecchia.
        var caduti = pil.filter(function (p) { return BESTIA_STELO[p[1]] === L.bestia.cn && R.vuoti.indexOf(p[2]) < 0 && (c.pilastriTutti || KE[e] !== STELO_EL[p[1]]); });
        // Perimetro DI CLAUDE (NZDUSD 07/10/2026 s56, da validare): i pilastri non rendono forte una sede troppo fuori
        // stagione (morta o imprigionata nel mese). c.pilastriSuMorta === true torna alla forma vecchia.
        if (caduti.length >= 2 && troppo(L) && !c.pilastriSuMorta) out.racconto.push(caduti.length + ' pilastri cadono su ' + nome + ', ma è troppo fuori stagione: non la rendono forte');
        else if (caduti.length >= 2) { pt[k] += 1; out.racconto.push(caduti.length + ' pilastri cadono su ' + nome + ' (' + caduti.map(function (p) { return p[0]; }).join(', ') + '): forte'); }
      }
      // la sede legata e controllata dal mese (EURJPY 16/01/2026): svantaggiata
      if (c.monthBranch && COMBINA[c.monthBranch] === L.ramo && KE[mE] === e) { pt[k] -= 1; out.racconto.push(nome + ' è combinato e controllato dal mese: svantaggiato'); }
    });
    // 28 (Edu, 10/10/2026, S55, USDJPY 02/09/2026 s160: "Y si muove per clashare S. È chiaro che poi non segue"): l'arrivo
    //    incompatibile della mobile va FUORI nell'ordine della regola dell'08/10/2026 (R85_INCFUORI) — combinarsi, la linea
    //    con lo stesso ramo, clashare, generare. Se va a CLASHARE una sede la colpisce (-1); se la GENERA la nutre (+1, col
    //    carattere della regola 11). Se la mobile e' una sede e colpisce l'altra, la regola 13 decade. c.incFuoriTrend === false spegne.
    var colpoFuori = null;
    if (c.incFuoriTrend !== false && R.mutante.casoMut === -5 && arr) {
      var altre = R.linee.filter(function (Lx) { return Lx.pos !== mob.pos && !Lx.vuoto; });
      var tipo = null, T = null;
      var comb = altre.filter(function (Lx) { return COMBINA[arr] === Lx.ramo; })[0];
      var stesso = altre.filter(function (Lx) { return Lx.ramo === arr; })[0];
      var cl = altre.filter(function (Lx) { return CLASH[arr] === Lx.ramo; })[0];
      var gn = altre.filter(function (Lx) { return GEN[aE] === WX[Lx.ramo]; })[0];
      if (comb) { tipo = 'combina'; T = comb; } else if (stesso) { tipo = 'stesso'; T = stesso; } else if (cl) { tipo = 'clash'; T = cl; } else if (gn) { tipo = 'genera'; T = gn; }
      if (T && (T.pos === R.shi || T.pos === R.ying) && (tipo === 'clash' || tipo === 'genera')) {
        var kT = T.pos === R.shi ? 'S' : 'Y', nT = kT === 'S' ? 'lo Shi' : 'la Ying';
        if (tipo === 'clash') { pt[kT] -= 1; colpoFuori = kT; out.racconto.push('l\'arrivo ' + arr + ' è incompatibile e va fuori a clashare ' + nT + ': colpit' + (kT === 'S' ? 'o' : 'a')); }
        else { pt[kT] += segno(T, true); out.racconto.push('l\'arrivo ' + arr + ' è incompatibile e va fuori a generare ' + nT); }
      }
    }
    // 29 (Edu, 10/10/2026, S55, EURUSD 26/08/2026 s116: "L1 si muove per diventare la tomba di S"): l'arrivo della mobile
    //    che e' la TOMBA dell'elemento di una sede (Acqua 辰, Legno 未, Fuoco 戌, Metallo 丑 — le tombe dettate da Edu il
    //    19/09/2026) la seppellisce: colpita (-1). Non sulla mobile stessa. c.tomba === false spegne.
    var TOMBA = { Water:'辰', Wood:'未', Fire:'戌', Metal:'丑' };
    if (c.tomba !== false && arr && !R.mutante.movimentoNullo && !legataDa) [['S', S, R.shi, 'lo Shi'], ['Y', Y, R.ying, 'la Ying']].forEach(function (q) {
      if (q[2] === mob.pos || TOMBA[WX[q[1].ramo]] !== arr) return;
      pt[q[0]] -= 1; out.racconto.push('L' + mob.pos + ' si muove per diventare la tomba di ' + q[3] + ' (' + arr + '): sepolt' + (q[0] === 'S' ? 'o' : 'a'));
    });
    // 30 (Edu, stessa carta: "Y è vuoto, ma nel suo campo c'è la linea più forte dell'esagramma (L4)"): la linea piu' forte
    //    dell'esagramma da' forza al CAMPO (trigramma) in cui sta quando la sede di quel campo e' vuota (+1): ne prende il posto.
    //    Con la sede piena non conta (perimetro DI CLAUDE: GBPUSD 05/10 e EURGBP 07/10, You di stagione nel campo della Ying). Forza
    //    (perimetro DI CLAUDE): stesso elemento del mese +2, e' il ramo del mese +1, e' il ramo del giorno o dello stesso
    //    elemento del giorno +1; deve essere di stagione, non vuota, e unica in testa. c.lineaForte === false spegne.
    if (c.lineaForte !== false && mE) {
      var fz = R.linee.map(function (Lx) {
        if (Lx.vuoto) return -9; var ex = WX[Lx.ramo], f = 0;
        if (ex === mE) f += 2; else if (GEN[mE] === ex) f += 1; else return -9;
        if (Lx.ramo === c.monthBranch) f += 1;
        if (c.dayBranch && (Lx.ramo === c.dayBranch || WX[c.dayBranch] === ex)) f += 1;
        return f;
      });
      var mx = Math.max.apply(null, fz), quante = fz.filter(function (v) { return v === mx; }).length;
      if (mx >= 3 && quante === 1) {
        var pF = fz.indexOf(mx) + 1, campF = (pF <= 3) === (R.shi <= 3) ? 'S' : 'Y';
        if ((campF === 'S' ? S : Y).vuoto) pt[campF] += 1, out.racconto.push('la linea più forte dell\'esagramma è L' + pF + ' ' + R.linee[pF - 1].ramo + ', nel campo ' + (campF === 'S' ? 'dello Shi' : 'della Ying') + ': lo rafforza');
      }
    }
    // 31 (Edu, 10/10/2026, S55, EURJPY 07/09/2026 s181: "Anche se entrambi sono deboli tuttavia Y si muove per generare S.
    //    Segue il trend"): la sede che e' la mobile e il cui arrivo genera l'altra sede la nutre (+1, carattere della regola
    //    11), anche con l'arrivo vuoto (li' Wu era vuoto). Non se la mobile e' legata alla partenza o retrocede. c.sedeGeneraSede === false spegne.
    if (c.sedeGeneraSede !== false && arr && !legataDa && R.mutante.casoMut !== -5 && R.mutante.progressione !== 'retrocedente' && (mob.pos === R.shi || mob.pos === R.ying)
        && (!R.mutante.movimentoNullo || R.mutante.motivoNullo === 'arrival void')) {
      var altra = mob.pos === R.shi ? ['Y', Y, 'la Ying'] : ['S', S, 'lo Shi'];
      if (GEN[aE] === WX[altra[1].ramo] && !altra[1].vuoto) { pt[altra[0]] += segno(altra[1], true); nutrito[altra[0]] = true; out.racconto.push((mob.pos === R.shi ? 'lo Shi' : 'la Ying') + ' si muove in ' + arr + ' per generare ' + altra[2]); }
    }
    // 13: la Ying che genera lo Shi (Edu, 09/10/2026, S55, EURUSD 07/10/2026 s112: "Y genera S, e L5 si muove per pure
    //     generare S. Segue il trend") — il contro-trend che nutre il trend lo avvantaggia; vale anche con la Ying vuota
    //     (su quella carta la Ying Zi e' vuota). Il carattere dello Shi conta come nella regola 11.
    //     Estensioni DI CLAUDE non dette da Edu (Shi che genera la Ying, controlli fra le sedi): dietro c.sediTutte, spente.
    // la Ying bloccata dal giorno (combinata e controllata, regola 22) non genera nessuno (EURUSD 06/10/2026 s112)
    var yBloccata = c.bloccoGiorno !== false && c.dayBranch && COMBINA[c.dayBranch] === Y.ramo && KE[WX[c.dayBranch]] === WX[Y.ramo];
    if (c.yGeneraS !== false && !yBloccata && !(colpoFuori === 'S' && mob.pos === R.ying) && GEN[WX[Y.ramo]] === WX[S.ramo]) { pt.S += segno(S, true); out.racconto.push('la Ying genera lo Shi: il trend è nutrito'); }
    if (c.sediTutte) {
      var eS = WX[S.ramo], eY = WX[Y.ramo];
      if (GEN[eS] === eY) { pt.Y += segno(Y, true); out.racconto.push('lo Shi genera la Ying (estensione di Claude)'); }
      if (KE[eY] === eS) { pt.S += segno(S, false); out.racconto.push('la Ying controlla lo Shi (estensione di Claude)'); }
      if (KE[eS] === eY) { pt.Y += segno(Y, false); out.racconto.push('lo Shi controlla la Ying (estensione di Claude)'); }
    }
    // 16 (Edu, 09/10/2026, S55, EURGBP 07/10/2026 s84: "proprio il fatto che il mese è una G che si combina con S gli
    //    garantisce la vittoria"): il mese che e' una G e si combina con lo Shi lo avvantaggia. Estensione DI CLAUDE (anche la
    //    W, anche la Ying) dietro c.meseTutte, spenta.
    var palE = null;
    R.linee.forEach(function (Lx) { if (palE) return; var ex = WX[Lx.ramo];
      if (Lx.par === 'B') palE = ex; else if (Lx.par === 'G') palE = KE[ex];
      else if (Lx.par === 'P') palE = GEN[ex];
      else if (Lx.par === 'C') palE = Object.keys(GEN).filter(function (z) { return GEN[z] === ex; })[0];
      else if (Lx.par === 'W') palE = Object.keys(KE).filter(function (z) { return KE[z] === ex; })[0]; });
    if (palE && c.monthBranch) {
      var parMese = KE[mE] === palE ? 'G' : KE[palE] === mE ? 'W' : null;
      [['S', S, 'lo Shi'], ['Y', Y, 'la Ying']].forEach(function (q) {
        if (q[0] === 'Y' && !c.meseTutte) return;
        if (COMBINA[c.monthBranch] !== q[1].ramo) return;
        if (parMese === 'G' || (parMese === 'W' && c.meseTutte)) { pt[q[0]] += 1; out.racconto.push('il mese è una ' + parMese + ' che si combina con ' + q[2] + ': gli garantisce la vittoria'); }
      });
    }
    // 20 (Edu, 10/10/2026, S55, AUDUSD 05/10/2026 s69: "Il motivo per cui Y vince in un confronto di parità con S è dato dal
    //    trigono stagionale fra Y, il giorno e L2"): il raduno stagionale (三會: Hai-Zi-Chou Acqua, Yin-Mao-Chen Legno,
    //    Si-Wu-Wei Fuoco, Shen-You-Xu Metallo) chiuso da una sede, dal ramo del giorno e da un'altra linea avvantaggia la sede.
    //    Su quella carta lo Shi Chou (L4) e la Ying Chou (L1) potrebbero chiudere lo stesso raduno col giorno Zi e L2 Hai:
    //    vince la Ying, perche' a chiudere con lei e' L2, la MOBILE, nel suo stesso trigramma (lo Shi Chou sta nell'altro trigramma). Stesso trigramma
//    CONFERMATO da Edu (10/10/2026: "Hai sta nel trigramma dello Y quindi il raduno vale per Y e non per S"). Resta DI CLAUDE
//    che a chiudere debba essere la mobile (col suo ramo, o col suo arrivo se arriva) e non una linea ferma; non vuota.
    //    Sostituisce lo spareggio con le bestie (cancellato da Edu il 10/10/2026). c.radunoGiorno === false spegne.
    var RADUNO = {};
    [['Water',['亥','子','丑']],['Wood',['寅','卯','辰']],['Fire',['巳','午','未']],['Metal',['申','酉','戌']]].forEach(function (t) { t[1].forEach(function (b) { RADUNO[b] = t[1]; }); });
    if (c.radunoGiorno !== false && c.dayBranch) [['S', S, R.shi, 'lo Shi'], ['Y', Y, R.ying, 'la Ying']].forEach(function (q) {
      var L = q[1], sp = q[2], gr = RADUNO[L.ramo];
      if (L.vuoto || !gr || gr.indexOf(c.dayBranch) < 0 || c.dayBranch === L.ramo) return;
      var terzo = gr.filter(function (b) { return b !== L.ramo && b !== c.dayBranch; })[0];
      // a chiudere e' la MOBILE (su quella carta L2, ferma perche' legata: conta col suo ramo; se arriva, anche col suo arrivo)
      var mobRami = [dep]; if (arr && !R.mutante.movimentoNullo && !legataDa) mobRami.push(arr);
      var stessoTrig = (mob.pos <= 3) === (sp <= 3);
      var chiude = (mob.pos !== sp && stessoTrig && !mob.vuoto && mobRami.indexOf(terzo) >= 0) ? mob.pos : null;
      if (chiude) { pt[q[0]] += segno(L, true); out.racconto.push(q[3] + ', il giorno ' + c.dayBranch + ' e L' + chiude + ' ' + terzo + ' chiudono il raduno stagionale: ' + q[3] + ' è avvantaggiat' + (q[0] === 'S' ? 'o' : 'a')); }
    });
    // 23 (Edu, 10/10/2026, S55, GBPUSD 07/10/2026 s132: "S è forte ma viene indebolito da L2 che gli sta vicino e dal giorno"):
    //    il giorno che drena la sede (la sede genera il giorno) INSIEME alla linea ferma, non vuota, ACCANTO alla sede che la
    //    drena la indeboliscono (-1, una volta sola). Il giorno da solo non basta (NZDUSD 07/10/2026 s56). Perimetro DI CLAUDE, tenuto dalle carte gia' lette:
    //    la vicina da sola non basta (EURUSD 05/10/2026 s112, L2 Si accanto allo Shi Mao); la sede che e' il ramo stesso del
    //    mese non si lascia drenare (GBPUSD 15/12/2022 s124, Ying Zi nel mese Zi); la mobile non conta qui (agisce col suo
    //    arrivo). c.drenaggio === false spegne.
    if (c.drenaggio !== false) [['S', S, R.shi, 'lo Shi'], ['Y', Y, R.ying, 'la Ying']].forEach(function (q) {
      var L = q[1], sp = q[2], e = WX[L.ramo];
      // la debolezza ferma non annulla il nutrimento portato da un movimento (Edu, EURJPY 07/09/2026: "Anche se entrambi sono
      // deboli tuttavia Y si muove per generare S")
      if (nutrito[q[0]]) return;
      if (L.ramo === c.monthBranch) return;   // la sede che e' il ramo stesso del mese non si lascia drenare (GBPUSD 15/12/2022, come 7b)
      if (!(c.dayBranch && GEN[e] === WX[c.dayBranch])) return;   // senza il giorno che drena, la vicina da sola non basta (EURUSD 05/10/2026)
      // il giorno da solo non basta (NZDUSD 07/10/2026 s56: lo Shi Zi drenato dal giorno Yin resta "vibrante di suo"):
      // serve anche la linea ferma accanto che lo drena, come L2 Yin in GBPUSD 07/10/2026 -> un solo -1 per tutti e due.
      var vicina = [sp - 1, sp + 1].filter(function (p) {
        if (p < 1 || p > 6 || p === mob.pos || (R.incompatibili || []).indexOf(p) >= 0) return false;
        var V = R.linee[p - 1]; return !V.vuoto && GEN[e] === WX[V.ramo];
      })[0];
      if (vicina) { pt[q[0]] -= 1; out.racconto.push('il giorno ' + c.dayBranch + ' e L' + vicina + ' ' + R.linee[vicina - 1].ramo + ', accanto, drenano ' + q[3] + ': indebolit' + (q[0] === 'S' ? 'o' : 'a')); }
    });
    // 24 (Edu, 10/10/2026, S55, EURUSD 30/09/2026 s113: "S è molto più forte di Y. Ma non lo vedi da solo?"): la forza
    //    propria delle due sedi nel mese e nel giorno. Mese: stesso elemento +2, la genera +1, lei genera il mese -1, il mese
    //    la controlla -2, lei controlla il mese -1. Giorno: stesso elemento o la genera +1, la controlla o la drena -1. Se una
    //    sede e' MOLTO piu' forte dell'altra (scarto 3 o piu', perimetro DI CLAUDE) e' avvantaggiata (+1). La forza da sola non
    //    dice il verso quando le sedi si equivalgono (Edu, 09/10/2026): conta solo lo squilibrio netto. c.forzaSedi === false spegne.
    var forzaSede = function (L) {
      if (!mE) return 0; var e = WX[L.ramo], f = 0;
      if (e === mE) f += 2; else if (GEN[mE] === e) f += 1; else if (GEN[e] === mE) f -= 1; else if (KE[mE] === e) f -= 2; else if (KE[e] === mE) f -= 1;
      var dE2 = c.dayBranch ? WX[c.dayBranch] : null;
      if (dE2) { if (dE2 === e || GEN[dE2] === e) f += 1; else if (KE[dE2] === e || GEN[e] === dE2) f -= 1; }
      return f;
    };
    // 25 (Edu, 10/10/2026, S55, USDCAD 22/09/2026 s140: "L5 is already strong and moves to generate itself in the S camp. On
    //    Y, or in his camp, nothing happens"): la mobile che non e' una sede, gia' forte (di stagione nel mese) e generata
    //    indietro dal proprio arrivo, rafforza il CAMPO della sede del suo trigramma (+1). c.campo === false spegne.
    if (c.campo !== false && mob.pos !== R.shi && mob.pos !== R.ying && arr && !R.mutante.movimentoNullo && !legataDa && GEN[aE] === dE && timely(mob)) {
      var camp = (mob.pos <= 3) === (R.shi <= 3) ? 'S' : 'Y', CS = camp === 'S' ? S : Y, eC = WX[CS.ramo];
      var PENA2 = { '寅':'巳','巳':'申','申':'寅','丑':'戌','戌':'未','未':'丑','子':'卯','卯':'子' };
      // se l'arrivo colpisce la sede del proprio campo (la controlla, la drena, la punisce) non la rafforza (USDJPY 06/10/2026
      // s157: "L4 si muove per penalizzare Y" — perimetro DI CLAUDE)
      var colpisce = KE[aE] === eC || PENA2[arr] === CS.ramo;   // la controlla o la punisce (il drenaggio no: USDCAD 22/09/2026, Wei con lo Shi Wu)
      if (!colpisce) { pt[camp] += 1; out.racconto.push('L' + mob.pos + ', già forte, si fa generare indietro nel campo ' + (camp === 'S' ? 'dello Shi' : 'della Ying') + ': lo rafforza'); }
    }
    // 24 vale solo se nel resto dell'esagramma non succede nulla (Edu, stessa carta: "On Y, or in his camp, nothing happens"
    // — la forza ferma di una sede non pesa contro un'azione nell'altro campo). c.forzaSempre === true torna alla forma vecchia.
    if (c.forzaSedi !== false && (c.forzaSempre || !tocco.v)) {
      var fS = forzaSede(S), fY = forzaSede(Y), soglia = c.sogliaForza || 3;
      // la sede forte che genera l'altra le passa la forza: nessuno squilibrio (EURUSD 05/10/2026 s112: la Ying Zi forte
      // genera lo Shi Mao, regola 13 — perimetro DI CLAUDE)
      if (GEN[WX[Y.ramo]] === WX[S.ramo] && fY > fS) fY = fS;   // solo in questo verso: lo Shi forte che genera la Ying resta forte (EURUSD 30/09/2026 s113)
      // Il carattere conta come nella regola 11 (perimetro DI CLAUDE, 10/10/2026): la sede P o B molto forte e' una P/B forte,
      // che fa perdere la propria squadra (USDCHF 01/10/2026 s83 lo Shi B Hai, USDCAD 22/09/2026 s140 la Ying P Zi, AUDUSD
      // 24/09/2026 s70 e EURJPY 30/09/2026 s178 la Ying P). SPENTA (c.forzaCarattere === true la accende): rovescia GBPUSD
      // 15/12/2022 s124, dove la Ying P Zi forte vince per Edu. Contraddizione portata a Edu il 10/10/2026.
      var sForza = function (L) { return (c.forzaCarattere === true && (L.par === 'P' || L.par === 'B')) ? -1 : 1; };
      if (fS - fY >= soglia) { pt.S += sForza(S); out.racconto.push('lo Shi è molto più forte della Ying nel mese e nel giorno (' + fS + ' contro ' + fY + ')' + (sForza(S) < 0 ? ', ma è una ' + S.par + ': fa perdere la sua squadra' : '')); }
      else if (fY - fS >= soglia) { pt.Y += sForza(Y); out.racconto.push('la Ying è molto più forte dello Shi nel mese e nel giorno (' + fY + ' contro ' + fS + ')' + (sForza(Y) < 0 ? ', ma è una ' + Y.par + ': fa perdere la sua squadra' : '')); }
    }
    // 27 LETTURA DI CLAUDE DA VALIDARE (10/10/2026, EURJPY 23/08/2026 s185 e NZDUSD 22/09/2026 s57, tutte e due storte
    //    con "la Ying genera lo Shi"): la sede che e' la mobile e arriva nel proprio stesso ramo (伏吟, "il gemito": si muove
    //    senza andare da nessuna parte) e' ferma e sofferente — non rappresenta il suo verso, vince l'altra sede.
    //    SPENTA (c.fuyin === true la accende): sui sei anni scatta su 10 carte, 5 giuste — non regge come l'ho scritta.
    if (c.fuyin === true && dep && dep === R.mutante.futuro[mob.pos - 1] && (mob.pos === R.shi || mob.pos === R.ying)) {
      var kf = mob.pos === R.shi ? 'S' : 'Y', ko = kf === 'S' ? 'Y' : 'S';
      pt[kf] = 0; pt[ko] += 1; out.racconto.push((kf === 'S' ? 'lo Shi' : 'la Ying') + ' si muove nel proprio stesso ramo (gemito): resta ferm' + (kf === 'S' ? 'o' : 'a') + ' e sofferente, vince l\'altra sede (lettura di Claude da validare)');
    }
    // 26 (regola gia' dettata da Edu il 05/10/2026, AUDUSD 30/09/2026 s69: "L4 W non è timely quindi viene eliminata dal
    //    Clash", R82_SEDECLASH/MLSEDECLASH), portata nel metodo del trend il 10/10/2026 da EURJPY 26/08/2026 s185: la sede ferma,
    //    G o W, non vuota, clashata dal giorno e non di stagione nel mese e' eliminata — non rappresenta piu' nulla (zero) e vince
    //    l'altra (+1). c.sedeEliminata === false spegne.
    if (c.sedeEliminata !== false && c.dayBranch) [['S', S, R.shi, 'lo Shi', 'Y'], ['Y', Y, R.ying, 'la Ying', 'S']].forEach(function (q) {
      var L = q[1];
      // come nella regola di Edu: solo G/W, ferma (non la mobile, non un'incompatibile che gira), non vuota
      if (L.vuoto || q[2] === mob.pos || (R.incompatibili || []).indexOf(q[2]) >= 0 || (L.par !== 'G' && L.par !== 'W') || CLASH[c.dayBranch] !== L.ramo || timely(L)) return;
      pt[q[0]] = 0; pt[q[4]] += 1; out.racconto.push(q[3] + ' non è di stagione ed è clashat' + (q[0] === 'S' ? 'o' : 'a') + ' dal giorno ' + c.dayBranch + ': eliminat' + (q[0] === 'S' ? 'o' : 'a') + ', vince l\'altra sede');
    });
    // 22 (Edu, 10/10/2026, S55, GBPUSD 06/10/2026 s132: "S bloccato dal giorno che lo combina e controlla"): la sede che il
    //    giorno combina E controlla e' bloccata: resta fuori dal confronto, non conta nulla di quello che le succede (qui due
    //    pilastri ci cadevano sopra). c.bloccoGiorno === false spegne.
    if (c.bloccoGiorno !== false && c.dayBranch) [['S', S, 'lo Shi'], ['Y', Y, 'la Ying']].forEach(function (q) {
      if (COMBINA[c.dayBranch] === q[1].ramo && KE[WX[c.dayBranch]] === WX[q[1].ramo]) { pt[q[0]] = 0; out.racconto.push(q[2] + ' è bloccat' + (q[0] === 'S' ? 'o' : 'a') + ' dal giorno ' + c.dayBranch + ' che lo combina e lo controlla: fuori dal confronto'); }
    });
    out.shi = pt.S; out.ying = pt.Y; out.punti = pt.S - pt.Y;
    if (out.punti > 0) out.verdetto = 'segue'; else if (out.punti < 0) out.verdetto = 'non segue';
    if (out.verdetto && c.emaDir) out.dir = (c.emaDir === 'up') === (out.verdetto === 'segue') ? 'LONG' : 'SHORT';
    out.racconto.push(out.verdetto ? ('Shi ' + (pt.S > 0 ? '+' : '') + pt.S + ', Ying ' + (pt.Y > 0 ? '+' : '') + pt.Y + ': ' + (out.verdetto === 'segue' ? 'il trend' : 'il contro-trend') + ' è avvantaggiato → ' + out.verdetto + (out.dir ? ' → ' + out.dir : '')) : 'nessuna delle due sedi è avvantaggiata: il metodo tace');
    return out;
  }
  return { leggi: leggi };
}));
