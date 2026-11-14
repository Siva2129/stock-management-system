import { useEffect, useState, useCallback } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Plus, X, ArrowLeftRight } from 'lucide-react'

const TXN_TYPES = ['purchase', 'sale', 'return', 'adjustment', 'transfer']
const COLORS = { sale: 'var(--green)', purchase: 'var(--accent)', return: 'var(--amber)', adjustment: 'var(--purple)', transfer: 'var(--cyan)' }

function TxnModal({ open, onClose, onSave, products, suppliers }) {
  const [form, setForm] = useState({ product_id: '', transaction_type: 'sale', quantity: '', unit_price: '', notes: '', supplier_id: '' })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (form.product_id) {
      const prod = products.find(p => p.id === form.product_id)
      if (prod) set('unit_price', form.transaction_type === 'purchase' ? prod.cost_price : prod.selling_price)
    }
  }, [form.product_id, form.transaction_type])

  if (!open) return null
  const total = (+form.quantity || 0) * (+form.unit_price || 0)
  const handle = e => { e.preventDefault(); onSave(form) }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">New Transaction</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={14} /></button>
        </div>
        <form onSubmit={handle}>
          <div className="modal-body">
            <div className="form-group"><label>Product *</label>
              <select value={form.product_id} onChange={e => set('product_id', e.target.value)} required>
                <option value="">Select product…</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} — {p.sku} (Stock: {p.stock_quantity})</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Transaction Type *</label>
                <select value={form.transaction_type} onChange={e => set('transaction_type', e.target.value)}>
                  {TXN_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              {['purchase'].includes(form.transaction_type) && (
                <div className="form-group"><label>Supplier</label>
                  <select value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)}>
                    <option value="">— None —</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="form-row">
              <div className="form-group"><label>Quantity *</label><input type="number" min="1" value={form.quantity} onChange={e => set('quantity', e.target.value)} required /></div>
              <div className="form-group"><label>Unit Price (₹) *</label><input type="number" min="0" step="0.01" value={form.unit_price} onChange={e => set('unit_price', e.target.value)} required /></div>
            </div>
            {form.quantity && form.unit_price && (
              <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text2)', fontSize: 13 }}>Total Amount</span>
                <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>₹{total.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="form-group"><label>Notes</label><textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional note…" /></div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Plus size={14} /> Record Transaction</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TransactionsPage() {
  const [txns, setTxns]       = useState([])
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/transactions/'),
      api.get('/products/'),
      api.get('/suppliers/'),
    ]).then(([t, p, s]) => { setTxns(t.data); setProducts(p.data); setSuppliers(s.data) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async form => {
    try {
      // product_id and supplier_id are MongoDB ObjectId strings — do NOT coerce to number
      const payload = { ...form, quantity: +form.quantity, unit_price: +form.unit_price, supplier_id: form.supplier_id || null }
      const { data } = await api.post('/transactions/', payload)
      toast.success(`Transaction recorded — Ref: ${data.reference_no}`)
      setModal(false); load()
    } catch (e) { toast.error(e.response?.data?.detail || 'Error') }
  }

  return (
    <div>
      <div className="page-header flex-between">
        <div><h1>Transactions</h1><p>Record and view stock movements</p></div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={15} /> New Transaction</button>
      </div>

      {loading
        ? <div className="loading-state"><div className="spinner spinner-lg" /></div>
        : txns.length === 0
          ? <div className="empty-state"><ArrowLeftRight size={48} /><p>No transactions yet</p></div>
          : (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Ref</th><th>Product</th><th>Type</th><th>Qty</th><th>Unit Price</th><th>Total</th><th>Notes</th><th>Date</th>
                </tr></thead>
                <tbody>
                  {txns.map(t => (
                    <tr key={t.id}>
                      <td><span className="mono badge badge-blue">{t.reference_no || `#${t.id}`}</span></td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{t.product_name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text2)' }}>{t.product_sku}</div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: (COLORS[t.transaction_type] || '#888') + '22', color: COLORS[t.transaction_type] || '#888' }}>
                          {t.transaction_type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{t.transaction_type === 'sale' ? `-${t.quantity}` : `+${t.quantity}`}</td>
                      <td>₹{t.unit_price?.toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 600 }}>₹{t.total_amount?.toLocaleString('en-IN')}</td>
                      <td className="text-muted text-sm">{t.notes || '—'}</td>
                      <td className="text-muted text-sm">{t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
      }

      <TxnModal open={modal} onClose={() => setModal(false)} onSave={handleSave} products={products} suppliers={suppliers} />
    </div>
  )
}
