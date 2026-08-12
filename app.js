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
  var _fb = $('forexbar'); if (_fb) _fb.style.display = 'none';
  var _di = $('date'); if (_di) { _di.readOnly = false; _di.title = ''; }
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
      '<div class="lbot">' + (L.stem || L.bottom) + '</div>' +
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
var METHOD = 'dlr';         // 'dlr' | 'pb' — chosen with the toggle, re-renders the trend panel
var lastTrendArgs = null;   // remember the last renderTrend inputs so the toggle can re-render
var pbManual = null;        // {sup, inf, linea} when the user overrides the trigrams by hand, else null

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
  // keep the DATE field honest: in forex mode the date comes from the feed, not from the input
  var fd = forexData.date.split('-');
  var di = $('date');
  if (di) { di.value = fd[2] + '/' + fd[1] + '/' + fd[0]; di.readOnly = true; di.title = 'In Forex mode the date comes from the feed (00:00 GMT of the trading day). Press "Build chart" to go back to manual mode.'; }
  var head = '<span class="fxdate">Forex · ' + forexData.date + ' 00:00 GMT · 0° Greenwich · date driven by the feed</span>';
  var pills = ok.map(function (r) {
    var known = (r.emaConsolidated === true || r.emaConsolidated === false);
    var choppy = (r.emaConsolidated === false);
    var fragile = (r.seedFragile === true);                       // seed boundary guard
    var arrow = r.direction === 'up' ? '↑' : r.direction === 'down' ? '↓' : '';
    var tip = !known
      ? 'Consolidation filter unavailable — the feed has no EMA history for this cross.'
      : (choppy
        ? 'EMA not consolidated — ' + r.emaChanges + ' reversals in the last 10 days. Filtered out, but still clickable.'
        : 'EMA consolidated — ' + r.emaChanges + ' reversals in the last 10 days.');
    if (fragile) {
      tip = 'NO TRADE — the 00:00 price is only ' + r.seedEdgePips + ' pip from the seed-bucket edge, ' +
        'so another data source could give a different 地支 (Earthly Branch) and a different chart. ' +
        'The day is not well defined. || ' + tip;
    }
    var cls = (!known ? ' unknown' : (choppy ? ' choppy' : '')) + (fragile ? ' fragile' : '');
    return '<button class="pill' + cls + '" data-cross="' + r.cross +
      '" data-branch="' + r.branch + '" data-choppy="' + (choppy ? '1' : '0') +
      '" data-fragile="' + (fragile ? '1' : '0') + '" title="' + tip + '">' +
      r.cross + ' <b>' + r.branch + '</b>' +
      (arrow ? ' <i class="dir ' + r.direction + '">' + arrow + '</i>' : '') +
      (fragile ? ' <i class="warn">⛔</i>' : '') +
      (choppy ? ' <i class="warn">⚠</i>' : '') + (!known ? ' <i class="warn">?</i>' : '') + '</button>';
  }).join('');
  var nChoppy = ok.filter(function (r) { return r.emaConsolidated === false; }).length;
  var nUnknown = ok.filter(function (r) { return r.emaConsolidated !== true && r.emaConsolidated !== false; }).length;
  var nFragile = ok.filter(function (r) { return r.seedFragile === true; }).length;
  // Fail loudly, never silently: an older Worker does not send the field at all, and a missing
  // field must not be read as "the seed is safe".
  var guardMissing = ok.filter(function (r) { return !('seedEdgePips' in r); }).length;
  var legend = '';
  if (guardMissing) {
    legend += '<span class="fxstale">⛔ SEED BOUNDARY GUARD NOT ACTIVE — this feed was produced by an older Worker ' +
      '(generated ' + (forexData.generatedAt || '?') + ') that does not send seedEdgePips. ' +
      'No cross is being checked against the seed edge: the signals below are NOT the ones the backtest measured. ' +
      'Redeploy the Worker and call /run.</span>';
  }
  if (nUnknown) {
    legend += '<span class="fxstale">⚠ Consolidation filter NOT ACTIVE — this feed was produced by an older Worker ' +
      '(generated ' + (forexData.generatedAt || '?') + '). Redeploy the Worker and call /run. ' +
      'Until then no cross is being filtered.</span>';
  }
  if (nFragile) {
    legend += '<span class="fxlegend">⛔ = 00:00 price within 3 pip of the seed-bucket edge — the 地支 is not ' +
      'reproducible across data sources, so the day is NO TRADE.</span>';
  }
  if (!nUnknown && nChoppy) {
    legend += '<span class="fxlegend">⚠ = EMA not consolidated (3+ reversals in 10 days) — not recommended, but you can still open them.</span>';
  }
  bar.innerHTML = head + '<div class="pills">' + pills + '</div>' + legend +
    (errs.length ? '<span class="fxerr">no data (market closed?): ' + errs.join(', ') + '</span>' : '');
  bar.querySelectorAll('.pill').forEach(function (b) {
    b.addEventListener('click', function () { selectForexCross(b.dataset.cross, b.dataset.branch, b); });
  });
  // prefer the first genuinely tradable cross: consolidated EMA and a reproducible seed
  var pillsEls = bar.querySelectorAll('.pill');
  var first = null;
  for (var i = 0; i < pillsEls.length; i++) {
    if (pillsEls[i].dataset.choppy === '0' && pillsEls[i].dataset.fragile === '0') { first = pillsEls[i]; break; }
  }
  if (!first) for (var i2 = 0; i2 < pillsEls.length; i2++) { if (pillsEls[i2].dataset.choppy === '0') { first = pillsEls[i2]; break; } }
  if (!first) first = pillsEls[0];
  if (first) selectForexCross(first.dataset.cross, first.dataset.branch, first);
}

