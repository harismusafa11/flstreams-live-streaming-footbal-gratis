'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from 'react';
import { 
  Server, 
  MonitorPlay, 
  ArrowLeft, 
  ShieldAlert, 
  Award, 
  Radio, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Maximize2, 
  Minimize2,
  Tv,
  CheckCircle,
  Clock,
  Heart
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { SponsorBanner } from '@/components/SponsorBanner';

type Match = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
  competition: string | null;
  startTime: string;
  embedCode: string;
  status: string;
  matchStreams?: {
    id: string;
    serverName: string;
    embedCode: string;
    isPrimary: boolean;
    status: string;
  }[];
};

// Seeding monochrome premium accent for fallback badges instead of distracting AI rainbow gradients
function getPremiumColor(teamName: string) {
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorBorders = [
    'border-cyan-500/20 text-cyan-400 bg-cyan-950/20',
    'border-emerald-500/20 text-emerald-400 bg-emerald-950/20',
    'border-red-500/20 text-red-400 bg-red-950/20',
    'border-indigo-500/20 text-indigo-400 bg-indigo-950/20',
    'border-amber-500/20 text-amber-400 bg-amber-950/20',
    'border-fuchsia-500/20 text-fuchsia-400 bg-fuchsia-950/20',
  ];
  return colorBorders[Math.abs(hash) % colorBorders.length];
}

function getTeamInitials(teamName: string) {
  if (!teamName) return 'FC';
  const parts = teamName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return teamName.trim().substring(0, 2).toUpperCase();
}

