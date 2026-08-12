import React, { useState, useEffect } from 'react';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';
import Input from '../../shared/components/Input';
import { useAuth } from '../auth/useAuth';
import { createDocument, onCollectionSnapshot, deleteDocument } from '../../core/firebase/firestoreService';
import type { Sale, Investment } from '../../core/types';
import { Timestamp } from 'firebase/firestore';

/**
 * Página de finanzas - inversiones y ganancias desde Firestore.
 */

const FinancePage: React.FC = () => {
  const { user } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingInvestment, setSavingInvestment] = useState(false);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  // Cargar inversiones y ventas de Firestore
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    let unsubscribe1: (() => void) | null = null;
    let unsubscribe2: (() => void) | null = null;

    try {
      unsubscribe1 = onCollectionSnapshot<Investment>(
        user.uid,
        'investments',
        (docs) => setInvestments(docs),
        console.error
      );

      unsubscribe2 = onCollectionSnapshot<Sale>(
        user.uid,
        'sales',
        (docs) => setSales(docs),
        console.error
      );

      setLoading(false);
    } catch (error) {
      console.error('Error cargando finanzas:', error);
      setLoading(false);
    }

    return () => {
      unsubscribe1?.();
      unsubscribe2?.();
    };
  }, [user]);

  const handleAddInvestment = async () => {
    if (!user || !description || !amount) {
      alert('Completa los campos');
      return;
    }

    setSavingInvestment(true);
    try {
      await createDocument(user.uid, 'investments', {
        date: Timestamp.now(),
        description,
        amount: parseFloat(amount),
      });
      alert('✅ Inversión registrada en Firestore');
      setDescription('');
      setAmount('');
    } catch (error) {
      console.error('Error guardando inversión:', error);
      alert('❌ Error al guardar la inversión');
    } finally {
      setSavingInvestment(false);
    }
  };

  // Calcular métricas
  const totalInvestment = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
  const netProfit = totalProfit - totalInvestment;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando finanzas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Métricas */}
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center p-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Ventas totales</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            ${totalSales.toFixed(2)}
          </p>
        </Card>
        <Card className="text-center p-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Ganancia bruta</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
            ${totalProfit.toFixed(2)}
          </p>
        </Card>
        <Card className="text-center p-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Inversión total</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
            ${totalInvestment.toFixed(2)}
          </p>
        </Card>
        <Card className="text-center p-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Ganancia neta</p>
          <p className={`text-2xl font-bold mt-2 ${netProfit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            ${netProfit.toFixed(2)}
          </p>
        </Card>
      </div>

      {/* Formulario de inversión */}
      <Card className="lg:col-span-2 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Registrar inversión
        </h2>
        <div className="space-y-3">
          <Input
            placeholder="Descripción de la inversión"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Monto"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
          />
          <Button fullWidth onClick={handleAddInvestment} disabled={savingInvestment}>
            {savingInvestment ? '⏳ Guardando...' : '💾 Guardar inversión'}
          </Button>
        </div>
      </Card>

      {/* Historial de inversiones */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Historial ({investments.length})
        </h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {investments.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No hay inversiones</p>
          ) : (
            investments
              .sort((a, b) => (b.date as Timestamp).toDate().getTime() - (a.date as Timestamp).toDate().getTime())
              .map((inv) => (
                <div key={inv.id} className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {inv.description}
                  </p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date((inv.date as Timestamp).toDate()).toLocaleDateString('es-MX')}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-yellow-600 dark:text-yellow-400">
                        ${inv.amount.toFixed(2)}
                      </p>
                      <button
                        onClick={async () => {
                          if (!user) return;
                          if (!confirm('¿Eliminar inversión?')) return;
                          try {
                            await deleteDocument(user.uid, 'investments', inv.id);
                            alert('✅ Inversión eliminada');
                          } catch (error) {
                            console.error('Error eliminando inversión:', error);
                            alert('❌ Error al eliminar inversión');
                          }
                        }}
                        className="px-2 py-1 text-xs bg-red-200 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded"
                        title="Eliminar inversión"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default FinancePage;
