import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { ToastContainer } from './components/ui/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { DoctorsPage } from './pages/DoctorsPage';
import { DoctorDetailPage } from './pages/DoctorDetailPage';
import { DoctorFormPage } from './pages/DoctorFormPage';
import { ImportPage } from './pages/ImportPage';
import { AreasPage } from './pages/AreasPage';
import { PlanPage } from './pages/PlanPage';
import { MapPage } from './pages/MapPage';
import { MorePage } from './pages/MorePage';
import { VisitHistoryPage } from './pages/VisitHistoryPage';
import 'leaflet/dist/leaflet.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-navy-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastContainer />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="doctors" element={<DoctorsPage />} />
            <Route path="doctors/new" element={<DoctorFormPage />} />
            <Route path="doctors/import" element={<ImportPage />} />
            <Route path="doctors/:id" element={<DoctorDetailPage />} />
            <Route path="doctors/:id/edit" element={<DoctorFormPage />} />
            <Route path="areas" element={<AreasPage />} />
            <Route path="plan" element={<PlanPage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="more" element={<MorePage />} />
            <Route path="visits" element={<VisitHistoryPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
