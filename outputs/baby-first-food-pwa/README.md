# Baby First Food PWA

PWA mobile-first untuk ibu bapa merancang menu, jadual makan, resepi dan rekod makanan pertama bayi 6 bulan ke atas.

## Cara Guna

1. Buka tab `Dashboard` untuk isi profil bayi dan semak umur semasa.
2. Pergi `Resepi` untuk tambah resepi baharu, guna gambar dari camera atau upload file.
3. Pergi `Menu` untuk rancang makanan ikut minggu, tarikh, dan masa makan.
4. Pergi `Jadual` untuk pilih menu yang sudah ada dan susun ikut sarapan, tengah hari, petang, malam.
5. Pergi `Tracker` untuk simpan feedback bayi selepas makan, sama ada dari menu atau secara manual.
6. Simpan data dan tunggu status `Synced` jika Google Apps Script sudah connect.
7. Kalau status `Local`, data masih ada dalam phone browser, cuma belum hantar ke Google Sheet.

## Jalankan

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Google Sheets + Apps Script

Salin `.env.example` ke `.env` dan isi:

```bash
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/XXXX/exec
```

Tanpa konfigurasi ini, data disimpan dalam `localStorage` dan app tetap boleh digunakan offline.

### Langkah setup penuh

1. Buka Google Sheet baru.
2. Simpan `spreadsheetId` daripada URL sheet itu.
3. Dalam folder [google-apps-script/Code.gs](C:/Users/fikri/Documents/Codex/2026-06-12/caveman-c-users-fikri-agents-skills-2/outputs/baby-first-food-pwa/google-apps-script/Code.gs), salin semua kod ke project Google Apps Script baru.
4. Tukar nilai `SPREADSHEET_ID` kepada ID sheet anda.
5. Dalam Apps Script, tekan `Deploy` -> `New deployment`.
6. Pilih `Web app`.
7. `Execute as`: `Me`.
8. `Who has access`: `Anyone with the link`.
9. Tekan `Deploy`, authorize bila diminta, lalu salin URL `.../exec`.
10. Letak URL itu dalam `.env` sebagai `VITE_GOOGLE_SCRIPT_URL`.
11. Restart `npm run dev`.

### Sheet yang akan dicipta automatik

- `BabyProfile`: `id`, `baby_name`, `birth_date`
- `MenuPlanner`: `id`, `week`, `date`, `day`, `menu`, `ingredients`, `cooking_method`, `reaction`, `notes`, `meal_time`
- `FeedingSchedule`: `id`, `week`, `day`, `breakfast`, `lunch`, `evening`, `dinner`
- `Recipes`: `id`, `title`, `image_url`, `age_category`, `category`, `ingredients`, `instructions`, `notes`, `source_link`
- `FoodTracker`: `id`, `food_name`, `introduced_date`, `status`, `reaction`, `notes`

## Install PWA

- Android Chrome: buka app, tekan menu, pilih `Install app`.
- iPhone Safari: buka app, tekan Share, pilih `Add to Home Screen`.
