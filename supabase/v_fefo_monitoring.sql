-- View agregat untuk menu Monitoring FEFO (aplikasi mobile):
--   1) v_fefo_monitoring : SKU x bulan posting  -> KPI + grafik Posting vs Expired
--   2) v_fefo_dimensi    : produk / pelanggan / ekspedisi / provinsi / kota / gudang / tanggal -> modal Top 10 saat KPI card diklik
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

-- ------------------------------------------------------------------------------------------
create or replace view public.v_fefo_dimensi
with (security_invoker = true) as
with b as (
  select kode_sku, nama_produk, pelanggan, nama_ekspedisi, provinsi, kota_tujuan, gudang, tanggal_posting, qty,
         (tanggal_kadaluarsa - tanggal_posting)                          as sisa,
         (kode_batch is not null and btrim(kode_batch) <> '')            as ada_batch
  from public.shipments
), x as (
  select 'produk'::text as dimensi, kode_sku as kunci, nama_produk as label, qty, sisa, ada_batch from b
  union all select 'pelanggan', pelanggan,        pelanggan,        qty, sisa, ada_batch from b
  union all select 'ekspedisi', nama_ekspedisi,   nama_ekspedisi,   qty, sisa, ada_batch from b
  union all select 'provinsi',  provinsi,         provinsi,         qty, sisa, ada_batch from b
  union all select 'kota',      kota_tujuan,      kota_tujuan,      qty, sisa, ada_batch from b
  union all select 'gudang',    gudang,           gudang,           qty, sisa, ada_batch from b
  union all select 'tanggal',   tanggal_posting::text, tanggal_posting::text, qty, sisa, ada_batch from b
)
select dimensi, kunci, max(label) as label, count(*) as baris, sum(qty) as qty,
       sum(qty) filter (where sisa < 0)    as qty_expired,
       sum(qty) filter (where sisa < 30)   as qty_lt30,
       sum(qty) filter (where sisa >= 120) as qty_ge120,
       sum(qty) filter (where ada_batch)   as qty_batch
from x
group by dimensi, kunci;

grant select on public.v_fefo_dimensi to authenticated;
-- Untuk menghapus:  drop view public.v_fefo_dimensi;
