'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { saveToken } from '@/lib/auth'

function CallbackHandler() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const token = params.get('token')
    if (token) {
      saveToken(token)
      router.replace('/dashboard')
    } else {
      router.replace('/auth/login?error=oauth_failed')
    }
  }, [params, router])

  return null
}

export default function AuthCallbackPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Signing you in...</p>
      <Suspense>
        <CallbackHandler />
      </Suspense>
    </main>
  )
}
