'use strict';
// ============================================================================
//  MOTORE DLR — motore direzionale del Da Liu Ren, nuovo impianto (Edu, 02/09/2026)
//  Sostituisce il precedente motore DLR basato sul trend, che non funzionava.
//  NON tocca il LY (liuyao.js) ne' il PB (plumblossom.js): sono sistemi separati.
//
//  DOMANDA: la carta e' direzionale. Host = prima valuta del cross, Guest = seconda.
//  Host vince -> LONG. Guest vince -> SHORT. Nessun attore riconosciuto -> TACE.
//
//  Host  = stelo del giorno, seduto nel suo palazzo (寄宮); la sua testa e' la 1a lezione.
//  Guest = ramo del giorno; la sua testa e' la 3a lezione.
//  LINGUA COMUNE (fissata con Edu il 02/09/2026):
//    caratteri  B (兄弟 Fratelli) · C (子孫 Figli) · W (妻財 Ricchezza)
//               O (官 Ufficiale)  · G (鬼 Fantasma) · P (父母 Genitori)
//    letture    R1 R2 R3 R4   (R1 sta sopra lo stelo del giorno, R3 sopra il ramo del giorno)
//    messaggi   M1 M2 M3
// ============================================================================

// ---- 寄宮: quale stelo abita ciascun ramo (tabella dettata da Edu, 02/09/2026) ----
// 甲 in 寅 · 乙 in 辰 · 丙 e 戊 in 巳 · 丁 e 己 in 未 · 庚 in 申 · 辛 in 戌 · 壬 in 亥 · 癸 in 丑
// I rami 子 卯 午 酉 NON ospitano alcuno stelo.
const STELI_DENTRO = {
  '寅': ['甲'], '辰': ['乙'], '巳': ['丙', '戊'], '未': ['丁', '己'],
  '申': ['庚'], '戌': ['辛'], '亥': ['壬'], '丑': ['癸']
};

// ---- 天干五合: combinazione fra steli ----
const COMBINA_STELI = { '甲':'己','己':'甲','乙':'庚','庚':'乙','丙':'辛','辛':'丙','丁':'壬','壬':'丁','戊':'癸','癸':'戊' };

// ---- elementi ----
const EL_STELO = { '甲':'Legno','乙':'Legno','丙':'Fuoco','丁':'Fuoco','戊':'Terra',
                   '己':'Terra','庚':'Metallo','辛':'Metallo','壬':'Acqua','癸':'Acqua' };
const EL_RAMO  = { '子':'Acqua','丑':'Terra','寅':'Legno','卯':'Legno','辰':'Terra','巳':'Fuoco',
                   '午':'Fuoco','未':'Terra','申':'Metallo','酉':'Metallo','戌':'Terra','亥':'Acqua' };
const GENERA   = { 'Legno':'Fuoco','Fuoco':'Terra','Terra':'Metallo','Metallo':'Acqua','Acqua':'Legno' };
const CONTROLLA= { 'Legno':'Terra','Terra':'Acqua','Acqua':'Fuoco','Fuoco':'Metallo','Metallo':'Legno' };

// ---- parentela di un ramo rispetto allo stelo del giorno (codici DLR: P/O/G/B/C/W) ----
// P = 父母 Genitori · O = 官 Ufficiale · G = 鬼 Fantasma · B = 兄弟 Fratelli
// C = 子孫 Figli · W = 妻財 Ricchezza
const RAMI_YANG = ['子','寅','辰','午','申','戌'];
function parentela(steloGiorno, ramo) {
  const d = EL_STELO[steloGiorno], e = EL_RAMO[ramo];
  if (d === e) return 'B';
  if (GENERA[d] === e) return 'C';
  if (GENERA[e] === d) return 'P';
  if (CONTROLLA[d] === e) return 'W';
  // il ramo controlla lo stelo: stessa polarita' = G (鬼), polarita' opposta = O (官)
  const steloYang = ['甲','丙','戊','庚','壬'].includes(steloGiorno);
  const ramoYang  = RAMI_YANG.includes(ramo);
  return (steloYang === ramoYang) ? 'G' : 'O';
}

// ---- FORME FUORI SELEZIONE (Edu, 02/09/2026) --------------------------------
// Il motore non legge queste carte: la distinzione host/guest non e' leggibile.
//  · 八專 (Otto Specialita'): il palazzo dello stelo del giorno coincide col ramo del
//    giorno (甲寅, 丁未, 己未, 癸丑). Host e guest occupano lo stesso palazzo e le
//    quattro lezioni si riducono a due.
//  · 冬蛇掩目 (Winter Snake, il serpente d'inverno che si copre gli occhi): 昴星 in
//    giorno yin. Escluso su indicazione di Edu.
//  · 虎視轉蓬 (昴星 in giorno yang), stessa famiglia.
//  · 伏吟 (il ronzio nascosto) e 返吟 (il ronzio che torna): carte immobili o rovesciate.
function fuoriSelezione(carta) {
  const m = carta.metodo || '';
  if (carta.palazzoHost === carta.ramoGiorno) return '八專 (Otto Specialita\')';
  if (m.indexOf('昴星') >= 0) {
    const yin = ['乙','丁','己','辛','癸'].includes(carta.steloGiorno);
    return yin ? '冬蛇掩目 (Winter Snake)' : '虎視轉蓬 (stessa famiglia di 昴星)';
  }
  if (m.indexOf('伏吟') >= 0) return '伏吟 (il ronzio nascosto)';
  if (m.indexOf('返吟') >= 0) return '返吟 (il ronzio che torna)';
  return null;
}

// ============================================================================
//  VIE DEL MOTORE — in ordine di precedenza. La prima che parla decide.
// ============================================================================

// --- VIA 1 · IL LEGAME DELLO HOST ------------------------------------------
// Nasce dalla carta USDJPY 11/02/2026 seme 154, letta da Edu il 02/09/2026.
// Lo stelo che abita il ramo del giorno (lato guest) COMBINA 天干五合 con lo stelo
// che abita R1. Lo host resta agganciato a quel ramo.
// Il verso lo decide COSA sia quel ramo per lo stelo del giorno:
//   · se e' la sua Ricchezza (W), il legame gli conviene: lo host tiene -> LONG
//   · se e' qualunque altra cosa (P/O/G/B/C), lo host resta legato a cio' che non
//     gli serve e cede -> SHORT
// Misura 02/09/2026 (soglia 20 pip, 9 cross, 2020-2026):
//   W su R1        n 51   41,2% SHORT  =  58,8% LONG   z 1,26   vec 61,5 / rec 52,2
//   niente W su R1 n 187  59,4% SHORT                  z 2,56   vec 55,7 / rec 61,8
// Controprova (fondamentale: il segnale e' della COMBINAZIONE, non dell'assenza di W):
//   senza combinazione, W su R1        n 427   47,1% SHORT
//   senza combinazione, niente W su R1 n 1653  48,1% SHORT
// AVVERTENZA DOTTRINALE: sul ramo W il verso misurato e' OPPOSTO alla lettura che Edu
// ha dato della carta guida (lui legge la Ricchezza come bloccata, quindi host che
// perde). Il conflitto e' aperto e va sciolto da Edu, non dai numeri.
function via1_legameDelloHost(c) {
  const dentroDB = STELI_DENTRO[c.ramoGiorno];
  const dentroR1 = STELI_DENTRO[c.R1];
  if (!dentroDB || !dentroR1) return null;
  const legato = dentroDB.some(a => dentroR1.some(b => COMBINA_STELI[a] === b));
  if (!legato) return null;
  const par = parentela(c.steloGiorno, c.R1);
  if (par === 'W') return {
    dir: 'LONG', via: 'il legame dello host',
    perche: 'lo stelo ' + dentroDB.join('/') + ' che abita il ramo del giorno ' + c.ramoGiorno +
            ' combina con ' + dentroR1.join('/') + ' che abita ' + c.R1 +
            ', e ' + c.R1 + ' e\' la Ricchezza (W) dello stelo del giorno: il legame tiene lo host'
  };
  return {
    dir: 'SHORT', via: 'il legame dello host',
    perche: 'lo stelo ' + dentroDB.join('/') + ' che abita il ramo del giorno ' + c.ramoGiorno +
            ' combina con ' + dentroR1.join('/') + ' che abita ' + c.R1 +
            ', e ' + c.R1 + ' e\' ' + par + ' per lo stelo del giorno: lo host resta legato a cio\' che non gli serve'
  };
}

// --- relazione fra il RAMO DEL GIORNO e il ramo posato SU R1 ---------
// Cinque casi, come li ha ordinati Edu (02/09/2026):
//   'genera'    il ramo del giorno genera R1
//   'controlla' il ramo del giorno controlla R1
//   'subisce'   il ramo del giorno e' controllato da R1
//   'drena'     il ramo del giorno drena R1 (quello lo genera)
//   'pari'      stesso elemento (比和)
function casoDBversoR1(c) {
  const eDB = EL_RAMO[c.ramoGiorno], eSH = EL_RAMO[c.R1];
  if (eDB === eSH) return 'pari';
  if (GENERA[eDB] === eSH) return 'genera';
  if (CONTROLLA[eDB] === eSH) return 'controlla';
  if (CONTROLLA[eSH] === eDB) return 'subisce';
  return 'drena';
}
// Il vuoto non agisce: se il ramo del giorno o quello su R1 sono nei 旬空
// del giorno, queste vie tacciono.
function vuotoInGioco(c) {
  const V = c.vuoti || [];
  return V.indexOf(c.ramoGiorno) >= 0 || V.indexOf(c.R1) >= 0;
}

// --- VIA 2 · IL PARI FRA IL RAMO DEL GIORNO E IL RAMO SU R1 ---------
// Quando il ramo del giorno e R1 sono dello STESSO elemento
// (比和), nessuno dei due prevale sull'altro e a decidere resta che cosa quel ramo
// SIA per lo stelo del giorno. L'ordine che ne esce e' leggibile: le parentele che
// aggrediscono lo stelo del giorno lo fanno cedere, quelle che lo sostengono o che
// lui stesso produce lo tengono in piedi.
//   O (官 Ufficiale)   SHORT   n 52   67,3%  z 2,50   vec 65,5 / rec 71,4
//   G (鬼 Fantasma)    SHORT   n 63   60,3%  z 1,64   vec 59,3 / rec 61,3
//   W (妻財 Ricchezza) SHORT   n 121  56,2%  z 1,36   vec 52,2 / rec 56,3
//   C (子孫 Figli)     LONG    n 106  59,4%  z 1,94   vec 56,7 / rec 59,5
//   P (父母 Genitori)  LONG    n 125  58,4%  z 1,88   vec 50,9 / rec 69,8
//   B (兄弟 Fratelli)  n 80, 51,3%: nessun segnale, la via TACE
// Tutte e cinque hanno i due periodi dalla stessa parte. Misure 02/09/2026, soglia 20.
const DIREZIONE_PARI_R1 = { O: 'SHORT', G: 'SHORT', W: 'SHORT', C: 'LONG', P: 'LONG' };
function via2_pariSuR1(c) {
  if (vuotoInGioco(c)) return null;
  if (casoDBversoR1(c) !== 'pari') return null;
  const par = parentela(c.steloGiorno, c.R1);
  const dir = DIREZIONE_PARI_R1[par];
  if (!dir) return null;                       // B: la via tace
  return { dir: dir, via: 'il pari su R1',
    perche: 'il ramo del giorno ' + c.ramoGiorno + ' e R1 ' + c.R1 +
            ' sono dello stesso elemento (' + EL_RAMO[c.ramoGiorno] + '), nessuno prevale; ' +
            'su R1 c\'e\' ' + par + ', che ' +
            (dir === 'SHORT' ? 'aggredisce o svuota lo stelo del giorno' : 'sostiene lo stelo del giorno') };
}

