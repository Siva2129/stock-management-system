/**
 * seed.js — Seeds default admin users, categories, suppliers, products, and inventory.
 * Called once on server startup if the users collection is empty.
 */

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// ─── Collection helpers ───────────────────────────────────────────────────────
const col = (name) => mongoose.connection.collection(name);

async function seedDefaultData() {
  const usersCount = await col('users').countDocuments();
  if (usersCount > 0) return; // Already seeded

  console.log('🌱 Seeding default data...');
  const now = new Date();

  // ── Users ───────────────────────────────────────────────────────────────────
  const usersResult = await col('users').insertMany([
    {
      name: 'Admin User',
      email: 'admin@stock.com',
      role: 'admin',
      avatar: '👑',
      password_hash: bcrypt.hashSync('admin123', 10),
      is_active: true,
      phone: '',
      created_at: now,
      last_login: null,
    },
    {
      name: 'Store Manager',
      email: 'manager@stock.com',
      role: 'manager',
      avatar: '🏪',
      password_hash: bcrypt.hashSync('manager123', 10),
      is_active: true,
      phone: '',
      created_at: now,
      last_login: null,
    },
    {
      name: 'Staff Member',
      email: 'staff@stock.com',
      role: 'staff',
      avatar: '👷',
      password_hash: bcrypt.hashSync('staff123', 10),
      is_active: true,
      phone: '',
      created_at: now,
      last_login: null,
    },
  ]);

  // ── Categories ──────────────────────────────────────────────────────────────
  const catsResult = await col('categories').insertMany([
    { name: 'Electronics',  color: '#6366f1', parent_id: null },
    { name: 'Clothing',     color: '#ec4899', parent_id: null },
    { name: 'Food & Drink', color: '#f59e0b', parent_id: null },
    { name: 'Stationery',   color: '#10b981', parent_id: null },
    { name: 'Tools',        color: '#ef4444', parent_id: null },
  ]);
  const catIds = Object.values(catsResult.insertedIds);
  // [0]=Electronics, [1]=Clothing, [2]=Food, [3]=Stationery, [4]=Tools

  // ── Suppliers ───────────────────────────────────────────────────────────────
  const supsResult = await col('suppliers').insertMany([
    {
      name: 'TechDistrib India', email: 'sales@techdistrib.in', phone: '9800000001',
      contact_person: 'Amit Shah',  payment_terms: 'Net 30', is_active: true, address: '', created_at: now,
    },
    {
      name: 'FashionWholesale', email: 'info@fashionwhole.com', phone: '9800000002',
      contact_person: 'Priya Nair', payment_terms: 'Net 15', is_active: true, address: '', created_at: now,
    },
    {
      name: 'OfficeSupplies Co.', email: 'orders@officesup.com', phone: '9800000003',
      contact_person: 'Raj Kumar', payment_terms: 'Net 45', is_active: true, address: '', created_at: now,
    },
  ]);
  const supIds = Object.values(supsResult.insertedIds);
  // [0]=Tech, [1]=Fashion, [2]=Office

  // ── Products ────────────────────────────────────────────────────────────────
  const productsData = [
    { name: 'Wireless Keyboard',       sku: 'ELEC-001', category_id: catIds[0], supplier_id: supIds[0], cost_price: 800,  selling_price: 1299, reorder_level: 15, product_type: 'physical', unit: 'pcs',  is_active: true, description: '', image_url: '', created_at: now },
    { name: 'USB-C Hub 7-in-1',        sku: 'ELEC-002', category_id: catIds[0], supplier_id: supIds[0], cost_price: 500,  selling_price: 899,  reorder_level: 20, product_type: 'physical', unit: 'pcs',  is_active: true, description: '', image_url: '', created_at: now },
    { name: 'Noise Cancel Headphones', sku: 'ELEC-003', category_id: catIds[0], supplier_id: supIds[0], cost_price: 2000, selling_price: 3499, reorder_level: 10, product_type: 'physical', unit: 'pcs',  is_active: true, description: '', image_url: '', created_at: now },
    { name: 'Cotton T-Shirt (M)',      sku: 'CLTH-001', category_id: catIds[1], supplier_id: supIds[1], cost_price: 150,  selling_price: 349,  reorder_level: 25, product_type: 'physical', unit: 'pcs',  is_active: true, description: '', image_url: '', created_at: now },
    { name: 'Denim Jeans (32)',        sku: 'CLTH-002', category_id: catIds[1], supplier_id: supIds[1], cost_price: 600,  selling_price: 1199, reorder_level: 20, product_type: 'physical', unit: 'pcs',  is_active: true, description: '', image_url: '', created_at: now },
    { name: 'Sports Jacket',           sku: 'CLTH-003', category_id: catIds[1], supplier_id: supIds[1], cost_price: 900,  selling_price: 1799, reorder_level: 10, product_type: 'physical', unit: 'pcs',  is_active: true, description: '', image_url: '', created_at: now },
    { name: 'A4 Notebook (Pack5)',     sku: 'STAT-001', category_id: catIds[3], supplier_id: supIds[2], cost_price: 80,   selling_price: 149,  reorder_level: 30, product_type: 'physical', unit: 'pack', is_active: true, description: '', image_url: '', created_at: now },
    { name: 'Ballpoint Pens x10',      sku: 'STAT-002', category_id: catIds[3], supplier_id: supIds[2], cost_price: 30,   selling_price: 59,   reorder_level: 50, product_type: 'physical', unit: 'pack', is_active: true, description: '', image_url: '', created_at: now },
    { name: 'Stapler Heavy Duty',      sku: 'STAT-003', category_id: catIds[3], supplier_id: supIds[2], cost_price: 200,  selling_price: 349,  reorder_level: 15, product_type: 'physical', unit: 'pcs',  is_active: true, description: '', image_url: '', created_at: now },
    { name: 'Screwdriver Set',         sku: 'TOOL-001', category_id: catIds[4], supplier_id: supIds[2], cost_price: 300,  selling_price: 599,  reorder_level: 10, product_type: 'physical', unit: 'set',  is_active: true, description: '', image_url: '', created_at: now },
  ];
  const initQty = [45, 8, 22, 60, 18, 5, 100, 75, 30, 12];

  const prodsResult = await col('products').insertMany(productsData);
  const prodIds = Object.values(prodsResult.insertedIds);

  // ── Inventory ───────────────────────────────────────────────────────────────
  const inventoryDocs = prodIds.map((pid, i) => ({
    product_id:   pid,
    quantity:     initQty[i],
    reserved_qty: 0,
    warehouse:    'Main Warehouse',
    location:     '',
    updated_at:   now,
  }));
  await col('inventory').insertMany(inventoryDocs);

  // ── Indexes ─────────────────────────────────────────────────────────────────
  await col('users').createIndex({ email: 1 }, { unique: true });
  await col('products').createIndex({ sku: 1 }, { unique: true });
  await col('inventory').createIndex({ product_id: 1 }, { unique: true });

  console.log('✅ Seeding complete.');
}

module.exports = { seedDefaultData };
