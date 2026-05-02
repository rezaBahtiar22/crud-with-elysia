document.addEventListener('DOMContentLoaded', async () => {
  // Inisialisasi fungsi common (sidebar, theme, dll)
  if (typeof initCommon === 'function') {
    await initCommon();
  }

  // Sinkronisasi Mode Gelap (Card UI)
  updateToggleUi();
  
  // Inisialisasi fitur ekspor
  initExport();

  // Listener untuk klik pada kartu tema
  const themeCard = document.getElementById('themeToggleItem');
  if (themeCard) {
    themeCard.addEventListener('click', () => {
      const globalToggle = document.getElementById('themeToggle');
      if (globalToggle) globalToggle.click();
      setTimeout(updateToggleUi, 50);
    });
  }

  // Animasi sederhana untuk kartu-kartu notifikasi (Simulasi Toggle)
  const toggleCards = document.querySelectorAll('.s-card.toggle-card');
  toggleCards.forEach(card => {
    if (card.id === 'themeToggleItem') return;
    card.addEventListener('click', () => {
      card.classList.toggle('active');
    });
  });
});

/**
 * Inisialisasi fitur Ekspor Aktivitas
 */
function initExport() {
  const cardExport = document.getElementById('cardExport');
  if (!cardExport) return;

  cardExport.addEventListener('click', async () => {
    const textEl = cardExport.querySelector('.s-card-text p');
    const originalText = textEl.textContent;

    try {
      // Indikator Loading
      cardExport.style.pointerEvents = 'none';
      cardExport.style.opacity = '0.7';
      textEl.textContent = 'Menyiapkan data...';

      const res = await apiFetch(`${CONFIG.API_BASE_URL}/reports/user/borrowings`);
      
      if (!res || !res.ok) {
        throw new Error('Gagal mengunduh laporan');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Riwayat_Aktivitas_Saya.xlsx';
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      a.remove();

      textEl.textContent = 'Berhasil diunduh!';
      setTimeout(() => {
        textEl.textContent = originalText;
      }, 2000);

    } catch (err) {
      console.error('Export Error:', err);
      textEl.textContent = 'Gagal mengunduh data';
      setTimeout(() => {
        textEl.textContent = originalText;
      }, 3000);
    } finally {
      cardExport.style.pointerEvents = 'auto';
      cardExport.style.opacity = '1';
    }
  });
}

/**
 * Update visual toggle pada kartu sesuai dengan tema body saat ini
 */
function updateToggleUi() {
  const isDark = document.body.classList.contains('dark');
  const themeCard = document.getElementById('themeToggleItem');
  
  if (themeCard) {
    if (isDark) {
      themeCard.classList.add('active');
    } else {
      themeCard.classList.remove('active');
    }
  }
}
