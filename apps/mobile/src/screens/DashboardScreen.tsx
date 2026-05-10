import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { api } from '../lib/api'

interface Props {
  onLogout: () => void
}

export function DashboardScreen({ onLogout }: Props) {
  const [stats, setStats] = useState<any>(null)
  const [todaySummary, setTodaySummary] = useState<any>(null)
  const [lowStock, setLowStock] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const load = async () => {
    try {
      const [s, t, l] = await Promise.all([
        api.get('/shop/stats').then((r) => r.data),
        api.get(`/sales/daily-summary?date=${today}`).then((r) => r.data),
        api.get('/inventory/low-stock').then((r) => r.data),
      ])
      setStats(s)
      setTodaySummary(t)
      setLowStock(l)
    } catch (e) {
      // silently fail, user can pull-to-refresh
    }
  }

  useEffect(() => { load() }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const cards = [
    { label: "Today's Sales", value: `PKR ${(todaySummary?.totalRevenue ?? 0).toLocaleString()}`, sub: `${todaySummary?.totalSales ?? 0} transactions` },
    { label: 'Gross Profit', value: `PKR ${(todaySummary?.grossProfit ?? 0).toLocaleString()}`, sub: 'Today' },
    { label: 'Products', value: String(stats?.products ?? '—'), sub: 'Active' },
    { label: 'Pending Repairs', value: String(stats?.pendingRepairs ?? '—'), sub: 'In progress' },
    { label: 'Customers', value: String(stats?.customers ?? '—'), sub: 'Registered' },
  ]

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <TouchableOpacity onPress={onLogout}>
          <Text style={styles.logout}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.date}>{new Date().toLocaleDateString('en-PK', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>

      <View style={styles.grid}>
        {cards.map((card) => (
          <View key={card.label} style={styles.card}>
            <Text style={styles.cardValue}>{card.value}</Text>
            <Text style={styles.cardLabel}>{card.label}</Text>
            <Text style={styles.cardSub}>{card.sub}</Text>
          </View>
        ))}
      </View>

      {lowStock.length > 0 && (
        <View style={styles.alert}>
          <Text style={styles.alertTitle}>⚠️ Low Stock ({lowStock.length} items)</Text>
          {lowStock.slice(0, 5).map((p: any) => (
            <Text key={p.id} style={styles.alertItem}>{p.name} — {p.stockQty} remaining</Text>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  logout: { fontSize: 14, color: '#dc2626', fontWeight: '500' },
  date: { fontSize: 13, color: '#6b7280', padding: 16, paddingBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  card: { width: '46%', margin: '2%', backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  cardValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  cardLabel: { fontSize: 12, color: '#374151', marginTop: 4, fontWeight: '600' },
  cardSub: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  alert: { margin: 16, backgroundColor: '#fefce8', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#fde68a' },
  alertTitle: { fontSize: 14, fontWeight: '700', color: '#92400e', marginBottom: 8 },
  alertItem: { fontSize: 13, color: '#78350f', marginBottom: 4 },
})
