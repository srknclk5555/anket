import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

interface SurveyListItem {
  id: string;
  title: string;
  status: "draft" | "published" | "closed";
  responseCount: number;
  publishedAt: string | null;
  createdAt: string;
}

export default function AdminSurveysPage() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<SurveyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const data = await api.get<{ surveys: SurveyListItem[] }>("/api/admin/surveys");
        setSurveys(data.surveys);
      } catch {
        // Use empty array
      } finally {
        setIsLoading(false);
      }
    };
    fetchSurveys();
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const data = await api.post<{ survey: { id: string } }>("/api/admin/surveys", {
        title: newTitle.trim(),
      });
      navigate(`/admin/surveys/${data.survey.id}`);
    } catch {
      alert("Anket oluşturulurken hata oluştu");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (surveyId: string, currentStatus: string) => {
    const newStatus = currentStatus === "draft" ? "published" : currentStatus === "published" ? "closed" : "draft";
    try {
      await api.patch(`/api/admin/surveys/${surveyId}/status`, { status: newStatus });
      setSurveys((prev) =>
        prev.map((s) => (s.id === surveyId ? { ...s, status: newStatus as any } : s))
      );
    } catch {
      alert("Durum güncellenirken hata oluştu");
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-100 text-gray-700",
      published: "bg-green-100 text-green-700",
      closed: "bg-red-100 text-red-700",
    };
    const labels: Record<string, string> = {
      draft: "Taslak",
      published: "Yayında",
      closed: "Kapalı",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Anketler</h2>
      </div>

      {/* Create new survey */}
      <div className="flex items-center gap-3 p-4 border border-dashed border-border rounded-lg">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Yeni anket başlığı..."
          className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <button
          onClick={handleCreate}
          disabled={creating || !newTitle.trim()}
          className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {creating ? "Oluşturuluyor..." : "Oluştur"}
        </button>
      </div>

      {/* Survey list */}
      <div className="space-y-3">
        {surveys.map((survey) => (
          <div
            key={survey.id}
            className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors"
          >
            <div
              className="flex-1 cursor-pointer"
              onClick={() => navigate(`/admin/surveys/${survey.id}`)}
            >
              <div className="flex items-center gap-3">
                <h3 className="font-medium text-foreground">{survey.title}</h3>
                {statusBadge(survey.status)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {survey.responseCount} cevap | Oluşturulma:{" "}
                {new Date(survey.createdAt).toLocaleDateString("tr-TR")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/admin/surveys/${survey.id}/responses`)}
                className="text-xs px-3 py-1.5 border border-border rounded-md hover:bg-muted"
              >
                Cevaplar
              </button>
              <button
                onClick={() => handleToggleStatus(survey.id, survey.status)}
                className={`text-xs px-3 py-1.5 rounded-md ${
                  survey.status === "published"
                    ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                    : survey.status === "closed"
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                }`}
              >
                {survey.status === "draft"
                  ? "Yayınla"
                  : survey.status === "published"
                  ? "Kapat"
                  : "Taslak Yap"}
              </button>
            </div>
          </div>
        ))}

        {surveys.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Henüz anket yok. Yukarıdan yeni bir anket oluşturun.
          </p>
        )}
      </div>
    </div>
  );
}
