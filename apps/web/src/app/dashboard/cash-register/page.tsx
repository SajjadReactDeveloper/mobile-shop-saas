'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { DollarSign, Plus, X, Loader2, Lock, History, CheckCircle } from 'lucide-react'

interface CashExpense {
  id: string
  description: string
  amount: number
  createdAt: string
}

interface CashRegister {
  id: string
  date: string
  openingBalance: number
  closingBalance?: number
  salesCash: number
  easyLoadCash: number
  easypaisaCash: number
  repairCash: number
  expenses: number
  isClosed: boolean
  expenseItems: CashExpense[]
}

const input = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
const btn = 'px-4 py-2 text-sm font-medium rounded-lg transition-colors'

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

// ─── Open Day Modal ──────────────────────────────────────────────────────────

function OpenDayModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [balance, setBalance] = useState('')

  const mut = useMutation({
    mutationFn: (openingBalance: number) => api.post('/cash-register/open', { openingBalance }).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['cash-today'] }); onClose() },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    mut.mutate(Number(balance))
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-gray-500">Enter the cash you have in hand to start today&apos;s session.</p>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Opening Cash (PKR) *</label>
        <input className={input} required type="number" min="0" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0" autoFocus />
      </div>
      {mut.error && <p className="text-xs text-red-600">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed'}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose} className={btn + ' flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200'}>Cancel</button>
        <button type="submit" disabled={mut.isPending} className={btn + ' flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2'}>
          {mut.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Open Day
        </button>
      </div>
    </form>
  )
}

// ─── Add Expense Modal ───────────────────────────────────────────────────────

function AddExpenseModal({ registerId, onClose }: { registerId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ description: '', amount: '' })

  const mut = useMutation({
    mutationFn: (data: object) => api.post(`/cash-register/${registerId}/expense`, data).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['cash-today'] }); onClose() },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    mut.mutate({ description: form.description, amount: Number(form.amount) })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Description *</label>
        <input className={input} required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Electricity bill" autoFocus />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Amount (PKR) *</label>
        <input className={input} required type="number" min="1" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" />
      </div>
      {mut.error && <p className="text-xs text-red-600">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed'}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose} className={btn + ' flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200'}>Cancel</button>
        <button type="submit" disabled={mut.isPending} className={btn + ' flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2'}>
          {mut.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Add Expense
        </button>
      </div>
    </form>
  )
}

// ─── Stat Row ────────────────────────────────────────────────────────────────

