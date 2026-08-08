/* catena_v8.js — lettura a CATENE.
 * Sostituisce il torneo. Due catene percorse dal basso; i punti d'arrivo si confrontano.
 */
'use strict';
global.window = global;
const lj = require('lunar-javascript');
global.Solar = lj.Solar; global.Lunar = lj.Lunar;
require('./work_trading/pwa/solar-time.js');
require('./work_trading/pwa/jieqi-gmt.js');
const ST_ = require('./work_trading/pwa/solar-time.js');
// istante in cui a Greenwich entra il nuovo giorno in tempo solare vero:
// le 00:00 GMT corrette per l'equazione del tempo (oscilla di circa +/- 15 minuti)
function mezzanotteTST(y, mo, d){
  const approx = Date.UTC(y, mo-1, d, 0, 0, 0);
  let ms = approx;
  for (let i=0;i<3;i++) ms = approx - ST_.equationOfTimeMinutes(new Date(ms))*60000;
  return ms;
}
const ISTANTE = (y,mo,d) => process.env.GMT00 ? Date.UTC(y,mo-1,d,0,0,0) : mezzanotteTST(y,mo,d);
const DLR = require('./work_trading/pwa/daliuren.js');
const T = require('./work_trading/pwa/trend.js');
const fs = require('fs');

const B = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const WX = { '子':'Water','丑':'Earth','寅':'Wood','卯':'Wood','辰':'Earth','巳':'Fire',
             '午':'Fire','未':'Earth','申':'Metal','酉':'Metal','戌':'Earth','亥':'Water' };
const STELO = { '甲':'Wood','乙':'Wood','丙':'Fire','丁':'Fire','戊':'Earth',
                '己':'Earth','庚':'Metal','辛':'Metal','壬':'Water','癸':'Water' };
const CTRL = { 'Wood':'Earth','Earth':'Water','Water':'Fire','Fire':'Metal','Metal':'Wood' };
const GEN  = { 'Wood':'Fire','Fire':'Earth','Earth':'Metal','Metal':'Water','Water':'Wood' };
const TOMBA = { 'Wood':'未','Fire':'戌','Earth':'戌','Metal':'丑','Water':'辰' };
const AUTO = ['辰','午','酉','亥'];
const JIGONG = { '甲':'寅','乙':'辰','丙':'巳','丁':'未','戊':'巳',
                 '己':'未','庚':'申','辛':'戌','壬':'亥','癸':'丑' };

// --- ramo del mese preso dall'istante del 節, non dal giorno di calendario ---
const JIE2BRANCH = { '立春':'寅','驚蟄':'卯','惊蛰':'卯','清明':'辰','立夏':'巳','芒種':'午','芒种':'午','小暑':'未',
                     '立秋':'申','白露':'酉','寒露':'戌','立冬':'亥','大雪':'子','小寒':'丑' };
const _lunarSolar = require('lunar-javascript').Solar;
function monthBranchAt(utcMs){
  // gli istanti dei jieqi della libreria sono in ora cinese (UTC+8)
  let best=null;
  for(const dy of [-1,0]){
    const d=new Date(utcMs+dy*365*24*3600e3);
    const tab=_lunarSolar.fromYmdHms(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate(),12,0,0)
                         .getLunar().getJieQiTable();
    for(const name in JIE2BRANCH){
      const jq=tab[name]; if(!jq) continue;
      const ms=Date.parse(jq.toYmdHms().replace(' ','T')+'Z')-8*3600e3;
      if(ms<=utcMs && (!best||ms>best.ms)) best={ms:ms,branch:JIE2BRANCH[name]};
    }
  }
  return best?best.branch:null;
}
const baZhuan = ch => JIGONG[ch.dayStem] === ch.dayBranch;
const fanYin  = ch => ch.transmission && ch.transmission.special === '返吟';
const autoMeseGiorno = ch => AUTO.includes(ch.dayBranch) && ch.monthBranch === ch.dayBranch;
const scarta  = ch => baZhuan(ch) || fanYin(ch) || autoMeseGiorno(ch);
const SHENG_START = { Wood:'亥', Fire:'寅', Metal:'巳', Water:'申' };
const EARTH_MONTHS = ['辰','未','戌','丑'];
const STAGE_RANK = {1:6,2:6,3:7,4:8,5:9,6:5,7:4,8:3,9:1,10:0,11:2,12:2};
function lifeStage(el, mb){ if(!el||!mb||!SHENG_START[el]) return null;
  const s=B.indexOf(SHENG_START[el]), m=B.indexOf(mb); if(s<0||m<0) return null;
  return ((m-s)%12+12)%12+1; }
