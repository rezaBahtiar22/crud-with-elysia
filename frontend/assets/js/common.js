/**
 * ══════════════════════════════
 *   COMMON LOGIC (SHARED)
 *   Heavenly Library — Shared Assets
 * ══════════════════════════════
 */

// ── AUTH CHECK ──
// Jalankan sesegera mungkin untuk mencegah flash of unauthenticated content
(function quickAuth() {
  const isLoginPage = window.location.pathname.includes('form-login');
  if (isLoginPage) return;

  const accessToken  = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  if (!accessToken || !refreshToken) {
    window.location.href = '../form-login/index.html';
  }
})();

/**
 * Global Initialization
 * Bundles all common UI setups: Sidebar, Theme, Dropdown, Logout
 */
function initCommon() {
  loadSharedUserInfo();
  setupSidebarToggle();
  setupThemeToggle();
  setupUserDropdown();
  setupLogoutModal();
  setupNavigation(); // Tambahkan ini
}

/**
 * Centrally handles navigation clicks for all sidebar items.
 * This fixes the issue where some nav-items don't have onclick in HTML.
 */
function setupNavigation() {
  // Ambil semua nav-item baik yang punya data-page maupun tidak
  const navItems = document.querySelectorAll('.nav-item');
  
  const pathMap = {
    'beranda':           '../dashboard/index.html',
    'dasbor':            '../admin-dashboard/index.html',
    'katalog':           '../catalog/index.html',
    'peminjaman':        '../borrowing/index.html',
    'riwayat':           '../history/index.html',
    'anggota':           '../members/index.html',
    'kelola-buku':       '../manage-books/index.html',
    'kelola-peminjaman': '../manage-borrowing/index.html',
    'pengaturan':        '../settings/index.html',
    'bantuan':           '../help-center/index.html'
  };

  navItems.forEach(item => {
    // Tambahkan kursor pointer
    item.style.cursor = 'pointer';

    item.addEventListener('click', (e) => {
      // 1. Coba ambil dari data-page
      let page = item.getAttribute('data-page');
      
      // 2. Jika tidak ada, coba deteksi dari teks di dalamnya
      if (!page) {
        const text = item.textContent.trim().toLowerCase();
        if (text.includes('beranda')) page = 'beranda';
        else if (text.includes('dashboard')) page = 'dasbor';
        else if (text.includes('katalog')) page = 'katalog';
        else if (text.includes('peminjaman') && !text.includes('kelola')) page = 'peminjaman';
        else if (text.includes('riwayat')) page = 'riwayat';
        else if (text.includes('anggota')) page = 'anggota';
        else if (text.includes('kelola buku')) page = 'kelola-buku';
        else if (text.includes('kelola peminjaman')) page = 'kelola-peminjaman';
        else if (text.includes('pengaturan')) page = 'pengaturan';
        else if (text.includes('bantuan')) page = 'bantuan';
      }

      const targetPath = pathMap[page];
      if (targetPath) {
        // Jangan redirect jika sudah di halaman yang sama
        if (window.location.pathname.includes(targetPath.replace('../', ''))) return;
        window.location.href = targetPath;
      }
    });
  });
}

// ── SHARED UI: USER INFO ──
function getRoleLabel(role) {
  const map = {
    admin: 'Admin', ADMIN: 'Admin',
    user:  'User',  USER:  'User',
  };
  return map[role] ?? role ?? '—';
}

function loadSharedUserInfo() {
  const userData = JSON.parse(localStorage.getItem('userData') ?? '{}');
  if (!userData.name) return;

  const name     = userData.name  ?? '—';
  const email    = userData.email ?? '—';
  const role     = getRoleLabel(userData.role);
  const initials = name !== '—'
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  // Sidebar elements
  const nameEl   = document.querySelector('.user-name');
  const avatarEl = document.querySelector('.avatar');
  const roleEl   = document.querySelector('.user-role');
  if (nameEl)   nameEl.textContent   = name;
  if (avatarEl) avatarEl.textContent = initials;
  if (roleEl)   roleEl.textContent   = role;

  // Dropdown elements
  const ddAvatar = document.getElementById('dropdownAvatar');
  const ddName   = document.getElementById('dropdownName');
  const ddEmail  = document.getElementById('dropdownEmail');
  const ddRole   = document.getElementById('dropdownRole');
  if (ddAvatar) ddAvatar.textContent = initials;
  if (ddName)   ddName.textContent   = name;
  if (ddEmail)  ddEmail.textContent  = email;
  if (ddRole)   ddRole.textContent   = role;

  // Role-based menu hiding
  const isAdmin = ['ADMIN', 'admin'].includes(userData.role);
  if (!isAdmin) {
    document.querySelectorAll('.nav-admin').forEach(el => {
      el.style.display = 'none';
    });
  }
}

