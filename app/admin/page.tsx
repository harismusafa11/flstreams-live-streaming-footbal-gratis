'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, Tv, Trash2, ShieldCheck, Activity, CalendarDays, ExternalLink, RefreshCw, Layers, Pencil, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { formatToWIB } from '@/lib/utils';

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
  isFeatured?: boolean;
};

export default function AdminPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [homeLogo, setHomeLogo] = useState('');
  const [awayLogo, setAwayLogo] = useState('');
  const [competition, setCompetition] = useState('');
  const [startTime, setStartTime] = useState('');
  const [serversList, setServersList] = useState<string[]>(['']);
  const [status, setStatus] = useState('SCHEDULED');
  const [isFeatured, setIsFeatured] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/matches?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setMatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMatches();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeServers = serversList.filter(s => s.trim().length > 0);
    if (!homeTeam || !awayTeam || !startTime || activeServers.length === 0) return;
    setSubmitting(true);

    try {
      // Treat the local datetime-local value as explicitly in Western Indonesian Time (WIB / GMT+7)
      let formattedStartTime = startTime;
      try {
        if (startTime.includes('T') && !startTime.includes('+') && !startTime.endsWith('Z')) {
          formattedStartTime = new Date(startTime + ':00+07:00').toISOString();
        } else {
          formattedStartTime = new Date(startTime).toISOString();
        }
      } catch (dateErr) {
        console.error("Format date error:", dateErr);
      }

      const payload = {
        homeTeam,
        awayTeam,
        homeLogo: homeLogo || null,
        awayLogo: awayLogo || null,
        competition: competition || 'Football Special',
        startTime: formattedStartTime,
        embedCode: activeServers.join('\n'),
        status,
        isFeatured,
      };

      let response;
      if (editingId) {
        // Edit Mode
        response = await fetch(`/api/matches/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create Mode
        response = await fetch('/api/matches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Gagal menyimpan perubahan ke server.');
      }

      fetchMatches();
      // Reset form
      setHomeTeam(''); 
      setAwayTeam(''); 
      setHomeLogo('');
      setAwayLogo('');
      setCompetition('');
      setStartTime(''); 
      setServersList(['']); 
      setStatus('SCHEDULED');
      setIsFeatured(false);
      setEditingId(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Terjadi kesalahan saat menyimpan data stream. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditMatch = (match: Match) => {
    setEditingId(match.id);
    setHomeTeam(match.homeTeam);
    setAwayTeam(match.awayTeam);
    setHomeLogo(match.homeLogo || '');
    setAwayLogo(match.awayLogo || '');
    setCompetition(match.competition || '');
    
    try {
      const d = new Date(match.startTime);
      const wibShifted = new Date(d.getTime() + (7 * 3600 * 1000));
      const year = wibShifted.getUTCFullYear();
      const month = String(wibShifted.getUTCMonth() + 1).padStart(2, '0');
      const day = String(wibShifted.getUTCDate()).padStart(2, '0');
      const hours = String(wibShifted.getUTCHours()).padStart(2, '0');
      const minutes = String(wibShifted.getUTCMinutes()).padStart(2, '0');
      setStartTime(`${year}-${month}-${day}T${hours}:${minutes}`);
    } catch (err) {
      setStartTime('');
    }
    
    const embedCodeStr = match.embedCode || '';
    setServersList(embedCodeStr.split('\n'));
    setStatus(match.status);
    setIsFeatured(match.isFeatured || false);
  };

  const cancelEditMatch = () => {
    setEditingId(null);
    setHomeTeam(''); 
    setAwayTeam(''); 
    setHomeLogo('');
    setAwayLogo('');
    setCompetition('');
    setStartTime(''); 
    setServersList(['']); 
    setStatus('SCHEDULED');
    setIsFeatured(false);
  };

  const deleteMatch = async (id: string) => {
    try {
      await fetch(`/api/matches/${id}`, { method: 'DELETE' });
      fetchMatches();
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/matches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchMatches();
    } catch (err) {
      console.error(err);
    }
  };

  const updateFeatured = async (id: string, newFeatured: boolean) => {
    try {
      await fetch(`/api/matches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: newFeatured }),
      });
      fetchMatches();
    } catch (err) {
      console.error(err);
    }
  };

  const liveMatches = Array.isArray(matches) ? matches.filter(m => m.status === 'LIVE') : [];
  const scheduledMatches = Array.isArray(matches) ? matches.filter(m => m.status === 'SCHEDULED') : [];

  return (
    <div className="min-h-screen bg-[#060608] text-slate-100 font-sans selection:bg-red-500/30 selection:text-white">
      {/* Dynamic top gradient line */}
      <div className="h-[3px] bg-gradient-to-r from-cyan-500 via-violet-600 to-red-500"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Navigation & Title Header */}
        <header className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-8">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-cyan-500 to-indigo-500 p-2.5 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0">
              <Tv className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center">
                Admin Control <span className="text-cyan-400 ml-2 font-medium text-xs tracking-wider uppercase bg-cyan-950/40 border border-cyan-500/20 px-2.5 py-1 rounded">Channel Deck</span>
              </h1>
              <p className="text-xs text-white/40 mt-1">Manage matches, update streaming server scripts, & change broadcast statuses</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchMatches}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-300 hover:text-white transition-all flex items-center"
              title="Refresh lists"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link 
              href="/" 
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-white to-slate-200 text-black px-5 py-3 rounded-2xl font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md"
            >
              <span>View Match Gateway</span>
              <ExternalLink className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </header>

        {/* Dashboard Quick Status Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white/40 uppercase tracking-widest block">Registered Matches</span>
              <span className="text-3xl font-extrabold text-white mt-1 block">{matches.length}</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-white">
              <Tv className="w-5 h-5" />
            </div>
          </div>
          
          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white/40 uppercase tracking-widest block">Broadcasts Live</span>
              <span className="text-3xl font-extrabold text-red-500 mt-1 block">{liveMatches.length}</span>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white/40 uppercase tracking-widest block">Upcoming Fixtures</span>
              <span className="text-3xl font-extrabold text-cyan-400 mt-1 block">{scheduledMatches.length}</span>
            </div>
            <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Main SidebySide Deck Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Creator form column */}
          <div className="lg:col-span-5">
            <div className="bg-gradient-to-b from-[#0d0d10] to-[#08080a] p-6 rounded-3xl border border-white/10 shadow-xl">
              <h2 className="text-lg font-extrabold mb-6 flex items-center text-white select-none">
                {editingId ? (
                  <>
                    <Pencil className="mr-2 h-5 w-5 text-amber-400 animate-pulse" /> Edit Broadcast Channel
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-5 w-5 text-cyan-400" /> Create Broadcast Channel
                  </>
                )}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">League / Competition</label>
                  <input 
                    type="text" 
                    value={competition} 
                    onChange={e => setCompetition(e.target.value)} 
                    placeholder="e.g. Premier League, Champions League" 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/40 focus:bg-black/80 transition-all text-white placeholder-white/20"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Home Team</label>
                    <input 
                      type="text" 
                      required 
                      value={homeTeam} 
                      onChange={e => setHomeTeam(e.target.value)} 
                      placeholder="e.g. Real Madrid"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/40 focus:bg-black/80 transition-all text-white placeholder-white/20 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Away Team</label>
                    <input 
                      type="text" 
                      required 
                      value={awayTeam} 
                      onChange={e => setAwayTeam(e.target.value)} 
                      placeholder="e.g. Barcelona"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/40 focus:bg-black/80 transition-all text-white placeholder-white/20 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center">
                      <span>Home Logo URL</span>
                      <span className="text-[9px] text-slate-500 font-normal tracking-normal normal-case ml-1.5">(Optional)</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="url" 
                        value={homeLogo} 
                        onChange={e => setHomeLogo(e.target.value)} 
                        placeholder="https://.../logo.png"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-cyan-500/40 focus:bg-black/80 transition-all text-white placeholder-white/25 min-w-0"
                      />
                      {homeLogo && (
                        <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-inner">
                          <Image 
                            src={homeLogo} 
                            alt="" 
                            width={32}
                            height={32}
                            className="w-full h-full object-contain" 
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center">
                      <span>Away Logo URL</span>
                      <span className="text-[9px] text-slate-500 font-normal tracking-normal normal-case ml-1.5">(Optional)</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="url" 
                        value={awayLogo} 
                        onChange={e => setAwayLogo(e.target.value)} 
                        placeholder="https://.../logo.png"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-cyan-500/40 focus:bg-black/80 transition-all text-white placeholder-white/25 min-w-0"
                      />
                      {awayLogo && (
                        <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-inner">
                          <Image 
                            src={awayLogo} 
                            alt="" 
                            width={32}
                            height={32}
                            className="w-full h-full object-contain" 
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Fixture Kickoff (Local Time)</label>
                  <input 
                    type="datetime-local" 
                    required 
                    value={startTime} 
                    onChange={e => setStartTime(e.target.value)} 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/40 focus:bg-black/80 transition-all text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Initial Broadcast Status</label>
                  <select 
                    value={status} 
                    onChange={e => setStatus(e.target.value)} 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/40 focus:bg-black/80 transition-all text-slate-300"
                  >
                    <option value="SCHEDULED">Scheduled (Displays Countdown)</option>
                    <option value="LIVE">Live (Watch Button Active) </option>
                    <option value="COMPLETED">Completed (Archived / Hidden)</option>
                  </select>
                </div>

                <div className="bg-red-950/15 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between transition-all hover:bg-red-950/20">
                  <div className="flex flex-col pr-4">
                    <span className="text-xs font-extrabold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      Laga Utama / Hot Match
                    </span>
                    <span className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed">Sematkan di baris teratas beranda user agar ramai ditonton.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      checked={isFeatured}
                      onChange={e => setIsFeatured(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500 peer-checked:after:bg-white peer-checked:after:border-transparent"></div>
                  </label>
                </div>

                {/* Dynamic Server Embed Streams (Max 10) */}
                <div>
                  <div className="flex items-center justify-between mb-2 mt-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                      Server Streams (Embed Code / iFrame)
                    </label>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase">
                      {serversList.length} / 10 Servers
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                    {serversList.map((server, index) => (
                      <div key={index} className="bg-black/25 p-3.5 rounded-2xl border border-white/5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-cyan-400/80">
                            Server {index + 1} {index === 0 && <span className="text-[10px] text-slate-500 font-medium">(Primary)</span>}
                          </span>
                          {serversList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newList = [...serversList];
                                newList.splice(index, 1);
                                setServersList(newList);
                              }}
                              className="text-white/30 hover:text-red-500 transition-colors text-xs font-semibold hover:bg-red-500/10 p-1 px-2 rounded-lg"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                        <textarea
                          required={index === 0}
                          rows={index === 0 ? 3 : 2}
                          value={server}
                          onChange={(e) => {
                            const newList = [...serversList];
                            newList[index] = e.target.value;
                            setServersList(newList);
                          }}
                          className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-[11px] font-mono focus:outline-none focus:border-cyan-500/40 focus:bg-black/90 transition-all text-emerald-400 placeholder-white/10 leading-relaxed"
                          placeholder={
                            index === 0 
                              ? "<iframe src='...' width='100%' height='100%' allowfullscreen></iframe>"
                              : `Masukkan kode embed server ${index + 1}`
                          }
                        />
                      </div>
                    ))}
                  </div>

                  {serversList.length < 10 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (serversList.length < 10) {
                          setServersList([...serversList, '']);
                        }
                      }}
                      className="w-full mt-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center justify-center space-x-1"
                    >
                      <Plus className="w-4 h-4 mr-1 text-cyan-400 animate-pulse" /> Tambah Server Penyiaran Baru (Maksimal 10)
                    </button>
                  )}
                  <p className="text-[10px] text-white/30 mt-2 leading-relaxed">
                    💡 Pastikan menulis kode iFrame atau link streaming pemutar video yang valid untuk setiap server.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  {editingId && (
                    <button
                      type="button"
                      onClick={cancelEditMatch}
                      className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-extrabold py-3.5 px-4 rounded-xl transition-all border border-white/5 flex items-center justify-center space-x-2"
                    >
                      <X className="w-4 h-4 text-red-500" />
                      <span>Batal Edit</span>
                    </button>
                  )}
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className={`flex-1 font-extrabold py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 ${
                      editingId 
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black' 
                        : 'bg-white hover:bg-slate-200 text-black'
                    }`}
                  >
                    {editingId ? (
                      <>
                        <Pencil className="w-4 h-4 text-black" />
                        <span>{submitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>{submitting ? 'Saving Channel...' : 'Generate Stream Channel'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Records list column */}
          <div className="lg:col-span-7">
            <div className="bg-[#0d0d10] p-6 rounded-3xl border border-white/10 shadow-xl min-h-[400px]">
              <h2 className="text-lg font-extrabold mb-6 flex items-center text-white justify-between">
                <span className="flex items-center"><Tv className="mr-2 h-5 w-5 text-indigo-400" /> Channels Ledger</span>
                <span className="text-xs bg-white/5 border border-white/10 p-1.5 rounded-lg text-slate-400 font-medium">Auto-Refresh Active</span>
              </h2>
              
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
                  <p className="text-sm">Retrieving matches from database...</p>
                </div>
              ) : matches.length === 0 ? (
                <div className="text-center py-24 text-slate-500 border border-white/5 bg-black/20 rounded-2xl flex flex-col items-center justify-center p-6">
                  <Tv className="w-12 h-12 text-slate-700 mb-4" />
                  <h3 className="text-sm font-extrabold text-white">No active channels</h3>
                  <p className="text-xs mt-1 text-slate-500 max-w-xs leading-relaxed">Fill out the creator console on the left to set up live or upcoming matches immediately.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {matches.map(match => (
                    <motion.div 
                      key={match.id} 
                      layoutId={match.id}
                      className="border border-white/5 bg-[#0f0f13] hover:bg-[#121217] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white/5 border border-white/15 px-2 py-0.5 rounded">
                            {match.competition || 'Elite Football'}
                          </span>
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            match.status === 'LIVE' ? 'bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse' :
                            match.status === 'COMPLETED' ? 'bg-white/5 text-white/40 border border-white/10' :
                            'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          }`}>
                            {match.status}
                          </span>
                          {match.isFeatured && (
                            <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-red-600 text-white flex items-center gap-1 shadow-md shadow-red-900/30 animate-pulse">
                              <span>🔥</span> <span>Hot Laga</span>
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                          {match.homeLogo && (
                            <Image src={match.homeLogo} alt="" width={20} height={20} className="w-5 h-5 object-contain rounded-lg bg-white/10 p-0.5" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          )}
                          <span className="text-sm sm:text-base font-bold text-white">{match.homeTeam}</span>
                          
                          <span className="text-xs font-black text-slate-600 px-0.5">VS</span>
                          
                          {match.awayLogo && (
                            <Image src={match.awayLogo} alt="" width={20} height={20} className="w-5 h-5 object-contain rounded-lg bg-white/10 p-0.5" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          )}
                          <span className="text-sm sm:text-base font-bold text-white">{match.awayTeam}</span>
                        </div>
                        
                        <div className="flex flex-wrap items-center text-xs text-white/40 mt-3 gap-x-4 gap-y-1">
                          <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1.5 text-white/30" /> {formatToWIB(match.startTime, 'MMM d, yyyy')}</span>
                          <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1.5 text-white/30" /> {formatToWIB(match.startTime, 'HH:mm')}</span>
                        </div>
                      </div>
                      
                      {/* Controller Controls / Actions */}
                      <div className="flex flex-wrap items-center gap-3 shrink-0 border-t border-white/5 pt-4 md:pt-0 md:border-none">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-white/30 uppercase font-black tracking-wider mb-1">Promo Keatas</span>
                          <button
                            onClick={() => updateFeatured(match.id, !match.isFeatured)}
                            className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 border h-9 ${
                              match.isFeatured 
                                ? 'bg-red-600 border-red-500 hover:bg-red-700 text-white animate-pulse' 
                                : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                            title={match.isFeatured ? "Turunkan dari posisi teratas" : "Naikkan ke posisi teratas"}
                          >
                            <span>🔥</span>
                            <span>{match.isFeatured ? "Hot" : "Naik"}</span>
                          </button>
                        </div>

                        <div className="flex flex-col">
                          <span className="text-[9px] text-white/30 uppercase font-black tracking-wider mb-1">Modify Status</span>
                          <select 
                            value={match.status} 
                            onChange={(e) => updateStatus(match.id, e.target.value)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none transition-all ${
                              match.status === 'LIVE' ? 'bg-red-950/40 text-red-500 border-red-500/30' :
                              match.status === 'COMPLETED' ? 'bg-white/5 text-white/40 border-white/10' :
                              'bg-cyan-950/40 text-cyan-400 border-cyan-500/20'
                            }`}
                          >
                            <option value="SCHEDULED">Scheduled</option>
                            <option value="LIVE">🔴 Live</option>
                            <option value="COMPLETED">✅ Completed</option>
                          </select>
                        </div>

                        <div className="flex flex-col">
                          <span className="text-[9px] text-white/30 uppercase font-black tracking-wider mb-1">Edit Info</span>
                          <button 
                            onClick={() => startEditMatch(match)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border h-9 flex items-center justify-center gap-1 transition-all ${
                              editingId === match.id
                                ? 'bg-amber-500 border-amber-400 text-black shadow-md shadow-amber-500/20'
                                : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                            title="Edit Channel Details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Ubah</span>
                          </button>
                        </div>

                        <div className="flex flex-col">
                          <span className="text-[9px] text-white/30 uppercase font-black tracking-wider mb-1">Tindakan</span>
                          {deleteConfirmId === match.id ? (
                            <div className="flex items-center space-x-1 h-9">
                              <button
                                onClick={() => {
                                  deleteMatch(match.id);
                                  setDeleteConfirmId(null);
                                }}
                                className="px-2.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all h-full flex items-center justify-center gap-1"
                                title="Konfirmasi hapus secara permanen"
                              >
                                Ya, Hapus!
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all h-full flex items-center justify-center"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setDeleteConfirmId(match.id)} 
                              className="p-2 bg-zinc-900 border border-white/5 text-white/40 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/25 rounded-xl transition-all h-9 flex items-center justify-center shadow-sm"
                              title="Delete Channel"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
