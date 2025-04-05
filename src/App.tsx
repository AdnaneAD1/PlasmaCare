import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { PublicLayout } from './components/layout/PublicLayout';
import { AdminLayout } from './components/admin/AdminLayout';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import { Home } from './pages/Home';
import { Treatments } from './pages/Treatments';
import { Results } from './pages/Results';
import { Testimonials } from './pages/Testimonials';
import { Auth } from './pages/Auth';
import { AuthCallback } from './pages/AuthCallback';
import { Diagnosis } from './pages/Diagnosis';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { UserDetails } from './pages/admin/UserDetails';
import { AppointmentsList } from './pages/admin/AppointmentsList';
import { TreatmentsList } from './pages/admin/TreatmentsList';
import { Settings } from './pages/admin/Settings';
import { Overview } from './pages/dashboard/Overview';
import { Profile } from './pages/dashboard/Profile';
import { Appointments } from './pages/dashboard/Appointments';
import { useAuth } from './lib/auth';
import ProductsList from './pages/admin/ProductsList';
import Notifications from './pages/user/Notifications';

// Composant pour rediriger les utilisateurs authentifiés
function AuthRedirect() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin' : '/dashboard'} state={{ from: location }} replace />;
  }
  
  return <Auth />;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/treatments" element={<Treatments />} />
            <Route path="/results" element={<Results />} />
            <Route path="/testimonials" element={<Testimonials />} />
            <Route path="/auth" element={<AuthRedirect />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Route>

          {/* User Dashboard Routes */}
          <Route 
            path="/dashboard/*" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="profile" element={<Profile />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="diagnosis" element={<Diagnosis />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>

          {/* Admin Routes */}
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users/:id" element={<UserDetails />} />
            <Route path="users" element={<AdminDashboard />} />
            <Route path="appointments" element={<AppointmentsList />} />
            <Route path="treatments" element={<TreatmentsList />} />
            <Route path="products" element={<ProductsList />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;