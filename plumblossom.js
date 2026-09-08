/* plumblossom.js — 梅花易數 sul seme di prezzo, per la PWA di trading.
 *
 * Versione dell'08/08/2026 (sera), decisa con Edu. Riproduce pb_v29.js del motore di
 * ricerca (research set 2020-01-01 → 2024-05-31: +12.207 pip, z 2,85, 52,43% su 3.544
 * carte, contro +8.101 della sola relazione). Sostituisce la versione del mattino, che
 * leggeva il palazzo con la polarita' dell'ora, trattava il pareggio come NO TRADE e
 * non aveva ne' le forze della data ne' il sostegno del Yong.
 *
 * Costruzione dell'esagramma dal seme (le stesse 3 cifre del DLR, 2 se il cross < 1):
 *   superiore     = floor(seme/8) mod 8   (resto 0 -> 8)
 *   inferiore     = seme mod 8            (resto 0 -> 8)
 *   linea mutante = (superiore + inferiore + numero del ramo del giorno) mod 6  (0 -> 6)
 *                   numero del ramo del giorno: Zi=1 … Hai=12
 *   Yong = il trigramma che contiene la linea mutante (posizioni 1-3 = inferiore, 4-6 = superiore)
 *   Trend (Yi, "corpo") = l'altro trigramma
 *   Yong si muove: capovolgendo la linea mutante il Yong diventa il trigramma trasformato.
 *
 * Verdetto di base (relazione fra Trend e Yong ORIGINALE, sui Cinque Elementi):
 *   生我 il Yong genera il Trend    -> segue il trend
 *   我剋 il Trend controlla il Yong -> segue il trend
 *   我生 il Trend genera il Yong    -> non segue il trend
 *   剋我 il Yong controlla il Trend -> non segue il trend
 *   比和 stesso elemento            -> pareggio, si scioglie leggendo il ramo del Yong (sotto)
 *
 * PAREGGIO 比和 sciolto sulla natura della linea (Edu, 08/08/2026):
 *   quando i due trigrammi sono dello stesso elemento la relazione e' in pareggio.
 *   Si legge allora il ramo del palazzo del Yong contro il Trend. Il ramo attivo, nei
 *   palazzi doppi, e' scelto dalla NATURA della linea mutante: intera = ramo yang,
 *   spezzata = ramo yin (rami yang Zi Yin Chen Wu Shen Xu, rami yin Chou Mao Si Wei You Hai).
 *   Se quel ramo genera il Trend o e' controllato dal Trend -> segue; se lo genera o lo
 *   controlla il Trend -> non segue; se e' dello stesso elemento -> resta pareggio, NO TRADE.
 *   (Provati altri quattro selettori l'08/08/2026: la natura misurava il meglio.)
 *
 * REGOLA DEL CLASH DEL PALAZZO (Edu, 08/08/2026 — da EURJPY 15/03/2023):
 *   Il Trend occupa un palazzo nel Houtian, a cui corrispondono uno o due rami:
 *     Qian Xu Hai · Dui You · Li Wu · Zhen Mao · Xun Chen Si · Kan Zi · Gen Chou Yin · Kun Wei Shen
 *   Se i rami sono due, l'ORA RICAVATA DAL SEME sceglie quello attivo per polarita'.
 *   Se l'ORA e' VUOTA (旬空 rispetto al pilastro del giorno) non sceglie: restano attivi
 *   entrambi i rami e il Trend e' esposto su due fronti.
 *   Fra i rami del Bazi (anno, mese, giorno):
 *     - COMBINAZIONE 六合: due rami che si combinano si legano e non fanno niente.
 *     - VUOTO: un ramo del Bazi che sia fra i due vuoti (旬空) del giorno non ha sostanza:
 *       non attacca e non difende (Edu, da USDJPY 13/12/2023).
 *     - PONTE (sul clash): un attaccante che genera un altro ramo che a sua volta genera
 *       il Trend non colpisce: arriva come nutrimento. Il Tai Sui porta il doppio.
 *     - ATTACCANTI: i rami che clashano il palazzo attivo del Trend.
 *     - DIFENSORI: i rami dello stesso elemento del Trend.
 *   Ogni ramo vale uno, il Tai Sui due. Se gli attaccanti superano i difensori il Trend
 *   e' spazzato via e il verdetto e' "non segue". Mai il contrario.
 *
 * FORZE DENTRO LA DATA (Edu, 08/08/2026 — da USDJPY 06/09/2022):
 *   fra i rami vivi del Bazi, due che si clashano si combattono. Il Tai Sui vince sempre
 *   il suo clash; altrimenti vince chi ha piu' alleati (rami dello stesso elemento) nel
 *   Bazi, e a pari alleati restano entrambi a meta'. Il perdente cala a meta' forza, e
 *   con meta' forza difende e sostiene.
 *
 * SOSTEGNO DEL YONG INDEBOLITO (Edu, 08/08/2026 — da USDJPY 06/09/2022):
 *   quando il Yong controlla il Trend (剋我), se il ramo del Bazi che sostiene il Yong —
 *   un ramo del suo stesso elemento — ha perso un clash dentro la data ed e' a meta'
 *   forza, il controllo del Yong non ha appoggio e non passa: il Trend segue.
 *
 * PONTE SULLA RELAZIONE (Edu, 08/08/2026 — da EURJPY 07/12/2023):
 *   quando il Yong controlla il Trend, se fra i rami vivi c'e' il Tai Sui che il Yong
 *   genera e che a sua volta genera il Trend, il controllo passa dentro quel ramo e
 *   diventa nutrimento: il Trend segue.
 *
 * AUTOPENALITA' (Edu, 08/08/2026): se un ramo del palazzo del Trend e' fra Chen Wu You Hai
 *   e compare due o piu' volte nel Bazi, il Trend e' guasto e non segue.
 *
 * Provati e scartati l'08/08/2026 (non implementati): blocco per combinazione dei palazzi,
 * ponte del palazzo del Yong, scarico del Yong nel proprio palazzo, ponte sulla relazione
 * su rami non-Tai-Sui, forze decise dalla stagione, clash che "eccita" il Trend forte.
 *
 * Il Yong trasformato resta calcolato e disegnato, ma NON entra nel verdetto.
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.XKDGPlumBlossom = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var B = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
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
  var TAISUI = 2;
  // NA YIN dell'esagramma iniziale (XKDG, Edu 10/08/2026): '(sup)-(inf)' in Fuxi -> elemento.
  // Dal software XKDG: esagramma di Re Wen -> jiazi -> Na Yin. Verificata su Wei Ji=甲申
  // Acqua, Ji Ji=甲寅 Acqua, Meng=庚申 Legno e sugli otto esagrammi puri.
  var NAYIN_ESAGRAMMA = {
    '1-1':'Metal', '1-2':'Wood', '1-3':'Metal', '1-4':'Fire', '1-5':'Metal', '1-6':'Earth', '1-7':'Water', '1-8':'Metal',
    '2-1':'Water', '2-2':'Earth', '2-3':'Wood', '2-4':'Water', '2-5':'Water', '2-6':'Wood', '2-7':'Fire', '2-8':'Water',
    '3-1':'Metal', '3-2':'Fire', '3-3':'Wood', '3-4':'Metal', '3-5':'Fire', '3-6':'Water', '3-7':'Earth', '3-8':'Fire',
    '4-1':'Wood', '4-2':'Metal', '4-3':'Earth', '4-4':'Wood', '4-5':'Earth', '4-6':'Fire', '4-7':'Wood', '4-8':'Earth',
    '5-1':'Earth', '5-2':'Wood', '5-3':'Fire', '5-4':'Earth', '5-5':'Wood', '5-6':'Earth', '5-7':'Metal', '5-8':'Wood',
    '6-1':'Fire', '6-2':'Earth', '6-3':'Water', '6-4':'Fire', '6-5':'Metal', '6-6':'Wood', '6-7':'Fire', '6-8':'Metal',
    '7-1':'Water', '7-2':'Fire', '7-3':'Wood', '7-4':'Water', '7-5':'Water', '7-6':'Wood', '7-7':'Earth', '7-8':'Water',
    '8-1':'Metal', '8-2':'Water', '8-3':'Earth', '8-4':'Metal', '8-5':'Fire', '8-6':'Metal', '8-7':'Wood', '8-8':'Metal'
  };
  // stato stagionale di un elemento rispetto all'elemento del mese (cinque stadi)
  function stagione(el, seasonEl){
    if (el === seasonEl) return '旺';
    if (GEN[seasonEl] === el) return '相';
    if (GEN[el] === seasonEl) return '休';
    if (CTRL[seasonEl] === el) return '死';
    if (CTRL[el] === seasonEl) return '囚';
    return '休';
  }
  var S10 = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  var AUTOPEN = ['辰','午','酉','亥'];
  function seedToBranch(seed){ return B[(((seed - 1) % 12) + 12) % 12]; }
  function vuotiDi(stem, branch){
    var si = S10.indexOf(stem), bi = B.indexOf(branch);
    if (si < 0 || bi < 0) return [];
    var start = ((bi - si) % 12 + 12) % 12;
    return [ B[(start + 10) % 12], B[(start + 11) % 12] ];
  }
  function isYang(branch){ return (B.indexOf(branch) % 2) === 0; }

  /* Regola del clash del palazzo + forze della data. Torna null se manca il Bazi.
     via: relazione effettiva ('生我' '我剋' '我生' '剋我'); yongEl: elemento del Yong
     (nel pareggio, elemento del ramo del Yong letto contro il Trend). */
  function clashDelPalazzo(trendNum, trendEl, seed, monthBranch, dayBranch, yearBranch, dayStem, via, yongEl, segueBase){
    if (!monthBranch || !dayBranch || !yearBranch) return null;
    if (!WX[monthBranch] || !WX[dayBranch] || !WX[yearBranch]) return null;
    var oraBranch = seedToBranch(seed);

    var vuoti = dayStem ? vuotiDi(dayStem, dayBranch) : [];
    var oraVuota = vuoti.indexOf(oraBranch) >= 0;
    var palazzo = HOUTIAN[trendNum].slice();
    if (palazzo.length === 2 && !oraVuota) {
      var oraYang = isYang(oraBranch);
      palazzo = palazzo.filter(function (b) { return isYang(b) === oraYang; });
    }

    var tutti = [yearBranch, monthBranch, dayBranch];
    var autopen = palazzo.some(function (pz) {
      return AUTOPEN.indexOf(pz) >= 0 &&
             tutti.filter(function (b) { return b === pz; }).length >= 2;
    });

    var bazi = [ { b: yearBranch, ts: true }, { b: monthBranch, ts: false }, { b: dayBranch, ts: false } ];

    // combinazione 六合
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
    bazi = bazi.filter(function (x, k) { return !usato[k]; });

    // forze dentro la data
    bazi.forEach(function (x) { x.forza = 1; });
    var forzeList = [];
    for (var a = 0; a < bazi.length; a++) for (var b2 = a + 1; b2 < bazi.length; b2++) {
      if (CLASH[bazi[a].b] !== bazi[b2].b) continue;
      var vinc = a, pers = b2;
      if (bazi[b2].ts) { vinc = b2; pers = a; }
      else if (bazi[a].ts) { vinc = a; pers = b2; }
      else {
        var alleati = function (br) {
          return bazi.filter(function (y) { return WX[y.b] === WX[br]; }).length;
        };
        if (alleati(bazi[b2].b) > alleati(bazi[a].b)) { vinc = b2; pers = a; }
        else if (alleati(bazi[a].b) === alleati(bazi[b2].b)) {
          bazi[a].forza = Math.min(bazi[a].forza, 0.5);
          bazi[b2].forza = Math.min(bazi[b2].forza, 0.5);
          forzeList.push(BR_IT[bazi[a].b] + ' e ' + BR_IT[bazi[b2].b] + ' pari → entrambi a metà');
          continue;
        }
      }
      bazi[pers].forza = Math.min(bazi[pers].forza, 0.5);
      forzeList.push(BR_IT[bazi[vinc].b] + ' batte ' + BR_IT[bazi[pers].b] + ' → ' + BR_IT[bazi[pers].b] + ' a metà');
    }

    function peso(x){ return x.ts ? TAISUI : 1; }

    var att = 0, dif = 0, attList = [], difList = [], ponteList = [];
    bazi.forEach(function (x) {
      if (vuoti.indexOf(x.b) >= 0) return;   // ramo vuoto: non attacca, non difende
      var clasha = palazzo.some(function (pz) { return CLASH[pz] === x.b; });
      if (clasha) {
        var ponte = bazi.filter(function (y) {
          return y.b !== x.b &&
                 GEN[WX[x.b]] === WX[y.b] && GEN[WX[y.b]] === trendEl;
        })[0];
        var w = peso(x);
        if (ponte) {
          if (ponte.ts) w = w * TAISUI;
          dif += w;
          ponteList.push(BR_IT[x.b] + ' → ' + BR_IT[ponte.b] + ' (' + w + ')');
        } else {
          att += w;
          attList.push(BR_IT[x.b] + ' (' + w + ')');
        }
      } else if (WX[x.b] === trendEl) {
        var wd = peso(x) * (x.forza || 1); dif += wd;
        difList.push(BR_IT[x.b] + (x.forza < 1 ? ' (metà)' : '') + ' (' + wd + ')');
      }
    });

    var spazzato = att > 0 && att > dif;

    // sostegno del Yong indebolito: solo quando il Yong controlla il Trend (剋我 puro,
    // non nel pareggio). Il ramo di sostegno e' dello stesso elemento del Yong ORIGINALE.
    var sostegni = bazi.filter(function (x) { return WX[x.b] === yongEl; });
    var yongDebole = via === '剋我' && sostegni.length > 0 &&
      sostegni.every(function (x) { return x.forza <= 0.5; });

    // ponte sulla relazione (Tai Sui): su qualunque carta con verdetto di base "non segue",
    // se il Tai Sui e' generato dal Yong e a sua volta genera il Trend, il controllo passa.
    var attivi = bazi.filter(function (x) { return vuoti.indexOf(x.b) < 0; });
    var ponteRel = segueBase === false && attivi.some(function (x) {
      return x.ts && GEN[yongEl] === WX[x.b] && GEN[WX[x.b]] === trendEl;
    });

    return {
      oraBranch: oraBranch, oraLabel: BR_IT[oraBranch],
      vuoti: vuoti, vuotiLabel: vuoti.map(function (b) { return BR_IT[b]; }).join(' / '),
      oraVuota: oraVuota, autopenalita: autopen,
      palazzo: palazzo, palazzoLabel: palazzo.map(function (b) { return BR_IT[b]; }).join(' / '),
      combinazioni: combinati, forze: forzeList,
      attaccanti: attList, difensori: difList, ponti: ponteList,
      forzaAttacco: att, forzaDifesa: dif,
      spazzato: spazzato, yongDebole: yongDebole, ponteRel: ponteRel,
      guasto: autopen || spazzato,
      salvato: yongDebole || ponteRel
    };
  }

  function mod8(n){ var r = n % 8; return r === 0 ? 8 : r; }
  function mod6(n){ var r = n % 6; return r === 0 ? 6 : r; }

  function numFromLines(s){
    for (var k in TRIGRAM) if (TRIGRAM[k].lines === s) return Number(k);
    return null;
  }
  function flipLine(trigNum, localLine){
    var s = TRIGRAM[trigNum].lines.split('');
    var i = localLine - 1;
    s[i] = s[i] === '1' ? '0' : '1';
    return numFromLines(s.join(''));
  }

  function relazione(elA, elB){
    if (elA === elB) return '比和';
    if (GEN[elB] === elA) return '生我';
    if (CTRL[elA] === elB) return '我剋';
    if (GEN[elA] === elB) return '我生';
    if (CTRL[elB] === elA) return '剋我';
    return '?';
  }

  var VERDETTO = {
    '生我': { segue: true,  testo: 'il Yong genera il Trend → segue il trend' },
    '我剋': { segue: true,  testo: 'il Trend controlla il Yong → segue il trend' },
    '我生': { segue: false, testo: 'il Trend genera il Yong → non segue il trend' },
    '剋我': { segue: false, testo: 'il Yong controlla il Trend → non segue il trend' }
  };

  // ramo attivo del palazzo del Yong, scelto dalla NATURA della linea mutante
  function ramoYong(yongNum, linea){
    var palY = HOUTIAN[yongNum].slice();
    if (palY.length < 2) return palY[0] || null;
    var posInTrig = linea <= 3 ? linea : linea - 3;
    var lineaIntera = (((yongNum - 1) >> (3 - posInTrig)) & 1) === 0;  // Fuxi: 0 = intera
    var scelti = palY.filter(function (b) { return isYang(b) === lineaIntera; });
    return scelti[0] || palY[0];
  }

  function sciogliPareggio(trendEl, yongNum, linea){
    var ramo = ramoYong(yongNum, linea);
    if (!ramo) return { segue: null, testo: 'pareggio → NO TRADE', ramo: null };
    var pe = WX[ramo];
    var lab = BR_IT[ramo] + ' ' + EL_IT[pe];
    if (pe === trendEl)        return { segue: null,  testo: 'pareggio, ramo del Yong ' + lab + ' → NO TRADE', ramo: ramo };
    if (GEN[pe] === trendEl)   return { segue: true,  testo: 'pareggio sciolto: ' + lab + ' genera il Trend → segue', ramo: ramo };
    if (CTRL[trendEl] === pe)  return { segue: true,  testo: 'pareggio sciolto: il Trend controlla ' + lab + ' → segue', ramo: ramo };
    if (GEN[trendEl] === pe)   return { segue: false, testo: 'pareggio sciolto: il Trend genera ' + lab + ' → non segue', ramo: ramo };
    if (CTRL[pe] === trendEl)  return { segue: false, testo: 'pareggio sciolto: ' + lab + ' controlla il Trend → non segue', ramo: ramo };
    return { segue: null, testo: 'pareggio → NO TRADE', ramo: ramo };
  }

  function build(supNum, infNum, linea, extra){
    var yongOrigNum = linea <= 3 ? infNum : supNum;
    var trendNum    = linea <= 3 ? supNum : infNum;
    var localLine   = linea <= 3 ? linea : linea - 3;
    var yongTrasfNum = flipLine(yongOrigNum, localLine);

    var trend = TRIGRAM[trendNum], yongOrig = TRIGRAM[yongOrigNum], yongTrasf = TRIGRAM[yongTrasfNum];
    var rel = relazione(trend.el, yongOrig.el);

    var segueBase, relTesto, pareggio = null, viaClash = rel, yongElClash = yongOrig.el;
    if (rel === '比和') {
      pareggio = sciogliPareggio(trend.el, yongOrigNum, linea);
      segueBase = pareggio.segue;
      relTesto = pareggio.testo;
      // nel pareggio la via resta '比和': il sostegno del Yong (剋我 puro) non si applica
    } else {
      var v = VERDETTO[rel] || { segue: null, testo: '?' };
      segueBase = v.segue;
      relTesto = v.testo;
    }

    var bz = extra && extra.bazi ? extra.bazi : null;
    var clash = (bz && bz.seed && segueBase !== null)
      ? clashDelPalazzo(trendNum, trend.el, bz.seed, bz.monthBranch, bz.dayBranch,
                        bz.yearBranch, bz.dayStem, viaClash, yongElClash, segueBase)
      : null;

    var segueFinale = segueBase;
    if (clash) {
      if (clash.salvato) segueFinale = true;
      else if (clash.guasto && segueBase === true) segueFinale = false;
    }

    // RAFFORZAMENTO DEL YONG (Edu, 09/08/2026): quando la base dice "segue" (il Ti prevale)
    // ma il Yong esce RAFFORZATO dalla mutazione — caso 1 生我 (il trasformato genera il Yong)
    // o caso 5 比和 (stesso elemento) — il Yong si impone e il verdetto passa a "non segue".
    // Spento quando il trend EMA persiste da >=20 giorni: lì il trend forte va seguito.
    // RITIRATA in S41 (07/09/2026). Girava 485 verdetti e ne girava bene il 53,61%, quindi
    // come voce guadagnava 5.485 pip. Ma il Plum Blossom nel sistema serve da filtro, non da
    // voce: ogni verdetto girato lo faceva concordare col Liu Yao nel posto sbagliato.
    // Tolta: il sistema attuale sale da 58,57% a 58,97%, la scala da 37.823 a 38.381 pip.
    // Le 110 carte guida non cambiano di una (78 giuste, 32 storte).
    var rafforzato = false;

    // IL TI VUOTO (Edu, 09/08/2026 · RISCRITTA E ALLARGATA l'08/09/2026 dalla EURJPY
    // 21/10/2025, seme 175). Il palazzo del Ti vuoto (旬空) rende il Ti inagibile in
    // QUALSIASI relazione, non piu' soltanto nel pareggio 比和 → non segue.
    // Tre punti, tutti dettati da Edu l'08/09/2026:
    //  - nei palazzi a due rami il ramo attivo lo sceglie lo yin/yang del GIORNO (prima lo
    //    sceglieva la posizione della linea mutante);
    //  - il vuoto c'e' anche quando il ramo e' prospero di stagione: l'eccezione 旺不为空 qui
    //    non vale;
    //  - dal vuoto si esce solo col CLASH, che lo risveglia: dal giorno sempre, dall'anno
    //    solo se il ramo dell'anno e' 旺 o 相.
    var vuotoPareggio = false;
    if (clash && clash.vuoti && clash.vuoti.length && bz) {
      var palT = HOUTIAN[trendNum], ramoT;
      if (palT.length === 1) ramoT = palT[0];
      else { var giornoYangT = isYang(bz.dayBranch); ramoT = palT.filter(function (b) { return isYang(b) === giornoYangT; })[0]; }
      if (ramoT != null && clash.vuoti.indexOf(ramoT) >= 0) {
        var stagAnnoT = stagione(WX[bz.yearBranch], WX[bz.monthBranch]);
        var annoTimelyT = (stagAnnoT === '旺' || stagAnnoT === '相');
        var risvegliatoT = (CLASH[bz.dayBranch] === ramoT) ||
                           (CLASH[bz.yearBranch] === ramoT && annoTimelyT);
        if (!risvegliatoT) {
          vuotoPareggio = true;
          if (segueFinale === true) segueFinale = false;
        }
      }
    }

    // SOPRAFFAZIONE DEL TRASFORMATO (Edu, 09/08/2026): se "segue" ma il Yong TRASFORMATO
    // controlla il Ti (剋), il corpo è sopraffatto → non segue. Qualsiasi mutazione.
    // Due guardie (Edu, 10/08/2026), lette col FLUSSO DEL QI dei tre rami del Bazi
    // (catena generativa fra gli elementi presenti; capolinea = riceve e non cede):
    //  1. FLUSSO VERSO IL TI: se il qi della data converge sul Ti (capolinea = elemento
    //     del Ti, o un capolinea lo genera), il corpo è nutrito e regge → la
    //     sopraffazione non scatta.
    //  2. NA YIN DEL TI DEBOLE: se il Na Yin dell'esagramma iniziale è dello stesso
    //     elemento del Ti, il Ti è debole di stagione (死/囚) e il flusso non porta via
    //     dal Ti, il rinforzo del Na Yin tiene → la sopraffazione non scatta.
    var sopraffTrasf = (CTRL[yongTrasf.el] === trend.el);
    var flussoVersoTi = false, nayinSalva = false;
    if (sopraffTrasf && bz && bz.yearBranch && bz.monthBranch && bz.dayBranch) {
      // ALLARGATA AI QUATTRO PILASTRI (Edu, 08/09/2026, dalla EURJPY 28/11/2023 seme 162):
      // la catena del qi prende anche l'ORA. Coi tre rami soli quella carta dava il capolinea
      // sul Legno del Ti; con l'ora 巳 il capolinea passa al Fuoco e il Ti risulta drenato.
      var elsPres = [];
      var oraFlusso = clash ? clash.oraBranch : null;
      [bz.yearBranch, bz.monthBranch, bz.dayBranch, oraFlusso].forEach(function (b) {
        if (b && WX[b] && elsPres.indexOf(WX[b]) < 0) elsPres.push(WX[b]);
      });
      var fRiceve = function (e) { return elsPres.some(function (x) { return GEN[x] === e; }); };
      var fCede = function (e) { return elsPres.indexOf(GEN[e]) >= 0; };
      var capolinea = elsPres.filter(function (e) { return fRiceve(e) && !fCede(e); });
      var sorgenti = elsPres.filter(function (e) { return fCede(e) && !fRiceve(e); });
      flussoVersoTi = capolinea.indexOf(trend.el) >= 0 ||
        capolinea.some(function (e) { return GEN[e] === trend.el; });
      var flussoViaDalTi = sorgenti.indexOf(trend.el) >= 0 ||
        (fCede(trend.el) && !fRiceve(trend.el) && elsPres.indexOf(trend.el) < 0 && elsPres.indexOf(GEN[trend.el]) >= 0);
      var nayEl = NAYIN_ESAGRAMMA[supNum + '-' + infNum] || null;
      var tiStato = stagione(trend.el, WX[bz.monthBranch]);
      nayinSalva = nayEl === trend.el && (tiStato === '死' || tiStato === '囚') && !flussoViaDalTi;
    }
    var sopraffAttiva = sopraffTrasf && !flussoVersoTi && !nayinSalva;
    if (sopraffAttiva && segueFinale === true) segueFinale = false;

    // DRENAGGIO DEL TI (Edu, 09/08/2026): se il Ti genera il trasformato, il corpo si svuota
    // → non segue. Il cancello di forza sul Bazi (il trasformato sostenuto da almeno tre rami)
    // e' stato TOLTO in S41 (07/09/2026): scattava su 43 carte con i due periodi a 37% e 65%,
    // e valeva quindici pip sull'intero sistema. Adesso la regola guarda solo la relazione.
    var drenaggio = false;
    if (GEN[trend.el] === yongTrasf.el) {
      drenaggio = true; if (segueFinale === true) segueFinale = false;
    }

    // HU GUA — IL CONCORRENTE DEL TI (Edu, 07/09/2026, dalla USDJPY 17/09/2024 seme 140).
    // Quando il Yong muta in un trigramma dello STESSO elemento del Ti, il trasformato non e'
    // piu' un ospite: e' un concorrente. A decidere chi vince e' lo Hu Gua (互卦, l'esagramma
    // nucleare: linee 2-3-4 il trigramma inferiore, linee 3-4-5 il superiore). Il trigramma
    // dello Hu Gua dalla parte del Ti lo genera o no; quello dalla parte del Yong genera o no
    // il trasformato. Vince chi riceve il sostegno.
    var huGua = null;
    if (yongTrasf.el === trend.el) {
      var yinL = function (n, p) { return ((((n - 1) >> (3 - p)) & 1) === 1); };
      var trigDa = function (a, b, c) { return 1 + ((a ? 1 : 0) << 2) + ((b ? 1 : 0) << 1) + (c ? 1 : 0); };
      var Lg = [null, yinL(infNum, 1), yinL(infNum, 2), yinL(infNum, 3),
                      yinL(supNum, 1), yinL(supNum, 2), yinL(supNum, 3)];
      var huInf = TRIGRAM[trigDa(Lg[2], Lg[3], Lg[4])], huSup = TRIGRAM[trigDa(Lg[3], Lg[4], Lg[5])];
      var tiSopra = (linea <= 3);
      var huTi = tiSopra ? huSup : huInf, huYong = tiSopra ? huInf : huSup;
      var sostTi = (GEN[huTi.el] === trend.el), sostTrasf = (GEN[huYong.el] === yongTrasf.el);
      if (sostTrasf && !sostTi) { huGua = 'concorrente'; segueFinale = false; }
      else if (sostTi && !sostTrasf) { huGua = 'ti'; segueFinale = true; }
      // S43, regola di Edu (08/09/2026, dalla EURJPY 23/07/2024 seme 170): nel Plum Blossom
      // il ciclo di assistenza (stesso elemento) e' considerato POSITIVO, quindi vale come
      // sostegno e non solo la generazione. Qui trasformato e Ti sono dello stesso elemento
      // per definizione, quindi un nucleare di quell'elemento li sosterrebbe entrambi: Edu ha
      // stabilito che il sostegno va al Ti. Vale solo per il nucleare ATTIVO, quello che
      // contiene la linea mutante. Regola generale su tutti e cinque gli elementi.
      var huAttivo = (linea >= 2 && linea <= 4) ? huInf : ((linea >= 3 && linea <= 5) ? huSup : null);
      if (huAttivo && huAttivo.el === trend.el) { huGua = 'ti'; segueFinale = true; }
    }

    // RISCATTO DEL TRASFORMATO MORTO (Edu, 10/08/2026 — da USDJPY 31/07/2024):
    // base "non segue" per 我生 (il Ti si scarica nel Yong), ma il ramo attivo del
    // palazzo del Yong ORIGINALE — scelto dall'ORA per polarita', se l'ora non e'
    // vuota — e' l'elemento prospero del mese E controlla il trasformato, e il Na Yin
    // dell'esagramma iniziale rinfocola il Ti (stesso elemento): il trasformato nasce
    // morto (schiacciato in stagione, non nutrito: 土多金埋), il Ti rinfocolato regge
    // → il verdetto torna "segue".
    var riscatto = false;
    if (segueFinale === false && rel === '我生' && bz && clash && !clash.oraVuota) {
      var palYr = HOUTIAN[yongOrigNum];
      var ramoYr = palYr.length === 1 ? palYr[0]
                 : palYr.filter(function (b2) { return isYang(b2) === isYang(clash.oraBranch); })[0];
      if (ramoYr) {
        var weR = WX[ramoYr];
        var nayR = NAYIN_ESAGRAMMA[supNum + '-' + infNum] || null;
        if (weR === WX[bz.monthBranch] && CTRL[weR] === yongTrasf.el && nayR === trend.el) {
          riscatto = true;
          segueFinale = true;
        }
      }
    }

    // NO TRADE SUL CLASH GIORNO↔MESE (Edu, 10/08/2026): il clash e' effettivo solo col
    // perno sul giorno. Quando il ramo del giorno clasha il ramo del mese, la cornice
    // stagionale su cui poggiano tutte le letture di forza e' rotta: il sistema non ha
    // diritto di parola quel giorno → NO TRADE (il verdetto passa a null).
    var noTradeClash = false;
    if (bz && bz.dayBranch && bz.monthBranch && CLASH[bz.dayBranch] === bz.monthBranch) {
      noTradeClash = true;
      segueFinale = null;
      relTesto = 'clash giorno↔mese ' + bz.dayBranch + '↔' + bz.monthBranch + ' → NO TRADE';
    }

    var trSup = supNum, trInf = infNum;
    if (linea <= 3) trInf = flipLine(infNum, linea); else trSup = flipLine(supNum, linea - 3);
    var low6 = TRIGRAM[infNum].lines + TRIGRAM[supNum].lines;
    var nucInf = numFromLines(low6.charAt(1) + low6.charAt(2) + low6.charAt(3));
    var nucSup = numFromLines(low6.charAt(2) + low6.charAt(3) + low6.charAt(4));

    var out = {
      superiore: supNum, inferiore: infNum, linea: linea,
      trend: trend, yongOriginale: yongOrig, yongTrasformato: yongTrasf,
      relazione: rel, relazioneTesto: relTesto, pareggio: pareggio,
      segueBase: segueBase, segue: segueFinale, noTradeClash: noTradeClash, riscatto: riscatto, rafforzato: rafforzato, huGua: huGua, vuotoPareggio: vuotoPareggio, sopraffTrasf: sopraffTrasf, sopraffAttiva: sopraffAttiva, flussoVersoTi: flussoVersoTi, nayinSalva: nayinSalva, drenaggio: drenaggio,
      clash: clash,
      original:  { sup: supNum, inf: infNum },
      mutual:    { sup: nucSup, inf: nucInf },
      transform: { sup: trSup,  inf: trInf },
      movingLine: linea,
      trendLabel: trend.pinyin + ' (' + trend.el + ')',
      yongOrigLabel: yongOrig.pinyin + ' (' + yongOrig.el + ')',
      yongTrasfLabel: yongTrasf.pinyin + ' (' + yongTrasf.el + ')'
    };
    if (extra) for (var k in extra) out[k] = extra[k];
    return out;
  }

  function read(seed, dayBranch, monthBranch, yearBranch, dayStem, emaRun){
    seed = Math.abs(parseInt(seed, 10));
    if (!(seed > 0)) return { error: 'seme non valido' };
    var dayNum = B.indexOf(dayBranch) + 1;
    if (dayNum < 1) return { error: 'ramo del giorno non valido: ' + dayBranch };
    var supNum = mod8(Math.floor(seed / 8));
    var infNum = mod8(seed);
    var linea  = mod6(supNum + infNum + dayNum);
    return build(supNum, infNum, linea, {
      seed: seed, dayBranch: dayBranch, dayNum: dayNum,
      emaRun: (emaRun == null ? null : emaRun),
      bazi: { seed: seed, dayBranch: dayBranch, monthBranch: monthBranch || null,
              yearBranch: yearBranch || null, dayStem: dayStem || null }
    });
  }

  function readManual(supNum, infNum, linea){
    supNum = parseInt(supNum, 10); infNum = parseInt(infNum, 10); linea = parseInt(linea, 10);
    if (!(supNum >= 1 && supNum <= 8)) return { error: 'superiore non valido' };
    if (!(infNum >= 1 && infNum <= 8)) return { error: 'inferiore non valido' };
    if (!(linea >= 1 && linea <= 6)) return { error: 'linea mutante non valida' };
    return build(supNum, infNum, linea, { manual: true });
  }

  function hexLinesLowFirst(hx){
    return (TRIGRAM[hx.inf].lines + TRIGRAM[hx.sup].lines).split('');
  }

  return { read: read, readManual: readManual, TRIGRAM: TRIGRAM, hexLinesLowFirst: hexLinesLowFirst };
}));
