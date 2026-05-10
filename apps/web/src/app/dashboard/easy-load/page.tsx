'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  PhoneCall, Plus, X, Loader2, ChevronDown,
  ArrowDownCircle, ArrowUpCircle, TrendingUp,
} from 'lucide-react'

type Network = 'JAZZ' | 'TELENOR' | 'ZONG' | 'UFONE' | 'WARID'

interface EasyLoadAccount {
  id: string
  network: Network
  phoneNumber: string
  currentBalance: number
  isActive: boolean
}

interface EasyLoadTxn {
  id: string
  type: 'LOAD' | 'TOPUP'
  amount: number
  customerPhone?: string
  profitMargin?: number
  balanceAfter: number
  notes?: string
  createdAt: string
}

interface DailySummaryItem {
  network: Network
  phoneNumber: string
  currentBalance: number
  totalLoaded: number
  totalProfit: number
  txnCount: number
}

const NETWORKS: Network[] = ['JAZZ', 'TELENOR', 'ZONG', 'UFONE', 'WARID']

const NETWORK_COLORS: Record<Network, string> = {
  JAZZ: 'bg-red-100 text-red-700',
  TELENOR: 'bg-blue-100 text-blue-700',
  ZONG: 'bg-purple-100 text-purple-700',
  UFONE: 'bg-green-100 text-green-700',
  WARID: 'bg-orange-100 text-orange-700',
}

const input = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
const btn = 'px-4 py-2 text-sm font-medium rounded-lg transition-colors'

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

// ─── Add Account Modal ───────────────────────────────────────────────────────

function AddAccountModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ network: 'JAZZ' as Network, phoneNumber: '', currentBalance: '' })

  const mut = useMutation({
    mutationFn: (data: object) => api.post('/easy-load/accounts', data).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['el-accounts'] }); onClose() },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    mut.mutate({ network: form.network, phoneNumber: form.phoneNumber, currentBalance: Number(form.currentBalance) })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Network *</label>
        <div className="relative">
          <select className={input + ' appearance-none pr-8'} value={form.network} onChange={e => setForm(f => ({ ...f, network: e.target.value as Network }))}>
            {NETWORKS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">SIM Phone Number *</label>
        <input className={input} required type="tel" value={form.phoneNumber} onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))} placeholder="03001234567" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Current Balance (PKR) *</label>
        <input className={input} required type="number" min="0" value={form.currentBalance} onChange={e => setForm(f => ({ ...f, currentBalance: e.target.value }))} placeholder="0" />
      </div>
      {mut.error && <p className="text-xs text-red-600">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed'}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose} className={btn + ' flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200'}>Cancel</button>
        <button type="submit" disabled={mut.isPending} className={btn + ' flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2'}>
          {mut.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Add SIM
        </button>
      </div>
    </form>
  )
}

// ─── Load Modal ──────────────────────────────────────────────────────────────

function LoadModal({ account, onClose }: { account: EasyLoadAccount; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ customerPhone: '', amount: '', profitMargin: '10' })

  const mut = useMutation({
    mutationFn: (data: object) => api.post(`/easy-load/accounts/${account.id}/load`, data).then(r => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['el-accounts'] })
      void qc.invalidateQueries({ queryKey: ['el-txns', account.id] })
      void qc.invalidateQueries({ queryKey: ['el-summary'] })
      onClose()
    },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    mut.mutate({ customerPhone: form.customerPhone, amount: Number(form.amount), profitMargin: Number(form.profitMargin) })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="p-3 bg-gray-50 rounded-xl text-sm">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${NETWORK_COLORS[account.network]}`}>{account.network}</span>
        <span className="ml-2 text-gray-600">{account.phoneNumber}</span>
        <div className="font-bold text-gray-900 mt-1">Balance: PKR {Number(account.currentBalance).toLocaleString()}</div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Customer Phone *</label>
        <input className={input} required type="tel" value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} placeholder="03001234567" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Amount (PKR) *</label>
          <input className={input} required type="number" min="1" max={account.currentBalance} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="100" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Your Profit (PKR)</label>
          <input className={input} type="number" min="0" value={form.profitMargin} onChange={e => setForm(f => ({ ...f, profitMargin: e.target.value }))} />
        </div>
      </div>
      {mut.error && <p className="text-xs text-red-600">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed'}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose} className={btn + ' flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200'}>Cancel</button>
        <button type="submit" disabled={mut.isPending} className={btn + ' flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2'}>
          {mut.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Send Load
        </button>
      </div>
    </form>
  )
}

// ─── Top-up Modal ────────────────────────────────────────────────────────────

function TopupModal({ account, onClose }: { account: EasyLoadAccount; onClose: () => void }) {
  const qc = useQueryClient()
  const [amount, setAmount] = useState('')

  const mut = useMutation({
    mutationFn: (data: object) => api.post(`/easy-load/accounts/${account.id}/topup`, data).then(r => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['el-accounts'] })
      void qc.invalidateQueries({ queryKey: ['el-txns', account.id] })
      onClose()
    },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    mut.mutate({ amount: Number(amount) })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="p-3 bg-gray-50 rounded-xl text-sm">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${NETWORK_COLORS[account.network]}`}>{account.network}</span>
        <span className="ml-2 text-gray-600">{account.phoneNumber}</span>
        <div className="font-bold text-gray-900 mt-1">Current: PKR {Number(account.currentBalance).toLocaleString()}</div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Top-up Amount (PKR) *</label>
        <input className={input} required type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="500" autoFocus />
      </div>
      {amount && (
        <div className="text-sm text-gray-500">Balance after top-up: <span className="font-semibold text-green-600">PKR {(Number(account.currentBalance) + Number(amount)).toLocaleString()}</span></div>
      )}
      {mut.error && <p className="text-xs text-red-600">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed'}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose} className={btn + ' flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200'}>Cancel</button>
        <button type="submit" disabled={mut.isPending} className={btn + ' flex-1 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2'}>
          {mut.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Top Up
        </button>
      </div>
    </form>
  )
}

