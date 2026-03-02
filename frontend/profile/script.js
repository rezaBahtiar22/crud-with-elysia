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
let isLight = false;

themeToggle.addEventListener('click', () => {
  isLight = !isLight;
  document.body.classList.toggle('light', isLight);
  themeKnob.textContent = isLight ? '☀️' : '🌙';
});


// ══════════════════════════════
//   LOAD DATA USER
// ══════════════════════════════
const userData = JSON.parse(localStorage.getItem('user') ?? '{}');

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
    admin:      'Administrator',
    ADMIN:      'Administrator',
    user:       'User',
    USER:       'User',
  };
  return map[role] ?? role ?? '—';
}

function populateProfile() {
  const name      = userData.name      ?? '—';
  const email     = userData.email     ?? '—';
  const role      = getRoleLabel(userData.role);
  const createdAt = formatDate(userData.createdAt);
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
  document.title = `${name} — Profil · Nexara`;
}

populateProfile();


// ══════════════════════════════
//   TOMBOL NAVIGASI
// ══════════════════════════════
function goToDashboard() {
  window.location.href = '../dashboard/index.html';
}

document.getElementById('btnBack').addEventListener('click', goToDashboard);
document.getElementById('btnBackBottom').addEventListener('click', goToDashboard);


// ══════════════════════════════
//   TOMBOL EDIT PROFIL
//   (placeholder — belum ada endpoint)
// ══════════════════════════════
document.getElementById('btnEditProfile').addEventListener('click', () => {
  // TODO: implementasi edit profil saat endpoint tersedia
  alert('Fitur edit profil segera hadir!');
});


// ══════════════════════════════
//   TOMBOL GANTI KATA SANDI
//   (placeholder — belum ada endpoint)
// ══════════════════════════════
document.getElementById('btnChangePassword').addEventListener('click', () => {
  // TODO: implementasi ganti password saat endpoint tersedia
  alert('Fitur ganti kata sandi segera hadir!');
});