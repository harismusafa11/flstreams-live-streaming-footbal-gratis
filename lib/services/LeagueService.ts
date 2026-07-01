import { LeagueRepository } from '../repositories/LeagueRepository';
import { validateLeague, LeagueInput } from '../validation/league';
import { randomUUID } from 'crypto';

export class LeagueService {
  static async getAllLeagues() {
    return LeagueRepository.getAll();
  }

  static async getLeague(id: string) {
    return LeagueRepository.getById(id);
  }

  static async createLeague(input: LeagueInput) {
    // Auto-generate slug if not provided
    if (!input.slug || input.slug.trim().length === 0) {
      input.slug = this.slugify(`${input.name}-${input.season}`);
    } else {
      input.slug = this.slugify(input.slug);
    }

    // Check slug uniqueness
    const existing = await LeagueRepository.getBySlug(input.slug);
    if (existing) {
      throw new Error(`Slug "${input.slug}" sudah digunakan oleh liga lain.`);
    }

    // Validate
    const error = validateLeague(input);
    if (error) throw new Error(error);

    const newId = randomUUID();
    return LeagueRepository.create(newId, input);
  }

  static async updateLeague(id: string, input: Partial<LeagueInput>) {
    const existingLeague = await LeagueRepository.getById(id);
    if (!existingLeague) {
      throw new Error('Liga tidak ditemukan.');
    }

    // If slug is updated, check uniqueness
    if (input.slug !== undefined) {
      input.slug = this.slugify(input.slug);
      if (input.slug !== existingLeague.slug) {
        const existing = await LeagueRepository.getBySlug(input.slug);
        if (existing) {
          throw new Error(`Slug "${input.slug}" sudah digunakan oleh liga lain.`);
        }
      }
    }

    // Prepare full validate payload
    const merged = { ...existingLeague, ...input } as LeagueInput;
    const error = validateLeague(merged);
    if (error) throw new Error(error);

    return LeagueRepository.update(id, input);
  }

  static async deleteLeague(id: string) {
    const existing = await LeagueRepository.getById(id);
    if (!existing) {
      throw new Error('Liga tidak ditemukan.');
    }
    return LeagueRepository.delete(id);
  }

  private static slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
