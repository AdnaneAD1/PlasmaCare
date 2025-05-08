'use client'

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Bell,
  Package,
  User
} from 'lucide-react';
import { Logo } from '../../components/ui/Logo';
import { useAuth } from '@/hooks/auth';
import Loading from '@/app/(auth)/Loading';
import { LoadingButton } from '@/components/ui/LoadingButton';

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth({ middleware: 'auth' });
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Tableau de bord', 
      path: '/admin',
      exact: true,
      showMobile: true
    },
    { 
      icon: Users, 
      label: 'Utilisateurs', 
      path: '/admin/users',
      showMobile: true
    },
    { 
      icon: Calendar, 
      label: 'Rendez-vous', 
      path: '/admin/appointments',
      showMobile: true
    },
    { 
      icon: FileText, 
      label: 'Traitements', 
      path: '/admin/treatments',
      showMobile: true
    },
    { 
      icon: Package, 
      label: 'Produits', 
      path: '/admin/products',
      showMobile: true
    },
    { 
      icon: Settings, 
      label: 'Paramètres', 
      path: '/admin/settings',
      showMobile: true
    }
  ];

  const isActive = (item) => {
    return item.exact 
      ? pathname === item.path
      : pathname.startsWith(item.path);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) {
    return <Loading />
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Accès refusé</h1>
          <p className="text-gray-600 mb-8">Vous n'avez pas les autorisations nécessaires pour accéder à cette page.</p>
          <Link href="/dashboard" className="btn-primary">
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Mobile */}
      <header className="h-16 bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-30 lg:hidden">
        <div className="flex items-center justify-between px-4 h-full">
          <Logo />
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <span className="ml-2 text-sm font-medium">{user.name}</span>
            </div>
            {/* <button 
              className="p-2 rounded-lg hover:bg-gray-100 relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full"></span>
            </button> */}
          </div>
        </div>
      </header>

      <div className="flex h-screen">
        {/* Sidebar Desktop */}
        <aside className="bg-white border-r border-gray-200 w-72 hidden lg:block">
          <div className="flex flex-col h-full">
            <div className="h-16 flex items-center px-6 border-b">
              <Logo />
              <span className="ml-4 text-sm font-medium text-gray-500">
                Espace Administration
              </span>
            </div>

            <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`
                    flex items-center px-4 py-3 text-gray-600 rounded-lg transition-colors
                    ${isActive(item)
                      ? 'bg-primary text-white' 
                      : 'hover:bg-primary/5 hover:text-primary'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="p-6 border-t mt-auto">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-gray-500">Administrateur</p>
                </div>
              </div>
              
              <LoadingButton
                onClick={handleLogout}
                isLoading={isLoggingOut}
                className="flex items-center w-full px-4 py-3 mt-2 text-white rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
              >
                <LogOut className="w-5 h-5 mr-3" />
                <span>Déconnexion</span>
              </LoadingButton>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header Desktop */}
          <header className="h-16 min-h-[64px] bg-white border-b border-gray-200 hidden lg:flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center gap-6">
              <Link
                href="/admin/notifications"
                className={`p-2 rounded-lg hover:bg-gray-100 relative ${pathname === '/admin/notifications' ? 'text-primary' : 'text-gray-600'}`}
              >
                <Bell className="w-5 h-5" />
              </Link>
            </div>
            <div className="flex items-center bg-gray-50 py-1.5 px-3 rounded-lg">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-500">Administrateur</p>
              </div>
            </div>
          </header>
          
          <main className="flex-1 w-full pt-16 lg:pt-0">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Navigation Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 lg:hidden">
        <div className="flex justify-between px-2">
          {menuItems.filter(item => item.showMobile).map((item) => {
            const active = item.exact 
              ? pathname === item.path
              : pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`
                  flex items-center justify-center p-2
                  ${active ? 'text-primary' : 'text-gray-600'}
                  relative
                `}
                title={item.label}
              >
                <item.icon className="w-5 h-5" />
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
