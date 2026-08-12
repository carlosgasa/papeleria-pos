import { create } from 'zustand';
import { Product } from '../../core/types';

/**
 * Store de Zustand para gestionar el estado del inventario.
 * Zustand es simple y ligero, similar a Redux pero sin boilerplate.
 * Los stores contienen estado global y métodos para actualizarlo.
 * 
 * NOTA PARA KOTLIN DEV: Esto es como un ViewModel con LiveData,
 * pero más simple. Zustand gestiona el estado de forma reactiva.
 */

interface InventoryState {
  products: Product[];
  loading: boolean;
  error: string | null;
  
  // Setters
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Helpers
  getProductByBarcode: (barcode: string) => Product | undefined;
  getLowStockProducts: () => Product[];
  searchProducts: (query: string) => Product[];
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  products: [],
  loading: false,
  error: null,

  setProducts: (products) => set({ products }),
  
  addProduct: (product) => 
    set((state) => ({ 
      products: [...state.products, product] 
    })),
  
  updateProduct: (id, updates) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
  
  removeProduct: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    })),
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Buscar producto por código de barras
  getProductByBarcode: (barcode) => {
    const state = get();
    return state.products.find((p) => p.barcode === barcode);
  },

  // Obtener productos con stock bajo
  getLowStockProducts: () => {
    const state = get();
    return state.products.filter((p) => p.stock <= p.minStock);
  },

  // Buscar productos por nombre o código
  searchProducts: (query) => {
    const state = get();
    const q = query.toLowerCase();
    return state.products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  },
}));
