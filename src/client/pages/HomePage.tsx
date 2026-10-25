import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Link } from "react-router-dom";
import type { Game } from "../../shared/types";
import { api } from "../api";
import { CoverImage } from "../components/CoverImage";
import { ErrorNotice } from "../components/Feedback";
import { GameCard, GameCardSkeleton } from "../components/GameCard";
import {
  ArrowRightIcon,
  ChevronDownIcon,
  LibraryIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
  StarIcon,
} from "../components/Icons";
import { errorMessage, useAuth, usePageTitle, useSite, useToast } from "../providers";
import { excerpt, formatYear, resolveImageSrc } from "../utils";

type SortKey = "curated" | "newest" | "rating" | "title";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "curated", label: "馆藏顺序" },
  { value: "newest", label: "最近收录" },
  { value: "rating", label: "评分优先" },
  { value: "title", label: "名称排序" },
];

function sortGames(games: Game[], sort: SortKey): Game[] {
  const result = [...games];
  if (sort === "newest") {
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  if (sort === "rating") {
    return result.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
  }
  if (sort === "title") {
    return result.sort((a, b) =>
      a.title.localeCompare(b.title, "zh-CN", { numeric: true, sensitivity: "base" }),
    );
  }
  return result;
}

export function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { site, loading: siteLoading } = useSite();
  usePageTitle();
  const [games, setGames] = useState<Game[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [sort, setSort] = useState<SortKey>("curated");
  const deferredQuery = useDeferredValue(query);
  const searchRef = useRef<HTMLInputElement>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let alive = true;
    setGames(null);
    setError("");
    api
      .getGames()
      .then((payload) => {
        if (alive) setGames(payload.games);
      })
      .catch((reason) => {
        if (!alive) return;
        setError(errorMessage(reason));
        toast(errorMessage(reason), "error");
      });
    return () => {
      alive = false;
    };
  }, [reloadToken, toast]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;
      if (event.key === "/" && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const game of games ?? []) {
      for (const tag of game.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))
      .slice(0, 18);
  }, [games]);

  const visibleGames = useMemo(() => {
    const normalized = deferredQuery.trim().toLocaleLowerCase();
    const filtered = (games ?? []).filter((game) => {
      if (activeTag && !game.tags.includes(activeTag)) return false;
      if (!normalized) return true;
      const haystack = [
        game.title,
        game.originalTitle ?? "",
        game.developer ?? "",
        game.description ?? "",
        ...game.tags,
      ]
        .join(" ")
        .toLocaleLowerCase();
      return haystack.includes(normalized);
    });
    return sortGames(filtered, sort);
  }, [games, deferredQuery, activeTag, sort]);

  const featured = useMemo(() => {
    if (!games || games.length === 0) return null;
    return games.find((game) => game.featured) ?? games[0];
  }, [games]);

  const hasFilter = Boolean(activeTag || deferredQuery.trim());

  const resetFilters = () => {
    setQuery("");
    setActiveTag("");
    setSort("curated");
  };

  if (error && !games) {
    return (
      <div className="page-shell">
        <ErrorNotice
          title="馆藏暂时无法读取"
          message={error}
          onRetry={() => setReloadToken((value) => value + 1)}
        />
      </div>
    );
  }

  if (!games || siteLoading) {
    return (
      <div className="page-shell home-shell">
        <div className="home-loading-head">
          <div className="skeleton-line short" />
          <div className="skeleton-line title" />
          <div className="skeleton-line medium" />
        </div>
        <div className="game-grid">
          {Array.from({ length: 10 }).map((_, index) => (
            <GameCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return <EmptyLibrary loggedIn={Boolean(user)} />;
  }

  const showHero = site.showFeaturedHero && Boolean(featured);

  return (
    <div className={`page-shell home-shell ${showHero ? "" : "no-hero"}`}>
      {showHero && featured ? <FeaturedHero game={featured} /> : null}

      <section className="collection-section" aria-labelledby="collection-title">
        <div className="collection-heading">
          <div>
            <span className="eyebrow">
              <span className="eyebrow-line" />
              COLLECTION
            </span>
            <h2 id="collection-title">
              全部游戏
              <span className="count-sup">{games.length.toString().padStart(2, "0")}</span>
            </h2>
          </div>
          <div className="toolbar">
            <label className="search-field">
              <SearchIcon size={17} />
              <input
                ref={searchRef}
                type="search"
                name="library-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索标题、制作组或标签"
                aria-label="搜索游戏"
              />
              {!query ? <kbd className="search-kbd">/</kbd> : null}
            </label>
            <label className="sort-field">
              <span className="sr-only">排序方式</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon size={15} />
            </label>
          </div>
        </div>

        {tags.length > 0 ? (
          <div className="tag-filter" role="group" aria-label="按标签筛选">
            <button
              type="button"
              className={`filter-chip ${!activeTag ? "is-active" : ""}`}
              onClick={() => setActiveTag("")}
            >
              全部
            </button>
            {tags.map(([tag, count]) => (
              <button
                key={tag}
                type="button"
                className={`filter-chip ${activeTag === tag ? "is-active" : ""}`}
                onClick={() => setActiveTag((current) => (current === tag ? "" : tag))}
                aria-pressed={activeTag === tag}
              >
                {tag}
                <span>{count}</span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="result-line" aria-live="polite">
          <span>
            {hasFilter ? "筛选结果" : "ARCHIVE INDEX"} · {visibleGames.length} 部作品
          </span>
          {hasFilter ? (
            <button type="button" className="text-button" onClick={resetFilters}>
              清除筛选
            </button>
          ) : (
            <span className="result-hint">点击卡片，走进故事</span>
          )}
        </div>

        {visibleGames.length > 0 ? (
          <div className="game-grid">
            {visibleGames.map((game, index) => (
              <GameCard key={game.id} game={game} index={index} />
            ))}
          </div>
        ) : (
          <div className="filter-empty">
            <span className="filter-empty-mark">
              <SearchIcon size={28} />
            </span>
            <h3>没有找到匹配的作品</h3>
            <p>换一个关键词，或者清除当前筛选条件。</p>
            <button className="button button-secondary" type="button" onClick={resetFilters}>
              清除筛选
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function FeaturedHero({ game }: { game: Game }) {
  const background = resolveImageSrc(game.banner || game.cover);
  const heroStyle = background
    ? ({ "--hero-image": `url("${background.replace(/"/g, "%22")}")` } as CSSProperties)
    : undefined;
  const year = formatYear(game.releaseDate);

  return (
    <section className="featured-hero" style={heroStyle} aria-labelledby="featured-title">
      <div className="hero-backdrop" aria-hidden="true" />
      <div className="hero-vignette" aria-hidden="true" />
      <div className="hero-grid-overlay" aria-hidden="true" />

      <div className="featured-copy">
        <span className="eyebrow hero-eyebrow">
          <SparklesIcon size={14} />
          FEATURED GAME
        </span>
        <h1 id="featured-title">{game.title}</h1>
        {game.originalTitle ? <p className="hero-original">{game.originalTitle}</p> : null}
        <div className="hero-meta">
          {game.developer ? <span>{game.developer}</span> : null}
          {game.developer && year ? <span className="meta-dot" /> : null}
          {year ? <span>{year}</span> : null}
          {game.rating !== null ? (
            <>
              <span className="meta-dot" />
              <span className="hero-score">
                <StarIcon size={12} />
                {game.rating.toFixed(1)}
              </span>
            </>
          ) : null}
        </div>
        <p className="hero-summary">
          {excerpt(game.description, 210) || "一段等待被打开的故事，已经安静地躺在书架上。"}
        </p>
        {game.tags.length > 0 ? (
          <div className="hero-tags">
            {game.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="outline-tag">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        <div className="hero-actions">
          <Link className="button button-primary" to={`/game/${game.id}`}>
            <LibraryIcon size={18} />
            查看详情
          </Link>
          <a
            className="button button-glass"
            href={game.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <PlayIcon size={16} />
            开始游戏
          </a>
        </div>
      </div>

      <div className="featured-poster-wrap">
        <div className="featured-poster-glow" aria-hidden="true" />
        <div className="featured-poster">
          <CoverImage src={game.cover} title={game.title} eager />
          <span className="poster-index">NO. {String(1).padStart(2, "0")}</span>
        </div>
        <div className="poster-caption">
          <span>ARCHIVE / 馆藏推荐</span>
          <span className="poster-caption-line" />
        </div>
      </div>

      <div className="hero-scroll-hint" aria-hidden="true">
        <span>SCROLL TO EXPLORE</span>
        <span className="scroll-stem" />
      </div>
    </section>
  );
}

function EmptyLibrary({ loggedIn }: { loggedIn: boolean }) {
  return (
    <div className="page-shell empty-page">
      <section className="empty-hero">
        <div className="empty-visual" aria-hidden="true">
          <div className="empty-card back-two" />
          <div className="empty-card back-one" />
          <div className="empty-card front">
            <span className="empty-card-mark">
              <LibraryIcon size={34} />
            </span>
            <span className="empty-card-line" />
            <span className="empty-card-line short" />
          </div>
          <span className="empty-orbit" />
        </div>
        <div className="empty-copy">
          <span className="eyebrow">
            <span className="eyebrow-line" />
            ARCHIVE · 00
          </span>
          <h1>
            故事，正等待
            <br />
            被收进这里。
          </h1>
          <p>
            这是你的私人 Galgame 收藏馆。添加第一部作品，用 Bangumi 与 VNDB
            的资料自动补全封面、制作组和简介。
          </p>
          <div className="empty-actions">
            <Link className="button button-primary" to={loggedIn ? "/admin/games/new" : "/admin/login"}>
              {loggedIn ? <PlusIcon size={17} /> : <ArrowRightIcon size={17} />}
              {loggedIn ? "收录第一部作品" : "进入管理后台"}
            </Link>
            <Link className="button button-ghost" to={loggedIn ? "/admin" : "/admin/login"}>
              了解如何添加
            </Link>
          </div>
        </div>
      </section>

      <section className="empty-features" aria-label="功能说明">
        <div className="feature-card">
          <span className="feature-index">01</span>
          <SparklesIcon size={22} />
          <h2>自动补齐资料</h2>
          <p>输入名字即可从 Bangumi / VNDB 匹配封面、原名、制作组、简介与画面截图。</p>
        </div>
        <div className="feature-card">
          <span className="feature-index">02</span>
          <PlayIcon size={22} />
          <h2>一键开始游戏</h2>
          <p>每张卡片都连接到你自己的网页版游戏，详情页点击开始即可在新标签页游玩。</p>
        </div>
        <div className="feature-card">
          <span className="feature-index">03</span>
          <StarIcon size={22} />
          <h2>只属于你的书架</h2>
          <p>管理员登录后可随时添加、修改或移除作品，公开访客只能浏览收藏。</p>
        </div>
      </section>
    </div>
  );
}
