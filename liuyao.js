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



  // §109 — ULTIMA ISTANZA (deve restare l'ULTIMA via dell'elenco: parla solo se tutte tacciono)
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
