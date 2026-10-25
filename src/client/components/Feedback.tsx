import { AlertIcon, RefreshIcon } from "./Icons";

export function PageLoader({ label = "正在整理馆藏…" }: { label?: string }) {
  return (
    <div className="page-loader" role="status">
      <span className="orbit-loader" aria-hidden="true">
        <span />
      </span>
      <span>{label}</span>
    </div>
  );
}

export function ErrorNotice({
  title = "这一页暂时走丢了",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="notice-card error-notice" role="alert">
      <span className="notice-icon">
        <AlertIcon size={22} />
      </span>
      <div>
        <h2>{title}</h2>
        <p>{message}</p>
        {onRetry ? (
          <button className="button button-secondary button-small" type="button" onClick={onRetry}>
            <RefreshIcon size={15} />
            再试一次
          </button>
        ) : null}
      </div>
    </div>
  );
}
