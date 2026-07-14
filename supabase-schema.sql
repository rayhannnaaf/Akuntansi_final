-- ============================================================
-- SCHEMA SUPABASE - Sistem Akuntansi SMA
-- Jalankan SQL ini di Supabase SQL Editor
-- ============================================================

-- 1. Tabel profiles (extend auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nama TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'guru' CHECK (role IN ('admin', 'guru')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: otomatis buat profile saat user baru daftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nama, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama', 'Pengguna Baru'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'guru')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Tabel akun (Chart of Accounts)
CREATE TABLE public.akun (
  id SERIAL PRIMARY KEY,
  kode TEXT NOT NULL UNIQUE,
  nama TEXT NOT NULL,
  tipe TEXT NOT NULL CHECK (tipe IN ('aset', 'kewajiban', 'ekuitas', 'pendapatan', 'beban')),
  saldo_awal NUMERIC(15,2) DEFAULT 0,
  keterangan TEXT,
  aktif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel transaksi (header)
CREATE TABLE public.transaksi (
  id SERIAL PRIMARY KEY,
  tanggal DATE NOT NULL,
  nomor_bukti TEXT NOT NULL UNIQUE,
  keterangan TEXT NOT NULL,
  total_nilai NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel jurnal_entri (detail transaksi - double entry)
CREATE TABLE public.jurnal_entri (
  id SERIAL PRIMARY KEY,
  transaksi_id INTEGER REFERENCES public.transaksi(id) ON DELETE CASCADE,
  akun_id INTEGER REFERENCES public.akun(id),
  debit NUMERIC(15,2) DEFAULT 0,
  kredit NUMERIC(15,2) DEFAULT 0,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.akun ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurnal_entri ENABLE ROW LEVEL SECURITY;

-- Profiles: user hanya bisa lihat profile sendiri, admin bisa semua
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Akun: semua authenticated user bisa baca, hanya admin yang bisa ubah
CREATE POLICY "akun_select" ON public.akun
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "akun_insert_admin" ON public.akun
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "akun_update_admin" ON public.akun
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Transaksi: semua authenticated bisa baca & buat, admin bisa hapus
CREATE POLICY "transaksi_select" ON public.transaksi
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "transaksi_insert" ON public.transaksi
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "transaksi_delete_admin" ON public.transaksi
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Jurnal entri: ikuti transaksi
CREATE POLICY "jurnal_select" ON public.jurnal_entri
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "jurnal_insert" ON public.jurnal_entri
  FOR INSERT TO authenticated WITH CHECK (TRUE);

CREATE POLICY "jurnal_delete_admin" ON public.jurnal_entri
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- ============================================================
-- DATA AWAL (Akun Buku Besar Standar SMA)
-- ============================================================

INSERT INTO public.akun (kode, nama, tipe, keterangan) VALUES
-- ASET
('1-1000', 'Kas', 'aset', 'Uang tunai yang dimiliki'),
('1-1100', 'Bank', 'aset', 'Saldo rekening bank'),
('1-1200', 'Piutang Usaha', 'aset', 'Tagihan kepada pihak lain'),
('1-1300', 'Perlengkapan', 'aset', 'Perlengkapan kantor/sekolah'),
('1-2000', 'Peralatan', 'aset', 'Peralatan operasional'),
('1-2100', 'Akumulasi Penyusutan Peralatan', 'aset', 'Penyusutan peralatan'),
-- KEWAJIBAN
('2-1000', 'Utang Usaha', 'kewajiban', 'Kewajiban kepada pemasok'),
('2-1100', 'Utang Gaji', 'kewajiban', 'Gaji yang belum dibayar'),
('2-2000', 'Utang Bank', 'kewajiban', 'Pinjaman dari bank'),
-- EKUITAS
('3-1000', 'Modal', 'ekuitas', 'Modal pemilik/yayasan'),
('3-1100', 'Laba Ditahan', 'ekuitas', 'Akumulasi laba'),
-- PENDAPATAN
('4-1000', 'Pendapatan SPP', 'pendapatan', 'Penerimaan SPP siswa'),
('4-1100', 'Pendapatan Ekstrakulikuler', 'pendapatan', 'Penerimaan kegiatan ekstra'),
('4-1200', 'Pendapatan Lain-lain', 'pendapatan', 'Pendapatan di luar operasi utama'),
-- BEBAN
('5-1000', 'Beban Gaji', 'beban', 'Pengeluaran untuk gaji karyawan'),
('5-1100', 'Beban Listrik & Air', 'beban', 'Tagihan utilitas'),
('5-1200', 'Beban ATK', 'beban', 'Alat tulis dan perlengkapan kantor'),
('5-1300', 'Beban Pemeliharaan', 'beban', 'Biaya perawatan gedung dan peralatan'),
('5-1400', 'Beban Penyusutan', 'beban', 'Penyusutan aktiva tetap'),
('5-1500', 'Beban Lain-lain', 'beban', 'Pengeluaran tidak terduga');
