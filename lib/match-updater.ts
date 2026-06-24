import { getSupabaseAdmin } from './supabase';

/**
 * Otomatis memperbarui status pertandingan dari SCHEDULED menjadi LIVE
 * jika waktu mulainya (startTime) sudah lewat atau sama dengan waktu sekarang.
 */
export async function autoUpdateMatchStatuses() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const now = new Date().toISOString();

    // Update semua pertandingan yang statusnya SCHEDULED dan startTime <= waktu sekarang + 5 menit
    const nowPlus5Mins = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { error: liveError } = await supabaseAdmin
      .from('matches')
      .update({ status: 'LIVE' })
      .eq('status', 'SCHEDULED')
      .lte('startTime', nowPlus5Mins);

    if (liveError) {
      console.error('[Auto-Update] Error update ke LIVE:', liveError.message);
    }

    // Update semua pertandingan yang statusnya LIVE dan sudah berjalan lebih dari 110 menit
    const finishedThreshold = new Date(Date.now() - 110 * 60 * 1000).toISOString();

    const { error: finishedError } = await supabaseAdmin
      .from('matches')
      .update({ status: 'COMPLETED' })
      .eq('status', 'LIVE')
      .lte('startTime', finishedThreshold);

    if (finishedError) {
      console.error('[Auto-Update] Error update ke COMPLETED:', finishedError.message);
    }
  } catch (error) {
    console.error('[Auto-Update] Error memperbarui status pertandingan:', error);
  }
}
