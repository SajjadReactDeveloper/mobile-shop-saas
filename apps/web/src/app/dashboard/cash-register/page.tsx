'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { DollarSign, Plus, Lock, History, CheckCircle, ShoppingCart, PhoneCall, Wallet, Wrench } from 'lucide-react'
import { Button, Card, Badge, Modal, Input, PageHeader, Empty, PageLoader } from '@/components/ui'

interface CashExpense { id: string; description: string; amount: number; createdAt: string }
interface CashRegister {
  id: string; date: string; openingBalance: number; closingBalance?: number
  salesCash: number; easyLoadCash: number; easypaisaCash: number; repairCash: number
  expenses: number; isClosed: boolean; expenseItems: CashExpense[]
}

function OpenDayModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [balance, setBalance] = useState('')
  const mut = useMutation({
    mutationFn: (openingBalance: number) => api.post('/cash-register/open', { openingBalance }).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['cash-today'] }); onClose() },
  })
  const submit = (e: React.FormEvent) => { e.preventDefault(); mut.mutate(Number(balance)) }
  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-gray-500">Enter the cash you have in hand to start today&apos;s session.</p>
      <Input label="Opening Cash (PKR) *" required type="number" min="0" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0" />
      {mut.error && <p className="text-xs text-red-500">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed'}</p>}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="flex-1" loading={mut.isPending}>Open Day</Button>
      </div>
    </form>
  )
}

function AddExpenseModal({ registerId, onClose }: { registerId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ description: '', amount: '' })
  const mut = useMutation({
    mutationFn: (d: object) => api.post(`/cash-register/${registerId}/expense`, d).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['cash-today'] }); onClose() },
  })
  const submit = (e: React.FormEvent) => { e.preventDefault(); mut.mutate({ description: form.description, amount: Number(form.amount) }) }
  return (
    <form onSubmit={submit} className="space-y-4">
      <Input label="Description *" required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Electricity bill" />
      <Input label="Amount (PKR) *" required type="number" min="1" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" />
      {mut.error && <p className="text-xs text-red-500">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed'}</p>}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="flex-1" loading={mut.isPending}>Add Expense</Button>
      </div>
    </form>
  )
}

