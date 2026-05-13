import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Dimensions, Animated, useRef,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width: W, height: H } = Dimensions.get('window')

const STEPS = [
  {
    emoji: '🛒',
    title: 'Quick Sales',
    body: 'Tap Sale in the bottom bar to start a POS transaction. Search products, add to cart, apply discounts and collect payment in seconds.',
    color: '#7c3aed',
  },
  {
    emoji: '📦',
    title: 'Inventory',
    body: 'Track every product with stock counts and low-stock alerts. IMEI tracking for phones keeps each unit accountable.',
    color: '#6d28d9',
  },
  {
    emoji: '⚡',
    title: 'Easy Load & Easypaisa',
    body: 'Manage your SIM balances and digital wallet accounts. Every transaction is logged automatically.',
    color: '#5b21b6',
  },
  {
    emoji: '🔧',
    title: 'Repairs',
    body: 'Create job cards for repairs. Customers get a WhatsApp notification when their device is ready. Share a tracking link so they can follow progress.',
    color: '#4c1d95',
  },
  {
    emoji: '📊',
    title: 'Reports',
    body: 'See your daily P&L, top products, and outstanding udhaar from the dashboard. Smart restock alerts warn you before items run out.',
    color: '#3b0764',
  },
]

export const ONBOARDING_KEY = '@onboarding_v1_done'

interface Props { onDone: () => void }

export function OnboardingTour({ onDone }: Props) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true')
    onDone()
  }

  const next = () => {
    if (isLast) { void finish(); return }
    setStep(s => s + 1)
  }

  const skip = () => { void finish() }

  return (
    <Modal visible transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.card}>
          {/* Progress dots */}
          <View style={s.dots}>
            {STEPS.map((_, i) => (
              <View key={i} style={[s.dot, i === step && s.dotActive]} />
            ))}
          </View>

          {/* Emoji icon */}
          <View style={[s.iconWrap, { backgroundColor: current.color + '18' }]}>
            <Text style={s.emoji}>{current.emoji}</Text>
          </View>

          <Text style={[s.title, { color: current.color }]}>{current.title}</Text>
          <Text style={s.body}>{current.body}</Text>

          {/* Step count */}
          <Text style={s.stepCount}>{step + 1} of {STEPS.length}</Text>

          {/* Buttons */}
          <TouchableOpacity style={[s.nextBtn, { backgroundColor: current.color }]} onPress={next}>
            <Text style={s.nextBtnText}>{isLast ? 'Get Started 🚀' : 'Next →'}</Text>
          </TouchableOpacity>

          {!isLast && (
            <TouchableOpacity style={s.skipBtn} onPress={skip}>
              <Text style={s.skipText}>Skip tour</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card:       { backgroundColor: '#fff', borderRadius: 28, padding: 28, width: '100%', maxWidth: 380, alignItems: 'center' },
  dots:       { flexDirection: 'row', gap: 6, marginBottom: 24 },
  dot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: '#e5e7eb' },
  dotActive:  { width: 20, backgroundColor: '#7c3aed' },
  iconWrap:   { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emoji:      { fontSize: 40 },
  title:      { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  body:       { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 12 },
  stepCount:  { fontSize: 12, color: '#9ca3af', marginBottom: 20 },
  nextBtn:    { width: '100%', paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginBottom: 12 },
  nextBtnText:{ color: '#fff', fontWeight: '700', fontSize: 16 },
  skipBtn:    { paddingVertical: 8 },
  skipText:   { fontSize: 13, color: '#9ca3af', fontWeight: '500' },
})
