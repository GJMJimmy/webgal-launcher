import { useEffect } from "react";
import { createPortal } from "react-dom";
import { resolveImageSrc } from "../utils";
import { ArrowLeftIcon, ArrowRightIcon, CloseIcon } from "./Icons";

interface LightboxProps {
  images: string[];
  index: number | null;
  title: string;
  onClose: () => void;
  onChange: (index: number) => void;
}

export function Lightbox({ images, index, title, onClose, onChange }: LightboxProps) {
  useEffect(() => {
    if (index === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && images.length > 1) {
        onChange((index - 1 + images.length) % images.length);
      }
      if (event.key === "ArrowRight" && images.length > 1) {
        onChange((index + 1) % images.length);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [index, images.length, onClose, onChange]);

  if (index === null || !images[index]) return null;

  return createPortal(
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} 画面预览`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button className="lightbox-close" type="button" onClick={onClose} aria-label="关闭预览">
        <CloseIcon size={22} />
      </button>
      {images.length > 1 ? (
        <button
          className="lightbox-arrow left"
          type="button"
          aria-label="上一张"
          onClick={() => onChange((index - 1 + images.length) % images.length)}
        >
          <ArrowLeftIcon size={22} />
        </button>
      ) : null}
      <figure className="lightbox-figure">
        <img src={resolveImageSrc(images[index])} alt={`${title} 画面 ${index + 1}`} />
        <figcaption>
          <span>{title}</span>
          <span>
            {index + 1} / {images.length}
          </span>
        </figcaption>
      </figure>
      {images.length > 1 ? (
        <button
          className="lightbox-arrow right"
          type="button"
          aria-label="下一张"
          onClick={() => onChange((index + 1) % images.length)}
        >
          <ArrowRightIcon size={22} />
        </button>
      ) : null}
    </div>,
    document.body,
  );
}
