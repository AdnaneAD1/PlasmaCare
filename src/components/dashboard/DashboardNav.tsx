import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, User, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';

const navigation = [
  {
    name: 'Vue d\'ensemble',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'Rendez-vous',
    href: '/dashboard/appointments',
    icon: Calendar
  },
  {
    name: 'Diagnostic',
    href: '/dashboard/diagnosis',
    icon: FileText
  },
  {
    name: 'Profil',
    href: '/dashboard/profile',
    icon: User
  }
];

export function DashboardNav() {
  const location = useLocation();

  return (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              'flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              isActive
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <Icon
              className={cn(
                'mr-3 h-5 w-5',
                isActive ? 'text-white' : 'text-gray-400'
              )}
            />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
