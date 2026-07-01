import { MatchRepository } from '../repositories/MatchRepository';
import { validateMatch, MatchInput } from '../validation/match';
import { getSupabaseAdmin } from '@/lib/supabase';
import { randomUUID } from 'crypto';

export class MatchService {
  static async getAllMatches(filters?: {
    leagueId?: string;
    status?: string;
    date?: string;
    isHot?: boolean;
    search?: string;
  }) {
    return MatchRepository.getAll(filters);
  }

  static async getMatch(id: string) {
    return MatchRepository.getById(id);
  }

  static async getMatchBySlug(slug: string) {
    return MatchRepository.getBySlug(slug);
  }

  static async createMatch(input: MatchInput) {
    // Validate Match Input
    const error = validateMatch(input);
    if (error) throw new Error(error);

    // Make sure SEO slug is unique
    const existing = await MatchRepository.getBySlug(input.seo.slug);
    if (existing) {
      throw new Error(`Slug SEO "${input.seo.slug}" sudah digunakan oleh pertandingan lain.`);
    }

    const newId = randomUUID();
    return MatchRepository.create(newId, input);
  }

  static async updateMatch(id: string, input: Partial<MatchInput>) {
    const existingMatch = await MatchRepository.getById(id);
    if (!existingMatch) {
      throw new Error('Pertandingan tidak ditemukan.');
    }

    // Check slug uniqueness if updated
    if (input.seo?.slug !== undefined && input.seo.slug !== existingMatch.seoMetadata?.slug) {
      const existing = await MatchRepository.getBySlug(input.seo.slug);
      if (existing) {
        throw new Error(`Slug SEO "${input.seo.slug}" sudah digunakan oleh pertandingan lain.`);
      }
    }

    // Validate if complete input is merged
    if (input.homeTeamId || input.awayTeamId || input.leagueId || input.streams || input.seo) {
      const merged = {
        homeTeamId: input.homeTeamId || existingMatch.homeTeamId,
        awayTeamId: input.awayTeamId || existingMatch.awayTeamId,
        leagueId: input.leagueId || existingMatch.leagueId,
        startTime: input.startTime || existingMatch.startTime,
        timezone: input.timezone || existingMatch.timezone,
        venue: input.venue !== undefined ? input.venue : existingMatch.venue,
        referee: input.referee !== undefined ? input.referee : existingMatch.referee,
        round: input.round !== undefined ? input.round : existingMatch.round,
        status: input.status || existingMatch.status,
        isHot: input.isHot !== undefined ? input.isHot : existingMatch.isHot,
        isFeatured: input.isFeatured !== undefined ? input.isFeatured : existingMatch.isFeatured,
        streams: input.streams || existingMatch.matchStreams || [],
        seo: {
          slug: input.seo?.slug || existingMatch.seoMetadata?.slug || '',
          metaTitle: input.seo?.metaTitle !== undefined ? input.seo.metaTitle : existingMatch.seoMetadata?.metaTitle,
          metaDescription: input.seo?.metaDescription !== undefined ? input.seo.metaDescription : existingMatch.seoMetadata?.metaDescription,
          canonicalUrl: input.seo?.canonicalUrl !== undefined ? input.seo.canonicalUrl : existingMatch.seoMetadata?.canonicalUrl,
          robots: input.seo?.robots || existingMatch.seoMetadata?.robots || 'index, follow',
          ogTitle: input.seo?.ogTitle !== undefined ? input.seo.ogTitle : existingMatch.seoMetadata?.ogTitle,
          ogDescription: input.seo?.ogDescription !== undefined ? input.seo.ogDescription : existingMatch.seoMetadata?.ogDescription,
          ogImage: input.seo?.ogImage !== undefined ? input.seo.ogImage : existingMatch.seoMetadata?.ogImage,
          focusKeyword: input.seo?.focusKeyword !== undefined ? input.seo.focusKeyword : existingMatch.seoMetadata?.focusKeyword,
        }
      } as MatchInput;

      const error = validateMatch(merged);
      if (error) throw new Error(error);
    }

    return MatchRepository.update(id, input);
  }

  static async deleteMatch(id: string) {
    const existing = await MatchRepository.getById(id);
    if (!existing) {
      throw new Error('Pertandingan tidak ditemukan.');
    }
    return MatchRepository.delete(id);
  }

  static async updateMatchStatus(id: string, status: string) {
    return MatchRepository.updateStatus(id, status);
  }

  static async updateMatchFeatured(id: string, isFeatured: boolean) {
    return MatchRepository.updateFeatured(id, isFeatured);
  }

  static async updateMatchHot(id: string, isHot: boolean) {
    return MatchRepository.updateHot(id, isHot);
  }

  /**
   * Otomatis memperbarui status pertandingan dari SCHEDULED menjadi LIVE
   * jika waktu mulainya sudah lewat, dan dari LIVE menjadi COMPLETED jika sudah 110 menit lewat.
   */
  static async autoUpdateStatuses() {
    try {
      const client = getSupabaseAdmin();
      const now = new Date();

      // Update SCHEDULED -> LIVE (jika startTime <= now + 5 menit)
      const nowPlus5Mins = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
      const { error: liveError } = await client
        .from('matches')
        .update({ status: 'LIVE' })
        .eq('status', 'SCHEDULED')
        .lte('startTime', nowPlus5Mins);

      if (liveError) {
        console.error('[Auto-Update] Error update ke LIVE:', liveError.message);
      }

      // Update LIVE -> COMPLETED (jika sudah berjalan lebih dari 110 menit)
      const finishedThreshold = new Date(now.getTime() - 110 * 60 * 1000).toISOString();
      const { error: finishedError } = await client
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
}
