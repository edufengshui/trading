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
// 31. La sede mobile il cui arrivo genera l'altra sede la nutre.
// 32. La sede che si muove per diventare vuota e' scartata completamente: rimane l'altra, che vince (EURJPY 07/09/2026 s181).
// 33. L'arrivo che clasha una linea forte dell'altro trigramma apre uno scontro: vince il piu' forte nel mese e il suo campo
//     (USDJPY 10/08/2026 s157); anche la sede incompatibile che gira nel vuoto e' scartata (32).
// 34. La sede troppo forte (di stagione e sostenuta dal giorno) non si lascia clashare ne' controllare dall'altra sede, e
//     vince (GBPUSD 01/10/2026 s132).
// 35. Il blocco del giorno si scioglie se lo stelo del giorno, forte nella data, fa da passaggio fra il ramo del giorno e
//     la sede: la sede riceve il flusso e vince (GBPUSD 24/09/2026 s132).
// 36. La sede che si muove in un ramo che punisce l'altra sede (anche l'autopunizione) la colpisce, e la sede punita non e'
//     piu' troppo forte (AUDUSD 24/09/2026 s70).
// 37. La mobile generata indietro che genera una sede la nutre; la sede nutrita che controlla l'altra la colpisce, anche se
//     troppo forte (GBPUSD 04/08/2026 s134).
// 38. La sede mobile che retrocede: B/P vince, G/W perde (regole di Edu del 16-17/09, da USDCAD 24/08/2026 s137).
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

  function leggiRegole(R, c) {
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
    // 37 (Edu, 10/10/2026, S55, GBPUSD 04/08/2026 s134: "S cannot move because G Chen is clashed. L1 move to generate back
    //    which generates S. Y is controlled by S. Follow"):
    //    a) la mobile (non sede) che si fa generare indietro e la cui partenza genera una sede la nutre (+1): la forza presa
    //       dalla mobile passa alla sede. Non se retrocede o e' legata, non con una vuota in mezzo (6).
    //    b) la sede nutrita da un movimento che controlla l'altra sede la colpisce (-1), anche se l'altra e' "troppo forte" (34).
    //    Perimetro DI CLAUDE per b: il controllo fermo fra le sedi conta solo se chi controlla e' stata nutrita da un movimento.
    //    c.mobileNutre === false / c.controlloNutrito === false spengono.
    var vinceControllo = { S: false, Y: false };
    if (c.mobileNutre !== false && arr && !R.mutante.movimentoNullo && !legataDa && R.mutante.progressione !== 'retrocedente' && GEN[aE] === dE && mob.pos !== R.shi && mob.pos !== R.ying)
      [['S', S, R.shi, 'lo Shi'], ['Y', Y, R.ying, 'la Ying']].forEach(function (q) {
        if (GEN[dE] !== WX[q[1].ramo] || q[1].vuoto) return;
        for (var qv = Math.min(mob.pos, q[2]) + 1; qv < Math.max(mob.pos, q[2]); qv++) if (R.linee[qv - 1].vuoto) return;
        pt[q[0]] += segno(q[1], true); nutrito[q[0]] = true;
        out.racconto.push('L' + mob.pos + ' si muove per farsi generare indietro e genera ' + q[3]);
      });
    if (c.controlloNutrito !== false) [['S', S, 'Y', Y, 'lo Shi', 'la Ying'], ['Y', Y, 'S', S, 'la Ying', 'lo Shi']].forEach(function (q) {
      if (!nutrito[q[0]] || q[3].vuoto || KE[WX[q[1].ramo]] !== WX[q[3].ramo]) return;
      pt[q[2]] -= 1; vinceControllo[q[2]] = true; out.racconto.push(q[4] + ', nutrit' + (q[0] === 'S' ? 'o' : 'a') + ', controlla ' + q[5]);
    });
    // 38 (regola di Edu del 16/09/2026, USDCHF 16/09/2026 s81: "Quando un B retrocede la propria squadra vince"; e del 17/09:
    //    "un G/W che retrocede porta via il vantaggio e la sua sede perde"), portata nel metodo del trend il 10/10/2026 da
    //    USDCAD 24/08/2026 s137: la SEDE che e' la mobile e retrocede vince se e' una B (o una P: estensione DI CLAUDE al
    //    carattere che fa perdere), perde se e' una G o una W. c.sedeRetro === false spegne.
    if (c.sedeRetro !== false && arr && !legataDa && R.mutante.progressione === 'retrocedente' && (mob.pos === R.shi || mob.pos === R.ying)) {
      var kR = mob.pos === R.shi ? 'S' : 'Y', LR = R.linee[mob.pos - 1], nR = kR === 'S' ? 'lo Shi' : 'la Ying';
      if (LR.par === 'B' || LR.par === 'P') { pt[kR] += 1; out.racconto.push(nR + ', una ' + LR.par + ', retrocede: porta via la perdita, la sua squadra vince'); }
      else if (LR.par === 'G' || LR.par === 'W') { pt[kR] -= 1; out.racconto.push(nR + ', una ' + LR.par + ', retrocede: porta via il vantaggio, perde'); }
    }
    // 36 (Edu, 10/10/2026, S55, AUDUSD 24/09/2026 s70: "S si muove in You che penalizza Y quindi vince il segue"): la sede che
    //    si muove (mobile o incompatibile che gira) e arriva in un ramo che PUNISCE l'altra sede — le punizioni della 17 e
    //    l'autopunizione (Chen, Wu, You, Hai sullo stesso ramo) — la colpisce (-1), e la sede punita non e' piu' "troppo
    //    forte" (34): li' la Ying You era il ramo del mese e la difesa di stagione non vale. c.sedePunisce === false spegne.
    var punita = { S: false, Y: false };
    var PENA36 = { '寅':'巳','巳':'申','申':'寅','丑':'戌','戌':'未','未':'丑','子':'卯','卯':'子' }, AUTOP = { '辰':1,'午':1,'酉':1,'亥':1 };
    if (c.sedePunisce !== false) chi.forEach(function (m) {
      if (!m.arr || m.retro || (m.pos !== R.shi && m.pos !== R.ying) || (m.pos === mob.pos && legataDa)) return;
      var kA = m.pos === R.shi ? 'Y' : 'S', T = kA === 'S' ? S : Y;
      if (T.vuoto) return;
      if (PENA36[m.arr] === T.ramo || (m.arr === T.ramo && AUTOP[T.ramo])) {
        pt[kA] -= 1; punita[kA] = true;
        out.racconto.push((kA === 'S' ? 'la Ying' : 'lo Shi') + ' si muove in ' + m.arr + ' che punisce ' + (kA === 'S' ? 'lo Shi' : 'la Ying') + ': colpit' + (kA === 'S' ? 'o' : 'a'));
      }
    });
    // 31 (Edu, 10/10/2026, S55, EURJPY 07/09/2026 s181: "Anche se entrambi sono deboli tuttavia Y si muove per generare S.
    //    Segue il trend"): la sede che e' la mobile e il cui arrivo genera l'altra sede la nutre (+1, carattere della regola
    //    11). Non con l'arrivo vuoto (vedi 32), non se la mobile e' legata alla partenza o retrocede. c.sedeGeneraSede === false spegne.
    if (c.sedeGeneraSede !== false && arr && !legataDa && R.mutante.casoMut !== -5 && R.mutante.progressione !== 'retrocedente' && (mob.pos === R.shi || mob.pos === R.ying)
        && !R.mutante.movimentoNullo) {
      var altra = mob.pos === R.shi ? ['Y', Y, 'la Ying'] : ['S', S, 'lo Shi'];
      if (GEN[aE] === WX[altra[1].ramo] && !altra[1].vuoto) { pt[altra[0]] += segno(altra[1], true); nutrito[altra[0]] = true; out.racconto.push((mob.pos === R.shi ? 'lo Shi' : 'la Ying') + ' si muove in ' + arr + ' per generare ' + altra[2]); }
    }
    // 33 (Edu, 10/10/2026, S55, USDJPY 10/08/2026 s157: "L1 si muove per clashare L4. Il risultato però è che essendo L4 molto
    //    più forte vince lo scontro facendo vincere Y"): l'arrivo della mobile che clasha una linea ferma (non sede, non vuota)
    //    dell'ALTRO trigramma apre uno scontro: vince chi e' molto piu' forte nel mese (scarto 3 o piu', perimetro DI CLAUDE),
    //    e vince il CAMPO di chi vince (+1). c.scontro === false spegne.
    var fLin = function (ramo) { var ex = WX[ramo]; if (!mE) return 0; return ex === mE ? 2 : GEN[mE] === ex ? 1 : GEN[ex] === mE ? -1 : KE[mE] === ex ? -2 : KE[ex] === mE ? -1 : 0; };
    if (c.scontro !== false && arr && !R.mutante.movimentoNullo && !legataDa) {
      var Tc = R.linee.filter(function (Lx) { return Lx.pos !== mob.pos && Lx.pos !== R.shi && Lx.pos !== R.ying && !Lx.vuoto && CLASH[arr] === Lx.ramo && ((Lx.pos <= 3) !== (mob.pos <= 3)); })[0];
      if (Tc) {
        var fA = fLin(arr), fT = fLin(Tc.ramo), campM = (mob.pos <= 3) === (R.shi <= 3) ? 'S' : 'Y', campT = campM === 'S' ? 'Y' : 'S';
        if (fT - fA >= 3) { pt[campT] += 1; out.racconto.push('L' + mob.pos + ' si muove in ' + arr + ' per clashare L' + Tc.pos + ' ' + Tc.ramo + ', molto più forte: vince lo scontro e il campo ' + (campT === 'S' ? 'dello Shi' : 'della Ying')); }
        else if (fA - fT >= 3) { pt[campM] += 1; out.racconto.push('L' + mob.pos + ' si muove in ' + arr + ' per clashare L' + Tc.pos + ' ' + Tc.ramo + ' e vince lo scontro: vince il campo ' + (campM === 'S' ? 'dello Shi' : 'della Ying')); }
      }
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
    var palE = null; var garanzia = null;   // 16 "gli garantisce la vittoria": decide alla fine (perimetro DI CLAUDE, GBPUSD 04/08/2026 s134)
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
        if (parMese === 'G' || (parMese === 'W' && c.meseTutte)) { pt[q[0]] += 1; garanzia = q[0]; out.racconto.push('il mese è una ' + parMese + ' che si combina con ' + q[2] + ': gli garantisce la vittoria'); }
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
      // anche la sede che e' la MOBILE clashata alla partenza dal giorno (regola di Edu del 04-05/10/2026, R80_DANNOGIORNO:
      // "se il giorno clasha una mobile alla partenza la linea è danneggiata ... il giorno elimina solo la G/W che NON è
      // timely"), portata qui da GBPUSD 06/08/2026 s134; non se la combina il giorno (protetta, EURJPY 01/10/2026)
      var eMob = q[2] === mob.pos && c.mobileEliminata !== false && COMBINA[c.dayBranch] !== L.ramo;
      if (L.vuoto || (q[2] === mob.pos && !eMob) || (R.incompatibili || []).indexOf(q[2]) >= 0 || (L.par !== 'G' && L.par !== 'W') || CLASH[c.dayBranch] !== L.ramo || timely(L)) return;
      pt[q[0]] = 0; pt[q[4]] = Math.max(pt[q[4]], 0) + 1; out.racconto.push(q[3] + ' non è di stagione ed è clashat' + (q[0] === 'S' ? 'o' : 'a') + ' dal giorno ' + c.dayBranch + ': eliminat' + (q[0] === 'S' ? 'o' : 'a') + ', vince l\'altra sede');
    });
    // 22 (Edu, 10/10/2026, S55, GBPUSD 06/10/2026 s132: "S bloccato dal giorno che lo combina e controlla"): la sede che il
    //    giorno combina E controlla e' bloccata: resta fuori dal confronto, non conta nulla di quello che le succede (qui due
    //    pilastri ci cadevano sopra). c.bloccoGiorno === false spegne.
    if (c.bloccoGiorno !== false && c.dayBranch) [['S', S, 'lo Shi'], ['Y', Y, 'la Ying']].forEach(function (q) {
      if (COMBINA[c.dayBranch] === q[1].ramo && KE[WX[c.dayBranch]] === WX[q[1].ramo]) {
        // 35 (Edu, 10/10/2026, S55, GBPUSD 24/09/2026 s132: "S è bloccato dal giorno ma poiché lo stelo del giorno è Xin (e il
        //    metallo è forte nella data), S beneficia del flusso terra --> metallo --> acqua che non può essere indebolito dalla
        //    debole avanzante L2, né dal Clash o dall'autogenerazione di Y"): se lo STELO del giorno e' l'elemento di passaggio
        //    (generato dal ramo del giorno, genera la sede) ed e' forte nella data (lo stesso elemento del mese — perimetro DI
        //    CLAUDE), la sede non e' bloccata: riceve il flusso, vince, e l'altra sede non la indebolisce (i suoi punti non
        //    contano). c.flussoStelo === false spegne.
        var eSt = STELO_EL[c.dayStem], other = q[0] === 'S' ? 'Y' : 'S';
        if (c.flussoStelo !== false && eSt && GEN[WX[c.dayBranch]] === eSt && GEN[eSt] === WX[q[1].ramo] && eSt === mE) {
          if (pt[q[0]] < 0) pt[q[0]] = 0; pt[q[0]] += 1; if (pt[other] > 0) pt[other] = 0;
          out.racconto.push(q[2] + ' è legat' + (q[0] === 'S' ? 'o' : 'a') + ' dal giorno ' + c.dayBranch + ', ma lo stelo ' + c.dayStem + ', forte nella data, fa scorrere il flusso ' + WX[c.dayBranch] + ' → ' + eSt + ' → ' + WX[q[1].ramo] + ': ' + q[2] + ' ne beneficia e non si lascia indebolire');
          return;
        }
        pt[q[0]] = 0; out.racconto.push(q[2] + ' è bloccat' + (q[0] === 'S' ? 'o' : 'a') + ' dal giorno ' + c.dayBranch + ' che lo combina e lo controlla: fuori dal confronto');
      }
    });
    // 34 (Edu, 10/10/2026, S55, GBPUSD 01/10/2026 s132: "S è troppo forte, non può essere clashato con successo da Y, né
    //    controllato da Y se questo è generato indietro. Vince il segue"): la sede TROPPO FORTE — di stagione nel mese e
    //    sostenuta dal giorno (stesso elemento o generata; perimetro DI CLAUDE dalla carta: Zi nel mese You col giorno Shen) —
    //    non si lascia clashare ne' controllare dall'altra sede, nemmeno se quella si rafforza: quello che l'altra ha preso non
    //    conta e vince la sede forte (+1). c.troppoForte === false spegne.
    var tForte = function (L) { var e = WX[L.ramo], dE3 = c.dayBranch ? WX[c.dayBranch] : null; return !L.vuoto && timely(L) && !!dE3 && (dE3 === e || GEN[dE3] === e); };
    if (c.troppoForte !== false) [['S', S, 'Y', Y, 'lo Shi'], ['Y', Y, 'S', S, 'la Ying']].forEach(function (q) {
      var A = q[1], B = q[3]; if (!tForte(A) || tForte(B) || punita[q[0]] || vinceControllo[q[0]]) return;
      var eA = WX[A.ramo], eB = WX[B.ramo];
      var mB = chi.filter(function (m) { return m.pos === (q[2] === 'S' ? R.shi : R.ying) && m.arr; })[0];
      var attacca = KE[eB] === eA || (mB && (CLASH[mB.arr] === A.ramo || KE[WX[mB.arr]] === eA));
      if (!attacca) return;
      if (pt[q[2]] > 0) pt[q[2]] = 0; pt[q[0]] += 1;
      out.racconto.push(q[4] + ' è troppo fort' + (q[0] === 'S' ? 'e' : 'e') + ' (di stagione e sostenut' + (q[0] === 'S' ? 'o' : 'a') + ' dal giorno): l\'altra sede non riesce a colpirl' + (q[0] === 'S' ? 'o' : 'a') + ', vince lei');
    });
    // 16 come garanzia: la sede col mese G che la combina vince comunque (SPENTA, c.garanzia === true: decisiva su 11 carte ne prende 4)
    if (garanzia && c.garanzia === true) { var gO = garanzia === 'S' ? 'Y' : 'S'; if (pt[garanzia] <= pt[gO]) { pt[garanzia] = pt[gO] + 1; out.racconto.push('il mese G combinato garantisce la vittoria: vince ' + (garanzia === 'S' ? 'lo Shi' : 'la Ying')); } }
    // 32 (Edu, 10/10/2026, S55, EURJPY 07/09/2026 s181: "Y si muove per diventare vuota quindi viene scartata completamente.
    //    Rimane S che vince"; stessa regola dell'08/10/2026, USDJPY 02/10/2024): la sede che e' la mobile e arriva nel vuoto e'
    //    scartata — zero — e l'altra sede vince (almeno +1). Non se la mobile e' legata alla partenza. c.sedeVuotaScartata === false spegne.
    // anche la sede INCOMPATIBILE che gira nel vuoto (Edu, USDJPY 10/08/2026 s157: "S si muove per diventare vuota e perderebbe")
    var sedeNelVuoto = null, arrV = null;
    // l'arrivo vuoto clashato dal giorno esce dal vuoto (Edu, 22/09/2026, USDCAD 21/09/2026 s139): non e' vuoto
    var vuotoVero = function (b) { return R.vuoti.indexOf(b) >= 0 && !(c.dayBranch && CLASH[c.dayBranch] === b); };
    if (c.sedeVuotaScartata !== false && R.vuoti) {
      if (arr && !legataDa && (mob.pos === R.shi || mob.pos === R.ying) && vuotoVero(arr)) { sedeNelVuoto = mob.pos; arrV = arr; }
      else chi.forEach(function (m) { if (!sedeNelVuoto && m.pos !== mob.pos && (m.pos === R.shi || m.pos === R.ying) && m.arr && vuotoVero(m.arr)) { sedeNelVuoto = m.pos; arrV = m.arr; } });
    }
    if (sedeNelVuoto) {
      var arr0 = arrV, kS = sedeNelVuoto === R.shi ? 'S' : 'Y', kO = kS === 'S' ? 'Y' : 'S';
      pt[kS] = 0; if (pt[kO] < 1) pt[kO] = 1;
      out.racconto.push((kS === 'S' ? 'lo Shi' : 'la Ying') + ' si muove per diventare vuot' + (kS === 'S' ? 'o' : 'a') + ' (' + arr0 + '): scartat' + (kS === 'S' ? 'o' : 'a') + ' completamente, rimane ' + (kO === 'S' ? 'lo Shi' : 'la Ying') + ' che vince');
    }
    out.shi = pt.S; out.ying = pt.Y; out.punti = pt.S - pt.Y;
    if (out.punti > 0) out.verdetto = 'segue'; else if (out.punti < 0) out.verdetto = 'non segue';
    if (out.verdetto && c.emaDir) out.dir = (c.emaDir === 'up') === (out.verdetto === 'segue') ? 'LONG' : 'SHORT';
    out.racconto.push(out.verdetto ? ('Shi ' + (pt.S > 0 ? '+' : '') + pt.S + ', Ying ' + (pt.Y > 0 ? '+' : '') + pt.Y + ': ' + (out.verdetto === 'segue' ? 'il trend' : 'il contro-trend') + ' è avvantaggiato → ' + out.verdetto + (out.dir ? ' → ' + out.dir : '')) : 'nessuna delle due sedi è avvantaggiata: il metodo tace');
    return out;
  }

  // ======================================================================================================================
  // IL METODO DEL TREND A QUATTRO PRINCIPI (Edu, 10/10/2026, S55: "Ok procedi") — riscrittura delle regole 1-38 sui principi
  // che tornano in tutte le letture di Edu. Ordine di lettura: 1 chi esce dal gioco -> 2 cosa fa il movimento a S e Y, con la
  // forza nel mese che decide se il colpo riesce (3) -> 4 la forza ferma conta solo se nessun movimento decide.
  // Lo Shi e' il trend, la Ying il contro-trend: vince chi esce avvantaggiato. c.versione === 'regole' usa la lettura vecchia.
  // ======================================================================================================================
  var PENA = { '寅':'巳','巳':'申','申':'寅','丑':'戌','戌':'未','未':'丑','子':'卯','卯':'子' }, AUTOP = { '辰':1,'午':1,'酉':1,'亥':1 };
  var TOMBA = { Water:'辰', Wood:'未', Fire:'戌', Metal:'丑' };
  var RETRO = { '卯':'寅','午':'巳','酉':'申','子':'亥','丑':'戌','辰':'丑','未':'辰','戌':'未' };
  var RADUNO = {};
  [['Water',['亥','子','丑']],['Wood',['寅','卯','辰']],['Fire',['巳','午','未']],['Metal',['申','酉','戌']]].forEach(function (t) { t[1].forEach(function (b) { RADUNO[b] = t[1]; }); });
  var ELB = { '青龍':'Wood','朱雀':'Fire','勾陳':'Earth','螣蛇':'Earth','白虎':'Metal','玄武':'Water' };

  function leggiPrincipi(R, c) {
    c = c || {};
    var out = { punti: 0, shi: 0, ying: 0, verdetto: null, dir: null, racconto: [], principio: null };
    var dire = function (t) { out.racconto.push(t); };
    if (!R || R.error || !R.mutante || !R.mutante.pos) { dire('nessuna mobile: il metodo tace'); return out; }
    // IL VUOTO DI STAGIONE NON E' VUOTO (Edu, 11/10/2026, S56, EURUSD 30/08/2023 s108: "Certo Zi è vuoto ma è anche
    // estremamente timely. Non si può trattare una linea vuota timely come una untimely, quindi adatta le regole a riguardo"):
    // nel metodo del trend un ramo vuoto di stagione nel mese (stesso elemento del mese o generato dal mese) non e' trattato
    // come vuoto — ne' sulle linee, ne' negli arrivi, ne' nei pilastri delle bestie. Resta vuoto solo il ramo fuori stagione.
    // c.vuotoTimely === false torna alla forma vecchia.
    var mE0 = c.monthBranch ? WX[c.monthBranch] : null, diStag = function (b) { var e = WX[b]; return !!mE0 && (e === mE0 || GEN[mE0] === e); };
    // PRECISATO (Edu, 12/10/2026, S56, da USDJPY 21/10/2024 s149): "Se la linea è vuota ma timely e si muove (includendo
    // l'arrivo) non è più vuota. Ma una linea timely ferma rimane vuota". Quindi escono dal vuoto di stagione solo le linee
    // che si MUOVONO (la mobile e le incompatibili che girano) e gli arrivi (il filtro su R.vuoti, che governa gli arrivi e
    // i rami dei pilastri); le linee FERME vuote restano vuote anche di stagione.
    if (c.vuotoTimely !== false && c.vuotoTimely !== 'arrivo' && c.monthBranch) {
      var _futV = (R.mutante && R.mutante.futuro) || [];
      var _siMuove = function (L) { return L.pos === R.mutante.pos || ((R.incompatibili || []).indexOf(L.pos) >= 0 && _futV[L.pos - 1] && _futV[L.pos - 1] !== L.ramo); };
      R = Object.assign({}, R, {
        linee: R.linee.map(function (L) { return (L.vuoto && diStag(L.ramo) && _siMuove(L)) ? Object.assign({}, L, { vuoto: false, vuotoDiStagione: true }) : L; }),
        vuoti: (R.vuoti || []).filter(function (b) { return !diStag(b); })
      });
    }
    var S = R.linee[R.shi - 1], Y = R.linee[R.ying - 1], mob = R.linee[R.mutante.pos - 1];
    var SEDE = { S: S, Y: Y }, POS = { S: R.shi, Y: R.ying }, NOME = { S: 'lo Shi', Y: 'la Ying' }, ALTRA = { S: 'Y', Y: 'S' };
    var mE = c.monthBranch ? WX[c.monthBranch] : null, dB = c.dayBranch, dEl = dB ? WX[dB] : null;
    var inc = R.incompatibili || [], vuoti = R.vuoti || [];
    var timely = function (L) { var e = WX[L.ramo]; return !!mE && (e === mE || GEN[mE] === e); };
    var troppoFuori = function (L) { var e = WX[L.ramo]; return !!mE && (KE[mE] === e || KE[e] === mE); };
    var arrForte = function (b) { var e = WX[b]; return !!mE && (e === mE || GEN[mE] === e); };
    var vuotoVero = function (b) { return vuoti.indexOf(b) >= 0 && !(dB && CLASH[dB] === b); };          // il giorno che clasha fa uscire dal vuoto
    // variante 'arrivo' (Edu, 11/10/2026, prova: "Per fare uscire dal vuoto potrebbe bastare che la linea vuota sia l'arrivo"):
    // solo l'ARRIVO vuoto di stagione esce dal vuoto; le linee ferme vuote restano vuote anche di stagione.
    var arrVuoto = function (b) { return vuotoVero(b) && !(c.vuotoTimely === 'arrivo' && diStag(b)); };
    var campo = function (pos) { return (pos <= 3) === (R.shi <= 3) ? 'S' : 'Y'; };
    var segnoNutri = function (L) { return (L.par === 'P' || L.par === 'B') ? -1 : 1; };                    // nutrire una P/B la rovescia
    var vuotaInMezzo = function (a, b) { for (var q = Math.min(a, b) + 1; q < Math.max(a, b); q++) if (R.linee[q - 1].vuoto) return true; return false; };
    var _p = { S: 0, Y: 0 }, pt = {}, mosso = { v: false };
    ['S', 'Y'].forEach(function (k) { Object.defineProperty(pt, k, { get: function () { return _p[k]; }, set: function (v) { if (v !== _p[k]) mosso.v = true; _p[k] = v; } }); });
    var vince = function (k, perche, princ) { out.principio = princ; dire(perche); _p[k] = 1; _p[ALTRA[k]] = 0; return chiudi(); };
    function chiudi() {
      out.shi = _p.S; out.ying = _p.Y; out.punti = _p.S - _p.Y;
      if (out.punti > 0) out.verdetto = 'segue'; else if (out.punti < 0) out.verdetto = 'non segue';
      if (out.verdetto && c.emaDir) out.dir = (c.emaDir === 'up') === (out.verdetto === 'segue') ? 'LONG' : 'SHORT';
      dire(out.verdetto ? ('Shi ' + (_p.S > 0 ? '+' : '') + _p.S + ', Ying ' + (_p.Y > 0 ? '+' : '') + _p.Y + ': ' + (out.verdetto === 'segue' ? 'il trend' : 'il contro-trend') + ' è avvantaggiato → ' + out.verdetto + (out.dir ? ' → ' + out.dir : '')) : 'nessuna delle due sedi è avvantaggiata: il metodo tace');
      return out;
    }

    // ---------------- PRINCIPIO 1: CHI ESCE DAL GIOCO ----------------
    if (troppoFuori(S) && troppoFuori(Y)) { dire('Shi e Ying tutti e due troppo fuori stagione: il metodo tace'); return out; }
    // chi si muove: la mobile (se non e' legata alla partenza dal mese o dal giorno) e le incompatibili che girano
    var dep = R.mutante.ramoDep, arr = R.mutante.ramoArr, fut = R.mutante.futuro || [];
    var legata = function (b) { return COMBINA[b] === c.monthBranch ? 'mese' : (dB && COMBINA[b] === dB) ? 'giorno' : null; };
    var chi = [];
    var lm = legata(dep);
    // LA SEDE MOBILE ROTTA DAL MESE NON SI MUOVE (Edu, 11/10/2026, S56, EURUSD 17/06/2020 s112: "As Y cannot move
    // there's no possible competition"): la sede mobile con la partenza clashata dal mese (月破, rotta dal mese) non puo'
    // muoversi — nessuno scontro possibile fra le sedi. PERIMETRO DI CLAUDE, da confermare: il blocco vale solo quando poi
    // il flusso di Qi della data trova la via e decide (vedi sotto); se il flusso tace, la carta resta alla lettura di
    // prima (col blocco sempre acceso 19 carte del backtest girano da 9 giuste a 5). c.rottaMese === false spegne.
    var rottaMese = c.rottaMese !== false && !lm && (mob.pos === R.shi || mob.pos === R.ying) && c.monthBranch && CLASH[c.monthBranch] === dep;
    if (lm) dire('la mobile L' + mob.pos + ' è combinata alla partenza dal ' + lm + ': non si muove');
    else if (arr && (!R.mutante.movimentoNullo || R.mutante.motivoNullo === 'arrival void'))
      chi.push({ pos: mob.pos, dep: dep, arr: arr, retro: R.mutante.progressione === 'retrocedente', incArr: R.mutante.casoMut === -5, mobile: true });
    inc.forEach(function (p) {
      var L = R.linee[p - 1], a = fut[p - 1]; if (!L || !a || a === L.ramo) return;
      var lg = legata(L.ramo); if (lg) { dire('l\'incompatibile L' + p + ' è combinata alla partenza dal ' + lg + ': non gira'); return; }
      chi.push({ pos: p, dep: L.ramo, arr: a, retro: RETRO[L.ramo] === a, incArr: false, mobile: false });
    });
    // confusione totale di un trigramma: troppa confusione
    if (fut.length) for (var tg = 0; tg < 2; tg++) {
      var tr = tg === 0 ? [1, 2, 3] : [4, 5, 6];
      if (tr.some(function (p) { return chi.some(function (m) { return m.pos === p; }); }) && tr.every(function (p) { return CLASH[R.linee[p - 1].ramo] === fut[p - 1]; })) { dire('il trigramma ' + (tg ? 'alto' : 'basso') + ' è in confusione totale: il metodo tace'); return out; }
    }
    // I TRIANGOLI DEI TRIGRAMMI (Edu, 11/10/2026, S56, EURUSD 30/08/2023 s108: "The lower Gua has a water triangle with
    // Shen (day and month), Zi and Chen. The upper Gua has a wood triangle with Hai (hour), Mao and Wei. Upper wins, not
    // follow"): due linee di un trigramma e un pilastro della data chiudono un trigono (三合); il trigono vale per la sede di
    // quel trigramma, anche con linee vuote e con la sede che si muove nel vuoto (su quella carta L1 Zi e' vuota e la Ying
    // Mao si muove nel vuoto). Se tutti e due i trigrammi hanno il loro trigono, vince chi viene generato o chi controlla
    // (la stessa regola del confronto delle bestie, EURJPY 07/09/2026): li' l'Acqua del basso genera il Legno dell'alto.
    // Perimetro DI CLAUDE: la SEDE e' una delle due linee del trigono (su EURJPY 26/08/2026 s185 i trigoni non toccano le sedi
    // e la carta resta alla regola della G eliminata dal clash); le due linee e il pilastro sono tre rami diversi del trigono; conta col ramo fermo delle linee
    // (non con gli arrivi); con un trigono solo (c.triangoliUno === true) vince il suo campo — non detto da Edu, spento.
    // c.triangoli === false spegne.
    if (c.triangoli !== false) {
      var pilR = [c.yearBranch, c.monthBranch, dB, c.oraBranch].filter(Boolean);
      var triTrig = function (k) {
        var tr = (POS[k] <= 3) ? [1, 2, 3] : [4, 5, 6], rami = tr.map(function (p) { return R.linee[p - 1].ramo; });
        for (var i = 0; i < rami.length; i++) {
          var T = TRINE[rami[i]]; if (!T) continue;
          var dentro = T.filter(function (b) { return rami.indexOf(b) >= 0; });
          if (dentro.length < 2 || dentro.indexOf(SEDE[k].ramo) < 0) continue;   // la sede deve stare nel trigono
          var manca = T.filter(function (b) { return rami.indexOf(b) < 0; });
          if (manca.length === 1 && pilR.indexOf(manca[0]) >= 0) return { el: WX[T[1]], rami: dentro, pil: manca[0] };
        }
        return null;
      };
      var tS = triTrig('S'), tY = triTrig('Y');
      var nomeT = function (k, t) { return 'il trigramma ' + (POS[k] <= 3 ? 'basso' : 'alto') + ' chiude il trigono ' + t.el + ' con ' + t.rami.join(' e ') + ' e il pilastro ' + t.pil; };
      if (tS && tY && tS.el !== tY.el) {
        var vS = GEN[tY.el] === tS.el || KE[tS.el] === tY.el, vY = GEN[tS.el] === tY.el || KE[tY.el] === tS.el;
        if (vS !== vY) { dire(nomeT('S', tS)); dire(nomeT('Y', tY)); return vince(vS ? 'S' : 'Y', 'il trigono ' + (vS ? 'dello Shi' : 'della Ying') + (vS ? (GEN[tY.el] === tS.el ? ' viene generato dall\'altro' : ' controlla l\'altro') : (GEN[tS.el] === tY.el ? ' viene generato dall\'altro' : ' controlla l\'altro')) + ': vince ' + (vS ? 'lo Shi' : 'la Ying'), 1); }
      } else if (c.triangoliUno === true && (tS ? !tY : tY)) {
        var kT1 = tS ? 'S' : 'Y'; dire(nomeT(kT1, tS || tY)); return vince(kT1, 'solo ' + (kT1 === 'S' ? 'lo Shi' : 'la Ying') + ' ha il trigono del suo trigramma: vince', 1);
      }
    }
    // IL FLUSSO DI QI DELLA DATA (Edu, 11/10/2026, S56, EURUSD 17/06/2020 s112: "As Y cannot move there's no possible
    // competition. The beasts are not helping so we use the Qi flow. In the date the Qi goes from water to wood, then to
    // fire. This fire generates L5 which generates L4 Shen metal which wins"): con la sede mobile rotta dal mese e
    // nient'altro che si muove, le sedi non si scontrano; li' le bestie non aiutano (la Tigre cade su L1 vuota e il
    // pilastro del mese ha il ramo vuoto), e decide il flusso di Qi. I rami dei pilastri si mettono in catena di
    // generazione (Acqua dell'anno → Legno del giorno e dell'ora → Fuoco del mese, anche se vuoto); l'elemento finale
    // entra nell'esagramma sulla linea NON vuota che genera, e di linea in linea la generazione prosegue finché il giro
    // dei cinque elementi si chiude: l'ultima linea vince per il suo campo (li' Fuoco → L5 Xu Terra → L4 Shen Metallo,
    // campo della Ying → non segue → SHORT, il mercato conferma). Perimetro DI CLAUDE: la catena della data deve avere un
    // solo inizio (un solo elemento non generato dagli altri presenti); a ogni passo nell'esagramma la linea candidata
    // non vuota dev'essere una sola (se sono due o nessuna la via tace); se la via tace si torna alle altre regole;
    // il flusso NON entra su una linea vuota nemmeno se di stagione (su quella carta L1 Wei e' vuota ma di stagione, e
    // Edu ha fatto entrare il Fuoco su L5, non su L1: per ricevere il flusso il vuoto resta vuoto — DA CONFERMARE).
    // c.flussoQi === false spegne.
    if (rottaMese && !chi.some(function (m) { return m.pos !== mob.pos; }) && c.flussoQi !== false) {
      var fq = (function () {
        var ramiD = [c.yearBranch, c.monthBranch, dB, c.oraBranch].filter(Boolean);
        var elsD = []; ramiD.forEach(function (b) { var e = WX[b]; if (e && elsD.indexOf(e) < 0) elsD.push(e); });
        var inizi = elsD.filter(function (e) { return !elsD.some(function (x) { return x !== e && GEN[x] === e; }); });
        if (inizi.length !== 1) return null;
        var cur = inizi[0], visti = [cur], passi = [];
        while (visti.length < 5) {
          var nx = GEN[cur]; if (visti.indexOf(nx) >= 0) break;
          if (elsD.indexOf(nx) >= 0) { cur = nx; visti.push(nx); continue; }        // il passo resta nella data
          var cand = R.linee.filter(function (Lx) { return !Lx.vuoto && !Lx.vuotoDiStagione && WX[Lx.ramo] === nx; });
          if (cand.length !== 1) break;
          passi.push(cand[0]); cur = nx; visti.push(nx);
        }
        if (!passi.length) return null;
        var fin = passi[passi.length - 1], kF = campo(fin.pos);
        return { k: kF, t: 'il flusso di Qi della data (' + visti.slice(0, visti.length - passi.length).join(' → ') + ') entra nell\'esagramma: ' + passi.map(function (Lx) { return 'L' + Lx.pos + ' ' + Lx.ramo; }).join(' → ') + '; l\'ultima linea sta nel campo ' + (kF === 'S' ? 'dello Shi' : 'della Ying') + ' e lo fa vincere' };
      })();
      if (fq) {
        dire('la mobile L' + mob.pos + ' (' + NOME[mob.pos === R.shi ? 'S' : 'Y'] + ') ha la partenza ' + dep + ' rotta dal mese ' + c.monthBranch + ': non può muoversi, nessuno scontro possibile');
        dire('le sedi non possono scontrarsi: decide il flusso di Qi della data');
        chi = [];
        return vince(fq.k, fq.t, 1);
      }
    }
    var sedeMossa = function (k) { return chi.filter(function (m) { return m.pos === POS[k]; })[0]; };
    // la sede che si muove per diventare vuota e' scartata: vince l'altra
    var scart = ['S', 'Y'].filter(function (k) { var m = sedeMossa(k); return m && arrVuoto(m.arr); });
    // la sede fuori gioco e' sostituita da una linea del suo campo che si muove (Edu, 10/10/2026, USDJPY 02/10/2024 s143:
    // "se la sede è fuori gioco, se c'è una linea mobile del proprio campo a muoversi si prende quella. Qui L3 si muove per
    // controllare Y e fa vincere la propria squadra"). Se il sostituto colpisce l'altra sede (controlla, clasha, punisce,
    // drena) vince il campo della sede fuori gioco; se la nutre vince l'altra. Senza sostituto: vince l'altra sede.
    var sostituto = function (k, mForza) {
      var O = SEDE[ALTRA[k]], eO = WX[O.ramo];
      var m = mForza || chi.filter(function (x) { return x.pos !== POS[k] && campo(x.pos) === k && x.arr && !arrVuoto(x.arr) && !x.retro; })[0];
      if (!m || O.vuoto) return null;
      var aE = WX[m.arr];
      // LA LINEA CHE SI MUOVE AIUTA PRIMA DI TUTTO IL PROPRIO CAMPO (Edu, 12/10/2026, S56: "Quando una linea si muove
      // cerca di aiutare il proprio campo a vincere la battaglia. Se generando la propria sede vince, bene, altrimenti
      // si mette in competizione con l'altra sede"): se l'arrivo genera la propria sede, il suo campo vince, prima di
      // ogni competizione con l'altra sede (scontro col clash compreso). MA il vuoto non riceve: la sede nel vuoto della
      // data (anche di stagione: USDJPY 21/10/2024 s149, la Ying Chou vuota timely non riceve il Fuoco di L2, che infatti
      // va in competizione con lo Shi) non puo' essere generata, e la linea passa alla competizione.
      // CONFERMATO (Edu, 12/10/2026): "se è vuota e ferma non riceve anche se timely" — la sede vuota che pero' si
      // MUOVE timely e' uscita dal vuoto (vuotoDiStagione) e riceve.
      if (GEN[aE] === WX[SEDE[k].ramo] && !SEDE[k].vuoto && vuoti.indexOf(SEDE[k].ramo) < 0)
        return { vince: k, t: 'L' + m.pos + ' si muove in ' + m.arr + ' per generare la propria sede: vince il suo campo' };
      // nell'ordine di Edu (combinare, clashare, generare) lo scontro col clash viene prima: USDJPY 10/08/2026 s157 ("L1 si
      // muove per clashare L4 ... essendo L4 molto più forte vince lo scontro facendo vincere Y")
      var fL0 = function (b) { var e = WX[b]; if (!mE) return 0; return e === mE ? 2 : GEN[mE] === e ? 1 : GEN[e] === mE ? -1 : KE[mE] === e ? -2 : KE[e] === mE ? -1 : 0; };
      var Tc = R.linee.filter(function (Lx) { return Lx.pos !== m.pos && Lx.pos !== R.shi && Lx.pos !== R.ying && !Lx.vuoto && CLASH[m.arr] === Lx.ramo && campo(Lx.pos) !== k; })[0];
      if (Tc) { var dd = fL0(Tc.ramo) - fL0(m.arr);
        if (dd >= 3) return { vince: ALTRA[k], t: 'L' + m.pos + ' prende il posto di ' + NOME[k] + ' e clasha L' + Tc.pos + ', molto più forte: perde lo scontro, vince l\'altra sede' };
        if (dd <= -3) return { vince: k, t: 'L' + m.pos + ' prende il posto di ' + NOME[k] + ' e vince lo scontro con L' + Tc.pos }; }
      if (KE[aE] === eO || CLASH[m.arr] === O.ramo || PENA[m.arr] === O.ramo || GEN[eO] === aE) return { vince: k, t: 'L' + m.pos + ' si muove in ' + m.arr + ' e prende il posto di ' + NOME[k] + ': ' + (KE[aE] === eO ? 'controlla' : CLASH[m.arr] === O.ramo ? 'clasha' : PENA[m.arr] === O.ramo ? 'punisce' : 'drena') + ' ' + NOME[ALTRA[k]] + ', vince il suo campo' };
      if (GEN[aE] === eO) return { vince: ALTRA[k], t: 'L' + m.pos + ' prende il posto di ' + NOME[k] + ' ma nutre ' + NOME[ALTRA[k]] + ': vince l\'altra sede' };
      // il confronto si perde anche dall'altro lato (Edu, 12/10/2026, USDJPY 21/10/2024 s149: "si muove per diventare Wu
      // ma perde il confronto con S"): se l'ALTRA sede controlla l'arrivo del sostituto, il sostituto perde il confronto.
      if (KE[eO] === aE) return { vince: ALTRA[k], t: 'L' + m.pos + ' si muove in ' + m.arr + ' e parla per ' + NOME[k] + ', ma ' + NOME[ALTRA[k]] + ' lo controlla: perde il confronto, vince l\'altra sede' };
      return null;
    };
    // tutte e due le sedi fuori gioco (una scartata nel vuoto e l'altra vuota, o tutte e due): intervengono le bestie dei
    // pilastri, e la sede presa da una bestia vince (Edu, 10/10/2026, GBPUSD 20/12/2023 s127: "Qui né S né Y possono vincere
    // perché sono vuoti. La bestia dell'ora interviene e s'impadronisce di Y e fa vincere il non segue"). Perimetro DI CLAUDE:
    // valgono tutti e quattro i pilastri (li' era l'ora); se le bestie prendono tutte e due le sedi o nessuna, il metodo tace.
    var fuori = function (k) { return scart.indexOf(k) >= 0 || (SEDE[k].vuoto && vuotoVero(SEDE[k].ramo) && !sedeMossa(k)); };   // la sede che si muove non e' vuota alla partenza
    if (fuori('S') && fuori('Y') && c.bestieSedi !== false) {
      var pil0 = [['l\'anno', c.yearStem, c.yearBranch], ['il mese', c.monthStem, c.monthBranch], ['il giorno', c.dayStem, dB], ['l\'ora', c.hourStem, c.oraBranch]].filter(function (p) { return p[1]; });
      var presa = {}; ['S', 'Y'].forEach(function (k) { var L = SEDE[k]; if (!L.bestia || !L.bestia.cn) return; pil0.forEach(function (p) { if (BESTIA_STELO[p[1]] === L.bestia.cn) presa[k] = p[0]; }); });
      var pk = Object.keys(presa);
      if (pk.length === 1) return vince(pk[0], 'né lo Shi né la Ying possono vincere perché sono vuoti: la bestia del' + presa[pk[0]].replace(/^il |^l'/, function (x) { return x === 'il ' ? ' ' : 'l\''; }) + ' s\'impadronisce di ' + NOME[pk[0]] + ' e la fa vincere', 1);
      dire('né lo Shi né la Ying possono vincere perché sono vuoti, e nessuna bestia decide: il metodo tace'); return out;
    }
    if (scart.length === 1 && c.sostituto !== false) { var so = sostituto(scart[0]); if (so) { dire(NOME[scart[0]] + ' si muove per diventare vuot' + (scart[0] === 'S' ? 'o' : 'a') + ': fuori gioco'); return vince(so.vince, so.t, 1); } }
    // senza sostituto e senza altro che si muova, le bestie intervengono sul lato della sede fuori gioco (Edu, 10/10/2026,
    // USDCAD 26/11/2021 s126: "Le due linee sono inservibili, non c'è altro che si muove per cui intervengono le bestie sul
    // lato S perché Y è comunque funzionale. L'unica bestia sul lato S è l'ora Ding Si che s'impadronisce di L6 e vince contro
    // Y"): se la bestia di un pilastro cade su una linea del campo della sede fuori gioco (non inservibile), vince quel campo.
    // Perimetro DI CLAUDE: tutti e quattro i pilastri col ramo non vuoto. c.bestieLato === false spegne.
    if (scart.length === 1 && c.bestieLato !== false) {
      var kx = scart[0], altriMossi = chi.filter(function (m) { return !arrVuoto(m.arr); }).length;
      if (!altriMossi) {
        // Bestie dal lato della sede fuori gioco (Edu, 10/10/2026): possono prendere anche la sede stessa; pilastri in ordine
        // (anno, mese, giorno, ora) col ramo NON vuoto (Edu: "Hai ragione sul ramo vuoto della bestia dell'anno, non va usato.
        // Prendiamo quella del mese che fa la stessa cosa: Shen genera la nativa Hai che perde il confronto con S").
        // Se il pilastro genera la linea nativa, la nativa resta (rafforzata) e si confronta lei; altrimenti la linea diventa il
        // ramo del pilastro (USDCAD 26/11/2021: Si dell'ora su L6). Confronto con l'altra sede: chi viene generato vince, chi
        // controlla vince. Le altre linee che si muovono nel vuoto sono inservibili.
        var inserv = chi.filter(function (m) { return m.pos !== POS[kx]; }).map(function (m) { return m.pos; });
        var pilL = [['dell\'anno', c.yearStem, c.yearBranch], ['del mese', c.monthStem, c.monthBranch], ['del giorno', c.dayStem, dB], ['dell\'ora', c.hourStem, c.oraBranch]].filter(function (p) { return p[1] && p[2] && vuoti.indexOf(p[2]) < 0; });
        var presaL = null, eAltra = WX[SEDE[ALTRA[kx]].ramo];
        pilL.forEach(function (p) {
          if (presaL) return;
          var Lx = R.linee.filter(function (L) { return campo(L.pos) === kx && inserv.indexOf(L.pos) < 0 && L.bestia && L.bestia.cn === BESTIA_STELO[p[1]]; })[0];
          if (!Lx) return;
          var eP = WX[p[2]], eN = WX[Lx.ramo], nativa = GEN[eP] === eN, eA = nativa ? eN : eP, chiA = nativa ? 'la nativa ' + Lx.ramo + ', generata da ' + p[2] + ',' : 'L' + Lx.pos + ', diventata ' + p[2] + ',';
          // Edu, 10/10/2026, EURUSD 30/11/2021 s112: "Nothing helps S, the line is void and the beasts are not helping. Y wins
          // also because it's very timely": se sulla stessa linea cadono piu' pilastri in disaccordo (uno genera la nativa,
          // un altro la controlla: li' Wu e Mao su Wei) le bestie non aiutano; e non vincono contro un'altra sede molto di
          // stagione (stesso elemento del mese: li' la Ying Zi nel mese Hai).
          var tutti = pilL.filter(function (q) { return Lx.bestia.cn === BESTIA_STELO[q[1]]; });
          if (tutti.some(function (q) { return GEN[WX[q[2]]] === eN; }) && tutti.some(function (q) { return KE[WX[q[2]]] === eN; })) { dire('su L' + Lx.pos + ' cadono bestie in disaccordo: non aiutano'); presaL = { nulla: true }; return; }
          var vA = GEN[eAltra] === eA || KE[eA] === eAltra, vB = GEN[eA] === eAltra || KE[eAltra] === eA;
          if (vA && !vB && eAltra === mE) { dire(NOME[ALTRA[kx]] + ' è molto di stagione: la bestia non basta'); presaL = { nulla: true }; return; }
          if (vA && !vB) presaL = { vince: kx, t: 'la bestia ' + p[0] + ' prende L' + Lx.pos + ': ' + chiA + ' vince il confronto con ' + NOME[ALTRA[kx]] };
          else if (vB && !vA) presaL = { vince: ALTRA[kx], t: 'la bestia ' + p[0] + ' prende L' + Lx.pos + ': ' + chiA + ' perde il confronto con ' + NOME[ALTRA[kx]] };
        });
        if (presaL && presaL.nulla) presaL = null;
        if (presaL) { dire(NOME[kx] + ' si muove per diventare vuot' + (kx === 'S' ? 'o' : 'a') + ' e nient\'altro si muove: intervengono le bestie dal suo lato'); return vince(presaL.vince, presaL.t, 1); }
      }
    }
    if (scart.length === 1) return vince(ALTRA[scart[0]], NOME[scart[0]] + ' si muove per diventare vuot' + (scart[0] === 'S' ? 'o' : 'a') + ' (' + sedeMossa(scart[0]).arr + '): scartat' + (scart[0] === 'S' ? 'o' : 'a') + ', vince l\'altra sede', 1);
    if (scart.length === 2) { dire('tutte e due le sedi si muovono nel vuoto: il metodo tace'); return out; }
    // la sede G/W fuori stagione clashata dal giorno e' eliminata (ferma o mobile; non l'incompatibile che gira)
    var elim = ['S', 'Y'].filter(function (k) { var L = SEDE[k]; return !L.vuoto && (L.par === 'G' || L.par === 'W') && dB && CLASH[dB] === L.ramo && !timely(L) && inc.indexOf(POS[k]) < 0; });
    if (elim.length === 1 && c.sostituto !== false) { var so2 = sostituto(elim[0]); if (so2) { dire(NOME[elim[0]] + ' è eliminat' + (elim[0] === 'S' ? 'o' : 'a') + ' dal clash del giorno: fuori gioco'); return vince(so2.vince, so2.t, 1); } }
    // LA SEDE VUOTA FERMA NON PARLA DA SOLA: LA MOBILE DEL SUO CAMPO PARLA PER LEI (Edu, 12/10/2026, USDJPY 21/10/2024
    // s149: "Y è vuoto quindi L2 parla per lui, si muove per diventare Wu ma perde il confronto con S"). La sede vuota e
    // ferma e' fuori gioco come le scartate: se nel suo campo si muove una linea, quella parla per lei e si confronta con
    // l'altra sede (stesso confronto del sostituto). PERIMETRO DI CLAUDE, da confermare: solo se il sostituto c'e' e il
    // confronto decide; senza sostituto o con confronto muto la carta resta alla lettura di prima (la forza ferma del
    // principio 4 gia' copre la linea piu' forte nel campo vuoto). c.sostVuota === false spegne.
    if (c.sostVuota !== false && scart.length === 0 && elim.length === 0) {
      // la sede ferma nel vuoto della data non parla da sola NEMMENO se di stagione (li' la Ying Chou e' Terra nel mese
      // di Xu, eppure "Y è vuoto"): per PARLARE il vuoto resta vuoto, come per ricevere il flusso; e' il movimento che
      // esce dal vuoto di stagione, non la voce della sede ferma. Il giorno che clasha il ramo la libera.
      var vuotaFerma = function (k) { return (SEDE[k].vuoto || SEDE[k].vuotoDiStagione || R.vuoti.indexOf(SEDE[k].ramo) >= 0) && !(dB && CLASH[dB] === SEDE[k].ramo) && !sedeMossa(k); };
      // IL DOPPIO CLASH (Edu, 13/10/2026, S56: "Il clash la libera dal vuoto, ma due clash se la linea è timely la
      // fanno attivare"): UN clash libera la vuota dal vuoto; DUE clash — dal giorno e dall'arrivo della mobile —
      // ATTIVANO la linea se e' timely, la SPAZZANO se e' untimely. La spazzata puo' essere salvata solo dalla bestia
      // di un pilastro il cui ramo la genera, e la salvata VINCE (EURJPY 25/01/2024 s160: la Ying Wu untimely nel mese
      // di Chou, spazzata da giorno e mobile, salvata dal Legno dell'anno, vince). PERIMETRO DI CLAUDE: 'attivata'
      // per ora significa che non e' trattata come vuota ferma (resta in gioco); la forma piena dell'attivazione
      // aspetta una carta di Edu. c.salvataDoppioClash === false spegne.
      var attivata = {};
      if (c.salvataDoppioClash !== false && dB && R.mutante.ramoArr) {
        var kDC2 = ['S', 'Y'].filter(function (k) { var L = SEDE[k]; return (L.vuoto || L.vuotoDiStagione) && !sedeMossa(k) && CLASH[dB] === L.ramo && CLASH[R.mutante.ramoArr] === L.ramo && R.mutante.pos !== POS[k]; })[0];
        var kDC = kDC2 && !timely(SEDE[kDC2]) ? kDC2 : null;
        if (kDC2 && timely(SEDE[kDC2])) { attivata[kDC2] = true; dire('due clash su ' + NOME[kDC2] + ' timely: si attiva, esce dal vuoto'); }
        if (kDC) {
          var LDC = SEDE[kDC];
          var pilDC = [['dell\'anno', c.yearStem, c.yearBranch], ['del mese', c.monthStem, c.monthBranch], ['del giorno', c.dayStem, dB], ['dell\'ora', c.hourStem, c.oraBranch]].filter(function (p) { return p[1] && p[2]; });
          var salvaDC = pilDC.filter(function (p) { return LDC.bestia && LDC.bestia.cn && BESTIA_STELO[p[1]] === LDC.bestia.cn && GEN[WX[p[2]]] === WX[LDC.ramo]; })[0];
          if (salvaDC) return vince(kDC, 'il giorno e l\'arrivo della mobile clashano ' + NOME[kDC] + ': sembra spazzat' + (kDC === 'S' ? 'o' : 'a') + ' via, ma la bestia ' + salvaDC[0] + ' porta ' + salvaDC[2] + ' che l' + (kDC === 'S' ? 'o' : 'a') + ' genera: salvat' + (kDC === 'S' ? 'o' : 'a') + ', vince', 1);
        }
      }
      var vfk = ['S', 'Y'].filter(function (k) { return !attivata[k] && vuotaFerma(k) && !vuotaFerma(ALTRA[k]); });
      if (vfk.length === 1) { var so3 = sostituto(vfk[0]);
        // la voce della sede vuota non e' tolta dal legame della mobile con la sua linea nascosta (Edu, 12/10/2026,
        // USDJPY 21/10/2024 s149: li' L2 e' legata alla propria nascosta Yin eppure "L2 parla per lui"): se fra i
        // movimenti non c'e' un sostituto, la mobile del campo ferma SOLO da quel legame parla lo stesso.
        if (!so3 && R.mutante.pos && campo(R.mutante.pos) === vfk[0] && R.mutante.pos !== POS[vfk[0]] && R.mutante.ramoArr &&
            !arrVuoto(R.mutante.ramoArr) && R.mutante.movimentoNullo && /hidden line/.test(R.mutante.motivoNullo || ''))
          so3 = sostituto(vfk[0], { pos: R.mutante.pos, dep: R.mutante.ramoDep, arr: R.mutante.ramoArr, retro: false, incArr: false, mobile: true });
        // SENZA SOCCORSO, LA VUOTA FERMA PERDE (Edu, 12/10/2026, S56, EURUSD 08/06/2023 s107: "Y è vuoto, la bestia
        // dell'anno viene in soccorso ma non può fare niente per aiutare. L6 si muove per penalizzarsi. S vince").
        // CORRETTO DA EDU (12/10/2026): "la bestia FA USCIRE DAL VUOTO, ma in questo caso la bestia dell'anno Gui Mao
        // è legno che genera C Si, ma non serve perché S vince sempre". Quindi: la bestia di un pilastro che cade
        // sulla sede vuota, col ramo del pilastro che la GENERA, la fa uscire dal vuoto — e la carta si legge normale
        // (li' la Ying rinata genera lo Shi, e S vince comunque). Se NESSUNA bestia la fa uscire e nessun sostituto
        // parla per lei, la vuota ferma e' sola: vince l'altra sede, come la via d) del fuori gioco.
        // Solo quando NIENT'ALTRO agisce (se un movimento vivo c'e', la carta si legge dai movimenti: EURUSD
        // 26/08/2026 s116, la tomba dello Shi). c.vuotaPerde === false spegne.
        if (!so3 && c.vuotaPerde !== false && chi.length === 0) {
          var kV = vfk[0], LV = SEDE[kV];
          var pilV = [['dell\'anno', c.yearStem, c.yearBranch], ['del mese', c.monthStem, c.monthBranch], ['del giorno', c.dayStem, dB], ['dell\'ora', c.hourStem, c.oraBranch]].filter(function (p) { return p[1] && p[2]; });
          var salva = pilV.filter(function (p) { return LV.bestia && LV.bestia.cn && BESTIA_STELO[p[1]] === LV.bestia.cn && GEN[WX[p[2]]] === WX[LV.ramo]; })[0];
          if (salva) dire('la bestia ' + salva[0] + ' cade su ' + NOME[kV] + ' e ' + salva[2] + ' l' + (kV === 'S' ? 'o' : 'a') + ' genera: esce dal vuoto');
          else return vince(ALTRA[kV], NOME[kV] + ' è vuot' + (kV === 'S' ? 'o' : 'a') + ' e ferm' + (kV === 'S' ? 'o' : 'a') + ' e nessuna bestia l' + (kV === 'S' ? 'o' : 'a') + ' fa uscire dal vuoto: vince l\'altra sede', 1);
        }
        if (so3) { dire(NOME[vfk[0]] + ' è vuot' + (vfk[0] === 'S' ? 'o' : 'a') + ' e ferm' + (vfk[0] === 'S' ? 'o' : 'a') + ': non parla da sol' + (vfk[0] === 'S' ? 'o' : 'a')); return vince(so3.vince, so3.t, 1); } }
    }
    if (elim.length === 1) return vince(ALTRA[elim[0]], NOME[elim[0]] + ' (una ' + SEDE[elim[0]].par + ') non è di stagione ed è clashat' + (elim[0] === 'S' ? 'o' : 'a') + ' dal giorno ' + dB + ': eliminat' + (elim[0] === 'S' ? 'o' : 'a') + ', vince l\'altra sede', 1);
    // la sede combinata e controllata dal giorno e' bloccata — salvo il flusso dello stelo del giorno, forte nella data
    var bloccata = { S: false, Y: false };
    var eSt = STELO_EL[c.dayStem];
    for (var bi = 0, bk = ['S', 'Y']; bi < 2; bi++) {
      var k0 = bk[bi], L0 = SEDE[k0];
      if (!(dB && COMBINA[dB] === L0.ramo && KE[dEl] === WX[L0.ramo])) continue;
      if (eSt && GEN[dEl] === eSt && GEN[eSt] === WX[L0.ramo] && eSt === mE) return vince(k0, NOME[k0] + ' è legat' + (k0 === 'S' ? 'o' : 'a') + ' dal giorno, ma lo stelo ' + c.dayStem + ', forte nella data, fa scorrere il flusso verso di ' + (k0 === 'S' ? 'lui' : 'lei') + ': ne beneficia e non si lascia indebolire', 1);
      bloccata[k0] = true; dire(NOME[k0] + ' è bloccat' + (k0 === 'S' ? 'o' : 'a') + ' dal giorno ' + dB + ' che lo combina e lo controlla: fuori dal confronto');
    }

    // ---------------- PRINCIPI 2 e 3: COSA FA IL MOVIMENTO, E SE IL COLPO RIESCE ----------------
    var nutrito = { S: false, Y: false }, punita = { S: false, Y: false };
    var difende = function (L, a, verbo) {                     // principio 3: la sede di stagione si difende, tranne da un arrivo forte
      if (!timely(L)) return false;
      if (L.ramo === c.monthBranch || !arrForte(a)) { dire(NOME[L === S ? 'S' : 'Y'] + ' è di stagione: non si lascia ' + verbo); return true; }
      return false;
    };
    var mediato = function (aEl, L) { return !!mE && GEN[aEl] === mE && GEN[mE] === WX[L.ramo] && timely(L); };   // il mese fa da ponte
    var colpisci = function (k, quanto, testo) { if (bloccata[k]) return; pt[k] -= quanto; dire(testo); };
    var nutritoDaAltri = { S: false, Y: false };   // nutrita da un'altra linea (non la propria generazione indietro): GBPUSD 01/10 contro 04/08
    var nutri = function (k, testo, qualsiasi) { if (bloccata[k]) return; pt[k] += qualsiasi ? 1 : segnoNutri(SEDE[k]); nutrito[k] = true; if (!qualsiasi) nutritoDaAltri[k] = true; dire(testo); };
    chi.forEach(function (m) {
      var aE = WX[m.arr], dE = WX[m.dep], kM = m.pos === R.shi ? 'S' : m.pos === R.ying ? 'Y' : null;
      if (arrVuoto(m.arr) && !kM) return;                     // la mobile non sede che arriva nel vuoto non agisce
      if (kM) {
        // la sede che si muove: generata indietro, controllata indietro, ritirata
        if (m.incArr) dire('l\'arrivo ' + m.arr + ' è incompatibile: non agisce su ' + NOME[kM]);
        else if (m.retro) {
          if (SEDE[kM].par === 'B' || SEDE[kM].par === 'P') { pt[kM] += 1; dire(NOME[kM] + ', una ' + SEDE[kM].par + ', retrocede: porta via la perdita'); }
          else if (SEDE[kM].par === 'G' || SEDE[kM].par === 'W') { pt[kM] -= 1; dire(NOME[kM] + ', una ' + SEDE[kM].par + ', retrocede: porta via il vantaggio'); }
        } else if (GEN[aE] === dE) {
          nutri(kM, NOME[kM] + ' si fa generare indietro: rafforzat' + (kM === 'S' ? 'o' : 'a'), true);
          if (dEl && GEN[dEl] === aE) { pt[kM] += 1; dire('il giorno ' + dB + ' genera l\'arrivo ' + m.arr + ': ' + NOME[kM] + ' si autogenera con il suo aiuto'); }
        } else if (KE[aE] === dE) {
          if (mediato(aE, SEDE[kM])) { pt[kM] += 1; dire(NOME[kM] + ' è forte di suo e il mese fa da ponte con l\'arrivo ' + m.arr + ': resta fort' + 'e'); }
          else colpisci(kM, 1, NOME[kM] + ' è controllat' + (kM === 'S' ? 'o' : 'a') + ' indietro');
        }
        // quello che la sede che si muove fa all'altra sede
        var kO = ALTRA[kM], O = SEDE[kO];
        if (!O.vuoto && !m.retro && !m.incArr) {
          if (m.mobile && GEN[aE] === WX[O.ramo]) nutri(kO, NOME[kM] + ' si muove in ' + m.arr + ' per generare ' + NOME[kO]);
          if (PENA[m.arr] === O.ramo || (m.arr === O.ramo && AUTOP[O.ramo])) { punita[kO] = true; colpisci(kO, 1, NOME[kM] + ' si muove in ' + m.arr + ' che punisce ' + NOME[kO]); }
          if (CLASH[m.arr] === O.ramo) colpisci(kO, 1, NOME[kM] + ' si muove in ' + m.arr + ' per clashare ' + NOME[kO]);
        }
      } else {
        // la mobile (o l'incompatibile) che non e' una sede
        if (m.retro) { dire('L' + m.pos + ' retrocede: non condiziona le sedi'); return; }
        var genSe = GEN[aE] === dE;
        if (genSe && timely(R.linee[m.pos - 1])) {               // gia' forte e generata indietro: rafforza il suo campo
          var kc = campo(m.pos), C = SEDE[kc];
          if (!(KE[aE] === WX[C.ramo] || PENA[m.arr] === C.ramo)) { pt[kc] += 1; dire('L' + m.pos + ', già forte, si fa generare indietro: rafforza il campo ' + (kc === 'S' ? 'dello Shi' : 'della Ying')); }
        }
        ['S', 'Y'].forEach(function (k) {
          var L = SEDE[k], e = WX[L.ramo];
          if (vuotaInMezzo(m.pos, POS[k])) return;
          if (genSe && GEN[dE] === e && !L.vuoto) nutri(k, 'L' + m.pos + ' si fa generare indietro e genera ' + NOME[k]);     // la forza passa alla sede
          if (genSe && !L.vuoto && PENA[m.arr] === L.ramo) { punita[k] = true; if (!difende(L, m.arr, 'punire')) colpisci(k, 1, 'l\'arrivo ' + m.arr + ' di L' + m.pos + ' punisce ' + NOME[k]); }   // la punizione vale anche qui (USDJPY 06/10/2026)
          if (genSe) return;                                                                                                 // l'arrivo che genera la mobile tiene il beneficio
          if (GEN[aE] === e) { if (!L.vuoto || timely(L)) nutri(k, 'l\'arrivo ' + m.arr + ' di L' + m.pos + ' nutre ' + NOME[k] + (L.vuoto ? ' (vuoto ma di stagione)' : '')); }
          else if (!L.vuoto && KE[aE] === e && mediato(aE, L)) { pt[k] += 1; dire(NOME[k] + ' è forte di suo e il mese fa da ponte con l\'arrivo ' + m.arr + ': il controllo non passa'); }
          else if (!L.vuoto && (KE[aE] === e || GEN[e] === aE)) { if (!difende(L, m.arr, KE[aE] === e ? 'controllare' : 'drenare')) colpisci(k, 1, 'l\'arrivo ' + m.arr + ' di L' + m.pos + (KE[aE] === e ? ' controlla ' : ' drena ') + NOME[k]); }
          else if (!L.vuoto && PENA[m.arr] === L.ramo) { punita[k] = true; if (!difende(L, m.arr, 'punire')) colpisci(k, 1, 'l\'arrivo ' + m.arr + ' di L' + m.pos + ' punisce ' + NOME[k]); }
          if (!L.vuoto && TOMBA[e] === m.arr) colpisci(k, 1, 'L' + m.pos + ' si muove per diventare la tomba di ' + NOME[k]);
          if (!L.vuoto && TRINE[m.arr] && TRINE[m.arr].indexOf(L.ramo) >= 0 && L.ramo !== m.arr) {
            var t3 = TRINE[m.arr].filter(function (b) { return b !== m.arr && b !== L.ramo; })[0];
            if (t3 === c.monthBranch || t3 === dB) { pt[k] += segnoNutri(L); dire('l\'arrivo ' + m.arr + ' chiude il trigono con ' + NOME[k] + ' e il ' + (t3 === c.monthBranch ? 'mese' : 'giorno')); }
          }
        });
        // lo scontro: l'arrivo clasha una linea ferma dell'altro trigramma, vince il piu' forte nel mese e il suo campo
        var fL = function (b) { var e = WX[b]; if (!mE) return 0; return e === mE ? 2 : GEN[mE] === e ? 1 : GEN[e] === mE ? -1 : KE[mE] === e ? -2 : KE[e] === mE ? -1 : 0; };
        var T = R.linee.filter(function (Lx) { return Lx.pos !== m.pos && Lx.pos !== R.shi && Lx.pos !== R.ying && !Lx.vuoto && CLASH[m.arr] === Lx.ramo && ((Lx.pos <= 3) !== (m.pos <= 3)); })[0];
        if (T) {
          var dF = fL(T.ramo) - fL(m.arr);
          if (dF >= 3) { pt[campo(T.pos)] += 1; dire('L' + m.pos + ' clasha L' + T.pos + ', molto più forte: vince lo scontro e il suo campo'); }
          else if (dF <= -3) { pt[campo(m.pos)] += 1; dire('L' + m.pos + ' clasha L' + T.pos + ' e vince lo scontro: vince il suo campo'); }
        }
      }
      // l'arrivo incompatibile della mobile va fuori: combinarsi, stesso ramo, clashare, generare
      if (m.mobile && m.incArr) {
        var al = R.linee.filter(function (Lx) { return Lx.pos !== m.pos && !Lx.vuoto; });
        var Tg = al.filter(function (Lx) { return COMBINA[m.arr] === Lx.ramo; })[0], tp = 'combina';
        if (!Tg) { Tg = al.filter(function (Lx) { return Lx.ramo === m.arr; })[0]; tp = 'stesso'; }
        if (!Tg) { Tg = al.filter(function (Lx) { return CLASH[m.arr] === Lx.ramo; })[0]; tp = 'clash'; }
        if (!Tg) { Tg = al.filter(function (Lx) { return GEN[aE] === WX[Lx.ramo]; })[0]; tp = 'genera'; }
        if (Tg && (Tg.pos === R.shi || Tg.pos === R.ying)) {
          var kT = Tg.pos === R.shi ? 'S' : 'Y';
          if (tp === 'clash') colpisci(kT, 1, 'l\'arrivo incompatibile ' + m.arr + ' va fuori a clashare ' + NOME[kT]);
          if (tp === 'genera') nutri(kT, 'l\'arrivo incompatibile ' + m.arr + ' va fuori a generare ' + NOME[kT]);
        }
      }
    });
    // la sede nutrita da un movimento che controlla l'altra la colpisce
    var colpitaDaNutrita = { S: false, Y: false };
    ['S', 'Y'].forEach(function (k) { var o = ALTRA[k]; if (nutritoDaAltri[k] && !SEDE[o].vuoto && KE[WX[SEDE[k].ramo]] === WX[SEDE[o].ramo]) { colpitaDaNutrita[o] = true; colpisci(o, 1, NOME[k] + ', nutrit' + (k === 'S' ? 'o' : 'a') + ' da un movimento, controlla ' + NOME[o]); } });
    // principio 3: la sede troppo forte (di stagione e sostenuta dal giorno) non si lascia colpire dall'altra sede
    var tForte = function (L) { var e = WX[L.ramo]; return !L.vuoto && timely(L) && !!dEl && (dEl === e || GEN[dEl] === e); };
    ['S', 'Y'].forEach(function (k) {
      var o = ALTRA[k], A = SEDE[k], B = SEDE[o];
      if (!tForte(A) || tForte(B) || punita[k] || colpitaDaNutrita[k] || bloccata[k]) return;
      var mB = sedeMossa(o), att = KE[WX[B.ramo]] === WX[A.ramo] || (mB && (CLASH[mB.arr] === A.ramo || KE[WX[mB.arr]] === WX[A.ramo]));
      if (!att) return;
      if (pt[o] > 0) pt[o] = 0; if (pt[k] < 0) pt[k] = 0; pt[k] += 1;
      dire(NOME[k] + ' è troppo forte (di stagione e sostenut' + (k === 'S' ? 'o' : 'a') + ' dal giorno): l\'altra sede non riesce a colpirl' + (k === 'S' ? 'o' : 'a'));
    });
    if (bloccata.S) _p.S = 0; if (bloccata.Y) _p.Y = 0;
    if (_p.S !== _p.Y) { out.principio = 2; return chiudi(); }

    // ---------------- PRINCIPIO 4: LA FORZA FERMA, SOLO SE NESSUN MOVIMENTO DECIDE ----------------
    // IL CONFRONTO DIRETTO DELLE SEDI FERME (Edu, 12/10/2026, S56, GBPUSD 21/09/2023 s123: "L5 cannot move to help Y
    // and S controls Y. Follow"): quando NESSUN movimento ha agito (la mobile sospesa o legata non aiuta il suo campo),
    // le sedi si confrontano direttamente da ferme: chi controlla l'altra vince — prima della forza di calendario
    // (li' la Ying era 'molto piu' forte' nel mese e nel giorno, ma lo Shi Mao Legno controlla la Ying Xu Terra e vince).
    // PERIMETRO DI CLAUDE, da confermare: simmetrico (anche la Ying che controlla lo Shi vince); solo se nessun
    // movimento ha mosso i punti. c.confrontoFermo === false spegne.
    // IL SOCCORSO DELLA BESTIA COL PONTE (Edu, 12/10/2026, S56, EURUSD 08/07/2021 s117: "S non può arrivare quindi
    // rimane la partenza W Xu. Y non può neanche partire, allora arriva la bestia dell'ora in soccorso. Shen metallo fa
    // da ponte fra S e Y e fa vincere Y"): quando nessun movimento agisce, la bestia di un pilastro (ramo non vuoto)
    // che cade su una sede la soccorre: se il ramo di quel pilastro fa da ponte di generazione dall'altra sede alla
    // soccorsa (altra -> ponte -> soccorsa), la forza dell'altra fluisce nella soccorsa e la fa vincere — li' anche
    // contro il controllo dello Shi e la sua stagione piena. PERIMETRO DI CLAUDE: pilastri in ordine
    // anno-mese-giorno-ora, vince il primo che soccorre. c.soccorsoPonte === false spegne.
    if (!mosso.v && c.soccorsoPonte !== false) {
      var pilSoc = [['dell\'anno', c.yearStem, c.yearBranch], ['del mese', c.monthStem, c.monthBranch], ['del giorno', c.dayStem, dB], ['dell\'ora', c.hourStem, c.oraBranch]].filter(function (p) { return p[1] && p[2] && vuoti.indexOf(p[2]) < 0; });
      for (var siP = 0; siP < pilSoc.length; siP++) {
        var pS = pilSoc[siP], peS = WX[pS[2]], kSoc = null;
        ['S', 'Y'].forEach(function (k) { var L = SEDE[k]; if (L.bestia && L.bestia.cn && BESTIA_STELO[pS[1]] === L.bestia.cn) kSoc = k; });
        if (!kSoc) continue;
        var ASoc = SEDE[ALTRA[kSoc]];
        if (GEN[WX[ASoc.ramo]] === peS && GEN[peS] === WX[SEDE[kSoc].ramo])
          return vince(kSoc, 'la bestia ' + pS[0] + ' soccorre ' + NOME[kSoc] + ': ' + pS[2] + ' fa da ponte e porta la forza di ' + NOME[ALTRA[kSoc]] + ' verso ' + NOME[kSoc] + ', che vince', 4);
      }
    }
    // IL TRIGONO DELLA BESTIA SOPPRIME LA SEDE (Edu, 12/10/2026, S56, USDJPY 15/04/2024 s153: "S riceve autopenalità
    // dal suo stesso movimento e non può vincere il confronto con Y, però la bestia dell'ora interviene sulla linea e
    // crea un trigono di acqua insieme a L1 che sopprime Y"): quando nessun movimento decide, la bestia di un pilastro
    // che cade su una linea NON vuota chiude il trigono (tre armonie) col ramo del pilastro e il ramo di un'altra linea
    // non vuota: l'elemento del trigono che CONTROLLA una sede la sopprime, e vince l'altra. Non sopprime una sede
    // molto di stagione (stesso elemento del mese). PERIMETRO DI CLAUDE: pilastri in ordine anno-mese-giorno-ora,
    // rami del trigono tutti distinti. c.trigonoBestia === false spegne.
    if (!mosso.v && c.trigonoBestia !== false) {
      // E' UN INTERVENTO DI SOCCORSO (Edu, 12/10/2026: "Certo, è un intervento di soccorso perché S si stava facendo
      // male da sola con il suo stesso movimento. Cerchiamo sempre di far vincere la S e solo se non ci riusciamo
      // vediamo cosa Y riesce a fare per vincere lui"): il trigono scatta SOLO per la sede che si fa male da sola col
      // suo stesso movimento (la sede mobile o incompatibile con l'autopenalità del suo ramo), e la bestia sopprime
      // l'ALTRA sede per salvarla. Senza una sede che si fa male, il trigono non interviene.
      // la sede si fa male da sola quando il suo movimento arriva sul suo stesso ramo autopunitivo (自刑: li' lo Shi
      // Chen, incompatibile, arriva in Chen — il movimento e' tutto autopenalita').
      var kMale = ['S', 'Y'].filter(function (k) {
        var L = SEDE[k]; if (!AUTOP[L.ramo]) return false;
        if (R.mutante.pos === POS[k] && R.mutante.ramoArr === L.ramo) return true;
        return (R.incompatibili || []).indexOf(POS[k]) >= 0 && (R.mutante.futuro || [])[POS[k] - 1] === L.ramo;
      })[0];
      var TRIG3 = kMale ? [[['申','子','辰'],'Water'],[['亥','卯','未'],'Wood'],[['寅','午','戌'],'Fire'],[['巳','酉','丑'],'Metal']] : [];
      var pilT = [['dell\'anno', c.yearStem, c.yearBranch], ['del mese', c.monthStem, c.monthBranch], ['del giorno', c.dayStem, dB], ['dell\'ora', c.hourStem, c.oraBranch]].filter(function (p) { return p[1] && p[2]; });
      var esito = null;
      for (var ti = 0; ti < pilT.length && !esito; ti++) {
        var pT = pilT[ti];
        var lB = R.linee.filter(function (Lx) { return !Lx.vuoto && Lx.bestia && Lx.bestia.cn && BESTIA_STELO[pT[1]] === Lx.bestia.cn; })[0];
        if (!lB) continue;
        // PERIMETRO (dalla misura, 12/10/2026): di default la bestia deve cadere su una SEDE, come nella carta di Edu
        // (li' su L3, lo Shi stesso): sulla sede 50% su 24, su una linea semplice 37% su 38. c.trigonoBestia==='tutte'
        // riapre a ogni linea.
        if (c.trigonoBestia !== 'tutte' && lB.pos !== R.shi && lB.pos !== R.ying) continue;
        var grT = TRIG3.filter(function (t) { return t[0].indexOf(pT[2]) >= 0 && t[0].indexOf(lB.ramo) >= 0 && pT[2] !== lB.ramo; })[0];
        if (!grT) continue;
        var terzoT = grT[0].filter(function (b) { return b !== pT[2] && b !== lB.ramo; })[0];
        var lT = R.linee.filter(function (Lx) { return !Lx.vuoto && Lx.pos !== lB.pos && Lx.ramo === terzoT; })[0];
        if (!lT) continue;
        var soppressa = ['S', 'Y'].filter(function (k) { return KE[grT[1]] === WX[SEDE[k].ramo] && !(mE && WX[SEDE[k].ramo] === mE); })[0];
        if (!soppressa || soppressa === kMale) continue;                    // il soccorso e' per chi si fa male: sopprime l'altra
        esito = vince(ALTRA[soppressa], 'la bestia ' + pT[0] + ' cade su L' + lB.pos + ' e chiude il trigono ' + ({Water:'d\'Acqua',Wood:'di Legno',Fire:'di Fuoco',Metal:'di Metallo'})[grT[1]] + ' con ' + pT[2] + ' e L' + lT.pos + ': sopprime ' + NOME[soppressa] + ', vince ' + NOME[ALTRA[soppressa]], 4);
      }
      if (esito) return esito;
    }
    // IL FLUSSO DEL QI DELLA DATA RENDE LA SEDE VIBRANTE (Edu, 12/10/2026, S56, USDJPY 04/01/2024 s142: "Il flusso
    // del Qi in questa carta va da metallo dell'ora, all'acqua del mese, al legno del giorno e dell'anno. Questo rende
    // la S vibrante che vince contro Y. L5 che si muove non aggiunge o toglie niente"): quando nessun movimento agisce,
    // gli elementi dei pilastri della data in catena di generazione (un solo inizio, tutti gli elementi nella catena)
    // generano, dall'ultimo anello, l'elemento di una sede: quella sede e' vibrante e vince. Il vuoto non riceve:
    // la sede nel vuoto della data non vibra. PERIMETRO DI CLAUDE: la catena deve avere un solo inizio e percorrere
    // tutti gli elementi della data; se l'anello finale non genera nessuna sede (o tutte e due), tace.
    // c.flussoVibra === false spegne.
    if (!mosso.v && c.flussoVibra !== false) {
      var fv = (function () {
        var ramiD = [c.yearBranch, c.monthBranch, dB, c.oraBranch].filter(Boolean);
        var elsD = []; ramiD.forEach(function (b) { var e = WX[b]; if (e && elsD.indexOf(e) < 0) elsD.push(e); });
        if (elsD.length < 2) return null;
        var inizi = elsD.filter(function (e) { return !elsD.some(function (x) { return x !== e && GEN[x] === e; }); });
        if (inizi.length !== 1) return null;
        var cur = inizi[0], visti = [cur];
        while (elsD.indexOf(GEN[cur]) >= 0 && visti.indexOf(GEN[cur]) < 0) { cur = GEN[cur]; visti.push(cur); }
        if (visti.length !== elsD.length) return null;                     // la catena non percorre tutta la data
        var fin = GEN[cur];
        var hit = ['S', 'Y'].filter(function (k) { return WX[SEDE[k].ramo] === fin && !SEDE[k].vuoto; });
        if (hit.length !== 1) return null;
        // come per le bestie e il confronto da fermo: la vibrazione non vince contro una sede molto di stagione
        // (stesso elemento del mese) — EURUSD 30/09/2026 s113: la catena genera la Ying ma lo Shi Shen E' il ramo
        // del mese, molto piu' forte, e per Edu vince lui (segue).
        if (mE && WX[SEDE[ALTRA[hit[0]]].ramo] === mE) return null;
        return { k: hit[0], catena: visti.join(' → '), fin: fin };
      })();
      if (fv) return vince(fv.k, 'il flusso del Qi della data (' + fv.catena + ') genera ' + NOME[fv.k] + ': vibrante, vince', 4);
    }
    if (!mosso.v && c.confrontoFermo !== false) {
      var _eS = WX[S.ramo], _eY = WX[Y.ramo];
      // PERIMETRO DI CLAUDE (stretto, 12/10/2026, dalla misura): il confronto da fermo si apre solo quando l'aiuto
      // IMPEDITO stava nel campo della sede controllata — come nella carta di Edu, dove L5 (campo della Ying) e'
      // sospesa dal giorno e la Ying controllata perde. La mobile e' impedita se legata, nulla o ritirata.
      // c.confrontoFermo === 'tutto' riapre la forma larga (ogni carta senza movimenti efficaci).
      var _mobBloccata = !!legata(dep) || R.mutante.movimentoNullo || R.mutante.progressione === 'retrocedente';
      var _campoMob = campo(mob.pos);
      var _apre = function (perdente) { return c.confrontoFermo === 'tutto' || (_mobBloccata && _campoMob === perdente); };
      // come per le bestie: il controllo non vince contro una sede molto di stagione (stesso elemento del mese) —
      // e' il caso di GBPUSD 15/12/2022 s124, dove la Ying Zi E' il ramo del mese e vince coi pilastri nonostante
      // lo Shi Terra la controlli.
      if (KE[_eS] === _eY && !(mE && _eY === mE) && _apre('Y')) return vince('S', 'il movimento che doveva aiutare la Ying è impedito, e lo Shi la controlla da fermo: vince', 4);
      if (KE[_eY] === _eS && !(mE && _eS === mE) && _apre('S')) return vince('Y', 'il movimento che doveva aiutare lo Shi è impedito, e la Ying lo controlla da ferma: vince', 4);
    }
    if (mosso.v) dire('i movimenti si pareggiano: decide la forza ferma');
    out.principio = 4;
    var fermo = { S: 0, Y: 0 };
    // la Ying che genera lo Shi nutre il trend (non se bloccata)
    // MA CON LA GENERAZIONE ARRIVA ANCHE LA PENALITA' (Edu, 12/10/2026, S56, EURUSD 25/06/2020 s112: "Y è untimely ma è
    // il Tai Sui ed è anche sostenuta dal giorno Hai quindi ha forza. Il giorno Wu la clasha ma non la annulla quanto la
    // fa balzare a generare S. Il problema è che con la generazione arriva anche la penalità: Y penalizza S che non può
    // vincere"): se la Ying che genera lo Shi lo PUNISCE anche (li' Zi punisce Mao), il nutrimento porta la penalità e
    // lo Shi non può vincere: il punto va alla Ying. Il clash sulla generatrice forte non la annulla: la fa balzare.
    if (!bloccata.Y && GEN[WX[Y.ramo]] === WX[S.ramo]) {
      // PERIMETRO dalla coppia di carte s112: la penalita' viaggia col BALZO — solo se il mese o il giorno CLASHANO la
      // Ying generatrice (il clash non la annulla: la fa balzare, e il balzo porta la penalita'). Senza clash la
      // generazione e' calma e nutre e basta (EURUSD 05/10/2026 s112: stessa coppia Zi->Mao, nessun clash dal mese o
      // dal giorno, e il nutrimento vince).
      var _balzo = (mE && CLASH[c.monthBranch] === Y.ramo) || (dB && CLASH[dB] === Y.ramo);
      if (c.nutrePena !== false && PENA[Y.ramo] === S.ramo && _balzo) { fermo.Y += 1; dire('il clash fa balzare la Ying a generare lo Shi, ma col nutrimento arriva la penalità: lo Shi non può vincere'); }
      else { fermo.S += segnoNutri(S); dire('la Ying genera lo Shi: il trend è nutrito'); }
    }
    // il mese G che si combina con lo Shi gli garantisce la vittoria
    var palE = null;
    R.linee.forEach(function (Lx) { if (palE) return; var ex = WX[Lx.ramo];
      if (Lx.par === 'B') palE = ex; else if (Lx.par === 'G') palE = KE[ex]; else if (Lx.par === 'P') palE = GEN[ex];
      else if (Lx.par === 'C') palE = Object.keys(GEN).filter(function (z) { return GEN[z] === ex; })[0];
      else if (Lx.par === 'W') palE = Object.keys(KE).filter(function (z) { return KE[z] === ex; })[0]; });
    if (palE && mE && KE[mE] === palE && COMBINA[c.monthBranch] === S.ramo) { fermo.S += 1; dire('il mese è una G che si combina con lo Shi: gli garantisce la vittoria'); }
    // il raduno stagionale chiuso dalla sede, dal giorno e dalla mobile del suo trigramma
    ['S', 'Y'].forEach(function (k) {
      var L = SEDE[k], gr = RADUNO[L.ramo]; if (L.vuoto || !gr || !dB || gr.indexOf(dB) < 0 || dB === L.ramo) return;
      var terzo = gr.filter(function (b) { return b !== L.ramo && b !== dB; })[0];
      if (mob.pos !== POS[k] && (mob.pos <= 3) === (POS[k] <= 3) && !mob.vuoto && (mob.ramo === terzo || arr === terzo)) { fermo[k] += segnoNutri(L); dire(NOME[k] + ', il giorno e la mobile del suo trigramma chiudono il raduno stagionale'); }
    });
    // la linea piu' forte dell'esagramma prende il posto della sede vuota del suo campo
    if (mE) {
      var fz = R.linee.map(function (Lx) { if (Lx.vuoto) return -9; var ex = WX[Lx.ramo], f = ex === mE ? 2 : GEN[mE] === ex ? 1 : -9; if (f < 0) return -9; if (Lx.ramo === c.monthBranch) f++; if (dB && (Lx.ramo === dB || dEl === ex)) f++; return f; });
      var mx = Math.max.apply(null, fz);
      if (mx >= 3 && fz.filter(function (v) { return v === mx; }).length === 1) { var pF = fz.indexOf(mx) + 1, kF = campo(pF); if (SEDE[kF].vuoto) { fermo[kF] += 1; dire('la linea più forte, L' + pF + ', sta nel campo ' + (kF === 'S' ? 'dello Shi' : 'della Ying') + ' vuoto: ne prende il posto'); } }
    }
    // i pilastri che convergono su una sede (non su una troppo fuori stagione; non quelli col suo elemento controllato)
    var pil = [['anno', c.yearStem, c.yearBranch], ['mese', c.monthStem, c.monthBranch], ['giorno', c.dayStem, dB], ['ora', c.hourStem, c.oraBranch]].filter(function (p) { return p[1] && p[2]; });
    ['S', 'Y'].forEach(function (k) {
      var L = SEDE[k]; if (!L.bestia || !L.bestia.cn || troppoFuori(L)) return;
      var cad = pil.filter(function (p) { return BESTIA_STELO[p[1]] === L.bestia.cn && vuoti.indexOf(p[2]) < 0 && KE[WX[L.ramo]] !== STELO_EL[p[1]]; });
      if (cad.length >= 2) { fermo[k] += 1; dire(cad.length + ' pilastri cadono su ' + NOME[k] + ': forte'); }
    });
    // il giorno e la linea accanto che drenano una sede (non quella nutrita da un movimento, non il ramo del mese)
    ['S', 'Y'].forEach(function (k) {
      var L = SEDE[k], e = WX[L.ramo]; if (nutrito[k] || L.ramo === c.monthBranch || !(dEl && GEN[e] === dEl)) return;
      var v = [POS[k] - 1, POS[k] + 1].filter(function (p) { return p >= 1 && p <= 6 && p !== mob.pos && inc.indexOf(p) < 0 && !R.linee[p - 1].vuoto && GEN[e] === WX[R.linee[p - 1].ramo]; })[0];
      if (v) { fermo[k] -= 1; dire('il giorno e L' + v + ' accanto drenano ' + NOME[k]); }
    });
    // la sede combinata e controllata dal mese
    ['S', 'Y'].forEach(function (k) { var L = SEDE[k]; if (mE && COMBINA[c.monthBranch] === L.ramo && KE[mE] === WX[L.ramo]) { fermo[k] -= 1; dire(NOME[k] + ' è combinat' + (k === 'S' ? 'o' : 'a') + ' e controllat' + (k === 'S' ? 'o' : 'a') + ' dal mese'); } });
    // la forza nel mese e nel giorno: conta lo squilibrio netto (la Ying forte che genera lo Shi gli passa la forza)
    if (fermo.S === fermo.Y) {
      var fs = function (L) { if (!mE) return 0; var e = WX[L.ramo], f = e === mE ? 2 : GEN[mE] === e ? 1 : GEN[e] === mE ? -1 : KE[mE] === e ? -2 : KE[e] === mE ? -1 : 0; if (dEl) { if (dEl === e || GEN[dEl] === e) f++; else if (KE[dEl] === e || GEN[e] === dEl) f--; } return f; };
      var a = fs(S), b = fs(Y); if (GEN[WX[Y.ramo]] === WX[S.ramo] && b > a) b = a;
      if (a - b >= 3) { fermo.S += 1; dire('lo Shi è molto più forte della Ying nel mese e nel giorno'); }
      else if (b - a >= 3) { fermo.Y += 1; dire('la Ying è molto più forte dello Shi nel mese e nel giorno'); }
    }
    if (bloccata.S) fermo.S = 0; if (bloccata.Y) fermo.Y = 0;
    _p.S += fermo.S; _p.Y += fermo.Y;
    return chiudi();
  }

  function leggi(R, c) { return (c && c.versione === 'regole') ? leggiRegole(R, c) : leggiPrincipi(R, c); }
  return { leggi: leggi, leggiRegole: leggiRegole, leggiPrincipi: leggiPrincipi };
}));
