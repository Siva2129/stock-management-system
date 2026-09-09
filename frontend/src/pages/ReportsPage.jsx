import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { BarChart2, RefreshCw } from 'lucide-react'

const REPORT_TYPES = [
  { id: 'sales',    label: 'Sales Report',    emoji: '📈', desc: 'Revenue, orders, avg value for the period' },
  { id: 'stock',    label: 'Stock Report',    emoji: '📦', desc: 'Current inventory value and low stock items' },
  { id: 'supplier', label: 'Supplier Report', emoji: '🏭', desc: 'Supplier orders and total spend breakdown' },
]

const PIE_COLORS = ['#4f7cff','#22c55e','#f59e0b','#a78bfa','#22d3ee']

const fmtRs = v => `₹${Number(v || 0).toLocaleString('en-IN')}`

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', fontSize:12.5 }}>
      <p style={{ color:'var(--text2)', marginBottom:4 }}>{label || payload[0].name}</p>
      <p style={{ color:'var(--accent)', fontWeight:600 }}>{typeof payload[0].value === 'number' && payload[0].name !== 'total_orders' ? fmtRs(payload[0].value) : payload[0].value}</p>
    </div>
  )
}

export default function ReportsPage() {
  const [type, setType]     = useState('sales')
  const [days, setDays]     = useState(30)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/reports/${type}`, { params: { days } })
      setResult(data)
    } catch(e) {
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const renderSales = () => (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:14, marginBottom:20 }}>
      {[
        { label:'Total Revenue',       value: fmtRs(result.total_revenue),       color:'var(--green)' },
        { label:'Total Transactions',  value: result.total_transactions,          color:'var(--accent)' },
        { label:'Units Sold',          value: result.total_units_sold,            color:'var(--purple)' },
        { label:'Avg Order Value',     value: fmtRs(result.avg_order_value),      color:'var(--amber)' },
      ].map(s => (
        <div key={s.label} className="stat-card">
          <div className="label">{s.label}</div>
          <div className="value mt-2" style={{ color:s.color, fontSize:24 }}>{s.value}</div>
        </div>
      ))}
    </div>
  )

  const renderStock = () => (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:14, marginBottom:20 }}>
        {[
          { label:'Total Products',   value: result.total_products,          color:'var(--accent)' },
          { label:'Total Stock Value',value: fmtRs(result.total_stock_value), color:'var(--green)' },
          { label:'Low Stock Items',  value: result.low_stock_count,         color:'var(--amber)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="label">{s.label}</div>
            <div className="value mt-2" style={{ color:s.color, fontSize:24 }}>{s.value}</div>
          </div>
        ))}
      </div>
      {result.low_stock_items?.length > 0 && (
        <div className="card">
          <div className="card-title mb-3">Low Stock Items</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Product</th><th>Current Qty</th><th>Reorder Level</th><th>Gap</th></tr></thead>
              <tbody>
                {result.low_stock_items.map((item, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight:500 }}>{item.name}</td>
                    <td><span style={{ color: item.qty === 0 ? 'var(--red)' : 'var(--amber)', fontWeight:700 }}>{item.qty}</span></td>
                    <td>{item.reorder}</td>
                    <td><span className="badge badge-red">-{item.reorder - item.qty}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )

  const renderSupplier = () => (
    <div>
      <div className="stat-card mb-4" style={{ maxWidth:220 }}>
        <div className="label">Total Suppliers</div>
        <div className="value mt-2" style={{ color:'var(--accent)', fontSize:28 }}>{result.total_suppliers}</div>
      </div>
      {result.supplier_summary?.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div className="card">
            <div className="card-title mb-3">Spend by Supplier</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={result.supplier_summary} margin={{ top:5, right:10, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="supplier" tick={{ fill:'var(--text2)', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fill:'var(--text2)', fontSize:11 }} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<CustomTooltip/>} />
                <Bar dataKey="total_spend" fill="#4f7cff" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <div className="card-title mb-3">Orders by Supplier</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={result.supplier_summary} dataKey="total_orders" nameKey="supplier" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {result.supplier_summary.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip/>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <h1>Reports</h1>
        <p>Generate business insights — each report type uses a different OOP class (polymorphism)</p>
      </div>

      {/* Report selector */}
      <div className="card mb-4">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:10, marginBottom:16 }}>
          {REPORT_TYPES.map(r => (
            <button key={r.id} onClick={() => { setType(r.id); setResult(null) }}
              style={{
                background: type === r.id ? 'rgba(79,124,255,0.15)' : 'var(--bg3)',
                border: `1px solid ${type === r.id ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 10, padding:'14px 16px', cursor:'pointer', textAlign:'left', transition:'var(--transition)'
              }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{r.emoji}</div>
              <div style={{ fontWeight:600, fontSize:13.5, color: type === r.id ? 'var(--accent)' : 'var(--text)' }}>{r.label}</div>
              <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>{r.desc}</div>
            </button>
          ))}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {type === 'sales' && (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <label style={{ margin:0, whiteSpace:'nowrap' }}>Period:</label>
              <select value={days} onChange={e => setDays(+e.target.value)} style={{ width:130 }}>
                {[7,14,30,60,90].map(d => <option key={d} value={d}>Last {d} days</option>)}
              </select>
            </div>
          )}
          <button className="btn btn-primary" onClick={generate} disabled={loading}>
            {loading ? <span className="spinner"/> : <RefreshCw size={14}/>}
            {loading ? 'Generating…' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div>
          <div style={{ background:'var(--bg3)', borderRadius:8, padding:'10px 16px', marginBottom:16, display:'flex', gap:20, fontSize:12.5, color:'var(--text2)', flexWrap:'wrap' }}>
            <span>📊 <strong style={{ color:'var(--text)' }}>{result.title}</strong></span>
            <span>👤 {result.generated_by}</span>
            <span>🕐 {new Date(result.generated_at).toLocaleString('en-IN')}</span>
            {result.period_days && <span>📅 Last {result.period_days} days</span>}
          </div>
          {type === 'sales'    && renderSales()}
          {type === 'stock'    && renderStock()}
          {type === 'supplier' && renderSupplier()}
        </div>
      )}

      {!result && !loading && (
        <div className="empty-state"><BarChart2 size={48}/><p>Select a report type and click Generate</p><span>OOP polymorphism: same endpoint, different generate() per class</span></div>
      )}
    </div>
  )
}
