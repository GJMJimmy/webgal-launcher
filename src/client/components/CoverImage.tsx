import { useEffect, useRef, useState } from "react";
import { fallbackStyle, resolveImageSrc } from "../utils";

interface CoverImageProps {
  src: string | null | undefined;
  title: string;
  alt?: string;
  className?: string;
  eager?: boolean;
}

export function CoverImage({
  src,
  title,
  alt,
  className = "",
  eager = false,
}: CoverImageProps) {
  const resolved = resolveImageSrc(src);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const retryTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    setFailed(false);
    setRetry(0);
  }, [resolved]);

  useEffect(() => {
    return () => {
      if (retryTimer.current) window.clearTimeout(retryTimer.current);
    };
  }, []);

  if (!resolved || failed) {
    const glyph = Array.from(title.trim()).slice(0, 2).join("") || "G";
    return (
      <div
        className={`cover-fallback ${className}`}
        style={fallbackStyle(title)}
        role="img"
        aria-label={`${title} 暂无封面`}
      >
        <span className="cover-fallback-glyph">{glyph}</span>
        <span className="cover-fallback-brand">GALGAME LIBRARY</span>
        <span className="cover-fallback-line" />
        <span className="cover-fallback-line short" />
      </div>
    );
  }

  const canRetry = resolved.startsWith("/api/image");
  const imageSrc =
    retry > 0
      ? `${resolved}${resolved.includes("?") ? "&" : "?"}retry=${retry}`
      : resolved;

  return (
    <img
      className={className}
      src={imageSrc}
      alt={alt ?? `${title} 封面`}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        if (canRetry && retry === 0) {
          retryTimer.current = window.setTimeout(() => setRetry(1), 900);
          return;
        }
        setFailed(true);
      }}
    />
  );
}
