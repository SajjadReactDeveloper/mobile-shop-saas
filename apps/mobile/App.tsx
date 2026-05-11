import { StatusBar } from 'expo-status-bar'
import { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { getToken, clearToken, setAuthExpiredCallback } from './src/lib/api'
import { LoginScreen }        from './src/screens/LoginScreen'
import { SignupScreen }        from './src/screens/SignupScreen'
import { DashboardScreen }     from './src/screens/DashboardScreen'
import { InventoryScreen }     from './src/screens/InventoryScreen'
import { POSScreen }           from './src/screens/POSScreen'
import { MoreScreen }          from './src/screens/MoreScreen'
import { RepairsScreen }       from './src/screens/RepairsScreen'
import { EasyLoadScreen }      from './src/screens/EasyLoadScreen'
import { EasypaisaScreen }     from './src/screens/EasypaisaScreen'
import { CustomersScreen }     from './src/screens/CustomersScreen'
import { CashRegisterScreen }  from './src/screens/CashRegisterScreen'
import { SettingsScreen }      from './src/screens/SettingsScreen'

type MainScreen = 'dashboard' | 'pos' | 'inventory' | 'more'
type SubScreen  = 'customers' | 'repairs' | 'easyload' | 'easypaisa' | 'cash' | 'settings'
type AnyScreen  = MainScreen | SubScreen
type AuthScreen = 'login' | 'signup'

const MAIN_TABS: { id: MainScreen; label: string; icon: string }[] = [
  { id: 'dashboard',  label: 'Home',  icon: '🏠' },
  { id: 'pos',        label: 'Sale',  icon: '🛒' },
  { id: 'inventory',  label: 'Stock', icon: '📦' },
  { id: 'more',       label: 'More',  icon: '⋯'  },
]

/** All screens that should be lazy-mounted and kept alive */
const ALL_SCREENS: AnyScreen[] = [
  'dashboard', 'pos', 'inventory', 'more',
  'customers', 'repairs', 'easyload', 'easypaisa', 'cash', 'settings',
]

/* ─── Root: just provides the safe-area context ─── */
export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  )
}

/* ─── Inner component — has access to real safe-area insets ─── */
function AppContent() {
  const insets = useSafeAreaInsets()

  const [authed, setAuthed]         = useState<boolean | null>(null)
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login')
  const [screen, setScreen]         = useState<AnyScreen>('dashboard')
  const [mounted, setMounted]       = useState<Set<AnyScreen>>(new Set(['dashboard']))
  const prevMain = useRef<MainScreen>('dashboard')

  /* ─── Auth init ─── */
  useEffect(() => {
    getToken()
      .then(t => setAuthed(!!t))
      .catch(() => setAuthed(false))

    setAuthExpiredCallback(() => {
      setAuthed(false)
      setAuthScreen('login')
    })
  }, [])

  /* ─── Navigation ─── */
  const navigate = (s: AnyScreen) => {
    setMounted(prev => { const n = new Set(prev); n.add(s); return n })
    setScreen(s)
    if (['dashboard', 'pos', 'inventory', 'more'].includes(s)) {
      prevMain.current = s as MainScreen
    }
  }
  const goBack = () => navigate(prevMain.current)
  const logout = () => {
    void clearToken()
    setAuthed(false)
    setAuthScreen('login')
    setScreen('dashboard')
    setMounted(new Set(['dashboard']))
  }

  /* ─── Splash ─── */
  if (authed === null) {
    return (
      <View style={s.splash}>
        <View style={s.splashLogo}><Text style={{ fontSize: 40 }}>📱</Text></View>
        <Text style={s.splashTitle}>Mobile Shop</Text>
        <ActivityIndicator color="#7c3aed" size="large" style={{ marginTop: 20 }} />
      </View>
    )
  }

  /* ─── Auth screens ─── */
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

  const isMain    = (id: AnyScreen): id is MainScreen => MAIN_TABS.some(t => t.id === id)
  const activeMain: MainScreen = isMain(screen) ? screen : prevMain.current

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {/*
        Status-bar safe-area spacer.
        height = exact top inset from useSafeAreaInsets() — reliable on every
        Android device even with edgeToEdgeEnabled + newArch.
        Purple so it blends seamlessly with every screen's violet header.
      */}
      <View style={{ height: insets.top, backgroundColor: '#7c3aed' }} />

      {/* ── Lazy-mounted screens ── */}
      <View style={s.content}>
        {ALL_SCREENS.map(id => {
          if (!mounted.has(id)) return null
          const visible = screen === id
          return (
            <View key={id} style={[s.screenWrap, !visible && s.screenHidden]}>
              {id === 'dashboard'  && <DashboardScreen onNavigate={navigate} />}
              {id === 'pos'        && <POSScreen />}
              {id === 'inventory'  && <InventoryScreen />}
              {id === 'more'       && <MoreScreen onNavigate={s => navigate(s)} onLogout={logout} />}
              {id === 'customers'  && <CustomersScreen onBack={goBack} />}
              {id === 'repairs'    && <RepairsScreen onBack={goBack} />}
              {id === 'easyload'   && <EasyLoadScreen onBack={goBack} />}
              {id === 'easypaisa'  && <EasypaisaScreen onBack={goBack} />}
              {id === 'cash'       && <CashRegisterScreen onBack={goBack} />}
              {id === 'settings'   && <SettingsScreen onLogout={logout} onBack={goBack} />}
            </View>
          )
        })}
      </View>

      {/*
        Tab bar — height expands to include the system navigation-bar inset so
        tab content never sits behind Android's home-gesture indicator.
      */}
      <View style={[s.tabBar, { paddingBottom: insets.bottom }]}>
        {MAIN_TABS.map(tab => {
          const active = activeMain === tab.id
          return (
            <TouchableOpacity
              key={tab.id}
              style={[s.tabItem, active && s.tabItemActive]}
              onPress={() => navigate(tab.id)}
              activeOpacity={0.7}
            >
              <View style={[s.tabIconWrap, active && s.tabIconWrapActive]}>
                <Text style={s.tabIcon}>{tab.icon}</Text>
              </View>
              <Text style={[s.tabLabel, active && s.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  splash:      { flex: 1, backgroundColor: '#faf9ff', alignItems: 'center', justifyContent: 'center' },
  splashLogo:  { width: 88, height: 88, borderRadius: 26, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  splashTitle: { fontSize: 24, fontWeight: '800', color: '#7c3aed' },

  root:        { flex: 1, backgroundColor: '#7c3aed' }, // purple = spacer + nav-bar area match headers
  content:     { flex: 1 },
  screenWrap:  { ...StyleSheet.absoluteFillObject },
  screenHidden: { opacity: 0, pointerEvents: 'none' } as object,

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ede9fe',
    paddingTop: 6,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 12,
  },
  tabItem:        { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 2, borderTopWidth: 3, borderTopColor: 'transparent' },
  tabItemActive:  { borderTopColor: '#7c3aed' },
  tabIconWrap:    { width: 36, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  tabIconWrapActive: { backgroundColor: '#f5f3ff' },
  tabIcon:        { fontSize: 20 },
  tabLabel:       { fontSize: 10, color: '#9ca3af', fontWeight: '500', marginTop: 2 },
  tabLabelActive: { color: '#7c3aed', fontWeight: '700' },
})
