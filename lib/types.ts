// ── StreamFree API types ───────────────────────────────────────────────────────

/** Raw response from GET /api/v1/streams or /api/v1/streams/{stream_key} */
export interface StreamFreeStream {
  id?: string;
  name: string;
  category: string;
  league?: string;
  stream_key: string;
  match_timestamp: number;
  viewers?: number;
  embed_url: string;
  thumbnail_url?: string;
  team1?: { name: string; logo?: string };
  team2?: { name: string; logo?: string };
}

/** Response from GET /api/v1/streams */
export interface StreamFreeStreamsResponse {
  count: number;
  streams: StreamFreeStream[];
}

/** Response from GET /api/v1/categories */
export interface StreamFreeCategoriesResponse {
  categories: string[];
}

// ── App-internal types ─────────────────────────────────────────────────────────

export interface MatchSource {
  source: string; // = category (e.g. "soccer")
  id: string;     // = stream_key (e.g. "ghana-vs-england")
}

export interface Match {
  id: string;          // = stream_key
  title: string;
  category: string;
  date: number;        // unix timestamp
  poster?: string;     // = thumbnail_url
  popular?: boolean;
  sources: MatchSource[];
  embedUrl?: string;   // direct embed URL from StreamFree
  league?: string;
  viewers?: number;    // realtime viewer count from API
  teams?: {
    home?: { name: string; badge?: string; logo?: string };
    away?: { name: string; badge?: string; logo?: string };
  };
}

export interface Stream {
  id: string;
  streamNo: number;
  language: string;
  hd: boolean;
  embedUrl: string;
  source: string;
}

export interface Sport {
  id: string;
  name: string;
  slug: string;
}
