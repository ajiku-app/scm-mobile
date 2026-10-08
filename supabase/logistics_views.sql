-- View agregat untuk menu Monitoring Logistik (aplikasi mobile).
--   1) v_logistics_dimensi : ekspedisi / provinsi / kota / armada / driver / kendaraan / tanggal
--                            -> KPI, ringkasan durasi loading, dan modal Top 10 saat KPI card diklik
--   2) v_logistics_peran   : jumlah tugas per orang untuk picker / muat / stuffing (per jenis armada)
--                            -> Yamazumi, Multiple Activity Chart, Top 3 & 3 terendah
-- Durasi loading = time_out - time_in (menit); bila negatif (jam keluar lewat tengah malam / salah input)
-- ditambah 1440, sama seperti dashboard desktop. SLA = loading <= 90 menit.
-- Memakai security_invoker (RLS tetap berlaku). data_karyawan hanya bisa dibaca admin, sehingga untuk
-- non-admin nama tampil apa adanya (nama panggilan); untuk admin dipetakan ke nama lengkap.
-- Aman dijalankan ulang. Hapus:  drop view public.v_logistics_dimensi, public.v_logistics_peran;

create or replace view public.v_logistics_dimensi
with (security_invoker = true) as
with t as (
  select l.tgl_date, l.ekspedisi, l.no_mobil, l.driver, l.armada, l.provinsi, l.kota,
         case when v.durasi_menit < 0 then v.durasi_menit + 1440 else v.durasi_menit end as dm
  from public.logistics l
  join public.v_logistics_trip v on v.id = l.id
  where v.durasi_menit is not null
), x as (
  select 'tanggal'::text as dimensi, tgl_date::text as kunci, dm from t
  union all select 'ekspedisi', ekspedisi, dm from t
  union all select 'provinsi',  provinsi,  dm from t
  union all select 'kota',      kota,      dm from t
  union all select 'armada',    armada,    dm from t
  union all select 'driver',    driver,    dm from t
  union all select 'kendaraan', no_mobil,  dm from t
)
select dimensi, coalesce(nullif(btrim(kunci), ''), '(tanpa data)') as kunci,
       count(*)                                  as trips,
       sum(dm)                                   as sum_menit,
       min(dm)                                   as min_menit,
       max(dm)                                   as max_menit,
       count(*) filter (where dm <= 60)          as n_cepat,
       count(*) filter (where dm > 60 and dm <= 90) as n_sedang,
       count(*) filter (where dm > 90)           as n_lambat
from x
group by dimensi, coalesce(nullif(btrim(kunci), ''), '(tanpa data)');

grant select on public.v_logistics_dimensi to authenticated;

-- ------------------------------------------------------------------------------------------
create or replace view public.v_logistics_peran
with (security_invoker = true) as
with kk as (
  select distinct on (p) p, nama_lengkap
  from (select upper(regexp_replace(btrim(nama_panggilan), '\s+', ' ', 'g')) as p, nama_lengkap from public.data_karyawan) z
  order by p, nama_lengkap
), e as (
  select 'picker'::text as peran, upper(regexp_replace(btrim(x), '\s+', ' ', 'g')) as nama, coalesce(armada, '') as armada from public.logistics, unnest(picker)   as x
  union all
  select 'muat',     upper(regexp_replace(btrim(x), '\s+', ' ', 'g')), coalesce(armada, '') from public.logistics, unnest(muat)     as x
  union all
  select 'stuffing', upper(regexp_replace(btrim(x), '\s+', ' ', 'g')), coalesce(armada, '') from public.logistics, unnest(stuffing) as x
)
select e.peran, coalesce(kk.nama_lengkap, e.nama) as nama, e.armada, count(*) as tugas
from e left join kk on kk.p = e.nama
where e.nama <> ''
group by e.peran, coalesce(kk.nama_lengkap, e.nama), e.armada;

grant select on public.v_logistics_peran to authenticated;
