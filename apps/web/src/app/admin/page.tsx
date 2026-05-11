'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  Building2, Users, TrendingUp, DollarSign,
  CheckCircle, AlertTriangle, Clock, XCircle,
  Smartphone, BarChart3, RefreshCw,
} from 'lucide-react'
import { Card, Badge, StatsSkeleton, ListSkeleton, Alert } from '@/components/ui'

interface AdminStats {
  totalShops: number
  activeShops: number
  totalUsers: number
  mrr: number
  tierBreakdown: { FREE: number; PRO: number; BUSINESS: number }
  statusBreakdown: { TRIALING: number; ACTIVE: number; PAST_DUE: number; CANCELED: number }
}

interface ShopRow {
  id: string
  name: string
  city?: string
  ownerName: string
  subscriptionTier: string
  subscriptionStatus: string
  createdAt: string
  userCount: number
}

const TIER_COLOR: Record<string, 'gray' | 'blue' | 'purple' | 'violet'> = {
  FREE: 'gray', PRO: 'blue', BUSINESS: 'purple',
}
const STATUS_COLOR: Record<string, 'green' | 'yellow' | 'red' | 'gray'> = {
  TRIALING: 'yellow', ACTIVE: 'green', PAST_DUE: 'red', CANCELED: 'gray',
}
const STATUS_ICON: Record<string, React.ElementType> = {
  TRIALING: Clock, ACTIVE: CheckCircle, PAST_DUE: AlertTriangle, CANCELED: XCircle,
}

export default function AdminPage() {
  const router = useRouter()
  const [unauthorized, setUnauthorized] = useState(false)

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data),
    retry: false,
  })

  const { data: shops = [], isLoading: shopsLoading } = useQuery<ShopRow[]>({
    queryKey: ['admin-shops'],
    queryFn: () => api.get('/admin/shops').then(r => r.data),
    retry: false,
  })

  useEffect(() => {
    if (statsError) {
      const status = (statsError as { response?: { status?: number } }).response?.status
      if (status === 401 || status === 403) {
        setUnauthorized(true)
      }
    }
  }, [statsError])

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-100">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-sm text-gray-500 mb-6">This page is only accessible to platform administrators.</p>
          <button onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-200">
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const mrr = stats?.mrr ?? 0
  const tierBrk = stats?.tierBreakdown ?? { FREE: 0, PRO: 0, BUSINESS: 0 }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top bar */}
      <header className="border-b border-white/5 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm text-white">Mobile Shop SaaS</div>
            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Platform Admin</div>
          </div>
        </div>
        <button onClick={() => router.push('/dashboard')}
          className="text-xs text-slate-400 hover:text-white font-medium transition-colors flex items-center gap-1.5">
          ← Back to dashboard
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Platform Overview</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time SaaS metrics across all shops</p>
        </div>

        {statsError && !unauthorized && (
          <Alert variant="error">
            Could not load admin stats — make sure the /admin API endpoints are deployed.
          </Alert>
        )}

        {/* KPI cards */}
        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4 animate-pulse">
                <div className="w-10 h-10 bg-white/10 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-6 w-3/4 bg-white/10 rounded-lg" />
                  <div className="h-3 w-1/2 bg-white/10 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Building2, label: 'Total Shops', value: stats?.totalShops ?? 0, sub: `${stats?.activeShops ?? 0} active`, color: 'text-violet-400 bg-violet-400/10' },
              { icon: Users,     label: 'Total Users',  value: stats?.totalUsers ?? 0, sub: 'Across all shops', color: 'text-cyan-400 bg-cyan-400/10' },
              { icon: DollarSign, label: 'MRR',         value: `PKR ${mrr.toLocaleString()}`, sub: 'Monthly recurring', color: 'text-emerald-400 bg-emerald-400/10' },
              { icon: TrendingUp, label: 'Pro + Biz',   value: (tierBrk.PRO + tierBrk.BUSINESS), sub: 'Paying customers', color: 'text-purple-400 bg-purple-400/10' },
            ].map(({ icon: Icon, label, value, sub, color }) => (
              <div key={label} className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-extrabold text-white tracking-tight">{value}</div>
                <div className="text-sm font-medium text-slate-400 mt-1">{label}</div>
                <div className="text-xs text-slate-600 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tier breakdown */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-violet-400" /> Subscription Tiers
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Free', count: tierBrk.FREE, color: 'bg-slate-600', pct: stats.totalShops > 0 ? Math.round(tierBrk.FREE / stats.totalShops * 100) : 0 },
                  { label: 'Pro', count: tierBrk.PRO, color: 'bg-violet-500', pct: stats.totalShops > 0 ? Math.round(tierBrk.PRO / stats.totalShops * 100) : 0 },
                  { label: 'Business', count: tierBrk.BUSINESS, color: 'bg-purple-500', pct: stats.totalShops > 0 ? Math.round(tierBrk.BUSINESS / stats.totalShops * 100) : 0 },
                ].map(t => (
                  <div key={t.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-300 font-medium">{t.label}</span>
                      <span className="text-slate-400">{t.count} shops ({t.pct}%)</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${t.color} rounded-full transition-all duration-700`} style={{ width: `${t.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-cyan-400" /> Subscription Status
              </h2>
              <div className="space-y-2">
                {Object.entries(stats.statusBreakdown).map(([status, count]) => {
                  const Icon = STATUS_ICON[status] ?? CheckCircle
                  return (
                    <div key={status} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-300 font-medium capitalize">{status.toLowerCase().replace('_', ' ')}</span>
                      </div>
                      <span className="text-sm font-bold text-white">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Shops table */}
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-sm font-bold text-white">All Shops</h2>
          </div>
          {shopsLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 items-center animate-pulse">
                  <div className="w-9 h-9 bg-white/10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-white/10 rounded-lg" />
                    <div className="h-3 w-1/4 bg-white/10 rounded-lg" />
                  </div>
                  <div className="h-5 w-16 bg-white/10 rounded-full" />
                </div>
              ))}
            </div>
          ) : shops.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No shops found</div>
          ) : (
            <div className="divide-y divide-white/5">
              {shops.map(shop => {
                const StatusIcon = STATUS_ICON[shop.subscriptionStatus] ?? CheckCircle
                return (
                  <div key={shop.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-violet-300">{shop.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{shop.name}</div>
                      <div className="text-xs text-slate-500">{shop.ownerName}{shop.city ? ` · ${shop.city}` : ''} · {shop.userCount} user{shop.userCount !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color={TIER_COLOR[shop.subscriptionTier] ?? 'gray'}>{shop.subscriptionTier}</Badge>
                      <div className={`flex items-center gap-1 text-xs font-medium ${STATUS_COLOR[shop.subscriptionStatus] === 'green' ? 'text-emerald-400' : STATUS_COLOR[shop.subscriptionStatus] === 'yellow' ? 'text-yellow-400' : STATUS_COLOR[shop.subscriptionStatus] === 'red' ? 'text-red-400' : 'text-slate-500'}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {shop.subscriptionStatus.toLowerCase().replace('_', ' ')}
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 w-24 text-right shrink-0">
                      {new Date(shop.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
