import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native'
import { api } from '../lib/api'
import { AccountCardsSkeleton } from '../components/Skeleton'
import { STATUS_TOP } from '../lib/constants'

type TxnType = 'SEND' | 'RECEIVE' | 'CASH_IN' | 'CASH_OUT' | 'WITHDRAW'

interface EasypaisaAccount { id: string; accountPhone: string; currentBalance: number; isActive: boolean }
interface EasypaisaTxn {
  id: string; type: TxnType; amount: number; fee?: number; commission?: number
  customerPhone?: string; description?: string; balanceAfter: number; createdAt: string
}

const TXN_TYPES: { id: TxnType; label: string; emoji: string; isCredit: boolean }[] = [
  { id: 'RECEIVE',  label: 'Receive',   emoji: '↙', isCredit: true  },
  { id: 'CASH_IN',  label: 'Cash In',   emoji: '↓',  isCredit: true  },
  { id: 'SEND',     label: 'Send',      emoji: '↗', isCredit: false },
  { id: 'CASH_OUT', label: 'Cash Out',  emoji: '↑',  isCredit: false },
  { id: 'WITHDRAW', label: 'Withdraw',  emoji: '🏦', isCredit: false },
]

const TXN_LABEL: Record<TxnType, string> = {
  SEND: 'Send Money', RECEIVE: 'Receive', CASH_IN: 'Cash In',
  CASH_OUT: 'Cash Out', WITHDRAW: 'Withdraw',
}

interface Props { onBack: () => void }

