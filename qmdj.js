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
  // Ora 癸 = ultima ora della decade (Edu 25/10/2026, EURUSD 05/10): si guarda il PROSSIMO Commander (il 旬 seguente).
  // Il motore ricava 旬 e passo del 值使 dal pilastro: gli si passa il 癸 della decade dopo (stesso stelo, +10 nel ciclo).
  function oraria(utcMs, seedBranch) {
    var g = giornoLondra(utcMs), info = juOraria(g.p.day, g.t), gz = hourGZ(g.p.day[0], seedBranch);
    var gzM = (W.QMDJ_PROSSIMO === true && gz[0] === '癸') ? gz[0] + BR[(idx60(gz) + 10) % 12] : gz;   // SPENTO di default: QMDJ_PROSSIMO=true per accenderlo (peggiora il 2024-26)
    var c = carta(g.t, gzM, info); if (c) { c.pilastro = gz; if (gzM !== gz) c.prossimoComandante = gzM; } if (c) { c.tipo = 'oraria'; c.giorno = g.p.day; c.mese = g.p.month; c.anno = g.p.year; } return c;
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
  // Ponte del Commander, dello Zhi Shi o di Wu nel cielo (solo se il palazzo NON e' vuoto): se il suo palazzo e' generato da chi controlla e genera il controllato, il controllo diventa un passamano e vince il controllato.
  // Stesso palazzo, stesso elemento, forze pari: fermo. Vince il giorno -> SEGUE il trend; vince l'ora -> NON SEGUE.
  // Stelo 甲 -> stelo del 旬 (遁甲); stelo solo al centro -> palazzo della stella Rice (天芮): Fowl segue sempre Rice (Edu).
  var PEL = { 1:'W', 2:'E', 3:'L', 4:'L', 6:'M', 7:'M', 8:'E', 9:'F' };
  var GEN = { L:'F', F:'E', E:'M', M:'W', W:'L' }, CTL = { L:'E', E:'W', W:'F', F:'M', M:'L' };
  var BEL = { '子':'W','亥':'W','寅':'L','卯':'L','巳':'F','午':'F','申':'M','酉':'M','辰':'E','戌':'E','丑':'E','未':'E' };
  var SEAS = { '寅':'L','卯':'L','辰':'L','巳':'F','午':'F','未':'F','申':'M','酉':'M','戌':'M','亥':'W','子':'W','丑':'W' };
  var PBR = { 1:'子', 8:'丑寅', 3:'卯', 4:'辰巳', 9:'午', 2:'未申', 7:'酉', 6:'戌亥' };
  function stemOf(gz) { var i = idx60(gz); return gz[0] === '甲' ? '戊己庚辛壬癸'[Math.floor(i / 10)] : gz[0]; }
  function palOf(c, s) { var p; for (p = 1; p <= 9; p++) if (p !== 5 && c.palaces[p].tiH === s) return p;
    for (p = 1; p <= 9; p++) if (p !== 5 && c.palaces[p].star === 'Rice') return p; return null; }
  function tempo(pe, me) { return pe === me ? 4 : GEN[me] === pe ? 3 : GEN[pe] === me ? 2 : CTL[pe] === me ? 1 : 0; }
  // Quali vuoti usare (Edu 28/10/2026: "cosa succede se usiamo i vuoti del giorno?"). QMDJ_VUOTI: 'ora' (default) | 'giorno' | 'entrambi'
  function vuotiCarta(c) { var m = W.QMDJ_VUOTI || 'ora'; if (m === 'giorno') return vuotiDi(c.giorno);
    if (m === 'entrambi') return vuotiDi(c.pilastro).concat(vuotiDi(c.giorno)); return vuotiDi(c.pilastro); }
  function vuotiDi(gz) { var s = Math.floor(idx60(gz) / 10) * 10; return [BR[(s + 10) % 12], BR[(s + 11) % 12]]; }
  // Tomba nel mese (Edu 25/10/2026, EURUSD 12/10): il palazzo il cui elemento ha la tomba nel ramo del mese vale come vuoto.
  // Tombe: Legno 未, Fuoco 戌, Metallo 丑, Acqua 辰; la Terra non ha tomba.
  var TOMBA = { L:'未', F:'戌', M:'丑', W:'辰' };   // la Terra non ha tomba (Edu 25/10)
  var CLV = { '甲':'庚','庚':'甲','乙':'辛','辛':'乙','丙':'壬','壬':'丙','丁':'癸','癸':'丁' }, YIV = { '戊':'子','己':'戌','庚':'申','辛':'午','壬':'辰','癸':'寅' },
      CHV = { '子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳' };
  function clashInterno(c, p) { var t = c.palaces[p].tiH, e = c.palaces[p].diH; if (W.QMDJ_GENG_BING_CLASH && ((t === '庚' && e === '丙') || (t === '丙' && e === '庚'))) return true; return CLV[t] === e || !!(YIV[t] && YIV[e] && CHV[YIV[t]] === YIV[e]); }
  // Trigono in tomba (Edu 27/10/2026, AUDUSD 14/10: "Ji, Gui e Wu dentro View sono un trigono di fuoco in tomba nel mese Xu"): i rami portati
  // dagli steli del palazzo (六仪: 戊子 己戌 庚申 辛午 壬辰 癸寅; porte e stelle i rami del loro palazzo d'origine) formano un 三合 completo il cui
  // elemento ha la tomba nel ramo del mese -> il palazzo vale come vuoto. QMDJ_TRIGONO: 'tutti' | 'zfty' | 'dshs' | 'off' (default);
  // rami: 六仪 degli steli + porta e stella (palazzo d'origine); QMDJ_TRIGONO_PILASTRI=true: anche i rami dei pilastri.
  var YIR = { '戊':'子','己':'戌','庚':'申','辛':'午','壬':'辰','癸':'寅' };
  var SANHE = [['申子辰','辰'], ['亥卯未','未'], ['寅午戌','戌'], ['巳酉丑','丑']];
  var SANHUI = [['亥子丑','辰'], ['寅卯辰','未'], ['巳午未','戌'], ['申酉戌','丑']];   // trigoni direzionali: Acqua, Legno, Fuoco, Metallo
  var DOORHOME = { Rest:1, Birth:8, Injury:3, Delusion:4, View:9, Death:2, Shocking:7, Open:6 };
  var STARHOME = { Grass:1, Rice:2, Aggressor:3, Assistant:4, Heart:6, Pillar:7, Official:8, Hero:9 };
  // Trigono vivo (Edu 28/10/2026, USDCAD 14/08: "Qian porta un trigono d'Acqua completo 申子辰, il mese 申 e' la nascita dell'Acqua:
  // trigono vivo, non in tomba... e i rami dei tre attori non sono vuoti"). Rami come nel trigono in tomba (六仪 + porta + stella).
  // modo 'vivo' = elemento non in tomba nel mese; 'nascita' = il mese e' la nascita (长生) o il ramo forte del trigono.
  function rami3(c, p) { var d = c.palaces[p], br = {}, st = [d.tiH, d.diH]; if (d.ti2H) st.push(d.ti2H);
    st.forEach(function (x) { if (YIR[x]) br[YIR[x]] = 1; });
    var dn = d.doorName || d.door, hp = DOORHOME[dn], sp = STARHOME[d.star];
    if (hp) PBR[hp].split('').forEach(function (b) { br[b] = 1; }); if (sp) PBR[sp].split('').forEach(function (b) { br[b] = 1; });
    return br; }
  function trigonoVivo(c, p, modo) { var br = rami3(c, p), vu = vuotiCarta(c), L = SANHE.concat(SANHUI);
    for (var i = 0; i < L.length; i++) { var t = L[i][0];
      if (!(br[t[0]] && br[t[1]] && br[t[2]])) continue;
      if (vu.indexOf(t[0]) >= 0 || vu.indexOf(t[1]) >= 0 || vu.indexOf(t[2]) >= 0) continue;   // gli attori non devono essere vuoti
      if (L[i][1] === c.mese[1]) continue;   // in tomba
      if (modo === 'nascita' && t.indexOf(c.mese[1]) < 0) continue;   // il mese e' uno dei tre rami (nascita / apice / tomba esclusa sopra)
      return true; }
    return false; }
  function trigonoInTomba(c, p) {
    var d = c.palaces[p], st = [d.tiH, d.diH]; if (d.ti2H) st.push(d.ti2H);
    var br = {}, pil = [c.pilastro, c.giorno, c.mese, c.anno];
    st.forEach(function (x) { if (YIR[x]) br[YIR[x]] = 1;
      if (W.QMDJ_TRIGONO_PILASTRI === true) pil.forEach(function (g) { if (g && g[0] === x) br[g[1]] = 1; }); });
    // Edu 27/10/2026: "nel qimen anche le porte e le stelle contengono i rami" (quelli del loro palazzo d'origine): View/Hero 午 ecc.
    if (W.QMDJ_TRIGONO_PS !== false) {
      var dn = d.doorName || d.door, hp = DOORHOME[dn], sp = STARHOME[d.star];
      if (hp) PBR[hp].split('').forEach(function (b) { br[b] = 1; });
      if (sp) PBR[sp].split('').forEach(function (b) { br[b] = 1; });
    }
    if (W.QMDJ_TRIGONO_PAL) PBR[p].split('').forEach(function (b) { br[b] = 1; });   // prova: anche i rami del palazzo
    var mn = W.QMDJ_TRIGONO_MIN || 3;   // prova: 2 = basta un mezzo trigono
    var LISTA = W.QMDJ_TRIGONO_DIR === false ? SANHE : SANHE.concat(SANHUI);   // Edu 27/10: anche i trigoni direzionali (三会)
    for (var i = 0; i < LISTA.length; i++) { var t = LISTA[i][0], n = (br[t[0]] ? 1 : 0) + (br[t[1]] ? 1 : 0) + (br[t[2]] ? 1 : 0);
      if (n >= mn && LISTA[i][1] === c.mese[1]) return true; }
    return false;
  }
  function vuoto(c, p, vu) { if (TOMBA[PEL[p]] === c.mese[1]) return true;
    var tgm = W.QMDJ_TRIGONO || 'off'; if ((tgm === 'tutti' || tgm === c._sis) && trigonoInTomba(c, p)) return true;
    if (PBR[p].indexOf(c.mese[1]) >= 0 || (W.QMDJ_GIORNO_RIEMPIE !== false && PBR[p].indexOf(c.giorno[1]) >= 0)) return false;   // QMDJ_GIORNO_RIEMPIE=false: solo il mese riempie (prova 28/10)   // Edu 24/10: il ramo del mese o del giorno riempie il vuoto
    // Edu 25/10 e 27/10/2026: "un palazzo con un clash interno non e' mai vuoto". QMDJ_CLASH_PIENO: 'tutti' | 'zfty' | 'dshs' | 'off' (default)
    // 旺相不空 (prova 28/10, USDCAD 14/08): un palazzo molto in stagione (mese+stagione >= QMDJ_TIMELY_PIENO) non e' vuoto.
    if (W.QMDJ_TIMELY_PIENO && tempo(PEL[p], BEL[c.mese[1]]) + tempo(PEL[p], SEAS[c.mese[1]]) >= W.QMDJ_TIMELY_PIENO) return false;
    var cpm = W.QMDJ_CLASH_PIENO || 'off';
    if ((cpm === 'tutti' || cpm === c._sis) && clashInterno(c, p)) return false;
    var d = PBR[p].split('').filter(function (b) { return vu.indexOf(b) >= 0; });
    if (!d.length) return false; if (d.length === PBR[p].length) return true;
    return ('甲丙戊庚壬'.indexOf(c.palaces[p].diH) >= 0) === ('子寅辰午申戌'.indexOf(d[0]) >= 0); }
  function giornoOraBase(c) {
    if (!c || c.tipo !== 'oraria') return null;
    // Ora 癸 = ultima della decade (Edu 25/10/2026, EURUSD 05/10): stessa carta, ma il Commander si sposta sul palazzo dove sta nel cielo
    // lo stelo della decade seguente (癸卯: 甲辰壬 -> il palazzo del 壬). ACCESO (Edu 25/10): QMDJ_CMD_SPOSTA=false per spegnerlo.
    var trovaC = function () {
      if (W.QMDJ_CMD_SPOSTA !== false && c.pilastro[0] === '癸' && !(c._sis === 'zfty' && W.QMDJ_ZFTY_SPOSTA !== true)) {   // nello ZFTY il Commander non si sposta
        var ns = '戊己庚辛壬癸'[(Math.floor(idx60(c.pilastro) / 10) + 1) % 6];
        var np = palOf(c, ns); if (!np) return null;
        // Edu 25/10/2026 (USDJPY 31/07/2024): se il nuovo Commander trova un clash nel palazzo (steli 甲庚 乙辛 丙壬 丁癸 o rami dei 六仪)
        // ne esce limitato e non agisce.
        var CLS = { '甲':'庚','庚':'甲','乙':'辛','辛':'乙','丙':'壬','壬':'丙','丁':'癸','癸':'丁' }, YI = { '戊':'子','己':'戌','庚':'申','辛':'午','壬':'辰','癸':'寅' },
            CHB = { '子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳' };
        var urta = function (t) { return t && t !== ns && (CLS[ns] === t || (YI[ns] && YI[t] && CHB[YI[ns]] === YI[t])); };
        if (W.QMDJ_CMD_CLASH !== false && (urta(c.palaces[np].tiH) || urta(c.palaces[np].diH))) return null;
        return np; }
      for (var k = 1; k <= 9; k++) if (k !== 5 && c.palaces[k].deity === 'Commander') {
        // Edu 25/10/2026: il Commander sopra o sotto 庚 e' pessimo -> non agisce (QMDJ_CMD_GENG = 'ovunque' | 'inibita' | 'off')
        if ((W.QMDJ_CMD_GENG || 'inibita') === 'ovunque' && (c.palaces[k].tiH === '庚' || c.palaces[k].diH === '庚')) return null;
        return k; } return null; };
    // vuoti del 旬 dell'ora (default); QMDJ_VUOTI_ZFTY='giorno' usa quelli del giorno nello ZFTY, QMDJ_VUOTI='giorno' ovunque (prova 25/10)
    var vgi = W.QMDJ_VUOTI === 'giorno' || (c._sis === 'zfty' && W.QMDJ_VUOTI_ZFTY === 'giorno');
    var mb = c.mese[1], vu = vgi ? vuotiDi(c.giorno) : vuotiCarta(c), a = palOf(c, stemOf(c.giorno)), b = palOf(c, stemOf(c.pilastro));
    // Sistema ZFTY (Edu 25/10/2026): trend = palazzo dello Zhi Fu; controparte = Tian Yi, la stella originaria del palazzo dove sta lo Zhi Fu
    // (es. ZF su Qian -> Heart; il TY e' il palazzo dove ora sta Heart). Stesse regole del sistema DsHs.
    if (c._sis === 'zfty') {
      var HOME = { 1:'Grass', 2:'Rice', 3:'Aggressor', 4:'Assistant', 6:'Heart', 7:'Pillar', 8:'Official', 9:'Hero' };
      a = null; b = null; for (var z = 1; z <= 9; z++) if (z !== 5 && c.palaces[z].zhiFu) a = z;
      if (a) for (z = 1; z <= 9; z++) if (z !== 5 && c.palaces[z].star === HOME[a]) b = z;
    }
    if (c._sis === 'zfview') {   // prova: ZF contro il palazzo della porta View
      a = null; b = null; for (var z2 = 1; z2 <= 9; z2++) if (z2 !== 5) { if (c.palaces[z2].zhiFu) a = z2; if ((c.palaces[z2].doorName || c.palaces[z2].door) === 'View') b = z2; }
    }
    // Il Commander rafforza il suo palazzo (Edu 25/10/2026): QMDJ_CMD_FORZA = punti in piu' (0 = spento)
    var cmF = c.pilastro[0] === '癸' ? +(W.QMDJ_CMD_FORZA || 0) : 0, cmP = cmF ? trovaC() : null;   // solo nell'ora 癸 (Edu 25/10)
    // Edu 26/10/2026: "se il palazzo e' forte bilancia lo stelo, si devono considerare tutti e due" -> forza = palazzo + peso dello stadio di vita
    // dello stelo del cielo nel mese. QMDJ_STADI_PESO = { stadio: punti } (es. {8:-1,9:-2,10:-3}); vuoto = nessun peso.
    var SHp = { '甲':'亥','丙':'寅','戊':'寅','庚':'巳','壬':'申','乙':'午','丁':'酉','己':'酉','辛':'子','癸':'卯' };
    var stadioP = function (st) { if (!SHp[st]) return 0; var a0 = BR.indexOf(SHp[st]), b0 = BR.indexOf(mb), yg = '甲丙戊庚壬'.indexOf(st) >= 0;
      return ((yg ? b0 - a0 : a0 - b0) % 12 + 12) % 12 + 1; };
    var PESO = W.QMDJ_STADI_PESO || null;
    var PRp = { 1:['子'], 8:['丑','寅'], 3:['卯'], 4:['辰','巳'], 9:['午'], 2:['未','申'], 7:['酉'], 6:['戌','亥'] };
    var stadioPB = function (st, b) { if (!SHp[st]) return 0; var a0 = BR.indexOf(SHp[st]), b0 = BR.indexOf(b), yg = '甲丙戊庚壬'.indexOf(st) >= 0;
      return ((yg ? b0 - a0 : a0 - b0) % 12 + 12) % 12 + 1; };
    var pesoP = function (p) { var st = c.palaces[p].tiH; if ((W.QMDJ_STADI_POS || 'luoshu') === 'mese') return PESO[stadioP(st)] || 0;
      return Math.min.apply(null, PRp[p].map(function (b) { return PESO[stadioPB(st, b)] || 0; })); };
    var f = function (p) { if (vuoto(c, p, vu)) return 0; var v = tempo(PEL[p], BEL[mb]) + tempo(PEL[p], SEAS[mb]) + (p === cmP ? cmF : 0);
      if (PESO) { var pp = pesoP(p); v = Math.max(0, v + pp); } return v; };
    var r = { palGiorno: a, palOra: b, forzaGiorno: a && f(a), forzaOra: b && f(b), segue: null, motivo: '' };
    r.palCmd = trovaC();
    if (!a || !b) { r.motivo = 'palazzo non trovato'; return r; }
    if (a === b) { r.motivo = 'stesso palazzo: fermo'; return r; }
    var x = PEL[a], y = PEL[b], sa = r.forzaGiorno, sb = r.forzaOra, w;
    if (x === y) { r.motivo = 'stesso elemento: fermo'; return r; }
    // Regola del Dun (Edu 25/10/2026): Kan Gen Zhen Xun (1 8 3 4) e Li Kun Dui Qian (9 2 7 6) sono le due sezioni; DS e HS nella stessa
    // sezione -> chi controlla vince sempre (niente controllo rovesciato). Opzione QMDJ_DUN=true.
    var SEZ = { 1:0, 8:0, 3:0, 4:0, 9:1, 2:1, 7:1, 6:1 }, dun = W.QMDJ_DUN === true && SEZ[a] === SEZ[b];
    var cmA = W.QMDJ_CMD_AIUTO === true ? trovaC() : null;   // opzione: il Commander nel palazzo che controlla impedisce il controllo rovesciato
    // Edu 26/10/2026 (USDCHF 13/10): il TY con Birth controlla lo ZF -> il controllo tiene (niente controllo rovesciato).
    // QMDJ_BIRTH_CTL: 'zfty' (default, Edu 26/10 19:14) | 'tutti' | 'off'; QMDJ_BIRTH_CTL_WU (default on): anche lo stelo 戊 nel cielo.
    var bcm = W.QMDJ_BIRTH_CTL || 'zfty', bOk = bcm === 'tutti' || (bcm === 'zfty' && c._sis === 'zfty');
    var econ = function (p) { if (!bOk) return false; var d = c.palaces[p]; return (d.doorName || d.door) === 'Birth' || (W.QMDJ_BIRTH_CTL_WU !== false && d.tiH === '戊'); };
    if (CTL[x] === y) { w = sa >= sb || (cmA === a && !(W.QMDJ_CMD_AIUTO_PIENO && sa === 0)) || dun || econ(a); r.motivo = 'il giorno controlla l\'ora' + (w ? (sa >= sb ? '' : (dun ? ' (stesso Dun)' : (econ(a) ? ' (con Birth)' : ' (col Commander)'))) : ' (反侮)'); }
    else if (CTL[y] === x) { w = !(sb >= sa || (cmA === b && !(W.QMDJ_CMD_AIUTO_PIENO && sb === 0)) || dun || econ(b)); r.motivo = 'l\'ora controlla il giorno' + (w ? ' (反侮)' : (sb >= sa ? '' : (dun ? ' (stesso Dun)' : (econ(b) ? ' (con Birth)' : ' (col Commander)')))); }
    else if (GEN[x] === y) { w = false; r.motivo = 'il giorno genera l\'ora';     // Edu 24/10: un palazzo vuoto non puo' essere generato
      if (vuoto(c, b, vu)) { w = true; r.motivo += ' (ora vuota: non generata)'; } return finale(w); }
    else { w = true; r.motivo = 'l\'ora genera il giorno';
      if (vuoto(c, a, vu)) { w = false; r.motivo += ' (giorno vuoto: non generato)'; } return finale(w); }
    var ctl = CTL[x] === y ? a : b, sub = ctl === a ? b : a, ponti = [];
    // Edu 25/10/2026 (AUDUSD 07/10): un palazzo ponte con clash interno non passa il qi. QMDJ_PONTE_CLASH=false per spegnerlo.
    var CLp = { '甲':'庚','庚':'甲','乙':'辛','辛':'乙','丙':'壬','壬':'丙','丁':'癸','癸':'丁' }, YIp = { '戊':'子','己':'戌','庚':'申','辛':'午','壬':'辰','癸':'寅' },
        CHp = { '子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳' };
    var clashP = function (k) { var t = c.palaces[k].tiH, e = c.palaces[k].diH; return CLp[t] === e || (YIp[t] && YIp[e] && CHp[YIp[t]] === YIp[e]); };
    var pontePieno = function (k) { return k && k !== a && k !== b && GEN[PEL[ctl]] === PEL[k] && GEN[PEL[k]] === PEL[sub]; };   // anche vuoto
    // Edu 27/10/2026 (EURJPY 12/08/2020): "Birth controlla View" -> un ponte controllato dal palazzo di Birth non passa il qi.
    // QMDJ_PONTE_BIRTH: 'zfty' | 'tutti' | 'off' (default); QMDJ_PONTE_BIRTH_PIENO: Birth deve stare in un palazzo non vuoto.
    var pbm = W.QMDJ_PONTE_BIRTH || 'off', pbOk = pbm === 'tutti' || (pbm === 'zfty' && c._sis === 'zfty'), pBirth = null;
    if (pbOk) for (var qb = 1; qb <= 9; qb++) if (qb !== 5 && (c.palaces[qb].doorName || c.palaces[qb].door) === 'Birth') pBirth = qb;
    if (pBirth && W.QMDJ_PONTE_BIRTH_PIENO && vuoto(c, pBirth, vu)) pBirth = null;
    var frenato = function (k) { return pBirth && pBirth !== k && CTL[PEL[pBirth]] === PEL[k]; };
    var ponte = function (k) { if (frenato(k)) return false; return k && k !== a && k !== b && !vuoto(c, k, vu) && !(W.QMDJ_PONTE_CLASH === true && clashP(k)) && GEN[PEL[ctl]] === PEL[k] && GEN[PEL[k]] === PEL[sub]; };
    var trova = function (f) { for (var k = 1; k <= 9; k++) if (k !== 5 && f(c.palaces[k])) return k; return null; };
    if (ponte(trovaC())) ponti.push('Commander');
    if (ponte(trova(function (d) { return d.zhiShi; }))) ponti.push('Zhi Shi');   // Edu 24/10/2026, EURJPY 22/10
    for (var q = 1; q <= 9; q++) if (q !== 5 && c.palaces[q].tiH === '戊' && ponte(q)) { ponti.push('Wu'); break; }
    // Nello ZFTY anche la porta View fa da ponte (Edu 25/10/2026, EURJPY 07/10). QMDJ_VIEW_PONTE: 'zfty' (default) | 'tutti' | 'off'
    var vp = W.QMDJ_VIEW_PONTE || 'zfty';
    if (vp === 'tutti' || (vp === 'zfty' && c._sis === 'zfty'))
      for (var q2 = 1; q2 <= 9; q2++) if (q2 !== 5 && (c.palaces[q2].doorName || c.palaces[q2].door) === 'View' && (ponte(q2) || (W.QMDJ_VIEW_PONTE_VUOTO && pontePieno(q2)))) { ponti.push('View'); break; }   // Edu 25/10: Wu (indicatore economico) fa da ponte
    // Edu 27/10/2026 (USDJPY 28/03/2022): anche lo stelo del mese nel cielo fa da ponte. QMDJ_MESE_PONTE: 'zfty' | 'tutti' | 'off' (default)
    var mp = W.QMDJ_MESE_PONTE || 'off';
    if (mp === 'tutti' || (mp === 'zfty' && c._sis === 'zfty'))
      for (var q6 = 1; q6 <= 9; q6++) if (q6 !== 5 && c.palaces[q6].tiH === c.mese[0] && ponte(q6)) { ponti.push('stelo del mese'); break; }
    // Edu 30/10/2026 (EURJPY 29/09): anche lo stelo del giorno nel cielo fa da ponte (丙 su Kun fra il TY in Li e lo ZF in Dui).
    // "Il ponte del DS vale sempre". QMDJ_DS_PONTE: 'tutti' | 'zfty' | 'off' (default; nel DsHs il DS e' un attore, quindi agisce nello ZFTY)
    var dsp = W.QMDJ_DS_PONTE || 'off';
    if (dsp === 'tutti' || (dsp === 'zfty' && c._sis === 'zfty'))
      for (var q7 = 1; q7 <= 9; q7++) if (q7 !== 5 && c.palaces[q7].tiH === c.giorno[0] && ponte(q7)) { ponti.push('stelo del giorno'); break; }
    // Edu 26/10/2026 (USDJPY 11/07/2024): anche la porta Birth fa da ponte. QMDJ_BIRTH_PONTE: 'zfty' | 'tutti' | 'off' (default)
    var bp = W.QMDJ_BIRTH_PONTE || 'zfty';   // acceso nello ZFTY (Edu 26/10 18:42)
    if (bp === 'tutti' || (bp === 'zfty' && c._sis === 'zfty'))
      for (var q3 = 1; q3 <= 9; q3++) if (q3 !== 5 && (c.palaces[q3].doorName || c.palaces[q3].door) === 'Birth' && ponte(q3)) { ponti.push('Birth'); break; }
    // Edu 25/10/2026: il ponte e' un passamano, riceve il qi da chi controlla e lo passa al controllato (5 elementi): vince il controllato
    if (ponti.length) { w = (sub === a); r.motivo += ' · ponte ' + ponti.join(' + ') + ': passamano, vince ' + (w ? 'il giorno' : 'l\'ora'); }
    return finale(w);
    // Commander nel palazzo opposto a chi vince: e' contro di lui, l'esito si ribalta (Edu 24/10, USDJPY 01/05/2024)
    function finale(v) {
      var OPP = { 1:9, 9:1, 2:8, 8:2, 3:7, 7:3, 4:6, 6:4 }, cm = trovaC(), vinc = v ? a : b;
      if (cm && OPP[cm] === vinc) { v = !v; r.motivo += ' · Commander opposto al vincitore: ribaltato'; }
      r.segue = v; return r;
    }
  }

  // Combinazione dentro il palazzo (Edu 25/10/2026, EURJPY 19/12/2024): stelo del cielo e della terra in 五合 (甲己 乙庚 丙辛 丁壬 戊癸)
  // -> il palazzo e' bloccato e non puo' vincere. DS bloccato -> non segue; HS bloccato -> segue; tutti e due -> fermo.
  var HE = { '甲':'己','己':'甲','乙':'庚','庚':'乙','丙':'辛','辛':'丙','丁':'壬','壬':'丁','戊':'癸','癸':'戊' };
  function bloccato(c, p) { return !!p && HE[c.palaces[p].tiH] === c.palaces[p].diH; }
  function giornoOra(c) {
    var r = giornoOraBase(c); if (!r) return r;
    r.base = r.segue; r.baseMotivo = r.motivo;   // per la lettura ragionata: la relazione di base e' il primo argomento
    var ca = W.QMDJ_COMB !== false && bloccato(c, r.palGiorno), cb = W.QMDJ_COMB !== false && bloccato(c, r.palOra);
    if (ca && cb) { r.segue = null; r.motivo += ' · giorno e ora bloccati da una combinazione: fermo'; }
    else if (ca) { r.segue = false; r.motivo += ' · giorno bloccato da una combinazione: non segue'; }
    else if (cb) { r.segue = true; r.motivo += ' · ora bloccata da una combinazione: segue'; }
    // DS/HS sopra 庚 (verifica 25/10/2026: il Commander su 庚 e' pessimo per dottrina, si estende a DS e HS?) -> non vince. QMDJ_GENG_DSHS=true.
    if ((W.QMDJ_GENG_DSHS === true || (c._sis === 'zfty' && W.QMDJ_GENG_ZFTY !== false)) && r.segue !== null) {   // ZFTY: acceso (Edu 26/10 18:42)
      var gA = r.palGiorno && c.palaces[r.palGiorno].diH === '庚' && c.palaces[r.palGiorno].tiH !== '庚',
          gB = r.palOra && c.palaces[r.palOra].diH === '庚' && c.palaces[r.palOra].tiH !== '庚';
      // Edu 28/10/2026 (EURUSD 19/08): "a generare il Commander ci sono i due 丙 di mese e anno, lo ZF sta nel palazzo del Tai Sui e il TY e'
      // molto debole: nonostante lo ZF su 庚 il Commander vince". Sostegni: ts = ramo dell'anno nel palazzo; gen = stelo del mese o dell'anno
      // (nel cielo) in un palazzo che lo genera; deb = l'altro ha forza <= QMDJ_GENG_ECC_DEBOLE (1). QMDJ_GENG_ECC: 'off' | 'uno' | 'due' | 'tre' | 'ts' | 'gen' | 'deb'
      var gem = W.QMDJ_GENG_ECC || 'off';
      var sost = function (p, fo) { var n = { ts: PBR[p].indexOf(c.anno[1]) >= 0, gen: false, deb: fo <= (W.QMDJ_GENG_ECC_DEBOLE === undefined ? 1 : W.QMDJ_GENG_ECC_DEBOLE) };
        for (var q = 1; q <= 9; q++) if (q !== 5 && q !== p && (c.palaces[q].tiH === c.mese[0] || c.palaces[q].tiH === c.anno[0]) && GEN[PEL[q]] === PEL[p]) n.gen = true;
        var k = (n.ts ? 1 : 0) + (n.gen ? 1 : 0) + (n.deb ? 1 : 0);
        return gem === 'uno' ? k >= 1 : gem === 'due' ? k >= 2 : gem === 'tre' ? k >= 3 : !!n[gem]; };
      if (gem !== 'off') { if (gA && sost(r.palGiorno, r.forzaOra)) gA = false; if (gB && sost(r.palOra, r.forzaGiorno)) gB = false; }
      if (gA && !gB) { r.segue = false; r.motivo += ' · giorno sopra 庚: non segue'; }
      else if (gB && !gA) { r.segue = true; r.motivo += ' · ora sopra 庚: segue'; }
    }
    // Palazzo colpito (Edu 25/10/2026, EURGBP 20/10: "l'ora e' in clash e lo ZS dal palazzo opposto clasha"): palazzo con clash interno
    // (steli o rami dei 六仪) e lo Zhi Shi nel palazzo opposto -> non puo' vincere. QMDJ_COLPITO = 'zs' (default) | 'zscmd' | 'solozs' | 'soloclash' | 'off'.
    var mod = W.QMDJ_COLPITO || 'zs';
    if (mod !== 'off' && r.segue !== null) {
      var CLS = { '甲':'庚','庚':'甲','乙':'辛','辛':'乙','丙':'壬','壬':'丙','丁':'癸','癸':'丁' }, YI = { '戊':'子','己':'戌','庚':'申','辛':'午','壬':'辰','癸':'寅' },
          CHB = { '子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳' };
      var OPq = { 1:9, 9:1, 2:8, 8:2, 3:7, 7:3, 4:6, 6:4 };
      var clashI = function (p) { var t = c.palaces[p].tiH, e = c.palaces[p].diH; return CLS[t] === e || (YI[t] && YI[e] && CHB[YI[t]] === YI[e]); };
      var colpito = function (p) { if (!p || !OPq[p]) return false; var o = c.palaces[OPq[p]];
        var att = o.zhiShi || (mod === 'zscmd' && o.deity === 'Commander'); if (mod === 'soloclash') return clashI(p); return att && (mod === 'solozs' || clashI(p)); };
      var ka = colpito(r.palGiorno), kb = colpito(r.palOra);
      if (ka && !kb) { r.segue = false; r.motivo += ' · giorno colpito (clash + Zhi Shi opposto): non segue'; }
      else if (kb && !ka) { r.segue = true; r.motivo += ' · ora colpita (clash + Zhi Shi opposto): segue'; }
    }
    // Tai Sui (Edu 25/10/2026, NZDUSD 07/10): lo stelo dell'anno e' il Tai Sui; se e' timely si oppone e clasha dal palazzo opposto
    // al DS o all'HS, che allora non vince. QMDJ_TAISUI = 'mese' (timely = 旺/相 nel mese) | 'forza' (mese+stagione >= 5) | 'ctl' (mese + controlla) | 'off'.
    var ts = W.QMDJ_TAISUI || 'forza';   // ACCESO (Edu 25/10): mese + stagione
    // Edu 26/10/2026 (EURGBP 20/10): il palazzo colpito (clash interno + Zhi Shi opposto) viene prima del Tai Sui. QMDJ_COLPITO_PRIMA=false per spegnerlo.
    var colpitoFatto = typeof ka !== 'undefined' && (ka || kb) && !(ka && kb);
    if (ts !== 'off' && r.segue !== null && !(W.QMDJ_COLPITO_PRIMA !== false && colpitoFatto)) {
      var OPt = { 1:9, 9:1, 2:8, 8:2, 3:7, 7:3, 4:6, 6:4 }, tp = palOf(c, stemOf(c.anno)), mbt = c.mese[1];
      var timely = function (p) { var m = tempo(PEL[p], BEL[mbt]); return ts === 'forza' ? m + tempo(PEL[p], SEAS[mbt]) >= 5 : m >= 3; };
      var colpisce = function (p) { return p && tp && OPt[p] === tp && timely(tp) && (ts !== 'ctl' || CTL[PEL[tp]] === PEL[p]); };
      var tA = colpisce(r.palGiorno), tB = colpisce(r.palOra);
      // Edu 25/10/2026 (GBPUSD 01/10): se il Tai Sui clasha il palazzo del Commander lo eccita ancora di piu' -> quel palazzo vince.
      // QMDJ_TS_CMD: true | 'neutro' (ogni Commander) | 'spostato' (solo il Commander spostato dell'ora 癸, Edu 25/10)
      var tsc = W.QMDJ_TS_CMD === undefined ? (c._sis === 'zfty' && W.QMDJ_TS_CMD_ZFTY ? W.QMDJ_TS_CMD_ZFTY : 'spostato') : W.QMDJ_TS_CMD;   // ACCESO (Edu 25/10): 'spostato'; ZFTY: QMDJ_TS_CMD_ZFTY
      if (tsc && r.palCmd && (tsc !== 'spostato' || c.pilastro[0] === '癸')) {
        var vince = tsc !== 'neutro';   // 'neutro': il Tai Sui non danneggia ma non fa vincere
        if (tA && r.palCmd === r.palGiorno) { tA = false; if (vince) r.segue = true; r.motivo += ' · Tai Sui eccita il Commander col giorno'; }
        if (tB && r.palCmd === r.palOra) { tB = false; if (vince) r.segue = false; r.motivo += ' · Tai Sui eccita il Commander con l\'ora'; }
      }
      if (tA && !tB) { r.segue = false; r.motivo += ' · Tai Sui timely opposto al giorno: non segue'; }
      else if (tB && !tA) { r.segue = true; r.motivo += ' · Tai Sui timely opposto all\'ora: segue'; }
    }
    // Mese (Edu 25/10/2026, AUDUSD 07/10): lo stelo del mese dal palazzo opposto clasha il DS o l'HS, che allora non vince; il clash e' piu' forte
    // quando stelo e ramo del mese stanno in palazzi opposti. QMDJ_MESE = 'off' | 'opposto' | 'forte' (solo con stelo e ramo opposti) | 'timely'.
    var mm = W.QMDJ_MESE || 'forte';   // ACCESO (Edu 25/10): solo con stelo e ramo del mese opposti
    if (mm !== 'off' && r.segue !== null) {
      var OPm = { 1:9, 9:1, 2:8, 8:2, 3:7, 7:3, 4:6, 6:4 }, PBm = { '子':1,'丑':8,'寅':8,'卯':3,'辰':4,'巳':4,'午':9,'未':2,'申':2,'酉':7,'戌':6,'亥':6 };
      var mp = palOf(c, stemOf(c.mese)), mbx = c.mese[1];
      var ok = mp && (mm === 'opposto' || (mm === 'forte' && OPm[mp] === PBm[mbx]) || (mm === 'timely' && tempo(PEL[mp], BEL[mbx]) + tempo(PEL[mp], SEAS[mbx]) >= 5));
      var mA = ok && OPm[r.palGiorno] === mp, mB = ok && OPm[r.palOra] === mp;
      if (mA && !mB) { r.segue = false; r.motivo += ' · mese opposto al giorno: non segue'; }
      else if (mB && !mA) { r.segue = true; r.motivo += ' · mese opposto all\'ora: segue'; }
    }
    // Controparte con clash interno (Edu 26/10/2026, EURGBP 20/10 ZFTY: "il TY ha un clash interno") -> non vince: segue.
    // QMDJ_CTP_CLASH: 'zfty' (default) | 'tutti' | 'off'
    var ccl = W.QMDJ_CTP_CLASH || 'off';   // SPENTA (peggiora tutto)
    if ((ccl === 'tutti' || (ccl === 'zfty' && c._sis === 'zfty')) && r.segue === false && r.palOra && r.palOra !== r.palGiorno) {
      var CLc = { '甲':'庚','庚':'甲','乙':'辛','辛':'乙','丙':'壬','壬':'丙','丁':'癸','癸':'丁' }, YIc = { '戊':'子','己':'戌','庚':'申','辛':'午','壬':'辰','癸':'寅' },
          CHc = { '子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳' };
      var tc = c.palaces[r.palOra].tiH, ec = c.palaces[r.palOra].diH;
      var soloSteli = W.QMDJ_CTP_CLASH_STELI === true;
      if (CLc[tc] === ec || (!soloSteli && YIc[tc] && YIc[ec] && CHc[YIc[tc]] === YIc[ec])) { r.segue = true; r.motivo += ' · controparte con clash interno: segue'; }
    }
    // ZFTY: la porta View dal palazzo opposto clasha il TY (o lo ZF), che non vince (Edu 25/10/2026, EURUSD 07/10). QMDJ_VIEW_CLASH: 'zfty' | 'tutti' | 'off'
    var vc = W.QMDJ_VIEW_CLASH || 'tutti';   // ACCESO in DsHs e ZFTY (Edu 25/10)
    // Edu 26/10/2026 (EURJPY 29/09): la combinazione che blocca un palazzo viene prima: se c'e', View non ribalta (QMDJ_VIEW_DOPO_COMB=false per spegnerlo)
    if ((vc === 'tutti' || (vc === 'zfty' && c._sis === 'zfty')) && r.segue !== null && !(W.QMDJ_VIEW_DOPO_COMB !== false && (ca || cb))) {
      var OPv = { 1:9, 9:1, 2:8, 8:2, 3:7, 7:3, 4:6, 6:4 }, vpz = null;
      for (var kv = 1; kv <= 9; kv++) if (kv !== 5 && (c.palaces[kv].doorName || c.palaces[kv].door) === 'View') vpz = kv;
      // prova: View sopra o sotto 庚 non agisce (come il Commander). QMDJ_VIEW_GENG=true
      if (vpz && W.QMDJ_VIEW_GENG === true && (c.palaces[vpz].tiH === '庚' || c.palaces[vpz].diH === '庚')) vpz = null;
      // Edu 26/10/2026 (EURJPY 12/10): View clasha ma non ribalta se il palazzo colpito e' forte. QMDJ_VIEW_FORTE: soglia di forza (default 5),
      // 'rel' = non ribalta se il colpito e' forte almeno quanto il palazzo di View, 0 = nessun limite.
      var vfs = W.QMDJ_VIEW_FORTE === undefined ? 5 : W.QMDJ_VIEW_FORTE, mbv = c.mese[1];
      var fzv = function (p) { return vuoto(c, p, vuotiCarta(c)) ? 0 : tempo(PEL[p], BEL[mbv]) + tempo(PEL[p], SEAS[mbv]); };
      var regge = function (p) { return vfs === 'rel' ? fzv(p) >= fzv(vpz) : (vfs > 0 && fzv(p) >= vfs); };
      if (vpz && OPv[vpz] === r.palOra && OPv[vpz] !== r.palGiorno && !(W.QMDJ_VIEW_FORTE_SOLO_TREND === false && regge(r.palOra))) { r.segue = true; r.motivo += ' · View clasha la controparte: segue'; }
      else if (vpz && OPv[vpz] === r.palGiorno && OPv[vpz] !== r.palOra && !regge(r.palGiorno)) { r.segue = false; r.motivo += ' · View clasha il trend: non segue'; }
    }
    // Flusso via Zhi Shi (Edu 26/10/2026, EURUSD 19/10): "il TY genera lo ZS molto vibrante che controlla lo ZF" -> vince il TY: non segue.
    // Specchio: lo ZF genera lo ZS che controlla il TY -> segue. QMDJ_ZS_FLUSSO = soglia di forza dello ZS (es. 5) | 'off' (default);
    // QMDJ_ZS_FLUSSO_SPECCHIO (default on).
    var zsf = W.QMDJ_ZS_FLUSSO;
    if (zsf !== undefined && zsf !== 'off' && c._sis === 'zfty' && r.segue !== null && r.palGiorno !== r.palOra) {
      var zq = null; for (var q5 = 1; q5 <= 9; q5++) if (q5 !== 5 && c.palaces[q5].zhiShi) zq = q5;
      if (zq && zq !== r.palGiorno && zq !== r.palOra) {
        var mbz = c.mese[1], fz = vuoto(c, zq, vuotiCarta(c)) ? 0 : tempo(PEL[zq], BEL[mbz]) + tempo(PEL[zq], SEAS[mbz]);
        // Edu 26/10/2026 (USDJPY 15/08/2024): un ponte (Commander, Wu, View, Birth) fra lo ZS e il palazzo che controlla gli passa il qi -> lo ZS non agisce
        var vuZ = vuotiCarta(c);
        var pontato = function (tg) { for (var k = 1; k <= 9; k++) { if (k === 5 || k === zq || k === tg || vuoto(c, k, vuZ)) continue; var d = c.palaces[k], dn = d.doorName || d.door;
          var PS = W.QMDJ_ZS_PONTI || 'Birth'; if (((PS.indexOf('Commander') >= 0 && d.deity === 'Commander') || (PS.indexOf('Wu') >= 0 && d.tiH === '戊') || (PS.indexOf('View') >= 0 && dn === 'View') || (PS.indexOf('Birth') >= 0 && dn === 'Birth') || (PS.indexOf('Mese') >= 0 && d.tiH === c.mese[0])) && GEN[PEL[zq]] === PEL[k] && GEN[PEL[k]] === PEL[tg]) return true; } return false; };
        var bersF = W.QMDJ_ZS_FLUSSO_DEBOLE;   // opzionale: il palazzo controllato dallo ZS deve avere forza <= soglia
        if (fz >= +zsf) {
          if (GEN[PEL[r.palOra]] === PEL[zq] && CTL[PEL[zq]] === PEL[r.palGiorno] && !(W.QMDJ_ZS_FLUSSO_PONTE !== false && pontato(r.palGiorno)) && !(bersF !== undefined && r.forzaGiorno > bersF)) { r.segue = false; r.motivo += ' · TY genera lo ZS (forza ' + fz + ') che controlla lo ZF: non segue'; }
          else if (W.QMDJ_ZS_FLUSSO_SPECCHIO !== false && GEN[PEL[r.palGiorno]] === PEL[zq] && CTL[PEL[zq]] === PEL[r.palOra] && !(W.QMDJ_ZS_FLUSSO_PONTE !== false && pontato(r.palOra)) && !(bersF !== undefined && r.forzaOra > bersF)) { r.segue = true; r.motivo += ' · ZF genera lo ZS (forza ' + fz + ') che controlla il TY: segue'; }
        }
      }
    }
    // View drena il Commander (Edu 26/10/2026, USDJPY 13/10): porta View nel palazzo generato dal palazzo del ZF -> il trend si svuota: non segue.
    // QMDJ_VIEW_DRENA: 'zf' (default nello ZFTY) | 'tutti' (anche la controparte drenata -> segue) | 'off'. QMDJ_VIEW_DRENA_VUOTO: anche View vuoto.
    var vdr = W.QMDJ_VIEW_DRENA || 'flusso';   // acceso nello ZFTY: catena del flusso nei due versi (Edu 26/10 19:01)
    if (vdr !== 'off' && c._sis === 'zfty' && r.segue !== null && r.palGiorno !== r.palOra) {
      var vq = null; for (var q4 = 1; q4 <= 9; q4++) if (q4 !== 5 && (c.palaces[q4].doorName || c.palaces[q4].door) === 'View') vq = q4;
      var vponte = /ponte[^·]*View/.test(r.motivo || '');   // se View fa gia' da ponte passa il qi, non drena
      if (vq && !(vponte && W.QMDJ_VIEW_DRENA_PONTE !== true) && (W.QMDJ_VIEW_DRENA_VUOTO !== false || !vuoto(c, vq, vuotiCarta(c)))) {
        var drA = vq !== r.palGiorno && GEN[PEL[r.palGiorno]] === PEL[vq], drB = vq !== r.palOra && GEN[PEL[r.palOra]] === PEL[vq];
        // Flusso del qi (Edu 26/10/2026 18:54): "il TY genera lo ZF che genera View: lo ZF perde energia, il qi arriva su Kan che Gen controlla:
        // vince il TY". Catena g -> h -> View: il qi finisce su View, che g controlla sempre (due passi nel ciclo) -> vince chi genera.
        // QMDJ_VIEW_DRENA='flusso' = solo questa catena; 'flussozf' = catena + drenaggio semplice del ZF negli altri casi.
        var gAB = GEN[PEL[r.palGiorno]] === PEL[r.palOra], gBA = GEN[PEL[r.palOra]] === PEL[r.palGiorno];
        if (vdr === 'flusso' || vdr === 'flussozf') {
          if (gBA && drA) { r.segue = false; r.motivo += ' · flusso: TY genera ZF genera View, il qi finisce su View che il TY controlla: non segue'; }
          else if (gAB && drB && W.QMDJ_FLUSSO_SOLO_ZF !== true) { r.segue = true; r.motivo += ' · flusso: ZF genera TY genera View, il qi finisce su View che lo ZF controlla: segue'; }
          else if (W.QMDJ_FLUSSO_CTL && drA && CTL[PEL[r.palOra]] === PEL[r.palGiorno]) { r.segue = W.QMDJ_FLUSSO_CTL === 'segue'; r.motivo += ' · TY controlla ZF, ZF genera View che controlla il TY: ' + (r.segue ? 'segue' : 'non segue'); }
          else if (vdr === 'flussozf' && drA && !drB && !gAB) { r.segue = false; r.motivo += ' · View drena il Commander: non segue'; }
        }
        else if (drA && !drB) { r.segue = false; r.motivo += ' · View drena il Commander: non segue'; }
        else if (vdr === 'tutti' && drB && !drA && vdr !== 'flusso') { r.segue = true; r.motivo += ' · View drena la controparte: segue'; }
      }
    }
    // Stadi di vita (十二长生) dello stelo del cielo del palazzo nel ramo del mese (Edu 26/10/2026, GBPUSD 07/10: 乙 in 酉 = 10, Vanishing 绝).
    // 1 长生 2 沐浴 3 冠带 4 临官 5 帝旺 6 衰 7 病 8 死 9 墓 10 绝 11 胎 12 养. Il palazzo in uno stadio di QMDJ_STADI (default [10]) non vince.
    var stadi = W.QMDJ_STADI || [];   // SPENTO di default: es. QMDJ_STADI=[10]
    if (stadi.length && r.segue !== null && r.palGiorno !== r.palOra) {
      var SH = { '甲':'亥','丙':'寅','戊':'寅','庚':'巳','壬':'申','乙':'午','丁':'酉','己':'酉','辛':'子','癸':'卯' };
      var stadio = function (st, br) { var a = BR.indexOf(SH[st]), b = BR.indexOf(br), yang = '甲丙戊庚壬'.indexOf(st) >= 0;
        return ((yang ? b - a : a - b) % 12 + 12) % 12 + 1; };
      // QMDJ_STADI_MODO (Edu 26/10/2026: "8-9-10, con 10 il peggiore; il clash con HS/TY a questi stadi e senza aiuti dovrebbe perdere sempre"):
      //  'tutti' (default) = entrambi i palazzi; 'ctp' = solo la controparte (HS/TY); 'ctpclash' = controparte: stadio 10 sempre, 8-9 solo con
      //  clash interno; 'ctpclashaiuto' = come ctpclash ma solo senza aiuti (Commander o Zhi Shi nel palazzo o in quello che lo genera).
      var smod = W.QMDJ_STADI_MODO || 'tutti';
      var CLs = { '甲':'庚','庚':'甲','乙':'辛','辛':'乙','丙':'壬','壬':'丙','丁':'癸','癸':'丁' }, YIs = { '戊':'子','己':'戌','庚':'申','辛':'午','壬':'辰','癸':'寅' },
          CHs = { '子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳' };
      var clI = function (p) { var t = c.palaces[p].tiH, e = c.palaces[p].diH; return CLs[t] === e || (YIs[t] && YIs[e] && CHs[YIs[t]] === YIs[e]); };
      var aiutato = function (p) { for (var q = 1; q <= 9; q++) { if (q === 5) continue; var d = c.palaces[q];
        if ((d.deity === 'Commander' || d.zhiShi) && (q === p || GEN[PEL[q]] === PEL[p])) return true; } return false; };
      // Edu 26/10/2026: lo stadio si legge sulla posizione nel Luoshu (rami del palazzo), non sul mese. QMDJ_STADI_POS='luoshu' (default) | 'mese'.
      // Palazzi d'angolo con due rami: QMDJ_STADI_ANGOLO = 'uno' (basta un ramo) | 'tutti' | 'primo' | 'secondo'.
      var PRAMI = { 1:['子'], 8:['丑','寅'], 3:['卯'], 4:['辰','巳'], 9:['午'], 2:['未','申'], 7:['酉'], 6:['戌','亥'] };
      var spos = W.QMDJ_STADI_POS || 'luoshu', sang = W.QMDJ_STADI_ANGOLO || 'uno';
      var stadiDi = function (p) { var st = c.palaces[p].tiH; if (spos === 'mese') return [stadio(st, c.mese[1])];
        var rr = PRAMI[p]; if (rr.length > 1 && sang === 'primo') rr = [rr[0]]; if (rr.length > 1 && sang === 'secondo') rr = [rr[1]];
        return rr.map(function (b) { return stadio(st, b); }); };
      var inSt = function (p) { var a = stadiDi(p).map(function (x) { return stadi.indexOf(x) >= 0; });
        return sang === 'tutti' ? a.every(Boolean) : a.some(Boolean); };
      var perde = function (p) { if (!p) return false; var sv = stadiDi(p).join('/');
        if (!inSt(p)) return false;
        if (W.QMDJ_STADI_FORTE && (p === r.palGiorno ? r.forzaGiorno : r.forzaOra) >= W.QMDJ_STADI_FORTE) return false;   // palazzo forte: lo stadio non basta
        if (W.QMDJ_STADI_COMB && (p === r.palGiorno ? r.forzaGiorno : r.forzaOra) > W.QMDJ_STADI_COMB - 1) return false;   // con forza combinata sopra soglia non perde
        if (smod === 'clash' || smod === 'ctpsoloclash') return clI(p);   // Edu 26/10/2026 (ZFTY): stadio negativo + clash nel palazzo
        if (smod === 'tutti' || smod === 'ctp') return true;
        var okc = stadiDi(p).indexOf(10) >= 0 || clI(p); if (smod === 'ctpclash') return okc; return okc && !aiutato(p); };
      var combo = W.QMDJ_STADI_NO_COMB && /bloccat/.test(r.motivo || '');
      var stA = !combo && (smod === 'tutti' || smod === 'clash') && perde(r.palGiorno), stB = !combo && perde(r.palOra);
      if (stB && !stA) { r.segue = true; r.motivo += ' · controparte nello stadio ' + stadiDi(r.palOra).join('/') + ': segue'; }
      else if (stA && !stB) { r.segue = false; r.motivo += ' · trend nello stadio ' + stadiDi(r.palGiorno).join('/') + ': non segue'; }
    }
    // Il palazzo vivo vince (Edu 28/10/2026, USDCAD 14/08): con un trigono vivo (QMDJ_TRIGONO_VIVO 'vivo' | 'nascita') -- e, se vuoto, in
    // stagione (旺相不空, QMDJ_TIMELY_PIENO) -- il palazzo vince anche contro 庚, flusso e altre regole. QMDJ_VIVO_FORTE: forza minima (0).
    var tvm = W.QMDJ_TRIGONO_VIVO || 'off';
    if (tvm !== 'off' && r.segue !== null && r.palGiorno && r.palOra && r.palGiorno !== r.palOra) {
      var fmin = W.QMDJ_VIVO_FORTE || 0, mbv2 = c.mese[1];
      var fz2 = function (p) { return tempo(PEL[p], BEL[mbv2]) + tempo(PEL[p], SEAS[mbv2]); };
      var viv = function (p) { return trigonoVivo(c, p, tvm) && fz2(p) >= fmin && !vuoto(c, p, vuotiCarta(c)); };
      var vA = viv(r.palGiorno), vB = viv(r.palOra);
      if (vA && !vB && !r.segue) { r.segue = true; r.motivo += ' · trigono vivo nel palazzo del trend: segue'; }
      else if (vB && !vA && r.segue) { r.segue = false; r.motivo += ' · trigono vivo nel palazzo della controparte: non segue'; }
    }
    // Steli nello stesso palazzo (Edu 28/10/2026, EURJPY 18/09: "lo ZF ha 丙 che controlla 庚, e 丙 e' il Tai Sui: non lo vedo bene").
    // Lo stelo della terra che controlla quello del cielo indebolisce il palazzo, che non vince. QMDJ_STELI_INT:
    // 'terra' (terra controlla cielo) | 'tutti' (anche cielo controlla terra) | 'taisui' (solo se chi controlla e' il Tai Sui) | 'off' (default)
    // Edu 28/10/2026: "la combinazione stessa di 庚 su 丙 o viceversa e' conflittuale" -> il palazzo con 庚/丙 non vince. QMDJ_GENG_BING: 'perde' | 'off'
    // Edu 28/10 (USDJPY 30/07/2026): il Commander/ZF sopra 庚 viene prima -> se la regola del 庚 ha gia' deciso, 庚/丙 non ribalta.
    if ((W.QMDJ_GENG_BING || 'off') === 'perde' && r.segue !== null && r.palGiorno && r.palOra && r.palGiorno !== r.palOra && !(W.QMDJ_GENG_BING_DOPO !== false && /sopra 庚/.test(r.motivo || ''))) {
      var gb = function (p) { var t = c.palaces[p].tiH, e = c.palaces[p].diH; return (t === '庚' && e === '丙') || (t === '丙' && e === '庚'); };
      var gA = gb(r.palGiorno), gB = gb(r.palOra);
      if (gA && !gB && r.segue) { r.segue = false; r.motivo += ' · 庚/丙 nel palazzo del trend: non segue'; }
      else if (gB && !gA && !r.segue) { r.segue = true; r.motivo += ' · 庚/丙 nel palazzo della controparte: segue'; }
    }
    var sim = W.QMDJ_STELI_INT || 'off';
    if (sim !== 'off' && r.segue !== null && r.palGiorno && r.palOra && r.palGiorno !== r.palOra) {
      var SEL = { '甲':'L','乙':'L','丙':'F','丁':'F','戊':'E','己':'E','庚':'M','辛':'M','壬':'W','癸':'W' }, ts0 = c.anno && c.anno[0];
      var danno = function (p) { var t = c.palaces[p].tiH, e = c.palaces[p].diH;
        var tc = CTL[SEL[e]] === SEL[t], cc = CTL[SEL[t]] === SEL[e];
        if (sim === 'terra') return tc; if (sim === 'tutti') return tc || cc;
        if (sim === 'taisui') return (tc && e === ts0) || (cc && t === ts0); return false; };
      var dA2 = danno(r.palGiorno), dB2 = danno(r.palOra);
      if (dA2 && !dB2 && r.segue) { r.segue = false; r.motivo += ' · steli in controllo nel palazzo del trend: non segue'; }
      else if (dB2 && !dA2 && !r.segue) { r.segue = true; r.motivo += ' · steli in controllo nel palazzo della controparte: segue'; }
    }
    // Fan yin (Edu 25/10/2026, USDJPY 19/10): cielo rovesciato sulla terra (stelo del cielo = stelo della terra del palazzo opposto) -> non segue quasi mai
    var OPP = { 1:9, 9:1, 2:8, 8:2, 3:7, 7:3, 4:6, 6:4 }, fy = true, k;
    for (k in OPP) if (c.palaces[k].tiH !== c.palaces[OPP[k]].diH) { fy = false; break; }
    // Edu 28/10/2026 (USDJPY 18/09): "segue perche' Wu su Kan fa da ponte" -> il ponte vince il fan yin.
    // QMDJ_FANYIN_PONTE: 'wu' (solo il ponte Wu) | 'tutti' (qualsiasi ponte) | 'off' (default)
    var fyp = W.QMDJ_FANYIN_PONTE || 'off', mpt = /ponte ([^:]*):/.exec(r.motivo || '');
    if (fy && mpt && (fyp === 'tutti' || (fyp === 'wu' && /Wu/.test(mpt[1])))) { fy = false; r.motivo += ' · fan yin superato dal ponte ' + mpt[1]; }
    // Edu 28/10/2026 (AUDUSD 01/10): "e' fan yin ma lo ZF sta con Birth, che di norma e' piu' forte di Death".
    // QMDJ_BIRTH_DEATH: 'fanyin' (solo nel fan yin) | 'fermo' (anche quando ZF e TY sono fermi: stesso elemento) | 'sempre' | 'off' (default)
    var bdm = W.QMDJ_BIRTH_DEATH || 'off';
    if (bdm !== 'off' && r.palGiorno && r.palOra) {
      var dA = c.palaces[r.palGiorno].doorName || c.palaces[r.palGiorno].door, dB = c.palaces[r.palOra].doorName || c.palaces[r.palOra].door;
      var bd = dA === 'Birth' && dB === 'Death' ? true : (dB === 'Birth' && dA === 'Death' ? false : null);
      var fermo = /fermo/.test(r.motivo || '');
      // Edu 28/10/2026 (GBPUSD 05/02): "il mese con il suo ramo sta direttamente dalla parte del TY" -> Birth non prevale se il ramo del
      // mese sta nel palazzo della parte con Death. QMDJ_BIRTH_DEATH_MESE (default on).
      var mbr = c.mese[1], mesoA = PBR[r.palGiorno].indexOf(mbr) >= 0, mesoB = PBR[r.palOra].indexOf(mbr) >= 0;
      if (W.QMDJ_BIRTH_DEATH_MESE !== false && bd !== null && ((bd && mesoB) || (!bd && mesoA))) bd = null;
      if (bd !== null && (bdm === 'sempre' || (bdm === 'fanyin' && fy) || (bdm === 'fermo' && (fy || fermo)))) {
        fy = false; r.segue = bd; r.motivo += ' · Birth piu\' forte di Death: ' + (bd ? 'segue' : 'non segue'); }
    }
    // prova (28/10): nel fan yin o con ZF/TY fermi vince il palazzo che contiene il ramo del mese. QMDJ_MESE_LATO: 'fanyin' | 'fermo' | 'off'
    var mlt = W.QMDJ_MESE_LATO || 'off';
    if (mlt !== 'off' && r.palGiorno && r.palOra && (fy || (mlt === 'fermo' && /fermo/.test(r.motivo || '')))) {
      var mb2 = c.mese[1], inA = PBR[r.palGiorno].indexOf(mb2) >= 0, inB = PBR[r.palOra].indexOf(mb2) >= 0;
      if (inA !== inB) { fy = false; r.segue = inA; r.motivo += ' · il ramo del mese sta con ' + (inA ? 'lo ZF: segue' : 'il TY: non segue'); }
    }
    if (fy && W.QMDJ_FANYIN !== false) { r.segue = false; r.fanYin = true; r.motivo += ' · fan yin: non segue'; }
    // Ora inibita (Edu 25/10/2026, USDCAD 12/10): il Commander nel palazzo opposto all'HS lo clasha E l'HS sta nel palazzo opposto al
    // ramo dell'ora -> l'ora non funziona: segue (anche sopra il fan yin). Simmetrico per il giorno -> non segue. QMDJ_INIBITA = 'on' | 'off' | 'una'.
    var inib = W.QMDJ_INIBITA || 'off';   // SPENTA di default (peggiora il 2024-26)
    if (inib !== 'off') {
      var PB = { '子':1,'丑':8,'寅':8,'卯':3,'辰':4,'巳':4,'午':9,'未':2,'申':2,'酉':7,'戌':6,'亥':6 }, OPi = { 1:9, 9:1, 2:8, 8:2, 3:7, 7:3, 4:6, 6:4 };
      var cmO = null; for (k = 1; k <= 9; k++) if (k !== 5 && c.palaces[k].deity === 'Commander') cmO = k;
      if (cmO && (W.QMDJ_CMD_GENG || 'inibita') !== 'off' && (c.palaces[cmO].tiH === '庚' || c.palaces[cmO].diH === '庚')) cmO = null;   // Commander con 庚: non inibisce
      var inibito = function (p, ramo) { if (!p || !OPi[p]) return false; var a1 = cmO === OPi[p], a2 = OPi[PB[ramo]] === p;
        return inib === 'una' ? (a1 || a2) : (a1 && a2); };
      var ia = inibito(r.palGiorno, c.giorno[1]), ib = inibito(r.palOra, c.pilastro[1]);
      if (ib && !ia) { r.segue = true; r.motivo += ' · ora inibita (Commander opposto + ora opposta al suo ramo): segue'; }
      else if (ia && !ib) { r.segue = false; r.motivo += ' · giorno inibito (Commander opposto + giorno opposto al suo ramo): non segue'; }
    }
    // Edu 29/10/2026 (AUDUSD 10/09/2026): "non segue perche' il TY genera Birth con lo ZS che controlla un Li untimely"
    // (prova: l'ora 丙午 clasha Li da Kan e il suo stesso ramo). Il palazzo di Birth/ZS generato da una parte e che controlla l'altra,
    // untimely nel mese (囚/死), decide. Simmetrico per lo ZF. QMDJ_TY_BIRTH: 'zfty' | 'tutti' | 'off'; QMDJ_TY_BIRTH_PORTA:
    // 'birthzs' (Birth che e' lo ZS, default) | 'birth' | 'zs' | 'uno' (Birth o ZS).
    var tbm = W.QMDJ_TY_BIRTH || 'off';
    if ((tbm === 'tutti' || (tbm === 'zfty' && c._sis === 'zfty')) && r.palGiorno && r.palOra && r.palGiorno !== r.palOra) {
      var tbp = W.QMDJ_TY_BIRTH_PORTA || 'birthzs', mbb = c.mese[1];
      var agente = function (p) { var d = c.palaces[p], bi = (d.doorName || d.door) === 'Birth', zz = !!d.zhiShi;
        var an = d.tiH === c.anno[0] || d.diH === c.anno[0], vw = (d.doorName || d.door) === 'View';
        // Edu 29/10/2026 (USDJPY 22/10/2026): "non segue perche' View con ZS e Anno controlla lo ZF"
        if (tbp === 'zsanno') return zz && (bi || an); if (tbp === 'zsanno2') return zz && (bi || (vw && an)); if (tbp === 'zsbv') return zz && (bi || vw);
        return tbp === 'birth' ? bi : tbp === 'zs' ? zz : tbp === 'uno' ? (bi || zz) : (bi && zz); };
      var untm = function (p) { return tempo(PEL[p], BEL[mbb]) <= 1; };
      var gen = function (a, x) { return a === x || GEN[PEL[a]] === PEL[x]; };
      var tbf = W.QMDJ_TY_BIRTH_FORTE || 0;   // forza minima (mese) del palazzo di Birth/ZS
      for (var q6 = 1; q6 <= 9; q6++) { if (q6 === 5 || !agente(q6) || tempo(PEL[q6], BEL[mbb]) < tbf) continue;
        var vsZ = gen(r.palOra, q6) && CTL[PEL[q6]] === PEL[r.palGiorno] && untm(r.palGiorno);
        var vsT = gen(r.palGiorno, q6) && CTL[PEL[q6]] === PEL[r.palOra] && untm(r.palOra);
        if (vsZ && !vsT) { r.segue = false; r.motivo += ' · la controparte genera lo ZS (con Birth, o View e lo stelo dell\'anno) che controlla lo ZF untimely: non segue'; break; }
        if (vsT && !vsZ) { r.segue = true; r.motivo += ' · lo ZF genera lo ZS (con Birth, o View e lo stelo dell\'anno) che controlla la controparte untimely: segue'; break; } }
    }
    // Edu 29/10/2026 (USDJPY 24/09/2026): l'OUTPUT del controllato (l'elemento che il controllato genera, che controlla sempre chi lo
    // controllava), quando e' timely nel mese (旺/相) e non vuoto, fa ricircolare il qi verso chi controlla: il controllo tiene
    // ("al contrario e' il ponte"). Misura (ZF controlla TY): 62,5% e 61,5% contro 51,9% e 53,6% con l'Output untimely.
    // QMDJ_OUTPUT: 'zfty' | 'tutti' | 'off'; QMDJ_OUTPUT_MODO: 'zf' (solo lo ZF che controlla -> segue) | 'simm' (anche TY -> non segue).
    var opm = W.QMDJ_OUTPUT || 'off';
    if ((opm === 'tutti' || (opm === 'zfty' && c._sis === 'zfty')) && r.palGiorno && r.palOra && r.palGiorno !== r.palOra && PEL[r.palGiorno] && PEL[r.palOra]) {
      var eG = PEL[r.palGiorno], eO = PEL[r.palOra], chi = CTL[eG] === eO ? 'zf' : CTL[eO] === eG ? 'ty' : null, omo = W.QMDJ_OUTPUT_MODO || 'fermo';
      var vale = chi === 'zf' ? (r.segue === true) : chi === 'ty' && W.QMDJ_OUTPUT_SIMM ? (r.segue === false) : false;
      if (vale) {
        var eOut = GEN[chi === 'zf' ? eO : eG], vuO = vuotiCarta(c), okO = false;
        if (tempo(eOut, BEL[c.mese[1]]) >= 3) for (var q7 = 1; q7 <= 9; q7++) if (q7 !== 5 && PEL[q7] === eOut && !vuoto(c, q7, vuO)) okO = true;
        if (okO) r.motivo += ' · l\'Output del controllato e\' timely e ritorna a chi controlla: il controllo tiene';
        else if (omo === 'fermo') { r.segue = null; r.motivo += ' · l\'Output del controllato non e\' timely: il controllo non si chiude, fermo'; }
        else { r.segue = !r.segue; r.motivo += ' · l\'Output del controllato non e\' timely: il controllo non tiene, ' + (r.segue ? 'segue' : 'non segue'); }
      }
    }
    // Edu 29/10/2026 (NZDUSD 28/10/2026): 青龍逃走, 乙 nel cielo sopra 辛 sul di pan: il drago fugge, il trend scappa.
    // QMDJ_QINGLONG: 'off' | 'dshs' | 'zfty' | 'tutti'. ATTORE: 'ds' (palazzo dello stelo del giorno 乙) | 'giorno' (palazzo del trend del metodo).
    // MODO: 'contro' (segue/fermo -> non segue) | 'segue' (solo un segue diventa non segue) | 'fermo' (un segue diventa fermo). SIMM: anche per l'ora.
    var qlm = W.QMDJ_QINGLONG || 'off';
    if (qlm === 'tutti' || qlm === c._sis) {
      var qa = W.QMDJ_QINGLONG_ATTORE || 'ds', qmo = W.QMDJ_QINGLONG_MODO || 'segue', qpg = null, qpo = null;
      if (qa === 'ds') { for (var q8 = 1; q8 <= 9; q8++) if (q8 !== 5 && c.palaces[q8].tiH === c.giorno[0]) qpg = q8; }
      else qpg = r.palGiorno;
      qpo = r.palOra;
      var qlG = qpg && c.palaces[qpg].tiH === '乙' && c.palaces[qpg].diH === '辛';
      var qlO = W.QMDJ_QINGLONG_SIMM && qpo && c.palaces[qpo].tiH === '乙' && c.palaces[qpo].diH === '辛';
      if (qlG && !qlO) {
        if (qmo === 'contro' && r.segue !== false) { r.segue = false; r.motivo += ' · 青龍逃走 (乙 sopra 辛) sul trend: il drago fugge, non segue'; }
        else if (qmo === 'segue' && r.segue === true) { r.segue = false; r.motivo += ' · 青龍逃走 (乙 sopra 辛) sul trend: il drago fugge, non segue'; }
        else if (qmo === 'fermo' && r.segue === true) { r.segue = null; r.motivo += ' · 青龍逃走 (乙 sopra 辛) sul trend: fermo'; }
      } else if (qlO && !qlG && r.segue !== true && qmo !== 'fermo') { r.segue = true; r.motivo += ' · 青龍逃走 (乙 sopra 辛) sulla controparte: segue'; }
    }
    return r;
  }

  // Wu contro Birth (Edu 25/10/2026), a CONFERMA di una lettura, indipendente dal trend:
  // la porta Birth controlla il palazzo di Wu (戊 nel cielo) -> SHORT; Wu controlla Birth -> LONG.
  function wuBirth(c) {
    var w = null, b = null, p;
    for (p = 1; p <= 9; p++) if (p !== 5) { if (c.palaces[p].tiH === '戊') w = p; if ((c.palaces[p].doorName || c.palaces[p].door) === 'Birth') b = p; }
    if (!w || !b || w === b || PEL[w] === PEL[b]) return null;
    if (CTL[PEL[b]] === PEL[w]) return 'SHORT';
    if (CTL[PEL[w]] === PEL[b]) return 'LONG';
    return null;
  }
  // Lettura completa: trend 'LONG'|'SHORT' -> { dir, segue, motivo, wuBirth, conferma (true/false/null) }
  // Regole per metodo (Edu 27/10/2026: "se una regola peggiora tanto su un metodo e non su un altro, spegnila solo su quello").
  // QMDJ_PER = { dshs: { QMDJ_X: valore, ... }, zfty: { ... } }: valori applicati solo durante la lettura di quel metodo.
  // Un valore impostato a mano (globale) vince su quello del metodo. QMDJ_PER = {} per spegnere tutte le regole per metodo.
  var PER_DEFAULT = {
    dshs: { QMDJ_STADI_PESO: { 8: -1, 9: -2, 10: -3 },
            QMDJ_TIMELY_PIENO: 8, QMDJ_TRIGONO_VIVO: 'nascita',
            QMDJ_QINGLONG: 'tutti', QMDJ_QINGLONG_MODO: 'contro' },   // 29/10: 青龍逃走 sullo stelo del giorno -> non segue (NZDUSD 28/10)   // 28/10 10:54: 旺相不空 + trigono vivo anche in DsHs            // 27/10: palazzo forte bilancia lo stelo (+93 | +190)
    zfty: { QMDJ_PONTE_CLASH: true, QMDJ_CMD_AIUTO: true,            // 27/10: ponte con clash non passa il qi, Commander tiene il controllo (+568 | +675)
            QMDJ_CLASH_PIENO: 'tutti', QMDJ_PONTE_BIRTH: 'tutti', QMDJ_PONTE_BIRTH_PIENO: true,
            QMDJ_TRIGONO: 'tutti', QMDJ_FANYIN_PONTE: 'wu',   // 28/10: il ponte Wu vince il fan yin
            QMDJ_BIRTH_DEATH: 'fanyin', QMDJ_MESE_LATO: 'fermo',
            QMDJ_GENG_BING: 'perde', QMDJ_GENG_ECC: 'tre',
            QMDJ_TIMELY_PIENO: 8, QMDJ_TRIGONO_VIVO: 'nascita',
            QMDJ_TY_BIRTH: 'zfty', QMDJ_TY_BIRTH_PORTA: 'zsanno2', QMDJ_OUTPUT: 'zfty',
            QMDJ_QINGLONG: 'tutti', QMDJ_QINGLONG_MODO: 'contro', QMDJ_DS_PONTE: 'tutti' }   // 30/10: il ponte dello stelo del giorno (EURJPY 29/09)   // 29/10: 青龍逃走 sullo stelo del giorno -> non segue (NZDUSD 28/10)   // 29/10: senza l'Output timely del TY controllato il controllo dello ZF non si chiude: fermo (USDJPY 24/09)   // 29/10: il TY genera Birth/ZS che controlla lo ZF untimely (AUDUSD 10/09)   // 28/10: 旺相不空 + trigono vivo (mese nel trigono, attori non vuoti) vince   // 28/10: lo ZF su 庚 vince se generato da steli mese/anno, nel palazzo del Tai Sui e col TY debole   // 28/10: 庚/丙 conflittuale, dopo la regola del 庚 sotto lo ZF/Commander   // 28/10: Birth batte Death salvo mese contrario; il ramo del mese decide fan yin e fermi   // 27/10 12:50: trigono (六仪 + porte + stelle) in tomba nel mese = vuoto   // 27/10 11:54: clash interno = mai vuoto; Birth frena il ponte
  };
  function conPer(sis, fn) {
    var per = (W.QMDJ_PER || PER_DEFAULT)[sis] || {}, messi = [], k;
    for (k in per) if (W[k] === undefined) { W[k] = per[k]; messi.push(k); }
    try { return fn(); } finally { for (var i = 0; i < messi.length; i++) delete W[messi[i]]; }
  }
  // LETTURA RAGIONATA (Edu 28/10/2026: "Lio non scorre un elenco di regole, ragiona e giunge a conclusioni: fai lo stesso nel qimen").
  // Gli argomenti sono le regole che scattano sulla carta, ciascuna col suo verso (segue / non segue): la relazione di base e poi
  // ogni passaggio del motivo. argomenti(g) -> [{ k: chiave, v: true|false }].
  function chiave(t) { return t.replace(/\(forza \d+\)/g, '').replace(/\s+/g, ' ').replace(/: (non )?segue$/, '').replace(/: fermo$/, '').trim(); }
  function argomenti(g) {
    var out = [], parti = (g.motivo || '').split(' · '), nb = (g.baseMotivo || '').split(' · ').length;
    for (var i = 0; i < parti.length; i++) {
      var t = parti[i], v;
      if (i < nb) { if (i === nb - 1 && g.base !== null && g.base !== undefined) out.push({ k: 'base: ' + chiave(parti.slice(0, nb).join(' · ')), v: g.base }); continue; }
      if (/non segue$/.test(t)) v = false; else if (/segue$/.test(t)) v = true;
      else if (/vince il giorno$/.test(t)) v = true; else if (/vince l'ora$/.test(t)) v = false; else continue;
      out.push({ k: chiave(t), v: v });
    }
    return out;
  }
  // PALAZZO CHE DECIDE (Edu 30/10/2026): il MDO entra nell'ora che accende il palazzo che decide la carta. Il palazzo e' quello del
  // passaggio della cascata che ha dato il verdetto finale (l'ultimo argomento col verso del verdetto; se nessuno, la relazione di base).
  // decide(c, g) -> { pal, passo }. Base: controllo -> chi vince; generazione -> chi genera.
  function decide(c, g) {
    if (!g || g.segue === null || g.segue === undefined || !g.palGiorno || !g.palOra) return { pal: null, passo: null };
    var A = g.palGiorno, B = g.palOra, parti = (g.motivo || '').split(' · '), nb = (g.baseMotivo || '').split(' · ').length, passo = null;
    var verso = function (t) { return /non segue$|vince l'ora$|ribaltato$/.test(t) ? false : /segue$|vince il giorno$|tiene$/.test(t) ? true : null; };
    for (var i = parti.length - 1; i >= nb; i--) { var v = verso(parti[i]); if (/ribaltato$/.test(parti[i]) || v === g.segue) { passo = parti[i]; break; } }
    var trova = function (f) { for (var k = 1; k <= 9; k++) if (k !== 5 && f(c.palaces[k])) return k; return null; };
    var porta = function (n) { return trova(function (d) { return (d.doorName || d.door) === n; }); };
    var zs = trova(function (d) { return d.zhiShi; }), cmd = trova(function (d) { return d.deity === 'Commander'; });
    var ramo = function (b) { for (var k in PBR) if (PBR[k].indexOf(b) >= 0) return +k; return null; };
    if (!passo) {   // relazione di base
      var x = PEL[A], y = PEL[B], bm = g.baseMotivo || '';
      if (/genera/.test(bm)) return { pal: GEN[x] === y ? A : B, passo: bm };
      return { pal: g.base === null ? null : (g.base ? A : B), passo: bm };
    }
    var p = null;
    if (/^ponte /.test(passo)) { var n = passo.slice(6).split(':')[0].split(' + ')[0];
      p = n === 'Commander' ? cmd : n === 'Zhi Shi' ? zs : n === 'Wu' ? trova(function (d) { return d.tiH === '戊'; }) : n === 'stelo del mese' ? trova(function (d) { return d.tiH === c.mese[0]; }) : n === 'stelo del giorno' ? trova(function (d) { return d.tiH === c.giorno[0]; }) : porta(n); }
    else if (/青龍逃走/.test(passo)) p = trova(function (d) { return d.tiH === '乙' && d.diH === '辛'; });
    else if (/Commander opposto|Tai Sui eccita/.test(passo)) p = cmd;
    else if (/genera lo ZS/.test(passo)) p = zs;
    else if (/Tai Sui timely/.test(passo)) p = ramo(c.anno[1]);
    else if (/^View |flusso|genera View/.test(passo)) p = porta('View');
    else if (/Birth piu' forte/.test(passo)) p = porta('Birth');
    else if (/ramo del mese/.test(passo)) p = ramo(c.mese[1]);
    else if (/fan yin superato dal ponte/.test(passo)) p = /Wu/.test(passo) ? trova(function (d) { return d.tiH === '戊'; }) : null;
    else if (/Output del controllato/.test(passo)) { var eo = GEN[g.segue ? PEL[B] : PEL[A]]; p = null;
      for (var q = 1; q <= 9; q++) if (q !== 5 && PEL[q] === eo) { p = q; break; } }
    else if (/controparte|(^|[ '])ora( |:)/.test(passo)) p = B;
    else if (/giorno|trend/.test(passo)) p = A;
    else p = g.segue ? A : B;   // fan yin e altri: chi vince
    return { pal: p, passo: passo };
  }
  function lettura(c, trend, sis) {
    if (c) c._sis = sis || 'dshs';
    var g = conPer(c ? c._sis : 'dshs', function () { return giornoOra(c); }); if (!g) return null;
    var dir = g.segue === null ? null : (g.segue ? trend : (trend === 'LONG' ? 'SHORT' : 'LONG')), wb = wuBirth(c), dc = decide(c, g);
    return { dir: dir, segue: g.segue, motivo: g.motivo, wuBirth: wb, conferma: (dir && wb) ? wb === dir : null, giornoOra: g, argomenti: argomenti(g),
             palDecide: dc.pal, passoDecide: dc.passo };
  }

  var API = { lettura: lettura, wuBirth: wuBirth, giornoOra: giornoOra, oraria: oraria, giornaliera: giornaliera, testo: testo, hourGZ: hourGZ, juOraria: juOraria, juGiornaliera: juGiornaliera };
  W.XKDGQimen = API;
  if (typeof module !== 'undefined') module.exports = API;
})();
