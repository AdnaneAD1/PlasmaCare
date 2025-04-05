import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/auth';

export function AdminRoute() {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth?mode=login" />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return <Outlet />;
}