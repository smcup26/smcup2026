/* Pembaca data pendaftaran langsung dari Google Sheets (CSV publik).
   Dipakai oleh halaman status dan penghitung kuota. */
const BATAS_MENUNGGU_JAM = 12;
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1kwkPPWZleL0zDvCq3FUHBNSHahX0OAWeNzWTdGvPZts/export?format=csv&gid=0';

function parseCsvTeks(teks) {
  const baris = [];
  let sel = '', selBaris = [], dalamKutip = false;
  const s = String(teks || '').replace(/^\uFEFF/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"') {
      if (dalamKutip && s[i + 1] === '"') { sel += '"'; i++; }
      else dalamKutip = !dalamKutip;
    } else if (c === ',' && !dalamKutip) {
      selBaris.push(sel); sel = '';
    } else if ((c === '\n' || c === '\r') && !dalamKutip) {
      if (c === '\r' && s[i + 1] === '\n') i++;
      selBaris.push(sel);
      if (selBaris.some(x => String(x).trim() !== '')) baris.push(selBaris);
      selBaris = []; sel = '';
    } else {
      sel += c;
    }
  }
  selBaris.push(sel);
  if (selBaris.some(x => String(x).trim() !== '')) baris.push(selBaris);

  if (!baris.length) return [];
  const head = baris[0].map(x => String(x).trim());
  return baris.slice(1).map(row => {
    const o = {};
    head.forEach((h, i) => { o[h] = String(row[i] == null ? '' : row[i]).trim(); });
    return o;
  });
}

async function ambilPendaftaran() {
  const res = await fetch(SHEET_CSV_URL + '&t=' + Date.now(), { cache: 'no-store' });
  if (!res.ok) throw new Error('Gagal mengambil data (' + res.status + ')');
  return parseCsvTeks(await res.text());
}

function parseWaktuSheet(teks) {
  const m = String(teks || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  return new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5], +(m[6] || 0)).getTime();
}

function statusMenunggu(row) {
  const s = String(row['Status Bayar'] || '').toUpperCase();
  return s === '' || s.indexOf('MENUNGGU') >= 0;
}

function sudahKedaluwarsa(row, sekarang) {
  if (!statusMenunggu(row)) return false;
  const t = parseWaktuSheet(row['Waktu']);
  if (!t) return false;
  return ((sekarang || Date.now()) - t) > BATAS_MENUNGGU_JAM * 3600 * 1000;
}

function labelStatus(row, sekarang) {
  const s = String(row['Status Bayar'] || '').trim();
  if (sudahKedaluwarsa(row, sekarang)) return 'KEDALUWARSA';
  return s || 'MENUNGGU';
}

function hitungKuotaDariBaris(rows) {
  const out = {
    'GANDA PUTRA':     { total: 0, alumni: 0, pria: 0, wanita: 0 },
    'GANDA PUTRI':     { total: 0, alumni: 0, pria: 0, wanita: 0 },
    'GANDA CAMPURAN':  { total: 0, alumni: 0, pria: 0, wanita: 0 }
  };
  const sekarang = Date.now();
  for (const r of rows) {
    if (/batal/i.test(r['Status Bayar'] || '')) continue;
    if (sudahKedaluwarsa(r, sekarang)) continue;
    const alumni = /alumni/i.test(r['Status'] || '');
    const gender = r['Jenis Kelamin'] || '';
    for (const k of [r['Kategori 1'], r['Kategori 2']]) {
      if (!k || !out[k]) continue;
      out[k].total++;
      if (alumni) out[k].alumni++;
      if (/laki/i.test(gender)) out[k].pria++;
      else if (/perempuan|wanita/i.test(gender)) out[k].wanita++;
    }
  }
  return out;
}
