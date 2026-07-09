export interface MatchSource {
  source: string;
  id: string;
}

export interface Match {
  id: string;
  title: string;
  category: string;
  date: number; // unix timestamp
  poster?: string;
  popular?: boolean;
  sources: MatchSource[];
  teams?: {
    home?: { name: string; badge?: string };
    away?: { name: string; badge?: string };
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
