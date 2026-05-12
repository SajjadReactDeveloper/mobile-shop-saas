'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Smartphone, Loader2, CheckCircle, ArrowRight } from 'lucide-react'
import { authApi, saveToken } from '@/lib/auth'
import { getApiError } from '@/lib/error'

const FEATURES = [
  'Point of Sale with IMEI tracking',
  'Easy Load & Easypaisa management',
  'Repair job cards with WhatsApp alerts',
  'Customer udhaar (credit) ledger',
  'Daily cash register & P&L reports',
]

const inputCls = 'w-full px-3.5 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-xl placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-400 transition-all duration-150 disabled:bg-gray-50 disabled:opacity-60'

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'email' | 'phone'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { const res = await authApi.login({ email, password }); saveToken(res.accessToken); router.push('/dashboard') }
    catch (err) { setError(getApiError(err, 'Login failed')) }
    finally { setLoading(false) }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await authApi.sendOtp(phone); setOtpSent(true) }
    catch (err) { setError(getApiError(err, 'Failed to send OTP')) }
    finally { setLoading(false) }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { const res = await authApi.verifyOtp(phone, otp); saveToken(res.accessToken); router.push('/dashboard') }
    catch (err) { setError(getApiError(err, 'Invalid OTP')) }
    finally { setLoading(false) }
  }

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/auth/google`
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 p-12 overflow-hidden relative">
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">Flowchat</span>
        </div>

        {/* Main content */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-violet-500/15 border border-violet-500/25 text-violet-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Built for Pakistani mobile shops
          </div>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Run your shop<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-300">without the headache</span>
          </h2>
          <p className="text-slate-400 mb-8 text-sm leading-relaxed max-w-sm">
            The all-in-one management platform built for how Pakistani shops actually work.
          </p>
          <ul className="space-y-3">
            {FEATURES.map(f => (
              <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
                <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-3 h-3 text-violet-400" />
                </div>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
          <p className="text-sm text-slate-300 italic leading-relaxed">
            &quot;Finally a system that understands how a mobile shop actually works in Pakistan.&quot;
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-xs font-bold text-white">A</div>
            <div>
              <div className="text-xs font-semibold text-white">Ahmad Raza</div>
              <div className="text-[10px] text-slate-500">Shop owner, Lahore</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex items-center justify-center p-6 sm:p-10 bg-gray-50 min-h-screen">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">Flowchat</span>
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 mb-8">Sign in to your shop dashboard</p>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm mb-5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center"><span className="px-3 bg-gray-50 text-xs text-gray-400 font-medium">or continue with</span></div>
          </div>

          {/* Method tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
            {(['email', 'phone'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); setOtpSent(false) }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-150 capitalize ${tab === t ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}>
                {t === 'phone' ? 'Phone OTP' : 'Email'}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <span>{error}</span>
            </div>
          )}

          {tab === 'email' ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputCls} placeholder="you@shop.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className={inputCls} placeholder="••••••••" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-violet-200 flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone number</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required disabled={otpSent} className={inputCls} placeholder="+923001234567" />
              </div>
              {otpSent && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">6-digit OTP</label>
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required maxLength={6} className={`${inputCls} tracking-[0.3em] font-mono text-center text-lg`} placeholder="——————" />
                  <button type="button" onClick={() => setOtpSent(false)} className="text-xs text-violet-600 hover:underline mt-1.5 block">← Change number</button>
                </div>
              )}
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-violet-200 flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Please wait…</> : otpSent ? <>Verify OTP <ArrowRight className="w-4 h-4" /></> : <>Send OTP <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            No account?{' '}
            <Link href="/auth/register" className="text-violet-600 font-semibold hover:underline">Start free trial →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
