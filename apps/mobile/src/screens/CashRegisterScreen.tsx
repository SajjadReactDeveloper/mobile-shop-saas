import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, Modal, TextInput,
} from 'react-native'
import { api } from '../lib/api'
import { AccountCardsSkeleton } from '../components/Skeleton'
import { STATUS_TOP } from '../lib/constants'

interface CashExpense { id: string; description: string; amount: number; createdAt: string }
interface QuickSale   { id: string; productName: string; buyingPrice: number; sellingPrice: number; qty: number; createdAt: string }

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
  quickSales: QuickSale[]
}

interface Props { onBack: () => void }

const EMPTY_QUICK = { productName: '', buyingPrice: '', sellingPrice: '', qty: '1' }

export function CashRegisterScreen({ onBack }: Props) {
  const [register, setRegister] = useState<CashRegister | null | undefined>(undefined)
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving]         = useState(false)

  const [showOpen,      setShowOpen]      = useState(false)
  const [showExpense,   setShowExpense]   = useState(false)
  const [showQuickSale, setShowQuickSale] = useState(false)

  const [openingBal,   setOpeningBal]   = useState('')
  const [expenseForm,  setExpenseForm]  = useState({ description: '', amount: '' })
  const [quickForm,    setQuickForm]    = useState(EMPTY_QUICK)

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

  /* â”€â”€ Open day â”€â”€ */
  const openDay = async () => {
    if (!openingBal) return Alert.alert('Enter opening balance')
    setSaving(true)
    try {
      await api.post('/cash-register/open', { openingBalance: Number(openingBal) })
      setShowOpen(false); setOpeningBal('')
      await load()
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed')
    } finally { setSaving(false) }
  }

  /* â”€â”€ Add expense â”€â”€ */
  const addExpense = async () => {
    if (!register || !expenseForm.description || !expenseForm.amount) return Alert.alert('Fill required fields')
    setSaving(true)
    try {
      await api.post(`/cash-register/${register.id}/expense`, { description: expenseForm.description, amount: Number(expenseForm.amount) })
      setShowExpense(false); setExpenseForm({ description: '', amount: '' })
      await load()
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed')
    } finally { setSaving(false) }
  }

  /* â”€â”€ Add quick sale â”€â”€ */
  const addQuickSale = async () => {
    if (!register) return
    if (!quickForm.productName || !quickForm.sellingPrice) return Alert.alert('Fill required fields')
    setSaving(true)
    try {
      await api.post(`/cash-register/${register.id}/quick-sale`, {
        productName:  quickForm.productName,
        buyingPrice:  Number(quickForm.buyingPrice) || 0,
        sellingPrice: Number(quickForm.sellingPrice),
        qty:          Math.max(1, Number(quickForm.qty) || 1),
      })
      setShowQuickSale(false); setQuickForm(EMPTY_QUICK)
      await load()
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed')
    } finally { setSaving(false) }
  }

  /* â”€â”€ Close day â”€â”€ */
  const closeDay = async () => {
    if (!register) return
    const income   = Number(register.salesCash) + Number(register.easyLoadCash) + Number(register.easypaisaCash) + Number(register.repairCash)
    const expected = Number(register.openingBalance) + income - Number(register.expenses)
    Alert.alert(
      'Close Day?',
      `Expected closing: PKR ${expected.toLocaleString()}. This cannot be undone by cashiers.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Close Day', style: 'destructive', onPress: async () => {
          setSaving(true)
          try { await api.post(`/cash-register/${register.id}/close`); await load() }
          catch (e: any) { Alert.alert('Error', e?.response?.data?.message ?? 'Only owner can close day') }
          finally { setSaving(false) }
        }},
      ]
    )
  }

  if (loading) return <AccountCardsSkeleton rows={2} />

  const income          = register ? Number(register.salesCash) + Number(register.easyLoadCash) + Number(register.easypaisaCash) + Number(register.repairCash) : 0
  const expectedClosing = register ? Number(register.openingBalance) + income - Number(register.expenses) : 0

  /* â”€â”€ Quick sale live preview â”€â”€ */
  const qQty     = Math.max(1, Number(quickForm.qty)    || 1)
  const qBuy     = Number(quickForm.buyingPrice)  || 0
  const qSell    = Number(quickForm.sellingPrice) || 0
  const qRevenue = qSell * qQty
  const qProfit  = (qSell - qBuy) * qQty

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.backText}>â€¹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Cash Register</Text>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {register === null || register === undefined ? (
          <View style={s.emptyWrap}>
            <Text style={s.emptyEmoji}>ðŸ’µ</Text>
            <Text style={s.emptyTitle}>Day not opened</Text>
            <Text style={s.emptySub}>Open today's session to start tracking cash</Text>
            <TouchableOpacity style={s.openBtn} onPress={() => setShowOpen(true)}>
              <Text style={s.openBtnText}>Open Day</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {register.isClosed && (
              <View style={s.closedBanner}><Text style={s.closedText}>ðŸ”’ Day is closed</Text></View>
            )}

            {/* Summary card */}
            <View style={s.card}>
              <Text style={s.cardTitle}>{new Date(register.date).toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
              <View style={s.row}><Text style={s.rowLabel}>Opening Balance</Text><Text style={s.rowVal}>PKR {Number(register.openingBalance).toLocaleString()}</Text></View>
              <View style={s.row}><Text style={s.rowLabel}>Sales (Cash)</Text><Text style={[s.rowVal, s.green]}>PKR {Number(register.salesCash).toLocaleString()}</Text></View>
              <View style={s.row}><Text style={s.rowLabel}>Easy Load</Text><Text style={[s.rowVal, s.green]}>PKR {Number(register.easyLoadCash).toLocaleString()}</Text></View>
              <View style={s.row}><Text style={s.rowLabel}>Easypaisa</Text><Text style={[s.rowVal, s.green]}>PKR {Number(register.easypaisaCash).toLocaleString()}</Text></View>
              <View style={s.row}><Text style={s.rowLabel}>Repairs</Text><Text style={[s.rowVal, s.green]}>PKR {Number(register.repairCash).toLocaleString()}</Text></View>
              <View style={s.row}><Text style={s.rowLabel}>Expenses</Text><Text style={[s.rowVal, s.red]}>âˆ’PKR {Number(register.expenses).toLocaleString()}</Text></View>
              <View style={[s.row, s.totalRow]}>
                <Text style={s.totalLabel}>{register.isClosed ? 'Closing Balance' : 'Expected Closing'}</Text>
                <Text style={s.totalVal}>PKR {(register.isClosed ? Number(register.closingBalance) : expectedClosing).toLocaleString()}</Text>
              </View>
            </View>

            {/* Quick Sales list */}
            {register.quickSales && register.quickSales.length > 0 && (
              <View style={s.card}>
                <Text style={s.cardTitle}>Quick Sales</Text>
                {register.quickSales.map(qs => {
                  const rev  = Number(qs.sellingPrice) * qs.qty
                  const prof = (Number(qs.sellingPrice) - Number(qs.buyingPrice)) * qs.qty
                  return (
                    <View key={qs.id} style={s.qsRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.qsName}>{qs.productName}</Text>
                        <Text style={s.qsSub}>{qs.qty} Ã— PKR {Number(qs.sellingPrice).toLocaleString()}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[s.rowVal, s.green]}>+PKR {rev.toLocaleString()}</Text>
                        <Text style={[s.qsSub, prof >= 0 ? s.violet : s.red]}>
                          {prof >= 0 ? '+' : ''}PKR {prof.toLocaleString()} profit
                        </Text>
                      </View>
                    </View>
                  )
                })}
              </View>
            )}

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
              <>
                <View style={s.actions}>
                  <TouchableOpacity style={s.saleBtn} onPress={() => setShowQuickSale(true)}>
                    <Text style={s.saleBtnText}>ðŸ›’ Add Sale</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.expenseBtn} onPress={() => setShowExpense(true)}>
                    <Text style={s.expenseBtnText}>+ Add Expense</Text>
                  </TouchableOpacity>
                </View>
                <View style={s.actionsSingle}>
                  <TouchableOpacity style={[s.closeBtn2, saving && s.disabled]} onPress={closeDay} disabled={saving}>
                    <Text style={s.closeBtnText}>ðŸ”’ Close Day</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* â”€â”€ Open Day Modal â”€â”€ */}
      <Modal visible={showOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Open Day</Text>
            <TouchableOpacity onPress={() => setShowOpen(false)}><Text style={s.closeBtnX}>âœ•</Text></TouchableOpacity>
          </View>
          <View style={{ padding: 20 }}>
            <Text style={s.modalDesc}>Enter the cash you have in hand to start today's session.</Text>
            <Text style={s.label}>Opening Cash (PKR) *</Text>
            <TextInput style={s.input} keyboardType="numeric" value={openingBal} onChangeText={setOpeningBal} placeholder="0" autoFocus />
            <TouchableOpacity style={[s.saveBtn, saving && s.disabled]} onPress={openDay} disabled={saving}>
              <Text style={s.saveBtnText}>{saving ? 'Openingâ€¦' : 'Open Day'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* â”€â”€ Add Expense Modal â”€â”€ */}
      <Modal visible={showExpense} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Add Expense</Text>
            <TouchableOpacity onPress={() => setShowExpense(false)}><Text style={s.closeBtnX}>âœ•</Text></TouchableOpacity>
          </View>
          <View style={{ padding: 20 }}>
            <Text style={s.label}>Description *</Text>
            <TextInput style={s.input} value={expenseForm.description} onChangeText={v => setExpenseForm(f => ({ ...f, description: v }))} placeholder="Electricity bill" autoFocus />
            <Text style={s.label}>Amount (PKR) *</Text>
            <TextInput style={s.input} keyboardType="numeric" value={expenseForm.amount} onChangeText={v => setExpenseForm(f => ({ ...f, amount: v }))} placeholder="0" />
            <TouchableOpacity style={[s.saveBtn, saving && s.disabled]} onPress={addExpense} disabled={saving}>
              <Text style={s.saveBtnText}>{saving ? 'Savingâ€¦' : 'Add Expense'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* â”€â”€ Add Quick Sale Modal â”€â”€ */}
      <Modal visible={showQuickSale} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Add Quick Sale</Text>
            <TouchableOpacity onPress={() => { setShowQuickSale(false); setQuickForm(EMPTY_QUICK) }}>
              <Text style={s.closeBtnX}>âœ•</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 20 }}>
            <Text style={s.label}>Product Name *</Text>
            <TextInput
              style={s.input}
              value={quickForm.productName}
              onChangeText={v => setQuickForm(f => ({ ...f, productName: v }))}
              placeholder="e.g. Samsung A15 Cover"
              autoFocus
            />

            <View style={s.row2}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={s.label}>Original Price (PKR)</Text>
                <TextInput
                  style={s.input}
                  keyboardType="numeric"
                  value={quickForm.buyingPrice}
                  onChangeText={v => setQuickForm(f => ({ ...f, buyingPrice: v }))}
                  placeholder="0"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={s.label}>Sale Price (PKR) *</Text>
                <TextInput
                  style={s.input}
                  keyboardType="numeric"
                  value={quickForm.sellingPrice}
                  onChangeText={v => setQuickForm(f => ({ ...f, sellingPrice: v }))}
                  placeholder="0"
                />
              </View>
            </View>

            <Text style={s.label}>Quantity *</Text>
            <TextInput
              style={s.input}
              keyboardType="numeric"
              value={quickForm.qty}
              onChangeText={v => setQuickForm(f => ({ ...f, qty: v }))}
              placeholder="1"
            />

            {/* Live preview */}
            {qSell > 0 && (
              <View style={s.previewRow}>
                <View style={s.previewCard}>
                  <Text style={s.previewLabel}>Revenue</Text>
                  <Text style={[s.previewVal, s.green]}>PKR {qRevenue.toLocaleString()}</Text>
                </View>
                <View style={[s.previewCard, { marginLeft: 10 }]}>
                  <Text style={s.previewLabel}>Profit</Text>
                  <Text style={[s.previewVal, qProfit >= 0 ? s.violet : s.red]}>
                    {qProfit >= 0 ? '+' : ''}PKR {qProfit.toLocaleString()}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity style={[s.saveBtn, saving && s.disabled]} onPress={addQuickSale} disabled={saving}>
              <Text style={s.saveBtnText}>{saving ? 'Savingâ€¦' : 'ðŸ›’ Add Sale'}</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f0f9ff' },
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: STATUS_TOP, paddingBottom: 16, backgroundColor: '#2563eb' },
  backBtn:        { marginRight: 10 },
  backText:       { fontSize: 30, color: '#fff', fontWeight: '300', lineHeight: 34 },
  title:          { fontSize: 22, fontWeight: '800', color: '#fff' },
  emptyWrap:      { alignItems: 'center', paddingTop: 72, paddingHorizontal: 32 },
  emptyEmoji:     { fontSize: 56, marginBottom: 16 },
  emptyTitle:     { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 8 },
  emptySub:       { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  openBtn:        { backgroundColor: '#2563eb', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 },
  openBtnText:    { color: '#fff', fontWeight: '700', fontSize: 16 },
  closedBanner:   { margin: 12, backgroundColor: '#f3f4f6', borderRadius: 12, padding: 14, alignItems: 'center' },
  closedText:     { fontSize: 14, color: '#374151', fontWeight: '600' },
  card:           { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTitle:      { fontSize: 12, fontWeight: '700', color: '#2563eb', marginBottom: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  row:            { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  rowLabel:       { fontSize: 14, color: '#6b7280' },
  rowVal:         { fontSize: 14, fontWeight: '600', color: '#111827' },
  green:          { color: '#16a34a' },
  red:            { color: '#dc2626' },
  violet:         { color: '#2563eb' },
  totalRow:       { borderBottomWidth: 0, marginTop: 4, paddingTop: 12, borderTopWidth: 1.5, borderTopColor: '#e5e7eb' },
  totalLabel:     { fontSize: 15, fontWeight: '800', color: '#111827' },
  totalVal:       { fontSize: 20, fontWeight: '800', color: '#2563eb' },
  // Quick sale row
  qsRow:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  qsName:         { fontSize: 14, fontWeight: '600', color: '#111827' },
  qsSub:          { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  // Action buttons
  actions:        { flexDirection: 'row', gap: 10, marginHorizontal: 12, marginTop: 12 },
  actionsSingle:  { marginHorizontal: 12, marginTop: 8 },
  saleBtn:        { flex: 1, backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saleBtnText:    { color: '#fff', fontWeight: '700', fontSize: 14 },
  expenseBtn:     { flex: 1, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#e5e7eb' },
  expenseBtnText: { color: '#374151', fontWeight: '700', fontSize: 14 },
  closeBtn2:      { backgroundColor: '#dc2626', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  closeBtnText:   { color: '#fff', fontWeight: '700', fontSize: 14 },
  disabled:       { opacity: 0.55 },
  // Modal
  modal:          { flex: 1, backgroundColor: '#fff' },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle:     { fontSize: 18, fontWeight: '800', color: '#111827' },
  modalDesc:      { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  closeBtnX:      { fontSize: 18, color: '#6b7280', padding: 4 },
  label:          { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  input:          { backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#111827' },
  row2:           { flexDirection: 'row' },
  previewRow:     { flexDirection: 'row', marginTop: 16 },
  previewCard:    { flex: 1, backgroundColor: '#eff6ff', borderRadius: 12, padding: 12, alignItems: 'center' },
  previewLabel:   { fontSize: 11, color: '#6b7280', marginBottom: 4 },
  previewVal:     { fontSize: 15, fontWeight: '800' },
  saveBtn:        { backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 24, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  saveBtnText:    { color: '#fff', fontWeight: '700', fontSize: 15 },
})
