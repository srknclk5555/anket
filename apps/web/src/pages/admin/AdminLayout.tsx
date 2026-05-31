import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
// import { toast } from "sonner"; // Assuming 'sonner' for toast notifications

export default function AdminLayout() {
  const { user, isLoading: isAuthLoading } = useAuthStore(); // isAuthLoading eklendi
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Oturum yüklenirken bekleyebiliriz
    if (isAuthLoading) return;

    // Kullanıcı yoksa veya admin yetkisi yoksa anasayfaya yönlendir
    // Varsayım: user objesinde isAdmin adında bir boolean alan var
    if (!user || !user.isAdmin) {
      // toast.error("Bu sayfaya erişim yetkiniz yok.");
      navigate("/", { replace: true });
    }
  }, [user, isAuthLoading, navigate]);


  // Auth kontrolü yapılırken yükleniyor durumu gösterebiliriz
  if (isAuthLoading || !user || !user.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-2 rounded-md text-sm transition-colors ${
      isActive
        ? "bg-primary text-primary-foreground font-medium"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  const navLinks = (
    <>
      <NavLink to="/admin" end className={linkClass} onClick={() => setSidebarOpen(false)}>
        Genel Bakış
      </NavLink>
      <NavLink to="/admin/surveys" className={linkClass} onClick={() => setSidebarOpen(false)}>
        Anketler
      </NavLink>
      <NavLink to="/admin/lists" className={linkClass} onClick={() => setSidebarOpen(false)}>
        Özel Listeler
      </NavLink>
      <NavLink to="/admin/users" className={linkClass} onClick={() => setSidebarOpen(false)}>
        Kullanıcılar
      </NavLink>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-30 w-64 border-r border-border bg-card flex flex-col
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:static lg:translate-x-0 lg:flex
        `}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-primary">Admin Panel</h2>
            <p className="text-xs text-muted-foreground mt-1 truncate max-w-[160px]">{user?.email}</p>
          </div>
          {/* Close button — mobile only */}
          <button
            className="lg:hidden p-1 rounded-md hover:bg-muted"
            onClick={() => setSidebarOpen(false)}
            aria-label="Menüyü kapat"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">{navLinks}</nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={() => { navigate("/", { state: { fromAdmin: true } }); setSidebarOpen(false); }}
            className="block w-full text-left px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            Siteye Dön
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-muted"
            aria-label="Menüyü aç"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-primary">Admin Panel</span>
        </div>

        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}


