export interface TeamInput {
  name: string;
  shortName: string;
  country: string;
  logo?: string | null;
  slug: string;
  active?: boolean;
}

export function validateTeam(input: Partial<TeamInput>): string | null {
  if (!input.name || input.name.trim().length === 0) {
    return 'Nama tim wajib diisi.';
  }
  if (!input.shortName || input.shortName.trim().length === 0) {
    return 'Singkatan nama tim (Short Name) wajib diisi.';
  }
  if (input.shortName.trim().length < 2 || input.shortName.trim().length > 6) {
    return 'Singkatan nama tim harus antara 2 sampai 6 karakter.';
  }
  if (!input.country || input.country.trim().length === 0) {
    return 'Negara asal tim wajib diisi.';
  }
  if (!input.slug || input.slug.trim().length === 0) {
    return 'Slug tim wajib diisi.';
  }
  // Validate slug characters
  if (!/^[a-z0-9-]+$/.test(input.slug)) {
    return 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (-).';
  }
  return null;
}
