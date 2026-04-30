/**
 * ══════════════════════════════
 *   HELP CENTER MODULE SCRIPT
 *   Heavenly Library — Support
 * ══════════════════════════════
 */

// ── Data FAQ ──
const FAQ_DATA = [
  {
    category: 'borrow',
    q: 'Apakah bisa meminjam buku fisik?',
    a: 'Buku fisik tidak bisa dipinjam. Buku ini hanya tersedia untuk dibaca secara online atau dapat mengunduh file pdf/epub jika tersedia.'
  },
  {
    category: 'borrow',
    q: 'Berapa lama batas waktu peminjaman?',
    a: 'Batas waktu peminjaman standar adalah 7 hari. Anda dapat memperpanjangnya satu kali melalui dashboard jika buku tidak sedang dipesan orang lain.'
  },
  {
    category: 'digital',
    q: 'Bagaimana cara membaca buku digital?',
    a: 'Cari buku bertanda "Digital" di Katalog, klik tombol "Baca Sekarang". Anda akan diarahkan ke link baca online atau file PDF/EPUB.'
  },
  {
    category: 'account',
    q: 'Kenapa saya tidak menerima kode OTP?',
    a: 'Pastikan email yang Anda masukkan benar. Periksa folder Spam/Junk. Jika masih tidak ada, tunggu 2 menit dan klik "Kirim Ulang".'
  },
  {
    category: 'other',
    q: 'Berapa denda keterlambatan pengembalian?',
    a: 'Denda keterlambatan adalah Rp1.000 per buku per hari. Denda dapat dibayarkan langsung di meja sirkulasi perpustakaan.'
  },
  {
    category: 'account',
    q: 'Dapatkah saya mengubah foto profil?',
    a: 'Ya, Anda dapat mengubah foto profil melalui menu "Profil Saya" di sidebar dan mengklik ikon kamera pada avatar. Tapi saat ini layanan untuk update foto profile belum tersedia, tunggu info selanjutnya.'
  }
];

// ══════════════════════════════
// RENDER FAQ
// ══════════════════════════════
function renderFAQs(items) {
  const container = document.getElementById('faqList');
  container.innerHTML = '';

  if (items.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px; color:var(--text-muted);">
        <p>Maaf, pertanyaan tersebut tidak ditemukan. Cobalah kata kunci lain.</p>
      </div>
    `;
    return;
  }

  items.forEach((item, index) => {
    const faqItem = document.createElement('div');
    faqItem.className = 'faq-item';
    faqItem.innerHTML = `
      <div class="faq-question">
        <h4>${item.q}</h4>
        <svg class="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      <div class="faq-answer">
        <p>${item.a}</p>
      </div>
    `;

    faqItem.querySelector('.faq-question').addEventListener('click', () => {
      toggleFAQ(faqItem);
    });

    container.appendChild(faqItem);
  });
}

function toggleFAQ(element) {
  const isActive = element.classList.contains('active');
  
  // Close others
  document.querySelectorAll('.faq-item').forEach(item => {
    item.classList.remove('active');
  });

  if (!isActive) {
    element.classList.add('active');
  }
}

// ══════════════════════════════
// SEARCH LOGIC
// ══════════════════════════════
function initHelpSearch() {
  const input = document.getElementById('helpSearch');
  
  input.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = FAQ_DATA.filter(item => 
      item.q.toLowerCase().includes(term) || 
      item.a.toLowerCase().includes(term)
    );
    renderFAQs(filtered);
  });
}

// ══════════════════════════════
// CATEGORY FILTER
// ══════════════════════════════
function initCategoryFilter() {
  const cards = document.querySelectorAll('.help-card');
  
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const cat = card.dataset.category;
      const filtered = FAQ_DATA.filter(item => item.category === cat);
      
      // Highlight card
      cards.forEach(c => c.style.borderColor = 'var(--sidebar-border)');
      card.style.borderColor = 'var(--accent)';
      
      renderFAQs(filtered);
      
      // Scroll to FAQ
      document.getElementById('faqList').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// ══════════════════════════════
// INIT
// ══════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Common UI init
  initCommon();

  // Help center init
  renderFAQs(FAQ_DATA);
  initHelpSearch();
  initCategoryFilter();
});
