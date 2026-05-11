import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput,
} from 'react-native'
import { api } from '../lib/api'
import { SettingsScreenSkeleton } from '../components/Skeleton'

type UserRole = 'OWNER' | 'CASHIER' | 'TECHNICIAN'
type SubscriptionTier = 'FREE' | 'PRO' | 'BUSINESS'
type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'

interface Subscription { tier: SubscriptionTier; status: SubscriptionStatus; trialEnd?: string; renewsAt?: string }
interface Shop { id: string; name: string; city?: string; address?: string; phone?: string; subscription?: Subscription }
interface StaffUser { id: string; name: string; email?: string; phone?: string; role: UserRole; isActive: boolean }

const ROLE_LABEL: Record<UserRole, string> = { OWNER: 'Owner', CASHIER: 'Cashier', TECHNICIAN: 'Technician' }
const ROLE_COLOR: Record<UserRole, string> = { OWNER: '#7c3aed', CASHIER: '#7c3aed', TECHNICIAN: '#d97706' }
const ROLE_BG: Record<UserRole, string> = { OWNER: '#f5f3ff', CASHIER: '#f5f3ff', TECHNICIAN: '#fffbeb' }

const TIER_BADGE: Record<SubscriptionTier, { bg: string; text: string }> = {
  FREE:     { bg: '#f3f4f6', text: '#374151' },
  PRO:      { bg: '#dbeafe', text: '#1d4ed8' },
  BUSINESS: { bg: '#f3e8ff', text: '#6d28d9' },
}
const STATUS_COLOR: Record<SubscriptionStatus, string> = {
  TRIALING: '#d97706', ACTIVE: '#16a34a', PAST_DUE: '#dc2626', CANCELED: '#6b7280',
}
const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  TRIALING: 'Trial', ACTIVE: 'Active', PAST_DUE: 'Past Due', CANCELED: 'Canceled',
}

interface Props { onLogout: () => void }

