import { NextRequest } from 'next/server';
import { TeamController } from '@/lib/controllers/TeamController';

export const dynamic = 'force-dynamic';

export async function GET() {
  return TeamController.getAll();
}

export async function POST(request: NextRequest) {
  return TeamController.create(request);
}
