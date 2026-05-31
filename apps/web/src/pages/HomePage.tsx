import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { UserMenu } from "@/components/auth/UserMenu";
import { usePublishedSurveys } from "@/hooks/useSurvey";
import { DevelopmentBanner } from "@/components/DevelopmentBanner";

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { surveys, isLoading: surveysLoading } = usePublishedSurveys();
  const location = useLocation();
  const fromAdmin = location.state?.fromAdmin;

  if (!isLoading && isAuthenticated && user?.isAdmin && !fromAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <DevelopmentBanner />
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
          <h1 className="text-base sm:text-xl font-bold text-primary leading-tight">
            Görünmeyen Lig Anketi
          </h1>
          <UserMenu />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {!isAuthenticated ? (
          <div className="text-center py-12 sm:py-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Türk Futbol Taraftarları Anketi
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-sm sm:text-base px-2">
              Görünmeyen Lig Anketi'ne katılmak için Google hesabınız ile giriş yapın.
            </p>
            <UserMenu />
          </div>
        ) : (
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-5 sm:mb-6">
              Merhaba, {user?.name || user?.email}!
            </h2>

            {surveysLoading ? (
              <p className="text-muted-foreground">Anketler yükleniyor...</p>
            ) : surveys.length === 0 ? (
              <p className="text-muted-foreground">Şu anda aktif anket bulunmamaktadır.</p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {surveys.map((survey: any) => (
                  <a
                    key={survey.id}
                    href={`/survey/${survey.id}`}
                    className="block p-4 sm:p-6 bg-card border border-border rounded-lg hover:border-primary/50 active:scale-[0.99] transition-all"
                  >
                    <h3 className="text-base sm:text-lg font-semibold text-foreground">{survey.title}</h3>
                    {survey.description && (
                      <p className="text-sm text-muted-foreground mt-2">{survey.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-3">
                      Yayınlanma: {new Date(survey.publishedAt).toLocaleDateString("tr-TR")}
                    </p>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

