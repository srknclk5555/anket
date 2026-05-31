import { useAuthStore } from "@/stores/auth-store";
import { LoginButton } from "./LoginButton";
import { API_BASE } from "@/lib/api";

export function UserMenu() {
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/sign-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      logout();
      window.location.href = "/";
    }
  };

  if (!isAuthenticated || !user) {
    return <LoginButton />;
  }

  return (
    <div className="flex items-center gap-3">
      {user.avatarUrl && (
        <img
          src={user.avatarUrl}
          alt={user.name || "Avatar"}
          className="w-8 h-8 rounded-full"
        />
      )}
      <span className="text-sm font-medium text-foreground">
        {user.name || user.email}
      </span>
      {user.isAdmin && (
        <a
          href="/admin"
          className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
        >
          Admin Panel
        </a>
      )}
      <button
        onClick={handleLogout}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Çıkış
      </button>
    </div>
  );
}
