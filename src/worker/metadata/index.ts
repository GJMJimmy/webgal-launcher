import type { MetadataCandidate, ScrapeSource } from "../../shared/types";
import { searchBangumi, getBangumiDetail } from "./bangumi";
import { searchVndb, getVndbDetail } from "./vndb";

function normalizeComparable(value: string): string {
  return value
    .toLocaleLowerCase()
    .replace(/[\s\-–—_.,:;!?'"()[\]{}~·・/\\]/g, "");
}

function relevance(candidate: MetadataCandidate, query: string): number {
  const key = normalizeComparable(query);
  const titles = [candidate.title, candidate.originalTitle ?? ""].map(normalizeComparable);
  let score = 0;
  for (const title of titles) {
    if (!title) continue;
    if (title === key) score = Math.max(score, 100);
    else if (title.startsWith(key) || key.startsWith(title)) score = Math.max(score, 70);
    else if (title.includes(key) || key.includes(title)) score = Math.max(score, 45);
  }
  return score;
}

export function parseMetadataLink(
  value: string,
): { source: ScrapeSource; id: string } | null {
  const bangumi =
    value.match(/(?:bgm\.tv|bangumi\.tv)\/subject\/(\d+)/i) ??
    value.match(/api\.bgm\.tv\/v0\/subjects\/(\d+)/i);
  if (bangumi) return { source: "bangumi", id: bangumi[1] };

  const vndb = value.match(/vndb\.org\/v(\d+)(?:[/?#]|$)/i);
  if (vndb) return { source: "vndb", id: `v${vndb[1]}` };

  return null;
}

function looksLikeLink(value: string): boolean {
  return /^https?:\/\//i.test(value) || /(?:bgm\.tv|bangumi\.tv|vndb\.org)\//i.test(value);
}

export async function searchMetadata(
  query: string,
  options: { bangumiAccessToken?: string } = {},
): Promise<{
  results: MetadataCandidate[];
  warnings: string[];
}> {
  const cleaned = query.trim().replace(/\s+/g, " ");
  const linked = parseMetadataLink(cleaned);

  if (linked) {
    try {
      const candidate = await getMetadataDetail(
        linked.source,
        linked.id,
        options.bangumiAccessToken,
      );
      return { results: [candidate], warnings: [] };
    } catch (error) {
      const message = error instanceof Error ? error.message : "无法读取该资料条目。";
      return {
        results: [],
        warnings: [`已识别 ${SOURCE_LABELS[linked.source]} 链接，但读取失败：${message}`],
      };
    }
  }

  if (looksLikeLink(cleaned)) {
    return {
      results: [],
      warnings: [
        "无法识别这个链接。支持 Bangumi（bgm.tv/subject/ID）和 VNDB（vndb.org/vID）条目链接。",
      ],
    };
  }

  const [bangumi, vndb] = await Promise.allSettled([
    searchBangumi(cleaned, options.bangumiAccessToken),
    searchVndb(cleaned),
  ]);

  const results: MetadataCandidate[] = [];
  const warnings: string[] = [];

  if (bangumi.status === "fulfilled") results.push(...bangumi.value);
  else warnings.push("Bangumi 暂时无法连接，已尝试改用 VNDB。");

  if (vndb.status === "fulfilled") results.push(...vndb.value);
  else warnings.push("VNDB 暂时无法连接，已尝试改用 Bangumi。");

  const deduplicated: MetadataCandidate[] = [];
  const seen = new Set<string>();
  for (const item of results) {
    const key = `${item.source}:${item.sourceId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduplicated.push(item);
  }

  return {
    results: deduplicated
      .map((candidate, index) => ({ candidate, index, score: relevance(candidate, cleaned) }))
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map((item) => item.candidate),
    warnings,
  };
}

export async function getMetadataDetail(
  source: ScrapeSource,
  id: string,
  bangumiAccessToken?: string,
): Promise<MetadataCandidate> {
  if (source === "bangumi") return getBangumiDetail(id, bangumiAccessToken);
  if (source === "vndb") return getVndbDetail(id);
  throw new Error("不支持的数据来源。");
}

export const SOURCE_LABELS: Record<ScrapeSource, string> = {
  bangumi: "Bangumi",
  vndb: "VNDB",
};
