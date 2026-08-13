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
  else if (process.env.VUOTOSEL === 'ora') {
    const oraY2 = (B.indexOf(oraBranch) % 2) === 0;
    ramoTrend = palTrend.find(b => ((B.indexOf(b) % 2) === 0) === oraY2);
  }
  else { const lineaYang = (linea % 2 === 1); ramoTrend = palTrend.find(b => ((B.indexOf(b) % 2) === 0) === lineaYang); }
  const trendVuotoRaw = ramoTrend != null && vuoti.indexOf(ramoTrend) >= 0;
  // 旺不为空: un ramo prospero di stagione non è davvero vuoto
  const stagRamoTrend = ramoTrend != null ? stagione(WX[ramoTrend], monthEl) : null;
  const ramoProspero = stagRamoTrend === '旺' || (process.env.VUOTOSTAG === 'wangxiang' && stagRamoTrend === '相');
  const trendVuoto = trendVuotoRaw && !(process.env.VUOTOSTAG && ramoProspero);
  const vuotoPareggio = !!process.env.VUOTO && via.indexOf('比和') === 0 && trendVuoto;
  // VUOTO SEMPRE VUOTO (Edu, 13/08/2026, da USDCAD 18/03/2020): il palazzo del Trend vuoto
  // rende il Trend INAGIBILE in QUALSIASI relazione, non solo nel pareggio -> non segue.
  // Eccezione: se il ramo del Trend e' CLASHATO, il vuoto e' risvegliato e non vale.
  //   VUOTOTUTTO=giorno   clash valido solo dal giorno
  //   VUOTOTUTTO=1|pieno  clash dal giorno (sempre) o dall'anno se il ramo dell'anno e' 旺/相
  const VT = process.env.VUOTOTUTTO;
  let vuotoSempre = false;
  if (VT && trendVuoto && ramoTrend != null) {
    const stagAnno = stagione(WX[yearBranch], monthEl);
    const annoTimely = (stagAnno === '旺' || stagAnno === '相');
    const clashTrend = (CLASH[dayBranch] === ramoTrend) ||
                       (VT !== 'giorno' && CLASH[yearBranch] === ramoTrend && annoTimely);
    vuotoSempre = !clashTrend;
  }
  // IL TAI SUI NON SI BATTE (Edu, 13/08/2026, da USDCAD 18/03/2020)
  // Il Tai Sui non e' mai vuoto; se il ramo dell'anno COINCIDE con il palazzo del Trend,
  // il Trend e' il trigramma del Tai Sui e non puo' essere battuto:
  //   TAISUINB=vuoto    annulla solo il vuoto del Trend (il Tai Sui non e' mai vuoto)
  //   TAISUINB=drena    annulla solo il drenaggio del Ti
  //   TAISUINB=tutto    annulla vuoto, drenaggio, sopraffazione e spazzamento
  //   TAISUINB=segue    impone SEGUE (il Trend non si batte in alcun modo)
  const TSNB = process.env.TAISUINB;
  const trendEtaiSui = ramoTrend != null && ramoTrend === yearBranch;
  const tsProtegge = !!TSNB && trendEtaiSui;

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
  if (tsProtegge && (TSNB==='tutto'||TSNB==='segue') && spazzato) finale = base;
  if (tsProtegge && TSNB==='segue') finale = true;
  if (vuotoPareggio && finale === true && !(tsProtegge && (TSNB==='vuoto'||TSNB==='tutto'||TSNB==='segue'))) finale = false;
  if (vuotoSempre && finale === true && !(tsProtegge && (TSNB==='vuoto'||TSNB==='tutto'||TSNB==='segue'))) finale = false;
  if (sopraffAttiva && finale === true && !(tsProtegge && (TSNB==='tutto'||TSNB==='segue'))) finale = false;
  if (drenaggio && finale === true && !(tsProtegge && (TSNB==='drena'||TSNB==='tutto'||TSNB==='segue'))) finale = false;
  // RISCATTO DEL TRASFORMATO MORTO (Edu, 10/08/2026, da USDJPY 31/07/2024):
  // quando la base dice "non segue" ma il ramo attivo del palazzo del Yong ORIGINALE
  // (scelto dall'ORA per polarita', se l'ora non e' vuota) e' dell'elemento prospero
  // del mese E quell'elemento controlla il trasformato, il trasformato nasce morto
  // (schiacciato in stagione, non nutrito) e non minaccia il Ti -> torna "segue".
  //   RISCATTO=a  base 我生 + ramo=mese + ramo controlla il trasformato
  //   RISCATTO=b  a + Na Yin dell'esagramma = elemento del Ti (Ti rinfocolato)
  //   RISCATTO=c  come a ma senza vincolo del mese: ramo preponderante (>=2 nei rami)
  //   RISCATTO=d  come a ma su qualsiasi base "non segue" (non solo 我生)
  let riscatto = false;
  if (process.env.RISCATTO && base === false && !oraVuota) {
    const palOrig = HOUTIAN[usoNum];
    const oraY = (B.indexOf(oraBranch) % 2) === 0;
    const ramoOra = palOrig.length === 1 ? palOrig[0]
                  : palOrig.filter(b2 => ((B.indexOf(b2) % 2) === 0) === oraY)[0];
    if (ramoOra) {
      const we = WX[ramoOra];
      const controlla = CTRL[we] === trasf.el;
      const prospero = we === monthEl;
      const prepond = [yearBranch, monthBranch, dayBranch].filter(b2 => WX[b2] === we).length >= 2;
      const nayOk = NAYIN_ESAGRAMMA[sup+'-'+inf] === corpo.el;
      const RV = process.env.RISCATTO;
      riscatto = RV === 'a' ? (via === '我生' && prospero && controlla)
               : RV === 'b' ? (via === '我生' && prospero && controlla && nayOk)
               : RV === 'c' ? (via === '我生' && prepond && controlla)
               : RV === 'd' ? (prospero && controlla)
               : false;
    }
  }
  if (riscatto) finale = true;
  // ATTERRAGGIO NEL VUOTO (Edu, 11/08/2026, da Liu Yao su USDJPY 31/07/2024):
  // via Na Jia, la linea mutante atterra su un ramo del trigramma TRASFORMATO; se quel
  // ramo e' vuoto (旬空 del giorno) il trasformato nasce vuoto e non puo' agire.
  // (旺不为空 NON si applica: la correzione vale solo per il vuoto del Trend.)
  //   ATTVUOTO=a  il trasformato vuoto non sopraffa' (guardia sulla sopraffazione)
  //   ATTVUOTO=b  base "non segue" + trasformato vuoto che controllava il Ti -> segue
  //   ATTVUOTO=c  base "non segue" + trasformato vuoto (qualsiasi) -> segue
  const NAJIA_IN  = {1:['子','寅','辰'],2:['巳','卯','丑'],3:['卯','丑','亥'],4:['子','寅','辰'],
                     5:['丑','亥','酉'],6:['寅','辰','午'],7:['辰','午','申'],8:['未','巳','卯']};
  const NAJIA_OUT = {1:['午','申','戌'],2:['亥','酉','未'],3:['酉','未','巳'],4:['午','申','戌'],
                     5:['未','巳','卯'],6:['申','戌','子'],7:['戌','子','寅'],8:['丑','亥','酉']};
  let attVuoto = false;
  if (process.env.ATTVUOTO) {
    const interno = linea <= 3;
    const posL = interno ? linea : linea - 3;
    const ramoAtt = (interno ? NAJIA_IN : NAJIA_OUT)[usoTrasf][posL - 1];
    attVuoto = vuoti.indexOf(ramoAtt) >= 0;
  }
  if (attVuoto) {
    const AV = process.env.ATTVUOTO;
    if (AV === 'a' && sopraffAttiva && base === true) finale = true;
    if (AV === 'b' && base === false && CTRL[trasf.el] === corpo.el) finale = true;
    if (AV === 'c' && base === false) finale = true;
  }
  // SOCCORSO DEL TI (Edu, 12/08/2026, da USDCAD 17/06/2026): quando la base dice
  // "non segue" per relazione di controllo, ma la catena di soccorso e' COMPLETA
  // (il flusso del qi della data converge sul Ti + il Na Yin dell'esagramma e' dello
  // stesso elemento del Ti debole 死/囚 e il flusso non porta via), il Ti e' rinfocolato
  // e regge anche il controllo diretto del Yong -> torna "segue".
  //   SOCCORSO=k   solo sulle carte 剋我
  //   SOCCORSO=ks  su 剋我 e 我生
  //   SOCCORSO=kf  come k ma basta il flusso verso il Ti (senza richiedere il Na Yin)
  let soccorso = false;
  if (process.env.SOCCORSO && base === false && finale === false) {
    const SV = process.env.SOCCORSO;
    const viaOk = SV === 'ks' ? (via === '剋我' || via === '我生') : (via === '剋我');
    const catena = SV === 'kf' ? flussoVersoTi
      : (flussoVersoTi && nayElS === corpo.el && (tiStatoS === '死' || tiStatoS === '囚') && !flussoViaDalTi);
    if (viaOk && catena) { finale = true; soccorso = true; }
  }
  // LIUTAG: calcola i dati Liu Yao (palazzo, Shi/Ying, parenti) senza toccare il verdetto
  let liu = null;
  if (process.env.LIUTAG || process.env.LIUYAO) {
    const yangLine2 = (n,p) => ((((n-1) >> (3-p)) & 1) === 0);
    const bitsOf2 = (i8,s8) => { let s=''; for(let p=1;p<=3;p++) s+=(yangLine2(i8,p)?'1':'0');
                                for(let p=1;p<=3;p++) s+=(yangLine2(s8,p)?'1':'0'); return s; };
    if (!global.__PAL2) {
      global.__PAL2 = {};
      for (let P=1;P<=8;P++){
        const pure = bitsOf2(P,P).split('');
        const seq = [ {fl:[],shi:6},{fl:[1],shi:1},{fl:[1,2],shi:2},{fl:[1,2,3],shi:3},
                      {fl:[1,2,3,4],shi:4},{fl:[1,2,3,4,5],shi:5},{fl:[1,2,3,5],shi:4},{fl:[5],shi:3} ];
        for (const g of seq){
          const b2 = pure.slice(); g.fl.forEach(L => b2[L-1] = b2[L-1]==='1'?'0':'1');
          global.__PAL2[b2.join('')] = { shi: g.shi, ying: g.shi>3 ? g.shi-3 : g.shi+3, pal: P };
        }
      }
    }
    const pal2 = global.__PAL2[bitsOf2(inf, sup)];
    const ramoAl2 = p => p<=3 ? NAJIA_IN[inf][p-1] : NAJIA_OUT[sup][p-4];
    // linea mobile: partenza (originale) e arrivo (trasformato), semantica di Edu 11/08/2026:
    //  1. arrivo genera partenza (回頭生)  -> agisce la PARTENZA rafforzata
    //  2. partenza genera arrivo           -> agisce L'ARRIVO
    //  3. arrivo controlla partenza (回頭剋)-> linea spezzata, effetto NULLO
    //  4. partenza controlla arrivo        -> agisce L'ARRIVO
    //  5. stesso elemento                  -> come 1 (partenza rafforzata)
    // ATTERRAGGIO DELLA LINEA MOBILE (regola generale, Edu 12/08/2026, da USDJPY 15/11/2024):
    // la linea mobile "viaggia": parte dal ramo TRASFORMATO (arrivo della mutazione);
    // se quel ramo COMBINA (六合) con un ramo PRESENTE nell'esagramma, la linea ATTERRA
    // su quella linea di destinazione. La POSIZIONE della linea di atterraggio da' la
    // direzione: trigramma inferiore (L1-3) -> SHORT, superiore (L4-6) -> LONG.
    // Se il trasformato non combina con nessun ramo presente, si ferma (nessun atterraggio).
    // NB: il ramo trasformato REALE nella posizione della mobile (non usoTrasf, che e' il
    // trigramma del Yong-PB e puo' differire). Si ricava flippando la linea nel trigramma.
    let atterraggio = null;   // {pos, ramo, dir:'LONG'|'SHORT'}
    {
      const trigMob = linea<=3 ? inf : sup;
      const pInTrig = linea<=3 ? linea : linea-3;
      // flip della linea pInTrig nel trigramma trigMob -> trigramma trasformato
      const yl = (n,p)=>((((n-1)>>(3-p))&1)===0);
      const bits=[yl(trigMob,1),yl(trigMob,2),yl(trigMob,3)];
      bits[pInTrig-1] = !bits[pInTrig-1];
      let trigTrasf=null;
      for(let n=1;n<=8;n++){ if(yl(n,1)===bits[0]&&yl(n,2)===bits[1]&&yl(n,3)===bits[2]){trigTrasf=n;break;} }
      const ramoTrasfReale = pInTrig<=3 && linea<=3 ? NAJIA_IN[trigTrasf][pInTrig-1]
                           : NAJIA_OUT[trigTrasf][pInTrig-1];
      const coinc = COMBINA[ramoTrasfReale];   // ramo con cui il trasformato combina
      // c'e' una linea nell'esagramma di lavoro con quel ramo?
      for(let p=1;p<=6;p++){ if(ramoAl2(p)===coinc){
        atterraggio = { pos:p, ramo:coinc, dir: p<=3 ? 'SHORT':'LONG' }; break; } }
    }
    const ramoDep = ramoAl2(linea);
    const ramoArr = linea<=3 ? NAJIA_IN[usoTrasf][linea-1] : NAJIA_OUT[usoTrasf][linea-4];
    const depEl = WX[ramoDep], arrEl = WX[ramoArr];
    // 伏神 (Edu, 12/08/2026) — calcolati QUI perche' servono anche alla regola della
    // mutante legata dal proprio nascosto (vedi sotto). Quando una delle cinque funzioni
    // manca dall'esagramma, si va all'esagramma PURO del palazzo e si vede in quale linea
    // sta la funzione mancante: quella si mette NASCOSTA dietro la stessa linea.
    const palElX = TRIGRAM[pal2.pal].el;
    const parDi = e => e===palElX ? 'B' : GEN[palElX]===e ? 'C' : CTRL[palElX]===e ? 'W'
      : CTRL[e]===palElX ? 'G' : 'P';
    const ramoPuro = p => p<=3 ? NAJIA_IN[pal2.pal][p-1] : NAJIA_OUT[pal2.pal][p-4];
    const presenti = {};
    for (let p=1;p<=6;p++) presenti[parDi(WX[ramoAl2(p)])] = true;
    const fushen = {};   // posizione -> {b, el, par} del nascosto
    for (let p=1;p<=6;p++) { const bP=ramoPuro(p), fP=parDi(WX[bP]);
      if (!presenti[fP]) fushen[p] = { b: bP, el: WX[bP], par: fP }; }
    let effEl, casoMut;
    if (GEN[arrEl] === depEl)      { effEl = depEl; casoMut = 1; }
    else if (GEN[depEl] === arrEl) { effEl = arrEl; casoMut = 2; }
    else if (CTRL[arrEl] === depEl){ effEl = null;  casoMut = 3; }
    else if (CTRL[depEl] === arrEl){ effEl = arrEl; casoMut = 4; }
    else                           { effEl = depEl; casoMut = 5; }
    // vuoti sulla mutante (Edu, 11/08/2026): la linea che si muove non e' mai vuota
    // (動不為空, nessuna correzione); se invece L'ARRIVO e' vuoto, il movimento e' NULLO.
    if (vuoti.indexOf(ramoArr) >= 0) { effEl = null; casoMut = 0; }
    // sospensione dal giorno (Edu, 11/08/2026): se il ramo del giorno COMBINA (六合) o
    // CLASHA (六冲) con la partenza o con l'arrivo, la linea non produce risultato ora
    // (lo produrra' quando combinazione/clash si scioglie — fuori dal nostro orizzonte).
    if (COMBINA[dayBranch] === ramoDep || COMBINA[dayBranch] === ramoArr ||
        CLASH[dayBranch] === ramoDep || CLASH[dayBranch] === ramoArr) { effEl = null; casoMut = -1; }
    // TRIGRAMMA TOTALMENTE LEGATO (Edu, 12/08/2026, da EURUSD 20/04/2023, corretto):
    // il blocco NON nasce dalla sola auto-combinazione della mobile: nasce quando
    // TUTTI E TRE i rami del trigramma della mobile combinano (六合) con le loro
    // controparti nel trigramma trasformato (caso Xun<->Qian: 丑子, 亥寅, 酉辰) —
    // anche le linee ferme sono legate. L'intero trigramma e' bloccato.
    // Un clash del giorno su partenza/arrivo rompe il legame.
    let trigBloccato = null;
    {
      const trigMob = linea<=3 ? inf : sup;
      const pIn = linea<=3 ? linea : linea-3;
      const yl2 = (n,p)=>((((n-1)>>(3-p))&1)===0);
      const bb=[yl2(trigMob,1),yl2(trigMob,2),yl2(trigMob,3)]; bb[pIn-1]=!bb[pIn-1];
      let tT=null; for(let n=1;n<=8;n++){ if(yl2(n,1)===bb[0]&&yl2(n,2)===bb[1]&&yl2(n,3)===bb[2]){tT=n;break;} }
      const NJ = linea<=3 ? NAJIA_IN : NAJIA_OUT;
      let tutte3 = true;
      for(let p=0;p<3;p++){ if(COMBINA[NJ[trigMob][p]] !== NJ[tT][p]) { tutte3=false; break; } }
      if (tutte3 && CLASH[dayBranch] !== ramoDep && CLASH[dayBranch] !== ramoArr) {
        effEl = null; casoMut = -3; trigBloccato = linea<=3 ? 'inf' : 'sup';
      }
    }
    // MUTANTE LEGATA DAL PROPRIO NASCOSTO (Edu, 12/08/2026, da GBPUSD 09/03/2026):
    // se la PARTENZA della linea mobile COMBINA (六合) col proprio 伏神 (il nascosto
    // sotto la linea mobile stessa), il movimento e' LEGATO -> effetto NULLO.
    // ECCEZIONE: se il ramo del GIORNO clasha quel nascosto, la combinazione si
    // scioglie e la linea si muove senza intralci.
    const fuMob = fushen[linea] || null;
    if (fuMob && COMBINA[ramoDep] === fuMob.b && CLASH[dayBranch] !== fuMob.b) {
      effEl = null; casoMut = -2;
    }
    // ATTERRAGGIO: se il movimento della linea e' NULLO (sospensione dal giorno, arrivo
    // vuoto, legata dal nascosto, 回頭剋) la linea NON viaggia e non atterra (Edu 12/08:
    // le leggi gia' discusse valgono anche qui — una linea che non si muove non parte).
    if (effEl === null) atterraggio = null;
    const shiB = ramoAl2(pal2.shi), yingB = ramoAl2(pal2.ying);
    let shiElE = WX[shiB], yingElE = WX[yingB], shiValido = true, yingValido = true;
    // 1. (Edu, 11/08/2026) l'ARRIVO della mutante COMBINA (六合) con Shi o Ying:
    //    quello riceve la partenza della linea e "diventa" quella linea
    if (COMBINA[ramoArr] === shiB)  shiElE = depEl;
    if (COMBINA[ramoArr] === yingB) yingElE = depEl;
    // 2. l'ARRIVO CLASHA (六冲) Shi o Ying: quello e' invalidato
    if (CLASH[ramoArr] === shiB)  shiValido = false;
    if (CLASH[ramoArr] === yingB) yingValido = false;
    // 3. forza delle linee: stagione del mese, MA il ramo del giorno resta forte e
    //    influenza anch'esso — una linea e' forte se 旺/相 nel mese O sostenuta dal giorno
    const fortLinea = e => { const st = stagione(e, monthEl);
      if (st === '旺' || st === '相') return true;
      const de = WX[dayBranch];
      return de === e || GEN[de] === e; };
    // VUOTO sulle linee Shi/Ying (Edu, 12/08/2026):
    //   - vuota in movimento -> non vuota (動不為空)
    //   - vuota + clash (dal giorno O dall'arrivo della mutante) + timely (旺/相) -> ATTIVA (risvegliata)
    //   - vuota + clash + untimely -> ELIMINATA
    //   - vuota senza clash -> DORMIENTE (non genera, non sostiene, non e' Soggetto pieno)
    //   - non vuota -> stato normale (la validita' resta quella del clash dell'arrivo)
    const statoLin = (B, elLin, isMoving) => {
      if (isMoving) return 'attiva';                 // 動不為空
      const st = stagione(elLin, monthEl);
      const timely = (st === '旺' || st === '相');
      if (vuoti.indexOf(B) < 0) {
        // linea PIENA + clash del GIORNO (Edu, 12/08/2026):
        //   timely -> il clash la fa MUOVERE (movimento oscuro): resta viva
        //   untimely -> 日破: la linea e' ROTTA, non puo' vincere/sostenere
        if (CLASH[dayBranch] === B) return timely ? 'mossa' : 'rotta';
        return 'piena';
      }
      const clash = (CLASH[dayBranch] === B) || (CLASH[ramoArr] === B);
      if (!clash) return 'dormiente';
      return timely ? 'attiva' : 'eliminata';
    };
    const shiMoving = (pal2.shi === linea), yingMoving = (pal2.ying === linea);
    const shiStato  = statoLin(shiB, shiElE, shiMoving);
    const yingStato = statoLin(yingB, yingElE, yingMoving);
    // "effettiva" = puo' agire (generare/sostenere/essere Soggetto pieno):
    //   linea vuota effettiva solo se piena, attiva o in movimento; dormiente/eliminata = no.
    //   per le linee piene resta il vecchio criterio (invalidata dal clash dell'arrivo).
    const shiEff  = shiMoving ? shiValido : (shiStato==='dormiente'||shiStato==='eliminata'||shiStato==='rotta') ? false : shiValido;
    const yingEff = yingMoving ? yingValido : (yingStato==='dormiente'||yingStato==='eliminata'||yingStato==='rotta') ? false : yingValido;
    // (伏神 calcolati sopra, prima della semantica della mutante)
    const fuShi = fushen[pal2.shi] || null;
    liu = { shi: pal2.shi, ying: pal2.ying,
            palEl: TRIGRAM[pal2.pal].el,
            shiEl: WX[ramoAl2(pal2.shi)], yingEl: WX[ramoAl2(pal2.ying)], mutEl: WX[ramoAl2(linea)],
            depEl, arrEl, effEl, casoMut,
            shiB, yingB, shiElE, yingElE, shiValido, yingValido,
            shiStato, yingStato, shiEff, yingEff, shiMoving, yingMoving,
            fushen, fuShi, atterraggio, trigBloccato,
            shiForte: fortLinea(shiElE), yingForte: fortLinea(yingElE) };
  }
  // ================= LIU YAO AUTONOMO (Edu, 11/08/2026) =================
  // Shi (世) = il Trend/Soggetto. Ying (應) e la linea mutante confermano o no.
  // Palazzi di Jing Fang generati dalla sequenza canonica (puro s6, 1a-5a gen s1-s5,
  // 游魂 s4, 歸魂 s3), rami via Na Jia. Verificato su Jin=游魂 di Qian, Shi 4a.
  //   LIUYAO=v1  verdetto dalla sola relazione Ying->Shi (mappa PB); 比和 = NO TRADE
  //   LIUYAO=v2  verdetto dalla sola linea mutante->Shi; 比和 = NO TRADE
  //   LIUYAO=v3  base da Ying; la mutante che controlla Shi ribalta segue->non segue
  //   LIUYAO=v4  base da Ying; la mutante DEVE confermare (stessa direzione), se no NO TRADE
  if (process.env.LIUYAO) {
    const yangLine = (n,p) => ((((n-1) >> (3-p)) & 1) === 0);
    const bitsOf = (i8,s8) => { let s=''; for(let p=1;p<=3;p++) s+=(yangLine(i8,p)?'1':'0');
                               for(let p=1;p<=3;p++) s+=(yangLine(s8,p)?'1':'0'); return s; };
    if (!global.__PAL) {
      global.__PAL = {};
      const numFromBits = tb => { for(let n=1;n<=8;n++){ let ok=true;
          for(let p=1;p<=3;p++) if ((yangLine(n,p)?'1':'0')!==tb[p-1]) ok=false; if(ok) return n; } };
      for (let P=1;P<=8;P++){
        const pure = bitsOf(P,P).split('');
        const seq = [];
        seq.push({fl:[],shi:6}); seq.push({fl:[1],shi:1}); seq.push({fl:[1,2],shi:2});
        seq.push({fl:[1,2,3],shi:3}); seq.push({fl:[1,2,3,4],shi:4}); seq.push({fl:[1,2,3,4,5],shi:5});
        seq.push({fl:[1,2,3,5],shi:4}); seq.push({fl:[5],shi:3});
        for (const g of seq){
          const b = pure.slice(); g.fl.forEach(L => b[L-1] = b[L-1]==='1'?'0':'1');
          global.__PAL[b.join('')] = { shi: g.shi, ying: g.shi>3 ? g.shi-3 : g.shi+3 };
        }
      }
    }
    const key = bitsOf(inf, sup);
    const pal = global.__PAL[key];
    const ramoAl = p => p<=3 ? NAJIA_IN[inf][p-1] : NAJIA_OUT[sup][p-4];
    const shiEl = WX[ramoAl(pal.shi)], yingEl = WX[ramoAl(pal.ying)], mutEl = WX[ramoAl(linea)];
    const verd = (ti, yo) => yo===ti ? null
      : GEN[yo]===ti ? true : CTRL[ti]===yo ? true
      : GEN[ti]===yo ? false : false;
    const LV = process.env.LIUYAO;
    let v = null;
    if (LV==='v1') v = verd(shiEl, yingEl);
    else if (LV==='v2') v = verd(shiEl, mutEl);
    else if (LV==='v3') { v = verd(shiEl, yingEl); if (v===true && CTRL[mutEl]===shiEl) v = false; }
    else if (LV==='v4') { const a2=verd(shiEl,yingEl), b2=verd(shiEl,mutEl); v = (a2!==null && a2===b2) ? a2 : null; }
    base = v; finale = v;
  }
  return { via, base, soccorso, trendVuoto, vuotoPareggio, vuotoSempre, trendEtaiSui, sopraffTrasf, drenaggio, finale, spazzato, rafforzato, usoTrasf,
           corpo, uso, trasf, yong, sup, inf, linea, liu, palazzo, palazzoYong, bloccato, autopen, ponteYong, scarico, ponteRel, ramiPonte, protetto, ramiProt, yongDebole, sostegni, dettForze, oraVuota, vuoti, att, dif, dettAtt, dettDif, dettPonte, dettVuoti, dettComb, eccitato, statoTrend, monthEl, oraBranch };
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
  console.log('regole che ribaltano: '+([
      r.rafforzato?'rafforzamento':null, r.vuotoPareggio?'vuoto nel pareggio':null,
      r.sopraffTrasf?'sopraffazione del trasformato':null, r.drenaggio?'drenaggio del Ti':null,
      r.autopen?'autopenalità':null, r.spazzato?'spazzamento':null
    ].filter(Boolean).join(' · ') || 'nessuna'));
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
const vetoInfo = { n:0, w:0, l:0, pnl:0 };
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
    // VETO ANTI-LONG DAL LIU YAO (Edu, 11/08/2026 — primo abbinamento PB+LY):
    // il PB decide come sempre; se il segnale risultante e' LONG e il Liu Yao mostra
    // un Brother sostenuto al Soggetto (Shi=Brother valido, Ying valido e FORTE che
    // lo genera), si sta fuori.
    //   LYVETO=up   veto solo sui LONG da trend su (segue col trend in salita) — la cella validata
    //   LYVETO=all  veto su tutti i segnali LONG (anche i contrarian da trend giu)
    //   LYVETO=mut  come up, ma serve anche la mutante favorevole (cella stretta)
    if (process.env.LYVETO && r.liu) {
      const L = r.liu;
      const broSost = L.shiValido && L.yingValido && L.shiElE === L.palEl &&
                      GEN[L.yingElE] === L.shiElE && L.yingForte;
      const favMut = L.effEl != null && (GEN[L.effEl] === L.shiElE || L.effEl === L.shiElE);
      const sig = ema.direction==='up' ? (r.finale?'LONG':'SHORT') : (r.finale?'SHORT':'LONG');
      const M = process.env.LYVETO;
      const veto = broSost && sig === 'LONG' && (
          M === 'up'  ? ema.direction === 'up'
        : M === 'all' ? true
        : M === 'mut' ? (ema.direction === 'up' && favMut)
        : false);
      if (veto) {
        const pnlV = move;   // LONG evitato: pnl che avremmo avuto
        vetoInfo.n++; vetoInfo.pnl += pnlV; if (pnlV>0) vetoInfo.w++; else if (pnlV<0) vetoInfo.l++;
        continue;
      }
    }
    rows.push({cross,date:d,move,emaDir:ema.direction,via:r.via,linea:r.linea,sup:r.sup,inf:r.inf,usoTrasf:r.usoTrasf,rafforzato:r.rafforzato,trendEtaiSui:r.trendEtaiSui,seedUsed:seed,
               liu:r.liu,
               yearBranchUsed:yb, dayStemUsed:ch.dayStem,
               base:r.base, finale:r.finale, soccorso:r.soccorso, emaRun:runLen, trendVuoto:r.trendVuoto, oraBranch:r.oraBranch, vuoti:r.vuoti, dayBranchUsed:ch.dayBranch, monthBranchUsed:ch.monthBranch, spazzato:r.spazzato, bloccato:r.bloccato, autopen:r.autopen, ponteYong:r.ponteYong, scarico:r.scarico, ponteRel:r.ponteRel, protetto:r.protetto, yongDebole:r.yongDebole,
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
if (process.env.LIUREP) {
  // TEST (Edu, 11/08/2026): Shi = Brother (ramo dello Shi = elemento del palazzo),
  // EMA giu', Ying genera lo Shi. Quanto rende SEGUIRE il trend (SHORT) in quei giorni?
  // LFROM/LTO: restringono il periodo del referto (spacco recente/vecchio).
  const inPer = r => (!process.env.LFROM || r.date >= process.env.LFROM) && (!process.env.LTO || r.date <= process.env.LTO);
  const seg = sel => {
    const n = sel.length; if (!n) return null;
    const w = sel.filter(r => r.move < 0).length;   // EMA giu': seguire = SHORT, vince se il mercato scende
    const pip = sel.reduce((a,r)=>a + (-r.move), 0);
    const z = (w/n - 0.5) / Math.sqrt(0.25/n);
    return { n, w, pct: 100*w/n, z, pip };
  };
  const broDown = rows.filter(r => inPer(r) && r.liu && r.emaDir==='down' && r.liu.shiValido && r.liu.yingValido
    && r.liu.shiElE===r.liu.palEl && GEN[r.liu.yingElE]===r.liu.shiElE && r.liu.yingForte);
  const broUp   = rows.filter(r => inPer(r) && r.liu && r.emaDir==='up' && r.liu.shiValido && r.liu.yingValido
    && r.liu.shiElE===r.liu.palEl && GEN[r.liu.yingElE]===r.liu.shiElE && r.liu.yingForte);
  // raffinamento con la semantica COMPLETA della mutante (Edu, 11/08/2026):
  // l'elemento efficace effEl (partenza rafforzata nei casi 1/5, arrivo nei casi 2/4,
  // nullo nel caso 3) favorisce lo Shi se lo genera o e' suo fratello
  const favor = r => r.liu.effEl != null && (GEN[r.liu.effEl]===r.liu.shiElE || r.liu.effEl===r.liu.shiElE);
  const broDownMut = broDown.filter(favor);
  const broUpMut   = broUp.filter(favor);
  const broDownAll = rows.filter(r => inPer(r) && r.liu && r.emaDir==='down' && r.liu.shiEl===r.liu.palEl);
  const allDown = rows.filter(r => inPer(r) && r.liu && r.emaDir==='down');
  const stampa = (nome, s) => console.log(nome.padEnd(46) + (s ? ('n '+String(s.n).padStart(5)+'   segue vince '+s.pct.toFixed(2)+'%   z '+s.z.toFixed(2)+'   pip(SHORT) '+s.pip.toFixed(0)) : 'nessuna'));
  console.log('\n=== LIU YAO: Shi=Brother · EMA giu · Ying genera Shi (quanto rende SEGUIRE) ===');
  stampa('B + trend giu + Ying genera Shi:', seg(broDown));
  stampa('  ... e ANCHE la mutante favorisce B:', seg(broDownMut));
  stampa('B + trend giu (tutti):', seg(broDownAll));
  stampa('tutti i trend giu (riferimento):', seg(allDown));
  const segUp = sel => { const n=sel.length; if(!n) return null;
    const w = sel.filter(r=>r.move>0).length; const pip = sel.reduce((a,r)=>a+r.move,0);
    return { n, w, pct:100*w/n, z:(w/n-0.5)/Math.sqrt(0.25/n), pip }; };
  const su = segUp(broUp);
  console.log('confronto speculare — B + trend SU + Ying genera Shi:' + (su ? ('  n '+su.n+'   segue vince '+su.pct.toFixed(2)+'%   z '+su.z.toFixed(2)+'   pip(LONG) '+su.pip.toFixed(0)) : ' nessuna'));
  const suM = segUp(broUpMut);
  console.log('  ... e ANCHE la mutante favorisce B:' + (suM ? ('           n '+suM.n+'   segue vince '+suM.pct.toFixed(2)+'%   z '+suM.z.toFixed(2)+'   pip(LONG) '+suM.pip.toFixed(0)) : ' nessuna'));
}
if (process.env.LYLARGO) {
  // Officer al Soggetto, basi larghe, spacco per mutante (Edu, 12/08/2026):
  //   base A = Shi=Officer valido + Ying valido che GENERA lo Shi (161, senza forza)
  //   base B = Shi=Officer valido (886, senza condizioni sull'Ying)
  // spacco: mutante favorevole allo Shi / sfavorevole (effEl controlla lo Shi) / neutra o nulla
  const isOff = L => CTRL[L.shiElE]===L.palEl;
  const baseA = rows.filter(r => { const L=r.liu; return L && L.shiValido && L.yingValido &&
    isOff(L) && GEN[L.yingElE]===L.shiElE; });
  const baseB = rows.filter(r => { const L=r.liu; return L && L.shiValido && isOff(L); });
  const fav = r => r.liu.effEl != null && (GEN[r.liu.effEl]===r.liu.shiElE || r.liu.effEl===r.liu.shiElE);
  const sfa = r => r.liu.effEl != null && CTRL[r.liu.effEl]===r.liu.shiElE;
  const quota = (sel, test) => { const n=sel.length; if(!n) return null;
    const w=sel.filter(test).length; return {n,w,pct:100*w/n,z:(w/n-0.5)/Math.sqrt(0.25/n)}; };
  const seguiTrend = r => (r.emaDir==='up' ? r.move>0 : r.move<0);
  const scende = r => r.move<0;
  const pb = sel => { const t=sel.filter(r=>r.finale!==null);
    const w=t.filter(r=>r.pnl>0).length, l2=t.filter(r=>r.pnl<0).length;
    return (w+l2) ? {n:t.length, pct:100*w/(w+l2), pip:t.reduce((a,r)=>a+r.pnl,0)} : null; };
  const st = (nome, sel) => { const a=quota(sel,seguiTrend), b=quota(sel,scende), c=pb(sel);
    console.log(nome.padEnd(34)+'n '+String(sel.length).padStart(4)+
      '   segue EMA '+(a?a.pct.toFixed(1):'-')+'%'+
      '   scende '+(b?b.pct.toFixed(1):'-')+'%'+
      '   PB '+(c?c.pct.toFixed(1)+'% ('+c.pip.toFixed(0)+' pip)':'-')); };
  const rec = sel => sel.filter(r=>r.date>='2023-05-01'), vec = sel => sel.filter(r=>r.date<'2023-05-01');
  const blocco = (nome, base) => {
    console.log('\n--- '+nome+' ---');
    st('tutte', base); st('  recente', rec(base)); st('  vecchio', vec(base));
    const f=base.filter(fav), s=base.filter(sfa), nn=base.filter(r=>!fav(r)&&!sfa(r));
    st('mutante FAVOREVOLE', f); st('  recente', rec(f)); st('  vecchio', vec(f));
    st('mutante SFAVOREVOLE', s); st('  recente', rec(s)); st('  vecchio', vec(s));
    st('mutante neutra/nulla', nn); st('  recente', rec(nn)); st('  vecchio', vec(nn));
  };
  console.log('\n=== OFFICER AL SOGGETTO — BASI LARGHE, SPACCO PER MUTANTE ===');
  blocco('base A: Ying valido che genera lo Shi (senza forza)', baseA);
  blocco('base B: solo Shi=Officer valido', baseB);
}
if (process.env.LYCONTA) {
  // imbuto: quante carte hanno l'Officer al Soggetto, e quante restano a ogni condizione
  const off = rows.filter(r => r.liu && CTRL[r.liu.shiElE]===r.liu.palEl);
  const v1 = off.filter(r => r.liu.shiValido);
  const v2 = v1.filter(r => r.liu.yingValido);
  const v3 = v2.filter(r => GEN[r.liu.yingElE]===r.liu.shiElE);
  const v4 = v3.filter(r => r.liu.yingForte);
  console.log('\n=== IMBUTO OFFICER AL SOGGETTO ===');
  console.log('Shi = Officer (tutte):                        '+off.length);
  console.log('  ... e Shi valido (non clashato):            '+v1.length);
  console.log('  ... e Ying valido:                          '+v2.length);
  console.log('  ... e Ying che GENERA lo Shi:               '+v3.length);
  console.log('  ... e Ying FORTE (= cella "sostenuto"):     '+v4.length);
}
if (process.env.LYIPOTESI) {
  // Due ipotesi alternative sull'Officer sostenuto (Edu, 12/08/2026):
  //  1. G = il trend, qualunque esso sia -> nei giorni-cella il mercato SEGUE l'EMA
  //  2. G = ribasso (Officer drena la Wealth) -> nei giorni-cella il mercato SCENDE
  const isOff = L => CTRL[L.shiElE]===L.palEl;
  const cellaTutti = rows.filter(r => { const L=r.liu; return L && L.shiValido && L.yingValido &&
    isOff(L) && GEN[L.yingElE]===L.shiElE && L.yingForte; });
  const rif = rows;   // riferimento: tutte le carte
  const quota = (sel, test) => { const n=sel.length; if(!n) return null;
    const w=sel.filter(test).length; return {n,w,pct:100*w/n,z:(w/n-0.5)/Math.sqrt(0.25/n)}; };
  const seguiTrend = r => (r.emaDir==='up' ? r.move>0 : r.move<0);
  const scende = r => r.move<0;
  const st = (nome, sel) => {
    const a=quota(sel,seguiTrend), b=quota(sel,scende);
    console.log(nome.padEnd(30)+'n '+String(sel.length).padStart(5)+
      '   segue EMA '+(a?a.pct.toFixed(1):'-')+'% (z '+(a?a.z.toFixed(2):'-')+')'+
      '   mercato scende '+(b?b.pct.toFixed(1):'-')+'% (z '+(b?b.z.toFixed(2):'-')+')');
  };
  const rec = sel => sel.filter(r=>r.date>='2023-05-01'), vec = sel => sel.filter(r=>r.date<'2023-05-01');
  console.log('\n=== OFFICER SOSTENUTO: ipotesi 1 (segue il trend EMA) e 2 (ribasso) ===');
  st('cella — TOTALE', cellaTutti);
  st('cella — recente', rec(cellaTutti));
  st('cella — vecchio', vec(cellaTutti));
  // raffinamento con la mutante (come per il Brother): l'elemento efficace
  // favorisce lo Shi se lo genera o e' suo fratello
  const favor = r => r.liu.effEl != null && (GEN[r.liu.effEl]===r.liu.shiElE || r.liu.effEl===r.liu.shiElE);
  const celM = cellaTutti.filter(favor);
  st('cella + mutante favorevole', celM);
  st('  recente', rec(celM));
  st('  vecchio', vec(celM));
  const upM = celM.filter(r=>r.emaDir==='up'), dnM = celM.filter(r=>r.emaDir==='down');
  st('  ... trend SU', upM); st('      recente', rec(upM)); st('      vecchio', vec(upM));
  st('  ... trend GIU', dnM); st('      recente', rec(dnM)); st('      vecchio', vec(dnM));
  // e il PB dentro la cella raffinata
  const pbrep = (nome, sel) => { const t=sel.filter(r=>r.finale!==null);
    const w=t.filter(r=>r.pnl>0).length, l2=t.filter(r=>r.pnl<0).length;
    console.log(nome.padEnd(30)+'n '+String(t.length).padStart(4)+
      (w+l2?('   PB vince '+(100*w/(w+l2)).toFixed(1)+'%   pip '+t.reduce((a,r)=>a+r.pnl,0).toFixed(0)):'')); };
  pbrep('PB nella cella + mutante:', celM);
  pbrep('  recente', rec(celM));
  pbrep('  vecchio', vec(celM));
  st('riferimento (tutte) TOTALE', rif);
  st('riferimento recente', rec(rif));
  st('riferimento vecchio', vec(rif));
  const up = cellaTutti.filter(r=>r.emaDir==='up'), dn = cellaTutti.filter(r=>r.emaDir==='down');
  console.log('  spacco per trend:');
  st('  trend SU', up); st('    recente', rec(up)); st('    vecchio', vec(up));
  st('  trend GIU', dn); st('    recente', rec(dn)); st('    vecchio', vec(dn));
}
if (process.env.LYWEAMALE) {
  // carte Wealth al Soggetto, Shi in ALTO (trigramma superiore, linee 4-6),
  // SOSTENUTO (Ying che genera lo Shi, oppure mutante favorevole), che il PB SBAGLIA.
  const isWea = L => CTRL[L.palEl]===L.shiElE;
  const sostYing = r => r.liu.yingEff && GEN[r.liu.yingElE]===r.liu.shiElE;
  const sostMut  = r => r.liu.effEl!=null && (GEN[r.liu.effEl]===r.liu.shiElE || r.liu.effEl===r.liu.shiElE);
  const sel = rows.filter(r=>{const L=r.liu; return L && isWea(L) && L.shiEff && L.shi>=4 &&
    (sostYing(r) || sostMut(r)) && r.finale!==null && r.pnl<0;})
    .sort((a,b)=>a.pnl-b.pnl);
  console.log('\n=== Wealth in alto, sostenuto (Ying genera O mutante favorevole), PB SBAGLIA ===');
  console.log('carte trovate: '+sel.length+'\n');
  sel.slice(0,12).forEach(r=>{const L=r.liu;
    const sig = r.emaDir==='up' ? (r.finale?'LONG':'SHORT') : (r.finale?'SHORT':'LONG');
    console.log('  '+r.date.split('-').reverse().join('/')+' '+r.cross.padEnd(7)+
      ' Shi L'+L.shi+' '+L.shiB+'('+L.shiElE+')  Ying '+L.yingB+'('+L.yingElE+')'+
      (sostYing(r)?' [Ying genera]':'')+(sostMut(r)?' [mut fav]':'')+
      '  '+(r.finale?'SEGUE':'NON SEGUE')+'/'+sig+'  '+(r.move>0?'+':'')+r.move.toFixed(0)+'pip  pnl '+r.pnl.toFixed(0));});
}
if (process.env.LYWEADIR) {
  // WEALTH-DIREZIONALE (Edu, 12/08/2026): stessa regola dell'Officer G-direzionale.
  // Dottrina: G rappresenta il Trend, Wealth il guadagno — si somigliano, quindi
  // stessa mappa posizione->direzione. Shi=Wealth (il palazzo controlla lo Shi):
  //   trigramma inferiore (linee 1-3) = annuncio RIBASSISTA
  //   trigramma superiore (linee 4-6) = annuncio RIALZISTA
  //   modulazione: Shi debole (non forte per stagione+giorno) -> la direzione si ribalta
  // Uso: SEMPRE come conferma del PB, mai autonomo. Domanda: quando Wealth-dir
  // CONFERMA il PB, il PB vince di piu'?
  const isWea = L => CTRL[L.palEl]===L.shiElE;
  const base = rows.filter(r=>r.liu && isWea(r.liu) && r.finale!==null);
  const gDir = r => { let d = r.liu.shi>=4 ? 1 : -1; return r.liu.shiForte ? d : -d; };
  const pbDir = r => { const sig = r.emaDir==='up' ? (r.finale?'LONG':'SHORT') : (r.finale?'SHORT':'LONG');
    return sig==='LONG' ? 1 : -1; };
  const pb = sel => { const w=sel.filter(r=>r.pnl>0).length, l2=sel.filter(r=>r.pnl<0).length;
    return (w+l2)?{n:sel.length,pct:100*w/(w+l2),pip:sel.reduce((a,r)=>a+r.pnl,0)}:{n:0}; };
  const rec=s=>s.filter(r=>r.date>='2023-05-01'), vec=s=>s.filter(r=>r.date<'2023-05-01');
  const riga=(nome,sel)=>{const a=pb(sel),b=pb(rec(sel)),c=pb(vec(sel));
    console.log(nome.padEnd(34)+'tot '+String(a.n).padStart(4)+' '+(a.n?a.pct.toFixed(1)+'%':'-').padStart(7)+
      '   rec '+String(b.n).padStart(3)+' '+(b.n?b.pct.toFixed(1)+'%':'-').padStart(7)+
      '   vec '+String(c.n).padStart(3)+' '+(c.n?c.pct.toFixed(1)+'%':'-').padStart(7)+
      '   pip '+(a.pip||0).toFixed(0));};
  const conf = base.filter(r=>gDir(r)===pbDir(r));
  const smen = base.filter(r=>gDir(r)!==pbDir(r));
  console.log('\n=== WEALTH-DIREZIONALE come conferma del PB (salute via forza) ===');
  console.log('base Shi=Wealth con verdetto: '+base.length);
  riga('Wealth CONFERMA il PB:', conf);
  riga('Wealth SMENTISCE il PB:', smen);
  riga('riferimento (tutte le base):', base);
  // e come predittore diretto del mercato (mai autonomo, solo per curiosita')
  const q=(sel)=>{const n=sel.length;if(!n)return null;
    const g=sel.filter(r=>(r.move>0?1:-1)===gDir(r)).length;
    return {n,pct:100*g/n,z:(g/n-0.5)/Math.sqrt(0.25/n)};};
  const dir=(nome,sel)=>{const a=q(sel);
    console.log(nome.padEnd(34)+(a?('n '+String(a.n).padStart(4)+'   indovina il mercato '+a.pct.toFixed(1)+'%   z '+a.z.toFixed(2)):'n 0'));};
  console.log('\n--- Wealth-dir come predittore diretto del mercato (informativo) ---');
  dir('tutte le base:', base); dir('  recente', rec(base)); dir('  vecchio', vec(base));
}
if (process.env.LYIMBUTO) {
  // imbuto generico per QUALUNQUE parente, cella "sostenuto + trend su"
  const P = process.env.LYIMBUTO;
  const isPar = L =>
      P==='bro' ? L.shiElE===L.palEl
    : P==='off' ? CTRL[L.shiElE]===L.palEl
    : P==='wea' ? CTRL[L.palEl]===L.shiElE
    : P==='chi' ? GEN[L.palEl]===L.shiElE
    : P==='par' ? GEN[L.shiElE]===L.palEl
    : false;
  const base = rows.filter(r=>r.liu);
  const t1 = base.filter(r=>isPar(r.liu));
  const t2 = t1.filter(r=>r.liu.shiEff);
  const t3 = t2.filter(r=>r.liu.yingEff);
  const t4 = t3.filter(r=>GEN[r.liu.yingElE]===r.liu.shiElE);
  const t5 = t4.filter(r=>r.liu.yingForte);
  const t6 = t5.filter(r=>r.emaDir==='up');
  console.log('\n=== IMBUTO ['+P+'] sostenuto + trend su ===');
  console.log('carte totali (set di produzione):             '+rows.length);
  console.log('carte con verdetto LY calcolato:              '+base.length);
  console.log('Shi = '+P+' (parente giusto):                 '+t1.length);
  console.log('  ... e Shi effettivo (non vuoto/rotto):      '+t2.length);
  console.log('  ... e Ying effettivo:                       '+t3.length);
  console.log('  ... e Ying che GENERA lo Shi:               '+t4.length);
  console.log('  ... e Ying FORTE (sostenuto):               '+t5.length);
  console.log('  ... e trend EMA su (= cella finale):        '+t6.length);
}
if (process.env.LYCELLA) {
  // CELLE SORELLE (Edu, 12/08/2026): stessa struttura della cella Brother-sostenuto,
  // ma con lo Shi di un altro parente. LYCELLA=bro|off|wea|chi|par
  //   bro: Shi = elemento del palazzo (兄弟)
  //   off: Shi controlla il palazzo (官鬼)
  //   wea: il palazzo controlla lo Shi (妻財)
  //   chi: il palazzo genera lo Shi (子孫)
  //   par: lo Shi genera il palazzo (父母)
  // Cella: Shi=parente, Shi valido, Ying valido e FORTE che genera lo Shi, EMA su.
  // NB (12/08 tardo): usa shiEff/yingEff (post correzione vuoto/rotta), come nel
  // ricalcolo LYRICALC — coerente coi numeri definitivi Brother 94 / Officer 71.
  const P = process.env.LYCELLA;
  const isPar = L =>
      P==='bro' ? L.shiElE===L.palEl
    : P==='off' ? CTRL[L.shiElE]===L.palEl
    : P==='wea' ? CTRL[L.palEl]===L.shiElE
    : P==='chi' ? GEN[L.palEl]===L.shiElE
    : P==='par' ? GEN[L.shiElE]===L.palEl
    : false;
  const cella = dir => rows.filter(r => { const L=r.liu; return L && r.emaDir===dir &&
    L.shiEff && L.yingEff && isPar(L) && GEN[L.yingElE]===L.shiElE && L.yingForte; });
  const referto = (nome, sel) => {
    const segC = sel.filter(r=>r.finale===true), nonC = sel.filter(r=>r.finale===false);
    const rid = (n2, s2) => { const w=s2.filter(r=>r.pnl>0).length, l2=s2.filter(r=>r.pnl<0).length;
      console.log('  '+n2.padEnd(30)+'n '+String(s2.length).padStart(4)+
        (w+l2?('   vinte '+w+' / perse '+l2+'   win '+(100*w/(w+l2)).toFixed(1)+'%   pip '+
        s2.reduce((a,r)=>a+r.pnl,0).toFixed(0)):'')); };
    const su = sel.filter(r=>r.move>0).length;
    console.log(nome+'  ('+sel.length+' carte; mercato SALITO in '+su+'/'+sel.length+
      ' = '+(sel.length?(100*su/sel.length).toFixed(1):'0')+'%)');
    rid('PB dice SEGUE:', segC);
    rid('PB dice NON SEGUE:', nonC);
    const tot = sel.filter(r=>r.finale!==null);
    rid('PB complessivo:', tot);
  };
  const spacco = (nome, sel) => {
    referto('\n['+P+'] '+nome+' — TOTALE', sel);
    referto('['+P+'] '+nome+' — recente (05/2023→)', sel.filter(r=>r.date>='2023-05-01'));
    referto('['+P+'] '+nome+' — vecchio (→04/2023)', sel.filter(r=>r.date<'2023-05-01'));
  };
  spacco('Shi sostenuto + trend SU', cella('up'));
  spacco('Shi sostenuto + trend GIU', cella('down'));
}
if (process.env.LYATT) {
  // GENERALIZZAZIONE della cella "Officer + mutante sfavorevole" a qualunque parente
  // (Edu, 12/08/2026 sera). LYATT=bro|off|wea|chi|par
  // Cella: Shi=parente, Shi valido (shiEff, post vuoto/rotta), mutante sfavorevole
  // (l'elemento efficace della mutante CONTROLLA lo Shi). Nessuna condizione su Ying/trend.
  const P = process.env.LYATT;
  const isPar = L =>
      P==='bro' ? L.shiElE===L.palEl
    : P==='off' ? CTRL[L.shiElE]===L.palEl
    : P==='wea' ? CTRL[L.palEl]===L.shiElE
    : P==='chi' ? GEN[L.palEl]===L.shiElE
    : P==='par' ? GEN[L.shiElE]===L.palEl
    : false;
  const sfa = r => r.liu.effEl != null && CTRL[r.liu.effEl]===r.liu.shiElE;
  const cella = rows.filter(r => { const L=r.liu; return L && L.shiEff && isPar(L) && sfa(r); });
  const pb = sel => { const t=sel.filter(r=>r.finale!==null);
    const w=t.filter(r=>r.pnl>0).length, l2=t.filter(r=>r.pnl<0).length;
    return (w+l2)?{n:t.length,pct:100*w/(w+l2),pip:t.reduce((a,r)=>a+r.pnl,0)}:{n:0,pct:null,pip:0}; };
  const rec = sel=>sel.filter(r=>r.date>='2023-05-01'), vec = sel=>sel.filter(r=>r.date<'2023-05-01');
  const riga = (nome, sel) => { const a=pb(sel),b=pb(rec(sel)),c=pb(vec(sel));
    console.log(nome.padEnd(38)+'tot '+String(a.n).padStart(4)+' '+(a.pct!=null?a.pct.toFixed(1)+'%':'-').padStart(7)+
      '   rec '+String(b.n).padStart(3)+' '+(b.pct!=null?b.pct.toFixed(1)+'%':'-').padStart(7)+
      '   vec '+String(c.n).padStart(3)+' '+(c.pct!=null?c.pct.toFixed(1)+'%':'-').padStart(7)+
      '   pip '+(a.pip||0).toFixed(0)); };
  console.log('\n=== ['+P+'] mutante sfavorevole (shiEff, post vuoto/rotta) ===');
  riga('cella completa:', cella);
  riga('  ... solo NON SEGUE:', cella.filter(r=>r.finale===false));
  riga('  ... solo SEGUE:', cella.filter(r=>r.finale===true));
}
if (process.env.LYSPACCATO) {
  // nei giorni Brother-sostenuto + trend su: cosa fa gia' il PB da solo?
  const inPer2 = r => (!process.env.LFROM || r.date >= process.env.LFROM) && (!process.env.LTO || r.date <= process.env.LTO);
  const cel = rows.filter(r => { const L=r.liu; return inPer2(r) && L && r.emaDir==='up' && L.shiValido && L.yingValido &&
    L.shiElE===L.palEl && GEN[L.yingElE]===L.shiElE && L.yingForte; });
  const seg = cel.filter(r=>r.finale===true), non = cel.filter(r=>r.finale===false);
  const rid = (nome, s2) => { const w=s2.filter(r=>r.pnl>0).length, l2=s2.filter(r=>r.pnl<0).length;
    console.log(nome.padEnd(34)+'n '+String(s2.length).padStart(4)+'   vinte '+w+' / perse '+l2+
      (s2.length?('   win '+(100*w/Math.max(1,w+l2)).toFixed(1)+'%   pip '+s2.reduce((a,r)=>a+r.pnl,0).toFixed(0)):''));
  };
  console.log('\n=== giorni Brother-sostenuto + trend SU: il PB da solo ===');
  rid('PB dice SEGUE (LONG):', seg);
  rid('PB dice NON SEGUE (SHORT):', non);
  const mercatoGiu = cel.filter(r=>r.move<0).length;
  console.log('mercato sceso in '+mercatoGiu+'/'+cel.length+' giorni ('+(100*mercatoGiu/Math.max(1,cel.length)).toFixed(1)+'%)');
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
if (vetoInfo.n) console.log('\nLONG VETATI dal Liu Yao: '+vetoInfo.n+'   (avrebbero dato: '+vetoInfo.w+' vinti / '+vetoInfo.l+' persi · '+vetoInfo.pnl.toFixed(0)+' pip evitati se negativi)');
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

if (process.env.LYDIR) {
  // dentro la cella Officer valido + mutante sfavorevole: che direzione prende il mercato,
  // e come si distribuiscono i verdetti PB (segue/non segue, long/short)?
  const isOff = L => CTRL[L.shiElE]===L.palEl;
  const sfa = r => r.liu.effEl != null && CTRL[r.liu.effEl]===r.liu.shiElE;
  const cel = rows.filter(r => r.liu && r.liu.shiValido && isOff(r.liu) && sfa(r) && r.finale!==null);
  const rid = (nome, sel) => { const w=sel.filter(r=>r.pnl>0).length, l2=sel.filter(r=>r.pnl<0).length;
    console.log(nome.padEnd(36)+'n '+String(sel.length).padStart(4)+
      (w+l2?('   vinte '+w+'/'+(w+l2)+'   win '+(100*w/(w+l2)).toFixed(1)+'%   pip '+sel.reduce((a,r)=>a+r.pnl,0).toFixed(0)):''));};
  const per = (nome, sel) => {
    console.log('\n['+nome+']  ('+sel.length+' carte; mercato salito '+sel.filter(r=>r.move>0).length+
      ', sceso '+sel.filter(r=>r.move<0).length+')');
    const sig = r => r.emaDir==='up' ? (r.finale?'LONG':'SHORT') : (r.finale?'SHORT':'LONG');
    rid('PB SEGUE:', sel.filter(r=>r.finale===true));
    rid('PB NON SEGUE:', sel.filter(r=>r.finale===false));
    rid('segnale LONG:', sel.filter(r=>sig(r)==='LONG'));
    rid('segnale SHORT:', sel.filter(r=>sig(r)==='SHORT'));
    rid('trend su:', sel.filter(r=>r.emaDir==='up'));
    rid('trend giu:', sel.filter(r=>r.emaDir==='down'));
  };
  per('TOTALE', cel);
  per('recente', cel.filter(r=>r.date>='2023-05-01'));
  per('vecchio', cel.filter(r=>r.date<'2023-05-01'));
}
if (process.env.LYPESCA) {
  // pesca una carta con Shi=Officer sostenuto (la cella "speculare del Brother" che
  // non ha prodotto direzione), preferibilmente recente e leggibile
  const isOff = L => CTRL[L.shiElE]===L.palEl;
  const cel = rows.filter(r => { const L=r.liu; return L && L.shiValido && L.yingValido &&
    isOff(L) && GEN[L.yingElE]===L.shiElE && L.yingForte && r.emaDir==='up' && r.finale!==null; });
  cel.sort((a,b)=> a.date<b.date?1:-1);
  console.log('\ncarte Officer sostenuto + trend su (piu recenti):');
  cel.slice(0,12).forEach(r=>console.log('  '+r.date.split('-').reverse().join('/')+'  '+r.cross+
    '   via '+r.via+'   PB '+(r.finale?'SEGUE':'NON SEGUE')+'   mov '+r.move.toFixed(0)+' pip'));
}
if (process.env.LYVUOTOCHECK) {
  // il motore controlla se Shi/Ying sono VUOTI (旬空)? verifica sulla cella Brother e Officer
  const isOff = L => CTRL[L.shiElE]===L.palEl;
  const isBro = L => L.shiElE===L.palEl;
  const cellaBro = rows.filter(r => { const L=r.liu; return L && L.shiValido && L.yingValido &&
    isBro(L) && GEN[L.yingElE]===L.shiElE && L.yingForte && r.emaDir==='up'; });
  const cellaOff = rows.filter(r => { const L=r.liu; return L && L.shiValido && L.yingValido &&
    isOff(L) && GEN[L.yingElE]===L.shiElE && L.yingForte; });
  const yingVuoto = r => r.vuoti.indexOf(r.liu.yingB) >= 0;
  const shiVuoto  = r => r.vuoti.indexOf(r.liu.shiB) >= 0;
  console.log('\n=== controllo VUOTO su Shi/Ying nelle celle ===');
  console.log('cella Brother sostenuto+su: '+cellaBro.length+' carte   di cui Ying VUOTO: '+
    cellaBro.filter(yingVuoto).length+'   Shi vuoto: '+cellaBro.filter(shiVuoto).length);
  console.log('cella Officer sostenuto:    '+cellaOff.length+' carte   di cui Ying VUOTO: '+
    cellaOff.filter(yingVuoto).length+'   Shi vuoto: '+cellaOff.filter(shiVuoto).length);
  // la carta di Edu
  const e = rows.find(r=>r.cross==='EURJPY' && r.date==='2026-06-16');
  if (e) console.log('\nEURJPY 16/06: Shi ramo '+e.liu.shiB+' (vuoto? '+(e.vuoti.indexOf(e.liu.shiB)>=0)+
    ')   Ying ramo '+e.liu.yingB+' (vuoto? '+(e.vuoti.indexOf(e.liu.yingB)>=0)+')   vuoti del giorno: '+e.vuoti.join(''));
}
if (process.env.LYRICALC) {
  const isOff = L => CTRL[L.shiElE]===L.palEl;
  const isBro = L => L.shiElE===L.palEl;
  const sfa = r => r.liu.effEl != null && CTRL[r.liu.effEl]===r.liu.shiElE;
  const pb = sel => { const t=sel.filter(r=>r.finale!==null);
    const w=t.filter(r=>r.pnl>0).length, l2=t.filter(r=>r.pnl<0).length;
    return (w+l2)?{n:t.length,pct:100*w/(w+l2),pip:t.reduce((a,r)=>a+r.pnl,0)}:{n:0}; };
  const rec = sel=>sel.filter(r=>r.date>='2023-05-01'), vec = sel=>sel.filter(r=>r.date<'2023-05-01');
  const riga = (nome, sel) => { const a=pb(sel),b=pb(rec(sel)),c=pb(vec(sel));
    console.log(nome.padEnd(40)+'tot '+String(a.n).padStart(4)+' '+(a.n?a.pct.toFixed(1)+'%':'-').padStart(7)+
      '   rec '+String(b.n).padStart(3)+' '+(b.n?b.pct.toFixed(1)+'%':'-').padStart(7)+
      '   vec '+String(c.n).padStart(3)+' '+(c.n?c.pct.toFixed(1)+'%':'-').padStart(7)+
      '   pip '+(a.pip||0).toFixed(0)); };
  console.log('\n=== RICALCOLO con VUOTO sulle linee ===');
  console.log('--- Brother sostenuto + trend su (PB nella cella) ---');
  const broVecchio = rows.filter(r=>{const L=r.liu;return L&&r.emaDir==='up'&&L.shiValido&&L.yingValido&&
    isBro(L)&&GEN[L.yingElE]===L.shiElE&&L.yingForte;});
  const broNuovo = rows.filter(r=>{const L=r.liu;return L&&r.emaDir==='up'&&L.shiEff&&L.yingEff&&
    isBro(L)&&GEN[L.yingElE]===L.shiElE&&L.yingForte;});
  riga('PRIMA (senza vuoto):', broVecchio);
  riga('DOPO (linee vuote escluse):', broNuovo);
  riga('  ... solo NON SEGUE, DOPO:', broNuovo.filter(r=>r.finale===false));
  console.log('\n--- Officer + mutante sfavorevole (PB nella cella) ---');
  const offVecchio = rows.filter(r=>r.liu&&r.liu.shiValido&&isOff(r.liu)&&sfa(r));
  const offNuovo = rows.filter(r=>r.liu&&r.liu.shiEff&&isOff(r.liu)&&sfa(r));
  riga('PRIMA (senza vuoto):', offVecchio);
  riga('DOPO (Shi vuoto escluso):', offNuovo);
  riga('  ... solo NON SEGUE, DOPO:', offNuovo.filter(r=>r.finale===false));
}
if (process.env.LYCARTA1) {
  const e = rows.find(r=>r.cross==='EURJPY' && r.date==='2026-06-16');
  if (e) {
    const L=e.liu;
    const sig = e.emaDir==='up' ? (e.finale?'LONG':'SHORT') : (e.finale?'SHORT':'LONG');
    console.log('EURJPY 16/06/2026');
    console.log('  PB: '+(e.finale?'SEGUE':'NON SEGUE')+' -> segnale '+sig);
    console.log('  movimento reale: '+e.move.toFixed(0)+' pip ('+(e.move>0?'salito':'sceso')+')');
    console.log('  esito PB: '+(e.pnl>0?'GIUSTO (+':'SBAGLIATO (')+e.pnl.toFixed(0)+' pip)');
    console.log('  Shi ramo '+L.shiB+' stato '+L.shiStato+' (eff '+L.shiEff+')');
    console.log('  Ying ramo '+L.yingB+' stato '+L.yingStato+' (eff '+L.yingEff+')');
  }
}
if (process.env.LYFORZA1) {
  const p=[2026,6,16];
  const ch=DLR.buildChartFromForexSeed(mezzanotteTST(p[0],p[1],p[2]),0,'子');
  const yb=yearBranchAt(p[0],p[1],p[2]);
  const seed=185;
  const r=leggi(seed, ch.dayBranch, ch.monthBranch, yb, ch.dayStem);
  console.log('EURJPY 16/06/2026 — anatomia del Ti (Qian, Metal)');
  console.log('  rami della data: anno '+yb+' ('+WX[yb]+') · mese '+ch.monthBranch+' ('+WX[ch.monthBranch]+') · giorno '+ch.dayBranch+' ('+WX[ch.dayBranch]+') · ora-seme '+r.oraBranch+' ('+WX[r.oraBranch]+')');
  console.log('  Ti = Qian Metal. In stagione: '+r.statoTrend);
  // conta i rami che attaccano/sostengono il Metal
  const rami=[yb, ch.monthBranch, ch.dayBranch, r.oraBranch];
  const attacca = rami.filter(b=>CTRL[WX[b]]==='Metal');   // Fire controlla Metal
  const genera  = rami.filter(b=>GEN[WX[b]]==='Metal');    // Earth genera Metal
  const pari    = rami.filter(b=>WX[b]==='Metal');
  console.log('  rami che ATTACCANO il Metal (Fuoco): '+(attacca.length?attacca.join(''):'nessuno'));
  console.log('  rami che GENERANO il Metal (Terra): '+(genera.length?genera.join(''):'nessuno'));
  console.log('  rami Metal (pari): '+(pari.length?pari.join(''):'nessuno'));
  // combinazioni che coinvolgono i rami-Terra
  rami.forEach(b=>{ if(WX[b]==='Earth'){ const c=COMBINA[b];
    if(rami.indexOf(c)>=0) console.log('  combinazione: '+b+'(Terra) 六合 '+c+' → la Terra e legata, non genera Metal'); }});
  // quale regola ha ribaltato?
  console.log('  base '+(r.base?'SEGUE':'NON SEGUE')+' → finale '+(r.finale?'SEGUE':'NON SEGUE'));
  console.log('  flag regole: rafforzato='+r.rafforzato+' drenaggio='+r.drenaggio+' sopraffTrasf='+r.sopraffTrasf+
    ' trendVuoto='+r.trendVuoto+' vuotoPareggio='+r.vuotoPareggio+' spazzato='+r.spazzato+' bloccato='+r.bloccato);
  console.log('  casoMutazione del Yong: Gen(Earth)→Kun(Earth) stesso elemento = 比和 (caso 5)');
}
if (process.env.LYDIR1) {
  const p=[2026,6,16];
  const ch=DLR.buildChartFromForexSeed(mezzanotteTST(p[0],p[1],p[2]),0,'子');
  const yb=yearBranchAt(p[0],p[1],p[2]);
  const r=leggi(185, ch.dayBranch, ch.monthBranch, yb, ch.dayStem);
  const L=r.liu;
  const nome=e=>e;
  console.log('EURJPY 16/06 — la carta LY, per direzione');
  console.log('  Shi (Soggetto) elemento '+L.shiEl+' ramo '+L.shiB+' — parente vs palazzo('+L.palEl+'): '+
    (L.shiEl===L.palEl?'Brother':CTRL[L.shiEl]===L.palEl?'Officer':CTRL[L.palEl]===L.shiEl?'Wealth':GEN[L.palEl]===L.shiEl?'Children':'Parent'));
  console.log('  Ying (Oggetto) elemento '+L.yingEl+' ramo '+L.yingB+'  stato '+L.yingStato);
  console.log('  mutante: partenza '+L.depEl+' → arrivo '+L.arrEl+'  effEl '+L.effEl+' (caso '+L.casoMut+')');
  const verd=(ti,yo)=> yo===ti?null : GEN[yo]===ti?true : CTRL[ti]===yo?true : GEN[ti]===yo?false : false;
  console.log('  effetto della mutante sullo Shi: '+ (L.effEl==null?'nullo':
    (GEN[L.effEl]===L.shiEl?'lo GENERA (sostiene)':L.effEl===L.shiEl?'stesso elemento':
     CTRL[L.effEl]===L.shiEl?'lo CONTROLLA (attacca)':GEN[L.shiEl]===L.effEl?'e generato da lui (drena)':'lo controlla al contrario')));
  console.log('  verdetto LY v1 (Ying→Shi): '+(verd(L.shiEl,L.yingEl)===null?'pareggio':verd(L.shiEl,L.yingEl)?'SEGUE':'NON SEGUE'));
  console.log('  verdetto LY v2 (mutante→Shi): '+(verd(L.shiEl,L.mutEl)===null?'pareggio':verd(L.shiEl,L.mutEl)?'SEGUE':'NON SEGUE'));
  console.log('  --- realtà: mercato SALITO, EMA su → risposta giusta = SEGUE ---');
  console.log('  PB ha detto: NON SEGUE (sbagliato)');
}
if (process.env.LYGPOS) {
  // IPOTESI (Edu, 12/08/2026): G (Officer) nel trigramma SUPERIORE = trend ascendente,
  // nel trigramma INFERIORE = trend discendente. Modulazione: se quel G "non se la
  // passa bene" (debole), il verdetto si ribalta.
  // Due letture della posizione di G:
  //   A) la linea dello Shi quando lo Shi e' Officer (posizioni 1-3 = inferiore, 4-6 = superiore)
  //   B) le linee Officer dell'esagramma (qualunque), quando stanno in un solo trigramma
  const NIN  = {1:['子','寅','辰'],2:['巳','卯','丑'],3:['卯','丑','亥'],4:['子','寅','辰'],
                5:['丑','亥','酉'],6:['寅','辰','午'],7:['辰','午','申'],8:['未','巳','卯']};
  const NOUT = {1:['午','申','戌'],2:['亥','酉','未'],3:['酉','未','巳'],4:['午','申','戌'],
                5:['未','巳','卯'],6:['申','午','辰'],7:['戌','子','寅'],8:['酉','亥','丑']};
  const q = (sel,test)=>{const n=sel.length;if(!n)return null;const w=sel.filter(test).length;
    return {n,w,pct:100*w/n,z:(w/n-0.5)/Math.sqrt(0.25/n)};};
  const st=(nome,sel,test)=>{const a=q(sel,test);
    console.log(nome.padEnd(44)+(a?('n '+String(a.n).padStart(4)+'   indovina '+a.pct.toFixed(1)+'%   z '+a.z.toFixed(2)):'n    0'));};
  const rec=s=>s.filter(r=>r.date>='2023-05-01'), vec=s=>s.filter(r=>r.date<'2023-05-01');
  // lettura A: Shi=Officer
  const isOff = L => CTRL[L.shiElE]===L.palEl;
  const baseA = rows.filter(r=>r.liu && isOff(r.liu));
  const su  = r => r.liu.shi>=4;   // Shi nel trigramma superiore
  // verdetto grezzo: superiore -> sale, inferiore -> scende. indovina se il mercato va nel verso detto
  const grezzoA = r => (su(r) ? r.move>0 : r.move<0);
  // modulato: se G (lo Shi) e' debole, ribalta
  const modA = r => { const forte=r.liu.shiForte; const dir = su(r) ? 1 : -1; const dir2 = forte?dir:-dir;
    return dir2>0 ? r.move>0 : r.move<0; };
  console.log('\n=== G-POSIZIONE: Officer sopra=sale, sotto=scende ===');
  console.log('--- lettura A: la linea dello Shi (Shi=Officer, '+baseA.length+' carte) ---');
  st('grezza — tutte',baseA,grezzoA); st('  recente',rec(baseA),grezzoA); st('  vecchio',vec(baseA),grezzoA);
  st('modulata dalla forza — tutte',baseA,modA); st('  recente',rec(baseA),modA); st('  vecchio',vec(baseA),modA);
  const forti=baseA.filter(r=>r.liu.shiForte), deboli=baseA.filter(r=>!r.liu.shiForte);
  st('solo G FORTE (grezza)',forti,grezzoA); st('  recente',rec(forti),grezzoA); st('  vecchio',vec(forti),grezzoA);
  st('solo G DEBOLE (grezza)',deboli,grezzoA); st('  recente',rec(deboli),grezzoA); st('  vecchio',vec(deboli),grezzoA);
  st('solo G DEBOLE (ribaltata)',deboli,r=>!grezzoA(r)); 
  // lettura B: linee Officer dell'esagramma
  const lineeOff = r => { const out=[];
    for(let p=1;p<=6;p++){ const b = p<=3 ? NIN[r.inf][p-1] : NOUT[r.sup][p-4];
      if (CTRL[WX[b]]===r.liu.palEl) out.push({p,b}); } return out; };
  const baseB = rows.filter(r=>{ if(!r.liu) return false; const L=lineeOff(r);
    if(!L.length) return false; const sup=L.some(x=>x.p>=4), inf=L.some(x=>x.p<=3);
    return sup!==inf; });   // solo carte con G in UN SOLO trigramma
  const suB = r => lineeOff(r).some(x=>x.p>=4);
  const grezzoB = r => (suB(r) ? r.move>0 : r.move<0);
  console.log('--- lettura B: linee Officer in un solo trigramma ('+baseB.length+' carte) ---');
  st('grezza — tutte',baseB,grezzoB); st('  recente',rec(baseB),grezzoB); st('  vecchio',vec(baseB),grezzoB);
}
if (process.env.LYGPOS2) {
  // verifica del fushen sulla carta campione, poi test "malmesso" (tre fattori di Edu)
  const e0 = rows.find(r=>r.cross==='EURJPY' && r.date==='2026-06-16');
  if (e0) { const L=e0.liu;
    console.log('verifica EURJPY 16/06: fushen sotto lo Shi = '+
      (L.fuShi ? (L.fuShi.par+' '+L.fuShi.b+' ('+L.fuShi.el+')') : 'nessuno')+
      '   [atteso: P 午 Fire]'); }
  // Tre fattori del "non se la passa bene" (Edu, 12/08/2026):
  //  F1: lo Shi GENERA il suo fushen (perde energia) e il nascosto e' forte nel mese (旺/相)
  //  F2: lo Ying non puo' generare: vuoto (dormiente/eliminata)
  //  F3: la linea mobile parte dall'elemento dello Shi e subisce 回頭剋 (caso 3): il G si spezza
  const F1 = r => r.liu.fuShi && GEN[r.liu.shiElE]===r.liu.fuShi.el &&
    (s=>s==='旺'||s==='相')(stagione(r.liu.fuShi.el, WX[r.monthBranchUsed]));
  const F2 = r => r.liu.yingStato==='dormiente' || r.liu.yingStato==='eliminata';
  const F3 = r => r.liu.casoMut===3 && r.liu.depEl===r.liu.shiElE;
  const isOff = L => CTRL[L.shiElE]===L.palEl;
  const base = rows.filter(r=>r.liu && isOff(r.liu));
  const su  = r => r.liu.shi>=4;
  const q=(sel,test)=>{const n=sel.length;if(!n)return null;const w=sel.filter(test).length;
    return {n,pct:100*w/n,z:(w/n-0.5)/Math.sqrt(0.25/n)};};
  const st=(nome,sel,test)=>{const a=q(sel,test);
    console.log(nome.padEnd(44)+(a?('n '+String(a.n).padStart(4)+'   indovina '+a.pct.toFixed(1)+'%   z '+a.z.toFixed(2)):'n    0'));};
  const rec=s=>s.filter(r=>r.date>='2023-05-01'), vec=s=>s.filter(r=>r.date<'2023-05-01');
  const punti = r => (F1(r)?1:0)+(F2(r)?1:0)+(F3(r)?1:0);
  console.log('distribuzione fattori (su '+base.length+' carte Shi=Officer): '+
    [0,1,2,3].map(k=>k+':'+base.filter(r=>punti(r)===k).length).join('  '));
  for (const soglia of [1,2,3]) {
    const mod = r => { const male = punti(r)>=soglia; const dir = su(r)?1:-1; const d2 = male?-dir:dir;
      return d2>0 ? r.move>0 : r.move<0; };
    console.log('--- malmesso = almeno '+soglia+' fattori ---');
    st('modulata — tutte', base, mod); st('  recente', rec(base), mod); st('  vecchio', vec(base), mod);
    const m=base.filter(r=>punti(r)>=soglia);
    st('solo carte malmesse (ribaltate)', m, r=>{const dir=su(r)?1:-1; return -dir>0?r.move>0:r.move<0;});
    st('  recente', rec(m), r=>{const dir=su(r)?1:-1; return -dir>0?r.move>0:r.move<0;});
    st('  vecchio', vec(m), r=>{const dir=su(r)?1:-1; return -dir>0?r.move>0:r.move<0;});
  }
}
if (process.env.LYCONF) {
  // G come conferma SEMPRE (Edu, 12/08/2026): su ogni carta con Shi=Officer,
  // il G-direzionale (posizione + salute) dice SALE o SCENDE; si confronta con la
  // direzione del segnale PB. Domanda: quando G CONFERMA il PB, il PB vince di piu'?
  const isOff = L => CTRL[L.shiElE]===L.palEl;
  const base = rows.filter(r=>r.liu && isOff(r.liu) && r.finale!==null);
  const F1 = r => r.liu.fuShi && GEN[r.liu.shiElE]===r.liu.fuShi.el &&
    (s=>s==='旺'||s==='相')(stagione(r.liu.fuShi.el, WX[r.monthBranchUsed]));
  const F2 = r => r.liu.yingStato==='dormiente' || r.liu.yingStato==='eliminata';
  const F3 = r => r.liu.casoMut===3 && r.liu.depEl===r.liu.shiElE;
  const gDir = (r, modo) => { let d = r.liu.shi>=4 ? 1 : -1;
    const male = modo==='forza' ? !r.liu.shiForte
               : modo==='fattori' ? ((F1(r)?1:0)+(F2(r)?1:0)+(F3(r)?1:0))>=1
               : (!r.liu.shiForte || ((F1(r)?1:0)+(F2(r)?1:0)+(F3(r)?1:0))>=2);
    return male ? -d : d; };
  const pbDir = r => { const sig = r.emaDir==='up' ? (r.finale?'LONG':'SHORT') : (r.finale?'SHORT':'LONG');
    return sig==='LONG' ? 1 : -1; };
  const pb = sel => { const w=sel.filter(r=>r.pnl>0).length, l2=sel.filter(r=>r.pnl<0).length;
    return (w+l2)?{n:sel.length,pct:100*w/(w+l2),pip:sel.reduce((a,r)=>a+r.pnl,0)}:{n:0}; };
  const rec=s=>s.filter(r=>r.date>='2023-05-01'), vec=s=>s.filter(r=>r.date<'2023-05-01');
  const riga=(nome,sel)=>{const a=pb(sel),b=pb(rec(sel)),c=pb(vec(sel));
    console.log(nome.padEnd(34)+'tot '+String(a.n).padStart(4)+' '+(a.n?a.pct.toFixed(1)+'%':'-').padStart(7)+
      '   rec '+String(b.n).padStart(3)+' '+(b.n?b.pct.toFixed(1)+'%':'-').padStart(7)+
      '   vec '+String(c.n).padStart(3)+' '+(c.n?c.pct.toFixed(1)+'%':'-').padStart(7)+
      '   pip '+(a.pip||0).toFixed(0));};
  for (const modo of ['forza','fattori','misto']) {
    const conf = base.filter(r=>gDir(r,modo)===pbDir(r));
    const smen = base.filter(r=>gDir(r,modo)!==pbDir(r));
    console.log('\n=== G conferma il PB — salute via "'+modo+'" ===');
    riga('G CONFERMA il PB:', conf);
    riga('G SMENTISCE il PB:', smen);
  }
  riga('\nriferimento (tutte le 924):', base);
}
if (process.env.LYLITE) {
  const isOff = L => CTRL[L.shiElE]===L.palEl;
  const base = rows.filter(r=>r.liu && isOff(r.liu) && r.finale!==null);
  const gDir = r => { let d = r.liu.shi>=4 ? 1 : -1; return r.liu.shiForte ? d : -d; };
  const pbDir = r => { const sig = r.emaDir==='up' ? (r.finale?'LONG':'SHORT') : (r.finale?'SHORT':'LONG');
    return sig==='LONG' ? 1 : -1; };
  const lit = base.filter(r=>gDir(r)!==pbDir(r)).sort((a,b)=>a.date<b.date?1:-1);
  console.log('carte in cui G smentisce il PB (piu recenti):');
  lit.slice(0,10).forEach(r=>{
    console.log('  '+r.date.split('-').reverse().join('/')+'  '+r.cross+
      '   PB: '+(pbDir(r)>0?'SALE':'SCENDE')+' ('+(r.finale?'segue':'non segue')+', EMA '+r.emaDir+')'+
      '   G: '+(gDir(r)>0?'SALE':'SCENDE')+' (Shi linea '+r.liu.shi+(r.liu.shi>=4?' sup':' inf')+', '+(r.liu.shiForte?'forte':'debole')+')'+
      '   mercato: '+(r.move>0?'+':'')+r.move.toFixed(0)+' pip → ragione: '+
      ((r.move>0?1:-1)===pbDir(r)?'PB':'G'));
  });
}
if (process.env.LYLITE2) {
  const isOff = L => CTRL[L.shiElE]===L.palEl;
  const base = rows.filter(r=>r.liu && isOff(r.liu) && r.finale!==null && r.move!==0);
  const gDir = r => { let d = r.liu.shi>=4 ? 1 : -1; return r.liu.shiForte ? d : -d; };
  const pbDir = r => { const sig = r.emaDir==='up' ? (r.finale?'LONG':'SHORT') : (r.finale?'SHORT':'LONG');
    return sig==='LONG' ? 1 : -1; };
  const lit = base.filter(r=>gDir(r)!==pbDir(r));
  const q=(sel)=>{const n=sel.length;if(!n)return null;
    const g=sel.filter(r=>(r.move>0?1:-1)===gDir(r)).length;
    return {n,pct:100*g/n,z:(g/n-0.5)/Math.sqrt(0.25/n)};};
  const st=(nome,sel)=>{const a=q(sel);
    console.log(nome.padEnd(38)+(a?('n '+String(a.n).padStart(4)+'   G ha ragione '+a.pct.toFixed(1)+'%   z '+a.z.toFixed(2)):'n    0'));};
  const rec=s=>s.filter(r=>r.date>='2023-05-01'), vec=s=>s.filter(r=>r.date<'2023-05-01');
  console.log('=== LITI PB vs G: chi ha ragione, intero campione ===');
  st('tutte le liti', lit); st('  recente', rec(lit)); st('  vecchio', vec(lit));
  st('G forte (lettura diretta)', lit.filter(r=>r.liu.shiForte));
  st('  recente', rec(lit.filter(r=>r.liu.shiForte))); st('  vecchio', vec(lit.filter(r=>r.liu.shiForte)));
  st('G debole (lettura ribaltata)', lit.filter(r=>!r.liu.shiForte));
  st('  recente', rec(lit.filter(r=>!r.liu.shiForte))); st('  vecchio', vec(lit.filter(r=>!r.liu.shiForte)));
  st('PB con flip (base!=finale)', lit.filter(r=>r.base!==r.finale));
  st('  recente', rec(lit.filter(r=>r.base!==r.finale))); st('  vecchio', vec(lit.filter(r=>r.base!==r.finale)));
  st('PB senza flip', lit.filter(r=>r.base===r.finale));
  st('  recente', rec(lit.filter(r=>r.base===r.finale))); st('  vecchio', vec(lit.filter(r=>r.base===r.finale)));
}
if (process.env.LYCARTA2) {
  const e = rows.find(r=>r.cross===process.env.LYCARTA2.split(' ')[0] && r.date===process.env.LYCARTA2.split(' ')[1]);
  if (e) { const L=e.liu;
    const parN = {B:'Brother',C:'Children',W:'Wealth',G:'Officer',P:'Parent'};
    const parShi = L.shiElE===L.palEl?'Brother':CTRL[L.shiElE]===L.palEl?'Officer':CTRL[L.palEl]===L.shiElE?'Wealth':GEN[L.palEl]===L.shiElE?'Children':'Parent';
    console.log('LY: palazzo '+L.palEl+' · Shi linea '+L.shi+' ('+(L.shi>=4?'trigramma SUPERIORE':'trigramma INFERIORE')+') = '+parShi+' '+L.shiB+' ('+L.shiElE+') · stato '+L.shiStato+' · '+(L.shiForte?'FORTE':'DEBOLE'));
    console.log('    Ying linea '+L.ying+' = '+L.yingB+' ('+L.yingElE+') · stato '+L.yingStato+(L.yingForte?' · forte':' · debole'));
    console.log('    fushen sotto lo Shi: '+(L.fuShi?(parN[L.fuShi.par]+' '+L.fuShi.b+' ('+L.fuShi.el+')'):'nessuno'));
    console.log('    mutante linea '+e.linea+': partenza '+L.depEl+' → arrivo '+L.arrEl+' · caso '+L.casoMut+' · effetto '+(L.effEl||'nullo'));
    const gd = (L.shi>=4?1:-1)*(L.shiForte?1:-1);
    console.log('    G-direzionale: posizione dice '+(L.shi>=4?'SALE':'SCENDE')+', salute '+(L.shiForte?'forte → resta':'debole → ribalta')+' → G dice '+(gd>0?'SALE':'SCENDE'));
  }
}
if (process.env.SOCREP) {
  const s = rows.filter(r=>r.soccorso);
  const w=s.filter(r=>r.pnl>0).length, l2=s.filter(r=>r.pnl<0).length;
  const rec=s.filter(r=>r.date>='2023-05-01'), vec=s.filter(r=>r.date<'2023-05-01');
  const f=x=>{const a=x.filter(r=>r.pnl>0).length,b=x.filter(r=>r.pnl<0).length;
    return x.length+' carte, '+(a+b?(100*a/(a+b)).toFixed(1):'-')+'% giuste, '+x.reduce((q,r)=>q+r.pnl,0).toFixed(0)+' pip';};
  console.log('\ncarte SOCCORSE (non segue → segue): '+f(s));
  console.log('  recente: '+f(rec)+'   vecchio: '+f(vec));
  console.log('  (stesse carte SENZA soccorso avrebbero dato: '+(-s.reduce((q,r)=>q+r.pnl,0)).toFixed(0)+' pip)');
}
if (process.env.LYNETTO) {
  // "G SOPPRESSO NETTO" (Edu, 12/08/2026, da USDCAD 17/06 / Tong Ren):
  // Shi=Officer annuncia una direzione (posizione), ma e' soppresso da fattori concordi:
  //   S1: Shi debole (ne' 旺/相 nel mese, ne' sostenuto dal giorno)
  //   S2: Ying valida e FORTE che CONTROLLA lo Shi
  //   S3: il ramo del giorno CONTROLLA lo Shi
  //   S4: il movimento dello Shi e' legato dal clash del giorno (sospeso)
  // Predizione LY: la direzione annunciata FALLISCE -> il mercato va all'opposto.
  const isOff = L => CTRL[L.shiElE]===L.palEl;
  const base = rows.filter(r=>r.liu && isOff(r.liu) && r.move!==0);
  const S1 = r => !r.liu.shiForte;
  const S2 = r => r.liu.yingEff && r.liu.yingForte && CTRL[r.liu.yingElE]===r.liu.shiElE;
  const S3 = r => CTRL[WX[r.dayBranchUsed]]===r.liu.shiElE;
  const S4 = r => r.liu.shiMoving && r.liu.casoMut===-1;
  const punti = r => (S1(r)?1:0)+(S2(r)?1:0)+(S3(r)?1:0)+(S4(r)?1:0);
  const lyDir = r => (r.liu.shi>=4 ? -1 : 1);   // direzione annunciata fallisce -> opposto
  const q=(sel)=>{const n=sel.length;if(!n)return null;
    const g=sel.filter(r=>(r.move>0?1:-1)===lyDir(r)).length;
    return {n,pct:100*g/n,z:(g/n-0.5)/Math.sqrt(0.25/n)};};
  const st=(nome,sel)=>{const a=q(sel);
    console.log(nome.padEnd(40)+(a?('n '+String(a.n).padStart(4)+'   LY indovina '+a.pct.toFixed(1)+'%   z '+a.z.toFixed(2)):'n    0'));};
  const rec=s=>s.filter(r=>r.date>='2023-05-01'), vec=s=>s.filter(r=>r.date<'2023-05-01');
  console.log('=== G SOPPRESSO NETTO: la direzione annunciata fallisce ===');
  console.log('distribuzione punti: '+[0,1,2,3,4].map(k=>k+':'+base.filter(r=>punti(r)===k).length).join('  '));
  for (const k of [2,3,4]) {
    const sel = base.filter(r=>punti(r)>=k);
    console.log('--- soppressione con almeno '+k+' fattori ---');
    st('LY contro la direzione annunciata', sel); st('  recente', rec(sel)); st('  vecchio', vec(sel));
    // e come andrebbe seguire il LY quando litiga col PB in queste carte
    const pbDir = r => { const sig = r.emaDir==='up' ? (r.finale?'LONG':'SHORT') : (r.finale?'SHORT':'LONG');
      return sig==='LONG' ? 1 : -1; };
    const liti = sel.filter(r=>r.finale!==null && pbDir(r)!==lyDir(r));
    st('  nelle liti col PB (seguendo il LY)', liti);
    st('    recente', rec(liti)); st('    vecchio', vec(liti));
  }
}
if (process.env.LYTESTA) {
  // testa-a-testa nei giorni "LY CHIARO" (G soppresso, >=k fattori):
  // seguire il LY (opposto della direzione annunciata) vs seguire il PB, sugli stessi giorni
  const isOff = L => CTRL[L.shiElE]===L.palEl;
  const base = rows.filter(r=>r.liu && isOff(r.liu) && r.move!==0 && r.finale!==null);
  const S1 = r => !r.liu.shiForte;
  const S2 = r => r.liu.yingEff && r.liu.yingForte && CTRL[r.liu.yingElE]===r.liu.shiElE;
  const S3 = r => CTRL[WX[r.dayBranchUsed]]===r.liu.shiElE;
  const S4 = r => r.liu.shiMoving && r.liu.casoMut===-1;
  const punti = r => (S1(r)?1:0)+(S2(r)?1:0)+(S3(r)?1:0)+(S4(r)?1:0);
  const lyDir = r => (r.liu.shi>=4 ? -1 : 1);
  const pbDir = r => { const sig = r.emaDir==='up' ? (r.finale?'LONG':'SHORT') : (r.finale?'SHORT':'LONG');
    return sig==='LONG' ? 1 : -1; };
  const f=(sel,dir)=>{const n=sel.length;if(!n)return null;
    const w=sel.filter(r=>(r.move>0?1:-1)===dir(r)).length;
    const pip=sel.reduce((a,r)=>a+(dir(r)>0?r.move:-r.move),0);
    return {n,pct:100*w/n,pip};};
  const st=(nome,sel,dir)=>{const a=f(sel,dir);
    console.log(nome.padEnd(36)+(a?('n '+String(a.n).padStart(4)+'   '+a.pct.toFixed(1)+'%   pip '+a.pip.toFixed(0)):'n    0'));};
  const rec=s=>s.filter(r=>r.date>='2023-05-01'), vec=s=>s.filter(r=>r.date<'2023-05-01');
  for (const k of [2,3]) {
    const sel = base.filter(r=>punti(r)>=k);
    console.log('=== giorni LY CHIARO (>= '+k+' fattori): '+sel.length+' carte ===');
    st('seguire il LY:', sel, lyDir); st('  recente', rec(sel), lyDir); st('  vecchio', vec(sel), lyDir);
    st('seguire il PB:', sel, pbDir); st('  recente', rec(sel), pbDir); st('  vecchio', vec(sel), pbDir);
  }
}
if (process.env.LYPERSA) {
  const isOff = L => CTRL[L.shiElE]===L.palEl;
  const base = rows.filter(r=>r.liu && isOff(r.liu) && r.move!==0 && r.finale!==null);
  const S1 = r => !r.liu.shiForte;
  const S2 = r => r.liu.yingEff && r.liu.yingForte && CTRL[r.liu.yingElE]===r.liu.shiElE;
  const S3 = r => CTRL[WX[r.dayBranchUsed]]===r.liu.shiElE;
  const S4 = r => r.liu.shiMoving && r.liu.casoMut===-1;
  const punti = r => (S1(r)?1:0)+(S2(r)?1:0)+(S3(r)?1:0)+(S4(r)?1:0);
  const lyDir = r => (r.liu.shi>=4 ? -1 : 1);
  const sel = base.filter(r=>punti(r)>=3)
    .map(r=>({r, pnlLY: lyDir(r)>0 ? r.move : -r.move}))
    .filter(x=>x.pnlLY<0).sort((a,b)=>a.pnlLY-b.pnlLY);
  console.log('peggiori carte LY-chiaro (>=3 fattori) seguendo il LY:');
  sel.slice(0,8).forEach(x=>{const r=x.r;
    console.log('  '+r.date.split('-').reverse().join('/')+'  '+r.cross+'   fattori '+punti(r)+
      '   Shi linea '+r.liu.shi+' ('+(r.liu.shi>=4?'sup':'inf')+') '+r.liu.shiB+
      '   LY dice '+(lyDir(r)>0?'SALE':'SCENDE')+'   mercato '+(r.move>0?'+':'')+r.move.toFixed(0)+' pip   pnl LY '+x.pnlLY.toFixed(0));});
}
if (process.env.LYWEANORAD) {
  // carte dove: PB SBAGLIA (pnl<0), Shi=Wealth, e il LY-direzionale NON raddrizza
  // (cioe' la direzione LY coincide col PB sbagliato: il LY sbaglia insieme al PB).
  const isWea = L => CTRL[L.palEl]===L.shiElE;
  const gDir = r => { let d = r.liu.shi>=4 ? 1 : -1; return r.liu.shiForte ? d : -d; };
  const pbDir = r => { const sig = r.emaDir==='up' ? (r.finale?'LONG':'SHORT') : (r.finale?'SHORT':'LONG');
    return sig==='LONG' ? 1 : -1; };
  const sel = rows.filter(r=>{const L=r.liu; return L && isWea(L) && r.finale!==null && r.pnl<0 &&
    gDir(r)===pbDir(r);})   // LY concorda col PB -> non raddrizza
    .sort((a,b)=>a.pnl-b.pnl);
  console.log('\n=== Wealth al Soggetto, PB sbaglia, LY NON raddrizza (concorda col PB) ===');
  console.log('carte: '+sel.length+'  (peggiori 10)\n');
  sel.slice(0,10).forEach(r=>{const L=r.liu;
    const sig = r.emaDir==='up' ? (r.finale?'LONG':'SHORT') : (r.finale?'SHORT':'LONG');
    console.log('  '+r.date.split('-').reverse().join('/')+' '+r.cross.padEnd(7)+
      ' Shi L'+L.shi+' '+L.shiB+'('+L.shiElE+') '+(L.shiForte?'forte':'debole')+
      '  PB '+sig+'  LY '+(gDir(r)>0?'LONG':'SHORT')+'  mercato '+(r.move>0?'+':'')+r.move.toFixed(0)+'  pnl '+r.pnl.toFixed(0));});
}
if (process.env.LYLEGATE) {
  // censimento della regola "mutante legata dal proprio nascosto" (casoMut -2)
  const leg = rows.filter(r=>r.liu && r.liu.casoMut===-2 && r.finale!==null);
  const w=leg.filter(r=>r.pnl>0).length, l=leg.filter(r=>r.pnl<0).length;
  console.log('\ncarte con movimento legato dal proprio nascosto (con verdetto): '+leg.length);
  console.log('  di cui il PB vince: '+w+'   perde: '+l+'   win '+(100*w/(w+l)).toFixed(1)+'%   pip '+leg.reduce((a,r)=>a+r.pnl,0).toFixed(0));
}
if (process.env.LYPROBE) {
  const e = rows.find(r=>r.cross===process.env.LYPROBE.split(' ')[0] && r.date===process.env.LYPROBE.split(' ')[1]);
  if (e) { const L=e.liu;
    const parShi = L.shiElE===L.palEl?'B (Brother)':CTRL[L.shiElE]===L.palEl?'G (Officer)'
      :CTRL[L.palEl]===L.shiElE?'W (Wealth)':GEN[L.palEl]===L.shiElE?'C (Children)':'P (Parent)';
    console.log('\n=== PROBE '+e.cross+' '+e.date+' ===');
    console.log('palazzo elemento (palEl): '+L.palEl);
    console.log('Shi ramo '+L.shiB+' elemento '+L.shiElE+'  → parente = '+parShi);
    console.log('mutante: linea '+e.linea+'  partenza el '+L.depEl+'  arrivo el '+L.arrEl+
      '  casoMut '+L.casoMut+'  effEl '+(L.effEl||'nullo'));
    const fm = L.fushen[e.linea];
    console.log('nascosto sotto la mobile: '+(fm?(fm.par+' '+fm.b+' ('+fm.el+')'):'nessuno'));
    if (L.casoMut===-2) console.log('→ MOVIMENTO LEGATO dal proprio nascosto (regola 12/08)');
  }
}
if (process.env.LYSEI) {
  const e = rows.find(r=>r.cross===process.env.LYSEI.split(' ')[0] && r.date===process.env.LYSEI.split(' ')[1]);
  if (e) { const L=e.liu;
    const NIN  = {1:['子','寅','辰'],2:['巳','卯','丑'],3:['卯','丑','亥'],4:['子','寅','辰'],
                  5:['丑','亥','酉'],6:['寅','辰','午'],7:['辰','午','申'],8:['未','巳','卯']};
    const NOUT = {1:['午','申','戌'],2:['亥','酉','未'],3:['酉','未','巳'],4:['午','申','戌'],
                  5:['未','巳','卯'],6:['申','午','辰'],7:['戌','子','寅'],8:['酉','亥','丑']};
    const parDi = eL => eL===L.palEl?'B':GEN[L.palEl]===eL?'C':CTRL[L.palEl]===eL?'W':CTRL[eL]===L.palEl?'G':'P';
    console.log('sei linee (dal basso), vuoti del giorno: '+e.vuoti.join(''));
    for(let p=6;p>=1;p--){ const b = p<=3?NIN[e.inf][p-1]:NOUT[e.sup][p-4];
      const tag = (p===L.shi?'  ← Shi (S)':'')+(p===L.ying?'  ← Ying (Y)':'')+(p===e.linea?'  ← MOBILE (O)':'')
        +(L.fushen[p]?('   [nasconde '+L.fushen[p].par+' '+L.fushen[p].b+']'):'');
      console.log('  linea '+p+':  '+parDi(WX[b])+' '+b+' ('+WX[b]+')'+(e.vuoti.indexOf(b)>=0?' VUOTO':'')+tag); }
  }
}
if (process.env.LYOSCURO) {
  // MOVIMENTO OSCURO + SOSTITUZIONE DEL G VUOTO (Edu, 12/08/2026, da USDJPY 01/05/2024):
  //  - Shi=Officer VUOTO dormiente (il G originario tace)
  //  - una linea piena (non la mobile) e' clashata dal ramo del GIORNO ed e' TIMELY (旺/相)
  //    -> si muove (movimento oscuro); arrivo = ramo alla stessa posizione nell'esagramma trasformato
  //  - se l'arrivo e' un nuovo G (controlla il palazzo) -> sostituisce il G vuoto
  //  - posizione del nuovo G: se l'arrivo COMBINA (六合) con una linea statica, si ancora
  //    alla posizione di quella linea; altrimenti resta sulla linea che si e' mossa
  //  - direzione annunciata: ancora nel trigramma inferiore = ribasso, superiore = rialzo
  const NIN  = {1:['子','寅','辰'],2:['巳','卯','丑'],3:['卯','丑','亥'],4:['子','寅','辰'],
                5:['丑','亥','酉'],6:['寅','辰','午'],7:['辰','午','申'],8:['未','巳','卯']};
  const NOUT = {1:['午','申','戌'],2:['亥','酉','未'],3:['酉','未','巳'],4:['午','申','戌'],
                5:['未','巳','卯'],6:['申','午','辰'],7:['戌','子','寅'],8:['酉','亥','丑']};
  const MUT = {1:{1:5,2:4,3:3,4:2,5:1,6:7,7:6,8:8},0:{}};
  const FLIP = (tri,pos)=>({1:[5,3,2],2:[6,7,1],3:[7,6,4],4:[8,2,6],5:[1,8,7],6:[2,1,8],7:[3,4,5],8:[4,5,3]})[tri][pos-1];
  const isOffEl = (eL,pal) => CTRL[eL]===pal;
  const cnt = {tot:0, giuste:0, rec:[0,0], vec:[0,0], carte:[]};
  for (const r of rows) { const L=r.liu; if(!L) continue;
    if (!(isOffEl(L.shiElE,L.palEl) && L.shiStato==='dormiente')) continue;
    if (r.move===0) continue;
    // trigrammi trasformati dalla mobile PB
    const supT = r.linea>=4 ? FLIP(r.sup, r.linea-3) : r.sup;
    const infT = r.linea<=3 ? FLIP(r.inf, r.linea) : r.inf;
    const ramoLav = p => p<=3?NIN[r.inf][p-1]:NOUT[r.sup][p-4];
    const ramoTra = p => p<=3?NIN[infT][p-1]:NOUT[supT][p-4];
    let trovato=null;
    for (let p=1;p<=6;p++){ if(p===r.linea) continue;
      const b=ramoLav(p);
      if (CLASH[WX ? r.dayBranchUsed : r.dayBranchUsed]===undefined) {}
      if (CLASH[r.dayBranchUsed]!==b) continue;
      const st=stagione(WX[b], WX[r.monthBranchUsed]);
      if (!(st==='旺'||st==='相')) continue;
      const arr=ramoTra(p);
      if (!isOffEl(WX[arr],L.palEl)) continue;
      // ancoraggio via combinazione con una linea statica
      let anchor=p;
      for (let q2=1;q2<=6;q2++){ if(q2===p||q2===r.linea) continue;
        if (COMBINA[arr]===ramoLav(q2)) { anchor=q2; break; } }
      trovato={p,arr,anchor}; break; }
    if(!trovato) continue;
    const dir = trovato.anchor>=4 ? 1 : -1;
    const ok = (r.move>0?1:-1)===dir;
    cnt.tot++; if(ok) cnt.giuste++;
    const per = r.date>='2023-05-01'?'rec':'vec'; cnt[per][0]+= ok?1:0; cnt[per][1]++;
    cnt.carte.push(r.date.split('-').reverse().join('/')+' '+r.cross+' dice '+(dir>0?'SALE':'SCENDE')+' mercato '+(r.move>0?'+':'')+r.move.toFixed(0)+(ok?' ✓':' ✗'));
  }
  console.log('=== G SOSTITUITO dal movimento oscuro ===');
  console.log('casi trovati: '+cnt.tot+'   giusti: '+cnt.giuste+' ('+(cnt.tot?100*cnt.giuste/cnt.tot:0).toFixed(1)+'%)');
  console.log('  recente: '+cnt.rec[0]+'/'+cnt.rec[1]+'   vecchio: '+cnt.vec[0]+'/'+cnt.vec[1]);
  cnt.carte.slice(0,20).forEach(c=>console.log('  '+c));
}

if (process.env.LYATTERRA) {
  const e = rows.find(r=>r.cross===process.env.LYATTERRA.split(' ')[0] && r.date===process.env.LYATTERRA.split(' ')[1]);
  if (e && e.liu) { const a=e.liu.atterraggio;
    console.log('\n=== ATTERRAGGIO '+e.cross+' '+e.date+' ===');
    console.log('linea mobile: '+e.linea+'  ramo mobile: '+e.liu.mutEl);
    console.log('atterraggio: '+(a?('linea '+a.pos+' ('+a.ramo+') → '+a.dir):'nessuno (fermato alla prima fermata)'));
    console.log('Shi linea '+e.liu.shi+'   Ying linea '+e.liu.ying);
  }
}

if (process.env.LYATTTEST) {
  // Test dell'atterraggio come segnale direzionale.
  // Universo: carte con un atterraggio valido e verdetto PB presente.
  const base = rows.filter(r=>r.liu && r.liu.atterraggio && r.finale!==null);
  const dirMercato = r => r.move>0 ? 'LONG':'SHORT';
  const pbSig = r => r.emaDir==='up' ? (r.finale?'LONG':'SHORT') : (r.finale?'SHORT':'LONG');
  const attSig = r => r.liu.atterraggio.dir;
  const rec=s=>s.filter(r=>r.date>='2023-05-01'), vec=s=>s.filter(r=>r.date<'2023-05-01');
  const wr = sel => { if(!sel.length) return '-';
    const g=sel.filter(r=>r.pnl>0).length, p=sel.filter(r=>r.pnl<0).length;
    return (g+p)? (100*g/(g+p)).toFixed(1)+'%' : '-'; };
  const pipsum = sel => sel.reduce((a,r)=>a+r.pnl,0).toFixed(0);
  const riga=(nome,sel)=>console.log(nome.padEnd(40)+'n '+String(sel.length).padStart(4)+
    '   PB win '+wr(sel).padStart(7)+'   rec '+wr(rec(sel)).padStart(7)+'   vec '+wr(vec(sel)).padStart(7)+'   pip '+pipsum(sel).padStart(7));

  console.log('\n=== ATTERRAGGIO come segnale direzionale ===');
  console.log('universo (atterraggio valido + verdetto): '+base.length+'\n');

  // Quanto l'atterraggio predice il mercato da solo
  const attCorretto = base.filter(r=>attSig(r)===dirMercato(r));
  console.log('atterraggio azzecca il mercato: '+attCorretto.length+'/'+base.length+
    ' = '+(100*attCorretto.length/base.length).toFixed(1)+'%'+
    '   (rec '+(100*rec(base).filter(r=>attSig(r)===dirMercato(r)).length/rec(base).length).toFixed(1)+
    '%  vec '+(100*vec(base).filter(r=>attSig(r)===dirMercato(r)).length/vec(base).length).toFixed(1)+'%)');

  // USO A: certifica il PB. Quando atterraggio CONCORDA col PB.
  const concorda = base.filter(r=>attSig(r)===pbSig(r));
  const discorda = base.filter(r=>attSig(r)!==pbSig(r));
  console.log('\n--- USO A: atterraggio come certificazione del PB ---');
  riga('atterraggio CONCORDA col PB:', concorda);
  riga('atterraggio DISCORDA col PB:', discorda);
  riga('riferimento (tutto l universo):', base);

  // USO B: sui PB che PERDONO, l'atterraggio quanti ne raddrizza?
  const pbSbaglia = base.filter(r=>r.pnl<0);
  const raddrizza = pbSbaglia.filter(r=>attSig(r)===dirMercato(r));  // atterraggio dava la direzione giusta
  const peggiora  = pbSbaglia.filter(r=>attSig(r)!==dirMercato(r));  // atterraggio confermava l errore
  console.log('\n--- USO B: sui PB perdenti, l atterraggio raddrizza? ---');
  console.log('PB perde (in universo atterraggio): '+pbSbaglia.length);
  console.log('  atterraggio dava la direzione GIUSTA (raddrizzabili): '+raddrizza.length+
    '   pip recuperabili se seguito l atterraggio: +'+raddrizza.reduce((a,r)=>a+Math.abs(r.move),0).toFixed(0));
  console.log('  atterraggio confermava l errore: '+peggiora.length);
  // E sui PB che VINCONO, quanti ne romperebbe seguendo l atterraggio?
  const pbVince = base.filter(r=>r.pnl>0);
  const rompe = pbVince.filter(r=>attSig(r)!==dirMercato(r));
  console.log('PB vince (in universo atterraggio): '+pbVince.length+
    '   di cui l atterraggio direbbe il CONTRARIO (danno se seguito): '+rompe.length);
}

if (process.env.LYATTFAIL) {
  // carte dove il segnale di atterraggio SBAGLIA la direzione del mercato, peggiori per pip
  const base = rows.filter(r=>r.liu && r.liu.atterraggio && r.finale!==null);
  const dirMercato = r => r.move>0 ? 'LONG':'SHORT';
  const sel = base.filter(r=>r.liu.atterraggio.dir!==dirMercato(r)).sort((a,b)=>Math.abs(b.move)-Math.abs(a.move));
  console.log('\n=== Atterraggio SBAGLIA la direzione (peggiori) ===');
  console.log('carte: '+sel.length+'\n');
  sel.slice(0,8).forEach(r=>{const a=r.liu.atterraggio;
    console.log('  '+r.date.split('-').reverse().join('/')+' '+r.cross.padEnd(7)+
      ' mobile L'+r.linea+'  atterra L'+a.pos+'('+a.ramo+') → '+a.dir+
      '   mercato '+dirMercato(r)+' '+(r.move>0?'+':'')+r.move.toFixed(0)+'pip');});
}

if (process.env.LYATTFAILWO) {
  // atterraggio SBAGLIA, ma solo dove Shi = Wealth o Officer
  const isWea = L => CTRL[L.palEl]===L.shiElE;
  const isOff = L => CTRL[L.shiElE]===L.palEl;
  const base = rows.filter(r=>{const L=r.liu; return L && L.atterraggio && r.finale!==null && (isWea(L)||isOff(L));});
  const dirMercato = r => r.move>0 ? 'LONG':'SHORT';
  const ok = base.filter(r=>r.liu.atterraggio.dir===dirMercato(r));
  console.log('\n=== Atterraggio su Shi=Wealth/Officer ===');
  console.log('carte: '+base.length+'   atterraggio azzecca il mercato: '+ok.length+' = '+(100*ok.length/base.length).toFixed(1)+'%');
  const sel = base.filter(r=>r.liu.atterraggio.dir!==dirMercato(r)).sort((a,b)=>Math.abs(b.move)-Math.abs(a.move));
  console.log('sbaglia in: '+sel.length+' carte (peggiori):\n');
  sel.slice(0,8).forEach(r=>{const L=r.liu,a=L.atterraggio;
    const par = isWea(L)?'Wealth':'Officer';
    console.log('  '+r.date.split('-').reverse().join('/')+' '+r.cross.padEnd(7)+' Shi='+par+' L'+L.shi+
      '  mobile L'+r.linea+' atterra L'+a.pos+'('+a.ramo+')→'+a.dir+'   mercato '+dirMercato(r)+' '+(r.move>0?'+':'')+r.move.toFixed(0)+'pip');});
}

if (process.env.PBALTO) {
  // TEST ALTO/BASSO SUL PB (Edu, 12/08/2026):
  // trigramma superiore = il cross SALE, inferiore = il cross SCENDE.
  // Il Yong (trigramma con la mutante) muta; se il Yong TRASFORMATO controlla il Ti,
  // il lato del Yong e' ATTIVO e VINCE -> direzione = posizione del Yong.
  // Se il Ti controlla il trasformato -> vince il Ti -> direzione = posizione del Ti.
  // Altri rapporti: riportati a parte per vedere che succede.
  const yl = (n,p)=>((((n-1)>>(3-p))&1)===0);
  const trigTrasfDi = (trig, pInTrig) => { const b=[yl(trig,1),yl(trig,2),yl(trig,3)];
    b[pInTrig-1]=!b[pInTrig-1];
    for(let n=1;n<=8;n++) if(yl(n,1)===b[0]&&yl(n,2)===b[1]&&yl(n,3)===b[2]) return n; return null; };
  const EL = {1:'Metal',2:'Metal',3:'Fire',4:'Wood',5:'Wood',6:'Water',7:'Earth',8:'Earth'};
  const base = rows.filter(r=>r.finale!==null && r.sup && r.inf && r.linea);
  const gruppi = {};
  for (const r of base) {
    const yongSotto = r.linea<=3;
    const yongTrig = yongSotto ? r.inf : r.sup;
    const tiTrig   = yongSotto ? r.sup : r.inf;
    const pIn = yongSotto ? r.linea : r.linea-3;
    const trasf = trigTrasfDi(yongTrig, pIn);
    const tiEl = EL[tiTrig], trEl = EL[trasf];
    let dir=null, caso;
    if (CTRL[trEl]===tiEl)      { caso='trasf CONTROLLA Ti (vince Yong)'; dir = yongSotto?'SHORT':'LONG'; }
    else if (CTRL[tiEl]===trEl) { caso='Ti CONTROLLA trasf (vince Ti)';   dir = yongSotto?'LONG':'SHORT'; }
    else if (GEN[trEl]===tiEl)  { caso='trasf GENERA Ti'; }
    else if (GEN[tiEl]===trEl)  { caso='Ti GENERA trasf'; }
    else                        { caso='stesso elemento'; }
    (gruppi[caso]=gruppi[caso]||[]).push({r, dir});
  }
  const rec=s=>s.filter(x=>x.r.date>='2023-05-01'), vec=s=>s.filter(x=>x.r.date<'2023-05-01');
  const hit=s=>{const c=s.filter(x=>x.dir===(x.r.move>0?'LONG':'SHORT')).length; return s.length?(100*c/s.length):null;};
  console.log('\n=== PB ALTO/BASSO col Yong trasformato ===  (universo '+base.length+')');
  for (const caso in gruppi) {
    const g=gruppi[caso];
    if (g[0].dir!==undefined && g[0].dir!==null) {
      const h=hit(g), hr=hit(rec(g)), hv=hit(vec(g));
      const n=g.length, z=((h/100)-0.5)/Math.sqrt(0.25/n);
      console.log(caso.padEnd(34)+'n '+String(n).padStart(4)+'   azzecca '+h.toFixed(1)+'%   rec '+(hr!==null?hr.toFixed(1)+'%':'-')+'   vec '+(hv!==null?hv.toFixed(1)+'%':'-')+'   z '+z.toFixed(2));
    } else {
      console.log(caso.padEnd(34)+'n '+String(g.length).padStart(4)+'   (nessuna direzione definita)');
    }
  }
}

if (process.env.LYBRODIR) {
  // BROTHER-DIREZIONALE (proposta Edu, 12/08/2026):
  // Brother = perdita -> la posizione INVERTE:
  //   B allo Shi nel trigramma SUPERIORE (L4-6) -> il cross va SHORT
  //   B allo Shi nel trigramma INFERIORE (L1-3) -> il cross va LONG
  // Parente dal ramo GREZZO dello Shi (niente trasformazione da combinazione).
  const base = rows.filter(r=>{const L=r.liu; return L && r.finale!==null && WX[L.shiB]===L.palEl;});
  const dirRegola = r => r.liu.shi>=4 ? 'SHORT' : 'LONG';
  const dirMercato = r => r.move>0 ? 'LONG' : 'SHORT';
  const rec=s=>s.filter(r=>r.date>='2023-05-01'), vec=s=>s.filter(r=>r.date<'2023-05-01');
  const hit=s=>{if(!s.length)return null; return 100*s.filter(r=>dirRegola(r)===dirMercato(r)).length/s.length;};
  const riga=(nome,sel)=>{const h=hit(sel);if(h===null){console.log(nome.padEnd(36)+'n 0');return;}
    const z=((h/100)-0.5)/Math.sqrt(0.25/sel.length);
    console.log(nome.padEnd(36)+'n '+String(sel.length).padStart(4)+'   azzecca '+h.toFixed(1)+'%   rec '+
      (hit(rec(sel))!==null?hit(rec(sel)).toFixed(1)+'%':'-')+'   vec '+(hit(vec(sel))!==null?hit(vec(sel)).toFixed(1)+'%':'-')+'   z '+z.toFixed(2));};
  console.log('\n=== BROTHER-DIREZIONALE (sup=SHORT, inf=LONG) ===');
  riga('tutte (Shi=Brother, ramo grezzo):', base);
  riga('  solo Shi in ALTO (→SHORT):', base.filter(r=>r.liu.shi>=4));
  riga('  solo Shi in BASSO (→LONG):', base.filter(r=>r.liu.shi<=3));
  // modulazione salute come per l Officer (informativa): Shi debole -> direzione ribaltata
  const dirMod = r => { const d=dirRegola(r); if(r.liu.shiForte) return d; return d==='LONG'?'SHORT':'LONG'; };
  const hitM=s=>{if(!s.length)return null; return 100*s.filter(r=>dirMod(r)===dirMercato(r)).length/s.length;};
  const hM=hitM(base), zM=((hM/100)-0.5)/Math.sqrt(0.25/base.length);
  console.log('variante modulata dalla forza (info): azzecca '+hM.toFixed(1)+'%   rec '+hitM(rec(base)).toFixed(1)+'%   vec '+hitM(vec(base)).toFixed(1)+'%   z '+zM.toFixed(2));
  // e come conferma del PB
  const pbSig = r => r.emaDir==='up' ? (r.finale?'LONG':'SHORT') : (r.finale?'SHORT':'LONG');
  const conc = base.filter(r=>dirRegola(r)===pbSig(r)), disc = base.filter(r=>dirRegola(r)!==pbSig(r));
  const wr=s=>{const g=s.filter(r=>r.pnl>0).length,p=s.filter(r=>r.pnl<0).length;return (g+p)?(100*g/(g+p)):null;};
  console.log('\ncome conferma del PB:');
  console.log('  B-dir CONCORDA col PB:  n '+conc.length+'   PB win '+wr(conc).toFixed(1)+'%   (rec '+wr(rec(conc)).toFixed(1)+'% / vec '+wr(vec(conc)).toFixed(1)+'%)');
  console.log('  B-dir DISCORDA col PB:  n '+disc.length+'   PB win '+wr(disc).toFixed(1)+'%   (rec '+wr(rec(disc)).toFixed(1)+'% / vec '+wr(vec(disc)).toFixed(1)+'%)');
}

if (process.env.LYBROFAIL) {
  // carte con Shi=Brother (ramo grezzo) SOSTENUTO (Ying valido e forte che genera lo Shi,
  // o mutante favorevole) dove la regola direzionale (sup=SHORT, inf=LONG) SBAGLIA.
  const sostYing = r => r.liu.yingEff && GEN[WX[r.liu.yingB]]===WX[r.liu.shiB] && r.liu.yingForte;
  const sostMut  = r => r.liu.effEl!=null && (GEN[r.liu.effEl]===WX[r.liu.shiB] || r.liu.effEl===WX[r.liu.shiB]);
  const base = rows.filter(r=>{const L=r.liu; return L && r.finale!==null && WX[L.shiB]===L.palEl &&
    L.shiEff && (sostYing(r)||sostMut(r));});
  const dirRegola = r => r.liu.shi>=4 ? 'SHORT' : 'LONG';
  const dirMercato = r => r.move>0 ? 'LONG' : 'SHORT';
  const ok = base.filter(r=>dirRegola(r)===dirMercato(r));
  console.log('\n=== B-direzionale SOSTENUTO ===');
  console.log('carte: '+base.length+'   regola azzecca: '+ok.length+' = '+(100*ok.length/base.length).toFixed(1)+'%');
  const sel = base.filter(r=>dirRegola(r)!==dirMercato(r)).sort((a,b)=>Math.abs(b.move)-Math.abs(a.move));
  console.log('sbaglia in '+sel.length+' carte, peggiori:\n');
  sel.slice(0,6).forEach(r=>{const L=r.liu;
    console.log('  '+r.date.split('-').reverse().join('/')+' '+r.cross.padEnd(7)+
      ' Shi L'+L.shi+' '+L.shiB+'  '+(sostYing(r)?'[Ying genera]':'')+(sostMut(r)?'[mut fav]':'')+
      '  regola '+dirRegola(r)+'  mercato '+dirMercato(r)+' '+(r.move>0?'+':'')+r.move.toFixed(0)+'pip');});
}

if (process.env.LYCLASHW) {
  // CLASH CHE ECCITA IL WEALTH (Edu, 12/08/2026, da USDJPY 13/09/2022):
  // la linea mobile (movimento efficace) parte e il suo ramo di PARTENZA clasha una
  // linea dell'esagramma. Se la linea clashata e' WEALTH (ramo grezzo) e IN STAGIONE
  // (elemento == elemento del mese), il clash la ECCITA (衝旺則發):
  // posizione della linea eccitata -> direzione: superiore LONG, inferiore SHORT.
  const NJI = {1:['子','寅','辰'],2:['巳','卯','丑'],3:['卯','丑','亥'],4:['子','寅','辰'],
               5:['丑','亥','酉'],6:['寅','辰','午'],7:['辰','午','申'],8:['未','巳','卯']};
  const NJO = {1:['午','申','戌'],2:['亥','酉','未'],3:['酉','未','巳'],4:['午','申','戌'],
               5:['未','巳','卯'],6:['申','戌','子'],7:['戌','子','寅'],8:['丑','亥','酉']};
  const KL = {子:'午',午:'子',丑:'未',未:'丑',寅:'申',申:'寅',卯:'酉',酉:'卯',辰:'戌',戌:'辰',巳:'亥',亥:'巳'};
  const ramoDi = (r,p) => p<=3 ? NJI[r.inf][p-1] : NJO[r.sup][p-4];
  const analizza = r => {
    const L=r.liu; if(!L || r.finale===null || L.effEl===null) return null;
    const dep = ramoDi(r, r.linea);
    const bersaglio = KL[dep];
    for(let p=1;p<=6;p++){ if(p===r.linea) continue;
      if(ramoDi(r,p)===bersaglio){
        const el = WX[bersaglio];
        const isW = CTRL[L.palEl]===el;
        const inStag = el===WX[r.monthBranchUsed];
        if(isW && inStag) return {pos:p, dir: p>=4?'LONG':'SHORT', taisui: dep===r.yearBranchUsed};
      }}
    return null; };
  const casi = [];
  for(const r of rows){ const a=analizza(r); if(a) casi.push({r, ...a}); }
  const dirM = r => r.move>0?'LONG':'SHORT';
  const rec=s=>s.filter(x=>x.r.date>='2023-05-01'), vec=s=>s.filter(x=>x.r.date<'2023-05-01');
  const riga=(nome,s)=>{ if(!s.length){console.log(nome.padEnd(40)+'n 0');return;}
    const h=100*s.filter(x=>x.dir===dirM(x.r)).length/s.length;
    const hr=rec(s).length?100*rec(s).filter(x=>x.dir===dirM(x.r)).length/rec(s).length:null;
    const hv=vec(s).length?100*vec(s).filter(x=>x.dir===dirM(x.r)).length/vec(s).length:null;
    const z=((h/100)-0.5)/Math.sqrt(0.25/s.length);
    console.log(nome.padEnd(40)+'n '+String(s.length).padStart(4)+'   azzecca '+h.toFixed(1)+'%   rec '+
      (hr!==null?hr.toFixed(1)+'%':'-')+'   vec '+(hv!==null?hv.toFixed(1)+'%':'-')+'   z '+z.toFixed(2)); };
  console.log('\n=== CLASH DELLA MOBILE CHE ECCITA IL WEALTH IN STAGIONE ===');
  riga('tutte (qualunque mobile):', casi);
  riga('  solo Tai Sui (partenza = anno):', casi.filter(x=>x.taisui));
  riga('  non Tai Sui:', casi.filter(x=>!x.taisui));
  // utilita' sul PB: quante carte PB-perdenti raddrizza?
  const pbSig = r => r.emaDir==='up' ? (r.finale?'LONG':'SHORT') : (r.finale?'SHORT':'LONG');
  const perde = casi.filter(x=>x.r.pnl<0);
  const radd = perde.filter(x=>x.dir===dirM(x.r));
  const vince = casi.filter(x=>x.r.pnl>0);
  const rompe = vince.filter(x=>x.dir!==dirM(x.r));
  console.log('PB perde in '+perde.length+' → il segnale raddrizza '+radd.length+'   |   PB vince in '+vince.length+' → il segnale ne romperebbe '+rompe.length);
}

if (process.env.LYCLASHWROMPE) {
  const NJI = {1:['子','寅','辰'],2:['巳','卯','丑'],3:['卯','丑','亥'],4:['子','寅','辰'],
               5:['丑','亥','酉'],6:['寅','辰','午'],7:['辰','午','申'],8:['未','巳','卯']};
  const NJO = {1:['午','申','戌'],2:['亥','酉','未'],3:['酉','未','巳'],4:['午','申','戌'],
               5:['未','巳','卯'],6:['申','戌','子'],7:['戌','子','寅'],8:['丑','亥','酉']};
  const KL = {子:'午',午:'子',丑:'未',未:'丑',寅:'申',申:'寅',卯:'酉',酉:'卯',辰:'戌',戌:'辰',巳:'亥',亥:'巳'};
  const ramoDi = (r,p) => p<=3 ? NJI[r.inf][p-1] : NJO[r.sup][p-4];
  const analizza = r => { const L=r.liu; if(!L || r.finale===null || L.effEl===null) return null;
    const dep = ramoDi(r, r.linea); const bersaglio = KL[dep];
    for(let p=1;p<=6;p++){ if(p===r.linea) continue;
      if(ramoDi(r,p)===bersaglio){ const el = WX[bersaglio];
        if(CTRL[L.palEl]===el && el===WX[r.monthBranchUsed]) return {pos:p, dir: p>=4?'LONG':'SHORT'}; }}
    return null; };
  const dirM = r => r.move>0?'LONG':'SHORT';
  console.log('\n=== carte dove il PB VINCE ma il clash-eccita direbbe il contrario ===');
  for(const r of rows){ const a=analizza(r); if(!a) continue;
    if(r.pnl>0 && a.dir!==dirM(r))
      console.log('  '+r.date.split('-').reverse().join('/')+' '+r.cross.padEnd(7)+
        '  Wealth eccitato L'+a.pos+' → segnale '+a.dir+'   mercato '+dirM(r)+' '+(r.move>0?'+':'')+r.move.toFixed(0)+'pip   PB pnl +'+r.pnl.toFixed(0)); }
}

if (process.env.LYGLENS) {
  // rilettura delle carte "rotte" con la lente: il G parla per primo.
  const target = [
    ['EURUSD','2024-08-06'],['EURUSD','2025-01-10'],['USDCHF','2024-01-11'],
    ['USDCHF','2026-01-29'],['AUDUSD','2022-11-21'],['USDCAD','2021-07-13'],
    ['USDCAD','2021-11-03'],['USDCAD','2026-03-23']];
  const NJI = {1:['子','寅','辰'],2:['巳','卯','丑'],3:['卯','丑','亥'],4:['子','寅','辰'],
               5:['丑','亥','酉'],6:['寅','辰','午'],7:['辰','午','申'],8:['未','巳','卯']};
  const NJO = {1:['午','申','戌'],2:['亥','酉','未'],3:['酉','未','巳'],4:['午','申','戌'],
               5:['未','巳','卯'],6:['申','戌','子'],7:['戌','子','寅'],8:['丑','亥','酉']};
  const KL = {子:'午',午:'子',丑:'未',未:'丑',寅:'申',申:'寅',卯:'酉',酉:'卯',辰:'戌',戌:'辰',巳:'亥',亥:'巳'};
  const CO = {子:'丑',丑:'子',寅:'亥',亥:'寅',卯:'戌',戌:'卯',辰:'酉',酉:'辰',巳:'申',申:'巳',午:'未',未:'午'};
  const ramoDi = (r,p) => p<=3 ? NJI[r.inf][p-1] : NJO[r.sup][p-4];
  for (const [cx,dt] of target) {
    const r = rows.find(x=>x.cross===cx && x.date===dt); if(!r||!r.liu) continue;
    const L=r.liu;
    const parDi = b => { const e=WX[b]; return e===L.palEl?'B':GEN[L.palEl]===e?'C':CTRL[L.palEl]===e?'W':CTRL[e]===L.palEl?'G':'P'; };
    const mEl=WX[r.monthBranchUsed], dB=r.dayBranchUsed;
    console.log('\n### '+cx+' '+dt+'   mercato '+(r.move>0?'LONG +':'SHORT ')+r.move.toFixed(0)+'pip   PB pnl +'+r.pnl.toFixed(0));
    console.log('mese '+r.monthBranchUsed+'('+mEl+')  giorno '+dB+'  anno '+r.yearBranchUsed+'  vuoti '+L.__v||'');
    let out='';
    for(let p=6;p>=1;p--){ const b=ramoDi(r,p); const tag=[];
      if(p===L.shi)tag.push('Shi'); if(p===L.ying)tag.push('Ying'); if(p===r.linea)tag.push('MOBILE');
      if(r.vuoti&&r.vuoti.indexOf(b)>=0)tag.push('VUOTO');
      out+='  L'+p+': '+parDi(b)+' '+b+'('+WX[b]+')'+(tag.length?' ['+tag.join(',')+']':'')+'\n'; }
    console.log(out.trimEnd());
    // fushen G?
    if (L.fushen) for(const p in L.fushen){ if(L.fushen[p].par==='G') console.log('  G NASCOSTO sotto L'+p+': '+L.fushen[p].b); }
    // salute dei G presenti
    for(let p=1;p<=6;p++){ const b=ramoDi(r,p); if(parDi(b)!=='G') continue;
      const note=[];
      if(WX[b]===mEl) note.push('in stagione');
      if(KL[dB]===b) note.push('CLASHATO dal giorno');
      if(CO[dB]===b) note.push('combinato dal giorno');
      if(dB===b) note.push('=giorno');
      if(L.effEl!=null && GEN[L.effEl]===WX[b]) note.push('nutrito dalla mobile');
      if(L.effEl!=null && CTRL[L.effEl]===WX[b]) note.push('colpito dalla mobile');
      if(GEN[WX[ramoDi(r,L.shi)]]===WX[b]) note.push('nutrito dallo Shi');
      if(r.vuoti&&r.vuoti.indexOf(b)>=0) note.push('VUOTO');
      console.log('  → G a L'+p+' ('+b+'): '+(note.length?note.join(', '):'nessun fattore')); }
  }
}

if (process.env.LYGLENS2) {
  // stessa lente G-centrica, ma sulle carte della cella clash-eccita dove il PB PERDE
  const NJI = {1:['子','寅','辰'],2:['巳','卯','丑'],3:['卯','丑','亥'],4:['子','寅','辰'],
               5:['丑','亥','酉'],6:['寅','辰','午'],7:['辰','午','申'],8:['未','巳','卯']};
  const NJO = {1:['午','申','戌'],2:['亥','酉','未'],3:['酉','未','巳'],4:['午','申','戌'],
               5:['未','巳','卯'],6:['申','戌','子'],7:['戌','子','寅'],8:['丑','亥','酉']};
  const KL = {子:'午',午:'子',丑:'未',未:'丑',寅:'申',申:'寅',卯:'酉',酉:'卯',辰:'戌',戌:'辰',巳:'亥',亥:'巳'};
  const CO = {子:'丑',丑:'子',寅:'亥',亥:'寅',卯:'戌',戌:'卯',辰:'酉',酉:'辰',巳:'申',申:'巳',午:'未',未:'午'};
  const ramoDi = (r,p) => p<=3 ? NJI[r.inf][p-1] : NJO[r.sup][p-4];
  const analizza = r => { const L=r.liu; if(!L || r.finale===null || L.effEl===null) return null;
    const dep = ramoDi(r, r.linea); const bers = KL[dep];
    for(let p=1;p<=6;p++){ if(p===r.linea) continue;
      if(ramoDi(r,p)===bers){ const el=WX[bers];
        if(CTRL[L.palEl]===el && el===WX[r.monthBranchUsed]) return true; }}
    return null; };
  for (const r of rows) { if(!analizza(r) || r.pnl>=0) continue;
    const L=r.liu;
    const parDi = b => { const e=WX[b]; return e===L.palEl?'B':GEN[L.palEl]===e?'C':CTRL[L.palEl]===e?'W':CTRL[e]===L.palEl?'G':'P'; };
    const mEl=WX[r.monthBranchUsed], dB=r.dayBranchUsed;
    console.log('\n### '+r.cross+' '+r.date+'   mercato '+(r.move>0?'LONG +':'SHORT ')+r.move.toFixed(0)+'pip   PB pnl '+r.pnl.toFixed(0));
    console.log('mese '+r.monthBranchUsed+'('+mEl+')  giorno '+dB+'  anno '+r.yearBranchUsed);
    let out='';
    for(let p=6;p>=1;p--){ const b=ramoDi(r,p); const tag=[];
      if(p===L.shi)tag.push('Shi'); if(p===L.ying)tag.push('Ying'); if(p===r.linea)tag.push('MOBILE');
      if(r.vuoti&&r.vuoti.indexOf(b)>=0)tag.push('VUOTO');
      out+='  L'+p+': '+parDi(b)+' '+b+'('+WX[b]+')'+(tag.length?' ['+tag.join(',')+']':'')+'\n'; }
    console.log(out.trimEnd());
    if (L.fushen) for(const p in L.fushen){ if(L.fushen[p].par==='G') console.log('  G NASCOSTO sotto L'+p+': '+L.fushen[p].b); }
    for(let p=1;p<=6;p++){ const b=ramoDi(r,p); if(parDi(b)!=='G') continue;
      const note=[];
      if(WX[b]===mEl) note.push('in stagione'); if(GEN[mEl]===WX[b]) note.push('nutrito dal mese');
      if(KL[dB]===b) note.push('CLASHATO dal giorno'); if(CO[dB]===b) note.push('combinato dal giorno');
      if(dB===b) note.push('=giorno'); if(b===r.yearBranchUsed) note.push('TAI SUI');
      if(L.effEl!=null && GEN[L.effEl]===WX[b]) note.push('nutrito dalla mobile');
      if(L.effEl!=null && CTRL[L.effEl]===WX[b]) note.push('colpito dalla mobile');
      if(GEN[WX[ramoDi(r,L.shi)]]===WX[b]) note.push('nutrito dallo Shi');
      if(r.vuoti&&r.vuoti.indexOf(b)>=0) note.push('VUOTO');
      console.log('  → G a L'+p+' ('+b+'): '+(note.length?note.join(', '):'niente')); }
  }
}

if (process.env.LYBLOCCO) {
  // censimento auto-combinazione: quante carte, e quali dentro la cella clash-eccita
  const tutte = rows.filter(r=>r.liu && r.liu.casoMut===-3);
  console.log('\ncarte con trigramma bloccato da auto-combinazione: '+tutte.length+' su '+rows.length);
  const e = rows.find(r=>r.cross==='EURUSD' && r.date==='2023-04-20');
  if(e&&e.liu) console.log('EURUSD 20/04/2023: casoMut '+e.liu.casoMut+'  trigramma bloccato: '+(e.liu.trigBloccato||'no'));
  // le altre 22 carte della cella hanno auto-combinazione? (controllo di non rompere le letture buone)
  const cella=[['EURUSD','2024-08-06'],['EURUSD','2025-01-10'],['EURUSD','2025-01-20'],['USDCHF','2024-01-11'],
   ['USDCHF','2026-01-29'],['AUDUSD','2022-11-21'],['USDCAD','2021-07-13'],['USDCAD','2021-11-03'],['USDCAD','2026-03-23'],
   ['EURUSD','2024-01-09'],['EURUSD','2024-10-14'],['USDJPY','2021-04-12'],['USDJPY','2022-09-13'],['AUDUSD','2022-03-08'],
   ['AUDUSD','2023-11-28'],['AUDUSD','2025-12-23'],['USDCAD','2025-11-03'],['NZDUSD','2024-04-09'],['NZDUSD','2026-01-29'],
   ['EURJPY','2023-03-13'],['EURGBP','2024-01-18'],['EURGBP','2026-07-23']];
  let toccate=0;
  for(const [cx,dt] of cella){ const r=rows.find(x=>x.cross===cx&&x.date===dt);
    if(r&&r.liu&&r.liu.casoMut===-3){ console.log('  cella toccata: '+cx+' '+dt); toccate++; } }
  console.log('altre carte della cella toccate dalla nuova regola: '+toccate);
}

if (process.env.BREAKDOWN) {
  // Scomposizione della resa del baseline per PARENTE (六親), sia della linea MOBILE
  // sia dello SHI (世). Il parente si ricava dall'elemento rispetto all'elemento del palazzo.
  //   B 兄弟 Fratelli · C 子孫 Figli · W 妻財 Ricchezza · G 官鬼 Ufficiale · P 父母 Genitori
  const parenteDi = (el, palEl) =>
      el === palEl ? 'B' : GEN[palEl] === el ? 'C' : CTRL[palEl] === el ? 'W'
    : CTRL[el] === palEl ? 'G' : 'P';
  const NOME = { B:'B 兄弟 Fratelli', C:'C 子孫 Figli', W:'W 妻財 Ricchezza',
                 G:'G 官鬼 Ufficiale', P:'P 父母 Genitori' };
  const periodi = {
    'TUTTO 2020→oggi': r => true,
    'RECENTE 2023-05→oggi': r => r.date >= '2023-05-01',
    'VECCHIO 2020→2022':    r => r.date <= '2022-12-31'
  };
  const withLiu = rows.filter(r => r.liu && r.liu.palEl);
  for (const asse of ['mobile','shi']) {
    console.log('\n############ PARENTE DELLA ' + asse.toUpperCase() +
                ' — resa del baseline (segue/non-segue il trend) ############');
    for (const [nomePer, filt] of Object.entries(periodi)) {
      const base = withLiu.filter(filt);
      console.log('\n--- ' + nomePer + ' (n=' + base.length + ') ---');
      console.log('parente'.padEnd(20) + 'n'.padStart(6) + 'win%'.padStart(8) +
                  'edge'.padStart(9) + 'z'.padStart(8) + 'pip'.padStart(10) + 'pip/trade'.padStart(11));
      for (const k of ['G','W','B','C','P']) {
        const sel = base.filter(r => {
          const el = asse === 'mobile' ? r.liu.mutEl : r.liu.shiEl;
          return parenteDi(el, r.liu.palEl) === k;
        });
        const s = stat(sel, 'pnl');
        if (!s) { console.log(NOME[k].padEnd(20) + '     0'); continue; }
        console.log(NOME[k].padEnd(20) + String(s.n).padStart(6) +
          (100*s.act).toFixed(2).padStart(8) + (100*(s.act-s.exp)).toFixed(2).padStart(8) + 'p' +
          s.z.toFixed(2).padStart(7) + s.pips.toFixed(0).padStart(10) + s.ppt.toFixed(2).padStart(11));
      }
    }
  }
}

if (process.env.LYFALLE) {
  // Dove il LY (verdetto autonomo Ying->Shi, mappa PB) CONTRADDICE il PB: chi ha ragione?
  // Ristretto alle carte in cui il parente in gioco (Ying o Shi) e' G, W o B.
  const GENx = GEN, CTRLx = CTRL;
  const parenteDi = (el, palEl) =>
      el === palEl ? 'B' : GENx[palEl] === el ? 'C' : CTRLx[palEl] === el ? 'W'
    : CTRLx[el] === palEl ? 'G' : 'P';
  const verdLY = (ti, yo) => yo===ti ? null
    : GENx[yo]===ti ? true : CTRLx[ti]===yo ? true
    : GENx[ti]===yo ? false : false;
  const sel = rows.filter(r => r.liu && r.liu.palEl);
  let contrasti = 0, lyVince = 0, pbVince = 0;
  const falle = [];
  for (const r of sel) {
    const ly = verdLY(r.liu.shiEl, r.liu.yingEl);
    if (ly === null) continue;                       // 比和 = LY non si pronuncia
    const parY = parenteDi(r.liu.yingEl, r.liu.palEl);
    const parS = parenteDi(r.liu.shiEl,  r.liu.palEl);
    if (!['G','W','B'].includes(parY) && !['G','W','B'].includes(parS)) continue;
    if (ly === r.finale) continue;                   // nessun contrasto
    contrasti++;
    // esito reale: pnl del PB (r.pnl) e pnl che avrebbe avuto il LY (verdetto opposto)
    const pnlPB = r.pnl, pnlLY = -r.pnl;
    if (pnlLY > 0) lyVince++; else if (pnlPB > 0) pbVince++;
    if (pnlPB > 0 && pnlLY < 0) falle.push({ ...r, parY, parS, pnlPB, pnlLY, ly });
  }
  console.log('\n=== CONTRASTI PB vs LY (solo carte con G/W/B in gioco) ===');
  console.log('contrasti totali: ' + contrasti);
  console.log('  ha ragione il LY: ' + lyVince + '   (' + (100*lyVince/contrasti).toFixed(2) + '%)');
  console.log('  ha ragione il PB: ' + pbVince + '   (' + (100*pbVince/contrasti).toFixed(2) + '%)');
  const pipLY = sel.filter(r=>{const ly=verdLY(r.liu.shiEl,r.liu.yingEl); if(ly===null) return false;
    const pY=parenteDi(r.liu.yingEl,r.liu.palEl), pS=parenteDi(r.liu.shiEl,r.liu.palEl);
    return (['G','W','B'].includes(pY)||['G','W','B'].includes(pS)) && ly!==r.finale;})
    .reduce((s,r)=>s+(-r.pnl),0);
  console.log('  seguendo il LY nei contrasti: ' + pipLY.toFixed(0) + ' pip');
  console.log('  seguendo il PB nei contrasti: ' + (-pipLY).toFixed(0) + ' pip');
  // le falle piu' grosse: dove il LY sbaglia e il PB ha ragione
  falle.sort((a,b)=>a.pnlLY-b.pnlLY);
  console.log('\n=== CARTE DOVE IL LY FALLISCE E IL PB HA RAGIONE (peggiori 12) ===');
  for (const f of falle.slice(0,12)) {
    const sigPB = f.emaDir==='up' ? (f.finale?'LONG':'SHORT') : (f.finale?'SHORT':'LONG');
    const sigLY = sigPB==='LONG'?'SHORT':'LONG';
    console.log(f.cross.padEnd(7) + f.date +
      '  trend ' + (f.emaDir==='up'?'LONG ':'SHORT') +
      '  PB ' + sigPB.padEnd(5) + (f.finale?' (segue)    ':' (non segue)') +
      '  LY ' + sigLY.padEnd(5) +
      '  mercato ' + (f.move>0?'SALE ':'SCENDE') +
      '  PB ' + f.pnlPB.toFixed(0).padStart(5) + ' pip · LY ' + f.pnlLY.toFixed(0).padStart(5) + ' pip' +
      '   [Shi=' + f.parS + ' Ying=' + f.parY + ']');
  }
}

if (process.env.LYRIPIEGO) {
  // RIPIEGO SULLA MOBILE (Edu, 13/08/2026 — da EURJPY 15/03/2023)
  // Clash effettivo: dal GIORNO sempre; dall'ANNO se il ramo dell'anno e' 旺/相;
  // dal MESE non da solo, ma potenzia gli altri due. Combinazione dal GIORNO = bloccante.
  // Se ne' Shi ne' Ying sopravvivono, la lettura ripiega sul movimento della mobile:
  // l'elemento agente della mobile GENERA una linea; la posizione di quella linea da'
  // la direzione (trigramma inferiore L1-3 = SHORT, superiore L4-6 = LONG).
  const LYM = require('./liuyao.js');
  let nRip = 0, ambigue = 0, nette = 0, lyW = 0, lyL = 0, pbW = 0, pbL = 0, pipLY = 0, pipPB = 0;
  const esempi = [];
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error || !R.ripiegoMobile) continue;
    nRip++;
    const eff = R.mutante.effEl;
    if (!eff) { ambigue++; continue; }            // movimento nullo: la mobile non parla
    // linee generate dall'elemento agente della mobile (esclusa la mobile stessa)
    const gen = R.linee.filter(l => l.pos !== R.mutante.pos && GEN[eff] === l.el);
    if (!gen.length) { ambigue++; continue; }
    const basse = gen.filter(l => l.pos <= 3).length, alte = gen.filter(l => l.pos > 3).length;
    if (basse > 0 && alte > 0) { ambigue++; continue; }   // lettura non netta
    nette++;
    const dirLY = basse > 0 ? 'SHORT' : 'LONG';
    const pnlLY = dirLY === 'LONG' ? r.move : -r.move;
    if (pnlLY > 0) lyW++; else if (pnlLY < 0) lyL++;
    if (r.pnl > 0) pbW++; else if (r.pnl < 0) pbL++;
    pipLY += pnlLY; pipPB += r.pnl;
    if (esempi.length < 10) esempi.push({ cross:r.cross, date:r.date, dirLY, pnlLY, pnlPB:r.pnl });
  }
  const pct = (w,l) => (w+l) ? (100*w/(w+l)).toFixed(2)+'%' : '—';
  console.log('\n=== RIPIEGO SULLA MOBILE — Shi e Ying entrambi non effettivi ===');
  console.log('carte totali del baseline: ' + rows.length);
  console.log('carte in ripiego: ' + nRip + '  (' + (100*nRip/rows.length).toFixed(1) + '%)');
  console.log('  di cui lettura NON netta (mobile muta o generazione ambigua): ' + ambigue);
  console.log('  di cui lettura netta: ' + nette);
  console.log('\nsulle carte a lettura netta:');
  console.log('  LIU YAO (mobile):  ' + pct(lyW,lyL) + '   ' + pipLY.toFixed(0) + ' pip');
  console.log('  PLUM BLOSSOM:      ' + pct(pbW,pbL) + '   ' + pipPB.toFixed(0) + ' pip');
  // stesso conto sui due periodi, per la regola dei due periodi
  for (const [nome, filt] of [['RECENTE 2023-05→oggi', r=>r.date>='2023-05-01'],
                              ['VECCHIO 2020→2022',    r=>r.date<='2022-12-31']]) {
    let w=0,l=0,pw=0,pl=0,pi=0,pp=0;
    for (const r of rows.filter(filt)) {
      const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                               r.yearBranchUsed, r.dayStemUsed);
      if (R.error || !R.ripiegoMobile) continue;
      const eff = R.mutante.effEl; if (!eff) continue;
      const gen = R.linee.filter(x => x.pos !== R.mutante.pos && GEN[eff] === x.el);
      if (!gen.length) continue;
      const basse = gen.filter(x=>x.pos<=3).length, alte = gen.filter(x=>x.pos>3).length;
      if (basse>0 && alte>0) continue;
      const pnlLY = (basse>0?'SHORT':'LONG')==='LONG' ? r.move : -r.move;
      if (pnlLY>0) w++; else if (pnlLY<0) l++;
      if (r.pnl>0) pw++; else if (r.pnl<0) pl++;
      pi+=pnlLY; pp+=r.pnl;
    }
    console.log('\n--- ' + nome + ' (n=' + (w+l) + ') ---');
    console.log('  LIU YAO (mobile):  ' + pct(w,l) + '   ' + pi.toFixed(0) + ' pip');
    console.log('  PLUM BLOSSOM:      ' + pct(pw,pl) + '   ' + pp.toFixed(0) + ' pip');
  }
  console.log('\nprime carte in ripiego a lettura netta:');
  esempi.forEach(e => console.log('  ' + e.cross.padEnd(7) + e.date + '  LY ' + e.dirLY.padEnd(5) +
    '  LY ' + e.pnlLY.toFixed(0).padStart(5) + ' pip · PB ' + e.pnlPB.toFixed(0).padStart(5) + ' pip'));
}

if (process.env.LYCONTRO) {
  // Le carte in ripiego dove la mobile sbaglia PIU' nettamente (e il PB ha ragione).
  const LYM = require('./liuyao.js');
  const casi = [];
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error || !R.ripiegoMobile) continue;
    const eff = R.mutante.effEl; if (!eff) continue;
    const gen = R.linee.filter(l => l.pos !== R.mutante.pos && GEN[eff] === l.el);
    if (!gen.length) continue;
    const basse = gen.filter(l=>l.pos<=3).length, alte = gen.filter(l=>l.pos>3).length;
    if (basse>0 && alte>0) continue;
    const dirLY = basse>0 ? 'SHORT' : 'LONG';
    const pnlLY = dirLY==='LONG' ? r.move : -r.move;
    if (pnlLY >= 0) continue;                       // tengo solo dove il LY sbaglia
    casi.push({ r, R, dirLY, pnlLY, gen: gen.map(g=>'L'+g.pos+' '+g.parCn+' '+g.ramo).join(' + ') });
  }
  casi.sort((a,b)=>a.pnlLY-b.pnlLY);
  console.log('\n=== CARTE IN RIPIEGO DOVE LA MOBILE SBAGLIA (peggiori 6) ===');
  for (const c of casi.slice(0,6)) {
    const r=c.r, R=c.R;
    console.log('\n'+r.cross+'  '+r.date+
      '   trend EMA '+(r.emaDir==='up'?'LONG':'SHORT')+
      '   mercato '+(r.move>0?'SALE':'SCENDE')+' ('+r.move.toFixed(0)+' pip)');
    console.log('   PB: '+(r.emaDir==='up'?(r.finale?'LONG':'SHORT'):(r.finale?'SHORT':'LONG'))+
      (r.finale?' (segue)':' (non segue)')+'  → '+r.pnl.toFixed(0)+' pip'+
      '     LY ripiego: '+c.dirLY+' → '+c.pnlLY.toFixed(0)+' pip');
    console.log('   giorno '+r.dayStemUsed+r.dayBranchUsed+' · mese '+r.monthBranchUsed+' · anno '+r.yearBranchUsed+
      '   palazzo '+R.palName+' ('+R.palElIt+')');
    console.log('   Shi L'+R.shi+' '+R.shiB+' ['+R.shiStato+']   Ying L'+R.ying+' '+R.yingB+' ['+R.yingStato+']');
    console.log('   mobile L'+R.mutante.pos+': '+R.mutante.ramoDep+' → '+R.mutante.ramoArr+
      ' ('+R.mutante.arrElIt+')  agente '+R.mutante.effEl+'  genera: '+c.gen);
  }
}

if (process.env.LYRIP2) {
  // RIPIEGO — forma corretta (Edu, 13/08/2026)
  // Se Shi e Ying sono entrambi fuori dai giochi, la lettura passa a:
  //   1) G 官鬼 Ufficiale   2) W 妻財 Ricchezza   3) la linea mobile
  // Fra i candidati si preferisce chi e' TIMELY (旺/相); una linea molto untimely e
  // non sostenuta dalla data ha poca efficacia e non regge la lettura.
  // Direzione — due varianti misurate in parallelo:
  //   A) posizione della linea che regge          (inferiore L1-3 = SHORT, superiore = LONG)
  //   B) posizione della linea che essa GENERA
  const LYM = require('./liuyao.js');
  const MESI = { Wood:['寅','卯'], Fire:['巳','午'], Earth:['丑','辰','未','戌'],
                 Metal:['申','酉'], Water:['亥','子'] };
  const stagLoc = (el, mEl) => el===mEl ? '旺' : GEN[mEl]===el ? '相'
      : GEN[el]===mEl ? '休' : CTRL[mEl]===el ? '死' : CTRL[el]===mEl ? '囚' : '休';
  const res = { A:{}, B:{} };
  for (const v of ['A','B']) for (const p of ['tutto','recente','vecchio'])
    res[v][p] = { w:0, l:0, pip:0, pbw:0, pbl:0, pbpip:0 };
  let nRip=0, nMuto=0, viaG=0, viaW=0, viaM=0;
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error || !R.ripiegoMobile) continue;
    nRip++;
    const mEl = WX[r.monthBranchUsed];
    const vivo = l => !['legata','rotta','dormiente','eliminata'].includes(l.stato);
    const timely = l => { const s = stagLoc(l.el, mEl); return s==='旺'||s==='相'; };
    // candidati in ordine G, W; dentro ogni gruppo prima i timely, poi i sostenuti dalla data
    const scegli = par => {
      const c = R.linee.filter(l => l.par===par && l.pos!==R.mutante.pos && vivo(l));
      return c.find(timely) || c.find(l=>l.forte) || null;
    };
    let linea = scegli('G'), via='G';
    if (!linea) { linea = scegli('W'); via='W'; }
    let dirA=null, dirB=null;
    if (linea) {
      dirA = linea.pos<=3 ? 'SHORT' : 'LONG';
      const gen = R.linee.filter(x => x.pos!==linea.pos && GEN[linea.el]===x.el);
      const b=gen.filter(x=>x.pos<=3).length, a=gen.filter(x=>x.pos>3).length;
      dirB = (b>0&&a>0)||(!b&&!a) ? null : (b>0?'SHORT':'LONG');
      if (via==='G') viaG++; else viaW++;
    } else {
      via='M';
      const eff = R.mutante.effEl;
      if (!eff) { nMuto++; continue; }
      dirA = R.mutante.pos<=3 ? 'SHORT' : 'LONG';
      const gen = R.linee.filter(x => x.pos!==R.mutante.pos && GEN[eff]===x.el);
      const b=gen.filter(x=>x.pos<=3).length, a=gen.filter(x=>x.pos>3).length;
      dirB = (b>0&&a>0)||(!b&&!a) ? null : (b>0?'SHORT':'LONG');
      viaM++;
    }
    const per = r.date>='2023-05-01' ? 'recente' : r.date<='2022-12-31' ? 'vecchio' : null;
    for (const [v,dir] of [['A',dirA],['B',dirB]]) {
      if (!dir) continue;
      const pnl = dir==='LONG' ? r.move : -r.move;
      for (const p of ['tutto', per].filter(Boolean)) {
        const o = res[v][p];
        if (pnl>0) o.w++; else if (pnl<0) o.l++;
        o.pip += pnl;
        if (r.pnl>0) o.pbw++; else if (r.pnl<0) o.pbl++;
        o.pbpip += r.pnl;
      }
    }
  }
  const pct=(w,l)=> (w+l)?(100*w/(w+l)).toFixed(2)+'%':'—';
  console.log('\n=== RIPIEGO G → W → mobile (con preferenza ai timely) ===');
  console.log('carte in ripiego: '+nRip+'   regge G: '+viaG+' · regge W: '+viaW+' · scende alla mobile: '+viaM+
              ' · mobile muta: '+nMuto);
  for (const v of ['A','B']) {
    console.log('\n--- direzione dalla '+(v==='A'?'POSIZIONE DELLA LINEA che regge':'linea che essa GENERA')+' ---');
    for (const p of ['tutto','recente','vecchio']) {
      const o=res[v][p];
      console.log('  '+p.padEnd(9)+' n='+String(o.w+o.l).padStart(4)+
        '   LY '+pct(o.w,o.l).padStart(7)+' '+o.pip.toFixed(0).padStart(7)+' pip'+
        '   PB '+pct(o.pbw,o.pbl).padStart(7)+' '+o.pbpip.toFixed(0).padStart(7)+' pip');
    }
  }
}

if (process.env.LYSEQ) {
  // Quale sequenza di ripiego regge meglio? Provo tutte le priorita' fra i cinque
  // parenti + la mobile, piu' alcuni criteri "di rilevanza" che non usano un ordine fisso.
  const LYM = require('./liuyao.js');
  const stagLoc = (el, mEl) => el===mEl ? '旺' : GEN[mEl]===el ? '相'
      : GEN[el]===mEl ? '休' : CTRL[mEl]===el ? '死' : CTRL[el]===mEl ? '囚' : '休';
  const ORD = { '旺':4, '相':3, '休':2, '囚':1, '死':0 };
  const casi = [];
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error || !R.ripiegoMobile) continue;
    const mEl = WX[r.monthBranchUsed];
    const vivo = l => !['legata','rotta','dormiente','eliminata'].includes(l.stato);
    const cand = R.linee.filter(l => vivo(l)).map(l => ({
      pos:l.pos, par:l.par, el:l.el, isMob:l.pos===R.mutante.pos,
      st: stagLoc(l.el, mEl), forza: ORD[stagLoc(l.el, mEl)] + (l.forte?1:0),
      isTai: l.isTaiSui, fu: !!l.fushen
    }));
    casi.push({ r, R, cand, mob: R.mutante });
  }
  const timely = c => c.st==='旺'||c.st==='相';
  // sceglie in base a una sequenza di parenti; 'M' = mobile
  const perSeq = (seq, cand, mob) => {
    for (const k of seq) {
      if (k === 'M') { if (mob.effEl != null) return { pos: mob.pos }; continue; }
      const g = cand.filter(c => c.par===k && !c.isMob);
      const s = g.find(timely) || g.find(c=>c.forza>=3) || null;
      if (s) return s;
    }
    return null;
  };
  const CRIT = {};
  // tutte le permutazioni di G,W,B,C,P troncate ai primi 3 + mobile in coda
  const PAR5 = ['G','W','B','C','P'];
  for (const a of PAR5) for (const b of PAR5) { if (b===a) continue;
    for (const c of PAR5) { if (c===a||c===b) continue;
      const seq=[a,b,c,'M']; CRIT[seq.join('→')] = (cd,mb)=>perSeq(seq,cd,mb); } }
  // criteri "di rilevanza" senza ordine fisso fra i parenti
  CRIT['[più forte in stagione]'] = (cd,mb) => {
    const c = cd.filter(x=>!x.isMob).sort((x,y)=>y.forza-x.forza)[0];
    return c && c.forza>=3 ? c : (mb.effEl!=null?{pos:mb.pos}:null); };
  CRIT['[solo timely, più basso]'] = (cd,mb) => {
    const c = cd.filter(x=>!x.isMob && timely(x)).sort((x,y)=>x.pos-y.pos)[0];
    return c || (mb.effEl!=null?{pos:mb.pos}:null); };
  CRIT['[Tai Sui se vivo, poi G]'] = (cd,mb) => {
    const t = cd.find(x=>x.isTai && !x.isMob && x.forza>=3);
    if (t) return t;
    return perSeq(['G','W','M'],cd,mb); };
  CRIT['[solo la mobile]'] = (cd,mb) => mb.effEl!=null ? {pos:mb.pos} : null;
  CRIT['[G,W,mobile] (attuale)'] = (cd,mb) => perSeq(['G','W','M'],cd,mb);

  const out = [];
  for (const [nome, fn] of Object.entries(CRIT)) {
    const acc = { tutto:{w:0,l:0,p:0}, recente:{w:0,l:0,p:0}, vecchio:{w:0,l:0,p:0} };
    for (const k of casi) {
      const s = fn(k.cand, k.mob);
      if (!s) continue;
      const dir = s.pos<=3 ? 'SHORT' : 'LONG';
      const pnl = dir==='LONG' ? k.r.move : -k.r.move;
      const per = k.r.date>='2023-05-01'?'recente':k.r.date<='2022-12-31'?'vecchio':null;
      for (const p of ['tutto', per].filter(Boolean)) {
        if (pnl>0) acc[p].w++; else if (pnl<0) acc[p].l++; acc[p].p += pnl; }
    }
    const pc = o => (o.w+o.l) ? 100*o.w/(o.w+o.l) : 0;
    out.push({ nome, n:acc.tutto.w+acc.tutto.l, tut:pc(acc.tutto), rec:pc(acc.recente),
               vec:pc(acc.vecchio), pip:acc.tutto.p,
               nrec:acc.recente.w+acc.recente.l, nvec:acc.vecchio.w+acc.vecchio.l });
  }
  out.sort((a,b)=>b.tut-a.tut);
  console.log('\n=== SEQUENZE DI RIPIEGO A CONFRONTO (PB su queste carte: ~57.9%) ===');
  console.log('sequenza'.padEnd(26)+'n'.padStart(5)+'tutto'.padStart(8)+'recente'.padStart(9)+
              'vecchio'.padStart(9)+'pip'.padStart(9)+'   entrambi>PB?');
  for (const o of out) {
    const ok = (o.rec>57.9 && o.vec>57.9) ? 'SÌ' : '';
    console.log(o.nome.padEnd(26)+String(o.n).padStart(5)+o.tut.toFixed(1).padStart(8)+
      o.rec.toFixed(1).padStart(9)+o.vec.toFixed(1).padStart(9)+o.pip.toFixed(0).padStart(9)+'   '+ok);
  }
}

if (process.env.LYFAIL2) {
  // Carte in ripiego dove la sequenza G→W→mobile sbaglia e il PB ha ragione.
  const LYM = require('./liuyao.js');
  const stagLoc = (el, mEl) => el===mEl ? '旺' : GEN[mEl]===el ? '相'
      : GEN[el]===mEl ? '休' : CTRL[mEl]===el ? '死' : CTRL[el]===mEl ? '囚' : '休';
  const casi = [];
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error || !R.ripiegoMobile) continue;
    const mEl = WX[r.monthBranchUsed];
    const vivo = l => !['legata','rotta','dormiente','eliminata'].includes(l.stato);
    const tm = l => { const s=stagLoc(l.el,mEl); return s==='旺'||s==='相'; };
    const scegli = par => { const g = R.linee.filter(l=>l.par===par && l.pos!==R.mutante.pos && vivo(l));
      return g.find(tm) || g.find(l=>l.forte) || null; };
    let s = scegli('G'), via='G';
    if (!s) { s = scegli('W'); via='W'; }
    if (!s) { if (R.mutante.effEl==null) continue; s = R.linee[R.mutante.pos-1]; via='mobile'; }
    const dir = s.pos<=3 ? 'SHORT' : 'LONG';
    const pnl = dir==='LONG' ? r.move : -r.move;
    if (pnl >= 0 || r.pnl <= 0) continue;        // solo dove il LY sbaglia E il PB ha ragione
    casi.push({ r, R, s, via, dir, pnl });
  }
  casi.sort((a,b)=>a.pnl-b.pnl);
  console.log('\n=== RIPIEGO: LA SEQUENZA SBAGLIA, IL PB HA RAGIONE (peggiori 5) ===');
  for (const c of casi.slice(0,5)) {
    const r=c.r, R=c.R;
    console.log('\n'+r.cross+'  '+r.date+'   seme '+parseInt(f3(0),10));
    console.log('   trend EMA '+(r.emaDir==='up'?'LONG':'SHORT')+
      '   PB '+(r.emaDir==='up'?(r.finale?'LONG':'SHORT'):(r.finale?'SHORT':'LONG'))+
      (r.finale?' (segue)':' (non segue)')+' → '+r.pnl.toFixed(0)+' pip'+
      '   |   LY regge su '+c.via+' L'+c.s.pos+' '+c.s.ramo+' → '+c.dir+' → '+c.pnl.toFixed(0)+' pip');
    console.log('   mercato '+(r.move>0?'SALE':'SCENDE')+' '+r.move.toFixed(0)+' pip'+
      '   giorno '+r.dayStemUsed+r.dayBranchUsed+' · mese '+r.monthBranchUsed+' · anno '+r.yearBranchUsed);
    console.log('   sup '+r.sup+' inf '+r.inf+' mutante L'+r.linea+'   palazzo '+R.palName+' ('+R.palElIt+')  vuoti '+R.vuoti.join(''));
    console.log('   Shi L'+R.shi+' '+R.shiB+' ['+R.shiStato+']   Ying L'+R.ying+' '+R.yingB+' ['+R.yingStato+']');
    for(let k=6;k>=1;k--){const x=R.linee[k-1];
      console.log('    L'+x.pos+' '+x.parCn+' '+x.ramo+' '+x.elIt+
        (x.isShi?' 世':'')+(x.isYing?' 應':'')+(x.isMobile?' ✸':'')+(x.vuoto?' 空':'')+
        (x.isTaiSui?' 太歲':'')+' ['+x.stato+']'+(x.pos===c.s.pos?'   ← REGGE':''));}
  }
}

if (process.env.IMMOB) {
  // PB — IL GIORNO IMMOBILIZZA IL YONG TRASFORMATO (Edu, 13/08/2026, da USDJPY 05/12/2022)
  // Il palazzo Houtian del Yong TRASFORMATO e' combinato (六合) dal ramo del GIORNO:
  // il trasformato e' legato, il Trend non puo' esercitare la relazione -> NON SEGUE.
  // Concorre con il Rafforzamento. Misuro: quante carte, chi ha ragione, e cosa succede
  // se la regola sostituisce o si aggiunge al Rafforzamento.
  const tocc = rows.filter(r => (HOUTIAN[r.usoTrasf]||[]).some(pz => COMBINA[pz] === r.dayBranchUsed));
  console.log('\n=== PB: giorno che immobilizza il palazzo del Yong trasformato ===');
  console.log('carte toccate: ' + tocc.length + ' su ' + rows.length);
  const per = { 'tutto': ()=>true, 'recente': r=>r.date>='2023-05-01', 'vecchio': r=>r.date<='2022-12-31' };
  // A) la regola come VERDETTO: su queste carte impone non segue. Quanto rende?
  console.log('\n--- se la regola impone NON SEGUE su queste carte ---');
  console.log('periodo'.padEnd(10)+'n'.padStart(5)+'  regola'.padStart(10)+'  pip'.padStart(9)+
              '   baseline attuale'.padStart(20)+'  pip'.padStart(9));
  for (const [nome, f] of Object.entries(per)) {
    const sel = tocc.filter(f); if (!sel.length) continue;
    let w=0,l=0,pip=0, bw=0,bl=0,bpip=0;
    for (const r of sel) {
      const sig = r.emaDir==='up' ? 'SHORT' : 'LONG';       // non segue
      const pn = sig==='LONG' ? r.move : -r.move;
      if (pn>0) w++; else if (pn<0) l++; pip+=pn;
      if (r.pnl>0) bw++; else if (r.pnl<0) bl++; bpip+=r.pnl;
    }
    const pc=(a,b)=> (a+b)?(100*a/(a+b)).toFixed(2)+'%':'—';
    console.log(nome.padEnd(10)+String(w+l).padStart(5)+pc(w,l).padStart(10)+pip.toFixed(0).padStart(9)+
                pc(bw,bl).padStart(20)+bpip.toFixed(0).padStart(9));
  }
  // B) dove diverge dal Rafforzamento: chi ha ragione
  const div = tocc.filter(r => !r.rafforzato && r.finale === true);   // la regola cambierebbe il verdetto
  console.log('\n--- carte dove la regola CAMBIA il verdetto (oggi segue, diventerebbe non segue) ---');
  for (const [nome, f] of Object.entries(per)) {
    const sel = div.filter(f); if (!sel.length) { console.log(nome.padEnd(10)+'   nessuna'); continue; }
    let w=0,l=0,pip=0;
    for (const r of sel) { const pn = -r.pnl; if (pn>0) w++; else if (pn<0) l++; pip+=pn; }
    const guad = pip - sel.reduce((s,r)=>s+r.pnl,0)*0;
    console.log(nome.padEnd(10)+'n='+String(sel.length).padStart(4)+
      '   la regola avrebbe reso '+pip.toFixed(0).padStart(7)+' pip'+
      '   contro '+sel.reduce((s,r)=>s+r.pnl,0).toFixed(0).padStart(7)+' pip di oggi'+
      '   (vince '+((w+l)?(100*w/(w+l)).toFixed(1):'—')+'%)');
  }
  // C) sovrapposizione col Rafforzamento
  const conRaff = tocc.filter(r=>r.rafforzato).length;
  console.log('\ndi cui gia\' toccate dal Rafforzamento: ' + conRaff + '   indipendenti: ' + (tocc.length-conRaff));
}

if (process.env.LYAUTO) {
  // RIPIEGO + AUTOPENALITA' 自刑 DAL GIORNO (Edu, 13/08/2026, da USDJPY 05/12/2022)
  // Fra due linee dello stesso parente candidate a reggere, quella col ramo UGUALE al
  // ramo del giorno (辰辰 午午 酉酉 亥亥) e' autopenalizzata ed esce.
  const LYM = require('./liuyao.js');
  const stagLoc = (el, mEl) => el===mEl ? '旺' : GEN[mEl]===el ? '相'
      : GEN[el]===mEl ? '休' : CTRL[mEl]===el ? '死' : CTRL[el]===mEl ? '囚' : '休';
  const AUTOP = ['辰','午','酉','亥'];   // i quattro rami di autopenalita'
  const run = (usaAuto) => {
    const acc = { tutto:{w:0,l:0,p:0}, recente:{w:0,l:0,p:0}, vecchio:{w:0,l:0,p:0} };
    let esclusi = 0, cambiate = 0;
    for (const r of rows) {
      const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                               r.yearBranchUsed, r.dayStemUsed);
      if (R.error || !R.ripiegoMobile) continue;
      const mEl = WX[r.monthBranchUsed];
      const vivo = l => !['legata','rotta','dormiente','eliminata'].includes(l.stato);
      const tm = l => { const s=stagLoc(l.el,mEl); return s==='旺'||s==='相'; };
      const autoPen = l => usaAuto && l.ramo === r.dayBranchUsed && AUTOP.includes(l.ramo);
      const scegli = par => {
        let g = R.linee.filter(l => l.par===par && l.pos!==R.mutante.pos && vivo(l));
        const g2 = g.filter(l => !autoPen(l));
        if (usaAuto && g2.length && g2.length < g.length) esclusi += (g.length - g2.length);
        if (g2.length) g = g2;                       // se restano candidati, esclude i penalizzati
        return g.find(tm) || g.find(l=>l.forte) || null;
      };
      let s = scegli('G'); if (!s) s = scegli('W');
      let pos;
      if (s) pos = s.pos;
      else { if (R.mutante.effEl == null) continue; pos = R.mutante.pos; }
      const dir = pos<=3 ? 'SHORT' : 'LONG';
      const pnl = dir==='LONG' ? r.move : -r.move;
      const p2 = r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
      for (const p of ['tutto', p2].filter(Boolean)) {
        if (pnl>0) acc[p].w++; else if (pnl<0) acc[p].l++; acc[p].p += pnl; }
    }
    return { acc, esclusi };
  };
  const senza = run(false), con = run(true);
  const pc = o => (o.w+o.l) ? (100*o.w/(o.w+o.l)).toFixed(2)+'%' : '—';
  console.log('\n=== RIPIEGO con AUTOPENALITÀ 自刑 dal giorno ===');
  console.log('linee escluse per autopenalità: ' + con.esclusi);
  console.log('\nperiodo'.padEnd(11)+'senza autopen'.padStart(16)+'pip'.padStart(9)+
              '   con autopen'.padStart(16)+'pip'.padStart(9));
  for (const p of ['tutto','recente','vecchio']) {
    const a=senza.acc[p], b=con.acc[p];
    console.log(p.padEnd(11)+(pc(a)+' (n='+(a.w+a.l)+')').padStart(16)+a.p.toFixed(0).padStart(9)+
                '   '+(pc(b)+' (n='+(b.w+b.l)+')').padStart(16)+b.p.toFixed(0).padStart(9));
  }
}

if (process.env.IMMOBFAIL) {
  // Carte dove la regola dell'immobilizzazione CAMBIEREBBE il verdetto e sbaglierebbe:
  // oggi il PB dice "segue" e ha ragione; la regola direbbe "non segue" e perderebbe.
  const casi = rows.filter(r => (HOUTIAN[r.usoTrasf]||[]).some(pz => COMBINA[pz] === r.dayBranchUsed))
                   .filter(r => !r.rafforzato && r.finale === true && r.pnl > 0);
  casi.sort((a,b)=>b.pnl-a.pnl);
  console.log('\n=== IMMOBILIZZAZIONE: dove sbaglierebbe (peggiori 8) ===');
  console.log('il PB dice SEGUE e ha ragione; la regola imporrebbe NON SEGUE e perderebbe\n');
  for (const r of casi.slice(0,8)) {
    const sig = r.emaDir==='up' ? 'LONG' : 'SHORT';
    console.log(r.cross.padEnd(7) + r.date +
      '  trend ' + (r.emaDir==='up'?'LONG ':'SHORT') +
      '  PB ' + sig.padEnd(5) + '(segue)' +
      '  mercato ' + (r.move>0?'SALE  ':'SCENDE') +
      '  PB ' + r.pnl.toFixed(0).padStart(5) + ' pip · regola ' + (-r.pnl).toFixed(0).padStart(5) + ' pip' +
      '   [' + r.via + ']  giorno ' + r.dayStemUsed + r.dayBranchUsed +
      '  trasf ' + r.usoTrasf + ' pal ' + (HOUTIAN[r.usoTrasf]||[]).join(''));
  }
  console.log('\ntotale carte in cui la regola cambierebbe il verdetto: ' +
    rows.filter(r => (HOUTIAN[r.usoTrasf]||[]).some(pz => COMBINA[pz] === r.dayBranchUsed))
        .filter(r => !r.rafforzato && r.finale === true).length);
}

if (process.env.TSCOUNT) {
  const t = rows.filter(r=>r.trendEtaiSui);
  console.log('\ncarte in cui il palazzo del Trend coincide col ramo dell\'anno (Tai Sui): '+t.length+' su '+rows.length);
  const per={'tutto':()=>true,'recente':r=>r.date>='2023-05-01','vecchio':r=>r.date<='2022-12-31'};
  for(const [n,f] of Object.entries(per)){ const s2=t.filter(f); if(!s2.length){console.log('  '+n+': nessuna');continue;}
    const w=s2.filter(r=>r.pnl>0).length,l=s2.filter(r=>r.pnl<0).length;
    console.log('  '+n.padEnd(9)+' n='+String(s2.length).padStart(4)+'  win '+(100*w/(w+l)).toFixed(2)+'%  pip '+s2.reduce((a,r)=>a+r.pnl,0).toFixed(0)); }
}

if (process.env.PRUOLO) {
  // Il ruolo di P 父母 (Edu, 13/08/2026): P drena G (portatore direzionale) e controlla C
  // (che genera W). Ipotesi: P non e' mai indicatore di guadagno, casomai di perdita.
  const LYM = require('./liuyao.js');
  const per = { 'tutto':()=>true, 'recente':r=>r.date>='2023-05-01', 'vecchio':r=>r.date<='2022-12-31' };
  const dati = {};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const shi = R.linee[R.shi-1], ying = R.linee[R.ying-1], mob = R.linee[R.mutante.pos-1];
    for (const [asse, l] of [['Shi',shi],['Ying',ying],['mobile',mob]]) {
      const k = asse+':'+l.par;
      dati[k] = dati[k] || { tutto:{w:0,l:0,p:0}, recente:{w:0,l:0,p:0}, vecchio:{w:0,l:0,p:0} };
      const p2 = r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
      for (const pp of ['tutto', p2].filter(Boolean)) {
        const o = dati[k][pp];
        if (r.pnl>0) o.w++; else if (r.pnl<0) o.l++; o.p += r.pnl; }
    }
  }
  const pc = o => (o.w+o.l) ? (100*o.w/(o.w+o.l)).toFixed(2)+'%' : '—';
  console.log('\n=== RUOLO DEI PARENTI PER POSIZIONE (baseline 53.51%) ===');
  for (const asse of ['Shi','Ying','mobile']) {
    console.log('\n--- '+asse+' ---');
    console.log('  par'.padEnd(6)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+'vecchio'.padStart(10)+'pip'.padStart(9));
    for (const k of ['G','W','B','C','P']) {
      const d = dati[asse+':'+k]; if (!d) continue;
      console.log('  '+k.padEnd(4)+String(d.tutto.w+d.tutto.l).padStart(6)+
        pc(d.tutto).padStart(9)+pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
        d.tutto.p.toFixed(0).padStart(9));
    }
  }
}

if (process.env.PSOLO) {
  // P 父母 all'Ying: fa bene solo quando GENERA il B allo Shi e quel B e' agibile?
  // (Edu, 13/08/2026) Se il B allo Shi e' incartato, P non fa niente -> perde.
  const LYM = require('./liuyao.js');
  const G = {}; const add = (k,r) => { G[k]=G[k]||{tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}};
    const p2 = r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for (const pp of ['tutto',p2].filter(Boolean)){ const o=G[k][pp];
      if(r.pnl>0)o.w++; else if(r.pnl<0)o.l++; o.p+=r.pnl; } };
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const shi = R.linee[R.shi-1], ying = R.linee[R.ying-1];
    if (ying.par !== 'P') continue;                       // solo P all'Ying
    const shiB = (shi.par === 'B');                       // P genera il B allo Shi
    const shiVivo = R.shiEff;
    if (shiB && shiVivo)       add('P→B allo Shi, B agibile', r);
    else if (shiB && !shiVivo) add('P→B allo Shi, B incartato', r);
    else                       add('P all\'Ying, Shi non e B', r);
  }
  const pc = o => (o.w+o.l) ? (100*o.w/(o.w+o.l)).toFixed(2)+'%' : '—';
  console.log('\n=== P 父母 all\'Ying: quando fa bene? (baseline 53.51%) ===');
  console.log('caso'.padEnd(30)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for (const [k,d] of Object.entries(G)) {
    const n = d.tutto.w+d.tutto.l;
    console.log(k.padEnd(30)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9));
  }
}

if (process.env.PSHI) {
  // P 父母 all'Ying, scomposto per COSA E' LO SHI — cioe' che rapporto ha P con lo Shi:
  //   Shi=B  P GENERA lo Shi        -> P e' DRENATO
  //   Shi=W  W controlla P          -> P e' CONTROLLATO
  //   Shi=G  G genera P             -> P e' NUTRITO
  //   Shi=C  P controlla C          -> P CONTROLLA lo Shi
  //   Shi=P  stesso parente         -> P con P
  const LYM = require('./liuyao.js');
  const G2 = {}; const add=(k,r)=>{ G2[k]=G2[k]||{tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}};
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=G2[k][pp];
      if(r.pnl>0)o.w++; else if(r.pnl<0)o.l++; o.p+=r.pnl;} };
  const ETICHETTA = {
    B:'Shi=B  P genera Shi (DRENATO)', W:'Shi=W  W controlla P (CONTROLLATO)',
    G:'Shi=G  G genera P (NUTRITO)',   C:'Shi=C  P controlla Shi (DOMINA)',
    P:'Shi=P  P con P (stesso)' };
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const shi = R.linee[R.shi-1], ying = R.linee[R.ying-1];
    if (ying.par !== 'P') continue;
    add(ETICHETTA[shi.par], r);
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== P all\'Ying, per rapporto con lo Shi (baseline 53.51%) ===');
  console.log('caso'.padEnd(36)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  const ord = Object.entries(G2).sort((a,b)=>{
    const pa=(a[1].tutto.w)/(a[1].tutto.w+a[1].tutto.l), pb2=(b[1].tutto.w)/(b[1].tutto.w+b[1].tutto.l);
    return pb2-pa; });
  for (const [k,d] of ord) {
    const n=d.tutto.w+d.tutto.l;
    console.log(k.padEnd(36)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9));
  }
}

if (process.env.PSHI2) {
  // P 父母 allo SHI, scomposto per rapporto con l'YING (speculare all'analisi su P all'Ying).
  //   Ying=B  P genera l'Ying      -> P DRENATO dall'Ying
  //   Ying=W  W controlla P        -> P CONTROLLATO
  //   Ying=G  G genera P           -> P NUTRITO
  //   Ying=C  P controlla l'Ying   -> P DOMINA
  //   Ying=P  stesso parente
  const LYM = require('./liuyao.js');
  const G3={}; const add=(k,r)=>{G3[k]=G3[k]||{tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}};
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=G3[k][pp];
      if(r.pnl>0)o.w++; else if(r.pnl<0)o.l++; o.p+=r.pnl;}};
  const ET={ B:'Ying=B  P genera Ying (DRENATO)', W:'Ying=W  W controlla P (CONTROLLATO)',
             G:'Ying=G  G genera P (NUTRITO)',    C:'Ying=C  P controlla Ying (DOMINA)',
             P:'Ying=P  P con P (stesso)' };
  // secondo taglio: lo Shi P e' agibile o incartato?
  const H={}; const add2=(k,r)=>{H[k]=H[k]||{tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}};
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=H[k][pp];
      if(r.pnl>0)o.w++; else if(r.pnl<0)o.l++; o.p+=r.pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const shi=R.linee[R.shi-1], ying=R.linee[R.ying-1];
    if (shi.par !== 'P') continue;                    // solo P allo Shi
    add(ET[ying.par], r);
    add2(R.shiEff ? 'Shi P agibile' : 'Shi P incartato', r);
    add2(shi.isMobile ? 'Shi P e la mobile' : 'Shi P fermo', r);
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  const stampa=(tit,obj)=>{ console.log('\n'+tit);
    console.log('caso'.padEnd(38)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
                'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
    const ord=Object.entries(obj).sort((a,b)=>{
      const pa=a[1].tutto.w/(a[1].tutto.w+a[1].tutto.l), pb=b[1].tutto.w/(b[1].tutto.w+b[1].tutto.l);
      return pb-pa;});
    for(const [k,d] of ord){ const n=d.tutto.w+d.tutto.l;
      console.log(k.padEnd(38)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
        pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
        d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); } };
  stampa('=== P allo SHI, per rapporto con l\'Ying (baseline 53.51%) ===', G3);
  stampa('=== P allo SHI: stato della linea ===', H);
}

if (process.env.CRUOLO) {
  // C 子孫 (Edu, 13/08/2026): positivo quando GENERA W, negativo quando CONTROLLA G.
  // C genera W e controlla G sempre per costruzione elementale; quel che cambia e' se
  // sulla carta esiste un W vivo che riceve, e/o un G vivo da sopprimere.
  const LYM = require('./liuyao.js');
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const mets={}; const add=(grp,k,r)=>{ mets[grp]=mets[grp]||{}; mets[grp][k]=mets[grp][k]||mk();
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=mets[grp][k][pp];
      if(r.pnl>0)o.w++; else if(r.pnl<0)o.l++; o.p+=r.pnl;}};
  const ET={ B:'altro=B', W:'altro=W  C genera W (VERSA)', G:'altro=G  C controlla G (SOPPRIME)',
             C:'altro=C  stesso', P:'altro=P' };
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const vivo = l => !['legata','rotta','dormiente','eliminata','autocombinata'].includes(l.stato);
    const shi=R.linee[R.shi-1], ying=R.linee[R.ying-1], mob=R.linee[R.mutante.pos-1];
    // W e G vivi presenti sulla carta?
    const Wvivo = R.linee.some(l=>l.par==='W' && vivo(l));
    const Gvivo = R.linee.some(l=>l.par==='G' && vivo(l));
    for (const [asse,l] of [['Shi',shi],['Ying',ying],['mobile',mob]]) {
      if (l.par !== 'C') continue;
      add('C su '+asse+' — rapporto con l\'altro polo',
          ET[(asse==='Shi'?ying:asse==='Ying'?shi:shi).par] || 'altro=?', r);
      add('C su '+asse+' — bersagli vivi',
          (Wvivo?'W vivo':'W assente')+' · '+(Gvivo?'G vivo':'G assente'), r);
      add('C su '+asse+' — stato', l.isMobile?'C e la mobile':(vivo(l)?'C agibile':'C incartato'), r);
    }
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n########## RUOLO DI C 子孫 (baseline 53.51%) ##########');
  for (const [grp,obj] of Object.entries(mets)) {
    console.log('\n=== '+grp+' ===');
    console.log('caso'.padEnd(34)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
                'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
    const ord=Object.entries(obj).sort((a,b)=>{
      const pa=a[1].tutto.w/(a[1].tutto.w+a[1].tutto.l), pb=b[1].tutto.w/(b[1].tutto.w+b[1].tutto.l);
      return pb-pa;});
    for(const [k,d] of ord){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
      console.log(k.padEnd(34)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
        pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
        d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
  }
}

if (process.env.GDIR) {
  // G COME INDICATORE DIREZIONALE, E C CHE LO CONTROLLA (Edu, 13/08/2026)
  // Ipotesi: la POSIZIONE di G da' la direzione (trigramma superiore L4-6 = LONG,
  // inferiore L1-3 = SHORT). Se un C vivo lo controlla, la predizione si RIBALTA.
  // Test diretto sulla DIREZIONE REALE del mercato, non sul tasso di successo del PB.
  const LYM = require('./liuyao.js');
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(grp,k,dirOk,r)=>{ M[grp]=M[grp]||{}; M[grp][k]=M[grp][k]||mk();
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[grp][k][pp];
      if(dirOk>0)o.w++; else if(dirOk<0)o.l++; o.p+=dirOk;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const vivo = l => !['legata','rotta','dormiente','eliminata','autocombinata'].includes(l.stato);
    const Gs = R.linee.filter(l=>l.par==='G' && vivo(l));
    if (Gs.length !== 1) continue;                     // un solo G vivo: la direzione e' netta
    const g = Gs[0];
    const dirG = g.pos<=3 ? 'SHORT' : 'LONG';
    const pnlG = dirG==='LONG' ? r.move : -r.move;     // seguire la direzione di G
    const Cs = R.linee.filter(l=>l.par==='C' && vivo(l));
    const cVivo = Cs.length>0;
    const cMobile = Cs.some(l=>l.isMobile);
    const cYing = Cs.some(l=>l.isYing);
    const cShi  = Cs.some(l=>l.isShi);
    add('A) direzione di G — controllo generale', cVivo?'C vivo presente':'nessun C vivo', pnlG, r);
    if (cVivo) {
      add('B) direzione di G — da dove controlla il C',
          cMobile?'C e la mobile':cYing?'C all Ying':cShi?'C allo Shi':'C su altra linea', pnlG, r);
    }
    add('C) direzione di G — G in alto o in basso', dirG+(cVivo?'  con C vivo':'  senza C'), pnlG, r);
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n########## G COME DIREZIONE · C CHE LO CONTROLLA ##########');
  console.log('(win% = quante volte seguire la direzione indicata da G ha avuto ragione)');
  for (const [grp,obj] of Object.entries(M)) {
    console.log('\n=== '+grp+' ===');
    console.log('caso'.padEnd(32)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
                'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
    for(const [k,d] of Object.entries(obj)){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
      console.log(k.padEnd(32)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
        pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
        d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
  }
}

if (process.env.LYSOLO) {
  // IL LIU YAO DA SOLO — nessun PB, nessuna EMA. La lettura LY produce LONG o SHORT
  // e si confronta con la DIREZIONE REALE del mercato su tutte le carte.
  const LYM = require('./liuyao.js');
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk();
    const pnl = dir==='LONG' ? r.move : -r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  // riferimento: quante volte il mercato sale (il caso)
  let su=0, giu=0;
  for (const r of rows) { if(r.move>0) su++; else if(r.move<0) giu++; }
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const vivo = l => !['legata','rotta','dormiente','eliminata','autocombinata'].includes(l.stato);
    const dirDa = l => l.pos<=3 ? 'SHORT' : 'LONG';
    const shi=R.linee[R.shi-1], ying=R.linee[R.ying-1], mob=R.linee[R.mutante.pos-1];
    // 1. posizione dello Shi
    add('1. posizione dello Shi 世', dirDa(shi), r);
    // 2. posizione dell'Ying
    add('2. posizione dell Ying 應', dirDa(ying), r);
    // 3. posizione della linea mobile
    add('3. posizione della mobile', dirDa(mob), r);
    // 4. gerarchia G→W→mobile su TUTTE le carte (preferendo i vivi)
    const pick = par => { const g=R.linee.filter(l=>l.par===par && vivo(l)); return g[0]||null; };
    let h = pick('G') || pick('W') || (vivo(mob)?mob:null);
    if (h) add('4. gerarchia G→W→mobile', dirDa(h), r);
    // 5. la linea viva piu' forte (timely + sostenuta)
    const forti = R.linee.filter(l=>vivo(l) && l.forte);
    if (forti.length) add('5. linea viva piu forte', dirDa(forti[0]), r);
    // 6. relazione Ying→Shi (la vecchia v1) tradotta in direzione dalla posizione dello Shi
    const rel = (ti,yo)=> yo===ti?null : GEN[yo]===ti?true : CTRL[ti]===yo?true : false;
    const v = rel(shi.el, ying.el);
    if (v!==null) add('6. Ying→Shi (v1) su posiz. Shi', v ? dirDa(shi) : (dirDa(shi)==='LONG'?'SHORT':'LONG'), r);
    // 7. maggioranza delle linee vive
    const vv = R.linee.filter(vivo);
    if (vv.length) { const b=vv.filter(l=>l.pos<=3).length, a=vv.length-b;
      if (b!==a) add('7. maggioranza linee vive', b>a?'SHORT':'LONG', r); }
    // 8. dove sta il Tai Sui (se su una linea)
    const ts = R.linee.find(l=>l.isTaiSui);
    if (ts) add('8. posizione del Tai Sui', dirDa(ts), r);
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n########## IL LIU YAO DA SOLO — nessun PB, nessuna EMA ##########');
  console.log('riferimento: il mercato sale nel '+(100*su/(su+giu)).toFixed(2)+'% dei giorni (n='+(su+giu)+')');
  console.log('\nlettura'.padEnd(34)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(10)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M)){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(34)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(10)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.LYDOTT) {
  // IL LIU YAO SECONDO LA DOTTRINA COMPLETA (Edu, 13/08/2026)
  // 1) ELIMINAZIONE: legata (六合 giorno) · rotta · dormiente · eliminata · autocombinata
  //    + varianti: clash+controllo dal giorno abbatte anche il timely; autopenalita' 自刑
  // 2) CHI PREVALE fra Shi e Ying: chi controlla l'altro, o chi e' generato dall'altro.
  //    La DIREZIONE viene dalla POSIZIONE del vincitore (inferiore SHORT, superiore LONG).
  // 3) Se cadono entrambi: gerarchia G -> W -> mobile, preferendo timely e 日辰臨爻.
  const LYM = require('./liuyao.js');
  const AUTOP=['辰','午','酉','亥'];
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  const conta={prevale:0, ripiego:0, muto:0};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const mEl=WX[r.monthBranchUsed], D=r.dayBranchUsed;
    const timely=l=>{const s=stagLoc(l.el,mEl); return s==='旺'||s==='相';};
    // eliminazione: stati morti dal modulo + due varianti aggiuntive
    const VAR=process.env.LYDOTT;            // 'base' | 'ctrl' | 'auto' | 'tutto'
    const morto = l => {
      if (['legata','rotta','dormiente','eliminata','autocombinata'].includes(l.stato)) return true;
      // clash dal giorno che CONTROLLA la linea: abbatte anche se timely
      if ((VAR==='ctrl'||VAR==='tutto') && CLASH[D]===l.ramo && CTRL[WX[D]]===l.el) return true;
      // autopenalita' 自刑 dal giorno
      if ((VAR==='auto'||VAR==='tutto') && l.ramo===D && AUTOP.includes(l.ramo)) return true;
      return false;
    };
    const dirDa=l=>l.pos<=3?'SHORT':'LONG';
    const shi=R.linee[R.shi-1], ying=R.linee[R.ying-1];
    const sV=!morto(shi), yV=!morto(ying);
    let hold=null;
    if (sV && yV) {
      // chi prevale: chi controlla l'altro; se nessuno controlla, chi e' generato dall'altro;
      // a parita', chi e' timely; se ancora pari, nessun responso
      if (CTRL[shi.el]===ying.el) hold=shi;
      else if (CTRL[ying.el]===shi.el) hold=ying;
      else if (GEN[ying.el]===shi.el) hold=shi;
      else if (GEN[shi.el]===ying.el) hold=ying;
      else { const ts=timely(shi), ty=timely(ying);
             if (ts&&!ty) hold=shi; else if (ty&&!ts) hold=ying; }
      if (hold) conta.prevale++;
    } else if (sV) { hold=shi; conta.prevale++; }
    else if (yV)  { hold=ying; conta.prevale++; }
    else {
      // ripiego: G -> W -> mobile, preferendo 日辰臨爻 poi timely
      const pick=par=>{ const g=R.linee.filter(l=>l.par===par && !morto(l));
        return g.find(l=>l.ramo===D) || g.find(timely) || g.find(l=>l.forte) || null; };
      hold = pick('G') || pick('W');
      if (!hold) { const mob=R.linee[R.mutante.pos-1];
        if (R.mutante.effEl!=null && !morto(mob)) hold=mob; }
      if (hold) conta.ripiego++;
    }
    if (!hold) { conta.muto++; continue; }
    add('dottrina completa ('+VAR+')', dirDa(hold), r);
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== LIU YAO, dottrina completa — variante '+process.env.LYDOTT+' ===');
  console.log('  vincitore fra Shi/Ying: '+conta.prevale+'   ripiego: '+conta.ripiego+'   muto: '+conta.muto);
  for(const [k,d] of Object.entries(M)){ const n=d.tutto.w+d.tutto.l;
    console.log('  n='+String(n).padStart(5)+'   tutto '+pc(d.tutto)+'   recente '+pc(d.recente)+
      '   vecchio '+pc(d.vecchio)+'   pip '+d.tutto.p.toFixed(0)+'   pip/tr '+(d.tutto.p/n).toFixed(2)); }
}

if (process.env.LYWORST) {
  // La carta LY piu' netta e piu' sbagliata: il vincitore fra Shi e Ying e' determinato
  // dal CONTROLLO (relazione piu' chiara), e' VIVO, TIMELY e SOSTENUTO, non c'e' ambiguita'
  // -- eppure il mercato va dalla parte opposta, e di molto.
  const LYM = require('./liuyao.js');
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const casi=[];
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const mEl=WX[r.monthBranchUsed], D=r.dayBranchUsed;
    const timely=l=>{const s=stagLoc(l.el,mEl); return s==='旺'||s==='相';};
    const morto=l=>['legata','rotta','dormiente','eliminata','autocombinata'].includes(l.stato);
    const shi=R.linee[R.shi-1], ying=R.linee[R.ying-1];
    if (morto(shi)||morto(ying)) continue;             // entrambi vivi: nessun ripiego
    let hold=null, perche='';
    if (CTRL[shi.el]===ying.el) { hold=shi; perche='il Soggetto 世 controlla l\'Ospite 應'; }
    else if (CTRL[ying.el]===shi.el) { hold=ying; perche='l\'Ospite 應 controlla il Soggetto 世'; }
    else continue;                                      // solo il controllo: relazione piu' netta
    if (!timely(hold) || !hold.forte) continue;         // il vincitore deve essere forte
    const perso = R.linee.find(l=>l!==hold && (l===shi||l===ying));
    if (timely(perso)) continue;                        // e il perdente NON deve essere timely
    const dir = hold.pos<=3?'SHORT':'LONG';
    const pnl = dir==='LONG'?r.move:-r.move;
    if (pnl>=0) continue;
    casi.push({r,R,hold,perche,dir,pnl,perso});
  }
  casi.sort((a,b)=>a.pnl-b.pnl);
  console.log('\n=== CARTE LY PIÙ NETTE E PIÙ SBAGLIATE ===');
  console.log('(vincitore determinato dal controllo, vivo, timely e sostenuto; perdente non timely)');
  console.log('carte che soddisfano tutte le condizioni: '+casi.length+'\n');
  for (const c of casi.slice(0,3)) {
    const r=c.r, R=c.R;
    console.log('────────────────────────────────────────────────────────');
    console.log(r.cross+'  '+r.date+'   seme '+r.seedUsed+'   sup '+r.sup+' inf '+r.inf+' mutante L'+r.linea);
    console.log('giorno '+r.dayStemUsed+r.dayBranchUsed+' · mese '+r.monthBranchUsed+' · anno '+r.yearBranchUsed+
                '   palazzo '+R.palName+' ('+R.palElIt+')   vuoti '+R.vuoti.join(''));
    console.log('LY: '+c.perche+' → regge '+(c.hold===R.linee[R.shi-1]?'世':'應')+
                ' L'+c.hold.pos+' '+c.hold.parCn+' '+c.hold.ramo+' ('+c.hold.elIt+') → '+c.dir);
    console.log('MERCATO: '+(r.move>0?'SALE':'SCENDE')+' '+Math.abs(r.move).toFixed(0)+' pip  → il LY perde '+Math.abs(c.pnl).toFixed(0)+' pip');
    console.log('PB diceva: '+(r.emaDir==='up'?(r.finale?'LONG':'SHORT'):(r.finale?'SHORT':'LONG'))+
                (r.finale?' (segue)':' (non segue)')+' → '+r.pnl.toFixed(0)+' pip');
    console.log('mutante L'+R.mutante.pos+': '+R.mutante.ramoDep+' → '+R.mutante.ramoArr+
                '  ('+R.mutante.casoLabel+')');
    for(let k=6;k>=1;k--){const x=R.linee[k-1];
      console.log('  L'+x.pos+' '+(x.yang?'▬▬▬':'▬ ▬')+' '+(x.bestia?x.bestia.cn:'--')+' '+x.parCn+' '+x.ramo+' '+x.elIt+
        (x.isShi?' 世':'')+(x.isYing?' 應':'')+(x.isMobile?' ✸':'')+(x.vuoto?' 空':'')+
        (x.isTaiSui?' 太歲':'')+(x.ramo===r.dayBranchUsed?' ←giorno':'')+
        ' ['+x.stato+(stagLoc(x.el,WX[r.monthBranchUsed])==='旺'||stagLoc(x.el,WX[r.monthBranchUsed])==='相'?' timely':'')+']'+
        (x.fushen?'  伏:'+x.fushen.parCn+x.fushen.b:''));}
    console.log('');
  }
}

if (process.env.LYMOBGEN) {
  // LA LETTURA DI EDU: la linea mobile si muove per GENERARE una linea; la posizione
  // di quella linea da' la direzione. Ora include il caso 3 (回頭剋) corretto.
  const LYM = require('./liuyao.js');
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const eff = R.mutante.effEl; if (eff==null) continue;
    const vivo=l=>!['legata','rotta','dormiente','eliminata','autocombinata'].includes(l.stato);
    const gen = R.linee.filter(l=>l.pos!==R.mutante.pos && GEN[eff]===l.el);
    const genV = gen.filter(vivo);
    const dirDa = arr => { const b=arr.filter(l=>l.pos<=3).length, a=arr.length-b;
      return (b&&a)||(!b&&!a) ? null : (b?'SHORT':'LONG'); };
    const d1 = dirDa(gen), d2 = dirDa(genV);
    if (d1) add('A. genera una linea (tutte)', d1, r);
    if (d2) add('B. genera una linea VIVA', d2, r);
    // solo quando la generata e' UNICA e viva (lettura piu' netta)
    if (genV.length===1) add('C. genera UNA sola linea viva', genV[0].pos<=3?'SHORT':'LONG', r);
    // solo caso 3 回頭剋 (le carte che prima erano invisibili)
    if (R.mutante.casoMut===3 && d2) add('D. solo 回頭剋 (caso 3)', d2, r);
    // la generata e' G 官鬼
    const gG = genV.filter(l=>l.par==='G'); const dG = dirDa(gG);
    if (dG) add('E. genera un G 官鬼 vivo', dG, r);
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== LA MOBILE CHE GENERA — riferimento 50.40% ===');
  console.log('lettura'.padEnd(32)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(10)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M)){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(32)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(10)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.GMOB) {
  // LA CONDIZIONE DI EDU (13/08/2026, da GBPUSD 03/10/2022):
  // "Children al Soggetto non dice niente; Officer in alto ci dice molto; e se una linea
  //  si muove per generarlo, deve risvegliare l'attenzione."
  // Test: carte con un G VIVO che la mobile GENERA (arrivo della mutazione genera l'elemento
  // di G). Direzione dalla POSIZIONE del G generato. Scomposto per condizioni via via
  // piu' strette, per vedere quale separa.
  const LYM = require('./liuyao.js');
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  const HALFTRI={'亥':'卯','卯':'亥','寅':'午','午':'寅','巳':'酉','酉':'巳','申':'子','子':'申','辰':'子','戌':'午','丑':'酉','未':'卯'};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const eff = R.mutante.effEl; if (eff==null) continue;
    const vivo=l=>!['legata','rotta','dormiente','eliminata','autocombinata'].includes(l.stato);
    const Gs = R.linee.filter(l=>l.par==='G' && vivo(l) && l.pos!==R.mutante.pos && GEN[eff]===l.el);
    if (Gs.length!==1) continue;                    // un solo G vivo generato dalla mobile
    const g = Gs[0];
    const dir = g.pos<=3?'SHORT':'LONG';
    const shi = R.linee[R.shi-1];
    add('1. mobile genera un G vivo', dir, r);
    if (g.isYing) add('2. ... e il G e allo Ying', dir, r);
    if (shi.par==='C') add('3. ... e lo Shi e C (muto)', dir, r);
    if (g.isYing && shi.par==='C') add('4. G allo Ying + Shi C', dir, r);
    const mEl=WX[r.monthBranchUsed];
    const sSt=stagLoc(shi.el,mEl);
    if (!(sSt==='旺'||sSt==='相')) add('5. ... e lo Shi NON timely', dir, r);
    if (HALFTRI[R.mutante.ramoArr]===g.ramo) add('6. ... arrivo in mezza triade col G', dir, r);
    if (g.isYing && HALFTRI[R.mutante.ramoArr]===g.ramo) add('7. G allo Ying + mezza triade', dir, r);
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== LA MOBILE CHE GENERA UN G VIVO — riferimento 50.40% ===');
  console.log('condizione'.padEnd(38)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M)){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(38)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.LYWORST2) {
  // Seconda carta problematica: criteri DIVERSI dalla prima e senza la scappatoia della
  // condizione 16. Cerco: tutta la carta punta nella stessa direzione -- vincitore fra
  // Shi/Ying netto e forte, mobile che GENERA una linea nello STESSO trigramma del
  // vincitore (quindi azione e impronta concordano), nessun G generato dalla mobile,
  // Tai Sui non contrario -- e il mercato va dall'altra parte con un movimento grosso.
  const LYM = require('./liuyao.js');
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const casi=[];
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const mEl=WX[r.monthBranchUsed];
    const timely=l=>{const s=stagLoc(l.el,mEl); return s==='旺'||s==='相';};
    const vivo=l=>!['legata','rotta','dormiente','eliminata','autocombinata'].includes(l.stato);
    const shi=R.linee[R.shi-1], ying=R.linee[R.ying-1];
    if (!vivo(shi)||!vivo(ying)) continue;
    let hold=null;
    if (CTRL[shi.el]===ying.el) hold=shi; else if (CTRL[ying.el]===shi.el) hold=ying; else continue;
    if (!timely(hold)||!hold.forte) continue;
    const dir = hold.pos<=3?'SHORT':'LONG';
    // la mobile deve CONCORDARE: genera una linea viva nello stesso trigramma del vincitore
    const eff=R.mutante.effEl; if (eff==null) continue;
    const gen=R.linee.filter(l=>l.pos!==R.mutante.pos && vivo(l) && GEN[eff]===l.el);
    if (!gen.length) continue;
    if (gen.some(l=>l.par==='G')) continue;                        // esclusa la condizione 16
    const stesso = gen.every(l=>(l.pos<=3)===(hold.pos<=3));
    if (!stesso) continue;                                          // azione concorde
    const ts=R.linee.find(l=>l.isTaiSui);
    if (ts && ((ts.pos<=3)!==(hold.pos<=3))) continue;              // Tai Sui non contrario
    const pnl = dir==='LONG'?r.move:-r.move;
    if (pnl>=0) continue;
    casi.push({r,R,hold,dir,pnl,gen});
  }
  casi.sort((a,b)=>a.pnl-b.pnl);
  console.log('\n=== SECONDA CARTA PROBLEMATICA: impronta e azione CONCORDI, mercato contrario ===');
  console.log('carte trovate: '+casi.length+'\n');
  for (const c of casi.slice(0,2)) {
    const r=c.r, R=c.R;
    console.log('────────────────────────────────────────');
    console.log(r.cross+'  '+r.date+'   seme '+r.seedUsed+'   sup '+r.sup+' inf '+r.inf+' mutante L'+r.linea);
    console.log('giorno '+r.dayStemUsed+r.dayBranchUsed+' · mese '+r.monthBranchUsed+' · anno '+r.yearBranchUsed+
                '   palazzo '+R.palName+' ('+R.palElIt+')   vuoti '+R.vuoti.join(''));
    console.log('vincitore: '+(c.hold.isShi?'世':'應')+' L'+c.hold.pos+' '+c.hold.parCn+' '+c.hold.ramo+' → '+c.dir);
    console.log('mobile L'+R.mutante.pos+': '+R.mutante.ramoDep+' → '+R.mutante.ramoArr+
                '  genera: '+c.gen.map(l=>'L'+l.pos+' '+l.parCn+' '+l.ramo).join(' · ')+'  (stesso trigramma)');
    console.log('MERCATO: '+(r.move>0?'SALE':'SCENDE')+' '+Math.abs(r.move).toFixed(0)+' pip → il LY perde '+Math.abs(c.pnl).toFixed(0));
    for(let k=6;k>=1;k--){const x=R.linee[k-1];
      const st=stagLoc(x.el,WX[r.monthBranchUsed]);
      console.log('  L'+x.pos+' '+(x.yang?'▬▬▬':'▬ ▬')+' '+(x.bestia?x.bestia.cn:'--')+' '+x.parCn+' '+x.ramo+' '+x.elIt+
        (x.isShi?' 世':'')+(x.isYing?' 應':'')+(x.isMobile?' ✸':'')+(x.vuoto?' 空':'')+(x.isTaiSui?' 太歲':'')+
        (x.ramo===r.dayBranchUsed?' ←giorno':'')+' ['+x.stato+((st==='旺'||st==='相')?' timely':'')+']'+
        (x.fushen?'  伏:'+x.fushen.parCn+x.fushen.b:''));}
    console.log('');
  }
}

if (process.env.SCALAMOB) {
  // LA SCALA MOBILE, misurata (Edu, 13/08/2026):
  // linea in 暗動 il cui arrivo (stessa posizione nell'esagramma trasformato unico)
  // COMBINA la partenza della mutante -> la mutante e' saldata al movimento e VINCE.
  // Direzione dalla posizione della MUTANTE. Varianti piu' larghe per contesto.
  const LYM = require('./liuyao.js');
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const mob = R.linee[R.mutante.pos-1];
    const dirMob = mob.pos<=3?'SHORT':'LONG';
    const nAn = Object.keys(R.anDong||{}).length;
    if (nAn>0) add('A. carte con almeno una linea in 暗動', dirMob, r);
    if (R.scalaMobile) {
      add('B. SCALA MOBILE (arrivo 暗動 combina la mutante)', dirMob, r);
      const parArr = mob.mut ? mob.mut.parArr : null;
      if (parArr==='G') add('C. ... e la mutante emerge G', dirMob, r);
      if (parArr==='G'||parArr==='W') add('D. ... emerge G o W', dirMob, r);
    }
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== LA SCALA MOBILE — riferimento 50.40% ===');
  console.log('condizione'.padEnd(46)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M)){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(46)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.SMFAIL) {
  // Le scale mobili che sbagliano di piu': arrivo in 暗動 che combina la partenza della
  // mutante, mutante "saldata" che indica una direzione, mercato che va dall'altra parte.
  const LYM = require('./liuyao.js');
  const casi=[];
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error || !R.scalaMobile) continue;
    const mob = R.linee[R.mutante.pos-1];
    const dir = mob.pos<=3?'SHORT':'LONG';
    const pnl = dir==='LONG'?r.move:-r.move;
    if (pnl>=0) continue;
    casi.push({r,R,dir,pnl});
  }
  casi.sort((a,b)=>a.pnl-b.pnl);
  console.log('\n=== SCALE MOBILI CHE SBAGLIANO (peggiori 2) ===  totale: '+casi.length+' perdenti su 146\n');
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  for (const c of casi.slice(0,2)) {
    const r=c.r, R=c.R, S=R.scalaMobile;
    console.log('────────────────────────────────────────');
    console.log(r.cross+'  '+r.date+'   seme '+r.seedUsed+'   sup '+r.sup+' inf '+r.inf+' mutante L'+r.linea);
    console.log('giorno '+r.dayStemUsed+r.dayBranchUsed+' · mese '+r.monthBranchUsed+' · anno '+r.yearBranchUsed+
                '   palazzo '+R.palName+' ('+R.palElIt+')   vuoti '+R.vuoti.join(''));
    console.log('SCALA MOBILE: L'+S.da+' in 暗動 arriva a '+S.arrDa+' che combina la partenza '+
                R.mutante.ramoDep+' della mutante L'+S.su);
    console.log('mutante L'+R.mutante.pos+': '+R.mutante.ramoDep+' → '+R.mutante.ramoArr+
                ' ('+(R.linee[R.mutante.pos-1].mut?R.linee[R.mutante.pos-1].mut.parArr:'?')+')  → '+c.dir);
    console.log('MERCATO: '+(r.move>0?'SALE':'SCENDE')+' '+Math.abs(r.move).toFixed(0)+' pip → la scala mobile perde '+Math.abs(c.pnl).toFixed(0));
    for(let k=6;k>=1;k--){const x=R.linee[k-1];
      const st=stagLoc(x.el,WX[r.monthBranchUsed]);
      console.log('  L'+x.pos+' '+(x.yang?'▬▬▬':'▬ ▬')+' '+(x.bestia?x.bestia.cn:'--')+' '+x.parCn+' '+x.ramo+' '+x.elIt+
        (x.isShi?' 世':'')+(x.isYing?' 應':'')+(x.isMobile?' ✸':'')+(x.vuoto?' 空':'')+(x.isTaiSui?' 太歲':'')+
        (x.ramo===r.dayBranchUsed?' ←giorno':'')+((R.anDong||{})[x.pos]?' 暗動→'+R.anDong[x.pos].arr:'')+
        ' ['+x.stato+((st==='旺'||st==='相')?' timely':'')+']'+
        (x.fushen?'  伏:'+x.fushen.parCn+x.fushen.b:''));}
    console.log('');
  }
}

if (process.env.GNASC) {
  // IL G NASCOSTO RAGGIUNTO DAL BAZI (Edu, 13/08/2026, da EURJPY 29/04/2024)
  // 伏神 官鬼 dietro una linea; un ramo del Bazi lo COMBINA (六合) e lo attiva.
  // Direzione dalla posizione della linea che lo nasconde.
  // Varianti: ramo qualsiasi · ramo DOPPIO nel Bazi · doppio che include il Tai Sui.
  const LYM = require('./liuyao.js');
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const bazi = [r.yearBranchUsed, r.monthBranchUsed, r.dayBranchUsed];
    // linee con 伏神 官鬼 dietro
    const nasc = R.linee.filter(l => l.fushen && l.fushen.par==='G');
    if (nasc.length!==1) continue;
    const L = nasc[0], fb = L.fushen.b;
    const tocca = bazi.filter(b => COMBINA[b] === fb);
    if (!tocca.length) continue;
    const dir = L.pos<=3 ? 'SHORT':'LONG';
    add('A. G nascosto combinato dal Bazi', dir, r);
    // doppio: due rami del Bazi uguali che combinano il nascosto
    const doppio = tocca.length>=2 || bazi.filter(b=>b===tocca[0]).length>=2;
    if (doppio) add('B. ... da un ramo DOPPIO', dir, r);
    const conTS = tocca.includes(r.yearBranchUsed);
    if (doppio && conTS) add('C. ... doppio che include il Tai Sui', dir, r);
    if (conTS) add('D. ... combinato dal Tai Sui', dir, r);
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== IL G NASCOSTO RAGGIUNTO DAL BAZI — riferimento 50.40% ===');
  console.log('condizione'.padEnd(42)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M)){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(42)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.SMVUOTO) {
  // LA SCALA MOBILE CHE PORTA DA QUALCHE PARTE (Edu, 13/08/2026)
  // La scala mobile conta solo se l'arrivo della mutante NON e' vuoto (旬空):
  // se sale verso un ramo vuoto non produce nulla.
  const LYM = require('./liuyao.js');
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error || !R.scalaMobile) continue;
    const mob = R.linee[R.mutante.pos-1];
    const dir = mob.pos<=3?'SHORT':'LONG';
    const arrVuoto = R.vuoti.indexOf(R.mutante.ramoArr) >= 0;
    const parArr = mob.mut ? mob.mut.parArr : null;
    add(arrVuoto ? 'arrivo VUOTO (non porta da nessuna parte)' : 'arrivo PIENO (porta a qualcosa)', dir, r);
    if (!arrVuoto) {
      add('  arrivo pieno · emerge '+parArr, dir, r);
      // e anche l'arrivo della linea in 暗動 non vuoto
      if (R.vuoti.indexOf(R.scalaMobile.arrDa) < 0) add('  arrivo pieno + 暗動 pieno', dir, r);
    }
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== SCALA MOBILE: porta a qualcosa? — riferimento 50.40% ===');
  console.log('condizione'.padEnd(44)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  const ord=Object.entries(M).sort((a,b)=>{const pa=a[1].tutto.w/(a[1].tutto.w+a[1].tutto.l),
    pb=b[1].tutto.w/(b[1].tutto.w+b[1].tutto.l); return pb-pa;});
  for(const [k,d] of ord){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(44)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.SMG) {
  // Scale mobili che portano a un G (l'arrivo della mutante e' 官鬼) e SBAGLIANO.
  // Le 46 carte con destinazione G stanno esattamente a 50,00%: 23 giuste, 23 sbagliate.
  const LYM = require('./liuyao.js');
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const casi=[];
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error || !R.scalaMobile) continue;
    const mob = R.linee[R.mutante.pos-1];
    if (!mob.mut || mob.mut.parArr !== 'G') continue;          // deve portare a un G
    if (R.vuoti.indexOf(R.mutante.ramoArr) >= 0) continue;     // e il G non dev'essere vuoto
    const dir = mob.pos<=3?'SHORT':'LONG';
    const pnl = dir==='LONG'?r.move:-r.move;
    casi.push({r,R,dir,pnl,mob});
  }
  const giuste = casi.filter(c=>c.pnl>0).length, sbagliate = casi.filter(c=>c.pnl<0).length;
  console.log('\n=== SCALE MOBILI CHE PORTANO A UN G (non vuoto) ===');
  console.log('totale: '+casi.length+'   giuste: '+giuste+'   sbagliate: '+sbagliate);
  casi.sort((a,b)=>a.pnl-b.pnl);
  for (const c of casi.slice(0,2)) {
    const r=c.r, R=c.R, S=R.scalaMobile;
    console.log('\n────────────────────────────────────────');
    console.log(r.cross+'  '+r.date+'   seme '+r.seedUsed+'   sup '+r.sup+' inf '+r.inf+' mutante L'+r.linea);
    console.log('giorno '+r.dayStemUsed+r.dayBranchUsed+' · mese '+r.monthBranchUsed+' · anno '+r.yearBranchUsed+
                '   palazzo '+R.palName+' ('+R.palElIt+')   vuoti '+R.vuoti.join(''));
    console.log('SCALA MOBILE: L'+S.da+' in 暗動 → '+S.arrDa+'  combina la partenza '+R.mutante.ramoDep+' di L'+S.su);
    console.log('mutante L'+R.mutante.pos+': '+R.mutante.ramoDep+' → '+R.mutante.ramoArr+
                ' = 官鬼 G ('+R.mutante.arrElIt+')   caso '+R.mutante.casoMut);
    console.log('direzione LY: '+c.dir+'   MERCATO: '+(r.move>0?'SALE':'SCENDE')+' '+
                Math.abs(r.move).toFixed(0)+' pip  → perde '+Math.abs(c.pnl).toFixed(0)+' pip');
    for(let k=6;k>=1;k--){const x=R.linee[k-1];
      const st=stagLoc(x.el,WX[r.monthBranchUsed]);
      console.log('  L'+x.pos+' '+(x.yang?'▬▬▬':'▬ ▬')+' '+(x.bestia?x.bestia.cn:'--')+' '+x.parCn+' '+x.ramo+' '+x.elIt+
        (x.isShi?' 世':'')+(x.isYing?' 應':'')+(x.isMobile?' ✸':'')+(x.vuoto?' 空':'')+(x.isTaiSui?' 太歲':'')+
        (x.ramo===r.dayBranchUsed?' ←giorno':'')+((R.anDong||{})[x.pos]?' 暗動→'+R.anDong[x.pos].arr:'')+
        ' ['+x.stato+((st==='旺'||st==='相')?' timely':'')+']'+
        (x.fushen?'  伏:'+x.fushen.parCn+x.fushen.b:''));}
  }
}

if (process.env.ZHENGHE) {
  // A) 争合 — COMBINAZIONE CONTESA (Edu, 13/08/2026, da USDJPY 10/02/2026)
  //    Un ramo non puo' ricevere due combinazioni insieme. Se la partenza della mutante e'
  //    GIA' combinata da un ramo del Bazi, l'arrivo della linea in 暗動 non ha atterraggio:
  //    la scala mobile NON si forma, e la linea in 暗動 distrugge la propria partenza.
  // B) CAPOLINEA — la linea che riceve dal flusso e non cede a nessuno vivo: accumula e vince.
  const LYM = require('./liuyao.js');
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const bazi=[r.yearBranchUsed, r.monthBranchUsed, r.dayBranchUsed];
    const vivo=l=>!['legata','rotta','dormiente','eliminata','autocombinata'].includes(l.stato);
    const mob=R.linee[R.mutante.pos-1];
    // ---- A) scala mobile, separando i casi di 争合 ----
    if (R.scalaMobile) {
      const conteso = bazi.some(b=>COMBINA[b]===R.mutante.ramoDep);
      const dir = mob.pos<=3?'SHORT':'LONG';
      add(conteso ? 'A2. scala mobile CONTESA (争合) — non vale'
                  : 'A1. scala mobile LIBERA — vale', dir, r);
      if (!conteso && mob.mut && mob.mut.parArr==='G')
        add('A3. scala mobile libera + porta a G', dir, r);
    }
    // ---- B) capolinea: riceve da un elemento vivo, non cede a nessun elemento vivo ----
    const vivi=R.linee.filter(vivo);
    const elsVivi=new Set(vivi.map(l=>l.el).concat(bazi.map(b=>WX[b])));
    const cap = vivi.filter(l => {
      const riceve = Array.from(elsVivi).some(e => GEN[e]===l.el && e!==l.el);
      const cede   = Array.from(elsVivi).some(e => GEN[l.el]===e);
      return riceve && !cede;
    });
    if (cap.length===1) {
      add('B1. capolinea unico del flusso', cap[0].pos<=3?'SHORT':'LONG', r);
      add('B2. capolinea unico · '+cap[0].par, cap[0].pos<=3?'SHORT':'LONG', r);
    }
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== 争合 E CAPOLINEA — riferimento 50.40% ===');
  console.log('condizione'.padEnd(44)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(44)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.CAPFAIL) {
  // Dove il CAPOLINEA G sbaglia, nelle sue condizioni migliori:
  // capolinea unico, e' G, linea viva e timely, e il mercato va dall'altra parte.
  const LYM = require('./liuyao.js');
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const casi=[];
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const bazi=[r.yearBranchUsed, r.monthBranchUsed, r.dayBranchUsed];
    const vivo=l=>!['legata','rotta','dormiente','eliminata','autocombinata'].includes(l.stato);
    const vivi=R.linee.filter(vivo);
    const elsVivi=new Set(vivi.map(l=>l.el).concat(bazi.map(b=>WX[b])));
    const cap=vivi.filter(l=>{
      const riceve=Array.from(elsVivi).some(e=>GEN[e]===l.el && e!==l.el);
      const cede=Array.from(elsVivi).some(e=>GEN[l.el]===e);
      return riceve && !cede; });
    if (cap.length!==1 || cap[0].par!=='G') continue;
    const g=cap[0], mEl=WX[r.monthBranchUsed], st=stagLoc(g.el,mEl);
    if (!(st==='旺'||st==='相')) continue;              // condizione migliore: timely
    const dir=g.pos<=3?'SHORT':'LONG';
    const pnl=dir==='LONG'?r.move:-r.move;
    if (pnl>=0) continue;
    casi.push({r,R,g,dir,pnl,st});
  }
  casi.sort((a,b)=>a.pnl-b.pnl);
  console.log('\n=== CAPOLINEA G TIMELY CHE SBAGLIA ===  perdenti: '+casi.length);
  for (const c of casi.slice(0,2)) {
    const r=c.r, R=c.R;
    console.log('\n────────────────────────────────────────');
    console.log(r.cross+'  '+r.date+'   seme '+r.seedUsed+'   sup '+r.sup+' inf '+r.inf+' mutante L'+r.linea);
    console.log('giorno '+r.dayStemUsed+r.dayBranchUsed+' · mese '+r.monthBranchUsed+' · anno '+r.yearBranchUsed+
                '   palazzo '+R.palName+' ('+R.palElIt+')   vuoti '+R.vuoti.join(''));
    console.log('CAPOLINEA: L'+c.g.pos+' 官鬼 '+c.g.ramo+' '+c.g.elIt+' ['+c.st+'] → '+c.dir);
    console.log('mutante L'+R.mutante.pos+': '+R.mutante.ramoDep+' → '+R.mutante.ramoArr+
                '  ('+R.mutante.casoLabel+')');
    console.log('MERCATO: '+(r.move>0?'SALE':'SCENDE')+' '+Math.abs(r.move).toFixed(0)+
                ' pip → il capolinea perde '+Math.abs(c.pnl).toFixed(0)+' pip');
    for(let k=6;k>=1;k--){const x=R.linee[k-1];
      const st2=stagLoc(x.el,WX[r.monthBranchUsed]);
      console.log('  L'+x.pos+' '+(x.yang?'▬▬▬':'▬ ▬')+' '+(x.bestia?x.bestia.cn:'--')+' '+x.parCn+' '+x.ramo+' '+x.elIt+
        (x.isShi?' 世':'')+(x.isYing?' 應':'')+(x.isMobile?' ✸':'')+(x.vuoto?' 空':'')+(x.isTaiSui?' 太歲':'')+
        (x.ramo===r.dayBranchUsed?' ←giorno':'')+((R.anDong||{})[x.pos]?' 暗動→'+R.anDong[x.pos].arr:'')+
        ' ['+x.stato+' '+st2+']'+(x.fushen?'  伏:'+x.fushen.parCn+x.fushen.b:''));}
  }
}

if (process.env.PROGR) {
  // 進神 / 退神 (Edu, 13/08/2026, da EURGBP 18/03/2020)
  // La mobile che si muove in un ramo dello STESSO elemento: avanza (oraria) o retrocede
  // (antioraria). Chi AVANZA vince -> direzione dalla sua posizione.
  // Chi RETROCEDE perde -> vince il trigramma OPPOSTO.
  // Variante: il clash del giorno sull'arrivo bloccherebbe il movimento, MA se chi clasha
  // e' debole e la linea che si muove e' forte, il movimento avviene lo stesso.
  const LYM = require('./liuyao.js');
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const forte=s=>s==='旺'||s==='相';
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const pr = R.mutante.progressione; if (!pr) continue;
    const mob = R.linee[R.mutante.pos-1];
    const mEl = WX[r.monthBranchUsed];
    const suo = mob.pos<=3?'SHORT':'LONG';
    const opp = suo==='LONG'?'SHORT':'LONG';
    const dir = pr==='avanzante' ? suo : opp;      // avanza vince · retrocede perde
    add(pr==='avanzante' ? 'A. 進神 avanzante — vince lui'
                         : 'B. 退神 retrocedente — vince l opposto', dir, r);
    // forza: la linea mobile e' forte in stagione?
    const stMob = stagLoc(mob.el, mEl);
    if (forte(stMob)) add('  '+pr+' · mobile FORTE', dir, r);
    else add('  '+pr+' · mobile debole', dir, r);
    // il caso di Edu: clash del giorno sull'arrivo, ma chi clasha e' debole
    if (CLASH[r.dayBranchUsed]===R.mutante.ramoArr) {
      const stD = stagLoc(WX[r.dayBranchUsed], mEl);
      if (!forte(stD) && forte(stMob)) add('  '+pr+' · clash da giorno DEBOLE, mobile forte', dir, r);
      else add('  '+pr+' · clash da giorno non trascurabile', dir, r);
    }
    // il parente della mobile
    add('  '+pr+' · mobile e '+mob.par, dir, r);
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== 進神 / 退神 — riferimento 50.40% ===');
  console.log('condizione'.padEnd(50)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(50)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.PROGR2) {
  // Il clash sull'ARRIVO aumenta l'effetto di 進神/退神? Confronto pulito.
  const LYM = require('./liuyao.js');
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const forte=s=>s==='旺'||s==='相';
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const pr = R.mutante.progressione; if (!pr) continue;
    const mob = R.linee[R.mutante.pos-1];
    const suo = mob.pos<=3?'SHORT':'LONG', opp = suo==='LONG'?'SHORT':'LONG';
    const dir = pr==='avanzante' ? suo : opp;
    const A = R.mutante.ramoArr, D = r.dayBranchUsed;
    const clashArr = CLASH[D]===A;
    const clashPart = CLASH[D]===R.mutante.ramoDep;
    const et = pr==='退神 retro' ? pr : (pr==='avanzante'?'進神':'退神');
    add(et+' · '+(clashArr?'ARRIVO clashato dal giorno':'arrivo NON clashato'), dir, r);
    if (!clashArr) add(et+' · '+(clashPart?'partenza clashata':'niente clash dal giorno'), dir, r);
    // clash dall'anno timely sull'arrivo
    const stA = stagLoc(WX[r.yearBranchUsed], WX[r.monthBranchUsed]);
    if (CLASH[r.yearBranchUsed]===A && forte(stA)) add(et+' · arrivo clashato dall ANNO forte', dir, r);
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== IL CLASH SULL ARRIVO AUMENTA L EFFETTO? — riferimento 50.40% ===');
  console.log('condizione'.padEnd(48)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(48)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.PROGRFAIL) {
  // Dove 退神/進神 sbaglia nelle condizioni migliori: arrivo clashato dal giorno,
  // mobile forte in stagione -- cioe' la cella al 65-67% -- e il mercato va contro.
  const LYM = require('./liuyao.js');
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const casi=[];
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const pr=R.mutante.progressione; if(!pr) continue;
    if (CLASH[r.dayBranchUsed]!==R.mutante.ramoArr) continue;   // la cella forte
    const mob=R.linee[R.mutante.pos-1];
    const suo=mob.pos<=3?'SHORT':'LONG', opp=suo==='LONG'?'SHORT':'LONG';
    const dir = pr==='avanzante'?suo:opp;
    const pnl = dir==='LONG'?r.move:-r.move;
    if (pnl>=0) continue;
    casi.push({r,R,pr,mob,dir,pnl});
  }
  casi.sort((a,b)=>a.pnl-b.pnl);
  console.log('\n=== PROGRESSIONE CON ARRIVO CLASHATO CHE SBAGLIA ===  perdenti: '+casi.length+' su 47');
  for (const c of casi.slice(0,2)) {
    const r=c.r, R=c.R;
    console.log('\n────────────────────────────────────────');
    console.log(r.cross+'  '+r.date+'   seme '+r.seedUsed+'   sup '+r.sup+' inf '+r.inf+' mutante L'+r.linea);
    console.log('giorno '+r.dayStemUsed+r.dayBranchUsed+' · mese '+r.monthBranchUsed+' · anno '+r.yearBranchUsed+
                '   palazzo '+R.palName+' ('+R.palElIt+')   vuoti '+R.vuoti.join(''));
    console.log('mutante L'+R.mutante.pos+': '+R.mutante.ramoDep+' → '+R.mutante.ramoArr+
                '   '+c.pr.toUpperCase()+'   (arrivo clashato dal giorno '+r.dayStemUsed+r.dayBranchUsed+')');
    console.log('LY: la mobile e a L'+c.mob.pos+' ('+(c.mob.pos<=3?'inferiore':'superiore')+'), '+
                c.pr+' → vince '+(c.pr==='avanzante'?'lei':'l opposto')+' → '+c.dir);
    console.log('MERCATO: '+(r.move>0?'SALE':'SCENDE')+' '+Math.abs(r.move).toFixed(0)+
                ' pip → perde '+Math.abs(c.pnl).toFixed(0)+' pip');
    for(let k=6;k>=1;k--){const x=R.linee[k-1];
      const st=stagLoc(x.el,WX[r.monthBranchUsed]);
      console.log('  L'+x.pos+' '+(x.yang?'▬▬▬':'▬ ▬')+' '+(x.bestia?x.bestia.cn:'--')+' '+x.parCn+' '+x.ramo+' '+x.elIt+
        (x.isShi?' 世':'')+(x.isYing?' 應':'')+(x.isMobile?' ✸':'')+(x.vuoto?' 空':'')+(x.isTaiSui?' 太歲':'')+
        (x.ramo===r.dayBranchUsed?' ←giorno':'')+((R.anDong||{})[x.pos]?' 暗動→'+R.anDong[x.pos].arr:'')+
        ' ['+x.stato+' '+st+']'+(x.fushen?'  伏:'+x.fushen.parCn+x.fushen.b:''));}
  }
}

if (process.env.CTX) {
  const [cx,dt] = process.env.CTX.split(' ');
  const r = rows.find(x=>x.cross===cx && x.date===dt);
  if (!r) { console.log('carta non trovata'); }
  else {
    console.log('\n=== CONTESTO DI TREND — '+cx+' '+dt+' ===');
    console.log('EMA: '+(r.emaDir==='up'?'RIALZISTA':'RIBASSISTA')+'   barre di corsa (emaRun): '+r.emaRun);
    console.log('PB: '+(r.emaDir==='up'?(r.finale?'LONG':'SHORT'):(r.finale?'SHORT':'LONG'))+
                (r.finale?' (segue)':' (non segue)')+'   → '+r.pnl.toFixed(0)+' pip');
    console.log('movimento del giorno: '+r.move.toFixed(0)+' pip');
    // giorni vicini dello stesso cross
    const vic = rows.filter(x=>x.cross===cx).sort((a,b)=>a.date<b.date?-1:1);
    const i = vic.findIndex(x=>x.date===dt);
    console.log('\ngiorni vicini (stesso cross):');
    for (let k=Math.max(0,i-5); k<=Math.min(vic.length-1,i+5); k++){
      const v=vic[k];
      console.log('  '+(k===i?'→ ':'  ')+v.date+'  EMA '+(v.emaDir==='up'?'su  ':'giu ')+
        ' run '+String(v.emaRun).padStart(3)+'   movimento '+v.move.toFixed(0).padStart(6)+' pip');
    }
  }
}

if (process.env.RETROBLOC) {
  // A) 退神 IMPEDITO DAL TAI SUI (Edu, 13/08/2026, da EURJPY 13/06/2023)
  //    La mobile vuole retrocedere ma il Tai Sui CLASHA LA PARTENZA: non potendo
  //    retrocedere, prosegue -> la direzione resta quella della SUA posizione.
  // B) G AUTOPENALIZZATO DAL MESE (自刑): il mese, di norma poco interventista, penalizza
  //    G quando il flusso del qi lo carica (rami che generano l'elemento del mese).
  const LYM = require('./liuyao.js');
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const AUTOP=['辰','午','酉','亥'];
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const mob=R.linee[R.mutante.pos-1];
    const suo=mob.pos<=3?'SHORT':'LONG', opp=suo==='LONG'?'SHORT':'LONG';
    const Y=r.yearBranchUsed, Mo=r.monthBranchUsed, D=r.dayBranchUsed;
    // ---- A ----
    if (R.mutante.progressione==='retrocedente') {
      const bloccatoTS = CLASH[Y]===R.mutante.ramoDep;
      if (bloccatoTS) {
        add('A1. 退神 BLOCCATO dal Tai Sui → prosegue (sua posizione)', suo, r);
        add('A2. 退神 bloccato dal Tai Sui — se invece si applicasse l opposto', opp, r);
      } else {
        add('A3. 退神 libero → vince l opposto', opp, r);
      }
    }
    // ---- B ----
    const Gs = R.linee.filter(l=>l.par==='G');
    const gAuto = Gs.filter(l=>l.ramo===Mo && AUTOP.includes(l.ramo));
    if (gAuto.length===1) {
      const g=gAuto[0];
      // il flusso carica il mese? rami che generano l'elemento del mese
      const carica = [Y,D].filter(b=>GEN[WX[b]]===WX[Mo]).length;
      const dirG = g.pos<=3?'SHORT':'LONG';
      add('B1. G autopenalizzato dal mese — direzione di G', dirG, r);
      add('B2. G autopenalizzato dal mese — direzione OPPOSTA', dirG==='LONG'?'SHORT':'LONG', r);
      if (carica>=1) add('B3. ... e il flusso carica il mese — OPPOSTA', dirG==='LONG'?'SHORT':'LONG', r);
      if (carica>=2) add('B4. ... doppio carico sul mese — OPPOSTA', dirG==='LONG'?'SHORT':'LONG', r);
    }
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== 退神 BLOCCATO DAL TAI SUI · G AUTOPENALIZZATO DAL MESE — rif. 50.40% ===');
  console.log('condizione'.padEnd(58)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(58)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.DUEFAIL) {
  // Carte dove CAPOLINEA G e PROGRESSIONE indicano la STESSA direzione e sbagliano entrambe.
  const LYM = require('./liuyao.js');
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const AUTOP=['辰','午','酉','亥'];
  const casi=[];
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const bazi=[r.yearBranchUsed,r.monthBranchUsed,r.dayBranchUsed];
    const vivo=l=>!['legata','rotta','dormiente','eliminata','autocombinata'].includes(l.stato);
    // capolinea G
    const vivi=R.linee.filter(vivo);
    const els=new Set(vivi.map(l=>l.el).concat(bazi.map(b=>WX[b])));
    const cap=vivi.filter(l=>{const ric=Array.from(els).some(e=>GEN[e]===l.el&&e!==l.el);
      const ced=Array.from(els).some(e=>GEN[l.el]===e); return ric&&!ced;});
    if (cap.length!==1 || cap[0].par!=='G') continue;
    const dirCap = cap[0].pos<=3?'SHORT':'LONG';
    // progressione (con l'eccezione Tai Sui gia' fissata)
    const pr=R.mutante.progressione; if(!pr) continue;
    const mob=R.linee[R.mutante.pos-1];
    const suo=mob.pos<=3?'SHORT':'LONG', opp=suo==='LONG'?'SHORT':'LONG';
    let dirPr;
    if (pr==='avanzante') dirPr=suo;
    else dirPr = (CLASH[r.yearBranchUsed]===R.mutante.ramoDep) ? suo : opp;
    if (dirCap!==dirPr) continue;                      // devono CONCORDARE
    // escludo il G autopenalizzato dal mese con doppio carico (regola 25)
    const gA=R.linee.filter(l=>l.par==='G'&&l.ramo===r.monthBranchUsed&&AUTOP.includes(l.ramo));
    if (gA.length) continue;
    const pnl = dirCap==='LONG'?r.move:-r.move;
    if (pnl>=0) continue;
    casi.push({r,R,cap:cap[0],mob,pr,dir:dirCap,pnl});
  }
  casi.sort((a,b)=>a.pnl-b.pnl);
  console.log('\n=== CAPOLINEA G E PROGRESSIONE CONCORDI, ENTRAMBE SBAGLIATE ===  carte: '+casi.length);
  for (const c of casi.slice(0,2)) {
    const r=c.r, R=c.R;
    console.log('\n────────────────────────────────────────');
    console.log(r.cross+'  '+r.date+'   seme '+r.seedUsed+'   sup '+r.sup+' inf '+r.inf+' mutante L'+r.linea);
    console.log('giorno '+r.dayStemUsed+r.dayBranchUsed+' · mese '+r.monthBranchUsed+' · anno '+r.yearBranchUsed+
                '   palazzo '+R.palName+' ('+R.palElIt+')   vuoti '+R.vuoti.join(''));
    console.log('CAPOLINEA: L'+c.cap.pos+' 官鬼 '+c.cap.ramo+' ['+stagLoc(c.cap.el,WX[r.monthBranchUsed])+'] → '+c.dir);
    console.log('PROGRESSIONE: L'+R.mutante.pos+' '+R.mutante.ramoDep+'→'+R.mutante.ramoArr+
                ' '+c.pr+' → '+c.dir+'   (concordi)');
    console.log('MERCATO: '+(r.move>0?'SALE':'SCENDE')+' '+Math.abs(r.move).toFixed(0)+
                ' pip → perdono '+Math.abs(c.pnl).toFixed(0)+' pip');
    console.log('EMA '+(r.emaDir==='up'?'su':'giu')+' run '+r.emaRun+
                '   PB: '+(r.emaDir==='up'?(r.finale?'LONG':'SHORT'):(r.finale?'SHORT':'LONG'))+' → '+r.pnl.toFixed(0)+' pip');
    for(let k=6;k>=1;k--){const x=R.linee[k-1];
      const st=stagLoc(x.el,WX[r.monthBranchUsed]);
      console.log('  L'+x.pos+' '+(x.yang?'▬▬▬':'▬ ▬')+' '+(x.bestia?x.bestia.cn:'--')+' '+x.parCn+' '+x.ramo+' '+x.elIt+
        (x.isShi?' 世':'')+(x.isYing?' 應':'')+(x.isMobile?' ✸':'')+(x.vuoto?' 空':'')+(x.isTaiSui?' 太歲':'')+
        (x.ramo===r.dayBranchUsed?' ←giorno':'')+((R.anDong||{})[x.pos]?' 暗動→'+R.anDong[x.pos].arr:'')+
        ' ['+x.stato+' '+st+']'+(x.fushen?'  伏:'+x.fushen.parCn+x.fushen.b:''));}
  }
}

if (process.env.ARRVUOTO) {
  // L'ARRIVO VUOTO (Edu, 13/08/2026, da EURJPY 06/03/2025)
  // La progressione che approda a un ramo VUOTO non produce nulla: il movimento non
  // arriva da nessuna parte. Il clash che potrebbe risvegliare il vuoto vale solo se
  // viene dal GIORNO (o dall'anno 旺/相) -- dal MESE non basta (regola 1).
  const LYM = require('./liuyao.js');
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const forte=s=>s==='旺'||s==='相';
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const pr=R.mutante.progressione; if(!pr) continue;
    const mob=R.linee[R.mutante.pos-1];
    const suo=mob.pos<=3?'SHORT':'LONG', opp=suo==='LONG'?'SHORT':'LONG';
    const Y=r.yearBranchUsed, D=r.dayBranchUsed, A=R.mutante.ramoArr;
    // direzione con le regole gia' fissate (incl. eccezione Tai Sui sul 退神)
    let dirBase;
    if (pr==='avanzante') dirBase=suo;
    else dirBase=(CLASH[Y]===R.mutante.ramoDep)?suo:opp;
    const arrVuoto = R.vuoti.indexOf(A)>=0;
    const stY=stagLoc(WX[Y],WX[r.monthBranchUsed]);
    const risveglio = (CLASH[D]===A) || (CLASH[Y]===A && forte(stY));   // clash EFFETTIVO
    if (!arrVuoto) { add('1. arrivo PIENO — regola normale', dirBase, r); }
    else {
      if (risveglio) add('2. arrivo VUOTO ma risvegliato (giorno/anno forte) — normale', dirBase, r);
      else {
        add('3a. arrivo VUOTO non risvegliato — regola normale', dirBase, r);
        add('3b. arrivo VUOTO non risvegliato — direzione INVERTITA', dirBase==='LONG'?'SHORT':'LONG', r);
        // solo quando il mese clasha (il caso della carta: clash inefficace)
        if (CLASH[r.monthBranchUsed]===A)
          add('4. ... e il mese clasha invano — INVERTITA', dirBase==='LONG'?'SHORT':'LONG', r);
      }
    }
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== ARRIVO VUOTO NELLA PROGRESSIONE — rif. 50.40% ===');
  console.log('condizione'.padEnd(56)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(56)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.VUOTOBOC) {
  // Carte che bocciano la regola "arrivo vuoto -> movimento nullo, direzione invertita":
  // arrivo VUOTO, non risvegliato da giorno/anno, e la regola NORMALE ha ragione
  // (quindi invertire avrebbe perso). Scelgo le piu' nette: gia' 進神/退神, movimento grosso,
  // e -- come nella carta di Edu -- il mese che clasha invano l'arrivo vuoto.
  const LYM = require('./liuyao.js');
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const forte=s=>s==='旺'||s==='相';
  const casi=[];
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const pr=R.mutante.progressione; if(!pr) continue;
    const Y=r.yearBranchUsed, D=r.dayBranchUsed, Mo=r.monthBranchUsed, A=R.mutante.ramoArr;
    if (R.vuoti.indexOf(A)<0) continue;                      // arrivo dev'essere vuoto
    const stY=stagLoc(WX[Y],WX[Mo]);
    if ((CLASH[D]===A)||(CLASH[Y]===A&&forte(stY))) continue; // non risvegliato
    const mob=R.linee[R.mutante.pos-1];
    const suo=mob.pos<=3?'SHORT':'LONG', opp=suo==='LONG'?'SHORT':'LONG';
    let dir; if(pr==='avanzante') dir=suo; else dir=(CLASH[Y]===R.mutante.ramoDep)?suo:opp;
    const pnl = dir==='LONG'?r.move:-r.move;
    if (pnl<=0) continue;                                     // la regola NORMALE deve vincere
    const meseInvano = (CLASH[Mo]===A);
    casi.push({r,R,pr,mob,dir,pnl,meseInvano});
  }
  // priorita' alle carte col mese che clasha invano (il caso esatto di Edu), poi al pnl
  casi.sort((a,b)=> (b.meseInvano?1:0)-(a.meseInvano?1:0) || b.pnl-a.pnl);
  console.log('\n=== CARTE CHE BOCCIANO "ARRIVO VUOTO = MOVIMENTO NULLO" ===');
  console.log('(arrivo vuoto non risvegliato, la regola normale VINCE, invertire avrebbe perso)');
  console.log('totale: '+casi.length+'   di cui col mese che clasha invano: '+casi.filter(c=>c.meseInvano).length+'\n');
  for (const c of casi.slice(0,2)) {
    const r=c.r, R=c.R;
    console.log('────────────────────────────────────────');
    console.log(r.cross+'  '+r.date+'   seme '+r.seedUsed+'   sup '+r.sup+' inf '+r.inf+' mutante L'+r.linea);
    console.log('giorno '+r.dayStemUsed+r.dayBranchUsed+' · mese '+r.monthBranchUsed+' · anno '+r.yearBranchUsed+
                '   palazzo '+R.palName+' ('+R.palElIt+')   vuoti '+R.vuoti.join(''));
    console.log('mutante L'+R.mutante.pos+': '+R.mutante.ramoDep+' → '+R.mutante.ramoArr+
                '  '+c.pr.toUpperCase()+'   ARRIVO VUOTO'+(c.meseInvano?'  · il mese '+r.monthBranchUsed+' lo clasha INVANO':''));
    console.log('regola normale → '+c.dir+'   MERCATO: '+(r.move>0?'SALE':'SCENDE')+' '+
                Math.abs(r.move).toFixed(0)+' pip → la regola VINCE '+c.pnl.toFixed(0)+' pip');
    console.log('   (invertendo, come vorrebbe la regola dell\'arrivo vuoto, si perderebbero '+c.pnl.toFixed(0)+' pip)');
    console.log('EMA '+(r.emaDir==='up'?'su':'giu')+' run '+r.emaRun);
    for(let k=6;k>=1;k--){const x=R.linee[k-1];
      const st=stagLoc(x.el,WX[r.monthBranchUsed]);
      console.log('  L'+x.pos+' '+(x.yang?'▬▬▬':'▬ ▬')+' '+(x.bestia?x.bestia.cn:'--')+' '+x.parCn+' '+x.ramo+' '+x.elIt+
        (x.isShi?' 世':'')+(x.isYing?' 應':'')+(x.isMobile?' ✸':'')+(x.vuoto?' 空':'')+(x.isTaiSui?' 太歲':'')+
        (x.ramo===r.dayBranchUsed?' ←giorno':'')+' ['+x.stato+' '+st+']'+
        (x.fushen?'  伏:'+x.fushen.parCn+x.fushen.b:''));}
    console.log('');
  }
}

if (process.env.MOBDISTR) {
  // LA MOBILE DISTRUTTA (Edu, 13/08/2026, da USDCAD 03/09/2020)
  // Conflitto nel modulo: 動不為空 tiene viva la mutante anche quando e' VUOTA, CLASHATA
  // dal giorno e UNTIMELY -- ma la regola 3 (vuoto+clash+untimely = ELIMINATA) dice che
  // in quel caso e' distrutta. Se la mobile e' distrutta, la lettura passa alla linea
  // viva piu' forte (timely, non vuota, non clashata).
  const LYM = require('./liuyao.js');
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const forte=s=>s==='旺'||s==='相';
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const D=r.dayBranchUsed, Mo=r.monthBranchUsed, mEl=WX[Mo];
    const mob=R.linee[R.mutante.pos-1];
    const dep=R.mutante.ramoDep;
    const stMob=stagLoc(mob.el,mEl);
    const distrutta = (R.vuoti.indexOf(dep)>=0) && (CLASH[D]===dep) && !forte(stMob);
    if (!distrutta) continue;
    // chi vince: la linea viva piu' forte (timely, non vuota, non clashata dal giorno)
    const cand = R.linee.filter(l=>l.pos!==mob.pos && R.vuoti.indexOf(l.ramo)<0 &&
                  CLASH[D]!==l.ramo && forte(stagLoc(l.el,mEl)) &&
                  !['legata','rotta','dormiente','eliminata','autocombinata'].includes(l.stato));
    add('0. mobile distrutta — quante carte', 'LONG', r);   // solo per contare
    if (cand.length===1) {
      const w=cand[0];
      add('1. vince la linea viva piu forte (unica)', w.pos<=3?'SHORT':'LONG', r);
      add('1b. ... ed e '+w.par, w.pos<=3?'SHORT':'LONG', r);
    } else if (cand.length>1) {
      const b=cand.filter(l=>l.pos<=3).length, a=cand.length-b;
      if (b!==a) add('2. piu forti concordi — maggioranza', b>a?'SHORT':'LONG', r);
      // preferenza a W, poi G
      const w2 = cand.find(l=>l.par==='W') || cand.find(l=>l.par==='G');
      if (w2) add('3. fra i forti: prima W poi G', w2.pos<=3?'SHORT':'LONG', r);
    }
    // confronto: cosa darebbe la progressione se la applicassimo lo stesso
    const pr=R.mutante.progressione;
    if (pr) { const suo=mob.pos<=3?'SHORT':'LONG', opp=suo==='LONG'?'SHORT':'LONG';
      add('4. (confronto) progressione applicata comunque', pr==='avanzante'?suo:opp, r); }
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== LA MOBILE DISTRUTTA (vuota + clash del giorno + untimely) — rif. 50.40% ===');
  console.log('condizione'.padEnd(48)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(48)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.MOBDISTR2) {
  // Chi legge quando la mobile e' distrutta, applicando le regole GIA' registrate:
  //   - C e B non agiscono (reg. 12/13): candidati solo G, W, P
  //   - autopenalita' 自刑 dal giorno esclude la linea (reg. 4)
  //   - gerarchia G -> W -> P (reg. 3), preferendo timely e 日辰臨爻
  const LYM = require('./liuyao.js');
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const forte=s=>s==='旺'||s==='相';
  const AUTOP=['辰','午','酉','亥'];
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const D=r.dayBranchUsed, mEl=WX[r.monthBranchUsed];
    const mob=R.linee[R.mutante.pos-1], dep=R.mutante.ramoDep;
    const distrutta=(R.vuoti.indexOf(dep)>=0)&&(CLASH[D]===dep)&&!forte(stagLoc(mob.el,mEl));
    if (!distrutta) continue;
    const vivo=l=>!['legata','rotta','dormiente','eliminata','autocombinata'].includes(l.stato);
    const autoPen=l=> l.ramo===D && AUTOP.includes(l.ramo);
    const ok = l => l.pos!==mob.pos && vivo(l) && R.vuoti.indexOf(l.ramo)<0 &&
                    CLASH[D]!==l.ramo && !autoPen(l) && ['G','W','P'].includes(l.par);
    const cand = R.linee.filter(ok);
    const pick = par => { const g=cand.filter(l=>l.par===par);
      return g.find(l=>l.ramo===D) || g.find(l=>forte(stagLoc(l.el,mEl))) || g[0] || null; };
    const w = pick('G') || pick('W') || pick('P');
    if (!w) continue;
    const dir = w.pos<=3?'SHORT':'LONG';
    add('A. gerarchia G→W→P (C e B esclusi, 自刑 esclusa)', dir, w===null?r:r);
    add('B. ... e il vincitore e '+w.par, dir, r);
    if (forte(stagLoc(w.el,mEl))) add('C. ... vincitore TIMELY', dir, r);
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== MOBILE DISTRUTTA: chi legge, con le regole registrate — rif. 50.40% ===');
  console.log('condizione'.padEnd(50)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(50)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.TUTTE) {
  // LETTURA CON TUTTE LE REGOLE REGISTRATE, in ordine di precedenza:
  //  1. mobile distrutta (vuota+clash giorno+untimely) -> non si legge; legge la linea TIMELY
  //     (C e B esclusi, 自刑 esclusa)
  //  2. altrimenti progressione 進神/退神 (con eccezione: 退神 bloccato dal Tai Sui prosegue)
  //  3. altrimenti capolinea unico del flusso
  // Poi cerco le carte dove la lettura risultante SBAGLIA di piu'.
  const LYM = require('./liuyao.js');
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const forte=s=>s==='旺'||s==='相';
  const AUTOP=['辰','午','酉','亥'];
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  const casi=[];
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const D=r.dayBranchUsed, Y=r.yearBranchUsed, mEl=WX[r.monthBranchUsed];
    const mob=R.linee[R.mutante.pos-1], dep=R.mutante.ramoDep;
    const vivo=l=>!['legata','rotta','dormiente','eliminata','autocombinata'].includes(l.stato);
    const autoPen=l=> l.ramo===D && AUTOP.includes(l.ramo);
    let dir=null, via=null, hold=null;
    const distrutta=(R.vuoti.indexOf(dep)>=0)&&(CLASH[D]===dep)&&!forte(stagLoc(mob.el,mEl));
    if (distrutta) {
      const cand=R.linee.filter(l=>l.pos!==mob.pos && vivo(l) && R.vuoti.indexOf(l.ramo)<0 &&
        CLASH[D]!==l.ramo && !autoPen(l) && !['C','B'].includes(l.par) && forte(stagLoc(l.el,mEl)));
      if (cand.length===1){ hold=cand[0]; dir=hold.pos<=3?'SHORT':'LONG'; via='mobile distrutta → timely'; }
    }
    if (!dir && R.mutante.progressione) {
      const pr=R.mutante.progressione, suo=mob.pos<=3?'SHORT':'LONG', opp=suo==='LONG'?'SHORT':'LONG';
      dir = pr==='avanzante' ? suo : (CLASH[Y]===dep ? suo : opp);
      via = pr==='avanzante'?'進神':'退神'; hold=mob;
    }
    if (!dir) {
      const vivi=R.linee.filter(vivo);
      const els=new Set(vivi.map(l=>l.el).concat([Y,r.monthBranchUsed,D].map(b=>WX[b])));
      const cap=vivi.filter(l=>{const ric=Array.from(els).some(e=>GEN[e]===l.el&&e!==l.el);
        const ced=Array.from(els).some(e=>GEN[l.el]===e); return ric&&!ced;});
      if (cap.length===1 && cap[0].par==='G'){ hold=cap[0]; dir=hold.pos<=3?'SHORT':'LONG'; via='capolinea G'; }
    }
    if (!dir) continue;
    add('LETTURA COMPLETA (tutte le regole)', dir, r);
    add('  via: '+via, dir, r);
    const pnl=dir==='LONG'?r.move:-r.move;
    if (pnl<0) casi.push({r,R,dir,pnl,via,hold});
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== LETTURA CON TUTTE LE REGOLE — rif. 50.40% ===');
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(38)+'n='+String(n).padStart(5)+'  tutto '+pc(d.tutto)+
      '  recente '+pc(d.recente)+'  vecchio '+pc(d.vecchio)+
      '  pip '+d.tutto.p.toFixed(0)+'  pip/tr '+(d.tutto.p/n).toFixed(2)); }
  casi.sort((a,b)=>a.pnl-b.pnl);
  const c=casi[0]; const r=c.r, R=c.R;
  console.log('\n=== LA CARTA CHE SBAGLIA DI PIÙ ===');
  console.log(r.cross+'  '+r.date+'   seme '+r.seedUsed+'   sup '+r.sup+' inf '+r.inf+' mutante L'+r.linea);
  console.log('giorno '+r.dayStemUsed+r.dayBranchUsed+' · mese '+r.monthBranchUsed+' · anno '+r.yearBranchUsed+
              '   palazzo '+R.palName+' ('+R.palElIt+')   vuoti '+R.vuoti.join(''));
  console.log('via: '+c.via+'   regge L'+c.hold.pos+' '+c.hold.parCn+' '+c.hold.ramo+' → '+c.dir);
  console.log('mutante L'+R.mutante.pos+': '+R.mutante.ramoDep+' → '+R.mutante.ramoArr+
              (R.mutante.progressione?'  '+R.mutante.progressione.toUpperCase():'')+'  ('+R.mutante.casoLabel+')');
  console.log('MERCATO: '+(r.move>0?'SALE':'SCENDE')+' '+Math.abs(r.move).toFixed(0)+' pip → perde '+Math.abs(c.pnl).toFixed(0));
  console.log('EMA '+(r.emaDir==='up'?'su':'giu')+' run '+r.emaRun+'   PB: '+
    (r.emaDir==='up'?(r.finale?'LONG':'SHORT'):(r.finale?'SHORT':'LONG'))+' → '+r.pnl.toFixed(0)+' pip');
  for(let k=6;k>=1;k--){const x=R.linee[k-1];
    const st=stagLoc(x.el,WX[r.monthBranchUsed]);
    console.log('  L'+x.pos+' '+(x.yang?'▬▬▬':'▬ ▬')+' '+(x.bestia?x.bestia.cn:'--')+' '+x.parCn+' '+x.ramo+' '+x.elIt+
      (x.isShi?' 世':'')+(x.isYing?' 應':'')+(x.isMobile?' ✸':'')+(x.vuoto?' 空':'')+(x.isTaiSui?' 太歲':'')+
      (x.ramo===r.dayBranchUsed?' ←giorno':'')+((R.anDong||{})[x.pos]?' 暗動→'+R.anDong[x.pos].arr:'')+
      ' ['+x.stato+' '+st+']'+(x.fushen?'  伏:'+x.fushen.parCn+x.fushen.b:''));}
}

if (process.env.ANDONGAUTO) {
  // AUTOPENALITÀ DELLA LINEA IN 暗動 (Edu, 13/08/2026, da USDJPY 13/12/2023)
  // Una linea clashata dal giorno vuole muoversi; se sta nel trigramma che NON muta, il suo
  // "arrivo" e' lo stesso ramo: non va da nessuna parte e, se il ramo e' di autopenalita'
  // (辰 午 酉 亥), si penalizza. CHI NON VINCE PERDE (§25): il suo trigramma PERDE.
  const LYM = require('./liuyao.js');
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const forte=s=>s==='旺'||s==='相';
  const AUTOP=['辰','午','酉','亥'];
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const mEl=WX[r.monthBranchUsed];
    // linee in 暗動 il cui arrivo e' lo STESSO ramo (trigramma non mutante) e in 辰午酉亥
    const bloc=[];
    for (const p in (R.anDong||{})) {
      const pos=parseInt(p,10), l=R.linee[pos-1];
      if (R.anDong[p].arr !== l.ramo) continue;            // dev'essere lo stesso ramo
      if (!AUTOP.includes(l.ramo)) continue;               // dev'essere ramo di autopenalita'
      bloc.push(l);
    }
    if (bloc.length!==1) continue;
    const b=bloc[0];
    const suoTrig = b.pos<=3?'SHORT':'LONG';
    const perde   = suoTrig==='LONG'?'SHORT':'LONG';       // il suo trigramma PERDE
    add('A. 暗動 autopenalizzata → il suo trigramma PERDE', perde, r);
    add('B. (confronto) il suo trigramma vince', suoTrig, r);
    if (forte(stagLoc(b.el,mEl))) add('C. ... e la linea e FORTE (vibrante) → perde', perde, r);
    else add('D. ... e la linea e debole → perde', perde, r);
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== 暗動 AUTOPENALIZZATA — CHI NON VINCE PERDE — rif. 50.40% ===');
  console.log('condizione'.padEnd(50)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(50)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.CAPFAIL2) {
  // Il capolinea G sbaglia: applicando TUTTE le regole registrate a monte
  // (mobile distrutta, progressione), quindi arriva davvero al capolinea.
  const LYM = require('./liuyao.js');
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const forte=s=>s==='旺'||s==='相';
  const AUTOP=['辰','午','酉','亥'];
  const casi=[];
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const D=r.dayBranchUsed, Y=r.yearBranchUsed, mEl=WX[r.monthBranchUsed];
    const mob=R.linee[R.mutante.pos-1], dep=R.mutante.ramoDep;
    const vivo=l=>!['legata','rotta','dormiente','eliminata','autocombinata'].includes(l.stato);
    const distrutta=(R.vuoti.indexOf(dep)>=0)&&(CLASH[D]===dep)&&!forte(stagLoc(mob.el,mEl));
    if (distrutta) continue;
    if (R.mutante.progressione) continue;             // deve arrivare al capolinea
    const vivi=R.linee.filter(vivo);
    const els=new Set(vivi.map(l=>l.el).concat([Y,r.monthBranchUsed,D].map(b=>WX[b])));
    const cap=vivi.filter(l=>{const ric=Array.from(els).some(e=>GEN[e]===l.el&&e!==l.el);
      const ced=Array.from(els).some(e=>GEN[l.el]===e); return ric&&!ced;});
    if (cap.length!==1 || cap[0].par!=='G') continue;
    const g=cap[0];
    const dir=g.pos<=3?'SHORT':'LONG';
    const pnl=dir==='LONG'?r.move:-r.move;
    if (pnl>=0) continue;
    casi.push({r,R,g,dir,pnl});
  }
  casi.sort((a,b)=>a.pnl-b.pnl);
  console.log('\n=== IL CAPOLINEA G SBAGLIA ===  perdenti: '+casi.length+' su 264');
  const c=casi[0], r=c.r, R=c.R;
  console.log('\n'+r.cross+'  '+r.date+'   seme '+r.seedUsed+'   sup '+r.sup+' inf '+r.inf+' mutante L'+r.linea);
  console.log('giorno '+r.dayStemUsed+r.dayBranchUsed+' · mese '+r.monthBranchUsed+' · anno '+r.yearBranchUsed+
              '   palazzo '+R.palName+' ('+R.palElIt+')   vuoti '+R.vuoti.join(''));
  console.log('CAPOLINEA: L'+c.g.pos+' 官鬼 '+c.g.ramo+' '+c.g.elIt+
              ' ['+stagLoc(c.g.el,WX[r.monthBranchUsed])+'] → '+c.dir);
  console.log('mutante L'+R.mutante.pos+': '+R.mutante.ramoDep+' → '+R.mutante.ramoArr+
              '  ('+R.mutante.casoLabel+')');
  console.log('MERCATO: '+(r.move>0?'SALE':'SCENDE')+' '+Math.abs(r.move).toFixed(0)+' pip → perde '+Math.abs(c.pnl).toFixed(0));
  console.log('EMA '+(r.emaDir==='up'?'su':'giu')+' run '+r.emaRun+'   PB: '+
    (r.emaDir==='up'?(r.finale?'LONG':'SHORT'):(r.finale?'SHORT':'LONG'))+' → '+r.pnl.toFixed(0)+' pip');
  for(let k=6;k>=1;k--){const x=R.linee[k-1];
    const st=stagLoc(x.el,WX[r.monthBranchUsed]);
    console.log('  L'+x.pos+' '+(x.yang?'▬▬▬':'▬ ▬')+' '+(x.bestia?x.bestia.cn:'--')+' '+x.parCn+' '+x.ramo+' '+x.elIt+
      (x.isShi?' 世':'')+(x.isYing?' 應':'')+(x.isMobile?' ✸':'')+(x.vuoto?' 空':'')+(x.isTaiSui?' 太歲':'')+
      (x.ramo===r.dayBranchUsed?' ←giorno':'')+((R.anDong||{})[x.pos]?' 暗動→'+R.anDong[x.pos].arr:'')+
      ' ['+x.stato+' '+st+']'+(x.fushen?'  伏:'+x.fushen.parCn+x.fushen.b:''));}
}

if (process.env.DOPPIOCLASH) {
  // 暗動 CON DOPPIO CLASH — L'AUTOPENALITÀ È IMPEDITA (Edu, 13/08/2026, da USDJPY 16/01/2024)
  // Una linea in 暗動 il cui arrivo e' lo stesso ramo (trigramma non mutante) normalmente
  // si autopenalizza (§29) e il suo trigramma perde. MA se l'arrivo e' a sua volta clashato
  // -- doppio clash da giorno E anno -- l'autopenalita' e' impedita: la linea invece GENERA.
  // Direzione dalla posizione della linea generata.
  const LYM = require('./liuyao.js');
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const AUTOP=['辰','午','酉','亥'];
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const D=r.dayBranchUsed, Y=r.yearBranchUsed;
    const vivo=l=>!['legata','rotta','dormiente','eliminata','autocombinata'].includes(l.stato);
    const bloc=[];
    for (const p in (R.anDong||{})) {
      const pos=parseInt(p,10), l=R.linee[pos-1];
      if (R.anDong[p].arr!==l.ramo) continue;
      if (!AUTOP.includes(l.ramo)) continue;
      bloc.push(l);
    }
    if (bloc.length!==1) continue;
    const b=bloc[0];
    const doppio = (CLASH[D]===b.ramo) && (CLASH[Y]===b.ramo);
    const suo=b.pos<=3?'SHORT':'LONG', perde=suo==='LONG'?'SHORT':'LONG';
    if (!doppio) { add('A. clash SEMPLICE → autopenalità, il trigramma perde', perde, r); continue; }
    // doppio clash: l'autopenalita' e' impedita, la linea GENERA
    const gen=R.linee.filter(l=>l.pos!==b.pos && vivo(l) && GEN[b.el]===l.el);
    add('B. DOPPIO clash → (vecchia regola) il trigramma perde', perde, r);
    if (gen.length>=1) {
      const ba=gen.filter(l=>l.pos<=3).length, al=gen.length-ba;
      if (ba!==al) add('C. DOPPIO clash → genera: direzione della generata', ba>al?'SHORT':'LONG', r);
      if (gen.length===1) add('D. ... generata UNICA', gen[0].pos<=3?'SHORT':'LONG', r);
    }
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== 暗動 CON DOPPIO CLASH — rif. 50.40% ===');
  console.log('condizione'.padEnd(52)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(52)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.SANHUI) {
  // 三會 — COMBINAZIONI DIREZIONALI (Edu, 13/08/2026, da USDJPY 16/01/2024)
  //   寅卯辰 東方木局 · 巳午未 南方火局 · 申酉戌 西方金局 · 亥子丑 北方水局
  // Quando i tre rami sono presenti fra LINEE e BAZI, l'elemento diventa "vibrante" e le
  // linee di quell'elemento vincono senza bisogno di essere generate.
  // Direzione dalla posizione delle linee dell'elemento formato.
  const LYM = require('./liuyao.js');
  const HUI = [ {r:['寅','卯','辰'], el:'Wood'}, {r:['巳','午','未'], el:'Fire'},
                {r:['申','酉','戌'], el:'Metal'}, {r:['亥','子','丑'], el:'Water'} ];
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  let conta=0;
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const bazi=[r.yearBranchUsed,r.monthBranchUsed,r.dayBranchUsed];
    const tutti = new Set(R.linee.map(l=>l.ramo).concat(bazi));
    const formate = HUI.filter(h => h.r.every(x=>tutti.has(x)));
    if (formate.length!==1) continue;
    conta++;
    const h=formate[0];
    // linee dell'elemento formato
    const ln = R.linee.filter(l=>l.el===h.el);
    if (!ln.length) continue;
    const b=ln.filter(l=>l.pos<=3).length, a=ln.length-b;
    if (b===a) continue;
    const dir = b>a?'SHORT':'LONG';
    add('A. 三會 formata → direzione delle linee di quell elemento', dir, r);
    add('B. (confronto) direzione opposta', dir==='LONG'?'SHORT':'LONG', r);
    // la combinazione include il mese? (il mese la rende stagionale)
    if (h.r.includes(r.monthBranchUsed)) add('C. ... e il mese fa parte della 三會', dir, r);
    else add('D. ... senza il mese', dir, r);
    // il parente dell'elemento formato
    add('E. ... elemento formato = '+ln[0].par, dir, r);
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== 三會 COMBINAZIONI DIREZIONALI — rif. 50.40% ===   carte con una 三會: '+conta);
  console.log('condizione'.padEnd(54)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(54)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.SANHUI2) {
  // 三會 con l'ORA inclusa, ed escludendo le linee inservibili (autocombinate, legate).
  const LYM = require('./liuyao.js');
  const HUI=[{r:['寅','卯','辰'],el:'Wood'},{r:['巳','午','未'],el:'Fire'},
             {r:['申','酉','戌'],el:'Metal'},{r:['亥','子','丑'],el:'Water'}];
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const ora = LYM.oraDalSeme(r.seedUsed);
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed, ora);
    if (R.error) continue;
    const vivo=l=>!['legata','rotta','dormiente','eliminata','autocombinata'].includes(l.stato);
    const bazi=[r.yearBranchUsed,r.monthBranchUsed,r.dayBranchUsed];
    // rami disponibili: linee VIVE (le inservibili non contano) + bazi + ORA
    const usabili=new Set(R.linee.filter(vivo).map(l=>l.ramo).concat(bazi).concat([ora]));
    const form=HUI.filter(h=>h.r.every(x=>usabili.has(x)));
    if (form.length!==1) continue;
    const h=form[0];
    const ln=R.linee.filter(l=>l.el===h.el && vivo(l));
    if (!ln.length) continue;
    const b=ln.filter(l=>l.pos<=3).length, a=ln.length-b;
    if (b===a) continue;
    const dir=b>a?'SHORT':'LONG';
    const conMese=h.r.includes(r.monthBranchUsed);
    const conOra=h.r.includes(ora);
    add('A. 三會 (ora inclusa, linee vive)', dir, r);
    if (conMese) add('B. ... col MESE dentro', dir, r);
    if (conMese && conOra) add('C. ... col mese E l ora dentro', dir, r);
    if (conOra && !conMese) add('D. ... con l ora ma senza il mese', dir, r);
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== 三會 CON L ORA — rif. 50.40% ===');
  console.log('condizione'.padEnd(44)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(44)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.FUDRENA) {
  // G DRENATO DAL PROPRIO 伏神 (Edu, 13/08/2026, da USDJPY 16/01/2024)
  // Una linea forte puo' avere l'energia SPRECATA se il nascosto dietro di lei la drena
  // (la linea GENERA l'elemento del 伏神). Estensione ai 伏神 della scoperta su P (§12).
  const LYM = require('./liuyao.js');
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const D=r.dayBranchUsed, Y=r.yearBranchUsed, mEl=WX[r.monthBranchUsed];
    const vivo=l=>!['legata','rotta','dormiente','eliminata','autocombinata'].includes(l.stato);
    // capolinea G, come nella regola 20
    const vivi=R.linee.filter(vivo);
    const els=new Set(vivi.map(l=>l.el).concat([Y,r.monthBranchUsed,D].map(b=>WX[b])));
    const cap=vivi.filter(l=>{const ric=Array.from(els).some(e=>GEN[e]===l.el&&e!==l.el);
      const ced=Array.from(els).some(e=>GEN[l.el]===e); return ric&&!ced;});
    if (cap.length!==1 || cap[0].par!=='G') continue;
    const g=cap[0];
    const dir=g.pos<=3?'SHORT':'LONG';
    const drenato = g.fushen && GEN[g.el]===g.fushen.el;     // la linea genera il proprio nascosto
    add(drenato ? 'A. capolinea G DRENATO dal proprio 伏神'
                : 'B. capolinea G non drenato', dir, r);
    if (drenato) add('A2. ... direzione OPPOSTA (energia sprecata)', dir==='LONG'?'SHORT':'LONG', r);
    // stesso taglio su TUTTE le linee G (non solo capolinea), come controllo
    const gs=R.linee.filter(l=>l.par==='G' && vivo(l));
    if (gs.length===1) {
      const g2=gs[0], d2=g2.pos<=3?'SHORT':'LONG';
      const dr2 = g2.fushen && GEN[g2.el]===g2.fushen.el;
      add(dr2 ? 'C. ogni G unico vivo, DRENATO dal 伏神' : 'D. ogni G unico vivo, non drenato', d2, r);
    }
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== G DRENATO DAL PROPRIO 伏神 — rif. 50.40% ===');
  console.log('condizione'.padEnd(48)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(48)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.PVIS) {
  // P PRESENTE vs P NASCOSTO dietro il capolinea G.
  // §12: P nutrito da G e' sfavorevole. Ma li' P e' una LINEA PRESENTE.
  // Qui il P e' 伏神: non e' in campo, quindi non puo' assorbire davvero?
  const LYM = require('./liuyao.js');
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const D=r.dayBranchUsed, Y=r.yearBranchUsed;
    const vivo=l=>!['legata','rotta','dormiente','eliminata','autocombinata'].includes(l.stato);
    const vivi=R.linee.filter(vivo);
    const els=new Set(vivi.map(l=>l.el).concat([Y,r.monthBranchUsed,D].map(b=>WX[b])));
    const cap=vivi.filter(l=>{const ric=Array.from(els).some(e=>GEN[e]===l.el&&e!==l.el);
      const ced=Array.from(els).some(e=>GEN[l.el]===e); return ric&&!ced;});
    if (cap.length!==1 || cap[0].par!=='G') continue;
    const g=cap[0], dir=g.pos<=3?'SHORT':'LONG';
    const pNascosto = !!(g.fushen && g.fushen.par==='P');
    const pPresente = R.linee.some(l=>l.par==='P' && vivo(l));
    const chiave = (pNascosto?'P NASCOSTO dietro G':'nessun P dietro G') + ' · ' +
                   (pPresente?'P presente in carta':'P assente dalla carta');
    add(chiave, dir, r);
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== CAPOLINEA G: P NASCOSTO vs P PRESENTE — rif. 50.40% ===');
  console.log('condizione'.padEnd(56)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  const ord=Object.entries(M).sort((a,b)=>{const pa=a[1].tutto.w/(a[1].tutto.w+a[1].tutto.l),
    pb=b[1].tutto.w/(b[1].tutto.w+b[1].tutto.l); return pb-pa;});
  for(const [k,d] of ord){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(56)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.CASCATA) {
  // FLUSSO A CASCATA (Edu, 13/08/2026 — RITIRA e SOSTITUISCE §29)
  // Una linea NON mobile clashata, il cui ramo nell'esagramma futuro e' IDENTICO, non si
  // autopenalizza: CEDE ENERGIA a chi puo' prenderla, specialmente se vicinissima.
  // Si forma una cascata: L6 clashata alimenta L5, L5 clashata diventa operativa e alimenta
  // L4... La direzione viene dalla linea TERMINALE della cascata.
  const LYM = require('./liuyao.js');
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const bazi=[r.yearBranchUsed,r.monthBranchUsed,r.dayBranchUsed];
    const clashata = l => bazi.some(b=>CLASH[b]===l.ramo);
    const identica = l => { const a=(R.anDong||{})[l.pos];
      return (l.pos!==R.mutante.pos) && (a ? a.arr===l.ramo : true); };
    // sorgenti: linee clashate, non mobili, con ramo futuro identico
    const sorg = R.linee.filter(l=>l.pos!==R.mutante.pos && clashata(l) && identica(l));
    if (!sorg.length) continue;
    // cascata: ogni sorgente cede alla linea ADIACENTE che ne riceve l'elemento
    const passo = l => R.linee.find(x=>Math.abs(x.pos-l.pos)===1 && GEN[l.el]===x.el) || null;
    let term=null, lung=0;
    for (const s0 of sorg) {
      let cur=s0, n=0, vis=new Set([s0.pos]);
      while (true) { const nx=passo(cur); if(!nx||vis.has(nx.pos)) break;
        vis.add(nx.pos); cur=nx; n++; }
      if (n>lung) { lung=n; term=cur; }
    }
    if (!term || lung===0) continue;
    const dir = term.pos<=3?'SHORT':'LONG';
    add('A. cascata → direzione della linea terminale', dir, r);
    add('B. (confronto) direzione opposta', dir==='LONG'?'SHORT':'LONG', r);
    add('C. ... cascata lunga '+lung+' passi', dir, r);
    add('D. ... terminale = '+term.par, dir, r);
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== FLUSSO A CASCATA — rif. 50.40% ===');
  console.log('condizione'.padEnd(46)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(46)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.PSIYIN) {
  // Richiesta di Edu: carte con 伏神 父母 巳 nascosto dietro G 官鬼 寅.
  // Riscontro sul trigramma dove capita la linea, diviso per timely/untimely.
  const LYM = require('./liuyao.js');
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const forte=s=>s==='旺'||s==='相';
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  let tot=0;
  const dettaglio=[];
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const mEl=WX[r.monthBranchUsed];
    // la configurazione esatta: G 寅 con 伏神 P 巳 dietro
    const g = R.linee.find(l=>l.par==='G' && l.ramo==='寅' && l.fushen &&
                              l.fushen.par==='P' && l.fushen.b==='巳');
    if (!g) continue;
    tot++;
    const st=stagLoc(g.el,mEl);          // 寅 Legno nel mese
    const tm=forte(st);
    const dir=g.pos<=3?'SHORT':'LONG';   // il trigramma dove capita
    add('TOTALE — direzione del suo trigramma', dir, r);
    add(tm?'TIMELY (旺/相) — direzione del suo trigramma':'UNTIMELY — direzione del suo trigramma', dir, r);
    add(tm?'TIMELY — direzione OPPOSTA':'UNTIMELY — direzione OPPOSTA', dir==='LONG'?'SHORT':'LONG', r);
    const pnl=dir==='LONG'?r.move:-r.move;
    dettaglio.push({d:r.date,c:r.cross,pos:g.pos,st,dir,pnl,mese:r.monthBranchUsed});
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== 伏神 父母 巳 DIETRO G 官鬼 寅 — rif. 50.40% ===');
  console.log('carte con questa configurazione: '+tot+'\n');
  console.log('condizione'.padEnd(48)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(48)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
  console.log('\ndettaglio delle carte (posizione · stagione · direzione · esito):');
  dettaglio.sort((a,b)=>a.d<b.d?-1:1);
  for (const x of dettaglio) console.log('  '+x.c.padEnd(7)+x.d+'  L'+x.pos+
    ' ('+(x.pos<=3?'inferiore':'superiore')+')  mese '+x.mese+'  '+x.st+
    '  → '+x.dir.padEnd(5)+'  '+(x.pnl>0?'GIUSTO':'sbagliato')+'  '+x.pnl.toFixed(0)+' pip');
}

if (process.env.XING) {
  // 刑 PENALITÀ (Edu, 13/08/2026, da USDJPY 16/01/2024)
  //   三刑 寅巳申 (無恩之刑) · 丑戌未 (恃勢之刑) · 相刑 子卯 (無禮之刑) · 自刑 辰午酉亥
  // Ipotesi di Edu: una linea in penalita' col proprio 伏神 (es. G 寅 con P 巳 dietro),
  // quando SONO FORTI, la penalita' e' attiva e la direzione del suo trigramma PERDE.
  const LYM = require('./liuyao.js');
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const forte=s=>s==='旺'||s==='相';
  const TRIPLE=[['寅','巳','申'],['丑','戌','未']];
  const MUTUO=[['子','卯']];
  const inXing=(a,b)=>{
    for(const t of TRIPLE) if(t.includes(a)&&t.includes(b)&&a!==b) return true;
    for(const m of MUTUO) if(m.includes(a)&&m.includes(b)&&a!==b) return true;
    return false; };
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const mEl=WX[r.monthBranchUsed];
    // A) linea in penalita' col PROPRIO 伏神
    const conFu = R.linee.filter(l=>l.fushen && inXing(l.ramo, l.fushen.b));
    if (conFu.length===1) {
      const l=conFu[0], dir=l.pos<=3?'SHORT':'LONG';
      const tl=forte(stagLoc(l.el,mEl)), tf=forte(stagLoc(l.fushen.el,mEl));
      const et = 'A. linea in 刑 col proprio 伏神';
      add(et+' — sua direzione', dir, r);
      if (tl&&tf) add(et+' · ENTRAMBI forti — sua direzione', dir, r);
      if (tl&&tf) add(et+' · ENTRAMBI forti — OPPOSTA', dir==='LONG'?'SHORT':'LONG', r);
      if (!tl&&!tf) add(et+' · entrambi deboli — sua direzione', dir, r);
      if (l.par==='G') add(et+' · ed e G — sua direzione', dir, r);
    }
    // B) linea in penalita' con un ramo del BAZI
    const bazi=[r.yearBranchUsed,r.monthBranchUsed,r.dayBranchUsed];
    const conBazi = R.linee.filter(l=>bazi.some(b=>inXing(l.ramo,b)));
    if (conBazi.length===1) {
      const l=conBazi[0], dir=l.pos<=3?'SHORT':'LONG';
      add('B. linea in 刑 col Bazi — sua direzione', dir, r);
      if (forte(stagLoc(l.el,mEl))) add('B. ... e la linea e FORTE — OPPOSTA', dir==='LONG'?'SHORT':'LONG', r);
      else add('B. ... e la linea e debole — sua direzione', dir, r);
    }
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== 刑 PENALITÀ — rif. 50.40% ===');
  console.log('condizione'.padEnd(60)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(60)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.TERMO) {
  // TERMOMETRO CUMULATIVO — il LY autonomo con TUTTE le regole registrate, in precedenza:
  //  1. mobile distrutta (vuota+clash giorno+untimely) -> legge la linea TIMELY (C,B esclusi, 自刑 esclusa)
  //  2. capolinea G DRENATO dal proprio 伏神        (§33, la cella piu' forte)
  //  3. linea in 刑 col proprio 伏神, entrambi deboli (§34)
  //  4. capolinea G (non drenato)                    (§20)
  //  5. progressione 進神/退神, con eccezione Tai Sui (§22,24) e clash sull'arrivo (§23)
  //  6. 三會 col mese dentro                          (§31)
  const LYM = require('./liuyao.js');
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const forte=s=>s==='旺'||s==='相';
  const AUTOP=['辰','午','酉','亥'];
  const TRIPLE=[['寅','巳','申'],['丑','戌','未']], MUTUO=[['子','卯']];
  const inXing=(a,b)=>{ for(const t of TRIPLE) if(t.includes(a)&&t.includes(b)&&a!==b) return true;
    for(const m of MUTUO) if(m.includes(a)&&m.includes(b)&&a!==b) return true; return false; };
  const HUI=[{r:['寅','卯','辰'],el:'Wood'},{r:['巳','午','未'],el:'Fire'},
             {r:['申','酉','戌'],el:'Metal'},{r:['亥','子','丑'],el:'Water'}];
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const D=r.dayBranchUsed, Y=r.yearBranchUsed, Mo=r.monthBranchUsed, mEl=WX[Mo];
    const bazi=[Y,Mo,D];
    const vivo=l=>!['legata','rotta','dormiente','eliminata','autocombinata'].includes(l.stato);
    const mob=R.linee[R.mutante.pos-1], dep=R.mutante.ramoDep;
    let dir=null, via=null;
    // 1
    if ((R.vuoti.indexOf(dep)>=0)&&(CLASH[D]===dep)&&!forte(stagLoc(mob.el,mEl))) {
      const c=R.linee.filter(l=>l.pos!==mob.pos&&vivo(l)&&R.vuoti.indexOf(l.ramo)<0&&
        CLASH[D]!==l.ramo&&!(l.ramo===D&&AUTOP.includes(l.ramo))&&!['C','B'].includes(l.par)&&
        forte(stagLoc(l.el,mEl)));
      if (c.length===1){ dir=c[0].pos<=3?'SHORT':'LONG'; via='1 mobile distrutta'; }
    }
    // capolinea
    const vivi=R.linee.filter(vivo);
    const els=new Set(vivi.map(l=>l.el).concat(bazi.map(b=>WX[b])));
    const cap=vivi.filter(l=>{const ric=Array.from(els).some(e=>GEN[e]===l.el&&e!==l.el);
      const ced=Array.from(els).some(e=>GEN[l.el]===e); return ric&&!ced;});
    const capG = (cap.length===1&&cap[0].par==='G') ? cap[0] : null;
    // 2
    if (!dir && capG && capG.fushen && GEN[capG.el]===capG.fushen.el) {
      dir=capG.pos<=3?'SHORT':'LONG'; via='2 capolinea G drenato'; }
    // 3
    if (!dir) { const cf=R.linee.filter(l=>l.fushen&&inXing(l.ramo,l.fushen.b));
      if (cf.length===1){ const l=cf[0];
        if (!forte(stagLoc(l.el,mEl)) && !forte(stagLoc(l.fushen.el,mEl))){
          dir=l.pos<=3?'SHORT':'LONG'; via='3 刑 col 伏神, deboli'; } } }
    // 4
    if (!dir && capG) { dir=capG.pos<=3?'SHORT':'LONG'; via='4 capolinea G'; }
    // 5 — solo 退神 (il 進神 rendeva -0,61 pip/trade: rimosso 13/08/2026)
    if (!dir && R.mutante.progressione==='retrocedente') {
      const suo=mob.pos<=3?'SHORT':'LONG', opp=suo==='LONG'?'SHORT':'LONG';
      dir = (CLASH[Y]===dep?suo:opp); via='5 退神'; }
    // 6
    if (!dir) { const tutti=new Set(R.linee.map(l=>l.ramo).concat(bazi));
      const f=HUI.filter(h=>h.r.every(x=>tutti.has(x))&&h.r.includes(Mo));
      if (f.length===1){ const ln=R.linee.filter(l=>l.el===f[0].el);
        const b=ln.filter(l=>l.pos<=3).length, a=ln.length-b;
        if (b!==a){ dir=b>a?'SHORT':'LONG'; via='6 三會 col mese'; } } }
    if (!dir) continue;
    add('TOTALE — LY autonomo con tutte le regole', dir, r);
    add('  '+via, dir, r);
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n########## TERMOMETRO — LY AUTONOMO ##########   riferimento 50.40%');
  console.log('via'.padEnd(32)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(32)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.DREFAIL) {
  // Dove sbaglia la via migliore: capolinea G drenato dal proprio 伏神 (60,32%).
  const LYM = require('./liuyao.js');
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const forte=s=>s==='旺'||s==='相';
  const casi=[];
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const D=r.dayBranchUsed, Y=r.yearBranchUsed, Mo=r.monthBranchUsed, mEl=WX[Mo];
    const vivo=l=>!['legata','rotta','dormiente','eliminata','autocombinata'].includes(l.stato);
    const mob=R.linee[R.mutante.pos-1], dep=R.mutante.ramoDep;
    // la via 1 non deve scattare
    if ((R.vuoti.indexOf(dep)>=0)&&(CLASH[D]===dep)&&!forte(stagLoc(mob.el,mEl))) continue;
    const vivi=R.linee.filter(vivo);
    const els=new Set(vivi.map(l=>l.el).concat([Y,Mo,D].map(b=>WX[b])));
    const cap=vivi.filter(l=>{const ric=Array.from(els).some(e=>GEN[e]===l.el&&e!==l.el);
      const ced=Array.from(els).some(e=>GEN[l.el]===e); return ric&&!ced;});
    if (cap.length!==1||cap[0].par!=='G') continue;
    const g=cap[0];
    if (!(g.fushen && GEN[g.el]===g.fushen.el)) continue;   // dev'essere DRENATO
    const dir=g.pos<=3?'SHORT':'LONG';
    const pnl=dir==='LONG'?r.move:-r.move;
    if (pnl>=0) continue;
    casi.push({r,R,g,dir,pnl});
  }
  casi.sort((a,b)=>a.pnl-b.pnl);
  console.log('\n=== IL CAPOLINEA G DRENATO SBAGLIA ===  perdenti: '+casi.length+' su 126');
  const idx = process.env.DREIDX ? parseInt(process.env.DREIDX,10) : 0;
  const c=casi[idx], r=c.r, R=c.R;
  const ora = LYM.oraDalSeme(r.seedUsed);
  console.log('\n'+r.cross+'  '+r.date+'   seme '+r.seedUsed+'   sup '+r.sup+' inf '+r.inf+' mutante L'+r.linea);
  console.log('giorno '+r.dayStemUsed+r.dayBranchUsed+' · mese '+r.monthBranchUsed+' · anno '+r.yearBranchUsed+
              ' · ora dal seme '+ora+'   palazzo '+R.palName+' ('+R.palElIt+')   vuoti '+R.vuoti.join(''));
  console.log('CAPOLINEA G: L'+c.g.pos+' 官鬼 '+c.g.ramo+' '+c.g.elIt+
              ' ['+stagLoc(c.g.el,WX[r.monthBranchUsed])+']  drenato dal 伏神 '+c.g.fushen.parCn+' '+c.g.fushen.b+
              ' → '+c.dir);
  console.log('mutante L'+R.mutante.pos+': '+R.mutante.ramoDep+' → '+R.mutante.ramoArr+
              (R.mutante.progressione?'  '+R.mutante.progressione.toUpperCase():'')+'  ('+R.mutante.casoLabel+')');
  console.log('MERCATO: '+(r.move>0?'SALE':'SCENDE')+' '+Math.abs(r.move).toFixed(0)+' pip → perde '+Math.abs(c.pnl).toFixed(0));
  console.log('EMA '+(r.emaDir==='up'?'su':'giu')+' run '+r.emaRun+'   PB: '+
    (r.emaDir==='up'?(r.finale?'LONG':'SHORT'):(r.finale?'SHORT':'LONG'))+' → '+r.pnl.toFixed(0)+' pip');
  for(let k=6;k>=1;k--){const x=R.linee[k-1];
    const st=stagLoc(x.el,WX[r.monthBranchUsed]);
    console.log('  L'+x.pos+' '+(x.yang?'▬▬▬':'▬ ▬')+' '+(x.bestia?x.bestia.cn:'--')+' '+x.parCn+' '+x.ramo+' '+x.elIt+
      (x.isShi?' 世':'')+(x.isYing?' 應':'')+(x.isMobile?' ✸':'')+(x.vuoto?' 空':'')+(x.isTaiSui?' 太歲':'')+
      (x.ramo===r.dayBranchUsed?' ←giorno':'')+(x.ramo===ora?' ←ora':'')+
      ((R.anDong||{})[x.pos]?' 暗動→'+R.anDong[x.pos].arr:'')+
      ' ['+x.stato+' '+st+']'+(x.fushen?'  伏:'+x.fushen.parCn+x.fushen.b:''));}
}

if (process.env.WTIMELY) {
  // LA LETTURA DI EDU sulle due carte: quando il capolinea G e' in 刑 col proprio 伏神
  // (寅/巳), il G non regge e legge invece la RICCHEZZA TIMELY.
  const LYM = require('./liuyao.js');
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const forte=s=>s==='旺'||s==='相';
  const TRIPLE=[['寅','巳','申'],['丑','戌','未']], MUTUO=[['子','卯']];
  const inXing=(a,b)=>{ for(const t of TRIPLE) if(t.includes(a)&&t.includes(b)&&a!==b) return true;
    for(const m of MUTUO) if(m.includes(a)&&m.includes(b)&&a!==b) return true; return false; };
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const D=r.dayBranchUsed, Y=r.yearBranchUsed, Mo=r.monthBranchUsed, mEl=WX[Mo];
    const vivo=l=>!['legata','rotta','dormiente','eliminata','autocombinata'].includes(l.stato);
    const vivi=R.linee.filter(vivo);
    const els=new Set(vivi.map(l=>l.el).concat([Y,Mo,D].map(b=>WX[b])));
    const cap=vivi.filter(l=>{const ric=Array.from(els).some(e=>GEN[e]===l.el&&e!==l.el);
      const ced=Array.from(els).some(e=>GEN[l.el]===e); return ric&&!ced;});
    if (cap.length!==1||cap[0].par!=='G') continue;
    const g=cap[0];
    if (!(g.fushen && inXing(g.ramo, g.fushen.b))) continue;   // G in 刑 col proprio nascosto
    const dirG = g.pos<=3?'SHORT':'LONG';
    add('A. (vecchia regola) direzione del capolinea G', dirG, r);
    // la lettura di Edu: legge la Ricchezza TIMELY
    const ws = R.linee.filter(l=>l.par==='W' && vivo(l) && forte(stagLoc(l.el,mEl)));
    if (ws.length>=1) {
      const b=ws.filter(l=>l.pos<=3).length, a=ws.length-b;
      if (b!==a) add('B. legge la RICCHEZZA timely', b>a?'SHORT':'LONG', r);
      if (ws.length===1) add('C. ... quando la Ricchezza timely e UNICA', ws[0].pos<=3?'SHORT':'LONG', r);
    } else add('D. nessuna Ricchezza timely — resta il G', dirG, r);
    // variante: la linea timely piu' forte qualunque parente (esclusi C e B)
    const ts = R.linee.filter(l=>vivo(l) && forte(stagLoc(l.el,mEl)) && !['C','B'].includes(l.par) && l.pos!==g.pos);
    if (ts.length===1) add('E. la linea timely unica (no C/B)', ts[0].pos<=3?'SHORT':'LONG', r);
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== G IN 刑 COL NASCOSTO: chi legge? — rif. 50.40% ===');
  console.log('condizione'.padEnd(48)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(48)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.FORZAB) {
  // FORZA GENERALIZZATA (Edu, 13/08/2026, da USDCAD 20/09/2022)
  // Una linea e' forte non solo se timely in stagione, ma anche se il BAZI la sostiene:
  // un ramo del Bazi (anno/mese/giorno) che sia del suo stesso elemento o lo generi.
  // Il Tai Sui che COINCIDE con la linea la sostiene per identita'.
  const LYM = require('./liuyao.js');
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const TRIPLE=[['寅','巳','申'],['丑','戌','未']], MUTUO=[['子','卯']];
  const inXing=(a,b)=>{ for(const t of TRIPLE) if(t.includes(a)&&t.includes(b)&&a!==b) return true;
    for(const m of MUTUO) if(m.includes(a)&&m.includes(b)&&a!==b) return true; return false; };
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const Y=r.yearBranchUsed, Mo=r.monthBranchUsed, D=r.dayBranchUsed, mEl=WX[Mo];
    const bazi=[Y,Mo,D];
    const stag=el=>stagLoc(el,mEl);
    const timely=el=>stag(el)==='旺'||stag(el)==='相';
    // forza generalizzata: stagione OPPURE sostegno dal Bazi (stesso elemento o lo genera)
    const sostegno=el=>bazi.some(b=>WX[b]===el||GEN[WX[b]]===el);
    const forteG=el=>timely(el)||sostegno(el);
    const vivo=l=>!['legata','rotta','dormiente','eliminata','autocombinata'].includes(l.stato);
    // ---- A) §34 rimisurata con la forza generalizzata ----
    const cf=R.linee.filter(l=>l.fushen&&inXing(l.ramo,l.fushen.b));
    if (cf.length===1) {
      const l=cf[0], dir=l.pos<=3?'SHORT':'LONG';
      const forti = forteG(l.el)&&forteG(l.fushen.el);
      add(forti?'A1. 刑 col 伏神 · ENTRAMBI forti (gen.) — sua direzione'
               :'A2. 刑 col 伏神 · non entrambi forti — sua direzione', dir, r);
      if (forti) add('A3. ... entrambi forti — direzione OPPOSTA', dir==='LONG'?'SHORT':'LONG', r);
    }
    // ---- B) la Ricchezza forte (forza generalizzata) ----
    const ws=R.linee.filter(l=>l.par==='W'&&vivo(l)&&forteG(l.el));
    if (ws.length===1) add('B. legge la Ricchezza FORTE (gen.), unica', ws[0].pos<=3?'SHORT':'LONG', r);
    // ---- C) la linea forte unica, esclusi C e B ----
    const ts=R.linee.filter(l=>vivo(l)&&forteG(l.el)&&!['C','B'].includes(l.par));
    if (ts.length===1) add('C. la linea FORTE unica (no C/B)', ts[0].pos<=3?'SHORT':'LONG', r);
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== FORZA GENERALIZZATA (stagione + sostegno del Bazi) — rif. 50.40% ===');
  console.log('condizione'.padEnd(56)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(56)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.XING2) {
  // Quale FORZA attiva la penalità 刑? Scomposizione netta:
  //   S = forte in STAGIONE (旺/相)   ·   B = forte solo per SOSTEGNO del Bazi
  const LYM = require('./liuyao.js');
  const stagLoc=(el,mEl)=> el===mEl?'旺':GEN[mEl]===el?'相':GEN[el]===mEl?'休':CTRL[mEl]===el?'死':CTRL[el]===mEl?'囚':'休';
  const TRIPLE=[['寅','巳','申'],['丑','戌','未']], MUTUO=[['子','卯']];
  const inXing=(a,b)=>{ for(const t of TRIPLE) if(t.includes(a)&&t.includes(b)&&a!==b) return true;
    for(const m of MUTUO) if(m.includes(a)&&m.includes(b)&&a!==b) return true; return false; };
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const Y=r.yearBranchUsed, Mo=r.monthBranchUsed, D=r.dayBranchUsed, mEl=WX[Mo];
    const bazi=[Y,Mo,D];
    const timely=el=>{const s=stagLoc(el,mEl); return s==='旺'||s==='相';};
    const sost=el=>bazi.some(b=>WX[b]===el||GEN[WX[b]]===el);
    const cf=R.linee.filter(l=>l.fushen&&inXing(l.ramo,l.fushen.b));
    if (cf.length!==1) continue;
    const l=cf[0], f=l.fushen, dir=l.pos<=3?'SHORT':'LONG', opp=dir==='LONG'?'SHORT':'LONG';
    const cls = (el)=> timely(el) ? 'S' : (sost(el) ? 'B' : '-');
    const k = cls(l.el)+cls(f.el);
    add('linea/nascosto '+k+' — sua direzione', dir, r);
    add('linea/nascosto '+k+' — OPPOSTA', opp, r);
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== 刑: QUALE FORZA LA ATTIVA? (S=stagione · B=solo Bazi · -=nessuna) — rif. 50.40% ===');
  console.log('condizione'.padEnd(42)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n||n<15) continue;
    console.log(k.padEnd(42)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.DUALT) {
  // TIMELINESS DOPPIA (Edu, 13/08/2026)
  // Il mese da' timeliness per il suo ELEMENTO e per la sua STAGIONE. Coincidono tranne
  // nei quattro mesi di Terra: 辰 (Terra+primavera) 未 (Terra+estate) 戌 (Terra+autunno)
  // 丑 (Terra+inverno). In quei mesi DUE elementi sono timely insieme.
  //   TIMELY = effetto ampio, coinvolge tutti gli attori dell'esagramma
  //   FORTE  = effetto concentrato (giorno/anno), agisce su una linea per via diretta
  const LYM = require('./liuyao.js');
  const SEASON={'寅':'Wood','卯':'Wood','辰':'Wood','巳':'Fire','午':'Fire','未':'Fire',
                '申':'Metal','酉':'Metal','戌':'Metal','亥':'Water','子':'Water','丑':'Water'};
  const st1=(el,m)=> el===m?'旺':GEN[m]===el?'相':GEN[el]===m?'休':CTRL[m]===el?'死':CTRL[el]===m?'囚':'休';
  const forte1=s=>s==='旺'||s==='相';
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const Mo=r.monthBranchUsed, mEl=WX[Mo], sEl=SEASON[Mo];
    const vivo=l=>!['legata','rotta','dormiente','eliminata','autocombinata'].includes(l.stato);
    // timely SEMPLICE (solo elemento del mese) vs DOPPIA (elemento + stagione)
    const tSemp=el=>forte1(st1(el,mEl));
    const tDual=el=>forte1(st1(el,mEl))||forte1(st1(el,sEl));
    const doppioMese = (mEl!==sEl);
    // A) la Ricchezza timely unica — confronto fra le due definizioni
    for (const [nome,fn] of [['SEMPLICE',tSemp],['DOPPIA',tDual]]) {
      const ws=R.linee.filter(l=>l.par==='W'&&vivo(l)&&fn(l.el));
      if (ws.length===1) add('A. Ricchezza timely unica ('+nome+')', ws[0].pos<=3?'SHORT':'LONG', r);
    }
    // B) la linea timely unica esclusi C e B
    for (const [nome,fn] of [['SEMPLICE',tSemp],['DOPPIA',tDual]]) {
      const ts=R.linee.filter(l=>vivo(l)&&fn(l.el)&&!['C','B'].includes(l.par));
      if (ts.length===1) add('B. linea timely unica, no C/B ('+nome+')', ts[0].pos<=3?'SHORT':'LONG', r);
    }
    // C) solo nei quattro mesi di Terra, dove le due definizioni divergono
    if (doppioMese) {
      const ws=R.linee.filter(l=>l.par==='W'&&vivo(l)&&tDual(l.el));
      if (ws.length===1) add('C. mesi di Terra · Ricchezza timely DOPPIA', ws[0].pos<=3?'SHORT':'LONG', r);
      const ws2=R.linee.filter(l=>l.par==='W'&&vivo(l)&&tSemp(l.el));
      if (ws2.length===1) add('C. mesi di Terra · Ricchezza timely SEMPLICE', ws2[0].pos<=3?'SHORT':'LONG', r);
    }
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== TIMELINESS DOPPIA (elemento del mese + stagione) — rif. 50.40% ===');
  console.log('condizione'.padEnd(50)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(50)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.GRUPPI) {
  // Quali GRUPPI strutturali del LY rendono peggio? Cerco categorie ampie e sistematiche.
  const LYM = require('./liuyao.js');
  const SEASON={'寅':'Wood','卯':'Wood','辰':'Wood','巳':'Fire','午':'Fire','未':'Fire',
                '申':'Metal','酉':'Metal','戌':'Metal','亥':'Water','子':'Water','丑':'Water'};
  const st1=(el,m)=> el===m?'旺':GEN[m]===el?'相':GEN[el]===m?'休':CTRL[m]===el?'死':CTRL[el]===m?'囚':'休';
  const f1=s=>s==='旺'||s==='相';
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,r)=>{ M[k]=M[k]||mk();
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(r.pnl>0)o.w++; else if(r.pnl<0)o.l++; o.p+=r.pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const Mo=r.monthBranchUsed, mEl=WX[Mo], sEl=SEASON[Mo];
    const tD=el=>f1(st1(el,mEl))||f1(st1(el,sEl));
    const vivo=l=>!['legata','rotta','dormiente','eliminata','autocombinata'].includes(l.stato);
    const shi=R.linee[R.shi-1], ying=R.linee[R.ying-1], mob=R.linee[R.mutante.pos-1];
    add('palazzo '+R.palName, r);
    add('mutante = '+mob.par, r);
    add('Shi = '+shi.par, r);
    add('stato dello Shi: '+shi.stato, r);
    add('caso mutazione '+R.mutante.casoMut, r);
    add('mutante in posizione L'+R.mutante.pos, r);
    add('mese '+Mo, r);
    add(tD(shi.el)?'Shi timely':'Shi NON timely', r);
    const nV=R.linee.filter(l=>l.vuoto).length;
    add('linee vuote: '+nV, r);
    const nMorte=R.linee.filter(l=>!vivo(l)).length;
    add('linee non agibili: '+nMorte, r);
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)):0;
  const out=[];
  for(const [k,d] of Object.entries(M)){ const n=d.tutto.w+d.tutto.l; if(n<80) continue;
    out.push({k,n,t:pc(d.tutto),re:pc(d.recente),ve:pc(d.vecchio),p:d.tutto.p}); }
  out.sort((a,b)=>a.t-b.t);
  console.log('\n=== GRUPPI STRUTTURALI CON LE PEGGIORI PERFORMANCE DEL PB (baseline 53.51%) ===');
  console.log('gruppo'.padEnd(30)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const o of out.slice(0,12))
    console.log(o.k.padEnd(30)+String(o.n).padStart(6)+o.t.toFixed(2).padStart(8)+'%'+
      o.re.toFixed(2).padStart(9)+'%'+o.ve.toFixed(2).padStart(9)+'%'+
      o.p.toFixed(0).padStart(9)+(o.p/o.n).toFixed(2).padStart(9));
}

if (process.env.MORTE4) {
  // Il gruppo peggiore: carte con QUATTRO linee non agibili (47,78%).
  const LYM = require('./liuyao.js');
  const SEASON={'寅':'Wood','卯':'Wood','辰':'Wood','巳':'Fire','午':'Fire','未':'Fire',
                '申':'Metal','酉':'Metal','戌':'Metal','亥':'Water','子':'Water','丑':'Water'};
  const st1=(el,m)=> el===m?'旺':GEN[m]===el?'相':GEN[el]===m?'休':CTRL[m]===el?'死':CTRL[el]===m?'囚':'休';
  const f1=s=>s==='旺'||s==='相';
  const casi=[];
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const vivo=l=>!['legata','rotta','dormiente','eliminata','autocombinata'].includes(l.stato);
    if (R.linee.filter(l=>!vivo(l)).length!==4) continue;
    casi.push({r,R,pnl:r.pnl});
  }
  casi.sort((a,b)=>a.pnl-b.pnl);
  const c=casi[0], r=c.r, R=c.R;
  const ora=LYM.oraDalSeme(r.seedUsed);
  const Mo=r.monthBranchUsed, mEl=WX[Mo], sEl=SEASON[Mo];
  console.log('\n=== GRUPPO "4 LINEE NON AGIBILI" — la carta peggiore ===  gruppo: '+casi.length+' carte, 47,78%\n');
  console.log(r.cross+'  '+r.date+'   seme '+r.seedUsed+'   sup '+r.sup+' inf '+r.inf+' mutante L'+r.linea);
  console.log('giorno '+r.dayStemUsed+r.dayBranchUsed+' · mese '+Mo+' · anno '+r.yearBranchUsed+
              ' · ora dal seme '+ora+'   palazzo '+R.palName+' ('+R.palElIt+')   vuoti '+R.vuoti.join(''));
  console.log('timely nel mese '+Mo+': elemento '+mEl+(mEl!==sEl?' + stagione '+sEl:'')+
              '   Shi L'+R.shi+' ['+R.shiStato+']   Ying L'+R.ying+' ['+R.yingStato+']');
  console.log('mutante L'+R.mutante.pos+': '+R.mutante.ramoDep+' → '+R.mutante.ramoArr+
              (R.mutante.progressione?'  '+R.mutante.progressione.toUpperCase():'')+'  ('+R.mutante.casoLabel+')');
  console.log('MERCATO: '+(r.move>0?'SALE':'SCENDE')+' '+Math.abs(r.move).toFixed(0)+' pip');
  console.log('PB: '+(r.emaDir==='up'?(r.finale?'LONG':'SHORT'):(r.finale?'SHORT':'LONG'))+
              (r.finale?' (segue)':' (non segue)')+' → '+r.pnl.toFixed(0)+' pip   EMA '+
              (r.emaDir==='up'?'su':'giu')+' run '+r.emaRun);
  for(let k=6;k>=1;k--){const x=R.linee[k-1];
    const tD = f1(st1(x.el,mEl))||f1(st1(x.el,sEl));
    console.log('  L'+x.pos+' '+(x.yang?'▬▬▬':'▬ ▬')+' '+(x.bestia?x.bestia.cn:'--')+' '+x.parCn+' '+x.ramo+' '+x.elIt+
      (x.isShi?' 世':'')+(x.isYing?' 應':'')+(x.isMobile?' ✸':'')+(x.vuoto?' 空':'')+(x.isTaiSui?' 太歲':'')+
      (x.ramo===r.dayBranchUsed?' ←giorno':'')+(x.ramo===ora?' ←ora':'')+
      ((R.anDong||{})[x.pos]?' 暗動→'+R.anDong[x.pos].arr:'')+
      ' ['+x.stato+(tD?' TIMELY':'')+']'+(x.fushen?'  伏:'+x.fushen.parCn+x.fushen.b:''));}
}

if (process.env.FUVUOTO) {
  // 飛神空伏神出 (Edu, 13/08/2026, da USDJPY 15/01/2025)
  // Quando la linea che NASCONDE e' VUOTA, e' trasparente: il 伏神 diventa visibile e agisce.
  // Direzione dalla posizione della linea che lo nasconde.
  const LYM = require('./liuyao.js');
  const SEASON={'寅':'Wood','卯':'Wood','辰':'Wood','巳':'Fire','午':'Fire','未':'Fire',
                '申':'Metal','酉':'Metal','戌':'Metal','亥':'Water','子':'Water','丑':'Water'};
  const st1=(el,m)=> el===m?'旺':GEN[m]===el?'相':GEN[el]===m?'休':CTRL[m]===el?'死':CTRL[el]===m?'囚':'休';
  const f1=s=>s==='旺'||s==='相';
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const Mo=r.monthBranchUsed, mEl=WX[Mo], sEl=SEASON[Mo];
    const tD=el=>f1(st1(el,mEl))||f1(st1(el,sEl));
    const bazi=[r.yearBranchUsed,Mo,r.dayBranchUsed];
    // 伏神 dietro una linea VUOTA -> emerge
    const em = R.linee.filter(l=>l.fushen && l.vuoto);
    if (em.length!==1) continue;
    const l=em[0], fu=l.fushen, dir=l.pos<=3?'SHORT':'LONG';
    add('A. 伏神 dietro linea VUOTA — sua direzione', dir, r);
    add('B. (confronto) direzione opposta', dir==='LONG'?'SHORT':'LONG', r);
    add('C. ... il nascosto e '+fu.parCn+' ('+fu.par+')', dir, r);
    if (tD(fu.el)) add('D. ... e il nascosto e TIMELY (doppia)', dir, r);
    else add('E. ... e il nascosto NON e timely', dir, r);
    // il flusso del Bazi arriva al nascosto? (un ramo del Bazi lo genera, direttamente o a catena)
    const elsB=new Set(bazi.map(b=>WX[b]));
    const arriva = Array.from(elsB).some(e=>GEN[e]===fu.el) ||
                   Array.from(elsB).some(e=>GEN[GEN[e]]===fu.el);
    if (arriva) add('F. ... e il flusso del Bazi lo RAGGIUNGE', dir, r);
    if (arriva && fu.par==='G') add('G. ... nascosto G raggiunto dal flusso', dir, r);
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== 飛神空伏神出 — il nascosto dietro una linea vuota — rif. 50.40% ===');
  console.log('condizione'.padEnd(48)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(48)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.GNASC2) {
  // E' il fatto di essere NASCOSTO o che chi lo nasconde sia VUOTO?
  // Tre popolazioni a confronto, tutte con direzione dalla posizione della linea.
  const LYM = require('./liuyao.js');
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    // 1) G NASCOSTO: dietro linea vuota / dietro linea piena
    const nasc = R.linee.filter(l=>l.fushen && l.fushen.par==='G');
    if (nasc.length===1) {
      const l=nasc[0], dir=l.pos<=3?'SHORT':'LONG';
      add(l.vuoto ? '1a. G nascosto · chi lo nasconde e VUOTO'
                  : '1b. G nascosto · chi lo nasconde e PIENO', dir, r);
    }
    // 2) G VISIBILE come linea (unico): dietro linea vuota non ha senso, ma distinguo
    //    se la linea G e' essa stessa vuota o piena
    const vis = R.linee.filter(l=>l.par==='G');
    if (vis.length===1) {
      const g=vis[0], dir=g.pos<=3?'SHORT':'LONG';
      add(g.vuoto ? '2a. G visibile · la linea G e VUOTA'
                  : '2b. G visibile · la linea G e PIENA', dir, r);
    }
    // 3) controllo: QUALSIASI nascosto dietro linea vuota, per parente
    const em=R.linee.filter(l=>l.fushen && l.vuoto);
    if (em.length===1) {
      const l=em[0], dir=l.pos<=3?'SHORT':'LONG';
      add('3. nascosto '+l.fushen.par+' dietro vuoto', dir, r);
    }
    // 4) controllo: qualsiasi nascosto dietro linea PIENA, per parente
    const ep=R.linee.filter(l=>l.fushen && !l.vuoto);
    if (ep.length===1) {
      const l=ep[0], dir=l.pos<=3?'SHORT':'LONG';
      add('4. nascosto '+l.fushen.par+' dietro pieno', dir, r);
    }
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== NASCOSTO o COPERTURA VUOTA? — rif. 50.40% ===');
  console.log('condizione'.padEnd(46)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n||n<25) continue;
    console.log(k.padEnd(46)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.GNASC3) {
  // G nascosto sotto copertura vuota: cosa succede se il GIORNO lo GENERA (o lo sostiene)?
  const LYM = require('./liuyao.js');
  const SEASON={'寅':'Wood','卯':'Wood','辰':'Wood','巳':'Fire','午':'Fire','未':'Fire',
                '申':'Metal','酉':'Metal','戌':'Metal','亥':'Water','子':'Water','丑':'Water'};
  const st1=(el,m)=> el===m?'旺':GEN[m]===el?'相':GEN[el]===m?'休':CTRL[m]===el?'死':CTRL[el]===m?'囚':'休';
  const f1=s=>s==='旺'||s==='相';
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  const esempi=[];
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const D=r.dayBranchUsed, Mo=r.monthBranchUsed, mEl=WX[Mo], sEl=SEASON[Mo];
    const nasc=R.linee.filter(l=>l.fushen && l.fushen.par==='G' && l.vuoto);
    if (nasc.length!==1) continue;
    const l=nasc[0], fu=l.fushen, dir=l.pos<=3?'SHORT':'LONG';
    const pnl=dir==='LONG'?r.move:-r.move;
    const dEl=WX[D];
    const generatoDalGiorno = GEN[dEl]===fu.el;
    const stessoGiorno = dEl===fu.el;
    const sostenuto = generatoDalGiorno || stessoGiorno;
    const timely = f1(st1(fu.el,mEl))||f1(st1(fu.el,sEl));
    const k = generatoDalGiorno ? 'A. il giorno GENERA il G nascosto'
            : stessoGiorno      ? 'B. il giorno e dello stesso elemento del G'
            :                     'C. il giorno non lo sostiene';
    add(k, dir, r);
    add(k+' — OPPOSTA', dir==='LONG'?'SHORT':'LONG', r);
    if (sostenuto) { add('D. sostenuto dal giorno (gen. o pari)', dir, r);
                     add('D. sostenuto dal giorno — OPPOSTA', dir==='LONG'?'SHORT':'LONG', r); }
    if (timely) add('E. G nascosto TIMELY (doppia)', dir, r);
    if (sostenuto) esempi.push({r,R,l,fu,dir,pnl,gen:generatoDalGiorno});
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== G NASCOSTO SOTTO VUOTO: e se il GIORNO lo sostiene? — rif. 50.40% ===');
  console.log('condizione'.padEnd(50)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(50)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
  console.log('\nesempi (G nascosto sotto vuoto, sostenuto dal giorno):');
  esempi.sort((a,b)=>a.pnl-b.pnl);
  for (const e of esempi.slice(0,6))
    console.log('  '+e.r.cross.padEnd(7)+e.r.date+'  seme '+String(e.r.seedUsed).padStart(3)+
      '  copre L'+e.l.pos+' '+e.l.ramo+'空  伏 '+e.fu.parCn+' '+e.fu.b+
      '  giorno '+e.r.dayStemUsed+e.r.dayBranchUsed+(e.gen?' (genera)':' (pari)')+
      '  → '+e.dir+'  '+(e.pnl>0?'GIUSTO':'sbagliato')+'  '+e.pnl.toFixed(0)+' pip');
}

if (process.env.TSBLOCK) {
  // BLOCCO DAL TAI SUI + "CHI NON VINCE PERDE" (Edu, 13/08/2026, da USDJPY 15/01/2025)
  // Una linea combinata (六合) dal TAI SUI e' bloccata: non puo' vincere, quindi il suo
  // trigramma PERDE. (§2 fissava il blocco dal solo GIORNO: qui si estende all'anno.)
  const LYM = require('./liuyao.js');
  const SEASON={'寅':'Wood','卯':'Wood','辰':'Wood','巳':'Fire','午':'Fire','未':'Fire',
                '申':'Metal','酉':'Metal','戌':'Metal','亥':'Water','子':'Water','丑':'Water'};
  const st1=(el,m)=> el===m?'旺':GEN[m]===el?'相':GEN[el]===m?'休':CTRL[m]===el?'死':CTRL[el]===m?'囚':'休';
  const f1=s=>s==='旺'||s==='相';
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const Y=r.yearBranchUsed, Mo=r.monthBranchUsed, mEl=WX[Mo], sEl=SEASON[Mo];
    const tD=el=>f1(st1(el,mEl))||f1(st1(el,sEl));
    const bl=R.linee.filter(l=>COMBINA[Y]===l.ramo);      // bloccate dal Tai Sui
    if (bl.length!==1) continue;
    const l=bl[0], suo=l.pos<=3?'SHORT':'LONG', perde=suo==='LONG'?'SHORT':'LONG';
    add('A. bloccata dal Tai Sui → il suo trigramma PERDE', perde, r);
    add('B. (confronto) il suo trigramma vince', suo, r);
    add('C. ... ed e '+l.par+' → perde', perde, r);
    if (tD(l.el)) add('D. ... ed e TIMELY → perde', perde, r);
    else add('E. ... non timely → perde', perde, r);
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== BLOCCO DAL TAI SUI — chi non vince perde — rif. 50.40% ===');
  console.log('condizione'.padEnd(52)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(52)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.PCLASH) {
  // P QUIETO CLASHATO DAL GIORNO (Edu, 13/08/2026)
  // P non mobile, non in movimento, che riceve un clash dal giorno. Cosa succede?
  const LYM = require('./liuyao.js');
  const SEASON={'寅':'Wood','卯':'Wood','辰':'Wood','巳':'Fire','午':'Fire','未':'Fire',
                '申':'Metal','酉':'Metal','戌':'Metal','亥':'Water','子':'Water','丑':'Water'};
  const st1=(el,m)=> el===m?'旺':GEN[m]===el?'相':GEN[el]===m?'休':CTRL[m]===el?'死':CTRL[el]===m?'囚':'休';
  const f1=s=>s==='旺'||s==='相';
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const D=r.dayBranchUsed, Mo=r.monthBranchUsed, mEl=WX[Mo], sEl=SEASON[Mo];
    const tD=el=>f1(st1(el,mEl))||f1(st1(el,sEl));
    // P QUIETO: non e' la mutante, e clashato dal giorno
    const ps=R.linee.filter(l=>l.par==='P' && l.pos!==R.mutante.pos && CLASH[D]===l.ramo);
    if (ps.length!==1) continue;
    const l=ps[0], suo=l.pos<=3?'SHORT':'LONG', opp=suo==='LONG'?'SHORT':'LONG';
    add('A. P quieto clashato dal giorno — sua direzione', suo, r);
    add('B. ... — direzione OPPOSTA', opp, r);
    // per stato: pieno (暗動 potenziale) o vuoto
    add(l.vuoto ? 'C. ... P VUOTO — sua direzione' : 'D. ... P PIENO — sua direzione', suo, r);
    // per forza in stagione
    add(tD(l.el) ? 'E. ... P TIMELY — sua direzione' : 'F. ... P non timely — sua direzione', suo, r);
    // combinazioni: timely+pieno (il clash lo muove davvero) vs untimely (日破)
    if (!l.vuoto && tD(l.el)) { add('G. P pieno e timely (暗動) — sua direzione', suo, r);
                                add('G2. P pieno e timely (暗動) — OPPOSTA', opp, r); }
    if (!l.vuoto && !tD(l.el)) { add('H. P pieno e untimely (日破) — sua direzione', suo, r);
                                 add('H2. P pieno e untimely (日破) — OPPOSTA', opp, r); }
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== P QUIETO CLASHATO DAL GIORNO — rif. 50.40% ===');
  console.log('condizione'.padEnd(52)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(52)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.PSALTA) {
  // LA LINEA CLASHATA CHE SALTA A COMBINARSI (Edu, 13/08/2026, da USDJPY 15/01/2025)
  // Una linea clashata dal giorno non resta ferma: SALTA a combinarsi (六合) con un'altra
  // linea, o con un 伏神 ESPOSTO (nascosto dietro una linea vuota).
  const LYM = require('./liuyao.js');
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const D=r.dayBranchUsed;
    // sorgenti: linee clashate dal giorno, non mobili
    const src=R.linee.filter(l=>l.pos!==R.mutante.pos && CLASH[D]===l.ramo);
    if (src.length!==1) continue;
    const s0=src[0], targetRamo=COMBINA[s0.ramo];
    // bersaglio 1: 伏神 ESPOSTO (dietro linea vuota) con quel ramo
    const espo=R.linee.filter(l=>l.vuoto && l.fushen && l.fushen.b===targetRamo);
    // bersaglio 2: linea visibile con quel ramo
    const vis=R.linee.filter(l=>l.pos!==s0.pos && l.ramo===targetRamo);
    if (espo.length===1) {
      const t=espo[0];
      add('A. salta su 伏神 ESPOSTO — direzione del bersaglio', t.pos<=3?'SHORT':'LONG', r);
      add('B. ... — direzione della SORGENTE', s0.pos<=3?'SHORT':'LONG', r);
      add('C. ... il nascosto esposto e '+t.fushen.par, t.pos<=3?'SHORT':'LONG', r);
    } else if (vis.length===1) {
      const t=vis[0];
      add('D. salta su linea VISIBILE — direzione del bersaglio', t.pos<=3?'SHORT':'LONG', r);
      add('E. ... — direzione della SORGENTE', s0.pos<=3?'SHORT':'LONG', r);
      add('F. ... il bersaglio visibile e '+t.par, t.pos<=3?'SHORT':'LONG', r);
    } else {
      add('G. nessun bersaglio — direzione della sorgente', s0.pos<=3?'SHORT':'LONG', r);
    }
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== LA LINEA CLASHATA CHE SALTA A COMBINARSI — rif. 50.40% ===');
  console.log('condizione'.padEnd(52)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(52)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.GSALTO) {
  // Il G bersaglio di un salto: il salto lo migliora? E se il G e' FORTE?
  // Confronto pulito: G bersaglio vs G non bersaglio, scomposto per forza.
  const LYM = require('./liuyao.js');
  const SEASON={'寅':'Wood','卯':'Wood','辰':'Wood','巳':'Fire','午':'Fire','未':'Fire',
                '申':'Metal','酉':'Metal','戌':'Metal','亥':'Water','子':'Water','丑':'Water'};
  const st1=(el,m)=> el===m?'旺':GEN[m]===el?'相':GEN[el]===m?'休':CTRL[m]===el?'死':CTRL[el]===m?'囚':'休';
  const f1=s=>s==='旺'||s==='相';
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const D=r.dayBranchUsed, Y=r.yearBranchUsed, Mo=r.monthBranchUsed, mEl=WX[Mo], sEl=SEASON[Mo];
    const bazi=[Y,Mo,D];
    const timely=el=>f1(st1(el,mEl))||f1(st1(el,sEl));
    const sost=el=>bazi.some(b=>WX[b]===el||GEN[WX[b]]===el);
    const gs=R.linee.filter(l=>l.par==='G');
    if (gs.length!==1) continue;
    const g=gs[0], dir=g.pos<=3?'SHORT':'LONG';
    // il G e' bersaglio di un salto?
    const src=R.linee.filter(l=>l.pos!==R.mutante.pos && CLASH[D]===l.ramo && COMBINA[l.ramo]===g.ramo);
    const bers = src.length>=1;
    const T=timely(g.el), S=sost(g.el);
    const forza = T ? 'TIMELY' : (S ? 'forte (Bazi)' : 'debole');
    add((bers?'A. G BERSAGLIO del salto · ':'B. G non bersaglio · ')+forza, dir, r);
    if (bers && T) add('C. G bersaglio e TIMELY — OPPOSTA', dir==='LONG'?'SHORT':'LONG', r);
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== IL G BERSAGLIO DEL SALTO, PER FORZA — rif. 50.40% ===');
  console.log('condizione'.padEnd(46)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(46)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.GESPO) {
  // Il salto migliora anche un G ESPOSTO (nascosto dietro linea vuota)?
  const LYM = require('./liuyao.js');
  const SEASON={'寅':'Wood','卯':'Wood','辰':'Wood','巳':'Fire','午':'Fire','未':'Fire',
                '申':'Metal','酉':'Metal','戌':'Metal','亥':'Water','子':'Water','丑':'Water'};
  const st1=(el,m)=> el===m?'旺':GEN[m]===el?'相':GEN[el]===m?'休':CTRL[m]===el?'死':CTRL[el]===m?'囚':'休';
  const f1=s=>s==='旺'||s==='相';
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  const det=[];
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const D=r.dayBranchUsed, Y=r.yearBranchUsed, Mo=r.monthBranchUsed, mEl=WX[Mo], sEl=SEASON[Mo];
    const bazi=[Y,Mo,D];
    const timely=el=>f1(st1(el,mEl))||f1(st1(el,sEl));
    const sost=el=>bazi.some(b=>WX[b]===el||GEN[WX[b]]===el);
    // G ESPOSTO: nascosto dietro una linea VUOTA
    const espo=R.linee.filter(l=>l.vuoto && l.fushen && l.fushen.par==='G');
    if (espo.length!==1) continue;
    const cov=espo[0], g=cov.fushen, dir=cov.pos<=3?'SHORT':'LONG';
    // riceve un salto? una linea clashata dal giorno che combina il ramo del G esposto
    const src=R.linee.filter(l=>l.pos!==R.mutante.pos && CLASH[D]===l.ramo && COMBINA[l.ramo]===g.b);
    const bers=src.length>=1;
    const T=timely(g.el), S=sost(g.el);
    const forza = T?'TIMELY':(S?'forte (Bazi)':'debole');
    add((bers?'A. G esposto BERSAGLIO del salto · ':'B. G esposto senza salto · ')+forza, dir, r);
    if (bers) { add('C. G esposto con salto — direzione della copertura', dir, r);
                add('D. G esposto con salto — OPPOSTA', dir==='LONG'?'SHORT':'LONG', r);
                const pnl=dir==='LONG'?r.move:-r.move;
                det.push({r,cov,g,dir,pnl,forza}); }
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== IL G ESPOSTO CHE RICEVE UN SALTO — rif. 50.40% ===');
  console.log('condizione'.padEnd(50)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(50)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
  console.log('\ncarte con G esposto che riceve un salto:');
  det.sort((a,b)=>a.r.date<b.r.date?-1:1);
  for (const e of det) console.log('  '+e.r.cross.padEnd(7)+e.r.date+'  copre L'+e.cov.pos+' '+
    e.cov.ramo+'空  伏 官鬼 '+e.g.b+' ['+e.forza+']  → '+e.dir+'  '+
    (e.pnl>0?'GIUSTO':'sbagliato')+'  '+e.pnl.toFixed(0)+' pip');
}

if (process.env.NUOVA) {
  // Carta nuova: cerco dove la regola piu' recente e piu' ampia -- il SALTO SU W (57,25%) --
  // sbaglia, applicando a monte tutte le regole registrate.
  const LYM = require('./liuyao.js');
  const SEASON={'寅':'Wood','卯':'Wood','辰':'Wood','巳':'Fire','午':'Fire','未':'Fire',
                '申':'Metal','酉':'Metal','戌':'Metal','亥':'Water','子':'Water','丑':'Water'};
  const st1=(el,m)=> el===m?'旺':GEN[m]===el?'相':GEN[el]===m?'休':CTRL[m]===el?'死':CTRL[el]===m?'囚':'休';
  const f1=s=>s==='旺'||s==='相';
  const casi=[];
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const D=r.dayBranchUsed, Mo=r.monthBranchUsed, mEl=WX[Mo], sEl=SEASON[Mo];
    const src=R.linee.filter(l=>l.pos!==R.mutante.pos && CLASH[D]===l.ramo);
    if (src.length!==1) continue;
    const s0=src[0], tr=COMBINA[s0.ramo];
    const vis=R.linee.filter(l=>l.pos!==s0.pos && l.ramo===tr && l.par==='W');
    if (vis.length!==1) continue;                     // il salto arriva su una W
    const t=vis[0], dir=t.pos<=3?'SHORT':'LONG';
    const pnl=dir==='LONG'?r.move:-r.move;
    if (pnl>=0) continue;
    casi.push({r,R,s0,t,dir,pnl});
  }
  casi.sort((a,b)=>a.pnl-b.pnl);
  const c=casi[0], r=c.r, R=c.R, ora=LYM.oraDalSeme(r.seedUsed);
  const Mo=r.monthBranchUsed, mEl=WX[Mo], sEl=SEASON[Mo];
  console.log('\n=== IL SALTO SU W SBAGLIA ===  perdenti: '+casi.length+' su 138\n');
  console.log(r.cross+'  '+r.date+'   seme '+r.seedUsed+'   sup '+r.sup+' inf '+r.inf+' mutante L'+r.linea);
  console.log('giorno '+r.dayStemUsed+r.dayBranchUsed+' · mese '+Mo+' · anno '+r.yearBranchUsed+
              ' · ora dal seme '+ora+'   palazzo '+R.palName+' ('+R.palElIt+')   vuoti '+R.vuoti.join(''));
  console.log('timely nel mese '+Mo+': '+mEl+(mEl!==sEl?' + '+sEl+' (stagione)':''));
  console.log('SALTO: L'+c.s0.pos+' '+c.s0.ramo+' clashato dal giorno → combina '+c.t.ramo+
              ' = 妻財 a L'+c.t.pos+' → '+c.dir);
  console.log('mutante L'+R.mutante.pos+': '+R.mutante.ramoDep+' → '+R.mutante.ramoArr+
              (R.mutante.progressione?'  '+R.mutante.progressione.toUpperCase():'')+'  ('+R.mutante.casoLabel+')');
  console.log('MERCATO: '+(r.move>0?'SALE':'SCENDE')+' '+Math.abs(r.move).toFixed(0)+' pip → perde '+Math.abs(c.pnl).toFixed(0));
  console.log('PB: '+(r.emaDir==='up'?(r.finale?'LONG':'SHORT'):(r.finale?'SHORT':'LONG'))+
              (r.finale?' (segue)':' (non segue)')+' → '+r.pnl.toFixed(0)+' pip   EMA '+
              (r.emaDir==='up'?'su':'giu')+' run '+r.emaRun);
  for(let k=6;k>=1;k--){const x=R.linee[k-1];
    const tD=f1(st1(x.el,mEl))||f1(st1(x.el,sEl));
    console.log('  L'+x.pos+' '+(x.yang?'▬▬▬':'▬ ▬')+' '+(x.bestia?x.bestia.cn:'--')+' '+x.parCn+' '+x.ramo+' '+x.elIt+
      (x.isShi?' 世':'')+(x.isYing?' 應':'')+(x.isMobile?' ✸':'')+(x.vuoto?' 空':'')+(x.isTaiSui?' 太歲':'')+
      (x.ramo===r.dayBranchUsed?' ←giorno':'')+(x.ramo===ora?' ←ora':'')+
      ((R.anDong||{})[x.pos]?' 暗動→'+R.anDong[x.pos].arr:'')+
      ' ['+x.stato+(tD?' TIMELY':'')+']'+(x.fushen?'  伏:'+x.fushen.parCn+x.fushen.b:''));}
}

if (process.env.TSMOB) {
  // Il Tai Sui che blocca la LINEA MOBILE (Edu, 13/08/2026, da EURJPY 13/12/2024)
  // Caso speciale del blocco dal Tai Sui: la linea impedita e' quella che si muove.
  const LYM = require('./liuyao.js');
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const Y=r.yearBranchUsed;
    const mob=R.linee[R.mutante.pos-1];
    if (COMBINA[Y]!==R.mutante.ramoDep) continue;      // il Tai Sui blocca la mobile
    const suo=mob.pos<=3?'SHORT':'LONG', opp=suo==='LONG'?'SHORT':'LONG';
    add('A. Tai Sui blocca la MOBILE — suo trigramma VINCE', suo, r);
    add('B. Tai Sui blocca la MOBILE — suo trigramma perde', opp, r);
    add('C. ... e la mobile e '+mob.par+' → vince', suo, r);
    // caso 1 回頭生: la mobile e' rafforzata dalla mutazione
    if (R.mutante.casoMut===1) add('D. ... e la mutante e in 回頭生 (rafforzata) → vince', suo, r);
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== IL TAI SUI CHE BLOCCA LA MOBILE — rif. 50.40% ===');
  console.log('condizione'.padEnd(56)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(56)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.HTS) {
  // La cella 回頭生 dipende dal Tai Sui o dal solo 回頭生? E dal parente?
  const LYM = require('./liuyao.js');
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error || R.mutante.casoMut!==1) continue;      // solo 回頭生
    const mob=R.linee[R.mutante.pos-1];
    const suo=mob.pos<=3?'SHORT':'LONG';
    const bloc = COMBINA[r.yearBranchUsed]===R.mutante.ramoDep;
    add(bloc?'A. 回頭生 CON blocco del Tai Sui — suo trigramma vince'
            :'B. 回頭生 SENZA blocco del Tai Sui — suo trigramma vince', suo, r);
    if (bloc) add('C. ... e la mobile e '+mob.par, suo, r);
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== 回頭生: conta il Tai Sui o no? — rif. 50.40% ===');
  console.log('condizione'.padEnd(56)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(56)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.MOBBLOC) {
  // La MOBILE (che quindi "parte") bloccata dal Tai Sui sulla PARTENZA: il suo trigramma
  // vince o no? Scomposto per parente, con controllo su chi NON e' bloccato.
  const LYM = require('./liuyao.js');
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const mob=R.linee[R.mutante.pos-1];
    if (!['G','W'].includes(mob.par)) continue;
    const suo=mob.pos<=3?'SHORT':'LONG';
    const blocTS = COMBINA[r.yearBranchUsed]===R.mutante.ramoDep;
    const blocD  = COMBINA[r.dayBranchUsed]===R.mutante.ramoDep;
    const et = mob.par+' mobile';
    if (blocTS)      { add(et+' · bloccata dal TAI SUI — vince', suo, r);
                       add(et+' · bloccata dal TAI SUI — perde', suo==='LONG'?'SHORT':'LONG', r); }
    else if (blocD)  { add(et+' · bloccata dal GIORNO — vince', suo, r); }
    else             { add(et+' · LIBERA — vince', suo, r); }
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== LA MOBILE G o W BLOCCATA SULLA PARTENZA — rif. 50.40% ===');
  console.log('condizione'.padEnd(48)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(48)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.TSARR) {
  // IL TAI SUI CHE BLOCCA L'ARRIVO (Edu, 13/08/2026)
  // La partenza e' libera, la linea parte -- ma il Tai Sui combina il ramo d'ARRIVO.
  const LYM = require('./liuyao.js');
  const SEASON={'寅':'Wood','卯':'Wood','辰':'Wood','巳':'Fire','午':'Fire','未':'Fire',
                '申':'Metal','酉':'Metal','戌':'Metal','亥':'Water','子':'Water','丑':'Water'};
  const st1=(el,m)=> el===m?'旺':GEN[m]===el?'相':GEN[el]===m?'休':CTRL[m]===el?'死':CTRL[el]===m?'囚':'休';
  const f1=s=>s==='旺'||s==='相';
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const Y=r.yearBranchUsed, Mo=r.monthBranchUsed, mEl=WX[Mo], sEl=SEASON[Mo];
    const dep=R.mutante.ramoDep, arr=R.mutante.ramoArr;
    if (COMBINA[Y]===dep) continue;                    // la partenza dev'essere LIBERA
    const mob=R.linee[R.mutante.pos-1];
    const suo=mob.pos<=3?'SHORT':'LONG', opp=suo==='LONG'?'SHORT':'LONG';
    const blocArr = COMBINA[Y]===arr;
    if (blocArr) {
      add('A. Tai Sui blocca l ARRIVO — suo trigramma VINCE', suo, r);
      add('B. Tai Sui blocca l ARRIVO — suo trigramma PERDE', opp, r);
      add('C. ... e la mobile e '+mob.par+' → vince', suo, r);
      if (f1(st1(mob.el,mEl))||f1(st1(mob.el,sEl))) add('D. ... mobile TIMELY → vince', suo, r);
      else add('E. ... mobile non timely → vince', suo, r);
      // caso di mutazione
      add('F. ... caso '+R.mutante.casoMut+' → vince', suo, r);
    } else {
      add('Z. arrivo libero (controllo) — suo trigramma vince', suo, r);
    }
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== IL TAI SUI CHE BLOCCA L ARRIVO — rif. 50.40% ===');
  console.log('condizione'.padEnd(52)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(52)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.ARRCLASHTS) {
  // L'ARRIVO CHE CLASHA IL TAI SUI (Edu, 13/08/2026)
  // La mobile parte e atterra su un ramo che CLASHA il ramo dell'anno.
  const LYM = require('./liuyao.js');
  const SEASON={'寅':'Wood','卯':'Wood','辰':'Wood','巳':'Fire','午':'Fire','未':'Fire',
                '申':'Metal','酉':'Metal','戌':'Metal','亥':'Water','子':'Water','丑':'Water'};
  const st1=(el,m)=> el===m?'旺':GEN[m]===el?'相':GEN[el]===m?'休':CTRL[m]===el?'死':CTRL[el]===m?'囚':'休';
  const f1=s=>s==='旺'||s==='相';
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const Y=r.yearBranchUsed, Mo=r.monthBranchUsed, mEl=WX[Mo], sEl=SEASON[Mo];
    const dep=R.mutante.ramoDep, arr=R.mutante.ramoArr;
    if (COMBINA[Y]===dep) continue;                    // partenza libera: la linea parte
    if (CLASH[Y]!==arr) continue;                      // l'arrivo CLASHA il Tai Sui
    const mob=R.linee[R.mutante.pos-1];
    const suo=mob.pos<=3?'SHORT':'LONG', opp=suo==='LONG'?'SHORT':'LONG';
    const tsTimely = f1(st1(WX[Y],mEl))||f1(st1(WX[Y],sEl));
    add('A. arrivo che CLASHA il Tai Sui — suo trigramma VINCE', suo, r);
    add('B. arrivo che CLASHA il Tai Sui — suo trigramma PERDE', opp, r);
    add('C. ... e la mobile e '+mob.par+' → vince', suo, r);
    add(tsTimely?'D. ... Tai Sui TIMELY (l urto e vero) → vince'
               :'E. ... Tai Sui non timely → vince', suo, r);
    add('F. ... caso '+R.mutante.casoMut+' → vince', suo, r);
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== L ARRIVO CHE CLASHA IL TAI SUI — rif. 50.40% ===');
  console.log('condizione'.padEnd(56)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(56)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
}

if (process.env.DOPPIOTS) {
  // PARTENZA COMBINATA + ARRIVO CHE CLASHA, entrambi dal TAI SUI (Edu, 13/08/2026,
  // da EURJPY 13/12/2024). Il Tai Sui bloccherebbe la partenza, ma l'arrivo lo urta:
  // il Tai Sui, sotto attacco, non riesce a tenere il blocco -> la linea PARTE e lo urta.
  const LYM = require('./liuyao.js');
  const mk=()=>({tutto:{w:0,l:0,p:0},recente:{w:0,l:0,p:0},vecchio:{w:0,l:0,p:0}});
  const M={}; const add=(k,dir,r)=>{ M[k]=M[k]||mk(); const pnl=dir==='LONG'?r.move:-r.move;
    const p2=r.date>='2023-05-01'?'recente':r.date<='2022-12-31'?'vecchio':null;
    for(const pp of ['tutto',p2].filter(Boolean)){const o=M[k][pp];
      if(pnl>0)o.w++; else if(pnl<0)o.l++; o.p+=pnl;}};
  const det=[];
  for (const r of rows) {
    const R = LYM.readManual(r.sup, r.inf, r.linea, r.dayBranchUsed, r.monthBranchUsed,
                             r.yearBranchUsed, r.dayStemUsed);
    if (R.error) continue;
    const Y=r.yearBranchUsed, dep=R.mutante.ramoDep, arr=R.mutante.ramoArr;
    if (COMBINA[Y]!==dep) continue;                   // partenza combinata dal Tai Sui
    if (CLASH[Y]!==arr) continue;                     // e arrivo che lo clasha
    const mob=R.linee[R.mutante.pos-1];
    const suo=mob.pos<=3?'SHORT':'LONG', opp=suo==='LONG'?'SHORT':'LONG';
    add('A. partenza combinata + arrivo che urta — VINCE', suo, r);
    add('B. partenza combinata + arrivo che urta — PERDE', opp, r);
    add('C. ... e la mobile e '+mob.par+' → perde', opp, r);
    const pnl=opp==='LONG'?r.move:-r.move;
    det.push({r,mob,dep,arr,Y,opp,pnl});
  }
  const pc=o=>(o.w+o.l)?(100*o.w/(o.w+o.l)).toFixed(2)+'%':'—';
  console.log('\n=== TAI SUI: PARTENZA COMBINATA E ARRIVO CHE LO URTA — rif. 50.40% ===');
  console.log('condizione'.padEnd(52)+'n'.padStart(6)+'tutto'.padStart(9)+'recente'.padStart(10)+
              'vecchio'.padStart(10)+'pip'.padStart(9)+'pip/tr'.padStart(9));
  for(const [k,d] of Object.entries(M).sort()){ const n=d.tutto.w+d.tutto.l; if(!n) continue;
    console.log(k.padEnd(52)+String(n).padStart(6)+pc(d.tutto).padStart(9)+
      pc(d.recente).padStart(10)+pc(d.vecchio).padStart(10)+
      d.tutto.p.toFixed(0).padStart(9)+(d.tutto.p/n).toFixed(2).padStart(9)); }
  console.log('\ncarte con questa configurazione (direzione: il trigramma della mobile PERDE):');
  det.sort((a,b)=>a.r.date<b.r.date?-1:1);
  for (const e of det.slice(0,14)) console.log('  '+e.r.cross.padEnd(7)+e.r.date+
    '  L'+e.mob.pos+' '+e.mob.parCn+' '+e.dep+'→'+e.arr+'  anno '+e.Y+
    '  → '+e.opp.padEnd(5)+'  '+(e.pnl>0?'GIUSTO':'sbagliato')+'  '+e.pnl.toFixed(0)+' pip');
}
