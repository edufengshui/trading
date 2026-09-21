/*
 * MOTORE DI LETTURA — v5, ricostruito e sviluppato in S45 (09-11/09/2026)
 * ============================================================================
 * Legge una carta come la legge Edu: si trova il protagonista (la mobile), se ne
 * segue la traccia fino in fondo, le altre cose salienti sono conferme o smentite,
 * non voti. L'energia dice quanto, non da che parte. Tutto documentato passo per
 * passo nel REGISTRO_CORREZIONI_13_08_2026.md, sezioni S45.
 *
 * SPINA DORSALE — I QUATTRO PRINCIPI DI EDU (14/09/2026), S47 (15/09/2026):
 *   1. Si risolve con le LINEE MOBILI. La penalita' della data sull'arrivo e' la morte del
 *      movimento, non la condanna della sede: la sede resta se' stessa e si prosegue.
 *      Un arrivo nel vuoto non raggiunge nessuno e non fa retrocedere.
 *   2. Se c'e' un blocco nel movimento e non si arriva a una soluzione, si usano le BESTIE —
 *      solo se portano un vantaggio (alla linea, o nel confronto con l'altra sede): il ponte
 *      fra le due sedi, l'elemento che controlla l'altra sede, il qi che la bestia porta sul
 *      nascosto della sede (Edu, 15/09). Queste vengono PRIMA del confronto; il conteggio
 *      delle bestie pesato col carattere (Claude, da validare) solo alla parita'.
 *   3. SHI CONTRO YING, come stanno, con gli elementi dopo le bestie (T8).
 *   4. Se niente conclude, LA LINEA PIU' FORTE dell'esagramma (T9). Solo dopo, il silenzio.
 * Ogni gradino qui sotto e' un CASO appeso a uno dei quattro principi, non un principio.
 * Una lettura nuova di Edu si attacca a uno dei quattro; se non ci sta, si discute il
 * principio, non si aggiunge un gradino.
 *
 * ORDINE DELLE TRACCE (ogni gradino e' dietro interruttore, =off lo spegne):
 *   T0   guerra fra titani                MLGUERRA   due pilastri sulla stessa linea in
 *                                                    clash, o in penalita' se sono solo due
 *   T0b  la bestia clasha la mobile       MLTAISUI   la blocca: resta se' stessa e parla
 *   T0e  la seconda mobile impiglia/blocca DUEMUTPART=on (spento: costa)
 *   T0g  il trigono in movimento          MLTRIGMOB  partenze+arrivi delle linee che girano
 *                                                    formano un trigono che circonda una sede
 *   T0x  le vincenti portate (Edu 16/09) MLPORTATE  l'incompatibile controllata indietro combina;
 *                                                    l'arrivo sul Tai Sui clashato scende e combina;
 *                                                    i G/W finiscono in un trigramma: vince
 *   T0m  lo stato del movimento (Edu 16/09) MLSTATOMOV nel vuoto -> linea invalidata; partenza toccata
 *                                                    -> non parte (vuota: attiva; piena: inusabile);
 *                                                    arrivo toccato -> solo l'arrivo; TS e incompatibili
 *   T0a  la sede in ritardo (Edu 16/09)  MLSVEGLIACOMB sede mobile VUOTA con la partenza combinata dal
 *                                                    giorno: non si trasforma ma e' viva; controllo
 *   T0s  l'effetto scala                 MLSCALA    una seconda arriva sul ramo da cui parte la
 *                                                    mobile: il movimento prosegue e parla l'arrivo
 *                                                    finale (P/B perde; G/W solo con MLSCALAGW=on)
 *   T0r  la seconda che retrocede        MLBESTIESEC seconda mobile G/W (incompatibile) che
 *                                                    retrocede: la sua sede perde, piu' forte della prima
 *   T0c  il B che avanza ruba la W        MLLADRO    solo 進神; se anche l'altra sede e'
 *                                                    presa dalle bestie, confronto
 *   T1a  il malus retrocede/avanza        MLPROG     P/B; MLIMPIGLIO se il giorno combina la
 *        il vantaggio retrocede           MLPROGBEN  partenza; G/W SOLO ritirata
 *   T1   la sostituzione                  MLSOST     possesso della bestia + passo chiuso
 *   T1b  confronto fra le due sedi prese  MLPOSSESSO relazione, poi forza, poi bestie
 *   T2   la sede si occupa di se' (回頭剋) MLINDIETRO forza; il nascosto prende la sede (MLFUSHEN)
 *   T2b  nutrita dal proprio arrivo (回頭生) MLNUTRITA  tomba: MLTOMBA
 *   T2n  il movimento finisce in niente  MLNIENTE   l'arrivo combina una ferma vuota C: chi non
 *                                                    vince perde, la sede della mobile perde
 *   T4z  l'unica azione (§69)            MLUNICA    mobile sospesa dal giorno, nessun raduno, il
 *                                                    giorno clasha una sola ferma: vuota decide, piena si rompe
 *   T2d  la sede va a combinare           MLSEDECOMB solo a passo vivo
 *   T2c  la mobile ritrova la sua copia   MLCOPIA
 *   T3   il raduno che serve la linea     MLSERVE    di stagione la trasforma (MLRADTRASF);
 *                                                    non decide se l'elemento e' anche su una
 *                                                    sede dall'altra parte (MLRADSEDE)
 *   T4   il giorno (o il secondo arrivo) tiene/distrugge l'arrivo   MLGIORNO
 *   T4b  la sede presa dalle bestie       MLSEDEPRESA
 *   T4c  la svegliata dal giorno          MLSVEGLIA
 *   T4d  la ferma incompatibile agisce    MLINCFERMA
 *   T5   le tre porte                     MLPORTE    non a ritirata senza forza (MLRITIRATA)
 *   T5b/T5c porte/carattere della seconda DUEMUT2=on / SECONDACAR=dopo (spenti: costano)
 *   T6   il trigono che nutre             MLNUTRE
 *   T7   il duello, solo alla fine        MLDUELLO   solo se una sede e' fuori e l'altra no
 *
 * BESTIE (Edu): clasha la mobile -> la blocca · clasha la ferma -> la sveglia · controlla o
 * drena -> se ne impadronisce · la linea la controlla -> vince solo se di stagione · la
 * nutre -> la aiuta · linea vuota o due bestie -> possesso sempre · una bestia non e' mai
 * vuota · due bestie: catena dell'energia, puo' finire sul ramo della linea · coincide col
 * nascosto -> lo tira fuori.
 * LINEA INCOMPATIBILE (cinque coppie: 卯兌 午坎 申艮 col ponte, 丑坤 辰乾 senza): ferma ->
 * diventa mobile; mobile -> non si ferma. FUTURO=insieme: l'esagramma futuro con tutte le
 * linee che girano. DUEMUT: il secondo arrivo tiene/distrugge l'arrivo della prima.
 *
 * MOSTRA=CROSS|YYYY-MM-DD[;CROSS|DATA...]  stampa le letture in un solo avvio.
 * Le linee si chiamano per lettera: P B W G C.
 * ============================================================================
 */
'use strict';

