// colpo_mese.js — IL COLPO DEL MESE (S58, 19/10/2026). Dalla tavola della data (tavola_data.js, M9), cablato su richiesta
// di Edu ("Ok, allora devi cablarlo, non aspettare, e vedi il totale quanto migliora").
// Il mese COLPISCE una sede quando: la bestia del pilastro del mese cade sulla Shi o sulla Ying e il ramo del mese ne
// controlla l'elemento, oppure il ramo del mese combina (六合) la sede e ne controlla l'elemento. La sede colpita perde,
// vince l'altra (Shi in alto che vince -> LONG). Se il mese colpisce tutte e due le sedi, o nessuna, tace.
// Misura (3.375 carte >= 20 pip, 2020 - 16/10/2026): 307 carte, 58,6%, 59% in tutti e due i periodi; LY sulle stesse 52,6%.
// Coerente con la dottrina: "anno e mese NON clashano una linea, le bestie si intromettono" (09/09); "se controllano o
// clashano si impadroniscono della linea" (16/09). Il clash del mese su una sede NON conta (601 carte, 49,8%).
// Uso: ColpoMese.leggi(inv, monthBranch) -> { dir, colpita: 'S'|'Y'|null, perche }   (inv = InventarioCarta.inventario)
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ColpoMese = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var WX = { '子':'Water','丑':'Earth','寅':'Wood','卯':'Wood','辰':'Earth','巳':'Fire','午':'Fire','未':'Earth','申':'Metal','酉':'Metal','戌':'Earth','亥':'Water' };
  var KE = { Wood:'Earth', Earth:'Water', Water:'Fire', Fire:'Metal', Metal:'Wood' };
  var COMB = { '子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯','辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午' };
  function colpo(L, m) {
    if (!L) return null;
    if ((L.bestie || []).some(function (b) { return b.pilastro === 'mese' && b.rel === 'controlla'; })) return 'la bestia del mese cade su L' + L.pos + ' e la controlla';
    if (COMB[m] === L.ramo && KE[WX[m]] === L.el) return 'il mese combina L' + L.pos + ' e la controlla';
    return null;
  }
  function leggi(inv, m) {
    var out = { dir: null, colpita: null, perche: null };
    if (!inv || !inv.linee || !inv.shi || !inv.ying || !m) return out;
    var S = inv.linee[inv.shi - 1], Y = inv.linee[inv.ying - 1], cs = colpo(S, m), cy = colpo(Y, m);
    if (!!cs === !!cy) return out;
    out.colpita = cs ? 'S' : 'Y';
    var vince = cs ? inv.ying : inv.shi;
    out.dir = vince >= 4 ? 'LONG' : 'SHORT';
    out.perche = (cs ? 'Shi colpito: ' + cs : 'Ying colpita: ' + cy) + ' -> vince ' + (cs ? 'la Ying' : 'lo Shi');
    return out;
  }
  return { leggi: leggi };
}));