function stageRank(st){ return st ? STAGE_RANK[st] : 5; }
function earthRank(mb){ if(!mb) return 5;
  if(EARTH_MONTHS.indexOf(mb)>=0) return 8;
  return Math.max(stageRank(lifeStage('Fire',mb)), 2); }
function elemRank(el, mb){ return el==='Earth' ? earthRank(mb) : stageRank(lifeStage(el,mb)); }
const chong = b => B[(B.indexOf(b)+6)%12];
const controllaEl = (a,b) => a !== b && CTRL[a] === b;
const generaEl = (a,b) => a !== b && GEN[a] === b;
const controlla = (a,b) => controllaEl(WX[a], WX[b]);

function forzaBase(b, ctx){
  if (b === ctx.monthGeneral) return 9;
  let r = elemRank(WX[b], ctx.monthBranch);
  if (chong(ctx.dayBranch) === b) r = (r>=5) ? Math.min(9,r+1) : 0;
  if (ctx.voids.indexOf(b) >= 0 && r > 0) r = Math.floor(r/2);
  return r;
}
function forza(b, ctx){
  const d = (ctx.flusso && ctx.flusso[b]) || 0;
  return Math.max(0, Math.min(9, forzaBase(b, ctx) + d));
}
// flusso del qi lungo la fila dei rami celesti, dalla quarta colonna alla prima.
// I vuoti non ricevono: si saltano, ma il salto lo puo fare solo chi sta a forza 9.
// Flusso del qi: nasce SOLO al confine fra le due sezioni (colonna 3 = DB, colonna 2 = DS)
// e una volta passato prosegue nella stessa direzione. I vuoti non ricevono e si saltano,
// ma il salto lo puo fare solo chi sta a forza 9.
// fila = [col4, col3 | col2, col1]   indici 0,1 = DB   indici 2,3 = DS
function calcolaFlusso(fila, ctx){
  const f = {}; ctx.flusso = f; const passi = []; ctx.dona = {}; ctx.passiFlusso = passi;
  const vivo = i => i >= 0 && i < fila.length && !vuoto(fila[i], ctx);
  const genera = (a,b) => WX[a] !== WX[b] && GEN[WX[a]] === WX[b];
  let sx = 1; while (sx >= 0 && !vivo(sx)) sx--;
  let dx = 2; while (dx < fila.length && !vivo(dx)) dx++;
  if (sx < 0 || dx >= fila.length) return;
  const saltato = (sx !== 1) || (dx !== 2);
  const a = fila[sx], b = fila[dx];
  let dir = 0;
  if (genera(a,b)) dir = +1; else if (genera(b,a)) dir = -1;
  if (!dir) return;
  const donatore = dir > 0 ? a : b;
  if (saltato && forzaBase(donatore, ctx) < 9) return;
  const applica = (da, ad, salto) => {
    f[da] = (f[da]||0) - 1; f[ad] = (f[ad]||0) + 1; ctx.dona[da] = ad;
    passi.push(da + ' genera ' + ad + (salto ? ' scavalcando il vuoto' : ''));
  };
  if (dir > 0) applica(a, b, saltato); else applica(b, a, saltato);
  let cur = dir > 0 ? dx : sx;
  while (true) {
    let nxt = cur + dir, salto = false;
    while (nxt >= 0 && nxt < fila.length && vuoto(fila[nxt], ctx)) { nxt += dir; salto = true; }
    if (nxt < 0 || nxt >= fila.length) break;
    const x = fila[cur], y = fila[nxt];
    if (!genera(x, y)) break;
    if (salto && forzaBase(x, ctx) < 9) break;
    applica(x, y, salto);
    cur = nxt;
  }
}
const vuoto = (b, ctx) => ctx.voids.indexOf(b) >= 0 && b !== ctx.monthGeneral;
const clashata = (t, ctx) => ctx.presenti.indexOf(chong(t)) >= 0 || chong(t) === ctx.dayBranch;
function tombaAttiva(sotto, sopra, ctx){
  return !!sopra && TOMBA[WX[sotto]] === sopra && !vuoto(sopra, ctx) && !clashata(sopra, ctx);
}

