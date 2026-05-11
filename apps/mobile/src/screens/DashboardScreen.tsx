import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native'
import { api } from '../lib/api'
import { DashboardScreenSkeleton } from '../components/Skeleton'

export function DashboardScreen() {
  const [stats, setStats] = useState<{ products?: number; pendingRepairs?: number; customers?: number } | null>(null)
  const [todaySummary, setTodaySummary] = useState<{ totalRevenue?: number; grossProfit?: number; totalSales?: number } | null>(null)
  const [lowStock, setLowStock] = useState<{ id: string; name: string; stockQty: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const hour = new Date().getHours()
  const greeting = hour < 12 ? '🌅 Good morning' : hour < 17 ? '☀️ Good afternoon' : '🌙 Good evening'

  const load = useCallback(async () => {
    try {
      const [s, t, l] = await Promise.all([
        api.get('/shop/stats').then((r) => r.data),
        api.get(`/sales/daily-summary?date=${today}`).then((r) => r.data),
        api.get('/inventory/low-stock').then((r) => r.data),
      ])
      setStats(s)
      setTodaySummary(t)
      setLowStock(l)
    } catch {
      // silently fail — pull to refresh
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => { void load() }, [load])

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false) }

  if (loading) return <DashboardScreenSkeleton />

  const cards = [
    { label: "Today's Revenue",  value: `PKR ${(todaySummary?.totalRevenue ?? 0).toLocaleString()}`,  sub: `${todaySummary?.totalSales ?? 0} transactions`, color: '#2563eb', bg: '#eff6ff' },
    { label: 'Gross Profit',     value: `PKR ${(todaySummary?.grossProfit ?? 0).toLocaleString()}`,   sub: 'Today',                                          color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Products',         value: String(stats?.products ?? '—'),                               sub: 'Active items',                                   color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'Pending Repairs',  value: String(stats?.pendingRepairs ?? '—'),                         sub: 'In progress',                                    color: '#d97706', bg: '#fffbeb' },
    { label: 'Customers',        value: String(stats?.customers ?? '—'),                              sub: 'Registered',                                     color: '#0891b2', bg: '#ecfeff' },
  ]

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
    >
      {/* Header */}
      <View style={s.header}>
        <Text style={s.greeting}>{greeting}</Text>
        <Text style={s.date}>
          {new Date().toLocaleDateString('en-PK', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      {/* Stat cards */}
      <View style={s.grid}>
        {cards.map((card) => (
          <View key={card.label} style={[s.card, { backgroundColor: card.bg }]}>
            <Text style={[s.cardValue, { color: card.color }]}>{card.value}</Text>
            <Text style={s.cardLabel}>{card.label}</Text>
            <Text style={s.cardSub}>{card.sub}</Text>
          </View>
        ))}
      </View>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <View style={s.alert}>
          <Text style={s.alertTitle}>⚠️ Low Stock — {lowStock.length} item{lowStock.length > 1 ? 's' : ''}</Text>
          {lowStock.slice(0, 5).map((p) => (
            <Text key={p.id} style={s.alertItem}>{p.name} — {p.stockQty} remaining</Text>
          ))}
        </View>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#f3f4f6' },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:     { padding: 20, paddingTop: 52, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  greeting:   { fontSize: 22, fontWeight: '800', color: '#111827' },
  date:       { fontSize: 13, color: '#6b7280', marginTop: 4 },
  grid:       { flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 0 },
  card:       { width: '46%', margin: '2%', borderRadius: 14, padding: 16 },
  cardValue:  { fontSize: 20, fontWeight: '800' },
  cardLabel:  { fontSize: 12, color: '#374151', marginTop: 4, fontWeight: '600' },
  cardSub:    { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  alert:      { margin: 12, backgroundColor: '#fefce8', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#fde68a' },
  alertTitle: { fontSize: 14, fontWeight: '700', color: '#92400e', marginBottom: 8 },
  alertItem:  { fontSize: 13, color: '#78350f', marginBottom: 4 },
})
