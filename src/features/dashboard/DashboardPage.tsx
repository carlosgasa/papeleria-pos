import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import { useAuth } from '../auth/useAuth';
import { onCollectionSnapshot } from '../../core/firebase/firestoreService';
import type { Product, Sale, Investment } from '../../core/types';
import { Timestamp } from 'firebase/firestore';

/**
 * Dashboard principal - muestra KPIs y gráficos desde Firestore.
 * En Android sería un Fragment con RecyclerView y gráficas.
 */

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos de Firestore
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    let unsubscribe1: (() => void) | null = null;
    let unsubscribe2: (() => void) | null = null;
    let unsubscribe3: (() => void) | null = null;

    try {
      unsubscribe1 = onCollectionSnapshot<Product>(
        user.uid,
        'products',
        (docs) => setProducts(docs),
        console.error
      );

      unsubscribe2 = onCollectionSnapshot<Sale>(
        user.uid,
        'sales',
        (docs) => setSales(docs),
        console.error
      );

      unsubscribe3 = onCollectionSnapshot<Investment>(
        user.uid,
        'investments',
        (docs) => setInvestments(docs),
        console.error
      );

      setLoading(false);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setLoading(false);
    }

    return () => {
      unsubscribe1?.();
      unsubscribe2?.();
      unsubscribe3?.();
    };
  }, [user]);

  // Calcular métricas
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const todayRevenue = sales
    .filter((s) => {
      const saleDate = new Date((s.date as Timestamp).toDate());
      return saleDate >= today && saleDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    })
    .reduce((sum, s) => sum + s.total, 0);

  const weekRevenue = sales
    .filter((s) => {
      const saleDate = new Date((s.date as Timestamp).toDate());
      return saleDate >= weekStart;
    })
    .reduce((sum, s) => sum + s.total, 0);

  const monthRevenue = sales
    .filter((s) => {
      const saleDate = new Date((s.date as Timestamp).toDate());
      return saleDate >= monthStart;
    })
    .reduce((sum, s) => sum + s.total, 0);

  const todayProfit = sales
    .filter((s) => {
      const saleDate = new Date((s.date as Timestamp).toDate());
      return saleDate >= today && saleDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    })
    .reduce((sum, s) => sum + s.profit, 0);

  const totalInvestment = investments.reduce((sum, i) => sum + i.amount, 0);

  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

  const metrics = [
    { label: 'Ventas hoy', value: `$${todayRevenue.toFixed(2)}`, icon: '📊', color: 'blue' },
    { label: 'Ventas semana', value: `$${weekRevenue.toFixed(2)}`, icon: '📈', color: 'green' },
    { label: 'Ventas mes', value: `$${monthRevenue.toFixed(2)}`, icon: '💹', color: 'purple' },
    { label: 'Ganancia hoy', value: `$${todayProfit.toFixed(2)}`, icon: '💰', color: 'yellow' },
    { label: 'Inversión total', value: `$${totalInvestment.toFixed(2)}`, icon: '📦', color: 'red' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {metrics.map((metric, idx) => (
          <Card key={idx} className="text-center p-4">
            <div className="text-3xl mb-2">{metric.icon}</div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{metric.label}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
              {metric.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Secciones principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productos con stock bajo */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            📉 Stock bajo ({lowStockProducts.length})
          </h2>
          <div className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ✅ Todo el stock está bien
              </p>
            ) : (
              lowStockProducts.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="text-sm p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800"
                >
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {product.name}
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-400">
                    Stock: {product.stock} (Mín: {product.minStock})
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Acciones rápidas */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            ⚡ Acciones rápidas
          </h2>
          <div className="space-y-2">
            <Button onClick={() => navigate('/sales/new')} className="w-full">
              + Nueva venta
            </Button>
            <Button onClick={() => navigate('/inventory/new')} variant="outline" className="w-full">
              + Nuevo producto
            </Button>
            <Button onClick={() => navigate('/finance')} variant="outline" className="w-full">
              💰 Finanzas
            </Button>
          </div>
        </Card>
      </div>

      {/* Resumen de ventas recientes */}
      {sales.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            📋 Últimas ventas
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sales
              .sort((a, b) => (b.date as Timestamp).toDate().getTime() - (a.date as Timestamp).toDate().getTime())
              .slice(0, 5)
              .map((sale) => (
                <div
                  key={sale.id}
                  className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {sale.items.length} items
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date((sale.date as Timestamp).toDate()).toLocaleTimeString('es-MX')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">
                      ${sale.total.toFixed(2)}
                    </p>
                    <p className={`text-sm ${sale.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      Ganancia: ${sale.profit.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
