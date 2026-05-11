import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { View, TouchableOpacity, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { getToken, clearToken } from './src/lib/api'
import { LoginScreen } from './src/screens/LoginScreen'
import { DashboardScreen } from './src/screens/DashboardScreen'
import { InventoryScreen } from './src/screens/InventoryScreen'
import { POSScreen } from './src/screens/POSScreen'
import { RepairsScreen } from './src/screens/RepairsScreen'
import { EasyLoadScreen } from './src/screens/EasyLoadScreen'
import { EasypaisaScreen } from './src/screens/EasypaisaScreen'
import { CustomersScreen } from './src/screens/CustomersScreen'
import { CashRegisterScreen } from './src/screens/CashRegisterScreen'
import { SettingsScreen } from './src/screens/SettingsScreen'

type Screen = 'dashboard' | 'pos' | 'inventory' | 'customers' | 'repairs' | 'easyload' | 'easypaisa' | 'cash' | 'settings'

const TABS: { id: Screen; label: string; icon: string }[] = [
  { id: 'dashboard',  label: 'Home',      icon: '🏠' },
  { id: 'pos',        label: 'Sale',       icon: '🛒' },
  { id: 'inventory',  label: 'Stock',      icon: '📦' },
  { id: 'customers',  label: 'Customers',  icon: '👤' },
  { id: 'repairs',    label: 'Repairs',    icon: '🔧' },
  { id: 'easyload',   label: 'Load',       icon: '📱' },
  { id: 'easypaisa',  label: 'Easypaisa',  icon: '💚' },
  { id: 'cash',       label: 'Cash',       icon: '💵' },
  { id: 'settings',   label: 'Settings',   icon: '⚙️'  },
]

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [screen, setScreen] = useState<Screen>('dashboard')

  useEffect(() => {
    getToken()
      .then((t) => setAuthed(!!t))
      .catch(() => setAuthed(false))   // never stay on blank screen if storage fails
  }, [])

  if (authed === null) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
      <ActivityIndicator size="large" color="#7c3aed" />
    </View>
  )

  if (!authed) {
    return (
      <>
        <StatusBar style="dark" />
        <LoginScreen onLogin={() => setAuthed(true)} />
      </>
    )
  }

  const logout = () => { clearToken(); setAuthed(false) }

  return (
    <View style={s.root}>
      <StatusBar style="dark" />

      <View style={s.content}>
        {screen === 'dashboard'  && <DashboardScreen />}
        {screen === 'pos'        && <POSScreen />}
        {screen === 'inventory'  && <InventoryScreen />}
        {screen === 'customers'  && <CustomersScreen />}
        {screen === 'repairs'    && <RepairsScreen />}
        {screen === 'easyload'   && <EasyLoadScreen />}
        {screen === 'easypaisa'  && <EasypaisaScreen />}
        {screen === 'cash'       && <CashRegisterScreen />}
        {screen === 'settings'   && <SettingsScreen onLogout={logout} />}
      </View>

      {/* Scrollable tab bar */}
      <View style={s.tabBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabBar}
        >
          {TABS.map(tab => {
            const active = screen === tab.id
            return (
              <TouchableOpacity key={tab.id} style={s.tab} onPress={() => setScreen(tab.id)}>
                <Text style={s.tabIcon}>{tab.icon}</Text>
                <Text style={[s.tabLabel, active && s.tabLabelActive]}>{tab.label}</Text>
                {active && <View style={s.tabDot} />}
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#f3f4f6' },
  content:        { flex: 1 },
  tabBarWrapper:  { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingBottom: 20 },
  tabBar:         { flexDirection: 'row', paddingTop: 8, paddingHorizontal: 4 },
  tab:            { alignItems: 'center', gap: 2, paddingHorizontal: 10, minWidth: 60 },
  tabIcon:        { fontSize: 18 },
  tabLabel:       { fontSize: 9, color: '#9ca3af', fontWeight: '500' },
  tabLabelActive: { color: '#2563eb', fontWeight: '700' },
  tabDot:         { width: 4, height: 4, borderRadius: 2, backgroundColor: '#2563eb', marginTop: 2 },
})
