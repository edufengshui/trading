// leggo_io.js — LEGGO IO PER METODI (S59, 22/10/2026). Edu: "Leggo Io deve leggere ciascun metodo da solo, sottoporlo a pro e
// contro dentro quell'unico metodo, trarre una conclusione e poi passare al successivo e ripetere il processo fino a giungere ad
// un ragionevole risultato finale" · "metti in pausa i sistemi che combinano vari metodi" (il sistema attuale non entra).
// Tre metodi, uno alla volta: LIU YAO (LY, lettura della carta, metodo del trend, colpo del mese, D, LY per forma), PLUM BLOSSOM
// (PB, PB per forma), DA LIU REN (DLR, DLR per forma). Dentro ogni metodo ogni argomento pesa ln(p/(1-p)), p = affidabilita'
// misurata prima del 2024 (la via del LY, il gradino della lettura, la via del DLR quando ci sono; le voci per forma sul 2022-23
// coi cataloghi del 2020-21); la conclusione del metodo ha l'affidabilita' della sua fascia di margine (2022-23). Poi le tre
// conclusioni si mettono insieme allo stesso modo. Si trada quando il margine finale supera la soglia (scelta sul 2022-23).
// Misura (leggo_io_misura.js): 2022-23 ~64%; 2024-26 (mai viste) 59-61%; dal vivo 29/09-22/10 51%. Metodi da soli 2024-26:
// LY 55,3% · PB 53,1% · DLR 60,7%; dal vivo LY 61% · PB 52% · DLR 47,5%.
// Uso: LeggoIo.leggi({ PB, LY, DLR, LETT, MT, CM, D, LYF, PBF, DLRF, lySez, lettGrad, dlrVia }) -> { dir, margine, forza, metodi, racconto }
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LeggoIo = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // METODO DEL TREND A DORMIRE (Edu, 23/10/2026: "Mettili a dormire allora"): MT esce dal metodo LY (il semplificato non c'era).
  // Dal vivo 29/09-22/10: con MT 95 · 63% · +1.417; senza 97 · 63% · +1.486. localStorage CON_MT=1 lo rimette.
  var FAM = {"LY":["LY","LETT","CM","D","LYF"],"PB":["PB","PBF"],"DLR":["DLR","DLRF"]}, ROUTE = {"LY":"lySez","LETT":"lettGrad","DLR":"dlrVia"};
  var P = {"LY":0.571,"LETT":0.526,"MT":0.537,"CM":0.571,"D":0.516,"LYF":0.522,"PB":0.542,"PBF":0.574,"DLR":0.603,"DLRF":0.508};
  var PR = {"LY":{"—":0.564,"合全":0.637,"§94":0.561,"§52":0.591,"§64":0.637,"§115":0.53,"§68":0.548,"§137":0.538,"§120":0.514,"scala":0.548,"日沖":0.597,"暗動":0.556,"§125":0.56,"§129":0.553,"§111":0.648,"§53c":0.616,"§49":0.502,"§114":0.586,"§55":0.61,"§53d":0.621,"§99":0.568,"§128":0.538,"§50d/e":0.604,"自刑":0.539,"§133m":0.509,"§132":0.571,"sede":0.544,"incompatibile":0.57,"§50k":0.598,"§59":0.629,"§110":0.559,"§50f":0.637,"§62":0.575,"§122":0.468,"§50j":0.55,"§134":0.585,"§121":0.492,"§107":0.592,"§50k-bis":0.54,"§133":0.574,"§104":0.585,"§54b":0.59,"回頭剋":0.537,"§65":0.625,"§50g":0.568,"§109":0.562,"§127":0.519,"§118":0.604,"§67":0.609,"§131":0.559,"§69":0.604,"§56":0.58,"§97":0.552,"§58":0.662,"§119":0.61,"§112":0.598,"§113":0.585,"§66":0.566,"§124":0.585,"§51":0.587,"§106":0.585,"§105":0.585,"§103":0.585,"§50h":0.552},"LETT":{"T1":0.491,"T0b":0.593,"T3":0.461,"T0k":0.537,"T0g2":0.511,"T5d":0.521,"T1a":0.559,"T4":0.576,"T0p":0.462,"T0t":0.6,"T0w":0.483,"T0h":0.559,"T0c":0.556,"T0m":0.499,"T0x":0.449,"T5":0.536,"T8":0.528,"T0z":0.513,"T0s":0.566,"T4b":0.512,"T7":0.642,"T0v":0.614,"T0k0":0.554,"T4d":0.531,"T4c":0.523,"T2d":0.6,"T0j":0.57,"T0i":0.533,"T10":0.509,"T0r":0.392,"T0g3":0.457,"T0f2":0.451,"T9":0.519,"T2b":0.521,"T0u":0.442,"T0e":0.553,"T0y":0.507,"T0a":0.523,"T2n":0.578,"T1b":0.508,"T0g":0.559,"T2":0.509,"T6":0.556},"DLR":{"casella isolata":0.567,"日祿 sopra lo stelo":0.589,"il legame dello host":0.597,"R1 e R3 entrambi vuoti":0.634,"八專 sul pilastro 丁未":0.61,"due trigoni · W sopra":0.647,"la coppia R1/R2":0.551,"八專 · l'ora nutre il ramo del giorno":0.645,"八專 sul pilastro 甲寅":0.598,"R1 genera il ramo del giorno":0.577,"il ramo del giorno siede sulla tomba":0.536,"返吟 · lo host piu' in stagione del guest":0.591,"seme · stelo e ramo dello stesso elemento":0.674,"B su R1 legato in 六合":0.65,"due trigoni · lo host nutre il guest, W solo sotto":0.597,"R2 al posto di R1 vuoto":0.61,"due trigoni · guest G":0.637,"P sul primo messaggio dal lato dello stelo":0.578,"il pari su R1":0.579,"W sul primo messaggio":0.619,"l'ora combina col palazzo dello stelo":0.627,"la catena scorre nella tomba":0.571,"ora W vigorosa con generale fausto":0.661,"伏吟 · la ricchezza ferma sul lato del guest":0.591,"八專 con l'ora G":0.602,"il 祿 incrociato fra stelo e ramo":0.632,"seme · lo stelo controlla il ramo":0.599,"伏吟 · lo host piu' in stagione del guest":0.617,"伏吟 · lo host nel vuoto":0.536,"primo messaggio in 長生 dello stelo":0.562,"驛馬 sopra lo stelo":0.605,"B sopra lo stelo con 青龍":0.642,"G vuoto sul primo messaggio":0.661,"l'ora e' penalizzata dal ramo del giorno":0.614,"O sopra lo stelo con 勾陳":0.622,"l'ora e' il 驛馬 del giorno":0.612,"l'ora combina col ramo del giorno":0.619,"帝旺 dello stelo sopra il ramo":0.624,"C vuoto con W sul terzo messaggio":0.642,"gruppo completo nei Tre Messaggi = G":0.662,"伏吟 · i due lati dello stesso elemento":0.598,"lo stelo del giorno siede sulla tomba":0.616,"lo stelo cavalca la tomba":0.661,"O sopra lo stelo, host seduto sul vuoto":0.586,"il ramo cavalca la 絕":0.624,"primo messaggio in 沐浴 o 死 dello stelo":0.558,"戌 o 辰 sopra il ramo del giorno":0.662,"due trigoni · guest P":0.597,"primo messaggio sulla 墓 dello stelo":0.597,"八專 · G dal lato del guest":0.629,"lo stelo cavalca la 絕":0.584,"l'ora clasha il ramo del giorno":0.609,"l'ora clasha il palazzo dello stelo":0.631,"返吟 · il giorno genera chi cavalca il ramo del mese":0.621,"返吟 · lo stelo del giorno controlla il ramo del mese":0.655,"O sul primo messaggio dal lato dello stelo, non nutrito":0.676,"due trigoni · W del primo messaggio seduta sulla propria tomba":0.628,"due trigoni · W sopra ma in tomba":0.616}};
  var CAL = {"LY":[0.507,0.545,0.607,0.625,0.795,0.5],"PB":[0.571,0.543,0.581,0.5,0.5,0.5],"DLR":[0.424,0.545,0.597,0.674,0.5,0.5]}, FASCE = [0,0.15,0.3,0.5,0.8,99], SOGLIA = 0.1;
  // PESO DEI METODI (Edu, 22/10/2026: "Dobbiamo trovare una via di mezzo, abbassa di un quarto fino a che non vediamo che
  // riprende"): il Da Liu Ren pesa 0,75 finche' dal vivo non torna sopra il 55% (misura_vivo.js, "DLR da solo"). Backtest
  // 2024-26 con 0,75: 59,7% su 1.302 (con 1: 60,2%); dal vivo 29/09-22/10: 50,0% su 86. localStorage PESO_DLR lo cambia.
  var PESO = { LY: 1, PB: 1, DLR: 0.75 };
  try { if (typeof localStorage !== 'undefined' && localStorage && localStorage.getItem('CON_MT') === '1') FAM.LY.splice(2, 0, 'MT'); } catch (e) {}
  try { if (typeof localStorage !== 'undefined' && localStorage && localStorage.getItem('PESO_DLR')) PESO.DLR = +localStorage.getItem('PESO_DLR'); } catch (e) {}
  var NOMI = { LY: 'Liu Yao', LETT: 'lettura della carta', MT: 'metodo del trend', CM: 'colpo del mese', D: 'sistema D', LYF: 'LY per forma', PB: 'Plum Blossom', PBF: 'PB per forma', DLR: 'Da Liu Ren', DLRF: 'DLR per forma' };
  var METODI = { LY: 'Metodo Liu Yao', PB: 'Metodo Plum Blossom', DLR: 'Metodo Da Liu Ren' };
  var lo = function (p) { return Math.log(p / (1 - p)); }, pc = function (p) { return Math.round(p * 100) + '%'; };
  var fascia = function (m) { for (var i = 0; i < FASCE.length - 1; i++) if (m >= FASCE[i] && m < FASCE[i + 1]) return i; return FASCE.length - 2; };
  function pv(k, v) { if (ROUTE[k]) { var r = v[ROUTE[k]] || '—'; if (PR[k] && PR[k][r] !== undefined) return { p: PR[k][r], via: r }; } return { p: P[k], via: null }; }
  function leggi(v) {
    var z = 0, metodi = [], righe = [];
    Object.keys(FAM).forEach(function (f) {
      var s = 0, args = [];
      FAM[f].forEach(function (k) {
        var d = v[k]; if (d !== 'LONG' && d !== 'SHORT') return;
        var q = pv(k, v), w = q.p > 0.5 ? lo(q.p) : 0;
        s += d === 'LONG' ? w : -w;
        args.push(NOMI[k] + ' ' + d + (q.via ? ' (' + q.via + ')' : '') + ' ' + pc(q.p) + (w ? '' : ', non pesa'));
      });
      var dir = s > 0 ? 'LONG' : s < 0 ? 'SHORT' : null, pf = dir ? CAL[f][fascia(Math.abs(s))] : null;
      metodi.push({ metodo: f, dir: dir, p: pf });
      if (dir && pf > 0.5) z += (dir === 'LONG' ? lo(pf) : -lo(pf)) * PESO[f];
      righe.push(METODI[f] + ': ' + (args.join(', ') || 'tace') + ' → ' + (dir ? dir + ', affidabile ' + pc(pf) + (pf > 0.5 ? (PESO[f] !== 1 ? ', peso ' + String(PESO[f]).replace('.', ',') : '') : ', non pesa') : 'nessuna conclusione'));
    });
    var m = Math.abs(z), dir = m > SOGLIA ? (z > 0 ? 'LONG' : 'SHORT') : null;
    var forza = !dir ? null : m >= 0.6 ? 'forte' : m >= 0.3 ? 'media' : 'debole';
    righe.push('Conclusione: ' + (dir ? dir + ' (margine ' + (Math.round(m * 100) / 100).toString().replace('.', ',') + ', ' + forza + ')' : 'i metodi non arrivano a una conclusione: fermo'));
    return { dir: dir, margine: Math.round(m * 100) / 100, forza: forza, metodi: metodi, racconto: righe.join(' · ') };
  }
  return { leggi: leggi };
}));
