/**
 * routes/users.js
 * POST /api/users/login   — Login → JWT
 * GET  /api/users/me      — Current user
 * POST /api/users/register — Create user (admin only)
 * GET  /api/users/        — List all users (admin only)
 * DELETE /api/users/:id   — Delete user (admin only)
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ObjectId } = require('mongoose').Types;
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'supersecretkey1234567890abcdef';
const EXPIRES = process.env.JWT_EXPIRES_IN || '1440m';
const col = () => mongoose.connection.collection('users');

function formatUser(u) {
  return {
    id:         u._id.toString(),
    name:       u.name,
    email:      u.email,
    phone:      u.phone || '',
    role:       u.role,
    avatar:     u.avatar || '👤',
    is_active:  u.is_active,
    created_at: u.created_at,
    last_login: u.last_login,
  };
}

// POST /api/users/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await col().findOne({ email });
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }
    await col().updateOne({ _id: user._id }, { $set: { last_login: new Date() } });
    const token = jwt.sign({ sub: user._id.toString() }, SECRET, { expiresIn: EXPIRES });
    return res.json({ access_token: token, token_type: 'bearer', user: formatUser(user) });
  } catch (err) {
    return res.status(500).json({ detail: err.message });
  }
});

// GET /api/users/me
router.get('/me', authenticate, (req, res) => {
  res.json(req.user);
});

// POST /api/users/register (admin only)
router.post('/register', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, phone = '', role = 'staff', avatar = '👤' } = req.body;
    const existing = await col().findOne({ email });
    if (existing) return res.status(400).json({ detail: 'Email already registered' });

    const doc = {
      name, email, phone, role, avatar,
      password_hash: bcrypt.hashSync(password, 10),
      is_active: true,
      created_at: new Date(),
      last_login: null,
    };
    const result = await col().insertOne(doc);
    doc.id = result.insertedId.toString();
    delete doc._id;
    delete doc.password_hash;
    return res.json(doc);
  } catch (err) {
    return res.status(500).json({ detail: err.message });
  }
});

// GET /api/users/ (admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await col().find({}).toArray();
    return res.json(users.map(formatUser));
  } catch (err) {
    return res.status(500).json({ detail: err.message });
  }
});

// DELETE /api/users/:id (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    let oid;
    try { oid = new ObjectId(req.params.id); } catch {
      return res.status(400).json({ detail: 'Invalid user ID' });
    }
    const result = await col().deleteOne({ _id: oid });
    if (result.deletedCount === 0) return res.status(404).json({ detail: 'User not found' });
    return res.json({ message: 'User deleted' });
  } catch (err) {
    return res.status(500).json({ detail: err.message });
  }
});

module.exports = router;
