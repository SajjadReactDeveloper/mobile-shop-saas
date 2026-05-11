import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { getToken, clearToken } from './src/lib/api'
import { LoginScreen } from './src/screens/LoginScreen'
import { DashboardScreen } from './src/screens/DashboardScreen'
import { InventoryScreen } from './src/screens/InventoryScreen'
import { POSScreen } from './src/screens/POSScreen'
import { RepairsScreen } from './src/screens/RepairsScreen'
import { EasyLoadScreen } from './src/screens/EasyLoadScreen'
import { CashRegisterScreen } from './src/screens/CashRegisterScreen'

type Screen = 'dashboard' | 'inventory' | 'pos' | 'repairs' | 'easyload' | 'cash'

const TABS: { id: Screen; label: string; icon: string }[] = [
  { id: 'dashboard',  label: 'Home',      icon: '🏠' },
  { id: 'pos',        label: 'Sale',       icon: '🛒' },
  { id: 'inventory',  label: 'Stock',      icon: '📦' },
  { id: 'repairs',    label: 'Repairs',    icon: '🔧' },
  { id: 'easyload',   label: 'Load',       icon: '📱' },
  { id: 'cash',       label: 'Cash',       icon: '💵' },
]

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [screen, setScreen] = useState<Screen>('dashboard')

  useEffect(() => {
    getToken().then((t) => setAuthed(!!t))
  }, [])

  if (authed === null) return null

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
        {screen === 'dashboard'  && <DashboardScreen onLogout={logout} />}
        {screen === 'pos'        && <POSScreen />}
        {screen === 'inventory'  && <InventoryScreen />}
        {screen === 'repairs'    && <RepairsScreen />}
        {screen === 'easyload'   && <EasyLoadScreen />}
        {screen === 'cash'       && <CashRegisterScreen />}
      </View>

      <View style={s.tabBar}>
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
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#f3f4f6' },
  content:      { flex: 1 },
  tabBar:       { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingBottom: 20, paddingTop: 8 },
  tab:          { flex: 1, alignItems: 'center', gap: 2 },
  tabIcon:      { fontSize: 20 },
  tabLabel:     { fontSize: 10, color: '#9ca3af', fontWeight: '500' },
  tabLabelActive: { color: '#2563eb', fontWeight: '700' },
  tabDot:       { width: 4, height: 4, borderRadius: 2, backgroundColor: '#2563eb', marginTop: 2 },
})
