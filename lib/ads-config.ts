/**
 * Konfigurasi Iklan Adsterra
 * 
 * Anda cukup mengisi Key ID yang didapatkan dari dashboard Adsterra Anda di sini.
 * Iklan otomatis dinonaktifkan jika halaman yang dibuka adalah halaman admin (/admin).
 */
export const ADSTERRA_CONFIG = {
  // Atur ke true jika ingin mengaktifkan iklan secara global
  enabled: true,

  // 1. Popunder Adsterra
  // Biasanya Adsterra memberikan script tag dengan src "invoke.js". 
  // Anda hanya perlu menyalin Key Hexadecimal-nya saja di sini.
  popunder: {
    enabled: true,
    key: "YOUR_ADSTERRA_POPUNDER_KEY", // Ganti dengan Key Popunder Anda nanti
  },

  // 2. Social Bar Adsterra
  // Script interaktif melayang yang sangat disukai visitor streaming bola
  socialBar: {
    enabled: true,
    key: "YOUR_ADSTERRA_SOCIAL_BAR_KEY", // Ganti dengan Key Social Bar Anda nanti
  },

  // 3. Banner Ads (Bisa diletakkan di berbagai bagian halaman)
  // Contoh key default untuk display banner standard
  banners: {
    banner468x60: "YOUR_ADSTERRA_BANNER_468X60_KEY", // Banner Header
    banner728x90: "YOUR_ADSTERRA_BANNER_728X90_KEY", // Banner Di Atas Player
    banner300x250: "YOUR_ADSTERRA_BANNER_300X250_KEY", // Banner Sidebar / Di Bawah Player
    banner160x600: "YOUR_ADSTERRA_BANNER_160X600_KEY"  // Banner Vertikal Kiri/Kanan
  }
};
