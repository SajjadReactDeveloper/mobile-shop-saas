'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/auth'
import {
  LayoutDashboard, ShoppingCart, Package, Smartphone, Wrench,
  Users, Wallet, PhoneCall, BarChart3, LogOut, Menu, DollarSign,
  Settings, X, ChevronRight,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',               icon: LayoutDashboard, label: 'Dashboard',     group: 'main' },
  { href: '/dashboard/sales',         icon: ShoppingCart,    label: 'Sales / POS',   group: 'main' },
  { href: '/dashboard/inventory',     icon: Package,         label: 'Inventory',     group: 'main' },
  { href: '/dashboard/customers',     icon: Users,           label: 'Customers',     group: 'main' },
  { href: '/dashboard/repairs',       icon: Wrench,          label: 'Repairs',       group: 'services' },
  { href: '/dashboard/easy-load',     icon: PhoneCall,       label: 'Easy Load',     group: 'services' },
  { href: '/dashboard/easypaisa',     icon: Wallet,          label: 'Easypaisa',     group: 'services' },
  { href: '/dashboard/cash-register', icon: DollarSign,      label: 'Cash Register', group: 'finance' },
  { href: '/dashboard/reports',       icon: BarChart3,       label: 'Reports',       group: 'finance' },
  { href: '/dashboard/settings',      icon: Settings,        label: 'Settings',      group: 'finance' },
]

const groups: { key: string; label: string }[] = [
  { key: 'main',     label: 'Core' },
  { key: 'services', label: 'Services' },
  { key: 'finance',  label: 'Finance' },
]

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
    <aside className="flex flex-col h-full w-64 bg-slate-900 text-white">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
          <Smartphone className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-sm text-white truncate">{user?.shop?.name ?? 'Mobile Shop'}</div>
          <div className="text-xs text-slate-400 capitalize">{user?.shop?.subscriptionTier?.toLowerCase() ?? 'free'} plan</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {groups.map(group => {
          const items = navItems.filter(n => n.group === group.key)
          return (
            <div key={group.key}>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-1">{group.label}</div>
              <div className="space-y-0.5">
                {items.map(({ href, icon: Icon, label }) => {
                  const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1">{label}</span>
                      {active && <ChevronRight className="w-3 h-3 opacity-60" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1">
          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
            {(user?.name ?? 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{user?.name ?? 'Owner'}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex shrink-0">
        {renderSidebar()}
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden flex flex-col">
            {renderSidebar()}
          </div>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-700 p-1">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Smartphone className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">{user?.shop?.name ?? 'Mobile Shop'}</span>
          </div>
          {sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-gray-700 p-1">
              <X className="w-5 h-5" />
            </button>
          )}
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-5">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
