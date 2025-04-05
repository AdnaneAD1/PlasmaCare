import React from 'react';
import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Logo } from './Logo';
import { useAuth } from '../../lib/auth';

interface MobileMenuProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function MobileMenu({ isOpen, onToggle }: MobileMenuProps) {
  const { isAuthenticated, isAdmin, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      onToggle();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <button 
        onClick={onToggle}
        className="md:hidden p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
        aria-label="Toggle menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onToggle}
      />

      {/* Menu Panel */}
      <div 
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b bg-white">
            <Link to="/" onClick={onToggle}>
              <Logo />
            </Link>
          </div>
          
          <nav className="flex-1 p-6 space-y-4 bg-white">
            <Link 
              to="/treatments" 
              className="block text-gray-600 hover:text-primary hover:bg-primary/5 transition-all py-2 px-4 rounded-lg"
              onClick={onToggle}
            >
              Traitements
            </Link>
            <Link 
              to="/results" 
              className="block text-gray-600 hover:text-primary hover:bg-primary/5 transition-all py-2 px-4 rounded-lg"
              onClick={onToggle}
            >
              Résultats
            </Link>
            <Link 
              to="/testimonials" 
              className="block text-gray-600 hover:text-primary hover:bg-primary/5 transition-all py-2 px-4 rounded-lg"
              onClick={onToggle}
            >
              Témoignages
            </Link>
            <Link 
              to="/diagnosis" 
              className="block text-gray-600 hover:text-primary hover:bg-primary/5 transition-all py-2 px-4 rounded-lg"
              onClick={onToggle}
            >
              Diagnostic
            </Link>
            {isAdmin && (
              <Link 
                to="/admin" 
                className="block text-primary font-medium hover:bg-primary/5 transition-all py-2 px-4 rounded-lg"
                onClick={onToggle}
              >
                Administration
              </Link>
            )}
          </nav>

          <div className="p-6 border-t bg-white">
            <div className="space-y-4">
              {isAuthenticated ? (
                <>
                  <Link 
                    to={isAdmin ? "/admin" : "/dashboard"}
                    className="block w-full btn-outline text-center"
                    onClick={onToggle}
                  >
                    {isAdmin ? "Administration" : "Mon compte"}
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="block w-full btn-primary text-center"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/auth?mode=login" 
                    className="block w-full btn-outline text-center"
                    onClick={onToggle}
                  >
                    Se connecter
                  </Link>
                  <Link 
                    to="/auth?mode=register" 
                    className="block w-full btn-primary text-center"
                    onClick={onToggle}
                  >
                    S'inscrire
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}