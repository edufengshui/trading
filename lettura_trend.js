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
    var timely = function (L) { var e = WX[L.ramo]; return !!mE && (e === mE || GEN[mE] === e); };
    // 12
    // Edu, 09/10/2026: "Se 'troppo fuori stagione' taglia così tante carte allora non va bene. Diciamo che se tutte e due lo sono."
    if (troppo(S) && troppo(Y)) { out.racconto.push('Shi e Ying sono tutti e due troppo fuori stagione per rappresentare il trend: il metodo tace'); return out; }
    var dep = R.mutante.ramoDep, arr = R.mutante.ramoArr, aE = arr ? WX[arr] : null, dE = WX[dep];
    var pil = [['anno', c.yearStem, c.yearBranch], ['mese', c.monthStem, c.monthBranch], ['giorno', c.dayStem, c.dayBranch], ['ora', c.hourStem, c.oraBranch]]
      .filter(function (p) { return p[1] && p[2]; });
    var segno = function (L, fav) { // 11: il carattere
      var s = fav ? +1 : -1; if ((fav || c.colpisciPB) && (L.par === 'P' || L.par === 'B')) s = -s; return s;   // 11 solo per il nutrire (Edu, EURJPY 07/10/2026 s178: colpire la Ying P la indebolisce -> segue); c.colpisciPB torna alla forma vecchia
    };
    var pt = { S: 0, Y: 0 };
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
      if (Li && ai && ai !== Li.ramo) chi.push({ pos: ip, dep: Li.ramo, arr: ai, retro: RETRO[Li.ramo] === ai, tipo: 'l\'arrivo dell\'incompatibile L' + ip });
    });
    sedi.forEach(function (q) {
      var k = q[0], L = q[1], sp = q[2], e = WX[L.ramo], nome = k === 'S' ? 'lo Shi' : 'la Ying';
      chi.forEach(function (m) {
        var mA = m.arr, mAE = mA ? WX[mA] : null, mDE = WX[m.dep];
        if (!mA) return;
        // 10: la sede e' lei stessa la linea che si muove
        if (m.pos === sp) {
          // Edu (regole del vuoto, 22/09/2026): una linea che si muove non e' mai vuota alla partenza (AUDUSD 07/10/2026 s69:
          // "S si muove per generare indietro" con lo Shi Chou vuoto). c.mobileVuota === true torna alla forma vecchia.
          if (L.vuoto && c.mobileVuota) { out.racconto.push(nome + ' si muove ma è vuoto: non beneficia di nulla'); }
          else if (GEN[mAE] === e) { pt[k] += segno(L, true); out.racconto.push(nome + ' si fa generare indietro: avvantaggiato'); }
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
          if (GEN[mAE] === e) { if (L.vuoto && !(c.vuotaVibrante !== false && timely(L))) out.racconto.push(nome + ' è vuoto: il nutrimento di ' + m.tipo.replace('l\'arrivo', 'quell\'arrivo') + ' non arriva'); else { pt[k] += segno(L, true); out.racconto.push(m.tipo + ' ' + mA + ' nutre ' + nome + (L.vuoto ? ' (vuoto ma di stagione, già vibrante di suo)' : '')); } }
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
        // 9: il trigono con l'arrivo e il mese/giorno
        if (TRINE[mA] && TRINE[mA].indexOf(L.ramo) >= 0 && L.ramo !== mA && !L.vuoto) {
          var terzo = TRINE[mA].filter(function (b) { return b !== mA && b !== L.ramo; })[0];
          if (terzo === c.monthBranch || terzo === c.dayBranch) { pt[k] += segno(L, true); out.racconto.push(m.tipo + ' ' + mA + ' chiude il trigono con ' + nome + ' e il ' + (terzo === c.monthBranch ? 'mese' : 'giorno') + ': avvantaggiato'); }
        }
      });
      // 8: i pilastri che convergono sulla sede
      if (L.bestia && L.bestia.cn) {
        var caduti = pil.filter(function (p) { return BESTIA_STELO[p[1]] === L.bestia.cn && R.vuoti.indexOf(p[2]) < 0; });
        // Perimetro DI CLAUDE (NZDUSD 07/10/2026 s56, da validare): i pilastri non rendono forte una sede troppo fuori
        // stagione (morta o imprigionata nel mese). c.pilastriSuMorta === true torna alla forma vecchia.
        if (caduti.length >= 2 && troppo(L) && !c.pilastriSuMorta) out.racconto.push(caduti.length + ' pilastri cadono su ' + nome + ', ma è troppo fuori stagione: non la rendono forte');
        else if (caduti.length >= 2) { pt[k] += 1; out.racconto.push(caduti.length + ' pilastri cadono su ' + nome + ' (' + caduti.map(function (p) { return p[0]; }).join(', ') + '): forte'); }
      }
      // la sede legata e controllata dal mese (EURJPY 16/01/2026): svantaggiata
      if (c.monthBranch && COMBINA[c.monthBranch] === L.ramo && KE[mE] === e) { pt[k] -= 1; out.racconto.push(nome + ' è combinato e controllato dal mese: svantaggiato'); }
    });
    // 13: la Ying che genera lo Shi (Edu, 09/10/2026, S55, EURUSD 07/10/2026 s112: "Y genera S, e L5 si muove per pure
    //     generare S. Segue il trend") — il contro-trend che nutre il trend lo avvantaggia; vale anche con la Ying vuota
    //     (su quella carta la Ying Zi e' vuota). Il carattere dello Shi conta come nella regola 11.
    //     Estensioni DI CLAUDE non dette da Edu (Shi che genera la Ying, controlli fra le sedi): dietro c.sediTutte, spente.
    if (c.yGeneraS !== false && GEN[WX[Y.ramo]] === WX[S.ramo]) { pt.S += segno(S, true); out.racconto.push('la Ying genera lo Shi: il trend è nutrito'); }
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
    out.shi = pt.S; out.ying = pt.Y; out.punti = pt.S - pt.Y;
    if (out.punti > 0) out.verdetto = 'segue'; else if (out.punti < 0) out.verdetto = 'non segue';
    if (out.verdetto && c.emaDir) out.dir = (c.emaDir === 'up') === (out.verdetto === 'segue') ? 'LONG' : 'SHORT';
    out.racconto.push(out.verdetto ? ('Shi ' + (pt.S > 0 ? '+' : '') + pt.S + ', Ying ' + (pt.Y > 0 ? '+' : '') + pt.Y + ': ' + (out.verdetto === 'segue' ? 'il trend' : 'il contro-trend') + ' è avvantaggiato → ' + out.verdetto + (out.dir ? ' → ' + out.dir : '')) : 'nessuna delle due sedi è avvantaggiata: il metodo tace');
    return out;
  }
  return { leggi: leggi };
}));
