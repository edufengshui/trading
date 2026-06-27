/* jieqi-gmt.js — 24 JieQi (节气) resolved against GMT midnight of the TST chart-day.
 *
 * House rule (confirmed with user):
 *   To build the chart we do NOT ask "which month does this instant belong to".
 *   We ask, for the TST chart-day, a fixed-threshold boolean:
 *
 *       a JieQi counts as ENTERED  ⇔  instant(JieQi) ≤ 00:00:00 GMT of the TST chart-day
 *
 *   The cut is the SAME wall-clock for every day on Earth: Greenwich midnight.
 *   The "chart day" is the TST calendar date (the day the DAY pillar belongs to),
 *   so the threshold is Date.UTC(tstY, tstMo-1, tstD, 0,0,0).
 *
 *   Boundary: "entered" uses ≤ (a term exactly at 00:00:00 GMT is already in).
 *   To switch to strict "<", change ENTERED_INCLUSIVE below.
 *
 * Term instants come from lunar-javascript's getJieQiTable(), which reports them
 * in BEIJING wall-clock. GMT instant = Beijing − 8h. That −8h is the only place
 * the Beijing basis of the library enters; everything downstream is pure GMT.
 *
 * Depends on lunar-javascript (window.Solar / window.Lunar), or require() in node.
 */
