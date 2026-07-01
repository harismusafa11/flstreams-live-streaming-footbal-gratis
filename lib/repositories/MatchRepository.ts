import { getSupabaseAdmin } from '@/lib/supabase';
import { MatchInput, StreamInput } from '../validation/match';

export class MatchRepository {
  private static getClient() {
    return getSupabaseAdmin();
  }

  static async getAll(filters?: {
    leagueId?: string;
    status?: string;
    date?: string;
    isHot?: boolean;
    search?: string;
  }) {
    let query = this.getClient()
      .from('matches')
      .select(`
        *,
        homeTeam:teams!matches_homeTeamId_fkey(*),
        awayTeam:teams!matches_awayTeamId_fkey(*),
        league:leagues(*),
        seoMetadata:seo_metadata(*),
        matchStreams:match_streams(*)
      `);

    if (filters) {
      if (filters.leagueId && filters.leagueId !== 'all') {
        query = query.eq('leagueId', filters.leagueId);
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.isHot !== undefined) {
        query = query.eq('isHot', filters.isHot);
      }
      if (filters.date) {
        // Filter by date range (start of day to end of day in UTC/local)
        const dateStr = filters.date; // YYYY-MM-DD
        const startOfDay = new Date(`${dateStr}T00:00:00Z`).toISOString();
        const endOfDay = new Date(`${dateStr}T23:59:59Z`).toISOString();
        query = query.gte('startTime', startOfDay).lte('startTime', endOfDay);
      }
    }

    const { data, error } = await query.order('startTime', { ascending: true });

    if (error) throw new Error(error.message);
    
    let result = data || [];

    // Filter by search query in-memory since complex relational OR search in Supabase Client syntax is difficult
    if (filters?.search && filters.search.trim().length > 0) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter((m: any) => {
        const homeName = m.homeTeam?.name?.toLowerCase() || '';
        const awayName = m.awayTeam?.name?.toLowerCase() || '';
        const leagueName = m.league?.name?.toLowerCase() || '';
        return homeName.includes(searchLower) || 
               awayName.includes(searchLower) || 
               leagueName.includes(searchLower);
      });
    }

