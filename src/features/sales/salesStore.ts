import { create } from 'zustand';
import { SaleItem, Sale } from '../../core/types';

/**
 * Store de Zustand para gestionar el estado de ventas y carrito.
 */

interface SalesState {
  // Carrito actual
  cart: SaleItem[];
  
  // Historial de ventas
  sales: Sale[];
  
  // Estado
  loading: boolean;
  error: string | null;
  
  // Métodos del carrito
  addToCart: (item: SaleItem) => void;
  removeFromCart: (productId: string) => void;
  updateCartItem: (productId: string, qty: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartTotalCost: () => number;
  getCartProfit: () => number;
  
  // Métodos de historial
  setSales: (sales: Sale[]) => void;
  addSale: (sale: Sale) => void;
  
  // Estado
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSalesStore = create<SalesState>((set, get) => ({
  cart: [],
  sales: [],
  loading: false,
  error: null,

  addToCart: (item) =>
    set((state) => {
      const existing = state.cart.find((i) => i.productId === item.productId);
      if (existing) {
        return {
          cart: state.cart.map((i) =>
            i.productId === item.productId
              ? { ...i, qty: i.qty + item.qty }
              : i
          ),
        };
      }
      return { cart: [...state.cart, item] };
    }),

  removeFromCart: (productId) =>
    set((state) => ({
      cart: state.cart.filter((i) => i.productId !== productId),
    })),

  updateCartItem: (productId, qty) =>
    set((state) => ({
      cart: state.cart.map((i) =>
        i.productId === productId ? { ...i, qty } : i
      ).filter(i => i.qty > 0),
    })),

  clearCart: () => set({ cart: [] }),

  getCartTotal: () => {
    const state = get();
    return state.cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  },

  getCartTotalCost: () => {
    const state = get();
    return state.cart.reduce((sum, item) => sum + item.unitCost * item.qty, 0);
  },

  getCartProfit: () => {
    const state = get();
    return state.getCartTotal() - state.getCartTotalCost();
  },

  setSales: (sales) => set({ sales }),

  addSale: (sale) =>
    set((state) => ({ sales: [...state.sales, sale] })),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
