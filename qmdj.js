/* qmdj.js — Qi Men Dun Jia, carta ORARIA, rotante (转盘), chai bu (拆补). (Edu, 23/10/2026)
 * Solo costruzione della carta: nessuna lettura LONG/SHORT finche' Edu non sceglie i simboli.
 * Ora di Pechino esclusa: giornata e termine solare sulla mezzanotte di Londra (jieqi-gmt.js), come le altre carte.
 * Convenzioni scritte qui e da confermare con Edu:
 *   - palazzo 5 appoggiato al 2 (寄坤) per stella, porta e stelo del 5;
 *   - otto spiriti: 值符 螣蛇 太阴 六合 白虎 玄武 九地 九天, orari in yang dun, antiorari in yin dun;
 *   - Yuan dal 符头 (stelo 甲/己 del giorno nel suo gruppo di 5): 子午卯酉 上元, 寅申巳亥 中元, 辰戌丑未 下元.
 * Uso: XKDGQimen.build(dayPillar, hourPillar, termName)   oppure   XKDGQimen.fromUtc(utcMs, lonDeg, hourBranch?)
 */
(function () {
  'use strict';
  var STEMS = '甲乙丙丁戊己庚辛壬癸', BR = '子丑寅卯辰巳午未申酉戌亥';
  var JU = {   // [上, 中, 下]; yang dun da 冬至 a 芒种, yin dun da 夏至 a 大雪
    '冬至':[1,7,4],'小寒':[2,8,5],'大寒':[3,9,6],'立春':[8,5,2],'雨水':[9,6,3],'惊蛰':[1,7,4],
    '春分':[3,9,6],'清明':[4,1,7],'谷雨':[5,2,8],'立夏':[4,1,7],'小满':[5,2,8],'芒种':[6,3,9],
    '夏至':[9,3,6],'小暑':[8,2,5],'大暑':[7,1,4],'立秋':[2,5,8],'处暑':[1,4,7],'白露':[9,3,6],
    '秋分':[7,1,4],'寒露':[6,9,3],'霜降':[5,8,2],'立冬':[6,9,3],'小雪':[5,8,2],'大雪':[4,7,1]
  };
  var YANG = { '冬至':1,'小寒':1,'大寒':1,'立春':1,'雨水':1,'惊蛰':1,'春分':1,'清明':1,'谷雨':1,'立夏':1,'小满':1,'芒种':1 };
  var YI = '戊己庚辛壬癸丁丙乙';                       // tre rari e sei yi, in ordine di disposizione
  var XUN_YI = { '子':'戊', '戌':'己', '申':'庚', '午':'辛', '辰':'壬', '寅':'癸' };  // ramo del 旬首 甲X -> yi che lo nasconde
  var RING = [1, 8, 3, 4, 9, 2, 7, 6];                  // giro orario dei palazzi esterni
  var STAR = { 1:'天蓬', 8:'天任', 3:'天冲', 4:'天辅', 9:'天英', 2:'天芮', 7:'天柱', 6:'天心', 5:'天禽' };
  var DOOR = { 1:'休门', 8:'生门', 3:'伤门', 4:'杜门', 9:'景门', 2:'死门', 7:'惊门', 6:'开门' };
  var GOD = ['值符', '螣蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天'];
  var PAL_EL = { 1:'Acqua', 8:'Terra', 3:'Legno', 4:'Legno', 9:'Fuoco', 2:'Terra', 7:'Metallo', 6:'Metallo', 5:'Terra' };
  var PAL_GUA = { 1:'坎', 8:'艮', 3:'震', 4:'巽', 9:'离', 2:'坤', 7:'兑', 6:'乾', 5:'中' };

  function idx60(gz) { var s = STEMS.indexOf(gz[0]), b = BR.indexOf(gz[1]); for (var i = 0; i < 60; i++) if (i % 10 === s && i % 12 === b) return i; return -1; }
  function gz60(i) { i = ((i % 60) + 60) % 60; return STEMS[i % 10] + BR[i % 12]; }
  function ring(p) { return RING.indexOf(p === 5 ? 2 : p); }
  function out5(p) { return p === 5 ? 2 : p; }

  function yuan(dayGZ) {                                 // 符头 = ultimo giorno 甲 o 己 (gruppo di 5)
    var i = idx60(dayGZ), fu = gz60(i - (i % 5)), b = fu[1];
    return { fuTou: fu, yuan: '子午卯酉'.indexOf(b) >= 0 ? 0 : '寅申巳亥'.indexOf(b) >= 0 ? 1 : 2 };
  }

  function build(dayGZ, hourGZ, term) {
    if (!JU[term]) return { error: 'termine solare sconosciuto: ' + term };
    var yang = !!YANG[term], y = yuan(dayGZ), ju = JU[term][y.yuan];
    // piatto della terra
    var earth = {}; for (var k = 0; k < 9; k++) { var p = yang ? ((ju - 1 + k) % 9) + 1 : ((ju - 1 - k + 90) % 9) + 1; earth[p] = YI[k]; }
    var palOf = function (st) { for (var q = 1; q <= 9; q++) if (earth[q] === st) return q; return null; };
    // 旬首 dell'ora
    var hi = idx60(hourGZ), xunHead = gz60(hi - (hi % 10)), xunYi = XUN_YI[xunHead[1]], steps = hi % 10;
    var fuPal = palOf(xunYi);                            // palazzo del 旬首 sul piatto della terra
    var zhiShi = DOOR[out5(fuPal)];
    // stella di servizio va sopra lo stelo dell'ora (甲 -> il suo yi)
    var hStem = hourGZ[0] === '甲' ? xunYi : hourGZ[0], hPal = out5(palOf(hStem));
    var shiftS = (ring(hPal) - ring(out5(fuPal)) + 8) % 8;
    var heavenStar = {}, heavenStem = {}, heavenStem5 = null;
    RING.forEach(function (p0) { var p1 = RING[(ring(p0) + shiftS) % 8]; heavenStar[p1] = STAR[p0]; heavenStem[p1] = earth[p0]; if (p0 === 2) heavenStem5 = { pal: p1, stem: earth[5] }; });
    // porta di servizio: dal palazzo del 旬首 avanza di 'steps' (yang +1, yin -1), il 5 va al 2
    var dp = fuPal; for (var s = 0; s < steps; s++) dp = yang ? (dp % 9) + 1 : ((dp + 7) % 9) + 1;
    var doorPal = out5(dp), shiftD = (ring(doorPal) - ring(out5(fuPal)) + 8) % 8, doors = {};
    RING.forEach(function (p0) { doors[RING[(ring(p0) + shiftD) % 8]] = DOOR[p0]; });
    // otto spiriti: 值符 sopra la stella di servizio
    var gods = {}; GOD.forEach(function (g, j) { gods[RING[(ring(hPal) + (yang ? j : 8 - j) % 8 + 8) % 8]] = g; });
    // vuoto dell'ora e cavallo
    var kong = [BR[(BR.indexOf(xunHead[1]) + 10) % 12], BR[(BR.indexOf(xunHead[1]) + 11) % 12]];
    var MA = { '申':'寅','子':'寅','辰':'寅','寅':'申','午':'申','戌':'申','巳':'亥','酉':'亥','丑':'亥','亥':'巳','卯':'巳','未':'巳' };
    var palazzi = {};
    for (var q = 1; q <= 9; q++) palazzi[q] = { gua: PAL_GUA[q], elemento: PAL_EL[q], terra: earth[q],
      cielo: q === 5 ? null : heavenStem[q], cielo5: heavenStem5 && heavenStem5.pal === q ? heavenStem5.stem : null,
      stella: q === 5 ? null : heavenStar[q], porta: q === 5 ? null : doors[q], spirito: q === 5 ? null : gods[q] };
    return { dun: yang ? 'yang' : 'yin', ju: ju, termine: term, fuTou: y.fuTou, yuan: ['上元', '中元', '下元'][y.yuan],
      giorno: dayGZ, ora: hourGZ, xunShou: xunHead + xunYi, zhiFu: STAR[fuPal], zhiFuPal: hPal, zhiShi: zhiShi, zhiShiPal: doorPal,
      stemOraPal: hPal, kong: kong, ma: MA[hourGZ[1]], palazzi: palazzi };
  }

  var HOUR_STEM_START = { '甲':0, '己':0, '乙':2, '庚':2, '丙':4, '辛':4, '丁':6, '壬':6, '戊':8, '癸':8 };  // 五鼠遁
  function hourGZ(dayStem, hb) { return STEMS[(HOUR_STEM_START[dayStem] + BR.indexOf(hb)) % 10] + hb; }

  function fromUtc(utcMs, lonDeg, hourBranch) {
    var ST = typeof window !== 'undefined' ? window.XKDGSolarTime : require('./solar-time.js');
    var JQ = typeof window !== 'undefined' ? window.XKDGJieQiGMT : require('./jieqi-gmt.js');
    var p = ST.pillarsFromUtc(utcMs, lonDeg), t = p.meta.tst, cur = JQ.currentJieQi(t.y, t.mo, t.d);
    var hb = hourBranch || p.hour.charAt(1), c = build(p.day, hourGZ(p.day[0], hb), cur.name);
    c.mese = p.month; c.anno = p.year; return c;
  }

  // griglia 3x3 (4 9 2 / 3 5 7 / 8 1 6) per mostrarla
  function griglia(c) {
    var rows = [[4, 9, 2], [3, 5, 7], [8, 1, 6]];
    return rows.map(function (r) { return r.map(function (q) { var x = c.palazzi[q];
      return q === 5 ? '中5 terra ' + x.terra : x.gua + q + ' ' + x.spirito + ' ' + x.stella + (x.cielo5 ? '+禽' : '') + ' ' + x.porta + ' cielo ' + x.cielo + (x.cielo5 ? '/' + x.cielo5 : '') + ' terra ' + x.terra; }).join(' | '); }).join('\n');
  }

  var API = { build: build, fromUtc: fromUtc, hourGZ: hourGZ, griglia: griglia };
  if (typeof window !== 'undefined') window.XKDGQimen = API;
  if (typeof module !== 'undefined') module.exports = API;
})();
