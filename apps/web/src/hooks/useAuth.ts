import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import type { SessionUser } from "@gorunmeyen-lig/shared";

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, setLoading, logout } = useAuthStore();

    useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = (await res.json()) as SessionUser;
          setUser(data);
        } else if (res.status === 401) {
          setUser(null);
        } else {
          console.error("Session check failed:", res.statusText);
          setUser(null);
        }
      } catch (err) {
        console.error("Session check error:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [setUser, setLoading]);

  return { user, isAuthenticated, isLoading, logout };
}

