import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertIcon, CloseIcon } from "./Icons";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "确认删除",
  cancelLabel = "取消",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => confirmRef.current?.focus(), 40);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div className="dialog-icon">
          <AlertIcon size={22} />
        </div>
        <div className="dialog-content">
          <span className="dialog-kicker">IRREVERSIBLE ACTION</span>
          <h2 id="dialog-title">{title}</h2>
          <p>{description}</p>
        </div>
        <button
          className="icon-button dialog-close"
          type="button"
          onClick={onCancel}
          aria-label="关闭"
          disabled={busy}
        >
          <CloseIcon size={18} />
        </button>
        <div className="dialog-actions">
          <button className="button button-ghost" type="button" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            className="button button-danger"
            type="button"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "处理中…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
