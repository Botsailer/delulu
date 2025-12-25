// Preload script - runs in isolated context
// Exposes safe IPC methods to renderer without exposing Node.js

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  
  // ============ ANIME/JIKAN API ============
  api: {
    getTopAnime: (page, limit, filter) => 
      ipcRenderer.invoke('api:getTopAnime', { page, limit, filter }),
    
    getTopManga: (page, limit, filter) => 
      ipcRenderer.invoke('api:getTopManga', { page, limit, filter }),
    
    searchAnime: (query, page, limit) => 
      ipcRenderer.invoke('api:searchAnime', { query, page, limit }),
    
    searchManga: (query, page, limit) => 
      ipcRenderer.invoke('api:searchManga', { query, page, limit }),
    
    getAnimeById: (id) => 
      ipcRenderer.invoke('api:getAnimeById', { id }),
    
    getMangaById: (id) => 
      ipcRenderer.invoke('api:getMangaById', { id }),
    
    getCurrentSeason: (page) => 
      ipcRenderer.invoke('api:getCurrentSeason', { page }),
    
    getUpcomingAnime: (page) => 
      ipcRenderer.invoke('api:getUpcomingAnime', { page }),
    
    getSeasonalAnime: (year, season, page) => 
      ipcRenderer.invoke('api:getSeasonalAnime', { year, season, page }),
    
    getAnimeCharacters: (id) => 
      ipcRenderer.invoke('api:getAnimeCharacters', { id }),
    
    getAnimeEpisodes: (id, page) => 
      ipcRenderer.invoke('api:getAnimeEpisodes', { id, page }),
    
    getGenres: (type) => 
      ipcRenderer.invoke('api:getGenres', { type }),
    
    // AniList API
    getTrendingAnilist: (page, perPage) => 
      ipcRenderer.invoke('api:getTrendingAnilist', { page, perPage }),
    
    getPopularAnilist: (page, perPage) => 
      ipcRenderer.invoke('api:getPopularAnilist', { page, perPage }),
    
    searchAnilist: (query, page, perPage) => 
      ipcRenderer.invoke('api:searchAnilist', { query, page, perPage }),
  },
  
  // ============ MANGA API (Consumet) ============
  manga: {
    // Get available providers
    getProviders: () => 
      ipcRenderer.invoke('manga:getProviders'),
    
    // Search manga
    search: (provider, query, page) => 
      ipcRenderer.invoke('manga:search', { provider, query, page }),
    
    // Get manga info with chapters
    getInfo: (provider, mangaId) => 
      ipcRenderer.invoke('manga:getInfo', { provider, mangaId }),
    
    // Get chapter pages
    getChapterPages: (provider, chapterId) => 
      ipcRenderer.invoke('manga:getChapterPages', { provider, chapterId }),
    
    // MangaDex: Get popular manga
    getPopular: (page, limit) => 
      ipcRenderer.invoke('manga:getPopular', { page, limit }),
    
    // MangaDex: Get latest updates
    getLatestUpdates: (page, limit) => 
      ipcRenderer.invoke('manga:getLatestUpdates', { page, limit }),
    
    // MangaDex: Get recently added
    getRecentlyAdded: (page, limit) => 
      ipcRenderer.invoke('manga:getRecentlyAdded', { page, limit }),
    
    // MangaDex: Get random manga
    getRandom: () => 
      ipcRenderer.invoke('manga:getRandom'),
    
    // Get trending manga
    getTrending: (page) => 
      ipcRenderer.invoke('manga:getTrending', { page }),
    
    // Proxy single image (with correct referrer)
    proxyImage: (imageUrl, provider, headers) => 
      ipcRenderer.invoke('manga:proxyImage', { imageUrl, provider, headers }),
    
    // Proxy multiple images (for chapter reading)
    proxyImages: (images, provider) => 
      ipcRenderer.invoke('manga:proxyImages', { images, provider }),
  },
  
  // ============ IMAGE PROXY (for all images) ============
  images: {
    // Proxy a single image URL to base64
    proxy: (imageUrl) => 
      ipcRenderer.invoke('api:proxyImage', { imageUrl }),
    
    // Proxy multiple images in parallel
    proxyBatch: (imageUrls) => 
      ipcRenderer.invoke('api:proxyImages', { imageUrls }),
  },
  
  // App info
  isPackaged: process.env.NODE_ENV === 'production',
});
