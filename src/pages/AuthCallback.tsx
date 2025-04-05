import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Alert } from '../components/ui/Alert';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

type CallbackStatus = 'loading' | 'error' | 'success' | 'timeout';

export function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 secondes
    const TIMEOUT_DELAY = 30000; // 30 secondes

    let timeoutId: NodeJS.Timeout;
    let mounted = true;

    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) throw error;

        if (session?.user) {
          // Vérifier si l'utilisateur est admin
          const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('id')
            .eq('user_id', session.user.id)
            .single();

          if (adminError && adminError.code !== 'PGRST116') {
            console.error('Error checking admin status:', adminError);
          }

          setStatus('success');
          
          // Rediriger vers la page appropriée
          const redirectPath = adminData ? '/admin' : '/dashboard';
          navigate(redirectPath, { replace: true });
        } else {
          if (retryCount < MAX_RETRIES) {
            setRetryCount(prev => prev + 1);
            setTimeout(handleCallback, RETRY_DELAY);
          } else {
            throw new Error('Session non trouvée après plusieurs tentatives');
          }
        }
      } catch (err: any) {
        if (!mounted) return;
        
        console.error('Erreur de callback:', err);
        setStatus('error');
        
        const errorMessages: Record<string, string> = {
          'Session non trouvée': 'La session n\'a pas pu être récupérée. Veuillez vous reconnecter.',
          'Invalid JWT': 'Le lien de confirmation a expiré. Veuillez vous reconnecter.',
          'JWT expired': 'Le lien de confirmation a expiré. Veuillez vous reconnecter.',
          'User not found': 'Utilisateur non trouvé. Veuillez vous reconnecter.'
        };

        setError(errorMessages[err.message] || 'Une erreur est survenue lors de la confirmation. Veuillez réessayer.');
      }
    };

    // Démarrer le timeout
    timeoutId = setTimeout(() => {
      if (mounted && status === 'loading') {
        setStatus('timeout');
        setError('La confirmation a pris trop de temps. Veuillez réessayer.');
      }
    }, TIMEOUT_DELAY);

    handleCallback();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [navigate]);

  if (status === 'error' || status === 'timeout') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {status === 'timeout' ? 'Délai dépassé' : 'Erreur de confirmation'}
            </h2>
            <Alert type="error" className="mb-4">
              {error}
            </Alert>
          </div>
          
          <div className="flex flex-col gap-4">
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary w-full"
            >
              Réessayer
            </button>
            
            <Link
              to="/auth"
              replace
              className="btn-primary w-full text-center"
            >
              Retour à la connexion
            </Link>
          </div>

          <p className="text-sm text-gray-500 text-center mt-4">
            Si le problème persiste, veuillez contacter le support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <LoadingSpinner className="w-12 h-12" />
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900">
            Confirmation en cours...
          </p>
          <p className="text-sm text-gray-500">
            Veuillez patienter pendant que nous vérifions votre identité
          </p>
        </div>
      </div>
    </div>
  );
}
