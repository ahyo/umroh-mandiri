(function () {
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };

  // Theme toggle
  const root = document.documentElement;
  const savedTheme = store.get('theme');
  if (savedTheme) root.setAttribute('data-theme', savedTheme);
  document.querySelector('.theme-btn').addEventListener('click', () => {
    const current = root.getAttribute('data-theme') ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    store.set('theme', next);
  });

  const SURAH = ['Al-Fatihah', 'Al-Baqarah', 'Ali ‘Imran', 'An-Nisa’', 'Al-Ma’idah', 'Al-An’am', 'Al-A’raf', 'Al-Anfal', 'At-Taubah', 'Yunus',
    'Hud', 'Yusuf', 'Ar-Ra’d', 'Ibrahim', 'Al-Hijr', 'An-Nahl', 'Al-Isra’', 'Al-Kahf', 'Maryam', 'Taha',
    'Al-Anbiya’', 'Al-Hajj', 'Al-Mu’minun', 'An-Nur', 'Al-Furqan', 'Asy-Syu’ara’', 'An-Naml', 'Al-Qasas', 'Al-‘Ankabut', 'Ar-Rum',
    'Luqman', 'As-Sajdah', 'Al-Ahzab', 'Saba’', 'Fatir', 'Yasin', 'As-Saffat', 'Sad', 'Az-Zumar', 'Gafir',
    'Fussilat', 'Asy-Syura', 'Az-Zukhruf', 'Ad-Dukhan', 'Al-Jasiyah', 'Al-Ahqaf', 'Muhammad', 'Al-Fath', 'Al-Hujurat', 'Qaf',
    'Az-Zariyat', 'At-Tur', 'An-Najm', 'Al-Qamar', 'Ar-Rahman', 'Al-Waqi’ah', 'Al-Hadid', 'Al-Mujadilah', 'Al-Hasyr', 'Al-Mumtahanah',
    'As-Saff', 'Al-Jumu’ah', 'Al-Munafiqun', 'At-Tagabun', 'At-Talaq', 'At-Tahrim', 'Al-Mulk', 'Al-Qalam', 'Al-Haqqah', 'Al-Ma’arij',
    'Nuh', 'Al-Jinn', 'Al-Muzzammil', 'Al-Muddassir', 'Al-Qiyamah', 'Al-Insan', 'Al-Mursalat', 'An-Naba’', 'An-Nazi’at', '‘Abasa',
    'At-Takwir', 'Al-Infitar', 'Al-Mutaffifin', 'Al-Insyiqaq', 'Al-Buruj', 'At-Tariq', 'Al-A’la', 'Al-Gasyiyah', 'Al-Fajr', 'Al-Balad',
    'Asy-Syams', 'Al-Lail', 'Ad-Duha', 'Asy-Syarh', 'At-Tin', 'Al-‘Alaq', 'Al-Qadr', 'Al-Bayyinah', 'Az-Zalzalah', 'Al-‘Adiyat',
    'Al-Qari’ah', 'At-Takasur', 'Al-‘Asr', 'Al-Humazah', 'Al-Fil', 'Quraisy', 'Al-Ma’un', 'Al-Kausar', 'Al-Kafirun', 'An-Nasr',
    'Al-Lahab', 'Al-Ikhlas', 'Al-Falaq', 'An-Nas'];
  // Halaman awal tiap surah & juz pada mushaf Madinah 604 halaman
  const SURAH_PAGE = [1, 2, 50, 77, 106, 128, 151, 177, 187, 208, 221, 235, 249, 255, 262, 267, 282, 293, 305, 312, 322, 332, 342, 350, 359, 367, 377, 385, 396, 404, 411, 415, 418, 428, 434, 440, 446, 453, 458, 467, 477, 483, 489, 496, 499, 502, 507, 511, 515, 518, 520, 523, 526, 528, 531, 534, 537, 542, 545, 549, 551, 553, 554, 556, 558, 560, 562, 564, 566, 568, 570, 572, 574, 575, 577, 578, 580, 582, 583, 585, 586, 587, 587, 589, 590, 591, 591, 592, 593, 594, 595, 595, 596, 596, 597, 597, 598, 598, 599, 599, 600, 600, 601, 601, 601, 602, 602, 602, 603, 603, 603, 604, 604, 604];
  const JUZ_PAGE = [1, 22, 42, 62, 82, 102, 121, 142, 162, 182, 201, 222, 242, 262, 282, 302, 322, 342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582];
  const QARI = {
    alafasy: { name: 'Mishary Rasyid Alafasy', path: '128/ar.alafasy' },
    sudais: { name: 'Abdurrahman As-Sudais (Imam Masjidil Haram)', path: '64/ar.abdurrahmaansudais' },
    husary: { name: 'Mahmoud Khalil Al-Husary', path: '128/ar.husary' },
  };
  const LAST = 604;
  const API = 'https://api.alquran.cloud/v1/page/';
  const arNum = n => n.toLocaleString('ar-EG');

  const $ = id => document.getElementById(id);
  const selSurah = $('q-surah'), selJuz = $('q-juz'), inPage = $('q-page'), selQari = $('q-qari');
  const body = $('q-body'), info = $('q-info'), pageNo = $('q-pageno'), playBtn = $('q-play');
  selSurah.innerHTML = SURAH.map((s, i) => `<option value="${i + 1}">${i + 1}. ${s}</option>`).join('');
  selJuz.innerHTML = JUZ_PAGE.map((_, i) => `<option value="${i + 1}">Juz ${i + 1}</option>`).join('');
  selQari.innerHTML = Object.entries(QARI).map(([k, q]) => `<option value="${k}">${q.name}</option>`).join('');

  let page = 1, ayahs = [], mode = store.get('quran-mode') || 'mushaf';
  selQari.value = QARI[store.get('quran-qari')] ? store.get('quran-qari') : 'alafasy';

  // Ambil teks Arab + terjemahan satu halaman (disimpan di memori)
  const cache = new Map();
  function load(p) {
    if (!cache.has(p)) {
      const get = ed => fetch(API + p + '/' + ed).then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).then(j => j.data.ayahs);
      cache.set(p, Promise.all([get('quran-uthmani'), get('id.indonesian')]).then(([ar, tr]) => ar.map((a, i) => {
        let text = a.text.replace(/^﻿/, '');
        // Basmalah ayat pertama tiap surah (selain Al-Fatihah) ditampilkan terpisah
        if (a.numberInSurah === 1 && a.surah.number !== 1 && /^\S*سْمِ\s/.test(text)) {
          text = text.split(' ').slice(4).join(' ');
        }
        return { n: a.number, s: a.surah.number, a: a.numberInSurah, total: a.surah.numberOfAyahs,
          arName: a.surah.name, juz: a.juz, sajda: !!a.sajda, text, tr: tr[i].text };
      })).catch(e => { cache.delete(p); throw e; }));
    }
    return cache.get(p);
  }

  function surahHead(x) {
    return `<div class="q-surah-head"><span class="q-surah-ar">${x.arName}</span>` +
      `<span class="q-surah-lat">${x.s}. ${SURAH[x.s - 1]} · ${x.total} ayat</span></div>` +
      (x.s !== 1 && x.s !== 9 ? '<p class="q-basmalah">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>' : '');
  }

  function render() {
    const parts = [];
    if (mode === 'mushaf') {
      let open = false;
      ayahs.forEach((x, i) => {
        if (x.a === 1) {
          if (open) parts.push('</p>');
          parts.push(surahHead(x));
          open = false;
        }
        if (!open) { parts.push('<p class="q-mushaf">'); open = true; }
        parts.push(`<span class="q-ayah" data-i="${i}">${x.text}</span> <span class="q-mark" data-i="${i}">﴿${arNum(x.a)}﴾</span>${x.sajda ? '<span class="q-sajda">۩</span>' : ''} `);
      });
      if (open) parts.push('</p>');
    } else {
      ayahs.forEach((x, i) => {
        if (x.a === 1) parts.push(surahHead(x));
        parts.push(`<div class="q-row" data-i="${i}">
          <div class="q-row-head"><span>${SURAH[x.s - 1]} : ${x.a}${x.sajda ? ' · ayat sajdah' : ''}</span><button type="button" class="q-row-play" data-i="${i}" aria-label="Putar ayat ${x.a}">▶</button></div>
          <p class="q-row-ar"><span class="q-ayah" data-i="${i}">${x.text}</span> <span class="q-mark">﴿${arNum(x.a)}﴾</span></p>
          <p class="q-row-tr">${x.tr}</p>
        </div>`);
      });
    }
    body.innerHTML = parts.join('');
    const first = ayahs[0], last = ayahs[ayahs.length - 1];
    const names = [...new Set(ayahs.map(x => SURAH[x.s - 1]))].join(', ');
    info.textContent = 'Juz ' + first.juz + ' · ' + names;
    pageNo.textContent = 'Hal. ' + page + ' / ' + LAST;
    selSurah.value = last.s;
    selJuz.value = first.juz;
    document.querySelectorAll('.q-mode .chip').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
    highlight();
  }

  let token = 0;
  async function go(p, opts = {}) {
    p = Math.min(LAST, Math.max(1, p | 0));
    const my = ++token;
    page = p;
    inPage.value = p;
    store.set('quran-page', p);
    history.replaceState(null, '', '#hal-' + p);
    $('q-prev').disabled = p <= 1;
    $('q-next').disabled = p >= LAST;
    pageNo.textContent = 'Hal. ' + p + ' / ' + LAST;
    if (!opts.keepAudio) stop();
    body.innerHTML = '<p class="muted q-status">Memuat halaman…</p>';
    try {
      const data = await load(p);
      if (my !== token) return;
      ayahs = data;
      render();
      if (!opts.keepScroll) $('q-sheet').scrollIntoView({ block: 'start' });
      if (p < LAST) load(p + 1).catch(() => {});
      if (opts.playFrom != null) playAt(opts.playFrom);
    } catch (e) {
      if (my !== token) return;
      body.innerHTML = '<p class="q-status">Gagal memuat. Pastikan ada koneksi internet. ' +
        '<button type="button" class="btn btn-ghost small-btn" id="q-retry">Coba lagi</button></p>';
      $('q-retry').addEventListener('click', () => go(p));
    }
  }

  // Audio murottal per ayat, lanjut otomatis ke ayat & halaman berikutnya
  const audio = new Audio();
  const preload = new Audio();
  preload.preload = 'auto';
  let cur = -1;
  const url = x => 'https://cdn.islamic.network/quran/audio/' + QARI[selQari.value].path + '/' + x.n + '.mp3';

  function highlight() {
    body.querySelectorAll('.playing').forEach(el => el.classList.remove('playing'));
    if (cur < 0) return;
    const els = body.querySelectorAll(`[data-i="${cur}"]:not(button)`);
    els.forEach(el => el.classList.add('playing'));
    if (els[0]) els[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  function playAt(i) {
    cur = i;
    audio.src = url(ayahs[i]);
    audio.play().catch(() => {});
    if (ayahs[i + 1]) preload.src = url(ayahs[i + 1]);
    playBtn.textContent = '❚❚ Jeda';
    highlight();
  }
  function stop() {
    audio.pause();
    cur = -1;
    playBtn.textContent = '▶ Putar';
    highlight();
  }
  audio.addEventListener('ended', () => {
    if (cur + 1 < ayahs.length) playAt(cur + 1);
    else if (page < LAST) go(page + 1, { keepAudio: true, keepScroll: true, playFrom: 0 });
    else stop();
  });
  audio.addEventListener('error', () => {
    if (cur >= 0) { stop(); alert('Audio gagal dimuat. Periksa koneksi internet.'); }
  });
  playBtn.addEventListener('click', () => {
    if (!ayahs.length) return;
    if (cur < 0) playAt(0);
    else if (audio.paused) { audio.play().catch(() => {}); playBtn.textContent = '❚❚ Jeda'; }
    else { audio.pause(); playBtn.textContent = '▶ Lanjut'; }
  });
  body.addEventListener('click', e => {
    const t = e.target.closest('[data-i]');
    if (t && ayahs.length) playAt(+t.dataset.i);
  });

  selSurah.addEventListener('change', () => go(SURAH_PAGE[selSurah.value - 1]));
  selJuz.addEventListener('change', () => go(JUZ_PAGE[selJuz.value - 1]));
  inPage.addEventListener('change', () => go(+inPage.value));
  selQari.addEventListener('change', () => {
    store.set('quran-qari', selQari.value);
    if (cur >= 0) playAt(cur);
  });
  document.querySelectorAll('.q-mode .chip').forEach(b => b.addEventListener('click', () => {
    mode = b.dataset.mode;
    store.set('quran-mode', mode);
    if (ayahs.length) render();
  }));
  $('q-prev').addEventListener('click', () => go(page - 1));
  $('q-next').addEventListener('click', () => go(page + 1));

  const fromHash = /^#hal-(\d+)$/.exec(location.hash);
  go(fromHash ? +fromHash[1] : +store.get('quran-page') || 1, { keepScroll: true });
})();
