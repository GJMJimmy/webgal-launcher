import type { CSSProperties } from "react";
import type { Game, MetadataSource } from "../shared/types";

const PROXY_IMAGE_HOSTS = new Set([
  "lain.bgm.tv",
  "t.vndb.org",
  "api.bgm.tv",
  "img.bgm.tv",
]);

export const SOURCE_LABELS: Record<MetadataSource, string> = {
  bangumi: "Bangumi",
  vndb: "VNDB",
  manual: "手动录入",
};

export function resolveImageSrc(url: string | null | undefined): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "";
    if (PROXY_IMAGE_HOSTS.has(parsed.hostname)) {
      return `/api/image?url=${encodeURIComponent(parsed.toString())}`;
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

export function formatYear(value: string | null | undefined): string {
  if (!value) return "";
  const match = value.match(/\d{4}/);
  return match ? match[0] : "";
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "未知";
  return value;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function excerpt(value: string | null | undefined, length = 180): string {
  if (!value) return "";
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > length ? `${clean.slice(0, length).trim()}…` : clean;
}

export function sourceUrl(game: Game): string | null {
  if (game.source === "bangumi" && game.sourceId) {
    return `https://bgm.tv/subject/${game.sourceId}`;
  }
  if (game.source === "vndb" && game.sourceId) {
    return `https://vndb.org/${game.sourceId}`;
  }
  return null;
}

export function sourceBadge(game: Pick<Game, "source">): string {
  return SOURCE_LABELS[game.source] ?? "手动录入";
}

export function parseTagsInput(value: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of value.split(/[,，\n]/)) {
    const tag = item.trim();
    if (!tag) continue;
    const key = tag.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(tag);
    if (result.length >= 14) break;
  }
  return result;
}

export function parseScreenshotsInput(value: string): string[] {
  return value
    .split(/\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function hashHue(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 360;
  }
  return hash;
}

export function fallbackStyle(title: string): CSSProperties {
  const hue = hashHue(title || "galgame");
  return {
    "--fallback-hue": String(hue),
  } as CSSProperties;
}
