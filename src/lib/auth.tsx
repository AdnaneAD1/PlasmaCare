import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: User | null;
  loading: boolean;
  session: Session | null;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isAdmin: false,
  user: null,
  loading: true,
  session: null,
  checkAuth: async () => {},
  logout: async () => {},
  refreshSession: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAdmin = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in checkAdmin:', error);
      return false;
    }
  };

  const refreshSession = async () => {
    try {
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
      if (error) {
        throw error;
      }
      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
        setIsAuthenticated(true);
        if (newSession.user) {
          const isUserAdmin = await checkAdmin(newSession.user.id);
          setIsAdmin(isUserAdmin);
        }
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      handleAuthError();
    }
  };

  const handleAuthError = () => {
    setIsAuthenticated(false);
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setLoading(false);
  };

  const handleAuthSuccess = async (session: Session | null) => {
    if (!session?.user) {
      console.error('Invalid session in handleAuthSuccess');
      handleAuthError();
      return false;
    }
  
    try {
      // Vérification synchrone immédiate
      setSession(session);
      setUser(session.user);
      setIsAuthenticated(true);
  
      // Vérification admin asynchrone
      const isUserAdmin = await checkAdmin(session.user.id);
      setIsAdmin(isUserAdmin);
  
      console.log('Auth success for:', session.user.email);
      return isUserAdmin;
    } catch (error) {
      console.error('Error in auth success:', error);
      handleAuthError();
      return false;
    } finally {
      setLoading(false);
      console.log('Loading set to false');
    }
  };

  const checkAuth = async () => {
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }

      if (currentSession) {
        await handleAuthSuccess(currentSession);
      } else {
        handleAuthError();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      handleAuthError();
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      handleAuthError();
    } catch (error) {
      console.error('Logout error:', error);
      handleAuthError();
    }
  };

  const recoverSession = async () => {
    try {
      // 1. Essai standard
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (session) return session;
  
      // 2. Fallback: vérification de l'utilisateur
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
  
      // 3. Dernière tentative: refresh forcé
      const { data: { session: newSession } } = await supabase.auth.refreshSession();
      return newSession;
    } catch (error) {
      console.error('Session recovery failed:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;
  
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log('Initializing auth...');
  
        // 1. Tentative principale avec récupération forcée
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        if (error) throw error;
  
        // 2. Fallback si session manquante mais utilisateur potentiellement connecté
        if (!session && retryCount < maxRetries) {
          retryCount++;
          console.log(`Session recovery attempt ${retryCount}/${maxRetries}`);
          
          // Force un refresh complet
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: { session: newSession } } = await supabase.auth.refreshSession();
            if (newSession) {
              await handleAuthSuccess(newSession);
              return;
            }
          }
        }
  
        // 3. Traitement final
        if (session) {
          console.log('Session found:', session.user?.email);
          await handleAuthSuccess(session);
        } else {
          console.log('No session found');
          handleAuthError();
        }
  
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) handleAuthError();
      }
    };
  
    // Écouteur d'événements amélioré
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`Auth event: ${event}`, session ? 'with session' : 'no session');
        
        if (!mounted) return;
  
        switch (event) {
          case 'INITIAL_SESSION':
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            if (session) {
              await handleAuthSuccess(session);
            } else {
              console.warn('Received auth event without session!');
              await initializeAuth(); // Relance l'initialisation
            }
            break;
  
          case 'SIGNED_OUT':
          case 'USER_DELETED':
            handleAuthError();
            break;
        }
      }
    );
  
    // Premier chargement
    initializeAuth();
  
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider 
      value={{
        isAuthenticated,
        isAdmin,
        user,
        loading,
        session,
        checkAuth,
        logout,
        refreshSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}