/**
 * ============================================================
 *  SM CUP 2026 — Backend Pendaftaran (Google Apps Script)
 * ============================================================
 *  Cara pakai: lihat README.md di folder ini.
 *
 *  Alur:
 *    1. Google Sheet  -> ambil ID-nya, tempel ke SHEET_ID
 *    2. Script ini     -> Deploy sebagai Web App
 *    3. URL Web App    -> tempel ke config.js (APPS_SCRIPT_URL)
 * ============================================================
 */

// ---------- PENGATURAN ----------
// Boleh diisi ID saja, atau tempel URL lengkap spreadsheet — akan diambil otomatis.
const SHEET_ID  = '1kwkPPWZleL0zDvCq3FUHBNSHahX0OAWeNzWTdGvPZts';
const SHEET_NAME = 'Pendaftaran';

const FEE_AKTIF  = 45000;
const FEE_ALUMNI = 65000;

const KUOTA = {
  'GANDA PUTRA':    { total: 40, alumni_maks: 12 },
  'GANDA PUTRI':    { total: 20, alumni_maks: 6 },
  'GANDA CAMPURAN': { total: 20, alumni_maks: 6 }
};

const WA_NUMBER = '6285298936023';   // nomor narahubung (format internasional)
const WA_NAME   = 'Alfin';

// ---------- titik masuk ----------
function doPost(e) {
  const p = (e.parameter || {});
  const nama = clean(p.nama);
  const wa   = clean(p.wa).replace(/\D/g, '');
  const pk   = clean(p.pk);
  const status = clean(p.status) || 'Awardee Aktif';
  const kats = [clean(p.kat1), clean(p.kat2), clean(p.kat3)].filter(Boolean);
  const catatan = clean(p.catatan);
  const prodi = clean(p.prodi) || clean(p.program_studi);
  const gender = clean(p.gender) || clean(p.jenis_kelamin);
  const jadiWasit = /ya/i.test(clean(p.wasit));
  const wasitJumlah = clean(p.wasit_jumlah);

  // ---- validasi ----
  if (!nama) return page('Nama lengkap wajib diisi.', false);
  if (!/^08\d{8,12}$/.test(wa) && !/^628\d{8,12}$/.test(wa)) {
    return page('Nomor WhatsApp tidak valid. Gunakan format 08xxxxxxxxxx.', false);
  }
  if (!pk) return page('Angkatan PK wajib diisi.', false);
  if (!kats.length) return page('Pilih minimal satu kategori.', false);
  if (kats.length > 2) return page('Maksimal dua kategori per peserta.', false);
  for (const k of kats) {
    if (!KUOTA[k]) return page('Kategori tidak dikenal: ' + k, false);
  }

  if (!prodi) return page('Program studi wajib diisi.', false);
  if (!/^(Laki-laki|Perempuan)$/.test(gender)) {
    return page('Jenis kelamin wajib dipilih (Laki-laki atau Perempuan).', false);
  }
  for (const k of kats) {
    if (k === 'GANDA PUTRA' && gender !== 'Laki-laki') {
      return page('Kategori Ganda Putra hanya untuk peserta laki-laki.', false);
    }
    if (k === 'GANDA PUTRI' && gender !== 'Perempuan') {
      return page('Kategori Ganda Putri hanya untuk peserta perempuan.', false);
    }
  }

  if (jadiWasit && !/^(2|4)$/.test(wasitJumlah)) {
    return page('Pilih jumlah pertandingan yang siap Anda awasi (2 atau 4), atau lepas centang kesediaan wasit.', false);
  }

  const sheet = getSheet();

  // ---- cek kuota per kategori ----
  const counts = hitungKuota(sheet);
  const isAlumni = /alumni/i.test(status);
  const hasilPerKat = [];

  for (const kat of kats) {
    const q = KUOTA[kat];
    const c = counts[kat];
    let st = 'TERDAFTAR';
    if (c.total >= q.total) {
      st = 'PENUH';
    } else if (isAlumni && c.alumni >= q.alumni_maks) {
      st = 'CADANGAN';
    }
    hasilPerKat.push({ kat: kat, status: st });
  }

  // ---- kuota Ganda Campuran per jenis kelamin (10 pria / 10 wanita) ----
  if (kats.indexOf('GANDA CAMPURAN') >= 0) {
    const gc = counts['GANDA CAMPURAN'];
    if (gender === 'Laki-laki' && gc.pria >= 10) {
      return page('Kuota pria Ganda Campuran sudah penuh (' + gc.pria + '/10). ' +
        'Silakan pilih kategori lain atau hubungi narahubung.', false);
    }
    if (gender === 'Perempuan' && gc.wanita >= 10) {
      return page('Kuota wanita Ganda Campuran sudah penuh (' + gc.wanita + '/10). ' +
        'Silakan pilih kategori lain atau hubungi narahubung.', false);
    }
  }

  // ---- kode pendaftaran ----
  const rowNum = sheet.getLastRow() + 1;
  const kode = 'SMC-' + String(rowNum - 1).padStart(4, '0');

  // ---- nominal ----
  const nominal = isAlumni ? FEE_ALUMNI : FEE_AKTIF;

  // ---- tulis ke sheet (satu baris per peserta) ----
  const ringkas = hasilPerKat.map(h => h.kat + ' (' + h.status + ')').join('; ');
  sheet.appendRow([
    new Date(),
    kode,
    nama,
    wa,
    pk,
    status,
    kats[0] || '',
    kats[1] || '',
    nominal,
    hasilPerKat.every(h => h.status === 'TERDAFTAR') ? 'MENUNGGU' : 'PERLU DIBAHAS',
    catatan || '',
    ringkas,
    jadiWasit ? 'Ya' : 'Tidak',
    jadiWasit ? wasitJumlah : '',
    gender,
    prodi
  ]);

  // ---- halaman hasil ----
  const semuaTerdaftar = hasilPerKat.every(h => h.status === 'TERDAFTAR');
  const pesanWa =
    'Halo ' + WA_NAME + ', saya ' + nama + ' (' + kode + ').\n' +
    'Pendaftaran ' + kats.join(' + ') + ' sudah saya kirim.\n' +
    'Berikut bukti transfer ' + rupiah(nominal) + 'nya.';
  const waUrl = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(pesanWa);

  return page(
    '<div class="kode">' + kode + '</div>' +
    '<p class="txt">Nama: <b>' + esc(nama) + '</b><br>' +
    'Kategori: <b>' + esc(kats.join(', ')) + '</b><br>' +
    'Nominal transfer: <b>' + rupiah(nominal) + '</b></p>' +
    (semuaTerdaftar
      ? '<p class="txt ok">Slot kamu aman. Silakan transfer lalu konfirmasi.</p>'
      : '<p class="txt warn">Satu atau lebih kategorimu masuk <b>daftar tunggu</b>. Panitia akan menghubungimu.</p>') +
    '<a class="btn" href="' + waUrl + '" target="_blank">Konfirmasi via WhatsApp</a>' +
    '<p class="small">Simpan kode pendaftaran ini. Panitia akan mencocokkannya dengan transfermu.</p>',
    true
  );
}

