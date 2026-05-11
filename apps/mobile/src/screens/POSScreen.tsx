import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, FlatList,
} from 'react-native'
import { api } from '../lib/api'
import { POSScreenSkeleton } from '../components/Skeleton'

type PaymentMethod = 'CASH' | 'EASYPAISA' | 'JAZZCASH' | 'BANK_TRANSFER' | 'CREDIT'

interface Product { id: string; name: string; brand?: string; sellingPrice: number; stockQty: number; imeiTracked: boolean }
interface Customer { id: string; name: string; phone?: string; balanceOwed: number }
interface CartItem { product: Product; qty: number; unitPrice: number }

const PAY_METHODS: PaymentMethod[] = ['CASH', 'EASYPAISA', 'JAZZCASH', 'BANK_TRANSFER', 'CREDIT']

export function POSScreen() {
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [discount, setDiscount] = useState('')
  const [payMethod, setPayMethod] = useState<PaymentMethod>('CASH')
  const [amountPaid, setAmountPaid] = useState('')
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [showSuccess, setShowSuccess] = useState<string | null>(null)
  const [showCustomers, setShowCustomers] = useState(false)

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([
        api.get('/inventory').then(r => r.data),
        api.get('/customers').then(r => r.data),
      ])
      setProducts(p)
      setCustomers(c)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const filteredProducts = search.length > 1
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.brand ?? '').toLowerCase().includes(search.toLowerCase()))
    : []

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone ?? '').includes(customerSearch)
  )

  const addToCart = (product: Product) => {
    if (product.stockQty === 0) return
    setCart(prev => {
      const ex = prev.find(i => i.product.id === product.id)
      if (ex && !product.imeiTracked) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { product, qty: 1, unitPrice: product.sellingPrice }]
    })
    setSearch('')
  }

  const updateQty = (id: string, d: number) => setCart(prev =>
    prev.flatMap(i => {
      if (i.product.id !== id) return [i]
      const q = i.qty + d
      return q <= 0 ? [] : [{ ...i, qty: q }]
    })
  )

  const subtotal = cart.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const total = subtotal - (Number(discount) || 0)
  const change = (Number(amountPaid) || 0) - total
  const selectedCustomer = customers.find(c => c.id === customerId)

  const checkout = async () => {
    if (cart.length === 0) return Alert.alert('Cart is empty')
    if (payMethod === 'CREDIT' && !customerId) return Alert.alert('Select a customer for credit sales')
    setPlacing(true)
    try {
      const r = await api.post('/sales', {
        items: cart.map(i => ({ productId: i.product.id, qty: i.qty, unitPrice: i.unitPrice })),
        discount: Number(discount) || undefined,
        paymentMethod: payMethod,
        amountPaid: payMethod === 'CASH' && amountPaid ? Number(amountPaid) : total,
        customerId: customerId || undefined,
      })
      setShowSuccess(r.data.invoiceNumber)
      setCart([])
      setDiscount('')
      setAmountPaid('')
      setCustomerId('')
      setCustomerSearch('')
      setPayMethod('CASH')
      await load()
    } catch (e: any) {
      Alert.alert('Sale Failed', e?.response?.data?.message ?? 'Something went wrong')
    } finally { setPlacing(false) }
  }

  if (loading) return <POSScreenSkeleton />

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>POS / Sale</Text></View>

      {/* Product search */}
      <View style={s.searchWrap}>
        <TextInput style={s.searchInput} placeholder="Search product to add…" value={search} onChangeText={setSearch} />
      </View>

      {/* Dropdown results */}
      {filteredProducts.length > 0 && (
        <View style={s.dropdown}>
          {filteredProducts.slice(0, 5).map(p => (
            <TouchableOpacity key={p.id} style={s.dropItem} onPress={() => addToCart(p)} disabled={p.stockQty === 0}>
              <Text style={[s.dropName, p.stockQty === 0 && s.dimmed]}>{p.name}</Text>
              <Text style={s.dropPrice}>PKR {Number(p.sellingPrice).toLocaleString()} · {p.stockQty} left</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView style={s.scroll}>
        {/* Cart */}
        {cart.length === 0
          ? <Text style={s.empty}>Search for a product to start</Text>
          : cart.map(item => (
            <View key={item.product.id} style={s.cartItem}>
              <Text style={s.cartName} numberOfLines={1}>{item.product.name}</Text>
              <View style={s.cartRow}>
                <View style={s.qtyRow}>
                  <TouchableOpacity style={s.qtyBtn} onPress={() => updateQty(item.product.id, -1)}><Text style={s.qtyBtnText}>−</Text></TouchableOpacity>
                  <Text style={s.qtyNum}>{item.qty}</Text>
                  <TouchableOpacity style={s.qtyBtn} onPress={() => updateQty(item.product.id, 1)}><Text style={s.qtyBtnText}>+</Text></TouchableOpacity>
                </View>
                <Text style={s.cartPrice}>PKR {(item.qty * item.unitPrice).toLocaleString()}</Text>
                <TouchableOpacity onPress={() => setCart(c => c.filter(i => i.product.id !== item.product.id))}>
                  <Text style={s.removeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        }

        {/* Customer */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Customer (optional)</Text>
          {selectedCustomer ? (
            <View style={s.selectedCustomer}>
              <Text style={s.selectedCustomerName}>{selectedCustomer.name}</Text>
              {Number(selectedCustomer.balanceOwed) > 0 && <Text style={s.owes}>Owes PKR {Number(selectedCustomer.balanceOwed).toLocaleString()}</Text>}
              <TouchableOpacity onPress={() => { setCustomerId(''); setCustomerSearch('') }}>
                <Text style={s.clearCustomer}>Clear</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={s.customerPickBtn} onPress={() => setShowCustomers(true)}>
              <Text style={s.customerPickText}>{customerSearch || 'Select customer…'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Totals */}
        {cart.length > 0 && (
          <View style={s.section}>
            <View style={s.totalRow}><Text style={s.totalLabel}>Subtotal</Text><Text>PKR {subtotal.toLocaleString()}</Text></View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Discount</Text>
              <TextInput style={s.discountInput} keyboardType="numeric" value={discount} onChangeText={setDiscount} placeholder="0" />
            </View>
            <View style={s.totalRow}><Text style={[s.totalLabel, { fontWeight: '700', fontSize: 16 }]}>Total</Text><Text style={{ fontWeight: '700', fontSize: 16 }}>PKR {total.toLocaleString()}</Text></View>

            {/* Payment method */}
            <Text style={[s.sectionTitle, { marginTop: 12 }]}>Payment</Text>
            <View style={s.payGrid}>
              {PAY_METHODS.map(m => (
                <TouchableOpacity key={m} style={[s.payBtn, payMethod === m && s.payBtnActive]} onPress={() => setPayMethod(m)}>
                  <Text style={[s.payBtnText, payMethod === m && s.payBtnTextActive]}>{m.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {payMethod === 'CASH' && (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Cash Received</Text>
                <TextInput style={s.discountInput} keyboardType="numeric" value={amountPaid} onChangeText={setAmountPaid} placeholder={String(total)} />
              </View>
            )}
            {payMethod === 'CASH' && change >= 0 && Number(amountPaid) > 0 && (
              <View style={s.totalRow}><Text style={s.changeLabel}>Change</Text><Text style={s.changeVal}>PKR {change.toLocaleString()}</Text></View>
            )}

            <TouchableOpacity style={[s.checkoutBtn, placing && s.checkoutBtnDisabled]} onPress={checkout} disabled={placing}>
              <Text style={s.checkoutText}>{placing ? 'Processing…' : 'Complete Sale'}</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Customer picker modal */}
      <Modal visible={showCustomers} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Select Customer</Text>
            <TouchableOpacity onPress={() => setShowCustomers(false)}><Text style={s.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          <View style={{ padding: 16 }}>
            <TextInput style={s.searchInput} placeholder="Search name or phone…" value={customerSearch} onChangeText={setCustomerSearch} autoFocus />
          </View>
          <FlatList
            data={filteredCustomers}
            keyExtractor={c => c.id}
            renderItem={({ item: c }) => (
              <TouchableOpacity style={s.custItem} onPress={() => { setCustomerId(c.id); setCustomerSearch(c.name); setShowCustomers(false) }}>
                <Text style={s.custName}>{c.name}</Text>
                <Text style={s.custPhone}>{c.phone ?? ''}</Text>
                {Number(c.balanceOwed) > 0 && <Text style={s.custOwes}>Owes PKR {Number(c.balanceOwed).toLocaleString()}</Text>}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Success modal */}
      <Modal visible={!!showSuccess} animationType="fade" transparent>
        <View style={s.overlay}>
          <View style={s.successCard}>
            <Text style={s.successEmoji}>✅</Text>
            <Text style={s.successTitle}>Sale Complete!</Text>
            <Text style={s.successInv}>{showSuccess}</Text>
            <TouchableOpacity style={s.successBtn} onPress={() => setShowSuccess(null)}>
              <Text style={s.successBtnText}>New Sale</Text>
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
  header:         { padding: 20, paddingTop: 52, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title:          { fontSize: 20, fontWeight: '700', color: '#111827' },
  searchWrap:     { padding: 12, backgroundColor: '#fff' },
  searchInput:    { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, fontSize: 14 },
  dropdown:       { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', zIndex: 10 },
  dropItem:       { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  dropName:       { fontSize: 14, fontWeight: '600', color: '#111827' },
  dropPrice:      { fontSize: 12, color: '#6b7280', marginTop: 2 },
  dimmed:         { opacity: 0.4 },
  scroll:         { flex: 1 },
  empty:          { textAlign: 'center', color: '#9ca3af', marginTop: 48, fontSize: 14 },
  cartItem:       { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 8, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  cartName:       { fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 8 },
  cartRow:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyRow:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 8, overflow: 'hidden' },
  qtyBtn:         { paddingHorizontal: 12, paddingVertical: 6 },
  qtyBtnText:     { fontSize: 18, color: '#374151', fontWeight: '600' },
  qtyNum:         { minWidth: 28, textAlign: 'center', fontSize: 14, fontWeight: '700' },
  cartPrice:      { flex: 1, textAlign: 'right', fontSize: 14, fontWeight: '700', color: '#111827' },
  removeBtn:      { color: '#d1d5db', fontSize: 16, paddingLeft: 4 },
  section:        { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 8, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  sectionTitle:   { fontSize: 12, fontWeight: '700', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  selectedCustomer: { backgroundColor: '#f5f3ff', borderRadius: 8, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectedCustomerName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1d4ed8' },
  owes:           { fontSize: 11, color: '#dc2626' },
  clearCustomer:  { color: '#6b7280', fontSize: 12 },
  customerPickBtn:{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, backgroundColor: '#f9fafb' },
  customerPickText: { fontSize: 14, color: '#6b7280' },
  totalRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  totalLabel:     { fontSize: 14, color: '#374151' },
  discountInput:  { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, width: 100, textAlign: 'right' },
  payGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  payBtn:         { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  payBtnActive:   { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  payBtnText:     { fontSize: 12, color: '#374151', fontWeight: '600' },
  payBtnTextActive: { color: '#fff' },
  changeLabel:    { fontSize: 14, color: '#16a34a', fontWeight: '600' },
  changeVal:      { fontSize: 14, color: '#16a34a', fontWeight: '700' },
  checkoutBtn:    { backgroundColor: '#7c3aed', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  checkoutBtnDisabled: { opacity: 0.5 },
  checkoutText:   { color: '#fff', fontWeight: '700', fontSize: 15 },
  modal:          { flex: 1, backgroundColor: '#fff' },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 52, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle:     { fontSize: 18, fontWeight: '700', color: '#111827' },
  closeBtn:       { fontSize: 20, color: '#6b7280', padding: 4 },
  custItem:       { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  custName:       { fontSize: 14, fontWeight: '600', color: '#111827' },
  custPhone:      { fontSize: 12, color: '#6b7280', marginTop: 2 },
  custOwes:       { fontSize: 12, color: '#dc2626', marginTop: 2 },
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  successCard:    { backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center', width: 280 },
  successEmoji:   { fontSize: 48, marginBottom: 12 },
  successTitle:   { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  successInv:     { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  successBtn:     { backgroundColor: '#7c3aed', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32 },
  successBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
