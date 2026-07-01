// app/live/[id]/page.tsx
import { redirect } from 'next/navigation';
import { MatchService } from '@/lib/services/MatchService';

export const dynamic = 'force-dynamic';

export default async function LegacyLiveStreamRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const match = await MatchService.getMatch(id);
    
    if (match?.seoMetadata?.slug) {
      redirect(`/match/${match.seoMetadata.slug}`);
    }
  } catch (err) {
    console.error('Error in legacy redirect:', err);
  }

  // Fallback if not found or error
  redirect('/');
}
