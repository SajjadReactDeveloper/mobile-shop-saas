import React, { useEffect, useRef } from 'react'
import { Animated, View, StyleSheet, Dimensions } from 'react-native'

const { width: SCREEN_W } = Dimensions.get('window')

/* ─── Base pulse block ─── */
interface SkProps { w?: number | string; h?: number; radius?: number; style?: object }
export function Sk({ w = '100%', h = 16, radius = 10, style }: SkProps) {
  const opacity = useRef(new Animated.Value(0.35)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[
        { width: w as number, height: h, borderRadius: radius, backgroundColor: '#e5e7eb', opacity },
        style,
      ]}
    />
  )
}

/* ─── Stat cards skeleton (Dashboard) ─── */
export function StatCardsSkeleton() {
  return (
    <View style={sk.statsGrid}>
      {[0, 1, 2, 3, 4].map(i => (
        <View key={i} style={sk.statCard}>
          <Sk w={36} h={36} radius={12} />
          <View style={{ marginTop: 10, gap: 6 }}>
            <Sk w="70%" h={20} radius={8} />
            <Sk w="50%" h={13} radius={6} />
          </View>
        </View>
      ))}
    </View>
  )
}

/* ─── List items skeleton (Customers, Repairs, Inventory) ─── */
export function ListItemsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <View style={sk.listContainer}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={sk.listRow}>
          <Sk w={42} h={42} radius={21} />
          <View style={{ flex: 1, gap: 8, marginLeft: 12 }}>
            <Sk w="55%" h={14} />
            <Sk w="38%" h={11} radius={6} />
          </View>
          <Sk w={56} h={22} radius={11} />
        </View>
      ))}
    </View>
  )
}

/* ─── Account card skeleton (EasyLoad, Easypaisa) ─── */
export function AccountCardsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={sk.accountCard}>
          {/* header */}
          <View style={sk.accountHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Sk w={42} h={42} radius={12} />
              <View style={{ gap: 8 }}>
                <Sk w={100} h={14} />
                <Sk w={70} h={11} radius={6} />
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 8 }}>
              <Sk w={90} h={18} />
              <Sk w={60} h={11} radius={6} />
            </View>
          </View>
          {/* buttons row */}
          <View style={sk.accountButtons}>
            <Sk w="30%" h={34} radius={10} />
            <Sk w="30%" h={34} radius={10} />
            <Sk w="30%" h={34} radius={10} />
          </View>
        </View>
      ))}
    </View>
  )
}

/* ─── Dashboard skeleton ─── */
export function DashboardScreenSkeleton() {
  return (
    <View style={sk.screen}>
      {/* greeting */}
      <View style={{ gap: 8, marginBottom: 20 }}>
        <Sk w="50%" h={20} />
        <Sk w="65%" h={13} radius={6} />
      </View>
      <StatCardsSkeleton />
      {/* quick links */}
      <View style={sk.quickLinks}>
        {[0, 1, 2, 3].map(i => <Sk key={i} w={(SCREEN_W - 60) / 4} h={72} radius={12} />)}
      </View>
      {/* low stock section */}
      <View style={sk.section}>
        <Sk w="40%" h={14} style={{ marginBottom: 12 }} />
        {[0, 1, 2].map(i => (
          <View key={i} style={sk.listRow}>
            <Sk w="55%" h={13} />
            <Sk w={48} h={20} radius={10} />
          </View>
        ))}
      </View>
    </View>
  )
}

/* ─── POS skeleton ─── */
export function POSScreenSkeleton() {
  return (
    <View style={sk.screen}>
      <Sk w="100%" h={40} radius={12} style={{ marginBottom: 16 }} />
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={i} style={sk.listRow}>
          <View style={{ flex: 1, gap: 7 }}>
            <Sk w="60%" h={14} />
            <Sk w="40%" h={11} radius={6} />
          </View>
          <Sk w={72} h={30} radius={10} />
        </View>
      ))}
    </View>
  )
}

/* ─── Settings skeleton ─── */
export function SettingsScreenSkeleton() {
  return (
    <View style={sk.screen}>
      {/* tabs */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
        <Sk w={80} h={34} radius={10} />
        <Sk w={70} h={34} radius={10} />
        <Sk w={80} h={34} radius={10} />
      </View>
      {/* form fields */}
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} style={{ marginBottom: 16, gap: 8 }}>
          <Sk w="30%" h={11} radius={6} />
          <Sk w="100%" h={42} radius={12} />
        </View>
      ))}
      <Sk w="100%" h={44} radius={12} style={{ marginTop: 8 }} />
    </View>
  )
}

const sk = StyleSheet.create({
  screen:         { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  statsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard:       { width: (SCREEN_W - 52) / 2, backgroundColor: '#f9fafb', borderRadius: 16, padding: 14 },
  listContainer:  { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  listRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  accountCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f3f4f6' },
  accountHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  accountButtons: { flexDirection: 'row', gap: 8 },
  quickLinks:     { flexDirection: 'row', gap: 8, marginBottom: 20 },
  section:        { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 12 },
})
