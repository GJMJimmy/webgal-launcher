export const BANGUMI_USER_AGENT =
  "WebGalLibrary/1.0 (personal galgame archive; +https://github.com/)";
export const VNDB_USER_AGENT =
  "WebGalLibrary/1.0 (personal galgame archive; +https://github.com/)";

export class MetadataUpstreamError extends Error {
  constructor(
    public source: string,
    message: string,
  ) {
    super(message);
    this.name = "MetadataUpstreamError";
  }
}

export async function fetchJson<T>(
  url: string,
  init: RequestInit,
  label: string,
  timeoutMs = 10000,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new MetadataUpstreamError(label, `${label} 连接失败：${message}`);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new MetadataUpstreamError(
      label,
      `${label} 返回了 ${response.status}${body ? `：${body.slice(0, 120)}` : ""}`,
    );
  }
  return (await response.json()) as T;
}

export async function cachedJson<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  if (typeof caches === "undefined") return loader();
  const cache = caches.default;
  const cacheKey = new Request(
    `https://webgal-metadata.internal/${encodeURIComponent(key)}`,
    { method: "GET" },
  );

  try {
    const cached = await cache.match(cacheKey);
    if (cached) return (await cached.json()) as T;
  } catch {
    // A cache miss or an unavailable cache should never break scraping.
  }

  const value = await loader();
  try {
    await cache.put(
      cacheKey,
      new Response(JSON.stringify(value), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": `public, max-age=${ttlSeconds}`,
        },
      }),
    );
  } catch {
    // Ignore cache write failures.
  }
  return value;
}

export function uniqueStrings(values: string[], limit: number): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;
    const key = value.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
    if (result.length >= limit) break;
  }
  return result;
}

export function normalizeRating(value: number | null | undefined, scale = 1): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  const normalized = value * scale;
  if (normalized > 10) return null;
  return Math.round(normalized * 10) / 10;
}

export function stripBbcode(input: string): string {
  let text = input.replace(/\r\n?/g, "\n");
  text = text.replace(/\[spoiler\][\s\S]*?\[\/spoiler\]/gi, "");
  text = text.replace(/\[url=[^\]]*\]([\s\S]*?)\[\/url\]/gi, "$1");
  text = text.replace(/\[url\]([\s\S]*?)\[\/url\]/gi, "$1");
  text = text.replace(/\[img\][\s\S]*?\[\/img\]/gi, "");
  text = text.replace(
    /\[\/?(?:b|i|u|s|code|quote|center|right|left|size|color|font|spoiler|url|img|raw)(?:=[^\]]*)?\]/gi,
    "",
  );
  text = text.replace(/\[([a-z][a-z0-9_]*)(?:=[^\]]*)?\]([\s\S]*?)\[\/\1\]/gi, "$2");
  text = text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
  return text.replace(/\n{3,}/g, "\n\n").trim().slice(0, 16000);
}
