import type { MetadataSource } from "../shared/types";

export interface Bindings {
  DB: D1Database;
  ASSETS: Fetcher;
  SITE_NAME?: string;
  SITE_TAGLINE?: string;
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
  SESSION_SECRET?: string;
  BANGUMI_ACCESS_TOKEN?: string;
}

export interface GameRow {
  id: string;
  title: string;
  original_title: string | null;
  url: string;
  cover: string | null;
  banner: string | null;
  description: string | null;
  developer: string | null;
  release_date: string | null;
  tags: string;
  screenshots: string;
  source: string;
  source_id: string | null;
  rating: number | null;
  featured: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface NormalizedGameInput {
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
}

export interface AdminSession {
  username: string;
  expiresAt: number;
}
