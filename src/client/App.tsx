import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { PageLoader } from "./components/Feedback";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { GameDetailPage } from "./pages/GameDetailPage";
import { GameFormPage } from "./pages/GameFormPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import {
  AuthProvider,
  ScrollToTop,
  SiteProvider,
  ToastProvider,
  useAuth,
} from "./providers";

function PublicLayout() {
  const location = useLocation();
  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="site-main">
        <div className="route-fade" key={location.pathname}>
          <Outlet />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="page-shell admin-guard-loading">
        <PageLoader label="正在验证管理员身份…" />
      </div>
    );
  }
  if (!user) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }
  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <SiteProvider>
        <AuthProvider>
          <ToastProvider>
            <ScrollToTop />
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/game/:id" element={<GameDetailPage />} />
                <Route
                  path="/admin"
                  element={
                    <RequireAdmin>
                      <AdminDashboardPage />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="/admin/games/new"
                  element={
                    <RequireAdmin>
                      <GameFormPage />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="/admin/games/:id/edit"
                  element={
                    <RequireAdmin>
                      <GameFormPage />
                    </RequireAdmin>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
              <Route path="/admin/login" element={<AdminLoginPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </SiteProvider>
    </BrowserRouter>
  );
}