// --- VIA 3 · LE CASELLE ISOLATE --------------------------------------------
// Caselle misurate il 02/09/2026 fuori dal blocco del pari, tenute solo se hanno
// almeno 60 carte e i due periodi dalla stessa parte. In ordine di forza.
//   il ramo del giorno GENERA i Figli (C) su R1     SHORT  n 78  61,5%  z 2,04  vec 64,9 / rec 63,2
//   il ramo del giorno DRENA la Ricchezza (W) su R1 LONG   n 61  62,3%  z 1,92  vec 70,4 / rec 53,3
//   il ramo del giorno E' CONTROLLATO dai Fratelli (B)      SHORT  n 69  56,5%  z 1,08  vec 54,8 / rec 57,6
//   il ramo del giorno CONTROLLA i Genitori (P)             SHORT  n 92  55,4%  z 1,04  vec 55,3 / rec 56,8
//   il ramo del giorno CONTROLLA la Ricchezza (W)           SHORT  n 73  54,8%  z 0,82  vec 53,8 / rec 51,2
//   il ramo del giorno DRENA i Fratelli (B)                 LONG   n 88  54,5%  z 0,85  vec 55,2 / rec 52,9
//   il ramo del giorno GENERA la Ricchezza (W)              LONG   n 71  54,9%  z 0,83  vec 51,4 / rec 54,5
const CASELLE_ISOLATE = {
  'genera|C':    'SHORT', 'drena|W':     'LONG',
  'subisce|B':   'SHORT', 'controlla|P': 'SHORT',
  'controlla|W': 'SHORT', 'drena|B':     'LONG',
  'genera|W':    'LONG'
};
function via3_caselleIsolate(c) {
  if (vuotoInGioco(c)) return null;
  const caso = casoDBversoR1(c);
  if (caso === 'pari') return null;            // il pari lo tratta la via 2
  const par = parentela(c.steloGiorno, c.R1);
  const dir = CASELLE_ISOLATE[caso + '|' + par];
  if (!dir) return null;
  const VERBO = { genera:'genera', controlla:'controlla', subisce:'e\' controllato da', drena:'drena' };
  return { dir: dir, via: 'casella isolata',
    perche: 'il ramo del giorno ' + c.ramoGiorno + ' ' + VERBO[caso] + ' ' + c.R1 +
            ' posato su R1, che per lo stelo del giorno e\' ' + par };
}

// --- VIA 4 · LA COPPIA R1 / R2 ----------------------------------------------
// R2 e' lo spirito Yin (陰神) di R1: sta sopra di lui e lo condiziona. La relazione
// elementare fra i due non produce direzione (misurata: tutti e cinque i casi fra
// 47,4% e 51,3%); a produrla e' la COPPIA DEI CARATTERI.
// Quattro coppie non esistono mai, per come la piastra celeste dispone R2 sopra R1:
// B/G, G/G, G/O, O/O.
// Cablate solo le caselle con almeno 40 carte e i due periodi dalla stessa parte.
// Misure 02/09/2026, soglia 20 pip, vuoti esclusi (ne' R1 ne' R2 nei 旬空).
//   R1=G R2=P  SHORT  n 69   59,4%  z 1,57  vec 57,7 / rec 58,3
//   R1=G R2=C  SHORT  n 43   58,1%  z 1,07  vec 50,0 / rec 60,0
//   R1=C R2=C  SHORT  n 89   56,2%  z 1,17  vec 59,5 / rec 54,3
//   R1=W R2=W  LONG   n 49   63,3%  z 1,86  vec 65,2 / rec 60,0
//   R1=P R2=P  LONG   n 40   60,0%  z 1,26  vec 62,5 / rec 63,3
//   R1=C R2=W  LONG   n 141  56,0%  z 1,43  vec 48,3 / rec 58,9
//   R1=W R2=B  LONG   n 56   57,1%  z 1,07  vec 60,0 / rec 57,6
//   R1=W R2=C  LONG   n 57   56,1%  z 0,93  vec 47,4 / rec 62,9
// Scartate perche' i due periodi vanno in direzioni opposte: O/G, G/B, O/C, P/O,
// P/W, B/O, B/B. Scartata W/G (66,7% SHORT ma sole 27 carte).
// Due fili dottrinali emersi: (a) quando R2 RIPETE il carattere di R1 il segnale e'
// forte e stabile (W/W e P/P verso LONG, C/C verso SHORT; solo B/B e' rotto);
// (b) un G su R2 aggrava sempre, qualunque sia R1.
const COPPIA_R1_R2 = {
  'G|P': 'SHORT', 'G|C': 'SHORT', 'C|C': 'SHORT',
  'W|W': 'LONG',  'P|P': 'LONG',  'C|W': 'LONG',
  'W|B': 'LONG',  'W|C': 'LONG'
};
// VUOTO SU R2 (Edu, 02/09/2026): R2 e' lo spirito che CONDIZIONA, non il protagonista.
// Un condizionatore vuoto semplicemente non condiziona, quindi la coppia si legge lo
// stesso: il vuoto su R2 SI SALTA, come se non ci fosse.
// Misura del test A/B (soglia 20): sulle carte oggi mute per vuoto,
//   R2 vuoto · verdetto letto com'e'      n 53   56,6%  z 0,96  vec 56,0 / rec 59,3
//   R2 vuoto · verdetto rovesciato        n 53   43,4%
//   R1 vuoto · verdetto letto com'e'      n 205  51,2%  (saltare NON aiuta: R1 e' il
//                                          protagonista, resta muto e va ancora letto)
// Il verdetto rovesciato peggiora su tutte le 258 carte e in entrambi i periodi:
// l'ipotesi "il vuoto rompe quello che avrebbe fatto" e' esclusa.
// CAUTELA: il ramo su R2 e' scelto dopo aver visto i dati e vale z 0,96, cioe' dentro
// il rumore. Cablato per decisione di Edu, da riverificare quando il campione cresce.
function via4_coppiaR1R2(c) {
  const V = c.vuoti || [];
  if (!c.R2) return null;
  if (V.indexOf(c.R1) >= 0) return null;   // R1 vuoto: la via tace, il protagonista non c'e'
  const p1 = parentela(c.steloGiorno, c.R1), p2 = parentela(c.steloGiorno, c.R2);
  const dir = COPPIA_R1_R2[p1 + '|' + p2];
  if (!dir) return null;
  return { dir: dir, via: 'la coppia R1/R2',
    perche: 'su R1 c\'e\' ' + p1 + ' e su R2, che lo condiziona, c\'e\' ' + p2 };
}

// Ordine di precedenza: il legame fra steli parla per primo perche' e' l'unica via
// nata da una carta letta da Edu; poi il pari, poi le caselle isolate, e per ultima
// la coppia R1/R2, che raccoglie quello che le altre non hanno letto.
const VIE = [ via1_legameDelloHost, via2_pariSuR1, via3_caselleIsolate, via4_coppiaR1R2 ];

// --- VIA 5 · R2 PRENDE IL POSTO DI R1 VUOTO ---------------------------------
// Dottrina dettata da Edu (02/09/2026): quando R1 e' vuoto non va ne' ignorato ne'
// letto al contrario: e' ASSENTE. Il posto sopra lo stelo del giorno non resta libero,
// lo occupa chi gli sta immediatamente sopra, cioe' R2, che si comporta come fosse R1.
// La carta viene riletta da capo con R2 al posto di R1 (e senza R2, che non c'e' piu').
// Se anche R2 e' vuoto, la via tace.
// Misure 02/09/2026 (soglia 20), sulle 343 carte mute con R1 vuoto:
//   R2 al posto di R1, tutte        n 158  58,2%  z 2,07  +1.848 pip  vec 61,9 / rec 58,6
//     di cui via del pari su R1     n 74   63,5%  z 2,32  +1.483 pip  vec 71,4 / rec 61,0
//     di cui caselle isolate        n 83   53,0%  z 0,55
// Le tre ipotesi sul vuoto di R1 si separano nettamente:
//   leggerlo come se fosse pieno    51,2%  (niente)
//   rovesciare il verdetto          48,8%  (peggio)
//   farlo sostituire da R2          58,2%  (l'unica che produce)
function via5_R2prendeIlPostoDiR1(c) {
  const V = c.vuoti || [];
  if (!c.R2) return null;
  if (V.indexOf(c.R1) < 0) return null;       // vale solo se R1 e' vuoto
  if (V.indexOf(c.R2) >= 0) return null;      // anche R2 vuoto: nessuno prende il posto
  const sost = Object.assign({}, c, { R1: c.R2, R2: null });
  for (const via of VIE) {
    const v = via(sost);
    if (v && v.dir) return { dir: v.dir, via: 'R2 al posto di R1 vuoto',
      perche: 'R1 (' + c.R1 + ') e\' vuoto e non c\'e\'; il posto sopra lo stelo del giorno ' +
              'lo prende R2 (' + c.R2 + '), e da li\' ' + v.perche };
  }
  return null;
}

// ============================================================================
//  VIA DEL GRUPPO COMPLETO NEI TRE MESSAGGI  —  dottrina certificata da Edu 03/09/2026
// ============================================================================
// I Tre Messaggi formano un gruppo completo, direzionale 三會 o trigono 三合.
// L'elemento del gruppo si legge come parentela verso lo stelo del giorno.
// Quando quell'elemento e' G (鬼 Fantasma), il movimento intero si raccoglie nella cosa
// che uccide lo host: lo host e' circondato e perde -> SHORT.
// Carta d'origine: USDJPY 09/10/2024 s148 (申酉戌 = Metallo = W per 丙), dove Edu ha visto
// che il gruppo completo nei messaggi comanda la lettura; misurando le classi, l'unica
// che regge in entrambi i periodi e' il Fantasma.
//   n 34   73,5%  z 2,74  +1.523 pip   vec 76,5 / rec 73,3
//   di cui 三合 trigono      n 17  76,5%   ·   三會 direzionale  n 17  70,6%
// Le altre parentele (W, C, P, O, B) non danno segnale stabile: la via tace.
const GRUPPI_TRE_MESSAGGI = [
  { rami: '寅卯辰', el: '木', tipo: '三會 direzionale' },
  { rami: '巳午未', el: '火', tipo: '三會 direzionale' },
  { rami: '申酉戌', el: '金', tipo: '三會 direzionale' },
  { rami: '亥子丑', el: '水', tipo: '三會 direzionale' },
  { rami: '申子辰', el: '水', tipo: '三合 trigono' },
  { rami: '亥卯未', el: '木', tipo: '三合 trigono' },
  { rami: '寅午戌', el: '火', tipo: '三合 trigono' },
  { rami: '巳酉丑', el: '金', tipo: '三合 trigono' }
];
const RAPPRESENTANTE = { '木':'寅', '火':'巳', '土':'辰', '金':'申', '水':'亥' };

