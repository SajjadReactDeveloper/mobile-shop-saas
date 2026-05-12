import { MessageCircle, BookOpen, ArrowRight } from 'lucide-react'
import { LandingNav } from '@/components/LandingNav'
import { Footer } from '@/components/Footer'

const posts = [
  {
    slug: 'why-mobile-shops-need-imei-tracking',
    title: 'Why Every Mobile Shop Needs IMEI Tracking',
    excerpt: 'Selling a phone without logging its IMEI is one of the most common — and costly — mistakes in the mobile business. Here\'s how to fix it.',
    date: 'May 10, 2026',
    readTime: '4 min read',
    tag: 'Inventory',
    tagColor: 'bg-blue-50 text-blue-700',
  },
  {
    slug: 'easy-load-profit-guide',
    title: 'How to Maximize Easy Load Profit: A Complete Guide',
    excerpt: 'Most shop owners know their balance, but not their actual commission earned. We break down how to track per-network profit properly.',
    date: 'May 5, 2026',
    readTime: '6 min read',
    tag: 'Easy Load',
    tagColor: 'bg-green-50 text-green-700',
  },
  {
    slug: 'udhaar-management-tips',
    title: '5 Ways to Reduce Bad Udhaar in Your Shop',
    excerpt: 'Credit sales are a reality of the Pakistani market. But without a system, udhaar quietly eats your profit. Here\'s how to stay on top of it.',
    date: 'Apr 28, 2026',
    readTime: '5 min read',
    tag: 'Udhaar',
    tagColor: 'bg-amber-50 text-amber-700',
  },
  {
    slug: 'repair-job-workflow',
    title: 'Building a Repair Workflow That Customers Love',
    excerpt: 'A repair job that takes 2 days feels faster than one that takes 1 day — if you communicate better. Here\'s the status system we recommend.',
    date: 'Apr 20, 2026',
    readTime: '4 min read',
    tag: 'Repairs',
    tagColor: 'bg-rose-50 text-rose-700',
  },
  {
    slug: 'daily-cash-register-habit',
    title: 'The One Habit That Changes Your Shop: Closing Your Cash Register Daily',
    excerpt: 'Shop owners who close their cash register every day catch problems the same day. Those who don\'t discover them weeks later — or never.',
    date: 'Apr 12, 2026',
    readTime: '3 min read',
    tag: 'Cash Register',
    tagColor: 'bg-violet-50 text-violet-700',
  },
  {
    slug: 'easypaisa-jazzcash-agent-tips',
    title: 'Running an Easypaisa/JazzCash Agent Counter: What No One Tells You',
    excerpt: 'Float management, transaction limits, and daily balancing — the things that trip up new agents and how to handle them.',
    date: 'Apr 3, 2026',
    readTime: '7 min read',
    tag: 'Easypaisa',
    tagColor: 'bg-emerald-50 text-emerald-700',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LandingNav />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <BookOpen className="w-3.5 h-3.5" /> Flowchat Blog
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
          Guides for Pakistani<br />mobile shop owners
        </h1>
        <p className="mt-6 text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Practical tips on inventory, easy load, repairs, udhaar, and running a more profitable shop — written by people who understand your business.
        </p>
      </section>

      {/* Posts */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="space-y-6">
          {posts.map(post => (
            <article key={post.slug} className="group border border-gray-100 rounded-2xl p-7 hover:border-violet-200 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${post.tagColor}`}>{post.tag}</span>
                <span className="text-xs text-gray-400">{post.date}</span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-400">{post.readTime}</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-violet-700 transition-colors">
                {post.title}
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{post.excerpt}</p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 group-hover:gap-2.5 transition-all">
                Read article <ArrowRight className="w-4 h-4" />
              </span>
            </article>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-16 bg-violet-600 rounded-3xl p-10 text-center text-white">
          <MessageCircle className="w-8 h-8 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-bold mb-2">Get new guides in your inbox</h2>
          <p className="text-violet-200 mb-6 text-sm">No spam. One email per week, maximum.</p>
          <div className="flex gap-3 max-w-sm mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 py-3 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <button className="bg-white text-violet-700 font-bold px-5 py-3 rounded-xl hover:bg-violet-50 transition-colors text-sm whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
