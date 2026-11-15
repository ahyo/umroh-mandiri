// Menempelkan perkiraan rupiah di belakang setiap harga riyal pada halaman.
// Dipanggil ulang saat kurs di kalkulator diubah, jadi seluruh halaman ikut menyesuaikan.
window.rupiahSAR = (function () {
  const RIBUAN = '(\\d{1,3}(?:\\.\\d{3})+|\\d+)';
  const POLA = new RegExp('SAR\\s*' + RIBUAN + '(\\s*[–—-]\\s*' + RIBUAN + ')?', 'g');
  const angka = t => parseFloat(String(t).replace(/\./g, '')) || 0;

  // Ringkas agar muat di dalam kalimat: "Rp 660 rb", "Rp 6,6 jt"
  function bagian(n) {
    if (n >= 1e6) {
      const jt = n / 1e6;
      const s = jt >= 10 ? String(Math.round(jt)) : jt.toFixed(1).replace(/\.0$/, '');
      return [s.replace('.', ','), 'jt'];
    }
    return [String(Math.round(n / 1000)), 'rb'];
  }
  // Satuan ditulis sekali bila sama, agar "Rp 396-660 rb" bukan "Rp 396 rb-Rp 660 rb"
  function rentang(a, b) {
    const [x, ux] = bagian(a);
    if (!b) return 'Rp ' + x + ' ' + ux;
    const [y, uy] = bagian(b);
    return ux === uy ? 'Rp ' + x + '–' + y + ' ' + ux
      : 'Rp ' + x + ' ' + ux + '–' + y + ' ' + uy;
  }

  function tempel(node, kurs) {
    const teks = node.nodeValue;
    const re = new RegExp(POLA.source, 'g');
    let m, akhir = 0, frag = null;
    while ((m = re.exec(teks))) {
      const usai = m.index + m[0].length;
      // Lewati penyebutan nominal beruntun seperti "SAR 5, 10, dan 20"
      if (teks[usai] === ',') continue;
      frag = frag || document.createDocumentFragment();
      frag.appendChild(document.createTextNode(teks.slice(akhir, usai)));
      const span = document.createElement('span');
      span.className = 'rp';
      span.textContent = ' ≈' + rentang(angka(m[1]) * kurs, m[3] ? angka(m[3]) * kurs : 0);
      frag.appendChild(span);
      akhir = usai;
    }
    if (!frag) return;
    frag.appendChild(document.createTextNode(teks.slice(akhir)));
    node.parentNode.replaceChild(frag, node);
  }

  return function render(kurs) {
    if (!(kurs > 0)) return;
    document.querySelectorAll('.rp').forEach(el => el.remove());
    document.querySelectorAll('[data-rp]').forEach(root => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const nodes = [];
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const induk = n.parentNode;
        if (!induk || induk.nodeName === 'SCRIPT' || induk.nodeName === 'STYLE') continue;
        if (induk.closest('[data-no-rp]')) continue;
        if (n.nodeValue.indexOf('SAR') !== -1) nodes.push(n);
      }
      nodes.forEach(n => tempel(n, kurs));
    });
  };
})();
