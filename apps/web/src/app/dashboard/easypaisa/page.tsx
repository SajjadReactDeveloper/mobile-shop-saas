'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Wallet, Plus, X, Loader2, ChevronDown, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

type TxnType = 'SEND' | 'RECEIVE' | 'CASH_IN' | 'CASH_OUT' | 'WITHDRAW'

interface EasypaisaAccount {
  id: string
  accountName: string
  accountPhone: string
  provider?: string
  currentBalance: number
}

interface EasypaisaTxn {
  id: string
  type: TxnType
  amount: number
  fee: number
  commission: number
  counterparty?: string
  balanceAfter: number
  notes?: string
  createdAt: string
}

const TXN_TYPES: { value: TxnType; label: string; credit: boolean }[] = [
  { value: 'RECEIVE', label: 'Receive Money', credit: true },
  { value: 'CASH_IN', label: 'Cash In', credit: true },
  { value: 'SEND', label: 'Send Money', credit: false },
  { value: 'CASH_OUT', label: 'Cash Out', credit: false },
  { value: 'WITHDRAW', label: 'Withdraw', credit: false },
]

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
  const [form, setForm] = useState({ accountName: '', accountPhone: '', provider: 'Easypaisa', currentBalance: '' })

  const mut = useMutation({
    mutationFn: (data: object) => api.post('/easypaisa/accounts', data).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['ep-accounts'] }); onClose() },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    mut.mutate({ accountName: form.accountName, accountPhone: form.accountPhone, provider: form.provider, currentBalance: Number(form.currentBalance) })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Account Name *</label>
        <input className={input} required value={form.accountName} onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))} placeholder="e.g. Main Easypaisa" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Account Phone *</label>
        <input className={input} required type="tel" value={form.accountPhone} onChange={e => setForm(f => ({ ...f, accountPhone: e.target.value }))} placeholder="03001234567" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Provider</label>
        <div className="relative">
          <select className={input + ' appearance-none pr-8'} value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}>
            <option>Easypaisa</option>
            <option>JazzCash</option>
          </select>
          <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Current Balance (PKR) *</label>
        <input className={input} required type="number" min="0" value={form.currentBalance} onChange={e => setForm(f => ({ ...f, currentBalance: e.target.value }))} placeholder="0" />
      </div>
      {mut.error && <p className="text-xs text-red-600">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed'}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose} className={btn + ' flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200'}>Cancel</button>
        <button type="submit" disabled={mut.isPending} className={btn + ' flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2'}>
          {mut.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Add Account
        </button>
      </div>
    </form>
  )
}

// ─── Add Transaction Modal ───────────────────────────────────────────────────

