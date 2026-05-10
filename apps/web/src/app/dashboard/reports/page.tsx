'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { BarChart3, TrendingUp, Package, Users, Loader2, Calendar } from 'lucide-react'

interface Overview {
  period: { from: string; to: string }
  sales: { count: number; revenue: number; cogs: number; grossProfit: number }
  repairs: { count: number; revenue: number }
  easyLoad: { count: number; profit: number }
  easypaisa: { count: number; commission: number }
  totalProfit: number
  inventoryValuation: number
}

interface TopProduct {
  id: string
  name: string
  qty: number
  revenue: number
}

interface Receivables {
  total: number
  customers: { id: string; name: string; phone?: string; balanceOwed: number }[]
}

type Range = 'today' | 'week' | 'month' | 'custom'

function getDateRange(range: Range, custom: { from: string; to: string }): { from: string; to: string } {
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  if (range === 'today') return { from: fmt(today), to: fmt(today) }
  if (range === 'week') {
    const start = new Date(today)
    start.setDate(today.getDate() - 6)
    return { from: fmt(start), to: fmt(today) }
  }
  if (range === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    return { from: fmt(start), to: fmt(today) }
  }
  return custom
}

function StatCard({ label, value, sub, color = 'text-gray-900', icon: Icon }: {
  label: string; value: string; sub?: string; color?: string; icon: React.ElementType
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

function ProfitBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-900">PKR {value.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const [range, setRange] = useState<Range>('month')
  const [custom, setCustom] = useState({ from: '', to: '' })

  const { from, to } = getDateRange(range, custom)
  const validCustom = range !== 'custom' || (custom.from && custom.to)

  const { data: overview, isLoading: ovLoading } = useQuery<Overview>({
    queryKey: ['report-overview', from, to],
    queryFn: () => api.get(`/reports/overview?from=${from}&to=${to}`).then(r => r.data),
    enabled: !!validCustom,
  })

  const { data: topProducts = [], isLoading: tpLoading } = useQuery<TopProduct[]>({
    queryKey: ['report-top-products', from, to],
    queryFn: () => api.get(`/reports/top-products?from=${from}&to=${to}`).then(r => r.data),
    enabled: !!validCustom,
  })

  const { data: receivables } = useQuery<Receivables>({
    queryKey: ['report-receivables'],
    queryFn: () => api.get('/reports/receivables').then(r => r.data),
  })

  const sources = overview ? [
    { label: 'Sales Profit', value: overview.sales.grossProfit, color: 'bg-blue-500' },
    { label: 'Repair Revenue', value: overview.repairs.revenue, color: 'bg-orange-400' },
    { label: 'Easy Load Profit', value: overview.easyLoad.profit, color: 'bg-green-500' },
    { label: 'Easypaisa Commission', value: overview.easypaisa.commission, color: 'bg-purple-500' },
  ] : []
  const maxSource = Math.max(...sources.map(s => s.value), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Profit & Loss overview</p>
        </div>

        {/* Range selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['today', 'week', 'month', 'custom'] as Range[]).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${range === r ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {r === 'week' ? 'Last 7 days' : r === 'month' ? 'This month' : r}
            </button>
          ))}
          {range === 'custom' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Calendar className="absolute left-2 top-2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input type="date" className="pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={custom.from} onChange={e => setCustom(c => ({ ...c, from: e.target.value }))} />
              </div>
              <span className="text-gray-400 text-xs">to</span>
              <div className="relative">
                <Calendar className="absolute left-2 top-2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input type="date" className="pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={custom.to} onChange={e => setCustom(c => ({ ...c, to: e.target.value }))} />
              </div>
            </div>
          )}
        </div>
      </div>

      {ovLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : overview ? (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={TrendingUp} label="Total Profit" value={`PKR ${overview.totalProfit.toLocaleString()}`} color="text-green-700" />
            <StatCard icon={BarChart3} label="Sales Revenue" value={`PKR ${overview.sales.revenue.toLocaleString()}`} sub={`${overview.sales.count} transactions`} />
            <StatCard icon={Package} label="Inventory Value" value={`PKR ${overview.inventoryValuation.toLocaleString()}`} sub="At buying price" />
            <StatCard icon={Users} label="Receivables" value={`PKR ${(receivables?.total ?? 0).toLocaleString()}`} sub={`${receivables?.customers.length ?? 0} customers`} color="text-red-600" />
          </div>

          {/* Profit breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Profit Breakdown</h2>
            <div className="space-y-3">
              {sources.map(s => (
                <ProfitBar key={s.label} label={s.label} value={s.value} max={maxSource} color={s.color} />
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xs text-gray-400">Sales COGS</div>
                <div className="text-sm font-semibold text-red-600">−PKR {overview.sales.cogs.toLocaleString()}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400">Easy Load txns</div>
                <div className="text-sm font-semibold text-gray-700">{overview.easyLoad.count}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400">Repairs done</div>
                <div className="text-sm font-semibold text-gray-700">{overview.repairs.count}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400">Easypaisa txns</div>
                <div className="text-sm font-semibold text-gray-700">{overview.easypaisa.count}</div>
              </div>
            </div>
          </div>

          {/* Top products */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Top Products by Revenue</h2>
            </div>
            {tpLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
            ) : topProducts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No sales in this period</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {topProducts.map((p, i) => {
                  const maxRev = topProducts[0]?.revenue ?? 1
                  const pct = Math.round((p.revenue / maxRev) * 100)
                  return (
                    <div key={p.id} className="px-5 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 w-5">#{i + 1}</span>
                          <span className="text-sm font-medium text-gray-800">{p.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">PKR {p.revenue.toLocaleString()}</div>
                          <div className="text-xs text-gray-400">{p.qty} sold</div>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden ml-7">
                        <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Receivables */}
          {receivables && receivables.customers.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">Outstanding Receivables</h2>
                <span className="text-sm font-bold text-red-600">PKR {receivables.total.toLocaleString()}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {receivables.customers.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{c.name}</div>
                      {c.phone && <div className="text-xs text-gray-400">{c.phone}</div>}
                    </div>
                    <div className="text-sm font-bold text-red-600">PKR {Number(c.balanceOwed).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
