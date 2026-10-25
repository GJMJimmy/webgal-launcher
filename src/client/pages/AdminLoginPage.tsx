import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  LibraryIcon,
  LockIcon,
  ShieldIcon,
  SparklesIcon,
} from "../components/Icons";
import { useAuth, usePageTitle, useSite } from "../providers";
import { ApiError } from "../api";
import { ThemeToggle } from "../components/ThemeToggle";

interface LocationState {
  from?: string;
}

export function AdminLoginPage() {
  const { user, loading, configured, login } = useAuth();
  const { site } = useSite();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  usePageTitle("管理员登录");

  if (!loading && user) {
    return <Navigate to={state?.from || "/admin"} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError("");
    if (!username.trim() || !password) {
      setError("请输入用户名和密码。");
      return;
    }
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate(state?.from || "/admin", { replace: true });
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "登录失败，请检查网络后再试一次。",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-art" aria-hidden="true">
        <div className="login-art-glow" />
        <div className="login-art-grid" />
        <div className="login-quote">
          <span className="eyebrow">
            <SparklesIcon size={14} />
            PRIVATE ARCHIVE
          </span>
          <blockquote>
            每一个故事，
            <br />
            都值得被好好收藏。
          </blockquote>
          <p>{site.name} / ADMIN</p>
        </div>
        <div className="login-art-cards">
          <span className="login-art-card card-a" />
          <span className="login-art-card card-b" />
          <span className="login-art-card card-c">
            <LibraryIcon size={28} />
          </span>
        </div>
        <span className="login-art-index">ARCHIVE / 001</span>
      </div>

      <div className="login-panel">
        <div className="login-topbar">
          <Link className="login-back" to="/">
            <ArrowLeftIcon size={16} />
            返回游戏库
          </Link>
          <div className="login-topbar-actions">
            <span className="login-secure">
              <ShieldIcon size={14} />
              SECURED AREA
            </span>
            <ThemeToggle compactLabel />
          </div>
        </div>

        <div className="login-form-wrap">
          <span className="login-mark">
            <LockIcon size={23} />
          </span>
          <span className="eyebrow">ADMIN CONSOLE</span>
          <h1>管理员登录</h1>
          <p className="login-sub">
            登录后可以添加游戏、编辑资料与维护馆藏。访客无需登录即可浏览。
          </p>

          {!loading && !configured ? (
            <div className="inline-alert warning">
              <ShieldIcon size={17} />
              <div>
                <strong>尚未配置管理员密码</strong>
                <p>
                  请先在 Worker 中设置 <code>ADMIN_PASSWORD</code> 与{" "}
                  <code>SESSION_SECRET</code>。
                </p>
              </div>
            </div>
          ) : null}

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span className="field-label">用户名</span>
              <input
                type="text"
                name="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="admin"
                autoComplete="username"
                spellCheck={false}
              />
            </label>

            <label className="form-field">
              <span className="field-label">密码</span>
              <span className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="输入管理员密码"
                  autoComplete="current-password"
                  autoFocus
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                >
                  {showPassword ? <EyeOffIcon size={17} /> : <EyeIcon size={17} />}
                </button>
              </span>
            </label>

            {error ? (
              <div className="form-error" role="alert">
                {error}
              </div>
            ) : null}

            <button className="button button-primary button-block login-submit" type="submit" disabled={submitting}>
              {submitting ? "验证中…" : "进入管理后台"}
            </button>
          </form>

          <p className="login-note">
            该入口仅用于站长维护内容。登录状态会通过 HttpOnly Cookie 保存 7 天。
          </p>
        </div>
      </div>
    </div>
  );
}
