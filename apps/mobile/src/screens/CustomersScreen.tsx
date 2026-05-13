import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, Modal, TextInput,
} from 'react-native'
import { api } from '../lib/api'
import { ListItemsSkeleton, Sk } from '../components/Skeleton'
import { STATUS_TOP } from '../lib/constants'

interface LedgerEntry { id: string; type: 'CREDIT' | 'PAYMENT'; amount: number; description: string; createdAt: string }
interface Sale { id: string; invoiceNumber: string; total: number; createdAt: string }
interface Customer {
  id: string; name: string; phone?: string; notes?: string
  balanceOwed: number; ledgerEntries?: LedgerEntry[]; sales?: Sale[]
}

interface Props { onBack: () => void }

export function CustomersScreen({ onBack }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filterOverdue, setFilterOverdue] = useState(false)

  // Detail view
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<Customer | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Modals
  const [showAdd, setShowAdd] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [saving, setSaving] = useState(false)

  // Forms
  const [addForm, setAddForm] = useState({ name: '', phone: '', notes: '' })
  const [paymentAmount, setPaymentAmount] = useState('')

  const loadCustomers = useCallback(async () => {
    try {
      const r = await api.get('/customers')
      setCustomers(r.data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true)
    try {
      const r = await api.get(`/customers/${id}`)
      setDetail(r.data)
    } catch { /* ignore */ }
    finally { setDetailLoading(false) }
  }, [])

  useEffect(() => { void loadCustomers() }, [loadCustomers])

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId)
    else setDetail(null)
  }, [selectedId, loadDetail])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadCustomers()
    setRefreshing(false)
  }

  const addCustomer = async () => {
    if (!addForm.name.trim()) return Alert.alert('Enter customer name')
    setSaving(true)
    try {
      await api.post('/customers', {
        name: addForm.name.trim(),
        phone: addForm.phone || undefined,
        notes: addForm.notes || undefined,
      })
      setShowAdd(false)
      setAddForm({ name: '', phone: '', notes: '' })
      await loadCustomers()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed')
    } finally { setSaving(false) }
  }

  const recordPayment = async () => {
    if (!detail || !paymentAmount || Number(paymentAmount) <= 0) return Alert.alert('Enter valid amount')
    setSaving(true)
    try {
      await api.post(`/customers/${detail.id}/payment`, { amount: Number(paymentAmount) })
      setShowPayment(false)
      setPaymentAmount('')
      await loadDetail(detail.id)
      await loadCustomers()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed')
    } finally { setSaving(false) }
  }

  const sendReminder = async () => {
    if (!detail) return
    try {
      await api.post(`/customers/${detail.id}/remind`)
      Alert.alert('✅ Reminder sent', `WhatsApp message sent to ${detail.phone}`)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to send reminder')
    }
  }

  // Filtered list
  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? '').includes(search)
    const matchFilter = !filterOverdue || Number(c.balanceOwed) > 0
    return matchSearch && matchFilter
  })

  const overdueCount = customers.filter(c => Number(c.balanceOwed) > 0).length
  const totalUdhaar = customers.reduce((s, c) => s + Number(c.balanceOwed), 0)

  // ─── Detail View ─────────────────────────────────────────────
  if (selectedId) {
    const balance = Number(detail?.balanceOwed ?? 0)
    return (
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setSelectedId(null)} style={s.backBtn}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={s.title} numberOfLines={1}>{detail?.name ?? '…'}</Text>
            {detail?.phone ? <Text style={s.subtitle}>{detail.phone}</Text> : null}
          </View>
          {detail && balance > 0 && (
            <TouchableOpacity style={s.payBtn} onPress={() => setShowPayment(true)}>
              <Text style={s.payBtnText}>💵 Pay</Text>
            </TouchableOpacity>
          )}
        </View>

        {detailLoading ? (
          <View style={{ padding: 16, gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => <Sk key={i} h={48} radius={12} />)}
          </View>
        ) : detail ? (
          <ScrollView>
            {/* Balance card */}
            <View style={[s.balanceCard, balance > 0 ? s.balanceCardRed : s.balanceCardGreen]}>
              <Text style={s.balanceLabel}>Outstanding Balance (Udhaar)</Text>
              <Text style={[s.balanceAmount, balance > 0 ? s.balanceRed : s.balanceGreen]}>
                PKR {balance.toLocaleString()}
              </Text>
              {balance === 0 && <Text style={s.balanceClear}>✓ All clear — no dues</Text>}
            </View>

            {/* Action buttons */}
            {balance > 0 && detail.phone && (
              <TouchableOpacity style={s.reminderBtn} onPress={sendReminder}>
                <Text style={s.reminderBtnText}>💬 Send WhatsApp Reminder</Text>
              </TouchableOpacity>
            )}

            {detail.notes ? (
              <View style={s.notesCard}>
                <Text style={s.notesText}>{detail.notes}</Text>
              </View>
            ) : null}

            {/* Ledger */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Transaction History</Text>
              {!detail.ledgerEntries?.length ? (
                <Text style={s.empty}>No transactions yet</Text>
              ) : detail.ledgerEntries.map(entry => (
                <View key={entry.id} style={s.ledgerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.ledgerDesc}>{entry.description}</Text>
                    <Text style={s.ledgerDate}>
                      {new Date(entry.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <Text style={[s.ledgerAmount, entry.type === 'CREDIT' ? s.ledgerDebit : s.ledgerCredit]}>
                    {entry.type === 'CREDIT' ? '+' : '−'} PKR {Number(entry.amount).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>

            {/* Sales */}
            {(detail.sales?.length ?? 0) > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>Recent Sales</Text>
                {detail.sales!.map(sale => (
                  <View key={sale.id} style={s.ledgerRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.ledgerDesc}>{sale.invoiceNumber}</Text>
                      <Text style={s.ledgerDate}>
                        {new Date(sale.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    <Text style={s.saleAmount}>PKR {Number(sale.total).toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        ) : null}

        {/* Record Payment Modal */}
        <Modal visible={showPayment} animationType="slide" presentationStyle="pageSheet">
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Record Payment</Text>
              <TouchableOpacity onPress={() => { setShowPayment(false); setPaymentAmount('') }}>
                <Text style={s.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              {detail && (
                <View style={s.owesBox}>
                  <Text style={s.owesName}>{detail.name}</Text>
                  <Text style={s.owesAmt}>Owes PKR {Number(detail.balanceOwed).toLocaleString()}</Text>
                </View>
              )}
              <Text style={s.label}>Amount Received (PKR) *</Text>
              <TextInput
                style={s.input} keyboardType="numeric" autoFocus
                value={paymentAmount} onChangeText={setPaymentAmount} placeholder="0"
              />
              {detail && Number(paymentAmount) > 0 && (
                <View style={[s.previewRow, Number(detail.balanceOwed) - Number(paymentAmount) <= 0 ? s.previewGreen : s.previewRed]}>
                  <Text style={s.previewLabel}>Remaining after payment</Text>
                  <Text style={s.previewValue}>PKR {Math.max(0, Number(detail.balanceOwed) - Number(paymentAmount)).toLocaleString()}</Text>
                </View>
              )}
              <TouchableOpacity style={[s.saveBtn, { backgroundColor: '#16a34a' }, saving && s.saveBtnDisabled]} onPress={recordPayment} disabled={saving}>
                <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Record Payment'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    )
  }

  // ─── List View ───────────────────────────────────────────────
  if (loading) return <ListItemsSkeleton rows={7} />

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Customers</Text>
          <Text style={s.subtitle}>{customers.length} registered · PKR {totalUdhaar.toLocaleString()} udhaar</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Overdue banner */}
      {overdueCount > 0 && (
        <View style={s.alertBanner}>
          <Text style={s.alertText}>⚠️ {overdueCount} customer{overdueCount > 1 ? 's' : ''} with outstanding balance</Text>
        </View>
      )}

      {/* Search + filter */}
      <View style={s.searchRow}>
        <TextInput
          style={s.searchInput} placeholder="Search by name or phone…"
          value={search} onChangeText={setSearch}
        />
        <TouchableOpacity
          style={[s.filterBtn, filterOverdue && s.filterBtnActive]}
          onPress={() => setFilterOverdue(f => !f)}
        >
          <Text style={[s.filterBtnText, filterOverdue && s.filterBtnTextActive]}>
            Udhaar{overdueCount > 0 ? ` (${overdueCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filtered.length === 0 ? (
          <Text style={s.empty}>{search ? 'No customers match your search' : 'No customers yet. Add your first!'}</Text>
        ) : filtered.map(c => {
          const balance = Number(c.balanceOwed)
          return (
            <TouchableOpacity key={c.id} style={s.custCard} onPress={() => setSelectedId(c.id)}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{c.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.custName}>{c.name}</Text>
                {c.phone ? <Text style={s.custPhone}>{c.phone}</Text> : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {balance > 0 ? (
                  <>
                    <Text style={s.udhaarAmt}>PKR {balance.toLocaleString()}</Text>
                    <Text style={s.udhaarLabel}>udhaar</Text>
                  </>
                ) : (
                  <View style={s.clearBadge}><Text style={s.clearBadgeText}>Clear</Text></View>
                )}
              </View>
              <Text style={s.chevron}>›</Text>
            </TouchableOpacity>
          )
        })}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Add Customer Modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Add Customer</Text>
            <TouchableOpacity onPress={() => { setShowAdd(false); setAddForm({ name: '', phone: '', notes: '' }) }}>
              <Text style={s.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: 20 }}>
            <Text style={s.label}>Name *</Text>
            <TextInput style={s.input} value={addForm.name} onChangeText={v => setAddForm(f => ({ ...f, name: v }))} placeholder="Customer name" autoFocus />
            <Text style={s.label}>Phone</Text>
            <TextInput style={s.input} keyboardType="phone-pad" value={addForm.phone} onChangeText={v => setAddForm(f => ({ ...f, phone: v }))} placeholder="03001234567" />
            <Text style={s.label}>Notes</Text>
            <TextInput style={[s.input, { height: 70, textAlignVertical: 'top' }]} multiline value={addForm.notes} onChangeText={v => setAddForm(f => ({ ...f, notes: v }))} placeholder="Optional notes…" />
            <TouchableOpacity style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={addCustomer} disabled={saving}>
              <Text style={s.saveBtnText}>{saving ? 'Adding…' : 'Add Customer'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f0fdfa' },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: STATUS_TOP, paddingBottom: 16, backgroundColor: '#0d9488' },
  backBtn:          { marginRight: 10 },
  backText:         { fontSize: 30, color: '#fff', fontWeight: '300', lineHeight: 34 },
  title:            { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitle:         { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  addBtn:           { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  addBtnText:       { color: '#fff', fontWeight: '700', fontSize: 13 },
  backBtn:          { padding: 4 },
  backText:         { fontSize: 15, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  payBtn:           { backgroundColor: '#16a34a', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  payBtnText:       { color: '#fff', fontWeight: '700', fontSize: 13 },
  alertBanner:      { backgroundColor: '#fffbeb', borderBottomWidth: 1, borderBottomColor: '#fde68a', paddingVertical: 10, paddingHorizontal: 16 },
  alertText:        { fontSize: 13, color: '#92400e', fontWeight: '600' },
  searchRow:        { flexDirection: 'row', gap: 8, padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ccfbf1' },
  searchInput:      { flex: 1, backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, fontSize: 14, color: '#111827' },
  filterBtn:        { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fff', justifyContent: 'center' },
  filterBtnActive:  { backgroundColor: '#f0fdfa', borderColor: '#0d9488' },
  filterBtnText:    { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  filterBtnTextActive: { color: '#0d9488' },
  empty:            { textAlign: 'center', color: '#9ca3af', marginTop: 56, fontSize: 14, paddingHorizontal: 32 },
  custCard:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  avatar:           { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f0fdfa', justifyContent: 'center', alignItems: 'center' },
  avatarText:       { fontSize: 18, fontWeight: '800', color: '#0d9488' },
  custName:         { fontSize: 14, fontWeight: '700', color: '#111827' },
  custPhone:        { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  udhaarAmt:        { fontSize: 14, fontWeight: '800', color: '#dc2626' },
  udhaarLabel:      { fontSize: 10, color: '#f87171', marginTop: 1 },
  clearBadge:       { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  clearBadgeText:   { fontSize: 11, fontWeight: '700', color: '#16a34a' },
  chevron:          { fontSize: 22, color: '#d1d5db', marginLeft: 8 },
  // Detail view
  balanceCard:      { margin: 12, borderRadius: 18, padding: 18, borderWidth: 1 },
  balanceCardRed:   { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  balanceCardGreen: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  balanceLabel:     { fontSize: 11, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceAmount:    { fontSize: 34, fontWeight: '800', marginTop: 4, letterSpacing: -1 },
  balanceRed:       { color: '#dc2626' },
  balanceGreen:     { color: '#16a34a' },
  balanceClear:     { fontSize: 13, color: '#16a34a', marginTop: 4 },
  reminderBtn:      { marginHorizontal: 12, marginBottom: 8, backgroundColor: '#f0fdf4', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
  reminderBtnText:  { color: '#15803d', fontWeight: '700', fontSize: 14 },
  notesCard:        { marginHorizontal: 12, marginBottom: 8, backgroundColor: '#fff', borderRadius: 14, padding: 14 },
  notesText:        { fontSize: 14, color: '#374151' },
  section:          { marginHorizontal: 12, marginBottom: 8, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  sectionTitle:     { fontSize: 12, fontWeight: '700', color: '#374151', padding: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f0fdfa' },
  ledgerRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  ledgerDesc:       { fontSize: 13, color: '#374151', fontWeight: '500' },
  ledgerDate:       { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  ledgerAmount:     { fontSize: 13, fontWeight: '700' },
  ledgerDebit:      { color: '#dc2626' },
  ledgerCredit:     { color: '#16a34a' },
  saleAmount:       { fontSize: 13, fontWeight: '700', color: '#111827' },
  // Modals
  modal:            { flex: 1, backgroundColor: '#fff' },
  modalHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle:       { fontSize: 18, fontWeight: '800', color: '#111827' },
  closeBtn:         { fontSize: 18, color: '#6b7280', padding: 4 },
  label:            { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  input:            { backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#111827' },
  owesBox:          { backgroundColor: '#fef2f2', borderRadius: 14, padding: 14, marginBottom: 4, borderWidth: 1, borderColor: '#fecaca' },
  owesName:         { fontSize: 15, fontWeight: '700', color: '#111827' },
  owesAmt:          { fontSize: 20, fontWeight: '800', color: '#dc2626', marginTop: 4 },
  previewRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, marginTop: 8 },
  previewGreen:     { backgroundColor: '#f0fdf4' },
  previewRed:       { backgroundColor: '#fef2f2' },
  previewLabel:     { fontSize: 13, color: '#374151' },
  previewValue:     { fontSize: 14, fontWeight: '700', color: '#111827' },
  saveBtn:          { backgroundColor: '#0d9488', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 24, shadowColor: '#0d9488', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  saveBtnDisabled:  { opacity: 0.55 },
  saveBtnText:      { color: '#fff', fontWeight: '700', fontSize: 15 },
})
