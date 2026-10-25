import { useEffect, useId, useRef, useState } from "react";
import { useTheme, type ResolvedTheme, type ThemeMode } from "../theme";
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from "./Icons";

const OPTIONS: Array<{
  mode: ThemeMode;
  label: string;
  description: string;
}> = [
  { mode: "system", label: "跟随系统", description: "自动匹配设备外观" },
  { mode: "light", label: "浅色模式", description: "明亮、纸感的书库" },
  { mode: "dark", label: "深色模式", description: "沉浸式夜间界面" },
];

function ModeIcon({ mode, size = 16 }: { mode: ThemeMode; size?: number }) {
  if (mode === "light") return <SunIcon size={size} />;
  if (mode === "dark") return <MoonIcon size={size} />;
  return <MonitorIcon size={size} />;
}

function EffectiveIcon({ resolved, size = 16 }: { resolved: ResolvedTheme; size?: number }) {
  return resolved === "light" ? <SunIcon size={size} /> : <MoonIcon size={size} />;
}

export function ThemeToggle({ compactLabel = false }: { compactLabel?: boolean }) {
  const { mode, resolved, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const current = OPTIONS.find((option) => option.mode === mode) ?? OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="theme-toggle-wrap" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`theme-toggle ${open ? "is-open" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`主题：${current.label}`}
        title={`主题：${current.label}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="theme-toggle-icon">
          <EffectiveIcon resolved={resolved} size={16} />
        </span>
        {!compactLabel ? <span className="theme-toggle-label">{current.label}</span> : null}
        <span className="theme-toggle-caret" aria-hidden="true" />
      </button>

      {open ? (
        <div className="theme-menu" id={menuId} role="menu" aria-label="选择主题">
          <span className="theme-menu-kicker">APPEARANCE</span>
          {OPTIONS.map((option) => (
            <button
              key={option.mode}
              type="button"
              role="menuitemradio"
              aria-checked={mode === option.mode}
              className={`theme-menu-item ${mode === option.mode ? "is-active" : ""}`}
              onClick={() => {
                setMode(option.mode);
                setOpen(false);
                buttonRef.current?.focus();
              }}
            >
              <span className="theme-menu-icon">
                <ModeIcon mode={option.mode} size={16} />
              </span>
              <span className="theme-menu-copy">
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
              {mode === option.mode ? (
                <span className="theme-menu-check">
                  <CheckIcon size={13} />
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
