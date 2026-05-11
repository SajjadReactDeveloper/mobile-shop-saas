'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  ShoppingCart, Search, Plus, Minus, Trash2, X,
  CheckCircle, ChevronDown, Loader2, Receipt, Clock,
  User, Printer,
} from 'lucide-react'

type PaymentMethod = 'CASH' | 'EASYPAISA' | 'JAZZCASH' | 'BANK_TRANSFER' | 'CREDIT'

interface Product {
  id: string
  name: string
  brand?: string
  model?: string
  category: string
  sellingPrice: number
  stockQty: number
  imeiTracked: boolean
}

interface ImeiLog {
  id: string
  imei: string
  status: string
}

interface CartItem {
  product: Product
  qty: number
  unitPrice: number
  imei?: string
}

interface Customer {
  id: string
  name: string
  phone?: string
  balanceOwed: number
}

interface Sale {
  id: string
  invoiceNumber: string
  total: number
  amountPaid: number
  paymentMethod: PaymentMethod
  createdAt: string
  customer?: { name: string }
  items: { product: { name: string }; qty: number; unitPrice: number }[]
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  EASYPAISA: 'Easypaisa',
  JAZZCASH: 'JazzCash',
  BANK_TRANSFER: 'Bank Transfer',
  CREDIT: 'Credit (Udhaar)',
}

const input = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
const btn = 'px-4 py-2 text-sm font-medium rounded-lg transition-colors'

// ─── IMEI Picker ────────────────────────────────────────────────────────────

function ImeiPicker({ productId, selected, onSelect }: {
  productId: string
  selected?: string
  onSelect: (imei: string) => void
}) {
  const { data: imeis = [] } = useQuery<ImeiLog[]>({
    queryKey: ['imeis', productId],
    queryFn: () => api.get(`/inventory/${productId}/imeis`).then(r => r.data),
  })

  const available = imeis.filter(i => i.status === 'IN_STOCK')

  return (
    <div className="relative mt-1">
      <div className="relative">
        <select className={input + ' appearance-none pr-8 text-xs'}
          value={selected ?? ''}
          onChange={e => onSelect(e.target.value)}
          required>
          <option value="">Select IMEI…</option>
          {available.map(i => <option key={i.id} value={i.imei}>{i.imei}</option>)}
        </select>
        <ChevronDown className="absolute right-2 top-2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </div>
      {available.length === 0 && (
        <p className="text-xs text-red-500 mt-0.5">No IMEIs in stock</p>
      )}
    </div>
  )
}

// ─── Invoice Modal ───────────────────────────────────────────────────────────

function InvoiceModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="px-6 pt-6 pb-2 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Sale Complete</h2>
          <p className="text-sm text-gray-500 mt-0.5">{sale.invoiceNumber}</p>
        </div>

        <div className="px-6 py-4 space-y-3">
          <div className="border-t border-dashed border-gray-200 pt-3 space-y-1.5">
            {sale.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.product.name} × {item.qty}</span>
                <span className="font-medium">PKR {(item.qty * item.unitPrice).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-dashed border-gray-200 pt-3 space-y-1">
            <div className="flex justify-between text-sm font-bold text-gray-900">
              <span>Total</span>
              <span>PKR {Number(sale.total).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Paid</span>
              <span>PKR {Number(sale.amountPaid).toLocaleString()}</span>
            </div>
            {Number(sale.total) > Number(sale.amountPaid) && (
              <div className="flex justify-between text-sm text-red-600 font-medium">
                <span>Credit (Udhaar)</span>
                <span>PKR {(Number(sale.total) - Number(sale.amountPaid)).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-gray-400">
              <span>Payment</span>
              <span>{PAYMENT_LABELS[sale.paymentMethod]}</span>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-2">
          <button
            onClick={() => {
              const w = window.open('', '_blank', 'width=400,height=600')
              if (!w) return
              w.document.write(`<html><head><title>${sale.invoiceNumber}</title><style>body{font-family:monospace;font-size:13px;padding:20px;width:300px}h2{text-align:center;margin:0}hr{border:none;border-top:1px dashed #ccc;margin:10px 0}.row{display:flex;justify-content:space-between}.total{font-weight:bold;font-size:15px}</style></head><body>
                <h2>Mobile Shop</h2><p style="text-align:center;margin:4px 0">${sale.invoiceNumber}</p><p style="text-align:center;font-size:11px">${new Date(sale.createdAt).toLocaleString('en-PK')}</p>
                <hr/>${sale.items.map(i => `<div class="row"><span>${i.product.name} x${i.qty}</span><span>PKR ${(i.qty * i.unitPrice).toLocaleString()}</span></div>`).join('')}
                <hr/><div class="row total"><span>Total</span><span>PKR ${Number(sale.total).toLocaleString()}</span></div>
                <div class="row"><span>Paid</span><span>PKR ${Number(sale.amountPaid).toLocaleString()}</span></div>
                <div class="row"><span>Method</span><span>${sale.paymentMethod}</span></div><hr/><p style="text-align:center;font-size:11px">Thank you!</p>
              </body></html>`)
              w.document.close()
              w.print()
            }}
            className={btn + ' bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1.5'}>
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={onClose} className={btn + ' flex-1 bg-blue-600 text-white hover:bg-blue-700'}>
            New Sale
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Recent Sales Panel ──────────────────────────────────────────────────────

function RecentSales() {
  const today = new Date().toISOString().split('T')[0]
  const { data: sales = [], isLoading } = useQuery<Sale[]>({
    queryKey: ['sales', today],
    queryFn: () => api.get(`/sales?from=${today}&to=${today}`).then(r => r.data),
  })

  if (isLoading) return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
  if (sales.length === 0) return <p className="text-sm text-gray-400 text-center py-6">No sales today yet</p>

  return (
    <div className="space-y-2">
      {sales.slice(0, 20).map(sale => (
        <div key={sale.id} className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl">
          <div>
            <div className="text-sm font-medium text-gray-800">{sale.invoiceNumber}</div>
            <div className="text-xs text-gray-400">
              {sale.customer?.name ?? 'Walk-in'} · {PAYMENT_LABELS[sale.paymentMethod]}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-gray-900">PKR {Number(sale.total).toLocaleString()}</div>
            <div className="text-xs text-gray-400">
              {new Date(sale.createdAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main POS Page ───────────────────────────────────────────────────────────

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
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
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
    mutationFn: (data: object) => api.post('/sales', data).then(r => r.data),
    onSuccess: (sale: Sale) => {
      void qc.invalidateQueries({ queryKey: ['inventory'] })
      void qc.invalidateQueries({ queryKey: ['sales'] })
      setCompletedSale(sale)
    },
  })

  const filteredProducts = search.length > 1
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.brand ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (p.model ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : []

  const filteredCustomers = customerSearch.length > 0
    ? customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.phone ?? '').includes(customerSearch)
      )
    : customers.slice(0, 5)

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing && !product.imeiTracked) {
        return prev.map(i => i.product.id === product.id
          ? { ...i, qty: i.qty + 1 }
          : i
        )
      }
      return [...prev, { product, qty: 1, unitPrice: product.sellingPrice }]
    })
    setSearch('')
    searchRef.current?.focus()
  }

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.flatMap(i => {
      if (i.product.id !== productId) return [i]
      const newQty = i.qty + delta
      if (newQty <= 0) return []
      return [{ ...i, qty: newQty }]
    }))
  }

  const updatePrice = (productId: string, price: string) => {
    setCart(prev => prev.map(i => i.product.id === productId ? { ...i, unitPrice: Number(price) || 0 } : i))
  }

  const updateImei = (productId: string, imei: string) => {
    setCart(prev => prev.map(i => i.product.id === productId ? { ...i, imei } : i))
  }

  const removeItem = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId))
  }

  const subtotal = cart.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const discountAmt = Number(discount) || 0
  const total = subtotal - discountAmt
  const paid = Number(amountPaid) || 0
  const change = paid - total

  const selectedCustomer = customers.find(c => c.id === customerId)

  const handleCheckout = () => {
    if (cart.length === 0) return
    createSale.mutate({
      items: cart.map(i => ({
        productId: i.product.id,
        qty: i.qty,
        unitPrice: i.unitPrice,
        imei: i.imei,
      })),
      discount: discountAmt || undefined,
      paymentMethod,
      amountPaid: paymentMethod === 'CREDIT' ? paid : total,
      customerId: customerId || undefined,
    })
  }

  const resetPOS = () => {
    setCart([])
    setDiscount('')
    setPaymentMethod('CASH')
    setAmountPaid('')
    setCustomerId('')
    setCustomerSearch('')
    setCompletedSale(null)
    searchRef.current?.focus()
  }

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-[calc(100vh-0px)] flex flex-col">
      {/* Tab bar */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('pos')} className={`${btn} ${tab === 'pos' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          <span className="flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> POS</span>
        </button>
        <button onClick={() => setTab('history')} className={`${btn} ${tab === 'history' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Today&apos;s Sales</span>
        </button>
      </div>

      {tab === 'history' ? (
        <div className="flex-1 overflow-y-auto">
          <RecentSales />
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">

          {/* Left — product search + cart */}
          <div className="flex-1 flex flex-col gap-3 min-h-0">

            {/* Product search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input ref={searchRef} className={input + ' pl-9'} placeholder="Search product to add…"
                value={search} onChange={e => setSearch(e.target.value)} autoFocus />
              {filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto">
                  {filteredProducts.map(p => (
                    <button key={p.id} onClick={() => addToCart(p)}
                      disabled={p.stockQty === 0}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed border-b border-gray-50 last:border-0">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{p.name}</div>
                        {(p.brand || p.model) && <div className="text-xs text-gray-400">{[p.brand, p.model].filter(Boolean).join(' ')}</div>}
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm font-semibold text-blue-600">PKR {Number(p.sellingPrice).toLocaleString()}</div>
                        <div className={`text-xs ${p.stockQty === 0 ? 'text-red-500' : 'text-gray-400'}`}>
                          {p.stockQty === 0 ? 'Out of stock' : `${p.stockQty} in stock`}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart */}
            <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-sm">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16 text-gray-400">
                  <ShoppingCart className="w-10 h-10 mb-3 text-gray-300" />
                  <p className="text-sm">Search for a product to start the sale</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {cart.map(item => (
                    <div key={item.product.id} className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                          {item.product.imeiTracked && (
                            <ImeiPicker productId={item.product.id} selected={item.imei} onSelect={v => updateImei(item.product.id, v)} />
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!item.product.imeiTracked && (
                            <div className="flex items-center gap-1 bg-gray-100 rounded-lg">
                              <button onClick={() => updateQty(item.product.id, -1)} className="p-1.5 text-gray-500 hover:text-gray-700">
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-sm font-medium w-6 text-center">{item.qty}</span>
                              <button onClick={() => updateQty(item.product.id, 1)} disabled={item.qty >= item.product.stockQty} className="p-1.5 text-gray-500 hover:text-gray-700 disabled:opacity-40">
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                          <div className="flex items-center">
                            <span className="text-xs text-gray-400 mr-1">PKR</span>
                            <input
                              type="number" min="0"
                              className="w-24 px-2 py-1 text-sm font-medium border border-gray-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={item.unitPrice}
                              onChange={e => updatePrice(item.product.id, e.target.value)}
                            />
                          </div>
                          <button onClick={() => removeItem(item.product.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-400 mt-1">
                        {item.qty} × PKR {item.unitPrice.toLocaleString()} = <span className="font-medium text-gray-600">PKR {(item.qty * item.unitPrice).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right — checkout panel */}
          <div className="w-full lg:w-80 flex flex-col gap-3 shrink-0">

            {/* Customer picker */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-2">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Customer (optional)</label>
              {selectedCustomer ? (
                <div className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-blue-800">{selectedCustomer.name}</div>
                    {selectedCustomer.phone && <div className="text-xs text-blue-500">{selectedCustomer.phone}</div>}
                    {Number(selectedCustomer.balanceOwed) > 0 && (
                      <div className="text-xs text-red-500">Owes PKR {Number(selectedCustomer.balanceOwed).toLocaleString()}</div>
                    )}
                  </div>
                  <button onClick={() => { setCustomerId(''); setCustomerSearch('') }} className="text-blue-400 hover:text-blue-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input className={input} placeholder="Search name or phone…"
                    value={customerSearch}
                    onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true) }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)} />
                  {showCustomerDropdown && filteredCustomers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-40 overflow-y-auto">
                      {filteredCustomers.map(c => (
                        <button key={c.id} onMouseDown={() => { setCustomerId(c.id); setCustomerSearch(c.name); setShowCustomerDropdown(false) }}
                          className="w-full flex justify-between items-center px-3 py-2 hover:bg-blue-50 text-left border-b border-gray-50 last:border-0">
                          <div>
                            <div className="text-sm font-medium text-gray-800">{c.name}</div>
                            {c.phone && <div className="text-xs text-gray-400">{c.phone}</div>}
                          </div>
                          {Number(c.balanceOwed) > 0 && (
                            <span className="text-xs text-red-500 shrink-0">PKR {Number(c.balanceOwed).toLocaleString()} due</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Totals + payment */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span><span>PKR {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Discount</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">PKR</span>
                    <input type="number" min="0" placeholder="0" value={discount} onChange={e => setDiscount(e.target.value)}
                      className="w-24 px-2 py-1 text-sm border border-gray-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-100">
                  <span>Total</span><span>PKR {total.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment method */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">Payment Method</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map(m => (
                    <button key={m} onClick={() => setPaymentMethod(m)}
                      className={`py-1.5 px-2 text-xs font-medium rounded-lg border transition-colors ${paymentMethod === m ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {PAYMENT_LABELS[m]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount paid (for partial / cash) */}
              {(paymentMethod === 'CREDIT' || paymentMethod === 'CASH') && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">
                    {paymentMethod === 'CREDIT' ? 'Amount Paid Now' : 'Cash Received'}
                  </label>
                  <input type="number" min="0" placeholder={String(total)} value={amountPaid}
                    onChange={e => setAmountPaid(e.target.value)}
                    className={input} />
                  {paymentMethod === 'CASH' && paid > 0 && paid >= total && (
                    <div className="flex justify-between text-sm font-medium text-green-600">
                      <span>Change</span><span>PKR {change.toLocaleString()}</span>
                    </div>
                  )}
                  {paymentMethod === 'CREDIT' && paid > 0 && paid < total && (
                    <div className="flex justify-between text-sm font-medium text-red-600">
                      <span>Credit (Udhaar)</span><span>PKR {(total - paid).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {createSale.error && (
                <p className="text-xs text-red-600">
                  {(createSale.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Sale failed'}
                </p>
              )}

              <button onClick={handleCheckout}
                disabled={cart.length === 0 || createSale.isPending || (paymentMethod === 'CREDIT' && !customerId)}
                className={btn + ' w-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center gap-2 py-3'}>
                {createSale.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                Complete Sale
              </button>
              {paymentMethod === 'CREDIT' && !customerId && (
                <p className="text-xs text-center text-amber-600">Select a customer for credit sales</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoice modal after successful sale */}
      {completedSale && <InvoiceModal sale={completedSale} onClose={resetPOS} />}
    </div>
  )
}
