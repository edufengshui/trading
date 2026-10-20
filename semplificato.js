// semplificato.js — IL METODO SEMPLIFICATO (S58, Edu 20/10/2026): solo la linea mobile e cosa le fanno giorno e mese, letta
// rispetto al trend. 62 regole trovate su tutto il backtest (3.309 carte 2020 - 16/10/2026, 66,4%; costruito sul
// 2020-23 il metodo fa 49,9% sul 2024-26). Ultimo gradino della piramide DLR (Edu: "deve entrare nella piramide"), solo sulle carte
// dove nessun altro gradino decide. Regole FISSE dal 20/10/2026: si misurano dal vivo. Rigenerare con semplificato_genera.js.
// Uso: Semplificato.leggi(R, dayBranch, monthBranch, emaDir) -> { dir, segue, regola }
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Semplificato = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var REGOLE = [[["arrivo vuoto","il mese combina la partenza"],0,42,73.8],[["il giorno e' controllato da l'arrivo","il giorno combina la partenza"],1,55,72.7],[["mobile W","il giorno clasha la partenza"],0,46,71.7],[["mobile = Ying","il mese stesso ramo la partenza"],0,40,70],[["mobile B","il giorno punisce l'arrivo"],1,41,70.7],[["partenza morta","partenza vuota"],0,104,69.2],[["partenza a riposo","il giorno combina l'arrivo"],1,41,68.3],[["mobile su L1","il mese clasha la partenza"],1,41,68.3],[["partenza in crescita","il giorno stesso ramo la partenza"],1,59,67.8],[["il giorno drena l'arrivo","il mese stesso ramo l'arrivo"],0,40,67.5],[["il giorno drena l'arrivo","partenza prigioniera"],0,108,67.6],[["il giorno drena l'arrivo","mobile su L2"],1,48,66.7],[["l'arrivo e' controllato da la partenza","il giorno danneggia (害) l'arrivo"],0,46,67.4],[["il giorno drena la partenza","il giorno punisce l'arrivo"],1,43,67.4],[["l'arrivo genera la partenza","il mese clasha la partenza"],1,45,66.7],[["il giorno danneggia (害) la partenza","partenza prigioniera"],0,42,66.7],[["mobile su L6","arrivo prigioniera"],0,74,66.2],[["mobile G","mobile su L5"],0,59,66.1],[["arrivo in crescita","il giorno controlla l'arrivo"],0,107,66.4],[["arrivo vuoto","partenza prigioniera"],1,55,65.5],[["mobile su L4","partenza prigioniera"],0,43,69.8],[["l'arrivo genera la partenza","mobile su L6"],1,41,68.3],[["mobile su L6","il giorno genera la partenza"],1,49,67.3],[["il giorno controlla l'arrivo","l'arrivo danneggia (害) la partenza"],0,56,66.1],[["mobile C","il giorno controlla la partenza"],1,50,66],[["mobile C","arrivo in piena stagione"],0,49,69.4],[["il giorno e' controllato da la partenza","l'arrivo danneggia (害) la partenza"],1,48,68.8],[["mobile nel trigramma alto","l'arrivo punisce la partenza"],0,45,66.7],[["arrivo morta","il giorno stesso elemento l'arrivo"],0,73,68.5],[["partenza vuota","il giorno stesso elemento l'arrivo"],1,51,64.7],[["mobile su L3","il giorno stesso elemento l'arrivo"],1,40,65],[["arrivo in crescita","il giorno controlla la partenza"],0,50,68],[["mobile su L3","il giorno controlla la partenza"],0,48,64.6],[["mobile su L3","arrivo in piena stagione"],1,63,65.1],[["il giorno genera l'arrivo","arrivo prigioniera"],1,69,63.8],[["mobile su L3","arrivo prigioniera"],0,40,67.5],[["mobile yang -> yin","partenza vuota"],0,69,65.2],[["il giorno e' controllato da l'arrivo","l'arrivo drena la partenza"],1,49,65.3],[["mobile yang -> yin","il mese stesso ramo l'arrivo"],0,42,66.7],[["il giorno drena la partenza","arrivo in piena stagione"],1,49,69.4],[["partenza in crescita","il mese danneggia (害) la partenza"],1,43,65.1],[["movimento libero","arrivo in piena stagione"],0,77,64.9],[["mobile P","l'arrivo drena la partenza"],1,40,67.5],[["partenza a riposo","mobile G"],1,43,67.4],[["arrivo morta","mobile su L5"],1,42,64.3],[["partenza in piena stagione","mobile su L5"],0,44,65.9],[["il giorno controlla l'arrivo","arrivo prigioniera"],1,46,65.2],[["mobile B","partenza in crescita"],1,42,64.3],[["mobile su L3","mobile B"],1,52,63.5],[["partenza morta","il giorno genera la partenza"],0,45,64.4],[["mobile G","l'arrivo stesso elemento la partenza"],1,44,63.6],[["mobile non sede","il giorno e' controllato da l'arrivo"],0,68,69.1],[["mobile yin -> yang","partenza prigioniera"],0,48,64.6],[["mobile non sede","mobile C"],1,42,71.4],[["movimento libero","arrivo prigioniera"],0,56,64.3],[["mobile yang -> yin","il giorno controlla l'arrivo"],0,52,61.5],[["REGOLA 1 di Edu: movimento bloccato (giorno o mese)","l'arrivo genera la partenza"],1,46,60.9],[["mobile nel trigramma basso","partenza morta"],1,40,60],[["il giorno genera l'arrivo","movimento libero"],1,43,62.8],[["il giorno e' controllato da la partenza"],0,47,63.8],[["il giorno drena l'arrivo"],1,66,60.6],[["movimento libero"],0,53,60.4]];
  var WX = { '子':'Acqua','丑':'Terra','寅':'Legno','卯':'Legno','辰':'Terra','巳':'Fuoco','午':'Fuoco','未':'Terra','申':'Metallo','酉':'Metallo','戌':'Terra','亥':'Acqua' };
  var GEN = { Legno:'Fuoco', Fuoco:'Terra', Terra:'Metallo', Metallo:'Acqua', Acqua:'Legno' }, KE = { Legno:'Terra', Terra:'Acqua', Acqua:'Fuoco', Fuoco:'Metallo', Metallo:'Legno' };
  var CL = { '子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳' };
  var HE = { '子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯','辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午' };
  var HAI = { '子':'未','未':'子','丑':'午','午':'丑','寅':'巳','巳':'寅','卯':'辰','辰':'卯','申':'亥','亥':'申','酉':'戌','戌':'酉' };
  var XING = { '寅':'巳','巳':'申','申':'寅','丑':'戌','戌':'未','未':'丑','子':'卯','卯':'子' };
  var AV = { '寅':'卯','卯':'辰','巳':'午','午':'未','申':'酉','酉':'戌','亥':'子','子':'丑' }, RE = {}; Object.keys(AV).forEach(function (k) { RE[AV[k]] = k; });
  function stg(b, m) { var e = WX[b], s = WX[m]; return e === s ? 'in piena stagione' : GEN[s] === e ? 'in crescita' : GEN[e] === s ? 'a riposo' : KE[s] === e ? 'morta' : 'prigioniera'; }
  function rel(x, b) { var r = []; if (x === b) r.push('stesso ramo'); if (HE[x] === b) r.push('combina'); if (CL[x] === b) r.push('clasha'); if (HAI[x] === b) r.push('danneggia (害)'); if (XING[x] === b) r.push('punisce');
    var a = WX[x], e = WX[b]; if (a === e) r.push('stesso elemento'); else if (GEN[a] === e) r.push('genera'); else if (KE[a] === e) r.push('controlla'); else if (GEN[e] === a) r.push('drena'); else if (KE[e] === a) r.push('e\' controllato da'); return r; }
  function caratteristiche(R, giorno, mese) {
    var m = R.mutante, L = R.linee[m.pos - 1], d = m.ramoDep, a = m.ramoArr, f = {}, v = R.vuoti || [];
    rel(a, d).forEach(function (x) { f['l\'arrivo ' + x + ' la partenza'] = 1; });
    if (AV[d] === a) f['la mobile avanza'] = 1; if (RE[d] === a) f['la mobile retrocede'] = 1;
    f['partenza ' + stg(d, mese)] = 1; f['arrivo ' + stg(a, mese)] = 1;
    if (v.indexOf(d) >= 0) f['partenza vuota'] = 1; if (v.indexOf(a) >= 0) f['arrivo vuoto'] = 1;
    f['mobile su L' + m.pos] = 1; f['mobile nel trigramma ' + (m.pos >= 4 ? 'alto' : 'basso')] = 1; f['mobile ' + (L.yang ? 'yang -> yin' : 'yin -> yang')] = 1;
    f['mobile ' + L.par] = 1; if (L.isShi) f['mobile = Shi'] = 1; if (L.isYing) f['mobile = Ying'] = 1; if (!L.isShi && !L.isYing) f['mobile non sede'] = 1;
    rel(giorno, d).forEach(function (x) { f['il giorno ' + x + ' la partenza'] = 1; }); rel(giorno, a).forEach(function (x) { f['il giorno ' + x + ' l\'arrivo'] = 1; });
    rel(mese, d).forEach(function (x) { f['il mese ' + x + ' la partenza'] = 1; }); rel(mese, a).forEach(function (x) { f['il mese ' + x + ' l\'arrivo'] = 1; });
    var tocca = function (x, b) { return HE[x] === b || CL[x] === b; };
    if ([giorno, mese].some(function (x) { return tocca(x, d) || tocca(x, a); })) f['REGOLA 1 di Edu: movimento bloccato (giorno o mese)'] = 1; else f['movimento libero'] = 1;
    return f;
  }
  function leggi(R, giorno, mese, emaDir) {
    var out = { dir: null, segue: null, regola: null };
    if (!R || R.error || !R.mutante || !R.mutante.pos || !giorno || !mese || !emaDir) return out;
    var f = caratteristiche(R, giorno, mese), up = emaDir === 'up' || emaDir === 'LONG';
    for (var i = 0; i < REGOLE.length; i++) { var g = REGOLE[i]; if (g[0].every(function (k) { return f[k]; })) {
      out.segue = g[1] === 1; out.dir = (out.segue ? up : !up) ? 'LONG' : 'SHORT';
      out.regola = 'regola ' + (i + 1) + ': se ' + g[0].join(' e ') + ' -> ' + (g[1] ? 'segue il trend' : 'opposto al trend') + ' (' + g[2] + ' carte, ' + g[3] + '%)'; return out; } }
    out.regola = 'nessuna regola'; return out;
  }
  return { leggi: leggi, caratteristiche: caratteristiche, regole: REGOLE };
}));
