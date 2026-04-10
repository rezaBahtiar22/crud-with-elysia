const BASE_URL = 'http://localhost:3000';
let trendChart = null;
let statusChart = null;

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
  loadPage();
});

function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light') { document.body.classList.add('light'); document.getElementById('themeKnob').textContent = '☀️'; }
  document.getElementById('themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('light');
    const isLight = document.body.classList.contains('light');
    document.getElementById('themeKnob').textContent = isLight ? '☀️' : '🌙';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    if (trendChart) updateChartTheme();
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

function loadPage() {
  const userData = JSON.parse(localStorage.getItem('userData') ?? '{}');
  const name = userData.name ?? '?';
  const role = (userData.role ?? '').toUpperCase();
  const isAdmin = role === 'ADMIN';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  document.getElementById('userAvatar').textContent = initials;
  document.getElementById('userName').textContent = name;
  document.getElementById('userRole').textContent = isAdmin ? 'Admin' : 'User';
  document.getElementById('dropdownAvatar').textContent = initials;
  document.getElementById('dropdownName').textContent = name;
  document.getElementById('dropdownEmail').textContent = userData.email ?? '—';

  if (!isAdmin) document.querySelectorAll('.nav-admin').forEach(el => el.style.display = 'none');

  const dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  if (isAdmin) {
    document.getElementById('adminView').style.display = 'flex';
    document.getElementById('adminDate').textContent = dateStr;
    loadAdminHistory();
  } else {
    document.getElementById('userView').style.display = 'flex';
    document.getElementById('userDate').textContent = dateStr;
    document.getElementById('userSubtitle').textContent = `Perjalanan membaca ${name}`;
    loadUserHistory(name);
  }
}

/* ══════════════════════════════
   ADMIN — Analytics
══════════════════════════════ */
async function loadAdminHistory() {
  const res = await fetchWithAuth(`${BASE_URL}/admin/borrowing?page=1&limit=500`);
  if (!res?.ok) return;
  const json = await res.json();
  const all = json.data ?? [];

  // Stat cards
  const byStatus = {};
  all.forEach(b => byStatus[b.status] = (byStatus[b.status] ?? 0) + 1);
  const totalDenda = all.reduce((s, b) => s + (b.fine ?? 0), 0);

  document.getElementById('aTotalTx').textContent = all.length;
  document.getElementById('aReturned').textContent = byStatus.RETURNED ?? 0;
  document.getElementById('aRejected').textContent = byStatus.REJECTED ?? 0;
  document.getElementById('aTotalDenda').textContent = totalDenda > 0
    ? `Rp ${totalDenda.toLocaleString('id-ID')}`
    : 'Rp 0';

  // Charts
  renderTrendChart(all);
  renderStatusChart(byStatus);

  // Top users
  renderTopUsers(all);

  // Top books
  renderTopBooks(all);
}

function getChartColors() {
  const isLight = document.body.classList.contains('light');
  return {
    grid: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
    text: isLight ? '#8888a0' : '#7a7890',
    tooltipBg: isLight ? '#fff' : '#1a1a26',
    tooltipTitle: isLight ? '#1a1a2e' : '#f0eff8',
    tooltipBorder: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(124,106,255,0.3)',
  };
}

function renderTrendChart(all) {
  const now = new Date();
  const mn = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
  const months = [], labels = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() });
    labels.push(`${mn[d.getMonth()]} ${d.getFullYear()}`);
  }
  const counts = months.map(({ year, month }) =>
    all.filter(b => {
      const d = new Date(b.borrowAt ?? b.created_at);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length
  );

  const c = getChartColors();
  const ctx = document.getElementById('adminTrendChart').getContext('2d');
  if (trendChart) trendChart.destroy();

  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, 'rgba(124,106,255,0.3)');
  gradient.addColorStop(1, 'rgba(124,106,255,0)');

  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Peminjaman',
        data: counts,
        borderColor: '#7c6aff',
        borderWidth: 2.5,
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#7c6aff',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: c.tooltipBg, titleColor: c.tooltipTitle, bodyColor: c.text, borderColor: c.tooltipBorder, borderWidth: 1, padding: 12, cornerRadius: 10, callbacks: { label: ctx => `  ${ctx.parsed.y} peminjaman` } }
      },
      scales: {
        x: { grid: { color: c.grid }, ticks: { color: c.text, font: { family: 'DM Sans', size: 11 } }, border: { display: false } },
        y: { beginAtZero: true, grid: { color: c.grid }, ticks: { color: c.text, font: { family: 'DM Sans', size: 11 }, stepSize: 1, padding: 8 }, border: { display: false } }
      }
    }
  });
}

