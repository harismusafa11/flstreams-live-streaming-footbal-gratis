'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { SPONSOR_CONFIG } from '@/lib/sponsors-config';
import { AdsterraBanner } from '@/components/AdsterraBanner';
import { motion, AnimatePresence } from 'motion/react';
import { X, Megaphone, CheckCircle2, ChevronRight, MessageCircle } from 'lucide-react';

export function SponsorPopup() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const popupHtmlRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !SPONSOR_CONFIG.enabled || !SPONSOR_CONFIG.popup.enabled) {
      console.log('SponsorPopup: Not enabled or not mounted');
      return;
    }

    // Sembunyikan iklan popup di admin panel
    if (pathname?.startsWith('/admin')) {
      console.log('SponsorPopup: Admin path, skipping');
      return;
    }

    console.log('SponsorPopup: Setting visible immediately');
    setIsVisible(true);
    
    // Check if it was already closed in this session
    const isClosed = sessionStorage.getItem('fc_sponsor_popup_closed');
    if (isClosed === 'true') {
       console.log('SponsorPopup: Already closed in this session');
       setIsVisible(false);
       return;
    }
  }, [mounted, pathname]);

  // Inject HTML Code jika ada and visible
  useEffect(() => {
    if (!mounted || !isVisible) return;

    if (SPONSOR_CONFIG.popup.hasCustomSponsor && SPONSOR_CONFIG.popup.htmlCode) {
      if (popupHtmlRef.current) {
        popupHtmlRef.current.innerHTML = '';
        const range = document.createRange();
        const documentFragment = range.createContextualFragment(SPONSOR_CONFIG.popup.htmlCode);
        popupHtmlRef.current.appendChild(documentFragment);
      }
    }
  }, [mounted, isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('fc_sponsor_popup_closed', 'true');
  };

  const trackingLinkWA = `https://wa.me/628123456789?text=Halo%20Admin%20FL%20Streams,%20saya%20tertarik%20untuk%20memasang%20sponsorship%20Popup%20Ad%20(Melayang/Persegi).`;

  // Render logic without early return based on isVisible
  if (!mounted || !SPONSOR_CONFIG.enabled || !SPONSOR_CONFIG.popup.enabled) {
    return null;
  }

  const isUsingAdsterra = !SPONSOR_CONFIG.popup.hasCustomSponsor && SPONSOR_CONFIG.popup.useAdsterraFallback;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          id="custom-popup-overlay" 
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
        
        {/* Animated Dialog Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative max-w-md w-full bg-[#0c0c0e] border border-white/[0.08] shadow-3xl shadow-red-900/10 rounded-3xl overflow-hidden flex flex-col"
        >
          
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.05] bg-zinc-950/50">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                SPONSORSHIP PREMIUM
              </span>
            </div>
            
            {/* Close Button Trigger */}
            {SPONSOR_CONFIG.popup.allowClose && (
              <button 
                onClick={handleClose}
                className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/[0.05] flex items-center justify-center text-zinc-400 hover:text-white transition-colors duration-150 cursor-pointer"
                title="Tutup Iklan"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Banner Body Content */}
          <div className="p-5 flex-1 flex flex-col items-center justify-center">
            
            {SPONSOR_CONFIG.popup.hasCustomSponsor ? (
              /* ACTIVE SPONSOR BANNER RENDER */
              SPONSOR_CONFIG.popup.htmlCode ? (
                <div ref={popupHtmlRef} className="w-full min-h-[250px] overflow-hidden rounded-2xl border border-white/[0.05]" />
              ) : (
                <a 
                  href={SPONSOR_CONFIG.popup.linkUrl || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative block w-full aspect-[4/3] rounded-2xl overflow-hidden border border-white/[0.05] hover:border-red-500/30 transition-all duration-300"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={SPONSOR_CONFIG.popup.imageUrl || "https://picsum.photos/seed/popupsponsor/400/300"} 
                    alt="Sponsor Popup" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Subtle hover footer info overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Kunjungi Situs Sponsor</span>
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                </a>
              )
            ) : isUsingAdsterra ? (
              /* ADSTERRA FALLBACK */
              <div className="w-full flex items-center justify-center min-h-[250px]">
                <AdsterraBanner 
                  type={SPONSOR_CONFIG.popup.adsterraType} 
                  width={300} 
                  height={250} 
                  label={false} 
                />
              </div>
            ) : (
              /* DETAILED BEAUTIFUL PLACEHOLDER DEMO FOR SELLING SPONSOR */
              <div className="w-full py-4 px-3 flex flex-col items-center text-center">
                
                {/* Visual Icon Badge */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-500/10 to-rose-500/10 border border-red-500/25 flex items-center justify-center mb-4">
                  <Megaphone className="w-7 h-7 text-red-500 animate-pulse" />
                </div>

                {/* Main Prompts */}
                <h3 className="text-lg font-black text-white tracking-tight leading-tight uppercase">
                  {SPONSOR_CONFIG.popup.placeholderTitle}
                </h3>
                <h4 className="text-[11px] font-black tracking-widest text-red-500 uppercase mt-1 mb-3">
                  SIARAN DILIHAT PULUHAN RIBU VISITOR BOLA!
                </h4>

                <p className="text-zinc-400 text-xs leading-relaxed max-w-sm mb-5">
                  {SPONSOR_CONFIG.popup.placeholderDesc}
                </p>

                {/* Pitching points check list */}
                <div className="w-full text-left bg-zinc-950/70 border border-white/[0.03] rounded-2xl p-4 space-y-2 mb-6">
                  <div className="flex items-start space-x-2 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-zinc-300 font-medium leading-none">Ratusan ribu klik tayang saat match besar</span>
                  </div>
                  <div className="flex items-start space-x-2 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-zinc-300 font-medium leading-none">Target pemirsa laki-laki / olahragawan terarah</span>
                  </div>
                  <div className="flex items-start space-x-2 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-zinc-300 font-medium leading-none">Bisa pasang banner kustom / link WA langsung</span>
                  </div>
                </div>

                {/* Call To Action Buttons */}
                <div className="grid grid-cols-2 gap-3 w-full">
                  
                  {/* Cancel close */}
                  <button 
                    onClick={handleClose}
                    className="py-3 px-4 rounded-xl bg-zinc-900 border border-white/[0.05] hover:bg-zinc-850 text-zinc-400 hover:text-white text-xs font-extrabold uppercase transition-all duration-150 cursor-pointer"
                  >
                    Tutup
                  </button>

                  {/* WhatsApp Connect */}
                  <a 
                    href={SPONSOR_CONFIG.contact.url || trackingLinkWA}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase transition-all duration-150 transform hover:scale-[1.02] shadow-lg shadow-emerald-600/10 active:scale-95 text-center"
                  >
                    <MessageCircle className="w-3.5 h-3.5 animate-pulse" /> WA Admin
                  </a>

                </div>

              </div>
            )}

          </div>

          {/* Micro sponsor attribution bar */}
          <div className="bg-zinc-950 text-center py-2 border-t border-white/[0.03] text-[9px] text-zinc-650 font-bold tracking-widest uppercase">
            Platform Solusi Sponsorship Mandiri - FL Streams
          </div>

        </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
