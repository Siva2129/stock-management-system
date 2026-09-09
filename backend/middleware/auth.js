/**
 * middleware/auth.js — JWT authentication middleware.
 * authenticate: verifies Bearer token, attaches req.user
 * requireAdmin: allows only admin/manager roles
 */

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ObjectId } = require('mongoose').Types;

const SECRET = process.env.JWT_SECRET || 'supersecretkey1234567890abcdef';
const col = () => mongoose.connection.collection('users');

/**
 * Verifies the JWT Bearer token and loads the user from MongoDB.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Not authenticated' });
  }
  const token = authHeader.slice(7);
  let payload;
  try {
    payload = jwt.verify(token, SECRET);
  } catch {
    return res.status(401).json({ detail: 'Could not validate credentials' });
  }

  const userId = payload.sub;
  if (!userId) return res.status(401).json({ detail: 'Could not validate credentials' });

  let oid;
  try { oid = new ObjectId(userId); } catch {
    return res.status(401).json({ detail: 'Could not validate credentials' });
  }

  const user = await col().findOne({ _id: oid });
  if (!user || !user.is_active) {
    return res.status(401).json({ detail: 'Could not validate credentials' });
  }

  // Normalize: expose string id
  req.user = {
    id:         user._id.toString(),
    name:       user.name,
    email:      user.email,
    role:       user.role,
    avatar:     user.avatar,
    phone:      user.phone || '',
    is_active:  user.is_active,
    created_at: user.created_at,
    last_login: user.last_login,
  };
  next();
}

/**
 * Allows only admin or manager roles. Must be used AFTER authenticate.
 */
async function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ detail: 'Not authenticated' });
  if (!['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ detail: 'Admin or Manager role required' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
