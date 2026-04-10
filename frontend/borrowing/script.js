const BASE_URL = 'http://localhost:3000/';

function getToken() {
  const u = JSON.parse(localStorage.getItem('userData') ?? '{}');
  return u.accessToken ?? u.token ?? u.access_token ?? '';
}

function checkAuth() {
  const token = getToken();
  if (!token) { location.href = '../form-login/index.html'; }
}

async function fetchWithAuth(url, options = {}) {
  const token = getToken();
  if (!token) { location.href = '../form-login/index.html'; return null; }
  return fetch(url, {
    ...options,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(options.headers ?? {}) }
  });
}

// ── STATE ──
let currentPage = 1;
let currentStatus = '';
let selectedBook = null;
let bookSearchTimer = null;
let allBooks = [];

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadUserInfo();
  initSidebar();
  initTheme();
  initStatusTabs();
  initModals();
  loadBorrowings();
});

// ── USER INFO ──
function loadUserInfo() {
  const userData = JSON.parse(localStorage.getItem('userData') ?? '{}');
  const name = userData.name ?? '?';
  const role = (userData.role ?? '').toUpperCase();
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  document.getElementById('userAvatar').textContent = initials;
  document.getElementById('userName').textContent = name;
  document.getElementById('userRole').textContent = role === 'ADMIN' ? 'Admin' : 'User';
  document.getElementById('dropdownAvatar').textContent = initials;
  document.getElementById('dropdownName').textContent = name;
  document.getElementById('dropdownEmail').textContent = userData.email ?? '—';

  // Sembunyikan menu manajemen jika bukan admin
  if (role !== 'ADMIN') {
    document.querySelectorAll('.nav-admin').forEach(el => {
      el.style.display = 'none';
    });
  }
}

// ── SIDEBAR ──
function initSidebar() {
  if (localStorage.getItem('sidebarCollapsed') === 'true') document.body.classList.add('collapsed');
  document.getElementById('toggleBtn').addEventListener('click', () => {
    document.body.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', document.body.classList.contains('collapsed'));
  });
  const userCard = document.getElementById('userCard');
  const dropdown = document.getElementById('userDropdown');
  userCard.addEventListener('click', () => {
    userCard.classList.toggle('open');
    dropdown.classList.toggle('open');
  });
  document.getElementById('logoutBtn').addEventListener('click', () => document.getElementById('logoutModal').classList.add('active'));
  document.getElementById('logoutCancel').addEventListener('click', () => document.getElementById('logoutModal').classList.remove('active'));
  document.getElementById('logoutConfirm').addEventListener('click', () => {
    localStorage.removeItem('userData');
    location.href = '../form-login/index.html';
  });

  document.querySelectorAll('.nav-item').forEach(item => {
    const span = item.querySelector('span');
    if (!span) return;
    const label = span.textContent.trim();
    if (label === 'Pengaturan' || label === 'Bantuan') {
      item.addEventListener('click', e => {
        e.stopPropagation();
        alert('Segera Hadir');
      });
    }
  });
}

// ── THEME ──
function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light') { document.body.classList.add('light'); document.getElementById('themeKnob').textContent = '☀️'; }
  document.getElementById('themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('light');
    const isLight = document.body.classList.contains('light');
    document.getElementById('themeKnob').textContent = isLight ? '☀️' : '🌙';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  });
}

// ── STATUS TABS ──
function initStatusTabs() {
  document.querySelectorAll('.status-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentStatus = tab.dataset.status;
      currentPage = 1;
      loadBorrowings();
    });
  });
}

// ── LOAD BORROWINGS ──
async function loadBorrowings() {
  showSkeleton();
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('pagination').innerHTML = '';

  const params = new URLSearchParams({
    page: currentPage,
    limit: 10,
    ...(currentStatus && { status: currentStatus }),
  });

  const res = await fetchWithAuth(`${BASE_URL}borrowing/?${params}`);
  if (!res) return;

  const json = await res.json();
  const borrowings = json.data ?? [];
  const meta = json.meta ?? {};

  if (borrowings.length === 0) {
    document.getElementById('borrowList').innerHTML = '';
    document.getElementById('emptyState').style.display = 'flex';
    return;
  }

  renderCards(borrowings);
  renderPagination(meta);
}

