import { useCallback, useEffect, useRef, useState } from "react";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "galgame-library-theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

export function readThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    // localStorage can be unavailable in private / restricted contexts.
  }
  return "system";
}

export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "light" || mode === "dark") return mode;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

export function applyTheme(mode: ThemeMode, persist: boolean): ResolvedTheme {
  const resolved = resolveTheme(mode);
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.dataset.themeMode = mode;
  root.style.colorScheme = resolved;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", resolved === "dark" ? "#090a0f" : "#f3f5f9");
  }

  if (persist) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // The visual theme still applies even if persistence is unavailable.
    }
  }
  return resolved;
}

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(() => readThemeMode());
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(readThemeMode()));
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const initialMode = readThemeMode();
    setModeState(initialMode);
    const initialResolved = applyTheme(initialMode, false);
    setResolved(initialResolved);

    const media = window.matchMedia(DARK_QUERY);
    const onSchemeChange = () => {
      if (modeRef.current !== "system") return;
      const next = applyTheme("system", false);
      setResolved(next);
    };
    media.addEventListener("change", onSchemeChange);
    return () => media.removeEventListener("change", onSchemeChange);
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    modeRef.current = next;
    const applied = applyTheme(next, true);
    setResolved(applied);
  }, []);

  return { mode, resolved, setMode };
}