// percorre la catena dal basso: ritorna null se muore, altrimenti {ramo, passi}
function percorri(catena, ctx){
  if (vuoto(catena[0], ctx)) return null;                 // la base non c'e
  let i = 0;
  while (i + 1 < catena.length) {
    if (tombaAttiva(catena[i], catena[i+1], ctx)) return null;   // sepolto: catena morta
    if (vuoto(catena[i+1], ctx)) break;                          // il gradino manca: ci si ferma
    i++;
  }
  return { ramo: catena[i], passi: i };
}

function autopenalita(catena, ramo, ctx){
  if (AUTO.indexOf(ramo) < 0) return false;
  if (ramo === ctx.monthGeneral) return false;
  return catena.filter(b => b === ramo).length >= 2;      // solo dentro la propria sezione
}

const TRIGONI = { Water:['申','子','辰'], Wood:['亥','卯','未'], Fire:['寅','午','戌'], Metal:['巳','酉','丑'] };
function trigonoCompleto(rami, ctx, sede){
  // il vuoto blocca i rami che stanno sulle colonne; la sede dello stelo non e un ramo
  for(const k in TRIGONI){ const u=[...new Set(rami.filter(x=>TRIGONI[k].includes(x)))];
    if(u.length===3 && !u.some(r=>r!==sede && vuoto(r,ctx))) return k; }
  return null;
}
function leggi(ch){
  const L = ch.fourLessons;
  const top = l => (l.top && l.top.branch) ? l.top.branch : l.top;
  const DB = [L[2].bottom, top(L[2]), top(L[3])];
  const DS = [top(L[0]), top(L[1])];
  const ctx = { monthBranch: ch.monthBranch,
                monthGeneral: ch.monthGeneral && ch.monthGeneral.branch,
                dayBranch: ch.dayBranch, voids: ch.hourVoid || [],
                presenti: DB.concat(DS), flusso: {} };
  const fila = [top(L[3]), top(L[2]), top(L[1]), top(L[0])];   // dalla 4ª alla 1ª
  calcolaFlusso(fila, ctx);
  // catena di generazione lungo la fila: ogni passo e una generazione o due rami
  // dello stesso elemento. Il verso e quello in cui la catena funziona. Se il punto
  // d'arrivo genera il stelo del giorno, il flusso prosegue fino al tronco.
  // il pari elemento lascia passare il qi ma non decide il verso: lo decidono
  // i passi con generazione vera, che devono essere tutti concordi.
  const passoOk = (x,y) => WX[x] === WX[y] || GEN[WX[x]] === WX[y];
  const haGenVera = seq => { for(let k=1;k<seq.length;k++) if(GEN[WX[seq[k-1]]]===WX[seq[k]]) return true; return false; };
  const iB = r => B.indexOf(r);
  const passoSeq = (x,y,verso) => { const d=(iB(y)-iB(x)+12)%12; return d===0 || d===verso; };
  const scorre = seq => {
    for (const r of seq) if (vuoto(r, ctx)) return false;   // un vuoto ferma la catena
    for (let k=1;k<seq.length;k++) if(!passoOk(seq[k-1],seq[k])) return false;
    return true;
  };
  const avanti  = fila;                 // dalla 4a alla 1a
  const indietro= fila.slice().reverse(); // dalla 1a alla 4a
  const scorreSeq = (seq,verso) => {
    for (const r of seq) if (vuoto(r, ctx)) return false;
    for (let k=1;k<seq.length;k++) if(!passoSeq(seq[k-1],seq[k],verso)) return false;
    return true;
  };
  let cat = null;
  if (scorre(avanti)   && haGenVera(avanti))   cat = { seq: avanti,   ultimo: avanti[3]   };
  else if (scorre(indietro) && haGenVera(indietro)) cat = { seq: indietro, ultimo: indietro[3] };
  else if (scorreSeq(avanti,1))  cat = { seq: avanti,   ultimo: avanti[3]   };
  else if (scorreSeq(indietro,1))cat = { seq: indietro, ultimo: indietro[3] };
  ctx.progressione = !!cat;
  ctx.ultimoFila   = cat ? cat.ultimo : null;
  // il stelo del giorno chiude la catena se riceve il qi dall'ultimo ramo
  ctx.chiudeSulTronco = cat ? (GEN[WX[cat.ultimo]] === STELO[ch.dayStem]) : false;
  // trigoni: il DS puo completare il proprio col palazzo d'alloggio dello stelo
  const trigDB = trigonoCompleto(DB, ctx);
  const trigDS = trigonoCompleto(DS.concat([JIGONG[ch.dayStem]]), ctx, JIGONG[ch.dayStem]);
  ctx.trigDB = trigDB; ctx.trigDS = trigDS;
  let a = percorri(DB, ctx), b = percorri(DS, ctx);
  // il qi si ferma dove non viene piu ceduto: se l'arrivo dona a un ramo della stessa
  // sezione, il rappresentante si sposta la
  const riposa = (r, sez) => {
    if (!r) return r;
    let cur = r.ramo, giri = 0;
    while (ctx.dona[cur] && sez.indexOf(ctx.dona[cur]) >= 0 && giri++ < 4) cur = ctx.dona[cur];
    return cur === r.ramo ? r : { ramo: cur, passi: r.passi, spostato: true };
  };
  a = riposa(a, DB); b = riposa(b, DS);
  // trigono difettoso da una parte: si consultano i tre messaggi e vince la sezione
  // il cui trigono e rappresentato li dentro
  let vinceDB, via;
  const tre = ch.transmission && ch.transmission.three
              ? [ch.transmission.three.chu, ch.transmission.three.zhong, ch.transmission.three.mo] : null;
  const trigMsg = tre ? trigonoCompleto(tre, ctx) : null;
  ctx.treMessaggi = tre; ctx.trigMsg = trigMsg;
  if (trigMsg && ((trigDB && !trigDS) || (trigDS && !trigDB))) {
    if (trigDB === trigMsg)      { vinceDB = true;  via = 'tre messaggi: il trigono e quello del giorno'; }
    else if (trigDS === trigMsg) { vinceDB = false; via = 'tre messaggi: il trigono e quello dello stelo'; }
  }
  if (vinceDB !== undefined) { /* deciso dai messaggi */ }
  else if (!a && !b) { vinceDB = false; via = 'entrambe morte'; }
  else if (!a)  { vinceDB = false; via = 'catena del giorno morta'; }
  else if (!b)  { vinceDB = true;  via = 'catena dello stelo morta'; }
  else {
    const autoA = autopenalita(DB, a.ramo, ctx), autoB = autopenalita(DS, b.ramo, ctx);
    const fa = forza(a.ramo, ctx), fb = forza(b.ramo, ctx);
    if (ctx.trigDB && ctx.trigDS && ctx.trigDB !== ctx.trigDS &&
        (CTRL[ctx.trigDB] === ctx.trigDS || CTRL[ctx.trigDS] === ctx.trigDB)) {
      vinceDB = (CTRL[ctx.trigDB] === ctx.trigDS); via = 'trigoni: vince quello che controlla'; }
    else if (controlla(a.ramo, b.ramo) && !controlla(b.ramo, a.ramo)) { vinceDB = true;  via = 'controllo'; }
    else if (controlla(b.ramo, a.ramo) && !controlla(a.ramo, b.ramo)) { vinceDB = false; via = 'controllo'; }
    else if (ctx.progressione && ctx.chiudeSulTronco) { vinceDB = false; via = 'la catena finisce sul stelo del giorno'; }
    else if (ctx.progressione && ctx.ultimoFila === ch.dayBranch) { vinceDB = true; via = 'la catena torna al ramo del giorno'; }
    else if (ctx.progressione) { vinceDB = DB.includes(ctx.ultimoFila); via = 'catena di generazione: vince l\'ultimo ramo'; }
    else if (autoA !== autoB) { vinceDB = !autoA; via = 'autopenalità'; }
    else if (fa !== fb) { vinceDB = fa > fb; via = 'forza'; }
    else {
      // pareggio: il stelo del giorno e la radice del DS, puo far vincere il DS
      // ma mai il DB. Se il DB non vince, ha perso: l'esito e comunque "non segue".
      const el = STELO[ch.dayStem];
      vinceDB = false;
      if (controllaEl(el, WX[a.ramo]) || generaEl(el, WX[b.ramo])) via = 'stelo a favore del DS';
      else via = 'pareggio, il DB non vince';
    }
  }
  return { DB, DS, ctx, a, b, vinceDB, prosegue: vinceDB, via };
}

