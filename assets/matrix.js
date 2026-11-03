/* Metal AM Tool Coverage Matrix
   Data comes from data/tools.js (window.TOOLS_DATA). Filters are mirrored in the URL hash,
   so a filtered view can be bookmarked or shared, e.g. index.html#cols=NRE,QA_Qual&min=partial (min = yes | pquant | partial) */
(function () {
  'use strict';
  var DATA = window.TOOLS_DATA;
  var tb = document.getElementById('tb');
  if (!DATA || !DATA.tools) {
    tb.innerHTML = '<tr><td colspan="14" class="empty">The tool data did not load. Check that data/tools.js sits next to this page.</td></tr>';
    return;
  }
  var tools = DATA.tools;
  var COLS = [
    { k: 'NRE', def: 'One-time cost to prepare design files and set run parameters: reverse engineering, redesign, build prep and parameter development.', hm: 'NRE', label: 'NRE', full: 'Non-recurring engineering', card: 'Non-recurring engineering', short: 'NRE', grp: 'Cost' },
    { k: 'Production', def: 'Per-part cost from geometry, material and machine.', hm: 'Production', label: 'Prod', full: 'Production cost', card: 'Production cost', short: 'production cost', grp: 'Cost' },
    { k: 'QA_Qual', def: 'Material, process and part qualification; first-article testing; airworthiness or technical-authority approval.', hm: 'QA qual', label: 'QA qual', full: 'QA: qualification & certification', card: 'QA qualification', short: 'QA qualification', grp: 'Cost' },
    { k: 'QA_Insp', def: 'Per-part inspection and testing: NDI or CT, witness coupons and mechanical tests.', hm: 'QA insp', label: 'QA insp', full: 'QA: per-part inspection', card: 'QA per-part inspection', short: 'QA inspection', grp: 'Cost' },
    { k: 'Storage', def: 'Inventory reduction because spares can be printed on demand.', hm: 'Storage', label: 'Storage', full: 'Storage / inventory', card: 'Storage / inventory', short: 'storage', grp: 'Benefit' },
    { k: 'Shared_Capital', def: 'Machine purchase and maintenance cost spread across many parts or users.', hm: 'Sh capital', label: 'Sh cap $', full: 'Shared capital cost', card: 'Shared capital cost', short: 'shared capital', grp: 'Benefit' },
    { k: 'Shared_Capacity', def: 'Print capacity pooled across sites or units, which changes lead time.', hm: 'Sh capacity', label: 'Sh capac', full: 'Shared capacity', card: 'Shared capacity', short: 'shared capacity', grp: 'Benefit' },
    { k: 'Speed', def: 'Dollarized or quantified value of having parts when needed instead of waiting weeks to months.', hm: 'Speed', label: 'Speed', full: 'Value of speed', card: 'Value of speed', short: 'speed', grp: 'Benefit' }
  ];
  var COLKEYS = COLS.map(function (c) { return c.k; });
  var COSTK = COLS.filter(function (c) { return c.grp === 'Cost'; }).map(function (c) { return c.k; });
  var BENK = COLS.filter(function (c) { return c.grp === 'Benefit'; }).map(function (c) { return c.k; });
  // corner box: does a tool cover at least one cost and/or at least one benefit (under the current "rated" rule)
  var CB = {
    both: { label: 'Both', text: 'at least one cost and at least one benefit' },
    cost: { label: 'Cost only', text: 'at least one cost but no benefit' },
    benefit: { label: 'Benefit only', text: 'at least one benefit but no cost' },
    none: { label: 'Neither', text: 'no cost and no benefit' }
  };
  function cbOf(t) {
    var c = COSTK.some(function (k) { return covered(t, k); }), b = BENK.some(function (k) { return covered(t, k); });
    return c && b ? 'both' : c ? 'cost' : b ? 'benefit' : 'none';
  }
  var RV = { Yes: 1, Partial: 0.5, No: 0, Unknown: 0 };
  var SORTV = { Yes: 1, Partial: 0.5, No: 0, Unknown: -0.25 };
  var CONF = { High: 3, Medium: 2, Low: 1 };
  function isPQ(sc) { return sc.rating === 'Partial' && sc.partial_type !== 'qualitative'; }
  function rLabel(sc) { return sc.rating === 'Partial' ? 'Partial (' + (sc.partial_type === 'qualitative' ? 'qualitative' : 'quantified') + ')' : sc.rating; }
  function dotCls(sc) { return 'dot ' + sc.rating + (sc.rating === 'Partial' ? (sc.partial_type === 'qualitative' ? ' pl' : ' pq') : ''); }

  tools.forEach(function (t, i) {
    t._i = i;
    t._score = COLS.reduce(function (s, c) { return s + RV[t.scores[c.k].rating]; }, 0);
    var ym = String(t.year).match(/\d{4}/);
    t._yr = ym ? parseInt(ym[0], 10) : 0;
    t._yrShort = ym ? ym[0] : (/unknown/i.test(String(t.year)) ? 'Unknown' : '—');
    t._hay = (t.name + ' ' + t.developer + ' ' + t.context + ' ' + t.description + ' ' + t.processes).toLowerCase();
  });

  var state = { q: '', type: '', level: '', sector: '', conf: '', link: '', cols: [], cb: '', match: 'all', min: 'yes', sort: 'score', dir: -1, open: {} };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function uniq(arr) { return Array.from(new Set(arr)).sort(); }

  document.getElementById('lead').textContent = DATA.lead;
  document.getElementById('foot').textContent = DATA.foot;

  // ---- URL hash <-> state
  var FIELDS = ['q', 'type', 'level', 'sector', 'conf', 'link', 'cb', 'match', 'min', 'sort', 'dir'];
  function readHash() {
    // start from the defaults so a field missing from the address is reset, not left over from the previous view
    state.q = state.type = state.level = state.sector = state.conf = state.link = state.cb = '';
    state.match = 'all'; state.min = 'yes'; state.sort = 'score'; state.dir = -1; state.cols = [];
    var h = location.hash.replace(/^#/, '');
    if (!h) return;
    var p = new URLSearchParams(h);
    FIELDS.forEach(function (f) { if (p.has(f)) state[f] = p.get(f); });
    state.dir = state.dir === '1' || state.dir === 1 ? 1 : -1;
    if (state.type !== 'Tool' && state.type !== 'Framework') state.type = '';
    if (state.match !== 'any') state.match = 'all';
    if (state.min !== 'partial' && state.min !== 'pquant') state.min = 'yes';
    if (!CB[state.cb]) state.cb = '';
    state.cols = (p.get('cols') || '').split(',').filter(function (k) { return COLKEYS.indexOf(k) >= 0; });
  }
  function writeHash() {
    var p = new URLSearchParams();
    ['q', 'type', 'level', 'sector', 'conf', 'link', 'cb'].forEach(function (f) { if (state[f]) p.set(f, state[f]); });
    if (state.cols.length) p.set('cols', state.cols.join(','));
    if (state.match !== 'all') p.set('match', state.match);
    if (state.min !== 'yes') p.set('min', state.min);
    if (state.sort !== 'score' || state.dir !== -1) { p.set('sort', state.sort); p.set('dir', String(state.dir)); }
    var s = p.toString();
    try { history.replaceState(null, '', s ? '#' + s : location.pathname + location.search); } catch (e) {}
  }

  function fillSelect(id, label, vals) {
    var el = document.getElementById(id);
    el.innerHTML = '<option value="">All ' + esc(label) + '</option>' + vals.map(function (v) { return '<option>' + esc(v) + '</option>'; }).join('');
  }
  document.getElementById('ftype').innerHTML = '<option value="">All</option><option value="Tool">Tool</option><option value="Framework">Frameworks</option>';
  fillSelect('flevel', 'levels', uniq([].concat.apply([], tools.map(function (t) { return t.decision_levels; }))));
  fillSelect('fsector', 'settings', uniq(tools.map(function (t) { return t.sector; })));
  fillSelect('fconf', 'levels', ['High', 'Medium', 'Low']);

  // ---- table header
  var hdr = document.getElementById('hdr');
  var heads = [
    { k: 'name', label: 'Tool' }, { k: 'type', label: 'Type' }, { k: 'level', label: 'Decision level' }, { k: 'year', label: 'Year' }
  ].concat(COLS.map(function (c) { return { k: c.k, label: c.label, rc: true, title: c.full }; }))
   .concat([{ k: 'score', label: 'Score' }, { k: 'conf', label: 'Conf.' }]);
  hdr.innerHTML = heads.map(function (h) {
    return '<th class="' + (h.rc ? 'rc' : '') + '" data-col="' + h.k + '"><button type="button" data-k="' + h.k + '"' + (h.title ? ' title="Sort by ' + esc(h.title) + '"' : '') + '>' + esc(h.label) + '</button></th>';
  }).join('');
  hdr.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var k = b.getAttribute('data-k');
    if (state.sort === k) state.dir = -state.dir; else { state.sort = k; state.dir = (k === 'name' || k === 'type' || k === 'level') ? 1 : -1; }
    render();
  });

  // ---- filtering
  function covered(t, k) {
    var sc = t.scores[k], r = sc.rating;
    return r === 'Yes' || (state.min === 'partial' && r === 'Partial') || (state.min === 'pquant' && isPQ(sc));
  }
  function baseFiltered() {
    var q = state.q.trim().toLowerCase();
    return tools.filter(function (t) {
      if (q && t._hay.indexOf(q) < 0) return false;
      if (state.type && t.type !== state.type) return false;
      if (state.level && t.decision_levels.indexOf(state.level) < 0) return false;
      if (state.sector && t.sector !== state.sector) return false;
      if (state.conf && t.confidence !== state.conf) return false;
      if (state.link === 'yes' && !t.tool_link) return false;
      if (state.link === 'no' && t.tool_link) return false;
      return true;
    });
  }
  function colFiltered(list) {
    if (!state.cols.length && !state.cb) return list;
    return list.filter(function (t) {
      if (state.cb && cbOf(t) !== state.cb) return false;
      if (!state.cols.length) return true;
      return state.match === 'all'
        ? state.cols.every(function (k) { return covered(t, k); })
        : state.cols.some(function (k) { return covered(t, k); });
    });
  }

  function sortKey(t) {
    var k = state.sort;
    if (k === 'name') return t.name.toLowerCase();
    if (k === 'type') return t.type;
    if (k === 'level') return t.decision_levels.join(',');
    if (k === 'year') return t._yr;
    if (k === 'score') return t._score;
    if (k === 'conf') return CONF[t.confidence] || 0;
    return SORTV[t.scores[k].rating];
  }

  document.querySelectorAll('[data-match]').forEach(function (b) {
    b.addEventListener('click', function () { state.match = b.getAttribute('data-match'); render(); });
  });
  document.querySelectorAll('[data-min]').forEach(function (b) {
    b.addEventListener('click', function () { state.min = b.getAttribute('data-min'); render(); });
  });
  document.getElementById('clearcols').addEventListener('click', function () { state.cols = []; state.cb = ''; render(); });

  // ---- coverage matrix (also the column filter): pair counts in an upper triangle, plus one row per column with its rating bar.
  //      Counts use every filter except the column selection, so they stay put while columns are picked.
  var hm = document.getElementById('hm'), tip = document.getElementById('hm-tip'), box = document.getElementById('cooc-box');
  var RAMP_LIGHT = ['#dce9f4', '#b4cfe6', '#88b2d5', '#5d93c1', '#3874a8', '#1d5c8c', '#123f63'];
  var RAMP_DARK = ['#1d3346', '#234a68', '#2b6189', '#3a7aa8', '#5594c3', '#79b0dc', '#a9cff0'];
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function isDark() { return !!(mq && mq.matches); }
  function rgb(h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); }
  function hex(c) { return '#' + c.map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join(''); }
  function rampAt(t) {
    var r = isDark() ? RAMP_DARK : RAMP_LIGHT, x = Math.max(0, Math.min(1, t)) * (r.length - 1), i = Math.floor(x);
    if (i >= r.length - 1) return r[r.length - 1];
    var a = rgb(r[i]), b = rgb(r[i + 1]), f = x - i;
    return hex(a.map(function (v, j) { return v + (b[j] - v) * f; }));
  }
  function lum(h) { return rgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce(function (s, v, j) { return s + v * [0.2126, 0.7152, 0.0722][j]; }, 0); }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function inkOn(bg) { var a = isDark() ? '#e6ecf1' : '#17202a', b = isDark() ? '#0b1620' : '#ffffff'; return contrast(bg, a) >= contrast(bg, b) ? a : b; }
  function pct(c, n) { if (!n) return '0%'; var p = c / n * 100; return (p > 0 && p < 10 ? p.toFixed(1) : String(Math.round(p))) + '%'; }
  function ruleText() { return state.min === 'partial' ? 'Yes or any Partial' : state.min === 'pquant' ? 'Yes or quantified Partial' : 'Yes'; }
  var heat = { M: null, n: 0, cnt: null };

  function renderHeat(base) {
    var nAll = base.length, sub = state.cb ? base.filter(function (t) { return cbOf(t) === state.cb; }) : base;
    var n = sub.length, K = COLKEYS.length, M = [], i, j;
    // how the denominator reads in labels: "144 shown" or "31 in Both"
    var inBox = state.cb ? 'in \u201c' + CB[state.cb].label + '\u201d' : 'shown';
    for (i = 0; i < K; i++) { M.push([]); for (j = 0; j < K; j++) M[i].push(0); }
    // every rating per column (for the bars) plus pair counts under the current "rated" rule (for the cells)
    var cnt = COLKEYS.map(function () { return { y: 0, pq: 0, pl: 0, u: 0, no: 0 }; });
    sub.forEach(function (t) {
      var cv = COLKEYS.map(function (k, ci) {
        var sc = t.scores[k], r = sc.rating, c = cnt[ci];
        if (r === 'Yes') c.y++; else if (r === 'Partial') { if (isPQ(sc)) c.pq++; else c.pl++; } else if (r === 'Unknown') c.u++; else c.no++;
        return covered(t, k);
      });
      for (i = 0; i < K; i++) if (cv[i]) for (j = 0; j < K; j++) if (cv[j]) M[i][j]++;
    });
    var maxOff = 0;
    for (i = 0; i < K; i++) for (j = i + 1; j < K; j++) if (M[i][j] > maxOff) maxOff = M[i][j];
    var cbn = { both: 0, cost: 0, benefit: 0, none: 0 };
    base.forEach(function (t) { cbn[cbOf(t)]++; });
    heat.M = M; heat.n = n; heat.nAll = nAll; heat.inBox = inBox; heat.cnt = cnt; heat.cbn = cbn;
    document.getElementById('cooc-sub').textContent = 'Select rows to filter by columns, a cell to filter by a pair, or a corner box to filter by cost and benefit coverage. Cells count the ' +
      (state.cb ? n + ' tool' + (n === 1 ? '' : 's') + ' ' + inBox + ' (of ' + nAll + ' shown)' : nAll + ' shown tool' + (nAll === 1 ? '' : 's')) +
      ' rated ' + ruleText() + ' on both columns, shaded by share; bars show every rating for a column.' + (state.cb ? ' Select the corner box again to see all shown tools.' : '');
    var stops = []; for (i = 0; i <= 6; i++) stops.push(rampAt(i / 6));
    document.getElementById('hm-key').innerHTML =
      '<div class="kgrp"><span class="kt">Cells</span><span><i class="kz"></i>0 tools</span><span><i class="kg" style="background:linear-gradient(90deg, ' + stops.join(', ') + ')"></i><b>up to ' + pct(maxOff, n) + '</b></span><span>' + (state.cb ? 'share of tools ' + inBox : 'share of shown tools') + '</span></div>' +
      '<div class="kgrp"><span class="kt">Bars</span><span><i class="ks y"></i>Yes</span><span><i class="ks p"></i>Partial, quantified</span><span><i class="ks pl"></i>Partial, qualitative</span><span><i class="ks u"></i>Unknown</span><span><i class="ks n"></i>No</span></div>';
    hideTip();
    if (!nAll) { hm.innerHTML = '<tbody><tr><td class="hm-empty">No tools match these filters.</td></tr></tbody>'; return; }

    var all = state.match === 'all';
    function inSel(k) { return state.cols.indexOf(k) >= 0; }
    function miniHtml() {
      return '<div class="mm"><div class="mm-t" aria-hidden="true">Any cost × any benefit</div><div class="mm-g">' +
        ['both', 'cost', 'benefit', 'none'].map(function (k) {
          var v = cbn[k], on = state.cb === k;
          var lbl = CB[k].label + ': ' + v + ' of ' + nAll + ' shown tools have ' + CB[k].text + ' rated ' + ruleText() + ' (' + pct(v, nAll) + ').' + (on ? ' Selected; the matrix shows only these tools. Select again to clear.' : ' Select to show these tools in the matrix and table.');
          return '<button type="button" class="mc mc-' + k + (on ? ' on' : '') + '" data-cb="' + k + '" aria-pressed="' + on + '" aria-label="' + esc(lbl) + '"><b>' + v + '</b><span>' + CB[k].label + '</span></button>';
        }).join('') + '</div></div>';
    }
    var XC = COLS.slice(1);            // the triangle has no diagonal, so the first column never has a cell
    var B0 = 4;                        // first benefit column, for the cost/benefit gap
    var h = '<caption class="sr-only">Cost and benefit filter. Cells: number of shown tools rated ' + esc(ruleText()) + ' on both columns, for every pair of columns. Rows: each column with its rating counts. Cells and rows are buttons that filter the table.</caption>' +
      '<colgroup>' + XC.map(function () { return '<col class="dc">'; }).join('') + '<col class="g"><col class="rbc"></colgroup>' +
      '<thead><tr><th class="gh" colspan="3" scope="colgroup">Costs</th><th class="gh b0" colspan="4" scope="colgroup">Benefits</th><td colspan="2"></td></tr>' +
      '<tr>' + XC.map(function (c) { var ci = COLKEYS.indexOf(c.k); return '<th class="ch' + (ci === B0 ? ' b0' : '') + (inSel(c.k) ? ' sel' : '') + '" scope="col" data-ci="' + ci + '" title="' + esc(c.full) + '"><span>' + esc(c.hm) + '</span></th>'; }).join('') +
      '<td></td><th class="bh" scope="col">' + (state.cb ? 'Ratings of the ' + n + ' tool' + (n === 1 ? '' : 's') + ' ' + esc(inBox) : 'Ratings of the shown tools') + '</th></tr></thead><tbody>';
    COLS.forEach(function (r, ri) {
      h += '<tr' + (ri === B0 ? ' class="b0"' : '') + '>';
      XC.forEach(function (c) {
        var ci = COLKEYS.indexOf(c.k), gap = ci === B0 ? ' class="b0"' : '';
        if (ci <= ri) {
          if (ri >= B0 && ci <= B0) { if (ri === B0 && ci === 1) h += '<td class="mini" colspan="4" rowspan="4">' + miniHtml() + '</td>'; return; }
          h += '<td' + gap + '></td>'; return;
        }
        var v = M[ri][ci], cls = 'hc', st = '';
        if (!v) cls += ' z';
        else { var bg = rampAt(maxOff ? v / maxOff : 0); st = ' style="background:' + bg + ';color:' + inkOn(bg) + '"'; }
        var exact = all && state.cols.length === 2 && inSel(r.k) && inSel(c.k);
        if (all && state.cols.length >= 2 && inSel(r.k) && inSel(c.k)) cls += ' on';
        var lbl = r.full + ' and ' + c.full + ': ' + v + ' of ' + n + ' tools ' + inBox + ' rated ' + ruleText() + ' on both (' + pct(v, n) + ').' + (exact ? ' Selected; select again to clear.' : ' Select to show these tools.');
        h += '<td' + gap + '><button type="button" class="' + cls + '"' + st + ' data-r="' + ri + '" data-c="' + ci + '" aria-pressed="' + exact + '" aria-label="' + esc(lbl) + '">' + v + '</button></td>';
      });
      if (ri === 0 || ri === B0) h += '<th class="gv" rowspan="4" scope="rowgroup"><span>' + (ri === 0 ? 'Costs' : 'Benefits') + '</span></th>';
      var q = cnt[ri], on = inSel(r.k), f = function (x) { return n ? (x / n * 100).toFixed(1) : 0; };
      var blbl = r.full + '. ' + r.def + ' ' + q.y + ' yes, ' + q.pq + ' partial quantified, ' + q.pl + ' partial qualitative, ' + q.u + ' unknown, ' + q.no + ' no. ' + (on ? 'Selected; select to remove.' : 'Select to filter by this column.');
      h += '<td><button type="button" class="rb' + (on ? ' on' : '') + '" data-r="' + ri + '" aria-pressed="' + on + '" aria-label="' + esc(blbl) + '">' +
        '<span class="box" aria-hidden="true">✓</span><span class="rl" title="' + esc(r.full) + '">' + esc(r.hm) + '</span>' +
        '<span class="rv" aria-hidden="true"><span class="bar"><i class="y" style="width:' + f(q.y) + '%"></i><i class="p" style="width:' + f(q.pq) + '%"></i><i class="pl" style="width:' + f(q.pl) + '%"></i><i class="u" style="width:' + f(q.u) + '%"></i></span>' +
        '<span class="rn">' + q.y + ' yes · ' + q.u + ' unknown · ' + q.no + ' no</span><span class="rn">Partial: ' + q.pq + ' quantified · ' + q.pl + ' qualitative</span></span></button></td></tr>';
    });
    hm.innerHTML = h + '</tbody>';
  }

  function hideTip() { tip.hidden = true; hm.querySelectorAll('.hl').forEach(function (e) { e.classList.remove('hl'); }); }
  function line(text, bold) { var e = document.createElement(bold ? 'b' : 'span'); if (!bold) e.className = 'k'; e.textContent = text; tip.appendChild(e); }
  function showTip(btn) {
    var n = heat.n;
    if (btn.classList.contains('mc')) {
      hm.querySelectorAll('.hl').forEach(function (e) { e.classList.remove('hl'); });
      tip.textContent = '';
      var key = btn.getAttribute('data-cb'), v0 = heat.cbn[key];
      line(v0 + ' tool' + (v0 === 1 ? '' : 's'), true);
      tip.appendChild(document.createTextNode(' · ' + pct(v0, heat.nAll) + ' of ' + heat.nAll + ' shown'));
      line(CB[key].label + ': ' + CB[key].text + ' rated ' + ruleText());
      line(btn.classList.contains('on') ? 'Selected · the matrix shows only these tools · select again to clear' : 'Select to show only these tools in the matrix and table');
      tip.hidden = false;
      var mb = btn.getBoundingClientRect(), mx = box.getBoundingClientRect();
      tip.style.left = Math.max(0, Math.min(mx.width - tip.offsetWidth, mb.left - mx.left + mb.width / 2 - tip.offsetWidth / 2)) + 'px';
      tip.style.top = (mb.top - mx.top - tip.offsetHeight - 8) + 'px';
      return;
    }
    var ri = +btn.getAttribute('data-r'), isRow = btn.classList.contains('rb');
    hm.querySelectorAll('.hl').forEach(function (e) { e.classList.remove('hl'); });
    tip.textContent = '';
    if (isRow) {
      var q = heat.cnt[ri];
      line(COLS[ri].full, true);
      line(COLS[ri].def);
      var shown = [].slice.call(btn.querySelectorAll('.rn')).every(function (e) { return e.offsetParent && e.scrollWidth <= e.clientWidth + 1; });
      if (!shown) line(q.y + ' Yes · ' + q.pq + ' Partial, quantified · ' + q.pl + ' Partial, qualitative · ' + q.u + ' Unknown · ' + q.no + ' No, of ' + n + ' ' + heat.inBox);
      line(btn.classList.contains('on') ? 'Selected · select again to remove' : 'Select to filter by this column');
    } else {
      var ci = +btn.getAttribute('data-c'), v = heat.M[ri][ci];
      [hm.querySelector('.rb[data-r="' + ri + '"]'), hm.querySelector('.ch[data-ci="' + ci + '"]')].forEach(function (e) { if (e) e.classList.add('hl'); });
      line(v + ' tool' + (v === 1 ? '' : 's'), true);
      tip.appendChild(document.createTextNode(' · ' + pct(v, n) + ' of ' + n + ' ' + heat.inBox));
      line(COLS[ri].full + ' + ' + COLS[ci].full + ', rated ' + ruleText() + ' on both');
      line(btn.getAttribute('aria-pressed') === 'true' ? 'Selected · select again to clear' : 'Select to list them');
    }
    tip.hidden = false;
    var br = btn.getBoundingClientRect(), bx = box.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
    var left = isRow ? br.left - bx.left + 20 : br.left - bx.left + br.width / 2 - tw / 2, top = br.top - bx.top - th - 8;
    if (top < -40) top = br.bottom - bx.top + 8;
    tip.style.left = Math.max(0, Math.min(bx.width - tw, left)) + 'px';
    tip.style.top = top + 'px';
  }
  hm.addEventListener('pointerover', function (e) { var b = e.target.closest('.hc, .rb, .mc'); if (b) showTip(b); });
  hm.addEventListener('pointerleave', hideTip);
  hm.addEventListener('focusin', function (e) { var b = e.target.closest('.hc, .rb, .mc'); if (b) showTip(b); });
  hm.addEventListener('focusout', function (e) { if (!hm.contains(e.relatedTarget)) hideTip(); });
  hm.addEventListener('click', function (e) {
    var b = e.target.closest('.hc, .rb, .mc'); if (!b) return;
    if (b.classList.contains('mc')) {
      var key = b.getAttribute('data-cb');
      state.cb = state.cb === key ? '' : key;
      render();
      var back = hm.querySelector('.mc[data-cb="' + key + '"]'); if (back) back.focus();
      return;
    }
    var ri = +b.getAttribute('data-r'), sel;
    if (b.classList.contains('rb')) {
      // a row toggles its column, like the old column cards
      var k = COLKEYS[ri], at = state.cols.indexOf(k);
      if (at >= 0) state.cols.splice(at, 1); else state.cols.push(k);
      state.cols.sort(function (a, b2) { return COLKEYS.indexOf(a) - COLKEYS.indexOf(b2); });
      sel = '.rb[data-r="' + ri + '"]';
    } else {
      // a cell selects exactly that pair, or clears it if it is already the selection
      var ci = +b.getAttribute('data-c');
      state.cols = b.getAttribute('aria-pressed') === 'true' ? [] : [COLKEYS[ri], COLKEYS[ci]];
      state.match = 'all';
      sel = '.hc[data-r="' + ri + '"][data-c="' + ci + '"]';
    }
    render();
    var again = hm.querySelector(sel); if (again) again.focus();
  });
  if (mq) { var onScheme = function () { render(); }; if (mq.addEventListener) mq.addEventListener('change', onScheme); else if (mq.addListener) mq.addListener(onScheme); }

  // ---- rows
  function confHtml(c) { var n = CONF[c] || 0; return '<span class="conf">' + [1, 2, 3].map(function (i) { return '<i class="' + (i <= n ? 'on' : '') + '"></i>'; }).join('') + ' ' + esc(c) + '</span>'; }

  function detailHtml(t) {
    var notes = COLS.map(function (c) {
      var s = t.scores[c.k];
      return '<li><i class="' + dotCls(s) + '" aria-hidden="true"></i><span class="c">' + esc(c.full) + '</span><span>' + esc(rLabel(s)) + '. ' + esc(s.note) + '</span></li>';
    }).join('');
    var tl = t.tool_link;
    var full = tl ? (tl.label || 'Open') : '';
    var short = full.split(/ \(|;|,/)[0];
    var head = tl
      ? '<li class="toolsrc"><a href="' + esc(tl.url) + '" target="_blank" rel="noopener">Tool link: ' + esc(short) + ' ↗</a>' +
        (short !== full ? '<small>' + esc(full) + '</small>' : '') +
        (tl.verified === false ? '<small>Not opened during review because the site blocks automated access; the address comes from an official record.</small>' : '') + '</li>'
      : '<li class="nolink">' + esc(t.tool_link_note || 'No public link to the tool found.') + '</li>';
    var srcs = head + t.sources.filter(function (s) { return !tl || s.url !== tl.url; }).map(function (s) { return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.title || s.url) + '</a></li>'; }).join('');
    var ev = (t.earlier_versions && t.earlier_versions.length)
      ? '<p class="evh">Earlier versions (folded into this entry)</p><ul class="ev">' + t.earlier_versions.map(function (v) { return '<li>' + esc(v) + '</li>'; }).join('') + '</ul>'
      : '';
    return '<div class="dgrid"><div>' +
      '<h4>What it is</h4><p>' + esc(t.description) + '</p>' + ev +
      '<dl class="kv"><dt>Type</dt><dd>' + esc(t.type) + (t.type_reason ? ' · ' + esc(t.type_reason) : '') + '</dd><dt>Kind</dt><dd>' + esc(t.tool_type) + '</dd><dt>Developer</dt><dd>' + esc(t.developer) + '</dd><dt>Year</dt><dd>' + esc(t.year) + '</dd><dt>Setting</dt><dd>' + esc(t.context) + '</dd><dt>Processes</dt><dd>' + esc(t.processes) + '</dd><dt>Availability</dt><dd>' + esc(t.availability) + '</dd>' +
      (t.evidence_basis ? '<dt>Evidence read</dt><dd>' + esc(t.evidence_basis) + '</dd>' : '') +
      (t.flag ? '<dt>Flag</dt><dd>' + esc(t.flag) + '</dd>' : '') + '</dl>' +
      '<h4>Sources</h4><ol class="srcs">' + srcs + '</ol></div>' +
      '<div><h4>Rating notes</h4><ul class="notes">' + notes + '</ul></div></div>';
  }

  function syncControls() {
    document.querySelectorAll('[data-match]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-match') === state.match)); });
    document.querySelectorAll('[data-min]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-min') === state.min)); });
    document.getElementById('clearcols').disabled = !state.cols.length && !state.cb;
    document.getElementById('q').value = state.q;
    [['ftype', 'type'], ['flevel', 'level'], ['fsector', 'sector'], ['fconf', 'conf'], ['flink', 'link']].forEach(function (p) {
      document.getElementById(p[0]).value = state[p[1]];
    });
    hdr.querySelectorAll('th').forEach(function (th) {
      var k = th.getAttribute('data-col');
      th.classList.toggle('sel', state.cols.indexOf(k) >= 0);
      var b = th.querySelector('button');
      if (k === state.sort) b.setAttribute('data-dir', state.dir > 0 ? '↑' : '↓'); else b.removeAttribute('data-dir');
    });
  }

  function describeColFilter() {
    var bits = [];
    if (state.cols.length) bits.push('covering ' + (state.match === 'all' ? 'all of ' : 'any of ') + state.cols.map(function (k) { return COLS[COLKEYS.indexOf(k)].short; }).join(', '));
    if (state.cb) bits.push('with ' + CB[state.cb].text);
    return bits.length ? ' · ' + bits.join(', ') + ' (' + ruleText() + ')' : '';
  }

  function render() {
    var base = baseFiltered();
    var list = colFiltered(base);
    list.sort(function (a, b) {
      var x = sortKey(a), y = sortKey(b);
      if (x < y) return -state.dir; if (x > y) return state.dir;
      return b._score - a._score || a.name.localeCompare(b.name);
    });
    syncControls();
    renderHeat(base);
    document.getElementById('count').textContent = list.length + ' of ' + tools.length + ' tools' + describeColFilter();
    writeHash();
    if (!list.length) {
      tb.innerHTML = '<tr><td colspan="14" class="empty">No tools match these filters.' + (state.cols.length > 1 && state.match === 'all' ? ' Try “any selected” or a wider rating.' : ' Clear a filter to see more.') + '</td></tr>';
      syncHead();
      return;
    }
    tb.innerHTML = list.map(function (t) {
      var open = !!state.open[t._i];
      var cells = COLS.map(function (c) {
        var sc = t.scores[c.k], r = rLabel(sc);
        return '<td class="rc' + (state.cols.indexOf(c.k) >= 0 ? ' sel' : '') + '"><i class="' + dotCls(sc) + '" role="img" aria-label="' + esc(c.full) + ': ' + r + '" title="' + esc(c.full) + ': ' + r + ' — ' + esc(sc.note) + '"></i></td>';
      }).join('');
      var lv = t.decision_levels.map(function (l) { return '<span class="tag">' + esc(l) + '</span>'; }).join('');
      var flag = t.flag ? '<span class="tag flag">' + esc(t.flagShort || 'See flag') + '</span>' : '';
      return '<tr class="row" tabindex="0" data-i="' + t._i + '" aria-expanded="' + open + '">' +
        '<td class="name"><b>' + esc(t.name) + '</b><span class="dev">' + esc(t.developer) + '</span>' + flag +
        (t.tool_link ? '<a class="tl" href="' + esc(t.tool_link.url) + '" target="_blank" rel="noopener">Tool link ↗</a>' : '') + '</td>' +
        '<td class="meta"><span class="typ typ-' + esc(t.type) + '">' + esc(t.type) + '</span><br>' + esc(t.sector) + '</td>' +
        '<td class="meta">' + lv + '</td>' +
        '<td class="yr" title="' + esc(t.year) + '">' + esc(t._yrShort) + '</td>' + cells +
        '<td class="score">' + t._score.toFixed(1) + '</td><td class="conf">' + confHtml(t.confidence) + '</td></tr>' +
        (open ? '<tr class="detail"><td colspan="14">' + detailHtml(t) + '</td></tr>' : '');
    }).join('');
    syncHead();
  }

  // ---- floating table header: a copy of <thead> pinned under the top bar while the real one is scrolled away
  var tbox = document.querySelector('.tablebox'), realTable = tbox.querySelector('table'), topbar = document.querySelector('.topbar');
  var fh = document.createElement('div');
  fh.className = 'floathead'; fh.setAttribute('aria-hidden', 'true');
  fh.innerHTML = '<table><colgroup></colgroup><thead></thead></table>';
  document.body.appendChild(fh);
  var fTable = fh.firstChild;
  function placeHead() {
    var top = topbar ? topbar.getBoundingClientRect().bottom : 0, box = tbox.getBoundingClientRect(), head = realTable.tHead.getBoundingClientRect();
    var show = head.top < top && box.bottom > top + head.height + 48;
    fh.style.display = show ? 'block' : 'none';
    if (!show) return;
    fh.style.top = Math.max(0, top) + 'px'; fh.style.left = box.left + 'px'; fh.style.width = box.width + 'px';
    fh.scrollLeft = tbox.scrollLeft;
  }
  function syncHead() {
    var src = realTable.tHead, copy = src.cloneNode(true);
    copy.querySelectorAll('[id]').forEach(function (e) { e.removeAttribute('id'); });
    copy.querySelectorAll('button').forEach(function (b) { b.tabIndex = -1; });
    fTable.replaceChild(copy, fTable.tHead);
    var cells = src.rows[src.rows.length - 1].cells, cols = '';
    for (var i = 0; i < cells.length; i++) cols += '<col style="width:' + cells[i].getBoundingClientRect().width + 'px">';
    fTable.querySelector('colgroup').innerHTML = cols;
    fTable.style.width = realTable.getBoundingClientRect().width + 'px';
    placeHead();
  }
  window.addEventListener('scroll', placeHead, { passive: true });
  window.addEventListener('resize', syncHead);
  tbox.addEventListener('scroll', function () { fh.scrollLeft = tbox.scrollLeft; }, { passive: true });
  fh.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-k]'); if (!b) return;
    var real = hdr.querySelector('button[data-k="' + b.getAttribute('data-k') + '"]'); if (real) real.click();
  });

  function toggle(tr) { var i = tr.getAttribute('data-i'); state.open[i] = !state.open[i]; render(); var again = tb.querySelector('tr.row[data-i="' + i + '"]'); if (again) again.focus(); }
  tb.addEventListener('click', function (e) { if (e.target.closest('a') || e.target.closest('tr.detail')) return; var tr = e.target.closest('tr.row'); if (tr) toggle(tr); });
  tb.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('tr.row')) { e.preventDefault(); toggle(e.target); } });

  document.getElementById('q').addEventListener('input', function (e) { state.q = e.target.value; render(); });
  [['ftype', 'type'], ['flevel', 'level'], ['fsector', 'sector'], ['fconf', 'conf'], ['flink', 'link']].forEach(function (p) {
    document.getElementById(p[0]).addEventListener('change', function (e) { state[p[1]] = e.target.value; render(); });
  });
  document.getElementById('reset').addEventListener('click', function () {
    state.q = state.type = state.level = state.sector = state.conf = state.link = '';
    state.cols = []; state.cb = ''; state.match = 'all'; state.min = 'yes';
    render();
  });
  window.addEventListener('hashchange', function () { readHash(); render(); });

  readHash();
  render();
})();
