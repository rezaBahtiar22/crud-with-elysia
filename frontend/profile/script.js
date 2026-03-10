// ══════════════════════════════
//   CEK AUTH
// ══════════════════════════════
(function checkAuth() {
  const accessToken  = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  if (!accessToken || !refreshToken) {
    window.location.href = '../form-login/index.html';
  }
})();


// ══════════════════════════════
//   THEME TOGGLE
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
//   LOAD DATA USER
// ══════════════════════════════
const userData = JSON.parse(localStorage.getItem('userData') ?? '{}');

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function getRoleLabel(role) {
  const map = {
    admin:      'Admin',
    ADMIN:      'Admin',
    user:       'User',
    USER:       'User',
  };
  return map[role] ?? role ?? '—';
}

function populateProfile() {
  const name      = userData.name      ?? '—';
  const email     = userData.email     ?? '—';
  const role      = getRoleLabel(userData.role);
  const createdAt = formatDate(userData.createdAt ?? userData.created_at);
  const initials  = name !== '—'
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  // Hero
  document.getElementById('heroName').textContent  = name;
  document.getElementById('heroEmail').textContent = email;
  document.getElementById('heroRole').textContent  = role;
  document.getElementById('avatarCircle').textContent = initials;

  // Info Cards
  document.getElementById('infoName').textContent      = name;
  document.getElementById('infoEmail').textContent     = email;
  document.getElementById('infoRole').textContent      = role;
  document.getElementById('infoCreatedAt').textContent = createdAt;

  // Update page title
  document.title = `${name} — Profil · Heavenly Library`;
}

populateProfile();


// ══════════════════════════════
//   TOMBOL NAVIGASI
// ══════════════════════════════
function goToDashboard() {
  window.location.href = '../dashboard/index.html';
}

document.getElementById('btnBack').addEventListener('click', goToDashboard);

// ── LOGOUT ──
const logoutOverlay = document.getElementById('logoutOverlay');
const logoutCancel  = document.getElementById('logoutCancel');
const logoutConfirm = document.getElementById('logoutConfirm');

document.getElementById('btnLogout').addEventListener('click', () => {
  logoutOverlay.classList.add('active');
});

logoutCancel.addEventListener('click', () => {
  logoutOverlay.classList.remove('active');
});

logoutOverlay.addEventListener('click', (e) => {
  if (e.target === logoutOverlay) logoutOverlay.classList.remove('active');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') logoutOverlay.classList.remove('active');
});

logoutConfirm.addEventListener('click', () => {
  logoutConfirm.textContent = 'Keluar...';
  logoutConfirm.disabled = true;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userData');
  setTimeout(() => {
    window.location.href = '../form-login/index.html';
  }, 600);
});


document.getElementById('btnEditProfile').addEventListener('click', () => {
  window.location.href = '../edit-profile/index.html';
});


// ══════════════════════════════
//   TOMBOL GANTI KATA SANDI
// ══════════════════════════════
document.getElementById('btnChangePassword').addEventListener('click', () => {
  window.location.href = '../edit-profile/index.html';
});