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


  // REGOLA GIORNO CONTRO ORA (Edu, 24/10/2026) — solo carta ORARIA.
  // Palazzo dello stelo del giorno = trend; palazzo dello stelo dell'ora = la giornata. Si confrontano i palazzi:
  // forza = timeliness 旺4 相3 休2 囚1 死0 sul ramo del mese + sulla stagione (寅卯辰 legno, 巳午未 fuoco, 申酉戌 metallo, 亥子丑 acqua);
  // vuoti del 旬 dell'ORA: palazzo vuoto = forza 0; palazzo a due rami vuoto a meta' = vuoto solo se lo stelo del di pan ha la
  // polarita' del ramo vuoto. Controllo: vince chi controlla, 反侮 se il controllato e' piu' forte. Generazione: vince il generato.
  // Ponte del Commander: se il suo palazzo e' generato da chi controlla e genera il controllato, l'esito si ribalta.
  // Stesso palazzo, stesso elemento, forze pari: fermo. Vince il giorno -> SEGUE il trend; vince l'ora -> NON SEGUE.
  // Stelo 甲 -> stelo del 旬 (遁甲); stelo solo al centro -> palazzo della stella Grass (芮).
  var PEL = { 1:'W', 2:'E', 3:'L', 4:'L', 6:'M', 7:'M', 8:'E', 9:'F' };
  var GEN = { L:'F', F:'E', E:'M', M:'W', W:'L' }, CTL = { L:'E', E:'W', W:'F', F:'M', M:'L' };
  var BEL = { '子':'W','亥':'W','寅':'L','卯':'L','巳':'F','午':'F','申':'M','酉':'M','辰':'E','戌':'E','丑':'E','未':'E' };
  var SEAS = { '寅':'L','卯':'L','辰':'L','巳':'F','午':'F','未':'F','申':'M','酉':'M','戌':'M','亥':'W','子':'W','丑':'W' };
  var PBR = { 1:'子', 8:'丑寅', 3:'卯', 4:'辰巳', 9:'午', 2:'未申', 7:'酉', 6:'戌亥' };
  function stemOf(gz) { var i = idx60(gz); return gz[0] === '甲' ? '戊己庚辛壬癸'[Math.floor(i / 10)] : gz[0]; }
  function palOf(c, s) { var p; for (p = 1; p <= 9; p++) if (p !== 5 && c.palaces[p].tiH === s) return p;
    for (p = 1; p <= 9; p++) if (p !== 5 && c.palaces[p].star === 'Grass') return p; return null; }
  function tempo(pe, me) { return pe === me ? 4 : GEN[me] === pe ? 3 : GEN[pe] === me ? 2 : CTL[pe] === me ? 1 : 0; }
  function vuotiDi(gz) { var s = Math.floor(idx60(gz) / 10) * 10; return [BR[(s + 10) % 12], BR[(s + 11) % 12]]; }
  function vuoto(c, p, vu) { var d = PBR[p].split('').filter(function (b) { return vu.indexOf(b) >= 0; });
    if (!d.length) return false; if (d.length === PBR[p].length) return true;
    return ('甲丙戊庚壬'.indexOf(c.palaces[p].diH) >= 0) === ('子寅辰午申戌'.indexOf(d[0]) >= 0); }
  function giornoOra(c) {
    if (!c || c.tipo !== 'oraria') return null;
    var mb = c.mese[1], vu = vuotiDi(c.pilastro), a = palOf(c, stemOf(c.giorno)), b = palOf(c, stemOf(c.pilastro));
    var f = function (p) { return vuoto(c, p, vu) ? 0 : tempo(PEL[p], BEL[mb]) + tempo(PEL[p], SEAS[mb]); };
    var r = { palGiorno: a, palOra: b, forzaGiorno: a && f(a), forzaOra: b && f(b), segue: null, motivo: '' };
    if (!a || !b) { r.motivo = 'palazzo non trovato'; return r; }
    if (a === b) { r.motivo = 'stesso palazzo: fermo'; return r; }
    var x = PEL[a], y = PEL[b], sa = r.forzaGiorno, sb = r.forzaOra, w;
    if (x === y) { r.motivo = 'stesso elemento: fermo'; return r; }
    if (CTL[x] === y) { w = sa >= sb; r.motivo = 'il giorno controlla l\'ora' + (w ? '' : ' (反侮)'); }
    else if (CTL[y] === x) { w = !(sb >= sa); r.motivo = 'l\'ora controlla il giorno' + (w ? ' (反侮)' : ''); }
    else if (GEN[x] === y) { r.segue = false; r.motivo = 'il giorno genera l\'ora'; return r; }
    else { r.segue = true; r.motivo = 'l\'ora genera il giorno'; return r; }
    var ctl = CTL[x] === y ? a : b, sub = ctl === a ? b : a, k;
    for (k = 1; k <= 9; k++) if (k !== 5 && c.palaces[k].deity === 'Commander') break;
    if (k <= 9 && k !== a && k !== b && GEN[PEL[ctl]] === PEL[k] && GEN[PEL[k]] === PEL[sub]) { w = !w; r.motivo += ' · ponte del Commander: ribaltato'; }
    r.segue = w; return r;
  }

  var API = { giornoOra: giornoOra, oraria: oraria, giornaliera: giornaliera, testo: testo, hourGZ: hourGZ, juOraria: juOraria, juGiornaliera: juGiornaliera };
  W.XKDGQimen = API;
  if (typeof module !== 'undefined') module.exports = API;
})();
