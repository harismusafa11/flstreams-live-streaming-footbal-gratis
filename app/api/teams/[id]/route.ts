import { NextRequest } from 'next/server';
import { TeamController } from '@/lib/controllers/TeamController';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return TeamController.update(request, id);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return TeamController.delete(request, id);
}
