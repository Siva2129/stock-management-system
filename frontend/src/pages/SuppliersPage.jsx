import { useEffect, useState, useCallback } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { Plus, X, Truck, Pencil, Trash2 } from 'lucide-react'

const EMPTY = { name:'', email:'', phone:'', address:'', contact_person:'', payment_terms:'Net 30' }

function SupplierModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || EMPTY)
  useEffect(() => setForm(initial || EMPTY), [initial])
  if (!open) return null
  const set = (k,v) => setForm(p => ({ ...p, [k]: v }))
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{initial ? 'Edit Supplier' : 'Add Supplier'}</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={14}/></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(form) }}>
          <div className="modal-body">
            <div className="form-group"><label>Company Name *</label><input value={form.name} onChange={e=>set('name',e.target.value)} required /></div>
            <div className="form-row">
              <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e=>set('email',e.target.value)} /></div>
              <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e=>set('phone',e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Contact Person</label><input value={form.contact_person} onChange={e=>set('contact_person',e.target.value)} /></div>
              <div className="form-group"><label>Payment Terms</label>
                <select value={form.payment_terms} onChange={e=>set('payment_terms',e.target.value)}>
                  {['Net 15','Net 30','Net 45','Net 60','Advance','COD'].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group"><label>Address</label><textarea rows={2} value={form.address} onChange={e=>set('address',e.target.value)} /></div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Plus size={14}/>{initial ? 'Save Changes' : 'Add Supplier'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SuppliersPage() {
  const { isManager } = useAuth()
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(false)
  const [editing, setEditing]     = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/suppliers/').then(r => setSuppliers(r.data)).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async form => {
    try {
      if (editing) { await api.put(`/suppliers/${editing.id}`, form); toast.success('Supplier updated') }
      else { await api.post('/suppliers/', form); toast.success('Supplier added') }
      setModal(false); setEditing(null); load()
    } catch(e) { toast.error(e.response?.data?.detail || 'Error') }
  }

  const handleDelete = async id => {
    if (!confirm('Deactivate this supplier?')) return
    await api.delete(`/suppliers/${id}`)
    toast.success('Supplier deactivated')
    load()
  }

  return (
    <div>
      <div className="page-header flex-between">
        <div><h1>Suppliers</h1><p>Manage your supplier relationships</p></div>
        {isManager && <button className="btn btn-primary" onClick={() => { setEditing(null); setModal(true) }}><Plus size={15}/> Add Supplier</button>}
      </div>

      {loading
        ? <div className="loading-state"><div className="spinner spinner-lg"/></div>
        : suppliers.length === 0
          ? <div className="empty-state"><Truck size={48}/><p>No suppliers yet</p></div>
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {suppliers.map(s => (
                <div key={s.id} className="card">
                  <div className="flex-between mb-3">
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:40, height:40, borderRadius:10, background:'rgba(79,124,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🏭</div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:14 }}>{s.name}</div>
                        <div style={{ fontSize:11.5, color:'var(--text2)' }}>{s.contact_person}</div>
                      </div>
                    </div>
                    {isManager && (
                      <div className="flex-center gap-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(s); setModal(true) }}><Pencil size={12}/></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}><Trash2 size={12}/></button>
                      </div>
                    )}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 14px', fontSize:12.5 }}>
                    {[
                      ['📧 Email', s.email || '—'],
                      ['📞 Phone', s.phone || '—'],
                      ['💳 Terms', s.payment_terms],
                      ['📦 Orders', s.total_orders],
                    ].map(([k,v]) => (
                      <div key={k}>
                        <div style={{ color:'var(--text3)', fontSize:11, marginBottom:1 }}>{k}</div>
                        <div style={{ fontWeight:500 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:12, color:'var(--text2)' }}>Total Spend</span>
                    <span style={{ fontWeight:700, color:'var(--green)' }}>₹{s.total_spend?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          )
      }

      <SupplierModal open={modal} onClose={() => { setModal(false); setEditing(null) }} onSave={handleSave} initial={editing} />
    </div>
  )
}
