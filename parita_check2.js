'use strict';
global.window = global;
const lj = require('lunar-javascript');
global.Solar = lj.Solar; global.Lunar = lj.Lunar;
require(__dirname + '/work_trading/pwa/solar-time.js');
require(__dirname + '/work_trading/pwa/jieqi-gmt.js');
const DLR = require(__dirname + '/work_trading/pwa/daliuren.js');
const T = require(__dirname + '/work_trading/pwa/trend.js');
const PB = require(__dirname + '/work_trading/pwa/plumblossom.js');
const ST = require(__dirname + '/work_trading/pwa/solar-time.js');
const fs = require('fs');
const CLASH = { '子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅',
                '卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳' };
function mezzanotteTST(y, mo, d){
  const approx = Date.UTC(y, mo-1, d, 0, 0, 0);
  let ms = approx;
  for (let i=0;i<3;i++) ms = approx - ST.equationOfTimeMinutes(new Date(ms))*60000;
  return ms;
}
function yearBranchAt(y,m,d){
  return lj.Solar.fromYmdHms(y,m,d,0,0,0).getLunar().getEightChar().getYear().charAt(1);
}
const f3 = p => { const dd = String(p).replace(/[^0-9]/g,'').replace(/^0+/,'');
  return dd.slice(0, Math.abs(Number(p)) < 1 ? 2 : 3); };
const eng = JSON.parse(fs.readFileSync('/tmp/research_rows.json','utf8'));
const hist = JSON.parse(fs.readFileSync(__dirname+'/full1h.json','utf8'));
let mism = 0, tot = 0, nullAttesi = 0, nullDati = 0, nullSbagliati = 0;
const byCross = {};
eng.forEach(r => { byCross[r.c] = byCross[r.c] || []; byCross[r.c].push(r); });
for (const cross in byCross) {
  const by = {};
  hist.crosses[cross].forEach(x => { const d=x.t.slice(0,10), hh=x.t.slice(11,13);
    by[d]=by[d]||{}; if(hh==='00') by[d].o=x.o; if(hh==='21') by[d].c=x.c; });
  const days = Object.keys(by).sort().filter(d => by[d].o!=null && by[d].c!=null);
  for (const r of byCross[cross]) {
    const k = days.indexOf(r.d);
    const closes = []; for (let j=0;j<k;j++) closes.push(by[days[j]].c);
    const ema = T.emaTrend(closes);
    const o = by[r.d].o;
    const seed = parseInt(f3(o),10);
    const p = r.d.split('-').map(Number);
    const ch = DLR.buildChartFromForexSeed(mezzanotteTST(p[0],p[1],p[2]),0,'子');
    const yb = yearBranchAt(p[0],p[1],p[2]);
    const out = PB.read(seed, ch.dayBranch, ch.monthBranch, yb, ch.dayStem, ema.runLen || 0);
    tot++;
    const clashGM = CLASH[ch.dayBranch] === ch.monthBranch;
    if (clashGM) {
      nullAttesi++;
      if (out.segue === null && out.noTradeClash) nullDati++;
      else { nullSbagliati++; if (nullSbagliati<=3) console.log('MANCATO NULL '+cross+' '+r.d); }
    } else {
      if (out.segue !== r.finale) { mism++; if (mism<=3) console.log('MISMATCH '+cross+' '+r.d+' motore='+r.finale+' pwa='+out.segue); }
    }
  }
}
console.log('carte totali: '+tot);
console.log('clash giorno-mese attesi NO TRADE: '+nullAttesi+'   resi correttamente: '+nullDati+'   mancati: '+nullSbagliati);
console.log('carte normali disallineate: '+mism);
