// ══════════════════════════════
//   CEK AUTH — paling atas
// ══════════════════════════════
(function checkAuth() {
  const accessToken  = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  if (!accessToken || !refreshToken) {
    window.location.href = '../form-login/index.html';
  }
})();


// ══════════════════════════════
//   TAMPILKAN DATA USER
// ══════════════════════════════
const userData = JSON.parse(localStorage.getItem('userData') ?? '{}');

function getRoleLabel(role) {
  const map = {
    admin: 'Admin', ADMIN: 'Admin',
    user:  'User',          USER:  'User',
  };
  return map[role] ?? role ?? '—';
}

if (userData) {
  const name     = userData.name  ?? '—';
  const email    = userData.email ?? '—';
  const role     = getRoleLabel(userData.role);
  const initials = name !== '—'
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const nameEl   = document.querySelector('.user-name');
  const avatarEl = document.querySelector('.avatar');
  const roleEl   = document.querySelector('.user-role');
  if (nameEl)   nameEl.textContent   = name;
  if (avatarEl) avatarEl.textContent = initials;
  if (roleEl)   roleEl.textContent   = role;

  const ddAvatar = document.getElementById('dropdownAvatar');
  const ddName   = document.getElementById('dropdownName');
  const ddEmail  = document.getElementById('dropdownEmail');
  const ddRole   = document.getElementById('dropdownRole');
  if (ddAvatar) ddAvatar.textContent = initials;
  if (ddName)   ddName.textContent   = name;
  if (ddEmail)  ddEmail.textContent  = email;
  if (ddRole)   ddRole.textContent   = role;
}

// ══════════════════════════════
//   ROLE-BASED MENU
// ══════════════════════════════
(function applyRoleMenu() {
  const role = userData.role ?? '';
  const isAdmin = role === 'ADMIN' || role === 'admin';

  // Sembunyikan semua elemen admin jika bukan admin
  if (!isAdmin) {
    document.querySelectorAll('.nav-admin').forEach(el => {
      el.style.display = 'none';
    });
  }
})();


// ══════════════════════════════
//   USER DROPDOWN TOGGLE
// ══════════════════════════════
const userCard     = document.getElementById('userCard');
const userDropdown = document.getElementById('userDropdown');

userCard.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = userCard.classList.contains('open');
  isOpen ? closeDropdown() : openDropdown();
});

document.addEventListener('click', (e) => {
  // tutup dropdown hanya jika klik di luar dropdown DAN di luar userCard
  if (!userDropdown.contains(e.target) && !userCard.contains(e.target)) {
    closeDropdown();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDropdown();
});

function openDropdown() {
  userCard.classList.add('open');
  userDropdown.classList.add('open');
}

function closeDropdown() {
  userCard.classList.remove('open');
  userDropdown.classList.remove('open');
}

document.getElementById('ddViewProfile').addEventListener('click', (e) => {
  e.stopPropagation();
  window.location.href = '../profile/index.html';
});

document.getElementById('ddEditProfile').addEventListener('click', (e) => {
  e.stopPropagation();
  window.location.href = '../edit-profile/index.html';
});

document.getElementById('ddSettings').addEventListener('click', (e) => {
  e.stopPropagation();
  alert('Pengaturan segera hadir!');
});


// ══════════════════════════════
//   FETCH DENGAN AUTO REFRESH TOKEN
// ══════════════════════════════
async function fetchWithAuth(url, options = {}) {
  const accessToken = localStorage.getItem('accessToken');

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const newAccessToken = localStorage.getItem('accessToken');
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newAccessToken}`,
          'Content-Type': 'application/json'
        }
      });
    } else {
      forceLogout();
    }
  }

  return response;
}


// ══════════════════════════════
//   COBA REFRESH ACCESS TOKEN
// ══════════════════════════════
async function tryRefreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;

  try {
    const response = await fetch('http://localhost:3000/auth/refresh-access-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    const data = await response.json();

    if (response.ok && data.tokens?.accessToken) {
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}


// ══════════════════════════════
//   PAKSA LOGOUT (token expired)
// ══════════════════════════════
function forceLogout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userData');
  window.location.href = '../form-login/index.html';
}


// ══════════════════════════════
//   SIDEBAR TOGGLE
// ══════════════════════════════
const sidebarToggle  = document.getElementById('toggleBtn');
const sidebarEl      = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

if (localStorage.getItem('sidebarCollapsed') === 'true') {
  document.body.classList.add('collapsed');
}

sidebarToggle.addEventListener('click', () => {
  document.body.classList.toggle('collapsed');
  localStorage.setItem('sidebarCollapsed', document.body.classList.contains('collapsed'));
  closeDropdown();
});


// ══════════════════════════════
//   THEME TOGGLE (Dark / Light)
// ══════════════════════════════
const themeToggle = document.getElementById('themeToggle');
const themeKnob   = document.getElementById('themeKnob');

// Baca theme dari localStorage saat halaman dimuat
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  document.body.classList.add('light');
  themeKnob.textContent = '☀️';
}

themeToggle.addEventListener('click', () => {
  const isLight = document.body.classList.toggle('light');
  themeKnob.textContent = isLight ? '☀️' : '🌙';
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
});


// ══════════════════════════════
//   NAV ITEM ACTIVE STATE
// ══════════════════════════════
const navItems = document.querySelectorAll('.nav-item:not(.danger)');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    closeDropdown();
  });
});


// ══════════════════════════════
//   LOGOUT MODAL
// ══════════════════════════════
const logoutBtn     = document.querySelector('.nav-item.danger');
const logoutOverlay = document.getElementById('logoutOverlay');
const logoutCancel  = document.getElementById('logoutCancel');
const logoutConfirm = document.getElementById('logoutConfirm');

logoutBtn.addEventListener('click', () => {
  closeDropdown();
  logoutOverlay.classList.add('active');
});

logoutCancel.addEventListener('click', () => {
  closeLogoutModal();
});

logoutOverlay.addEventListener('click', (e) => {
  if (e.target === logoutOverlay) closeLogoutModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && logoutOverlay.classList.contains('active')) {
    closeLogoutModal();
  }
});

logoutConfirm.addEventListener('click', () => {
  logoutConfirm.textContent = 'Keluar...';
  logoutConfirm.disabled = true;

  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');

  setTimeout(() => {
    window.location.href = '../form-login/index.html';
  }, 600);
});

function closeLogoutModal() {
  logoutOverlay.classList.remove('active');
}


// ══════════════════════════════
//   BERANDA — INIT
// ══════════════════════════════
const BASE_URL = 'http://localhost:3000';

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
    const resAll = await fetchWithAuth(`${BASE_URL}/admin/books?page=1&limit=100`);
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
        const resUsers = await fetchWithAuth(`${BASE_URL}/admin/users?page=1&limit=1`);
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
      ? `<div class="book-cover"><img src="${book.cover}" alt="${book.title}" loading="lazy" onerror="this.parentElement.outerHTML=placeholderCover('${escapeHtml(book.title)}')"/></div>`
      : placeholderCover(book.title);

    card.innerHTML = `
      ${coverHTML}
      <div class="book-info">
        <div class="book-title">${book.title}</div>
        <div class="book-author">${book.author}</div>
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

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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

// Jalankan beranda saat DOM siap
document.addEventListener('DOMContentLoaded', initBeranda);