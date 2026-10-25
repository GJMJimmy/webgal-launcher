import { Hono } from "hono";
import type { SiteSettings } from "../shared/types";
import type { Bindings } from "./types";

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  showFeaturedHero: true,
};

export async function readSiteSettings(db: D1Database): Promise<SiteSettings> {
  const row = await db
    .prepare("SELECT show_featured_hero FROM site_settings WHERE id = 1")
    .first<{ show_featured_hero: number }>();
  return {
    showFeaturedHero: row ? row.show_featured_hero === 1 : true,
  };
}

export const adminSettingsRoutes = new Hono<{ Bindings: Bindings }>();

adminSettingsRoutes.get("/", async (c) => {
  const settings = await readSiteSettings(c.env.DB);
  return c.json({ settings });
});

adminSettingsRoutes.put("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return c.json({ error: "请求内容格式不正确。" }, 400);
  }
  const showFeaturedHero = (body as { showFeaturedHero?: unknown }).showFeaturedHero;
  if (typeof showFeaturedHero !== "boolean") {
    return c.json({ error: "showFeaturedHero 必须是布尔值。" }, 400);
  }

  const now = new Date().toISOString();
  await c.env.DB.prepare(
    `INSERT INTO site_settings (id, show_featured_hero, updated_at)
     VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       show_featured_hero = excluded.show_featured_hero,
       updated_at = excluded.updated_at`,
  )
    .bind(showFeaturedHero ? 1 : 0, now)
    .run();

  const settings: SiteSettings = { showFeaturedHero };
  return c.json({ settings });
});