function showSkeleton() {
  document.getElementById('borrowList').innerHTML = Array(3).fill(
    `<div class="borrow-card skeleton-card"></div>`
  ).join('');
}

// ── RENDER CARDS ──
function renderCards(borrowings) {
  const list = document.getElementById('borrowList');
  list.innerHTML = borrowings.map(b => {
    const isOverdue = b.status === 'APPROVED' && new Date(b.dueDate) < new Date();
    return `
    <div class="borrow-card" onclick="openDetail(${b.id})">
      ${b.book.cover
        ? `<img class="card-cover" src="${escHtml(b.book.cover)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : ''
      }
      <div class="card-cover-placeholder" style="display:${b.book.cover ? 'none' : 'flex'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
      </div>
      <div class="card-info">
        <div class="card-book-title">${escHtml(b.book.title)}</div>
        <div class="card-book-author">${escHtml(b.book.author)}</div>
        <div class="card-dates">
          <div class="card-date-item">
            <span class="card-date-label">Dipinjam</span>
            <span class="card-date-val">${formatDate(b.borrowAt)}</span>
          </div>
          <div class="card-date-item">
            <span class="card-date-label">Jatuh Tempo</span>
            <span class="card-date-val ${isOverdue ? 'card-date-overdue' : ''}">${formatDate(b.dueDate)}</span>
          </div>
          ${b.returnedAt ? `
          <div class="card-date-item">
            <span class="card-date-label">Dikembalikan</span>
            <span class="card-date-val">${formatDate(b.returnedAt)}</span>
          </div>` : ''}
        </div>
      </div>
      <div class="card-right">
        ${renderStatusBadge(b.status)}
        ${b.fine > 0 ? `
          <div style="text-align:right">
            <div class="card-fine-label">Denda</div>
            <div class="card-fine">Rp ${b.fine.toLocaleString('id-ID')}</div>
          </div>
        ` : ''}
      </div>
    </div>`;
  }).join('');
}

function renderStatusBadge(status) {
  const map = {
    PENDING:  ['badge-pending',  'Menunggu Persetujuan'],
    APPROVED: ['badge-approved', 'Aktif'],
    OVERDUE:  ['badge-overdue',  'Terlambat'],
    RETURNED: ['badge-returned', 'Selesai'],
    REJECTED: ['badge-rejected', 'Ditolak'],
  };
  const [cls, label] = map[status] ?? ['badge-pending', status];
  return `<span class="status-badge ${cls}"><span class="badge-dot"></span>${label}</span>`;
}

// ── DETAIL MODAL ──
async function openDetail(id) {
  document.getElementById('detailModalOverlay').classList.add('active');
  document.getElementById('detailModalBody').innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted)">Memuat...</div>';

  const res = await fetchWithAuth(`${BASE_URL}borrowing/${id}`);
  if (!res) return;
  const json = await res.json();
  const b = json.data;
  if (!b) return;

  const dueDate = new Date(b.dueDate);
  const now = new Date();
  const isOverdue = (b.status === 'APPROVED' || b.status === 'OVERDUE') && dueDate < now;
  const daysLate = isOverdue ? Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24)) : 0;

  document.getElementById('detailModalBody').innerHTML = `
    <div class="detail-section">
      <div class="detail-label">Buku</div>
      <div class="detail-book-card">
        ${b.book.cover
          ? `<img class="detail-book-cover" src="${escHtml(b.book.cover)}" alt="">`
          : `<div class="detail-book-cover" style="display:flex;align-items:center;justify-content:center;color:rgba(124,106,255,0.3)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>`
        }
        <div>
          <div class="detail-book-title">${escHtml(b.book.title)}</div>
          <div class="detail-book-author">${escHtml(b.book.author)}</div>
        </div>
      </div>
    </div>
    <div class="detail-section">
      <div class="detail-label">Status Peminjaman</div>
      <div class="detail-row">
        <span class="detail-key">Status</span>
        <span class="detail-val">${renderStatusBadge(b.status)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-key">Tanggal Pinjam</span>
        <span class="detail-val">${formatDateFull(b.borrowAt)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-key">Jatuh Tempo</span>
        <span class="detail-val ${isOverdue ? 'date-overdue' : ''}">${formatDateFull(b.dueDate)}${isOverdue ? ` (${daysLate} hari terlambat)` : ''}</span>
      </div>
      ${b.returnedAt ? `
      <div class="detail-row">
        <span class="detail-key">Dikembalikan</span>
        <span class="detail-val">${formatDateFull(b.returnedAt)}</span>
      </div>` : ''}
      <div class="detail-row">
        <span class="detail-key">Denda</span>
        <span class="detail-val ${b.fine > 0 ? 'fine-amount' : 'fine-none'}">
          ${b.fine > 0 ? `Rp ${b.fine.toLocaleString('id-ID')}` : '—'}
        </span>
      </div>
    </div>
    ${isOverdue ? `
    <div style="padding:10px 14px;background:rgba(255,80,80,0.08);border:1px solid rgba(255,80,80,0.2);border-radius:8px;font-size:12.5px;color:#ff5050">
      ⚠️ Buku ini sudah melewati jatuh tempo. Segera hubungi petugas perpustakaan.
    </div>` : ''}
  `;
}

// ── AJUKAN MODAL ──
function openAjukanModal() {
  selectedBook = null;
  document.getElementById('bookSearchInput').value = '';
  document.getElementById('bookSuggestions').style.display = 'none';
  document.getElementById('selectedBook').style.display = 'none';
  document.getElementById('ajukanError').style.display = 'none';
  document.getElementById('ajukanSubmit').disabled = true;
  document.getElementById('ajukanModalOverlay').classList.add('active');
  setTimeout(() => document.getElementById('bookSearchInput').focus(), 100);
}

// ── BOOK SEARCH ──
async function searchBooks(query) {
  if (!query || query.length < 2) {
    document.getElementById('bookSuggestions').style.display = 'none';
    return;
  }

  console.log('Searching:', query);

  const res = await fetchWithAuth(`${BASE_URL}books?page=1&limit=20&search=${encodeURIComponent(query)}`);
  console.log('Response status:', res?.status);

  if (!res) return;
  const json = await res.json();
  console.log('Response data:', json);

  const books = json.data ?? [];

  const container = document.getElementById('bookSuggestions');
  if (books.length === 0) {
    container.innerHTML = '<div class="no-results">Buku tidak ditemukan</div>';
    container.style.display = 'block';
    return;
  }

  container.innerHTML = books.map(book => `
    <div class="book-suggestion-item" onclick="selectBook(${JSON.stringify(book).replace(/"/g, '&quot;')})">
      ${book.cover
        ? `<img class="suggestion-cover" src="${escHtml(book.cover)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : ''
      }
      <div class="suggestion-cover-placeholder" style="display:${book.cover ? 'none' : 'flex'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
      </div>
      <div>
        <div class="suggestion-title">${escHtml(book.title)}</div>
        <div class="suggestion-author">${escHtml(book.author)}</div>
        <div class="suggestion-stock ${book.availableStock > 0 ? 'available' : 'unavailable'}">
          ${book.availableStock > 0 ? `✓ ${book.availableStock} tersedia` : '✗ Stok habis'}
        </div>
      </div>
    </div>
  `).join('');
  container.style.display = 'block';
}

