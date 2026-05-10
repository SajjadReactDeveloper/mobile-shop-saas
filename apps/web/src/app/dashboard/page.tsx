'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Package, Users, Wrench, TrendingUp, AlertTriangle } from 'lucide-react'

export default function DashboardPage() {
  const today = new Date().toISOString().split('T')[0]

  const { data: stats } = useQuery({
    queryKey: ['shop-stats'],
    queryFn: () => api.get('/shop/stats').then((r) => r.data),
  })

  const { data: todaySummary } = useQuery({
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

  const cards = [
    {
      label: 'Today Sales',
      value: `PKR ${(todaySummary?.totalRevenue ?? 0).toLocaleString()}`,
      sub: `${todaySummary?.totalSales ?? 0} transactions`,
      icon: TrendingUp,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Today Profit',
      value: `PKR ${(todaySummary?.grossProfit ?? 0).toLocaleString()}`,
      sub: 'Gross profit',
      icon: TrendingUp,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Products',
      value: stats?.products ?? '—',
      sub: 'Active items',
      icon: Package,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'Pending Repairs',
      value: stats?.pendingRepairs ?? '—',
      sub: 'In progress',
      icon: Wrench,
      color: 'text-orange-600 bg-orange-50',
    },
    {
      label: 'Customers',
      value: stats?.customers ?? '—',
      sub: 'Total registered',
      icon: Users,
      color: 'text-cyan-600 bg-cyan-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color} mb-3`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div className="text-xl font-bold text-gray-900">{card.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{card.sub}</div>
          </div>
        ))}
      </div>

      {lowStock && lowStock.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h2 className="font-semibold text-yellow-800">Low Stock Alert ({lowStock.length} items)</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.slice(0, 8).map((p: { id: string; name: string; stockQty: number }) => (
              <span key={p.id} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                {p.name} ({p.stockQty} left)
              </span>
            ))}
          </div>
        </div>
      )}

      {easyLoadSummary && easyLoadSummary.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Easy Load Today</h2>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {easyLoadSummary.map((acc: { phoneNumber: string; network: string; currentBalance: number; totalProfit: number }) => (
              <div key={acc.phoneNumber} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500">{acc.network}</div>
                <div className="font-bold text-gray-900 text-sm mt-0.5">PKR {Number(acc.currentBalance).toLocaleString()}</div>
                <div className="text-xs text-green-600 mt-0.5">+PKR {acc.totalProfit} profit</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
