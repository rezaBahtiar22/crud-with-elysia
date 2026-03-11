const API_BASE = 'http://localhost:3000';

// ── State ──
let currentPage  = 1;
let currentLimit = 20;
let currentSearch   = '';
let currentCategory = '';
let searchTimeout   = null;

// ── Ambil token dari localStorage ──
function getToken() {
  return localStorage.getItem('accessToken');
}

// ── Refresh token jika expired ──
async function tryRefreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh-access-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    const data = await res.json();
    if (res.ok && data.tokens?.accessToken) {
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
      return true;
    }
  } catch (_) {}
  return false;
}

// ── Fetch dengan auto-refresh token ──
async function apiFetch(url, options = {}) {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  // jika token expired, coba refresh lalu ulangi request
  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return apiFetch(url, options);
    }
    // refresh gagal — arahkan ke login
    redirectToLogin();
    return null;
  }

  return res;
}

// ── Redirect ke login ──
function redirectToLogin() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userData');
  location.href = '../form-login/index.html';
}

// ══════════════════════════════
// USER INFO
// ══════════════════════════════
function loadUserInfo() {
  const raw = localStorage.getItem('userData');
  if (!raw) return redirectToLogin();

  try {
    const user = JSON.parse(raw);
    const name = user.name || '';
    const initial = name
        ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : '?';

    // sidebar user card
    document.getElementById('avatarInitial').textContent = initial;
    document.getElementById('userName').textContent = user.name || '—';
    const roleMap = {
        ADMIN: 'Admin', admin: 'Admin',
        USER: 'User',   user: 'User',
    };
    document.getElementById('userRole').textContent = roleMap[user.role] || '—';

    // dropdown
    document.getElementById('dropdownAvatar').textContent = initial;
    document.getElementById('dropdownName').textContent  = user.name  || '—';
    document.getElementById('dropdownEmail').textContent = user.email || '—';

    // sembunyikan menu admin jika bukan ADMIN
    if (user.role !== 'ADMIN') {
      document.querySelectorAll('.nav-admin').forEach(el => el.style.display = 'none');
    }
  } catch (_) {
    redirectToLogin();
  }
}

// ══════════════════════════════
// FETCH BOOKS
// ══════════════════════════════
async function fetchBooks() {
  showSkeleton();
  document.getElementById('emptyState').style.display = 'none';

  // bangun query string
  const params = new URLSearchParams({
    page:  currentPage,
    limit: currentLimit,
    ...(currentSearch   && { search:   currentSearch }),
    ...(currentCategory && { category: currentCategory }),
  });

  const res = await apiFetch(`${API_BASE}/admin/books?${params}`);
  if (!res) return;

  const json = await res.json();

  if (!res.ok) {
    showEmpty();
    return;
  }

  const books = json.data      || [];
  const meta  = json.meta      || {};
  const total = meta.totalItems ?? books.length;

  // update total count
  document.getElementById('totalNum').textContent = total;

  if (books.length === 0) {
    showEmpty();
    renderPagination(meta);
    return;
  }

  renderBooks(books);
  renderPagination(meta);
  populateCategories(books);
}

