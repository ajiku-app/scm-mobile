(function () {
  var DESKTOP_URL = 'https://scm-control.vercel.app/index.html'; // ganti bila alamat versi desktop berubah
  var $ = function (id) { return document.getElementById(id); };
  var S = { v: 'home', sub: 'armada', kpi: null, an: null, anErr: '', email: '', ok: false, at: '' };
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
  var COL = { stock: 'var(--pink)', logistics: 'var(--yel)', fefo: 'var(--blu)', warehouse: 'var(--lime2)' };
  var PICK = [['stock', 3], ['stock', 4], ['logistics', 2], ['logistics', 3], ['fefo', 1], ['warehouse', 2]];
  var SEC = [['armada', 'Armada'], ['prioritas', 'Prioritas'], ['peringatan', 'Peringatan'], ['kendaraan', 'Kendaraan'], ['prediksi', 'Prediksi'], ['stok_vs_kirim', 'Stok vs Kirim'], ['tren', 'Tren'], ['harian', 'Harian'], ['durasi_ringkas', 'Durasi truk'], ['shipments_ringkas', 'Pengiriman'], ['pareto', 'Pareto'], ['biaya_carton', 'Biaya'], ['estimasi_budget', 'Budget'], ['sku_belum_master', 'Data master']];

  async function get(url) {
    var res = await window.SCM_AUTH.authFetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
    var j = null; try { j = await res.json(); } catch (e) {}
    if (!res.ok || !j || !j.ok) { var er = j && j.error; throw new Error(typeof er === 'string' ? er : er ? JSON.stringify(er) : 'HTTP ' + res.status); }
    return j;
  }
  async function load() {
    var f = document.querySelector('.fab'); if (f) f.classList.add('spin');
    try {
      await window.SCM_AUTH_READY;
      var s = await window.scmSupabase.auth.getSession();
      S.email = (s.data.session && s.data.session.user.email) || '';
      var r = await Promise.allSettled([get('/api/kpi'), get('/api/analisis')]);
      if (r[0].status === 'fulfilled') S.kpi = r[0].value;
      if (r[1].status === 'fulfilled') { S.an = r[1].value.data; S.anErr = ''; } else S.anErr = r[1].reason.message;
      S.ok = r[0].status === 'fulfilled'; S.at = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      render();
      var bad = S.kpi ? Object.keys(Z).filter(function (k) { return !zone(k); }) : [];   // coba ulang zona yang gagal, satu per satu
      if (bad.length) {
        var rr = await Promise.allSettled(bad.map(function (k) { return get('/api/kpi/' + k); }));
        rr.forEach(function (x, i) { var v = x.status === 'fulfilled' && x.value; if (v && v.status === 'live' && v.data) S.kpi.zones[bad[i]] = { status: 'live', data: v.data, error: null }; else if (v && v.error) S.kpi.zones[bad[i]].error = v.error; });
      }
    } catch (e) { S.ok = false; S.anErr = e.message; }
    render(); f = document.querySelector('.fab'); if (f) f.classList.remove('spin');
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
    var m = Object.keys(Z).filter(function (k) { return !zone(k); }).map(function (k) { return '<b>' + Z[k].t + ':</b> ' + esc((zerr(k) || 'belum ada data').slice(0, 140)); });
    return m.length ? '<div class="note">' + m.join('<br>') + '</div>' : '';
  }

  function home() {
    var vs = ['stock', 'logistics', 'fefo'].map(function (k) { var d = zone(k); return d ? Number(Z[k].main(d)) : NaN; }).filter(isFinite);
    var sc = vs.length ? vs.reduce(function (a, b) { return a + b; }, 0) / vs.length : NaN, al4 = (S.an && S.an.peringatan || []).slice(0, 4);
    return head('SCM Tower', S.at ? 'Disinkron pukul ' + S.at : 'Memuat data...') +
      '<div class="chips"><span class="chip">Hari ini</span>' + status() + '<span class="chip good">' + esc(S.email.split('@')[0] || 'pengguna') + '</span></div>' +
      '<div class="hero"><div><div class="lb">Skor operasional</div><div class="big">' + (isFinite(sc) ? Math.round(sc) : '-') + '<small>%</small></div><p>' + (isFinite(sc) ? lbl(sc) + ' · dari ' + vs.length + ' dari 3 indikator' : 'Menunggu data') + '</p></div>' + gauge(sc, '#14201A') + '</div>' + errNote() +
      '<div class="card"><h4>Zona operasional</h4>' + Object.keys(Z).map(function (k) {
        var d = zone(k), v = d ? Number(Z[k].main(d)) : NaN, ok = isFinite(v);
        return '<button class="zr" data-v="z:' + k + '"><div class="row"><span>' + Z[k].t + ' · ' + Z[k].s + (d ? '' : ' <i class="tag e">Gagal</i>') + '</span><b>' + (ok ? n(v, 1) + (Z[k].raw ? '/hari' : '%') : '-') + '</b></div><div class="bar"><i style="width:' + (ok ? Z[k].raw ? 100 : Math.min(100, v) : 0) + '%;background:' + COL[k] + '"></i></div></button>';
      }).join('') + '</div>' +
      '<div class="tiles">' + PICK.map(function (p) { var d = zone(p[0]), x = Z[p[0]].k[p[1]], v = d && x[1](d); return d && v != null && isFinite(Number(v)) ? tile(x[0], x[2](v, d)) : ''; }).join('') + '</div>' +
      '<div class="row" style="margin:16px 4px 10px"><b>Peringatan berjalan</b><button data-v="an" data-s="peringatan" style="border:0;background:none;color:var(--good);font-weight:700;font-size:12px">Lihat semua</button></div>' +
      '<div class="card">' + (al4.length ? al4.map(al).join('') : '<span class="sm">Tidak ada peringatan.</span>') + '</div>';
  }
  function detail(k) {
    var d = zone(k), z = Z[k];
    if (!d) return head(z.t, z.s, 1) + '<div class="note">' + esc(zerr(k) || 'Data zona ini belum tersedia.') + '</div><div class="card sm">Tekan tombol segarkan di tengah untuk mencoba lagi.</div>';
    var v = Number(z.main(d));
    return head(z.t, z.s, 1) + '<div class="hero"><div><div class="lb">' + z.s + '</div><div class="big">' + n(v, 1) + '<small>' + (z.raw ? '/hari' : '%') + '</small></div><p>' + (z.raw ? 'Pengiriman per hari' : lbl(v)) + '</p></div>' + gauge(z.raw ? NaN : v, '#14201A') + '</div>' +
      '<div class="tiles">' + tiles(k) + '</div>' +
      '<div class="card"><h4>Rincian lengkap</h4>' + Object.keys(d).filter(function (x) { return d[x] !== null && typeof d[x] !== 'object'; }).slice(0, 30).map(function (x) {
        return '<div class="it" style="grid-template-columns:1fr auto"><span class="sm">' + esc(x.replace(/_/g, ' ')) + '</span><b>' + (isNaN(Number(d[x])) ? esc(d[x]) : n(d[x], 2)) + '</b></div>'; }).join('') + '</div>';
  }
  function fv(v) { if (typeof v === 'number') return n(v, Number.isInteger(v) ? 0 : 2); var s = String(v); return /^\d{4}-\d\d-\d\d/.test(s) ? s.slice(0, 10) : s.slice(0, 40); }
  function gen(r) {
    var ks = Object.keys(r).filter(function (k) { return r[k] !== null && typeof r[k] !== 'object'; });
    var tk = ['nama_produk', 'nama_sku', 'judul', 'gudang', 'whs', 'kode_sku', 'item_code', 'dimensi', 'kunci', 'armada', 'bulan', 'tanggal', 'periode'].filter(function (k) { return ks.indexOf(k) > -1; })[0] || ks[0];
    return '<div class="card"><b>' + esc(fv(r[tk])) + '</b><div class="kv2">' + ks.filter(function (k) { return k !== tk; }).slice(0, 8).map(function (k) { return '<span><small>' + esc(k.replace(/_/g, ' ')) + '</small><b>' + esc(fv(r[k])) + '</b></span>'; }).join('') + '</div></div>';
  }
  function an() {
    var h = head('Analisis', 'Prediksi & prioritas', 1);
    if (!S.an) return h + '<div class="card"><b>Data analisis belum bisa dimuat</b><div class="sm" style="margin-top:6px">' + esc(S.anErr || 'Memuat...') + '</div></div>';
    var all = Array.isArray(S.an[S.sub]) ? S.an[S.sub] : [], rows = all.slice(0, 30);
    h += '<div class="seg">' + SEC.map(function (t) { return '<button data-s="' + t[0] + '"' + (S.sub === t[0] ? ' class="on"' : '') + '>' + t[1] + '</button>'; }).join('') + '</div>';
    if (!rows.length) return h + '<div class="card sm">Belum ada data untuk bagian ini.</div>';
    if (S.sub === 'armada') {
      var cs = rows.slice(0, 8), mx = Math.max.apply(null, cs.map(function (r) { return Number(r.total_karton) || 0; })) || 1, top = cs.reduce(function (a, r, i) { return Number(r.total_karton) > Number(cs[a].total_karton) ? i : a; }, 0);
      h += '<div class="card"><h4>Total karton per gudang</h4><div class="chart">' + cs.map(function (r, i) { return '<div' + (i === top ? ' class="hi"' : '') + '>' + (i === top ? n(r.total_karton) : '') + '<i style="height:' + Math.max(5, (Number(r.total_karton) || 0) / mx * 100) + '%"></i>' + esc(String(r.whs).slice(0, 4)) + '</div>'; }).join('') + '</div></div>';
    }
    h += '<div class="sm" style="margin:0 4px 10px">Menampilkan ' + rows.length + ' dari ' + n(all.length) + ' data</div>';
    return h + rows.map(function (r) {
      if (S.sub === 'armada') return '<div class="card"><div class="row"><b>' + esc(r.whs) + '</b><span class="chip">' + esc(r.periode) + '</span></div><div class="sm">' + n(r.total_karton) + ' karton</div><div class="cols"><span><small>Cont. 40 ft</small><b>' + n(r.ctn_40ft) + '</b></span><span><small>BWB</small><b>' + n(r.bwb) + '</b></span><span><small>Cont. 20 ft</small><b>' + n(r.ctn_20ft) + '</b></span></div></div>';
      if (S.sub === 'prioritas') return '<div class="card"><div class="row"><b>' + esc(r.nama_produk || r.nama_sku || r.nama || r.kode_sku) + '</b><span class="chip warn">' + esc(r.aksi || '-') + '</span></div><div class="sm">' + esc(r.gudang) + ' · ' + esc(r.kode_sku) + '</div><div class="cols"><span><small>Stok</small><b>' + n(r.stok_available) + '</b></span><span><small>Kirim/hari</small><b>' + n(r.prediksi_kirim_per_hari) + '</b></span><span><small>Cukup (hari)</small><b>' + n(r.hari_cukup_prediksi, 1) + '</b></span></div></div>';
      if (S.sub === 'peringatan') return '<div class="card">' + al(r) + '</div>';
      return gen(r);
    }).join('');
  }
  function me() {
    return head('Profil', 'Akun & pengaturan', 1) + '<div class="card"><div class="av">' + esc((S.email[0] || 'U').toUpperCase()) + '</div><div class="sm">Masuk sebagai</div><b>' + esc(S.email || '-') + '</b></div><div class="card pf"><button data-a="reload"><span>Muat ulang data</span>' + ic('chev') + '</button><a href="' + DESKTOP_URL + '"><span>Buka versi desktop</span>' + ic('chev') + '</a><button data-a="out" class="bad"><span>Keluar</span>' + ic('chev') + '</button></div>';
  }
  function render() {
    $('main').innerHTML = S.v === 'home' ? home() : S.v === 'an' ? an() : S.v === 'me' ? me() : detail(S.v.slice(2));
    var on = function (v) { return S.v === v ? ' class="on"' : ''; };
    $('nav').innerHTML = '<button data-v="home"' + on('home') + ' aria-label="Beranda">' + ic('home') + '</button><button data-v="an"' + on('an') + ' aria-label="Analisis">' + ic('chart') + '</button><button class="fab" data-a="reload" aria-label="Segarkan">' + ic('ref') + '</button><button data-v="z:logistics"' + on('z:logistics') + ' aria-label="Logistik">' + ic('truck') + '</button><button data-v="me"' + on('me') + ' aria-label="Profil">' + ic('user') + '</button>';
    var c = document.querySelector('.seg .on'); if (c && c.scrollIntoView) c.scrollIntoView({ inline: 'center', block: 'nearest' });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-v],[data-s],[data-a]'); if (!t) return;
    if (t.dataset.v) { if (t.dataset.s) S.sub = t.dataset.s; S.v = t.dataset.v; render(); window.scrollTo(0, 0); }
    else if (t.dataset.s) { S.sub = t.dataset.s; render(); }
    else if (t.dataset.a === 'reload') load();
    else if (t.dataset.a === 'out') { sessionStorage.removeItem('scm_face_ok'); window.scmSupabase.auth.signOut().then(function () { location.replace('/'); }); }
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) load(); });
  render(); load();
})();
