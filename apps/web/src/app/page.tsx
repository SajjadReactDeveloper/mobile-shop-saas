import Link from 'next/link'
import {
  ShoppingCart, Package, PhoneCall, Wallet,
  Wrench, Users, DollarSign, BarChart3,
  CheckCircle, Smartphone, Zap, Shield,
} from 'lucide-react'
import { LandingNav } from '@/components/LandingNav'

const features = [
  { icon: ShoppingCart, title: 'POS & Sales', desc: 'Fast cart-based POS with IMEI tracking, discount, all payment methods, and instant invoice.' },
  { icon: Package, title: 'Inventory', desc: 'Product catalog with IMEI tracking, low-stock alerts, and one-click stock top-up.' },
  { icon: PhoneCall, title: 'Easy Load', desc: 'Manage multiple SIM accounts per network. Track balance, profit, and daily load summary.' },
  { icon: Wallet, title: 'Easypaisa / JazzCash', desc: 'Agent wallet management with send, receive, cash-in, cash-out, and commission tracking.' },
  { icon: Wrench, title: 'Repair Jobs', desc: 'Job cards from intake to delivery. Status flow, parts tracking, WhatsApp alert on Ready.' },
  { icon: Users, title: 'Customer Ledger', desc: 'Customer profiles with full udhaar (credit) ledger, payment recording, and WhatsApp reminders.' },
  { icon: DollarSign, title: 'Cash Register', desc: 'Daily sessions with opening balance, expenses, and auto-calculated closing from all sources.' },
  { icon: BarChart3, title: 'Reports', desc: 'P&L overview, top products, receivables — filter by day, week, month, or custom range.' },
]

