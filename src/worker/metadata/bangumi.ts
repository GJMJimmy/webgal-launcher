import type { MetadataCandidate } from "../../shared/types";
import {
  BANGUMI_USER_AGENT,
  cachedJson,
  fetchJson,
  normalizeRating,
  uniqueStrings,
} from "./shared";
import { getVndbDetail, searchVndb } from "./vndb";

const API = "https://api.bgm.tv";
const IGNORED_TAGS = new Set([
  "pc",
  "windows",
  "psp",
  "ps2",
  "ps3",
  "ps4",
  "ps5",
  "psv",
  "ns",
  "switch",
  "xbox360",
  "xbox one",
  "steam",
  "游戏",
  "汉化",
  "日本",
  "全年龄",
  "r18",
]);

interface BangumiImageSet {
  large?: string;
  common?: string;
  medium?: string;
  grid?: string;
  small?: string;
}

interface BangumiTag {
  name?: string;
  count?: number;
}

interface BangumiInfoboxItem {
  key?: string;
  value?: string | Array<string | { k?: string; v?: string }> | { v?: string };
}

interface BangumiSubject {
  id?: number;
  name?: string;
  name_cn?: string;
  summary?: string;
  date?: string;
  images?: BangumiImageSet;
  image?: string;
  rating?: { score?: number; total?: number };
  tags?: BangumiTag[];
  infobox?: BangumiInfoboxItem[];
  nsfw?: boolean;
}

interface BangumiSearchResponse {
  data?: BangumiSubject[] | null;
}

function headersFor(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": BANGUMI_USER_AGENT,
  };
  const token = accessToken?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function coverOf(subject: BangumiSubject): string | null {
  return (
    subject.images?.large ||
    subject.images?.common ||
    subject.images?.medium ||
    subject.images?.grid ||
    subject.image ||
    null
  );
}

function cleanTags(subject: BangumiSubject, title: string): string[] {
  const titleKey = title.toLocaleLowerCase();
  const raw = (subject.tags ?? [])
    .slice()
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .map((tag) => tag.name ?? "")
    .filter((tag) => {
      const key = tag.toLocaleLowerCase();
      return Boolean(tag) && key !== titleKey && !IGNORED_TAGS.has(key);
    });
  return uniqueStrings(raw, 10);
}

function flattenInfoboxValue(value: BangumiInfoboxItem["value"]): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : item.v ?? item.k ?? ""))
      .filter(Boolean)
      .join(" / ")
      .trim();
  }
  if (value && typeof value === "object") return (value.v ?? "").trim();
  return "";
}

function findDeveloper(subject: BangumiSubject): string | null {
  const keys = ["开发", "开发商", "制作公司", "游戏开发", "ゲーム開発", "Developer"];
  for (const item of subject.infobox ?? []) {
    if (item.key && keys.includes(item.key)) {
      const value = flattenInfoboxValue(item.value);
      if (value) return value;
    }
  }
  for (const item of subject.infobox ?? []) {
    if (item.key && (item.key.includes("开发") || item.key.toLowerCase().includes("developer"))) {
      const value = flattenInfoboxValue(item.value);
      if (value) return value;
    }
  }
  return null;
}

function vndbIdFromLinks(subject: BangumiSubject): string | null {
  for (const item of subject.infobox ?? []) {
    if (item.key !== "链接" || !Array.isArray(item.value)) continue;
    for (const entry of item.value) {
      if (typeof entry === "string") {
        const match = entry.match(/vndb\.org\/v(\d+)/i);
        if (match) return `v${match[1]}`;
        continue;
      }
      if (entry.k?.toUpperCase() === "VNDB" && entry.v) {
        const match = entry.v.match(/vndb\.org\/v(\d+)/i);
        if (match) return `v${match[1]}`;
      }
    }
  }
  return null;
}

