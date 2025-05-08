'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '../ui/Logo';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const menuVariants = {
  closed: {
    x: '100%',
    transition: {
      duration: 0.3,
      ease: 'easeInOut'
    }
  },
  open: {
    x: '0%',
    transition: {
      duration: 0.3,
      ease: 'easeInOut'
    }
  }
};

export function PublicLayout({ children }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  const isActive = (path) => pathname === path;

  return (
    <div className="min-h-screen bg-background hero-pattern">
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-white/95' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center">
              <Logo className="h-8 w-auto" />
            </Link>

            {/* Desktop Menu */}

            {/* Auth Buttons */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              <Link href="/login" className="btn-outline">
                Connexion
              </Link>
              <Link href="/register" className="btn-primary">
                Inscription
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors relative z-50"
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <motion.div
                variants={menuVariants}
                initial="closed"
                animate="open"
                exit="closed"
                className="md:hidden fixed right-0 top-0 bottom-0 w-64 bg-white backdrop-blur-sm shadow-xl z-40"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex flex-col h-full pt-20">
                  <div className="flex-1 px-4 py-6 space-y-6">
                    <div className="flex flex-col space-y-4">
                      <Link
                        href="/login"
                        className="btn-outline w-full text-center bg-white"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Connexion
                      </Link>
                      <Link
                        href="/register"
                        className="btn-primary w-full text-center"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Inscription
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="pt-20">
        {children}
      </main>
    </div>
  );
}
