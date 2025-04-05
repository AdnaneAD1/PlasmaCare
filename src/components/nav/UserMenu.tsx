import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export const UserMenu = () => {
  const { user, isAuthenticated, isAdmin, loading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="relative">
      {isAuthenticated ? (
        <>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <span>{user?.email}</span>
            <svg
              className={`h-5 w-5 transform transition-transform ${
                isMenuOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
              <div
                className="py-1"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu"
              >
                <Link
                  to="/diagnosis"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Mon diagnostic
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Administration
                  </Link>
                )}

                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex gap-4">
          <Link to="/auth?mode=login" className="btn-outline">
            Se connecter
          </Link>
          <Link to="/auth?mode=register" className="btn-primary">
            S'inscrire
          </Link>
        </div>
      )}
    </div>
  );
};