    return result;
  }

  static async getById(id: string) {
    const { data, error } = await this.getClient()
      .from('matches')
      .select(`
        *,
        homeTeam:teams!matches_homeTeamId_fkey(*),
        awayTeam:teams!matches_awayTeamId_fkey(*),
        league:leagues(*),
        seoMetadata:seo_metadata(*),
        matchStreams:match_streams(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  static async getBySlug(slug: string) {
    // 1. Find the match ID from seo_metadata
    const { data: seoData, error: seoError } = await this.getClient()
      .from('seo_metadata')
      .select('matchId')
      .eq('slug', slug)
      .maybeSingle();

    if (seoError) throw new Error(seoError.message);
    if (!seoData) return null;

    // 2. Fetch full match details by ID
    return this.getById(seoData.matchId);
  }

  static async create(id: string, input: MatchInput) {
    const client = this.getClient();
    const now = new Date().toISOString();

    // 1. Insert Match
    const { data: matchData, error: matchError } = await client
      .from('matches')
      .insert({
        id,
        homeTeamId: input.homeTeamId,
        awayTeamId: input.awayTeamId,
        leagueId: input.leagueId,
        startTime: new Date(input.startTime).toISOString(),
        timezone: input.timezone || 'Asia/Jakarta',
        venue: input.venue || null,
        referee: input.referee || null,
        round: input.round || null,
        status: input.status || 'SCHEDULED',
        isHot: input.isHot !== undefined ? input.isHot : false,
        isFeatured: input.isFeatured !== undefined ? input.isFeatured : false,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (matchError) throw new Error(`Gagal membuat match: ${matchError.message}`);

    // 2. Insert Streams
    const streamsToInsert = input.streams.map((s, idx) => ({
      id: `${id}-stream-${idx}`,
      matchId: id,
      serverName: s.serverName,
      embedCode: s.embedCode,
      isPrimary: s.isPrimary,
      status: s.status || 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    }));

    const { error: streamsError } = await client
      .from('match_streams')
      .insert(streamsToInsert);

    if (streamsError) {
      // Rollback match if stream insert fails
      await client.from('matches').delete().eq('id', id);
      throw new Error(`Gagal membuat server streaming: ${streamsError.message}`);
    }

    // 3. Insert SEO Metadata
    const { error: seoError } = await client
      .from('seo_metadata')
      .insert({
        id: `${id}-seo`,
        matchId: id,
        slug: input.seo.slug,
        metaTitle: input.seo.metaTitle || null,
        metaDescription: input.seo.metaDescription || null,
        canonicalUrl: input.seo.canonicalUrl || null,
        robots: input.seo.robots || 'index, follow',
        ogTitle: input.seo.ogTitle || null,
        ogDescription: input.seo.ogDescription || null,
        ogImage: input.seo.ogImage || null,
        focusKeyword: input.seo.focusKeyword || null,
        createdAt: now,
        updatedAt: now,
      });

    if (seoError) {
      // Rollback match & streams if SEO insert fails
      await client.from('matches').delete().eq('id', id);
      throw new Error(`Gagal membuat metadata SEO: ${seoError.message}`);
    }

    return this.getById(id);
  }

  static async update(id: string, input: Partial<MatchInput>) {
    const client = this.getClient();
    const now = new Date().toISOString();

    // 1. Update Match properties if provided
    const matchUpdate: Record<string, any> = {
      updatedAt: now,
    };
    if (input.homeTeamId !== undefined) matchUpdate.homeTeamId = input.homeTeamId;
    if (input.awayTeamId !== undefined) matchUpdate.awayTeamId = input.awayTeamId;
    if (input.leagueId !== undefined) matchUpdate.leagueId = input.leagueId;
    if (input.startTime !== undefined) matchUpdate.startTime = new Date(input.startTime).toISOString();
    if (input.timezone !== undefined) matchUpdate.timezone = input.timezone;
    if (input.venue !== undefined) matchUpdate.venue = input.venue;
    if (input.referee !== undefined) matchUpdate.referee = input.referee;
    if (input.round !== undefined) matchUpdate.round = input.round;
    if (input.status !== undefined) matchUpdate.status = input.status;
    if (input.isHot !== undefined) matchUpdate.isHot = input.isHot;
    if (input.isFeatured !== undefined) matchUpdate.isFeatured = input.isFeatured;

    const { error: matchError } = await client
      .from('matches')
      .update(matchUpdate)
      .eq('id', id);

    if (matchError) throw new Error(`Gagal update match: ${matchError.message}`);

    // 2. Update Streams (Delete existing and insert new ones)
    if (input.streams !== undefined) {
      // Delete existing
      const { error: deleteError } = await client
        .from('match_streams')
        .delete()
        .eq('matchId', id);

      if (deleteError) throw new Error(`Gagal menghapus server streaming lama: ${deleteError.message}`);

      // Insert new streams
      const streamsToInsert = input.streams.map((s, idx) => ({
        id: `${id}-stream-${idx}-${Date.now()}`,
        matchId: id,
        serverName: s.serverName,
        embedCode: s.embedCode,
        isPrimary: s.isPrimary,
        status: s.status || 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      }));

      if (streamsToInsert.length > 0) {
        const { error: streamsError } = await client
          .from('match_streams')
          .insert(streamsToInsert);

        if (streamsError) throw new Error(`Gagal mengupdate server streaming baru: ${streamsError.message}`);
      }
    }

    // 3. Update SEO Metadata
    if (input.seo !== undefined) {
      const seoUpdate: Record<string, any> = {
        updatedAt: now,
      };
      if (input.seo.slug !== undefined) seoUpdate.slug = input.seo.slug;
      if (input.seo.metaTitle !== undefined) seoUpdate.metaTitle = input.seo.metaTitle;
      if (input.seo.metaDescription !== undefined) seoUpdate.metaDescription = input.seo.metaDescription;
      if (input.seo.canonicalUrl !== undefined) seoUpdate.canonicalUrl = input.seo.canonicalUrl;
      if (input.seo.robots !== undefined) seoUpdate.robots = input.seo.robots;
      if (input.seo.ogTitle !== undefined) seoUpdate.ogTitle = input.seo.ogTitle;
      if (input.seo.ogDescription !== undefined) seoUpdate.ogDescription = input.seo.ogDescription;
      if (input.seo.ogImage !== undefined) seoUpdate.ogImage = input.seo.ogImage;
      if (input.seo.focusKeyword !== undefined) seoUpdate.focusKeyword = input.seo.focusKeyword;

      // Upsert SEO Metadata in case it wasn't created initially
      const { error: seoError } = await client
        .from('seo_metadata')
        .upsert({
          matchId: id,
          ...seoUpdate,
        }, { onConflict: 'matchId' });

      if (seoError) throw new Error(`Gagal mengupdate metadata SEO: ${seoError.message}`);
    }

    return this.getById(id);
  }

  static async delete(id: string) {
    // ON DELETE CASCADE automatically handles deleting related streams & seo_metadata in Supabase DB!
    const { error } = await this.getClient()
      .from('matches')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }

  static async updateStatus(id: string, status: string) {
    const { data, error } = await this.getClient()
      .from('matches')
      .update({
        status,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async updateFeatured(id: string, isFeatured: boolean) {
    const { data, error } = await this.getClient()
      .from('matches')
      .update({
        isFeatured,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async updateHot(id: string, isHot: boolean) {
    const { data, error } = await this.getClient()
      .from('matches')
      .update({
        isHot,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
