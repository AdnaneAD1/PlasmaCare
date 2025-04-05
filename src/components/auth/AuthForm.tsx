import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../../lib/api';
import { Alert } from '../ui/Alert';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { supabase } from '../../lib/supabase';
import { z } from 'zod';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSuccess?: () => void;
}

// Schémas de validation
const emailSchema = z.string().email('Veuillez entrer une adresse email valide');
const passwordSchema = z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères');
const nameSchema = z.string().min(2, 'Doit contenir au moins 2 caractères');

export function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = mode === 'login';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });

  // Réinitialiser le formulaire lors du changement de mode
  useEffect(() => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: ''
    });
    setError(null);
    setSuccessMessage(null);
  }, [mode]);

  const validateForm = () => {
    try {
      emailSchema.parse(formData.email);
      passwordSchema.parse(formData.password);

      if (!isLogin) {
        nameSchema.parse(formData.firstName);
        nameSchema.parse(formData.lastName);
      }

      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError('Veuillez vérifier les champs du formulaire');
      }
      return false;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      
      if (isLogin) {
        const authData = await auth.login(formData.email, formData.password);
        
        if (!authData?.user) {
          throw new Error('Erreur lors de la connexion');
        }

        // Vérifier si l'utilisateur est admin
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('id')
          .eq('user_id', authData.user.id)
          .single();

        if (adminError && adminError.code !== 'PGRST116') {
          console.error('Error checking admin status:', adminError);
        }

        // Rediriger vers la page précédente ou la page appropriée
        const from = location.state?.from?.pathname || (adminData ? '/admin' : '/dashboard');
        onSuccess?.();
        navigate(from, { replace: true });
      } else {
        await auth.register({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName
        });
        setSuccessMessage(
          'Votre compte a été créé avec succès ! Veuillez vérifier votre boîte mail pour confirmer votre adresse email.'
        );
        // Réinitialiser le formulaire après l'inscription
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: ''
        });
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      
      const errorMessages: Record<string, string> = {
        'Invalid login credentials': 'Email ou mot de passe incorrect',
        'Email not confirmed': 'Veuillez confirmer votre adresse email avant de vous connecter',
        'User already registered': 'Un compte existe déjà avec cette adresse email',
        'Email rate limit exceeded': 'Trop de tentatives. Veuillez réessayer plus tard'
      };

      setError(errorMessages[err.message] || (isLogin 
        ? 'Erreur lors de la connexion. Veuillez réessayer.'
        : 'Erreur lors de l\'inscription. Veuillez réessayer.'
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value.trim()
    }));
    setError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert type="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {!isLogin && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              Prénom
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="input mt-1"
              minLength={2}
              required={!isLogin}
              disabled={isLoading}
              autoComplete="given-name"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Nom
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="input mt-1"
              minLength={2}
              required={!isLogin}
              disabled={isLoading}
              autoComplete="family-name"
            />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="input mt-1"
          required
          disabled={isLoading}
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Mot de passe
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="input mt-1"
          required
          disabled={isLoading}
          autoComplete={isLogin ? "current-password" : "new-password"}
          minLength={8}
        />
        {!isLogin && (
          <p className="mt-1 text-sm text-gray-500">
            Le mot de passe doit contenir au moins 8 caractères
          </p>
        )}
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <LoadingSpinner className="w-5 h-5" />
          ) : (
            isLogin ? 'Se connecter' : 'S\'inscrire'
          )}
        </button>
      </div>
    </form>
  );
}