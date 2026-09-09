import { useEffect, useState, useCallback } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Warehouse, Bell, CheckCheck } from 'lucide-react'

export default function InventoryPage() {
  const [inventory, setInventory] = useState([])
  const [alerts, setAlerts]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [tab, setTab]             = useState('inventory')

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([api.get('/inventory/'), api.get('/inventory/alerts/')])
      .then(([inv, al]) => { setInventory(inv.data); setAlerts(al.data) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const markRead = async id => {
    await api.patch(`/inventory/alerts/${id}/read`)
    toast.success('Alert dismissed')
    load()
  }

  const filtered = inventory.filter(i =>
    i.product_name.toLowerCase().includes(search.toLowerCase()) ||
    i.product_sku.toLowerCase().includes(search.toLowerCase())
  )

  const statusBadge = s => ({
    ok:  <span className="badge badge-green">OK</span>,
    low: <span className="badge badge-amber">Low</span>,
    out: <span className="badge badge-red">Out</span>,
  }[s])

  const alertColor = l => ({ low: 'var(--amber)', critical: 'var(--red)', out_of_stock: 'var(--red)' }[l] || 'var(--amber)')

  return (
    <div>
      <div className="page-header flex-between">
        <div><h1>Inventory</h1><p>Real-time stock levels across all products</p></div>
        <div className="flex-center gap-2">
          <button className={`btn ${tab === 'inventory' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setTab('inventory')}><Warehouse size={13} /> Stock Levels</button>
          <button className={`btn ${tab === 'alerts' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setTab('alerts')}>
            <Bell size={13} /> Alerts {alerts.length > 0 && <span style={{ background: 'var(--red)', color: '#fff', borderRadius: 99, padding: '1px 6px', fontSize: 10.5, fontWeight: 600 }}>{alerts.length}</span>}
          </button>
        </div>
      </div>

      {tab === 'inventory' && (
        <>
          {/* Summary cards */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
            {[
              { label: 'Total Items', value: inventory.length, color: 'var(--accent)' },
              { label: 'Low Stock',   value: inventory.filter(i => i.status === 'low').length,  color: 'var(--amber)' },
              { label: 'Out of Stock',value: inventory.filter(i => i.status === 'out').length,  color: 'var(--red)' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="label">{s.label}</div>
                <div className="value" style={{ color: s.color, fontSize: 28, fontWeight: 700, marginTop: 6 }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <input placeholder="Search product name or SKU…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
          </div>

          {loading ? <div className="loading-state"><div className="spinner spinner-lg" /></div>
          : filtered.length === 0 ? <div className="empty-state"><Warehouse size={48} /><p>No inventory records</p></div>
          : (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Product</th><th>SKU</th><th>Qty</th><th>Reserved</th><th>Warehouse</th><th>Location</th><th>Stock Value</th><th>Reorder</th><th>Status</th>
                </tr></thead>
                <tbody>
                  {filtered.map(inv => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 500 }}>{inv.product_name}</td>
                      <td><span className="mono badge badge-blue">{inv.product_sku}</span></td>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: 15, color: inv.status === 'ok' ? 'var(--text)' : inv.status === 'low' ? 'var(--amber)' : 'var(--red)' }}>{inv.quantity}</span>
                      </td>
                      <td className="text-muted">{inv.reserved_qty}</td>
                      <td className="text-sm">{inv.warehouse}</td>
                      <td className="text-sm text-muted">{inv.location || '—'}</td>
                      <td style={{ fontWeight: 600 }}>₹{inv.stock_value?.toLocaleString('en-IN')}</td>
                      <td className="text-muted text-sm">{inv.reorder_level}</td>
                      <td>{statusBadge(inv.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'alerts' && (
        <div>
          {alerts.length === 0
            ? <div className="empty-state" style={{ padding: 60 }}><Bell size={48} /><p>No active alerts</p><span>All stock levels are healthy</span></div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {alerts.map(a => (
                  <div key={a.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderLeft: `3px solid ${alertColor(a.level)}` }}>
                    <Bell size={16} style={{ color: alertColor(a.level), flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.product_name}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text2)', marginTop: 2 }}>{a.message}</div>
                    </div>
                    <span className="badge" style={{ background: alertColor(a.level) + '22', color: alertColor(a.level) }}>{a.level.replace('_', ' ')}</span>
                    <button className="btn btn-secondary btn-sm" onClick={() => markRead(a.id)}><CheckCheck size={13} /> Dismiss</button>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}
    </div>
  )
}
