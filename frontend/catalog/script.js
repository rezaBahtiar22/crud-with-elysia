/**
 * ══════════════════════════════
 *   CATALOG MODULE SCRIPT
 *   Heavenly Library — Catalog
 * ══════════════════════════════
 */

const API_BASE = CONFIG.API_BASE_URL;

// ── State ──
let currentPage     = 1;
let currentLimit    = 20;
let currentSearch   = '';
let currentCategory = '';
let searchTimeout   = null;

// ══════════════════════════════
// FETCH BOOKS
// ══════════════════════════════
async function fetchBooks() {
  showSkeleton();
  document.getElementById('emptyState').style.display = 'none';

  const params = new URLSearchParams({
    page:  currentPage,
    limit: currentLimit,
    ...(currentSearch   && { search:   currentSearch }),
    ...(currentCategory && { category: currentCategory }),
  });

  // apiFetch dari common.js (auto-refresh token)
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

    const coverHTML = book.cover
      ? `<div class="book-cover"><img src="${escapeHtml(book.cover)}" alt="${escapeHtml(book.title)}" loading="lazy" onerror="this.parentElement.replaceWith(makePlaceholder('${escapeHtml(book.title)}'))"/></div>`
      : `<div class="book-cover-placeholder">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
           <span class="book-cover-placeholder-title">${escapeHtml(book.title)}</span>
         </div>`;

    card.innerHTML = `
      ${coverHTML}
      <div class="book-info">
        <div class="book-title">${escapeHtml(book.title)}</div>
        <div class="book-author">${escapeHtml(book.author)}</div>
        <div class="book-meta">
          ${book.category
            ? `<span class="book-category">${escapeHtml(book.category)}</span>`
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
    <span class="book-cover-placeholder-title">${escapeHtml(title)}</span>
  `;
  return div;
};

// ── Render pagination ──
function renderPagination(meta) {
  const container = document.getElementById('pagination');
  container.innerHTML = '';

  const totalPages = meta.totalPages || 1;
  const page       = meta.page       || 1;

  if (totalPages <= 1) return;

  const prev = makePageBtn('←', page === 1, () => {
    currentPage--;
    fetchBooks();
  });
  container.appendChild(prev);

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      const btn = makePageBtn(i, false, () => {
        currentPage = i;
        fetchBooks();
      });
      if (i === page) btn.classList.add('active');
      container.appendChild(btn);
    } else if (Math.abs(i - page) === 2) {
      const dots = document.createElement('span');
      dots.textContent = '…';
      dots.style.cssText = 'color:var(--text-muted);padding:0 4px;font-size:14px;line-height:36px;';
      container.appendChild(dots);
    }
  }

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

function selectCategory(val) {
  currentCategory = val;
  const label = document.getElementById('selectedCategoryLabel');
  label.textContent = val || 'Semua Kategori';

  // UI Active state
  document.querySelectorAll('.select-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.value === val);
  });

  document.getElementById('categoryDropdown').classList.remove('active');
  currentPage = 1;
  fetchBooks();
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
  const input    = document.getElementById('searchInput');
  const clear    = document.getElementById('searchClear');
  const dropdown = document.getElementById('categoryDropdown');
  const trigger  = document.getElementById('categoryTrigger');

  // Toggle dropdown
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('active');
  });

  // Close dropdown on outside click
  document.addEventListener('click', () => {
    dropdown.classList.remove('active');
  });

  // Default "Semua Kategori" option
  const allOpt = document.querySelector('.select-option[data-value=""]');
  if (allOpt) {
    allOpt.addEventListener('click', () => selectCategory(''));
  }

  input.addEventListener('input', () => {
    currentSearch = input.value.trim();
    clear.classList.toggle('visible', currentSearch.length > 0);

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentPage = 1;
      fetchBooks();
    }, 400);
  });

  clear.addEventListener('click', () => {
    input.value   = '';
    currentSearch = '';
    clear.classList.remove('visible');
    currentPage = 1;
    fetchBooks();
  });
}

// ══════════════════════════════
// INIT
// ══════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Shared UI (Auth, Sidebar, Theme, Dropdown, Logout) dari common.js
  initCommon();

  // Catalog-specific
  initSearchFilter();
  fetchBooks();
});