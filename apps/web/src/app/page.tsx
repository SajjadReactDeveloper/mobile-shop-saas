import Link from 'next/link'
import {
  ShoppingCart, Package, PhoneCall, Wallet,
  Wrench, Users, DollarSign, BarChart3,
  CheckCircle, Smartphone, Zap, Shield,
  MessageCircle, Mail, Globe,
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
            <div className="shrink-0 flex items-center justify-center lg:justify-end">
              {/* Glow */}
              <div className="relative">
                <div className="absolute inset-0 bg-violet-400/30 blur-3xl rounded-full scale-75 translate-y-8" />
                {/* Device shell */}
                <div className="relative w-56 h-[460px] bg-gray-900 rounded-[3rem] border-[5px] border-gray-700 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden">
                  {/* Dynamic island */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-10" />
                  {/* Status bar */}
                  <div className="h-10 bg-[#7c3aed] flex items-end justify-between px-5 pb-1.5 shrink-0">
                    <span className="text-[9px] text-white/80 font-semibold">9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="flex gap-0.5 items-end h-2.5">
                        {[40,60,80,100].map(h => <div key={h} style={{height:`${h}%`}} className="w-0.5 bg-white/80 rounded-full" />)}
                      </div>
                      <svg className="w-3 h-3 text-white/80" fill="currentColor" viewBox="0 0 24 24"><path d="M1.75 7A.75.75 0 0 1 1 6.25C1 3.35 3.35 1 6.25 1h11.5C20.65 1 23 3.35 23 6.25a.75.75 0 0 1-1.5 0C21.5 4.18 19.82 2.5 17.75 2.5H6.25C4.18 2.5 2.5 4.18 2.5 6.25A.75.75 0 0 1 1.75 7Z"/><path d="M12 22.5a10.5 10.5 0 1 0 0-21 10.5 10.5 0 0 0 0 21Z" opacity=".1"/></svg>
                    </div>
                  </div>

                  {/* Screen */}
                  <div className="flex-1 bg-[#f5f3ff] flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-[#7c3aed] px-4 pb-4 pt-1">
                      <div className="text-[9px] text-violet-200 font-medium">Good morning 👋</div>
                      <div className="text-[11px] text-white font-extrabold mt-0.5">Flowchat Dashboard</div>
                      {/* Revenue card */}
                      <div className="mt-3 bg-white/15 rounded-2xl p-3 backdrop-blur-sm">
                        <div className="text-[8px] text-violet-200 font-semibold uppercase tracking-wide">Today&apos;s Revenue</div>
                        <div className="text-[20px] font-extrabold text-white leading-tight">PKR 24,500</div>
                        <div className="text-[8px] text-green-300 mt-0.5">↑ 12% from yesterday</div>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-1.5 px-3 py-2 bg-white border-b border-gray-100">
                      {[['Sales','12','#7c3aed'],['Repairs','3','#f97316'],['Load','8','#2563eb']].map(([l,v,c]) => (
                        <div key={l} className="text-center py-1.5">
                          <div style={{color:c}} className="text-[13px] font-extrabold">{v}</div>
                          <div className="text-[8px] text-gray-400 font-medium">{l}</div>
                        </div>
                      ))}
                    </div>

                    {/* List items */}
                    <div className="flex-1 px-3 py-2 flex flex-col gap-1.5 overflow-hidden">
                      {[
                        { label: 'INV-00041', sub: 'Samsung A15 Cover', amt: '+PKR 200', color: '#16a34a' },
                        { label: 'JOB-00012', sub: 'iPhone 14 Screen',  amt: 'In Repair', color: '#f97316' },
                        { label: 'INV-00040', sub: 'Charger × 2',       amt: '+PKR 800', color: '#16a34a' },
                      ].map(item => (
                        <div key={item.label} className="bg-white rounded-xl px-3 py-2 flex items-center justify-between shadow-sm border border-gray-50">
                          <div>
                            <div className="text-[9px] font-bold text-gray-800 font-mono">{item.label}</div>
                            <div className="text-[8px] text-gray-400 mt-0.5">{item.sub}</div>
                          </div>
                          <span style={{color:item.color}} className="text-[9px] font-bold">{item.amt}</span>
                        </div>
                      ))}

                      {/* Barcode scanner */}
                      <div className="bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-50">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-4 h-4 bg-violet-100 rounded-lg flex items-center justify-center">
                            <Smartphone className="w-2.5 h-2.5 text-violet-600" />
                          </div>
                          <span className="text-[9px] font-bold text-gray-700">Scan Barcode / IMEI</span>
                        </div>
                        <div className="h-7 border border-dashed border-violet-300 rounded-lg flex items-center justify-center gap-0.5">
                          {[3,5,2,4,6,2,5,3,4,5,2,4].map((h,i) => (
                            <div key={i} style={{height:`${h*3}px`}} className="w-[2px] bg-violet-400 rounded-full" />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Tab bar */}
                    <div className="bg-white border-t border-gray-100 flex justify-around py-2 px-2">
                      {[['🏠','Home'],['🛒','POS'],['🔧','Repair'],['👤','More']].map(([icon,label],i) => (
                        <div key={label} className={`flex flex-col items-center gap-0.5 ${i===0?'opacity-100':'opacity-40'}`}>
                          <span className="text-[10px]">{icon}</span>
                          <span className={`text-[7px] font-semibold ${i===0?'text-violet-600':'text-gray-400'}`}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Home indicator */}
                  <div className="h-5 bg-gray-900 flex items-center justify-center shrink-0">
                    <div className="w-20 h-1 bg-gray-700 rounded-full" />
                  </div>
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
      <footer className="bg-gray-950 text-gray-400">
        {/* Main footer */}
        <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-900/40">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">Flowchat</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500 max-w-xs">
              Complete shop management for Pakistani mobile shops. Sales, inventory, repairs, easy load, udhaar — all in one place.
            </p>
            <div className="flex gap-3 mt-6">
              {[
                { icon: Globe,  href: '#' },
                { icon: Mail,   href: 'mailto:hello@flowchat.pk' },
              ].map(({ icon: Icon, href }) => (
                <a key={href} href={href} className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-violet-600 flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4 text-gray-400 hover:text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-5">Product</h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'POS & Sales',      href: '#' },
                { label: 'Inventory',         href: '#' },
                { label: 'Repair Jobs',       href: '#' },
                { label: 'Easy Load',         href: '#' },
                { label: 'Easypaisa',         href: '#' },
                { label: 'Reports',           href: '#' },
              ].map(l => (
                <li key={l.label}><Link href={l.href} className="hover:text-violet-400 transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-5">Company</h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'About',     href: '#' },
                { label: 'Pricing',   href: '#pricing' },
                { label: 'Blog',      href: '#' },
                { label: 'Contact',   href: 'mailto:hello@flowchat.pk' },
              ].map(l => (
                <li key={l.label}><Link href={l.href} className="hover:text-violet-400 transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Get Started */}
          <div>
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-5">Get Started</h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'Sign In',           href: '/auth/login' },
                { label: 'Create Free Shop',  href: '/auth/register' },
                { label: 'Android App',       href: '#' },
              ].map(l => (
                <li key={l.label}><Link href={l.href} className="hover:text-violet-400 transition-colors">{l.label}</Link></li>
              ))}
            </ul>
            <div className="mt-6 p-4 bg-gray-900 rounded-2xl border border-gray-800">
              <p className="text-xs text-gray-400 mb-2">Start free today</p>
              <Link href="/auth/register" className="block text-center text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl transition-colors">
                Create Free Account
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800">
          <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
            <span>© {new Date().getFullYear()} Flowchat. All rights reserved.</span>
            <div className="flex gap-5">
              <Link href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-gray-400 transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-gray-400 transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
