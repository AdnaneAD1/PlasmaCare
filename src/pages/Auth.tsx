import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthForm } from '../components/auth/AuthForm';

export function Auth() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') === 'register' ? 'register' : 'login';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          {mode === 'login' ? 'Connexion' : 'Inscription'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <AuthForm mode={mode} />
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">
                  {mode === 'login' ? 'Nouveau sur PlasmaCare ?' : 'Déjà inscrit ?'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <a
                href={mode === 'login' ? '?mode=register' : '?mode=login'}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}