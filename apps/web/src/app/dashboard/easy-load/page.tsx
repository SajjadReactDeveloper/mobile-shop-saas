'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Plus, ArrowDownCircle, ArrowUpCircle, TrendingUp, History } from 'lucide-react'
import { Button, Card, Badge, Modal, Input, PageHeader, Empty, PageLoader, CardListSkeleton } from '@/components/ui'

type Network = 'JAZZ' | 'TELENOR' | 'ZONG' | 'UFONE' | 'WARID'

interface EasyLoadAccount { id: string; network: Network; phoneNumber: string; currentBalance: number; isActive: boolean }
interface EasyLoadTxn { id: string; type: 'LOAD' | 'TOPUP'; amount: number; customerPhone?: string; profitMargin?: number; balanceAfter: number; createdAt: string }
interface DailySummaryItem { network: Network; phoneNumber: string; currentBalance: number; totalLoaded: number; totalProfit: number; txnCount: number }

const NETWORKS: Network[] = ['JAZZ', 'TELENOR', 'ZONG', 'UFONE', 'WARID']
const NET_COLOR: Record<Network, 'red' | 'blue' | 'purple' | 'green' | 'orange'> = {
  JAZZ: 'red', TELENOR: 'blue', ZONG: 'purple', UFONE: 'green', WARID: 'orange',
}
const NET_BG: Record<Network, string> = {
  JAZZ: 'bg-red-50 text-red-700', TELENOR: 'bg-blue-50 text-blue-700',
  ZONG: 'bg-purple-50 text-purple-700', UFONE: 'bg-green-50 text-green-700',
  WARID: 'bg-orange-50 text-orange-700',
}

function AddAccountModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ network: 'JAZZ' as Network, phoneNumber: '', currentBalance: '' })
  const mut = useMutation({
    mutationFn: (d: object) => api.post('/easy-load/accounts', d).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['el-accounts'] }); onClose() },
  })
  const submit = (e: React.FormEvent) => { e.preventDefault(); mut.mutate({ network: form.network, phoneNumber: form.phoneNumber, currentBalance: Number(form.currentBalance) }) }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Network *</p>
        <div className="grid grid-cols-5 gap-2">
          {NETWORKS.map(n => (
            <button key={n} type="button" onClick={() => setForm(f => ({ ...f, network: n }))}
              className={`py-2 text-xs font-bold rounded-lg border-2 transition-all ${form.network === n ? `${NET_BG[n]} border-current` : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <Input label="SIM Phone Number *" required type="tel" value={form.phoneNumber} onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))} placeholder="03001234567" />
      <Input label="Current Balance (PKR) *" required type="number" min="0" value={form.currentBalance} onChange={e => setForm(f => ({ ...f, currentBalance: e.target.value }))} placeholder="0" />
      {mut.error && <p className="text-xs text-red-500">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed'}</p>}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="flex-1" loading={mut.isPending}>Add SIM</Button>
      </div>
    </form>
  )
}

function LoadModal({ account, onClose }: { account: EasyLoadAccount; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ customerPhone: '', amount: '', profitMargin: '10' })
  const mut = useMutation({
    mutationFn: (d: object) => api.post(`/easy-load/accounts/${account.id}/load`, d).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['el-accounts'] }); void qc.invalidateQueries({ queryKey: ['el-txns', account.id] }); void qc.invalidateQueries({ queryKey: ['el-summary'] }); onClose() },
  })
  const submit = (e: React.FormEvent) => { e.preventDefault(); mut.mutate({ customerPhone: form.customerPhone, amount: Number(form.amount), profitMargin: Number(form.profitMargin) }) }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className={`p-3 rounded-xl flex items-center gap-3 ${NET_BG[account.network]} bg-opacity-30`}>
        <Badge color={NET_COLOR[account.network]}>{account.network}</Badge>
        <div>
          <div className="text-sm font-semibold">{account.phoneNumber}</div>
          <div className="text-xs opacity-80">Balance: PKR {Number(account.currentBalance).toLocaleString()}</div>
        </div>
      </div>
      <Input label="Customer Phone *" required type="tel" value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} placeholder="03001234567" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Amount (PKR) *" required type="number" min="1" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="100" />
        <Input label="Your Profit (PKR)" type="number" min="0" value={form.profitMargin} onChange={e => setForm(f => ({ ...f, profitMargin: e.target.value }))} />
      </div>
      {form.amount && Number(form.amount) > 0 && (
        <div className="flex justify-between text-sm px-3 py-2 bg-gray-50 rounded-xl">
          <span className="text-gray-500">Balance after</span>
          <span className="font-bold text-gray-900">PKR {(Number(account.currentBalance) - Number(form.amount)).toLocaleString()}</span>
        </div>
      )}
      {mut.error && <p className="text-xs text-red-500">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed'}</p>}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="flex-1" loading={mut.isPending}>Send Load</Button>
      </div>
    </form>
  )
}

function TopupModal({ account, onClose }: { account: EasyLoadAccount; onClose: () => void }) {
  const qc = useQueryClient()
  const [amount, setAmount] = useState('')
  const mut = useMutation({
    mutationFn: (d: object) => api.post(`/easy-load/accounts/${account.id}/topup`, d).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['el-accounts'] }); void qc.invalidateQueries({ queryKey: ['el-txns', account.id] }); onClose() },
  })
  const submit = (e: React.FormEvent) => { e.preventDefault(); mut.mutate({ amount: Number(amount) }) }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className={`p-3 rounded-xl flex items-center gap-3 ${NET_BG[account.network]} bg-opacity-30`}>
        <Badge color={NET_COLOR[account.network]}>{account.network}</Badge>
        <div>
          <div className="text-sm font-semibold">{account.phoneNumber}</div>
          <div className="text-xs opacity-80">Current: PKR {Number(account.currentBalance).toLocaleString()}</div>
        </div>
      </div>
      <Input label="Top-up Amount (PKR) *" required type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="500" />
      {amount && Number(amount) > 0 && (
        <div className="flex justify-between text-sm px-3 py-2 bg-emerald-50 rounded-xl font-semibold text-emerald-700">
          <span>New balance</span>
          <span>PKR {(Number(account.currentBalance) + Number(amount)).toLocaleString()}</span>
        </div>
      )}
      {mut.error && <p className="text-xs text-red-500">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed'}</p>}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="success" className="flex-1" loading={mut.isPending}>Top Up</Button>
      </div>
    </form>
  )
}

function TxnPanel({ account }: { account: EasyLoadAccount }) {
  const { data: txns = [], isLoading } = useQuery<EasyLoadTxn[]>({
    queryKey: ['el-txns', account.id],
    queryFn: () => api.get(`/easy-load/accounts/${account.id}/transactions`).then(r => r.data),
  })
  if (isLoading) return <PageLoader />
  if (!txns.length) return <p className="text-xs text-gray-400 text-center py-4">No transactions yet</p>
  return (
    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
      {txns.map(t => (
        <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2">
            {t.type === 'LOAD'
              ? <ArrowDownCircle className="w-4 h-4 text-red-500 shrink-0" />
              : <ArrowUpCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
            <div>
              <div className="text-xs font-semibold text-gray-800">{t.type === 'LOAD' ? `→ ${t.customerPhone}` : 'Top-up'}</div>
              <div className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-xs font-bold ${t.type === 'LOAD' ? 'text-red-600' : 'text-emerald-600'}`}>
              {t.type === 'LOAD' ? '−' : '+'} PKR {Number(t.amount).toLocaleString()}
            </div>
            {t.type === 'LOAD' && t.profitMargin && (
              <div className="text-xs text-emerald-600">+{Number(t.profitMargin).toLocaleString()} profit</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

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
  const closeModal = () => { setModal(null); setSelectedAccount(null) }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Easy Load"
        subtitle={`${accounts.length} SIM account${accounts.length !== 1 ? 's' : ''}`}
        action={<Button onClick={() => setModal('add')}><Plus className="w-4 h-4" /> Add SIM</Button>}
      />

      {/* Today summary */}
      {summary.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-sm font-bold text-gray-900">Today&apos;s Summary</span>
            </div>
            <div className="text-xs text-gray-500 text-right">
              <span className="font-semibold text-gray-900">PKR {totalLoaded.toLocaleString()}</span> loaded ·{' '}
              <span className="font-semibold text-emerald-600">PKR {totalProfit.toLocaleString()}</span> profit
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {summary.map(acc => (
              <div key={acc.phoneNumber} className="bg-gray-50 rounded-xl p-3 text-center">
                <Badge color={NET_COLOR[acc.network]}>{acc.network}</Badge>
                <div className="font-bold text-gray-900 text-sm mt-2">PKR {Number(acc.currentBalance).toLocaleString()}</div>
                <div className="text-xs text-gray-400 mt-0.5">{acc.txnCount} loads</div>
                {acc.totalProfit > 0 && <div className="text-xs text-emerald-600">+{acc.totalProfit} profit</div>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Accounts */}
      {isLoading ? <CardListSkeleton rows={3} /> : accounts.length === 0 ? (
        <Card>
          <Empty icon="📱" title="No SIM accounts yet" desc="Add a SIM account to start managing easy load."
            action={<Button onClick={() => setModal('add')}><Plus className="w-4 h-4" /> Add SIM</Button>} />
        </Card>
      ) : (
        <div className="space-y-3">
          {accounts.map(acc => (
            <Card key={acc.id} padding={false}>
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xs font-extrabold ${NET_BG[acc.network]}`}>
                    {acc.network.slice(0, 4)}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{acc.phoneNumber}</div>
                    <div className="text-xl font-extrabold text-gray-900">PKR {Number(acc.currentBalance).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => { setSelectedAccount(acc); setModal('topup') }}>
                    <ArrowUpCircle className="w-4 h-4" /> Top Up
                  </Button>
                  <Button size="sm" onClick={() => { setSelectedAccount(acc); setModal('load') }}>
                    <ArrowDownCircle className="w-4 h-4" /> Send Load
                  </Button>
                  <button onClick={() => setExpandedId(expandedId === acc.id ? null : acc.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <History className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {expandedId === acc.id && (
                <div className="border-t border-gray-100 px-5 py-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Transactions</p>
                  <TxnPanel account={acc} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={modal === 'add'} onClose={closeModal} title="Add SIM Account" size="sm">
        <AddAccountModal onClose={closeModal} />
      </Modal>
      <Modal open={modal === 'load' && !!selectedAccount} onClose={closeModal} title="Send Load" size="sm">
        {selectedAccount && <LoadModal account={selectedAccount} onClose={closeModal} />}
      </Modal>
      <Modal open={modal === 'topup' && !!selectedAccount} onClose={closeModal} title="Top Up Balance" size="sm">
        {selectedAccount && <TopupModal account={selectedAccount} onClose={closeModal} />}
      </Modal>
    </div>
  )
}
