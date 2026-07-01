/**
 * Konfigurasi Iklan Adsterra
 *
 * Ubah nilai di sini untuk mengatur perilaku iklan secara global.
 * Tidak ada nilai yang di-hardcode di komponen React.
 * Iklan otomatis dinonaktifkan di halaman admin (/admin).
 */
export const ADSTERRA_CONFIG = {
  // Aktifkan/nonaktifkan semua iklan secara global
  enabled: true,

  // ─────────────────────────────────────────────
  // 1. POPUNDER
  // ─────────────────────────────────────────────
  popunder: {
    enabled: true,
    key: 'cf78ef4bc930bb834c8bcea2b7e75109',

    /**
     * Jeda minimum (menit) antara dua kemunculan Popunder.
     * Selama cooldown berlaku, klik apapun tidak akan memicu Popunder.
     */
    cooldownMinutes: 30,

    /**
     * Batas maksimum kemunculan Popunder dalam satu hari kalender.
     * Akan direset otomatis saat tengah malam (00:00).
     */
    dailyLimit: 3,

    /**
     * Daftar path yang BOLEH memicu Popunder.
     * Gunakan prefix matching: '/' cocok dengan homepage saja,
     * '/schedule' cocok dengan /schedule dan /schedule/xxx, dst.
     * Jika array kosong → semua path diizinkan (kecuali blockedPaths).
     */
    allowedPaths: ['/', '/matches', '/schedule', '/jadwal'],

    /**
     * Daftar path yang TIDAK BOLEH memicu Popunder, tanpa pengecualian.
     * Prefix matching: '/match/' akan memblokir /match/slug-apapun.
     * Ini lebih prioritas daripada allowedPaths.
     */
    blockedPaths: ['/match/', '/live/', '/admin'],

    /**
     * Daftar CSS selector elemen yang aman (klik di sini tidak memicu Popunder).
     * Gunakan selector yang spesifik agar tidak terlalu luas.
     */
    safeSelectors: [
      '[data-no-popup]',
      '.server-button',
      '.fullscreen-btn',
      '.player-controls',
      '.player-controls *',
      '.volume-btn',
      '.lights-btn',
      '.theater-btn',
      '.refresh-btn',
      '.search-input',
      '.watch-button',
      'iframe',
      'video',
      'input',
      'textarea',
      'select',
      'button[data-safe]',
    ],
  },

  // ─────────────────────────────────────────────
  // 2. SOCIAL BAR
  // ─────────────────────────────────────────────
  socialBar: {
    enabled: true,
    key: '96ce7cdeb0ea8d7051c90f33aa02e5d9',
  },

  // ─────────────────────────────────────────────
  // 3. BANNER ADS
  // ─────────────────────────────────────────────
  banners: {
    banner468x60: 'fe37e1a7f98d3449911fb6a327cfbfd6',  // Banner Header
    banner728x90: 'a90d6bab75e89e072c78f8b6a4e22223',  // Banner Di Atas Player
    banner300x250: 'f6abcfb2f5ba24a6004400d2ef90b40a', // Banner Sidebar / Di Bawah Player
    banner160x600: 'c9691653f250aed2627b8e607c2b28ae', // Banner Vertikal Kiri/Kanan
  },
};

// ─────────────────────────────────────────────
// localStorage Keys — satu tempat, mudah diganti
// ─────────────────────────────────────────────
export const POPUP_STORAGE_KEYS = {
  lastShow: 'popup_last_show',     // ISO timestamp terakhir popunder muncul
  dailyCount: 'popup_daily_count', // jumlah kemunculan hari ini (number string)
  dailyDate: 'popup_daily_date',   // tanggal referensi (YYYY-MM-DD)
} as const;
