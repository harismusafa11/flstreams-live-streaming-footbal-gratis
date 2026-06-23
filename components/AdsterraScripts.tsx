'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ADSTERRA_CONFIG } from '@/lib/ads-config';

export function AdsterraScripts() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Jangan pernah muat iklan di panel admin
    if (pathname?.startsWith('/admin')) {
      return;
    }

    if (!ADSTERRA_CONFIG.enabled) return;

    // Bersihkan script lama jika sedang perpindahan halaman (agar tidak duplikat)
    const activeScripts: HTMLScriptElement[] = [];

    // --- 1. PROSES POPUNDER ---
    if (ADSTERRA_CONFIG.popunder.enabled && ADSTERRA_CONFIG.popunder.key !== 'YOUR_ADSTERRA_POPUNDER_KEY') {
      const popKey = ADSTERRA_CONFIG.popunder.key;
      
      // Definisikan objek options yang dibutuhkan adsterra
      const atOptionsScript = document.createElement('script');
      atOptionsScript.type = 'text/javascript';
      atOptionsScript.innerHTML = `
        atOptions = {
          'key' : '${popKey}',
          'format' : 'iframe',
          'height' : 250,
          'width' : 300,
          'params' : {}
        };
      `;
      document.body.appendChild(atOptionsScript);
      activeScripts.push(atOptionsScript);

      // Muat library invoke.js dari Adsterra
      const mainPopScript = document.createElement('script');
      mainPopScript.type = 'text/javascript';
      mainPopScript.src = `//www.highperformanceformat.com/${popKey}/invoke.js`;
      document.body.appendChild(mainPopScript);
      activeScripts.push(mainPopScript);
    }

    // --- 2. PROSES SOCIAL BAR ---
    if (ADSTERRA_CONFIG.socialBar.enabled && ADSTERRA_CONFIG.socialBar.key !== 'YOUR_ADSTERRA_SOCIAL_BAR_KEY') {
      const socialKey = ADSTERRA_CONFIG.socialBar.key;
      
      const socialScript = document.createElement('script');
      socialScript.type = 'text/javascript';
      socialScript.src = `//pl${socialKey.slice(0, 4)}c.com/${socialKey.slice(4, 6)}/${socialKey.slice(6, 8)}/${socialKey.slice(8, 10)}/${socialKey}.js`;
      
      // Jika adsterra memberikan URL script lain, alternatif termudah adalah mengizinkan script inject manual
      // atau menggunakan format standar Adsterra:
      socialScript.src = `//www.highperformanceformat.com/${socialKey}/invoke.js`;
      
      // Beberapa versi s-bar dipanggil langsung menggunakan tag script eksternal khas Adsterra:
      // //plxxxxxx.highperformanceformat.com/xx/xx/xx/xxxxxxxx.js
      // Kita sediakan fallback dynamic loading yang fleksibel.
      document.body.appendChild(socialScript);
      activeScripts.push(socialScript);
    }

    // Cleanup saat unmount atau berpindah rute
    return () => {
      activeScripts.forEach(script => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
    };
  }, [mounted, pathname]);

  return null;
}
