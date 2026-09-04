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
  var _ly = $('lypanel'); if (_ly) _ly.style.display = 'none';
  var _db = $('dlrblock'); if (_db) _db.style.display = '';   // manual mode: the DLR chart is all there is
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

  renderDuello(c);

  ['pillars', 'three', 'methodWrap', 'lessons', 'grid'].forEach(function (id) {
    var n = $(id); n.classList.remove('fade'); void n.offsetWidth; n.classList.add('fade');
  });
}

/* ============================================================================
 * DUELLO HOST/GUEST — lettura del DLR dettata da Edu il 01/09/2026 (S33).
 * Host = stelo del giorno nel suo palazzo (癸→丑, 庚→申, 辛→戌): per EURUSD è EUR.
 * Guest = ramo del giorno: per EURUSD è USD.
 * Ogni lato si legge sulla terna SEDE · CAVALIERE · ARRIVO (1ª-2ª lezione per lo
 * host, 3ª-4ª per il guest). Il pannello MOSTRA la lettura, non decide il trade:
 * nessuna di queste regole è nel segnale, sono tutte in osservazione.
 * ========================================================================== */
function renderDuello(c) {
  var box = $('duello'); if (!box) return;
  var WXB = { '子':'Water','丑':'Earth','寅':'Wood','卯':'Wood','辰':'Earth','巳':'Fire',
              '午':'Fire','未':'Earth','申':'Metal','酉':'Metal','戌':'Earth','亥':'Water' };
  var GENN = { Wood:'Fire', Fire:'Earth', Earth:'Metal', Metal:'Water', Water:'Wood' };
  var CTRLL = { Wood:'Earth', Earth:'Water', Water:'Fire', Fire:'Metal', Metal:'Wood' };
  var STEMEL = { '甲':'Wood','乙':'Wood','丙':'Fire','丁':'Fire','戊':'Earth','己':'Earth',
                 '庚':'Metal','辛':'Metal','壬':'Water','癸':'Water' };
  var TOMBA = { Wood:'未', Fire:'戌', Metal:'丑', Water:'辰' };
  var LU = { '甲':'寅','乙':'卯','丙':'巳','戊':'巳','丁':'午','己':'午','庚':'申','辛':'酉','壬':'亥','癸':'子' };
  var TRI = { '申子辰':'Water', '亥卯未':'Wood', '寅午戌':'Fire', '巳酉丑':'Metal' };
  var DIR = { '寅卯辰':'Wood', '巳午未':'Fire', '申酉戌':'Metal', '亥子丑':'Water' };
  var IT = { Wood:'Legno', Fire:'Fuoco', Earth:'Terra', Metal:'Metallo', Water:'Acqua' };
  var BR = '子丑寅卯辰巳午未申酉戌亥';
  var L = c.fourLessons; if (!L || L.length < 4) { box.innerHTML = ''; return; }
  var vuoti = c.hourVoid || [];
  var vuota = function (b) { return vuoti.indexOf(b) >= 0; };

  function figura(rami) {
    var out = [];
    [[TRI, '三合 trigono'], [DIR, '方合 direzionale']].forEach(function (par) {
      for (var t in par[0]) {
        var dentro = 0, pieni = 0;
        for (var i = 0; i < 3; i++) {
          if (rami.indexOf(t.charAt(i)) >= 0) { dentro++; if (!vuota(t.charAt(i))) pieni++; }
        }
        if (dentro >= 2) out.push({ fig: t, el: par[0][t], grado: (dentro === 3 && pieni === 3) ? 3 : 2, tipo: par[1] });
      }
    });
    out.sort(function (a, b) { return b.grado - a.grado; });
    return out[0] || null;
  }
  function moto(cav, arr) {
    if (WXB[cav] !== WXB[arr]) return null;
    var d = (BR.indexOf(arr) - BR.indexOf(cav) + 12) % 12, p = (WXB[cav] === 'Earth') ? 3 : 1;
    return d === p ? 'avanza' : (d === 12 - p ? 'retrocede' : null);
  }
  function lato(nome, sede, cav, arr) {
    var note = [];
    if (vuota(sede)) note.push('sede vuota');
    if (cav.isVoid) note.push('cavaliere vuoto');
    else {
      if (GENN[WXB[cav.branch]] === WXB[arr.branch] && arr.relation.cn === '妻財') note.push('genera Ricchezza');
      if (cav.branch === LU[c.dayStem]) note.push('祿 Lu del giorno in sella');
    }
    var f = figura([sede, cav.branch, arr.branch]);
    if (f) note.push(f.tipo + ' ' + f.fig + ' ' + IT[f.el] + (f.grado === 3 ? ' COMPLETO' : ' incompleto'));
    var m = moto(cav.branch, arr.branch);
    if (m) {
      var dove = [];
      if (arr.branch === c.monthGeneral.branch) dove.push('sul 月將');
      if (arr.branch === c.postHorse) dove.push('sul 驛馬 Cavallo');
      note.push('il ' + cav.relation.cn + ' ' + m + (dove.length ? ' ' + dove.join(' e ') : ''));
    }
    return { nome: nome, sede: sede, cav: cav, arr: arr, fig: f, note: note };
  }
  var H = lato('HOST · stelo del giorno ' + c.dayStem, L[0].bottom, L[0].top, L[1].top);
  var G = lato('GUEST · ramo del giorno ' + c.dayBranch, L[2].bottom, L[2].top, L[3].top);

  var verdetto = '—', perche = 'nessuna figura decide';
  if (H.fig && G.fig && H.fig.grado === 3 && G.fig.grado === 3) {
    if (CTRLL[H.fig.el] === G.fig.el) { verdetto = 'HOST'; perche = IT[H.fig.el] + ' controlla ' + IT[G.fig.el]; }
    else if (CTRLL[G.fig.el] === H.fig.el) { verdetto = 'GUEST'; perche = IT[G.fig.el] + ' controlla ' + IT[H.fig.el]; }
  } else if (H.fig && H.fig.grado === 3 && (!G.fig || G.fig.grado < 3)) { verdetto = 'HOST'; perche = 'figura completa contro incompleta'; }
  else if (G.fig && G.fig.grado === 3 && (!H.fig || H.fig.grado < 3)) { verdetto = 'GUEST'; perche = 'figura completa contro incompleta'; }

  // ora e giorno: il carattere dello stelo dell'ora e la sua tomba nel ramo del giorno
  var oraRiga = '';
  if (c.hourStem) {
    var eO = STEMEL[c.hourStem], eD = STEMEL[c.dayStem], ch;
    if (eD === eO) ch = 'B Fratelli';
    else if (GENN[eD] === eO) ch = 'C Figli';
    else if (GENN[eO] === eD) ch = 'P Genitori';
    else if (CTRLL[eD] === eO) ch = 'W Ricchezza';
    else ch = 'G Ufficiale';
    oraRiga = 'ora ' + c.hourStem + ' = ' + ch + ' per lo host' +
      (TOMBA[eO] === c.dayBranch ? ' · va in TOMBA 墓 nel ramo del guest' : '');
  }
  var cel = 'padding:6px 8px;vertical-align:top;font-size:13px;line-height:1.45';
  box.innerHTML =
    '<div style="margin-top:14px;border:1px solid rgba(128,128,128,.35);border-radius:8px;overflow:hidden">' +
    '<div style="padding:6px 8px;font-weight:600;background:rgba(128,128,128,.12);font-size:13px">' +
      'Duello host/guest · lettura in osservazione (non entra nel segnale)</div>' +
    '<table style="width:100%;border-collapse:collapse">' +
    [H, G].map(function (S) {
      return '<tr><td style="' + cel + ';width:38%"><b>' + S.nome + '</b><br>' +
        S.sede + ' → ' + S.cav.branch + ' → ' + S.arr.branch + '</td>' +
        '<td style="' + cel + '">' + (S.note.length ? S.note.join('<br>') : '—') + '</td></tr>';
    }).join('') +
    '<tr><td style="' + cel + '"><b>Verdetto delle figure</b></td><td style="' + cel + '">' +
      (verdetto === '—' ? '—' : 'vince ' + verdetto + ' (' + perche + ')') +
      (oraRiga ? '<br>' + oraRiga : '') + '</td></tr>' +
    '</table></div>';
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
var METHOD = 'pb';          // 'dlr' | 'pb' (default PB, 17/08/2026) — chosen with the toggle, re-renders the trend panel
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
  if (di) { di.value = forexData.date; di.readOnly = true; di.title = 'In Forex mode the date comes from the feed (00:00 GMT of the trading day). Press "Build chart" to go back to manual mode.'; }
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

/* ---------------- REPORT GIORNALIERO — tutti e nove i cross insieme ----------------
 * Un solo bottone analizza ogni cross del feed e stampa in fondo alla pagina cosa
 * tradare e come, evidenziando i cross da NON tradare con il motivo.
 * La catena e' identica a quella del pannello a schermo, cross per cross:
 *   seme del feed -> carta -> Plum Blossom -> Liu Yao -> verdetto S9 (PB + LY + rafforzativi).
 * Non tocca la selezione corrente ne' l'inserimento manuale dei trigrammi.
 */
function istanteUtcDelGiorno(dArr) {
  // 00:00 GMT corrette per l'equazione del tempo (stesso istante per tutti i cross)
  var approx = Date.UTC(dArr[0], dArr[1] - 1, dArr[2], 0, 0, 0), ms = approx;
  for (var i = 0; i < 3; i++)
    ms = approx - window.XKDGSolarTime.equationOfTimeMinutes(new Date(ms)) * 60000;
  return ms;
}

function analizzaCrossPerReport(r, utcMs, dateStr) {
  var out = { cross: (r && r.cross) || '—', branch: (r && r.branch) || null,
              signal: null, segue: null, motivo: '', decisore: '', avviso: '' };
  if (!r || r.status !== 'ok') { out.signal = 'NO TRADE'; out.motivo = 'nessun dato dal feed (mercato chiuso?)'; return out; }
  // gli stessi tre filtri del pannello: seme sul bordo, EMA non consolidata, trend assente
  if (r.seedFragile === true) {
    out.signal = 'NO TRADE';
    out.motivo = 'seme a ' + r.seedEdgePips + ' pip dal bordo: un altro dato darebbe un altro ramo, il giorno non e\' definito';
    return out;
  }
  if (r.emaConsolidated === false) {
    out.signal = 'NO TRADE';
    out.motivo = 'EMA non consolidata (' + r.emaChanges + ' inversioni negli ultimi 10 giorni)';
    return out;
  }
  if (!(r.emaConsolidated === true)) out.avviso = 'filtro di consolidamento non attivo su questo feed';
  var dir = r.direction === 'up' ? 'up' : r.direction === 'down' ? 'down' : null;
  if (!dir) { out.signal = 'NO TRADE'; out.motivo = 'trend EMA assente o piatto'; return out; }
  out.trend = dir === 'up' ? 'LONG' : 'SHORT';

  try {
    var chart = window.XKDGDaLiuRen.buildChartFromForexSeed(utcMs, FOREX_LON, r.branch);
    if (!chart || chart.error) { out.signal = 'NO TRADE'; out.motivo = 'carta non costruibile'; return out; }
    var yearBranch = (chart.source && chart.source.yearPillar) ? chart.source.yearPillar.charAt(1) : null;

    // --- Plum Blossom: dice se il trend va seguito o no
    var pb = window.XKDGPlumBlossom.read(r.seed, chart.dayBranch, chart.monthBranch,
      yearBranch, chart.dayStem || null, (r.emaRun != null) ? r.emaRun : null);
    if (!pb || pb.error) { out.signal = 'NO TRADE'; out.motivo = 'lettura Plum Blossom non disponibile'; return out; }
    if (pb.segue === null) {
      out.signal = 'NO TRADE';
      out.motivo = pb.noTradeClash ? 'clash giorno/mese: la carta non scioglie' : 'pareggio non sciolto nella carta';
      return out;
    }
    var pbDir = (dir === 'up') ? (pb.segue ? 'LONG' : 'SHORT') : (pb.segue ? 'SHORT' : 'LONG');

    // --- Liu Yao: verdetto AUTONOMO del termometro sulla stessa carta.
    // POLITICA C→S2 (Edu, 28/08/2026): si opera la CONVALIDA (PB e LY concordano).
    // Il CONTRASTO (PB e LY opposti) non si opera mai. Dove il LY TACE, il PB e' la
    // RISERVA S2: diventa operativo solo nei giorni senza nessuna convalida.
    var finale = pbDir, decisore = 'solo Plum Blossom (Liu Yao non disponibile)';
    out.classe = 'tace';
    var LYM = window.XKDGLiuYao;
    if (LYM) {
      var ly = LYM.read(r.seed, chart.dayBranch, chart.monthBranch, yearBranch, chart.dayStem || null);
      if (ly && !ly.error) {
        // TERMOMETRO CANONICO (Edu, 27/08/2026): il report usa SOLO le vie cablate e decise,
        // niente altro. Gli interruttori del termometro a schermo (localStorage) servono per
        // le prove e NON devono entrare qui: se ne resta uno spento per distrazione, il report
        // del giorno dopo darebbe un verdetto diverso da quello del sistema senza avvisare.
        var oraB0 = LYM.oraDalSeme(r.seed);
        var stD = steliDiData(dateStr, yearBranch, chart.monthBranch, chart.dayStem || null, oraB0);
        var ctxT = { oraBranch: oraB0, emaDir: dir, capolineaEl: capolineaDelFlusso(chart),
                     corpoEl: pb.trend ? pb.trend.el : null, date: dateStr,
                     yearStem: stD.yearStem, monthStem: stD.monthStem, hourStem: stD.hourStem,
                     yearBranch: yearBranch };   // (S36-bis) serve alla §137 e alle vie del Tai Sui
        var t = LYM.termometro(ly, ctxT, {}, {});
        var lyDir = (t && t.dir) || null;
        out.lyDir = lyDir;
        out.lySez = (t && t.sezione) || null;
        // --- TRE SISTEMI (Edu, 03/09/2026 S36): oltre a PB e LY si annotano il verdetto del
        // SISTEMA ATTUALE (PB + LY + rafforzativi, canonico = combinaS9 con tutte le vie accese)
        // e il verdetto del motore DA LIU REN (motore_dlr.js, stessa carta del pannello).
        out.pbDir = pbDir;
        try { var cmb = LYM.combinaS9(ly, ctxT, pbDir, {}, {}, {}); out.attuale = (cmb && cmb.finale) || pbDir; }
        catch (e2) { out.attuale = pbDir; }
        out.dlrDir = null; out.dlrVia = null;
        try {
          var MD = window.XKDGMotoreDLR, L4 = chart.fourLessons, t3 = chart.transmission && chart.transmission.three;
          if (MD && L4 && L4.length >= 4 && t3) {
            var cartaD = { steloGiorno: chart.dayStem, ramoGiorno: chart.dayBranch,
              palazzoHost: (L4[0].bottom && L4[0].bottom.branch) || L4[0].bottom,
              R1: L4[0].top.branch, R2: L4[1].top.branch, R3: L4[2].top.branch, R4: L4[3].top.branch,
              metodo: chart.transmission.method, vuoti: chart.hourVoid || [],
              generaleMese: chart.monthGeneral && chart.monthGeneral.branch, oraRamo: chart.hourBranch, treMessaggi: t3,
              spiritoR1: (L4[0].top.general && L4[0].top.general.cn) || null };
            var ld = MD.leggi(cartaD);
            out.dlrDir = (ld && ld.dir) || null; out.dlrVia = (ld && ld.via) || null;
          }
        } catch (e3) { out.dlrDir = null; }
        if (lyDir === null) {
          out.classe = 'tace';
          finale = pbDir; decisore = 'PB — il LY tace (riserva S2)';
        } else if (lyDir === pbDir) {
          out.classe = 'convalida';
          finale = pbDir; decisore = 'CONVALIDA: PB e LY concordano' + (t.sezione ? ' · LY via ' + t.sezione : '');
        } else {
          out.classe = 'contrasto';
          out.signal = 'NO TRADE';
          out.segue = null;
          out.motivo = 'contrasto PB↔LY (PB ' + pbDir + ' · LY ' + lyDir + (t.sezione ? ' via ' + t.sezione : '') + '): non si opera';
          out.seed = r.seed; out.sup = (ly && ly.sup) || null; out.inf = (ly && ly.inf) || null;
          out.linea = (ly && ly.linea) || null;
          out.bazi = (chart.source && chart.source.yearPillar ? chart.source.yearPillar : '') + ' ' +
                     (chart.monthBranch || '') + ' ' + (chart.dayStem || '') + (chart.dayBranch || '');
          return out;
        }
      }
    }
    out.signal = finale;
    out.segue = (finale === out.trend);
    out.decisore = decisore;
    // dati della carta, per poterla rileggere a fine giornata dal registro
    out.seed = r.seed;
    out.sup = (ly && ly.sup) || null;
    out.inf = (ly && ly.inf) || null;
    out.linea = (ly && ly.linea) || null;
    out.bazi = (chart.source && chart.source.yearPillar ? chart.source.yearPillar : '') + ' ' +
               (chart.monthBranch || '') + ' ' + (chart.dayStem || '') + (chart.dayBranch || '');
    return out;
  } catch (e) {
    out.signal = 'NO TRADE'; out.motivo = 'errore di lettura: ' + e.message; return out;
  }
}

function renderReportGiornaliero() {
  var box = $('report'); if (!box) return;
  if (!forexData || !forexData.rows) {
    box.style.display = 'block';
    box.innerHTML = '<div style="padding:12px">Il feed forex non e\' ancora caricato. Premi <b>Forex 00:00 GMT</b> e riprova.</div>';
    return;
  }
  var dArr = forexData.date.split('-').map(Number);
  var utcMs = istanteUtcDelGiorno(dArr);
  var esiti = (forexData.rows || []).map(function (r) {
    return analizzaCrossPerReport(r, utcMs, forexData.date);
  });

  // POLITICA C→S2 (Edu, 28/08/2026): le CONVALIDE hanno la priorita'. Se oggi non
  // ce n'e' nessuna, entra la RISERVA S2 (PB dove il LY tace). I contrasti mai.
  var conValide = esiti.filter(function (e) { return e.classe === 'convalida' && (e.signal === 'LONG' || e.signal === 'SHORT'); });
  var riserva   = esiti.filter(function (e) { return e.classe === 'tace' && (e.signal === 'LONG' || e.signal === 'SHORT'); });
  var riservaAttiva = conValide.length === 0 && riserva.length > 0;
  var tradabili = conValide.length ? conValide : (riservaAttiva ? riserva : []);
  var esclusi = esiti.filter(function (e) { return tradabili.indexOf(e) < 0; });
  esclusi.forEach(function (e) {
    if (e.classe === 'tace' && (e.signal === 'LONG' || e.signal === 'SHORT') && !riservaAttiva) {
      e.motivo = 'il LY tace — riserva S2 non attiva (oggi ci sono convalide)';
    }
  });

  var css = {
    card: 'margin:18px 0;border:1px solid rgba(255,255,255,.14);border-radius:10px;overflow:hidden',
    head: 'padding:10px 14px;background:rgba(255,255,255,.05);display:flex;flex-wrap:wrap;gap:10px;align-items:baseline;justify-content:space-between',
    sect: 'padding:10px 14px',
    row:  'display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.07)',
    name: 'min-width:96px;font-weight:700;font-size:15px',
    note: 'flex:1;min-width:180px;font-size:12px;opacity:.75'
  };
  function badge(sig) {
    var col = sig === 'LONG' ? '#3fb950' : sig === 'SHORT' ? '#f85149' : '#8b949e';
    return '<span style="display:inline-block;min-width:74px;text-align:center;padding:3px 10px;border-radius:6px;' +
      'font-weight:800;font-size:13px;letter-spacing:.4px;color:#0e1022;background:' + col + '">' + sig + '</span>';
  }

  var righeOk = tradabili.map(function (e) {
    return '<div class="repline" data-cross="' + e.cross + '" style="' + css.row + ';cursor:pointer">' +
      '<span style="' + css.name + '">' + e.cross + '</span>' + badge(e.signal) +
      '<span style="font-size:12px;opacity:.9">' + (e.segue ? 'segue il trend' : 'non segue il trend') + '</span>' +
      '<span style="' + css.note + '">' + (e.decisore ? 'deciso da: ' + e.decisore : '') +
      (e.avviso ? ' · <b style="color:#e3b341">' + e.avviso + '</b>' : '') + '</span></div>';
  }).join('') || '<div style="padding:8px 0;opacity:.7">Nessun cross da tradare oggi.</div>';

  var righeNo = esclusi.map(function (e) {
    return '<div style="' + css.row + '">' +
      '<span style="' + css.name + ';opacity:.75">' + e.cross + '</span>' + badge('NO TRADE') +
      '<span style="' + css.note + '">' + e.motivo + '</span></div>';
  }).join('') || '<div style="padding:8px 0;opacity:.7">Nessun cross escluso: tutti e nove sono tradabili.</div>';

  var nL = tradabili.filter(function (e) { return e.signal === 'LONG'; }).length;
  var nS = tradabili.filter(function (e) { return e.signal === 'SHORT'; }).length;

  salvaNelRegistro(forexData.date, tradabili);   // il report finisce nel registro dei trade

  // il report gira sempre col termometro canonico: se a schermo qualche via e' spenta lo dice
  var spente = Object.keys(lyToggles).filter(function (k) { return lyToggles[k] === false; }).length;
  var notaCanonica = '<div style="padding:6px 14px;font-size:12px;background:rgba(63,185,80,.08);' +
    'border-bottom:1px solid rgba(255,255,255,.08)">Politica <b>C→S2</b> · termometro <b>canonico</b>: si operano le <b>convalide</b> (PB e LY concordano); i contrasti mai; il PB dove il LY tace entra solo nei giorni senza convalide (riserva S2).' +
    (spente ? ' <b style="color:#e3b341">Nota: a schermo hai ' + spente + ' via' + (spente > 1 ? ' spente' : ' spenta') +
      ' — il report le ignora e le usa comunque accese.</b>' : '') + '</div>';

  box.style.display = 'block';
  box.innerHTML =
    '<div style="' + css.card + '">' +
      '<div style="' + css.head + '">' +
        '<b style="font-size:16px">Report giornaliero · ' + forexData.date + ' 00:00 GMT</b>' +
        '<span style="font-size:12px;opacity:.8">' + tradabili.length + ' da tradare (' + nL + ' long, ' + nS +
        ' short) · ' + esclusi.length + ' da non tradare · politica C→S2' +
        (riservaAttiva ? ' · <b style="color:#e3b341">RISERVA S2 attiva (nessuna convalida oggi)</b>' : ' · convalide') + '</span>' +
      '</div>' + notaCanonica +
      '<div style="' + css.sect + '">' +
        '<div style="font-size:12px;letter-spacing:1px;opacity:.65;margin-bottom:4px">DA TRADARE' +
        (riservaAttiva ? ' · RISERVA S2 (PB dove il LY tace)' : ' · CONVALIDE') + '</div>' + righeOk +
      '</div>' +
      '<div style="' + css.sect + ';background:rgba(248,81,73,.05);border-top:1px solid rgba(255,255,255,.10)">' +
        '<div style="font-size:12px;letter-spacing:1px;opacity:.65;margin-bottom:4px">DA NON TRADARE</div>' + righeNo +
      '</div>' +
    '</div>' + '<div id="regbox">' + htmlRegistro() + '</div>';

  // una riga del report apre il cross corrispondente nel pannello sopra
  box.querySelectorAll('.repline').forEach(function (el) {
    el.addEventListener('click', function () {
      var pill = document.querySelector('#forexbar .pill[data-cross="' + el.dataset.cross + '"]');
      if (pill) { selectForexCross(pill.dataset.cross, pill.dataset.branch, pill); pill.scrollIntoView({ block: 'center' }); }
    });
  });
  wireRegistro(box);
  box.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------------- REGISTRO DEI TRADE PROPOSTI (Edu, 27/08/2026) ----------------
 * Ogni report viene salvato. A fine giornata, per ogni trade proposto si scrive quanti
 * pip ha fatto (segno + o -). I trade andati male restano evidenziati e il pulsante
 * "Copia i trade perdenti" prepara il blocco da incollare in chat per capire perche'.
 * La carta viene salvata per intero (seme, trigrammi, mutante, Bazi) cosi' e' rileggibile
 * anche a distanza di giorni senza rifare il feed.
 */
/* Esiti automatici: il feed porta i pip fatti dal giorno di trade precedente (campi
 * prevDate / prevMovePip del Worker). Qui si convertono nel guadagno del trade proposto:
 * se il sistema diceva LONG il trade guadagna quanto ha fatto il mercato, se diceva SHORT
 * guadagna il contrario. Un esito scritto a mano non viene mai sovrascritto. */
function aggiornaEsitiDalFeed() {
  if (!forexData || !forexData.rows) return { scritti: 0, disponibile: false };
  var reg = leggiRegistro(), n = 0, disponibile = false;
  forexData.rows.forEach(function (r) {
    if (!r || r.prevDate == null || r.prevMovePip == null) return;
    disponibile = true;
    var giorno = reg[r.prevDate]; if (!giorno) return;
    giorno.forEach(function (t) {
      if (t.cross !== r.cross) return;
      if (typeof t.esito === 'number') return;         // gia' scritto: non toccarlo
      t.esito = Math.round((t.signal === 'LONG') ? r.prevMovePip : -r.prevMovePip);
      t.auto = true; n++;
    });
  });
  if (n) scriviRegistro(reg);
  return { scritti: n, disponibile: disponibile };
}

var REG_KEY = 'report-registro-v1';
function leggiRegistro() {
  try { return JSON.parse(localStorage.getItem(REG_KEY)) || {}; } catch (e) { return {}; }
}
function scriviRegistro(reg) {
  try { localStorage.setItem(REG_KEY, JSON.stringify(reg)); } catch (e) {}
}
function salvaNelRegistro(data, tradabili) {
  var reg = leggiRegistro();
  var vecchi = {};
  (reg[data] || []).forEach(function (t) { vecchi[t.cross] = t.esito; });   // non perdere gli esiti gia' scritti
  reg[data] = tradabili.map(function (e) {
    return { cross: e.cross, signal: e.signal, trend: e.trend, segue: e.segue,
             decisore: e.decisore, seed: e.seed, sup: e.sup, inf: e.inf, linea: e.linea,
             bazi: e.bazi, livello: e.livello || null, voci: e.voci || null, dlrVia: e.dlrVia || null,
             esito: (e.cross in vecchi) ? vecchi[e.cross] : null };
  });
  var giorni = Object.keys(reg).sort();
  while (giorni.length > 60) delete reg[giorni.shift()];                    // tieni due mesi
  scriviRegistro(reg);
}
function htmlRegistro() {
  var auto = aggiornaEsitiDalFeed();
  var reg = leggiRegistro();
  var giorni = Object.keys(reg).sort().reverse().slice(0, 10);
  if (!giorni.length) return '';
  var rowS = 'display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:6px 0;' +
             'border-bottom:1px solid rgba(255,255,255,.07)';
  var corpo = giorni.map(function (d) {
    var trades = reg[d] || [];
    if (!trades.length) return '';
    var aperti = trades.filter(function (t) { return t.esito === null || t.esito === undefined; }).length;
    var persi = trades.filter(function (t) { return typeof t.esito === 'number' && t.esito < 0; });
    var vinti = trades.filter(function (t) { return typeof t.esito === 'number' && t.esito > 0; });
    var righe = trades.map(function (t) {
      var col = t.signal === 'LONG' ? '#3fb950' : '#f85149';
      var val = (t.esito === null || t.esito === undefined) ? '' : t.esito;
      var stato = (t.esito === null || t.esito === undefined) ? ''
        : (t.esito < 0 ? '<b style="color:#f85149">da capire</b>' : '<span style="color:#3fb950">ok</span>');
      return '<div style="' + rowS + '">' +
        '<span style="min-width:90px;font-weight:700">' + t.cross + '</span>' +
        '<span style="color:' + col + ';font-weight:800;min-width:56px">' + t.signal + '</span>' +
        '<span style="font-size:12px;opacity:.85;min-width:130px">' + (t.segue ? 'segue il trend' : 'non segue il trend') + '</span>' +
        '<input class="esito" data-d="' + d + '" data-c="' + t.cross + '" type="number" step="1" value="' + val + '" ' +
        'placeholder="pip" style="width:82px;padding:3px 6px;border-radius:5px;border:1px solid rgba(255,255,255,.2);' +
        'background:transparent;color:inherit">' +
        '<span style="font-size:12px">' + stato + '</span>' +
        '<span style="flex:1;min-width:160px;font-size:11px;opacity:.6">' + (t.decisore || '') + '</span>' +
      '</div>';
    }).join('');
    return '<div style="padding:8px 14px;border-top:1px solid rgba(255,255,255,.10)">' +
      '<div style="font-size:12px;opacity:.75;margin-bottom:4px"><b>' + d + '</b> · ' + trades.length + ' trade · ' +
      vinti.length + ' ok · ' + persi.length + ' da capire' + (aperti ? ' · ' + aperti + ' senza esito' : '') + '</div>' +
      righe + '</div>';
  }).join('');
  return '<div style="margin:18px 0;border:1px solid rgba(255,255,255,.14);border-radius:10px;overflow:hidden">' +
    '<div style="padding:10px 14px;background:rgba(255,255,255,.05);display:flex;flex-wrap:wrap;gap:10px;' +
    'align-items:center;justify-content:space-between">' +
      '<b style="font-size:15px">Registro dei trade · esiti di fine giornata</b>' +
      '<button id="copiapersi" class="ghost" style="font-size:12px">Copia i trade perdenti</button>' +
    '</div>' +
    '<div style="padding:6px 14px 2px;font-size:12px;opacity:.7">' +
    (auto.disponibile
      ? 'Gli esiti arrivano <b>da soli</b> dal feed del giorno dopo (entrata alle 00:00 GMT, uscita alle 21:00 GMT). ' +
        (auto.scritti ? '<b style="color:#3fb950">' + auto.scritti + ' appena compilati.</b> ' : '') +
        'Puoi comunque correggere a mano un numero scrivendolo sopra.'
      : '<b style="color:#e3b341">Il feed non porta ancora gli esiti</b> — aggiorna il Worker su Cloudflare. ' +
        'Intanto scrivi a mano i pip fatti da ogni trade, col segno.') +
    ' Quelli negativi restano segnati <b>da capire</b>: il pulsante qui sopra prepara il blocco da incollare in chat.</div>' +
    corpo + '</div>';
}
function wireRegistro(box) {
  box.querySelectorAll('input.esito').forEach(function (inp) {
    inp.addEventListener('change', function () {
      var reg = leggiRegistro(), d = inp.dataset.d, c = inp.dataset.c;
      (reg[d] || []).forEach(function (t) {
        if (t.cross === c) t.esito = (inp.value === '') ? null : Number(inp.value);
      });
      scriviRegistro(reg);
      var rb = $('regbox');           // ridisegna SOLO il registro: niente rianalisi, niente salto di pagina
      if (rb) { rb.innerHTML = htmlRegistro(); wireRegistro(rb); }
    });
  });
  var btn = box.querySelector('#copiapersi');
  if (btn) btn.addEventListener('click', function () {
    var reg = leggiRegistro(), out = [];
    Object.keys(reg).sort().forEach(function (d) {
      (reg[d] || []).forEach(function (t) {
        if (typeof t.esito === 'number' && t.esito < 0) {
          out.push(t.cross + ', ' + d +
            '\nTrend EMA: ' + t.trend +
            '\nIl sistema dice: ' + t.signal + ' (' + (t.segue ? 'segue' : 'non segue') + ' il trend)' +
            '\nEsito: ' + t.esito + ' pip' +
            '\nSeme ' + t.seed + ' · superiore ' + t.sup + ' · inferiore ' + t.inf + ' · mutante L' + t.linea +
            '\nBazi: ' + (t.bazi || '') +
            (t.livello ? '\nLivello: ' + t.livello + ' · ' + (t.voci || '') + (t.dlrVia ? ' · via DLR: ' + t.dlrVia : '') : '') +
            '\nDeciso da: ' + (t.decisore || ''));
        }
      });
    });
    var testo = out.length
      ? 'Trade perdenti del report:\n\n' + out.join('\n\n')
      : 'Nessun trade perdente da capire.';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(testo).then(function () { btn.textContent = 'Copiato ✓'; },
        function () { window.prompt('Copia a mano:', testo); });
    } else window.prompt('Copia a mano:', testo);
  });
}

/* Capolinea del flusso degli steli: si cammina la generazione partendo da ogni elemento
 * presente negli otto caratteri e si avanza finché l'elemento generato ha uno stelo della
 * polarità del giorno; l'ultimo raggiunto è il capolinea. Serve alla via §105. */
// STELI DI ANNO/MESE/ORA DERIVATI DAI RAMI DEL MOTORE (correzione 27/08/2026, sessione 24).
// MAI prendere steli di anno o mese dal pilastro di un'ora convenzionale: nei giorni a cavallo
// di un termine solare apparterrebbero al mese (o all'anno) sbagliato rispetto alle 00:00 GMT.
// Anno: dall'anno civile + ramo d'anno. Mese: 五虎遁 dallo stelo d'anno. Ora: 五鼠遁 dal giorno.
function steliDiData(dateStr, yearBranch, monthBranch, dayStem, oraBranch) {
  var STm = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  var BR12 = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  var BRm12 = ['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'];
  var PRIMO = {'甲':'丙','己':'丙','乙':'戊','庚':'戊','丙':'庚','辛':'庚','丁':'壬','壬':'壬','戊':'甲','癸':'甲'};
  var WUSHU = {'甲':'甲','己':'甲','乙':'丙','庚':'丙','丙':'戊','辛':'戊','丁':'庚','壬':'庚','戊':'壬','癸':'壬'};
  var out = { yearStem: null, monthStem: null, hourStem: null };
  try {
    var y = parseInt(String(dateStr).slice(0, 4), 10);
    if (y && yearBranch) {
      var cands = [y, y - 1];
      for (var i = 0; i < 2; i++) {
        var Y = cands[i], idx = ((Y - 4) % 12 + 12) % 12;
        if (BR12[idx] === yearBranch) { out.yearStem = STm[((Y - 4) % 10 + 10) % 10]; break; }
      }
    }
    if (out.yearStem && monthBranch) {
      var j = BRm12.indexOf(monthBranch), s0 = PRIMO[out.yearStem];
      if (j >= 0 && s0) out.monthStem = STm[(STm.indexOf(s0) + j) % 10];
    }
    if (dayStem && oraBranch) {
      var h0 = WUSHU[dayStem], hi = BR12.indexOf(oraBranch);
      if (h0 && hi >= 0) out.hourStem = STm[(STm.indexOf(h0) + hi) % 10];
    }
  } catch (e) {}
  return out;
}

function capolineaDelFlusso(chart) {
  try {
    var SE = {'甲':'Wood','乙':'Wood','丙':'Fire','丁':'Fire','戊':'Earth','己':'Earth',
              '庚':'Metal','辛':'Metal','壬':'Water','癸':'Water'};
    var EB = {'子':'Water','丑':'Earth','寅':'Wood','卯':'Wood','辰':'Earth','巳':'Fire',
              '午':'Fire','未':'Earth','申':'Metal','酉':'Metal','戌':'Earth','亥':'Water'};
    var GENF = {Wood:'Fire',Fire:'Earth',Earth:'Metal',Metal:'Water',Water:'Wood'};
    var ST = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
    var s = chart && chart.source; if (!s) return null;
    var pil = [s.yearPillar, s.monthPillar, s.dayPillar, s.hourPillar];
    var steli = [], rami = [];
    pil.forEach(function (p) { if (p && p.length >= 2) { steli.push(p.charAt(0)); rami.push(p.charAt(1)); } });
    var dayStem = s.dayPillar ? s.dayPillar.charAt(0) : null;
    if (!dayStem) return null;
    var pari = ST.indexOf(dayStem) % 2;                       // polarità del giorno
    var pres = {};
    steli.forEach(function (x) { if (SE[x]) (pres[SE[x]] = pres[SE[x]] || []).push(x); });
    rami.forEach(function (x) { if (EB[x]) (pres[EB[x]] = pres[EB[x]] || []).push(x); });
    var utile = function (e) { return steli.filter(function (x) {
      return SE[x] === e && ST.indexOf(x) % 2 === pari; }); };
    var cap = null;
    Object.keys(pres).forEach(function (part) {
      var e = part, guard = 0, ultimo = null;
      while (guard++ < 6) { var g = GENF[e]; if (!pres[g] || !utile(g).length) break; e = g; ultimo = g; }
      if (ultimo) cap = ultimo;
    });
    return cap;
  } catch (e) { return null; }
}

/* ---------------- TRE SISTEMI A SCALARE (Edu, 03/09/2026, sessione S36) ----------------
 * Livello A: Plum Blossom, Liu Yao e Da Liu Ren concordano            (382 carte · 68,3%)
 * Livello B: sistema attuale (PB+LY+rafforzativi) e Da Liu Ren concordano (410 · 66,3%)
 * Livello C: Plum Blossom e Liu Yao concordano e il Da Liu Ren TACE   (646 · 62,4%)
 * Altrimenti fermo. Scala misurata: 1.438 carte · 65,1% · +30.351 pip (pb_stress.js TRESIST=1).
 * Se il Da Liu Ren contrasta due sistemi concordi e' una moneta (315 · 53%): fermo.
 */
function livelloTreSistemi(e) {
  var pb = e.pbDir || null, ly = e.lyDir || null, at = e.attuale || null, dlr = e.dlrDir || null;
  var voci = 'PB ' + (pb || '—') + ' · LY ' + (ly || 'tace') + ' · attuale ' + (at || '—') + ' · DLR ' + (dlr || 'tace');
  if (!pb) return { liv: null, dir: null, perche: 'Plum Blossom non disponibile', voci: voci };
  if (ly && dlr && pb === ly && ly === dlr)
    return { liv: 'A', dir: pb, perche: 'Plum Blossom, Liu Yao e Da Liu Ren concordano', voci: voci };
  if (dlr && at === dlr)
    return { liv: 'B', dir: at, perche: 'sistema attuale e Da Liu Ren concordano' +
             (ly ? (ly === pb ? '' : ' (PB e LY in contrasto, il sistema attuale ha scelto ' + at + ')') : ' (il Liu Yao tace)'), voci: voci };
  if (ly && pb === ly && !dlr)
    return { liv: 'C', dir: pb, perche: 'Plum Blossom e Liu Yao concordano, il Da Liu Ren tace', voci: voci };
  var perche;
  if (dlr && ly && pb === ly) perche = 'il Da Liu Ren (' + dlr + ') contrasta Plum Blossom e Liu Yao concordi (' + pb + '): moneta, fermo';
  else if (dlr) perche = 'sistema attuale (' + at + ') contro Da Liu Ren (' + dlr + '): fermo';
  else if (ly) perche = 'Plum Blossom (' + pb + ') contro Liu Yao (' + ly + ') e il Da Liu Ren tace: fermo';
  else perche = 'parla solo il Plum Blossom: fermo';
  return { liv: null, dir: null, perche: perche, voci: voci };
}

function renderReportTreSistemi() {
  var box = $('report'); if (!box) return;
  if (!forexData || !forexData.rows) {
    box.style.display = 'block';
    box.innerHTML = '<div style="padding:12px">Il feed forex non e\' ancora caricato. Premi <b>Forex 00:00 GMT</b> e riprova.</div>';
    return;
  }
  var dArr = forexData.date.split('-').map(Number);
  var utcMs = istanteUtcDelGiorno(dArr);
  var esiti = (forexData.rows || []).map(function (r) {
    var e = analizzaCrossPerReport(r, utcMs, forexData.date);
    if (e.pbDir) {                                   // la carta e' leggibile: si applica la scala
      var L = livelloTreSistemi(e);
      e.livello = L.liv; e.voci = L.voci;
      if (L.liv) { e.signal = L.dir; e.segue = (L.dir === e.trend); e.decisore = 'Livello ' + L.liv + ' · ' + L.perche + ' · ' + L.voci; e.motivo = ''; }
      else { e.signal = 'NO TRADE'; e.segue = null; e.motivo = L.perche + ' · ' + L.voci; }
    } else if (e.signal !== 'NO TRADE') { e.signal = 'NO TRADE'; e.motivo = e.motivo || 'carta non leggibile'; }
    return e;
  });
  var tradabili = esiti.filter(function (e) { return e.livello && (e.signal === 'LONG' || e.signal === 'SHORT'); });
  var ordine = { A: 0, B: 1, C: 2 };
  tradabili.sort(function (a, b) { return ordine[a.livello] - ordine[b.livello]; });
  var esclusi = esiti.filter(function (e) { return tradabili.indexOf(e) < 0; });

  var css = {
    card: 'margin:18px 0;border:1px solid rgba(255,255,255,.14);border-radius:10px;overflow:hidden',
    head: 'padding:10px 14px;background:rgba(255,255,255,.05);display:flex;flex-wrap:wrap;gap:10px;align-items:baseline;justify-content:space-between',
    sect: 'padding:10px 14px',
    row:  'display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.07)',
    name: 'min-width:96px;font-weight:700;font-size:15px',
    note: 'flex:1;min-width:180px;font-size:12px;opacity:.75'
  };
  function badge(sig) {
    var col = sig === 'LONG' ? '#3fb950' : sig === 'SHORT' ? '#f85149' : '#8b949e';
    return '<span style="display:inline-block;min-width:74px;text-align:center;padding:3px 10px;border-radius:6px;' +
      'font-weight:800;font-size:13px;letter-spacing:.4px;color:#0e1022;background:' + col + '">' + sig + '</span>';
  }
  function livBadge(l) {
    var col = l === 'A' ? '#e3b341' : l === 'B' ? '#58a6ff' : '#b18cff';
    return '<span style="display:inline-block;min-width:26px;text-align:center;padding:3px 8px;border-radius:6px;' +
      'font-weight:900;font-size:13px;color:#0e1022;background:' + col + '" title="livello ' + l + '">' + l + '</span>';
  }
  var righeOk = tradabili.map(function (e) {
    return '<div class="repline" data-cross="' + e.cross + '" style="' + css.row + ';cursor:pointer">' +
      livBadge(e.livello) + '<span style="' + css.name + '">' + e.cross + '</span>' + badge(e.signal) +
      '<span style="font-size:12px;opacity:.9">' + (e.segue ? 'segue il trend' : 'non segue il trend') + '</span>' +
      '<span style="' + css.note + '">' + e.voci + (e.dlrVia ? ' · via DLR: ' + e.dlrVia : '') +
      (e.avviso ? ' · <b style="color:#e3b341">' + e.avviso + '</b>' : '') + '</span></div>';
  }).join('') || '<div style="padding:8px 0;opacity:.7">Nessun cross da tradare oggi: nessun livello A, B o C.</div>';
  var righeNo = esclusi.map(function (e) {
    return '<div style="' + css.row + '">' +
      '<span style="' + css.name + ';opacity:.75">' + e.cross + '</span>' + badge('NO TRADE') +
      '<span style="' + css.note + '">' + e.motivo + '</span></div>';
  }).join('') || '<div style="padding:8px 0;opacity:.7">Nessun cross fermo.</div>';
  var nA = tradabili.filter(function (e) { return e.livello === 'A'; }).length;
  var nB = tradabili.filter(function (e) { return e.livello === 'B'; }).length;
  var nC = tradabili.filter(function (e) { return e.livello === 'C'; }).length;
  var nL = tradabili.filter(function (e) { return e.signal === 'LONG'; }).length;
  var nS = tradabili.filter(function (e) { return e.signal === 'SHORT'; }).length;

  salvaNelRegistro(forexData.date, tradabili);

  var spente = Object.keys(lyToggles).filter(function (k) { return lyToggles[k] === false; }).length;
  var nota = '<div style="padding:6px 14px;font-size:12px;background:rgba(227,179,65,.08);border-bottom:1px solid rgba(255,255,255,.08)">' +
    'Scala <b>A → B → C</b>: <b>A</b> = Plum Blossom, Liu Yao e Da Liu Ren concordano (68%) · ' +
    '<b>B</b> = sistema attuale e Da Liu Ren concordano (66%) · <b>C</b> = Plum Blossom e Liu Yao concordano e il Da Liu Ren tace (62%). ' +
    'Se il Da Liu Ren contrasta due sistemi concordi: fermo. Termometro canonico, tutte le vie accese.' +
    (spente ? ' <b style="color:#e3b341">Nota: a schermo hai ' + spente + ' via' + (spente > 1 ? ' spente' : ' spenta') +
      ' — il report le ignora e le usa comunque accese.</b>' : '') + '</div>';

  box.style.display = 'block';
  box.innerHTML =
    '<div style="' + css.card + '">' +
      '<div style="' + css.head + '">' +
        '<b style="font-size:16px">Report tre sistemi · ' + forexData.date + ' 00:00 GMT</b>' +
        '<span style="font-size:12px;opacity:.8">' + tradabili.length + ' da tradare (' + nL + ' long, ' + nS + ' short) · ' +
        'A ' + nA + ' · B ' + nB + ' · C ' + nC + ' · ' + esclusi.length + ' fermi</span>' +
      '</div>' + nota +
      '<div style="' + css.sect + '">' +
        '<div style="font-size:12px;letter-spacing:1px;opacity:.65;margin-bottom:4px">DA TRADARE · livello A, B o C</div>' + righeOk +
      '</div>' +
      '<div style="' + css.sect + ';background:rgba(248,81,73,.05);border-top:1px solid rgba(255,255,255,.10)">' +
        '<div style="font-size:12px;letter-spacing:1px;opacity:.65;margin-bottom:4px">FERMI</div>' + righeNo +
      '</div>' +
    '</div>' + '<div id="regbox">' + htmlRegistro() + '</div>';

  box.querySelectorAll('.repline').forEach(function (el) {
    el.addEventListener('click', function () {
      var pill = document.querySelector('#forexbar .pill[data-cross="' + el.dataset.cross + '"]');
      if (pill) { selectForexCross(pill.dataset.cross, pill.dataset.branch, pill); pill.scrollIntoView({ block: 'center' }); }
    });
  });
  wireRegistro(box);
  box.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function reportTreSistemi() {
  var box = $('report');
  if (box) { box.style.display = 'block'; box.innerHTML = '<div style="padding:12px">Tre sistemi sui nove cross in corso…</div>'; }
  if (!forexData || !forexData.rows) await loadForex();
  renderReportTreSistemi();
}

async function reportGiornaliero() {
  var box = $('report');
  if (box) { box.style.display = 'block'; box.innerHTML = '<div style="padding:12px">Analisi dei nove cross in corso…</div>'; }
  if (!forexData || !forexData.rows) await loadForex();   // il report ha bisogno del feed
  renderReportGiornaliero();
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
          ? '<span class="tv no">DAY↔MONTH CLASH · no trade</span>'
          : '<span class="tv no">TIE · no trade</span>')
        : (confirmed
          ? '<span class="tv ok">FOLLOWS the trend</span>'
          : '<span class="tv no">does NOT follow the trend</span>')));
  var signalBadge = signal
    ? '<span class="sig ' + (signal === 'NO TRADE' ? 'notrade' : signal.toLowerCase()) + '">' + signal + '</span>'
    : '<span class="sig na">signal n/a — EMA trend missing</span>';
  var head = '<div class="trendhead"><span>' + cross + ' — 梅花 Plum Blossom</span>' + signalBadge + '</div>';

  var seedLine = '';
  if (row && row.price != null) {
    seedLine = '<div class="trendmsgs seedline">00:00 GMT open <b class="px">' + row.price + '</b>' +
      ' → seed <b class="px">' + row.seed + '</b> · day <b>' + chart.dayStem + chart.dayBranch + '</b>' +
      (pbManual ? ' · <b class="down">manual entry</b>' : '') +
      (fragile ? '<br><b class="down">seed within 3 pip of the bucket edge → NO TRADE</b>' : '') + '</div>';
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

  var roles = '<div class="trendmsgs">Trend (Ti) <b>' + pb.trendLabel + '</b>' +
    ' · Yong <b>' + pb.yongOrigLabel + '</b>' +
    ' → moves into <b>' + pb.yongTrasfLabel + '</b>' +
    ' — ' + verdictBadge + '</div>';

  // manual override controls: superiore (1-8), inferiore (1-8), linea mutante (1-6)
  function opts(n, sel){ var s=''; for(var i=1;i<=n;i++) s+='<option value="'+i+'"'+(i===sel?' selected':'')+'>'+i+'</option>'; return s; }
  var manualRow = '<div class="pbmanual">' +
    '<span>Manual entry:</span>' +
    ' upper <select id="pb-sup">' + opts(8, pb.superiore) + '</select>' +
    ' lower <select id="pb-inf">' + opts(8, pb.inferiore) + '</select>' +
    ' mobile line <select id="pb-line">' + opts(6, pb.linea) + '</select>' +
    ' <button class="ghost" id="pb-reset" style="padding:4px 12px">Reset to seed</button>' +
    '</div>';

  p.innerHTML = head + seedLine + emaLine + hexBlock + roles + manualRow;
  p.style.display = 'block';

  // Liu Yao: lettura completa sotto il Plum Blossom (correttivo, stessa carta) + termometro S9
  var pbCtx = {
    corpoEl: pb.trend ? pb.trend.el : null,
    emaDir: dir,
    finalDir: (signal === 'LONG' || signal === 'SHORT') ? signal : null,
    date: (dArr && dArr.length === 3) ? (dArr[0] + '-' + pad(dArr[1]) + '-' + pad(dArr[2])) : null
  };
  renderLiuYao(cross, chart, row, lyp, pbCtx);

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

// ---- Liu Yao: full reading below the Plum Blossom, same card, plus the LY thermometer ----
function renderLiuYao(cross, chart, row, lyp, pbCtx) {
  if (!lyp) lyp = $('lypanel');
  if (!lyp) return;
  if (!window.XKDGLiuYao || !row || row.seed == null || !chart.dayBranch) { lyp.style.display = 'none'; return; }
  var LYM = window.XKDGLiuYao;

  var yearBranch = (chart.source && chart.source.yearPillar) ? chart.source.yearPillar.charAt(1) : null;
  var oraBranchSeme = (row.seed != null) ? LYM.oraDalSeme(row.seed) : null;
  var ly = pbManual
    ? LYM.readManual(pbManual.sup, pbManual.inf, pbManual.linea,
        chart.dayBranch, chart.monthBranch, yearBranch, chart.dayStem || null, null)
    : LYM.read(row.seed, chart.dayBranch, chart.monthBranch, yearBranch, chart.dayStem || null);
  if (ly.error) { lyp.style.display = 'none'; return; }

  var BEAST_COLOR = { '青龍':'#3fb950', '朱雀':'#f85149', '勾陳':'#d4a72c',
                      '螣蛇':'#a371f7', '白虎':'#8b949e', '玄武':'#58a6ff' };
  var EN = LYM.EL_EN, ST = LYM.STATO_EN;
  function lineGlyph(yang) {
    return yang
      ? '<span style="display:inline-block;width:52px;border-top:9px solid currentColor;vertical-align:middle"></span>'
      : '<span style="display:inline-block;width:22px;border-top:9px solid currentColor;vertical-align:middle"></span>' +
        '<span style="display:inline-block;width:8px"></span>' +
        '<span style="display:inline-block;width:22px;border-top:9px solid currentColor;vertical-align:middle"></span>';
  }
  function code(par) { return '<b title="' + LYM.PAR[par].en + '">' + par + '</b>'; }

  var head = '<div class="trendhead"><span>' + cross + ' — Liu Yao</span>' +
    '<span class="tv" style="margin-left:14px">corrective of the Plum Blossom</span></div>';

  var emaLine = '';
  if (pbCtx) {
    var d0 = pbCtx.emaDir;
    var arrow0 = d0 === 'up' ? '↑ up (blue)' : d0 === 'down' ? '↓ down (red)' : (d0 || 'n/a');
    var emaSig = d0 === 'up' ? 'LONG' : d0 === 'down' ? 'SHORT' : null;
    var pbFollow = (pbCtx.finalDir && emaSig) ? (pbCtx.finalDir === emaSig ? 'FOLLOWS the trend' : 'does NOT follow the trend') : '';
    emaLine = '<div class="trendmsgs">EMA(12) daily trend: <b class="' + (d0 || '') + '">' + arrow0 + '</b>' +
      (pbCtx.finalDir ? ' · PB verdict: <b>' + pbCtx.finalDir + '</b>' + (pbFollow ? ' (' + pbFollow + ')' : '') : '') + '</div>';
  }
  // Day context: the four pillars (hour from the seed) + spirits/virtues of the day, all as branches
  var cg = LYM.contestoGiorno(ly, { oraBranch: oraBranchSeme, date: pbCtx ? pbCtx.date : null });
  var src = chart.source || {};
  var pil = function (lab, gz, hi) {
    return '<span style="display:inline-block;margin-right:14px' + (hi ? ';font-weight:700' : '') + '">' + lab + ' <b style="font-size:16px">' + (gz || '—') + '</b></span>';
  };
  var hourPillar = src.hourPillar || (oraBranchSeme ? '·' + oraBranchSeme : null);
  var baziLine = '<div class="trendmsgs">Bazi: ' +
    pil('Year', src.yearPillar) + pil('Month', src.monthPillar) + pil('Day', src.dayPillar, true) +
    pil('Hour (from seed ' + row.seed + ')', hourPillar) +
    '<span style="opacity:.6;font-size:12px">· Tai Sui = year branch ' + (cg.year || '—') + (cg.taiSuiPos ? ' (on L' + cg.taiSuiPos + ')' : ' (not in the hexagram)') + '</span></div>';
  var lst = function (a) { return (a && a.length) ? a.join(' ') : '—'; };
  var spiritLine = '<div class="trendmsgs" style="font-size:12px;opacity:.85">Day actors: ' +
    'void <b>' + lst(cg.vuoti) + '</b> · Month General <b>' + (cg.monthGeneral || '—') + '</b>' +
    ' · Ding <b>' + (cg.ding || '—') + '</b> · Post Horse <b>' + (cg.postHorse || '—') + '</b>' +
    ' · Heaven Virtue <b>' + (cg.heavenVirtue || '—') + '</b> · Branch Virtue <b>' + (cg.branchVirtue || '—') + '</b>' +
    ' · Ghost Sha <b>' + lst(cg.ghost) + '</b> · Tomb Sha <b>' + lst(cg.tomb) + '</b></div>';

  // the two hexagrams: original (with the mobile line marked) and transformed
  var TRN = { 1:'Qian', 2:'Dui', 3:'Li', 4:'Zhen', 5:'Xun', 6:'Kan', 7:'Gen', 8:'Kun' };
  function yangOf(n, p) { return ((((n - 1) >> (3 - p)) & 1) === 0); }
  function drawHexLY(supN, infN, title, moving) {
    var rowsH = '';
    for (var pos = 6; pos >= 1; pos--) {
      var yang = pos <= 3 ? yangOf(infN, pos) : yangOf(supN, pos - 3);
      var cls = 'pbline' + (yang ? ' yang' : ' yin') + (moving === pos ? ' moving' : '');
      rowsH += yang
        ? '<div class="' + cls + '"><span class="seg full"></span></div>'
        : '<div class="' + cls + '"><span class="seg half"></span><span class="seg gap"></span><span class="seg half"></span></div>';
    }
    return '<div class="pbcol"><div class="pbtitle">' + title + '</div>' +
      '<div class="pbnum">' + supN + ' ' + TRN[supN] + '</div>' + rowsH + '<div class="pbnum">' + infN + ' ' + TRN[infN] + '</div></div>';
  }
  var trSup = ly.sup, trInf = ly.inf;
  if (ly.linea <= 3) trInf = ly.mutante.trigTrasf; else trSup = ly.mutante.trigTrasf;
  var hexBlock = '<div class="pbhex">' + drawHexLY(ly.sup, ly.inf, 'Original', ly.linea) +
    drawHexLY(trSup, trInf, 'Transformed', 0) + '</div>';

  var palLine = '<div class="trendmsgs">Palace: <b>' + ly.palPinyin + '</b> (' + EN[ly.palEl] + ')' +
    ' · Shi (subject) L' + ly.shi + ' · Ying (object) L' + ly.ying +
    ' · void branches: <b>' + (ly.vuoti.length ? ly.vuoti.join(' ') : '—') + '</b>' +
    ' · Tai Sui (year): ' + (ly.taiSuiPos ? 'L' + ly.taiSuiPos : 'no line') +
    ' · hour from seed: <b>' + (oraBranchSeme || '—') + '</b></div>';

  var m = ly.mutante;
  var mutLine = '<div class="trendmsgs">Mobile line L' + m.pos + ': <b>' + m.ramoDep + '</b> (' + EN[m.depEl] +
    ') → <b>' + m.ramoArr + '</b> (' + EN[m.arrEl] + ') — ' + m.casoLabel +
    (m.progressione ? ' · ' + (m.progressione === 'avanzante' ? 'advancing' : 'retreating') : '') +
    (m.movimentoNullo ? ' · <b class="down">NULL movement</b>' : '') +
    (m.atterraggio ? ' · lands on L' + m.atterraggio.pos + ' (' + m.atterraggio.ramo + ') → ' + m.atterraggio.dir : '') +
    '</div>';

  // force model (Edu 17/08): score of every line, arrival, gatherings
  var FZ = null;
  try { FZ = LYM.forzaModello(ly, { oraBranch: oraBranchSeme }, null); } catch (e) { FZ = null; }
  function fzCell(o) {
    if (!o) return '';
    var v = o.score, col = v >= 2 ? 'var(--up,#3fb950)' : v <= -1 ? 'var(--down,#f85149)' : 'inherit';
    var tip = o.det.join(' · ');
    return '<span class="fzscore" title="' + tip.replace(/"/g, '&quot;') + '" style="cursor:help;color:' + col + ';font-weight:600">' + (v > 0 ? '+' : '') + v.toFixed(1) + '</span>' +
      '<div class="fzdoc" style="display:none;font-size:11px;opacity:.75;max-width:260px">' + tip + '</div>';
  }
  // six lines, L6 (top) → L1 (bottom)
  var rows = '';
  for (var i = 6; i >= 1; i--) {
    var l = ly.linee[i-1];
    var beast = l.bestia
      ? '<span style="color:' + (BEAST_COLOR[l.bestia.cn] || 'currentColor') + '">' + l.bestia.en + '</span>'
      : '—';
    var fu = l.fushen
      ? '<small style="opacity:.85">hidden ' + code(l.fushen.par) + ' ' + l.fushen.b + '</small>'
      : '';
    var orig = code(l.par) + ' ' + l.ramo + ' <small style="opacity:.75">' + EN[l.el] + '</small>';
    var marks = '';
    if (l.isShi)  marks += '<b style="color:var(--gold,#e3b341)"> Shi</b>';
    if (l.isYing) marks += '<b style="color:var(--azure,#58a6ff)"> Ying</b>';
    if (l.isMobile) marks += '<b class="down"> ✸</b>';
    if (l.vuoto)  marks += ' <small style="color:var(--void,#8b949e)">void</small>';
    if (l.isTaiSui) marks += ' <small style="opacity:.8">TS</small>';
    marks += ' <small style="opacity:.6">[' + (ST[l.stato] || l.stato) + ']</small>';
    var trasf = (l.isMobile && l.mut)
      ? '→ ' + code(l.mut.parArr) + ' ' + l.mut.ramoArr + ' <small style="opacity:.75">' + EN[l.mut.elArr] + '</small>'
      : '';
    var rowStyle = l.isMobile ? ' style="background:rgba(227,179,65,.08)"' : '';
    rows += '<tr' + rowStyle + '>' +
      '<td style="padding:5px 8px;text-align:center;white-space:nowrap;font-size:12px">' + beast + '</td>' +
      '<td style="padding:5px 8px;white-space:nowrap">' + fu + '</td>' +
      '<td style="padding:5px 8px;white-space:nowrap">' + orig + '</td>' +
      '<td style="padding:5px 10px;text-align:center">' + lineGlyph(l.yang) + '</td>' +
      '<td style="padding:5px 8px;white-space:nowrap">' + marks + '</td>' +
      '<td style="padding:5px 8px;white-space:nowrap">' + trasf + '</td>' +
      '<td style="padding:5px 8px;text-align:right">' + (FZ ? fzCell(FZ.linee[i-1]) : '') + '</td>' +
      '<td style="padding:5px 8px;text-align:right;font-size:12px">' + (FZ && FZ.linee[i-1].hidden ? fzCell(FZ.linee[i-1].hidden) : '') + '</td>' +
      '</tr>';
  }
  var table = '<table class="lytable" style="border-collapse:collapse;margin-top:8px;font-size:14px">' +
    '<thead><tr style="opacity:.6;font-size:12px;text-align:left">' +
    '<th style="padding:2px 8px">Beast</th>' +
    '<th style="padding:2px 8px">Hidden</th>' +
    '<th style="padding:2px 8px">Original</th>' +
    '<th style="padding:2px 10px;text-align:center">Line</th>' +
    '<th style="padding:2px 8px">Shi/Ying · state</th>' +
    '<th style="padding:2px 8px">Transformed</th>' +
    '<th style="padding:2px 8px;text-align:right" title="Force model: month always; day/year on the focus; hour 20%; gathering +2; void −2; mobile gets the arrival">Force</th>' +
    '<th style="padding:2px 8px;text-align:right">Hidden force</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table>' +
    (FZ ? '<div class="trendmsgs" style="font-size:12px;opacity:.85">Force model — arrival ' + (FZ.arrivo ? '<b>' + FZ.arrivo.ramo + '</b> ' + fzCell(FZ.arrivo) : '(null movement)') +
      ' · gatherings: ' + (FZ.raduni.length ? FZ.raduni.map(function (g) { return '<b>' + g.r.join('') + '</b> ' + g.el + ' +2'; }).join(', ') : 'none') +
      ' · <span style="opacity:.7">click a score to see the breakdown</span></div>' : '') +
    '<div class="trendmsgs" style="font-size:12px;opacity:.6">Codes: G Officer · W Wealth · P Parents · B Siblings · C Children</div>';

  var termHtml = '';
  if (pbCtx && pbCtx.finalDir) {
    var stD2 = steliDiData(pbCtx.date, ly.yearBranch, ly.monthBranch, ly.dayStem || null, oraBranchSeme);
    var ctxT = { oraBranch: oraBranchSeme, emaDir: pbCtx.emaDir, corpoEl: pbCtx.corpoEl, date: pbCtx.date, capolineaEl: capolineaDelFlusso(chart),
                 yearStem: stD2.yearStem, monthStem: stD2.monthStem, hourStem: stD2.hourStem };
    termHtml = renderTermometro(ly, ctxT, pbCtx.finalDir);
  }

  lyp.innerHTML = head + emaLine + baziLine + spiritLine + hexBlock + palLine + mutLine + table + termHtml;
  lyp.style.display = 'block';
  wireTermometroToggles(cross, chart, row, lyp, pbCtx);
}

// ---- LY thermometer: list of rules + reinforcers, S9 verdict ----
var LY_TOGGLE_KEY = 'ly-via-toggles-v1';
function loadLyToggles() {
  try { return JSON.parse(localStorage.getItem(LY_TOGGLE_KEY)) || {}; } catch (e) { return {}; }
}
function saveLyToggles(t) {
  try { localStorage.setItem(LY_TOGGLE_KEY, JSON.stringify(t)); } catch (e) {}
}
var lyToggles = loadLyToggles();   // { ruleId: false } only for the ones switched OFF; absent = on

function renderTermometro(R, ctxT, pbFinalDir) {
  var LYM = window.XKDGLiuYao;
  var enabled = {}, enabledRaff = {};
  LYM.LY_VIE.forEach(function (v) { if (lyToggles[v.id] === false) enabled[v.id] = false; });
  LYM.LY_RAFFORZATIVI.forEach(function (v) { if (lyToggles[v.id] === false) enabledRaff[v.id] = false; });

  var comb = LYM.combinaS9(R, ctxT, pbFinalDir, enabled, enabledRaff, {});
  var s9Cls = comb.finale === 'LONG' ? 'long' : 'short';
  var emaSig9 = ctxT.emaDir === 'up' ? 'LONG' : ctxT.emaDir === 'down' ? 'SHORT' : null;
  var s9Follow = emaSig9 ? (comb.finale === emaSig9 ? 'FOLLOWS the trend' : 'does NOT follow the trend') : '';
  var lyFollow = (comb.ly && emaSig9) ? (comb.ly === emaSig9 ? 'follows' : 'does not follow') : null;
  var s9Badge = '<div class="trendmsgs" style="margin-top:10px">' +
    '<b>S9 verdict (PB + LY):</b> <span class="sig ' + s9Cls + '" style="display:inline-block">' + comb.finale + '</span>' +
    (s9Follow ? ' <b>' + s9Follow + '</b>' : '') +
    (comb.ly ? ' · LY says <b>' + comb.ly + '</b>' + (lyFollow ? ' (' + lyFollow + ')' : '') : ' · LY silent') +
    '<br><span style="opacity:.75">decided by: ' + comb.chi + '</span>' +
    (comb.why ? '<div style="margin-top:6px;padding:8px 10px;border-left:3px solid var(--gold,#e3b341);background:rgba(227,179,65,.06);font-size:13px">' +
      '<b>Reading (rule ' + comb.via.sezione + ' — ' + comb.via.nome + '):</b> ' + comb.why + '</div>' : '') +
    '</div>';

  var state = { opts: {} };
  var rows = LYM.LY_VIE.map(function (v, idx) {
    state.why = null;
    var dir = v.test(R, ctxT, state);
    var whyRow = dir && state.why ? '<div style="margin-top:4px"><b>On this card:</b> ' + state.why + '</div>' : '';
    var on = lyToggles[v.id] !== false;
    var isFiring = comb.via && comb.via.viaId === v.id;
    var chip = dir ? ('<span class="sig ' + (dir === 'LONG' ? 'long' : 'short') + '" style="padding:1px 8px;font-size:11px">' + dir + '</span>')
      : '<span style="opacity:.5;font-size:11px">silent</span>';
    return '<div class="viarow' + (isFiring ? ' viafiring' : '') + '" style="display:flex;align-items:center;gap:8px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.06);cursor:pointer">' +
      '<input type="checkbox" class="via-toggle" data-via="' + v.id + '" ' + (on ? 'checked' : '') + '>' +
      '<span style="min-width:28px;opacity:.6;font-size:12px">' + (idx + 1) + '</span>' +
      '<span style="min-width:70px;opacity:.7;font-size:12px">' + v.sezione + '</span>' +
      '<span style="flex:1;font-size:13px">' + v.nome + (isFiring ? ' <b style="color:var(--gold,#e3b341)">← decided</b>' : '') + '</span>' +
      chip +
      '</div>' +
      '<div class="viadoc" style="display:none;font-size:12px;opacity:.8;padding:4px 0 8px 26px">' + v.dottrina + whyRow + '</div>';
  }).join('');

  var raffRows = LYM.LY_RAFFORZATIVI.map(function (v) {
    var dir = v.test(R, ctxT, state);
    var on = lyToggles[v.id] !== false;
    return '<div class="viarow" style="display:flex;align-items:center;gap:8px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.06);cursor:pointer">' +
      '<input type="checkbox" class="via-toggle" data-via="' + v.id + '" ' + (on ? 'checked' : '') + '>' +
      '<span style="flex:1;font-size:13px">' + v.nome + '</span>' +
      (dir ? '<span class="sig long" style="padding:1px 8px;font-size:11px">active</span>' : '<span style="opacity:.5;font-size:11px">not applicable</span>') +
      '</div>' +
      '<div class="viadoc" style="display:none;font-size:12px;opacity:.8;padding:4px 0 8px 26px">' + v.dottrina + '</div>';
  }).join('');

  return s9Badge +
    '<details open style="margin-top:8px"><summary style="cursor:pointer;opacity:.85">LY thermometer — ' + LYM.LY_VIE.length + ' rules + ' + LYM.LY_RAFFORZATIVI.length + ' reinforcers (evaluated top-down, first answer wins · click a row for the doctrine)</summary>' +
    '<div style="margin-top:6px">' + rows + '<div style="margin-top:6px;font-weight:600;opacity:.7;font-size:12px">Reinforcers (act only in a PB ↔ LY conflict)</div>' + raffRows + '</div>' +
    '</details>';
}

function wireTermometroToggles(cross, chart, row, lyp, pbCtx) {
  lyp.querySelectorAll('.via-toggle').forEach(function (cb) {
    cb.addEventListener('change', function () {
      if (cb.checked) delete lyToggles[cb.dataset.via]; else lyToggles[cb.dataset.via] = false;
      saveLyToggles(lyToggles);
      renderLiuYao(cross, chart, row, lyp, pbCtx);
    });
  });
  lyp.querySelectorAll('.fzscore').forEach(function (sc) {
    sc.addEventListener('click', function (e) { e.stopPropagation(); var d = sc.nextElementSibling; if (d) d.style.display = d.style.display === 'none' ? 'block' : 'none'; });
  });
  lyp.querySelectorAll('.viarow').forEach(function (row2) {
    row2.addEventListener('click', function (e) {
      if (e.target.classList.contains('via-toggle')) return;
      var doc = row2.nextElementSibling;
      if (doc && doc.classList.contains('viadoc')) doc.style.display = (doc.style.display === 'none') ? 'block' : 'none';
    });
  });
}

// col toggle PB la carta DLR (pilastri, tre trasmissioni, lezioni, griglia) sparisce del tutto
function applyDlrVisibility() {
  var b = $('dlrblock'); if (!b) return;
  var forexOn = !!(forexData && $('forexbar') && $('forexbar').style.display !== 'none');
  b.style.display = (METHOD === 'pb' && forexOn) ? 'none' : '';
}

function renderTrend(cross, chart, dArr, row) {
  lastTrendArgs = { cross: cross, chart: chart, dArr: dArr, row: row };
  applyDlrVisibility();
  var p = $('trendpanel');

  // ---- Plum Blossom branch: same seed, same EMA, same filters; only the verdict differs ----
  if (METHOD === 'pb') { renderTrendPB(cross, chart, dArr, row, p); return; }

  // Da Liu Ren: il pannello Liu Yao (correttivo del PB) resta nascosto
  var lyp = $('lypanel'); if (lyp) lyp.style.display = 'none';

  // ---- MOTORE DLR, nuova edizione (S34-S35): lettura direzionale, host = prima valuta ----
  // Stessa carta e stessi attori del backtest (pb_stress.js, MOTOREDLR=1): stelo e ramo del
  // giorno, palazzo dello host (寄宮), R1..R4, vuoti (旬空) del pilastro del giorno, generale
  // del mese, ramo dell'ora, metodo, tre messaggi. Il verdetto NON dipende dall'EMA.
  if (!window.XKDGMotoreDLR || !chart.transmission || !chart.transmission.three || !chart.fourLessons) { p.style.display = 'none'; return; }
  var MD = window.XKDGMotoreDLR, L = chart.fourLessons, t3 = chart.transmission.three;
  var carta = {
    steloGiorno: chart.dayStem, ramoGiorno: chart.dayBranch,
    palazzoHost: (L[0].bottom && L[0].bottom.branch) || L[0].bottom,
    R1: L[0].top.branch, R2: L[1].top.branch, R3: L[2].top.branch, R4: L[3].top.branch,
    metodo: chart.transmission.method, vuoti: chart.hourVoid || [],
    generaleMese: chart.monthGeneral && chart.monthGeneral.branch, oraRamo: chart.hourBranch,
    treMessaggi: t3,
    spiritoR1: (L[0].top.general && L[0].top.general.cn) || null
  };
  var lettura = MD.leggi(carta);

  var fragile = !!(row && row.seedFragile === true);
  var guardKnown = !!(row && ('seedEdgePips' in row));
  var signal = fragile ? 'NO TRADE' : (lettura.dir || 'TACE');
  var signalBadge = signal === 'NO TRADE' ? '<span class="sig notrade">NO TRADE</span>'
    : signal === 'TACE' ? '<span class="sig na">TACE · il motore non legge</span>'
    : '<span class="sig ' + signal.toLowerCase() + '">' + signal + '</span>';
  var head = '<div class="trendhead"><span>' + cross + ' — Motore DLR</span>' + signalBadge + '</div>';

  var seedLine = '';
  if (row && row.price != null) {
    var rem = ((row.seed % 12) + 12) % 12; rem = (rem === 0 ? 12 : rem);
    seedLine = '<div class="trendmsgs seedline">00:00 GMT open <b class="px">' + row.price + '</b>' +
      ' → ' + row.digits + ' mod 12 = ' + rem + ' → 地支 <b>' + row.branch + '</b>';
    if (guardKnown && row.seedEdgePips != null) {
      seedLine += ' · bordo del seme a <b class="px">' + row.seedEdgePips + ' pip</b>' +
        (fragile ? ' — <b class="down">sotto la guardia di 3 pip: un altro feed darebbe un altro ramo → NO TRADE</b>' : '');
    }
    seedLine += '</div>';
  }
  var dir = row && row.direction ? row.direction : null;
  var emaLine = '<div class="trendmsgs">EMA(12): <b class="' + (dir || '') + '">' + (dir === 'up' ? '↑ up' : dir === 'down' ? '↓ down' : 'n/a') +
    '</b> <span class="hint">solo per informazione: il motore DLR non la usa</span></div>';

  var V = carta.vuoti || [];
  function ramo(b) { return b ? ('<b>' + b + '</b> ' + MD.parentela(carta.steloGiorno, b) + (V.indexOf(b) >= 0 ? ' <span class="hint">vuoto</span>' : '')) : '—'; }
  var attori = '<div class="trendmsgs">giorno <b>' + carta.steloGiorno + carta.ramoGiorno + '</b> · palazzo dello host <b>' + carta.palazzoHost + '</b>' +
    ' · generale del mese <b>' + (carta.generaleMese || '—') + '</b> · ora <b>' + carta.oraRamo + '</b>' +
    ' · vuoti <b>' + (V.join(' ') || '—') + '</b> · metodo ' + (carta.metodo || '—') + '</div>' +
    '<div class="trendmsgs">R1 ' + ramo(carta.R1) + ' · R2 ' + ramo(carta.R2) + ' · R3 ' + ramo(carta.R3) + ' · R4 ' + ramo(carta.R4) + '</div>' +
    '<div class="trendmsgs">M1 ' + ramo(t3.chu) + ' → M2 ' + ramo(t3.zhong) + ' → M3 ' + ramo(t3.mo) + '</div>';
  var verdetto = lettura.dir
    ? '<div class="trendmsgs">via: <b>' + lettura.via + '</b>' + (lettura.nutrimento != null ? ' <span class="hint">nutrimento ' + lettura.nutrimento + '/2</span>' : '') +
      '<br>' + lettura.perche + '</div>'
    : '<div class="trendmsgs"><b>tace</b> — ' + lettura.perche + '</div>';
  p.innerHTML = head + seedLine + emaLine + attori + verdetto;
  p.style.display = 'block';
}

/* ---------- wiring ---------- */
window.addEventListener('DOMContentLoaded', function () {
  setNow();                                   // default to the current moment
  $('build').addEventListener('click', build);
  $('forex').addEventListener('click', loadForex);
  if ($('reportall')) $('reportall').addEventListener('click', reportGiornaliero);
  if ($('report3')) $('report3').addEventListener('click', reportTreSistemi);
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
    applyDlrVisibility();
    if (lastTrendArgs) renderTrend(lastTrendArgs.cross, lastTrendArgs.chart, lastTrendArgs.dArr, lastTrendArgs.row);
  }
  $('method-dlr').addEventListener('click', function () { setMethod('dlr'); });
  $('method-pb').addEventListener('click', function () { setMethod('pb'); });
  applyDlrVisibility();
  // Plum Blossom is the default: open straight on the forex feed (00:00 GMT seeds), PB panel first.
  // "Build chart" / "Now" / "00:00 GMT" still switch to manual mode with the DLR chart.
  if (METHOD === 'pb') loadForex(); else build();
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
