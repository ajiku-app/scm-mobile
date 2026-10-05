// api/analisis.js  →  GET /api/analisis
//
// Endpoint untuk menu "Analisis & Prediksi". Memanggil Supabase Edge Function
// `analisis-scm-api` (yang membaca view hasil analisis: v_kebutuhan_armada_ringkas,
// v_prediksi_kirim, v_tren_bulanan, dst.) secara server-to-server, lalu
// meneruskan hasilnya ke browser dalam satu response JSON.
//
// Pola dan alasannya sama dengan api/kpi.js: URL & anon key dipegang server
// (environment variable), bukan browser, dan tidak ada masalah CORS.
//
// Environment variable:
//   ANALISIS_API_URL   URL Edge Function, mis.
//                      https://<project>.supabase.co/functions/v1/analisis-scm-api/all
//                      (opsional, ada default)
//   SUPABASE_ANON_KEY  sama dengan yang dipakai api/kpi.js (opsional, ada default)
//   ANALISIS_API_KEY   WAJIB diisi (temuan audit 22 Sep 2026, C-1): Edge Function
//                      `analisis-scm-api` sekarang menolak semua request bila secret
//                      ini kosong (fail-closed) — sebelumnya endpoint itu diam-diam
//                      terbuka untuk siapa saja yang memegang anon key (yang memang
//                      publik di client). Isi nilai yang sama persis dengan secret
//                      ANALISIS_API_KEY di Supabase → Edge Functions → Secrets.

const { resolveAnonKey } = require('./_lib/kpi-zones');
const { requireUser } = require('./_lib/require-user');

const DEFAULT_URL =
  'https://qbougldvlmceeqceduae.supabase.co/functions/v1/analisis-scm-api/all';