function comparableTitle(value: string | null): string {
  return (value ?? "")
    .toLocaleLowerCase()
    .replace(/[\s\-–—_.,:;!?'"()[\]{}~·・/\\]/g, "");
}

async function findVndbIdByTitle(candidate: MetadataCandidate): Promise<string | null> {
  const wanted = new Set(
    [candidate.title, candidate.originalTitle ?? ""].map(comparableTitle).filter(Boolean),
  );
  const queries = uniqueStrings(
    [candidate.originalTitle ?? "", candidate.title].filter(Boolean),
    2,
  );
  for (const query of queries) {
    try {
      const results = await searchVndb(query);
      const match = results.find((entry) =>
        [entry.title, entry.originalTitle ?? ""].some((title) =>
          wanted.has(comparableTitle(title)),
        ),
      );
      if (match) return match.sourceId;
    } catch {
      // Enrichment is optional; Bangumi data is still perfectly usable.
    }
  }
  return null;
}

async function enrichWithVndbScreenshots(
  candidate: MetadataCandidate,
  subject: BangumiSubject,
): Promise<MetadataCandidate> {
  const vndbId = vndbIdFromLinks(subject) ?? (await findVndbIdByTitle(candidate));
  if (!vndbId) return candidate;
  try {
    const vndb = await getVndbDetail(vndbId);
    if (vndb.screenshots.length === 0) return candidate;
    return {
      ...candidate,
      banner: vndb.banner,
      screenshots: vndb.screenshots,
    };
  } catch {
    return candidate;
  }
}

function mapSubject(subject: BangumiSubject, detail: boolean): MetadataCandidate | null {
  if (!subject.id) return null;
  const originalTitle = (subject.name ?? "").trim() || null;
  const localizedTitle = (subject.name_cn ?? "").trim();
  const title = localizedTitle || originalTitle || "";
  if (!title) return null;

  return {
    source: "bangumi",
    sourceId: String(subject.id),
    title,
    originalTitle: originalTitle && originalTitle !== title ? originalTitle : null,
    cover: coverOf(subject),
    banner: null,
    description: detail ? (subject.summary ?? "").trim() || null : null,
    developer: detail ? findDeveloper(subject) : null,
    releaseDate: (subject.date ?? "").trim() || null,
    tags: cleanTags(subject, title),
    screenshots: [],
    rating: normalizeRating(subject.rating?.score),
    sourceUrl: `https://bgm.tv/subject/${subject.id}`,
  };
}

export async function searchBangumi(
  query: string,
  accessToken?: string,
): Promise<MetadataCandidate[]> {
  const authTag = accessToken?.trim() ? "auth" : "public";
  return cachedJson(`bangumi:search:${authTag}:${query.toLocaleLowerCase()}`, 600, async () => {
    const response = await fetchJson<BangumiSearchResponse>(
      `${API}/v0/search/subjects?limit=9&offset=0`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headersFor(accessToken),
        },
        body: JSON.stringify({
          keyword: query,
          sort: "match",
          filter: { type: [4] },
        }),
      },
      "Bangumi",
    );
    const subjects = Array.isArray(response.data) ? response.data : [];
    return subjects
      .map((subject) => mapSubject(subject, false))
      .filter((item): item is MetadataCandidate => Boolean(item));
  });
}

export async function getBangumiDetail(
  id: string,
  accessToken?: string,
): Promise<MetadataCandidate> {
  if (!/^\d{1,12}$/.test(id)) {
    throw new Error("无效的 Bangumi 条目 ID。");
  }
  const authTag = accessToken?.trim() ? "auth" : "public";
  return cachedJson(`bangumi:detail:${authTag}:${id}`, 86400, async () => {
    const subject = await fetchJson<BangumiSubject>(
      `${API}/v0/subjects/${id}`,
      {
        headers: headersFor(accessToken),
      },
      "Bangumi",
    );
    const candidate = mapSubject(subject, true);
    if (!candidate) throw new Error("Bangumi 条目内容不完整。");
    return enrichWithVndbScreenshots(candidate, subject);
  });
}
