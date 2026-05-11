import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, Modal, TextInput,
} from 'react-native'
import { api } from '../lib/api'
import { AccountCardsSkeleton } from '../components/Skeleton'

type Network = 'JAZZ' | 'TELENOR' | 'ZONG' | 'UFONE' | 'WARID'

interface EasyLoadAccount {
  id: string
  network: Network
  phoneNumber: string
  currentBalance: number
}

const NET_COLOR: Record<Network, string> = {
  JAZZ: '#fecaca', TELENOR: '#bfdbfe', ZONG: '#e9d5ff',
  UFONE: '#bbf7d0', WARID: '#fed7aa',
}
const NET_TEXT: Record<Network, string> = {
  JAZZ: '#991b1b', TELENOR: '#1e3a5f', ZONG: '#4c1d95',
  UFONE: '#14532d', WARID: '#7c2d12',
}

export function EasyLoadScreen() {
  const [accounts, setAccounts] = useState<EasyLoadAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [loadModal, setLoadModal] = useState<EasyLoadAccount | null>(null)
  const [topupModal, setTopupModal] = useState<EasyLoadAccount | null>(null)
  const [saving, setSaving] = useState(false)

  // Forms
  const [addForm, setAddForm] = useState({ network: 'JAZZ' as Network, phoneNumber: '', currentBalance: '' })
  const [loadForm, setLoadForm] = useState({ customerPhone: '', amount: '', profitMargin: '10' })
  const [topupAmount, setTopupAmount] = useState('')

  const load = useCallback(async () => {
    try {
      const r = await api.get('/easy-load/accounts')
      setAccounts(r.data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false) }

  const addAccount = async () => {
    if (!addForm.phoneNumber || !addForm.currentBalance) return Alert.alert('Fill required fields')
    setSaving(true)
    try {
      await api.post('/easy-load/accounts', { network: addForm.network, phoneNumber: addForm.phoneNumber, currentBalance: Number(addForm.currentBalance) })
      setShowAdd(false)
      setAddForm({ network: 'JAZZ', phoneNumber: '', currentBalance: '' })
      await load()
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed')
    } finally { setSaving(false) }
  }

  const sendLoad = async () => {
    if (!loadModal || !loadForm.customerPhone || !loadForm.amount) return Alert.alert('Fill required fields')
    setSaving(true)
    try {
      await api.post(`/easy-load/accounts/${loadModal.id}/load`, {
        customerPhone: loadForm.customerPhone, amount: Number(loadForm.amount), profitMargin: Number(loadForm.profitMargin),
      })
      setLoadModal(null)
      setLoadForm({ customerPhone: '', amount: '', profitMargin: '10' })
      await load()
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed')
    } finally { setSaving(false) }
  }

  const topup = async () => {
    if (!topupModal || !topupAmount) return Alert.alert('Enter amount')
    setSaving(true)
    try {
      await api.post(`/easy-load/accounts/${topupModal.id}/topup`, { amount: Number(topupAmount) })
      setTopupModal(null)
      setTopupAmount('')
      await load()
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed')
    } finally { setSaving(false) }
  }

  if (loading) return <AccountCardsSkeleton rows={3} />

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Easy Load</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={s.addBtnText}>+ SIM</Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {accounts.length === 0
          ? <Text style={s.empty}>No SIM accounts yet. Add one to start.</Text>
          : accounts.map(acc => (
            <View key={acc.id} style={s.card}>
              <View style={s.cardTop}>
                <View style={[s.netBadge, { backgroundColor: NET_COLOR[acc.network] }]}>
                  <Text style={[s.netText, { color: NET_TEXT[acc.network] }]}>{acc.network}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.phone}>{acc.phoneNumber}</Text>
                  <Text style={s.balance}>PKR {Number(acc.currentBalance).toLocaleString()}</Text>
                </View>
              </View>
              <View style={s.actionRow}>
                <TouchableOpacity style={s.topupBtn} onPress={() => setTopupModal(acc)}>
                  <Text style={s.topupText}>↑ Top Up</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.loadBtn} onPress={() => setLoadModal(acc)}>
                  <Text style={s.loadText}>↓ Send Load</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        }
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Add SIM Modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Add SIM Account</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}><Text style={s.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          <View style={{ padding: 20 }}>
            <Text style={s.label}>Network *</Text>
            <View style={s.networkGrid}>
              {(['JAZZ','TELENOR','ZONG','UFONE','WARID'] as Network[]).map(n => (
                <TouchableOpacity key={n} style={[s.netOption, addForm.network === n && s.netOptionActive, { backgroundColor: addForm.network === n ? NET_COLOR[n] : '#f3f4f6' }]} onPress={() => setAddForm(f => ({ ...f, network: n }))}>
                  <Text style={[s.netOptionText, { color: addForm.network === n ? NET_TEXT[n] : '#374151' }]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.label}>SIM Phone Number *</Text>
            <TextInput style={s.input} keyboardType="phone-pad" value={addForm.phoneNumber} onChangeText={v => setAddForm(f => ({ ...f, phoneNumber: v }))} placeholder="03001234567" />
            <Text style={s.label}>Current Balance (PKR) *</Text>
            <TextInput style={s.input} keyboardType="numeric" value={addForm.currentBalance} onChangeText={v => setAddForm(f => ({ ...f, currentBalance: v }))} placeholder="0" />
            <TouchableOpacity style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={addAccount} disabled={saving}>
              <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Add SIM'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Load Modal */}
      <Modal visible={!!loadModal} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Send Load</Text>
            <TouchableOpacity onPress={() => setLoadModal(null)}><Text style={s.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          <View style={{ padding: 20 }}>
            {loadModal && (
              <View style={s.infoBox}>
                <Text style={s.infoText}>{loadModal.network} · {loadModal.phoneNumber}</Text>
                <Text style={s.infoBal}>Balance: PKR {Number(loadModal.currentBalance).toLocaleString()}</Text>
              </View>
            )}
            <Text style={s.label}>Customer Phone *</Text>
            <TextInput style={s.input} keyboardType="phone-pad" value={loadForm.customerPhone} onChangeText={v => setLoadForm(f => ({ ...f, customerPhone: v }))} placeholder="03001234567" />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Amount (PKR) *</Text>
                <TextInput style={s.input} keyboardType="numeric" value={loadForm.amount} onChangeText={v => setLoadForm(f => ({ ...f, amount: v }))} placeholder="100" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Your Profit</Text>
                <TextInput style={s.input} keyboardType="numeric" value={loadForm.profitMargin} onChangeText={v => setLoadForm(f => ({ ...f, profitMargin: v }))} />
              </View>
            </View>
            <TouchableOpacity style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={sendLoad} disabled={saving}>
              <Text style={s.saveBtnText}>{saving ? 'Sending…' : 'Send Load'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Top-up Modal */}
      <Modal visible={!!topupModal} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Top Up Balance</Text>
            <TouchableOpacity onPress={() => setTopupModal(null)}><Text style={s.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          <View style={{ padding: 20 }}>
            {topupModal && (
              <View style={s.infoBox}>
                <Text style={s.infoText}>{topupModal.network} · {topupModal.phoneNumber}</Text>
                <Text style={s.infoBal}>Current: PKR {Number(topupModal.currentBalance).toLocaleString()}</Text>
              </View>
            )}
            <Text style={s.label}>Amount (PKR) *</Text>
            <TextInput style={s.input} keyboardType="numeric" value={topupAmount} onChangeText={setTopupAmount} placeholder="500" autoFocus />
            {topupModal && topupAmount
              ? <Text style={s.previewBal}>After top-up: PKR {(Number(topupModal.currentBalance) + Number(topupAmount)).toLocaleString()}</Text>
              : null}
            <TouchableOpacity style={[s.saveBtn, { backgroundColor: '#16a34a' }, saving && s.saveBtnDisabled]} onPress={topup} disabled={saving}>
              <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Top Up'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f3f4f6' },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 52, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title:          { fontSize: 20, fontWeight: '700', color: '#111827' },
  addBtn:         { backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  addBtnText:     { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty:          { textAlign: 'center', color: '#9ca3af', marginTop: 48, fontSize: 14, paddingHorizontal: 32 },
  card:           { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  cardTop:        { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  netBadge:       { width: 64, height: 64, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  netText:        { fontWeight: '800', fontSize: 12 },
  phone:          { fontSize: 14, color: '#374151' },
  balance:        { fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 4 },
  actionRow:      { flexDirection: 'row', gap: 10 },
  topupBtn:       { flex: 1, backgroundColor: '#f0fdf4', borderRadius: 8, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
  topupText:      { color: '#16a34a', fontWeight: '700', fontSize: 13 },
  loadBtn:        { flex: 1, backgroundColor: '#2563eb', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  loadText:       { color: '#fff', fontWeight: '700', fontSize: 13 },
  modal:          { flex: 1, backgroundColor: '#fff' },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 52, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle:     { fontSize: 18, fontWeight: '700', color: '#111827' },
  closeBtn:       { fontSize: 20, color: '#6b7280', padding: 4 },
  label:          { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 4, marginTop: 14 },
  input:          { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827', backgroundColor: '#f9fafb' },
  networkGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  netOption:      { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
  netOptionActive:{ borderColor: '#9ca3af' },
  netOptionText:  { fontWeight: '700', fontSize: 13 },
  infoBox:        { backgroundColor: '#f3f4f6', borderRadius: 10, padding: 12, marginBottom: 4 },
  infoText:       { fontSize: 13, color: '#374151' },
  infoBal:        { fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 4 },
  previewBal:     { fontSize: 14, color: '#16a34a', fontWeight: '600', marginTop: 8 },
  saveBtn:        { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  saveBtnDisabled:{ opacity: 0.5 },
  saveBtnText:    { color: '#fff', fontWeight: '700', fontSize: 15 },
})
