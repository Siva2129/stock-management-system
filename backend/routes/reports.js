/**
 * routes/reports.js
 * GET /api/reports/:type?days=30
 *   type: sales | stock | supplier
 *
 * Mirrors Python OOP polymorphism: SalesReport, StockReport, SupplierReport.
 */

const express = require('express');
const mongoose = require('mongoose');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const db = () => mongoose.connection;

function getHeader(reportName, generatedBy) {
  return {
    report_name:  reportName,
    generated_by: generatedBy,
    generated_at: new Date().toISOString(),
  };
}

async function salesReport(generatedBy, days) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows  = await db().collection('transactions').find({
    transaction_type: 'sale',
    created_at: { $gte: since },
  }).toArray();
  const totalRevenue = rows.reduce((s, r) => s + (r.total_amount || 0), 0);
  const totalUnits   = rows.reduce((s, r) => s + (r.quantity || 0), 0);
  return {
    ...getHeader('Sales Report', generatedBy),
    period_days:        days,
    total_transactions: rows.length,
    total_revenue:      Math.round(totalRevenue * 100) / 100,
    total_units_sold:   totalUnits,
    avg_order_value:    rows.length ? Math.round((totalRevenue / rows.length) * 100) / 100 : 0,
  };
}

async function stockReport(generatedBy) {
  const invRows = await db().collection('inventory').find({}).toArray();
  let totalValue = 0;
  const lowStock = [];

  for (const inv of invRows) {
    const prod = await db().collection('products').findOne({ _id: inv.product_id });
    if (prod) {
      const val = (inv.quantity || 0) * (prod.selling_price || 0);
      totalValue += val;
      if ((inv.quantity || 0) <= (prod.reorder_level || 10)) {
        lowStock.push({ name: prod.name || '', qty: inv.quantity || 0, reorder: prod.reorder_level || 10 });
      }
    }
  }
  return {
    ...getHeader('Stock Report', generatedBy),
    total_products:    invRows.length,
    total_stock_value: Math.round(totalValue * 100) / 100,
    low_stock_count:   lowStock.length,
    low_stock_items:   lowStock,
  };
}

async function supplierReport(generatedBy) {
  const suppliers = await db().collection('suppliers').find({ is_active: true }).toArray();
  const result = [];

  for (const s of suppliers) {
    const txns = await db().collection('transactions').find({
      supplier_id:      s._id,
      transaction_type: 'purchase',
    }).toArray();
    result.push({
      supplier:     s.name || '',
      total_orders: txns.length,
      total_spend:  Math.round(txns.reduce((sum, t) => sum + (t.total_amount || 0), 0) * 100) / 100,
    });
  }
  return {
    ...getHeader('Supplier Report', generatedBy),
    total_suppliers:  suppliers.length,
    supplier_summary: result,
  };
}

// ─── GET /api/reports/:type ───────────────────────────────────────────────────
router.get('/:type', authenticate, async (req, res) => {
  try {
    const { type } = req.params;
    const days = parseInt(req.query.days) || 30;
    const generatedBy = req.user.name || 'system';

    let report;
    if (type === 'sales')         report = await salesReport(generatedBy, days);
    else if (type === 'stock')    report = await stockReport(generatedBy);
    else if (type === 'supplier') report = await supplierReport(generatedBy);
    else return res.status(400).json({ detail: `Unknown report type: ${type}` });

    return res.json(report);
  } catch (err) { return res.status(500).json({ detail: err.message }); }
});

module.exports = router;
