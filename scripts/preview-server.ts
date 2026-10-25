/**
 * Local preview server for environments where the Cloudflare workerd runtime
 * cannot start (for example, some Windows VMs with an outdated VC++ runtime).
 *
 * This is NOT the production runtime. Production uses Cloudflare Workers +
 * D1 through `wrangler dev` / `wrangler deploy`. This file only exists so the
 * UI and API can still be reviewed locally with node:sqlite.
 */
import { createServer, type IncomingMessage } from "node:http";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";
import { DatabaseSync } from "node:sqlite";
import app from "../src/worker/index";

const root = resolve(process.cwd());
const dist = resolve(root, "dist/client");
const dataDir = resolve(root, ".wrangler/preview-data");
if (!existsSync(resolve(dist, "index.html"))) {
  console.error("dist/client 不存在，请先运行 `pnpm build`。");
  process.exit(1);
}
mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(join(dataDir, "library.sqlite"));
const migrationsDir = resolve(root, "migrations");
for (const file of readdirSync(migrationsDir)
  .filter((entry) => entry.endsWith(".sql"))
  .sort()) {
  db.exec(readFileSync(join(migrationsDir, file), "utf8"));
}

const count = db.prepare("SELECT COUNT(*) AS count FROM games").get() as { count: number };
const seedMarker = join(dataDir, ".seeded");
if (
  count.count === 0 &&
  !existsSync(seedMarker) &&
  existsSync(resolve(root, "seed/demo.sql"))
) {
  db.exec(readFileSync(resolve(root, "seed/demo.sql"), "utf8"));
  writeFileSync(seedMarker, new Date().toISOString(), "utf8");
  console.log("已载入 10 部本地演示作品（仅预览数据库，不会影响部署后的 D1）。");
}

class D1Statement {
  private values: unknown[] = [];

  constructor(
    private database: DatabaseSync,
    private sql: string,
  ) {}

  bind(...values: unknown[]) {
    this.values = values.map((value) => (value === undefined ? null : value));
    return this;
  }

  async first<T>() {
    const row = this.database.prepare(this.sql).get(...(this.values as never[]));
    return (row ?? null) as T | null;
  }

  async all<T>() {
    const rows = this.database.prepare(this.sql).all(...(this.values as never[]));
    return {
      results: rows as T[],
      success: true,
      meta: { changes: 0, last_row_id: 0 },
    };
  }

  async run() {
    const info = this.database.prepare(this.sql).run(...(this.values as never[]));
    return {
      results: [],
      success: true,
      meta: {
        changes: Number(info.changes),
        last_row_id: Number(info.lastInsertRowid),
      },
    };
  }
}

const fakeDb = {
  prepare(sql: string) {
    return new D1Statement(db, sql);
  },
  async batch(statements: D1Statement[]) {
    const results = [];
    for (const statement of statements) {
      results.push(await statement.run());
    }
    return results;
  },
};

const contentTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".json": "application/json; charset=utf-8",
};

const assets = {
  async fetch(request: Request) {
    const pathname = decodeURIComponent(new URL(request.url).pathname);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    let file = resolve(dist, relative);
    if (!file.startsWith(dist + sep) && file !== resolve(dist, "index.html")) {
      return new Response("Not found", { status: 404 });
    }
    if (!existsSync(file) || statSync(file).isDirectory()) {
      file = resolve(dist, "index.html");
    }
    const body = readFileSync(file);
    const headers = new Headers({
      "Content-Type": contentTypes[extname(file).toLowerCase()] ?? "application/octet-stream",
      "Cache-Control": file.endsWith("index.html") ? "no-cache" : "public, max-age=60",
    });
    return new Response(request.method === "HEAD" ? null : body, { status: 200, headers });
  },
};

function loadDevVars(): Record<string, string> {
  const path = resolve(root, ".dev.vars");
  if (!existsSync(path)) return {};
  const values: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) values[match[1]] = match[2];
  }
  return values;
}

const devVars = loadDevVars();
if (!devVars.ADMIN_PASSWORD) {
  console.warn("未找到 .dev.vars，预览管理员使用临时密码 admin123。请勿用于生产。");
}

const env = {
  DB: fakeDb,
  ASSETS: assets,
  SITE_NAME: "GALGAME LIBRARY",
  SITE_TAGLINE: "把喜欢的故事，收进自己的星图。",
  ADMIN_USERNAME: devVars.ADMIN_USERNAME || "admin",
  ADMIN_PASSWORD: devVars.ADMIN_PASSWORD || "admin123",
  SESSION_SECRET:
    devVars.SESSION_SECRET || "local-preview-only-secret-do-not-deploy-this-value",
  BANGUMI_ACCESS_TOKEN: devVars.BANGUMI_ACCESS_TOKEN || "",
};

const ctx = {
  waitUntil() {},
  passThroughOnException() {},
};

(globalThis as Record<string, unknown>).caches = {
  default: {
    match: async () => undefined,
    put: async () => undefined,
  },
};

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolvePromise, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolvePromise(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const port = Number(process.env.PORT || 8787);

createServer(async (req, res) => {
  try {
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (!value) continue;
      headers.set(key, Array.isArray(value) ? value.join(",") : value);
    }
    const hasBody = req.method !== "GET" && req.method !== "HEAD";
    const body = hasBody ? await readBody(req) : undefined;
    const request = new Request(`http://${req.headers.host ?? `127.0.0.1:${port}`}${req.url}`, {
      method: req.method,
      headers,
      body,
      ...(body ? { duplex: "half" } : {}),
    } as RequestInit);
    const response = await app.fetch(request, env as never, ctx as never);
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    const payload = Buffer.from(await response.arrayBuffer());
    res.end(payload);
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`\n本地预览：http://127.0.0.1:${port}`);
  console.log(`管理后台：http://127.0.0.1:${port}/admin/login`);
  console.log("此模式使用 Node + SQLite 模拟 D1，仅用于本地预览。\n");
});