function gruppoNeiTreMessaggi(c) {
  const T = c.treMessaggi;
  if (!T) return null;
  const set = [T.chu, T.zhong, T.mo];
  if (set.some(function(b){ return !b; })) return null;
  if (new Set(set).size !== 3) return null;                 // gruppo incompleto: due messaggi uguali
  for (var i = 0; i < GRUPPI_TRE_MESSAGGI.length; i++) {
    var g = GRUPPI_TRE_MESSAGGI[i];
    if (set.every(function(b){ return g.rami.indexOf(b) >= 0; })) return g;
  }
  return null;
}

function via0_gruppoCompletoFantasma(c) {
  const g = gruppoNeiTreMessaggi(c);
  if (!g) return null;
  const par = parentela(c.steloGiorno, RAPPRESENTANTE[g.el]);
  if (par !== 'G') return null;                             // solo il Fantasma parla
  const T = c.treMessaggi;
  return { dir: 'SHORT', via: 'gruppo completo nei Tre Messaggi = G',
    perche: 'i Tre Messaggi ' + T.chu + T.zhong + T.mo + ' formano un ' + g.tipo +
            ' completo di ' + g.el + ', che per lo stelo del giorno ' + c.steloGiorno +
            ' e\' G: il movimento intero si raccoglie nella cosa che uccide ' +
            'lo host, che e\' circondato e perde' };
}

// Catena completa. La via 5 sta in fondo: interviene solo quando le altre hanno taciuto
// perche' R1 era vuoto.
// ============================================================================
//  VIA ULTIMA · LA RICCHEZZA SUL PRIMO MESSAGGIO  —  dottrina certificata da Edu 03/09/2026
// ============================================================================
// Quando tutte le vie di casella hanno taciuto, si guarda il primo messaggio (初傳):
// se e' W (妻財 Ricchezza) per lo stelo del giorno, la carta va LONG.
// Quello che fanno M2 e M3 non conta: aiutino o ostacolino M1, il verso e' lo stesso
// (non ostacolano 59,4% su 96 · ostacolano 58,6% su 87).
// Due cose la spengono:
//   - M1 vuoto (旬空): un ramo vuoto non agisce  (36 carte, 55,6%, vec 40 -> tace)
//   - M1 in cima a una lezione dello stelo E a una del ramo del giorno insieme:
//     la Ricchezza contesa dai due lati non arriva a nessuno (65 carte, 43,1% LONG -> tace)
// Sulle carte gia' lette dalle altre vie non aggiunge nulla (dove concorda 61,8%, dove
// contraddice 50/50): per questo sta IN FONDO alla catena, come condizione ultima.
//   n 139   62,6%  z 2,97  +1.253 pip   vec 58,1 / rec 65,7   (misurata sulle mute, soglia 20)
function via6_ricchezzaSulPrimoMessaggio(c) {
  const T = c.treMessaggi;
  if (!T || !T.chu) return null;
  const m1 = T.chu;
  if (parentela(c.steloGiorno, m1) !== 'W') return null;
  const V = c.vuoti || [];
  if (V.indexOf(m1) >= 0) return null;                                  // vuoto: non agisce
  const ds = (m1 === c.R1 || m1 === c.R2), db = (m1 === c.R3 || m1 === c.R4);
  if (ds && db) return null;                                            // contesa dai due lati
  // Nutrimento = GENERAZIONE VERA (il 比和 non nutre — lezione S32, da non ripetere).
  // Edu (S35): la via prende tutte, ma va guardato se la Ricchezza e' nutrita da entrambi,
  // da uno solo o da nessuno dei due messaggi che seguono.
  //   nessuno   61 carte  55,7%  vec 50,0 / rec 60,6
  //   uno       70 carte  67,1%  vec 66,7 / rec 65,6
  //   entrambi   8 carte  75,0%
  const elM1 = EL_RAMO[m1];
  const genera = function(b){ return b && GENERA[EL_RAMO[b]] === elM1; };
  const nutrimento = (genera(T.zhong) ? 1 : 0) + (genera(T.mo) ? 1 : 0);
  // Ostacolo = M2 o M3 CONTROLLANO l'elemento di M1. Da solo non cambia il verso (60,0% su 65),
  // ma se la Ricchezza e' anche NON nutrita, la via non regge: 36 carte 52,8% -471 pip.
  // Se e' nutrita dall'altro messaggio, l'ostacolo e' neutralizzato (29 carte 69,0% +283).
  // Integrato su indicazione di Edu (S35): dove la Ricchezza e' ostacolata e nessuno la genera, la via TACE.
  const controlla = function(b){ return b && CONTROLLA[EL_RAMO[b]] === elM1; };
  const ostacolo = (controlla(T.zhong) ? 1 : 0) + (controlla(T.mo) ? 1 : 0);
  if (ostacolo > 0 && nutrimento === 0) return null;
  const NUTR = ['non nutrita da M2 ne\' da M3', 'nutrita da uno solo fra M2 e M3', 'nutrita da entrambi M2 e M3'];
  return { dir: 'LONG', via: 'W sul primo messaggio', nutrimento: nutrimento, ostacolo: ostacolo,
    perche: 'nessuna casella parla; M1 ' + m1 + ' e\' W per lo stelo ' +
            'del giorno ' + c.steloGiorno + (ds ? ', esce dal lato dello stelo' : db ? ', esce dal lato del ramo del giorno' : '') +
            ', non e\' vuoto e non e\' conteso: la W arriva allo host (' + NUTR[nutrimento] + (ostacolo ? ', ostacolata ma il generatore la sostiene' : '') + ')' };
}

// ============================================================================
//  VIA 7 · IL FRATELLO SU R1 LEGATO IN 六合  —  costruita con Edu 03/09/2026
// ============================================================================
// B (兄弟 Fratelli) su R1 fa perdere lo host. Se R2 lo LEGA in 六合, il B e' fermato e la carta
// va LONG. Carta guida EURUSD 04/06/2020 s112 (R1 戌 B, R2 卯 O, 卯戌合). Ma il B si lascia
// legare solo se e' fermabile. Due carte lette da Edu dicono quando NON lo e':
//   - USDCAD 31/03/2021 s126: il B su R1 E' IL GENERALE DEL MESE, ramo mai vuoto e sempre
//     timely -> troppo forte, non si ferma (4 carte, 3/4 SHORT)
//   - EURJPY 11/07/2024 s175: il RAMO DEL GIORNO CLASHA R1 mentre lo stelo siede su 巳午未
//     completo -> il B timely clashato si rinforza, il legame non lo tiene (5 carte, 3/5 SHORT)
// Chi lega non conta: con R2 = O (il caso della carta guida) 54,3%, con qualunque R2 61,4%.
// Il legame conta piu' della parentela di chi lega.
//   n 39   64,1%  z 1,76  +881 pip   vec 69,6 / rec 56,3   (misurata sulle mute, soglia 20)
// Dove il B e' il generale del mese o e' clashato dal giorno la via TACE (n troppo piccoli per un verso).
const LIUHE = { '子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯','辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午' };
const CLASH = { '子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳' };

function via7_fratelloLegato(c) {
  if (!c.R1 || !c.R2) return null;
  const V = c.vuoti || [];
  if (V.indexOf(c.R1) >= 0 || V.indexOf(c.R2) >= 0) return null;
  if (parentela(c.steloGiorno, c.R1) !== 'B') return null;
  if (LIUHE[c.R1] !== c.R2) return null;                       // nessun legame
  if (c.R1 === c.generaleMese) return null;                    // il B e' il generale del mese: non si ferma
  if (CLASH[c.ramoGiorno] === c.R1) return null;               // il giorno lo clasha: si rinforza
  return { dir: 'LONG', via: 'B su R1 legato in 六合',
    perche: 'R1 ' + c.R1 + ' e\' B e farebbe perdere lo host, ma R2 ' + c.R2 +
            ' (' + parentela(c.steloGiorno, c.R2) + ') lo lega in 六合 e lo ferma; il B non e\' il ' +
            'generale del mese e il ramo del giorno non lo clasha, quindi si lascia legare' };
}

// ============================================================================
//  VIA 8 · IL FIGLIO VUOTO CHE PROMETTE LA RICCHEZZA IN FONDO  —  S35, 03/09/2026
// ============================================================================
// M1 e' C (子孫 Figli) per lo stelo del giorno; C genera W. Edu ha chiesto cosa succede quando
// la W sta in M2 o M3. Con tutto pieno non succede nulla (M2 55,6% · M3 56,0%). La forma che
// parla e' col Figlio VUOTO (旬空) e la Ricchezza PIENA sul TERZO messaggio: il generatore non
// c'e', la Ricchezza promessa in fondo non arriva, lo host resta a mani vuote -> SHORT.
//   n 13   84,6% SHORT  z 2,50  +716 pip   vec 100 / rec 71,4   (mute, soglia 20)
// Il rovescio (Figlio vuoto, W piena subito in M2) tende a LONG (14 carte 64,3%) ma e' debole:
// resta in osservazione, la via non lo legge.
// Integrata su indicazione di Edu ("integra i fenomeni"), n piccolo: da riverificare.
function via8_figlioVuotoRicchezzaInFondo(c) {
  const T = c.treMessaggi;
  if (!T || !T.chu || !T.mo) return null;
  if (parentela(c.steloGiorno, T.chu) !== 'C') return null;
  const V = c.vuoti || [];
  if (V.indexOf(T.chu) < 0) return null;                       // il Figlio deve essere vuoto
  if (parentela(c.steloGiorno, T.mo) !== 'W') return null;     // la Ricchezza sul terzo
  if (V.indexOf(T.mo) >= 0) return null;                       // e piena
  if (parentela(c.steloGiorno, T.zhong) === 'W') return null;  // se la W e' gia' in M2 non e' questo caso
  return { dir: 'SHORT', via: 'C vuoto con W sul terzo messaggio',
    perche: 'il primo messaggio ' + T.chu + ' e\' C ma e\' vuoto (旬空): non genera; ' +
            'la W ' + T.mo + ' sta sul terzo messaggio ma senza chi la genera ' +
            'non arriva allo host' };
}

// ============================================================================
//  VIA 9 · P SUL PRIMO MESSAGGIO DAL LATO DELLO STELO  —  S35, 03/09/2026
// ============================================================================
// M1 e' P per lo stelo del giorno ed esce dalle lezioni dello stelo (1-2). Per il carattere
// (regola LY di Edu: B e P fanno perdere il loro lato), un P sul lato dello host fa perdere lo host.
// Vale se il P non e' ostacolato: se M2 o M3 lo controllano, e' contenuto e non parla.
//   dal lato dello stelo, mute:            44 carte  63,6% SHORT   vec 64,3 / rec 64,3
//   di cui NON ostacolato:                 19 carte  78,9% SHORT   vec 75,0 / rec 80,0   <- la via
//   di cui ostacolato:                     25 carte  52,0% SHORT   -> tace
//   dal lato del ramo del giorno, mute:    80 carte  51,2%          -> tace
// M1 vuoto: 9 carte, non agisce, tace.
function via9_pDalLatoDelloStelo(c) {
  const T = c.treMessaggi;
  if (!T || !T.chu) return null;
  const m1 = T.chu;
  if (parentela(c.steloGiorno, m1) !== 'P') return null;
  const V = c.vuoti || [];
  if (V.indexOf(m1) >= 0) return null;
  const ds = (m1 === c.R1 || m1 === c.R2), db = (m1 === c.R3 || m1 === c.R4);
  if (!ds || db) return null;                                          // solo dal lato dello stelo
  const elM1 = EL_RAMO[m1];
  const controlla = function(b){ return b && CONTROLLA[EL_RAMO[b]] === elM1; };
  if (controlla(T.zhong) || controlla(T.mo)) return null;              // ostacolato: contenuto
  return { dir: 'SHORT', via: 'P sul primo messaggio dal lato dello stelo',
    perche: 'il primo messaggio ' + m1 + ' e\' P per lo stelo del giorno ' + c.steloGiorno +
            ' ed esce dal lato dello stelo, senza che M2 o M3 lo controllino: il P fa perdere il suo lato, che e\' lo host' };
}

