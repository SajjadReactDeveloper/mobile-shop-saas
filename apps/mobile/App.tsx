import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { getToken, clearToken } from './src/lib/api'
import { LoginScreen } from './src/screens/LoginScreen'
import { SignupScreen } from './src/screens/SignupScreen'
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
type AuthScreen = 'login' | 'signup'

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
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login')
  const [screen, setScreen] = useState<Screen>('dashboard')

  useEffect(() => {
    getToken()
      .then(t => setAuthed(!!t))
      .catch(() => setAuthed(false))
  }, [])

  if (authed === null) {
    return (
      <View style={s.loader}>
        <View style={s.loaderLogo}>
          <Text style={{ fontSize: 36 }}>📱</Text>
        </View>
        <ActivityIndicator size="large" color="#7c3aed" style={{ marginTop: 24 }} />
        <Text style={s.loaderText}>Mobile Shop</Text>
      </View>
    )
  }

  if (!authed) {
    return (
      <>
        <StatusBar style="light" />
        {authScreen === 'login'
          ? <LoginScreen onLogin={() => setAuthed(true)} onSignup={() => setAuthScreen('signup')} />
          : <SignupScreen onBack={() => setAuthScreen('login')} onSignup={() => setAuthed(true)} />
        }
      </>
    )
  }

  const logout = () => { void clearToken(); setAuthed(false); setAuthScreen('login') }

  return (
    <View style={s.root}>
      <StatusBar style="light" />

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

      {/* Tab bar */}
      <View style={s.tabBarOuter}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabBar}
        >
          {TABS.map(tab => {
            const active = screen === tab.id
            return (
              <TouchableOpacity
                key={tab.id}
                style={[s.tab, active && s.tabActive]}
                onPress={() => setScreen(tab.id)}
                activeOpacity={0.7}
              >
                {active && <View style={s.tabPill} />}
                <Text style={s.tabIcon}>{tab.icon}</Text>
                <Text style={[s.tabLabel, active && s.tabLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  // Loading
  loader:       { flex: 1, backgroundColor: '#faf9ff', justifyContent: 'center', alignItems: 'center' },
  loaderLogo:   { width: 80, height: 80, borderRadius: 24, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center' },
  loaderText:   { fontSize: 18, fontWeight: '700', color: '#7c3aed', marginTop: 16 },

  // App shell
  root:         { flex: 1, backgroundColor: '#faf9ff' },
  content:      { flex: 1 },

  // Tab bar
  tabBarOuter:  { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#ede9fe', paddingBottom: 18, shadowColor: '#7c3aed', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 8 },
  tabBar:       { flexDirection: 'row', paddingTop: 6, paddingHorizontal: 4 },
  tab:          { alignItems: 'center', paddingHorizontal: 12, minWidth: 62, paddingVertical: 4, borderRadius: 12, position: 'relative' },
  tabActive:    { backgroundColor: '#f5f3ff' },
  tabPill:      { position: 'absolute', top: 0, left: '25%', right: '25%', height: 2.5, backgroundColor: '#7c3aed', borderRadius: 2 },
  tabIcon:      { fontSize: 19, marginBottom: 2 },
  tabLabel:     { fontSize: 10, color: '#9ca3af', fontWeight: '500' },
  tabLabelActive: { color: '#7c3aed', fontWeight: '700' },
})
