import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { getToken, clearToken } from './src/lib/api'
import { LoginScreen } from './src/screens/LoginScreen'
import { DashboardScreen } from './src/screens/DashboardScreen'

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    getToken().then((t) => setAuthed(!!t))
  }, [])

  if (authed === null) return null // splash

  return (
    <>
      <StatusBar style="auto" />
      {authed ? (
        <DashboardScreen
          onLogout={() => {
            clearToken()
            setAuthed(false)
          }}
        />
      ) : (
        <LoginScreen onLogin={() => setAuthed(true)} />
      )}
    </>
  )
}
