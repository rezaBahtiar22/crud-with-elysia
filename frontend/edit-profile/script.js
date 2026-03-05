// ══════════════════════════════
//   CONFIG
// ══════════════════════════════
const BASE_URL = 'http://localhost:3000';


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
//   LOAD DATA USER DARI LOCALSTORAGE
// ══════════════════════════════
let userData = JSON.parse(localStorage.getItem('user') ?? '{}');

function getInitials(name) {
  if (!name || name === '—') return '?';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function getRoleLabel(role) {
  const map = {
    admin: 'Administrator', ADMIN: 'Administrator',
    user:  'User',          USER:  'User',
    superadmin: 'Super Admin', SUPERADMIN: 'Super Admin',
  };
  return map[role] ?? role ?? '—';
}

function populateForm() {
  const name  = userData.name  ?? '';
  const email = userData.email ?? '';
  const role  = getRoleLabel(userData.role);

  // Avatar preview
  document.getElementById('avatarPreview').textContent = getInitials(name);
  document.getElementById('avatarName').textContent    = name || '—';
  document.getElementById('avatarRole').textContent    = role;

  // Pre-fill form fields
  document.getElementById('upName').value  = name;
  document.getElementById('upEmail').value = email;
}

populateForm();


// ══════════════════════════════
//   NAVIGASI
// ══════════════════════════════
document.getElementById('btnBack').addEventListener('click', () => {
  window.location.href = '../dashboard/profile.html';
});

document.getElementById('btnCancelProfile').addEventListener('click', () => {
  window.location.href = '../dashboard/profile.html';
});

document.getElementById('btnCancelPassword').addEventListener('click', () => {
  // reset form password saja
  document.getElementById('formUpdatePassword').reset();
  clearErrors(['upCurrentPassErr', 'upNewPassErr', 'upConfirmPassErr', 'upPassFormErr']);
  clearInputStates(['upCurrentPass', 'upNewPass', 'upConfirmPass']);
});


// ══════════════════════════════
//   HELPER FUNCTIONS
// ══════════════════════════════
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function clearErrors(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

function setInputState(id, state) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('error', 'success');
  if (state) el.classList.add(state);
}

function clearInputStates(ids) {
  ids.forEach(id => setInputState(id, null));
}

function setLoading(btnId, spinnerId, loading) {
  const btn     = document.getElementById(btnId);
  const spinner = document.getElementById(spinnerId);
  if (!btn || !spinner) return;
  btn.disabled = loading;
  spinner.classList.toggle('show', loading);
}

function showToast(msg, isError = false) {
  const toast   = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  toastMsg.textContent = msg;

  // warna toast
  toast.style.borderColor = isError
    ? 'rgba(255,80,80,0.3)'
    : 'rgba(34,197,94,0.3)';
  toast.style.color = isError ? '#ff5050' : '#22c55e';

  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}


// ══════════════════════════════
//   AUTO REFRESH TOKEN
// ══════════════════════════════
async function tryRefreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
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
  } catch {
    return false;
  }
}

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
      const newToken = localStorage.getItem('accessToken');
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`,
          'Content-Type': 'application/json'
        }
      });
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '../form-login/index.html';
    }
  }

  return response;
}


// ══════════════════════════════
//   FORM UPDATE PROFILE
//   PATCH /update/profile
// ══════════════════════════════
document.getElementById('formUpdateProfile').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name  = document.getElementById('upName').value.trim();
  const email = document.getElementById('upEmail').value.trim();

  clearErrors(['upNameErr', 'upEmailErr', 'upFormErr']);
  clearInputStates(['upName', 'upEmail']);

  let valid = true;

  if (!name) {
    showError('upNameErr', 'Nama tidak boleh kosong.');
    setInputState('upName', 'error');
    valid = false;
  }

  if (!email) {
    showError('upEmailErr', 'Email tidak boleh kosong.');
    setInputState('upEmail', 'error');
    valid = false;
  } else if (!isValidEmail(email)) {
    showError('upEmailErr', 'Format email tidak valid.');
    setInputState('upEmail', 'error');
    valid = false;
  }

  if (!valid) return;

  // Cek apakah ada perubahan
  if (name === userData.name && email === userData.email) {
    showError('upFormErr', 'Tidak ada perubahan yang disimpan.');
    return;
  }

  setLoading('btnSaveProfile', 'profileSpinner', true);

  try {
    const body = {};
    if (name  !== userData.name)  body.name  = name;
    if (email !== userData.email) body.email = email;

    const response = await fetchWithAuth(`${BASE_URL}/update/profile`, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      showError('upFormErr', data.message ?? 'Gagal memperbarui profil.');
      setLoading('btnSaveProfile', 'profileSpinner', false);
      return;
    }

    // Update localStorage dengan data terbaru
    userData = { ...userData, ...data.data };
    localStorage.setItem('user', JSON.stringify(userData));

    // Update tampilan avatar & nama
    document.getElementById('avatarPreview').textContent = getInitials(data.data.name);
    document.getElementById('avatarName').textContent    = data.data.name;

    // Tandai input sukses
    setInputState('upName', 'success');
    setInputState('upEmail', 'success');

    showToast('Profil berhasil diperbarui!');
    setLoading('btnSaveProfile', 'profileSpinner', false);

  } catch (err) {
    showError('upFormErr', 'Tidak dapat terhubung ke server.');
    setLoading('btnSaveProfile', 'profileSpinner', false);
  }
});


// ══════════════════════════════
//   FORM UPDATE PASSWORD
//   PATCH /update/password
// ══════════════════════════════
document.getElementById('formUpdatePassword').addEventListener('submit', async (e) => {
  e.preventDefault();

  const currentPassword    = document.getElementById('upCurrentPass').value;
  const newPassword        = document.getElementById('upNewPass').value;
  const confirmNewPassword = document.getElementById('upConfirmPass').value;

  clearErrors(['upCurrentPassErr', 'upNewPassErr', 'upConfirmPassErr', 'upPassFormErr']);
  clearInputStates(['upCurrentPass', 'upNewPass', 'upConfirmPass']);

  let valid = true;

  if (!currentPassword) {
    showError('upCurrentPassErr', 'Kata sandi saat ini tidak boleh kosong.');
    setInputState('upCurrentPass', 'error');
    valid = false;
  }

  if (!newPassword) {
    showError('upNewPassErr', 'Kata sandi baru tidak boleh kosong.');
    setInputState('upNewPass', 'error');
    valid = false;
  } else if (newPassword.length < 8) {
    showError('upNewPassErr', 'Kata sandi baru minimal 8 karakter.');
    setInputState('upNewPass', 'error');
    valid = false;
  } else if (newPassword === currentPassword) {
    showError('upNewPassErr', 'Kata sandi baru tidak boleh sama dengan yang lama.');
    setInputState('upNewPass', 'error');
    valid = false;
  }

  if (!confirmNewPassword) {
    showError('upConfirmPassErr', 'Konfirmasi kata sandi tidak boleh kosong.');
    setInputState('upConfirmPass', 'error');
    valid = false;
  } else if (newPassword !== confirmNewPassword) {
    showError('upConfirmPassErr', 'Konfirmasi kata sandi tidak cocok.');
    setInputState('upConfirmPass', 'error');
    valid = false;
  }

  if (!valid) return;

  setLoading('btnSavePassword', 'passwordSpinner', true);

  try {
    const response = await fetchWithAuth(`${BASE_URL}/update/password`, {
      method: 'PATCH',
      body: JSON.stringify({
        currentPassword,    // ← sesuai interface backend
        newPassword,        // ← sesuai interface backend
        confirmNewPassword  // ← sesuai interface backend
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Jika password saat ini salah
      if (response.status === 400 || response.status === 401) {
        showError('upCurrentPassErr', data.message ?? 'Kata sandi saat ini salah.');
        setInputState('upCurrentPass', 'error');
      } else {
        showError('upPassFormErr', data.message ?? 'Gagal memperbarui kata sandi.');
      }
      setLoading('btnSavePassword', 'passwordSpinner', false);
      return;
    }

    // Reset form setelah berhasil
    document.getElementById('formUpdatePassword').reset();
    setInputState('upCurrentPass', 'success');
    setInputState('upNewPass', 'success');
    setInputState('upConfirmPass', 'success');

    showToast('Kata sandi berhasil diperbarui!');
    setLoading('btnSavePassword', 'passwordSpinner', false);

  } catch (err) {
    showError('upPassFormErr', 'Tidak dapat terhubung ke server.');
    setLoading('btnSavePassword', 'passwordSpinner', false);
  }
});


// ══════════════════════════════
//   TOGGLE SHOW/HIDE PASSWORD
// ══════════════════════════════
function togglePass(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';

  // Ganti icon
  btn.innerHTML = isHidden
    ? `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
        <path d="M3 3l14 14M10 4c4.5 0 8 4.5 8 6s-1.5 3.5-3.5 5M6.5 15A8.5 8.5 0 0 1 2 10c0-1.5 3.5-6 8-6"/>
        <circle cx="10" cy="10" r="2.5"/>
       </svg>`
    : `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
        <path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/>
        <circle cx="10" cy="10" r="2.5"/>
       </svg>`;
}


// ══════════════════════════════
//   UPDATE AVATAR PREVIEW REALTIME
//   saat user mengetik nama
// ══════════════════════════════
document.getElementById('upName').addEventListener('input', (e) => {
  const val = e.target.value.trim();
  document.getElementById('avatarPreview').textContent = val
    ? getInitials(val)
    : getInitials(userData.name);
  document.getElementById('avatarName').textContent = val || userData.name || '—';
});