/* backtest.js — replays the real Trading Calculator engines over historical daily bars.
 *
 * For every past day D of every cross:
 *   seed  = first 3 significant digits of D's 00:00 GMT open → 地支
 *   chart = 大六壬 built from that seed (day pillar & 月將 at 0° / noon GMT of D)
 *   level1= trend.js verdict (voids, tombs, 六合, 三會, 刑, 月將, 返吟)
 *   ema   = EMA(8) lagged +1 on closes strictly BEFORE D  → direction + consolidation filter
 *   signal= LONG / SHORT / NO TRADE
 *   pnl   = (close − open) of D, signed by the signal   [entry 00:00 GMT, exit end of day]
 *
 * Bars with open === close are DROPPED (Twelve Data's free plan fakes the open on some
 * history: a fake open means a fake seed, not just a zero P&L).
 */
'use strict';

global.window = global;
const lj = require('lunar-javascript');
global.Solar = lj.Solar; global.Lunar = lj.Lunar;
require('./work_trading/solar-time.js');
require('./work_trading/jieqi-gmt.js');
const DLR = require('./work_trading/daliuren.js');
const T = require('./work_trading/trend.js');

const fs = require('fs');

// ---- load history ----------------------------------------------------------
function loadHistory(path) {
  let raw = fs.readFileSync(path, 'utf8');
  const i = raw.indexOf('{"generatedAt');
  if (i > 0) raw = raw.slice(i);
  raw = raw.slice(0, raw.lastIndexOf('}') + 1);
  return JSON.parse(raw);
}

// ---- helpers ---------------------------------------------------------------
const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
function firstThreeSignificant(price) {
  return String(price).replace(/[^0-9]/g, '').replace(/^0+/, '').slice(0, 3);
}
function seedToBranch(seed) { return BRANCHES[(((seed - 1) % 12) + 12) % 12]; }
function pipFactor(cross) { return /JPY$/.test(cross) ? 100 : 10000; }

// season ruling element from the last 立 term (same rule as app.js)
const LI = { '立春': 'Wood', '立夏': 'Fire', '立秋': 'Metal', '立冬': 'Water' };
const seasonCache = {};
function seasonElementFor(y, mo, dd) {
  const key = y + '-' + mo + '-' + dd;
  if (seasonCache[key] !== undefined) return seasonCache[key];
  const target = Date.UTC(y, mo - 1, dd);
  let last = null, lastElem = null;
  [y - 1, y].forEach(function (yr) {
    const tbl = Lunar.fromYmd(yr, 1, 1).getJieQiTable();
    Object.keys(tbl).forEach(function (name) {
      if (!LI[name]) return;
      const s = tbl[name];
      const ms = Date.UTC(s.getYear(), s.getMonth() - 1, s.getDay());
      if (ms <= target && (last === null || ms > last)) { last = ms; lastElem = LI[name]; }
    });
  });
  seasonCache[key] = lastElem;
  return lastElem;
}

// ---- per-day evaluation ----------------------------------------------------
function evalDay(cross, bars, k) {
  const bar = bars[k];
  const out = { cross: cross, date: bar.d };

  if (bar.o === bar.c) { out.skip = 'degenerate bar (fake open)'; return out; }

  // EMA from closes strictly before D
  const closes = [];
  for (let j = 0; j < k; j++) closes.push(bars[j].c);
  const ema = T.emaTrend(closes);
  out.emaDirection = ema.direction;
  out.emaConsolidated = ema.consolidated;
  out.emaChanges = ema.changes;
  if (!ema.direction || ema.direction === 'flat') { out.skip = 'no EMA direction'; return out; }
  if (!ema.consolidated) { out.signal = 'NO TRADE'; out.reason = 'EMA not consolidated'; return out; }

  // seed → chart
  const d3 = firstThreeSignificant(bar.o);
  const seed = parseInt(d3, 10);
  const branch = seedToBranch(seed);
  out.seed = seed; out.branch = branch;

  const p = bar.d.split('-').map(Number);
  const utcMs = Date.UTC(p[0], p[1] - 1, p[2], 12, 0, 0);   // noon GMT anchor, 0° Greenwich
  const chart = DLR.buildChartFromForexSeed(utcMs, 0, branch);
  if (!chart || chart.error) { out.skip = 'chart error: ' + (chart && chart.error); return out; }

  const t3 = chart.transmission.three;
  out.method = chart.transmission.method;
  out.three = t3.chu + t3.zhong + t3.mo;

  const v = T.evaluateTrend(t3.chu, t3.zhong, t3.mo, {
    dayStem: chart.dayStem,
    voidBranches: chart.hourVoid,
    seasonElement: seasonElementFor(p[0], p[1], p[2]),
    monthGeneral: chart.monthGeneral && chart.monthGeneral.branch,
    isFanYin: chart.transmission.special === '返吟'
  });
  out.confirmed = v.confirmed;
  out.combo = v.combo ? v.combo.cn + '/' + v.combo.order : null;

  if (v.noTrade) { out.signal = 'NO TRADE'; out.reason = '返吟 Fan Yin'; return out; }

  out.signal = ema.direction === 'up' ? (v.confirmed ? 'LONG' : 'SHORT')
                                      : (v.confirmed ? 'SHORT' : 'LONG');
  // P&L: entry at 00:00 open, exit at end of day close
  const f = pipFactor(cross);
  const move = (bar.c - bar.o) * f;                 // pips, positive = price rose
  out.movePips = move;
  out.pnl = out.signal === 'LONG' ? move : -move;
  out.win = out.pnl > 0;
  return out;
}

function run(histPath) {
  const hist = loadHistory(histPath);
  const rows = [];
  Object.keys(hist.crosses).forEach(function (cross) {
    const bars = hist.crosses[cross];
    if (!Array.isArray(bars)) return;
    for (let k = 12; k < bars.length; k++) rows.push(evalDay(cross, bars, k));
  });
  return rows;
}

module.exports = { run, evalDay, loadHistory, seasonElementFor, firstThreeSignificant, seedToBranch, pipFactor };

if (require.main === module) {
  const rows = run(process.argv[2]);
  fs.writeFileSync('/home/claude/bt_rows.json', JSON.stringify(rows));
  const traded = rows.filter(r => r.signal === 'LONG' || r.signal === 'SHORT');
  console.log('giorni valutati:', rows.length);
  console.log('scartati (dati degeneri / storia insufficiente):', rows.filter(r => r.skip).length);
  console.log('NO TRADE:', rows.filter(r => r.signal === 'NO TRADE').length);
  console.log('trade eseguiti:', traded.length);
  console.log('vinti:', traded.filter(r => r.win).length, '→', (100 * traded.filter(r => r.win).length / traded.length).toFixed(2) + '%');
}
