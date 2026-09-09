import { useEffect, useState, useCallback } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { Plus, Search, Pencil, Trash2, X, Package } from 'lucide-react'

const EMPTY = { name:'', sku:'', description:'', category_id:'', product_type:'physical', unit:'pcs', cost_price:'', selling_price:'', reorder_level:10, supplier_id:'' }

function ProductModal({ open, onClose, onSave, initial, categories, suppliers }) {
  const [form, setForm] = useState(initial || EMPTY)
  useEffect(() => setForm(initial || EMPTY), [initial])
  if (!open) return null
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const handle = async e => {
    e.preventDefault()
    await onSave(form)
  }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{initial ? 'Edit Product' : 'Add Product'}</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={14} /></button>
        </div>
        <form onSubmit={handle}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group"><label>Product Name *</label><input value={form.name} onChange={e => set('name', e.target.value)} required /></div>
              <div className="form-group"><label>SKU *</label><input value={form.sku} onChange={e => set('sku', e.target.value)} required placeholder="ELEC-001" /></div>
            </div>
            <div className="form-group"><label>Description</label><textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></div>
            <div className="form-row">
              <div className="form-group"><label>Category</label>
                <select value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                  <option value="">— None —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Supplier</label>
                <select value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)}>
                  <option value="">— None —</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Type</label>
                <select value={form.product_type} onChange={e => set('product_type', e.target.value)}>
                  <option value="physical">Physical</option>
                  <option value="digital">Digital</option>
                  <option value="service">Service</option>
                </select>
              </div>
              <div className="form-group"><label>Unit</label>
                <select value={form.unit} onChange={e => set('unit', e.target.value)}>
                  {['pcs','kg','g','l','ml','box','pack','set','pair'].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Cost Price (₹) *</label><input type="number" min="0" step="0.01" value={form.cost_price} onChange={e => set('cost_price', e.target.value)} required /></div>
              <div className="form-group"><label>Selling Price (₹) *</label><input type="number" min="0" step="0.01" value={form.selling_price} onChange={e => set('selling_price', e.target.value)} required /></div>
            </div>
            <div className="form-group" style={{ maxWidth: 200 }}><label>Reorder Level</label><input type="number" min="0" value={form.reorder_level} onChange={e => set('reorder_level', e.target.value)} /></div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Plus size={14} /> {initial ? 'Save Changes' : 'Add Product'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const { isManager } = useAuth()
  const [products, setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterStock, setFilterStock] = useState(false)
  const [modal, setModal]         = useState(false)
  const [editing, setEditing]     = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/products/', { params: { search: search || undefined, category_id: filterCat || undefined, low_stock: filterStock || undefined } }),
      api.get('/products/categories/all'),
      api.get('/suppliers/'),
    ]).then(([p, c, s]) => {
      setProducts(p.data); setCategories(c.data); setSuppliers(s.data)
    }).finally(() => setLoading(false))
  }, [search, filterCat, filterStock])

  useEffect(() => { load() }, [load])

  const handleSave = async form => {
    try {
      const payload = { ...form, category_id: form.category_id || null, supplier_id: form.supplier_id || null, cost_price: +form.cost_price, selling_price: +form.selling_price, reorder_level: +form.reorder_level }
      if (editing) { await api.put(`/products/${editing.id}`, payload); toast.success('Product updated') }
      else { await api.post('/products/', payload); toast.success('Product created') }
      setModal(false); setEditing(null); load()
    } catch (e) { toast.error(e.response?.data?.detail || 'Error saving product') }
  }

  const handleDelete = async id => {
    if (!confirm('Deactivate this product?')) return
    await api.delete(`/products/${id}`)
    toast.success('Product deactivated')
    load()
  }

  const statusBadge = s => ({
    ok:  <span className="badge badge-green">In Stock</span>,
    low: <span className="badge badge-amber">Low Stock</span>,
    out: <span className="badge badge-red">Out of Stock</span>,
  }[s] || null)

  return (
    <div>
      <div className="page-header flex-between">
        <div><h1>Products</h1><p>Manage your product catalog</p></div>
        {isManager && <button className="btn btn-primary" onClick={() => { setEditing(null); setModal(true) }}><Plus size={15} /> Add Product</button>}
      </div>

      {/* Filters */}
      <div className="card mb-4" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
            <Search size={14} className="search-icon" />
            <input placeholder="Search name or SKU…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ width: 160 }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className={`btn ${filterStock ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setFilterStock(p => !p)}>
            {filterStock ? '✓ ' : ''}Low Stock Only
          </button>
        </div>
      </div>

      {loading
        ? <div className="loading-state"><div className="spinner spinner-lg" /></div>
        : products.length === 0
          ? <div className="empty-state"><Package size={48} /><p>No products found</p><span>Add your first product to get started</span></div>
          : (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Product</th><th>SKU</th><th>Category</th><th>Stock</th><th>Cost</th><th>Price</th><th>Margin</th><th>Status</th>
                  {isManager && <th>Actions</th>}
                </tr></thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{p.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text2)' }}>{p.unit} · {p.product_type}</div>
                      </td>
                      <td><span className="mono badge badge-blue">{p.sku}</span></td>
                      <td>
                        {p.category_name
                          ? <span className="badge" style={{ background: (p.category_color || '#888') + '22', color: p.category_color || '#888' }}>{p.category_name}</span>
                          : <span className="text-muted text-sm">—</span>}
                      </td>
                      <td style={{ fontWeight: 600 }}>{p.stock_quantity}</td>
                      <td>₹{p.cost_price?.toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 600 }}>₹{p.selling_price?.toLocaleString('en-IN')}</td>
                      <td><span className="text-green">{p.margin_pct}%</span></td>
                      <td>{statusBadge(p.stock_status)}</td>
                      {isManager && (
                        <td>
                          <div className="flex-center gap-2">
                            <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(p); setModal(true) }}><Pencil size={12} /></button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
      }

      <ProductModal open={modal} onClose={() => { setModal(false); setEditing(null) }} onSave={handleSave} initial={editing} categories={categories} suppliers={suppliers} />
    </div>
  )
}
