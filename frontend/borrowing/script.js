/**
 * ══════════════════════════════
 *   BORROWING MODULE SCRIPT
 *   Heavenly Library — Borrowing
 * ══════════════════════════════
 */

const BASE_URL = CONFIG.API_BASE_URL;

// ── STATE ──
let currentPage = 1;
let currentStatus = '';
let selectedBook = null;
let bookSearchTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  // Shared UI (Auth, Sidebar, Theme, Dropdown, Logout) dari common.js
  initCommon();

  // Borrowing-specific
  initStatusTabs();
  initModals();
  loadBorrowings();
});

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
  const paginationEl = document.getElementById('pagination');
  if (paginationEl) paginationEl.innerHTML = '';

  const now = new Date();

  // Terlambat: fetch APPROVED, filter dueDate < now di frontend
  if (currentStatus === 'OVERDUE') {
    const res = await apiFetch(`${BASE_URL}/borrowing/?page=1&limit=500&status=APPROVED`);
    if (!res) return;
    const json = await res.json();
    const all = (json.data ?? []).filter(b => new Date(b.dueDate) < now);

    const totalItems = all.length;
    const limit = 10;
    const totalPages = Math.ceil(totalItems / limit);
    const paged = all.slice((currentPage - 1) * limit, currentPage * limit);

    if (paged.length === 0) {
      document.getElementById('borrowList').innerHTML = '';
      document.getElementById('emptyState').style.display = 'flex';
      return;
    }

    renderCards(paged);
    renderPagination({ page: currentPage, totalPages, totalItems });
    return;
  }

  // Status lain: gunakan API standar
  const params = new URLSearchParams({
    page: currentPage,
    limit: 10,
    ...(currentStatus && { status: currentStatus }),
  });

  const res = await apiFetch(`${BASE_URL}/borrowing/?${params}`);
  if (!res) return;

  const json = await res.json();
  let borrowings = json.data ?? [];
  const meta = json.meta ?? {};

  // Jika tab AKTIF, filter keluar yang sudah TERLAMBAT agar tidak membingungkan
  if (currentStatus === 'APPROVED') {
    borrowings = borrowings.filter(b => new Date(b.dueDate) >= now);
  }

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
        ? `<img class="card-cover" src="${escapeHtml(b.book.cover)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : ''
      }
      <div class="card-cover-placeholder" style="display:${b.book.cover ? 'none' : 'flex'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
      </div>
      <div class="card-info">
        <div class="card-book-title">${escapeHtml(b.book.title)}</div>
        <div class="card-book-author">${escapeHtml(b.book.author)}</div>
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
        ${renderStatusBadge(isOverdue ? 'OVERDUE' : b.status)}
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

  try {
    const res = await apiFetch(`${BASE_URL}/borrowing/${id}`);
    if (!res || !res.ok) {
      document.getElementById('detailModalBody').innerHTML = '<div style="padding:20px;text-align:center;color:#ff5050">Gagal memuat data peminjaman.</div>';
      return;
    }
    const json = await res.json();
    const b = json.data;
    if (!b) {
      document.getElementById('detailModalBody').innerHTML = '<div style="padding:20px;text-align:center;color:#ff5050">Data tidak ditemukan.</div>';
      return;
    }

    const dueDate = new Date(b.dueDate);
    const now = new Date();
    const isOverdue = (b.status === 'APPROVED' || b.status === 'OVERDUE') && dueDate < now;
    const daysLate = isOverdue ? Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24)) : 0;

    document.getElementById('detailModalBody').innerHTML = `
      <div class="detail-section">
        <div class="detail-label">Buku</div>
        <div class="detail-book-card">
          ${b.book.cover
            ? `<img class="detail-book-cover" src="${escapeHtml(b.book.cover)}" alt="">`
            : `<div class="detail-book-cover" style="display:flex;align-items:center;justify-content:center;color:rgba(124,106,255,0.3)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>`
          }
          <div>
            <div class="detail-book-title">${escapeHtml(b.book.title)}</div>
            <div class="detail-book-author">${escapeHtml(b.book.author)}</div>
            <div style="margin-top: 4px; font-size: 11.5px; color: var(--text-muted);">ISBN: ${escapeHtml(b.book.isbn)}</div>
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
  } catch (e) {
    console.error(e);
    document.getElementById('detailModalBody').innerHTML = '<div style="padding:20px;text-align:center;color:#ff5050">Terjadi kesalahan sistem.</div>';
  }
}