// ============================================================================
//  VIA 10 · O SUL PRIMO MESSAGGIO DAL LATO DELLO STELO, NON NUTRITO  —  S35, 03/09/2026
// ============================================================================
// M1 e' O per lo stelo del giorno ed esce dalle lezioni dello stelo. L'O controlla lo host.
//   dal lato del ramo del giorno, mute:   25 carte 52,0%          -> tace
//   dal lato dello stelo, mute:          106 carte 54,7% SHORT     debole
//     di cui NON nutrito (nessun generatore fra M2/M3): 39 carte 64,1% SHORT  vec 68,7 / rec 65  <- la via
//     di cui nutrito:                                   58 carte 48,3%        -> tace
// NOTA: sulle carte gia' lette SHORT dal motore, l'O NUTRITO su M1 conferma lo SHORT all'88% (34 carte),
// mentre l'O non nutrito lo lascia al 46%. Sulle mute succede il contrario. Le due cose non si spiegano
// insieme: cablata la forma delle mute su indicazione di Edu, da rileggere con una carta.
function via10_oDalLatoDelloSteloNonNutrito(c) {
  const T = c.treMessaggi;
  if (!T || !T.chu) return null;
  const m1 = T.chu;
  if (parentela(c.steloGiorno, m1) !== 'O') return null;
  const V = c.vuoti || [];
  if (V.indexOf(m1) >= 0) return null;
  const ds = (m1 === c.R1 || m1 === c.R2), db = (m1 === c.R3 || m1 === c.R4);
  if (!ds || db) return null;
  const elM1 = EL_RAMO[m1];
  const genera = function(b){ return b && GENERA[EL_RAMO[b]] === elM1; };
  if (genera(T.zhong) || genera(T.mo)) return null;                    // nutrito: tace
  return { dir: 'SHORT', via: 'O sul primo messaggio dal lato dello stelo, non nutrito',
    perche: 'il primo messaggio ' + m1 + ' e\' O per lo stelo del giorno ' + c.steloGiorno +
            ' ed esce dal lato dello stelo; ne\' M2 ne\' M3 lo generano: l\'O controlla lo host' };
}

// ============================================================================
//  VIA 11 · G VUOTO SUL PRIMO MESSAGGIO  —  S35, 03/09/2026
// ============================================================================
// M1 e' G per lo stelo del giorno ma e' nei 旬空: la cosa che uccide lo host apre il movimento
// ma non c'e'. Il pericolo e' vuoto, lo host sopravvive -> LONG.
// G pieno su M1 non da' verso in nessun taglio (142 carte 52,1%, lato, nutrimento, ostacolo: niente).
//   n 17   70,6% LONG  z 1,70  +331 pip   vec 83,3 / rec 70,0   (mute, un lato solo, soglia 20)
function via11_gVuotoSulPrimoMessaggio(c) {
  const T = c.treMessaggi;
  if (!T || !T.chu) return null;
  const m1 = T.chu;
  if (parentela(c.steloGiorno, m1) !== 'G') return null;
  const V = c.vuoti || [];
  if (V.indexOf(m1) < 0) return null;                                  // deve essere vuoto
  const ds = (m1 === c.R1 || m1 === c.R2), db = (m1 === c.R3 || m1 === c.R4);
  if (ds && db) return null;
  return { dir: 'LONG', via: 'G vuoto sul primo messaggio',
    perche: 'il primo messaggio ' + m1 + ' e\' G per lo stelo del giorno ' + c.steloGiorno +
            ' ma e\' vuoto (旬空): il pericolo che apre il movimento non c\'e\', lo host sopravvive' };
}

// ============================================================================
//  VIA 12 · O SOPRA LO STELO, HOST SEDUTO SUL VUOTO  —  S36, 03/09/2026
// ============================================================================
// Carta guida USDJPY 01/12/2022 s137 (giorno 戊子, ora 辰, generale 寅, vuoti 午未):
// R1 卯 e' O per 戊; il palazzo dello host 巳, portato sul piatto del cielo, siede sopra 未
// di terra, che e' vuoto. L'O sopra lo stelo preme e sotto non c'e' terra per reggere:
// lo host perde -> SHORT. Dettata da Edu (S36).
// Da soli non reggono: O su R1 53,0% su 279 · host sul vuoto 52,7% su 427. Insieme:
//   n 29   75,9% SHORT  z 2,79  +1.036 pip   vec 63,6 / rec 83,3   (tutte le lette, soglia 20)
//   sulle mute: 13 carte 76,9% (vec 50,0 su 4 / rec 88,9). Cablata in CODA: parla solo dove tutto il resto tace.
// L'O vuoto su R1 non agisce (va LONG al 63%): qui si chiede l'O NON vuoto.
const RAMI12 = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
function via12_oSoproLoSteloHostSulVuoto(c) {
  if (!c.R1 || !c.palazzoHost || !c.generaleMese || !c.oraRamo) return null;
  if (parentela(c.steloGiorno, c.R1) !== 'O') return null;
  const V = c.vuoti || [];
  if (V.indexOf(c.R1) >= 0) return null;                               // O vuoto: non preme
  const delta = ((RAMI12.indexOf(c.generaleMese) - RAMI12.indexOf(c.oraRamo)) % 12 + 12) % 12;
  const sede = RAMI12[((RAMI12.indexOf(c.palazzoHost) - delta) % 12 + 12) % 12];   // terra sotto il palazzo (in cielo)
  if (V.indexOf(sede) < 0) return null;                                // la terra sotto lo host non e' vuota
  return { dir: 'SHORT', via: 'O sopra lo stelo, host seduto sul vuoto',
    perche: 'R1 ' + c.R1 + ' e\' O per lo stelo del giorno ' + c.steloGiorno + ' e preme sullo host; il palazzo ' +
            c.palazzoHost + ' in cielo siede sopra ' + sede + ' di terra, che e\' vuoto (旬空): sotto non c\'e\' terra, lo host perde' };
}

// ============================================================================
//  VIA 13 · O SOPRA LO STELO CON 勾陳 (Gancio)  —  S36, 03/09/2026
// ============================================================================
// Prova degli spiriti chiesta da Edu sulla carta USDJPY 28/03/2022 s122 (R1 巳 O con 朱雀).
// Il 朱雀 sull'O non decide (41 carte 58,5% LONG, vec 68 / rec 47: si ribalta).
// Il 勾陳 sull'O e' netto: l'O sopra lo stelo con il Gancio addosso fa perdere lo host -> SHORT.
//   n 63   69,8% SHORT  z 3,15  +1.168 pip   vec 70,4 / rec 68,6   (tutte le lette, soglia 20)
//   sulle mute: 37 carte 64,9% (vec 66,7 / rec 61,1). O vuoto col Gancio: 9 carte, 7 SHORT (vale anche vuoto).
// Integrata su regola di Edu (S35): un fenomeno netto si mette nel motore e si dice. In CODA.
function via13_oConGancio(c) {
  if (!c.R1 || !c.spiritoR1) return null;
  if (parentela(c.steloGiorno, c.R1) !== 'O') return null;
  if (c.spiritoR1 !== '勾陳') return null;
  return { dir: 'SHORT', via: 'O sopra lo stelo con 勾陳',
    perche: 'R1 ' + c.R1 + ' e\' O per lo stelo del giorno ' + c.steloGiorno + ' e porta il 勾陳 (Gancio): l\'O con il Gancio addosso fa perdere lo host' };
}

// ============================================================================
//  VIA 14 · B SOPRA LO STELO CON 青龍 (Drago Azzurro)  —  S36, 03/09/2026
// ============================================================================
// Prova degli spiriti su tutte le parentele di R1 e di M1 (SPIRITI=R1 / SPIRITI=M1). Unica altra
// casella che regge nei due periodi: il B sopra lo stelo con il Drago Azzurro addosso -> LONG.
//   n 32   75,0% LONG  z 2,83  +899 pip   vec 81,8 / rec 68,4   (tutte le lette, soglia 20)
//   sulle mute: 13 carte 76,9% (vec 80,0 / rec 75,0). In CODA.
// Scartate: W con 玄武 -> LONG 48 carte 64,6% ma tutte gia' lette (in coda non aggiunge nulla);
// W con 青龍 -> SHORT 38 carte 68,4% ma vec 50,0 / rec 79,2 (non regge); P con 白虎 -> LONG 65 · 61,5% z 1,86 (sotto soglia).
function via14_bConDragoAzzurro(c) {
  if (!c.R1 || !c.spiritoR1) return null;
  if (parentela(c.steloGiorno, c.R1) !== 'B') return null;
  if (c.spiritoR1 !== '青龍') return null;
  return { dir: 'LONG', via: 'B sopra lo stelo con 青龍',
    perche: 'R1 ' + c.R1 + ' e\' B per lo stelo del giorno ' + c.steloGiorno + ' e porta il 青龍 (Drago Azzurro): il B col Drago addosso non contende, lo host vince' };
}

// ============================================================================
//  VIA 15 · LO SPIRITO SOPRA LO STELO GENERA IL RAMO DEL GIORNO  —  S37, 04/09/2026
// ============================================================================
// Concetto classico portato da Edu (S37): "lo spirito sopra lo stelo del giorno genera il ramo del
// giorno: host e guest si giovano a vicenda". R1 (non vuoto) genera per elemento il ramo del giorno -> LONG.
// Misura CONCETTO=4 (soglia 20), nella posizione reale in catena (dopo le vie 1-14, sulle mute):
//   n 82   58,5% LONG  z 1,55  +773 pip   vec 63,9 / rec 52,4
// Casella intera: 392 carte 53,8%. La forma gemella (b) "R3 genera lo stelo del giorno" da sola
// vince il 56% ma perde pip (-91 sulle mute): non cablata. Cablata su decisione di Edu. In CODA.
function via15_r1GeneraIlRamoDelGiorno(c) {
  if (!c.R1 || !c.ramoGiorno) return null;
  if ((c.vuoti || []).indexOf(c.R1) >= 0) return null;      // il vuoto non agisce
  if (GENERA[EL_RAMO[c.R1]] !== EL_RAMO[c.ramoGiorno]) return null;
  return { dir: 'LONG', via: 'R1 genera il ramo del giorno',
    perche: 'R1 ' + c.R1 + ' (' + EL_RAMO[c.R1] + ') genera il ramo del giorno ' + c.ramoGiorno + ' (' + EL_RAMO[c.ramoGiorno] + '): host e guest si giovano, lo host vince' };
}

