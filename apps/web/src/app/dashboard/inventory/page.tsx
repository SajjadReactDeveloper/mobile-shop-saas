'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Plus, Search, Eye, PlusCircle, AlertTriangle } from 'lucide-react'
import { Button, Card, Badge, Modal, Input, Select, PageHeader, Empty, PageLoader, Table, Th, Td, Tabs } from '@/components/ui'

type ProductCategory = 'MOBILE' | 'ACCESSORY' | 'SIM' | 'CHARGER' | 'SPARE_PART' | 'OTHER'

interface Product {
  id: string; name: string; brand?: string; model?: string
  category: ProductCategory; buyingPrice: number; sellingPrice: number
  stockQty: number; imeiTracked: boolean; lowStockAlert: number
  isActive: boolean; _count?: { imeiLog: number }
}
interface ImeiLog { id: string; imei: string; status: 'IN_STOCK' | 'SOLD' | 'RETURNED'; createdAt: string }

const CAT_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'MOBILE', label: 'Mobiles' },
  { key: 'ACCESSORY', label: 'Accessories' },
  { key: 'SIM', label: 'SIMs' },
  { key: 'CHARGER', label: 'Chargers' },
  { key: 'SPARE_PART', label: 'Spare Parts' },
  { key: 'OTHER', label: 'Other' },
]

const CAT_COLOR: Record<ProductCategory, 'blue' | 'purple' | 'green' | 'orange' | 'yellow' | 'gray'> = {
  MOBILE: 'blue', ACCESSORY: 'purple', SIM: 'green',
  CHARGER: 'orange', SPARE_PART: 'yellow', OTHER: 'gray',
}

/* ─── Add Product ─── */
function AddProductModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: '', brand: '', model: '',
    category: 'MOBILE' as ProductCategory,
    buyingPrice: '', sellingPrice: '',
    stockQty: '0', imeiTracked: false, lowStockAlert: '5',
  })
  const mut = useMutation({
    mutationFn: (d: object) => api.post('/inventory', d).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['inventory'] }); onClose() },
  })
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    mut.mutate({ name: form.name, brand: form.brand || undefined, model: form.model || undefined, category: form.category, buyingPrice: Number(form.buyingPrice), sellingPrice: Number(form.sellingPrice), stockQty: Number(form.stockQty), imeiTracked: form.imeiTracked, lowStockAlert: Number(form.lowStockAlert) })
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <Input label="Product Name *" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Samsung Galaxy A15" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Brand" value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Samsung" />
        <Input label="Model" value={form.model} onChange={e => set('model', e.target.value)} placeholder="A15" />
      </div>
      <Select label="Category *" value={form.category} onChange={e => set('category', e.target.value)}>
        {CAT_TABS.filter(c => c.key !== 'ALL').map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Buying Price (PKR) *" type="number" min="0" required value={form.buyingPrice} onChange={e => set('buyingPrice', e.target.value)} placeholder="0" />
        <Input label="Selling Price (PKR) *" type="number" min="0" required value={form.sellingPrice} onChange={e => set('sellingPrice', e.target.value)} placeholder="0" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Opening Stock" type="number" min="0" value={form.stockQty} onChange={e => set('stockQty', e.target.value)} />
        <Input label="Low Stock Alert at" type="number" min="0" value={form.lowStockAlert} onChange={e => set('lowStockAlert', e.target.value)} />
      </div>
      <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
        <input type="checkbox" checked={form.imeiTracked} onChange={e => set('imeiTracked', e.target.checked)} className="w-4 h-4 mt-0.5 rounded accent-violet-600" />
        <div>
          <div className="text-sm font-semibold text-gray-800">Enable IMEI Tracking</div>
          <div className="text-xs text-gray-500 mt-0.5">For phones — each unit will require an IMEI number at stock-in</div>
        </div>
      </label>
      {mut.error && <p className="text-xs text-red-500">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Something went wrong'}</p>}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="flex-1" loading={mut.isPending}>Add Product</Button>
      </div>
    </form>
  )
}

