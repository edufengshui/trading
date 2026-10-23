/* qmdj.js — Qi Men Dun Jia per il trading (Edu, 23/10/2026).
 * Le carte le costruisce il motore di XKDG (qmdj-water-scanner.js, copiato da eduXKDG senza modifiche,
 * getRotatingHourChart = carta rotante). Questo modulo decide solo QUALE carta, con le regole del trading:
 *   - giornata e termini solari sulla mezzanotte di Londra: un termine conta dal giorno D se il suo istante
 *     e' <= 00:00 GMT di D (stessa regola di jieqi-gmt.js). Ora di Pechino esclusa: il Jú si passa sempre
 *     col forceJuDun, il motore non lo calcola da se'.
 *   - CARTA ORARIA: ora = ramo del seme del cross (Edu: "usa il seme per stabilire l'ora"), stelo col 五鼠遁;
 *     Jú chai bu (拆补): termine in corso + Yuan dal 符头 del giorno (子午卯酉 上, 寅申巳亥 中, 辰戌丑未 下).
 *   - CARTA GIORNALIERA: metodo di XKDG sessione 32 (qmdj-daymonth.js dayChartJu), pilastro del giorno al
 *     posto dell'ora; i termini sono contati con la regola di Londra invece del giorno in tempo solare locale.
 * Uso: XKDGQimen.oraria(utcMs, seedBranch)  ·  XKDGQimen.giornaliera(utcMs)  ·  XKDGQimen.testo(chart)
 */
