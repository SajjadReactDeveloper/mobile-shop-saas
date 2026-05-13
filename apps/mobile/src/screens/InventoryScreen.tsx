import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, RefreshControl, Alert, Image,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { STATUS_TOP } from '../lib/constants'
import { api } from '../lib/api'
import { ListItemsSkeleton } from '../components/Skeleton'
import { BarcodeScannerModal } from '../components/BarcodeScannerModal'

interface Product {
  id: string; name: string; brand?: string; category: string
  sellingPrice: number; buyingPrice: number; stockQty: number
  imeiTracked: boolean; lowStockAlert: number; imageUrl?: string
}

const CAT_COLORS: Record<string, { bg: string; text: string }> = {
  MOBILE:     { bg: '#ccfbf1', text: '#0f766e' },
  ACCESSORY:  { bg: '#f0fdf4', text: '#16a34a' },
  SIM:        { bg: '#ecfeff', text: '#0891b2' },
  CHARGER:    { bg: '#fff7ed', text: '#ea580c' },
  SPARE_PART: { bg: '#fef9c3', text: '#854d0e' },
  OTHER:      { bg: '#f3f4f6', text: '#4b5563' },
}

const CATEGORIES = ['MOBILE', 'ACCESSORY', 'SIM', 'CHARGER', 'SPARE_PART', 'OTHER']

