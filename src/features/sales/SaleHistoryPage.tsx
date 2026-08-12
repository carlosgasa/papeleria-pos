import React, { useState, useEffect } from 'react';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';
import Input from '../../shared/components/Input';
import { useAuth } from '../auth/useAuth';
import { onCollectionSnapshot, deleteDocument, updateDocument } from '../../core/firebase/firestoreService';
import type { Sale, Product } from '../../core/types';
import { Timestamp } from 'firebase/firestore';

/**
 * Página de historial de ventas desde Firestore.
 * En Android sería un Fragment con RecyclerView.
 */

const SaleHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<(Sale & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedSale, setExpandedSale] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const unsubscribe = onCollectionSnapshot<Sale>(
      user.uid,
      'sales',
      (docs) => {
        setSales(docs as (Sale & { id: string })[]);
        setLoading(false);
      },
      (error) => {
        console.error('Error cargando ventas:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const handleDeleteSale = async (saleId: string) => {
    if (!user || !window.confirm('¿Estás seguro de que deseas eliminar esta venta?')) return;
    
    setDeleting(saleId);
    try {
      await deleteDocument(user.uid, 'sales', saleId);
      alert('✅ Venta eliminada');
    } catch (error) {
      console.error('Error eliminando venta:', error);
      alert('❌ Error al eliminar');
    } finally {
      setDeleting(null);
    }
  };

  const filteredSales = sales.filter((sale) => {
    if (!dateFilter) return true;
    const saleDate = new Date((sale.date as Timestamp).toDate()).toLocaleDateString('es-MX');
    const filterDate = new Date(dateFilter).toLocaleDateString('es-MX');
    return saleDate === filterDate;
  });

  const sortedSales = [...filteredSales].sort((a, b) => 
    (b.date as Timestamp).toDate().getTime() - (a.date as Timestamp).toDate().getTime()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtro por fecha */}
      <Card className="p-4">
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          placeholder="Filtrar por fecha"
        />
      </Card>

      {/* Resumen */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
        <p className="text-blue-900 dark:text-blue-200">
          📊 Total de ventas: {sortedSales.length} | 
          Total: ${sortedSales.reduce((sum, s) => sum + s.total, 0).toFixed(2)} |
          Ganancia: ${sortedSales.reduce((sum, s) => sum + s.profit, 0).toFixed(2)}
        </p>
      </Card>

      {/* Lista de ventas */}
      <div className="space-y-2">
        {sortedSales.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-4xl mb-2">📋</p>
            <p className="text-gray-600 dark:text-gray-400">No hay ventas registradas</p>
          </Card>
        ) : (
          sortedSales.map((sale, idx) => (
            <Card key={sale.id} className="p-4 border-l-4 border-l-green-500 dark:border-l-green-400 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-green-600 text-white px-2 py-1 rounded font-bold">#{idx + 1}</span>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {sale.items.length} artículo{sale.items.length > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date((sale.date as Timestamp).toDate()).toLocaleString('es-MX')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${sale.total.toFixed(2)}
                    </p>
                    <p className={`text-sm ${sale.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      💰 {sale.profit >= 0 ? '+' : ''}{sale.profit.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Items detallados - expandible */}
                {expandedSale === sale.id && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
                    {sale.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Costo: ${item.unitCost.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{item.qty} × ${item.unitPrice.toFixed(2)}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">${(item.qty * item.unitPrice).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between text-sm font-bold">
                      <span>Costo total:</span>
                      <span className="text-red-600 dark:text-red-400">${sale.totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
                  >
                    {expandedSale === sale.id ? '▼ Ocultar' : '▶ Detalles'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteSale(sale.id)}
                    disabled={deleting === sale.id}
                    title="Eliminar venta"
                  >
                    {deleting === sale.id ? '⏳' : '🗑️'}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default SaleHistoryPage;
