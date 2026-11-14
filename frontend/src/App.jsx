import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import LoginPage      from './pages/LoginPage'
import DashboardPage  from './pages/DashboardPage'
import ProductsPage   from './pages/ProductsPage'
import InventoryPage  from './pages/InventoryPage'
import TransactionsPage from './pages/TransactionsPage'
import SuppliersPage  from './pages/SuppliersPage'
import ReportsPage    from './pages/ReportsPage'
import UsersPage      from './pages/UsersPage'
import RegisterPage   from './pages/RegisterPage'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="products"     element={<ProductsPage />} />
        <Route path="inventory"    element={<InventoryPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="suppliers"    element={<SuppliersPage />} />
        <Route path="reports"      element={<ReportsPage />} />
        <Route path="users"        element={<UsersPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{
          style: { background: '#1e2536', color: '#e8eaf0', border: '1px solid #2a3147', fontSize: '13.5px' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#14291e' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#2a1414' } },
        }} />
      </BrowserRouter>
    </AuthProvider>
  )
}
