import { Link } from "react-router-dom";
import { useAuth, useSite } from "../providers";

export function SiteFooter() {
  const { site } = useSite();
  const { user } = useAuth();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-kicker">COLLECTED STORIES</span>
          <p>{site.tagline}</p>
        </div>
        <div className="footer-meta">
          <span>元数据来自 Bangumi / VNDB</span>
          <span className="footer-sep" aria-hidden="true">
            /
          </span>
          <Link to={user ? "/admin" : "/admin/login"}>{user ? "管理后台" : "管理员登录"}</Link>
          <span className="footer-sep" aria-hidden="true">
            /
          </span>
          <span>Powered by Cloudflare Workers</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} {site.name}</span>
        <span className="footer-code">WEBGAL · ARCHIVE</span>
      </div>
    </footer>
  );
}
