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
const WX = { '子':'Water','丑':'Earth','寅':'Wood','卯':'Wood','辰':'Earth','巳':'Fire',
             '午':'Fire','未':'Earth','申':'Metal','酉':'Metal','戌':'Earth','亥':'Water' };

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
  const p = process.env.SCALA === 'piatta' ? 1 : PUNTI[stagione(WX[branch], monthEl)];
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

/* lettura di base + regola del clash */
const seedToBranch = s => B[(((s-1)%12)+12)%12];
function leggi(seed, dayBranch, monthBranch, yearBranch){
  const oraBranch = seedToBranch(seed);
  const sup = mod8(Math.floor(seed/8)), inf = mod8(seed);
  const dayNum = B.indexOf(dayBranch) + 1;
  const linea = mod6(sup + inf + dayNum);
  const usoNum   = linea <= 3 ? inf : sup;
  const corpoNum = linea <= 3 ? sup : inf;
  const uso = TRIGRAM[usoNum], corpo = TRIGRAM[corpoNum];
  const A = corpo.el, Z = uso.el;          // Trend = corpo, Yong = uso (originale)
  let via, base;
  if (A === Z)                  { via='比和'; base=null; }
  else if (GEN[Z] === A)        { via='生我'; base=true;  }
  else if (CTRL[A] === Z)       { via='我剋'; base=true;  }
  else if (GEN[A] === Z)        { via='我生'; base=false; }
  else if (CTRL[Z] === A)       { via='剋我'; base=false; }
  if (base === null) return { via, base:null };

  // regola del clash del palazzo
  // palazzi doppi: la linea mobile sceglie il ramo attivo (yang = linee 1,3,5)
  let palazzo = HOUTIAN[corpoNum];
  if (palazzo.length === 2) {
    const oraYang = (B.indexOf(oraBranch) % 2) === 0;
    palazzo = palazzo.filter(b => ((B.indexOf(b) % 2) === 0) === oraYang);
  }
  const monthEl = WX[monthBranch];
  let bazi = [ {b:yearBranch, ts:true}, {b:monthBranch, ts:false}, {b:dayBranch, ts:false} ];

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

  // ECCITAZIONE: se l'elemento del Trend e' forte in stagione (旺 o 相) il clash
  // non lo spazza via, lo eccita. La regola non interviene affatto.
  const statoTrend = stagione(corpo.el, monthEl);
  const eccitato = !process.env.NOECC && (statoTrend === '旺' || statoTrend === '相');

  let att = 0, dif = 0;
  const dettAtt = [], dettDif = [];
  const dettPonte = [];
  bazi.forEach(x => {
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
    else if (WX[x.b] === corpo.el) { const w = peso(x.b, monthEl, x.ts); dif += w;
      dettDif.push(x.b+' '+stagione(WX[x.b],monthEl)+' '+w+(x.ts?' (Tai Sui)':'')); }
  });
  const spazzato = !eccitato && att > 0 && att > dif;
  return { via, base, finale: spazzato ? false : base, spazzato,
           corpo, uso, sup, inf, linea, palazzo, att, dif, dettAtt, dettDif, dettPonte, dettComb, eccitato, statoTrend, monthEl, oraBranch };
}

const hist = JSON.parse(fs.readFileSync('full1h.json','utf8'));

