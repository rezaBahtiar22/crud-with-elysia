// ══════════════════════════════
//   BERANDA — Heavenly Library
// ══════════════════════════════

const BASE_URL = CONFIG.API_BASE_URL;

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  // Shared: Auth, Sidebar, Theme, Dropdown, Logout (dari common.js)
  initCommon();

  // Beranda-specific
  initBeranda();
});

function initBeranda() {
  loadGreeting();
  loadDate();
  loadBooks();
  applyRoleUI();
}

// ── Greeting berdasarkan jam ──
function loadGreeting() {
  const hour = new Date().getHours();
  let greeting = 'Selamat malam';
  if (hour >= 5  && hour < 12) greeting = 'Selamat pagi';
  else if (hour >= 12 && hour < 15) greeting = 'Selamat siang';
  else if (hour >= 15 && hour < 19) greeting = 'Selamat sore';

  const el = document.getElementById('berandaGreeting');
  if (el) el.textContent = greeting;

  // Nama user
  const user = JSON.parse(localStorage.getItem('userData') ?? '{}');
  const nameEl = document.getElementById('berandaName');
  if (nameEl) nameEl.textContent = user.name ?? '—';
}

// ── Tampilkan tanggal ──
function loadDate() {
  const el = document.getElementById('berandaDate');
  if (!el) return;

  const now = new Date();
  const days = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

  el.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

// ── Load buku terbaru ──
async function loadBooks() {
  try {
    // Fetch semua buku untuk statistik yang akurat
    const resAll = await apiFetch(`${BASE_URL}/admin/books?page=1&limit=100`);
    const dataAll = await resAll.json();
    const allBooks = dataAll.data ?? [];

    // Total buku — dari meta
    const totalEl = document.getElementById('statTotalBuku');
    if (totalEl) totalEl.textContent = dataAll.meta?.total ?? allBooks.length;

    // Buku tersedia — total availableStock semua buku
    const tersedia = allBooks.reduce((acc, b) => acc + (b.availableStock ?? 0), 0);
    const availEl = document.getElementById('statTersedia');
    if (availEl) availEl.textContent = tersedia;

    // Dipinjam — total stock - total availableStock
    const dipinjam = allBooks.reduce((acc, b) => acc + Math.max(0, (b.stock ?? 0) - (b.availableStock ?? 0)), 0);
    const borrowEl = document.getElementById('statPeminjaman');
    if (borrowEl) borrowEl.textContent = dipinjam;

    // Total Anggota — hanya untuk admin
    const isAdmin = ['ADMIN','admin'].includes(
      JSON.parse(localStorage.getItem('userData') ?? '{}').role
    );
    if (isAdmin) {
      try {
        const resUsers = await apiFetch(`${BASE_URL}/admin/users?page=1&limit=1`);
        const dataUsers = await resUsers.json();
        const anggotaEl = document.getElementById('statAnggota');
        if (anggotaEl) anggotaEl.textContent = dataUsers.meta?.totalItems ?? '—';
      } catch {
        const anggotaEl = document.getElementById('statAnggota');
        if (anggotaEl) anggotaEl.textContent = '—';
      }
    }

    // Tampilkan hanya 6 buku terbaru di grid
    renderBooks(allBooks.slice(0, 6));

  } catch (err) {
    console.error('Gagal load buku:', err);
    renderBooks([]);
  }
}

// ── Render book cards ──
function renderBooks(books) {
  const grid = document.getElementById('bookGridBeranda');
  if (!grid) return;

  grid.innerHTML = '';

  if (!books.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--text-muted);font-size:14px;">
        Belum ada buku di perpustakaan
      </div>`;
    return;
  }

  books.forEach((book, i) => {
    const card = document.createElement('div');
    card.className = 'book-card-beranda';
    card.style.animationDelay = `${0.05 * i}s`;
    card.onclick = () => location.href = '../catalog/index.html';

    const hasStock = (book.availableStock ?? 0) > 0;

    const coverHTML = book.cover
      ? `<div class="book-cover"><img src="${book.cover}" alt="${escapeHtml(book.title)}" loading="lazy" onerror="this.parentElement.outerHTML=placeholderCover('${escapeHtml(book.title)}')"/></div>`
      : placeholderCover(book.title);

    card.innerHTML = `
      ${coverHTML}
      <div class="book-info">
        <div class="book-title">${escapeHtml(book.title)}</div>
        <div class="book-author">${escapeHtml(book.author)}</div>
        <div class="book-meta">
          <span class="book-category">${book.category ?? '—'}</span>
          <span class="book-stock">
            <span class="book-stock-dot ${hasStock ? '' : 'empty'}"></span>
            ${book.availableStock ?? 0}
          </span>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

function placeholderCover(title) {
  return `
    <div class="book-cover-placeholder">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      <div class="book-cover-placeholder-title">${escapeHtml(title)}</div>
    </div>`;
}

// ── Sembunyikan elemen admin jika bukan admin ──
function applyRoleUI() {
  const user = JSON.parse(localStorage.getItem('userData') ?? '{}');
  const isAdmin = ['ADMIN','admin'].includes(user.role);

  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });

  // Jika bukan admin, stat grid cukup 2 kolom
  if (!isAdmin) {
    const statGrid = document.getElementById('statGrid');
    if (statGrid) statGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
  }
}