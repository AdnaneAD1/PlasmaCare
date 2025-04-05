import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import { PublicLayout } from './components/layout/PublicLayout';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { AdminLayout } from './components/admin/AdminLayout';

// Pages publiques
import { Home } from './pages/Home';
import { Auth } from './pages/Auth';
import { AuthCallback } from './pages/AuthCallback';
import { Treatments } from './pages/Treatments';
import { Testimonials } from './pages/Testimonials';

// Pages utilisateur
import { Overview } from './pages/dashboard/Overview';
import { Profile } from './pages/dashboard/Profile';
import { Appointments } from './pages/dashboard/Appointments';
import { Diagnosis } from './pages/Diagnosis';
import { Results } from './pages/Results';
import Notifications from './pages/user/Notifications';

// Pages admin
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { AppointmentsList } from './pages/admin/AppointmentsList';
import { TreatmentsList } from './pages/admin/TreatmentsList';
import ProductsList from './pages/admin/ProductsList';
import { Settings } from './pages/admin/Settings';
import { UserDetails } from './pages/admin/UserDetails';

// Auth Guard
import { AuthGuard } from './components/auth/AuthGuard';
import { AdminGuard } from './components/auth/AdminGuard';

export const router = createBrowserRouter([
  // Routes publiques
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'auth', element: <Auth /> },
      { path: 'auth/callback', element: <AuthCallback /> },
      { path: 'treatments', element: <Treatments /> },
      { path: 'testimonials', element: <Testimonials /> }
    ]
  },

  // Routes utilisateur (protégées)
  {
    path: '/dashboard',
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Overview /> },
      { path: 'profile', element: <Profile /> },
      { path: 'appointments', element: <Appointments /> },
      { path: 'diagnosis', element: <Diagnosis /> },
      { path: 'results', element: <Results /> },
      { path: 'notifications', element: <Notifications /> }
    ]
  },

  // Routes admin (protégées)
  {
    path: '/admin',
    element: (
      <AdminGuard>
        <AdminLayout />
      </AdminGuard>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'appointments', element: <AppointmentsList /> },
      { path: 'treatments', element: <TreatmentsList /> },
      { path: 'products', element: <ProductsList /> },
      { path: 'settings', element: <Settings /> },
      { path: 'users/:id', element: <UserDetails /> }
    ]
  },

  // Redirection par défaut
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);
