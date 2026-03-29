const BASE_URL = 'http://localhost:3000';
let borrowChart = null;

function getToken() {
  const u = JSON.parse(localStorage.getItem('userData') ?? '{}');
  return u.accessToken ?? u.token ?? u.access_token ?? '';
}
function checkAuth() { if (!getToken()) location.href = '../form-login/index.html'; }
async function fetchWithAuth(url, options = {}) {
  const token = getToken();
  if (!token) { location.href = '../form-login/index.html'; return null; }
  try {
    return await fetch(url, {
      ...options,
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(options.headers ?? {}) }
    });
  } catch { return null; }
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  initTheme();
  initSidebar();
  loadUserInfo();
  setGreeting();
  setDate();
});

function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light') { document.body.classList.add('light'); document.getElementById('themeKnob').textContent = '☀️'; }
  document.getElementById('themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('light');
    const isLight = document.body.classList.contains('light');
    document.getElementById('themeKnob').textContent = isLight ? '☀️' : '🌙';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    if (borrowChart) updateChartTheme();
  });
}

function initSidebar() {
  if (localStorage.getItem('sidebarCollapsed') === 'true') document.body.classList.add('collapsed');
  document.getElementById('toggleBtn').addEventListener('click', () => {
    document.body.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', document.body.classList.contains('collapsed'));
  });
  const userCard = document.getElementById('userCard');
  const dropdown = document.getElementById('userDropdown');
  userCard.addEventListener('click', () => { userCard.classList.toggle('open'); dropdown.classList.toggle('open'); });
  document.addEventListener('click', e => {
    if (!userCard.contains(e.target) && !dropdown.contains(e.target)) {
      userCard.classList.remove('open'); dropdown.classList.remove('open');
    }
  });
  document.getElementById('logoutBtn').addEventListener('click', () => document.getElementById('logoutModal').classList.add('active'));
  document.getElementById('logoutCancel').addEventListener('click', () => document.getElementById('logoutModal').classList.remove('active'));
  document.getElementById('logoutConfirm').addEventListener('click', () => { localStorage.removeItem('userData'); location.href = '../form-login/index.html'; });
}

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
  document.getElementById('dashName').textContent = name;

  if (role !== 'ADMIN') {
    document.querySelectorAll('.nav-admin').forEach(el => el.style.display = 'none');
    document.getElementById('dashSubtitle').textContent = 'Pantau aktivitas peminjaman Anda';
    document.getElementById('userContent').style.display = 'block';
    loadUserDashboard();
  } else {
    document.getElementById('dashSubtitle').textContent = 'Ringkasan aktivitas perpustakaan';
    document.getElementById('adminContent').style.display = 'block';
    loadAdminDashboard();
  }
}

function setGreeting() {
  const h = new Date().getHours();
  document.getElementById('dashGreeting').textContent =
    h < 11 ? 'Selamat Pagi' : h < 15 ? 'Selamat Siang' : h < 18 ? 'Selamat Sore' : 'Selamat Malam';
}

function setDate() {
  document.getElementById('dashDate').textContent = new Date().toLocaleDateString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
}

/* ══════════════════════════════
   ADMIN DASHBOARD
══════════════════════════════ */
async function loadAdminDashboard() {
  await Promise.all([
    loadAdminStats(),
    loadAdminChart(),
    loadAdminDueSoon(),
    loadTopBooks(),
    loadAdminPending(),
  ]);
}

async function loadAdminStats() {
  try {
    const [booksRes, borrowRes, pendingRes] = await Promise.all([
      fetchWithAuth(`${BASE_URL}/admin/books?page=1&limit=1`),
      fetchWithAuth(`${BASE_URL}/admin/borrowing?status=APPROVED&page=1&limit=500`),
      fetchWithAuth(`${BASE_URL}/admin/borrowing?status=PENDING&page=1&limit=1`),
    ]);

    // Total buku
    if (booksRes?.ok) {
      booksRes.json().then(d => {
        document.getElementById('aTotalBuku').textContent = d.meta?.totalItems ?? '—';
      });
    }

    // Pending
    if (pendingRes?.ok) {
      pendingRes.json().then(d => {
        document.getElementById('aPending').textContent = d.meta?.totalItems ?? '—';
      });
    }

    // Aktif & Terlambat — hitung dari data APPROVED
    if (borrowRes?.ok) {
      const json = await borrowRes.json();
      const all = json.data ?? [];
      const now = new Date();

      const terlambat = all.filter(b => new Date(b.dueDate) < now);
      const aktif     = all.filter(b => new Date(b.dueDate) >= now);

      document.getElementById('aAktif').textContent     = aktif.length;
      document.getElementById('aTerlambat').textContent = terlambat.length;
    }

  } catch(e) { console.error(e); }
}

