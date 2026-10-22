// leggo_io.js — LEGGO IO (S59, 22/10/2026). Edu: "Leggo io dovrebbe scannerizzare tutti i metodi, uno per uno e giungere
// ad una conclusione sensata. Rendilo il metodo che usa tutti gli altri."
// Passa in rassegna ogni voce della carta, dice cosa indica e quanto e' affidabile, mette i pro e i contro da una
// parte e dall'altra e conclude. Il peso di ogni voce e' la sua affidabilita' misurata sul 2022-23 su carte che non
// aveva visto (le voci per forma con i cataloghi costruiti solo sul 2020-21): peso = ln(p / (1 - p)), zero se non
// supera il 50%. La "lettura della carta" (il motore di lettura, gia' chiamato Leggo io / Lettura S47) e' una delle voci.
// Misura (22/10/2026, leggoio2.js): 2022-23 61,1% su 1.019; 2024-26 (mai viste) 58,9% su 1.496, +18.918 pip;
// dal vivo 29/09-22/10 con cataloghi fino al 28/09: 52,0% su 100.
// Uso: LeggoIo.leggi({ PB, LY, AT, DLR, LETT, MT, CM, D, LYF, PBF, DLRF }) -> { dir, margine, forza, pro, contro, racconto }
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LeggoIo = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // affidabilita' misurata (2022-23, carte mai viste dalle voci per forma) e nome della voce
  var VOCI = [
    ['DLR',  'Da Liu Ren',                60.2],
    ['PBF',  'sistema PB per forma',      59.1],
    ['AT',   'sistema attuale',           57.0],
    ['LY',   'Liu Yao',                   56.8],
    ['CM',   'colpo del mese',            56.8],
    ['MT',   'metodo del trend',          54.2],
    ['PB',   'Plum Blossom',              53.7],
    ['LYF',  'sistema LY per forma',      52.8],
    ['D',    'sistema D',                 52.0],
    ['LETT', 'lettura della carta',       51.7],
    ['DLRF', 'sistema DLR per forma',     51.0]
  ];
  function peso(p) { p = p / 100; return p > 0.5 ? Math.log(p / (1 - p)) : 0; }
  var it = function (x) { return (Math.round(x * 100) / 100).toString().replace('.', ','); };
  function leggi(v) {
    var somma = 0, perL = [], perS = [], tacciono = [];
    VOCI.forEach(function (q) {
      var k = q[0], d = v[k], w = peso(q[2]);
      if (d !== 'LONG' && d !== 'SHORT') { tacciono.push(q[1]); return; }
      var r = q[1] + ' (' + it(q[2]) + '%, peso ' + it(w) + ')';
      if (d === 'LONG') { somma += w; perL.push(r); } else { somma -= w; perS.push(r); }
    });
    var dir = somma > 0 ? 'LONG' : somma < 0 ? 'SHORT' : null, m = Math.abs(somma);
    var forza = !dir ? null : m >= 0.6 ? 'forte' : m >= 0.25 ? 'media' : 'debole';
    var pro = dir === 'LONG' ? perL : dir === 'SHORT' ? perS : [], contro = dir === 'LONG' ? perS : dir === 'SHORT' ? perL : [];
    var racconto = 'Per LONG: ' + (perL.join(', ') || 'nessuno') + ' · Per SHORT: ' + (perS.join(', ') || 'nessuno') +
      (tacciono.length ? ' · Tacciono: ' + tacciono.join(', ') : '') +
      ' · Conclusione: ' + (dir ? dir + ' (margine ' + it(m) + ', ' + forza + ')' : 'le due parti si equivalgono: fermo');
    return { dir: dir, margine: Math.round(m * 100) / 100, forza: forza, pro: pro, contro: contro, racconto: racconto };
  }
  return { leggi: leggi, voci: VOCI, peso: peso };
}));
