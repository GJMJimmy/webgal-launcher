import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import type { AuthInfo, SiteInfo } from "../shared/types";
import { api, ApiError } from "./api";
import { AlertIcon, CheckIcon, InfoIcon } from "./components/Icons";

const DEFAULT_SITE: SiteInfo = {
  name: "GALGAME LIBRARY",
  tagline: "把喜欢的故事，收进自己的星图。",
  adminConfigured: true,
  showFeaturedHero: true,
};

interface SiteContextValue {
  site: SiteInfo;
  loading: boolean;
  refresh: () => Promise<SiteInfo>;
}

const SiteContext = createContext<SiteContextValue>({
  site: DEFAULT_SITE,
  loading: true,
  refresh: async () => DEFAULT_SITE,
});

export function SiteProvider({ children }: { children: ReactNode }) {
  const [site, setSite] = useState<SiteInfo>(DEFAULT_SITE);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const value = await api.getSite();
    setSite(value);
    return value;
  }, []);

  useEffect(() => {
    let alive = true;
    api
      .getSite()
      .then((value) => {
        if (!alive) return;
        setSite(value);
      })
      .catch(() => {
        // The defaults keep the shell usable while the API is offline.
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    document.title = site.name;
  }, [site.name]);

  const value = useMemo(() => ({ site, loading, refresh }), [site, loading, refresh]);
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteContextValue {
  return useContext(SiteContext);
}

interface AuthContextValue {
  user: string | null;
  configured: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  configured: true,
  loading: true,
  refresh: async () => undefined,
  login: async () => undefined,
  logout: async () => undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthInfo & { loading: boolean }>({
    authenticated: false,
    username: null,
    configured: true,
    loading: true,
  });

  const refresh = useCallback(async () => {
    try {
      const info = await api.getAuth();
      setState({ ...info, loading: false });
    } catch {
      setState({
        authenticated: false,
        username: null,
        configured: true,
        loading: false,
      });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (username: string, password: string) => {
      await api.login(username, password);
      await refresh();
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setState({
        authenticated: false,
        username: null,
        configured: true,
        loading: false,
      });
    }
  }, []);

  const value = useMemo(
    () => ({
      user: state.authenticated ? state.username : null,
      configured: state.configured,
      loading: state.loading,
      refresh,
      login,
      logout,
    }),
    [state.authenticated, state.username, state.configured, state.loading, refresh, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => undefined });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, number>());

  useEffect(() => {
    const current = timers.current;
    return () => {
      for (const timer of current.values()) window.clearTimeout(timer);
      current.clear();
    };
  }, []);

  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    setItems((current) => [...current.slice(-3), { id, message, kind }]);
    const timer = window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
      timers.current.delete(id);
    }, 4200);
    timers.current.set(id, timer);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {items.map((item) => (
          <div key={item.id} className={`toast toast-${item.kind}`}>
            <span className="toast-icon">
              {item.kind === "success" ? (
                <CheckIcon size={16} />
              ) : item.kind === "error" ? (
                <AlertIcon size={16} />
              ) : (
                <InfoIcon size={16} />
              )}
            </span>
            <span>{item.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

export function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);
  return null;
}

export function usePageTitle(title?: string) {
  const { site } = useSite();
  useEffect(() => {
    document.title = title ? `${title} · ${site.name}` : site.name;
  }, [title, site.name]);
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "发生未知错误，请稍后再试。";
}
