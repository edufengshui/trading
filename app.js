/* app.js — Trading Calculator (大六壬 / Da Liu Ren).
 * Builds the chart from a date/time/longitude through the pipeline:
 *   lunar.js → solar-time.js (XKDGSolarTime) → jieqi-gmt.js (XKDGJieQiGMT) → daliuren.js (XKDGDaLiuRen)
 * Pure UI here; all metaphysics live in the engine libraries.
 */
'use strict';

var METHOD_EN = {
  '元首': 'Beginning Leader', '重審': 'Re-examination', '比用': 'Knowing One', '涉害': 'Wading Harm',
  '遙剋·蒿矢': 'Distant Control: Arrow', '遙剋·彈射': 'Distant Control: Shooting',
  '遙剋·蒿矢·比用': 'Distant Control: Arrow', '遙剋·彈射·比用': 'Distant Control: Shooting',
  '昴星': 'Hairy Head', '別責': 'Other Responsibility', '八專': 'Eight Specialty', '伏吟': 'Hidden Hum',
  '返吟·重審': 'Fan Yin: Re-examination', '返吟·元首': 'Fan Yin: Beginning Leader',
  '返吟·比用': 'Fan Yin: Knowing One', '返吟·涉害': 'Fan Yin: Wading Harm', '返吟·驛馬': 'Fan Yin: Post Horse'
};

function $(id) { return document.getElementById(id); }
function pad(n) { return String(n).padStart(2, '0'); }
function showErr(msg) { var e = $('err'); e.style.display = 'block'; e.innerHTML = msg; }
function clearErr() { $('err').style.display = 'none'; }
function genCell(g) { return g.cn + '<em>' + g.en + '</em>'; }

