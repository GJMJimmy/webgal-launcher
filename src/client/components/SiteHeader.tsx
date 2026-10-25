import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth, useSite } from "../providers";
import { GridIcon, LibraryIcon, ShieldIcon } from "./Icons";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
  const { site } = useSite();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="site-header-inner">
        <Link className="brand" to="/" aria-label={`${site.name} 首页`}>
          <span className="brand-mark">
            <LibraryIcon size={19} />
          </span>
          <span className="brand-copy">
            <span className="brand-name">{site.name}</span>
            <span className="brand-sub">PERSONAL VISUAL NOVEL ARCHIVE</span>
          </span>
        </Link>

        <nav className="site-nav" aria-label="主导航">
          <NavLink className="nav-link" to="/" end aria-label="游戏库">
            <GridIcon size={17} />
            <span className="nav-label">游戏库</span>
          </NavLink>
          <NavLink
            className="nav-link"
            to={user ? "/admin" : "/admin/login"}
            aria-label={user ? "管理后台" : "管理员登录"}
          >
            {user ? <ShieldIcon size={17} /> : <LibraryIcon size={17} />}
            <span className="nav-label">{user ? "管理后台" : "管理员"}</span>
          </NavLink>
          {user ? (
            <span className="admin-chip" title={`已登录：${user}`}>
              <span className="admin-dot" />
              {user}
            </span>
          ) : null}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
