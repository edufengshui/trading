/* liuyao.js — 六爻 (Liu Yao) sulla stessa carta del Plum Blossom, per la PWA di trading.
 *
 * Il Liu Yao NON produce un verdetto autonomo (le versioni autonome LIUYAO=v1..v4 sono
 * state bocciate nel motore di ricerca). Nella PWA il pannello Liu Yao e' CORRETTIVO:
 * si legge sotto il Plum Blossom, per certificare o correggere il verdetto del PB.
 * Questo modulo produce percio' la LETTURA COMPLETA della carta (come il software di
 * riferimento di Edu, YijingWWG.html), non un segnale.
 *
 * Legge la STESSA carta del PB: stesso seme, stessa costruzione dell'esagramma
 *   superiore     = floor(seme/8) mod 8   (resto 0 -> 8)
 *   inferiore     = seme mod 8            (resto 0 -> 8)
 *   linea mutante = (superiore + inferiore + numero del ramo del giorno) mod 6  (0 -> 6)
 *
 * Contenuto della lettura (verificato contro il motore pb_stress.js e YijingWWG.html):
 *   - Na Jia: rami 地支 su ogni linea (interno NAJIA_IN, esterno NAJIA_OUT)
 *   - Palazzo di Jing Fang (京房) e suo elemento; Shi 世 (Soggetto) e Ying 應 (Ospite)
 *   - Sei parenti 六親 rispetto all'elemento del palazzo:
 *       兄弟 Fratelli (B) · 子孫 Figli (C) · 妻財 Ricchezza (W) · 官鬼 Ufficiale (G) · 父母 Genitori (P)
 *   - Sei Bestie 六獸 dallo stelo del giorno (甲乙 青龍 · 丙丁 朱雀 · 戊 勾陳 · 己 螣蛇 ·
 *       庚辛 白虎 · 壬癸 玄武), in ordine dalla linea 1 salendo
 *   - Nascosti 伏神: le funzioni assenti, prese dall'esagramma puro del palazzo, poste
 *       dietro la linea di pari posizione
 *   - Linea mutante: partenza (originale) -> arrivo (trasformato), caso di mutazione
 *       1 回頭生 · 2 泄 (partenza genera arrivo) · 3 回頭剋 · 4 partenza controlla arrivo ·
 *       5 比和 · 0 arrivo vuoto · -1 sospensione dal giorno · -2 legata dal nascosto ·
 *       -3 trigramma legato Qian<->Xun
 *   - Vuoti 旬空 della decade del giorno
 *   - Tai Sui 太歲: la linea col ramo dell'anno
 *   - Viaggio/atterraggio della mobile (六合 col ramo trasformato)
 *
 * Le leggi di forza (stagione del mese + sostegno del giorno) danno lo stato di ogni
 * linea: piena · mossa · rotta (日破) · dormiente · attiva (risvegliata dal clash) ·
 * eliminata · in movimento (動不為空).
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.XKDGLiuYao = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var B = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  var S10 = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  var TRIGRAM = {
    1: { name: '乾', pinyin: 'Qian', el: 'Metal' },
    2: { name: '兌', pinyin: 'Dui',  el: 'Metal' },
    3: { name: '離', pinyin: 'Li',   el: 'Fire'  },
    4: { name: '震', pinyin: 'Zhen', el: 'Wood'  },
    5: { name: '巽', pinyin: 'Xun',  el: 'Wood'  },
    6: { name: '坎', pinyin: 'Kan',  el: 'Water' },
    7: { name: '艮', pinyin: 'Gen',  el: 'Earth' },
    8: { name: '坤', pinyin: 'Kun',  el: 'Earth' }
  };
  var GEN  = { Wood:'Fire', Fire:'Earth', Earth:'Metal', Metal:'Water', Water:'Wood' };
  var CTRL = { Wood:'Earth', Earth:'Water', Water:'Fire', Fire:'Metal', Metal:'Wood' };
  var WX = { '子':'Water','丑':'Earth','寅':'Wood','卯':'Wood','辰':'Earth','巳':'Fire',
             '午':'Fire','未':'Earth','申':'Metal','酉':'Metal','戌':'Earth','亥':'Water' };
  var CLASH   = { '子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅',
                  '卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳' };
  var COMBINA = { '子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯',
                  '辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午' };
  // Palazzi Houtian (per via 19: gua inferiore interamente vuoto) — identici a pb_stress.js
  var HOUTIAN = { 1:['戌','亥'], 2:['酉'], 3:['午'], 4:['卯'], 5:['辰','巳'],
                  6:['子'], 7:['丑','寅'], 8:['未','申'] };
  // Elemento di STAGIONE (non del ramo): usato per la "doppia tempestività" nel termometro LY
  var SEASON = { '寅':'Wood','卯':'Wood','辰':'Wood','巳':'Fire','午':'Fire','未':'Fire',
                 '申':'Metal','酉':'Metal','戌':'Metal','亥':'Water','子':'Water','丑':'Water' };

  // Na Jia: rami del trigramma interno (linee 1-3) ed esterno (linee 4-6), per numero di trigramma.
  var NAJIA_IN  = {1:['子','寅','辰'],2:['巳','卯','丑'],3:['卯','丑','亥'],4:['子','寅','辰'],
                   5:['丑','亥','酉'],6:['寅','辰','午'],7:['辰','午','申'],8:['未','巳','卯']};
  var NAJIA_OUT = {1:['午','申','戌'],2:['亥','酉','未'],3:['酉','未','巳'],4:['午','申','戌'],
                   5:['未','巳','卯'],6:['申','戌','子'],7:['戌','子','寅'],8:['丑','亥','酉']};

  // etichette in italiano (i caratteri cinesi hanno sempre la traduzione accanto)
  var EL_IT = { Wood:'Legno', Fire:'Fuoco', Earth:'Terra', Metal:'Metallo', Water:'Acqua' };
  var BR_IT = { '子':'Zi','丑':'Chou','寅':'Yin','卯':'Mao','辰':'Chen','巳':'Si',
                '午':'Wu','未':'Wei','申':'Shen','酉':'You','戌':'Xu','亥':'Hai' };
  var PAR = {  // funzione -> {cn, it, en}
    B: { cn:'兄弟', it:'Fratelli', en:'Siblings' }, C: { cn:'子孫', it:'Figli', en:'Children' },
    W: { cn:'妻財', it:'Ricchezza', en:'Wealth' }, G: { cn:'官鬼', it:'Ufficiale', en:'Officer' },
    P: { cn:'父母', it:'Genitori', en:'Parents' } };
  var EL_EN = { Wood:'Wood', Fire:'Fire', Earth:'Earth', Metal:'Metal', Water:'Water' };
  // stato interno (usato dalle regole) -> etichetta inglese per l'interfaccia
  var STATO_EN = { piena:'full', mossa:'stirred', rotta:'broken', dormiente:'dormant', attiva:'awakened',
                   eliminata:'eliminated', 'in movimento':'moving', legata:'bound', liberata:'freed',
                   autocombinata:'self-combined' };
  // Sei Bestie 六獸 nell'ordine canonico
  var SEI_BESTIE = [
    { cn:'青龍', it:'Drago Azzurro', en:'Azure Dragon' }, { cn:'朱雀', it:'Uccello Rosso', en:'Red Bird' },
    { cn:'勾陳', it:'Gancio (Terra)', en:'Hook (Earth)' }, { cn:'螣蛇', it:'Serpente', en:'Snake' },
    { cn:'白虎', it:'Tigre Bianca', en:'White Tiger' }, { cn:'玄武', it:'Guerriero Nero', en:'Black Warrior' } ];
  // stelo del giorno -> indice della bestia sulla linea 1 (甲乙=0 … 壬癸=5)
  var BESTIA_START = { '甲':0,'乙':0,'丙':1,'丁':1,'戊':2,'己':3,'庚':4,'辛':4,'壬':5,'癸':5 };

  function mod8(n){ var r = ((n % 8) + 8) % 8; return r === 0 ? 8 : r; }
  function mod6(n){ var r = ((n % 6) + 6) % 6; return r === 0 ? 6 : r; }
  // polarita' della linea p (1..3) del trigramma n (1..8): true = intera (yang)
  function yangLine(n, p){ return ((((n - 1) >> (3 - p)) & 1) === 0); }
  function trigFromBits(b){ for (var n = 1; n <= 8; n++){
    if (yangLine(n,1)===b[0] && yangLine(n,2)===b[1] && yangLine(n,3)===b[2]) return n; } return null; }

  function stagione(el, seasonEl){
    if (!seasonEl) return null;
    if (el === seasonEl) return '旺';
    if (GEN[seasonEl] === el) return '相';
    if (GEN[el] === seasonEl) return '休';
    if (CTRL[seasonEl] === el) return '死';
    if (CTRL[el] === seasonEl) return '囚';
    return '休';
  }
  // i due rami vuoti (旬空) della decade del pilastro del giorno
  function vuotiDi(stem, branch){
    var si = S10.indexOf(stem), bi = B.indexOf(branch);
    if (si < 0 || bi < 0) return [];
    var start = (((bi - si) % 12) + 12) % 12;
    return [ B[(start + 10) % 12], B[(start + 11) % 12] ];
  }

  // palazzi di Jing Fang (con Shi/Ying) generati dalla sequenza canonica:
  //   puro s6 · 1a-5a linea gen. s1-s5 · 游魂 s4 · 歸魂 s3
  var PAL2 = null;
  function bitsKey(inf, sup){
    var s = '';
    for (var p = 1; p <= 3; p++) s += (yangLine(inf, p) ? '1' : '0');
    for (var q = 1; q <= 3; q++) s += (yangLine(sup, q) ? '1' : '0');
    return s;
  }
  function buildPalaces(){
    if (PAL2) return PAL2;
    PAL2 = {};
    var seq = [ {fl:[],shi:6},{fl:[1],shi:1},{fl:[1,2],shi:2},{fl:[1,2,3],shi:3},
                {fl:[1,2,3,4],shi:4},{fl:[1,2,3,4,5],shi:5},{fl:[1,2,3,5],shi:4},{fl:[5],shi:3} ];
    for (var P = 1; P <= 8; P++){
      var pure = bitsKey(P, P).split('');
      for (var i = 0; i < seq.length; i++){
        var g = seq[i], b2 = pure.slice();
        g.fl.forEach(function (L){ b2[L-1] = b2[L-1] === '1' ? '0' : '1'; });
        PAL2[b2.join('')] = { shi: g.shi, ying: g.shi > 3 ? g.shi - 3 : g.shi + 3, pal: P };
      }
    }
    return PAL2;
  }

  function build(supNum, infNum, linea, ctx){
    ctx = ctx || {};
    var dayBranch   = ctx.dayBranch || null;
    var monthBranch = ctx.monthBranch || null;
    var yearBranch  = ctx.yearBranch || null;
    var dayStem     = ctx.dayStem || null;
    var oraBranch   = ctx.oraBranch || null;
    var monthEl = monthBranch ? WX[monthBranch] : null;
    var vuoti   = (dayStem && dayBranch) ? vuotiDi(dayStem, dayBranch) : [];

    var PAL = buildPalaces();
    var pal = PAL[bitsKey(infNum, supNum)];
    var palNum = pal.pal, palEl = TRIGRAM[palNum].el;
    var ramoAl = function (p){ return p <= 3 ? NAJIA_IN[infNum][p-1] : NAJIA_OUT[supNum][p-4]; };
    // funzione (六親) di un elemento rispetto al palazzo
    var parDi = function (e){
      return e === palEl ? 'B' : GEN[palEl] === e ? 'C' : CTRL[palEl] === e ? 'W'
           : CTRL[e] === palEl ? 'G' : 'P'; };

    // presenti e nascosti (伏神): esagramma puro del palazzo per le funzioni mancanti
    var ramoPuro = function (p){ return p <= 3 ? NAJIA_IN[palNum][p-1] : NAJIA_OUT[palNum][p-4]; };
    var presenti = {};
    for (var p = 1; p <= 6; p++) presenti[parDi(WX[ramoAl(p)])] = true;
    var fushen = {};   // posizione -> {b, el, par}
    for (var q = 1; q <= 6; q++){ var bP = ramoPuro(q), fP = parDi(WX[bP]);
      if (!presenti[fP]) fushen[q] = { b: bP, el: WX[bP], par: fP }; }

    // ---- linea mutante: partenza (originale) -> arrivo (trasformato) ----
    var trigMob = linea <= 3 ? infNum : supNum;
    var pInTrig = linea <= 3 ? linea : linea - 3;
    var bb = [yangLine(trigMob,1), yangLine(trigMob,2), yangLine(trigMob,3)];
    bb[pInTrig-1] = !bb[pInTrig-1];
    var trigTrasf = trigFromBits(bb);
    var ramoDep = ramoAl(linea);
    var ramoArr = (linea <= 3 ? NAJIA_IN : NAJIA_OUT)[trigTrasf][pInTrig-1];
    var depEl = WX[ramoDep], arrEl = WX[ramoArr];

    var casoMut, effEl;
    if (GEN[arrEl] === depEl)       { effEl = depEl; casoMut = 1; }   // 回頭生
    else if (GEN[depEl] === arrEl)  { effEl = arrEl; casoMut = 2; }   // 泄 (partenza genera arrivo)
    else if (CTRL[arrEl] === depEl) {
      // 回頭剋 (corretto 13/08/2026, da GBPUSD 03/10/2022): l'arrivo CONTROLLA la partenza
      // e la abbatte — ma l'arrivo stesso e' vivo e AGISCE sulle altre linee. Non e'
      // un movimento inerte: muore la partenza, non il trasformato.
      effEl = (typeof process !== 'undefined' && process.env && process.env.RITORNO === 'nullo') ? null : arrEl; casoMut = 3; }
    else if (CTRL[depEl] === arrEl) { effEl = arrEl; casoMut = 4; }   // partenza controlla arrivo
    else {
      // 比和 stesso elemento: distingue 進神 (avanzante) e 退神 (retrocedente).
      // Coppie classiche in successione oraria: 寅→卯 巳→午 申→酉 亥→子 · Terra 丑→辰→未→戌
      effEl = depEl; casoMut = 5;
    }

    // 進神 / 退神 (Edu, 13/08/2026, da EURGBP 18/03/2020) — dottrina classica.
    // Quando una linea si muove in un'altra dello STESSO elemento: avanza se i due rami
    // sono in successione oraria, retrocede se in successione antioraria.
    var AVANZA = { '寅':'卯', '巳':'午', '申':'酉', '亥':'子',
                   '丑':'辰', '辰':'未', '未':'戌' };
    var RETRO  = { '卯':'寅', '午':'巳', '酉':'申', '子':'亥',
                   '戌':'未', '未':'辰', '辰':'丑' };
    var progressione = null;
    if (depEl === arrEl) {
      if (AVANZA[ramoDep] === ramoArr) progressione = 'avanzante';       // 進神
      else if (RETRO[ramoDep] === ramoArr) progressione = 'retrocedente'; // 退神
    }
    var motivoNullo = null;
    // IL GIORNO LIBERA LA MOBILE (Edu, 26/08/2026, da USDCAD 08/03/2023).
    // NOME CORRETTO (Edu, 26/08/2026): NON e' un "autoclash" — la linea non si clasha da sola:
    // e' il GIORNO che clasha l'ARRIVO. La mobile e' legata al proprio arrivo (自合: la partenza
    // combina 六合 l'arrivo); il giorno clasha (六冲) quell'arrivo, la combinazione si ROMPE e la
    // mobile e' LIBERATA. La linea si MUOVE ma NON si trasforma (l'arrivo e' rotto): resta se'
    // stessa e agisce con l'elemento di PARTENZA.
    // Guida: la G 午 di L4 si muove ma non puo' diventare P 未 perche' il giorno 丑 clasha 未.
    // ACCESA di default (Edu, 26/08/2026: tecnica confermata, non va cancellata).
    // Audit: GIORNOLIBERA=off ripristina il comportamento precedente (movimento nullo).
    var _giornoLibera = !(typeof process !== 'undefined' && process.env && process.env.GIORNOLIBERA === 'off')
        && (COMBINA[ramoDep] === ramoArr) && !!dayBranch && (CLASH[dayBranch] === ramoArr)
        && (vuoti.indexOf(ramoArr) < 0);
    // arrivo vuoto (旬空): movimento nullo (la mobile non e' mai vuota di suo, 動不為空)
    if (vuoti.indexOf(ramoArr) >= 0) { effEl = null; casoMut = 0;
      motivoNullo = 'arrival void'; }
    // sospensione dal giorno: il giorno COMBINA (六合) o CLASHA (六冲) partenza o arrivo.
    // FISSATA (Edu, 21/08/2026): se il GIORNO e' legato in 六合 dal MESE, la sua capacita'
    // di combinare/clashare e' gia' impegnata e NON sospende la mobile.
    // Audit: GIORNOLEGATO=off ripristina il comportamento precedente.
    var _glOff = (typeof process !== 'undefined' && process.env && process.env.GIORNOLEGATO === 'off');
    var _gioLegatoMese = !_glOff && !!(dayBranch && monthBranch && COMBINA[monthBranch] === dayBranch);
    var _sbOff = (typeof process !== 'undefined' && process.env && process.env.GIORNOSBLOCCO === 'off');
    var _sbloccata = !_sbOff && _sblocco;
    if (!_giornoLibera && !_sbloccata && !_gioLegatoMese && dayBranch && (COMBINA[dayBranch] === ramoDep || COMBINA[dayBranch] === ramoArr ||
        CLASH[dayBranch] === ramoDep || CLASH[dayBranch] === ramoArr)) {
      effEl = null; casoMut = -1;
      motivoNullo = 'suspended by the day (day combines/clashes departure or arrival)'; }
    // TOMBA NEL MESE + PENALITA' DAL GIORNO (Edu, 28/08/2026, guida USDJPY 23/07/2024 seme 156):
    // l'arrivo entra nella TOMBA (庫) del proprio elemento = il ramo del mese, E il GIORNO lo
    // penalizza (刑): la linea non si muove. Forma decisa dalla statistica al cablaggio:
    // MUTTOMBA=and (default) richiede entrambe; MUTTOMBA=or basta una; MUTTOMBA=off spegne.
    (function(){
      if (casoMut === 0 || casoMut === -1) return;
      var modo = (typeof process!=='undefined' && process.env && process.env.MUTTOMBA) || 'and';
      if (modo === 'off') return;
      var TOMB = {Fire:'戌', Water:'辰', Metal:'丑', Wood:'未'};
      var XING = {'寅':'巳','巳':'申','申':'寅','丑':'戌','戌':'未','未':'丑','子':'卯','卯':'子','辰':'辰','午':'午','酉':'酉','亥':'亥'};
      var inTomba = !!monthBranch && TOMB[WX[ramoArr]] === monthBranch;
      var penal = !!dayBranch && XING[dayBranch] === ramoArr;
      var scatta = (modo === 'or') ? (inTomba || penal) : (inTomba && penal);
      if (scatta) { effEl = null; casoMut = -4;
        motivoNullo = 'arrival in the month tomb' + (penal ? ' and punished by the day' : '') + ': the line does not move'; }
    })();
    // trigramma totalmente legato Qian<->Xun: tutte e tre le coppie ramo-controparte combinano
    var trigBloccato = null;
    (function (){
      var NJ = linea <= 3 ? NAJIA_IN : NAJIA_OUT;
      var tutte3 = true;
      for (var k = 0; k < 3; k++){ if (COMBINA[NJ[trigMob][k]] !== NJ[trigTrasf][k]) { tutte3 = false; break; } }
      if (tutte3 && dayBranch && CLASH[dayBranch] !== ramoDep && CLASH[dayBranch] !== ramoArr) {
        effEl = null; casoMut = -3; trigBloccato = linea <= 3 ? 'inf' : 'sup';
        motivoNullo = 'trigram bound Qian-Xun'; }
    })();
    // mutante legata dal proprio nascosto (伏神): partenza combina col nascosto sotto di se'
    var fuMob = fushen[linea] || null;
    if (fuMob && COMBINA[ramoDep] === fuMob.b && (!dayBranch || CLASH[dayBranch] !== fuMob.b)) {
      effEl = null; casoMut = -2;
      motivoNullo = 'bound by its own hidden line (' + fuMob.b + ')'; }
    // AUTOCOMBINAZIONE 自合 (Edu, 13/08/2026, da USDCAD 18/03/2020)
    // Se la PARTENZA della mobile combina (六合) il proprio ARRIVO, la linea si lega
    // a se stessa: e' bloccata, non e' piu' "in movimento" e non regge la lettura.
    // REVISIONE Edu 21/08/2026 (stessa carta): blocca solo se il rapporto elementale corre
    // ALL'INDIETRO (l'arrivo genera la partenza = torna indietro). Se e' la partenza a
    // generare l'arrivo, il movimento va avanti e non e' bloccato.
    // Attiva con AUTOCOMB9=indietro; senza flag resta il comportamento originale.
    var autoComb = (COMBINA[ramoDep] === ramoArr);
    if (autoComb && typeof process !== 'undefined' && process.env && process.env.AUTOCOMB9 === 'off') {
      autoComb = false;
    }
    if (autoComb && typeof process !== 'undefined' && process.env && process.env.AUTOCOMB9 === 'indietro') {
      autoComb = (GEN[WX[ramoArr]] === WX[ramoDep]);
    }
    // variante stretta: tolgo il blocco SOLO dove la partenza genera l'arrivo (avanti),
    // lasciando invariate le coppie di controllo, su cui Edu non si e' pronunciato.
    if (autoComb && typeof process !== 'undefined' && process.env && process.env.AUTOCOMB9 === 'soloavanti') {
      if (GEN[WX[ramoDep]] === WX[ramoArr]) autoComb = false;
    }
    if (_giornoLibera) autoComb = false;
    if (autoComb) { effEl = null; casoMut = -4;
      motivoNullo = 'self-combination (' + ramoDep + '+' + ramoArr + ')'; }
    // mobile liberata dal clash del giorno sull'arrivo: muove come se' stessa (elemento di
    // partenza), nessun prodotto di trasformazione.
    if (_giornoLibera) { effEl = depEl; casoMut = 6; motivoNullo = null; }

    // LA PARTENZA RESTA VIVA — generalizzazione (Edu, 30/08/2026): quando a subire e'
    // l'ARRIVO (vuoto, tomba nel mese, giorno che combina/clasha l'ARRIVO), a sparire e'
    // l'arrivo, NON la linea: la partenza resta attiva come SE' STESSA (elemento di
    // partenza, nessun prodotto di trasformazione). Quando invece e' la PARTENZA a essere
    // colpita (giorno su partenza, legata dal nascosto, autocombinazione) la linea non
    // parte e sparisce: quelle restano a movimento nullo. LINEAVIVA=si per accendere.
    if (typeof process!=='undefined' && process.env && process.env.LINEAVIVA==='si' && effEl===null) {
      var _colpaArrivo =
        (casoMut===0) ||                                             // arrivo vuoto
        (casoMut===-4) ||                                            // arrivo nella tomba del mese
        (casoMut===-1 && dayBranch &&
          (COMBINA[dayBranch]===ramoArr || CLASH[dayBranch]===ramoArr) &&
          !(COMBINA[dayBranch]===ramoDep || CLASH[dayBranch]===ramoDep)); // il giorno colpisce SOLO l'arrivo
      if (_colpaArrivo) { effEl = depEl; motivoNullo = null; }
    }

    // ARRIVO INCOMPATIBILE COL TRIGRAMMA FUTURO (Edu, 30/08/2026, da USDCHF 21/07/2021,
    // seme 92). DOTTRINA: se il ramo di arrivo clasha il ramo proprio del trigramma che
    // lo ospitera' DOPO la mutazione, la linea PARTE MA NON ARRIVA: laggiu' non c'e'
    // posto per lei. Il movimento non si compie. Cinque coppie, corpo unico, le stesse
    // di §109: 丑∈坤 · 卯∈兌 · 辰∈乾 · 午∈坎 · 申∈艮 (le speculari non valgono).
    // INCFUT=off per disattivarla.
    if (!(typeof process !== 'undefined' && process.env && process.env.INCFUT === 'off')) {
      var _PROPTRIG = {1:['戌','亥'],2:['酉'],3:['午'],4:['卯'],5:['辰','巳'],6:['子'],7:['丑','寅'],8:['未','申']};
      var _propB = null;
      if (_PROPTRIG[trigTrasf]) {
        for (var _q = 0; _q < _PROPTRIG[trigTrasf].length; _q++)
          if (_PROPTRIG[trigTrasf][_q] === CLASH[ramoArr]) _propB = _PROPTRIG[trigTrasf][_q];
      }
      // IL PONTE DELLA DATA (Edu, 30/08/2026, da USDJPY 30/04/2024, gemella della guida
      // USDCHF 21/07/2021): il ramo proprio del trigramma futuro CONTROLLA l'arrivo, ma se
      // l'elemento che sta IN MEZZO (generato dal primo e generatore del secondo) e' forte
      // nei rami della data, il controllo diventa generazione: l'arrivo VIVE dentro il
      // trigramma e la linea si muove davvero. Sulla gemella l'Acqua e' due volte nei rami
      // (giorno 子, ora 亥) e fa vivere 卯 dentro 兌; sulla guida l'Acqua non c'e' mai.
      var _ponteVivo = false;
      if (_propB && CTRL[WX[_propB]] === WX[ramoArr]) {
        var _bridge = GEN[WX[_propB]];
        if (GEN[_bridge] === WX[ramoArr]) {
          var _ramiData = [yearBranch, monthBranch, dayBranch, ctx.oraBranch];
          var _nB = 0;
          for (var _w = 0; _w < _ramiData.length; _w++)
            if (_ramiData[_w] && WX[_ramiData[_w]] === _bridge) _nB++;
          // steli del giorno e dell'ora (l'ora coi Cinque Ratti 五鼠遁 dallo stelo del giorno)
          // L'ACQUA SI CONTA TUTTA (Edu, 30/08/2026): rami della data PIU' gli steli del
          // giorno e dell'ora. PONTEMODO=rami per contare i soli rami (audit).
          if (!(typeof process!=='undefined' && process.env && process.env.PONTEMODO==='rami')) {
            var _SE5={'甲':'Wood','乙':'Wood','丙':'Fire','丁':'Fire','戊':'Earth','己':'Earth','庚':'Metal','辛':'Metal','壬':'Water','癸':'Water'};
            var _ST5=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
            var _BR5=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
            var _WUSHU5={'甲':'甲','己':'甲','乙':'丙','庚':'丙','丙':'戊','辛':'戊','丁':'庚','壬':'庚','戊':'壬','癸':'壬'};
            if (dayStem && _SE5[dayStem] === _bridge) _nB++;
            if (dayStem && ctx.oraBranch && _WUSHU5[dayStem]) {
              var _hi = _BR5.indexOf(ctx.oraBranch);
              if (_hi >= 0) {
                var _oraS = _ST5[(_ST5.indexOf(_WUSHU5[dayStem]) + _hi) % 10];
                if (_SE5[_oraS] === _bridge) _nB++;
              }
            }
          }
          var _soglia = (typeof process!=='undefined' && process.env && process.env.PONTE)
                        ? parseInt(process.env.PONTE,10) : 2;   // soglia 2 misurata la migliore
          if (_soglia > 0 && _nB >= _soglia) _ponteVivo = true;
        }
      }
      // L'ARRIVO RICEVE AUTOPENALITA' DAL GIORNO (Edu, 30/08/2026, da AUDUSD 23/11/2022,
      // seme 66): se l'arrivo e' uno dei quattro rami che si penalizzano da soli (自刑:
      // 辰午酉亥) e il GIORNO e' lo stesso ramo, l'arrivo e' punito e muore: la linea
      // parte ma non arriva. Stesso stato del caso -5. GIORNOAUTOPENA=off per spegnere.
      var _autoPenaArr = !(typeof process!=='undefined' && process.env && process.env.GIORNOAUTOPENA==='off') &&
          effEl !== null && dayBranch && dayBranch === ramoArr &&
          (ramoArr==='辰'||ramoArr==='午'||ramoArr==='酉'||ramoArr==='亥');
      if (!_ponteVivo && effEl !== null && (_autoPenaArr || (_PROPTRIG[trigTrasf] &&
          _PROPTRIG[trigTrasf].indexOf(CLASH[ramoArr]) >= 0))) {
        // LA PARTENZA RESTA VIVA (Edu, 30/08/2026): qui a subire e' l'ARRIVO — e' lui che
        // sparisce. La linea PARTE: resta a tutti gli effetti attiva e capace di produrre
        // effetti, come SE' STESSA (elemento di partenza, nessun prodotto di trasformazione).
        // Diverso dal non partire (combinata, clashata, penalizzata, sottomessa dalla bestia:
        // li' sparisce la LINEA). PARTENZAVIVA=off per tornare al movimento nullo pieno.
        casoMut = -5;
        // NON ARRIVA, QUINDI NON AVANZA: senza arrivo non c'e' 進神 ne' 退神.
        if (!(typeof process!=='undefined' && process.env && process.env.PROG5==='tieni'))
          progressione = null;
        if (typeof process!=='undefined' && process.env && process.env.PARTENZAVIVA==='off') {
          effEl = null;
          motivoNullo = 'arrival incompatible with the future trigram (' + ramoArr +
                        ' clashes ' + CLASH[ramoArr] + ', proper branch of the transformed trigram): departs but does not arrive';
        } else {
          effEl = depEl;
          // MISURATO: il ramo d'arrivo va LASCIATO visibile (58,75 contro 58,54 sostituendolo).
          // ARRSTESSO=si per l'audit che sostituisce anche il ramo.
          if (typeof process!=='undefined' && process.env && process.env.ARRSTESSO==='si') {
            ramoArr = ramoDep; arrEl = depEl;
          }
        }
      }
    }
    var movimentoNullo = (effEl === null);

    // viaggio/atterraggio della mobile: se l'arrivo COMBINA con un ramo presente, atterra.
    // DESTINAZIONE ROTTA (Edu, 23/08/2026, da EURJPY 11/08/2020, DEFINITIVA dottrinale):
    // se la linea di destinazione e' ROTTA dal giorno (clashata, non timely, ferma, non
    // vuota) la combinazione non si forma e l'atterraggio e' ANNULLATO.
    // ECCEZIONE (Edu, 23/08/2026, da GBPUSD 15/01/2021): se la destinazione e' CASA
    // DELL'ATTORE DEL CAPOLINEA (carica dal condotto, v. setCasaAttore) RESISTE al clash
    // del giorno e l'atterraggio VALE (carica 80,0% su 10; scarica fallisce 67,9% su 28).
    // Audit: ATTROTTAOFF=1 ripristina il comportamento precedente.
    var atterraggio = null;
    if (!movimentoNullo){
      var coinc = COMBINA[ramoArr];
      for (var a = 1; a <= 6; a++){ if (ramoAl(a) === coinc){
        var _arOff = (typeof process !== 'undefined' && process.env && process.env.ATTROTTAOFF === '1');
        var _destRotta = false;
        if (!_arOff && dayBranch && a !== linea && vuoti.indexOf(coinc) < 0 &&
            CLASH[dayBranch] === coinc && !_isCasaAttore(a)) {
          var _stD = stagione(WX[coinc], monthEl);
          if (_stD !== '旺' && _stD !== '相') _destRotta = true;
        }
        if (!_destRotta){
          atterraggio = { pos: a, ramo: coinc, dir: a <= 3 ? 'SHORT' : 'LONG' };
          // §94 (Edu, 24/08/2026, da USDJPY 10/03/2020): "si DEVE vedere chi ci
          // guadagna". Se il MOSSO (la linea di partenza) GENERA la destinazione,
          // si scarica caricandola e NON si impone: LA SQUADRA DELLA CARICATA PERDE
          // (verdetto ribaltato rispetto alla sede raggiunta). Misura sul perimetro:
          // sede raggiunta vince 44,3% (43,9/40,4) -> ribaltata 55,8%, coerente.
          // Audit: ATTGENOFF=1 ripristina il comportamento precedente.
          var _agOff = (typeof process !== 'undefined' && process.env && process.env.ATTGENOFF === '1');
          if (!_agOff && GEN[WX[ramoDep]] === WX[coinc]) {
            atterraggio.dir = (atterraggio.dir === 'LONG') ? 'SHORT' : 'LONG';
            atterraggio.caricata = true;   // la destinazione e' stata caricata dal mosso
          }
        }
        break; } }
    }

    // ---- SCALA MOBILE (Edu, 13/08/2026, da EURJPY 11/12/2023 / 噬嗑→无妄) ----
    // L'esagramma trasformato e' UNICO (nasce dalla mutante ufficiale). Una linea piena
    // clashata dal giorno si muove in 暗動: si SPOSTA dal primo al secondo esagramma senza
    // mutare -- il suo arrivo e' il ramo alla SUA posizione nell'esagramma trasformato.
    // Quell'arrivo agisce: puo' combinare, clashare o generare altre linee.
    // Il trigramma trasformato del lato della mutante e' trigTrasf; l'altro lato resta uguale.
    var ramoTrasfA = function (p) {
      if (linea <= 3) {   // muta il trigramma inferiore
        return p <= 3 ? NAJIA_IN[trigTrasf][p-1] : NAJIA_OUT[supNum][p-4];
      } else {            // muta il trigramma superiore
        return p <= 3 ? NAJIA_IN[infNum][p-1] : NAJIA_OUT[trigTrasf][p-4];
      }
    };
    // linee in 暗動: piene, non vuote, clashate effettivamente (regola 1: giorno sempre,
    // anno se 旺/相, mese solo potenzia) -- il loro arrivo nell'esagramma trasformato
    var _glMode = (typeof process !== 'undefined' && process.env) ? (process.env.GIORNOLEGATO || '') : '';
    var giornoLegatoDalMese = (_glMode !== 'off') && !!(dayBranch && monthBranch && COMBINA[monthBranch] === dayBranch);
    var _gioNoComb  = giornoLegatoDalMese;
    var _gioNoClash = giornoLegatoDalMese;
    var anDong = {};   // pos -> { arr }
    for (var ad = 1; ad <= 6; ad++) {
      if (ad === linea) continue;
      var brA = ramoAl(ad);
      if (vuoti.indexOf(brA) >= 0) continue;
      if (!clashSu(brA).eff) continue;
      anDong[ad] = { arr: ramoTrasfA(ad) };
    }
    // ATTERRAGGIO SU LINEA IN MOVIMENTO (Edu, 13/08/2026): se l'arrivo di una linea in
    // 暗動 COMBINA la partenza di una linea che GIA' si muove (la mutante), il bloccaggio
    // NON avviene: la combinazione la SALDA al movimento e la linea mossa VINCE.
    var scalaMobile = null;
    for (var sm in anDong) {
      if (COMBINA[anDong[sm].arr] === ramoDep) {
        scalaMobile = { da: parseInt(sm,10), arrDa: anDong[sm].arr, su: linea };
        break;
      }
    }

    // ---- Shi/Ying: validita' e trasformazione dall'arrivo della mutante ----
    var shiB = ramoAl(pal.shi), yingB = ramoAl(pal.ying);
    var shiElE = WX[shiB], yingElE = WX[yingB], shiValido = true, yingValido = true;
    if (COMBINA[ramoArr] === shiB)  shiElE = depEl;   // riceve la partenza e "diventa" quella linea
    if (COMBINA[ramoArr] === yingB) yingElE = depEl;
    if (CLASH[ramoArr] === shiB)  shiValido = false;  // invalidato dal clash dell'arrivo
    if (CLASH[ramoArr] === yingB) yingValido = false;

    // stato di forza di una linea (stagione del mese + clash del giorno / dell'arrivo)
    // ---- CLASH E COMBINAZIONE (Edu, 13/08/2026) ----
    // Il clash e' EFFETTIVO se viene dal GIORNO (sempre) o dall'ANNO (solo se il ramo
    // dell'anno e' in 旺/相). Il clash dal MESE non e' effettivo da solo, ma POTENZIA
    // gli altri due quando e' presente.
    // La COMBINAZIONE (六合) dal GIORNO agisce sempre come BLOCCANTE, su qualunque linea.
    var annoTimely = (function () {
      if (!yearBranch) return false;
      var s = stagione(WX[yearBranch], monthEl);
      return s === '旺' || s === '相';
    })();
    // IL GIORNO LEGATO DAL MESE (Edu, 21/08/2026, FISSATA) — vale anche sulle linee:
    // il giorno legato in 六合 dal mese non combina e non clasha nessuna linea.
    // Audit: GIORNOLEGATO=off ripristina il comportamento precedente.
    function clashSu(br) {
      var dayC   = !!(dayBranch   && CLASH[dayBranch]   === br) && !_gioNoClash;
      var yearC  = !!(yearBranch  && CLASH[yearBranch]  === br && annoTimely);
      var monthC = !!(monthBranch && CLASH[monthBranch] === br);
      var eff = dayC || yearC;
      return { eff: eff, dayC: dayC, yearC: yearC, monthC: monthC,
               potenza: eff ? ((dayC?1:0) + (yearC?1:0) + (monthC?1:0)) : 0 };
    }
    function legataDalGiorno(br) { return !!(dayBranch && COMBINA[dayBranch] === br) && !_gioNoComb; }

    // COMBINAZIONE E CLASH (Edu, 13/08/2026)
    // La combinazione (六合) dal GIORNO blocca sempre il ramo — MA protegge anche il ramo
    // da un clash diretto: per attaccarlo servono DUE clash, il primo rompe la
    // combinazione che lo protegge, il secondo colpisce.
    //   0 clash -> LEGATA (bloccata, fuori dai giochi)
    //   1 clash -> combinazione rotta, il ramo torna libero (non ancora colpito)
    //  >=2 clash -> combinazione rotta E ramo colpito
    function statoLin(br, isMoving){
      var st = stagione(WX[br], monthEl);
      var timely = (st === '旺' || st === '相');
      var cl = clashSu(br);
      var nCl = cl.potenza;                            // clash effettivi (col potenziamento del mese)
      if (legataDalGiorno(br)) {
        if (nCl === 0) return 'legata';                // bloccata dalla combinazione
        if (nCl === 1) return isMoving ? (autoComb ? 'autocombinata' : 'in movimento') : 'liberata';
        return timely ? 'mossa' : 'rotta';             // combo rotta e ramo colpito
      }
      if (isMoving) return autoComb ? 'autocombinata' : 'in movimento';   // 動不為空
      if (vuoti.indexOf(br) < 0){
        if (cl.eff) return timely ? 'mossa' : 'rotta';    // 日破 / 暗動
        return 'piena';
      }
      if (!cl.eff && CLASH[ramoArr] !== br) return 'dormiente';
      return timely ? 'attiva' : 'eliminata';
    }
    var fortLinea = function (br){
      var st1 = stagione(WX[br], monthEl);
      var st2 = monthBranch ? stagione(WX[br], SEASON[monthBranch]) : '—';  // doppia tempestività: 辰→Legno, 未→Fuoco, 戌→Metallo, 丑→Acqua
      if (st1 === '旺' || st1 === '相' || st2 === '旺' || st2 === '相') return true;
      if (!dayBranch) return false;
      var de = WX[dayBranch];
      return de === WX[br] || GEN[de] === WX[br];
    };

    // Sei Bestie: dallo stelo del giorno, dalla linea 1 salendo
    var startBestia = (dayStem != null && BESTIA_START[dayStem] != null) ? BESTIA_START[dayStem] : null;

    // stato ed efficacia di Shi e Ying: una linea legata, rotta, dormiente o eliminata
    // non sopravvive e non puo' reggere la lettura. Se cadono entrambe, la lettura
    // ripiega sul movimento della linea mobile.
    var shiStato  = statoLin(shiB,  pal.shi  === linea);
    var yingStato = statoLin(yingB, pal.ying === linea);
    var morta = function (s){ return s === 'legata' || s === 'rotta' ||
                                     s === 'dormiente' || s === 'eliminata' ||
                                     s === 'autocombinata'; };
    var shiEff  = shiValido  && !morta(shiStato);
    var yingEff = yingValido && !morta(yingStato);

    // ---- righe complete (posizione 1 in basso -> 6 in alto) ----
    // COMBINAZIONE DIREZIONALE COL CAPO NEL MESE (Edu, 26/08/2026): quando si forma una
    // combinazione DIREZIONALE 三會 (亥子丑 Acqua · 寅卯辰 Legno · 巳午未 Fuoco · 申酉戌 Metallo)
    // e il CAPO (il ramo CENTRALE: 子 · 卯 · 午 · 酉) e' il ramo del MESE, gli altri due membri
    // PERDONO LO STATUS che avevano e assumono l'ELEMENTO DEL MESE.
    // NOTA (Edu, 26/08/2026): NON e' il trigono 三合 (申子辰...) — quella era una lettura
    // sbagliata di Claude, corretta da Edu. Sono le TRE stagionali direzionali qui sopra.
    // La conversione avviene PRIMA delle vie: tutte le letture a valle vedono la nuova parentela.
    // Terzo membro ammesso da 伏神 o dai rami di data non vuoti.
    // Audit: TRIGCAPO=off ripristina il comportamento precedente.
    // CONDIZIONE DI TRIGRAMMA (Edu, 26/08/2026): le due laterali devono stare ENTRAMBE
    // NELLO STESSO TRIGRAMMA — entrambe fra L1-L3 (inferiore) o entrambe fra L4-L6 (superiore),
    // l'ordine non conta. Se una delle due manca dall'esagramma puo' venire dai rami di data
    // (giorno/mese/anno, non vuoti): in quel caso basta l'unica laterale presente nel trigramma.
    // Se le laterali sono divise fra i due trigrammi la combinazione NON si forma.
    // Se ENTRAMBI i trigrammi contengono la coppia, entrambi si convertono.
    // Si convertono solo le linee laterali del/dei trigramma/i che qualificano.
    var _trigCapo = null, _convPos = {}, _nHalf = 0;
    (function(){
      // ANNULLATA (Edu, 26/08/2026): falsificata da EURGBP 20/03/2026 (seme 86, sup 2, inf 6,
      // mutante L2). Li' la combinazione 寅卯辰 col capo nel mese 卯 e le due laterali 寅(L1) e
      // 辰(L2) nello stesso trigramma inferiore convertirebbe L2 da P a W -> SHORT; ma il mercato
      // sale, e il LONG si spiega solo con L2 辰 che RESTA P e, generata indietro (回頭生), fa
      // perdere la propria squadra. Nessun altro attore la spiega (imbuto completo).
      // Default SPENTA. Audit: TRIGCAPO=1 la riaccende.
      if (!(typeof process !== 'undefined' && process.env && process.env.TRIGCAPO === '1')) return;
      if (!monthBranch) return;
      var TRIG = [['亥','子','丑'],['寅','卯','辰'],['巳','午','未'],['申','酉','戌']];
      var dati = [yearBranch, monthBranch, dayBranch].filter(function(b){ return b && vuoti.indexOf(b)<0; });
      for (var t=0;t<TRIG.length;t++){
        var T = TRIG[t];
        if (T[1] !== monthBranch) continue;                    // il CAPO dev'essere il mese
        var lat = [T[0], T[2]];                                // le due laterali
        var trovato = false;
        for (var half=0; half<2; half++){                      // 0 = inferiore L1-3, 1 = superiore L4-6
          var lo = half*3 + 1, hi = half*3 + 3;
          var dentro = [], pos = [];
          for (var p=lo; p<=hi; p++){
            var b = ramoAl(p);
            if (lat.indexOf(b) >= 0 && dentro.indexOf(b) < 0) { dentro.push(b); }
            if (lat.indexOf(b) >= 0) pos.push(p);
            var fh = fushen[p];
            if (fh && lat.indexOf(fh.b) >= 0 && dentro.indexOf(fh.b) < 0) dentro.push(fh.b);
          }
          if (!dentro.length) continue;                        // nessuna laterale in questo trigramma
          // la coppia si completa dentro il trigramma, oppure la mancante viene dai rami di data
          var mancanti = lat.filter(function(b){ return dentro.indexOf(b)<0; });
          var ok = mancanti.every(function(b){ return dati.indexOf(b)>=0; });
          if (!ok) continue;
          trovato = true;
          _nHalf++;
          for (var k=0;k<pos.length;k++) _convPos[pos[k]] = true;
        }
        if (!trovato) continue;
        // PARITA' (Edu, 26/08/2026): se la coppia laterale compare in ENTRAMBI i trigrammi
        // (najia ripetuta), la conversione e' simmetrica: nessuna sede guadagna, la squadra
        // che prevale si trova IN ALTRO MODO. TRIGCAPO=singolo esclude questi casi.
        if (_nHalf > 1 && typeof process !== 'undefined' && process.env && process.env.TRIGCAPO === 'singolo') { _convPos = {}; continue; }
        _trigCapo = { tri: T, el: WX[T[1]], par: parDi(WX[T[1]]) };
        break;
      }
    })();
    var _convertita = function (pos){ return !!(_trigCapo && _convPos[pos]); };

    var linee = [];
    for (var pos = 1; pos <= 6; pos++){
      var ramo = ramoAl(pos), el = WX[ramo], par = parDi(el);
      if (_convertita(pos)) { el = _trigCapo.el; par = _trigCapo.par; }
      var yang = pos <= 3 ? yangLine(infNum, pos) : yangLine(supNum, pos - 3);
      var isMobile = (pos === linea);
      var mut = null;
      if (isMobile){
        mut = { ramoArr: ramoArr, elArr: arrEl, parArr: parDi(arrEl), casoMut: casoMut };
      }
      var fu = fushen[pos] || null;
      linee.push({
        pos: pos, ramo: ramo, ramoIt: BR_IT[ramo], el: el, elIt: EL_IT[el],
        yang: yang, par: par, parCn: PAR[par].cn, parIt: PAR[par].it,
        bestia: startBestia == null ? null : SEI_BESTIE[(startBestia + (pos - 1)) % 6],
        isShi: pos === pal.shi, isYing: pos === pal.ying, isMobile: isMobile,
        isTaiSui: yearBranch != null && ramo === yearBranch,
        vuoto: vuoti.indexOf(ramo) >= 0,
        stato: statoLin(ramo, isMobile),
        forte: fortLinea(ramo),
        fushen: fu ? { b: fu.b, ramoIt: BR_IT[fu.b], el: fu.el, elIt: EL_IT[fu.el],
                       par: fu.par, parCn: PAR[fu.par].cn, parIt: PAR[fu.par].it } : null,
        mut: mut
      });
    }

    var taiSuiPos = null;
    if (yearBranch != null) for (var t = 1; t <= 6; t++) if (ramoAl(t) === yearBranch) { taiSuiPos = t; break; }

    var CASO_LABEL = {
      1:'return-generation: the arrival generates the departure — departure strengthened',
      2:'drain: the departure generates the arrival — the arrival acts',
      3:'return-control: the arrival controls the departure — the departure dies, the arrival acts',
      4:'the departure controls the arrival — the arrival acts',
      5:'same element — departure strengthened',
      6:'the DAY clashes the arrival and breaks the mobile\'s bond with it — the mobile is freed: it moves untransformed (departure acts)',
      0:'null movement — ' + (motivoNullo || 'arrival void'),
      '-1':'null movement — ' + (motivoNullo || 'suspended by the day'),
      '-2':'null movement — ' + (motivoNullo || 'bound by the hidden line'),
      '-3':'null movement — ' + (motivoNullo || 'trigram bound Qian-Xun'),
      '-4':'null movement — ' + (motivoNullo || 'self-combination')
    };

    return {
      sup: supNum, inf: infNum, linea: linea,
      palNum: palNum, palName: TRIGRAM[palNum].name, palPinyin: TRIGRAM[palNum].pinyin,
      palEl: palEl, palElIt: EL_IT[palEl],
      shi: pal.shi, ying: pal.ying,
      dayBranch: dayBranch, monthBranch: monthBranch, yearBranch: yearBranch, dayStem: dayStem,
      oraBranch: oraBranch,
      monthEl: monthEl, vuoti: vuoti, taiSuiPos: taiSuiPos,
      linee: linee,
      shiB: shiB, yingB: yingB, shiElE: shiElE, yingElE: yingElE,
      shiValido: shiValido, yingValido: yingValido,
      shiForte: fortLinea(shiB), yingForte: fortLinea(yingB),
      shiStato: shiStato, yingStato: yingStato,
      shiEff: shiEff, yingEff: yingEff,
      shiClash: clashSu(shiB), yingClash: clashSu(yingB),
      shiLegato: legataDalGiorno(shiB), yingLegato: legataDalGiorno(yingB),
      ripiegoMobile: (!shiEff && !yingEff),
      anDong: anDong, scalaMobile: scalaMobile,
      mutante: {
        pos: linea, ramoDep: ramoDep, ramoArr: ramoArr, depEl: depEl, arrEl: arrEl,
        depElIt: EL_IT[depEl], arrElIt: EL_IT[arrEl],
        casoMut: casoMut, casoLabel: CASO_LABEL[casoMut] || '', effEl: effEl,
        progressione: progressione,
        movimentoNullo: movimentoNullo, motivoNullo: motivoNullo,
        trigBloccato: trigBloccato, trigTrasf: trigTrasf,
        trigTrasfName: TRIGRAM[trigTrasf].name, trigTrasfPinyin: TRIGRAM[trigTrasf].pinyin,
        atterraggio: atterraggio
      }
    };
  }

  // SBLOCCO DEL GIORNO (Edu, 22/08/2026) — §89 forma definitiva.
  // Quando il capolinea del flusso del Qi della data siede sulla linea mobile, la linea ha
  // forza sufficiente a vincere il blocco imposto dal giorno (combinazione o clash): si
  // muove come una linea normale e si legge col suo caso di mutazione in sede.
  // pb_stress.js decide carta per carta e comunica la decisione con setSblocco(true/false).
  // Audit: GIORNOSBLOCCO=off ignora del tutto l'interruttore (comportamento precedente).
  var _sblocco = false;
  function setSblocco(v){ _sblocco = !!v; }

  // CASA DELL'ATTORE DEL CAPOLINEA (Edu, 23/08/2026) — per l'eccezione alla §93.
  // Il chiamante che conosce la data completa (pb_stress.js o l'app) calcola la casa
  // dell'attore del capolinea del flusso del Qi e la comunica qui PRIMA di chiamare
  // read/readManual. Se null, vale la §93 senza eccezione.
  // AGGIORNAMENTO (Edu, 23/08/2026, da EURUSD 30/01/2025): se il terminale non e'
  // radicato si prende ANCHE lo step precedente -> il valore puo' essere un numero
  // (1-6) O un array di numeri (piu' case cariche).
  var _casaAttore = [];
  function setCasaAttore(p){
    if (p==null) { _casaAttore = []; return; }
    var arr = Array.isArray(p) ? p : [p];
    _casaAttore = arr.filter(function(x){ return x>=1 && x<=6; });
  }
  function _isCasaAttore(pos){ return _casaAttore.indexOf(pos) >= 0; }

  // l'ORA dal seme (come nel PB): quarto ramo che partecipa a combinazioni e raduni
  function oraDalSeme(seed){ return B[(((seed-1)%12)+12)%12]; }

  function read(seed, dayBranch, monthBranch, yearBranch, dayStem){
    seed = Math.abs(parseInt(seed, 10));
    if (!(seed > 0)) return { error: 'seme non valido' };
    var dayNum = B.indexOf(dayBranch) + 1;
    if (dayNum < 1) return { error: 'ramo del giorno non valido: ' + dayBranch };
    var supNum = mod8(Math.floor(seed / 8));
    var infNum = mod8(seed);
    var linea  = mod6(supNum + infNum + dayNum);
    return build(supNum, infNum, linea, {
      dayBranch: dayBranch, monthBranch: monthBranch || null,
      yearBranch: yearBranch || null, dayStem: dayStem || null,
      oraBranch: oraDalSeme(seed) });
  }

  function readManual(supNum, infNum, linea, dayBranch, monthBranch, yearBranch, dayStem, oraBranch){
    supNum = parseInt(supNum, 10); infNum = parseInt(infNum, 10); linea = parseInt(linea, 10);
    if (!(supNum >= 1 && supNum <= 8)) return { error: 'superiore non valido' };
    if (!(infNum >= 1 && infNum <= 8)) return { error: 'inferiore non valido' };
    if (!(linea >= 1 && linea <= 6)) return { error: 'linea mutante non valida' };
    return build(supNum, infNum, linea, {
      dayBranch: dayBranch || null, monthBranch: monthBranch || null,
      yearBranch: yearBranch || null, dayStem: dayStem || null,
      oraBranch: oraBranch || null });
  }

  // ==========================================================================================
  // TERMOMETRO LY — correttivo autonomo del Plum Blossom (Edu, 14→16/08/2026).
  // Porta in forma browser il blocco PBLY di pb_stress.js (storico-trading), riga per riga,
  // riorganizzato in "vie" indipendenti e accendibili/spegnibili dall'interfaccia. L'ORDINE
  // di valutazione è IDENTICO al motore di ricerca (prima risposta non nulla vince).
  // Parentele sempre coi codici: G Ufficiale · W Ricchezza · P Genitori · B Fratelli · C Figli.
  // ==========================================================================================

  // ==========================================================================================
  // FORCE MODEL (Edu, 17/08/2026) — strength score of every line, of the mobile's arrival and of
  // the gatherings. Doctrine fixed by Edu:
  //  Month: always, on every line — prosperous +2 · growing +1 · resting 0 · imprisoned −1 · dead −2.
  //         Earth is prosperous in the four Earth months AND the seasonal element is prosperous too.
  //  Day / Year: strong only on the FOCUS line (the line a rule is examining) — day: same element
  //         +1.5, generates +1, controls −1, clashes −1 (the clash FILLS a void line only if timely),
  //         combines: force unchanged, line bound. Year: same +1, generates +0.5, controls −0.5.
  //  Hour (from the seed): contributes to timeliness for 20% — same branch +0.4, same element +0.3,
  //         generates +0.2.
  //  Gathering: only a COMPLETE three (directional or triple), no half; not valid if one of the three
  //         is void; +2 to the element of the gathering.
  //  Void: −2, unless the element is prosperous of month (0).
  //  Mobile: departure gets the effect of the arrival — return-generation +1 · same element +0.5 ·
  //         return-control −2 · advancing +1 · retreating −1 · null movement → departure does not act.
  //  Hidden: force of its own element; a void host lets it out, a full host covers it (−1).
  //  Fixed lines feed each other only if ADJACENT and only if the mother (the giver) is timely; a
  //         timely child can also drain an untimely mother (−1 to the mother).
  // ==========================================================================================
  var STAGE_SCORE = { '旺':2, '相':1, '休':0, '囚':-1, '死':-2 };
  var STAGE_EN = { '旺':'prosperous', '相':'growing', '休':'resting', '囚':'imprisoned', '死':'dead' };
  var EARTH_MONTHS = ['辰','戌','丑','未'];
  function stadioMese(el, monthBranch){
    var s1 = stagione(el, WX[monthBranch]), s2 = stagione(el, SEASON[monthBranch]);
    if (el === 'Earth' && EARTH_MONTHS.indexOf(monthBranch) >= 0) return '旺';
    var v1 = STAGE_SCORE[s1] != null ? STAGE_SCORE[s1] : 0, v2 = STAGE_SCORE[s2] != null ? STAGE_SCORE[s2] : 0;
    return v1 >= v2 ? s1 : s2;   // the better of the month branch and the season
  }
  function forzaModello(R, ctx, focusPos){
    ctx = ctx || {};
    var Mo = R.monthBranch, D = R.dayBranch, Y = R.yearBranch, H = ctx.oraBranch || null;
    var HUI=[{r:['寅','卯','辰'],el:'Wood'},{r:['巳','午','未'],el:'Fire'},{r:['申','酉','戌'],el:'Metal'},{r:['亥','子','丑'],el:'Water'}];
    var HE =[{r:['寅','午','戌'],el:'Fire'},{r:['申','子','辰'],el:'Water'},{r:['巳','酉','丑'],el:'Metal'},{r:['亥','卯','未'],el:'Wood'}];
    // gatherings: fixed lines + arrival + day/month/year; none of the three void
    var pool = {}; R.linee.forEach(function(l){ pool[l.ramo]=true; });   // all six branches, departure of the mobile included
    if (!R.mutante.movimentoNullo) pool[R.mutante.ramoArr]=true;
    [D,Mo,Y].forEach(function(b){ if(b) pool[b]=true; });
    var raduni = HUI.concat(HE).filter(function(h){ return h.r.every(function(x){ return pool[x] && R.vuoti.indexOf(x)<0; }); });
    var radEl = {}; raduni.forEach(function(h){ radEl[h.el] = h; });

    function baseEl(el, isFocus, ramo){
      var st = stadioMese(el, Mo), s = STAGE_SCORE[st] || 0, det = [];
      det.push('month ' + STAGE_EN[st] + ' ' + (s>=0?'+':'') + s);
      if (isFocus) {
        var dEl = WX[D];
        if (dEl === el) { s += 1.5; det.push('day same +1.5'); }
        else if (GEN[dEl] === el) { s += 1; det.push('day generates +1'); }
        else if (CTRL[dEl] === el) { s -= 1; det.push('day controls −1'); }
        if (Y) { var yEl = WX[Y];
          if (yEl === el) { s += 1; det.push('year same +1'); }
          else if (GEN[yEl] === el) { s += 0.5; det.push('year generates +0.5'); }
          else if (CTRL[yEl] === el) { s -= 0.5; det.push('year controls −0.5'); } }
      }
      if (H) { var hEl = WX[H];
        if (ramo && ramo === H) { s += 0.4; det.push('hour same branch +0.4'); }
        else if (hEl === el) { s += 0.3; det.push('hour same element +0.3'); }
        else if (GEN[hEl] === el) { s += 0.2; det.push('hour generates +0.2'); } }
      if (radEl[el]) { s += 2; det.push('gathering ' + radEl[el].r.join('') + ' +2'); }
      return { s: s, det: det, stadio: st };
    }
    var timelyEl = function(el){ var st = stadioMese(el, Mo); return st==='旺' || st==='相'; };

    var out = R.linee.map(function(l){
      var isFocus = (focusPos == null) ? true : (l.pos === focusPos);
      var b = baseEl(l.el, isFocus, l.ramo), s = b.s, det = b.det.slice();
      // day clash / combination on the branch
      if (CLASH[D] === l.ramo) {
        if (l.vuoto && timelyEl(l.el)) { det.push('day clash fills the void (timely) 0'); }
        else { s -= 1; det.push('day clashes −1'); }
      }
      if (COMBINA[D] === l.ramo) det.push('day combines: bound');
      // void
      if (l.vuoto) { if (stadioMese(l.el, Mo) === '旺') det.push('void but prosperous 0'); else { s -= 2; det.push('void −2'); } }
      // mobile: effect of the arrival
      if (l.isMobile) {
        var m = R.mutante;
        if (m.movimentoNullo) det.push('null movement: departure does not act');
        else {
          if (m.casoMut === 1) { s += 1; det.push('return-generation +1'); }
          else if (m.casoMut === 5) { s += 0.5; det.push('same element +0.5'); }
          else if (m.casoMut === 3) { s -= 2; det.push('return-control −2'); }
          if (m.progressione === 'avanzante') { s += 1; det.push('advancing +1'); }
          else if (m.progressione === 'retrocedente') { s -= 1; det.push('retreating −1'); }
        }
      }
      return { pos: l.pos, par: l.par, ramo: l.ramo, el: l.el, score: s, det: det, stadio: b.stadio, timely: timelyEl(l.el) };
    });
    // adjacent fixed lines feed / drain (mother timely → child +1; child timely & mother untimely → mother −1)
    for (var i = 0; i < 6; i++) {
      var a = R.linee[i]; if (a.isMobile) continue;
      [i-1, i+1].forEach(function(j){
        if (j < 0 || j > 5) return; var c = R.linee[j]; if (c.isMobile) return;
        if (GEN[a.el] === c.el) {
          if (timelyEl(a.el)) { out[j].score += 1; out[j].det.push('fed by adjacent ' + a.par + ' ' + a.ramo + ' (timely mother) +1'); }
          else if (timelyEl(c.el)) { out[i].score -= 1; out[i].det.push('drained by adjacent ' + c.par + ' ' + c.ramo + ' (timely child) −1'); }
        }
      });
    }
    // hidden lines
    out.forEach(function(o, i){
      var l = R.linee[i]; if (!l.fushen) return;
      var b = baseEl(l.fushen.el, (focusPos == null) || (l.pos === focusPos), l.fushen.b), s = b.s, det = b.det.slice();
      if (!l.vuoto) { s -= 1; det.push('covered by full host −1'); } else det.push('void host lets it out');
      if (R.vuoti.indexOf(l.fushen.b) >= 0) { s -= 2; det.push('void −2'); }
      o.hidden = { par: l.fushen.par, ramo: l.fushen.b, el: l.fushen.el, score: s, det: det };
    });
    // arrival of the mobile
    var arrivo = null;
    if (!R.mutante.movimentoNullo) {
      var ba = baseEl(R.mutante.arrEl, true, R.mutante.ramoArr);
      arrivo = { ramo: R.mutante.ramoArr, el: R.mutante.arrEl, score: ba.s, det: ba.det, stadio: ba.stadio };
    }
    return { linee: out, arrivo: arrivo, raduni: raduni.map(function(h){ return { r: h.r, el: h.el, score: 2 }; }) };
  }

  function dingSpirit(dayStem, dayBranch){
    var si = S10.indexOf(dayStem), bi = B.indexOf(dayBranch); if (si<0||bi<0) return null;
    var head = ((bi-si)%12+12)%12;
    return B[(head+3)%12];
  }
  function tronco2ramo(stem, dayStem, dayBranch){
    var si=S10.indexOf(dayStem), bi=B.indexOf(dayBranch), ti=S10.indexOf(stem);
    if (si<0||bi<0||ti<0) return null;
    var head=((bi-si)%12+12)%12; return B[(head+ti)%12];
  }
  function tiande(monthBranch, dayStem, dayBranch){
    var T={'寅':'丁','卯':'申','辰':'壬','巳':'辛','午':'亥','未':'甲','申':'癸','酉':'寅','戌':'丙','亥':'乙','子':'巳','丑':'庚'};
    var v=T[monthBranch]; if(!v) return null;
    return '子丑寅卯辰巳午未申酉戌亥'.indexOf(v)>=0 ? v : tronco2ramo(v, dayStem, dayBranch);
  }
  function zhide(dayBranch){ var i=B.indexOf(dayBranch); return i<0?null:B[(i+5)%12]; }
  var STELO_SPIRITI = {
    ghost: {'甲':['申'],'乙':['酉'],'丙':['亥'],'丁':['子'],'戊':['寅'],'己':['卯'],'庚':['巳'],'辛':['午'],'壬':['辰','戌'],'癸':['丑','未']},
    tomb:  {'甲':['未'],'乙':['戌'],'丙':['戌'],'丁':['丑'],'戊':['戌'],'己':['丑'],'庚':['丑'],'辛':['辰'],'壬':['辰'],'癸':['未']}
  };
  // Generale del Mese (月將) dal 中氣 corrente — richiede jieqi-gmt.js e daliuren.js già caricati
  function generaleDelMese(dateStr){
    try {
      var JQ = (typeof window !== 'undefined' && window.XKDGJieQiGMT) ||
               (typeof require !== 'undefined' && require('./jieqi-gmt.js'));
      var DLR = (typeof window !== 'undefined' && window.XKDGDaLiuRen) ||
                (typeof require !== 'undefined' && require('./daliuren.js'));
      if (!JQ || !DLR || !dateStr) return null;
      var p = dateStr.split('-').map(Number), y=p[0], m=p[1], d=p[2];
      var c = JQ.currentJieQi(y, m, d); if (!c) return null;
      var idx = c.index, name = c.name;
      if (c.isJie) { idx = (idx+23)%24; name = JQ.TERM_ORDER[idx]; }
      var map = {'穀雨':'谷雨','小滿':'小满','處暑':'处暑'}; name = map[name] || name;
      return DLR.MONTH_GENERAL_BY_ZHONGQI[name] || null;
    } catch (e) { return null; }
  }
  function postHorseDelGiorno(dayBranch){
    var DLR = (typeof window !== 'undefined' && window.XKDGDaLiuRen) ||
              (typeof require !== 'undefined' && require('./daliuren.js'));
    return DLR ? DLR.postHorse(dayBranch) : null;
  }

  // Elenco doctrinale delle vie, in ORDINE DI VALUTAZIONE (prima risposta non nulla vince).
  // Ogni via: id (usato per l'interruttore), sezione (§ del registro), nome breve, dottrina
  // (dal registro, per la spiegazione al click), test(R, ctx, state) -> 'LONG'|'SHORT'|null.
  var LY_VIE = [];

  // §101 — BLOCCO DELLA MOBILE RICEVENTE UNTIMELY (Edu, 26/08/2026, da EURJPY 27/03/2025).
  //   Nel caso 6 (il giorno libera la mobile: la mobile parte ma l'arrivo e' clashato dal giorno,
  //   quindi si muove senza trasformarsi). Se la mobile e' UNTIMELY e la BESTIA seduta sulla sua
  //   linea la DRENA (泄: l'elemento della bestia e' il figlio della mobile) ed e' RADICATA (>=1
  //   radice nei rami di calendario) e TIMELY, il movimento non parte: azione tentata e fallita ->
  //   chi non vince perde -> SEDE OPPOSTA (mobile in basso -> LONG, mobile in alto -> SHORT).
  //   Solo il DRENAGGIO blocca, non il controllo (剋): gemella EURJPY 08/04/2025 (stesso seme 161,
  //   pressione di controllo) la mobile parte e vince la sua sede. Perimetro stretto e raro (caso 6
  //   + bestia radicata che drena): 2 carte, 2/2. GIORNOBLOCCO=off spegne.
  // §127 — L'AUTOPENALITA' DAL MESE: CHI NON VINCE PERDE (Edu, 30/08/2026)
  LY_VIE.push({ id:'R66_127', sezione:'§127', coda:true, cablata:'2026-08-30',
    nome:'Self-punishment from the month on the mobile: who does not win, loses',
    dottrina:'Edu (30/08/2026, guida EURJPY 15/06/2023, seme 151). Quattro rami si penalizzano DA SOLI (自刑): 辰辰, 午午, 酉酉, 亥亥. Quando la PARTENZA della mobile e\' uno di questi e il MESE e\' lo stesso ramo, sedere sul mese non e\' una carica: e\' un\'AUTOPENALITA\'. La mobile colpita non porta a casa la sua azione — chi non vince perde — e la sua sede CADE (bassa -> LONG, alta -> SHORT). E\' l\'eccezione speculare della §126: per gli altri otto rami il mese carica, per questi quattro punisce. Sulla guida la G 午 siede sul mese 午 (e sull\'ora 午): sembra fortissima, ma e\' autopenalizzata — la sede bassa cade, LONG, esito LONG +173. REGOLA DI CODA, congelata alla nascita. VIA127=off per disattivarla.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.VIA127==='off') return null;
      if (!R.monthBranch) return null;
      var AUTO127 = {'辰':1,'午':1,'酉':1,'亥':1};
      var dep = R.mutante.ramoDep;
      if (!AUTO127[dep] || R.monthBranch !== dep) return null;
      var mob = R.linee[R.mutante.pos-1];
      var dir = mob.pos <= 3 ? 'LONG' : 'SHORT';
      state.why = 'The mobile L'+mob.pos+' ('+mob.par+' '+dep+') sits on the month '+R.monthBranch+', but '+dep+dep+' is a SELF-PUNISHMENT (自刑): the month punishes it instead of charging it. Its action does not come home — who does not win, loses — its seat falls → '+dir+'.';
      return dir;
    }});

  // §129 — IL PILASTRO COMPLETO RENDE LA LINEA DOMINANTE (Edu, 30/08/2026)
  LY_VIE.push({ id:'R68_129', sezione:'§129', coda:true, cablata:'2026-08-30',
    nome:'A complete pillar lands on a line: that line becomes dominant and its side wins',
    dottrina:'Edu (30/08/2026, guida AUDUSD 18/04/2022, seme 73). Primo grado della dottrina delle Sei Bestie portato a via: quando un PILASTRO della data arriva COMPLETO su una linea — il RAMO del pilastro e\' il ramo della linea E la bestia dello STELO del pilastro e\' gia\' seduta sopra — quella linea diventa DOMINANTE e la sua squadra vince la propria sede. Sulla guida il Tai Sui 壬寅 arriva intero sulla W L2 (ramo 寅, stelo 壬 -> 玄武): domina, sede bassa, SHORT, esito SHORT +42. Basta solo questo, sopra ogni altra lettura, incluse le incompatibilita\' della Ying. ECCEZIONE (da §127): se il ramo e\' uno dei quattro che si penalizzano da soli (辰午酉亥), l\'arrivo del ramo uguale e\' autopenalita\', non carica: non domina. Il C dominante tace. Se due linee dominanti indicano sedi opposte, tace. Steli di mese e ora derivati coi Cinque Tigri e i Cinque Ratti; stelo d\'anno dal contesto. VIA129=off per disattivarla.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.VIA129==='off') return null;
      var ST9=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
      var BR9=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
      var BDI9={'甲':'青龍','乙':'青龍','丙':'朱雀','丁':'朱雀','戊':'勾陳','己':'螣蛇','庚':'白虎','辛':'白虎','壬':'玄武','癸':'玄武'};
      var WUHU9={'甲':'丙','己':'丙','乙':'戊','庚':'戊','丙':'庚','辛':'庚','丁':'壬','壬':'壬','戊':'甲','癸':'甲'};
      var WUSHU9={'甲':'甲','己':'甲','乙':'丙','庚':'丙','丙':'戊','辛':'戊','丁':'庚','壬':'庚','戊':'壬','癸':'壬'};
      var AUTO9={'辰':1,'午':1,'酉':1,'亥':1};
      var ys = ctx && ctx.yearStem;
      var ms = ctx && ctx.monthStem;
      if (!ms && ys && R.monthBranch) {
        var mi = (BR9.indexOf(R.monthBranch) - 2 + 12) % 12;
        ms = ST9[(ST9.indexOf(WUHU9[ys]) + mi) % 10];
      }
      var os = ctx && ctx.hourStem;
      if (!os && R.dayStem && ctx && ctx.oraBranch) {
        var hi = BR9.indexOf(ctx.oraBranch);
        if (hi >= 0) os = ST9[(ST9.indexOf(WUSHU9[R.dayStem]) + hi) % 10];
      }
      // Dominano solo i pilastri GRANDI, anno (Tai Sui) e mese: il giorno e l'ora hanno
      // altri ruoli certificati (§108 il padrone del giorno, §112/§126 l'ora intera) e il
      // pilastro piccolo completo non basta a fare una dominante — sulla guida del 23/11
      // l'ora intera su L1 non domina, e decide l'incompatibile attiva. PILDOM=tutti per audit.
      var pil = (typeof process!=='undefined' && process.env && process.env.PILDOM==='tutti')
        ? [ [ys, R.yearBranch], [ms, R.monthBranch], [R.dayStem, R.dayBranch], [os, ctx && ctx.oraBranch] ]
        : [ [ys, R.yearBranch], [ms, R.monthBranch] ];
      var domini = [];
      for (var q = 0; q < pil.length; q++) {
        var stq = pil[q][0], brq = pil[q][1];
        if (!stq || !brq || AUTO9[brq]) continue;
        var beq = BDI9[stq];
        for (var i = 0; i < R.linee.length; i++) {
          var l = R.linee[i];
          if (l.ramo === brq && l.bestia && l.bestia.cn === beq) domini.push(l);
        }
      }
      if (!domini.length) return null;
      var dirs = {};
      for (var d2 = 0; d2 < domini.length; d2++) {
        var ld = domini[d2];
        var sd = ld.pos > 3 ? 'LONG' : 'SHORT';
        // PRINCIPIO FONDANTE (Edu, 30/08/2026): nell'azione il carattere decide il segno.
        // G e W fanno VINCERE la propria squadra; P e B la fanno PERDERE; il C fa vincere
        // se frena una B, perdere se controlla una G, altrimenti tace.
        if (ld.par === 'B' || ld.par === 'P') sd = (sd === 'LONG') ? 'SHORT' : 'LONG';
        else if (ld.par === 'C') {
          var frenaB = false, ctrlG = false;
          for (var e2 = 0; e2 < R.linee.length; e2++) {
            var l2 = R.linee[e2];
            if (l2.pos === ld.pos) continue;
            if (CTRL[ld.el] === l2.el) { if (l2.par === 'B') frenaB = true; if (l2.par === 'G') ctrlG = true; }
          }
          if (frenaB === ctrlG) continue;
          if (ctrlG) sd = (sd === 'LONG') ? 'SHORT' : 'LONG';
        }
        dirs[sd] = ld;
      }
      var kk = Object.keys(dirs);
      if (kk.length !== 1) return null;
      var vinc = dirs[kk[0]];
      state.why='A complete date pillar lands on L'+vinc.pos+' ('+vinc.par+' '+vinc.ramo+'): branch on the line and the stem\'s beast already seated. The line is <b>dominant</b> — '+(dirs[kk[0]].par==='B' ? 'but it is a B: full powers bring full harm, its seat falls' : 'its side wins its seat')+' → '+kk[0]+'.';
      return kk[0];
    }});

  // §128 — LA SHI O LA YING INCOMPATIBILE PERDE IL DUELLO (Edu, 30/08/2026)
  LY_VIE.push({ id:'R67_128', sezione:'§128', coda:true, cablata:'2026-08-30',
    nome:'An incompatible Shi or Ying cannot hold its seat: the other side wins',
    dottrina:'Edu (30/08/2026, guida AUDUSD 23/11/2022, seme 66). Le cinque coppie incompatibili di §109 (丑∈坤 · 卯∈兌 · 辰∈乾 · 午∈坎 · 申∈艮: il ramo clasha il ramo proprio del trigramma che lo ospita) valgono anche nel DUELLO: una Shi o una Ying incompatibile col proprio trigramma e\' mal seduta e NON puo\' tenere la sede — vince l\'altra parte, la sua sede decide. Se sono incompatibili entrambe o nessuna, tace. Sulla guida la Shi G 卯 siede dentro 兌 (卯 clasha 酉): perde, vince la Ying W 亥 in alto, LONG, esito LONG +84. REGOLA DI CODA, congelata alla nascita. VIA128=off per disattivarla.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.VIA128==='off') return null;
      var PROP128={1:['戌','亥'],2:['酉'],3:['午'],4:['卯'],5:['辰','巳'],6:['子'],7:['丑','寅'],8:['未','申']};
      // L'INCOMPATIBILE NON CONTA SE NON E' UNA LINEA ATTIVA (Edu, 30/08/2026):
      // attiva = non vuota-ferma (il vuoto non agisce), e toccata dalla data — la bestia
      // di uno stelo dei pilastri le siede sopra o un ramo dei pilastri e' il suo ramo —
      // oppure e' la mobile stessa. Sulla guida la Shi G 卯 porta 玄武 e lo stelo d'anno
      // 壬 e' Acqua: attiva. Sulla AUDUSD 18/04/2022 la Ying 辰 e' vuota e ferma: non conta.
      var ST8=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
      var BR8=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
      var BDI8={'甲':'青龍','乙':'青龍','丙':'朱雀','丁':'朱雀','戊':'勾陳','己':'螣蛇','庚':'白虎','辛':'白虎','壬':'玄武','癸':'玄武'};
      var WUHU8={'甲':'丙','己':'丙','乙':'戊','庚':'戊','丙':'庚','辛':'庚','丁':'壬','壬':'壬','戊':'甲','癸':'甲'};
      var WUSHU8={'甲':'甲','己':'甲','乙':'丙','庚':'丙','丙':'戊','辛':'戊','丁':'庚','壬':'庚','戊':'壬','癸':'壬'};
      var ys8 = ctx && ctx.yearStem, ms8 = ctx && ctx.monthStem, os8 = ctx && ctx.hourStem;
      if (!ms8 && ys8 && R.monthBranch) {
        var mi8=(BR8.indexOf(R.monthBranch)-2+12)%12;
        ms8=ST8[(ST8.indexOf(WUHU8[ys8])+mi8)%10];
      }
      if (!os8 && R.dayStem && ctx && ctx.oraBranch) {
        var hi8=BR8.indexOf(ctx.oraBranch);
        if (hi8>=0) os8=ST8[(ST8.indexOf(WUSHU8[R.dayStem])+hi8)%10];
      }
      var steli8=[ys8,ms8,R.dayStem,os8].filter(function(x){return !!x;});
      var rami8=[R.yearBranch,R.monthBranch,R.dayBranch,ctx&&ctx.oraBranch].filter(function(x){return !!x;});
      var incRaw = function(pos){
        if (R.sup==null || R.inf==null) return false;
        var pr = PROP128[pos<=3 ? R.inf : R.sup] || [];
        var ramo = R.linee[pos-1].ramo;
        for (var a0=0;a0<pr.length;a0++) if (CLASH[ramo]===pr[a0]) return true;
        return false;
      };
      var inc = function(pos){
        if (R.sup==null || R.inf==null) return false;
        var pr = PROP128[pos<=3 ? R.inf : R.sup] || [];
        var l = R.linee[pos-1];
        var hit = null;
        for (var a=0;a<pr.length;a++) if (CLASH[l.ramo]===pr[a]) hit = pr[a];
        if (!hit) return false;
        // IL PONTE DEL PILASTRO SALVA L'INCOMPATIBILE (Edu, 30/08/2026, da EURJPY
        // 07/12/2023, seme 158): se il ramo proprio CONTROLLA la linea, ma un pilastro
        // della data CADE SULLA LINEA (ramo uguale, o bestia del suo stelo gia' seduta)
        // e il ramo di quel pilastro e' l'elemento IN MEZZO (generato dal controllore,
        // generatore della linea), il controllo diventa generazione: la linea e' SALVATA,
        // non e' incompatibile. Sulla guida il Tai Sui 癸卯: 癸 porta 玄武 sulla Shi 午,
        // e 卯 Legno fa da ponte fra l'Acqua di 坎 e il Fuoco della linea.
        if (CTRL[WX[hit]] === l.el) {
          var br = GEN[WX[hit]];
          if (GEN[br] === l.el) {
            var pil8 = [ [ys8, R.yearBranch], [ms8, R.monthBranch], [R.dayStem, R.dayBranch],
                         [os8, ctx && ctx.oraBranch] ];
            for (var p8 = 0; p8 < pil8.length; p8++) {
              var st = pil8[p8][0], rb = pil8[p8][1];
              if (!rb || WX[rb] !== br) continue;
              var tocca = (rb === l.ramo) || (st && l.bestia && BDI8[st] === l.bestia.cn);
              if (tocca) return false;   // salvata dal ponte
            }
          }
        }
        return true;
      };
      var attiva = function(pos){
        var l=R.linee[pos-1];
        var vuota=(R.vuoti||[]).indexOf(l.ramo)>=0;
        if (vuota && !l.isMobile) return false;      // il vuoto non agisce
        if (l.isMobile) return true;
        for (var a=0;a<steli8.length;a++) if (l.bestia && BDI8[steli8[a]]===l.bestia.cn) return true;
        for (var b=0;b<rami8.length;b++) if (rami8[b]===l.ramo) return true;
        return false;
      };
      // IL VUOTO NEL DUELLO PERDE AUTOMATICAMENTE (Edu, 30/08/2026, conferma su EURJPY
      // 07/12/2023): chi fra Shi e Ying e' vuoto perde, prima di ogni altro criterio.
      // Vale QUANDO SI ARRIVA al confronto: qui, quando almeno una delle due e'
      // incompatibile col trigramma (prima di salvezze e attivita').
      var rawS = incRaw(R.shi), rawY = incRaw(R.ying);
      if (!rawS && !rawY) return null;
      var vuS=(R.vuoti||[]).indexOf(R.linee[R.shi-1].ramo)>=0 && !R.linee[R.shi-1].isMobile;
      var vuY=(R.vuoti||[]).indexOf(R.linee[R.ying-1].ramo)>=0 && !R.linee[R.ying-1].isMobile;
      if (vuS !== vuY) {
        var vv = vuS ? R.linee[R.ying-1] : R.linee[R.shi-1];
        var dv = vv.pos > 3 ? 'LONG' : 'SHORT';
        state.why='In the Shi/Ying confrontation the <b>void one loses automatically</b>: the '+(vuS?'Shi':'Ying')+' sleeps in the void, the '+(vuS?'Ying':'Shi')+' wins its seat → '+dv+'.';
        return dv;
      }
      var iS = inc(R.shi) && attiva(R.shi), iY = inc(R.ying) && attiva(R.ying);
      if (iS === iY) return null;
      var vinc = iS ? R.linee[R.ying-1] : R.linee[R.shi-1];
      var perde = iS ? R.linee[R.shi-1] : R.linee[R.ying-1];
      var dir = vinc.pos > 3 ? 'LONG' : 'SHORT';
      state.why='The <b>'+(iS?'Shi':'Ying')+'</b> L'+perde.pos+' ('+perde.par+' '+perde.ramo+') is <b>incompatible</b> with its host trigram (it clashes its proper branch): badly seated, it cannot hold — the <b>'+(iS?'Ying':'Shi')+'</b> wins its seat → '+dir+'.';
      return dir;
    }});

  // §126 — LA LINEA SEDUTA SUL MESE NON SI LASCIA SVALUTARE (Edu, 30/08/2026)
  LY_VIE.push({ id:'R65_126', sezione:'§126', coda:true, cablata:'2026-08-30',
    nome:'The line seated on the month is charged: the hour punishes it in vain and its side wins',
    dottrina:'Edu (30/08/2026, guida GBPUSD 15/12/2022, seme 124; gemella USDCHF 28/01/2026, seme 76). L\'ORA arriva INTERA su una linea — il ramo dell\'ora la PENALIZZA (刑) e la bestia dello stelo dell\'ora (Cinque Ratti 五鼠遁) e\' gia\' seduta sopra. Se pero\' quella linea SIEDE SUL MESE (stesso ramo del mese), e\' CARICATA dal pilastro del mese e la penalita\' non la scalfisce: tiene la propria sede e la sua squadra VINCE (alto LONG, basso SHORT). Sulla guida la Ying L1 子 siede sul mese 子: penalizzata da 卯 dell\'ora, tiene, sede bassa, SHORT. Sulla gemella il mese e\' 丑, che COMBINA 子 (六合): li\' la Ying e\' legata e penalizzata insieme, e cade. Misura al cablaggio: 19 carte 78,9% z 2,52 +795 pip, vecchio 6/1 recente 9/3. REGOLA DI CODA, congelata. VIA126=off per disattivarla.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.VIA126==='off') return null;
      var ora = ctx && ctx.oraBranch; if (!ora || !R.dayStem || !R.monthBranch) return null;
      var XING126={'寅':'巳','巳':'申','申':'寅','丑':'戌','戌':'未','未':'丑','子':'卯','卯':'子','辰':'辰','午':'午','酉':'酉','亥':'亥'};
      var WUSHU126={'甲':'甲','己':'甲','乙':'丙','庚':'丙','丙':'戊','辛':'戊','丁':'庚','壬':'庚','戊':'壬','癸':'壬'};
      var ST126=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
      var B126=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
      var BDI126={'甲':'青龍','乙':'青龍','丙':'朱雀','丁':'朱雀','戊':'勾陳','己':'螣蛇','庚':'白虎','辛':'白虎','壬':'玄武','癸':'玄武'};
      var s0=WUSHU126[R.dayStem], hi=B126.indexOf(ora);
      if (!s0 || hi<0) return null;
      var so=ST126[(ST126.indexOf(s0)+hi)%10], bo=BDI126[so];
      if (!bo) return null;
      for (var i=0;i<R.linee.length;i++){
        var l=R.linee[i];
        if (XING126[ora]!==l.ramo) continue;
        if (!l.bestia || l.bestia.cn!==bo) continue;
        if (l.ramo!==R.monthBranch) continue;          // deve SEDERE sul mese
        var dir = l.pos>3 ? 'LONG' : 'SHORT';
        state.why='The hour arrives whole on L'+l.pos+' ('+l.par+' '+l.ramo+') and punishes it, but the line <b>sits on the month branch '+R.monthBranch+'</b>: charged by the month pillar, the punishment does not dent it — it holds its seat and its side wins → '+dir+'.';
        return dir;
      }
      return null;
    }});

  // §124 — LA YING CHE RESTA SOLA SI MISURA CON LA SHI (Edu, 30/08/2026)
  LY_VIE.push({ id:'R63_124', sezione:'§124', coda:true, cablata:'2026-08-30',
    nome:'The Ying that departs but does not arrive stands alone and measures against the Shi',
    dottrina:'Edu (30/08/2026, guida USDCHF 21/07/2021, seme 92). Passaggio logico dettato da Edu: se l\'arrivo della mobile e\' INCOMPATIBILE col trigramma futuro, la linea parte ma non arriva (caso -5). Quando quella linea e\' la YING, la Ying resta SOLA: non ha piu\' un\'azione propria, e allora si misura con la SHI. Vince chi CONTROLLA, e la sua sede decide (alto LONG, basso SHORT); se nessuna controlla, decide il vuoto asimmetrico (chi dorme perde); se nessuna dorme, la generazione (chi viene nutrito vince). Il caso speculare, mobile = Shi, NON vale: misurato al 40,0% su 50 carte. Sulla guida la Ying 寅 Legno controlla la Shi 未 Terra pur essendo nella tomba del mese 未: il controllo batte la stagione. Misura al cablaggio: 10 carte 60,0% (+85 pip), di cui il ramo del controllo 7 carte 71,4%. REGOLA DI CODA, congelata alla nascita. VIA124=off per disattivarla.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.VIA124==='off') return null;
      if (R.mutante.casoMut !== -5) return null;
      if (R.mutante.pos !== R.ying) return null;
      var S = R.linee[R.shi-1], Y = R.linee[R.ying-1];
      var eS = WX[S.ramo], eY = WX[Y.ramo];
      var vuoti = R.vuoti || [];
      var sv = vuoti.indexOf(S.ramo) >= 0, yv = vuoti.indexOf(Y.ramo) >= 0;
      var vinc = null, come = null;
      // il vuoto perde automaticamente, primo criterio (Edu, 30/08/2026)
      if (sv !== yv)            { vinc = sv ? Y : S; come = 'la ' + (sv?'Shi':'Ying') + ' e\' vuota e dorme: perde automaticamente'; }
      else if (CTRL[eS] === eY) { vinc = S; come = 'la Shi ' + S.ramo + ' controlla la Ying ' + Y.ramo; }
      else if (CTRL[eY] === eS) { vinc = Y; come = 'la Ying ' + Y.ramo + ' controlla la Shi ' + S.ramo; }
      else if (GEN[eS] === eY)  { vinc = Y; come = 'la Shi nutre la Ying: vince il nutrito'; }
      else if (GEN[eY] === eS)  { vinc = S; come = 'la Ying nutre la Shi: vince il nutrito'; }
      if (!vinc) return null;
      var dir = vinc.pos > 3 ? 'LONG' : 'SHORT';
      state.why = 'The mobile L'+R.mutante.pos+' is the <b>Ying</b> and its arrival is incompatible with the future trigram: it departs but does not arrive. The Ying is left <b>alone</b>, so it measures against the <b>Shi</b> — '+come+' → its seat → '+dir+'.';
      return dir;
    }
  });

  LY_VIE.push({ id:'R48_108', sezione:'§108', cablata:'2026-08-27',
    nome:'Inert double-bound void mobile: the day pillar becomes the line\'s master, the generation duel decides',
    dottrina:'Edu (27/08/2026, da NZDUSD 22/06/2023 seme 62): caso -1 col DOPPIO LEGAME (il giorno combina la partenza E clasha l\'arrivo, o lo speculare) e mobile IN VUOTO: resta vuota, non parte nemmeno — l\'arrivo non esiste se non c\'e\' partenza. Linea inerte, niente si muove. Il flusso degli steli CON LA COMBINAZIONE DEGLI STELI (甲己 乙庚 丙辛 丁壬 戊癸: lo stelo legato non puo\' essere capolinea), se termina sull\'elemento della BESTIA della linea inerte, vi si ferma e il PILASTRO DEL GIORNO diventa padrone della linea. Duello Shi/Ying per GENERAZIONE, col padrone al posto della linea inerte quando questa e\' Shi o Ying: chi genera cede il Qi, chi riceve vince -> sede del ricevente. 4/4, +256 pip.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.SPECIALE24==='off') return null;
      if (R.mutante.casoMut !== -1) return null;
      var D = R.dayBranch, dep = R.mutante.ramoDep, arr = R.mutante.ramoArr;
      if (!((COMBINA[D]===dep && CLASH[D]===arr) || (CLASH[D]===dep && COMBINA[D]===arr))) return null;
      var mob = R.linee[R.mutante.pos-1];
      if (!mob.vuoto || !mob.bestia) return null;
      var BEL = {'青龍':'Wood','朱雀':'Fire','勾陳':'Earth','螣蛇':'Earth','白虎':'Metal','玄武':'Water'};
      var bEl = BEL[mob.bestia.cn]; if (!bEl) return null;
      // flusso con la combinazione degli steli (serve la data completa nel ctx)
      var ds = R.dayStem, ys = ctx && ctx.yearStem, ms = ctx && ctx.monthStem, os = ctx && ctx.hourStem;
      if (!ds || !ys || !ms) return null;
      var SEs = {'甲':'Wood','乙':'Wood','丙':'Fire','丁':'Fire','戊':'Earth','己':'Earth','庚':'Metal','辛':'Metal','壬':'Water','癸':'Water'};
      var YANGL = ['甲','丙','戊','己','庚','壬'], YINL = ['乙','丁','戊','己','辛','癸'];
      var ST10 = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
      var HE = {'甲':'己','己':'甲','乙':'庚','庚':'乙','丙':'辛','辛':'丙','丁':'壬','壬':'丁','戊':'癸','癸':'戊'};
      var lad = (ST10.indexOf(ds)%2===0) ? YANGL : YINL;
      if (lad.indexOf(ds) < 0) return null;
      var steli = [ys, ms, ds, os].filter(function(x){return !!x;});
      var rami = [R.yearBranch, R.monthBranch, R.dayBranch, ctx && ctx.oraBranch].filter(function(x){return !!x;});
      var legati = {};
      for (var i2=0;i2<steli.length;i2++) for (var j2=i2+1;j2<steli.length;j2++)
        if (HE[steli[i2]]===steli[j2]) { legati[i2]=1; legati[j2]=1; }
      var liberi = steli.filter(function(s,k){ return !legati[k]; });
      var pres = {};
      for (var a2=0;a2<steli.length;a2++){ var e2=SEs[steli[a2]]; (pres[e2]=pres[e2]||[]).push(steli[a2]); }
      for (var b2=0;b2<rami.length;b2++){ var e3=WX[rami[b2]]; if(e3) (pres[e3]=pres[e3]||[]).push(rami[b2]); }
      var util = function(e){ return liberi.filter(function(s){ return SEs[s]===e && lad.indexOf(s)>=0; }); };
      var cap=null, lung=-1;
      for (var pe in pres) {
        var e4=pe, g4=0, ult=null, passi=0;
        while (g4++<6) { var g5=GEN[e4]; if (!pres[g5] || !util(g5).length) break; e4=g5; ult=g5; passi++; }
        if (ult && passi>lung) { lung=passi; cap=ult; }
      }
      if (cap !== bEl) return null;                              // il flusso deve fermarsi sulla bestia della mobile
      var S = R.linee[R.shi-1], Y = R.linee[R.ying-1]; if (!S || !Y) return null;
      var padr = SEs[ds];
      var eS = (R.mutante.pos===R.shi) ? padr : S.el;
      var eY = (R.mutante.pos===R.ying) ? padr : Y.el;
      var vinc = null;
      if (GEN[eS]===eY) vinc = Y; else if (GEN[eY]===eS) vinc = S;
      if (!vinc) return null;                                    // degenere: il principio non parla
      var dir = vinc.pos<=3 ? 'SHORT' : 'LONG';
      state.why = 'The void mobile <b>'+mob.ramo+'</b> is bound at both ends by the day: it stays void and does not even depart — no departure, no arrival. The stem flow, corrected for the stem combinations, terminates on its beast '+mob.bestia.cn+' ('+bEl+'), so the day pillar <b>'+ds+D+'</b> becomes the line\'s master. In the generation duel, the side that generates yields its Qi: the '+(vinc===S?'Shi':'Ying')+' receives and wins → '+dir+'.';
      return dir;
    }});


  LY_VIE.push({ id:'R47_107', sezione:'§107', cablata:'2026-08-27',
    nome:'Mobile bound at both ends by the day: the void Ying does not act, the Shi wins',
    dottrina:'Edu (27/08/2026, da EURGBP 19/11/2025 seme 88): caso -1 col DOPPIO LEGAME — il giorno combina la partenza E clasha l\'arrivo della mobile (o lo speculare). La linea non puo\' ne\' partire ne\' arrivare: e\' inutile per valutare chi vince ed esce dalla decisione, che passa al duello Shi/Ying. La Ying in VUOTO non agisce -> vince lo Shi -> sede dello Shi. 13/13, +874 pip. Lo SPECULARE (Shi vuoto -> vince la Ying) NON vale (44,4%: resta ristretto a §104); senza vuoti il duello non parla (celle di controllo piatte).',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.DUELLO24==='off') return null;
      if (R.mutante.casoMut !== -1) return null;
      var D = R.dayBranch, dep = R.mutante.ramoDep, arr = R.mutante.ramoArr;
      if (!((COMBINA[D]===dep && CLASH[D]===arr) || (CLASH[D]===dep && COMBINA[D]===arr))) return null;
      var S = R.linee[R.shi-1], Y = R.linee[R.ying-1];
      if (!S || !Y) return null;
      if (!Y.vuoto || S.vuoto) return null;                      // solo la Ying vuota; lo speculare non vale
      var dir = S.pos<=3 ? 'SHORT' : 'LONG';
      state.why = 'The day <b>'+D+'</b> combines the departure and clashes the arrival of the mobile <b>'+R.linee[R.mutante.pos-1].ramo+'</b>: bound at both ends, it can neither depart nor arrive and leaves the decision. In the Shi/Ying duel the Ying <b>'+Y.ramo+'</b> is void and does not act → the Shi L'+S.pos+' wins → seat of the Shi → '+dir+'.';
      return dir;
    }});

  // §111 — L'ARRIVO CHE DIVENTA TAI SUI LIBERO
  LY_VIE.push({ id:'R51_111', sezione:'§111', coda:true, cablata:'2026-08-28',
    nome:'The arrival that becomes a free Tai Sui: G/W speaks, a mute arrival punishes',
    dottrina:'Edu (28/08/2026, guide EURGBP 03/06/2020 seme 88 — ramo penalita\' — ed EURUSD 18/06/2020 seme 112 — ramo G/W; certificata da Edu). La mobile si muove davvero — oppure e\' sospesa dal giorno ma il GIORNO INTERO cade sulla linea (mobile su L1, casa dello stelo del giorno, stelo radicato): non la sospende, la carica — e il suo ARRIVO e\' il TAI SUI, LIBERO in carta (nessuna linea da combinare 六合 ne\' da clashare 六冲). Gerarchia: G e W parlano per primi — se l\'arrivo e\' G o W la mobile lo diventa e fa VINCERE la propria squadra (la sua sede). Se l\'arrivo e\' muto (P/B/C), agisce penalizzando (刑): la squadra della linea penalizzata PERDE (nota di Edu: la penalita\' 子卯 e\' sensibile a timely/untimely — penalizza molto quando untimely). Misura al cablaggio: cella 22 · 72,7% · z 2,13 · +517 (baseline 54,5%/+163) · ramo G/W 12 a 66,7% · ramo penalita\' 10 a 80,0% · discriminanti 14 a 9/5 · periodi 57/79. REGOLA DI CODA, congelata. TAISUILIBERO=off per disattivarla.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.TAISUILIBERO==='off') return null;
      var arr = R.mutante.ramoArr;
      if (!arr || !R.yearBranch || arr!==R.yearBranch) return null;
      // la mobile si muove, oppure il giorno intero cade sulla linea (sospesa liberata)
      if (R.mutante.casoMut===-1) {
        var SE111={'甲':'Wood','乙':'Wood','丙':'Fire','丁':'Fire','戊':'Earth','己':'Earth','庚':'Metal','辛':'Metal','壬':'Water','癸':'Water'};
        var rami111=[R.yearBranch,R.monthBranch,R.dayBranch,ctx&&ctx.oraBranch].filter(function(b){return !!b;});
        var dsRad=false; for (var a=0;a<rami111.length;a++) if (WX[rami111[a]]===SE111[R.dayStem]) { dsRad=true; break; }
        var perGiorno = String(R.mutante.motivoNullo||'').indexOf('day')>=0;
        if (!(R.mutante.pos===1 && dsRad && perGiorno)) return null;
      }
      var HE6={'子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯','辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午'};
      var CL111={'子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳'};
      var altre=[], i, l;
      for (i=0;i<R.linee.length;i++){ l=R.linee[i]; if (l.pos!==R.mutante.pos) altre.push(l); }
      for (i=0;i<altre.length;i++) if (HE6[arr]===altre[i].ramo || CL111[arr]===altre[i].ramo) return null;   // non libero
      var aEl=WX[arr], pEl=R.palEl;
      var parArr = aEl===pEl?'B': GEN[aEl]===pEl?'P': GEN[pEl]===aEl?'C': CTRL[aEl]===pEl?'G':'W';
      if (parArr==='G'||parArr==='W') {
        var sede=R.mutante.pos<=3?'SHORT':'LONG';
        state.why='The mobile moves to become a free Tai Sui <b>'+arr+'</b> as a '+parArr+': G and W speak first — it makes its own team win → its seat → '+sede+'.';
        return sede;
      }
      var XING111={'寅':'巳','巳':'申','申':'寅','丑':'戌','戌':'未','未':'丑','子':'卯','卯':'子','辰':'辰','午':'午','酉':'酉','亥':'亥'};
      var pen=null;
      for (i=0;i<altre.length;i++) if (XING111[arr]===altre[i].ramo) { pen=altre[i]; break; }
      if (!pen) return null;
      var dir = pen.pos<=3 ? 'LONG' : 'SHORT';
      state.why='The mobile becomes a free Tai Sui <b>'+arr+'</b>, a mute '+parArr+': with nothing to combine or clash, it acts by punishing (刑) <b>'+pen.ramo+'</b> on L'+pen.pos+' ('+pen.par+') — the punished line cannot make its side win → '+dir+'.';
      return dir;
    }});

  // §113 — IL MESE CHE SCORRE INTERO SULLA BESTIA
  LY_VIE.push({ id:'R53_113', sezione:'§113', coda:true, cablata:'2026-08-28',
    nome:'The month pillar flows whole into a line: absorbed and passed to the hidden spirit → that seat wins',
    dottrina:'Edu (28/08/2026, guida USDJPY 23/03/2023 seme 131; certificata da Edu). Quando il pilastro del MESE e\' di un solo elemento (stelo e ramo dello stesso elemento, es. 乙卯 Legno) e in carta c\'e\' una linea la cui BESTIA e\' di quell\'elemento, il mese arriva su quella linea COMPLETO di stelo e ramo: ASSORBE l\'elemento della linea (la linea genera il mese) e lo DISTRIBUISCE al 伏神 nascosto sotto di essa (il mese genera il nascosto, che non dev\'essere vuoto). Il flusso non e\' ostacolato ed e\' in piena stagione: quella sede VINCE. Sulla guida: mese 乙卯 sul Drago Verde di L3, assorbe l\'Acqua di 亥 e nutre la W 午 nascosta -> vince la sede bassa; il movimento della mobile L4 era solo apparente (G untimely col Legno in stagione, l\'ora 丙戌 dirotta l\'arrivo). Misura al cablaggio: 3/3 · +143 pip (2 gia\' vinte da §52 e §50g con lo stesso verdetto: sposta 1 carta, +34). REGOLA DI CODA, congelata alla nascita. MESEPIENO=off per disattivarla.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.MESEPIENO==='off') return null;
      if (!R.monthBranch || !R.yearBranch || !ctx || !ctx.date) return null;
      var ST113=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
      var SE113={'甲':'Wood','乙':'Wood','丙':'Fire','丁':'Fire','戊':'Earth','己':'Earth','庚':'Metal','辛':'Metal','壬':'Water','癸':'Water'};
      var BR113=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
      var BRm113=['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'];
      var PRIMO113={'甲':'丙','己':'丙','乙':'戊','庚':'戊','丙':'庚','辛':'庚','丁':'壬','壬':'壬','戊':'甲','癸':'甲'};
      // steli SEMPRE derivati dai rami del motore: anno dal ramo d'anno, mese con i Cinque Tigri (五虎遁)
      var y=parseInt(String(ctx.date).split('-')[0],10); if (!y) return null;
      var annoS=null, Y2=[y,y-1];
      for (var yi=0; yi<2; yi++) if (BR113[((Y2[yi]-4)%12+12)%12]===R.yearBranch) { annoS=ST113[((Y2[yi]-4)%10+10)%10]; break; }
      if (!annoS) return null;
      var mi=BRm113.indexOf(R.monthBranch); if (mi<0) return null;
      var meseS=ST113[(ST113.indexOf(PRIMO113[annoS])+mi)%10];
      var mEl=WX[R.monthBranch];
      if (SE113[meseS]!==mEl) return null;                     // pilastro intero: un solo elemento
      var BEL113={'青龍':'Wood','朱雀':'Fire','勾陳':'Earth','螣蛇':'Earth','白虎':'Metal','玄武':'Water'};
      for (var i=0;i<R.linee.length;i++){ var L=R.linee[i];
        if (!L.fushen || !L.bestia) continue;
        if (BEL113[L.bestia.cn]!==mEl) continue;               // la bestia della linea e' dell'elemento del mese
        if (GEN[L.el]!==mEl) continue;                         // la linea genera il mese: il mese la assorbe
        if (GEN[mEl]!==L.fushen.el) continue;                  // e distribuisce al nascosto sotto
        if (R.vuoti && R.vuoti.indexOf(L.fushen.b)>=0) continue; // il nascosto non dev'essere vuoto
        var sede = L.pos<=3?'SHORT':'LONG';
        state.why='The month pillar <b>'+meseS+R.monthBranch+'</b> is one element and flows WHOLE into L'+L.pos+' on its beast '+L.bestia.cn+': it absorbs '+L.ramo+' and feeds the hidden '+L.fushen.par+' '+L.fushen.b+' beneath — unobstructed, in season: that seat wins → '+sede+'.';
        return sede;
      }
      return null;
    }});


  LY_VIE.push({ id:'R41_101', sezione:'§101', nome:'Blocked receiving mobile: rooted draining beast on the mobile → opposite seat',
    dottrina:'Edu (26/08/2026, da EURJPY 27/03/2025): nel caso 6 (giorno libera la mobile), se la mobile e\' untimely e la BESTIA sulla sua linea la DRENA (泄), radicata e timely, il movimento non parte -> chi non vince perde -> sede opposta. Solo il drenaggio blocca, non il controllo (gemella EURJPY 08/04/2025, seme 161).',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.GIORNOBLOCCO==='off') return null;
      if (R.mutante.casoMut !== 6) return null;
      var mob = R.linee[R.mutante.pos-1];
      var mEl = WX[R.monthBranch], sEl = SEASON[R.monthBranch];
      var timely = function(el){ var a=stagione(el,mEl), b=stagione(el,sEl);
        return a==='旺'||a==='相'||b==='旺'||b==='相'; };
      if (timely(mob.el)) return null;                       // la mobile dev'essere UNTIMELY
      if (!mob.bestia) return null;
      var BEL101 = {'青龍':'Wood','朱雀':'Fire','勾陳':'Earth','螣蛇':'Earth','白虎':'Metal','玄武':'Water'};
      var bEl = BEL101[mob.bestia.cn];
      if (!bEl || GEN[mob.el] !== bEl) return null;           // la bestia dev'essere il FIGLIO della mobile (drena)
      var cal = [R.dayBranch, R.monthBranch, R.yearBranch, ctx && ctx.oraBranch].filter(function(b){return !!b;});
      var rooted = cal.filter(function(b){return WX[b]===bEl;}).length >= 1;
      if (!rooted || !timely(bEl)) return null;               // bestia radicata E timely
      var opp = mob.pos<=3 ? 'LONG' : 'SHORT';                // sede opposta della mobile
      state.why = 'The receiving mobile <b>'+mob.par+'</b> L'+mob.pos+' is untimely and the beast on it ('+mob.bestia.cn+') drains it (rooted, timely): the movement does not start — who does not win loses → opposite seat → '+opp+'.';
      return opp;
    }});

  // §102 — ARRIVO TENUTO DAL TRIGONO, NON CONTRASTATO (Edu, 26/08/2026, da EURJPY 31/08/2020).
  //   Nel caso 6 (il giorno vorrebbe liberare la mobile clashando l'arrivo), se l'ARRIVO e' membro
  //   di un 三合 COMPLETO presente nel Bazi (anno/mese/giorno/ora), e' TIMELY, e il GIORNO che
  //   vorrebbe clasharlo e' UNTIMELY, allora una linea untimely non agisce su una timely: il clash
  //   FALLISCE, l'arrivo tenuto dal trigono AGISCE. Il focus e' sull'azione, non sulla raccolta
  //   statica (Shen/You/Xu fermi non contano; e il Metallo che genera l'Acqua rema con l'arrivo,
  //   non contro). L'arrivo vince -> la mobile non tiene la sua sede -> SEDE OPPOSTA. Perimetro
  //   strutturale rarissimo (三合 completo sull'arrivo): 1 carta. GIORNOTRIGONO=off spegne.
  LY_VIE.push({ id:'R42_102', sezione:'§102', nome:'Arrival held by a full trine, uncontested: the arrival acts → opposite seat',
    dottrina:'Edu (26/08/2026, da EURJPY 31/08/2020): caso 6 con l\'arrivo dentro un 三合 completo del Bazi, timely, e il giorno che vorrebbe clasharlo untimely -> l\'untimely non agisce sulla timely, il clash fallisce, l\'arrivo tenuto dal trigono agisce -> sede opposta. La raccolta stagionale statica non conta (focus sull\'azione).',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.GIORNOTRIGONO==='off') return null;
      if (R.mutante.casoMut !== 6) return null;
      var arr = R.mutante.ramoArr, arrEl = WX[arr];
      var mEl = WX[R.monthBranch], sEl = SEASON[R.monthBranch];
      var timely = function(el){ var a=stagione(el,mEl), b=stagione(el,sEl);
        return a==='旺'||a==='相'||b==='旺'||b==='相'; };
      if (!timely(arrEl)) return null;                        // arrivo timely
      if (timely(WX[R.dayBranch])) return null;               // il giorno (clasherebbe) untimely
      var cal = [R.yearBranch, R.monthBranch, R.dayBranch, ctx && ctx.oraBranch].filter(function(b){return !!b;});
      var TRI = [['申','子','辰'],['亥','卯','未'],['寅','午','戌'],['巳','酉','丑']];
      var hit = null;
      for (var i=0;i<TRI.length;i++){ var t=TRI[i];
        if (t.indexOf(arr)>=0 && t.every(function(x){return cal.indexOf(x)>=0;})) { hit=t; break; } }
      if (!hit) return null;                                  // arrivo dentro un 三合 completo del Bazi
      var mob = R.linee[R.mutante.pos-1];
      var opp = mob.pos<=3 ? 'LONG' : 'SHORT';                // l'arrivo vince: la mobile non tiene la sua sede
      state.why = 'The arrival <b>'+arr+'</b> is held by the full trine '+hit.join('')+' (timely) and the day that would clash it is untimely: the untimely cannot act on the timely, the clash fails, the arrival acts → opposite seat → '+opp+'.';
      return opp;
    }});

  LY_VIE.push({ id:'R43_103', sezione:'§103', nome:'The arrival\'s twin jumps into the mobile\'s seat → rooting of the mobile decides',
    dottrina:'Edu (27/08/2026, da USDCAD 11/04/2022): caso 6 (il giorno libera la mobile clashando l\'arrivo). Se una linea FERMA porta lo STESSO ramo dell\'arrivo, quel ramo e\' clashato dal giorno anche su di lei e salta nella sede della mobile a sostituire l\'arrivo reso inefficace. Decide il RADICAMENTO della mobile: con almeno DUE radici del suo elemento fra ANNO e MESE la mobile regge la sostituzione e tiene la propria sede; con una o nessuna la linea che salta la rimpiazza davvero e il trigramma della mobile perde -> sede opposta. Il giorno non si conta: in questo perimetro e\' sempre il clash dell\'arrivo, quindi costante.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.GIORNOSALTO==='off') return null;
      if (R.mutante.casoMut !== 6) return null;
      var arr = R.mutante.ramoArr;
      var mob = R.linee[R.mutante.pos-1];
      var gemelle = R.linee.filter(function(l){ return l.ramo===arr && l.pos!==mob.pos; });
      if (!gemelle.length) return null;                       // nessuna gemella dell'arrivo
      var rad = [R.yearBranch, R.monthBranch].filter(function(b){ return b && WX[b]===mob.el; }).length;
      var suo = mob.pos<=3 ? 'SHORT' : 'LONG';                // sede della mobile
      var opp = mob.pos<=3 ? 'LONG'  : 'SHORT';               // sede opposta
      if (rad >= 2) {
        state.why = 'The day frees the mobile, and the fixed line L'+gemelle[0].pos+' carrying the same branch <b>'+arr+
          '</b> jumps into its seat; but the mobile <b>'+mob.ramo+'</b> has '+rad+' roots of its element between year and month, so it withstands the substitution and keeps its own seat → '+suo+'.';
        return suo;
      }
      state.why = 'The day frees the mobile and nullifies its arrival <b>'+arr+'</b>; the fixed line L'+gemelle[0].pos+
        ' carrying the same branch jumps into the mobile\'s seat and replaces it. The mobile <b>'+mob.ramo+'</b> has '+rad+
        ' root'+(rad===1?'':'s')+' between year and month, not enough to hold: its trigram loses → opposite seat → '+opp+'.';
      return opp;
    }});

  LY_VIE.push({ id:'R44_104', sezione:'§104', nome:'Untimely mobile without its return-generation: the Shi/Ying duel decides',
    dottrina:'Edu (27/08/2026, da EURUSD 22/08/2023): caso 6 (il giorno libera la mobile clashando l\'arrivo). Se la mobile e\' untimely e l\'unica cosa che potrebbe sostenerla e\' la generazione all\'indietro dall\'arrivo (回頭生), il clash del giorno spegne proprio quella: la mobile parte e non conclude. Chi non vince perde -> la mobile esce dalla decisione, che passa al duello Shi/Ying. Dove la Ying controlla lo Shi: se la Ying e\' in VUOTO non agisce e vince lo Shi; se e\' piena controlla lo Shi e vince lei. Verdetto = sede del vincitore.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.GIORNODUELLO==='off') return null;
      if (R.mutante.casoMut !== 6) return null;
      var mob = R.linee[R.mutante.pos-1];
      if (GEN[WX[R.mutante.ramoArr]] !== mob.el) return null;   // solo 回頭生 spento dal giorno
      var mEl = WX[R.monthBranch], sEl = SEASON[R.monthBranch];
      var timely = function(el){ var a=stagione(el,mEl), b=stagione(el,sEl);
        return a==='旺'||a==='相'||b==='旺'||b==='相'; };
      if (timely(mob.el)) return null;                          // mobile untimely
      var S = R.linee[R.shi-1], Y = R.linee[R.ying-1];
      if (!S || !Y || CTRL[Y.el] !== S.el) return null;          // la Ying attaccherebbe lo Shi
      var v = Y.vuoto ? S : Y;                                   // il vuoto non agisce
      var dir = v.pos<=3 ? 'SHORT' : 'LONG';
      state.why = 'The day frees the mobile but clashes away the very return-generation <b>'+R.mutante.ramoArr+
        '</b> that the untimely mobile <b>'+mob.ramo+'</b> would need: it starts and does not arrive, and who does not win loses. ' +
        'The decision passes to the Shi/Ying duel: the Ying <b>'+Y.ramo+'</b> ' +
        (Y.vuoto ? 'is void and does not act, so the Shi L'+S.pos+' holds' : 'is full and controls the Shi L'+S.pos) +
        ' → seat of the winner → '+dir+'.';
      return dir;
    }});

  LY_VIE.push({ id:'R45_105', sezione:'§105', nome:'Timely mobile at the flow terminus: the Qi lands on the P',
    dottrina:'Edu (27/08/2026, da USDCAD 20/03/2023): caso 6 (il giorno clasha l\'arrivo). Se la mobile e\' una G (o una W), e\' TIMELY ed e\' il punto TERMINALE del flusso degli steli, si muove per GENERARE IN AVANTI l\'arrivo, e il clash del giorno non ferma nulla perche\' una G/W carica spinge con forza. Il Qi arriva sulla P, e la P fa perdere la propria squadra -> sede opposta alla mobile. Il capolinea e\' cio\' che separa questa carta dalla gemella USDCAD 08/03/2023 (stesso esagramma, stesso ramo di giorno): li\' il flusso finisce nel Legno, la mobile non e\' caricata, resta libera e vince la propria squadra -> LONG.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.GIORNOCAPOLINEA==='off') return null;
      if (R.mutante.casoMut !== 6) return null;
      var mob = R.linee[R.mutante.pos-1];
      if (['G','W'].indexOf(mob.par) < 0) return null;            // una G (o una W) che spinge
      var arrEl = WX[R.mutante.ramoArr];
      if (GEN[mob.el] !== arrEl) return null;                     // genera IN AVANTI l'arrivo
      var mEl = WX[R.monthBranch], sEl = SEASON[R.monthBranch];
      var timely = function(el){ var a=stagione(el,mEl), b=stagione(el,sEl);
        return a==='旺'||a==='相'||b==='旺'||b==='相'; };
      if (!timely(mob.el)) return null;                           // mobile timely
      var lB = R.linee.filter(function(l){ return l.par==='B'; })[0];
      if (!lB) return null;
      var gong = lB.el;
      var parArr = arrEl===gong ? 'B' : (GEN[arrEl]===gong ? 'P' : (GEN[gong]===arrEl ? 'C' :
                   (CTRL[arrEl]===gong ? 'G' : 'W')));
      if (parArr !== 'P') return null;                            // il Qi arriva su una P
      var cap = ctx && ctx.capolineaEl;
      if (!cap) return null;                                      // senza il flusso non si giudica
      if (cap !== mob.el) return null;                            // la mobile E' il capolinea
      var dir = mob.pos<=3 ? 'LONG' : 'SHORT';
      state.why = 'The mobile <b>'+mob.ramo+'</b> ('+mob.par+') is timely and is the terminus of the stem flow, so it moves to generate its arrival <b>'+
        R.mutante.ramoArr+'</b> forward; the day\'s clash does not stop a charged '+mob.par+'. The Qi lands on the P, and the P makes its own side lose → opposite seat → '+dir+'.';
      return dir;
    }});

  LY_VIE.push({ id:'R46_106', sezione:'§106', nome:'Forceless mobile with a void Shi: the Ying wins',
    dottrina:'Edu (27/08/2026, da AUDUSD 14/09/2021): caso 6. Se la mobile e\' untimely non ha forza e non riesce a fare niente, quindi esce dalla decisione. Fra Shi e Ying vince la Ying quando lo SHI e\' in VUOTO (il vuoto non agisce) e la Ying no -> sede della Ying. Il ramo speculare (Ying vuota -> vince lo Shi) NON vale da solo: misurato fa 3/7 ed e\' lasciato a §104, che lo restringe alla 回頭生 spenta dal giorno. Senza il vincolo della mobile senza forza il perimetro sbaglia proprio la gemella USDCAD 08/03/2023, dove la mobile e\' timely e agisce.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.GIORNOSHIVUOTO==='off') return null;
      if (R.mutante.casoMut !== 6) return null;
      var mob = R.linee[R.mutante.pos-1];
      var mEl = WX[R.monthBranch], sEl = SEASON[R.monthBranch];
      var timely = function(el){ var a=stagione(el,mEl), b=stagione(el,sEl);
        return a==='旺'||a==='相'||b==='旺'||b==='相'; };
      if (timely(mob.el)) return null;                        // la mobile non ha forza
      var S = R.linee[R.shi-1], Y = R.linee[R.ying-1];
      if (!S || !Y || !S.vuoto || Y.vuoto) return null;        // Shi in vuoto, Ying no
      var dir = Y.pos<=3 ? 'SHORT' : 'LONG';
      state.why = 'The mobile <b>'+mob.ramo+'</b> is untimely: it has no force and achieves nothing, so it drops out of the decision. ' +
        'Between Shi and Ying, the Shi L'+S.pos+' <b>'+S.ramo+'</b> is void and does not act, so the Ying L'+Y.pos+' <b>'+Y.ramo+
        '</b> wins → its seat → '+dir+'.';
      return dir;
    }});

  LY_VIE.push({ id:'B62', sezione:'§62', nome:'Mobile G delivered to a strong C (FIRST)',
    dottrina:'A mobile G whose ARRIVAL lands in the element of a fixed C that is timely, full and controls it: the G hands itself to its executioner, the trend dies → OPPOSITE of the G\'s seat (G below → LONG, G above → SHORT). Doctrinal pillar (Edu 16/08), fixed by doctrine. C is ambivalent: it generates a W, but attacks a nearby G.',
    test: function (R, ctx, state) {
      var m = R.linee[R.mutante.pos-1];
      if (m.par !== 'G') return null;
      var vivo = function (l) { return ['legata','rotta','dormiente','eliminata','autocombinata'].indexOf(l.stato) < 0; };
      var mEl = WX[R.monthBranch], sEl = SEASON[R.monthBranch];
      var timely = function (el) { var s1=stagione(el,mEl), s2=stagione(el,sEl);
        return s1==='旺'||s1==='相'||s2==='旺'||s2==='相'; };
      var arrEl = WX[R.mutante.ramoArr];
      var ok = R.linee.some(function (l) { return l.par==='C' && !l.isMobile && !l.vuoto && vivo(l) &&
        timely(l.el) && CTRL[l.el]===m.el && l.el===arrEl; });
      if (!ok) return null;
      state.why = 'Mobile <b>G</b> L'+m.pos+' ('+R.mutante.ramoDep+') arrives in <b>'+R.mutante.ramoArr+'</b> ('+arrEl+'), the element of a fixed, timely, full <b>C</b> that controls it: the G is delivered to its executioner → opposite of the G\'s seat ('+(m.pos<=3?'below → LONG':'above → SHORT')+').';
      return m.pos<=3 ? 'LONG' : 'SHORT';
    }});

  // helper condivisi dalle vie 1-26 (identici a pb_stress.js, ricostruiti localmente per via)
  function _ctx(R){
    var mEl = WX[R.monthBranch], sEl = SEASON[R.monthBranch];
    return {
      D: R.dayBranch, Y: R.yearBranch, Mo: R.monthBranch, mEl: mEl, sEl: sEl,
      bazi: [R.yearBranch, R.monthBranch, R.dayBranch],
      timely: function (el) { var s1=stagione(el,mEl), s2=stagione(el,sEl); return s1==='旺'||s1==='相'||s2==='旺'||s2==='相'; },
      vivo: function (l) { return ['legata','rotta','dormiente','eliminata','autocombinata'].indexOf(l.stato) < 0; }
    };
  }

  LY_VIE.push({ id:'R1', sezione:'—', nome:'Destroyed mobile: read the timely line',
    dottrina:'The mobile is void, clashed by the day and not timely: if exactly one other line (not C/B) is alive, not void, not clashed by the day and timely, its position dictates the direction (opposite of its seat).',
    test: function (R, ctx, state) {
      var c = _ctx(R);
      var mob = R.linee[R.mutante.pos-1], dep = R.mutante.ramoDep;
      var AUTOP = ['辰','午','酉','亥'];
      if (!((R.vuoti.indexOf(dep)>=0) && (CLASH[c.D]===dep) && !c.timely(mob.el))) return null;
      var cand = R.linee.filter(function (l) { return l.pos!==mob.pos && c.vivo(l) && R.vuoti.indexOf(l.ramo)<0 &&
        CLASH[c.D]!==l.ramo && !(l.ramo===c.D && AUTOP.indexOf(l.ramo)>=0) &&
        ['C','B'].indexOf(l.par)<0 && c.timely(l.el); });
      if (cand.length!==1) return null;
      state.why = 'The mobile L'+mob.pos+' ('+dep+') is <b>void</b> and clashed by the <b>day '+c.D+'</b>, not timely: destroyed. The only timely live line is L'+cand[0].pos+' <b>'+cand[0].par+' '+cand[0].ramo+'</b> → opposite of its seat.';
      return cand[0].pos<=3 ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R2', sezione:'—', nome:'Terminal G drained by its hidden line',
    dottrina:'The terminal of the qi flow (receives, does not give) is a single G, and its hidden line drains it (G generates the hidden): direction of the G\'s seat.',
    test: function (R, ctx, state) {
      var c = _ctx(R);
      var vivi = R.linee.filter(c.vivo);
      var els = {}; vivi.forEach(function(l){els[l.el]=true;}); c.bazi.forEach(function(b){els[WX[b]]=true;});
      var elsArr = Object.keys(els);
      var cap = vivi.filter(function (l) {
        var ric = elsArr.some(function(e){return GEN[e]===l.el && e!==l.el;});
        var ced = elsArr.some(function(e){return GEN[l.el]===e;});
        return ric && !ced;
      });
      var capG = (cap.length===1 && cap[0].par==='G') ? cap[0] : null;
      if (!capG || !capG.fushen || GEN[capG.el]!==capG.fushen.el) return null;
      state.why = 'The qi flow ends on a single <b>G</b> L'+capG.pos+' ('+capG.ramo+'), drained by its hidden <b>'+capG.fushen.par+' '+capG.fushen.b+'</b> → direction of the G\'s seat.';
      return capG.pos<=3 ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R3', sezione:'—', nome:'Punishment with the hidden line, both weak',
    dottrina:'A line in punishment (xing) with its own hidden line, both not timely: direction of the line\'s seat.',
    test: function (R, ctx, state) {
      var c = _ctx(R);
      var TRIPLE=[['寅','巳','申'],['丑','戌','未']], MUT=[['子','卯']];
      var inX = function (a,b){
        for (var i=0;i<TRIPLE.length;i++){ var t=TRIPLE[i]; if(t.indexOf(a)>=0&&t.indexOf(b)>=0&&a!==b) return true; }
        for (var j=0;j<MUT.length;j++){ var m2=MUT[j]; if(m2.indexOf(a)>=0&&m2.indexOf(b)>=0&&a!==b) return true; }
        return false;
      };
      var cf = R.linee.filter(function (l) { return l.fushen && inX(l.ramo, l.fushen.b); });
      if (cf.length!==1) return null;
      var l = cf[0];
      if (c.timely(l.el) || c.timely(l.fushen.el)) return null;
      state.why = 'L'+l.pos+' <b>'+l.par+' '+l.ramo+'</b> is in punishment with its hidden <b>'+l.fushen.par+' '+l.fushen.b+'</b>, both weak in the month <b>'+c.Mo+'</b> → direction of the line\'s seat.';
      return l.pos<=3 ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R57_118', sezione:'§118', coda:true, cablata:'2026-08-28',
    nome:'The year pillar lands on the beast and breaks the binding combination: the hidden spirit feeds the freed line (tail)',
    dottrina:'Edu (28/08/2026, guide card NZDUSD 07/11/2024, seme 59, year 甲辰): a FIXED line locked in a 六合 with another line cannot move nor transform — it is tied down. When the WHOLE YEAR PILLAR arrives on that line, because the year BRANCH is of the same element as the BEAST sitting on it, the year BREAKS the combination and frees the line. Freed, the line can finally receive what lies beneath it: its 伏神 generates it and feeds it. A fed W wins its seat (below → LONG, above → SHORT). The 伏神 acts even if its own branch is void — the certified channel of the Tai Sui that generates the hidden spirit under it. TAIL RULE: cabled at doctrinal certification, FROZEN at birth, judged by the tail class row. Removed only by a card that falsifies it in its perimeter with no other explanation. VIA118=off to disable.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.VIA118==='off') return null;
      if (!R.yearBranch) return null;
      var BEL = {'青龍':'Wood','朱雀':'Fire','勾陳':'Earth','螣蛇':'Earth','白虎':'Metal','玄武':'Water'};
      var yEl = WX[R.yearBranch];
      for (var i=0;i<R.linee.length;i++){
        var l = R.linee[i];
        if (l.isMobile || l.vuoto || l.par !== 'W') continue;
        if (!l.fushen) continue;
        if (GEN[l.fushen.el] !== l.el) continue;                      // the hidden spirit beneath generates the line
        if (!l.bestia || BEL[l.bestia.cn] !== yEl) continue;          // the year branch is of the beast's element → the whole year pillar lands here
        var legata = false;
        for (var j=0;j<R.linee.length;j++){ var q = R.linee[j];
          if (q.pos === l.pos) continue;
          if (COMBINA[l.ramo] === q.ramo) { legata = q; break; }
        }
        if (!legata) continue;                                        // the line must be tied down by a 六合 with another line
        var dir = l.pos<=3 ? 'LONG' : 'SHORT';
        state.why = 'L'+l.pos+' <b>W '+l.ramo+'</b> is tied down by the combination (六合) with L'+legata.pos+' ('+legata.ramo+'): it can neither move nor transform. The whole year pillar arrives on it — the year branch <b>'+R.yearBranch+'</b> is of the same element as the beast '+l.bestia.cn+' on the line — and BREAKS the combination. Freed, the line receives its 伏神 <b>'+l.fushen.b+'</b> beneath, which generates it: the W is fed and wins its seat → '+dir+'.';
        return dir;
      }
      return null;
    }});

  LY_VIE.push({ id:'R4', sezione:'—', nome:'Terminal G (no drain)',
    dottrina:'The terminal of the qi flow is a single G (even without a draining hidden line): direction of its seat.',
    test: function (R, ctx, state) {
      var c = _ctx(R);
      var vivi = R.linee.filter(c.vivo);
      var els = {}; vivi.forEach(function(l){els[l.el]=true;}); c.bazi.forEach(function(b){els[WX[b]]=true;});
      var elsArr = Object.keys(els);
      var cap = vivi.filter(function (l) {
        var ric = elsArr.some(function(e){return GEN[e]===l.el && e!==l.el;});
        var ced = elsArr.some(function(e){return GEN[l.el]===e;});
        return ric && !ced;
      });
      var capG = (cap.length===1 && cap[0].par==='G') ? cap[0] : null;
      if (!capG) return null;
      // Guardia mobile (Edu, 25/08/2026, audit): R4 sbaglia con mobile G. GR4G=off ripristina.
      if ((typeof process==='undefined' || !process.env || process.env.GR4G!=='off') && R.linee[R.mutante.pos-1].par==='G') return null;
      state.why = 'The qi flow of lines + Bazi (year '+c.Y+', month '+c.Mo+', day '+c.D+') ends on a single <b>G</b> L'+capG.pos+' ('+capG.ramo+') → direction of the G\'s seat.';
      return capG.pos<=3 ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R59_120', sezione:'§120', coda:true, cablata:'2026-08-28',
    nome:'The retreating malus: a B/P that retreats withdraws its harm and its own team wins (tail)',
    dottrina:'Edu (28/08/2026, guide card USDJPY 15/08/2024, seme 147): B and P make their own team lose — they are the malus characters. So when the MOBILE is a P (or B) and it RETREATS (退神, same element, counter-clockwise branch), the malus WITHDRAWS: the harm leaves the trigram and its own team WINS its seat (above → LONG, below → SHORT). The mirror of the generic retreat via, which reads the opposite of the seat: for the malus characters, retreat is liberation, not weakness. On the guide, the beasts CONFIRM: the whole month pillar 壬申 visits the G on L2 through the Metal beast (白虎 of the month branch element) and DRAINS the G (Earth → Metal), pushing the SHORT victory away — confirmation, not the actor, so it is NOT a condition (broad-form method, Edu 28/08/2026: cable broad by default, restrict only if statistics prove the extra condition separates winners from losers). Cabled for both B and P per Edu\'s standing generalization ("mobile B e P fanno perdere la propria squadra"). TAIL RULE: frozen at birth, judged by the tail class row, removed only by a falsifying card in its perimeter with no other explanation. VIA120=off to disable.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.VIA120==='off') return null;
      if (R.mutante.progressione !== 'retrocedente') return null;
      if (R.mutante.movimentoNullo) return null;                       // se il movimento non si conclude, il malus NON e' riuscito a ritirarsi
      var mob = R.linee[R.mutante.pos-1];
      if (mob.par !== 'P' && mob.par !== 'B') return null;
      var dir = mob.pos>3 ? 'LONG' : 'SHORT';
      state.why = 'The mobile L'+mob.pos+' is a <b>'+mob.par+'</b> — a malus character that makes its own team lose — and it RETREATS ('+R.mutante.ramoDep+' → '+R.mutante.ramoArr+', 退神): the harm withdraws from the trigram, and its own team wins its seat → '+dir+'.';
      return dir;
    }});

  LY_VIE.push({ id:'R60_121', sezione:'§121', coda:true, cablata:'2026-08-28',
    nome:'The advancing malus: a B/P that advances makes its own team lose (tail)',
    dottrina:'Edu (28/08/2026, DOCTRINE, stated with §120): "Se P o B avanzano la propria squadra perde. Se retrocedono vince. E\' dottrina." B and P are the malus characters: when the mobile is a B or P and it ADVANCES (進神, same element, clockwise branch), the malus gains ground inside its own trigram and makes its own team LOSE its seat (above → SHORT, below → LONG). Symmetric half of §120 (the retreating malus withdraws and its team wins). GUARD: the movement must conclude — a suspended advance (departure or arrival trapped) has not happened and the via stays silent. §66 (B advancing in the lower trigram → LONG) is the already-cabled particular case, same verdict. TAIL RULE: frozen at birth, judged by the tail class row. VIA121=off to disable.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.VIA121==='off') return null;
      if (R.mutante.progressione !== 'avanzante') return null;
      if (R.mutante.movimentoNullo) return null;
      var mob = R.linee[R.mutante.pos-1];
      if (mob.par !== 'P' && mob.par !== 'B') return null;
      var dir = mob.pos>3 ? 'SHORT' : 'LONG';
      state.why = 'The mobile L'+mob.pos+' is a <b>'+mob.par+'</b> — a malus character — and it ADVANCES ('+R.mutante.ramoDep+' → '+R.mutante.ramoArr+', 進神): the harm gains ground in its own trigram and makes its own team lose its seat → '+dir+'.';
      return dir;
    }});

  LY_VIE.push({ id:'R61_122', sezione:'§122', coda:true, cablata:'2026-08-28',
    nome:'Tomb and punishment still the mobile: the Shi/Ying duel decides, the stronger wins (tail)',
    dottrina:'Edu (28/08/2026, guide card USDJPY 23/07/2024, seme 156): the mobile\'s ARRIVAL enters the TOMB (庫) of its own element — the month branch — and the DAY punishes it (刑, here 子卯): the line does not move. With no other rule intervening (the beasts calm), the decision falls to the Shi/Ying duel: the STRONGER of the two wins its seat (force model). On the guide the Ying (寅, strong) beats the dormant Shi (未) → seat of the Ying below → SHORT. Tie of force → silence. TAIL RULE, frozen at birth. VIA122=off to disable.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.VIA122==='off') return null;
      if (R.mutante.casoMut !== -4) return null;
      var S = R.linee[R.shi-1], Y = R.linee[R.ying-1];
      // Il duello si decide col vuoto: la linea nei vuoti del giorno e' DORMIENTE e non agisce
      // (dottrina: una linea vuota non agisce, anche se timely). Vince l'altra. Se nessuna delle
      // due e' vuota (o entrambe), il duello non parla: si aspetta una carta guida.
      var sv = R.vuoti.indexOf(S.ramo) >= 0, yv = R.vuoti.indexOf(Y.ramo) >= 0;
      if (sv === yv) return null;
      var v = sv ? Y : S;
      var dir = v.pos>3 ? 'LONG' : 'SHORT';
      state.why = 'Tomb and punishment still the mobile ('+R.mutante.ramoDep+' → '+R.mutante.ramoArr+' in the '+R.monthBranch+' tomb, punished by the day '+R.dayBranch+'): the decision passes to the Shi/Ying duel. The '+(sv?'Shi '+S.ramo:'Ying '+Y.ramo)+' is VOID and dormant — it does not act — so the '+(v===S?'Shi':'Ying')+' <b>'+v.ramo+'</b> wins its seat → '+dir+'.';
      return dir;
    }});

  LY_VIE.push({ id:'R5', sezione:'—', nome:'Retreating mobile',
    dottrina:'The mobile retreats (same element, counter-clockwise branch): its direction holds if the year clash hits it, otherwise read the opposite.',
    test: function (R, ctx, state) {
      var c = _ctx(R);
      if (R.mutante.progressione !== 'retrocedente') return null;
      var mob = R.linee[R.mutante.pos-1], dep = R.mutante.ramoDep;
      var suo = mob.pos<=3 ? 'SHORT' : 'LONG';
      var hitY = CLASH[c.Y]===dep;
      state.why = 'The mobile L'+mob.pos+' <b>'+mob.par+'</b> retreats '+dep+' → '+R.mutante.ramoArr+'. '+(hitY?'The <b>Tai Sui '+c.Y+'</b> clashes it: its direction holds.':'No year clash: read the opposite of its seat.');
      return hitY ? suo : (suo==='LONG' ? 'SHORT' : 'LONG');
    }});

  LY_VIE.push({ id:'R58_119', sezione:'§119', coda:true, cablata:'2026-08-28',
    nome:'The self-rooted day pillar imposes itself on the L1 Shi: the charged Shi generates the Ying (tail)',
    dottrina:'Edu (28/08/2026, guide card EURJPY 27/12/2022, seme 141, day 甲寅): a day pillar whose STEM and BRANCH share the SAME element (甲寅: Wood over Wood, the stem standing on its own root) is so strong that it IMPOSES ITSELF on L1. PRECISION (Edu, same day): L1 is BOTH the day and the TERMINAL of the whole date — the capolinea of the stem flow is of the day\'s element, so the entire date pours onto the very line the pillar lands on — the casa of the day stem by construction of the ladder — regardless of the state of the line sitting there (here a void, dormant P). The Shi on L1, charged with the day\'s element, GENERATES the Ying: the Qi flows Shi → Ying and the Ying wins its seat (above → LONG, below → SHORT). GUARD (Edu): the mobile must be too WEAK (untimely) to superimpose itself over L1 — a timely mobile would take the reading first. TAIL RULE: cabled at doctrinal certification, FROZEN at birth, judged by the tail class row. Removed only by a card that falsifies it in its perimeter with no other explanation. VIA119=off to disable.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.VIA119==='off') return null;
      if (!R.dayStem || !R.dayBranch) return null;
      if (R.shi !== 1) return null;                                     // lo Shi deve sedere su L1
      var SEs = {'甲':'Wood','乙':'Wood','丙':'Fire','丁':'Fire','戊':'Earth','己':'Earth','庚':'Metal','辛':'Metal','壬':'Water','癸':'Water'};
      var dEl = SEs[R.dayStem];
      if (!dEl || dEl !== WX[R.dayBranch]) return null;                 // pilastro del giorno tutto d'un elemento (stelo sulla propria radice)
      // PRECISAZIONE (Edu, 28/08/2026): sulla guida L1 e' anche il TERMINALE dell'intera data
      // (capolinea del flusso = elemento del giorno). MISURA del confronto largo/stretto:
      // larga 8 carte 75,0% +291 · stretta 3 carte 66,7% +110 · fascia esclusa 5 carte 4/5 +181.
      // Decisione (Edu delega alla statistica, 28/08/2026): si cabla la FORMA LARGA — il capolinea
      // resta annotazione descrittiva della guida, non condizione.
      var yg = R.linee[R.ying-1];
      if (GEN[dEl] !== yg.el) return null;                              // lo Shi caricato del giorno genera lo Ying
      var mEl = WX[R.monthBranch], sEl = SEASON[R.monthBranch];
      var timely = function(el){ var a=stagione(el,mEl), b=stagione(el,sEl);
        return a==='旺'||a==='相'||b==='旺'||b==='相'; };
      var mob = R.linee[R.mutante.pos-1];
      if (timely(mob.el)) return null;                                  // la mobile debole non si sovrappone a L1; se e' timely, tace
      var dir = yg.pos>3 ? 'LONG' : 'SHORT';
      state.why = 'The day pillar <b>'+R.dayStem+R.dayBranch+'</b> is all of one element ('+dEl+' over its own root): it imposes itself on L1, the casa of the day stem, where the <b>Shi</b> sits. Charged with the day\'s '+dEl+', the Shi GENERATES the Ying <b>'+yg.ramo+'</b> on L'+yg.pos+' — the Qi flows Shi → Ying and the Ying wins its seat → '+dir+'. The mobile ('+mob.ramo+', untimely) is too weak to superimpose itself.';
      return dir;
    }});

  LY_VIE.push({ id:'R6', sezione:'—', nome:'Seasonal gathering with the month',
    dottrina:'The three branches of a seasonal gathering are all present together with the month branch: if above/below are unbalanced, the majority wins. Silent when the mobile is G (§77).',
    test: function (R, ctx, state) {
      var c = _ctx(R);
      var HUI=[{r:['寅','卯','辰'],el:'Wood'},{r:['巳','午','未'],el:'Fire'},
               {r:['申','酉','戌'],el:'Metal'},{r:['亥','子','丑'],el:'Water'}];
      var tutti = {}; R.linee.forEach(function(l){tutti[l.ramo]=true;}); c.bazi.forEach(function(b){tutti[b]=true;});
      var fh = HUI.filter(function (h) { return h.r.every(function(x){return tutti[x];}) && h.r.indexOf(c.Mo)>=0; });
      if (fh.length!==1) return null;
      // §77 (19/08/2026): this way is SILENT when the mobile is G (Official): 95 cards at 45.3% (recent 36%).
      var mobR6 = R.linee[R.mutante.pos-1]; if (mobR6 && mobR6.par==='G') return null;
      var ln = R.linee.filter(function (l) { return l.el===fh[0].el; });
      var b_ = ln.filter(function(l){return l.pos<=3;}).length, a_ = ln.length-b_;
      if (b_===a_) return null;
      state.why = 'Seasonal gathering '+fh[0].r.join('')+' ('+fh[0].el+') complete with the <b>month '+c.Mo+'</b>: '+b_+' lines below vs '+a_+' above → majority.';
      return b_>a_ ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R7_54b', sezione:'§54b', nome:'Month controls the Tai Sui + feeds the Ti',
    dottrina:'The month branch controls the Tai Sui (year) and the mobile\'s arrival would generate the Ti (timely): the Ti is fed by an unstable source → does NOT follow.',
    test: function (R, ctx, state) {
      var c = _ctx(R);
      var A = ctx.corpoEl; if (!A) return null;
      var arrEl2 = WX[R.mutante.ramoArr], yEl = WX[c.Y], moEl = WX[c.Mo];
      if (CTRL[moEl]!==yEl) return null;
      if (!(GEN[arrEl2]===A && c.timely(arrEl2))) return null;
      state.why = 'The <b>month '+c.Mo+'</b> ('+moEl+') controls the <b>Tai Sui '+c.Y+'</b> ('+yEl+'), and the arrival <b>'+R.mutante.ramoArr+'</b> ('+arrEl2+', timely) would feed the Ti ('+A+'): unstable source → does NOT follow the trend.';
      return ctx.emaDir==='up' ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R8_49', sezione:'§49', nome:'Mobile Tai Sui turns into the palace\'s G',
    dottrina:'The mobile is the Tai Sui and its transformation lands in the palace\'s Officer element: its own direction leads.',
    test: function (R, ctx, state) {
      var mob = R.linee[R.mutante.pos-1];
      if (!mob.isTaiSui) return null;
      var arrEl2 = WX[R.mutante.ramoArr], gEl = null;
      var els = ['Wood','Fire','Earth','Metal','Water'];
      for (var i=0;i<els.length;i++) if (CTRL[els[i]]===R.palEl) { gEl = els[i]; break; }
      if (arrEl2 !== gEl) return null;
      state.why = 'The mobile L'+mob.pos+' is the <b>Tai Sui '+mob.ramo+'</b> and turns into <b>'+R.mutante.ramoArr+'</b> ('+arrEl2+'), the Officer element of the palace ('+R.palEl+') → its own seat.';
      return mob.pos<=3 ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R9_51', sezione:'§51', nome:'Mobile enters the tomb of its own element',
    dottrina:'A vibrant (timely) G entering its own tomb goes out → opposite of its seat. A non-vibrant B entering its own tomb goes out → opposite of its seat.',
    test: function (R, ctx, state) {
      var c = _ctx(R);
      var mob = R.linee[R.mutante.pos-1], dep = R.mutante.ramoDep;
      var TOMBA = {Fire:'戌',Water:'辰',Metal:'丑',Wood:'未'};
      var depEl = WX[dep];
      if (TOMBA[depEl] !== R.mutante.ramoArr) return null;
      var vibrante = c.timely(depEl);
      var suo = mob.pos<=3 ? 'SHORT' : 'LONG', opp = suo==='LONG' ? 'SHORT' : 'LONG';
      if (mob.par==='G' && vibrante) { state.why = 'Vibrant <b>G</b> L'+mob.pos+' ('+dep+', '+depEl+') enters its own tomb <b>'+R.mutante.ramoArr+'</b> and goes out → opposite of its seat.'; return opp; }
      if (mob.par==='B' && !vibrante) { state.why = 'Weak <b>B</b> L'+mob.pos+' ('+dep+', '+depEl+') enters its own tomb <b>'+R.mutante.ramoArr+'</b> and goes out → opposite of its seat.'; return opp; }
      return null;
    }});

  LY_VIE.push({ id:'R11_53c', sezione:'§53c', nome:'Timely B on L4 (Ti)',
    dottrina:'With the Yong below, if L4 (in the Ti) is a live, timely B: does NOT follow (a sibling in the Ti drains the trend).',
    test: function (R, ctx, state) {
      var c = _ctx(R);
      var yongBasso = R.mutante.pos<=3;
      var l4 = R.linee[3];
      if (!(yongBasso && l4.par==='B' && c.vivo(l4) && c.timely(l4.el))) return null;
      // Guardia mobile (Edu, 25/08/2026, audit): §53c sbaglia con mobile G. G53CG=off ripristina.
      var mob53c=R.linee[R.mutante.pos-1];
      if ((typeof process==='undefined' || !process.env || process.env.G53CG!=='off') && mob53c.par==='G') return null;
      state.why = 'Yong below; L4 (in the Ti) is a live, timely <b>B '+l4.ramo+'</b> ('+l4.el+') → does NOT follow the trend.';
      return ctx.emaDir==='up' ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R12_53d', sezione:'§53d', nome:'Full timely G in the Ti + a void in the Ti',
    dottrina:'The Ti holds a timely, full G, but also a void line: a breach in the trend → does NOT follow.',
    test: function (R, ctx, state) {
      var c = _ctx(R);
      var yongBasso = R.mutante.pos<=3;
      var tiRange = yongBasso ? [4,5,6] : [1,2,3];
      var tiLinee = R.linee.filter(function(l){return tiRange.indexOf(l.pos)>=0;});
      var gTiPieno = tiLinee.filter(function(l){return l.par==='G' && c.vivo(l) && c.timely(l.el) && !l.vuoto;});
      var tiHaVuoto = tiLinee.some(function(l){return l.vuoto;});
      if (!(gTiPieno.length>=1 && tiHaVuoto)) return null;
      // Guardia mobile (Edu, 25/08/2026): §53d sbaglia quando la mobile e' B o P (indicatori
      // negativi). Scatta solo se la mobile NON e' B/P (G53DMOB=off ripristina il vecchio).
      var mob53d=R.linee[R.mutante.pos-1];
      if ((typeof process==='undefined' || !process.env || process.env.G53DMOB!=='off') &&
          (mob53d.par==='B' || mob53d.par==='P')) return null;
      var vL = tiLinee.filter(function(l){return l.vuoto;}).map(function(l){return 'L'+l.pos+' '+l.ramo;}).join(', ');
      state.why = 'In the Ti (L'+tiRange.join('/')+'): timely full <b>G '+gTiPieno[0].ramo+'</b> but also a <b>void</b> line ('+vL+', void branches '+R.vuoti.join(' ')+') → breach → does NOT follow the trend.';
      return ctx.emaDir==='up' ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R13_52', sezione:'§52', nome:'Who does not win, loses (failed action)',
    dottrina:'The mobile\'s action fails — return-control or self-combination: it does not carry its direction, read the opposite. (Arrival clashed by the day removed, §76.)',
    test: function (R, ctx, state) {
      var c = _ctx(R);
      var mob = R.linee[R.mutante.pos-1];
      var huitou = R.mutante.casoMut===3;
      var autoc = mob.stato==='autocombinata';
      // §76 (19/08/2026): il sotto-caso "arrival clashed by the day" e' stato TOLTO (211 carte, 49,8%): il clash del giorno attiva la mobile (§74), non fa fallire l'azione.
      if (!(huitou || autoc)) return null;
      // Guardia mobile (Edu, 25/08/2026, audit): §52 sbaglia con mobile B (兄弟). G52B=off ripristina.
      if ((typeof process==='undefined' || !process.env || process.env.G52B!=='off') && mob.par==='B') return null;
      var suo = mob.pos<=3 ? 'SHORT' : 'LONG';
      var why = huitou ? 'return-control: the arrival <b>'+R.mutante.ramoArr+'</b> controls the departure '+R.mutante.ramoDep : 'self-combination '+R.mutante.ramoDep+'+'+R.mutante.ramoArr;
      state.why = 'The action of the mobile L'+mob.pos+' <b>'+mob.par+'</b> fails ('+why+'): it does not carry its direction → opposite of its seat.';
      return suo==='LONG' ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R56_117', sezione:'§117', coda:true, cablata:'2026-08-28',
    nome:'Trine held line clashed by the whole month pillar: the released Qi feeds the W (tail)',
    dottrina:'Edu (28/08/2026, guide card GBPUSD 02/07/2025, seme 137, month 壬午, day 壬申, hour 甲辰): a FIXED line sits at the centre of a COMPLETE 三合 whose other two members come from the date branches (here L1 子 C with 申 of the day and 辰 of the hour: the water trine 申子辰). The WHOLE MONTH PILLAR arrives on that line to clash it — the clash is effective because the month STEM is of the same element as the BEAST on the line (壬 Water, 玄武 Water), the certified "steli filone 2" channel. The clash does not destroy the accumulated Qi: it releases it, and all that element flows to the line it GENERATES. If the fed line is a W, the W is nourished and wins its seat (below → SHORT, above → LONG). The Qi is not stopped (no capannello) because the clash sends it on: the runner crosses the street, one looks where he goes. TAIL RULE: cabled at doctrinal certification, FROZEN at birth, judged by the tail class row. Removed only by a card that falsifies it in its perimeter with no other explanation. VIA117=off to disable.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.VIA117==='off') return null;
      if (!R.monthBranch || !R.monthStem && !(ctx && ctx.monthStem)) return null;
      var mStem = R.monthStem || (ctx && ctx.monthStem);
      if (!mStem) return null;
      var SEs = {'甲':'Wood','乙':'Wood','丙':'Fire','丁':'Fire','戊':'Earth','己':'Earth','庚':'Metal','辛':'Metal','壬':'Water','癸':'Water'};
      var BEL = {'青龍':'Wood','朱雀':'Fire','勾陳':'Earth','螣蛇':'Earth','白虎':'Metal','玄武':'Water'};
      var TRI = [['申','子','辰'],['亥','卯','未'],['寅','午','戌'],['巳','酉','丑']];
      var cal = [R.yearBranch, R.monthBranch, R.dayBranch, ctx && ctx.oraBranch].filter(function(b){return !!b;});
      for (var i=0;i<R.linee.length;i++){
        var l = R.linee[i];
        if (l.isMobile || l.vuoto) continue;
        if (CLASH[R.monthBranch] !== l.ramo) continue;                  // the month branch clashes this line
        if (!l.bestia || BEL[l.bestia.cn] !== SEs[mStem]) continue;     // month stem = element of the line's beast → the clash operates
        var hit = null;
        for (var k=0;k<TRI.length;k++){ var t = TRI[k];
          if (t.indexOf(l.ramo) < 0) continue;
          var altri = t.filter(function(x){ return x !== l.ramo; });
          if (altri.every(function(x){ return cal.indexOf(x) >= 0; })) { hit = t; break; }
        }
        if (!hit) continue;                                             // line at the centre of a full trine from the date
        var nutrita = null;
        for (var j=0;j<R.linee.length;j++){ var q = R.linee[j];
          if (q.pos === l.pos || q.vuoto) continue;
          if (q.par === 'W' && GEN[l.el] === q.el) { nutrita = q; break; }
        }
        if (!nutrita) continue;                                         // the released Qi must find a W to feed
        var dir = nutrita.pos<=3 ? 'SHORT' : 'LONG';
        state.why = 'L'+l.pos+' <b>'+l.par+' '+l.ramo+'</b> sits at the centre of the complete trine <b>'+hit.join('')+'</b> (the other two members come from the date). The whole month pillar <b>'+mStem+R.monthBranch+'</b> arrives to clash it and the clash operates (the month stem '+mStem+' is of the same element as the beast '+l.bestia.cn+' on the line). The clash releases the accumulated Qi, which flows onto the <b>W '+nutrita.ramo+'</b> on L'+nutrita.pos+': the W is fed and wins its seat → '+dir+'.';
        return dir;
      }
      return null;
    }});

  LY_VIE.push({ id:'R14_50de', sezione:'§50d/e', nome:'Combination of the target: generative/destructive',
    dottrina:'The mobile\'s arrival combines a fixed, full target. If DESTRUCTIVE (control): only the Tai Sui completes it (opposite of the target\'s seat); two weak ones bind and carry the target\'s seat. If GENERATIVE: the Tai Sui always carries it; otherwise only if the target is timely.',
    test: function (R, ctx, state) {
      var c = _ctx(R);
      var mob = R.linee[R.mutante.pos-1];
      var arr = R.mutante.ramoArr, part = COMBINA[arr];
      if (!part) return null;
      var tgt = R.linee.filter(function(l){return l.pos!==mob.pos && l.ramo===part;});
      if (tgt.length!==1 || tgt[0].vuoto) return null;
      var t = tgt[0], dirB = t.pos<=3 ? 'SHORT' : 'LONG';
      var aEl = WX[arr], tEl = WX[t.ramo];
      if (CTRL[aEl]===tEl) {
        var aTim = c.timely(aEl), tTim = c.timely(tEl);
        if (aTim && tTim && mob.isTaiSui) { state.why = 'The <b>Tai Sui</b> mobile arrives in <b>'+arr+'</b> and combines L'+t.pos+' <b>'+t.par+' '+t.ramo+'</b> destructively (both timely): the destruction is completed → opposite of the target\'s seat.'; return dirB==='LONG' ? 'SHORT' : 'LONG'; }
        if (!aTim && !tTim) { state.why = 'The arrival <b>'+arr+'</b> combines L'+t.pos+' <b>'+t.par+' '+t.ramo+'</b> destructively, both weak: they bind → the target\'s seat carries.'; return dirB; }
        return null;
      } else {
        if (mob.isTaiSui) { state.why = 'The <b>Tai Sui</b> mobile arrives in <b>'+arr+'</b> and combines L'+t.pos+' <b>'+t.par+' '+t.ramo+'</b> generatively → the target\'s seat.'; return dirB; }
        if (c.timely(tEl)) { state.why = 'The arrival <b>'+arr+'</b> combines the timely L'+t.pos+' <b>'+t.par+' '+t.ramo+'</b> generatively → the target\'s seat.'; return dirB; }
        return null;
      }
    }});

  LY_VIE.push({ id:'R16_50f', sezione:'§50f', nome:'Arrival generates a timely/strong W',
    dottrina:'The arrival generates one or more fixed W lines that are timely or strong (backed by day/year): direction of the majority (above/below).',
    test: function (R, ctx, state) {
      var c = _ctx(R);
      var mob = R.linee[R.mutante.pos-1];
      // Guardia movimento nullo (Edu, 25/08/2026, audit): la via agisce sull'ARRIVO, ma col
      // movimento nullo (caso -1, mobile sospesa dal giorno) l'arrivo non agisce. G50FC1=off ripristina.
      if ((typeof process==='undefined' || !process.env || process.env.G50FC1!=='off') && R.mutante.casoMut===-1) return null;
      var arr = R.mutante.ramoArr, aEl = WX[arr];
      var forte = function(el){ return WX[c.D]===el || GEN[WX[c.D]]===el || WX[c.Y]===el || GEN[WX[c.Y]]===el; };
      var tgt = R.linee.filter(function(l){return l.pos!==mob.pos && l.par==='W' && GEN[aEl]===l.el;});
      if (!tgt.length) return null;
      var basso = tgt.filter(function(l){return l.pos<=3;}).length, alto = tgt.length-basso;
      if (basso===alto) return null;
      if (!tgt.some(function(l){return c.timely(l.el) || forte(l.el);})) return null;
      state.why = 'The arrival <b>'+arr+'</b> ('+aEl+') generates the <b>W</b> line(s) '+tgt.map(function(l){return 'L'+l.pos+' '+l.ramo;}).join(', ')+' (timely or backed by day '+c.D+'/year '+c.Y+') → majority seat.';
      return basso>alto ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R17_50g', sezione:'§50g', nome:'Double combination binds below',
    dottrina:'The arrival combines a branch present on two fixed, full lines split above/below: the bond is completed below → SHORT.',
    test: function (R, ctx, state) {
      var mob = R.linee[R.mutante.pos-1];
      // Guardia movimento nullo (Edu, 25/08/2026, audit): stessa ragione di §50f — l'arrivo non
      // agisce quando il movimento e' nullo (caso -1). G50GC1=off ripristina.
      if ((typeof process==='undefined' || !process.env || process.env.G50GC1!=='off') && R.mutante.casoMut===-1) return null;
      var arr = R.mutante.ramoArr, part = COMBINA[arr];
      if (!part) return null;
      var tgt = R.linee.filter(function(l){return l.pos!==mob.pos && l.ramo===part && !l.vuoto;});
      if (tgt.length<2) return null;
      var basso = tgt.filter(function(l){return l.pos<=3;}).length, alto = tgt.length-basso;
      if (!(basso>0 && alto>0)) return null;
      state.why = 'The arrival <b>'+arr+'</b> combines <b>'+part+'</b>, present on '+tgt.map(function(l){return 'L'+l.pos;}).join(' and ')+' (above and below): the bond is completed below → SHORT.';
      return 'SHORT';
    }});

  LY_VIE.push({ id:'R18_50h', sezione:'§50h', nome:'Void hidden line clashed by the arrival',
    dottrina:'The arrival clashes the (void) hidden line of a single fixed line: with ≥2 supports (season + day + year) it leaves the void and acts in its seat; with 0 supports the clash breaks it → opposite.',
    test: function (R, ctx, state) {
      var c = _ctx(R);
      // PRINCIPIO GENERALE (Edu, 24/08/2026, da EURJPY 12/02/2025): in GENERAZIONE DI
      // RITORNO (回頭生, caso 1) l'arrivo e' tutto preso dal tornare dalla madre e NON
      // agisce altrove: nessun clash suo su una linea distante ha voce.
      // Audit: ARRLIB=off ripristina il comportamento precedente.
      if (R.mutante.casoMut === 1 && !(typeof process !== 'undefined' && process.env && process.env.ARRLIB === 'off')) return null;
      var mob = R.linee[R.mutante.pos-1];
      var arr = R.mutante.ramoArr;
      var host = R.linee.filter(function(l){return l.pos!==mob.pos && l.fushen && CLASH[arr]===l.fushen.b;});
      if (host.length!==1) return null;
      var h = host[0], fu = h.fushen;
      if (R.vuoti.indexOf(fu.b)<0) return null;
      var wang = fu.el===WX[c.Mo] || fu.b===c.Mo;
      var dSup = GEN[WX[c.D]]===fu.el || WX[c.D]===fu.el;
      var ySup = GEN[WX[c.Y]]===fu.el || WX[c.Y]===fu.el;
      var nSup = (wang?1:0)+(dSup?1:0)+(ySup?1:0);
      var dirH = h.pos<=3 ? 'SHORT' : 'LONG';
      var supTxt = (wang?'month ':'')+(dSup?'day ':'')+(ySup?'year':'');
      if (nSup>=2) { state.why = 'The arrival <b>'+arr+'</b> clashes the <b>void</b> hidden <b>'+fu.par+' '+fu.b+'</b> under L'+h.pos+'; with '+nSup+' supports ('+supTxt.trim()+') it leaves the void → seat of L'+h.pos+'.'; return dirH; }
      if (nSup===0) { state.why = 'The arrival <b>'+arr+'</b> clashes the <b>void</b> hidden <b>'+fu.par+' '+fu.b+'</b> under L'+h.pos+' with no support: broken → opposite of L'+h.pos+'\'s seat.'; return dirH==='LONG' ? 'SHORT' : 'LONG'; }
      return null;
    }});

  LY_VIE.push({ id:'R21_50k', sezione:'§50k', nome:'The day breaks the Tai Sui\'s combination',
    dottrina:'The day clashes the year branch (Tai Sui): if a single fixed line combines the Tai Sui, that line\'s seat flips.',
    test: function (R, ctx, state) {
      var c = _ctx(R);
      if (CLASH[c.D]!==c.Y) return null;
      var part = COMBINA[c.Y];
      var tgt = R.linee.filter(function(l){return l.ramo===part && !l.isMobile;});
      if (tgt.length!==1) return null;
      var dirT = tgt[0].pos<=3 ? 'SHORT' : 'LONG';
      state.why = 'The <b>day '+c.D+'</b> clashes the <b>Tai Sui '+c.Y+'</b>; L'+tgt[0].pos+' <b>'+tgt[0].par+' '+tgt[0].ramo+'</b> combined the Tai Sui and loses it → its seat flips.';
      return dirT==='LONG' ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R22_50kbis', sezione:'§50k-bis', nome:'Live P drains a strong hidden G',
    dottrina:'A live P generates (drains) its own hidden G, and that G is strong (timely or backed by day/year): direction of the P\'s seat.',
    test: function (R, ctx, state) {
      var c = _ctx(R);
      var cand = R.linee.filter(function(l){return l.par==='P' && c.vivo(l) && l.fushen && l.fushen.par==='G' && GEN[l.fushen.el]===l.el;});
      if (cand.length!==1) return null;
      var fu = cand[0].fushen;
      var gForte = c.timely(fu.el) || WX[c.D]===fu.el || GEN[WX[c.D]]===fu.el || WX[c.Y]===fu.el;
      if (!gForte) return null;
      state.why = 'Live <b>P</b> L'+cand[0].pos+' ('+cand[0].ramo+') drains its strong hidden <b>G '+fu.b+'</b> → the P\'s seat.';
      return cand[0].pos<=3 ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R20_50j', sezione:'§50j', nome:'Two B split, the strengthened one heals its section',
    dottrina:'Two B, one above and one below: if the mobile is a strengthened B (return-generation/same element or advancing), it heals its own section.',
    test: function (R, ctx, state) {
      if (state.oraNeutra) return null;   // FILTROORA (P/B sulla partenza=ora, spento di default)
      var mob = R.linee[R.mutante.pos-1];
      var Bs = R.linee.filter(function(l){return l.par==='B';});
      var bB = Bs.filter(function(l){return l.pos<=3;}), bA = Bs.filter(function(l){return l.pos>3;});
      if (!(bB.length===1 && bA.length===1 && mob.par==='B' &&
        (R.mutante.casoMut===1 || R.mutante.progressione==='avanzante'))) return null;
      state.why = 'Two <b>B</b> split (L'+bB[0].pos+' below, L'+bA[0].pos+' above); the mobile B L'+mob.pos+' is strengthened ('+(R.mutante.casoMut===1?'return-generation':'advancing')+') → its own section.';
      return mob.pos<=3 ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R39_97', sezione:'§97', coda:true, cablata:'2026-08-25',
    nome:'W in dark movement (暗動) with a void arrival: who does not win, loses',
    dottrina:'Edu (25/08/2026, guide card GBPUSD 27/11/2024, seme 125): a W woken into dark movement (暗動) by the day clash tries to advance, but its arrival is in the void (旬空): the void arrival does not act — the W cannot win, and who does not win loses → its seat loses → OPPOSITE seat. Measure at cabling: n 21 · 57.1% · +328 · rec 63 (16) / vec 40 (5, thin). PRIORITY ABOVE §50i (Edu, 25/08/2026): the action of the W, even a failed one, precedes the background of the empty floor; swap measured: 1 straightened (+107, the guide) / 1 broken (-52, USDJPY 30/03/2021, to vet). TAIL RULE, frozen. VIA97=off to disable.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.VIA97==='off') return null;
      if (!R.anDong) return null;
      for (var p in R.anDong) {
        var l=R.linee[p-1];
        if (l && l.par==='W' && R.vuoti.indexOf(R.anDong[p].arr)>=0) {
          var seat = l.pos<=3 ? 'LONG' : 'SHORT';
          state.why = 'The <b>W</b> L'+l.pos+' ('+l.ramo+') is in dark movement (暗動) but its arrival <b>'+R.anDong[p].arr+'</b> is void: the void does not receive — the W cannot win, who does not win loses → '+seat+'.';
          return seat;
        }
      }
      return null;
    }});

  LY_VIE.push({ id:'R40_98', sezione:'§98', coda:true, cablata:'2026-08-25',
    nome:'The day arrives on the line and generates the hidden P',
    dottrina:'Edu (25/08/2026, guide card EURJPY 10/08/2023, seme 157): the day combines (六合) a fixed line and its branch GENERATES the element of the hidden P (伏神) beneath it: the P wakes up charged, and an active P makes its own team lose → the hosting trigram falls → seat OPPOSITE to the hosting line. (Full column: in the guide 庚 generates 子 generates 卯.) Measure at cabling: n 6 · 5/6 · +256 (rec 5/5 · vec 0/1, loser USDCHF 13/12/2022 to vet). Calendar rarity; TAIL RULE, frozen. PRIORITY ABOVE §50i (Edu, 25/08/2026): whoever touches the day precedes the background of the empty floor; swap measured: 1 straightened (+113, the guide) / 0 broken, S17 58.97 -> 59.00. VIA98=off to disable.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.VIA98==='off') return null;
      for (var i=0;i<R.linee.length;i++) { var l=R.linee[i];
        if (l.isMobile) continue;
        if (COMBINA[R.dayBranch]!==l.ramo) continue;
        if (!l.fushen || l.fushen.par!=='P') continue;
        if (GEN[WX[R.dayBranch]]!==WX[l.fushen.b]) continue;
        var seat = l.pos<=3 ? 'LONG' : 'SHORT';
        state.why = 'The day <b>'+R.dayBranch+'</b> arrives on L'+l.pos+' ('+l.ramo+', 六合) and generates the hidden <b>P '+l.fushen.b+'</b>: the P wakes charged, and an active P makes its own team lose → the hosting trigram falls → '+seat+'.';
        return seat;
      }
      return null;
    }});

  // §50i CANCELLATA (Edu, 26/08/2026, da USDJPY 02/08/2022): regola puramente strutturale
  // ("il pavimento cede") cieca a bestie e flusso degli steli. Falsificata nel suo perimetro:
  // la mobile B 亥 muta in G 戌 (la B diventa Ufficiale) e fa vincere la propria squadra → LONG,
  // ma §50i imponeva SHORT (-181). Superata dalla dottrina nuova. Spenta di default.
  // Audit: VIA50I=1 la ripristina.
  if (typeof process !== 'undefined' && process.env && process.env.VIA50I === '1')
  LY_VIE.push({ id:'R19_50i', sezione:'§50i', nome:'Lower trigram entirely void',
    dottrina:'All branches of the lower trigram (Houtian palace) are void: the floor gives way → SHORT.',
    test: function (R, ctx, state) {
      if (!HOUTIAN[R.inf].every(function(b){return R.vuoti.indexOf(b)>=0;})) return null;
      state.why = 'The lower trigram palace ('+HOUTIAN[R.inf].join(' ')+') is entirely <b>void</b> (void branches '+R.vuoti.join(' ')+') → the floor gives way → SHORT.';
      return 'SHORT';
    }});

  LY_VIE.push({ id:'R23_55', sezione:'§55', nome:'Mobile P: arrival clashes the fixed Tai Sui',
    dottrina:'A mobile P whose ARRIVAL clashes the fixed Tai Sui (year branch): the trend of the Tai Sui\'s seat breaks (TS below → market RISES/LONG, TS above → market FALLS/SHORT). If the day combines the Tai Sui it is defended: silent. Subordinate to G and W (precedence rule).',
    test: function (R, ctx, state) {
      if (state.oraNeutra) return null;
      var mob = R.linee[R.mutante.pos-1];
      if (mob.par!=='P') return null;
      var tsL = R.linee.filter(function(l){return l.isTaiSui && !l.isMobile;});
      if (tsL.length!==1) return null;
      var ts = tsL[0];
      // PRINCIPIO GENERALE (Edu, 24/08/2026, da EURJPY 12/02/2025): in GENERAZIONE DI
      // RITORNO (回頭生, caso 1) l'arrivo e' tutto preso dal tornare dalla madre e NON
      // agisce altrove: nessun clash suo su una linea distante ha voce.
      // Audit: ARRLIB=off ripristina il comportamento precedente.
      if (R.mutante.casoMut === 1 && !(typeof process !== 'undefined' && process.env && process.env.ARRLIB === 'off')) return null;
      if (!(CLASH[R.mutante.ramoArr]===ts.ramo && COMBINA[R.dayBranch]!==ts.ramo)) return null;
      state.why = 'Mobile <b>P</b> L'+mob.pos+' arrives in <b>'+R.mutante.ramoArr+'</b>, which clashes the fixed <b>Tai Sui '+ts.ramo+'</b> on L'+ts.pos+' (not defended by the day '+R.dayBranch+'): the trend of the Tai Sui\'s seat breaks → '+(ts.pos<=3?'below → market rises':'above → market falls')+'.';
      return ts.pos<=3 ? 'LONG' : 'SHORT';
    }});

  LY_VIE.push({ id:'R24_56', sezione:'§56', nome:'Arrival combines a void Tai Sui, hostile departure carried',
    dottrina:'The ARRIVAL combines a fixed VOID Tai Sui, and the DEPARTURE (carried onto it) is hostile — clashes or controls it: the Tai Sui\'s seat does not hold.',
    test: function (R, ctx, state) {
      if (state.oraNeutra) return null;
      var tsL = R.linee.filter(function(l){return l.isTaiSui && !l.isMobile && l.vuoto;});
      if (tsL.length!==1) return null;
      var ts = tsL[0];
      var A = R.mutante.ramoDep, Bb = R.mutante.ramoArr;
      if (!(COMBINA[Bb]===ts.ramo && (CLASH[A]===ts.ramo || CTRL[WX[A]]===ts.el))) return null;
      state.why = 'The arrival <b>'+Bb+'</b> combines the <b>void Tai Sui '+ts.ramo+'</b> on L'+ts.pos+', and the departure <b>'+A+'</b> carried onto it is hostile ('+(CLASH[A]===ts.ramo?'clash':'control')+') → the Tai Sui\'s seat does not hold.';
      return ts.pos<=3 ? 'LONG' : 'SHORT';
    }});

  LY_VIE.push({ id:'R25_58', sezione:'§58', nome:'Fixed G on the day branch',
    dottrina:'A fixed G sits on the day branch: the market does NOT follow the trend. Silent if the mobile or the hour combines the day, or if the mobile is a W (W commands). Mode: ti+yong (default, full effect) or ti-only.',
    opts: { ggiornovia: 'ti+yong' },
    test: function (R, ctx, state) {
      var mob = R.linee[R.mutante.pos-1];
      var gs = R.linee.filter(function(l){return l.par==='G' && !l.isMobile && l.ramo===R.dayBranch;});
      if (!(gs.length===1 && mob.par!=='W')) return null;
      var g = gs[0];
      var legMob = COMBINA[R.mutante.ramoArr]===R.dayBranch;
      var legOra = ctx.oraBranch && COMBINA[ctx.oraBranch]===R.dayBranch;
      var gInTi = (g.pos<=3) !== (R.linea<=3);
      var modo = (state.opts && state.opts.ggiornovia) || 'ti+yong';
      var passa = modo==='off' ? false : modo==='ti+yong' ? true : gInTi;
      if (!(!legMob && !legOra && passa)) return null;
      state.why = 'Fixed <b>G</b> L'+g.pos+' sits on the <b>day branch '+R.dayBranch+'</b> ('+(gInTi?'in the Ti':'in the Yong')+'), not combined by the mobile or the hour → the market does NOT follow the trend.';
      return ctx.emaDir==='up' ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R26_59', sezione:'§59', nome:'Mobile P departing from a day spirit',
    dottrina:'A mobile P whose DEPARTURE is a spirit of the day (Month General, Ding, Post Horse): the General amplifies the G-drainer\'s nature → the market does NOT follow the trend.',
    opts: { genvia: 'spiriti' },
    test: function (R, ctx, state) {
      var mob = R.linee[R.mutante.pos-1];
      if (mob.par!=='P') return null;
      var gen = state.gen !== undefined ? state.gen : (state.gen = generaleDelMese(ctx.date));
      var A = R.mutante.ramoDep;
      var modo = (state.opts && state.opts.genvia) || 'spiriti';
      var colpisce = gen && A===gen;
      if (modo==='spiriti') {
        var ding = dingSpirit(R.dayStem, R.dayBranch);
        var cav = postHorseDelGiorno(R.dayBranch);
        colpisce = colpisce || A===ding || A===cav;
      }
      if (!colpisce) return null;
      var who = (gen && A===gen) ? 'Month General' : (A===dingSpirit(R.dayStem, R.dayBranch)) ? 'Ding spirit' : 'Post Horse';
      state.why = 'Mobile <b>P</b> L'+mob.pos+' departs from <b>'+A+'</b> = <b>'+who+'</b> of the day: the spirit amplifies the G-drainer → the market does NOT follow the trend.';
      return ctx.emaDir==='up' ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R27_63', sezione:'§63', nome:'Return-generation blocked: go where the action is',
    dottrina:'The mobile is weak (not timely) — or timely but BESIEGED by a seasonal gathering / triple combination of the element that controls it (§63-bis) — and its arrival would generate it back (return-generation, case 1), but the arrival is busy clashing a single fixed line that is STRONG (timely or backed by day/year): the return-generation does not happen, and by lack of a better priority the clashed line becomes the decider → its seat. Doctrinal pillar (Edu 17/08, from EURJPY 06/02/2025); 17 cards, 70.6%, both periods aligned; below statistical threshold, fixed by doctrine. Evaluated last (only if every other rule is silent).',
    test: function (R, ctx, state) {
      // RIMOSSA (Edu, 24/08/2026, da EURJPY 12/02/2025): "la relazione fra arrivo e
      // partenza sulla stessa linea e' molto piu' intima del rapporto con una linea
      // lontana". In 回頭生 l'arrivo e' tutto preso dal tornare dalla madre e NON fa
      // altro: nessun clash su una linea distante puo' impedire la generazione di
      // ritorno. Ripristino per audit: VIA63ON=1.
      if (!(typeof process !== 'undefined' && process.env && process.env.VIA63ON === '1')) return null;
      var c = _ctx(R);
      var mob = R.linee[R.mutante.pos-1];
      if (R.mutante.casoMut !== 1) return null;
      // §63-bis (17/08/2026): the mobile is disabled also when timely but BESIEGED by a seasonal
      // gathering / triple combination (fixed lines + day/month/year) of the element that controls it.
      var HUI=[{r:['寅','卯','辰'],el:'Wood'},{r:['巳','午','未'],el:'Fire'},{r:['申','酉','戌'],el:'Metal'},{r:['亥','子','丑'],el:'Water'}];
      var HE =[{r:['寅','午','戌'],el:'Fire'},{r:['申','子','辰'],el:'Water'},{r:['巳','酉','丑'],el:'Metal'},{r:['亥','卯','未'],el:'Wood'}];
      var pool = {}; R.linee.forEach(function(l){ if(!l.isMobile) pool[l.ramo]=true; }); pool[c.D]=true; pool[c.Mo]=true; pool[c.Y]=true;
      var ctrlEl = null; for (var e in CTRL) if (CTRL[e]===mob.el) ctrlEl = e;
      var raduno = null;
      HUI.concat(HE).forEach(function(h){ if (!raduno && h.el===ctrlEl && h.r.every(function(x){return pool[x];})) raduno = h; });
      var debole = !c.timely(mob.el);
      if (!debole && !raduno) return null;
      var arr = R.mutante.ramoArr;
      var tgt = R.linee.filter(function(l){ return !l.isMobile && CLASH[arr]===l.ramo; });
      if (tgt.length !== 1) return null;
      var t = tgt[0];
      var supp = function(el){ return WX[c.D]===el || GEN[WX[c.D]]===el || WX[c.Y]===el || GEN[WX[c.Y]]===el; };
      if (!(c.timely(t.el) || supp(t.el))) return null;
      var motivo = debole ? 'weak' : 'besieged';
      if (raduno) motivo += (debole ? ' and ' : '') + 'besieged by the <b>'+raduno.el+' gathering '+raduno.r.join('')+'</b> (fixed lines + day/month/year) that controls it';
      state.why = 'The '+motivo+' mobile <b>'+mob.par+'</b> L'+mob.pos+' ('+R.mutante.ramoDep+') would be generated back by its arrival <b>'+arr+'</b>, but the arrival is busy clashing the strong fixed <b>'+t.par+' '+t.ramo+'</b> on L'+t.pos+': the return-generation does not happen, the clashed line decides → its seat ('+(t.pos<=3?'below → SHORT':'above → LONG')+').';
      return t.pos<=3 ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R28_64', sezione:'§64', nome:'Residual priority: G and W silent → strongest P or C decides',
    dottrina:'Precedence principle (Edu, 16-17/08): G and W speak first; P, B, C are read only when G and W do not speak. When no G or W is alive, full and (timely or mobile), the strongest remaining line among P and C — unique by strength score (timely, Tai Sui, = month, = day, backed by the day) — becomes the decider → its seat (below → SHORT, above → LONG). A residual B never decides (42% — against). Measured last in the thermometer: 116 cards, 56.0%, both periods aligned; P+C ≈ 58%. From AUDUSD 07/03/2023 (C Tai Sui on Ying, month branch, Ding, all else bound/void).',
    test: function (R, ctx, state) {
      var c = _ctx(R);
      var attiva = function (l) { return c.vivo(l) && !l.vuoto; };
      var gw = R.linee.filter(function (l) { return l.par==='G' || l.par==='W'; });
      var gwParla = gw.some(function (l) { return attiva(l) && (c.timely(l.el) || l.isMobile); });
      if (gwParla) return null;
      var forza = function (l) { return (c.timely(l.el)?1:0)+(l.isTaiSui?1:0)+(l.ramo===c.Mo?1:0)+(l.ramo===c.D?1:0)+((WX[c.D]===l.el||GEN[WX[c.D]]===l.el)?1:0); };
      var resto = R.linee.filter(function (l) { return l.par!=='G' && l.par!=='W' && attiva(l); });
      if (!resto.length) return null;
      var maxF = Math.max.apply(null, resto.map(forza));
      var top = resto.filter(function (l) { return forza(l)===maxF; });
      if (top.length !== 1) return null;
      var dec = top[0];
      if (dec.par === 'B') return null;
      // Guardia mobile (Edu, 25/08/2026, audit): §64 sbaglia con mobile B. G64B=off ripristina.
      if ((typeof process==='undefined' || !process.env || process.env.G64B!=='off') && R.linee[R.mutante.pos-1].par==='B') return null;
      var tags = []; if (c.timely(dec.el)) tags.push('timely'); if (dec.isTaiSui) tags.push('Tai Sui'); if (dec.ramo===c.Mo) tags.push('= month'); if (dec.ramo===c.D) tags.push('= day'); if (WX[c.D]===dec.el||GEN[WX[c.D]]===dec.el) tags.push('backed by the day');
      state.why = 'No <b>G</b> or <b>W</b> speaks (all bound, void, broken, hidden or weak). By residual priority the strongest remaining line is <b>'+dec.par+' '+dec.ramo+'</b> on L'+dec.pos+(dec.isShi?' (Shi)':dec.isYing?' (Ying)':'')+' ['+tags.join(', ')+'] → its seat ('+(dec.pos<=3?'below → SHORT':'above → LONG')+').';
      return dec.pos<=3 ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R37_94', sezione:'§94', coda:true, cablata:'2026-08-25',
    nome:'Suspended B cannot advance, cannot lose (tail)',
    dottrina:'Edu (25/08/2026, guide card USDJPY 24/02/2026, seme 154): a mobile B whose ARRIVAL is combined (六合) by the DAY branch (trapped arrival) cannot complete its movement; since the malus of the B ("the B makes its own team lose") requires the action to be completed, the suspended B cannot harm its trigram → its seat wins (B above → LONG, B below → SHORT). Same principle as the case -1 guards (with null movement the action does not act), applied to the B malus. TAIL RULE: cabled at low n by doctrine, FROZEN at birth, judged in aggregate by the tail class row. PRIORITY ABOVE §65 (Edu, 25/08/2026): §65 is a fallback for when nothing acts, but a suspended B IS a readable action — the reading of the mobile precedes the fallback on the Ying; swap measured: 4 straightened (+497) vs 2 lost (-201), both periods improve. Measure at cabling: n 48 · 60.4% · +804 pip · periods 61/60 (seat above 69.6%/23, seat below 52.0%/25 — asymmetry noted, rule kept SYMMETRIC per doctrine). Removed only by a card that falsifies it in its perimeter with no other explanation. VIA94=off to disable.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.VIA94==='off') return null;
      var mob = R.linee[R.mutante.pos-1];
      if (mob.par !== 'B') return null;
      if (COMBINA[R.dayBranch] !== R.mutante.ramoArr) return null;   // trapped arrival: the day combines it
      var seat = mob.pos<=3 ? 'SHORT' : 'LONG';
      state.why = 'The mobile <b>B</b> L'+mob.pos+' ('+R.mutante.ramoDep+'→'+R.mutante.ramoArr+') is trapped: the day <b>'+R.dayBranch+'</b> combines (六合) its arrival — the B cannot advance, so it cannot make its own team lose → its seat holds → '+seat+'.';
      return seat;
    }});

  LY_VIE.push({ id:'R54_115', sezione:'§115', coda:true, cablata:'2026-08-28',
    nome:'B/P with trapped DEPARTURE stays seated and makes its own team lose (tail)',
    dottrina:'Edu (28/08/2026, guide card USDCAD 17/06/2025, seme 135): a mobile B or P whose DEPARTURE is combined (六合) by the DAY branch cannot leave its seat — the movement does not conclude and the line remains FULLY SEATED as its departing character. A still B or P is the negative indicator in its own trigram: it makes its own team lose (seat below → LONG, seat above → SHORT). MIRROR of §94: there the ARRIVAL is trapped, the action never completes and the malus cannot strike (seat wins); here the DEPARTURE is trapped, the B/P never even leaves, and the malus strikes in full (seat loses). Extended to P by Edu at cabling ("mobile B e P fanno perdere la propria squadra, non solo B"). TAIL RULE: cabled at doctrinal certification, FROZEN at birth, judged in aggregate by the tail class row. Removed only by a card that falsifies it in its perimeter with no other explanation. VIA115=off to disable.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.VIA115==='off') return null;
      var mob = R.linee[R.mutante.pos-1];
      if (mob.par !== 'B' && mob.par !== 'P') return null;
      if (COMBINA[R.dayBranch] !== R.mutante.ramoDep) return null;   // trapped departure: the day combines it
      if (R.mutante.casoMut !== -1) return null;                     // must be the CENTRAL day-suspension (caso -1), which already embeds the guard: a day bound (六合) by the month cannot combine/clash any line (Edu 21/08/2026) and cannot trap the departure
      var seat = mob.pos<=3 ? 'LONG' : 'SHORT';
      state.why = 'The mobile <b>'+mob.par+'</b> L'+mob.pos+' ('+R.mutante.ramoDep+'→'+R.mutante.ramoArr+') has its DEPARTURE trapped: the day <b>'+R.dayBranch+'</b> combines (六合) '+R.mutante.ramoDep+' — the '+mob.par+' stays fully seated and makes its own team lose → '+(mob.pos<=3?'below loses → LONG':'above loses → SHORT')+'.';
      return seat;
    }});

  LY_VIE.push({ id:'R55_116', sezione:'§116', coda:true, cablata:'2026-08-28',
    nome:'The whole day pillar arrives on L1 and blocks the fixed B in place: its team loses (tail)',
    dottrina:'Edu (28/08/2026, guide card EURUSD 10/12/2025, seme 116, day 癸丑): the DAY STEM has its casa on L1 by construction of the stem ladder; when it is ROOTED in the date branches AND the DAY BRANCH combines (六合) the branch of a FIXED, non-void B on L1, the WHOLE day pillar arrives on L1 and BLOCKS the B in place. A B held still makes its own team lose → the lower side loses → LONG. This is the pillar channel already certified for the mobile (guide EURGBP 03/06/2020: "il giorno intero cade sulla linea: non la sospende, la carica"): the whole pillar arriving by casa+root OVERRIDES the guard of the day bound by the month — the pillar lands on the line even when the day branch alone could not touch any line. TAIL RULE: cabled at doctrinal certification, FROZEN at birth, judged by the tail class row. Removed only by a card that falsifies it in its perimeter with no other explanation. VIA116=off to disable.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.VIA116==='off') return null;
      var l1 = R.linee[0];
      if (l1.isMobile || l1.par!=='B' || l1.vuoto) return null;
      if (!R.dayStem || !R.dayBranch) return null;
      if (COMBINA[R.dayBranch] !== l1.ramo) return null;             // the day branch combines L1's branch
      var SEs = {'甲':'Wood','乙':'Wood','丙':'Fire','丁':'Fire','戊':'Earth','己':'Earth','庚':'Metal','辛':'Metal','壬':'Water','癸':'Water'};
      var WXb = {'寅':'Wood','卯':'Wood','巳':'Fire','午':'Fire','辰':'Earth','丑':'Earth','戌':'Earth','未':'Earth','申':'Metal','酉':'Metal','亥':'Water','子':'Water'};
      var rami = [R.yearBranch, R.monthBranch, R.dayBranch, ctx && ctx.oraBranch].filter(function(x){return !!x;});
      var rooted = false;
      for (var a=0; a<rami.length; a++) if (WXb[rami[a]] === SEs[R.dayStem]) { rooted = true; break; }
      if (!rooted) return null;                                      // day stem rooted → whole pillar lands in its casa L1
      state.why = 'The whole day pillar <b>'+R.dayStem+R.dayBranch+'</b> arrives on L1: the stem '+R.dayStem+' has its casa on L1 and is ROOTED in the date branches, and the day branch '+R.dayBranch+' combines (六合) the fixed <b>B '+l1.ramo+'</b> — the B is blocked in place, and a still B makes its own team lose → below loses → LONG.';
      return 'LONG';
    }});

  LY_VIE.push({ id:'R29_65', sezione:'§65', nome:'Nothing moves: Ying on the day branch decides',
    dottrina:'When the mobile line has a NULL movement (arrival void, suspended by the day, bound by the hidden line, self-combination, Qian-Xun bound) nothing acts in the hexagram: one reads the only thing there is. If the fixed Ying sits on the DAY branch, the day itself is the Ying → its seat (below → SHORT, above → LONG). Control: with a LIVE mobile the same configuration gives 35% — the day on Ying speaks only in silence. Edu (17/08, EURJPY 05/03/2025): "certain cards have no alternative, so you read the only possible one". 12 cards, 91.7%, both periods aligned; last in the thermometer.',
    test: function (R, ctx, state) {
      if (!R.mutante.movimentoNullo) return null;
      var Yg = R.linee[R.ying-1];
      if (Yg.isMobile || Yg.ramo !== R.dayBranch) return null;
      var S = R.linee[R.shi-1];
      var extra = GEN[S.el]===Yg.el ? ' Shi ('+S.par+' '+S.ramo+') generates it.' : '';
      state.why = 'The mobile L'+R.mutante.pos+' has a <b>null movement</b> ('+(R.mutante.motivoNullo||'')+'): nothing acts. The fixed <b>Ying</b> L'+Yg.pos+' <b>'+Yg.par+' '+Yg.ramo+'</b> sits on the <b>day branch '+R.dayBranch+'</b> — the day itself is the Ying → its seat ('+(Yg.pos<=3?'below → SHORT':'above → LONG')+').'+extra;
      return Yg.pos<=3 ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R31_67', sezione:'§67', nome:'Wood gathering in the lower trigram: strong rises, weak sinks',
    dottrina:'A complete seasonal gathering (no void branch) formed in the lower trigram by the mobile (departure/arrival) and its fixed lines. Force decides (Edu 17/08, force model): if the mobile\'s force is ≥ 3 (element prosperous/growing of month, day/hour support, advancing…) the gathering is strong and pushes UP → LONG; if < 3 (element dead of month, controller void that does not oppose) the gathering sinks → SHORT. A void controller — even if timely — does not act and does not oppose the gathering. 11 cards, 11/11, both periods; §66 (B advancing below) is a particular case of the strong branch. Last-but-one in the thermometer.',
    test: function (R, ctx, state) {
      var mob = R.linee[R.mutante.pos-1];
      if (mob.pos > 3 || R.mutante.movimentoNullo) return null;
      var HUI=[{r:['寅','卯','辰'],el:'Wood'},{r:['巳','午','未'],el:'Fire'},{r:['申','酉','戌'],el:'Metal'},{r:['亥','子','丑'],el:'Water'}];
      var pool = {}; R.linee.forEach(function(l){ if (l.pos<=3) pool[l.ramo]=true; }); pool[R.mutante.ramoArr]=true;
      var g = null; HUI.forEach(function(h){ if (!g && h.r.every(function(x){ return pool[x] && R.vuoti.indexOf(x)<0; })) g = h; });
      if (!g) return null;
      var F = forzaModello(R, ctx, mob.pos); var Fr = F.linee[mob.pos-1].score;
      var forte = Fr >= 3;
      state.why = 'The <b>'+g.el+' gathering '+g.r.join('')+'</b> is complete in the lower trigram (mobile '+mob.par+' '+R.mutante.ramoDep+' → '+R.mutante.ramoArr+' + fixed lines). Force of the mobile: <b>'+(Fr>0?'+':'')+Fr.toFixed(1)+'</b> ('+F.linee[mob.pos-1].det.join(', ')+') → '+(forte?'strong gathering pushes up → LONG':'weak gathering sinks → SHORT')+'.';
      return forte ? 'LONG' : 'SHORT';
    }});

  LY_VIE.push({ id:'R30_66', sezione:'§66', nome:'B advancing in the lower trigram: the trend wins above',
    dottrina:'B is notoriously a negative indicator: a B that ADVANCES (same element, clockwise branch) in the lower trigram shows the lower side losing ground — the trend wins on the other side → LONG. Edu (17/08, USDJPY 30/04/2024). Only where no other rule has spoken (elsewhere B advancing gives the opposite, 44%); 11 cards, 72.7%, both periods aligned; last in the thermometer.',
    test: function (R, ctx, state) {
      var mob = R.linee[R.mutante.pos-1];
      if (!(mob.par==='B' && R.mutante.progressione==='avanzante' && mob.pos<=3)) return null;
      state.why = 'The <b>B</b> L'+mob.pos+' advances <b>'+R.mutante.ramoDep+' → '+R.mutante.ramoArr+'</b> in the lower trigram: the negative indicator gains ground below, the trend wins above → LONG.';
      return 'LONG';
    }});

  LY_VIE.push({ id:'R32_68', sezione:'§68', nome:'Arrival clash read by the Yong Shen (who is hit, who hits)',
    dottrina:'Edu (17/08): "it depends" — the Yong Shen (spirit of the focus) tells how to read. Metaphor: a crowd gathered → you stop there (gathering: the qi stays); a runner crossing the street → you look where he goes (follow the arrival). When the arrival ONLY clashes one full fixed line (no combination): a clashed P gives way → seat OPPOSITE to the clashed line (35 cards, 74% opposite); a clashed G or C holds the blow → seat of the clashed line (G 13 cards 77%, C 25 cards 64%); otherwise, if the mobile is a W, the qi goes where the W goes → seat of the clashed line (33 cards, 61%). B/W clashed by a non-W mobile: no rule. Last in the thermometer.',
    test: function (R, ctx, state) {
      if (R.mutante.movimentoNullo) return null;
      // PRINCIPIO GENERALE (Edu, 24/08/2026, da EURJPY 12/02/2025): in GENERAZIONE DI
      // RITORNO (回頭生, caso 1) l'arrivo e' tutto preso dal tornare dalla madre e NON
      // agisce altrove: nessun clash suo su una linea distante ha voce.
      // Audit: ARRLIB=off ripristina il comportamento precedente.
      if (R.mutante.casoMut === 1 && !(typeof process !== 'undefined' && process.env && process.env.ARRLIB === 'off')) return null;
      var mob = R.linee[R.mutante.pos-1], arr = R.mutante.ramoArr;
      var cT = R.linee.filter(function(l){ return !l.isMobile && CLASH[arr]===l.ramo && !l.vuoto; });
      var kT = R.linee.filter(function(l){ return !l.isMobile && COMBINA[arr]===l.ramo && !l.vuoto; });
      if (cT.length !== 1 || kT.length) return null;
      var T = cT[0], seatT = T.pos<=3 ? 'SHORT' : 'LONG', opp = seatT==='LONG' ? 'SHORT' : 'LONG';
      var lbl = 'L'+T.pos+' <b>'+T.par+' '+T.ramo+'</b>';
      // §68-bis (Edu 20/08/2026, da EURJPY 11/12/2023): if the ARRIVAL also CONTROLS (剋) the element
      // of the clashed line, this is not a bump but a destruction: the clashed line does not hold,
      // whoever does not win loses → the mobile prevails (= seat opposite to the clashed line).
      if (CTRL[WX[arr]] === T.el) {
        var seatM = mob.pos<=3 ? 'SHORT' : 'LONG';
        state.why = 'The arrival <b>'+arr+'</b> does not merely clash '+lbl+': it also CONTROLS it (剋). '+
          'The clashed line is destroyed, not displaced → the mobile prevails → '+seatM+'.';
        return seatM;
      }
      if (T.par === 'P') { state.why = 'The arrival <b>'+arr+'</b> only clashes '+lbl+': a clashed <b>P</b> gives way → the clashed side loses → '+opp+'.'; return opp; }
      if (T.par === 'G' || T.par === 'C') { state.why = 'The arrival <b>'+arr+'</b> only clashes '+lbl+': a clashed <b>'+T.par+'</b> holds the blow, the qi stops there → seat of the clashed line → '+seatT+'.'; return seatT; }
      if (mob.par === 'W') { state.why = 'The mobile <b>W</b> L'+mob.pos+' runs to clash '+lbl+': you look where the W goes → seat of the clashed line → '+seatT+'.'; return seatT; }
      return null;
    }});

  LY_VIE.push({ id:'R33_69', sezione:'§69', nome:'Only action: the day clashes one fixed line while nothing moves',
    dottrina:'Edu (17/08): "when there is no better alternative you go to the only one available, even if you do not like it — the action guides the reading; if a void line is clashed OUT of the void by the day and nothing else happens, THAT is where you must look." Conditions: the mobile has a null movement, no gathering, and the day clashes exactly ONE fixed line: if that line is VOID it is filled by the clash and decides → its seat (USDCHF 27/12/2023, seme 85); if it is FULL it is broken → its side loses → opposite seat (USDJPY 13/02/2024, seme 149). Doctrinal pillar fixed on Edu\'s insistence; statistical support weak (coda 31 cards 61%, periods 72/46). Last in the thermometer.',
    test: function (R, ctx, state) {
      if (!R.mutante.movimentoNullo) return null;
      var cl = R.linee.filter(function(l){ return !l.isMobile && CLASH[R.dayBranch]===l.ramo; });
      if (cl.length !== 1) return null;
      var F = forzaModello(R, ctx, cl[0].pos); if (F.raduni.length) return null;
      var T = cl[0], seatT = T.pos<=3 ? 'SHORT' : 'LONG', opp = seatT==='LONG' ? 'SHORT' : 'LONG';
      var lbl = 'L'+T.pos+' <b>'+T.par+' '+T.ramo+'</b>'+(T.isYing?' (Ying)':T.isShi?' (Shi)':'');
      if (T.vuoto) { state.why = 'Nothing moves (null movement: '+(R.mutante.motivoNullo||'')+'), no gathering. The only action: the <b>day '+R.dayBranch+'</b> clashes the <b>void</b> '+lbl+' out of the void — it is filled and decides → its seat → '+seatT+'.'; return seatT; }
      state.why = 'Nothing moves (null movement: '+(R.mutante.motivoNullo||'')+'), no gathering. The only action: the <b>day '+R.dayBranch+'</b> clashes the full '+lbl+' — it breaks, its side loses → '+opp+'.'; return opp;
    }});

  LY_VIE.push({ id:'M18', sezione:'M18', nome:'Beast potentiation with overabundant element',
    dottrina:'When NO stem (year/month/day/hour) has a usable root (rooted AND in the day-polarity scale), the OVERABUNDANT element of the four branches (>=3, no tie) potentiates — through the Beast (六獸) of the MOBILE line — that line, provided the mobile ARRIVAL is VOID. Then read normally: if the abundance GENERATES the arrival (E生arrival) the void arrival is activated and ACTS (mobile Shi/Ying: read control arrival↔opposite pole); otherwise the mobile STAYS and wins its seat (G/W hold, B/P invert, C silent). Guides: USDJPY 31/07/2024 (case A), EURGBP 21/01/2022 (case B). Doctrinal, low n by calendar rarity; removed only by a card that falsifies it in its perimeter. Needs year/month/hour stems in ctx (silent if absent). Evaluated last.',
    test: function (R, ctx, state) {
      if (!ctx || ctx.yearStem==null || ctx.monthStem==null) return null;    // steli non forniti → tace
      if (R.vuoti.indexOf(R.mutante.ramoArr) < 0) return null;               // arrivo del mobile vuoto
      var SE={'甲':'Wood','乙':'Wood','丙':'Fire','丁':'Fire','戊':'Earth','己':'Earth','庚':'Metal','辛':'Metal','壬':'Water','癸':'Water'};
      var YANG=['甲','丙','戊','己','庚','壬'];
      var dS=R.dayStem, lad=(YANG.indexOf(dS)>=0);
      var inScala=function(s){ return (YANG.indexOf(s)>=0)===lad; };
      var rami=[R.yearBranch,R.monthBranch,R.dayBranch,ctx.oraBranch].filter(Boolean);
      var rad=function(s){ for (var i=0;i<rami.length;i++) if (WX[rami[i]]===SE[s]) return true; return false; };
      var steli=[ctx.yearStem,ctx.monthStem,dS,ctx.hourStem||null].filter(Boolean);
      for (var k=0;k<steli.length;k++) if (rad(steli[k]) && inScala(steli[k])) return null;   // stelo con radice usabile → fuori
      var cnt={}; for (var j=0;j<rami.length;j++){ var e=WX[rami[j]]; cnt[e]=(cnt[e]||0)+1; }
      var dom=null,dn=0,tie=false; for (var e2 in cnt){ if (cnt[e2]>dn){dom=e2;dn=cnt[e2];tie=false;} else if (cnt[e2]===dn) tie=true; }
      if (dn<3 || tie) return null;
      var BEL={'青龍':'Wood','朱雀':'Fire','勾陳':'Earth','螣蛇':'Earth','白虎':'Metal','玄武':'Water'};
      var mob=R.linee[R.mutante.pos-1]; var bst=mob.bestia && mob.bestia.cn;
      if (!bst || BEL[bst]!==dom) return null;
      var arrEl=WX[R.mutante.ramoArr];
      var seat=function(p){ return p<=3?'SHORT':'LONG'; };
      if (GEN[dom]===arrEl) {                        // CASO B: arrivo generato → attivato, agisce
        if (mob.isShi || mob.isYing) {
          var altro = mob.isShi ? R.linee[R.ying-1] : R.linee[R.shi-1];
          if (CTRL[arrEl]===altro.el) { state.why='No usable stem root; overabundant <b>'+dom+'</b> generates the void arrival <b>'+R.mutante.ramoArr+'</b> (via beast '+bst+') which controls the opposite pole → mobile ('+(mob.isShi?'Shi':'Ying')+') wins → its seat.'; return seat(mob.pos); }
          if (CTRL[altro.el]===arrEl) { state.why='No usable stem root; the activated arrival is controlled by the opposite pole → mobile loses → opposite pole seat.'; return seat(altro.pos); }
        }
        return null;                                 // oltre Shi/Ying nessuna guida → tace
      }
      if (mob.par==='G' || mob.par==='W') { state.why='No usable stem root; overabundant <b>'+dom+'</b> potentiates the mobile (beast '+bst+'); the void arrival is not generated → the mobile stays <b>'+mob.par+'</b> and wins its seat.'; return seat(mob.pos); }
      if (mob.par==='B' || mob.par==='P') { state.why='No usable stem root; the potentiated mobile stays <b>'+mob.par+'</b> (which makes its own team lose) → opposite of its seat.'; return seat(mob.pos)==='SHORT'?'LONG':'SHORT'; }
      return null;
    }});


  LY_VIE.push({ id:'R38_96', sezione:'§96', coda:true, cablata:'2026-08-25',
    nome:'The arrival that punishes (刑) its own departure fells the mobile',
    dottrina:'Edu (25/08/2026, guide card EURJPY 14/11/2023, seme 162): when the mutation ARRIVAL punishes (三刑/子卯) its own DEPARTURE and the punisher is POWERFUL (arrival element timely in the month — double seasonality — or of the Tai Sui element), the element-based return-generation is a poisoned gift: by branch, the arrival strikes the mover — the mobile falls, its team loses → OPPOSITE seat. Measure at cabling: powerful n 109 · 59.6% · z 2.01 · +1350 · periods 60/59 (weak punisher 44.9%: without power the punishment does not fell). Note: mobile-G cell 47.1%/17 with contradictory periods — kept by doctrine, to be vetted card by card. TAIL RULE, frozen. VIA96=off to disable.',
    test: function (R, ctx, state) {
      if (!(typeof process!=='undefined' && process.env && process.env.VIA96==='1')) return null;   // IN SALVAGUARDIA: default OFF, VIA96=1 per accendere (regressione pipeline -816: 4 su/7 giu)
      var XING={'寅':'巳','巳':'申','申':'寅','丑':'戌','戌':'未','未':'丑','子':'卯','卯':'子'};
      if (XING[R.mutante.ramoArr]!==R.mutante.ramoDep) return null;
      var mEl=WX[R.monthBranch], sEl=SEASON[R.monthBranch], aEl=WX[R.mutante.ramoArr];
      var pot=(aEl===mEl||GEN[mEl]===aEl)||(aEl===sEl||GEN[sEl]===aEl)||(R.yearBranch&&WX[R.yearBranch]===aEl);
      if (!pot) return null;
      var mob=R.linee[R.mutante.pos-1];
      var seat = mob.pos<=3 ? 'LONG' : 'SHORT';
      state.why = 'The arrival <b>'+R.mutante.ramoArr+'</b> punishes (刑) its own departure <b>'+R.mutante.ramoDep+'</b>, and the punisher is powerful (timely/Tai Sui): the mobile is struck by its own arrival — it falls, its team loses → opposite seat → '+seat+'.';
      return seat;
    }});



  // §113 — IL PILASTRO DEL MESE CHE SCORRE INTERO SULLA LINEA
  LY_VIE.push({ id:'R53_113', sezione:'§113', coda:true, cablata:'2026-08-29',
    nome:'The whole month pillar flows onto a line and feeds the hidden spirit beneath it',
    dottrina:'Edu (29/08/2026, guida USDJPY 23/03/2023 seme 131). Il PILASTRO DEL MESE arriva INTERO su una linea — stelo e ramo dello STESSO elemento, e la BESTIA della linea e\' di quell\'elemento: il mese vi si siede in tutta la sua forza. La linea lo GENERA (viene assorbita) e il mese passa oltre, generando il 伏神 non vuoto nascosto sotto di essa. Il flusso non e\' ostacolato ed e\' per definizione in stagione: quella sede VINCE (alto LONG, basso SHORT). Sulla carta guida la mobile L4 sembra muoversi ma il suo G Terra e\' schiacciato dal Legno all\'apice, e l\'ora 丙戌 atterra sulla mobile (stelo dell\'ora = bestia della linea) portandosi il proprio ramo, amico dell\'arrivo: l\'arrivo 午 nutre 戌 invece della partenza. Il Fuoco vive allora sotto L3, dove il Drago Verde riceve il mese: la sede di L3 vince. Misura al cablaggio: 3/3 · +143 pip (delle 3, due gia\' vinte dal termometro per altre vie: sposta la sola carta guida, +34 pip). REGOLA DI CODA certificata dottrinalmente, congelata. MESEPIENO=off per disattivarla.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.MESEPIENO==='off') return null;
      var ms = ctx && ctx.monthStem, mb = (ctx && ctx.monthBranch) || R.monthBranch; if (!ms || !mb) return null;
      var SE={'甲':'Wood','乙':'Wood','丙':'Fire','丁':'Fire','戊':'Earth','己':'Earth','庚':'Metal','辛':'Metal','壬':'Water','癸':'Water'};
      var WX={'寅':'Wood','卯':'Wood','巳':'Fire','午':'Fire','辰':'Earth','丑':'Earth','戌':'Earth','未':'Earth','申':'Metal','酉':'Metal','亥':'Water','子':'Water'};
      var GENh={Wood:'Fire',Fire:'Earth',Earth:'Metal',Metal:'Water',Water:'Wood'};
      var BEL={'青龍':'Wood','朱雀':'Fire','勾陳':'Earth','螣蛇':'Earth','白虎':'Metal','玄武':'Water'};
      var mEl = WX[mb]; if (!mEl) return null;
      if (SE[ms] !== mEl) return null;                       // il pilastro deve essere INTERO: stelo e ramo stesso elemento
      for (var i=0;i<R.linee.length;i++){
        var L=R.linee[i];
        var f = L.fushen; if (!f) continue;
        var fb = f.ramo || f.b; if (!fb) continue;
        if (!L.bestia || BEL[L.bestia.cn] !== mEl) continue;  // la bestia della linea e' dell'elemento del mese
        if (GENh[L.el] !== mEl) continue;                     // la linea genera il mese: viene assorbita
        if (GENh[mEl] !== (f.el || WX[fb])) continue;         // il mese passa al nascosto sotto
        if ((R.vuoti||[]).indexOf(fb) >= 0) continue;         // il nascosto non deve essere vuoto
        var dir = L.pos<=3 ? 'SHORT' : 'LONG';
        state.why='The whole month pillar <b>'+ms+mb+'</b> settles on L'+L.pos+' (beast '+L.bestia.cn+', same element): the line generates it and is absorbed, and the month flows on to the hidden spirit <b>'+fb+'</b> beneath. Unobstructed and in season: that seat wins → '+dir+'.';
        return dir;
      }
      return null;
    }});

  LY_VIE.push({ id:'R39_99', sezione:'§99', coda:true, cablata:'2026-08-26',
    nome:'Mobile G/W: real movement wins its seat, null movement is a failed action',
    dottrina:'Edu (26/08/2026, da USDCAD 08/03/2023 e USDJPY 02/08/2022): lettura BASE della mobile G o W quando nessun perimetro speciale la cattura. Due rami OPPOSTI, distinti dal fatto che la linea AGISCA o no: (a) MOVIMENTO VERO — la G/W e coinvolta nell azione, fa vincere la propria squadra -> la sua sede (alto LONG, basso SHORT); (b) MOVIMENTO NULLO — non e una linea ferma non coinvolta, e un azione TENTATA E FALLITA: chi non vince perde -> la sede cade (opposto). Il ramo (b) esclude i due casi gia coperti da §52 (回頭剋 e autocombinazione) per non duplicarne il perimetro. Valutata ULTIMA: parla solo dove tutto il resto tace. VIAGW=1 per accendere.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.VIAGW==='off') return null;
      var mob = R.linee[R.mutante.pos-1];
      if (mob.par!=='G' && mob.par!=='W') return null;
      // GUARDIA DEL PESO DELLE BESTIE (Edu, 26/08/2026, da USDCAD 27/01/2026):
      // "il peso delle bestie cade tutto su L6 che viene penalizzata — la mobile non c'entra
      // niente". Se la MOBILE ha la bestia SCARICA (0-1 radici nei rami di calendario) e il peso
      // (>=2 radici) sta sullo SHI o sull'YING, l'attore non e' la mobile: §99 TACE.
      // Misura: §99 dove decide 52,1%/309; con mobile a peso massimo 56,1%/114 (+1.479);
      // con mobile scarica e peso su Shi/Ying 42,2%/90 (-1.030).
      // Audit: G99BESTIE=off disattiva la guardia.
      if (!(typeof process!=='undefined' && process.env && process.env.G99BESTIE==='off')) {
        var BEL99 = {'青龍':'Wood','朱雀':'Fire','勾陳':'Earth','螣蛇':'Earth','白虎':'Metal','玄武':'Water'};
        var cal99 = [R.dayBranch, R.monthBranch, R.yearBranch, ctx && ctx.oraBranch].filter(function(b){return !!b;});
        var rad99 = function (l) {
          if (!l || !l.bestia) return 0;
          var e = BEL99[l.bestia.cn]; if (!e) return 0;
          var n = 0; for (var i=0;i<cal99.length;i++) if (WX[cal99[i]]===e) n++;
          return n;
        };
        if (rad99(mob) <= 1) {
          var shi99 = R.linee[R.shi-1], ying99 = R.linee[R.ying-1];
          if (rad99(shi99) >= 2 || rad99(ying99) >= 2) return null;   // l'attore sta altrove
        }
      }
      var sede = mob.pos<=3 ? 'SHORT' : 'LONG';
      var opp  = sede==='LONG' ? 'SHORT' : 'LONG';
      if (!R.mutante.movimentoNullo) {
        if (typeof process!=='undefined' && process.env && process.env.VIAGW_RAMO==='b') return null;
        state.why = 'The mobile <b>'+mob.par+'</b> L'+mob.pos+' ('+R.mutante.ramoDep+'→'+R.mutante.ramoArr+') really moves and is involved in the action: a '+mob.par+' makes its own team win → its seat → '+sede+'.';
        return sede;
      }
      // movimento nullo: escludo i casi gia' letti da §52 (回頭剋 caso 3, autocombinazione)
      if (R.mutante.casoMut===3 || mob.stato==='autocombinata') return null;
      if (typeof process!=='undefined' && process.env && process.env.VIAGW_RAMO==='a') return null;
      state.why = 'The mobile <b>'+mob.par+'</b> L'+mob.pos+' tried to act but its movement is null ('+(R.mutante.motivoNullo||'null movement')+'): the action is attempted and failed — who does not win loses → its seat falls → '+opp+'.';
      return opp;
    }});



  // §109 — ultima istanza della linea incompatibile (dopo di lei parla solo §110, la lettura del residuo)
  LY_VIE.push({ id:'R49_109', sezione:'§109', cablata:'2026-08-27',
    nome:'Incompatible line with its host trigram (last instance): G/P/W wins, B loses',
    dottrina:'Edu (27/08/2026, da USDCAD 16/01/2024 seme 134; direzione B CERTIFICATA da Edu). Cinque coppie incompatibili, corpo unico: 丑∈坤, 卯∈兌, 辰∈乾, 午∈坎, 申∈艮 (le speculari non valgono). A movimento nullo (caso -1), la linea incompatibile NON vuota, UNICA, che SI PRENDE BESTIA E STELI (bestia radicata nella data + stelo di data radicato con casa sulla linea) e\' un fattore finale: se e\' G, P o W la sua squadra VINCE; se e\' B la sua squadra PERDE; se e\' C tace. Parla in ultima istanza, prima di ricorrere al duello Shi/Ying.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.INCOMP24==='off') return null;
      if (R.mutante.casoMut !== -1) return null;
      var EDU5={'丑':8,'卯':2,'辰':1,'午':6,'申':7};
      var BEL={'青龍':'Wood','朱雀':'Fire','勾陳':'Earth','螣蛇':'Earth','白虎':'Metal','玄武':'Water'};
      var SEs={'甲':'Wood','乙':'Wood','丙':'Fire','丁':'Fire','戊':'Earth','己':'Earth','庚':'Metal','辛':'Metal','壬':'Water','癸':'Water'};
      var WXb={'寅':'Wood','卯':'Wood','巳':'Fire','午':'Fire','辰':'Earth','丑':'Earth','戌':'Earth','未':'Earth','申':'Metal','酉':'Metal','亥':'Water','子':'Water'};
      var ST10=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
      var YANGL=['甲','丙','戊','己','庚','壬'], YINL=['乙','丁','戊','己','辛','癸'];
      var ds=R.dayStem; if(!ds||R.sup==null||R.inf==null) return null;
      var ys=ctx&&ctx.yearStem, ms=ctx&&ctx.monthStem, os=ctx&&ctx.hourStem;
      if(!ys||!ms) return null;
      var steli=[ys,ms,ds,os].filter(function(x){return !!x;});
      var rami=[R.yearBranch,R.monthBranch,R.dayBranch,ctx&&ctx.oraBranch].filter(function(x){return !!x;});
      var lad=(ST10.indexOf(ds)%2===0)?YANGL:YINL;
      var i0=lad.indexOf(ds); if(i0<0) return null;
      var casa=function(s){var j=lad.indexOf(s); return j<0?null:((j-i0+6)%6)+1;};
      var rad=function(s){for(var a=0;a<rami.length;a++) if(WXb[rami[a]]===SEs[s]) return true; return false;};
      var q=[];
      for(var i=0;i<R.linee.length;i++){var l=R.linee[i];
        var trig=l.pos<=3?R.inf:R.sup;
        if(EDU5[l.ramo]!==trig||l.vuoto) continue;
        var bEl=l.bestia?BEL[l.bestia.cn]:null;
        if(!bEl) continue;
        var okB=false; for(var a2=0;a2<rami.length;a2++) if(WXb[rami[a2]]===bEl){okB=true;break;}
        if(!okB) continue;
        var okS=false; for(var a3=0;a3<steli.length;a3++){var s=steli[a3]; if(casa(s)===l.pos&&rad(s)){okS=true;break;}}
        if(okS) q.push(l);
      }
      if(q.length!==1) return null;
      var l1=q[0]; if(l1.par==='C') return null;
      var vinceSquadra=(l1.par!=='B');
      var dir=vinceSquadra?(l1.pos<=3?'SHORT':'LONG'):(l1.pos<=3?'LONG':'SHORT');
      state.why='Last instance: the line <b>'+l1.ramo+'</b> on L'+l1.pos+' is incompatible with its host trigram, and it takes the beast and the rooted stems of the date. As a '+l1.par+', '+(vinceSquadra?'its side wins':'its side loses (B certified by Edu)')+' → '+dir+'.';
      return dir;
    }});

  // §110 — LETTURA DEL RESIDUO (dopo §109, resta l'ULTIMA via: parla solo se tutte tacciono)
  // §112 — L'ORA INTERA SULLA LINEA (azione batte forza statica: parla prima delle bestie di §110)
  LY_VIE.push({ id:'R52_112', sezione:'§112', coda:true, cablata:'2026-08-28',
    nome:'The whole hour on a line: its branch clashes it while its stem-beast sits on it — the line loses',
    dottrina:'Edu (28/08/2026, guida USDCHF 15/06/2022 seme 99; gemella USDCHF 13/10/2022 letta il medesimo giorno). Nel RESIDUO — movimento nullo, il giorno non clasha nessuna ferma, nessun trigono completo, nessuna linea incompatibile, nessun vuoto asimmetrico fra Shi e Ying, e il duello per generazione non decide (niente generazione, o nutrito senza forza: nutrire un morto non lo fa vincere) — parla l\'ORA: quando arriva INTERA su una linea, il ramo a clasharla e la bestia del proprio stelo gia\' seduta sopra, la linea non puo\' andare da nessuna parte e fa PERDERE la propria squadra -> sede opposta. Azione batte forza statica: parla prima della lettura delle bestie (§110). Misura al cablaggio: 7/7 nel residuo · +431 pip · entrambi i periodi. REGOLA DI CODA, congelata. ORAINTERA=off per disattivarla.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.ORAINTERA==='off') return null;
      if (!R.mutante.movimentoNullo) return null;
      var ora = ctx && ctx.oraBranch; if (!ora || !R.dayStem) return null;
      var CL112={'子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳'};
      var i, l;
      for (i=0;i<R.linee.length;i++){ l=R.linee[i];
        if (l.pos!==R.mutante.pos && CL112[R.dayBranch]===l.ramo) return null; }
      var TRINI112=[['申','子','辰'],['寅','午','戌'],['巳','酉','丑'],['亥','卯','未']];
      var mem={};
      for (i=0;i<R.linee.length;i++){ l=R.linee[i]; mem[l.ramo]=1;
        if (l.fushen && l.fushen.ramo && (R.vuoti||[]).indexOf(l.fushen.ramo)<0) mem[l.fushen.ramo]=1; }
      mem[R.dayBranch]=1;
      for (i=0;i<TRINI112.length;i++){ var t=TRINI112[i];
        if (mem[t[0]] && mem[t[1]] && mem[t[2]]) return null; }
      var TR112={1:['戌','亥'],2:['酉'],3:['午'],4:['卯'],5:['辰','巳'],6:['子'],7:['丑','寅'],8:['未','申']};
      if (R.sup!=null && R.inf!=null) for (i=0;i<R.linee.length;i++){ l=R.linee[i];
        var pr=TR112[l.pos<=3?R.inf:R.sup]||[];
        for (var a=0;a<pr.length;a++) if (CL112[l.ramo]===pr[a]) return null; }
      var Sh=R.linee[R.shi-1], Yi=R.linee[R.ying-1]; if (!Sh||!Yi) return null;
      if (!!Sh.vuoto !== !!Yi.vuoto) return null;
      var ric=null;
      if (GEN[Yi.el]===Sh.el) ric=Sh; else if (GEN[Sh.el]===Yi.el) ric=Yi;
      if (ric && ric.forte) return null;    // il duello per generazione col nutrito vivo (in lettura, non cablato)
      var WUSHU112={'甲':'甲','己':'甲','乙':'丙','庚':'丙','丙':'戊','辛':'戊','丁':'庚','壬':'庚','戊':'壬','癸':'壬'};
      var ST112=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
      var B112=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
      var s0=WUSHU112[R.dayStem], hi=B112.indexOf(ora);
      if (!s0 || hi<0) return null;
      var so=ST112[(ST112.indexOf(s0)+hi)%10];
      var BDI112={'甲':'青龍','乙':'青龍','丙':'朱雀','丁':'朱雀','戊':'勾陳','己':'螣蛇','庚':'白虎','辛':'白虎','壬':'玄武','癸':'玄武'};
      var bo=BDI112[so]; if (!bo) return null;
      var L=null;
      for (i=0;i<R.linee.length;i++){ l=R.linee[i];
        if (CL112[ora]===l.ramo && l.bestia && l.bestia.cn===bo) { L=l; break; } }
      if (!L) return null;
      var dir = L.pos<=3 ? 'LONG' : 'SHORT';
      state.why='The hour arrives whole on L'+L.pos+' ('+L.par+' '+L.ramo+'): its branch <b>'+ora+'</b> clashes it while the beast of its own stem <b>'+so+'</b> ('+bo+') sits on it — the line cannot go anywhere and makes its own side lose → '+dir+'.';
      return dir;
    }});

  LY_VIE.push({ id:'R50_110', sezione:'§110', coda:true, cablata:'2026-08-28',
    nome:'Residual reading: the line carrying the month-stem beast wins its seat',
    dottrina:'Edu (28/08/2026, guide EURGBP 05/05/2022 seme 84 e EURGBP 18/11/2021 seme 83). Nel caso -1 la mobile non puo\' muoversi: si legge in contemporanea e si lavora con quello che SI TROVA. Se non si trova NIENT\'ALTRO — il giorno non clasha nessuna ferma, nessun trigono completo (linee + 伏神 non vuoti + ramo del giorno), nessuna linea incompatibile col trigramma ospite, e fra Shi e Ying nessuna azione (vuoto asimmetrico, controllo o generazione: chi viene nutrito vince) — restano le BESTIE: la linea che porta la bestia dello STELO DEL MESE vince la propria sede (alto LONG, basso SHORT). In linea di massima le bestie si leggono prima di ricorrere al duello Shi/Ying. Misura al cablaggio: cella 12 · 58.3% · z 0.58 · +181 (baseline sulle stesse 58.3%/+180) · discriminanti 6 a 3/3 · periodi 43/80. REGOLA DI CODA certificata dottrinalmente, congelata. RESIDUOBESTIA=off per disattivarla.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.RESIDUOBESTIA==='off') return null;
      if (R.mutante.casoMut !== -1) return null;
      var ms = ctx && ctx.monthStem; if (!ms) return null;
      var CL={'子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳'};
      var i, l;
      // (a) il giorno clasha una linea ferma: si legge quella, non le bestie
      for (i=0;i<R.linee.length;i++){ l=R.linee[i];
        if (l.pos!==R.mutante.pos && CL[R.dayBranch]===l.ramo) return null; }
      // (b) trigono completo fra linee, 伏神 non vuoti e ramo del giorno
      var TRINI=[['申','子','辰'],['寅','午','戌'],['巳','酉','丑'],['亥','卯','未']];
      var membri={};
      for (i=0;i<R.linee.length;i++){ l=R.linee[i]; membri[l.ramo]=1;
        if (l.fushen && l.fushen.ramo && (R.vuoti||[]).indexOf(l.fushen.ramo)<0) membri[l.fushen.ramo]=1; }
      membri[R.dayBranch]=1;
      for (i=0;i<TRINI.length;i++){ var t=TRINI[i];
        if (membri[t[0]] && membri[t[1]] && membri[t[2]]) return null; }
      // (c) linea incompatibile: il suo ramo clasha un ramo proprio del trigramma che la ospita
      var TRIG_RAMI={1:['戌','亥'],2:['酉'],3:['午'],4:['卯'],5:['辰','巳'],6:['子'],7:['丑','寅'],8:['未','申']};
      if (R.sup!=null && R.inf!=null) for (i=0;i<R.linee.length;i++){ l=R.linee[i];
        var propri=TRIG_RAMI[l.pos<=3?R.inf:R.sup]||[];
        for (var a=0;a<propri.length;a++) if (CL[l.ramo]===propri[a]) return null; }
      // (d) fra Shi e Ying nessuna azione (vuoto asimmetrico, controllo, generazione)
      var CTRL={Wood:'Earth',Earth:'Water',Water:'Fire',Fire:'Metal',Metal:'Wood'};
      var GENh={Wood:'Fire',Fire:'Earth',Earth:'Metal',Metal:'Water',Water:'Wood'};
      var Sh=R.linee[R.shi-1], Yi=R.linee[R.ying-1]; if(!Sh||!Yi) return null;
      if (!!Sh.vuoto !== !!Yi.vuoto) return null;
      if (CTRL[Sh.el]===Yi.el || CTRL[Yi.el]===Sh.el) return null;
      if (GENh[Sh.el]===Yi.el || GENh[Yi.el]===Sh.el) return null;
      // il residuo: la bestia dello stelo del mese
      var BESTIA_DI={'甲':'青龍','乙':'青龍','丙':'朱雀','丁':'朱雀','戊':'勾陳','己':'螣蛇','庚':'白虎','辛':'白虎','壬':'玄武','癸':'玄武'};
      var bm=BESTIA_DI[ms]; if(!bm) return null;
      var L=null;
      for (i=0;i<R.linee.length;i++) if (R.linee[i].bestia && R.linee[i].bestia.cn===bm){ L=R.linee[i]; break; }
      if (!L) return null;
      var dir = L.pos<=3 ? 'SHORT' : 'LONG';
      state.why='Residual reading: nothing else is found in the chart — the beast of the month stem <b>'+ms+'</b> ('+bm+') sits on L'+L.pos+' ('+L.par+'): that line wins its seat → '+dir+'.';
      return dir;
    }});

  // §114 — L'ARRIVO NEL VUOTO: CHI NON VINCE PERDE (ULTIMA VIA: parla solo dove tutto tace)
  // §125 — IL DIREZIONALE CHE GENERA LA SHI O LA YING (Edu, 30/08/2026)
  LY_VIE.push({ id:'R64_125', sezione:'§125', coda:true, cablata:'2026-08-30',
    nome:'The directional set (三會) turns the trigram and nourishes Shi or Ying',
    dottrina:'Edu (30/08/2026, guida USDCHF 28/01/2026, seme 76). Quando i tre rami di un DIREZIONALE (三會: 寅卯辰 Legno · 巳午未 Fuoco · 申酉戌 Metallo · 亥子丑 Acqua) si trovano fra le linee non vuote, i quattro rami della data e l\'arrivo della mobile, il gruppo si compie e il trigramma diventa quell\'elemento. Se quell\'elemento GENERA la Shi o la Ying — una sola delle due — quella parte e\' nutrita e VINCE la propria sede (alto LONG, basso SHORT). Se le genera entrambe o nessuna, tace. Sulla guida 寅 (L2 e ramo del giorno) + 卯 (ora e arrivo) + 辰 (L3) fanno il Legno, il trigramma inferiore diventa Legno e genera la Shi L4 午 Fuoco: vince la Shi, sede alta, LONG. Esito reale LONG. Il gruppo li\' e\' completo anche senza l\'arrivo, quindi la lettura vale sia a moto compiuto sia a moto fallito. REGOLA DI CODA: parla per ultima, solo dove tutte le altre vie tacciono. VIA125=off per disattivarla.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.VIA125==='off') return null;
      var DIREZ = [ {r:['寅','卯','辰'], el:'Wood'},  {r:['巳','午','未'], el:'Fire'},
                    {r:['申','酉','戌'], el:'Metal'}, {r:['亥','子','丑'], el:'Water'} ];
      var vuoti = R.vuoti || [];
      var pool = [];
      for (var i = 0; i < R.linee.length; i++) {
        var L = R.linee[i];
        var _vuotaFerma = (!L.isMobile && vuoti.indexOf(L.ramo) >= 0);
        if (!_vuotaFerma || (typeof process!=='undefined' && process.env && process.env.DIREZVUOTI === 'si'))
          pool.push(L.ramo);
      }
      var rd = [R.yearBranch, R.monthBranch, R.dayBranch, ctx && ctx.oraBranch];
      for (var k = 0; k < rd.length; k++) if (rd[k]) pool.push(rd[k]);
      if (!R.mutante.movimentoNullo && R.mutante.ramoArr) pool.push(R.mutante.ramoArr);
      var S = R.linee[R.shi-1], Y = R.linee[R.ying-1];
      for (var d = 0; d < DIREZ.length; d++) {
        var set = DIREZ[d], ok = true;
        for (var m = 0; m < 3; m++) if (pool.indexOf(set.r[m]) < 0) ok = false;
        if (!ok) continue;
        var gS = (GEN[set.el] === WX[S.ramo]), gY = (GEN[set.el] === WX[Y.ramo]);
        if (gS === gY) return null;
        var vinc = gS ? S : Y;
        var dir = vinc.pos > 3 ? 'LONG' : 'SHORT';
        state.why = 'The directional set <b>' + set.r.join('') + '</b> is complete: the trigram turns to <b>' +
                    set.el + '</b>, which nourishes the <b>' + (gS ? 'Shi' : 'Ying') + '</b> L' + vinc.pos +
                    ' ' + vinc.ramo + ' — the nourished side wins its seat → ' + dir + '.';
        return dir;
      }
      return null;
    }
  });

  LY_VIE.push({ id:'R54_114', sezione:'§114', coda:true, cablata:'2026-08-29',
    nome:'Arrival in the void: whoever does not win, loses (the departing character remains)',
    dottrina:'Edu (certificata 29/08/2026; meccanica di lettura del 24/08/2026 promossa a via). L\'ARRIVO cade nel VUOTO: il movimento non produce effetto, la mobile NON muta e RESTA il carattere di partenza. G/W reggono e fanno VINCERE la propria sede; B/P fanno PERDERE la propria sede (verso opposto); C tace. Se la mobile e\' Shi o Ying si legge il confronto Shi<->Ying, che fa da override: chi controlla l\'altro vince; senza controllo decide il carattere. Vale anche quando il giorno sospende E l\'arrivo e\' vuoto (arrivo mascherato). PRECEDENZA: se c\'e\' un trigono completo (linee + 伏神 non vuoti + ramo del giorno) comanda quello e la via TACE. Collocata ULTIMA nel termometro, dopo §110: parla solo sul residuo muto, che e\' il perimetro misurato. Misura al cablaggio: 79 carte mute · 64.6% · z 2.59 · +1434 pip · vecchio 76% (34) · recente 59% (41). Certificata dottrinalmente. ARRIVOVUOTO=off per disattivarla.',
    test: function (R, ctx, state) {
      if (typeof process!=='undefined' && process.env && process.env.ARRIVOVUOTO==='off') return null;
      var M=R.mutante; if (!M || !M.movimentoNullo) return null;
      var arrVoid = /arrival void/.test(M.motivoNullo||'') || (R.vuoti||[]).indexOf(M.ramoArr)>=0;
      if (!arrVoid) return null;
      var mob=R.linee[M.pos-1]; if(!mob) return null;
      var i,l;
      // PRECEDENZA: trigono completo -> comanda lui, la via TACE. Regola dei membri
      // identica al checklist (certificata sulle falsificanti del 29/08/2026):
      //  - linee visibili (i vuoti fermi sono esclusi; la mobile conta anche se vuota)
      //  - tutti i 伏神
      //  - rami di data NON vuoti (anno, mese, giorno, ora) come terzo membro, se
      //    almeno due membri stanno su linee o nascosti (Edu 19/08 + EURUSD 01/06/2023)
      //  - l'ARRIVO RIANIMATO: se la mobile e' L1 il pilastro del giorno (casa su L1)
      //    le arriva addosso e rianima l'arrivo vuoto (Edu 29/08/2026, USDJPY 23/01/2026)
      var TRINI=[['申','子','辰'],['寅','午','戌'],['巳','酉','丑'],['亥','卯','未']];
      var visfus={}, estesi={};
      for (i=0;i<R.linee.length;i++){ l=R.linee[i];
        if (!((R.vuoti||[]).indexOf(l.ramo)>=0 && !l.isMobile)) visfus[l.ramo]=1;
        var fb=l.fushen && (l.fushen.ramo||l.fushen.b);
        if (fb) visfus[fb]=1; }
      if (M.pos===1 && M.ramoArr) visfus[M.ramoArr]=1;
      var _rd114=[R.dayBranch, R.monthBranch, (ctx&&ctx.yearBranch)||R.yearBranch, R.oraBranch||(ctx&&ctx.oraBranch)];
      for (i=0;i<_rd114.length;i++){ var rb=_rd114[i];
        if (rb && (R.vuoti||[]).indexOf(rb)<0) estesi[rb]=1; }
      for (i=0;i<TRINI.length;i++){ var t=TRINI[i];
        var nVF=(visfus[t[0]]?1:0)+(visfus[t[1]]?1:0)+(visfus[t[2]]?1:0);
        var full=t.every(function(b){ return visfus[b]||estesi[b]; });
        if (nVF===3 || (full && nVF>=2)) return null; }
      var CTRL114={Wood:'Earth',Earth:'Water',Water:'Fire',Fire:'Metal',Metal:'Wood'};
      var seat = function(p){ return p<=3?'SHORT':'LONG'; };
      // Shi o Ying VUOTO: il vuoto non agisce e non puo' vincere (Edu 29/08/2026, da
      // EURUSD 04/05/2022). MA il duello di CONTROLLO Shi<->Ying parla PRIMA del vuoto
      // (Edu 29/08/2026, da NZDUSD 10/07/2024: lo Shi vuoto che controlla vince comunque).
      // La mobile non e' mai vuota (動不為空).
      var _sh114=R.linee[R.shi-1], _yi114=R.linee[R.ying-1];
      var _shV114=_sh114 && _sh114.vuoto && !_sh114.isMobile;
      var _yiV114=_yi114 && _yi114.vuoto && !_yi114.isMobile;
      var car=mob.par, tiene=(car==='G'||car==='W'), cade=(car==='B'||car==='P');
      var dir=null, why=null;
      if (mob.isShi || mob.isYing) {
        var altro = mob.isShi ? _yi114 : _sh114; if(!altro) return null;
        if (CTRL114[altro.el]===mob.el)      { dir=seat(altro.pos); why='the other controls the mobile → the mobile loses'; }
        else if (CTRL114[mob.el]===altro.el) { dir=seat(mob.pos);   why='the mobile controls the other → the mobile wins'; }
        else if (_shV114 && _yiV114) return null;
        else if (_shV114) { dir=seat(_yi114.pos); why='no control and the Shi is VOID: the void cannot win → the Ying seat wins'; }
        else if (_yiV114) { dir=seat(_sh114.pos); why='no control and the Ying is VOID: the void cannot win → the Shi seat wins'; }
        else if (tiene) { dir=seat(mob.pos);   why=car+' holds → the mobile wins'; }
        else if (cade)  { dir=seat(altro.pos); why=car+' makes the mobile lose → the other wins'; }
        else return null;  // C: verso non definito
        state.why='Arrival <b>'+M.ramoArr+'</b> falls in the VOID: no effect, the mobile ('+(mob.isShi?'Shi':'Ying')+', '+car+') keeps its departing character. Shi↔Ying: '+why+' → '+dir+'.';
        return dir;
      }
      // mobile terza linea: qui il vuoto di Shi/Ying ha la precedenza sulla mappatura
      if (_shV114 && _yiV114) return null;
      if (_shV114) { state.why='Arrival <b>'+M.ramoArr+'</b> falls in the VOID and the Shi itself is VOID: the void cannot win → the Ying seat wins → '+seat(_yi114.pos)+'.'; return seat(_yi114.pos); }
      if (_yiV114) { state.why='Arrival <b>'+M.ramoArr+'</b> falls in the VOID and the Ying itself is VOID: the void cannot win → the Shi seat wins → '+seat(_sh114.pos)+'.'; return seat(_sh114.pos); }
      if (tiene) { dir=seat(mob.pos); why=car+' holds → its seat wins'; }
      else if (cade) { dir=(seat(mob.pos)==='SHORT'?'LONG':'SHORT'); why=car+' makes its seat lose → opposite'; }
      else return null;  // C tace
      state.why='Arrival <b>'+M.ramoArr+'</b> falls in the VOID: no effect, the third-line mobile keeps its departing character '+car+': '+why+' → '+dir+'.';
      return dir;
    }});

  // ---- i 2 rafforzativi (agiscono SOLO nel contrasto PB↔LY, non come vie autonome) ----
  var LY_RAFFORZATIVI = [
    { id:'ORA', nome:'Hour from the seed backs the follower',
    dottrina:'If the mobile\'s DEPARTURE is the HOUR branch from the seed and the one saying "follows the trend" (PB vs LY) is the PB: in a conflict the PB wins (§57 — as a stand-alone rule REJECTED, as a reinforcer FIXED).',
      test: function (R, ctx, state) { return !!(ctx.oraBranch && R.mutante.ramoDep === ctx.oraBranch); } },
    { id:'WVIRTU', nome:'Blessed W (Virtues + Ghost/Tomb) backs the follower',
    dottrina:'The mobile is a W whose DEPARTURE is Heaven Virtue or Branch Virtue (§60), or Ghost Sha / Tomb Sha from the day stem (§61): if the follower is the PB, in a conflict the PB wins. S9 = reference of the thermometer.',
      test: function (R, ctx, state) {
        var mob = R.linee[R.mutante.pos-1];
        if (mob.par!=='W') return false;
        var A = R.mutante.ramoDep;
        var virtu = (A === tiande(R.monthBranch, R.dayStem, R.dayBranch)) || (A === zhide(R.dayBranch));
        var gh = STELO_SPIRITI.ghost[R.dayStem] || [], tb = STELO_SPIRITI.tomb[R.dayStem] || [];
        var stelo = gh.indexOf(A)>=0 || tb.indexOf(A)>=0;
        return virtu || stelo;
      } },
    { id:'TSLEGA', nome:'Tai Sui binds the day and backs the follower',
    dottrina:'§78 — If the DAY branch is bound (六合) by the TAI SUI (year branch) and the one saying "follows the trend" is the PB, the PB is strong and the LY does not override it.',
      test: function (R, ctx, state) { return !!(R.yearBranch && COMBINA[R.dayBranch] === R.yearBranch); } },
    { id:'SERPENTE', nome:'Untimely Snake backs the non-follower',
    dottrina:'§81 — If the Snake (螣蛇) sits on the SHI, the YING or the MOBILE line and is UNTIMELY (囚 or 死 in the month), and the one saying "does not follow the trend" is the PB, the PB is strong and the LY does not override it.',
      polarita: 'nonSegue',
      test: function (R, ctx, state) {
        var S = null;
        for (var i=0;i<R.linee.length;i++){ var L=R.linee[i]; if (L.bestia && L.bestia.cn==='螣蛇'){ S=L; break; } }
        if (!S) return false;
        if (!(S.isShi || S.isYing || S.isMobile)) return false;
        var st = stagione(S.el, WX[R.monthBranch]);
        return st === '囚' || st === '死';
      } }
  ];

  function wBless(R, A){
    var out=[];
    if (A===tiande(R.monthBranch,R.dayStem,R.dayBranch)) out.push('Heaven Virtue');
    if (A===zhide(R.dayBranch)) out.push('Branch Virtue');
    if ((STELO_SPIRITI.ghost[R.dayStem]||[]).indexOf(A)>=0) out.push('Ghost Sha');
    if ((STELO_SPIRITI.tomb[R.dayStem]||[]).indexOf(A)>=0) out.push('Tomb Sha');
    return out.length ? '<b>'+out.join(' + ')+'</b>' : '—';
  }
  // Day context for the interface: Bazi + hour from seed + spirits/virtues of the day (all as branches)
  function contestoGiorno(R, ctx){
    ctx = ctx || {};
    return {
      year: R.yearBranch, month: R.monthBranch, day: R.dayBranch, dayStem: R.dayStem,
      hour: ctx.oraBranch || null,
      vuoti: R.vuoti, taiSuiPos: R.taiSuiPos,
      monthGeneral: generaleDelMese(ctx.date),
      ding: dingSpirit(R.dayStem, R.dayBranch),
      postHorse: postHorseDelGiorno(R.dayBranch),
      heavenVirtue: tiande(R.monthBranch, R.dayStem, R.dayBranch),
      branchVirtue: zhide(R.dayBranch),
      ghost: STELO_SPIRITI.ghost[R.dayStem] || [],
      tomb: STELO_SPIRITI.tomb[R.dayStem] || []
    };
  }

  // ---- motore: valuta le vie in ordine, con toggle per-via (default: tutte accese) ----
  // enabled: { viaId: bool, ... } — se assente o true, la via è attiva. opts: { ggiornovia, genvia }
  function termometro(R, ctx, enabled, opts) {
    ctx = ctx || {}; enabled = enabled || {}; opts = opts || {};
    var state = { opts: opts };
    // FILTRO ORA (§57, spento di default): P/B la cui partenza è l'ora, non rafforzata dalla
    // mutazione, viene neutralizzata sulle vie 19/20/23/24.
    if (opts.filtroora) {
      var mob0 = R.linee[R.mutante.pos-1];
      var mobRaff = R.mutante.casoMut===1 || R.mutante.casoMut===5 || R.mutante.progressione==='avanzante';
      state.oraNeutra = !!(ctx.oraBranch && (mob0.par==='P'||mob0.par==='B') &&
        R.mutante.ramoDep===ctx.oraBranch && !mobRaff);
    } else state.oraNeutra = false;
    for (var i = 0; i < LY_VIE.length; i++) {
      var v = LY_VIE[i];
      if (enabled[v.id] === false) continue;
      // spegnimento di una via da ambiente per misura/audit: VIAOFF=R27_63 (o piu', separate da virgola)
      if (typeof process !== 'undefined' && process.env && process.env.VIAOFF &&
          (','+process.env.VIAOFF+',').indexOf(','+v.id+',') >= 0) continue;
      var dir = v.test(R, ctx, state);
      if (dir) return { dir: dir, viaId: v.id, sezione: v.sezione, nome: v.nome, why: state.why || '',
        ramoDep: R.mutante.ramoDep, mobPar: R.linee[R.mutante.pos-1].par };
      state.why = null;
    }
    return { dir: null, viaId: null, ramoDep: R.mutante.ramoDep, mobPar: R.linee[R.mutante.pos-1].par };
  }

  // ---- combinazione S9: PB (segna la direzione) + LY (correttivo) + 2 rafforzativi ----
  // pbDir: 'LONG'|'SHORT' (verdetto finale del PB, già combinato con l'EMA)
  // ctx.emaDir: 'up'|'down' — usato per capire se il PB "segue" il trend grezzo
  function combinaS9(R, ctx, pbDir, enabled, enabledRaff, opts) {
    var t = termometro(R, ctx, enabled, opts);
    if (!t.dir) return { finale: pbDir, chi: 'PB alone (LY silent)', via: null, ly: null };
    if (t.dir === pbDir) return { finale: pbDir, chi: 'PB and LY agree (rule ' + t.sezione + ')', via: t, ly: t.dir, why: t.why };
    // contrasto: valuto i rafforzativi in ordine (ora, poi W benedetta)
    var ema = ctx.emaDir === 'up' ? 'LONG' : 'SHORT';
    var pbSegue = (pbDir === ema);
    enabledRaff = enabledRaff || {};
    var aOra = enabledRaff.ORA !== false && LY_RAFFORZATIVI[0].test(R, ctx);
    var wVirtu = enabledRaff.WVIRTU !== false && LY_RAFFORZATIVI[1].test(R, ctx);
    var tsLega = enabledRaff.TSLEGA !== false && LY_RAFFORZATIVI[2].test(R, ctx);
    var serpente = enabledRaff.SERPENTE !== false && LY_RAFFORZATIVI[3].test(R, ctx);
    if (serpente && !pbSegue) {
      return { finale: pbDir, chi: 'conflict → SNAKE reinforcer (§81): the Snake 螣蛇 sits on the Shi/Ying/mobile and is untimely in the month, and the PB does not follow the trend → the PB wins', via: t, ly: t.dir, why: t.why };
    }
    if ((aOra || wVirtu || tsLega) && pbSegue) {
      var A0 = R.mutante.ramoDep, mob0 = R.linee[R.mutante.pos-1];
      var chi = !aOra && !wVirtu
        ? 'conflict → TAI SUI reinforcer (§78): the day <b>' + R.dayBranch + '</b> is bound (六合) by the Tai Sui <b>' + R.yearBranch + '</b>, and the PB follows the trend → the PB wins'
        : aOra
        ? 'conflict → HOUR reinforcer: the mobile ' + mob0.par + ' departs from <b>' + A0 + '</b> = <b>hour from the seed</b>, and the PB follows the trend → the PB wins'
        : 'conflict → BLESSED W reinforcer: the mobile <b>W</b> departs from <b>' + A0 + '</b> = ' + wBless(R, A0) + ', and the PB follows the trend → the PB wins';
      return { finale: pbDir, chi: chi, via: t, ly: t.dir, why: t.why };
    }
    return { finale: t.dir, chi: 'conflict → LY wins (rule ' + t.sezione + ' ' + t.nome + ')', via: t, ly: t.dir, why: t.why };
  }

  return { read: read, readManual: readManual, setSblocco: setSblocco, setCasaAttore: setCasaAttore, TRIGRAM: TRIGRAM,
           PAR: PAR, SEI_BESTIE: SEI_BESTIE, EL_IT: EL_IT, BR_IT: BR_IT,
           oraDalSeme: oraDalSeme,
           LY_VIE: LY_VIE, LY_RAFFORZATIVI: LY_RAFFORZATIVI,
           termometro: termometro, combinaS9: combinaS9,
           generaleDelMese: generaleDelMese, dingSpirit: dingSpirit,
           tiande: tiande, zhide: zhide, STELO_SPIRITI: STELO_SPIRITI,
           EL_EN: EL_EN, STATO_EN: STATO_EN, contestoGiorno: contestoGiorno, wBless: wBless,
           forzaModello: forzaModello, stadioMese: stadioMese, STAGE_EN: STAGE_EN };
}));
