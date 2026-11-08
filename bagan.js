/* ============================================================
   SM CUP 2026 — bagan.js
   Merender bagan dari bagan.json.
   Setelah Technical Meeting, isi nama tim & skor di bagan.json,
   lalu commit & push. Tidak perlu mengubah file lain.
   ============================================================ */

const KATS = ['GANDA PUTRA', 'GANDA PUTRI', 'GANDA CAMPURAN'];
const URUT_RONDE = ['Play-off', '16 Besar', 'Perempat Final', 'Semifinal', 'Final'];

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function labelSumber(ref) {
  if (!ref) return '';
  if (String(ref).startsWith('BYE')) {
    return 'Penerima bye';
  }
  const m = String(ref).match(/^(\D+?)-?(\d+)?$/);
  if (m) {
    return 'Pemenang ' + ref;
  }
  return String(ref);
}

function kartuMatch(m, byId) {
  const nyatakanTim = (val, ref) => {
    if (val && String(val).trim()) {
      return '<span class="nm">' + esc(val) + '</span>';
    }
    if (ref && String(ref).startsWith('BYE')) {
      return '<span class="nm"><span class="tbd">TBD — penerima bye</span></span>';
    }
    if (ref) {
      return '<span class="nm"><span class="tbd">TBD</span> <small>' + esc(labelSumber(ref)) + '</small></span>';
    }
    return '<span class="nm"><span class="tbd">TBD</span></span>';
  };

  const skor = (m.skor || '').trim();
  const badgeHari = m.hari === 2
    ? '<span class="badge hari2">HARI 2</span>'
    : '<span class="badge hari1">HARI 1</span>';
  const badgeBo3 = m.ronde === 'Semifinal' || m.ronde === 'Final'
    ? '<span class="badge bo3">BEST OF 3</span>' : '';
  const kelasFinal = m.ronde === 'Final' ? ' match final' : '';

  return '' +
  '<article class="match' + kelasFinal + '">' +
    '<div class="match-top">' +
      '<span class="match-id">' + esc(m.id) + '</span>' +
      '<span class="match-meta">' + badgeHari +
        '<span class="badge lap">' + esc(m.jam) + ' · Lap. ' + m.lapangan + '</span>' +
        badgeBo3 + '</span>' +
    '</div>' +
    '<div class="team">' + nyatakanTim(m.tim_a, m.dari && m.dari[0]) +
      '<span class="skor">' + (skor ? esc(skor.split('-')[0] || '') : '—') + '</span></div>' +
    '<div class="team">' + nyatakanTim(m.tim_b, m.dari && m.dari[1]) +
      '<span class="skor">' + (skor ? esc(skor.split('-')[1] || '') : '—') + '</span></div>' +
    (m.catatan ? '<div class="match-foot">' + esc(m.catatan) + '</div>' : '') +
  '</article>';
}

function renderBagan(data) {
  const root = document.getElementById('bagan-root');
  if (!root) return;
  const byId = {};
  data.matches.forEach(m => byId[m.id] = m);

  let html = '';

  for (const kat of KATS) {
    const ms = data.matches.filter(m => m.kat === kat);
    if (!ms.length) continue;
    const jumlah = ms.length;

    html += '<div class="bagan-sec">' +
      '<div class="bagan-sec-head">' +
        '<h3>' + esc(kat) + '</h3>' +
        '<span class="cnt">' + jumlah + ' PERTANDINGAN</span>' +
      '</div>';

    // per hari, lalu per ronde
    for (const hari of [1, 2]) {
      const mh = ms.filter(m => m.hari === hari);
      if (!mh.length) continue;
      const tgl = hari === 1 ? 'Hari 1 · Sabtu, 5 Desember 2026' : 'Hari 2 · Minggu, 6 Desember 2026';
      const ket = 'Best of 3 game · 15 poin';
      html += '<div class="day-block">' +
        '<div class="day-head"><span class="tgl">' + tgl + '</span>' +
        '<span class="ket ' + (hari === 1 ? 'd1' : 'd2') + '">' + ket + '</span></div>';

      for (const ronde of URUT_RONDE) {
        const mr = mh.filter(m => m.ronde === ronde);
        if (!mr.length) continue;
        const jamAwal = mr.map(m => m.jam).sort()[0];
        html += '<div class="round-block">' +
          '<div class="round-head"><span>' + esc(ronde) + '</span>' +
          '<span class="jam">mulai ' + jamAwal + ' WIB</span></div>' +
          '<div class="round-grid">' +
            mr.map(m => kartuMatch(m, byId)).join('') +
          '</div></div>';
      }
      html += '</div>';
    }
    html += '</div>';
  }

  root.innerHTML = html;
}


/* ============================================================
   Jadwal gabungan (per lapangan) + kebutuhan lapangan
   ============================================================ */
const KAT_SHORT = {
  'GANDA PUTRA': 'GP',
  'GANDA PUTRI': 'GPI',
  'GANDA CAMPURAN': 'GC'
};
const RONDE_SHORT = {
  'Play-off': 'PO',
  '16 Besar': 'R16',
  'Perempat Final': 'QF',
  'Semifinal': 'SF',
  'Final': 'F'
};

function labelMatch(m) {
  const no = (m.id.match(/(\d+)\s*$/) || [])[1] || '';
  return (KAT_SHORT[m.kat] || m.kat) + ' ' + (RONDE_SHORT[m.ronde] || m.ronde) + (no ? ' ' + no : '');
}

