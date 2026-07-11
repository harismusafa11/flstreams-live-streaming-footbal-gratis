'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import LiveChat from '@/components/LiveChat';
import AdsterraAd from '@/components/AdsterraAd';


interface RawStream {
  streamNo: number;
  id: string;
  source: string;
  embedUrl: string;
  hd?: boolean;
  language?: string;
}

interface ResolvedStream {
  streamNo: number;
  source: string;
  id: string;
  embedUrl: string;         // original iframe fallback
  relay?: string;           // our /api/hls proxy (preferred)
  m3u8?: string;            // raw CDN url (debug)
  hd?: boolean;
  language?: string;
  resolveError?: string;    // if GOAT decrypt failed, fall back to iframe
}

interface WatchClientProps {
  matchId: string;
  matchTitle: string;
  sourceParam: string;
  idParam: string;
}

// ── hls.js loader (client-only) ───────────────────────────────────────────────
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Hls: any;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadHlsJs(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.Hls) return resolve(window.Hls);
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js';
    script.onload = () => resolve(window.Hls);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// ── HLS Player component ───────────────────────────────────────────────────────
function HlsPlayer({
  relay,
  embedUrl,
  title,
  usingFallback,
  setUsingFallback,
  onVideoMount,
  onVideoClick,
}: {
  relay?: string;
  embedUrl: string;
  title: string;
  usingFallback: boolean;
  setUsingFallback: (v: boolean) => void;
  onVideoMount: (el: HTMLVideoElement | null) => void;
  onVideoClick: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);

  // Notify parent of the mounted video element
  useEffect(() => {
    if (!usingFallback && relay && videoRef.current) {
      onVideoMount(videoRef.current);
    } else {
      onVideoMount(null);
    }
    return () => {
      onVideoMount(null);
    };
  }, [onVideoMount, usingFallback, relay]);

  useEffect(() => {
    if (!relay) {
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        const Hls = await loadHlsJs();
        if (cancelled || !videoRef.current) return;

        if (Hls.isSupported()) {
          const hls = new Hls({
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            enableWorker: true,
          });
          hlsRef.current = hls;
          hls.loadSource(relay!);
          hls.attachMedia(videoRef.current);
          hls.on(Hls.Events.ERROR, (_evt: unknown, data: { fatal: boolean }) => {
            if (data.fatal) {
              console.warn('[hls.js] fatal error, falling back to iframe', data);
              if (!cancelled) setUsingFallback(true);
            }
          });
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari native HLS
          videoRef.current.src = relay!;
        } else {
          setUsingFallback(true);
        }
      } catch {
        if (!cancelled) setUsingFallback(true);
      }
    }

    init();

    return () => {
      cancelled = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [relay, setUsingFallback]);

  if (usingFallback || !relay) {
    return (
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        allowFullScreen
        allow="autoplay; fullscreen; picture-in-picture"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
        title={title}
        loading="lazy"
      />
    );
  }

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 w-full h-full bg-black cursor-pointer"
      autoPlay
      playsInline
      title={title}
      onClick={onVideoClick}
    />
  );
}

