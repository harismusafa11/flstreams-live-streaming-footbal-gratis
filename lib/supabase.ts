import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy singleton — client hanya dibuat saat pertama kali dipanggil,
// bukan saat module diload. Ini mencegah error saat build time.
let _adminClient: SupabaseClient | null = null;
let _browserClient: SupabaseClient | null = null;

/**
 * Supabase admin client untuk penggunaan di sisi server (API routes, Server Components).
 * Menggunakan service role key — melewati RLS, hanya boleh dipakai di server.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_adminClient) {
    _adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return _adminClient;
}

/**
 * Supabase client untuk penggunaan di sisi browser (client components).
 * Menggunakan anon key — mengikuti Row Level Security (RLS).
 */
export function getSupabase(): SupabaseClient {
  if (!_browserClient) {
    _browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _browserClient;
}

// Tipe Match sesuai dengan schema tabel Supabase
export type Match = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string | null;
  awayLogo: string | null;
  competition: string | null;
  startTime: string;
  embedCode: string;
  status: string;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
};
