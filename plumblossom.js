/* plumblossom.js — 梅花易數 sul seme di prezzo, per la PWA di trading.
 *
 * Versione dell'08/08/2026, decisa con Edu. Riproduce pb_v8.js del motore di ricerca
 * (research set 2020-01-01 → 2024-05-31: +8.899 pip, z 2,08, contro +6.223 della
 * sola relazione). Sostituisce la versione del 07/08/2026, che leggeva il Yong
 * TRASFORMATO e non aveva la regola del clash del palazzo.
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
 * Verdetto di base (relazione Cinque Elementi fra Trend e Yong ORIGINALE):
 *   il Trend riceve o domina o è pari  -> il trend prosegue
 *   il Trend cede energia o è dominato -> il trend inverte
 *     生我 Yong genera il Trend   -> prosegue
 *     我剋 il Trend controlla Yong -> prosegue
 *     比和 stesso elemento         -> prosegue
 *     我生 il Trend genera Yong    -> inverte
 *     剋我 Yong controlla il Trend -> inverte
 *
 *   比和 stesso elemento -> NO TRADE (non si legge)
 *
 * REGOLA DEL CLASH DEL PALAZZO (Edu, 08/08/2026 — da EURJPY 15/03/2023):
 *   Il Trend occupa un palazzo nel Houtian, a cui corrispondono uno o due rami:
 *     乾 戌亥 · 兌 酉 · 離 午 · 震 卯 · 巽 辰巳 · 坎 子 · 艮 丑寅 · 坤 未申
 *   Se i rami sono due, l'ORA RICAVATA DAL SEME sceglie quello attivo per yin/yang
 *   (rami yang 子寅辰午申戌, rami yin 丑卯巳未酉亥).
 *   Fra i rami del Bazi (anno, mese, giorno):
 *     - COMBINAZIONE 六合: due rami che si combinano si legano fra loro e non fanno
 *       niente, né attaccano né difendono. Si appaiano uno a uno.
 *     - PONTE: un attaccante che genera un altro ramo del Bazi, il quale a sua volta
 *       genera il Trend, non colpisce: il suo qi arriva al Trend come nutrimento.
 *       Se il ponte è il Tai Sui (ramo dell'anno) porta il doppio.
 *     - ATTACCANTI: i rami che clashano il palazzo attivo del Trend.
 *     - DIFENSORI: i rami dello stesso elemento del Trend.
 *   Ogni ramo pesa secondo il suo stato stagionale rispetto all'elemento del mese
 *   (旺 4 · 相 3 · 休 2 · 囚 1 · 死 0); il Tai Sui vale il doppio.
 *   Se gli attaccanti superano i difensori il Trend è spazzato via e il verdetto è
 *   INVERTE. Mai il contrario: un Trend spazzato via non può proseguire.
 *
 * NON implementato, provato e scartato l'08/08/2026: il clash che "eccita" invece di
 * spazzare quando l'elemento del Trend è 旺 o 相 (costava 1.007 pip).
 *
 * Il Yong trasformato resta calcolato e disegnato, ma NON entra più nel verdetto.
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
  var BR_IT = { '子':'Zi (Topo)','丑':'Chou (Bufalo)','寅':'Yin (Tigre)','卯':'Mao (Coniglio)',
                '辰':'Chen (Drago)','巳':'Si (Serpente)','午':'Wu (Cavallo)','未':'Wei (Capra)',
                '申':'Shen (Scimmia)','酉':'You (Gallo)','戌':'Xu (Cane)','亥':'Hai (Maiale)' };
  var WX = { '子':'Water','丑':'Earth','寅':'Wood','卯':'Wood','辰':'Earth','巳':'Fire',
             '午':'Fire','未':'Earth','申':'Metal','酉':'Metal','戌':'Earth','亥':'Water' };
  var HOUTIAN = { 1:['戌','亥'], 2:['酉'], 3:['午'], 4:['卯'], 5:['辰','巳'],
                  6:['子'], 7:['丑','寅'], 8:['未','申'] };
  var CLASH   = { '子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅',
                  '卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳' };
  var COMBINA = { '子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯',
                  '辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午' };
  var PUNTI = { '旺':4, '相':3, '休':2, '囚':1, '死':0 };
  var TAISUI = 2;   // il Tai Sui vale il doppio

  function stagione(el, seasonEl){
    if (el === seasonEl) return '旺';
    if (GEN[seasonEl] === el) return '相';
    if (GEN[el] === seasonEl) return '休';
    if (CTRL[seasonEl] === el) return '死';
    if (CTRL[el] === seasonEl) return '囚';
    return '休';
  }
  function seedToBranch(seed){ return B[(((seed - 1) % 12) + 12) % 12]; }

  /* Regola del clash del palazzo. Torna null se mancano i dati del Bazi. */
  function clashDelPalazzo(trendNum, trendEl, seed, monthBranch, dayBranch, yearBranch){
    if (!monthBranch || !dayBranch || !yearBranch) return null;
    if (!WX[monthBranch] || !WX[dayBranch] || !WX[yearBranch]) return null;
    var monthEl = WX[monthBranch];
    var oraBranch = seedToBranch(seed);

    var palazzo = HOUTIAN[trendNum].slice();
    if (palazzo.length === 2) {
      var oraYang = (B.indexOf(oraBranch) % 2) === 0;
      palazzo = palazzo.filter(function (b) { return ((B.indexOf(b) % 2) === 0) === oraYang; });
    }

    var bazi = [ { b: yearBranch, ts: true }, { b: monthBranch, ts: false }, { b: dayBranch, ts: false } ];

    // combinazione: si appaiano uno a uno, i legati escono di scena
    var combinati = [], usato = bazi.map(function () { return false; });
    for (var i = 0; i < bazi.length; i++) {
      if (usato[i]) continue;
      for (var j = i + 1; j < bazi.length; j++) {
        if (usato[j]) continue;
        if (COMBINA[bazi[i].b] === bazi[j].b) {
          usato[i] = true; usato[j] = true;
          combinati.push(BR_IT[bazi[i].b] + ' + ' + BR_IT[bazi[j].b]);
          break;
        }
      }
    }
    var liberi = bazi.filter(function (x, k) { return !usato[k]; });

    function peso(x){ return PUNTI[stagione(WX[x.b], monthEl)] * (x.ts ? TAISUI : 1); }

    var att = 0, dif = 0, attList = [], difList = [], ponteList = [];
    liberi.forEach(function (x) {
      var clasha = palazzo.some(function (pz) { return CLASH[pz] === x.b; });
      if (clasha) {
        var ponte = liberi.filter(function (y) {
          return y.b !== x.b && GEN[WX[x.b]] === WX[y.b] && GEN[WX[y.b]] === trendEl;
        })[0];
        var w = peso(x);
        if (ponte) {
          if (ponte.ts) w = w * TAISUI;
          dif += w;
          ponteList.push(BR_IT[x.b] + ' → ' + BR_IT[ponte.b] + ' (' + w + ')');
        } else {
          att += w;
          attList.push(BR_IT[x.b] + ' ' + stagione(WX[x.b], monthEl) + ' (' + w + ')');
        }
      } else if (WX[x.b] === trendEl) {
        var wd = peso(x); dif += wd;
        difList.push(BR_IT[x.b] + ' ' + stagione(WX[x.b], monthEl) + ' (' + wd + ')');
      }
    });

    return {
      oraBranch: oraBranch, oraLabel: BR_IT[oraBranch],
      palazzo: palazzo, palazzoLabel: palazzo.map(function (b) { return BR_IT[b]; }).join(' / '),
      combinazioni: combinati, attaccanti: attList, difensori: difList, ponti: ponteList,
      forzaAttacco: att, forzaDifesa: dif,
      spazzato: att > 0 && att > dif
    };
  }

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
    '比和': { prosegue: null,  testo: 'stesso elemento → NO TRADE' },
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
    var rel = relazione(trend.el, yongOrig.el);          // il verdetto usa il Yong ORIGINALE
    var v = VERDETTO[rel] || { prosegue: null, testo: '?' };

    // regola del clash del palazzo (solo in modo automatico, serve il Bazi)
    var bz = extra && extra.bazi ? extra.bazi : null;
    var clash = (bz && bz.seed)
      ? clashDelPalazzo(trendNum, trend.el, bz.seed, bz.monthBranch, bz.dayBranch, bz.yearBranch)
      : null;
    var prosegueFinale = v.prosegue;
    if (clash && clash.spazzato && prosegueFinale === true) prosegueFinale = false;

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
      prosegueBase: v.prosegue,
      prosegue: prosegueFinale,
      clash: clash,
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
  // seed, ramo del giorno, e (facoltativi) ramo del mese e ramo dell'anno per il clash
  function read(seed, dayBranch, monthBranch, yearBranch){
    seed = Math.abs(parseInt(seed, 10));
    if (!(seed > 0)) return { error: 'seme non valido' };
    var dayNum = B.indexOf(dayBranch) + 1;
    if (dayNum < 1) return { error: 'ramo del giorno non valido: ' + dayBranch };
    var supNum = mod8(Math.floor(seed / 8));
    var infNum = mod8(seed);
    var linea  = mod6(supNum + infNum + dayNum);
    return build(supNum, infNum, linea, {
      seed: seed, dayBranch: dayBranch, dayNum: dayNum,
      bazi: { seed: seed, dayBranch: dayBranch, monthBranch: monthBranch || null, yearBranch: yearBranch || null }
    });
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
