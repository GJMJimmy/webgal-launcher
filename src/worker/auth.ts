import type { Context, MiddlewareHandler } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { AuthInfo } from "../shared/types";
import type { AdminSession, Bindings } from "./types";

export const SESSION_COOKIE = "webgal_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 8;

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

async function hmac(secret: string, value: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

async function digest(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

async function constantTimeEqual(left: string, right: string): Promise<boolean> {
  const [a, b] = await Promise.all([digest(left), digest(right)]);
  let difference = 0;
  for (let i = 0; i < a.length; i += 1) difference |= a[i] ^ b[i];
  return difference === 0;
}

export async function createSessionToken(
  username: string,
  secret: string,
): Promise<string> {
  const payload = toBase64Url(
    encoder.encode(
      JSON.stringify({
        sub: username,
        exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
        iat: Math.floor(Date.now() / 1000),
      }),
    ),
  );
  const signature = toBase64Url(await hmac(secret, payload));
  return `${payload}.${signature}`;
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string | undefined,
): Promise<AdminSession | null> {
  if (!token || !secret) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const provided = fromBase64Url(signature);
  if (!provided) return null;
  const expected = await hmac(secret, payload);
  if (provided.length !== expected.length) return null;

  let difference = 0;
  for (let i = 0; i < expected.length; i += 1) {
    difference |= provided[i] ^ expected[i];
  }
  if (difference !== 0) return null;

  try {
    const rawPayload = fromBase64Url(payload);
    if (!rawPayload) return null;
    const data = JSON.parse(new TextDecoder().decode(rawPayload)) as {
      sub?: unknown;
      exp?: unknown;
    };
    if (typeof data.sub !== "string" || typeof data.exp !== "number") return null;
    if (data.exp <= Math.floor(Date.now() / 1000)) return null;
    return { username: data.sub, expiresAt: data.exp };
  } catch {
    return null;
  }
}

function isConfigured(env: Bindings): boolean {
  return Boolean(env.ADMIN_PASSWORD && env.SESSION_SECRET);
}

export async function getAuthInfo(
  c: Context<{ Bindings: Bindings }>,
): Promise<AuthInfo> {
  const configured = isConfigured(c.env);
  const session = await verifySessionToken(
    getCookie(c, SESSION_COOKIE),
    c.env.SESSION_SECRET,
  );
  return {
    authenticated: Boolean(session),
    username: session?.username ?? null,
    configured,
  };
}

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function clientKey(c: Context<{ Bindings: Bindings }>): string {
  return c.req.header("CF-Connecting-IP") ?? c.req.header("X-Forwarded-For") ?? "local";
}

function isRateLimited(key: string): boolean {
  const entry = loginAttempts.get(key);
  if (!entry) return false;
  if (entry.resetAt <= Date.now()) {
    loginAttempts.delete(key);
    return false;
  }
  return entry.count >= MAX_LOGIN_ATTEMPTS;
}

function markFailure(key: string): void {
  if (loginAttempts.size > 500) loginAttempts.clear();
  const current = loginAttempts.get(key);
  if (!current || current.resetAt <= Date.now()) {
    loginAttempts.set(key, { count: 1, resetAt: Date.now() + LOGIN_WINDOW_MS });
    return;
  }
  current.count += 1;
}

export function clearLoginFailures(c: Context<{ Bindings: Bindings }>): void {
  loginAttempts.delete(clientKey(c));
}

export async function issueSessionCookie(
  c: Context<{ Bindings: Bindings }>,
  username: string,
): Promise<void> {
  const token = await createSessionToken(username, c.env.SESSION_SECRET as string);
  setCookie(c, SESSION_COOKIE, token, {
    path: "/",
    httpOnly: true,
    secure: new URL(c.req.url).protocol === "https:",
    sameSite: "Lax",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(c: Context<{ Bindings: Bindings }>): void {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
}

export const requireAdmin: MiddlewareHandler<{ Bindings: Bindings }> = async (
  c,
  next,
) => {
  const session = await verifySessionToken(
    getCookie(c, SESSION_COOKIE),
    c.env.SESSION_SECRET,
  );
  if (!session) {
    return c.json({ error: "请先登录管理员账号。" }, 401);
  }
  await next();
};

export function checkLoginAvailability(
  c: Context<{ Bindings: Bindings }>,
): { ok: true } | { ok: false; message: string; status: 429 | 500 } {
  if (!isConfigured(c.env)) {
    return {
      ok: false,
      status: 500,
      message:
        "管理员登录尚未配置。请为 Worker 设置 ADMIN_PASSWORD 与 SESSION_SECRET 环境变量。",
    };
  }
  const key = clientKey(c);
  if (isRateLimited(key)) {
    return {
      ok: false,
      status: 429,
      message: "尝试次数过多，请稍后再试。",
    };
  }
  return { ok: true };
}

export async function verifyLogin(
  c: Context<{ Bindings: Bindings }>,
  username: string,
  password: string,
): Promise<boolean> {
  const expectedUser = c.env.ADMIN_USERNAME?.trim() || "admin";
  const expectedPassword = c.env.ADMIN_PASSWORD as string;
  const [usernameOk, passwordOk] = await Promise.all([
    constantTimeEqual(username, expectedUser),
    constantTimeEqual(password, expectedPassword),
  ]);
  if (!usernameOk || !passwordOk) {
    markFailure(clientKey(c));
    return false;
  }
  clearLoginFailures(c);
  return true;
}

export function recordFailedLogin(c: Context<{ Bindings: Bindings }>): void {
  markFailure(clientKey(c));
}

export async function sameOriginOnly(
  c: Context<{ Bindings: Bindings }>,
  next: () => Promise<void>,
): Promise<void | Response> {
  const method = c.req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    await next();
    return;
  }

  if (c.req.header("Sec-Fetch-Site") === "cross-site") {
    return c.json({ error: "跨站请求已被拒绝。" }, 403);
  }

  const origin = c.req.header("Origin");
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(c.req.url).host) {
        return c.json({ error: "跨站请求已被拒绝。" }, 403);
      }
    } catch {
      return c.json({ error: "无效的请求来源。" }, 403);
    }
  }
  await next();
}
