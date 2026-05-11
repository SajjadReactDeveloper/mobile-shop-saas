'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Wrench, Plus, X, ChevronRight, ArrowLeft } from 'lucide-react'
import { Button, Card, Badge, Modal, Input, TextArea, Select, PageHeader, Empty, PageLoader, Tabs } from '@/components/ui'

type RepairStatus = 'RECEIVED' | 'DIAGNOSING' | 'AWAITING_PARTS' | 'IN_REPAIR' | 'READY' | 'DELIVERED' | 'CANCELLED'

interface Customer { id: string; name: string; phone?: string }
interface Product { id: string; name: string; stockQty: number; sellingPrice: number }
interface RepairPart { id: string; qty: number; unitPrice: number; product: { name: string } }
interface RepairJob {
  id: string; jobNumber: string; deviceBrand: string; deviceModel: string; faultDesc: string
  status: RepairStatus; advancePaid: number; totalQuote?: number; notes?: string
  createdAt: string; deliveredAt?: string; customer: Customer; technician?: { name: string }; parts?: RepairPart[]
}

const STATUS_ORDER: RepairStatus[] = ['RECEIVED', 'DIAGNOSING', 'AWAITING_PARTS', 'IN_REPAIR', 'READY', 'DELIVERED', 'CANCELLED']

const STATUS_META: Record<RepairStatus, { label: string; color: 'gray' | 'blue' | 'yellow' | 'orange' | 'green' | 'purple' | 'red' }> = {
  RECEIVED:       { label: 'Received',       color: 'gray' },
  DIAGNOSING:     { label: 'Diagnosing',     color: 'blue' },
  AWAITING_PARTS: { label: 'Awaiting Parts', color: 'yellow' },
  IN_REPAIR:      { label: 'In Repair',      color: 'orange' },
  READY:          { label: 'Ready ✓',        color: 'green' },
  DELIVERED:      { label: 'Delivered',      color: 'purple' },
  CANCELLED:      { label: 'Cancelled',      color: 'red' },
}

const NEXT_STATUS: Partial<Record<RepairStatus, RepairStatus>> = {
  RECEIVED: 'DIAGNOSING', DIAGNOSING: 'AWAITING_PARTS',
  AWAITING_PARTS: 'IN_REPAIR', IN_REPAIR: 'READY', READY: 'DELIVERED',
}