const tiers = [
  {
    name: 'Free',
    price: 'PKR 0',
    period: 'forever',
    features: ['1 user account', 'Basic POS & Inventory', 'Customer ledger', '—'],
    cta: 'Start Free',
    href: '/auth/register',
    highlight: false,
  },
  {
    name: 'Pro',
    price: 'PKR 1,999',
    period: 'per month',
    features: ['3 user accounts', 'All 8 modules', 'Easy Load & Easypaisa', 'WhatsApp alerts'],
    cta: 'Start 14-day Trial',
    href: '/auth/register',
    highlight: true,
  },
  {
    name: 'Business',
    price: 'PKR 4,999',
    period: 'per month',
    features: ['Unlimited users', 'All modules', 'Priority support', 'WhatsApp alerts'],
    cta: 'Contact Sales',
    href: '/auth/register',
    highlight: false,
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      <LandingNav />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <Zap className="w-3.5 h-3.5" /> Built for Pakistani mobile shops
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight max-w-3xl mx-auto">
          Run your mobile shop <span className="text-violet-600">without the headache</span>
        </h1>
        <p className="mt-6 text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Sales, inventory, easy load, Easypaisa, repairs, udhaar, and daily cash — all in one place.
          Built for how Pakistani shops actually work.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/register"
            className="px-8 py-4 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-colors text-base shadow-lg shadow-violet-200">
            Start Free — No card required
          </Link>
          <Link href="/auth/login"
            className="px-8 py-4 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-base">
            Sign In
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-400">14-day free trial · Cancel anytime</p>
      </section>

      {/* Feature strip — auto-scrolling marquee */}
      <section className="bg-gray-50 py-4 border-y border-gray-100 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap w-max">
          {[...Array(2)].flatMap(() =>
            ['IMEI Tracking', 'Easy Load', 'Easypaisa / JazzCash', 'Repair Job Cards', 'Udhaar Ledger', 'WhatsApp Alerts', 'Daily Cash Register', 'Stripe Billing', 'Multi-user Roles', 'Real-time Sync', 'Android App'].map(f => (
              <div key={f + Math.random()} className="flex items-center gap-2 text-sm text-gray-500 font-medium shrink-0 mx-8">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> {f}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900">Everything your shop needs</h2>
          <p className="text-gray-500 mt-3 text-lg">8 modules, one subscription, zero spreadsheets</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-violet-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section className="bg-violet-600 py-16">
        <div className="max-w-6xl mx-auto px-6 text-center text-white">
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-4xl font-extrabold">8</div>
              <div className="text-violet-200 text-sm mt-1">Modules built-in</div>
            </div>
            <div>
              <div className="text-4xl font-extrabold">PKR 0</div>
              <div className="text-violet-200 text-sm mt-1">To get started</div>
            </div>
            <div>
              <div className="text-4xl font-extrabold">14</div>
              <div className="text-violet-200 text-sm mt-1">Day free trial</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-20" id="pricing">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900">Simple, honest pricing</h2>
          <p className="text-gray-500 mt-3 text-lg">Start free. Upgrade when you need more users and modules.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {tiers.map(tier => (
            <div key={tier.name}
              className={`rounded-2xl border-2 p-8 flex flex-col gap-5 ${tier.highlight ? 'border-violet-500 shadow-xl shadow-violet-100 relative' : 'border-gray-200'}`}>
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <div>
                <div className="font-bold text-gray-900 text-lg">{tier.name}</div>
                <div className="mt-2">
                  <span className="text-3xl font-extrabold text-gray-900">{tier.price}</span>
                  <span className="text-gray-400 text-sm ml-1">/ {tier.period}</span>
                </div>
              </div>
              <ul className="space-y-3 flex-1">
                {tier.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    {f === '—'
                      ? <span className="w-4 h-4 text-gray-300">—</span>
                      : <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
                    {f !== '—' && f}
                  </li>
                ))}
              </ul>
              <Link href={tier.href}
                className={`text-center py-3 rounded-xl font-semibold text-sm transition-colors ${tier.highlight ? 'bg-violet-600 text-white hover:bg-violet-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="bg-gray-50 border-t border-gray-100 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <Shield className="w-8 h-8 text-violet-600" />
              <div className="font-semibold text-gray-900">Data Isolation</div>
              <p className="text-sm text-gray-500">Every shop&apos;s data is completely separate. No cross-tenant leaks — ever.</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Zap className="w-8 h-8 text-violet-600" />
              <div className="font-semibold text-gray-900">Always Available</div>
              <p className="text-sm text-gray-500">Hosted on Render + Vercel + Neon. 99.9% uptime with auto-scaling.</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Smartphone className="w-8 h-8 text-violet-600" />
              <div className="font-semibold text-gray-900">Web + Android</div>
              <p className="text-sm text-gray-500">Full-featured web dashboard plus an Android app for on-the-go access.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-3xl overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center gap-10 px-8 py-14 lg:px-16">
            {/* Text */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                <Smartphone className="w-3.5 h-3.5" /> Mobile App
              </div>
              <h2 className="text-3xl font-extrabold text-white leading-tight">
                Manage your shop<br className="hidden sm:block" /> from anywhere
              </h2>
              <p className="text-violet-200 mt-4 text-base leading-relaxed max-w-md mx-auto lg:mx-0">
                Full-featured Android app with barcode scanning, offline mode, and real-time sync. Everything from your web dashboard — in your pocket.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-violet-100 max-w-xs mx-auto lg:mx-0">
                {['Barcode scanner for IMEI & products', 'POS, Repairs, Easy Load on mobile', 'Real-time sync with web dashboard', 'Works on all Android phones'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-300 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {/* Store badges */}
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <a href="#" className="flex items-center gap-3 bg-black text-white px-5 py-3 rounded-2xl hover:bg-gray-900 transition-colors border border-white/10 group">
                  <svg className="w-7 h-7 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.41c1.39.07 2.36.74 3.17.8 1.21-.24 2.37-.93 3.67-.84 1.56.12 2.74.72 3.5 1.88-3.21 1.93-2.45 5.98.7 7.17-.52 1.34-1.15 2.66-3.04 3.86ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] text-gray-300 leading-none">Download on the</div>
                    <div className="text-sm font-bold leading-tight">App Store</div>
                  </div>
                </a>
                <a href="#" className="flex items-center gap-3 bg-black text-white px-5 py-3 rounded-2xl hover:bg-gray-900 transition-colors border border-white/10 group">
                  <svg className="w-7 h-7 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.18 23.76a2 2 0 0 1-.86-1.73V1.97A2 2 0 0 1 3.18.24l12.04 11.76-12.04 11.76ZM20.1 13.27l-2.76 1.61-2.95-2.88 2.95-2.88 2.78 1.63a1.54 1.54 0 0 1-.02 2.52ZM5.02 23.11 15.6 12.72 12.7 9.88 5.02 23.11ZM5.02.89l7.68 13.23 2.9-2.84L5.02.89Z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] text-gray-300 leading-none">Get it on</div>
                    <div className="text-sm font-bold leading-tight">Google Play</div>
                  </div>
                </a>
              </div>
              <p className="mt-3 text-xs text-violet-300">Android app available now · iOS coming soon</p>
            </div>

            {/* Phone mockup */}
            <div className="shrink-0 flex items-center justify-center">
              <div className="relative w-48 h-80 bg-gray-900 rounded-[2.5rem] border-4 border-white/20 shadow-2xl flex flex-col overflow-hidden">
                {/* Status bar */}
                <div className="h-6 bg-gray-800 flex items-center justify-center">
                  <div className="w-16 h-1.5 bg-gray-700 rounded-full" />
                </div>
                {/* Screen content */}
                <div className="flex-1 bg-[#faf9ff] p-3 flex flex-col gap-2">
                  <div className="bg-violet-600 rounded-xl p-3 text-white text-center">
                    <div className="text-[9px] font-semibold opacity-70">Today&apos;s Revenue</div>
                    <div className="text-base font-extrabold mt-0.5">PKR 24,500</div>
                  </div>
                  {[['Sales', '12', 'text-violet-600'], ['Repairs', '3', 'text-orange-500'], ['Easy Load', '8', 'text-blue-600']].map(([l, v, c]) => (
                    <div key={l} className="bg-white rounded-xl px-3 py-2 flex justify-between items-center shadow-sm">
                      <span className="text-[10px] font-medium text-gray-500">{l}</span>
                      <span className={`text-[10px] font-bold ${c}`}>{v} today</span>
                    </div>
                  ))}
                  <div className="bg-white rounded-xl px-3 py-2 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-3 h-3 bg-violet-100 rounded flex items-center justify-center">
                        <Smartphone className="w-2 h-2 text-violet-600" />
                      </div>
                      <span className="text-[9px] font-bold text-gray-700">Scan Barcode</span>
                    </div>
                    <div className="h-8 border border-dashed border-violet-300 rounded-lg flex items-center justify-center">
                      <span className="text-[8px] text-violet-400">[ ▌▌▐▌▌▌▐ ]</span>
                    </div>
                  </div>
                </div>
                {/* Home indicator */}
                <div className="h-5 bg-gray-800 flex items-center justify-center">
                  <div className="w-10 h-1 bg-gray-600 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900">Ready to run your shop smarter?</h2>
        <p className="text-gray-500 mt-3 text-lg">Set up in minutes. No training required.</p>
        <Link href="/auth/register"
          className="mt-8 inline-block px-10 py-4 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200 text-base">
          Create Your Free Shop
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-violet-600" />
            <span className="font-medium text-gray-600">Mobile Shop SaaS</span>
          </div>
          <div className="flex gap-6">
            <Link href="/auth/login" className="hover:text-gray-600">Sign In</Link>
            <Link href="/auth/register" className="hover:text-gray-600">Register</Link>
            <Link href="#pricing" className="hover:text-gray-600">Pricing</Link>
          </div>
          <span>© {new Date().getFullYear()} Mobile Shop SaaS</span>
        </div>
      </footer>
    </div>
  )
}
