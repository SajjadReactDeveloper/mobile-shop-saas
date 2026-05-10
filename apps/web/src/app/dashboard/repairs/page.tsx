'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  Wrench, Plus, X, Loader2, ChevronDown,
  ArrowLeft, ChevronRight,
} from 'lucide-react'

type RepairStatus = 'RECEIVED' | 'DIAGNOSING' | 'AWAITING_PARTS' | 'IN_REPAIR' | 'READY' | 'DELIVERED' | 'CANCELLED'

interface Customer { id: string; name: string; phone?: string }
interface Product { id: string; name: string; stockQty: number; sellingPrice: number }
interface RepairPart { id: string; qty: number; unitPrice: number; product: { name: string } }

interface RepairJob {
  id: string
  jobNumber: string
  deviceBrand: string
  deviceModel: string
  faultDesc: string
  status: RepairStatus
  advancePaid: number
  totalQuote?: number
  notes?: string
  createdAt: string
  deliveredAt?: string
  customer: Customer
  technician?: { name: string }
  parts?: RepairPart[]
}

const STATUS_ORDER: RepairStatus[] = ['RECEIVED', 'DIAGNOSING', 'AWAITING_PARTS', 'IN_REPAIR', 'READY', 'DELIVERED', 'CANCELLED']

const STATUS_META: Record<RepairStatus, { label: string; color: string; bg: string }> = {
  RECEIVED:       { label: 'Received',       color: 'text-gray-600',   bg: 'bg-gray-100' },
  DIAGNOSING:     { label: 'Diagnosing',     color: 'text-blue-600',   bg: 'bg-blue-100' },
  AWAITING_PARTS: { label: 'Awaiting Parts', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  IN_REPAIR:      { label: 'In Repair',      color: 'text-orange-600', bg: 'bg-orange-100' },
  READY:          { label: 'Ready',          color: 'text-green-700',  bg: 'bg-green-100' },
  DELIVERED:      { label: 'Delivered',      color: 'text-purple-700', bg: 'bg-purple-100' },
  CANCELLED:      { label: 'Cancelled',      color: 'text-red-600',    bg: 'bg-red-100' },
}

const NEXT_STATUS: Partial<Record<RepairStatus, RepairStatus>> = {
  RECEIVED:       'DIAGNOSING',
  DIAGNOSING:     'AWAITING_PARTS',
  AWAITING_PARTS: 'IN_REPAIR',
  IN_REPAIR:      'READY',
  READY:          'DELIVERED',
}

const input  = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
const btn    = 'px-4 py-2 text-sm font-medium rounded-lg transition-colors'

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

// ─── New Job Modal ───────────────────────────────────────────────────────────

function NewJobModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    customerId: '', deviceBrand: '', deviceModel: '',
    faultDesc: '', advancePaid: '0', totalQuote: '', notes: '',
  })
  const [customerSearch, setCustomerSearch] = useState('')
  const [showDrop, setShowDrop] = useState(false)

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then(r => r.data),
  })

  const mut = useMutation({
    mutationFn: (data: object) => api.post('/repairs', data).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['repairs'] }); onClose() },
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const selected = customers.find(c => c.id === form.customerId)

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone ?? '').includes(customerSearch)
  )

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    mut.mutate({
      customerId: form.customerId,
      deviceBrand: form.deviceBrand,
      deviceModel: form.deviceModel,
      faultDesc: form.faultDesc,
      advancePaid: Number(form.advancePaid) || undefined,
      totalQuote: form.totalQuote ? Number(form.totalQuote) : undefined,
      notes: form.notes || undefined,
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Customer */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Customer *</label>
        {selected ? (
          <div className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-blue-800">{selected.name}</div>
              {selected.phone && <div className="text-xs text-blue-500">{selected.phone}</div>}
            </div>
            <button type="button" onClick={() => { set('customerId', ''); setCustomerSearch('') }} className="text-blue-400 hover:text-blue-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <input className={input} placeholder="Search customer…" value={customerSearch}
              onChange={e => { setCustomerSearch(e.target.value); setShowDrop(true) }}
              onFocus={() => setShowDrop(true)} onBlur={() => setTimeout(() => setShowDrop(false), 150)} />
            {showDrop && filtered.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-40 overflow-y-auto">
                {filtered.map(c => (
                  <button key={c.id} type="button" onMouseDown={() => { set('customerId', c.id); setCustomerSearch(c.name); setShowDrop(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 text-left border-b border-gray-50 last:border-0">
                    <span className="text-sm font-medium text-gray-800">{c.name}</span>
                    {c.phone && <span className="text-xs text-gray-400">{c.phone}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Device Brand *</label>
          <input className={input} required value={form.deviceBrand} onChange={e => set('deviceBrand', e.target.value)} placeholder="Samsung" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Model *</label>
          <input className={input} required value={form.deviceModel} onChange={e => set('deviceModel', e.target.value)} placeholder="Galaxy A15" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Fault Description *</label>
        <textarea className={input + ' h-20 resize-none'} required value={form.faultDesc} onChange={e => set('faultDesc', e.target.value)} placeholder="Describe the issue…" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Advance Paid (PKR)</label>
          <input className={input} type="number" min="0" value={form.advancePaid} onChange={e => set('advancePaid', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Quote (PKR)</label>
          <input className={input} type="number" min="0" value={form.totalQuote} onChange={e => set('totalQuote', e.target.value)} placeholder="Optional" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Notes</label>
        <input className={input} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional" />
      </div>

      {mut.error && <p className="text-xs text-red-600">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed'}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose} className={btn + ' flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200'}>Cancel</button>
        <button type="submit" disabled={mut.isPending || !form.customerId}
          className={btn + ' flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2'}>
          {mut.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Create Job
        </button>
      </div>
    </form>
  )
}

// ─── Add Part Modal ──────────────────────────────────────────────────────────

function AddPartModal({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ productId: '', qty: '1', unitPrice: '' })

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['inventory'],
    queryFn: () => api.get('/inventory').then(r => r.data),
  })

  const selected = products.find(p => p.id === form.productId)

  const mut = useMutation({
    mutationFn: (data: object) => api.post(`/repairs/${jobId}/parts`, data).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['repair', jobId] }); onClose() },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    mut.mutate({ productId: form.productId, qty: Number(form.qty), unitPrice: Number(form.unitPrice) })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Part / Product *</label>
        <div className="relative">
          <select className={input + ' appearance-none pr-8'} required value={form.productId}
            onChange={e => {
              const p = products.find(p => p.id === e.target.value)
              setForm(f => ({ ...f, productId: e.target.value, unitPrice: p ? String(p.sellingPrice) : '' }))
            }}>
            <option value="">Select product…</option>
            {products.map(p => (
              <option key={p.id} value={p.id} disabled={p.stockQty === 0}>
                {p.name} ({p.stockQty} in stock)
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Qty *</label>
          <input className={input} required type="number" min="1" max={selected?.stockQty}
            value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Unit Price (PKR) *</label>
          <input className={input} required type="number" min="0"
            value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))} />
        </div>
      </div>
      {mut.error && <p className="text-xs text-red-600">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed'}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose} className={btn + ' flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200'}>Cancel</button>
        <button type="submit" disabled={mut.isPending}
          className={btn + ' flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2'}>
          {mut.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Add Part
        </button>
      </div>
    </form>
  )
}

// ─── Job Detail ──────────────────────────────────────────────────────────────

function JobDetail({ jobId, onBack }: { jobId: string; onBack: () => void }) {
  const qc = useQueryClient()
  const [showAddPart, setShowAddPart] = useState(false)

  const { data: job, isLoading } = useQuery<RepairJob>({
    queryKey: ['repair', jobId],
    queryFn: () => api.get(`/repairs/${jobId}`).then(r => r.data),
  })

  const updateStatus = useMutation({
    mutationFn: (status: RepairStatus) => api.patch(`/repairs/${jobId}/status`, { status }).then(r => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['repair', jobId] })
      void qc.invalidateQueries({ queryKey: ['repairs'] })
    },
  })

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
  if (!job) return null

  const meta = STATUS_META[job.status]
  const next = NEXT_STATUS[job.status]
  const partsTotal = (job.parts ?? []).reduce((s, p) => s + p.qty * Number(p.unitPrice), 0)
  const isTerminal = job.status === 'DELIVERED' || job.status === 'CANCELLED'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">{job.jobNumber}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.bg} ${meta.color}`}>{meta.label}</span>
          </div>
          <p className="text-sm text-gray-500">{job.deviceBrand} {job.deviceModel}</p>
        </div>
      </div>

      {/* Status timeline */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STATUS_ORDER.filter(s => s !== 'CANCELLED').map((s, i) => {
            const idx = STATUS_ORDER.indexOf(job.status)
            const sIdx = STATUS_ORDER.indexOf(s)
            const done = sIdx <= idx && job.status !== 'CANCELLED'
            const active = s === job.status
            return (
              <div key={s} className="flex items-center gap-1 shrink-0">
                {i > 0 && <div className={`h-0.5 w-6 ${done ? 'bg-blue-400' : 'bg-gray-200'}`} />}
                <div className={`flex flex-col items-center gap-0.5`}>
                  <div className={`w-2.5 h-2.5 rounded-full border-2 ${active ? 'bg-blue-600 border-blue-600' : done ? 'bg-blue-400 border-blue-400' : 'bg-white border-gray-300'}`} />
                  <span className={`text-xs whitespace-nowrap ${active ? 'text-blue-600 font-semibold' : done ? 'text-gray-500' : 'text-gray-300'}`}>
                    {STATUS_META[s].label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="text-xs text-gray-500 mb-1">Customer</div>
          <div className="text-sm font-semibold text-gray-900">{job.customer.name}</div>
          {job.customer.phone && <div className="text-xs text-gray-400 mt-0.5">{job.customer.phone}</div>}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="text-xs text-gray-500 mb-1">Financials</div>
          <div className="text-sm font-semibold text-gray-900">Quote: PKR {Number(job.totalQuote ?? 0).toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-0.5">Advance: PKR {Number(job.advancePaid).toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-2">
        <div className="text-xs text-gray-500">Fault Description</div>
        <div className="text-sm text-gray-800">{job.faultDesc}</div>
        {job.notes && <div className="text-xs text-gray-400 pt-1 border-t border-gray-100">{job.notes}</div>}
      </div>

      {/* Parts */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-800">Parts Used</span>
          {!isTerminal && (
            <button onClick={() => setShowAddPart(true)} className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:text-blue-700">
              <Plus className="w-3.5 h-3.5" /> Add Part
            </button>
          )}
        </div>
        {!job.parts?.length ? (
          <p className="text-xs text-gray-400 text-center py-5">No parts added yet</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {job.parts.map(p => (
              <div key={p.id} className="flex justify-between items-center px-4 py-2.5">
                <div>
                  <div className="text-sm text-gray-800">{p.product.name}</div>
                  <div className="text-xs text-gray-400">Qty: {p.qty}</div>
                </div>
                <div className="text-sm font-semibold text-gray-900">PKR {(p.qty * Number(p.unitPrice)).toLocaleString()}</div>
              </div>
            ))}
            <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
              <span className="text-sm font-semibold text-gray-700">Parts Total</span>
              <span className="text-sm font-bold text-gray-900">PKR {partsTotal.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {!isTerminal && (
        <div className="flex gap-3">
          <button onClick={() => updateStatus.mutate('CANCELLED')} disabled={updateStatus.isPending}
            className={btn + ' bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50'}>
            Cancel Job
          </button>
          {next && (
            <button onClick={() => updateStatus.mutate(next)} disabled={updateStatus.isPending}
              className={btn + ' flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2'}>
              {updateStatus.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Move to {STATUS_META[next].label}
              {next === 'READY' && ' 📱'}
            </button>
          )}
        </div>
      )}

      {showAddPart && (
        <Modal title="Add Part" onClose={() => setShowAddPart(false)}>
          <AddPartModal jobId={jobId} onClose={() => setShowAddPart(false)} />
        </Modal>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function RepairsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [statusFilter, setStatusFilter] = useState<RepairStatus | 'ALL'>('ALL')

  const { data: jobs = [], isLoading } = useQuery<RepairJob[]>({
    queryKey: ['repairs', statusFilter],
    queryFn: () => {
      const q = statusFilter !== 'ALL' ? `?status=${statusFilter}` : ''
      return api.get(`/repairs${q}`).then(r => r.data)
    },
  })

  if (selectedId) return <JobDetail jobId={selectedId} onBack={() => setSelectedId(null)} />

  const activeCount = jobs.filter(j => j.status !== 'DELIVERED' && j.status !== 'CANCELLED').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Repairs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{jobs.length} job{jobs.length !== 1 ? 's' : ''}{statusFilter === 'ALL' && activeCount > 0 ? ` · ${activeCount} active` : ''}</p>
        </div>
        <button onClick={() => setShowNew(true)} className={btn + ' bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2'}>
          <Plus className="w-4 h-4" /> New Job
        </button>
      </div>

      {/* Status filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {(['ALL', ...STATUS_ORDER] as const).map(s => {
          const meta = s === 'ALL' ? null : STATUS_META[s]
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {s === 'ALL' ? 'All' : meta?.label}
            </button>
          )
        })}
      </div>

      {/* Job list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No repair jobs found</p>
            <button onClick={() => setShowNew(true)} className={btn + ' bg-blue-600 text-white hover:bg-blue-700 mt-3 mx-auto flex items-center gap-2'}>
              <Plus className="w-4 h-4" /> Create first job
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {jobs.map(job => {
              const meta = STATUS_META[job.status]
              return (
                <button key={job.id} onClick={() => setSelectedId(job.id)}
                  className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{job.jobNumber}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${meta.bg} ${meta.color}`}>{meta.label}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-0.5">{job.deviceBrand} {job.deviceModel}</div>
                      <div className="text-xs text-gray-400">{job.customer.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      {job.totalQuote && <div className="text-sm font-semibold text-gray-900">PKR {Number(job.totalQuote).toLocaleString()}</div>}
                      <div className="text-xs text-gray-400">{new Date(job.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {showNew && <Modal title="New Repair Job" onClose={() => setShowNew(false)}><NewJobModal onClose={() => setShowNew(false)} /></Modal>}
    </div>
  )
}
