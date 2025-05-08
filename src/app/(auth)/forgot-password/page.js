'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { AuthLogo } from '../../../components/ui/AuthLogo'
import { useAuth } from '@/hooks/auth'
import { translateStatus } from '@/hooks/auth'
import AuthSessionStatus from '@/app/(auth)/AuthSessionStatus'
import { LoadingButton } from '@/components/ui/LoadingButton'

export default function ForgotPassword() {
  const { forgotPassword } = useAuth({
    middleware: 'guest',
    redirectIfAuthenticated: '/dashboard',
  })

  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState([])
  const [status, setStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const submitForm = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await forgotPassword({
        email,
        setErrors,
        setStatus: (message) => setStatus(translateStatus(message)),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="inline-block">
            <AuthLogo />
          </Link>
        </div>

        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Réinitialisation du mot de passe
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Ou{' '}
          <Link href="/login" className="text-primary hover:text-primary/80">
            retourner à la connexion
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm rounded-lg sm:px-10">
          <div className="mb-4 text-sm text-gray-600">
            Vous avez oublié votre mot de passe ? Pas de problème. Indiquez-nous simplement votre adresse e-mail et nous vous enverrons un lien de réinitialisation qui vous permettra d&apos;en choisir un nouveau.
          </div>

          <AuthSessionStatus className="mb-4" status={status} />

          <form className="space-y-6" onSubmit={submitForm}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Adresse email
              </label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
              {errors.email && (
                <div className="mt-1 text-sm text-red-600">{errors.email[0]}</div>
              )}
            </div>

            <div>
              <LoadingButton type="submit" className="w-full" isLoading={isLoading}>
                Envoyer le lien de réinitialisation
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