// GET: ?action=kuota -> JSON rekap kuota (untuk counter website)
//      tanpa parameter -> halaman biasa
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';

  if (action === 'kuota') {
    const counts = hitungKuota(getSheet());
    return ContentService
      .createTextOutput(JSON.stringify(counts))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return page(
    '<h2>Formulir Pendaftaran</h2>' +
    '<p class="txt">Halaman ini adalah backend formulir. Silakan kembali ke website lalu isi formulirnya.</p>' +
    '<a class="btn" href="https://smcup26.github.io/smcup2026/#daftar">Kembali ke Website</a>',
    true
  );
}

// ---------- helper ----------
// Ambil ID spreadsheet dari teks apa pun (ID murni atau URL lengkap)
function resolveSheetId(raw) {
  const t = String(raw || '').trim();
  const m = t.match(/\/d\/([a-zA-Z0-9_-]{20,})/);
  return m ? m[1] : t;
}

function getSheet() {
  const ss = SpreadsheetApp.openById(resolveSheetId(SHEET_ID));
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(['Waktu','Kode','Nama','No WA','Angkatan PK','Status',
                  'Kategori 1','Kategori 2','Nominal','Status Bayar','Catatan','Ringkasan Kategori','Wasit','Jumlah Wasit','Jenis Kelamin','Program Studi']);
  }
  return sh;
}

function hitungKuota(sheet) {
  const out = {};
  for (const k in KUOTA) out[k] = { total: 0, alumni: 0, pria: 0, wanita: 0 };
  const last = sheet.getLastRow();
  if (last < 2) return out;
  const rows = sheet.getRange(2, 6, last - 1, 10).getValues(); // kolom F..O
  for (const r of rows) {
    const status = String(r[0] || '');
    const isAlumni = /alumni/i.test(status);
    const gender = String(r[9] || ''); // kolom O
    const bayar = String(r[4] || ''); // kolom J
    if (/batal/i.test(bayar)) continue;   // baris yang dibatalkan tidak dihitung
    for (const kat of [String(r[1] || ''), String(r[2] || '')]) {
      if (out[kat]) {
        out[kat].total++;
        if (isAlumni) out[kat].alumni++;
        if (/laki/i.test(gender)) out[kat].pria++;
        else if (/perempuan|wanita/i.test(gender)) out[kat].wanita++;
      }
    }
  }
  return out;
}

function page(inner, ok) {
  const cls = ok ? 'ok' : 'err';
  const html = `<!DOCTYPE html>
  <html lang="id"><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pendaftaran SM CUP 2026</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,Helvetica,sans-serif;background:#FBF6EA;color:#1A4973;
      display:flex;align-items:center;justify-content:center;min-height:100vh;padding:22px}
    .card{background:#fff;border-radius:18px;padding:34px 30px;max-width:460px;width:100%;
      box-shadow:0 8px 24px rgba(26,73,115,.14);text-align:center}
    .mark{width:62px;height:62px;border-radius:50%;margin:0 auto 16px;display:flex;
      align-items:center;justify-content:center;font-size:30px;font-weight:700;color:#fff}
    .${cls} .mark{background:${ok ? '#2E7D32' : '#C41B1B'}}
    h1{font-size:22px;letter-spacing:.02em}
    .kode{font-size:34px;font-weight:900;letter-spacing:.06em;background:#1A4973;color:#F5DD5E;
      border-radius:12px;padding:14px 10px;margin:18px auto;max-width:280px}
    .txt{font-size:15px;line-height:1.65;margin-top:12px;opacity:.9}
    .ok{color:#2E7D32}.warn{color:#B06000}
    .small{font-size:12.5px;opacity:.65;margin-top:16px;line-height:1.5}
    .btn{display:inline-block;background:#FFD200;color:#1A4973;font-weight:700;font-size:15px;
      padding:14px 26px;border-radius:10px;text-decoration:none;margin-top:20px}
  </style></head>
  <body><div class="card ${cls}">
    <div class="mark">${ok ? '✓' : '!'}</div>
    <h1>${ok ? 'Pendaftaran Terkirim' : 'Ada yang Kurang'}</h1>
    ${inner}
  </div></body></html>`;
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function clean(v) { return String(v || '').trim(); }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function rupiah(n) { return 'Rp' + Number(n).toLocaleString('id-ID'); }
