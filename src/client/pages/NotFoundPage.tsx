import { Link } from "react-router-dom";
import { ArrowLeftIcon, SearchIcon } from "../components/Icons";
import { usePageTitle } from "../providers";

export function NotFoundPage() {
  usePageTitle("页面不存在");
  return (
    <div className="page-shell not-found-page">
      <span className="not-found-code">404</span>
      <span className="eyebrow">
        <span className="eyebrow-line" />
        PAGE NOT FOUND
      </span>
      <h1>这一页不在馆藏目录里</h1>
      <p>地址可能写错了，或者这个页面已经被移到别处。</p>
      <div className="not-found-actions">
        <Link className="button button-primary" to="/">
          <ArrowLeftIcon size={17} />
          回到游戏库
        </Link>
        <Link className="button button-ghost" to="/admin/login">
          <SearchIcon size={16} />
          管理员入口
        </Link>
      </div>
    </div>
  );
}
