/* qmdj_ore.js — Le ore che eccitano il Commander (Edu, 28/10/2026).
 * Dottrina di Edu: "quando l'ora colpisce il Commander il trend accelera". Casi letti da Edu:
 *   - stelo dell'ora nel palazzo del Commander + ramo dell'ora OPPOSTO a un ramo del palazzo (EURUSD 05/10/2026, 辛丑 su Kun)
 *   - stelo dell'ora nel palazzo del Commander + ramo IDENTICO, nel suo stesso palazzo (EURUSD 07/10/2026, 戊辰 su Xun)
 *   - il ramo conta anche se e' contenuto nella STELLA o nella PORTA del palazzo (ramo del loro palazzo d'origine):
 *     GBPUSD e USDCHF 14/10/2026, 甲午 (甲 sotto 辛 col Commander, 午 nella stella Hero)
 *   - basta anche il solo stelo (EURJPY 07/10/2026, 戊辰 con 戊 in Kun col Commander), e li' il ramo arriva
 *     attraverso un PONTE: 壬 su Li genera il Commander e 壬 contiene 辰 (六仪 di 甲辰)
 * La carta e' quella del giorno (carta oraria col seme del cross, XKDGQimen.oraria). Le ore sono quelle della
 * giornata di trading (00:00-21:00 GMT), pilastro dell'ora con lo stelo del giorno della carta.
 * Uso: XKDGQimenOre.ore(carta) -> [{ ramo, pilastro, ecc, forma, motivo }] per i 12 rami.
 *      XKDGQimenOre.oreGMT(ramo) -> le barre orarie GMT (00..20) che cadono in quel ramo.
 */
(function () {
  var W = typeof window !== 'undefined' ? window : globalThis;
  var BR = '子丑寅卯辰巳午未申酉戌亥', ST = '甲乙丙丁戊己庚辛壬癸';
  var HOUR_STEM_START = { '甲': 0, '己': 0, '乙': 2, '庚': 2, '丙': 4, '辛': 4, '丁': 6, '壬': 6, '戊': 8, '癸': 8 };
  var PB = { 1: '子', 8: '丑寅', 3: '卯', 4: '辰巳', 9: '午', 2: '未申', 7: '酉', 6: '戌亥' };
  var PEL = { 1: 'acqua', 2: 'terra', 3: 'legno', 4: 'legno', 6: 'metallo', 7: 'metallo', 8: 'terra', 9: 'fuoco' };
  var GEN = { legno: 'fuoco', fuoco: 'terra', terra: 'metallo', metallo: 'acqua', acqua: 'legno' };
  var DOORHOME = { Rest: 1, Birth: 8, Injury: 3, Delusion: 4, View: 9, Death: 2, Shocking: 7, Open: 6 };
  var STARHOME = { Grass: 1, Rice: 2, Aggressor: 3, Assistant: 4, Heart: 6, Pillar: 7, Official: 8, Hero: 9 };
  var YIR = { '戊': '子', '己': '戌', '庚': '申', '辛': '午', '壬': '辰', '癸': '寅' };   // il 六仪 contiene il ramo
  var XUN = { '子': '戊', '戌': '己', '申': '庚', '午': '辛', '辰': '壬', '寅': '癸' };   // 甲 si nasconde sotto il 六仪 del suo 旬

  function hourGZ(dayStem, hb) { return ST[(HOUR_STEM_START[dayStem] + BR.indexOf(hb)) % 10] + hb; }
  function stemVisibile(gz) {   // 甲 -> il 六仪 sotto cui si nasconde
    if (gz[0] !== '甲') return gz[0];
    var lead = BR[((BR.indexOf(gz[1]) - ST.indexOf(gz[0])) % 12 + 12) % 12];
    return XUN[lead];
  }
  function clash(a, b) { return Math.abs(BR.indexOf(a) - BR.indexOf(b)) === 6; }
  function palDi(c, s) { for (var p = 1; p <= 9; p++) if (p !== 5 && (c.palaces[p].tiH === s || c.palaces[p].ti2H === s)) return p; return null; }
  function palCommander(c) { for (var p = 1; p <= 9; p++) if (p !== 5 && c.palaces[p].deity === 'Commander') return p; return null; }
  // rami del palazzo: i suoi + quello della porta e della stella (palazzo d'origine), Edu 27-28/10/2026
  function ramiPalazzo(c, p) {
    var d = c.palaces[p], r = { proprio: PB[p], porta: PB[DOORHOME[d.doorName || d.door]] || '', stella: PB[STARHOME[d.star]] || '' };
    return r;
  }

  function oraCommander(c, gz) {
    var pc = palCommander(c); if (!pc) return null;
    var st = stemVisibile(gz), hb = gz[1], ps = palDi(c, st);
    var out = { ramo: hb, pilastro: gz, stelo: st, palCmd: pc, ecc: false, forma: null, motivo: '' };
    if (ps !== pc) return out;
    out.ecc = true;
    var r = ramiPalazzo(c, pc), tutti = r.proprio + r.porta + r.stella, d = c.palaces[pc];
    var dove = function (b) { return r.proprio.indexOf(b) >= 0 ? 'nel palazzo' : r.stella.indexOf(b) >= 0 ? 'nella stella ' + d.star : 'nella porta ' + (d.doorName || d.door); };
    for (var i = 0; i < tutti.length; i++) if (clash(hb, tutti[i])) {
      out.forma = 'opposta'; out.motivo = st + ' col Commander, ' + hb + ' clasha ' + tutti[i] + ' ' + dove(tutti[i]); return out; }
    if (tutti.indexOf(hb) >= 0) { out.forma = 'identica'; out.motivo = st + ' col Commander, ' + hb + ' ' + dove(hb); return out; }
    // ponte: uno stelo che contiene il ramo dell'ora (六仪) in un palazzo che genera quello del Commander
    for (var p = 1; p <= 9; p++) {
      if (p === 5 || p === pc || GEN[PEL[p]] !== PEL[pc]) continue;
      var t = c.palaces[p].tiH;
      if (YIR[t] === hb) { out.forma = 'ponte'; out.motivo = st + ' col Commander, ' + t + ' contiene ' + hb + ' e genera il Commander dal palazzo ' + p; return out; }
    }
    out.forma = 'solo stelo'; out.motivo = st + ' col Commander';
    return out;
  }

  function ore(c) { var ds = c.giorno[0], L = []; for (var i = 0; i < 12; i++) L.push(oraCommander(c, hourGZ(ds, BR[i]))); return L; }
  // barre GMT della giornata di trading (00..20) che cadono in ogni ramo: 子 23-01 -> solo 00
  function oreGMT(hb) { var i = BR.indexOf(hb); if (i === 0) return [0]; var h = [2 * i - 1, 2 * i]; return h.filter(function (x) { return x <= 20; }); }

  var API = { ore: ore, oraCommander: oraCommander, oreGMT: oreGMT, hourGZ: hourGZ };
  W.XKDGQimenOre = API;
  if (typeof module !== 'undefined') module.exports = API;
})();
