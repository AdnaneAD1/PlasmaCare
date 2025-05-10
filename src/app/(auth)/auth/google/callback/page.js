'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/auth'

export default function GoogleCallback() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { handleGoogleCallback } = useAuth({
    middleware: 'guest',
    redirectIfAuthenticated: '/dashboard',
  })

  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      ;(async () => {
        const success = await handleGoogleCallback(code)
        if (success) {
          router.push('/dashboard')
        }
      })()
    }
  }, [searchParams, handleGoogleCallback, router])

  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Connexion en cours...</h2>
            <p className="mt-2 text-gray-600">Veuillez patienter pendant que nous vous connectons avec Google.</p>
          </div>
        </div>
      </div>
    </Suspense>
  )
}