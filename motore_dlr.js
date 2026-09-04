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

// La via del gruppo completo sta in TESTA: legge il movimento intero, non una singola casella,
// e quando parla comanda su tutte le letture di casella.
// La via 6 sta in FONDO: condizione ultima, parla solo quando tutto il resto ha taciuto.
// La via 7 legge ancora una casella (R1/R2): sta dopo la 5 e prima della condizione ultima.
const CATENA = [ via0_gruppoCompletoFantasma ].concat(VIE, [ via5_R2prendeIlPostoDiR1, via7_fratelloLegato, via6_ricchezzaSulPrimoMessaggio, via8_figlioVuotoRicchezzaInFondo, via9_pDalLatoDelloStelo, via10_oDalLatoDelloSteloNonNutrito, via11_gVuotoSulPrimoMessaggio, via12_oSoproLoSteloHostSulVuoto, via13_oConGancio, via14_bConDragoAzzurro ]);

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
