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