// ============================================================================
//  VIA 16 · IL 祿 (Lu) INCROCIATO  —  S37, 04/09/2026
// ============================================================================
// Concetto classico portato da Edu (S37): "lo spirito sopra lo stelo e' il Lu del ramo del giorno, o lo spirito
// sopra il ramo e' il Lu dello stelo del giorno". Il testo dice "favorisce lo host"; la misura, nella posizione
// reale in catena (dopo le vie 1-15, sulle mute), va in senso opposto: vince il GUEST -> SHORT.
//   (b) R3 e' il 祿 dello stelo del giorno:  52 carte  61,5% SHORT  vec 63,6 / rec 64,3  +938 pip
//   (a) R1 e' il 祿 del ramo del giorno:     11 carte  72,7% SHORT   (祿 dello stelo nascosto principale del ramo)
//   (a) o (b):                                63 carte  63,5% SHORT  z 2,14  vec 67,9 / rec 62,5  +1.303 pip
// Casella intera (tutte le carte): 435 carte 54,0% SHORT. Cablata su decisione di Edu ("sopra il 60% si cabla"). In CODA.
const LU_STELO = { '甲':'寅','乙':'卯','丙':'巳','丁':'午','戊':'巳','己':'午','庚':'申','辛':'酉','壬':'亥','癸':'子' };
const STELO_NASCOSTO = { '子':'癸','丑':'己','寅':'甲','卯':'乙','辰':'戊','巳':'丙','午':'丁','未':'己','申':'庚','酉':'辛','戌':'戊','亥':'壬' };
function via16_luIncrociato(c) {
  if (!c.R1 || !c.R3 || !c.steloGiorno || !c.ramoGiorno) return null;
  const V = c.vuoti || [];
  const a = LU_STELO[STELO_NASCOSTO[c.ramoGiorno]] === c.R1 && V.indexOf(c.R1) < 0;
  const b = LU_STELO[c.steloGiorno] === c.R3 && V.indexOf(c.R3) < 0;
  if (!a && !b) return null;
  const perche = b ? 'R3 ' + c.R3 + ' e\' il 祿 (Lu) dello stelo del giorno ' + c.steloGiorno + ': il guest siede sulla sede di prosperita\' dello host e vince'
                   : 'R1 ' + c.R1 + ' e\' il 祿 (Lu) del ramo del giorno ' + c.ramoGiorno + ' (stelo nascosto ' + STELO_NASCOSTO[c.ramoGiorno] + '): il guest vince';
  return { dir: 'SHORT', via: 'il 祿 incrociato fra stelo e ramo', perche: perche };
}

// ============================================================================
//  VIA 17 · 驛馬 (Cavallo di posta) SOPRA LO STELO  —  S37, 04/09/2026
// ============================================================================
// Concetto classico portato da Edu (S37): "lo spirito sopra lo stelo del giorno e' il Cavallo di posta".
// 驛馬 dal ramo del giorno: 申子辰->寅 · 寅午戌->申 · 巳酉丑->亥 · 亥卯未->巳. Verso LONG.
// Nella posizione reale in catena (dopo le vie 1-16, sulle mute): 27 carte 63,0% LONG  vec 53,8 / rec 71,4  +533 pip
// (vale anche vuoto: 20 carte 60,0%). Casella intera 152 · 52,0%. Cablata su regola di Edu ("sopra il 55% si cabla sempre"). In CODA.
const YIMA = { '申':'寅','子':'寅','辰':'寅','寅':'申','午':'申','戌':'申','巳':'亥','酉':'亥','丑':'亥','亥':'巳','卯':'巳','未':'巳' };
function via17_cavalloDiPostaSuR1(c) {
  if (!c.R1 || !c.ramoGiorno) return null;
  if (YIMA[c.ramoGiorno] !== c.R1) return null;
  return { dir: 'LONG', via: '驛馬 sopra lo stelo',
    perche: 'R1 ' + c.R1 + ' e\' il 驛馬 (Cavallo di posta) del ramo del giorno ' + c.ramoGiorno + ': il movimento e\' dello host, che vince' };
}

// ============================================================================
//  VIA 18 · 日祿 (Lu del giorno) SOPRA LO STELO  —  S37, 04/09/2026
// ============================================================================
// Concetto classico portato da Edu (S37): "lo spirito sopra lo stelo del giorno e' il Lu dello stelo del giorno".
// Nella posizione reale in catena (dopo le vie 1-17, sulle mute): 26 carte 57,7% LONG  vec 33,3 / rec 72,7  +297 pip.
// Il 祿 vuoto va contro (9 carte 22,2%): la via parla solo non vuoto. Casella intera 96 · 51,0%.
// Cablata su regola di Edu ("sopra il 55% si cabla sempre"). In CODA.
function via18_luDelGiornoSuR1(c) {
  if (!c.R1 || !c.steloGiorno) return null;
  if (LU_STELO[c.steloGiorno] !== c.R1) return null;
  if ((c.vuoti || []).indexOf(c.R1) >= 0) return null;      // il vuoto non agisce
  return { dir: 'LONG', via: '日祿 sopra lo stelo',
    perche: 'R1 ' + c.R1 + ' e\' il 祿 (Lu) dello stelo del giorno ' + c.steloGiorno + ': lo host siede sulla propria sede di prosperita\' e vince' };
}

// ============================================================================
//  VIA 19 · 帝旺 DELLO STELO SOPRA IL RAMO DEL GIORNO  —  S37, 04/09/2026
// ============================================================================
// Concetto classico portato da Edu (S37, "Prime location", lettura 帝旺 per elemento): lo spirito sopra il ramo del
// giorno (R3) e' l'apice dell'elemento dello stelo del giorno (木->卯 · 火,土->午 · 金->酉 · 水->子) -> LONG.
// Nella posizione reale in catena (dopo le vie 1-18, sulle mute): 30 carte 63,3% LONG  vec 66,7 / rec 60,0  +548 pip.
// Casella intera 160 · 54,4%. Il lato (a) (R1 apice del ramo del giorno) non da' verso. Cablata su regola di Edu. In CODA.
const DIWANG = { 'Legno':'卯','Fuoco':'午','Terra':'午','Metallo':'酉','Acqua':'子' };
function via19_apiceDelloSteloSuR3(c) {
  if (!c.R3 || !c.steloGiorno) return null;
  if (DIWANG[EL_STELO[c.steloGiorno]] !== c.R3) return null;
  if ((c.vuoti || []).indexOf(c.R3) >= 0) return null;      // il vuoto non agisce
  return { dir: 'LONG', via: '帝旺 dello stelo sopra il ramo',
    perche: 'R3 ' + c.R3 + ' e\' il 帝旺 (apice) dell\'elemento dello stelo del giorno ' + c.steloGiorno + ' (' + EL_STELO[c.steloGiorno] + '): lo host e\' al massimo della forza e vince' };
}

// ============================================================================
//  VIA 20 · LO STELO CAVALCA LA PROPRIA TOMBA (墓)  —  S37, 04/09/2026
// ============================================================================
// Concetto classico portato da Edu (S37): "stelo e ramo del giorno che cavalcano o siedono sulla tomba: blocco".
// Regge solo il lato dello stelo: R1 e' la tomba dello stelo del giorno (甲未 乙戌 丙戌 丁丑 戊戌 己丑 庚丑 辛辰 壬辰 癸未) -> SHORT.
// Nella posizione reale in catena (dopo le vie 1-19, sulle mute): 28 carte 67,9% SHORT  vec 75,0 / rec 64,7  +729 pip.
// Casella intera 138 · 55,8% SHORT. Il ramo che cavalca la tomba (R3) non da' verso (171 · 53,2% SHORT, mute 26 · 53,8%).
// Cablata su regola di Edu ("sopra il 55% si cabla sempre"). In CODA.
const TOMBA_STELO = { '甲':'未','乙':'戌','丙':'戌','丁':'丑','戊':'戌','己':'丑','庚':'丑','辛':'辰','壬':'辰','癸':'未' };
function via20_steloCavalcaLaTomba(c) {
  if (!c.R1 || !c.steloGiorno) return null;
  if (TOMBA_STELO[c.steloGiorno] !== c.R1) return null;
  return { dir: 'SHORT', via: 'lo stelo cavalca la tomba',
    perche: 'R1 ' + c.R1 + ' e\' la 墓 (tomba) dello stelo del giorno ' + c.steloGiorno + ': lo host e\' bloccato e perde' };
}

// ============================================================================
//  VIA 21 · IL RAMO DEL GIORNO SIEDE SULLA TOMBA  —  S37, 04/09/2026 (in prova)
// ============================================================================
// Nel piatto, sotto il ramo del giorno c'e' la tomba del suo elemento (木未 火戌 土戌 金丑 水辰) -> SHORT.
// In catena (dopo le vie 1-20, sulle mute): 44 carte 59,1% SHORT  vec 56,0 / rec 64,7  +608 pip. Casella intera 214 · 50,5%.
const TOMBA_EL = { 'Legno':'未','Fuoco':'戌','Terra':'戌','Metallo':'丑','Acqua':'辰' };
// Il piatto del cielo e' una rotazione: R1 sta sopra il palazzo dello host, quindi "cosa sta sotto b" si ricava da li'.
function sottoNelPiatto(c, b) {
  const i1 = RAMI12.indexOf(c.R1), ip = RAMI12.indexOf(c.palazzoHost), ib = RAMI12.indexOf(b);
  if (i1 < 0 || ip < 0 || ib < 0) return null;
  return RAMI12[(ib - (i1 - ip) + 24) % 12];
}
function via21_ramoSiedeSullaTomba(c) {
  if (!c.ramoGiorno || !c.R1 || !c.palazzoHost) return null;
  const sotto = sottoNelPiatto(c, c.ramoGiorno);
  if (sotto !== TOMBA_EL[EL_RAMO[c.ramoGiorno]]) return null;
  return { dir: 'SHORT', via: 'il ramo del giorno siede sulla tomba',
    perche: 'il ramo del giorno ' + c.ramoGiorno + ' siede nel piatto sopra ' + sotto + ', la 墓 (tomba) del suo elemento: blocco, lo host perde' };
}
// ============================================================================
//  VIA 22 · LO STELO DEL GIORNO SIEDE SULLA TOMBA  —  S37, 04/09/2026 (in prova)
// ============================================================================
// Nel piatto, sotto il palazzo dello stelo c'e' la tomba dello stelo -> LONG (misurato: verso contrario al testo).
// In catena (dopo le vie 1-21, sulle mute): 24 carte 62,5% LONG  vec 80,0 / rec 53,8  +555 pip. Casella intera 163 · 44,2% LONG.
function via22_steloSiedeSullaTomba(c) {
  if (!c.palazzoHost || !c.steloGiorno || !c.R1) return null;
  const sotto = sottoNelPiatto(c, c.palazzoHost);
  if (sotto !== TOMBA_STELO[c.steloGiorno]) return null;
  return { dir: 'LONG', via: 'lo stelo del giorno siede sulla tomba',
    perche: 'il palazzo dello stelo ' + c.palazzoHost + ' siede nel piatto sopra ' + sotto + ', la 墓 (tomba) dello stelo ' + c.steloGiorno + ': lo host vince' };
}

