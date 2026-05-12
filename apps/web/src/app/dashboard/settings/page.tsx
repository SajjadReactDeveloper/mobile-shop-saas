'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Save, Plus, CheckCircle, ChevronDown, Trash2 } from 'lucide-react'
import { Button, Card, Badge, Modal, Input, Select, PageHeader, Tabs, ListSkeleton, StatsSkeleton } from '@/components/ui'

type UserRole = 'OWNER' | 'CASHIER' | 'TECHNICIAN'
type SubscriptionTier = 'FREE' | 'PRO' | 'BUSINESS'
type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'

interface ShopUser { id: string; name: string; email?: string; phone?: string; role: UserRole; isActive: boolean; createdAt: string }
interface Subscription { tier: SubscriptionTier; status: SubscriptionStatus; trialEnd?: string; renewsAt?: string }
interface Shop { id: string; name: string; city?: string; address?: string; phone?: string; enabledModules: string[]; subscription?: Subscription }

const TIER_COLOR: Record<SubscriptionTier, 'gray' | 'blue' | 'purple'> = { FREE: 'gray', PRO: 'blue', BUSINESS: 'purple' }
const STATUS_COLOR: Record<SubscriptionStatus, string> = {
  TRIALING: 'text-yellow-600', ACTIVE: 'text-emerald-600', PAST_DUE: 'text-red-600', CANCELED: 'text-gray-400',
}

/* ─── Shop Profile Tab ─── */
function ShopTab({ shop }: { shop: Shop }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: shop.name, city: shop.city ?? '', address: shop.address ?? '', phone: shop.phone ?? '' })
  const [saved, setSaved] = useState(false)
  const mut = useMutation({
    mutationFn: (d: object) => api.patch('/shop', d).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['shop'] }); setSaved(true); setTimeout(() => setSaved(false), 2500) },
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const submit = (e: React.FormEvent) => { e.preventDefault(); mut.mutate({ name: form.name, city: form.city || undefined, address: form.address || undefined, phone: form.phone || undefined }) }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Card>
        <h3 className="text-sm font-bold text-gray-800 mb-4">Shop Information</h3>
        <div className="space-y-4">
          <Input label="Shop Name *" required value={form.name} onChange={e => set('name', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="City" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Lahore" />
            <Input label="Phone" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="03001234567" />
          </div>
          <Input label="Address" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Shop address" />
        </div>
      </Card>
      {mut.error && <p className="text-xs text-red-500">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to save'}</p>}
      <Button type="submit" loading={mut.isPending}>
        {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
      </Button>
    </form>
  )
}

/* ─── Invite Modal ─── */
function InviteModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'CASHIER' as UserRole, password: '' })
  const mut = useMutation({
    mutationFn: (d: object) => api.post('/users/invite', d).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['staff'] }); onClose() },
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    mut.mutate({ name: form.name, email: form.email || undefined, phone: form.phone || undefined, role: form.role, password: form.password || undefined })
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <Input label="Name *" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ali Khan" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="ali@shop.com" />
        <Input label="Phone" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="03001234567" />
      </div>
      <Select label="Role *" value={form.role} onChange={e => set('role', e.target.value)}>
        <option value="CASHIER">Cashier</option>
        <option value="TECHNICIAN">Technician</option>
        <option value="OWNER">Owner</option>
      </Select>
      <Input label="Password" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Leave blank to send invite link" />
      {mut.error && <p className="text-xs text-red-500">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed'}</p>}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="flex-1" loading={mut.isPending}>Add Member</Button>
      </div>
    </form>
  )
}

/* ─── Staff Tab ─── */
function StaffTab() {
  const qc = useQueryClient()
  const [showInvite, setShowInvite] = useState(false)
  const { data: staff = [], isLoading } = useQuery<ShopUser[]>({
    queryKey: ['staff'],
    queryFn: () => api.get('/users').then(r => r.data),
  })
  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => api.patch(`/users/${id}/role`, { role }).then(r => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['staff'] }),
  })
  const deactivate = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`).then(r => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['staff'] }),
  })
  const activeStaff = staff.filter(u => u.isActive)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{activeStaff.length} active member{activeStaff.length !== 1 ? 's' : ''}</p>
        <Button size="sm" onClick={() => setShowInvite(true)}><Plus className="w-4 h-4" /> Add Member</Button>
      </div>

      <Card padding={false}>
        {isLoading ? <ListSkeleton rows={4} /> : activeStaff.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No staff members yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {activeStaff.map(user => (
              <div key={user.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-400">{user.email ?? user.phone ?? 'No contact'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select value={user.role} onChange={e => updateRole.mutate({ id: user.id, role: e.target.value as UserRole })}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500 pr-7 border-0 ${
                        user.role === 'OWNER' ? 'bg-purple-50 text-purple-700' : user.role === 'CASHIER' ? 'bg-violet-50 text-violet-700' : 'bg-orange-50 text-orange-700'
                      }`}>
                      <option value="CASHIER">Cashier</option>
                      <option value="TECHNICIAN">Technician</option>
                      <option value="OWNER">Owner</option>
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1.5 w-3 h-3 pointer-events-none opacity-60" />
                  </div>
                  {user.role !== 'OWNER' && (
                    <button onClick={() => { if (confirm(`Remove ${user.name}?`)) deactivate.mutate(user.id) }}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Add Staff Member">
        <InviteModal onClose={() => setShowInvite(false)} />
      </Modal>
    </div>
  )
}

