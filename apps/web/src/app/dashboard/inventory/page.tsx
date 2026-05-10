'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  Package, Plus, Search, Eye, PlusCircle,
  AlertTriangle, ChevronDown, X, Loader2,
} from 'lucide-react'

type ProductCategory = 'MOBILE' | 'ACCESSORY' | 'SIM' | 'CHARGER' | 'SPARE_PART' | 'OTHER'

interface Product {
  id: string
  name: string
  brand?: string
  model?: string
  category: ProductCategory
  buyingPrice: number
  sellingPrice: number
  stockQty: number
  imeiTracked: boolean
  lowStockAlert: number
  isActive: boolean
  _count?: { imeiLog: number }
}

interface ImeiLog {
  id: string
  imei: string
  status: 'IN_STOCK' | 'SOLD' | 'RETURNED'
  createdAt: string
}

const CATEGORIES: { value: ProductCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'MOBILE', label: 'Mobiles' },
  { value: 'ACCESSORY', label: 'Accessories' },
  { value: 'SIM', label: 'SIMs' },
  { value: 'CHARGER', label: 'Chargers' },
  { value: 'SPARE_PART', label: 'Spare Parts' },
  { value: 'OTHER', label: 'Other' },
]

const CATEGORY_COLORS: Record<ProductCategory, string> = {
  MOBILE: 'bg-blue-100 text-blue-700',
  ACCESSORY: 'bg-purple-100 text-purple-700',
  SIM: 'bg-green-100 text-green-700',
  CHARGER: 'bg-orange-100 text-orange-700',
  SPARE_PART: 'bg-yellow-100 text-yellow-700',
  OTHER: 'bg-gray-100 text-gray-700',
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-base">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  )
}

const input = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
const btn = 'px-4 py-2 text-sm font-medium rounded-lg transition-colors'

// ─── Add Product Modal ──────────────────────────────────────────────────────

function AddProductModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: '', brand: '', model: '',
    category: 'MOBILE' as ProductCategory,
    buyingPrice: '', sellingPrice: '',
    stockQty: '0', imeiTracked: false, lowStockAlert: '5',
  })

  const mut = useMutation({
    mutationFn: (data: object) => api.post('/inventory', data).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['inventory'] }); onClose() },
  })

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    mut.mutate({
      name: form.name,
      brand: form.brand || undefined,
      model: form.model || undefined,
      category: form.category,
      buyingPrice: Number(form.buyingPrice),
      sellingPrice: Number(form.sellingPrice),
      stockQty: Number(form.stockQty),
      imeiTracked: form.imeiTracked,
      lowStockAlert: Number(form.lowStockAlert),
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Product Name *">
        <input className={input} required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Samsung Galaxy A15" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Brand">
          <input className={input} value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Samsung" />
        </Field>
        <Field label="Model">
          <input className={input} value={form.model} onChange={e => set('model', e.target.value)} placeholder="A15" />
        </Field>
      </div>
      <Field label="Category *">
        <div className="relative">
          <select className={input + ' appearance-none pr-8'} value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.filter(c => c.value !== 'ALL').map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Buying Price (PKR) *">
          <input className={input} type="number" min="0" required value={form.buyingPrice} onChange={e => set('buyingPrice', e.target.value)} placeholder="0" />
        </Field>
        <Field label="Selling Price (PKR) *">
          <input className={input} type="number" min="0" required value={form.sellingPrice} onChange={e => set('sellingPrice', e.target.value)} placeholder="0" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Opening Stock">
          <input className={input} type="number" min="0" value={form.stockQty} onChange={e => set('stockQty', e.target.value)} />
        </Field>
        <Field label="Low Stock Alert">
          <input className={input} type="number" min="0" value={form.lowStockAlert} onChange={e => set('lowStockAlert', e.target.value)} />
        </Field>
      </div>
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={form.imeiTracked} onChange={e => set('imeiTracked', e.target.checked)} className="w-4 h-4 rounded accent-blue-600" />
        <div>
          <div className="text-sm font-medium text-gray-800">IMEI Tracking</div>
          <div className="text-xs text-gray-500">Enable for phones — each unit needs an IMEI number</div>
        </div>
      </label>
      {mut.error && <p className="text-xs text-red-600">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Something went wrong'}</p>}
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onClose} className={btn + ' flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200'}>Cancel</button>
        <button type="submit" disabled={mut.isPending} className={btn + ' flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2'}>
          {mut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Add Product
        </button>
      </div>
    </form>
  )
}

// ─── Add Stock Modal ────────────────────────────────────────────────────────

function AddStockModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ qty: '1', unitPrice: String(product.buyingPrice), supplier: '' })
  const [imeis, setImeis] = useState<string[]>([''])

  const qty = Number(form.qty) || 0

  const mut = useMutation({
    mutationFn: (data: object) => api.post(`/inventory/${product.id}/stock`, data).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['inventory'] }); onClose() },
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const setImei = (i: number, v: string) => {
    const next = [...imeis]
    next[i] = v
    setImeis(next)
  }

  const syncImeiFields = (newQty: number) => {
    if (!product.imeiTracked) return
    setImeis(arr => {
      if (newQty > arr.length) return [...arr, ...Array(newQty - arr.length).fill('')]
      return arr.slice(0, newQty)
    })
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    mut.mutate({
      qty,
      unitPrice: Number(form.unitPrice),
      supplier: form.supplier || undefined,
      imeis: product.imeiTracked ? imeis : undefined,
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="p-3 bg-gray-50 rounded-lg text-sm">
        <span className="font-medium text-gray-800">{product.name}</span>
        <span className="text-gray-500 ml-2">Current stock: {product.stockQty}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Quantity *">
          <input className={input} type="number" min="1" required value={form.qty}
            onChange={e => { set('qty', e.target.value); syncImeiFields(Number(e.target.value)) }} />
        </Field>
        <Field label="Unit Price (PKR) *">
          <input className={input} type="number" min="0" required value={form.unitPrice} onChange={e => set('unitPrice', e.target.value)} />
        </Field>
      </div>
      <Field label="Supplier">
        <input className={input} value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="Optional" />
      </Field>
      {product.imeiTracked && qty > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">IMEI Numbers ({imeis.length} required)</label>
          {imeis.map((imei, i) => (
            <input key={i} className={input} value={imei} onChange={e => setImei(i, e.target.value)}
              placeholder={`IMEI ${i + 1}`} required />
          ))}
        </div>
      )}
      {mut.error && <p className="text-xs text-red-600">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Something went wrong'}</p>}
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onClose} className={btn + ' flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200'}>Cancel</button>
        <button type="submit" disabled={mut.isPending} className={btn + ' flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2'}>
          {mut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Add Stock
        </button>
      </div>
    </form>
  )
}

// ─── IMEI Viewer Modal ──────────────────────────────────────────────────────

function ImeiModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { data: imeis, isLoading } = useQuery<ImeiLog[]>({
    queryKey: ['imeis', product.id],
    queryFn: () => api.get(`/inventory/${product.id}/imeis`).then(r => r.data),
  })

  const statusColors = { IN_STOCK: 'bg-green-100 text-green-700', SOLD: 'bg-gray-100 text-gray-600', RETURNED: 'bg-yellow-100 text-yellow-700' }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 font-medium">{product.name} — {product._count?.imeiLog ?? 0} total units</p>
      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
      ) : imeis?.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No IMEIs registered yet</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {imeis?.map(log => (
            <div key={log.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-mono text-gray-800">{log.imei}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[log.status]}`}>{log.status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      )}
      <button onClick={onClose} className={btn + ' w-full bg-gray-100 text-gray-700 hover:bg-gray-200 mt-2'}>Close</button>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [category, setCategory] = useState<ProductCategory | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'add' | 'stock' | 'imei' | null>(null)
  const [selected, setSelected] = useState<Product | null>(null)

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['inventory', category],
    queryFn: () => {
      const params = category !== 'ALL' ? `?category=${category}` : ''
      return api.get(`/inventory${params}`).then(r => r.data)
    },
  })

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const openStock = (p: Product) => { setSelected(p); setModal('stock') }
  const openImei = (p: Product) => { setSelected(p); setModal('imei') }
  const closeModal = () => { setModal(null); setSelected(null) }

  const totalValue = products.reduce((s, p) => s + Number(p.sellingPrice) * p.stockQty, 0)
  const lowStockCount = products.filter(p => p.stockQty <= p.lowStockAlert).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">{products.length} products · PKR {totalValue.toLocaleString()} stock value</p>
        </div>
        <button onClick={() => setModal('add')} className={btn + ' bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2'}>
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Alerts */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
          <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0" />
          <span><strong>{lowStockCount}</strong> product{lowStockCount > 1 ? 's are' : ' is'} below the low-stock threshold</span>
        </div>
      )}

      {/* Search + Category filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input className={input + ' pl-9'} placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setCategory(c.value)}
              className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${category === c.value ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No products found</p>
            <button onClick={() => setModal('add')} className={btn + ' bg-blue-600 text-white hover:bg-blue-700 mt-3 flex items-center gap-2 mx-auto'}>
              <Plus className="w-4 h-4" /> Add your first product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">Product</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Category</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-right">Buy</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-right">Sell</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-right">Stock</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p => {
                  const isLow = p.stockQty <= p.lowStockAlert
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{p.name}</div>
                        {(p.brand || p.model) && (
                          <div className="text-xs text-gray-400">{[p.brand, p.model].filter(Boolean).join(' · ')}</div>
                        )}
                        {p.imeiTracked && (
                          <span className="text-xs text-blue-600 font-medium">IMEI tracked</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[p.category]}`}>
                          {p.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">PKR {Number(p.buyingPrice).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">PKR {Number(p.sellingPrice).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                          {p.stockQty}
                        </span>
                        {isLow && <span className="ml-1 text-xs text-red-400">low</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => openStock(p)} title="Add Stock"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <PlusCircle className="w-4 h-4" />
                          </button>
                          {p.imeiTracked && (
                            <button onClick={() => openImei(p)} title="View IMEIs"
                              className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === 'add' && (
        <Modal title="Add Product" onClose={closeModal}>
          <AddProductModal onClose={closeModal} />
        </Modal>
      )}
      {modal === 'stock' && selected && (
        <Modal title="Add Stock" onClose={closeModal}>
          <AddStockModal product={selected} onClose={closeModal} />
        </Modal>
      )}
      {modal === 'imei' && selected && (
        <Modal title="IMEI Log" onClose={closeModal}>
          <ImeiModal product={selected} onClose={closeModal} />
        </Modal>
      )}
    </div>
  )
}
