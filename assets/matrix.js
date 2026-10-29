/* Metal AM Tool Coverage Matrix
   Data comes from data/tools.js (window.TOOLS_DATA). Filters are mirrored in the URL hash,
   so a filtered view can be bookmarked or shared, e.g. index.html#cols=NRE,QA_Qual&min=partial */
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
    { k: 'NRE', label: 'NRE', full: 'Non-recurring engineering', card: 'Non-recurring engineering', short: 'NRE', grp: 'Cost' },
    { k: 'Production', label: 'Prod', full: 'Production cost', card: 'Production cost', short: 'production cost', grp: 'Cost' },
    { k: 'QA_Qual', label: 'QA qual', full: 'QA: qualification & certification', card: 'QA qualification', short: 'QA qualification', grp: 'Cost' },
    { k: 'QA_Insp', label: 'QA insp', full: 'QA: per-part inspection', card: 'QA per-part inspection', short: 'QA inspection', grp: 'Cost' },
    { k: 'Storage', label: 'Storage', full: 'Storage / inventory', card: 'Storage / inventory', short: 'storage', grp: 'Benefit' },
    { k: 'Shared_Capital', label: 'Sh cap $', full: 'Shared capital cost', card: 'Shared capital cost', short: 'shared capital', grp: 'Benefit' },
    { k: 'Shared_Capacity', label: 'Sh capac', full: 'Shared capacity', card: 'Shared capacity', short: 'shared capacity', grp: 'Benefit' },
    { k: 'Speed', label: 'Speed', full: 'Value of speed', card: 'Value of speed', short: 'speed', grp: 'Benefit' }
  ];
  var COLKEYS = COLS.map(function (c) { return c.k; });
  var RV = { Yes: 1, Partial: 0.5, No: 0, Unknown: 0 };
  var SORTV = { Yes: 1, Partial: 0.5, No: 0, Unknown: -0.25 };
  var CONF = { High: 3, Medium: 2, Low: 1 };

  tools.forEach(function (t, i) {
    t._i = i;
    t._score = COLS.reduce(function (s, c) { return s + RV[t.scores[c.k].rating]; }, 0);
    var ym = String(t.year).match(/\d{4}/);
    t._yr = ym ? parseInt(ym[0], 10) : 0;
    t._yrShort = ym ? ym[0] : (/unknown/i.test(String(t.year)) ? 'Unknown' : '—');
    t._hay = (t.name + ' ' + t.developer + ' ' + t.context + ' ' + t.description + ' ' + t.processes).toLowerCase();
  });

  var state = { q: '', type: '', level: '', sector: '', conf: '', link: '', cols: [], match: 'all', min: 'yes', sort: 'score', dir: -1, open: {} };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function uniq(arr) { return Array.from(new Set(arr)).sort(); }

  document.getElementById('lead').textContent = DATA.lead;
  document.getElementById('foot').textContent = DATA.foot;

  // ---- URL hash <-> state
  var FIELDS = ['q', 'type', 'level', 'sector', 'conf', 'link', 'match', 'min', 'sort', 'dir'];
  function readHash() {
    var h = location.hash.replace(/^#/, '');
    if (!h) return;
    var p = new URLSearchParams(h);
    FIELDS.forEach(function (f) { if (p.has(f)) state[f] = p.get(f); });
    state.dir = state.dir === '1' || state.dir === 1 ? 1 : -1;
    if (state.match !== 'any') state.match = 'all';
    if (state.min !== 'partial') state.min = 'yes';
    state.cols = (p.get('cols') || '').split(',').filter(function (k) { return COLKEYS.indexOf(k) >= 0; });
  }
  function writeHash() {
    var p = new URLSearchParams();
    ['q', 'type', 'level', 'sector', 'conf', 'link'].forEach(function (f) { if (state[f]) p.set(f, state[f]); });
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
  fillSelect('ftype', 'types', uniq(tools.map(function (t) { return t.tool_type; })));
  fillSelect('flevel', 'levels', uniq([].concat.apply([], tools.map(function (t) { return t.decision_levels; }))));
  fillSelect('fsector', 'settings', uniq(tools.map(function (t) { return t.sector; })));
  fillSelect('fconf', 'levels', ['High', 'Medium', 'Low']);

  // ---- table header
  var hdr = document.getElementById('hdr');
  var heads = [
    { k: 'name', label: 'Tool' }, { k: 'tool_type', label: 'Type' }, { k: 'level', label: 'Decision level' }, { k: 'year', label: 'Year' }
  ].concat(COLS.map(function (c) { return { k: c.k, label: c.label, rc: true, title: c.full }; }))
   .concat([{ k: 'score', label: 'Score' }, { k: 'conf', label: 'Conf.' }]);
  hdr.innerHTML = heads.map(function (h) {
    return '<th class="' + (h.rc ? 'rc' : '') + '" data-col="' + h.k + '"><button type="button" data-k="' + h.k + '"' + (h.title ? ' title="Sort by ' + esc(h.title) + '"' : '') + '>' + esc(h.label) + '</button></th>';
  }).join('');
  hdr.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var k = b.getAttribute('data-k');
    if (state.sort === k) state.dir = -state.dir; else { state.sort = k; state.dir = (k === 'name' || k === 'tool_type' || k === 'level') ? 1 : -1; }
    render();
  });

  // ---- filtering
  function covered(t, k) {
    var r = t.scores[k].rating;
    return r === 'Yes' || (state.min === 'partial' && r === 'Partial');
  }
  function baseFiltered() {
    var q = state.q.trim().toLowerCase();
    return tools.filter(function (t) {
      if (q && t._hay.indexOf(q) < 0) return false;
      if (state.type && t.tool_type !== state.type) return false;
      if (state.level && t.decision_levels.indexOf(state.level) < 0) return false;
      if (state.sector && t.sector !== state.sector) return false;
      if (state.conf && t.confidence !== state.conf) return false;
      if (state.link === 'yes' && !t.tool_link) return false;
      if (state.link === 'no' && t.tool_link) return false;
      return true;
    });
  }
  function colFiltered(list) {
    if (!state.cols.length) return list;
    return list.filter(function (t) {
      return state.match === 'all'
        ? state.cols.every(function (k) { return covered(t, k); })
        : state.cols.some(function (k) { return covered(t, k); });
    });
  }

  function sortKey(t) {
    var k = state.sort;
    if (k === 'name') return t.name.toLowerCase();
    if (k === 'tool_type') return t.tool_type;
    if (k === 'level') return t.decision_levels.join(',');
    if (k === 'year') return t._yr;
    if (k === 'score') return t._score;
    if (k === 'conf') return CONF[t.confidence] || 0;
    return SORTV[t.scores[k].rating];
  }

  // ---- coverage cards (counts use every filter except the column filters, so they stay put while you pick columns)
  var strip = document.getElementById('strip');
  function renderStrip(base) {
    strip.innerHTML = COLS.map(function (c) {
      var y = 0, p = 0, u = 0, n = base.length;
      base.forEach(function (t) { var r = t.scores[c.k].rating; if (r === 'Yes') y++; else if (r === 'Partial') p++; else if (r === 'Unknown') u++; });
      var py = n ? y / n * 100 : 0, pp = n ? p / n * 100 : 0, pu = n ? u / n * 100 : 0;
      var on = state.cols.indexOf(c.k) >= 0;
      return '<button type="button" class="cov" data-k="' + c.k + '" aria-pressed="' + on + '" aria-label="' + esc(c.full) + ': ' + y + ' yes, ' + p + ' partial, ' + u + ' unknown, ' + (n - y - p - u) + ' no. ' + (on ? 'Selected.' : 'Select to filter.') + '">' +
        '<span class="box" aria-hidden="true">✓</span>' +
        '<span class="grp">' + c.grp + '</span>' +
        '<span class="k">' + esc(c.card) + '</span>' +
        '<span class="bar" aria-hidden="true"><i class="y" style="width:' + py.toFixed(1) + '%"></i><i class="p" style="width:' + pp.toFixed(1) + '%"></i><i class="u" style="width:' + pu.toFixed(1) + '%"></i></span>' +
        '<span class="n" aria-hidden="true"><span class="nw">' + y + ' yes ·</span> <span class="nw">' + p + ' partial ·</span> <span class="nw">' + u + ' unknown ·</span> <span class="nw">' + (n - y - p - u) + ' no</span></span></button>';
    }).join('');
  }
  strip.addEventListener('click', function (e) {
    var b = e.target.closest('.cov'); if (!b) return;
    var k = b.getAttribute('data-k');
    var i = state.cols.indexOf(k);
    if (i >= 0) state.cols.splice(i, 1); else state.cols.push(k);
    state.cols.sort(function (a, b2) { return COLKEYS.indexOf(a) - COLKEYS.indexOf(b2); });
    render();
    var again = strip.querySelector('.cov[data-k="' + k + '"]'); if (again) again.focus();
  });
  document.querySelectorAll('[data-match]').forEach(function (b) {
    b.addEventListener('click', function () { state.match = b.getAttribute('data-match'); render(); });
  });
  document.querySelectorAll('[data-min]').forEach(function (b) {
    b.addEventListener('click', function () { state.min = b.getAttribute('data-min'); render(); });
  });
  document.getElementById('clearcols').addEventListener('click', function () { state.cols = []; render(); });

  // ---- rows
  function confHtml(c) { var n = CONF[c] || 0; return '<span class="conf">' + [1, 2, 3].map(function (i) { return '<i class="' + (i <= n ? 'on' : '') + '"></i>'; }).join('') + ' ' + esc(c) + '</span>'; }

  function detailHtml(t) {
    var notes = COLS.map(function (c) {
      var s = t.scores[c.k];
      return '<li><i class="dot ' + s.rating + '" aria-hidden="true"></i><span class="c">' + esc(c.full) + '</span><span>' + esc(s.rating) + '. ' + esc(s.note) + '</span></li>';
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
      '<dl class="kv"><dt>Developer</dt><dd>' + esc(t.developer) + '</dd><dt>Year</dt><dd>' + esc(t.year) + '</dd><dt>Setting</dt><dd>' + esc(t.context) + '</dd><dt>Processes</dt><dd>' + esc(t.processes) + '</dd><dt>Availability</dt><dd>' + esc(t.availability) + '</dd>' +
      (t.evidence_basis ? '<dt>Evidence read</dt><dd>' + esc(t.evidence_basis) + '</dd>' : '') +
      (t.flag ? '<dt>Flag</dt><dd>' + esc(t.flag) + '</dd>' : '') + '</dl>' +
      '<h4>Sources</h4><ol class="srcs">' + srcs + '</ol></div>' +
      '<div><h4>Rating notes</h4><ul class="notes">' + notes + '</ul></div></div>';
  }

  function syncControls() {
    document.querySelectorAll('[data-match]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-match') === state.match)); });
    document.querySelectorAll('[data-min]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-min') === state.min)); });
    document.getElementById('clearcols').disabled = !state.cols.length;
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
    if (!state.cols.length) return '';
    var names = state.cols.map(function (k) { return COLS[COLKEYS.indexOf(k)].short; });
    return ' · covering ' + (state.match === 'all' ? 'all of ' : 'any of ') + names.join(', ') + (state.min === 'partial' ? ' (Yes or Partial)' : ' (Yes)');
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
    renderStrip(base);
    document.getElementById('count').textContent = list.length + ' of ' + tools.length + ' tools' + describeColFilter();
    writeHash();
    if (!list.length) {
      tb.innerHTML = '<tr><td colspan="14" class="empty">No tools match these filters.' + (state.cols.length > 1 && state.match === 'all' ? ' Try “any selected” or “Yes or Partial”.' : ' Clear a filter to see more.') + '</td></tr>';
      return;
    }
    tb.innerHTML = list.map(function (t) {
      var open = !!state.open[t._i];
      var cells = COLS.map(function (c) {
        var r = t.scores[c.k].rating;
        return '<td class="rc' + (state.cols.indexOf(c.k) >= 0 ? ' sel' : '') + '"><i class="dot ' + r + '" role="img" aria-label="' + esc(c.full) + ': ' + r + '" title="' + esc(c.full) + ': ' + r + ' — ' + esc(t.scores[c.k].note) + '"></i></td>';
      }).join('');
      var lv = t.decision_levels.map(function (l) { return '<span class="tag">' + esc(l) + '</span>'; }).join('');
      var flag = t.flag ? '<span class="tag flag">' + esc(t.flagShort || 'See flag') + '</span>' : '';
      return '<tr class="row" tabindex="0" data-i="' + t._i + '" aria-expanded="' + open + '">' +
        '<td class="name"><b>' + esc(t.name) + '</b><span class="dev">' + esc(t.developer) + '</span>' + flag +
        (t.tool_link ? '<a class="tl" href="' + esc(t.tool_link.url) + '" target="_blank" rel="noopener">Tool link ↗</a>' : '') + '</td>' +
        '<td class="meta">' + esc(t.tool_type) + '<br>' + esc(t.sector) + '</td>' +
        '<td class="meta">' + lv + '</td>' +
        '<td class="yr" title="' + esc(t.year) + '">' + esc(t._yrShort) + '</td>' + cells +
        '<td class="score">' + t._score.toFixed(1) + '</td><td class="conf">' + confHtml(t.confidence) + '</td></tr>' +
        (open ? '<tr class="detail"><td colspan="14">' + detailHtml(t) + '</td></tr>' : '');
    }).join('');
  }

  function toggle(tr) { var i = tr.getAttribute('data-i'); state.open[i] = !state.open[i]; render(); var again = tb.querySelector('tr.row[data-i="' + i + '"]'); if (again) again.focus(); }
  tb.addEventListener('click', function (e) { if (e.target.closest('a') || e.target.closest('tr.detail')) return; var tr = e.target.closest('tr.row'); if (tr) toggle(tr); });
  tb.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('tr.row')) { e.preventDefault(); toggle(e.target); } });

  document.getElementById('q').addEventListener('input', function (e) { state.q = e.target.value; render(); });
  [['ftype', 'type'], ['flevel', 'level'], ['fsector', 'sector'], ['fconf', 'conf'], ['flink', 'link']].forEach(function (p) {
    document.getElementById(p[0]).addEventListener('change', function (e) { state[p[1]] = e.target.value; render(); });
  });
  document.getElementById('reset').addEventListener('click', function () {
    state.q = state.type = state.level = state.sector = state.conf = state.link = '';
    state.cols = []; state.match = 'all'; state.min = 'yes';
    render();
  });
  window.addEventListener('hashchange', function () { readHash(); render(); });

  readHash();
  render();
})();