function AddTxnModal({ account, onClose }: { account: EasypaisaAccount; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    type: 'RECEIVE' as TxnType,
    amount: '', fee: '0', commission: '0',
    counterparty: '', notes: '',
  })

  const mut = useMutation({
    mutationFn: (data: object) => api.post(`/easypaisa/accounts/${account.id}/transactions`, data).then(r => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['ep-accounts'] })
      void qc.invalidateQueries({ queryKey: ['ep-txns', account.id] })
      onClose()
    },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    mut.mutate({
      type: form.type,
      amount: Number(form.amount),
      fee: Number(form.fee),
      commission: Number(form.commission),
      counterparty: form.counterparty || undefined,
      notes: form.notes || undefined,
    })
  }

  const txnInfo = TXN_TYPES.find(t => t.value === form.type)

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="p-3 bg-gray-50 rounded-xl text-sm">
        <span className="font-medium text-gray-800">{account.accountName}</span>
        <span className="text-gray-500 ml-1">({account.accountPhone})</span>
        <div className="font-bold text-gray-900 mt-0.5">Balance: PKR {Number(account.currentBalance).toLocaleString()}</div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Transaction Type *</label>
        <div className="grid grid-cols-2 gap-2">
          {TXN_TYPES.map(t => (
            <button key={t.value} type="button" onClick={() => setForm(f => ({ ...f, type: t.value }))}
              className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors text-left ${form.type === t.value ? (t.credit ? 'bg-green-600 text-white border-green-600' : 'bg-red-500 text-white border-red-500') : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Amount (PKR) *</label>
          <input className={input} required type="number" min="1" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Fee (PKR)</label>
          <input className={input} type="number" min="0" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Commission Earned (PKR)</label>
        <input className={input} type="number" min="0" value={form.commission} onChange={e => setForm(f => ({ ...f, commission: e.target.value }))} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Counterparty (name or phone)</label>
        <input className={input} value={form.counterparty} onChange={e => setForm(f => ({ ...f, counterparty: e.target.value }))} placeholder="Optional" />
      </div>
      {form.amount && txnInfo && (
        <div className={`text-sm font-medium ${txnInfo.credit ? 'text-green-600' : 'text-red-600'}`}>
          Balance after: PKR {(Number(account.currentBalance) + (txnInfo.credit ? 1 : -1) * Number(form.amount) - Number(form.fee)).toLocaleString()}
        </div>
      )}
      {mut.error && <p className="text-xs text-red-600">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed'}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose} className={btn + ' flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200'}>Cancel</button>
        <button type="submit" disabled={mut.isPending} className={btn + ' flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2'}>
          {mut.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Save
        </button>
      </div>
    </form>
  )
}

// ─── Transactions Panel ──────────────────────────────────────────────────────

function TxnPanel({ accountId }: { accountId: string }) {
  const { data: txns = [], isLoading } = useQuery<EasypaisaTxn[]>({
    queryKey: ['ep-txns', accountId],
    queryFn: () => api.get(`/easypaisa/accounts/${accountId}/transactions`).then(r => r.data),
  })

  if (isLoading) return <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
  if (!txns.length) return <p className="text-sm text-gray-400 text-center py-4">No transactions yet</p>

  const typeInfo = (type: TxnType) => TXN_TYPES.find(t => t.value === type)

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {txns.map(t => {
        const info = typeInfo(t.type)
        return (
          <div key={t.id} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {info?.credit
                ? <ArrowDownLeft className="w-4 h-4 text-green-500 shrink-0" />
                : <ArrowUpRight className="w-4 h-4 text-red-500 shrink-0" />}
              <div>
                <div className="text-xs font-medium text-gray-800">{info?.label}{t.counterparty ? ` · ${t.counterparty}` : ''}</div>
                <div className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-xs font-bold ${info?.credit ? 'text-green-600' : 'text-red-600'}`}>
                {info?.credit ? '+' : '−'} PKR {Number(t.amount).toLocaleString()}
              </div>
              {Number(t.fee) > 0 && <div className="text-xs text-gray-400">fee: PKR {Number(t.fee).toLocaleString()}</div>}
              {Number(t.commission) > 0 && <div className="text-xs text-green-600">+PKR {Number(t.commission).toLocaleString()} comm.</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function EasypaisaPage() {
  const [modal, setModal] = useState<'add-account' | 'add-txn' | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<EasypaisaAccount | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: accounts = [], isLoading } = useQuery<EasypaisaAccount[]>({
    queryKey: ['ep-accounts'],
    queryFn: () => api.get('/easypaisa/accounts').then(r => r.data),
  })

  const totalBalance = accounts.reduce((s, a) => s + Number(a.currentBalance), 0)

  const openTxn = (acc: EasypaisaAccount) => { setSelectedAccount(acc); setModal('add-txn') }
  const closeModal = () => { setModal(null); setSelectedAccount(null) }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Easypaisa / JazzCash</h1>
          <p className="text-sm text-gray-500 mt-0.5">{accounts.length} wallet{accounts.length !== 1 ? 's' : ''} · PKR {totalBalance.toLocaleString()} total</p>
        </div>
        <button onClick={() => setModal('add-account')} className={btn + ' bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2'}>
          <Plus className="w-4 h-4" /> Add Wallet
        </button>
      </div>

      {/* Account cards */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No wallet accounts yet</p>
          <button onClick={() => setModal('add-account')} className={btn + ' bg-blue-600 text-white hover:bg-blue-700 mt-3 mx-auto flex items-center gap-2'}>
            <Plus className="w-4 h-4" /> Add first wallet
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map(acc => (
            <div key={acc.id} className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between px-4 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{acc.accountName}</span>
                    {acc.provider && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">{acc.provider}</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{acc.accountPhone}</div>
                  <div className="text-base font-bold text-gray-900 mt-1">PKR {Number(acc.currentBalance).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openTxn(acc)} className={btn + ' bg-blue-600 text-white hover:bg-blue-700 text-xs flex items-center gap-1'}>
                    <Plus className="w-3.5 h-3.5" /> Transaction
                  </button>
                  <button onClick={() => setExpandedId(expandedId === acc.id ? null : acc.id)}
                    className="text-xs text-gray-400 hover:text-gray-600 px-2 py-2">
                    {expandedId === acc.id ? 'Hide' : 'History'}
                  </button>
                </div>
              </div>
              {expandedId === acc.id && (
                <div className="border-t border-gray-100 px-4 py-3">
                  <TxnPanel accountId={acc.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal === 'add-account' && <Modal title="Add Wallet Account" onClose={closeModal}><AddAccountModal onClose={closeModal} /></Modal>}
      {modal === 'add-txn' && selectedAccount && <Modal title="Add Transaction" onClose={closeModal}><AddTxnModal account={selectedAccount} onClose={closeModal} /></Modal>}
    </div>
  )
}