function renderJadwal(data) {
  const root = document.getElementById('jadwal-root');
  if (!root) return;
  const bySlot = {};
  let lapMaks = 0;
  for (const m of data.matches) {
    lapMaks = Math.max(lapMaks, m.lapangan);
    const key = m.hari + '|' + m.jam;
    (bySlot[key] = bySlot[key] || {})[m.lapangan] = m;
  }

  const HARI_NAMA = {
    1: 'Hari 1 · Sabtu, 5 Desember 2026',
    2: 'Hari 2 · Minggu, 6 Desember 2026'
  };
  const BLOK = {
    1: [],
    2: [
      { jam: '10.00', teks: 'Penyerahan hadiah', span: lapMaks },
      { jam: '10.30–13.00', teks: 'Mabar Kelurahan — semua lapangan', span: lapMaks }
    ]
  };

  let html = '<div class="sched">';
  for (const hari of [1, 2]) {
    const slotHari = Object.keys(bySlot)
      .filter(k => k.startsWith(hari + '|'))
      .map(k => k.split('|')[1])
      .sort();
    html += '<div class="sched-day">' +
      '<div class="sched-head"><span class="tgl">' + HARI_NAMA[hari] + '</span>' +
      '<span class="ket ' + (hari === 1 ? 'd1' : 'd2') + '">' +
        (hari === 1 ? '28 pertandingan' : '9 pertandingan + mabar') + '</span></div>';
    html += '<div class="sched-wrap"><table class="sched-tb"><tr><th>Jam</th>';
    for (let l = 1; l <= lapMaks; l++) html += '<th>Lapangan ' + l + '</th>';
    html += '</tr>';
    for (const jam of slotHari) {
      html += '<tr><td class="jam">' + jam + '</td>';
      for (let l = 1; l <= lapMaks; l++) {
        const m = bySlot[hari + '|' + jam][l];
        if (!m) { html += '<td class="kosong">—</td>'; continue; }
        const fin = m.ronde === 'Final' ? ' class="m"' : ' class="m"';
        html += '<td' + (m.ronde === 'Final' ? ' style="background:rgba(255,210,0,.18)"' : '') + '>' +
          '<span class="m">' + labelMatch(m) + '</span>' +
          '<small>' + esc(m.ronde) + ' · ' + esc(m.kat) + '</small></td>';
      }
      html += '</tr>';
    }
    for (const b of BLOK[hari]) {
      html += '<tr class="blok"><td class="jam">' + b.jam + '</td><td colspan="' + lapMaks + '">' + b.teks + '</td></tr>';
    }
    html += '</table></div>';
    if (data.jadwal_kaki && data.jadwal_kaki['hari' + hari]) {
      html += '<div class="kebutuhan-note">' + esc(data.jadwal_kaki['hari' + hari]) + '</div>';
    }
    html += '</div>';
  }
  html += '</div>';

  // ---------- kebutuhan lapangan ----------
  const B = data.booking || {};
  const hitung = (b) => {
    const [jm, mm] = b.mulai.split(':').map(Number);
    const [js, ms] = b.selesai.split(':').map(Number);
    const jam = (js * 60 + ms - (jm * 60 + mm)) / 60;
    const jl = jam * b.lapangan;
    return { jam, jl, biaya: jl * b.harga_per_jam };
  };
  const h1 = hitung(B.hari1), h2 = hitung(B.hari2);
  const totJl = h1.jl + h2.jl, totRp = h1.biaya + h2.biaya;
  html += '<div class="kebutuhan">' +
    '<div class="round-head" style="margin-bottom:12px"><span>Kebutuhan Sewa Venue</span></div>' +
    '<table><tr><th>Hari</th><th>Lapangan</th><th>Jam Booking</th><th>Jam–Lapangan</th><th style="text-align:right">Biaya</th></tr>' +
    '<tr><td><b>Day 1</b> · Sabtu 5 Des</td><td>' + B.hari1.lapangan + ' lapangan</td>' +
      '<td>' + B.hari1.mulai.replace(':', '.') + '–' + B.hari1.selesai.replace(':', '.') + ' (' + h1.jam + ' jam)</td>' +
      '<td>' + h1.jl + '</td><td class="rp">' + rp(h1.biaya) + '</td></tr>' +
    '<tr><td><b>Day 2</b> · Minggu 6 Des</td><td>' + B.hari2.lapangan + ' lapangan</td>' +
      '<td>' + B.hari2.mulai.replace(':', '.') + '–' + B.hari2.selesai.replace(':', '.') + ' (' + h2.jam + ' jam)</td>' +
      '<td>' + h2.jl + '</td><td class="rp">' + rp(h2.biaya) + '</td></tr>' +
    '<tr class="total"><td>Total</td><td></td><td></td><td>' + totJl + '</td><td class="rp">' + rp(totRp) + '</td></tr>' +
    '</table>' +
    '<div class="kebutuhan-note">Harga sewa ' + rp(B.hari1.harga_per_jam) + ' per jam per lapangan. ' +
      'Angka di atas adalah kebutuhan minimum berdasarkan jadwal pertandingan; ' +
      'penyediaan waktu tambahan untuk persiapan dan pembersihan mengikuti kesepakatan dengan pengelola venue.</div>' +
    '</div>';

  root.innerHTML = html;
}

async function muatBagan() {
  const root = document.getElementById('bagan-root');
  if (!root) return;
  try {
    const res = await fetch('bagan.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    renderJadwal(data);
    renderBagan(data);
  } catch (e) {
    root.innerHTML = '<p style="font-weight:600;font-size:15px;opacity:.75">' +
      'Bagan belum dapat dimuat. Coba muat ulang halaman ini.</p>';
  }
}
muatBagan();
