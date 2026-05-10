import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">Mobile Shop SaaS</h1>
        <p className="text-xl text-gray-600">
          Complete automation for mobile shops — sales, easy load, repairs, Easypaisa &amp; more.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="px-6 py-3 border border-gray-300 text-gray-900 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Start Free Trial
          </Link>
        </div>
      </div>
    </main>
  )
}
