import { Hono } from "hono";
import type { Game } from "../shared/types";
import type { Bindings, GameRow, NormalizedGameInput } from "./types";
import { rowToGame, validateGameInput } from "./validation";

export const gamesRoutes = new Hono<{ Bindings: Bindings }>();
export const adminGamesRoutes = new Hono<{ Bindings: Bindings }>();

async function listGames(db: D1Database): Promise<Game[]> {
  const result = await db
    .prepare(
      `SELECT * FROM games
       ORDER BY sort_order ASC, created_at DESC`,
    )
    .all<GameRow>();
  return (result.results ?? []).map(rowToGame);
}

async function getGameRow(db: D1Database, id: string): Promise<GameRow | null> {
  return await db.prepare("SELECT * FROM games WHERE id = ?").bind(id).first<GameRow>();
}

gamesRoutes.get("/", async (c) => {
  const games = await listGames(c.env.DB);
  return c.json({ games });
});

gamesRoutes.get("/:id", async (c) => {
  const row = await getGameRow(c.env.DB, c.req.param("id"));
  if (!row) return c.json({ error: "没有找到这个游戏。" }, 404);
  return c.json({ game: rowToGame(row) });
});

function bindValues(input: NormalizedGameInput) {
  return [
    input.title,
    input.originalTitle,
    input.url,
    input.cover,
    input.banner,
    input.description,
    input.developer,
    input.releaseDate,
    JSON.stringify(input.tags),
    JSON.stringify(input.screenshots),
    input.source,
    input.sourceId,
    input.rating,
    input.featured ? 1 : 0,
    input.sortOrder,
  ];
}

adminGamesRoutes.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const { data, errors } = validateGameInput(body);
  if (!data || errors.length > 0) {
    return c.json({ error: "请检查填写的内容。", details: errors }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await c.env.DB.prepare(
    `INSERT INTO games (
      id, title, original_title, url, cover, banner, description, developer,
      release_date, tags, screenshots, source, source_id, rating, featured,
      sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, ...bindValues(data), now, now)
    .run();

  const row = await getGameRow(c.env.DB, id);
  return c.json({ game: row ? rowToGame(row) : null }, 201);
});

adminGamesRoutes.put("/reorder", async (c) => {
  const body = await c.req.json().catch(() => null);
  const ids =
    body && typeof body === "object" && Array.isArray((body as { ids?: unknown }).ids)
      ? (body as { ids: unknown[] }).ids
      : null;
  if (!ids || ids.length > 1000 || !ids.every((id): id is string => typeof id === "string")) {
    return c.json({ error: "顺序数据格式不正确。" }, 400);
  }
  if (new Set(ids).size !== ids.length) {
    return c.json({ error: "顺序数据中有重复的作品。" }, 400);
  }

  const existing = await listGames(c.env.DB);
  const existingIds = new Set(existing.map((game) => game.id));
  if (ids.length !== existing.length || ids.some((id) => !existingIds.has(id))) {
    return c.json({ error: "馆藏已发生变化，请刷新后重新调整顺序。" }, 409);
  }

  const statements = ids.map((id, index) =>
    c.env.DB.prepare("UPDATE games SET sort_order = ? WHERE id = ?").bind(
      (index + 1) * 10,
      id,
    ),
  );
  if (statements.length > 0) await c.env.DB.batch(statements);

  return c.json({ games: await listGames(c.env.DB) });
});

adminGamesRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await getGameRow(c.env.DB, id);
  if (!existing) return c.json({ error: "没有找到这个游戏。" }, 404);

  const body = await c.req.json().catch(() => null);
  const { data, errors } = validateGameInput(body);
  if (!data || errors.length > 0) {
    return c.json({ error: "请检查填写的内容。", details: errors }, 400);
  }

  const now = new Date().toISOString();
  await c.env.DB.prepare(
    `UPDATE games SET
      title = ?, original_title = ?, url = ?, cover = ?, banner = ?,
      description = ?, developer = ?, release_date = ?, tags = ?,
      screenshots = ?, source = ?, source_id = ?, rating = ?, featured = ?,
      sort_order = ?, updated_at = ?
    WHERE id = ?`,
  )
    .bind(...bindValues(data), now, id)
    .run();

  const row = await getGameRow(c.env.DB, id);
  return c.json({ game: row ? rowToGame(row) : null });
});

adminGamesRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const result = await c.env.DB.prepare("DELETE FROM games WHERE id = ?").bind(id).run();
  if (!result.meta.changes) {
    return c.json({ error: "没有找到这个游戏。" }, 404);
  }
  return c.json({ ok: true });
});