function setNow() {
  var d = new Date();
  $('date').value = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  $('time').value = pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function build() {
  clearErr();
  var _tp = $('trendpanel'); if (_tp) _tp.style.display = 'none';
  if (!window.XKDGSolarTime || !window.XKDGJieQiGMT || !window.XKDGDaLiuRen || !(window.Solar || window.Lunar)) {
    return showErr('<b>Engine not loaded.</b> This page needs lunar.js, solar-time.js, jieqi-gmt.js and daliuren.js (in that order) in the same folder.');
  }
  var dv = $('date').value, tv = $('time').value;
  if (!dv || !tv) return showErr('<b>Enter a date and time.</b>');
  var dp = dv.split('-').map(Number), tp = tv.split(':').map(Number);
  var y = dp[0], mo = dp[1], d = dp[2], h = tp[0], mi = tp[1];
  var lon = parseFloat($('longitude').value);
  var utcH = parseFloat($('utc-offset').value) || 0, dst = $('dst').checked;
  if (!isFinite(lon)) return showErr('<b>Enter a longitude</b> (degrees East, e.g. 16.3738 for Vienna).');
  var tzOffsetMin = -(utcH * 60 + (dst ? 60 : 0));

  var pillars, chart;
  try {
    var utcMs = window.XKDGSolarTime.utcFromCivil(y, mo, d, h, mi, 0, tzOffsetMin);
    pillars = window.XKDGSolarTime.pillarsFromUtc(utcMs, lon);
    chart = window.XKDGDaLiuRen.buildChartFromInstant(utcMs, lon);
  } catch (e) {
    return showErr('<b>Compute error:</b> ' + e.message);
  }
  if (!pillars || !chart || chart.error) {
    return showErr('<b>Could not build the chart:</b> ' + ((chart && chart.error) || 'missing lunar-javascript Solar'));
  }
  render(pillars, chart);
}

function render(pillars, c) {
  // four pillars header
  var cols = [['Hour 時', pillars.hour, false], ['Day 日', pillars.day, true],
              ['Month 月', pillars.month, false], ['Year 年', pillars.year, false]];
  $('pillars').innerHTML = cols.map(function (col) {
    return '<div class="pillar ' + (col[2] ? 'dayMaster' : '') + '"><div class="plab">' +
      col[0] + '</div><div class="gz">' + col[1] + '</div></div>';
  }).join('');

  // three transmissions (stacked vertically)
  var stages = [['初傳', 'Initial', 'chu'], ['中傳', 'Middle', 'zhong'], ['末傳', 'Final', 'mo']];
  $('three').innerHTML = stages.map(function (s) {
    var m = c.transmission.threeDetailed[s[2]], bird = m.general.cn === '朱雀';
    var col = bird ? 'color:var(--cinnabar)' : (m.isVoid ? 'color:var(--void)' : '');
    return '<div class="msg ' + (m.isVoid ? 'void' : '') + '">' +
      '<div class="stage"><span class="scn">' + s[0] + '</span><span class="sen">' + s[1] + ' Message</span></div>' +
      '<div class="glyph" style="' + col + '">' + m.branch + '</div>' +
      '<div class="meta"><div class="gen">' + genCell(m.general) + '</div>' +
      '<div class="rel">' + m.relation.cn + ' ' + m.relation.en + (m.isVoid ? ' · 空' : '') + '</div></div></div>';
  }).join('');

  // method banner
  var t = c.transmission, en = METHOD_EN[t.method] || '';
  $('methodWrap').innerHTML = '<span class="method ' + (t.needsValidation ? 'flag' : '') + '">' +
    '<span class="cn">' + t.method + '</span>' + en +
    (t.needsValidation ? '<span class="warn">· rule-coded, confirm vs reference</span>' : '') + '</span>';

  // four lessons, 1st on the right
  var order = [3, 2, 1, 0], labels = { 0: '1st', 1: '2nd', 2: '3rd', 3: '4th' };
  $('lessons').innerHTML = order.map(function (i) {
    var L = c.fourLessons[i];
    var mark = L.zei ? '<b style="color:var(--cinnabar)">賊</b> Zei'
             : (L.ke ? '<b style="color:var(--azure)">克</b> Ke' : '');
    var bird = L.top.general.cn === '朱雀';
    var col = (bird ? 'color:var(--cinnabar)' : '') + (L.top.isVoid ? ';color:var(--void)' : '');
    return '<div class="lesson"><div class="lgen">' + L.top.general.cn + '<em>' + L.top.general.en + '</em></div>' +
      '<div class="ltop" style="' + col + '">' + L.top.branch + '</div>' +
      '<div class="lbot">' + L.bottom + '</div>' +
      '<div class="lnum">' + labels[i] + ' ' + mark + '</div></div>';
  }).join('');

  // 12-palace square: 巳午未申 / 辰··酉 / 卯··戌 / 寅丑子亥
  var layout = [['巳', '午', '未', '申'], ['辰', null, null, '酉'], ['卯', null, null, '戌'], ['寅', '丑', '子', '亥']];
  var pmap = {}; c.generals.palaces.forEach(function (p) { pmap[p.earth] = p; });
  var cells = '';
  for (var r = 0; r < 4; r++) for (var col2 = 0; col2 < 4; col2++) {
    var e = layout[r][col2];
    if (e === null) { if (r === 1 && col2 === 1) cells += centerCell(c); continue; }
    var p = pmap[e];
    var cls = [p.general.cn === '貴人' ? 'nobleman' : '', p.general.cn === '朱雀' ? 'bird' : '', p.isVoid ? 'void' : ''].join(' ');
    cells += '<div class="cell ' + cls + '" style="grid-row:' + (r + 1) + ';grid-column:' + (col2 + 1) + '">' +
      '<span class="earth">' + e + '</span><div class="gen">' + genCell(p.general) + '</div>' +
      '<div class="rel">' + p.relation.cn + ' ' + p.relation.en + '</div>' +
      '<div class="heaven">' + p.heaven + '</div></div>';
  }
  $('grid').innerHTML = cells;

  var tst = c.source ? c.source.tst : null;
  $('note').textContent =
    (tst ? 'TST ' + tst.y + '-' + pad(tst.mo) + '-' + pad(tst.d) + ' ' + pad(tst.h) + ':' + pad(tst.mi) + ' · ' : '') +
    '占時 hour ' + c.hourBranch + ' · ' + c.generals.dayNight + ' → 貴人 Nobleman ' + c.generals.nobleman +
    ', arrives at earth ' + c.generals.earthPalace + ', generals run ' + c.generals.direction +
    '. 驛馬 Post-Horse ' + c.postHorse + '.';

  ['pillars', 'three', 'methodWrap', 'lessons', 'grid'].forEach(function (id) {
    var n = $(id); n.classList.remove('fade'); void n.offsetWidth; n.classList.add('fade');
  });
}

function centerCell(c) {
  var v = c.hourVoid ? c.hourVoid.join(' ') : '—';
  var season = (c.source && c.source.zhongQi) || '';
  return '<div class="center" style="grid-row:2/4;grid-column:2/4">' +
    '<div><span class="k">Season 中氣</span><div class="v">' + season + '</div></div><hr>' +
    '<div><span class="k">Month General 月將</span><div class="v mg">' + c.monthGeneral.branch +
      '<em>' + c.monthGeneral.name + '</em></div></div><hr>' +
    '<div><span class="k">Hour Void 旬空</span><div class="v void">' + v + '</div></div></div>';
}

/* ---------- Forex mode: daily 00:00 GMT seeds from the Worker ---------- */
var WORKER_URL = 'https://trading-forex-seed.decumano16.workers.dev/';
var FOREX_LON = 0;          // 0° Greenwich for the day pillar & 月將 at 00:00 GMT
var forexData = null;

async function loadForex() {
  clearErr();
  var bar = $('forexbar'); bar.style.display = 'block';
  bar.innerHTML = '<span class="fxdate">Loading forex feed…</span>';
  try {
    var res = await fetch(WORKER_URL, { cache: 'no-store' });
    forexData = await res.json();
  } catch (e) {
    bar.style.display = 'none';
    return showErr('<b>Could not reach the forex feed.</b> ' + e.message);
  }
  if (!forexData || !forexData.rows) {
    bar.style.display = 'none';
    return showErr('<b>Feed returned no data.</b> ' + ((forexData && forexData.error) || ''));
  }
  renderForexBar();
}

function renderForexBar() {
  var bar = $('forexbar');
  var ok = forexData.rows.filter(function (r) { return r.status === 'ok'; });
  var errs = forexData.rows.filter(function (r) { return r.status !== 'ok'; }).map(function (r) { return r.cross; });
  var head = '<span class="fxdate">Forex · ' + forexData.date + ' 00:00 GMT · 0° Greenwich</span>';
  var pills = ok.map(function (r) {
    return '<button class="pill" data-cross="' + r.cross + '" data-branch="' + r.branch + '">' +
      r.cross + ' <b>' + r.branch + '</b></button>';
  }).join('');
  bar.innerHTML = head + '<div class="pills">' + pills + '</div>' +
    (errs.length ? '<span class="fxerr">no data (market closed?): ' + errs.join(', ') + '</span>' : '');
  bar.querySelectorAll('.pill').forEach(function (b) {
    b.addEventListener('click', function () { selectForexCross(b.dataset.cross, b.dataset.branch, b); });
  });
  var first = bar.querySelector('.pill');
  if (first) selectForexCross(first.dataset.cross, first.dataset.branch, first);
}

function selectForexCross(cross, branch, btn) {
  clearErr();
  if (!window.XKDGDaLiuRen || !window.XKDGSolarTime) return showErr('<b>Engine not loaded.</b>');
  // Anchor the day pillar & 月將 to the GMT calendar date. At 00:00:00 GMT the true solar
  // time at 0° falls a few minutes into the previous day (equation of time), which would
  // roll the day pillar back one day — so we sample at 12:00 GMT, keeping the TST day equal
  // to the trading date while 月將 still resolves to 00:00 GMT of that day.
  var d = forexData.date.split('-').map(Number);
  var utcMs = Date.UTC(d[0], d[1] - 1, d[2], 12, 0, 0);
  var p = window.XKDGSolarTime.pillarsFromUtc(utcMs, FOREX_LON);
  var chart = window.XKDGDaLiuRen.buildChartFromForexSeed(utcMs, FOREX_LON, branch);
  if (!p || !chart || chart.error) {
    return showErr('<b>Could not build chart:</b> ' + ((chart && chart.error) || 'pillars failed'));
  }
  var pillars = { year: p.year, month: p.month, day: p.day, hour: chart.source.hourPillar };
  var bar = $('forexbar');
  bar.querySelectorAll('.pill').forEach(function (x) { x.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  render(pillars, chart);
  $('note').textContent = cross + ' · seed ' + branch + ' → 占時 (Divination-Hour) · ' + $('note').textContent;
  renderTrend(cross, chart, d);
}

// season ruling element (English) from the last 立 term before the date
function seasonElementFor(y, mo, dd) {
  if (!window.Lunar) return null;
  var LI = { '立春': 'Wood', '立夏': 'Fire', '立秋': 'Metal', '立冬': 'Water' };
  var target = Date.UTC(y, mo - 1, dd);
  var last = null, lastElem = null;
  [y - 1, y].forEach(function (yr) {
    var tbl = window.Lunar.fromYmd(yr, 1, 1).getJieQiTable();
    Object.keys(tbl).forEach(function (name) {
      if (!LI[name]) return;
      var s = tbl[name];
      var ms = Date.UTC(s.getYear(), s.getMonth() - 1, s.getDay());
      if (ms <= target && (last === null || ms > last)) { last = ms; lastElem = LI[name]; }
    });
  });
  return lastElem;
}

function renderTrend(cross, chart, dArr) {
  var p = $('trendpanel');
  if (!window.XKDGTrend || !chart.transmission || !chart.transmission.three) { p.style.display = 'none'; return; }
  var t3 = chart.transmission.three;
  var season = seasonElementFor(dArr[0], dArr[1], dArr[2]);
  var v = window.XKDGTrend.evaluateTrend(t3.chu, t3.zhong, t3.mo,
    { dayStem: chart.dayStem, voidBranches: chart.hourVoid, seasonElement: season });
  var badge = v.confirmed
    ? '<span class="tv ok">TREND CONFIRMED · follows EMA</span>'
    : '<span class="tv no">NOT CONFIRMED · against EMA</span>';
  var head = '<div class="trendhead"><span>' + cross + ' — Level 1 reading</span>' + badge + '</div>';
  var msgs = '<div class="trendmsgs">初傳 M1 <b>' + v.M1 + '</b> (' + v.elements.M1 + ') → 中傳 M2 <b>' + v.M2 +
    '</b> (' + v.elements.M2 + ') → 末傳 M3 <b>' + v.M3 + '</b> (' + v.elements.M3 + ')' +
    (season ? ' · season ' + season : '') + (v.m1Void ? ' · M1 空(void)' : '') + '</div>';
  var trace = '<ul class="trendtrace">' + v.trace.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>';
  var note = '<div class="trendnote">Trend direction (up/down) comes from EMA(8+1) — to be wired next. For now: “follows” vs “against”.</div>';
  p.innerHTML = head + msgs + trace + note;
  p.style.display = 'block';
}

/* ---------- wiring ---------- */
window.addEventListener('DOMContentLoaded', function () {
  setNow();                                   // default to the current moment
  $('build').addEventListener('click', build);
  $('forex').addEventListener('click', loadForex);
  $('now').addEventListener('click', function () { setNow(); build(); });
  $('gmt').addEventListener('click', function () { // chart for 00:00 GMT of the chosen date
    if (!$('date').value) setNow();
    $('time').value = '00:00'; $('utc-offset').value = '0'; $('dst').checked = false; build();
  });
  build();
});

/* ---------- service worker (relative scope /trading/) ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').then(function () {
      var s = $('status'); if (s) s.textContent = '✓ Installed & offline-ready.';
    }).catch(function (e) {
      var s = $('status'); if (s) s.textContent = 'Offline cache unavailable: ' + e.message;
    });
  });
}
