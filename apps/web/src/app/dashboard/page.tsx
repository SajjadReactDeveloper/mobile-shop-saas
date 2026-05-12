'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import Link from 'next/link'
import {
  Package, Users, Wrench, TrendingUp, AlertTriangle,
  ShoppingCart, PhoneCall, Wallet, DollarSign, ArrowRight,
} from 'lucide-react'
import { Stat, Card, Badge, DashboardSkeleton } from '@/components/ui'

export default function DashboardPage() {
  const today = new Date().toISOString().split('T')[0]

  const { data: stats } = useQuery({
    queryKey: ['shop-stats'],
    queryFn: () => api.get('/shop/stats').then((r) => r.data),
  })

  const { data: todaySummary, isLoading } = useQuery({
    queryKey: ['daily-summary', today],
    queryFn: () => api.get(`/sales/daily-summary?date=${today}`).then((r) => r.data),
  })

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => api.get('/inventory/low-stock').then((r) => r.data),
  })

  const { data: easyLoadSummary } = useQuery({
    queryKey: ['easy-load-summary', today],
    queryFn: () => api.get(`/easy-load/daily-summary?date=${today}`).then((r) => r.data),
  })

  const { data: pendingRepairs } = useQuery({
    queryKey: ['pending-repairs'],
    queryFn: () => api.get('/repairs?status=RECEIVED&status=IN_REPAIR&status=DIAGNOSING&status=AWAITING_PARTS').then((r) => r.data),
  })

  if (isLoading) return <DashboardSkeleton />

  const revenue = todaySummary?.totalRevenue ?? 0
  const profit  = todaySummary?.grossProfit ?? 0
  const sales   = todaySummary?.totalSales ?? 0

  const quickLinks = [
    { href: '/dashboard/sales',         icon: ShoppingCart, label: 'New Sale',      iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
    { href: '/dashboard/inventory',     icon: Package,      label: 'Add Product',   iconBg: 'bg-blue-50',   iconColor: 'text-blue-600'   },
    { href: '/dashboard/repairs',       icon: Wrench,       label: 'New Repair',    iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
    { href: '/dashboard/cash-register', icon: DollarSign,   label: 'Cash Register', iconBg: 'bg-emerald-50',iconColor: 'text-emerald-600'},
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Good {getGreeting()}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickLinks.map(({ href, icon: Icon, label, iconBg, iconColor }) => (
          <Link key={href} href={href}
            className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3.5 hover:border-gray-200 hover:shadow-sm transition-all group">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
          </Link>
        ))}
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Today's Revenue"
          value={`PKR ${revenue.toLocaleString()}`}
          sub={`${sales} transactions`}
          icon={TrendingUp}
          color="text-emerald-600 bg-emerald-50"
        />
        <Stat
          label="Today's Profit"
          value={`PKR ${profit.toLocaleString()}`}
          sub="Gross margin"
          icon={TrendingUp}
          color="text-violet-600 bg-violet-50"
        />
        <Stat
          label="Total Products"
          value={stats?.products ?? '—'}
          sub="In inventory"
          icon={Package}
          color="text-purple-600 bg-purple-50"
        />
        <Stat
          label="Customers"
          value={stats?.customers ?? '—'}
          sub="Registered"
          icon={Users}
          color="text-cyan-600 bg-cyan-50"
        />
      </div>

      {/* Low stock + Repairs row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Low stock */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">Low Stock</div>
                <div className="text-xs text-gray-500">{lowStock?.length ?? 0} items need restocking</div>
              </div>
            </div>
            <Link href="/dashboard/inventory" className="text-xs font-semibold text-violet-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {lowStock && lowStock.length > 0 ? (
            <div className="space-y-2">
              {lowStock.slice(0, 5).map((p: { id: string; name: string; stockQty: number; lowStockThreshold?: number }) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700 truncate">{p.name}</span>
                  <Badge color="yellow">{p.stockQty} left</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-gray-400">All products well stocked ✓</div>
          )}
        </Card>

        {/* Pending repairs */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                <Wrench className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">Active Repairs</div>
                <div className="text-xs text-gray-500">{pendingRepairs?.length ?? stats?.pendingRepairs ?? 0} jobs in progress</div>
              </div>
            </div>
            <Link href="/dashboard/repairs" className="text-xs font-semibold text-violet-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {pendingRepairs && pendingRepairs.length > 0 ? (
            <div className="space-y-2">
              {pendingRepairs.slice(0, 5).map((r: { id: string; customer?: { name: string }; deviceModel: string; status: string }) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="text-sm text-gray-700">{r.customer?.name ?? 'Walk-in'}</div>
                    <div className="text-xs text-gray-400">{r.deviceModel}</div>
                  </div>
                  <RepairBadge status={r.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-gray-400">No active repairs 🎉</div>
          )}
        </Card>
      </div>

      {/* Easy load summary */}
      {easyLoadSummary && easyLoadSummary.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                <PhoneCall className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">Easy Load — Today</div>
                <div className="text-xs text-gray-500">Balance per network</div>
              </div>
            </div>
            <Link href="/dashboard/easy-load" className="text-xs font-semibold text-violet-600 hover:underline flex items-center gap-1">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {easyLoadSummary.map((acc: { phoneNumber: string; network: string; currentBalance: number; totalProfit?: number }) => (
              <div key={acc.phoneNumber} className="bg-gray-50 rounded-xl p-3 text-center">
                <NetworkDot network={acc.network} />
                <div className="font-bold text-gray-900 text-sm mt-2">PKR {Number(acc.currentBalance).toLocaleString()}</div>
                {acc.totalProfit !== undefined && (
                  <div className="text-xs text-emerald-600 mt-0.5">+{acc.totalProfit} profit</div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Wallet quick view */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/customers" className="group">
          <Card className="hover:border-violet-200 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-cyan-50 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-cyan-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Udhaar Total</div>
                <div className="text-sm font-bold text-gray-900">PKR {(stats?.totalUdhaar ?? 0).toLocaleString()}</div>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/easypaisa" className="group">
          <Card className="hover:border-violet-200 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
                <Wallet className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Easypaisa</div>
                <div className="text-sm font-bold text-gray-900">Wallet</div>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/cash-register" className="group">
          <Card className="hover:border-violet-200 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Cash Register</div>
                <div className="text-sm font-bold text-gray-900">Daily Session</div>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/reports" className="group">
          <Card className="hover:border-violet-200 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Reports</div>
                <div className="text-sm font-bold text-gray-900">Analytics</div>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning 🌅'
  if (h < 17) return 'afternoon ☀️'
  return 'evening 🌙'
}

const REPAIR_STATUS_COLOR: Record<string, 'blue' | 'yellow' | 'orange' | 'purple' | 'green' | 'gray' | 'red'> = {
  RECEIVED: 'blue', DIAGNOSING: 'yellow', AWAITING_PARTS: 'orange',
  IN_REPAIR: 'purple', READY: 'green', DELIVERED: 'gray', CANCELLED: 'red',
}
const REPAIR_STATUS_LABEL: Record<string, string> = {
  RECEIVED: 'Received', DIAGNOSING: 'Diagnosing', AWAITING_PARTS: 'Awaiting Parts',
  IN_REPAIR: 'In Repair', READY: 'Ready', DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
}
function RepairBadge({ status }: { status: string }) {
  return <Badge color={REPAIR_STATUS_COLOR[status] ?? 'gray'}>{REPAIR_STATUS_LABEL[status] ?? status}</Badge>
}

const NET_COLORS: Record<string, string> = {
  JAZZ: 'bg-red-100 text-red-700', TELENOR: 'bg-blue-100 text-blue-700',
  ZONG: 'bg-purple-100 text-purple-700', UFONE: 'bg-green-100 text-green-700',
  WARID: 'bg-orange-100 text-orange-700',
}
function NetworkDot({ network }: { network: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${NET_COLORS[network] ?? 'bg-gray-100 text-gray-700'}`}>
      {network}
    </span>
  )
}
