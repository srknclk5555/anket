import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoginButton } from "@/components/auth/LoginButton";
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
            <LoginButton />
            <div className="mt-4 max-w-md mx-auto rounded-2xl border border-sky-200 bg-sky-50 p-4 shadow-sm text-left text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-700 shadow-sm dark:bg-slate-800 dark:text-sky-300">
                  ℹ️
                </div>
                <div>
                  <h3 className="text-base font-semibold">Neden giriş yapmalıyım?</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">
                    Anketimiz her kullanıcının yalnızca bir kez katılabilmesi için Google hesabı ile giriş gerektirmektedir. Kişisel bilgileriniz paylaşılmaz, yalnızca tekrar katılımı önlemek amacıyla kullanılır.
                  </p>
                </div>
              </div>
            </div>
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

