import type { Game, GameInput, MetadataSource } from "../shared/types";
import type { GameRow, NormalizedGameInput } from "./types";

const MAX_TITLE = 140;
const MAX_URL = 2048;
const MAX_DESCRIPTION = 20000;
const MAX_TAGS = 14;
const MAX_SCREENSHOTS = 12;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanString(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\u0000/g, "").trim().slice(0, maxLength);
}

function optionalString(value: unknown, maxLength: number): string | null {
  const text = cleanString(value, maxLength);
  return text || null;
}

function httpUrl(value: unknown, maxLength = MAX_URL): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (value.length > maxLength) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function parseStringList(
  value: unknown,
  maxItems: number,
  maxLength: number,
  errors: string[],
  label: string,
): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    errors.push(`${label}格式不正确。`);
    return [];
  }
  const result: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") continue;
    const text = item.trim().slice(0, maxLength);
    if (!text || seen.has(text.toLocaleLowerCase())) continue;
    seen.add(text.toLocaleLowerCase());
    result.push(text);
    if (result.length >= maxItems) break;
  }
  return result;
}

export function validateGameInput(payload: unknown): {
  data: NormalizedGameInput | null;
  errors: string[];
} {
  const errors: string[] = [];
  if (!isRecord(payload)) {
    return { data: null, errors: ["请求内容格式不正确。"] };
  }

  const title = cleanString(payload.title, MAX_TITLE);
  if (!title) errors.push("请填写游戏名称。");

  const url = httpUrl(payload.url);
  if (!url) errors.push("请填写有效的游戏网址（必须以 http:// 或 https:// 开头）。");

  const coverRaw = optionalString(payload.cover, MAX_URL);
  const cover = coverRaw ? httpUrl(coverRaw) : null;
  if (coverRaw && !cover) errors.push("封面图片地址无效。");

  const bannerRaw = optionalString(payload.banner, MAX_URL);
  const banner = bannerRaw ? httpUrl(bannerRaw) : null;
  if (bannerRaw && !banner) errors.push("横幅图片地址无效。");

  const screenshotValues = Array.isArray(payload.screenshots) ? payload.screenshots : [];
  const screenshots: string[] = [];
  for (const value of screenshotValues) {
    if (typeof value !== "string" || !value.trim()) continue;
    const parsed = httpUrl(value, MAX_URL);
    if (parsed) screenshots.push(parsed);
    if (screenshots.length >= MAX_SCREENSHOTS) break;
  }

  const tags = parseStringList(payload.tags, MAX_TAGS, 32, errors, "标签");

  const description = optionalString(payload.description, MAX_DESCRIPTION);
  const developer = optionalString(payload.developer, 200);
  const releaseDate = optionalString(payload.releaseDate, 40);
  const sourceId = optionalString(payload.sourceId, 80);

  let source: MetadataSource = "manual";
  if (payload.source === "bangumi" || payload.source === "vndb" || payload.source === "manual") {
    source = payload.source;
  }

  let rating: number | null = null;
  if (payload.rating !== null && payload.rating !== undefined && payload.rating !== "") {
    const value = typeof payload.rating === "number" ? payload.rating : Number(payload.rating);
    if (!Number.isFinite(value) || value < 0 || value > 10) {
      errors.push("评分必须在 0 到 10 之间。");
    } else {
      rating = Math.round(value * 10) / 10;
    }
  }

  let sortOrder = 0;
  if (payload.sortOrder !== undefined && payload.sortOrder !== null) {
    const value = Number(payload.sortOrder);
    if (!Number.isFinite(value)) {
      errors.push("排序值必须是数字。");
    } else {
      sortOrder = Math.max(-9999, Math.min(9999, Math.trunc(value)));
    }
  }

  if (errors.length > 0) return { data: null, errors };

  return {
    data: {
      title,
      originalTitle: optionalString(payload.originalTitle, MAX_TITLE),
      url: url as string,
      cover,
      banner,
      description,
      developer,
      releaseDate,
      tags,
      screenshots,
      source,
      sourceId: source === "manual" ? null : sourceId,
      rating,
      featured: payload.featured === true,
      sortOrder,
    },
    errors: [],
  };
}

function parseStringArray(raw: string): string[] {
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function rowToGame(row: GameRow): Game {
  return {
    id: row.id,
    title: row.title,
    originalTitle: row.original_title,
    url: row.url,
    cover: row.cover,
    banner: row.banner,
    description: row.description,
    developer: row.developer,
    releaseDate: row.release_date,
    tags: parseStringArray(row.tags),
    screenshots: parseStringArray(row.screenshots),
    source:
      row.source === "bangumi" || row.source === "vndb" || row.source === "manual"
        ? row.source
        : "manual",
    sourceId: row.source_id,
    rating: row.rating,
    featured: row.featured === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toGameInput(game: Game): GameInput {
  return {
    title: game.title,
    originalTitle: game.originalTitle ?? undefined,
    url: game.url,
    cover: game.cover ?? undefined,
    banner: game.banner ?? undefined,
    description: game.description ?? undefined,
    developer: game.developer ?? undefined,
    releaseDate: game.releaseDate ?? undefined,
    tags: game.tags,
    screenshots: game.screenshots,
    source: game.source,
    sourceId: game.sourceId ?? undefined,
    rating: game.rating,
    featured: game.featured,
    sortOrder: game.sortOrder,
  };
}

export function friendlyDatabaseError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("no such table")) {
    return "数据库尚未初始化。请先运行 D1 数据库迁移（见 README）。";
  }
  return "服务器暂时无法处理这个请求，请稍后再试。";
}
