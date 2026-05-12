import Link from 'next/link'
import { MessageCircle, Zap, Shield, Heart, Target } from 'lucide-react'
import { LandingNav } from '@/components/LandingNav'
import { Footer } from '@/components/Footer'

const values = [
  { icon: Heart,  title: 'Built with care',        desc: 'Every feature is designed around how Pakistani mobile shops actually work — not how a textbook says they should.' },
  { icon: Target, title: 'Focused on simplicity',  desc: 'No bloat. No training required. Open the app, start selling. That\'s the goal.' },
  { icon: Shield, title: 'Data you can trust',     desc: 'Your shop\'s data is yours. Multi-tenant isolation means no cross-shop leaks, ever.' },
  { icon: Zap,    title: 'Always improving',       desc: 'We ship updates every week based on real feedback from real shop owners.' },
]

const team = [
  { name: 'Sajjad Akhtar', role: 'Founder & CEO',      initials: 'SA', color: 'bg-violet-600' },
  { name: 'Dev Team',       role: 'Engineering',         initials: 'DT', color: 'bg-blue-600'   },
  { name: 'Support Team',   role: 'Customer Success',    initials: 'ST', color: 'bg-emerald-600' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LandingNav />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <MessageCircle className="w-3.5 h-3.5" /> About Flowchat
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
          We&apos;re building the OS<br />for Pakistani mobile shops
        </h1>
        <p className="mt-6 text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Flowchat started because every mobile shop owner we knew was running their business on paper, WhatsApp, and memory. We decided to fix that.
        </p>
      </section>

      {/* Story */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="bg-gray-50 rounded-3xl p-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-5">The story</h2>
          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p>
              Mobile shop owners in Pakistan manage an incredible amount of complexity every day — tracking IMEI numbers on paper, remembering who owes them money, manually calculating easy load profits, and trying to close the day without losing track of where the cash went.
            </p>
            <p>
              We built Flowchat to solve all of that in one place. Not a generic inventory system ported from somewhere else, but something designed ground-up for how Pakistani shops actually operate: with Jazz, Telenor, Zong, Ufone, and Warid. With udhaar. With repair jobs that go through five different statuses. With Easypaisa and JazzCash agent wallets.
            </p>
            <p>
              Today Flowchat is a complete 8-module platform — POS, inventory, easy load, Easypaisa, repairs, customer ledger, cash register, and reports. Available on web and Android, with real-time sync across all devices.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">What we believe in</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-violet-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">The people behind Flowchat</h2>
          <p className="text-gray-500 mt-3">A small, focused team shipping fast</p>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          {team.map(m => (
            <div key={m.name} className="flex flex-col items-center gap-3 p-6 bg-gray-50 rounded-2xl w-44 text-center">
              <div className={`w-14 h-14 ${m.color} rounded-2xl flex items-center justify-center`}>
                <span className="text-white font-extrabold text-lg">{m.initials}</span>
              </div>
              <div>
                <div className="font-bold text-gray-900 text-sm">{m.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-violet-600 py-16 text-center text-white">
        <h2 className="text-3xl font-bold mb-3">Ready to try it?</h2>
        <p className="text-violet-200 mb-8">Start free — no card required, no training needed.</p>
        <Link href="/auth/register" className="inline-block bg-white text-violet-700 font-bold px-8 py-4 rounded-xl hover:bg-violet-50 transition-colors shadow-lg">
          Create Your Free Shop
        </Link>
      </section>

      <Footer />
    </div>
  )
}
