import { NextRequest } from 'next/server';
import { LeagueController } from '@/lib/controllers/LeagueController';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return LeagueController.update(request, id);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return LeagueController.delete(request, id);
}
