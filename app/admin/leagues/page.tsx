// app/admin/leagues/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Pencil, Check, X, RefreshCw } from 'lucide-react';
import Image from 'next/image';

export default function AdminLeaguesPage() {
  const [leagues, setLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [country, setCountry] = useState('');
  const [season, setSeason] = useState('');
  const [slug, setSlug] = useState('');
  const [priority, setPriority] = useState(0);
  const [active, setActive] = useState(true);
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchLeagues = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leagues?t=${Date.now()}`);
      const data = await res.json();
      setLeagues(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeagues();
  }, []);

  const slugify = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugManual && !editingId) {
      const sVal = season ? `${val}-${season}` : val;
      setSlug(slugify(sVal));
    }
  };

  const handleSeasonChange = (val: string) => {
    setSeason(val);
    if (!isSlugManual && !editingId) {
      const sVal = name ? `${name}-${val}` : val;
      setSlug(slugify(sVal));
    }
  };

  const handleSlugChange = (val: string) => {
    setSlug(slugify(val));
    setIsSlugManual(true);
  };

  const handleStartEdit = (league: any) => {
    setEditingId(league.id);
    setName(league.name);
    setLogo(league.logo || '');
    setCountry(league.country);
    setSeason(league.season);
    setSlug(league.slug);
    setPriority(league.priority);
    setActive(league.active);
    setIsSlugManual(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setLogo('');
    setCountry('');
    setSeason('');
    setSlug('');
    setPriority(0);
    setActive(true);
    setIsSlugManual(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !country || !season || !slug) return;
    setSubmitting(true);

    const payload = {
      name,
      logo: logo || null,
      country,
      season,
      slug,
      priority: Number(priority),
      active,
    };

    try {
      let res;
      if (editingId) {
        res = await fetch(`/api/leagues/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/leagues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal menyimpan data liga.');
      }

      handleCancelEdit();
      fetchLeagues();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat menyimpan liga.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLeague = async (id: string) => {
    try {
      const res = await fetch(`/api/leagues/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal menghapus liga.');
      }
      setDeleteConfirmId(null);
      fetchLeagues();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat menghapus liga.');
    }
  };

  const filteredLeagues = leagues.filter((league) => {
    const s = searchQuery.toLowerCase();
    return (
      league.name.toLowerCase().includes(s) ||
      league.country.toLowerCase().includes(s) ||
      league.season.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-8 select-none">
      {/* Title Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            MASTER DATA LEAGUES
            <span className="text-amber-400 font-medium text-[10px] tracking-widest uppercase bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded">Database</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Kelola data kompetisi/liga sepak bola yang akan dipilih pada pembuatan laga.</p>
        </div>
      </header>

      {/* Grid Layout (7 columns Table, 5 columns Form) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Leagues Table Column */}
        <div className="lg:col-span-7 bg-[#0c0c11]/80 border border-white/5 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-white">Daftar Liga Terdaftar</h2>
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-3 w-4 h-4 text-white/25" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari liga..."
                className="w-full bg-black/35 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/60 transition-all text-white placeholder-white/20"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500 space-y-3">
              <RefreshCw className="w-7 h-7 animate-spin text-amber-500" />
              <p className="text-xs uppercase tracking-widest">Memuat daftar liga...</p>
            </div>
          ) : filteredLeagues.length === 0 ? (
            <div className="text-center py-20 text-zinc-500 border border-dashed border-white/5 bg-black/10 rounded-2xl p-6">
              <p className="text-xs">Belum ada liga/kompetisi terdaftar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                    <th className="py-3 px-3">Logo</th>
                    <th className="py-3 px-3">Nama</th>
                    <th className="py-3 px-3">Negara</th>
                    <th className="py-3 px-3">Season</th>
                    <th className="py-3 px-3">Priority</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredLeagues.map((league) => (
                    <tr key={league.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-3 px-3">
                        {league.logo ? (
                          <div className="w-7 h-7 bg-white/5 rounded-lg overflow-hidden p-0.5 border border-white/5">
                            <Image src={league.logo} alt="" width={24} height={24} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-[7px] font-black text-zinc-400 uppercase">
                            LIGA
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-xs font-bold text-white whitespace-nowrap">{league.name}</td>
                      <td className="py-3 px-3 text-xs text-zinc-450">{league.country}</td>
                      <td className="py-3 px-3 text-xs text-zinc-350">{league.season}</td>
                      <td className="py-3 px-3 text-xs font-mono text-zinc-400">{league.priority}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {league.active ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black bg-white/5 text-zinc-450 border border-white/10">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {deleteConfirmId === league.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleDeleteLeague(league.id)}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-[9px] font-extrabold uppercase transition-all"
                            >
                              Ya
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="p-1 bg-zinc-800 text-zinc-400 hover:text-white rounded-md transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleStartEdit(league)}
                              className="p-1.5 bg-zinc-900 border border-white/5 text-zinc-450 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                              title="Ubah data liga"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(league.id)}
                              className="p-1.5 bg-zinc-900 border border-white/5 text-zinc-450 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 rounded-lg transition-all"
                              title="Hapus liga"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* League Form Column */}
        <div className="lg:col-span-5 bg-[#0c0c11]/80 border border-white/5 p-6 rounded-3xl shadow-xl space-y-6">
          <h2 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
            {editingId ? (
              <>
                <Pencil className="w-4 h-4 text-amber-400" /> Edit Data Liga
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 text-red-500" /> Tambah Liga Baru
              </>
            )}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* League Name */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">Nama Liga / Kompetisi</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Contoh: Premier League, La Liga"
                className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/80 transition-all text-white placeholder-white/20 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Country */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">Negara Asal</label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Contoh: England, Spain"
                  className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/80 transition-all text-white placeholder-white/20 font-bold"
                />
              </div>

              {/* Season */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">Musim (Season)</label>
                <input
                  type="text"
                  required
                  value={season}
                  onChange={(e) => handleSeasonChange(e.target.value)}
                  placeholder="Contoh: 2026, 2026/2027"
                  className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/80 transition-all text-white placeholder-white/20 font-bold"
                />
              </div>
            </div>

            {/* Logo */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">Logo URL (PNG/SVG)</label>
              <div className="flex items-center gap-3">
                <input
                  type="url"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  placeholder="https://.../league-logo.png"
                  className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/80 transition-all text-white placeholder-white/20"
                />
                {logo && (
                  <div className="w-11 h-11 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden p-1">
                    <Image src={logo} alt="" width={36} height={36} className="w-full h-full object-contain" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  </div>
                )}
              </div>
            </div>

            {/* Slug */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">Slug Liga (URL)</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="premier-league-2026"
                className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/80 transition-all text-white placeholder-white/20 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Priority */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">Prioritas Tampil (0 - 100)</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/80 transition-all text-white font-mono"
                />
              </div>

              {/* Active Switch */}
              <div className="flex flex-col justify-end pb-1.5">
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex items-center justify-between h-[46px]">
                  <span className="text-[10px] font-black text-white uppercase tracking-wider">Aktif</span>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-4.5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white peer-checked:after:border-transparent"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 py-3 bg-zinc-950 border border-white/10 text-zinc-400 hover:text-white rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5 text-red-500" />
                  <span>Batal</span>
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-white text-zinc-950 hover:bg-slate-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-white/5"
              >
                {editingId ? (
                  <>
                    <Pencil className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Simpan...' : 'Simpan'}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Tambah...' : 'Tambah Liga'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
