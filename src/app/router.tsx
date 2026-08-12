import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import Layout from './Layout';

// Páginas
import LoginPage from '../features/auth/LoginPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import InventoryListPage from '../features/inventory/InventoryListPage';
import ProductFormPage from '../features/inventory/ProductFormPage';
import NewSalePage from '../features/sales/NewSalePage';
import SaleHistoryPage from '../features/sales/SaleHistoryPage';
import FinancePage from '../features/finance/FinancePage';

/**
 * Ruta protegida - redirige a /login si no hay usuario autenticado.
 * Similar a Navigation Graphs con Deep Link Graphs en Android.
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout title={title}>{children}</Layout>;
};

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas protegidas */}
        <Route
          path="/"
          element={
            <ProtectedRoute title="Dashboard">
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute title="Inventario">
              <InventoryListPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory/new"
          element={
            <ProtectedRoute title="Nuevo Producto">
              <ProductFormPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sales/new"
          element={
            <ProtectedRoute title="Nueva Venta">
              <NewSalePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sales/history"
          element={
            <ProtectedRoute title="Historial de Ventas">
              <SaleHistoryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/finance"
          element={
            <ProtectedRoute title="Finanzas">
              <FinancePage />
            </ProtectedRoute>
          }
        />

        {/* Ruta 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
