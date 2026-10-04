# SCM Tower Mobile

Versi mobile ringkas dari SCM Control Tower (PWA). Project ini **berdiri sendiri**: tidak mengubah
aplikasi desktop lama. Memakai backend Supabase yang sama.

## Halaman
| File | Fungsi |
|---|---|
| `index.html` | Welcome |
| `login.html` | Login + verifikasi wajah |
| `enroll.html` | Pendaftaran wajah |
| `m.html` + `m.js` + `m.css` | Aplikasi: Beranda, Detail zona, Analisis, Profil |
| `api/kpi.js`, `api/analisis.js` | Proxy server ke Supabase Edge Function (butuh env var) |

## Verifikasi wajah
Saat ini **dimatikan** (`window.SCM_FACE_REQUIRED = false` di `assets/supabase-client.js`).
Untuk mengaktifkan lagi: ubah ke `true`, lalu tambahkan di `login.html` sebelum `supabase-client.js`:
`face-api.js@0.22.2/dist/face-api.min.js` (CDN jsdelivr) dan sesudahnya `/assets/face-verify.js`.

## Deploy (Vercel project baru)
1. Push folder ini ke repo GitHub baru, lalu Vercel -> Add New -> Project -> pilih repo.
2. Framework Preset: **Other**. Tanpa build command.
3. Settings -> Environment Variables: salin semua variabel dari project lama
   (lihat `.env.example`), terutama `SUPABASE_ANON_KEY` dan `ANALISIS_API_KEY`.
4. Deploy, lalu buka `https://<domain-baru>/`.

Ubah `DESKTOP_URL` di bagian atas `m.js` bila alamat versi desktop berbeda.
