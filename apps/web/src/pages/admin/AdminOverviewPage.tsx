import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export default function AdminOverviewPage() {
  const navigate = useNavigate();
  const { isLoading: isAuthLoading } = useAuthStore();
  const [stats, setStats] = useState({
    totalSurveys: 0,
    publishedSurveys: 0,
    totalResponses: 0,
    totalUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch stats on mount
  useEffect(() => {
    if (isAuthLoading) return;

    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const data = await api.get<{
          totalSurveys: number;
          publishedSurveys: number;
          totalResponses: number;
          totalUsers: number;
        }>("/api/admin/stats");
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [isAuthLoading]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      <AdminDashboard stats={stats} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => navigate("/admin/surveys")}
          className="p-4 sm:p-6 bg-card border border-border rounded-lg text-left hover:border-primary/50 active:scale-[0.99] transition-all"
        >
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Anket Yönetimi</h3>
          <p className="text-sm text-muted-foreground">
            Anketleri düzenleyin, yeni anket oluşturun, soruları yönetin.
          </p>
        </button>

        <button
          onClick={() => navigate("/admin/users")}
          className="p-4 sm:p-6 bg-card border border-border rounded-lg text-left hover:border-primary/50 active:scale-[0.99] transition-all"
        >
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Kullanıcı Yönetimi</h3>
          <p className="text-sm text-muted-foreground">
            Kullanıcı rollerini düzenleyin, yetki atayın.
          </p>
        </button>
      </div>
    </div>
  );
}

