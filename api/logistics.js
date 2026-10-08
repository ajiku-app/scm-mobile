// api/logistics.js  →  GET /api/logistics
// Agregat logistik dari view v_logistics_dimensi & v_logistics_peran (lihat supabase/logistics_views.sql).
// Dibaca dengan token login pengguna sehingga RLS tetap berlaku. KPI/grafik dihitung di aplikasi.
const { resolveAnonKey } = require('./_lib/kpi-zones');
const { requireUser } = require('./_lib/require-user');

const ORIGIN = ((process.env.SUPABASE_URL || '').trim() || 'https://qbougldvlmceeqceduae.supabase.co').replace(/\/+$/, '');
const PAGE = 1000, MAX_PAGES = 8, TIMEOUT_MS = 25000;

async function readView(view, order, H) {
  let rows = [];
  for (let p = 0; p < MAX_PAGES; p++) {
    const ac = new AbortController(), tm = setTimeout(() => ac.abort(), TIMEOUT_MS);
    let r;
    try { r = await fetch(ORIGIN + '/rest/v1/' + view + '?select=*&order=' + order + '&limit=' + PAGE + '&offset=' + p * PAGE, { headers: H, signal: ac.signal }); }
    finally { clearTimeout(tm); }
    if (!r.ok) {
      let tx = ''; try { tx = (await r.text()).slice(0, 160); } catch (_) { /* abaikan */ }
      const e = new Error(r.status === 404 || /PGRST205|does not exist|schema cache/i.test(tx) ? 'View ' + view + ' belum ada di Supabase. Jalankan supabase/logistics_views.sql di SQL Editor.' : view + ': HTTP ' + r.status + ' ' + tx);
      e.status = r.status === 404 ? 404 : 502; throw e;
    }
    const part = await r.json(); rows = rows.concat(part);
    if (part.length < PAGE) break;
  }
  return rows;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') { res.status(405).json({ ok: false, error: 'Method not allowed' }); return; }
  const auth = await requireUser(req);
  if (!auth.ok) { res.status(auth.status).json({ ok: false, error: auth.error }); return; }
  const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const H = { apikey: resolveAnonKey(), Authorization: 'Bearer ' + tok, Accept: 'application/json' };
  try {
    const [dim, peran] = await Promise.all([readView('v_logistics_dimensi', 'dimensi,kunci', H), readView('v_logistics_peran', 'peran,nama,armada', H)]);
    if (!dim.length) { res.status(404).json({ ok: false, error: 'v_logistics_dimensi kosong atau tidak boleh dibaca oleh akun ini.' }); return; }
    res.setHeader('Cache-Control', 'private, no-store');
    res.status(200).json({ ok: true, dim, peran });
  } catch (e) {
    res.status(e.status || 502).json({ ok: false, error: e.name === 'AbortError' ? 'Gagal membaca data logistik: timeout' : e.message });
  }
};
