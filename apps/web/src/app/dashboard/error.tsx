'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-5 shadow-inner border border-red-100">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-extrabold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">
        {error.message ?? 'An unexpected error occurred. Please try again or refresh the page.'}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-200"
        >
          <RefreshCw className="w-4 h-4" /> Try again
        </button>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
        >
          Go to Dashboard
        </button>
      </div>
      {error.digest && (
        <p className="text-xs text-gray-300 mt-5 font-mono">Error ID: {error.digest}</p>
      )}
    </div>
  )
}