// ── AJUKAN MODAL ──
function openAjukanModal() {
  selectedBook = null;
  document.getElementById('bookSearchInput').value = '';
  document.getElementById('bookSuggestions').innerHTML = '';
  document.getElementById('bookSuggestions').style.display = 'none';
  document.getElementById('selectedBook').style.display = 'none';
  const errEl = document.getElementById('ajukanError');
  if (errEl) errEl.style.display = 'none';
  const submitBtn = document.getElementById('ajukanSubmit');
  if (submitBtn) submitBtn.disabled = true;
  
  document.getElementById('ajukanModalOverlay').classList.add('active');
  setTimeout(() => {
    const input = document.getElementById('bookSearchInput');
    if (input) input.focus();
  }, 100);

  // Langsung tampilkan daftar buku yang tersedia dari endpoint publik
  loadInitialBooks();
}

// ── LOAD INITIAL BOOKS (saat modal dibuka) ──
async function loadInitialBooks() {
  const container = document.getElementById('bookSuggestions');
  if (!container) return;
  container.innerHTML = '<div class="no-results" style="color:var(--text-muted)">Memuat daftar buku...</div>';
  container.style.display = 'block';

  try {
    // Gunakan endpoint publik /books, bukan /admin/books
    const res = await apiFetch(`${BASE_URL}/books?page=1&limit=50`);
    if (!res) return;
    const json = await res.json();
    const books = json.data ?? [];

    if (books.length === 0) {
      container.innerHTML = '<div class="no-results">Tidak ada buku tersedia</div>';
      return;
    }

    renderBookSuggestions(books, container);
  } catch (err) {
    container.innerHTML = '<div class="no-results">Gagal memuat daftar buku</div>';
  }
}

// ── BOOK SEARCH ──
async function searchBooks(query) {
  const container = document.getElementById('bookSuggestions');
  if (!container) return;

  // Jika kosong, tampilkan kembali daftar awal
  if (!query || query.length < 2) {
    loadInitialBooks();
    return;
  }

  container.innerHTML = '<div class="no-results" style="color:var(--text-muted)">Mencari...</div>';
  container.style.display = 'block';

  // Gunakan endpoint publik /books
  const res = await apiFetch(`${BASE_URL}/books?page=1&limit=20&search=${encodeURIComponent(query)}`);
  if (!res) return;
  const json = await res.json();
  const books = json.data ?? [];

  if (books.length === 0) {
    container.innerHTML = '<div class="no-results">Buku tidak ditemukan</div>';
    container.style.display = 'block';
    return;
  }

  renderBookSuggestions(books, container);
}

