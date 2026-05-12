import Link from 'next/link'
import { MessageCircle, Globe, Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 text-gray-500">
      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand */}
        <div className="lg:col-span-1">
          <Link href="/" className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-violet-200">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl text-gray-900 tracking-tight">Flowchat</span>
          </Link>
          <p className="text-sm leading-relaxed text-gray-500 max-w-xs">
            Complete shop management for Pakistani mobile shops. Sales, inventory, repairs, easy load, udhaar — all in one place.
          </p>
          <div className="flex gap-3 mt-6">
            {[
              { icon: Globe, href: '/',                        label: 'Website' },
              { icon: Mail,  href: 'mailto:hello@flowchat.pk', label: 'Email'   },
            ].map(({ icon: Icon, href, label }) => (
              <a key={label} href={href} aria-label={label}
                className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-violet-600 flex items-center justify-center transition-colors group">
                <Icon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              </a>
            ))}
          </div>
        </div>

        {/* Product */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Product</h4>
          <ul className="space-y-3 text-sm">
            {[
              { label: 'POS & Sales',  href: '/#features' },
              { label: 'Inventory',    href: '/#features' },
              { label: 'Repair Jobs',  href: '/#features' },
              { label: 'Easy Load',    href: '/#features' },
              { label: 'Easypaisa',    href: '/#features' },
              { label: 'Reports',      href: '/#features' },
              { label: 'Android App',  href: '/#mobile'   },
            ].map(l => (
              <li key={l.label}>
                <Link href={l.href} className="text-gray-500 hover:text-violet-600 transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Company</h4>
          <ul className="space-y-3 text-sm">
            {[
              { label: 'About',    href: '/about'    },
              { label: 'Pricing',  href: '/#pricing' },
              { label: 'Blog',     href: '/blog'     },
              { label: 'Contact',  href: '/contact'  },
              { label: 'Support',  href: '/support'  },
            ].map(l => (
              <li key={l.label}>
                <Link href={l.href} className="text-gray-500 hover:text-violet-600 transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Get Started */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Get Started</h4>
          <ul className="space-y-3 text-sm mb-8">
            {[
              { label: 'Sign In',          href: '/auth/login'    },
              { label: 'Create Free Shop', href: '/auth/register' },
              { label: 'Privacy Policy',   href: '/privacy'       },
              { label: 'Terms of Service', href: '/terms'         },
            ].map(l => (
              <li key={l.label}>
                <Link href={l.href} className="text-gray-500 hover:text-violet-600 transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>

          <Link href="/auth/register"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors shadow-md shadow-violet-200">
            Start Free — No card required →
          </Link>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <span>© {new Date().getFullYear()} Flowchat. All rights reserved.</span>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-violet-600 transition-colors">Privacy Policy</Link>
            <Link href="/terms"   className="hover:text-violet-600 transition-colors">Terms of Service</Link>
            <Link href="/support" className="hover:text-violet-600 transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
