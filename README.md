# Website SM CUP 2026

Landing page pendaftaran **SM CUP 2026 (Sinergi Maju Cup)** — turnamen badminton Kelurahan LPDP UGM.
Statis, mobile-first, siap di-host di GitHub Pages.

Halaman: **https://smcup26.github.io/smcup2026/**

---

## 1. Buat Google Sheet

1. Buka **sheets.google.com** dengan akun `alfinbaso95@gmail.com`
2. Spreadsheet baru → beri nama **`SM CUP 2026 — Pendaftar`**
3. Di baris pertama, isi header ini (persis):

```
Waktu | Kode | Nama | No WA | Angkatan PK | Status | Kategori 1 | Kategori 2 | Nominal | Status Bayar | Catatan | Ringkasan Kategori | Wasit | Jumlah Wasit | Jenis Kelamin
```

4. Kosongkan baris-baris berikutnya.

## 2. Pasang Apps Script

1. Buka **script.google.com** → project baru → nama **`SM CUP 2026`**
2. Hapus isi `Code.gs` bawaan, lalu tempel isi file **`apps-script/Code.gs`**
3. Ganti baris ini dengan **ID spreadsheet** dari langkah 1:

```js
const SHEET_ID = 'GANTI_DENGAN_ID_SPREADSHEET';
```

ID diambil dari URL Sheet: `https://docs.google.com/spreadsheets/d/`**XXXXX**`/edit`

4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Salin URL yang muncul (berakhiran `/exec`)
6. Buka **`config.js`** → tempel URL itu ke `APPS_SCRIPT_URL`
7. Kalau nanti mengubah kode: **Deploy → Manage deployments → Edit → Version: New deployment** (jangan buat deployment baru, URL-nya berubah)

## 3. Upload ke GitHub

1. Repo `smcup2026` (publik) → **Add file → Upload files**
2. Tarik semua isi folder ini (index.html, style.css, app.js, config.js, kuota.json, pedoman.html, folder `assets/` dan `fonts/`)
3. Commit

## 4. Aktifkan GitHub Pages

Repo → **Settings → Pages** → Source: *Deploy from a branch* → `main` + `/(root)` → **Save**.

## 5. Uji

- Buka website dari HP
- Isi form dengan nama contoh → pastikan muncul kode `SMC-0001` dan barisnya masuk ke Sheet
- Klik tombol WhatsApp → pastikan chat terbuka dengan pesan yang sudah terisi
- Hapus data test-nya

## 6. Update kuota

Edit **`kuota.json`** sesuai jumlah terdaftar, lalu commit & push. Progress bar di halaman kategori ikut berubah otomatis.

```json
{
  "GANDA PUTRA":    { "terdaftar": 12, "alumni": 3 },
  "GANDA PUTRI":    { "terdaftar": 5,  "alumni": 2 },
  "GANDA CAMPURAN": { "terdaftar": 7,  "alumni": 2 }
}
```

## 7. Kalau subdomain kampus sudah diizinkan

Tambahkan record DNS `CNAME smcup → smcup26.github.io` di pengelola `lpdpugm.or.id`,
lalu di repo → Settings → Pages → isi Custom domain `smcup.lpdpugm.or.id` dan centang *Enforce HTTPS*.
Tidak perlu deploy ulang; alamat lama otomatis redirect.

---

## Catatan operasional

- **Batas alumni 30%** per kategori ditegakkan di sisi server (`Code.gs`).
  Kalau kuota alumni penuh, peserta otomatis masuk status **CADANGAN** (daftar tunggu).
- Data pendaftar **tidak** ditampilkan di website. Hanya angka kuota di `kuota.json`.
- Jangan gunakan repo ini untuk menyimpan kunci privat atau data pribadi.
