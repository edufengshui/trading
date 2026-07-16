/* trend.js — Level 1 trend reading for the Trading Calculator (window.XKDGTrend).
 *
 * M1 初傳 = trend (EMA 8+1). M2 中傳 / M3 末傳 confirm or deny it. Binary + directional:
 * confirmed → the cross FOLLOWS the trend; not confirmed → it goes AGAINST it. Each verdict
 * carries a trace of which rule decided it.
 *
 * Rules (dictated by the user; season/tomb tables from app-bazi.js):
 *   Base M2→M1: M2生M1 or 比和 → confirmed; M2 drains/controls M1 → not; M1剋M2 → confirmed
 *               unless M1 void; M2 六合 M1 → not (overrides 五行).
 *   M3 on M2:   M3 冲/drains/entombs M2 → M2 cancelled → lean on M1; M3 controls M2 → support
 *               removed → lean on M1; M3生M2 → reinforced. Lean on M1 → confirmed unless M1
 *               very untimely (囚/死).  M3 冲 M1 → trend struck → not.
 *   Tombs:      M1 = tomb of day stem → not, unless M2 controls/drains M1. M2 = tomb of M1 → not,
 *               recovered by M3 冲 M2 (but NOT if M1 void). M3 = tomb of M2 → M2 out.
 *               An empty (空) tomb does NOT bury → the tomb action is skipped.
 *   Void of M1: a void trend confirms only if nourished — M2生M1 with M2 strong (timely, or a
 *               strong M3生M2) and M3 not obstructing M2. A trend leaning on a void M1 → not.
 *   月將 (Month General): never void, always strong, DOUBLE energy — its nourishment of a void
 *               M1 always suffices; when it obstructs it cannot be neutralised by a normal M3.
 *               If M1 is void and M2 is the 月將, M2 REPRESENTS the trend and M3 judges it.
 *   三會 (directional trio): 寅卯辰 Wood · 巳午未 Fire · 申酉戌 Metal · 亥子丑 Water.
 *               Clockwise (ascending) → normal reading. Anticlockwise (descending) → the
 *               reading is REVERSED (final override).
 */
