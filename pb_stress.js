/* pb_v3.js — Plum Blossom, scenario Yong ORIGINALE + regola del clash del palazzo.
 *
 * Scenario di base (fissato con Edu il 07/08/2026, misurato +6.223 pip, z 1,49):
 *   Trend = corpo (Yi), il trigramma SENZA la linea mutante — rappresenta l'EMA
 *   Yong  = il trigramma CON la linea mutante, letto nella forma ORIGINALE (non si muove)
 *   生我 prosegue · 我剋 prosegue · 我生 inverte · 剋我 inverte · 比和 NO TRADE
 *
 * REGOLA NUOVA — il clash del palazzo (dichiarata da Edu il 08/08/2026, da EURJPY 15/03/2023):
 *   Il Trend occupa un palazzo nel Houtian, a cui corrispondono uno o due rami:
 *     乾 戌亥 · 兌 酉 · 離 午 · 震 卯 · 巽 辰巳 · 坎 子 · 艮 丑寅 · 坤 未申
 *   Fra i rami del Bazi (anno, mese, giorno) si contano:
 *     - ATTACCANTI: i rami che clashano il palazzo del Trend
 *     - DIFENSORI:  i rami dello stesso elemento del Trend
 *   Ognuno pesa secondo il suo stato stagionale rispetto all'elemento del mese
 *   (cinque stadi 旺相休囚死). Il ramo dell'anno (Tai Sui) moltiplica il proprio peso.
 *   Se la somma degli attaccanti supera quella dei difensori, il Trend è spazzato via
 *   e il verdetto si INVERTE rispetto alla lettura di base.
 *   Se non ci sono attaccanti la regola non interviene.
 *
 * TARATURE NON DOTTRINALI, dichiarate:
 *   - scala dei cinque stadi in punti positivi: 旺 4 · 相 3 · 休 2 · 囚 1 · 死 0
 *   - moltiplicatore del Tai Sui: TAISUI (default 2)
 *   - "stesso elemento del palazzo" letto come elemento del TRIGRAMMA, non del ramo
 *     del palazzo (divergono solo per 乾 e 巽)
 *
 * Variabili: TAISUI=n · SCALA=piatta|stadi · CARTA="CROSS AAAA-MM-GG" · LISTA=1
 */
'use strict';
global.window = global;
const lj = require('lunar-javascript');
global.Solar = lj.Solar; global.Lunar = lj.Lunar;
require('./work_trading/pwa/solar-time.js');
require('./work_trading/pwa/jieqi-gmt.js');
const DLR = require('./work_trading/pwa/daliuren.js');
const T = require('./work_trading/pwa/trend.js');
const ST = require('./work_trading/pwa/solar-time.js');
// istante in cui a Greenwich entra il nuovo giorno in tempo solare vero:
// le 00:00 GMT corrette per l'equazione del tempo (oscilla di circa +/- 15 minuti)
function mezzanotteTST(y, mo, d){
  const approx = Date.UTC(y, mo-1, d, 0, 0, 0);
  let ms = approx;
  for (let i=0;i<3;i++) ms = approx - ST.equationOfTimeMinutes(new Date(ms))*60000;
  return ms;
}
const fs = require('fs');

const B = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const TRIGRAM = {
  1:{name:'乾 Qian', el:'Metal'}, 2:{name:'兌 Dui', el:'Metal'},
  3:{name:'離 Li',   el:'Fire'},  4:{name:'震 Zhen', el:'Wood'},
  5:{name:'巽 Xun',  el:'Wood'},  6:{name:'坎 Kan',  el:'Water'},
  7:{name:'艮 Gen',  el:'Earth'}, 8:{name:'坤 Kun',  el:'Earth'}
};
const HOUTIAN = { 1:['戌','亥'], 2:['酉'], 3:['午'], 4:['卯'], 5:['辰','巳'],
                  6:['子'], 7:['丑','寅'], 8:['未','申'] };
const COMBINA = { '子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯',
                  '辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午' };
const CLASH = { '子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅',
                '卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳' };
const GEN  = { Wood:'Fire', Fire:'Earth', Earth:'Metal', Metal:'Water', Water:'Wood' };
const CTRL = { Wood:'Earth', Earth:'Water', Water:'Fire', Fire:'Metal', Metal:'Wood' };
// NA YIN dell'esagramma iniziale (XKDG, Edu 10/08/2026): (sup,inf in Fuxi) -> elemento.
// Derivata dal software XKDG: esagramma di Re Wen -> jiazi -> Na Yin. Verificata su
// Wei Ji=甲申 Acqua, Ji Ji=甲寅 Acqua, Meng=庚申 Legno e gli otto esagrammi puri.
const NAYIN_ESAGRAMMA = {
  '1-1':'Metal', '1-2':'Wood', '1-3':'Metal', '1-4':'Fire', '1-5':'Metal', '1-6':'Earth', '1-7':'Water', '1-8':'Metal',
  '2-1':'Water', '2-2':'Earth', '2-3':'Wood', '2-4':'Water', '2-5':'Water', '2-6':'Wood', '2-7':'Fire', '2-8':'Water',
  '3-1':'Metal', '3-2':'Fire', '3-3':'Wood', '3-4':'Metal', '3-5':'Fire', '3-6':'Water', '3-7':'Earth', '3-8':'Fire',
  '4-1':'Wood', '4-2':'Metal', '4-3':'Earth', '4-4':'Wood', '4-5':'Earth', '4-6':'Fire', '4-7':'Wood', '4-8':'Earth',
  '5-1':'Earth', '5-2':'Wood', '5-3':'Fire', '5-4':'Earth', '5-5':'Wood', '5-6':'Earth', '5-7':'Metal', '5-8':'Wood',
  '6-1':'Fire', '6-2':'Earth', '6-3':'Water', '6-4':'Fire', '6-5':'Metal', '6-6':'Wood', '6-7':'Fire', '6-8':'Metal',
  '7-1':'Water', '7-2':'Fire', '7-3':'Wood', '7-4':'Water', '7-5':'Water', '7-6':'Wood', '7-7':'Earth', '7-8':'Water',
  '8-1':'Metal', '8-2':'Water', '8-3':'Earth', '8-4':'Metal', '8-5':'Fire', '8-6':'Metal', '8-7':'Wood', '8-8':'Metal'
};
const WX = { '子':'Water','丑':'Earth','寅':'Wood','卯':'Wood','辰':'Earth','巳':'Fire',
             '午':'Fire','未':'Earth','申':'Metal','酉':'Metal','戌':'Earth','亥':'Water' };

const S10 = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const AUTOPEN = ['辰','午','酉','亥'];   // i rami che si autopenalizzano raddoppiando
// i due rami vuoti (旬空) della decade a cui appartiene il pilastro dato
function vuotiDi(stem, branch){
  const si = S10.indexOf(stem), bi = B.indexOf(branch);
  if (si < 0 || bi < 0) return [];
  const start = ((bi - si) % 12 + 12) % 12;
  return [ B[(start + 10) % 12], B[(start + 11) % 12] ];
}
const TAISUI = process.env.TAISUI ? Number(process.env.TAISUI) : 2;
const PUNTI = { '旺':4, '相':3, '休':2, '囚':1, '死':0 };

