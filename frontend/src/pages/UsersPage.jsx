import { useEffect, useState, useCallback } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { Plus, X, Users, Trash2 } from 'lucide-react'

const ROLES = ['admin','manager','staff']
const AVATARS = ['👑','🏪','👷','👤','🧑‍💼','👩‍💼','🧑‍🔧','👩‍🔧']
const ROLE_COLORS = { admin:'var(--red)', manager:'var(--accent)', staff:'var(--green)' }
const ROLE_DESC   = { admin:'Full system access', manager:'Manage stock & suppliers', staff:'View & record transactions' }

function UserModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', role:'staff', avatar:'👤' })
  if (!open) return null
  const set = (k,v) => setForm(p => ({ ...p, [k]: v }))
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">Add User</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={14}/></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(form) }}>
          <div className="modal-body">
            <div className="form-group">
              <label>Avatar</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {AVATARS.map(a => (
                  <button key={a} type="button"
                    onClick={() => set('avatar', a)}
                    style={{ width:36, height:36, borderRadius:8, border:`2px solid ${form.avatar===a ? 'var(--accent)' : 'var(--border)'}`, background:'var(--bg3)', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Full Name *</label><input value={form.name} onChange={e=>set('name',e.target.value)} required /></div>
              <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e=>set('phone',e.target.value)} /></div>
            </div>
            <div className="form-group"><label>Email *</label><input type="email" value={form.email} onChange={e=>set('email',e.target.value)} required /></div>
            <div className="form-group"><label>Password *</label><input type="password" value={form.password} onChange={e=>set('password',e.target.value)} required minLength={6} /></div>
            <div className="form-group"><label>Role</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:4 }}>
                {ROLES.map(r => (
                  <button key={r} type="button" onClick={() => set('role', r)}
                    style={{ padding:'10px 8px', borderRadius:8, border:`2px solid ${form.role===r ? ROLE_COLORS[r] : 'var(--border)'}`, background: form.role===r ? ROLE_COLORS[r]+'22' : 'var(--bg3)', cursor:'pointer', textAlign:'center' }}>
                    <div style={{ fontWeight:600, fontSize:13, color: form.role===r ? ROLE_COLORS[r] : 'var(--text)', textTransform:'capitalize' }}>{r}</div>
                    <div style={{ fontSize:10.5, color:'var(--text2)', marginTop:2 }}>{ROLE_DESC[r]}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Plus size={14}/> Create User</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const { isAdmin, user: me } = useAuth()
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/users/').then(r => setUsers(r.data)).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async form => {
    try {
      await api.post('/users/register', form)
      toast.success('User created')
      setModal(false); load()
    } catch(e) { toast.error(e.response?.data?.detail || 'Error') }
  }

  const handleDelete = async id => {
    if (id === me?.id) { toast.error("You can't delete yourself"); return }
    if (!confirm('Delete this user?')) return
    await api.delete(`/users/${id}`)
    toast.success('User deleted'); load()
  }

  if (!isAdmin) return (
    <div className="empty-state" style={{ paddingTop:80 }}>
      <Users size={48}/>
      <p>Admin access required</p>
      <span>Only admins can manage users</span>
    </div>
  )

  return (
    <div>
      <div className="page-header flex-between">
        <div><h1>Users</h1><p>Manage team access and roles</p></div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={15}/> Add User</button>
      </div>

      {/* OOP note */}
      <div style={{ background:'rgba(167,139,250,0.08)', border:'1px solid rgba(167,139,250,0.2)', borderRadius:10, padding:'12px 16px', marginBottom:20, fontSize:12.5, color:'var(--purple)' }}>
        🎓 <strong>OOP Inheritance in action:</strong> AdminUser, ManagerUser, StaffUser all extend BaseUser. Each returns different <code style={{background:'rgba(0,0,0,0.3)', padding:'1px 5px', borderRadius:4}}>get_permissions()</code> — polymorphism at work.
      </div>

      {loading
        ? <div className="loading-state"><div className="spinner spinner-lg"/></div>
        : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:14 }}>
            {users.map(u => (
              <div key={u.id} className="card" style={{ position:'relative' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                  <div style={{ width:46, height:46, borderRadius:12, background:ROLE_COLORS[u.role]+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{u.avatar}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:14 }}>{u.name} {u.id === me?.id && <span style={{ fontSize:10, color:'var(--text3)' }}>(you)</span>}</div>
                    <div style={{ fontSize:12, color:'var(--text2)' }}>{u.email}</div>
                  </div>
                  {u.id !== me?.id && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}><Trash2 size={12}/></button>
                  )}
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span className="badge" style={{ background:ROLE_COLORS[u.role]+'22', color:ROLE_COLORS[u.role], textTransform:'capitalize' }}>{u.role}</span>
                  <span style={{ fontSize:11.5, color:'var(--text3)' }}>
                    {u.is_active ? <span className="text-green">● Active</span> : <span className="text-red">● Inactive</span>}
                  </span>
                </div>
                <div style={{ marginTop:10, fontSize:11.5, color:'var(--text3)' }}>
                  {ROLE_DESC[u.role]}
                </div>
              </div>
            ))}
          </div>
        )
      }

      <UserModal open={modal} onClose={() => setModal(false)} onSave={handleSave} />
    </div>
  )
}
