/**
 * ══════════════════════════════
 *   KELOLA PEMINJAMAN SCRIPT
 *   Heavenly Library — Manage Borrowing (Admin)
 * ══════════════════════════════
 */

const BASE_URL = CONFIG.API_BASE_URL;

// ── STATE ──
let currentPage   = 1;
let currentStatus = '';
let currentSearch = '';
let searchTimer   = null;
let pendingAction = null; // { type, id }

document.addEventListener('DOMContentLoaded', () => {
  // Shared: Auth check, Sidebar, Theme, Dropdown, Logout (dari common.js)
  initCommon();

  // Module-specific
  initStatusTabs();
  initSearch();
  loadBorrowings();
  initModals();
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

// ── SEARCH ──
function initSearch() {
  const input = document.getElementById('searchInput');
  const clear = document.getElementById('searchClear');
  if (!input || !clear) return;

  input.addEventListener('input', () => {
    clear.style.display = input.value ? 'flex' : 'none';
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentSearch = input.value.trim();
      currentPage = 1;
      loadBorrowings();
    }, 400);
  });

  clear.addEventListener('click', () => {
    input.value = '';
    clear.style.display = 'none';
    currentSearch = '';
    currentPage = 1;
    loadBorrowings();
  });
}

function showSkeleton() {
  const tbody = document.getElementById('tableBody');
  if (!tbody) return;
  tbody.innerHTML = Array(5).fill(`
    <tr class="skeleton-row"><td colspan="7"><div class="skeleton-line"></div></td></tr>
  `).join('');
}

// ── LOAD BORROWINGS ──
async function loadBorrowings() {
  showSkeleton();
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('pagination').innerHTML = '';

  const now = new Date();

  // Terlambat: fetch APPROVED, filter dueDate < sekarang di frontend
  if (currentStatus === 'OVERDUE') {
    const res = await apiFetch(`${BASE_URL}/admin/borrowing?page=1&limit=500&status=APPROVED`);
    if (!res) return;
    const json = await res.json();
    let all = (json.data ?? []).filter(b => new Date(b.dueDate) < now);

    // Filter search
    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      all = all.filter(b =>
        (b.user?.name ?? '').toLowerCase().includes(q) ||
        (b.book?.title ?? '').toLowerCase().includes(q)
      );
    }

    const totalItems = all.length;
    const limit = 10;
    const totalPages = Math.ceil(totalItems / limit);
    const paged = all.slice((currentPage - 1) * limit, currentPage * limit);

    document.getElementById('totalBadge').textContent = `${totalItems} peminjaman`;

    if (paged.length === 0) {
      document.getElementById('tableBody').innerHTML = '';
      document.getElementById('emptyState').style.display = 'flex';
      return;
    }

    renderTable(paged, true);
    renderPagination({ page: currentPage, totalPages, totalItems });
    return;
  }

  // Status lain: pakai API seperti biasa
  const params = new URLSearchParams({
    page: currentPage,
    limit: 10,
    ...(currentStatus && { status: currentStatus }),
    ...(currentSearch && { search: currentSearch }),
  });

  const res = await apiFetch(`${BASE_URL}/admin/borrowing?${params}`);
  if (!res) return;

  const json = await res.json();
  const borrowings = json.data ?? [];
  const meta = json.meta ?? {};

  document.getElementById('totalBadge').textContent = `${meta.totalItems ?? 0} peminjaman`;

  if (borrowings.length === 0) {
    document.getElementById('tableBody').innerHTML = '';
    document.getElementById('emptyState').style.display = 'flex';
    return;
  }

  renderTable(borrowings, false);
  renderPagination(meta);
}