function stagione(el, seasonEl){
  if (el === seasonEl) return '旺';
  if (GEN[seasonEl] === el) return '相';
  if (GEN[el] === seasonEl) return '休';
  if (CTRL[seasonEl] === el) return '死';
  if (CTRL[el] === seasonEl) return '囚';
  return '休';
}
function peso(branch, monthEl, isTaiSui){
  const p = process.env.SCALA === 'stadi' ? PUNTI[stagione(WX[branch], monthEl)] : 1;
  return isTaiSui ? p * TAISUI : p;
}

const mod8 = n => { const r = n % 8; return r === 0 ? 8 : r; };
const mod6 = n => { const r = n % 6; return r === 0 ? 6 : r; };
const f3 = p => { const d = String(p).replace(/[^0-9]/g,'').replace(/^0+/,'');
  return d.slice(0, Math.abs(Number(p)) < 1 ? 2 : 3); };
function seedEdge(price){ const p = Math.abs(Number(price)); if(!(p>0)) return null;
  const n = p<1?2:3; const step = Math.pow(10, Math.floor(Math.log10(p))-n+1);
  const fr = p/step - Math.floor(p/step); return Math.min(fr, 1-fr)*100; }
const pipFactor = c => /JPY$/.test(c) ? 100 : 10000;

function yearBranchAt(y,m,d){
  return lj.Solar.fromYmdHms(y,m,d,0,0,0).getLunar().getEightChar().getYear().charAt(1);
}
function yearStemAt(y,m,d){
  return lj.Solar.fromYmdHms(y,m,d,0,0,0).getLunar().getEightChar().getYear().charAt(0);
}
// stelo del mese con la regola dei Cinque Tigri (五虎遁), dal ramo del mese del motore
const STEMS10 = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const WUHU = { '甲':'丙','己':'丙','乙':'戊','庚':'戊','丙':'庚','辛':'庚','丁':'壬','壬':'壬','戊':'甲','癸':'甲' };
const MESI_DA_YIN = ['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'];
function monthStemFrom(yearStem, monthBranch){
  const start = STEMS10.indexOf(WUHU[yearStem]);
  const idx = MESI_DA_YIN.indexOf(monthBranch);
  return STEMS10[(start + idx) % 10];
}
// clash degli steli (i quattro: 甲庚 乙辛 丙壬 丁癸; 戊己 senza clash)
const STEMCLASH = { '甲':'庚','庚':'甲','乙':'辛','辛':'乙','丙':'壬','壬':'丙','丁':'癸','癸':'丁' };