(function () {
  'use strict';
  var W = typeof window !== 'undefined' ? window : global;
  var STEMS = '甲乙丙丁戊己庚辛壬癸', BR = '子丑寅卯辰巳午未申酉戌亥';
  var JU = {   // chai bu [上, 中, 下]
    '冬至':[1,7,4],'小寒':[2,8,5],'大寒':[3,9,6],'立春':[8,5,2],'雨水':[9,6,3],'惊蛰':[1,7,4],
    '春分':[3,9,6],'清明':[4,1,7],'谷雨':[5,2,8],'立夏':[4,1,7],'小满':[5,2,8],'芒种':[6,3,9],
    '夏至':[9,3,6],'小暑':[8,2,5],'大暑':[7,1,4],'立秋':[2,5,8],'处暑':[1,4,7],'白露':[9,3,6],
    '秋分':[7,1,4],'寒露':[6,9,3],'霜降':[5,8,2],'立冬':[6,9,3],'小雪':[5,8,2],'大雪':[4,7,1]
  };
  var YANG_T = { '冬至':1,'小寒':1,'大寒':1,'立春':1,'雨水':1,'惊蛰':1,'春分':1,'清明':1,'谷雨':1,'立夏':1,'小满':1,'芒种':1 };
  var PINYIN_TERM = { DONG_ZHI:'冬至', XIAO_HAN:'小寒', DA_HAN:'大寒', LI_CHUN:'立春', YU_SHUI:'雨水', JING_ZHE:'惊蛰', DA_XUE:'大雪' };
  var HOUR_STEM_START = { '甲':0,'己':0,'乙':2,'庚':2,'丙':4,'辛':4,'丁':6,'壬':6,'戊':8,'癸':8 };   // 五鼠遁
  // carta giornaliera (XKDG sessione 32)
  var MAIN = { '冬至':[1,7,4], '立春':[8,5,2], '春分':[3,9,6], '立夏':[4,1,7], '夏至':[9,3,6], '立秋':[2,5,8], '秋分':[7,1,4], '立冬':[6,9,3] };
  var YANG_M = { '冬至':1, '立春':1, '春分':1, '立夏':1 };
  var ENTRY = { '惊蛰':'卯', '清明':'辰', '芒种':'午', '小暑':'未', '白露':'酉', '寒露':'戌', '大雪':'子', '小寒':'丑' };
  var BR_CYCLE = { '子':0, '卯':0, '午':0, '酉':0, '丑':2, '辰':2, '未':2, '戌':2 };

  function solar() { return W.Solar || (typeof require !== 'undefined' ? require('lunar-javascript').Solar : null); }
  function ST() { return W.XKDGSolarTime || require('./solar-time.js'); }
  function JQ() { return W.XKDGJieQiGMT || require('./jieqi-gmt.js'); }
  function engine() { if (!W.QMDJWaterScanner && typeof require !== 'undefined') { W.window = W.window || W; require('./qmdj-water-scanner.js'); } return W.QMDJWaterScanner; }
  function idx60(gz) { for (var i = 0; i < 60; i++) if (STEMS[i % 10] + BR[i % 12] === gz) return i; return -1; }
  function wrap(n) { return ((n - 1) % 9 + 9) % 9 + 1; }
  function dayNum(y, m, d) { return Math.round(Date.UTC(y, m - 1, d) / 864e5); }
  function dayGzN(n) { var d = new Date(n * 864e5); return solar().fromYmd(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()).getLunar().getDayInGanZhi(); }
  function hourGZ(dayStem, hb) { return STEMS[(HOUR_STEM_START[dayStem] + BR.indexOf(hb)) % 10] + hb; }

  // termini attorno all'anno: giorno da cui contano = primo giorno la cui mezzanotte GMT e' >= istante del termine
  function termini(year) {
    var out = [], seen = {}, S = solar();
    [year - 1, year, year + 1].forEach(function (y) {
      var t = S.fromYmd(y, 6, 1).getLunar().getJieQiTable();
      Object.keys(t).forEach(function (k) {
        var s = t[k], name = PINYIN_TERM[k] || k, key = name + s.toYmd(); if (seen[key]) return; seen[key] = 1;
        var ms = Date.UTC(s.getYear(), s.getMonth() - 1, s.getDay(), s.getHour(), s.getMinute(), s.getSecond()) - 8 * 3600e3;
        out.push({ name: name, day: Math.ceil(ms / 864e5), bj: s });
      });
    });
    return out.sort(function (a, b) { return a.day - b.day; });
  }

  function giornoLondra(utcMs) { var p = ST().pillarsFromUtc(utcMs, 0); return { p: p, t: p.meta.tst }; }

  function juOraria(dayGz, t) {
    var cur = JQ().currentJieQi(t.y, t.mo, t.d), i = idx60(dayGz), fu = STEMS[(i - i % 5) % 10] + BR[(i - i % 5) % 12];
    var y = '子午卯酉'.indexOf(fu[1]) >= 0 ? 0 : '寅申巳亥'.indexOf(fu[1]) >= 0 ? 1 : 2;
    return { dun: YANG_T[cur.name] ? 'yang' : 'yin', ju: JU[cur.name][y], termine: cur.name, fuTou: fu, yuan: ['上元', '中元', '下元'][y] };
  }

  function juGiornaliera(t) {                     // dayChartJu di XKDG con i termini contati sulla mezzanotte di Londra
    var T = dayNum(t.y, t.mo, t.d), list = termini(t.y), start = null, S = solar();
    list.forEach(function (x) { if (MAIN[x.name] && x.day <= T) start = x; });
    if (!start) return null;
    var b = start.bj, after = S.fromYmdHms(b.getYear(), b.getMonth(), b.getDay(), b.getHour(), b.getMinute(), b.getSecond());
    var mon = S.fromJulianDay(after.getJulianDay() + 1 / 24).getLunar().getMonthInGanZhiExact();
    var yang = !!YANG_M[start.name], cur = [0, 2, 1, 0, 2, 1][Math.floor(idx60(mon) / 10)], ju = MAIN[start.name][cur];
    var passi = [start.name + ' ' + ['上', '中', '下'][cur] + ' ' + ju], entries = {};
    list.forEach(function (x) { if (ENTRY[x.name]) entries[x.day] = x.name; });
    for (var n = start.day + 1; n <= T; n++) {
      if (idx60(dayGzN(n)) % 10 === 0) { ju = wrap(ju + (yang ? 1 : -1)); passi.push('旬 ' + dayGzN(n) + ' ' + ju); }
      if (entries[n]) { var nc = BR_CYCLE[ENTRY[entries[n]]], k = ((nc - cur) % 3 + 3) % 3; ju = wrap(ju + k * (yang ? 6 : -6)); cur = nc; passi.push(entries[n] + ' ' + ju); }
    }
    return { dun: yang ? 'yang' : 'yin', ju: ju, passi: passi };
  }

  function carta(t, gz, info) {
    var c = engine().getRotatingHourChart(t.y, t.mo, t.d, gz[0], gz[1], null, { ju: info.ju, dun: info.dun });
    if (c) { c.pilastro = gz; c.jiu = info; }
    return c;
  }
  function oraria(utcMs, seedBranch) {
    var g = giornoLondra(utcMs), info = juOraria(g.p.day, g.t), gz = hourGZ(g.p.day[0], seedBranch);
    var c = carta(g.t, gz, info); if (c) { c.tipo = 'oraria'; c.giorno = g.p.day; c.mese = g.p.month; c.anno = g.p.year; } return c;
  }
  function giornaliera(utcMs) {
    var g = giornoLondra(utcMs), info = juGiornaliera(g.t); if (!info) return null;
    var c = carta(g.t, g.p.day, info); if (c) { c.tipo = 'giornaliera'; c.giorno = g.p.day; c.mese = g.p.month; c.anno = g.p.year; } return c;
  }
  function testo(c) {
    var cell = function (p) { var d = c.palaces[p]; return p + ' ' + (d.deity || '') + ' ' + (d.star || '') + ' ' + (d.doorName || d.door || '') + ' ' + (d.tiH || '') + '/' + (d.diH || ''); };
    return [[4, 9, 2], [3, 5, 7], [8, 1, 6]].map(function (r) { return r.map(cell).join(' | '); }).join('\n');
  }

  var API = { oraria: oraria, giornaliera: giornaliera, testo: testo, hourGZ: hourGZ, juOraria: juOraria, juGiornaliera: juGiornaliera };
  W.XKDGQimen = API;
  if (typeof module !== 'undefined') module.exports = API;
})();
