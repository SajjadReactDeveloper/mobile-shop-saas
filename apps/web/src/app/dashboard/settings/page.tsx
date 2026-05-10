'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  Store, Users, CreditCard, Save, Plus, X,
  Loader2, ChevronDown, Trash2, CheckCircle,
} from 'lucide-react'

type UserRole = 'OWNER' | 'CASHIER' | 'TECHNICIAN'
type SubscriptionTier = 'FREE' | 'PRO' | 'BUSINESS'
type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'

interface ShopUser {
  id: string
  name: string
  email?: string
  phone?: string
  role: UserRole
  isActive: boolean
  createdAt: string
}

interface Subscription {
  tier: SubscriptionTier
  status: SubscriptionStatus
  trialEnd?: string
  renewsAt?: string
}

interface Shop {
  id: string
  name: string
  city?: string
  address?: string
  phone?: string
  enabledModules: string[]
  subscription?: Subscription
}

const ROLE_COLORS: Record<UserRole, string> = {
  OWNER: 'bg-purple-100 text-purple-700',
  CASHIER: 'bg-blue-100 text-blue-700',
  TECHNICIAN: 'bg-orange-100 text-orange-700',
}
const TIER_COLORS: Record<SubscriptionTier, string> = {
  FREE: 'bg-gray-100 text-gray-700',
  PRO: 'bg-blue-100 text-blue-700',
  BUSINESS: 'bg-purple-100 text-purple-700',
}
const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  TRIALING: 'text-yellow-600',
  ACTIVE: 'text-green-600',
  PAST_DUE: 'text-red-600',
  CANCELED: 'text-gray-500',
}

const input  = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
const btn    = 'px-4 py-2 text-sm font-medium rounded-lg transition-colors'

type Tab = 'shop' | 'staff' | 'billing'

// ─── Shop Profile Tab ────────────────────────────────────────────────────────

