import { create } from 'zustand';
import { Investment } from '../../core/types';

/**
 * Store de Zustand para finanzas (inversiones y ganancias).
 */

interface FinanceState {
  investments: Investment[];
  loading: boolean;
  error: string | null;
  
  setInvestments: (investments: Investment[]) => void;
  addInvestment: (investment: Investment) => void;
  removeInvestment: (id: string) => void;
  
  // Cálculos
  getTotalInvestment: () => number;
  getInvestmentsByDateRange: (startDate: Date, endDate: Date) => Investment[];
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  investments: [],
  loading: false,
  error: null,

  setInvestments: (investments) => set({ investments }),

  addInvestment: (investment) =>
    set((state) => ({ investments: [...state.investments, investment] })),

  removeInvestment: (id) =>
    set((state) => ({
      investments: state.investments.filter((i) => i.id !== id),
    })),

  getTotalInvestment: () => {
    const state = get();
    return state.investments.reduce((sum, inv) => sum + inv.amount, 0);
  },

  getInvestmentsByDateRange: (startDate, endDate) => {
    const state = get();
    return state.investments.filter(
      (inv) => inv.date >= startDate && inv.date <= endDate
    );
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
