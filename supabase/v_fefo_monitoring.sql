-- View agregat untuk menu Monitoring FEFO (aplikasi mobile).
-- Meringkas tabel public.shipments per (bulan posting, SKU) supaya aplikasi tidak perlu
-- menarik 87 ribu baris. Memakai security_invoker, sama seperti v_shipments / v_stok_vs_kirim,
-- sehingga RLS pada shipments tetap berlaku (hanya pengguna login non-anonim yang bisa membaca).
-- Aman dijalankan ulang. Untuk menghapus:  drop view public.v_fefo_monitoring;

create or replace view public.v_fefo_monitoring
with (security_invoker = true) as
select
  date_trunc('month', tanggal_posting)::date                                   as bulan,
  kode_sku,
  max(nama_produk)                                                             as nama_produk,
  count(*)                                                                     as baris,
  sum(qty)                                                                     as qty,
  sum(qty * (tanggal_kadaluarsa - date '2000-01-01'))                          as qty_x_exp,   -- untuk rata-rata tertimbang tgl expired
  sum(qty * (tanggal_posting    - date '2000-01-01'))                          as qty_x_post,  -- untuk rata-rata tertimbang tgl posting
  sum(qty) filter (where tanggal_kadaluarsa < tanggal_posting)                 as qty_expired,
  sum(qty) filter (where tanggal_kadaluarsa - tanggal_posting < 30)            as qty_lt30,    -- expired + critical (<30 hari)
  sum(qty) filter (where tanggal_kadaluarsa - tanggal_posting >= 120)          as qty_ge120,   -- freshness: sisa SLED >= 120 hari
  sum(qty) filter (where kode_batch is not null and btrim(kode_batch) <> '')   as qty_batch,   -- traceability
  min(tanggal_posting)                                                         as min_posting,
  max(tanggal_posting)                                                         as max_posting
from public.shipments
group by 1, 2;

grant select on public.v_fefo_monitoring to authenticated;
