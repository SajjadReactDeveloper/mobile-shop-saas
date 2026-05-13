import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import { api } from '../lib/api'
import { STATUS_TOP } from '../lib/constants'

type SubScreen = 'customers' | 'repairs' | 'easyload' | 'easypaisa' | 'cash' | 'settings'

interface Props {
  onNavigate: (s: SubScreen) => void
  onLogout: () => void
}

interface Profile { name: string; email?: string; phone?: string; role: string; shop: { name: string; city?: string } }

const ITEMS: { id: SubScreen; emoji: string; label: string; desc: string; color: string; bg: string }[] = [
  { id: 'customers', emoji: 'ðŸ‘¤', label: 'Customers',    desc: 'Ledger & udhaar',         color: '#0891b2', bg: '#ecfeff' },
  { id: 'repairs',   emoji: 'ðŸ”§', label: 'Repairs',      desc: 'Job cards & tracking',     color: '#d97706', bg: '#fffbeb' },
  { id: 'easyload',  emoji: 'ðŸ“±', label: 'Easy Load',    desc: 'Network SIM balances',     color: '#0d9488', bg: '#f0fdfa' },
  { id: 'easypaisa', emoji: 'ðŸ’š', label: 'Easypaisa',    desc: 'Wallet transactions',      color: '#16a34a', bg: '#f0fdf4' },
  { id: 'cash',      emoji: 'ðŸ’µ', label: 'Cash Register', desc: 'Daily session & expenses', color: '#0f766e', bg: '#f0fdfa' },
  { id: 'settings',  emoji: 'âš™ï¸', label: 'Settings',     desc: 'Shop, staff & billing',    color: '#6b7280', bg: '#f9fafb' },
]

export function MoreScreen({ onNavigate, onLogout }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    api.get('/auth/me')
      .then(r => setProfile(r.data as Profile))
      .catch(() => null)
  }, [])

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: onLogout },
    ])
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>More</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>
              {profile ? profile.name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <View style={s.profileInfo}>
            <Text style={s.profileName}>{profile?.name ?? 'â€¦'}</Text>
            <Text style={s.profileEmail}>{profile?.email ?? profile?.phone ?? ''}</Text>
            <View style={s.roleBadge}>
              <Text style={s.roleText}>{profile?.role ?? ''}</Text>
            </View>
          </View>
          <View style={s.shopInfo}>
            <Text style={s.shopName} numberOfLines={1}>{profile?.shop?.name ?? ''}</Text>
            {profile?.shop?.city ? <Text style={s.shopCity}>{profile.shop.city}</Text> : null}
          </View>
        </View>

        {/* Menu items */}
        <Text style={s.sectionLabel}>FEATURES</Text>
        <View style={s.menuCard}>
          {ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[s.menuRow, idx > 0 && s.menuRowBorder]}
              onPress={() => onNavigate(item.id)}
              activeOpacity={0.7}
            >
              <View style={[s.menuIcon, { backgroundColor: item.bg }]}>
                <Text style={s.menuEmoji}>{item.emoji}</Text>
              </View>
              <View style={s.menuText}>
                <Text style={s.menuLabel}>{item.label}</Text>
                <Text style={s.menuDesc}>{item.desc}</Text>
              </View>
              <Text style={s.menuChevron}>â€º</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={s.logoutText}>ðŸšª  Log out</Text>
        </TouchableOpacity>

        <Text style={s.versionText}>Flowchat Â· v1.0</Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f0fdfa' },
  header:       { backgroundColor: '#0d9488', paddingTop: STATUS_TOP, paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle:  { fontSize: 22, fontWeight: '800', color: '#fff' },

  profileCard:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 14, borderRadius: 18, padding: 16, gap: 12, shadowColor: '#0d9488', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  avatar:       { width: 52, height: 52, borderRadius: 26, backgroundColor: '#0d9488', alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 22, fontWeight: '800', color: '#fff' },
  profileInfo:  { flex: 1 },
  profileName:  { fontSize: 16, fontWeight: '800', color: '#111827' },
  profileEmail: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  roleBadge:    { marginTop: 6, backgroundColor: '#f0fdfa', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, alignSelf: 'flex-start' },
  roleText:     { fontSize: 10, fontWeight: '700', color: '#0d9488' },
  shopInfo:     { alignItems: 'flex-end' },
  shopName:     { fontSize: 12, fontWeight: '700', color: '#374151', maxWidth: 90, textAlign: 'right' },
  shopCity:     { fontSize: 11, color: '#9ca3af', marginTop: 2 },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#9ca3af', letterSpacing: 1, marginLeft: 16, marginBottom: 6 },
  menuCard:     { backgroundColor: '#fff', marginHorizontal: 14, borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  menuRow:      { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  menuRowBorder:{ borderTopWidth: 1, borderTopColor: '#f9fafb' },
  menuIcon:     { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuEmoji:    { fontSize: 22 },
  menuText:     { flex: 1 },
  menuLabel:    { fontSize: 14, fontWeight: '700', color: '#111827' },
  menuDesc:     { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  menuChevron:  { fontSize: 22, color: '#d1d5db' },

  logoutBtn:    { marginHorizontal: 14, marginTop: 16, backgroundColor: '#fef2f2', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#fecaca' },
  logoutText:   { fontSize: 15, fontWeight: '700', color: '#dc2626' },
  versionText:  { textAlign: 'center', fontSize: 11, color: '#d1d5db', marginTop: 16 },
})
