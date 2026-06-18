# Baby First Food PWA

PWA mobile-first untuk ibu bapa merancang menu, jadual makan, resepi dan rekod makanan pertama bayi 6 bulan ke atas.

## Cara Guna

1. Buka tab `Dashboard` untuk isi profil bayi dan semak umur semasa.
2. Pergi `Resepi` untuk tambah resepi baharu, guna gambar dari camera atau upload file.
3. Pergi `Menu` untuk rancang makanan ikut minggu, tarikh, dan masa makan.
4. Pergi `Jadual` untuk pilih menu yang sudah ada dan susun ikut sarapan, tengah hari, petang, malam.
5. Pergi `Tracker` untuk simpan feedback bayi selepas makan, sama ada dari menu atau secara manual.
6. Simpan data dan tunggu status `Synced` jika Supabase sudah connect.
7. Kalau status `Local`, data masih ada dalam phone browser, cuma belum hantar ke cloud database.

## Jalankan

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Supabase

Salin `.env.example` ke `.env` dan isi:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_SUPABASE_STORAGE_BUCKET=baby-food-images
```

Tanpa konfigurasi ini, data disimpan dalam `localStorage` dan app tetap boleh digunakan offline.

### Vercel

`.env` lokal tak auto pergi Vercel. Dalam Vercel:

1. Buka `Project Settings`.
2. Pergi `Environment Variables`.
3. Add `VITE_SUPABASE_URL`.
4. Add `VITE_SUPABASE_ANON_KEY`.
5. Optional: add `VITE_SUPABASE_STORAGE_BUCKET` jika nama bucket bukan `baby-food-images`.
6. Set untuk `Production` dan `Preview`.
7. Redeploy app.

Kalau badge atas tulis `Local`, app belum connect ke Supabase lagi.

### Langkah setup penuh

1. Buka [Supabase](https://supabase.com), create project baru.
2. Pergi `SQL Editor`.
3. Jalankan fail `supabase/schema.sql`.
4. Pergi `Project Settings` -> `API`.
5. Salin `Project URL` dan `anon public key`.
6. Letak dalam `.env` sebagai `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
7. Restart `npm run dev`.

### Table yang akan digunakan

- `baby_profiles`
- `menu_planner`
- `feeding_schedule`
- `recipes`
- `food_tracker`

### Storage bucket

- Default bucket: `baby-food-images`
- Folder auto:
  - `tracker/`
  - `recipes/`

## Install PWA

- Android Chrome: buka app, tekan menu, pilih `Install app`.
- iPhone Safari: buka app, tekan Share, pilih `Add to Home Screen`.
