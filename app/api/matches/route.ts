import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { autoUpdateMatchStatuses } from '@/lib/match-updater';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Sinkronkan status pertandingan yang sudah waktunya kick-off
    await autoUpdateMatchStatuses();

    const { data: matches, error } = await getSupabaseAdmin()
      .from('matches')
      .select('*')
      .order('startTime', { ascending: true });

    if (error) {
      console.error('Error fetching matches:', error.message);
      return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }

    return NextResponse.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { homeTeam, awayTeam, homeLogo, awayLogo, competition, startTime, embedCode, status, isFeatured } = body;

    const now = new Date().toISOString();
    const newMatch = {
      id: randomUUID(),
      homeTeam,
      awayTeam,
      homeLogo: homeLogo || null,
      awayLogo: awayLogo || null,
      competition: competition || null,
      startTime: new Date(startTime).toISOString(),
      embedCode,
      status: status || 'SCHEDULED',
      isFeatured: Boolean(isFeatured),
      createdAt: now,
      updatedAt: now,
    };

    const { data: match, error } = await getSupabaseAdmin()
      .from('matches')
      .insert(newMatch)
      .select()
      .single();

    if (error) {
      console.error('Error creating match:', error.message);
      return NextResponse.json({ error: 'Failed to create match' }, { status: 500 });
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error('Error creating match:', error);
    return NextResponse.json({ error: 'Failed to create match' }, { status: 500 });
  }
}
