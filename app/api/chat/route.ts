import { type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Simple in-memory rate limiter keyed by IP
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 8;       // max messages per window
const RATE_WINDOW_MS = 10_000; // 10 seconds

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';

  if (!checkRateLimit(ip)) {
    return Response.json({ error: 'Too many messages. Slow down!' }, { status: 429 });
  }

  let body: { match_id?: string; username?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { match_id, username, message } = body;

  // Validate required fields
  if (!match_id || !username || !message) {
    return Response.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Sanitize lengths
  const cleanUsername = String(username).slice(0, 30).trim();
  const cleanMessage = String(message).slice(0, 300).trim();
  const cleanMatchId = String(match_id).slice(0, 255);

  if (!cleanMessage || !cleanUsername) {
    return Response.json({ error: 'Empty content' }, { status: 400 });
  }

  // Block obvious spam patterns
  const spamPatterns = [/<script/i, /javascript:/i, /on\w+\s*=/i];
  if (spamPatterns.some((p) => p.test(cleanMessage))) {
    return Response.json({ error: 'Message rejected' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('chats')
    .insert({ match_id: cleanMatchId, username: cleanUsername, message: cleanMessage })
    .select()
    .single();

  if (error) {
    console.error('[/api/chat POST]', error);
    return Response.json({ error: 'Failed to save message' }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const match_id = searchParams.get('match_id');

  if (!match_id) {
    return Response.json({ error: 'Missing match_id' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('chats')
    .select('*')
    .eq('match_id', match_id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return Response.json({ error: 'Failed to load chat' }, { status: 500 });
  }

  return Response.json((data ?? []).reverse());
}
