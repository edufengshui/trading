// inventario_carta.js — L'INVENTARIO DELLA CARTA (S57, 16/10/2026)
// Prima di qualunque regola, tutto quello che c'e' sulla carta, nello stesso modo su ogni carta: i pilastri e le loro
// bestie, chi e' vuoto e chi ne esce (e perche'), chi si muove davvero e cosa lo ferma, cosa fa la data a ogni linea,
// tutti i trigoni e i raduni che si chiudono fra linee, arrivi e data, chi puo' essere posseduto e da quale bestia, le
// linee accanto alle sedi, la linea piu' forte. Non decide niente: e' la base su cui il lettore fa le domande di Edu.
// Uso: var inv = Inventario.inventario(R, ctx); Inventario.testo(inv) -> righe leggibili.
// ctx: dayBranch, monthBranch, yearBranch, oraBranch, dayStem, yearStem, monthStem, hourStem, emaDir.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.InventarioCarta = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var WX = { '子':'Water','丑':'Earth','寅':'Wood','卯':'Wood','辰':'Earth','巳':'Fire','午':'Fire','未':'Earth','申':'Metal','酉':'Metal','戌':'Earth','亥':'Water' };
  var GEN = { Wood:'Fire', Fire:'Earth', Earth:'Metal', Metal:'Water', Water:'Wood' };
  var KE  = { Wood:'Earth', Earth:'Water', Water:'Fire', Fire:'Metal', Metal:'Wood' };
  var COMBINA = { '子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯','辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午' };
  var CLASH = { '子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳' };
  var PENA = { '寅':'巳','巳':'申','申':'寅','丑':'戌','戌':'未','未':'丑','子':'卯','卯':'子' };
  var AUTOPENA = { '辰':1, '午':1, '酉':1, '亥':1 };
  var STELO_EL = { '甲':'Wood','乙':'Wood','丙':'Fire','丁':'Fire','戊':'Earth','己':'Earth','庚':'Metal','辛':'Metal','壬':'Water','癸':'Water' };
  var BESTIA_STELO = { '甲':'青龍','乙':'青龍','丙':'朱雀','丁':'朱雀','戊':'勾陳','己':'螣蛇','庚':'白虎','辛':'白虎','壬':'玄武','癸':'玄武' };
  var BESTIA_IT = { '青龍':'Drago Azzurro','朱雀':'Uccello Rosso','勾陳':'Gancio','螣蛇':'Serpente','白虎':'Tigre Bianca','玄武':'Guerriero Nero' };
  var TRIGONI = [[['申','子','辰'],'Water'],[['亥','卯','未'],'Wood'],[['寅','午','戌'],'Fire'],[['巳','酉','丑'],'Metal']];
  var RADUNI  = [[['寅','卯','辰'],'Wood'],[['巳','午','未'],'Fire'],[['申','酉','戌'],'Metal'],[['亥','子','丑'],'Water']];
  var TOMBA = { Water:'辰', Earth:'辰', Wood:'未', Fire:'戌', Metal:'丑' };
  var AVANZA = { '寅':'卯','卯':'辰','巳':'午','午':'未','申':'酉','酉':'戌','亥':'子','子':'丑' };
  var RETRO = {}; Object.keys(AVANZA).forEach(function (k) { RETRO[AVANZA[k]] = k; });
  var EL_IT = { Water:'Acqua', Wood:'Legno', Fire:'Fuoco', Earth:'Terra', Metal:'Metallo' };
  var RAMO_IT = { '子':'Zi','丑':'Chou','寅':'Yin','卯':'Mao','辰':'Chen','巳':'Si','午':'Wu','未':'Wei','申':'Shen','酉':'You','戌':'Xu','亥':'Hai' };

  // relazione dell'elemento a verso b, letta da b: 'stesso', 'genera' (a genera b), 'drena' (b genera a: a drena b),
  // 'controlla' (a controlla b), 'controllata' (b controlla a)
  function rel(a, b) {
    if (!a || !b) return null;
    if (a === b) return 'stesso';
    if (GEN[a] === b) return 'genera';
    if (GEN[b] === a) return 'drena';
    if (KE[a] === b) return 'controlla';
    if (KE[b] === a) return 'controllata';
    return null;
  }
  // stagione dell'elemento nel mese: 旺 stesso, 相 generato, 休 genera il mese, 囚 controlla il mese, 死 controllato dal mese
  function stagione(el, mE) {
    if (!el || !mE) return null;
    if (el === mE) return '旺'; if (GEN[mE] === el) return '相'; if (GEN[el] === mE) return '休';
    if (KE[el] === mE) return '囚'; if (KE[mE] === el) return '死'; return null;
  }
  var PESO = { '旺': 2, '相': 1, '休': 0, '囚': -1, '死': -2 };

  // cosa fa un ramo della data (o di una linea) a un ramo
  function azioni(da, a) {
    var x = [];
    if (!da || !a) return x;
    if (CLASH[da] === a) x.push('clash');
    if (COMBINA[da] === a) x.push('combina');
    if (PENA[da] === a) x.push('punisce');
    if (da === a) { x.push('stesso ramo'); if (AUTOPENA[a]) x.push('autopunizione'); }
    return x;
  }

  function inventario(R, c) {
    c = c || {};
    var inv = { ok: false };
    if (!R || R.error || !R.linee || !R.mutante) return inv;
    inv.ok = true;
    var mB = c.monthBranch, dB = c.dayBranch, hB = c.oraBranch || R.oraBranch, yB = c.yearBranch;
    var mE = mB ? WX[mB] : null, dE = dB ? WX[dB] : null;
    var vuoti = R.vuoti || [];
    var fut = R.mutante.futuro || [];
    inv.vuoti = vuoti.slice();
    inv.mese = mB; inv.giorno = dB; inv.ora = hB; inv.anno = yB;
    inv.shi = R.shi; inv.ying = R.ying;
    inv.trend = c.emaDir || null;

    // --- I PILASTRI E LE LORO BESTIE ---
    var pil = [['anno', c.yearStem, yB], ['mese', c.monthStem, mB], ['giorno', c.dayStem, dB], ['ora', c.hourStem, hB]];
    inv.pilastri = pil.filter(function (p) { return p[2]; }).map(function (p) {
      var b = p[1] ? BESTIA_STELO[p[1]] : null;
      var L = b ? R.linee.filter(function (Lx) { return Lx.bestia && Lx.bestia.cn === b; })[0] : null;
      return { nome: p[0], stelo: p[1] || null, ramo: p[2], el: WX[p[2]], steloEl: p[1] ? STELO_EL[p[1]] : null,
               bestia: b, bestiaIt: b ? BESTIA_IT[b] : null, vuoto: vuoti.indexOf(p[2]) >= 0, linea: L ? L.pos : null };
    });
    var ramiData = inv.pilastri.map(function (p) { return p.ramo; });

    // --- CHI SI MUOVE ---
    var movers = [];
    if (R.mutante.pos) movers.push({ pos: R.mutante.pos, dep: R.mutante.ramoDep, arr: R.mutante.ramoArr, tipo: 'mobile' });
    (R.incompatibili || []).forEach(function (p) {
      var L = R.linee[p - 1], a = fut[p - 1];
      if (L && a && a !== L.ramo) movers.push({ pos: p, dep: L.ramo, arr: a, tipo: 'incompatibile' });
    });
    movers.forEach(function (m) {
      var depE = WX[m.dep], arrE = WX[m.arr];
      m.relArrDep = rel(arrE, depE);                 // cosa fa l'arrivo alla partenza (genera indietro, controlla indietro...)
      m.progressione = AVANZA[m.dep] === m.arr ? 'avanza' : RETRO[m.dep] === m.arr ? 'retrocede' : null;
      m.arrVuoto = vuoti.indexOf(m.arr) >= 0;
      m.arrStagione = stagione(arrE, mE);
      m.arrTimely = m.arrStagione === '旺' || m.arrStagione === '相';
      m.giornoPartenza = azioni(dB, m.dep);
      m.giornoArrivo = azioni(dB, m.arr);
      m.oraPartenza = azioni(hB, m.dep);
      m.oraArrivo = azioni(hB, m.arr);
      m.meseArrivo = azioni(mB, m.arr);
      // cosa lo ferma (le regole del movimento, Edu 16/09 e 13/10)
      var blocchi = [];
      if (COMBINA[dB] === m.dep) blocchi.push('il giorno combina la partenza');
      if (CLASH[dB] === m.dep && m.tipo === 'mobile') blocchi.push('il giorno clasha la partenza');
      if (PENA[dB] === m.dep && m.tipo === 'mobile') blocchi.push('il giorno punisce la partenza');
      if (CLASH[mB] === m.dep && (m.pos === R.shi || m.pos === R.ying) && m.tipo === 'mobile') blocchi.push('il mese clasha la partenza (rotta dal mese)');
      if (m.arrVuoto && !(CLASH[dB] === m.arr) && !(CLASH[hB] === m.arr) && !m.arrTimely) blocchi.push('arriva nel vuoto');
      if (PENA[dB] === m.arr || (dB === m.arr && AUTOPENA[m.arr])) blocchi.push('il giorno punisce l\'arrivo');
      if (COMBINA[dB] === m.arr) blocchi.push('il giorno combina l\'arrivo (tenuto)');
      if (CLASH[dB] === m.arr && !m.arrVuoto) blocchi.push('il giorno clasha l\'arrivo (annullato, la partenza resta)');
      if (m.dep === m.arr) blocchi.push('gemito (伏吟)');
      if (CLASH[m.dep] === m.arr) blocchi.push('si clasha da sola (反吟)');
      if (m.arrVuoto && m.arrTimely) blocchi.push('arrivo vuoto ma di stagione');
      m.blocchi = blocchi;
      // cosa fa l'arrivo (e la partenza) alle altre linee: le tre porte di Edu (combinare, clashare, generare) e il resto
      m.versoLinee = R.linee.filter(function (L) { return L.pos !== m.pos; }).map(function (L) {
        var e = WX[L.ramo], a = [];
        if (COMBINA[m.arr] === L.ramo) a.push('combina');
        if (CLASH[m.arr] === L.ramo) a.push('clasha');
        if (PENA[m.arr] === L.ramo) a.push('punisce');
        if (m.arr === L.ramo) a.push(AUTOPENA[m.arr] ? 'raggiunge (stesso ramo) e la punisce (autopunizione)' : 'raggiunge (stesso ramo)');
        var ra = rel(arrE, e), LAB = { genera: 'la genera', drena: 'la drena', controlla: 'la controlla', controllata: 'ne e\' controllato' }; if (ra && ra !== 'stesso') a.push(LAB[ra]);
        if (TOMBA[e] === m.arr) a.push('ne e\' la tomba');
        var rd = rel(depE, e); if (rd === 'genera') a.push('la partenza la genera');
        return { pos: L.pos, sede: L.pos === R.shi ? 'S' : L.pos === R.ying ? 'Y' : null, azioni: a };
      }).filter(function (x) { return x.azioni.length; });
      m.parte = !blocchi.some(function (b) { return /partenza/.test(b) || b === 'arriva nel vuoto'; });
    });
    inv.movimenti = movers;
    var mossa = {}; movers.forEach(function (m) { mossa[m.pos] = m; });

    // --- LE LINEE ---
    var campo = function (pos) { return (pos <= 3) === (R.shi <= 3) ? 'S' : 'Y'; };
    inv.linee = R.linee.map(function (L) {
      var e = WX[L.ramo], st = stagione(e, mE);
      var x = { pos: L.pos, ramo: L.ramo, el: e, par: L.par, sede: L.pos === R.shi ? 'S' : L.pos === R.ying ? 'Y' : null,
                campo: campo(L.pos), stagione: st, timely: st === '旺' || st === '相',
                giornoSostiene: !!dE && (dE === e || GEN[dE] === e), giornoRel: rel(dE, e),
                giorno: azioni(dB, L.ramo), ora: azioni(hB, L.ramo), mese: azioni(mB, L.ramo), anno: azioni(yB, L.ramo),
                sulRamoDi: inv.pilastri.filter(function (p) { return p.ramo === L.ramo; }).map(function (p) { return p.nome; }),
                vuotoFormale: !!L.vuoto || vuoti.indexOf(L.ramo) >= 0, nascosta: L.fushen && L.fushen.b ? L.fushen.b : null,
                bestia: L.bestia ? L.bestia.cn : null, muove: mossa[L.pos] || null };
      x.moltoTimely = x.timely && x.giornoSostiene;
      // le bestie dei pilastri che cadono su questa linea
      x.bestie = inv.pilastri.filter(function (p) { return p.linea === L.pos; }).map(function (p) {
        return { pilastro: p.nome, stelo: p.stelo, ramo: p.ramo, el: p.el, vuoto: p.vuoto, rel: rel(p.el, e) };   // rel: cosa fa il ramo del pilastro alla linea
      });
      return x;
    });

    // --- CHI ESCE DAL VUOTO, E PERCHE' (tutte le vie dettate da Edu) ---
    inv.linee.forEach(function (x) {
      if (!x.vuotoFormale) { x.vuoto = false; x.esce = []; return; }
      var r = [];
      if (CLASH[dB] === x.ramo) r.push('clashata dal giorno');
      if (CLASH[hB] === x.ramo) r.push('clashata dall\'ora');
      if (x.ramo === hB && x.timely) r.push('porta il ramo dell\'ora (di stagione)');
      if (x.ramo === mB && x.ramo === yB) r.push('ramo del mese e dell\'anno');
      if (x.muove && x.timely) r.push('si muove ed e\' di stagione');
      if (x.muove && x.muove.arrTimely && !x.muove.arrVuoto) r.push('si muove verso un arrivo di stagione');
      x.bestie.forEach(function (b) { if (!b.vuoto && b.rel === 'genera') r.push('la bestia ' + (b.pilastro === 'ora' ? 'dell\'ora' : b.pilastro === 'anno' ? 'dell\'anno' : 'del ' + b.pilastro) + ' la genera'); });
      // possesso (se serve): bestia dello stesso elemento o che la genera, ramo non vuoto
      x.possessoPossibile = x.bestie.filter(function (b) { return !b.vuoto && (b.rel === 'stesso' || b.rel === 'genera'); }).map(function (b) { return b.pilastro; });
      // la linea accanto che si muove e la genera (sede molto di stagione)
      if (x.moltoTimely) movers.forEach(function (m) {
        if (Math.abs(m.pos - x.pos) === 1 && COMBINA[dB] !== m.dep && GEN[WX[m.dep]] === x.el) r.push('molto di stagione e L' + m.pos + ' accanto si muove e la genera');
      });
      x.esce = r; x.vuoto = r.length === 0;
    });

    // --- TRIGONI E RADUNI: ogni insieme di tre rami che si chiude fra linee, arrivi e data ---
    var fonti = [];
    inv.linee.forEach(function (x) { fonti.push({ b: x.ramo, chi: 'L' + x.pos, tipo: 'linea', pos: x.pos, vuoto: !!x.vuoto }); });
    movers.forEach(function (m) { fonti.push({ b: m.arr, chi: 'arrivo di L' + m.pos, tipo: 'arrivo', pos: m.pos, vuoto: m.arrVuoto && !m.arrTimely }); });
    inv.pilastri.forEach(function (p) { fonti.push({ b: p.ramo, chi: p.nome, tipo: 'data', pos: null, vuoto: p.vuoto }); });
    inv.linee.forEach(function (x) { if (x.nascosta) fonti.push({ b: x.nascosta, chi: 'nascosta di L' + x.pos, tipo: 'nascosta', pos: x.pos, vuoto: vuoti.indexOf(x.nascosta) >= 0 }); });
    var cerca = function (tab, nome) {
      var out = [];
      tab.forEach(function (t) {
        var per = t[0].map(function (b) { return fonti.filter(function (f) { return f.b === b; }); });
        if (per.some(function (l) { return !l.length; })) return;
        var conLinea = per.some(function (l) { return l.some(function (f) { return f.tipo !== 'data'; }); });
        if (!conLinea) return;   // tutto nella data: e' il flusso della data, non tocca le linee
        var membri = t[0].map(function (b, i) { return { ramo: b, da: per[i].map(function (f) { return f.chi + (f.vuoto ? ' (vuota)' : ''); }) }; });
        var sedi = ['S', 'Y'].filter(function (k) { var p = k === 'S' ? R.shi : R.ying; return per.some(function (l) { return l.some(function (f) { return f.tipo === 'linea' && f.pos === p; }); }); });
        var conMossa = per.some(function (l) { return l.some(function (f) { return f.tipo === 'arrivo' || (f.tipo === 'linea' && mossa[f.pos]); }); });
        out.push({ tipo: nome, rami: t[0], el: t[1], stagione: stagione(t[1], mE), giorno: rel(dE, t[1]), membri: membri, sedi: sedi, conMossa: conMossa,
                   versoS: rel(t[1], WX[R.linee[R.shi - 1].ramo]), versoY: rel(t[1], WX[R.linee[R.ying - 1].ramo]) });
      });
      return out;
    };
    inv.trigoni = cerca(TRIGONI, 'trigono');
    inv.raduni = cerca(RADUNI, 'raduno');
    // il raduno di stagione, generato dal giorno o del suo elemento, tiene fuori dal vuoto la linea che lo chiude
    // (Edu, 13/10/2026, USDCHF 29/06/2020: "Y è troppo timely per essere vuoto")
    inv.raduni.forEach(function (t) {
      if (!(t.stagione === '旺' || t.stagione === '相') || !(t.giorno === 'stesso' || t.giorno === 'genera')) return;
      inv.linee.forEach(function (x) {
        if (!x.vuoto || t.rami.indexOf(x.ramo) < 0) return;
        var altri = t.membri.filter(function (m) { return m.ramo !== x.ramo; });
        var daData = altri.some(function (m) { return m.da.some(function (d) { return /^(anno|mese|giorno|ora)$/.test(d); }); });
        var daLinea = altri.some(function (m) { return m.da.some(function (d) { return /^L\d$/.test(d); }); });
        if (daData && daLinea) { x.esce.push('chiude il raduno ' + t.rami.join('') + ', di stagione e col giorno'); x.vuoto = false; }
      });
    });

    // --- LA FORZA DI OGNI LINEA, E LA PIU' FORTE ---
    inv.linee.forEach(function (x) {
      var f = PESO[x.stagione] || 0;
      if (x.ramo === mB) f += 2; if (x.ramo === dB) f += 1; if (x.ramo === yB) f += 1;
      if (x.giornoSostiene) f += 1; else if (x.giornoRel === 'controlla' || x.giornoRel === 'drena') f -= 1;
      if (x.vuoto) f -= 2;
      x.forza = f;
    });
    var mx = Math.max.apply(null, inv.linee.map(function (x) { return x.forza; }));
    var top = inv.linee.filter(function (x) { return x.forza === mx; });
    inv.piuForte = top.length === 1 ? top[0].pos : null;

    // --- SHI CONTRO YING, COSI' COME STANNO ---
    var S = inv.linee[R.shi - 1], Y = inv.linee[R.ying - 1];
    inv.confronto = { SversoY: rel(S.el, Y.el), forzaS: S.forza, forzaY: Y.forza };
    var FRASE = { genera: 'genera', drena: 'drena', controlla: 'controlla', controllata: 'e\' controllato da', stesso: 'e\' dello stesso elemento di' };
    inv.confronto.frase = S.el && Y.el ? 'lo Shi ' + (FRASE[rel(S.el, Y.el)] || '?') + ' la Ying' : '';
    // le linee accanto a ogni sede e cosa le fanno (Edu, GBPUSD 07/10/2026: "S è forte ma viene indebolito da L2 che gli sta vicino")
    inv.vicine = {};
    ['S', 'Y'].forEach(function (k) {
      var X = k === 'S' ? S : Y;
      inv.vicine[k] = inv.linee.filter(function (z) { return Math.abs(z.pos - X.pos) === 1; }).map(function (z) {
        return { pos: z.pos, rel: rel(z.el, X.el), vuota: z.vuoto, muove: !!z.muove, forza: z.forza };
      });
    });

    // --- I PONTI: una sede genera qualcosa che genera l'altra linea (Edu: EURJPY 30/07/2024 la nascosta Zi fa da ponte fra Y
    // e L1; EURUSD 08/07/2021 lo Shen dell'ora fa da ponte fra S e Y) ---
    inv.ponti = [];
    ['S', 'Y'].forEach(function (k) {
      var X = k === 'S' ? S : Y;
      // ponte fra le due sedi attraverso un pilastro o una linea
      var O = k === 'S' ? Y : S;
      var medi = inv.pilastri.map(function (p) { return { b: p.ramo, chi: p.nome, el: p.el }; })
        .concat(inv.linee.filter(function (z) { return z.pos !== X.pos && z.pos !== O.pos && !z.vuoto; }).map(function (z) { return { b: z.ramo, chi: 'L' + z.pos, el: z.el }; }));
      medi.forEach(function (m) { if (GEN[X.el] === m.el && GEN[m.el] === O.el) inv.ponti.push({ da: k, a: k === 'S' ? 'Y' : 'S', via: m.chi + ' ' + RAMO_IT[m.b], el: m.el }); });
      // ponte dalla sede a una linea attraverso la sua nascosta
      inv.linee.forEach(function (z) {
        if (z.pos === X.pos || !z.nascosta) return; var ne = WX[z.nascosta];
        if (GEN[X.el] === ne && GEN[ne] === z.el) inv.ponti.push({ da: k, a: 'L' + z.pos, via: 'nascosta di L' + z.pos + ' ' + RAMO_IT[z.nascosta], el: ne });
      });
    });

    // --- IL FLUSSO DEL QI DELLA DATA (elementi dei quattro rami e steli, la catena di generazione piu' lunga) ---
    var elData = {}; inv.pilastri.forEach(function (p) { elData[p.el] = 1; if (p.steloEl) elData[p.steloEl] = 1; });   // Edu (EURUSD 17/06/2020) legge il flusso anche col mese vuoto
    var best = [];
    Object.keys(elData).forEach(function (e0) {
      var ch = [e0], e = e0; while (elData[GEN[e]] && ch.indexOf(GEN[e]) < 0) { e = GEN[e]; ch.push(e); }
      if (ch.length > best.length) best = ch;
    });
    inv.flusso = best;
    inv.flussoVerso = best.length ? { S: rel(best[best.length - 1], S.el), Y: rel(best[best.length - 1], Y.el) } : null;
    return inv;
  }

  function nomeL(inv, pos) { var x = inv.linee[pos - 1]; return 'L' + pos + (x.sede ? (x.sede === 'S' ? ' Shi' : ' Ying') : '') + ' ' + RAMO_IT[x.ramo] + ' ' + EL_IT[x.el]; }
  function testo(inv) {
    if (!inv || !inv.ok) return ['carta non leggibile'];
    var r = [];
    r.push('DATA: ' + inv.pilastri.map(function (p) { return p.nome + ' ' + (p.stelo || '') + p.ramo + (p.vuoto ? ' (vuoto)' : '') + (p.linea ? ' -> bestia su L' + p.linea : ''); }).join(' · ') + ' · vuoti ' + inv.vuoti.join(''));
    inv.linee.slice().reverse().forEach(function (x) {
      var s = nomeL(inv, x.pos) + ' [' + (x.stagione || '?') + (x.moltoTimely ? ', molto di stagione' : '') + ', forza ' + x.forza + ']';
      if (x.vuotoFormale) s += x.vuoto ? ' VUOTA' : ' vuota ma esce: ' + x.esce.join('; ');
      if (x.possessoPossibile && x.possessoPossibile.length && x.vuotoFormale) s += ' · possesso possibile: ' + x.possessoPossibile.join(', ');
      ['giorno', 'ora', 'mese', 'anno'].forEach(function (k) { if (x[k].length) s += ' · ' + k + ': ' + x[k].join(', '); });
      if (x.giornoRel) s += ' · il giorno ' + ({ stesso: 'la sostiene (stesso elemento)', genera: 'la genera', drena: 'la drena', controlla: 'la controlla', controllata: 'ne e\' controllato' })[x.giornoRel];
      if (x.bestie.length) s += ' · bestie: ' + x.bestie.map(function (b) { return b.pilastro + ' ' + (b.stelo || '') + b.ramo + (b.vuoto ? ' vuoto' : '') + (b.rel ? ' (' + b.rel + ')' : ''); }).join(', ');
      if (x.nascosta) s += ' · nascosta ' + RAMO_IT[x.nascosta];
      if (x.muove) s += ' · SI MUOVE (' + x.muove.tipo + ') -> ' + RAMO_IT[x.muove.arr] + ' ' + EL_IT[WX[x.muove.arr]] + (x.muove.progressione ? ', ' + x.muove.progressione : '') + (x.muove.relArrDep ? ', l\'arrivo ' + x.muove.relArrDep + ' la partenza' : '') + (x.muove.blocchi.length ? ' · ' + x.muove.blocchi.join('; ') : '') +
        (x.muove.versoLinee.length ? ' · verso: ' + x.muove.versoLinee.map(function (v) { return 'L' + v.pos + (v.sede ? (v.sede === 'S' ? ' Shi' : ' Ying') : '') + ' ' + v.azioni.join('/'); }).join(', ') : '');
      r.push(s);
    });
    inv.trigoni.concat(inv.raduni).forEach(function (t) {
      r.push(t.tipo.toUpperCase() + ' ' + t.rami.join('') + ' ' + EL_IT[t.el] + ' [' + (t.stagione || '?') + (t.giorno ? ', giorno ' + t.giorno : '') + ']: ' +
        t.membri.map(function (m) { return m.ramo + '=' + m.da.join('/'); }).join(' + ') + (t.sedi.length ? ' · contiene ' + t.sedi.join(' e ') : '') +
        (t.conMossa ? ' · con una linea che si muove' : '') + ' · verso Shi: ' + (t.versoS || '-') + ', verso Ying: ' + (t.versoY || '-'));
    });
    var LV = { genera: 'la genera', drena: 'la drena', controlla: 'la controlla', controllata: 'ne e\' controllata', stesso: 'stesso elemento' };
    ['S', 'Y'].forEach(function (k) { if (inv.vicine[k].length) r.push('ACCANTO ' + (k === 'S' ? 'allo Shi' : 'alla Ying') + ': ' + inv.vicine[k].map(function (v) { return nomeL(inv, v.pos) + ' ' + (LV[v.rel] || '-') + (v.muove ? ' (si muove)' : '') + (v.vuota ? ' (vuota)' : ''); }).join(' · ')); });
    r.push('PIU\' FORTE: ' + (inv.piuForte ? nomeL(inv, inv.piuForte) : 'nessuna netta') + ' · ' + inv.confronto.frase + ' · forza S ' + inv.confronto.forzaS + ' Y ' + inv.confronto.forzaY);
    if (inv.ponti.length) r.push('PONTI: ' + inv.ponti.map(function (p) { return (p.da === 'S' ? 'Shi' : 'Ying') + ' -> ' + p.via + ' -> ' + (p.a === 'S' ? 'Shi' : p.a === 'Y' ? 'Ying' : p.a); }).join(' · '));
    r.push('FLUSSO DELLA DATA: ' + inv.flusso.map(function (e) { return EL_IT[e]; }).join(' -> ') + (inv.flussoVerso ? ' · verso Shi: ' + (inv.flussoVerso.S || '-') + ', verso Ying: ' + (inv.flussoVerso.Y || '-') : ''));
    return r;
  }

  return { inventario: inventario, testo: testo, rel: rel, stagione: stagione };
}));
