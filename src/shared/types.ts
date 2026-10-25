export type MetadataSource = "bangumi" | "vndb" | "manual";
export type ScrapeSource = Exclude<MetadataSource, "manual">;

export interface Game {
  id: string;
  title: string;
  originalTitle: string | null;
  url: string;
  cover: string | null;
  banner: string | null;
  description: string | null;
  developer: string | null;
  releaseDate: string | null;
  tags: string[];
  screenshots: string[];
  source: MetadataSource;
  sourceId: string | null;
  rating: number | null;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface GameInput {
  title: string;
  originalTitle?: string;
  url: string;
  cover?: string;
  banner?: string;
  description?: string;
  developer?: string;
  releaseDate?: string;
  tags?: string[];
  screenshots?: string[];
  source?: MetadataSource;
  sourceId?: string;
  rating?: number | null;
  featured?: boolean;
  sortOrder?: number;
}

export interface MetadataCandidate {
  source: ScrapeSource;
  sourceId: string;
  title: string;
  originalTitle: string | null;
  cover: string | null;
  banner: string | null;
  description: string | null;
  developer: string | null;
  releaseDate: string | null;
  tags: string[];
  screenshots: string[];
  rating: number | null;
  sourceUrl: string;
}

export interface SiteInfo {
  name: string;
  tagline: string;
  adminConfigured: boolean;
  showFeaturedHero: boolean;
}

export interface SiteSettings {
  showFeaturedHero: boolean;
}

export interface AuthInfo {
  authenticated: boolean;
  username: string | null;
  configured: boolean;
}

export interface ApiErrorBody {
  error: string;
  details?: string[];
}

export interface SearchMetadataResponse {
  results: MetadataCandidate[];
  warnings: string[];
}
