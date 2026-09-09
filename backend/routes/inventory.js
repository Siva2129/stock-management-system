/**
 * routes/inventory.js
 * GET    /api/inventory/            — List inventory with product info
 * PUT    /api/inventory/:id         — Update inventory record
 * GET    /api/inventory/alerts/     — Unread stock alerts
 * PATCH  /api/inventory/alerts/:id/read — Mark alert as read
 */

const express = require('express');
const mongoose = require('mongoose');
const { ObjectId } = require('mongoose').Types;
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const db = () => mongoose.connection;

// ─── GET /api/inventory/alerts/ (must be before /:id) ────────────────────────
router.get('/alerts/', authenticate, async (req, res) => {
  try {
    const alerts = await db().collection('stock_alerts')
      .find({ is_read: false })
      .sort({ created_at: -1 })
      .limit(20)
      .toArray();

    const result = [];
    for (const a of alerts) {
      const prod = a.product_id ? await db().collection('products').findOne({ _id: a.product_id }) : null;
      result.push({
        id:           a._id.toString(),
        product_id:   a.product_id ? a.product_id.toString() : null,
        product_name: prod ? (prod.name || 'Unknown') : 'Unknown',
        level:        a.level || 'low',
        message:      a.message || '',
        is_read:      a.is_read,
        created_at:   a.created_at ? a.created_at.toISOString() : null,
      });
    }
    return res.json(result);
  } catch (err) { return res.status(500).json({ detail: err.message }); }
});

// ─── PATCH /api/inventory/alerts/:id/read ────────────────────────────────────
router.patch('/alerts/:id/read', authenticate, async (req, res) => {
  try {
    let oid;
    try { oid = new ObjectId(req.params.id); } catch {
      return res.status(400).json({ detail: 'Invalid alert ID' });
    }
    await db().collection('stock_alerts').updateOne({ _id: oid }, { $set: { is_read: true } });
    return res.json({ message: 'Marked as read' });
  } catch (err) { return res.status(500).json({ detail: err.message }); }
});

// ─── GET /api/inventory/ ──────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const rows = await db().collection('inventory').find({}).toArray();
    const result = [];

    for (const inv of rows) {
      const prod = await db().collection('products').findOne({ _id: inv.product_id });
      if (!prod || !prod.is_active) continue;

      const qty     = inv.quantity || 0;
      const reorder = prod.reorder_level || 10;
      result.push({
        id:           inv._id.toString(),
        product_id:   inv.product_id.toString(),
        product_name: prod.name || '',
        product_sku:  prod.sku || '',
        quantity:     qty,
        reserved_qty: inv.reserved_qty || 0,
        warehouse:    inv.warehouse || '',
        location:     inv.location || '',
        reorder_level: reorder,
        stock_value:  Math.round(qty * (prod.selling_price || 0) * 100) / 100,
        status:       qty === 0 ? 'out' : (qty <= reorder ? 'low' : 'ok'),
        updated_at:   inv.updated_at ? inv.updated_at.toISOString() : null,
      });
    }
    return res.json(result);
  } catch (err) { return res.status(500).json({ detail: err.message }); }
});

// ─── PUT /api/inventory/:id ───────────────────────────────────────────────────
router.put('/:id', authenticate, async (req, res) => {
  try {
    let oid;
    try { oid = new ObjectId(req.params.id); } catch {
      return res.status(400).json({ detail: 'Invalid inventory ID' });
    }
    const { quantity, warehouse, location } = req.body;
    const updates = { updated_at: new Date() };
    if (quantity !== undefined)  updates.quantity  = parseInt(quantity);
    if (warehouse !== undefined) updates.warehouse = warehouse;
    if (location !== undefined)  updates.location  = location;

    const result = await db().collection('inventory').updateOne({ _id: oid }, { $set: updates });
    if (result.matchedCount === 0) return res.status(404).json({ detail: 'Not found' });
    return res.json({ message: 'Updated' });
  } catch (err) { return res.status(500).json({ detail: err.message }); }
});

module.exports = router;
