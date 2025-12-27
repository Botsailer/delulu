import { create } from 'zustand';

export const useNavigationStore = create((set) => ({
  activeTab: 'home',
  selectedManga: null,
  selectedAnime: null,
  selectedProvider: 'p1', // Default provider
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  // Simple navigate to tab (backwards compatible)
  navigateTo: (tab) => set({ activeTab: tab }),
  
  // Navigate to manga screen with pre-selected manga
  navigateToManga: (manga = null) => set({ 
    activeTab: 'manga', 
    selectedManga: manga 
  }),
  
  // Navigate to anime screen with pre-selected anime and optional provider
  navigateToAnime: (anime = null, provider = 'p1') => set({ 
    activeTab: 'anime', 
    selectedAnime: anime,
    selectedProvider: provider,
  }),
  
  // Clear selected items
  clearSelected: () => set({ 
    selectedManga: null, 
    selectedAnime: null 
  }),
}));