/* lettura di base + regola del clash */
const seedToBranch = s => B[(((s-1)%12)+12)%12];
function leggi(seed, dayBranch, monthBranch, yearBranch, dayStem, emaRun){
  const oraBranch = seedToBranch(seed);
  const sup = mod8(Math.floor(seed/8)), inf = mod8(seed);
  const dayNum = B.indexOf(dayBranch) + 1;
  const linea = mod6(sup + inf + dayNum);
  const usoNum   = linea <= 3 ? inf : sup;
  const corpoNum = linea <= 3 ? sup : inf;
  const uso = TRIGRAM[usoNum], corpo = TRIGRAM[corpoNum];
  // trigramma futuro: la linea mutante del Yong si rovescia
  const posT = linea <= 3 ? linea : linea - 3;
  const usoTrasf = (((usoNum - 1) ^ (1 << (3 - posT))) + 1);
  const trasf = TRIGRAM[usoTrasf];
  // YONG=trasformato legge la relazione col trigramma futuro invece che con l'originale
  const YY = process.env.YONG === 'trasformato';
  const yongNum = YY ? usoTrasf : usoNum;
  const yong = YY ? trasf : uso;
  const A = corpo.el, Z = yong.el;         // Trend = corpo

  // SELETTORE DEL RAMO ATTIVO NEL PALAZZO DEL YONG (tre ipotesi, Edu 08/08/2026)
  //   SEL=ora        polarita' dell'ora ricavata dal seme  (come per il Trend)
  //   SEL=posizione  polarita' della POSIZIONE della linea mobile: 1,3,5 yang · 2,4,6 yin
  //   SEL=natura     yin/yang della linea mobile stessa: intera = yang, spezzata = yin
  //   SEL=trig       polarita' della posizione DENTRO IL TRIGRAMMA: base e cima yang, mezzo yin
  //   SEL=concorde   yang se natura e posizione nel trigramma concordano, yin se discordano
  const posInTrig = linea <= 3 ? linea : linea - 3;           // 1 = base del trigramma
  const lineaIntera = (((usoNum - 1) >> (3 - posInTrig)) & 1) === 0;  // Fuxi: 0 = intera
  const posTrigYang = posInTrig !== 2;
  const SEL = process.env.SEL || 'natura';
  const selYang = SEL === 'posizione' ? ((linea % 2) === 1)
                : SEL === 'natura'    ? lineaIntera
                : SEL === 'trig'      ? posTrigYang
                : SEL === 'concorde'  ? (lineaIntera === posTrigYang)
                : ((B.indexOf(oraBranch) % 2) === 0);
  const palNum = process.env.PALYONG === 'originale' ? usoNum : yongNum;
  let palazzoYong = HOUTIAN[palNum];
  if (palazzoYong.length === 2)
    palazzoYong = palazzoYong.filter(b => ((B.indexOf(b) % 2) === 0) === selYang);

  let via, base;
  if (A === Z)                  { via='比和'; base=null; }
  else if (GEN[Z] === A)        { via='生我'; base=true;  }
  else if (CTRL[A] === Z)       { via='我剋'; base=true;  }
  else if (GEN[A] === Z)        { via='我生'; base=false; }
  else if (CTRL[Z] === A)       { via='剋我'; base=false; }

  // PARITA' — scioglimento del pareggio 比和 (Edu, 08/08/2026):
  // quando i due trigrammi sono dello stesso elemento la relazione e' in pareggio.
  // Si legge allora il ramo del palazzo attivo del Yong contro il Trend.
  if (base === null) {
    if (process.env.NOPARITA) return { via, base:null };
    const pe = palazzoYong.length ? WX[palazzoYong[0]] : null;
    if (!pe) return { via, base:null };
    if (pe === A)                { via='比和·pari';  return { via, base:null }; }
    else if (GEN[pe] === A)      { via='比和·生我';  base=true;  }
    else if (CTRL[A] === pe)     { via='比和·我剋';  base=true;  }
    else if (GEN[A] === pe)      { via='比和·我生';  base=false; }
    else if (CTRL[pe] === A)     { via='比和·剋我';  base=false; }
    else return { via, base:null };
  }

  // regola del clash del palazzo
  // palazzi doppi: la linea mobile sceglie il ramo attivo (yang = linee 1,3,5)
  // l'ora ricavata dal seme sceglie il ramo attivo nei palazzi doppi.
  // VUOTO=1: se l'ora e' vuota (旬空) non svolge alcuna funzione e non sceglie:
  // il palazzo resta doppio e valgono entrambi i rami.
  const vuoti = dayStem ? vuotiDi(dayStem, dayBranch) : [];
  const monthEl = WX[monthBranch];
  const oraVuota = (vuoti.indexOf(oraBranch) >= 0) && !(process.env.VS_ORA && stagione(WX[oraBranch], monthEl) === '旺');
  // VUOTO=doppio   ora vuota -> non sceglie, restano attivi ENTRAMBI i rami
  //                (il Trend e' piu' facile da colpire)
  // VUOTO=nessuno  ora vuota -> non sceglie, non e' attivo NESSUN ramo
  //                (il Trend e' incolpibile)
  // VUOTO assente  l'ora sceglie sempre, anche se vuota
  let palazzo = HOUTIAN[corpoNum];
  const V = process.env.VUOTO || 'doppio';
  if (V && oraVuota && palazzo.length === 2) {
    if (V === 'nessuno') palazzo = [];
  } else if (V === 'nessuno' && oraVuota) {
    palazzo = [];                       // palazzo singolo, ora vuota: nessun ramo attivo
  } else if (palazzo.length === 2) {
    const oraYang = (B.indexOf(oraBranch) % 2) === 0;
    palazzo = palazzo.filter(b => ((B.indexOf(b) % 2) === 0) === oraYang);
  }
  let bazi = [ {b:yearBranch, ts:true}, {b:monthBranch, ts:false}, {b:dayBranch, ts:false} ];
  // l'ora ricavata dal seme sceglie il ramo attivo nei palazzi doppi,
  // ma NON entra nel Bazi: non attacca, non difende, non combina.

  // COMBINAZIONE: due rami che si combinano si legano a vicenda e non fanno niente.
  // Si appaiano uno a uno: con 卯 戌 戌 si lega una sola coppia, il secondo 戌 resta libero.
  const dettComb = [];
  if (!process.env.NOCOMB) {
    const usato = bazi.map(()=>false);
    for (let i=0;i<bazi.length;i++){
      if (usato[i]) continue;
      for (let j=i+1;j<bazi.length;j++){
        if (usato[j]) continue;
        if (COMBINA[bazi[i].b] === bazi[j].b){
          usato[i]=true; usato[j]=true;
          dettComb.push(bazi[i].b+'+'+bazi[j].b);
          break;
        }
      }
    }
    bazi = bazi.filter((x,i)=>!usato[i]);
  }

  // FORZE DENTRO LA DATA (Edu, 08/08/2026 — da USDJPY 06/09/2022):
  // fra i rami vivi del Bazi, due che si clashano si combattono. Vince il piu' forte
  // nel mese; il Tai Sui vince sempre il suo clash. Il perdente resta a meta' forza.
  // Ogni ramo porta ora una forza (1 pieno, 0,5 dimezzato) usata quando difende o
  // quando sostiene il Yong.  NOFORZE=1 disattiva: tutti restano a forza piena.
  const FORDINE = { '旺':4, '相':3, '休':2, '囚':1, '死':0 };
  bazi.forEach(x => x.forza = 1);
  const dettForze = [];
  // CLASH FRA TOMBE (Edu, 10/08/2026, da USDJPY 30/04/2026): il clash fra due rami di
  // Terra (辰戌 o 丑未) non e' un combattimento: produce piu' Terra e APRE le tombe,
  // liberando l'elemento custodito (辰 Acqua · 戌 Fuoco · 丑 Metallo · 未 Legno).
  //   TOMBE=forze   i due rami di Terra non si dimezzano (restano a forza piena)
  //   TOMBE=flusso  forze + gli elementi liberati entrano nel flusso del qi
  //   TOMBE=drena   forze + gli elementi liberati contano nel netStr del drenaggio
  //   TOMBE=tutto   tutte e tre
  const TOMBA = { '辰':'Water', '戌':'Fire', '丑':'Metal', '未':'Wood' };
  const TM = process.env.TOMBE;
  const liberati = [];
  if (TM) {
    for (let i=0;i<bazi.length;i++) for (let j=i+1;j<bazi.length;j++){
      if (CLASH[bazi[i].b] !== bazi[j].b) continue;
      if (WX[bazi[i].b] === 'Earth' && WX[bazi[j].b] === 'Earth') {
        liberati.push(TOMBA[bazi[i].b], TOMBA[bazi[j].b]);
        bazi[i].tomba = true; bazi[j].tomba = true;
        dettForze.push(bazi[i].b+' e '+bazi[j].b+' clash di tombe → più Terra, liberati '+TOMBA[bazi[i].b]+'/'+TOMBA[bazi[j].b]);
      }
    }
  }
  if (!process.env.NOFORZE) {
    for (let i=0;i<bazi.length;i++) for (let j=i+1;j<bazi.length;j++){
      if (CLASH[bazi[i].b] !== bazi[j].b) continue;
      if (TM && bazi[i].tomba && bazi[j].tomba) continue;   // clash di tombe: nessun dimezzamento
      let vinc = i, pers = j;
      if (bazi[j].ts) { vinc=j; pers=i; }
      else if (bazi[i].ts) { vinc=i; pers=j; }
      else {
        // vince chi ha piu' alleati nel Bazi (rami dello stesso elemento), non la stagione
        const alleati = b => bazi.filter(y => WX[y.b] === WX[b]).length;
        if (alleati(bazi[j].b) > alleati(bazi[i].b)) { vinc=j; pers=i; }
        else if (alleati(bazi[i].b) === alleati(bazi[j].b)) {
          // pari alleati: nessuno prevale, restano entrambi a meta'
          bazi[i].forza = Math.min(bazi[i].forza, 0.5);
          bazi[j].forza = Math.min(bazi[j].forza, 0.5);
          dettForze.push(bazi[i].b+' e '+bazi[j].b+' pari → entrambi a metà');
          continue;
        }
      }
      bazi[pers].forza = Math.min(bazi[pers].forza, 0.5);
      dettForze.push(bazi[vinc].b+' batte '+bazi[pers].b+' → '+bazi[pers].b+' a metà');
    }
  }

  // ECCITAZIONE: se l'elemento del Trend e' forte in stagione (旺 o 相) il clash
  // non lo spazza via, lo eccita. La regola non interviene affatto.
  const statoTrend = stagione(corpo.el, monthEl);
  const eccitato = !!process.env.ECC && (statoTrend === '旺' || statoTrend === '相');

  let att = 0, dif = 0;
  const dettAtt = [], dettDif = [];
  const dettPonte = [];
  // VUOTO CHE NON COLPISCE (Edu, 08/08/2026 — da USDJPY 13/12/2023):
  // un ramo del Bazi che sia fra i due vuoti (旬空) della decade del giorno non ha
  // sostanza e non puo' clashare il palazzo del Trend. Vale anche per il Tai Sui.
  // NOVUOTOATT=1 disattiva la regola, per confronto.
  const dettVuoti = [];
  bazi.forEach(x => {
    if (!process.env.NOVUOTOATT && vuoti.indexOf(x.b) >= 0 && !(process.env.VS_BAZI && stagione(WX[x.b], monthEl) === '旺')) {
      dettVuoti.push(x.b+' vuoto, non fa niente'); return;   // non attacca e non difende
    }
    const clasha = palazzo.some(p => CLASH[p] === x.b);
    if (clasha) {
      // il ponte: un altro ramo del Bazi che l'attaccante genera e che genera il Trend
      const ponte = bazi.find(y => y.b !== x.b &&
        GEN[WX[x.b]] === WX[y.b] && GEN[WX[y.b]] === corpo.el);
      let w = peso(x.b, monthEl, x.ts);
      if (ponte) {
        if (ponte.ts) w = w * TAISUI;      // ponte sul Tai Sui: porta di piu'
        dif += w;
        dettPonte.push(x.b+'→'+ponte.b+' '+w+(ponte.ts?' (ponte Tai Sui)':' (ponte)'));
      } else {
        att += w;
        dettAtt.push(x.b+' '+stagione(WX[x.b],monthEl)+' '+w+(x.ts?' (Tai Sui)':''));
      }
    }
    else if (WX[x.b] === corpo.el) { const w = peso(x.b, monthEl, x.ts) * (x.forza||1); dif += w;
      dettDif.push(x.b+' '+stagione(WX[x.b],monthEl)+' '+w+(x.forza<1?' (metà)':'')+(x.ts?' (Tai Sui)':'')); }
  });
  // BLOCCO PER COMBINAZIONE DEI PALAZZI (Edu, 08/08/2026 — da EURJPY 01/05/2024):
  // il Yong occupa anch'esso un palazzo Houtian; se i rami sono due, e' la LINEA MOBILE
  // a dire quale agisce (linee 1,3,5 = yang). Se il palazzo del Yong si combina con
  // quello del Trend, i due si legano e il Trend non puo' esercitare la relazione:
  // il verdetto e' INVERTE. Mai il contrario.
  // Il BLOCCO PER COMBINAZIONE fra il palazzo del Trend e quello del Yong e' stato
  // rimosso l'08/08/2026: misurato coi tre selettori dava -876, -418, -1.032 pip.
  const bloccato = false;

  // AUTOPENALITA' (Edu, 08/08/2026 — da EURJPY 01/05/2024): se un ramo del palazzo del
  // Trend e' fra 辰午酉亥 e compare due o piu' volte nel Bazi, si autopenalizza; il Trend
  // e' guasto e non vince: verdetto INVERTE. Mai il contrario.
  const baziTutti = [yearBranch, monthBranch, dayBranch];
  const autopen = !process.env.NOAUTOPEN && palazzo.some(pz =>
    AUTOPEN.indexOf(pz) >= 0 && baziTutti.filter(b => b === pz).length >= 2);

  // PONTE DEL PALAZZO DEL YONG (Edu, 08/08/2026 — da USDJPY 06/09/2022):
  // se il ramo del palazzo attivo del Yong e' dell'elemento che il Yong genera e che a
  // sua volta genera il Trend, il controllo del Yong non arriva: esce gia' trasformato,
  // passa dentro il proprio palazzo e diventa nutrimento. Il Trend regge e PROSEGUE.
  // E' l'unica regola che puo' portare un INVERTE a PROSEGUE.
  // SCARICO DEL YONG NEL PROPRIO PALAZZO (Edu, 08/08/2026 — da EURUSD 19/03/2020):
  // se il ramo attivo del palazzo del Yong e' dell'elemento che il Yong genera, il Yong
  // si scarica nel proprio palazzo e si indebolisce da solo: non riesce a esercitare la
  // relazione sul Trend, che regge e PROSEGUE.
  //   SCARICO=stretto  solo nelle carte in pareggio (比和)
  //   SCARICO=largo    su tutte le carte con verdetto di base INVERTE
  const yongScarico = palazzoYong.length === 1 &&
        GEN[yong.el] === WX[palazzoYong[0]];
  const SC = process.env.SCARICO;
  const scarico = !!SC && yongScarico && base === false &&
        (SC === 'largo' ? true : /比和/.test(via));

  // PONTE SULLA RELAZIONE (Edu, 08/08/2026 — da EURJPY 07/12/2023):
  // se fra i rami vivi del Bazi ce n'e' uno che il Yong genera e che a sua volta genera
  // il Trend, il controllo del Yong non arriva: passa dentro quel ramo e diventa
  // nutrimento. Il Trend regge e SEGUE il trend.
  //   PONTEREL=stretto  solo dove il Yong controlla il Trend (剋我)
  //   PONTEREL=largo    su tutte le carte con verdetto di base "non segue"
  const attivi = bazi.filter(x => vuoti.indexOf(x.b) < 0 || (process.env.VS_BAZI && stagione(WX[x.b], monthEl) === '旺'));
  // COMBINAZIONE COL PALAZZO DEL TREND (Edu, 08/08/2026 — da USDJPY 06/09/2022):
  // un ramo vivo del Bazi che si combini (六合) col ramo attivo del palazzo del Trend
  // lo protegge. Il Trend regge e SEGUE il trend.
  //   COMBPAL=verdetto  ribalta il verdetto a "segue"
  //   COMBPAL=difesa    conta solo come difensore in piu' nel conto del clash
  const ramiProt = attivi.filter(x => palazzo.some(pz => COMBINA[pz] === x.b));
  const CP = process.env.COMBPAL;
  const protetto = CP === 'verdetto' && base === false && ramiProt.length > 0;
  if (CP === 'difesa') ramiProt.forEach(x => { dif += peso(x.b, monthEl, x.ts); });
  const PR = process.env.NOPONTEREL ? null : (process.env.PONTEREL || 'taisui');
  const ramiPonte = attivi.filter(x => GEN[yong.el] === WX[x.b] && GEN[WX[x.b]] === corpo.el);
  const ponteRel = !!PR && base === false &&
        (PR === 'taisui' ? ramiPonte.some(x=>x.ts) : ramiPonte.length > 0);

  const ponteYong = !!process.env.PONTEY && via === '剋我' &&
    palazzoYong.some(py => GEN[yong.el] === WX[py] && GEN[WX[py]] === corpo.el);

  // SOSTEGNO DEL YONG INDEBOLITO (Edu, 08/08/2026 — da USDJPY 06/09/2022):
  // il Yong controlla il Trend (剋我). Se il ramo del Bazi che sostiene il Yong — un
  // ramo del suo stesso elemento — ha perso un clash dentro la data ed e' a meta' forza,
  // il controllo del Yong non ha appoggio e non passa. Il Trend regge e SEGUE il trend.
  //   SOSTEGNO=metà   basta un sostegno indebolito (a 0,5)
  //   SOSTEGNO=assente il Yong e' senza sostegno solo se il ramo e' proprio sparito
  const sostegni = bazi.filter(x => WX[x.b] === yong.el);
  const yongDebole = !process.env.NOSOSTEGNO && via === '剋我' && sostegni.length > 0 &&
        sostegni.every(x => x.forza <= 0.5);

  const spazzato = !eccitato && att > 0 && att > dif;
  // RAFFORZAMENTO: base=segue ma Yong rafforzato dalla mutazione (casi 1 生我, 5 比和) → non segue
  const rafforzato = !!process.env.RAFFORZA && base === true && (emaRun == null || emaRun < 20) &&
        (uso.el === trasf.el || GEN[trasf.el] === uso.el);
  // TREND VUOTO nel PAREGGIO: palazzo del Trend vuoto (旬空); ramo attivo scelto dalla posizione
  // della linea mutante (1,3,5 = yang · 2,4,6 = yin). Nel pareggio 比和 un corpo vuoto perde → non segue.
  const palTrend = HOUTIAN[corpoNum] || [];
  let ramoTrend;
  if (palTrend.length === 1) ramoTrend = palTrend[0];
  else { const lineaYang = (linea % 2 === 1); ramoTrend = palTrend.find(b => ((B.indexOf(b) % 2) === 0) === lineaYang); }
  const trendVuotoRaw = ramoTrend != null && vuoti.indexOf(ramoTrend) >= 0;
  // 旺不为空: un ramo prospero di stagione non è davvero vuoto
  const stagRamoTrend = ramoTrend != null ? stagione(WX[ramoTrend], monthEl) : null;
  const ramoProspero = stagRamoTrend === '旺' || (process.env.VUOTOSTAG === 'wangxiang' && stagRamoTrend === '相');
  const trendVuoto = trendVuotoRaw && !(process.env.VUOTOSTAG && ramoProspero);
  const vuotoPareggio = !!process.env.VUOTO && via.indexOf('比和') === 0 && trendVuoto;
  // SOPRAFFAZIONE DEL TRASFORMATO (Edu, 09/08/2026): quando il verdetto è "segue" ma il Yong
  // TRASFORMATO finisce per controllare il Ti (剋 nella lettura trasformata), il corpo è
  // sopraffatto → non segue. Vale per qualsiasi caso di mutazione (non solo il caso 2).
  const sopraffTrasf = !!process.env.SOPRAF && CTRL[trasf.el] === corpo.el;
  // FLUSSO DEL QI DISCRETO (Edu, 10/08/2026): fra gli elementi dei tre rami del Bazi il qi
  // corre lungo la catena generativa. CAPOLINEA = elemento che riceve e non cede a un altro
  // presente: il qi converge su di lui e lo nutre. SORGENTE = cede senza ricevere: si svuota.
  const elsPres0 = Array.from(new Set([yearBranch, monthBranch, dayBranch].map(b => WX[b])));
  const conLib = (TM === 'flusso' || TM === 'tutto');
  const elsPres = conLib ? Array.from(new Set(elsPres0.concat(liberati))) : elsPres0;
  const fRiceve = e => elsPres.some(x => GEN[x] === e);
  const fCede   = e => elsPres.indexOf(GEN[e]) >= 0;
  const capolinea = elsPres.filter(e => fRiceve(e) && !fCede(e));
  const sorgenti  = elsPres.filter(e => fCede(e) && !fRiceve(e));
  const flussoVersoTi  = capolinea.indexOf(corpo.el) >= 0 || capolinea.some(e => GEN[e] === corpo.el);
  const flussoViaDalTi = sorgenti.indexOf(corpo.el) >= 0 ||
        (fCede(corpo.el) && !fRiceve(corpo.el) && elsPres.indexOf(corpo.el) < 0 && elsPres.indexOf(GEN[corpo.el]) >= 0);
  // FLUSSOTI (Edu, 10/08/2026): la sopraffazione NON scatta se il flusso del qi converge
  // sul Ti: il corpo è nutrito dalla data e regge l'attacco del trasformato.
  // NAYINDEB (Edu, 10/08/2026): il Na Yin dell'esagramma iniziale (XKDG: esagramma → jiazi
  // → Na Yin) dello stesso elemento del Ti salva un Ti debole di stagione (死/囚) dalla
  // sopraffazione, purché il flusso del qi non porti via dal Ti.
  const nayElS = NAYIN_ESAGRAMMA[sup+'-'+inf] || null;
  const tiStatoS = stagione(corpo.el, monthEl);
  const nayinSalva = !!process.env.NAYINDEB && nayElS === corpo.el &&
        (tiStatoS === '死' || tiStatoS === '囚') && !flussoViaDalTi;
  const sopraffAttiva = sopraffTrasf &&
        !(process.env.FLUSSOTI && flussoVersoTi) && !nayinSalva;
  // DRENAGGIO DEL TI (Edu, 09/08/2026): se il Ti genera il trasformato (Ti drenato) e il
  // trasformato è preponderante nel Bazi (netStr >= 3: sostenuto da tutti i rami, non
  // controllato), il corpo si svuota → non segue. Solo se il trasformato ha davvero la forza.
  const baziRami = [yearBranch, monthBranch, dayBranch];
  const elsDrena = (TM === 'drena' || TM === 'tutto') ? baziRami.map(b=>WX[b]).concat(liberati) : baziRami.map(b=>WX[b]);
  const nsTrasf = elsDrena.filter(e => e === trasf.el || GEN[e] === trasf.el).length
                - elsDrena.filter(e => CTRL[e] === trasf.el).length;
  const drenaggio = !!process.env.DRENA && GEN[corpo.el] === trasf.el && nsTrasf >= 3;
  let finale = (ponteYong || scarico || ponteRel || protetto || yongDebole) ? true
             : ((spazzato || bloccato || autopen || rafforzato) ? false : base);
  if (vuotoPareggio && finale === true) finale = false;
  if (sopraffAttiva && finale === true) finale = false;
  if (drenaggio && finale === true) finale = false;
  return { via, base, trendVuoto, vuotoPareggio, sopraffTrasf, drenaggio, finale, spazzato, rafforzato,
           corpo, uso, trasf, yong, sup, inf, linea, palazzo, palazzoYong, bloccato, autopen, ponteYong, scarico, ponteRel, ramiPonte, protetto, ramiProt, yongDebole, sostegni, dettForze, oraVuota, vuoti, att, dif, dettAtt, dettDif, dettPonte, dettVuoti, dettComb, eccitato, statoTrend, monthEl, oraBranch };
}

