'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  ShoppingCart, Search, Plus, Minus, Trash2, X,
  CheckCircle, Receipt, Clock, User, Printer,
} from 'lucide-react'
import { Button, Card, Badge, PageLoader, TableSkeleton } from '@/components/ui'

type PaymentMethod = 'CASH' | 'EASYPAISA' | 'JAZZCASH' | 'BANK_TRANSFER' | 'CREDIT'

interface Product { id: string; name: string; brand?: string; model?: string; category: string; sellingPrice: number; stockQty: number; imeiTracked: boolean }
interface ImeiLog { id: string; imei: string; status: string }
interface CartItem { product: Product; qty: number; unitPrice: number; imei?: string }
interface Customer { id: string; name: string; phone?: string; balanceOwed: number }
interface Sale {
  id: string; invoiceNumber: string; total: number; amountPaid: number
  paymentMethod: PaymentMethod; createdAt: string
  customer?: { name: string }
  items: { product: { name: string }; qty: number; unitPrice: number }[]
}

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: string }[] = [
  { key: 'CASH',          label: 'Cash',          icon: '💵' },
  { key: 'EASYPAISA',     label: 'Easypaisa',     icon: '📱' },
  { key: 'JAZZCASH',      label: 'JazzCash',      icon: '📲' },
  { key: 'BANK_TRANSFER', label: 'Bank',          icon: '🏦' },
  { key: 'CREDIT',        label: 'Udhaar',        icon: '📒' },
]

function ImeiPicker({ productId, selected, onSelect }: { productId: string; selected?: string; onSelect: (v: string) => void }) {
  const { data: imeis = [] } = useQuery<ImeiLog[]>({
    queryKey: ['imeis', productId],
    queryFn: () => api.get(`/inventory/${productId}/imeis`).then(r => r.data),
  })
  const available = imeis.filter(i => i.status === 'IN_STOCK')
  return (
    <div className="mt-1">
      <select
        className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
        value={selected ?? ''} onChange={e => onSelect(e.target.value)} required>
        <option value="">Select IMEI…</option>
        {available.map(i => <option key={i.id} value={i.imei}>{i.imei}</option>)}
      </select>
      {available.length === 0 && <p className="text-xs text-red-500 mt-0.5">No IMEIs in stock</p>}
    </div>
  )
}

function InvoiceModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const printReceipt = () => window.print()
  const credit = Number(sale.total) - Number(sale.amountPaid)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {/* Hidden 80mm thermal receipt — only shown when printing */}
      <div id="thermal-receipt" style={{ fontFamily: 'monospace', fontSize: 12, width: 280, lineHeight: 1.5 }}>
        <div style={{ textAlign: 'center', borderBottom: '1px dashed #ccc', paddingBottom: 8, marginBottom: 8 }}>
          <div style={{ fontWeight: 'bold', fontSize: 16 }}>📱 Mobile Shop</div>
          <div style={{ fontSize: 11 }}>{sale.invoiceNumber}</div>
          <div style={{ fontSize: 10, color: '#555' }}>{new Date(sale.createdAt).toLocaleString('en-PK')}</div>
          {sale.customer && <div style={{ fontSize: 10 }}>Customer: {sale.customer.name}</div>}
        </div>
        {sale.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span>{item.product.name} x{item.qty}</span>
            <span>PKR {(item.qty * item.unitPrice).toLocaleString()}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px dashed #ccc', marginTop: 8, paddingTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 14 }}>
            <span>TOTAL</span><span>PKR {Number(sale.total).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span>Paid</span><span>PKR {Number(sale.amountPaid).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span>Method</span><span>{sale.paymentMethod}</span>
          </div>
          {credit > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#dc2626' }}>
              <span>Udhaar</span><span>PKR {credit.toLocaleString()}</span>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 10, borderTop: '1px dashed #ccc', paddingTop: 8 }}>
          <div>Thank you for shopping! شکریہ</div>
          <div style={{ color: '#888', marginTop: 2 }}>Mobile Shop SaaS</div>
        </div>
      </div>

      {/* Screen modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl shadow-black/25 w-full max-w-sm overflow-hidden">
        {/* Success header */}
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 px-6 pt-8 pb-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-xl font-extrabold text-white">Sale Complete!</h2>
          <p className="text-sm text-emerald-100 mt-1 font-mono">{sale.invoiceNumber}</p>
        </div>

        <div className="px-6 py-5">
          <div className="space-y-2 mb-4">
            {sale.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.product.name} × {item.qty}</span>
                <span className="font-semibold text-gray-900">PKR {(item.qty * item.unitPrice).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-dashed border-gray-200 pt-3 space-y-1.5">
            <div className="flex justify-between font-bold text-gray-900 text-base">
              <span>Total</span><span>PKR {Number(sale.total).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Paid</span><span>PKR {Number(sale.amountPaid).toLocaleString()}</span>
            </div>
            {credit > 0 && (
              <div className="flex justify-between text-sm font-semibold text-red-600">
                <span>Udhaar (Credit)</span><span>PKR {credit.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-2">
          <Button variant="secondary" onClick={printReceipt} size="md">
            <Printer className="w-4 h-4" /> Print
          </Button>
          <Button className="flex-1" onClick={onClose}>New Sale</Button>
        </div>
      </div>
    </div>
  )
}

function RecentSales() {
  const today = new Date().toISOString().split('T')[0]
  const { data: sales = [], isLoading } = useQuery<Sale[]>({
    queryKey: ['sales', today],
    queryFn: () => api.get(`/sales?from=${today}&to=${today}`).then(r => r.data),
  })
  if (isLoading) return <TableSkeleton rows={5} cols={4} />
  if (sales.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <Clock className="w-10 h-10 mb-3 text-gray-200" />
      <p className="text-sm">No sales today yet</p>
    </div>
  )
  return (
    <div className="space-y-2">
      {sales.slice(0, 30).map(sale => (
        <div key={sale.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-violet-100 transition-colors">
          <div>
            <div className="text-sm font-semibold text-gray-900 font-mono">{sale.invoiceNumber}</div>
            <div className="text-xs text-gray-400 mt-0.5">{sale.customer?.name ?? 'Walk-in'} · {sale.paymentMethod}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-gray-900">PKR {Number(sale.total).toLocaleString()}</div>
            <div className="text-xs text-gray-400">{new Date(sale.createdAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SalesPage() {
  const qc = useQueryClient()
  const searchRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [amountPaid, setAmountPaid] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDrop, setShowCustomerDrop] = useState(false)
  const [completedSale, setCompletedSale] = useState<Sale | null>(null)
  const [tab, setTab] = useState<'pos' | 'history'>('pos')

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['inventory'],
    queryFn: () => api.get('/inventory').then(r => r.data),
  })
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then(r => r.data),
  })

  const createSale = useMutation({
    mutationFn: (d: object) => api.post('/sales', d).then(r => r.data),
    onSuccess: (sale: Sale) => {
      void qc.invalidateQueries({ queryKey: ['inventory'] })
      void qc.invalidateQueries({ queryKey: ['sales'] })
      setCompletedSale(sale)
    },
  })

  const filtered = search.length > 1
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.brand ?? '').toLowerCase().includes(search.toLowerCase()) || (p.model ?? '').toLowerCase().includes(search.toLowerCase()))
    : []
  const filteredCustomers = customerSearch.length > 0
    ? customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone ?? '').includes(customerSearch))
    : customers.slice(0, 5)

  const addToCart = (p: Product) => {
    setCart(prev => {
      const ex = prev.find(i => i.product.id === p.id)
      if (ex && !p.imeiTracked) return prev.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { product: p, qty: 1, unitPrice: p.sellingPrice }]
    })
    setSearch(''); searchRef.current?.focus()
  }
  const updateQty = (id: string, delta: number) => setCart(prev => prev.flatMap(i => {
    if (i.product.id !== id) return [i]
    const n = i.qty + delta; if (n <= 0) return []; return [{ ...i, qty: n }]
  }))
  const updatePrice = (id: string, price: string) => setCart(prev => prev.map(i => i.product.id === id ? { ...i, unitPrice: Number(price) || 0 } : i))
  const updateImei  = (id: string, imei: string)  => setCart(prev => prev.map(i => i.product.id === id ? { ...i, imei } : i))
  const removeItem  = (id: string) => setCart(prev => prev.filter(i => i.product.id !== id))

  const subtotal = cart.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const discountAmt = Number(discount) || 0
  const total = subtotal - discountAmt
  const paid = Number(amountPaid) || 0
  const change = paid - total
  const selectedCustomer = customers.find(c => c.id === customerId)

  const handleCheckout = () => {
    if (cart.length === 0) return
    createSale.mutate({
      items: cart.map(i => ({ productId: i.product.id, qty: i.qty, unitPrice: i.unitPrice, imei: i.imei })),
      discount: discountAmt || undefined,
      paymentMethod,
      amountPaid: paymentMethod === 'CREDIT' ? paid : total,
      customerId: customerId || undefined,
    })
  }

  const resetPOS = () => {
    setCart([]); setDiscount(''); setPaymentMethod('CASH'); setAmountPaid('')
    setCustomerId(''); setCustomerSearch(''); setCompletedSale(null)
    searchRef.current?.focus()
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-88px)] lg:h-[calc(100vh-48px)]">
      {/* Tab bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Point of Sale</h1>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          <button onClick={() => setTab('pos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'pos' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            <ShoppingCart className="w-4 h-4" /> POS
          </button>
          <button onClick={() => setTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'history' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            <Clock className="w-4 h-4" /> Today&apos;s Sales
          </button>
        </div>
      </div>

      {tab === 'history' ? (
        <div className="flex-1 overflow-y-auto"><RecentSales /></div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">

          {/* LEFT — product search + cart */}
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            {/* Product search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              <input ref={searchRef} autoFocus
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
                placeholder="Search product to add to cart…"
                value={search} onChange={e => setSearch(e.target.value)} />
              {filtered.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-72 overflow-y-auto">
                  {filtered.map(p => (
                    <button key={p.id} onClick={() => addToCart(p)} disabled={p.stockQty === 0}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-violet-50 transition-colors text-left disabled:opacity-40 border-b border-gray-50 last:border-0">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{p.name}</div>
                        {(p.brand || p.model) && <div className="text-xs text-gray-400">{[p.brand, p.model].filter(Boolean).join(' ')}</div>}
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <div className="text-sm font-bold text-violet-600">PKR {Number(p.sellingPrice).toLocaleString()}</div>
                        <div className={`text-xs ${p.stockQty === 0 ? 'text-red-500' : 'text-gray-400'}`}>
                          {p.stockQty === 0 ? 'Out of stock' : `${p.stockQty} left`}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart */}
            <Card padding={false} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Cart</span>
                {cart.length > 0 && <Badge color="blue">{cart.length} item{cart.length !== 1 ? 's' : ''}</Badge>}
              </div>
              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-gray-400">
                  <ShoppingCart className="w-12 h-12 mb-3 text-gray-200" />
                  <p className="text-sm">Search for a product above to start the sale</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {cart.map(item => (
                    <div key={item.product.id} className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{item.product.name}</p>
                          {item.product.imeiTracked && (
                            <ImeiPicker productId={item.product.id} selected={item.imei} onSelect={v => updateImei(item.product.id, v)} />
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!item.product.imeiTracked && (
                            <div className="flex items-center bg-gray-100 rounded-lg">
                              <button onClick={() => updateQty(item.product.id, -1)} className="p-1.5 text-gray-500 hover:text-gray-700 rounded-l-lg hover:bg-gray-200 transition-colors">
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-sm font-bold w-7 text-center text-gray-900">{item.qty}</span>
                              <button onClick={() => updateQty(item.product.id, 1)} disabled={item.qty >= item.product.stockQty} className="p-1.5 text-gray-500 hover:text-gray-700 rounded-r-lg hover:bg-gray-200 transition-colors disabled:opacity-40">
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                            <span className="px-2 text-xs text-gray-400 bg-gray-50 border-r border-gray-200 py-1.5">PKR</span>
                            <input type="number" min="0"
                              className="w-20 px-2 py-1.5 text-sm font-semibold text-right focus:outline-none"
                              value={item.unitPrice} onChange={e => updatePrice(item.product.id, e.target.value)} />
                          </div>
                          <button onClick={() => removeItem(item.product.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-400 mt-1">
                        {item.qty} × PKR {item.unitPrice.toLocaleString()} = <span className="font-semibold text-gray-600">PKR {(item.qty * item.unitPrice).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT — checkout panel */}
          <div className="w-full lg:w-80 flex flex-col gap-3 shrink-0">
            {/* Customer */}
            <Card>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Customer (optional)
              </p>
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-3 bg-violet-50 border border-violet-100 rounded-xl">
                  <div>
                    <div className="text-sm font-bold text-violet-900">{selectedCustomer.name}</div>
                    {selectedCustomer.phone && <div className="text-xs text-violet-500">{selectedCustomer.phone}</div>}
                    {Number(selectedCustomer.balanceOwed) > 0 && (
                      <div className="text-xs text-red-500 mt-0.5">Owes PKR {Number(selectedCustomer.balanceOwed).toLocaleString()}</div>
                    )}
                  </div>
                  <button onClick={() => { setCustomerId(''); setCustomerSearch('') }} className="text-violet-400 hover:text-violet-600 p-1 rounded-lg hover:bg-violet-100 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Search by name or phone…"
                    value={customerSearch}
                    onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDrop(true) }}
                    onFocus={() => setShowCustomerDrop(true)}
                    onBlur={() => setTimeout(() => setShowCustomerDrop(false), 200)} />
                  {showCustomerDrop && filteredCustomers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-44 overflow-y-auto">
                      {filteredCustomers.map(c => (
                        <button key={c.id} onMouseDown={() => { setCustomerId(c.id); setCustomerSearch(c.name); setShowCustomerDrop(false) }}
                          className="w-full flex justify-between items-center px-3 py-2.5 hover:bg-violet-50 text-left border-b border-gray-50 last:border-0 transition-colors">
                          <div>
                            <div className="text-sm font-semibold text-gray-800">{c.name}</div>
                            {c.phone && <div className="text-xs text-gray-400">{c.phone}</div>}
                          </div>
                          {Number(c.balanceOwed) > 0 && (
                            <Badge color="red" className="shrink-0 ml-2">PKR {Number(c.balanceOwed).toLocaleString()}</Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Totals + checkout */}
            <Card className="flex flex-col gap-4">
              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span><span>PKR {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Discount</span>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <span className="px-2 text-xs text-gray-400 bg-gray-50 border-r border-gray-200 py-1.5">PKR</span>
                    <input type="number" min="0" placeholder="0" value={discount} onChange={e => setDiscount(e.target.value)}
                      className="w-20 px-2 py-1.5 text-sm text-right focus:outline-none" />
                  </div>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-lg pt-2 border-t border-gray-100">
                  <span>Total</span><span>PKR {total.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment method */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payment Method</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {PAYMENT_METHODS.map(m => (
                    <button key={m.key} onClick={() => setPaymentMethod(m.key)}
                      className={`py-2 px-1 rounded-xl text-xs font-semibold border-2 transition-all flex flex-col items-center gap-1 ${paymentMethod === m.key ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-200' : 'border-gray-200 text-gray-600 hover:border-violet-300 hover:bg-violet-50'}`}>
                      <span className="text-base">{m.icon}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash received / partial */}
              {(paymentMethod === 'CREDIT' || paymentMethod === 'CASH') && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {paymentMethod === 'CREDIT' ? 'Amount Paid Now' : 'Cash Received'}
                  </p>
                  <input type="number" min="0" placeholder={String(total)} value={amountPaid}
                    onChange={e => setAmountPaid(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  {paymentMethod === 'CASH' && paid > 0 && paid >= total && (
                    <div className="flex justify-between mt-2 px-3 py-2 bg-emerald-50 rounded-lg text-sm font-semibold text-emerald-700">
                      <span>Change</span><span>PKR {change.toLocaleString()}</span>
                    </div>
                  )}
                  {paymentMethod === 'CREDIT' && paid > 0 && paid < total && (
                    <div className="flex justify-between mt-2 px-3 py-2 bg-red-50 rounded-lg text-sm font-semibold text-red-600">
                      <span>Udhaar (Credit)</span><span>PKR {(total - paid).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'CREDIT' && !customerId && (
                <p className="text-xs text-center text-amber-600 bg-amber-50 py-2 rounded-lg">⚠️ Select a customer for credit sales</p>
              )}

              {createSale.error && (
                <p className="text-xs text-red-600 text-center">
                  {(createSale.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Sale failed'}
                </p>
              )}

              <Button
                size="lg"
                className="w-full"
                onClick={handleCheckout}
                disabled={cart.length === 0 || (paymentMethod === 'CREDIT' && !customerId)}
                loading={createSale.isPending}
              >
                <Receipt className="w-4 h-4" /> Complete Sale · PKR {total.toLocaleString()}
              </Button>
            </Card>
          </div>
        </div>
      )}

      {completedSale && <InvoiceModal sale={completedSale} onClose={resetPOS} />}
    </div>
  )
}
