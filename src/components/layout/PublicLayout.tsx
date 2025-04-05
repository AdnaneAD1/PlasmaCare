import { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { MobileMenu } from '../ui/MobileMenu';
import { UserMenu } from '../nav/UserMenu';
import { useAuth } from '../../lib/auth';

export function PublicLayout() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-background hero-pattern">
      {/* Navigation */}
      <nav className={`border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-lg' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center">
              <Logo />
            </Link>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium">
              <Link to="/treatments" className="nav-link">Traitements</Link>
              <Link to="/results" className="nav-link">Résultats</Link>
              <Link to="/testimonials" className="nav-link">Témoignages</Link>
              {isAuthenticated && (
                <Link to="/diagnosis" className="nav-link">Diagnostic</Link>
              )}
              {isAdmin && (
                <Link to="/admin" className="nav-link text-primary">Administration</Link>
              )}
            </div>
            <div className="hidden md:block">
              <UserMenu />
            </div>
            <MobileMenu 
              isOpen={isMobileMenuOpen}
              onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </div>
        </div>
      </nav>

      <Outlet />
    </div>
  );
}