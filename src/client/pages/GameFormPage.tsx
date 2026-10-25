import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Game, GameInput, MetadataCandidate, MetadataSource } from "../../shared/types";
import { api, ApiError } from "../api";
import { CoverImage } from "../components/CoverImage";
import { ErrorNotice, PageLoader } from "../components/Feedback";
import {
  AlertIcon,
  ArrowLeftIcon,
  CheckIcon,
  ImageIcon,
  LinkIcon,
  PlayIcon,
  SaveIcon,
  SearchIcon,
  SparklesIcon,
  StarIcon,
} from "../components/Icons";
import { errorMessage, usePageTitle, useToast } from "../providers";
import {
  formatYear,
  parseScreenshotsInput,
  parseTagsInput,
  SOURCE_LABELS,
} from "../utils";

interface Draft {
  title: string;
  originalTitle: string;
  url: string;
  cover: string;
  banner: string;
  description: string;
  developer: string;
  releaseDate: string;
  tags: string;
  screenshots: string;
  rating: string;
  featured: boolean;
  sortOrder: string;
  source: MetadataSource;
  sourceId: string;
}

function emptyDraft(): Draft {
  return {
    title: "",
    originalTitle: "",
    url: "",
    cover: "",
    banner: "",
    description: "",
    developer: "",
    releaseDate: "",
    tags: "",
    screenshots: "",
    rating: "",
    featured: false,
    sortOrder: "0",
    source: "manual",
    sourceId: "",
  };
}

