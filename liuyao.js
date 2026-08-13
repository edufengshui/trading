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

  return { read: read, readManual: readManual, TRIGRAM: TRIGRAM,
           PAR: PAR, SEI_BESTIE: SEI_BESTIE, EL_IT: EL_IT, BR_IT: BR_IT,
           oraDalSeme: oraDalSeme };
}));
