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
 *   冲 clash vs 剋 control (validated 15/07/2026, USDCAD 庚寅 day, 未 month, 三傳 申寅巳):
 *               when the trend (A) and its judge (B) are BOTH a 冲 (clash, 6 apart) pair AND a
 *               五行 control pair, B is always read as the one clashing A (independent of which
 *               direction the five-element control points). Strength decides: 墓(tomb this
 *               month, weakest,0) < 囚/死(1) < normal(2) < 相(month-branch's own element, or
 *               the broad season, generates it,3) < 旺(matches the broad season,4). If B (the
 *               clasher) is stronger than A, the clash breaks the trend → not confirmed. If B is
 *               weaker, the clash alone fails; a 六合 of C onto A then actively protects the
 *               trend (confirmed) — and that same bond also shields it from 刑 (Penalty). If B is
 *               weaker and there is no such bond, the clash does not participate further and the
 *               ordinary 五行 chain decides unmodified.
 *   刑 (Penalty Sha): any penalty among the three messages → not confirmed (terminal), except
 *               a lone M2-penalises-M1 case which a M3 冲/六合 on M2 can cancel.
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
  // ogni ramo di terra È la tomba di un elemento: clashata, lo libera
  var TOMB_CONTENT = { '辰': 'Water', '未': 'Wood', '戌': 'Fire', '丑': 'Metal' };
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

  // ---- 十二長生 (the twelve life stages) -------------------------------------------------
  // Strength is read as the stage of a branch's element against the MONTH branch.
  // 1 長生 Birth · 2 沐浴 Bathing · 3 冠帶 Schooling · 4 臨官 Office · 5 帝旺 Peak · 6 衰 Decline
  // 7 病 Sick · 8 死 Dead · 9 墓 Tomb · 10 絕 Vanishing · 11 胎 Embryo · 12 養 Preparation
  //
  // Energy: full up to stage 6; from 7 it starts draining; 8 lower still; 9 is the tomb — the
  // element is locked away but AVAILABLE if the day branch clashes the month branch; only at
  // 10 絕 is the element truly ineffective. 11 and 12 are very weak but accumulating.
  //
  // EARTH HAS NO TWELVE STAGES. For Earth the seasonal influence rules instead: it is strong in
  // the four Earth months (辰未戌丑) and strong whenever Fire is strong. Having no cycle, Earth
  // has no 絕 either — it never becomes truly ineffective, so its rank is floored.
  //
  // ASSUMPTION — one sequence per ELEMENT, in the yang order. Yin branches (酉 as 辛, 卯 as 乙…)
  //              are NOT run backwards on their own reversed sequence.
  var SHENG_START = { Wood: '亥', Fire: '寅', Metal: '巳', Water: '申' };
  var EARTH_MONTHS = ['辰', '未', '戌', '丑'];
  var EARTH_STRONG_RANK = 8;   // in an Earth month
  var EARTH_FLOOR_RANK = 2;    // no 絕: Earth never vanishes entirely
  var STAGE_CN = ['長生', '沐浴', '冠帶', '臨官', '帝旺', '衰', '病', '死', '墓', '絕', '胎', '養'];
  var STAGE_EN = ['Birth', 'Bathing', 'Schooling', 'Office', 'Peak', 'Decline',
                  'Sick', 'Dead', 'Tomb', 'Vanishing', 'Embryo', 'Preparation'];

  // stage 1..12 of an element in a given month branch, or null when the month is unknown
  function lifeStage(elem, monthBranch) {
    if (!elem || !monthBranch || !SHENG_START[elem]) return null;
    var s = BRANCHES.indexOf(SHENG_START[elem]), m = BRANCHES.indexOf(monthBranch);
    if (s < 0 || m < 0) return null;
    return ((m - s) % 12 + 12) % 12 + 1;
  }
  function stageName(st) { return st ? STAGE_CN[st - 1] + ' ' + STAGE_EN[st - 1] : '?'; }

  // Strength rank 0..9 derived from the stage. Used both for the clash tie-break and for the
  // "has energy" test. A tomb (9) that the day has unlocked is read as an ordinary stage.
  var STAGE_RANK = { 1: 6, 2: 6, 3: 7, 4: 8, 5: 9, 6: 5, 7: 4, 8: 3, 9: 1, 10: 0, 11: 2, 12: 2 };
  var TOMB_OPENED_RANK = 5;
  function stageRank(st, tombOpened) {
    if (!st) return 5;                                   // no month known → neutral
    if (st === 9 && tombOpened) return TOMB_OPENED_RANK;
    return STAGE_RANK[st];
  }
  // Earth: strong in an Earth month, otherwise it borrows the Fire strength of that month,
  // never falling below the floor.
  function earthRank(monthBranch) {
    if (!monthBranch) return 5;
    if (EARTH_MONTHS.indexOf(monthBranch) >= 0) return EARTH_STRONG_RANK;
    var fire = stageRank(lifeStage('Fire', monthBranch), false);
    return Math.max(fire, EARTH_FLOOR_RANK);
  }
  function elemRank(elem, monthBranch, tombOpened) {
    if (elem === 'Earth') return earthRank(monthBranch);
    return stageRank(lifeStage(elem, monthBranch), tombOpened);
  }
  // "has energy" = stages 1..6 (rank >= 5). A released tomb counts as having energy.
  function hasEnergy(st, tombOpened) { return stageRank(st, tombOpened) >= 5; }

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
    var dayStem = opts.dayStem, voids = opts.voidBranches || [], season = opts.seasonElement || null,
        mg = opts.monthGeneral || null, monthBranch = opts.monthBranch || null,
        dayBranch = opts.dayBranch || null, lessons = opts.fourLessons || null,
        hourBranch = opts.hourBranch || null;
    var monthElem = monthBranch ? WX[monthBranch] : null;
    var trace = []; function T(s) { trace.push(s); }

    // ---- M1 "born combined": in DLR the first message does not come out of nowhere, it rises
    // from one of the four lessons. If it sits on a branch it combines with (六合), it is born
    // already bound and its capacity is notably reduced — a bound trend cannot stand on its own.
    var m1Seat = null, m1BornCombined = false, m1Freed = null;
    if (lessons && lessons.length) {
      for (var li = 0; li < lessons.length; li++) {
        var lt = lessons[li].top && lessons[li].top.branch ? lessons[li].top.branch : lessons[li].top;
        var lb = lessons[li].bottom;
        if (lt === M1 && COMBINE[M1] === lb && !(dayBranch && chong(dayBranch) === lb)) { m1Seat = lb; m1BornCombined = true; break; }
      }
    }
    // A clash on the branch that binds M1 breaks the bond and frees the trend.
    // Which message may do it is set by `freeMode`: 'none' | 'm2' | 'm3' | 'either' | 'day'.
    var freeMode = opts.freeMode || 'either';
    if (m1BornCombined && m1Seat) {
      var byM2 = (chong(m1Seat) === M2), byM3 = (chong(m1Seat) === M3), byDay = (chong(m1Seat) === dayBranch);
      if ((freeMode === 'm2' && byM2) || (freeMode === 'm3' && byM3) ||
          (freeMode === 'either' && (byM2 || byM3)) || (freeMode === 'day' && byDay)) {
        m1Freed = byM2 && (freeMode !== 'm3') ? 'M2 ' + M2 : (byM3 ? 'M3 ' + M3 : 'il giorno ' + dayBranch);
        m1BornCombined = false;
      }
    }

    // The day branch clashing the month branch unlocks whatever element is entombed there,
    // making it available for that day only.
    var tombOpened = !!(dayBranch && monthBranch && chong(monthBranch) === dayBranch);
    function stOf(b) { return lifeStage(WX[b], monthBranch); }
    function isMGearly(b) { return !!(mg && b === mg); }
    function voidRaw(b) { return voids.indexOf(b) >= 0 && !isMGearly(b); }
    // Il ramo del giorno può clashare un messaggio. Se il messaggio ha energia il clash NON lo
    // elimina: lo eccita. Se è già debole, lo spazza via. In entrambi i casi lo "sgancia" da
    // qualsiasi 六合 in cui fosse impegnato.
    function dayClash(b) { return !!(dayBranch && chong(dayBranch) === b); }
    function baseRank(b) { return elemRank(WX[b], monthBranch, tombOpened); }
    function rankOf(b) {
      var r = baseRank(b);
      if (isMGearly(b)) return 9;                                   // 月將: energia del Sole, sempre al massimo
      if (dayClash(b) && r >= 5) r = Math.min(9, r + 1);            // clashato ma forte → eccitato
      if (dayClash(b) && r < 5) r = 0;                              // clashato e debole → spazzato via
      if (voidRaw(b) && r > 0) r = Math.floor(r / 2);               // vuoto → energia dimezzata
      return r;
    }
    function energetic(b) { return rankOf(b) >= 5; }
    // vuoto E untimely: praticamente non esiste. Vuoto ma timely: dimezzato, ancora funzionale.
    function nonExistent(b) {
      if (isMGearly(b)) return false;                               // il 月將 non svanisce mai
      return (voidRaw(b) && baseRank(b) < 5) || (dayClash(b) && baseRank(b) < 5);
    }
    function excited(b) { return dayClash(b) && (isMGearly(b) || baseRank(b) >= 5); }
    // un 六合 si scioglie se il giorno clasha uno dei due rami
    function bonded(x, y) { return COMBINE[x] === y && !dayClash(x) && !dayClash(y); }
    function describe(b) {
      if (WX[b] === 'Earth') {
        if (!monthBranch) return b;
        return b + ' (terra, ' + (EARTH_MONTHS.indexOf(monthBranch) >= 0 ? 'mese di terra' :
               energetic(b) ? 'sostenuta dal fuoco' : 'senza sostegno') + ')';
      }
      var st = stOf(b), extra = '';
      if (excited(b)) extra += ', eccitato dal clash del giorno';
      else if (dayClash(b)) extra += ', spazzato via dal clash del giorno';
      if (voidRaw(b)) extra += nonExistent(b) ? ', vuoto e senza energia' : ', vuoto (energia dimezzata)';
      if (!st) return b + (extra ? ' (' + extra.slice(2) + ')' : '');
      return b + ' (' + stageName(st) + (st === 9 && tombOpened ? ', tomba aperta dal giorno' : '') + extra + ')';
    }

    // 返吟 (Fan Yin / Clashing chart): do not trade
    if (opts.isFanYin) {
      T('la carta è 返吟 (Fan Yin / Clashing) → meglio non operare oggi');
      return { confirmed: null, noTrade: true, trace: trace, M1: M1, M2: M2, M3: M3,
               elements: { M1: WX[M1], M2: WX[M2], M3: WX[M3] }, seasonElement: season,
               m1Void: false, monthGeneral: mg, trendMsg: M1, substituted: false, combo: null };
    }

    function isMG(b) { return !!(mg && b === mg); }
    function isVoid(b) { return voids.indexOf(b) >= 0 && !isMG(b); }        // 月將 is never void
    function strongMsg(b) { return isMG(b) || energetic(b); }
    // "very timely" gate for M3 reaching past M2 onto M1: 臨官/帝旺 territory, i.e. rank >= 8.
    // Loosen to `energetic(b)` (stages 1-6) if this proves too strict.
    function veryTimely(b) { return isMG(b) || rankOf(b) >= 8; }

    var combo = directionalCombo(M1, M2, M3);   // computed first, applied as final override

    // 月將 in M2 takes over a void trend
    var A = M1, B = M2, C = M3, substituted = false;
    if (isVoid(M1) && isMG(M2)) {
      A = M2; B = M3; C = null; substituted = true;
      T('M1 ' + M1 + ' è vuoto (空) e M2 ' + M2 + ' è il 月將 (Month General) → è M2 a rappresentare il trend, giudicato da M3 ' + M3);
    }
    else if (nonExistent(M1) && M2 && !nonExistent(M2)) {
      A = M2; B = M3; C = null; substituted = true;
      T('M1 ' + describe(M1) + ' → praticamente non esiste: il trend passa a M2 ' + describe(M2) +
        ', giudicato da M3 ' + M3);
    }

    // ---- core assessment: A = trend, B = judge, C = third (may be null) ----
    var eA = WX[A], eB = WX[B], eC = C ? WX[C] : null;
    var voidA = isVoid(A), voidB = isVoid(B), voidC = C ? isVoid(C) : false;
    var bMG = isMG(B);

    var bGenA = generates(eB, eA), bSameA = (eB === eA), aGenB = generates(eA, eB);
    var bCtrlA = controls(eB, eA), aCtrlB = controls(eA, eB);
    var bCombA = bonded(B, A);
    var bIsTombA = (tombOfBranch(A) === B) && !voidB;                       // empty tomb doesn't bury
    var cChongB = C ? (chong(B) === C) : false, cDrainB = C ? generates(eB, eC) : false;
    var cIsTombB = C ? ((tombOfBranch(B) === C) && !voidC) : false;
    var cCtrlB = C ? controls(eC, eB) : false, cGenB = C ? generates(eC, eB) : false;
    var cChongA = C ? (chong(A) === C) : false;
    var cCombB = C ? bonded(C, B) : false;                            // 六合 M3–M2
    var cNeutralizesB = (cChongB || cDrainB || cIsTombB || cCombB) && !bMG; // 月將 B is immovable
    var cObstructsB = (cCtrlB || cChongB || cDrainB || cIsTombB || cCombB) && !bMG;
    var bStrong = strongMsg(B) || (cGenB && C && strongMsg(C));

    // ---- 貪合忘冲: a branch tied up in a 六合 is occupied and loses its operativity ----
    // C bonded to B cannot also reach across and strike A.
    var cBound = cCombB;
    // ---- M3 reaching past M2 onto M1: only if very timely AND not obstructed by M2 ----
    // M2 obstructs M3 by controlling, clashing, draining or bonding it.
    var bObstructsC = C ? (controls(eB, eC) || chong(B) === C || generates(eC, eB) || COMBINE[B] === C) : false;
    var cCanReachA = !!C && !cBound && veryTimely(C) && !bObstructsC;
    if (C && !cBound && cChongA && !cCanReachA) {
      T('M3 ' + describe(C) + ' clasherebbe il trend, ma ' +
        (!veryTimely(C) ? 'non è abbastanza timely' : 'M2 ' + B + ' lo ostacola') + ' → non arriva su M1');
    }
    if (cBound && (cChongA || penalizes(C, A))) {
      T('M3 ' + C + ' è legato a M2 ' + B + ' [六合] → impegnato, non agisce su M1 (貪合忘冲)');
    }

    if (m1BornCombined && !substituted) T('trend ' + M1 + ' nasce combinato con ' + m1Seat + ' [六合] nella sua lettura → capacità ridotta');
    else if (m1Freed && !substituted) T('trend ' + M1 + ' nasceva combinato con ' + m1Seat + ', ma ' + m1Freed + ' clasha il legame → trend liberato');
    if (isMG(A)) T('trend ' + A + ' è il 月將 → mai vuoto, sempre forte (doppia energia)');
    if ((tombOfBranch(A) === B) && voidB) T('M2 ' + B + ' sarebbe la tomba del trend ma è vuoto (空) → non seppellisce');

    var confirmed = null, kind = '', drainHarm = false;

    // ---- A/B 冲 clash coinciding with a 五行 control relation: strength decides ----
    // B (the judge, M2) is always cast as the one clashing the trend A — independent of
    // which side happens to control the other by the five elements.
    var abClash = (chong(A) === B);
    var clashOverride = null;
    if (abClash && (bCtrlA || aCtrlB)) {
      var rA = rankOf(A), rB = rankOf(B);
      if (rB > rA) {
        clashOverride = 'attack';
        T(B + ' 冲 ' + A + ' [clash]: ' + describe(B) + ' è più forte del trend ' + describe(A) + ' → il clash sfonda → non confermato');
      } else {
        var rescueByC = C && bonded(C, A);
        if (rescueByC) {
          clashOverride = 'rescued';
          T(B + ' 冲 ' + A + ' [clash]: ' + describe(B) + ' è più debole del trend ' + describe(A) + ' e ' + C + ' 六合 ' + A + ' → il trend è protetto (anche dal 刑) → confermato');
        } else {
          T(B + ' 冲 ' + A + ' [clash]: ' + describe(B) + ' è più debole del trend ' + describe(A) + ' e senza protezione di M3 → il clash non sfonda, segue la relazione dei cinque elementi');
          // no override: let the ordinary 五行 chain decide, unmodified
        }
      }
    }
    if (clashOverride === 'attack') { confirmed = false; kind = 'harm'; }
    else if (clashOverride === 'rescued') { confirmed = true; kind = 'help'; }

    function leanOnA(reason) {
      if (m1BornCombined && A === M1 && !substituted) {
        confirmed = false;
        T(reason + ' → si dovrebbe appoggiare al trend, ma ' + M1 + ' nasce combinato con ' + m1Seat +
          ' [六合] nella sua lettura: legato, non regge da solo → non confermato');
      }
      else if (voidA) { confirmed = false; T(reason + ' → si appoggia al trend, ma è vuoto (空) e non nutrito → non confermato'); }
      else if (!energetic(A) && !isMG(A)) { confirmed = false; T(reason + ' → si appoggia al trend, ma il trend ' + describe(A) + ' è senza energia → non confermato'); }
      else { confirmed = true; T(reason + ' → si appoggia al trend → confermato'); }
    }

    if (clashOverride) {
      // already decided above by clash-strength; the ordinary 五行 chain is skipped.
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
        if (nourished) { confirmed = true; T('trend ' + A + ' vuoto ma ' + B + ' lo genera' + (bMG ? ' (月將, doppia energia → basta da solo)' : energetic(B) ? ' (forte/timely)' : ' (rinforzato dal terzo)') + (bMG ? '' : ' e il terzo non ostacola') + ' → trend rifornito → confermato'); }
        else { confirmed = false; T('trend ' + A + ' vuoto: ' + B + ' lo genera ma ' + (!bStrong ? B + ' è debole' : 'il terzo ostacola ' + B) + ' → nutrimento insufficiente → non confermato'); }
      } else { confirmed = true; kind = 'help'; T(B + ' genera il trend ' + A + ' [生]' + (bMG ? ' (月將)' : '') + ' → confermato'); }
    }
    else if (bSameA) {
      if (voidA) { confirmed = false; kind = 'void'; T(B + ' 比和 col trend vuoto ma non lo nutre (serve 生) → non confermato'); }
      else { confirmed = true; kind = 'help'; T(B + ' stesso elemento del trend [比和] → confermato'); }
    }
    else if (aGenB) {
      if (bMG || energetic(B)) { confirmed = false; kind = 'harm'; drainHarm = true; T(describe(B) + ' drena il trend ' + A + (bMG ? ' (月將, doppia)' : '') + ' → non confermato'); }
      else { confirmed = true; kind = 'none'; T(describe(B) + ' drenerebbe il trend ' + A + ', ma è senza energia → drenaggio inefficace → confermato'); }
    }
    else if (bCtrlA) { confirmed = false; kind = 'harm'; T(B + ' controlla il trend ' + A + ' [剋]' + (bMG ? ' (月將, doppia)' : '') + ' → non confermato'); }
    else { confirmed = true; kind = 'none'; T('nessuna relazione forte su ' + A + ' → confermato di default'); }

    if (C && !clashOverride) {
      if (kind === 'harm' && drainHarm && cDrainB && !cChongB && !cIsTombB && !cCombB) {
        // 未 → 酉 → 亥: l'energia continua a scorrere via da M1, non torna indietro
        T(describe(C) + ' drena a sua volta ' + B + ' → il deflusso da ' + A + ' prosegue lungo la catena → resta non confermato');
      }
      else if (kind === 'harm' && (cNeutralizesB || (cCtrlB && !bMG))) { leanOnA(C + ' ' + (cCtrlB && !cNeutralizesB ? 'controlla' : 'neutralizza') + ' ' + B + ' (' + (cChongB ? '冲' : cCombB ? '六合' : cDrainB ? 'drena' : cIsTombB ? 'tomba' : '剋') + ')'); }
      else if (kind === 'help' && (cNeutralizesB || (cCtrlB && !bMG))) { leanOnA(C + ' ' + (cCtrlB ? 'controlla' : 'neutralizza') + ' ' + B); }
      else if (kind === 'help' && cGenB) { T(C + ' genera ' + B + ' → sostegno rinforzato → resta confermato'); }
    }
    if (C) {
      if (cChongA && cCanReachA && !isMG(A) && clashOverride !== 'rescued') { confirmed = false; T(C + ' clasha il trend ' + A + ' [冲] → il trend è colpito → non confermato'); }
      else if (cChongA && isMG(A)) { T(C + ' clasha il trend ma è il 月將 (sempre forte) → il trend regge'); }
    }

    // ---- 墓庫破: una tomba di terra clashata libera ciò che custodisce -----------------
    // Se M1 è un ramo di terra e viene clashato, l'elemento in tomba esce. Se quell'elemento è
    // abbondante nel mese, si riversa: quando controlla M2 e M2 è untimely, lo spegne. M3 che
    // genera lo stesso elemento (o gli appartiene) ingrossa il flusso. Senza più sostegno e con
    // la propria tomba sfondata, il trend è distrutto.
    var relElem = TOMB_CONTENT[A] || null;
    if (relElem && !isMG(A)) {
      var breakers = [];
      if (hourBranch && chong(hourBranch) === A) breakers.push(dayBranch === A ? "dall'ora " + hourBranch + ' (che clasha il giorno, diventato il trend)' : "dall'ora " + hourBranch);
      if (dayBranch && chong(dayBranch) === A && dayBranch !== hourBranch) breakers.push('dal giorno ' + dayBranch);
      if (B && chong(B) === A) breakers.push('da M2 ' + B);
      if (C && chong(C) === A) breakers.push('da M3 ' + C);
      if (breakers.length) {
        var relRank = elemRank(relElem, monthBranch, tombOpened);
        if (relRank >= 5) {
          var floods = controls(relElem, eB) && !energetic(B);
          var swollen = C && (generates(eC, relElem) || eC === relElem);
          T('la tomba ' + A + ' è clashata ' + breakers.join(' e ') + ' → libera ' + relElem +
            ', abbondante nel mese ' + (monthBranch || '?') +
            (swollen ? ' e ingrossato da M3 ' + C : ''));
          if (floods) {
            confirmed = false;
            T(relElem + ' liberato si riversa su ' + describe(B) + ', che è untimely, e lo spegne' +
              ' → il trend ' + A + ' resta senza sostegno e con la tomba sfondata → distrutto');
          }
        }
      }
    }

    // ---- 刑 (Penalty Sha): "a spirit that hurts and brings disability" → does not follow ----
    // Skipped entirely when a clash-rescue (六合 of C onto A) already protects the trend —
    // the same bond that shields the trend from the clash also shields it from the penalty.
    var pens = [];
    if (clashOverride !== 'rescued') {
      // M1 is the trend: it is acted upon, it never acts. M2 strikes M1; M3 strikes M2, and
      // reaches M1 only when very timely and unobstructed. A 六合-bound M3 is disarmed.
      var acts = [];
      if (B && A) acts.push({ a: 'il giudice', ab: B, t: 'il trend', tb: A });
      if (C && B) acts.push({ a: 'il terzo', ab: C, t: 'il giudice', tb: B });
      if (C && A && cCanReachA) acts.push({ a: 'il terzo', ab: C, t: 'il trend', tb: A });
      // un ramo che non esiste non colpisce e non può essere colpito
      acts = acts.filter(function (x) { return !nonExistent(x.ab) && !nonExistent(x.tb); });
      for (var pi = 0; pi < acts.length; pi++) {
        var ac = acts[pi];
        if (penalizes(ac.ab, ac.tb)) {
          var tag = ac.a + ' ' + ac.ab + ' 刑 ' + ac.t + ' ' + ac.tb;
          if (pens.indexOf(tag) < 0) pens.push(tag);
        }
      }
      // 自刑 (self-penalty): the same self-penalising branch appearing twice, on an allowed act
      for (var si = 0; si < acts.length; si++) {
        var sa = acts[si];
        if (sa.ab === sa.tb && SELF_XING.indexOf(sa.ab) >= 0) {
          var stag = sa.a + '/' + sa.t + ' ' + sa.ab + ' 自刑 (self-penalty)';
          if (pens.indexOf(stag) < 0) pens.push(stag);
        }
      }
      if (pens.length) {
        // if M2 penalises M1, ONLY a 冲 (clash) or 六合 (combination) from M3 can cancel the damage
        var penM1M2 = penalizes(M1, M2) || penalizes(M2, M1);
        var otherPens = pens.filter(function (p) {
          return !(p.indexOf('M1') >= 0 && p.indexOf('M2') >= 0 && p.indexOf('M3') < 0);
        });
        var rescue = (chong(M2) === M3) ? '冲' : (bonded(M2, M3) ? '六合' : null);
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
    } else {
      T('刑: eventuali penalità fra i tre messaggi sono protette dal legame ' + C + ' 六合 ' + A + ' → ignorate');
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
             combo: combo, penalties: pens };
  }

  var API = { evaluateTrend: evaluateTrend, directionalCombo: directionalCombo, lifeStage: lifeStage, stageRank: stageRank, elemRank: elemRank,
              WX: WX, GEN: GEN, KE: KE, COMBINE: COMBINE, TOMB_SHA: TOMB_SHA, TOMB_OF_ELEM: TOMB_OF_ELEM,
              DIRECTIONAL: DIRECTIONAL, hasEnergy: hasEnergy, STAGE_CN: STAGE_CN };

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

  API.emaSeries = emaSeries; API.emaDirs = emaDirs; API.countChanges = countChanges; API.emaTrend = emaTrend;
  API.EMA_PERIOD = EMA_PERIOD; API.EMA_WINDOW = EMA_WINDOW; API.EMA_MAX_CHANGES = EMA_MAX_CHANGES;

  if (typeof window !== 'undefined') window.XKDGTrend = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})();
