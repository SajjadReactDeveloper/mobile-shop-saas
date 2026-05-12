'use client'

import { useState } from 'react'
import { MessageCircle, Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react'
import { LandingNav } from '@/components/LandingNav'
import { Footer } from '@/components/Footer'

const contactOptions = [
  {
    icon: Mail,
    title: 'Email us',
    desc: 'We reply within a few hours during business hours.',
    value: 'hello@flowchat.pk',
    href: 'mailto:hello@flowchat.pk',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Phone,
    title: 'WhatsApp',
    desc: 'Chat with us directly on WhatsApp.',
    value: '+92 300 0000000',
    href: 'https://wa.me/923000000000',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: MapPin,
    title: 'Based in',
    desc: 'We\'re a Pakistani team building for Pakistan.',
    value: 'Lahore, Pakistan',
    href: null,
    color: 'bg-violet-50 text-violet-600',
  },
]

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // In production this would POST to an API
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LandingNav />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <MessageCircle className="w-3.5 h-3.5" /> Contact Us
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
          We&apos;d love to hear<br />from you
        </h1>
        <p className="mt-6 text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Have a question, feature request, or just want to say salam? We&apos;re a small team and we read every message.
        </p>
      </section>

      {/* Contact options */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-16">
          {contactOptions.map(opt => (
            <div key={opt.title} className="border border-gray-100 rounded-2xl p-6">
              <div className={`w-10 h-10 ${opt.color} rounded-xl flex items-center justify-center mb-4`}>
                <opt.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{opt.title}</h3>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">{opt.desc}</p>
              {opt.href ? (
                <a href={opt.href} className="text-sm font-semibold text-violet-600 hover:text-violet-800 transition-colors">
                  {opt.value}
                </a>
              ) : (
                <span className="text-sm font-semibold text-gray-700">{opt.value}</span>
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-gray-50 rounded-3xl p-10">
          {sent ? (
            <div className="text-center py-10">
              <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Message sent!</h2>
              <p className="text-gray-500">We&apos;ll get back to you within a few hours. Check your email.</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-7">Send a message</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your name</label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Ahmad Ali"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject</label>
                  <input
                    required
                    type="text"
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder="How can we help?"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Tell us what's on your mind..."
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-7 py-3.5 rounded-xl transition-colors shadow-lg shadow-violet-200"
                >
                  <Send className="w-4 h-4" /> Send Message
                </button>
              </form>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
