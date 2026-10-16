// lettore_ordine.js — IL LETTORE NELL'ORDINE DI EDU (S57, 16/10/2026)
// Legge l'inventario (inventario_carta.js) facendo a ogni carta le stesse domande, sempre nello stesso ordine:
//   1. fuori gioco (tace)  2. il movimento  3. le bestie e la difesa della sede vuota  4. Shi contro Ying come stanno
//   5. la linea piu' forte  6. il flusso del Qi della data.
// Prima si cerca se vince lo Shi (il trend); la Ying solo se e' in palese vantaggio (Edu, 11/10/2026).
// Esito come lettura_trend.js: { dir, verdetto ('segue'|'non segue'|null), passo, racconto[] }.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./inventario_carta.js'));
  else root.LettoreOrdine = factory(root.InventarioCarta);
}(typeof self !== 'undefined' ? self : this, function (IV) {
  'use strict';
  var WX = { '子':'Water','丑':'Earth','寅':'Wood','卯':'Wood','辰':'Earth','巳':'Fire','午':'Fire','未':'Earth','申':'Metal','酉':'Metal','戌':'Earth','亥':'Water' };
  var GEN = { Wood:'Fire', Fire:'Earth', Earth:'Metal', Metal:'Water', Water:'Wood' };
  var KE  = { Wood:'Earth', Earth:'Water', Water:'Fire', Fire:'Metal', Metal:'Wood' };
  var CLASH = { '子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳' };
  var COMBINA = { '子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯','辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午' };
  var RAMO_IT = { '子':'Zi','丑':'Chou','寅':'Yin','卯':'Mao','辰':'Chen','巳':'Si','午':'Wu','未':'Wei','申':'Shen','酉':'You','戌':'Xu','亥':'Hai' };
  var EL_IT = { Water:'Acqua', Wood:'Legno', Fire:'Fuoco', Earth:'Terra', Metal:'Metallo' };
  var NOME = { S: 'lo Shi', Y: 'la Ying' }, ALTRA = { S: 'Y', Y: 'S' };

  function leggi(R, ctx, opz) {
    opz = opz || {};
    var out = { dir: null, verdetto: null, passo: null, racconto: [] };
    var inv = IV.inventario(R, ctx);
    out.inv = inv;
    if (!inv.ok || !R.mutante || !R.mutante.pos) { out.racconto.push('carta non leggibile'); return out; }
    var dire = function (t) { out.racconto.push(t); };
    var L = function (pos) { return inv.linee[pos - 1]; };
    var SEDE = { S: L(inv.shi), Y: L(inv.ying) };
    var POS = { S: inv.shi, Y: inv.ying };
    var mB = inv.mese, mE = mB ? WX[mB] : null;
    var vince = function (k, perche, passo) {
      dire(perche); out.passo = passo; out.vince = k;
      out.verdetto = k === 'S' ? 'segue' : 'non segue';
      if (ctx.emaDir) out.dir = (ctx.emaDir === 'up') === (k === 'S') ? 'LONG' : 'SHORT';
      return out;
    };
    var tace = function (perche, passo) { dire(perche); out.passo = passo; return out; };
    var nl = function (x) { return 'L' + x.pos + ' ' + RAMO_IT[x.ramo]; };

    // ---------------- 1. FUORI GIOCO ----------------
    var fut = R.mutante.futuro || [];
    var muove = {}; inv.movimenti.forEach(function (m) { muove[m.pos] = m; });
    for (var tg = 0; tg < 2; tg++) {
      var tr = tg ? [4, 5, 6] : [1, 2, 3];
      if (fut.length && tr.some(function (p) { return muove[p]; }) && tr.every(function (p) { return CLASH[L(p).ramo] === fut[p - 1]; }))
        return tace('il trigramma ' + (tg ? 'alto' : 'basso') + ' è in confusione totale: il metodo tace', 1);
    }
    var troppoFuori = function (x) { return x.stagione === '囚' || x.stagione === '死'; };
    if (troppoFuori(SEDE.S) && troppoFuori(SEDE.Y) && !opz.fuoriAncheDeboli) return tace('Shi e Ying tutti e due troppo fuori stagione: il metodo tace', 1);

    // ---------------- 2. IL MOVIMENTO ----------------
    // chi si muove davvero: non legato alla partenza dal giorno, non clashato alla partenza dal giorno (la mobile), non
    // punito alla partenza dal giorno, non nel vuoto (salvo arrivo di stagione o clashato dal giorno/ora)
    var FERMA = function (b) { return /^il giorno (combina|clasha|punisce) la partenza$/.test(b) || /rotta dal mese/.test(b) || b === 'arriva nel vuoto' || /gemito/.test(b); };
    var vivi = inv.movimenti.filter(function (m) {
      return !m.blocchi.some(FERMA);
    });
    var morti = inv.movimenti.filter(function (m) { return vivi.indexOf(m) < 0; });
    morti.forEach(function (m) { dire(nl(L(m.pos)) + ' non si muove davvero: ' + m.blocchi.filter(FERMA).join('; ')); });
    var pt = { S: 0, Y: 0 }, mosso = false;
    var punti = function (k, n, t) { pt[k] += n; mosso = true; dire(t); };
    var forteNelMese = function (b) { var e = WX[b]; return !!mE && (e === mE || GEN[mE] === e); };
    var difende = function (k, arr) { var X = SEDE[k]; return X.timely && (X.ramo === mB || !forteNelMese(arr)); };
    var vuotaFerma = function (k) { return SEDE[k].vuoto && !muove[POS[k]]; };
    var sedeScartata = {};

    vivi.forEach(function (m) {
      var x = L(m.pos), kSede = x.sede, kCampo = x.campo, arrAnnullato = m.blocchi.some(function (b) { return /annullato/.test(b); });
      var arrPunito = m.blocchi.some(function (b) { return /punisce l'arrivo/.test(b); });
      var effArr = !arrAnnullato && !arrPunito;   // l'arrivo agisce
      // a) la sede che si muove: cosa fa a se stessa
      if (kSede) {
        if (m.arrVuoto && !m.arrTimely && !(CLASH[inv.giorno] === m.arr) && !(CLASH[inv.ora] === m.arr)) { sedeScartata[kSede] = true; dire(NOME[kSede] + ' si muove nel vuoto: scartat' + (kSede === 'S' ? 'o' : 'a')); return; }
        if (effArr && m.relArrDep === 'genera') punti(kSede, 1, NOME[kSede] + ' si muove e si fa generare indietro da ' + RAMO_IT[m.arr] + ': rafforzat' + (kSede === 'S' ? 'o' : 'a'));
        if (effArr && m.relArrDep === 'controlla') punti(kSede, -1, NOME[kSede] + ' si muove e ' + RAMO_IT[m.arr] + ' la controlla indietro: indebolit' + (kSede === 'S' ? 'o' : 'a'));
        if (arrPunito && !opz.penaSenzaDanno) dire(NOME[kSede] + ': il giorno punisce l\'arrivo, il movimento muore e la sede resta se stessa');
      }
      // la mobile non sede generata indietro (e forte nel mese) rafforza il suo campo (Edu, USDCAD 22/09/2026: "L5 is already
      // strong and moves to generate itself in the S camp")
      if (!kSede && effArr && m.relArrDep === 'genera' && x.timely) punti(kCampo, 1, nl(x) + ' si fa generare indietro, già forte: rafforza il campo ' + (kCampo === 'S' ? 'dello Shi' : 'della Ying'));
      // la partenza che genera una sede la nutre (anche se l'arrivo non agisce): GBPUSD 08/09/2022 ("la linea immediatamente
      // superiore si muove per generarla")
      ['S', 'Y'].forEach(function (k) {
        if (POS[k] === m.pos) return;
        if (GEN[WX[m.dep]] === SEDE[k].el && !vuotaFerma(k)) punti(k, 1, 'la partenza ' + RAMO_IT[m.dep] + ' di L' + m.pos + ' genera ' + NOME[k]);
      });
      // l'arrivo che punisce una sede la colpisce anche se il giorno ne punisce l'arrivo (Edu, USDJPY 06/10/2026: "L4 si muove
      // per penalizzare Y")
      if (arrPunito && !arrAnnullato) ['S', 'Y'].forEach(function (k) {
        if (POS[k] !== m.pos && m.versoLinee.some(function (z) { return z.pos === POS[k] && z.azioni.indexOf('punisce') >= 0; }) && !vuotaFerma(k)) punti(k, -1, 'L' + m.pos + ' si muove per punire ' + NOME[k]);
      });
      if (!effArr) return;
      // b) cosa fa l'arrivo alle sedi
      ['S', 'Y'].forEach(function (k) {
        if (POS[k] === m.pos) return;
        var v = m.versoLinee.filter(function (z) { return z.pos === POS[k]; })[0]; if (!v) return;
        var A = v.azioni, has = function (t) { return A.some(function (a) { return a.indexOf(t) === 0; }); }, proprio = kCampo === k;
        var az = A.join('/');
        if (has('la genera')) {
          if (vuotaFerma(k)) { dire('l\'arrivo ' + RAMO_IT[m.arr] + ' di L' + m.pos + ' genererebbe ' + NOME[k] + ', ma ' + NOME[k] + ' è vuot' + (k === 'S' ? 'o' : 'a') + ' e ferm' + (k === 'S' ? 'o' : 'a') + ': non riceve'); }
          else punti(k, 1, 'L' + m.pos + ' si muove in ' + RAMO_IT[m.arr] + ' e genera ' + NOME[k]);
        }
        var pun = has('punisce') || (/la punisce/.test(az) && !!kSede), tom = /tomba/.test(az);   // raggiungere lo stesso ramo che si punisce colpisce solo se a muoversi e' una sede (AUDUSD 24/09/2026)
        if ((has('clasha') || has('la controlla') || pun || tom) && !vuotaFerma(k)) {
          if (difende(k, m.arr) && !pun && !tom) dire(NOME[k] + ' è di stagione: non si lascia colpire da ' + RAMO_IT[m.arr]);
          else punti(k, -1, 'L' + m.pos + ' si muove in ' + RAMO_IT[m.arr] + ' e ' + (has('clasha') ? 'clasha' : pun ? 'punisce' : tom ? 'diventa la tomba di' : 'controlla') + ' ' + NOME[k]);
        }
        if (has('la drena') && !vuotaFerma(k) && !proprio) {
          if (difende(k, m.arr)) dire(NOME[k] + ' è di stagione: non si lascia drenare da ' + RAMO_IT[m.arr]);
          else punti(k, -1, 'L' + m.pos + ' si muove in ' + RAMO_IT[m.arr] + ' e drena ' + NOME[k]);
        }
      });
    });
    // c) i trigoni chiusi da linee che si muovono: sostengono la sede che ne fa parte, generano o colpiscono le sedi
    inv.trigoni.forEach(function (t) {
      if (!t.conMossa) return;
      var conVivo = t.membri.some(function (mm) { return mm.da.some(function (d) { var q = /L(\d)/.exec(d); return q && vivi.some(function (v) { return v.pos === +q[1]; }); }); });
      if (!conVivo) return;
      ['S', 'Y'].forEach(function (k) {
        var r = k === 'S' ? t.versoS : t.versoY;
        if (r === 'genera' && !vuotaFerma(k)) punti(k, 1, 'il trigono ' + t.rami.join('') + ' di ' + EL_IT[t.el] + ', chiuso da una linea che si muove, genera ' + NOME[k]);
        if (t.sedi.indexOf(k) >= 0 && r === 'stesso') punti(k, 1, NOME[k] + ' sta nel trigono ' + t.rami.join('') + ' chiuso da una linea che si muove: sostenut' + (k === 'S' ? 'o' : 'a'));
        if (r === 'drena' && t.sedi.indexOf(ALTRA[k]) >= 0) punti(k, -1, 'il trigono ' + t.rami.join('') + ' drena ' + NOME[k]);
      });
    });
    // sede scartata nel vuoto: vince l'altra, salvo un sostituto del suo campo (sotto)
    // I DUE ANIMALI SULLA BILANCIA (Edu, 16/10/2026: "quando devi decidere tu come va un trade, fra i punti da considerare
    // che possono far pendere l'ago della bilancia da una parte e dall'altra, metti questi due animali"): il Serpente morto
    // (死) sulla Shi, sulla Ying o sulla mobile pesa contro il trend (la Ying); l'Uccello Rosso in crescita (相) sulla
    // mobile pesa per il trend (lo Shi). Un punto ciascuno, come gli altri motivi. opz.dueAnimali === false spegne.
    if (opz.dueAnimali !== false) inv.linee.forEach(function (x) {
      var conta = x.sede || (muove[x.pos] && muove[x.pos].tipo === 'mobile');
      if (x.bestia === '螣蛇' && conta && x.stagione === '死') punti('Y', 1, 'il Serpente è morto su ' + nl(x) + ': l\'azione si attorciglia, pende contro il trend');
      if (x.bestia === '朱雀' && muove[x.pos] && muove[x.pos].tipo === 'mobile' && x.stagione === '相') punti('S', 1, 'l\'Uccello Rosso in crescita sulla mobile ' + nl(x) + ': pende per il trend');
    });
    var kSc = Object.keys(sedeScartata);
    if (kSc.length === 1 && pt.S === pt.Y) return vince(ALTRA[kSc[0]], NOME[kSc[0]] + ' è fuori gioco: vince l\'altra sede', 2);
    if (pt.S > pt.Y) return vince('S', 'il movimento avvantaggia lo Shi (' + pt.S + ' contro ' + pt.Y + ')', 2);
    if (pt.Y > pt.S) return vince('Y', 'il movimento avvantaggia la Ying (' + pt.Y + ' contro ' + pt.S + ')', 2);

    // ---------------- 3. LE BESTIE E LA DIFESA DELLA SEDE VUOTA ----------------
    var vuote = ['S', 'Y'].filter(function (k) { return vuotaFerma(k) || sedeScartata[k]; });
    var rel = IV.rel;
    if (vuote.length) {
      var risp = null;
      vuote.forEach(function (k) {
        if (risp) return;
        var X = SEDE[k], O = SEDE[ALTRA[k]];
        // a) possesso: la bestia di un pilastro (ramo non vuoto) dello stesso elemento o che la genera
        var pos = X.bestie.filter(function (b) { return !b.vuoto && (b.rel === 'stesso' || b.rel === 'genera'); })[0];
        if (pos) {
          var r = rel(X.el, O.el);
          dire('la bestia del ' + pos.pilastro + ' ' + (pos.stelo || '') + pos.ramo + ' prende possesso di ' + NOME[k] + ' vuot' + (k === 'S' ? 'o' : 'a'));
          if (r === 'controlla' || rel(O.el, X.el) === 'genera') { risp = vince(k, NOME[k] + ', posseduto, ' + (r === 'controlla' ? 'controlla' : 'è generato da') + ' ' + NOME[ALTRA[k]] + ': vince', 3); return; }
        }
        // b) la linea piu' forte del suo campo, attiva (clashata dal giorno o dall'ora), la difende
        var attive = inv.linee.filter(function (z) { return z.campo === k && z.pos !== X.pos && !z.vuoto && (z.giorno.indexOf('clash') >= 0 || z.ora.indexOf('clash') >= 0) && z.timely; });
        attive.sort(function (a, b) { return b.forza - a.forza; });
        if (attive.length && (attive.length === 1 || attive[0].forza > attive[1].forza)) {
          var D = attive[0], r2 = rel(D.el, O.el), r3 = rel(O.el, D.el);
          if (r2 === 'controlla' || r3 === 'genera') { risp = vince(k, 'il campo vuoto di ' + NOME[k] + ' è difeso da ' + nl(D) + ', la linea più forte e attiva: vince', 3); return; }
          if (r3 === 'controlla' || r2 === 'genera') { risp = vince(ALTRA[k], 'il campo vuoto di ' + NOME[k] + ' è difeso da ' + nl(D) + ', ma ' + NOME[ALTRA[k]] + ' la batte: vince', 3); return; }
        }
        // c) il ponte della nascosta: l'altra sede genera la nascosta che genera una linea del campo vuoto
        var pn = inv.ponti.filter(function (p) { return p.da === ALTRA[k] && /^L\d$/.test(p.a) && L(+p.a.slice(1)).campo === k; })[0];
        if (pn) { risp = vince(k, NOME[k] + ' è vuot' + (k === 'S' ? 'o' : 'a') + ': la difende ' + pn.a + ', la cui ' + pn.via + ' fa da ponte: vince', 3); return; }
      });
      if (risp) return risp;
      if (vuote.length === 1) return vince(ALTRA[vuote[0]], NOME[vuote[0]] + ' è vuot' + (vuote[0] === 'S' ? 'o' : 'a') + ' e niente l' + (vuote[0] === 'S' ? 'o' : 'a') + ' difende: vince l\'altra sede', 3);
      return tace('tutte e due le sedi sono vuote e niente decide: il metodo tace', 3);
    }

    // ---------------- 4. SHI CONTRO YING COME STANNO ----------------
    var S = SEDE.S, Y = SEDE.Y, r4 = rel(S.el, Y.el);
    if (r4 === 'controlla') return vince('S', 'lo Shi controlla la Ying: vince', 4);
    if (r4 === 'controllata') return vince('Y', 'la Ying controlla lo Shi: vince', 4);
    if (r4 === 'drena') return vince('S', 'la Ying genera lo Shi: chi viene generato vince', 4);
    if (r4 === 'genera') return vince('Y', 'lo Shi genera la Ying: chi viene generato vince', 4);
    if (S.forza - Y.forza >= (opz.scarto || 2)) return vince('S', 'stesso elemento: lo Shi è molto più forte', 4);
    if (Y.forza - S.forza >= (opz.scarto || 2)) return vince('Y', 'stesso elemento: la Ying è molto più forte', 4);

    // ---------------- 5. LA LINEA PIU' FORTE ----------------
    if (inv.piuForte) { var P = L(inv.piuForte); return vince(P.campo, 'decide la linea più forte, ' + nl(P), 5); }

    // ---------------- 6. IL FLUSSO DEL QI DELLA DATA ----------------
    if (inv.flussoVerso) {
      var fS = inv.flussoVerso.S, fY = inv.flussoVerso.Y;
      if ((fS === 'genera' || fS === 'stesso') && !(fY === 'genera' || fY === 'stesso')) return vince('S', 'il flusso del Qi della data va verso lo Shi', 6);
      if ((fY === 'genera' || fY === 'stesso') && !(fS === 'genera' || fS === 'stesso')) return vince('Y', 'il flusso del Qi della data va verso la Ying', 6);
    }
    return tace('niente decide: il metodo tace', 6);
  }
  return { leggi: leggi };
}));
