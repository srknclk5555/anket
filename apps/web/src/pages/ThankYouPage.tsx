import { Link } from "react-router-dom";
import { UserMenu } from "@/components/auth/UserMenu";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
          <a href="/" className="text-base sm:text-xl font-bold text-primary leading-tight">
            Görünmeyen Lig Anketi
          </a>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Anket başarıyla tamamlandı
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-2">
            Katıldığınız için teşekkürler.
          </p>
          <p className="text-base sm:text-lg text-muted-foreground mb-8">
            Sonuçlar için takipte kalın.
          </p>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 active:scale-95 transition-all"
          >
            Ana sayfaya dön
          </Link>
        </div>
      </main>
    </div>
  );
}
