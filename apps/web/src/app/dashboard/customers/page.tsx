'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Plus, Search, ChevronRight, MessageCircle, Banknote, ArrowLeft, AlertTriangle } from 'lucide-react'
import { Button, Card, Badge, Modal, Input, PageHeader, Empty, PageLoader, Tabs } from '@/components/ui'

interface LedgerEntry { id: string; type: 'CREDIT' | 'PAYMENT'; amount: number; description: string; createdAt: string }
interface Sale { id: string; invoiceNumber: string; total: number; createdAt: string }
interface Customer { id: string; name: string; phone?: string; notes?: string; balanceOwed: number; ledgerEntries?: LedgerEntry[]; sales?: Sale[] }

function AddCustomerModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', phone: '', notes: '' })
  const mut = useMutation({
    mutationFn: (d: object) => api.post('/customers', d).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['customers'] }); onClose() },
  })
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    mut.mutate({ name: form.name, phone: form.phone || undefined, notes: form.notes || undefined })
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <Input label="Name *" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Customer name" />
      <Input label="Phone" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="03001234567" />
      <Input label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
      {mut.error && <p className="text-xs text-red-500">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed'}</p>}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="flex-1" loading={mut.isPending}>Add Customer</Button>
      </div>
    </form>
  )
}

function RecordPaymentModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const qc = useQueryClient()
  const [amount, setAmount] = useState('')
  const mut = useMutation({
    mutationFn: (amt: number) => api.post(`/customers/${customer.id}/payment`, { amount: amt }).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['customers'] }); void qc.invalidateQueries({ queryKey: ['customer', customer.id] }); onClose() },
  })
  const submit = (e: React.FormEvent) => { e.preventDefault(); const a = Number(amount); if (a > 0) mut.mutate(a) }
  const remaining = Number(customer.balanceOwed) - (Number(amount) || 0)
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
        <div className="text-sm font-bold text-gray-900">{customer.name}</div>
        <div className="text-lg font-bold text-red-600 mt-1">Owes PKR {Number(customer.balanceOwed).toLocaleString()}</div>
      </div>
      <Input label="Amount Received (PKR) *" type="number" min="1" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
      {Number(amount) > 0 && (
        <div className={`flex justify-between p-3 rounded-xl text-sm font-semibold ${remaining <= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          <span>Remaining after payment</span>
          <span>PKR {Math.max(0, remaining).toLocaleString()}</span>
        </div>
      )}
      {mut.error && <p className="text-xs text-red-500">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed'}</p>}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="success" className="flex-1" loading={mut.isPending} disabled={!amount}>Record Payment</Button>
      </div>
    </form>
  )
}

function CustomerDetail({ customerId, onBack }: { customerId: string; onBack: () => void }) {
  const qc = useQueryClient()
  const [showPayment, setShowPayment] = useState(false)
  const { data: customer, isLoading } = useQuery<Customer>({
    queryKey: ['customer', customerId],
    queryFn: () => api.get(`/customers/${customerId}`).then(r => r.data),
  })
  const remind = useMutation({
    mutationFn: () => api.post(`/customers/${customerId}/remind`).then(r => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['customer', customerId] }),
  })

  if (isLoading) return <PageLoader />
  if (!customer) return null
  const balance = Number(customer.balanceOwed)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
          {customer.phone && <p className="text-sm text-gray-500">{customer.phone}</p>}
        </div>
        <div className="flex gap-2">
          {customer.phone && balance > 0 && (
            <Button variant="secondary" onClick={() => remind.mutate()} loading={remind.isPending} size="sm">
              <MessageCircle className="w-4 h-4" /> Remind
            </Button>
          )}
          {balance > 0 && (
            <Button onClick={() => setShowPayment(true)} size="sm">
              <Banknote className="w-4 h-4" /> Record Payment
            </Button>
          )}
        </div>
      </div>

      {/* Balance card */}
      <Card className={balance > 0 ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}>
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Outstanding Balance (Udhaar)</div>
        <div className={`text-3xl font-extrabold ${balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
          PKR {balance.toLocaleString()}
        </div>
        {balance === 0 && <div className="text-sm text-emerald-600 mt-1">✓ All clear — no dues</div>}
      </Card>

      {customer.notes && (
        <Card><p className="text-sm text-gray-600">{customer.notes}</p></Card>
      )}

      {/* Ledger */}
      <Card padding={false}>
        <div className="px-5 py-4 border-b border-gray-100 font-semibold text-gray-800 text-sm">Transaction History</div>
        {!customer.ledgerEntries?.length ? (
          <p className="text-sm text-gray-400 text-center py-8">No transactions yet</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {customer.ledgerEntries.map(entry => (
              <div key={entry.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <div className="text-sm font-medium text-gray-800">{entry.description}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(entry.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <span className={`text-sm font-bold ${entry.type === 'CREDIT' ? 'text-red-600' : 'text-emerald-600'}`}>
                  {entry.type === 'CREDIT' ? '+' : '−'} PKR {Number(entry.amount).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Sales */}
      {customer.sales && customer.sales.length > 0 && (
        <Card padding={false}>
          <div className="px-5 py-4 border-b border-gray-100 font-semibold text-gray-800 text-sm">Recent Sales</div>
          <div className="divide-y divide-gray-50">
            {customer.sales.map(sale => (
              <div key={sale.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <div className="text-sm font-semibold text-gray-800 font-mono">{sale.invoiceNumber}</div>
                  <div className="text-xs text-gray-400">{new Date(sale.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
                <div className="text-sm font-bold text-gray-900">PKR {Number(sale.total).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={showPayment} onClose={() => setShowPayment(false)} title="Record Payment" size="sm">
        <RecordPaymentModal customer={customer} onClose={() => setShowPayment(false)} />
      </Modal>
    </div>
  )
}

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then(r => r.data),
  })

  if (selectedId) return <CustomerDetail customerId={selectedId} onBack={() => setSelectedId(null)} />

  const overdueCount = customers.filter(c => Number(c.balanceOwed) > 0).length
  const totalUdhaar = customers.reduce((s, c) => s + Number(c.balanceOwed), 0)

  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone ?? '').includes(search)
    const matchFilter = filter === 'all' || Number(c.balanceOwed) > 0
    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} customers · PKR ${totalUdhaar.toLocaleString()} total udhaar`}
        action={<Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add Customer</Button>}
      />

      {overdueCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span><strong>{overdueCount}</strong> customer{overdueCount > 1 ? 's have' : ' has'} outstanding balance · PKR {totalUdhaar.toLocaleString()} total</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="Search by name or phone…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Tabs
          tabs={[{ key: 'all', label: 'All' }, { key: 'overdue', label: 'Udhaar', count: overdueCount }]}
          active={filter} onChange={setFilter} />
      </div>

      <Card padding={false}>
        {isLoading ? <PageLoader /> : filtered.length === 0 ? (
          <Empty icon="👤" title={search ? 'No customers found' : 'No customers yet'} desc="Add customers to track sales and udhaar."
            action={!search ? <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add Customer</Button> : undefined} />
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(c => {
              const balance = Number(c.balanceOwed)
              return (
                <button key={c.id} onClick={() => setSelectedId(c.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{c.name}</div>
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
                      <Badge color="green">Clear</Badge>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Customer" size="sm">
        <AddCustomerModal onClose={() => setShowAdd(false)} />
      </Modal>
    </div>
  )
}
