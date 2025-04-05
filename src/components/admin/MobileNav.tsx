import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, FileText, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

const navigation = [
  { 
    icon: LayoutDashboard, 
    label: 'Accueil', 
    path: '/admin' 
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
    icon: Settings, 
    label: 'Paramètres', 
    path: '/admin/settings' 
  }
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden">
      <div className="grid grid-cols-5 h-16">
        {navigation.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center space-y-1',
                isActive ? 'text-primary' : 'text-gray-600'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
