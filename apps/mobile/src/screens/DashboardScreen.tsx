import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native'
import { api } from '../lib/api'
import { DashboardScreenSkeleton } from '../components/Skeleton'
import { STATUS_TOP } from '../lib/constants'

type AnyScreen = 'pos' | 'inventory' | 'customers' | 'repairs' | 'easyload' | 'easypaisa' | 'cash' | 'settings' | 'more'

interface Props { onNavigate: (s: AnyScreen) => void }
interface Stats   { products?: number; pendingRepairs?: number; customers?: number }
interface Summary { totalRevenue?: number; grossProfit?: number; totalSales?: number }
interface LowStock { id: string; name: string; stockQty: number }
interface Sale {
  id: string; invoiceNumber: string; total: string | number
  paymentMethod: string; createdAt: string
  customer?: { name: string } | null
  items: { qty: number; product: { name: string } }[]
}
interface Profile { name: string; shop: { name: string } }

export function DashboardScreen({ onNavigate }: Props) {
  const [stats, setStats]       = useState<Stats | null>(null)
  const [today, setToday]       = useState<Summary | null>(null)
  const [lowStock, setLowStock] = useState<LowStock[]>([])
  const [recentSales, setRecentSales] = useState<Sale[]>([])
  const [profile, setProfile]   = useState<Profile | null>(null)
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const todayDate = new Date().toISOString().split('T')[0]
  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const load = useCallback(async () => {
    try {
      const [statsR, todayR, lowR, salesR, profileR] = await Promise.all([
        api.get('/shop/stats').then(r => r.data),
        api.get(`/sales/daily-summary?date=${todayDate}`).then(r => r.data),
        api.get('/inventory/low-stock').then(r => r.data),
        api.get('/sales?limit=5').then(r => r.data),
        api.get('/auth/me').then(r => r.data),
      ])
      setStats(statsR)
      setToday(todayR)
      setLowStock(lowR)
      setRecentSales(Array.isArray(salesR) ? salesR.slice(0, 5) : [])
      setProfile(profileR)
    } catch { /* pull-to-refresh */ }
    finally   { setLoading(false) }
  }, [todayDate])

  useEffect(() => { void load() }, [load])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  if (loading) return <DashboardScreenSkeleton />

  const profit   = today?.grossProfit ?? 0
  const revenue  = today?.totalRevenue ?? 0
  const salesCnt = today?.totalSales ?? 0

  const PAY_ICON: Record<string, string> = {
    CASH: 'ðŸ’µ', EASYPAISA: 'ðŸ’š', JAZZCASH: 'ðŸ”´', BANK_TRANSFER: 'ðŸ¦', CREDIT: 'ðŸ“’',
  }

  return (
    <ScrollView
      style={s.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0d9488" colors={['#0d9488']} />
      }
    >
      {/* â”€â”€ Violet header â”€â”€ */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <View style={s.headerLeft}>
            <Text style={s.shopName} numberOfLines={1}>{profile?.shop?.name ?? 'Mobile Shop'}</Text>
            <Text style={s.greeting}>{greeting}, {profile?.name?.split(' ')[0] ?? ''} ðŸ‘‹</Text>
          </View>
          {/* Profile avatar â†’ More */}
          <TouchableOpacity style={s.avatarBtn} onPress={() => onNavigate('more')} activeOpacity={0.8}>
            <Text style={s.avatarText}>
              {profile?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Today revenue hero */}
        <View style={s.heroBox}>
          <View style={s.heroLeft}>
            <Text style={s.heroLabel}>Today's Revenue</Text>
            <Text style={s.heroValue}>PKR {revenue.toLocaleString()}</Text>
            <Text style={s.heroSub}>
              {salesCnt} sale{salesCnt !== 1 ? 's' : ''} Â· PKR {profit.toLocaleString()} profit
            </Text>
          </View>
          <View style={s.heroRight}>
            <View style={s.heroBadge}>
              <View style={s.liveDot} />
              <Text style={s.liveText}>LIVE</Text>
            </View>
            <Text style={s.heroDate}>
              {new Date().toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
            </Text>
          </View>
        </View>
      </View>

      {/* â”€â”€ Stats row â”€â”€ */}
      <View style={s.statsRow}>
        {[
          { label: 'Products',  value: String(stats?.products ?? 0),        emoji: 'ðŸ“¦', color: '#d97706', bg: '#fffbeb', nav: 'inventory' },
          { label: 'Customers', value: String(stats?.customers ?? 0),        emoji: 'ðŸ‘¥', color: '#0891b2', bg: '#ecfeff', nav: 'customers' },
          { label: 'Repairs',   value: String(stats?.pendingRepairs ?? 0),   emoji: 'ðŸ”§', color: '#e11d48', bg: '#fff1f2', nav: 'repairs'   },
        ].map(k => (
          <TouchableOpacity
            key={k.label}
            style={[s.statCard, { backgroundColor: k.bg }]}
            onPress={() => onNavigate(k.nav as AnyScreen)}
            activeOpacity={0.75}
          >
            <Text style={s.statEmoji}>{k.emoji}</Text>
            <Text style={[s.statValue, { color: k.color }]}>{k.value}</Text>
            <Text style={s.statLabel}>{k.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* â”€â”€ Quick actions â”€â”€ */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.actionsGrid}>
          {[
            { emoji: 'ðŸ›’', label: 'New Sale',    nav: 'pos',       bg: '#f0fdfa', color: '#0d9488' },
            { emoji: 'ðŸ“¦', label: 'Add Stock',   nav: 'inventory', bg: '#f0fdf4', color: '#16a34a' },
            { emoji: 'ðŸ”§', label: 'New Repair',  nav: 'repairs',   bg: '#fffbeb', color: '#d97706' },
            { emoji: 'ðŸ’µ', label: 'Cash Reg.',   nav: 'cash',      bg: '#f0fdfa', color: '#0f766e' },
            { emoji: 'ðŸ‘¤', label: 'Customers',   nav: 'customers', bg: '#ecfeff', color: '#0891b2' },
            { emoji: 'ðŸ“±', label: 'Easy Load',   nav: 'easyload',  bg: '#fdf4ff', color: '#a21caf' },
          ].map(a => (
            <TouchableOpacity
              key={a.label}
              style={[s.actionBtn, { backgroundColor: a.bg }]}
              onPress={() => onNavigate(a.nav as AnyScreen)}
              activeOpacity={0.75}
            >
              <Text style={s.actionEmoji}>{a.emoji}</Text>
              <Text style={[s.actionLabel, { color: a.color }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* â”€â”€ Low stock alert â”€â”€ */}
      {lowStock.length > 0 && (
        <TouchableOpacity style={s.alertCard} onPress={() => onNavigate('inventory')} activeOpacity={0.85}>
          <View style={s.alertRow}>
            <Text style={s.alertIcon}>âš ï¸</Text>
            <Text style={s.alertTitle}>Low Stock â€” {lowStock.length} item{lowStock.length !== 1 ? 's' : ''}</Text>
            <Text style={s.alertArrow}>â€º</Text>
          </View>
          {lowStock.slice(0, 3).map(p => (
            <View key={p.id} style={s.alertItem}>
              <Text style={s.alertName} numberOfLines={1}>{p.name}</Text>
              <Text style={s.alertQty}>{p.stockQty} left</Text>
            </View>
          ))}
          {lowStock.length > 3 && (
            <Text style={s.alertMore}>+{lowStock.length - 3} more â†’ tap to view all</Text>
          )}
        </TouchableOpacity>
      )}

      {/* â”€â”€ Recent sales â”€â”€ */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Recent Sales</Text>
          <TouchableOpacity onPress={() => onNavigate('pos')}>
            <Text style={s.sectionLink}>New sale â†’</Text>
          </TouchableOpacity>
        </View>

        {recentSales.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyEmoji}>ðŸ›’</Text>
            <Text style={s.emptyText}>No sales yet today</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => onNavigate('pos')}>
              <Text style={s.emptyBtnText}>Make first sale</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.salesCard}>
            {recentSales.map((sale, idx) => {
              const firstItem = sale.items?.[0]
              const itemLabel = firstItem
                ? `${firstItem.product.name}${sale.items.length > 1 ? ` +${sale.items.length - 1}` : ''}`
                : 'Sale'
              const payIcon = PAY_ICON[sale.paymentMethod] ?? 'ðŸ’³'
              return (
                <View key={sale.id} style={[s.saleRow, idx > 0 && s.saleRowBorder]}>
                  <View style={s.saleIconWrap}>
                    <Text style={s.salePayIcon}>{payIcon}</Text>
                  </View>
                  <View style={s.saleInfo}>
                    <Text style={s.saleInv}>{sale.invoiceNumber}</Text>
                    <Text style={s.saleItem} numberOfLines={1}>{itemLabel}</Text>
                    {sale.customer && <Text style={s.saleCust}>{sale.customer.name}</Text>}
                  </View>
                  <View style={s.saleRight}>
                    <Text style={s.saleAmount}>PKR {Number(sale.total).toLocaleString()}</Text>
                    <Text style={s.saleTime}>
                      {new Date(sale.createdAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f0fdfa' },

  // Header
  header:       { backgroundColor: '#0d9488', paddingTop: STATUS_TOP, paddingHorizontal: 18, paddingBottom: 20 },
  headerRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerLeft:   { flex: 1, paddingRight: 12 },
  shopName:     { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.75)', letterSpacing: 0.3 },
  greeting:     { fontSize: 18, fontWeight: '800', color: '#fff', marginTop: 2 },
  avatarBtn:    { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' },
  avatarText:   { fontSize: 18, fontWeight: '800', color: '#fff' },

  heroBox:      { backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'flex-start' },
  heroLeft:     { flex: 1 },
  heroLabel:    { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 },
  heroValue:    { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -1, marginTop: 4 },
  heroSub:      { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 6 },
  heroRight:    { alignItems: 'flex-end', gap: 8 },
  heroBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  liveDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  liveText:     { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  heroDate:     { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },

  // Stats
  statsRow:     { flexDirection: 'row', paddingHorizontal: 14, paddingTop: 14, gap: 10 },
  statCard:     { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center' },
  statEmoji:    { fontSize: 24, marginBottom: 6 },
  statValue:    { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLabel:    { fontSize: 11, fontWeight: '600', color: '#6b7280', marginTop: 3 },

  // Actions
  section:      { paddingHorizontal: 14, paddingTop: 16 },
  sectionHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  sectionLink:  { fontSize: 13, color: '#0d9488', fontWeight: '600' },
  actionsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn:    { width: '30.5%', aspectRatio: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionEmoji:  { fontSize: 26 },
  actionLabel:  { fontSize: 10, fontWeight: '700', textAlign: 'center' },

  // Low stock
  alertCard:    { marginHorizontal: 14, marginTop: 14, backgroundColor: '#fffbeb', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#fde68a' },
  alertRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 },
  alertIcon:    { fontSize: 16 },
  alertTitle:   { fontSize: 14, fontWeight: '700', color: '#92400e', flex: 1 },
  alertArrow:   { fontSize: 20, color: '#d97706' },
  alertItem:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5, borderTopWidth: 1, borderTopColor: '#fef3c7' },
  alertName:    { fontSize: 13, color: '#78350f', flex: 1 },
  alertQty:     { fontSize: 12, fontWeight: '700', color: '#dc2626' },
  alertMore:    { fontSize: 11, color: '#92400e', marginTop: 6, textAlign: 'center', fontWeight: '500' },

  // Recent sales
  emptyCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', gap: 8 },
  emptyEmoji:   { fontSize: 36 },
  emptyText:    { fontSize: 14, color: '#9ca3af' },
  emptyBtn:     { backgroundColor: '#0d9488', paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20, marginTop: 4 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  salesCard:    { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  saleRow:      { flexDirection: 'row', alignItems: 'center', padding: 13, gap: 10 },
  saleRowBorder:{ borderTopWidth: 1, borderTopColor: '#f0fdfa' },
  saleIconWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#f0fdfa', alignItems: 'center', justifyContent: 'center' },
  salePayIcon:  { fontSize: 18 },
  saleInfo:     { flex: 1 },
  saleInv:      { fontSize: 12, fontWeight: '700', color: '#0d9488' },
  saleItem:     { fontSize: 13, fontWeight: '600', color: '#111827', marginTop: 1 },
  saleCust:     { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  saleRight:    { alignItems: 'flex-end' },
  saleAmount:   { fontSize: 14, fontWeight: '800', color: '#111827' },
  saleTime:     { fontSize: 11, color: '#9ca3af', marginTop: 2 },
})
