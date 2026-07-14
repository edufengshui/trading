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
 *   月將 (Month General): a message equal to the 月將 is never void, always strong, and its
 *               action carries DOUBLE energy — its nourishment of a void M1 always suffices, and
 *               when it obstructs it cannot be neutralised by a normal M3.
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

  function generates(a, b) { return GEN[a] === b; }
  function controls(a, b) { return KE[a] === b; }
  function chong(b) { return BRANCHES[(BRANCHES.indexOf(b) + 6) % 12]; }
  function tombOfBranch(br) { return TOMB_OF_ELEM[WX[br]] || null; }
  function veryUntimely(elem, season) { if (!season) return false; return controls(elem, season) || controls(season, elem); }

  function evaluateTrend(M1, M2, M3, opts) {
    opts = opts || {};
    var dayStem = opts.dayStem, voids = opts.voidBranches || [], season = opts.seasonElement || null, mg = opts.monthGeneral || null;
    var e1 = WX[M1], e2 = WX[M2], e3 = WX[M3];
    var trace = []; function T(s) { trace.push(s); }
    function isMG(b) { return mg && b === mg; }
    function timely(elem) { if (!season) return true; return elem === season || generates(season, elem); } // 旺 or 相
    function strongMsg(b, elem) { return isMG(b) || timely(elem); }

    var effVoid1 = (voids.indexOf(M1) >= 0) && !isMG(M1);   // 月將 is never void
    var m2Void = (voids.indexOf(M2) >= 0) && !isMG(M2);
    var m3Void = (voids.indexOf(M3) >= 0) && !isMG(M3);
    var m2MG = isMG(M2);                                     // Month General in M2 → immovable, double energy

    var m2GenM1 = generates(e2, e1), m2SameM1 = (e2 === e1), m1GenM2 = generates(e1, e2);
    var m2CtrlM1 = controls(e2, e1), m1CtrlM2 = controls(e1, e2);
    var m2CombM1 = (COMBINE[M2] === M1);
    var m2IsTombM1 = (tombOfBranch(M1) === M2) && !m2Void;   // empty tomb doesn't bury
    var m3ChongM2 = (chong(M2) === M3), m3DrainM2 = generates(e2, e3), m3IsTombM2 = (tombOfBranch(M2) === M3) && !m3Void;
    var m3CtrlM2 = controls(e3, e2), m3GenM2 = generates(e3, e2), m3ChongM1 = (chong(M1) === M3);
    // a Month-General M2 cannot be neutralised or obstructed by a normal M3
    var m3NeutralizesM2 = (m3ChongM2 || m3DrainM2 || m3IsTombM2) && !m2MG;
    var m3Obstructs = (m3CtrlM2 || m3ChongM2 || m3DrainM2 || m3IsTombM2) && !m2MG;
    var m2Strong = strongMsg(M2, e2) || (m3GenM2 && strongMsg(M3, e3));

    if (isMG(M1)) T('初傳 M1 ' + M1 + ' è il 月將 (Month General) → mai vuoto, sempre forte (doppia energia)');
    if ((tombOfBranch(M1) === M2) && m2Void) T('M2 ' + M2 + ' sarebbe la tomba di M1 ma M2 è vuoto (空) → non seppellisce');

    var confirmed = null, kind = '';

    function leanOnM1(reason) {
      if (effVoid1) { confirmed = false; T(reason + ' → si appoggia a M1, ma M1 è vuoto (空) e non nutrito → non confermato'); }
      else if (veryUntimely(e1, season) && !isMG(M1)) { confirmed = false; T(reason + ' → si appoggia a M1, ma M1 senza energia (囚/死) → non confermato'); }
      else { confirmed = true; T(reason + ' → si appoggia a M1 → confermato'); }
    }

    if (dayStem && TOMB_SHA[dayStem] === M1) {
      kind = 'daystomb';
      if (m2CtrlM1 || m1GenM2) { confirmed = true; T('M1 ' + M1 + ' è la tomba del tronco-giorno ' + dayStem + ', ma M2 ' + M2 + ' la ' + (m2CtrlM1 ? 'controlla' : 'drena') + ' → tomba aperta → confermato'); }
      else { confirmed = false; T('M1 ' + M1 + ' è la tomba del tronco-giorno ' + dayStem + ' → M1 sepolto → non confermato'); }
    }
    else if (m2CombM1) { confirmed = false; kind = 'combine'; T('M2 ' + M2 + ' lega M1 ' + M1 + ' [六合]' + (m2MG ? ' (月將, doppia)' : '') + ' → non confermato'); }
    else if (m2IsTombM1) {
      kind = 'tombM1';
      if (effVoid1) { confirmed = false; T('M2 ' + M2 + ' è la tomba di M1 ' + M1 + ' e M1 è vuoto (空): una tomba non recupera un trend vuoto — nemmeno il 冲 di M3 lo salva → non confermato'); }
      else if (m3ChongM2 && !m2MG) { confirmed = true; T('M2 ' + M2 + ' è la tomba di M1 ' + M1 + ', ma M3 ' + M3 + ' clasha M2 → tomba aperta → M1 recuperato → confermato'); }
      else { confirmed = false; T('M2 ' + M2 + ' è la tomba di M1 ' + M1 + (m2MG ? ' (月將: non apribile)' : '') + ' → M1 sepolto → non confermato'); }
    }
    else if (m2GenM1) {
      if (effVoid1) {
        kind = 'void';
        var nourished = m2MG || (m2Strong && !m3Obstructs);
        if (nourished) { confirmed = true; T('M1 ' + M1 + ' vuoto ma M2 ' + M2 + ' lo genera' + (m2MG ? ' (月將, doppia energia → basta da solo)' : timely(e2) ? ' (forte/timely)' : ' (rinforzato da M3)') + (m2MG ? '' : ' e M3 non ostacola') + ' → trend vuoto rifornito → confermato'); }
        else { confirmed = false; T('M1 ' + M1 + ' vuoto: M2 lo genera ma ' + (!m2Strong ? 'M2 è debole' : 'M3 ostacola M2') + ' → nutrimento insufficiente → non confermato'); }
      } else { confirmed = true; kind = 'help'; T('M2 ' + M2 + ' genera M1 ' + M1 + ' [生]' + (m2MG ? ' (月將)' : '') + ' → confermato'); }
    }
    else if (m2SameM1) {
      if (effVoid1) { confirmed = false; kind = 'void'; T('M2 ' + M2 + ' 比和 con M1 vuoto ma non lo nutre (serve 生) → non confermato'); }
      else { confirmed = true; kind = 'help'; T('M2 ' + M2 + ' stesso elemento di M1 [比和] → confermato'); }
    }
    else if (m1GenM2) { confirmed = false; kind = 'harm'; T('M2 ' + M2 + ' drena M1 ' + M1 + (m2MG ? ' (月將, doppia)' : '') + ' → non confermato'); }
    else if (m2CtrlM1) { confirmed = false; kind = 'harm'; T('M2 ' + M2 + ' controlla M1 ' + M1 + ' [剋]' + (m2MG ? ' (月將, doppia)' : '') + ' → non confermato'); }
    else if (m1CtrlM2) {
      if (effVoid1) { confirmed = false; kind = 'void'; T('M1 ' + M1 + ' controlla M2 ma M1 è vuoto (空) → non confermato'); }
      else { confirmed = true; kind = 'help'; T('M1 ' + M1 + ' controlla M2 ' + M2 + ' [剋] → confermato'); }
    }
    else { confirmed = true; kind = 'none'; T('nessuna relazione forte M2→M1 → confermato di default'); }

    if (kind === 'harm' && m3NeutralizesM2) { leanOnM1('M3 ' + M3 + ' neutralizza M2 (' + (m3ChongM2 ? '冲' : m3DrainM2 ? 'drena' : 'tomba') + ')'); }
    else if (kind === 'help' && (m3NeutralizesM2 || (m3CtrlM2 && !m2MG))) { leanOnM1('M3 ' + M3 + ' ' + (m3CtrlM2 ? 'controlla' : 'neutralizza') + ' M2'); }
    else if (kind === 'help' && m3GenM2) { T('M3 ' + M3 + ' genera M2 → sostegno rinforzato → resta confermato'); }

    if (m3ChongM1 && !isMG(M1)) { confirmed = false; T('M3 ' + M3 + ' clasha M1 ' + M1 + ' [冲] → il trend è colpito → non confermato'); }
    else if (m3ChongM1 && isMG(M1)) { T('M3 ' + M3 + ' clasha M1 ma M1 è il 月將 (sempre forte) → il trend regge'); }

    return { confirmed: confirmed, trace: trace, M1: M1, M2: M2, M3: M3,
             elements: { M1: e1, M2: e2, M3: e3 }, seasonElement: season, m1Void: effVoid1, monthGeneral: mg };
  }

  var API = { evaluateTrend: evaluateTrend, WX: WX, GEN: GEN, KE: KE, COMBINE: COMBINE, TOMB_SHA: TOMB_SHA, TOMB_OF_ELEM: TOMB_OF_ELEM, veryUntimely: veryUntimely };
  if (typeof window !== 'undefined') window.XKDGTrend = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})();
