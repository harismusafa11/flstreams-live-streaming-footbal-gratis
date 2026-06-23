import { getSupabaseAdmin } from '@/lib/supabase';
import LiveMatchClient from './LiveMatchClient';
import { notFound } from 'next/navigation';
import { autoUpdateMatchStatuses } from '@/lib/match-updater';

import Link from 'next/link';

export default async function LiveStreamPage({ params }: { params: Promise<{ id: string }> }) {
  // Jalankan asinkron check untuk memperbarui status sebelum query detail laga
  await autoUpdateMatchStatuses();

  const { id } = await params;
  
  const { data: match } = await getSupabaseAdmin()
    .from('matches')
    .select('*')
    .eq('id', id)
    .single();

  if (!match) return notFound();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-50">
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-md px-6 py-4 fixed top-0 w-full z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 transition-opacity hover:opacity-80">
            <span className="text-xl font-black tracking-tighter text-white">
              FL <span className="text-red-500">STREAMS</span>
            </span>
          </Link>
        </div>
      </header>
      <main className="pt-20">
        <LiveMatchClient match={JSON.parse(JSON.stringify(match))} />
      </main>
    </div>
  );
}
