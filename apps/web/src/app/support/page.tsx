import Link from 'next/link'
import { MessageCircle, Search, ChevronDown, Zap, Package, Wrench, Users, DollarSign, BarChart2 } from 'lucide-react'
import { LandingNav } from '@/components/LandingNav'
import { Footer } from '@/components/Footer'

const categories = [
  { icon: Zap,        label: 'Easy Load',       color: 'bg-green-50 text-green-600'   },
  { icon: Package,    label: 'Inventory & POS',  color: 'bg-blue-50 text-blue-600'     },
  { icon: Wrench,     label: 'Repairs',          color: 'bg-rose-50 text-rose-600'     },
  { icon: Users,      label: 'Udhaar / Ledger',  color: 'bg-amber-50 text-amber-600'   },
  { icon: DollarSign, label: 'Cash Register',    color: 'bg-violet-50 text-violet-600' },
  { icon: BarChart2,  label: 'Reports',          color: 'bg-indigo-50 text-indigo-600' },
]

const faqs = [
  {
    q: 'How do I add a new product to my inventory?',
    a: 'Go to Inventory → Products → tap the + button. Enter the product name, category, buying price, and selling price. For mobiles, enable IMEI tracking so each unit is tracked individually.',
  },
  {
    q: 'My easy load balance is wrong. How do I correct it?',
    a: 'Go to Easy Load → select the SIM account → tap "Adjust Balance." You can set the correct balance and add a note explaining the adjustment. This does not affect profit calculations for past transactions.',
  },
  {
    q: 'How do I mark a repair job as ready for pickup?',
    a: 'Open the repair job → tap "Update Status" → select "Ready." If the customer has a phone number on file and you have WhatsApp notifications enabled, they will automatically receive a message.',
  },
  {
    q: 'Can multiple staff members log in at the same time?',
    a: 'Yes. On the Pro and Business plans, you can invite staff with specific roles (cashier, technician). Each person has their own login. All actions are tagged with the user who performed them.',
  },
  {
    q: 'How do I record a credit sale (udhaar)?',
    a: 'During checkout in the POS, select "Udhaar" as the payment method. The amount is added to that customer\'s outstanding balance automatically. You can view and collect it from the Customer Ledger module.',
  },
  {
    q: 'I accidentally closed the cash register. Can I reopen it?',
    a: 'The owner account can reopen a closed cash register session from the Cash Register settings. Staff with the cashier role cannot reopen closed sessions — this is by design to protect the end-of-day record.',
  },
  {
    q: 'How does the Android app sync with the web dashboard?',
    a: 'Both use the same backend API and sync in real time via WebSockets. A sale made on the Android app appears on the web dashboard instantly, and vice versa. No manual sync is needed.',
  },
  {
    q: 'How do I cancel my subscription?',
    a: 'Go to Settings → Subscription → Cancel Plan. Your access continues until the end of the current billing period. You can export all your data before or after cancelling.',
  },
]

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LandingNav />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <MessageCircle className="w-3.5 h-3.5" /> Support Center
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
          How can we help?
        </h1>
        <p className="mt-5 text-xl text-gray-500 max-w-xl mx-auto leading-relaxed">
          Browse common questions or reach out — we usually reply within a few hours.
        </p>

        {/* Search (decorative for now) */}
        <div className="mt-8 max-w-lg mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search for help…"
            className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 shadow-sm transition"
          />
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-16">
          {categories.map(cat => (
            <div key={cat.label} className="border border-gray-100 rounded-2xl p-5 hover:border-violet-200 hover:shadow-sm transition-all cursor-pointer group">
              <div className={`w-10 h-10 ${cat.color} rounded-xl flex items-center justify-center mb-3`}>
                <cat.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-gray-900 group-hover:text-violet-700 transition-colors">{cat.label}</span>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently asked questions</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details key={i} className="group border border-gray-100 rounded-2xl overflow-hidden">
              <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none select-none hover:bg-gray-50 transition-colors">
                <span className="font-semibold text-gray-900 text-sm leading-snug">{faq.q}</span>
                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                {faq.a}
              </div>
            </details>
          ))}
        </div>

        {/* Still need help */}
        <div className="mt-14 bg-gray-50 rounded-3xl p-10 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Still need help?</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Our support team is available 9am–9pm PKT, Monday to Saturday.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 py-3.5 rounded-xl transition-colors shadow-lg shadow-violet-200 text-sm"
            >
              <MessageCircle className="w-4 h-4" /> Send us a message
            </Link>
            <a
              href="mailto:hello@flowchat.pk"
              className="inline-flex items-center justify-center gap-2 border border-gray-200 bg-white hover:border-violet-300 text-gray-700 font-semibold px-6 py-3.5 rounded-xl transition-colors text-sm"
            >
              hello@flowchat.pk
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
