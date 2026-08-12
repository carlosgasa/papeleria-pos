import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';
import Input from '../../shared/components/Input';
import { useAuth } from '../auth/useAuth';
import { onCollectionSnapshot, deleteDocument } from '../../core/firebase/firestoreService';
import type { Product } from '../../core/types';

/**
 * Página de inventario - listar, buscar y editar productos.
 * En Android sería un Fragment con RecyclerView y RecyclerView.Adapter.
 */

const InventoryListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'low-stock'>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const unsubscribe = onCollectionSnapshot<Product>(
      user.uid,
      'products',
      (docs) => {
        setProducts(docs);
        setLoading(false);
      },
      (error) => {
        console.error('Error cargando productos:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const handleDeleteProduct = async (productId: string) => {
    if (!user || !window.confirm('¿Estás seguro de que deseas eliminar este producto?')) return;
    
    setDeleting(productId);
    try {
      await deleteDocument(user.uid, 'products', productId);
      alert('✅ Producto eliminado');
    } catch (error) {
      console.error('Error eliminando producto:', error);
      alert('❌ Error al eliminar');
    } finally {
      setDeleting(null);
    }
  };

  const handleEditProduct = (product: Product) => {
    // Guardar el producto en sesión para editarlo
    sessionStorage.setItem('editingProduct', JSON.stringify(product));
    navigate(`/inventory/new?edit=${product.id}`);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.barcode.includes(searchQuery);
    const matchesFilter = filter === 'all' || (filter === 'low-stock' && p.stock <= p.minStock);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      {/* Búsqueda y filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Buscar por nombre o código..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">Todos</option>
          <option value="low-stock">Stock bajo</option>
        </select>
        <Button onClick={() => navigate('/inventory/new')}>+ Nuevo producto</Button>
      </div>

      {/* Lista de productos */}
      <div className="space-y-2">
        {loading ? (
          <Card className="text-center py-8">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Cargando productos...</p>
          </Card>
        ) : filteredProducts.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">No hay productos</p>
          </Card>
        ) : (
          filteredProducts.map((product) => (
            <Card key={product.id} className="flex items-center justify-between p-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Código: {product.barcode}
                </p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span>Stock: <strong>{product.stock}</strong></span>
                  <span>Precio: <strong>${product.salePrice.toFixed(2)}</strong></span>
                  <span>Costo: <strong>${product.costPrice.toFixed(2)}</strong></span>
                </div>
                {product.stock <= product.minStock && (
                  <div className="mt-2 inline-block px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs rounded">
                    ⚠️ Stock bajo
                  </div>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditProduct(product)}
                  title="Editar producto"
                >
                  ✏️
                </Button>
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={() => handleDeleteProduct(product.id)}
                  disabled={deleting === product.id}
                  title="Eliminar producto"
                >
                  {deleting === product.id ? '⏳' : '🗑️'}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default InventoryListPage;