export function InventoryScreen() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showStock, setShowStock] = useState<Product | null>(null)
  const [form, setForm] = useState({ name: '', brand: '', category: 'OTHER', sellingPrice: '', buyingPrice: '', stockQty: '0', imeiTracked: false })
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [stockForm, setStockForm] = useState({ qty: '1', unitPrice: '', supplier: '' })
  const [imeis, setImeis] = useState<string[]>([])
  const [scanningImeiIdx, setScanningImeiIdx] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try { const r = await api.get('/inventory'); setProducts(r.data) }
    catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false) }

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) { Alert.alert('Permission needed', 'Allow access to photos to upload product images.'); return }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 })
    if (result.canceled || !result.assets[0]) return
    const asset = result.assets[0]
    setImageUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', { uri: asset.uri, name: asset.fileName ?? 'photo.jpg', type: asset.mimeType ?? 'image/jpeg' } as unknown as Blob)
      const res = await api.post<{ url: string }>('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setImageUrl(res.data.url)
    } catch {
      Alert.alert('Upload failed', 'Could not upload image. Please try again.')
    } finally {
      setImageUploading(false)
    }
  }

  const addProduct = async () => {
    if (!form.name || !form.sellingPrice || !form.buyingPrice) return Alert.alert('Required', 'Name, buying price, and selling price are required.')
    setSaving(true)
    try {
      await api.post('/inventory', {
        name: form.name, brand: form.brand || undefined, category: form.category,
        buyingPrice: Number(form.buyingPrice), sellingPrice: Number(form.sellingPrice),
        stockQty: Number(form.stockQty), imeiTracked: form.imeiTracked, lowStockAlert: 5,
        imageUrl: imageUrl ?? undefined,
      })
      setShowAdd(false)
      setImageUrl(null)
      setForm({ name: '', brand: '', category: 'OTHER', sellingPrice: '', buyingPrice: '', stockQty: '0', imeiTracked: false })
      await load()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to add product')
    } finally { setSaving(false) }
  }

  const updateStockQty = (v: string) => {
    setStockForm(f => ({ ...f, qty: v }))
    const n = Math.max(1, parseInt(v, 10) || 1)
    setImeis(prev => {
      const next = [...prev]
      while (next.length < n) next.push('')
      return next.slice(0, n)
    })
  }

  const addStock = async () => {
    if (!showStock || !stockForm.qty || !stockForm.unitPrice) return Alert.alert('Required', 'Quantity and unit price are required.')
    const qty = Number(stockForm.qty)
    if (showStock.imeiTracked) {
      const filled = imeis.filter(i => i.trim().length > 0)
      if (filled.length !== qty) {
        return Alert.alert('IMEIs Required', `Please enter all ${qty} IMEI number${qty > 1 ? 's' : ''} before saving.`)
      }
    }
    setSaving(true)
    try {
      await api.post(`/inventory/${showStock.id}/stock`, {
        qty,
        unitPrice: Number(stockForm.unitPrice),
        supplier: stockForm.supplier || undefined,
        ...(showStock.imeiTracked ? { imeis } : {}),
      })
      setShowStock(null)
      setStockForm({ qty: '1', unitPrice: '', supplier: '' })
      setImeis([])
      await load()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed')
    } finally { setSaving(false) }
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <ListItemsSkeleton rows={8} />

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Inventory</Text>
          <Text style={s.headerSub}>{products.length} products</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={s.addBtnText}>+ Add Product</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>ðŸ”</Text>
        <TextInput
          style={s.searchInput} placeholder="Search productsâ€¦" placeholderTextColor="#9ca3af"
          value={search} onChangeText={setSearch}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0d9488" colors={['#0d9488']} />}
      >
        {filtered.length === 0 ? (
          <View style={s.emptyWrap}>
            <Text style={s.emptyEmoji}>ðŸ“¦</Text>
            <Text style={s.emptyText}>{search ? 'No products match your search' : 'No products yet â€” add your first product'}</Text>
          </View>
        ) : (
          filtered.map(p => {
            const isLow = p.stockQty <= p.lowStockAlert
            const catStyle = CAT_COLORS[p.category] ?? CAT_COLORS.OTHER
            return (
              <View key={p.id} style={[s.card, isLow && s.cardLow]}>
                <View style={s.cardTop}>
                  {p.imageUrl ? (
                    <Image source={{ uri: p.imageUrl }} style={s.cardThumb} />
                  ) : (
                    <View style={s.cardThumbPlaceholder}><Text style={{ fontSize: 22 }}>ðŸ“¦</Text></View>
                  )}
                  <View style={s.cardInfo}>
                    <View style={[s.catBadge, { backgroundColor: catStyle.bg }]}>
                      <Text style={[s.catText, { color: catStyle.text }]}>{p.category.replace('_', ' ')}</Text>
                    </View>
                    <Text style={s.productName} numberOfLines={1}>{p.name}</Text>
                    {p.brand ? <Text style={s.productBrand}>{p.brand}</Text> : null}
                  </View>
                  <View style={s.cardPrices}>
                    <Text style={s.sellPrice}>PKR {Number(p.sellingPrice).toLocaleString()}</Text>
                    <Text style={s.buyPrice}>Cost: {Number(p.buyingPrice).toLocaleString()}</Text>
                  </View>
                </View>
                <View style={s.cardBottom}>
                  <View style={[s.stockPill, isLow && s.stockPillLow]}>
                    <Text style={[s.stockText, isLow && s.stockTextLow]}>
                      {isLow ? 'âš ï¸ ' : ''}{p.stockQty} in stock
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={s.stockBtn}
                    onPress={() => {
                      setShowStock(p)
                      setStockForm({ qty: '1', unitPrice: String(p.buyingPrice), supplier: '' })
                      setImeis(p.imeiTracked ? [''] : [])
                    }}
                  >
                    <Text style={s.stockBtnText}>+ Add Stock</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          })
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Add Product Modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHandle} />
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>New Product</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)} style={s.closeBtn}>
              <Text style={s.closeBtnText}>âœ•</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={s.sectionLabel}>PRODUCT DETAILS</Text>
            <Text style={s.label}>Product Name *</Text>
            <TextInput style={s.input} value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Samsung Galaxy A15" placeholderTextColor="#9ca3af" />
            <Text style={s.label}>Brand</Text>
            <TextInput style={s.input} value={form.brand} onChangeText={v => setForm(f => ({ ...f, brand: v }))} placeholder="Samsung" placeholderTextColor="#9ca3af" />

            <Text style={s.sectionLabel}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[s.catPill, form.category === cat && s.catPillActive]}
                    onPress={() => setForm(f => ({ ...f, category: cat }))}
                  >
                    <Text style={[s.catPillText, form.category === cat && s.catPillTextActive]}>
                      {cat.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={s.sectionLabel}>PRICING</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Buying Price *</Text>
                <TextInput style={s.input} keyboardType="numeric" value={form.buyingPrice} onChangeText={v => setForm(f => ({ ...f, buyingPrice: v }))} placeholder="0" placeholderTextColor="#9ca3af" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Selling Price *</Text>
                <TextInput style={s.input} keyboardType="numeric" value={form.sellingPrice} onChangeText={v => setForm(f => ({ ...f, sellingPrice: v }))} placeholder="0" placeholderTextColor="#9ca3af" />
              </View>
            </View>

            <Text style={s.label}>Opening Stock</Text>
            <TextInput style={s.input} keyboardType="numeric" value={form.stockQty} onChangeText={v => setForm(f => ({ ...f, stockQty: v }))} placeholderTextColor="#9ca3af" />

            <TouchableOpacity style={s.checkRow} onPress={() => setForm(f => ({ ...f, imeiTracked: !f.imeiTracked }))}>
              <View style={[s.checkbox, form.imeiTracked && s.checkboxOn]}>
                {form.imeiTracked && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>âœ“</Text>}
              </View>
              <View>
                <Text style={s.checkLabel}>IMEI Tracking</Text>
                <Text style={s.checkSub}>Enable for phones & tablets</Text>
              </View>
            </TouchableOpacity>

            <Text style={s.sectionLabel}>PRODUCT IMAGE</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={s.imagePreview} />
              ) : null}
              <TouchableOpacity
                style={[s.imagePickerBtn, imageUploading && s.saveBtnDisabled]}
                onPress={pickImage}
                disabled={imageUploading}
              >
                <Text style={s.imagePickerText}>{imageUploading ? 'â³ Uploadingâ€¦' : imageUrl ? 'ðŸ”„ Change Photo' : 'ðŸ“· Add Photo'}</Text>
              </TouchableOpacity>
              {imageUrl && (
                <TouchableOpacity onPress={() => setImageUrl(null)} style={s.removeImageBtn}>
                  <Text style={s.removeImageText}>âœ•</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={addProduct} disabled={saving}>
              <Text style={s.saveBtnText}>{saving ? 'Addingâ€¦' : 'Add Product'}</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* Add Stock Modal */}
      <Modal visible={!!showStock} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHandle} />
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Add Stock</Text>
            <TouchableOpacity onPress={() => setShowStock(null)} style={s.closeBtn}>
              <Text style={s.closeBtnText}>âœ•</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {showStock && (
              <View style={s.infoBanner}>
                <Text style={s.infoBannerText}>ðŸ“¦ {showStock.name}</Text>
                <Text style={s.infoBannerSub}>
                  {showStock.stockQty} currently in stock
                  {showStock.imeiTracked ? '  Â·  ðŸ“± IMEI tracked' : ''}
                </Text>
              </View>
            )}
            <Text style={s.label}>Quantity *</Text>
            <TextInput
              style={s.input} keyboardType="numeric"
              value={stockForm.qty} onChangeText={updateStockQty}
              placeholderTextColor="#9ca3af"
            />
            <Text style={s.label}>Unit Price (PKR) *</Text>
            <TextInput style={s.input} keyboardType="numeric" value={stockForm.unitPrice} onChangeText={v => setStockForm(f => ({ ...f, unitPrice: v }))} placeholder="0" placeholderTextColor="#9ca3af" />
            <Text style={s.label}>Supplier (optional)</Text>
            <TextInput style={s.input} value={stockForm.supplier} onChangeText={v => setStockForm(f => ({ ...f, supplier: v }))} placeholder="Supplier name" placeholderTextColor="#9ca3af" />

            {/* IMEI entry section â€” only for IMEI-tracked products */}
            {showStock?.imeiTracked && imeis.length > 0 && (
              <>
                <View style={s.imeiHeader}>
                  <Text style={s.sectionLabel}>IMEI NUMBERS</Text>
                  <Text style={s.imeiSubLabel}>{imeis.filter(i => i.length > 0).length}/{imeis.length} entered</Text>
                </View>
                {imeis.map((imei, idx) => (
                  <View key={idx} style={s.imeiRow}>
                    <View style={s.imeiNumBadge}>
                      <Text style={s.imeiNum}>{idx + 1}</Text>
                    </View>
                    <TextInput
                      style={[s.input, s.imeiInput, imei.length > 0 && s.imeiInputFilled]}
                      value={imei}
                      onChangeText={v => setImeis(prev => prev.map((x, i) => i === idx ? v : x))}
                      placeholder="Type or scan IMEIâ€¦"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                      maxLength={15}
                    />
                    <TouchableOpacity
                      style={s.imeiScanBtn}
                      onPress={() => setScanningImeiIdx(idx)}
                    >
                      <Text style={s.imeiScanBtnText}>ðŸ“·</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}

            <TouchableOpacity style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={addStock} disabled={saving}>
              <Text style={s.saveBtnText}>{saving ? 'Savingâ€¦' : 'Confirm Stock Entry'}</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* IMEI barcode scanner */}
      <BarcodeScannerModal
        visible={scanningImeiIdx !== null}
        onScan={value => {
          if (scanningImeiIdx !== null) {
            setImeis(prev => prev.map((x, i) => i === scanningImeiIdx ? value : x))
          }
          setScanningImeiIdx(null)
        }}
        onClose={() => setScanningImeiIdx(null)}
        hint="Scan the IMEI barcode on the phone box"
      />
    </View>
  )
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f0fdfa' },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: STATUS_TOP, paddingBottom: 16, backgroundColor: '#0d9488' },
  headerTitle:    { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub:      { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  addBtn:         { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  addBtnText:     { color: '#fff', fontWeight: '700', fontSize: 13 },

  searchWrap:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ccfbf1' },
  searchIcon:     { fontSize: 16 },
  searchInput:    { flex: 1, fontSize: 14, color: '#111827', paddingVertical: 4 },

  emptyWrap:      { alignItems: 'center', paddingTop: 64, paddingHorizontal: 32 },
  emptyEmoji:     { fontSize: 48, marginBottom: 12 },
  emptyText:      { textAlign: 'center', color: '#6b7280', fontSize: 14, lineHeight: 20 },

  card:           { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardLow:        { borderWidth: 1.5, borderColor: '#fca5a5' },
  cardTop:        { flexDirection: 'row', gap: 8, marginBottom: 10 },
  cardInfo:       { flex: 1 },
  catBadge:       { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginBottom: 6 },
  catText:        { fontSize: 10, fontWeight: '700' },
  productName:    { fontSize: 15, fontWeight: '700', color: '#111827' },
  productBrand:   { fontSize: 12, color: '#6b7280', marginTop: 2 },
  cardPrices:     { alignItems: 'flex-end' },
  sellPrice:      { fontSize: 15, fontWeight: '800', color: '#111827' },
  buyPrice:       { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  cardBottom:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
  stockPill:      { backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  stockPillLow:   { backgroundColor: '#fef2f2' },
  stockText:      { fontSize: 12, fontWeight: '600', color: '#16a34a' },
  stockTextLow:   { color: '#dc2626' },
  stockBtn:       { backgroundColor: '#f0fdfa', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  stockBtnText:   { color: '#0d9488', fontWeight: '700', fontSize: 12 },

  // Modal
  modal:          { flex: 1, backgroundColor: '#fff' },
  modalHandle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginTop: 12 },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle:     { fontSize: 18, fontWeight: '800', color: '#111827' },
  closeBtn:       { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  closeBtnText:   { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  modalBody:      { padding: 20 },
  sectionLabel:   { fontSize: 11, fontWeight: '700', color: '#0d9488', letterSpacing: 1, marginTop: 16, marginBottom: 4 },
  label:          { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input:          { backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#111827' },
  catPill:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f3f4f6', borderWidth: 1.5, borderColor: '#e5e7eb' },
  catPillActive:  { backgroundColor: '#0d9488', borderColor: '#0d9488' },
  catPillText:    { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  catPillTextActive: { color: '#fff' },
  checkRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, backgroundColor: '#f9fafb', padding: 14, borderRadius: 12 },
  checkbox:       { width: 22, height: 22, borderWidth: 2, borderColor: '#d1d5db', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  checkboxOn:     { backgroundColor: '#0d9488', borderColor: '#0d9488' },
  checkLabel:     { fontSize: 14, fontWeight: '600', color: '#111827' },
  checkSub:       { fontSize: 11, color: '#6b7280', marginTop: 1 },
  infoBanner:     { backgroundColor: '#f0fdfa', borderRadius: 12, padding: 14, marginBottom: 4 },
  infoBannerText: { fontSize: 14, fontWeight: '700', color: '#5b21b6' },
  infoBannerSub:  { fontSize: 12, color: '#0d9488', marginTop: 2 },
  saveBtn:           { backgroundColor: '#0d9488', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 24, shadowColor: '#0d9488', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  saveBtnDisabled:   { opacity: 0.55 },
  saveBtnText:       { color: '#fff', fontWeight: '700', fontSize: 15 },
  cardThumb:         { width: 48, height: 48, borderRadius: 10, marginRight: 4 },
  cardThumbPlaceholder: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  imagePreview:      { width: 72, height: 72, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  imagePickerBtn:    { flex: 1, backgroundColor: '#f0fdfa', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#ccfbf1', borderStyle: 'dashed' },
  imagePickerText:   { color: '#0d9488', fontWeight: '600', fontSize: 13 },
  removeImageBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  removeImageText:   { color: '#dc2626', fontWeight: '700', fontSize: 13 },

  // IMEI entry
  imeiHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 4 },
  imeiSubLabel:   { fontSize: 12, color: '#0d9488', fontWeight: '600' },
  imeiRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  imeiNumBadge:   { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ccfbf1', alignItems: 'center', justifyContent: 'center' },
  imeiNum:        { fontSize: 12, fontWeight: '700', color: '#0d9488' },
  imeiInput:      { flex: 1, marginTop: 0 },
  imeiInputFilled:{ borderColor: '#0d9488', backgroundColor: '#f0fdfa' },
  imeiScanBtn:    { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f0fdfa', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#ccfbf1' },
  imeiScanBtnText:{ fontSize: 20 },
})
