/**
 * Konfigurasi Sponsor & Iklan Pihak Ketiga (Custom Sponsors)
 * 
 * Di sini Anda bisa mengatur iklan selain Adsterra, seperti sponsor mandiri,
 * banner banner kustom dengan gambar dan link WhatsApp, atau script iklan pihak ketiga lainnya.
 * 
 * Iklan otomatis menampilkan placeholder "Taruh Iklan Di Sini" jika tidak dikonfigurasi,
 * lengkap dengan tombol hubungi WhatsApp/Telegram untuk calon pemasang iklan.
 */
export const SPONSOR_CONFIG = {
  // Atur ke true jika ingin mengaktifkan sistem sponsor kustom secara global
  enabled: true,

  // Informasi kontak untuk pemesanan slot iklan
  contact: {
    label: "HUBUNGI ADMIN",
    // Ganti dengan link WhatsApp Anda (contoh: https://wa.me/628123456789?text=Halo,%20bisa%20pasang%20iklan?)
    // atau alamat email, Telegram link, dsb.
    url: "https://wa.me/6285880231697?text=Halo%20Admin%20FL%20Streams,%20saya%20tertarik%20untuk%20memasang%20sponsorship%20iklan.",
    text: "Sewa Slot Iklan Ini",
  },

  // 1. Banner Samping Kiri (Skyscraper Kiri)
  sidebarLeft: {
    enabled: true,
    // Jika true, gunakan Adsterra jika tidak ada custom sponsor. 
    // Jika false, hanya gunakan custom sponsor / placeholder "Taruh Iklan Di Sini".
    useAdsterraFallback: false,
    adsterraType: "banner160x600" as const,
    
    // --- Detail Custom Sponsor (Jika ada yang menyewa) ---
    hasCustomSponsor: false, // Set ke true jika slot ini disewa
    imageUrl: "",            // URL gambar banner sponsor (160x600)
    linkUrl: "",             // Link tujuan ketika banner diklik
    htmlCode: "",            // ATAU salin code HTML/JS dari jaringan iklan luar di sini
  },

  // 2. Banner Samping Kanan (Skyscraper Kanan)
  sidebarRight: {
    enabled: true,
    useAdsterraFallback: false,
    adsterraType: "banner160x600" as const,
    
    // --- Detail Custom Sponsor (Jika ada yang menyewa) ---
    hasCustomSponsor: false, // Set ke true jika slot ini disewa
    imageUrl: "",            // URL gambar banner sponsor (160x600)
    linkUrl: "",             // Link tujuan ketika banner diklik
    htmlCode: "",            // ATAU salin code HTML/JS dari jaringan iklan luar di sini
  },

  // 3. Banner Popup (Floating Banner atau Dialogue Modal)
  popup: {
    enabled: true,
    // Berapa detik setelah halaman dibuka baru popup ini muncul?
    delaySeconds: 3,
    // Apakah popup ini bisa di-close oleh visitor? (Direkomendasikan true)
    allowClose: true,
    
    // --- Detail Custom Sponsor ---
    useAdsterraFallback: false,
    adsterraType: "banner300x250" as const,
    hasCustomSponsor: false, // Set ke true jika slot ini disewa
    imageUrl: "",            // URL gambar banner popup (rekomendasi ratio persegi / horizontal)
    linkUrl: "",             // Link tujuan iklan
    htmlCode: "",            // ATAU paste script / HTML iframe pihak ketiga di sini
    
    // Teks placeholder jika belum ada yang menyewa
    placeholderTitle: "Ingin Pasang Iklan Popup?",
    placeholderDesc: "Iklan Anda akan melayang dan dilihat oleh ribuan penonton setia live streaming sepak bola kami secara instan!",
  },

  // 4. Banner Bawah (Horizontal Billboard / Footer Sponsor)
  bottom: {
    enabled: true,
    useAdsterraFallback: true,
    adsterraType: "banner728x90" as const, // Gunakan fallback 728x90 ke Adsterra jika tidak diisi custom
    
    // --- Detail Custom Sponsor (Jika ada yang menyewa) ---
    hasCustomSponsor: false, // Set ke true jika slot ini disewa
    imageUrl: "",            // URL gambar banner kustom (biasanya 728x90 atau 970x90)
    linkUrl: "",             // Link tujuan iklan
    htmlCode: "",            // ATAU paste code HTML kustom
  },

  // 5. Banner Di Bawah Player Match (Biasanya 300x250 Rectangle)
  belowPlayer: {
    enabled: true,
    useAdsterraFallback: true,
    adsterraType: "banner300x250" as const, // Gunakan fallback 300x250 Adsterra jika tidak diisi custom
    
    // --- Detail Custom Sponsor ---
    hasCustomSponsor: false, // Set ke true jika slot ini disewa
    imageUrl: "",            // URL gambar banner kustom (300x250 atau sejenisnya)
    linkUrl: "",             // Link tujuan iklan
    htmlCode: "",            // ATAU paste code HTML kustom
  }
};
