/**
 * server.js — Stock Management System (Express.js + MongoDB)
 * Entry point: connects to MongoDB, seeds default data, registers routes.
 */

require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');

const { seedDefaultData } = require('./utils/seed');

const app  = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stock_management';

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
  credentials: true,
}));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/users',        require('./routes/users'));
app.use('/api/products',     require('./routes/products'));
app.use('/api/inventory',    require('./routes/inventory'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/suppliers',    require('./routes/suppliers'));
app.use('/api/dashboard',    require('./routes/dashboard'));
app.use('/api/reports',      require('./routes/reports'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Stock Management API is running (MongoDB + Express)', version: '2.0.0' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log(`✅ MongoDB connected: ${MONGO_URI}`);
    await seedDefaultData();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`   Login: admin@stock.com / admin123`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
