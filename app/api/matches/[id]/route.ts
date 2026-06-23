import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { error } = await getSupabaseAdmin()
      .from('matches')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting match:', error.message);
      return NextResponse.json({ error: 'Failed to delete match' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting match:', error);
    return NextResponse.json({ error: 'Failed to delete match' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      homeTeam,
      awayTeam,
      homeLogo,
      awayLogo,
      competition,
      startTime,
      embedCode,
      status,
      isFeatured
    } = body;

    const data: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (homeTeam !== undefined) data.homeTeam = homeTeam;
    if (awayTeam !== undefined) data.awayTeam = awayTeam;
    if (homeLogo !== undefined) data.homeLogo = homeLogo;
    if (awayLogo !== undefined) data.awayLogo = awayLogo;
    if (competition !== undefined) data.competition = competition;
    if (startTime !== undefined) data.startTime = new Date(startTime).toISOString();
    if (embedCode !== undefined) data.embedCode = embedCode;
    if (status !== undefined) data.status = status;
    if (isFeatured !== undefined) data.isFeatured = isFeatured;

    const { data: match, error } = await getSupabaseAdmin()
      .from('matches')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating match:', error.message);
      return NextResponse.json({ error: 'Failed to update match' }, { status: 500 });
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error('Error updating match:', error);
    return NextResponse.json({ error: 'Failed to update match' }, { status: 500 });
  }
}
