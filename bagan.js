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
      const ket = hari === 1 ? '1 game · 21 poin' : 'Best of 3 game 21 poin';
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

async function muatBagan() {
  const root = document.getElementById('bagan-root');
  if (!root) return;
  try {
    const res = await fetch('bagan.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    renderBagan(data);
  } catch (e) {
    root.innerHTML = '<p style="font-weight:600;font-size:15px;opacity:.75">' +
      'Bagan belum dapat dimuat. Coba muat ulang halaman ini.</p>';
  }
}
muatBagan();
