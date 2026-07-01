import { NextRequest } from 'next/server';
import { LeagueController } from '@/lib/controllers/LeagueController';

export const dynamic = 'force-dynamic';

export async function GET() {
  return LeagueController.getAll();
}

export async function POST(request: NextRequest) {
  return LeagueController.create(request);
}