const hist = JSON.parse(fs.readFileSync('full1h.json','utf8'));

if (process.env.CARTA) {
  const [cr, dt] = process.env.CARTA.split(' ');
  const bs = hist.crosses[cr].filter(x => x.t.slice(0,10) === dt);
  const o = bs.find(x=>x.t.slice(11,13)==='00').o, c = bs.find(x=>x.t.slice(11,13)==='21').c;
  const p = dt.split('-').map(Number);
  const ch = DLR.buildChartFromForexSeed(process.env.MEZZOGIORNO ? Date.UTC(p[0],p[1]-1,p[2],12,0,0) : mezzanotteTST(p[0],p[1],p[2]), 0, '子');
  const yb = yearBranchAt(p[0],p[1],p[2]);
  const seed = parseInt(f3(o),10);
  const r = leggi(seed, ch.dayBranch, ch.monthBranch, yb, ch.dayStem);
  const f = pipFactor(cr);
  console.log(cr+' — '+dt);
  console.log('seme '+seed+'   Bazi: anno '+yb+' · mese '+ch.monthBranch+' ('+r.monthEl+') · giorno '+ch.dayStem+ch.dayBranch);
  console.log('superiore '+r.sup+' → '+TRIGRAM[r.sup].name+'   inferiore '+r.inf+' → '+TRIGRAM[r.inf].name+'   linea mutante '+r.linea);
  console.log('Trend = '+r.corpo.name+' ('+r.corpo.el+')   Yong = '+r.uso.name+' ('+r.uso.el+')   Yong trasformato = '+r.trasf.name+' ('+r.trasf.el+')   letto: '+(process.env.YONG==='trasformato'?'trasformato':'originale'));
  console.log('relazione '+r.via+' → lettura di base: '+(r.base?'PROSEGUE':'INVERTE'));
  console.log('ora dal seme: '+r.oraBranch+'   palazzo del Trend: '+r.palazzo.join(''));
  console.log('attaccanti: '+(r.dettAtt.length?r.dettAtt.join(' · '):'nessuno')+'   totale '+r.att);
  console.log('rami vuoti che non colpiscono: '+(r.dettVuoti.length?r.dettVuoti.join(' · '):'nessuno'));
  console.log('forze della data: '+(r.dettForze.length?r.dettForze.join(' · '):'nessun clash fra i rami'));
  console.log('sostegno del Yong: '+(r.sostegni.length?r.sostegni.map(x=>x.b+(x.forza<1?'(metà)':'')).join(''):'nessuno')+(r.yongDebole?'  → controllo senza appoggio, il Trend segue':''));
  console.log('combinazione col palazzo del Trend: '+(r.ramiProt.length?r.ramiProt.map(x=>x.b).join(''):'nessuna')+(r.protetto?'  → il Trend e protetto':''));
  console.log('ponte sulla relazione: '+(r.ramiPonte.length?r.ramiPonte.map(x=>x.b).join(''):'nessuno')+(r.ponteRel?'  → il controllo non arriva':''));
  console.log('ponti:      '+(r.dettPonte.length?r.dettPonte.join(' · '):'nessuno'));
  console.log('difensori:  '+(r.dettDif.length?r.dettDif.join(' · '):'nessuno')+'   totale '+r.dif);
  console.log('combinazioni: '+(r.dettComb.length?r.dettComb.join(' · '):'nessuna'));
  console.log('stato del Trend in stagione: '+r.statoTrend+(r.eccitato?'  → forte, il clash ECCITA non spazza':''));
  console.log('vuoti del giorno: '+r.vuoti.join('')+'   ora vuota: '+(r.oraVuota?'SÌ':'no')+'   autopenalità sul palazzo: '+(r.autopen?'SÌ':'no'));
  console.log('palazzo del Yong: '+r.palazzoYong.join('')+'   combinazione dei palazzi: '+(r.bloccato?'SÌ, Trend bloccato':'no'));
  console.log('Trend spazzato via: '+(r.spazzato?'SÌ':'no'));
  console.log('verdetto finale: '+(r.finale?'PROSEGUE':'INVERTE'));
  const byD={}; hist.crosses[cr].forEach(x=>{const dd=x.t.slice(0,10),hh=x.t.slice(11,13);
    byD[dd]=byD[dd]||{}; if(hh==='00')byD[dd].o=x.o; if(hh==='21')byD[dd].c=x.c;});
  const gg=Object.keys(byD).sort().filter(x=>byD[x].o!=null&&byD[x].c!=null);
  const ki=gg.indexOf(dt); const cls=[]; for(let j=0;j<ki;j++) cls.push(byD[gg[j]].c);
  const em=T.emaTrend(cls);
  const sig = em.direction==='up' ? (r.finale?'LONG':'SHORT') : (r.finale?'SHORT':'LONG');
  console.log('EMA '+em.direction+'   segnale '+sig+'   movimento '+((c-o)*f).toFixed(0)+' pip');
  console.log('pnl: '+(sig==='LONG'?(c-o)*f:-(c-o)*f).toFixed(0)+' pip');
  process.exit(0);
}

