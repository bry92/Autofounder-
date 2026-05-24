import { create } from 'zustand';

export const useBusinessStore = create((set, get) => ({
  businesses: [],
  currentBusiness: null,
  aiDecisions: [],
  isLoading: false,
  error: null,

  addBusiness: (business) => set((state) => ({ 
    businesses: [...state.businesses, business] 
  })),
  
  setCurrentBusiness: (business) => set({ currentBusiness: business }),
  
  addAIDecision: (decision) => set((state) => ({
    aiDecisions: [...state.aiDecisions, { ...decision, timestamp: new Date().toISOString() }]
  })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),

  // Simulate fetching businesses
  fetchBusinesses: async () => {
    set({ isLoading: true });
    try {
      // In real app, call API or functions/
      const mockBusinesses = [
        { id: 1, name: 'EcoTech Solutions', status: 'building', progress: 65 },
        { id: 2, name: 'AI Content Agency', status: 'deployed', progress: 100 }
      ];
      set({ businesses: mockBusinesses });
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  }
}));