(function () {
  'use strict';

  var BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var WX = { '子': 'Water', '丑': 'Earth', '寅': 'Wood', '卯': 'Wood', '辰': 'Earth', '巳': 'Fire',
             '午': 'Fire', '未': 'Earth', '申': 'Metal', '酉': 'Metal', '戌': 'Earth', '亥': 'Water' };
  var GEN = { Wood: 'Fire', Fire: 'Earth', Earth: 'Metal', Metal: 'Water', Water: 'Wood' };
  var KE  = { Wood: 'Earth', Earth: 'Water', Water: 'Fire', Fire: 'Metal', Metal: 'Wood' };
  var COMBINE = { '子': '丑', '丑': '子', '寅': '亥', '亥': '寅', '卯': '戌', '戌': '卯',
                  '辰': '酉', '酉': '辰', '巳': '申', '申': '巳', '午': '未', '未': '午' };
  var TOMB_SHA = { '甲': '未', '乙': '戌', '丙': '戌', '丁': '丑', '戊': '戌',
                   '己': '丑', '庚': '丑', '辛': '辰', '壬': '辰', '癸': '未' };
  var TOMB_OF_ELEM = { Water: '辰', Wood: '未', Fire: '戌', Metal: '丑' }; // earth: none
  // 三會方局 (directional trios) — no Earth trio
  var DIRECTIONAL = [
    { elem: 'Wood',  trio: ['寅', '卯', '辰'], en: 'Wood/East' },
    { elem: 'Fire',  trio: ['巳', '午', '未'], en: 'Fire/South' },
    { elem: 'Metal', trio: ['申', '酉', '戌'], en: 'Metal/West' },
    { elem: 'Water', trio: ['亥', '子', '丑'], en: 'Water/North' }
  ];
  // 刑 (penalties): 寅巳申 · 丑戌未 · 子卯 · 辰午酉亥 自刑 (self)
  var XING = { '寅': '巳', '巳': '申', '申': '寅', '丑': '戌', '戌': '未', '未': '丑',
               '子': '卯', '卯': '子', '辰': '辰', '午': '午', '酉': '酉', '亥': '亥' };
  // earth branches advancing clockwise (辰→未→戌→丑→辰), three at a time
  var EARTH_ADVANCE = ['辰未戌', '未戌丑', '戌丑辰', '丑辰未'];
  var SELF_XING = ['辰', '午', '酉', '亥'];   // 自刑

  function generates(a, b) { return GEN[a] === b; }
  function controls(a, b) { return KE[a] === b; }
  function penalizes(a, b) { return XING[a] === b && a !== b; }   // 刑 between two different branches
  function chong(b) { return BRANCHES[(BRANCHES.indexOf(b) + 6) % 12]; }
  function tombOfBranch(br) { return TOMB_OF_ELEM[WX[br]] || null; }
  function veryUntimely(elem, season) { if (!season) return false; return controls(elem, season) || controls(season, elem); }

  // exact ascending trio → clockwise; exact descending trio → anticlockwise; else null
  function directionalCombo(a, b, c) {
    var seq = a + b + c;
    for (var i = 0; i < DIRECTIONAL.length; i++) {
      var d = DIRECTIONAL[i], asc = d.trio.join(''), desc = d.trio.slice().reverse().join('');
      if (seq === asc) return { elem: d.elem, cn: asc, en: d.en, order: 'clockwise' };
      if (seq === desc) return { elem: d.elem, cn: desc, en: d.en, order: 'anticlockwise' };
    }
    return null;
  }

  function evaluateTrend(M1, M2, M3, opts) {
    opts = opts || {};
    var dayStem = opts.dayStem, voids = opts.voidBranches || [], season = opts.seasonElement || null, mg = opts.monthGeneral || null;
    var trace = []; function T(s) { trace.push(s); }

    // 返吟 (Fan Yin / Clashing chart): do not trade
    if (opts.isFanYin) {
      T('la carta è 返吟 (Fan Yin / Clashing) → meglio non operare oggi');
      return { confirmed: null, noTrade: true, trace: trace, M1: M1, M2: M2, M3: M3,
               elements: { M1: WX[M1], M2: WX[M2], M3: WX[M3] }, seasonElement: season,
               m1Void: false, monthGeneral: mg, trendMsg: M1, substituted: false, combo: null };
    }

    function isMG(b) { return !!(mg && b === mg); }
    function timely(elem) { if (!season) return true; return elem === season || generates(season, elem); } // 旺 or 相
    function isVoid(b) { return voids.indexOf(b) >= 0 && !isMG(b); }        // 月將 is never void
    function strongMsg(b) { return isMG(b) || timely(WX[b]); }

    var combo = directionalCombo(M1, M2, M3);   // computed first, applied as final override

    // 月將 in M2 takes over a void trend
    var A = M1, B = M2, C = M3, substituted = false;
    if (isVoid(M1) && isMG(M2)) {
      A = M2; B = M3; C = null; substituted = true;
      T('M1 ' + M1 + ' è vuoto (空) e M2 ' + M2 + ' è il 月將 (Month General) → è M2 a rappresentare il trend, giudicato da M3 ' + M3);
    }

    // ---- core assessment: A = trend, B = judge, C = third (may be null) ----
    var eA = WX[A], eB = WX[B], eC = C ? WX[C] : null;
    var voidA = isVoid(A), voidB = isVoid(B), voidC = C ? isVoid(C) : false;
    var bMG = isMG(B);

    var bGenA = generates(eB, eA), bSameA = (eB === eA), aGenB = generates(eA, eB);
    var bCtrlA = controls(eB, eA), aCtrlB = controls(eA, eB);
    var bCombA = (COMBINE[B] === A);
    var bIsTombA = (tombOfBranch(A) === B) && !voidB;                       // empty tomb doesn't bury
    var cChongB = C ? (chong(B) === C) : false, cDrainB = C ? generates(eB, eC) : false;
    var cIsTombB = C ? ((tombOfBranch(B) === C) && !voidC) : false;
    var cCtrlB = C ? controls(eC, eB) : false, cGenB = C ? generates(eC, eB) : false;
    var cChongA = C ? (chong(A) === C) : false;
    var cNeutralizesB = (cChongB || cDrainB || cIsTombB) && !bMG;           // 月將 B is immovable
    var cObstructsB = (cCtrlB || cChongB || cDrainB || cIsTombB) && !bMG;
    var bStrong = strongMsg(B) || (cGenB && C && strongMsg(C));

    if (isMG(A)) T('trend ' + A + ' è il 月將 → mai vuoto, sempre forte (doppia energia)');
    if ((tombOfBranch(A) === B) && voidB) T('M2 ' + B + ' sarebbe la tomba del trend ma è vuoto (空) → non seppellisce');

    var confirmed = null, kind = '';
    function leanOnA(reason) {
      if (voidA) { confirmed = false; T(reason + ' → si appoggia al trend, ma è vuoto (空) e non nutrito → non confermato'); }
      else if (veryUntimely(eA, season) && !isMG(A)) { confirmed = false; T(reason + ' → si appoggia al trend, ma è senza energia (囚/死) → non confermato'); }
      else { confirmed = true; T(reason + ' → si appoggia al trend → confermato'); }
    }

    if (dayStem && TOMB_SHA[dayStem] === A) {
      kind = 'daystomb';
      if (bCtrlA || aGenB) { confirmed = true; T('trend ' + A + ' è la tomba del tronco-giorno ' + dayStem + ', ma ' + B + ' la ' + (bCtrlA ? 'controlla' : 'drena') + ' → tomba aperta → confermato'); }
      else { confirmed = false; T('trend ' + A + ' è la tomba del tronco-giorno ' + dayStem + ' → sepolto → non confermato'); }
    }
    else if (bCombA) { confirmed = false; kind = 'combine'; T(B + ' lega il trend ' + A + ' [六合]' + (bMG ? ' (月將, doppia)' : '') + ' → non confermato'); }
    else if (bIsTombA) {
      kind = 'tombA';
      if (voidA) { confirmed = false; T(B + ' è la tomba del trend ' + A + ' e il trend è vuoto (空): una tomba non recupera un trend vuoto — nemmeno un 冲 lo salva → non confermato'); }
      else if (cChongB && !bMG) { confirmed = true; T(B + ' è la tomba del trend ' + A + ', ma ' + C + ' la clasha → tomba aperta → trend recuperato → confermato'); }
      else { confirmed = false; T(B + ' è la tomba del trend ' + A + (bMG ? ' (月將: non apribile)' : '') + ' → sepolto → non confermato'); }
    }
    else if (bGenA) {
      if (voidA) {
        kind = 'void';
        var nourished = bMG || (bStrong && !cObstructsB);
        if (nourished) { confirmed = true; T('trend ' + A + ' vuoto ma ' + B + ' lo genera' + (bMG ? ' (月將, doppia energia → basta da solo)' : timely(eB) ? ' (forte/timely)' : ' (rinforzato dal terzo)') + (bMG ? '' : ' e il terzo non ostacola') + ' → trend rifornito → confermato'); }
        else { confirmed = false; T('trend ' + A + ' vuoto: ' + B + ' lo genera ma ' + (!bStrong ? B + ' è debole' : 'il terzo ostacola ' + B) + ' → nutrimento insufficiente → non confermato'); }
      } else { confirmed = true; kind = 'help'; T(B + ' genera il trend ' + A + ' [生]' + (bMG ? ' (月將)' : '') + ' → confermato'); }
    }
    else if (bSameA) {
      if (voidA) { confirmed = false; kind = 'void'; T(B + ' 比和 col trend vuoto ma non lo nutre (serve 生) → non confermato'); }
      else { confirmed = true; kind = 'help'; T(B + ' stesso elemento del trend [比和] → confermato'); }
    }
    else if (aGenB) { confirmed = false; kind = 'harm'; T(B + ' drena il trend ' + A + (bMG ? ' (月將, doppia)' : '') + ' → non confermato'); }
    else if (bCtrlA) { confirmed = false; kind = 'harm'; T(B + ' controlla il trend ' + A + ' [剋]' + (bMG ? ' (月將, doppia)' : '') + ' → non confermato'); }
    else if (aCtrlB) {
      if (voidA) { confirmed = false; kind = 'void'; T('il trend ' + A + ' controlla ' + B + ' ma è vuoto (空) → non confermato'); }
      else { confirmed = true; kind = 'help'; T('il trend ' + A + ' controlla ' + B + ' [剋] → confermato'); }
    }
    else { confirmed = true; kind = 'none'; T('nessuna relazione forte su ' + A + ' → confermato di default'); }

    if (C) {
      if (kind === 'harm' && cNeutralizesB) { leanOnA(C + ' neutralizza ' + B + ' (' + (cChongB ? '冲' : cDrainB ? 'drena' : 'tomba') + ')'); }
      else if (kind === 'help' && (cNeutralizesB || (cCtrlB && !bMG))) { leanOnA(C + ' ' + (cCtrlB ? 'controlla' : 'neutralizza') + ' ' + B); }
      else if (kind === 'help' && cGenB) { T(C + ' genera ' + B + ' → sostegno rinforzato → resta confermato'); }
      if (cChongA && !isMG(A)) { confirmed = false; T(C + ' clasha il trend ' + A + ' [冲] → il trend è colpito → non confermato'); }
      else if (cChongA && isMG(A)) { T(C + ' clasha il trend ma è il 月將 (sempre forte) → il trend regge'); }
    }

    // ---- 刑 (Penalty Sha): "a spirit that hurts and brings disability" → does not follow ----
    // Any penalty among the three messages is negative. Terminal.
    var pens = [];
    var msgs = [{ n: 'M1', b: M1 }, { n: 'M2', b: M2 }, { n: 'M3', b: M3 }];
    for (var pi = 0; pi < 3; pi++) {
      for (var pj = 0; pj < 3; pj++) {
        if (pi === pj) continue;
        if (penalizes(msgs[pi].b, msgs[pj].b)) {
          var tag = msgs[pi].n + ' ' + msgs[pi].b + ' 刑 ' + msgs[pj].n + ' ' + msgs[pj].b;
          if (pens.indexOf(tag) < 0) pens.push(tag);
        }
      }
    }
    // 自刑 (self-penalty): the same self-penalising branch appearing twice
    for (var si = 0; si < 3; si++) {
      for (var sj = si + 1; sj < 3; sj++) {
        if (msgs[si].b === msgs[sj].b && SELF_XING.indexOf(msgs[si].b) >= 0) {
          pens.push(msgs[si].n + '/' + msgs[sj].n + ' ' + msgs[si].b + ' 自刑 (self-penalty)');
        }
      }
    }
    if (pens.length) {
      // if M2 penalises M1, ONLY a 冲 (clash) or 六合 (combination) from M3 can cancel the damage
      var penM1M2 = penalizes(M1, M2) || penalizes(M2, M1);
      var otherPens = pens.filter(function (p) {
        return !(p.indexOf('M1') >= 0 && p.indexOf('M2') >= 0 && p.indexOf('M3') < 0);
      });
      var rescue = (chong(M2) === M3) ? '冲' : ((COMBINE[M2] === M3) ? '六合' : null);
      if (penM1M2 && rescue && !otherPens.length) {
        T('刑 (Penalty): ' + pens.join(' · ') + ' — ma M3 ' + M3 + ' ' + rescue + ' M2 ' + M2 +
          ' → il danno del 刑 è annullato');
      } else {
        confirmed = false;
        var isEarthSeq = EARTH_ADVANCE.indexOf(M1 + M2 + M3) >= 0;
        T('刑 (Penalty): ' + pens.join(' · ') +
          (isEarthSeq ? ' — sequenza oraria di terra ' + M1 + M2 + M3 + ': non può avanzare' : '') +
          (penM1M2 && !rescue ? ' — nessun 冲/六合 da M3 che lo annulli' : '') +
          ' → non si segue il trend');
      }
    }

    // ---- 三會 directional trio: final override ----
    if (combo) {
      if (combo.order === 'clockwise') {
        T('三會 ' + combo.cn + ' (' + combo.en + ') in sequenza oraria → interpretazione normale');
      } else {
        confirmed = !confirmed;
        T('三會 ' + combo.cn + ' (' + combo.en + ') in sequenza ANTIORARIA → interpretazione contraria → ' + (confirmed ? 'confermato' : 'non confermato'));
      }
    }

    return { confirmed: confirmed, noTrade: false, trace: trace, M1: M1, M2: M2, M3: M3,
             elements: { M1: WX[M1], M2: WX[M2], M3: WX[M3] }, seasonElement: season,
             m1Void: isVoid(M1), monthGeneral: mg, trendMsg: A, substituted: substituted,
             combo: combo, penalties: pens || [] };
  }

  // ---- EMA(8+1) trend + consolidation filter (shared by the PWA and the backtest) ----
  var EMA_PERIOD = 8;
  var EMA_WINDOW = 10;        // days of EMA direction looked at
  var EMA_MAX_CHANGES = 2;    // more reversals than this in the window → choppy → no trade

  function emaSeries(closes, period) {
    period = period || EMA_PERIOD;
    if (!closes || closes.length < period) return [];
    var k = 2 / (period + 1), prev = null, out = [];
    for (var i = 0; i < closes.length; i++) {
      if (i < period - 1) continue;
      if (i === period - 1) { var s = 0; for (var j = 0; j < period; j++) s += closes[j]; prev = s / period; out.push(prev); continue; }
      prev = closes[i] * k + prev * (1 - k); out.push(prev);
    }
    return out;
  }
  function emaDirs(series) {
    var d = [];
    for (var i = 1; i < series.length; i++) d.push(series[i] > series[i - 1] ? 'u' : (series[i] < series[i - 1] ? 'd' : 'f'));
    return d;
  }
  function countChanges(dirs) {           // flat steps don't break a leg
    var n = 0, prev = null;
    for (var i = 0; i < dirs.length; i++) {
      var x = dirs[i]; if (x === 'f') continue;
      if (prev !== null && x !== prev) n++;
      prev = x;
    }
    return n;
  }
  // closes = completed daily closes up to (and including) the day BEFORE the trading day
  function emaTrend(closes) {
    var series = emaSeries(closes, EMA_PERIOD);
    var dirs = emaDirs(series);
    if (!dirs.length) return { direction: null, consolidated: false, note: 'insufficient history' };
    var win = dirs.slice(-EMA_WINDOW), last = win[win.length - 1];
    var changes = countChanges(win);
    return {
      direction: last === 'u' ? 'up' : (last === 'd' ? 'down' : 'flat'),
      ema: series[series.length - 1], emaPrev: series[series.length - 2],
      dirs: win.join(''), changes: changes, consolidated: changes <= EMA_MAX_CHANGES,
      window: EMA_WINDOW, maxChanges: EMA_MAX_CHANGES
    };
  }

  var API = { evaluateTrend: evaluateTrend, directionalCombo: directionalCombo,
    emaSeries: emaSeries, emaDirs: emaDirs, countChanges: countChanges, emaTrend: emaTrend,
    EMA_PERIOD: EMA_PERIOD, EMA_WINDOW: EMA_WINDOW, EMA_MAX_CHANGES: EMA_MAX_CHANGES, WX: WX, GEN: GEN, KE: KE,
              COMBINE: COMBINE, TOMB_SHA: TOMB_SHA, TOMB_OF_ELEM: TOMB_OF_ELEM, DIRECTIONAL: DIRECTIONAL,
              veryUntimely: veryUntimely };
  if (typeof window !== 'undefined') window.XKDGTrend = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})();
