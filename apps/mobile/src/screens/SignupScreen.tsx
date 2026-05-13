import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api, saveToken } from '../lib/api'

interface Props { onBack: () => void; onSignup: () => void }

export function SignupScreen({ onBack, onSignup }: Props) {
  const insets = useSafeAreaInsets()
  const [form, setForm] = useState({ name: '', shopName: '', city: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSignup = async () => {
    if (!form.name || !form.shopName || !form.email || !form.password) {
      return Alert.alert('Missing Fields', 'Name, shop name, email and password are required.')
    }
    if (form.password.length < 8) {
      return Alert.alert('Weak Password', 'Password must be at least 8 characters.')
    }
    setLoading(true)
    try {
      const res = await api.post('/auth/register', {
        name: form.name,
        shopName: form.shopName,
        city: form.city || undefined,
        email: form.email,
        password: form.password,
      })
      await saveToken(res.data.accessToken)
      onSignup()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string | string[] } } }
      const msg = Array.isArray(e.response?.data?.message)
        ? (e.response!.data!.message as string[]).join('\n')
        : (e.response?.data?.message ?? 'Registration failed. Try again.')
      Alert.alert('Error', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Violet hero */}
      <View style={[s.hero, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={s.back} onPress={onBack}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={s.logoWrap}>
          <Text style={s.logoEmoji}>📱</Text>
        </View>
        <Text style={s.heroTitle}>Create Your Shop</Text>
        <Text style={s.heroSub}>Set up your free account in seconds</Text>
      </View>

      {/* Form card */}
      <View style={s.formCard}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={s.sectionLabel}>YOUR DETAILS</Text>

          <Text style={s.label}>Your Full Name *</Text>
          <TextInput
            style={s.input} value={form.name} onChangeText={set('name')}
            placeholder="Ali Khan" placeholderTextColor="#9ca3af" autoCapitalize="words"
          />

          <Text style={s.sectionLabel} >SHOP INFO</Text>

          <Text style={s.label}>Shop Name *</Text>
          <TextInput
            style={s.input} value={form.shopName} onChangeText={set('shopName')}
            placeholder="Ali Mobile Centre" placeholderTextColor="#9ca3af"
          />

          <Text style={s.label}>City</Text>
          <TextInput
            style={s.input} value={form.city} onChangeText={set('city')}
            placeholder="Lahore" placeholderTextColor="#9ca3af"
          />

          <Text style={s.sectionLabel}>LOGIN CREDENTIALS</Text>

          <Text style={s.label}>Email Address *</Text>
          <TextInput
            style={s.input} value={form.email} onChangeText={set('email')}
            placeholder="ali@example.com" placeholderTextColor="#9ca3af"
            keyboardType="email-address" autoCapitalize="none"
          />

          <Text style={s.label}>Password * (min 8 characters)</Text>
          <TextInput
            style={s.input} value={form.password} onChangeText={set('password')}
            placeholder="••••••••" placeholderTextColor="#9ca3af"
            secureTextEntry
          />

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={s.btnText}>{loading ? 'Creating account…' : 'Create Account'}</Text>
          </TouchableOpacity>

          <Text style={s.termsText}>
            By signing up you agree to our Terms of Service. Your trial is free for 14 days.
          </Text>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  flex:         { flex: 1, backgroundColor: '#7c3aed' },
  hero:         { backgroundColor: '#7c3aed', paddingHorizontal: 24, paddingBottom: 28 },
  back:         { marginBottom: 16 },
  backText:     { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: '500' },
  logoWrap:     { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoEmoji:    { fontSize: 28 },
  heroTitle:    { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  heroSub:      { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  formCard:     { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 28 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#7c3aed', letterSpacing: 1, marginTop: 20, marginBottom: 4 },
  label:        { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input:        { backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827' },
  btn:          { backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 28, shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 },
  btnDisabled:  { opacity: 0.65 },
  btnText:      { color: '#fff', fontWeight: '700', fontSize: 16 },
  termsText:    { textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 16, lineHeight: 16 },
})
