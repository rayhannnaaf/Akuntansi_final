# 📚 AkuntansiSMA — Sistem Pencatatan Akuntansi Sekolah

Sistem web pencatatan akuntansi untuk tingkat SMA menggunakan **Next.js** + **Supabase**.

## 🏗️ Arsitektur

```
Frontend (Next.js)  ←→  API Layer (Next.js API Routes)  ←→  Supabase (PostgreSQL + Auth)
```

- **Frontend**: Dashboard, form input transaksi, laporan akuntansi
- **API Layer**: Validasi data, logika double-entry, pembatasan akses role
- **Supabase**: Database PostgreSQL + Autentikasi (admin/guru)

---

## 🚀 Cara Setup

### 1. Clone & Install

```bash
git clone <repo>
cd akuntansi-sma
npm install
```

### 2. Setup Supabase

1. Buat akun di [supabase.com](https://supabase.com)
2. Buat project baru
3. Buka **SQL Editor** di dashboard Supabase
4. Jalankan isi file `supabase-schema.sql`
5. Salin **Project URL** dan **anon key** dari Settings → API

### 3. Konfigurasi Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 4. Buat User Admin Pertama

Di Supabase Dashboard → **Authentication** → **Users** → **Invite user** atau Add user manual.

Setelah user dibuat, update role di tabel `profiles`:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@sekolah.sch.id';
```

### 5. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## 📋 Fitur

| Fitur | Deskripsi |
|---|---|
| 🔐 Autentikasi | Login/logout dengan Supabase Auth |
| 📊 Dashboard | Ringkasan keuangan + chart |
| 📝 Input Transaksi | Form double-entry bookkeeping |
| 📖 Buku Jurnal | Riwayat semua entri jurnal |
| 📒 Daftar Akun | Chart of accounts |
| ⚖️ Neraca Saldo | Trial balance otomatis |
| 📈 Laba Rugi | Income statement |
| 🏦 Neraca | Balance sheet |

## 👥 Role

- **Admin**: Akses penuh (buat akun, kelola user)
- **Guru**: Input transaksi & lihat laporan

## 📁 Struktur Project

```
akuntansi-sma/
├── pages/
│   ├── api/
│   │   ├── akun/         # API endpoint akun
│   │   ├── transaksi/    # API endpoint transaksi
│   │   ├── laporan/      # API endpoint laporan
│   │   └── auth/         # API endpoint autentikasi
│   ├── laporan/          # Halaman laporan
│   ├── dashboard.jsx
│   ├── transaksi.jsx
│   ├── jurnal.jsx
│   ├── akun.jsx
│   └── login.jsx
├── components/
│   ├── layout/Layout.jsx
│   └── ui/index.jsx
├── lib/
│   ├── supabase.js       # Supabase client
│   ├── auth.js           # Auth helpers
│   └── akuntansi.js      # Business logic akuntansi
├── styles/globals.css
└── supabase-schema.sql   # SQL untuk database
```
