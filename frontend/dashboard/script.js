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
const sidebarToggle  = document.getElementById('sidebarToggle');
const sidebarEl      = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function isMobile() {
  return window.innerWidth <= 768;
}

sidebarToggle.addEventListener('click', () => {
  if (isMobile()) {
    // Di mobile: slide in/out
    sidebarEl.classList.toggle('mobile-open');
    sidebarOverlay.classList.toggle('active');
  } else {
    // Di desktop: collapse seperti biasa
    document.body.classList.toggle('collapsed');
  }
  closeDropdown();
});

// Tutup sidebar mobile saat klik overlay
sidebarOverlay.addEventListener('click', () => {
  sidebarEl.classList.remove('mobile-open');
  sidebarOverlay.classList.remove('active');
});

// Tutup sidebar mobile saat resize ke desktop
window.addEventListener('resize', () => {
  if (!isMobile()) {
    sidebarEl.classList.remove('mobile-open');
    sidebarOverlay.classList.remove('active');
  }
});


// ══════════════════════════════
//   THEME TOGGLE (Dark / Light)
// ══════════════════════════════
const themeToggle = document.getElementById('themeToggle');
const themeKnob   = document.getElementById('themeKnob');
let isLight = false;

themeToggle.addEventListener('click', () => {
  isLight = !isLight;
  document.body.classList.toggle('light', isLight);
  themeKnob.textContent = isLight ? '☀️' : '🌙';
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