// ============================================================================
//  VIA 23 · LO STELO CAVALCA LA PROPRIA 絕 (estinzione)  —  S37, 04/09/2026
// ============================================================================
// Concetto classico portato da Edu (S37): "spirito sopra lo stelo nella tappa 絕: cattivo". Misurato: verso OPPOSTO al testo.
// R1 e' la 絕 dello stelo del giorno (甲申 乙酉 丙亥 丁子 戊亥 己子 庚寅 辛卯 壬巳 癸午) -> LONG.
// In catena (dopo le vie 1-22, sulle mute): 31 carte 71,0% LONG  z 2,33  vec 50,0 / rec 83,3  +1.048 pip. Casella intera 126 · 56,3%.
// Cablata su regola di Edu ("sopra il 55% si cabla sempre, come misurato"). In CODA.
const JUE_STELO = { '甲':'申','乙':'酉','丙':'亥','丁':'子','戊':'亥','己':'子','庚':'寅','辛':'卯','壬':'巳','癸':'午' };
function via23_steloCavalcaLaJue(c) {
  if (!c.R1 || !c.steloGiorno) return null;
  if (JUE_STELO[c.steloGiorno] !== c.R1) return null;
  return { dir: 'LONG', via: 'lo stelo cavalca la 絕',
    perche: 'R1 ' + c.R1 + ' e\' la 絕 (estinzione) dello stelo del giorno ' + c.steloGiorno + ': misurato, lo host vince' };
}

// ============================================================================
//  VIA 24 · IL RAMO CAVALCA LA PROPRIA 絕  —  S37, 04/09/2026
// ============================================================================
// Lato del ramo dello stesso concetto: R3 e' la 絕 dell'elemento del ramo del giorno (木申 火亥 土亥 金寅 水巳) -> LONG (verso misurato).
// In catena (dopo le vie 1-23, sulle mute): 14 carte 57,1% LONG  vec 75,0 / rec 50,0  +97 pip. Casella intera 193 · 44,0% LONG.
// Cablata su regola di Edu ("sopra il 55% si cabla sempre"). In CODA.
const JUE_EL = { 'Legno':'申','Fuoco':'亥','Terra':'亥','Metallo':'寅','Acqua':'巳' };
function via24_ramoCavalcaLaJue(c) {
  if (!c.R3 || !c.ramoGiorno) return null;
  if (JUE_EL[EL_RAMO[c.ramoGiorno]] !== c.R3) return null;
  return { dir: 'LONG', via: 'il ramo cavalca la 絕',
    perche: 'R3 ' + c.R3 + ' e\' la 絕 (estinzione) dell\'elemento del ramo del giorno ' + c.ramoGiorno + ': misurato, lo host vince' };
}

// ============================================================================
//  VIA 25 · R1 E R3 ENTRAMBI VUOTI  —  S37, 04/09/2026
// ============================================================================
// Concetto classico portato da Edu (S37): "spiriti sopra stelo e ramo entrambi vuoti: cattivo". Misurato: verso OPPOSTO -> LONG.
// In catena (dopo le vie 1-24, sulle mute): 21 carte 61,9% LONG  vec 50,0 / rec 66,7  +568 pip. Casella intera 40 · 57,5%.
// Un solo vuoto (R1 o R3) non da' verso (801 carte 50,7%). Cablata su regola di Edu ("sopra il 55% si cabla sempre"). In CODA.
function via25_entrambiVuoti(c) {
  if (!c.R1 || !c.R3) return null;
  const V = c.vuoti || [];
  if (V.indexOf(c.R1) < 0 || V.indexOf(c.R3) < 0) return null;
  return { dir: 'LONG', via: 'R1 e R3 entrambi vuoti',
    perche: 'R1 ' + c.R1 + ' e R3 ' + c.R3 + ' sono entrambi vuoti: misurato, lo host vince' };
}

// ============================================================================
//  VIA 26 · 戌 O 辰 SOPRA IL RAMO DEL GIORNO  —  S37, 04/09/2026
// ============================================================================
// Concetto classico portato da Edu (S37): "lo spirito sopra il ramo del giorno e' 戌 o 辰 (le porte del cielo e della terra): cattivo" -> SHORT.
// In catena (dopo le vie 1-25, sulle mute): 49 carte 69,4% SHORT  z 2,71  vec 87,5 / rec 62,1  +909 pip. Casella intera 375 · 47,7% SHORT.
// Cablata su regola di Edu ("sopra il 55% si cabla sempre"). In CODA.
function via26_xuChenSopraIlRamo(c) {
  if (!c.R3) return null;
  if (c.R3 !== '戌' && c.R3 !== '辰') return null;
  return { dir: 'SHORT', via: '戌 o 辰 sopra il ramo del giorno',
    perche: 'R3 ' + c.R3 + ' sopra il ramo del giorno ' + c.ramoGiorno + ': ' + (c.R3==='戌'?'la porta del cielo':'la porta della terra') + ' sul guest, lo host perde' };
}

// ============================================================================
//  VIA 27 · L'ORA E' LA RICCHEZZA DELLO STELO, IN 旺相, CON GENERALE FAUSTO  —  S37, 04/09/2026
// ============================================================================
// Concetto classico portato da Edu (S37): "l'ora e' la W dello stelo del giorno, cavalca il qi vigoroso (旺相) ed e'
// accompagnata da generale fausto: ricchezza in arrivo". Misurato: verso OPPOSTO al testo -> SHORT.
// 旺 = l'ora ha l'elemento del ramo del mese · 相 = il mese la genera. Generali fausti: 貴人 青龍 六合 太常 天后 太陰.
// Il generale sopra l'ora e' quello del generale del mese (che sta sempre sopra l'ora nel piatto).
// In catena (dopo le vie 1-26, sulle mute): 16 carte 75,0% SHORT  vec 80,0 / rec 70,0  +253 pip. Casella intera 103 · 58,3% SHORT.
// Cablata su regola di Edu ("sopra il 55% si cabla sempre, come misurato"). In CODA.
const GENERALI_FAUSTI = ['貴人','青龍','六合','太常','天后','太陰'];
function via27_oraRicchezzaVigorosaFausta(c) {
  if (!c.oraRamo || !c.steloGiorno || !c.ramoMese || !c.generaleOra) return null;
  if (parentela(c.steloGiorno, c.oraRamo) !== 'W') return null;
  const eM = EL_RAMO[c.ramoMese], eO = EL_RAMO[c.oraRamo];
  const vigorosa = (eM === eO) || (GENERA[eM] === eO);
  if (!vigorosa) return null;
  if (GENERALI_FAUSTI.indexOf(c.generaleOra) < 0) return null;
  return { dir: 'SHORT', via: 'ora W vigorosa con generale fausto',
    perche: 'l\'ora ' + c.oraRamo + ' e\' la W (Ricchezza) dello stelo ' + c.steloGiorno + ', e\' 旺相 nel mese ' + c.ramoMese + ' e porta il ' + c.generaleOra + ': misurato, lo host perde' };
}

// ============================================================================
//  VIA 28 · L'ORA E' IL 驛馬 DEL GIORNO  —  S37, 04/09/2026
// ============================================================================
// Concetto classico portato da Edu (S37): "l'ora e' il Cavallo del giorno, non vuota e senza 天空: buono" -> LONG.
// In catena (dopo le vie 1-27, sulle mute): 24 carte 62,5% LONG  vec 70,0 / rec 61,5  +23 pip (vince spesso ma di poco).
// Il vuoto e il 天空 non cambiano il verso (8 carte 62,5%): la via parla su tutte. Casella intera 207 · 51,7%.
// Cablata su regola di Edu ("sopra il 55% si cabla sempre"). In CODA.
function via28_oraCavalloDelGiorno(c) {
  if (!c.oraRamo || !c.ramoGiorno) return null;
  if (YIMA[c.ramoGiorno] !== c.oraRamo) return null;
  return { dir: 'LONG', via: 'l\'ora e\' il 驛馬 del giorno',
    perche: 'l\'ora ' + c.oraRamo + ' e\' il 驛馬 (Cavallo di posta) del ramo del giorno ' + c.ramoGiorno + ': il movimento e\' dello host, che vince' };
}

// ============================================================================
//  VIA 29 · L'ORA COMBINA COL PALAZZO DELLO STELO (六合 o 三合)  —  S37, 04/09/2026
// ============================================================================
// Concetto classico portato da Edu (S37): "l'ora e lo stelo del giorno si combinano (sei combinazioni o triangolo): buono".
// Misurato sul palazzo dello stelo (寄宮): verso OPPOSTO al testo -> SHORT.
// In catena (dopo le vie 1-28, sulle mute): 40 carte 62,5% SHORT  vec 72,2 / rec 57,1  +354 pip. Casella intera 648 · 54,5% SHORT.
// La 五合 fra stelo dell'ora e stelo del giorno non da' verso (mute 22 · 50%). Cablata su regola di Edu. In CODA.
const SANHE = { '申':['子','辰'],'子':['申','辰'],'辰':['申','子'],'寅':['午','戌'],'午':['寅','戌'],'戌':['寅','午'],'巳':['酉','丑'],'酉':['巳','丑'],'丑':['巳','酉'],'亥':['卯','未'],'卯':['亥','未'],'未':['亥','卯'] };
function via29_oraCombinaColPalazzo(c) {
  if (!c.oraRamo || !c.palazzoHost) return null;
  const lh = LIUHE[c.oraRamo] === c.palazzoHost, sh = (SANHE[c.oraRamo] || []).indexOf(c.palazzoHost) >= 0;
  if (!lh && !sh) return null;
  return { dir: 'SHORT', via: 'l\'ora combina col palazzo dello stelo',
    perche: 'l\'ora ' + c.oraRamo + ' e\' in ' + (lh ? '六合' : '三合') + ' col palazzo dello stelo ' + c.palazzoHost + ': misurato, lo host perde' };
}

// ============================================================================
//  VIA 30 · L'ORA COMBINA COL RAMO DEL GIORNO (六合 o 三合)  —  S37, 04/09/2026
// ============================================================================
// Concetto classico portato da Edu (S37): "l'ora e il ramo del giorno si combinano: buono, con C meglio" -> LONG.
// In catena (dopo le vie 1-29, sulle mute): 34 carte 58,8% LONG  vec 63,6 / rec 52,4  +508 pip. Casella intera 621 · 48,5%.
// Il C non migliora (8 carte 50%). La 六合 da sola 14 · 71,4%, la 三合 20 · 50%: la via parla su entrambe come da testo.
// Cablata su regola di Edu ("sopra il 55% si cabla sempre"). In CODA.
function via30_oraCombinaColRamo(c) {
  if (!c.oraRamo || !c.ramoGiorno) return null;
  const lh = LIUHE[c.oraRamo] === c.ramoGiorno, sh = (SANHE[c.oraRamo] || []).indexOf(c.ramoGiorno) >= 0;
  if (!lh && !sh) return null;
  return { dir: 'LONG', via: 'l\'ora combina col ramo del giorno',
    perche: 'l\'ora ' + c.oraRamo + ' e\' in ' + (lh ? '六合' : '三合') + ' col ramo del giorno ' + c.ramoGiorno + ': lo host vince' };
}