function TodaySession({ register }: { register: CashRegister }) {
  const qc = useQueryClient()
  const [modal, setModal] = useState<'expense' | 'close' | null>(null)

  const closeDay = useMutation({
    mutationFn: () => api.post(`/cash-register/${register.id}/close`).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['cash-today'] }); void qc.invalidateQueries({ queryKey: ['cash-history'] }); setModal(null) },
  })

  const grossIncome = Number(register.salesCash) + Number(register.easyLoadCash) + Number(register.easypaisaCash) + Number(register.repairCash)
  const expectedClosing = Number(register.openingBalance) + grossIncome - Number(register.expenses)

  const incomeRows = [
    { label: 'Sales', amount: register.salesCash, icon: ShoppingCart, color: 'text-violet-600 bg-violet-50' },
    { label: 'Easy Load', amount: register.easyLoadCash, icon: PhoneCall, color: 'text-purple-600 bg-purple-50' },
    { label: 'Easypaisa', amount: register.easypaisaCash, icon: Wallet, color: 'text-green-600 bg-green-50' },
    { label: 'Repairs', amount: register.repairCash, icon: Wrench, color: 'text-orange-600 bg-orange-50' },
  ]

  return (
    <div className="space-y-4">
      {register.isClosed && (
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-600">
          <Lock className="w-4 h-4 shrink-0" /> Day is closed — session is locked
        </div>
      )}

      {/* Main summary card */}
      <Card>
        <div className="text-sm font-bold text-gray-900 mb-4">
          {new Date(register.date).toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>

        {/* Opening */}
        <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
          <span className="text-sm text-gray-500">Opening Balance</span>
          <span className="text-sm font-semibold text-gray-900">PKR {Number(register.openingBalance).toLocaleString()}</span>
        </div>

        {/* Income breakdown */}
        <div className="py-3 space-y-2">
          {incomeRows.map(({ label, amount, icon: Icon, color }) => (
            <div key={label} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="w-3 h-3" />
                </div>
                <span className="text-sm text-gray-600">{label}</span>
              </div>
              <span className="text-sm font-semibold text-emerald-600">+ PKR {Number(amount).toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* Expenses */}
        <div className="flex justify-between items-center py-2.5 border-t border-gray-100">
          <span className="text-sm text-gray-500">Total Expenses</span>
          <span className="text-sm font-semibold text-red-600">− PKR {Number(register.expenses).toLocaleString()}</span>
        </div>

        {/* Closing */}
        <div className="flex justify-between items-center pt-4 mt-1 border-t-2 border-gray-200">
          <span className="text-sm font-bold text-gray-900">{register.isClosed ? 'Closing Balance' : 'Expected Closing'}</span>
          <span className="text-xl font-extrabold text-violet-600">
            PKR {(register.isClosed ? Number(register.closingBalance) : expectedClosing).toLocaleString()}
          </span>
        </div>
      </Card>

      {/* Expenses list */}
      {register.expenseItems.length > 0 && (
        <Card padding={false}>
          <div className="px-5 py-4 border-b border-gray-100 text-sm font-bold text-gray-800">
            Expense Breakdown
          </div>
          <div className="divide-y divide-gray-50">
            {register.expenseItems.map(exp => (
              <div key={exp.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <div className="text-sm font-medium text-gray-800">{exp.description}</div>
                  <div className="text-xs text-gray-400">{new Date(exp.createdAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <span className="text-sm font-bold text-red-600">− PKR {Number(exp.amount).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!register.isClosed && (
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setModal('expense')}>
            <Plus className="w-4 h-4" /> Add Expense
          </Button>
          <Button variant="danger" className="flex-1" onClick={() => setModal('close')}>
            <Lock className="w-4 h-4" /> Close Day
          </Button>
        </div>
      )}

      <Modal open={modal === 'expense'} onClose={() => setModal(null)} title="Add Expense" size="sm">
        <AddExpenseModal registerId={register.id} onClose={() => setModal(null)} />
      </Modal>

      {/* Close day confirm */}
      {modal === 'close' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-red-600" />
            </div>
            <h2 className="font-bold text-gray-900 text-lg">Close the Day?</h2>
            <p className="text-sm text-gray-500 mt-2 mb-2">Expected closing balance:</p>
            <p className="text-2xl font-extrabold text-violet-600 mb-4">PKR {expectedClosing.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mb-5">This action cannot be undone by cashiers.</p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setModal(null)}>Cancel</Button>
              <Button variant="danger" className="flex-1" loading={closeDay.isPending} onClick={() => closeDay.mutate()}>Close Day</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function HistoryTab() {
  const { data: history = [], isLoading } = useQuery<CashRegister[]>({
    queryKey: ['cash-history'],
    queryFn: () => api.get('/cash-register/history').then(r => r.data),
  })
  if (isLoading) return <PageLoader />
  if (!history.length) return (
    <Card><Empty icon="📅" title="No history yet" desc="Closed sessions will appear here." /></Card>
  )
  return (
    <div className="space-y-3">
      {history.map(r => {
        const grossIncome = Number(r.salesCash) + Number(r.easyLoadCash) + Number(r.easypaisaCash) + Number(r.repairCash)
        const closing = r.isClosed ? Number(r.closingBalance) : Number(r.openingBalance) + grossIncome - Number(r.expenses)
        return (
          <Card key={r.id}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-bold text-gray-900">
                  {new Date(r.date).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              {r.isClosed
                ? <Badge color="green"><CheckCircle className="w-3 h-3 inline mr-1" />Closed</Badge>
                : <Badge color="blue">Open</Badge>}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-400 mb-1">Opening</div>
                <div className="text-sm font-bold text-gray-800">PKR {Number(r.openingBalance).toLocaleString()}</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3">
                <div className="text-xs text-gray-400 mb-1">Income</div>
                <div className="text-sm font-bold text-emerald-700">PKR {grossIncome.toLocaleString()}</div>
              </div>
              <div className="bg-violet-50 rounded-xl p-3">
                <div className="text-xs text-gray-400 mb-1">Closing</div>
                <div className="text-sm font-bold text-violet-700">PKR {closing.toLocaleString()}</div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

export default function CashRegisterPage() {
  const [tab, setTab] = useState<'today' | 'history'>('today')
  const [showOpen, setShowOpen] = useState(false)

  const { data: register, isLoading } = useQuery<CashRegister | null>({
    queryKey: ['cash-today'],
    queryFn: () => api.get('/cash-register/today').then(r => r.data).catch(() => null),
  })

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cash Register"
        subtitle="Daily cash session management"
        action={!register && !isLoading ? <Button onClick={() => setShowOpen(true)}><Plus className="w-4 h-4" /> Open Day</Button> : undefined}
      />

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('today')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'today' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          <DollarSign className="w-4 h-4" /> Today
        </button>
        <button onClick={() => setTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'history' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          <History className="w-4 h-4" /> History
        </button>
      </div>

      {tab === 'history' ? (
        <HistoryTab />
      ) : isLoading ? (
        <PageLoader />
      ) : !register ? (
        <Card>
          <Empty icon="💵" title="Day not opened yet" desc="Open today's session to start tracking cash, sales, and expenses."
            action={<Button onClick={() => setShowOpen(true)}><Plus className="w-4 h-4" /> Open Day</Button>} />
        </Card>
      ) : (
        <TodaySession register={register} />
      )}

      <Modal open={showOpen} onClose={() => setShowOpen(false)} title="Open Day" size="sm">
        <OpenDayModal onClose={() => setShowOpen(false)} />
      </Modal>
    </div>
  )
}