/* ─── New Job Modal ─── */
function NewJobModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ customerId: '', deviceBrand: '', deviceModel: '', faultDesc: '', advancePaid: '0', totalQuote: '', notes: '' })
  const [customerSearch, setCustomerSearch] = useState('')
  const [showDrop, setShowDrop] = useState(false)
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ['customers'], queryFn: () => api.get('/customers').then(r => r.data) })
  const mut = useMutation({
    mutationFn: (d: object) => api.post('/repairs', d).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['repairs'] }); onClose() },
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const selected = customers.find(c => c.id === form.customerId)
  const filtered = customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone ?? '').includes(customerSearch))
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    mut.mutate({ customerId: form.customerId, deviceBrand: form.deviceBrand, deviceModel: form.deviceModel, faultDesc: form.faultDesc, advancePaid: Number(form.advancePaid) || undefined, totalQuote: form.totalQuote ? Number(form.totalQuote) : undefined, notes: form.notes || undefined })
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Customer *</p>
        {selected ? (
          <div className="flex items-center justify-between p-3 bg-violet-50 border border-violet-100 rounded-xl">
            <div>
              <div className="text-sm font-bold text-violet-900">{selected.name}</div>
              {selected.phone && <div className="text-xs text-violet-500">{selected.phone}</div>}
            </div>
            <button type="button" onClick={() => { set('customerId', ''); setCustomerSearch('') }} className="text-violet-400 hover:text-violet-600 p-1 rounded-lg hover:bg-violet-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <input className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Search customer…" value={customerSearch}
              onChange={e => { setCustomerSearch(e.target.value); setShowDrop(true) }}
              onFocus={() => setShowDrop(true)} onBlur={() => setTimeout(() => setShowDrop(false), 150)} />
            {showDrop && filtered.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-40 overflow-y-auto">
                {filtered.map(c => (
                  <button key={c.id} type="button" onMouseDown={() => { set('customerId', c.id); setCustomerSearch(c.name); setShowDrop(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-violet-50 text-left border-b border-gray-50 last:border-0 transition-colors">
                    <span className="text-sm font-semibold text-gray-800">{c.name}</span>
                    {c.phone && <span className="text-xs text-gray-400">{c.phone}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Device Brand *" required value={form.deviceBrand} onChange={e => set('deviceBrand', e.target.value)} placeholder="Samsung" />
        <Input label="Model *" required value={form.deviceModel} onChange={e => set('deviceModel', e.target.value)} placeholder="Galaxy A15" />
      </div>
      <TextArea label="Fault Description *" required value={form.faultDesc} onChange={e => set('faultDesc', e.target.value)} placeholder="Describe the issue…" className="h-20" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Advance Paid (PKR)" type="number" min="0" value={form.advancePaid} onChange={e => set('advancePaid', e.target.value)} />
        <Input label="Quote (PKR)" type="number" min="0" value={form.totalQuote} onChange={e => set('totalQuote', e.target.value)} placeholder="Optional" />
      </div>
      <Input label="Notes" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional" />
      {mut.error && <p className="text-xs text-red-500">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed'}</p>}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="flex-1" loading={mut.isPending} disabled={!form.customerId}>Create Job</Button>
      </div>
    </form>
  )
}

/* ─── Add Part Modal ─── */
function AddPartModal({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ productId: '', qty: '1', unitPrice: '' })
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ['inventory'], queryFn: () => api.get('/inventory').then(r => r.data) })
  const selected = products.find(p => p.id === form.productId)
  const mut = useMutation({
    mutationFn: (d: object) => api.post(`/repairs/${jobId}/parts`, d).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['repair', jobId] }); onClose() },
  })
  const submit = (e: React.FormEvent) => { e.preventDefault(); mut.mutate({ productId: form.productId, qty: Number(form.qty), unitPrice: Number(form.unitPrice) }) }
  return (
    <form onSubmit={submit} className="space-y-4">
      <Select label="Part / Product *" required value={form.productId} onChange={e => {
        const p = products.find(p => p.id === e.target.value)
        setForm(f => ({ ...f, productId: e.target.value, unitPrice: p ? String(p.sellingPrice) : '' }))
      }}>
        <option value="">Select product…</option>
        {products.map(p => <option key={p.id} value={p.id} disabled={p.stockQty === 0}>{p.name} ({p.stockQty} in stock)</option>)}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Qty *" type="number" min="1" required max={selected?.stockQty} value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} />
        <Input label="Unit Price (PKR) *" type="number" min="0" required value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))} />
      </div>
      {mut.error && <p className="text-xs text-red-500">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed'}</p>}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="flex-1" loading={mut.isPending}>Add Part</Button>
      </div>
    </form>
  )
}

/* ─── Job Detail ─── */
function JobDetail({ jobId, onBack }: { jobId: string; onBack: () => void }) {
  const qc = useQueryClient()
  const [showAddPart, setShowAddPart] = useState(false)
  const { data: job, isLoading } = useQuery<RepairJob>({
    queryKey: ['repair', jobId],
    queryFn: () => api.get(`/repairs/${jobId}`).then(r => r.data),
  })
  const updateStatus = useMutation({
    mutationFn: (status: RepairStatus) => api.patch(`/repairs/${jobId}/status`, { status }).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['repair', jobId] }); void qc.invalidateQueries({ queryKey: ['repairs'] }) },
  })

  if (isLoading) return <PageLoader />
  if (!job) return null

  const meta = STATUS_META[job.status]
  const next = NEXT_STATUS[job.status]
  const partsTotal = (job.parts ?? []).reduce((s, p) => s + p.qty * Number(p.unitPrice), 0)
  const isTerminal = job.status === 'DELIVERED' || job.status === 'CANCELLED'
  const currentIdx = STATUS_ORDER.indexOf(job.status)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900 font-mono">{job.jobNumber}</h2>
            <Badge color={meta.color}>{meta.label}</Badge>
          </div>
          <p className="text-sm text-gray-500">{job.deviceBrand} {job.deviceModel}</p>
        </div>
      </div>

      {/* Status timeline */}
      <Card>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STATUS_ORDER.filter(s => s !== 'CANCELLED').map((s, i) => {
            const sIdx = STATUS_ORDER.indexOf(s)
            const done = sIdx <= currentIdx && job.status !== 'CANCELLED'
            const active = s === job.status
            return (
              <div key={s} className="flex items-center gap-1 shrink-0">
                {i > 0 && <div className={`h-0.5 w-5 rounded-full ${done ? 'bg-violet-400' : 'bg-gray-200'}`} />}
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-3 h-3 rounded-full border-2 transition-colors ${active ? 'bg-violet-600 border-violet-600 scale-125' : done ? 'bg-violet-400 border-violet-400' : 'bg-white border-gray-300'}`} />
                  <span className={`text-[10px] whitespace-nowrap ${active ? 'text-violet-600 font-bold' : done ? 'text-gray-500' : 'text-gray-300'}`}>
                    {STATUS_META[s].label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Customer</div>
          <div className="text-sm font-bold text-gray-900">{job.customer.name}</div>
          {job.customer.phone && <div className="text-xs text-gray-500 mt-0.5">{job.customer.phone}</div>}
        </Card>
        <Card>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Financials</div>
          <div className="text-sm font-bold text-gray-900">Quote: PKR {Number(job.totalQuote ?? 0).toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-0.5">Advance: PKR {Number(job.advancePaid).toLocaleString()}</div>
        </Card>
      </div>

      <Card>
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Fault Description</div>
        <div className="text-sm text-gray-800">{job.faultDesc}</div>
        {job.notes && <div className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">{job.notes}</div>}
        <div className="text-xs text-gray-400 mt-3">
          Created {new Date(job.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </Card>

      {/* Parts */}
      <Card padding={false}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="text-sm font-bold text-gray-800">Parts Used</span>
          {!isTerminal && (
            <button onClick={() => setShowAddPart(true)} className="text-xs text-violet-600 font-semibold flex items-center gap-1 hover:text-violet-700 px-2 py-1 rounded-lg hover:bg-violet-50 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Part
            </button>
          )}
        </div>
        {!job.parts?.length ? (
          <p className="text-xs text-gray-400 text-center py-6">No parts added yet</p>
        ) : (
          <div>
            {job.parts.map(p => (
              <div key={p.id} className="flex justify-between items-center px-5 py-3.5 border-b border-gray-50">
                <div>
                  <div className="text-sm font-medium text-gray-800">{p.product.name}</div>
                  <div className="text-xs text-gray-400">Qty: {p.qty}</div>
                </div>
                <div className="text-sm font-bold text-gray-900">PKR {(p.qty * Number(p.unitPrice)).toLocaleString()}</div>
              </div>
            ))}
            <div className="flex justify-between items-center px-5 py-4 bg-gray-50">
              <span className="text-sm font-bold text-gray-700">Parts Total</span>
              <span className="text-sm font-extrabold text-gray-900">PKR {partsTotal.toLocaleString()}</span>
            </div>
          </div>
        )}
      </Card>

      {!isTerminal && (
        <div className="flex gap-3">
          <Button variant="danger" size="sm" onClick={() => updateStatus.mutate('CANCELLED')} loading={updateStatus.isPending}>
            Cancel Job
          </Button>
          {next && (
            <Button className="flex-1" onClick={() => updateStatus.mutate(next)} loading={updateStatus.isPending}>
              Move to {STATUS_META[next].label}
            </Button>
          )}
        </div>
      )}

      <Modal open={showAddPart} onClose={() => setShowAddPart(false)} title="Add Part" size="sm">
        <AddPartModal jobId={jobId} onClose={() => setShowAddPart(false)} />
      </Modal>
    </div>
  )
}

/* ─── Main Page ─── */
export default function RepairsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [statusFilter, setStatusFilter] = useState('ALL')

  const { data: jobs = [], isLoading } = useQuery<RepairJob[]>({
    queryKey: ['repairs', statusFilter],
    queryFn: () => api.get(`/repairs${statusFilter !== 'ALL' ? `?status=${statusFilter}` : ''}`).then(r => r.data),
  })

  if (selectedId) return <JobDetail jobId={selectedId} onBack={() => setSelectedId(null)} />

  const activeCount = jobs.filter(j => j.status !== 'DELIVERED' && j.status !== 'CANCELLED').length
  const filterTabs = [
    { key: 'ALL', label: 'All' },
    ...STATUS_ORDER.map(s => ({ key: s, label: STATUS_META[s].label }))
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Repairs"
        subtitle={`${jobs.length} job${jobs.length !== 1 ? 's' : ''}${statusFilter === 'ALL' && activeCount > 0 ? ` · ${activeCount} active` : ''}`}
        action={<Button onClick={() => setShowNew(true)}><Plus className="w-4 h-4" /> New Job</Button>}
      />

      <div className="overflow-x-auto">
        <Tabs tabs={filterTabs} active={statusFilter} onChange={setStatusFilter} />
      </div>

      <Card padding={false}>
        {isLoading ? <PageLoader /> : jobs.length === 0 ? (
          <Empty icon="🔧" title="No repair jobs" desc="Create a job card to start tracking repairs."
            action={<Button onClick={() => setShowNew(true)}><Plus className="w-4 h-4" /> Create Job</Button>} />
        ) : (
          <div className="divide-y divide-gray-50">
            {jobs.map(job => {
              const meta = STATUS_META[job.status]
              return (
                <button key={job.id} onClick={() => setSelectedId(job.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900 font-mono">{job.jobNumber}</span>
                        <Badge color={meta.color}>{meta.label}</Badge>
                      </div>
                      <div className="text-sm text-gray-600 mt-0.5">{job.deviceBrand} {job.deviceModel}</div>
                      <div className="text-xs text-gray-400">{job.customer.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      {job.totalQuote && <div className="text-sm font-bold text-gray-900">PKR {Number(job.totalQuote).toLocaleString()}</div>}
                      <div className="text-xs text-gray-400">{new Date(job.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </Card>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Repair Job">
        <NewJobModal onClose={() => setShowNew(false)} />
      </Modal>
    </div>
  )
}
