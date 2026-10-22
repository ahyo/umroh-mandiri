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

  // Cost calculator
  const form = document.getElementById('calc');
  const rp = n => 'Rp ' + Math.round(n).toLocaleString('id-ID');
  const PER_KAMAR = 4;
  function calc(e) {
    // Satu kamar maksimal 4 orang: kamar ikut jumlah jemaah, boleh ditambah manual
    const minKamar = Math.ceil(Math.max(1, parseFloat(form.elements.orang.value) || 0) / PER_KAMAR);
    const kamarEl = form.elements.kamar;
    kamarEl.min = minKamar;
    if ((e && e.target === form.elements.orang) || (parseFloat(kamarEl.value) || 0) < minKamar) {
      kamarEl.value = minKamar;
    }
    const v = Object.fromEntries([...new FormData(form)].map(([k, x]) => [k, Math.max(0, parseFloat(x) || 0)]));
    const orang = Math.max(1, v.orang);
    const days = v.nmed + v.nmak + 1;
    const parts = [
      ['Tiket pesawat', v.tiket * orang],
      ['Visa + asuransi', v.visa * v.kurs * orang],
      ['Hotel Madinah', v.hmed * v.nmed * v.kamar * v.kurs],
      ['Hotel Makkah', v.hmak * v.nmak * v.kamar * v.kurs],
      ['Transportasi lokal', v.trans * v.kurs * orang],
      ['Makan (' + days + ' hari)', v.makan * days * v.kurs * orang],
      ['Vaksin, SIM, lain-lain', v.lain * orang],
    ];
    const total = parts.reduce((s, p) => s + p[1], 0);
    document.getElementById('calc-total').textContent = rp(total);
    document.getElementById('calc-per').textContent = rp(total / orang) + ' / orang';
    document.getElementById('calc-breakdown').innerHTML =
      parts.map(([k, x]) => `<dt>${k}</dt><dd>${rp(x)}</dd>`).join('');
  }
  form.addEventListener('input', calc);
  document.querySelectorAll('.presets .chip').forEach(btn => btn.addEventListener('click', () => {
    form.elements.hmed.value = btn.dataset.med;
    form.elements.hmak.value = btn.dataset.mak;
    calc();
  }));
  calc();

  // Checklist
  const groups = {
    'Dokumen': [
      'Paspor (berlaku ≥ 6 bulan)',
      'E-visa umroh (cetak + digital)',
      'Voucher hotel Madinah & Makkah',
      'Tiket pesawat PP',
      'Sertifikat vaksin meningitis (ICV)',
      'Surat keterangan sehat',
      'Bukti lapor perjalanan ke Kementerian',
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
