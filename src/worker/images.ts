import type { Context } from "hono";
import type { Bindings } from "./types";

const ALLOWED_IMAGE_HOSTS = new Set([
  "lain.bgm.tv",
  "t.vndb.org",
  "api.bgm.tv",
  "img.bgm.tv",
]);

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

function refererFor(hostname: string): string | undefined {
  if (hostname.endsWith("bgm.tv")) return "https://bgm.tv/";
  if (hostname.endsWith("vndb.org")) return "https://vndb.org/";
  return undefined;
}

export async function imageProxy(c: Context<{ Bindings: Bindings }>): Promise<Response> {
  const raw = c.req.query("url");
  if (!raw) return c.json({ error: "缺少图片地址。" }, 400);

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return c.json({ error: "图片地址无效。" }, 400);
  }

  if (target.protocol !== "https:" || !ALLOWED_IMAGE_HOSTS.has(target.hostname)) {
    return c.json({ error: "这个图片域名不在允许列表内。" }, 403);
  }

  const cache = typeof caches !== "undefined" ? caches.default : null;
  const cacheKey = new Request(c.req.url, { method: "GET" });
  if (cache) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  }

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (compatible; WebGalLibrary/1.0; +https://github.com/)",
        ...(refererFor(target.hostname) ? { Referer: refererFor(target.hostname) } : {}),
      },
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    return c.json({ error: "图片加载失败。" }, 502);
  }

  if (!upstream.ok || !upstream.body) {
    return c.json({ error: "图片加载失败。" }, 502);
  }

  const contentType = upstream.headers.get("Content-Type") ?? "image/jpeg";
  if (!contentType.toLowerCase().startsWith("image/")) {
    return c.json({ error: "上游返回的内容不是图片。" }, 502);
  }

  const contentLength = Number(upstream.headers.get("Content-Length") ?? "0");
  if (contentLength > MAX_IMAGE_BYTES) {
    return c.json({ error: "图片体积过大。" }, 413);
  }

  const headers = new Headers({
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=604800, immutable",
    "X-Content-Type-Options": "nosniff",
    "Cross-Origin-Resource-Policy": "cross-origin",
  });

  const response = new Response(upstream.body, { status: 200, headers });
  if (cache) {
    try {
      await cache.put(cacheKey, response.clone());
    } catch {
      // Caching is best-effort.
    }
  }
  return response;
}
