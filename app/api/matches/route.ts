import { NextRequest } from 'next/server';
import { MatchController } from '@/lib/controllers/MatchController';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return MatchController.getAll(request);
}

export async function POST(request: NextRequest) {
  return MatchController.create(request);
}
