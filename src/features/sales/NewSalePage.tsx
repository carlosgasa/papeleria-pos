import React, { useState, useEffect } from 'react';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';
import Input from '../../shared/components/Input';
import QRScanner from '../../shared/components/QRScanner';
import { useAuth } from '../auth/useAuth';
import { onCollectionSnapshot, createDocument, updateDocument } from '../../core/firebase/firestoreService';
import type { Product, Sale } from '../../core/types';
import { Timestamp } from 'firebase/firestore';

/**
 * Página de nueva venta (carrito/POS) mejorada.
 * En Android sería un Fragment con RecyclerView para el carrito.
 */

const NewSalePage: React.FC = () => {
  const { user } = useAuth();
  const [cart, setCart] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingCartData, setSavingCartData] = useState(false);
  const [change, setChange] = useState(0);
  const [showScanner, setShowScanner] = useState(false);

  // Cargar productos de Firestore
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

  const handleScanProduct = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode);
    if (!product) {
      alert('⚠️ Producto no encontrado con código: ' + barcode);
      return;
    }
    addToCart(product);
    setShowScanner(false);
    alert(`✅ ${product.name} agregado al carrito`);
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('⚠️ Producto sin stock');
      return;
    }

    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      if (existing.qty < product.stock) {
        setCart(
          cart.map((item) =>
            item.id === product.id ? { ...item, qty: item.qty + 1 } : item
          )
        );
      } else {
        alert(`⚠️ Solo hay ${product.stock} disponibles`);
      }
    } else {
      setCart([...cart, { 
        id: product.id,
        name: product.name,
        salePrice: product.salePrice,
        costPrice: product.costPrice,
        qty: 1,
        barcode: product.barcode,
        stock: product.stock 
      }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const updateQty = (productId: string, qty: number) => {
    const product = cart.find((item) => item.id === productId);
    if (!product) return;

    if (qty <= 0) {
      removeFromCart(productId);
    } else if (qty > product.stock) {
      alert(`⚠️ Solo hay ${product.stock} disponibles`);
    } else {
      setCart(
        cart.map((item) =>
          item.id === productId ? { ...item, qty } : item
        )
      );
    }
  };

  const total = cart.reduce((sum, item) => sum + item.salePrice * item.qty, 0);
  const totalCost = cart.reduce((sum, item) => sum + item.costPrice * item.qty, 0);
  const profit = total - totalCost;
  const changeAmount = change - total;

  const filteredProducts = products.filter(
    (p) => (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode.includes(searchQuery)) && p.stock > 0
  );

  const handleCompleteSale = async () => {
    if (!user || cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    if (change < total) {
      alert(`⚠️ El cliente debe pagar ${(total - change).toFixed(2)} más`);
      return;
    }

    setSavingCartData(true);
    try {
      // 1. Crear la venta
      await createDocument(user.uid, 'sales', {
        date: Timestamp.now(),
        items: cart.map((item) => ({
          productId: item.id,
          name: item.name,
          qty: item.qty,
          unitPrice: item.salePrice,
          unitCost: item.costPrice,
        })),
        total,
        totalCost,
        profit,
      } as Sale);

      // 2. Actualizar stock de cada producto
      for (const item of cart) {
        const product = products.find(p => p.id === item.id);
        if (product) {
          await updateDocument(user.uid, 'products', item.id, {
            stock: Math.max(0, product.stock - item.qty)
          });
        }
      }

      alert(`✅ Venta de $${total.toFixed(2)} registrada\n💵 Cambio: $${changeAmount.toFixed(2)}`);
      setCart([]);
      setChange(0);
    } catch (error) {
      console.error('Error guardando venta:', error);
      alert('❌ Error al registrar la venta');
    } finally {
      setSavingCartData(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Búsqueda de productos */}
      <div className="md:col-span-2">
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              🛒 Nueva Venta
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {cart.length} item{cart.length !== 1 ? 's' : ''} en el carrito
            </p>
          </div>

          {/* Búsqueda */}
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por nombre o código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => setShowScanner(true)}
              title="Escanear código de barras"
            >
              📷 Scan
            </Button>
          </div>

          {/* Productos disponibles */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-4">Cargando productos...</p>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                <p>No hay productos disponibles</p>
                <p className="text-sm mt-1">(con stock {'>'}0)</p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent rounded-lg hover:shadow-md transition-shadow border border-blue-100 dark:border-blue-800"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{product.name}</p>
                    <div className="flex gap-4 mt-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        📌 {product.barcode}
                      </p>
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        ${product.salePrice.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Stock: {product.stock}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addToCart(product)}
                  >
                    + Agregar
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Resumen del carrito */}
      <div>
        <Card className="p-6 sticky top-20 space-y-4 border-2 border-blue-200 dark:border-blue-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            🛒 Carrito ({cart.length})
          </h3>

          {/* Items del carrito */}
          <div className="space-y-2 max-h-72 overflow-y-auto border-b border-gray-200 dark:border-gray-600 pb-4">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">🛍️</p>
                <p className="text-gray-600 dark:text-gray-400">Carrito vacío</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Agrega productos para comenzar</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={item.id} className="p-3 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent rounded-lg border border-blue-100 dark:border-blue-800 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded font-bold">{idx + 1}</span>
                        <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Precio</p>
                          <p className="font-bold text-blue-600 dark:text-blue-400">${item.salePrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Cantidad</p>
                          <p className="font-bold">{item.qty}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Subtotal</p>
                          <p className="font-bold text-green-600 dark:text-green-400">${(item.salePrice * item.qty).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 items-center ml-2">
                      <button
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 text-xs font-bold transition-colors"
                        title="Disminuir cantidad"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-gray-900 dark:text-white font-bold">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 text-xs font-bold transition-colors"
                        title="Aumentar cantidad"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="px-2 py-1 bg-red-200 dark:bg-red-900/50 text-red-700 dark:text-red-400 rounded hover:bg-red-300 dark:hover:bg-red-900/70 text-xs font-bold ml-1 transition-colors"
                        title="Eliminar del carrito"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))
           )}
          </div>

          {/* Totales */}
          <div className="space-y-2 text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span className="font-semibold text-gray-900 dark:text-white">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Costo:</span>
              <span className="font-semibold text-gray-900 dark:text-white">${totalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
              <span className="text-green-600 dark:text-green-400 font-bold">Ganancia:</span>
              <span className={`font-bold ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                ${profit.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Monto pagado */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              💵 Monto pagado
            </label>
            <Input
              type="number"
              value={change}
              onChange={(e) => setChange(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>

          {/* Cambio */}
          {change > 0 && (
            <div className={`p-3 rounded text-center font-bold ${
              changeAmount >= 0
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}>
              {changeAmount >= 0
                ? `💵 Cambio: $${changeAmount.toFixed(2)}`
                : `⚠️ Faltan: $${Math.abs(changeAmount).toFixed(2)}`}
            </div>
          )}

          {/* Botón completar venta */}
          <Button
            onClick={handleCompleteSale}
            disabled={cart.length === 0 || savingCartData || (change < total)}
            className="w-full"
          >
            {savingCartData ? '⏳ Guardando...' : `✓ Vender $${total.toFixed(2)}`}
          </Button>
        </Card>
      </div>

      {showScanner && (
        <QRScanner
          onScan={handleScanProduct}
          onClose={() => setShowScanner(false)}
          title="Escanear producto"
        />
      )}
    </div>
  );
};

export default NewSalePage;
