'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/auth'
import { OnboardingTour } from '@/components/OnboardingTour'
import {
  LayoutDashboard, ShoppingCart, Package, Smartphone, Wrench,
  Users, Wallet, PhoneCall, BarChart3, LogOut, Menu, DollarSign,
  Settings, X,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',               icon: LayoutDashboard, label: 'Dashboard',     group: 'core' },
  { href: '/dashboard/sales',         icon: ShoppingCart,    label: 'Sales / POS',   group: 'core' },
  { href: '/dashboard/inventory',     icon: Package,         label: 'Inventory',     group: 'core' },
  { href: '/dashboard/customers',     icon: Users,           label: 'Customers',     group: 'core' },
  { href: '/dashboard/repairs',       icon: Wrench,          label: 'Repairs',       group: 'services' },
  { href: '/dashboard/easy-load',     icon: PhoneCall,       label: 'Easy Load',     group: 'services' },
  { href: '/dashboard/easypaisa',     icon: Wallet,          label: 'Easypaisa',     group: 'services' },
  { href: '/dashboard/cash-register', icon: DollarSign,      label: 'Cash Register', group: 'finance' },
  { href: '/dashboard/reports',       icon: BarChart3,       label: 'Reports',       group: 'finance' },
  { href: '/dashboard/settings',      icon: Settings,        label: 'Settings',      group: 'finance' },
]

const groups: { key: string; label: string }[] = [
  { key: 'core',     label: 'Core' },
  { key: 'services', label: 'Services' },
  { key: 'finance',  label: 'Finance' },
]

const tierColors: Record<string, string> = {
  FREE:     'bg-slate-700 text-slate-300',
  PRO:      'bg-violet-500/20 text-violet-300',
  BUSINESS: 'bg-violet-500/20 text-violet-300',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<{ name?: string; shop?: { name?: string; subscriptionTier?: string } } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    authApi.getMe()
      .then(setUser)
      .catch(() => router.push('/auth/login'))
  }, [router])

  const logout = () => {
    localStorage.removeItem('access_token')
    router.push('/auth/login')
  }

  const renderSidebar = () => (
    <aside className="flex flex-col h-full w-64 bg-slate-950 text-white select-none">

      {/* ── Brand ── */}
      <div className="px-4 py-4 flex items-center gap-3 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-900/40 shrink-0">
          <Smartphone className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-sm text-white truncate leading-tight">{user?.shop?.name ?? 'Mobile Shop'}</div>
          <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 inline-block tracking-wide ${tierColors[user?.shop?.subscriptionTier ?? 'FREE'] ?? tierColors.FREE}`}>
            {user?.shop?.subscriptionTier?.toUpperCase() ?? 'FREE'}
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 py-3 px-3 space-y-4 scrollbar-hide overflow-y-auto">
        {groups.map(group => {
          const items = navItems.filter(n => n.group === group.key)
          return (
            <div key={group.key}>
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.12em] px-2 mb-1.5">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {items.map(({ href, icon: Icon, label }) => {
                  const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setSidebarOpen(false)}
                      className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                        active
                          ? 'bg-violet-500/15 text-violet-300'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      {/* active left bar */}
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-400 rounded-full" />
                      )}
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                      <span className="flex-1 truncate">{label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* ── User ── */}
      <div className="p-3 border-t border-white/5 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.03]">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0 ring-1 ring-white/10">
            {(user?.name ?? 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">{user?.name ?? 'Owner'}</div>
            <div className="text-[10px] text-slate-500">Administrator</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* Desktop sidebar */}
      <div className="hidden lg:flex shrink-0">
        {renderSidebar()}
      </div>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden flex flex-col shadow-2xl">
            {renderSidebar()}
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-800 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-purple-700 rounded-lg flex items-center justify-center">
              <Smartphone className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">{user?.shop?.name ?? 'Mobile Shop'}</span>
          </div>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-800 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-5 lg:p-7 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        <OnboardingTour />
      </div>
    </div>
  )
}
