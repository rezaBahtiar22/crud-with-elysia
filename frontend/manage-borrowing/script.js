const BASE_URL = 'http://localhost:3000';

// ── AUTH ──
function getToken() {
  const u = JSON.parse(localStorage.getItem('userData') ?? '{}');
  return u.accessToken ?? u.token ?? u.access_token ?? '';
}

function checkAuth() {
  const userData = JSON.parse(localStorage.getItem('userData') ?? '{}');
  const token = userData.accessToken ?? userData.token ?? userData.access_token ?? '';
  if (!token) { location.href = '../form-login/index.html'; return; }
  const role = (userData.role ?? '').toUpperCase();
  if (role !== 'ADMIN') { location.href = '../dashboard/index.html'; }
}

async function fetchWithAuth(url, options = {}) {
  const token = getToken();
  if (!token) { location.href = '../form-login/index.html'; return null; }
  return fetch(url, {
    ...options,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(options.headers ?? {}) }
  });
}

// ── INIT ──
let currentPage = 1;
let currentStatus = '';
let currentSearch = '';
let searchTimer = null;
let pendingAction = null; // { type, id, borrowing }

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadUserInfo();
  initSidebar();
  initTheme();
  initStatusTabs();
  initSearch();
  loadBorrowings();
  initModals();
});

// ── USER INFO ──
function loadUserInfo() {
  const userData = JSON.parse(localStorage.getItem('userData') ?? '{}');
  const name = userData.name ?? '?';
  const role = userData.role ?? '—';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  document.getElementById('userAvatar').textContent = initials;
  document.getElementById('userName').textContent = name;
  document.getElementById('userRole').textContent = role;
  document.getElementById('dropdownAvatar').textContent = initials;
  document.getElementById('dropdownName').textContent = name;
  document.getElementById('dropdownEmail').textContent = userData.email ?? '—';
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

  document.getElementById('logoutBtn').addEventListener('click', () => {
    document.getElementById('logoutModal').classList.add('active');
  });
  document.getElementById('logoutCancel').addEventListener('click', () => {
    document.getElementById('logoutModal').classList.remove('active');
  });
  document.getElementById('logoutConfirm').addEventListener('click', () => {
    localStorage.removeItem('userData');
    location.href = '../form-login/index.html';
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

// ── SEARCH ──
function initSearch() {
  const input = document.getElementById('searchInput');
  const clear = document.getElementById('searchClear');

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

// ── LOAD BORROWINGS ──
async function loadBorrowings() {
  showSkeleton();
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('pagination').innerHTML = '';

  const params = new URLSearchParams({
    page: currentPage,
    limit: 10,
    ...(currentStatus && { status: currentStatus }),
    ...(currentSearch && { search: currentSearch }),
  });

  const res = await fetchWithAuth(`${BASE_URL}/admin/borrowing?${params}`);
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

  renderTable(borrowings);
  renderPagination(meta);
}

function showSkeleton() {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = Array(5).fill(`
    <tr class="skeleton-row"><td colspan="7"><div class="skeleton-line"></div></td></tr>
  `).join('');
}

// ── RENDER TABLE ──
function renderTable(borrowings) {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = borrowings.map(b => {
    const initials = b.user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const borrowedDate = formatDate(b.borrowedAt);
    const dueDate = formatDate(b.dueDate);
    const isOverdue = b.status === 'APPROVED' && new Date(b.dueDate) < new Date();

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
      <td>${renderStatusBadge(b.status)}</td>
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

  const res = await fetchWithAuth(`${BASE_URL}/admin/borrowing/${id}`);
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
        <span class="detail-val">${formatDateFull(b.borrowedAt)}</span>
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
}

// ── ACTION CONFIRM ──
function confirmAction(type, id) {
  pendingAction = { type, id };

  const icon = document.getElementById('actionModalIcon');
  const title = document.getElementById('actionModalTitle');
  const desc = document.getElementById('actionModalDesc');
  const confirmBtn = document.getElementById('actionConfirmBtn');
  const confirmText = document.getElementById('actionConfirmText');

  const config = {
    approve: {
      iconClass: 'modal-icon--approve',
      iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
      title: 'Setujui Peminjaman?',
      desc: 'Peminjaman akan disetujui dan stok buku akan berkurang.',
      btnClass: 'modal-btn--approve', btnText: 'Ya, Setujui'
    },
    reject: {
      iconClass: 'modal-icon--reject',
      iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      title: 'Tolak Peminjaman?',
      desc: 'Peminjaman akan ditolak dan tidak dapat di-approve kembali.',
      btnClass: 'modal-btn--reject', btnText: 'Ya, Tolak'
    },
    return: {
      iconClass: 'modal-icon--return',
      iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M9 6l-6 6 6 6"/></svg>',
      title: 'Konfirmasi Pengembalian?',
      desc: 'Buku akan ditandai dikembalikan. Denda otomatis dihitung jika terlambat.',
      btnClass: 'modal-btn--return', btnText: 'Ya, Kembalikan'
    },
  };

  const c = config[type];
  icon.className = `modal-icon ${c.iconClass}`;
  icon.innerHTML = c.iconSvg;
  title.textContent = c.title;
  desc.textContent = c.desc;
  confirmBtn.className = `modal-btn ${c.btnClass}`;
  confirmText.textContent = c.btnText;

  document.getElementById('actionModalOverlay').classList.add('active');
}

// ── EXECUTE ACTION ──
async function executeAction() {
  if (!pendingAction) return;
  const { type, id } = pendingAction;

  const spinner = document.getElementById('actionSpinner');
  const confirmText = document.getElementById('actionConfirmText');
  spinner.style.display = 'block';
  confirmText.style.display = 'none';

  const endpointMap = { approve: 'approve', reject: 'reject', return: 'return' };
  const res = await fetchWithAuth(`${BASE_URL}/admin/borrowing/${id}/${endpointMap[type]}`, { method: 'PATCH' });

  spinner.style.display = 'none';
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
  document.getElementById('detailModalClose').addEventListener('click', () => {
    document.getElementById('detailModalOverlay').classList.remove('active');
  });
  document.getElementById('detailModalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('detailModalOverlay'))
      document.getElementById('detailModalOverlay').classList.remove('active');
  });

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
  if (totalPages <= 1) return;

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

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
  setTimeout(() => toast.remove(), 3500);
}