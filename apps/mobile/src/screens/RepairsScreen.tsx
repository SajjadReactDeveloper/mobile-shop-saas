import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, Modal, TextInput,
} from 'react-native'
import { api } from '../lib/api'
import { ListItemsSkeleton } from '../components/Skeleton'

type RepairStatus = 'RECEIVED' | 'DIAGNOSING' | 'AWAITING_PARTS' | 'IN_REPAIR' | 'READY' | 'DELIVERED' | 'CANCELLED'

interface RepairJob {
  id: string
  jobNumber: string
  deviceBrand: string
  deviceModel: string
  faultDesc: string
  status: RepairStatus
  totalQuote?: number
  advancePaid: number
  createdAt: string
  customer: { name: string; phone?: string }
}

interface Customer { id: string; name: string; phone?: string }

const STATUS_COLOR: Record<RepairStatus, string> = {
  RECEIVED: '#e5e7eb', DIAGNOSING: '#bfdbfe', AWAITING_PARTS: '#fef9c3',
  IN_REPAIR: '#ffedd5', READY: '#bbf7d0', DELIVERED: '#ede9fe', CANCELLED: '#fee2e2',
}
const STATUS_TEXT: Record<RepairStatus, string> = {
  RECEIVED: '#374151', DIAGNOSING: '#1d4ed8', AWAITING_PARTS: '#92400e',
  IN_REPAIR: '#c2410c', READY: '#15803d', DELIVERED: '#6d28d9', CANCELLED: '#dc2626',
}
const STATUS_LABEL: Record<RepairStatus, string> = {
  RECEIVED: 'Received', DIAGNOSING: 'Diagnosing', AWAITING_PARTS: 'Awaiting Parts',
  IN_REPAIR: 'In Repair', READY: '✅ Ready', DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
}
const NEXT: Partial<Record<RepairStatus, RepairStatus>> = {
  RECEIVED: 'DIAGNOSING', DIAGNOSING: 'AWAITING_PARTS', AWAITING_PARTS: 'IN_REPAIR',
  IN_REPAIR: 'READY', READY: 'DELIVERED',
}

