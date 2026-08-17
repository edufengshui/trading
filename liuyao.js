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
  var PAR = {  // funzione -> {cn, it}
    B: { cn:'兄弟', it:'Fratelli' }, C: { cn:'子孫', it:'Figli' },
    W: { cn:'妻財', it:'Ricchezza' }, G: { cn:'官鬼', it:'Ufficiale' },
    P: { cn:'父母', it:'Genitori' } };
  // Sei Bestie 六獸 nell'ordine canonico
  var SEI_BESTIE = [
    { cn:'青龍', it:'Drago Azzurro' }, { cn:'朱雀', it:'Uccello Rosso' },
    { cn:'勾陳', it:'Gancio (Terra)' }, { cn:'螣蛇', it:'Serpente' },
    { cn:'白虎', it:'Tigre Bianca' }, { cn:'玄武', it:'Guerriero Nero' } ];
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
      effEl = (process.env && process.env.RITORNO === 'nullo') ? null : arrEl; casoMut = 3; }
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
    // arrivo vuoto (旬空): movimento nullo (la mobile non e' mai vuota di suo, 動不為空)
    if (vuoti.indexOf(ramoArr) >= 0) { effEl = null; casoMut = 0;
      motivoNullo = 'arrivo vuoto (旬空)'; }
    // sospensione dal giorno: il giorno COMBINA (六合) o CLASHA (六冲) partenza o arrivo
    if (dayBranch && (COMBINA[dayBranch] === ramoDep || COMBINA[dayBranch] === ramoArr ||
        CLASH[dayBranch] === ramoDep || CLASH[dayBranch] === ramoArr)) {
      effEl = null; casoMut = -1;
      motivoNullo = 'sospensione dal giorno (六合/六冲 su partenza o arrivo)'; }
    // trigramma totalmente legato Qian<->Xun: tutte e tre le coppie ramo-controparte combinano
    var trigBloccato = null;
    (function (){
      var NJ = linea <= 3 ? NAJIA_IN : NAJIA_OUT;
      var tutte3 = true;
      for (var k = 0; k < 3; k++){ if (COMBINA[NJ[trigMob][k]] !== NJ[trigTrasf][k]) { tutte3 = false; break; } }
      if (tutte3 && dayBranch && CLASH[dayBranch] !== ramoDep && CLASH[dayBranch] !== ramoArr) {
        effEl = null; casoMut = -3; trigBloccato = linea <= 3 ? 'inf' : 'sup';
        motivoNullo = 'trigramma legato 乾<->巽 (Qian-Xun)'; }
    })();
    // mutante legata dal proprio nascosto (伏神): partenza combina col nascosto sotto di se'
    var fuMob = fushen[linea] || null;
    if (fuMob && COMBINA[ramoDep] === fuMob.b && (!dayBranch || CLASH[dayBranch] !== fuMob.b)) {
      effEl = null; casoMut = -2;
      motivoNullo = 'legata dal proprio nascosto 伏神 (' + fuMob.b + ')'; }
    // AUTOCOMBINAZIONE 自合 (Edu, 13/08/2026, da USDCAD 18/03/2020)
    // Se la PARTENZA della mobile combina (六合) il proprio ARRIVO, la linea si lega
    // a se stessa: e' bloccata, non e' piu' "in movimento" e non regge la lettura.
    var autoComb = (COMBINA[ramoDep] === ramoArr);
    if (autoComb) { effEl = null; casoMut = -4;
      motivoNullo = 'autocombinazione 自合 (' + ramoDep + '合' + ramoArr + ')'; }
    var movimentoNullo = (effEl === null);

    // viaggio/atterraggio della mobile: se l'arrivo COMBINA con un ramo presente, atterra
    var atterraggio = null;
    if (!movimentoNullo){
      var coinc = COMBINA[ramoArr];
      for (var a = 1; a <= 6; a++){ if (ramoAl(a) === coinc){
        atterraggio = { pos: a, ramo: coinc, dir: a <= 3 ? 'SHORT' : 'LONG' }; break; } }
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
    function clashSu(br) {
      var dayC   = !!(dayBranch   && CLASH[dayBranch]   === br);
      var yearC  = !!(yearBranch  && CLASH[yearBranch]  === br && annoTimely);
      var monthC = !!(monthBranch && CLASH[monthBranch] === br);
      var eff = dayC || yearC;
      return { eff: eff, dayC: dayC, yearC: yearC, monthC: monthC,
               potenza: eff ? ((dayC?1:0) + (yearC?1:0) + (monthC?1:0)) : 0 };
    }
    function legataDalGiorno(br) { return !!(dayBranch && COMBINA[dayBranch] === br); }

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
      var st = stagione(WX[br], monthEl);
      if (st === '旺' || st === '相') return true;
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
    var linee = [];
    for (var pos = 1; pos <= 6; pos++){
      var ramo = ramoAl(pos), el = WX[ramo], par = parDi(el);
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
      1:'回頭生 l\'arrivo genera la partenza — partenza rafforzata',
      2:'泄 la partenza genera l\'arrivo — agisce l\'arrivo',
      3:'回頭剋 l\'arrivo controlla la partenza — la partenza muore, agisce l\'arrivo',
      4:'la partenza controlla l\'arrivo — agisce l\'arrivo',
      5:'比和 stesso elemento — partenza rafforzata',
      0:'movimento nullo — ' + (motivoNullo || 'arrivo vuoto'),
      '-1':'movimento nullo — ' + (motivoNullo || 'sospensione dal giorno'),
      '-2':'movimento nullo — ' + (motivoNullo || 'legata dal nascosto'),
      '-3':'movimento nullo — ' + (motivoNullo || 'trigramma legato Qian-Xun')
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

  // ---- spiriti dal GIORNO/MESE (helper, identici a pb_stress.js) ----
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

  LY_VIE.push({ id:'B62', sezione:'§62', nome:'G mobile consegnato al C forte (IN TESTA)',
    dottrina:'G mobile che ARRIVA nell\'elemento di un C fermo, timely e pieno che lo controlla → il G si consegna al carnefice, il trend muore → OPPOSTO della sede del G (G sotto → LONG, G sopra → SHORT). Pilastro dottrinale (Edu 16/08), sopra soglia statistica ma fissato per dottrina. C è ambivalente: con la W la genera, con un G vicino lo attacca.',
    test: function (R, ctx) {
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

  LY_VIE.push({ id:'R1', sezione:'—', nome:'Mobile distrutta: legge la timely',
    dottrina:'La mobile clashata dal giorno e vuota, e non timely: se una sola altra linea (non C/B) è viva, non vuota, non clashata dal giorno e timely, la sua posizione detta la direzione (opposta alla sua sede).',
    test: function (R, ctx) {
      var c = _ctx(R);
      var mob = R.linee[R.mutante.pos-1], dep = R.mutante.ramoDep;
      var AUTOP = ['辰','午','酉','亥'];
      if (!((R.vuoti.indexOf(dep)>=0) && (CLASH[c.D]===dep) && !c.timely(mob.el))) return null;
      var cand = R.linee.filter(function (l) { return l.pos!==mob.pos && c.vivo(l) && R.vuoti.indexOf(l.ramo)<0 &&
        CLASH[c.D]!==l.ramo && !(l.ramo===c.D && AUTOP.indexOf(l.ramo)>=0) &&
        ['C','B'].indexOf(l.par)<0 && c.timely(l.el); });
      if (cand.length!==1) return null;
      return cand[0].pos<=3 ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R2', sezione:'—', nome:'Capolinea G drenato dal nascosto',
    dottrina:'Il capolinea del qi (riceve e non cede) è un G solo, e il suo nascosto lo drena (G genera il nascosto): direzione della sede del G.',
    test: function (R, ctx) {
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
      return capG.pos<=3 ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R3', sezione:'—', nome:'刑 col nascosto, entrambi deboli',
    dottrina:'Una linea in punizione (刑) col proprio nascosto, ed entrambi non timely: direzione della sede della linea.',
    test: function (R, ctx) {
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
      return l.pos<=3 ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R4', sezione:'—', nome:'Capolinea G (senza drenaggio)',
    dottrina:'Il capolinea del qi è un G solo (anche senza nascosto che lo drena): direzione della sua sede.',
    test: function (R, ctx) {
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
      return capG.pos<=3 ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R5', sezione:'—', nome:'退神 mobile retrocedente',
    dottrina:'La mobile retrocede (stesso elemento, ramo antiorario): la sua direzione regge se il clash dell\'anno la colpisce, altrimenti si legge l\'opposto.',
    test: function (R, ctx) {
      var c = _ctx(R);
      if (R.mutante.progressione !== 'retrocedente') return null;
      var mob = R.linee[R.mutante.pos-1], dep = R.mutante.ramoDep;
      var suo = mob.pos<=3 ? 'SHORT' : 'LONG';
      return CLASH[c.Y]===dep ? suo : (suo==='LONG' ? 'SHORT' : 'LONG');
    }});

  LY_VIE.push({ id:'R6', sezione:'—', nome:'三會 col mese',
    dottrina:'Le tre linee di una radunanza stagionale (三會) sono presenti insieme al ramo del mese: se sopra/sotto sono squilibrate, vince la maggioranza.',
    test: function (R, ctx) {
      var c = _ctx(R);
      var HUI=[{r:['寅','卯','辰'],el:'Wood'},{r:['巳','午','未'],el:'Fire'},
               {r:['申','酉','戌'],el:'Metal'},{r:['亥','子','丑'],el:'Water'}];
      var tutti = {}; R.linee.forEach(function(l){tutti[l.ramo]=true;}); c.bazi.forEach(function(b){tutti[b]=true;});
      var fh = HUI.filter(function (h) { return h.r.every(function(x){return tutti[x];}) && h.r.indexOf(c.Mo)>=0; });
      if (fh.length!==1) return null;
      var ln = R.linee.filter(function (l) { return l.el===fh[0].el; });
      var b_ = ln.filter(function(l){return l.pos<=3;}).length, a_ = ln.length-b_;
      if (b_===a_) return null;
      return b_>a_ ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R7_54b', sezione:'§54b', nome:'Mese controlla il Tai Sui + genera il Ti',
    dottrina:'Il ramo del mese controlla il Tai Sui (anno) e l\'arrivo della mobile genererebbe il Ti (timely): il Ti è nutrito da una fonte instabile → NON segue.',
    test: function (R, ctx) {
      var c = _ctx(R);
      var A = ctx.corpoEl; if (!A) return null;
      var arrEl2 = WX[R.mutante.ramoArr], yEl = WX[c.Y], moEl = WX[c.Mo];
      if (CTRL[moEl]!==yEl) return null;
      if (!(GEN[arrEl2]===A && c.timely(arrEl2))) return null;
      return ctx.emaDir==='up' ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R8_49', sezione:'§49', nome:'Tai Sui mobile muta nel G del palazzo',
    dottrina:'La mobile è il Tai Sui e la sua mutazione arriva nell\'elemento Ufficiale del palazzo: la sua direzione conduce.',
    test: function (R, ctx) {
      var mob = R.linee[R.mutante.pos-1];
      if (!mob.isTaiSui) return null;
      var arrEl2 = WX[R.mutante.ramoArr], gEl = null;
      var els = ['Wood','Fire','Earth','Metal','Water'];
      for (var i=0;i<els.length;i++) if (CTRL[els[i]]===R.palEl) { gEl = els[i]; break; }
      if (arrEl2 !== gEl) return null;
      return mob.pos<=3 ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R9_51', sezione:'§51', nome:'Mobile muta nella tomba del proprio elemento',
    dottrina:'G vibrante (timely) che entra nella propria tomba si spegne → opposto della sua sede. B non vibrante che entra nella propria tomba si spegne → opposto della sua sede.',
    test: function (R, ctx) {
      var c = _ctx(R);
      var mob = R.linee[R.mutante.pos-1], dep = R.mutante.ramoDep;
      var TOMBA = {Fire:'戌',Water:'辰',Metal:'丑',Wood:'未'};
      var depEl = WX[dep];
      if (TOMBA[depEl] !== R.mutante.ramoArr) return null;
      var vibrante = c.timely(depEl);
      var suo = mob.pos<=3 ? 'SHORT' : 'LONG', opp = suo==='LONG' ? 'SHORT' : 'LONG';
      if (mob.par==='G' && vibrante) return opp;
      if (mob.par==='B' && !vibrante) return opp;
      return null;
    }});

  LY_VIE.push({ id:'R11_53c', sezione:'§53c', nome:'Fratello timely in L4 (Ti)',
    dottrina:'Con lo Yong in basso, se L4 (nel Ti) è un B vivo e timely: NON segue (un fratello nel Ti drena il trend).',
    test: function (R, ctx) {
      var c = _ctx(R);
      var yongBasso = R.mutante.pos<=3;
      var l4 = R.linee[3];
      if (!(yongBasso && l4.par==='B' && c.vivo(l4) && c.timely(l4.el))) return null;
      return ctx.emaDir==='up' ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R12_53d', sezione:'§53d', nome:'G pieno e timely nel Ti + vuoto nel Ti',
    dottrina:'Nel Ti c\'è un G timely e pieno, ma anche una linea vuota: falla nel trend → NON segue.',
    test: function (R, ctx) {
      var c = _ctx(R);
      var yongBasso = R.mutante.pos<=3;
      var tiRange = yongBasso ? [4,5,6] : [1,2,3];
      var tiLinee = R.linee.filter(function(l){return tiRange.indexOf(l.pos)>=0;});
      var gTiPieno = tiLinee.filter(function(l){return l.par==='G' && c.vivo(l) && c.timely(l.el) && !l.vuoto;});
      var tiHaVuoto = tiLinee.some(function(l){return l.vuoto;});
      if (!(gTiPieno.length>=1 && tiHaVuoto)) return null;
      return ctx.emaDir==='up' ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R13_52', sezione:'§52', nome:'Chi non vince perde (azione fallita)',
    dottrina:'L\'azione della mobile fallisce — 回頭剋, autocombinazione, o l\'arrivo clashato dal giorno: non porta la sua direzione, si legge l\'opposto.',
    test: function (R, ctx) {
      var c = _ctx(R);
      var mob = R.linee[R.mutante.pos-1];
      var huitou = R.mutante.casoMut===3;
      var autoc = mob.stato==='autocombinata';
      var clashArr = CLASH[c.D]===R.mutante.ramoArr;
      if (!(huitou || autoc || clashArr)) return null;
      var suo = mob.pos<=3 ? 'SHORT' : 'LONG';
      return suo==='LONG' ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R14_50de', sezione:'§50d/e', nome:'Combinazione del bersaglio: generativa/distruttiva',
    dottrina:'L\'arrivo della mobile combina un bersaglio fermo e pieno. Se la combinazione è DISTRUTTIVA (controllo): il Tai Sui da solo la compie (direzione opposta alla sede del bersaglio); due deboli si legano e porta la sede del bersaglio. Se GENERATIVA: il Tai Sui la porta sempre; altrimenti solo se il bersaglio è timely.',
    test: function (R, ctx) {
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
        if (aTim && tTim && mob.isTaiSui) return dirB==='LONG' ? 'SHORT' : 'LONG';
        if (!aTim && !tTim) return dirB;
        return null;
      } else {
        if (mob.isTaiSui) return dirB;
        if (c.timely(tEl)) return dirB;
        return null;
      }
    }});

  LY_VIE.push({ id:'R16_50f', sezione:'§50f', nome:'Arrivo genera una W timely/forte',
    dottrina:'L\'arrivo della mobile genera una o più linee W ferme, timely o forti (sostenute dal giorno/anno): direzione della maggioranza (sopra/sotto).',
    test: function (R, ctx) {
      var c = _ctx(R);
      var mob = R.linee[R.mutante.pos-1];
      var arr = R.mutante.ramoArr, aEl = WX[arr];
      var forte = function(el){ return WX[c.D]===el || GEN[WX[c.D]]===el || WX[c.Y]===el || GEN[WX[c.Y]]===el; };
      var tgt = R.linee.filter(function(l){return l.pos!==mob.pos && l.par==='W' && GEN[aEl]===l.el;});
      if (!tgt.length) return null;
      var basso = tgt.filter(function(l){return l.pos<=3;}).length, alto = tgt.length-basso;
      if (basso===alto) return null;
      if (!tgt.some(function(l){return c.timely(l.el) || forte(l.el);})) return null;
      return basso>alto ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R17_50g', sezione:'§50g', nome:'Combinazione doppia lega in basso',
    dottrina:'L\'arrivo combina un ramo presente in due linee ferme e piene, divise sopra/sotto: il legame si compie in basso → SHORT.',
    test: function (R, ctx) {
      var mob = R.linee[R.mutante.pos-1];
      var arr = R.mutante.ramoArr, part = COMBINA[arr];
      if (!part) return null;
      var tgt = R.linee.filter(function(l){return l.pos!==mob.pos && l.ramo===part && !l.vuoto;});
      if (tgt.length<2) return null;
      var basso = tgt.filter(function(l){return l.pos<=3;}).length, alto = tgt.length-basso;
      if (!(basso>0 && alto>0)) return null;
      return 'SHORT';
    }});

  LY_VIE.push({ id:'R18_50h', sezione:'§50h', nome:'Nascosto vuoto clashato dall\'arrivo',
    dottrina:'L\'arrivo clasha il nascosto (vuoto) di una linea ferma sola: con ≥2 sostegni (stagione + giorno + anno) esce dal vuoto e agisce nella sua sede; con 0 sostegni il clash lo sfonda → opposto.',
    test: function (R, ctx) {
      var c = _ctx(R);
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
      if (nSup>=2) return dirH;
      if (nSup===0) return dirH==='LONG' ? 'SHORT' : 'LONG';
      return null;
    }});

  LY_VIE.push({ id:'R21_50k', sezione:'§50k', nome:'Il giorno rompe la combinazione del Tai Sui',
    dottrina:'Il giorno clasha il ramo dell\'anno (Tai Sui): se una linea ferma sola combina il Tai Sui, la sede di quella linea si ribalta.',
    test: function (R, ctx) {
      var c = _ctx(R);
      if (CLASH[c.D]!==c.Y) return null;
      var part = COMBINA[c.Y];
      var tgt = R.linee.filter(function(l){return l.ramo===part && !l.isMobile;});
      if (tgt.length!==1) return null;
      var dirT = tgt[0].pos<=3 ? 'SHORT' : 'LONG';
      return dirT==='LONG' ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R22_50kbis', sezione:'§50k-bis', nome:'P vivo drena un G nascosto forte',
    dottrina:'Un P vivo genera (drena) il proprio G nascosto, e quel G è forte (timely o sostenuto dal giorno/anno): direzione della sede del P.',
    test: function (R, ctx) {
      var c = _ctx(R);
      var cand = R.linee.filter(function(l){return l.par==='P' && c.vivo(l) && l.fushen && l.fushen.par==='G' && GEN[l.fushen.el]===l.el;});
      if (cand.length!==1) return null;
      var fu = cand[0].fushen;
      var gForte = c.timely(fu.el) || WX[c.D]===fu.el || GEN[WX[c.D]]===fu.el || WX[c.Y]===fu.el;
      if (!gForte) return null;
      return cand[0].pos<=3 ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R20_50j', sezione:'§50j', nome:'Due Fratelli divisi, il rafforzato cura la sua sezione',
    dottrina:'Due B, uno sopra e uno sotto: se la mobile è un B rafforzato (回頭生/比和 o avanzante), guarisce la propria sezione.',
    test: function (R, ctx, state) {
      if (state.oraNeutra) return null;   // FILTROORA (P/B sulla partenza=ora, spento di default)
      var mob = R.linee[R.mutante.pos-1];
      var Bs = R.linee.filter(function(l){return l.par==='B';});
      var bB = Bs.filter(function(l){return l.pos<=3;}), bA = Bs.filter(function(l){return l.pos>3;});
      if (!(bB.length===1 && bA.length===1 && mob.par==='B' &&
        (R.mutante.casoMut===1 || R.mutante.progressione==='avanzante'))) return null;
      return mob.pos<=3 ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R19_50i', sezione:'§50i', nome:'Gua inferiore interamente vuoto',
    dottrina:'Tutti i rami del trigramma inferiore (Houtian) sono vuoti (旬空): il pavimento cede → SHORT.',
    test: function (R, ctx) {
      if (!HOUTIAN[R.inf].every(function(b){return R.vuoti.indexOf(b)>=0;})) return null;
      return 'SHORT';
    }});

  LY_VIE.push({ id:'R23_55', sezione:'§55', nome:'P mobile: l\'arrivo clasha il Tai Sui fermo',
    dottrina:'Una P mobile il cui ARRIVO clasha il Tai Sui (ramo dell\'anno) fermo: il trend rappresentato dalla sede del Tai Sui si rompe (TS sotto → SALE/LONG, TS sopra → SCENDE/SHORT). Il giorno che combina il Tai Sui lo difende: tace. Subordinata a G e W (criterio di precedenza).',
    test: function (R, ctx, state) {
      if (state.oraNeutra) return null;
      var mob = R.linee[R.mutante.pos-1];
      if (mob.par!=='P') return null;
      var tsL = R.linee.filter(function(l){return l.isTaiSui && !l.isMobile;});
      if (tsL.length!==1) return null;
      var ts = tsL[0];
      if (!(CLASH[R.mutante.ramoArr]===ts.ramo && COMBINA[R.dayBranch]!==ts.ramo)) return null;
      return ts.pos<=3 ? 'LONG' : 'SHORT';
    }});

  LY_VIE.push({ id:'R24_56', sezione:'§56', nome:'B combina il Tai Sui vuoto, A trasportato ostile',
    dottrina:'L\'ARRIVO combina un Tai Sui fermo VUOTO, e la PARTENZA (trasportata su di lui) è ostile — lo clasha o lo controlla: la sede del Tai Sui non regge.',
    test: function (R, ctx, state) {
      if (state.oraNeutra) return null;
      var tsL = R.linee.filter(function(l){return l.isTaiSui && !l.isMobile && l.vuoto;});
      if (tsL.length!==1) return null;
      var ts = tsL[0];
      var A = R.mutante.ramoDep, Bb = R.mutante.ramoArr;
      if (!(COMBINA[Bb]===ts.ramo && (CLASH[A]===ts.ramo || CTRL[WX[A]]===ts.el))) return null;
      return ts.pos<=3 ? 'LONG' : 'SHORT';
    }});

  LY_VIE.push({ id:'R25_58', sezione:'§58', nome:'G fermo sul ramo del giorno',
    dottrina:'Un G fermo siede sul ramo del giorno: il mercato NON segue il trend. Tace se la mobile o l\'ora combinano il giorno, o se la mobile è una W (W comanda). Modalità GGIORNOVIA: ti+yong (default, effetto pieno) oppure solo-ti.',
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
      return ctx.emaDir==='up' ? 'SHORT' : 'LONG';
    }});

  LY_VIE.push({ id:'R26_59', sezione:'§59', nome:'P mobile con partenza = spirito del giorno',
    dottrina:'Una P mobile la cui PARTENZA è uno spirito del giorno (Generale del Mese 月將, Ding 丁神, Cavallo Postale 驛馬): il Generale amplifica la natura del drenatore di G → il mercato NON segue il trend.',
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
      return ctx.emaDir==='up' ? 'SHORT' : 'LONG';
    }});

  // ---- i 2 rafforzativi (agiscono SOLO nel contrasto PB↔LY, non come vie autonome) ----
  var LY_RAFFORZATIVI = [
    { id:'ORA', nome:'Ora dal seme sostiene chi segue',
      dottrina:'Se la PARTENZA della mobile è il ramo dell\'ORA dal seme, e chi dice "segue il trend" (fra PB e LY) è il PB: nel contrasto vince il PB (§57, come via da sola RESPINTA — peggiora; come rafforzativo FISSATO).',
      test: function (R, ctx, state) { return !!(ctx.oraBranch && R.mutante.ramoDep === ctx.oraBranch); } },
    { id:'WVIRTU', nome:'W benedetta (Virtù + Ghost/Tomb) sostiene chi segue',
      dottrina:'La mobile è una W la cui PARTENZA è 天德, 支德 (Virtù, §60) oppure Ghost 鬼煞 o Tomb 墓煞 dallo stelo del giorno (§61): se chi dice "segue" è il PB, nel contrasto vince il PB. S9 = riferimento del termometro.',
      test: function (R, ctx, state) {
        var mob = R.linee[R.mutante.pos-1];
        if (mob.par!=='W') return false;
        var A = R.mutante.ramoDep;
        var virtu = (A === tiande(R.monthBranch, R.dayStem, R.dayBranch)) || (A === zhide(R.dayBranch));
        var gh = STELO_SPIRITI.ghost[R.dayStem] || [], tb = STELO_SPIRITI.tomb[R.dayStem] || [];
        var stelo = gh.indexOf(A)>=0 || tb.indexOf(A)>=0;
        return virtu || stelo;
      } }
  ];

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
      var dir = v.test(R, ctx, state);
      if (dir) return { dir: dir, viaId: v.id, sezione: v.sezione, nome: v.nome,
        ramoDep: R.mutante.ramoDep, mobPar: R.linee[R.mutante.pos-1].par };
    }
    return { dir: null, viaId: null, ramoDep: R.mutante.ramoDep, mobPar: R.linee[R.mutante.pos-1].par };
  }

  // ---- combinazione S9: PB (segna la direzione) + LY (correttivo) + 2 rafforzativi ----
  // pbDir: 'LONG'|'SHORT' (verdetto finale del PB, già combinato con l'EMA)
  // ctx.emaDir: 'up'|'down' — usato per capire se il PB "segue" il trend grezzo
  function combinaS9(R, ctx, pbDir, enabled, enabledRaff, opts) {
    var t = termometro(R, ctx, enabled, opts);
    if (!t.dir) return { finale: pbDir, chi: 'PB solo (LY tace)', via: null, ly: null };
    if (t.dir === pbDir) return { finale: pbDir, chi: 'PB e LY concordano (via ' + t.sezione + ')', via: t, ly: t.dir };
    // contrasto: valuto i rafforzativi in ordine (ora, poi W benedetta)
    var ema = ctx.emaDir === 'up' ? 'LONG' : 'SHORT';
    var pbSegue = (pbDir === ema);
    enabledRaff = enabledRaff || {};
    var aOra = enabledRaff.ORA !== false && LY_RAFFORZATIVI[0].test(R, ctx);
    var wVirtu = enabledRaff.WVIRTU !== false && LY_RAFFORZATIVI[1].test(R, ctx);
    if ((aOra || wVirtu) && pbSegue) {
      var chi = aOra ? 'contrasto → rafforzativo ORA sostiene il PB' : 'contrasto → rafforzativo W BENEDETTA sostiene il PB';
      return { finale: pbDir, chi: chi, via: t, ly: t.dir };
    }
    return { finale: t.dir, chi: 'contrasto → vince LY (via ' + t.sezione + ' ' + t.nome + ')', via: t, ly: t.dir };
  }

  return { read: read, readManual: readManual, TRIGRAM: TRIGRAM,
           PAR: PAR, SEI_BESTIE: SEI_BESTIE, EL_IT: EL_IT, BR_IT: BR_IT,
           oraDalSeme: oraDalSeme,
           LY_VIE: LY_VIE, LY_RAFFORZATIVI: LY_RAFFORZATIVI,
           termometro: termometro, combinaS9: combinaS9,
           generaleDelMese: generaleDelMese, dingSpirit: dingSpirit,
           tiande: tiande, zhide: zhide, STELO_SPIRITI: STELO_SPIRITI };
}));
