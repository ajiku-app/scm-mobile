(function () {
  var DESKTOP_URL = 'https://scm-control.vercel.app/index.html'; // ganti bila alamat versi desktop berubah
  var $ = function (id) { return document.getElementById(id); };
  var S = { v: 'home', sub: 'armada', kpi: null, an: null, anErr: '', email: '', ok: false, at: '', pk: {} }, uid = 0;
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
  var COL = { stock: '#F29BA6', logistics: '#E8C04A', fefo: '#6FB1E6', warehouse: '#9CC94B' };
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
  async function zoneLoad(k, tries) {
    S.kpi = S.kpi || { zones: {} };
    try {
      var v = await get('/api/kpi/' + k);
      if (v.status === 'live' && v.data) { S.kpi.zones[k] = { status: 'live', data: v.data, error: null }; render(); return; }
      throw new Error(v.error || 'Gagal memuat zona');
    } catch (e) {
      if (tries > 0) { await new Promise(function (r) { setTimeout(r, 1500); }); return zoneLoad(k, tries - 1); }
      if (!zone(k)) S.kpi.zones[k] = { status: 'error', data: null, error: e.message };   // data tersimpan tetap dipakai bila ada
      render();
    }
  }
  async function anLoad(t) { try { S.an = (await get('/api/analisis', 65000)).data; S.anErr = ''; } catch (e) { if (t == null) return anLoad(1); S.anErr = e.message; } render(); }
  async function load() {
    if (S.busy) return; S.busy = 1;
    var f = document.querySelector('.fab'); if (f) f.classList.add('spin');
    try {
      await window.SCM_AUTH_READY;
      var s = await window.scmSupabase.auth.getSession();
      S.email = (s.data.session && s.data.session.user.email) || '';
      await Promise.all(Object.keys(Z).map(function (k) { return zoneLoad(k, 1); }).concat(anLoad()));
      S.ok = Object.keys(Z).some(zone); S.stale = 0; S.at = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }); save();
    } catch (e) { S.ok = false; S.anErr = e.message; }
    S.busy = 0; S.last = Date.now(); render(); f = document.querySelector('.fab'); if (f) f.classList.remove('spin');
  }

  function status() { return '<span class="chip"><span class="dot' + (S.ok ? '' : ' err') + '"></span>' + (S.ok ? 'Online' : 'Offline') + '</span>'; }
  function tg(t) { var k = /krit|high|tinggi/i.test(t) ? 'bad' : /peringat|warn|sedang/i.test(t) ? 'warn' : ''; return '<span class="chip ' + k + '">' + esc(t) + '</span>'; }
  function gauge(v, color) {
    var C = 2 * Math.PI * 44, a = C * 0.75, f = isFinite(v) ? a * Math.min(100, Math.max(0, v)) / 100 : 0;
    return '<svg class="gauge" viewBox="0 0 120 120"><g transform="rotate(135 60 60)"><circle cx="60" cy="60" r="44" fill="none" stroke="rgba(20,32,26,.12)" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + a + ' ' + C + '"/><circle cx="60" cy="60" r="44" fill="none" stroke="' + color + '" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + f + ' ' + C + '"/></g><text x="60" y="66" text-anchor="middle" font-size="22" font-weight="800" fill="#14201A">' + (isFinite(v) ? Math.round(v) : '-') + '</text></svg>';
  }
  function head(title, sub, back) {
    var cnt = S.an && S.an.peringatan ? S.an.peringatan.length : 0;
    return '<div class="hd"><button class="rb" data-v="' + (back ? 'home' : 'an') + '" data-s="' + (back ? '' : 'peringatan') + '" aria-label="' + (back ? 'Kembali' : 'Peringatan') + '">' + ic(back ? 'back' : 'bell') + (!back && cnt ? '<i>' + Math.min(99, cnt) + '</i>' : '') + '</button><div class="t"><b>' + title + '</b><small>' + sub + '</small></div><button class="rb" data-v="me" aria-label="Profil">' + ic('user') + '</button></div>';
  }
  function tile(label, val) { return '<div class="tl"><small>' + esc(label) + '</small><b>' + esc(val) + '</b></div>'; }
  function tiles(k) {
    var d = zone(k); if (!d) return '';
    return Z[k].k.map(function (x) { var v = x[1](d); return v == null || !isFinite(Number(v)) ? '' : tile(x[0], x[2](v, d)); }).join('');
  }
  function al(r) {
    var k = /krit|high|tinggi/i.test(r.tingkat) ? 'bad' : /peringat|warn|sedang/i.test(r.tingkat) ? 'warn' : '';
    return '<div class="it"><span class="ico ' + k + '">' + ic('warn') + '</span><div><b>' + esc(r.judul) + '</b><small>' + esc(r.detail).slice(0, 90) + '</small></div>' + tg(r.tingkat) + '</div>';
  }
  function errNote() {
    var m = S.busy ? [] : Object.keys(Z).filter(function (k) { return !zone(k); }).map(function (k) { return '<b>' + Z[k].t + ':</b> ' + esc((zerr(k) || 'belum ada data').slice(0, 140)); });
    return m.length ? '<div class="note">' + m.join('<br>') + '</div>' : '';
  }

  // ---------- grafik (SVG/CSS murni, tanpa library) ----------
  function ring(v, c, sz, txt) {
    var C = 2 * Math.PI * 40, f = isFinite(v) ? C * Math.min(100, Math.max(0, v)) / 100 : 0;
    return '<svg width="' + sz + '" height="' + sz + '" viewBox="0 0 100 100" style="flex:none"><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(20,32,26,.1)" stroke-width="10"/><circle cx="50" cy="50" r="40" fill="none" stroke="' + c + '" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + f + ' ' + C + '" transform="rotate(-90 50 50)"/><text x="50" y="57" text-anchor="middle" font-size="24" font-weight="800" fill="#14201A">' + (txt || (isFinite(v) ? Math.round(v) : '-')) + '</text></svg>';
  }
  function donut(parts, center) {
    parts = parts.filter(function (p) { return p.v > 0; });
    var tot = parts.reduce(function (a, p) { return a + p.v; }, 0), C = 2 * Math.PI * 38, off = 0;
    if (!tot) return '<div class="sm">Belum ada data.</div>';
    var segs = parts.map(function (p) { var l = C * p.v / tot, s = '<circle cx="50" cy="50" r="38" fill="none" stroke="' + p.c + '" stroke-width="12" stroke-dasharray="' + Math.max(0, l - 2) + ' ' + (C - l + 2) + '" stroke-dashoffset="' + -off + '" transform="rotate(-90 50 50)"/>'; off += l; return s; }).join('');
    return '<div class="dn"><svg width="120" height="120" viewBox="0 0 100 100" style="flex:none"><circle cx="50" cy="50" r="38" fill="none" stroke="rgba(20,32,26,.06)" stroke-width="12"/>' + segs + '<text x="50" y="56" text-anchor="middle" font-size="18" font-weight="800" fill="#14201A">' + esc(center) + '</text></svg><div class="lg">' +
      parts.map(function (p) { return '<div><i style="background:' + p.c + '"></i><span>' + esc(p.l) + '</span><b>' + n(p.v) + '</b></div>'; }).join('') + '</div></div>';
  }
  function area(vals, labs, c) {
    if (vals.length < 2) return '';
    var W = 320, H = 130, p = 10, id = 'g' + (++uid), hi = Math.max.apply(0, vals), lo = Math.min.apply(0, vals), sp = hi - lo || 1, m = vals.length;
    var X = function (i) { return p + i * (W - 2 * p) / (m - 1); }, Y = function (v) { return H - p - (v - lo) / sp * (H - 2 * p - 26); };
    var d = 'M' + X(0) + ' ' + Y(vals[0]); for (var i = 1; i < m; i++) { var mx = (X(i - 1) + X(i)) / 2; d += ' C' + mx + ' ' + Y(vals[i - 1]) + ' ' + mx + ' ' + Y(vals[i]) + ' ' + X(i) + ' ' + Y(vals[i]); }
    var k = vals.indexOf(hi), bx = Math.min(W - 30, Math.max(30, X(k)));
    return '<svg class="ar" viewBox="0 0 ' + W + ' ' + H + '"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c + '" stop-opacity=".45"/><stop offset="1" stop-color="' + c + '" stop-opacity="0"/></linearGradient></defs><path d="' + d + ' L' + X(m - 1) + ' ' + H + ' L' + X(0) + ' ' + H + 'Z" fill="url(#' + id + ')"/><path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="2.500" stroke-linecap="round"/><line x1="' + X(k) + '" x2="' + X(k) + '" y1="22" y2="' + H + '" stroke="rgba(20,32,26,.25)" stroke-dasharray="3 4"/><circle cx="' + X(k) + '" cy="' + Y(hi) + '" r="5" fill="#fff" stroke="' + c + '" stroke-width="3"/><rect x="' + (bx - 28) + '" y="0" width="56" height="20" rx="8" fill="#16211B"/><text x="' + bx + '" y="14" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">' + n(hi, 1) + '</text></svg><div class="xl"><span>' + esc(labs[0]) + '</span><span>' + esc(labs[m - 1]) + '</span></div>';
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
    return [cur, vals.length > 1 ? '<div class="seg">' + vals.map(function (v) { return '<button data-p="' + esc(key + '|' + v) + '"' + (v === cur ? ' class="on"' : '') + '>' + esc(v) + '</button>'; }).join('') + '</div>' : ''];
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
  function home() {
    var vs = ['stock', 'logistics', 'fefo'].map(function (k) { var d = zone(k); return d ? Number(Z[k].main(d)) : NaN; }).filter(isFinite);
    var sc = vs.length ? vs.reduce(function (a, b) { return a + b; }, 0) / vs.length : NaN, al4 = (S.an && S.an.peringatan || []).slice(0, 4);
    return head('SCM Tower', S.at ? (S.stale ? 'Data tersimpan ' : 'Disinkron pukul ') + S.at : 'Memuat data...') +
      '<div class="chips"><span class="chip">Hari ini</span>' + status() + '<span class="chip good">' + esc(S.email.split('@')[0] || 'pengguna') + '</span></div>' +
      '<div class="hero"><div><div class="lb">Skor operasional</div><div class="big">' + (isFinite(sc) ? Math.round(sc) : '-') + '<small>%</small></div><p>' + (isFinite(sc) ? lbl(sc) + ' · dari ' + vs.length + ' dari 3 indikator' : 'Menunggu data') + '</p></div>' + gauge(sc, '#14201A') + '</div>' + errNote() +
      '<div class="card"><h4>Zona operasional</h4>' + Object.keys(Z).map(function (k) {
        var d = zone(k), v = d ? Number(Z[k].main(d)) : NaN, ok = isFinite(v);
        return '<button class="zr" data-v="z:' + k + '"><div class="row"><span>' + Z[k].t + ' · ' + Z[k].s + (d ? '' : ' <i class="tag e">' + (S.busy ? 'Memuat' : 'Gagal') + '</i>') + '</span><b>' + (ok ? n(v, 1) + (Z[k].raw ? '/hari' : '%') : '-') + '</b></div><div class="bar"><i style="width:' + (ok ? Z[k].raw ? 100 : Math.min(100, v) : 0) + '%;background:' + COL[k] + '"></i></div></button>';
      }).join('') + '</div>' +
      '<div class="tiles">' + PICK.map(function (p) { var d = zone(p[0]), x = Z[p[0]].k[p[1]], v = d && x[1](d); return d && v != null && isFinite(Number(v)) ? tile(x[0], x[2](v, d)) : ''; }).join('') + '</div>' +
      armadaCharts() + alertDonut() + '<div class="row" style="margin:16px 4px 10px"><b>Peringatan berjalan</b><button data-v="an" data-s="peringatan" style="border:0;background:none;color:var(--good);font-weight:700;font-size:12px">Lihat semua</button></div>' +
      '<div class="card">' + (al4.length ? al4.map(al).join('') : '<span class="sm">Tidak ada peringatan.</span>') + '</div>';
  }
  function detail(k) {
    var d = zone(k), z = Z[k];
    if (!d) return head(z.t, z.s, 1) + '<div class="note">' + esc(zerr(k) || 'Data zona ini belum tersedia.') + '</div><div class="card sm">Tekan tombol segarkan di tengah untuk mencoba lagi.</div>';
    var v = Number(z.main(d)), g = zoneCharts(k, d, z, COL[k]);
    return head(z.t, z.s, 1) + '<div class="hero"><div><div class="lb">' + z.s + '</div><div class="big">' + n(v, 1) + '<small>' + (z.raw ? '/hari' : '%') + '</small></div><p>' + (z.raw ? 'Pengiriman per hari' : lbl(v)) + '</p></div>' + gauge(z.raw ? NaN : v, '#14201A') + '</div>' +
      '<div class="tiles">' + tiles(k) + '</div>' +
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
    var h = head('Analisis', 'Rekap & prediksi', 1);
    if (!S.an) return h + '<div class="card"><b>Data analisis belum bisa dimuat</b><div class="sm" style="margin-top:6px">' + esc(S.anErr || 'Memuat...') + '</div></div>';
    h += '<div class="seg">' + SEC.map(function (t) { return '<button data-s="' + t[0] + '"' + (S.sub === t[0] ? ' class="on"' : '') + '>' + t[1] + '</button>'; }).join('') + '</div>';
    var k = S.sub, r = rows(k === 'peta' ? petaKey() : k), q, g, L; if (k === 'peta') return h + petaView(r); if (!r.length) return h + '<div class="card sm">Belum ada data untuk bagian ini.</div>';
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
    if (k === 'biaya_carton' && r[0].bulan) { L = last(r.slice().sort(function (a, b) { return a.bulan < b.bulan ? -1 : 1; })); return h + tls([['Biaya / carton', idr(L.biaya_per_carton)], ['Target', idr(L.target_rp)], ['Dari target', isFinite(N(L.pct_dari_target)) ? pct(L.pct_dari_target) : null], ['Status', L.status_efisiensi]]) + lines(r, 'bulan', [['biaya_per_carton', 'Biaya per carton (Rp)']], mon); }
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
    $('nav').innerHTML = '<button data-v="home"' + on('home') + ' aria-label="Beranda">' + ic('home') + '</button><button data-v="an"' + on('an') + ' aria-label="Analisis">' + ic('chart') + '</button><button class="fab" data-a="reload" aria-label="Segarkan">' + ic('ref') + '</button><button data-v="z:logistics"' + on('z:logistics') + ' aria-label="Logistik">' + ic('truck') + '</button><button data-v="me"' + on('me') + ' aria-label="Profil">' + ic('user') + '</button>';
    var c = document.querySelector('.seg .on'); if (c && c.scrollIntoView) c.scrollIntoView({ inline: 'center', block: 'nearest' });
    initMap();
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-v],[data-s],[data-a],[data-p]'); if (!t) return;
    if (t.dataset.p) { var pp = t.dataset.p.split('|'); S.pk[pp[0]] = pp.slice(1).join('|'); render(); }
    else if (t.dataset.v) { if (t.dataset.s) S.sub = t.dataset.s; S.v = t.dataset.v; render(); window.scrollTo(0, 0); }
    else if (t.dataset.s) { S.sub = t.dataset.s; render(); }
    else if (t.dataset.a === 'reload') load();
    else if (t.dataset.a === 'out') { sessionStorage.removeItem('scm_face_ok'); try { localStorage.removeItem(CK); } catch (e) {} window.scmSupabase.auth.signOut().then(function () { location.replace('/'); }); }
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && Date.now() - (S.last || 0) > 60000) load(); });
  restore(); render(); load();
})();
