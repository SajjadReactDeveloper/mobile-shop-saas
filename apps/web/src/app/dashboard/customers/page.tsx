'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  Users, Plus, Search, X, Loader2, ChevronRight,
  MessageCircle, Banknote, ArrowLeft, AlertTriangle,
} from 'lucide-react'

interface LedgerEntry {
  id: string
  type: 'CREDIT' | 'PAYMENT'
  amount: number
  description: string
  createdAt: string
}

interface Sale {
  id: string
  invoiceNumber: string
  total: number
  createdAt: string
}

interface Customer {
  id: string
  name: string
  phone?: string
  notes?: string
  balanceOwed: number
  ledgerEntries?: LedgerEntry[]
  sales?: Sale[]
}

const input = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
const btn = 'px-4 py-2 text-sm font-medium rounded-lg transition-colors'

// ─── Add Customer Modal ──────────────────────────────────────────────────────

function AddCustomerModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', phone: '', notes: '' })

  const mut = useMutation({
    mutationFn: (data: object) => api.post('/customers', data).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['customers'] }); onClose() },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    mut.mutate({ name: form.name, phone: form.phone || undefined, notes: form.notes || undefined })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Add Customer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="px-5 py-4 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Name *</label>
            <input className={input} required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Customer name" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Phone</label>
            <input className={input} type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="03001234567" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Notes</label>
            <input className={input} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
          </div>
          {mut.error && <p className="text-xs text-red-600">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to add customer'}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className={btn + ' flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200'}>Cancel</button>
            <button type="submit" disabled={mut.isPending} className={btn + ' flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2'}>
              {mut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Record Payment Modal ────────────────────────────────────────────────────

function RecordPaymentModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const qc = useQueryClient()
  const [amount, setAmount] = useState('')

  const mut = useMutation({
    mutationFn: (amt: number) => api.post(`/customers/${customer.id}/payment`, { amount: amt }).then(r => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['customers'] })
      void qc.invalidateQueries({ queryKey: ['customer', customer.id] })
      onClose()
    },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = Number(amount)
    if (amt > 0) mut.mutate(amt)
  }

  const remaining = Number(customer.balanceOwed) - (Number(amount) || 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Record Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="px-5 py-4 space-y-4">
          <div className="p-3 bg-gray-50 rounded-xl text-sm">
            <div className="font-medium text-gray-800">{customer.name}</div>
            <div className="text-red-600 font-semibold mt-0.5">Owes PKR {Number(customer.balanceOwed).toLocaleString()}</div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Amount Received (PKR) *</label>
            <input className={input} type="number" min="1" max={customer.balanceOwed} required
              value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" autoFocus />
          </div>
          {Number(amount) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Balance after payment</span>
              <span className={`font-semibold ${remaining <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                PKR {Math.max(0, remaining).toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className={btn + ' flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200'}>Cancel</button>
            <button type="submit" disabled={mut.isPending || !amount} className={btn + ' flex-1 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2'}>
              {mut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Customer Detail View ────────────────────────────────────────────────────

function CustomerDetail({ customerId, onBack }: { customerId: string; onBack: () => void }) {
  const qc = useQueryClient()
  const [showPayment, setShowPayment] = useState(false)

  const { data: customer, isLoading } = useQuery<Customer>({
    queryKey: ['customer', customerId],
    queryFn: () => api.get(`/customers/${customerId}`).then(r => r.data),
  })

  const remind = useMutation({
    mutationFn: () => api.post(`/customers/${customerId}/remind`).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['customer', customerId] }) },
  })

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
  if (!customer) return null

  const balance = Number(customer.balanceOwed)

  return (
    <div className="space-y-4">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
          {customer.phone && <p className="text-sm text-gray-500">{customer.phone}</p>}
        </div>
        <div className="flex gap-2">
          {customer.phone && balance > 0 && (
            <button onClick={() => remind.mutate()} disabled={remind.isPending}
              className={btn + ' bg-green-50 text-green-700 hover:bg-green-100 flex items-center gap-1.5 disabled:opacity-50'}>
              {remind.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
              Remind
            </button>
          )}
          {balance > 0 && (
            <button onClick={() => setShowPayment(true)} className={btn + ' bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5'}>
              <Banknote className="w-4 h-4" /> Record Payment
            </button>
          )}
        </div>
      </div>

      {/* Balance card */}
      <div className={`p-4 rounded-xl border ${balance > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
        <div className="text-sm font-medium text-gray-600">Outstanding Balance (Udhaar)</div>
        <div className={`text-2xl font-bold mt-1 ${balance > 0 ? 'text-red-700' : 'text-green-700'}`}>
          PKR {balance.toLocaleString()}
        </div>
        {balance === 0 && <div className="text-xs text-green-600 mt-0.5">All clear — no dues</div>}
      </div>

      {customer.notes && (
        <div className="px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-600">{customer.notes}</div>
      )}

      {/* Ledger */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 font-medium text-gray-800 text-sm">Transaction History</div>
        {!customer.ledgerEntries?.length ? (
          <p className="text-sm text-gray-400 text-center py-8">No transactions yet</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {customer.ledgerEntries.map(entry => (
              <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-gray-800">{entry.description}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(entry.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div className={`text-sm font-bold ${entry.type === 'CREDIT' ? 'text-red-600' : 'text-green-600'}`}>
                  {entry.type === 'CREDIT' ? '+' : '−'} PKR {Number(entry.amount).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent sales */}
      {customer.sales && customer.sales.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 font-medium text-gray-800 text-sm">Recent Sales</div>
          <div className="divide-y divide-gray-50">
            {customer.sales.map(sale => (
              <div key={sale.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-gray-800">{sale.invoiceNumber}</div>
                  <div className="text-xs text-gray-400">{new Date(sale.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
                <div className="text-sm font-semibold text-gray-900">PKR {Number(sale.total).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showPayment && customer && (
        <RecordPaymentModal customer={customer} onClose={() => setShowPayment(false)} />
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'overdue'>('all')

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then(r => r.data),
  })

  if (selectedId) return <CustomerDetail customerId={selectedId} onBack={() => setSelectedId(null)} />

  const overdueCount = customers.filter(c => Number(c.balanceOwed) > 0).length
  const totalUdhaar = customers.reduce((s, c) => s + Number(c.balanceOwed), 0)

  const filtered = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? '').includes(search)
    const matchesFilter = filter === 'all' || Number(c.balanceOwed) > 0
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{customers.length} customers · PKR {totalUdhaar.toLocaleString()} total udhaar</p>
        </div>
        <button onClick={() => setShowAdd(true)} className={btn + ' bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2'}>
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
          <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0" />
          <span><strong>{overdueCount}</strong> customer{overdueCount > 1 ? 's have' : ' has'} outstanding balance — PKR {totalUdhaar.toLocaleString()} total</span>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input className={input + ' pl-9'} placeholder="Search by name or phone…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'overdue'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`${btn} ${filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {f === 'all' ? 'All' : `Udhaar (${overdueCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">{search ? 'No customers match your search' : 'No customers yet'}</p>
            {!search && (
              <button onClick={() => setShowAdd(true)} className={btn + ' bg-blue-600 text-white hover:bg-blue-700 mt-3 mx-auto flex items-center gap-2'}>
                <Plus className="w-4 h-4" /> Add first customer
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(c => {
              const balance = Number(c.balanceOwed)
              return (
                <button key={c.id} onClick={() => setSelectedId(c.id)}
                  className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{c.name}</div>
                      {c.phone && <div className="text-xs text-gray-400 mt-0.5">{c.phone}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {balance > 0 ? (
                      <div className="text-right">
                        <div className="text-sm font-bold text-red-600">PKR {balance.toLocaleString()}</div>
                        <div className="text-xs text-red-400">udhaar</div>
                      </div>
                    ) : (
                      <div className="text-xs text-green-600 font-medium">Clear</div>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {showAdd && <AddCustomerModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
