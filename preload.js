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

  // ============ ANIME STREAMING API (Consumet) ============
  anime: {
    // Get available providers with features
    getProviders: () => 
      ipcRenderer.invoke('anime:getProviders'),
    
    // Search anime
    search: (provider, query, page) => 
      ipcRenderer.invoke('anime:search', { provider, query, page }),
    
    // Get anime info with episodes
    getInfo: (provider, animeId) => 
      ipcRenderer.invoke('anime:getInfo', { provider, animeId }),
    
    // Get episode sources (streaming URLs with proxy URLs)
    getEpisodeSources: (provider, episodeId, server, subOrDub) => 
      ipcRenderer.invoke('anime:getEpisodeSources', { provider, episodeId, server, subOrDub }),
    
    // Get stream proxy port
    getProxyPort: () => 
      ipcRenderer.invoke('anime:getProxyPort'),
    
    // Get episode servers
    getEpisodeServers: (provider, episodeId) => 
      ipcRenderer.invoke('anime:getEpisodeServers', { provider, episodeId }),
    
    // Spotlight content
    getSpotlight: (provider) => 
      ipcRenderer.invoke('anime:getSpotlight', { provider }),
    
    // Top airing
    getTopAiring: (provider, page) => 
      ipcRenderer.invoke('anime:getTopAiring', { provider, page }),
    
    // Most popular
    getMostPopular: (provider, page) => 
      ipcRenderer.invoke('anime:getMostPopular', { provider, page }),
    
    // Most favorite
    getMostFavorite: (provider, page) => 
      ipcRenderer.invoke('anime:getMostFavorite', { provider, page }),
    
    // Latest completed
    getLatestCompleted: (provider, page) => 
      ipcRenderer.invoke('anime:getLatestCompleted', { provider, page }),
    
    // Recently updated
    getRecentlyUpdated: (provider, page) => 
      ipcRenderer.invoke('anime:getRecentlyUpdated', { provider, page }),
    
    // Recently added
    getRecentlyAdded: (provider, page) => 
      ipcRenderer.invoke('anime:getRecentlyAdded', { provider, page }),
    
    // Top upcoming
    getTopUpcoming: (provider, page) => 
      ipcRenderer.invoke('anime:getTopUpcoming', { provider, page }),
    
    // Recent episodes (AnimePahe)
    getRecentEpisodes: (provider, page) => 
      ipcRenderer.invoke('anime:getRecentEpisodes', { provider, page }),
    
    // Schedule
    getSchedule: (provider, date) => 
      ipcRenderer.invoke('anime:getSchedule', { provider, date }),
    
    // Genres
    getGenres: (provider) => 
      ipcRenderer.invoke('anime:getGenres', { provider }),
    
    // Genre search
    genreSearch: (provider, genre, page) => 
      ipcRenderer.invoke('anime:genreSearch', { provider, genre, page }),
    
    // Advanced search
    advancedSearch: (provider, options) => 
      ipcRenderer.invoke('anime:advancedSearch', { provider, options }),
    
    // Search suggestions
    searchSuggestions: (provider, query) => 
      ipcRenderer.invoke('anime:searchSuggestions', { provider, query }),
    
    // M3U8 proxy (for streaming)
    proxyM3U8: (url, headers) => 
      ipcRenderer.invoke('anime:proxyM3U8', { url, headers }),
    
    // Video segment proxy
    proxySegment: (url, headers) => 
      ipcRenderer.invoke('anime:proxySegment', { url, headers }),
    
    // Image proxy
    proxyImage: (imageUrl, provider) => 
      ipcRenderer.invoke('anime:proxyImage', { imageUrl, provider }),
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
  
  // System
  system: {
    onUninstallRequest: (callback) => {
      const handler = (_event, ...args) => callback(...args);
      ipcRenderer.on('system:uninstall-request', handler);
      // Return cleanup function
      return () => ipcRenderer.removeListener('system:uninstall-request', handler);
    },
    confirmUninstall: () => ipcRenderer.invoke('system:confirm-uninstall'),
  }
});
