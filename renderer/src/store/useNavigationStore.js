import { create } from 'zustand';

export const useNavigationStore = create((set) => ({
  activeTab: 'home',
  selectedManga: null,
  selectedAnime: null,
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  // Navigate to manga screen with pre-selected manga
  navigateToManga: (manga = null) => set({ 
    activeTab: 'manga', 
    selectedManga: manga 
  }),
  
  // Navigate to anime screen with pre-selected anime
  navigateToAnime: (anime = null) => set({ 
    activeTab: 'anime', 
    selectedAnime: anime 
  }),
  
  // Clear selected items
  clearSelected: () => set({ 
    selectedManga: null, 
    selectedAnime: null 
  }),
}));
