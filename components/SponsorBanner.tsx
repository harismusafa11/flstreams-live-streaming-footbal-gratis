'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { SPONSOR_CONFIG } from '@/lib/sponsors-config';
import { AdsterraBanner } from '@/components/AdsterraBanner';
import { Megaphone, ExternalLink, MessageCircle } from 'lucide-react';

interface SponsorBannerProps {
  slot: 'bottom' | 'belowPlayer' | 'sidebarLeft' | 'sidebarRight'; // Identitas konfigurasi rujukan
  width: number;
  height: number;
  label?: string; // e.g. "SPONSORSHIP" or "IKLAN BANNER"
}

export function SponsorBanner({ slot, width, height, label = "SPONSOR" }: SponsorBannerProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const htmlContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ambil data konfigurasi slot yang aktif
  const slotConfig = slot === 'bottom' 
    ? SPONSOR_CONFIG.bottom 
    : slot === 'belowPlayer' 
      ? SPONSOR_CONFIG.belowPlayer 
      : null;

  // Render HTML code kustom jika dipasang
  useEffect(() => {
    if (!mounted || !slotConfig) return;
    if (pathname?.startsWith('/admin')) return;

    if (slotConfig.hasCustomSponsor && slotConfig.htmlCode) {
      if (htmlContainerRef.current) {
        htmlContainerRef.current.innerHTML = '';
        const range = document.createRange();
        const documentFragment = range.createContextualFragment(slotConfig.htmlCode);
        htmlContainerRef.current.appendChild(documentFragment);
      }
    }
  }, [mounted, slotConfig, pathname]);

  if (!mounted || !SPONSOR_CONFIG.enabled || pathname?.startsWith('/admin')) {
    return null;
  }

  // Jika slot di-disable di konfigurasi
  if (slotConfig && !slotConfig.enabled) {
    return null;
  }

  const trackingLinkWA = `https://wa.me/628123456789?text=Halo%20Admin%20FL%20Streams,%20saya%20tertarik%20untuk%20memasang%20sponsorship%20Banner%20Horizontal%20(${width}x${height}).`;

  return (
    <div className="flex flex-col items-center justify-center my-6 overflow-hidden w-full">
      {/* Small design-forward sponsor tag */}
      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 select-none flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" /> {label}
      </span>

      {slotConfig ? (
        slotConfig.hasCustomSponsor ? (
          slotConfig.htmlCode ? (
            /* Render raw script pihak ketiga */
            <div 
              ref={htmlContainerRef} 
              style={{ minWidth: `${width}px`, minHeight: `${height}px` }}
              className="flex items-center justify-center w-full rounded-2xl overflow-hidden border border-white/[0.05]"
            />
          ) : (
            /* Render image banner custom */
            <a 
              href={slotConfig.linkUrl || '#'} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative block rounded-2xl overflow-hidden border border-white/[0.05] hover:border-red-500/40 transition-all duration-300 shadow-xl"
              style={{ width: `${width}px`, height: `${height}px` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={slotConfig.imageUrl || `https://picsum.photos/seed/bottombanner/${width}/${height}`} 
                alt="Custom Banner Sponsor" 
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <span className="text-xs bg-red-650 text-white font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md">
                  Kunjungi Website <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </div>
            </a>
          )
        ) : slotConfig.useAdsterraFallback ? (
          /* Fallback ke Adsterra Banner jika diaktifkan */
          <div className="w-full flex justify-center">
            <AdsterraBanner
              type={slotConfig.adsterraType}
              width={width}
              height={height}
              label={false}
              adKey={slotConfig.adsterraKey}
              slotId={slot}
            />
          </div>
        ) : (
          /* TARUH IKLAN BANNER DISINI PLACEHOLDER (Horizontal) */
          <a 
            href={SPONSOR_CONFIG.contact.url || trackingLinkWA}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between px-6 py-4 rounded-2xl border border-dashed border-red-500/20 hover:border-red-500/60 bg-gradient-to-r from-red-500/5 via-zinc-950/80 to-zinc-950/80 hover:bg-zinc-950 text-left transition-all duration-300 select-none cursor-pointer overflow-hidden shadow-md max-w-full"
            style={{ width: `${width}px`, minHeight: `${height}px` }}
          >
            <div className="flex items-center space-x-4 max-w-[80%]">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 group-hover:bg-red-500/20 transition-all">
                <Megaphone className="w-5 h-5 text-red-500 animate-bounce" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black text-white uppercase tracking-tight group-hover:text-red-400 transition-colors">
                  TARUH IKLAN DI SINI
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">
                  Sewa slot banner premium ({width}x{height}px) di halaman pertandingan populer!
                </span>
              </div>
            </div>

            <div className="shrink-0 pl-3">
              <span className="inline-flex items-center gap-1 py-1.5 px-3 bg-red-600 group-hover:bg-red-500 text-white font-black text-[9px] tracking-widest uppercase rounded-lg shadow-md group-hover:scale-105 duration-150 transition-transform">
                <MessageCircle className="w-3 h-3" /> Booking
              </span>
            </div>
          </a>
        )
      ) : null}
    </div>
  );
}
