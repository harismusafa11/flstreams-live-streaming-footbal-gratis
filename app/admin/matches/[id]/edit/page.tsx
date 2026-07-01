// app/admin/matches/[id]/edit/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Tv, Sparkles, Plus, AlertTriangle, ArrowLeft, RefreshCw, Laptop } from 'lucide-react';
import Link from 'next/link';

export default function EditMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [teams, setTeams] = useState<any[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields State
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [leagueId, setLeagueId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [timezone, setTimezone] = useState('Asia/Jakarta');
  const [venue, setVenue] = useState('');
  const [referee, setReferee] = useState('');
  const [round, setRound] = useState('');
  const [status, setStatus] = useState('SCHEDULED');

  // Features
  const [isHot, setIsHot] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  // Streaming Servers (1 to 10)
  const [streams, setStreams] = useState<any[]>([]);

  // SEO Metadata
  const [slug, setSlug] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [robots, setRobots] = useState('index, follow');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [ogImage, setOgImage] = useState('');

  // Fetch Master Data & Match Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamsRes, leaguesRes, matchRes] = await Promise.all([
          fetch('/api/teams'),
          fetch('/api/leagues'),
          fetch(`/api/matches/${id}?t=${Date.now()}`)
        ]);

        const teamsData = await teamsRes.json();
        const leaguesData = await leaguesRes.json();
        const matchData = await matchRes.json();

        setTeams(Array.isArray(teamsData) ? teamsData.filter((t: any) => t.active) : []);
        setLeagues(Array.isArray(leaguesData) ? leaguesData.filter((l: any) => l.active) : []);

        if (matchData && !matchData.error) {
          setHomeTeamId(matchData.homeTeamId || '');
          setAwayTeamId(matchData.awayTeamId || '');
          setLeagueId(matchData.leagueId || '');
          setTimezone(matchData.timezone || 'Asia/Jakarta');
          setVenue(matchData.venue || '');
          setReferee(matchData.referee || '');
          setRound(matchData.round || '');
          setStatus(matchData.status || 'SCHEDULED');
          setIsHot(matchData.isHot || false);
          setIsFeatured(matchData.isFeatured || false);

          // Format Date to YYYY-MM-DDTHH:MM
          if (matchData.startTime) {
            const d = new Date(matchData.startTime);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            setStartTime(`${year}-${month}-${day}T${hours}:${minutes}`);
          }

          // Populate Streams
          if (Array.isArray(matchData.matchStreams) && matchData.matchStreams.length > 0) {
            setStreams(matchData.matchStreams.map((s: any) => ({
              serverName: s.serverName,
              embedCode: s.embedCode,
              isPrimary: s.isPrimary,
              status: s.status
            })));
          } else {
            setStreams([{ serverName: 'Server 1 HD', embedCode: '', isPrimary: true, status: 'ACTIVE' }]);
          }

          // Populate SEO
          if (matchData.seoMetadata) {
            const seo = matchData.seoMetadata;
            setSlug(seo.slug || '');
            setMetaTitle(seo.metaTitle || '');
            setMetaDescription(seo.metaDescription || '');
            setCanonicalUrl(seo.canonicalUrl || '');
            setRobots(seo.robots || 'index, follow');
            setFocusKeyword(seo.focusKeyword || '');
            setOgTitle(seo.ogTitle || '');
            setOgDescription(seo.ogDescription || '');
            setOgImage(seo.ogImage || '');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Slugifier helper
  const slugify = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Generate SEO Click Handler
  const handleGenerateSEO = () => {
    const homeTeam = teams.find(t => t.id === homeTeamId);
    const awayTeam = teams.find(t => t.id === awayTeamId);
    const league = leagues.find(l => l.id === leagueId);

    if (!homeTeam || !awayTeam || !league) {
      alert('Mohon pilih Home Team, Away Team, dan Liga terlebih dahulu untuk meng-generate SEO.');
      return;
    }

    const homeName = homeTeam.name;
    const awayName = awayTeam.name;
    const leagueName = league.name;

    const generatedSlug = `${slugify(homeName)}-vs-${slugify(awayName)}-live-streaming`;
    const generatedMetaTitle = `${homeName} vs ${awayName} Live Streaming | ${leagueName}`;
    const generatedMetaDescription = `Watch ${homeName} vs ${awayName} live streaming, live score, lineup, match statistics, kick off schedule and HD broadcast.`;
    const generatedFocusKeyword = `${homeName} vs ${awayName} Live Streaming`;
    const generatedOgTitle = `${homeName} vs ${awayName} Live Streaming`;
    const generatedCanonicalUrl = `${window.location.origin}/match/${generatedSlug}`;

    setSlug(generatedSlug);
    setMetaTitle(generatedMetaTitle);
    setMetaDescription(generatedMetaDescription);
    setFocusKeyword(generatedFocusKeyword);
    setOgTitle(generatedOgTitle);
    setOgDescription(generatedMetaDescription);
    setCanonicalUrl(generatedCanonicalUrl);
  };

  // Stream Server Actions
  const handleAddStream = () => {
    if (streams.length >= 10) return;
    setStreams([
      ...streams,
      { serverName: `Server ${streams.length + 1}`, embedCode: '', isPrimary: false, status: 'ACTIVE' }
    ]);
  };

  const handleRemoveStream = (idx: number) => {
    if (streams.length === 1) return;
    const isPrimaryRemoved = streams[idx].isPrimary;
    const newStreams = streams.filter((_, i) => i !== idx);

    // If primary was removed, assign first stream as primary
    if (isPrimaryRemoved && newStreams.length > 0) {
      newStreams[0].isPrimary = true;
    }
    setStreams(newStreams);
  };

  const handleUpdateStream = (idx: number, field: string, value: any) => {
    const newStreams = [...streams];
    if (field === 'isPrimary') {
      newStreams.forEach((s, i) => {
        s.isPrimary = i === idx;
      });
    } else {
      newStreams[idx][field] = value;
    }
    setStreams(newStreams);
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeTeamId || !awayTeamId || !leagueId || !startTime || !slug) return;
    if (homeTeamId === awayTeamId) {
      alert('Tim Home dan Tim Away tidak boleh sama!');
      return;
    }

    setSubmitting(true);

    const payload = {
      homeTeamId,
      awayTeamId,
      leagueId,
      startTime: new Date(startTime).toISOString(),
      timezone,
      venue: venue || null,
      referee: referee || null,
      round: round || null,
      status,
      isHot,
      isFeatured,
      streams,
      seo: {
        slug,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        canonicalUrl: canonicalUrl || null,
        robots,
        focusKeyword: focusKeyword || null,
        ogTitle: ogTitle || null,
        ogDescription: ogDescription || null,
        ogImage: ogImage || null,
      }
    };

    try {
      const response = await fetch(`/api/matches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal menyimpan data pertandingan.');
      }

      router.push('/admin');
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat menyimpan pertandingan.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-500 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-red-500" />
        <p className="text-xs uppercase tracking-widest">Memuat detail pertandingan...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 select-none">
      {/* Title Header */}
      <header className="flex items-center gap-4 border-b border-white/5 pb-6">
        <Link
          href="/admin"
          className="p-2.5 bg-white/5 border border-white/15 rounded-xl hover:text-white text-zinc-400 hover:bg-white/10 transition-all shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            UBAH DETAIL PERTANDINGAN
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Ubah rincian laga, streaming server, & meta SEO untuk penayangan.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Card 1: Match Section */}
        <section className="bg-[#0c0c11]/80 border border-white/5 p-6 rounded-3xl shadow-xl space-y-6">
          <div className="flex items-center gap-2 text-white pb-3 border-b border-white/5">
            <Tv className="w-4 h-4 text-red-500" />
            <h2 className="text-xs font-black uppercase tracking-wider">Detail Pertandingan</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* League */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">Liga / Kompetisi</label>
              <select
                required
                value={leagueId}
                onChange={(e) => setLeagueId(e.target.value)}
                className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/80 transition-all text-white"
              >
                <option value="">-- Pilih Liga --</option>
                {leagues.map((l) => (
                  <option key={l.id} value={l.id}>{l.name} ({l.season})</option>
                ))}
              </select>
            </div>

            {/* Home Team */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">Home Team</label>
              <select
                required
                value={homeTeamId}
                onChange={(e) => setHomeTeamId(e.target.value)}
                className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/80 transition-all text-white font-bold"
              >
                <option value="">-- Pilih Home Team --</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.shortName})</option>
                ))}
              </select>
            </div>

            {/* Away Team */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">Away Team</label>
              <select
                required
                value={awayTeamId}
                onChange={(e) => setAwayTeamId(e.target.value)}
                className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/80 transition-all text-white font-bold"
              >
                <option value="">-- Pilih Away Team --</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.shortName})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Kick Off */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">Kick Off (Waktu Lokal)</label>
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/80 transition-all text-white font-mono"
              />
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">Timezone</label>
              <input
                type="text"
                required
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/80 transition-all text-white font-mono"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">Status Pertandingan</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/80 transition-all text-white"
              >
                <option value="SCHEDULED">Scheduled (Mulai Countdown)</option>
                <option value="LIVE">LIVE (Tampilkan Pemutar)</option>
                <option value="COMPLETED">Completed (Arsip)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Venue */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">Stadion / Venue</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Contoh: Wembley Stadium"
                className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/80 transition-all text-white"
              />
            </div>

            {/* Referee */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">Wasit</label>
              <input
                type="text"
                value={referee}
                onChange={(e) => setReferee(e.target.value)}
                placeholder="Contoh: Howard Webb"
                className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/80 transition-all text-white"
              />
            </div>

            {/* Round */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">Babak / Round</label>
              <input
                type="text"
                value={round}
                onChange={(e) => setRound(e.target.value)}
                placeholder="Contoh: Matchday 1, Final"
                className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/80 transition-all text-white"
              />
            </div>
          </div>
        </section>

        {/* Card 2: Features Section */}
        <section className="bg-[#0c0c11]/80 border border-white/5 p-6 rounded-3xl shadow-xl space-y-6">
          <div className="flex items-center gap-2 text-white pb-3 border-b border-white/5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-black uppercase tracking-wider">Promosi Laga</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hot Match Toggle */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-white uppercase tracking-wider block flex items-center gap-1.5">
                  🔥 Laga Utama (Hot Match)
                </span>
                <span className="text-[10px] text-zinc-400 mt-1 block">Pertandingan akan diberi label hot di daftar.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={isHot}
                  onChange={(e) => setIsHot(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-white peer-checked:after:border-transparent"></div>
              </label>
            </div>

            {/* Feature Match Toggle */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-white uppercase tracking-wider block flex items-center gap-1.5">
                  📌 Sematkan Laga (Feature Match)
                </span>
                <span className="text-[10px] text-zinc-400 mt-1 block">Sematkan di baris paling atas agar ramai ditonton.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500 peer-checked:after:bg-white peer-checked:after:border-transparent"></div>
              </label>
            </div>
          </div>
        </section>

        {/* Card 3: Streaming Servers Section */}
        <section className="bg-[#0c0c11]/80 border border-white/5 p-6 rounded-3xl shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2 text-white">
              <Tv className="w-4 h-4 text-emerald-500" />
              <h2 className="text-xs font-black uppercase tracking-wider">Server Streaming (Maksimal 10)</h2>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase">
              {streams.length} / 10 Server
            </span>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {streams.map((stream, idx) => (
              <div key={idx} className="bg-black/20 p-5 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-450 uppercase tracking-wider">
                    Server {idx + 1} {stream.isPrimary && <span className="text-[9px] text-zinc-500 lowercase font-medium">(default player)</span>}
                  </span>
                  {streams.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStream(idx)}
                      className="text-xs text-white/30 hover:text-red-500 px-2 py-1 rounded hover:bg-red-500/5 transition-all font-bold"
                    >
                      Hapus Server
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Server Name */}
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-1.5">Nama Server</label>
                    <input
                      type="text"
                      required
                      value={stream.serverName}
                      onChange={(e) => handleUpdateStream(idx, 'serverName', e.target.value)}
                      placeholder="Contoh: Server HD 1080p, Vidio Alt"
                      className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500/35 focus:bg-black/80 transition-all text-white font-bold"
                    />
                  </div>

                  {/* Radios & Active Toggles */}
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    {/* Primary Server Radio */}
                    <div className="bg-black/25 border border-white/5 rounded-xl px-3 py-2 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase">Primary</span>
                      <input
                        type="radio"
                        name="primaryStreamRadio"
                        checked={stream.isPrimary}
                        onChange={() => handleUpdateStream(idx, 'isPrimary', true)}
                        className="w-4 h-4 text-emerald-600 bg-black border-white/10 focus:ring-emerald-550 focus:ring-offset-black rounded-full cursor-pointer accent-emerald-500"
                      />
                    </div>

                    {/* Active Checkbox */}
                    <div className="bg-black/25 border border-white/5 rounded-xl px-3 py-2 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase">Status</span>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={stream.status === 'ACTIVE'}
                          onChange={(e) => handleUpdateStream(idx, 'status', e.target.checked ? 'ACTIVE' : 'INACTIVE')}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4.5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-550 peer-checked:after:bg-white peer-checked:after:border-transparent"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Embed Code */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-1.5">Embed Code / Link Stream</label>
                  <textarea
                    required
                    rows={3}
                    value={stream.embedCode}
                    onChange={(e) => handleUpdateStream(idx, 'embedCode', e.target.value)}
                    placeholder="Masukkan iframe embed player atau direct link streaming. Contoh: <iframe src='...'></iframe>"
                    className="w-full bg-black/45 border border-white/10 rounded-xl p-3.5 text-xs font-mono focus:outline-none focus:border-emerald-500/35 focus:bg-black/80 transition-all text-emerald-450 placeholder-white/10 leading-relaxed"
                  />
                </div>
              </div>
            ))}
          </div>

          {streams.length < 10 && (
            <button
              type="button"
              onClick={handleAddStream}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-wider text-zinc-300 hover:text-white transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-emerald-500" />
              <span>Tambah Server Streaming</span>
            </button>
          )}
        </section>

        {/* Card 4: SEO Panel Section */}
        <section className="bg-[#0c0c11]/80 border border-white/5 p-6 rounded-3xl shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2 text-white">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h2 className="text-xs font-black uppercase tracking-wider">SEO Optimization Panel</h2>
            </div>
            <button
              type="button"
              onClick={handleGenerateSEO}
              className="text-[10px] bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 px-3.5 py-2 rounded-xl font-black uppercase tracking-widest text-white transition-all transform hover:scale-[1.01] active:scale-97 cursor-pointer"
            >
              Generate SEO
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Slug */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">Match Slug (URL)</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="contoh: belgium-vs-senegal-live-streaming"
                className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/80 transition-all text-white font-mono"
              />
            </div>

            {/* Focus Keyword */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">Focus Keyword</label>
              <input
                type="text"
                value={focusKeyword}
                onChange={(e) => setFocusKeyword(e.target.value)}
                placeholder="Contoh: Belgium vs Senegal Live Streaming"
                className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/80 transition-all text-white font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Meta Title */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">Meta Title</label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Meta title pencarian"
                className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/80 transition-all text-white font-bold"
              />
            </div>

            {/* Canonical URL */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">Canonical URL</label>
              <input
                type="url"
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                placeholder="https://your-domain.com/match/slug"
                className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/80 transition-all text-white font-mono"
              />
            </div>
          </div>

          {/* Meta Description */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">Meta Description</label>
            <textarea
              rows={3}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Tulis deskripsi SEO singkat mengenai penyiaran laga ini..."
              className="w-full bg-black/45 border border-white/10 rounded-xl p-3.5 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/80 transition-all text-white leading-relaxed"
            />
          </div>

          {/* Open Graph Titles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* OG Title */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-455 mb-1.5">Open Graph Title</label>
              <input
                type="text"
                value={ogTitle}
                onChange={(e) => setOgTitle(e.target.value)}
                placeholder="OG Title Facebook/WA"
                className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/80 transition-all text-white"
              />
            </div>

            {/* OG Image */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-455 mb-1.5">Open Graph Image (Poster URL)</label>
              <input
                type="url"
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                placeholder="https://.../og-banner.jpg"
                className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/80 transition-all text-white"
              />
            </div>

            {/* Robots */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-455 mb-1.5">Robots Directive</label>
              <select
                value={robots}
                onChange={(e) => setRobots(e.target.value)}
                className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/80 transition-all text-white"
              >
                <option value="index, follow">index, follow (Rekomendasi)</option>
                <option value="noindex, nofollow">noindex, nofollow (Sembunyikan dari Google)</option>
              </select>
            </div>
          </div>

          {/* OG Description */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-455 mb-1.5">Open Graph Description</label>
            <textarea
              rows={2}
              value={ogDescription}
              onChange={(e) => setOgDescription(e.target.value)}
              placeholder="Deskripsi ketika dibagikan ke platform sosial..."
              className="w-full bg-black/45 border border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/80 transition-all text-white leading-relaxed"
            />
          </div>

          {/* Google Search Preview */}
          <div className="bg-[#121217] p-5 rounded-2xl border border-white/5 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5" /> Google Search Preview
            </span>
            <div className="space-y-1.5 max-w-xl">
              <div className="text-zinc-400 text-xs truncate">
                https://flstreams.co <span className="text-zinc-600">› match › {slug || 'belgium-vs-senegal-live-streaming'}</span>
              </div>
              <div className="text-blue-500 text-base font-medium hover:underline cursor-pointer truncate">
                {metaTitle || 'Belgium vs Senegal Live Streaming | FIFA World Cup 2026'}
              </div>
              <div className="text-zinc-400 text-xs line-clamp-2 leading-relaxed">
                {metaDescription || 'Watch Belgium vs Senegal live streaming, live score, lineup, match statistics, kick off schedule and HD broadcast.'}
              </div>
            </div>
          </div>
        </section>

        {/* Submit Actions Bar */}
        <footer className="flex gap-4">
          <Link
            href="/admin"
            className="flex-1 py-4 bg-zinc-950 border border-white/10 hover:text-white text-zinc-400 hover:bg-zinc-900 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-4 bg-white hover:bg-slate-200 text-zinc-950 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-white/5"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </footer>
      </form>
    </div>
  );
}
