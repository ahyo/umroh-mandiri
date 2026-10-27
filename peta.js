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

  // Koordinat dari OpenStreetMap (Nominatim)
  const KOTA = {
    makkah: {
      nama: 'Makkah',
      pusat: [21.4225, 39.8262],
      zoom: 12,
      tempat: [
        { n: 'Masjidil Haram', ll: [21.422559, 39.824871], t: 'utama',
          d: 'Pusat segalanya. Tawaf, sa’i, dan sholat berjamaah. Pintu King Abdulaziz (1) dan King Fahd (79) adalah patokan paling mudah untuk janjian.' },
        { n: 'Jabal Nur & Gua Hira', ll: [21.457784, 39.859732], t: 'ziarah',
          d: '±6 km dari Haram. Tempat turunnya wahyu pertama. Mendaki ±1–2 jam dan cukup berat; kebanyakan jemaah cukup melihat dari bawah. Tidak ada tuntunan khusus untuk mendakinya.' },
        { n: 'Masjid Aisyah (Tan’im)', ll: [21.468336, 39.800490], t: 'miqat',
          d: '±7 km dari Haram. Miqat untuk umroh tambahan bagi yang sudah di Makkah. Taksi online ±SAR 20–30 sekali jalan.' },
        { n: 'Masjid Ji’ranah', ll: [21.568178, 39.951137], t: 'miqat',
          d: '±22 km dari Haram. Miqat lain untuk umroh tambahan, lebih sepi daripada Tan’im.' },
        { n: 'Jabal Tsur (Gua Tsur)', ll: [21.377119, 39.849816], t: 'ziarah',
          d: '±6 km dari Haram. Gua persembunyian Nabi ﷺ dan Abu Bakar saat hijrah. Pendakiannya lebih berat daripada Jabal Nur.' },
        { n: 'Mina', ll: [21.415356, 39.892506], t: 'ziarah',
          d: '±7 km. Kota tenda untuk jemaah haji. Saat umroh biasanya hanya dilewati ketika city tour.' },
        { n: 'Muzdalifah', ll: [21.386346, 39.915147], t: 'ziarah',
          d: '±12 km. Tempat bermalam jemaah haji setelah wukuf.' },
        { n: 'Arafah & Jabal Rahmah', ll: [21.354800, 39.984102], t: 'ziarah',
          d: '±20 km. Lokasi wukuf haji. Tidak ada tuntunan sholat atau doa khusus di Jabal Rahmah di luar musim haji.' },
        { n: 'Stasiun Haramain Makkah (Rusaifah)', ll: [21.417656, 39.788532], t: 'transport',
          d: '±5 km dari Haram. Kereta cepat ke Madinah ±2,5 jam. Pesan di haramainrail.sa atau aplikasinya.' },
      ],
    },
    madinah: {
      nama: 'Madinah',
      pusat: [24.4700, 39.6100],
      zoom: 12,
      tempat: [
        { n: 'Masjid Nabawi', ll: [24.468680, 39.611162], t: 'utama',
          d: 'Sholat di sini bernilai 1.000 kali lipat. Raudhah perlu izin lewat aplikasi Nusuk. Pintu 25 untuk perempuan, pintu 18 untuk laki-laki, tetapi cek lagi di aplikasi karena bisa berubah.' },
        { n: 'Pemakaman Baqi’', ll: [24.466749, 39.616172], t: 'ziarah',
          d: 'Persis di sebelah timur Masjid Nabawi. Tempat dimakamkannya banyak sahabat dan keluarga Nabi ﷺ. Buka setelah Subuh dan Ashar; perempuan tidak diizinkan masuk.' },
        { n: 'Masjid Quba', ll: [24.439423, 39.617459], t: 'ziarah',
          d: '±4 km. Masjid pertama dalam Islam. Berwudhu di penginapan lalu sholat 2 rakaat di sini bernilai seperti pahala umroh (HR. Tirmidzi & Ibnu Majah).' },
        { n: 'Masjid Qiblatain', ll: [24.484157, 39.578856], t: 'ziarah',
          d: '±6 km. Masjid tempat turunnya perintah pindah kiblat dari Baitul Maqdis ke Ka’bah.' },
        { n: 'Jabal Uhud & Makam Syuhada', ll: [24.522294, 39.617042], t: 'ziarah',
          d: '±5 km. Lokasi Perang Uhud dan makam 70 syuhada, termasuk Hamzah bin Abdul Muthalib. Biasanya satu paket city tour dengan Quba dan Qiblatain.' },
        { n: 'Bir Ali (Dzul Hulaifah) — Miqat', ll: [24.413300, 39.543600], t: 'miqat',
          d: '±11 km ke arah selatan. Miqat wajib sebelum ke Makkah. Ada tempat mandi dan ganti ihram. Berhenti di sini saat perjalanan Madinah → Makkah.' },
        { n: 'Bandara Pangeran Mohammad bin Abdulaziz (MED)', ll: [24.553400, 39.705100], t: 'transport',
          d: '±15 km dari Masjid Nabawi. Taksi online ±SAR 40–60.' },
        { n: 'Stasiun Haramain Madinah', ll: [24.472297, 39.699604], t: 'transport',
          d: '±9 km dari Masjid Nabawi. Kereta cepat ke Makkah dan Jeddah.' },
      ],
    },
  };
  const IKON = { utama: '🕋', ziarah: '📍', miqat: '👕', transport: '🚆' };
  const LABEL = { utama: 'Masjid utama', ziarah: 'Ziarah', miqat: 'Miqat', transport: 'Transportasi' };

  let kota = store.get('peta-kota') === 'madinah' ? 'madinah' : 'makkah';
  let map, markers = [];

  map = L.map('peta', { scrollWheelZoom: false }).setView(KOTA[kota].pusat, KOTA[kota].zoom);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  map.once('focus', () => map.scrollWheelZoom.enable());

  const daftar = document.getElementById('peta-daftar');

  function gmaps(p) {
    return 'https://www.google.com/maps/search/?api=1&query=' + p.ll[0] + ',' + p.ll[1];
  }

  function render() {
    const data = KOTA[kota];
    markers.forEach(m => map.removeLayer(m));
    markers = data.tempat.map(p => {
      const m = L.marker(p.ll).addTo(map);
      m.bindPopup(`<strong>${IKON[p.t]} ${p.n}</strong><br>${p.d}<br><a href="${gmaps(p)}" target="_blank" rel="noopener">Buka di Google Maps →</a>`);
      return m;
    });
    map.setView(data.pusat, data.zoom);
    daftar.innerHTML = data.tempat.map((p, i) => `
      <li class="peta-item" data-i="${i}">
        <button type="button" class="peta-pin" aria-label="Lihat ${p.n} di peta">${IKON[p.t]}</button>
        <div>
          <strong>${p.n}</strong> <span class="peta-tag">${LABEL[p.t]}</span>
          <p>${p.d}</p>
          <a href="${gmaps(p)}" target="_blank" rel="noopener">Buka di Google Maps →</a>
        </div>
      </li>`).join('');
    document.querySelectorAll('.peta-tabs .chip').forEach(b => b.classList.toggle('on', b.dataset.kota === kota));
    document.getElementById('peta-judul').textContent = 'Tempat penting di ' + data.nama;
  }

  daftar.addEventListener('click', e => {
    const li = e.target.closest('.peta-item');
    if (!li) return;
    const p = KOTA[kota].tempat[+li.dataset.i];
    map.setView(p.ll, 15);
    markers[+li.dataset.i].openPopup();
    document.getElementById('peta').scrollIntoView({ block: 'center', behavior: 'smooth' });
  });

  document.querySelectorAll('.peta-tabs .chip').forEach(b => b.addEventListener('click', () => {
    kota = b.dataset.kota;
    store.set('peta-kota', kota);
    render();
  }));

  render();
})();
