'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { SPONSOR_CONFIG } from '@/lib/sponsors-config';
import { AdsterraBanner } from '@/components/AdsterraBanner';
import { Megaphone, ExternalLink, HelpCircle, X } from 'lucide-react';

export function SponsorSidebars() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isLeftClosed, setIsLeftClosed] = useState(false);
  const [isRightClosed, setIsRightClosed] = useState(false);
  const leftHtmlRef = useRef<HTMLDivElement>(null);
  const rightHtmlRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hydrate custom scripts if any for HTML codes
  useEffect(() => {
    if (!mounted) return;
    
    // Inject LEFT side HTML scripts if any
    if (SPONSOR_CONFIG.sidebarLeft.enabled && SPONSOR_CONFIG.sidebarLeft.hasCustomSponsor && SPONSOR_CONFIG.sidebarLeft.htmlCode) {
      if (leftHtmlRef.current) {
        leftHtmlRef.current.innerHTML = '';
        const range = document.createRange();
        const documentFragment = range.createContextualFragment(SPONSOR_CONFIG.sidebarLeft.htmlCode);
        leftHtmlRef.current.appendChild(documentFragment);
      }
    }

    // Inject RIGHT side HTML scripts if any
    if (SPONSOR_CONFIG.sidebarRight.enabled && SPONSOR_CONFIG.sidebarRight.hasCustomSponsor && SPONSOR_CONFIG.sidebarRight.htmlCode) {
      if (rightHtmlRef.current) {
        rightHtmlRef.current.innerHTML = '';
        const range = document.createRange();
        const documentFragment = range.createContextualFragment(SPONSOR_CONFIG.sidebarRight.htmlCode);
        rightHtmlRef.current.appendChild(documentFragment);
      }
    }
  }, [mounted, pathname]);

  if (!mounted || !SPONSOR_CONFIG.enabled || pathname?.startsWith('/admin')) {
    return null;
  }

  // Generate WA links with prefilled text for context
  const waLinkLeft = `https://wa.me/628123456789?text=Halo%20Admin%20FL%20Streams,%20saya%20tertarik%20untuk%20memasang%20sponsorship%20Sponsor%20Samping%20Kiri%20(160x600).`;
  const waLinkRight = `https://wa.me/628123456789?text=Halo%20Admin%20FL%20Streams,%20saya%20tertarik%20untuk%20memasang%20sponsorship%20Sponsor%20Samping%20Kanan%20(160x600).`;

  return (
    <>
      {/* LEFT SIDEBAR (Skyscraper) */}
      {SPONSOR_CONFIG.sidebarLeft.enabled && !isLeftClosed && (
        <div 
          id="custom-sponsor-left"
          className="fixed left-1 md:left-4 top-24 md:top-28 bottom-20 w-[80px] md:w-[120px] xl:w-[160px] flex flex-col items-center justify-start z-[30]"
        >
          {/* Close Button */}
          <button 
            onClick={() => setIsLeftClosed(true)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-red-600 transition-colors z-20 shadow-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Label Header */}
          <span className="text-[7px] md:text-[9px] font-black tracking-widest text-zinc-500 uppercase bg-zinc-950/80 px-2 py-0.5 rounded-full border border-white/[0.04] mb-2 select-none">
            SPONSOR
          </span>

          <div className="w-full h-fit flex flex-col items-center scale-[0.6] md:scale-90 xl:scale-100 origin-top">
            {SPONSOR_CONFIG.sidebarLeft.hasCustomSponsor ? (
              SPONSOR_CONFIG.sidebarLeft.htmlCode ? (
                <div ref={leftHtmlRef} className="w-[160px] h-[600px] overflow-hidden rounded-2xl bg-zinc-950 border border-white/[0.05]" />
              ) : (
                <a 
                  href={SPONSOR_CONFIG.sidebarLeft.linkUrl || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative block w-[160px] h-[600px] rounded-2xl overflow-hidden border border-white/[0.05] hover:border-red-500/50 transition-all duration-300 shadow-2xl"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={SPONSOR_CONFIG.sidebarLeft.imageUrl || "https://picsum.photos/seed/sponsorleft/160/600"} 
                    alt="Sponsor Kiri" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <span className="text-[10px] bg-red-650 text-white font-black px-2 py-1 rounded flex items-center gap-1 shadow-md">
                      Kunjungi Sponsor <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </a>
              )
            ) : SPONSOR_CONFIG.sidebarLeft.useAdsterraFallback ? (
              <div className="w-[160px]">
                <AdsterraBanner
                  type={SPONSOR_CONFIG.sidebarLeft.adsterraType}
                  width={160}
                  height={600}
                  label={false}
                  adKey={SPONSOR_CONFIG.sidebarLeft.adsterraKey}
                  slotId="sidebar-left"
                />
              </div>
            ) : (
              /* PASANG IKLAN DISINI PLACEHOLDER */
              <a 
                href={SPONSOR_CONFIG.contact.url || waLinkLeft}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-between p-4 w-[160px] h-[600px] rounded-2xl border-2 border-dashed border-red-500/20 hover:border-red-500/60 bg-gradient-to-b from-zinc-950/80 via-zinc-950/30 to-zinc-950/80 backdrop-blur-sm shadow-xl hover:shadow-red-550/5 transition-all duration-300 group text-center"
              >
                <div className="mt-8 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 group-hover:bg-red-500/20 transition-all duration-200">
                    <Megaphone className="w-6 h-6 text-red-500 animate-bounce" />
                  </div>
                  <span className="text-sm font-black text-white uppercase tracking-tight group-hover:text-red-400 transition-colors">
                    TARUH IKLAN
                  </span>
                  <span className="text-xl font-black text-red-500 uppercase tracking-tighter -mt-1 block">
                    DI SINI
                  </span>
                  <span className="text-[9px] font-medium text-zinc-500 mt-4 leading-relaxed max-w-[120px] px-1">
                    Pasang iklan kustom Anda (banner/gambar/tulisan/link) di slot premium ini.
                  </span>
                </div>

                <div className="mb-6 w-full px-1">
                  <div className="text-[9px] text-zinc-400 mb-2.5">
                    Slot 160 x 600 px
                  </div>
                  <span className="w-full block py-2 px-3 bg-red-600 hover:bg-red-500 text-white font-black text-[10px] tracking-wider uppercase rounded-xl shadow-lg shadow-red-600/15 group-hover:scale-105 duration-200 transition-transform">
                    Sewa Sekarang
                  </span>
                </div>
              </a>
            )}
          </div>
        </div>
      )}

      {/* RIGHT SIDEBAR (Skyscraper) */}
      {SPONSOR_CONFIG.sidebarRight.enabled && !isRightClosed && (
        <div 
          id="custom-sponsor-right"
          className="fixed right-1 md:right-4 top-24 md:top-28 bottom-20 w-[80px] md:w-[120px] xl:w-[160px] flex flex-col items-center justify-start z-[30]"
        >
          {/* Close Button */}
          <button 
            onClick={() => setIsRightClosed(true)}
            className="absolute -top-2 -left-2 w-6 h-6 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-red-600 transition-colors z-20 shadow-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Label Header */}
          <span className="text-[7px] md:text-[9px] font-black tracking-widest text-zinc-500 uppercase bg-zinc-950/80 px-2 py-0.5 rounded-full border border-white/[0.04] mb-2 select-none">
            SPONSOR
          </span>

          <div className="w-full h-fit flex flex-col items-center scale-[0.6] md:scale-90 xl:scale-100 origin-top">
            {SPONSOR_CONFIG.sidebarRight.hasCustomSponsor ? (
              SPONSOR_CONFIG.sidebarRight.htmlCode ? (
                <div ref={rightHtmlRef} className="w-[160px] h-[600px] overflow-hidden rounded-2xl bg-zinc-950 border border-white/[0.05]" />
              ) : (
                <a 
                  href={SPONSOR_CONFIG.sidebarRight.linkUrl || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative block w-[160px] h-[600px] rounded-2xl overflow-hidden border border-white/[0.05] hover:border-red-500/50 transition-all duration-300 shadow-2xl"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={SPONSOR_CONFIG.sidebarRight.imageUrl || "https://picsum.photos/seed/sponsorright/160/600"} 
                    alt="Sponsor Kanan" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <span className="text-[10px] bg-red-650 text-white font-black px-2 py-1 rounded flex items-center gap-1 shadow-md">
                      Kunjungi Sponsor <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </a>
              )
            ) : SPONSOR_CONFIG.sidebarRight.useAdsterraFallback ? (
              <div className="w-[160px]">
                <AdsterraBanner
                  type={SPONSOR_CONFIG.sidebarRight.adsterraType}
                  width={160}
                  height={600}
                  label={false}
                  adKey={SPONSOR_CONFIG.sidebarRight.adsterraKey}
                  slotId="sidebar-right"
                />
              </div>
            ) : (
              /* PASANG IKLAN DISINI PLACEHOLDER */
              <a 
                href={SPONSOR_CONFIG.contact.url || waLinkRight}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-between p-4 w-[160px] h-[600px] rounded-2xl border-2 border-dashed border-red-500/20 hover:border-red-500/60 bg-gradient-to-b from-zinc-950/80 via-zinc-950/30 to-zinc-950/80 backdrop-blur-sm shadow-xl hover:shadow-red-550/5 transition-all duration-300 group text-center"
              >
                <div className="mt-8 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 group-hover:bg-red-500/20 transition-all duration-200">
                    <Megaphone className="w-6 h-6 text-red-500 animate-bounce" />
                  </div>
                  <span className="text-sm font-black text-white uppercase tracking-tight group-hover:text-red-400 transition-colors">
                    TARUH IKLAN
                  </span>
                  <span className="text-xl font-black text-red-500 uppercase tracking-tighter -mt-1 block">
                    DI SINI
                  </span>
                  <span className="text-[9px] font-medium text-zinc-500 mt-4 leading-relaxed max-w-[120px] px-1">
                    Pasang iklan kustom Anda (banner/gambar/tulisan/link) di slot premium ini.
                  </span>
                </div>

                <div className="mb-6 w-full px-1">
                  <div className="text-[9px] text-zinc-400 mb-2.5">
                    Slot 160 x 600 px
                  </div>
                  <span className="w-full block py-2 px-3 bg-red-600 hover:bg-red-500 text-white font-black text-[10px] tracking-wider uppercase rounded-xl shadow-lg shadow-red-600/15 group-hover:scale-105 duration-200 transition-transform">
                    Sewa Sekarang
                  </span>
                </div>
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