const FROM = process.env.FROM || '2020-01-01', TO = process.env.TO || '2026-12-31';
const rows = [];
const skipInfo = { n:0, w:0, l:0, pnl:0 };
// EMA a periodo variabile per lo sweep (EMAPER). Finestra e cambi scalati col periodo.
function emaTrendVar(closes, period){
  if(!closes || closes.length < period) return { direction:null, consolidated:false };
  var k=2/(period+1), prev=null, ser=[];
  for(var i=0;i<closes.length;i++){
    if(i<period-1) continue;
    if(i===period-1){var sum=0;for(var j=0;j<period;j++)sum+=closes[j];prev=sum/period;ser.push(prev);continue;}
    prev=closes[i]*k+prev*(1-k); ser.push(prev);
  }
  var dirs=[]; for(var a=1;a<ser.length;a++) dirs.push(ser[a]>ser[a-1]?'u':(ser[a]<ser[a-1]?'d':'f'));
  if(!dirs.length) return { direction:null, consolidated:false };
  var WIN=Math.max(6, Math.round(period*1.25));
  var win=dirs.slice(-WIN), lastd=win[win.length-1];
  var ch=0, pr=null; for(var b=0;b<win.length;b++){var x=win[b];if(x==='f')continue;if(pr!==null&&x!==pr)ch++;pr=x;}
  return { direction: lastd==='u'?'up':(lastd==='d'?'down':'flat'), consolidated: ch<=2 };
}