if (process.env.CARTA) {
  const [cr, dt] = process.env.CARTA.split(' ');
  const bs = hist.crosses[cr].filter(x => x.t.slice(0,10) === dt);
  const o = bs.find(x=>x.t.slice(11,13)==='00').o, c = bs.find(x=>x.t.slice(11,13)==='21').c;
  const p = dt.split('-').map(Number);
  const ch = DLR.buildChartFromForexSeed(Date.UTC(p[0],p[1]-1,p[2],12,0,0), 0, '子');
  const yb = yearBranchAt(p[0],p[1],p[2]);
  const seed = parseInt(f3(o),10);
  const r = leggi(seed, ch.dayBranch, ch.monthBranch, yb);
  const f = pipFactor(cr);
  console.log(cr+' — '+dt);
  console.log('seme '+seed+'   Bazi: anno '+yb+' · mese '+ch.monthBranch+' ('+r.monthEl+') · giorno '+ch.dayStem+ch.dayBranch);
  console.log('superiore '+r.sup+' → '+TRIGRAM[r.sup].name+'   inferiore '+r.inf+' → '+TRIGRAM[r.inf].name+'   linea mutante '+r.linea);
  console.log('Trend = '+r.corpo.name+' ('+r.corpo.el+')   Yong = '+r.uso.name+' ('+r.uso.el+')');
  console.log('relazione '+r.via+' → lettura di base: '+(r.base?'PROSEGUE':'INVERTE'));
  console.log('ora dal seme: '+r.oraBranch+'   palazzo del Trend: '+r.palazzo.join(''));
  console.log('attaccanti: '+(r.dettAtt.length?r.dettAtt.join(' · '):'nessuno')+'   totale '+r.att);
  console.log('ponti:      '+(r.dettPonte.length?r.dettPonte.join(' · '):'nessuno'));
  console.log('difensori:  '+(r.dettDif.length?r.dettDif.join(' · '):'nessuno')+'   totale '+r.dif);
  console.log('combinazioni: '+(r.dettComb.length?r.dettComb.join(' · '):'nessuna'));
  console.log('stato del Trend in stagione: '+r.statoTrend+(r.eccitato?'  → forte, il clash ECCITA non spazza':''));
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
    const move=(c-o)*f; if(Math.abs(move)<=10) continue;
    const seed=parseInt(f3(o),10);
    const p=d.split('-').map(Number);
    const ch=DLR.buildChartFromForexSeed(Date.UTC(p[0],p[1]-1,p[2],12,0,0),0,'子');
    if(!ch||ch.error) continue;
    const yb=yearBranchAt(p[0],p[1],p[2]);
    const r=leggi(seed, ch.dayBranch, ch.monthBranch, yb);
    if (r.base === null) continue;   // 比和 = NO TRADE
    rows.push({cross,date:d,move,emaDir:ema.direction,via:r.via,
               base:r.base, finale:r.finale, spazzato:r.spazzato,
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
            '   scala '+(process.env.SCALA==='piatta'?'piatta':'cinque stadi'));
console.log('carte: '+rows.length);
const tocc = rows.filter(r=>r.spazzato);
console.log('carte in cui il Trend è spazzato via: '+tocc.length+
            '   ('+(100*tocc.length/rows.length).toFixed(1)+'%)');
console.log();
console.log('                              trade    win%   scarto      z      pip  pip/tr');
riga('lettura di base', stat(rows,'pnlBase'));
riga('con clash del palazzo', stat(rows,'pnl'));
console.log();
const migl = tocc.filter(r=>r.pnl>0&&r.pnlBase<0), peg = tocc.filter(r=>r.pnl<0&&r.pnlBase>0);
console.log('sulle sole carte toccate: '+migl.length+' raddrizzate ('+
            migl.reduce((s,r)=>s+r.pnl,0).toFixed(0)+' pip) · '+peg.length+' guastate ('+
            peg.reduce((s,r)=>s+r.pnl,0).toFixed(0)+' pip)');
console.log('effetto netto della regola: '+
            (rows.reduce((s,r)=>s+r.pnl,0)-rows.reduce((s,r)=>s+r.pnlBase,0)).toFixed(0)+' pip');
console.log();
console.log('per relazione — base → con la regola');
['生我','我剋','我生','剋我'].forEach(v=>{
  const s=rows.filter(r=>r.via===v); if(!s.length) return;
  const a=stat(s,'pnlBase'), b=stat(s,'pnl');
  const t=s.filter(r=>r.spazzato).length;
  console.log('  '+v.padEnd(6)+String(s.length).padStart(5)+' carte  toccate '+String(t).padStart(4)+
    '   '+(100*a.act).toFixed(2)+'% '+a.pips.toFixed(0).padStart(7)+
    '  →  '+(100*b.act).toFixed(2)+'% '+b.pips.toFixed(0).padStart(7));
});
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
