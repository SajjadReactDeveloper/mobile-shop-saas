import { Shield } from 'lucide-react'
import { LandingNav } from '@/components/LandingNav'
import { Footer } from '@/components/Footer'

const sections = [
  {
    title: '1. Information We Collect',
    body: `When you create a Flowchat account we collect your name, email address, phone number, and shop name. During normal use we collect transactional data you enter — sales, inventory, repairs, easy load, Easypaisa transactions, and customer records. We also collect standard server logs (IP address, browser type, timestamps) for security and debugging purposes.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `Your data is used exclusively to operate and improve the Flowchat platform. This includes: displaying your shop's data back to you and your authorised staff, sending WhatsApp notifications you explicitly trigger (repair ready, udhaar reminders), sending transactional emails (receipts, password reset), and diagnosing errors. We do not sell, rent, or share your personal data with third parties for marketing purposes.`,
  },
  {
    title: '3. Multi-Tenant Data Isolation',
    body: `Flowchat is a multi-tenant platform. Every database record is tagged with your shop's unique identifier. Our application middleware enforces that every query is scoped to your shop only. No other shop can access your data, and you cannot access theirs. This isolation is enforced at the application layer on every API request.`,
  },
  {
    title: '4. Data Storage and Security',
    body: `Your data is stored on Neon PostgreSQL, a serverless Postgres platform with encryption at rest and in transit (TLS 1.2+). Backups are taken automatically. Uploaded files (repair photos, receipts) are stored on Cloudinary with access-controlled URLs. Passwords are hashed using bcrypt and are never stored in plain text.`,
  },
  {
    title: '5. Third-Party Services',
    body: `Flowchat uses a small number of trusted third-party services to operate: Neon (database hosting), Cloudinary (file storage), Stripe (payment processing for subscriptions), and Meta Graph API (WhatsApp notifications). Each of these services processes only the minimum data necessary and is governed by their own privacy policies.`,
  },
  {
    title: '6. Data Retention',
    body: `Your data is retained for as long as your account is active. If you cancel your subscription and request deletion, we will delete your shop data within 30 days. Backups are purged within 60 days. Some anonymised aggregate statistics may be retained for product analytics.`,
  },
  {
    title: '7. Your Rights',
    body: `You have the right to: access all data we hold about your shop (via the Reports module or by contacting us), request correction of inaccurate data, request deletion of your account and all associated data, and export your data in CSV format. To exercise any of these rights, email us at hello@flowchat.pk.`,
  },
  {
    title: '8. Cookies',
    body: `Flowchat uses cookies only for authentication (JWT session token stored in an httpOnly cookie) and user preferences. We do not use advertising or tracking cookies. Our mobile app does not use cookies.`,
  },
  {
    title: '9. Changes to This Policy',
    body: `We may update this policy as the product evolves. When we make material changes, we will notify you by email and display an in-app banner at least 14 days before the change takes effect.`,
  },
  {
    title: '10. Contact',
    body: `If you have any questions about this policy or how your data is handled, contact us at hello@flowchat.pk. We will respond within 2 business days.`,
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LandingNav />

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <Shield className="w-3.5 h-3.5" /> Privacy Policy
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
          Your data. Your shop. Your privacy.
        </h1>
        <p className="mt-4 text-gray-500 text-sm">Last updated: May 12, 2026</p>
      </section>

      {/* Content */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <div className="bg-gray-50 rounded-3xl p-10 space-y-8">
          {sections.map(s => (
            <div key={s.title}>
              <h2 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}