export function RepairsScreen() {
  const [jobs, setJobs] = useState<RepairJob[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)

  const [form, setForm] = useState({
    customerId: '', customerSearch: '', deviceBrand: '', deviceModel: '',
    faultDesc: '', advancePaid: '0', totalQuote: '',
  })
  const [saving, setSaving] = useState(false)
  const [showCustPicker, setShowCustPicker] = useState(false)

  const load = useCallback(async () => {
    try {
      const [j, c] = await Promise.all([
        api.get('/repairs').then(r => r.data),
        api.get('/customers').then(r => r.data),
      ])
      setJobs(j)
      setCustomers(c)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false) }

  const advanceStatus = async (job: RepairJob) => {
    const next = NEXT[job.status]
    if (!next) return
    setUpdating(job.id)
    try {
      await api.patch(`/repairs/${job.id}/status`, { status: next })
      await load()
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed')
    } finally { setUpdating(null) }
  }

  const createJob = async () => {
    if (!form.customerId || !form.deviceBrand || !form.deviceModel || !form.faultDesc) {
      return Alert.alert('Fill all required fields')
    }
    setSaving(true)
    try {
      await api.post('/repairs', {
        customerId: form.customerId,
        deviceBrand: form.deviceBrand,
        deviceModel: form.deviceModel,
        faultDesc: form.faultDesc,
        advancePaid: Number(form.advancePaid) || undefined,
        totalQuote: form.totalQuote ? Number(form.totalQuote) : undefined,
      })
      setShowNew(false)
      setForm({ customerId: '', customerSearch: '', deviceBrand: '', deviceModel: '', faultDesc: '', advancePaid: '0', totalQuote: '' })
      await load()
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed')
    } finally { setSaving(false) }
  }

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(form.customerSearch.toLowerCase()) ||
    (c.phone ?? '').includes(form.customerSearch)
  )

  if (loading) return <ListItemsSkeleton rows={6} />

  const active = jobs.filter(j => j.status !== 'DELIVERED' && j.status !== 'CANCELLED')
  const done = jobs.filter(j => j.status === 'DELIVERED' || j.status === 'CANCELLED')

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Repairs</Text>
          <Text style={s.subtitle}>{active.length} active jobs</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowNew(true)}>
          <Text style={s.addBtnText}>+ New Job</Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {jobs.length === 0
          ? <Text style={s.empty}>No repair jobs yet</Text>
          : [...active, ...done].map(job => {
            const next = NEXT[job.status]
            const isUpdating = updating === job.id
            return (
              <View key={job.id} style={s.card}>
                <View style={s.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.jobNum}>{job.jobNumber}</Text>
                    <Text style={s.device}>{job.deviceBrand} {job.deviceModel}</Text>
                    <Text style={s.customer}>{job.customer.name}</Text>
                    <Text style={s.fault} numberOfLines={2}>{job.faultDesc}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <View style={[s.statusBadge, { backgroundColor: STATUS_COLOR[job.status] }]}>
                      <Text style={[s.statusText, { color: STATUS_TEXT[job.status] }]}>{STATUS_LABEL[job.status]}</Text>
                    </View>
                    {job.totalQuote ? <Text style={s.quote}>PKR {Number(job.totalQuote).toLocaleString()}</Text> : null}
                  </View>
                </View>
                {next && (
                  <TouchableOpacity style={[s.advBtn, isUpdating && s.advBtnDisabled]} onPress={() => advanceStatus(job)} disabled={isUpdating}>
                    <Text style={s.advBtnText}>{isUpdating ? 'Updating…' : `→ Move to ${STATUS_LABEL[next]}`}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          })
        }
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* New Job Modal */}
      <Modal visible={showNew} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>New Repair Job</Text>
            <TouchableOpacity onPress={() => setShowNew(false)}><Text style={s.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 20 }}>
            <Text style={s.label}>Customer *</Text>
            {form.customerId
              ? (
                <View style={s.selectedCustomer}>
                  <Text style={{ flex: 1, fontWeight: '600', color: '#1d4ed8' }}>{form.customerSearch}</Text>
                  <TouchableOpacity onPress={() => setForm(f => ({ ...f, customerId: '', customerSearch: '' }))}><Text style={{ color: '#6b7280' }}>Clear</Text></TouchableOpacity>
                </View>
              )
              : <TouchableOpacity style={s.input} onPress={() => setShowCustPicker(true)}>
                  <Text style={{ color: '#9ca3af', fontSize: 14 }}>Select customer…</Text>
                </TouchableOpacity>
            }
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Brand *</Text>
                <TextInput style={s.input} value={form.deviceBrand} onChangeText={v => setForm(f => ({ ...f, deviceBrand: v }))} placeholder="Samsung" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Model *</Text>
                <TextInput style={s.input} value={form.deviceModel} onChangeText={v => setForm(f => ({ ...f, deviceModel: v }))} placeholder="A15" />
              </View>
            </View>
            <Text style={s.label}>Fault Description *</Text>
            <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} multiline value={form.faultDesc} onChangeText={v => setForm(f => ({ ...f, faultDesc: v }))} placeholder="Describe the issue…" />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Advance (PKR)</Text>
                <TextInput style={s.input} keyboardType="numeric" value={form.advancePaid} onChangeText={v => setForm(f => ({ ...f, advancePaid: v }))} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Quote (PKR)</Text>
                <TextInput style={s.input} keyboardType="numeric" value={form.totalQuote} onChangeText={v => setForm(f => ({ ...f, totalQuote: v }))} placeholder="Optional" />
              </View>
            </View>
            <TouchableOpacity style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={createJob} disabled={saving}>
              <Text style={s.saveBtnText}>{saving ? 'Creating…' : 'Create Job'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Customer picker */}
      <Modal visible={showCustPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Select Customer</Text>
            <TouchableOpacity onPress={() => setShowCustPicker(false)}><Text style={s.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          <View style={{ padding: 16 }}>
            <TextInput style={s.searchInput} placeholder="Search…" value={form.customerSearch} onChangeText={v => setForm(f => ({ ...f, customerSearch: v }))} autoFocus />
          </View>
          <ScrollView>
            {filteredCustomers.map(c => (
              <TouchableOpacity key={c.id} style={s.custItem} onPress={() => { setForm(f => ({ ...f, customerId: c.id, customerSearch: c.name })); setShowCustPicker(false) }}>
                <Text style={s.custName}>{c.name}</Text>
                {c.phone ? <Text style={s.custPhone}>{c.phone}</Text> : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
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
  subtitle:       { fontSize: 12, color: '#6b7280', marginTop: 2 },
  addBtn:         { backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  addBtnText:     { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty:          { textAlign: 'center', color: '#9ca3af', marginTop: 48, fontSize: 14 },
  card:           { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  cardTop:        { flexDirection: 'row', gap: 8 },
  jobNum:         { fontSize: 13, fontWeight: '700', color: '#111827' },
  device:         { fontSize: 14, fontWeight: '600', color: '#111827', marginTop: 2 },
  customer:       { fontSize: 12, color: '#6b7280', marginTop: 2 },
  fault:          { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  statusBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText:     { fontSize: 11, fontWeight: '700' },
  quote:          { fontSize: 13, fontWeight: '700', color: '#111827' },
  advBtn:         { marginTop: 10, backgroundColor: '#eff6ff', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  advBtnDisabled: { opacity: 0.5 },
  advBtnText:     { color: '#2563eb', fontWeight: '700', fontSize: 13 },
  modal:          { flex: 1, backgroundColor: '#fff' },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 52, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle:     { fontSize: 18, fontWeight: '700', color: '#111827' },
  closeBtn:       { fontSize: 20, color: '#6b7280', padding: 4 },
  label:          { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 4, marginTop: 14 },
  input:          { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827', backgroundColor: '#f9fafb', justifyContent: 'center' },
  selectedCustomer: { backgroundColor: '#eff6ff', borderRadius: 8, padding: 10, flexDirection: 'row', alignItems: 'center' },
  searchInput:    { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, fontSize: 14 },
  custItem:       { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  custName:       { fontSize: 14, fontWeight: '600', color: '#111827' },
  custPhone:      { fontSize: 12, color: '#6b7280', marginTop: 2 },
  saveBtn:        { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  saveBtnDisabled:{ opacity: 0.5 },
  saveBtnText:    { color: '#fff', fontWeight: '700', fontSize: 15 },
})
