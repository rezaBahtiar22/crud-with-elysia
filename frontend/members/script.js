/**
 * ══════════════════════════════
 *   MEMBERS MODULE SCRIPT
 *   Heavenly Library — Anggota (Admin)
 * ══════════════════════════════
 */

const BASE_URL = CONFIG.API_BASE_URL;

// ── STATE ──
let currentPage = 1;
let currentRole = '';
let searchQuery = '';
let searchTimer = null;
let allMembers = []; // cache semua data

document.addEventListener('DOMContentLoaded', () => {
  // Shared: Auth, Sidebar, Theme, Dropdown, Logout (dari common.js)
  initCommon();

  // Module-specific
  initTabs();
  initSearch();
  setDate();
  loadMembers();
});

function setDate() {
  const el = document.getElementById('membersDate');
  if (el) {
    el.textContent = new Date().toLocaleDateString('id-ID', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
  }
}

function initTabs() {
  document.querySelectorAll('.role-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentRole = tab.dataset.role;
      currentPage = 1;
      applyFilter();
    });
  });
}

function initSearch() {
  const input = document.getElementById('searchInput');
  const clear = document.getElementById('searchClear');
  if (!input || !clear) return;

  input.addEventListener('input', () => {
    searchQuery = input.value.trim();
    clear.style.display = searchQuery ? 'flex' : 'none';
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { currentPage = 1; applyFilter(); }, 300);
  });
  clear.addEventListener('click', () => {
    input.value = ''; searchQuery = '';
    clear.style.display = 'none';
    currentPage = 1; applyFilter();
  });
}

async function loadMembers() {
  if (allMembers.length === 0 || currentPage === 1 && searchQuery === '' && !window._roleChanged) {
    showSkeleton();
    const res = await apiFetch(`${BASE_URL}/admin/users?page=1&limit=500`);
    if (!res) return;
    const json = await res.json();
    allMembers = json.data ?? [];
  }
  window._roleChanged = false;
  applyFilter();
}

function applyFilter() {
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('pagination').innerHTML = '';

  // Filter role
  let filtered = currentRole
    ? allMembers.filter(u => u.role === currentRole)
    : allMembers;

  // Filter search (nama atau email)
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(u =>
      (u.name ?? '').toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q)
    );
  }

  const limit = 10;
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / limit);

  document.getElementById('totalBadge').textContent = `${totalItems} anggota`;

  if (filtered.length === 0) {
    document.getElementById('membersBody').innerHTML = '';
    document.getElementById('emptyState').style.display = 'flex';
    return;
  }

  // Pagination lokal
  const start = (currentPage - 1) * limit;
  const paged = filtered.slice(start, start + limit);

  renderRows(paged);
  renderPagination({ page: currentPage, totalPages, totalItems });
}

function showSkeleton() {
  const el = document.getElementById('membersBody');
  if (el) el.innerHTML = Array(5).fill(
    `<tr class="skeleton-row"><td colspan="4"><div class="skeleton-line"></div></td></tr>`
  ).join('');
}

function renderRows(data) {
  document.getElementById('membersBody').innerHTML = data.map((u, i) => {
    const initials = (u.name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const isAdmin = u.role === 'ADMIN';
    const colors = [
      'linear-gradient(135deg,#7c6aff,#c084fc)',
      'linear-gradient(135deg,#22c55e,#16a34a)',
      'linear-gradient(135deg,#f59e0b,#d97706)',
      'linear-gradient(135deg,#ec4899,#db2777)',
      'linear-gradient(135deg,#60a5fa,#3b82f6)',
    ];
    const color = colors[u.id % colors.length];

    return `<tr style="animation-delay:${i * 0.04}s">
      <td>
        <div class="member-cell">
          <div class="member-avatar" style="background:${color}">${initials}</div>
          <div>
            <div class="member-name">${escHtml(u.name ?? '—')}</div>
            <div class="member-id">#${u.id}</div>
          </div>
        </div>
      </td>
      <td class="email-cell">${escHtml(u.email ?? '—')}</td>
      <td>
        <span class="role-badge ${isAdmin ? 'role-admin' : 'role-user'}">
          <span class="role-dot"></span>${isAdmin ? 'Admin' : 'User'}
        </span>
      </td>
      <td class="date-cell">${formatDate(u.created_at)}</td>
    </tr>`;
  }).join('');
}

function renderPagination(meta) {
  const { page, totalPages } = meta;
  if (!totalPages || totalPages <= 1) return;
  const container = document.getElementById('pagination');
  if (!container) return;
  const pages = [];
  pages.push(`<button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="goPage(${page - 1})">←</button>`);
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(`<button class="page-btn ${i === page ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`);
    } else if (i === page - 2 || i === page + 2) {
      pages.push(`<button class="page-btn" style="cursor:default">…</button>`);
    }
  }
  pages.push(`<button class="page-btn" ${page >= totalPages ? 'disabled' : ''} onclick="goPage(${page + 1})">→</button>`);
  container.innerHTML = pages.join('');
}

function goPage(p) { currentPage = p; applyFilter(); }

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}