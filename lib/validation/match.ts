export interface StreamInput {
  id?: string;
  serverName: string;
  embedCode: string;
  isPrimary: boolean;
  status: string; // ACTIVE, INACTIVE
}

export interface SeoInput {
  slug: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  robots?: string;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  focusKeyword?: string | null;
}

export interface MatchInput {
  homeTeamId: string;
  awayTeamId: string;
  leagueId: string;
  startTime: string;
  timezone: string;
  venue?: string | null;
  referee?: string | null;
  round?: string | null;
  status: string;
  isHot?: boolean;
  isFeatured?: boolean;
  streams: StreamInput[];
  seo: SeoInput;
}

export function validateMatch(input: Partial<MatchInput>): string | null {
  if (!input.homeTeamId) {
    return 'Tim Tuan Rumah (Home Team) wajib dipilih.';
  }
  if (!input.awayTeamId) {
    return 'Tim Lawan (Away Team) wajib dipilih.';
  }
  if (input.homeTeamId === input.awayTeamId) {
    return 'Tim Tuan Rumah dan Tim Lawan tidak boleh sama.';
  }
  if (!input.leagueId) {
    return 'Liga (League) wajib dipilih.';
  }
  if (!input.startTime) {
    return 'Waktu Kick Off wajib diisi.';
  }
  if (!input.status) {
    return 'Status pertandingan wajib diisi.';
  }
  
  // Validate streams
  if (!input.streams || !Array.isArray(input.streams) || input.streams.length === 0) {
    return 'Minimal harus menambahkan 1 Server Streaming.';
  }

  let hasPrimary = false;
  for (let i = 0; i < input.streams.length; i++) {
    const s = input.streams[i];
    if (!s.serverName || s.serverName.trim().length === 0) {
      return `Nama Server pada Server ${i + 1} wajib diisi.`;
    }
    if (!s.embedCode || s.embedCode.trim().length === 0) {
      return `Embed Code pada Server ${i + 1} wajib diisi.`;
    }
    if (s.isPrimary) {
      hasPrimary = true;
    }
  }

  if (!hasPrimary) {
    return 'Harus memilih salah satu server sebagai Primary Server.';
  }

  // Validate SEO
  if (!input.seo || !input.seo.slug || input.seo.slug.trim().length === 0) {
    return 'Slug SEO untuk pertandingan wajib diisi.';
  }

  if (!/^[a-z0-9-]+$/.test(input.seo.slug)) {
    return 'Slug SEO hanya boleh berisi huruf kecil, angka, dan tanda hubung (-).';
  }

  return null;
}