// ============================================================================
//  VIA 31 · L'ORA CLASHA IL PALAZZO DELLO STELO  —  S37, 04/09/2026
// ============================================================================
// Concetto classico portato da Edu (S37): "l'ora e lo stelo del giorno si clashano: cattivo" -> SHORT (sul palazzo 寄宮).
// In catena (dopo le vie 1-30, sulle mute): 10 carte 70,0% SHORT  vec 100 / rec 62,5  +174 pip. Casella intera 224 · 54,5% SHORT.
// Cablata su regola di Edu ("sopra il 55% si cabla sempre"); n piccolo, da tenere d'occhio. In CODA.
const CLASH12 = { '子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳' };
function via31_oraClashaIlPalazzo(c) {
  if (!c.oraRamo || !c.palazzoHost) return null;
  if (CLASH12[c.oraRamo] !== c.palazzoHost) return null;
  return { dir: 'SHORT', via: 'l\'ora clasha il palazzo dello stelo',
    perche: 'l\'ora ' + c.oraRamo + ' clasha il palazzo dello stelo ' + c.palazzoHost + ': lo host e\' colpito e perde' };
}

// ============================================================================
//  VIA 32 · L'ORA CLASHA IL RAMO DEL GIORNO  —  S37, 04/09/2026
// ============================================================================
// Concetto classico portato da Edu (S37): "l'ora e il ramo del giorno si clashano: cattivo" -> SHORT.
// In catena (dopo le vie 1-31, sulle mute): 8 carte 62,5% SHORT  vec 33,3 / rec 80,0  +434 pip. Casella intera 201 · 48,3% SHORT.
// Cablata su regola di Edu ("sopra il 55% si cabla sempre"); n molto piccolo. In CODA.
function via32_oraClashaIlRamo(c) {
  if (!c.oraRamo || !c.ramoGiorno) return null;
  if (CLASH12[c.oraRamo] !== c.ramoGiorno) return null;
  return { dir: 'SHORT', via: 'l\'ora clasha il ramo del giorno',
    perche: 'l\'ora ' + c.oraRamo + ' clasha il ramo del giorno ' + c.ramoGiorno + ': cattivo, lo host perde' };
}

// ============================================================================
//  VIA 33 · L'ORA E' PENALIZZATA (刑) DAL RAMO DEL GIORNO  —  S37, 04/09/2026
// ============================================================================
// Concetto classico portato da Edu (S37): "l'ora e' penalizzata dal ramo del giorno: cattivo" -> SHORT.
// 刑: 子->卯 卯->子 寅->巳 巳->申 申->寅 丑->戌 戌->未 未->丑 · 辰午酉亥 si penalizzano da soli.
// In catena (dopo le vie 1-32, sulle mute): 12 carte 66,7% SHORT  vec 71,4 / rec 60,0  +326 pip. Casella intera 211 · 46,4% SHORT.
// Cablata su regola di Edu ("sopra il 55% si cabla sempre"); n piccolo. In CODA.
const XING12 = { '子':'卯','卯':'子','寅':'巳','巳':'申','申':'寅','丑':'戌','戌':'未','未':'丑','辰':'辰','午':'午','酉':'酉','亥':'亥' };
function via33_oraPenalizzataDalRamo(c) {
  if (!c.oraRamo || !c.ramoGiorno) return null;
  if (XING12[c.ramoGiorno] !== c.oraRamo) return null;
  return { dir: 'SHORT', via: 'l\'ora e\' penalizzata dal ramo del giorno',
    perche: 'il ramo del giorno ' + c.ramoGiorno + ' penalizza (刑) l\'ora ' + c.oraRamo + ': cattivo, lo host perde' };
}

// ============================================================================
//  VIA 34 · IL PRIMO MESSAGGIO E' 沐浴 O 死 DELLO STELO  —  S37, 04/09/2026
// ============================================================================
// Concetto classico portato da Edu (S37): "il primo messaggio (初傳) e' nella tappa 沐浴 (Bagno) o 死 (Morte) dello stelo: cattivo".
// Misurato: verso OPPOSTO al testo -> LONG. In catena (dopo le vie 1-33, sulle mute): 11 carte 63,6% LONG  vec 25,0 / rec 85,7  +179 pip.
// Casella intera 406 · 51,7% (死 da solo 175 · 56,0%). Cablata su regola di Edu; n molto piccolo. In CODA.
const MUYU_STELO = { '甲':'子','乙':'巳','丙':'卯','丁':'申','戊':'卯','己':'申','庚':'午','辛':'亥','壬':'酉','癸':'寅' };
const SI_STELO   = { '甲':'午','乙':'亥','丙':'酉','丁':'寅','戊':'酉','己':'寅','庚':'子','辛':'巳','壬':'卯','癸':'申' };
function via34_primoMessaggioBagnoOMorte(c) {
  const M1 = c.treMessaggi && c.treMessaggi.chu; if (!M1 || !c.steloGiorno) return null;
  const bagno = MUYU_STELO[c.steloGiorno] === M1, morte = SI_STELO[c.steloGiorno] === M1;
  if (!bagno && !morte) return null;
  return { dir: 'LONG', via: 'primo messaggio in 沐浴 o 死 dello stelo',
    perche: 'il primo messaggio ' + M1 + ' e\' la tappa ' + (bagno ? '沐浴 (Bagno)' : '死 (Morte)') + ' dello stelo ' + c.steloGiorno + ': misurato, lo host vince' };
}

// ============================================================================
//  VIA 35 · IL PRIMO MESSAGGIO E' LA 墓 DELLO STELO  —  S37, 04/09/2026
// ============================================================================
// Concetto classico portato da Edu (S37): "il primo messaggio e' la tomba dello stelo: cattivo". Misurato: verso OPPOSTO -> LONG.
// In catena (dopo le vie 1-34, sulle mute): 8 carte 75,0% LONG (tutte nel recente) +220 pip. Casella intera 164 · 47,0%.
// Cablata su regola di Edu; n molto piccolo. In CODA.
function via35_primoMessaggioTombaDelloStelo(c) {
  const M1 = c.treMessaggi && c.treMessaggi.chu; if (!M1 || !c.steloGiorno) return null;
  if (TOMBA_STELO[c.steloGiorno] !== M1) return null;
  return { dir: 'LONG', via: 'primo messaggio sulla 墓 dello stelo',
    perche: 'il primo messaggio ' + M1 + ' e\' la 墓 (tomba) dello stelo ' + c.steloGiorno + ': misurato, lo host vince' };
}

// ============================================================================
//  VIA 36 · IL PRIMO MESSAGGIO E' LA 長生 DELLO STELO  —  S37, 04/09/2026
// ============================================================================
// Concetto classico portato da Edu (S37): "il primo messaggio e' la tappa 長生 (Nascita) dello stelo: buono" -> LONG.
// In catena (dopo le vie 1-35, sulle mute): 5 carte 60,0% LONG  +25 pip. Casella intera 237 · 46,0% LONG.
// Cablata su regola di Edu ("anche poche carte, purche' sopra il 55%"). In CODA.
const CHANGSHENG_STELO = { '甲':'亥','乙':'午','丙':'寅','丁':'酉','戊':'寅','己':'酉','庚':'巳','辛':'子','壬':'申','癸':'卯' };
function via36_primoMessaggioNascitaDelloStelo(c) {
  const M1 = c.treMessaggi && c.treMessaggi.chu; if (!M1 || !c.steloGiorno) return null;
  if (CHANGSHENG_STELO[c.steloGiorno] !== M1) return null;
  return { dir: 'LONG', via: 'primo messaggio in 長生 dello stelo',
    perche: 'il primo messaggio ' + M1 + ' e\' la 長生 (Nascita) dello stelo ' + c.steloGiorno + ': lo host nasce e vince' };
}

