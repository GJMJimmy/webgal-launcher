import type {
  AuthInfo,
  Game,
  GameInput,
  MetadataCandidate,
  SearchMetadataResponse,
  SiteInfo,
  SiteSettings,
} from "../shared/types";

export class ApiError extends Error {
  status: number;
  details?: string[];

  constructor(message: string, status: number, details?: string[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "include",
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const body = payload as { error?: string; details?: string[] } | null;
    throw new ApiError(
      body?.error || `请求失败（${response.status}）`,
      response.status,
      body?.details,
    );
  }
  return payload as T;
}

export const api = {
  getSite: () => request<SiteInfo>("/api/site"),
  getGames: () => request<{ games: Game[] }>("/api/games"),
  getGame: (id: string) => request<{ game: Game }>(`/api/games/${encodeURIComponent(id)}`),
  getAuth: () => request<AuthInfo>("/api/auth/me"),
  login: (username: string, password: string) =>
    request<{ authenticated: boolean; username: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  searchMetadata: (query: string) =>
    request<SearchMetadataResponse>(
      `/api/admin/metadata/search?q=${encodeURIComponent(query)}`,
    ),
  getMetadataDetail: (source: string, id: string) =>
    request<{ candidate: MetadataCandidate }>(
      `/api/admin/metadata/detail?source=${encodeURIComponent(source)}&id=${encodeURIComponent(id)}`,
    ),
  createGame: (input: GameInput) =>
    request<{ game: Game }>("/api/admin/games", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateGame: (id: string, input: GameInput) =>
    request<{ game: Game }>(`/api/admin/games/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  deleteGame: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/games/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  reorderGames: (ids: string[]) =>
    request<{ games: Game[] }>("/api/admin/games/reorder", {
      method: "PUT",
      body: JSON.stringify({ ids }),
    }),
  updateSettings: (settings: SiteSettings) =>
    request<{ settings: SiteSettings }>("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    }),
};