function selectBook(book) {
  selectedBook = book;
  document.getElementById('bookSuggestions').style.display = 'none';
  document.getElementById('bookSearchInput').value = '';

  // Show selected book
  const wrap = document.getElementById('selectedBook');
  document.getElementById('selectedBookTitle').textContent = book.title;
  document.getElementById('selectedBookAuthor').textContent = book.author;
  document.getElementById('selectedBookMeta').textContent = `${book.category ?? '—'} · ${book.year ?? '—'}`;

  const stockEl = document.getElementById('selectedBookStock');
  stockEl.textContent = book.availableStock > 0 ? `✓ ${book.availableStock} eksemplar tersedia` : '✗ Stok tidak tersedia';
  stockEl.className = `selected-book-stock ${book.availableStock > 1 ? 'ok' : book.availableStock === 1 ? 'low' : ''}`;

  // Cover
  const coverDiv = document.getElementById('selectedBookCover');
  if (book.cover) {
    coverDiv.innerHTML = `<img src="${escHtml(book.cover)}" style="width:44px;height:62px;border-radius:6px;object-fit:cover" alt="">`;
  } else {
    coverDiv.className = 'selected-cover-placeholder';
    coverDiv.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`;
  }

  wrap.style.display = 'block';
  document.getElementById('ajukanSubmit').disabled = book.availableStock <= 0;
  document.getElementById('ajukanError').style.display = 'none';
}

// ── SUBMIT AJUKAN ──
async function submitAjukan() {
  if (!selectedBook) return;

  const spinner = document.getElementById('ajukanSpinner');
  const submitText = document.getElementById('ajukanSubmitText');
  const submitBtn = document.getElementById('ajukanSubmit');

  spinner.style.display = 'block';
  submitText.style.display = 'none';
  submitBtn.disabled = true;

  const res = await fetchWithAuth(`${BASE_URL}borrowing`, {
    method: 'POST',
    body: JSON.stringify({ bookId: selectedBook.id }),
  });

  spinner.style.display = 'none';
  submitText.style.display = 'block';
  submitBtn.disabled = false;

  if (res && res.ok) {
    document.getElementById('ajukanModalOverlay').classList.remove('active');
    showToast('Peminjaman berhasil diajukan! Menunggu persetujuan admin.', 'success');
    loadBorrowings();
  } else {
    const err = res ? await res.json() : {};
    const msg = typeof err.message === 'string' ? err.message : 'Terjadi kesalahan';
    document.getElementById('ajukanError').textContent = msg;
    document.getElementById('ajukanError').style.display = 'block';
    submitBtn.disabled = false;
  }
}

// ── INIT MODALS ──
function initModals() {
  // Ajukan modal
  document.getElementById('btnAjukan').addEventListener('click', openAjukanModal);
  document.getElementById('ajukanModalClose').addEventListener('click', () => document.getElementById('ajukanModalOverlay').classList.remove('active'));
  document.getElementById('ajukanCancel').addEventListener('click', () => document.getElementById('ajukanModalOverlay').classList.remove('active'));
  document.getElementById('ajukanSubmit').addEventListener('click', submitAjukan);
  document.getElementById('selectedBookRemove').addEventListener('click', () => {
    selectedBook = null;
    document.getElementById('selectedBook').style.display = 'none';
    document.getElementById('ajukanSubmit').disabled = true;
  });

  // Book search
  const input = document.getElementById('bookSearchInput');
  input.addEventListener('input', () => {
    clearTimeout(bookSearchTimer);
    bookSearchTimer = setTimeout(() => searchBooks(input.value.trim()), 350);
  });

  // Hide suggestions on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('#ajukanModal')) {
      document.getElementById('bookSuggestions').style.display = 'none';
    }
  });

  // Detail modal
  document.getElementById('detailModalClose').addEventListener('click', () => document.getElementById('detailModalOverlay').classList.remove('active'));
  document.getElementById('detailModalClose2').addEventListener('click', () => document.getElementById('detailModalOverlay').classList.remove('active'));
  document.getElementById('detailModalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('detailModalOverlay'))
      document.getElementById('detailModalOverlay').classList.remove('active');
  });
}

// ── PAGINATION ──
function renderPagination(meta) {
  const { page, totalPages } = meta;
  if (totalPages <= 1) return;
  const container = document.getElementById('pagination');
  const pages = [];
  pages.push(`<button class="page-btn" ${page === 1 ? 'disabled' : ''} onclick="goPage(${page - 1})">←</button>`);
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(`<button class="page-btn ${i === page ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`);
    } else if (i === page - 2 || i === page + 2) {
      pages.push(`<button class="page-btn" style="cursor:default">…</button>`);
    }
  }
  pages.push(`<button class="page-btn" ${page === totalPages ? 'disabled' : ''} onclick="goPage(${page + 1})">→</button>`);
  container.innerHTML = pages.join('');
}

function goPage(p) { currentPage = p; loadBorrowings(); }

// ── HELPERS ──
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatDateFull(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' });
}
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  const icon = type === 'success'
    ? '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 10l4 4 8-8"/></svg>'
    : '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/></svg>';
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `${icon}<span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}