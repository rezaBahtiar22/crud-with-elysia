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
const userData = JSON.parse(localStorage.getItem('user') ?? '{}');
if (userData.name) {
  const nameEl   = document.querySelector('.user-name');
  const avatarEl = document.querySelector('.avatar');
  const roleEl = document.querySelector('.user-role');

  if (nameEl)   nameEl.textContent   = userData.name;
  if (avatarEl) avatarEl.textContent = userData.name.slice(0, 2).toUpperCase();
  if (roleEl) roleEl.textContent = userData.role ?? "User";
}


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
    const response = await fetch('http://localhost:3000/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    const data = await response.json();

    if (response.ok && data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      return true;
    }

    return false;

  } catch (err) {
    return false;
  }
}


// ══════════════════════════════
//   PAKSA LOGOUT (token expired)
// ══════════════════════════════
function forceLogout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '../form-login/index.html';
}


// ══════════════════════════════
//   SIDEBAR TOGGLE
// ══════════════════════════════
const sidebarToggle = document.getElementById('sidebarToggle');

sidebarToggle.addEventListener('click', () => {
  document.body.classList.toggle('collapsed');
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

  // ── HAPUS KEDUA TOKEN ──
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