// ─── Transactions Panel ──────────────────────────────────────────────────────

function TxnPanel({ account }: { account: EasyLoadAccount }) {
  const { data: txns = [], isLoading } = useQuery<EasyLoadTxn[]>({
    queryKey: ['el-txns', account.id],
    queryFn: () => api.get(`/easy-load/accounts/${account.id}/transactions`).then(r => r.data),
  })

  if (isLoading) return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
  if (!txns.length) return <p className="text-sm text-gray-400 text-center py-6">No transactions yet</p>

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {txns.map(t => (
        <div key={t.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            {t.type === 'LOAD'
              ? <ArrowDownCircle className="w-4 h-4 text-red-500 shrink-0" />
              : <ArrowUpCircle className="w-4 h-4 text-green-500 shrink-0" />}
            <div>
              <div className="text-xs font-medium text-gray-800">
                {t.type === 'LOAD' ? `Load → ${t.customerPhone}` : 'Top-up'}
              </div>
              <div className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-xs font-bold ${t.type === 'LOAD' ? 'text-red-600' : 'text-green-600'}`}>
              {t.type === 'LOAD' ? '−' : '+'} PKR {Number(t.amount).toLocaleString()}
            </div>
            {t.type === 'LOAD' && t.profitMargin && (
              <div className="text-xs text-green-600">+PKR {Number(t.profitMargin).toLocaleString()} profit</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function EasyLoadPage() {
  const today = new Date().toISOString().split('T')[0]
  const [modal, setModal] = useState<'add' | 'load' | 'topup' | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<EasyLoadAccount | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: accounts = [], isLoading } = useQuery<EasyLoadAccount[]>({
    queryKey: ['el-accounts'],
    queryFn: () => api.get('/easy-load/accounts').then(r => r.data),
  })

  const { data: summary = [] } = useQuery<DailySummaryItem[]>({
    queryKey: ['el-summary', today],
    queryFn: () => api.get(`/easy-load/daily-summary?date=${today}`).then(r => r.data),
  })

  const totalLoaded = summary.reduce((s, a) => s + a.totalLoaded, 0)
  const totalProfit = summary.reduce((s, a) => s + a.totalProfit, 0)

  const openLoad = (acc: EasyLoadAccount) => { setSelectedAccount(acc); setModal('load') }
  const openTopup = (acc: EasyLoadAccount) => { setSelectedAccount(acc); setModal('topup') }
  const closeModal = () => { setModal(null); setSelectedAccount(null) }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Easy Load</h1>
          <p className="text-sm text-gray-500 mt-0.5">{accounts.length} SIM account{accounts.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModal('add')} className={btn + ' bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2'}>
          <Plus className="w-4 h-4" /> Add SIM
        </button>
      </div>

      {/* Today's summary */}
      {summary.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-gray-800">Today&apos;s Summary</span>
            <span className="text-xs text-gray-400 ml-auto">Total loaded: PKR {totalLoaded.toLocaleString()} · Profit: PKR {totalProfit.toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {summary.map(acc => (
              <div key={acc.phoneNumber} className="text-center p-3 bg-gray-50 rounded-lg">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${NETWORK_COLORS[acc.network]}`}>{acc.network}</span>
                <div className="font-bold text-gray-900 text-sm mt-1.5">PKR {Number(acc.currentBalance).toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-0.5">{acc.txnCount} loads today</div>
                {acc.totalProfit > 0 && <div className="text-xs text-green-600 mt-0.5">+PKR {acc.totalProfit} profit</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account cards */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <PhoneCall className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No SIM accounts yet</p>
          <button onClick={() => setModal('add')} className={btn + ' bg-blue-600 text-white hover:bg-blue-700 mt-3 mx-auto flex items-center gap-2'}>
            <Plus className="w-4 h-4" /> Add first SIM
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map(acc => (
            <div key={acc.id} className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${NETWORK_COLORS[acc.network]}`}>{acc.network}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{acc.phoneNumber}</div>
                    <div className="text-xs font-bold text-gray-900 mt-0.5">PKR {Number(acc.currentBalance).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openTopup(acc)} className={btn + ' bg-green-50 text-green-700 hover:bg-green-100 text-xs flex items-center gap-1'}>
                    <ArrowUpCircle className="w-3.5 h-3.5" /> Top Up
                  </button>
                  <button onClick={() => openLoad(acc)} className={btn + ' bg-blue-600 text-white hover:bg-blue-700 text-xs flex items-center gap-1'}>
                    <ArrowDownCircle className="w-3.5 h-3.5" /> Load
                  </button>
                  <button onClick={() => setExpandedId(expandedId === acc.id ? null : acc.id)}
                    className="text-xs text-gray-400 hover:text-gray-600 px-2 py-2">
                    {expandedId === acc.id ? 'Hide' : 'History'}
                  </button>
                </div>
              </div>
              {expandedId === acc.id && (
                <div className="border-t border-gray-100 px-4 py-3">
                  <TxnPanel account={acc} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal === 'add' && <Modal title="Add SIM Account" onClose={closeModal}><AddAccountModal onClose={closeModal} /></Modal>}
      {modal === 'load' && selectedAccount && <Modal title="Send Load" onClose={closeModal}><LoadModal account={selectedAccount} onClose={closeModal} /></Modal>}
      {modal === 'topup' && selectedAccount && <Modal title="Top Up Balance" onClose={closeModal}><TopupModal account={selectedAccount} onClose={closeModal} /></Modal>}
    </div>
  )
}
