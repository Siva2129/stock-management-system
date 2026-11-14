import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import './RegisterPage.css'

const ROLES = [
  { value: 'staff',   label: 'Staff',   icon: '👤' },
  { value: 'manager', label: 'Manager', icon: '🧑‍💼' },
  { value: 'admin',   label: 'Admin',   icon: '🛡️' },
]

export default function RegisterPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name:     '',
    email:    '',
    password: '',
    phone:    '',
    role:     'staff',
    avatar:   '👤',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [success, setSuccess]           = useState('')

  const handleChange = e => {
    setError('')
    setSuccess('')
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  const handleRoleSelect = role => {
    setForm(p => ({ ...p, role }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Basic validation
    if (!form.name.trim())     return setError('Name is required.')
    if (!form.email.trim())    return setError('Email is required.')
    if (!form.password)        return setError('Password is required.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')

    setLoading(true)
    try {
      await api.post('/users/register', {
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        phone:    form.phone.trim(),
        role:     form.role,
        avatar:   ROLES.find(r => r.value === form.role)?.icon || '👤',
      })

      setSuccess(`✓ Account created for ${form.name}! Redirecting to login…`)
      setForm({ name: '', email: '', password: '', phone: '', role: 'staff', avatar: '👤' })

      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page">
      {/* decorative grid overlay */}
      <div className="register-bg-grid" aria-hidden="true" />

      <div className="register-card">

        {/* Icon badge */}
        <div className="register-icon-badge" aria-hidden="true">📦</div>

        <h1>Create Account</h1>
        <p className="register-subtitle">Add a new user to StockFlow</p>

        {/* Admin-only notice */}
        <div className="register-admin-notice">
          <span>🔒</span>
          Admin credentials required to create accounts
        </div>

        <form className="register-form" onSubmit={handleSubmit} noValidate>

          {/* Error / Success banners */}
          {error   && <div className="register-error"   role="alert">⚠ {error}</div>}
          {success && <div className="register-success" role="status">✓ {success}</div>}

          {/* Full name */}
          <div className="input-group">
            <label htmlFor="reg-name">Full Name</label>
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input
                id="reg-name"
                type="text"
                name="name"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="input-group">
            <label htmlFor="reg-email">Email</label>
            <div className="input-wrapper">
              <span className="input-icon">✉</span>
              <input
                id="reg-email"
                type="email"
                name="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Phone (optional) */}
          <div className="input-group">
            <label htmlFor="reg-phone">Phone <span style={{ opacity: 0.5 }}>(optional)</span></label>
            <div className="input-wrapper">
              <span className="input-icon">📱</span>
              <input
                id="reg-phone"
                type="tel"
                name="phone"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Password */}
          <div className="input-group">
            <label htmlFor="reg-password">Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔑</span>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Role selector */}
          <div className="input-group">
            <label>Role</label>
            <div className="register-role-row">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  className={`register-role-btn${form.role === r.value ? ' active' : ''}`}
                  onClick={() => handleRoleSelect(r.value)}
                >
                  {r.icon} {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            id="register-submit-btn"
            type="submit"
            className="register-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="btn-spinner" />
                Creating Account…
              </>
            ) : (
              <>✨ Create Account</>
            )}
          </button>

        </form>

        <div className="register-divider">or</div>

        <div className="login-link">
          Already have an account?
          <button type="button" onClick={() => navigate('/login')}>
            Sign in
          </button>
        </div>

      </div>
    </div>
  )
}