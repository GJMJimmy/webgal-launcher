import { Hono } from "hono";
import {
  checkLoginAvailability,
  clearSessionCookie,
  getAuthInfo,
  issueSessionCookie,
  requireAdmin,
  sameOriginOnly,
  verifyLogin,
} from "./auth";
import { adminGamesRoutes, gamesRoutes } from "./games";
import { imageProxy } from "./images";
import { getMetadataDetail, searchMetadata } from "./metadata";
import { adminSettingsRoutes, DEFAULT_SITE_SETTINGS, readSiteSettings } from "./settings";
import type { Bindings } from "./types";
import { friendlyDatabaseError } from "./validation";

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", async (c, next) => {
  await next();
  const headers = new Headers(c.res.headers);
  headers.delete("Content-Encoding");
  headers.delete("Content-Length");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (c.req.path.startsWith("/api/") && c.req.path !== "/api/image") {
    headers.set("Cache-Control", "no-store");
  }
  c.res = new Response(c.res.body, {
    status: c.res.status,
    statusText: c.res.statusText,
    headers,
  });
});

app.get("/api/health", (c) =>
  c.json({ ok: true, service: "webgal-library", time: new Date().toISOString() }),
);

app.get("/api/site", async (c) => {
  let settings = DEFAULT_SITE_SETTINGS;
  try {
    settings = await readSiteSettings(c.env.DB);
  } catch {
    // Keep the public site usable if the settings migration has not run yet.
  }
  return c.json({
    name: c.env.SITE_NAME?.trim() || "GALGAME LIBRARY",
    tagline: c.env.SITE_TAGLINE?.trim() || "把喜欢的故事，收进自己的星图。",
    adminConfigured: Boolean(c.env.ADMIN_PASSWORD && c.env.SESSION_SECRET),
    showFeaturedHero: settings.showFeaturedHero,
  });
});

app.get("/api/image", imageProxy);

app.use("/api/auth/*", sameOriginOnly);
app.use("/api/admin/*", sameOriginOnly);
app.use("/api/admin/*", requireAdmin);

app.get("/api/auth/me", async (c) => c.json(await getAuthInfo(c)));

app.post("/api/auth/login", async (c) => {
  const availability = checkLoginAvailability(c);
  if (!availability.ok) {
    return c.json({ error: availability.message }, availability.status);
  }

  const contentLength = Number(c.req.header("Content-Length") ?? "0");
  if (contentLength > 64 * 1024) {
    return c.json({ error: "请求内容过大。" }, 413);
  }

  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return c.json({ error: "请求内容格式不正确。" }, 400);
  }
  const username = typeof (body as { username?: unknown }).username === "string"
    ? (body as { username: string }).username.trim()
    : "";
  const password = typeof (body as { password?: unknown }).password === "string"
    ? (body as { password: string }).password
    : "";

  if (!username || !password) {
    return c.json({ error: "请输入用户名和密码。" }, 400);
  }
  if (username.length > 80 || password.length > 256) {
    return c.json({ error: "用户名或密码不正确。" }, 401);
  }

  const valid = await verifyLogin(c, username, password);
  if (!valid) {
    return c.json({ error: "用户名或密码不正确。" }, 401);
  }

  await issueSessionCookie(c, username);
  return c.json({ authenticated: true, username });
});

app.post("/api/auth/logout", (c) => {
  clearSessionCookie(c);
  return c.json({ ok: true });
});

app.get("/api/admin/metadata/search", async (c) => {
  const query = (c.req.query("q") ?? "").trim();
  if (!query) return c.json({ error: "请输入游戏名称或资料链接。" }, 400);
  if (query.length > 300) return c.json({ error: "输入内容过长。" }, 400);

  const payload = await searchMetadata(query, {
    bangumiAccessToken: c.env.BANGUMI_ACCESS_TOKEN,
  });
  return c.json(payload);
});

app.get("/api/admin/metadata/detail", async (c) => {
  const source = c.req.query("source");
  const id = (c.req.query("id") ?? "").trim();
  if (source !== "bangumi" && source !== "vndb") {
    return c.json({ error: "不支持的数据来源。" }, 400);
  }
  if (!id || id.length > 40) {
    return c.json({ error: "缺少条目 ID。" }, 400);
  }
  try {
    const candidate = await getMetadataDetail(source, id, c.env.BANGUMI_ACCESS_TOKEN);
    return c.json({ candidate });
  } catch (error) {
    const message = error instanceof Error ? error.message : "抓取资料失败。";
    return c.json({ error: message }, 502);
  }
});

app.route("/api/games", gamesRoutes);
app.route("/api/admin/games", adminGamesRoutes);
app.route("/api/admin/settings", adminSettingsRoutes);

app.all("/api/*", (c) => c.json({ error: "接口不存在。" }, 404));

app.get("*", async (c) => {
  if (!c.env.ASSETS) return c.text("Static assets are not configured.", 500);
  return c.env.ASSETS.fetch(c.req.raw);
});

app.onError((error, c) => {
  console.error("Unhandled worker error:", error);
  if (c.req.path.startsWith("/api/")) {
    return c.json({ error: friendlyDatabaseError(error) }, 500);
  }
  return c.text("Internal Server Error", 500);
});

export default app;