// ── RENDER BOOK SUGGESTIONS (shared) ──
function renderBookSuggestions(books, container) {
  container.innerHTML = books.map(book => `
    <div class="book-suggestion-item" onclick="selectBook(${JSON.stringify(book).replace(/"/g, '&quot;')})">
      ${book.cover
        ? `<img class="suggestion-cover" src="${escapeHtml(book.cover)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : ''
      }
      <div class="suggestion-cover-placeholder" style="display:${book.cover ? 'none' : 'flex'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
      </div>
      <div>
        <div class="suggestion-title">${escapeHtml(book.title)}</div>
        <div class="suggestion-author">${escapeHtml(book.author)}</div>
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

  document.getElementById('selectedBookTitle').textContent = book.title;
  document.getElementById('selectedBookAuthor').textContent = book.author;
  document.getElementById('selectedBookMeta').textContent = `${book.category ?? '—'} · ${book.year ?? '—'}`;

  const stockEl = document.getElementById('selectedBookStock');
  stockEl.textContent = book.availableStock > 0 ? `✓ ${book.availableStock} eksemplar tersedia` : '✗ Stok tidak tersedia';
  stockEl.className = `selected-book-stock ${book.availableStock > 3 ? 'ok' : book.availableStock > 0 ? 'low' : ''}`;

  const coverDiv = document.getElementById('selectedBookCover');
  if (book.cover) {
    coverDiv.innerHTML = `<img src="${escapeHtml(book.cover)}" style="width:44px;height:62px;border-radius:6px;object-fit:cover" alt="">`;
  } else {
    coverDiv.className = 'selected-cover-placeholder';
    coverDiv.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`;
  }

  document.getElementById('selectedBook').style.display = 'block';
  document.getElementById('ajukanSubmit').disabled = book.availableStock <= 0;
  document.getElementById('ajukanError').style.display = 'none';
}

// ── SUBMIT AJUKAN ──
async function submitAjukan() {
  if (!selectedBook) return;

  const spinner = document.getElementById('ajukanSpinner');
  const submitText = document.getElementById('ajukanSubmitText');
  const submitBtn = document.getElementById('ajukanSubmit');

  if (spinner) spinner.style.display = 'block';
  if (submitText) submitText.style.display = 'none';
  if (submitBtn) submitBtn.disabled = true;

  try {
    const res = await apiFetch(`${BASE_URL}/borrowing/`, {
      method: 'POST',
      body: JSON.stringify({ bookId: Number(selectedBook.id) }),
    });

    if (spinner) spinner.style.display = 'none';
    if (submitText) submitText.style.display = 'block';

    if (res && res.ok) {
      document.getElementById('ajukanModalOverlay').classList.remove('active');
      showToast('Peminjaman berhasil diajukan! Menunggu persetujuan admin.', 'success');
      loadBorrowings();
    } else {
      let msg = 'Terjadi kesalahan';
      try {
        const err = res ? await res.json() : {};
        if (typeof err.message === 'string') msg = err.message;
      } catch (_) { /* ignore parse error */ }
      const errEl = document.getElementById('ajukanError');
      if (errEl) {
        errEl.textContent = msg;
        errEl.style.display = 'block';
      }
      if (submitBtn) submitBtn.disabled = false;
    }
  } catch (err) {
    console.error('Submit borrowing error:', err);
    if (spinner) spinner.style.display = 'none';
    if (submitText) submitText.style.display = 'block';
    if (submitBtn) submitBtn.disabled = false;
    const errEl = document.getElementById('ajukanError');
    if (errEl) {
      errEl.textContent = 'Tidak dapat terhubung ke server. Coba lagi.';
      errEl.style.display = 'block';
    }
  }
}

// ── INIT MODALS ──
function initModals() {
  // Ajukan modal
  const btnAjukan = document.getElementById('btnAjukan');
  if (btnAjukan) btnAjukan.addEventListener('click', openAjukanModal);
  
  const ajukanClose = document.getElementById('ajukanModalClose');
  if (ajukanClose) ajukanClose.addEventListener('click', () => document.getElementById('ajukanModalOverlay').classList.remove('active'));
  
  const ajukanCancel = document.getElementById('ajukanCancel');
  if (ajukanCancel) ajukanCancel.addEventListener('click', () => document.getElementById('ajukanModalOverlay').classList.remove('active'));
  
  const ajukanSubmit = document.getElementById('ajukanSubmit');
  if (ajukanSubmit) ajukanSubmit.addEventListener('click', submitAjukan);
  
  const removeBook = document.getElementById('selectedBookRemove');
  if (removeBook) removeBook.addEventListener('click', () => {
    selectedBook = null;
    document.getElementById('selectedBook').style.display = 'none';
    document.getElementById('ajukanSubmit').disabled = true;
  });

  // Book search
  const input = document.getElementById('bookSearchInput');
  if (input) {
    input.addEventListener('input', () => {
      clearTimeout(bookSearchTimer);
      bookSearchTimer = setTimeout(() => searchBooks(input.value.trim()), 350);
    });
  }

  // Hide suggestions on outside click
  document.addEventListener('click', e => {
    const suggestions = document.getElementById('bookSuggestions');
    if (suggestions && !e.target.closest('#ajukanModal')) {
      suggestions.style.display = 'none';
    }
  });

  // Detail modal
  const detailClose = document.getElementById('detailModalClose');
  if (detailClose) detailClose.addEventListener('click', () => document.getElementById('detailModalOverlay').classList.remove('active'));
  
  const detailClose2 = document.getElementById('detailModalClose2');
  if (detailClose2) detailClose2.addEventListener('click', () => document.getElementById('detailModalOverlay').classList.remove('active'));
  
  const detailOverlay = document.getElementById('detailModalOverlay');
  if (detailOverlay) {
    detailOverlay.addEventListener('click', e => {
      if (e.target === detailOverlay) detailOverlay.classList.remove('active');
    });
  }
}

// ── PAGINATION ──
function renderPagination(meta) {
  const { page, totalPages } = meta;
  if (!totalPages || totalPages <= 1) return;
  const container = document.getElementById('pagination');
  if (!container) return;
  
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

function goPage(p) { 
  currentPage = p; 
  loadBorrowings(); 
}

// ── HELPERS ──
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatDateFull(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' });
}
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  const icon = type === 'success'
    ? '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 10l4 4 8-8"/></svg>'
    : '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/></svg>';
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `${icon}<span>${escapeHtml(msg)}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}