import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';
import Input from '../../shared/components/Input';
import QRScanner from '../../shared/components/QRScanner';
import { useAuth } from '../auth/useAuth';
import { createDocument, updateDocument, getDocument } from '../../core/firebase/firestoreService';

/**
 * Página para crear/editar un producto.
 * En Android sería un Fragment con un formulario y validación.
 */

const ProductFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: '',
    costPrice: '',
    salePrice: '',
    stock: '',
    minStock: '',
    unit: 'pieza',
  });

  useEffect(() => {
    // primero intentar cargar desde sessionStorage (desde lista de inventario)
    const stored = sessionStorage.getItem('editingProduct');
    if (stored) {
      try {
        const p = JSON.parse(stored);
        setFormData({
          name: p.name || '',
          barcode: p.barcode || '',
          category: p.category || '',
          costPrice: String(p.costPrice ?? ''),
          salePrice: String(p.salePrice ?? ''),
          stock: String(p.stock ?? ''),
          minStock: String(p.minStock ?? ''),
          unit: p.unit || 'pieza',
        });
        setEditingId(p.id || null);
        // limpiar para evitar reuso accidental
        sessionStorage.removeItem('editingProduct');
        return;
      } catch (e) {
        console.warn('editingProduct parse failed', e);
      }
    }

    // si no hay sessionStorage, revisar query param ?edit=ID y traer desde Firestore
    const params = new URLSearchParams(location.search);
    const editId = params.get('edit');
    if (editId && user) {
      (async () => {
        try {
          const doc = await getDocument(user.uid, 'products', editId);
          if (doc) {
            setFormData({
              name: doc.name || '',
              barcode: doc.barcode || '',
              category: doc.category || '',
              costPrice: String(doc.costPrice ?? ''),
              salePrice: String(doc.salePrice ?? ''),
              stock: String(doc.stock ?? ''),
              minStock: String(doc.minStock ?? ''),
              unit: doc.unit || 'pieza',
            });
            setEditingId(editId);
          }
        } catch (err) {
          console.error('Error cargando producto para editar', err);
        }
      })();
    }
  }, [location.search, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleScanBarcode = (barcode: string) => {
    setFormData((prev) => ({
      ...prev,
      barcode,
    }));
    setShowScanner(false);
    alert('✅ Código escaneado: ' + barcode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Debes estar autenticado para crear/editar un producto');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        barcode: formData.barcode,
        category: formData.category,
        costPrice: parseFloat(formData.costPrice) || 0,
        salePrice: parseFloat(formData.salePrice) || 0,
        stock: parseInt(formData.stock) || 0,
        minStock: parseInt(formData.minStock) || 0,
        unit: formData.unit,
      };

      if (editingId) {
        await updateDocument(user.uid, 'products', editingId, payload);
        alert('✅ Producto actualizado');
      } else {
        await createDocument(user.uid, 'products', payload);
        alert('✅ Producto guardado en Firestore');
      }

      // limpiar estado de edición si existía
      sessionStorage.removeItem('editingProduct');
      navigate('/inventory');
    } catch (error) {
      console.error('Error guardando producto:', error);
      alert('❌ Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Nuevo Producto
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre del producto *
            </label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Cuaderno A4 100 hojas"
              required
            />
          </div>

          {/* Código de barras */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Código de barras
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                placeholder="7501234567890"
                className="flex-1"
              />
              <Button variant="outline" type="button" onClick={() => setShowScanner(true)}>
                📷 Escanear
              </Button>
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoría
            </label>
            <Input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="Ej: Papelería, Escritura, Tinta"
            />
          </div>

          {/* Precios */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Precio de costo *
              </label>
              <Input
                type="number"
                name="costPrice"
                value={formData.costPrice}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Precio de venta *
              </label>
              <Input
                type="number"
                name="salePrice"
                value={formData.salePrice}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                required
              />
            </div>
          </div>

          {/* Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stock inicial *
              </label>
              <Input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                placeholder="0"
                step="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stock mínimo *
              </label>
              <Input
                type="number"
                name="minStock"
                value={formData.minStock}
                onChange={handleChange}
                placeholder="0"
                step="1"
                required
              />
            </div>
          </div>

          {/* Unidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Unidad de medida
            </label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="pieza">Pieza</option>
              <option value="pack">Pack</option>
              <option value="docena">Docena</option>
              <option value="caja">Caja</option>
              <option value="resma">Resma</option>
              <option value="kg">Kg</option>
              <option value="metro">Metro</option>
            </select>
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-6">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? '⏳ Guardando...' : 'Guardar Producto'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/inventory')}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Card>

      {showScanner && (
        <QRScanner
          onScan={handleScanBarcode}
          onClose={() => setShowScanner(false)}
          title="Escanear código de barras"
        />
      )}
    </div>
  );
};

export default ProductFormPage;
