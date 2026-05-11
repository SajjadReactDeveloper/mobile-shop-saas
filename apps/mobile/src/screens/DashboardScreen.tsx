import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native'
import { api } from '../lib/api'
import { DashboardScreenSkeleton } from '../components/Skeleton'

interface Stats { products?: number; pendingRepairs?: number; customers?: number }
interface Summary { totalRevenue?: number; grossProfit?: number; totalSales?: number }
interface LowStock { id: string; name: string; stockQty: number }

export function DashboardScreen() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [today, setToday] = useState<Summary | null>(null)
  const [lowStock, setLowStock] = useState<LowStock[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const todayDate = new Date().toISOString().split('T')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const greetingEmoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙'

  const load = useCallback(async () => {
    try {
      const [s, t, l] = await Promise.all([
        api.get('/shop/stats').then(r => r.data),
        api.get(`/sales/daily-summary?date=${todayDate}`).then(r => r.data),
        api.get('/inventory/low-stock').then(r => r.data),
      ])
      setStats(s)
      setToday(t)
      setLowStock(l)
    } catch { /* pull-to-refresh */ }
    finally { setLoading(false) }
  }, [todayDate])

  useEffect(() => { void load() }, [load])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  if (loading) return <DashboardScreenSkeleton />

  const kpis = [
    { label: "Revenue",    value: `PKR ${(today?.totalRevenue ?? 0).toLocaleString()}`, sub: `${today?.totalSales ?? 0} sales today`, emoji: '💰', bg: '#f5f3ff', color: '#7c3aed' },
    { label: "Profit",     value: `PKR ${(today?.grossProfit ?? 0).toLocaleString()}`,  sub: 'Gross today',         emoji: '📈', bg: '#f0fdf4', color: '#16a34a' },
    { label: "Products",   value: String(stats?.products ?? '—'),                        sub: 'In inventory',        emoji: '📦', bg: '#fffbeb', color: '#d97706' },
    { label: "Repairs",    value: String(stats?.pendingRepairs ?? '—'),                  sub: 'Pending jobs',        emoji: '🔧', bg: '#fff1f2', color: '#e11d48' },
    { label: "Customers",  value: String(stats?.customers ?? '—'),                       sub: 'Registered',          emoji: '👥', bg: '#ecfeff', color: '#0891b2' },
  ]

  return (
    <ScrollView
      style={s.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" colors={['#7c3aed']} />}
    >
      {/* Violet header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.greetRow}>{greetingEmoji} {greeting}</Text>
            <Text style={s.headerDate}>
              {new Date().toLocaleDateString('en-PK', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          <View style={s.shopBadge}>
            <Text style={s.shopBadgeText}>Live</Text>
            <View style={s.liveDot} />
          </View>
        </View>

        {/* Revenue highlight */}
        <View style={s.revenueBox}>
          <Text style={s.revenueLabel}>Today's Revenue</Text>
          <Text style={s.revenueValue}>PKR {(today?.totalRevenue ?? 0).toLocaleString()}</Text>
          <Text style={s.revenueSub}>{today?.totalSales ?? 0} transaction{today?.totalSales !== 1 ? 's' : ''} · PKR {(today?.grossProfit ?? 0).toLocaleString()} profit</Text>
        </View>
      </View>

      {/* KPI grid */}
      <View style={s.grid}>
        {kpis.slice(2).map(k => (
          <View key={k.label} style={[s.kpiCard, { backgroundColor: k.bg }]}>
            <Text style={s.kpiEmoji}>{k.emoji}</Text>
            <Text style={[s.kpiValue, { color: k.color }]}>{k.value}</Text>
            <Text style={s.kpiLabel}>{k.label}</Text>
            <Text style={s.kpiSub}>{k.sub}</Text>
          </View>
        ))}
      </View>

      {/* Low stock */}
      {lowStock.length > 0 && (
        <View style={s.alertCard}>
          <View style={s.alertHeader}>
            <Text style={s.alertIcon}>⚠️</Text>
            <Text style={s.alertTitle}>Low Stock Alert</Text>
            <View style={s.alertBadge}>
              <Text style={s.alertBadgeText}>{lowStock.length}</Text>
            </View>
          </View>
          {lowStock.slice(0, 4).map(p => (
            <View key={p.id} style={s.alertRow}>
              <Text style={s.alertName} numberOfLines={1}>{p.name}</Text>
              <Text style={s.alertQty}>{p.stockQty} left</Text>
            </View>
          ))}
          {lowStock.length > 4 && (
            <Text style={s.alertMore}>+{lowStock.length - 4} more items…</Text>
          )}
        </View>
      )}

      {/* Quick actions */}
      <Text style={s.sectionTitle}>Quick Actions</Text>
      <View style={s.actionsRow}>
        {[
          { emoji: '🛒', label: 'New Sale', bg: '#f5f3ff', color: '#7c3aed' },
          { emoji: '📦', label: 'Add Stock', bg: '#f0fdf4', color: '#16a34a' },
          { emoji: '🔧', label: 'New Repair', bg: '#fffbeb', color: '#d97706' },
          { emoji: '👤', label: 'Customer', bg: '#ecfeff', color: '#0891b2' },
        ].map(a => (
          <TouchableOpacity key={a.label} style={[s.actionBtn, { backgroundColor: a.bg }]} activeOpacity={0.7}>
            <Text style={s.actionEmoji}>{a.emoji}</Text>
            <Text style={[s.actionLabel, { color: a.color }]}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#faf9ff' },

  // Header
  header:         { backgroundColor: '#7c3aed', paddingTop: 52, paddingHorizontal: 20, paddingBottom: 24 },
  headerTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greetRow:       { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  headerDate:     { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  shopBadge:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  shopBadgeText:  { fontSize: 11, fontWeight: '700', color: '#fff' },
  liveDot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  revenueBox:     { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 18, padding: 18 },
  revenueLabel:   { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 4 },
  revenueValue:   { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  revenueSub:     { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  // KPI grid
  grid:           { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  kpiCard:        { flex: 1, minWidth: '28%', borderRadius: 16, padding: 14 },
  kpiEmoji:       { fontSize: 22, marginBottom: 6 },
  kpiValue:       { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  kpiLabel:       { fontSize: 12, fontWeight: '700', color: '#374151', marginTop: 4 },
  kpiSub:         { fontSize: 10, color: '#9ca3af', marginTop: 2 },

  // Low stock
  alertCard:      { marginHorizontal: 12, marginBottom: 12, backgroundColor: '#fffbeb', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#fde68a' },
  alertHeader:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 },
  alertIcon:      { fontSize: 16 },
  alertTitle:     { fontSize: 14, fontWeight: '700', color: '#92400e', flex: 1 },
  alertBadge:     { backgroundColor: '#f59e0b', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  alertBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  alertRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5, borderTopWidth: 1, borderTopColor: '#fef3c7' },
  alertName:      { fontSize: 13, color: '#78350f', flex: 1 },
  alertQty:       { fontSize: 12, fontWeight: '700', color: '#dc2626' },
  alertMore:      { fontSize: 12, color: '#9ca3af', marginTop: 6, textAlign: 'center' },

  // Quick actions
  sectionTitle:   { fontSize: 13, fontWeight: '700', color: '#374151', marginHorizontal: 16, marginBottom: 10 },
  actionsRow:     { flexDirection: 'row', marginHorizontal: 12, gap: 8 },
  actionBtn:      { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', gap: 6 },
  actionEmoji:    { fontSize: 22 },
  actionLabel:    { fontSize: 10, fontWeight: '700', textAlign: 'center' },
})