const TIMEOUT_MS = 50000;
let lastGood = null; // { at, data } — cache memori per instance
const STALE_MS = 10 * 60 * 1000;
let warnedUrl = false;
let warnedNoAccessKey = false;

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const auth = await requireUser(req);
  if (!auth.ok) {
    res.status(auth.status).json({ ok: false, error: auth.error });
    return;
  }

  // JALUR CEPAT: satu bagian (?s=armada, dst) dibaca langsung dari view Supabase memakai token login user
  // (izin database tetap berlaku; bila ditolak/kosong/lambat, lanjut ke jalur Edge Function di bawah).
  const VIEWS = {
    armada: 'v_kebutuhan_armada_ringkas', prioritas: 'v_prioritas_tindakan', peringatan: 'v_peringatan_data',
    kendaraan: 'v_kebutuhan_kendaraan_hari_ini', prediksi: 'v_prediksi_kirim', stok_vs_kirim: 'v_stok_vs_kirim',
    tren: 'v_tren_bulanan', harian: 'v_harian?order=tanggal.desc&limit=60', durasi_ringkas: 'v_durasi_ringkas',
    shipments_ringkas: 'v_shipments_ringkas', pareto: 'v_pareto', biaya_carton: 'v_biaya_per_carton_bulanan',
    estimasi_budget: 'v_estimasi_biaya_bulan_depan', sku_belum_master: 'v_sku_belum_master', peta: 'v_peta_pelanggan',
  };
  const sec = req.query && req.query.s;
  if (sec && Object.prototype.hasOwnProperty.call(VIEWS, sec)) {
    const ac = new AbortController();
    const tm = setTimeout(() => ac.abort(), 15000);
    try {
      const v = VIEWS[sec];
      const q = v.includes('?') ? v + '&select=*' : v + '?select=*&limit=2000';
      const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
      const r = await fetch(new URL(DEFAULT_URL).origin + '/rest/v1/' + q, {
        headers: { apikey: resolveAnonKey(), Authorization: 'Bearer ' + tok, Accept: 'application/json' },
        signal: ac.signal,
      });
      if (r.ok) {
        const rows = await r.json();
        if (Array.isArray(rows) && rows.length) {
          res.setHeader('Cache-Control', 'private, no-store');
          res.status(200).json({ ok: true, timestamp: Date.now(), via: 'view', data: { [sec]: rows } });
          return;
        }
      }
    } catch (_) {
      /* lanjut ke jalur Edge Function */
    } finally {
      clearTimeout(tm);
    }
  }

  const baseUrl = (process.env.ANALISIS_API_URL || '').trim() || DEFAULT_URL;
  const url = baseUrl;
  // ?s=<bagian> → panggil <base>/<bagian> (lebih ringan daripada /all); daftar dibatasi (whitelist).
  const SECTIONS = ['armada', 'prioritas', 'peringatan', 'kendaraan', 'prediksi', 'stok_vs_kirim', 'tren', 'harian', 'durasi_ringkas', 'shipments_ringkas', 'pareto', 'biaya_carton', 'estimasi_budget', 'sku_belum_master', 'peta'];
  const s = String((req.query && req.query.s) || '');
  let target = url;
  if (s) {
    target = SECTIONS.includes(s) ? url.replace(/\/all\/?$/, '/' + s) : url;
    if (target === url) { res.status(400).json({ ok: false, error: 'Bagian analisis tidak dikenal.' }); return; }
  }
  if (url === DEFAULT_URL && !warnedUrl) {
    warnedUrl = true;
    console.warn(
      '[api/analisis] Env var "ANALISIS_API_URL" belum diisi — memakai URL project Supabase ' +
      'contoh sebagai fallback. Isi di Vercel Environment Variables jika ini deployment Anda sendiri.'
    );
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const headers = { Accept: 'application/json' };
    if (/\.supabase\.co\/functions\//.test(url)) {
      const anonKey = resolveAnonKey();
      headers.apikey = anonKey;
      headers.Authorization = `Bearer ${anonKey}`;
    }
    // WAJIB diisi di Vercel DAN sama persis dengan secret di Edge Function
    // (lihat catatan di atas berkas ini). Tanpa ini, panggilan ke Edge
    // Function akan ditolak 503 oleh perbaikan fail-closed yang baru.
    const accessKey = (process.env.ANALISIS_API_KEY || '').trim();
    if (accessKey) {
      headers['x-api-key'] = accessKey;
    } else if (!warnedNoAccessKey) {
      warnedNoAccessKey = true;
      console.warn(
        '[api/analisis] Env var "ANALISIS_API_KEY" belum diisi di Vercel. Edge Function ' +
        'analisis-scm-api akan menolak (503) sampai ini diisi — lihat laporan audit C-1.'
      );
    }

    const upstream = await fetch(target, { method: 'GET', headers, signal: controller.signal });
    if (!upstream.ok) {
      let bodyMsg = '';
      try {
        bodyMsg = (await upstream.text()).trim().slice(0, 220);
      } catch (_) {
        /* abaikan */
      }
      if (!s && lastGood && Date.now() - lastGood.at < STALE_MS) { res.status(200).json({ ok: true, timestamp: lastGood.at, stale: true, data: lastGood.data }); return; }
      res.status(502).json({
        ok: false,
        error: `Endpoint analisis merespons HTTP ${upstream.status}${bodyMsg ? ` — ${bodyMsg}` : ''}`,
      });
      return;
    }

    const data = await upstream.json();
    if (!s) lastGood = { at: Date.now(), data };
    // Cache singkat di edge Vercel: data berasal dari view yang berubah per upload/shipment,
    // bukan per detik, jadi 30 detik sudah cukup segar.
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    res.status(200).json({ ok: true, timestamp: Date.now(), data });
  } catch (e) {
    const message =
      e.name === 'AbortError'
        ? `Timeout — endpoint analisis tidak merespons dalam ${TIMEOUT_MS / 1000} detik.`
        : e.message || 'Gagal mengambil data analisis (alasan tidak diketahui).';
    if (!s && lastGood && Date.now() - lastGood.at < STALE_MS) { res.status(200).json({ ok: true, timestamp: lastGood.at, stale: true, data: lastGood.data }); return; }
    res.status(502).json({ ok: false, error: message });
  } finally {
    clearTimeout(timer);
  }
};