export function SettingsScreen({ onLogout }: Props) {
  const [tab, setTab] = useState<'shop' | 'staff' | 'billing'>('shop')
  const [shop, setShop] = useState<Shop | null>(null)
  const [staff, setStaff] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Shop form
  const [form, setForm] = useState({ name: '', city: '', address: '', phone: '' })
  const [saved, setSaved] = useState(false)

  const loadAll = useCallback(async () => {
    try {
      const [sh, st] = await Promise.all([
        api.get('/shop').then(r => r.data),
        api.get('/users').then(r => r.data),
      ])
      setShop(sh)
      setStaff(st)
      setForm({ name: sh.name ?? '', city: sh.city ?? '', address: sh.address ?? '', phone: sh.phone ?? '' })
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void loadAll() }, [loadAll])

  const saveShop = async () => {
    setSaving(true)
    try {
      await api.patch('/shop', {
        name: form.name,
        city: form.city || undefined,
        address: form.address || undefined,
        phone: form.phone || undefined,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to save')
    } finally { setSaving(false) }
  }

  const confirmLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: onLogout },
    ])
  }

  if (loading) return <SettingsScreenSkeleton />

  const sub = shop?.subscription
  const tier = sub?.tier ?? 'FREE'
  const status = sub?.status ?? 'TRIALING'
  const activeStaff = staff.filter(u => u.isActive)

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Settings</Text>
          <Text style={s.subtitle}>Manage your shop</Text>
        </View>
        <TouchableOpacity style={s.logoutBtn} onPress={confirmLogout}>
          <Text style={s.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabBar}>
        {([
          { id: 'shop',    label: '🏪 Shop'    },
          { id: 'staff',   label: '👥 Staff'   },
          { id: 'billing', label: '💳 Billing' },
        ] as const).map(t => (
          <TouchableOpacity
            key={t.id}
            style={[s.tabItem, tab === t.id && s.tabItemActive]}
            onPress={() => setTab(t.id)}
          >
            <Text style={[s.tabLabel, tab === t.id && s.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView>
        {/* ─── Shop Tab ──────────────────────────────── */}
        {tab === 'shop' && (
          <View style={s.tabContent}>
            <View style={s.card}>
              <Text style={s.cardTitle}>Shop Information</Text>

              <Text style={s.label}>Shop Name *</Text>
              <TextInput style={s.input} value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="My Mobile Shop" />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>City</Text>
                  <TextInput style={s.input} value={form.city} onChangeText={v => setForm(f => ({ ...f, city: v }))} placeholder="Lahore" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Phone</Text>
                  <TextInput style={s.input} keyboardType="phone-pad" value={form.phone} onChangeText={v => setForm(f => ({ ...f, phone: v }))} placeholder="03001234567" />
                </View>
              </View>

              <Text style={s.label}>Address</Text>
              <TextInput style={s.input} value={form.address} onChangeText={v => setForm(f => ({ ...f, address: v }))} placeholder="Shop address" />
            </View>

            <TouchableOpacity
              style={[s.saveBtn, (saving || saved) && s.saveBtnDim]}
              onPress={saveShop}
              disabled={saving}
            >
              <Text style={s.saveBtnText}>
                {saving ? 'Saving…' : saved ? '✅ Saved!' : '💾 Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Staff Tab ─────────────────────────────── */}
        {tab === 'staff' && (
          <View style={s.tabContent}>
            <Text style={s.sectionMeta}>{activeStaff.length} active member{activeStaff.length !== 1 ? 's' : ''}</Text>
            <View style={s.card}>
              {activeStaff.length === 0 ? (
                <Text style={s.empty}>No staff members yet.</Text>
              ) : activeStaff.map((user, i) => (
                <View key={user.id} style={[s.staffRow, i > 0 && s.staffRowBorder]}>
                  <View style={s.staffAvatar}>
                    <Text style={s.staffAvatarText}>{user.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.staffName}>{user.name}</Text>
                    <Text style={s.staffContact}>{user.email ?? user.phone ?? 'No contact'}</Text>
                  </View>
                  <View style={[s.roleBadge, { backgroundColor: ROLE_BG[user.role] }]}>
                    <Text style={[s.roleText, { color: ROLE_COLOR[user.role] }]}>{ROLE_LABEL[user.role]}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={s.infoBox}>
              <Text style={s.infoText}>👉 To add or manage staff, use the web dashboard at mobile-shop-saas-web.vercel.app</Text>
            </View>
          </View>
        )}

        {/* ─── Billing Tab ───────────────────────────── */}
        {tab === 'billing' && (
          <View style={s.tabContent}>
            <View style={s.card}>
              <Text style={s.cardTitle}>Current Plan</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
                <View style={[s.tierBadge, { backgroundColor: TIER_BADGE[tier].bg }]}>
                  <Text style={[s.tierText, { color: TIER_BADGE[tier].text }]}>{tier}</Text>
                </View>
                <Text style={[s.statusText, { color: STATUS_COLOR[status] }]}>{STATUS_LABEL[status]}</Text>
              </View>
              {sub?.trialEnd && status === 'TRIALING' && (
                <Text style={s.renewsText}>
                  Trial ends {new Date(sub.trialEnd).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              )}
              {sub?.renewsAt && status === 'ACTIVE' && (
                <Text style={s.renewsText}>
                  Renews {new Date(sub.renewsAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              )}
            </View>

            {/* Tier comparison */}
            {([
              { id: 'FREE',     name: 'Free',     price: 'PKR 0',     period: 'forever',   features: ['1 user', 'Basic POS & Inventory', 'Customer ledger'] },
              { id: 'PRO',      name: 'Pro',       price: 'PKR 1,999', period: '/month',    features: ['3 users', 'All 8 modules', 'Easy Load & Easypaisa', 'WhatsApp alerts'] },
              { id: 'BUSINESS', name: 'Business',  price: 'PKR 4,999', period: '/month',    features: ['Unlimited users', 'All modules', 'Priority support', 'WhatsApp alerts'] },
            ] as { id: string; name: string; price: string; period: string; features: string[] }[]).map(t => (
              <View key={t.id} style={[s.tierCard, tier === t.id && s.tierCardActive]}>
                {tier === t.id && (
                  <View style={s.currentPlanBadge}><Text style={s.currentPlanText}>Current Plan</Text></View>
                )}
                <Text style={s.tierName}>{t.name}</Text>
                <Text style={s.tierPrice}>{t.price} <Text style={s.tierPeriod}>{t.period}</Text></Text>
                {t.features.map(f => (
                  <Text key={f} style={s.tierFeature}>✓ {f}</Text>
                ))}
              </View>
            ))}

            <View style={s.infoBox}>
              <Text style={s.infoText}>💳 To upgrade your plan, visit the web dashboard at mobile-shop-saas-web.vercel.app/dashboard/settings</Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f3f4f6' },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 52, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title:            { fontSize: 20, fontWeight: '700', color: '#111827' },
  subtitle:         { fontSize: 12, color: '#6b7280', marginTop: 2 },
  logoutBtn:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fef2f2' },
  logoutText:       { color: '#dc2626', fontWeight: '700', fontSize: 13 },
  tabBar:           { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingHorizontal: 16, paddingTop: 8 },
  tabItem:          { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive:    { borderBottomColor: '#7c3aed' },
  tabLabel:         { fontSize: 12, fontWeight: '600', color: '#9ca3af' },
  tabLabelActive:   { color: '#7c3aed' },
  tabContent:       { padding: 12 },
  card:             { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  cardTitle:        { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  label:            { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 4, marginTop: 12 },
  input:            { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827', backgroundColor: '#f9fafb' },
  saveBtn:          { backgroundColor: '#7c3aed', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  saveBtnDim:       { backgroundColor: '#16a34a' },
  saveBtnText:      { color: '#fff', fontWeight: '700', fontSize: 15 },
  sectionMeta:      { fontSize: 13, color: '#6b7280', marginBottom: 8, paddingHorizontal: 4 },
  empty:            { textAlign: 'center', color: '#9ca3af', fontSize: 14, paddingVertical: 20 },
  staffRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  staffRowBorder:   { borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  staffAvatar:      { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  staffAvatarText:  { fontSize: 16, fontWeight: '700', color: '#475569' },
  staffName:        { fontSize: 14, fontWeight: '600', color: '#111827' },
  staffContact:     { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  roleBadge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  roleText:         { fontSize: 11, fontWeight: '700' },
  infoBox:          { backgroundColor: '#f5f3ff', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#bfdbfe' },
  infoText:         { fontSize: 13, color: '#1e40af', lineHeight: 20 },
  // Billing
  statusText:       { fontSize: 14, fontWeight: '700' },
  renewsText:       { fontSize: 12, color: '#6b7280', marginTop: 8 },
  tierBadge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tierText:         { fontSize: 12, fontWeight: '800' },
  tierCard:         { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1.5, borderColor: '#e5e7eb' },
  tierCardActive:   { borderColor: '#7c3aed', backgroundColor: '#f5f3ff' },
  currentPlanBadge: { backgroundColor: '#16a34a', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 8 },
  currentPlanText:  { color: '#fff', fontSize: 11, fontWeight: '700' },
  tierName:         { fontSize: 16, fontWeight: '800', color: '#111827' },
  tierPrice:        { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 4 },
  tierPeriod:       { fontSize: 13, color: '#9ca3af', fontWeight: '400' },
  tierFeature:      { fontSize: 13, color: '#374151', marginTop: 6 },
})