/* ─── Billing Tab ─── */
function BillingTab({ shop }: { shop: Shop }) {
  const sub = shop.subscription
  const tier = sub?.tier ?? 'FREE'
  const status = sub?.status ?? 'TRIALING'

  const TIERS = [
    { id: 'FREE',     name: 'Free',     price: 'PKR 0',     period: 'forever',   features: ['1 user account', 'Basic POS & Inventory', 'Customer ledger'], highlight: false },
    { id: 'PRO',      name: 'Pro',      price: 'PKR 1,999', period: 'per month', features: ['3 user accounts', 'All 8 modules', 'Easy Load & Easypaisa', 'WhatsApp alerts'], highlight: true },
    { id: 'BUSINESS', name: 'Business', price: 'PKR 4,999', period: 'per month', features: ['Unlimited users', 'All modules', 'Priority support', 'WhatsApp alerts'], highlight: false },
  ]

  const handleUpgrade = async (tierId: string) => {
    const priceId = tierId === 'PRO' ? process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID : process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID
    if (!priceId) { alert('Stripe price not configured yet'); return }
    const { data } = await api.post('/subscriptions/checkout', { priceId, returnUrl: window.location.href })
    if (data.url) window.location.assign(data.url as string)
  }

  const handlePortal = async () => {
    try {
      const { data } = await api.post<{ url: string | null }>('/subscriptions/portal', { returnUrl: window.location.href })
      if (data.url) window.location.assign(data.url)
      else alert('No active subscription found. Please upgrade first.')
    } catch { alert('Could not open billing portal. Please try again.') }
  }

  return (
    <div className="space-y-5">
      <Card>
        <h3 className="text-sm font-bold text-gray-800 mb-3">Current Plan</h3>
        <div className="flex items-center gap-3">
          <Badge color={TIER_COLOR[tier]}>{tier}</Badge>
          <span className={`text-sm font-semibold capitalize ${STATUS_COLOR[status]}`}>{status.toLowerCase().replace('_', ' ')}</span>
        </div>
        {sub?.trialEnd && status === 'TRIALING' && (
          <p className="text-xs text-gray-500 mt-2">Trial ends {new Date(sub.trialEnd).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        )}
        {sub?.renewsAt && status === 'ACTIVE' && (
          <p className="text-xs text-gray-500 mt-2">Renews {new Date(sub.renewsAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {TIERS.map(t => {
          const isCurrent = tier === t.id
          return (
            <div key={t.id} className={`bg-white rounded-2xl border-2 p-6 flex flex-col gap-4 relative ${isCurrent ? 'border-violet-500 shadow-lg shadow-violet-100' : t.highlight ? 'border-gray-200 shadow-sm' : 'border-gray-200'}`}>
              {t.highlight && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">Current Plan</div>
              )}
              <div>
                <div className="font-bold text-gray-900 text-lg">{t.name}</div>
                <div className="mt-1">
                  <span className="text-2xl font-extrabold text-gray-900">{t.price}</span>
                  <span className="text-gray-400 text-sm ml-1">/ {t.period}</span>
                </div>
              </div>
              <ul className="space-y-2 flex-1">
                {t.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {!isCurrent && t.id !== 'FREE' && (
                <Button className="w-full" onClick={() => handleUpgrade(t.id)}>Upgrade to {t.name}</Button>
              )}
              {!isCurrent && t.id === 'FREE' && tier !== 'FREE' && (
                <p className="text-xs text-gray-400 text-center">Downgrade via Stripe portal</p>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div>
          <p className="text-sm font-semibold text-gray-800">Manage Subscription</p>
          <p className="text-xs text-gray-500">Update payment method, view invoices, or cancel</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handlePortal}>Open Billing Portal</Button>
      </div>
      <p className="text-xs text-gray-400">Payments processed by Stripe. Cancel anytime.</p>
    </div>
  )
}

/* ─── Main Page ─── */
export default function SettingsPage() {
  const [tab, setTab] = useState('shop')
  const { data: shop, isLoading } = useQuery<Shop>({
    queryKey: ['shop'],
    queryFn: () => api.get('/shop').then(r => r.data),
  })

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader title="Settings" subtitle="Manage your shop, staff and subscription" />

      <Tabs
        tabs={[
          { key: 'shop',    label: '🏪 Shop Profile' },
          { key: 'staff',   label: '👥 Staff' },
          { key: 'billing', label: '💳 Billing' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {isLoading ? <StatsSkeleton count={3} /> : shop ? (
        <>
          {tab === 'shop'    && <ShopTab shop={shop} />}
          {tab === 'staff'   && <StaffTab />}
          {tab === 'billing' && <BillingTab shop={shop} />}
        </>
      ) : null}
    </div>
  )
}
