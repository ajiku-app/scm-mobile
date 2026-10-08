// api/fefo.js  →  GET /api/fefo
// Agregat FEFO (SKU × bulan posting) dari view public.v_fefo_monitoring (lihat supabase/v_fefo_monitoring.sql).
// Dibaca dengan token login pengguna sehingga RLS tetap berlaku. KPI & grafik dihitung di aplikasi.
const { resolveAnonKey } = require('./_lib/kpi-zones');
const { requireUser } = require('./_lib/require-user');

const ORIGIN = ((process.env.SUPABASE_URL || '').trim() || 'https://qbougldvlmceeqceduae.supabase.co').replace(/\/+$/, '');
const PAGE = 1000, MAX_PAGES = 6, TIMEOUT_MS = 25000;

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') { res.status(405).json({ ok: false, error: 'Method not allowed' }); return; }
  const auth = await requireUser(req);
  if (!auth.ok) { res.status(auth.status).json({ ok: false, error: auth.error }); return; }
  const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const H = { apikey: resolveAnonKey(), Authorization: 'Bearer ' + tok, Accept: 'application/json' };
  try {
    let rows = [];
    for (let p = 0; p < MAX_PAGES; p++) {
      const ac = new AbortController(), tm = setTimeout(() => ac.abort(), TIMEOUT_MS);
      let r;
      try { r = await fetch(ORIGIN + '/rest/v1/v_fefo_monitoring?select=*&order=bulan,kode_sku&limit=' + PAGE + '&offset=' + p * PAGE, { headers: H, signal: ac.signal }); }
      finally { clearTimeout(tm); }
      if (!r.ok) {
        let tx = ''; try { tx = (await r.text()).slice(0, 160); } catch (_) { /* abaikan */ }
        const missing = r.status === 404 || /PGRST205|does not exist|schema cache/i.test(tx);
        res.status(missing ? 404 : 502).json({ ok: false, error: missing ? 'View v_fefo_monitoring belum ada di Supabase. Jalankan supabase/v_fefo_monitoring.sql di SQL Editor.' : 'HTTP ' + r.status + ' ' + tx });
        return;
      }
      const part = await r.json();
      rows = rows.concat(part);
      if (part.length < PAGE) break;
    }
    if (!rows.length) { res.status(404).json({ ok: false, error: 'v_fefo_monitoring kosong atau tidak boleh dibaca oleh akun ini.' }); return; }
    res.setHeader('Cache-Control', 'private, no-store');
    res.status(200).json({ ok: true, rows });
  } catch (e) {
    res.status(502).json({ ok: false, error: 'Gagal membaca data FEFO: ' + (e.name === 'AbortError' ? 'timeout' : e.message) });
  }
};