Object.keys(hist.crosses).forEach(cross => {
  const by = {};
  hist.crosses[cross].forEach(x => { const d=x.t.slice(0,10), hh=x.t.slice(11,13);
    by[d]=by[d]||{}; if(hh==='00') by[d].o=x.o; if(hh==='21') by[d].c=x.c; });
  const days = Object.keys(by).sort().filter(d => by[d].o!=null && by[d].c!=null);
  const f = pipFactor(cross);
  for (let k=12;k<days.length;k++){
    const d=days[k]; if(d<FROM||d>TO) continue;
    const closes=[]; for(let j=0;j<k;j++) closes.push(by[days[j]].c);
    const ema=process.env.EMAPER ? emaTrendVar(closes, parseInt(process.env.EMAPER,10)) : T.emaTrend(closes);
    const runLen = ema.runLen || 0;
    if(!ema.direction||ema.direction==='flat'||!ema.consolidated) continue;
    const o=by[d].o, c=by[d].c;
    const e=seedEdge(o); if(e!=null&&e<3) continue;
    const move=(c-o)*f; if(Math.abs(move)<=10) continue;
    const seed=parseInt(f3(o),10);
    const p=d.split('-').map(Number);
    const ch=DLR.buildChartFromForexSeed(process.env.MEZZOGIORNO ? Date.UTC(p[0],p[1]-1,p[2],12,0,0) : mezzanotteTST(p[0],p[1],p[2]),0,'子');
    if(!ch||ch.error) continue;
    const yb=yearBranchAt(p[0],p[1],p[2]);
    const r=leggi(seed, ch.dayBranch, ch.monthBranch, yb, ch.dayStem, runLen);
    // ASTENSIONE SUI CLASH VALIDI (Edu, 10/08/2026): il clash e' effettivo solo fra
    // ramo del giorno<->ramo del mese, ramo del giorno<->ramo dell'anno, e stelo del
    // giorno<->stelo del mese (甲庚 乙辛 丙壬 丁癸).
    //   SKIPCLASH=tombe|rami|steli|tutti
    if (process.env.SKIPCLASH) {
      const SC = process.env.SKIPCLASH;
      const cGM = CLASH[ch.dayBranch] === ch.monthBranch;
      const cGA = CLASH[ch.dayBranch] === yb;
      const isTombe = (a,b2) => WX[a]==='Earth' && WX[b2]==='Earth';
      const tombeValide = (cGM && isTombe(ch.dayBranch, ch.monthBranch)) || (cGA && isTombe(ch.dayBranch, yb));
      const ys = yearStemAt(p[0],p[1],p[2]);
      const ms = monthStemFrom(ys, ch.monthBranch);
      const cSteli = STEMCLASH[ch.dayStem] === ms;
      const salta = SC==='tombe' ? tombeValide
                  : SC==='rami'  ? (cGM || cGA)
                  : SC==='gm'    ? cGM
                  : SC==='gmnontombe' ? (cGM && !isTombe(ch.dayBranch, ch.monthBranch))
                  : SC==='steli' ? cSteli
                  : SC==='tutti' ? (cGM || cGA || cSteli)
                  : false;
      if (salta && r.base !== null) {
        const pnlS = (ema.direction==='up'?(r.finale?'LONG':'SHORT'):(r.finale?'SHORT':'LONG'))==='LONG'?move:-move;
        skipInfo.n++; skipInfo.pnl += pnlS; if (pnlS>0) skipInfo.w++; else if (pnlS<0) skipInfo.l++;
        continue;
      }
    }
    if (r.base === null) continue;   // 比和 = NO TRADE
    rows.push({cross,date:d,move,emaDir:ema.direction,via:r.via,linea:r.linea,sup:r.sup,inf:r.inf,
               yearBranchUsed:yb, dayStemUsed:ch.dayStem,
               base:r.base, finale:r.finale, emaRun:runLen, trendVuoto:r.trendVuoto, oraBranch:r.oraBranch, vuoti:r.vuoti, dayBranchUsed:ch.dayBranch, monthBranchUsed:ch.monthBranch, spazzato:r.spazzato, bloccato:r.bloccato, autopen:r.autopen, ponteYong:r.ponteYong, scarico:r.scarico, ponteRel:r.ponteRel, protetto:r.protetto, yongDebole:r.yongDebole,
               pnlBase: (ema.direction==='up'?(r.base?'LONG':'SHORT'):(r.base?'SHORT':'LONG'))==='LONG'?move:-move,
               pnl:     (ema.direction==='up'?(r.finale?'LONG':'SHORT'):(r.finale?'SHORT':'LONG'))==='LONG'?move:-move});
  }
});
function stat(sel, campo){
  campo = campo || 'pnl';
  const w=sel.filter(r=>r[campo]>0).length, l=sel.filter(r=>r[campo]<0).length, n=w+l; if(!n) return null;
  const ew=sel.filter(r=>(r.emaDir==='up'?r.move:-r.move)>0).length;
  const el=sel.filter(r=>(r.emaDir==='up'?r.move:-r.move)<0).length;
  const pE=ew/(ew+el), key = campo==='pnl'?'finale':'base';
  const sh=sel.filter(r=>!r[key]).length/sel.length;
  const exp=pE*(1-sh)+(1-pE)*sh, act=w/n, se=Math.sqrt(exp*(1-exp)/n);
  const pips=sel.reduce((s,r)=>s+r[campo],0);
  return {n,act,exp,z:(act-exp)/se,pips,ppt:pips/n};
}
function riga(lab,s){ if(!s) return;
  console.log(lab.padEnd(30)+String(s.n).padStart(6)+(100*s.act).toFixed(2).padStart(8)+'%'+
    (100*(s.act-s.exp)).toFixed(2).padStart(8)+' pp'+s.z.toFixed(2).padStart(7)+
    s.pips.toFixed(0).padStart(9)+s.ppt.toFixed(2).padStart(8)); }