// ── API FETCH WITH AUTO REFRESH ──
async function apiFetch(url, options = {}) {
  const accessToken = localStorage.getItem('accessToken');

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('apiFetch network error:', err);
    return null;
  }

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
      return null;
    }
  }

  return response;
}

async function tryRefreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/auth/refresh-access-token`, {
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

function forceLogout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userData');
  window.location.href = '../form-login/index.html';
}

// ── SIDEBAR TOGGLE ──
function setupSidebarToggle() {
  const toggleBtn = document.getElementById('toggleBtn');
  if (!toggleBtn) return;

  if (localStorage.getItem('sidebarCollapsed') === 'true') {
    document.body.classList.add('collapsed');
  }

  toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', document.body.classList.contains('collapsed'));
  });
}

// ── THEME TOGGLE ──
function setupThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  const themeKnob   = document.getElementById('themeKnob');
  if (!themeToggle || !themeKnob) return;

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
}

// ── USER DROPDOWN ──
function setupUserDropdown() {
  const userCard     = document.getElementById('userCard');
  const userDropdown = document.getElementById('userDropdown');
  if (!userCard || !userDropdown) return;

  userCard.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = userCard.classList.toggle('open');
    userDropdown.classList.toggle('open', isOpen);
  });

  document.addEventListener('click', (e) => {
    if (!userDropdown.contains(e.target) && !userCard.contains(e.target)) {
      userCard.classList.remove('open');
      userDropdown.classList.remove('open');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      userCard.classList.remove('open');
      userDropdown.classList.remove('open');
    }
  });

  // Common Dropdown Actions
  const viewProfile = document.getElementById('ddViewProfile');
  const editProfile = document.getElementById('ddEditProfile');

  if (viewProfile) {
    viewProfile.addEventListener('click', () => window.location.href = '../profile/index.html');
  }
  if (editProfile) {
    editProfile.addEventListener('click', () => window.location.href = '../edit-profile/index.html');
  }
  
  const settings = document.getElementById('ddSettings');
  if (settings) {
    settings.addEventListener('click', () => window.location.href = '../settings/index.html');
  }
}

// ── LOGOUT MODAL ──
function setupLogoutModal() {
  const logoutBtn     = document.querySelector('.nav-item.danger');
  const logoutOverlay = document.getElementById('logoutOverlay');
  const logoutCancel  = document.getElementById('logoutCancel');
  const logoutConfirm = document.getElementById('logoutConfirm');

  if (!logoutBtn || !logoutOverlay) return;

  logoutBtn.addEventListener('click', () => {
    logoutOverlay.classList.add('active');
  });

  if (logoutCancel) {
    logoutCancel.addEventListener('click', () => logoutOverlay.classList.remove('active'));
  }

  logoutOverlay.addEventListener('click', (e) => {
    if (e.target === logoutOverlay) logoutOverlay.classList.remove('active');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && logoutOverlay.classList.contains('active')) {
      logoutOverlay.classList.remove('active');
    }
  });

  if (logoutConfirm) {
    logoutConfirm.addEventListener('click', async () => {
      logoutConfirm.textContent = 'Keluar...';
      logoutConfirm.disabled = true;

      // Optional: Panggil API logout di sini jika perlu blacklist token
      const refreshToken = localStorage.getItem('refreshToken');
      try {
        await fetch(`${CONFIG.API_BASE_URL}/user/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
      } catch (err) {
        console.warn('Logout API failed, proceeding with local logout');
      }

      setTimeout(() => {
        forceLogout();
      }, 600);
    });
  }
}

// ── HELPERS: ESCAPE HTML ──
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/**
 * Formats API error response into a readable string.
 * Handles Zod validation errors, custom messages, and fallback text.
 */
function formatApiError(data, fallback = 'Terjadi kesalahan') {
  if (!data) return fallback;

  // 1. Array of Zod issues: [{ message: "...", path: [...] }]
  if (Array.isArray(data.errors)) {
    return data.errors.map(err => err.message || JSON.stringify(err)).join(', ');
  }

  // 2. data.errors as string or object
  if (data.errors) {
    if (typeof data.errors === 'string') return data.errors;
    return JSON.stringify(data.errors);
  }

  // 3. Standard message field
  if (data.message) {
    if (typeof data.message === 'string') return data.message;
    return JSON.stringify(data.message);
  }

  return fallback;
}
