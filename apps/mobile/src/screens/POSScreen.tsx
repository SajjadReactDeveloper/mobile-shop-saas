import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, FlatList,
} from 'react-native'
import { STATUS_TOP } from '../lib/constants'
import { api } from '../lib/api'
import { printReceipt, shareReceipt } from '../lib/receipt'
import { POSScreenSkeleton } from '../components/Skeleton'
import { BarcodeScannerModal } from '../components/BarcodeScannerModal'

type PaymentMethod = 'CASH' | 'EASYPAISA' | 'JAZZCASH' | 'BANK_TRANSFER' | 'CREDIT'
interface Product { id: string; name: string; brand?: string; sellingPrice: number; stockQty: number; imeiTracked: boolean }
interface Customer { id: string; name: string; phone?: string; balanceOwed: number }
interface CartItem { product: Product; qty: number; unitPrice: number }

const PAY_LABELS: Record<PaymentMethod, string> = {
  CASH: 'ðŸ’µ Cash', EASYPAISA: 'ðŸ’š Easypaisa', JAZZCASH: 'ðŸ”´ JazzCash',
  BANK_TRANSFER: 'ðŸ¦ Bank', CREDIT: 'ðŸ“’ Credit',
}

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
  const [lastSaleCart, setLastSaleCart] = useState<CartItem[]>([])
  const [lastSaleTotal, setLastSaleTotal] = useState(0)
  const [lastSalePaid, setLastSalePaid] = useState(0)
  const [showCustomers, setShowCustomers] = useState(false)
  const [showScanner, setShowScanner] = useState(false)

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([
        api.get('/inventory').then(r => r.data),
        api.get('/customers').then(r => r.data),
      ])
      setProducts(p); setCustomers(c)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const filteredProducts = search.length > 1
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.brand ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : []

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone ?? '').includes(customerSearch)
  )

  const addToCart = (product: Product) => {
    if (product.stockQty === 0) return Alert.alert('Out of Stock', `${product.name} is out of stock`)
    setCart(prev => {
      const ex = prev.find(i => i.product.id === product.id)
      if (ex && !product.imeiTracked) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { product, qty: 1, unitPrice: product.sellingPrice }]
    })
    setSearch('')
  }

  const handleBarcodeScan = (value: string) => {
    setShowScanner(false)
    // Try exact match first (product name or brand contains the scanned value)
    const exactMatch = products.find(
      p => p.name.toLowerCase() === value.toLowerCase() ||
           (p.brand ?? '').toLowerCase() === value.toLowerCase()
    )
    if (exactMatch) {
      addToCart(exactMatch)
    } else {
      // Fall back to filling the search so user sees filtered results
      setSearch(value)
    }
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
    if (cart.length === 0) return Alert.alert('Empty Cart', 'Add at least one product to checkout')
    if (payMethod === 'CREDIT' && !customerId) return Alert.alert('Customer Required', 'Select a customer for credit sales')
    setPlacing(true)
    try {
      const r = await api.post('/sales', {
        items: cart.map(i => ({ productId: i.product.id, qty: i.qty, unitPrice: i.unitPrice })),
        discount: Number(discount) || undefined,
        paymentMethod: payMethod,
        amountPaid: payMethod === 'CASH' && amountPaid ? Number(amountPaid) : total,
        customerId: customerId || undefined,
      })
      setLastSaleCart(cart)
      setLastSaleTotal(total)
      setLastSalePaid(payMethod === 'CASH' && amountPaid ? Number(amountPaid) : total)
      setShowSuccess(r.data.invoiceNumber as string)
      setCart([]); setDiscount(''); setAmountPaid(''); setCustomerId(''); setCustomerSearch(''); setPayMethod('CASH')
      await load()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      Alert.alert('Sale Failed', err?.response?.data?.message ?? 'Something went wrong')
    } finally { setPlacing(false) }
  }

  if (loading) return <POSScreenSkeleton />

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Point of Sale</Text>
          <Text style={s.headerSub}>{cart.length} item{cart.length !== 1 ? 's' : ''} in cart</Text>
        </View>
        {cart.length > 0 && (
          <TouchableOpacity onPress={() => setCart([])} style={s.clearBtn}>
            <Text style={s.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Product search */}
      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>ðŸ”</Text>
        <TextInput
          style={s.searchInput} placeholder="Search product to add to cartâ€¦"
          placeholderTextColor="#9ca3af" value={search} onChangeText={setSearch}
        />
        {search.length > 0 ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: '#9ca3af', fontSize: 18, paddingRight: 4 }}>âœ•</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.scanBtn} onPress={() => setShowScanner(true)}>
            <Text style={s.scanBtnText}>ðŸ“·</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Dropdown */}
      {filteredProducts.length > 0 && (
        <View style={s.dropdown}>
          {filteredProducts.slice(0, 5).map(p => (
            <TouchableOpacity
              key={p.id} style={[s.dropItem, p.stockQty === 0 && s.dropItemDimmed]}
              onPress={() => addToCart(p)} disabled={p.stockQty === 0}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.dropName} numberOfLines={1}>{p.name}</Text>
                <Text style={s.dropStock}>{p.stockQty} in stock</Text>
              </View>
              <Text style={s.dropPrice}>PKR {Number(p.sellingPrice).toLocaleString()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Cart items */}
        {cart.length === 0 ? (
          <View style={s.emptyCart}>
            <Text style={s.emptyCartEmoji}>ðŸ›’</Text>
            <Text style={s.emptyCartText}>Search above to add products</Text>
          </View>
        ) : (
          <View style={s.cartWrap}>
            <Text style={s.cartHeader}>Cart Items</Text>
            {cart.map(item => (
              <View key={item.product.id} style={s.cartItem}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cartName} numberOfLines={1}>{item.product.name}</Text>
                  <Text style={s.cartUnitPrice}>PKR {Number(item.unitPrice).toLocaleString()} each</Text>
                </View>
                <View style={s.qtyControls}>
                  <TouchableOpacity style={s.qtyBtn} onPress={() => updateQty(item.product.id, -1)}>
                    <Text style={s.qtyBtnText}>âˆ’</Text>
                  </TouchableOpacity>
                  <Text style={s.qtyNum}>{item.qty}</Text>
                  <TouchableOpacity style={s.qtyBtn} onPress={() => updateQty(item.product.id, 1)}>
                    <Text style={s.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={s.cartLineTotal}>PKR {(item.qty * item.unitPrice).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Customer */}
        {cart.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>CUSTOMER (OPTIONAL)</Text>
            {selectedCustomer ? (
              <View style={s.selectedCustomer}>
                <View style={s.customerAvatar}>
                  <Text style={s.customerAvatarText}>{selectedCustomer.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.customerName}>{selectedCustomer.name}</Text>
                  {Number(selectedCustomer.balanceOwed) > 0 && (
                    <Text style={s.customerOwes}>Owes PKR {Number(selectedCustomer.balanceOwed).toLocaleString()}</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => { setCustomerId(''); setCustomerSearch('') }}>
                  <Text style={s.clearCustomer}>âœ• Clear</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={s.pickCustomerBtn} onPress={() => setShowCustomers(true)}>
                <Text style={s.pickCustomerText}>ðŸ‘¤ Select customerâ€¦</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Totals & payment */}
        {cart.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>ORDER SUMMARY</Text>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Subtotal</Text>
              <Text style={s.totalValue}>PKR {subtotal.toLocaleString()}</Text>
            </View>
            <View style={[s.totalRow, { alignItems: 'center' }]}>
              <Text style={s.totalLabel}>Discount (PKR)</Text>
              <TextInput
                style={s.discountInput} keyboardType="numeric"
                value={discount} onChangeText={setDiscount} placeholder="0"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={[s.totalRow, s.totalRowBold]}>
              <Text style={s.totalLabelBold}>Total</Text>
              <Text style={s.totalValueBold}>PKR {total.toLocaleString()}</Text>
            </View>

            <Text style={[s.sectionTitle, { marginTop: 16 }]}>PAYMENT METHOD</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
                {(Object.keys(PAY_LABELS) as PaymentMethod[]).map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[s.payBtn, payMethod === m && s.payBtnActive]}
                    onPress={() => setPayMethod(m)}
                  >
                    <Text style={[s.payBtnText, payMethod === m && s.payBtnTextActive]}>
                      {PAY_LABELS[m]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {payMethod === 'CASH' && (
              <View style={[s.totalRow, { alignItems: 'center', marginTop: 8 }]}>
                <Text style={s.totalLabel}>Cash Received</Text>
                <TextInput
                  style={s.discountInput} keyboardType="numeric"
                  value={amountPaid} onChangeText={setAmountPaid}
                  placeholder={String(total)} placeholderTextColor="#9ca3af"
                />
              </View>
            )}
            {payMethod === 'CASH' && change >= 0 && Number(amountPaid) > 0 && (
              <View style={s.changeBox}>
                <Text style={s.changeLabel}>Change to return</Text>
                <Text style={s.changeValue}>PKR {change.toLocaleString()}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[s.checkoutBtn, placing && s.checkoutBtnDisabled]}
              onPress={checkout} disabled={placing}
            >
              <Text style={s.checkoutText}>{placing ? 'Processingâ€¦' : `âœ“ Complete Sale Â· PKR ${total.toLocaleString()}`}</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Barcode scanner */}
      <BarcodeScannerModal
        visible={showScanner}
        onScan={handleBarcodeScan}
        onClose={() => setShowScanner(false)}
        hint="Scan product barcode to add to cart"
      />

      {/* Customer picker modal */}
      <Modal visible={showCustomers} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHandle} />
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Select Customer</Text>
            <TouchableOpacity onPress={() => setShowCustomers(false)} style={s.closeBtn}>
              <Text style={s.closeBtnText}>âœ•</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: 16 }}>
            <TextInput
              style={s.searchInput2} placeholder="Search name or phoneâ€¦"
              placeholderTextColor="#9ca3af"
              value={customerSearch} onChangeText={setCustomerSearch} autoFocus
            />
          </View>
          <FlatList
            data={filteredCustomers}
            keyExtractor={c => c.id}
            renderItem={({ item: c }) => (
              <TouchableOpacity
                style={s.custItem}
                onPress={() => { setCustomerId(c.id); setCustomerSearch(c.name); setShowCustomers(false) }}
              >
                <View style={s.custAvatar}>
                  <Text style={s.custAvatarText}>{c.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.custName}>{c.name}</Text>
                  <Text style={s.custPhone}>{c.phone ?? 'No phone'}</Text>
                </View>
                {Number(c.balanceOwed) > 0 && (
                  <Text style={s.custOwes}>Owes PKR {Number(c.balanceOwed).toLocaleString()}</Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={s.emptyCartText}>No customers found</Text>}
          />
        </View>
      </Modal>

      {/* Success modal */}
      <Modal visible={!!showSuccess} animationType="fade" transparent>
        <View style={s.overlay}>
          <View style={s.successCard}>
            <View style={s.successIconWrap}>
              <Text style={{ fontSize: 40 }}>âœ…</Text>
            </View>
            <Text style={s.successTitle}>Sale Complete!</Text>
            <Text style={s.successInv}>Invoice #{showSuccess}</Text>
            <Text style={s.successAmount}>PKR {lastSaleTotal.toLocaleString()}</Text>
            {/* Print / Share receipt buttons */}
            <View style={{ flexDirection: 'row', gap: 8, width: '100%', marginTop: 16, marginBottom: 4 }}>
              <TouchableOpacity
                style={[s.receiptBtn, { flex: 1 }]}
                onPress={() => {
                  if (!showSuccess) return
                  void printReceipt({
                    shopName: 'My Shop',
                    invoiceNumber: showSuccess,
                    date: new Date().toLocaleDateString('en-PK'),
                    items: lastSaleCart.map(i => ({ name: i.product.name, qty: i.qty, unitPrice: i.unitPrice })),
                    subtotal: lastSaleCart.reduce((s, i) => s + i.qty * i.unitPrice, 0),
                    total: lastSaleTotal,
                    paymentMethod: 'CASH',
                    amountPaid: lastSalePaid,
                  })
                }}
              >
                <Text style={s.receiptBtnText}>ðŸ–¨ Print</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.receiptBtn, { flex: 1 }]}
                onPress={() => {
                  if (!showSuccess) return
                  void shareReceipt({
                    shopName: 'My Shop',
                    invoiceNumber: showSuccess,
                    date: new Date().toLocaleDateString('en-PK'),
                    items: lastSaleCart.map(i => ({ name: i.product.name, qty: i.qty, unitPrice: i.unitPrice })),
                    subtotal: lastSaleCart.reduce((s, i) => s + i.qty * i.unitPrice, 0),
                    total: lastSaleTotal,
                    paymentMethod: 'CASH',
                    amountPaid: lastSalePaid,
                  })
                }}
              >
                <Text style={s.receiptBtnText}>ðŸ“¤ Share</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.successBtn} onPress={() => setShowSuccess(null)}>
              <Text style={s.successBtnText}>New Sale â†’</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f0f9ff' },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: STATUS_TOP, paddingBottom: 14, backgroundColor: '#2563eb' },
  headerTitle:    { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub:      { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  clearBtn:       { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  clearBtnText:   { color: '#fff', fontWeight: '600', fontSize: 13 },
  searchWrap:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#dbeafe' },
  searchIcon:     { fontSize: 16 },
  searchInput:    { flex: 1, fontSize: 14, color: '#111827', paddingVertical: 4 },
  scanBtn:        { width: 34, height: 34, borderRadius: 10, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  scanBtnText:    { fontSize: 18 },
  dropdown:       { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#dbeafe', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
  dropItem:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eff6ff' },
  dropItemDimmed: { opacity: 0.4 },
  dropName:       { fontSize: 14, fontWeight: '600', color: '#111827' },
  dropStock:      { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  dropPrice:      { fontSize: 14, fontWeight: '700', color: '#2563eb' },
  scroll:         { flex: 1 },
  emptyCart:      { alignItems: 'center', paddingTop: 64 },
  emptyCartEmoji: { fontSize: 56, marginBottom: 12 },
  emptyCartText:  { textAlign: 'center', color: '#9ca3af', fontSize: 14 },
  cartWrap:       { margin: 12, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cartHeader:     { fontSize: 12, fontWeight: '700', color: '#6b7280', padding: 14, paddingBottom: 0, textTransform: 'uppercase', letterSpacing: 0.5 },
  cartItem:       { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: '#f9fafb', gap: 10 },
  cartName:       { fontSize: 13, fontWeight: '700', color: '#111827' },
  cartUnitPrice:  { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  qtyControls:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: 10, overflow: 'hidden' },
  qtyBtn:         { paddingHorizontal: 10, paddingVertical: 7 },
  qtyBtnText:     { fontSize: 18, color: '#2563eb', fontWeight: '700' },
  qtyNum:         { minWidth: 24, textAlign: 'center', fontSize: 14, fontWeight: '800', color: '#111827' },
  cartLineTotal:  { fontSize: 14, fontWeight: '800', color: '#111827', minWidth: 80, textAlign: 'right' },
  section:        { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  sectionTitle:   { fontSize: 10, fontWeight: '700', color: '#2563eb', letterSpacing: 1, marginBottom: 10 },
  selectedCustomer: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#eff6ff', borderRadius: 12, padding: 10 },
  customerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  customerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  customerName:   { fontSize: 14, fontWeight: '700', color: '#111827' },
  customerOwes:   { fontSize: 11, color: '#dc2626', marginTop: 1 },
  clearCustomer:  { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  pickCustomerBtn: { borderWidth: 1.5, borderColor: '#dbeafe', borderRadius: 12, padding: 12, backgroundColor: '#f0f9ff' },
  pickCustomerText: { fontSize: 14, color: '#9ca3af' },
  totalRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  totalRowBold:   { borderTopWidth: 1.5, borderTopColor: '#f3f4f6', marginTop: 4, paddingTop: 10 },
  totalLabel:     { fontSize: 14, color: '#6b7280' },
  totalValue:     { fontSize: 14, color: '#111827', fontWeight: '600' },
  totalLabelBold: { fontSize: 16, fontWeight: '700', color: '#111827' },
  totalValueBold: { fontSize: 18, fontWeight: '800', color: '#2563eb' },
  discountInput:  { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, fontSize: 14, width: 110, textAlign: 'right', color: '#111827', backgroundColor: '#f9fafb' },
  payBtn:         { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  payBtnActive:   { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  payBtnText:     { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  payBtnTextActive: { color: '#fff' },
  changeBox:      { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  changeLabel:    { fontSize: 13, color: '#16a34a', fontWeight: '600' },
  changeValue:    { fontSize: 15, color: '#16a34a', fontWeight: '800' },
  checkoutBtn:    { backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 14, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  checkoutBtnDisabled: { opacity: 0.55 },
  checkoutText:   { color: '#fff', fontWeight: '700', fontSize: 15 },
  modal:          { flex: 1, backgroundColor: '#fff' },
  modalHandle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginTop: 12 },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle:     { fontSize: 18, fontWeight: '800', color: '#111827' },
  closeBtn:       { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  closeBtnText:   { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  searchInput2:   { backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#111827' },
  custItem:       { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f9fafb', gap: 12 },
  custAvatar:     { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  custAvatarText: { fontSize: 16, fontWeight: '700', color: '#2563eb' },
  custName:       { fontSize: 14, fontWeight: '700', color: '#111827' },
  custPhone:      { fontSize: 12, color: '#6b7280', marginTop: 1 },
  custOwes:       { fontSize: 12, color: '#dc2626', fontWeight: '600' },
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  successCard:    { backgroundColor: '#fff', borderRadius: 28, padding: 32, alignItems: 'center', width: 300, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  successIconWrap:{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successTitle:   { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  successInv:     { fontSize: 13, color: '#9ca3af', marginBottom: 4 },
  successAmount:  { fontSize: 24, fontWeight: '800', color: '#2563eb', marginBottom: 20 },
  successBtn:     { backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 13, paddingHorizontal: 36, marginTop: 4 },
  successBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  receiptBtn:     { backgroundColor: '#eff6ff', borderRadius: 12, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: '#dbeafe' },
  receiptBtnText: { color: '#2563eb', fontWeight: '600', fontSize: 13 },
})