// ---------------- verifica sulle carte di riferimento ----------------
if (process.env.VERIFICA === '1') {
  [[Date.UTC(2023,2,15,12,0,0),'亥','EURJPY 15 marzo 2023','non segue'],
   [Date.UTC(2023,11,7,12,0,0),'寅','USDJPY 7 dicembre 2023','non segue'],
   [Date.UTC(2022,4,5,12,0,0),'巳','GBPUSD 5 maggio 2022','non segue'],
   [Date.UTC(2022,11,20,12,0,0),'子','EURJPY 20 dicembre 2022','non segue']].forEach(c => {
    const ch = DLR.buildChartFromForexSeed(c[0], 0, c[1]);
    if(ch && !ch.error) ch.monthBranch = monthBranchAt(c[0]) || ch.monthBranch;
    const r = leggi(ch);
    const mostra = (cat, ctx) => cat.map(b => b + '(' + forza(b, ctx) + (vuoto(b,ctx)?' vuoto':'') + ')').join(' → ');
    console.log(c[2] + '   giorno ' + ch.dayStem + ch.dayBranch + ', mese ' + ch.monthBranch +
                ', generale ' + r.ctx.monthGeneral + ', vuoti ' + r.ctx.voids.join(''));
    console.log('   DB ' + mostra(r.DB, r.ctx) + '   arrivo: ' + (r.a ? r.a.ramo : 'CATENA MORTA'));
    console.log('   DS ' + mostra(r.DS, r.ctx) + '   arrivo: ' + (r.b ? r.b.ramo : 'CATENA MORTA'));
    console.log('   deciso per ' + r.via + ' → ' + (r.prosegue ? 'PROSEGUE' : 'non segue') +
                '   [atteso: ' + c[3] + ']  ' + ((r.prosegue?'prosegue':'non segue') === c[3] ? 'OK' : '*** DIVERSO ***'));
    console.log();
  });
  process.exit(0);
}