/* ── Line Chart 3 Bulan ── */
async function loadAdminChart() {
  const now = new Date();
  const months = [], labels = [];
  const mn = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() });
    labels.push(`${mn[d.getMonth()]} ${d.getFullYear()}`);
  }
  try {
    const res = await fetchWithAuth(`${BASE_URL}/admin/borrowing?page=1&limit=500`);
    if (!res?.ok) { renderChart(labels, [0,0,0]); return; }
    const json = await res.json();
    const all = json.data ?? [];
    const counts = months.map(({ year, month }) =>
      all.filter(b => {
        const d = new Date(b.borrowAt ?? b.created_at);
        return d.getFullYear() === year && d.getMonth() === month;
      }).length
    );
    renderChart(labels, counts);
  } catch { renderChart(labels, [0,0,0]); }
}

function getChartColors() {
  const isLight = document.body.classList.contains('light');
  return {
    gridColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
    textColor: isLight ? '#8888a0' : '#7a7890',
    tooltipBg: isLight ? '#ffffff' : '#1a1a26',
    tooltipTitle: isLight ? '#1a1a2e' : '#f0eff8',
    tooltipBorder: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(124,106,255,0.3)',
    lineColor: '#7c6aff',
    fillStart: 'rgba(124,106,255,0.3)',
    fillEnd: 'rgba(124,106,255,0)',
    pointColor: '#7c6aff',
    pointHover: '#c084fc',
  };
}

function renderChart(labels, data) {
  const c = getChartColors();
  const ctx = document.getElementById('borrowChart').getContext('2d');
  if (borrowChart) borrowChart.destroy();

  const gradient = ctx.createLinearGradient(0, 0, 0, 220);
  gradient.addColorStop(0, c.fillStart);
  gradient.addColorStop(1, c.fillEnd);

  borrowChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Peminjaman',
        data,
        borderColor: c.lineColor,
        borderWidth: 2.5,
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: c.pointColor,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: c.pointHover,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: c.tooltipBg,
          titleColor: c.tooltipTitle,
          bodyColor: c.textColor,
          borderColor: c.tooltipBorder,
          borderWidth: 1,
          padding: 12,
          cornerRadius: 10,
          callbacks: { label: ctx => `  ${ctx.parsed.y} peminjaman` }
        }
      },
      scales: {
        x: {
          grid: { color: c.gridColor, drawBorder: false },
          ticks: { color: c.textColor, font: { family: 'DM Sans', size: 11 } },
          border: { display: false }
        },
        y: {
          beginAtZero: true,
          grid: { color: c.gridColor, drawBorder: false },
          ticks: { color: c.textColor, font: { family: 'DM Sans', size: 11 }, stepSize: 1, padding: 8 },
          border: { display: false }
        }
      }
    }
  });
}

function updateChartTheme() {
  if (!borrowChart) return;
  const c = getChartColors();
  const ctx = document.getElementById('borrowChart').getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 220);
  gradient.addColorStop(0, c.fillStart);
  gradient.addColorStop(1, c.fillEnd);
  borrowChart.data.datasets[0].backgroundColor = gradient;
  borrowChart.options.scales.x.grid.color = c.gridColor;
  borrowChart.options.scales.x.ticks.color = c.textColor;
  borrowChart.options.scales.y.grid.color = c.gridColor;
  borrowChart.options.scales.y.ticks.color = c.textColor;
  borrowChart.options.plugins.tooltip.backgroundColor = c.tooltipBg;
  borrowChart.options.plugins.tooltip.titleColor = c.tooltipTitle;
  borrowChart.options.plugins.tooltip.borderColor = c.tooltipBorder;
  borrowChart.update();
}

