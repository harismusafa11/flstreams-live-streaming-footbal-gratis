import { NextRequest, NextResponse } from 'next/server';
import { MatchController } from '@/lib/controllers/MatchController';
import { MatchService } from '@/lib/services/MatchService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const match = await MatchService.getMatch(id);
    if (!match) {
      return NextResponse.json({ error: 'Pertandingan tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json(match);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal mengambil data pertandingan.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return MatchController.update(request, id);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return MatchController.delete(request, id);
}
