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

  // rami contenuti in un palazzo: i suoi, quello della porta e della stella (palazzo d'origine), i 六仪 degli steli (cielo e terra)
  function contiene(c, p) {
    var d = c.palaces[p], L = [], r = ramiPalazzo(c, p), k;
    r.proprio.split('').forEach(function (b) { L.push([b, 'nel palazzo']); });
    r.stella.split('').forEach(function (b) { L.push([b, 'nella stella ' + d.star]); });
    r.porta.split('').forEach(function (b) { L.push([b, 'nella porta ' + (d.doorName || d.door)]); });
    [d.tiH, d.ti2H, d.diH].forEach(function (s) { if (s && YIR[s]) L.push([YIR[s], 'in ' + s]); });
    return L;
  }
  // Edu 28/10/2026: lo stelo che sta con lo ZF (Commander) corrisponde a un'ora, e il suo ramo
  // sta nello stesso palazzo, o nel palazzo contrario (clash), o nel palazzo che genera lo ZF
  function oraCommander(c, gz) {
    var pc = palCommander(c); if (!pc) return null;
    var st = stemVisibile(gz), hb = gz[1], ps = palDi(c, st);
    var out = { ramo: hb, pilastro: gz, stelo: st, palCmd: pc, ecc: false, forma: null, motivo: '' };
    if (ps !== pc) return out;
    out.ecc = true;
    var i, L = contiene(c, pc);
    for (i = 0; i < L.length; i++) if (clash(hb, L[i][0])) { out.forma = 'opposta'; out.motivo = st + ' col Commander, ' + hb + ' clasha ' + L[i][0] + ' ' + L[i][1]; return out; }
    for (i = 0; i < L.length; i++) if (L[i][0] === hb) { out.forma = 'identica'; out.motivo = st + ' col Commander, ' + hb + ' ' + L[i][1]; return out; }
    for (var p = 1; p <= 9; p++) {
      if (p === 5 || p === pc || GEN[PEL[p]] !== PEL[pc]) continue;
      var M = contiene(c, p);
      for (i = 0; i < M.length; i++) if (M[i][0] === hb) { out.forma = 'genera'; out.motivo = st + ' col Commander, ' + hb + ' ' + M[i][1] + ' del palazzo ' + p + ', che genera lo ZF'; return out; }
    }
    out.forma = 'solo stelo'; out.motivo = st + ' col Commander';
    return out;
  }

  // Tipo di carta (Edu 28/10/2026): nel fan yin (stelle nel palazzo opposto) e nel fu yin (stelle a casa, tutto fermo:
  // il clash dell'ora rompe la stabilita') l'ora del Commander va CONTRO il trend; nelle altre carte il trend accelera.
  var OPP = { 1: 9, 9: 1, 2: 8, 8: 2, 3: 7, 7: 3, 4: 6, 6: 4 };
  function tipoCarta(c) { var fan = true, fu = true;
    for (var p = 1; p <= 9; p++) { if (p === 5) continue; var h = STARHOME[c.palaces[p].star]; if (h !== OPP[p]) fan = false; if (h !== p) fu = false; }
    return fan ? 'fan yin' : fu ? 'fu yin' : 'normale'; }
  function ore(c) { var ds = c.giorno[0], L = [], t = tipoCarta(c);
    // Edu 28/10/2026 (USDCAD 13/10): il mese che sta nel palazzo opposto al Commander lo rende molto untimely -> l'ora non accende niente
    var pc = palCommander(c), spento = !!(pc && PB[OPP[pc]] && PB[OPP[pc]].indexOf(c.mese[1]) >= 0);
    for (var i = 0; i < 12; i++) { var o = oraCommander(c, hourGZ(ds, BR[i]));
      if (o) { o.carta = t; o.spento = spento && t === 'normale'; o.verso = !o.ecc ? null : o.spento ? 'niente (mese opposto al Commander)' : (t === 'normale' ? 'trend' : 'contro il trend'); }
      L.push(o); }
    return L; }
  // barre GMT della giornata di trading (00..20) che cadono in ogni ramo: 子 23-01 -> solo 00
  function oreGMT(hb) { var i = BR.indexOf(hb); if (i === 0) return [0]; var h = [2 * i - 1, 2 * i]; return h.filter(function (x) { return x <= 20; }); }

  var API = { ore: ore, oraCommander: oraCommander, tipoCarta: tipoCarta, oreGMT: oreGMT, hourGZ: hourGZ };
  W.XKDGQimenOre = API;
  if (typeof module !== 'undefined') module.exports = API;
})();