/* ── Jatuh Tempo 3 Hari ── */
async function loadAdminDueSoon() {
  const el = document.getElementById('adminDueSoonList');
  try {
    const res = await fetchWithAuth(`${BASE_URL}/admin/borrowing?status=APPROVED&page=1&limit=50`);
    if (!res?.ok) { el.innerHTML = emptyHtml('Gagal memuat data'); return; }
    const json = await res.json();
    const now = new Date();
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const list = (json.data ?? [])
      .filter(b => new Date(b.dueDate) <= threeDays)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);

    if (list.length === 0) {
      el.innerHTML = `<div class="dash-empty-green">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="20 6 9 17 4 12"/></svg>
        <span>Tidak ada yang jatuh tempo dalam 3 hari</span>
      </div>`;
      return;
    }

    el.innerHTML = list.map(b => {
      const diff = Math.ceil((new Date(b.dueDate) - now) / 86400000);
      const isOverdue = diff < 0;
      const label = isOverdue ? `${Math.abs(diff)} hari terlambat` : diff === 0 ? 'Hari ini' : `${diff} hari lagi`;
      return `<div class="dash-row">
        ${coverHtml(b.book?.cover)}
        <div class="dash-row-info">
          <div class="dash-row-title">${escHtml(b.book?.title ?? '—')}</div>
          <div class="dash-row-sub">${escHtml(b.user?.name ?? '—')}</div>
        </div>
        <div class="dash-row-right">
          <span class="dash-badge ${isOverdue ? 'badge-overdue' : 'badge-due'}">${isOverdue ? 'Terlambat' : 'Segera'}</span>
          <span class="dash-row-date ${isOverdue ? 'txt-red' : 'txt-yellow'}">${label}</span>
        </div>
      </div>`;
    }).join('');
  } catch { el.innerHTML = emptyHtml('Gagal memuat data'); }
}

/* ── Top 5 Buku ── */
async function loadTopBooks() {
  const el = document.getElementById('topBooksList');
  try {
    const res = await fetchWithAuth(`${BASE_URL}/admin/borrowing?page=1&limit=500`);
    if (!res?.ok) { el.innerHTML = emptyHtml('Gagal memuat data'); return; }
    const json = await res.json();
    const freq = {};
    (json.data ?? []).forEach(b => {
      const id = b.book?.id; if (!id) return;
      if (!freq[id]) freq[id] = { book: b.book, count: 0 };
      freq[id].count++;
    });
    const top = Object.values(freq).sort((a, b) => b.count - a.count).slice(0, 5);
    if (top.length === 0) { el.innerHTML = emptyHtml('Belum ada data'); return; }

    const maxCount = top[0].count || 1;
    el.innerHTML = top.map((item, i) => {
      const pct = Math.round((item.count / maxCount) * 100);
      const rankColors = ['#f59e0b','#9ca3af','#b4783c','#7a7890','#7a7890'];
      return `<div class="top-book-row">
        <div class="top-rank" style="color:${rankColors[i]};border-color:${rankColors[i]}20">${i + 1}</div>
        ${coverHtml(item.book?.cover)}
        <div class="dash-row-info">
          <div class="dash-row-title">${escHtml(item.book?.title ?? '—')}</div>
          <div class="top-bar-wrap">
            <div class="top-bar"><div class="top-bar-fill" style="width:${pct}%"></div></div>
            <span class="top-count">${item.count}×</span>
          </div>
        </div>
      </div>`;
    }).join('');
  } catch { el.innerHTML = emptyHtml('Gagal memuat data'); }
}

/* ── Pending ── */
async function loadAdminPending() {
  const el = document.getElementById('adminPendingList');
  try {
    const res = await fetchWithAuth(`${BASE_URL}/admin/borrowing?status=PENDING&page=1&limit=5`);
    if (!res?.ok) { el.innerHTML = emptyHtml('Gagal memuat data'); return; }
    const json = await res.json();
    const list = json.data ?? [];
    if (list.length === 0) { el.innerHTML = emptyHtml('Tidak ada peminjaman pending'); return; }
    el.innerHTML = list.map(b => `<div class="dash-row">
      ${coverHtml(b.book?.cover)}
      <div class="dash-row-info">
        <div class="dash-row-title">${escHtml(b.book?.title ?? '—')}</div>
        <div class="dash-row-sub">${escHtml(b.user?.name ?? '—')}</div>
      </div>
      <div class="dash-row-right">
        <span class="dash-badge badge-pending">Menunggu</span>
        <span class="dash-row-date">${formatDate(b.borrowAt)}</span>
      </div>
    </div>`).join('');
  } catch { el.innerHTML = emptyHtml('Gagal memuat data'); }
}

/* ══════════════════════════════
   USER DASHBOARD
══════════════════════════════ */
async function loadUserDashboard() {
  await Promise.all([loadUserStats(), loadUserActive(), loadUserRecommend()]);
}

async function loadUserStats() {
  try {
    const [aRes, pRes, rRes] = await Promise.all([
      fetchWithAuth(`${BASE_URL}/borrowing?status=APPROVED&page=1&limit=1`),
      fetchWithAuth(`${BASE_URL}/borrowing?status=PENDING&page=1&limit=1`),
      fetchWithAuth(`${BASE_URL}/borrowing?status=RETURNED&page=1&limit=1`),
    ]);
    const set = (id, res) => res?.ok && res.json().then(d => { document.getElementById(id).textContent = d.meta?.totalItems ?? '—'; });
    set('uAktif', aRes); set('uPending', pRes); set('uSelesai', rRes);
  } catch(e) { console.error(e); }
}