/* ─── Add Stock ─── */
function AddStockModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ qty: '1', unitPrice: String(product.buyingPrice), supplier: '' })
  const [imeis, setImeis] = useState<string[]>([''])
  const qty = Number(form.qty) || 0
  const mut = useMutation({
    mutationFn: (d: object) => api.post(`/inventory/${product.id}/stock`, d).then(r => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['inventory'] }); onClose() },
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const setImei = (i: number, v: string) => { const n = [...imeis]; n[i] = v; setImeis(n) }
  const syncImeis = (newQty: number) => {
    if (!product.imeiTracked) return
    setImeis(arr => newQty > arr.length ? [...arr, ...Array(newQty - arr.length).fill('')] : arr.slice(0, newQty))
  }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    mut.mutate({ qty, unitPrice: Number(form.unitPrice), supplier: form.supplier || undefined, imeis: product.imeiTracked ? imeis : undefined })
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="p-3 bg-violet-50 border border-violet-100 rounded-xl flex items-center justify-between">
        <span className="text-sm font-semibold text-violet-900">{product.name}</span>
        <Badge color="blue">Stock: {product.stockQty}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Quantity *" type="number" min="1" required value={form.qty} onChange={e => { set('qty', e.target.value); syncImeis(Number(e.target.value)) }} />
        <Input label="Unit Price (PKR) *" type="number" min="0" required value={form.unitPrice} onChange={e => set('unitPrice', e.target.value)} />
      </div>
      <Input label="Supplier" value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="Optional" />
      {product.imeiTracked && qty > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">IMEI Numbers ({qty} required)</p>
          {imeis.map((imei, i) => (
            <Input key={i} value={imei} onChange={e => setImei(i, e.target.value)} placeholder={`IMEI ${i + 1}`} required />
          ))}
        </div>
      )}
      {mut.error && <p className="text-xs text-red-500">{(mut.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Something went wrong'}</p>}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="flex-1" loading={mut.isPending}>Add Stock</Button>
      </div>
    </form>
  )
}

/* ─── IMEI Viewer ─── */
function ImeiModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { data: imeis, isLoading } = useQuery<ImeiLog[]>({
    queryKey: ['imeis', product.id],
    queryFn: () => api.get(`/inventory/${product.id}/imeis`).then(r => r.data),
  })
  const COLOR: Record<string, 'green' | 'gray' | 'yellow'> = { IN_STOCK: 'green', SOLD: 'gray', RETURNED: 'yellow' }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{product.name}</p>
        <Badge color="blue">{product._count?.imeiLog ?? 0} total</Badge>
      </div>
      {isLoading ? <PageLoader /> : imeis?.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No IMEIs registered yet</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {imeis?.map(log => (
            <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-sm font-mono text-gray-800">{log.imei}</span>
              <Badge color={COLOR[log.status] ?? 'gray'}>{log.status.replace('_', ' ')}</Badge>
            </div>
          ))}
        </div>
      )}
      <Button variant="secondary" className="w-full" onClick={onClose}>Close</Button>
    </div>
  )
}

/* ─── Main ─── */
export default function InventoryPage() {
  const [category, setCategory] = useState('ALL')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'add' | 'stock' | 'imei' | null>(null)
  const [selected, setSelected] = useState<Product | null>(null)

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['inventory', category],
    queryFn: () => api.get(`/inventory${category !== 'ALL' ? `?category=${category}` : ''}`).then(r => r.data),
  })

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const totalValue = products.reduce((s, p) => s + Number(p.sellingPrice) * p.stockQty, 0)
  const lowCount = products.filter(p => p.stockQty <= p.lowStockAlert).length
  const closeModal = () => { setModal(null); setSelected(null) }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventory"
        subtitle={`${products.length} products · PKR ${totalValue.toLocaleString()} stock value`}
        action={<Button onClick={() => setModal('add')}><Plus className="w-4 h-4" /> Add Product</Button>}
      />

      {lowCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span><strong>{lowCount}</strong> product{lowCount > 1 ? 's are' : ' is'} below low-stock threshold</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            placeholder="Search products…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <Tabs tabs={CAT_TABS} active={category} onChange={setCategory} />
        </div>
      </div>

      <Card padding={false}>
        {isLoading ? <PageLoader /> : filtered.length === 0 ? (
          <Empty icon="📦" title="No products yet" desc="Add your first product to start tracking inventory."
            action={<Button onClick={() => setModal('add')}><Plus className="w-4 h-4" /> Add Product</Button>} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>Category</Th>
                <Th className="text-right">Buy Price</Th>
                <Th className="text-right">Sell Price</Th>
                <Th className="text-right">Stock</Th>
                <Th className="text-center">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const isLow = p.stockQty <= p.lowStockAlert
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <Td>
                      <div className="font-semibold text-gray-900">{p.name}</div>
                      {(p.brand || p.model) && <div className="text-xs text-gray-400">{[p.brand, p.model].filter(Boolean).join(' · ')}</div>}
                      {p.imeiTracked && <span className="text-xs text-violet-600 font-medium">IMEI tracked</span>}
                    </Td>
                    <Td><Badge color={CAT_COLOR[p.category]}>{p.category.replace('_', ' ')}</Badge></Td>
                    <Td className="text-right text-gray-500">PKR {Number(p.buyingPrice).toLocaleString()}</Td>
                    <Td className="text-right font-semibold">PKR {Number(p.sellingPrice).toLocaleString()}</Td>
                    <Td className="text-right">
                      <span className={`font-bold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>{p.stockQty}</span>
                      {isLow && <span className="ml-1 text-xs text-red-400">low</span>}
                    </Td>
                    <Td>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setSelected(p); setModal('stock') }} title="Add Stock"
                          className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                          <PlusCircle className="w-4 h-4" />
                        </button>
                        {p.imeiTracked && (
                          <button onClick={() => { setSelected(p); setModal('imei') }} title="View IMEIs"
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={modal === 'add'} onClose={closeModal} title="Add Product">
        <AddProductModal onClose={closeModal} />
      </Modal>
      <Modal open={modal === 'stock' && !!selected} onClose={closeModal} title="Add Stock">
        {selected && <AddStockModal product={selected} onClose={closeModal} />}
      </Modal>
      <Modal open={modal === 'imei' && !!selected} onClose={closeModal} title="IMEI Log">
        {selected && <ImeiModal product={selected} onClose={closeModal} />}
      </Modal>
    </div>
  )
}
