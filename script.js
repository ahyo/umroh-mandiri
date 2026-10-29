(function () {
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
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

  // Mobile menu
  const nav = document.getElementById('nav');
  const menuBtn = document.querySelector('.menu-btn');
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }));

  // Scrollspy
  const links = [...nav.querySelectorAll('a')];
  const sections = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => spy.observe(s));

  // Kalkulator biaya: tiap nilai disimpan dalam mata uang aslinya (data-base),
  // lalu dikonversi hanya saat ditampilkan. Mengubah kurs tidak mengubah angka aslinya.
  const form = document.getElementById('calc');
  const PER_KAMAR = 4;
  const fmt = n => Math.round(n).toLocaleString('id-ID');
  const parseNum = v => {
    const t = String(v).replace(/[^\d,]/g, '').replace(',', '.');
    return t === '' ? 0 : parseFloat(t) || 0;
  };
  // Beri pemisah ribuan sambil menjaga posisi kursor
  function reformat(el) {
    const before = el.value.slice(0, el.selectionStart).replace(/\D/g, '').length;
    const [int, ...rest] = el.value.replace(/[^\d,]/g, '').split(',');
    const dec = rest.length ? ',' + rest.join('').slice(0, 2) : '';
    const out = (int ? Number(int).toLocaleString('id-ID') : '') + dec;
    el.value = out;
    let seen = 0, i = 0;
    for (; i < out.length && seen < before; i++) if (/\d/.test(out[i])) seen++;
    try { el.setSelectionRange(i, i); } catch (e) {}
  }

  const moneyEls = [...form.querySelectorAll('input[data-money]')];
  const kursEl = form.elements.kurs;
  let kurs = parseNum(kursEl.value) || 4400;
  let cur = store.get('calc-cur') === 'sar' ? 'sar' : 'idr';
  const canon = {}, base = {};
  moneyEls.forEach(el => {
    base[el.name] = el.dataset.base;
    canon[el.name] = parseNum(el.value);
  });

  // Nilai sebuah pos dalam mata uang yang sedang ditampilkan
  const val = name => base[name] === cur ? canon[name]
    : cur === 'sar' ? canon[name] / (kurs || 1) : canon[name] * kurs;
  const uang = n => (cur === 'sar' ? 'SAR ' : 'Rp ') + fmt(n);

  function renderInputs(skip) {
    moneyEls.forEach(el => { if (el !== skip) el.value = fmt(val(el.name)); });
    if (kursEl !== skip) kursEl.value = fmt(kurs);
    form.querySelectorAll('.cur').forEach(el => { el.textContent = cur === 'sar' ? 'SAR' : 'Rp'; });
    document.querySelectorAll('.calc-cur .chip').forEach(b => b.classList.toggle('on', b.dataset.cur === cur));
  }

  function calc(e) {
    // Satu kamar maksimal 4 orang: kamar ikut jumlah jemaah, boleh ditambah manual
    const minKamar = Math.ceil(Math.max(1, parseFloat(form.elements.orang.value) || 0) / PER_KAMAR);
    const kamarEl = form.elements.kamar;
    kamarEl.min = minKamar;
    if ((e && e.target === form.elements.orang) || (parseFloat(kamarEl.value) || 0) < minKamar) {
      kamarEl.value = minKamar;
    }
    const num = n => Math.max(0, parseFloat(form.elements[n].value) || 0);
    const orang = Math.max(1, num('orang'));
    const kamar = Math.max(1, num('kamar'));
    const nmed = num('nmed'), nmak = num('nmak');
    const days = nmed + nmak + 1;
    const xOrang = ' × ' + orang + ' orang';
    const xKamar = ' × ' + kamar + ' kamar';
    const parts = [
      ['Tiket pesawat', uang(val('tiket')) + xOrang, val('tiket') * orang],
      ['Visa + asuransi', uang(val('visa')) + xOrang, val('visa') * orang],
      ['Hotel Madinah', uang(val('hmed')) + ' × ' + nmed + ' malam' + xKamar, val('hmed') * nmed * kamar],
      ['Hotel Makkah', uang(val('hmak')) + ' × ' + nmak + ' malam' + xKamar, val('hmak') * nmak * kamar],
      ['Transportasi lokal', uang(val('trans')) + xOrang, val('trans') * orang],
      ['Makan', uang(val('makan')) + ' × ' + days + ' hari' + xOrang, val('makan') * days * orang],
      ['Vaksin, SIM, lain-lain', uang(val('lain')) + xOrang, val('lain') * orang],
    ];
    const total = parts.reduce((s, p) => s + p[2], 0);
    document.getElementById('calc-total').textContent = uang(total);
    document.getElementById('calc-per').textContent = uang(total / orang) + ' / orang';
    document.getElementById('calc-breakdown').innerHTML =
      parts.map(([k, d, x]) => `<dt>${k}<small>${d}</small></dt><dd>${uang(x)}</dd>`).join('') +
      `<dt class="calc-kurs">Kurs: 1 SAR = Rp ${fmt(kurs)}</dt>`;
  }

  moneyEls.forEach(el => el.addEventListener('input', () => {
    reformat(el);
    const v = parseNum(el.value);
    canon[el.name] = base[el.name] === cur ? v
      : cur === 'sar' ? v * kurs : v / (kurs || 1);
  }));
  kursEl.addEventListener('input', () => {
    reformat(kursEl);
    const v = parseNum(kursEl.value);
    if (v > 0) { kurs = v; renderInputs(kursEl); }
  });
  form.addEventListener('input', calc);
  document.querySelectorAll('.calc-cur .chip').forEach(btn => btn.addEventListener('click', () => {
    cur = btn.dataset.cur;
    store.set('calc-cur', cur);
    renderInputs();
    calc();
  }));
  document.querySelectorAll('.presets:not(.calc-cur) .chip').forEach(btn => btn.addEventListener('click', () => {
    canon.hmed = +btn.dataset.med;
    canon.hmak = +btn.dataset.mak;
    renderInputs();
    calc();
  }));
  renderInputs();
  calc();

  // Penghitung putaran tawaf & sa'i (tersimpan agar aman jika halaman dimuat ulang)
  const statusText = {
    tawaf: n => n === 0 ? 'Mulai dari garis Hajar Aswad'
      : n >= 7 ? 'Selesai ✓ Lanjut sholat 2 rakaat'
      : 'Sedang putaran ke-' + (n + 1),
    sai: n => n === 0 ? 'Mulai dari Shafa'
      : n >= 7 ? 'Selesai di Marwah ✓ Lanjut tahallul'
      : 'Perjalanan ke-' + (n + 1) + ': ' + (n % 2 ? 'Marwah → Shafa' : 'Shafa → Marwah'),
  };
  document.querySelectorAll('.counter').forEach(box => {
    const kind = box.dataset.counter;
    const max = +box.dataset.max;
    const key = 'umroh-counter-' + kind;
    let n = Math.min(max, parseInt(store.get(key), 10) || 0);
    const num = box.querySelector('.counter-num');
    const status = box.querySelector('.counter-status');
    const tap = box.querySelector('.counter-tap');
    const dots = box.querySelector('.counter-dots');
    dots.innerHTML = '<span></span>'.repeat(max);
    function render() {
      num.textContent = n;
      status.textContent = statusText[kind](n);
      [...dots.children].forEach((d, i) => d.classList.toggle('on', i < n));
      box.classList.toggle('done', n >= max);
      tap.disabled = n >= max;
      store.set(key, n);
    }
    tap.addEventListener('click', () => {
      if (n >= max) return;
      n++;
      if (navigator.vibrate) navigator.vibrate(n >= max ? [80, 60, 80] : 40);
      render();
    });
    box.querySelector('[data-act="undo"]').addEventListener('click', () => { if (n > 0) { n--; render(); } });
    box.querySelector('[data-act="reset"]').addEventListener('click', () => {
      if (n > 0 && !confirm('Ulang hitungan dari 0?')) return;
      n = 0; render();
    });
    render();
  });

  // Checklist
  const groups = {
    'Dokumen': [
      'Paspor (berlaku ≥ 6 bulan)',
      'E-visa umroh (cetak + digital)',
      'Voucher hotel Madinah & Makkah',
      'Tiket pesawat PP',
      'Sertifikat vaksin meningitis (ICV)',
      'Surat keterangan sehat',
      'Bukti pembelian layanan (penyedia terdaftar)',
      'Fotokopi paspor & pas foto cadangan',
      'Kartu debit/kredit + uang Riyal',
    ],
    'Ibadah': [
      'Kain ihram 2 set (laki-laki)',
      'Sabuk ihram / tas pinggang',
      'Sandal ihram (tidak menutup mata kaki)',
      'Mukena & pakaian syar’i (perempuan)',
      'Buku doa / aplikasi doa umroh',
      'Tasbih / penghitung putaran',
      'Sajadah lipat kecil',
      'Gunting kecil untuk tahallul',
      'Tas kecil untuk sandal di masjid',
    ],
    'Pribadi & kesehatan': [
      'Obat pribadi + resep dokter',
      'Masker, hand sanitizer',
      'Vitamin & oralit',
      'Pelembab bibir & kulit (tanpa wangi untuk ihram)',
      'Sabun & sampo tanpa pewangi',
      'Kacamata hitam & payung',
      'Botol semprot air',
      'Power bank & charger + adaptor colokan',
      'Aplikasi: Nusuk, Careem/Uber, Haramain, Maps',
    ],
  };
  const KEY = 'umroh-checklist-v1';
  let state = {};
  try { state = JSON.parse(store.get(KEY) || '{}') || {}; } catch (e) { state = {}; }
  const cl = document.getElementById('cl');
  let total = 0;
  cl.innerHTML = Object.entries(groups).map(([g, items]) => `
    <div class="cl-group"><h3>${g}</h3>
      ${items.map((it, i) => { total++; const id = g + '-' + i; return `
        <label><input type="checkbox" data-id="${id}" ${state[id] ? 'checked' : ''}><span>${it}</span></label>`; }).join('')}
    </div>`).join('');
  const prog = document.getElementById('cl-progress');
  function updateProgress() {
    const done = cl.querySelectorAll('input:checked').length;
    prog.textContent = Math.round(done / total * 100) + '% (' + done + '/' + total + ')';
  }
  cl.addEventListener('change', e => {
    if (!e.target.dataset.id) return;
    state[e.target.dataset.id] = e.target.checked;
    store.set(KEY, JSON.stringify(state));
    updateProgress();
  });
  document.getElementById('cl-reset').addEventListener('click', () => {
    state = {}; store.del(KEY);
    cl.querySelectorAll('input').forEach(i => { i.checked = false; });
    updateProgress();
  });
  updateProgress();
})();
