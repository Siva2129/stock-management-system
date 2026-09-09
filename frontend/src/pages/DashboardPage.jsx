import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../utils/api'
import { Package, Warehouse, TrendingUp, AlertTriangle, ShoppingCart, ArrowUpRight, ArrowDownRight } from 'lucide-react'

function StatCard({ label, value, icon: Icon, color, sub, prefix = '' }) {
  return (
    <div className="stat-card">
      <div className="flex-between mb-3">
        <span className="label">{label}</span>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} color={color} />
        </div>
      </div>
      <div className="value" style={{ color }}>{prefix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</div>
      {sub && <div className="change mt-1">{sub}</div>}
    </div>
  )
}

const fmtRs = v => `₹${Number(v).toLocaleString('en-IN')}`

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12.5 }}>
      <p style={{ color: 'var(--text2)', marginBottom: 4 }}>{label}</p>
      <p style={{ color: 'var(--accent)', fontWeight: 600 }}>{fmtRs(payload[0].value)}</p>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/summary').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-state"><div className="spinner spinner-lg" /><span>Loading dashboard…</span></div>
  if (!data) return null

  const txnColors = { sale: 'var(--green)', purchase: 'var(--accent)', return: 'var(--amber)', adjustment: 'var(--purple)', transfer: 'var(--cyan)' }

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back — here's your stock overview</p>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        <StatCard label="Total Products"    value={data.total_products}     icon={Package}       color="var(--accent)" />
        <StatCard label="Stock Value"       value={fmtRs(data.total_stock_value)} icon={Warehouse} color="var(--green)" />
        <StatCard label="Sales (30 days)"   value={fmtRs(data.total_sales_30d)}  icon={TrendingUp} color="var(--purple)" />
        <StatCard label="Low Stock Items"   value={data.low_stock_count}    icon={AlertTriangle} color="var(--amber)" sub={`${data.out_of_stock_count} out of stock`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Revenue chart */}
        <div className="card">
          <div className="flex-between mb-3">
            <div><div className="card-title">Monthly Revenue</div><div className="card-sub">Last 6 months sales</div></div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.monthly_chart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4f7cff" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4f7cff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'var(--text2)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fill: 'var(--text2)', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#4f7cff" strokeWidth={2} fill="url(#colorRev)" dot={{ fill: '#4f7cff', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top products */}
        <div className="card">
          <div className="card-title mb-3">Top Stock by Value</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.top_products.map((p, i) => (
              <div key={i} className="flex-between">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>{i + 1}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text2)' }}>{p.quantity} units</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>{fmtRs(p.value)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div className="card-title mb-3">Recent Transactions</div>
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Product</th><th>Type</th><th>Qty</th><th>Amount</th><th>Date</th>
            </tr></thead>
            <tbody>
              {data.recent_transactions.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 500 }}>{t.product_name}</td>
                  <td>
                    <span className="badge" style={{ background: (txnColors[t.type] || 'var(--accent)') + '22', color: txnColors[t.type] || 'var(--accent)' }}>
                      {t.type === 'sale' ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                      {t.type}
                    </span>
                  </td>
                  <td>{t.quantity}</td>
                  <td style={{ fontWeight: 600 }}>{fmtRs(t.total_amount)}</td>
                  <td className="text-muted text-sm">{new Date(t.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