function draftFromGame(game: Game): Draft {
  return {
    title: game.title,
    originalTitle: game.originalTitle ?? "",
    url: game.url,
    cover: game.cover ?? "",
    banner: game.banner ?? "",
    description: game.description ?? "",
    developer: game.developer ?? "",
    releaseDate: game.releaseDate ?? "",
    tags: game.tags.join(", "),
    screenshots: game.screenshots.join("\n"),
    rating: game.rating === null ? "" : String(game.rating),
    featured: game.featured,
    sortOrder: String(game.sortOrder),
    source: game.source,
    sourceId: game.sourceId ?? "",
  };
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function GameFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveDetails, setSaveDetails] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<MetadataCandidate[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [scraping, setScraping] = useState(false);
  const [applyingKey, setApplyingKey] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  const [scrapeError, setScrapeError] = useState("");
  const [scrapeCompleted, setScrapeCompleted] = useState(false);
  const [scrapeQuery, setScrapeQuery] = useState("");

  usePageTitle(isEdit ? "编辑游戏" : "添加游戏");

  useEffect(() => {
    if (!id) {
      setDraft(emptyDraft());
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setLoadError("");
    api
      .getGame(id)
      .then((payload) => {
        if (!alive) return;
        setDraft(draftFromGame(payload.game));
      })
      .catch((reason) => {
        if (!alive) return;
        setLoadError(errorMessage(reason));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const year = formatYear(draft.releaseDate);
  const previewTags = parseTagsInput(draft.tags);
  const screenshots = parseScreenshotsInput(draft.screenshots);

  const payload = useMemo<GameInput>(
    () => ({
      title: draft.title.trim(),
      originalTitle: draft.originalTitle.trim() || undefined,
      url: draft.url.trim(),
      cover: draft.cover.trim() || undefined,
      banner: draft.banner.trim() || undefined,
      description: draft.description.trim() || undefined,
      developer: draft.developer.trim() || undefined,
      releaseDate: draft.releaseDate.trim() || undefined,
      tags: parseTagsInput(draft.tags),
      screenshots: parseScreenshotsInput(draft.screenshots),
      source: draft.source,
      sourceId: draft.sourceId.trim() || undefined,
      rating: draft.rating.trim() ? Number(draft.rating) : null,
      featured: draft.featured,
      sortOrder: Number(draft.sortOrder) || 0,
    }),
    [draft],
  );

  const applyCandidate = async (candidate: MetadataCandidate, silent = false) => {
    const key = `${candidate.source}:${candidate.sourceId}`;
    setApplyingKey(key);
    setScrapeError("");
    try {
      const { candidate: detail } = await api.getMetadataDetail(
        candidate.source,
        candidate.sourceId,
      );
      setDraft((current) => ({
        ...current,
        title: detail.title || current.title,
        originalTitle: detail.originalTitle ?? "",
        cover: detail.cover ?? "",
        banner: detail.banner ?? "",
        description: detail.description ?? "",
        developer: detail.developer ?? "",
        releaseDate: detail.releaseDate ?? "",
        tags: detail.tags.join(", "),
        screenshots: detail.screenshots.join("\n"),
        rating: detail.rating === null ? "" : String(detail.rating),
        source: detail.source,
        sourceId: detail.sourceId,
      }));
      setSelectedKey(key);
      if (!silent) toast(`已应用 ${SOURCE_LABELS[detail.source]} 的资料`, "success");
    } catch (reason) {
      setScrapeError(errorMessage(reason));
      if (!silent) toast(errorMessage(reason), "error");
    } finally {
      setApplyingKey("");
    }
  };

  const handleScrape = async () => {
    if (scraping || applyingKey) return;
    const query = scrapeQuery.trim() || draft.title.trim();
    if (!query) {
      setScrapeError("请输入游戏名称，或粘贴 Bangumi / VNDB 条目链接。");
      return;
    }
    setScraping(true);
    setScrapeError("");
    setScrapeCompleted(false);
    setCandidates([]);
    setWarnings([]);
    setSelectedKey("");
    try {
      const result = await api.searchMetadata(query);
      setCandidates(result.results);
      setWarnings(result.warnings);
      setScrapeCompleted(true);
      if (result.results.length === 0) {
        setScrapeError("没有找到匹配的条目。可以换一个名字，或手动填写资料。");
      } else {
        await applyCandidate(result.results[0], true);
        toast("已匹配最佳结果，可以在下方更换资料", "success");
      }
    } catch (reason) {
      setScrapeError(errorMessage(reason));
    } finally {
      setScraping(false);
    }
  };

  const clearSource = () => {
    setDraft((current) => ({ ...current, source: "manual", sourceId: "" }));
    setSelectedKey("");
    toast("已清除资料来源标记，内容不会改变", "info");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaveError("");
    setSaveDetails([]);

    if (!draft.title.trim()) {
      setSaveError("请填写游戏名称。");
      return;
    }
    if (!isValidHttpUrl(draft.url.trim())) {
      setSaveError("请填写有效的游戏网址（http:// 或 https://）。");
      return;
    }
    if (draft.rating.trim()) {
      const rating = Number(draft.rating);
      if (!Number.isFinite(rating) || rating < 0 || rating > 10) {
        setSaveError("评分需要在 0 到 10 之间。");
        return;
      }
    }

    setSaving(true);
    try {
      const result = isEdit
        ? await api.updateGame(id as string, payload)
        : await api.createGame(payload);
      toast(isEdit ? "资料已更新" : "新作品已收录", "success");
      navigate(`/game/${result.game.id}`);
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) {
        navigate("/admin/login", { replace: true, state: { from: `/admin/games/${id ?? "new"}` } });
        return;
      }
      setSaveError(errorMessage(reason));
      if (reason instanceof ApiError && reason.details) setSaveDetails(reason.details);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell editor-page">
        <PageLoader label="正在读取作品资料…" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="page-shell editor-page">
        <ErrorNotice title="无法打开编辑页" message={loadError} />
      </div>
    );
  }

  return (
    <div className="page-shell editor-page">
      <div className="editor-topbar">
        <Link className="back-link" to="/admin">
          <ArrowLeftIcon size={16} />
          返回管理后台
        </Link>
        <span className="editor-mode">{isEdit ? "EDIT ENTRY" : "NEW ENTRY"}</span>
      </div>

      <header className="editor-heading">
        <div>
          <span className="eyebrow">
            <span className="eyebrow-line" />
            {isEdit ? "REFINE THE ARCHIVE" : "ADD TO THE ARCHIVE"}
          </span>
          <h1>{isEdit ? "编辑作品资料" : "收录一部新作品"}</h1>
          <p>
            填写游戏名称或粘贴资料链接后可以自动抓取。所有带 <span className="required-dot">*</span>{" "}
            的字段为必填项。
          </p>
        </div>
        <div className="editor-heading-actions">
          <Link className="button button-ghost" to="/admin">
            取消
          </Link>
          <button className="button button-primary" type="submit" form="game-form" disabled={saving}>
            <SaveIcon size={16} />
            {saving ? "保存中…" : isEdit ? "保存修改" : "收录作品"}
          </button>
        </div>
      </header>

      <form id="game-form" className="editor-layout" onSubmit={handleSubmit}>
        <div className="editor-form">
          <section className="form-panel scrape-panel">
            <div className="form-panel-heading">
              <span className="form-step">01</span>
              <div>
                <h2>
                  <SparklesIcon size={18} />
                  自动抓取资料
                </h2>
                <p>
                  输入游戏名称，或直接粘贴 Bangumi / VNDB 条目链接。匹配结果会先展示，确认后再填入。
                </p>
              </div>
            </div>

            <div className="scrape-query-row">
              <label className="scrape-query-field">
                <SearchIcon size={16} />
                <input
                  type="text"
                  name="scrapeQuery"
                  value={scrapeQuery}
                  onChange={(event) => setScrapeQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleScrape();
                    }
                  }}
                  placeholder="游戏名称，或 https://bgm.tv/subject/13、https://vndb.org/v17"
                  aria-label="游戏名称或 Bangumi、VNDB 资料链接"
                  spellCheck={false}
                  autoComplete="off"
                  maxLength={300}
                />
              </label>
              <button
                className="button button-primary button-small scrape-button"
                type="button"
                onClick={handleScrape}
                disabled={scraping || Boolean(applyingKey)}
              >
                {scraping ? "搜索中…" : applyingKey ? "读取资料中…" : "搜索并填入"}
              </button>
            </div>
            <p className="scrape-query-hint">
              留空时会使用下方「游戏名称」。支持 bgm.tv/subject/ID 和 vndb.org/vID 链接。
            </p>

            {warnings.length > 0 ? (
              <div className="inline-alert warning">
                <AlertIcon size={17} />
                <div>
                  {warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              </div>
            ) : null}

            {scrapeError ? (
              <div className="inline-alert warning">
                <AlertIcon size={17} />
                <p>{scrapeError}</p>
              </div>
            ) : null}

            {candidates.length > 0 ? (
              <div className="candidate-block">
                <div className="candidate-label">
                  <span>MATCH RESULTS · {candidates.length}</span>
                  {selectedKey ? <span className="applied-mark"><CheckIcon size={13} /> 已应用资料</span> : null}
                </div>
                <div className="candidate-grid">
                  {candidates.map((candidate) => {
                    const key = `${candidate.source}:${candidate.sourceId}`;
                    const active = selectedKey === key;
                    const applying = applyingKey === key;
                    return (
                      <button
                        key={key}
                        className={`candidate-card ${active ? "is-active" : ""}`}
                        type="button"
                        onClick={() => applyCandidate(candidate)}
                        disabled={Boolean(applyingKey)}
                        aria-pressed={active}
                      >
                        <span className="candidate-cover">
                          <CoverImage src={candidate.cover} title={candidate.title} />
                        </span>
                        <span className="candidate-copy">
                          <span className="candidate-source">
                            {SOURCE_LABELS[candidate.source]}
                            {candidate.rating !== null ? (
                              <span className="candidate-score">
                                <StarIcon size={10} />
                                {candidate.rating.toFixed(1)}
                              </span>
                            ) : null}
                          </span>
                          <strong>{candidate.title}</strong>
                          <span>
                            {[candidate.developer, formatYear(candidate.releaseDate)]
                              .filter(Boolean)
                              .join(" · ") || candidate.originalTitle || "等待读取详情"}
                          </span>
                          {applying ? <span className="candidate-loading">读取详情中…</span> : null}
                        </span>
                        {active ? (
                          <span className="candidate-check">
                            <CheckIcon size={13} />
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : scrapeCompleted ? null : (
              <div className="scrape-empty">
                <SparklesIcon size={18} />
                <span>填写名称后点击「搜索并填入」，封面、原名、制作组和简介会自动补全。</span>
              </div>
            )}
          </section>

          <section className="form-panel">
            <div className="form-panel-heading">
              <span className="form-step">02</span>
              <div>
                <h2>基础信息</h2>
                <p>游戏名称与访问地址，是这张卡片最重要的两条线索。</p>
              </div>
            </div>

            <div className="form-grid">
              <Field label="游戏名称" required hint="展示在卡片与详情页标题上的名字">
                <input
                  type="text"
                  name="title"
                  value={draft.title}
                  onChange={(event) => update("title", event.target.value)}
                  placeholder="例如：ATRI -My Dear Moments-"
                  maxLength={140}
                  required
                />
              </Field>

              <Field label="完整原名" hint="日文名、英文名或官方原名，可选">
                <input
                  type="text"
                  name="originalTitle"
                  value={draft.originalTitle}
                  onChange={(event) => update("originalTitle", event.target.value)}
                  placeholder="例如：ATRI -My Dear Moments-"
                  maxLength={140}
                />
              </Field>

              <Field
                label="游戏网址"
                required
                className="span-two"
                hint="点击「开始游戏」时打开的地址，支持 http / https"
              >
                <span className="input-with-icon">
                  <LinkIcon size={16} />
                  <input
                    type="url"
                    name="url"
                    value={draft.url}
                    onChange={(event) => update("url", event.target.value)}
                    placeholder="https://your-game.example.com/"
                    maxLength={2048}
                    required
                  />
                </span>
              </Field>

              <Field label="制作组" hint="开发商或社团名称">
                <input
                  type="text"
                  name="developer"
                  value={draft.developer}
                  onChange={(event) => update("developer", event.target.value)}
                  placeholder="例如：Frontwing"
                  maxLength={200}
                />
              </Field>

              <Field label="发售日期" hint="支持只有年份，例如 2021">
                <input
                  type="text"
                  name="releaseDate"
                  value={draft.releaseDate}
                  onChange={(event) => update("releaseDate", event.target.value)}
                  placeholder="2021-06-18"
                  maxLength={40}
                />
              </Field>

              <Field label="评分" hint="0 – 10，可留空">
                <input
                  type="number"
                  name="rating"
                  value={draft.rating}
                  onChange={(event) => update("rating", event.target.value)}
                  placeholder="8.5"
                  min={0}
                  max={10}
                  step={0.1}
                />
              </Field>

              <Field label="排序值" hint="数字越小越靠前">
                <input
                  type="number"
                  name="sortOrder"
                  value={draft.sortOrder}
                  onChange={(event) => update("sortOrder", event.target.value)}
                  step={1}
                  min={-9999}
                  max={9999}
                />
              </Field>
            </div>

            {draft.source !== "manual" && draft.sourceId ? (
              <div className="source-note">
                <span className={`source-pill source-${draft.source}`}>
                  {SOURCE_LABELS[draft.source]}
                </span>
                <span>已关联条目 #{draft.sourceId}</span>
                <button type="button" className="text-button" onClick={clearSource}>
                  清除来源标记
                </button>
              </div>
            ) : null}
          </section>

          <section className="form-panel">
            <div className="form-panel-heading">
              <span className="form-step">03</span>
              <div>
                <h2>
                  <ImageIcon size={18} />
                  展示内容
                </h2>
                <p>封面用于卡片，横幅和截图会出现在详情页。图片地址需可公开访问。</p>
              </div>
            </div>

            <div className="form-grid">
              <Field label="封面图片 URL" className="span-two" hint="推荐竖版封面，比例约 3:4">
                <div className="url-input-row">
                  <input
                    type="url"
                    name="cover"
                    value={draft.cover}
                    onChange={(event) => update("cover", event.target.value)}
                    placeholder="https://..."
                    maxLength={2048}
                  />
                  <span className="url-thumb">
                    <CoverImage src={draft.cover} title={draft.title || "G"} eager />
                  </span>
                </div>
              </Field>

              <Field label="详情页横幅 URL" className="span-two" hint="留空时会使用封面作为背景">
                <div className="url-input-row">
                  <input
                    type="url"
                    name="banner"
                    value={draft.banner}
                    onChange={(event) => update("banner", event.target.value)}
                    placeholder="https://..."
                    maxLength={2048}
                  />
                  <span className="url-thumb wide">
                    {draft.banner ? (
                      <CoverImage src={draft.banner} title={draft.title || "Banner"} eager />
                    ) : (
                      <span className="thumb-empty">横幅预览</span>
                    )}
                  </span>
                </div>
              </Field>

              <Field label="故事简介" className="span-two" hint={`${draft.description.length} / 20000 字`}>
                <textarea
                  name="description"
                  value={draft.description}
                  onChange={(event) => update("description", event.target.value)}
                  placeholder="记录故事梗概、世界观或你想留下的备注…"
                  rows={7}
                  maxLength={20000}
                />
              </Field>

              <Field label="标签" className="span-two" hint="用逗号分隔，最多 14 个">
                <input
                  type="text"
                  name="tags"
                  value={draft.tags}
                  onChange={(event) => update("tags", event.target.value)}
                  placeholder="恋爱, 科幻, 催泪, 全年龄"
                />
                {previewTags.length > 0 ? (
                  <div className="field-tag-preview">
                    {previewTags.map((tag) => (
                      <span key={tag} className="mini-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </Field>

              <Field
                label="画面截图 URL"
                className="span-two"
                hint="每行一个地址，最多 12 张。详情页会显示为画廊。"
              >
                <textarea
                  className="code-textarea"
                  name="screenshots"
                  value={draft.screenshots}
                  onChange={(event) => update("screenshots", event.target.value)}
                  placeholder={"https://.../screen-1.jpg\nhttps://.../screen-2.jpg"}
                  rows={5}
                />
                {screenshots.length > 0 ? (
                  <div className="screenshot-preview-row">
                    {screenshots.slice(0, 6).map((shot, index) => (
                      <span key={`${shot}-${index}`} className="screenshot-preview">
                        <CoverImage src={shot} title={`${draft.title} 截图 ${index + 1}`} eager />
                      </span>
                    ))}
                  </div>
                ) : null}
              </Field>
            </div>
          </section>

          <section className="form-panel">
            <div className="form-panel-heading">
              <span className="form-step">04</span>
              <div>
                <h2>展示设置</h2>
                <p>决定这部作品在首页中的呈现方式。</p>
              </div>
            </div>
            <label className="switch-row">
              <span>
                <strong>设为馆藏推荐</strong>
                <small>推荐作品会出现在首页顶部的大幅展示区。</small>
              </span>
              <input
                type="checkbox"
                name="featured"
                checked={draft.featured}
                onChange={(event) => update("featured", event.target.checked)}
              />
              <span className="switch-track" aria-hidden="true">
                <span />
              </span>
            </label>
          </section>

          {saveError ? (
            <div className="inline-alert error" role="alert">
              <AlertIcon size={18} />
              <div>
                <strong>{saveError}</strong>
                {saveDetails.length > 0 ? (
                  <ul>
                    {saveDetails.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="editor-savebar">
            <div>
              <span className="savebar-kicker">READY TO ARCHIVE</span>
              <span className="savebar-title">
                {isEdit ? "确认修改后保存" : "确认资料无误后收录"}
              </span>
            </div>
            <div className="savebar-actions">
              <Link className="button button-ghost" to="/admin">
                取消
              </Link>
              <button className="button button-primary" type="submit" disabled={saving}>
                <SaveIcon size={16} />
                {saving ? "保存中…" : isEdit ? "保存修改" : "收录作品"}
              </button>
            </div>
          </div>
        </div>

        <aside className="editor-preview-column">
          <div className="preview-sticky">
            <div className="preview-heading">
              <span className="eyebrow">LIVE PREVIEW</span>
              <span className="preview-hint">卡片预览</span>
            </div>

            <div className="preview-card">
              <div className="preview-poster">
                <CoverImage src={draft.cover} title={draft.title || "未命名作品"} />
                {draft.rating.trim() && Number.isFinite(Number(draft.rating)) ? (
                  <span className="score-badge">
                    <StarIcon size={11} />
                    {Number(draft.rating).toFixed(1)}
                  </span>
                ) : null}
                {draft.featured ? <span className="pick-badge">PICK</span> : null}
                <span className="poster-source">
                  {draft.source === "manual" ? "手动录入" : SOURCE_LABELS[draft.source]}
                </span>
              </div>
              <div className="preview-copy">
                <h3>{draft.title.trim() || "未命名作品"}</h3>
                {draft.originalTitle.trim() ? <p>{draft.originalTitle.trim()}</p> : null}
                <span className="preview-meta">
                  {[draft.developer.trim(), year].filter(Boolean).join(" · ") || "制作组 · 年份"}
                </span>
                <div className="preview-tags">
                  {(previewTags.length > 0 ? previewTags.slice(0, 2) : ["等待标签"]).map((tag) => (
                    <span key={tag} className="mini-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="preview-actions">
              <button className="button button-primary button-block" type="button" disabled>
                <PlayIcon size={16} />
                开始游戏
              </button>
              <p>保存后即可从公开页面打开游戏链接。</p>
            </div>

            <div className="preview-tips">
              <span className="preview-tips-icon">
                <SparklesIcon size={16} />
              </span>
              <div>
                <strong>抓取小贴士</strong>
                <p>
                  Bangumi 通常有中文简介，VNDB 的截图更完整。Bangumi 的 R18 条目需要在
                  Worker 中配置 BANGUMI_ACCESS_TOKEN 才能搜索和读取。
                </p>
              </div>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`form-field ${className}`}>
      <span className="field-head">
        <span className="field-label">
          {label}
          {required ? <span className="required-dot">*</span> : null}
        </span>
        {hint ? <span className="field-hint">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}