// ---------------- una carta sola: CARTA="EURJPY 2024-05-01" ----------------
const firstThree = p => { const d=String(p).replace(/[^0-9]/g,'').replace(/^0+/,'');
  return d.slice(0, Math.abs(Number(p))<1 ? 2 : 3); };
const seedToBranch = s => B[(((s-1)%12)+12)%12];
function seedEdge(price){ const p=Math.abs(Number(price)); if(!(p>0)) return null;
  const n=p<1?2:3; const step=Math.pow(10,Math.floor(Math.log10(p))-n+1);
  const fr=p/step-Math.floor(p/step); return Math.min(fr,1-fr)*100; }
const pipFactor = c => /JPY$/.test(c) ? 100 : 10000;
const hist = JSON.parse(fs.readFileSync('full1h.json','utf8'));
if (process.env.CARTA) {
  const [cr, dt] = process.env.CARTA.split(' ');
  const bs = hist.crosses[cr].filter(x => x.t.slice(0,10) === dt);
  const o = bs.find(x=>x.t.slice(11,13)==='00').o, c = bs.find(x=>x.t.slice(11,13)==='21').c;
  const p = dt.split('-').map(Number);
  const _ms0 = ISTANTE(p[0],p[1],p[2]);
  const ch = DLR.buildChartFromForexSeed(ISTANTE(p[0],p[1],p[2]), 0,
              seedToBranch(parseInt(firstThree(o),10)));
  if(ch && !ch.error) ch.monthBranch = monthBranchAt(_ms0) || ch.monthBranch;
  const r = leggi(ch);
  const et = (b) => b + '(' + forza(b, r.ctx) + (vuoto(b,r.ctx) ? ' VUOTO' : '') + ')';
  console.log(cr + ' — ' + dt);
  console.log('prezzo 00:00 ' + o + '  → cifre ' + firstThree(o) +
              ' → ora ' + seedToBranch(parseInt(firstThree(o),10)));
  console.log('giorno ' + ch.dayStem + ch.dayBranch + '   mese ' + ch.monthBranch +
              '   generale ' + r.ctx.monthGeneral + '   vuoti ' + r.ctx.voids.join(''));
  ['DB','DS'].forEach(k => {
    const cat = r[k];
    let s2 = '';
    for (let i=0;i<cat.length;i++){
      s2 += et(cat[i]);
      if (i+1 < cat.length) {
        if (tombaAttiva(cat[i], cat[i+1], r.ctx)) { s2 += '  ✗ TOMBA di ' + cat[i] + ' → catena morta'; break; }
        if (vuoto(cat[i+1], r.ctx)) { s2 += '  ✗ ' + cat[i+1] + ' vuoto → ci si ferma'; break; }
        s2 += ' → ';
      }
    }
    console.log(k + ': ' + s2 + '     arrivo: ' + ((k==='DB'?r.a:r.b) ? (k==='DB'?r.a.ramo:r.b.ramo) : 'nessuno'));
  });
  console.log('fila dei celesti (4ª→1ª): ' + [ (ch.fourLessons[3].top.branch||ch.fourLessons[3].top),
    (ch.fourLessons[2].top.branch||ch.fourLessons[2].top), (ch.fourLessons[1].top.branch||ch.fourLessons[1].top),
    (ch.fourLessons[0].top.branch||ch.fourLessons[0].top) ].join(' · '));
  console.log('flusso del qi: ' + (r.ctx.passiFlusso.length ? r.ctx.passiFlusso.join('; ') : 'nessuno'));
  console.log('stelo del giorno: ' + ch.dayStem + ' (' + STELO[ch.dayStem] + ')');
  console.log('deciso per ' + r.via + ' → ' + (r.prosegue ? 'IL TREND PROSEGUE' : 'il trend NON SEGUE'));
  // --- EMA del giorno, con la serie che la alimenta ---
  const byD={}; hist.crosses[cr].forEach(x=>{const dd=x.t.slice(0,10),hh=x.t.slice(11,13);
    byD[dd]=byD[dd]||{}; if(hh==='00')byD[dd].o=x.o; if(hh==='21')byD[dd].c=x.c;});
  const gg=Object.keys(byD).sort().filter(x=>byD[x].o!=null&&byD[x].c!=null);
  const ki=gg.indexOf(dt);
  const cls=[]; for(let j=0;j<ki;j++) cls.push(byD[gg[j]].c);
  const em=T.emaTrend(cls);
  console.log('esito: 21:00 ' + c + '   movimento ' + ((c-o)*pipFactor(cr)).toFixed(0) + ' pip');
  console.log('il trend ha ' + (((em.direction==='up') === ((c-o)>0)) ? 'PROSEGUITO' : 'INVERTITO'));
  console.log('EMA: direzione ' + em.direction + '   consolidamento ' + (em.consolidated?'ok':'no'));
  const N=8,al=2/(N+1); let ev=null; const serie=[];
  for(let j=0;j<=ki;j++){const cc=byD[gg[j]].c; ev = ev===null?cc:cc*al+ev*(1-al);
    if(j>=ki-24) serie.push(gg[j]+' '+cc.toFixed(5)+' '+ev.toFixed(5));}
  console.log('SERIE(data chiusura ema): ' + serie.join(' | '));
  process.exit(0);
}
const FROM = process.env.FROM || '2020-01-01', TO = process.env.TO || '2024-05-31';
const rows = [];
Object.keys(hist.crosses).forEach(cross => {
  const by = {};
  hist.crosses[cross].forEach(x => { const d=x.t.slice(0,10), hh=x.t.slice(11,13);
    by[d]=by[d]||{}; if(hh==='00') by[d].o=x.o; if(hh==='21') by[d].c=x.c; });
  const days = Object.keys(by).sort().filter(d => by[d].o!=null && by[d].c!=null);
  const f = pipFactor(cross);
  for (let k=12;k<days.length;k++){
    const d=days[k]; if(d<FROM||d>TO) continue;
    const closes=[]; for(let j=0;j<k;j++) closes.push(by[days[j]].c);
    const ema=T.emaTrend(closes);
    if(!ema.direction||ema.direction==='flat'||!ema.consolidated) continue;
    const o=by[d].o, c=by[d].c;
    const e=seedEdge(o); if(e!=null&&e<3) continue;
    const p=d.split('-').map(Number);
    const _ms0b = ISTANTE(p[0],p[1],p[2]);
    const ch=DLR.buildChartFromForexSeed(ISTANTE(p[0],p[1],p[2]),0,
              seedToBranch(parseInt(firstThree(o),10)));
    if(!ch||ch.error) continue;
    ch.monthBranch = monthBranchAt(_ms0b) || ch.monthBranch;
    if(scarta(ch)) continue;              // 八專 e 返吟: carte senza contesa o dove tutto clasha
    const r=leggi(ch);
    const move=(c-o)*f;
    const sig = ema.direction==='up' ? (r.prosegue?'LONG':'SHORT') : (r.prosegue?'SHORT':'LONG');
    rows.push({cross,date:d,move,emaDir:ema.direction,prosegue:r.prosegue,via:r.via,
               pnl: sig==='LONG'?move:-move});
  }
});
fs.writeFileSync('/home/claude/rows_catena_v23.json', JSON.stringify(rows.filter(r=>Math.abs(r.move)>10)));
function stat(sel){
  const w=sel.filter(r=>r.pnl>0).length,l=sel.filter(r=>r.pnl<0).length,n=w+l; if(!n) return null;
  const ew=sel.filter(r=>(r.emaDir==='up'?r.move:-r.move)>0).length;
  const el=sel.filter(r=>(r.emaDir==='up'?r.move:-r.move)<0).length;
  const pE=ew/(ew+el), sh=sel.filter(r=>!r.prosegue).length/sel.length;
  const exp=pE*(1-sh)+(1-pE)*sh, act=w/n, se=Math.sqrt(exp*(1-exp)/n);
  const pips=sel.reduce((s,r)=>s+r.pnl,0);
  return {n,act,exp,z:(act-exp)/se,pips,ppt:pips/n};
}
function riga(lab,s){ if(!s) return;
  console.log(lab.padEnd(34)+String(s.n).padStart(6)+(100*s.act).toFixed(2).padStart(8)+'%'+
    (100*s.exp).toFixed(2).padStart(8)+'%'+(100*(s.act-s.exp)).toFixed(2).padStart(8)+' pp'+
    s.z.toFixed(2).padStart(7)+s.pips.toFixed(0).padStart(9)+s.ppt.toFixed(2).padStart(8)); }
