/**
 * routes/products.js
 * GET    /api/products/categories/all   — list categories
 * POST   /api/products/categories/create — create category (admin)
 * GET    /api/products/                  — list products (with stock, category info)
 * POST   /api/products/                  — create product (admin)
 * GET    /api/products/:id               — single product
 * PUT    /api/products/:id               — update product (admin)
 * DELETE /api/products/:id               — soft-delete (admin)
 */

const express = require('express');
const mongoose = require('mongoose');
const { ObjectId } = require('mongoose').Types;
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const db = () => mongoose.connection;

// ─── GET /api/products/categories/all ────────────────────────────────────────
router.get('/categories/all', authenticate, async (req, res) => {
  try {
    const cats = await db().collection('categories').find({}).toArray();
    return res.json(cats.map(c => ({ id: c._id.toString(), name: c.name, color: c.color, parent_id: c.parent_id ? c.parent_id.toString() : null })));
  } catch (err) { return res.status(500).json({ detail: err.message }); }
});

// ─── POST /api/products/categories/create ────────────────────────────────────
router.post('/categories/create', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, color = '#6366f1', parent_id = null } = req.body;
    const result = await db().collection('categories').insertOne({ name, color, parent_id });
    return res.json({ id: result.insertedId.toString(), name, color, parent_id });
  } catch (err) { return res.status(500).json({ detail: err.message }); }
});

// ─── GET /api/products/ ───────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, category_id, low_stock } = req.query;
    const query = { is_active: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku:  { $regex: search, $options: 'i' } },
      ];
    }
    if (category_id) {
      try { query.category_id = new ObjectId(category_id); } catch {}
    }

    const products = await db().collection('products').find(query).toArray();
    const result = [];

    for (const p of products) {
      const inv = await db().collection('inventory').findOne({ product_id: p._id });
      const qty = inv ? (inv.quantity || 0) : 0;
      const reorder = p.reorder_level || 10;

      if (low_stock === 'true' && qty > reorder) continue;

      let cat = null;
      if (p.category_id) cat = await db().collection('categories').findOne({ _id: p.category_id });

      const sellingPrice = p.selling_price || 0;
      const costPrice    = p.cost_price || 0;

      result.push({
        id:             p._id.toString(),
        name:           p.name || '',
        sku:            p.sku || '',
        description:    p.description || '',
        product_type:   p.product_type || 'physical',
        unit:           p.unit || 'pcs',
        cost_price:     costPrice,
        selling_price:  sellingPrice,
        reorder_level:  reorder,
        is_active:      p.is_active,
        category_id:    p.category_id ? p.category_id.toString() : null,
        supplier_id:    p.supplier_id ? p.supplier_id.toString() : null,
        category_name:  cat ? cat.name : null,
        category_color: cat ? (cat.color || '#888') : '#888',
        stock_quantity: qty,
        stock_status:   qty === 0 ? 'out' : (qty <= reorder ? 'low' : 'ok'),
        margin_pct:     sellingPrice ? Math.round(((sellingPrice - costPrice) / sellingPrice) * 1000) / 10 : 0,
        created_at:     p.created_at ? p.created_at.toISOString() : null,
      });
    }
    return res.json(result);
  } catch (err) { return res.status(500).json({ detail: err.message }); }
});

// ─── POST /api/products/ ──────────────────────────────────────────────────────
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      name, sku, description = '', category_id, product_type = 'physical',
      unit = 'pcs', cost_price, selling_price, reorder_level = 10, supplier_id,
    } = req.body;

    const existing = await db().collection('products').findOne({ sku });
    if (existing) return res.status(400).json({ detail: 'SKU already exists' });

    const doc = {
      name, sku, description, product_type, unit,
      cost_price:    parseFloat(cost_price),
      selling_price: parseFloat(selling_price),
      reorder_level: parseInt(reorder_level),
      is_active: true,
      created_at: new Date(),
      image_url: '',
    };
    if (category_id) { try { doc.category_id = new ObjectId(category_id); } catch {} }
    if (supplier_id) { try { doc.supplier_id = new ObjectId(supplier_id); } catch {} }

    const result = await db().collection('products').insertOne(doc);
    const productId = result.insertedId;

    // Create inventory record
    await db().collection('inventory').insertOne({
      product_id:   productId,
      quantity:     0,
      reserved_qty: 0,
      warehouse:    'Main Warehouse',
      location:     '',
      updated_at:   new Date(),
    });

    return res.json({ id: productId.toString(), name, sku, message: 'Product created' });
  } catch (err) { return res.status(500).json({ detail: err.message }); }
});

// ─── GET /api/products/:id ───────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    let oid;
    try { oid = new ObjectId(req.params.id); } catch {
      return res.status(400).json({ detail: 'Invalid product ID' });
    }
    const p = await db().collection('products').findOne({ _id: oid });
    if (!p) return res.status(404).json({ detail: 'Product not found' });

    const inv = await db().collection('inventory').findOne({ product_id: oid });
    return res.json({
      id:             p._id.toString(),
      name:           p.name || '',
      sku:            p.sku || '',
      description:    p.description || '',
      product_type:   p.product_type || 'physical',
      unit:           p.unit || 'pcs',
      cost_price:     p.cost_price || 0,
      selling_price:  p.selling_price || 0,
      reorder_level:  p.reorder_level || 10,
      is_active:      p.is_active,
      category_id:    p.category_id ? p.category_id.toString() : null,
      supplier_id:    p.supplier_id ? p.supplier_id.toString() : null,
      stock_quantity: inv ? (inv.quantity || 0) : 0,
    });
  } catch (err) { return res.status(500).json({ detail: err.message }); }
});

// ─── PUT /api/products/:id ───────────────────────────────────────────────────
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    let oid;
    try { oid = new ObjectId(req.params.id); } catch {
      return res.status(400).json({ detail: 'Invalid product ID' });
    }
    const allowed = ['name', 'description', 'unit', 'cost_price', 'selling_price', 'reorder_level', 'is_active', 'category_id', 'supplier_id'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if ((key === 'category_id' || key === 'supplier_id') && req.body[key]) {
          try { updates[key] = new ObjectId(req.body[key]); } catch {}
        } else {
          updates[key] = req.body[key];
        }
      }
    }
    if (Object.keys(updates).length === 0) return res.json({ message: 'Nothing to update' });
    const result = await db().collection('products').updateOne({ _id: oid }, { $set: updates });
    if (result.matchedCount === 0) return res.status(404).json({ detail: 'Product not found' });
    return res.json({ message: 'Product updated' });
  } catch (err) { return res.status(500).json({ detail: err.message }); }
});

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    let oid;
    try { oid = new ObjectId(req.params.id); } catch {
      return res.status(400).json({ detail: 'Invalid product ID' });
    }
    const result = await db().collection('products').updateOne({ _id: oid }, { $set: { is_active: false } });
    if (result.matchedCount === 0) return res.status(404).json({ detail: 'Product not found' });
    return res.json({ message: 'Product deactivated' });
  } catch (err) { return res.status(500).json({ detail: err.message }); }
});

module.exports = router;
