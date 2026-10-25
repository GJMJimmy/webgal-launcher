import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import type { Game } from "../../shared/types";
import { api, ApiError } from "../api";
import { CoverImage } from "../components/CoverImage";
import { ErrorNotice, PageLoader } from "../components/Feedback";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  BuildingIcon,
  CalendarIcon,
  EditIcon,
  ExternalLinkIcon,
  ImageIcon,
  LibraryIcon,
  PlayIcon,
  SparklesIcon,
  StarIcon,
} from "../components/Icons";
import { Lightbox } from "../components/Lightbox";
import { errorMessage, useAuth, usePageTitle, useToast } from "../providers";
import {
  formatDate,
  formatDateTime,
  formatYear,
  resolveImageSrc,
  SOURCE_LABELS,
  sourceUrl,
} from "../utils";

export function GameDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  usePageTitle(game?.title);

  useEffect(() => {
    let alive = true;
    setGame(null);
    setError("");
    setNotFound(false);
    api
      .getGame(id)
      .then((payload) => {
        if (alive) setGame(payload.game);
      })
      .catch((reason) => {
        if (!alive) return;
        if (reason instanceof ApiError && reason.status === 404) {
          setNotFound(true);
        } else {
          setError(errorMessage(reason));
          toast(errorMessage(reason), "error");
        }
      });
    return () => {
      alive = false;
    };
  }, [id, reloadToken, toast]);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  if (notFound) {
    return (
      <div className="page-shell detail-missing">
        <span className="detail-missing-code">404</span>
        <h1>这一页故事还没有被收录</h1>
        <p>它可能已经被移出书架，或者链接地址不太对。</p>
        <Link className="button button-primary" to="/">
          <ArrowLeftIcon size={17} />
          回到游戏库
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell detail-missing">
        <ErrorNotice
          title="无法打开这份档案"
          message={error}
          onRetry={() => setReloadToken((value) => value + 1)}
        />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="page-shell detail-loading">
        <PageLoader label="正在翻开故事档案…" />
      </div>
    );
  }

  const background = resolveImageSrc(game.banner || game.cover);
  const externalSource = sourceUrl(game);
  const year = formatYear(game.releaseDate);
  const heroStyle = background
    ? ({ "--detail-image": `url("${background.replace(/"/g, "%22")}")` } as CSSProperties)
    : undefined;

  return (
    <div className="detail-page">
      <div className="detail-hero" style={heroStyle}>
        <div className="detail-hero-backdrop" aria-hidden="true" />
        <div className="detail-hero-fade" aria-hidden="true" />
        <div className="detail-hero-grid" aria-hidden="true" />
      </div>

      <div className="page-shell detail-shell">
        <nav className="breadcrumb" aria-label="面包屑导航">
          <Link to="/">游戏库</Link>
          <span aria-hidden="true">/</span>
          <span>{game.title}</span>
        </nav>

        <section className="detail-top" aria-labelledby="game-title">
          <div className="detail-intro">
            <div className="detail-source-row">
              <span className={`source-pill source-${game.source}`}>
                {SOURCE_LABELS[game.source]}
              </span>
              {externalSource ? (
                <a
                  href={externalSource}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="source-link"
                >
                  在 {SOURCE_LABELS[game.source]} 查看
                  <ExternalLinkIcon size={13} />
                </a>
              ) : null}
              {game.featured ? (
                <span className="featured-label">
                  <SparklesIcon size={13} />
                  馆藏推荐
                </span>
              ) : null}
            </div>

            <h1 id="game-title">{game.title}</h1>
            {game.originalTitle ? <p className="detail-original">{game.originalTitle}</p> : null}

            <div className="detail-meta">
              {game.developer ? (
                <span>
                  <BuildingIcon size={15} />
                  {game.developer}
                </span>
              ) : null}
              {year ? (
                <span>
                  <CalendarIcon size={15} />
                  {year}
                </span>
              ) : null}
              {game.rating !== null ? (
                <span className="detail-rating">
                  <StarIcon size={14} />
                  {game.rating.toFixed(1)}
                  <small>/ 10</small>
                </span>
              ) : null}
            </div>

            {game.tags.length > 0 ? (
              <div className="detail-tags">
                {game.tags.map((tag) => (
                  <span key={tag} className="outline-tag">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="detail-actions">
              <a
                className="button button-primary button-large"
                href={game.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <PlayIcon size={18} />
                开始游戏
              </a>
              {user ? (
                <Link className="button button-ghost button-large" to={`/admin/games/${game.id}/edit`}>
                  <EditIcon size={16} />
                  编辑资料
                </Link>
              ) : null}
            </div>
            <p className="launch-note">
              <span className="live-dot" />
              游戏将在新标签页中打开
            </p>
          </div>

          <div className="detail-poster-column">
            <div className="detail-poster-glow" aria-hidden="true" />
            <div className="detail-poster">
              <CoverImage src={game.cover} title={game.title} eager />
            </div>
            {game.rating !== null ? (
              <div className="detail-score-stamp">
                <StarIcon size={13} />
                <strong>{game.rating.toFixed(1)}</strong>
                <span>RATING</span>
              </div>
            ) : null}
          </div>
        </section>

        <div className="detail-stat-strip">
          <div>
            <span className="stat-label">RELEASE</span>
            <strong>{game.releaseDate || "未知"}</strong>
          </div>
          <div>
            <span className="stat-label">DEVELOPER</span>
            <strong>{game.developer || "未记录"}</strong>
          </div>
          <div>
            <span className="stat-label">ARCHIVED</span>
            <strong>{formatDateTime(game.createdAt)}</strong>
          </div>
          <div>
            <span className="stat-label">SOURCE</span>
            <strong>{SOURCE_LABELS[game.source]}</strong>
          </div>
        </div>

        <div className="detail-content-grid">
          <div className="detail-main-column">
            <section className="content-panel" aria-labelledby="synopsis-title">
              <div className="panel-heading">
                <span className="panel-icon">
                  <BookOpenIcon size={18} />
                </span>
                <div>
                  <span className="eyebrow">STORY</span>
                  <h2 id="synopsis-title">故事简介</h2>
                </div>
              </div>
              {game.description ? (
                <p className="long-text">{game.description}</p>
              ) : (
                <p className="muted-placeholder">
                  还没有简介。管理员可以在编辑页补充，或从 Bangumi / VNDB 重新抓取资料。
                </p>
              )}
            </section>

            <section className="content-panel" aria-labelledby="gallery-title">
              <div className="panel-heading panel-heading-row">
                <div className="panel-heading">
                  <span className="panel-icon">
                    <ImageIcon size={18} />
                  </span>
                  <div>
                    <span className="eyebrow">SCREENS</span>
                    <h2 id="gallery-title">画面预览</h2>
                  </div>
                </div>
                {game.screenshots.length > 0 ? (
                  <span className="panel-counter">{game.screenshots.length} 张</span>
                ) : null}
              </div>

              {game.screenshots.length > 0 ? (
                <div className="screenshot-grid">
                  {game.screenshots.map((shot, index) => (
                    <button
                      key={`${shot}-${index}`}
                      type="button"
                      className={`screenshot-item ${index === 0 ? "is-featured" : ""}`}
                      onClick={() => setLightboxIndex(index)}
                      aria-label={`查看第 ${index + 1} 张画面预览`}
                    >
                      <img
                        src={resolveImageSrc(shot)}
                        alt={`${game.title} 画面 ${index + 1}`}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                      />
                      <span className="screenshot-zoom">预览</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="gallery-empty">
                  <ImageIcon size={30} />
                  <h3>暂无画面截图</h3>
                  <p>从 VNDB 抓取资料通常会自动带入截图，也可以手动添加图片链接。</p>
                </div>
              )}
            </section>
          </div>

          <aside className="detail-side-column">
            <section className="side-panel">
              <span className="eyebrow">FILE INFO</span>
              <h2>作品档案</h2>
              <dl className="info-list">
                <div>
                  <dt>原名</dt>
                  <dd>{game.originalTitle || "—"}</dd>
                </div>
                <div>
                  <dt>制作组</dt>
                  <dd>{game.developer || "—"}</dd>
                </div>
                <div>
                  <dt>发售日期</dt>
                  <dd>{formatDate(game.releaseDate)}</dd>
                </div>
                <div>
                  <dt>数据来源</dt>
                  <dd>{SOURCE_LABELS[game.source]}</dd>
                </div>
                <div>
                  <dt>收录时间</dt>
                  <dd>{formatDateTime(game.createdAt)}</dd>
                </div>
                <div>
                  <dt>最后更新</dt>
                  <dd>{formatDateTime(game.updatedAt)}</dd>
                </div>
              </dl>
              {externalSource ? (
                <a
                  className="side-source-link"
                  href={externalSource}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  查看原始条目
                  <ExternalLinkIcon size={14} />
                </a>
              ) : null}
            </section>

            <section className="side-cta">
              <span className="side-cta-icon">
                <LibraryIcon size={22} />
              </span>
              <h2>准备好了吗？</h2>
              <p>戴上耳机，让另一个世界慢慢展开。</p>
              <a
                className="button button-primary button-block"
                href={game.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <PlayIcon size={17} />
                开始游戏
              </a>
            </section>
          </aside>
        </div>

        <div className="detail-footer-nav">
          <Link className="button button-ghost" to="/">
            <ArrowLeftIcon size={16} />
            返回游戏库
          </Link>
          {game.tags.length > 0 ? (
            <div className="detail-footer-tags">
              {game.tags.slice(0, 5).map((tag) => (
                <span key={tag} className="mini-tag">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <Lightbox
        images={game.screenshots}
        index={lightboxIndex}
        title={game.title}
        onClose={closeLightbox}
        onChange={setLightboxIndex}
      />
    </div>
  );
}
