'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ADSTERRA_CONFIG } from '@/lib/ads-config';

interface AdsterraBannerProps {
  type: 'banner728x90' | 'banner300x250' | 'banner468x60' | 'banner160x600';
  width: number;
  height: number;
  label?: boolean; // Tampilkan label "SPONSOR" / "IKLAN" kecil di atasnya
}

export function AdsterraBanner({ type, width, height, label = true }: AdsterraBannerProps) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (pathname?.startsWith('/admin')) return; // Lewati jika admin panel
    if (!ADSTERRA_CONFIG.enabled) return;

    const key = ADSTERRA_CONFIG.banners[type];
    
    // Jangan muat script jika masih placeholder default
    if (!key || key.startsWith('YOUR_ADSTERRA')) return;

    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    // Reset container dulu sebelum injeksi untuk mencegah duplikasi iframe banner
    currentContainer.innerHTML = '';

    // Buat script konfigurasi banner
    const atOptionsScript = document.createElement('script');
    atOptionsScript.type = 'text/javascript';
    atOptionsScript.innerHTML = `
      atOptions = {
        'key' : '${key}',
        'format' : 'iframe',
        'height' : ${height},
        'width' : ${width},
        'params' : {}
      };
    `;
    currentContainer.appendChild(atOptionsScript);

    // Buat script pemanggil adsterra invoke
    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = `//www.highperformanceformat.com/${key}/invoke.js`;
    currentContainer.appendChild(invokeScript);

    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
  }, [mounted, type, width, height, pathname]);

  // Sembunyikan sepenuhnya di halaman admin
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  // Jika iklan dinonaktifkan secara global, tampilkan space kosong yang rapi
  if (!ADSTERRA_CONFIG.enabled) {
    return null;
  }

  const key = ADSTERRA_CONFIG.banners[type];
  const isPlaceholder = !key || key.startsWith('YOUR_ADSTERRA');

  return (
    <div className="flex flex-col items-center justify-center my-4 overflow-hidden w-full">
      {label && (
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 select-none">
          SPONSOR
        </span>
      )}
      
      {isPlaceholder ? (
        // Tampilan placeholder estetik saat mode development (sebelum diisi key asli)
        <div 
          style={{ width: `${width}px`, height: `${height}px` }}
          className="bg-zinc-900/50 border border-white/5 rounded-xl flex flex-col items-center justify-center p-4 text-center text-zinc-600 border-dashed"
        >
          <span className="text-xs font-bold text-zinc-500">ADS SLOT ({width}x{height})</span>
        </div>
      ) : (
        // Div container tempat iframe iklan utama dari Adsterra akan di-render secara dinamis
        <div 
          ref={containerRef} 
          style={{ minWidth: `${width}px`, minHeight: `${height}px` }}
          className="flex items-center justify-center w-full"
        />
      )}
    </div>
  );
}
