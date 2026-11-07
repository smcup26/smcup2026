/* ============================================================
   SM CUP 2026 — app.js
   - Menu mobile
   - Countdown pendaftaran
   - Progress bar kuota (dari kuota.json)
   - Status form (dibuka / ditutup)
   - Tombol WhatsApp dengan pesan terisi otomatis
   ============================================================ */

// ---------- menu mobile ----------
const burger = document.getElementById('burger');
const menu = document.getElementById('menu');
if (burger && menu) {
  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));
}

// ---------- countdown ----------
const cdD = document.getElementById('cd-d');
const cdH = document.getElementById('cd-h');
const cdM = document.getElementById('cd-m');
const cdS = document.getElementById('cd-s');

function tick() {
  if (!cdD) return;
  const now = new Date();
  const open = new Date(CONFIG.REG_OPEN);
  const close = new Date(CONFIG.REG_CLOSE);
  let target = open;
  let label = 'Pendaftaran dibuka dalam';

  if (now >= open && now < close) {
    target = close;
    label = 'Pendaftaran ditutup dalam';
  } else if (now >= close) {
    cdD.textContent = '0'; cdH.textContent = '0'; cdM.textContent = '0'; cdS.textContent = '0';
    const kicker = document.querySelector('.count .kicker');
    if (kicker) kicker.textContent = 'Pendaftaran telah ditutup';
    return;
  }

  const kicker = document.querySelector('.count .kicker');
  if (kicker) kicker.textContent = label;

  let diff = Math.max(0, Math.floor((target - now) / 1000));
  const d = Math.floor(diff / 86400); diff %= 86400;
  const h = Math.floor(diff / 3600);  diff %= 3600;
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  cdD.textContent = d;
  cdH.textContent = String(h).padStart(2, '0');
  cdM.textContent = String(m).padStart(2, '0');
  cdS.textContent = String(s).padStart(2, '0');
}
tick();
setInterval(tick, 1000);

// ---------- status form (dibuka / ditutup) ----------
const form = document.getElementById('form');
function formState() {
  const now = new Date();
  const open = new Date(CONFIG.REG_OPEN);
  const close = new Date(CONFIG.REG_CLOSE);
  if (now < open)  return 'belum';
  if (now >= close) return 'tutup';
  return 'buka';
}
if (form) {
  form.addEventListener('submit', (e) => {
    const state = formState();
    if (state !== 'buka') {
      e.preventDefault();
      showErr(state === 'belum'
        ? 'Pendaftaran belum dibuka. Silakan kembali pada 18 November 2026.'
        : 'Pendaftaran sudah ditutup. Hubungi narahubung untuk informasi kuota cadangan.');
      return;
    }
    if (!CONFIG.APPS_SCRIPT_URL) {
      e.preventDefault();
      showErr('Form belum diaktifkan. Silakan hubungi narahubung melalui WhatsApp.');
      return;
    }
    if (!validate()) { e.preventDefault(); return; }
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.textContent = 'Mengirim...';
  });
}

function showErr(msg) {
  const box = document.getElementById('form-err');
  if (!box) return;
  box.textContent = msg;
  box.hidden = false;
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function validate() {
  const nama = document.getElementById('f-nama').value.trim();
  const wa = document.getElementById('f-wa').value.replace(/\D/g, '');
  const pk = document.getElementById('f-pk').value.trim();
  const kats = [...document.querySelectorAll('input[name^="kat"]:checked')].map(c => c.value);
  const setuju = document.getElementById('f-setuju').checked;

  if (!nama) { showErr('Nama lengkap wajib diisi.'); return false; }
  if (!/^08\d{8,12}$/.test(wa) && !/^628\d{8,12}$/.test(wa)) {
    showErr('Nomor WhatsApp tidak valid. Gunakan format 08xxxxxxxxxx.'); return false;
  }
  if (!pk) { showErr('Angkatan PK wajib diisi.'); return false; }
  if (!kats.length) { showErr('Pilih minimal satu kategori.'); return false; }
  if (kats.length > 2) { showErr('Maksimal dua kategori per peserta.'); return false; }
  if (!setuju) { showErr('Centang persetujuan syarat & ketentuan terlebih dahulu.'); return false; }
  return true;
}

// arahkan form ke Apps Script saat halaman dimuat
if (form) {
  if (CONFIG.APPS_SCRIPT_URL) {
    form.method = 'POST';
    form.action = CONFIG.APPS_SCRIPT_URL;
    // hidden field untuk kembali ke situs setelah selesai (opsional)
    const ret = document.createElement('input');
    ret.type = 'hidden'; ret.name = 'kembali';
    ret.value = location.href.split('#')[0];
    form.appendChild(ret);
  }
  // nonaktifkan form di luar periode pendaftaran
  const state = formState();
  if (state !== 'buka') {
    form.querySelectorAll('input, textarea, button').forEach(el => el.disabled = true);
    const note = document.createElement('div');
    note.className = 'err';
    note.textContent = state === 'belum'
      ? 'Pendaftaran belum dibuka. Kembali lagi pada 18 November 2026.'
      : 'Pendaftaran sudah ditutup. Hubungi narahubung untuk informasi kuota cadangan.';
    form.prepend(note);
  }
}

// ---------- progress bar kuota (dari kuota.json) ----------
const KAT_MAP = {
  'GANDA PUTRA':     ['bar-gp', 'sisa-gp', 'alumni-gp'],
  'GANDA PUTRI':     ['bar-gputri', 'sisa-gputri', 'alumni-gputri'],
  'GANDA CAMPURAN':  ['bar-gc', 'sisa-gc', 'alumni-gc']
};

async function loadQuota() {
  let data;
  try {
    const res = await fetch('kuota.json', { cache: 'no-cache' });
    if (!res.ok) return;
    data = await res.json();
  } catch (_) { return; }

  for (const [kat, ids] of Object.entries(KAT_MAP)) {
    const q = CONFIG.KUOTA[kat];
    const row = data[kat] || {};
    const terdaftar = Number(row.terdaftar || 0);
    const alumni = Number(row.alumni || 0);
    const pct = Math.min(100, Math.round((terdaftar / q.total) * 100));
    const sisa = Math.max(0, q.total - terdaftar);

    const bar = document.getElementById(ids[0]);
    if (bar) bar.style.width = pct + '%';
    const sisaEl = document.getElementById(ids[1]);
    if (sisaEl) sisaEl.textContent = 'Sisa slot: ' + sisa + (sisa === 0 ? ' (penuh)' : '');
    const alEl = document.getElementById(ids[2]);
    if (alEl) alEl.textContent = 'Alumni: ' + alumni + '/' + q.alumni_maks;
  }
}
loadQuota();

// ---------- tautan WhatsApp ----------
function waLink(msg) {
  return 'https://wa.me/' + CONFIG.WA_NUMBER + '?text=' + encodeURIComponent(msg);
}
const waDonasi = document.getElementById('wa-donasi');
if (waDonasi) {
  waDonasi.href = waLink('Halo ' + CONFIG.WA_NAME + ', saya ingin memberikan donasi sukarela untuk SM CUP 2026. Berikut bukti transfernya.');
}

// footer: tampilkan nomor WA rapi
const footWa = document.getElementById('foot-wa');
if (footWa) footWa.textContent = CONFIG.WA_NAME + ' — ' + waDisplay();
