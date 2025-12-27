import { create } from 'zustand';

export const useNavigationStore = create((set) => ({
  activeTab: 'home',
  selectedManga: null,
  selectedAnime: null,
  selectedMovie: null,
  selectedProvider: 'p1', // Default anime provider
  selectedMovieProvider: 'm1', // Default movie provider
  
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
  
  // Navigate to movies screen with pre-selected movie and optional provider
  navigateToMovies: (movie = null, provider = 'm1') => set({ 
    activeTab: 'movies', 
    selectedMovie: movie,
    selectedMovieProvider: provider,
  }),
  
  // Clear selected items
  clearSelected: () => set({ 
    selectedManga: null, 
    selectedAnime: null,
    selectedMovie: null,
  }),
}));
