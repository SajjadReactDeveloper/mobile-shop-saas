'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Smartphone, Loader2, ArrowRight, Shield, Zap, Users } from 'lucide-react'
import { authApi, saveToken } from '@/lib/auth'
import { getApiError } from '@/lib/error'

const inputCls = 'w-full px-3.5 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-xl placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-400 transition-all duration-150'

const PERKS = [
  { icon: Zap,    label: '14-day free trial',        desc: 'No credit card required' },
  { icon: Shield, label: 'Full data isolation',       desc: 'Your data, fully private' },
  { icon: Users,  label: 'Invite your team',          desc: 'Add cashiers & technicians' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', shopName: '', city: '' })
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { const res = await authApi.register(form); saveToken(res.accessToken); router.push('/dashboard') }
    catch (err) { setError(getApiError(err, 'Registration failed')) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1.1fr]">
      {/* ── Left form panel ── */}
      <div className="flex items-center justify-center p-6 sm:p-10 bg-gray-50 min-h-screen">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
              <Smartphone className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
            </div>
            <span className="font-bold text-gray-900">Mobile Shop SaaS</span>
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Create your shop</h1>
          <p className="text-sm text-gray-500 mb-8">14-day free trial · No credit card required</p>

          {error && (
            <div className="mb-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Shop name */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Shop Name *</label>
              <input name="shopName" type="text" required value={form.shopName} onChange={handleChange}
                className={inputCls} placeholder="e.g. Ali Mobile, Rehman Phones" />
            </div>
            {/* Your name */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Your Name *</label>
              <input name="name" type="text" required value={form.name} onChange={handleChange}
                className={inputCls} placeholder="Full name" />
            </div>
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email *</label>
              <input name="email" type="email" required value={form.email} onChange={handleChange}
                className={inputCls} placeholder="you@email.com" />
            </div>
            {/* City + Password side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">City</label>
                <input name="city" type="text" value={form.city} onChange={handleChange}
                  className={inputCls} placeholder="Lahore" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password *</label>
                <input name="password" type="password" required minLength={8} value={form.password} onChange={handleChange}
                  className={inputCls} placeholder="Min 8 chars" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-violet-200 flex items-center justify-center gap-2 mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating shop…</> : <>Start Free Trial <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-violet-600 font-semibold hover:underline">Sign in →</Link>
          </p>

          <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
            By registering you agree to our terms of service. Your data is fully isolated and secure.
          </p>
        </div>
      </div>

      {/* ── Right brand panel ── */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-violet-600 via-purple-700 to-slate-900 p-12 overflow-hidden relative">
        {/* Decorative */}
        <div className="absolute top-20 right-0 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-0 w-80 h-80 rounded-full bg-violet-400/10 blur-3xl pointer-events-none" />

        {/* Tier card preview */}
        <div className="relative z-10">
          <div className="text-xs font-bold text-violet-200 uppercase tracking-widest mb-6">What you get for free</div>

          {PERKS.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/15 shrink-0">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">{label}</div>
                <div className="text-xs text-violet-200">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4 mb-8">
          {[
            { v: '8', l: 'modules built-in' },
            { v: 'PKR 0', l: 'to get started' },
            { v: '14', l: 'day free trial' },
          ].map(s => (
            <div key={s.l} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10">
              <div className="text-2xl font-extrabold text-white">{s.v}</div>
              <div className="text-xs text-violet-200 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Module chips */}
        <div className="relative z-10">
          <div className="text-xs font-semibold text-violet-300 mb-3">Everything included</div>
          <div className="flex flex-wrap gap-2">
            {['POS & Sales', 'Inventory', 'Easy Load', 'Easypaisa', 'Repairs', 'Customer Ledger', 'Cash Register', 'Reports'].map(m => (
              <span key={m} className="text-xs bg-white/10 text-white border border-white/15 px-3 py-1 rounded-full font-medium">{m}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
