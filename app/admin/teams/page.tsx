// app/admin/teams/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Pencil, Shield, Check, X, RefreshCw } from 'lucide-react';
import Image from 'next/image';

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [country, setCountry] = useState('');
  const [logo, setLogo] = useState('');
  const [slug, setSlug] = useState('');
  const [active, setActive] = useState(true);
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teams?t=${Date.now()}`);
      const data = await res.json();
      setTeams(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  // Slug auto generation
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
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setSlug(slugify(val));
    setIsSlugManual(true);
  };

  const handleStartEdit = (team: any) => {
    setEditingId(team.id);
    setName(team.name);
    setShortName(team.shortName);
    setCountry(team.country);
    setLogo(team.logo || '');
    setSlug(team.slug);
    setActive(team.active);
    setIsSlugManual(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setShortName('');
    setCountry('');
    setLogo('');
    setSlug('');
    setActive(true);
    setIsSlugManual(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !shortName || !country || !slug) return;
    setSubmitting(true);

    const payload = {
      name,
      shortName: shortName.toUpperCase(),
      country,
      logo: logo || null,
      slug,
      active,
    };

    try {
      let res;
      if (editingId) {
        res = await fetch(`/api/teams/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal menyimpan data tim.');
      }

      handleCancelEdit();
      fetchTeams();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat menyimpan tim.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    try {
      const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal menghapus tim.');
      }
      setDeleteConfirmId(null);
      fetchTeams();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat menghapus tim.');
    }
  };

  // Filtered List
  const filteredTeams = teams.filter((team) => {
    const s = searchQuery.toLowerCase();
    return (
      team.name.toLowerCase().includes(s) ||
      team.shortName.toLowerCase().includes(s) ||
      team.country.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-8 select-none">
      {/* Title Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            MASTER DATA TEAMS
            <span className="text-amber-400 font-medium text-[10px] tracking-widest uppercase bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded">Database</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Kelola data tim sepak bola dunia yang akan diinput sebagai tim tanding.</p>
        </div>
      </header>

      {/* Grid Layout (7 columns Table, 5 columns Form) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Teams Table Column */}
        <div className="lg:col-span-7 bg-[#0c0c11]/80 border border-white/5 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-white">Daftar Tim Terdaftar</h2>
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-3 w-4 h-4 text-white/25" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari tim..."
                className="w-full bg-black/35 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/60 transition-all text-white placeholder-white/20"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500 space-y-3">
              <RefreshCw className="w-7 h-7 animate-spin text-amber-500" />
              <p className="text-xs uppercase tracking-widest">Memuat daftar tim...</p>
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="text-center py-20 text-zinc-500 border border-dashed border-white/5 bg-black/10 rounded-2xl p-6">
              <p className="text-xs">Belum ada tim sepak bola terdaftar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                    <th className="py-3 px-3">Logo</th>
                    <th className="py-3 px-3">Nama</th>
                    <th className="py-3 px-3">Short</th>
                    <th className="py-3 px-3">Negara</th>
                    <th className="py-3 px-3">Slug</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredTeams.map((team) => (
                    <tr key={team.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-3 px-3">
                        {team.logo ? (
                          <div className="w-7 h-7 bg-white/5 rounded-lg overflow-hidden p-0.5 border border-white/5">
                            <Image src={team.logo} alt="" width={24} height={24} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-[8px] font-black text-zinc-400 uppercase">
                            {team.shortName}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-xs font-bold text-white whitespace-nowrap">{team.name}</td>
                      <td className="py-3 px-3 text-xs font-mono text-zinc-350">{team.shortName}</td>
                      <td className="py-3 px-3 text-xs text-zinc-450">{team.country}</td>
                      <td className="py-3 px-3 text-[11px] font-mono text-zinc-500">{team.slug}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {team.active ? (
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
                        {deleteConfirmId === team.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleDeleteTeam(team.id)}
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
                              onClick={() => handleStartEdit(team)}
                              className="p-1.5 bg-zinc-900 border border-white/5 text-zinc-450 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                              title="Ubah data tim"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(team.id)}
                              className="p-1.5 bg-zinc-900 border border-white/5 text-zinc-450 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 rounded-lg transition-all"
                              title="Hapus tim"
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

        {/* Team Form Column */}
        <div className="lg:col-span-5 bg-[#0c0c11]/80 border border-white/5 p-6 rounded-3xl shadow-xl space-y-6">
          <h2 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
            {editingId ? (
              <>
                <Pencil className="w-4 h-4 text-amber-400" /> Edit Data Tim
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 text-red-500" /> Tambah Tim Baru
              </>
            )}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Team Name */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">Nama Tim</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Contoh: Belgium, Arsenal"
                className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/80 transition-all text-white placeholder-white/20 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Short Name */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">Singkatan (Short Name)</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value.toUpperCase())}
                  placeholder="Contoh: BEL, ARS"
                  className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/80 transition-all text-white placeholder-white/20 font-mono font-bold"
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">Negara Asal</label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Contoh: Belgium, England"
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
                  placeholder="https://.../logo.png"
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
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">Slug Tim (URL)</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="belgium, arsenal"
                className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500/35 focus:bg-black/80 transition-all text-white placeholder-white/20 font-mono"
              />
            </div>

            {/* Active Switch */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-white uppercase tracking-wider block">Status Aktif</span>
                <span className="text-[9px] text-zinc-500 mt-0.5 block">Tim tidak aktif tidak muncul di pilihan form.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white peer-checked:after:border-transparent"></div>
              </label>
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
                    <span>{submitting ? 'Tambah...' : 'Tambah Tim'}</span>
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
