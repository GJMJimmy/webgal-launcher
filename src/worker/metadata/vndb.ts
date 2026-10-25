import type { MetadataCandidate } from "../../shared/types";
import {
  VNDB_USER_AGENT,
  cachedJson,
  fetchJson,
  normalizeRating,
  stripBbcode,
  uniqueStrings,
} from "./shared";

const API = "https://api.vndb.org/kana/vn";

const SEARCH_FIELDS = [
  "id",
  "title",
  "alttitle",
  "image.url",
  "image.sexual",
  "released",
  "developers.name",
  "developers.original",
  "rating",
  "tags.name",
  "tags.rating",
  "tags.spoiler",
].join(",");

const DETAIL_FIELDS = [
  "id",
  "title",
  "alttitle",
  "image.url",
  "image.sexual",
  "image.violence",
  "screenshots.url",
  "screenshots.sexual",
  "screenshots.violence",
  "description",
  "released",
  "developers.name",
  "developers.original",
  "tags.name",
  "tags.rating",
  "tags.spoiler",
  "rating",
  "votecount",
  "length_minutes",
].join(",");

interface VndbTag {
  name?: string;
  rating?: number;
  spoiler?: number;
}

interface VndbDeveloper {
  name?: string;
  original?: string | null;
}

interface VndbImage {
  url?: string;
  sexual?: number;
  violence?: number;
}

interface VndbVn {
  id?: string;
  title?: string;
  alttitle?: string | null;
  image?: VndbImage | null;
  screenshots?: VndbImage[] | null;
  description?: string | null;
  released?: string | null;
  developers?: VndbDeveloper[] | null;
  tags?: VndbTag[] | null;
  rating?: number | null;
}

interface VndbResponse {
  results?: VndbVn[] | null;
}

function cleanTags(vn: VndbVn): string[] {
  const title = (vn.title ?? "").toLocaleLowerCase();
  const raw = (vn.tags ?? [])
    .filter((tag) => (tag.spoiler ?? 0) === 0 && (tag.rating ?? 0) >= 1.4)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .map((tag) => tag.name ?? "")
    .filter((tag) => tag && tag.toLocaleLowerCase() !== title);
  return uniqueStrings(raw, 10);
}

function developerOf(vn: VndbVn): string | null {
  const names = (vn.developers ?? [])
    .map((developer) => developer.name ?? "")
    .filter(Boolean);
  return names.length > 0 ? uniqueStrings(names, 4).join(" / ") : null;
}

function safeScreenshots(vn: VndbVn): string[] {
  return (vn.screenshots ?? [])
    .filter(
      (shot) =>
        Boolean(shot.url) &&
        (shot.sexual ?? 0) <= 1 &&
        (shot.violence ?? 0) <= 1,
    )
    .map((shot) => shot.url as string)
    .slice(0, 8);
}

function mapVn(vn: VndbVn, detail: boolean): MetadataCandidate | null {
  if (!vn.id) return null;
  const title = (vn.title ?? "").trim();
  if (!title) return null;
  const originalTitle = (vn.alttitle ?? "").trim() || null;
  const screenshots = detail ? safeScreenshots(vn) : [];
  return {
    source: "vndb",
    sourceId: vn.id,
    title,
    originalTitle: originalTitle && originalTitle !== title ? originalTitle : null,
    cover: vn.image?.url ?? null,
    banner: screenshots[0] ?? null,
    description: detail && vn.description ? stripBbcode(vn.description) : null,
    developer: detail ? developerOf(vn) : null,
    releaseDate: (vn.released ?? "").trim() || null,
    tags: cleanTags(vn),
    screenshots,
    rating: normalizeRating(vn.rating, 0.1),
    sourceUrl: `https://vndb.org/${vn.id}`,
  };
}

export async function searchVndb(query: string): Promise<MetadataCandidate[]> {
  return cachedJson(`vndb:search:${query.toLocaleLowerCase()}`, 600, async () => {
    const response = await fetchJson<VndbResponse>(
      API,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": VNDB_USER_AGENT,
        },
        body: JSON.stringify({
          filters: ["search", "=", query],
          fields: SEARCH_FIELDS,
          sort: "searchrank",
          results: 9,
        }),
      },
      "VNDB",
    );
    const items = Array.isArray(response.results) ? response.results : [];
    return items
      .map((vn) => mapVn(vn, false))
      .filter((item): item is MetadataCandidate => Boolean(item));
  });
}

export async function getVndbDetail(id: string): Promise<MetadataCandidate> {
  if (!/^v\d{1,10}$/.test(id)) {
    throw new Error("无效的 VNDB 条目 ID。");
  }
  return cachedJson(`vndb:detail:${id}`, 86400, async () => {
    const response = await fetchJson<VndbResponse>(
      API,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": VNDB_USER_AGENT,
        },
        body: JSON.stringify({
          filters: ["id", "=", id],
          fields: DETAIL_FIELDS,
          results: 1,
        }),
      },
      "VNDB",
    );
    const vn = response.results?.[0];
    if (!vn) throw new Error("VNDB 没有返回匹配的条目。");
    const candidate = mapVn(vn, true);
    if (!candidate) throw new Error("VNDB 条目内容不完整。");
    return candidate;
  });
}
