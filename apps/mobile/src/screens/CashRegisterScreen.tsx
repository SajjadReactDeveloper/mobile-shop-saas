import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native'
import { api } from '../lib/api'

interface CashExpense { id: string; description: string; amount: number; createdAt: string }

interface CashRegister {
  id: string
  date: string
  openingBalance: number
  closingBalance?: number
  salesCash: number
  easyLoadCash: number
  easypaisaCash: number
  repairCash: number
  expenses: number
  isClosed: boolean
  expenseItems: CashExpense[]
}

export function CashRegisterScreen() {
  const [register, setRegister] = useState<CashRegister | null | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showOpen, setShowOpen] = useState(false)
  const [showExpense, setShowExpense] = useState(false)
  const [saving, setSaving] = useState(false)
  const [openingBal, setOpeningBal] = useState('')
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '' })

  const load = useCallback(async () => {
    try {
      const r = await api.get('/cash-register/today')
      setRegister(r.data)
    } catch {
      setRegister(null)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false) }

  const openDay = async () => {
    if (!openingBal) return Alert.alert('Enter opening balance')
    setSaving(true)
    try {
      await api.post('/cash-register/open', { openingBalance: Number(openingBal) })
      setShowOpen(false)
      setOpeningBal('')
      await load()
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed')
    } finally { setSaving(false) }
  }

  const addExpense = async () => {
    if (!register || !expenseForm.description || !expenseForm.amount) return Alert.alert('Fill required fields')
    setSaving(true)
    try {
      await api.post(`/cash-register/${register.id}/expense`, { description: expenseForm.description, amount: Number(expenseForm.amount) })
      setShowExpense(false)
      setExpenseForm({ description: '', amount: '' })
      await load()
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed')
    } finally { setSaving(false) }
  }

  const closeDay = async () => {
    if (!register) return
    const income = Number(register.salesCash) + Number(register.easyLoadCash) + Number(register.easypaisaCash) + Number(register.repairCash)
    const expected = Number(register.openingBalance) + income - Number(register.expenses)
    Alert.alert(
      'Close Day?',
      `Expected closing: PKR ${expected.toLocaleString()}. This cannot be undone by cashiers.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Close Day', style: 'destructive', onPress: async () => {
          setSaving(true)
          try {
            await api.post(`/cash-register/${register.id}/close`)
            await load()
          } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message ?? 'Only owner can close day')
          } finally { setSaving(false) }
        }},
      ]
    )
  }

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#2563eb" /></View>

  const income = register
    ? Number(register.salesCash) + Number(register.easyLoadCash) + Number(register.easypaisaCash) + Number(register.repairCash)
    : 0
  const expectedClosing = register ? Number(register.openingBalance) + income - Number(register.expenses) : 0

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>Cash Register</Text></View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {register === null || register === undefined ? (
          <View style={s.emptyWrap}>
            <Text style={s.emptyEmoji}>💵</Text>
            <Text style={s.emptyTitle}>Day not opened</Text>
            <Text style={s.emptySub}>Open today's session to start tracking cash</Text>
            <TouchableOpacity style={s.openBtn} onPress={() => setShowOpen(true)}>
              <Text style={s.openBtnText}>Open Day</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {register.isClosed && (
              <View style={s.closedBanner}><Text style={s.closedText}>🔒 Day is closed</Text></View>
            )}

            {/* Summary card */}
            <View style={s.card}>
              <Text style={s.cardTitle}>{new Date(register.date).toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>

              <View style={s.row}><Text style={s.rowLabel}>Opening Balance</Text><Text style={s.rowVal}>PKR {Number(register.openingBalance).toLocaleString()}</Text></View>
              <View style={s.row}><Text style={s.rowLabel}>Sales (Cash)</Text><Text style={[s.rowVal, s.green]}>PKR {Number(register.salesCash).toLocaleString()}</Text></View>
              <View style={s.row}><Text style={s.rowLabel}>Easy Load</Text><Text style={[s.rowVal, s.green]}>PKR {Number(register.easyLoadCash).toLocaleString()}</Text></View>
              <View style={s.row}><Text style={s.rowLabel}>Easypaisa</Text><Text style={[s.rowVal, s.green]}>PKR {Number(register.easypaisaCash).toLocaleString()}</Text></View>
              <View style={s.row}><Text style={s.rowLabel}>Repairs</Text><Text style={[s.rowVal, s.green]}>PKR {Number(register.repairCash).toLocaleString()}</Text></View>
              <View style={s.row}><Text style={s.rowLabel}>Expenses</Text><Text style={[s.rowVal, s.red]}>−PKR {Number(register.expenses).toLocaleString()}</Text></View>
              <View style={[s.row, s.totalRow]}>
                <Text style={s.totalLabel}>{register.isClosed ? 'Closing Balance' : 'Expected Closing'}</Text>
                <Text style={s.totalVal}>PKR {(register.isClosed ? Number(register.closingBalance) : expectedClosing).toLocaleString()}</Text>
              </View>
            </View>

            {/* Expenses list */}
            {register.expenseItems.length > 0 && (
              <View style={s.card}>
                <Text style={s.cardTitle}>Expenses</Text>
                {register.expenseItems.map(e => (
                  <View key={e.id} style={s.row}>
                    <Text style={s.rowLabel}>{e.description}</Text>
                    <Text style={[s.rowVal, s.red]}>PKR {Number(e.amount).toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Actions */}
            {!register.isClosed && (
              <View style={s.actions}>
                <TouchableOpacity style={s.expenseBtn} onPress={() => setShowExpense(true)}>
                  <Text style={s.expenseBtnText}>+ Add Expense</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.closeBtn2, saving && s.disabled]} onPress={closeDay} disabled={saving}>
                  <Text style={s.closeBtnText}>🔒 Close Day</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Open Day Modal */}
      <Modal visible={showOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Open Day</Text>
            <TouchableOpacity onPress={() => setShowOpen(false)}><Text style={s.closeBtnX}>✕</Text></TouchableOpacity>
          </View>
          <View style={{ padding: 20 }}>
            <Text style={s.modalDesc}>Enter the cash you have in hand to start today's session.</Text>
            <Text style={s.label}>Opening Cash (PKR) *</Text>
            <TextInput style={s.input} keyboardType="numeric" value={openingBal} onChangeText={setOpeningBal} placeholder="0" autoFocus />
            <TouchableOpacity style={[s.saveBtn, saving && s.disabled]} onPress={openDay} disabled={saving}>
              <Text style={s.saveBtnText}>{saving ? 'Opening…' : 'Open Day'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Expense Modal */}
      <Modal visible={showExpense} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Add Expense</Text>
            <TouchableOpacity onPress={() => setShowExpense(false)}><Text style={s.closeBtnX}>✕</Text></TouchableOpacity>
          </View>
          <View style={{ padding: 20 }}>
            <Text style={s.label}>Description *</Text>
            <TextInput style={s.input} value={expenseForm.description} onChangeText={v => setExpenseForm(f => ({ ...f, description: v }))} placeholder="Electricity bill" autoFocus />
            <Text style={s.label}>Amount (PKR) *</Text>
            <TextInput style={s.input} keyboardType="numeric" value={expenseForm.amount} onChangeText={v => setExpenseForm(f => ({ ...f, amount: v }))} placeholder="0" />
            <TouchableOpacity style={[s.saveBtn, saving && s.disabled]} onPress={addExpense} disabled={saving}>
              <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Add Expense'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f3f4f6' },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:       { padding: 20, paddingTop: 52, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title:        { fontSize: 20, fontWeight: '700', color: '#111827' },
  emptyWrap:    { alignItems: 'center', paddingTop: 64, paddingHorizontal: 32 },
  emptyEmoji:   { fontSize: 48, marginBottom: 12 },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  emptySub:     { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  openBtn:      { backgroundColor: '#2563eb', paddingHorizontal: 28, paddingVertical: 13, borderRadius: 12 },
  openBtnText:  { color: '#fff', fontWeight: '700', fontSize: 15 },
  closedBanner: { margin: 12, backgroundColor: '#f3f4f6', borderRadius: 10, padding: 12, alignItems: 'center' },
  closedText:   { fontSize: 14, color: '#374151', fontWeight: '600' },
  card:         { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  cardTitle:    { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 12 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  rowLabel:     { fontSize: 13, color: '#6b7280' },
  rowVal:       { fontSize: 13, fontWeight: '600', color: '#111827' },
  green:        { color: '#16a34a' },
  red:          { color: '#dc2626' },
  totalRow:     { borderBottomWidth: 0, marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  totalLabel:   { fontSize: 14, fontWeight: '700', color: '#111827' },
  totalVal:     { fontSize: 16, fontWeight: '800', color: '#2563eb' },
  actions:      { flexDirection: 'row', gap: 12, margin: 12 },
  expenseBtn:   { flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  expenseBtnText: { color: '#374151', fontWeight: '700', fontSize: 14 },
  closeBtn2:    { flex: 1, backgroundColor: '#dc2626', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  closeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  disabled:     { opacity: 0.5 },
  modal:        { flex: 1, backgroundColor: '#fff' },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 52, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle:   { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalDesc:    { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  closeBtnX:    { fontSize: 20, color: '#6b7280', padding: 4 },
  label:        { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 4, marginTop: 14 },
  input:        { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827', backgroundColor: '#f9fafb' },
  saveBtn:      { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  saveBtnText:  { color: '#fff', fontWeight: '700', fontSize: 15 },
})
