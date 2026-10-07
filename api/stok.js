// api/stok.js  →  GET /api/stok[?t=nama_tabel]
//
// Membaca TABEL STOK dari Supabase memakai token login pengguna (RLS tetap berlaku) lalu
// meneruskan barisnya ke aplikasi, yang menghitung KPI Monitoring dari baris tersebut.
//
// Nama tabel ditentukan berurutan:
//   1) ?t=<nama>  2) env STOK_TABLE  3) tabel/view yang namanya mengandung "stok"/"stock" di
//   daftar /rest/v1/  4) beberapa nama umum.
// Respons menyertakan `table`, `cols`, dan `tried` supaya mudah dicek bila hasilnya tidak sesuai.

const { resolveAnonKey } = require('./_lib/kpi-zones');
const { requireUser } = require('./_lib/require-user');

const ORIGIN = ((process.env.SUPABASE_URL || '').trim() || 'https://qbougldvlmceeqceduae.supabase.co').replace(/\/+$/, '');
const COMMON = ['stok', 'stock', 'fg_stok', 'stok_fg', 'fg_stock', 'stock_fg', 'stok_harian', 'stok_monitoring', 'stock_monitoring', 'v_stok', 'v_stock'];
const NAME_RE = /^[A-Za-z0-9_]+$/;
const PAGE = 1000, MAX_PAGES = 8, TIMEOUT_MS = 12000;

async function jfetch(url, headers, extra) {
  const ac = new AbortController();
  const tm = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try { return await fetch(url, Object.assign({ headers, signal: ac.signal }, extra || {})); } finally { clearTimeout(tm); }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') { res.status(405).json({ ok: false, error: 'Method not allowed' }); return; }
  const auth = await requireUser(req);
  if (!auth.ok) { res.status(auth.status).json({ ok: false, error: auth.error }); return; }

  const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const H = { apikey: resolveAnonKey(), Authorization: 'Bearer ' + tok, Accept: 'application/json' };
  const tried = [];
  let cand = [];
  const q = req.query && req.query.t, env = (process.env.STOK_TABLE || '').trim();
  if (q && NAME_RE.test(q)) cand.push(q);
  if (env && NAME_RE.test(env)) cand.push(env);

  if (!cand.length) {
    try {   // daftar tabel yang terlihat oleh peran ini (OpenAPI PostgREST)
      const r = await jfetch(ORIGIN + '/rest/v1/', H);
      if (r.ok) {
        const j = await r.json();
        const names = Object.keys(j.paths || {}).map((p) => p.replace(/^\//, '')).filter((p) => NAME_RE.test(p) && /stok|stock/i.test(p));
        names.sort((a, b) => (/^v_/.test(a) ? 1 : 0) - (/^v_/.test(b) ? 1 : 0) || a.length - b.length);
        cand = cand.concat(names);
        tried.push({ t: '(daftar tabel)', n: names.length });
      } else tried.push({ t: '(daftar tabel)', status: r.status });
    } catch (e) { tried.push({ t: '(daftar tabel)', status: e.name === 'AbortError' ? 'timeout' : e.message }); }
    COMMON.forEach((c) => { if (cand.indexOf(c) < 0) cand.push(c); });
  }

  for (const t of cand.slice(0, 12)) {
    try {
      let rows = [], truncated = false, bad = null;
      for (let p = 0; p < MAX_PAGES; p++) {
        const r = await jfetch(ORIGIN + '/rest/v1/' + t + '?select=*&limit=' + PAGE + '&offset=' + p * PAGE, H);
        if (!r.ok) { bad = r.status; break; }
        const part = await r.json();
        if (!Array.isArray(part)) { bad = 'format'; break; }
        rows = rows.concat(part);
        if (part.length < PAGE) break;
        if (p === MAX_PAGES - 1) truncated = true;
      }
      if (bad) { tried.push({ t, status: bad }); continue; }
      if (!rows.length) { tried.push({ t, status: 'kosong (0 baris — cek policy RLS select)' }); continue; }
      res.setHeader('Cache-Control', 'private, no-store');
      res.status(200).json({ ok: true, table: t, cols: Object.keys(rows[0]), rows, truncated, tried });
      return;
    } catch (e) { tried.push({ t, status: e.name === 'AbortError' ? 'timeout' : e.message }); }
  }
  res.status(404).json({ ok: false, error: 'Tabel stok tidak ditemukan / kosong / tidak boleh dibaca. Dicoba: ' + tried.map((x) => x.t + ' → ' + (x.status != null ? x.status : x.n)).join('; ') + '. Isi env STOK_TABLE atau buka /api/stok?t=nama_tabel.' });
};
