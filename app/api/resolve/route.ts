/**
 * POST /api/resolve
 * Body: { source: string, id: string, stream?: number }
 *
 * Runs the full embed.st handshake + WASM decrypt server-side.
 * Returns { ok, m3u8, relay, embedUrl } or { ok: false, stage, error }
 */
import { type NextRequest } from 'next/server';
import { resolveStream } from '@/lib/resolver';

export const runtime = 'nodejs'; // worker_threads requires Node.js runtime

export async function POST(request: NextRequest) {
  let body: { source?: string; id?: string; stream?: number | string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { source, id, stream = 1 } = body;

  if (!source || !id) {
    return Response.json({ ok: false, error: 'source and id required' }, { status: 400 });
  }

  // Sanitize
  if (!/^[\w-]+$/.test(source) || !/^[\w-]+$/.test(String(id))) {
    return Response.json({ ok: false, error: 'Invalid params' }, { status: 400 });
  }

  // Derive server origin for relay URL building
  const serverOrigin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const result = await resolveStream(source, id, stream, serverOrigin);

  if (!result.ok) {
    return Response.json(result, { status: 502 });
  }

  return Response.json(result, {
    headers: { 'Cache-Control': 'no-store' }, // tokens expire fast
  });
}
