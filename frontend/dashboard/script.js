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


// LOGOUT MODAL
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
  setTimeout(() => {
    window.location.href = 'auth.html';
  }, 600);
});

function closeLogoutModal() {
  logoutOverlay.classList.remove('active');
}