function renderStatusChart(byStatus) {
  const labels = ['Aktif', 'Dikembalikan', 'Menunggu', 'Terlambat', 'Ditolak'];
  const keys   = ['APPROVED', 'RETURNED', 'PENDING', 'OVERDUE', 'REJECTED'];
  const colors = ['#22c55e', '#7a7890', '#f59e0b', '#ff5050', '#ef4444'];
  const data   = keys.map(k => byStatus[k] ?? 0);
  const total  = data.reduce((s, v) => s + v, 0);

  const ctx = document.getElementById('adminStatusChart').getContext('2d');
  if (statusChart) statusChart.destroy();

  statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }]
    },
    options: {
      responsive: false,
      cutout: '70%',
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} (${total > 0 ? Math.round(ctx.parsed / total * 100) : 0}%)` } } }
    }
  });

  // Legend
  const legend = document.getElementById('donutLegend');
  legend.innerHTML = labels.map((l, i) => `
    <div class="donut-legend-item">
      <div class="donut-legend-left">
        <div class="donut-legend-dot" style="background:${colors[i]}"></div>
        <span class="donut-legend-label">${l}</span>
      </div>
      <span class="donut-legend-val">${data[i]}</span>
    </div>
  `).join('');
}

function renderTopUsers(all) {
  const el = document.getElementById('topUsersList');
  const freq = {};
  all.forEach(b => {
    const id = b.user?.id; if (!id) return;
    if (!freq[id]) freq[id] = { user: b.user, count: 0 };
    freq[id].count++;
  });
  const top = Object.values(freq).sort((a, b) => b.count - a.count).slice(0, 5);
  if (top.length === 0) { el.innerHTML = emptyRow('Belum ada data'); return; }

  el.innerHTML = top.map((item, i) => {
    const initials = (item.user.name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const rankClass = ['rank-1','rank-2','rank-3','rank-other','rank-other'][i];
    return `<div class="list-row">
      <div class="list-rank ${rankClass}">${i + 1}</div>
      <div class="list-avatar">${initials}</div>
      <div class="list-info">
        <div class="list-title">${escHtml(item.user.name ?? '—')}</div>
        <div class="list-sub">${escHtml(item.user.email ?? '—')}</div>
      </div>
      <div class="list-count">${item.count}× pinjam</div>
    </div>`;
  }).join('');
}

function renderTopBooks(all) {
  const el = document.getElementById('topBooksListH');
  const freq = {};
  all.forEach(b => {
    const id = b.book?.id; if (!id) return;
    if (!freq[id]) freq[id] = { book: b.book, count: 0 };
    freq[id].count++;
  });
  const top = Object.values(freq).sort((a, b) => b.count - a.count).slice(0, 5);
  if (top.length === 0) { el.innerHTML = emptyRow('Belum ada data'); return; }

  el.innerHTML = top.map((item, i) => {
    const rankClass = ['rank-1','rank-2','rank-3','rank-other','rank-other'][i];
    return `<div class="list-row">
      <div class="list-rank ${rankClass}">${i + 1}</div>
      <div class="list-cover">
        ${item.book.cover
          ? `<img src="${escHtml(item.book.cover)}" alt="" onerror="this.style.display='none'">`
          : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`
        }
      </div>
      <div class="list-info">
        <div class="list-title">${escHtml(item.book.title ?? '—')}</div>
        <div class="list-sub">${escHtml(item.book.author ?? '—')}</div>
      </div>
      <div class="list-count">${item.count}× dipinjam</div>
    </div>`;
  }).join('');
}

function updateChartTheme() {
  if (!trendChart) return;
  const c = getChartColors();
  const ctx = document.getElementById('adminTrendChart').getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, 'rgba(124,106,255,0.3)');
  gradient.addColorStop(1, 'rgba(124,106,255,0)');
  trendChart.data.datasets[0].backgroundColor = gradient;
  trendChart.options.scales.x.grid.color = c.grid;
  trendChart.options.scales.x.ticks.color = c.text;
  trendChart.options.scales.y.grid.color = c.grid;
  trendChart.options.scales.y.ticks.color = c.text;
  trendChart.options.plugins.tooltip.backgroundColor = c.tooltipBg;
  trendChart.options.plugins.tooltip.titleColor = c.tooltipTitle;
  trendChart.options.plugins.tooltip.borderColor = c.tooltipBorder;
  trendChart.update();
}