console.log('periodo '+FROM+' → '+TO+'   moltiplicatore Tai Sui '+TAISUI+
            '   scala '+(process.env.SCALA==='stadi'?'cinque stadi':'piatta'));
console.log('carte: '+rows.length);
const tocc = rows.filter(r=>r.spazzato);
console.log('carte in cui il Trend è spazzato via: '+tocc.length+
            '   ('+(100*tocc.length/rows.length).toFixed(1)+'%)');
console.log();
console.log('                              trade    win%   scarto      z      pip  pip/tr');
riga('lettura di base', stat(rows,'pnlBase'));
riga('con clash del palazzo', stat(rows,'pnl'));
console.log('selettore del ramo del Yong: '+(process.env.SEL||'natura')+
  '   regole Yong attive: '+[process.env.NOPARITA?null:'parita',process.env.NOPONTEREL?null:'ponte-rel',process.env.NOSOSTEGNO?null:'sostegno',process.env.NOFORZE?null:'forze'].filter(Boolean).join(' ')||'nessuna');
{ const pv=rows.filter(r=>r.ponteYong), pa=rows.filter(r=>/比和/.test(r.via));
  const sc=(s)=>s.length?s.filter(r=>r.pnl>0).length+' giuste / '+s.filter(r=>r.pnl<0).length+' sbagliate, '+s.reduce((a,r)=>a+r.pnl,0).toFixed(0)+' pip':'nessuna carta';
  console.log('  ponte del palazzo del Yong: '+sc(pv));
  console.log('  parita (carte 比和 riaperte): '+sc(pa));
  const sk=rows.filter(r=>r.scarico), pr=rows.filter(r=>r.ponteRel);
  console.log('  ponte sulla relazione: '+sc(pr));
  const pt=rows.filter(r=>r.protetto), yd=rows.filter(r=>r.yongDebole);
  console.log('  combinazione col palazzo del Trend: '+sc(pt));
  console.log('  sostegno del Yong indebolito: '+sc(yd));
  console.log('  scarico del Yong nel proprio palazzo: '+sc(sk)); }
console.log();
const migl = tocc.filter(r=>r.pnl>0&&r.pnlBase<0), peg = tocc.filter(r=>r.pnl<0&&r.pnlBase>0);
console.log('sulle sole carte toccate: '+migl.length+' raddrizzate ('+
            migl.reduce((s,r)=>s+r.pnl,0).toFixed(0)+' pip) · '+peg.length+' guastate ('+
            peg.reduce((s,r)=>s+r.pnl,0).toFixed(0)+' pip)');
console.log('effetto netto della regola: '+
            (rows.reduce((s,r)=>s+r.pnl,0)-rows.reduce((s,r)=>s+r.pnlBase,0)).toFixed(0)+' pip');