function selectForexCross(cross, branch, btn) {
  clearErr();
  pbManual = null;   // choosing another cross drops any manual trigram override
  if (!window.XKDGDaLiuRen || !window.XKDGSolarTime) return showErr('<b>Engine not loaded.</b>');
  // La carta si costruisce nell'istante in cui a Greenwich entra il nuovo giorno in TEMPO
  // SOLARE VERO: le 00:00 GMT corrette per l'equazione del tempo, che nell'anno oscilla di
  // circa un quarto d'ora. Da quell'istante escono tutti i pilastri.
  // (Prima si campionava a mezzogiorno GMT per aggirare lo scatto del pilastro del giorno
  //  a 00:00:00 esatte; quella scorciatoia leggeva il 節 dodici ore troppo tardi e sbagliava
  //  il ramo del mese nei giorni in cui il passaggio cade fra mezzanotte e mezzogiorno —
  //  per esempio il 07/12/2023, Daxue alle 09:32 GMT. Corretto l'08/08/2026.)
  var d = forexData.date.split('-').map(Number);
  var utcMs = (function () {
    var approx = Date.UTC(d[0], d[1] - 1, d[2], 0, 0, 0), ms = approx;
    for (var i = 0; i < 3; i++)
      ms = approx - window.XKDGSolarTime.equationOfTimeMinutes(new Date(ms)) * 60000;
    return ms;
  })();
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
  var row = (forexData.rows || []).filter(function (r) { return r.cross === cross; })[0] || null;
  renderTrend(cross, chart, d, row);
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

function renderTrendPB(cross, chart, dArr, row, p) {
  var lyp = $('lypanel');
  if (!window.XKDGPlumBlossom || !row || row.seed == null || !chart.dayBranch) {
    p.style.display = 'none'; if (lyp) lyp.style.display = 'none'; return; }
  var pb = pbManual
    ? window.XKDGPlumBlossom.readManual(pbManual.sup, pbManual.inf, pbManual.linea)
    : window.XKDGPlumBlossom.read(row.seed, chart.dayBranch, chart.monthBranch,
        (chart.source && chart.source.yearPillar) ? chart.source.yearPillar.charAt(1) : null,
        chart.dayStem || null,
        (row && row.emaRun != null) ? row.emaRun : null);
  if (pb.error) { p.style.display = 'none'; if (lyp) lyp.style.display = 'none'; return; }

  // same downstream logic as the DLR panel: EMA direction + guards decide the final signal
  var dir = row && row.direction ? row.direction : null;         // 'up' | 'down' | 'flat' | null
  var choppy = row && row.emaConsolidated === false;
  var fragile = !!(row && row.seedFragile === true);
  var confirmed = pb.segue;                                      // verdetto PB: il trend segue?
  var noTradePB = (pb.segue === null);                           // pareggio non sciolto → NO TRADE
  var signal = null;
  if (fragile) signal = 'NO TRADE';
  else if (choppy) signal = 'NO TRADE';
  else if (noTradePB) signal = 'NO TRADE';
  else if (dir === 'up') signal = confirmed ? 'LONG' : 'SHORT';
  else if (dir === 'down') signal = confirmed ? 'SHORT' : 'LONG';

  var verdictBadge = fragile
    ? '<span class="tv no">SEED ON THE EDGE · no trade</span>'
    : (choppy
      ? '<span class="tv no">EMA not consolidated · no trade</span>'
      : (noTradePB
        ? (pb.noTradeClash
          ? '<span class="tv no">CLASH GIORNO↔MESE · no trade</span>'
          : '<span class="tv no">PAREGGIO · no trade</span>')
        : (confirmed
          ? '<span class="tv ok">SEGUE il trend</span>'
          : '<span class="tv no">NON SEGUE il trend</span>')));
  var signalBadge = signal
    ? '<span class="sig ' + (signal === 'NO TRADE' ? 'notrade' : signal.toLowerCase()) + '">' + signal + '</span>'
    : '<span class="sig na">signal n/a — EMA trend missing</span>';
  var head = '<div class="trendhead"><span>' + cross + ' — 梅花 Plum Blossom</span>' + signalBadge + '</div>';

  var seedLine = '';
  if (row && row.price != null) {
    seedLine = '<div class="trendmsgs seedline">00:00 GMT open <b class="px">' + row.price + '</b>' +
      ' → seme <b class="px">' + row.seed + '</b> · giorno <b>' + chart.dayStem + chart.dayBranch + '</b>' +
      (pbManual ? ' · <b class="down">inserimento manuale</b>' : '') +
      (fragile ? '<br><b class="down">seme entro 3 pip dal bordo → NO TRADE</b>' : '') + '</div>';
  }

  var arrow = dir === 'up' ? '↑ up (blue)' : dir === 'down' ? '↓ down (red)' : (dir ? dir : 'n/a');
  var emaLine = '<div class="trendmsgs">EMA(12) daily trend: <b class="' + (dir || '') + '">' + arrow + '</b>' +
    (row && row.ema != null ? ' · ema ' + row.ema + ' (prev ' + row.emaPrev + ')' : '') + '</div>';

  // the three hexagrams drawn (Original / Mutual / Transform), like the reference app
  function drawHex(hx, title, subNums, movingLine) {
    var lines = window.XKDGPlumBlossom.hexLinesLowFirst(hx);  // index 0 = bottom line (1)
    var rows = '';
    for (var i = 5; i >= 0; i--) {                            // draw top (6) down to bottom (1)
      var yang = lines[i] === '1';
      var moving = movingLine && (i + 1) === movingLine;
      var cls = 'pbline' + (yang ? ' yang' : ' yin') + (moving ? ' moving' : '');
      rows += yang
        ? '<div class="' + cls + '"><span class="seg full"></span></div>'
        : '<div class="' + cls + '"><span class="seg half"></span><span class="seg gap"></span><span class="seg half"></span></div>';
    }
    return '<div class="pbcol"><div class="pbtitle">' + title + '</div>' +
      '<div class="pbnum">' + hx.sup + '</div>' + rows + '<div class="pbnum">' + hx.inf + '</div></div>';
  }
  var hexBlock = '<div class="pbhex">' +
    drawHex(pb.original,  'Original',  null, pb.movingLine) +
    drawHex(pb.mutual,    'Mutual',    null, 0) +
    drawHex(pb.transform, 'Transform', null, 0) + '</div>';

  var roles = '<div class="trendmsgs">Trend (體) <b>' + pb.trendLabel + '</b>' +
    ' · Yong (用) <b>' + pb.yongOrigLabel + '</b>' +
    ' → si muove in <b>' + pb.yongTrasfLabel + '</b>' +
    ' — ' + verdictBadge + '</div>';

  // manual override controls: superiore (1-8), inferiore (1-8), linea mutante (1-6)
  function opts(n, sel){ var s=''; for(var i=1;i<=n;i++) s+='<option value="'+i+'"'+(i===sel?' selected':'')+'>'+i+'</option>'; return s; }
  var manualRow = '<div class="pbmanual">' +
    '<span>Inserimento manuale:</span>' +
    ' superiore <select id="pb-sup">' + opts(8, pb.superiore) + '</select>' +
    ' inferiore <select id="pb-inf">' + opts(8, pb.inferiore) + '</select>' +
    ' linea mutante <select id="pb-line">' + opts(6, pb.linea) + '</select>' +
    ' <button class="ghost" id="pb-reset" style="padding:4px 12px">Reset al seme</button>' +
    '</div>';

  p.innerHTML = head + seedLine + emaLine + hexBlock + roles + manualRow;
  p.style.display = 'block';

  // Liu Yao: lettura completa sotto il Plum Blossom (correttivo, stessa carta)
  renderLiuYao(cross, chart, row, lyp);

  // wire the manual controls (re-render on change)
  function onManualChange(){
    pbManual = {
      sup:  parseInt($('pb-sup').value, 10),
      inf:  parseInt($('pb-inf').value, 10),
      linea:parseInt($('pb-line').value, 10)
    };
    if (lastTrendArgs) renderTrend(lastTrendArgs.cross, lastTrendArgs.chart, lastTrendArgs.dArr, lastTrendArgs.row);
  }
  $('pb-sup').addEventListener('change', onManualChange);
  $('pb-inf').addEventListener('change', onManualChange);
  $('pb-line').addEventListener('change', onManualChange);
  $('pb-reset').addEventListener('click', function(){
    pbManual = null;
    if (lastTrendArgs) renderTrend(lastTrendArgs.cross, lastTrendArgs.chart, lastTrendArgs.dArr, lastTrendArgs.row);
  });
}

// ---- Liu Yao (六爻): lettura completa, sotto il Plum Blossom, sulla stessa carta ----
function renderLiuYao(cross, chart, row, lyp) {
  if (!lyp) lyp = $('lypanel');
  if (!lyp) return;
  if (!window.XKDGLiuYao || !row || row.seed == null || !chart.dayBranch) { lyp.style.display = 'none'; return; }

  var yearBranch = (chart.source && chart.source.yearPillar) ? chart.source.yearPillar.charAt(1) : null;
  var ly = pbManual
    ? window.XKDGLiuYao.readManual(pbManual.sup, pbManual.inf, pbManual.linea,
        chart.dayBranch, chart.monthBranch, yearBranch, chart.dayStem || null)
    : window.XKDGLiuYao.read(row.seed, chart.dayBranch, chart.monthBranch, yearBranch, chart.dayStem || null);
  if (ly.error) { lyp.style.display = 'none'; return; }

  var BEAST_COLOR = { '青龍':'#3fb950', '朱雀':'#f85149', '勾陳':'#d4a72c',
                      '螣蛇':'#a371f7', '白虎':'#8b949e', '玄武':'#58a6ff' };
  function lineGlyph(yang) {
    return yang
      ? '<span style="display:inline-block;width:52px;border-top:9px solid currentColor;vertical-align:middle"></span>'
      : '<span style="display:inline-block;width:22px;border-top:9px solid currentColor;vertical-align:middle"></span>' +
        '<span style="display:inline-block;width:8px"></span>' +
        '<span style="display:inline-block;width:22px;border-top:9px solid currentColor;vertical-align:middle"></span>';
  }

  var head = '<div class="trendhead"><span>' + cross + ' — 六爻 Liu Yao</span>' +
    '<span class="tv">correttivo del Plum Blossom</span></div>';

  var palLine = '<div class="trendmsgs">Palazzo 京房 (Jing Fang): <b>' + ly.palName + ' ' + ly.palPinyin +
    '</b> (' + ly.palElIt + ') · Soggetto 世 L' + ly.shi + ' · Ospite 應 L' + ly.ying +
    ' · vuoti 旬空: <b>' + (ly.vuoti.length ? ly.vuoti.join(' ') : '—') + '</b>' +
    ' · Tai Sui 太歲: ' + (ly.taiSuiPos ? 'L' + ly.taiSuiPos : 'nessuna linea') + '</div>';

  var m = ly.mutante;
  var mutLine = '<div class="trendmsgs">Mutante L' + m.pos + ': <b>' + m.ramoDep + '</b> (' + m.depElIt +
    ') → <b>' + m.ramoArr + '</b> (' + m.arrElIt + ') — ' + m.casoLabel +
    (m.movimentoNullo ? ' · <b class="down">movimento NULLO</b>' : '') +
    (m.atterraggio ? ' · atterra su L' + m.atterraggio.pos + ' (' + m.atterraggio.ramo + ') → ' + m.atterraggio.dir : '') +
    '</div>';

  // griglia delle sei linee, L6 (alto) → L1 (basso)
  var rows = '';
  for (var i = 6; i >= 1; i--) {
    var l = ly.linee[i-1];
    var beast = l.bestia
      ? '<span style="color:' + (BEAST_COLOR[l.bestia.cn] || 'currentColor') + '">' + l.bestia.cn + '</span>' +
        '<br><small style="opacity:.7">' + l.bestia.it + '</small>'
      : '—';
    var fu = l.fushen
      ? '<small style="opacity:.85">伏 ' + l.fushen.parCn + ' ' + l.fushen.b + '</small>'
      : '';
    var orig = '<b>' + l.parCn + '</b> ' + l.ramo + ' <small style="opacity:.75">' + l.elIt + '</small>';
    var marks = '';
    if (l.isShi)  marks += '<b style="color:var(--gold,#e3b341)"> 世</b>';
    if (l.isYing) marks += '<b style="color:var(--azure,#58a6ff)"> 應</b>';
    if (l.isMobile) marks += '<b class="down"> ✸</b>';
    if (l.vuoto)  marks += ' <small style="color:var(--void,#8b949e)">空</small>';
    if (l.isTaiSui) marks += ' <small style="opacity:.8">太</small>';
    marks += ' <small style="opacity:.6">[' + l.stato + ']</small>';
    var trasf = (l.isMobile && l.mut)
      ? '→ <b>' + window.XKDGLiuYao.PAR[l.mut.parArr].cn + '</b> ' + l.mut.ramoArr +
        ' <small style="opacity:.75">' + window.XKDGLiuYao.EL_IT[l.mut.elArr] + '</small>'
      : '';
    var rowStyle = l.isMobile ? ' style="background:rgba(227,179,65,.08)"' : '';
    rows += '<tr' + rowStyle + '>' +
      '<td style="padding:5px 8px;text-align:center;white-space:nowrap">' + beast + '</td>' +
      '<td style="padding:5px 8px;white-space:nowrap">' + fu + '</td>' +
      '<td style="padding:5px 8px;white-space:nowrap">' + orig + '</td>' +
      '<td style="padding:5px 10px;text-align:center">' + lineGlyph(l.yang) + '</td>' +
      '<td style="padding:5px 8px;white-space:nowrap">' + marks + '</td>' +
      '<td style="padding:5px 8px;white-space:nowrap">' + trasf + '</td>' +
      '</tr>';
  }
  var table = '<table class="lytable" style="border-collapse:collapse;margin-top:8px;font-size:14px">' +
    '<thead><tr style="opacity:.6;font-size:12px;text-align:left">' +
    '<th style="padding:2px 8px">六獸 Bestie</th>' +
    '<th style="padding:2px 8px">伏神 Nascosti</th>' +
    '<th style="padding:2px 8px">本卦 Originale</th>' +
    '<th style="padding:2px 10px;text-align:center">爻 Linea</th>' +
    '<th style="padding:2px 8px">世/應 · stato</th>' +
    '<th style="padding:2px 8px">變卦 Mutato</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table>';

  lyp.innerHTML = head + palLine + mutLine + table;
  lyp.style.display = 'block';
}

function renderTrend(cross, chart, dArr, row) {
  lastTrendArgs = { cross: cross, chart: chart, dArr: dArr, row: row };
  var p = $('trendpanel');

  // ---- Plum Blossom branch: same seed, same EMA, same filters; only the verdict differs ----
  if (METHOD === 'pb') { renderTrendPB(cross, chart, dArr, row, p); return; }

  // Da Liu Ren: il pannello Liu Yao (correttivo del PB) resta nascosto
  var lyp = $('lypanel'); if (lyp) lyp.style.display = 'none';

  if (!window.XKDGTrend || !chart.transmission || !chart.transmission.three) { p.style.display = 'none'; return; }
  var t3 = chart.transmission.three;
  var season = seasonElementFor(dArr[0], dArr[1], dArr[2]);
  var v = window.XKDGTrend.evaluateTrend(t3.chu, t3.zhong, t3.mo,
    { dayStem: chart.dayStem, voidBranches: chart.hourVoid, seasonElement: season,
      monthGeneral: chart.monthGeneral && chart.monthGeneral.branch,
      monthBranch: chart.monthBranch, dayBranch: chart.dayBranch, hourBranch: chart.hourBranch, fourLessons: chart.fourLessons,
      isFanYin: chart.transmission.special === '返吟' });

  var dir = row && row.direction ? row.direction : null;         // 'up' | 'down' | 'flat' | null
  var filterKnown = row && (row.emaConsolidated === true || row.emaConsolidated === false);
  var choppy = row && row.emaConsolidated === false;             // consolidation filter
  // Seed boundary guard. This comes FIRST because it does not question the verdict, it questions
  // the chart: a price within 3 pip of the bucket edge could belong to the neighbouring 地支 on a
  // different feed, so every reading downstream — 返吟 included — is built on a branch that is not
  // reproducible. Backtested with GUARD=3, which discards 6.4% of the days.
  var fragile = !!(row && row.seedFragile === true);
  var guardKnown = !!(row && ('seedEdgePips' in row));
  var signal = null;
  if (fragile) signal = 'NO TRADE';
  else if (v.noTrade) signal = 'NO TRADE';
  else if (choppy) signal = 'NO TRADE';
  else if (dir === 'up') signal = v.confirmed ? 'LONG' : 'SHORT';
  else if (dir === 'down') signal = v.confirmed ? 'SHORT' : 'LONG';

  var verdictBadge = fragile
    ? '<span class="tv no">SEED ON THE EDGE · no trade</span>'
    : (v.noTrade
      ? '<span class="tv no">返吟 FAN YIN · no trade</span>'
      : (choppy
        ? '<span class="tv no">EMA not consolidated · no trade</span>'
        : (v.confirmed
          ? '<span class="tv ok">CONFIRMED · follows EMA</span>'
          : '<span class="tv no">NOT CONFIRMED · against EMA</span>')));
  var signalBadge = signal
    ? '<span class="sig ' + (signal === 'NO TRADE' ? 'notrade' : signal.toLowerCase()) + '">' + signal + '</span>'
    : '<span class="sig na">signal n/a — EMA trend missing</span>';
  var head = '<div class="trendhead"><span>' + cross + ' — Level 1</span>' + signalBadge + '</div>';

  // seed derivation, shown so it can be checked by hand
  var seedLine = '';
  if (row && row.price != null) {
    var rem = ((row.seed % 12) + 12) % 12; rem = (rem === 0 ? 12 : rem);
    seedLine = '<div class="trendmsgs seedline">00:00 GMT open <b class="px">' + row.price + '</b>' +
      ' → first ' + String(row.digits).length + ' significant digits <b class="px">' + row.digits + '</b>' +
      ' → ' + row.digits + ' mod 12 = remainder <b class="px">' + rem + '</b>' +
      ' → 地支 <b>' + row.branch + '</b> (' + row.branchPinyin + ')' +
      ' <span class="hint">counting 子=1</span>';
    // Seed bucket is 100 pip wide; show how far the price sits from its nearest edge.
    if (guardKnown && row.seedEdgePips != null) {
      seedLine += '<br>distance from the seed-bucket edge <b class="px">' + row.seedEdgePips + ' pip</b>' +
        (fragile
          ? ' — <b class="down">under the 3 pip guard: another feed could give a different 地支 → NO TRADE</b>'
          : ' <span class="hint">guard 3 pip · bucket 100 pip wide</span>');
    } else {
      seedLine += '<br><b class="down">seed boundary guard unavailable (old feed — redeploy the Worker and call /run): ' +
        'this reading is NOT checked against the seed edge</b>';
    }
    seedLine += '</div>';
  }

  var arrow = dir === 'up' ? '↑ up (blue)' : dir === 'down' ? '↓ down (red)' : (dir ? dir : 'n/a');
  var emaLine = '<div class="trendmsgs">EMA(12) daily trend: <b class="' + (dir || '') + '">' + arrow + '</b>' +
    (row && row.ema != null ? ' · ema ' + row.ema + ' (prev ' + row.emaPrev + ')' : '') +
    (row && row.emaDirs ? ' · last 10 days ' + row.emaDirs.replace(/u/g, '↑').replace(/d/g, '↓').replace(/f/g, '–') +
      ' · ' + row.emaChanges + ' reversal' + (row.emaChanges === 1 ? '' : 's') +
      (row.emaConsolidated ? ' → consolidated' : ' → NOT consolidated (filtered out)')
      : ' · <b class="down">consolidation filter unavailable (old feed — redeploy the Worker and call /run)</b>') +
    (row && (row.emaError || row.emaNote) ? ' · ' + (row.emaError || row.emaNote) : '') + '</div>';

  var msgs = '<div class="trendmsgs">初傳 M1 <b>' + v.M1 + '</b> (' + v.elements.M1 + ') → 中傳 M2 <b>' + v.M2 +
    '</b> (' + v.elements.M2 + ') → 末傳 M3 <b>' + v.M3 + '</b> (' + v.elements.M3 + ')' +
    (season ? ' · season ' + season : '') + (v.m1Void ? ' · M1 空(void)' : '') +
    (v.combo ? ' · 三會 ' + v.combo.cn + ' ' + v.combo.en + ' (' + (v.combo.order === 'clockwise' ? 'clockwise' : 'anticlockwise → reversed') + ')' : '') +
    (v.substituted ? ' · 月將 M2 takes over the trend' : '') + ' — ' + verdictBadge + '</div>';
  var trace = '<ul class="trendtrace">' + v.trace.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>';
  p.innerHTML = head + seedLine + emaLine + msgs + trace;
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
  // method toggle: DLR ↔ Plum Blossom. Re-renders the trend panel from the last chart.
  function setMethod(m) {
    METHOD = m;
    $('method-dlr').classList.toggle('active', m === 'dlr');
    $('method-pb').classList.toggle('active', m === 'pb');
    if (lastTrendArgs) renderTrend(lastTrendArgs.cross, lastTrendArgs.chart, lastTrendArgs.dArr, lastTrendArgs.row);
  }
  $('method-dlr').addEventListener('click', function () { setMethod('dlr'); });
  $('method-pb').addEventListener('click', function () { setMethod('pb'); });
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
