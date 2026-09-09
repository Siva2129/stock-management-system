/**
 * routes/suppliers.js
 * GET    /api/suppliers/      — List active suppliers (with order counts)
 * POST   /api/suppliers/      — Create supplier (admin)
 * GET    /api/suppliers/:id   — Single supplier
 * PUT    /api/suppliers/:id   — Update supplier (admin)
 * DELETE /api/suppliers/:id   — Soft-delete (admin)
 */

const express = require('express');
const mongoose = require('mongoose');
const { ObjectId } = require('mongoose').Types;
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const db = () => mongoose.connection;

// ─── GET /api/suppliers/ ──────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const suppliers = await db().collection('suppliers').find({ is_active: true }).toArray();
    const result = [];

    for (const s of suppliers) {
      const txns = await db().collection('transactions').find({
        supplier_id:      s._id,
        transaction_type: 'purchase',
      }).toArray();
      const spend = txns.reduce((sum, t) => sum + (t.total_amount || 0), 0);

      result.push({
        id:             s._id.toString(),
        name:           s.name || '',
        email:          s.email || '',
        phone:          s.phone || '',
        address:        s.address || '',
        contact_person: s.contact_person || '',
        payment_terms:  s.payment_terms || 'Net 30',
        is_active:      s.is_active,
        total_orders:   txns.length,
        total_spend:    Math.round(spend * 100) / 100,
        created_at:     s.created_at ? s.created_at.toISOString() : null,
      });
    }
    return res.json(result);
  } catch (err) { return res.status(500).json({ detail: err.message }); }
});

// ─── POST /api/suppliers/ ─────────────────────────────────────────────────────
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, email = '', phone = '', address = '', contact_person = '', payment_terms = 'Net 30' } = req.body;
    const doc = { name, email, phone, address, contact_person, payment_terms, is_active: true, created_at: new Date() };
    const result = await db().collection('suppliers').insertOne(doc);
    return res.json({ ...doc, id: result.insertedId.toString(), _id: undefined });
  } catch (err) { return res.status(500).json({ detail: err.message }); }
});

// ─── GET /api/suppliers/:id ───────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    let oid;
    try { oid = new ObjectId(req.params.id); } catch {
      return res.status(400).json({ detail: 'Invalid supplier ID' });
    }
    const s = await db().collection('suppliers').findOne({ _id: oid });
    if (!s) return res.status(404).json({ detail: 'Supplier not found' });
    return res.json({
      id:             s._id.toString(),
      name:           s.name || '',
      email:          s.email || '',
      phone:          s.phone || '',
      address:        s.address || '',
      contact_person: s.contact_person || '',
      payment_terms:  s.payment_terms || 'Net 30',
      is_active:      s.is_active,
    });
  } catch (err) { return res.status(500).json({ detail: err.message }); }
});

// ─── PUT /api/suppliers/:id ───────────────────────────────────────────────────
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    let oid;
    try { oid = new ObjectId(req.params.id); } catch {
      return res.status(400).json({ detail: 'Invalid supplier ID' });
    }
    const { name, email, phone, address, contact_person, payment_terms } = req.body;
    const updates = {};
    if (name !== undefined)           updates.name           = name;
    if (email !== undefined)          updates.email          = email;
    if (phone !== undefined)          updates.phone          = phone;
    if (address !== undefined)        updates.address        = address;
    if (contact_person !== undefined) updates.contact_person = contact_person;
    if (payment_terms !== undefined)  updates.payment_terms  = payment_terms;

    const result = await db().collection('suppliers').updateOne({ _id: oid }, { $set: updates });
    if (result.matchedCount === 0) return res.status(404).json({ detail: 'Supplier not found' });
    return res.json({ message: 'Updated' });
  } catch (err) { return res.status(500).json({ detail: err.message }); }
});

// ─── DELETE /api/suppliers/:id ────────────────────────────────────────────────
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    let oid;
    try { oid = new ObjectId(req.params.id); } catch {
      return res.status(400).json({ detail: 'Invalid supplier ID' });
    }
    const result = await db().collection('suppliers').updateOne({ _id: oid }, { $set: { is_active: false } });
    if (result.matchedCount === 0) return res.status(404).json({ detail: 'Supplier not found' });
    return res.json({ message: 'Supplier deactivated' });
  } catch (err) { return res.status(500).json({ detail: err.message }); }
});

module.exports = router;
