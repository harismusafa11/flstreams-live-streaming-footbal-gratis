import { getSupabaseAdmin } from '@/lib/supabase';
import { TeamInput } from '../validation/team';

export class TeamRepository {
  private static getClient() {
    return getSupabaseAdmin();
  }

  static async getAll() {
    const { data, error } = await this.getClient()
      .from('teams')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  static async getById(id: string) {
    const { data, error } = await this.getClient()
      .from('teams')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  static async getBySlug(slug: string) {
    const { data, error } = await this.getClient()
      .from('teams')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  static async create(id: string, input: TeamInput) {
    const { data, error } = await this.getClient()
      .from('teams')
      .insert({
        id,
        name: input.name,
        shortName: input.shortName,
        country: input.country,
        logo: input.logo || null,
        slug: input.slug,
        active: input.active !== undefined ? input.active : true,
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async update(id: string, input: Partial<TeamInput>) {
    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.shortName !== undefined) updateData.shortName = input.shortName;
    if (input.country !== undefined) updateData.country = input.country;
    if (input.logo !== undefined) updateData.logo = input.logo || null;
    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.active !== undefined) updateData.active = input.active;

    const { data, error } = await this.getClient()
      .from('teams')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async delete(id: string) {
    const { error } = await this.getClient()
      .from('teams')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }
}