/* ══════════════════════════════
   USER — Jurnal Bacaan
══════════════════════════════ */
async function loadUserHistory(name) {
  const res = await fetchWithAuth(`${BASE_URL}/borrowing?page=1&limit=100`);
  if (!res?.ok) { document.getElementById('userEmpty').style.display = 'flex'; return; }
  const json = await res.json();
  const all = json.data ?? [];

  // Stats
  const aktif    = all.filter(b => b.status === 'APPROVED' || b.status === 'OVERDUE').length;
  const selesai  = all.filter(b => b.status === 'RETURNED').length;
  const total    = all.length;

  // Kategori favorit
  const catFreq = {};
  all.forEach(b => { const c = b.book?.category; if (c) catFreq[c] = (catFreq[c] ?? 0) + 1; });
  const topCat = Object.entries(catFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  document.getElementById('uTotalBuku').textContent = total;
  document.getElementById('uSelesai').textContent   = selesai;
  document.getElementById('uAktif').textContent     = aktif;
  document.getElementById('uKatFav').textContent    = topCat;

  if (all.length === 0) {
    document.getElementById('timelineWrap').innerHTML = '';
    document.getElementById('userEmpty').style.display = 'flex';
    return;
  }

  // Kelompokkan per bulan
  const byMonth = {};
  const mn = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  all.forEach(b => {
    const d = new Date(b.borrowAt ?? b.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,'0')}`;
    const label = `${mn[d.getMonth()]} ${d.getFullYear()}`;
    if (!byMonth[key]) byMonth[key] = { label, items: [] };
    byMonth[key].items.push(b);
  });

  // Urutkan bulan terbaru dulu
  const sorted = Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0]));

  document.getElementById('timelineWrap').innerHTML = sorted.map(([, { label, items }]) => `
    <div class="timeline-month">
      <div class="timeline-month-header">
        <span class="timeline-month-label">${label}</span>
        <div class="timeline-month-line"></div>
        <span class="timeline-month-count">${items.length} buku</span>
      </div>
      <div class="timeline-items">
        ${items.map(b => timelineCard(b)).join('')}
      </div>
    </div>
  `).join('');
}

function timelineCard(b) {
  const statusMap = {
    PENDING:  ['badge-pending',  'Menunggu'],
    APPROVED: ['badge-approved', 'Sedang Dipinjam'],
    OVERDUE:  ['badge-overdue',  'Terlambat'],
    RETURNED: ['badge-returned', 'Selesai Dibaca'],
    REJECTED: ['badge-rejected', 'Ditolak'],
  };
  const [cls, label] = statusMap[b.status] ?? ['badge-pending', b.status];

  return `<div class="timeline-card">
    <div class="timeline-cover">
      ${b.book?.cover
        ? `<img src="${escHtml(b.book.cover)}" alt="" onerror="this.style.display='none';this.parentElement.innerHTML='<svg viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'1.5\\'><path d=\\'M4 19.5A2.5 2.5 0 0 1 6.5 17H20\\'/><path d=\\'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z\\'/></svg>'">`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`
      }
    </div>
    <div class="timeline-info">
      <div class="timeline-title">${escHtml(b.book?.title ?? '—')}</div>
      <div class="timeline-author">${escHtml(b.book?.author ?? '—')}</div>
      <div class="timeline-dates">
        <div class="timeline-date-item">
          <span class="timeline-date-label">Dipinjam</span>
          <span class="timeline-date-val">${formatDate(b.borrowAt)}</span>
        </div>
        <div class="timeline-date-item">
          <span class="timeline-date-label">Jatuh Tempo</span>
          <span class="timeline-date-val">${formatDate(b.dueDate)}</span>
        </div>
        ${b.returnedAt ? `<div class="timeline-date-item">
          <span class="timeline-date-label">Dikembalikan</span>
          <span class="timeline-date-val">${formatDate(b.returnedAt)}</span>
        </div>` : ''}
      </div>
    </div>
    <div class="timeline-right">
      <span class="status-badge ${cls}">${label}</span>
      ${b.fine > 0 ? `<span class="fine-chip">Denda Rp ${b.fine.toLocaleString('id-ID')}</span>` : ''}
    </div>
  </div>`;
}

/* ── Helpers ── */
function emptyRow(msg) {
  return `<div style="padding:28px 20px;text-align:center;font-size:12.5px;color:var(--text-muted)">${msg}</div>`;
}
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}