export function EasypaisaScreen({ onBack }: Props) {
  const [accounts, setAccounts] = useState<EasypaisaAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Modals
  const [showAdd, setShowAdd] = useState(false)
  const [txnAccount, setTxnAccount] = useState<EasypaisaAccount | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [txns, setTxns] = useState<Record<string, EasypaisaTxn[]>>({})
  const [txnLoading, setTxnLoading] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Forms
  const [addForm, setAddForm] = useState({ accountPhone: '', currentBalance: '' })
  const [txnForm, setTxnForm] = useState({
    type: 'RECEIVE' as TxnType, amount: '', fee: '', commission: '',
    customerPhone: '', description: '',
  })

  const loadAccounts = useCallback(async () => {
    try {
      const r = await api.get('/easypaisa/accounts')
      setAccounts(r.data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  const loadTxns = useCallback(async (id: string) => {
    setTxnLoading(id)
    try {
      const r = await api.get(`/easypaisa/accounts/${id}/transactions`)
      setTxns(prev => ({ ...prev, [id]: r.data }))
    } catch { /* ignore */ }
    finally { setTxnLoading(null) }
  }, [])

  useEffect(() => { void loadAccounts() }, [loadAccounts])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadAccounts()
    setRefreshing(false)
  }

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
    } else {
      setExpandedId(id)
      if (!txns[id]) void loadTxns(id)
    }
  }

  const addAccount = async () => {
    if (!addForm.accountPhone || !addForm.currentBalance) return Alert.alert('Fill required fields')
    setSaving(true)
    try {
      await api.post('/easypaisa/accounts', {
        accountPhone: addForm.accountPhone,
        currentBalance: Number(addForm.currentBalance),
      })
      setShowAdd(false)
      setAddForm({ accountPhone: '', currentBalance: '' })
      await loadAccounts()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed')
    } finally { setSaving(false) }
  }

  const submitTxn = async () => {
    if (!txnAccount || !txnForm.amount || Number(txnForm.amount) <= 0) {
      return Alert.alert('Enter valid amount')
    }
    setSaving(true)
    try {
      await api.post(`/easypaisa/accounts/${txnAccount.id}/transactions`, {
        type: txnForm.type,
        amount: Number(txnForm.amount),
        fee: txnForm.fee ? Number(txnForm.fee) : undefined,
        commission: txnForm.commission ? Number(txnForm.commission) : undefined,
        customerPhone: txnForm.customerPhone || undefined,
        description: txnForm.description || undefined,
      })
      setTxnAccount(null)
      setTxnForm({ type: 'RECEIVE', amount: '', fee: '', commission: '', customerPhone: '', description: '' })
      // Refresh txns if expanded
      if (expandedId === txnAccount.id) void loadTxns(txnAccount.id)
      await loadAccounts()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed')
    } finally { setSaving(false) }
  }

  const selectedType = TXN_TYPES.find(t => t.id === txnForm.type)
  const isCredit = selectedType?.isCredit ?? true
  const balanceAfter = txnAccount
    ? isCredit
      ? Number(txnAccount.currentBalance) + Number(txnForm.amount || 0)
      : Number(txnAccount.currentBalance) - Number(txnForm.amount || 0)
    : 0

  if (loading) return <AccountCardsSkeleton rows={2} />

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Easypaisa</Text>
          <Text style={s.subtitle}>{accounts.length} wallet{accounts.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={s.addBtnText}>+ Wallet</Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {accounts.length === 0 ? (
          <Text style={s.empty}>No Easypaisa wallets yet.{'\n'}Add one to start tracking.</Text>
        ) : accounts.map(acc => (
          <View key={acc.id} style={s.card}>
            {/* Card top */}
            <View style={s.cardTop}>
              <View style={s.walletIcon}>
                <Text style={s.walletEmoji}>💚</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.accPhone}>{acc.accountPhone}</Text>
                <Text style={s.accBalance}>PKR {Number(acc.currentBalance).toLocaleString()}</Text>
              </View>
            </View>

            {/* Action row */}
            <View style={s.actionRow}>
              <TouchableOpacity style={s.txnBtn} onPress={() => setTxnAccount(acc)}>
                <Text style={s.txnBtnText}>+ Transaction</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.historyBtn}
                onPress={() => toggleExpand(acc.id)}
              >
                <Text style={s.historyBtnText}>{expandedId === acc.id ? '▲ Hide' : '▼ History'}</Text>
              </TouchableOpacity>
            </View>

            {/* Transaction history */}
            {expandedId === acc.id && (
              <View style={s.historyPanel}>
                <View style={s.historyDivider} />
                {txnLoading === acc.id ? (
                  <ActivityIndicator size="small" color="#16a34a" style={{ margin: 12 }} />
                ) : !txns[acc.id]?.length ? (
                  <Text style={s.historyEmpty}>No transactions yet</Text>
                ) : txns[acc.id].slice(0, 10).map(t => {
                  const isCredit = t.type === 'RECEIVE' || t.type === 'CASH_IN'
                  return (
                    <View key={t.id} style={s.txnRow}>
                      <View style={[s.txnDot, isCredit ? s.txnDotGreen : s.txnDotRed]} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.txnRowLabel}>{TXN_LABEL[t.type]}{t.customerPhone ? ` → ${t.customerPhone}` : ''}</Text>
                        <Text style={s.txnRowDate}>
                          {new Date(t.createdAt).toLocaleString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[s.txnRowAmt, isCredit ? s.txnGreen : s.txnRed]}>
                          {isCredit ? '+' : '−'} PKR {Number(t.amount).toLocaleString()}
                        </Text>
                        {t.commission && t.commission > 0 ? (
                          <Text style={s.txnCommission}>+{Number(t.commission).toLocaleString()} comm.</Text>
                        ) : null}
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </View>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Add Wallet Modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Add Easypaisa Wallet</Text>
            <TouchableOpacity onPress={() => { setShowAdd(false); setAddForm({ accountPhone: '', currentBalance: '' }) }}>
              <Text style={s.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: 20 }}>
            <Text style={s.label}>Account Phone Number *</Text>
            <TextInput style={s.input} keyboardType="phone-pad" autoFocus value={addForm.accountPhone} onChangeText={v => setAddForm(f => ({ ...f, accountPhone: v }))} placeholder="03001234567" />
            <Text style={s.label}>Current Balance (PKR) *</Text>
            <TextInput style={s.input} keyboardType="numeric" value={addForm.currentBalance} onChangeText={v => setAddForm(f => ({ ...f, currentBalance: v }))} placeholder="0" />
            <TouchableOpacity style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={addAccount} disabled={saving}>
              <Text style={s.saveBtnText}>{saving ? 'Adding…' : 'Add Wallet'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Transaction Modal */}
      <Modal visible={!!txnAccount} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>New Transaction</Text>
            <TouchableOpacity onPress={() => setTxnAccount(null)}>
              <Text style={s.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 20 }}>
            {txnAccount && (
              <View style={s.accInfoBox}>
                <Text style={s.accInfoPhone}>{txnAccount.accountPhone}</Text>
                <Text style={s.accInfoBalance}>Balance: PKR {Number(txnAccount.currentBalance).toLocaleString()}</Text>
              </View>
            )}

            {/* Type selector */}
            <Text style={s.label}>Transaction Type *</Text>
            <View style={s.typeGrid}>
              {TXN_TYPES.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    s.typeBtn,
                    txnForm.type === t.id && (t.isCredit ? s.typeBtnGreen : s.typeBtnRed),
                  ]}
                  onPress={() => setTxnForm(f => ({ ...f, type: t.id }))}
                >
                  <Text style={s.typeEmoji}>{t.emoji}</Text>
                  <Text style={[s.typeLabel, txnForm.type === t.id && s.typeLabelActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Amount (PKR) *</Text>
            <TextInput style={s.input} keyboardType="numeric" value={txnForm.amount} onChangeText={v => setTxnForm(f => ({ ...f, amount: v }))} placeholder="0" />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Fee (PKR)</Text>
                <TextInput style={s.input} keyboardType="numeric" value={txnForm.fee} onChangeText={v => setTxnForm(f => ({ ...f, fee: v }))} placeholder="0" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Commission (PKR)</Text>
                <TextInput style={s.input} keyboardType="numeric" value={txnForm.commission} onChangeText={v => setTxnForm(f => ({ ...f, commission: v }))} placeholder="0" />
              </View>
            </View>

            <Text style={s.label}>Customer Phone</Text>
            <TextInput style={s.input} keyboardType="phone-pad" value={txnForm.customerPhone} onChangeText={v => setTxnForm(f => ({ ...f, customerPhone: v }))} placeholder="03001234567 (optional)" />

            <Text style={s.label}>Description</Text>
            <TextInput style={s.input} value={txnForm.description} onChangeText={v => setTxnForm(f => ({ ...f, description: v }))} placeholder="Optional note…" />

            {txnAccount && Number(txnForm.amount) > 0 && (
              <View style={[s.previewBox, isCredit ? s.previewBoxGreen : s.previewBoxRed]}>
                <Text style={s.previewBoxLabel}>Balance after transaction</Text>
                <Text style={[s.previewBoxValue, isCredit ? s.txnGreen : s.txnRed]}>
                  PKR {balanceAfter.toLocaleString()}
                </Text>
              </View>
            )}

            <TouchableOpacity style={[s.saveBtn, { backgroundColor: '#16a34a' }, saving && s.saveBtnDisabled]} onPress={submitTxn} disabled={saving}>
              <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Record Transaction'}</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f0f9ff' },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: STATUS_TOP, paddingBottom: 16, backgroundColor: '#2563eb' },
  backBtn:         { marginRight: 10 },
  backText:        { fontSize: 30, color: '#fff', fontWeight: '300', lineHeight: 34 },
  title:           { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitle:        { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  addBtn:          { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  addBtnText:      { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty:           { textAlign: 'center', color: '#9ca3af', marginTop: 56, fontSize: 14, paddingHorizontal: 32, lineHeight: 22 },
  card:            { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTop:         { flexDirection: 'row', alignItems: 'center', padding: 16 },
  walletIcon:      { width: 56, height: 56, borderRadius: 16, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center' },
  walletEmoji:     { fontSize: 28 },
  accPhone:        { fontSize: 13, color: '#6b7280' },
  accBalance:      { fontSize: 24, fontWeight: '800', color: '#111827', marginTop: 2 },
  actionRow:       { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingBottom: 14 },
  txnBtn:          { flex: 2, backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  txnBtnText:      { color: '#fff', fontWeight: '700', fontSize: 13 },
  historyBtn:      { flex: 1, backgroundColor: '#eff6ff', borderRadius: 12, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: '#dbeafe' },
  historyBtnText:  { color: '#2563eb', fontWeight: '700', fontSize: 12 },
  historyPanel:    { paddingHorizontal: 14, paddingBottom: 10 },
  historyDivider:  { height: 1, backgroundColor: '#eff6ff', marginBottom: 10 },
  historyEmpty:    { textAlign: 'center', color: '#9ca3af', fontSize: 13, paddingVertical: 12 },
  txnRow:          { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  txnDot:          { width: 8, height: 8, borderRadius: 4 },
  txnDotGreen:     { backgroundColor: '#16a34a' },
  txnDotRed:       { backgroundColor: '#dc2626' },
  txnRowLabel:     { fontSize: 12, fontWeight: '600', color: '#374151' },
  txnRowDate:      { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  txnRowAmt:       { fontSize: 13, fontWeight: '700' },
  txnCommission:   { fontSize: 11, color: '#16a34a', marginTop: 1 },
  txnGreen:        { color: '#16a34a' },
  txnRed:          { color: '#dc2626' },
  // Modals
  modal:           { flex: 1, backgroundColor: '#fff' },
  modalHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle:      { fontSize: 18, fontWeight: '800', color: '#111827' },
  closeBtn:        { fontSize: 18, color: '#6b7280', padding: 4 },
  label:           { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  input:           { backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#111827' },
  accInfoBox:      { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#bbf7d0', marginBottom: 4 },
  accInfoPhone:    { fontSize: 13, color: '#374151' },
  accInfoBalance:  { fontSize: 18, fontWeight: '800', color: '#16a34a', marginTop: 4 },
  typeGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  typeBtn:         { flexBasis: '30%', flexGrow: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb' },
  typeBtnGreen:    { backgroundColor: '#dcfce7', borderColor: '#16a34a' },
  typeBtnRed:      { backgroundColor: '#fef2f2', borderColor: '#dc2626' },
  typeEmoji:       { fontSize: 20 },
  typeLabel:       { fontSize: 11, fontWeight: '600', color: '#6b7280', marginTop: 4 },
  typeLabelActive: { color: '#111827' },
  previewBox:      { borderRadius: 12, padding: 14, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewBoxGreen: { backgroundColor: '#f0fdf4' },
  previewBoxRed:   { backgroundColor: '#fef2f2' },
  previewBoxLabel: { fontSize: 13, color: '#374151' },
  previewBoxValue: { fontSize: 16, fontWeight: '800' },
  saveBtn:         { backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 24, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  saveBtnDisabled: { opacity: 0.55 },
  saveBtnText:     { color: '#fff', fontWeight: '700', fontSize: 15 },
})
