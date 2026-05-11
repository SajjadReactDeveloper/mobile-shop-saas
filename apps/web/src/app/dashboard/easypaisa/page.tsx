'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, History } from 'lucide-react'
import { Button, Card, Badge, Modal, Input, Select, PageHeader, Empty, PageLoader, CardListSkeleton } from '@/components/ui'

type TxnType = 'SEND' | 'RECEIVE' | 'CASH_IN' | 'CASH_OUT' | 'WITHDRAW'

interface EasypaisaAccount { id: string; accountName: string; accountPhone: string; provider?: string; currentBalance: number }
interface EasypaisaTxn { id: string; type: TxnType; amount: number; fee: number; commission: number; counterparty?: string; balanceAfter: number; createdAt: string }

const TXN_TYPES: { value: TxnType; label: string; credit: boolean; icon: string }[] = [
  { value: 'RECEIVE',  label: 'Receive Money', credit: true,  icon: '↓' },
  { value: 'CASH_IN',  label: 'Cash In',       credit: true,  icon: '↓' },
  { value: 'SEND',     label: 'Send Money',    credit: false, icon: '↑' },
  { value: 'CASH_OUT', label: 'Cash Out',      credit: false, icon: '↑' },
  { value: 'WITHDRAW', label: 'Withdraw',      credit: false, icon: '↑' },
]

function AddAccountModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ accountName: '', accountPhone: '', provider: 'Easypaisa', currentBalance: '' })
  const mut = useMutation({
    mutationFn: (d: object) => api.post('/easypaisa/accounts', d).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['ep-accounts'] }); onClose() },
  })
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    mut.mutate({ accountName: form.accountName, accountPhone: form.accountPhone, provider: form.provider, currentBalance: Number(form.currentBalance) })
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <Input label="Account Name *" required value={form.accountName} onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))} placeholder="e.g. Main Easypaisa" />
      <Input label="Account Phone *" required type="tel" value={form.accountPhone} onChange={e => setForm(f => ({ ...f, accountPhone: e.target.value }))} placeholder="03001234567" />
      <Select label="Provider" value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}>
        <option>Easypaisa</option>
        <option>JazzCash</option>
      </Select>
      <Input label="Current Balance (PKR) *" required type="number" min="0" value={form.currentBalance} onChange={e => setForm(f => ({ ...f, currentBalance: e.target.value }))} placeholder="0" />
      {mut.error && <p className="text-xs text-red-500">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed'}</p>}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="flex-1" loading={mut.isPending}>Add Account</Button>
      </div>
    </form>
  )
}

