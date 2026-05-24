import { create } from 'zustand';

export const useBusinessStore = create((set, get) => ({
  businesses: [],
  currentBusiness: null,
  aiDecisions: [],
  isLoading: false,
  error: null,

  fetchBusinesses: async () => {
    set({ isLoading: true });
    try {
      // Mock data - replace with real API call to functions/
      const mockBusinesses = [
        { id: 1, name: 'AI SaaS Tool', status: 'deployed', progress: 85 },
        { id: 2, name: 'Ecommerce Store', status: 'running', progress: 60 }
      ];
      set({ businesses: mockBusinesses, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  createBusiness: (idea) => {
    const newBusiness = {
      id: Date.now(),
      name: idea.substring(0, 30) + '...',
      status: 'generating',
      progress: 10,
      idea
    };
    set((state) => ({
      businesses: [...state.businesses, newBusiness],
      currentBusiness: newBusiness,
      aiDecisions: [...state.aiDecisions, {
        timestamp: new Date().toISOString(),
        action: 'Started business creation',
        details: idea
      }]
    }));
    // Here you would call the Deno function
  },

  updateBusiness: (id, updates) => {
    set((state) => ({
      businesses: state.businesses.map(b => b.id === id ? { ...b, ...updates } : b),
      currentBusiness: state.currentBusiness?.id === id ? { ...state.currentBusiness, ...updates } : state.currentBusiness
    }));
  },

  addAIDecision: (action, details) => {
    set((state) => ({
      aiDecisions: [...state.aiDecisions, {
        timestamp: new Date().toISOString(),
        action,
        details
      }]
    }));
  }
}));