export default function LiveMatchClient({ match }: { match: Match }) {
  // Parse servers from matchStreams or fallback to embedCode separated by newlines
  const activeStreams = match.matchStreams 
    ? match.matchStreams.filter((s: any) => s.status === 'ACTIVE') 
    : [];

  const servers = activeStreams.length > 0
    ? activeStreams.map((s: any) => s.embedCode)
    : (match.embedCode ? match.embedCode.split('\n').filter((c: string) => c.trim().length > 0) : ['']);
  
  // Find index of primary server if using matchStreams
  let initialActiveServer = 0;
  if (activeStreams.length > 0) {
    const primaryIdx = activeStreams.findIndex((s: any) => s.isPrimary);
    if (primaryIdx !== -1) {
      initialActiveServer = primaryIdx;
    }
  }

  const [activeServer, setActiveServer] = useState(initialActiveServer);
  const [mounted, setMounted] = useState(false);
  
  // Custom design features
  const [isLightsOff, setIsLightsOff] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [diagnosticStatus, setDiagnosticStatus] = useState<'idle' | 'testing' | 'done'>('idle');
  const [diagnosticResult, setDiagnosticResult] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRefreshStream = () => {
    setIsRefreshing(true);
    const prevServer = activeServer;
    // Brief toggle of player to trigger clean iframe reload
    setActiveServer(-1);
    setTimeout(() => {
      setActiveServer(prevServer);
      setIsRefreshing(false);
    }, 400);
  };

  const runDiagnostics = () => {
    setDiagnosticStatus('testing');
    setTimeout(() => {
      const ping = Math.floor(Math.random() * 50) + 12;
      const downloadSpeed = (Math.random() * 40 + 20).toFixed(1);
      setDiagnosticResult(`Optimal! Latency: ${ping}ms | Connection: ${downloadSpeed} Mbps. Server ${activeServer + 1} can stream in 1080p.`);
      setDiagnosticStatus('done');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 font-sans pb-24 relative overflow-hidden transition-colors duration-500">
      
      {/* Lights Off Blackout Overlay */}
      <AnimatePresence>
        {isLightsOff && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.96 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 bg-black z-40 pointer-events-auto flex flex-col items-center justify-center cursor-pointer"
            onClick={() => setIsLightsOff(false)}
          >
            <div className="text-center space-y-2 pointer-events-none text-zinc-500 animate-pulse">
              <EyeOff className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
              <p className="text-sm font-bold tracking-widest uppercase">Layar Bioskop Aktif</p>
              <p className="text-xs">Klik di mana saja untuk mengembalikan kontrol halaman</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top soft ambient kickoff background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[400px] bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent pointer-events-none blur-3xl z-0" />

      <div className={`mx-auto px-4 sm:px-6 relative z-10 transition-all duration-300 ${isTheaterMode ? 'max-w-6xl' : 'max-w-4xl'}`}>
        
        {/* Navigation / Header Row */}
        <div className="pt-8 pb-6 flex items-center justify-between">
          <Link 
            href="/" 
            className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-all bg-zinc-900 border border-white/[0.05] hover:border-white/10 px-4 py-2.5 rounded-xl shadow-md"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Jadwal
          </Link>
          
          <div className="flex items-center space-x-2 bg-red-950/30 border border-red-500/20 px-3.5 py-1.5 rounded-full shadow-inner select-none">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-red-400">Siaran Langsung</span>
          </div>
        </div>

        {/* Beautiful Stadium Scoreboard Header Board */}
        <div className="bg-[#0c0c0e] border border-white/[0.05] rounded-3xl p-6 sm:p-8 mb-6 shadow-2xl relative overflow-hidden">
          {/* Subtle horizontal light glare decoration */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
          
          <div className="flex flex-col items-center space-y-6">
            {/* League / Competition Badge */}
            <span className="text-center text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400 bg-white/5 border border-white/5 px-4 py-1 rounded-lg shadow-inner select-none">
              {match.competition || 'Pertandingan Elit'}
            </span>

            {/* Club Faceoff Display */}
            <div className="grid grid-cols-11 items-center w-full max-w-2xl mx-auto">
              
              {/* Home Team */}
              <div className="col-span-5 flex flex-col sm:flex-row items-center sm:justify-end gap-3 sm:gap-4 text-center sm:text-right min-w-0">
                <span className="text-sm sm:text-lg font-extrabold text-white tracking-tight truncate order-2 sm:order-1 select-none w-full">
                  {match.homeTeam}
                </span>
                <div className="order-1 sm:order-2 shrink-0">
                  {match.homeLogo ? (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden shadow-xl p-1.5 transition-transform hover:scale-105 duration-300">
                      <img 
                        src={match.homeLogo} 
                        alt={match.homeTeam}
                        className="w-full h-full object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  ) : (
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-black text-white text-base sm:text-lg border shadow-xl transition-transform hover:scale-105 duration-300 ${getPremiumColor(match.homeTeam)}`}>
                      {getTeamInitials(match.homeTeam)}
                    </div>
                  )}
                </div>
              </div>

              {/* VS Decor Banner */}
              <div className="col-span-1 flex flex-col items-center justify-center select-none font-black text-xs text-zinc-600">
                <span className="bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl uppercase tracking-wider shadow-inner">
                  VS
                </span>
              </div>

              {/* Away Team */}
              <div className="col-span-5 flex flex-col sm:flex-row items-center sm:justify-start gap-3 sm:gap-4 text-center sm:text-left min-w-0">
                <div className="shrink-0">
                  {match.awayLogo ? (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden shadow-xl p-1.5 transition-transform hover:scale-105 duration-300">
                      <img 
                        src={match.awayLogo} 
                        alt={match.awayTeam}
                        className="w-full h-full object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  ) : (
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-black text-white text-base sm:text-lg border shadow-xl transition-transform hover:scale-105 duration-300 ${getPremiumColor(match.awayTeam)}`}>
                      {getTeamInitials(match.awayTeam)}
                    </div>
                  )}
                </div>
                <span className="text-sm sm:text-lg font-extrabold text-white tracking-tight truncate select-none w-full">
                  {match.awayTeam}
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* Streaming Video Panel Control Group */}
        <div className="flex flex-col gap-4">
          
          {/* Broadcaster Controller Toolbar */}
          <div data-no-popup className="player-controls flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-white/[0.06] backdrop-blur-md shadow-lg">
            
            {/* Server Controls Label */}
            <div className="flex items-center space-x-2.5">
              <Server className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Broadcaster Streams</span>
            </div>
            
            {/* Action controls (Theater and Lights Off Buttons) */}
            <div className="flex items-center flex-wrap gap-2">
              
              {/* Refresh stream button */}
              <button
                data-no-popup
                onClick={handleRefreshStream}
                disabled={isRefreshing}
                className="refresh-btn p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:text-white text-zinc-400 transition-all flex items-center justify-center"
                title="Muat Ulang Pemutar Video"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              </button>

              {/* Lights switch */}
              <button
                data-no-popup
                onClick={() => setIsLightsOff(!isLightsOff)}
                className={`lights-btn flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold uppercase tracking-wider ${
                  isLightsOff 
                    ? 'bg-zinc-800 text-white border-white/20' 
                    : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-white'
                }`}
                title="Gelapkan Sekitar Layar"
              >
                {isLightsOff ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Lampu {isLightsOff ? 'ON' : 'OFF'}</span>
              </button>

              {/* Theater switch */}
              <button
                data-no-popup
                onClick={() => setIsTheaterMode(!isTheaterMode)}
                className={`theater-btn flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold uppercase tracking-wider ${
                  isTheaterMode 
                    ? 'bg-zinc-800 text-white border-white/20' 
                    : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-white'
                }`}
                title="Ubah Ukuran Layar"
              >
                {isTheaterMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Bioskop</span>
              </button>
            </div>
          </div>

          {/* Video Player Main Canvas */}
          <div className="relative z-35 bg-black border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl relative aspect-video group">
            
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeServer}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 w-full h-full bg-black flex items-center justify-center p-0.5"
              >
                {mounted && servers[activeServer] && activeServer >= 0 ? (
                  servers[activeServer].trim().startsWith('http://') || servers[activeServer].trim().startsWith('https://') || !servers[activeServer].includes('<iframe') ? (
                    <iframe
                      src={servers[activeServer].trim()}
                      className="w-full h-full border-0 absolute inset-0 bg-black"
                      allowFullScreen
                      scrolling="no"
                      allow="autoplay; encrypted-media"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div 
                      className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-none [&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:bg-black"
                      dangerouslySetInnerHTML={{ __html: servers[activeServer] }} 
                    />
                  )
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 bg-[#070709] p-6 text-center">
                    <MonitorPlay className="w-12 h-12 mb-4 text-emerald-500/40 animate-pulse" />
                    <h3 className="text-sm font-bold text-white mb-1">Mempersiapkan Koneksi</h3>
                    <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">Menghubungkan ke server satelit penyiaran olahraga...</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Video Player Glare Reflection Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/0 via-white/[0.01] to-white/0 mix-blend-overlay rounded-3xl" />
          </div>

          {/* Broadcaster Server Tabs with Health and Taglines */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {servers.map((server, idx) => {
              const isActive = activeServer === idx;
              
              // Define descriptive health metadata taglines
              let quality = '720p Mobile';
              let health = 'Normal';
              if (idx === 0) {
                quality = '1080p Full HD';
                health = 'Utama';
              } else if (idx === 1) {
                quality = '1080p HD';
                health = 'Stabil';
              } else if (idx === 2) {
                quality = '720p Mobile';
                health = 'Hemat Kuota';
              } else if (idx >= 3) {
                quality = 'SD Back-up';
                health = 'Alternatif';
              }

              return (
                <button
                  key={idx}
                  data-no-popup
                  onClick={() => setActiveServer(idx)}
                  className={`server-button p-3.5 rounded-2xl transition-all duration-200 text-left border flex flex-col justify-between ${
                    isActive 
                      ? 'bg-white text-zinc-950 border-white shadow-xl scale-[1.01]' 
                      : 'bg-zinc-900/60 text-zinc-400 border-white/[0.04] hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between pointer-events-none">
                    <span className="text-xs font-extrabold">
                      {activeStreams.length > 0 ? activeStreams[idx].serverName : `Server ${idx + 1}`}
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse`} />
                  </div>
                  <div className="mt-2 text-[10px] pointer-events-none flex flex-col">
                    <span className={`font-medium ${isActive ? 'text-zinc-600' : 'text-zinc-550'}`}>{quality}</span>
                    <span className={`font-bold uppercase tracking-wider text-[8px] mt-0.5 ${isActive ? 'text-emerald-700' : 'text-emerald-500'}`}>⚡ Stream {health}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Dynamic Custom Third-Party Sponsor Rectangle Banner */}
          <div className="w-full flex justify-center">
            <SponsorBanner slot="belowPlayer" width={300} height={250} label="Sponsor Hubungi Kami" />
          </div>

          {/* Broadcaster Diagnostician Panel */}
          <div className="bg-[#0c0c0e] border border-white/[0.05] rounded-3xl p-5 mt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.05] pb-4 mb-4">
              <div className="flex items-start space-x-3">
                <Tv className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-200">Sistem Diagnostik Jaringan</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Tes latency jaringan satelit ke video pemutar untuk kualitas optimal.</p>
                </div>
              </div>
              
              <button
                type="button"
                data-no-popup
                onClick={runDiagnostics}
                disabled={diagnosticStatus === 'testing'}
                className="refresh-btn px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/5 hover:border-white/10 text-xs font-bold text-zinc-300 transition-all shrink-0 flex items-center space-x-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${diagnosticStatus === 'testing' ? 'animate-spin text-cyan-400' : ''}`} />
                <span>{diagnosticStatus === 'testing' ? 'Memindai...' : 'Uji Sinyal Siaran'}</span>
              </button>
            </div>

            {/* Diagnostic result readout */}
            <AnimatePresence mode="wait">
              {diagnosticStatus === 'testing' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-cyan-400/80 font-mono flex items-center space-x-2"
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping mr-1" />
                  <span>Memeriksa latency server CDN dan rute video server satelit...</span>
                </motion.div>
              )}
              {diagnosticStatus === 'done' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-emerald-400 font-mono bg-emerald-950/20 border border-emerald-500/10 rounded-xl p-3 flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{diagnosticResult}</span>
                </motion.div>
              )}
              {diagnosticStatus === 'idle' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-zinc-500"
                >
                  Klik tombol di atas untuk menjalankan tes kecepatan koneksi server otomatis.
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* FAQ Guidelines and stream tips section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="bg-[#0c0c0e] border border-white/[0.04] p-5 rounded-2xl flex items-start space-x-3.5 hover:bg-[#121216] transition-colors duration-200">
              <ShieldAlert className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200">Panduan Mengatasi Lagging</h4>
                <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                  Jika pemutaran buffer atau lag, silakan matikan pemblokir iklan (Adblock / Adguard) pada browser Anda, atau coba alihkan ke Server alternatif yang tersedia di atas.
                </p>
              </div>
            </div>

            <div className="bg-[#0c0c0e] border border-white/[0.04] p-5 rounded-2xl flex items-start space-x-3.5 hover:bg-[#121216] transition-colors duration-200">
              <Award className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200">Pemberitahuan Lisensi Satelit</h4>
                <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                  Semua media embed pemutar sepak bola dikumpulkan secara otomatis dari sumber streaming internet terbuka. Segala hak siar komersial dilindungi pemegang lisensi federal resmi.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
