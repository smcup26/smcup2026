// ============================================================
//  KONFIGURASI WEBSITE SM CUP 2026
//  Edit bagian ini saja — tidak perlu menyentuh file lain.
// ============================================================

const CONFIG = {
  // Nomor WhatsApp narahubung (format internasional, tanpa +)
  WA_NUMBER: '6285298936023',

  // Nama narahubung yang tampil di website
  WA_NAME: 'Alfin',

  // URL Web App Google Apps Script (diisi setelah deploy, lihat README)
  // Contoh: 'https://script.google.com/macros/s/AKfyc.../exec'
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxFzWB97Z46cPvUjmc5pDle8vEsCVo6Gyf0_r5ofl7RFado_BiNCgM-BaLmIDFm_7BHug/exec',

  // Tanggal penting (format ISO: YYYY-MM-DDTHH:MM:SS)
  REG_OPEN:  '2026-11-18T00:00:00',
  REG_CLOSE: '2026-11-20T20:00:00',
  EVENT_START: '2026-12-05T07:00:00',

  // Biaya pendaftaran
  FEE_AKTIF: 45000,
  FEE_ALUMNI: 65000,

  // Kuota per kategori (total & batas alumni)
  KUOTA: {
    'GANDA PUTRA':     { total: 40, alumni_maks: 16 },
    'GANDA PUTRI':     { total: 20, alumni_maks: 10 },
    'GANDA CAMPURAN':  { total: 20, alumni_maks: 10 }
  }
};

// Nomor WA rapi untuk ditampilkan ke pengunjung
function waDisplay() {
  return '0852-9893-6023';
}

// Rupiah
function rp(n) {
  return 'Rp' + n.toLocaleString('id-ID');
}
