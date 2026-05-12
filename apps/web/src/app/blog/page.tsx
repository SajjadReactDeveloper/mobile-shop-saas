import Link from 'next/link'
import { MessageCircle, BookOpen, ArrowRight } from 'lucide-react'
import { LandingNav } from '@/components/LandingNav'
import { Footer } from '@/components/Footer'
import { posts } from '@/lib/blog-posts'

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
        <div className="space-y-5">
          {posts.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`}
              className="group flex flex-col sm:flex-row gap-5 border border-gray-100 rounded-2xl p-7 hover:border-violet-200 hover:shadow-md transition-all">
              {/* Tag + meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${post.tagColor}`}>{post.tag}</span>
                  <span className="text-xs text-gray-400">{post.date}</span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-400">{post.readTime}</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-violet-700 transition-colors leading-snug">
                  {post.title}
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{post.excerpt}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 group-hover:gap-2.5 transition-all">
                  Read article <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
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
              className="flex-1 px-4 py-3 rounded-xl bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 border-0"
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