function Row({ label, amount, color = 'text-gray-900' }: { label: string; amount: number; color?: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-semibold ${color}`}>PKR {Number(amount).toLocaleString()}</span>
    </div>
  )
}

// ─── Today's Session ─────────────────────────────────────────────────────────

function TodaySession({ register }: { register: CashRegister }) {
  const qc = useQueryClient()
  const [modal, setModal] = useState<'expense' | 'close' | null>(null)

  const closeDay = useMutation({
    mutationFn: () => api.post(`/cash-register/${register.id}/close`).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['cash-today'] }); setModal(null) },
  })

  const grossIncome = Number(register.salesCash) + Number(register.easyLoadCash) +
    Number(register.easypaisaCash) + Number(register.repairCash)
  const expectedClosing = Number(register.openingBalance) + grossIncome - Number(register.expenses)

  return (
    <div className="space-y-4">
      {register.isClosed && (
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-600">
          <Lock className="w-4 h-4 shrink-0" />
          <span>Day closed — session is locked</span>
        </div>
      )}

      {/* Summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="text-sm font-semibold text-gray-800 mb-3">
          {new Date(register.date).toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <Row label="Opening Balance" amount={register.openingBalance} />
        <Row label="Sales (Cash)" amount={register.salesCash} color="text-green-600" />
        <Row label="Easy Load Cash" amount={register.easyLoadCash} color="text-green-600" />
        <Row label="Easypaisa Cash" amount={register.easypaisaCash} color="text-green-600" />
        <Row label="Repair Cash" amount={register.repairCash} color="text-green-600" />
        <Row label="Expenses" amount={register.expenses} color="text-red-600" />
        <div className="flex justify-between items-center pt-3 mt-1 border-t border-gray-200">
          <span className="text-sm font-bold text-gray-900">
            {register.isClosed ? 'Closing Balance' : 'Expected Closing'}
          </span>
          <span className="text-base font-bold text-blue-600">
            PKR {(register.isClosed ? Number(register.closingBalance) : expectedClosing).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Expenses list */}
      {register.expenseItems.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 text-sm font-medium text-gray-800">Expenses</div>
          <div className="divide-y divide-gray-50">
            {register.expenseItems.map(exp => (
              <div key={exp.id} className="flex justify-between items-center px-4 py-3">
                <div>
                  <div className="text-sm text-gray-800">{exp.description}</div>
                  <div className="text-xs text-gray-400">{new Date(exp.createdAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div className="text-sm font-semibold text-red-600">−PKR {Number(exp.amount).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {!register.isClosed && (
        <div className="flex gap-3">
          <button onClick={() => setModal('expense')} className={btn + ' flex-1 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2'}>
            <Plus className="w-4 h-4" /> Add Expense
          </button>
          <button onClick={() => setModal('close')} className={btn + ' flex-1 bg-red-600 text-white hover:bg-red-700 flex items-center justify-center gap-2'}>
            <Lock className="w-4 h-4" /> Close Day
          </button>
        </div>
      )}

      {modal === 'expense' && (
        <Modal title="Add Expense" onClose={() => setModal(null)}>
          <AddExpenseModal registerId={register.id} onClose={() => setModal(null)} />
        </Modal>
      )}

      {modal === 'close' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <Lock className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h2 className="font-bold text-gray-900 text-lg">Close the Day?</h2>
            <p className="text-sm text-gray-500 mt-1 mb-4">
              Expected closing balance: <strong>PKR {expectedClosing.toLocaleString()}</strong>.<br />
              This action cannot be undone by cashiers.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className={btn + ' flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200'}>Cancel</button>
              <button onClick={() => closeDay.mutate()} disabled={closeDay.isPending}
                className={btn + ' flex-1 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2'}>
                {closeDay.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Close Day
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── History Tab ─────────────────────────────────────────────────────────────

function HistoryTab() {
  const { data: history = [], isLoading } = useQuery<CashRegister[]>({
    queryKey: ['cash-history'],
    queryFn: () => api.get('/cash-register/history').then(r => r.data),
  })

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
  if (!history.length) return <p className="text-sm text-gray-400 text-center py-8">No history yet</p>

  return (
    <div className="space-y-3">
      {history.map(r => {
        const grossIncome = Number(r.salesCash) + Number(r.easyLoadCash) + Number(r.easypaisaCash) + Number(r.repairCash)
        return (
          <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-gray-800">
                {new Date(r.date).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <div className="flex items-center gap-1.5">
                {r.isClosed
                  ? <><CheckCircle className="w-3.5 h-3.5 text-green-500" /><span className="text-xs text-green-600 font-medium">Closed</span></>
                  : <><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-xs text-blue-600 font-medium">Open</span></>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-xs text-gray-400">Opening</div>
                <div className="text-sm font-semibold text-gray-800">PKR {Number(r.openingBalance).toLocaleString()}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-2">
                <div className="text-xs text-gray-400">Income</div>
                <div className="text-sm font-semibold text-green-700">PKR {grossIncome.toLocaleString()}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-2">
                <div className="text-xs text-gray-400">Closing</div>
                <div className="text-sm font-semibold text-blue-700">
                  PKR {(r.isClosed ? Number(r.closingBalance) : (Number(r.openingBalance) + grossIncome - Number(r.expenses))).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CashRegisterPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'today' | 'history'>('today')
  const [showOpen, setShowOpen] = useState(false)

  const { data: register, isLoading } = useQuery<CashRegister | null>({
    queryKey: ['cash-today'],
    queryFn: () => api.get('/cash-register/today').then(r => r.data).catch(() => null),
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cash Register</h1>
          <p className="text-sm text-gray-500 mt-0.5">Daily cash session management</p>
        </div>
        {!register && !isLoading && (
          <button onClick={() => setShowOpen(true)} className={btn + ' bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2'}>
            <Plus className="w-4 h-4" /> Open Day
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('today')} className={`${btn} ${tab === 'today' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          <span className="flex items-center gap-2"><DollarSign className="w-4 h-4" /> Today</span>
        </button>
        <button onClick={() => setTab('history')} className={`${btn} ${tab === 'history' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          <span className="flex items-center gap-2"><History className="w-4 h-4" /> History</span>
        </button>
      </div>

      {tab === 'history' ? (
        <HistoryTab />
      ) : isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : !register ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <DollarSign className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Day not opened yet</p>
          <p className="text-sm text-gray-400 mt-1">Open today&apos;s session to start tracking cash</p>
          <button onClick={() => setShowOpen(true)} className={btn + ' bg-blue-600 text-white hover:bg-blue-700 mt-4 mx-auto flex items-center gap-2'}>
            <Plus className="w-4 h-4" /> Open Day
          </button>
        </div>
      ) : (
        <TodaySession key={register.id} register={register} />
      )}

      {showOpen && (
        <Modal title="Open Day" onClose={() => setShowOpen(false)}>
          <OpenDayModal onClose={() => { setShowOpen(false); void qc.invalidateQueries({ queryKey: ['cash-today'] }) }} />
        </Modal>
      )}
    </div>
  )
}