function creaMotore(LYM) {
  var ENV = (typeof process !== 'undefined' && process.env) ? process.env : {};

  var WX = { '子':'Water','丑':'Earth','寅':'Wood','卯':'Wood','辰':'Earth','巳':'Fire',
             '午':'Fire','未':'Earth','申':'Metal','酉':'Metal','戌':'Earth','亥':'Water' };
  var GEN = { Wood:'Fire', Fire:'Earth', Earth:'Metal', Metal:'Water', Water:'Wood' };
  var KE  = { Wood:'Earth', Earth:'Water', Water:'Fire', Fire:'Metal', Metal:'Wood' };
  var TOMBA = { Wood:'未', Fire:'戌', Metal:'丑', Water:'辰', Earth:'辰' };
  var COMBINA = { '子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯',
                  '辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午' };
  var CLASH = { '子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅',
                '卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳' };
  // 退神 (retrocedere): il passo indietro nella stessa famiglia.
  var RETRO = { '寅':'亥', '巳':'辰', '申':'未', '亥':'戌', '卯':'寅', '午':'巳', '酉':'申',
                '子':'亥', '辰':'丑', '未':'辰', '戌':'未', '丑':'戌' };
  var AUTOPEN = { '辰': 1, '午': 1, '酉': 1, '亥': 1 };
  var AVANZA = {}; Object.keys(RETRO).forEach(function (a) { AVANZA[RETRO[a]] = a; });   // 進神: l'inverso della ritirata
  var XING = { '寅':'巳','巳':'申','申':'寅','丑':'戌','戌':'未','未':'丑','子':'卯','卯':'子' };
  var SEASON = { '寅':'Wood','卯':'Wood','辰':'Wood','巳':'Fire','午':'Fire','未':'Fire',
                 '申':'Metal','酉':'Metal','戌':'Metal','亥':'Water','子':'Water','丑':'Water' };
  var TRIGONI = [['申','子','辰'],['亥','卯','未'],['寅','午','戌'],['巳','酉','丑']];
  var RADUNI  = [['亥','子','丑'],['寅','卯','辰'],['巳','午','未'],['申','酉','戌']];
  var STEM_BESTIA = { '甲':'青龍','乙':'青龍','丙':'朱雀','丁':'朱雀','戊':'勾陳',
                      '己':'螣蛇','庚':'白虎','辛':'白虎','壬':'玄武','癸':'玄武' };
  var STEM_EL = { '甲':'Wood','乙':'Wood','丙':'Fire','丁':'Fire','戊':'Earth','己':'Earth',
                  '庚':'Metal','辛':'Metal','壬':'Water','癸':'Water' };
  var EL_IT = { Wood:'Legno', Fire:'Fuoco', Earth:'Terra', Metal:'Metallo', Water:'Acqua' };
  var PAR_IT = { G:'G', W:'W', P:'P', B:'B', C:'C' };
  // Tombe (墓): la Terra dove ogni elemento si sotterra.
  var TOMBA = { 'Water': '辰', 'Fire': '戌', 'Metal': '丑', 'Wood': '未', 'Earth': '辰' };
  var PESO_STAGIONE = { '旺': 2, '相': 1, '休': 0, '囚': -1, '死': -2 };

  var off = function (k) { return ENV[k] === 'off'; };
  var sede = function (pos) { return pos <= 3 ? 'SHORT' : 'LONG'; };
  var opposto = function (d) { return d === 'LONG' ? 'SHORT' : 'LONG'; };

  function parDi(el, palEl) {
    if (!el || !palEl) return null;
    if (el === palEl) return 'B';
    if (GEN[palEl] === el) return 'C';
    if (GEN[el] === palEl) return 'P';
    if (KE[palEl] === el) return 'W';
    if (KE[el] === palEl) return 'G';
    return null;
  }

  function dirDelCarattere(par, pos) {
    if (par === 'G' || par === 'W') return sede(pos);
    if (par === 'P' || par === 'B') return opposto(sede(pos));
    return null;
  }

  function contesto(R, ctx) {
    var mEl = R.monthBranch ? WX[R.monthBranch] : null;
    var sEl = R.monthBranch ? SEASON[R.monthBranch] : null;

    // La stagione si misura come in liuyao.js (stadioMese): il MIGLIORE fra il conto
    // sul ramo del mese e quello sull'elemento della stagione, e la Terra e' prospera
    // nei quattro mesi di Terra. La versione precedente guardava solo la stagione ed
    // era sbagliata: nel mese 未 faceva risultare il Metallo morto invece che in crescita.
    var PESO = { '旺': 2, '相': 1, '休': 0, '囚': -1, '死': -2 };
    function contro(el, rif) {
      if (!el || !rif) return null;
      if (el === rif) return '旺';
      if (GEN[rif] === el) return '相';
      if (GEN[el] === rif) return '休';
      if (KE[rif] === el) return '死';
      if (KE[el] === rif) return '囚';
      return '休';
    }
    function stagione(el) {
      if (!el) return null;
      if (el === 'Earth' && ['辰','戌','丑','未'].indexOf(R.monthBranch) >= 0) return '旺';
      var a = contro(el, mEl), b = contro(el, sEl);
      return (PESO[a] || 0) >= (PESO[b] || 0) ? a : b;
    }
    function timely(el) { var st = stagione(el); return st === '旺' || st === '相'; }

    var pil = [];
    if (ctx && ctx.pilastri) {
      var ordine = ['giorno', 'mese', 'anno', 'ora'];
      for (var o = 0; o < ordine.length; o++)
        for (var p = 0; p < ctx.pilastri.length; p++) {
          var P = ctx.pilastri[p];
          if (P && P.nome === ordine[o] && P.stelo && P.ramo) pil.push(P);
        }
    }

    var suLinea = {};
    for (var i = 0; i < pil.length; i++) {
      var b = STEM_BESTIA[pil[i].stelo];
      if (!b) continue;
      for (var z = 0; z < R.linee.length; z++) {
        var L = R.linee[z];
        if (L.bestia && L.bestia.cn === b) {
          if (!suLinea[L.pos]) suLinea[L.pos] = [];
          suLinea[L.pos].push({ nome: pil[i].nome, stelo: pil[i].stelo, ramo: pil[i].ramo, _L: L });
        }
      }
    }

    for (var pz in suLinea) {
      var gruppo = suLinea[pz];
      // Edu, 11/09/2026: con piu' bestie che non si combattono, agiscono solo quelle che aiutano
      // la linea; se nessuna la aiuta, nessuna agisce (USDJPY 06/09/2022: "Y non puo' vincere
      // perche' e' vuoto" — due bestie che la indeboliscono non le tolgono il vuoto).
      if (gruppo.length > 1 && !off('MLBESTIEAIUTO')) {
        var qualcunaAiuta = gruppo.some(function (Q0) {
          var e0 = WX[Q0.ramo], l0 = Q0._L.el; return e0 === l0 || GEN[e0] === l0;
        });
        gruppo.forEach(function (Q0) {
          var e0 = WX[Q0.ramo], l0 = Q0._L.el;
          Q0.agisce = !qualcunaAiuta ? false : (e0 === l0 || GEN[e0] === l0);
        });
      } else gruppo.forEach(function (Q0) { Q0.agisce = true; });
      for (var y = 0; y < gruppo.length; y++) {
        var Q = gruppo[y], Lq = Q._L, pe = WX[Q.ramo], le = Lq.el;
        // Edu, 09/09/2026: una bestia che arriva non e' mai vuota — il vuoto non la tocca.
        if (CLASH[Q.ramo] === Lq.ramo) { Q.azione = Lq.isMobile ? 'blocca' : 'sveglia'; Q.possiede = false; }
        // Edu, 14/09/2026 (USDCAD 17/03/2020): "la bestia mese 己卯 penalizza la prima linea, che
        // non si muove proprio." Un pilastro il cui ramo PENALIZZA (刑) il ramo della linea la
        // penalizza: la linea non si muove; chi riceve la penalita' non fa vincere la propria
        // squadra. MLBESTIAPEN=off.
        else if (!off('MLBESTIAPEN') && (XING[Q.ramo] === Lq.ramo || (Q.ramo === Lq.ramo && AUTOPEN[Q.ramo])) &&
                 !((Q.ramo === '巳' && Lq.ramo === '申') && pil.map(function (P) { return P.ramo; }).indexOf('寅') < 0)) {
          Q.azione = 'penalizza'; Q.possiede = false; Q.penalizza = true;
        }
        else if (gruppo.length > 1) { Q.azione = 'possiede in due'; Q.possiede = true; }
        // Edu, 11/09/2026 (EURJPY 23/10/2024): "Anche se la bestia dell'ora arriva su Y, la
        // presenza contemporanea del vuoto e del mese fuoco nella tomba lo rende inutile."
        // Una bestia il cui elemento e' nella propria TOMBA nel mese, su una linea VUOTA,
        // non fa niente: non la prende e non le toglie il vuoto. MLTOMBA=off.
        else if (Lq.vuoto && !off('MLTOMBA') && TOMBA[pe] === R.monthBranch) {
          Q.azione = 'inutile: il suo elemento è in tomba nel mese e la linea è vuota';
          Q.possiede = false; Q.inutile = true;
        }
        else if (Lq.vuoto) { Q.azione = 'possiede la vuota'; Q.possiede = true; }
        else if (KE[pe] === le) { Q.azione = 'controlla'; Q.possiede = true; }
        else if (GEN[le] === pe) { Q.azione = 'drena'; Q.possiede = true; }
        else if (KE[le] === pe) {
          // Edu, 11/09/2026: "Se e' una bestia sola e la linea e' timely puo' opporsi alla
          // presa, ma se la bestia e' il mese e' impossibile opporsi." MLMESEPRENDE=off toglie
          // l'eccezione del mese (vecchio conto: decide solo la stagione della linea).
          var meseImp = !off('MLMESEPRENDE') && Q.nome === 'mese';
          Q.possiede = meseImp || !timely(le);
          Q.azione = meseImp ? 'la linea la controlla, ma al mese non ci si oppone'
                   : Q.possiede ? 'la linea la controlla ma è fuori stagione'
                                : 'la linea la controlla ed è di stagione';
        }
        else if (GEN[pe] === le) { Q.azione = 'aiuta'; Q.possiede = false; }
        else { Q.azione = 'carica'; Q.possiede = false; }
      }
    }

    // LINEA INCOMPATIBILE (dottrina rivista da Edu, 09/09/2026). Tre coppie in cui il
    // ramo proprio del trigramma controlla il ramo che ci abita: 卯 in 兌, 午 in 坎,
    // 申 in 艮. Il ponte della data (Acqua per 卯 e 申, Legno per 午) la salva se
    // l'elemento in mezzo sta in almeno DUE dei quattro rami della data.
    // La linea incompatibile NON PUO' STARE DOVE STA:
    //   ferma  -> diventa mobile
    //   mobile -> non puo' essere fermata, ne' da un clash ne' da una combinazione
    // Le coppie sono CINQUE (§109, 27/08/2026): tre col controllo, che hanno un ponte
    // (卯 in 兌 · 午 in 坎 · 申 in 艮), e due col CLASH del ramo proprio del trigramma,
    // senza ponte (丑 in 坤: 未丑冲 · 辰 in 乾: 戌辰冲). Claude ne aveva cablate tre;
    // Edu le ha ricordate su AUDUSD 22/12/2025, dove L4 丑 in 坤 e' la seconda.
    var INCOMP = { '卯': { trig: 2, ponte: 'Water' }, '午': { trig: 6, ponte: 'Wood' },
                   '申': { trig: 7, ponte: 'Water' },
                   '丑': { trig: 8, ponte: null }, '辰': { trig: 1, ponte: null },
    // Edu, 11/09/2026 (EURJPY 10/08/2023 seme 157): "L2 Hai e' incompatibile" — 亥 in 巽
    // (巳亥冲). Edu non ha detto se ha un ponte: di default nessuno (come le coppie col
    // solo clash); MLPONTEHAI=legno prova il ponte di Legno (亥 -> 木 -> 巳, come 申 in 艮).
    // S46, USDJPY 09/02/2026 (Edu: "S non puo' muoversi quindi rimane G"): con due 寅 nella
    // data (mese e giorno) il ponte di Legno regge e lo Shi 亥 resta fermo. Quindi 亥 in 巽 HA
    // il ponte di Legno (亥 -> 木 -> 巳), come 申 in 艮. MLPONTEHAI=nessuno per il vecchio conto.
                   '亥': { trig: 5, ponte: ENV.MLPONTEHAI === 'nessuno' ? null : 'Wood' } };
    var ramiData0 = pil.map(function (P) { return P.ramo; });
    function incompDi(L) {
      var k = INCOMP[L.ramo];
      if (!k || k.trig !== (L.pos <= 3 ? R.inf : R.sup)) return null;
      if (!k.ponte) return { ponti: 0, el: null };   // coppia col clash: niente ponte
      var ponti = ramiData0.filter(function (r) { return WX[r] === k.ponte; }).length;
      // Il ponte della linea incompatibile si conta sui QUATTRO RAMI della data (dottrina di
      // S45). In S46 Claude aveva aggiunto gli steli del giorno e dell'ora prendendoli dalla
      // correzione di Edu del 30/08 — ma quella riguardava il ponte dell'ARRIVO nel
      // trigramma futuro (liuyao.js), non questa regola: era un allargamento. Edu, 11/09/2026,
      // su NZDUSD 10/08/2022: "Non avevamo detto che una linea mobile incompatibile non puo'
      // essere fermata da clash e combinazioni?" -> la linea e' incompatibile, il ponte non
      // regge. Estensione di Claude SPENTA: MLPONTE=steli.
      if (ENV.MLPONTE === 'steli') pil.forEach(function (P) {
        if ((P.nome === 'giorno' || P.nome === 'ora') && STEM_EL[P.stelo] === k.ponte) ponti++;
      });
      return ponti >= 2 ? null : { ponti: ponti, el: k.ponte };
    }

    // SECONDA MUTAZIONE (test di Edu, 11/09/2026): la ferma incompatibile che diventa
    // mobile ha una partenza e un ARRIVO. Lo si calcola chiedendo a liuyao la mutazione
    // di quella linea come se fosse lei la mobile (l'arrivo dipende solo dal trigramma
    // e dalla posizione): USDJPY 28/04/2025, L3 申 in 艮 -> 卯, come nella carta di Edu.
    // L'ESAGRAMMA FUTURO SI CALCOLA CON TUTTE LE LINEE CHE GIRANO INSIEME (carta di Edu
    // su AUDUSD 22/12/2025: L6 e L4 girano tutte e due, 坤 diventa 離, e L4 va in 酉 —
    // non in 午 come verrebbe girandola da sola). Numerazione dei trigrammi come in
    // liuyao: n-1 in binario, bit 4 = linea bassa, bit 1 = linea alta, 1 = yin.
    // FUTURO=insieme  -> anche l'arrivo della prima mobile viene dal futuro comune
    // FUTURO=seconde  -> solo le seconde (la prima tiene l'arrivo di liuyao)
    // (default)       -> ogni seconda mutata da sola, come prima
    var seconde = [];
    var mobileArrComune = null;
    if (!off('DUEMUT') && LYM && LYM.readManual) {
      // Edu, 11/09/2026 (USDJPY 09/02/2026): "S non puo' muoversi quindi rimane G" — lo Shi
      // L2 亥 e' incompatibile, ma il giorno 甲寅 lo COMBINA (寅亥合) e lo tiene fermo. La
      // regola "l'incompatibile non si lascia fermare da clash e combinazioni" vale per la
      // linea gia' MOBILE (NZDUSD 10/08/2022), non per la ferma che vorrebbe muoversi.
      // MLINCFERMATA=off toglie il freno.
      // Precisazione di Edu (13/09/2026): "Lo Shi non puo' muoversi perche' ci sono DUE 寅 nella
      // data a combinarlo. E' un'eccezione: se combinato una volta si muove lo stesso, se due
      // no." Il freno scatta solo con due (o piu') rami della data che combinano la linea.
      var ferme = R.linee.filter(function (L) {
        if (L.isMobile || !incompDi(L)) return false;
        if (!off('MLINCFERMATA')) {
          var nComb = ramiData0.filter(function (r) { return COMBINA[r] === L.ramo; }).length;
          if (nComb >= 2) return false;
        }
        return true;
      });
      var modoF = ENV.FUTURO || 'insieme';
      var giraSup = 0, giraInf = 0;
      // 17/09/2026: qui avevo cablato per sbaglio una lettura mia — l'incompatibile fuori dal
      // trigramma della mobile che non fa girare il proprio trigramma. Non serviva: la regola
      // di Edu ("si muove ma non fa niente") e' quella del vuoto, che il motore gia' applicava
      // (L4 丑→午 va nel vuoto e l'intera linea e' invalidata). Tolta.
      var tutteMobili = ferme.concat(modoF === 'sola' ? [] : [R.linee[R.mutante.pos - 1]]);
      if (modoF !== 'sola') tutteMobili.forEach(function (L) {
        if (L.pos <= 3) giraInf ^= (1 << (3 - L.pos)); else giraSup ^= (1 << (6 - L.pos));
      });
      var supF = ((R.sup - 1) ^ giraSup) + 1, infF = ((R.inf - 1) ^ giraInf) + 1;
      var RF = null;
      try { RF = LYM.readManual(supF, infF, 1, R.monthBranch, R.dayBranch, R.yearBranch, R.dayStem, R.oraBranch); } catch (e) {}
      for (var q2 = 0; q2 < ferme.length; q2++) {
        var L2q = ferme[q2];
        try {
          var arr2, R2;
          if (modoF !== 'sola' && RF && RF.linee) arr2 = RF.linee[L2q.pos - 1].ramo;
          else {
            R2 = LYM.readManual(R.sup, R.inf, L2q.pos, R.monthBranch, R.dayBranch, R.yearBranch, R.dayStem, R.oraBranch);
            arr2 = R2 && R2.mutante ? R2.mutante.ramoArr : null;
          }
          // Edu, 15/09/2026 (USDJPY 05/12/2022): "L4 goes into void." Se l'arrivo della seconda
          // e' nel vuoto del giorno, la linea gira ma va nel vuoto: non arriva da nessuna parte
          // (arr: null), e nessun gradino la usa. MLSECVUOTA=off torna a contarla.
          // Resta nella lista (le bestie sulla seconda che non puo' ritirarsi, T0r, la devono
          // vedere), ma con vuota=true: non tiene/distrugge l'arrivo della mobile e non agisce
          // col proprio arrivo (tre porte). MLSECVUOTA=off torna a contarla.
          if (arr2) seconde.push({ L: L2q, dep: L2q.ramo, arr: arr2, arrEl: WX[arr2],
                                   vuota: !off('MLSECVUOTA') && (R.vuoti || []).indexOf(arr2) >= 0 });
        } catch (e) {}
      }
      if (modoF === 'insieme' && RF && RF.linee && ferme.length)
        mobileArrComune = RF.linee[R.mutante.pos - 1].ramo;
    }

    // Il secondo arrivo sulle ALTRE linee (test di Edu, 11/09/2026), con le stesse regole
    // del giorno e delle bestie: combina una ferma -> la impiglia; clasha una ferma -> la
    // sveglia. Dietro DUEMUT2.
    if (ENV.DUEMUT2 === 'on' && seconde.length === 1) {
      var A2 = (ENV.ANDONG === 'si') ? seconde[0].dep : seconde[0].arr;
      for (var q3 = 0; q3 < R.linee.length; q3++) {
        var L3q = R.linee[q3];
        if (L3q.isMobile || L3q.pos === seconde[0].L.pos) continue;
        if (COMBINA[A2] === L3q.ramo) L3q._legata2 = true;
        if (CLASH[A2] === L3q.ramo) L3q._sveglia2 = true;
      }
    }

    var ramiData = ramiData0;

    return { sEl: sEl, timely: timely, stagione: stagione, pil: pil, suLinea: suLinea,
             ramiData: ramiData, D: R.dayBranch, incompDi: incompDi, seconde: seconde, mobileArrComune: mobileArrComune,
             vuoto: function (ramo) { return (R.vuoti || []).indexOf(ramo) >= 0; },
             R: R,
             futuro: { RF: RF, supF: supF, infF: infF },
             incompFuturo: function (ramo, pos) {
               var k = INCOMP[ramo];
               if (!k || k.trig !== (pos <= 3 ? infF : supF)) return null;
               if (!k.ponte) return { ponti: 0 };
               var pn = ramiData0.filter(function (r) { return WX[r] === k.ponte; }).length;
               return pn >= 2 ? null : { ponti: pn };
             } };
  }

  function elDopoLeBestie(L, C) {
    var lista = C.suLinea[L.pos] || [];
    // Edu, 09/09/2026: un pilastro che arriva sulla linea con lo STESSO RAMO del
    // nascosto (伏神) ci coincide e lo tira fuori — la linea diventa il nascosto
    // (EURJPY 10/02/2026: 丙午 arriva sullo Shi e coincide con la P 午 nascosta).
    if (L.fushen) {
      for (var f = 0; f < lista.length; f++)
        if (lista[f].ramo === L.fushen.b) {
          // Claude col metodo, 15/09/2026 (USDJPY 05/11/2020, da validare): il nascosto tirato
          // fuori dalla bestia e' una bestia che si usa, e le bestie si usano se portano un
          // vantaggio (Edu, 14/09). Su una sede, se l'elemento del nascosto PERDE il confronto
          // con l'altra sede (l'altra lo controlla), la sede non lo prende e resta se' stessa.
          // MLBESTIAVANTAGGIO=off torna a tirarlo fuori sempre.
          if (!off('MLBESTIAVANTAGGIO') && C.R && (L.pos === C.R.shi || L.pos === C.R.ying)) {
            var lAltraF = C.R.linee[(L.pos === C.R.shi ? C.R.ying : C.R.shi) - 1];
            if (lAltraF && KE[lAltraF.el] === L.fushen.el) { lista[f].nascostoScartato = true; break; }
          }
          return L.fushen.el;
        }
    }
    if (!lista.length) return L.el;
    // Con UNA bestia sola che prende possesso, la linea diventa quella bestia. Con piu'
    // di una c'e' scambio di qi fra loro e conta il capolinea della catena, che puo'
    // anche tornare sul ramo della linea (USDCAD 18/03/2020: 申 genera 子 che genera
    // 寅, quindi la Ying resta Legno).
    // Edu, 15/09/2026 (GBPUSD 06/05/2020, da validare): "le bestie le usiamo se portano un
    // vantaggio" — con UNA bestia su una sede, se il suo elemento fa vincere la sede nel
    // confronto con l'altra (la controlla, o ne e' generato), la sede lo prende anche senza
    // possesso. MLBESTIAVANTAGGIO=off torna al solo possesso.
    // ORDINE (Edu, 15/09/2026): "la mia e' piu' elegante, fa vedere come la bestia si rende
    // utile, quindi questa regola dovrebbe precedere". Il qi che si sposta sul nascosto viene
    // PRIMA di ogni altro uso della bestia (possesso, ponte, bestia che controlla) e prima del
    // conteggio pesato col carattere (MLBESTIECAR), che resta solo l'ultimo spareggio in T8.
    // Edu, 15/09/2026 (USDJPY 31/07/2024): "Y loses but the day beast comes to rescue and move
    // the Qi from earth to water and wins." La sede GENERA la bestia (Terra -> Metallo) e la
    // bestia genera l'elemento del NASCOSTO (Metallo -> Acqua 子): il qi della sede si sposta
    // sul nascosto, se cosi' vince il confronto (il Metallo dello Shi genera l'Acqua). Vale con o
    // senza possesso. MLQINASCOSTO=off.
    if (lista.length === 1 && !off('MLQINASCOSTO') && C.R && (L.pos === C.R.shi || L.pos === C.R.ying) && L.fushen) {
      var lAltraQ = C.R.linee[(L.pos === C.R.shi ? C.R.ying : C.R.shi) - 1], eQ = WX[lista[0].ramo];
      if (lAltraQ && GEN[L.el] === eQ && GEN[eQ] === L.fushen.el &&
          (GEN[lAltraQ.el] === L.fushen.el || KE[L.fushen.el] === lAltraQ.el)) {
        lista[0].vantaggio = true; lista[0].qiNascosto = true; return L.fushen.el;
      }
    }
    if (lista.length === 1 && !lista[0].possiede && !off('MLBESTIAVANTAGGIO') && C.R &&
        (L.pos === C.R.shi || L.pos === C.R.ying)) {
      var lAltra1 = C.R.linee[(L.pos === C.R.shi ? C.R.ying : C.R.shi) - 1];
      var e1 = WX[lista[0].ramo];
      // Edu, 15/09/2026 (GBPUSD 06/05/2020, CONFERMATA): "S vs Y sees S winning but the beast
      // comes to rescue Y by providing the bridge. Y win." Il PONTE: l'elemento dell'altra sede
      // genera quello della bestia, che genera quello della linea (Terra -> Metallo -> Acqua):
      // il controllo diventa generazione. MLBESTIAVANTAGGIO=larga aggiunge anche la bestia
      // che controlla l'altra sede (misura: ponte 48% su T8, larga 48%).
      var ponte1 = GEN[lAltra1.el] === e1 && GEN[e1] === L.el;
      // Default: ponte (questa carta) + la bestia che controlla l'altra sede (USDJPY 05/12/2022,
      // Edu 15/09: "Ying with water beats Shi with fire"). MLBESTIAVANTAGGIO=ponte per il solo ponte.
      // EURGBP 17/01/2023 (Claude col metodo, da validare): la bestia che la linea CONTROLLA
      // (酉 Metallo sopra 卯 Legno) e' battuta dalla linea e non le presta il suo elemento; nelle
      // carte di Edu la bestia utile e' sempre in GENERAZIONE con la linea (in un verso o
      // nell'altro). MLBESTIAGEN=off torna a usare anche la bestia controllata.
      var inGen1 = off('MLBESTIAGEN') || GEN[L.el] === e1 || GEN[e1] === L.el;
      var larga1 = ENV.MLBESTIAVANTAGGIO !== 'ponte' && KE[e1] === lAltra1.el && inGen1;
      if (lAltra1 && e1 !== L.el && (ponte1 || larga1)) { lista[0].vantaggio = true; lista[0].ponte = ponte1; return e1; }
    }
    if (lista.length === 1) return lista[0].possiede ? WX[lista[0].ramo] : L.el;
    // Edu, 11/09/2026 (USDJPY 05/12/2022): "Se due bestie arrivano su una linea e non si
    // combattono collaborano per farla vincere. 辛丑 aiuta Y P 酉, ma 辛亥 invece la farebbe
    // perdere quindi non agisce." Con piu' bestie che non si combattono, quelle che
    // indebolirebbero la linea (la drenano o la controllano) NON agiscono: restano solo
    // quelle che la aiutano. MLBESTIEAIUTO=off torna alla catena su tutte.
    var listaU = lista;
    if (!off('MLBESTIEAIUTO')) {
      // Edu, 15/09/2026 (USDJPY 05/12/2022, rilettura): "YING: Beasts help. Xin Chou and Xin Hai
      // arrives here. Metal generates water. Ying with water beats Shi with fire." E il 14/09:
      // "Le bestie le usiamo se portano un vantaggio." Su una SEDE, una bestia che la linea
      // GENERA (Metallo -> Acqua) si usa lo stesso se l'elemento che porta CONTROLLA l'elemento
      // dell'altra sede: e' un vantaggio nel confronto. L'elemento dell'altra sede e' quello
      // della sua linea (qui lo Shi resta 午 Fuoco perche' il suo passo e' penalizzato).
      // MLBESTIAVANTAGGIO=off torna al solo aiuto alla linea.
      var altraEl = null;
      if (!off('MLBESTIAVANTAGGIO') && C.R && (L.pos === C.R.shi || L.pos === C.R.ying)) {
        var lAltraB = C.R.linee[(L.pos === C.R.shi ? C.R.ying : C.R.shi) - 1];
        altraEl = lAltraB ? lAltraB.el : null;
      }
      var aiuta = lista.filter(function (Q) {
        var e = WX[Q.ramo];
        if (e === L.el || GEN[e] === L.el) return true;
        if (altraEl && GEN[L.el] === e && KE[e] === altraEl) { Q.vantaggio = true; return true; }
        return false;
      });
      if (aiuta.length) listaU = aiuta;
    }
    var tutte = listaU.map(function (Q) { return WX[Q.ramo]; });
    var cur = L.el, usati = {}, mosso = true;
    while (mosso) {
      mosso = false;
      for (var i = 0; i < tutte.length; i++) {
        if (usati[i]) continue;
        if (GEN[cur] === tutte[i]) { cur = tutte[i]; usati[i] = true; mosso = true; break; }
      }
    }
    return cur;
  }

  // Edu, 11/09/2026 (EURJPY 15/08/2024): "Il clash del giorno su L1 non danneggia L1 perche'
  // la combinazione con il mese la protegge. Si spezza solo la combo, a niente altro."
  // Una ferma combinata (六合) col ramo del mese e clashata dal giorno NON e' rotta.
  // MLMESEPROT=off torna allo stato della catena.
  function protettaDalMese(L, R, C) {
    return !off('MLMESEPROT') && !!C.D && CLASH[C.D] === L.ramo &&
           !!R.monthBranch && COMBINA[R.monthBranch] === L.ramo;
  }
  // Edu, 11/09/2026 (EURJPY 10/08/2023): "Quando arriva una bestia su una linea non ci sono
  // piu' vuoti!" Una linea su cui cade un pilastro con la sua bestia non e' vuota.
  // MLBESTIAPIENA=off torna al vuoto del giorno e basta.
  function vuotaL(L, C, R) {
    if (!C.vuoto(L.ramo)) return false;
    // Edu, 11/09/2026 (USDJPY 05/12/2022): "Shi vuota si muove perche' incompatibile quindi non
    // e' vuota (cio' che si muove non e' vuoto)." MLMOSSANONVUOTA=off.
    if (!off('MLMOSSANONVUOTA') && (L.isMobile || (R && C.incompDi && C.incompDi(L)))) return false;
    // EURGBP 17/01/2023 (Claude col metodo, da validare): la bestia toglie il vuoto solo se si
    // rende utile alla linea (stesso elemento o la genera) — "le bestie le usiamo se portano un
    // vantaggio" (Edu, 14/09). Una bestia che la linea controlla (酉 sopra 卯) non riempie la
    // linea vuota. MLVUOTOAIUTO=off torna a: qualunque bestia che agisce toglie il vuoto.
    return off('MLBESTIAPIENA') ||
           !((C.suLinea[L.pos] || []).some(function (Q) {
             if (Q.inutile || Q.agisce === false) return false;
             if (off('MLVUOTOAIUTO')) return true;
             var e = WX[Q.ramo];
             return e === L.el || GEN[e] === L.el || Q.vantaggio || Q.qiNascosto;
           }));
  }
  function rottaL(L, R, C) { return L.stato === 'rotta' && !protettaDalMese(L, R, C); }

  // Edu, 11/09/2026 (EURJPY 29/09/2022): "con la Shi occupata dalla bestia Ji You, l'intero
  // trigramma superiore diventa un trigono direzionale di metallo (Shen, You, Xu) estremamente
  // timely ... Shi e' molto piu' forte perche' ha un trigono dal suo lato."
  // Raduno direzionale (三會) chiuso nel trigramma della linea, coi rami delle sue linee e
  // delle bestie che ci cadono, dello stesso elemento della sede e di stagione -> +2 di forza.
  function radunoDalSuoLato(el, L, R, C) {
    if (!L || off('MLRADLATO')) return false;
    var tri = L.pos <= 3 ? [1, 2, 3] : [4, 5, 6], rami = [];
    tri.forEach(function (p) {
      rami.push(R.linee[p - 1].ramo);
      (C.suLinea[p] || []).forEach(function (Q) { rami.push(Q.ramo); });
    });
    return RADUNI.some(function (g) {
      return WX[g[1]] === el && C.timely(el) && g.every(function (r) { return rami.indexOf(r) >= 0; });
    });
  }

  // La linea piu' forte dell'esagramma (principio 4): stagione, ramo del mese +2, del giorno +1,
  // dell'anno +1, +1 per ogni clash della data che la cita. Ritorna la linea se il massimo e'
  // netto, altrimenti null.
  function piuForte(R, C, annullate, escludi) {
    var cand = R.linee.filter(function (L) { return !(annullate && annullate[L.pos]) && !vuotaL(L, C, R) && !(escludi && escludi[L.pos]); });
    var punt = function (L) {
      var f = PESO_STAGIONE[C.stagione(L.el)] || 0;
      if (L.ramo === R.monthBranch) f += 2;
      if (C.D && L.ramo === C.D) f += 1;
      if (R.yearBranch && L.ramo === R.yearBranch) f += 1;
      C.ramiData.forEach(function (r) { if (CLASH[r] === L.ramo) f += 1; });
      return f;
    };
    cand.sort(function (a, b) { return punt(b) - punt(a); });
    if (cand.length && (cand.length === 1 || punt(cand[0]) > punt(cand[1]))) return { L: cand[0], p: punt(cand[0]) };
    return null;
  }

  function forza(el, L, R, C) {
    var f = PESO_STAGIONE[C.stagione(el)] || 0;
    if (L && vuotaL(L, C, R) && !L.isMobile) f -= 2;
    if (L && (L.stato === 'legata' || rottaL(L, R, C) ||
              L.stato === 'eliminata' || (L.stato === 'dormiente' && (off('MLDORMBESTIA') || vuotaL(L, C, R))))) f -= 1;
    if (radunoDalSuoLato(el, L, R, C)) f += 2;
    if (C.D && GEN[WX[C.D]] === el) f += 1;
    if (C.D && KE[WX[C.D]] === el) f -= 1;
    // Edu, 15/09/2026 (USDJPY 05/11/2020): contano solo le bestie che aiutano la linea
    // (MLBESTIEUTILI=off conta tutte).
    if (L && C.suLinea[L.pos] && !C._senzaBestie) f += C.suLinea[L.pos].length;
    if (L && C.ramiData.some(function (r) { return GEN[WX[r]] === el; })) f += 1;
    return f;
  }

  function guerre(R, C, racconto) {
    var annullate = {};
    if (off('MLGUERRA')) return annullate;
    for (var pos in C.suLinea) {
      var lista = C.suLinea[pos];
      if (!lista || lista.length < 2) continue;
      for (var a = 0; a < lista.length; a++)
        for (var b = a + 1; b < lista.length; b++) {
          var ra = lista[a].ramo, rb = lista[b].ramo;
          if (ra === rb) continue;
          var pen = lista.length === 2 && ((XING[ra] === rb) || (XING[rb] === ra));
          // Edu, 11/09/2026 (EURJPY 15/08/2024): "La penalita' e' quando 寅 penalizza 巳, ma
          // 巳 penalizza 申 solo se c'e' anche 寅, altrimenti i due fanno una combinazione."
          // 寅 presente = fra i quattro rami della data o i rami delle sei linee. MLPEN3=off.
          if (pen && !off('MLPEN3') && ((ra === '巳' && rb === '申') || (ra === '申' && rb === '巳'))) {
            var c寅 = C.ramiData.indexOf('寅') >= 0 || R.linee.some(function (L) { return L.ramo === '寅'; });
            if (!c寅) pen = false;
          }
          var cla = CLASH[ra] === rb;
          // Edu, 14/09/2026 (GBPUSD 09/03/2026): "Due bestie si accordano se possibile per far
          // vincere la propria linea protetta." Se una delle due CLASHA la linea (la sveglia),
          // le bestie non si fanno la guerra: si accordano. MLGUERRASVEGLIA=off.
          var LG = R.linee[pos - 1];
          if ((pen || cla) && !off('MLGUERRASVEGLIA') && LG && (CLASH[ra] === LG.ramo || CLASH[rb] === LG.ramo)) {
            racconto.push('su L' + pos + ' cadono due bestie (' + ra + ' e ' + rb + ') che si penalizzerebbero, ma una clasha la linea e la sveglia: si accordano per farla vincere, nessuna guerra');
            pen = false; cla = false;
          }
          if (pen || cla) {
            annullate[pos] = true;
            racconto.push('su L' + pos + ' cadono due bestie, ' + lista[a].nome + ' ' +
              lista[a].stelo + ra + ' e ' + lista[b].nome + ' ' + lista[b].stelo + rb +
              ', coi rami ' + (pen ? 'in penalità' : 'in clash') +
              ': è uno scontro fra titani, la linea è annullata e non agisce più');
          }
        }
    }
    return annullate;
  }

  // Un carattere presente su tutte e due le parti della carta non fa pendere niente:
  // se lo stesso elemento della mobile siede anche sullo Shi o sulla Ying dall'altra
  // parte, quella linea non puo' far vincere la propria sede (EURJPY 10/02/2026).
  function gemellaDiSede(mob, pos, R, C, annullate) {
    // Se la mobile e' lei stessa lo Shi o la Ying parla per la propria sede e basta:
    // il soggetto non viene messo in pareggio da nessuno (USDJPY 30/09/2025).
    if (mob.isShi || mob.isYing) return null;
    return R.linee.filter(function (L) {
      return L.pos !== pos && !annullate[L.pos] && L.el === mob.el &&
             (L.isShi || L.isYing) && sede(L.pos) !== sede(pos) && faQualcosa(L, R, C);
    })[0] || null;
  }

  // Un raduno o trigono completo nella carta (con gli stessi criteri di membro del T3:
  // la data non vuota, la partenza della mobile, o una linea che fa qualcosa).
  function qualcheRaduno(R, C, annullate, pos, dep) {
    var gruppi = RADUNI.concat(TRIGONI);
    for (var g = 0; g < gruppi.length; g++) {
      var ok = gruppi[g].every(function (ram) {
        if (ram === dep) return true;
        if (C.ramiData.indexOf(ram) >= 0 && !C.vuoto(ram)) return true;
        return R.linee.some(function (L) {
          return L.pos !== pos && L.ramo === ram && !annullate[L.pos] && faQualcosa(L, R, C);
        });
      });
      if (ok) return true;
    }
    return false;
  }

  function faQualcosa(L, R, C) {
    // Una linea incompatibile ferma non puo' stare dove sta: diventa mobile, quindi
    // agisce sempre — nemmeno il giorno che la combina la tiene ferma.
    if (!off('MLINCFERMA') && !L.isMobile && C.incompDi && C.incompDi(L)) return true;
    // Il giorno che COMBINA una linea la impiglia: quella linea non fa niente, e non
    // puo' nemmeno essere membro di un raduno. Prima la contavo fra quelle che fanno
    // qualcosa, che e' l'opposto (USDCHF 15/07/2026: il trigono 亥卯未 prendeva il suo
    // 亥 da L4, che il giorno 寅 teneva legata).
    if (C.D && COMBINA[C.D] === L.ramo) return false;
    if (L.stato === 'legata' || L._legata2) return false;
    if (L._sveglia2) return true;
    if (L.isMobile || L.isShi || L.isYing) return true;
    if (C.D && CLASH[C.D] === L.ramo) return true;
    if (C.suLinea[L.pos] && C.suLinea[L.pos].length) return true;
    return false;
  }

  // Edu, 09/09/2026: "S e Y sono uguali ma chi ha le bestie dal suo lato vince sempre".
  // Quando il confronto non si decide — stesso elemento, o nessuno dei due comanda e
  // le forze pareggiano — vince la sede su cui sono cadute piu' bestie.
  function chiHaLeBestie(R, C, racconto, soloUtili) {
    // Edu, 15/09/2026 (USDJPY 05/11/2020): "S e Y sono lo stesso quindi anche qui non c'e'
    // vittoria" — con il giorno e l'anno 子 sulla Ying 未 (Acqua sotto Terra: non la aiutano).
    // Contano solo le bestie che AIUTANO la sede (stesso elemento o che la generano), come
    // per "le bestie le usiamo se portano un vantaggio". MLBESTIEUTILI=off conta tutte.
    var conta = function (sp) {
      var L = R.linee[sp - 1], lst = C.suLinea[sp] || [];
      if (off('MLBESTIEUTILI') || !soloUtili) return lst.length;
      // Claude col metodo, 15/09/2026 (USDJPY 31/07/2024, da validare): il "vantaggio" di una
      // bestia si pesa col CARATTERE della sede. Nutrire un G/W e' un vantaggio per la sua
      // squadra (+1); nutrire un P/B ne ingrossa il danno (-1); drenare o controllare un P/B lo
      // indebolisce (+1); drenare o controllare un G/W e' un danno (-1). MLBESTIECAR=off torna
      // al solo "aiuta la linea".
      var malus = (L.par === 'P' || L.par === 'B');
      return lst.reduce(function (acc, Q) {
        var e = WX[Q.ramo], aiuta = (e === L.el || GEN[e] === L.el), pesa = (GEN[L.el] === e || KE[e] === L.el);
        if (off('MLBESTIECAR')) return acc + (aiuta ? 1 : 0);
        if (aiuta) return acc + (malus ? -1 : 1);
        if (pesa) return acc + (malus ? 1 : -1);
        return acc;
      }, 0);
    };
    var nS = conta(R.shi), nY = conta(R.ying);
    if (nS === nY) return null;
    racconto.push('le due sedi si equivalgono, ma le bestie stanno dalla parte ' +
      (nS > nY ? 'dello Shi (' + nS + ' contro ' + nY + ')' : 'della Ying (' + nY + ' contro ' + nS + ')') +
      ': chi ha le bestie dal suo lato vince sempre');
    return sede(nS > nY ? R.shi : R.ying);
  }

  function confrontoDiretto(R, C, elShi, elYing, racconto, perForza) {
    var lShi = R.linee[R.shi - 1], lYing = R.linee[R.ying - 1];
    if (perForza) {
      var fA = forza(elShi, lShi, R, C), fB = forza(elYing, lYing, R, C);
      if (fA === fB) return chiHaLeBestie(R, C, racconto);
      racconto.push('confronto fra le due sedi: vince la più forte, ' +
        (fA > fB ? 'la Shi' : 'la Ying') + ' (' + Math.max(fA, fB) + ' contro ' + Math.min(fA, fB) + ')');
      return sede(fA > fB ? R.shi : R.ying);
    }
    var vince = null, perche = '';
    if (elShi === elYing) {
      // In T8 (principio 3) contano solo le bestie che aiutano la sede (Edu, 15/09/2026).
      var pari = chiHaLeBestie(R, C, racconto, !!C._t8);
      if (pari) return pari;
    }
    // Edu, 11/09/2026 (EURJPY 29/09/2022 seme 140): "i due You sono diversi. Ji You e' terra
    // dello stelo che genera il metallo; Yi You e' stelo di legno che, con Zi acqua su Ying,
    // viene generato. Quindi su Y l'acqua di Zi perde energia generando il Legno dello stelo
    // mentre su S la terra genera il metallo." Nella generazione fra le sedi contano gli
    // STELI delle bestie: se chi dovrebbe ricevere e' drenato dallo stelo della bestia che ha
    // sopra (il suo elemento genera lo stelo) e chi dona e' nutrito dallo stelo della sua
    // (lo stelo genera il suo elemento), vince chi dona. MLSTELI=off; MLSTELI=drena basta il
    // drenaggio di chi riceve (estensione di Claude).
    var stDrena = function (sp, el) { return (C.suLinea[sp] || []).some(function (Q) { return GEN[el] === STEM_EL[Q.stelo]; }); };
    var stNutre = function (sp, el) { return (C.suLinea[sp] || []).some(function (Q) { return GEN[STEM_EL[Q.stelo]] === el; }); };
    var girata = function (ricSp, elRic, donSp, elDon) {
      if (off('MLSTELI')) return false;
      return stDrena(ricSp, elRic) && (ENV.MLSTELI === 'drena' || stNutre(donSp, elDon));
    };
    // Edu, 11/09/2026 (EURJPY 29/09/2022): "quando l'altra bestia Yi You del giorno arriva su
    // Ying, Shi penalizza Ying". La penalita' fra le sedi: i rami della sede (quello della
    // bestia che l'ha presa, altrimenti il suo) contro i rami dell'altra (il suo e quelli delle
    // bestie che ci arrivano). Tavola di Edu (寅巳申 con la regola del 寅, 丑戌未, 子卯,
    // autopenalita' 辰午酉亥). Se va nei due sensi penalizza la piu' forte; chi penalizza deve
    // pesare almeno quanto chi riceve. Chi riceve la penalita' non fa vincere la propria
    // squadra: vince l'altra. Viene DOPO generazione e controllo: nella lettura di Edu la
    // generazione ("Ying potrebbe farsi generare e vincere") puo' ribaltare la penalita', e a
    // decidere sono gli steli. MLPENSEDI=off; MLPENSEDI=prima la mette prima della generazione.
    var AUTO = { '辰': 1, '午': 1, '酉': 1, '亥': 1 };
    var ramiSede = function (sp, conBestie) {
      var lst = C.suLinea[sp] || [], pres = lst.filter(function (Q) { return Q.possiede; });
      var r = pres.length ? pres.map(function (Q) { return Q.ramo; }) : [R.linee[sp - 1].ramo];
      if (conBestie) lst.forEach(function (Q) { if (r.indexOf(Q.ramo) < 0) r.push(Q.ramo); });
      return r;
    };
    var tuttiR = [R.linee[R.shi - 1].ramo, R.linee[R.ying - 1].ramo].concat(C.ramiData);
    var pena = function (a, b) {
      if (a === b) return !!AUTO[a];
      if (XING[a] !== b) return false;
      if (!off('MLPEN3') && ((a === '巳' && b === '申'))) return tuttiR.indexOf('寅') >= 0;
      return true;
    };
    var penSedi = function () {
      if (off('MLPENSEDI')) return null;
      var rS = ramiSede(R.shi, false), rY = ramiSede(R.ying, true);
      var rS2 = ramiSede(R.shi, true), rY2 = ramiSede(R.ying, false);
      var sPenY = rS.some(function (a) { return rY.some(function (b) { return pena(a, b); }); });
      var yPenS = rY2.some(function (a) { return rS2.some(function (b) { return pena(a, b); }); });
      if (!sPenY && !yPenS) return null;
      var fS = forza(elShi, lShi, R, C), fY = forza(elYing, lYing, R, C);
      if (sPenY && (!yPenS || fS > fY) && fS >= fY) return { vince: R.shi, perche: 'la Shi penalizza la Ying (' + rS.join('') + ' su ' + rY.join('') + ') e pesa di più: la Ying penalizzata non fa vincere la sua squadra, vince la Shi' };
      if (yPenS && (!sPenY || fY > fS) && fY >= fS) return { vince: R.ying, perche: 'la Ying penalizza la Shi (' + rY2.join('') + ' su ' + rS2.join('') + ') e pesa di più: la Shi penalizzata non fa vincere la sua squadra, vince la Ying' };
      return null;
    };
    var pS = ENV.MLPENSEDI === 'prima' ? penSedi() : null;
    if (pS) { vince = pS.vince; perche = pS.perche; }
    else if (GEN[elYing] === elShi && girata(R.shi, elShi, R.ying, elYing)) {
      vince = R.ying; perche = 'il ' + EL_IT[elYing] + ' della Ying genererebbe il ' + EL_IT[elShi] + ' della Shi, ma sulla Shi lo stelo della bestia la drena e sulla Ying lo stelo la nutre: vince la Ying'; }
    else if (GEN[elShi] === elYing && girata(R.ying, elYing, R.shi, elShi)) {
      vince = R.shi; perche = 'il ' + EL_IT[elShi] + ' della Shi genererebbe il ' + EL_IT[elYing] + ' della Ying, ma sulla Ying lo stelo della bestia la drena e sulla Shi lo stelo la nutre: vince la Shi'; }
    else if (GEN[elYing] === elShi) { vince = R.shi; perche = 'il ' + EL_IT[elYing] + ' della Ying genera il ' + EL_IT[elShi] + ' della Shi: la Shi è nutrita e vince'; }
    else if (GEN[elShi] === elYing) { vince = R.ying; perche = 'il ' + EL_IT[elShi] + ' della Shi genera il ' + EL_IT[elYing] + ' della Ying: la Ying è nutrita e vince'; }
    else if (KE[elShi] === elYing) { vince = R.shi; perche = 'il ' + EL_IT[elShi] + ' della Shi controlla il ' + EL_IT[elYing] + ' della Ying: vince la Shi'; }
    else if (KE[elYing] === elShi) { vince = R.ying; perche = 'il ' + EL_IT[elYing] + ' della Ying controlla il ' + EL_IT[elShi] + ' della Shi: vince la Ying'; }
    else if (ENV.MLPENSEDI !== 'prima' && penSedi()) { var pD = penSedi(); vince = pD.vince; perche = pD.perche; }
    else {
      // Edu, 15/09/2026 (USDJPY 05/11/2020): sedi uguali -> la forza si pesa SENZA le bestie,
      // e a parita' decidono solo le bestie che aiutano (chiHaLeBestie). Provato a contare solo
      // le bestie utili nella forza di tutto il motore: costa 1.600 pip, quindi solo qui.
      // Vale solo nel confronto finale del principio 3 (T8): applicata a tutti i confronti
      // rompeva USDJPY 12/01/2023 (carta di riferimento).
      C._senzaBestie = !off('MLBESTIEUTILI') && !!C._t8;
      var f1 = forza(elShi, lShi, R, C), f2 = forza(elYing, lYing, R, C);
      C._senzaBestie = false;
      if (f1 === f2) return chiHaLeBestie(R, C, racconto, !!C._t8);
      vince = f1 > f2 ? R.shi : R.ying;
      perche = 'nessuno dei due elementi comanda sull\'altro: vince la più forte, ' + (f1 > f2 ? 'la Shi' : 'la Ying');
    }
    racconto.push('confronto diretto fra le due sedi — ' + perche);
    return sede(vince);
  }

  function energia(R, C) {
    var e = 0, mob = R.linee[R.mutante.pos - 1];
    if (C.timely(R.mutante.arrEl)) e += 2;
    if (C.timely(mob.el)) e += 1;
    if (C.vuoto(R.monthBranch)) e -= 2;
    if (C.suLinea[R.mutante.pos] && C.suLinea[R.mutante.pos].length) e += 1;
    return e >= 3 ? 'molta' : e >= 1 ? 'normale' : 'poca';
  }

  function leggi(R, ctx) {
    if (!R || R.error || !R.mutante) return { dir: null, perche: 'carta non leggibile', gradino: 'tace', racconto: '' };
    // 21/09/2026: le incompatibili sono ACCESE anche in liuyao.js (la catena). Il motore applica da
    // se' la dottrina intera (ferma incompatibile che gira, futuro comune, seconde, controllo indietro,
    // portate): se la carta arriva gia' girata dalla catena, la rilegge "da sola" per non applicare
    // il futuro comune due volte (USDJPY 06/11/2024, confermata da Edu, tornava storta).
    if (R.incompatibili && R.incompatibili.length && LYM && LYM.readManual && R.sup && R.inf) {
      var R0 = LYM.readManual(R.sup, R.inf, R.mutante.pos, R.dayBranch, R.monthBranch, R.yearBranch, R.dayStem, R.oraBranch, { incFuturo: false });
      if (R0 && !R0.error && R0.mutante) R = R0;
    }
    var C = contesto(R, ctx);
    var racconto = [];
    var mob = R.linee[R.mutante.pos - 1];
    var pos = R.mutante.pos;
    var dep = R.mutante.ramoDep, arr = R.mutante.ramoArr;
    var depEl = R.mutante.depEl, arrEl = R.mutante.arrEl;
    if (C.mobileArrComune && C.mobileArrComune !== arr) {
      racconto.push('con più linee che girano insieme l\'esagramma futuro cambia: la mobile non va più in ' +
        arr + ' ma in ' + C.mobileArrComune);
      arr = C.mobileArrComune; arrEl = WX[arr];
    }
    var palEl = R.palEl;
    // L'autocombinazione non e' un passo nullo (Edu, 09/09/2026): liuyao la segna come
    // movimento nullo, ma per Edu la linea si muove eccome. Da qui in giu' si usa questo.
    var passoNullo = R.mutante.movimentoNullo &&
        String(R.mutante.motivoNullo || '').indexOf('self-combination') < 0;
    var mobileNutrita = false;   // S48: la mobile nutrita dal proprio arrivo non fa altro
    var arrMorto = false;   // S47: l'arrivo della mobile ucciso dalla penalita' della data

    // DUE LINEE IN MOVIMENTO: la ferma incompatibile "diventa mobile", quindi in quelle
    // carte ci sono due linee che si muovono, non una. Tre modi di leggerla, tutti
    // dietro DUEMOB per poterli misurare separati:
    //   prima    = decide la incompatibile, prima di tutto il resto
    //   concordi = si conclude solo se le due dicono la stessa cosa, altrimenti tace
    //   conferma = decide la mobile; la incompatibile parla solo se la mobile non conclude
    var incFerma = (R.linee.filter(function (L) {
      return L.pos !== pos && !L.isMobile && C.incompDi(L) && dirDelCarattere(L.par, L.pos);
    }))[0] || null;
    var dirIncFerma = incFerma ? dirDelCarattere(incFerma.par, incFerma.pos) : null;
    var MODO = ENV.DUEMOB || 'conferma';

    // Test di Edu (11/09/2026): la seconda mobile, compiuto il passo, resta con il
    // carattere dell'ARRIVO e fa vincere o perdere la propria sede (L3 申 -> 卯: da B a W,
    // e la W fa vincere il basso). SECONDACAR=prima -> decide prima della prima mobile;
    // SECONDACAR=dopo -> solo se la prima non conclude.
    var S2c = (!off('DUEMUT') && C.seconde.length === 1) ? C.seconde[0] : null;
    var parArr2 = S2c ? parDi(S2c.arrEl, palEl) : null;
    var dirSeconda = S2c && parArr2 ? dirDelCarattere(parArr2, S2c.L.pos) : null;
    if (dirSeconda && ENV.SECONDACAR === 'prima') {
      racconto.push('L' + S2c.L.pos + ' è incompatibile e muta: ' + S2c.dep + ' → ' + S2c.arr +
        ', che nel palazzo è ' + PAR_IT[parArr2] + '. Resta così e decide la propria sede');
      return { dir: dirSeconda, perche: 'la seconda mobile diventa ' + PAR_IT[parArr2] + ' e decide la sua sede',
               gradino: 'T0f la seconda diventa ' + PAR_IT[parArr2], inccard: inccard,
               racconto: racconto.join('\n'), passi: racconto, energia: 0 };
    }

    var fine = function (dir, perche, gradino) {
      if (dirIncFerma && MODO === 'concordi' && dir && dir !== dirIncFerma) {
        racconto.push('ma L' + incFerma.pos + ', incompatibile e quindi anch\'essa in movimento, ' +
          'dice il contrario: le due linee mobili non concordano');
        dir = null; gradino = 'tace (due mobili discordi)';
      }
      return { dir: dir, perche: perche, inccard: inccard, gradino: gradino || 'lettura',
               dettaglio: dep + '→' + arr + ' ' + mob.par + ' L' + pos +
                          (mob.isShi ? ' Shi' : mob.isYing ? ' Ying' : '') +
                          (C.timely(depEl) ? ' timely' : ' untimely'),
               racconto: racconto.map(function (x, i) { return (i + 1) + '. ' + x; }).join('\n'),
               passi: racconto, energia: energia(R, C) };
    };

    racconto.push('il protagonista è la linea mobile L' + pos + ', ' + PAR_IT[mob.par] + ' ' +
      dep + ' ' + EL_IT[depEl] + (mob.isShi ? ' (è lo Shi)' : mob.isYing ? ' (è la Ying)' : '') +
      (arr ? ', che va in ' + arr + ' ' + EL_IT[arrEl] : ''));

    if (dirIncFerma && MODO === 'prima') {
      racconto.push('L' + incFerma.pos + ' è incompatibile: non può stare dove sta, quindi si ' +
        'muove anche lei. È un ' + PAR_IT[incFerma.par] + ' e decide prima della mobile');
      return { dir: dirIncFerma, perche: 'decide la ferma incompatibile di L' + incFerma.pos,
               gradino: 'T0d la seconda mobile', inccard: inccard,
               racconto: racconto.join('\n'), passi: racconto, energia: 0 };
    }
    var incomp = off('MLINCOMP') ? null : C.incompDi(mob);
    // Le seconde mobili possono essere piu' d'una (AUDUSD 22/12/2025 ne ha due): ognuna
    // puo' tenere o distruggere l'arrivo della prima; si prende quella che lo fa.
    // ANDONG=si: la seconda si muove come una ferma clashata (暗動), agisce col PROPRIO
    // ramo e non cambia yin/yang. Altrimenti muta davvero e agisce con l'arrivo.
    var tutteSeconde = off('DUEMUT') ? [] : C.seconde;
    var secondeVive = tutteSeconde.filter(function (X) { return !X.vuota; });
    // Edu, 15/09/2026 (USDJPY 05/12/2022): "L4 goes into void." La seconda mobile il cui
    // arrivo cade nel vuoto del giorno va nel vuoto: non combina e non clasha niente, e non
    // ferma la mobile. MLSECVUOTA=off torna a contarla.
    var ramoDi = function (X) { return (ENV.ANDONG === 'si') ? X.dep : X.arr; };
    var S2 = secondeVive.filter(function (X) {
      var r2 = ramoDi(X);
      return COMBINA[r2] === dep || CLASH[r2] === dep || (arr && (COMBINA[r2] === arr || CLASH[r2] === arr));
    })[0] || secondeVive[0] || null;
    var ramo2 = S2 ? ramoDi(S2) : null;
    if (tutteSeconde.length) racconto.push('linee incompatibili che si muovono anche loro: ' +
      tutteSeconde.map(function (X) { return 'L' + X.L.pos + ' ' + X.dep + '→' + X.arr + (X.vuota ? ' (vuoto: va nel vuoto)' : ''); }).join(', '));
    var secCombDep = !!(ramo2 && COMBINA[ramo2] === dep);
    var secClashDep = !!(ramo2 && CLASH[ramo2] === dep);
    var secCombArr = !!(ramo2 && arr && COMBINA[ramo2] === arr);
    var secClashArr = !!(ramo2 && arr && CLASH[ramo2] === arr);
    if (S2 && (secCombDep || secClashDep || secCombArr || secClashArr)) {
      racconto.push('L' + S2.L.pos + ' è incompatibile e si muove anche lei, ' + S2.dep + ' → ' + S2.arr +
        ': il suo arrivo ' + (secCombDep ? 'combina la partenza della mobile' : secClashDep ? 'clasha la partenza della mobile' :
        secCombArr ? 'combina l\'arrivo della mobile' : 'clasha l\'arrivo della mobile'));
      if (!incomp && (secCombArr || secClashArr)) passoNullo = true;
    }
    var annullate = guerre(R, C, racconto);
    // --- T0z: LA CONFUSIONE TOTALE DI UN TRIGRAMMA ---------------------------------
    // Edu, 11/09/2026 (USDJPY 13/02/2024 seme 149): "Ying clashato dal giorno diventa mobile
    // e questo trasforma l'intero trigramma inferiore in un total clash. Poiche' sotto e' in
    // uno stato di confusione totale, vince il sopra."
    // Si muovono: la mobile; le ferme incompatibili (diventano mobili); le ferme clashate dal
    // giorno — col pilastro del giorno e la sua bestia sopra (in ogni stagione), oppure di
    // stagione (暗動) — salvo se protette dalla combinazione col mese. Le linee annullate
    // dalla guerra non si muovono. Se tutte e tre le linee del trigramma BASSO si muovono,
    // il basso e' in confusione totale e vince l'alto. Il trigramma ALTO nella stessa
    // condizione e' un'estensione di Claude per simmetria: MLCONFUSIONE=due (spenta).
    if (!off('MLCONFUSIONE')) {
      // Precisazione di Edu: "qui il problema e' che le tre linee si muovono per clashare se
      // stesse, solo questo". Conta solo il movimento che clasha la propria partenza: la
      // mobile e la ferma incompatibile se il loro arrivo (futuro comune) clasha la partenza;
      // la ferma clashata dal giorno si muove per il clash stesso. MLCONFUSIONE=muovere per
      // la versione larga (basta che si muovano).
      var siMuove = function (L) {
        if (annullate[L.pos]) return false;
        var largo = ENV.MLCONFUSIONE === 'muovere';
        if (L.pos === pos) return largo || (!!arr && CLASH[dep] === arr);
        if (C.incompDi(L)) {
          if (largo) return true;
          var Xs = (C.seconde || []).filter(function (X) { return X.L.pos === L.pos; })[0];
          return !!Xs && CLASH[L.ramo] === Xs.arr;
        }
        if (C.D && CLASH[C.D] === L.ramo && !protettaDalMese(L, R, C)) {
          var gHaBestia = (C.suLinea[L.pos] || []).some(function (Q) { return Q.nome === 'giorno'; });
          if (gHaBestia || L.stato === 'mossa') return true;
        }
        return false;
      };
      var trigConf = [[1, 2, 3]];
      if (ENV.MLCONFUSIONE === 'due') trigConf.push([4, 5, 6]);   // simmetria di Claude, spenta
      for (var tc = 0; tc < trigConf.length; tc++) {
        var tutte3 = trigConf[tc].every(function (p) { return siMuove(R.linee[p - 1]); });
        if (tutte3) {
          var basso = trigConf[tc][0] === 1;
          racconto.push('tutte e tre le linee del trigramma ' + (basso ? 'basso' : 'alto') +
            ' (L' + trigConf[tc].join(', L') + ') si muovono per clashare se stesse: è un clash totale, ' + (basso ? 'sotto' : 'sopra') +
            ' c\'è confusione totale e vince ' + (basso ? 'il sopra' : 'il sotto'));
          return fine(basso ? sede(4) : sede(1), 'confusione totale nel trigramma ' + (basso ? 'basso' : 'alto') +
            ': vince ' + (basso ? 'il sopra' : 'il sotto'), 'T0z confusione totale');
        }
      }
    }

    // TEST (S46): Edu, 11/09/2026 (EURJPY 10/08/2023): "Quando S o Y vengono presi dalle
    // bestie da quel momento in poi la partita diventa esclusivamente fra S vs Y."
    // MLSOLOSY=tutto: appena una sede (non annullata) e' presa da una bestia, confronto
    // diretto fra le due sedi e nient'altro. Spento finche' non e' misurato.
    if (ENV.MLSOLOSY === 'tutto') {
      var presaSY = [R.shi, R.ying].filter(function (sp) {
        return !annullate[sp] && (C.suLinea[sp] || []).some(function (Q) { return Q.possiede; });
      });
      if (presaSY.length) {
        var eS = elDopoLeBestie(R.linee[R.shi - 1], C), eY = elDopoLeBestie(R.linee[R.ying - 1], C);
        racconto.push('le bestie prendono ' + presaSY.map(function (sp) { return sp === R.shi ? 'lo Shi' : 'la Ying'; }).join(' e ') +
          ': da qui la partita è solo fra Shi (' + EL_IT[eS] + ') e Ying (' + EL_IT[eY] + ')');
        var dSY = confrontoDiretto(R, C, eS, eY, racconto);
        if (dSY) return fine(dSY, 'le bestie prendono una sede: solo Shi contro Ying', 'T0y solo Shi contro Ying');
      }
    }
    if (S2 && ENV.DUEMUTPART === 'on' && !incomp && (secCombDep || secClashDep) && !annullate[pos]) {
      racconto.push('la mobile resta ' + (secCombDep ? 'impigliata' : 'bloccata') + ' dov\'è e parla col proprio carattere, ' + PAR_IT[mob.par]);
      var dS2b = dirDelCarattere(mob.par, pos);
      if (dS2b) return fine(dS2b, 'la seconda mobile ' + (secCombDep ? 'impiglia' : 'blocca') + ' la prima, che resta ' + PAR_IT[mob.par],
                            'T0e la seconda ' + (secCombDep ? 'impiglia' : 'blocca'));
    }
    var mobileAnnullata = !!annullate[pos];

    // --- T0m: LO STATO DEL MOVIMENTO (dottrina dettata da Edu il 16/09/2026) --------------
    // "Se una linea si muove per andare nel vuoto si invalida l'intera linea, non solo l'arrivo
    // (un treno che parte e si ferma in mezzo alla campagna). Se una linea si muove ma il suo
    // arrivo e' clashato o combinato, solo l'arrivo e' annullato ma la partenza e' ancora
    // attiva (un treno con la tabella di marcia modificata). Se una linea mobile viene
    // clashata o combinata alla partenza non parte proprio e non si puo' usare. Se una linea
    // vuota e' mobile e viene clashata o combinata alla partenza non parte ma rimane attiva,
    // si puo' usare. Eccezioni: il Tai Sui e le incompatibili. Le incompatibili si muovono
    // comunque. Tai Sui: clashato alla partenza o all'arrivo puo' muoversi, se combinato no."
    // Le bestie che aiutano il movimento (compatibili: stesso elemento, drenano, generano) e
    // quelle che se ne impadroniscono (controllano, clashano) "solo se serve a trovare una
    // soluzione": NON cablate qui, restano ai gradini delle bestie.
    // Carta: NZDUSD 15/06/2022 seme 62 (LONG +60): L3 B 午 incompatibile va nel vuoto 辰 ->
    // invalidata; la Ying P 寅, piena e Tai Sui, combinata alla partenza dal giorno 亥 -> non
    // parte e non si usa; resta in piedi solo lo Shi -> LONG. Gemella 22/06/2023: la Ying era
    // VUOTA -> non parte ma si usa (T0a, la sede in ritardo) -> SHORT.
    // MISURA al cablaggio (16/09): mazzo da 53,45% a 53,31% (-3.463 pip), e otto carte di
    // riferimento lette da Edu cambiavano verdetto. VERIFICATO IL 17/09/2026: il gradino e'
    // ACCESO di default (off() scatta solo con MLSTATOMOV=off) e col motore di oggi le 66 carte
    // di riferimento restano tutte giuste; il commento "SPENTO in attesa di Edu" era rimasto
    // dietro a una condizione poi cambiata ed era falso. MLSTATOMOV=off per spegnerlo.
    var statoMob = 'muove';   // muove | invalidata | fermaAttiva | fermaInusabile | arrivoAnnullato
    var fermaPerPartenza = false;
    if (!off('MLSTATOMOV')) {
      // Edu, 16/09/2026 (USDCHF 28/02/2022 seme 92): "se la linea e' super-timely e avanza lo fa
      // lo stesso!" -> la linea in stagione, seduta sul ramo del mese o dell'anno, che AVANZA
      // (進神) verso un arrivo vuoto si muove comunque: non e' invalidata.
      var superTimely = function (Ldep) {
        return C.timely(WX[Ldep]) && (Ldep === R.monthBranch || Ldep === R.yearBranch);
      };
      // Le bestie che aiutano il movimento (Edu, 16/09/2026, "Tutte e tre giuste"):
      //  - nel vuoto: la linea parte e arriva se sopra siede una bestia COMPATIBILE (stesso
      //    elemento, la genera, o la linea la genera) oppure una bestia il cui ramo COMBINA
      //    l'arrivo vuoto ("se la bestia combina con una linea vuota e farla uscire dal vuoto
      //    aiuterebbe a trovare una soluzione, allora fa uscire dal vuoto" — USDCAD 16/03/2020, 庚子
      //    che combina 丑);
      //  - piena, clashata o combinata alla partenza: con una bestia compatibile si muove lo stesso.
      var bestiaAiuta = function (Lpos, Ldep, Larr, anche) {
        // Qui vale la definizione di Edu del 16/09 (stesso elemento, genera, o DRENA), piu' larga di
        // quella dell'11/09 usata per Q.agisce (solo stesso elemento o genera): non si filtra su agisce.
        return (C.suLinea[Lpos] || []).filter(function (Q) {
          var eb = WX[Q.ramo], el = WX[Ldep];
          if (eb === el || GEN[eb] === el || GEN[el] === eb) return true;
          return anche && COMBINA[Q.ramo] === Larr;
        })[0] || null;
      };
      var statoDi = function (Ldep, Larr, isInc, isMobVoid, Lpos) {
        if (!Larr) return 'muove';
        var D0 = C.D;
        var depTocc = D0 && (CLASH[D0] === Ldep || COMBINA[D0] === Ldep);
        var arrTocc = D0 && (CLASH[D0] === Larr || COMBINA[D0] === Larr);
        var taiSui = R.yearBranch && Ldep === R.yearBranch;
        // ORDINE (EURUSD 11/03/2022, Edu: "L5 cannot move because of the clash. Still survive as
        // the month generate it"): prima la partenza — se non parte, non va nemmeno nel vuoto.
        // E la linea piena ferma alla partenza che il mese genera (o del suo elemento) sopravvive:
        // resta usabile.
        if (depTocc && !isInc && !(taiSui && CLASH[D0] === Ldep) && !isMobVoid) {
          var mEl = WX[R.monthBranch];
          if (mEl && (mEl === WX[Ldep] || GEN[mEl] === WX[Ldep])) {
            racconto.push('L' + Lpos + ' (' + Ldep + ') è ' + (COMBINA[D0] === Ldep ? 'combinata' : 'clashata') + ' alla partenza dal giorno ' + D0 +
              ': non parte, ma sopravvive perché il mese ' + R.monthBranch + ' la ' + (mEl === WX[Ldep] ? 'sostiene' : 'genera'));
            return 'fermaAttiva';
          }
        }
        // NZDUSD 10/03/2020 (Edu: "L3 cannot move into a G because of the penalty from the day"):
        // l'arrivo penalizzato dalla data muore prima di arrivare, anche se e' vuoto: la linea non
        // parte e resta se' stessa, usabile (S47: la penalita' e' la morte del movimento).
        if (D0 && (XING[D0] === Larr || (D0 === Larr && AUTOPEN[Larr])) && !isInc) {
          racconto.push('L' + Lpos + ' vorrebbe andare in ' + Larr + ', ma il giorno ' + D0 + ' penalizza l\'arrivo: il movimento muore, la linea resta ' + Ldep);
          return 'fermaAttiva';
        }
        // USDJPY 02/10/2024 (Edu: "Effetto scala. L3 si muove in G 午, L2 continua il movimento e
        // arriva a P 辰" — 辰 vuoto, la lettura vale lo stesso): la linea SPINTA da una seconda che
        // arriva sulla sua partenza non si ferma nel vuoto, come il clash sul Tai Sui la spinge avanti.
        var spinta = (C.seconde || []).some(function (X) { return X.L.pos !== Lpos && X.arr === Ldep; });
        if (C.vuoto(Larr) && spinta) {
          racconto.push('L' + Lpos + ' è spinta dalla linea che arriva sulla sua partenza ' + Ldep + ': effetto scala, prosegue in ' + Larr + ' anche se vuoto');
          return 'muove';
        }
        if (C.vuoto(Larr) && !(depTocc && !isInc && !(taiSui && CLASH[D0] === Ldep))) {
          if (AVANZA[Ldep] === Larr && superTimely(Ldep)) return 'muove';
          var bv = bestiaAiuta(Lpos, Ldep, Larr, true);
          if (bv) { racconto.push('L' + Lpos + ' andrebbe nel vuoto ' + Larr + ', ma la bestia del ' + bv.nome + ' ' + bv.stelo + bv.ramo +
            (COMBINA[bv.ramo] === Larr ? ' combina ' + Larr + ' e lo fa uscire dal vuoto' : ' è compatibile con la linea e la aiuta') + ': la linea arriva');
            return 'muove'; }
          return 'invalidata';
        }
        if (depTocc) {
          if (isInc) return 'muove';
          if (taiSui) return COMBINA[D0] === Ldep ? 'fermaInusabile' : 'muove';
          if (isMobVoid) return 'fermaAttiva';
          var bp = bestiaAiuta(Lpos, Ldep, Larr, false);
          if (bp) { racconto.push('L' + Lpos + ' è ' + (COMBINA[D0] === Ldep ? 'combinata' : 'clashata') + ' alla partenza dal giorno ' + D0 +
            ', ma la bestia del ' + bp.nome + ' ' + bp.stelo + bp.ramo + ' le è compatibile: si muove lo stesso');
            return 'muove'; }
          // CORREZIONE DI EDU (18/09/2026, EURGBP 18/11/2021 seme 83): la vecchia forma del 16/09
          // ("non parte proprio e non si puo' usare") e' stata cambiata da lui in "la linea resta
          // dov'e' col proprio carattere": non si muove ma rimane ATTIVA. Il Tai Sui combinato esce
          // prima (sopra) e resta fuori uso, com'e' nella sua lettura di NZDUSD 15/06/2022.
          // MLFERMAATTIVA=off torna alla forma vecchia.
          if (off('MLFERMAATTIVA')) return 'fermaInusabile';
          if (Lpos === pos) fermaPerPartenza = true;
          return 'fermaAttiva';
        }
        if (arrTocc) return 'arrivoAnnullato';
        return 'muove';
      };
      (C.seconde || []).forEach(function (X) {
        X.stato = statoDi(X.dep, X.arr, true, C.vuoto(X.dep), X.L.pos);
        if (X.stato === 'invalidata') {
          racconto.push('L' + X.L.pos + ' (' + PAR_IT[X.L.par] + ' ' + X.dep + ') si muove per andare nel vuoto ' + X.arr +
            ': il treno si ferma in mezzo alla campagna, l\'intera linea è invalidata');
          annullate[X.L.pos] = true; X.arr = null; X.vuota = true;
        }
      });
      if (!mobileAnnullata) {
        statoMob = statoDi(dep, arr, !!C.incompDi(mob), C.vuoto(dep), pos);
        if (statoMob === 'invalidata') {
          racconto.push('la mobile L' + pos + ' (' + PAR_IT[mob.par] + ' ' + dep + ') si muove per andare nel vuoto ' + arr +
            ': il treno si ferma in mezzo alla campagna, l\'intera linea è invalidata');
          annullate[pos] = true; mobileAnnullata = true;
        } else if (statoMob === 'fermaInusabile') {
          // Le bestie (Edu, 16/09/2026): "possono intervenire ad aiutare il movimento anche quando
          // la linea non potrebbe muoversi, ma devono essere compatibili con la linea (stesso
          // elemento, o drenano o generano)". EURUSD 17/06/2026: il G 辰 clashato alla partenza
          // dal giorno 戌 ha sopra il mese 午, che lo genera: resta in gioco, sveglio, col proprio
          // carattere. Con una bestia compatibile la linea non parte ma si puo' usare.
          var aiuto = (C.suLinea[pos] || []).filter(function (Q) {
            var eb = WX[Q.ramo], el = WX[dep];
            return Q.agisce !== false && (eb === el || GEN[eb] === el || GEN[el] === eb);
          })[0];
          if (aiuto) {
            statoMob = 'fermaAttiva';
            racconto.push('la mobile L' + pos + ' (' + PAR_IT[mob.par] + ' ' + dep + ') è ' + (COMBINA[C.D] === dep ? 'combinata' : 'clashata') +
              ' alla partenza dal giorno ' + C.D + ', ma la bestia del ' + aiuto.nome + ' ' + aiuto.stelo + aiuto.ramo +
              ' le è compatibile e la aiuta: non parte ma resta in gioco col proprio carattere');
          }
        }
        if (statoMob === 'fermaInusabile') {
          racconto.push('la mobile L' + pos + ' (' + PAR_IT[mob.par] + ' ' + dep + ', piena' + (dep === R.yearBranch ? ', Tai Sui' : '') +
            ') è ' + (COMBINA[C.D] === dep ? 'combinata' : 'clashata') + ' alla partenza dal giorno ' + C.D + ': non parte proprio e non si può usare');
          annullate[pos] = true; mobileAnnullata = true;
        } else if (statoMob === 'arrivoAnnullato') {
          racconto.push('l\'arrivo ' + arr + ' della mobile è ' + (COMBINA[C.D] === arr ? 'combinato' : 'clashato') + ' dal giorno ' + C.D +
            ': solo l\'arrivo è annullato, la partenza ' + dep + ' resta attiva (tabella di marcia modificata)');
        }
      }
      // NESSUNA CONCLUSIONE QUI (16/09/2026): T0m fissa solo lo STATO delle linee che si muovono;
      // a concludere sono i gradini che seguono (il malus nel vuoto T0v, la piu' forte, le bestie,
      // Shi contro Ying). La prima versione concludeva "resta in piedi solo l'altra sede" e
      // rompeva sette letture di Edu (USDJPY 17/01/2024, USDCAD 16/03/2020, EURUSD 11/03/2022...):
      // ogni carta prosegue per la propria via. MLSTATOMOVFINE=on riaccende quella conclusione.
      // CORREZIONE DI EDU (18/09/2026, EURGBP 18/11/2021 seme 83): "la linea resta dov'e' col
      // proprio carattere". Applicata nel suo ordine ("prima le linee mobili, e se il risultato
      // non esce si passa alle bestie"): la mobile bloccata alla partenza non si muove, resta
      // dov'e' e PARLA COL PROPRIO CARATTERE — G/W fanno vincere la propria sede, B/P la fanno
      // perdere, C tace e si cerca un'altra traccia. Prima le bestie se ne impadronivano (T1
      // sostituzione) e su questa carta la facevano perdere. MLFERMAPARLA=off per spegnerlo.
      // PERIMETRO, dalla sua regola del 13/09 sulle linee tenute dalla data: combinata o clashata
      // alla partenza da UN solo ramo della data la linea resta viva e parla; presa da DUE rami
      // della data e' tenuta ferma davvero e tace (EURJPY 29/09/2022: il giorno 酉 e il mese 酉
      // combinano insieme la mobile 辰, e la lettura di Edu parte dalla Shi presa dal mese).
      // Edu, 18/09/2026: "se l'incompatibile e' combinata due volte, il legame e' troppo forte e
      // rimane ferma". Conta la COMBINAZIONE, non il clash: due rami della data che combinano la
      // partenza la tengono ferma davvero e il gradino tace.
      var prese = [C.D, R.monthBranch, R.yearBranch, R.oraBranch].filter(function (b) {
        return b && COMBINA[b] === dep;
      }).length;
      var presaInDue = prese > 1;
      if (fermaPerPartenza && !presaInDue && !off('MLFERMAPARLA') && !mobileAnnullata) {
        var dFP = dirDelCarattere(mob.par, pos);
        if (dFP) {
          racconto.push('la mobile L' + pos + ' (' + PAR_IT[mob.par] + ' ' + dep + ') non si muove ma resta dov\'è, attiva: parla col proprio carattere');
          return fine(dFP, 'la mobile bloccata alla partenza resta dov\'è e parla da ' + PAR_IT[mob.par],
                      'T0m la mobile bloccata parla col proprio carattere');
        }
      }
      if (ENV.MLSTATOMOVFINE === 'on' && mobileAnnullata && (pos === R.shi || pos === R.ying) &&
          !(C.seconde || []).some(function (X) { return X.arr && !X.vuota && !annullate[X.L.pos]; })) {
        var altraSt = pos === R.shi ? R.ying : R.shi;
        if (!annullate[altraSt]) {
          if (statoMob === 'invalidata' && (mob.par === 'P' || mob.par === 'B'))
            return fine(sede(pos), 'il malus della sede va nel vuoto: la sua squadra non può perdere', 'T0m il malus della sede se ne va');
          return fine(sede(altraSt), 'la sede mobile è fuori uso, resta in piedi solo l\'altra', 'T0m resta solo l\'altra sede');
        }
      }
    }

    // Edu, 09/09/2026: l'autocombinazione c'e' solo se l'arrivo torna indietro a
    // combinare. 午 che diventa 未 non e' questo: e' una trasformazione e basta, la
    // linea si muove (USDCAD 18/03/2020). Resta ferma solo l'altro caso -4, l'arrivo
    // in tomba nel mese e punito dal giorno (EURJPY 11/07/2024).
    var davveroFerma = R.mutante.casoMut === -4 &&
        String(R.mutante.motivoNullo || '').indexOf('self-combination') < 0;
    if (!off('MLFERMA') && davveroFerma && !mobileAnnullata) {
      racconto.push('l\'arrivo ' + arr + ' è nella tomba del mese ed è punito dal giorno: ' +
        'la linea non si muove affatto, resta ferma e non fa nulla');
      mobileAnnullata = true;
    }

    if (!mobileAnnullata && !off('MLTAISUI')) {
      var capo = (C.suLinea[pos] || [])[0];
      if (capo && CLASH[capo.ramo] === dep) {
        racconto.push('la bestia del ' + capo.nome + ' ' + capo.stelo + capo.ramo +
          ' arriva su L' + pos + ' e clasha il ramo ' + dep +
          ': una bestia che clasha una linea mobile la blocca, non può muoversi — resta ' +
          PAR_IT[mob.par] + ' dov\'era');
        var dT = dirDelCarattere(mob.par, pos);
        if (dT) return fine(dT, 'la bestia del ' + capo.nome + ' clasha la mobile e la blocca',
                            'T0b la bestia blocca la mobile');
        mobileAnnullata = true;
      }
    }

    if (!mobileAnnullata && !off('MLLADRO') && arrEl && !passoNullo &&
        R.mutante.progressione === 'avanzante' && parDi(arrEl, palEl) === 'B') {
      var preda = R.linee.filter(function (L) {
        if (L.pos === pos || annullate[L.pos] || L.par !== 'W') return false;
        if (!L.isMobile && vuotaL(L, C, R)) return false;
        return COMBINA[arr] === L.ramo || KE[arrEl] === L.el;
      })[0];
      if (preda) {
        racconto.push('l\'arrivo ' + arr + ' ' + EL_IT[arrEl] + ' è un B nel palazzo, e il B è il ' +
          'ladro della W: va a ' + (COMBINA[arr] === preda.ramo ? 'combinare' : 'controllare') +
          ' la W ' + preda.ramo + ' di L' + preda.pos +
          (preda.isShi ? ' (lo Shi)' : preda.isYing ? ' (la Ying)' : '') + ' e gliela porta via');
        var altraSede = preda.isShi ? R.ying : preda.isYing ? R.shi : null;
        var possiedeAltra = altraSede && (C.suLinea[altraSede] || []).some(function (Q) { return Q.possiede; });
        if (possiedeAltra) {
          racconto.push('ricevendo il B avanzante, L' + preda.pos + ' "diventa" ' + EL_IT[arrEl] +
            '; sull\'altra sede L' + altraSede + ' le bestie arrivano in ' +
            (C.suLinea[altraSede] || []).length + ' e se ne impadroniscono');
          var elAltra = elDopoLeBestie(R.linee[altraSede - 1], C);
          var dR = confrontoDiretto(R, C,
            preda.isShi ? arrEl : elAltra, preda.isYing ? arrEl : elAltra, racconto, true);
          if (dR) return fine(dR, 'la W derubata prende l\'elemento del B e si confronta con l\'altra sede',
                              'T0c il B ruba la W');
        }
        return fine(opposto(sede(preda.pos)),
          'il B ruba la W di L' + preda.pos + ': quella sede perde', 'T0c il B ruba la W');
      }
    }

    // La ritirata e l'avanzata valgono anche per un G o una W, per simmetria con la
    // regola di Edu sul malus: un danno che si ritira porta via il danno e la sua
    // squadra vince; allora un vantaggio che si ritira porta via il vantaggio e la sua
    // squadra perde (EURGBP 18/03/2020: il G 卯 di stagione retrocede in 寅).
    // --- T0g: il trigono formato dalle linee in movimento ----------------------
    // Edu, 11/09/2026 (AUDUSD 22/12/2025): "L4 ed L6 si muovono e insieme formano un
    // trigono di Metallo che circonda la W di Y. Long." Le linee che girano — la mobile
    // e le incompatibili — mettono in gioco partenze E arrivi. Se fra quei rami c'e' un
    // trigono intero, e le linee che lo portano stanno una sotto e una sopra una sede,
    // il trigono la CIRCONDA: se il suo elemento genera quello della sede, la nutre e la
    // sede vince. Qui 酉 (partenza di L6 e arrivo di L4), 巳 (arrivo di L6), 丑 (partenza
    // di L4) fanno 巳酉丑; L4 e L6 stanno attorno alla Ying L5, W 亥 Acqua, e il Metallo
    // genera l'Acqua: l'alto vince.
    if (!off('MLTRIGMOB') && !mobileAnnullata) {
      var inMoto = [{ pos: pos, rami: [dep, arr] }].concat((C.seconde || []).map(function (X) {
        return { pos: X.L.pos, rami: [X.dep, X.arr] };
      }));
      var ramiMoto = {};
      inMoto.forEach(function (M) { M.rami.forEach(function (r) { if (r) (ramiMoto[r] = ramiMoto[r] || []).push(M.pos); }); });
      for (var tg = 0; tg < TRIGONI.length && inMoto.length > 1; tg++) {
        var tri = TRIGONI[tg];
        if (!tri.every(function (r) { return ramiMoto[r]; })) continue;
        var portatori = {};
        tri.forEach(function (r) { ramiMoto[r].forEach(function (p2) { portatori[p2] = true; }); });
        var posP = Object.keys(portatori).map(Number);
        var elT = WX[tri[1]];
        var circondate = [R.shi, R.ying].filter(function (sp) {
          if (annullate[sp] || portatori[sp]) return false;
          var sotto = posP.some(function (p2) { return p2 < sp; }), sopra = posP.some(function (p2) { return p2 > sp; });
          return sotto && sopra;
        });
        for (var ci = 0; ci < circondate.length; ci++) {
          var LS = R.linee[circondate[ci] - 1];
          if ((LS.par === 'W' || LS.par === 'G') && GEN[elT] === LS.el) {
            racconto.push('le linee in movimento (L' + posP.sort().join(', L') + ') formano insieme il trigono ' +
              tri.join('') + ' di ' + EL_IT[elT] + ', che circonda L' + LS.pos + (LS.isShi ? ' (lo Shi)' : ' (la Ying)') +
              ', ' + PAR_IT[LS.par] + ' ' + LS.ramo + ' ' + EL_IT[LS.el] + ': il ' + EL_IT[elT] + ' genera ' +
              EL_IT[LS.el] + ', la ' + PAR_IT[LS.par] + ' è nutrita e la sua sede vince');
            return fine(sede(LS.pos), 'il trigono delle linee in movimento circonda e nutre ' + PAR_IT[LS.par] + ' di L' + LS.pos,
                        'T0g il trigono in movimento');
          }
        }
      }
    }

    // --- T0j: LA BESTIA PENALIZZA LA LINEA CHE SI MUOVE ---------------------------
    // Edu, 14/09/2026 (USDCAD 17/03/2020 seme 140): il mese 己卯 cade sulla Ying 子 mobile e
    // la penalizza (子卯刑): "non si muove proprio". Chi riceve la penalita' non fa vincere la
    // propria squadra: la sede penalizzata perde. Perimetro: la mobile e' una sede.
    // MLBESTIAPEN=off.
    if (!off('MLBESTIAPEN') && (pos === R.shi || pos === R.ying)) {
      var Qp = (C.suLinea[pos] || []).filter(function (Q) { return Q.penalizza; })[0];
      if (Qp) {
        racconto.push('la bestia ' + Qp.nome + ' ' + Qp.stelo + Qp.ramo + ' cade su L' + pos + ' (' +
          (pos === R.shi ? 'lo Shi' : 'la Ying') + ') e la penalizza: la linea non si muove proprio, e chi riceve ' +
          'la penalità non fa vincere la propria squadra');
        return fine(opposto(sede(pos)), 'la bestia penalizza la sede che si muove: la sua squadra perde',
                    'T0j la bestia penalizza la sede');
      }
    }

    // --- T0f2: LA SEDE CHE SI MUOVE NELLA PROPRIA TOMBA ----------------------------
    // Edu, 14/09/2026 (USDJPY 30/07/2024 seme 153): "Y: line moves into its own tomb. S: cannot
    // retreat. Short." La Ying G 巳 Fuoco va in 戌, la tomba del Fuoco: si sotterra, la sua
    // squadra perde -> SHORT (+109). Lo Shi 辰 -> 丑 retrocederebbe, ma il giorno 未 clasha 丑:
    // non puo' retrocedere, resta dov'e' e non decide.
    // Perimetro: una sede che si muove (mobile o ferma incompatibile) il cui arrivo e' la
    // TOMBA del proprio elemento -> quella sede perde. MLTOMBASEDE=off.
    if (!off('MLTOMBASEDE')) {
      var movT = [];
      if (arr && !mobileAnnullata) movT.push({ p: pos, dep: dep, a: arr, el: R.linee[pos - 1].el });
      (C.seconde || []).forEach(function (X) { if (!annullate[X.L.pos] && X.arr) movT.push({ p: X.L.pos, dep: X.L.ramo, a: X.arr, el: X.L.el }); });
      var tb = movT.filter(function (M) { return (M.p === R.shi || M.p === R.ying) && TOMBA[M.el] === M.a; })[0];
      if (tb) {
        racconto.push('L' + tb.p + ' (' + (tb.p === R.shi ? 'lo Shi' : 'la Ying') + ') ' + EL_IT[tb.el] + ' si muove in ' + tb.a +
          ', la tomba del proprio elemento: si sotterra, la sua squadra perde');
        return fine(opposto(sede(tb.p)), 'la sede si muove nella propria tomba: perde', 'T0f2 la sede nella propria tomba');
      }
    }

    // --- T0g2: LA SEDE CHE SI MUOVE E SI FA GENERARE INDIETRO -----------------------
    // Edu, 14/09/2026 (USDCAD 11/05/2023 seme 133): "Shi muove per generare indietro e vince.
    // Non c'e' bisogno di usare la bestia. Le bestie sono li' PER AIUTARE LA PROPRIA LINEA A
    // VINCERE! Se la sua linea gia' si muove e vince, la bestia non fa niente che possa
    // alterare il risultato." Lo Shi 丑 (incompatibile) va in 午: il Fuoco genera la Terra ->
    // lo Shi e' nutrito dal proprio arrivo -> vince -> sede alta -> LONG (+116).
    // Perimetro: una sede che si muove (mobile o ferma incompatibile) il cui arrivo GENERA la
    // partenza -> quella sede vince. Viene PRIMA delle regole con le bestie e prima della ferma
    // svegliata. MLGENINDIETRO=off.
    if (!off('MLGENINDIETRO')) {
      var movG = [];
      if (arr && !passoNullo && !mobileAnnullata) movG.push({ p: pos, dep: dep, a: arr });
      (C.seconde || []).forEach(function (X) { if (!annullate[X.L.pos] && X.arr) movG.push({ p: X.L.pos, dep: X.L.ramo, a: X.arr }); });
      // La sede nutrita resta se' stessa e parla col PROPRIO carattere (come "nutrita
      // dall'arrivo" per la mobile): W/G -> vince, P/B -> perde. Su USDJPY 13/09/2022 (Edu) la
      // Ying P 寅 nutrita dal 子 perde: la squadra bassa perde, LONG.
      // Edu, 14/09/2026 (GBPUSD 25/09/2024 seme 134): "L1 fa vincere la propria squadra" — la
      // mobile C 寅 va in 子, che la genera indietro: nutrita, fa vincere la sua squadra (bassa,
      // SHORT +104), e viene PRIMA della sede penalizzata all'arrivo. Quindi vale anche per la
      // mobile che non e' una sede, e la C nutrita VINCE. MLGENINDIETRO=sedi per il solo caso
      // delle sedi.
      var gi = movG.filter(function (M) {
        if (GEN[WX[M.a]] !== WX[M.dep]) return false;
        return M.p === R.shi || M.p === R.ying;
      })[0];
      if (gi) {
        var parGi = R.linee[gi.p - 1].par;
        var dGi = parGi === 'C' ? sede(gi.p) : dirDelCarattere(parGi, gi.p);
        racconto.push('L' + gi.p + (gi.p === R.shi ? ' (lo Shi)' : gi.p === R.ying ? ' (la Ying)' : '') + ' si muove in ' + gi.a +
          ', che genera indietro ' + gi.dep + ' (' + EL_IT[WX[gi.a]] + ' -> ' + EL_IT[WX[gi.dep]] + '): nutrita dal proprio arrivo, resta sé stessa e ' +
          (parGi === 'C' ? 'fa vincere la propria squadra' : 'parla il suo ' + PAR_IT[parGi]));
        if (dGi) return fine(dGi, 'la sede si muove per farsi generare indietro: parla il suo ' + PAR_IT[parGi], 'T0g2 la sede generata indietro');
      }
    }

    // --- T0m: LA FERMA SVEGLIATA CHE AVANZA E SI FA GENERARE INDIETRO --------------
    // Edu, 14/09/2026 (GBPUSD 09/03/2026 seme 133): "L6 clashata dalla bestia del mese muove
    // per generare indietro. Long. ... va su 戌 che genera indietro. Questa e' una linea ferma
    // quindi quando clashata non cambia da yin a yang o viceversa."
    // La ferma clashata da una bestia (svegliata) non cambia polarita': AVANZA di un ramo
    // (酉 -> 戌). Se l'arrivo GENERA la partenza (戌 Terra genera 酉 Metallo) la linea e' nutrita
    // e parla col proprio carattere: G in alto -> l'alto vince. Perimetro: la ferma svegliata
    // da una bestia, G, arrivo che genera la partenza. MLSVEGLIAAVANZA=off;
    // MLSVEGLIAAVANZA=gw anche per la W (estensione).
    // LA FERMA CLASHATA DAL GIORNO SI MUOVE E RETROCEDE — Edu, 17/09/2026 (S50), USDCHF
    // 07/08/2024 seme 85: "quando una linea statica e' clashata dal giorno si muove alla riga
    // successiva senza mutare... L3 retrocede e fa perdere". Il clash del giorno la fa MUOVERE
    // (暗動): passa al ramo precedente senza cambiare polarita' (酉 -> 申) e, se e' un G/W,
    // porta via il vantaggio come ogni ritirata: la sua sede perde. Diverso dal clash della
    // BESTIA, che la fa avanzare (酉 -> 戌, gradino qui sotto). MLSVEGLIARETRO=off.
    if (!off('MLSVEGLIARETRO')) {
      var RETROB = { '子':'亥','丑':'子','寅':'丑','卯':'寅','辰':'卯','巳':'辰','午':'巳','未':'午','申':'未','酉':'申','戌':'酉','亥':'戌' };
      var svR = R.linee.filter(function (L) {
        if (L.isMobile || L.pos === pos || annullate[L.pos]) return false;
        if ((C.seconde || []).some(function (X) { return X.L.pos === L.pos; })) return false;
        if (!C.D || CLASH[C.D] !== L.ramo) return false;
        if (L.par !== 'G' && L.par !== 'W') return false;
        return WX[RETROB[L.ramo]] === L.el;   // ritirata vera: stesso elemento, un passo indietro
      })[0];
      if (svR) {
        racconto.push('L' + svR.pos + ' ' + PAR_IT[svR.par] + ' ' + svR.ramo + ' è ferma ma il giorno ' + C.D +
          ' la clasha: si muove senza mutare e retrocede in ' + RETROB[svR.ramo] + ', quindi porta via il vantaggio e la sua sede perde');
        return fine(opposto(sede(svR.pos)), 'la ferma clashata dal giorno retrocede: il ' + PAR_IT[svR.par] + ' porta via il vantaggio',
                    'T0m la ferma clashata retrocede');
      }
    }

    if (!off('MLSVEGLIAAVANZA')) {
      var AV = { '子':'丑','丑':'寅','寅':'卯','卯':'辰','辰':'巳','巳':'午','午':'未','未':'申','申':'酉','酉':'戌','戌':'亥','亥':'子' };
      var svegl = R.linee.filter(function (L) {
        if (L.isMobile || L.pos === pos || annullate[L.pos]) return false;
        if ((C.seconde || []).some(function (X) { return X.L.pos === L.pos; })) return false;
        var daBestia = (C.suLinea[L.pos] || []).some(function (Q) { return CLASH[Q.ramo] === L.ramo; });
        if (!daBestia) return false;
        var arrS = AV[L.ramo];
        if (GEN[WX[arrS]] !== L.el) return false;
        return L.par === 'G' || (ENV.MLSVEGLIAAVANZA === 'gw' && L.par === 'W');
      })[0];
      if (svegl) {
        var arrS2 = AV[svegl.ramo];
        racconto.push('L' + svegl.pos + ' ' + PAR_IT[svegl.par] + ' ' + svegl.ramo + ' è ferma ma la bestia che le cade sopra la clasha: si sveglia e, senza cambiare polarità, avanza in ' +
          arrS2 + ', che la genera indietro (' + EL_IT[WX[arrS2]] + ' -> ' + EL_IT[svegl.el] + '): nutrita, parla il suo ' + PAR_IT[svegl.par]);
        var dS3 = dirDelCarattere(svegl.par, svegl.pos);
        if (dS3) return fine(dS3, 'la ferma svegliata avanza e si fa generare indietro: parla il ' + PAR_IT[svegl.par],
                             'T0m la svegliata avanza generata indietro');
      }
    }

    // --- T0h: LA SEDE CHE SALE LA SCALA E DIVENTA L'ARRIVO FINALE -----------------
    // Edu, 14/09/2026 (USDJPY 02/08/2022 seme 131): "S raggiunge 酉. Y e' 卯. Long." Lo Shi
    // 丑 (incompatibile) va in 亥, il ramo da cui parte la mobile L5: per l'effetto scala
    // prosegue lungo di lei fino a 酉 e DIVENTA 酉 Metallo; contro la Ying 卯 Legno il Metallo
    // controlla il Legno -> vince lo Shi -> LONG. (Gia' letta cosi' da Edu su EURJPY 06/02/2025
    // con la sede presa dalle bestie; qui senza bestie: la scala non ne ha bisogno.)
    // La penalita' del giorno sul primo gradino (亥亥) non conta: la sede non si ferma li'.
    // Perimetro: una sede che si muove (mobile o ferma incompatibile) il cui arrivo e' il ramo
    // di PARTENZA di un'altra linea in movimento -> la sede diventa l'arrivo di quella linea e
    // si confronta con l'altra sede. MLSCALASEDE2=off.
    if (!off('MLSCALASEDE2')) {
      var movH = [];
      if (arr && !passoNullo && !mobileAnnullata) movH.push({ p: pos, dep: dep, a: arr });
      (C.seconde || []).forEach(function (X) { if (!annullate[X.L.pos] && X.arr) movH.push({ p: X.L.pos, dep: X.L.ramo, a: X.arr }); });
      for (var ih = 0; ih < movH.length; ih++) {
        var SH = movH[ih];
        if (SH.p !== R.shi && SH.p !== R.ying) continue;
        var grad = movH.filter(function (M) { return M.p !== SH.p && M.dep === SH.a; })[0];
        if (!grad) continue;
        var altraH = SH.p === R.shi ? R.ying : R.shi;
        var eAltH = elDopoLeBestie(R.linee[altraH - 1], C);
        var eSedeH = WX[grad.a];
        racconto.push('L' + SH.p + ' (' + (SH.p === R.shi ? 'lo Shi' : 'la Ying') + ') si muove in ' + SH.a +
          ', il ramo da cui parte L' + grad.p + ': effetto scala, prosegue fino a ' + grad.a + ' e diventa ' +
          PAR_IT[parDi(eSedeH, palEl)] + ' ' + grad.a + '. Si confronta con ' + (altraH === R.shi ? 'lo Shi' : 'la Ying') +
          ' ' + R.linee[altraH - 1].ramo);
        var dH = confrontoDiretto(R, C, SH.p === R.shi ? eSedeH : eAltH, SH.p === R.shi ? eAltH : eSedeH, racconto);
        if (dH) return fine(dH, 'la sede sale la scala e diventa ' + grad.a + ': confronto con l\'altra sede',
                            'T0h la sede sale la scala');
      }
    }

    // --- T0w: LE LINEE VINCENTI PORTATE ALL'ALTRO TRIGRAMMA ---------------------------
    // Edu, 16/09/2026 (USDJPY 06/11/2024 seme 151, LONG +320), riletta con le incompatibili:
    // "una linea incompatibile puo' controllare indietro ma non puo' rimanere in quel trigramma
    // quindi dopo aver controllato indietro comunque si muove in avanti e cerca qualcosa da
    // fare. Qui si combina con Y portando la G w la' sopra su Y. L2 invece puo' muoversi perche'
    // il clash contro il Tai Sui non annulla o blocca la linea ma la spinge in avanti, quindi
    // per effetto scala G w arriva su L1 che e' ancora clashato in avanti per diventare Yin e
    // combinarsi con L4. Risultato: il trigramma superiore riceve due winner G w" -> il basso
    // che le cede perde -> LONG. Precisazione: "G w capita dentro il trigramma futuro Kan quindi
    // questo e' un altro motivo per cui e' spinta in avanti". Gli arrivi sono del FUTURO COMUNE.
    // Due modi in cui una linea vincente (G o W) viene PORTATA su una linea:
    //  a) la seconda (incompatibile) il cui arrivo controlla indietro la partenza e nel palazzo
    //     e' G/W: non si ferma, combina con la linea che porta il ramo combinato dell'arrivo;
    //  b) la mobile G/W il cui arrivo e' il ramo del Tai Sui clashato dal giorno: non e' bloccata,
    //     scende sulla linea che porta quel ramo, la quale avanza al proprio ramo nel futuro
    //     comune e combina con la linea che lo combina.
    // Conclusione: le linee raggiunte stanno tutte nello stesso trigramma -> quel trigramma vince.
    // Basta UNA portata (validato da Edu il 16/09/2026); MLPORTATE=due per il perimetro stretto
    // della carta; MLPORTATE=off spegne.
    if (!off('MLPORTATE') && arr && !passoNullo) {
      var portate = [];
      (C.seconde || []).forEach(function (X) {
        if (!X.arr || X.vuota || annullate[X.L.pos]) return;
        var pA = parDi(WX[X.arr], palEl);
        if (KE[WX[X.arr]] !== WX[X.dep] || (pA !== 'G' && pA !== 'W')) return;
        var tg = R.linee.filter(function (L) { return L.pos !== X.L.pos && L.pos !== pos && COMBINA[X.arr] === L.ramo; })[0];
        if (!tg) return;
        racconto.push('L' + X.L.pos + ' è incompatibile e si muove in ' + X.arr + ', che la controlla indietro (' + PAR_IT[pA] +
          ' nel palazzo); non può restare lì e va avanti: ' + X.arr + ' combina con ' + tg.ramo + ' di L' + tg.pos +
          ' e porta il ' + PAR_IT[pA] + ' su L' + tg.pos);
        portate.push({ pos: tg.pos, par: pA });
      });
      var pM = mob.par;
      if ((pM === 'G' || pM === 'W') && arr === R.yearBranch && R.dayBranch && CLASH[R.dayBranch] === arr) {
        var L1t = R.linee.filter(function (L) { return L.pos !== pos && !L.isMobile && L.ramo === arr; })[0];
        var RF2 = C.futuro && C.futuro.RF;
        var ramoFut = (L1t && RF2 && RF2.linee) ? RF2.linee[L1t.pos - 1].ramo : null;
        var tg2 = ramoFut ? R.linee.filter(function (L) { return L.pos !== L1t.pos && L.pos !== pos && COMBINA[ramoFut] === L.ramo; })[0] : null;
        if (L1t && tg2) {
          racconto.push('la mobile ' + PAR_IT[pM] + ' arriva in ' + arr + ', il ramo del Tai Sui, clashato dal giorno ' + R.dayBranch +
            ': il clash non la blocca, la spinge avanti; per effetto scala il ' + PAR_IT[pM] + ' scende su L' + L1t.pos + ' (' + arr +
            '), che avanza in ' + ramoFut + ' e combina con ' + tg2.ramo + ' di L' + tg2.pos + ': il ' + PAR_IT[pM] + ' sale su L' + tg2.pos);
          portate.push({ pos: tg2.pos, par: pM });
        }
      }
      // Edu, 16/09/2026: "Puoi accenderla. E' frequente che in una lettura ci siano piu' motivi
      // attraverso cui si ottiene un risultato positivo" -> basta UNA portata (MLPORTATE=due torna
      // al perimetro stretto della carta).
      var minPortate = ENV.MLPORTATE === 'due' ? 2 : 1;
      if (portate.length >= minPortate) {
        var lati = {}; portate.forEach(function (P) { lati[P.pos <= 3 ? 'basso' : 'alto'] = true; });
        if (!(lati.basso && lati.alto)) {
          var latoV = lati.alto ? 'alto' : 'basso';
          racconto.push('il trigramma ' + (latoV === 'alto' ? 'superiore' : 'inferiore') + ' riceve ' + portate.length +
            ' line' + (portate.length > 1 ? 'e vincenti' : 'a vincente') + ': vince');
          return fine(latoV === 'alto' ? 'LONG' : 'SHORT', 'le linee vincenti sono portate al trigramma ' + latoV,
                      'T0x le vincenti portate');
        }
      }
    }

    // --- T0a: LA SEDE VUOTA SVEGLIATA DALLA COMBINAZIONE DEL GIORNO ------------------
    // Edu, 16/09/2026 (NZDUSD 22/06/2023 seme 62, SHORT -27), riletta con le incompatibili:
    // "L3 moves into an healthy C which cannot stay in Qian and have to scale down to L2.
    // L1 at Y cannot change into G Zi because of the day combining but it's awake out of the
    // void. Then Y controls S and wins."
    // Due cose: 1) la seconda (incompatibile) che arriva in un ramo a sua volta incompatibile
    // col trigramma futuro non puo' restarci e SCENDE sulla linea che porta quel ramo (qui il C
    // 辰 su L2, un C: non decide); 2) la SEDE mobile, vuota, la cui partenza e' combinata dal
    // giorno: non puo' trasformarsi nell'arrivo, ma NON e' inerte. Precisazione di Edu
    // (16/09/2026): "Non e' la combinazione che la sveglia, e' il fatto che e' comunque una
    // linea mobile. E' come un treno in partenza, subisce un ritardo ma ha comunque i motori
    // accesi" (la mobile non e' mai vuota, 動不為空). Parla col proprio elemento: confronto
    // diretto per controllo con l'altra sede. Il vuoto della partenza NON e' la condizione:
    // MLSVEGLIACOMB=vuota per il perimetro stretto della carta (partenza vuota).
    // Sostituisce, su questa carta, la lettura di agosto (padrone del giorno + duello per
    // generazione), che dava lo stesso SHORT. MLSVEGLIACOMB=off spegne.
    // Dottrina di Edu (16/09/2026): la mobile PIENA combinata alla partenza non si usa (T0m); qui
    // arriva solo la mobile VUOTA, che non parte ma resta attiva.
    if (!off('MLSVEGLIACOMB') && (pos === R.shi || pos === R.ying) && C.D && COMBINA[C.D] === dep && C.vuoto(dep) && !mobileAnnullata) {
      (C.seconde || []).forEach(function (X) {
        if (!X.arr || !C.incompFuturo(X.arr, X.L.pos)) return;
        var giu = R.linee.filter(function (L) { return L.pos !== X.L.pos && L.pos !== pos && L.ramo === X.arr; })[0];
        racconto.push('L' + X.L.pos + ' è incompatibile e si muove in ' + X.arr + ' (' + PAR_IT[parDi(WX[X.arr], palEl)] +
          ' nel palazzo), ma ' + X.arr + ' è a sua volta incompatibile col trigramma futuro: non può restarci' +
          (giu ? ' e scende su L' + giu.pos + ', che porta ' + giu.ramo : ''));
      });
      // Edu, 16/09/2026: "Si usa se non c'e' nient'altro da leggere. Hai fatto la stessa
      // verifica?" -> la sede in ritardo agisce sull'altra sede SOLO se nessun'altra linea in
      // movimento produce un effetto: ogni seconda (incompatibile) deve essere senza arrivo,
      // nel vuoto, o scesa perche' a sua volta incompatibile col futuro. Altrimenti si prosegue
      // e il ritardo resta solo raccontato. MLSVEGLIACOMB=subito per concludere comunque.
      var altroDaLeggere = (C.seconde || []).some(function (X) {
        return X.arr && !X.vuota && !C.incompFuturo(X.arr, X.L.pos);
      });
      var altraS = pos === R.shi ? R.ying : R.shi;
      var eSede = WX[dep], eAltra = WX[R.linee[altraS - 1].ramo];
      // LETTURA DI CLAUDE (16/09/2026) sulle gemelle NZDUSD 22/06/2023 (SHORT), 15/06/2022 (LONG) e
      // 19/12/2023 (LONG), stesso esagramma, stessa mobile L1, stesso giorno 亥, DA VALIDARE:
      // il controllo della sede in ritardo (una P) e' debole; a decidere prima e' la linea
      // seduta sul RAMO DEL MESE, la piu' forte dell'esagramma, col suo carattere — se resta.
      // 22/06/2023: il mese 午 siede sul B di L3, che pero' se ne va (incompatibile, arriva in un
      //   C sano e scende su L2): nessuno sta sul mese, decide il controllo della Ying -> SHORT.
      // 15/06/2022: stesso B 午 sul mese, ma il suo arrivo 辰 e' VUOTO: va nel vuoto, il B resta
      //   sul mese nel trigramma basso e fa perdere la propria squadra -> LONG.
      // 19/12/2023: il mese 子 siede sul G di L5, in alto: il G piu' forte fa vincere l'alto -> LONG.
      // Spiega le tre gemelle, ma sul mazzo la linea sul mese decide 25 carte al 40%: SPENTA finche' Edu
      // non la valida o la corregge. MLRITARDOMESE=on accende.
      var suMese = null;
      if (ENV.MLRITARDOMESE === 'on' && R.monthBranch) {
        R.linee.forEach(function (L) {
          if (L.pos === pos || L.ramo !== R.monthBranch || annullate[L.pos]) return;
          var seconda = (C.seconde || []).filter(function (X) { return X.L.pos === L.pos; })[0];
          if (seconda && seconda.arr && !seconda.vuota) return;   // si muove davvero: se ne va dal mese
          suMese = L;
        });
      }
      if (suMese && (suMese.par === 'G' || suMese.par === 'W' || suMese.par === 'P' || suMese.par === 'B')) {
        var vinceMese = (suMese.par === 'G' || suMese.par === 'W');
        racconto.push('L' + suMese.pos + ' ' + PAR_IT[suMese.par] + ' ' + suMese.ramo + ' siede sul ramo del mese ed è la linea più forte: ' +
          (vinceMese ? 'fa vincere' : 'fa perdere') + ' la propria squadra, prima del controllo della sede in ritardo');
        return fine(vinceMese ? sede(suMese.pos) : opposto(sede(suMese.pos)),
          'la linea sul mese decide prima della sede in ritardo (' + PAR_IT[suMese.par] + ')', 'T0a la sede in ritardo: la linea sul mese');
      }
      if (altroDaLeggere && ENV.MLSVEGLIACOMB !== 'subito') {
        racconto.push('la sede in ritardo resta viva, ma c\'è altro movimento da leggere prima: si prosegue');
      } else {
      racconto.push('la ' + (pos === R.shi ? 'Shi' : 'Ying') + ' L' + pos + ' (' + PAR_IT[mob.par] + ' ' + dep +
        (C.vuoto(dep) ? ', vuota' : '') + ') non può trasformarsi in ' + arr + ' perché il giorno ' + C.D + ' combina la partenza; ' +
        'ma è comunque una linea mobile, in ritardo coi motori accesi: non è vuota, è viva e porta ' + EL_IT[eSede]);
      if (KE[eSede] === eAltra) {
        racconto.push(EL_IT[eSede] + ' controlla ' + EL_IT[eAltra] + ' dell\'altra sede: la ' + (pos === R.shi ? 'Shi' : 'Ying') + ' vince');
        return fine(sede(pos), 'la sede in ritardo per la combinazione del giorno controlla l\'altra sede', 'T0a la sede in ritardo');
      }
      if (KE[eAltra] === eSede) {
        racconto.push(EL_IT[eAltra] + ' dell\'altra sede controlla ' + EL_IT[eSede] + ': la ' + (pos === R.shi ? 'Shi' : 'Ying') + ' perde');
        return fine(opposto(sede(pos)), 'la sede in ritardo per la combinazione del giorno è controllata dall\'altra sede', 'T0a la sede in ritardo');
      }
      racconto.push('fra le due sedi non c\'è controllo: si prosegue');
      }
    }

    // --- T0s: l'EFFETTO SCALA ----------------------------------------------------
    // Edu, 11/09/2026 (USDJPY 02/10/2024 seme 143, Tun 33 -> Song 6): "Effetto scala. L3
    // si muove in G 午, L2 continua il movimento e arriva a P 辰. Poiche' l'intero
    // movimento finisce su P questo fa perdere la propria squadra. Long."
    // Perimetro della carta: una seconda linea in movimento (incompatibile) arriva sullo
    // STESSO ramo da cui parte la mobile; allora il movimento non si ferma li': prosegue
    // lungo la mobile fino al suo arrivo (dal futuro comune), e a parlare e' il carattere
    // di quell'arrivo finale nel palazzo, sulla sede della mobile. P o B -> la sede perde.
    // Sulla carta l'arrivo finale 辰 e' vuoto e la lettura vale lo stesso: niente
    // condizione sul vuoto. G/W -> la sede vince: NON detto da Edu, estensione di Claude
    // col principio del carattere, dietro MLSCALAGW=on (spento).
    // POSIZIONE: DOPO il trigono in movimento. Su AUDUSD 22/12/2025 la stessa scala c'e'
    // (L4 arriva in 酉, da cui parte L6) ma Edu legge il trigono che circonda la Ying.
    // SECONDA FACCIA, Edu 11/09/2026 (USDCAD 13/09/2022 seme 129): "L3 raggiunge L4 午 che
    // genera indietro. Una linea che retrocede non puo' piu' farlo se viene generata indietro,
    // perche' retrocedere significa perdere energia e generare significa acquisire energia.
    // Poiche' questo avviene con S, si deve subito confrontare 丑 con Y e vince Long."
    // Se la mobile-sede arriva sul ramo di una seconda mobile (scalino) e l'arrivo di quella
    // seconda GENERA all'indietro il gradino raggiunto, la seconda non retrocede piu': la
    // catena si ferma li' e la sede si confronta con l'altra portando il ramo raggiunto.
    if (!off('MLSCALAGEN') && arr && !passoNullo && (pos === R.shi || pos === R.ying)) {
      // Chi retrocede e' la SEDE (辰 -> 丑); il gradino raggiunto (L4 丑) manda avanti 午, che
      // genera all'indietro il 丑: energia in entrata, quindi la sede non perde piu' energia
      // e la catena si ferma sul gradino.
      var gradino = RETRO[dep] === arr ? (C.seconde || []).filter(function (X) {
        return X.L.ramo === arr && X.arr && GEN[WX[X.arr]] === WX[arr];
      })[0] : null;
      if (gradino) {
        var altra = pos === R.shi ? R.ying : R.shi;
        var eA = elDopoLeBestie(R.linee[altra - 1], C);
        racconto.push('effetto scala: la sede L' + pos + ' arriva in ' + arr + ', il ramo di L' + gradino.L.pos +
          ': la sede stava retrocedendo (' + dep + ' → ' + arr + '), ma L' + gradino.L.pos + ' manda avanti ' +
          gradino.arr + ', che GENERA ' + arr + ' — chi retrocede perde energia, chi è generato la acquista: ' +
          'la catena si ferma qui e la sede porta ' + arr);
        var dSG = confrontoDiretto(R, C, pos === R.shi ? WX[arr] : eA, pos === R.shi ? eA : WX[arr], racconto);
        if (dSG) return fine(dSG, 'la scala si ferma sul gradino generato indietro: ' + arr + ' contro l\'altra sede',
                             'T0s la scala fermata dalla generazione');
      }
    }

    if (!mobileAnnullata && !off('MLSCALA') && arr && !passoNullo) {
      var scala = (C.seconde || []).filter(function (X) {
        return X.arr === dep && !annullate[X.L.pos];
      })[0];
      var parFin = scala ? parDi(WX[arr], palEl) : null;
      var scalaGW = parFin === 'G' || parFin === 'W';
      if (scala && (parFin === 'P' || parFin === 'B' || (scalaGW && ENV.MLSCALAGW === 'on'))) {
        racconto.push('effetto scala: L' + scala.L.pos + ' si muove in ' + scala.arr + ', lo stesso ramo da cui parte ' +
          'la mobile; L' + pos + ' continua il movimento e arriva in ' + arr + ', che nel palazzo è ' + PAR_IT[parFin] +
          '. L\'intero movimento finisce su ' + PAR_IT[parFin] + ': ' +
          (scalaGW ? 'fa vincere la propria squadra' : 'fa perdere la propria squadra'));
        return fine(scalaGW ? sede(pos) : opposto(sede(pos)),
          'effetto scala: il movimento finisce su ' + PAR_IT[parFin] + ' in L' + pos, 'T0s effetto scala');
      }
    }

    // --- T0k: LA LINEA CHE SI MUOVE PER COMBINARSI CON UNA SEDE -------------------
    // Edu, 11/09/2026 (USDJPY 05/12/2022 seme 134): "C'e' ancora un altro modo per vedere la
    // vittoria del long: Shi W si muove per combinarsi con Y, quindi porta W su Ying che
    // vince." Lo Shi W 午 va in 辰: 辰酉合 con la Ying 酉 — lo Shi si muove per combinarsi con
    // lei e le porta il proprio carattere, W: la Ying vince, sede alta -> LONG.
    // Perimetro: una linea in movimento (la mobile o una ferma incompatibile) il cui ARRIVO
    // combina (六合) il ramo di una sede diversa da se stessa: quella sede riceve il carattere
    // della linea che arriva; se e' un vantaggio (G/W) vince, se e' un malus (P/B) perde.
    // POSIZIONE: dopo la seconda che retrocede — su EURJPY 15/08/2024 (carta di Edu) la Ying
    // raggiunge L5 ma li' decide L2 che retrocede con le bestie sopra. Prima di tutto il resto.
    // MLCOMBSEDE=off.
    if (!off('MLCOMBSEDE')) {
      var mosse = [];
      // Se il giorno CLASHA l'arrivo la linea resta attiva e non cambia (Edu, EURJPY
      // 15/08/2024): si muove lo stesso e puo' raggiungere un'altra linea — su USDJPY
      // 09/02/2026 la Ying 未 va in 申 e 巳申合 con L6. MLCOMBNULLO=off.
      var vaComunque = !!arr && !mobileAnnullata &&
          (!passoNullo || (!off('MLCOMBNULLO') && !!C.D && CLASH[C.D] === arr));
      if (vaComunque) mosse.push({ L: R.linee[pos - 1], a: arr });
      (C.seconde || []).forEach(function (X) { if (!annullate[X.L.pos] && X.arr) mosse.push({ L: X.L, a: X.arr }); });
      var comb = null;
      mosse.forEach(function (M) {
        [R.shi, R.ying].forEach(function (sp) {
          if (M.L.pos === sp || comb) return;
          if (COMBINA[M.a] !== R.linee[sp - 1].ramo) return;
          // Edu, 14/09/2026 (USDCAD 25/03/2020 seme 144): "una Ying rotta non puo' ricevere il
          // G che le viene portato." Una sede rotta (clashata dal giorno, fuori stagione, senza
          // la protezione del mese) non riceve la combinazione. MLCOMBROTTA=off.
          // Edu, 14/09/2026 (USDCAD 17/03/2020 seme 140): "Non puo' portare su una linea gia'
          // combinata." Se un ramo della data combina gia' la sede, la sede e' legata e non
          // riceve niente. MLCOMBLEGATA=off.
          if (!off('MLCOMBLEGATA') && C.ramiData.some(function (r) { return COMBINA[r] === R.linee[sp - 1].ramo; })) {
            racconto.push('L' + M.L.pos + ' si muove in ' + M.a + ' per combinarsi con ' +
              (sp === R.shi ? 'lo Shi' : 'la Ying') + ' ' + R.linee[sp - 1].ramo +
              ', ma quella sede è già combinata dalla data: non può portarle niente');
            return;
          }
          if (!off('MLCOMBROTTA') && rottaL(R.linee[sp - 1], R, C)) {
            racconto.push('L' + M.L.pos + ' si muove in ' + M.a + ' per combinarsi con ' +
              (sp === R.shi ? 'lo Shi' : 'la Ying') + ' ' + R.linee[sp - 1].ramo +
              ', ma quella sede è rotta: non può ricevere niente');
            return;
          }
          comb = { M: M, sp: sp };
        });
      });
      // Edu, 14/09/2026 (USDJPY 01/05/2024 seme 157): "L2 incompatibile si muove e arriva su
      // Ying portando G. Long. La bestia della linea intralcia? Si'. L'ora 丙子 arriva su L2 e
      // blocca 午 quindi G rimane su S. Short (non si comparano piu' S e Y perche' il movimento
      // e' stato bloccato dalla bestia)." Se un pilastro caduto sulla linea che si muove CLASHA
      // il suo arrivo, il movimento e' bloccato: la linea resta col proprio carattere sulla
      // propria sede. Edu, 14/09/2026: "Puoi estendere, il principio e' giusto e deve valere
      // anche per altre linee" -> vale per ogni linea che si muove, sede o no.
      // MLBESTIABLOCCA=off; MLBESTIABLOCCA=sede per il solo perimetro della carta.
      if (comb && !off('MLBESTIABLOCCA')) {
        var Mb = comb.M, blocca = (C.suLinea[Mb.L.pos] || []).filter(function (Q) { return CLASH[Q.ramo] === Mb.a; })[0];
        var eSede = Mb.L.pos === R.shi || Mb.L.pos === R.ying;
        if (blocca && (eSede || ENV.MLBESTIABLOCCA !== 'sede')) {
          racconto.push('L' + Mb.L.pos + ' ' + PAR_IT[Mb.L.par] + ' ' + Mb.L.ramo + ' si muove in ' + Mb.a +
            ' per combinarsi con ' + (comb.sp === R.shi ? 'lo Shi' : 'la Ying') + ', ma la bestia ' + blocca.nome + ' ' +
            blocca.stelo + blocca.ramo + ' che le cade sopra clasha ' + Mb.a + ': il movimento è bloccato, il ' +
            PAR_IT[Mb.L.par] + ' resta su L' + Mb.L.pos + '. Le sedi non si confrontano più');
          var dB = dirDelCarattere(Mb.L.par, Mb.L.pos);
          if (dB) return fine(dB, 'la bestia blocca l\'arrivo: il ' + PAR_IT[Mb.L.par] + ' resta sulla sua sede',
                              'T0k la bestia blocca la combinazione');
          comb = null;
        }
      }
      // Edu, 14/09/2026 (USDCAD 25/03/2020): "Shi si muove in una P e questo fa perdere la
      // propria squadra PERO' Yong sta messa peggio perche' 酉 e' untimely e doppiamente
      // clashata. Di fatto e' completamente eliminata. Quindi S vince perche' il nemico sta
      // molto peggio." Se la linea che si muove e' una sede e il suo movimento la fa perdere
      // (arriva in un P/B), ma l'ALTRA sede e' eliminata (fuori stagione e clashata da due rami
      // della data), vince comunque la sede che si muove. MLNEMICOPEGGIO=off.
      if (!off('MLNEMICOPEGGIO') && !comb) {
        var Mv = mosse.filter(function (M) { return M.L.pos === R.shi || M.L.pos === R.ying; })[0];
        if (Mv) {
          var parArrV = parDi(WX[Mv.a], palEl), altraV = Mv.L.pos === R.shi ? R.ying : R.shi;
          var LAlt = R.linee[altraV - 1];
          var nClash = C.ramiData.filter(function (r) { return CLASH[r] === LAlt.ramo; }).length;
          var eliminata = nClash >= 2 && !C.timely(LAlt.el) && !protettaDalMese(LAlt, R, C);
          if ((parArrV === 'P' || parArrV === 'B') && eliminata) {
            racconto.push('L' + Mv.L.pos + ' (' + (Mv.L.pos === R.shi ? 'lo Shi' : 'la Ying') + ') si muove in ' + Mv.a +
              ', che è ' + PAR_IT[parArrV] + ': farebbe perdere la propria squadra. Ma ' +
              (altraV === R.shi ? 'lo Shi' : 'la Ying') + ' ' + LAlt.ramo + ' sta peggio: fuori stagione e clashata da ' +
              nClash + ' rami della data, di fatto eliminata. Vince chi ha il nemico messo peggio');
            return fine(sede(Mv.L.pos), 'la sede si muove in un ' + PAR_IT[parArrV] + ' ma il nemico è eliminato: vince lei',
                        'T0k il nemico sta peggio');
          }
        }
      }
      if (comb) {
        // Il carattere portato e' quello della linea DOPO le bestie: se un pilastro se l'e'
        // presa, porta il carattere del ramo della bestia (USDJPY 09/02/2026: lo Shi 亥 G e'
        // preso dall'anno 丙午 e porta 午, che nel palazzo 離 e' un B). MLCOMBPAR=partenza.
        var parK = comb.M.L.par;
        if (ENV.MLCOMBPAR !== 'partenza') {
          var eK = elDopoLeBestie(comb.M.L, C);
          if (eK !== comb.M.L.el) parK = parDi(eK, palEl);
        }
        var dK = dirDelCarattere(parK, comb.sp);
        // Edu, 14/09/2026 (EURJPY 31/10/2023 seme 158): "Prima: L3 si muove per combinarsi con
        // Y, porta un loser B su Y. Poi interviene la bestia e sostituisce la untimely B su Y
        // con 丑 che e' C che vince." Dopo il movimento, se la sede che ha ricevuto un P/B e'
        // presa da una bestia, la bestia sostituisce il carattere: se quello nuovo non e' un
        // loser, la sede vince. MLBESTIASOSTSEDE=off.
        if (!off('MLBESTIASOSTSEDE') && (parK === 'P' || parK === 'B')) {
          var Lsp = R.linee[comb.sp - 1];
          var Qs = (C.suLinea[comb.sp] || []).filter(function (Q) { return Q.possiede; })[0];
          if (Qs) {
            var parNuovo = parDi(WX[Qs.ramo], palEl);
            if (parNuovo !== 'P' && parNuovo !== 'B') {
              // Se anche l'ALTRA sede e' presa dalle bestie, da li' e' solo Shi contro Ying
              // (Edu, EURJPY 10/02/2026: Ying presa dal mese e dall'ora, Shi dall'anno ->
              // confronto con la relazione, vince lo Shi).
              var altraSp = comb.sp === R.shi ? R.ying : R.shi;
              var altraPresa = (C.suLinea[altraSp] || []).some(function (Q) { return Q.possiede; });
              if (altraPresa) {
                var eA1 = elDopoLeBestie(R.linee[R.shi - 1], C), eA2 = elDopoLeBestie(R.linee[R.ying - 1], C);
                racconto.push('la bestia ' + Qs.nome + ' ' + Qs.stelo + Qs.ramo + ' prende ' + (comb.sp === R.shi ? 'lo Shi' : 'la Ying') +
                  ' e anche l\'altra sede è presa: da qui solo Shi (' + EL_IT[eA1] + ') contro Ying (' + EL_IT[eA2] + ')');
                var dA = confrontoDiretto(R, C, eA1, eA2, racconto);
                if (dA) return fine(dA, 'le due sedi prese: solo Shi contro Ying', 'T0k le due sedi prese');
              }
              racconto.push('L' + comb.M.L.pos + ' si muove in ' + comb.M.a + ' per combinarsi con ' +
                (comb.sp === R.shi ? 'lo Shi' : 'la Ying') + ' ' + Lsp.ramo + ' e le porta un ' + PAR_IT[parK] +
                ' perdente. Poi interviene la bestia ' + Qs.nome + ' ' + Qs.stelo + Qs.ramo + ': sostituisce il ' +
                PAR_IT[Lsp.par] + ' ' + Lsp.ramo + ' con ' + Qs.ramo + ', che è ' + PAR_IT[parNuovo] + ' — la sede vince');
              return fine(sede(comb.sp), 'la bestia sostituisce il perdente sulla sede con ' + PAR_IT[parNuovo] + ': vince',
                          'T0k la bestia sostituisce il perdente sulla sede');
            }
          }
        }
        if (dK) {
          racconto.push('L' + comb.M.L.pos + ' ' + PAR_IT[comb.M.L.par] + ' ' + comb.M.L.ramo +
            ' si muove in ' + comb.M.a + ' per combinarsi con ' + (comb.sp === R.shi ? 'lo Shi' : 'la Ying') +
            ' ' + R.linee[comb.sp - 1].ramo + ': le porta il carattere che ha addosso, ' + PAR_IT[parK]);
          return fine(dK, 'si muove per combinarsi con ' + (comb.sp === R.shi ? 'lo Shi' : 'la Ying') +
                      ' e le porta il ' + PAR_IT[parK], 'T0k si muove per combinarsi con una sede');
        }
      }
    }

    // --- T0y: LA SEDE IN MOVIMENTO PRESA DALLE BESTIE -> SOLO SHI CONTRO YING ------
    // Edu, 11/09/2026 (EURJPY 10/08/2023 seme 157): "Quando S o Y vengono presi dalle
    // bestie da quel momento in poi la partita diventa esclusivamente fra S vs Y."
    // Perimetro della carta: la seconda linea in movimento (ferma incompatibile) e' lei
    // stessa lo Shi o la Ying e una bestia se la prende -> confronto diretto fra le due
    // sedi, nient'altro. (Provato in largo, "appena una sede e' presa": rompe otto carte
    // di riferimento di Edu, 1.525 carte al 49,25% -> MLSOLOSY=tutto, spento.)
    if (!off('MLSEDESEC')) {
      var secSede = (C.seconde || []).filter(function (X) {
        return !annullate[X.L.pos] && (X.L.pos === R.shi || X.L.pos === R.ying) &&
               (C.suLinea[X.L.pos] || []).some(function (Q) { return Q.possiede; });
      })[0];
      // Edu, 11/09/2026 (EURJPY 06/02/2025 seme 158): "Shi si muove e, per effetto scala,
      // arriva fino a C 戌 sull'arrivo di L4, quindi S diventa C 戌. A questo punto scatta il
      // confronto con Y e vince lo short." La sede in movimento che arriva sul ramo di
      // PARTENZA della mobile prosegue lungo la mobile fino al suo arrivo: la sede diventa
      // quell'arrivo. Viene prima del ponte della bestia. MLSCALASEDE=off.
      var scalaSede = secSede && !off('MLSCALASEDE') && arr && !passoNullo && secSede.arr === dep;
      if (secSede) {
        // Edu, 11/09/2026: "arriva Mao che fa da ponte fra Hai e Si quindi il flusso arriva
        // fino a Si che genera Ying con Wei e fa vincere il Long". La bestia sulla sede che si
        // muove e' un ponte: dal ramo della linea, di bestia in bestia per generazione, fino
        // all'arrivo se la catena lo genera — e l'arrivo non e' vuoto, perche' sulla linea e'
        // arrivata una bestia. MLPONTEBESTIA=off per l'elemento della sola bestia.
        var eSec = elDopoLeBestie(secSede.L, C), pontePassa = false;
        if (scalaSede) {
          eSec = WX[arr];
          racconto.push('effetto scala: L' + secSede.L.pos + ' si muove in ' + secSede.arr +
            ', lo stesso ramo da cui parte la mobile, e prosegue lungo di lei fino a ' + arr +
            ': la sede diventa ' + PAR_IT[parDi(WX[arr], palEl)] + ' ' + arr);
        }
        if (!scalaSede && !off('MLPONTEBESTIA')) {
          var tuttiB = (C.suLinea[secSede.L.pos] || []).map(function (Q) { return WX[Q.ramo]; });
          var cur2 = secSede.L.el, usati2 = {}, passi = 0, mosso2 = true;
          while (mosso2) {
            mosso2 = false;
            for (var ib = 0; ib < tuttiB.length; ib++) {
              if (usati2[ib]) continue;
              if (GEN[cur2] === tuttiB[ib]) { cur2 = tuttiB[ib]; usati2[ib] = true; mosso2 = true; passi++; break; }
            }
          }
          if (passi > 0 && GEN[cur2] === WX[secSede.arr]) { eSec = WX[secSede.arr]; pontePassa = true; }
        }
        var eS2 = secSede.L.pos === R.shi ? eSec : elDopoLeBestie(R.linee[R.shi - 1], C);
        var eY2 = secSede.L.pos === R.ying ? eSec : elDopoLeBestie(R.linee[R.ying - 1], C);
        if (pontePassa) racconto.push('la bestia fa da ponte: dal ' + secSede.L.ramo + ' il flusso passa per ' +
          (C.suLinea[secSede.L.pos] || []).map(function (Q) { return Q.ramo; }).join(' e ') + ' e arriva fino a ' + secSede.arr +
          ' (con la bestia sulla linea non c\'è più vuoto)');
        racconto.push('L' + secSede.L.pos + ' (' + (secSede.L.pos === R.shi ? 'lo Shi' : 'la Ying') +
          ') si muove e le bestie se la prendono: da qui la partita è solo fra Shi (' + EL_IT[eS2] +
          ') e Ying (' + EL_IT[eY2] + ')');
        var dSY2 = confrontoDiretto(R, C, eS2, eY2, racconto);
        if (dSY2) return fine(dSY2, 'la sede in movimento presa dalle bestie: solo Shi contro Ying', 'T0y la sede presa si muove');
      }
    }

    // --- T0t: IL B DEL TRIGRAMMA CHE GENERA UNA C ---------------------------------
    // Edu, 11/09/2026 (EURJPY 17/07/2024 seme 172): "L4 rimane attiva ma con la bestia Mao
    // che arriva su L1 si crea un trigono di legno nel trigramma inferiore, il Legno e' B che
    // poi va ad alimentare la bestia di fuoco Wu che pure arriva su L1 e che e' una C. Quando
    // B genera una C la propria squadra vince."
    // Perimetro della carta: un raduno o trigono chiuso DENTRO un trigramma, coi rami delle
    // sue linee e delle bestie che ci cadono sopra; il suo elemento nel palazzo e' B; una
    // bestia che cade su una linea dello stesso trigramma e' una C generata da quell'elemento
    // -> quella squadra vince. Comanda sulla mobile dell'altra parte, che resta attiva.
    // Estensione di Claude, SPENTA: MLBGENC=linea (vale anche una linea C, non solo una bestia).
    if (!off('MLBGENC')) {
      var trigs = [[1, 2, 3], [4, 5, 6]];
      var gruppiT = RADUNI.concat(TRIGONI);
      for (var tb = 0; tb < trigs.length; tb++) {
        var linT = trigs[tb].map(function (p) { return R.linee[p - 1]; }).filter(function (L) { return !annullate[L.pos]; });
        var ramiT = [], bestieT = [];
        linT.forEach(function (L) {
          ramiT.push(L.ramo);
          (C.suLinea[L.pos] || []).forEach(function (Q) { ramiT.push(Q.ramo); bestieT.push(Q); });
        });
        var gB = gruppiT.filter(function (g) {
          return g.every(function (r) { return ramiT.indexOf(r) >= 0; }) && parDi(WX[g[1]], palEl) === 'B';
        })[0];
        if (!gB) continue;
        var elB = WX[gB[1]];
        var cBestia = bestieT.filter(function (Q) { return GEN[elB] === WX[Q.ramo] && parDi(WX[Q.ramo], palEl) === 'C'; })[0];
        var cLinea = ENV.MLBGENC === 'linea' ? linT.filter(function (L) { return GEN[elB] === L.el && L.par === 'C'; })[0] : null;
        if (cBestia || cLinea) {
          var sq = trigs[tb][0] === 1 ? sede(1) : sede(4);
          racconto.push('nel trigramma ' + (tb === 0 ? 'basso' : 'alto') + ' si chiude il raduno ' + gB.join('') +
            ' di ' + EL_IT[elB] + ', che nel palazzo è B, e alimenta ' +
            (cBestia ? 'la bestia ' + cBestia.nome + ' ' + cBestia.stelo + cBestia.ramo : 'L' + cLinea.pos + ' ' + cLinea.ramo) +
            ', che è una C: quando B genera una C la propria squadra vince');
          return fine(sq, 'il B del trigramma ' + (tb === 0 ? 'basso' : 'alto') + ' genera una C: la sua squadra vince',
                      'T0t il B genera la C');
        }
      }
    }

    // --- T0w: LO SCALINO CHE PORTA SU UNA SEDE ------------------------------------
    // Edu, 11/09/2026 (GBPUSD 17/06/2025 seme 135, con la sua carta): "Interessante, ci sono
    // ben due linee che sfruttano l'effetto scala e portano la vittoria su Y."
    // L4 (丑, incompatibile) va in 午 = il ramo della Ying: arriva SULLA Ying. L3 (la mobile)
    // va in 卯 = il nascosto della Ying: arriva anche lei sulla Ying. Chi arriva su una sede
    // le porta la vittoria. Perimetro: l'arrivo di una linea in movimento porta il ramo di una
    // sede o del suo nascosto. Con due arrivi su sedi diverse non si conclude.
    // MLSCALASEDEV=off; MLSCALASEDEV=solovisibile ignora il nascosto.
    if (!off('MLSCALASEDEV')) {
      var arrivi = [];
      if (arr && !passoNullo && !mobileAnnullata) arrivi.push({ p: pos, a: arr });
      (C.seconde || []).forEach(function (X) { if (!annullate[X.L.pos] && X.arr) arrivi.push({ p: X.L.pos, a: X.arr }); });
      // Su EURJPY 28/07/2025 (carta di riferimento) la Ying stessa si muove e arriva sul ramo
      // dello Shi: li' decide la mobile che si occupa di se' (letta da Edu), non lo scalino.
      // Quindi lo scalino porta la vittoria solo quando ad arrivare NON e' l'altra sede.
      // Edu, 11/09/2026 (USDJPY 05/12/2022): "raggiunge G 辰 quindi diventa G 辰. A questo punto
      // si confronta con Y che vince." Quando e' la SEDE a muoversi e ad arrivare sul ramo di
      // un'altra linea, la sede DIVENTA quella linea e si confronta con l'altra sede.
      // Provata in largo, misura peggio (mazzo 51,96%, gradino 262 carte 47,71%): tenuta
      // SPENTA finche' Edu non chiarisce il perimetro. MLSEDEDIVENTA=on per accenderla.
      if (ENV.MLSEDEDIVENTA === 'on') {
        for (var iv = 0; iv < arrivi.length; iv++) {
          var A2 = arrivi[iv];
          if (A2.p !== R.shi && A2.p !== R.ying) continue;
          var bers = R.linee.filter(function (L) {
            return L.pos !== A2.p && !annullate[L.pos] && L.ramo === A2.a; })[0];
          if (!bers) continue;
          var altra2 = A2.p === R.shi ? R.ying : R.shi;
          var lAlt = R.linee[altra2 - 1], eAlt = elDopoLeBestie(lAlt, C);
          if (eAlt !== lAlt.el && !(C.suLinea[altra2] || []).some(function (Q) { return Q.possiede; })) eAlt = lAlt.el;
          racconto.push('L' + A2.p + ' (' + (A2.p === R.shi ? 'lo Shi' : 'la Ying') + ') si muove e raggiunge ' +
            PAR_IT[bers.par] + ' ' + A2.a + ' di L' + bers.pos + ': diventa ' + PAR_IT[bers.par] + ' ' + A2.a);
          var dDv = confrontoDiretto(R, C, A2.p === R.shi ? WX[A2.a] : eAlt, A2.p === R.shi ? eAlt : WX[A2.a], racconto);
          if (dDv) return fine(dDv, 'la sede che si muove diventa ' + PAR_IT[bers.par] + ' ' + A2.a +
                               ' e si confronta con l\'altra', 'T0v la sede diventa la linea raggiunta');
        }
      }
      var suSede = [];
      arrivi = arrivi.filter(function (A) { return A.p !== R.shi && A.p !== R.ying; });
      // Se la sede se ne sta andando (e' lei la mobile, o e' incompatibile e si muove), non e'
      // piu' nella sua casella: lo scalino non le porta niente (USDJPY 05/12/2022, Edu).
      [R.shi, R.ying].forEach(function (sp) {
        if (sp === pos || (C.seconde || []).some(function (X) { return X.L.pos === sp && !annullate[sp]; })) return;
        var L0 = R.linee[sp - 1], fu = L0.fushen && L0.fushen.ramo;
        arrivi.forEach(function (A) {
          if (A.p === sp) return;
          if (A.a === L0.ramo || (ENV.MLSCALASEDEV !== 'solovisibile' && fu && A.a === fu))
            suSede.push({ sp: sp, A: A, dove: A.a === L0.ramo ? 'il suo ramo' : 'il suo nascosto' });
        });
      });
      if (suSede.length && suSede.every(function (X) { return X.sp === suSede[0].sp; })) {
        var spW = suSede[0].sp;
        racconto.push(suSede.map(function (X) { return 'L' + X.A.p + ' arriva in ' + X.A.a; }).join(' e ') +
          ': ' + (suSede.length > 1 ? 'due linee arrivano' : 'il movimento arriva') + ' su ' +
          (spW === R.shi ? 'lo Shi' : 'la Ying') + ' (' + suSede.map(function (X) { return X.dove; }).join(' e ') +
          ') — chi arriva su una sede le porta la vittoria');
        return fine(sede(spW), 'lo scalino porta su ' + (spW === R.shi ? 'lo Shi' : 'la Ying') + ': vince quella sede',
                    'T0w lo scalino porta su una sede');
      }
    }

    // --- T0u: IL TRIGONO CHIUSO DENTRO UN TRIGRAMMA -------------------------------
    // Edu, 11/09/2026 (USDJPY 12/01/2023 seme 131): "un trigono di metallo si forma nel
    // trigramma superiore. Il metallo e' P che fa perdere la propria squadra."
    // Il trigramma alto e' 酉 (L6) + 亥 (L5) + 丑 (L4): con L6 che va in 寅 e L4 (丑 in 坤,
    // incompatibile) che va in 戌, restano in gioco 酉, 丑 e il 巳 — no: il trigono e'
    // 巳酉丑 coi rami del trigramma e degli arrivi. Perimetro cablato: dentro UN trigramma,
    // rami delle sue tre linee PIU' gli arrivi delle linee che si muovono in quel trigramma;
    // se chiudono un trigono (三合) il suo carattere nel palazzo parla per quella squadra:
    // P o B -> quella sede perde; G o W -> vince. MLTRIGTRIG=off.
    // Su EURJPY 10/08/2023 (letta da Edu) il trigono 亥卯未 si chiude nel basso solo contando
    // una linea ferma non toccata, e li' decide il flusso della sede in movimento: serve
    // almeno UNA linea in movimento fra i portatori del trigono (qui L6 e L4 lo sono).
    if (!off('MLTRIGTRIG')) {
      var arrDi = {};
      arrDi[pos] = arr;
      (C.seconde || []).forEach(function (X) { if (!annullate[X.L.pos]) arrDi[X.L.pos] = X.arr; });
      var trigsU = [[1, 2, 3], [4, 5, 6]];
      for (var tu = 0; tu < trigsU.length; tu++) {
        var ramiU = [];
        trigsU[tu].forEach(function (p3) {
          if (annullate[p3]) return;
          ramiU.push(R.linee[p3 - 1].ramo);
          if (arrDi[p3]) ramiU.push(arrDi[p3]);
        });
        var triU = TRIGONI.filter(function (g) {
          if (!g.every(function (r) { return ramiU.indexOf(r) >= 0; })) return false;
          return trigsU[tu].some(function (p3) {
            if (annullate[p3] || !arrDi[p3]) return false;
            return g.indexOf(R.linee[p3 - 1].ramo) >= 0 || g.indexOf(arrDi[p3]) >= 0;
          });
        })[0];
        if (!triU) continue;
        var elU = WX[triU[1]], parU = parDi(elU, palEl), posU = trigsU[tu][0];
        var dU = dirDelCarattere(parU, posU);
        if (!dU) continue;
        racconto.push('nel trigramma ' + (tu === 0 ? 'basso' : 'alto') + ' si chiude il trigono ' + triU.join('') +
          ' di ' + EL_IT[elU] + ', che nel palazzo è ' + PAR_IT[parU] + ': ' +
          (parU === 'P' || parU === 'B' ? 'fa perdere la propria squadra' : 'fa vincere la propria squadra'));
        return fine(dU, 'il trigono chiuso nel trigramma ' + (tu === 0 ? 'basso' : 'alto') + ': parla il ' + PAR_IT[parU],
                    'T0u il trigono nel trigramma');
      }
    }

    // --- T0g3: LA MOBILE CHE SI FA GENERARE INDIETRO ------------------------------
    // Edu, 14/09/2026 (GBPUSD 25/09/2024 seme 134): "L1 fa vincere la propria squadra." La
    // mobile C 寅 va in 子, che la genera: nutrita, fa vincere la sua squadra (SHORT +104), e
    // viene prima della sede penalizzata all'arrivo. Il clash dell'arrivo di una seconda
    // sull'arrivo della mobile (L4 -> 午 su 子) non la ferma. POSIZIONE: dopo la scala, il
    // trigono, il B che genera la C (carte di Edu 02/08/2022, 17/07/2024, 06/02/2025), prima
    // della penalita' sull'arrivo. C nutrita -> vince; W/G -> vince; P/B -> perde.
    // MLGENINDIETROMOB=off.
    // Gemella USDJPY 05/12/2022 (stesso esagramma, stessa mobile 寅 -> 子): li' Edu legge lo Shi
    // penalizzato (LONG). La differenza: li' la mobile ha sopra due bestie (giorno 辰 e anno
    // 寅, che e' del suo stesso elemento e quindi AGISCE) che se la prendono; qui le due bestie
    // (giorno 辰, mese 酉) non la aiutano e non agiscono. Quindi: la mobile presa da una bestia
    // che agisce non decide per se'.
    if (!off('MLGENINDIETROMOB') && arr && !mobileAnnullata && !R.mutante.movimentoNullo &&
        pos !== R.shi && pos !== R.ying && GEN[WX[arr]] === WX[dep] &&
        !(C.suLinea[pos] || []).some(function (Q) { return Q.agisce !== false && Q.possiede; })) {
      var parG3 = mob.par, dG3 = parG3 === 'C' ? sede(pos) : dirDelCarattere(parG3, pos);
      racconto.push('la mobile L' + pos + ' ' + PAR_IT[parG3] + ' ' + dep + ' va in ' + arr + ', che la genera indietro (' +
        EL_IT[WX[arr]] + ' -> ' + EL_IT[WX[dep]] + '): nutrita, ' + (parG3 === 'C' ? 'fa vincere la propria squadra' : 'parla il suo ' + PAR_IT[parG3]));
      if (dG3) return fine(dG3, 'la mobile generata indietro: ' + (parG3 === 'C' ? 'la sua squadra vince' : 'parla il suo ' + PAR_IT[parG3]),
                           'T0g3 la mobile generata indietro');
    }

    // --- T0h: IL G CHE SI MUOVE E RAGGIUNGE UNA SEDE -----------------------------
    // Edu, 14/09/2026 (GBPUSD 02/08/2022 seme 122): "L2 G moves to reach S. Short."
    // L2, la ferma incompatibile 卯 G, si muove e arriva in 丑, che e' il ramo dello Shi: lo
    // raggiunge e gli porta il suo G, e il G fa vincere la sede che raggiunge. "Raggiungere"
    // qui e' l'arrivo che porta lo STESSO RAMO della linea della sede, non una combinazione
    // (quella e' T0k2, dove pero' a muoversi e' la sede). Solo G: la W non e' ancora provata
    // da nessuna carta. MLGRAGGIUNGE=off.
    if (!off('MLGRAGGIUNGE')) {
      var mosseG = [];
      if (arr && !mobileAnnullata && !passoNullo && pos !== R.shi && pos !== R.ying &&
          ENV.MLGRAGGIUNGE !== 'seconda')
        mosseG.push({ L: R.linee[pos - 1], a: arr });
      (C.seconde || []).forEach(function (X) {
        if (!annullate[X.L.pos] && X.arr && X.L.pos !== R.shi && X.L.pos !== R.ying) mosseG.push({ L: X.L, a: X.arr });
      });
      for (var ig = 0; ig < mosseG.length; ig++) {
        var MG = mosseG[ig];
        if (MG.L.par !== 'G') continue;
        // Edu, 15/09/2026 (USDJPY 05/12/2022): "L4 goes into void." L4 G 丑 arriva in 午, il
        // ramo dello Shi, ma 午 e' nel vuoto del giorno: il G va nel vuoto e non raggiunge nessuno.
        if ((R.vuoti || []).indexOf(MG.a) >= 0) {
          racconto.push('L' + MG.L.pos + ' G ' + MG.L.ramo + ' si muove in ' + MG.a + ', ma ' + MG.a +
            ' è nel vuoto: va nel vuoto e non raggiunge nessuno');
          continue;
        }
        var sedeRagg = [R.shi, R.ying].map(function (p) { return R.linee[p - 1]; })
          .filter(function (L) { return L && !annullate[L.pos] && L.pos !== MG.L.pos && L.ramo === MG.a; })[0];
        if (sedeRagg) {
          racconto.push('L' + MG.L.pos + ' G ' + MG.L.ramo + ' si muove e arriva in ' + MG.a +
            ', il ramo di L' + sedeRagg.pos + ' (' + (sedeRagg.pos === R.shi ? 'lo Shi' : 'la Ying') +
            '): la raggiunge e le porta il suo G, che fa vincere la sede raggiunta');
          return fine(sede(sedeRagg.pos), 'il G si muove e raggiunge L' + sedeRagg.pos + ': quella sede vince',
                      'T0h il G raggiunge una sede');
        }
      }
    }

    // --- T0i: LA DATA PENALIZZA L'ARRIVO DELLA SEDE CHE SI MUOVE ------------------
    // Edu, 14/09/2026 (USDJPY 05/12/2022 seme 134): "L3 non puo' portare W su Y non solo
    // perche' Y e' gia' combinata ma anche perche' il giorno penalizza l'arrivo di Shi. La
    // penalita' si riflette sulla sede Shi che non puo' vincere." Lo Shi 午 va in 辰 e il giorno
    // 辰 lo penalizza (辰辰 autopenalita'). Perimetro: una sede che si muove (mobile o ferma
    // incompatibile) il cui arrivo e' penalizzato da un ramo della data -> quella sede non
    // puo' vincere: vince l'altra. MLPENARRIVO=off.
    var bloccateDaPen = null;
    if (!off('MLPENARRIVO')) {
      var sediMosse = [];
      if (arr && (pos === R.shi || pos === R.ying) && !mobileAnnullata) sediMosse.push({ p: pos, a: arr, d: dep });
      (C.seconde || []).forEach(function (X) {
        if (!annullate[X.L.pos] && X.arr && (X.L.pos === R.shi || X.L.pos === R.ying)) sediMosse.push({ p: X.L.pos, a: X.arr, d: X.dep });
      });
      for (var ip = 0; ip < sediMosse.length; ip++) {
        var SM = sediMosse[ip];
        // Perimetro della carta: e' il GIORNO che penalizza l'arrivo. Su EURJPY 11/07/2024
        // (carta di Edu) l'arrivo 辰 dello Shi e' penalizzato dall'ANNO 辰 e li' Edu legge il
        // confronto con la Ying presa dalle bestie: con tutta la data la carta si rompeva.
        // MLPENARRIVO=data per contare tutti i rami.
        var ramiPen = ENV.MLPENARRIVO === 'data' ? C.ramiData : (C.D ? [C.D] : []);
        var penR = ramiPen.filter(function (r) {
          if (r === SM.a) return !!AUTOPEN[r];
          if (XING[r] !== SM.a) return false;
          if (r === '巳' && SM.a === '申') return C.ramiData.indexOf('寅') >= 0;
          return true;
        })[0];
        // Edu, 14/09/2026 (GBPUSD 09/03/2026): "L2 e L4 sono bloccate dall'autopenalita' di 午"
        // — quando la penalita' del giorno sull'arrivo colpisce PIU' linee che arrivano sullo
        // stesso ramo, il movimento e' bloccato per tutte e la carta si legge con le linee che
        // restano (qui L6 svegliata dal mese). MLPENBLOCCA=off.
        if (penR && !off('MLPENBLOCCA')) {
          var altreSulloStesso = [];
          if (arr === SM.a && pos !== SM.p && !mobileAnnullata) altreSulloStesso.push(pos);
          (C.seconde || []).forEach(function (X) { if (X.L.pos !== SM.p && X.arr === SM.a && !annullate[X.L.pos]) altreSulloStesso.push(X.L.pos); });
          if (altreSulloStesso.length) {
            racconto.push('L' + SM.p + ' e L' + altreSulloStesso.join(', L') + ' arrivano tutte in ' + SM.a +
              ', che il giorno penalizza (' + penR + '): sono bloccate, il movimento non c\'è');
            bloccateDaPen = [SM.p].concat(altreSulloStesso);
            bloccateDaPen.forEach(function (bp) { if (bp === pos) mobileAnnullata = true; else annullate[bp] = true; });
            break;
          }
        }
        // Edu, 14/09/2026 (GBPUSD 05/03/2025 seme 127): "S si muove per essere controllata
        // indietro ma il giorno penalizza quindi il controllo indietro non funziona."
        // Quando il movimento della sede e' un controllo indietro (l'arrivo controlla la
        // partenza), la penalita' della data NON condanna la sede: uccide il controllo
        // indietro. La sede resta se' stessa e la lettura prosegue. MLPENINDIETRO=off.
        if (penR && !off('MLPENINDIETRO') && SM.d && KE[WX[SM.a]] === WX[SM.d]) {
          racconto.push('L' + SM.p + ' (' + (SM.p === R.shi ? 'lo Shi' : 'la Ying') + ') si muove in ' + SM.a +
            ' per essere controllata indietro, ma la data penalizza l\'arrivo (' + penR + ' su ' + SM.a +
            '): il controllo indietro non funziona e la sede resta sé stessa');
          continue;
        }
        // Edu, 14/09/2026 (USDCHF 28/02/2022 seme 92): "Y cannot advance and yet Yin is the
        // strongest line of the hexagram. Y controls S, short."
        // Se il passo e' nullo la sede non avanza, ma resta dov'e': se la sua linea e' la PIU'
        // FORTE della carta e controlla la linea dell'altra sede, vince lei. La penalita' della
        // data sull'arrivo non la condanna, perche' l'arrivo non e' mai nato. MLFORTECONTROLLA=off.
        if (penR && !off('MLFORTECONTROLLA') && SM.p === pos && passoNullo) {
          var Lme = R.linee[SM.p - 1], Lalt = R.linee[(SM.p === R.shi ? R.ying : R.shi) - 1];
          var fMe = forza(Lme.el, Lme, R, C);
          var soloIo = R.linee.every(function (L) {
            return L.pos === Lme.pos || annullate[L.pos] || forza(L.el, L, R, C) < fMe;
          });
          if (soloIo && Lalt && KE[Lme.el] === Lalt.el) {
            racconto.push('L' + SM.p + ' (' + (SM.p === R.shi ? 'lo Shi' : 'la Ying') + ') non può avanzare, ' +
              'ma ' + Lme.ramo + ' è la linea più forte della carta e controlla ' + Lalt.ramo +
              ', la linea dell\'altra sede: vince lei');
            return fine(sede(SM.p), 'la sede non avanza ma è la linea più forte e controlla l\'altra sede',
                        'T0i la più forte controlla l\'altra sede');
          }
        }
        // Edu, 15/09/2026 (AUDUSD 21/11/2022 seme 66): "Both lines go nowhere as they both
        // make their side to lose. Beasts didn't help. S vs Y: S wins. Short."
        // La data penalizza l'arrivo dello Shi 卯 -> 巳: lo Shi non parte e resta 卯 G. Le altre
        // due linee che si muovono (L1 P, L4 B) fanno perdere la propria squadra tutte e due,
        // quindi non vanno da nessuna parte. Restano le due sedi come stanno, con le bestie se
        // portano vantaggio: confronto diretto (la Ying Acqua genera lo Shi Legno: vince lo
        // Shi). Perimetro: tutte le altre linee in movimento sono P o B. MLPENCONFRONTO=off.
        if (penR && !off('MLPENCONFRONTO')) {
          var altreMosse = [];
          if (arr && !mobileAnnullata && pos !== R.shi && pos !== R.ying) altreMosse.push(R.linee[pos - 1]);
          (C.seconde || []).forEach(function (X) {
            if (!annullate[X.L.pos] && X.arr && X.L.pos !== R.shi && X.L.pos !== R.ying) altreMosse.push(X.L);
          });
          var tuttePB = altreMosse.length > 0 && altreMosse.every(function (L) { return L.par === 'P' || L.par === 'B'; });
          if (tuttePB) {
            racconto.push('L' + SM.p + ' (' + (SM.p === R.shi ? 'lo Shi' : 'la Ying') + ') si muove in ' + SM.a +
              ', ma la data lo penalizza (' + penR + ' su ' + SM.a + '): non parte e resta ' + R.linee[SM.p - 1].ramo);
            racconto.push('le altre linee in movimento (' + altreMosse.map(function (L) { return 'L' + L.pos + ' ' + PAR_IT[L.par]; }).join(', ') +
              ') fanno perdere la propria squadra: non vanno da nessuna parte');
            var lS9 = R.linee[R.shi - 1], lY9 = R.linee[R.ying - 1];
            var dConf = confrontoDiretto(R, C, elDopoLeBestie(lS9, C), elDopoLeBestie(lY9, C), racconto);
            if (dConf) return fine(dConf, 'la sede penalizzata resta sé stessa: confronto diretto fra le due sedi',
                                   'T0i sede penalizzata: confronto diretto');
          }
        }
        // Edu, 15/09/2026 (NZDUSD 10/03/2020 seme 63): "L3 cannot move into a G because of the
        // penalty from the day. L2 P is clashed by the day to retreat. A retreating P wins its
        // side: short." La sede penalizzata non parte; una P ferma clashata dal giorno si muove
        // nel buio (暗動) e, se il suo arrivo e' il passo indietro (退神), il malus si ritira e la
        // sua squadra vince. Solo P (la B non e' provata). MLPENRITIRO=off.
        if (penR && !off('MLPENRITIRO') && R.anDong) {
          var pRit = R.linee.filter(function (L) {
            return L.par === 'P' && L.pos !== R.shi && L.pos !== R.ying && !annullate[L.pos] &&
                   R.anDong[L.pos] && R.anDong[L.pos].arr === RETRO[L.ramo] &&
                   // Edu, 15/09/2026: "e' ovvio che il vuoto non fa retrocedere la linea" —
                   // se il passo indietro cade nel vuoto del giorno, la P non si ritira.
                   !C.vuoto(R.anDong[L.pos].arr) &&
                   // Edu, 15/09/2026 (USDCAD 04/01/2021): "L2 viene spazzata via da tre 子 nella
                   // data": clashata da tre rami della data la P non si ritira, e' spazzata via.
                   C.ramiData.filter(function (r) { return CLASH[r] === L.ramo; }).length < 3;
          })[0];
          if (pRit) {
            racconto.push('L' + SM.p + ' (' + (SM.p === R.shi ? 'lo Shi' : 'la Ying') + ') si muove in ' + SM.a +
              ', ma la data lo penalizza (' + penR + ' su ' + SM.a + '): non parte e resta ' + R.linee[SM.p - 1].ramo);
            racconto.push('L' + pRit.pos + ' P ' + pRit.ramo + ' è clashata dal giorno e si muove nel buio in ' +
              R.anDong[pRit.pos].arr + ': è un passo indietro, la P si ritira e la sua squadra vince');
            return fine(sede(pRit.pos), 'la sede penalizzata non parte; la P clashata dal giorno si ritira e vince la sua squadra',
                        'T0i la P che si ritira');
          }
        }
        if (penR && !bloccateDaPen) {
          var altraP = SM.p === R.shi ? R.ying : R.shi;
          racconto.push('L' + SM.p + ' (' + (SM.p === R.shi ? 'lo Shi' : 'la Ying') + ') si muove in ' + SM.a +
            ', ma la data lo penalizza (' + penR + ' su ' + SM.a + '): la penalità si riflette sulla sede, che non può vincere');
          // Edu, 14/09/2026 (USDJPY 06/09/2022): "Y non puo' vincere perche' e' vuoto." Se
          // l'altra sede e' vuota (e nessuna bestia che agisce le toglie il vuoto), non puo'
          // vincere nemmeno lei: prevale la sede penalizzata. MLPENVUOTA=off.
          if (!off('MLPENVUOTA') && vuotaL(R.linee[altraP - 1], C, R)) {
            // Edu, 14/09/2026: "Se nessuno vince, alla fine vince la piu' forte, che nel nostro
            // caso e' L5 申. E' molto vibrante ed e' citata dal clash con l'anno." Nessuna delle
            // due sedi puo' vincere: si cerca la linea PIU' FORTE della carta (di stagione, sul
            // ramo del mese o del giorno, citata da un clash della data) e vince la sua squadra.
            // MLPENVUOTA=penalizzata: prevale la sede penalizzata (prima versione).
            racconto.push('ma ' + (altraP === R.shi ? 'lo Shi' : 'la Ying') + ' ' + R.linee[altraP - 1].ramo +
              ' è vuota e non può vincere nemmeno lei');
            if (ENV.MLPENVUOTA === 'penalizzata')
              return fine(sede(SM.p), 'la sede penalizzata contro una sede vuota: vince la penalizzata',
                          'T0i la sede penalizzata contro la vuota');
            var cand = R.linee.filter(function (L) { return L.pos !== SM.p && L.pos !== altraP && !annullate[L.pos] && !vuotaL(L, C, R); });
            var punt = function (L) {
              var f = PESO_STAGIONE[C.stagione(L.el)] || 0;
              if (L.ramo === R.monthBranch) f += 2;
              if (C.D && L.ramo === C.D) f += 1;
              C.ramiData.forEach(function (r) { if (CLASH[r] === L.ramo) f += 1; });
              return f;
            };
            cand.sort(function (a, b) { return punt(b) - punt(a); });
            if (cand.length && (cand.length === 1 || punt(cand[0]) > punt(cand[1]))) {
              var Lf = cand[0], cit = C.ramiData.filter(function (r) { return CLASH[r] === Lf.ramo; });
              racconto.push('nessuno vince: alla fine vince la più forte, L' + Lf.pos + ' ' + PAR_IT[Lf.par] + ' ' + Lf.ramo +
                (C.timely(Lf.el) ? ', di stagione' : '') + (Lf.ramo === R.monthBranch ? ', sul ramo del mese' : '') +
                (cit.length ? ', citata dal clash con ' + cit.join('') : '') + ': vince la sua squadra');
              return fine(sede(Lf.pos), 'nessuna sede vince: decide la linea più forte, L' + Lf.pos,
                          'T0i nessuno vince: la più forte');
            }
          }
          // Edu, S47 (14-15/09/2026), cinque carte su cinque: la penalita' della data
          // sull'arrivo e' la MORTE DEL MOVIMENTO, non la condanna della sede. La sede non
          // parte e resta se' stessa; la lettura prosegue (altre mobili, bestie, S vs Y, la
          // piu' forte). MLPENCONDANNA=on ripristina la vecchia condanna.
          if (ENV.MLPENCONDANNA === 'on')
            return fine(opposto(sede(SM.p)), 'la data penalizza l\'arrivo della sede che si muove: quella sede non può vincere',
                      'T0i la data penalizza l\'arrivo della sede');
          racconto.push('la penalità della data uccide il movimento: L' + SM.p + ' non parte e resta ' +
            R.linee[SM.p - 1].ramo + ' ' + PAR_IT[R.linee[SM.p - 1].par]);
          if (SM.p === pos) { passoNullo = true; arrMorto = true; }
          (C.seconde || []).forEach(function (X) { if (X.L.pos === SM.p) X.arr = null; });
          continue;
        }
      }
    }

    // --- T0v: IL MALUS DELLA SEDE VA NEL VUOTO --------------------------------------
    // Edu, 15/09/2026 (USDJPY 17/01/2024 seme 147): "L4 move into void means upper trigram
    // cannot lose." Lo Shi e' un B (fa perdere la propria squadra) e si muove in un arrivo
    // nel vuoto: il suo malus va nel vuoto, e la sua squadra non puo' perdere -> vince.
    // Perimetro: la sede e' P o B, e' la mobile, e il suo arrivo e' nel vuoto del giorno.
    // MLMALUSVUOTO=off.
    // Con lo stato del movimento (T0m): la sede invalidata nel vuoto E' il malus che se ne va.
    if (!off('MLMALUSVUOTO') && arr && (!mobileAnnullata || statoMob === 'invalidata') && (pos === R.shi || pos === R.ying) &&
        (mob.par === 'P' || mob.par === 'B') && C.vuoto(arr) &&
        // EURUSD 11/03/2022 (Edu): se il giorno clasha la PARTENZA la linea non si muove affatto
        // ("cannot move because of the clash") e niente va nel vuoto: quella resta se' stessa.
        !(C.D && CLASH[C.D] === dep) &&
        // USDCAD 16/03/2020 (Claude col metodo, da validare): se l'arrivo nel vuoto e' un PASSO
        // INDIETRO, "il vuoto non fa retrocedere la linea" (Edu, 15/09): il malus non se ne va,
        // la P resta sulla sede e fa perdere la propria squadra. Qui vale solo il passo avanti.
        RETRO[dep] !== arr &&
        // EURJPY 23/06/2025 (Claude col metodo, da validare): se una bestia sopra la linea la
        // COMBINA (qui il mese 壬午 sulla Ying 未: 午未合), la linea e' impigliata e non parte:
        // il malus non va nel vuoto, resta e fa perdere. Stessa logica di MLIMPIGLIO col giorno.
        !(C.suLinea[pos] || []).some(function (Q) { return COMBINA[Q.ramo] === dep; })) {
      racconto.push('L' + pos + ' (' + (pos === R.shi ? 'lo Shi' : 'la Ying') + ') è un ' + PAR_IT[mob.par] +
        ' e si muove in ' + arr + ', nel vuoto: il suo malus va nel vuoto e la sua squadra non può perdere');
      return fine(sede(pos), 'il malus della sede va nel vuoto: la sua squadra non può perdere', 'T0v il malus nel vuoto');
    }

    // --- T0n: LA SEDE CHE SI MUOVE RAGGIUNGE UNA LINEA VUOTA ----------------------
    // Edu, 14/09/2026 (GBPUSD 05/03/2025 seme 127): "Y si muove e raggiunge una linea vuota."
    // ESTENSIONE DI CLAUDE, SPENTA. Edu ha poi precisato: "Anche se non fosse vuota sarebbe
    // una B che farebbe comunque perdere Ying" — su quella carta la linea raggiunta e' un B,
    // quindi la carta NON dimostra che sia il VUOTO a far perdere la sede: basta il carattere
    // della linea raggiunta (T0k). Serve una carta in cui la vuota raggiunta sia una W o una G
    // per decidere. Misura da spenta a accesa: pip 14.630 -> 14.114, mazzo 52,58% -> 52,59%.
    // MLSEDEVUOTA=on per accenderla.
    if (ENV.MLSEDEVUOTA === 'on') {
      var sediV = [];
      if (arr && (pos === R.shi || pos === R.ying) && !mobileAnnullata) sediV.push({ p: pos, a: arr });
      (C.seconde || []).forEach(function (X) {
        if (!annullate[X.L.pos] && X.arr && (X.L.pos === R.shi || X.L.pos === R.ying)) sediV.push({ p: X.L.pos, a: X.arr });
      });
      for (var iv = 0; iv < sediV.length; iv++) {
        var SV = sediV[iv];
        var vuotaRagg = R.linee.filter(function (L) {
          return L.pos !== SV.p && !annullate[L.pos] && COMBINA[SV.a] === L.ramo &&
                 vuotaL(L, C, R) && L.stato === 'dormiente';
        })[0];
        if (vuotaRagg) {
          racconto.push('L' + SV.p + ' (' + (SV.p === R.shi ? 'lo Shi' : 'la Ying') + ') si muove e arriva in ' +
            SV.a + ', che raggiunge L' + vuotaRagg.pos + ' ' + PAR_IT[vuotaRagg.par] + ' ' + vuotaRagg.ramo +
            ', vuota: il movimento non arriva da nessuna parte e chi non vince perde');
          var dSV = opposto(sede(SV.p));
          if (dSV) return fine(dSV, 'la sede si muove e raggiunge una linea vuota: chi non vince perde',
                               'T0n la sede raggiunge una vuota');
        }
      }
    }

    // --- T0r: LE BESTIE SULLA SECONDA MOBILE CHE RETROCEDE ------------------------
    // Edu, 11/09/2026 (EURJPY 15/08/2024 seme 162): "Il trade va long perche' le bestie
    // arrivano su L2 mobile che e' un W che retrocede. Questa indicazione e' piu' forte
    // che la P su L6."
    // Perimetro della carta: una seconda linea in movimento (la ferma incompatibile che
    // diventa mobile), non annullata, su cui cadono DUE o piu' bestie, che e' una W e
    // RETROCEDE (退神) nel futuro comune: porta via il vantaggio, la sua sede perde. Comanda
    // sulla prima mobile. Precisazione di Edu: "Abbiamo gia' detto che una linea
    // incompatibile si muove e si trasforma. L'unica differenza qui e' che le due bestie
    // gli danno piu' energia e fanno uscire dal vuoto l'arrivo" (寅, vuoto nel giorno 辛亥).
    // Estensioni di Claude, SPENTE perche' misurano peggio:
    // MLBESTIESEC=gw (anche il G, per analogia con AUDUSD 22/12/2025: 12 carte 41,7%);
    // MLBESTIESEC=una (basta una bestia, G o W: 57 carte 45,6%).
    if (!off('MLBESTIESEC')) {
      var sostDir = null;
      var RETRO2 = { '卯':'寅', '午':'巳', '酉':'申', '子':'亥', '戌':'未', '未':'辰', '辰':'丑' };
      // S46, USDJPY 19/12/2024 (seme 154): Edu, "Non hai fatto muovere l'incompatibile L2?" —
      // L2 G 卯 in 兌 e' incompatibile, si muove e retrocede in 寅: il G che retrocede su una
      // seconda mobile fa perdere la propria sede, come su AUDUSD 22/12/2025 (confermato da
      // Edu), SENZA bestie sopra. Le bestie servono solo a dare energia / togliere il vuoto
      // all'arrivo (EURJPY 15/08/2024). Default: G o W che retrocede, bestie non richieste.
      // MLBESTIESEC=bestie2 torna alla versione di prima (solo W con due bestie).
      var vecchia = ENV.MLBESTIESEC === 'bestie2';
      var minB = vecchia ? 2 : 0;
      // Edu, 11/09/2026 (EURUSD 03/01/2023 seme 106): "L2 sebbene incompatibile e costretta a
      // muoversi, e' clashata dal giorno e penalizzata dal mese e poiche' se la vede cosi' male,
      // viene sostituita dalla bestia dell'anno Ren Yin." La seconda mobile clashata dal giorno
      // E penalizzata dal mese, con sopra una bestia che non la attacca, e' sostituita da quella
      // bestia: non retrocede piu'. MLSOSTSEC=off.
      var sostituitaSec = function (X) {
        if (off('MLSOSTSEC') || !C.D || !R.monthBranch) return false;
        var rL = X.L.ramo, mB = R.monthBranch;
        var penMese = (mB === rL && { '辰': 1, '午': 1, '酉': 1, '亥': 1 }[rL]) || XING[mB] === rL;
        if (!(CLASH[C.D] === rL && penMese)) return false;
        return (C.suLinea[X.L.pos] || []).some(function (Q) {
          return Q.ramo !== mB && Q.ramo !== C.D && CLASH[Q.ramo] !== rL && KE[WX[Q.ramo]] !== X.L.el;
        });
      };
      var bs = (C.seconde || []).filter(function (X) {
        if (sostituitaSec(X)) {
          // Edu, 11/09/2026: "questo e' il motivo per cui va Short" — sostituita la linea, parla
          // il carattere della bestia che l'ha sostituita, dalla sede di L2.
          var sost = (C.suLinea[X.L.pos] || []).filter(function (Q) {
            return Q.ramo !== R.monthBranch && Q.ramo !== C.D && CLASH[Q.ramo] !== X.L.ramo && KE[WX[Q.ramo]] !== X.L.el;
          })[0];
          var parS = parDi(WX[sost.ramo], palEl), dS9 = dirDelCarattere(parS, X.L.pos);
          racconto.push('L' + X.L.pos + ' è incompatibile e deve muoversi, ma il giorno la clasha e il mese la ' +
            'penalizza: se la vede così male che la bestia ' + sost.nome + ' ' + sost.stelo + sost.ramo +
            ' la sostituisce — parla lei, ' + PAR_IT[parS]);
          if (dS9) { sostDir = { d: dS9, par: parS, pos: X.L.pos, b: sost }; }
          return false;
        }
        var nb = (C.suLinea[X.L.pos] || []).length;
        var vant = X.L.par === 'W' || (X.L.par === 'G' && !vecchia);
        var arrVuoto = C.vuoto(X.arr) && !nb;   // arrivo vuoto senza bestie: il passo non c'e'
        return !annullate[X.L.pos] && nb >= minB && vant && RETRO2[X.L.ramo] === X.arr && !arrVuoto;
      })[0];
      if (bs) {
        var bsB = C.suLinea[bs.L.pos] || [];
        racconto.push('L' + bs.L.pos + ' è incompatibile, si muove e si trasforma: ' + PAR_IT[bs.L.par] + ' ' + bs.L.ramo +
          ' che RETROCEDE in ' + bs.arr +
          (bsB.length ? ' — sopra arrivano ' + bsB.map(function (Q) { return Q.nome + ' ' + Q.stelo + Q.ramo; }).join(' e ') +
            ', che le danno energia' + (C.vuoto(bs.arr) ? ' e fanno uscire l\'arrivo dal vuoto' : '') : '') +
          ': porta via il vantaggio, la sua sede perde');
        return fine(opposto(sede(bs.L.pos)),
          'la seconda mobile: il ' + PAR_IT[bs.L.par] + ' retrocede, la sua sede perde',
          'T0r la seconda che retrocede');
      }
      if (sostDir && !off('MLSOSTPARLA')) {
        return fine(sostDir.d, 'la seconda mobile sostituita dalla bestia: parla il ' + PAR_IT[sostDir.par],
                    'T0q la seconda sostituita dalla bestia');
      }
    }

    // --- T0k2: LA SEDE CHE SI MUOVE E RAGGIUNGE UNA LINEA -------------------------
    // Edu, 11/09/2026 (USDJPY 09/02/2026): "Y si muove per raggiungere L6 B 巳. Vince S.
    // Non c'e' bisogno di usare le bestie." Quando a muoversi e' una SEDE e il suo arrivo
    // combina (六合) una linea FERMA che non e' una sede, la sede ne prende il carattere:
    // G/W -> vince, P/B -> perde. Vale anche se il giorno clasha l'arrivo (la linea resta
    // attiva e non cambia, Edu 15/08/2024).
    // ORDINE (Edu, 14/09/2026): "1. Si cerca di risolvere una carta semplicemente usando le
    // linee mobili. 2. Se c'e' un blocco nel movimento, e non si giunge ad una soluzione, si
    // usano le bestie." Su EURJPY 15/08/2024 la data blocca L2 dal retrocedere (vuoto) e sono
    // le bestie della data su L2 a dare la soluzione: T0r viene prima. Questa viene subito
    // dopo T0r e PRIMA delle regole del possesso (T1, T1b).
    // MLCOMBPRESA=off.
    if (!off('MLCOMBPRESA')) {
      var mosseP = [];
      var vaComunqueP = !!arr && !mobileAnnullata &&
          (!passoNullo || (!off('MLCOMBNULLO') && !!C.D && CLASH[C.D] === arr));
      if (vaComunqueP) mosseP.push({ L: R.linee[pos - 1], a: arr });
      (C.seconde || []).forEach(function (X) { if (!annullate[X.L.pos] && X.arr) mosseP.push({ L: X.L, a: X.arr }); });
      var presa = null;
      mosseP.forEach(function (M) {
        if (presa || (M.L.pos !== R.shi && M.L.pos !== R.ying)) return;
        var bersK = R.linee.filter(function (L) {
          return L.pos !== M.L.pos && L.pos !== R.shi && L.pos !== R.ying &&
                 !annullate[L.pos] && !vuotaL(L, C, R) && COMBINA[M.a] === L.ramo &&
                 !L.isMobile && !(C.seconde || []).some(function (X) { return X.L.pos === L.pos; }); })[0];
        if (bersK) presa = { M: M, L: bersK };
      });
      if (presa) {
        var dP2 = dirDelCarattere(presa.L.par, presa.M.L.pos);
        if (dP2) {
          racconto.push('L' + presa.M.L.pos + ' (' + (presa.M.L.pos === R.shi ? 'lo Shi' : 'la Ying') +
            ') si muove in ' + presa.M.a + ' per raggiungere L' + presa.L.pos + ' ' + PAR_IT[presa.L.par] +
            ' ' + presa.L.ramo + ': ne prende il carattere, ' + PAR_IT[presa.L.par]);
          return fine(dP2, 'la sede raggiunge L' + presa.L.pos + ' e ne prende il ' + PAR_IT[presa.L.par],
                      'T0k la sede raggiunge una linea');
        }
      }
    }

    var beneficio = (mob.par === 'G' || mob.par === 'W');
    // LINEA INCOMPATIBILE (registro, 30/08/2026). Tre coppie in cui il ramo proprio del
    // trigramma CONTROLLA il ramo che ci abita: 卯 in 兌, 午 in 坎, 申 in 艮. Quella linea
    // parte ma non arriva — e senza arrivo non c'e' ne' 進神 ne' 退神: la progressione si
    // azzera. Salvo il PONTE DELLA DATA: se l'elemento in mezzo (Acqua per 卯 in 兌 e per
    // 申 in 艮, Legno per 午 in 坎) e' presente in almeno DUE dei quattro rami della data,
    // il controllo diventa generazione e la linea si muove davvero.
    var quali = R.linee.filter(function (L) { return C.incompDi(L); })
                       .map(function (L) { return 'L' + L.pos + (L.isMobile ? 'M' : 'F'); });
    var inccard = quali.length ? quali.join(',') : null;
    if (process.env.LOG2 && C.seconde.length) {
      var S2 = C.seconde[0], cosa = [];
      if (COMBINA[S2.arr] === dep) cosa.push('combina-partenza');
      if (CLASH[S2.arr] === dep) cosa.push('clasha-partenza');
      if (arr && COMBINA[S2.arr] === arr) cosa.push('combina-arrivo');
      if (arr && CLASH[S2.arr] === arr) cosa.push('clasha-arrivo');
      R.linee.forEach(function (L) {
        if (L.pos === pos || L.pos === S2.L.pos) return;
        if (COMBINA[S2.arr] === L.ramo) cosa.push('combina-L' + L.pos + (L.isShi ? 'S' : L.isYing ? 'Y' : ''));
        if (CLASH[S2.arr] === L.ramo) cosa.push('clasha-L' + L.pos + (L.isShi ? 'S' : L.isYing ? 'Y' : ''));
      });
      console.error('#SEC n' + C.seconde.length + ' L' + S2.L.pos + (S2.L.isShi ? 'S' : S2.L.isYing ? 'Y' : '') +
        ' ' + S2.dep + '>' + S2.arr + ' caso' + S2.caso + ' ' + (cosa.length ? cosa.join(',') : 'niente'));
    }
    // Il secondo arrivo agisce sulla prima mobile come agisce il giorno: se ne combina
    // la partenza la impiglia, se ne combina l'arrivo lo tiene, se lo clasha lo
    // distrugge, se clasha la partenza la blocca (regola delle bestie). Dietro DUEMUT.
    if (incomp) {
      racconto.push('L' + pos + ' è una linea incompatibile — il ramo proprio del suo trigramma ' +
        (incomp.el ? 'controlla' : 'clasha') + ' il ' + dep + ' che ci abita' +
        (incomp.el ? ', e il ponte non regge (' + incomp.ponti + ' ramo di ' + EL_IT[incomp.el] + ' nella data, ne servono due)' : '') +
        '. Non può stare dove sta: essendo già ' +
        'mobile, nessuno la ferma, né un clash né una combinazione');
      passoNullo = false;
    }
    if (!mobileAnnullata && !off('MLPROG') && R.mutante.progressione &&
        (mob.par === 'P' || mob.par === 'B' ||
         (!off('MLPROGBEN') && beneficio && R.mutante.progressione === 'retrocedente'))) {
      if (!off('MLIMPIGLIO') && !incomp && C.D && COMBINA[C.D] === dep) {
        racconto.push('il ramo del giorno ' + C.D + ' combina la partenza ' + dep +
          ': la linea resta impigliata e non parte, quindi non si ritira nulla — il ' +
          PAR_IT[mob.par] + ' resta dov\'è e fa perdere la propria squadra');
        return fine(opposto(sede(pos)),
          'il giorno impiglia la partenza: il ' + PAR_IT[mob.par] + ' non si ritira',
          'T1a il malus impigliato');
      }
      // LA MOBILE CLASHATA ALLA PARTENZA NON SI RITIRA — Edu, 17/09/2026 (S50), carta USDCHF
      // 07/08/2024 seme 85: "L5 non retrocede perche' quando una linea e' mobile ma viene
      // clashata alla partenza non puo' piu' muoversi... L5 non retrocede e fa vincere."
      // Se la mobile e' clashata alla partenza dal giorno ma resta in piedi (il mese la genera,
      // o una bestia compatibile), non si muove affatto: nessuna ritirata, nessuna avanzata.
      // Resta dov'e' col proprio carattere: G/W fanno vincere la propria sede, P/B la fanno
      // perdere. MLCLASHNORITIRO=off torna a leggerla come una ritirata.
      if (!off('MLCLASHNORITIRO') && !incomp && C.D && CLASH[C.D] === dep &&
          (statoMob === 'fermaAttiva' || statoMob === 'fermaInusabile')) {
        var vinceQui = (mob.par === 'G' || mob.par === 'W');
        racconto.push('L' + pos + ' e\' clashata alla partenza dal giorno ' + C.D + ': essendo gia\' mobile non ' +
          'puo\' piu\' muoversi, quindi non si ritira. Resta dov\'e\' col suo ' + PAR_IT[mob.par] +
          ', che fa ' + (vinceQui ? 'vincere' : 'perdere') + ' la propria squadra');
        return fine(vinceQui ? sede(pos) : opposto(sede(pos)),
          'la mobile clashata alla partenza non si ritira: parla il suo ' + PAR_IT[mob.par],
          'T1a la mobile clashata non si ritira');
      }
      var indietro = R.mutante.progressione === 'retrocedente';
      // Solo la RITIRATA, non l'avanzata: la ritirata e' quella che la carta autorizza
      // (EURGBP 18/03/2020) e misura 56,3% su 71 carte. La simmetria sull'avanzata,
      // provata e misurata, fa 28,6% su 28 carte: un G o una W che avanza non fa
      // vincere la propria sede, e finche' non c'e' una carta che spieghi perche',
      // resta fuori.
      // Edu, 16/09/2026 (S49, USDJPY 02/07/2026 seme 162): "il trigono di fuoco che si forma
      // sulla Y (con l'aiuto di y mobile) va a generare S che vince". La W mobile L2 卯 retrocede
      // in 寅; l'arrivo chiude col 午 di mese e anno e col 戌 della Ying il trigono di Fuoco, di
      // stagione: la ritirata non porta via il vantaggio, il trigono si forma sulla sede e genera
      // l'altra sede, che vince (Fuoco -> Shi 丑 Terra, SHORT). Perimetro stretto, quello della
      // carta: G/W che retrocede, non sede; l'arrivo non vuoto chiude un trigono intero con il
      // ramo di UNA sede (non vuota) e un terzo membro fra rami della data o linee non vuote;
      // elemento del trigono di stagione; il trigono GENERA l'elemento dell'altra sede.
      // Se non genera, la regola non dice niente e si prosegue come prima. MLRITIROTRIG=off.
      // Edu, 16/09/2026 (S49, NZDUSD 05/06/2026 seme 58): "Non c'e' bisogno del trigono. Y e' vuoto
      // e non c'e' niente che lo salvi. L2 arriva sul vuoto e si puo' cancellare l'importanza
      // dell'intera linea. [...] Comunque quello che decide e' Y vuoto." Sul mese Gui Si che cade su
      // L2: "Gui acqua da' un po' di energia al legno e Si usa il legno per generare Shi. Vince."
      // E' la regola di Edu del 29/08/2026 ("se Shi o Ying sono vuoti [...] fa perdere
      // immediatamente la parte vuota"), qui nel perimetro della carta: G/W mobile non sede che
      // retrocede in un arrivo nel vuoto; una sede vuota senza bestie che la salvino (vuotaL),
      // l'altra piena -> vince la sede piena. MLRITIROVUOTASEDE=off spegne.
      // Edu, 16/09/2026 (S49, EURJPY 29/07/2026 seme 186): "Hai considerato gli steli? La terra nella
      // data e' cosi' forte che basterebbe anche uno stelo metallo a far vincere. E' cio' che succede
      // con L5 Zi. Long." Confermata da Edu la spiegazione: gli steli 甲乙 -> 丙 -> 己 e i rami 辰未 (Terra)
      // e 午巳 (Fuoco) vanno tutti verso la Terra, mese di Terra; la Terra passa nel Metallo della
      // bestia su L5 (白虎, l'elemento della bestia della linea, regola di NZDUSD 17/06/2025) e il
      // Metallo genera il 子 della W di L5: vince l'alto. Viene prima della Ying vuota.
      // Perimetro della carta: G/W mobile non sede che retrocede; ogni stelo e ogni ramo della data e'
      // l'elemento E o lo precede nella catena di generazione verso E; E e' fra gli steli ed e'
      // l'elemento del mese; una linea G/W non vuota con la bestia dell'elemento generato da E e il
      // ramo dell'elemento generato da quello -> vince la sua squadra. MLDATAPASSA=off spegne.
      if (beneficio && indietro && !off('MLDATAPASSA') && pos !== R.shi && pos !== R.ying &&
          C.pil.length === 4 && R.monthBranch) {
        var BEL = { '青龍':'Wood', '朱雀':'Fire', '勾陳':'Earth', '螣蛇':'Earth', '白虎':'Metal', '玄武':'Water' };
        var eD = WX[R.monthBranch];
        var elData = C.pil.map(function (P) { return STEM_EL[P.stelo]; }).concat(C.pil.map(function (P) { return WX[P.ramo]; }));
        // "verso E" = E stesso o i due elementi che lo precedono (non gli elementi che E genera)
        var precede = function (el) { return el === eD || GEN[el] === eD || GEN[GEN[el]] === eD; };
        if (eD && C.pil.some(function (P) { return STEM_EL[P.stelo] === eD; }) && elData.every(precede)) {
          var ePassa = GEN[eD], eArriva = GEN[ePassa];
          var Lp = R.linee.filter(function (L) {
            return (L.par === 'G' || L.par === 'W') && L.bestia && BEL[L.bestia.cn] === ePassa &&
                   L.el === eArriva && !vuotaL(L, C, R);
          });
          if (Lp.length === 1) {
            racconto.push('gli steli e i rami della data vanno tutti verso la ' + EL_IT[eD] + ', che è anche il mese: ' +
              'la ' + EL_IT[eD] + ' passa nel ' + EL_IT[ePassa] + ' della bestia su L' + Lp[0].pos + ', che genera il ' +
              Lp[0].ramo + ' ' + EL_IT[eArriva] + ' della ' + PAR_IT[Lp[0].par] + ': vince la sua squadra, prima della ritirata e dei vuoti');
            return fine(sede(Lp[0].pos), 'la data passa per la bestia e genera una ' + PAR_IT[Lp[0].par],
              'T1a la data passa per la bestia');
          }
        }
      }
      if (beneficio && indietro && !off('MLRITIROVUOTASEDE') && arr && C.vuoto(arr) &&
          pos !== R.shi && pos !== R.ying) {
        var LsV = R.linee[R.shi - 1], LyV = R.linee[R.ying - 1];
        var sV = LsV && vuotaL(LsV, C, R), yV = LyV && vuotaL(LyV, C, R);
        if (LsV && LyV && sV !== yV) {
          var piena = sV ? LyV : LsV, vuota = sV ? LsV : LyV;
          racconto.push('la mobile è ' + PAR_IT[mob.par] + ' e retrocede in ' + arr + ', che è nel vuoto: la linea si ' +
            'cancella. Decide la ' + (vuota.pos === R.shi ? 'Shi' : 'Ying') + ' vuota, che nessuna bestia salva: vince la ' +
            (piena.pos === R.shi ? 'Shi' : 'Ying'));
          return fine(sede(piena.pos), 'la mobile si ritira nel vuoto e decide la sede vuota: vince l\'altra',
            'T1a la ritirata nel vuoto: decide la sede vuota');
        }
      }
      if (beneficio && indietro && !off('MLRITIROTRIG') && arr && !C.vuoto(arr) &&
          pos !== R.shi && pos !== R.ying) {
        var triR = TRIGONI.filter(function (g) { return g.indexOf(arr) >= 0; })[0];
        if (triR) {
          var elTri = WX[triR[1]];   // l'elemento del trigono e' quello del ramo centrale (子卯午酉)
          var sediT = [R.shi, R.ying];
          for (var sx = 0; sx < 2; sx++) {
            var Ls = R.linee[sediT[sx] - 1], Lo = R.linee[sediT[1 - sx] - 1];
            // S49, EURJPY 17/06/2026 seme 186 (Edu: "La bestia non arriva su Shi, la genera e la fa
            // uscire dal vuoto?"): il vuoto delle sedi si legge con vuotaL (la bestia che arriva e
            // aiuta la linea la toglie dal vuoto); la sede generata deve essere piena. La Ying puo'
            // portare lo stesso ramo dell'arrivo: la mobile che arriva li' la aiuta.
            if (!Ls || !Lo || vuotaL(Ls, C, R) || vuotaL(Lo, C, R) || triR.indexOf(Ls.ramo) < 0) continue;
            var mancanti = triR.filter(function (r) { return r !== arr && r !== Ls.ramo; });
            var dove = mancanti.map(function (t) {
              if (C.ramiData.indexOf(t) >= 0 && !C.vuoto(t)) return 'la data';
              if (R.linee.some(function (L) { return L.pos !== pos && L.pos !== Ls.pos && L.ramo === t && !vuotaL(L, C, R); }))
                return 'una linea';
              return null;
            });
            if (dove.indexOf(null) >= 0 || !C.timely(elTri) || GEN[elTri] !== Lo.el) continue;
            var terzo = mancanti.join(' e '), terzoDove = dove.join(', ');
            racconto.push('la mobile è ' + PAR_IT[mob.par] + ' e retrocede in ' + arr + ', ma l\'arrivo chiude ' +
              'con ' + Ls.ramo + ' della ' + (Ls.pos === R.shi ? 'Shi' : 'Ying') + ' e ' + terzo + ' (' + terzoDove +
              ') il trigono di ' + EL_IT[elTri] + ', di stagione: la ritirata non porta via niente. Il trigono ' +
              'si forma sulla ' + (Ls.pos === R.shi ? 'Shi' : 'Ying') + ' e genera la ' +
              (Lo.pos === R.shi ? 'Shi' : 'Ying') + ' (' + EL_IT[Lo.el] + '), che vince');
            return fine(sede(Lo.pos),
              'il trigono chiuso dalla ritirata si forma su una sede e genera l\'altra, che vince',
              'T1a il trigono della ritirata genera l\'altra sede');
          }
        }
      }
      if (beneficio) {
        racconto.push('la mobile è ' + PAR_IT[mob.par] + ', che è un vantaggio per la propria ' +
          'squadra, e ' + (indietro ? 'RETROCEDE (退神): si ritira e porta via il vantaggio, la sua sede perde'
                                    : 'AVANZA (進神): il vantaggio cresce, la sua sede vince'));
        return fine(indietro ? opposto(sede(pos)) : sede(pos),
          'il ' + PAR_IT[mob.par] + ' mobile ' + (indietro ? 'retrocede: la sua sede perde' : 'avanza: la sua sede vince'),
          'T1a il vantaggio ' + (indietro ? 'retrocede' : 'avanza'));
      }
      // Edu, 15/09/2026: "e' ovvio che il vuoto non fa retrocedere la linea". Il malus che
      // vorrebbe ritirarsi in un arrivo nel vuoto non si ritira: resta dov'e' e fa perdere la
      // propria squadra (USDCAD 16/03/2020, la Ying P 辰 -> 丑 vuoto, esito LONG). MLRITIROVUOTO=off.
      // Edu, 15/09/2026 (USDCAD 16/03/2020): "Y P can retreat because of the beast Geng Zi so it
      // will make its own side to lose." Il vuoto dell'arrivo e' riempito se una bestia sulla
      // linea porta il ramo che COMBINA l'arrivo (l'anno 庚子 sulla Ying: 子 combina 丑): allora la
      // P si ritira; e la SEDE che si ritira fa perdere la propria squadra (MLSEDERITIRA).
      // LETTURA COERENTE CON USDJPY 01/12/2022 (Edu, 09/09: la P della Ying che si ritira
      // 辰 -> 丑 fa VINCERE la sua squadra): la ritirata che SI COMPIE porta via il danno; la
      // ritirata BLOCCATA lascia il danno sulla sede. Qui la bestia sulla linea (庚子) porta il
      // ramo che combina l'arrivo 丑 e lo tiene: la P non si ritira ("Y P can[not] retreat
      // because of the beast Geng Zi"), resta e fa perdere. MLBESTIATIENE=off.
      var tenuto = ENV.MLBESTIATIENE === 'on' && (C.suLinea[pos] || []).some(function (Q) { return Q.agisce !== false && COMBINA[Q.ramo] === arr; });
      if (indietro && tenuto) {
        racconto.push('la mobile è ' + PAR_IT[mob.par] + ' e vorrebbe RETROCEDERE in ' + arr + ', ma la bestia sopra la linea porta il ramo che combina ' +
          arr + ' e lo tiene: non si ritira, resta e fa perdere la propria squadra');
        return fine(opposto(sede(pos)), 'la bestia tiene l\'arrivo: il ' + PAR_IT[mob.par] + ' non si ritira e fa perdere',
                    'T1a la bestia tiene la ritirata');
      }
      // Edu, 15/09/2026 (USDCAD 16/03/2020): "Y P can retreat because of the beast Geng Zi" — il
      // vuoto dell'arrivo e' RIEMPITO da una bestia sulla linea che porta il ramo che combina
      // l'arrivo (子 combina 丑): la ritirata si compie.
      var riempito = (C.suLinea[pos] || []).some(function (Q) { return Q.agisce !== false && COMBINA[Q.ramo] === arr; });
      if (indietro && !off('MLRITIROVUOTO') && C.vuoto(arr) && !riempito) {
        racconto.push('la mobile è ' + PAR_IT[mob.par] + ', un danno per la propria squadra, e vorrebbe RETROCEDERE in ' +
          arr + ', ma ' + arr + ' è nel vuoto: il vuoto non la fa retrocedere, il ' + PAR_IT[mob.par] +
          ' resta dov\'è e fa perdere la propria squadra');
        return fine(opposto(sede(pos)), 'il ' + PAR_IT[mob.par] + ' non può ritirarsi nel vuoto: resta e fa perdere',
                    'T1a il malus non si ritira nel vuoto');
      }
      // MLSEDERITIRA=on: "la sede che si ritira perde" — PROVATA E RITIRATA: contraddice
      // USDJPY 01/12/2022 (carta di riferimento, validata da Edu il 09/09).
      if (indietro && ENV.MLSEDERITIRA === 'on' && (pos === R.shi || pos === R.ying)) {
        racconto.push('la mobile è la ' + (pos === R.shi ? 'Shi' : 'Ying') + ' stessa, ' + PAR_IT[mob.par] +
          ', e RETROCEDE (退神)' + (riempito ? ' — la bestia sopra combina l\'arrivo e riempie il vuoto' : '') +
          ': la sede che si ritira fa perdere la propria squadra');
        return fine(opposto(sede(pos)), 'la sede ' + PAR_IT[mob.par] + ' si ritira: la sua squadra perde',
                    'T1a la sede che si ritira');
      }
      // Edu, 15/09/2026 (USDCAD 16/03/2020): "Y P can retreat because of the beast Geng Zi so it
      // will make its own side to lose" + "ho dimenticato di citare L4, la linea piu' forte".
      // La P della Ying si ritira; ma L4 G 午, sul ramo del giorno e di stagione, e' la linea
      // PIU' FORTE dell'esagramma, sta dall'altra parte ed e' un G: vince la sua squadra. Non
      // tocca USDJPY 01/12/2022 (Edu, 09/09: la stessa ritirata fa vincere la sua sede), dove
      // la piu' forte non sta dall'altra parte. MLRITIROFORTE=off.
      if (indietro && !off('MLRITIROFORTE')) {
        var pf1 = piuForte(R, C, annullate);
        if (pf1 && sede(pf1.L.pos) !== sede(pos) && (pf1.L.par === 'G' || pf1.L.par === 'W')) {
          racconto.push('la mobile è ' + PAR_IT[mob.par] + ' e RETROCEDE (退神), ma dall\'altra parte L' + pf1.L.pos + ' ' +
            PAR_IT[pf1.L.par] + ' ' + pf1.L.ramo + ' è la linea più forte dell\'esagramma' +
            (C.D && pf1.L.ramo === C.D ? ', sul ramo del giorno' : '') + (C.timely(pf1.L.el) ? ', di stagione' : '') +
            ': vince la sua squadra');
          return fine(sede(pf1.L.pos), 'il malus si ritira, ma la più forte è un ' + PAR_IT[pf1.L.par] + ' dall\'altra parte',
                      'T1a la ritirata e la più forte');
        }
      }
      // LA RITIRATA CHE SI COMBINA E SOPPRIME — Edu, 17/09/2026 (S50), carta USDCHF 16/09/2026
      // seme 81 (livello B SHORT, esito LONG -67): "L3 retrocede e si combina con L1 Zi. La B
      // arriva su W e la sopprime. Contemporaneamente L4 e' eccitata dal Clash del giorno. Long".
      // Il B che si ritira non porta via il danno se il suo ARRIVO combina una linea G/W: ci
      // arriva sopra e la sopprime. Se dall'altra parte resta un G/W sveglio — clashato dal
      // giorno (暗動) — vince quella squadra. MLRITIROSOPPRIME=off.
      if (indietro && (mob.par === 'B' || mob.par === 'P') && arr && !off('MLRITIROSOPPRIME')) {
        // PERIMETRO (restrizione di Claude, da validare): la gemella USDJPY 13/12/2023 seme 145
        // ha lo stesso esagramma e la stessa mobile, ma li' il 子 di L1 e' il ramo del MESE e
        // dell'ORA: un G/W che siede su un ramo della data non si lascia sopprimere da una Terra
        // che si ritira, e la carta resta alla ritirata semplice (SHORT, esito -240). Quindi il
        // G/W soppresso non deve portare nessuno dei quattro rami della data.
        // MLRITIROSOPPRIME=largo toglie la restrizione.
        var soppressa = R.linee.filter(function (L) {
          if (L.pos === pos || annullate[L.pos] || COMBINA[arr] !== L.ramo) return false;
          if (L.par !== 'G' && L.par !== 'W') return false;
          if (ENV.MLRITIROSOPPRIME !== 'largo' &&
              (C.ramiData || []).indexOf(L.ramo) >= 0) return false;
          return true;
        })[0];
        if (soppressa) {
          var sveglia = R.linee.filter(function (L) {
            return L.pos !== pos && L.pos !== soppressa.pos && !annullate[L.pos] &&
                   (L.par === 'G' || L.par === 'W') && C.D && CLASH[C.D] === L.ramo;
          })[0];
          if (sveglia) {
            racconto.push('la mobile ' + PAR_IT[mob.par] + ' retrocede in ' + arr + ', che combina L' +
              soppressa.pos + ' ' + PAR_IT[soppressa.par] + ' ' + soppressa.ramo + ': il malus le arriva sopra e la sopprime');
            racconto.push('dall\'altra parte L' + sveglia.pos + ' ' + PAR_IT[sveglia.par] + ' ' + sveglia.ramo +
              ' è eccitata dal clash del giorno ' + C.D + ': resta lei in piedi e vince la sua squadra');
            return fine(sede(sveglia.pos), 'la ritirata combina e sopprime un ' + PAR_IT[soppressa.par] +
              ', resta sveglio il ' + PAR_IT[sveglia.par] + ' di L' + sveglia.pos, 'T1a la ritirata che sopprime');
          }
        }
      }
      racconto.push('la mobile è ' + PAR_IT[mob.par] + ', che è un danno per la propria squadra, e ' +
        (indietro ? 'RETROCEDE (退神): si ritira e porta via il danno, la sua sede vince'
                  : 'AVANZA (進神): il danno cresce, la sua sede perde'));
      return fine(indietro ? sede(pos) : opposto(sede(pos)),
        'il ' + PAR_IT[mob.par] + ' mobile ' + (indietro ? 'retrocede: la sua sede vince' : 'avanza: la sua sede perde'),
        'T1a il malus ' + (indietro ? 'retrocede' : 'avanza'));
    }

    var sostituto = null;
    if (!mobileAnnullata && !off('MLSOST') && C.suLinea[pos]) {
      var cand = C.suLinea[pos];
      for (var i2 = 0; i2 < cand.length && !sostituto; i2++) {
        var P2 = cand[i2];
        if (!P2.possiede) continue;
        if (!passoNullo && R.mutante.casoMut !== 3) continue;
        sostituto = { P: P2, el: WX[P2.ramo], motivo: P2.azione };
      }
    }

    if (sostituto) {
      var parS = parDi(sostituto.el, palEl);
      racconto.push('la bestia del ' + sostituto.P.nome + ' ' + sostituto.P.stelo + sostituto.P.ramo +
        ' cade sulla mobile e ' + sostituto.motivo + ': si impadronisce della linea e ne prende la sede, ' +
        sostituto.P.ramo + ' ' + EL_IT[sostituto.el] + ' che nel palazzo è ' + PAR_IT[parS]);

      if (!off('MLPOSSESSO') && (pos === R.shi || pos === R.ying)) {
        var altra = pos === R.shi ? R.ying : R.shi;
        var pilAltra = (C.suLinea[altra] || []).filter(function (Q) { return Q.possiede; });
        if (pilAltra.length) {
          var elQui = sostituto.el, elLa = elDopoLeBestie(R.linee[altra - 1], C);
          racconto.push('anche l\'altra sede è posseduta, dal ' + pilAltra[0].nome + ' ' +
            pilAltra[0].stelo + pilAltra[0].ramo);
          var d0 = confrontoDiretto(R, C,
            pos === R.shi ? elQui : elLa, pos === R.ying ? elQui : elLa, racconto);
          if (d0) return fine(d0, 'confronto diretto fra le due sedi possedute', 'T1b confronto diretto');
        }
      }

      var dS = dirDelCarattere(parS, pos);
      if (dS) return fine(dS, 'la bestia del ' + sostituto.P.nome + ' prende la sede e parla da ' + PAR_IT[parS],
                          'T1 sostituzione');
      racconto.push('la bestia che ha preso la sede è un C: tace, si cerca un\'altra traccia');
      mobileAnnullata = true;
    }

    if (!mobileAnnullata && !off('MLINDIETRO') && (pos === R.shi || pos === R.ying) &&
        arrEl && depEl && KE[arrEl] === depEl && C.timely(arrEl) && !passoNullo) {
      var parA = parDi(arrEl, palEl);
      racconto.push('prima di occuparsi d\'altro la mobile si occupa di sé stessa: l\'arrivo ' +
        arr + ' ' + EL_IT[arrEl] + ', forte di stagione, controlla indietro la partenza e la elimina');
      var elQuesta = arrEl, parQuesta = parA;
      var fu = mob.fushen;
      if (!off('MLFUSHEN') && fu && (COMBINA[arr] === fu.b || GEN[arrEl] === fu.el)) {
        elQuesta = fu.el; parQuesta = fu.par;
        racconto.push('sotto quella linea c\'era un ' + PAR_IT[fu.par] + ' nascosto, ' + fu.b + ' ' +
          EL_IT[fu.el] + ': l\'arrivo lo ' + (COMBINA[arr] === fu.b ? 'combina' : 'genera') +
          ' e lo tira fuori, e il nascosto prende il posto rimasto vuoto');
      }
      var altra2 = pos === R.shi ? R.ying : R.shi;
      var lAltra2 = R.linee[altra2 - 1];
      var d1 = confrontoDiretto(R, C,
        pos === R.shi ? elQuesta : lAltra2.el, pos === R.ying ? elQuesta : lAltra2.el, racconto, true);
      if (d1) return fine(d1, 'la mobile Shi/Ying è eliminata dal proprio arrivo e si confrontano le sedi',
                          'T2 si occupa di sé');
      var d1b = dirDelCarattere(parQuesta, pos);
      if (d1b) return fine(d1b, 'la sede resta ' + PAR_IT[parQuesta], 'T2 si occupa di sé');
    }

    // Col futuro comune l'arrivo della mobile puo' cambiare: il 回頭生 si ricalcola sull'arrivo vero
    // (USDJPY 05/12/2022, Edu: "L1: moves to generate back" — 寅 -> 子 col futuro comune, non 巳).
    if (!mobileAnnullata && !off('MLNUTRITA') && (R.mutante.casoMut === 1 || (arr !== R.mutante.ramoArr && arrEl && GEN[arrEl] === depEl)) && !passoNullo) {
      racconto.push('l\'arrivo ' + arr + ' ' + EL_IT[arrEl] + ' torna indietro e nutre la partenza ' +
        dep + ' ' + EL_IT[depEl] + ': la mobile si occupa di sé stessa e non può fare altro — resta ' +
        PAR_IT[mob.par] + ', rinforzata');
      var parArr = parDi(arrEl, palEl);
      if (!off('MLTOMBA') && (parArr === 'P' || parArr === 'B') && TOMBA[arrEl] === dep) {
        racconto.push('ma tornando indietro il ' + PAR_IT[parArr] + ' ' + arr + ' entra nella propria ' +
          'tomba (' + dep + ' è la tomba di ' + EL_IT[arrEl] + '): sepolto non fa più perdere la ' +
          'propria squadra, quindi la sua sede vince');
        return fine(sede(pos), 'il ' + PAR_IT[parArr] + ' che torna entra nella tomba', 'T2b sepolto nella tomba');
      }
      var dN = dirDelCarattere(mob.par, pos);
      if (dN) return fine(dN, 'l\'arrivo nutre la partenza: la mobile resta sé stessa e parla da ' + PAR_IT[mob.par],
                          'T2b nutrita dall\'arrivo');
      racconto.push('ma il carattere è C: tace');
      // "non puo' fare altro": la mobile nutrita non va a cercare con l'arrivo (niente porte).
      // Con lo stato del movimento acceso (dottrina del 16/09) vale anche per le porte.
      if (!off('MLSTATOMOV')) mobileNutrita = true;
    }

    // Edu, 09/09/2026: l'arrivo non resta da solo, cerca qualcosa da fare. Se quello
    // che trova e' una linea ferma con lo STESSO RAMO della partenza, la mobile
    // raggiunge una copia di se' stessa e resta quello che era — non diventa l'arrivo.
    // E se la mobile e' una sede, da li' parte il confronto con l'altra
    // (USDCAD 18/03/2020: 午 va in 未, 未 combina il 午 di L3, lo Shi resta Fuoco).
    // Edu, 09/09/2026 (USDJPY 10/02/2026): "Shi si muove per combinarsi con L6 巳".
    // Se la mobile e' una SEDE e il passo e' vivo, va a combinare la linea ferma che
    // trova e si lega al suo elemento; da li' parte il confronto con l'altra sede.
    // Non vale a passo nullo: se il giorno tiene l'arrivo la mobile arriva e si ferma,
    // e non salta da nessuna parte (USDJPY 30/09/2025, dove il giorno 寅 combina 亥).
    // S46 (USDJPY 09/02/2026): il giorno 寅 CLASHA l'arrivo 申, eppure Edu fa arrivare la Ying su
    // L6 巳 ("Y si muove per raggiungere L6 B 巳"). Quindi solo la COMBINAZIONE dell'arrivo da
    // parte del giorno ferma il salto (USDJPY 30/09/2025), non il clash. MLSEDECOMBCLASH=off.
    var passoComb = !!(C.D && arr && COMBINA[C.D] === arr);
    if (!mobileAnnullata && !off('MLSEDECOMB') && arr &&
        (off('MLSEDECOMBCLASH') ? !passoNullo : !passoComb) &&
        (mob.isShi || mob.isYing)) {
      var legame = R.linee.filter(function (L) {
        // per essere combinata basta che la linea ci sia: non serve che "faccia
        // qualcosa" — quel test serve per i membri di un raduno, non per un bersaglio
        return L.pos !== pos && !annullate[L.pos] && COMBINA[arr] === L.ramo &&
               L.ramo !== dep && !vuotaL(L, C, R) &&
               L.stato !== 'eliminata' && !rottaL(L, R, C);
      })[0];
      if (legame) {
        var altraL = mob.isShi ? R.ying : R.shi;
        // Edu, 11/09/2026 (USDJPY 09/02/2026): "Y si muove per raggiungere L6 B 巳. Vince S.
        // Non c'e' bisogno di usare le bestie." Provato con l'altra sede col PROPRIO elemento
        // (MLSEDECOMB=proprio): rompe USDJPY 10/02/2026, dove Edu legge la Ying con le bestie
        // (anno e ora -> 午). Resta l'elemento dopo le bestie; da chiarire con Edu.
        var elAltraL = ENV.MLSEDECOMB === 'proprio' ? R.linee[altraL - 1].el : elDopoLeBestie(R.linee[altraL - 1], C);
        racconto.push('la mobile è una sede e il passo è vivo: va a combinarsi con L' +
          legame.pos + ' ' + legame.ramo + ' ' + EL_IT[legame.el] + ' e si lega a quell\'elemento');
        var dL = confrontoDiretto(R, C, mob.isShi ? legame.el : elAltraL,
                                        mob.isYing ? legame.el : elAltraL, racconto);
        if (dL) return fine(dL, 'la sede mobile si lega alla linea che combina, poi confronto fra le sedi',
                            'T2d la sede si combina');
      }
    }

    // --- T2n: IL MOVIMENTO FINISCE IN NIENTE ------------------------------------
    // Edu, 11/09/2026 (NZDUSD 10/08/2022 seme 62): "L3 si muove (non viene fermata) e
    // arriva a combinarsi con una vuota C in L2. Il movimento finisce in niente. Long."
    // Perimetro della carta: passo vivo; l'arrivo COMBINA (六合) una linea ferma VUOTA
    // (non svegliata) che nel palazzo e' C. Il movimento non porta a niente, e vale una
    // delle prime regole: CHI NON VINCE, PERDE. Edu, 11/09/2026: "Se il movimento della
    // linea non porta a niente quella squadra perde." -> la sede della mobile perde,
    // qualunque sia il suo carattere.
    // Estensioni di Claude, SPENTE: MLNIENTE=tutte (qualunque linea vuota, non solo C);
    // MLNIENTE=carattere (parla il carattere della mobile, per analogia col §114).
    if (!mobileAnnullata && !off('MLNIENTE') && arr && !passoNullo) {
      var nulla = R.linee.filter(function (L) {
        return L.pos !== pos && !annullate[L.pos] && COMBINA[arr] === L.ramo &&
               vuotaL(L, C, R) && L.stato === 'dormiente' &&
               (L.par === 'C' || ENV.MLNIENTE === 'tutte');
      })[0];
      // Edu, 11/09/2026 (EURJPY 23/10/2024): "se Wu in L4 si muove per diventare Chou, e Chou
      // e' lo Y, allora e' come se Wu si muove per arrivare su Y" — effetto scalino. Se
      // l'arrivo porta il ramo di un'altra linea, il movimento arriva SU quella linea: non
      // finisce in niente. MLSCALINO=off.
      if (nulla && !off('MLSCALINO') && R.linee.some(function (L) {
            return L.pos !== pos && !annullate[L.pos] && L.ramo === arr; })) nulla = null;
      if (nulla) {
        racconto.push('la mobile si muove e arriva in ' + arr + ', che va a combinarsi con L' + nulla.pos + ' ' +
          PAR_IT[nulla.par] + ' ' + nulla.ramo + ', vuota: il movimento finisce in niente, e chi non vince ' +
          'perde — la sede della mobile perde');
        var dNi = ENV.MLNIENTE === 'carattere' ? dirDelCarattere(mob.par, pos) : opposto(sede(pos));
        if (dNi) return fine(dNi, 'il movimento finisce in niente: chi non vince perde',
                             'T2n finisce in niente');
        racconto.push('la mobile è un C: tace');
      }
    }

    if (!mobileAnnullata && !off('MLCOPIA') && arr && !passoNullo) {
      var copia = R.linee.filter(function (L) {
        return L.pos !== pos && !annullate[L.pos] && L.ramo === dep &&
               COMBINA[arr] === L.ramo && faQualcosa(L, R, C);
      })[0];
      if (copia) {
        racconto.push('l\'arrivo ' + arr + ' non resta da solo: cerca qualcosa da fare e trova L' +
          copia.pos + ', che porta lo stesso ramo ' + dep + ' della partenza. La mobile raggiunge ' +
          'una copia di sé stessa e resta ' + EL_IT[depEl] + ', ' + PAR_IT[mob.par]);
        if (mob.isShi || mob.isYing) {
          var altraC = mob.isShi ? R.ying : R.shi;
          var elAltraC = elDopoLeBestie(R.linee[altraC - 1], C);
          var dC = confrontoDiretto(R, C, mob.isShi ? depEl : elAltraC,
                                          mob.isYing ? depEl : elAltraC, racconto);
          if (dC) return fine(dC, 'la mobile ritrova la propria copia: da lì parte il confronto fra le sedi',
                              'T2c la copia di sé');
        }
        var dC2 = dirDelCarattere(mob.par, pos);
        if (dC2) return fine(dC2, 'la mobile ritrova la propria copia e resta ' + PAR_IT[mob.par],
                             'T2c la copia di sé');
      }
    }

    if (!mobileAnnullata && !off('MLSERVE')) {
      var gruppi = RADUNI.concat(TRIGONI);
      for (var g = 0; g < gruppi.length; g++) {
        var set = gruppi[g];
        if (set.indexOf(dep) < 0) continue;
        var completo = true, dove = [];
        for (var s2 = 0; s2 < set.length; s2++) {
          var ram = set[s2], trovato = null;
          if (ram === dep) trovato = 'la mobile L' + pos;
          // un ramo portato solo dalla data non fa numero se e' in vuoto
          else if (C.ramiData.indexOf(ram) >= 0 && !C.vuoto(ram)) trovato = 'la data';
          else {
            for (var q = 0; q < R.linee.length && !trovato; q++) {
              var LL = R.linee[q];
              if (LL.ramo === ram && !annullate[LL.pos] && faQualcosa(LL, R, C)) trovato = 'L' + LL.pos;
            }
          }
          if (!trovato) { completo = false; break; }
          dove.push(ram + ' da ' + trovato);
        }
        if (!completo) continue;
        racconto.push('il raduno ' + set.join('') + ' è completo (' + dove.join(', ') +
          '): ha la mobile fra i membri, quindi serve la linea e ne prende il carattere, ' + PAR_IT[mob.par]);
        // Il raduno serve la linea, ma se il suo elemento e' seduto sia sopra sia sotto
        // non c'e' una sede da far vincere: il raduno non decide, e si va avanti
        // (EURJPY 10/02/2026: il Legno 寅卯辰 sta su L6 e sullo Shi L2).
        if (!off('MLRADSEDE') && gemellaDiSede(mob, pos, R, C, annullate)) {
          racconto.push('ma lo stesso elemento siede anche su L' +
            gemellaDiSede(mob, pos, R, C, annullate).pos + ', dall\'altra parte della carta e ' +
            'proprio su una sede: non c\'è una sede da far vincere');
          continue;
        }
        // Un raduno DI STAGIONE non si limita a servire la linea: se la tira dentro e
        // la fa diventare del proprio elemento, e il carattere si rilegge nel palazzo.
        // Se invece l'elemento del raduno e' fuori stagione non ha la forza di
        // trasformarla e la serve soltanto, lasciandole il proprio carattere
        // (USDJPY 30/09/2025: raduno di Legno nel mese 酉, la W resta W).
        var elGr = WX[set[1]], parEff = mob.par;
        if (!off('MLRADTRASF') && C.timely(elGr) && elGr !== mob.el) {
          parEff = parDi(elGr, palEl);
          racconto.push('il raduno è di stagione: non serve soltanto la linea, se la tira dentro — ' +
            'L' + pos + ' diventa ' + EL_IT[elGr] + ', cioè ' + PAR_IT[parEff] + ' nel palazzo');
        }
        var d2 = dirDelCarattere(parEff, pos);
        if (d2) return fine(d2, 'il raduno ' + (parEff === mob.par ? 'serve la mobile e ne prende il carattere' : 'di stagione trasforma la mobile in ' + PAR_IT[parEff]), 'T3 il raduno serve');
        racconto.push('ma il carattere è C: tace');
      }
    }

    // --- T4z: L'UNICA AZIONE (§69, Edu 17/08/2026) -------------------------------
    // "Se non ci sono migliori alternative si va verso l'unica disponibile anche se non ti
    // piace. E' l'azione che guida l'interpretazione." Regola fissata da Edu sulla catena:
    // movimento nullo (la mobile sospesa dal giorno) + nessun raduno + il giorno clasha UNA
    // sola linea ferma -> vuota: esce dal vuoto e decide, sua sede; piena: e' rotta, la sua
    // sede perde. Portata nel motore di lettura in S46 da EURJPY 15/08/2024 (seme 162), dove
    // "il giorno distrugge l'arrivo, parla la partenza" (estensione di Claude di S44) sbagliava.
    // Messa prima del giorno che tiene/distrugge l'arrivo. MLUNICA=off la spegne.
    // Edu, 11/09/2026: "Se l'arrivo e' clashato la linea rimane attiva ma non cambia" -> se
    // il giorno clasha l'arrivo la mobile NON e' fuori dai giochi: qui non si entra.
    // E la ferma protetta dalla combinazione col mese non si rompe: perde solo la combo.
    if (!mobileAnnullata && !off('MLUNICA') && !incomp && C.D && R.mutante.movimentoNullo &&
        /suspended by the day/.test(R.mutante.motivoNullo || '') && CLASH[C.D] !== arr &&
        (C.seconde || []).every(function (X) { return annullate[X.L.pos]; }) &&
        !qualcheRaduno(R, C, annullate, pos, dep)) {
      var colpite = R.linee.filter(function (L) {
        return L.pos !== pos && !annullate[L.pos] && CLASH[C.D] === L.ramo;
      });
      if (colpite.length === 1 && !protettaDalMese(colpite[0], R, C)) {
        var U = colpite[0], uVuota = vuotaL(U, C, R);
        racconto.push('il giorno ' + C.D + ' sospende la mobile e non c\'è nessun raduno: niente si muove. ' +
          'L\'unica azione è il giorno che clasha L' + U.pos + ' ' + PAR_IT[U.par] + ' ' + U.ramo +
          (uVuota ? ', vuota: esce dal vuoto e decide, la sua sede vince' : ', piena: si rompe, la sua sede perde'));
        return fine(uVuota ? sede(U.pos) : opposto(sede(U.pos)),
          'l\'unica azione: il giorno clasha L' + U.pos + (uVuota ? ' vuota, che decide' : ' piena, che si rompe'),
          'T4z l\'unica azione');
      }
    }

    if (!mobileAnnullata && !off('MLGIORNO') && arr && !incomp && (C.D || S2)) {
      if ((C.D && COMBINA[C.D] === arr) || secCombArr) {
        var parB = parDi(arrEl, palEl);
        racconto.push('il ramo del giorno ' + C.D + ' combina l\'arrivo ' + arr +
          ': la mobile arriva e si ferma, non può saltare altrove — parla il carattere dell\'arrivo, ' + PAR_IT[parB]);
        var d3 = dirDelCarattere(parB, pos);
        if (d3) return fine(d3, 'il giorno tiene l\'arrivo: parla il carattere dell\'arrivo', 'T4 il giorno tiene');
      } else if ((C.D && CLASH[C.D] === arr) || secClashArr) {
        racconto.push('il ramo del giorno ' + C.D + ' clasha l\'arrivo ' + arr +
          ': la trasformazione non prende, la linea parte e non arriva — resta sé stessa');
        var gem = !off('MLRADSEDE') && gemellaDiSede(mob, pos, R, C, annullate);
        if (gem) racconto.push('ma lo stesso elemento siede anche su L' + gem.pos +
          ', dall\'altra parte e su una sede: la partenza non fa vincere la propria sede');
        // CONFERMATA DA EDU, 11/09/2026 (EURJPY 15/08/2024): "Se l'arrivo e' clashato la
        // linea rimane attiva ma non cambia. Quindi P 戌 farebbe perdere la propria squadra."
        var d4 = gem ? null : dirDelCarattere(mob.par, pos);
        if (d4) return fine(d4, 'l\'arrivo è distrutto dal giorno: parla la partenza', 'T4 il giorno distrugge');
      }
    }

    // Le sedi prese dalle bestie parlano anche quando la mobile e' viva ma non riesce
    // a far pendere niente (il suo stesso elemento siede dall'altra parte).
    var mobileNonDecide = !!gemellaDiSede(mob, pos, R, C, annullate);
    if ((mobileAnnullata || mobileNonDecide) && !off('MLSEDEPRESA')) {
      var prese = [R.shi, R.ying].filter(function (sp) {
        return !annullate[sp] && (C.suLinea[sp] || []).some(function (Q) { return Q.possiede; });
      });
      var due = prese.length === 2;
      var presa = [R.shi, R.ying].filter(function (sp) {
        return !annullate[sp] && (C.suLinea[sp] || []).some(function (Q) { return Q.possiede; });
      })[0];
      if (presa) {
        var lPresa = R.linee[presa - 1];
        var elPresa = elDopoLeBestie(lPresa, C);
        racconto.push('la mobile è ferma; su L' + presa + (presa === R.shi ? ' (lo Shi)' : ' (la Ying)') +
          ' le bestie si impadroniscono della linea: da ' + lPresa.ramo + ' ' + EL_IT[lPresa.el] +
          ' con ' + (C.suLinea[presa] || []).map(function (Q) { return Q.ramo; }).join(' e ') +
          ' l\'energia finisce su ' + EL_IT[elPresa]);
        var altraP = presa === R.shi ? R.ying : R.shi;
        var elAltraP = elDopoLeBestie(R.linee[altraP - 1], C);
        var dP = confrontoDiretto(R, C,
          presa === R.shi ? elPresa : elAltraP, presa === R.ying ? elPresa : elAltraP, racconto);
        if (dP) return fine(dP, 'il possesso avviene su una sede: parte subito il confronto con l\'altra',
                            'T4b la sede presa ' + (mobileAnnullata ? '(mobile ferma)' : '(mobile non decide)') + (due ? ' due sedi' : ' una sede') + ' · bestie ' + (C.suLinea[presa] || []).length);
      }
    }

    // --- T4c: con la mobile ferma parla la linea svegliata dal giorno ---------
    // Il clash del giorno su una linea ferma la fa muovere (暗動). Se la mobile e'
    // fuori dai giochi, quella e' l'unica linea che sta agendo nella carta, e il suo
    // carattere decide la propria sede (USDCAD 18/03/2020).
    // La ferma incompatibile e' diventata mobile: se il protagonista e' fuori dai
    // giochi, e' lei quella che sta agendo nella carta.
    // --- T0p: LE TRE PORTE DELLA SECONDA MOBILE -----------------------------------
    // Edu, 11/09/2026 (USDJPY 13/09/2022 seme 142): "The reason for the Long is L3 moving to
    // generate L5 W. Remember, when a line moves and is not combined or clashed it looks
    // doing something. It can combine, clash or generate another line. If it doesn't do any
    // of the above then it stays quiet at arrival."
    // Le tre porte valgono anche per la SECONDA mobile (la ferma incompatibile): se non e'
    // combinata ne' clashata, cerca di combinare, clashare o generare un'altra linea; parla
    // chi riceve l'azione. Se non trova niente, resta zitta all'arrivo.
    // Ordine delle porte come per la prima mobile (combinare, clashare, generare).
    // Qui: L3 (午 -> 辰) genera la W 申 di L5 -> parla la W, la sede alta vince -> LONG.
    // POSIZIONE: dopo le regole che parlano della prima mobile e dopo T0r/T0u — quando la
    // prima mobile ha gia' la sua strada, le porte della seconda non comandano (EURJPY
    // 15/08/2024: li' decide L2 che retrocede con le bestie). Qui entra solo se la prima
    // mobile non ha concluso. MLPORTESEC=off.
    if (!off('MLPORTESEC')) {
      for (var ps = 0; ps < (C.seconde || []).length; ps++) {
        var XS = C.seconde[ps];
        if (annullate[XS.L.pos] || !XS.arr) continue;
        if (C.D && (CLASH[C.D] === XS.L.ramo || COMBINA[C.D] === XS.L.ramo)) continue;
        // Edu, 15/09/2026: "L4 goes into void" — la seconda con l'arrivo nel vuoto non
        // combina, non clasha, non genera: resta zitta.
        if (XS.vuota) { racconto.push('L' + XS.L.pos + ' va in ' + XS.arr + ', nel vuoto: non fa niente'); continue; }
        var aEl = WX[XS.arr];
        var fermeS = R.linee.filter(function (L) {
          return L.pos !== XS.L.pos && L.pos !== pos && !annullate[L.pos] && !rottaL(L, R, C) && !vuotaL(L, C, R);
        });
        var porteS = [
          { nome: 'combinare', trova: function (L) { return COMBINA[XS.arr] === L.ramo; } },
          { nome: 'clashare',  trova: function (L) { return CLASH[XS.arr] === L.ramo; } },
          { nome: 'generare',  trova: function (L) { return GEN[aEl] === L.el; } }
        ];
        for (var kp = 0; kp < porteS.length; kp++) {
          var bS = fermeS.filter(porteS[kp].trova);
          if (!bS.length) continue;
          if (bS.length > 1 && !bS.every(function (L) { return sede(L.pos) === sede(bS[0].pos); })) continue;
          var TS = bS[0], dPS = dirDelCarattere(TS.par, TS.pos);
          if (!dPS) continue;
          racconto.push('L' + XS.L.pos + ' si muove e niente la blocca: va a ' + porteS[kp].nome +
            ' L' + TS.pos + ' ' + PAR_IT[TS.par] + ' ' + TS.ramo + '. Parla chi riceve l\'azione');
          return fine(dPS, 'la seconda mobile ' + porteS[kp].nome + ': parla chi riceve, L' + TS.pos + ' ' + PAR_IT[TS.par],
                      'T0p le tre porte della seconda');
        }
      }
    }

    if ((mobileAnnullata || mobileNonDecide) && !off('MLINCFERMA')) {
      var mosse = R.linee.filter(function (L) {
        return L.pos !== pos && !annullate[L.pos] && !L.isMobile && C.incompDi(L);
      });
      if (mosse.length === 1) {
        var MI = mosse[0];
        racconto.push('L' + MI.pos + ' è una linea incompatibile ferma: non può stare dove sta, ' +
          'quindi si muove. Con la mobile fuori dai giochi è lei ad agire, ed è un ' + PAR_IT[MI.par]);
        var dMI = dirDelCarattere(MI.par, MI.pos);
        if (dMI) return fine(dMI, 'agisce la ferma incompatibile di L' + MI.pos + ', ' + PAR_IT[MI.par],
                             'T4d la ferma incompatibile');
      }
    }

    if ((mobileAnnullata || mobileNonDecide) && !off('MLSVEGLIA')) {
      var sveglie = R.linee.filter(function (L) {
        return L.pos !== pos && !annullate[L.pos] && !vuotaL(L, C, R) &&
               ((L.stato === 'mossa' && C.D && CLASH[C.D] === L.ramo) || L._sveglia2);
      });
      if (sveglie.length === 1) {
        var SW = sveglie[0];
        racconto.push('la mobile è fuori dai giochi; il giorno ' + C.D + ' clasha L' + SW.pos +
          ' e la sveglia: è l\'unica linea che agisce, ed è un ' + PAR_IT[SW.par]);
        var dSW = dirDelCarattere(SW.par, SW.pos);
        if (dSW) return fine(dSW, 'con la mobile ferma parla la linea svegliata dal giorno, ' + PAR_IT[SW.par],
                             'T4c la svegliata dal giorno');
      }
    }

    var ritirataSenzaForza = !off('MLRITIRATA') &&
        R.mutante.progressione === 'retrocedente' && !C.timely(depEl);
    if (ritirataSenzaForza) {
      racconto.push('la mobile si ritira e non è di stagione: perdendo energia non ha la forza di ' +
        'combinarsi con niente');
    }
    if (!mobileAnnullata && !mobileNutrita && !off('MLPORTE') && arrEl && !passoNullo && !ritirataSenzaForza) {
      var ferme = R.linee.filter(function (L) {
        if (L.pos === pos || annullate[L.pos]) return false;
        if (!off('MLROTTA') && rottaL(L, R, C)) return false;
        return true;
      });
      var porte = [
        { nome: 'combinare', trova: function (L) { return COMBINA[arr] === L.ramo; } },
        { nome: 'clashare',  trova: function (L) { return CLASH[arr] === L.ramo; } },
        { nome: 'generare',  trova: function (L) { return GEN[arrEl] === L.el; } }
      ];
      for (var k = 0; k < porte.length; k++) {
        var bers = ferme.filter(porte[k].trova);
        if (!bers.length) continue;
        if (bers.length > 1) {
          var stessaSede = bers.every(function (L) { return sede(L.pos) === sede(bers[0].pos); });
          if (!stessaSede) continue;
        }
        var T = bers[0];
        racconto.push('niente la blocca, quindi la mobile cerca qualcosa da fare: ' + porte[k].nome +
          ' — l\'unica linea disponibile è L' + T.pos + ' ' + PAR_IT[T.par] + ' ' + T.ramo +
          '. Parla chi riceve l\'azione');
        var d5 = dirDelCarattere(T.par, T.pos);
        if (d5) return fine(d5, 'la mobile ' + porte[k].nome + ': parla chi riceve, L' + T.pos + ' ' + PAR_IT[T.par],
                            'T5 le tre porte');
      }
    }

    if (!off('MLNUTRE')) {
      var gr2 = TRIGONI.concat(RADUNI);
      for (var t = 0; t < gr2.length; t++) {
        var st = gr2[t], el = WX[st[1]];
        var membri = [], ok = true;
        for (var u = 0; u < st.length; u++) {
          var rr = st[u], viva = null;
          for (var w = 0; w < R.linee.length && !viva; w++) {
            var LW = R.linee[w];
            if (LW.ramo === rr && !annullate[LW.pos] && faQualcosa(LW, R, C)) viva = LW;
          }
          if (viva) membri.push(viva);
          else if (C.ramiData.indexOf(rr) < 0) { ok = false; break; }
        }
        if (!ok || !membri.length) continue;
        if (!C.timely(el)) continue;
        var sotto = membri.filter(function (L) { return L.pos <= 3; }).length;
        if (sotto !== membri.length - sotto) continue;
        var figli = R.linee.filter(function (L) {
          if (annullate[L.pos] || GEN[el] !== L.el) return false;
          if (L.par !== 'G' && L.par !== 'W') return false;
          if (!L.isMobile && vuotaL(L, C, R)) return false;
          if (!off('MLROTTA') && (rottaL(L, R, C) || L.stato === 'eliminata')) return false;
          return true;
        });
        if (figli.length > 1) {
          var sedi2 = figli.filter(function (L) { return L.isShi || L.isYing; });
          if (sedi2.length === 1) figli = sedi2;
        }
        if (figli.length !== 1) continue;
        var F = figli[0];
        racconto.push('il trigono ' + st.join('') + ' di ' + EL_IT[el] + ', forte di stagione, non decide ' +
          'per sede: nutre ' + PAR_IT[F.par] + ' ' + F.ramo + ' di L' + F.pos + ', che nutrito vince la sua sede');
        return fine(sede(F.pos), 'il trigono nutre ' + PAR_IT[F.par] + ' di L' + F.pos, 'T6 il trigono nutre');
      }
    }

    if (dirSeconda && ENV.SECONDACAR === 'dopo') {
      racconto.push('la prima mobile non conclude; L' + S2c.L.pos + ' è incompatibile e muta ' + S2c.dep +
        ' → ' + S2c.arr + ', che nel palazzo è ' + PAR_IT[parArr2] + ': resta così e decide la propria sede');
      return fine(dirSeconda, 'la seconda mobile diventa ' + PAR_IT[parArr2] + ' e decide la sua sede',
                  'T5c la seconda diventa ' + PAR_IT[parArr2]);
    }

    // La seconda mobile passa dalle tre porte, ma solo se la prima non ha concluso
    // (i test "prima" e "concordi" hanno mostrato che non puo' scavalcarla).
    if (ENV.DUEMUT2 === 'on' && C.seconde.length === 1) {
      var S2b = C.seconde[0], arr2 = (ENV.ANDONG === 'si') ? S2b.dep : S2b.arr, arrEl2 = WX[arr2];
      var ferme2 = R.linee.filter(function (L) {
        return L.pos !== pos && L.pos !== S2b.L.pos && !annullate[L.pos] &&
               !(!L.isMobile && vuotaL(L, C, R)) && !rottaL(L, R, C) && L.stato !== 'eliminata';
      });
      var porte2 = [
        { nome: 'combinare', trova: function (L) { return COMBINA[arr2] === L.ramo; } },
        { nome: 'clashare',  trova: function (L) { return CLASH[arr2] === L.ramo; } },
        { nome: 'generare',  trova: function (L) { return GEN[arrEl2] === L.el; } }
      ];
      for (var k2 = 0; k2 < porte2.length; k2++) {
        var bers2 = ferme2.filter(porte2[k2].trova);
        if (!bers2.length) continue;
        if (bers2.length > 1 && !bers2.every(function (L) { return sede(L.pos) === sede(bers2[0].pos); })) continue;
        var T2 = bers2[0];
        racconto.push('la prima mobile non conclude; la seconda, L' + S2b.L.pos + ' ' + S2b.dep + ' → ' + arr2 +
          ', va a ' + porte2[k2].nome + ' L' + T2.pos + ' ' + PAR_IT[T2.par] + ' ' + T2.ramo + ': parla chi riceve');
        var d5b = dirDelCarattere(T2.par, T2.pos);
        if (d5b) return fine(d5b, 'la seconda mobile ' + porte2[k2].nome + ': parla chi riceve, L' + T2.pos + ' ' + PAR_IT[T2.par],
                             'T5b le porte della seconda');
      }
    }

    // --- T7: il duello, solo alla fine ---------------------------------------
    // Regola sopra le regole: se nessuna traccia ha concluso, restano il soggetto e
    // l'oggetto, e vince il piu' forte dei due.
    // Il duello non e' un pari o dispari: decide solo quando una delle due sedi e'
    // fuori dai giochi e l'altra no — vuota ed eliminata, legata, rotta. Se sono tutte
    // e due in piedi e nessuna traccia ha concluso, la carta tace.
    if (!off('MLDUELLO') && !annullate[R.shi] && !annullate[R.ying]) {
      var lS7 = R.linee[R.shi - 1], lY7 = R.linee[R.ying - 1];
      // Edu: "quando S o Y vengono presi dalle bestie da quel momento in poi la partita
      // diventa esclusivamente fra S vs Y" — se nessuna traccia ha concluso e una sede e'
      // presa, il duello e' il confronto diretto (relazione, steli), non la sola forza.
      // MLDUELLOPRESA=off per il vecchio duello.
      var presa7 = [R.shi, R.ying].some(function (sp) {
        return (C.suLinea[sp] || []).some(function (Q) { return Q.possiede; });
      });
      if (presa7 && !off('MLDUELLOPRESA')) {
        var eS7 = elDopoLeBestie(lS7, C), eY7 = elDopoLeBestie(lY7, C);
        racconto.push('nessuna traccia conclude e una sede è presa dalle bestie: resta solo Shi (' +
          EL_IT[eS7] + ') contro Ying (' + EL_IT[eY7] + ')');
        var d7p = confrontoDiretto(R, C, eS7, eY7, racconto);
        if (d7p) return fine(d7p, 'la sede presa: solo Shi contro Ying', 'T7 il duello (sede presa)');
      }
      // Con una bestia sopra la linea non e' vuota (Edu, 11/09/2026): lo stato "dormiente"
      // della catena conta solo se la linea e' davvero vuota.
      var fuori = function (L) {
        return L.stato === 'eliminata' || rottaL(L, R, C) || L.stato === 'legata' || L._legata2 ||
               (L.stato === 'dormiente' && (off('MLDORMBESTIA') || vuotaL(L, C, R))) || (vuotaL(L, C, R) && !L.isMobile);
      };
      if (fuori(lS7) === fuori(lY7)) {
        racconto.push('nessuna traccia conclude e le due sedi sono nella stessa condizione: ' +
          'non c\'è un duello da decidere');
        // S47 (Edu, 15/09/2026): qui prima la carta taceva. Ora si scende ai principi 3 e 4
        // (Shi contro Ying, poi la linea piu' forte). MLDUELLOTACE=on ripristina il silenzio.
        if (ENV.MLDUELLOTACE === 'on') return fine(null, 'nessuna traccia conclude', 'tace');
      } else {
      var d7 = confrontoDiretto(R, C, C.capolinea ? C.capolinea(lS7) : lS7.el,
                                      C.capolinea ? C.capolinea(lY7) : lY7.el, racconto, true);
      if (d7) return fine(d7, 'nessun altro conclude: resta il duello fra Shi e Ying', 'T7 il duello');
      }
    }

    // --- T8: SHI CONTRO YING (principio 3 di Edu) ---------------------------------
    // Edu, 14/09/2026: "1. Si risolve con le linee mobili. 2. Se c'e' un blocco nel movimento
    // e non si giunge a una soluzione, si usano le bestie. 3. S vs Y. 4. La linea piu' forte."
    // Quando nessun movimento e nessuna bestia ha concluso, si confrontano le due sedi come
    // stanno (elementi dopo le bestie, che si usano solo se portano vantaggio): generazione,
    // controllo, penalita' fra sedi, forza. Prima solo il duello T7 (una sede fuori e l'altra
    // no); questo vale per tutte le carte con le due sedi in piedi. MLSVSY=off.
    // MISURA (15/09/2026), sulle ~50 carte dove ne' le mobili ne' le bestie concludono:
    //   elementi (Claude)      50 carte 40,0%   mazzo 52,76% +16.177
    //   carattere delle sedi   42 carte 38,1%   mazzo 52,59% +15.448
    //   la piu' forte fra le due sedi  49 carte 36,7%   mazzo 52,54% +15.257
    //   T8 SPENTO -> T9 la piu' forte dell'esagramma  43 carte 55,8%   mazzo 52,98% +16.474
    // Nessuna formula di "Shi contro Ying" scritta da Claude regge; la linea piu' forte
    // dell'esagramma si'. T8 resta SPENTO (MLSVSY=elementi|carattere|forza per accenderlo)
    // finche' Edu non detta la sua regola di confronto.
    // Edu, 15/09/2026 (EURUSD 11/03/2022): "S generates Y. Short" — il principio 3 e' la
    // relazione fra gli elementi delle due sedi come stanno (chi genera l'altra perde, chi e'
    // generata vince; chi controlla vince). E' la formula "elementi": regola di Edu, si tiene
    // anche se misura 40% su 50 carte, e le storte si portano a Edu una per una. MLSVSY=off la spegne.
    if (!off('MLSVSY') && !annullate[R.shi] && !annullate[R.ying] &&
        !(typeof fuori === 'function' && fuori(R.linee[R.shi - 1]) && fuori(R.linee[R.ying - 1]))) {
      // Due sedi tutte e due fuori (vuote, legate, rotte) non si confrontano: si va alla
      // linea piu' forte.
      var lS8 = R.linee[R.shi - 1], lY8 = R.linee[R.ying - 1];
      var eS8 = elDopoLeBestie(lS8, C), eY8 = elDopoLeBestie(lY8, C);
      var st8 = function (L) {
        var t = [];
        if (vuotaL(L, C, R)) t.push('vuota');
        if (L.stato === 'legata' || L._legata2) t.push('legata');
        if (rottaL(L, R, C)) t.push('rotta');
        if (L.isMobile) t.push('mobile');
        t.push(C.timely(L.el) ? 'di stagione' : 'fuori stagione');
        return t.join(', ');
      };
      racconto.push('né le mobili né le bestie concludono: Shi ' + lS8.ramo + ' ' + PAR_IT[lS8.par] + ' (' + EL_IT[eS8] + '; ' + st8(lS8) +
        ') contro Ying ' + lY8.ramo + ' ' + PAR_IT[lY8.par] + ' (' + EL_IT[eY8] + '; ' + st8(lY8) + ')');
      // Variante da misurare (Edu, 15/09/2026: "sicuro che la soluzione per quelle 30 carte non
      // esiste gia'?"): prima degli elementi parla il CARATTERE delle sedi, che e' la regola
      // gerarchica di Edu (G/W fanno vincere la propria sede, P/B la fanno perdere, C tace).
      // Se i due caratteri dicono la stessa cosa, o solo uno parla, decide il carattere; se si
      // contraddicono, si passa agli elementi. MLSVSY=carattere.
      // Variante: S vs Y = la PIU' FORTE delle due sedi (stessa misura di T9, ristretta alle
      // sedi): stagione, ramo del mese/giorno/anno, clash della data che la cita. MLSVSY=forza.
      if (ENV.MLSVSY === 'forza') {
        var pf = function (L) {
          var f = PESO_STAGIONE[C.stagione(L.el)] || 0;
          if (vuotaL(L, C, R)) f -= 2;
          if (L.ramo === R.monthBranch) f += 2;
          if (C.D && L.ramo === C.D) f += 1;
          if (R.yearBranch && L.ramo === R.yearBranch) f += 1;
          C.ramiData.forEach(function (r) { if (CLASH[r] === L.ramo) f += 1; });
          return f;
        };
        var fS8 = pf(lS8), fY8 = pf(lY8);
        if (fS8 !== fY8) {
          var Lv8 = fS8 > fY8 ? lS8 : lY8;
          racconto.push('Shi contro Ying: vince la più forte delle due, L' + Lv8.pos + ' ' + Lv8.ramo + ' (' + Math.max(fS8, fY8) + ' contro ' + Math.min(fS8, fY8) + ')');
          return fine(sede(Lv8.pos), 'Shi contro Ying: la più forte delle due sedi', 'T8 Shi contro Ying: la più forte');
        }
        racconto.push('Shi e Ying pesano uguale: si va alla linea più forte dell\'esagramma');
      } else if (ENV.MLSVSY === 'carattere') {
        var cS8 = dirDelCarattere(lS8.par, lS8.pos), cY8 = dirDelCarattere(lY8.par, lY8.pos);
        var dCar = (cS8 && cY8) ? (cS8 === cY8 ? cS8 : null) : (cS8 || cY8);
        if (dCar) {
          racconto.push('parlano i caratteri delle sedi: Shi ' + PAR_IT[lS8.par] + (cS8 ? ' (' + (cS8 === sede(lS8.pos) ? 'fa vincere' : 'fa perdere') + ' la sua sede)' : ' (tace)') +
            ', Ying ' + PAR_IT[lY8.par] + (cY8 ? ' (' + (cY8 === sede(lY8.pos) ? 'fa vincere' : 'fa perdere') + ' la sua sede)' : ' (tace)'));
          return fine(dCar, 'Shi contro Ying: decide il carattere delle sedi', 'T8 Shi contro Ying: il carattere');
        }
        racconto.push('i caratteri delle sedi si contraddicono: si guardano gli elementi');
      }
      // Edu, 15/09/2026 (EURUSD 11/03/2022): "L5 cannot move because of the clash. Still survive
      // as the month generate it. S generates Y. Short." Il confronto vale fra sedi VIVE: la
      // sede che non si muove sopravvive se e' di stagione (il mese la genera o e' il suo).
      // MLSVSY=vive: confronto sugli elementi solo se tutte e due le sedi sono di stagione e
      // nessuna e' vuota, legata o rotta; altrimenti si scende alla piu' forte.
      if (ENV.MLSVSY === 'vive') {
        var viva8 = function (L) { return C.timely(L.el) && !vuotaL(L, C, R) && !(L.stato === 'legata' || L._legata2) && !rottaL(L, R, C); };
        if (!viva8(lS8) || !viva8(lY8)) {
          racconto.push('una delle due sedi non è viva (fuori stagione, vuota, legata o rotta): niente confronto, si va alla più forte');
        } else {
          var d8v = confrontoDiretto(R, C, eS8, eY8, racconto);
          if (d8v) return fine(d8v, 'Shi contro Ying, tutte e due vive', 'T8 Shi contro Ying: sedi vive');
        }
      } else {
      C._t8 = true;
      var d8 = confrontoDiretto(R, C, eS8, eY8, racconto);
      C._t8 = false;
      if (d8) return fine(d8, 'Shi contro Ying', 'T8 Shi contro Ying');
      }
    }

    // --- T9: LA LINEA PIU' FORTE DELL'ESAGRAMMA ---------------------------------
    // Edu, 15/09/2026: "in assenza di soluzioni e quando tutto il resto fallisce (incluse
    // bestie e S vs Y) si vede semplicemente la linea piu' forte" (USDCAD 04/01/2021: L2 P
    // spazzata via da tre 子 nella data, L5 W 子 diventa la linea piu' potente e vince).
    // Ultimo gradino prima del silenzio: fra le linee non vuote e non annullate vince la
    // squadra della piu' forte (stagione, ramo del mese, ramo del giorno, ramo dell'anno,
    // citata dal clash della data). Serve un massimo netto; a parita' la carta tace.
    // MLPIUFORTE=off.
    if (!off('MLPIUFORTE')) {
      var cand9 = R.linee.filter(function (L) { return !annullate[L.pos] && !vuotaL(L, C, R); });
      var punt9 = function (L) {
        var f = PESO_STAGIONE[C.stagione(L.el)] || 0;
        if (L.ramo === R.monthBranch) f += 2;
        if (C.D && L.ramo === C.D) f += 1;
        if (R.yearBranch && L.ramo === R.yearBranch) f += 1;
        C.ramiData.forEach(function (r) { if (CLASH[r] === L.ramo) f += 1; });
        return f;
      };
      cand9.sort(function (a, b) { return punt9(b) - punt9(a); });
      if (cand9.length && (cand9.length === 1 || punt9(cand9[0]) > punt9(cand9[1]))) {
        var L9 = cand9[0];
        racconto.push('nessuna traccia conclude: si guarda la linea più forte dell\'esagramma, L' + L9.pos + ' ' +
          PAR_IT[L9.par] + ' ' + L9.ramo + (C.timely(L9.el) ? ', di stagione' : '') +
          (L9.ramo === R.monthBranch ? ', sul ramo del mese' : '') + (C.D && L9.ramo === C.D ? ', sul ramo del giorno' : '') +
          ': vince la sua squadra');
        // Variante da misurare (EURUSD 11/03/2022: la piu' forte e' L6 P 卯 e la carta va SHORT):
        // la piu' forte PARLA COL SUO CARATTERE — G/W fanno vincere la propria squadra, P/B la
        // fanno perdere, C tace. MLPIUFORTE=carattere.
        if (ENV.MLPIUFORTE === 'carattere') {
          var d9c = dirDelCarattere(L9.par, L9.pos);
          if (!d9c) { racconto.push('ma è una C: tace'); return fine(null, 'la più forte è una C', 'tace'); }
          racconto.push('la più forte parla col suo carattere, ' + PAR_IT[L9.par] + ': ' + (d9c === sede(L9.pos) ? 'fa vincere' : 'fa perdere') + ' la sua squadra');
          return fine(d9c, 'la linea più forte parla col suo carattere', 'T9 la più forte col carattere');
        }
        return fine(sede(L9.pos), 'nessun altro conclude: decide la linea più forte, L' + L9.pos, 'T9 la linea più forte');
      }
    }

    // --- T10: L'ESAGRAMMA FUTURO (principio 5 di Edu) ------------------------------
    // Edu, 15/09/2026 (USDJPY 05/11/2020): "In questa carta nessuno vince. [...] S e Y sono lo
    // stesso quindi anche qui non c'e' vittoria. Non c'e' una linea piu' forte. A questo punto
    // si vede l'esagramma futuro: c'e' una incompatibile su L3. E' un G e quella fa vincere lo
    // Short." Quando nemmeno la linea piu' forte decide, si guarda l'esagramma futuro: una
    // linea INCOMPATIBILE nel suo trigramma futuro parla col suo carattere nel palazzo
    // (G/W fanno vincere la propria squadra, P/B la fanno perdere, C tace). MLFUTURO=off.
    if (!off('MLFUTURO') && C.futuro && C.futuro.RF && C.futuro.RF.linee) {
      var LF = C.futuro.RF.linee;
      for (var q10 = 0; q10 < LF.length; q10++) {
        var lf = LF[q10], posF = q10 + 1;
        if (!lf || !lf.ramo || !C.incompFuturo(lf.ramo, posF)) continue;
        var parF = parDi(WX[lf.ramo], R.palEl), dF = dirDelCarattere(parF, posF);
        racconto.push('nessuno vince: si guarda l\'esagramma futuro, dove L' + posF + ' ' + lf.ramo +
          ' è incompatibile nel suo trigramma; nel palazzo è ' + PAR_IT[parF] +
          (dF ? ': ' + (dF === sede(posF) ? 'fa vincere' : 'fa perdere') + ' la sua squadra' : ': tace'));
        if (dF) return fine(dF, 'l\'incompatibile dell\'esagramma futuro parla col suo carattere', 'T10 l\'esagramma futuro');
      }
    }

    racconto.push('nessuna traccia porta da qualche parte: la carta tace');
    return fine(null, 'nessuna traccia conclude', 'tace');
  }

  return { leggi: leggi, contesto: contesto };
}

if (typeof module !== 'undefined' && module.exports) module.exports = { creaMotore: creaMotore };
