import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Game } from "../../shared/types";
import { api, ApiError } from "../api";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { CoverImage } from "../components/CoverImage";
import { ErrorNotice, PageLoader } from "../components/Feedback";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  EditIcon,
  ExternalLinkIcon,
  GridIcon,
  GripVerticalIcon,
  ImageIcon,
  LogOutIcon,
  MonitorIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  StarIcon,
  TrashIcon,
} from "../components/Icons";
import { errorMessage, useAuth, usePageTitle, useSite, useToast } from "../providers";
import { formatDateTime, sourceBadge } from "../utils";

type OrderStatus = "idle" | "saving" | "saved";

export function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const { site, refresh: refreshSite } = useSite();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Game | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [showFeaturedHero, setShowFeaturedHero] = useState(site.showFeaturedHero);
  const [savingDisplay, setSavingDisplay] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("idle");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);
  const reorderEnabled = !deferredQuery.trim() && (games?.length ?? 0) > 1;

  usePageTitle("管理后台");

  useEffect(() => {
    setShowFeaturedHero(site.showFeaturedHero);
  }, [site.showFeaturedHero]);

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
        if (reason instanceof ApiError && reason.status === 401) {
          navigate("/admin/login", { replace: true });
          return;
        }
        setError(errorMessage(reason));
      });
    return () => {
      alive = false;
    };
  }, [reloadToken, navigate]);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLocaleLowerCase();
    if (!q) return games ?? [];
    return (games ?? []).filter((game) =>
      [game.title, game.originalTitle ?? "", game.developer ?? "", ...game.tags]
        .join(" ")
        .toLocaleLowerCase()
        .includes(q),
    );
  }, [games, deferredQuery]);

  const stats = useMemo(() => {
    const list = games ?? [];
    const tags = new Set<string>();
    for (const game of list) for (const tag of game.tags) tags.add(tag);
    const latest = list
      .map((game) => game.updatedAt)
      .sort((a, b) => b.localeCompare(a))[0];
    return {
      total: list.length,
      covers: list.filter((game) => Boolean(game.cover)).length,
      tags: tags.size,
      latest: latest ? formatDateTime(latest) : "—",
    };
  }, [games]);

  const handleLogout = async () => {
    await logout();
    toast("已退出管理员账号", "info");
    navigate("/");
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await api.deleteGame(deleteTarget.id);
      setGames((current) => (current ?? []).filter((game) => game.id !== deleteTarget.id));
      toast(`已移除《${deleteTarget.title}》`, "success");
      setDeleteTarget(null);
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) {
        navigate("/admin/login", { replace: true });
        return;
      }
      toast(errorMessage(reason), "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleDisplayToggle = async () => {
    if (savingDisplay) return;
    const next = !showFeaturedHero;
    setShowFeaturedHero(next);
    setSavingDisplay(true);
    try {
      await api.updateSettings({ showFeaturedHero: next });
      try {
        await refreshSite();
      } catch {
        // The setting itself was saved; a later page load will pick it up.
      }
      toast(next ? "首页大幅展示区已开启" : "首页大幅展示区已关闭", "success");
    } catch (reason) {
      setShowFeaturedHero(!next);
      if (reason instanceof ApiError && reason.status === 401) {
        navigate("/admin/login", { replace: true });
        return;
      }
      toast(errorMessage(reason), "error");
    } finally {
      setSavingDisplay(false);
    }
  };

  const persistOrder = async (next: Game[]) => {
    if (!games || ordering || !reorderEnabled) return;
    const previous = games;
    setGames(next);
    setOrdering(true);
    setOrderStatus("saving");
    try {
      const payload = await api.reorderGames(next.map((game) => game.id));
      setGames(payload.games);
      setOrderStatus("saved");
    } catch (reason) {
      setGames(previous);
      setOrderStatus("idle");
      if (reason instanceof ApiError && reason.status === 401) {
        navigate("/admin/login", { replace: true });
        return;
      }
      toast(errorMessage(reason), "error");
    } finally {
      setOrdering(false);
    }
  };

  const moveGame = (id: string, direction: -1 | 1) => {
    if (!games || !reorderEnabled || ordering) return;
    const index = games.findIndex((game) => game.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= games.length) return;
    const next = [...games];
    [next[index], next[target]] = [next[target], next[index]];
    void persistOrder(next);
  };

  const handleDrop = (targetId: string) => {
    if (!games || !draggedId || draggedId === targetId || !reorderEnabled || ordering) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    const from = games.findIndex((game) => game.id === draggedId);
    const to = games.findIndex((game) => game.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...games];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDraggedId(null);
    setDragOverId(null);
    void persistOrder(next);
  };

  return (
    <div className="page-shell admin-page">
      <header className="admin-heading">
        <div>
          <span className="eyebrow">
            <span className="eyebrow-line" />
            ADMIN CONSOLE
          </span>
          <h1>管理后台</h1>
          <p>
            你好，{user ?? "管理员"}。在这里收录新作品，维护封面、简介与游戏链接。
          </p>
        </div>
        <div className="admin-heading-actions">
          <Link className="button button-ghost" to="/">
            <ExternalLinkIcon size={16} />
            查看网站
          </Link>
          <button className="button button-ghost" type="button" onClick={handleLogout}>
            <LogOutIcon size={16} />
            退出登录
          </button>
          <Link className="button button-primary" to="/admin/games/new">
            <PlusIcon size={17} />
            添加游戏
          </Link>
        </div>
      </header>

      <section className="admin-stats" aria-label="馆藏概览">
        <div className="admin-stat-card primary-stat">
          <span className="stat-icon">
            <GridIcon size={20} />
          </span>
          <span className="stat-label">TOTAL GAMES</span>
          <strong>{stats.total.toString().padStart(2, "0")}</strong>
          <p>已收录的作品</p>
        </div>
        <div className="admin-stat-card">
          <span className="stat-icon">
            <ImageIcon size={20} />
          </span>
          <span className="stat-label">WITH COVER</span>
          <strong>{stats.covers}</strong>
          <p>已设置封面</p>
        </div>
        <div className="admin-stat-card">
          <span className="stat-icon">
            <StarIcon size={20} />
          </span>
          <span className="stat-label">UNIQUE TAGS</span>
          <strong>{stats.tags}</strong>
          <p>标签种类</p>
        </div>
        <div className="admin-stat-card">
          <span className="stat-icon">
            <SettingsIcon size={20} />
          </span>
          <span className="stat-label">LAST UPDATE</span>
          <strong className="date-stat">{stats.latest}</strong>
          <p>最近一次编辑</p>
        </div>
      </section>

      <section className="admin-settings-card" aria-labelledby="admin-display-title">
        <span className="admin-settings-icon">
          <MonitorIcon size={21} />
        </span>
        <div className="admin-settings-copy">
          <span className="eyebrow">HOME DISPLAY</span>
          <h2 id="admin-display-title">首页大幅展示区</h2>
          <p>
            关闭后首页直接从游戏卡片开始展示。推荐作品标记仍会保留，重新打开即可恢复。
          </p>
        </div>
        <label className={`switch-row admin-feature-switch ${savingDisplay ? "is-saving" : ""}`}>
          <span>
            <strong>{showFeaturedHero ? "显示中" : "已关闭"}</strong>
            <small>{savingDisplay ? "正在保存…" : "控制首页顶部的大图推荐区"}</small>
          </span>
          <input
            type="checkbox"
            checked={showFeaturedHero}
            onChange={handleDisplayToggle}
            disabled={savingDisplay}
          />
          <span className="switch-track" aria-hidden="true">
            <span />
          </span>
        </label>
      </section>

      <section className="admin-panel" aria-labelledby="admin-list-title">
        <div className="admin-panel-head">
          <div>
            <span className="eyebrow">LIBRARY</span>
            <h2 id="admin-list-title">游戏列表</h2>
          </div>
          <label className="search-field admin-search">
            <SearchIcon size={16} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="在馆藏中查找"
              aria-label="在管理后台搜索游戏"
            />
          </label>
        </div>

        {games && games.length > 1 ? (
          <div className="admin-order-bar">
            <span>
              <GripVerticalIcon size={15} />
              {deferredQuery
                ? "清空搜索后可调整馆藏顺序"
                : "拖动行首手柄，或使用上下箭头调整馆藏顺序"}
            </span>
            <span className={`order-status order-${orderStatus}`}>
              {orderStatus === "saving"
                ? "正在保存…"
                : orderStatus === "saved"
                  ? "顺序已保存"
                  : `共 ${games.length} 部作品`}
            </span>
          </div>
        ) : null}

        {error ? (
          <ErrorNotice
            title="无法读取游戏列表"
            message={error}
            onRetry={() => setReloadToken((value) => value + 1)}
          />
        ) : games === null ? (
          <PageLoader label="正在读取馆藏…" />
        ) : games.length === 0 ? (
          <div className="admin-empty">
            <span className="admin-empty-icon">
              <GridIcon size={26} />
            </span>
            <h3>馆藏还是空的</h3>
            <p>添加第一部作品，开始建立你的 Galgame 收藏馆。</p>
            <Link className="button button-primary" to="/admin/games/new">
              <PlusIcon size={17} />
              添加游戏
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty compact">
            <h3>没有匹配的作品</h3>
            <p>试试其他关键词。</p>
            <button className="button button-secondary" type="button" onClick={() => setQuery("")}>
              清除搜索
            </button>
          </div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="drag-head" aria-label="拖动排序" />
                    <th>作品</th>
                    <th>制作组</th>
                    <th>来源</th>
                    <th>评分</th>
                    <th>最后更新</th>
                    <th className="actions-head">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((game, index) => (
                    <tr
                      key={game.id}
                      className={`${draggedId === game.id ? "is-dragging" : ""} ${
                        dragOverId === game.id ? "is-drag-over" : ""
                      }`}
                      draggable={reorderEnabled && !ordering}
                      onDragStart={(event) => {
                        if (!reorderEnabled || ordering) {
                          event.preventDefault();
                          return;
                        }
                        setDraggedId(game.id);
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", game.id);
                      }}
                      onDragOver={(event) => {
                        if (!draggedId || draggedId === game.id || !reorderEnabled || ordering) return;
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                        setDragOverId(game.id);
                      }}
                      onDragLeave={() => {
                        if (dragOverId === game.id) setDragOverId(null);
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        handleDrop(game.id);
                      }}
                      onDragEnd={() => {
                        setDraggedId(null);
                        setDragOverId(null);
                      }}
                    >
                      <td className="drag-cell">
                        <span
                          className="drag-handle"
                          title={reorderEnabled ? "拖动调整顺序" : "清空搜索后可调整顺序"}
                          aria-hidden="true"
                        >
                          <GripVerticalIcon size={16} />
                        </span>
                      </td>
                      <td>
                        <div className="table-game">
                          <div className="table-cover">
                            <CoverImage src={game.cover} title={game.title} eager />
                          </div>
                          <div className="table-game-copy">
                            <Link to={`/game/${game.id}`}>{game.title}</Link>
                            <span>{game.originalTitle || game.releaseDate || "未补充原名"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="muted-cell">{game.developer || "—"}</td>
                      <td>
                        <span className={`source-pill source-${game.source}`}>
                          {sourceBadge(game)}
                        </span>
                      </td>
                      <td className="muted-cell">
                        {game.rating !== null ? game.rating.toFixed(1) : "—"}
                      </td>
                      <td className="muted-cell">{formatDateTime(game.updatedAt)}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-button order-button"
                            type="button"
                            title="上移"
                            aria-label={`上移 ${game.title}`}
                            disabled={!reorderEnabled || ordering || index === 0}
                            onClick={() => moveGame(game.id, -1)}
                          >
                            <ChevronUpIcon size={16} />
                          </button>
                          <button
                            className="icon-button order-button"
                            type="button"
                            title="下移"
                            aria-label={`下移 ${game.title}`}
                            disabled={!reorderEnabled || ordering || index === filtered.length - 1}
                            onClick={() => moveGame(game.id, 1)}
                          >
                            <ChevronDownIcon size={16} />
                          </button>
                          <Link
                            className="icon-button"
                            to={`/game/${game.id}`}
                            title="查看详情"
                            aria-label={`查看 ${game.title}`}
                          >
                            <ExternalLinkIcon size={16} />
                          </Link>
                          <Link
                            className="icon-button"
                            to={`/admin/games/${game.id}/edit`}
                            title="编辑"
                            aria-label={`编辑 ${game.title}`}
                          >
                            <EditIcon size={16} />
                          </Link>
                          <button
                            className="icon-button danger"
                            type="button"
                            title="删除"
                            aria-label={`删除 ${game.title}`}
                            onClick={() => setDeleteTarget(game)}
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-mobile-list">
              {filtered.map((game, index) => (
                <article className="admin-mobile-card" key={game.id}>
                  <div className="table-cover">
                    <CoverImage src={game.cover} title={game.title} eager />
                  </div>
                  <div className="admin-mobile-copy">
                    <Link to={`/game/${game.id}`}>{game.title}</Link>
                    <span>{game.developer || "未记录制作组"}</span>
                    <span className={`source-pill source-${game.source}`}>{sourceBadge(game)}</span>
                  </div>
                  <div className="row-actions">
                    <button
                      className="icon-button order-button"
                      type="button"
                      aria-label={`上移 ${game.title}`}
                      disabled={!reorderEnabled || ordering || index === 0}
                      onClick={() => moveGame(game.id, -1)}
                    >
                      <ChevronUpIcon size={16} />
                    </button>
                    <button
                      className="icon-button order-button"
                      type="button"
                      aria-label={`下移 ${game.title}`}
                      disabled={!reorderEnabled || ordering || index === filtered.length - 1}
                      onClick={() => moveGame(game.id, 1)}
                    >
                      <ChevronDownIcon size={16} />
                    </button>
                    <Link
                      className="icon-button"
                      to={`/admin/games/${game.id}/edit`}
                      aria-label={`编辑 ${game.title}`}
                    >
                      <EditIcon size={16} />
                    </Link>
                    <button
                      className="icon-button danger"
                      type="button"
                      aria-label={`删除 ${game.title}`}
                      onClick={() => setDeleteTarget(game)}
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="移除这部作品？"
        description={
          deleteTarget
            ? `《${deleteTarget.title}》将从公开馆藏中永久删除，这个操作无法撤销。`
            : ""
        }
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
