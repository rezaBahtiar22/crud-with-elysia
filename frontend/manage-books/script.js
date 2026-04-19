/* ══════════════════════════════
   HEAVENLY LIBRARY — Kelola Buku
══════════════════════════════ */

const BASE_URL = CONFIG.API_BASE_URL;

// ── State ──
let currentPage = 1;
let currentLimit = 10;
let currentSearch = '';
let currentCategory = '';
let totalPages = 1;
let editingId = null;
let deleteId = null;
let searchDebounce = null;

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  // Global Init dari common.js
  initCommon();
  
  // Modul spesifik admin check
  const userData = JSON.parse(localStorage.getItem('userData') ?? '{}');
  const role = (userData.role ?? '').toUpperCase();
  if (role !== 'ADMIN') {
    location.href = '../dashboard/index.html';
    return;
  }

  loadBooks();
  initToolbar();
  initModalBook();
  initModalDelete();
});

// ── Toolbar ──
function initToolbar() {
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');
  const dropdown    = document.getElementById('categoryDropdown');
  const trigger     = document.getElementById('categoryTrigger');

  // Toggle dropdown
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('active');
  });

  // Close common dropdowns on click outside
  document.addEventListener('click', () => {
    dropdown.classList.remove('active');
  });

  // Default "Semua Kategori" option
  const allOpt = document.querySelector('.select-option[data-value=""]');
  if (allOpt) {
    allOpt.addEventListener('click', () => selectCategory(''));
  }

  searchInput.addEventListener('input', () => {
    searchClear.style.display = searchInput.value ? 'flex' : 'none';
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      currentSearch = searchInput.value.trim();
      currentPage = 1;
      loadBooks();
    }, 400);
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.style.display = 'none';
    currentSearch = '';
    currentPage = 1;
    loadBooks();
  });

  loadAllCategories();
}

function selectCategory(val) {
  currentCategory = val;
  const label = document.getElementById('selectedCategoryLabel');
  label.textContent = val || 'Semua Kategori';

  // Toggle active state in UI
  document.querySelectorAll('.select-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.value === val);
  });

  document.getElementById('categoryDropdown').classList.remove('active');
  currentPage = 1;
  loadBooks();
}

async function loadAllCategories() {
  try {
    const res = await apiFetch(`${BASE_URL}/admin/books?page=1&limit=1000`);
    if (!res) return;
    const data = await res.json();
    const books = data.data ?? [];
    populateCategories(books);
  } catch (err) {
    console.error('Gagal load kategori:', err);
  }
}

// ── Load Books ──
async function loadBooks() {
  showSkeleton();

  try {
    const params = new URLSearchParams({
      page: currentPage,
      limit: currentLimit,
      ...(currentSearch && { search: currentSearch }),
      ...(currentCategory && { category: currentCategory })
    });

    const res = await apiFetch(`${BASE_URL}/admin/books?${params}`);
    if (!res) return;

    const data = await res.json();
    const books = data.data ?? [];
    const meta = data.meta ?? {};

    totalPages = meta.totalPages ?? 1;
    const totalItems = meta.totalItems ?? books.length;

    // Update total badge
    document.getElementById('totalBadge').textContent = `${totalItems} buku`;

    // Populate categories dropdown
    populateCategories(books);

    // Render table
    renderTable(books);

    // Render pagination
    renderPagination(meta.page ?? currentPage, totalPages);

    // Show empty state
    document.getElementById('emptyState').style.display = books.length === 0 ? 'flex' : 'none';

  } catch (err) {
    console.error('Gagal load buku:', err);
    document.getElementById('bookTableBody').innerHTML = '';
    document.getElementById('emptyState').style.display = 'flex';
  }
}

function showSkeleton() {
  const tbody = document.getElementById('bookTableBody');
  tbody.innerHTML = Array(5).fill('').map(() => `
    <tr class="skeleton-row">
      <td colspan="8"><div class="skeleton-line"></div></td>
    </tr>
  `).join('');
  document.getElementById('emptyState').style.display = 'none';
}

function populateCategories(books) {
  const container = document.getElementById('categoryOptions');
  if (!container) return;

  const existing = new Set(
    Array.from(container.querySelectorAll('.select-option'))
      .map(o => o.dataset.value)
      .filter(Boolean)
  );

  books.forEach(b => {
    if (b.category && !existing.has(b.category)) {
      const opt = document.createElement('div');
      opt.className = 'select-option';
      opt.dataset.value = b.category;
      opt.textContent   = b.category;
      
      opt.addEventListener('click', () => {
        selectCategory(b.category);
      });

      container.appendChild(opt);
      existing.add(b.category);
    }
  });
}

