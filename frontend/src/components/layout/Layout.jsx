import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useEffect, useState } from 'react'
import api from '../../utils/api'
import {
  LayoutDashboard, Package, Warehouse, ArrowLeftRight,
  Truck, BarChart2, Users, LogOut, Bell
} from 'lucide-react'

const NAV = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard',    section: 'MAIN' },
  { to: '/products',    icon: Package,         label: 'Products',     section: 'MAIN' },
  { to: '/inventory',   icon: Warehouse,       label: 'Inventory',    section: 'MAIN' },
  { to: '/transactions',icon: ArrowLeftRight,  label: 'Transactions', section: 'MAIN' },
  { to: '/suppliers',   icon: Truck,           label: 'Suppliers',    section: 'MANAGE' },
  { to: '/reports',     icon: BarChart2,       label: 'Reports',      section: 'MANAGE' },
  { to: '/users',       icon: Users,           label: 'Users',        section: 'MANAGE', adminOnly: true },
]

export default function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const location = useLocation()
  const [alerts, setAlerts] = useState(0)

  useEffect(() => {
    api.get('/inventory/alerts/').then(r => setAlerts(r.data.length)).catch(() => {})
  }, [location.pathname])

  const sections = [...new Set(NAV.map(n => n.section))]

  const currentPage = NAV.find(n => n.to === location.pathname)?.label || 'StockFlow'

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">📦</div>
          <div>
            <div className="logo-text">StockFlow</div>
            <div className="logo-sub">Management System</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sections.map(section => {
            const items = NAV.filter(n => n.section === section && (!n.adminOnly || isAdmin))
            if (!items.length) return null
            return (
              <div className="nav-section" key={section}>
                <div className="nav-section-label">{section}</div>
                {items.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  >
                    <Icon size={16} />
                    {label}
                    {label === 'Inventory' && alerts > 0 && (
                      <span className="nav-badge">{alerts}</span>
                    )}
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-pill">
            <div className="avatar">{user?.avatar || '👤'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="uname" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div className="urole">{user?.role}</div>
            </div>
            <button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: '4px' }}>
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <span className="topbar-title">{currentPage}</span>
          <div className="flex-center gap-2">
            {alerts > 0 && (
              <NavLink to="/inventory" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--red-bg)', color: 'var(--red)', padding: '5px 12px', borderRadius: 99, fontSize: 12.5, fontWeight: 500, textDecoration: 'none' }}>
                <Bell size={13} /> {alerts} alert{alerts !== 1 ? 's' : ''}
              </NavLink>
            )}
          </div>
        </header>
        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
