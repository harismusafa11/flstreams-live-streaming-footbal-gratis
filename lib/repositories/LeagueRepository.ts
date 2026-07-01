import { getSupabaseAdmin } from '@/lib/supabase';
import { LeagueInput } from '../validation/league';

export class LeagueRepository {
  private static getClient() {
    return getSupabaseAdmin();
  }

  static async getAll() {
    const { data, error } = await this.getClient()
      .from('leagues')
      .select('*')
      .order('priority', { ascending: false })
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  static async getById(id: string) {
    const { data, error } = await this.getClient()
      .from('leagues')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  static async getBySlug(slug: string) {
    const { data, error } = await this.getClient()
      .from('leagues')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  static async create(id: string, input: LeagueInput) {
    const { data, error } = await this.getClient()
      .from('leagues')
      .insert({
        id,
        name: input.name,
        logo: input.logo || null,
        country: input.country,
        season: input.season,
        slug: input.slug,
        priority: input.priority !== undefined ? Number(input.priority) : 0,
        active: input.active !== undefined ? input.active : true,
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async update(id: string, input: Partial<LeagueInput>) {
    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.logo !== undefined) updateData.logo = input.logo || null;
    if (input.country !== undefined) updateData.country = input.country;
    if (input.season !== undefined) updateData.season = input.season;
    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.priority !== undefined) updateData.priority = Number(input.priority);
    if (input.active !== undefined) updateData.active = input.active;

    const { data, error } = await this.getClient()
      .from('leagues')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async delete(id: string) {
    const { error } = await this.getClient()
      .from('leagues')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }
}