function renderTable(books) {
  const tbody = document.getElementById('bookTableBody');

  if (books.length === 0) {
    tbody.innerHTML = '';
    return;
  }

  tbody.innerHTML = books.map(book => {
    const stockDotClass = book.availableStock === 0 ? 'empty' : book.availableStock <= 2 ? 'low' : 'ok';

    const coverHtml = book.cover
      ? `<div class="book-thumb"><img src="${escapeHtml(book.cover)}" alt="" onerror="this.parentElement.innerHTML='<div class=\'book-thumb-placeholder\'><svg viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'1.5\'><path d=\'M4 19.5A2.5 2.5 0 0 1 6.5 17H20\'/><path d=\'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z\'/></svg></div>'"/></div>`
      : `<div class="book-thumb-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>`;

    return `
      <tr>
        <td>${coverHtml}</td>
        <td>
          <div class="book-table-title" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</div>
          <div class="book-table-author">${escapeHtml(book.author)}</div>
        </td>
        <td style="font-size:12px;color:var(--text-muted);font-family:monospace">${escapeHtml(book.isbn ?? '—')}</td>
        <td>${book.category ? `<span class="category-badge">${escapeHtml(book.category)}</span>` : '<span style="color:var(--text-muted);font-size:12px">—</span>'}</td>
        <td style="color:var(--text-muted);font-size:12px">${book.year ?? '—'}</td>
        <td>${book.stock ?? 0}</td>
        <td>
          <div class="stock-cell">
            <div class="stock-dot ${stockDotClass}"></div>
            ${book.availableStock ?? 0}
          </div>
        </td>
        <td>
          <div class="action-btns">
            <button class="action-btn action-btn--edit" title="Edit" onclick="openEditModal(${book.id})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="action-btn action-btn--delete" title="Hapus" onclick="openDeleteModal(${book.id}, '${escapeHtml(book.title).replace(/'/g, "\\'")}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ── Pagination ──
function renderPagination(page, total) {
  const el = document.getElementById('pagination');
  if (total <= 1) { el.innerHTML = ''; return; }

  let html = '';

  // Prev
  html += `<button class="page-btn" onclick="goPage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 2L4 7l5 5"/></svg>
  </button>`;

  // Pages
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= page - 2 && i <= page + 2)) {
      html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
    } else if (i === page - 3 || i === page + 3) {
      html += `<span style="color:var(--text-muted);padding:0 4px">…</span>`;
    }
  }

  // Next
  html += `<button class="page-btn" onclick="goPage(${page + 1})" ${page >= total ? 'disabled' : ''}>
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 2l5 5-5 5"/></svg>
  </button>`;

  el.innerHTML = html;
}

function goPage(page) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  loadBooks();
  document.querySelector('.kelola-main').scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Modal Tambah/Edit ──
function initModalBook() {
  document.getElementById('btnTambah').addEventListener('click', openAddModal);
  document.getElementById('modalClose').addEventListener('click', closeBookModal);
  document.getElementById('modalCancel').addEventListener('click', closeBookModal);
  document.getElementById('modalSave').addEventListener('click', saveBook);

  // Cover preview live
  document.getElementById('fieldCover').addEventListener('input', () => {
    const url = document.getElementById('fieldCover').value.trim();
    const img = document.getElementById('coverPreviewImg');
    const placeholder = document.getElementById('coverPlaceholder');
    if (url) {
      img.src = url;
      img.style.display = 'block';
      placeholder.style.display = 'none';
      img.onerror = () => {
        img.style.display = 'none';
        placeholder.style.display = 'flex';
      };
    } else {
      img.style.display = 'none';
      img.src = '';
      placeholder.style.display = 'flex';
    }
  });

  // Close on overlay click
  document.getElementById('bookModalOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('bookModalOverlay')) closeBookModal();
  });
}

function openAddModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Tambah Buku';
  document.getElementById('modalSaveText').textContent = 'Simpan Buku';
  clearForm();
  openBookModal();
}

async function openEditModal(id) {
  editingId = id;
  document.getElementById('modalTitle').textContent = 'Edit Buku';
  document.getElementById('modalSaveText').textContent = 'Simpan Perubahan';
  clearForm();
  openBookModal();

  try {
    const res = await apiFetch(`${BASE_URL}/admin/books/${id}`);
    if (!res || !res.ok) {
      const respData = res ? await res.json() : {};
      showToast(formatApiError(respData, 'Gagal memuat data buku'), 'error');
      closeBookModal();
      return;
    }
    
    const data = await res.json();
    const book = data.data ?? data.book ?? data;

    document.getElementById('fieldTitle').value = book.title ?? '';
    document.getElementById('fieldAuthor').value = book.author ?? '';
    document.getElementById('fieldIsbn').value = book.isbn ?? '';
    document.getElementById('fieldPublisher').value = book.publisher ?? '';
    document.getElementById('fieldYear').value = book.year ?? '';
    document.getElementById('fieldCategory').value = book.category ?? '';
    document.getElementById('fieldStock').value = book.stock ?? '';
    document.getElementById('fieldCover').value = book.cover ?? '';
    document.getElementById('fieldDesc').value = book.description ?? '';

    // Preview cover
    const img = document.getElementById('coverPreviewImg');
    const placeholder = document.getElementById('coverPlaceholder');

    if (book.cover && book.cover.trim() !== '') {
        img.src = book.cover;
        img.style.display = 'block';
        placeholder.style.display = 'none';
    } else {
        img.style.display = 'none';
        placeholder.style.display = 'flex';
    }
  } catch (err) {
    showFormError('Gagal memuat data buku');
  }
}

function openBookModal() {
  document.getElementById('bookModalOverlay').classList.add('active');
}

function closeBookModal() {
  document.getElementById('bookModalOverlay').classList.remove('active');
  clearForm();
  editingId = null;
}

function clearForm() {
  ['fieldTitle','fieldAuthor','fieldIsbn','fieldPublisher','fieldYear','fieldCategory','fieldStock','fieldCover','fieldDesc']
    .forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('coverPreviewImg').style.display = 'none';
  document.getElementById('coverPreviewImg').src = '';
  document.getElementById('coverPlaceholder').style.display = 'flex';
  hideFormError();
}

function showFormError(msg) {
  const el = document.getElementById('formError');
  el.textContent = msg;
  el.style.display = 'block';
}
function hideFormError() {
  document.getElementById('formError').style.display = 'none';
}

async function saveBook() {
  hideFormError();

  const title = document.getElementById('fieldTitle').value.trim();
  const author = document.getElementById('fieldAuthor').value.trim();
  const isbn = document.getElementById('fieldIsbn').value.trim();
  const publisher = document.getElementById('fieldPublisher').value.trim();
  const year = document.getElementById('fieldYear').value.trim();
  const category = document.getElementById('fieldCategory').value.trim();
  const stock = document.getElementById('fieldStock').value.trim();
  const cover = document.getElementById('fieldCover').value.trim();
  const description = document.getElementById('fieldDesc').value.trim();

  // Validasi minimal
  if (!title) return showFormError('Judul wajib diisi');
  if (!author) return showFormError('Penulis wajib diisi');
  if (!isbn) return showFormError('ISBN wajib diisi');

  const body = {
    title, author, isbn,
    ...(publisher && { publisher }),
    ...(year && { year: parseInt(year) }),
    ...(category && { category }),
    ...(stock !== '' && { stock: parseInt(stock) }),
    cover: cover || null,
    ...(description && { description })
  };

  if (editingId !== null && cover === '') {
    body.cover = null;
  }

  // Loading state
  const saveBtn = document.getElementById('modalSave');
  const spinner = document.getElementById('modalSpinner');
  const saveText = document.getElementById('modalSaveText');
  saveBtn.disabled = true;
  spinner.style.display = 'block';
  saveText.style.display = 'none';

  try {
    const isEdit = editingId !== null;
    const url = isEdit ? `${BASE_URL}/admin/books/${editingId}` : `${BASE_URL}/admin/books`;
    const method = isEdit ? 'PATCH' : 'POST';

    const res = await apiFetch(url, { method, body: JSON.stringify(body) });
    if (!res) return;

    const data = await res.json();

    if (!res.ok) {
      return showFormError(formatApiError(data));
    }

    closeBookModal();
    loadBooks();
    showToast(isEdit ? 'Buku berhasil diperbarui' : 'Buku berhasil ditambahkan', 'success');

  } catch (err) {
    showFormError('Gagal menyimpan buku. Coba lagi.');
  } finally {
    saveBtn.disabled = false;
    spinner.style.display = 'none';
    saveText.style.display = 'inline';
  }
}

// ── Modal Hapus ──
function initModalDelete() {
  document.getElementById('deleteCancelBtn').addEventListener('click', closeDeleteModal);
  document.getElementById('deleteConfirmBtn').addEventListener('click', confirmDelete);
  document.getElementById('deleteModalOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('deleteModalOverlay')) closeDeleteModal();
  });
}

function openDeleteModal(id, title) {
  deleteId = id;
  document.getElementById('deleteBookTitle').textContent = title;
  document.getElementById('deleteModalOverlay').classList.add('active');
}

function closeDeleteModal() {
  document.getElementById('deleteModalOverlay').classList.remove('active');
  deleteId = null;
}

async function confirmDelete() {
  if (!deleteId) return;

  const btn = document.getElementById('deleteConfirmBtn');
  const spinner = document.getElementById('deleteSpinner');
  const text = document.getElementById('deleteConfirmText');
  btn.disabled = true;
  spinner.style.display = 'block';
  text.style.display = 'none';

  try {
    const res = await apiFetch(`${BASE_URL}/admin/books/${deleteId}`, { method: 'DELETE' });
    if (!res) return;

    if (res.ok) {
      closeDeleteModal();
      loadBooks();
      showToast('Buku berhasil dihapus', 'success');
    } else {
      const data = await res.json();
      showToast(data.message ?? 'Gagal menghapus buku', 'error');
      closeDeleteModal();
    }
  } catch {
    showToast('Gagal menghapus buku', 'error');
    closeDeleteModal();
  } finally {
    btn.disabled = false;
    spinner.style.display = 'none';
    text.style.display = 'inline';
  }
}

// ── Toast Notification (Keep local for now) ──
function showToast(msg, type = 'success') {
  const existing = document.getElementById('toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    padding: 12px 20px; border-radius: 12px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    display: flex; align-items: center; gap: 10px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    animation: fadeUp 0.3s both;
    background: ${type === 'success' ? '#22c55e' : '#ff5050'};
    color: #fff;
  `;

  const icon = type === 'success'
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

  toast.innerHTML = icon + msg;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}