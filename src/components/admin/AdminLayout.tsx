import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText,
  Settings,
  ArrowLeft,
  Menu,
  X,
  LogOut,
  Bell
} from 'lucide-react';
import { Logo } from '../ui/Logo';
import { cn } from '../../lib/utils';
import { useAuth } from '../../lib/auth';
import { LocalPharmacy as ProductIcon } from '@mui/icons-material';

const menuItems = [
  { 
    icon: LayoutDashboard, 
    label: 'Tableau de bord', 
    path: '/admin',
    exact: true
  },
  { 
    icon: Users, 
    label: 'Utilisateurs', 
    path: '/admin/users' 
  },
  { 
    icon: Calendar, 
    label: 'Rendez-vous', 
    path: '/admin/appointments' 
  },
  { 
    icon: FileText, 
    label: 'Traitements', 
    path: '/admin/treatments' 
  },
  { 
    icon: ProductIcon, 
    label: 'Produits', 
    path: '/admin/products' 
  },
  { 
    icon: Settings, 
    label: 'Paramètres', 
    path: '/admin/settings' 
  }
];

export function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth?mode=login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Fermer le menu mobile quand la route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (item: typeof menuItems[0]) => {
    return item.exact 
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Logo className="h-8 w-auto" />
              <span className="ml-4 text-sm font-medium text-gray-500 hidden md:inline-block">
                Espace Administration
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                className="p-2 rounded-full hover:bg-gray-100 relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full"></span>
              </button>
              
              <Link
                to="/"
                className="hidden md:flex items-center text-gray-600 hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="text-sm">Retour au site</span>
              </Link>
              
              <div 
                className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center"
                aria-label="Avatar utilisateur"
              >
                <span className="text-primary font-medium text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-600"
                aria-label="Menu mobile"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-auto pt-16 md:pt-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <nav className="p-4 space-y-1 h-[calc(100%-120px)] overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center px-4 py-2 text-gray-600 rounded-lg transition-colors",
                  isActive(item)
                    ? "bg-primary text-white" 
                    : "hover:bg-primary/5 hover:text-primary"
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-0 w-full p-4 border-t bg-white">
            <Link
              to="/"
              className="flex items-center w-full px-4 py-2 text-gray-600 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors md:hidden"
            >
              <ArrowLeft className="w-5 h-5 mr-3" />
              <span>Retour au site</span>
            </Link>
            
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 mt-2 text-gray-600 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
              aria-label="Déconnexion"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span>Déconnexion</span>
            </button>
          </div>
        </aside>

        {/* Overlay mobile */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8 pt-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}