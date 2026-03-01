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


// TAB SWITCHER (Sign In / Sign Up)
const tabIndicator = document.getElementById('tabIndicator');
const panelSignIn  = document.getElementById('panelSignIn');
const panelSignUp  = document.getElementById('panelSignUp');
const tabSignIn    = document.getElementById('tabSignIn');
const tabSignUp    = document.getElementById('tabSignUp');

function switchTab(tab) {
  if (tab === 'signin') {
    tabSignIn.classList.add('active');
    tabSignUp.classList.remove('active');
    tabIndicator.classList.remove('right');
    panelSignIn.classList.remove('hidden');
    panelSignUp.classList.add('hidden');
  } else {
    tabSignUp.classList.add('active');
    tabSignIn.classList.remove('active');
    tabIndicator.classList.add('right');
    panelSignUp.classList.remove('hidden');
    panelSignIn.classList.add('hidden');
  }

  // Re-trigger entrance animation
  const active = tab === 'signin' ? panelSignIn : panelSignUp;
  active.style.animation = 'none';
  active.offsetHeight; // force reflow
  active.style.animation = '';
}


// TOGGLE PASSWORD VISIBILITY
function togglePass(inputId, btn) {
  const input   = document.getElementById(inputId);
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';

  btn.innerHTML = isHidden
    ? `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
         <path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/>
         <line x1="3" y1="3" x2="17" y2="17" stroke-width="1.8"/>
       </svg>`
    : `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
         <path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/>
         <circle cx="10" cy="10" r="2.5"/>
       </svg>`;
}


// PASSWORD STRENGTH METER
const suPassword    = document.getElementById('suPassword');
const strengthFill  = document.getElementById('strengthFill');
const strengthLabel = document.getElementById('strengthLabel');

const strengthLevels = [
  { label: '',             color: 'transparent', width: '0%'   },
  { label: 'Lemah',        color: '#ff6b6b',     width: '25%'  },
  { label: 'Sedang',       color: '#facc15',     width: '55%'  },
  { label: 'Kuat',         color: '#4ade80',     width: '80%'  },
  { label: 'Sangat Kuat',  color: '#22d3ee',     width: '100%' },
];

function getStrength(pwd) {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8)         score++;
  if (/[A-Z]/.test(pwd))       score++;
  if (/[0-9]/.test(pwd))       score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

suPassword.addEventListener('input', () => {
  const score = getStrength(suPassword.value);
  const lvl   = strengthLevels[score];
  strengthFill.style.width      = lvl.width;
  strengthFill.style.background = lvl.color;
  strengthLabel.textContent     = lvl.label;
  strengthLabel.style.color     = lvl.color;
});


// VALIDATION HELPERS
function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function clearErrors(...ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

function markInput(inputId, hasError) {
  const el = document.getElementById(inputId);
  if (el) el.classList.toggle('error', hasError);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setLoading(btnId, spinnerId, loading) {
  const btn     = document.getElementById(btnId);
  const spinner = document.getElementById(spinnerId);
  btn.disabled  = loading;
  spinner.classList.toggle('active', loading);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


// SIGN IN FORM
document.getElementById('formSignIn').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email    = document.getElementById('siEmail').value.trim();
  const password = document.getElementById('siPassword').value;

  clearErrors('siEmailErr', 'siPassErr');
  markInput('siEmail', false);
  markInput('siPassword', false);

  let valid = true;

  if (!email) {
    showError('siEmailErr', 'Email tidak boleh kosong.');
    markInput('siEmail', true);
    valid = false;
  } else if (!isValidEmail(email)) {
    showError('siEmailErr', 'Format email tidak valid.');
    markInput('siEmail', true);
    valid = false;
  }

  if (!password) {
    showError('siPassErr', 'Kata sandi tidak boleh kosong.');
    markInput('siPassword', true);
    valid = false;
  } else if (password.length < 8) {
    showError('siPassErr', 'Kata sandi minimal 6 karakter.');
    markInput('siPassword', true);
    valid = false;
  }

  if (!valid) return;

  setLoading('btnSignIn', 'siSpinner', true);
  await delay(1800);
  setLoading('btnSignIn', 'siSpinner', false);

  try {
    // kirim request ke backend
    const response = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })

    const data = await response.json();

    if (!response.ok) {
      // login gagal dari backend
      showError("siPassErr", data.message ?? "Email atau password salah")
      markInput("siEmail", true)
      markInput("siPassword", true)
      setLoading("btnSignIn", "siSpinner", false)
      return 
    }

    // simpan kedua token & data user
    localStorage.setItem("accessToken", data.accessToken)
    localStorage.setItem("refreshToken", data.refreshToken)
    localStorage.setItem("user", JSON.stringify(data.user))

    // redirect ke dashboard
    window.location.href = "../dashboard/index.html"
  } catch (err) {
    // login gagal dari frontend
    showError("siPassErr", "Tidak dapat terhubung ke server")
    setLoading("btnSignIn", "siSpinner", false)
  }
});


