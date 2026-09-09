# 📦 StockFlow — Full-Stack Stock Management System

A complete, production-ready Stock Management System built with **React + FastAPI + SQLite**, demonstrating all **4 OOP pillars** in Python.

---

## 🏗️ Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | React 18 + Vite + Recharts |
| Backend  | FastAPI (Python 3.10+) |
| Database | SQLite (via SQLAlchemy ORM) |
| Auth     | JWT (python-jose + bcrypt) |

---

## 🎓 OOP Pillars Demonstrated

| Pillar | Where |
|--------|-------|
| **Encapsulation** | `Inventory._quantity` (private), `BaseProduct._cost_price/_selling_price` — controlled via properties/setters |
| **Inheritance** | `AdminUser / ManagerUser / StaffUser` extend `BaseUser`; `PhysicalProduct / DigitalProduct` extend `BaseProduct`; `Supplier` extends `BaseContact` |
| **Polymorphism** | `SalesReport / StockReport / SupplierReport` — same `generate()` call, different behavior per subclass |
| **Abstraction** | `BaseReport`, `BaseEntity`, `BaseContact` — abstract classes that define contracts, cannot be instantiated directly |

---

## 🚀 Setup — Step by Step

### 1. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

The backend starts at **http://localhost:8000**  
API docs available at **http://localhost:8000/docs**

The database (`stock_management.db`) is created automatically on first run, with seed data including 10 products, 3 suppliers, 5 categories, and 3 demo users.

---

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The frontend starts at **http://localhost:5173**

---

## 🔑 Demo Login Credentials

| Role    | Email                  | Password     |
|---------|------------------------|--------------|
| Admin   | admin@stock.com        | admin123     |
| Manager | manager@stock.com      | manager123   |
| Staff   | staff@stock.com        | staff123     |

---

## 📁 Project Structure

```
stock-management/
├── backend/
│   ├── main.py                    ← FastAPI app entry point
│   ├── requirements.txt
│   ├── core/
│   │   ├── database.py            ← SQLAlchemy engine & session
│   │   ├── security.py            ← JWT + bcrypt
│   │   └── auth.py                ← Auth dependency injection
│   ├── models/
│   │   ├── base_classes.py        ← Abstract base classes (ABSTRACTION)
│   │   ├── product_model.py       ← Product ORM + PhysicalProduct/DigitalProduct (INHERITANCE)
│   │   ├── user_model.py          ← User ORM + AdminUser/ManagerUser/StaffUser (INHERITANCE + ENCAPSULATION)
│   │   ├── inventory_model.py     ← Inventory/Transaction/Supplier/StockAlert (ENCAPSULATION)
│   │   └── report_classes.py      ← SalesReport/StockReport/SupplierReport (POLYMORPHISM)
│   ├── routes/
│   │   ├── products.py
│   │   ├── inventory.py
│   │   ├── transactions.py
│   │   ├── suppliers.py
│   │   ├── users.py
│   │   ├── reports.py
│   │   └── dashboard.py
│   ├── services/
│   │   └── user_service.py        ← Business logic + seed data
│   └── schemas/
│       └── schemas.py             ← Pydantic request/response schemas
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── App.jsx                ← Routing
        ├── index.css              ← Global dark theme styles
        ├── main.jsx
        ├── context/
        │   └── AuthContext.jsx    ← JWT auth state
        ├── utils/
        │   └── api.js             ← Axios instance with auth interceptor
        ├── components/
        │   └── layout/
        │       └── Layout.jsx     ← Sidebar + topbar
        └── pages/
            ├── LoginPage.jsx
            ├── DashboardPage.jsx  ← Charts + summary stats
            ├── ProductsPage.jsx   ← Full CRUD with filters
            ├── InventoryPage.jsx  ← Stock levels + alerts
            ├── TransactionsPage.jsx ← Stock IN/OUT recording
            ├── SuppliersPage.jsx
            ├── ReportsPage.jsx    ← Polymorphic report generation
            └── UsersPage.jsx      ← User management (Admin only)
```

---

## ✨ Features

- **Dashboard** — Live stats, 6-month revenue chart, top products, recent transactions
- **Products** — Add/Edit/Delete with category, supplier, price, margin tracking
- **Inventory** — Real-time stock levels with status (OK / Low / Out) + stock alerts
- **Transactions** — Record Purchase / Sale / Return / Adjustment with auto stock update
- **Suppliers** — Supplier management with order history and spend tracking
- **Reports** — Sales, Stock, Supplier reports (OOP polymorphism demonstrated)
- **Users** — Role-based access (Admin / Manager / Staff) with JWT auth

---

## 🔒 Role Permissions

| Feature | Admin | Manager | Staff |
|---------|-------|---------|-------|
| View everything | ✅ | ✅ | ✅ |
| Add/Edit products | ✅ | ✅ | ❌ |
| Record transactions | ✅ | ✅ | ✅ |
| Manage suppliers | ✅ | ✅ | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| View reports | ✅ | ✅ | ❌ |