function AddTxnModal({ account, onClose }: { account: EasypaisaAccount; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ type: 'RECEIVE' as TxnType, amount: '', fee: '0', commission: '0', counterparty: '', notes: '' })
  const mut = useMutation({
    mutationFn: (d: object) => api.post(`/easypaisa/accounts/${account.id}/transactions`, d).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['ep-accounts'] }); void qc.invalidateQueries({ queryKey: ['ep-txns', account.id] }); onClose() },
  })
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    mut.mutate({ type: form.type, amount: Number(form.amount), fee: Number(form.fee), commission: Number(form.commission), counterparty: form.counterparty || undefined, notes: form.notes || undefined })
  }
  const txnInfo = TXN_TYPES.find(t => t.value === form.type)
  const balanceAfter = form.amount && txnInfo ? Number(account.currentBalance) + (txnInfo.credit ? 1 : -1) * Number(form.amount) - Number(form.fee) : null

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-gray-900">{account.accountName}</div>
          <div className="text-xs text-gray-500">{account.accountPhone}</div>
        </div>
        <div className="text-sm font-bold text-gray-900">PKR {Number(account.currentBalance).toLocaleString()}</div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Transaction Type *</p>
        <div className="grid grid-cols-2 gap-2">
          {TXN_TYPES.map(t => (
            <button key={t.value} type="button" onClick={() => setForm(f => ({ ...f, type: t.value }))}
              className={`py-2.5 px-3 text-xs font-semibold rounded-xl border-2 transition-all text-left flex items-center gap-2 ${
                form.type === t.value
                  ? t.credit ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-red-500 border-red-500 text-white'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}>
              <span className="text-base">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Amount (PKR) *" required type="number" min="1" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" />
        <Input label="Fee (PKR)" type="number" min="0" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} />
      </div>
      <Input label="Commission Earned (PKR)" type="number" min="0" value={form.commission} onChange={e => setForm(f => ({ ...f, commission: e.target.value }))} />
      <Input label="Counterparty" value={form.counterparty} onChange={e => setForm(f => ({ ...f, counterparty: e.target.value }))} placeholder="Name or phone (optional)" />

      {balanceAfter !== null && (
        <div className={`flex justify-between px-3 py-2 rounded-xl text-sm font-semibold ${txnInfo?.credit ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          <span>Balance after</span>
          <span>PKR {balanceAfter.toLocaleString()}</span>
        </div>
      )}

      {mut.error && <p className="text-xs text-red-500">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed'}</p>}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="flex-1" loading={mut.isPending}>Save Transaction</Button>
      </div>
    </form>
  )
}

function TxnPanel({ accountId }: { accountId: string }) {
  const { data: txns = [], isLoading } = useQuery<EasypaisaTxn[]>({
    queryKey: ['ep-txns', accountId],
    queryFn: () => api.get(`/easypaisa/accounts/${accountId}/transactions`).then(r => r.data),
  })
  if (isLoading) return <PageLoader />
  if (!txns.length) return <p className="text-xs text-gray-400 text-center py-4">No transactions yet</p>

  return (
    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
      {txns.map(t => {
        const info = TXN_TYPES.find(x => x.value === t.type)
        return (
          <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2">
              {info?.credit
                ? <ArrowDownLeft className="w-4 h-4 text-emerald-500 shrink-0" />
                : <ArrowUpRight className="w-4 h-4 text-red-500 shrink-0" />}
              <div>
                <div className="text-xs font-semibold text-gray-800">{info?.label}{t.counterparty ? ` · ${t.counterparty}` : ''}</div>
                <div className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-xs font-bold ${info?.credit ? 'text-emerald-600' : 'text-red-600'}`}>
                {info?.credit ? '+' : '−'} PKR {Number(t.amount).toLocaleString()}
              </div>
              {Number(t.fee) > 0 && <div className="text-xs text-gray-400">fee: {Number(t.fee).toLocaleString()}</div>}
              {Number(t.commission) > 0 && <div className="text-xs text-emerald-600">+{Number(t.commission).toLocaleString()} comm.</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function EasypaisaPage() {
  const [modal, setModal] = useState<'add-account' | 'add-txn' | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<EasypaisaAccount | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: accounts = [], isLoading } = useQuery<EasypaisaAccount[]>({
    queryKey: ['ep-accounts'],
    queryFn: () => api.get('/easypaisa/accounts').then(r => r.data),
  })

  const totalBalance = accounts.reduce((s, a) => s + Number(a.currentBalance), 0)
  const closeModal = () => { setModal(null); setSelectedAccount(null) }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Easypaisa / JazzCash"
        subtitle={`${accounts.length} wallet${accounts.length !== 1 ? 's' : ''} · PKR ${totalBalance.toLocaleString()} total`}
        action={<Button onClick={() => setModal('add-account')}><Plus className="w-4 h-4" /> Add Wallet</Button>}
      />

      {isLoading ? <CardListSkeleton rows={2} /> : accounts.length === 0 ? (
        <Card>
          <Empty icon="💰" title="No wallet accounts yet" desc="Add your Easypaisa or JazzCash agent wallet to track transactions."
            action={<Button onClick={() => setModal('add-account')}><Plus className="w-4 h-4" /> Add Wallet</Button>} />
        </Card>
      ) : (
        <div className="space-y-3">
          {accounts.map(acc => (
            <Card key={acc.id} padding={false}>
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{acc.accountName}</span>
                      {acc.provider && <Badge color="green">{acc.provider}</Badge>}
                    </div>
                    <div className="text-xs text-gray-400">{acc.accountPhone}</div>
                    <div className="text-xl font-extrabold text-gray-900 mt-1">PKR {Number(acc.currentBalance).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => { setSelectedAccount(acc); setModal('add-txn') }}>
                    <Plus className="w-4 h-4" /> Transaction
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
                  <TxnPanel accountId={acc.id} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={modal === 'add-account'} onClose={closeModal} title="Add Wallet Account" size="sm">
        <AddAccountModal onClose={closeModal} />
      </Modal>
      <Modal open={modal === 'add-txn' && !!selectedAccount} onClose={closeModal} title="Add Transaction">
        {selectedAccount && <AddTxnModal account={selectedAccount} onClose={closeModal} />}
      </Modal>
    </div>
  )
}
