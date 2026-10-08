(function () {
  var DESKTOP_URL = 'https://scm-control.vercel.app/index.html'; // ganti bila alamat versi desktop berubah
  var $ = function (id) { return document.getElementById(id); };
  var S = { v: 'home', sub: 'armada', kpi: null, an: null, anErr: '', email: '', ok: false, at: '', pk: {}, anSec: {}, fresh: {}, pg: {} }, uid = 0;
  var P = {
    box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8"/>', truck: '<path d="M2 6h11v10H2zM13 10h4l3 3v3h-7zM6 19a2 2 0 1 0 0 .1M17 19a2 2 0 1 0 0 .1"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.5 3-6 6-6s6 2.500 6 6M16 5a3 3 0 0 1 0 6M21 20c0-2.500-1.500-4.500-4-5.500"/>',
    home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>', chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.500-6 8-6s8 2 8 6"/>', back: '<path d="M15 5l-7 7 7 7"/>', ref: '<path d="M21 12a9 9 0 1 1-3-6.700M21 4v5h-5"/>',
    bell: '<path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7M10 20a2 2 0 0 0 4 0"/>', warn: '<path d="M12 3l10 18H2zM12 10v5M12 18v.1"/>', chev: '<path d="M9 5l7 7-7 7"/>'
  };
  function ic(k) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + P[k] + '</svg>'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function n(v, d) { v = Number(v); return isFinite(v) ? v.toLocaleString('id-ID', { maximumFractionDigits: d || 0 }) : '-'; }
  var pct = function (v) { return n(v, 1) + '%'; }, unit = function (v) { return n(v) + ' unit'; };
  function hm(v) { v = Number(v); return !isFinite(v) ? '-' : v >= 60 ? Math.floor(v / 60) + 'j ' + Math.round(v % 60) + 'm' : Math.round(v) + ' mnt'; }
  function idr(v) { v = Number(v); return !isFinite(v) ? '-' : 'Rp ' + (v >= 1e9 ? n(v / 1e9, 2) + ' M' : v >= 1e6 ? n(v / 1e6, 1) + ' jt' : n(v)); }
  function cls(v) { return v >= 70 ? 'good' : v >= 50 ? 'warn' : 'bad'; }
  function lbl(v) { return v >= 70 ? 'Baik' : v >= 50 ? 'Perlu perhatian' : 'Kritis'; }
  function zone(k) { var z = S.kpi && S.kpi.zones && S.kpi.zones[k]; return z && z.status === 'live' && z.data ? z.data : null; }
  function zerr(k) { var z = S.kpi && S.kpi.zones && S.kpi.zones[k]; return z && z.error ? String(z.error) : ''; }
  // [label, ambil nilai, format] — sama dengan kartu KPI di versi desktop
  var Z = {
    stock: { t: 'Stok FG', s: 'Kesehatan stok', i: 'box', main: function (d) { return d.health_pct; }, k: [
      ['Kesehatan stok', function (d) { return d.health_pct; }, pct], ['SKU aman', function (d) { return d.safe_sku; }, function (v, d) { return n(v) + ' / ' + n(d.total_sku); }],
      ['Akurasi forecast', function (d) { return d.forecast_accuracy_pct; }, pct], ['Utilisasi gudang', function (d) { return d.capacity_util_pct; }, pct], ['Total stok', function (d) { return d.total_stock_unit; }, unit]] },
    logistics: { t: 'Logistik', s: 'SLA loading truk', i: 'truck', main: function (d) { return d.sla_pct; }, k: [
      ['SLA loading', function (d) { return d.sla_pct; }, pct], ['Rata-rata loading', function (d) { return d.avg_load_minutes; }, hm],
      ['Total pengiriman', function (d) { return d.total_shipment; }, unit], ['Loading terlama', function (d) { return d.longest_load_minutes; }, hm]] },
    fefo: { t: 'FEFO', s: 'Kepatuhan batch', i: 'clock', main: function (d) { return d.compliance_pct; }, k: [
      ['Kepatuhan FEFO', function (d) { return d.compliance_pct; }, pct], ['Pelanggaran urutan', function (d) { return d.violation_count; }, function (v) { return n(v); }],
      ['Qty terkirim', function (d) { return d.total_qty_ctn; }, function (v) { return n(v / 1e6, 2) + ' jt ctn'; }], ['Volume terkirim', function (d) { return d.total_volume_terkirim_l; }, function (v) { return n(v / 1000) + ' m³'; }],
      ['Nilai terkirim', function (d) { return d.total_nilai_terkirim_idr; }, idr], ['Pertumbuhan penjualan', function (d) { return d.nilai_terkirim_periode_lalu_idr > 0 ? (d.total_nilai_terkirim_idr - d.nilai_terkirim_periode_lalu_idr) / d.nilai_terkirim_periode_lalu_idr * 100 : null; }, pct],
      ['Qty hari ini', function (d) { return d.qty_terkirim_hari_ini; }, function (v) { return n(v) + ' ctn'; }], ['Hari dalam periode', function (d) { return d.hari_dalam_periode; }, function (v) { return n(v); }]] },
    warehouse: { t: 'Gudang', s: 'Produktivitas harian', i: 'users', raw: 1, main: function (d) { return d.avg_shipment_per_day; }, k: [
      ['Pengiriman / hari', function (d) { return d.avg_shipment_per_day; }, function (v) { return n(v, 1); }], ['Tenaga / pengiriman', function (d) { return d.avg_crew_size; }, function (v) { return n(v, 1); }],
      ['Petugas teraktif', function (d) { return d.top_karyawan_jumlah; }, function (v) { return n(v) + 'x'; }], ['Kendaraan muat / hari', function (d) { return d.req_kendaraan_muat_per_hari; }, unit]] }
  };
  var PAL = ['#FFA11E', '#FF3D81', '#4F7BFF', '#FFD23F', '#9A86FF', '#35D0BA'];
  var COL = { stock: '#FF3D81', logistics: '#FFA11E', fefo: '#4F7BFF', warehouse: '#35D0BA' };
  var PICK = [['stock', 3], ['stock', 4], ['logistics', 2], ['logistics', 3], ['fefo', 1], ['warehouse', 2]];
  var SEC = [['armada', 'Armada'], ['prioritas', 'Prioritas'], ['peringatan', 'Peringatan'], ['kendaraan', 'Kendaraan'], ['prediksi', 'Prediksi'], ['stok_vs_kirim', 'Stok vs Kirim'], ['tren', 'Tren'], ['harian', 'Harian'], ['durasi_ringkas', 'Durasi truk'], ['shipments_ringkas', 'Pengiriman'], ['pareto', 'Pareto'], ['biaya_carton', 'Biaya'], ['estimasi_budget', 'Budget'], ['sku_belum_master', 'Data master'], ['peta', 'Peta']];

  var CK = 'scm_m_cache_v1';
  function save() { try { localStorage.setItem(CK, JSON.stringify({ kpi: S.kpi, an: S.an, at: S.at, email: S.email })); } catch (e) {} }
  function restore() { try { var c = JSON.parse(localStorage.getItem(CK) || 'null'); if (c && c.kpi) { S.kpi = c.kpi; S.an = c.an; S.at = c.at; S.email = c.email || ''; S.stale = 1; S.ok = true; } } catch (e) {} }
  async function get(url, ms) {
    var ac = new AbortController(), tm = setTimeout(function () { ac.abort(); }, ms || 40000), res, j = null;
    try { res = await window.SCM_AUTH.authFetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store', signal: ac.signal }); try { j = await res.json(); } catch (e) {} }
    catch (e) { throw new Error(e.name === 'AbortError' ? 'Koneksi lambat, server belum merespons. Coba segarkan.' : e.message); }
    finally { clearTimeout(tm); }
    if (!res.ok || !j || !j.ok) { var er = j && j.error; throw new Error(typeof er === 'string' ? er : er ? JSON.stringify(er) : 'HTTP ' + res.status); }
    return j;
  }
  // tiap zona dimuat sendiri-sendiri & langsung ditampilkan begitu datang (tidak menunggu zona paling lambat)
  // ---------- progres muat (persen + perkiraan sisa waktu, dipelajari dari durasi muat sebelumnya) ----------
  var DK = 'scm_m_dur', DUR = {};
  try { DUR = JSON.parse(localStorage.getItem(DK) || '{}') || {}; } catch (e) {}
  function tstart(k) { S.pg[k] = { t0: Date.now(), exp: DUR[k] || (Z[k] ? 12000 : 15000), done: 0 }; }
  function tend(k, ok) {
    var p = S.pg[k]; if (!p) return; p.done = 1;
    if (ok) { var d = Date.now() - p.t0; DUR[k] = Math.round(DUR[k] ? (DUR[k] + d) / 2 : d); try { localStorage.setItem(DK, JSON.stringify(DUR)); } catch (e) {} }
  }
  function pgOf(keys) {
    var now = Date.now(), p = 0, left = 0, c = 0;
    keys.forEach(function (k) { var t = S.pg[k]; if (!t) return; c++; if (t.done) p += 1; else { var el = now - t.t0; p += Math.min(.95, el / t.exp * .95); left = Math.max(left, (t.exp - el) / 1000); } });
    return { p: c ? p / c : 0, left: left };
  }
  function pgLeft(x) { return x.p >= .95 ? 'Hampir selesai…' : x.left > 0 ? 'Perkiraan ± ' + Math.ceil(x.left) + ' detik lagi' : 'Lebih lama dari biasanya, mohon tunggu…'; }
  function pgHtml(keys, label) {
    var x = pgOf(keys), pc = Math.round(x.p * 100);
    return '<div class="pgw" data-pg="' + keys.join(',') + '"><div class="pgt"><span>' + esc(label) + '</span><b>' + pc + '%</b></div><div class="pgb"><i style="width:' + pc + '%"></i></div><div class="pgl">' + pgLeft(x) + '</div></div>';
  }
  setInterval(function () {
    var els = document.querySelectorAll('[data-pg]');
    for (var i = 0; i < els.length; i++) { var x = pgOf(els[i].getAttribute('data-pg').split(',')), pc = Math.round(x.p * 100); els[i].querySelector('b').textContent = pc + '%'; els[i].querySelector('i').style.width = pc + '%'; els[i].querySelector('.pgl').textContent = pgLeft(x); }
  }, 250);
  async function zoneLoad(k, tries) {
    S.kpi = S.kpi || { zones: {} };
    if (tries === 1) tstart(k);
    try {
      var v = await get('/api/kpi/' + k);
      if (v.status === 'live' && v.data) { S.kpi.zones[k] = { status: 'live', data: v.data, error: null }; tend(k, 1); render(); return; }
      throw new Error(v.error || 'Gagal memuat zona');
    } catch (e) {
      if (tries > 0) { await new Promise(function (r) { setTimeout(r, 1500); }); return zoneLoad(k, tries - 1); }
      tend(k, 0);
      if (!zone(k)) S.kpi.zones[k] = { status: 'error', data: null, error: e.message };   // data tersimpan tetap dipakai bila ada
      render();
    }
  }
  function rowsOf(p, k) {
    if (Array.isArray(p)) return p; if (!p || typeof p !== 'object') return null; if (Array.isArray(p[k])) return p[k]; if (p.data) return rowsOf(p.data, k);
    var a = Object.keys(p).filter(function (x) { return Array.isArray(p[x]); })[0]; return a ? p[a] : null;
  }
  // Analisis dimuat per bagian (tab), tidak sekaligus
  async function secLoad(k, force) {
    if (S.anSec[k] === 'load' || (!force && S.fresh[k])) return;
    S.anSec[k] = 'load'; tstart(k); render();
    try {
      var j = await get('/api/analisis?s=' + encodeURIComponent(k), 58000), d = j.data;
      if (Array.isArray(d)) { var o = {}; o[k] = d; d = o; } else if (d && !Array.isArray(d[k]) && Array.isArray(d.data || d.rows)) { var o2 = {}; o2[k] = d.data || d.rows; d = o2; }
      S.an = Object.assign(S.an || {}, d); Object.keys(d || {}).forEach(function (x) { S.fresh[x] = 1; }); S.fresh[k] = 1; S.anSec[k] = ''; S.anErr = ''; tend(k, 1);
    } catch (e) { tend(k, 0); S.anSec[k] = 'err:' + e.message; }
    render();
  }
  async function homeAn() { await Promise.all([secLoad('armada', 1), secLoad('peringatan', 1)]); }
  async function stkLoad(force) {
    if (S.stkSt === 'load' || (!force && S.stk)) return;
    S.stkSt = 'load'; render();
    var tn = ''; try { tn = localStorage.getItem('scm_stk_t') || ''; } catch (e) {}
    try { S.stk = await get('/api/stok' + (/^\w+$/.test(tn) ? '?t=' + tn : ''), 58000); S.stkSt = ''; } catch (e) { S.stk = null; S.stkSt = 'err:' + e.message; }
    render();
  }
  function ens() { if (S.v === 'an' && S.sub && !S.fresh[S.sub]) secLoad(S.sub); else if (S.v === 'z:logistics') { if (!S.log && S.logSt !== 'load') logLoad(); } else if (S.v === 'z:fefo') { if (!S.fef && S.fefSt !== 'load') fefLoad(); } else if (S.v === 'z:stock') { if (!S.stk && S.stkSt !== 'load') stkLoad(); if (!S.fresh.stok_vs_kirim) secLoad('stok_vs_kirim'); } }
  function secState(k) {
    var s = S.anSec[k] || '';
    if (s === 'load') return pgHtml([k], 'Memuat ' + k.replace(/_/g, ' '));
    if (s.indexOf('err:') === 0) return '<div class="card"><b>Data belum bisa dimuat</b><div class="sm" style="margin:6px 0 10px">' + esc(s.slice(4)) + '</div><button class="chip" data-a="retry">Coba lagi</button></div>';
    return '<div class="card sm">Belum ada data untuk bagian ini.</div>';
  }
  async function load() {
    if (S.busy) return; S.busy = 1; S.fresh = {}; S.pg = {}; render();
    try {
      await window.SCM_AUTH_READY;
      var s = await window.scmSupabase.auth.getSession();
      S.email = (s.data.session && s.data.session.user.email) || '';
      await Promise.all(Object.keys(Z).map(function (k) { return zoneLoad(k, 1); }).concat(homeAn(), S.v === 'an' && S.sub !== 'armada' && S.sub !== 'peringatan' ? secLoad(S.sub, 1) : [], S.v === 'z:stock' ? [secLoad('stok_vs_kirim', 1), stkLoad(1)] : [], S.v === 'z:fefo' ? [fefLoad(1)] : [], S.v === 'z:logistics' ? [logLoad(1)] : []));
      S.ok = Object.keys(Z).some(zone); S.stale = 0; S.at = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }); save();
    } catch (e) { S.ok = false; S.anErr = e.message; }
    S.busy = 0; S.last = Date.now(); render();
  }

  function status() { return '<span class="chip dotonly" role="img" aria-label="' + (S.ok ? 'Online' : 'Offline') + '" title="' + (S.ok ? 'Online' : 'Offline') + '"><span class="dot' + (S.ok ? '' : ' err') + '"></span></span>'; }
  function todayLbl() { try { return new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return 'Hari ini'; } }
  function dispName() {
    var e = String(S.email || ''), l = e.split('@')[0];
    if (/^aji\.septaku$/i.test(l)) return 'Septa Aji';
    return l ? l.replace(/[._-]+/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }) : 'pengguna';
  }
  function tg(t) { var k = /krit|high|tinggi/i.test(t) ? 'bad' : /peringat|warn|sedang/i.test(t) ? 'warn' : ''; return '<span class="chip ' + k + '">' + esc(t) + '</span>'; }
  function gauge(v, color) {
    var C = 2 * Math.PI * 44, a = C * 0.75, f = isFinite(v) ? a * Math.min(100, Math.max(0, v)) / 100 : 0;
    return '<svg class="gauge" viewBox="0 0 120 120"><g transform="rotate(135 60 60)"><circle cx="60" cy="60" r="44" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + a + ' ' + C + '"/><circle cx="60" cy="60" r="44" fill="none" stroke="' + color + '" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + f + ' ' + C + '"/></g><text x="60" y="66" text-anchor="middle" font-size="22" font-weight="600" fill="#fff">' + (isFinite(v) ? Math.round(v) : '-') + '</text></svg>';
  }
  function head(title, sub, back) {
    var cnt = S.an && S.an.peringatan ? S.an.peringatan.length : 0;
    return '<div class="hd"><button class="rb" data-v="' + (back ? 'home' : 'an') + '" data-s="' + (back ? '' : 'peringatan') + '" aria-label="' + (back ? 'Kembali' : 'Peringatan') + '">' + ic(back ? 'back' : 'bell') + (!back && cnt ? '<i>' + Math.min(99, cnt) + '</i>' : '') + '</button><div class="t"><b>' + title + '</b><small>' + sub + '</small></div><div class="rg"><button class="rb rl' + (S.busy ? ' spin' : '') + '" data-a="reload" aria-label="Segarkan">' + ic('ref') + '</button><button class="rb" data-v="me" aria-label="Profil">' + ic('user') + '</button></div></div>';
  }
  function tile(label, val) {
    var m = String(val).match(/^(-?[\d.,]+)\s*(%|unit|ctn|jt ctn|m³|hr|mnt|\/hari|x)$/);
    return '<div class="tl"><small>' + esc(label) + '</small><b>' + (m ? esc(m[1]) + '<em>' + esc(m[2]) + '</em>' : esc(val)) + '</b></div>';
  }
  function tiles(k) {
    var d = zone(k); if (!d) return '';
    return Z[k].k.map(function (x) { var v = x[1](d); return v == null || !isFinite(Number(v)) ? '' : tile(x[0], x[2](v, d)); }).join('');
  }
  function al(r) {
    var k = /krit|high|tinggi/i.test(r.tingkat) ? 'bad' : /peringat|warn|sedang/i.test(r.tingkat) ? 'warn' : '';
    return '<div class="tk"><span class="nd ' + k + '">' + ic('warn') + '</span><div><b>' + esc(r.judul) + '</b><small>' + esc(r.detail).slice(0, 90) + '</small></div>' + tg(r.tingkat) + '</div>';
  }
  function errNote() {
    var m = S.busy ? [] : Object.keys(Z).filter(function (k) { return !zone(k); }).map(function (k) { return '<b>' + Z[k].t + ':</b> ' + esc((zerr(k) || 'belum ada data').slice(0, 140)); });
    return m.length ? '<div class="note">' + m.join('<br>') + '</div>' : '';
  }

  // ---------- grafik (SVG/CSS murni, tanpa library) ----------
  function ring(v, c, sz, txt) {
    var C = 2 * Math.PI * 40, f = isFinite(v) ? C * Math.min(100, Math.max(0, v)) / 100 : 0;
    return '<svg width="' + sz + '" height="' + sz + '" viewBox="0 0 100 100" style="flex:none"><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="10"/><circle cx="50" cy="50" r="40" fill="none" stroke="' + c + '" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + f + ' ' + C + '" transform="rotate(-90 50 50)"/><text x="50" y="57" text-anchor="middle" font-size="24" font-weight="600" fill="#fff">' + (txt || (isFinite(v) ? Math.round(v) : '-')) + '</text></svg>';
  }
  function donut(parts, center) {
    parts = parts.filter(function (p) { return p.v > 0; });
    var tot = parts.reduce(function (a, p) { return a + p.v; }, 0), C = 2 * Math.PI * 38, off = 0;
    if (!tot) return '<div class="sm">Belum ada data.</div>';
    var segs = parts.map(function (p) { var l = C * p.v / tot, s = '<circle cx="50" cy="50" r="38" fill="none" stroke="' + p.c + '" stroke-width="12" stroke-dasharray="' + Math.max(0, l - 2) + ' ' + (C - l + 2) + '" stroke-dashoffset="' + -off + '" transform="rotate(-90 50 50)"/>'; off += l; return s; }).join('');
    return '<div class="dn"><svg width="120" height="120" viewBox="0 0 100 100" style="flex:none"><circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="12"/>' + segs + '<text x="50" y="55" text-anchor="middle" font-size="15" font-weight="600" fill="#fff">' + esc(center) + '</text></svg><div class="lg">' +
      parts.map(function (p) { return '<div><i style="background:' + p.c + '"></i><span>' + esc(p.l) + '</span><b>' + n(p.v) + '</b></div>'; }).join('') + '</div></div>';
  }
  function area(vals, labs, c) {
    if (vals.length < 2) return '';
    var W = 320, H = 130, p = 10, id = 'g' + (++uid), hi = Math.max.apply(0, vals), lo = Math.min.apply(0, vals), sp = hi - lo || 1, m = vals.length;
    var X = function (i) { return p + i * (W - 2 * p) / (m - 1); }, Y = function (v) { return H - p - (v - lo) / sp * (H - 2 * p - 26); };
    var d = 'M' + X(0) + ' ' + Y(vals[0]); for (var i = 1; i < m; i++) { var mx = (X(i - 1) + X(i)) / 2; d += ' C' + mx + ' ' + Y(vals[i - 1]) + ' ' + mx + ' ' + Y(vals[i]) + ' ' + X(i) + ' ' + Y(vals[i]); }
    var k = vals.indexOf(hi), bx = Math.min(W - 30, Math.max(30, X(k)));
    return '<svg class="ar" viewBox="0 0 ' + W + ' ' + H + '"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c + '" stop-opacity=".45"/><stop offset="1" stop-color="' + c + '" stop-opacity="0"/></linearGradient></defs><path d="' + d + ' L' + X(m - 1) + ' ' + H + ' L' + X(0) + ' ' + H + 'Z" fill="url(#' + id + ')"/><path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="2.500" stroke-linecap="round"/><line x1="' + X(k) + '" x2="' + X(k) + '" y1="22" y2="' + H + '" stroke="rgba(255,255,255,.2)" stroke-dasharray="3 4"/><circle cx="' + X(k) + '" cy="' + Y(hi) + '" r="5" fill="#fff" stroke="' + c + '" stroke-width="3"/><rect x="' + (bx - 28) + '" y="0" width="56" height="20" rx="8" fill="#16211B"/><text x="' + bx + '" y="14" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">' + n(hi, 1) + '</text></svg><div class="xl"><span>' + esc(labs[0]) + '</span><span>' + esc(labs[m - 1]) + '</span></div>';
  }
  function vbars(items) {   // items: [label, nilai]
    var mx = Math.max.apply(0, items.map(function (x) { return x[1]; })) || 1, top = items.reduce(function (a, x, i) { return x[1] > items[a][1] ? i : a; }, 0);
    return '<div class="vb">' + items.map(function (x, i) { return '<div' + (i === top ? ' class="hi"' : '') + '>' + (i === top ? n(x[1]) : '') + '<i style="height:' + Math.max(4, x[1] / mx * 100) + '%"></i>' + esc(String(x[0]).slice(0, 5)) + '</div>'; }).join('') + '</div>';
  }
  function hbars(items, c) {   // items: [label, nilai, teks, lebar%]
    return items.map(function (x) { return '<div class="hb"><div class="row"><span>' + esc(x[0]) + '</span><b>' + esc(x[2]) + '</b></div><div class="bar"><i style="width:' + Math.max(2, Math.min(100, x[3])) + '%;background:linear-gradient(90deg,' + c + 'AA,' + c + ')"></i></div></div>'; }).join('');
  }
  function sum(rows, f) { return rows.reduce(function (a, r) { return a + (Number(f(r)) || 0); }, 0); }
  function group(rows, kf, vf) { var o = {}, ks = []; rows.forEach(function (r) { var k = kf(r); if (!(k in o)) { o[k] = 0; ks.push(k); } o[k] += vf ? Number(vf(r)) || 0 : 1; }); return ks.map(function (k) { return [k, o[k]]; }); }

  function rows(k) { return S.an && Array.isArray(S.an[k]) ? S.an[k] : []; }
  function lvl(t) { return /krit|high|tinggi/i.test(t) ? 'bad' : /peringat|warn|sedang/i.test(t) ? 'warn' : 'good'; }
  function alertDonut() {
    var a = rows('peringatan'), L = { bad: ['Kritis', '#D14343'], warn: ['Peringatan', '#E8C04A'], good: ['Info', '#9CC94B'] };
    return '<div class="card"><h4>Peringatan berdasarkan tingkat</h4>' + (a.length ? donut(['bad', 'warn', 'good'].map(function (k) { return { l: L[k][0], c: L[k][1], v: a.filter(function (r) { return lvl(r.tingkat) === k; }).length }; }), a.length) : '<span class="sm">Tidak ada peringatan.</span>') + '</div>';
  }
  function uq(r, k) { var o = []; r.forEach(function (x) { var v = String(x[k]); if (o.indexOf(v) < 0) o.push(v); }); return o; }
  function pick(key, vals) {
    var cur = vals.indexOf(S.pk[key]) > -1 ? S.pk[key] : vals[0];
    return [cur, vals.length > 1 ? '<select class="dd" data-pk="' + esc(key) + '" aria-label="Pilih periode">' + vals.map(function (v) { return '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(String(v).replace(/_/g, ' ')) + '</option>'; }).join('') + '</select>' : ''];
  }
  function armadaCharts(per) {
    var a = rows('armada'); if (!a.length) return '';
    per = per || pick('per', uq(a, 'periode'))[0]; a = a.filter(function (r) { return String(r.periode) === per; });
    var g = group(a, function (r) { return r.whs; }, function (r) { return r.total_karton; }).sort(function (x, y) { return y[1] - x[1]; }).slice(0, 8);
    return '<div class="card"><h4>Total karton per gudang · ' + esc(per) + '</h4>' + vbars(g) + '</div><div class="card"><h4>Komposisi armada</h4>' + donut([{ l: 'Cont. 40 ft', c: PAL[0], v: sum(a, function (r) { return r.ctn_40ft; }) }, { l: 'BWB', c: PAL[1], v: sum(a, function (r) { return r.bwb; }) }, { l: 'Cont. 20 ft', c: PAL[2], v: sum(a, function (r) { return r.ctn_20ft; }) }], n(sum(a, function (r) { return r.total_karton; }))) + '</div>';
  }

  function zoneCharts(k, d, z, c) {
    var g = '', pb = z.k.map(function (x) { var y = x[1](d); return x[2] === pct && y != null && isFinite(Number(y)) ? [x[0], Number(y), pct(y), Math.abs(Number(y))] : null; }).filter(Boolean);
    if (pb.length > 1 || (pb.length && k !== 'logistics')) g += '<div class="card"><h4>Indikator persentase</h4>' + hbars(pb, c) + '</div>';
    if (k === 'stock' && isFinite(d.safe_sku) && isFinite(d.total_sku)) g += '<div class="card"><h4>Komposisi SKU</h4>' + donut([{ l: 'Aman', c: PAL[0], v: d.safe_sku }, { l: 'Perlu tindakan', c: PAL[4], v: d.total_sku - d.safe_sku }], n(d.total_sku)) + '</div>';
    if (k === 'logistics' && isFinite(d.avg_load_minutes)) g += '<div class="card"><h4>Durasi loading</h4>' + hbars([['Rata-rata', 0, hm(d.avg_load_minutes), d.avg_load_minutes / (d.longest_load_minutes || d.avg_load_minutes) * 100], ['Terlama', 0, hm(d.longest_load_minutes), 100]], c) + '</div>';
    return g;
  }
  function zc(k, i) {
    var d = zone(k), v = d ? Number(Z[k].main(d)) : NaN, ok = isFinite(v);
    return '<button class="zc ' + ['b', 'p', 'o', 'v'][i % 4] + '" data-v="z:' + k + '"><span class="zi">' + ic(Z[k].i) + '</span><span class="zt"><b>' + (ok ? n(v, 1) + '<em>' + (Z[k].raw ? '/hari' : '%') + '</em>' : '-') + '</b><small>' + Z[k].t + ' · ' + Z[k].s + (d ? '' : ' · ' + (S.busy ? 'Memuat' : 'Gagal')) + '</small></span><span class="za">' + ic('chev') + '</span></button>';
  }
  function home() {
    var vs = ['stock', 'logistics', 'fefo'].map(function (k) { var d = zone(k); return d ? Number(Z[k].main(d)) : NaN; }).filter(isFinite);
    var sc = vs.length ? vs.reduce(function (a, b) { return a + b; }, 0) / vs.length : NaN, al4 = (S.an && S.an.peringatan || []).slice(0, 4), ac = S.an && S.an.peringatan ? S.an.peringatan.length : 0;
    return head('SCM Tower', S.at ? (S.stale ? 'Data tersimpan ' : 'Disinkron pukul ') + S.at : 'Memuat data...') +
      (S.busy ? pgHtml(['stock', 'logistics', 'fefo', 'warehouse', 'armada', 'peringatan'], 'Memuat data') : '') + '<div class="chips"><span class="chip">' + esc(todayLbl()) + '</span>' + status() + '<span class="chip good">Selamat datang : ' + esc(dispName()) + '</span></div>' +
      '<div class="sum"><div class="s1"><small>Skor operasional</small><b>' + (isFinite(sc) ? Math.round(sc) + '%' : '-') + '</b></div><i class="vl"></i><button class="s2" data-v="an" data-s="peringatan"><small>Peringatan</small><b>' + n(ac) + '</b></button></div>' + errNote() +
      Object.keys(Z).map(zc).join('') +
      '<div class="tiles">' + PICK.map(function (p) { var d = zone(p[0]), x = Z[p[0]].k[p[1]], v = d && x[1](d); return d && v != null && isFinite(Number(v)) ? tile(x[0], x[2](v, d)) : ''; }).join('') + '</div>' +
      armadaCharts() + alertDonut() + '<div class="trh"><span>Peringatan:</span><button data-v="an" data-s="peringatan">Lihat semua</button></div>' +
      '<div class="track">' + (al4.length ? al4.map(al).join('') : '<span class="sm">Tidak ada peringatan.</span>') + '</div>';
  }

  // ---------- Monitoring stok: KPI, Analisa System, regresi ----------
  function fz(d, res, not) {   // cari nilai numerik di objek d lewat pola nama kolom
    var ks = Object.keys(d || {});
    for (var i = 0; i < res.length; i++) for (var j = 0; j < ks.length; j++) {
      var v = d[ks[j]]; if (res[i].test(ks[j]) && !(not && not.test(ks[j])) && v !== '' && v != null && isFinite(Number(v))) return Number(v);
    }
    return NaN;
  }
  function dlt(d, kw) { return fz(d, [new RegExp('(delta|change|chg|perubahan|growth|vs_?kemarin|trend).*(' + kw + ')'), new RegExp('(' + kw + ').*(delta|change|chg|perubahan|growth|vs_?kemarin|trend)')]); }
  var MK = { 'Total Stok Hari Ini': 'k_tot', 'Delivery Hari Ini': 'k_dv', 'Stok Available': 'k_av', 'Total Planning Produksi': 'k_pl', 'Total Pallet': 'k_pa', 'Hari Ketahanan Stok': 'k_dy',
    'Total kuantitas terkirim': 'f_total', 'Rata-rata freshness SLED saat kirim': 'f_fresh', 'SLA (Service Level Agreement)': 'f_sla', 'Warehouse Throughput': 'f_thr', 'Dead Stock / Near-Expired Risk': 'f_risk', 'Batch Traceability Rate': 'f_trace',
    'Total Pengiriman': 'l_total', 'Rata-rata Durasi Loading': 'l_dur', 'Ekspedisi Aktif': 'l_eksp', 'SLA Loading': 'l_sla', 'Konsentrasi Ekspedisi': 'l_konsen', 'Utilisasi Kendaraan': 'l_util' };
  function kpCard(c, label, val, sub, dl, extra) {
    var up = dl > 0, ch = isFinite(dl) ? '<span class="dl ' + (up ? 'up' : 'dn') + '">' + (up ? '▲' : '▼') + ' ' + n(Math.abs(dl), 1) + '%</span>' : '', mk = arguments[6] || MK[label];
    return '<div class="kp ' + (extra || '') + (mk ? ' clk' : '') + '" style="--kc:' + c + '"' + (mk ? ' role="button" tabindex="0" data-m="' + mk + '" aria-label="' + esc(label) + ' — lihat 10 data teratas"' : '') + '><div class="kh"><small>' + esc(label) + '</small>' + ch + '</div><b>' + val + '</b>' + (sub ? '<span>' + sub + '</span>' : '') + '</div>';
  }
  // ---------- hitung KPI dari data stok (v_stok_terbaru + v_stok_vs_kirim) ----------
  function tblCalc(st) {
    var it = st && st.items; if (!it || !it.length) return null;
    var items = it.map(function (o) {
      var y = o.kirim_hari_ini + o.kirim_besok + o.product_planning;
      return { name: o.item_code, desc: o.produk, s: o.stok_hari_ini, y: y, d: o.kirim_hari_ini, b: o.kirim_besok, p: o.product_planning, a: o.stok_available, q: o.qty_per_pallet, h: o.hari_cukup, r: o.rata2_kirim_per_hari, st: o.status || '', u: o.stok_hari_ini > 0 ? y / o.stok_hari_ini : NaN };
    });
    var tot = sum(items, function (o) { return o.s; }), avl = sum(items, function (o) { return o.a; }), rt = sum(items, function (o) { return o.r; }),
      pa = sum(items, function (o) { return o.q > 0 ? o.s / o.q : 0; });
    return { st: st, items: items, cap: st.capacity_pallet, k: {
      tot: tot, dv: sum(items, function (o) { return o.d; }), av: avl, pl: sum(items, function (o) { return o.p; }), pa: pa,
      nopa: items.filter(function (o) { return o.s > 0 && !(o.q > 0); }).length, dy: rt > 0 ? avl / rt : NaN,
      cr: items.filter(function (o) { return /^KRITIS/i.test(o.st); }).length, id: items.filter(function (o) { return !(o.d + o.b > 0); }).length } };
  }
  function srcNote(T) {
    if (S.stkSt === 'load') return '<div class="sm src">Memuat data stok…</div>';
    if (S.stkSt && S.stkSt.indexOf('err:') === 0) return '<div class="note" style="margin:0 0 12px"><b>Data stok belum bisa dibaca.</b><div style="margin:4px 0 8px">' + esc(S.stkSt.slice(4)) + '</div><button class="chip" data-a="stk">Coba lagi</button></div>';
    return T ? '<div class="sm src">Sumber: <b>' + esc(T.st.table) + '</b> · upload ' + esc(String(T.st.upload_date || '-')) + ' · ' + n(T.items.length) + ' SKU</div>' : '';
  }
  function stockKpis(d, T) {
    var NOT = /pct|persen|delta|change|chg|trend/, k = T ? T.k : {}, pick = function (a, b) { return isFinite(a) ? a : b; },
      tot = pick(k.tot, Number(d.total_stock_unit)), dv = pick(k.dv, NaN), av = pick(k.av, NaN), pl = pick(k.pl, NaN), pa = pick(k.pa, NaN), nopa = pick(k.nopa, NaN),
      dy = pick(fz(d, [/ketahanan|stock_?days|days_?cover|cover.*days|hari_?stok|stok_?hari/], /sku|kritis|idle|critical/), k.dy), cr = pick(fz(d, [/kritis|critical/], /pct/), k.cr), id = pick(fz(d, [/idle/], /pct/), k.id),
      cv = fz(d, [/(forecast|akurasi).*(sku|cover|tercakup)/, /sku.*(cover|tercakup|forecast)/], /pct/), nSku = T ? T.items.length : Number(d.total_sku);
    var cards = [
      kpCard('#1FB6A6', 'Total Stok Hari Ini', n(tot), 'unit pack/sct/tin', dlt(d, 'stock|stok')),
      kpCard('#2FBF8A', 'Delivery Hari Ini', n(dv), 'kirim terjadwal hari ini', dlt(d, 'deliver|kirim')),
      kpCard('#FF5C6C', 'Forecast Accuracy', isFinite(Number(d.forecast_accuracy_pct)) ? pct(d.forecast_accuracy_pct) : '-', isFinite(cv) && isFinite(nSku) ? n(cv) + ' dari ' + n(nSku) + ' SKU tercakup' : '', dlt(d, 'forecast|akurasi')),
      kpCard('#4F7BFF', 'Stok Available', n(av), 'setelah komitmen kirim', dlt(d, 'available|tersedia')),
      kpCard('#9A86FF', 'Total Planning Produksi', n(pl), 'kebutuhan produksi', dlt(d, 'planning')),
      kpCard('#FFB020', 'Total Pallet', isFinite(pa) ? n(pa) + '<em> pallet</em>' : '-', isFinite(nopa) && nopa > 0 ? n(nopa) + ' SKU belum ada data qty/pallet' : '', dlt(d, 'pallet')),
      kpCard('#1FB6A6', 'Hari Ketahanan Stok', isFinite(dy) ? n(dy, 1) + '<em> hari</em>' : '-', (isFinite(cr) ? n(cr) + ' Kritis' : '') + (isFinite(cr) && isFinite(id) ? ' · ' : '') + (isFinite(id) ? n(id) + ' SKU idle' : ''), dlt(d, 'ketahanan|days|hari'), 'wide')
    ];
    return '<div class="kps">' + cards.join('') + '</div>' + srcNote(T);
  }
  function stockAnalysis(d, T) {
    var k = T ? T.k : {}, it = T ? T.items : [], pa = k.pa, cap = T ? Number(T.cap) : NaN, u = isFinite(pa) && cap > 0 ? pa / cap * 100 : Number(d.capacity_util_pct),
      byCode = function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; }, nm = function (a) { return a.slice(0, 5).map(function (o) { return o.name; }).join(', ') + (a.length > 5 ? ', dll' : ''); },
      th = it.filter(function (o) { return o.u > 0.7 && o.u <= 1; }).sort(byCode), idl = it.filter(function (o) { return o.s > 0 && !(o.y > 0); }).sort(byCode),
      safe = Number(d.safe_sku), ts = Number(d.total_sku), hp = Number(d.health_pct), ptxt = it.filter(function (o) { return o.s > 0 && !(o.q > 0); }).length;
    var b1 = isFinite(u) ? (isFinite(pa) ? 'Total stok saat ini membutuhkan ≈ <b class="r">' + n(pa) + ' pallet</b>' + (cap > 0 ? ' dari kapasitas gudang FG ' + n(cap) + ' pallet' : '') + ' (<b class="r">' + n(u, 1) + '% terpakai</b>). ' : 'Utilisasi kapasitas gudang <b class="r">' + n(u, 1) + '%</b>. ') + (ptxt ? n(ptxt) + ' SKU belum punya data qty/pallet. ' : '') + (u >= 100 ? 'Kapasitas gudang sudah terlampaui — pertimbangkan relokasi atau pengiriman segera.' : u >= 85 ? 'Kapasitas gudang mendekati penuh — pantau pengiriman berikutnya.' : 'Kapasitas gudang masih memadai.') : 'Data kapasitas belum tersedia.';
    var wait = !it.length ? (S.stkSt === 'load' ? 'Memuat data stok…' : 'Data per SKU belum tersedia.') : '';
    var b2 = wait || (th.length ? '<b class="o">' + n(th.length) + ' item</b> mendekati batas kebutuhan: ' + esc(nm(th)) + '. Perlu dipantau untuk pengiriman berikutnya.' : 'Tidak ada SKU yang mendekati batas kebutuhan.');
    var b3 = wait || (idl.length ? '<b class="g">' + n(idl.length) + ' item</b> tidak punya rencana delivery maupun planning — berpotensi slow-moving atau mendekati kedaluwarsa: ' + esc(nm(idl)) + '.' : 'Tidak ada SKU idle.');
    var b4 = isFinite(safe) && isFinite(ts) ? '<b class="b">' + n(safe) + ' dari ' + n(ts) + ' SKU' + (isFinite(hp) ? ' (' + n(hp, 1) + '%)' : '') + '</b> dalam kondisi Aman. <b class="b">' + n(ts - safe) + ' item</b> memerlukan perhatian (gabungan kekurangan, menipis, dan idle) — prioritaskan berdasarkan urgensi gap dan tanggal pengiriman.' : 'Data kesehatan stok belum tersedia.';
    var bl = function (c, t, h) { return '<div class="an" style="--ac:' + c + '"><b>' + t + '</b><p>' + h + '</p></div>'; };
    return '<div class="card"><h4>Analisa System</h4>' + bl('#FF5C6C', 'Kapasitas gudang vs kebutuhan pallet', b1) + bl('#FFB020', 'Stok menipis (utilisasi &gt; 70%)', b2) + bl('#8E93B8', 'Stok idle / tanpa permintaan', b3) + bl('#4F7BFF', 'Kesehatan stok keseluruhan', b4) + '</div>';
  }
  function kfmt(v) { var a = Math.abs(v); return a >= 1000 ? (Math.round(v / 100) / 10) + 'k' : String(Math.round(v)); }
  function regress(pts) {
    var m = pts.length, sx = 0, sy = 0, i; if (m < 3) return null;
    for (i = 0; i < m; i++) { sx += pts[i][0]; sy += pts[i][1]; }
    var mx = sx / m, my = sy / m, sxx = 0, sxy = 0, syy = 0;
    for (i = 0; i < m; i++) { sxx += (pts[i][0] - mx) * (pts[i][0] - mx); sxy += (pts[i][0] - mx) * (pts[i][1] - my); syy += (pts[i][1] - my) * (pts[i][1] - my); }
    if (!sxx) return null;
    var b = sxy / sxx, a = my - b * mx, ss = 0, res = [];
    for (i = 0; i < m; i++) { var e = pts[i][1] - (a + b * pts[i][0]); res.push(e); ss += e * e; }
    return { a: a, b: b, r2: syy ? 1 - ss / syy : 0, sd: Math.sqrt(ss / m), res: res };
  }
  function pickKey(x0, res) { var ks = Object.keys(x0 || {}); for (var i = 0; i < res.length; i++) for (var j = 0; j < ks.length; j++) if (res[i].test(ks[j]) && isFinite(Number(x0[ks[j]]))) return ks[j]; return null; }
  function scatter(T, r) {
    var head4 = '<div class="card"><h4>Deteksi SKU Outlier — Stok vs Kebutuhan</h4><div class="sm" style="margin:-6px 0 12px">Korelasi seluruh SKU antara stok dan total kebutuhan, dengan regresi linear untuk mendeteksi item slow-moving/overstock.</div>';
    var P = [], from = '';
    if (T && T.items.some(function (o) { return isFinite(o.y); })) { P = T.items.filter(function (o) { return isFinite(o.y); }).map(function (o) { return [o.s, o.y, o.name]; }).slice(0, 500); from = 'tabel stok'; }
    else if (r.length) {
      var kx = pickKey(r[0], [/^stok_hari_ini$/, /^stok$/, /^stock$/, /stok.*hari_?ini/, /^stok_available$/, /stok|stock/]), ky = pickKey(r[0], [/^total_kebutuhan$/, /kebutuhan/, /total.*(kirim|plan|demand)/, /demand/, /kirim/]);
      if (kx && ky && kx !== ky) { P = r.map(function (x) { return [Number(x[kx]), Number(x[ky]), skuName(x)]; }).filter(function (p) { return isFinite(p[0]) && isFinite(p[1]); }).slice(0, 500); from = 'stok_vs_kirim'; }
    }
    if (!P.length) return head4 + '<div class="sm">' + (S.stkSt === 'load' ? 'Memuat tabel stok…' : 'Kolom stok / kebutuhan belum ditemukan' + (T ? ' di tabel ' + esc(T.st.table) + ' ' : '') + '.') + '</div></div>';
    var g = regress(P);
    if (!g) return head4 + '<div class="sm">Data belum cukup untuk regresi.</div></div>';
    var W = 340, H = 250, L = 38, R = 10, T = 10, B = 34, xmx = Math.max.apply(0, P.map(function (p) { return p[0]; })) * 1.08 || 1, ymx = Math.max.apply(0, P.map(function (p) { return p[1]; })) * 1.12 || 1, ymn = Math.min(0, Math.min.apply(0, P.map(function (p) { return p[1]; })));
    var X = function (v) { return L + v / xmx * (W - L - R); }, Y = function (v) { return T + (1 - (v - ymn) / (ymx - ymn)) * (H - T - B); }, o = '', i, t;
    for (i = 0; i <= 4; i++) { t = ymn + (ymx - ymn) * i / 4; o += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(t) + '" y2="' + Y(t) + '" stroke="rgba(255,255,255,.09)"/><text x="' + (L - 5) + '" y="' + (Y(t) + 3) + '" text-anchor="end" font-size="9" fill="#9AA3D6">' + kfmt(t) + '</text>'; }
    for (i = 0; i <= 4; i++) { t = xmx * i / 4; o += '<line y1="' + T + '" y2="' + (H - B) + '" x1="' + X(t) + '" x2="' + X(t) + '" stroke="rgba(255,255,255,.09)"/><text x="' + X(t) + '" y="' + (H - B + 13) + '" text-anchor="middle" font-size="9" fill="#9AA3D6">' + kfmt(t) + '</text>'; }
    o += '<text x="' + (L + (W - L - R) / 2) + '" y="' + (H - 4) + '" text-anchor="middle" font-size="9.5" fill="#9AA3D6">Stok Hari Ini</text><text transform="translate(9 ' + (T + (H - T - B) / 2) + ') rotate(-90)" text-anchor="middle" font-size="9.5" fill="#9AA3D6">Total Kebutuhan</text>';
    var pts = '', out = 0;
    P.forEach(function (p, j) { var x = X(p[0]), y = Y(p[1]); if (g.res[j] < -g.sd) { out++; pts += '<rect x="' + (x - 3.6) + '" y="' + (y - 3.6) + '" width="7.2" height="7.2" fill="#FFA11E"><title>' + esc(p[2]) + '</title></rect>'; } else pts += '<circle cx="' + x + '" cy="' + y + '" r="3.6" fill="#4F7BFF" fill-opacity=".9"><title>' + esc(p[2]) + '</title></circle>'; });
    var x1 = Math.min.apply(0, P.map(function (p) { return p[0]; })), x2 = Math.max.apply(0, P.map(function (p) { return p[0]; }));
    o += '<line x1="' + X(x1) + '" y1="' + Y(g.a + g.b * x1) + '" x2="' + X(x2) + '" y2="' + Y(g.a + g.b * x2) + '" stroke="#FF5C6C" stroke-width="2" stroke-dasharray="6 4"/>' + pts;
    return head4 + '<div class="lgd"><span><i style="background:#4F7BFF;border-radius:50%"></i>SKU (normal)</span><span><i style="background:#FFA11E"></i>SKU outlier (slow-moving)</span><span><i style="background:none;border-top:2px dashed #FF5C6C;height:0;width:16px"></i>Tren regresi linear</span></div><svg class="ar" viewBox="0 0 ' + W + ' ' + H + '">' + o + '</svg><div class="rg2"><span class="bad">▬ Tren regresi linear · R² = ' + g.r2.toFixed(3).replace('.', ',') + '</span><span class="sm">' + n(P.length) + ' SKU · ' + n(out) + ' outlier</span></div><div class="sm" style="margin-top:6px">Persamaan: y = ' + n(g.b, 3) + 'x ' + (g.a < 0 ? '− ' : '+ ') + n(Math.abs(g.a), 0) + '</div></div>';
  }


  // ---------- Monitoring FEFO: KPI + grafik Posting vs Expired (regresi polinomial derajat 2) ----------
  async function fefLoad(force) {
    if (S.fefSt === 'load' || (!force && S.fef)) return;
    S.fefSt = 'load'; render();
    try { var j = await get('/api/fefo', 58000); S.fef = j.rows || []; S.fefSt = ''; } catch (e) { S.fef = null; S.fefSt = 'err:' + e.message; }
    render();
  }
  var D0 = Date.UTC(2000, 0, 1);
  function dayLbl(d) { var t = new Date(D0 + d * 864e5); return t.toLocaleDateString('id-ID', { month: 'short', timeZone: 'UTC' }) + " '" + String(t.getUTCFullYear()).slice(2); }
  function monLbl(iso) { return new Date(iso + 'T00:00:00Z').toLocaleDateString('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' }); }
  function fefKpi(rows) {
    var t = { q: 0, b: 0, ex: 0, l30: 0, g120: 0, bt: 0 }, mn = Infinity, mx = -Infinity, N = function (v) { v = Number(v); return isFinite(v) ? v : 0; };
    rows.forEach(function (r) {
      t.q += N(r.qty); t.b += N(r.baris); t.ex += N(r.qty_expired); t.l30 += N(r.qty_lt30); t.g120 += N(r.qty_ge120); t.bt += N(r.qty_batch);
      var a = Date.parse(r.min_posting), z = Date.parse(r.max_posting); if (a < mn) mn = a; if (z > mx) mx = z;
    });
    t.days = isFinite(mn) && isFinite(mx) ? Math.round((mx - mn) / 864e5) + 1 : NaN; return t;
  }
  function det3(m) { return m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]); }
  function polyfit2(P) {
    var m = P.length, mx = 0, i; for (i = 0; i < m; i++) mx += P[i][0]; mx /= m;
    var sc = Math.max.apply(0, P.map(function (p) { return Math.abs(p[0] - mx); })) || 1, S1 = 0, S2 = 0, S3 = 0, S4 = 0, T0 = 0, T1 = 0, T2 = 0;
    for (i = 0; i < m; i++) { var u = (P[i][0] - mx) / sc, y = P[i][1]; S1 += u; S2 += u * u; S3 += u * u * u; S4 += u * u * u * u; T0 += y; T1 += u * y; T2 += u * u * y; }
    var A = [[m, S1, S2], [S1, S2, S3], [S2, S3, S4]], d = det3(A); if (!d) return null;
    var col = function (k, v) { return det3(A.map(function (r, ri) { var c = r.slice(); c[k] = v[ri]; return c; })) / d; }, T = [T0, T1, T2], c0 = col(0, T), c1 = col(1, T), c2 = col(2, T);
    var f = function (x) { var u = (x - mx) / sc; return c0 + c1 * u + c2 * u * u; }, my = T0 / m, sr = 0, st = 0;
    for (i = 0; i < m; i++) { sr += Math.pow(P[i][1] - f(P[i][0]), 2); st += Math.pow(P[i][1] - my, 2); }
    return { f: f, r2: st ? 1 - sr / st : 1 };
  }
  function fefNote() {
    if (S.fefSt === 'load') return '<div class="sm src">Memuat data FEFO…</div>';
    if (S.fefSt && S.fefSt.indexOf('err:') === 0) return '<div class="note" style="margin:0 0 12px"><b>Data FEFO belum bisa dibaca.</b><div style="margin:4px 0 8px">' + esc(S.fefSt.slice(4)) + '</div><button class="chip" data-a="fef">Coba lagi</button></div>';
    return S.fef ? '<div class="sm src">Sumber: view <b>v_fefo_monitoring</b> (tabel shipments) · ' + n(S.fef.length) + ' baris agregat</div>' : '';
  }
  function fefBlock() {
    var rows = S.fef, note = fefNote(); if (!rows || !rows.length) return note;
    var K = fefKpi(rows), pc = function (a) { return K.q ? a / K.q * 100 : NaN; }, sla = 100 - pc(K.ex), g = function (c, v) { return '<span style="color:' + c + '">' + v + '</span>'; },
      cards = [
        kpCard('#1FB6A6', 'Total kuantitas terkirim', n(K.q) + '<em> ctn</em>', ''),
        kpCard('#4F7BFF', 'Rata-rata freshness SLED saat kirim', n(pc(K.g120), 1) + '<em>%</em>', 'sisa umur simpan ≥ 120 hari'),
        kpCard('#2FBF8A', 'SLA (Service Level Agreement)', g('#4FD6A0', n(sla, 1) + '<em>%</em>'), n(K.ex) + ' ctn terkirim kedaluwarsa dari ' + n(K.q) + ' ctn total'),
        kpCard('#9A86FF', 'Warehouse Throughput', n(K.q / K.days) + '<em> ctn/hari</em>', n(K.b / K.days) + ' baris pengiriman/hari · ' + n(K.b) + ' baris total'),
        kpCard('#FF5C6C', 'Dead Stock / Near-Expired Risk', g('#FF6B8A', n(pc(K.l30), 1) + '<em>%</em>'), n(K.l30) + ' ctn (Expired + Critical &lt;30 hari)'),
        kpCard('#FFB020', 'Batch Traceability Rate', n(pc(K.bt), 1) + '<em>%</em>', n(pc(K.bt), 0) + '% qty tercatat kode_batch')
      ];
    var sel = S.fsel = S.fsel || { b: 'all', i: 'all' }, mons = [], skus = {};
    rows.forEach(function (r) { if (mons.indexOf(r.bulan) < 0) mons.push(r.bulan); skus[r.kode_sku] = r.nama_produk || ''; });
    mons.sort(); var sk = Object.keys(skus).sort();
    var dd = '<div class="ddrow"><select class="dd" data-fk="b" aria-label="Bulan posting"><option value="all"' + (sel.b === 'all' ? ' selected' : '') + '>Semua bulan</option>' + mons.map(function (m) { return '<option value="' + esc(m) + '"' + (sel.b === m ? ' selected' : '') + '>' + esc(monLbl(m)) + '</option>'; }).join('') + '</select>' +
      '<select class="dd" data-fk="i" aria-label="Item" style="flex:1.4 1 0"><option value="all"' + (sel.i === 'all' ? ' selected' : '') + '>Semua item (agregat)</option>' + sk.map(function (c) { return '<option value="' + esc(c) + '"' + (sel.i === c ? ' selected' : '') + '>' + esc((c + ' — ' + skus[c]).slice(0, 48)) + '</option>'; }).join('') + '</select></div>';
    // titik: per bulan (jika bulan = semua) atau per SKU (jika satu bulan dipilih)
    var grp = {}, order = [];
    rows.forEach(function (r) {
      if ((sel.b !== 'all' && r.bulan !== sel.b) || (sel.i !== 'all' && r.kode_sku !== sel.i)) return;
      var key = sel.b === 'all' ? r.bulan : r.kode_sku, o = grp[key]; if (!o) { o = grp[key] = { q: 0, e: 0, p: 0, k: key }; order.push(key); }
      o.q += Number(r.qty) || 0; o.e += Number(r.qty_x_exp) || 0; o.p += Number(r.qty_x_post) || 0;
    });
    var P = order.map(function (k) { var o = grp[k]; return o.q > 0 ? [o.p / o.q, o.e / o.q, o.k, o.q] : null; }).filter(Boolean).sort(function (a, b) { return a[0] - b[0]; });
    var h = '<div class="card"><h4>Monitoring FEFO (Posting vs Expired)</h4>' + dd;
    if (P.length < 2) return '<div class="kps">' + cards.join('') + '</div>' + note + h + '<div class="sm">Data tidak cukup untuk grafik pada filter ini.</div></div>';
    var fit = P.length >= 4 ? polyfit2(P) : null, W = 340, H = 260, L = 46, R = 12, T = 12, B = 36,
      xs = P.map(function (p) { return p[0]; }), ys = P.map(function (p) { return p[1]; }), xa = Math.min.apply(0, xs), xb = Math.max.apply(0, xs), ya = Math.min.apply(0, ys), yb = Math.max.apply(0, ys);
    var px = (xb - xa || 1) * 0.06, py = (yb - ya || 1) * 0.1; xa -= px; xb += px; ya -= py; yb += py;
    var X = function (v) { return L + (v - xa) / (xb - xa) * (W - L - R); }, Y = function (v) { return T + (1 - (v - ya) / (yb - ya)) * (H - T - B); }, o = '', i, t;
    for (i = 0; i <= 4; i++) { t = ya + (yb - ya) * i / 4; o += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(t) + '" y2="' + Y(t) + '" stroke="rgba(255,255,255,.09)"/><text x="' + (L - 6) + '" y="' + (Y(t) + 3) + '" text-anchor="end" font-size="9" fill="#9AA3D6">' + dayLbl(t) + '</text>'; }
    for (i = 0; i <= 3; i++) { t = xa + (xb - xa) * i / 3; o += '<line y1="' + T + '" y2="' + (H - B) + '" x1="' + X(t) + '" x2="' + X(t) + '" stroke="rgba(255,255,255,.09)"/><text x="' + X(t) + '" y="' + (H - B + 13) + '" text-anchor="middle" font-size="9" fill="#9AA3D6">' + dayLbl(t) + '</text>'; }
    o += '<text x="' + (L + (W - L - R) / 2) + '" y="' + (H - 4) + '" text-anchor="middle" font-size="9.5" fill="#9AA3D6">Bulan posting</text><text transform="translate(10 ' + (T + (H - T - B) / 2) + ') rotate(-90)" text-anchor="middle" font-size="9.5" fill="#9AA3D6">Rata² bulan kedaluwarsa (SLED)</text>';
    if (fit) { var d = '', x; for (i = 0; i <= 60; i++) { x = Math.min(xs[0], xs[0]) + (xs[xs.length - 1] - xs[0]) * i / 60; d += (i ? 'L' : 'M') + X(x).toFixed(1) + ' ' + Y(fit.f(x)).toFixed(1); } o += '<path d="' + d + '" fill="none" stroke="#FF5C6C" stroke-width="2" stroke-dasharray="6 4"/>'; }
    P.forEach(function (p) { o += '<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="4.6" fill="#4F9BFF"><title>' + esc(sel.b === 'all' ? monLbl(p[2]) : p[2]) + ' · ' + n(p[3]) + ' ctn · expired rata-rata ' + dayLbl(p[1]) + '</title></circle>'; });
    h += '<div class="lgd"><span><i style="background:#4F9BFF;border-radius:50%"></i>Posting vs Expired (aktual)</span><span><i style="background:none;border-top:2px dashed #FF5C6C;height:0;width:16px"></i>Tren regresi (derajat 2)</span></div><svg class="ar" viewBox="0 0 ' + W + ' ' + H + '">' + o + '</svg>' +
      '<div class="rg2"><span class="bad">▬ Tren regresi polinomial (derajat 2)' + (fit ? ' · R² = ' + fit.r2.toFixed(3).replace('.', ',') : ' · butuh minimal 4 titik') + '</span></div>' +
      '<div class="sm" style="margin-top:6px">Rata-rata bulan kedaluwarsa (SLED) terhadap bulan posting, dengan tren regresi. ' + (sel.b === 'all' ? 'Satu titik = satu bulan posting.' : 'Satu titik = satu SKU pada bulan terpilih.') + '</div></div>';
    return '<div class="kps">' + cards.join('') + '</div>' + note + h;
  }


  // ---------- Modal Top 10 (klik KPI card) ----------
  async function dimLoad(force) {
    if (S.dimSt === 'load' || (!force && S.fefDim)) return;
    S.dimSt = 'load'; mdlSync();
    try { var j = await get('/api/fefo?v=dim', 58000); S.fefDim = j.rows || []; S.dimSt = ''; } catch (e) { S.fefDim = null; S.dimSt = 'err:' + e.message; }
    mdlSync();
  }
  function nv(v) { v = Number(v); return isFinite(v) ? v : 0; }
  function fmtD(iso) { try { return new Date(iso + 'T00:00:00Z').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return iso; } }
  var DL = { produk: 'Produk', pelanggan: 'Pelanggan', ekspedisi: 'Ekspedisi', provinsi: 'Provinsi', kota: 'Kota tujuan', gudang: 'Gudang', tanggal: 'Hari tersibuk' };
  function fefSpec(key) {
    var D = S.fefDim; if (!D) return { wait: S.dimSt === 'load', err: S.dimSt && S.dimSt.indexOf('err:') === 0 ? S.dimSt.slice(4) : '', retry: 'dim' };
    var M = {
      f_total: { t: 'Total kuantitas terkirim', f: function (r) { return nv(r.qty); }, note: 'Qty (ctn) terkirim terbanyak. Persen = porsi dari total pengiriman.', share: 1, dims: ['produk', 'pelanggan', 'ekspedisi', 'provinsi', 'kota', 'gudang'] },
      f_fresh: { t: 'Freshness SLED saat kirim', f: function (r) { return nv(r.qty) - nv(r.qty_ge120); }, note: 'Qty yang dikirim dengan sisa umur simpan < 120 hari. Persen = porsi dari qty kelompok itu sendiri.', dims: ['produk', 'pelanggan', 'ekspedisi', 'provinsi', 'kota', 'gudang'] },
      f_sla: { t: 'SLA — terkirim kedaluwarsa', f: function (r) { return nv(r.qty_expired); }, note: 'Qty yang sudah kedaluwarsa saat dikirim. Persen = porsi dari qty kelompok itu sendiri.', dims: ['produk', 'pelanggan', 'ekspedisi', 'provinsi', 'kota', 'gudang'] },
      f_thr: { t: 'Warehouse Throughput', f: function (r) { return nv(r.qty); }, note: 'Qty (ctn) terbanyak per hari posting, per gudang, dan per produk.', share: 1, dims: ['tanggal', 'gudang', 'produk'] },
      f_risk: { t: 'Dead Stock / Near-Expired Risk', f: function (r) { return nv(r.qty_lt30); }, note: 'Qty Expired + Critical (sisa umur < 30 hari). Persen = porsi dari qty kelompok itu sendiri.', dims: ['produk', 'pelanggan', 'ekspedisi', 'provinsi', 'kota', 'gudang'] },
      f_trace: { t: 'Batch Traceability Rate', f: function (r) { return nv(r.qty_batch); }, note: 'Qty yang tercatat kode_batch. Persen = porsi dari qty kelompok itu sendiri.', dims: ['produk', 'pelanggan', 'ekspedisi', 'gudang'] }
    }[key];
    if (!M) return null;
    return { title: M.t, sub: 'Top 10 data teratas · sumber tabel shipments', tabs: M.dims.map(function (dm) {
      var L = D.filter(function (r) { return r.dimensi === dm; }), tot = sum(L, function (r) { return nv(M.f(r)); });
      var top = L.map(function (r) { return { r: r, v: M.f(r) }; }).filter(function (x) { return x.v > 0; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 10);
      return { id: dm, label: DL[dm], note: M.note, rows: top.map(function (x) {
        var base = M.share ? tot : nv(x.r.qty);
        return { l: dm === 'tanggal' ? fmtD(x.r.kunci) : String(x.r.label || x.r.kunci), s: dm === 'produk' ? String(x.r.kunci) : n(x.r.baris) + ' baris', v: x.v, x: n(x.v) + ' ctn', p: base > 0 ? n(x.v / base * 100, 1) + '%' : '' };
      }) };
    }) };
  }
  function stkSpec(key) {
    var T = tblCalc(S.stk); if (!T) return { wait: S.stkSt === 'load' || !S.stkSt, err: S.stkSt && S.stkSt.indexOf('err:') === 0 ? S.stkSt.slice(4) : '', retry: 'stk' };
    var I = T.items, defs = [
      { id: 's', label: 'Stok', f: function (o) { return o.s; }, note: 'Stok hari ini per SKU (unit). Persen = porsi dari total stok.' },
      { id: 'd', label: 'Delivery', f: function (o) { return o.d; }, note: 'Delivery terjadwal hari ini per SKU (unit).' },
      { id: 'p', label: 'Planning', f: function (o) { return o.p; }, note: 'Planning produksi per SKU (unit).' },
      { id: 'a', label: 'Available', f: function (o) { return o.a; }, note: 'Stok available setelah komitmen kirim (unit).' },
      { id: 'q', label: 'Pallet', f: function (o) { return o.q > 0 ? o.s / o.q : 0; }, unit: ' pallet', note: 'Kebutuhan pallet = stok ÷ qty per pallet.' },
      { id: 'h', label: 'Paling kritis', asc: 1, f: function (o) { return o.s > 0 && isFinite(o.h) && o.h >= 0 ? o.h : NaN; }, unit: ' hari', note: '10 SKU dengan hari ketahanan stok terendah (hari_cukup), hanya SKU yang punya stok.' },
      { id: 'i', label: 'Idle', f: function (o) { return !(o.d + o.b > 0) ? o.s : 0; }, note: 'SKU tanpa kirim hari ini & besok, diurutkan dari stok terbesar.' }
    ], start = { k_tot: 's', k_dv: 'd', k_pl: 'p', k_av: 'a', k_pa: 'q', k_dy: 'h' }[key];
    var titles = { k_tot: 'Total Stok Hari Ini', k_dv: 'Delivery Hari Ini', k_pl: 'Total Planning Produksi', k_av: 'Stok Available', k_pa: 'Total Pallet', k_dy: 'Hari Ketahanan Stok' };
    var tabs = defs.map(function (df) {
      var tot = df.asc ? 0 : sum(I, function (o) { return df.f(o) || 0; }), L = I.map(function (o) { return { o: o, v: df.f(o) }; }).filter(function (x) { return df.asc ? isFinite(x.v) : x.v > 0; });
      L.sort(function (a, b) { return df.asc ? a.v - b.v : b.v - a.v; });
      return { id: df.id, label: df.label, note: df.note, crit: df.asc, rows: L.slice(0, 10).map(function (x) {
        return { l: x.o.name, s: String(x.o.desc || ''), v: x.v, x: n(x.v, df.asc || df.unit ? 1 : 0) + (df.unit || ''), p: df.asc ? String(x.o.st || '').toLowerCase() : tot > 0 ? n(x.v / tot * 100, 1) + '%' : '' };
      }) };
    });
    if (key === 'k_pa') tabs.push({ id: 'n', label: 'Tanpa data pallet', note: 'SKU yang punya stok tapi belum ada qty/pallet di master produk (stok terbesar).', rows: I.filter(function (o) { return o.s > 0 && !(o.q > 0); }).sort(function (a, b) { return b.s - a.s; }).slice(0, 10).map(function (o) { return { l: o.name, s: String(o.desc || ''), v: o.s, x: n(o.s) + ' unit', p: '' }; }) });
    return { title: titles[key], sub: 'Top 10 data teratas · sumber ' + esc(T.st.table || 'v_stok_terbaru'), tabs: tabs, start: start };
  }
  function mdlSpec() {
    var k = S.mdl && S.mdl.k; if (!k) return null;
    var sp = k.charAt(0) === 'f' ? fefSpec(k) : k.charAt(0) === 'l' ? logSpec(k) : k.charAt(0) === 'b' ? bizSpec(k) : stkSpec(k); return sp;
  }
  function mdlHtml(sp) {
    var head = '<div class="mhd"><div><h3 id="mdlT">' + esc(sp.title || (S.mdl.k.charAt(0) === 'f' ? 'Detail FEFO' : S.mdl.k.charAt(0) === 'l' ? 'Detail logistik' : 'Detail stok')) + '</h3><small>' + (sp.sub || 'Top 10 data teratas') + '</small></div><button class="mcl" data-mx="1" aria-label="Tutup">×</button></div>';
    if (sp.kv) {
      var mt = sp.meter ? '<div class="mtr"><div class="mtb"><i style="width:' + Math.max(2, Math.min(100, sp.meter.p / 160 * 100)).toFixed(1) + '%;background:' + sp.meter.c + '"></i><u style="left:' + (90 / 160 * 100) + '%"></u><u style="left:' + (110 / 160 * 100) + '%"></u></div><div class="mtl"><span>0%</span><span>90%</span><span>110%</span><span>160%+</span></div></div>' : '';
      return head + '<div class="mbd">' + mt + sp.kv.map(function (p) { return '<div class="kvr"><span>' + esc(p[0]) + '</span><b>' + p[1] + '</b></div>'; }).join('') + '</div><div class="mft">' + (sp.note || '') + '</div>';
    }
    if (!sp.tabs) {
      var body = sp.err ? '<div class="note" style="margin:0"><b>Data belum bisa dibaca.</b><div style="margin:4px 0 8px">' + esc(sp.err) + '</div><button class="chip" data-a="' + sp.retry + '">Coba lagi</button></div>' : '<div class="sm" style="padding:18px 0">Memuat data…</div>';
      return head + '<div class="mbd">' + body + '</div>';
    }
    var cur = S.mdl.t || sp.start || sp.tabs[0].id, tab = sp.tabs.filter(function (t) { return t.id === cur; })[0] || sp.tabs[0], mx = Math.max.apply(0, tab.rows.map(function (r) { return tab.crit ? 30 : r.v; })) || 1;
    var tabs = '<div class="mtabs" role="tablist">' + sp.tabs.map(function (t) { return '<button role="tab" aria-selected="' + (t.id === tab.id) + '" data-mt="' + t.id + '"' + (t.id === tab.id ? ' class="on"' : '') + '>' + esc(t.label) + '</button>'; }).join('') + '</div>';
    var list = tab.rows.length ? tab.rows.map(function (r, i) {
      return '<div class="mr"><span class="rk">' + (i + 1) + '</span><div class="mi"><b>' + esc(r.l) + '</b>' + (r.s ? '<small>' + esc(r.s) + '</small>' : '') + '<span class="mbar' + (tab.crit ? ' crit' : '') + '"><u style="width:' + Math.max(3, Math.min(100, r.v / mx * 100)).toFixed(1) + '%"></u></span></div><div class="mv"><b>' + esc(r.x) + '</b>' + (r.p ? '<small>' + esc(r.p) + '</small>' : '') + '</div></div>';
    }).join('') : '<div class="sm" style="padding:18px 0">Tidak ada data pada kategori ini.</div>';
    return head + tabs + '<div class="mbd">' + list + '</div><div class="mft">' + esc(tab.note || '') + '</div>';
  }
  function mdlSync() {
    var el = document.getElementById('mdl'), sp = mdlSpec();
    if (!sp) { if (el) el.remove(); document.body.style.overflow = ''; return; }
    var html = '<div class="mbk" data-mx="1"></div><div class="msh">' + mdlHtml(sp) + '</div>';
    if (!el) { el = document.createElement('div'); el.id = 'mdl'; el.className = 'mdl in'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'mdlT'); document.body.appendChild(el); document.body.style.overflow = 'hidden'; el.innerHTML = html; var cb = el.querySelector('.mcl'); if (cb) cb.focus(); return; }
    var bd = el.querySelector('.mtabs'), sx = bd ? bd.scrollLeft : 0; el.innerHTML = html; bd = el.querySelector('.mtabs'); if (bd) bd.scrollLeft = sx;
  }
  function openM(key) {
    S.mdl = { k: key, t: '' }; mdlSync();
    if (key.charAt(0) === 'f') dimLoad(); else if (key.charAt(0) === 'b') { /* data sudah dimuat bersama seksi */ } else if (key.charAt(0) === 'l') { if (!S.log && S.logSt !== 'load') logLoad(); } else if (!S.stk && S.stkSt !== 'load') stkLoad();
  }


  // ---------- Monitoring Logistik ----------
  async function logLoad(force) {
    if (S.logSt === 'load' || (!force && S.log)) return;
    S.logSt = 'load'; render();
    try { var j = await get('/api/logistics', 58000); S.log = { dim: j.dim || [], peran: j.peran || [] }; S.logSt = ''; } catch (e) { S.log = null; S.logSt = 'err:' + e.message; }
    render(); mdlSync();
  }
  function fDur(m, long) {
    m = Math.round(Number(m)); if (!isFinite(m)) return '-';
    var h = Math.floor(m / 60), r = m % 60;
    return long ? (h ? h + ' jam ' : '') + r + ' mnt' : (h ? h + 'j ' : '') + r + 'm';
  }
  function logNote() {
    if (S.logSt === 'load') return '<div class="sm src">Memuat data logistik…</div>';
    if (S.logSt && S.logSt.indexOf('err:') === 0) return '<div class="note" style="margin:0 0 12px"><b>Data logistik belum bisa dibaca.</b><div style="margin:4px 0 8px">' + esc(S.logSt.slice(4)) + '</div><button class="chip" data-a="log">Coba lagi</button></div>';
    return '';
  }
  function logAgg(L) {
    var by = function (dm) { return L.dim.filter(function (r) { return r.dimensi === dm; }); }, T = by('tanggal'), E = by('ekspedisi'), V = by('kendaraan'), N = nv;
    var n0 = sum(T, function (r) { return N(r.trips); }), sm = sum(T, function (r) { return N(r.sum_menit); }), top = E.slice().sort(function (a, b) { return N(b.trips) - N(a.trips); })[0];
    return { by: by, n: n0, hari: T.length, eksp: E.length, kend: V.length, avg: n0 ? sm / n0 : NaN,
      mn: T.length ? Math.min.apply(0, T.map(function (r) { return N(r.min_menit); })) : NaN, mx: T.length ? Math.max.apply(0, T.map(function (r) { return N(r.max_menit); })) : NaN,
      c: sum(T, function (r) { return N(r.n_cepat); }), sd: sum(T, function (r) { return N(r.n_sedang); }), l: sum(T, function (r) { return N(r.n_lambat); }), top: top };
  }
  function roleTbl(L, peran) {
    var m = {}, tot = 0;
    L.peran.forEach(function (r) { if (r.peran !== peran) return; var k = r.nama, o = m[k] || (m[k] = { nama: k, t: 0, ar: {} }), q = nv(r.tugas); o.t += q; tot += q; var a = /^(BWB|C20|C40)$/i.test(r.armada) ? String(r.armada).toUpperCase() : 'LAIN'; o.ar[a] = (o.ar[a] || 0) + q; });
    var arr = Object.keys(m).map(function (k) { return m[k]; });
    return { list: arr, avg: arr.length ? tot / arr.length : 0 };
  }
  function stackRows(rows, segs, mx, avg) {
    return rows.map(function (o) {
      var bar = segs.map(function (sg) { var v = o.seg[sg.k] || 0; return v ? '<i style="width:' + (v / mx * 100).toFixed(2) + '%;background:' + sg.c + '" title="' + esc(sg.l) + ': ' + v + '"></i>' : ''; }).join('');
      return '<div class="wr"><span class="wn">' + esc(o.nama) + '</span><div class="wt"><div class="wb">' + bar + '</div><u class="avg" style="left:' + (avg / mx * 100).toFixed(2) + '%"></u></div><b>' + n(o.t) + '</b></div>';
    }).join('');
  }
  function legend(segs, avg) { return '<div class="lgd">' + segs.map(function (sg) { return '<span><i style="background:' + sg.c + '"></i>' + esc(sg.l) + '</span>'; }).join('') + '<span><i style="background:none;border-top:2px dashed #fff;height:0;width:16px"></i>Rata-rata beban kerja (' + n(avg, 1) + ')</span></div>'; }
  function topBlock(title, ico, R) {
    var arr = R.list.slice().sort(function (a, b) { return b.t - a.t || (a.nama < b.nama ? -1 : 1); }), top = arr.slice(0, 3), low = arr.slice().sort(function (a, b) { return a.t - b.t || (a.nama < b.nama ? -1 : 1); }).slice(0, 3);
    var med = ['#FFB020', '#C5CAE0', '#C98A52'];
    return '<div class="card"><h4>' + ico + ' ' + esc(title) + '</h4><div class="trh2">🏆 Top 3 Achievement</div>' + top.map(function (o, i) {
      var d = o.t - R.avg, p = R.avg ? d / R.avg * 100 : 0;
      return '<div class="tp"><span class="rk" style="background:' + med[i] + ';color:#1B1305">' + (i + 1) + '</span><div><b>' + esc(o.nama) + '</b><small class="up">' + (d >= 0 ? '+' : '') + n(d, 1) + ' tugas dari rata-rata peran (' + (p >= 0 ? '+' : '') + n(p, 0) + '%)</small></div><span class="tv">' + n(o.t) + ' tugas</span></div>';
    }).join('') + '<div class="trh2" style="color:#FF6B8A">▼ 3 Terendah</div>' + low.map(function (o, i) {
      return '<div class="tp low"><span class="rk">' + (i + 1) + '</span><div><b>' + esc(o.nama) + '</b></div><span class="tv">' + n(o.t) + ' tugas</span></div>';
    }).join('') + '</div>';
  }
  function logBlock() {
    var L = S.log, note = logNote(); if (!L || !L.dim.length) return note;
    var A = logAgg(L), pct = function (v) { return A.n ? v / A.n * 100 : NaN; }, sla = pct(A.c + A.sd), topShare = A.top ? nv(A.top.trips) / A.n * 100 : NaN, g = function (c, v) { return '<span style="color:' + c + '">' + v + '</span>';  };
    var cards = [
      kpCard('#FFB020', 'Total Pengiriman', n(A.n) + '<em> unit</em>', n(A.hari) + ' hari pemantauan'),
      kpCard('#FFB020', 'Rata-rata Durasi Loading', fDur(A.avg), 'in → out, seluruh pengiriman'),
      kpCard('#FFB020', 'Ekspedisi Aktif', n(A.eksp) + '<em> perusahaan</em>', 'mitra ekspedisi berbeda'),
      kpCard('#FF5C6C', 'SLA Loading', g(sla >= 80 ? '#4FD6A0' : '#FF6B8A', n(sla, 0) + '<em>%</em>'), n(A.c + A.sd) + ' dari ' + n(A.n) + ' pengiriman ≤90 mnt'),
      kpCard('#FFB020', 'Konsentrasi Ekspedisi', n(topShare, 0) + '<em>%</em>', A.top ? esc(A.top.kunci) + ' — ' + n(A.top.trips) + ' dari ' + n(A.n) + ' pengiriman' : ''),
      kpCard('#FFB020', 'Utilisasi Kendaraan', n(A.n / A.kend, 1) + '<em> trip/unit</em>', n(A.kend) + ' kendaraan unik menangani ' + n(A.n) + ' pengiriman')
    ];
    var seg3 = [['Cepat', A.c, '#34C9AE', '≤60 mnt'], ['Sedang', A.sd, '#FFB020', '61–90 mnt'], ['Lambat', A.l, '#FF5F5C', '>90 mnt (lewat SLA)']];
    var ring = '<div class="card"><h4>Ringkasan Durasi Loading</h4><div class="sm" style="margin:-6px 0 12px">Sekilas pandang sebelum masuk ke detail per pengiriman.</div><div class="ms3"><div><small>Rata-rata durasi</small><b>' + fDur(A.avg, 1) + '</b></div><div><small>Tercepat</small><b>' + fDur(A.mn, 1) + '</b></div><div><small>Terlama</small><b>' + fDur(A.mx, 1) + '</b></div></div>' +
      '<div class="sm" style="margin:12px 0 8px">Dari ' + n(A.n) + ' pengiriman, dikelompokkan berdasarkan kecepatan loading (target SLA: 90 mnt)</div><div class="sbar">' + seg3.map(function (x) { return x[1] ? '<span style="flex:' + x[1] + ';background:' + x[2] + '">' + n(pct(x[1]), 0) + '%</span>' : ''; }).join('') + '</div>' +
      '<div class="lgd" style="margin-top:10px">' + seg3.map(function (x) { return '<span><i style="background:' + x[2] + '"></i>' + x[0] + ' · ' + n(x[1]) + ' pengiriman · ' + x[3] + '</span>'; }).join('') + '</div></div>';
    var P = roleTbl(L, 'picker'), M = roleTbl(L, 'muat'), F = roleTbl(L, 'stuffing');
    var pr = P.list.map(function (o) { return { nama: o.nama, t: o.t, seg: { BWB: o.ar.BWB, C20: o.ar.C20, C40: o.ar.C40, LAIN: o.ar.LAIN } }; }).sort(function (a, b) { return b.t - a.t; }).slice(0, 10), pAvg = pr.length ? sum(pr, function (o) { return o.t; }) / pr.length : 0;
    var S1 = [{ k: 'BWB', l: 'BWB', c: '#34C9AE' }, { k: 'C20', l: 'C20', c: '#FFB020' }, { k: 'C40', l: 'C40', c: '#FF5F5C' }, { k: 'LAIN', l: 'Lainnya', c: '#8E93B8' }];
    var mm = {}; M.list.forEach(function (o) { mm[o.nama] = mm[o.nama] || { nama: o.nama, m: 0, f: 0 }; mm[o.nama].m += o.t; }); F.list.forEach(function (o) { mm[o.nama] = mm[o.nama] || { nama: o.nama, m: 0, f: 0 }; mm[o.nama].f += o.t; });
    var mac = Object.keys(mm).map(function (k) { var o = mm[k]; return { nama: o.nama, t: o.m + o.f, seg: { M: o.m, F: o.f } }; }).sort(function (a, b) { return b.t - a.t; }).slice(0, 10), mAvg = mac.length ? sum(mac, function (o) { return o.t; }) / mac.length : 0;
    var S2 = [{ k: 'M', l: 'Muat', c: '#FFB020' }, { k: 'F', l: 'Stuffing', c: '#34C9AE' }];
    var yam = '<div class="card"><h4>Yamazumi Chart — Beban Kerja Picker</h4><div class="sm" style="margin:-6px 0 12px">Tugas per picker distack per jenis armada, garis putus-putus = rata-rata beban kerja (10 teratas).</div>' + (pr.length ? '<div class="wl">' + stackRows(pr, S1, Math.max.apply(0, pr.map(function (o) { return o.t; })) * 1.05, pAvg) + '</div>' + legend(S1, pAvg) : '<div class="sm">Belum ada data picker.</div>') + '</div>';
    var macc = '<div class="card"><h4>Multiple Activity Chart — Tim Muat &amp; Stuffing</h4><div class="sm" style="margin:-6px 0 12px">Breakdown aktivitas Muat vs Stuffing per personel, garis putus-putus = rata-rata beban kerja (10 teratas).</div>' + (mac.length ? '<div class="wl">' + stackRows(mac, S2, Math.max.apply(0, mac.map(function (o) { return o.t; })) * 1.05, mAvg) + '</div>' + legend(S2, mAvg) : '<div class="sm">Belum ada data muat/stuffing.</div>') + '</div>';
    return '<div class="kps">' + cards.join('') + '</div>' + note + ring + yam + macc + topBlock('PICKER', '🏷️', P) + topBlock('TIM MUAT', '📦', M) + topBlock('TIM STUFFING', '🚛', F) +
      '<div class="sm src">Sumber: tabel logistics (' + n(A.n) + ' pengiriman, ' + n(A.hari) + ' hari). Durasi negatif (jam keluar &lt; jam masuk) ditambah 24 jam seperti dashboard desktop.</div>';
  }
  function logSpec(key) {
    var L = S.log; if (!L) return { wait: S.logSt === 'load' || !S.logSt, err: S.logSt && S.logSt.indexOf('err:') === 0 ? S.logSt.slice(4) : '', retry: 'log' };
    var A = logAgg(L), N = nv, avgOf = function (r) { return N(r.trips) ? N(r.sum_menit) / N(r.trips) : 0; };
    var LB = { ekspedisi: 'Ekspedisi', provinsi: 'Provinsi', kota: 'Kota', armada: 'Armada', driver: 'Driver', kendaraan: 'Kendaraan', tanggal: 'Hari tersibuk' };
    var M = {
      l_total: { t: 'Total Pengiriman', dims: ['ekspedisi', 'provinsi', 'kota', 'armada', 'driver', 'kendaraan', 'tanggal'], f: function (r) { return N(r.trips); }, x: function (v) { return n(v) + ' pengiriman'; }, p: function (r, v) { return n(v / A.n * 100, 1) + '%'; }, note: 'Jumlah pengiriman terbanyak. Persen = porsi dari seluruh pengiriman.' },
      l_dur: { t: 'Rata-rata Durasi Loading', dims: ['ekspedisi', 'provinsi', 'armada', 'driver', 'kendaraan'], f: avgOf, min: 5, x: function (v) { return fDur(v, 1); }, p: function (r) { return n(r.trips) + ' pengiriman'; }, note: 'Rata-rata durasi loading terlama. Hanya kelompok dengan minimal 5 pengiriman.' },
      l_eksp: { t: 'Ekspedisi Aktif', dims: ['ekspedisi'], f: function (r) { return N(r.trips); }, x: function (v) { return n(v) + ' pengiriman'; }, p: function (r, v) { return n(v / A.n * 100, 1) + '%'; }, note: 'Ekspedisi dengan pengiriman terbanyak.' },
      l_sla: { t: 'SLA Loading — melewati 90 mnt', dims: ['ekspedisi', 'provinsi', 'armada', 'driver', 'kendaraan'], f: function (r) { return N(r.n_lambat); }, x: function (v) { return n(v) + ' lambat'; }, p: function (r, v) { return n(v / N(r.trips) * 100, 0) + '% dari ' + n(r.trips); }, note: 'Jumlah pengiriman dengan loading > 90 menit. Persen = porsi dari pengiriman kelompok itu sendiri.' },
      l_konsen: { t: 'Konsentrasi Ekspedisi', dims: ['ekspedisi', 'provinsi'], f: function (r) { return N(r.trips); }, x: function (v) { return n(v) + ' pengiriman'; }, p: function (r, v) { return n(v / A.n * 100, 1) + '%'; }, note: 'Porsi pengiriman terbesar. Persen = porsi dari seluruh pengiriman.' },
      l_util: { t: 'Utilisasi Kendaraan', dims: ['kendaraan', 'armada', 'driver'], f: function (r) { return N(r.trips); }, x: function (v) { return n(v) + ' trip'; }, p: function (r, v) { return n(v / A.n * 100, 1) + '%'; }, note: 'Kendaraan / armada / driver dengan trip terbanyak.' }
    }[key];
    if (!M) return null;
    return { title: M.t, sub: 'Top 10 data teratas · sumber tabel logistics', tabs: M.dims.map(function (dm) {
      var rs = A.by(dm).filter(function (r) { return !M.min || N(r.trips) >= M.min; }).map(function (r) { return { r: r, v: M.f(r) }; }).filter(function (x) { return x.v > 0; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 10);
      return { id: dm, label: LB[dm], note: M.note, rows: rs.map(function (x) { return { l: dm === 'tanggal' ? fmtD(x.r.kunci) : String(x.r.kunci), s: dm === 'tanggal' ? '' : n(x.r.trips) + ' pengiriman · rata-rata ' + fDur(avgOf(x.r), 1), v: x.v, x: M.x(x.v), p: M.p(x.r, x.v) }; }) };
    }) };
  }


  // ---------- Analisa Biaya tenaga kerja per karton (mengikuti dashboard desktop) ----------
  var BST = { Efisien: '#34C9AE', Efektif: '#6FA8FF', Boros: '#FF6B8A' };
  // Data cost labour manual per bulan (dipakai bila view belum memuat nilainya).
  var BMAN = { '2026-09': { cost_labour: 225839895, total_labour: 45 } };
  function bFill(x) {
    var m = BMAN[String(x.bulan).slice(0, 7)];
    if (!m || (x.cost_labour != null && Number(x.cost_labour) > 0)) return x;
    var y = {}, k; for (k in x) y[k] = x[k];
    y.cost_labour = m.cost_labour; y.total_labour = m.total_labour;
    var d = Number(y.total_delivery), tg = Number(y.target_rp);
    if (d > 0) {
      y.biaya_per_carton = m.cost_labour / d;
      if (tg > 0) { y.pct_dari_target = y.biaya_per_carton / tg * 100; y.status_efisiensi = y.pct_dari_target <= 90 ? 'Efisien' : y.pct_dari_target > 110 ? 'Boros' : 'Efektif'; }
    }
    return y;
  }
  function bHas(r) { return r.map(bFill).sort(function (a, b) { return a.bulan < b.bulan ? -1 : 1; }); }
  function bOk(x) { return x.biaya_per_carton != null && isFinite(Number(x.biaya_per_carton)); }
  function bShort(iso) { try { return new Date(String(iso).slice(0, 10) + 'T00:00:00Z').toLocaleDateString('id-ID', { month: 'short', year: '2-digit', timeZone: 'UTC' }); } catch (e) { return String(iso).slice(0, 7); } }
  function bMid(iso) { try { return new Date(String(iso).slice(0, 10) + 'T00:00:00Z').toLocaleDateString('id-ID', { month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return String(iso).slice(0, 7); } }
  function bLong(iso) { return monLbl(String(iso).slice(0, 10)); }
  function bPick(rs, kind) {
    var ok = rs.filter(bOk); if (!ok.length) return null;
    if (kind === 'now') return ok[ok.length - 1];
    return ok.reduce(function (a, x) { return (kind === 'hi' ? Number(x.biaya_per_carton) > Number(a.biaya_per_carton) : Number(x.biaya_per_carton) < Number(a.biaya_per_carton)) ? x : a; });
  }
  function biayaView(r) {
    var rs = bHas(r), ok = rs.filter(bOk); if (!ok.length) return '<div class="note">Belum ada bulan dengan data cost labour.</div>';
    var cur = bPick(rs, 'now'), hi = bPick(rs, 'hi'), lo = bPick(rs, 'lo'), avg = sum(ok, function (x) { return Number(x.biaya_per_carton); }) / ok.length, tg = Number(cur.target_rp);
    var st = function (x) { return '<span style="color:' + (BST[x.status_efisiensi] || '#9AA3D6') + '">' + esc(x.status_efisiensi || '') + '</span>'; };
    // insight untuk manajemen (dihitung dari data bulan terbaru yang terisi)
    var prv = ok.length > 1 ? ok[ok.length - 2] : null, dl = Number(cur.total_delivery), cl = Number(cur.cost_labour), hc = Number(cur.total_labour), bc = Number(cur.biaya_per_carton), up = 1.1, bcUp = cl / (dl * up);
    var li = [];
    li.push('<li><b>Evaluasi Efisiensi:</b> Biaya tenaga muat ' + esc(bLong(cur.bulan)) + ' sebesar Rp ' + n(bc, 0) + ' per karton (' + n(cur.pct_dari_target, 1) + '% dari target Rp ' + n(tg, 0) + ')' + (prv ? ', ' + (bc < Number(prv.biaya_per_carton) ? 'turun' : 'naik') + ' Rp ' + n(Math.abs(bc - Number(prv.biaya_per_carton)), 0) + ' dibanding ' + esc(bLong(prv.bulan)) : '') + '. Jika bulan depan total kirim naik 10% menjadi ' + n(dl * up) + ' karton tetapi cost labour tetap stabil di Rp ' + n(cl) + ', maka <i>biaya per karton</i> turun menjadi sekitar Rp ' + n(bcUp, 0) + ' (gudang menjadi lebih efisien). Sebaliknya, jika volume turun sementara cost tetap, biaya per karton naik.</li>');
    if (hc > 0 && dl > 0) {
      var pc = dl / hc, cc = cl / hc, pp = prv && Number(prv.total_labour) > 0 ? Number(prv.total_delivery) / Number(prv.total_labour) : NaN;
      li.push('<li><b>Kapasitas Kerja:</b> Dengan ' + n(hc) + ' karyawan, rata-rata tiap orang menangani ' + n(pc, 0) + ' karton per bulan' + (isFinite(pp) ? ' (' + esc(bLong(prv.bulan)) + ': ' + n(pp, 0) + ' karton/orang)' : '') + ' dengan biaya Rp ' + n(cc, 0) + ' per karyawan. Jika karton per karyawan menurun atau biaya per karton terlalu tinggi, evaluasi apakah proses muat terlalu lama atau apakah jumlah ' + n(hc) + ' orang terlalu banyak untuk volume kirim yang ada.</li>');
    }
    var intro = '<div class="card"><h4>Cara membaca angka ini untuk manajemen (analisis)</h4><ul class="ins">' + li.join('') + '</ul><div class="sm" style="margin-top:8px">Status: Efisien jika biaya ≤ 90% target · Efektif ±10% target · Boros jika &gt; 110% target.</div></div>';
    var cards = '<div class="kps">' +
      kpCard(BST[cur.status_efisiensi] || '#FFB020', bMid(cur.bulan), 'Rp ' + n(cur.biaya_per_carton, 0), st(cur) + ' · target ' + idr(cur.target_rp), NaN, '', 'b_now') +
      kpCard('#4F7BFF', 'Rata-rata', 'Rp ' + n(avg, 0), n(ok.length) + ' bulan dengan data cost labour', NaN, '', 'b_avg') +
      kpCard('#FF5C6C', 'Tertinggi', 'Rp ' + n(hi.biaya_per_carton, 0), bMid(hi.bulan) + ' · ' + st(hi), NaN, '', 'b_hi') +
      kpCard('#2FBF8A', 'Terendah', 'Rp ' + n(lo.biaya_per_carton, 0), bMid(lo.bulan) + ' · ' + st(lo), NaN, '', 'b_lo') + '</div>';
    // grafik batang
    var W = 340, H = 232, T = 26, B = 50, pad = 6, m = rs.length, sl = (W - pad * 2) / m, bw = Math.min(30, sl * 0.62), mx = Math.max.apply(0, ok.map(function (x) { return Number(x.biaya_per_carton); }).concat([tg || 0])) * 1.12, base = H - B;
    var Y = function (v) { return base - v / mx * (base - T); }, o = '';
    if (tg) o += '<line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + Y(tg) + '" y2="' + Y(tg) + '" stroke="rgba(255,255,255,.45)" stroke-dasharray="4 4"/>';
    o += '<line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + base + '" y2="' + base + '" stroke="rgba(255,255,255,.15)"/>';
    rs.forEach(function (x, i) {
      var cx = pad + sl * i + sl / 2, has = bOk(x), c = BST[x.status_efisiensi] || '#6FA8FF', v = has ? Number(x.biaya_per_carton) : 0, y = Y(v);
      o += '<g data-m="b_m:' + esc(String(x.bulan).slice(0, 10)) + '" role="button" tabindex="0" aria-label="' + esc(bLong(x.bulan)) + ': ' + (has ? 'Rp ' + n(v, 0) + ' ' + esc(x.status_efisiensi || '') : 'belum ada data') + '" style="cursor:pointer">' +
        (has ? '<rect x="' + (cx - bw / 2) + '" y="' + y + '" width="' + bw + '" height="' + (base - y) + '" rx="4" fill="' + c + '" fill-opacity=".92"/><text x="' + cx + '" y="' + (y - 5) + '" text-anchor="middle" font-size="9.5" font-weight="700" fill="#fff">' + n(v, 0) + '</text>' : '<text x="' + cx + '" y="' + (base - 6) + '" text-anchor="middle" font-size="12" fill="#9AA3D6">—</text>') +
        '<text x="' + cx + '" y="' + (base + 14) + '" text-anchor="middle" font-size="9" fill="#C9CFF0">' + esc(bShort(x.bulan).replace(' ', ' ')) + '</text><text x="' + cx + '" y="' + (base + 27) + '" text-anchor="middle" font-size="8" font-weight="700" fill="' + (has ? c : '#6B74A8') + '">' + (has ? esc(x.status_efisiensi || '') : '') + '</text><rect x="' + (cx - sl / 2) + '" y="0" width="' + sl + '" height="' + H + '" fill="transparent"/></g>';
    });
    var chart = '<div class="card"><h4>Biaya per karton per bulan (Rp)</h4><svg class="ar" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Grafik biaya per karton per bulan">' + o + '</svg><div class="sm clg"><span>Ketuk batang atau baris bulan untuk melihat detail.</span>' + (tg ? '<span class="tgl"><i></i>Target Rp ' + n(tg, 0) + '</span>' : '') + '</div></div>';
    // tabel detail per bulan (format sama dengan dashboard desktop)
    var trs = rs.map(function (x) {
      var has = bOk(x), c = BST[x.status_efisiensi] || '#9AA3D6', p = Number(x.pct_dari_target), key = esc(String(x.bulan).slice(0, 10));
      var st = has ? '<span class=\"bs\" style=\"color:' + c + ';background:' + c + '22\">' + esc(x.status_efisiensi || '') + '</span>' : '<span class=\"bs bs0\">—</span>';
      return '<tr role=\"button\" tabindex=\"0\" data-m=\"b_m:' + key + '\" aria-label=\"Detail ' + esc(bLong(x.bulan)) + '\">' +
        '<td class=\"bt-m\">' + esc(bMid(x.bulan)) + '</td>' +
        '<td>' + n(x.total_delivery) + '</td>' +
        '<td>' + (has ? 'Rp ' + n(x.cost_labour) : '—') + '</td>' +
        '<td>' + (has ? n(x.total_labour) : '—') + '</td>' +
        '<td>' + (has ? 'Rp ' + n(x.biaya_per_carton, 0) : '—') + '</td>' +
        '<td>Rp ' + n(x.target_rp, 0) + '</td>' +
        '<td>' + (has && isFinite(p) ? n(p, 1) + '%' : '—') + '</td>' +
        '<td>' + st + '</td></tr>';
    }).join('');
    var list = '<div class=\"card\"><h4>Detail per bulan</h4><div class=\"btw\"><table class=\"bt\"><thead><tr><th>Bulan</th><th>Total kirim (karton)</th><th>Cost labour</th><th>Rata² karyawan/bulan</th><th>Biaya/karton</th><th>Target</th><th>% target</th><th>Status</th></tr></thead><tbody>' + trs + '</tbody></table></div><div class=\"sm\">Geser ke samping untuk melihat semua kolom. Ketuk baris untuk detail bulan.</div></div>';
    return intro + cards + chart + list;
  }
  function bizSpec(key) {
    var rs = bHas(rows('biaya_carton')); if (!rs.length) return null;
    var ok = rs.filter(bOk);
    if (key === 'b_avg') {
      return { title: 'Rata-rata biaya per karton', sub: n(ok.length) + ' bulan dengan data cost labour', tabs: [{ id: 'm', label: 'Per bulan', note: 'Biaya per karton per bulan, diurutkan dari tertinggi. Persen = biaya dibanding target.', rows: ok.slice().sort(function (a, b) { return Number(b.biaya_per_carton) - Number(a.biaya_per_carton); }).map(function (x) { return { l: bLong(x.bulan), s: (x.status_efisiensi || '') + ' · target ' + idr(x.target_rp), v: Number(x.biaya_per_carton), x: 'Rp ' + n(x.biaya_per_carton, 0), p: n(x.pct_dari_target, 1) + '%' }; }) }] };
    }
    var x = key === 'b_now' ? bPick(rs, 'now') : key === 'b_hi' ? bPick(rs, 'hi') : key === 'b_lo' ? bPick(rs, 'lo') : rs.filter(function (z) { return String(z.bulan).slice(0, 10) === key.slice(4); })[0];
    if (!x) return null;
    var has = bOk(x), c = BST[x.status_efisiensi] || '#9AA3D6', tg = Number(x.target_rp), v = Number(x.biaya_per_carton), sel = has && isFinite(tg) ? v - tg : NaN;
    var kv = [['Total kirim (karton)', n(x.total_delivery)], ['Cost labour', has ? 'Rp ' + n(x.cost_labour) : '—'], ['Rata² karyawan / bulan', has ? n(x.total_labour) : '—'], ['Biaya / karton', has ? 'Rp ' + n(v, 2) : '—'], ['Target', 'Rp ' + n(tg, 0)], ['% target', has ? n(x.pct_dari_target, 1) + '%' : '—'], ['Selisih dari target', isFinite(sel) ? (sel > 0 ? '+' : '−') + 'Rp ' + n(Math.abs(sel), 0) + ' / karton' : '—'], ['Status', has ? '<span style="color:' + c + ';font-weight:700">' + esc(x.status_efisiensi || '') + '</span>' : 'Belum diisi']];
    return { title: 'Biaya tenaga kerja — ' + bLong(x.bulan), sub: has ? 'Cost labour ÷ total karton terkirim' : 'Cost labour belum diinput untuk bulan ini', kv: kv, meter: has ? { p: Number(x.pct_dari_target), c: c } : null,
      note: has ? 'Biaya/karton = Rp ' + n(x.cost_labour) + ' ÷ ' + n(x.total_delivery) + ' karton. Efisien ≤ 90% target · Efektif 90–110% · Boros &gt; 110%.' : 'Total kirim ikut data terbaru; cost labour dan rata-rata karyawan diinput manual per bulan.' };
  }

  function detail(k) {
    var d = zone(k), z = Z[k];
    if (!d) return head(z.t, z.s, 1) + '<div class="note">' + esc(zerr(k) || 'Data zona ini belum tersedia.') + '</div><div class="card sm">Tekan tombol segarkan di tengah untuk mencoba lagi.</div>';
    var v = Number(z.main(d)), g = zoneCharts(k, d, z, COL[k]), c = z.raw ? 'warn' : cls(v);
    var isS = k === 'stock', sv = isS ? rows('stok_vs_kirim') : [], T = isS ? (tblCalc(S.stk) || (sv.length ? tblCalc({ rows: sv, table: 'v_stok_vs_kirim', cols: Object.keys(sv[0]) }) : null)) : null, its = z.k.map(function (x) { var y = x[1](d); return y == null || !isFinite(Number(y)) ? null : [x[0], x[2](y, d)]; }).filter(Boolean), tri = isS ? [] : its.slice(1, 4), rest = isS ? [] : its.slice(4), sr = isS ? rows('stok_vs_kirim') : [];
    return head(z.t, z.s, 1) +
      '<div class="dp"><div class="dr"><span class="zi">' + ic(z.i) + '</span><div class="dk"><small>' + z.s + '</small><b>' + n(v, 1) + (z.raw ? '/hari' : '%') + '</b><small>' + z.t + '</small></div></div>' +
      '<div class="ds"><small>Status:</small><span class="pill ' + c + '">' + (z.raw ? 'Aktif' : lbl(v)) + '</span></div><button class="fb" data-a="reload" aria-label="Segarkan">' + ic('ref') + '</button></div>' +
      (isS ? stockKpis(d, T) + stockAnalysis(d, T) + scatter(T, sr) : '') +
      (k === 'fefo' ? fefBlock() : '') +
      (k === 'logistics' ? logBlock() : '') +
      (tri.length ? '<div class="tri">' + tri.map(function (x) { return '<div><small>' + esc(x[0]) + '</small><b>' + esc(x[1]) + '</b></div>'; }).join('') + '</div>' : '') +
      (rest.length ? '<div class="tb"><div class="tbh"><span>Indikator</span><span>Nilai</span></div>' + rest.map(function (x) { return '<div class="tbr"><span>' + esc(x[0]) + '</span><b>' + esc(x[1]) + '</b></div>'; }).join('') + '</div>' : '') +
      g;
  }
  // ---------- Analisis: hanya rekap & grafik ----------
  function auto(r) {   // grafik otomatis untuk bagian yang strukturnya belum dikenal
    var ks = Object.keys(r[0]).filter(function (k) { return r[0][k] !== null && typeof r[0][k] !== 'object'; });
    var isn = function (k) { return r.every(function (x) { return x[k] !== '' && x[k] != null && isFinite(Number(x[k])); }); };
    var lk = ks.filter(function (k) { return /tanggal|date|bulan|periode|minggu|tahun/i.test(k); })[0] || ks.filter(function (k) { return !isn(k); })[0] || ks[0];
    var nk = ks.filter(function (k) { return k !== lk && isn(k) && !/kode|code|^id$|^no$/i.test(k); }), time = /tanggal|date|bulan|periode|minggu|tahun/i.test(lk);
    var fl = function (v) { v = String(v); return /^\d{4}-\d\d-\d\d/.test(v) ? v.slice(5, 10) : v.slice(0, 10); };
    var tl = nk.slice(0, 4).map(function (k) { var avg = /pct|persen|rate|rata|avg/i.test(k), t = sum(r, function (x) { return x[k]; }); return tile(k.replace(/_/g, ' ') + (avg ? ' (rata-rata)' : ' (total)'), n(avg ? t / r.length : t, 1)); }).join('');
    var h = '<div class="tiles">' + tile('Jumlah data', n(r.length)) + tl + '</div>';
    if (!nk.length) return h;
    if (time) {
      var rs = r.slice(-14); h += nk.slice(0, 2).map(function (k, i) { return '<div class="card"><h4>' + esc(k.replace(/_/g, ' ')) + '</h4>' + area(rs.map(function (x) { return Number(x[k]); }), rs.map(function (x) { return fl(x[lk]); }), PAL[i]) + '</div>'; }).join('');
    } else {
      var top = r.slice().sort(function (a, b) { return Number(b[nk[0]]) - Number(a[nk[0]]); }).slice(0, 8), mx = Number(top[0][nk[0]]) || 1;
      h += '<div class="card"><h4>' + esc(nk[0].replace(/_/g, ' ')) + ' tertinggi</h4>' + hbars(top.map(function (x) { return [String(x[lk]).slice(0, 28), 0, n(x[nk[0]], 1), Number(x[nk[0]]) / mx * 100]; }), PAL[1]) + '</div>';
    }
    return h;
  }
  var N = Number, last = function (a) { return a[a.length - 1]; }, mon = function (v) { return String(v).slice(0, 7); }, day = function (v) { return String(v).slice(5, 10); };
  function byDim(r, key) { if (!r[0] || !('dimensi' in r[0])) return [r, '']; var p = pick(key, uq(r, 'dimensi')); return [r.filter(function (x) { return String(x.dimensi) === p[0]; }), p[1]]; }
  function ser(r, x, y) { return group(r, function (o) { return String(o[x]).slice(0, 10); }, function (o) { return o[y]; }).sort(function (a, b) { return a[0] < b[0] ? -1 : 1; }); }
  function lines(r, x, ys, fm) { return ys.map(function (y, i) { var g = ser(r, x, y[0]); return g.length > 1 ? '<div class="card"><h4>' + y[1] + '</h4>' + area(g.map(function (v) { return v[1]; }), g.map(function (v) { return fm(v[0]); }), PAL[i]) + '</div>' : ''; }).join(''); }
  function rank(items, f, c, t, asc) {
    items = items.filter(function (x) { return isFinite(x[1]); }).sort(function (a, b) { return asc ? a[1] - b[1] : b[1] - a[1]; }).slice(0, 8);
    var mx = Math.max.apply(0, items.map(function (x) { return x[1]; })) || 1;
    return items.length ? '<div class="card"><h4>' + t + '</h4>' + hbars(items.map(function (x) { return [String(x[0]).slice(0, 28), 0, f(x[1]), x[1] / mx * 100]; }), c) + '</div>' : '';
  }
  function dn(r, f, t) { var g = group(r, f).slice(0, 6); return '<div class="card"><h4>' + t + '</h4>' + donut(g.map(function (x, i) { return { l: x[0], c: PAL[i], v: x[1] }; }), n(r.length)) + '</div>'; }
  function tls(a) { return '<div class="tiles">' + a.filter(function (x) { return x[1] != null && x[1] !== '-'; }).map(function (x) { return tile(x[0], x[1]); }).join('') + '</div>'; }
  function petaKey() { return Object.keys(S.an || {}).filter(function (x) { return /peta/i.test(x); })[0] || 'peta'; }
  function petaView(r) {
    r = r.filter(function (x) { return x.lat != null && x.lng != null && isFinite(N(x.lat)) && isFinite(N(x.lng)); }); S.pts = null;
    if (!r.length) return '<div class="card"><b>Data peta belum tersedia</b><div class="sm" style="margin-top:6px">API analisis belum mengirim data v_peta_pelanggan (key "peta").</div></div>';
    var tp = 'tipe' in r[0] ? pick('tp', uq(r, 'tipe')) : ['', ''], rr = tp[0] ? r.filter(function (x) { return String(x.tipe) === tp[0]; }) : r; S.pts = rr;
    return tp[1] + tls([['Wilayah', n(rr.length)], ['Pelanggan', n(sum(rr, function (x) { return x.jml_pelanggan; }))], ['Total qty', n(sum(rr, function (x) { return x.total_qty; }))]]) + '<div id="map" class="map"></div>' + rank(rr.map(function (x) { return [x.label, N(x.total_qty)]; }), function (v) { return n(v); }, PAL[0], 'Wilayah dengan qty terbesar');
  }
  function initMap() {
    var el = $('map'); if (!el || !window.L || !S.pts) return;
    var m = L.map(el); L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap' }).addTo(m);
    var mx = Math.max.apply(0, S.pts.map(function (x) { return N(x.total_qty); })) || 1, b = [];
    S.pts.forEach(function (x) { var p = [N(x.lat), N(x.lng)]; b.push(p); L.circleMarker(p, { radius: 6 + Math.sqrt(N(x.total_qty) / mx) * 16, color: '#14201A', weight: 1, fillColor: '#9CC94B', fillOpacity: .65 }).addTo(m).bindPopup('<b>' + esc(x.label) + '</b><br>' + n(x.total_qty) + ' qty · ' + n(x.jml_pelanggan) + ' pelanggan'); });
    m.fitBounds(b, { padding: [20, 20], maxZoom: 9 });
  }
  function an() {
    var s = anBody(), P1 = '<select class="dd" data-sk', i = s.indexOf(P1); if (i < 0) return s;
    var j = s.indexOf('</select>', i) + 9, e = s.indexOf('</select>', j) + 9;
    if (s.indexOf('<select class="dd" data-pk', j) === j && e > j) return s.slice(0, i) + '<div class="ddrow">' + s.slice(i, e) + '</div>' + s.slice(e);
    return s.slice(0, i) + '<div class="ddrow">' + s.slice(i, j) + '</div>' + s.slice(j);
  }
  function anBody() {
    var h = head('Analisis', 'Rekap & prediksi', 1);
    h += '<select class="dd" data-sk="1" aria-label="Pilih bagian analisis">' + SEC.map(function (t) { return '<option value="' + t[0] + '"' + (S.sub === t[0] ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</select>';
    var k = S.sub, r = rows(k === 'peta' ? petaKey() : k), q, g, L; if (k === 'peta') return h + (r.length ? petaView(r) : secState('peta')); if (!r.length) return h + secState(k);
    if (k === 'armada') { q = pick('per', uq(r, 'periode')); var ra = r.filter(function (x) { return String(x.periode) === q[0]; }); return h + q[1] + tls([['Total karton', n(sum(ra, function (x) { return x.total_karton; }))], ['Total m³', n(sum(ra, function (x) { return x.total_m3; }))], ['Total ton', n(sum(ra, function (x) { return x.total_ton; }), 1)], ['Jumlah gudang', n(uq(ra, 'whs').length)]]) + armadaCharts(q[0]); }
    if (k === 'peringatan') return h + alertDonut() + '<div class="card"><h4>Teratas</h4>' + r.slice(0, 5).map(al).join('') + '</div>';
    if (k === 'prioritas') return h + tls([['SKU prioritas', n(r.length)], ['Dampak m³', n(sum(r, function (x) { return x.dampak_m3; }))]]) + dn(r, function (x) { return x.aksi || '-'; }, 'Berdasarkan aksi') + rank(r.map(function (x) { return [x.produk || x.kode_sku, N(x.hari_cukup_prediksi)]; }), function (v) { return n(v, 1) + ' hr'; }, '#D14343', 'Stok paling cepat habis', 1);
    if (k === 'tren' || k === 'shipments_ringkas') {
      q = byDim(r, k); var y = k === 'tren' ? [['qty_per_hari', 'Qty per hari'], ['m3_per_hari', 'm³ per hari']] : [['qty', 'Qty per bulan'], ['m3', 'm³ per bulan']]; g = ser(q[0], 'bulan', y[0][0]);
      if (g.length) { var pv = g.length > 1 ? g[g.length - 2][1] : 0; return h + q[1] + tls([['Bulan terakhir', mon(last(g)[0])], [y[0][1], n(last(g)[1])], ['Pertumbuhan MoM', pv ? pct((last(g)[1] - pv) / pv * 100) : null]]) + lines(q[0], 'bulan', y, mon); }
    }
    if (k === 'harian') { q = r.slice().sort(function (a, b) { return a.tanggal < b.tanggal ? -1 : 1; }).slice(-14); return h + tls([['Total qty', n(sum(q, function (x) { return x.qty; }))], ['Total trip', n(sum(q, function (x) { return x.trip; }))], ['Total m³', n(sum(q, function (x) { return x.m3; }))]]) + lines(q, 'tanggal', [['qty', 'Qty per hari'], ['trip', 'Trip per hari']], day); }
    if (k === 'durasi_ringkas') { q = byDim(r, k); return h + q[1] + tls([['Total trip', n(sum(q[0], function (x) { return x.jumlah_trip; }))], ['Trip lama', n(sum(q[0], function (x) { return x.jumlah_lama; }))]]) + rank(q[0].map(function (x) { return [x.kunci, N(x.rata2_durasi_menit)]; }), hm, PAL[2], 'Rata-rata durasi terlama'); }
    if (k === 'pareto') { q = byDim(r, k); return h + q[1] + rank(q[0].map(function (x) { return [x.nama || x.kunci, N(x.porsi_pct)]; }), pct, PAL[1], 'Kontribusi terbesar') + dn(q[0], function (x) { return x.kelas || '-'; }, 'Sebaran kelas'); }
    if (k === 'biaya_carton' && r[0].bulan) return h + biayaView(r);
    if (k === 'estimasi_budget') { L = r[0]; var it = [['Proyeksi terendah', N(L.proyeksi_biaya_rp_terendah)], ['Proyeksi', N(L.proyeksi_biaya_rp)], ['Proyeksi tertinggi', N(L.proyeksi_biaya_rp_tertinggi)], ['Budget ideal', N(L.budget_ideal_rp)]].filter(function (x) { return isFinite(x[1]); }), mx = Math.max.apply(0, it.map(function (x) { return x[1]; })) || 1; return h + tls([['Proyeksi qty 22 hari', n(L.proyeksi_qty_22hari)], ['Rata-rata biaya / carton', idr(L.rata2_biaya_per_carton)]]) + '<div class="card"><h4>Estimasi biaya bulan depan</h4>' + hbars(it.map(function (x) { return [x[0], 0, idr(x[1]), x[1] / mx * 100]; }), PAL[0]) + '</div>'; }
    if (k === 'kendaraan') { L = r[0]; return h + tls([['Kebutuhan kendaraan', n(L.kebutuhan_kendaraan)], ['Qty karton', n(L.qty_karton)], ['m³ rencana', n(L.m3_plan)], ['Rata-rata trip / hari', n(L.rata2_trip_per_hari, 1)]]) + '<div class="card"><h4>Dibutuhkan vs rata-rata historis</h4>' + hbars([['Dibutuhkan hari ini', 0, n(L.kebutuhan_kendaraan), N(L.kebutuhan_kendaraan) / (Math.max(N(L.kebutuhan_kendaraan), N(L.rata2_trip_per_hari)) || 1) * 100], ['Rata-rata trip / hari', 0, n(L.rata2_trip_per_hari, 1), N(L.rata2_trip_per_hari) / (Math.max(N(L.kebutuhan_kendaraan), N(L.rata2_trip_per_hari)) || 1) * 100]], PAL[1]) + '</div>'; }
    if (k === 'prediksi') return h + tls([['SKU diprediksi', n(r.length)], ['Proyeksi qty 22 hari', n(sum(r, function (x) { return x.proyeksi_qty_22hari; }))]]) + dn(r, function (x) { return x.status_prediksi || '-'; }, 'Status prediksi') + rank(r.map(function (x) { return [x.produk, N(x.kekurangan_22hari)]; }).filter(function (x) { return x[1] > 0; }), function (v) { return n(v); }, '#D14343', 'Kekurangan stok 22 hari');
    if (k === 'stok_vs_kirim') return h + tls([['SKU', n(r.length)], ['Stok tersedia', n(sum(r, function (x) { return x.stok_available; }))]]) + dn(r, function (x) { return x.status || '-'; }, 'Status stok') + rank(r.map(function (x) { return [x.produk, N(x.hari_cukup)]; }).filter(function (x) { return x[1] >= 0; }), function (v) { return n(v, 1) + ' hr'; }, '#D14343', 'Stok paling cepat habis', 1);
    if (k === 'sku_belum_master') return h + tls([['SKU bermasalah', n(r.length)]]) + dn(r, function (x) { return x.masalah || x.sumber || '-'; }, 'Jenis masalah');
    return h + auto(r);
  }
  function me() {
    return head('Profil', 'Akun & pengaturan', 1) + '<div class="card"><div class="av">' + esc((S.email[0] || 'U').toUpperCase()) + '</div><div class="sm">Masuk sebagai</div><b>' + esc(S.email || '-') + '</b></div><div class="card pf"><button data-a="reload"><span>Muat ulang data</span>' + ic('chev') + '</button><a href="' + DESKTOP_URL + '"><span>Buka versi desktop</span>' + ic('chev') + '</a><button data-a="out" class="bad"><span>Keluar</span>' + ic('chev') + '</button></div>';
  }
  function render() {
    $('main').innerHTML = S.v === 'home' ? home() : S.v === 'an' ? an() : S.v === 'me' ? me() : detail(S.v.slice(2));
    var on = function (v) { return S.v === v ? ' class="on"' : ''; };
    var NAV = [['home', 'home', 'Dashboard'], ['an', 'chart', 'Analysis'], ['z:fefo', 'clock', 'Fefo'], ['z:stock', 'box', 'Monitoring'], ['z:logistics', 'truck', 'Logistik']];
    $('nav').innerHTML = NAV.map(function (x) { return '<button data-v="' + x[0] + '"' + on(x[0]) + ' aria-label="' + x[2] + '">' + ic(x[1]) + '<span>' + x[2] + '</span></button>'; }).join('');
    var c = document.querySelector('.seg .on'); if (c && c.scrollIntoView) c.scrollIntoView({ inline: 'center', block: 'nearest' });
    initMap();
    mdlSync();
  }
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t.classList || !t.classList.contains('dd')) return;
    if (t.dataset.pk) { S.pk[t.dataset.pk] = t.value; render(); }
    else if (t.dataset.sk) { S.sub = t.value; render(); ens(); }
    else if (t.dataset.fk) { S.fsel = S.fsel || { b: 'all', i: 'all' }; S.fsel[t.dataset.fk] = t.value; render(); }
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-m],[data-mt],[data-mx],[data-v],[data-s],[data-a],[data-p]'); if (!t) return;
    if (t.dataset.mx) { S.mdl = null; mdlSync(); return; }
    if (t.dataset.mt) { if (S.mdl) { S.mdl.t = t.dataset.mt; mdlSync(); } return; }
    if (t.dataset.m) { openM(t.dataset.m); return; }
    if (t.dataset.p) { var pp = t.dataset.p.split('|'); S.pk[pp[0]] = pp.slice(1).join('|'); render(); }
    else if (t.dataset.v) { if (t.dataset.s) S.sub = t.dataset.s; S.v = t.dataset.v; render(); window.scrollTo(0, 0); ens(); }
    else if (t.dataset.s) { S.sub = t.dataset.s; render(); ens(); }
    else if (t.dataset.a === 'reload') load();
    else if (t.dataset.a === 'retry') secLoad(S.sub, 1);
    else if (t.dataset.a === 'stk') stkLoad(1);
    else if (t.dataset.a === 'fef') fefLoad(1);
    else if (t.dataset.a === 'dim') dimLoad(1);
    else if (t.dataset.a === 'log') logLoad(1);
    else if (t.dataset.a === 'stkT') { var iv = (document.getElementById('stkT') || {}).value || ''; iv = iv.trim().replace(/^public\./, ''); if (/^\w+$/.test(iv)) { try { localStorage.setItem('scm_stk_t', iv); } catch (e) {} stkLoad(1); } }
    else if (t.dataset.a === 'out') { sessionStorage.removeItem('scm_face_ok'); try { localStorage.removeItem(CK); } catch (e) {} window.scmSupabase.auth.signOut().then(function () { location.replace('/'); }); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && S.mdl) { S.mdl = null; mdlSync(); return; }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('[role="button"][data-m]')) { e.preventDefault(); openM(e.target.closest('[data-m]').dataset.m); }
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && Date.now() - (S.last || 0) > 60000) load(); });
  restore(); render(); load();
})();
