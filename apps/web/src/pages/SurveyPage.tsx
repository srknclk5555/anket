import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSurvey } from "@/hooks/useSurvey";
import { api } from "@/lib/api";
import { SurveyForm } from "@/components/survey/SurveyForm";
import { UserMenu } from "@/components/auth/UserMenu";
import { useTheme } from "@/contexts/ThemeContext";

export default function SurveyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { survey, isLoading, error } = useSurvey(id);
  const { theme, toggleTheme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [alreadyResponded, setAlreadyResponded] = useState(false);
  const [progressState, setProgressState] = useState({ progress: 0, answered: 0, total: 0 });

  useEffect(() => {
    if (!id || !isAuthenticated) return;

    let active = true;

    const checkResponse = async () => {
      try {
        const data = await api.get<{ hasResponded: boolean }>(`/api/surveys/${id}/my-response`);
        if (active && data.hasResponded) {
          setAlreadyResponded(true);
        }
      } catch {
        // If the check fails, do not block the page silently.
      }
    };

    checkResponse();

    return () => {
      active = false;
    };
  }, [id, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">
            Ankete katılmak için giriş yapın
          </h2>
          <a href="/" className="text-primary hover:underline">
            Ana sayfaya dön
          </a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">
            Anket bulunamadı
          </h2>
          <a href="/" className="text-primary hover:underline">
            Ana sayfaya dön
          </a>
        </div>
      </div>
    );
  }

  if (survey.status !== "published") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">
            Bu anket şu anda aktif değil
          </h2>
          <a href="/" className="text-primary hover:underline">
            Ana sayfaya dön
          </a>
        </div>
      </div>
    );
  }

  const allQuestions = survey.sections.flatMap((s: any) => s.questions);

  const handleSubmit = async (answers: Record<string, any>) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await api.post(`/api/surveys/${id}/responses`, answers);
      navigate(`/survey/${id}/thank-you`, { replace: true });
    } catch (err: any) {
      const msg = err.message || "Bir hata oluştu";
      if (msg.includes("zaten") || msg.includes("already")) {
        setAlreadyResponded(true);
      }
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (alreadyResponded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">
            Bu ankete zaten katıldınız
          </h2>
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">
            Her anket için yalnızca bir kez oy kullanabilirsiniz.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Ana sayfaya dön
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3">
          <a href="/" className="text-base sm:text-xl font-bold text-primary leading-tight">
            Görünmeyen Lig Anketi
          </a>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              {theme === "stadium" ? "☀️ Klasik" : "🌙 Stadyum"}
            </button>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        <div className="sticky top-16 z-10 bg-background shadow-sm pb-3 pt-3 border-b border-border mb-6 sm:mb-8">
          <div className="mb-3 sm:mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{survey.title}</h1>
            {survey.description && (
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">{survey.description}</p>
            )}
          </div>

          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary rounded-full h-2 transition-all duration-300"
              style={{ width: `${progressState.progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
            İlerleme: {progressState.answered}/{progressState.total} zorunlu soru
          </p>
        </div>

        {submitError && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
            {submitError}
          </div>
        )}

        <SurveyForm
          questions={allQuestions}
          sections={survey.sections}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onProgressChange={(progress, answered, total) =>
            setProgressState({ progress, answered, total })
          }
        />
      </main>
    </div>
  );
}
