/* plumblossom.js — 梅花易數 sul seme di prezzo, per la PWA di trading.
 *
 * Versione base decisa con Edu il 07/08/2026 (senza influenza stagionale, che nei
 * backtest di quel giorno non ha aggiunto valore). Riproduce la lettura verificata
 * in pb_v1.js / pb_v2.js del motore di ricerca.
 *
 * Costruzione dell'esagramma dal seme (le stesse 3 cifre del DLR, 2 se il cross < 1):
 *   superiore     = floor(seme/8) mod 8   (resto 0 -> 8)
 *   inferiore     = seme mod 8            (resto 0 -> 8)
 *   linea mutante = (superiore + inferiore + numero del ramo del giorno) mod 6  (0 -> 6)
 *                   numero del ramo del giorno: 子=1 … 亥=12
 *   Yong = il trigramma che contiene la linea mutante (posizioni 1-3 = inferiore, 4-6 = superiore)
 *   Trend (Yi, "corpo") = l'altro trigramma
 *   Yong si muove: capovolgendo la linea mutante il Yong diventa il trigramma trasformato.
 *
 * Verdetto (relazione Cinque Elementi fra Trend e Yong TRASFORMATO):
 *   il Trend riceve o domina o è pari  -> il trend prosegue
 *   il Trend cede energia o è dominato -> il trend inverte
 *     生我 Yong genera il Trend   -> prosegue
 *     我剋 il Trend controlla Yong -> prosegue
 *     比和 stesso elemento         -> prosegue
 *     我生 il Trend genera Yong    -> inverte
 *     剋我 Yong controlla il Trend -> inverte
 *
 * NOTA: la versione con Yong ORIGINALE (non trasformato) misura leggermente meglio
 * sul research set (z 1,49 vs 0,18). Qui si usa il Yong trasformato perché è la
 * lettura dottrinalmente corretta secondo Edu ("quando Yong si muove diventa un altro
 * trigramma, ed è quello il nuovo Yong"). Il verdetto per ciascun caso è comunque
 * ancora in fase di affinamento carta per carta.
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.XKDGPlumBlossom = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var B = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  // numerazione Xiantian (Fuxi)
  var TRIGRAM = {
    1: { name: '乾', pinyin: 'Qian', el: 'Metal', lines: '111' },
    2: { name: '兌', pinyin: 'Dui',  el: 'Metal', lines: '110' },
    3: { name: '離', pinyin: 'Li',   el: 'Fire',  lines: '101' },
    4: { name: '震', pinyin: 'Zhen', el: 'Wood',  lines: '100' },
    5: { name: '巽', pinyin: 'Xun',  el: 'Wood',  lines: '011' },
    6: { name: '坎', pinyin: 'Kan',  el: 'Water', lines: '010' },
    7: { name: '艮', pinyin: 'Gen',  el: 'Earth', lines: '001' },
    8: { name: '坤', pinyin: 'Kun',  el: 'Earth', lines: '000' }
  };
  var GEN  = { Wood:'Fire', Fire:'Earth', Earth:'Metal', Metal:'Water', Water:'Wood' };
  var CTRL = { Wood:'Earth', Earth:'Water', Water:'Fire', Fire:'Metal', Metal:'Wood' };
  var EL_IT = { Wood:'Legno', Fire:'Fuoco', Earth:'Terra', Metal:'Metallo', Water:'Acqua' };

  function mod8(n){ var r = n % 8; return r === 0 ? 8 : r; }
  function mod6(n){ var r = n % 6; return r === 0 ? 6 : r; }

  function numFromLines(s){
    for (var k in TRIGRAM) if (TRIGRAM[k].lines === s) return Number(k);
    return null;
  }
  // capovolge la linea locale (1=basso .. 3=alto) dentro un trigramma
  function flipLine(trigNum, localLine){
    var s = TRIGRAM[trigNum].lines.split('');
    var i = localLine - 1;
    s[i] = s[i] === '1' ? '0' : '1';
    return numFromLines(s.join(''));
  }

  // relazione dell'elemento A rispetto a B
  function relazione(elA, elB){
    if (elA === elB) return '比和';
    if (GEN[elB] === elA) return '生我';   // B genera A
    if (CTRL[elA] === elB) return '我剋';   // A controlla B
    if (GEN[elA] === elB) return '我生';   // A genera B
    if (CTRL[elB] === elA) return '剋我';   // B controlla A
    return '?';
  }

  var VERDETTO = {
    '生我': { prosegue: true,  testo: 'Yong genera il Trend → prosegue' },
    '我剋': { prosegue: true,  testo: 'il Trend controlla Yong → prosegue' },
    '比和': { prosegue: true,  testo: 'stesso elemento → prosegue' },
    '我生': { prosegue: false, testo: 'il Trend genera Yong → inverte' },
    '剋我': { prosegue: false, testo: 'Yong controlla il Trend → inverte' }
  };

  // seme intero, ramo del giorno (uno di B) -> lettura completa
  // nucleo del calcolo: dati superiore, inferiore e linea mutante (1..6) -> lettura completa
  function build(supNum, infNum, linea, extra){
    var yongOrigNum = linea <= 3 ? infNum : supNum;
    var trendNum    = linea <= 3 ? supNum : infNum;
    var localLine   = linea <= 3 ? linea : linea - 3;
    var yongTrasfNum = flipLine(yongOrigNum, localLine);

    var trend = TRIGRAM[trendNum], yongOrig = TRIGRAM[yongOrigNum], yongTrasf = TRIGRAM[yongTrasfNum];
    var rel = relazione(trend.el, yongTrasf.el);
    var v = VERDETTO[rel] || { prosegue: null, testo: '?' };

    // trasformato: la linea mutante (globale) capovolta
    var trSup = supNum, trInf = infNum;
    if (linea <= 3) trInf = flipLine(infNum, linea); else trSup = flipLine(supNum, linea - 3);
    // nucleare (互卦): linee dal basso 1→6 = inf.lines + sup.lines ; nucInf = 2-3-4, nucSup = 3-4-5
    var low6 = TRIGRAM[infNum].lines + TRIGRAM[supNum].lines;
    var nucInf = numFromLines(low6.charAt(1) + low6.charAt(2) + low6.charAt(3));
    var nucSup = numFromLines(low6.charAt(2) + low6.charAt(3) + low6.charAt(4));

    var out = {
      superiore: supNum, inferiore: infNum, linea: linea,
      trend: trend, yongOriginale: yongOrig, yongTrasformato: yongTrasf,
      relazione: rel, relazioneTesto: v.testo,
      prosegue: v.prosegue,
      original:  { sup: supNum, inf: infNum },
      mutual:    { sup: nucSup, inf: nucInf },
      transform: { sup: trSup,  inf: trInf },
      movingLine: linea,
      trendLabel: trend.name + ' ' + trend.pinyin + ' (' + EL_IT[trend.el] + ')',
      yongOrigLabel: yongOrig.name + ' ' + yongOrig.pinyin + ' (' + EL_IT[yongOrig.el] + ')',
      yongTrasfLabel: yongTrasf.name + ' ' + yongTrasf.pinyin + ' (' + EL_IT[yongTrasf.el] + ')'
    };
    if (extra) for (var k in extra) out[k] = extra[k];
    return out;
  }

  // dal seme di prezzo + ramo del giorno (modo automatico)
  function read(seed, dayBranch){
    seed = Math.abs(parseInt(seed, 10));
    if (!(seed > 0)) return { error: 'seme non valido' };
    var dayNum = B.indexOf(dayBranch) + 1;
    if (dayNum < 1) return { error: 'ramo del giorno non valido: ' + dayBranch };
    var supNum = mod8(Math.floor(seed / 8));
    var infNum = mod8(seed);
    var linea  = mod6(supNum + infNum + dayNum);
    return build(supNum, infNum, linea, { seed: seed, dayBranch: dayBranch, dayNum: dayNum });
  }

  // inserimento manuale: superiore, inferiore (1..8), linea mutante (1..6)
  function readManual(supNum, infNum, linea){
    supNum = parseInt(supNum, 10); infNum = parseInt(infNum, 10); linea = parseInt(linea, 10);
    if (!(supNum >= 1 && supNum <= 8)) return { error: 'superiore non valido' };
    if (!(infNum >= 1 && infNum <= 8)) return { error: 'inferiore non valido' };
    if (!(linea >= 1 && linea <= 6)) return { error: 'linea mutante non valida' };
    return build(supNum, infNum, linea, { manual: true });
  }

  // sei linee dal basso (1) all'alto (6) di un esagramma {sup, inf}
  function hexLinesLowFirst(hx){
    return (TRIGRAM[hx.inf].lines + TRIGRAM[hx.sup].lines).split('');  // '1'=yang intera, '0'=yin spezzata
  }

  return { read: read, readManual: readManual, TRIGRAM: TRIGRAM, hexLinesLowFirst: hexLinesLowFirst };
}));