// ── Render kartu buku ──
function renderBooks(books) {
  const grid = document.getElementById('bookGrid');
  grid.innerHTML = '';

  books.forEach((book, i) => {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.style.animationDelay = `${i * 0.04}s`;

    const hasStock = book.availableStock > 0;

    // jika ada cover URL gunakan <img>, jika tidak tampilkan placeholder
    const coverHTML = book.cover
      ? `<div class="book-cover"><img src="${escHtml(book.cover)}" alt="${escHtml(book.title)}" loading="lazy" onerror="this.parentElement.replaceWith(makePlaceholder('${escHtml(book.title)}'))"/></div>`
      : `<div class="book-cover-placeholder">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
           <span class="book-cover-placeholder-title">${escHtml(book.title)}</span>
         </div>`;

    card.innerHTML = `
      ${coverHTML}
      <div class="book-info">
        <div class="book-title">${escHtml(book.title)}</div>
        <div class="book-author">${escHtml(book.author)}</div>
        <div class="book-meta">
          ${book.category
            ? `<span class="book-category">${escHtml(book.category)}</span>`
            : `<span></span>`
          }
          <span class="book-stock">
            <span class="book-stock-dot ${hasStock ? '' : 'empty'}"></span>
            ${hasStock ? book.availableStock : 'Habis'}
          </span>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

// ── Helper: buat placeholder element ──
window.makePlaceholder = function(title) {
  const div = document.createElement('div');
  div.className = 'book-cover-placeholder';
  div.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
    <span class="book-cover-placeholder-title">${escHtml(title)}</span>
  `;
  return div;
};

// ── Escape HTML untuk mencegah XSS ──
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Render pagination ──
function renderPagination(meta) {
  const container = document.getElementById('pagination');
  container.innerHTML = '';

  const totalPages = meta.totalPages || 1;
  const page       = meta.page       || 1;

  if (totalPages <= 1) return;

  // tombol prev
  const prev = makePageBtn('←', page === 1, () => {
    currentPage--;
    fetchBooks();
  });
  container.appendChild(prev);

  // tombol halaman
  for (let i = 1; i <= totalPages; i++) {
    // tampilkan halaman pertama, terakhir, dan sekitar halaman aktif
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      const btn = makePageBtn(i, false, () => {
        currentPage = i;
        fetchBooks();
      });
      if (i === page) btn.classList.add('active');
      container.appendChild(btn);
    } else if (Math.abs(i - page) === 2) {
      // titik-titik ellipsis
      const dots = document.createElement('span');
      dots.textContent = '…';
      dots.style.cssText = 'color:var(--text-muted);padding:0 4px;font-size:14px;line-height:36px;';
      container.appendChild(dots);
    }
  }

  // tombol next
  const next = makePageBtn('→', page === totalPages, () => {
    currentPage++;
    fetchBooks();
  });
  container.appendChild(next);
}

function makePageBtn(label, disabled, onClick) {
  const btn = document.createElement('button');
  btn.className = 'page-btn';
  btn.textContent = label;
  btn.disabled = disabled;
  if (!disabled) btn.addEventListener('click', onClick);
  return btn;
}

// ── Isi dropdown kategori dari data buku ──
function populateCategories(books) {
  const select = document.getElementById('categoryFilter');
  const existing = new Set(
    Array.from(select.options).map(o => o.value).filter(Boolean)
  );

  books.forEach(b => {
    if (b.category && !existing.has(b.category)) {
      const opt = document.createElement('option');
      opt.value       = b.category;
      opt.textContent = b.category;
      select.appendChild(opt);
      existing.add(b.category);
    }
  });
}

// ── Skeleton loader ──
function showSkeleton() {
  const grid = document.getElementById('bookGrid');
  grid.innerHTML = Array(currentLimit > 12 ? 12 : currentLimit)
    .fill('<div class="book-skeleton"></div>')
    .join('');
}

// ── Empty state ──
function showEmpty() {
  document.getElementById('bookGrid').innerHTML = '';
  document.getElementById('emptyState').style.display = 'flex';
  document.getElementById('pagination').innerHTML = '';
}

// ══════════════════════════════
// SEARCH & FILTER
// ══════════════════════════════
function initSearchFilter() {
  const input  = document.getElementById('searchInput');
  const clear  = document.getElementById('searchClear');
  const select = document.getElementById('categoryFilter');

  // search dengan debounce 400ms
  input.addEventListener('input', () => {
    currentSearch = input.value.trim();
    clear.classList.toggle('visible', currentSearch.length > 0);

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentPage = 1;
      fetchBooks();
    }, 400);
  });

  // tombol clear search
  clear.addEventListener('click', () => {
    input.value   = '';
    currentSearch = '';
    clear.classList.remove('visible');
    currentPage = 1;
    fetchBooks();
  });

  // filter kategori
  select.addEventListener('change', () => {
    currentCategory = select.value;
    currentPage = 1;
    fetchBooks();
  });
}

// ══════════════════════════════
// SIDEBAR, THEME, DROPDOWN
// ══════════════════════════════
function initSidebar() {
  const toggleBtn = document.getElementById('toggleBtn');
  const sidebar   = document.getElementById('sidebar');
  const overlay   = document.getElementById('sidebarOverlay');

  const isMobile = () => window.innerWidth <= 768;

  if (localStorage.getItem('sidebarCollapsed') === 'true') {
    document.body.classList.add('collapsed');
  }

  toggleBtn.addEventListener('click', () => {
    if (isMobile()) {
      sidebar.classList.toggle('mobile-open');
      overlay.classList.toggle('active');
    } else {
      document.body.classList.toggle('collapsed');
      localStorage.setItem('sidebarCollapsed', document.body.classList.contains('collapsed'));
    }
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
  });

  // restore collapsed state
  if (localStorage.getItem('sidebarCollapsed') === 'true' && !isMobile()) {
    document.body.classList.add('collapsed');
  }

  toggleBtn.addEventListener('click', () => {
    if (!isMobile()) {
      localStorage.setItem('sidebarCollapsed',
        document.body.classList.contains('collapsed')
      );
    }
  });
}

function initTheme() {
  const toggle = document.getElementById('themeToggle');
  const knob   = document.getElementById('themeKnob');

  const apply = (light) => {
    document.body.classList.toggle('light', light);
    knob.textContent = light ? '☀️' : '🌙';
  };

  apply(localStorage.getItem('theme') === 'light');

  toggle.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light');
    knob.textContent = isLight ? '☀️' : '🌙';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  });
}

function initDropdown() {
  const card     = document.getElementById('userCard');
  const dropdown = document.getElementById('userDropdown');

  card.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.toggle('open');
    card.classList.toggle('open', isOpen);
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && !card.contains(e.target)) {
      dropdown.classList.remove('open');
      card.classList.remove('open');
    }
  });
}

// ══════════════════════════════
// LOGOUT
// ══════════════════════════════
function initLogout() {
  const modal   = document.getElementById('logoutModal');
  const cancel  = document.getElementById('cancelLogout');
  const confirm = document.getElementById('confirmLogout');

  document.getElementById('logoutBtn').addEventListener('click', () => {
    modal.classList.add('active');
  });

  cancel.addEventListener('click', () => modal.classList.remove('active'));

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  confirm.addEventListener('click', async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      await apiFetch(`${API_BASE}/user/logout`, {
        method: 'POST',
        body: JSON.stringify({ refreshToken })
      });
    } catch (_) {}
    redirectToLogin();
  });
}

// ══════════════════════════════
// INIT
// ══════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // cek auth
  if (!getToken()) return redirectToLogin();

  loadUserInfo();
  initSidebar();
  initTheme();
  initDropdown();
  initLogout();
  initSearchFilter();
  fetchBooks();
});