import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import HomePage from "@/pages/HomePage";
import SurveyPage from "@/pages/SurveyPage";
import ThankYouPage from "@/pages/ThankYouPage";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminOverviewPage from "@/pages/admin/AdminOverviewPage";
import AdminSurveysPage from "@/pages/admin/AdminSurveysPage";
import AdminSurveyEditorPage from "@/pages/admin/AdminSurveyEditorPage";
import AdminResponsesPage from "@/pages/admin/AdminResponsesPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminListsPage from "@/pages/admin/AdminListsPage";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  useAuth();
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthInitializer>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/survey/:id" element={<SurveyPage />} />
          <Route path="/survey/:id/thank-you" element={<ThankYouPage />} />

          {/* Admin routes — protected */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminOverviewPage />} />
            <Route path="surveys" element={<AdminSurveysPage />} />
            <Route path="surveys/:id" element={<AdminSurveyEditorPage />} />
            <Route path="surveys/:id/responses" element={<AdminResponsesPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="lists" element={<AdminListsPage />} />
          </Route>

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
                  <p className="text-muted-foreground">Sayfa bulunamadı</p>
                  <a href="/" className="text-primary hover:underline mt-4 inline-block">
                    Ana sayfaya dön
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </AuthInitializer>
    </BrowserRouter>
  );
}
