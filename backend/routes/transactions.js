/**
 * routes/transactions.js
 * GET  /api/transactions/  — List transactions (most recent first)
 * POST /api/transactions/  — Create transaction (adjusts inventory, triggers alert)
 *
 * Business logic is the same as the Python OOP Transaction/Inventory classes:
 * - purchase/return → add stock
 * - sale/transfer   → remove stock (with availability check)
 * - adjustment      → set stock to exact value
 */

const express = require('express');
const mongoose = require('mongoose');
const { ObjectId } = require('mongoose').Types;
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const db = () => mongoose.connection;

function genRef() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = 'TXN-';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// ─── Stock logic (mirrors OOP Transaction.process) ────────────────────────────
function applyTransaction(currentQty, txnType, qty) {
  if (txnType === 'purchase' || txnType === 'return') {
    return currentQty + qty;
  } else if (txnType === 'sale' || txnType === 'transfer') {
    if (qty > currentQty) throw new Error(`Insufficient stock. Available: ${currentQty}, Requested: ${qty}`);
    return currentQty - qty;
  } else {
    // adjustment — set to exact value
    return qty;
  }
}

function getAlertLevel(qty, reorderLevel) {
  if (qty === 0) return 'out_of_stock';
  if (qty <= reorderLevel / 2) return 'critical';
  return 'low';
}

function getAlertMessage(productName, qty, reorderLevel) {
  const level = getAlertLevel(qty, reorderLevel);
  if (level === 'out_of_stock') return `${productName} is OUT OF STOCK`;
  if (level === 'critical')     return `${productName} is critically low (${qty} left)`;
  return `${productName} is below reorder level (${qty} left)`;
}

// ─── GET /api/transactions/ ───────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const rows = await db().collection('transactions')
      .find({})
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();

    const result = [];
    for (const t of rows) {
      const prod = t.product_id ? await db().collection('products').findOne({ _id: t.product_id }) : null;
      result.push({
        id:               t._id.toString(),
        product_id:       t.product_id ? t.product_id.toString() : null,
        product_name:     prod ? (prod.name || 'Unknown') : 'Unknown',
        product_sku:      prod ? (prod.sku || '') : '',
        transaction_type: t.transaction_type || '',
        quantity:         t.quantity || 0,
        unit_price:       t.unit_price || 0,
        total_amount:     t.total_amount || 0,
        notes:            t.notes || '',
        reference_no:     t.reference_no || '',
        created_at:       t.created_at ? t.created_at.toISOString() : null,
      });
    }
    return res.json(result);
  } catch (err) { return res.status(500).json({ detail: err.message }); }
});

// ─── POST /api/transactions/ ──────────────────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      product_id, transaction_type, quantity, unit_price,
      notes = '', reference_no = '', supplier_id,
    } = req.body;

    if (!quantity || quantity <= 0) return res.status(400).json({ detail: 'Quantity must be positive' });
    if (unit_price < 0)             return res.status(400).json({ detail: 'Unit price cannot be negative' });

    let productOid;
    try { productOid = new ObjectId(product_id); } catch {
      return res.status(400).json({ detail: 'Invalid product ID' });
    }

    const prod = await db().collection('products').findOne({ _id: productOid });
    if (!prod) return res.status(404).json({ detail: 'Product not found' });

    const invRow = await db().collection('inventory').findOne({ product_id: productOid });
    if (!invRow) return res.status(404).json({ detail: 'Inventory record not found' });

    const currentQty = invRow.quantity || 0;
    let newQty;
    try {
      newQty = applyTransaction(currentQty, transaction_type, parseInt(quantity));
    } catch (e) {
      return res.status(400).json({ detail: e.message });
    }

    const totalAmount = parseFloat(quantity) * parseFloat(unit_price);
    const now = new Date();

    // Update inventory
    await db().collection('inventory').updateOne(
      { product_id: productOid },
      { $set: { quantity: newQty, updated_at: now } }
    );

    // Resolve supplier ID
    let supplierOid = null;
    if (supplier_id) { try { supplierOid = new ObjectId(supplier_id); } catch {} }

    // Persist transaction
    const txnDoc = {
      product_id:       productOid,
      transaction_type: transaction_type,
      quantity:         parseInt(quantity),
      unit_price:       parseFloat(unit_price),
      total_amount:     totalAmount,
      notes:            notes,
      reference_no:     reference_no || genRef(),
      supplier_id:      supplierOid,
      created_by:       new ObjectId(req.user.id),
      created_at:       now,
    };
    const txnResult = await db().collection('transactions').insertOne(txnDoc);

    // Create stock alert if needed
    const reorderLevel = prod.reorder_level || 10;
    if (newQty <= reorderLevel) {
      await db().collection('stock_alerts').insertOne({
        product_id: productOid,
        level:      getAlertLevel(newQty, reorderLevel),
        message:    getAlertMessage(prod.name, newQty, reorderLevel),
        is_read:    false,
        created_at: now,
      });
    }

    return res.json({
      id:           txnResult.insertedId.toString(),
      reference_no: txnDoc.reference_no,
      new_stock:    newQty,
      message:      'Transaction recorded',
    });
  } catch (err) { return res.status(500).json({ detail: err.message }); }
});

module.exports = router;