function ShopTab({ shop }: { shop: Shop }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: shop.name,
    city: shop.city ?? '',
    address: shop.address ?? '',
    phone: shop.phone ?? '',
  })
  const [saved, setSaved] = useState(false)

  const mut = useMutation({
    mutationFn: (data: object) => api.patch('/shop', data).then(r => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['shop'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    mut.mutate({ name: form.name, city: form.city || undefined, address: form.address || undefined, phone: form.phone || undefined })
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">Shop Information</h3>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Shop Name *</label>
          <input className={input} required value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">City</label>
            <input className={input} value={form.city} onChange={e => set('city', e.target.value)} placeholder="Lahore" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Phone</label>
            <input className={input} type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="03001234567" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Address</label>
          <input className={input} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Shop address" />
        </div>
      </div>

      {mut.error && <p className="text-xs text-red-600">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to save'}</p>}

      <button type="submit" disabled={mut.isPending}
        className={btn + ' bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2'}>
        {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved!' : 'Save Changes'}
      </button>
    </form>
  )
}

// ─── Invite Modal ────────────────────────────────────────────────────────────

function InviteModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'CASHIER' as UserRole, password: '' })

  const mut = useMutation({
    mutationFn: (data: object) => api.post('/users/invite', data).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['staff'] }); onClose() },
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    mut.mutate({
      name: form.name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      role: form.role,
      password: form.password || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Add Staff Member</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="px-5 py-4 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Name *</label>
            <input className={input} required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ali Khan" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Email</label>
              <input className={input} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="ali@shop.com" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Phone</label>
              <input className={input} type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="03001234567" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Role *</label>
            <div className="relative">
              <select className={input + ' appearance-none pr-8'} value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="CASHIER">Cashier</option>
                <option value="TECHNICIAN">Technician</option>
                <option value="OWNER">Owner</option>
              </select>
              <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Password</label>
            <input className={input} type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Leave blank to send invite link" />
          </div>
          {mut.error && <p className="text-xs text-red-600">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed'}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className={btn + ' flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200'}>Cancel</button>
            <button type="submit" disabled={mut.isPending} className={btn + ' flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2'}>
              {mut.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Add Member
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Staff Tab ───────────────────────────────────────────────────────────────

function StaffTab() {
  const qc = useQueryClient()
  const [showInvite, setShowInvite] = useState(false)

  const { data: staff = [], isLoading } = useQuery<ShopUser[]>({
    queryKey: ['staff'],
    queryFn: () => api.get('/users').then(r => r.data),
  })

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      api.patch(`/users/${id}/role`, { role }).then(r => r.data),
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
        <button onClick={() => setShowInvite(true)} className={btn + ' bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2'}>
          <Plus className="w-4 h-4" /> Add Member
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
        ) : activeStaff.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No staff members yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {activeStaff.map(user => (
              <div key={user.id} className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-semibold text-sm shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-400">{user.email ?? user.phone ?? 'No contact'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select
                      value={user.role}
                      onChange={e => updateRole.mutate({ id: user.id, role: e.target.value as UserRole })}
                      className={`text-xs font-medium px-2 py-1 rounded-full border-0 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 pr-6 ${ROLE_COLORS[user.role]}`}>
                      <option value="CASHIER">Cashier</option>
                      <option value="TECHNICIAN">Technician</option>
                      <option value="OWNER">Owner</option>
                    </select>
                    <ChevronDown className="absolute right-1 top-1 w-3 h-3 pointer-events-none opacity-60" />
                  </div>
                  {user.role !== 'OWNER' && (
                    <button
                      onClick={() => { if (confirm(`Remove ${user.name} from the shop?`)) deactivate.mutate(user.id) }}
                      className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </div>
  )
}

// ─── Billing Tab ─────────────────────────────────────────────────────────────

function BillingTab({ shop }: { shop: Shop }) {
  const sub = shop.subscription
  const tier = sub?.tier ?? 'FREE'
  const status = sub?.status ?? 'TRIALING'

  const TIERS = [
    {
      id: 'FREE',
      name: 'Free',
      price: 'PKR 0/mo',
      features: ['1 user', 'Basic POS', 'Inventory', 'Customers'],
    },
    {
      id: 'PRO',
      name: 'Pro',
      price: 'PKR 1,999/mo',
      features: ['3 users', 'All modules', 'Easy Load', 'Easypaisa', 'Repairs', 'Reports'],
    },
    {
      id: 'BUSINESS',
      name: 'Business',
      price: 'PKR 4,999/mo',
      features: ['Unlimited users', 'All modules', 'Priority support', 'WhatsApp alerts'],
    },
  ]

  return (
    <div className="space-y-5">
      {/* Current plan */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Current Plan</h3>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${TIER_COLORS[tier]}`}>{tier}</span>
          <span className={`text-sm font-medium capitalize ${STATUS_COLORS[status]}`}>{status.toLowerCase().replace('_', ' ')}</span>
        </div>
        {sub?.trialEnd && status === 'TRIALING' && (
          <p className="text-xs text-gray-500 mt-2">
            Trial ends {new Date(sub.trialEnd).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
        {sub?.renewsAt && status === 'ACTIVE' && (
          <p className="text-xs text-gray-500 mt-2">
            Renews {new Date(sub.renewsAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {TIERS.map(t => {
          const isCurrent = tier === t.id
          return (
            <div key={t.id} className={`bg-white rounded-xl border-2 shadow-sm p-5 flex flex-col gap-3 ${isCurrent ? 'border-blue-500' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">{t.name}</span>
                {isCurrent && <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">Current</span>}
              </div>
              <div className="text-lg font-bold text-gray-900">{t.price}</div>
              <ul className="space-y-1.5 flex-1">
                {t.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {!isCurrent && t.id !== 'FREE' && (
                <button
                  onClick={async () => {
                    const priceId = t.id === 'PRO' ? process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID : process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID
                    if (!priceId) { alert('Stripe price not configured yet'); return }
                    const { data } = await api.post('/subscriptions/checkout', { priceId, returnUrl: window.location.href })
                    if (data.url) window.location.href = data.url
                  }}
                  className={btn + ' w-full bg-blue-600 text-white hover:bg-blue-700 text-sm'}>
                  Upgrade to {t.name}
                </button>
              )}
              {!isCurrent && t.id === 'FREE' && tier !== 'FREE' && (
                <p className="text-xs text-gray-400 text-center">Downgrade via Stripe portal</p>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-400">
        Payments processed by Stripe. Cancel anytime from the Stripe customer portal.
      </p>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('shop')

  const { data: shop, isLoading } = useQuery<Shop>({
    queryKey: ['shop'],
    queryFn: () => api.get('/shop').then(r => r.data),
  })

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'shop', label: 'Shop Profile', icon: Store },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ]

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your shop, staff and subscription</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`${btn} flex items-center gap-2 ${tab === id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : shop ? (
        <>
          {tab === 'shop'    && <ShopTab shop={shop} />}
          {tab === 'staff'   && <StaffTab />}
          {tab === 'billing' && <BillingTab shop={shop} />}
        </>
      ) : null}
    </div>
  )
}