// SIGN UP FORM
document.getElementById('formSignUp').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nama      = document.getElementById('suNama').value.trim();
  const lastName  = document.getElementById('suLastname').value.trim();
  const email     = document.getElementById('suEmail').value.trim();
  const password  = document.getElementById('suPassword').value;
  const confirm   = document.getElementById('suConfirm').value;
  const terms     = document.getElementById('suTerms').checked;

  clearErrors('suNamaErr', 'suEmailErr', 'suPassErr', 'suConfirmErr', 'suTermsErr');
  ['suNama', 'suEmail', 'suPassword', 'suConfirm'].forEach(id => markInput(id, false));

  let valid = true;

  if (!nama) {
    showError('suNamaErr', 'Nama depan tidak boleh kosong.');
    markInput('suNama', true);
    valid = false;
  }

  if (!email) {
    showError('suEmailErr', 'Email tidak boleh kosong.');
    markInput('suEmail', true);
    valid = false;
  } else if (!isValidEmail(email)) {
    showError('suEmailErr', 'Format email tidak valid.');
    markInput('suEmail', true);
    valid = false;
  }

  if (!password) {
    showError('suPassErr', 'Kata sandi tidak boleh kosong.');
    markInput('suPassword', true);
    valid = false;
  } else if (password.length < 8) {
    showError('suPassErr', 'Kata sandi minimal 8 karakter.');
    markInput('suPassword', true);
    valid = false;
  }

  if (!confirm) {
    showError('suConfirmErr', 'Konfirmasi kata sandi wajib diisi.');
    markInput('suConfirm', true);
    valid = false;
  } else if (password !== confirm) {
    showError('suConfirmErr', 'Kata sandi tidak cocok.');
    markInput('suConfirm', true);
    valid = false;
  }

  if (!terms) {
    showError('suTermsErr', 'Anda harus menyetujui syarat & ketentuan.');
    valid = false;
  }

  if (!valid) return;

  setLoading('btnSignUp', 'suSpinner', true);

  try {
    const fullName = lastName ? `${nama} ${lastName}` : nama;

    const response = await fetch('http://localhost:3000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fullName,
        email,
        password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // registrasi gagal dari backend
      showError('suEmailErr', data.message ?? 'Registrasi gagal, coba lagi.');
      markInput('suEmail', true);
      setLoading('btnSignUp', 'suSpinner', false);
      return;
    }

    // REGISTRASI BERHASIL → SIMPAN TOKEN → AUTO LOGIN
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.data));

    setLoading('btnSignUp', 'suSpinner', false);

    // langsung masuk ke dashboard
    window.location.href = '../dashboard/index.html';

  } catch (err) {
    showError('suEmailErr', 'Tidak dapat terhubung ke server.');
    setLoading('btnSignUp', 'suSpinner', false);
  }
});