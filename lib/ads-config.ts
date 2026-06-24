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
    key: "cf78ef4bc930bb834c8bcea2b7e75109", // Ganti dengan Key Popunder Anda nanti
  },

  // 2. Social Bar Adsterra
  // Script interaktif melayang yang sangat disukai visitor streaming bola
  socialBar: {
    enabled: true,
    key: "96ce7cdeb0ea8d7051c90f33aa02e5d9", // Ganti dengan Key Social Bar Anda nanti
  },

  // 3. Banner Ads (Bisa diletakkan di berbagai bagian halaman)
  // Contoh key default untuk display banner standard
  banners: {
    banner468x60: "fe37e1a7f98d3449911fb6a327cfbfd6", // Banner Header
    banner728x90: "a90d6bab75e89e072c78f8b6a4e22223", // Banner Di Atas Player
    banner300x250: "f6abcfb2f5ba24a6004400d2ef90b40a", // Banner Sidebar / Di Bawah Player
    banner160x600: "c9691653f250aed2627b8e607c2b28ae"  // Banner Vertikal Kiri/Kanan
  }
};
