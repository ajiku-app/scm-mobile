// api/stok.js  →  GET /api/stok
//
// Data stok untuk menu Monitoring (Stok). Dibaca dari view Supabase memakai token login
// pengguna (RLS/izin database tetap berlaku):
//   - v_stok_terbaru     : stok terbaru per SKU + qty_per_pallet + product_planning
//   - v_stok_vs_kirim    : hari_cukup, rata2_kirim_per_hari, status
//   - fg_warehouse_areas : kapasitas_pallet (dijumlahkan = kapasitas gudang FG)
// Hasil digabung per (whs, item_code) lalu dikirim ke aplikasi, yang menghitung KPI-nya.

const { resolveAnonKey } = require('./_lib/kpi-zones');
const { requireUser } = require('./_lib/require-user');

const ORIGIN = ((process.env.SUPABASE_URL || '').trim() || 'https://qbougldvlmceeqceduae.supabase.co').replace(/\/+$/, '');
const TIMEOUT_MS = 20000, PAGE = 1000, MAX_PAGES = 6;

async function rest(path, H) {
  let rows = [];
  for (let p = 0; p < MAX_PAGES; p++) {
    const ac = new AbortController(), tm = setTimeout(() => ac.abort(), TIMEOUT_MS);
    let r;
    try { r = await fetch(ORIGIN + '/rest/v1/' + path + (path.includes('?') ? '&' : '?') + 'limit=' + PAGE + '&offset=' + p * PAGE, { headers: H, signal: ac.signal }); }
    catch (e) { throw new Error(path.split('?')[0] + ': ' + (e.name === 'AbortError' ? 'timeout' : e.message)); }
    finally { clearTimeout(tm); }
    if (!r.ok) { let tx = ''; try { tx = (await r.text()).slice(0, 140); } catch (_) { /* abaikan */ } throw new Error(path.split('?')[0] + ': HTTP ' + r.status + (tx ? ' ' + tx : '')); }
    const part = await r.json();
    rows = rows.concat(part);
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
    const [st, vk, ar] = await Promise.all([
      rest('v_stok_terbaru?select=upload_date,whs,item_code,produk,stok_hari_ini,kirim_hari_ini,kirim_besok,product_planning,stok_available,qty_per_pallet', H),
      rest('v_stok_vs_kirim?select=whs,item_code,hari_cukup,rata2_kirim_per_hari,status', H).catch(() => []),
      rest('fg_warehouse_areas?select=kapasitas_pallet', H).catch(() => []),
    ]);
    if (!st.length) { res.status(404).json({ ok: false, error: 'v_stok_terbaru kosong atau tidak boleh dibaca oleh akun ini (cek izin SELECT / RLS).' }); return; }
    const m = {};
    vk.forEach((x) => { m[x.whs + '|' + x.item_code] = x; });
    const num = (v) => { v = Number(v); return Number.isFinite(v) ? v : 0; };
    const items = st.map((x) => {
      const k = m[x.whs + '|' + x.item_code] || {};
      return {
        whs: x.whs, item_code: x.item_code, produk: x.produk,
        stok_hari_ini: num(x.stok_hari_ini), kirim_hari_ini: num(x.kirim_hari_ini), kirim_besok: num(x.kirim_besok), product_planning: num(x.product_planning), stok_available: num(x.stok_available),
        qty_per_pallet: x.qty_per_pallet == null ? null : num(x.qty_per_pallet), hari_cukup: k.hari_cukup == null ? null : num(k.hari_cukup), rata2_kirim_per_hari: num(k.rata2_kirim_per_hari), status: k.status || '',
      };
    });
    res.setHeader('Cache-Control', 'private, no-store');
    res.status(200).json({ ok: true, table: 'v_stok_terbaru', upload_date: st[0].upload_date, items, capacity_pallet: ar.reduce((a, b) => a + num(b.kapasitas_pallet), 0) });
  } catch (e) {
    res.status(502).json({ ok: false, error: 'Gagal membaca data stok: ' + e.message });
  }
};
