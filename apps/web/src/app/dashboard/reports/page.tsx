'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { TrendingUp, Package, Users, Calendar } from 'lucide-react'
import { Card, Badge, PageHeader, PageLoader, Stat } from '@/components/ui'

interface Overview {
  period: { from: string; to: string }
  sales: { count: number; revenue: number; cogs: number; grossProfit: number }
  repairs: { count: number; revenue: number }
  easyLoad: { count: number; profit: number }
  easypaisa: { count: number; commission: number }
  totalProfit: number
  inventoryValuation: number
}
interface TopProduct { id: string; name: string; qty: number; revenue: number }
interface Receivables { total: number; customers: { id: string; name: string; phone?: string; balanceOwed: number }[] }
type Range = 'today' | 'week' | 'month' | 'custom'

function getDateRange(range: Range, custom: { from: string; to: string }) {
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  if (range === 'today') return { from: fmt(today), to: fmt(today) }
  if (range === 'week') { const s = new Date(today); s.setDate(today.getDate() - 6); return { from: fmt(s), to: fmt(today) } }
  if (range === 'month') return { from: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), to: fmt(today) }
  return custom
}

function ProfitBar({ label, value, max, color, count }: { label: string; value: number; max: number; color: string; count?: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
          <span className="text-gray-600">{label}</span>
          {count !== undefined && <span className="text-xs text-gray-400">({count})</span>}
        </div>
        <span className="font-bold text-gray-900">PKR {value.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const RANGE_LABELS: Record<Range, string> = {
  today: 'Today', week: 'Last 7 days', month: 'This month', custom: 'Custom',
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
    { label: 'Sales Profit',         value: overview.sales.grossProfit,    color: 'bg-blue-500',   count: overview.sales.count },
    { label: 'Repair Revenue',       value: overview.repairs.revenue,      color: 'bg-orange-400', count: overview.repairs.count },
    { label: 'Easy Load Profit',     value: overview.easyLoad.profit,      color: 'bg-emerald-500',count: overview.easyLoad.count },
    { label: 'Easypaisa Commission', value: overview.easypaisa.commission, color: 'bg-purple-500', count: overview.easypaisa.count },
  ] : []
  const maxSource = Math.max(...sources.map(s => s.value), 1)

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="P&L overview and analytics" />

      {/* Range selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(['today', 'week', 'month', 'custom'] as Range[]).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${range === r ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
        {range === 'custom' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input type="date" className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={custom.from} onChange={e => setCustom(c => ({ ...c, from: e.target.value }))} />
            </div>
            <span className="text-gray-400 text-sm">→</span>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input type="date" className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={custom.to} onChange={e => setCustom(c => ({ ...c, to: e.target.value }))} />
            </div>
          </div>
        )}
      </div>

      {ovLoading ? <PageLoader /> : overview ? (
        <>
          {/* KPI */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat icon={TrendingUp} label="Total Profit" value={`PKR ${overview.totalProfit.toLocaleString()}`} sub="All sources" color="text-emerald-600 bg-emerald-50" />
            <Stat icon={TrendingUp} label="Sales Revenue" value={`PKR ${overview.sales.revenue.toLocaleString()}`} sub={`${overview.sales.count} transactions`} color="text-blue-600 bg-blue-50" />
            <Stat icon={Package} label="Inventory Value" value={`PKR ${overview.inventoryValuation.toLocaleString()}`} sub="At buying price" color="text-purple-600 bg-purple-50" />
            <Stat icon={Users} label="Receivables" value={`PKR ${(receivables?.total ?? 0).toLocaleString()}`} sub={`${receivables?.customers.length ?? 0} customers`} color="text-red-600 bg-red-50" />
          </div>

          {/* Profit breakdown */}
          <Card>
            <h2 className="text-sm font-bold text-gray-900 mb-5">Profit by Source</h2>
            <div className="space-y-4">
              {sources.map(s => (
                <ProfitBar key={s.label} label={s.label} value={s.value} max={maxSource} color={s.color} count={s.count} />
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-400 mb-0.5">Cost of Goods Sold</div>
                <div className="text-sm font-bold text-red-600">−PKR {overview.sales.cogs.toLocaleString()}</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3">
                <div className="text-xs text-gray-400 mb-0.5">Gross Profit (Sales)</div>
                <div className="text-sm font-bold text-emerald-700">PKR {overview.sales.grossProfit.toLocaleString()}</div>
              </div>
            </div>
          </Card>

          {/* Top products */}
          <Card padding={false}>
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Top Products by Revenue</h2>
            </div>
            {tpLoading ? <PageLoader /> : topProducts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No sales in this period</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {topProducts.map((p, i) => {
                  const maxRev = topProducts[0]?.revenue ?? 1
                  const pct = Math.round((p.revenue / maxRev) * 100)
                  return (
                    <div key={p.id} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-gray-300 w-5">#{i + 1}</span>
                          <span className="text-sm font-semibold text-gray-800">{p.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-900">PKR {p.revenue.toLocaleString()}</div>
                          <div className="text-xs text-gray-400">{p.qty} sold</div>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden ml-8">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Receivables */}
          {receivables && receivables.customers.length > 0 && (
            <Card padding={false}>
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900">Outstanding Receivables</h2>
                <Badge color="red">PKR {receivables.total.toLocaleString()}</Badge>
              </div>
              <div className="divide-y divide-gray-50">
                {receivables.customers.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">{c.name}</div>
                      {c.phone && <div className="text-xs text-gray-400">{c.phone}</div>}
                    </div>
                    <span className="text-sm font-bold text-red-600">PKR {Number(c.balanceOwed).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      ) : null}
    </div>
  )
}