(function () {
  'use strict';

  var ENTERED_INCLUSIVE = true;   // ≤ midnight = entered. Set false for strict <.
  var BEIJING_OFFSET_MS = 8 * 3600 * 1000;

  function getSolar() {
    if (typeof window !== 'undefined' && (window.Solar || (window.Lunar && window.Lunar.Solar))) {
      return window.Solar || window.Lunar.Solar;
    }
    if (typeof require !== 'undefined') {
      try { return require('lunar-javascript').Solar; } catch (e) {}
    }
    return null;
  }

  // Canonical 24-term order starting at 立春, with the pinyin boundary-keys that
  // getJieQiTable() emits for adjacent years folded onto their Chinese name.
  var TERM_ORDER = [
    '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
    '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
    '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
    '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'
  ];
  var PINYIN = {
    'DONG_ZHI': '冬至', 'XIAO_HAN': '小寒', 'DA_HAN': '大寒', 'LI_CHUN': '立春',
    'YU_SHUI': '雨水', 'JING_ZHE': '惊蛰', 'DA_XUE': '大雪',
    // 'Jie' vs 'Qi' classification for callers that build the MONTH pillar:
    'CHUN_FEN': '春分', 'QING_MING': '清明'
  };
  var TERM_INDEX = (function () { var m = {}; TERM_ORDER.forEach(function (n, i) { m[n] = i; }); return m; });
  var IDX = TERM_INDEX();
  // The 12 "节" (Jie) that open the BaZi months (every other term from 立春).
  var JIE_SET = { '立春':1,'惊蛰':1,'清明':1,'立夏':1,'芒种':1,'小暑':1,'立秋':1,'白露':1,'寒露':1,'立冬':1,'大雪':1,'小寒':1 };

  function canonical(name) { return PINYIN[name] || name; }

  // Beijing-wall-clock Solar → absolute UTC ms.
  function solarToUtcMs(s) {
    return Date.UTC(s.getYear(), s.getMonth() - 1, s.getDay(),
                    s.getHour(), s.getMinute(), s.getSecond()) - BEIJING_OFFSET_MS;
  }

  // All term instants in a window around the chart day, as {name, utcMs}, de-duplicated
  // by (canonical name + instant) so the pinyin/Chinese duplicates collapse to one.
  function termInstants(tstY, tstMo, tstD) {
    var Solar = getSolar();
    if (!Solar) return null;
    var out = [], seen = {};
    // Pull tables from the chart day and its neighbours so the surrounding 大寒/立春
    // (which can sit in the previous/next civil year) are always present.
    [-15, 0, 15].forEach(function (deltaDays) {
      var base = new Date(Date.UTC(tstY, tstMo - 1, tstD) + deltaDays * 86400000);
      var s = Solar.fromYmd(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate());
      var table = s.getLunar().getJieQiTable();
      Object.keys(table).forEach(function (k) {
        var name = canonical(k);
        if (IDX[name] === undefined) return;
        var utcMs = solarToUtcMs(table[k]);
        var key = name + '@' + utcMs;
        if (seen[key]) return;
        seen[key] = 1;
        out.push({ name: name, utcMs: utcMs });
      });
    });
    out.sort(function (a, b) { return a.utcMs - b.utcMs; });
    return out;
  }

  function gmtMidnightMs(tstY, tstMo, tstD) {
    return Date.UTC(tstY, tstMo - 1, tstD, 0, 0, 0);
  }

  function entered(utcMs, cutMs) {
    return ENTERED_INCLUSIVE ? (utcMs <= cutMs) : (utcMs < cutMs);
  }

  function fmt(utcMs) {
    var d = new Date(utcMs);
    return {
      utcMs: utcMs,
      gmt: { y: d.getUTCFullYear(), mo: d.getUTCMonth() + 1, d: d.getUTCDate(),
             h: d.getUTCHours(), mi: d.getUTCMinutes(), s: d.getUTCSeconds() },
      beijing: (function () { var b = new Date(utcMs + BEIJING_OFFSET_MS);
        return { y: b.getUTCFullYear(), mo: b.getUTCMonth() + 1, d: b.getUTCDate(),
                 h: b.getUTCHours(), mi: b.getUTCMinutes(), s: b.getUTCSeconds() }; })()
    };
  }

  // Is a SPECIFIC named term entered at GMT-midnight of the TST chart-day?
  // Uses the instance of that term nearest the chart day.
  function jieQiEntered(name, tstY, tstMo, tstD) {
    name = canonical(name);
    var list = termInstants(tstY, tstMo, tstD);
    if (!list) return null;
    var cut = gmtMidnightMs(tstY, tstMo, tstD);
    var best = null;
    list.forEach(function (t) {
      if (t.name !== name) return;
      if (best === null || Math.abs(t.utcMs - cut) < Math.abs(best.utcMs - cut)) best = t;
    });
    if (!best) return null;
    return { name: name, entered: entered(best.utcMs, cut), instant: fmt(best.utcMs) };
  }

  // The CURRENT term as of GMT-midnight of the TST chart-day = the latest term whose
  // GMT instant is ≤ the cut. Also returns the next (upcoming) term for convenience.
  function currentJieQi(tstY, tstMo, tstD) {
    var list = termInstants(tstY, tstMo, tstD);
    if (!list) return null;
    var cut = gmtMidnightMs(tstY, tstMo, tstD);
    var cur = null, next = null;
    for (var i = 0; i < list.length; i++) {
      if (entered(list[i].utcMs, cut)) cur = list[i];
      else { next = list[i]; break; }
    }
    if (!cur) return null;
    return {
      name: cur.name,
      index: IDX[cur.name],          // 0 = 立春 … 23 = 大寒
      isJie: !!JIE_SET[cur.name],    // true = 节 (opens a BaZi month), false = 气
      instant: fmt(cur.utcMs),
      next: next ? { name: next.name, instant: fmt(next.utcMs) } : null,
      cutGmtMs: cut
    };
  }

  // Full 24-row table for the chart day: each term + entered? (nearest instance).
  function jieQiTableForDay(tstY, tstMo, tstD) {
    var cut = gmtMidnightMs(tstY, tstMo, tstD);
    return TERM_ORDER.map(function (name) {
      var r = jieQiEntered(name, tstY, tstMo, tstD);
      return { name: name, index: IDX[name], entered: r ? r.entered : null,
               instant: r ? r.instant : null, cutGmtMs: cut };
    });
  }

  var API = {
    ENTERED_INCLUSIVE: ENTERED_INCLUSIVE,
    TERM_ORDER: TERM_ORDER,
    currentJieQi: currentJieQi,
    jieQiEntered: jieQiEntered,
    jieQiTableForDay: jieQiTableForDay,
    _termInstants: termInstants
  };
  if (typeof window !== 'undefined') window.XKDGJieQiGMT = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})();
