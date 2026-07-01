import { TeamRepository } from '../repositories/TeamRepository';
import { validateTeam, TeamInput } from '../validation/team';
import { randomUUID } from 'crypto';

export class TeamService {
  static async getAllTeams() {
    return TeamRepository.getAll();
  }

  static async getTeam(id: string) {
    return TeamRepository.getById(id);
  }

  static async createTeam(input: TeamInput) {
    // Auto-generate slug if not provided
    if (!input.slug || input.slug.trim().length === 0) {
      input.slug = this.slugify(input.name);
    } else {
      input.slug = this.slugify(input.slug);
    }

    // Check slug uniqueness
    const existing = await TeamRepository.getBySlug(input.slug);
    if (existing) {
      throw new Error(`Slug "${input.slug}" sudah digunakan oleh tim lain.`);
    }

    // Validate
    const error = validateTeam(input);
    if (error) throw new Error(error);

    const newId = randomUUID();
    return TeamRepository.create(newId, input);
  }

  static async updateTeam(id: string, input: Partial<TeamInput>) {
    const existingTeam = await TeamRepository.getById(id);
    if (!existingTeam) {
      throw new Error('Tim tidak ditemukan.');
    }

    // If slug is updated, check uniqueness
    if (input.slug !== undefined) {
      input.slug = this.slugify(input.slug);
      if (input.slug !== existingTeam.slug) {
        const existing = await TeamRepository.getBySlug(input.slug);
        if (existing) {
          throw new Error(`Slug "${input.slug}" sudah digunakan oleh tim lain.`);
        }
      }
    }

    // Prepare full validate payload
    const merged = { ...existingTeam, ...input } as TeamInput;
    const error = validateTeam(merged);
    if (error) throw new Error(error);

    return TeamRepository.update(id, input);
  }

  static async deleteTeam(id: string) {
    const existing = await TeamRepository.getById(id);
    if (!existing) {
      throw new Error('Tim tidak ditemukan.');
    }
    return TeamRepository.delete(id);
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
