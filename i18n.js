/* i18n.js — versione inglese dell'app (19/11/2026, Edu: "the software must have an English version").
 * NON tocca il motore: le stringhe italiane restano quelle di sempre (registro, raccolta notturna,
 * parita'). In inglese si traduce solo quello che e' a schermo, nodo di testo per nodo di testo,
 * con un glossario ordinato (le frasi lunghe prima delle parole). La lingua scelta sta in
 * localStorage LANG ('it' | 'en'); senza scelta: italiano se il browser e' in italiano, altrimenti inglese.
 * Le due bandierine stanno in alto a destra. */
(function (root) {
  'use strict';

  // frasi intere e modi di dire (prima), poi il vocabolario (dopo). Ogni voce: [regex, sostituto].
  var G = [
    // --- testata e report ---
    [/caricamento del feed delle 00:00 GMT…/g, 'loading the 00:00 GMT feed…'],
    [/Ricarica il feed delle 00:00 GMT e ricalcola la scala A\/B\/C\/D/g, 'Reload the 00:00 GMT feed and recalculate the signals'],
    [/Scala A\/B\/C\/D/g, 'Lio signals'],
    [/Regole: nascondi/g, 'Rules: hide'], [/Regole: mostra/g, 'Rules: show'],
    [/\bAggiorna\b/g, 'Refresh'],
    [/cross nel feed/g, 'pairs in the feed'],
    [/Il feed forex non e' ancora caricato\. Premi /g, 'The forex feed is not loaded yet. Press '],
    [/ e riprova\./g, ' and try again.'],
    [/Da tradare oggi/g, 'To trade today'],
    [/NON SI TRADANO · saltati anche su MetaTrader/g, 'NOT TRADED · also skipped on MetaTrader'],
    [/LIO FERMO · il qimen dice \(a mano, non va su MetaTrader\)/g, 'LIO SILENT · qimen says (manual, not sent to MetaTrader)'],
    [/LIO FERMO · decide il qimen \(entra su MetaTrader a 0,01\)/g, 'LIO SILENT · qimen decides (enters on MetaTrader at 0.01)'],
    [/qimen con scarto /g, 'qimen by a margin of '], [/qimen di misura/g, 'qimen by a narrow margin'],
    [/2ª entrata 0,01 se scende a ([0-9,]+) \(ore piene 02-07 GMT\)/g, '2nd entry 0.01 if it falls to $1 (on the hour, 02-07 GMT)'],
    [/2ª entrata 0,01 se sale a ([0-9,]+) \(ore piene 02-07 GMT\)/g, '2nd entry 0.01 if it rises to $1 (on the hour, 02-07 GMT)'],
    [/DA TRADARE · in ordine di gradino/g, 'TO TRADE · in order of level'],
    [/DA OSSERVARE · non si tradano \(Leggo io con conclusione media o debole\)/g, 'TO WATCH · not traded (Lio with a medium or weak conclusion)'],
    [/FERMI · (\d+) cross \(tocca per vedere perché\)/g, 'NO TRADE · $1 pairs (tap to see why)'],
    [/Nessun cross da tradare oggi: nessun gradino della scala\./g, 'No pair to trade today.'],
    [/Nessun cross fermo\./g, 'No pair without a trade.'],
    [/(\d+) da tradare \(/g, '$1 to trade ('],
    [/· in cantina (\d+) · (\d+) fermi/g, '· shelved $1 · $2 no trade'],
    [/punta (\d+) · gradini 2-10 (\d+)/g, 'top $1 · steps 2-10 $2'],
    [/, si osserva/g, ', watched'],
    [/in cantina/g, 'shelved'],
    [/, non si trada/g, ', not traded'],
    [/(\d+) non si tradano/g, '$1 not traded'],
    [/non si trada(?!n)/g, 'not traded'],
    [/misura della posizione: piena sulle conclusioni forti, meta' su medie e deboli/g, 'position size: full on strong conclusions, half on medium and weak ones'],
    [/fiducia dal sistema-trend/g, 'confidence from the trend system'],
    [/Leggo io, conclusione forte/g, 'Lio, strong conclusion'],
    [/Leggo io, conclusione media/g, 'Lio, medium conclusion'],
    [/Leggo io, conclusione debole/g, 'Lio, weak conclusion'],
    [/posizione piena/g, 'full position'],
    [/mezza posizione/g, 'half position'],
    [/fiducia alta/g, 'confidence high'], [/fiducia media/g, 'confidence medium'], [/fiducia bassa/g, 'confidence low'],
    // --- registro ---
    [/Registro dei trade · esiti di fine giornata/g, 'Trade log · end-of-day results'],
    [/Copia i trade perdenti/g, 'Copy the losing trades'],
    [/Copia tutto il registro/g, 'Copy the whole log'],
    [/Copiato ✓/g, 'Copied ✓'],
    [/Gli esiti arrivano /g, 'Results arrive '],
    [/^da soli$/g, 'automatically'],
    [/ dal feed del giorno dopo \(entrata alle 00:00 GMT, uscita alle 21:00 GMT\)\. /g, ' from the next day\'s feed (entry at 00:00 GMT, exit at 21:00 GMT). '],
    [/(\d+) appena compilati\./g, '$1 just filled in.'],
    [/Puoi comunque correggere a mano un numero scrivendolo sopra\./g, 'You can still correct a number by hand by typing over it.'],
    [/Il feed non porta ancora gli esiti/g, 'The feed does not carry the results yet'],
    [/ — aggiorna il Worker su Cloudflare\. /g, ' — update the Worker on Cloudflare. '],
    [/Intanto scrivi a mano i pip fatti da ogni trade, col segno\./g, 'Meanwhile type in by hand the pips made by each trade, with the sign.'],
    [/ Quelli negativi restano segnati /g, ' Negative ones stay marked '],
    [/: il pulsante qui sopra prepara il blocco da incollare in chat\./g, ': the button above prepares the block to paste into the chat.'],
    [/da capire/g, 'to review'],
    [/senza esito/g, 'open'],
    // --- motivi dei fermi ---
    [/nessun dato dal feed \(mercato chiuso\?\)/g, 'no data from the feed (market closed?)'],
    [/seme a ([\d.,]+) pip dal bordo: un altro dato darebbe un altro ramo, il giorno non e' definito/g, 'seed $1 pips from the edge: another quote would give another branch, the day is not defined'],
    [/EMA non consolidata \((\d+) inversioni negli ultimi 10 giorni\)/g, 'EMA not consolidated ($1 reversals in the last 10 days)'],
    [/trend EMA assente o piatto/g, 'EMA trend missing or flat'],
    [/carta non costruibile/g, 'chart cannot be built'],
    [/carta non leggibile/g, 'chart cannot be read'],
    [/lettura Plum Blossom non disponibile/g, 'Plum Blossom reading not available'],
    [/errore di lettura: /g, 'reading error: '],
    [/non si opera/g, 'no trade'],
    [/i metodi non arrivano a una conclusione: fermo/g, 'the methods do not reach a conclusion: no trade'],
    [/nessuna conclusione/g, 'no conclusion'],
    // --- il racconto di Leggo io ---
    [/LEGGO IO/g, 'LIO'], [/Leggo io/g, 'Lio'],
    [/Metodo Liu Yao/g, 'Liu Yao method'], [/Metodo Plum Blossom/g, 'Plum Blossom method'], [/Metodo Da Liu Ren/g, 'Da Liu Ren method'],
    [/[Mm]etodo del trend/g, 'Trend method'],
    [/[Ll]ettura della carta/g, 'chart reading'],
    [/Sistema-trend/g, 'Trend system'],
    [/Sistema (LY|PB|DLR) per forma/g, '$1 pattern system'], [/sistema (LY|PB|DLR) per forma/g, '$1 pattern system'],
    [/(LY|PB|DLR) per forma/g, '$1 by pattern'],
    [/[Ss]istema D\b/g, 'system D'],
    [/sistema attuale/g, 'current system'],
    [/Colpo del mese/g, 'Month strike'], [/colpo del mese/g, 'month strike'],
    [/Semplificato/g, 'Simplified'],
    [/Conclusione:/g, 'Conclusion:'], [/\bmargine\b/g, 'margin'],
    [/\baffidabile\b/g, 'reliability'], [/non pesa/g, 'not weighted'], [/\bpeso\b/g, 'weight'],
    [/via DLR:/g, 'DLR path:'],
    [/DA OSSERVARE/g, 'TO WATCH'], [/Da osservare/g, 'To watch'],
    [/casi giusti/g, 'correct cases'],
    [/oggi il tratto non c'e'/g, 'today the feature is absent'], [/oggi il tratto c'e'/g, 'today the feature is present'],
    [/senza regola/g, 'no rule'],
    [/\(regola (\d+):/g, '(rule $1:'],
    [/\((\d+) carte, /g, '($1 charts, '],
    [/NON SEGUE il trend/g, 'AGAINST the trend'], [/SEGUE il trend/g, 'FOLLOWS the trend'],
    [/NON SEGUE/g, 'AGAINST'], [/\bSEGUE\b/g, 'FOLLOWS'],
    [/non segue il trend/g, 'goes against the trend'], [/segue il trend/g, 'follows the trend'],
    [/opposto al trend/g, 'opposite to the trend'],
    [/non segue/g, 'against the trend'], [/\bsegue\b/g, 'follows'],
    [/il trend non tiene/g, 'the trend does not hold'],
    [/\baltrimenti\b/g, 'otherwise'],
    [/\bALTO\b/g, 'HIGH'], [/\bBASSO\b/g, 'LOW'], [/: alto\)/g, ': high)'], [/: basso\)/g, ': low)'],
    [/\btace\b/g, 'silent'],
    [/\battuale\b/g, 'current'],
    [/\bSpirito\b/g, 'Spirit'],
    [/lo stelo del giorno/g, 'the day stem'], [/\bstelo\b/g, 'stem'],
    [/\bbestie\b/g, 'animals'],
    // --- vocabolario delle regole ---
    [/Serpente morto sullo Shi/g, 'Dead Snake on the Shi'],
    [/Shi colpito: la bestia del mese cade su (L\d) e la controlla -> vince la Ying/g, 'Shi struck: the month\'s animal falls on $1 and controls it -> the Ying wins'],
    [/il duello \(sede presa\)/g, 'the duel (seat taken)'],
    [/la sede presa \(mobile ferma\)/g, 'the seat taken (moving line blocked)'],
    [/la sede raggiunge una linea/g, 'the seat reaches a line'],
    [/le tre porte/g, 'the three doors'],
    [/si muove per combinarsi con una sede/g, 'moves to combine with a seat'],
    [/il vantaggio retrocede/g, 'the advantage retreats'],
    [/il raduno serve/g, 'the gathering serves'],
    [/il giorno tiene/g, 'the day holds'],
    [/la combinazione totale/g, 'the total combination'],
    [/lo scalino porta su una sede/g, 'the step leads to a seat'],
    [/la sede generata indietro/g, 'the seat generated backwards'],
    [/la svegliata avanza generata indietro/g, 'the awakened line advances, generated backwards'],
    [/Shi contro Ying/g, 'Shi against Ying'],
    [/effetto scala/g, 'ladder effect'], [/\(scala\)/g, '(ladder)'],
    [/il malus portato/g, 'the malus carried'],
    [/casella isolata/g, 'isolated square'],
    [/il pari su/g, 'the tie on'],
    [/la coppia/g, 'the pair'],
    [/lo stelo cavalca la/g, 'the stem rides the'],
    [/la catena scorre nella tomba/g, 'the chain flows into the tomb'],
    [/lo host piu' in stagione del guest/g, 'the host more in season than the guest'],
    [/il giorno genera chi cavalca il ramo del mese/g, 'the day generates the rider of the month branch'],
    [/testa dell'Host/g, 'head of the Host'], [/primo messaggio/g, 'first message'],
    [/palazzo del Trend combinato/g, 'palace of the Trend combined'],
    [/arrivo della mobile/g, 'destination of the moving line'],
    [/ha lo stesso elemento del/g, 'has the same element as the'],
    [/e' controllato dal/g, 'is controlled by the'], [/e' controllato da la/g, 'is controlled by the'], [/e' controllato da/g, 'is controlled by'],
    [/stesso ramo/g, 'same branch as'],
    [/in piena stagione/g, 'in full season'], [/fuori stagione/g, 'out of season'], [/di stagione/g, 'in season'],
    [/in crescita/g, 'growing'], [/a riposo/g, 'resting'],
    [/prigionier[oa]/g, 'imprisoned'], [/\bmort[oa]\b/g, 'dead'], [/\bvuot[oa]\b/g, 'void'],
    [/danneggia/g, 'harms'], [/punisce/g, 'punishes'], [/\bgenera\b/g, 'generates'], [/\bcontrolla\b/g, 'controls'],
    [/\bdrena\b/g, 'drains'], [/\bcombina\b/g, 'combines with'], [/\bclasha\b/g, 'clashes with'],
    [/il giorno clash\b/g, 'the day clashes'], [/l'ora clash\b/g, 'the hour clashes'], [/il mese clash\b/g, 'the month clashes'],
    [/\bmobile\b/g, 'moving line'],
    [/la partenza/g, 'the origin'], [/\bpartenza\b/g, 'origin'],
    [/l'arrivo/g, 'the destination'], [/\barrivo\b/g, 'destination'],
    [/\bil giorno\b/g, 'the day'], [/\bil mese\b/g, 'the month'], [/\bl'anno\b/g, 'the year'], [/\bl'ora\b/g, 'the hour'], [/\bora (?=[PBWGC]\b)/g, 'hour '],
    [/\bil Trend\b/g, 'the Trend'], [/\bla Ying\b/g, 'the Ying'], [/\blo Shi\b/g, 'the Shi'],
    [/\bsede\b/g, 'seat'],
    [/\bSe (?=[A-Za-zÀ-ÿ])/g, 'If '], [/: se /g, ': if '], [/ e (?=the |destination|origin|moving)/g, ' and '],
    [/\bLivello\b/g, 'Level'], [/\blivello\b/g, 'level'], [/\bgradino\b/g, 'step'],
    // --- nomi che ricorrono nelle vie ---
    [/Uccello Rosso/g, 'Red Bird'], [/Drago Verde/g, 'Green Dragon'], [/Tigre Bianca/g, 'White Tiger'], [/Cielo Vuoto/g, 'Sky Void'],
    [/Guerriero Nero/g, 'Black Warrior'], [/Tartaruga Nera/g, 'Black Tortoise'], [/\bSerpente\b/g, 'Snake'], [/\bNobile\b/g, 'Nobleman'],
    [/testa del Guest/g, 'head of the Guest'],
    [/il ramo del mese/g, 'the month branch'], [/il ramo del giorno/g, 'the day branch'], [/il ramo dell'ora/g, 'the hour branch'], [/il ramo dell'anno/g, 'the year branch'],
    [/incrociato fra stem e ramo/g, 'crossed between stem and branch'],
    [/il legame dello host/g, 'the bond of the host'],
    [/siede sulla/g, 'sits on the'], [/siede sul/g, 'sits on the'],
    [/presa si muove/g, 'taken moves'], [/eliminata dal clash/g, 'eliminated by the clash'],
    [/bloccata parla col proprio carattere/g, 'blocked, speaks with its own character'],
    [/protetta dal giorno/g, 'protected by the day'],
    [/non si ritira/g, 'does not withdraw'], [/\bretrocede\b/g, 'retreats'], [/\bavanza\b/g, 'advances'],
    [/la P inutile, scontro fra le sedi/g, 'the useless P, clash between the seats'],
    [/blocca la combinazione/g, 'blocks the combination'],
    [/piu' forte dell'/g, 'stronger than the '], [/piu' debole dell'/g, 'weaker than the '],
    [/sostenut[oa] (?:dal|dalla|dallo|da)\b/g, 'supported by the'], [/sostenut[oa]/g, 'supported'],
    [/\bpalazzo\b/g, 'palace'], [/\bdifesa\b/g, 'defence'], [/\battacco\b/g, 'attack'], [/\bdell'/g, 'of the '],
    [/piu' forte di/g, 'stronger than'], [/piu' debole di/g, 'weaker than'], [/movimento libero/g, 'free movement'], [/Lettura S47/g, 'Reading S47'],
    [/piu' forte del/g, 'stronger than the'], [/piu' debole del/g, 'weaker than the'],
    [/\bspazzat[oa]\b/g, 'swept'], [/\bcombinat[oa]\b/g, 'combined'],
    [/generata indietro/g, 'generated backwards'], [/generato indietro/g, 'generated backwards'],
    [/della seconda/g, 'of the second'], [/della prima/g, 'of the first'],
    // --- ultima passata: parole comuni rimaste (le vie rare restano leggibili) ---
    [/\b(?:nel|nella|nello)\b/g, 'in the'], [/\b(?:sul|sulla|sullo)\b/g, 'on the'], [/\b(?:del|della|dello|dei|delle|degli)\b/g, 'of the'],
    [/\b(?:dal|dalla|dallo)\b/g, 'by the'], [/\b(?:al|alla|allo)\b/g, 'to the'], [/\bcol\b/g, 'with the'],
    [/ su (?=[A-Z0-9])/g, ' on '], [/ con /g, ' with '], [/ (?:fra|tra) /g, ' between '], [/ senza /g, ' without '], [/ sopra /g, ' above '], [/ sotto /g, ' below '],
    [/ contro /g, ' against '], [/ che /g, ' that '], [/ chi /g, ' who '], [/ non /g, ' not '], [/ e /g, ' and '],
    [/\bcavalca\b/g, 'rides'], [/\bvince\b/g, 'wins'], [/\bperde\b/g, 'loses'], [/\bcade\b/g, 'falls'], [/\bblocca\b/g, 'blocks'],
    [/\btomba\b/g, 'tomb'], [/\bram[oi]\b/g, 'branch'], [/\blinea\b/g, 'line'], [/\blinee\b/g, 'lines'], [/\bsedi\b/g, 'seats'],
    [/\bbestia\b/g, 'animal'], [/\braduno\b/g, 'gathering'], [/\btrigono\b/g, 'trine'], [/\bcarta\b/g, 'chart'],
    [/\bgiorno\b/g, 'day'], [/\bmese\b/g, 'month'], [/\banno\b/g, 'year'],
    [/(^|[ (])(?:il|lo|la|le|gli) (?=[A-Za-z一-鿿])/g, '$1the '],
    [/, forte\)/g, ', strong)'], [/, media\)/g, ', medium)'], [/, debole\)/g, ', weak)'],
    [/· forte$/g, '· strong'], [/· media$/g, '· medium'], [/· debole$/g, '· weak']
  ];

  function tr(s) {
    if (!s || !/[A-Za-zÀ-ÿ]/.test(s)) return s;
    var out = s;
    for (var i = 0; i < G.length; i++) out = out.replace(G[i][0], G[i][1]);
    return out;
  }

  var NOTA_EN = '<b>LIO</b> ("Leggo&nbsp;io", I read): reads one method at a time (Liu Yao, Plum Blossom, Da Liu Ren), ' +
    'weighs the pros and cons inside each and concludes, then puts the three conclusions together into LONG, SHORT or no trade, ' +
    'with a strength: strong, medium or weak. Full position on strong conclusions, half on medium and weak ones. ' +
    'The chart is cast at 00:00 GMT; the automatic trades enter at 01:00 GMT and exit at 21:00 GMT.';

  function lingua() {
    try { var l = root.localStorage && root.localStorage.getItem('LANG'); if (l === 'it' || l === 'en') return l; } catch (e) {}
    var n = (root.navigator && root.navigator.language) || 'it';
    return /^it/i.test(n) ? 'it' : 'en';
  }

  if (typeof module !== 'undefined' && module.exports) { module.exports = { tr: tr, lingua: lingua }; }
  // fuori dal browser (misura_vivo.js, raccolta notturna: documento finto) non si fa niente
  if (!root.document || !root.document.addEventListener || !root.document.createElement || !root.document.documentElement) return;
  var doc = root.document, LANG = lingua(), fatto = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

  function bandiere() {
    var IT = '<svg viewBox="0 0 3 2" width="27" height="18" aria-hidden="true"><rect width="1" height="2" fill="#009246"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#ce2b37"/></svg>';
    var EN = '<svg viewBox="0 0 60 40" width="27" height="18" aria-hidden="true"><rect width="60" height="40" fill="#012169"/>' +
      '<path d="M0 0L60 40M60 0L0 40" stroke="#fff" stroke-width="8"/><path d="M0 0L60 40M60 0L0 40" stroke="#c8102e" stroke-width="3"/>' +
      '<path d="M30 0V40M0 20H60" stroke="#fff" stroke-width="12"/><path d="M30 0V40M0 20H60" stroke="#c8102e" stroke-width="7"/></svg>';
    var box = doc.createElement('div');
    box.id = 'langsw';
    box.setAttribute('style', 'position:absolute;top:calc(8px + env(safe-area-inset-top,0px));right:calc(10px + env(safe-area-inset-right,0px));display:flex;gap:8px;z-index:50');
    [['en', EN, 'English'], ['it', IT, 'Italiano']].forEach(function (b) {
      var btn = doc.createElement('button');
      btn.type = 'button'; btn.title = b[2]; btn.setAttribute('aria-label', b[2]); btn.setAttribute('data-lang', b[0]);
      btn.setAttribute('style', 'padding:2px;line-height:0;border-radius:4px;background:transparent;cursor:pointer;border:2px solid ' +
        (LANG === b[0] ? '#e3b341' : 'transparent') + ';opacity:' + (LANG === b[0] ? '1' : '.55'));
      btn.innerHTML = b[1];
      btn.addEventListener('click', function () {
        if (LANG === b[0]) return;
        try { root.localStorage.setItem('LANG', b[0]); } catch (e) {}
        root.location.reload();
      });
      box.appendChild(btn);
    });
    doc.body.appendChild(box);
  }

  function nodo(n) {
    if (n.nodeType === 3) {
      var p = n.parentNode && n.parentNode.nodeName;
      if (p === 'SCRIPT' || p === 'STYLE' || p === 'TEXTAREA') return;
      var v = n.nodeValue; if (fatto && fatto.get(n) === v) return;
      var t = tr(v); if (t !== v) n.nodeValue = t;
      if (fatto) fatto.set(n, t);
    } else if (n.nodeType === 1) {
      if (n.id === 'langsw' || n.nodeName === 'SCRIPT' || n.nodeName === 'STYLE') return;
      if (n.hasAttribute && n.hasAttribute('title')) { var a = n.getAttribute('title'), b = tr(a); if (b !== a) n.setAttribute('title', b); }
      // la nota lunga del report (storia dei sistemi in pausa): in inglese una nota breve e pulita
      if (n.nodeName === 'DIV' && n.firstChild && n.firstChild.nodeName === 'B' && /^(LEGGO IO|LIO)$/.test(n.firstChild.textContent) &&
          n.closest && n.closest('#report')) { if (n.innerHTML !== NOTA_EN) n.innerHTML = NOTA_EN; return; }
      for (var c = n.firstChild; c; c = c.nextSibling) nodo(c);
    }
  }

  function avvia() {
    if (!doc.body) return;
    bandiere();
    var hd = doc.querySelector('header.top'); if (hd) hd.style.paddingRight = '78px';
    doc.documentElement.setAttribute('lang', LANG);
    if (LANG !== 'en') return;
    nodo(doc.body);
    if (typeof MutationObserver === 'undefined') return;
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) {
        var m = ms[i];
        if (m.type === 'characterData') nodo(m.target);
        else for (var j = 0; j < m.addedNodes.length; j++) nodo(m.addedNodes[j]);
      }
    }).observe(doc.body, { childList: true, subtree: true, characterData: true });
  }
  var sicuro = function () { try { avvia(); } catch (e) { if (root.console) root.console.warn('i18n: ' + e.message); } };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', sicuro); else sicuro();
})(typeof window !== 'undefined' ? window : globalThis);
