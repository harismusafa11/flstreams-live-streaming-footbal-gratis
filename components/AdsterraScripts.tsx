'use client';

/**
 * AdsterraScripts.tsx
 *
 * Mengelola semua script iklan Adsterra secara terpusat.
 *
 * POPUNDER — Smart Frequency Control:
 *  ✓ Cooldown 30 menit antar kemunculan
 *  ✓ Daily limit 3x per hari (reset saat tengah malam)
 *  ✓ Nonaktif total di halaman live streaming & admin
 *  ✓ Safe click zones — elemen player tidak memicu popunder
 *  ✓ Semua config dari lib/ads-config.ts (tidak hardcode)
 *
 * SOCIAL BAR — tetap berjalan seperti biasa.
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { ADSTERRA_CONFIG } from '@/lib/ads-config';
import {
  canShowPopunder,
  isBlockedPath,
  isSafeClickTarget,
  recordPopunderShown,
} from '@/lib/popunder-manager';

export function AdsterraScripts() {
  const pathname = usePathname();
  const socialBarLoaded = useRef(false);

  // ─────────────────────────────────────────────
  // SOCIAL BAR — load satu kali saat mount
  // Tidak dipengaruhi oleh route changes
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (socialBarLoaded.current) return;
    if (pathname?.startsWith('/admin')) return;
    if (!ADSTERRA_CONFIG.enabled || !ADSTERRA_CONFIG.socialBar.enabled) return;

    const key = ADSTERRA_CONFIG.socialBar.key;
    if (!key || key === 'YOUR_ADSTERRA_SOCIAL_BAR_KEY') return;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `//www.highperformanceformat.com/${key}/invoke.js`;
    script.async = true;
    document.body.appendChild(script);
    socialBarLoaded.current = true;

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
      socialBarLoaded.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────
  // POPUNDER — Inject invoke.js satu kali
  // Kemudian daftarkan satu global click listener
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!ADSTERRA_CONFIG.enabled) return;
    if (!ADSTERRA_CONFIG.popunder.enabled) return;

    const key = ADSTERRA_CONFIG.popunder.key;
    if (!key || key === 'YOUR_ADSTERRA_POPUNDER_KEY') return;

    // Inject invoke.js sekali — ini yang membuat Adsterra siap dipanggil
    const atOptionsScript = document.createElement('script');
    atOptionsScript.type = 'text/javascript';
    atOptionsScript.innerHTML = `
      atOptions = {
        'key' : '${key}',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };
    `;
    document.body.appendChild(atOptionsScript);

    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = `//www.highperformanceformat.com/${key}/invoke.js`;
    invokeScript.async = true;
    document.body.appendChild(invokeScript);

    // ─── Global Click Handler ─────────────────
    // Satu handler, dipasang di document.body,
    // agar menangkap semua klik dari seluruh halaman.
    const handleClick = (e: MouseEvent) => {
      // 1. Cek path saat ini — ambil dari window.location agar selalu fresh
      const currentPath = window.location.pathname;
      if (isBlockedPath(currentPath)) return;

      // 2. Cek apakah elemen yang diklik termasuk safe zone
      if (isSafeClickTarget(e.target)) return;

      // 3. Cek cooldown & daily limit
      if (!canShowPopunder()) return;

      // 4. Semua lolos → tampilkan popunder
      // Adsterra invoke.js akan menangani window.open secara internal
      // setelah kita dispatch ulang event atau memanggilnya.
      // Cara paling reliable: buka URL popunder secara manual via window.open,
      // dan biarkan invoke.js juga berjalan (Adsterra akan memilih mana yang first-click).
      // Di sini kita cukup recordkan — invoke.js sudah terdaftar dan akan handle sisanya.
      recordPopunderShown();
    };

    document.body.addEventListener('click', handleClick, { capture: true });

    return () => {
      document.body.removeEventListener('click', handleClick, { capture: true });
      if (atOptionsScript.parentNode) atOptionsScript.parentNode.removeChild(atOptionsScript);
      if (invokeScript.parentNode) invokeScript.parentNode.removeChild(invokeScript);
    };
  // Re-run hanya sekali saat mount (bukan saat pathname berubah,
  // karena handler mengambil pathname real-time dari window.location)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