console.log();
console.log('per relazione — base → con la regola');
['生我','我剋','我生','剋我','比和·生我','比和·我剋','比和·我生','比和·剋我'].forEach(v=>{
  const s=rows.filter(r=>r.via===v); if(!s.length) return;
  const a=stat(s,'pnlBase'), b=stat(s,'pnl');
  const t=s.filter(r=>r.spazzato).length;
  console.log('  '+v.padEnd(12)+String(s.length).padStart(5)+' carte  toccate '+String(t).padStart(4)+
    '   '+(100*a.act).toFixed(2)+'% '+a.pips.toFixed(0).padStart(7)+
    '  →  '+(100*b.act).toFixed(2)+'% '+b.pips.toFixed(0).padStart(7));
});
require('fs').writeFileSync('/tmp/research_rows.json', JSON.stringify(rows.map(r=>({c:r.cross,d:r.date,finale:r.finale,via:r.via}))));
if (process.env.CLASHREPORT) {
  // spaccato per tipo di clash valido (perno = giorno)
  const gruppi = {
    'giorno↔mese':      r => CLASH[r.dayBranchUsed] === r.monthBranchUsed,
    'giorno↔anno':      r => CLASH[r.dayBranchUsed] === r.yearBranchUsed,
    'g↔m di tombe':     r => CLASH[r.dayBranchUsed] === r.monthBranchUsed && WX[r.dayBranchUsed]==='Earth' && WX[r.monthBranchUsed]==='Earth',
    'g↔a di tombe':     r => CLASH[r.dayBranchUsed] === r.yearBranchUsed && WX[r.dayBranchUsed]==='Earth' && WX[r.yearBranchUsed]==='Earth',
    'g↔m NON tombe':    r => CLASH[r.dayBranchUsed] === r.monthBranchUsed && !(WX[r.dayBranchUsed]==='Earth' && WX[r.monthBranchUsed]==='Earth'),
    'g↔a NON tombe':    r => CLASH[r.dayBranchUsed] === r.yearBranchUsed && !(WX[r.dayBranchUsed]==='Earth' && WX[r.yearBranchUsed]==='Earth'),
    'steli g↔m':        r => { const p=r.date.split('-').map(Number); const ys=yearStemAt(p[0],p[1],p[2]); return STEMCLASH[r.dayStemUsed]===monthStemFrom(ys, r.monthBranchUsed); },
    'nessun clash valido': r => CLASH[r.dayBranchUsed]!==r.monthBranchUsed && CLASH[r.dayBranchUsed]!==r.yearBranchUsed,
  };
  console.log('\n=== SPACCATO PER TIPO DI CLASH (perno: giorno) ===');
  console.log('gruppo                 carte   win%     z      pip    pip/carta');
  for (const nome in gruppi) {
    const sel = rows.filter(gruppi[nome]);
    const s = stat(sel);
    if (!s) { console.log(nome.padEnd(22)+' 0'); continue; }
    console.log(nome.padEnd(22)+String(sel.length).padStart(6)+'  '+(100*s.act).toFixed(2)+'%  '+s.z.toFixed(2).padStart(6)+'  '+s.pips.toFixed(0).padStart(7)+'  '+(s.pips/sel.length).toFixed(2).padStart(7));
  }
}
if (process.env.DUMP) {
  require('fs').writeFileSync(process.env.DUMP, JSON.stringify(rows.map(r=>({c:r.cross,d:r.date,move:r.move,emaDir:r.emaDir,via:r.via,linea:r.linea,sup:r.sup,inf:r.inf,base:r.base,finale:r.finale,emaRun:r.emaRun,trendVuoto:r.trendVuoto,via:r.via,oraBranch:r.oraBranch,vuoti:r.vuoti,dayBranch:r.dayBranchUsed,monthBranch:r.monthBranchUsed,ponteRel:r.ponteRel,ponteYong:r.ponteYong,scarico:r.scarico,protetto:r.protetto,yongDebole:r.yongDebole,p:r.pnl,b:r.pnlBase}))));
}
if (process.env.LISTA) {
  console.log('\npeggiori 15 carte dopo la regola');
  rows.slice().sort((a,b)=>a.pnl-b.pnl).slice(0,15).forEach(r=>
    console.log('  '+r.cross+' '+r.date+'  '+r.via+'  pnl '+r.pnl.toFixed(0)+
                (r.spazzato?'  (spazzato)':'')));
}

if (process.env.GUASTATE) {
  console.log('\npeggiori carte guastate dalla regola (base giusta → finale sbagliata)');
  rows.filter(r=>r.spazzato && r.pnlBase>0 && r.pnl<0)
      .sort((a,b)=>a.pnl-b.pnl).slice(0,10)
      .forEach(r=>console.log('  '+r.cross+' '+r.date+'  '+r.via+
        '   base +'+r.pnlBase.toFixed(0)+' → finale '+r.pnl.toFixed(0)));
}

if (process.env.GRUPPO) {
  const g = process.env.GRUPPO;
  const s = rows.filter(r=>r.via===g && r.spazzato && r.pnlBase>0 && r.pnl<0)
                .sort((a,b)=>a.pnl-b.pnl).slice(0,10);
  console.log('\npeggiori carte guastate nel gruppo '+g);
  s.forEach(r=>console.log('  '+r.date+' '+r.cross+'   base +'+r.pnlBase.toFixed(0)+' → finale '+r.pnl.toFixed(0)));
}

if (process.env.PERSE) {
  // carte che v5 (senza parità) raddrizzava e che ora tornano negative
  const fs2=require('fs');
  const prev = JSON.parse(fs2.readFileSync('/tmp/v5rows.json','utf8'));
  const m = {}; prev.forEach(r=>m[r.cross+'|'+r.date]=r);
  const persi = rows.filter(r=>{ const p=m[r.cross+'|'+r.date];
    return p && p.pnl>0 && r.pnl<0; }).sort((a,b)=>a.pnl-b.pnl).slice(0,10);
  console.log('\ncarte che la parità fa tornare negative');
  persi.forEach(r=>console.log('  '+r.date+' '+r.cross+'  '+r.via+'   ora '+r.pnl.toFixed(0)+' pip'));
}

if (process.env.PEGGIORI) {
if (skipInfo.n) console.log('\ncarte SALTATE per clash: '+skipInfo.n+'   (avrebbero dato: '+skipInfo.w+' giuste / '+skipInfo.l+' sbagliate · '+skipInfo.pnl.toFixed(0)+' pip)');
  console.log('\npeggiori 12 carte con la regola attiva');
  rows.slice().sort((a,b)=>a.pnl-b.pnl).slice(0,12).forEach(r=>
    console.log('  '+r.date+' '+r.cross+'  '+r.via+'  '+r.pnl.toFixed(0)+' pip'+(r.spazzato?'  (spazzato)':'')));
}

console.log('\ncarte bloccate dalla combinazione dei palazzi: '+rows.filter(r=>r.bloccato).length);
{
  const b=rows.filter(r=>r.bloccato && r.base===true);
  const g=b.filter(r=>r.pnl>0).length, m=b.filter(r=>r.pnl<0).length;
  console.log('  di cui '+b.length+' con verdetto di base PROSEGUE (le uniche che cambiano): '+
              g+' giuste, '+m+' sbagliate, '+b.reduce((s,r)=>s+r.pnl,0).toFixed(0)+' pip');
}

console.log('carte con autopenalità sul palazzo che cambiano verdetto: ' +
  rows.filter(r=>r.base===true && r.autopen).length);

console.log('\npeggiori 12 carte con la regola attiva');
rows.slice().sort((a,b)=>a.pnl-b.pnl).slice(0,12).forEach(r=>
  console.log('  '+r.date.split('-').reverse().join('/')+' '+r.cross+'  '+r.via+'  '+
    r.pnl.toFixed(0)+' pip'+(r.spazzato?'  (spazzato)':'')+(r.autopen?'  (autopen)':'')));