// ============================================================================
//  VIA T · I DUE TRIGONI DEL PIATTO, LETTI PER CARATTERE DEL GUEST  —  S37, 04/09/2026 (in TESTA)
// ============================================================================
// Edu (S37, da EURJPY 06/08/2024 s159): lato dello stelo (palazzo, R1, R2) e lato del ramo (ramo, R3, R4) formano
// due trigoni 三合 completi (nessun membro vuoto: il vuoto rompe il trigono). Il piatto ruota di 4: quando c'e' un
// trigono da un lato c'e' anche dall'altro. Si legge il CARATTERE del trigono del guest per lo stelo del giorno:
//   guest G  -> SHORT   56 carte 60,7%  vec 65,5 / rec 57,7  +414 pip
//   guest W  -> SHORT   47 carte 55,3%  vec 54,2 / rec 59,1  +682 pip   (= lo host C nutre il guest)
//   guest P  -> LONG    18 carte 66,7%  vec 100 / rec 53,8   +399 pip
//   guest C  -> tace    21 carte 52,4%
// Casella intera (le carte sono tutte gia' lette da altre vie: sulle mute non ne resta nessuna). Cablata su regola di Edu
// ("sopra il 55% si cabla"), in TESTA perche' legge il piatto intero, dopo il gruppo completo del fantasma.
const TRIGONI = [['申','子','辰','Acqua'],['寅','午','戌','Fuoco'],['巳','酉','丑','Metallo'],['亥','卯','未','Legno']];
function trigonoLato(a, b, c, V) {
  if (!a || !b || !c) return null; if ([a,b,c].some(x => V.indexOf(x) >= 0)) return null;
  for (const t of TRIGONI) if ([a,b,c].every(x => t.indexOf(x) >= 0) && a!==b && b!==c && a!==c) return t[3];
  return null;
}
function carattereEl(stelo, el) {
  const S = EL_STELO[stelo]; if (!S || !el) return null;
  return el===S ? 'B' : GENERA[S]===el ? 'C' : GENERA[el]===S ? 'P' : CONTROLLA[S]===el ? 'W' : 'G';
}
function viaT_dueTrigoniPerCarattere(c) {
  const V = c.vuoti || [];
  const tH = trigonoLato(c.palazzoHost, c.R1, c.R2, V), tG = trigonoLato(c.ramoGiorno, c.R3, c.R4, V);
  if (!tH || !tG) return null;
  const car = carattereEl(c.steloGiorno, tG);
  if (car === 'G') return { dir: 'SHORT', via: 'due trigoni · guest G',
    perche: 'il lato dello stelo forma il trigono di ' + tH + ' e il lato del ramo quello di ' + tG + ', che e\' G (鬼 Fantasma) per lo stelo ' + c.steloGiorno + ': il guest vince' };
  if (car === 'W') {
    // Cascata di Edu (S37, 04/09/2026): (1) lo host genera il guest -> SHORT; (2) ma se la W sta SOPRA (R3/R4) -> LONG;
    // (3) ma se l'elemento della W e' in TOMBA nel mese -> SHORT. Misura: (1) 10 carte 70% SHORT · (2) 34 carte 50% · (3) 3 carte 2/3 SHORT.
    // (0) Edu (S38, 05/09/2026, da USDCHF 20/05/2021 s90): se il PRIMO MESSAGGIO e' la W dello stelo ed e' SEDUTO SOPRA
    //     LA PROPRIA TOMBA (il secondo messaggio), la W e' INVALIDATA: cade il "cede per incassare" e resta la relazione
    //     nuda fra i due lati, cioe' il trigono dello stelo genera quello del ramo -> lo host si scarica -> SHORT.
    //     Si legge PRIMA della posizione della W. Perimetro vero (dentro i due trigoni): 2 carte, 2/2, +115 pip.
    //     Fuori dai due trigoni la stessa condizione sta al 49,14% su 116 carte: non e' una via a se', e' una invalidazione.
    const TOMBA_EL3 = { 'Legno':'未', 'Fuoco':'戌', 'Terra':'戌', 'Metallo':'丑', 'Acqua':'辰' };
    const T3 = c.treMessaggi, m1 = T3 && T3.chu, m2 = T3 && T3.zhong;
    const testa0 = 'il lato dello stelo forma il trigono di ' + tH + ' e nutre il trigono di ' + tG + ' del ramo (W per ' + c.steloGiorno + ')';
    if (m1 && m2 && parentela(c.steloGiorno, m1) === 'W' && TOMBA_EL3[EL_RAMO[m1]] === m2)
      return { dir: 'SHORT', via: 'due trigoni · W del primo messaggio seduta sulla propria tomba',
        perche: testa0 + ', ma il primo messaggio ' + m1 + ' e\' la W dello stelo ed e\' seduto sulla propria tomba ' + m2 +
                ': la ricchezza e\' invalidata e resta la relazione nuda, lo host genera il guest e si scarica' };
    const wSopra = parentela(c.steloGiorno, c.R3) === 'W' || parentela(c.steloGiorno, c.R4) === 'W';
    const testa = testa0;
    // (0-ter) Edu (S38, 05/09/2026, dubbio sollevato su EURGBP 07/08/2025 s87): la tomba all'inizio dei tre messaggi,
    //     con le fasi che corrono in AVANTI, non qualifica il trigono del ramo come trigono di RICCHEZZA.
    //     Condizione: i tre messaggi SONO il trigono del guest e le loro fasi sono 墓 -> 長生 -> 帝旺.
    //     In quel caso il punto 2 TACE (non si legge ne' LONG ne' SHORT) e la carta scende alle vie a valle.
    //     Misura del ramo W spaccato per ordine delle fasi (messaggi dentro il guest, W sopra):
    //       帝旺>長生>墓  16 carte  63% LONG  +185 pip   <- e' questo che regge il punto 2
    //       墓>長生>帝旺   5 carte  40% LONG    +3 pip   <- piatto: non qualifica in nessuna direzione
    //       帝旺>墓>長生   2 carte   0% LONG  -115 pip   <- gia' presa dall'invalidazione (0)
    //       墓>帝旺>長生   2 carte   0% LONG   -78 pip
    //     Motore con il punto 2 muto su questo pattern: 60,83% -> 60,87%, z 10,81 -> 10,85, +33.022 -> +33.134 pip.
    //     Il punto 2 passa da 28 carte 60,71% a 23 carte 65,22%: quelle 5 carte non erano sue.
    const FASE_TRI = { '申子辰':'Acqua', '寅午戌':'Fuoco', '巳酉丑':'Metallo', '亥卯未':'Legno' };
    const FASE = { 'Acqua':{'申':1,'子':2,'辰':3}, 'Fuoco':{'寅':1,'午':2,'戌':3},
                   'Metallo':{'巳':1,'酉':2,'丑':3}, 'Legno':{'亥':1,'卯':2,'未':3} };
    const Tm = c.treMessaggi, msg = [Tm.chu, Tm.zhong, Tm.mo];
    let kMsg = null, kGuest = null;
    for (const t of Object.keys(FASE_TRI)) {
      if (msg.every(x => t.indexOf(x) >= 0) && new Set(msg).size === 3) kMsg = t;
      if ([c.ramoGiorno, c.R3, c.R4].every(x => t.indexOf(x) >= 0)) kGuest = t;
    }
    if (kMsg && kMsg === kGuest) {
      const f = msg.map(x => FASE[FASE_TRI[kMsg]][x]);
      if (f[0] === 3 && f[1] === 1 && f[2] === 2) return null;   // 墓 -> 長生 -> 帝旺: non qualifica, tace
    }
    // (0-bis) Edu (S38, 05/09/2026, da EURUSD 04/05/2023 s110): il ramo del giorno e' la SEDE del trigono del guest.
    //     Se il mese lo CLASHA (冲) e l'ora lo PENALIZZA (刑) insieme, la sede della ricchezza e' rotta: la W non si
    //     incassa. Ma la generazione in uscita (il trigono dello stelo alimenta quello del ramo) regge -> SHORT.
    //     Serve la congiunzione: dentro il punto 2 la sola penalita' dell'ora sta al 25% su 4 carte (letta SHORT sbaglia),
    //     il solo clash del mese non compare mai. Misura della congiunzione dentro il punto 2: 2 carte 2/2 +85 pip, che
    //     pero' sono lo STESSO piatto (壬戌, ora 丑) visto su EURUSD e USDJPY dello stesso giorno: un piatto solo.
    //     Fuori dai due trigoni la stessa condizione sta al 48% su 25 carte: neutra, come dev'essere una invalidazione.
    if (CLASH12[c.ramoMese] === c.ramoGiorno && XING12[c.oraRamo] === c.ramoGiorno)
      return { dir: 'SHORT', via: 'due trigoni · sede del guest rotta da mese e ora',
        perche: testa0 + ', ma il ramo del giorno ' + c.ramoGiorno + ', che e\' la sede del trigono del guest, e\' clashato dal mese ' +
                c.ramoMese + ' e penalizzato dall\'ora ' + c.oraRamo + ': la sede della ricchezza e\' rotta e la W non si incassa, ' +
                'resta la generazione in uscita e lo host si scarica' };
    if (!wSopra) return { dir: 'SHORT', via: 'due trigoni · lo host nutre il guest, W solo sotto',
      perche: testa + ', ma la W sta solo sul ramo del giorno, non sopra: lo host cede e basta' };
    const TOMBA_EL2 = { 'Legno':'未','Fuoco':'戌','Terra':'戌','Metallo':'丑','Acqua':'辰' };
    if (c.ramoMese && TOMBA_EL2[tG] === c.ramoMese) return { dir: 'SHORT', via: 'due trigoni · W sopra ma in tomba',
      perche: testa + ', la W sta sopra ma il ' + tG + ' e\' in tomba nel mese ' + c.ramoMese + ': che ricchezza puo\' portare, lo host cede' };
    const P2 = process.env.P2 || 'long';   // 'long' (attuale) · 'short' · 'tace'
    if (P2 === 'tace') return null;
    if (P2 === 'short') return { dir: 'SHORT', via: 'due trigoni · W sopra',
      perche: testa + ', la W sta sopra' };
    return { dir: 'LONG', via: 'due trigoni · W sopra',
      perche: testa + ', e la W sta sopra: lo host cede per incassare, vince' };
  }
  if (car === 'P') return { dir: 'LONG', via: 'due trigoni · guest P',
    perche: 'il lato dello stelo forma il trigono di ' + tH + ' e il lato del ramo quello di ' + tG + ', che e\' P (父母 Genitore) per lo stelo ' + c.steloGiorno + ': lo host e\' nutrito e vince' };
  return null;
}

// ============================================================================
//  VIA U · LA CATENA A RITROSO CHE SCORRE NELLA TOMBA  —  S37, 04/09/2026 (in TESTA)
// ============================================================================
// Edu (S37, USDCAD 13/06/2023 s133, 戌午寅): "i tre messaggi fanno vedere che la tomba e' generata in sequenza: M1 tomba,
// M2 genera M1 e M3 genera M2". Tutto il Qi scorre nella tomba: la ricchezza si seppellisce, lo host perde -> SHORT.
// Condizione: M3 genera M2, M2 genera M1, M1 e' la tomba dell'elemento di M2 (木未 火戌 金丑 水辰).
// Misura (casella intera, soglia 20): 42 carte 59,5% SHORT  vec 68,2 / rec 62,5  +725 pip. Cablata su regola di Edu, in TESTA.
function viaU_catenaNellaTomba(c) {
  const T = c.treMessaggi; if (!T || !T.chu || !T.zhong || !T.mo) return null;
  const e1 = EL_RAMO[T.chu], e2 = EL_RAMO[T.zhong], e3 = EL_RAMO[T.mo];
  if (GENERA[e2] !== e1 || GENERA[e3] !== e2) return null;
  if (TOMBA_EL[e2] !== T.chu) return null;
  return { dir: 'SHORT', via: 'la catena scorre nella tomba',
    perche: 'i tre messaggi ' + T.chu + '←' + T.zhong + '←' + T.mo + ' si generano a ritroso e ' + T.chu + ' e\' la tomba del ' + e2 + ' di ' + T.zhong + ': tutto scorre nella tomba, lo host perde' };
}

// La via del gruppo completo sta in TESTA: legge il movimento intero, non una singola casella,
// e quando parla comanda su tutte le letture di casella.
// La via 6 sta in FONDO: condizione ultima, parla solo quando tutto il resto ha taciuto.
// La via 7 legge ancora una casella (R1/R2): sta dopo la 5 e prima della condizione ultima.
const CATENA = [ via0_gruppoCompletoFantasma, viaU_catenaNellaTomba, viaT_dueTrigoniPerCarattere ].concat(VIE, [ via5_R2prendeIlPostoDiR1, via7_fratelloLegato, via6_ricchezzaSulPrimoMessaggio, via8_figlioVuotoRicchezzaInFondo, via9_pDalLatoDelloStelo, via10_oDalLatoDelloSteloNonNutrito, via11_gVuotoSulPrimoMessaggio, via12_oSoproLoSteloHostSulVuoto, via13_oConGancio, via14_bConDragoAzzurro, via15_r1GeneraIlRamoDelGiorno, via16_luIncrociato, via17_cavalloDiPostaSuR1, via18_luDelGiornoSuR1, via19_apiceDelloSteloSuR3, via20_steloCavalcaLaTomba, via21_ramoSiedeSullaTomba, via22_steloSiedeSullaTomba, via23_steloCavalcaLaJue, via24_ramoCavalcaLaJue, via25_entrambiVuoti, via26_xuChenSopraIlRamo, via27_oraRicchezzaVigorosaFausta, via28_oraCavalloDelGiorno, via29_oraCombinaColPalazzo, via30_oraCombinaColRamo, via31_oraClashaIlPalazzo, via32_oraClashaIlRamo, via33_oraPenalizzataDalRamo, via34_primoMessaggioBagnoOMorte, via35_primoMessaggioTombaDelloStelo, via36_primoMessaggioNascitaDelloStelo ]);

// ============================================================================
//  LETTURA
// ============================================================================
// carta = { steloGiorno, ramoGiorno, palazzoHost, R1, R3, metodo,
//           vuoti:[], generaleMese, oraRamo, lezioni:[...], treMessaggi:{...} }
// ritorna { dir:'LONG'|'SHORT'|null, via, perche }  ·  dir null = il motore TACE
function leggi(carta) {
  const fuori = fuoriSelezione(carta);
  if (fuori) return { dir: null, via: null, perche: 'carta fuori selezione: ' + fuori };
  for (const via of CATENA) {
    const v = via(carta);
    if (v && v.dir) return v;
  }
  return { dir: null, via: null, perche: 'nessun attore riconosciuto: il motore tace' };
}

const _API = { leggi, fuoriSelezione, parentela, gruppoNeiTreMessaggi, via0_gruppoCompletoFantasma, via6_ricchezzaSulPrimoMessaggio, STELI_DENTRO, COMBINA_STELI,
                   EL_STELO, EL_RAMO, GENERA, CONTROLLA, VIE, CATENA };

if (typeof module !== 'undefined' && module.exports) module.exports = _API;
if (typeof window !== 'undefined') window.XKDGMotoreDLR = _API;
