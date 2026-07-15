'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import LiveChat from '@/components/LiveChat';
import AdsterraAd from '@/components/AdsterraAd';

interface ServerOption {
  label: string;
  embedUrl: string;
}

interface WatchClientProps {
  matchId: string;
  matchTitle: string;
  sourceParam: string;
  idParam: string;
  embedUrl: string;
  league?: string;
}

const BASE_SF = 'https://streamfree.top';


export default function WatchClient({
  matchId,
  matchTitle,
  sourceParam,
  idParam,
  embedUrl,
  league,
}: WatchClientProps) {
  const servers: ServerOption[] = [
    { label: 'Server 1', embedUrl },
    { label: 'Server 2', embedUrl: `${BASE_SF}/embed/${sourceParam}/${idParam}?v=2` },
    { label: 'Server 3', embedUrl: `${BASE_SF}/embed/${sourceParam}/${idParam}?server=2` },
  ];

  const [activeServer, setActiveServer] = useState(0);
  const [theaterMode, setTheaterMode] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');
  const [floaters, setFloaters] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const [playerLoaded, setPlayerLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const floaterIdRef = useRef(0);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Theater mode
  useEffect(() => {
    document.body.classList.toggle('theater-mode', theaterMode);
    return () => document.body.classList.remove('theater-mode');
  }, [theaterMode]);

  // Track fullscreen state
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Force true monitor fullscreen
  const handleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        // Try iframe directly first for purest borderless fullscreen
        if (iframeRef.current) await iframeRef.current.requestFullscreen();
        else if (playerContainerRef.current) await playerContainerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {}
  }, []);



  const handleReact = useCallback((emoji: string) => {
    const id = ++floaterIdRef.current;
    const x = 10 + Math.random() * 80;
    setFloaters((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => setFloaters((prev) => prev.filter((f) => f.id !== id)), 2500);
  }, []);

  const handleServerChange = (i: number) => {
    setActiveServer(i);
    setPlayerLoaded(false);
  };

  const shareUrl = typeof window !== 'undefined'
    ? window.location.href
    : `https://www.flstreams.my.id/watch/${sourceParam}/${idParam}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    } catch {}
  };

  const displayTitle = cleanMatchTitle(idParam);
  const currentEmbed = servers[activeServer].embedUrl;

  return (
    <>
      {theaterMode && (
        <div className="fixed inset-0 bg-black/92 z-30" onClick={() => setTheaterMode(false)} aria-hidden="true" />
      )}

      <div className={`flex flex-col lg:flex-row gap-4 ${theaterMode ? 'relative z-40' : ''}`}>

        {/* ══ Player column ══════════════════════════ */}
        <div className="flex-1 min-w-0">

          {/* Player container — fullscreen target */}
          <div
            ref={playerContainerRef}
            className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 shadow-2xl select-none group"
          >
            {/* Loading overlay */}
            {!playerLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400">Memuat stream...</p>
                </div>
              </div>
            )}

            {/* StreamFree embed iframe */}
            <iframe
              key={currentEmbed}
              ref={iframeRef}
              src={currentEmbed}
              className="absolute inset-0 w-full h-full"
              allow="fullscreen; picture-in-picture; autoplay"
              allowFullScreen
              title={`${matchTitle} — ${servers[activeServer].label}`}
              loading="eager"
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={() => setPlayerLoaded(true)}
            />

            {/* Top badges — always visible */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
              <div className="flex items-center gap-1.5 bg-red-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-lg">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                </span>
                LIVE
              </div>
            </div>

            {/* Server label top-right */}
            <div className="absolute top-3 right-3 z-10 text-[9px] text-slate-400 bg-black/50 border border-slate-700/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
              {servers[activeServer].label}
            </div>

            {/* Floating emojis */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-20" aria-hidden="true">
              {floaters.map((f) => (
                <span key={f.id} className="absolute bottom-20 text-2xl select-none animate-float-up" style={{ left: `${f.x}%` }}>
                  {f.emoji}
                </span>
              ))}
            </div>

            {/* ── Reaction emojis (Top Center) ──────── */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex items-center gap-1.5 bg-black/60 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-xl">
                {['🔥', '😱', '👏', '🏆', '❤️'].map((emoji) => (
                  <button key={emoji} onClick={() => handleReact(emoji)} className="text-sm hover:scale-125 active:scale-90 transition-transform cursor-pointer" aria-label={`React ${emoji}`}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Server Selection ──────────────────── */}
          <div className="mt-4 bg-slate-900/30 border border-slate-800/60 rounded-xl p-4">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3">Pilih Server Penayangan</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {servers.map((server, i) => (
                <button
                  key={i}
                  onClick={() => handleServerChange(i)}
                  className={`relative px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                    activeServer === i
                      ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.3)]'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600 hover:text-white'
                  }`}
                >
                  {server.label}
                  {activeServer === i && <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />}
                </button>
              ))}
            </div>

            {/* Extra actions */}
            <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-800/40">
              <button
                onClick={() => setTheaterMode((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                {theaterMode ? 'Lampu Nyala' : 'Mode Bioskop'}
              </button>

              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {shareStatus === 'copied' ? '✅ Tersalin!' : 'Salin Link'}
              </button>

              <button
                onClick={handleFullscreen}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                </svg>
                {isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (Full)'}
              </button>

            </div>
          </div>

          {/* ── Match Info Footer ─────────────────── */}
          <div className="mt-5 pt-5 border-t border-slate-800/70 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="flex items-center gap-1.5 text-[9px] bg-red-500/10 text-red-400 font-bold px-2.5 py-1 rounded-full border border-red-500/20 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  Sedang Berlangsung
                </span>
                {league && (
                  <span className="text-[9px] text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">{league}</span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight leading-tight">
                {matchTitle || displayTitle}
              </h2>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-[10px] text-slate-500 mt-1 block">Siaran Langsung</span>
            </div>
          </div>

          {/* Mobile ad */}
          <div className="mt-6 flex justify-center lg:hidden">
            <AdsterraAd format="rectangle-300x250" />
          </div>
        </div>

        {/* ══ Chat column ════════════════════════════ */}
        <div className={`lg:w-80 xl:w-96 flex flex-col ${theaterMode ? 'hidden lg:flex' : ''}`}>
          <div className="lg:sticky lg:top-16" style={{ height: 'min(600px, 80vh)' }}>
            <LiveChat matchId={matchId} />
          </div>
          <div className="mt-4 hidden lg:flex justify-center">
            <AdsterraAd format="rectangle-300x250" />
          </div>
        </div>
      </div>
    </>
  );
}

function cleanMatchTitle(id: string): string {
  let clean = id.replace(/-\d+$/, '');
  let isPpv = false;
  if (clean.startsWith('ppv-')) { isPpv = true; clean = clean.substring(4); }
  const parts = clean.split('-vs-');
  if (parts.length === 2) {
    const cap = (s: string) => s.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return `${isPpv ? 'PPV: ' : ''}${cap(parts[0])} vs ${cap(parts[1])}`;
  }
  return clean.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
