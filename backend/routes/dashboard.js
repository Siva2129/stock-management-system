/**
 * routes/dashboard.js
 * GET /api/dashboard/summary — Full dashboard summary
 *   - Total active products
 *   - Total stock value, low/out-of-stock counts
 *   - Sales & purchases last 30 days
 *   - Unread alert count
 *   - Monthly chart (last 6 months)
 *   - Recent transactions (last 8)
 *   - Top 5 products by stock value
 */

const express = require('express');
const mongoose = require('mongoose');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const db = () => mongoose.connection;

router.get('/summary', authenticate, async (req, res) => {
  try {
    // Total active products
    const totalProducts = await db().collection('products').countDocuments({ is_active: true });

    // Stock value + low/out counts
    const invRows = await db().collection('inventory').find({}).toArray();
    let totalStockValue = 0;
    let lowStockCount   = 0;
    let outOfStockCount = 0;

    for (const inv of invRows) {
      const prod = await db().collection('products').findOne({ _id: inv.product_id, is_active: true });
      if (prod) {
        const qty = inv.quantity || 0;
        totalStockValue += qty * (prod.selling_price || 0);
        if (qty === 0)                              outOfStockCount++;
        else if (qty <= (prod.reorder_level || 10)) lowStockCount++;
      }
    }

    // Transactions last 30 days
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentTxns = await db().collection('transactions').find({ created_at: { $gte: since } }).toArray();
    const totalSales     = recentTxns.filter(t => t.transaction_type === 'sale').reduce((s, t) => s + (t.total_amount || 0), 0);
    const totalPurchases = recentTxns.filter(t => t.transaction_type === 'purchase').reduce((s, t) => s + (t.total_amount || 0), 0);

    // Unread alerts
    const unreadAlerts = await db().collection('stock_alerts').countDocuments({ is_read: false });

    // Monthly chart (last 6 months)
    const monthly = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd   = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthTxns = await db().collection('transactions').find({
        transaction_type: 'sale',
        created_at: { $gte: monthStart, $lt: monthEnd },
      }).toArray();
      monthly.push({
        month:   monthStart.toLocaleString('default', { month: 'short' }),
        revenue: Math.round(monthTxns.reduce((s, t) => s + (t.total_amount || 0), 0) * 100) / 100,
        orders:  monthTxns.length,
      });
    }

    // Recent transactions (last 8)
    const recentRows = await db().collection('transactions').find({}).sort({ created_at: -1 }).limit(8).toArray();
    const recentList = [];
    for (const t of recentRows) {
      const prod = t.product_id ? await db().collection('products').findOne({ _id: t.product_id }) : null;
      recentList.push({
        id:           t._id.toString(),
        product_name: prod ? (prod.name || 'Unknown') : 'Unknown',
        type:         t.transaction_type || '',
        quantity:     t.quantity || 0,
        total_amount: t.total_amount || 0,
        created_at:   t.created_at ? t.created_at.toISOString() : null,
      });
    }

    // Top 5 products by stock value
    const prodValues = [];
    for (const inv of invRows) {
      const prod = await db().collection('products').findOne({ _id: inv.product_id, is_active: true });
      if (prod) {
        const qty = inv.quantity || 0;
        prodValues.push({
          name:     prod.name || '',
          sku:      prod.sku || '',
          quantity: qty,
          value:    Math.round(qty * (prod.selling_price || 0) * 100) / 100,
        });
      }
    }
    const topProducts = prodValues.sort((a, b) => b.value - a.value).slice(0, 5);

    return res.json({
      total_products:      totalProducts,
      total_stock_value:   Math.round(totalStockValue * 100) / 100,
      low_stock_count:     lowStockCount,
      out_of_stock_count:  outOfStockCount,
      total_sales_30d:     Math.round(totalSales * 100) / 100,
      total_purchases_30d: Math.round(totalPurchases * 100) / 100,
      unread_alerts:       unreadAlerts,
      monthly_chart:       monthly,
      recent_transactions: recentList,
      top_products:        topProducts,
    });
  } catch (err) { return res.status(500).json({ detail: err.message }); }
});

module.exports = router;
