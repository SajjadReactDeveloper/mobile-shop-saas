'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/auth'
import {
  LayoutDashboard, ShoppingCart, Package, Smartphone, Wrench,
  Users, Wallet, PhoneCall, BarChart3, LogOut, Menu, DollarSign,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/sales', icon: ShoppingCart, label: 'Sales / POS' },
  { href: '/dashboard/inventory', icon: Package, label: 'Inventory' },
  { href: '/dashboard/easy-load', icon: PhoneCall, label: 'Easy Load' },
  { href: '/dashboard/easypaisa', icon: Wallet, label: 'Easypaisa' },
  { href: '/dashboard/repairs', icon: Wrench, label: 'Repairs' },
  { href: '/dashboard/customers', icon: Users, label: 'Customers' },
  { href: '/dashboard/cash-register', icon: DollarSign, label: 'Cash Register' },
  { href: '/dashboard/reports', icon: BarChart3, label: 'Reports' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<{ shop?: { name?: string } } | null>(null)
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

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>
        <div className="flex items-center gap-2 p-4 border-b border-gray-200">
          <Smartphone className="w-6 h-6 text-blue-600" />
          <span className="font-bold text-gray-900">{user?.shop?.name ?? 'Mobile Shop'}</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-700">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-gray-900">Mobile Shop SaaS</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