async function loadUserActive() {
  const el = document.getElementById('userActiveList');
  try {
    const res = await fetchWithAuth(`${BASE_URL}/borrowing?status=APPROVED&page=1&limit=3`);
    if (!res?.ok) { el.innerHTML = emptyHtml('Gagal memuat data'); return; }
    const list = (await res.json()).data ?? [];
    if (list.length === 0) { el.innerHTML = emptyHtml('Tidak ada peminjaman aktif'); return; }
    const now = new Date();
    el.innerHTML = list.map(b => {
      const diff = Math.ceil((new Date(b.dueDate) - now) / 86400000);
      const isOverdue = diff < 0;
      return `<div class="dash-row">
        ${coverHtml(b.book?.cover)}
        <div class="dash-row-info">
          <div class="dash-row-title">${escHtml(b.book?.title ?? '—')}</div>
          <div class="dash-row-sub">${escHtml(b.book?.author ?? '—')}</div>
        </div>
        <div class="dash-row-right">
          <span class="dash-badge ${isOverdue ? 'badge-overdue' : 'badge-approved'}">${isOverdue ? 'Terlambat' : 'Aktif'}</span>
          <span class="dash-row-date ${isOverdue ? 'txt-red' : ''}">
            ${isOverdue ? `${Math.abs(diff)} hari terlambat` : diff === 0 ? 'Hari ini' : `${diff} hari lagi`}
          </span>
        </div>
      </div>`;
    }).join('');
  } catch { el.innerHTML = emptyHtml('Gagal memuat data'); }
}

async function loadUserRecommend() {
  const el = document.getElementById('userRecommendList');
  try {
    const histRes = await fetchWithAuth(`${BASE_URL}/borrowing?page=1&limit=30`);
    if (!histRes?.ok) { el.innerHTML = emptyHtml('Gagal memuat rekomendasi'); return; }
    const history = (await histRes.json()).data ?? [];
    const borrowedIds = new Set(history.map(b => b.book?.id).filter(Boolean));
    const catFreq = {};
    history.forEach(b => { const c = b.book?.category; if (c) catFreq[c] = (catFreq[c] ?? 0) + 1; });
    const topCats = Object.entries(catFreq).sort((a,b) => b[1]-a[1]).slice(0,2).map(([c]) => c);

    let books = [];
    if (topCats.length > 0) {
      const r = await fetchWithAuth(`${BASE_URL}/books?page=1&limit=20&category=${encodeURIComponent(topCats[0])}`);
      if (r?.ok) books = (await r.json()).data ?? [];
    }
    if (books.length < 3 && topCats[1]) {
      const r2 = await fetchWithAuth(`${BASE_URL}/books?page=1&limit=10&category=${encodeURIComponent(topCats[1])}`);
      if (r2?.ok) books = [...books, ...(await r2.json()).data ?? []];
    }
    if (books.length === 0) {
      const r = await fetchWithAuth(`${BASE_URL}/books?page=1&limit=10`);
      if (r?.ok) books = (await r.json()).data ?? [];
    }

    books = books.filter(b => !borrowedIds.has(b.id)).slice(0, 5);
    if (books.length === 0) { el.innerHTML = emptyHtml('Belum ada rekomendasi'); return; }

    el.innerHTML = books.map(b => `
      <div class="dash-row" onclick="location.href='../catalog/index.html'" style="cursor:pointer">
        ${coverHtml(b.cover)}
        <div class="dash-row-info">
          <div class="dash-row-title">${escHtml(b.title ?? '—')}</div>
          <div class="dash-row-sub">${escHtml(b.author ?? '—')}</div>
        </div>
        <div class="dash-row-right">
          <span class="cat-badge">${escHtml(b.category ?? '—')}</span>
          <span class="dash-row-date ${b.availableStock > 0 ? 'txt-green' : 'txt-red'}">
            ${b.availableStock > 0 ? `✓ ${b.availableStock} tersedia` : '✗ Habis'}
          </span>
        </div>
      </div>`).join('');
  } catch { el.innerHTML = emptyHtml('Gagal memuat rekomendasi'); }
}

/* ── Helpers ── */
function coverHtml(src) {
  if (!src) return '<div class="dash-row-cover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>';
  return '<div class="dash-row-cover"><img src="' + escHtml(src) + '" alt="" loading="lazy" onload="this.style.opacity=1" onerror="this.parentElement.classList.add(\'cover-err\')" style="opacity:0;transition:opacity 0.2s"></div>';
}
function emptyHtml(msg) {
  return '<div class="dash-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 5V3M16 5V3"/></svg><span class="dash-empty-text">' + msg + '</span></div>';
}
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}