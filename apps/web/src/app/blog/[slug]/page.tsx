import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Clock, Calendar, ArrowRight } from 'lucide-react'
import { LandingNav } from '@/components/LandingNav'
import { Footer } from '@/components/Footer'
import { posts, getPost } from '@/lib/blog-posts'

export function generateStaticParams() {
  return posts.map(p => ({ slug: p.slug }))
}

interface Props {
  params: Promise<{ slug: string }>
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  const otherPosts = posts.filter(p => p.slug !== slug).slice(0, 3)

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LandingNav />

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-14 pb-10">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>

        <div className="flex items-center gap-3 mb-5">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${post.tagColor}`}>{post.tag}</span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar className="w-3 h-3" /> {post.date}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" /> {post.readTime}
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
          {post.title}
        </h1>
        <p className="text-xl text-gray-500 leading-relaxed mb-8">{post.excerpt}</p>

        {/* Author */}
        <div className="flex items-center gap-3 pt-6 border-t border-gray-100">
          <div className={`w-10 h-10 ${post.authorColor} rounded-xl flex items-center justify-center`}>
            <span className="text-white font-bold text-sm">{post.authorInitials}</span>
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">{post.author}</div>
            <div className="text-xs text-gray-400">Founder, Flowchat</div>
          </div>
        </div>
      </section>

      {/* Article body */}
      <article className="max-w-3xl mx-auto px-6 pb-16">
        <div className="prose prose-gray max-w-none">
          {post.sections.map((section, i) => (
            <div key={i} className="mb-8">
              {section.heading && (
                <h2 className="text-2xl font-bold text-gray-900 mb-3 mt-10 first:mt-0">
                  {section.heading}
                </h2>
              )}
              <p className="text-gray-600 leading-relaxed text-[17px]">{section.body}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14 bg-violet-600 rounded-3xl p-10 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Try Flowchat free for 14 days</h2>
          <p className="text-violet-200 text-sm mb-6">No credit card. No setup fee. Start in 2 minutes.</p>
          <Link href="/auth/register" className="inline-block bg-white text-violet-700 font-bold px-7 py-3.5 rounded-xl hover:bg-violet-50 transition-colors shadow-lg text-sm">
            Create Your Free Shop →
          </Link>
        </div>
      </article>

      {/* More posts */}
      {otherPosts.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">More articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {otherPosts.map(p => (
                <Link key={p.slug} href={`/blog/${p.slug}`}
                  className="group bg-white border border-gray-100 rounded-2xl p-6 hover:border-violet-200 hover:shadow-md transition-all">
                  <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${p.tagColor}`}>{p.tag}</span>
                  <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 group-hover:text-violet-700 transition-colors">
                    {p.title}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 mt-1">
                    Read <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