// ── Main WatchClient ───────────────────────────────────────────────────────────
export default function WatchClient({
  matchId,
  matchTitle,
  sourceParam,
  idParam,
}: WatchClientProps) {
  const [streams, setStreams] = useState<ResolvedStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [theaterMode, setTheaterMode] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');
  const [resolving, setResolving] = useState<Record<number, boolean>>({});

  const [usingFallback, setUsingFallback] = useState(false);
  const [floaters, setFloaters] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const floaterIdRef = useRef(0);
  const playerRef = useRef<HTMLDivElement>(null);

  // Custom player control states & ref
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  const onVideoMount = useCallback((el: HTMLVideoElement | null) => {
    videoElementRef.current = el;
    if (el) {
      setIsPlaying(!el.paused);
      setVolume(el.volume);
      setIsMuted(el.muted || el.volume === 0);
    }
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoElementRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoElementRef.current;
    if (!video) return;
    const nextMute = !video.muted;
    video.muted = nextMute;
    setIsMuted(nextMute);
  }, []);

  const handleVolumeChange = useCallback((val: number) => {
    const video = videoElementRef.current;
    if (!video) return;
    video.volume = val;
    setVolume(val);
    if (val > 0) {
      video.muted = false;
      setIsMuted(false);
    }
  }, []);

  // Sync state with video element events
  useEffect(() => {
    const video = videoElementRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolume = () => {
      setVolume(video.volume);
      setIsMuted(video.muted || video.volume === 0);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolume);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolume);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoElementRef.current]);

  const toggleFullscreen = useCallback(() => {
    if (!playerRef.current) return;
    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen().catch((err) => {
        console.error('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  const handleReact = useCallback((emoji: string) => {
    const id = ++floaterIdRef.current;
    const x = 10 + Math.random() * 80;
    setFloaters((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloaters((prev) => prev.filter((f) => f.id !== id));
    }, 2500);
  }, []);

  // Step 1: fetch raw stream list from local proxy route (bypasses CF blocks)
  const loadStreams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/stream?source=${encodeURIComponent(sourceParam)}&id=${encodeURIComponent(idParam)}`,
        { headers: { Accept: 'application/json' } },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw: RawStream[] = await res.json();
      // Start with embedUrl as fallback, relay resolved separately
      setStreams(
        raw.map((s) => ({
          streamNo: s.streamNo,
          source: s.source,
          id: s.id,
          embedUrl: s.embedUrl,
          hd: s.hd,
          language: s.language,
        })),
      );
    } catch (e) {
      console.error('[WatchClient] stream list fetch failed:', e);
      setStreams([]);
    } finally {
      setLoading(false);
    }
  }, [sourceParam, idParam]);

  useEffect(() => {
    loadStreams();
  }, [loadStreams]);

  // Step 2: resolve HLS relay for a specific stream via our server API
  const resolveHls = useCallback(
    async (index: number, stream: ResolvedStream) => {
      if (stream.relay || stream.resolveError) return; // already done
      setResolving((prev) => ({ ...prev, [index]: true }));
      try {
        const res = await fetch('/api/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: stream.source,
            id: stream.id,
            stream: stream.streamNo,
          }),
        });
        const data = await res.json();
        setStreams((prev) =>
          prev.map((s, i) =>
            i === index
              ? {
                  ...s,
                  relay: data.ok ? data.relay : undefined,
                  m3u8: data.ok ? data.m3u8 : undefined,
                  resolveError: data.ok ? undefined : data.error,
                }
              : s,
          ),
        );
      } catch (err) {
        setStreams((prev) =>
          prev.map((s, i) =>
            i === index ? { ...s, resolveError: String((err as Error).message) } : s,
          ),
        );
      } finally {
        setResolving((prev) => ({ ...prev, [index]: false }));
      }
    },
    [],
  );

  // Auto-resolve active stream when streams are loaded
  useEffect(() => {
    if (streams.length > 0) {
      setUsingFallback(false);
      resolveHls(activeIndex, streams[activeIndex]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streams.length, activeIndex]);

  // Theater mode
  useEffect(() => {
    document.body.classList.toggle('theater-mode', theaterMode);
    return () => document.body.classList.remove('theater-mode');
  }, [theaterMode]);

  const shareUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://www.flstreams.my.id/watch/${sourceParam}/${idParam}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    } catch {}
  };



  const activeStream = streams[activeIndex];

  return (
    <>
      {theaterMode && (
        <div
          className="fixed inset-0 bg-black/90 z-30"
          onClick={() => setTheaterMode(false)}
          aria-hidden="true"
        />
      )}

      <div className={`flex flex-col lg:flex-row gap-4 ${theaterMode ? 'relative z-40' : ''}`}>
        {/* ── Player column ──────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Player Viewport */}
          <div
            ref={playerRef}
            className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 shadow-2xl group/player"
          >
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 animate-pulse">
                <span className="text-4xl mb-3">📡</span>
                <p className="text-sm">Memuat stream...</p>
              </div>
            ) : !activeStream ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                <span className="text-4xl mb-3">📡</span>
                <p className="font-medium text-slate-400">Stream belum tersedia</p>
                <button
                  onClick={loadStreams}
                  className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-lg transition-colors"
                >
                  Muat Ulang
                </button>
              </div>
            ) : resolving[activeIndex] ? (
              /* Resolving WASM decrypt — show spinner over embed fallback */
              <>
                <iframe
                  src={activeStream.embedUrl}
                  className="absolute inset-0 w-full h-full opacity-30"
                  allowFullScreen
                  title={matchTitle}
                  loading="lazy"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/70 backdrop-blur-sm">
                  <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm text-slate-300">Mendekripsi stream HLS...</p>
                  <p className="text-xs text-slate-500 mt-1">Mohon tunggu ~5 detik</p>
                </div>
              </>
            ) : (
              <HlsPlayer
                key={`${activeIndex}-${activeStream.relay || ''}`}
                relay={activeStream.relay}
                embedUrl={activeStream.embedUrl}
                title={`${matchTitle} — Server ${activeIndex + 1}`}
                usingFallback={usingFallback}
                setUsingFallback={setUsingFallback}
                onVideoMount={onVideoMount}
                onVideoClick={togglePlay}
              />
            )}

            {/* Theater exit */}
            {theaterMode && (
              <button
                onClick={() => setTheaterMode(false)}
                className="absolute top-3 right-3 bg-slate-950/80 hover:bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition-colors z-10"
              >
                ✕ Keluar Bioskop
              </button>
            )}

            {/* Stream quality badge */}
            {activeStream?.relay && !resolving[activeIndex] && !usingFallback && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/50 backdrop-blur-sm px-2 py-1 rounded-lg z-10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-400">HLS NATIVE</span>
              </div>
            )}

            {/* Floating emojis inside the player viewport */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-20" aria-hidden="true">
              {floaters.map((f) => (
                <span
                  key={f.id}
                  className="absolute bottom-16 text-3xl select-none animate-float-up"
                  style={{ left: `${f.x}%` }}
                >
                  {f.emoji}
                </span>
              ))}
            </div>

            {/* Custom controls overlay bar inside the player */}
            {!loading && activeStream && (
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-slate-950/85 backdrop-blur-md border-t border-slate-800/60 flex items-center justify-between px-4 z-30 opacity-100 transition-opacity duration-300">
                {/* Play/volume & status */}
                <div className="flex items-center gap-4">
                  {/* Play/Pause Button */}
                  {!usingFallback && activeStream.relay ? (
                    <button
                      onClick={togglePlay}
                      className="text-slate-400 hover:text-emerald-400 text-xs font-bold leading-none cursor-pointer transition-colors w-4 text-left"
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? '⏸' : '▶'}
                    </button>
                  ) : (
                    <span className="text-slate-650 text-xs select-none">▶</span>
                  )}

                  {/* Volume Control Slider */}
                  {!usingFallback && activeStream.relay ? (
                    <div
                      className="flex items-center gap-2 group/volume relative"
                      onMouseEnter={() => setShowVolumeSlider(true)}
                      onMouseLeave={() => setShowVolumeSlider(false)}
                    >
                      <button
                        onClick={toggleMute}
                        className="text-slate-400 hover:text-emerald-400 text-sm font-bold leading-none cursor-pointer transition-colors"
                        aria-label={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? '🔇' : volume < 0.3 ? '🔈' : volume < 0.7 ? '🔉' : '🔊'}
                      </button>
                      <div className={`transition-all duration-200 overflow-hidden flex items-center h-5 ${showVolumeSlider ? 'w-20 opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={isMuted ? 0 : volume}
                          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                          className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-650 text-sm select-none">🔊</span>
                  )}

                  <span className="text-[9px] text-emerald-400 font-extrabold tracking-widest flex items-center gap-1.5 ml-1 border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {!usingFallback && activeStream.relay ? 'NATIVE SECURE PLAYER' : 'EXTERNAL IFRAME PLAYER'}
                  </span>
                </div>

                {/* Reaction pill */}
                <div className="flex items-center bg-[#090d16]/95 border border-slate-800 px-3 py-1 rounded-full text-[10px] gap-2 shadow-inner">
                  <span className="text-slate-500 font-black tracking-wider uppercase">React:</span>
                  <div className="flex items-center gap-2">
                    {['🌎', '🔥', '😱', '👏', '🏆', '❤️'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReact(emoji)}
                        className="hover:scale-125 active:scale-90 transition-transform duration-100 select-none cursor-pointer text-xs"
                        aria-label={`Reaction ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fullscreen button */}
                <button
                  onClick={toggleFullscreen}
                  className="text-slate-400 hover:text-emerald-400 text-base transition-colors cursor-pointer"
                  aria-label="Fullscreen"
                >
                  ⛶
                </button>
              </div>
            )}
          </div>

          {/* Info box under the player */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 mt-4 flex items-start gap-3">
            <span className="text-emerald-400 text-lg leading-none mt-0.5">ℹ</span>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-200 mb-1">
                Mengalami kendala pemutar kosong? Gunakan Server HLS kami!
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                Beberapa browser memblokir pemutaran langsung dari situs streaming eksternal karena kebijakan keamanan atau CORS. Anda bisa mengganti server pilihan di bawah untuk memuat player yang aman.
              </p>
            </div>
          </div>

          {/* Server switcher section */}
          {!loading && streams.length > 0 && (
            <div className="mt-4 bg-slate-900/20 border border-slate-800/60 p-4 rounded-xl">
              <p className="text-[10px] text-slate-500 mb-3 font-bold uppercase tracking-wider">
                Pilih Server Penayangan (Decrypted HLS / Server Alternatif)
              </p>
              <div className="flex flex-wrap gap-2 animate-fadeIn" role="group" aria-label="Pilih server">
                {streams.map((stream, i) => {
                  const active = !usingFallback && activeIndex === i;
                  const label = `Server ${i + 1} (${i % 2 === 0 ? 'ADMIN' : 'ECHO'} - Ch ${i + 1}) ⚡ (HLS)`;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setActiveIndex(i);
                        setUsingFallback(false);
                        resolveHls(i, stream);
                      }}
                      className={`relative px-4 py-2.5 rounded-lg text-xs font-bold border transition-all ${
                        active
                          ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                          : 'bg-slate-900/60 text-slate-300 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {label}
                      {stream.relay && active && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                      )}
                    </button>
                  );
                })}
                {/* Reserve player button */}
                <button
                  onClick={() => setUsingFallback(true)}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold border transition-all ${
                    usingFallback
                      ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                      : 'bg-slate-900/60 text-slate-300 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  Server Cadangan Player (Vidsrc) 🔗 (Alternatif)
                </button>
              </div>

              {/* Action buttons under switcher */}
              <div className="mt-4 flex flex-wrap items-center gap-2 pt-4 border-t border-slate-800/40">
                <button
                  onClick={() => setTheaterMode((v) => !v)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  {theaterMode ? 'Nyalakan Lampu' : 'Mode Bioskop (Theater)'}
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {shareStatus === 'copied' ? '✅ Disalin!' : '🔗 Salin Link'}
                </button>
              </div>
            </div>
          )}

          {/* Match Title and live status footer */}
          <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[9px] bg-red-500/10 text-red-500 font-bold px-2 py-0.5 rounded border border-red-500/20 uppercase tracking-wider flex items-center gap-1.5 w-max mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Sedang Berlangsung
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                {cleanMatchTitle(idParam)}
              </h2>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Now
              </span>
            </div>
          </div>

          {/* Ad mobile */}
          <div className="mt-6 flex justify-center lg:hidden">
            <AdsterraAd format="rectangle-300x250" />
          </div>
        </div>

        {/* ── Chat column ────────────────────────────────────────────── */}
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

// ── Match Title formatter ─────────────────────────────────────────────────────
function cleanMatchTitle(id: string): string {
  // e.g. "tampa-bay-rays-vs-new-york-yankees-2388258"
  // remove any trailing numbers (e.g. 2388258)
  let clean = id.replace(/-\d+$/, '');

  // replace "ppv-" prefix
  let isPpv = false;
  if (clean.startsWith('ppv-')) {
    isPpv = true;
    clean = clean.substring(4);
  }

  // split by "-vs-" or "vs"
  const parts = clean.split('-vs-');
  if (parts.length === 2) {
    const home = parts[0].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const away = parts[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return `${isPpv ? 'PPV: ' : ''}${home} vs ${away}`;
  }

  // general fallback: capitalize all words
  return clean.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
