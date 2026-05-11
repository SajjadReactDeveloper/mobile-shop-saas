import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, RefreshControl, ActivityIndicator, Alert,
} from 'react-native'
import { api } from '../lib/api'

interface Product {
  id: string
  name: string
  brand?: string
  category: string
  sellingPrice: number
  buyingPrice: number
  stockQty: number
  imeiTracked: boolean
  lowStockAlert: number
}

const CATEGORY_COLORS: Record<string, string> = {
  MOBILE: '#dbeafe', ACCESSORY: '#ede9fe', SIM: '#dcfce7',
  CHARGER: '#ffedd5', SPARE_PART: '#fef9c3', OTHER: '#f3f4f6',
}

export function InventoryScreen() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showStock, setShowStock] = useState<Product | null>(null)

  // Add product form
  const [form, setForm] = useState({ name: '', brand: '', sellingPrice: '', buyingPrice: '', stockQty: '0', imeiTracked: false })
  // Add stock form
  const [stockForm, setStockForm] = useState({ qty: '1', unitPrice: '', supplier: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await api.get('/inventory')
      setProducts(r.data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const addProduct = async () => {
    if (!form.name || !form.sellingPrice || !form.buyingPrice) return Alert.alert('Fill required fields')
    setSaving(true)
    try {
      await api.post('/inventory', {
        name: form.name, brand: form.brand || undefined,
        category: 'OTHER', buyingPrice: Number(form.buyingPrice),
        sellingPrice: Number(form.sellingPrice), stockQty: Number(form.stockQty),
        imeiTracked: form.imeiTracked, lowStockAlert: 5,
      })
      setShowAdd(false)
      setForm({ name: '', brand: '', sellingPrice: '', buyingPrice: '', stockQty: '0', imeiTracked: false })
      await load()
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to add product')
    } finally { setSaving(false) }
  }

  const addStock = async () => {
    if (!showStock || !stockForm.qty || !stockForm.unitPrice) return Alert.alert('Fill required fields')
    setSaving(true)
    try {
      await api.post(`/inventory/${showStock.id}/stock`, {
        qty: Number(stockForm.qty), unitPrice: Number(stockForm.unitPrice),
        supplier: stockForm.supplier || undefined,
      })
      setShowStock(null)
      setStockForm({ qty: '1', unitPrice: '', supplier: '' })
      await load()
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed')
    } finally { setSaving(false) }
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#2563eb" /></View>

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Inventory</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <TextInput style={s.searchInput} placeholder="Search products…" value={search} onChangeText={setSearch} />
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filtered.length === 0
          ? <Text style={s.empty}>No products found</Text>
          : filtered.map(p => {
              const isLow = p.stockQty <= p.lowStockAlert
              return (
                <View key={p.id} style={s.card}>
                  <View style={s.cardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.productName}>{p.name}</Text>
                      {p.brand ? <Text style={s.productSub}>{p.brand}</Text> : null}
                      <View style={[s.catBadge, { backgroundColor: CATEGORY_COLORS[p.category] ?? '#f3f4f6' }]}>
                        <Text style={s.catText}>{p.category.replace('_', ' ')}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={s.price}>PKR {Number(p.sellingPrice).toLocaleString()}</Text>
                      <Text style={[s.stock, isLow && s.stockLow]}>{p.stockQty} in stock{isLow ? ' ⚠️' : ''}</Text>
                      <TouchableOpacity style={s.stockBtn} onPress={() => { setShowStock(p); setStockForm({ qty: '1', unitPrice: String(p.buyingPrice), supplier: '' }) }}>
                        <Text style={s.stockBtnText}>+ Stock</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )
            })
        }
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Add Product Modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Add Product</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}><Text style={s.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={s.modalBody}>
            <Text style={s.label}>Product Name *</Text>
            <TextInput style={s.input} value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="Samsung Galaxy A15" />
            <Text style={s.label}>Brand</Text>
            <TextInput style={s.input} value={form.brand} onChangeText={v => setForm(f => ({ ...f, brand: v }))} placeholder="Samsung" />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Buying Price *</Text>
                <TextInput style={s.input} keyboardType="numeric" value={form.buyingPrice} onChangeText={v => setForm(f => ({ ...f, buyingPrice: v }))} placeholder="0" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Selling Price *</Text>
                <TextInput style={s.input} keyboardType="numeric" value={form.sellingPrice} onChangeText={v => setForm(f => ({ ...f, sellingPrice: v }))} placeholder="0" />
              </View>
            </View>
            <Text style={s.label}>Opening Stock</Text>
            <TextInput style={s.input} keyboardType="numeric" value={form.stockQty} onChangeText={v => setForm(f => ({ ...f, stockQty: v }))} />
            <TouchableOpacity style={[s.checkRow]} onPress={() => setForm(f => ({ ...f, imeiTracked: !f.imeiTracked }))}>
              <View style={[s.checkbox, form.imeiTracked && s.checkboxOn]} />
              <Text style={s.label}>IMEI Tracking (for phones)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={addProduct} disabled={saving}>
              <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Add Product'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Add Stock Modal */}
      <Modal visible={!!showStock} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Add Stock</Text>
            <TouchableOpacity onPress={() => setShowStock(null)}><Text style={s.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          <View style={s.modalBody}>
            {showStock && <Text style={s.productInfoBanner}>{showStock.name} · {showStock.stockQty} in stock</Text>}
            <Text style={s.label}>Quantity *</Text>
            <TextInput style={s.input} keyboardType="numeric" value={stockForm.qty} onChangeText={v => setStockForm(f => ({ ...f, qty: v }))} />
            <Text style={s.label}>Unit Price (PKR) *</Text>
            <TextInput style={s.input} keyboardType="numeric" value={stockForm.unitPrice} onChangeText={v => setStockForm(f => ({ ...f, unitPrice: v }))} />
            <Text style={s.label}>Supplier</Text>
            <TextInput style={s.input} value={stockForm.supplier} onChangeText={v => setStockForm(f => ({ ...f, supplier: v }))} placeholder="Optional" />
            <TouchableOpacity style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={addStock} disabled={saving}>
              <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Add Stock'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f3f4f6' },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 52, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title:            { fontSize: 20, fontWeight: '700', color: '#111827' },
  addBtn:           { backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  addBtnText:       { color: '#fff', fontWeight: '700', fontSize: 14 },
  searchWrap:       { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  searchInput:      { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, fontSize: 14 },
  empty:            { textAlign: 'center', color: '#9ca3af', marginTop: 48, fontSize: 14 },
  card:             { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  cardRow:          { flexDirection: 'row', gap: 8 },
  productName:      { fontSize: 14, fontWeight: '600', color: '#111827' },
  productSub:       { fontSize: 12, color: '#6b7280', marginTop: 2 },
  catBadge:         { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, marginTop: 6 },
  catText:          { fontSize: 10, fontWeight: '600', color: '#374151' },
  price:            { fontSize: 14, fontWeight: '700', color: '#111827' },
  stock:            { fontSize: 12, color: '#6b7280' },
  stockLow:         { color: '#dc2626', fontWeight: '600' },
  stockBtn:         { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  stockBtnText:     { color: '#2563eb', fontWeight: '700', fontSize: 12 },
  modal:            { flex: 1, backgroundColor: '#fff' },
  modalHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 52, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle:       { fontSize: 18, fontWeight: '700', color: '#111827' },
  closeBtn:         { fontSize: 20, color: '#6b7280', padding: 4 },
  modalBody:        { padding: 20 },
  label:            { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 4, marginTop: 12 },
  input:            { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827', backgroundColor: '#f9fafb' },
  checkRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  checkbox:         { width: 20, height: 20, borderWidth: 2, borderColor: '#d1d5db', borderRadius: 4 },
  checkboxOn:       { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  saveBtn:          { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  saveBtnDisabled:  { opacity: 0.5 },
  saveBtnText:      { color: '#fff', fontWeight: '700', fontSize: 15 },
  productInfoBanner:{ backgroundColor: '#f3f4f6', borderRadius: 10, padding: 12, fontSize: 13, color: '#374151', marginBottom: 4 },
})