// ── RENDER TABLE ──
// forceOverdue: true saat tab Terlambat — tampilkan badge Terlambat meski status APPROVED
function renderTable(borrowings, forceOverdue = false) {
  const now = new Date();
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = borrowings.map(b => {
    const initials = b.user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const borrowedDate = formatDate(b.borrowAt);
    const dueDate = formatDate(b.dueDate);
    const isOverdue = forceOverdue || (b.status === 'APPROVED' && new Date(b.dueDate) < now);
    const displayStatus = isOverdue ? 'OVERDUE' : b.status;

    return `
    <tr>
      <td>
        <div class="member-cell">
          <div class="member-avatar">${initials}</div>
          <div>
            <div class="member-name">${escHtml(b.user.name)}</div>
            <div class="member-email">${escHtml(b.user.email)}</div>
          </div>
        </div>
      </td>
      <td>
        <div class="book-cell">
          ${b.book.cover
            ? `<img class="book-thumb" src="${escHtml(b.book.cover)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
            : ''
          }
          <div class="book-thumb-placeholder" style="display:${b.book.cover ? 'none' : 'flex'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </div>
          <div>
            <div class="book-title" title="${escHtml(b.book.title)}">${escHtml(b.book.title)}</div>
            <div class="book-author">${escHtml(b.book.author)}</div>
          </div>
        </div>
      </td>
      <td>
        <div class="date-main">${borrowedDate}</div>
      </td>
      <td>
        <div class="date-main ${isOverdue ? 'date-overdue' : ''}">${dueDate}</div>
        ${isOverdue ? '<div class="date-sub date-overdue">Terlambat</div>' : ''}
      </td>
      <td>${renderStatusBadge(displayStatus)}</td>
      <td>
        ${b.fine > 0
          ? `<span class="fine-amount">Rp ${b.fine.toLocaleString('id-ID')}</span>`
          : `<span class="fine-none">—</span>`
        }
      </td>
      <td>
        <div class="action-btns">
          <button class="action-btn btn-detail" onclick="openDetail(${b.id})" title="Detail">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="10" r="7"/><path d="M10 9v4M10 7v.5"/></svg>
          </button>
          ${b.status === 'PENDING' ? `
            <button class="action-btn btn-approve" onclick="confirmAction('approve', ${b.id})" title="Setujui">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 10l4 4 8-8"/></svg>
            </button>
            <button class="action-btn btn-reject" onclick="confirmAction('reject', ${b.id})" title="Tolak">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/></svg>
            </button>
          ` : ''}
          ${b.status === 'APPROVED' || b.status === 'OVERDUE' ? `
            <button class="action-btn btn-return" onclick="confirmAction('return', ${b.id})" title="Kembalikan">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 10h12M10 4l-6 6 6 6"/></svg>
            </button>
          ` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ── RENDER STATUS BADGE ──
function renderStatusBadge(status) {
  const map = {
    PENDING:  ['badge-pending',  'Menunggu'],
    APPROVED: ['badge-approved', 'Disetujui'],
    OVERDUE:  ['badge-overdue',  'Terlambat'],
    RETURNED: ['badge-returned', 'Dikembalikan'],
    REJECTED: ['badge-rejected', 'Ditolak'],
  };
  const [cls, label] = map[status] ?? ['badge-pending', status];
  return `<span class="status-badge ${cls}"><span class="badge-dot"></span>${label}</span>`;
}

// ── DETAIL MODAL ──
async function openDetail(id) {
  const overlay = document.getElementById('detailModalOverlay');
  overlay.classList.add('active');
  document.getElementById('detailModalBody').innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted)">Memuat...</div>';
  document.getElementById('detailModalFooter').innerHTML = '';

  try {
    const res = await apiFetch(`${BASE_URL}/admin/borrowing/${id}`);
    if (!res || !res.ok) {
      document.getElementById('detailModalBody').innerHTML = '<div style="padding:20px;text-align:center;color:#ff5050">Gagal memuat data.</div>';
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
        <div class="detail-label">Informasi Buku</div>
        <div class="detail-book-card">
          ${b.book.cover
            ? `<img class="detail-book-cover" src="${escHtml(b.book.cover)}" alt="">`
            : `<div class="detail-book-cover" style="display:flex;align-items:center;justify-content:center;color:rgba(124,106,255,0.3)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>`
          }
          <div>
            <div class="detail-book-title">${escHtml(b.book.title)}</div>
            <div class="detail-book-author">${escHtml(b.book.author)}</div>
            <div style="margin-top:4px;font-size:11px;color:var(--text-muted)">ISBN: ${escHtml(b.book.isbn)}</div>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-label">Informasi Anggota</div>
        <div class="detail-row">
          <span class="detail-key">Nama</span>
          <span class="detail-val">${escHtml(b.user.name)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-key">Email</span>
          <span class="detail-val">${escHtml(b.user.email)}</span>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-label">Detail Peminjaman</div>
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
    `;

    // Footer action buttons
    const footer = document.getElementById('detailModalFooter');
    let btns = `<button class="modal-btn modal-btn--cancel" onclick="document.getElementById('detailModalOverlay').classList.remove('active')">Tutup</button>`;

    if (b.status === 'PENDING') {
      btns += `
        <button class="modal-btn modal-btn--reject" onclick="document.getElementById('detailModalOverlay').classList.remove('active');confirmAction('reject',${b.id})">Tolak</button>
        <button class="modal-btn modal-btn--approve" onclick="document.getElementById('detailModalOverlay').classList.remove('active');confirmAction('approve',${b.id})">Setujui</button>
      `;
    } else if (b.status === 'APPROVED' || b.status === 'OVERDUE') {
      btns += `<button class="modal-btn modal-btn--return" onclick="document.getElementById('detailModalOverlay').classList.remove('active');confirmAction('return',${b.id})">Kembalikan Buku</button>`;
    }

    footer.innerHTML = btns;

  } catch (e) {
    console.error(e);
    document.getElementById('detailModalBody').innerHTML = '<div style="padding:20px;text-align:center;color:#ff5050">Terjadi kesalahan sistem.</div>';
  }
}

// ── ACTION CONFIRM ──
function confirmAction(type, id) {
  pendingAction = { type, id };

  const icon        = document.getElementById('actionModalIcon');
  const title       = document.getElementById('actionModalTitle');
  const desc        = document.getElementById('actionModalDesc');
  const confirmBtn  = document.getElementById('actionConfirmBtn');
  const confirmText = document.getElementById('actionConfirmText');

  const configs = {
    approve: {
      iconClass: 'modal-icon--approve',
      iconSvg:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
      title:     'Setujui Peminjaman?',
      desc:      'Peminjaman akan disetujui dan stok buku akan berkurang.',
      btnClass:  'modal-btn--approve', btnText: 'Ya, Setujui'
    },
    reject: {
      iconClass: 'modal-icon--reject',
      iconSvg:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      title:     'Tolak Peminjaman?',
      desc:      'Peminjaman akan ditolak dan tidak dapat di-approve kembali.',
      btnClass:  'modal-btn--reject', btnText: 'Ya, Tolak'
    },
    return: {
      iconClass: 'modal-icon--return',
      iconSvg:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M9 6l-6 6 6 6"/></svg>',
      title:     'Konfirmasi Pengembalian?',
      desc:      'Buku akan ditandai dikembalikan. Denda otomatis dihitung jika terlambat.',
      btnClass:  'modal-btn--return', btnText: 'Ya, Kembalikan'
    },
  };

  const c = configs[type];
  icon.className        = `modal-icon ${c.iconClass}`;
  icon.innerHTML        = c.iconSvg;
  title.textContent     = c.title;
  desc.textContent      = c.desc;
  confirmBtn.className  = `modal-btn ${c.btnClass}`;
  confirmText.textContent = c.btnText;

  document.getElementById('actionModalOverlay').classList.add('active');
}

// ── EXECUTE ACTION ──
async function executeAction() {
  if (!pendingAction) return;
  const { type, id } = pendingAction;

  const spinner     = document.getElementById('actionSpinner');
  const confirmText = document.getElementById('actionConfirmText');
  spinner.style.display     = 'block';
  confirmText.style.display = 'none';

  const endpointMap = { approve: 'approve', reject: 'reject', return: 'return' };
  const res = await apiFetch(`${BASE_URL}/admin/borrowing/${id}/${endpointMap[type]}`, { method: 'PATCH' });

  spinner.style.display     = 'none';
  confirmText.style.display = 'block';

  document.getElementById('actionModalOverlay').classList.remove('active');
  pendingAction = null;

  if (res && res.ok) {
    const msgMap = { approve: 'Peminjaman disetujui', reject: 'Peminjaman ditolak', return: 'Buku berhasil dikembalikan' };
    showToast(msgMap[type], 'success');
    loadBorrowings();
  } else {
    const err = res ? await res.json() : {};
    showToast(err.message ?? 'Terjadi kesalahan', 'error');
  }
}

// ── MODAL INIT ──
function initModals() {
  // Detail modal
  document.getElementById('detailModalClose').addEventListener('click', () => {
    document.getElementById('detailModalOverlay').classList.remove('active');
  });
  document.getElementById('detailModalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('detailModalOverlay'))
      document.getElementById('detailModalOverlay').classList.remove('active');
  });

  // Action modal
  document.getElementById('actionCancelBtn').addEventListener('click', () => {
    document.getElementById('actionModalOverlay').classList.remove('active');
    pendingAction = null;
  });
  document.getElementById('actionConfirmBtn').addEventListener('click', executeAction);
  document.getElementById('actionModalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('actionModalOverlay')) {
      document.getElementById('actionModalOverlay').classList.remove('active');
      pendingAction = null;
    }
  });
}

// ── PAGINATION ──
function renderPagination(meta) {
  const { page, totalPages } = meta;
  if (!totalPages || totalPages <= 1) return;

  const container = document.getElementById('pagination');
  const pages = [];

  pages.push(`<button class="page-btn" ${page === 1 ? 'disabled' : ''} onclick="goPage(${page - 1})">←</button>`);
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(`<button class="page-btn ${i === page ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`);
    } else if (i === page - 2 || i === page + 2) {
      pages.push(`<button class="page-btn ellipsis">…</button>`);
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

// escHtml: alias lokal untuk kompatibilitas dengan template string di atas
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  const icon  = type === 'success'
    ? '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 10l4 4 8-8"/></svg>'
    : '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/></svg>';
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `${icon}<span>${escHtml(msg)}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}