import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { LogIn, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]       = useState({ email: 'admin@stock.com', password: 'admin123' })
  const [showPw, setShowPw]   = useState(false)

  const handle = async e => {
    e.preventDefault()
    const r = await login(form.email, form.password)
    if (r.ok) { toast.success('Welcome back!'); navigate('/') }
    else toast.error(r.error)
  }

  const DEMO_USERS = [
    { label: 'Admin',   email: 'admin@stock.com',   pw: 'admin123',   emoji: '👑' },
    { label: 'Manager', email: 'manager@stock.com', pw: 'manager123', emoji: '🏪' },
    { label: 'Staff',   email: 'staff@stock.com',   pw: 'staff123',   emoji: '👷' },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: 'var(--accent)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 14px' }}>📦</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>StockFlow</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13.5, marginTop: 4 }}>Stock Management System</p>
        </div>

        {/* Form */}
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 20 }}>Sign in to your account</h2>
          <form onSubmit={handle}>
            <div className="form-group">
              <label>Email address</label>
              <input type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', marginTop: 4 }} disabled={loading}>
              {loading ? <span className="spinner" /> : <LogIn size={15} />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Demo credentials */}
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 11.5, color: 'var(--text3)', textAlign: 'center', marginBottom: 8 }}>DEMO ACCOUNTS — click to fill</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {DEMO_USERS.map(u => (
              <button key={u.email} type="button" onClick={() => setForm({ email: u.email, password: u.pw })}
                className="btn btn-secondary" style={{ flexDirection: 'column', gap: 3, padding: '10px 8px', fontSize: 12 }}>
                <span>{u.emoji}</span>
                <span style={{ fontWeight: 600 }}>{u.label}</span>
                <span style={{ color: 'var(--text3)', fontSize: 10.5 }}>{u.pw}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