const sel = rows.filter(r=>Math.abs(r.move)>10);
console.log('carte oltre 10 pip:', sel.length);
console.log('quota di inversioni:', (100*sel.filter(r=>!r.prosegue).length/sel.length).toFixed(1)+'%');
const vie={}; sel.forEach(r=>vie[r.via]=(vie[r.via]||0)+1);
console.log('come viene deciso:');
Object.keys(vie).sort((a,b)=>vie[b]-vie[a]).forEach(v=>
  console.log('   '+v.padEnd(28)+String(vie[v]).padStart(5)+'   '+(100*vie[v]/sel.length).toFixed(1)+'%'));
console.log();
console.log('                                  trade    win%   atteso   scarto      z      pip  pip/tr');
riga('CATENE v8', stat(sel));
console.log('torneo v7                          4214   49.69%   50.17%   -0.48 pp  -0.62      314    0.07');
console.log('motore vecchio a tre trasmissioni  3855   50.74%   50.01%    0.73 pp   0.91     4619    1.20');
console.log();
console.log('anno per anno');
const pY={}; sel.forEach(r=>{(pY[r.date.slice(0,4)]=pY[r.date.slice(0,4)]||[]).push(r);});
Object.keys(pY).sort().forEach(y=>riga('  '+y, stat(pY[y])));
console.log();
console.log('cross per cross');
const pC={}; sel.forEach(r=>{(pC[r.cross]=pC[r.cross]||[]).push(r);});
Object.keys(pC).sort().forEach(c=>riga('  '+c, stat(pC[c])));
