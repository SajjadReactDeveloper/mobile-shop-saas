'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Smartphone, Menu, X } from 'lucide-react'

export function LandingNav() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur z-40">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Smartphone className="w-6 h-6 text-violet-600" />
          <span className="font-bold text-lg">Mobile Shop SaaS</span>
        </div>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="text-sm bg-violet-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors"
          >
            Start Free Trial
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-6 py-4 flex flex-col gap-3">
          <Link
            href="/auth/login"
            onClick={() => setOpen(false)}
            className="text-sm font-medium text-gray-700 hover:text-violet-600 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            onClick={() => setOpen(false)}
            className="text-sm bg-violet-600 text-white font-semibold px-4 py-3 rounded-lg hover:bg-violet-700 transition-colors text-center"
          >
            Start Free Trial
          </Link>
        </div>
      )}
    </nav>
  )
}
