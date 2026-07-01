export interface LeagueInput {
  name: string;
  logo?: string | null;
  country: string;
  season: string;
  slug: string;
  priority?: number;
  active?: boolean;
}

export function validateLeague(input: Partial<LeagueInput>): string | null {
  if (!input.name || input.name.trim().length === 0) {
    return 'Nama liga wajib diisi.';
  }
  if (!input.country || input.country.trim().length === 0) {
    return 'Negara asal liga wajib diisi.';
  }
  if (!input.season || input.season.trim().length === 0) {
    return 'Musim (Season) wajib diisi (contoh: 2026 atau 2026/2027).';
  }
  if (!input.slug || input.slug.trim().length === 0) {
    return 'Slug liga wajib diisi.';
  }
  if (!/^[a-z0-9-]+$/.test(input.slug)) {
    return 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (-).';
  }
  if (input.priority !== undefined && isNaN(Number(input.priority))) {
    return 'Prioritas liga harus berupa angka.';
  }
  return null;
}
