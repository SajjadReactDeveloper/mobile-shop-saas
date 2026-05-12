import { FileText } from 'lucide-react'
import { LandingNav } from '@/components/LandingNav'
import { Footer } from '@/components/Footer'

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: `By creating a Flowchat account or using any part of the Flowchat platform (web dashboard, Android app, or API), you agree to these Terms of Service. If you do not agree, do not use the service. These terms apply to all users including shop owners, cashiers, and technicians.`,
  },
  {
    title: '2. Description of Service',
    body: `Flowchat is a cloud-based shop management platform designed for Pakistani mobile shops. It includes modules for point of sale, inventory, easy load tracking, Easypaisa/JazzCash management, repair job tracking, customer ledger, daily cash register, and reporting. The service is provided on a subscription basis with a free trial period.`,
  },
  {
    title: '3. Account Registration',
    body: `You must provide accurate information when registering. Each shop requires one owner account. The owner is responsible for all activity under their shop, including that of invited staff members. You are responsible for keeping your credentials secure. You must be at least 18 years old to create an account.`,
  },
  {
    title: '4. Subscription and Billing',
    body: `Flowchat offers a 14-day free trial — no credit card required. After the trial, a paid subscription is required to continue using the platform. Subscriptions are billed monthly or annually via Stripe. Prices are shown in Pakistani Rupees (PKR) and exclude any applicable taxes. Subscriptions automatically renew unless cancelled before the renewal date.`,
  },
  {
    title: '5. Cancellation and Refunds',
    body: `You may cancel your subscription at any time from your account settings. Your access continues until the end of the current billing period. We do not offer refunds for partial months. If you cancel within 48 hours of a charge due to a genuine billing error, contact us for a review.`,
  },
  {
    title: '6. Acceptable Use',
    body: `You agree not to use Flowchat for any unlawful purpose, to process transactions that violate Pakistani law, to attempt to gain unauthorized access to other shops' data, to reverse-engineer or copy the platform, or to resell access to the platform without our written permission.`,
  },
  {
    title: '7. Data Ownership',
    body: `All data you enter into Flowchat — products, sales, customers, repair jobs, and all other records — remains yours. We claim no ownership over your shop's data. You may export your data at any time. We act as a data processor on your behalf and handle your data in accordance with our Privacy Policy.`,
  },
  {
    title: '8. Service Availability',
    body: `We aim for 99.9% uptime but cannot guarantee uninterrupted access. Maintenance windows, infrastructure issues, or events beyond our control may cause temporary unavailability. We will notify you of planned maintenance in advance wherever possible.`,
  },
  {
    title: '9. Limitation of Liability',
    body: `Flowchat is provided "as is." We are not liable for any loss of profit, loss of data, or indirect damages arising from your use of the platform. Our total liability for any claim is limited to the amount you paid us in the three months preceding the claim.`,
  },
  {
    title: '10. Changes to Terms',
    body: `We may update these terms as the product evolves. We will notify you by email at least 14 days before material changes take effect. Continued use of the platform after the effective date constitutes acceptance of the updated terms.`,
  },
  {
    title: '11. Governing Law',
    body: `These terms are governed by the laws of Pakistan. Any disputes shall be resolved in the courts of Lahore, Pakistan.`,
  },
  {
    title: '12. Contact',
    body: `For any questions about these terms, email us at hello@flowchat.pk.`,
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LandingNav />

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <FileText className="w-3.5 h-3.5" /> Terms of Service
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
          Clear terms, no surprises
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
