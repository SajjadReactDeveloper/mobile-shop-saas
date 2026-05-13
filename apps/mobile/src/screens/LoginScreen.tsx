import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api, saveToken } from '../lib/api'

interface Props {
  onLogin: () => void
  onSignup: () => void
}

export function LoginScreen({ onLogin, onSignup }: Props) {
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<'email' | 'phone'>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async () => {
    if (!email || !password) return Alert.alert('Fill in email and password')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      await saveToken(res.data.accessToken)
      onLogin()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      Alert.alert('Login Failed', e.response?.data?.message ?? 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleSendOtp = async () => {
    if (!phone) return Alert.alert('Enter phone number')
    setLoading(true)
    try {
      await api.post('/auth/otp/send', { phone })
      setOtpSent(true)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      Alert.alert('Error', e.response?.data?.message ?? 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) return Alert.alert('Enter the OTP')
    setLoading(true)
    try {
      const res = await api.post('/auth/otp/verify', { phone, otp })
      await saveToken(res.data.accessToken)
      onLogin()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      Alert.alert('Error', e.response?.data?.message ?? 'Invalid OTP')
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
      <View style={[s.hero, { paddingTop: insets.top + 20 }]}>
        <View style={s.logoWrap}>
          <Text style={s.logoEmoji}>📱</Text>
        </View>
        <Text style={s.heroTitle}>Mobile Shop</Text>
        <Text style={s.heroSub}>Pakistan's smartest shop management app</Text>
      </View>

      {/* White card */}
      <View style={s.card}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={s.cardTitle}>Welcome back</Text>
          <Text style={s.cardSub}>Sign in to your shop dashboard</Text>

          {/* Tab switcher */}
          <View style={s.tabRow}>
            {(['email', 'phone'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[s.tabBtn, tab === t && s.tabBtnActive]}
                onPress={() => { setTab(t); setOtpSent(false); setOtp('') }}
              >
                <Text style={[s.tabBtnText, tab === t && s.tabBtnTextActive]}>
                  {t === 'email' ? '✉️  Email' : '📱  Phone OTP'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === 'email' ? (
            <>
              <Text style={s.label}>Email Address</Text>
              <TextInput
                style={s.input} value={email} onChangeText={setEmail}
                placeholder="ali@shop.com" placeholderTextColor="#9ca3af"
                keyboardType="email-address" autoCapitalize="none"
                returnKeyType="next"
              />
              <Text style={s.label}>Password</Text>
              <TextInput
                style={s.input} value={password} onChangeText={setPassword}
                placeholder="••••••••" placeholderTextColor="#9ca3af"
                secureTextEntry returnKeyType="done"
                onSubmitEditing={handleEmailLogin}
              />
              <TouchableOpacity
                style={[s.btn, loading && s.btnDisabled]}
                onPress={handleEmailLogin} disabled={loading}
              >
                <Text style={s.btnText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={s.label}>Phone Number</Text>
              <TextInput
                style={s.input} value={phone} onChangeText={setPhone}
                placeholder="+92 300 1234567" placeholderTextColor="#9ca3af"
                keyboardType="phone-pad" editable={!otpSent}
              />
              {otpSent && (
                <>
                  <Text style={s.label}>Enter OTP</Text>
                  <TextInput
                    style={[s.input, s.otpInput]} value={otp} onChangeText={setOtp}
                    placeholder="• • • • • •" placeholderTextColor="#9ca3af"
                    keyboardType="number-pad" maxLength={6}
                  />
                </>
              )}
              <TouchableOpacity
                style={[s.btn, loading && s.btnDisabled]}
                onPress={otpSent ? handleVerifyOtp : handleSendOtp}
                disabled={loading}
              >
                <Text style={s.btnText}>
                  {loading ? 'Please wait…' : otpSent ? 'Verify OTP' : 'Send OTP'}
                </Text>
              </TouchableOpacity>
              {otpSent && (
                <TouchableOpacity onPress={() => setOtpSent(false)} style={s.resendWrap}>
                  <Text style={s.resendText}>Didn't receive it? Send again</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Divider */}
          <View style={s.divider}>
            <View style={s.divLine} />
            <Text style={s.divText}>New to Mobile Shop?</Text>
            <View style={s.divLine} />
          </View>

          {/* Sign up */}
          <TouchableOpacity style={s.signupBtn} onPress={onSignup}>
            <Text style={s.signupText}>Create Free Account →</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  flex:             { flex: 1, backgroundColor: '#7c3aed' },
  hero:             { alignItems: 'center', paddingBottom: 36, paddingHorizontal: 24 },
  logoWrap:         { width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoEmoji:        { fontSize: 36 },
  heroTitle:        { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  heroSub:          { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6, textAlign: 'center' },
  card:             { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 28 },
  cardTitle:        { fontSize: 22, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
  cardSub:          { fontSize: 13, color: '#6b7280', marginTop: 4, marginBottom: 20 },
  tabRow:           { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 12, padding: 4, marginBottom: 20 },
  tabBtn:           { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 },
  tabBtnActive:     { backgroundColor: '#7c3aed', shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  tabBtnText:       { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  tabBtnTextActive: { color: '#fff' },
  label:            { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  input:            { backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#111827' },
  otpInput:         { letterSpacing: 8, textAlign: 'center', fontSize: 20, fontWeight: '700' },
  btn:              { backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 20, shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 },
  btnDisabled:      { opacity: 0.65 },
  btnText:          { color: '#fff', fontWeight: '700', fontSize: 16 },
  resendWrap:       { alignItems: 'center', marginTop: 12 },
  resendText:       { fontSize: 13, color: '#7c3aed', fontWeight: '500' },
  divider:          { flexDirection: 'row', alignItems: 'center', marginVertical: 24, gap: 10 },
  divLine:          { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  divText:          { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
  signupBtn:        { borderWidth: 2, borderColor: '#7c3aed', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  signupText:       { color: '#7c3aed', fontWeight: '700', fontSize: 15 },
})
