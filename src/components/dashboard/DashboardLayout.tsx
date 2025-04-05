import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, FileText, User, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { Logo } from '../ui/Logo';
import { MobileNav } from './MobileNav';
import { cn } from '../../lib/utils';
import { Notifications as NotificationsIcon } from '@mui/icons-material';

export function DashboardLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth?mode=login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return null;
  }

  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Vue d\'ensemble', 
      path: '/dashboard' 
    },
    { 
      icon: Calendar, 
      label: 'Rendez-vous', 
      path: '/dashboard/appointments' 
    },
    { 
      icon: FileText, 
      label: 'Diagnostic', 
      path: '/dashboard/diagnosis' 
    },
    { 
      icon: NotificationsIcon, 
      label: 'Notifications', 
      path: '/dashboard/notifications' 
    },
    { 
      icon: User, 
      label: 'Profil', 
      path: '/dashboard/profile' 
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Mobile */}
      <header className="h-16 bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-30 lg:hidden">
        <div className="flex items-center justify-between px-4 h-full">
          <Logo />
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      <div className="flex h-full">
        {/* Sidebar */}
        <aside 
          className={cn(
            "bg-white border-r border-gray-200 fixed top-0 bottom-0 left-0 z-40 w-72 transform transition-transform duration-200 ease-in-out lg:relative lg:transform-none",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className="h-16 flex items-center px-6 border-b hidden lg:flex">
            <Logo />
          </div>

          <nav className="p-6 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center px-4 py-3 text-gray-600 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-0 w-full p-6 border-t">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
                </p>
                <p className="text-xs text-gray-500">Client</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-gray-600 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span>Déconnexion</span>
            </button>
          </div>
        </aside>

        {/* Overlay pour fermer la sidebar sur mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 w-full">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-0 pb-16 lg:pb-0">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Navigation Mobile */}
      <MobileNav />
    </div>
  );
}