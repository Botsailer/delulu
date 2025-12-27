// API Service - Uses IPC to communicate with main process
// All actual network requests are made in main.js (hidden from users)

// Check if we're in Electron with preload script
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI;
};

// Fallback for development without Electron (e.g., browser testing)
const API_CONFIG = {
  JIKAN_BASE_URL: 'https://api.jikan.moe/v4',
  ANILIST_BASE_URL: 'https://graphql.anilist.co',
  REQUEST_DELAY: 350,
};

let lastRequestTime = 0;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fallback fetch for development (visible in DevTools - only used in dev)
const fallbackFetch = async (url, options = {}, retries = 3) => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < API_CONFIG.REQUEST_DELAY) {
    await sleep(API_CONFIG.REQUEST_DELAY - timeSinceLastRequest);
  }
  
  lastRequestTime = Date.now();
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (response.status === 429 && retries > 0) {
      await sleep(1000);
      return fallbackFetch(url, options, retries - 1);
    }
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    if (retries > 0) {
      await sleep(500 * (4 - retries));
      return fallbackFetch(url, options, retries - 1);
    }
    throw error;
  }
};

// Jikan API (MyAnimeList data)
// Uses IPC when in Electron, fallback fetch when in browser
export const jikanApi = {
  getTopAnime: (page = 1, limit = 25, filter = '') => {
    if (isElectron()) {
      return window.electronAPI.api.getTopAnime(page, limit, filter);
    }
    return fallbackFetch(
      `${API_CONFIG.JIKAN_BASE_URL}/top/anime?page=${page}&limit=${limit}${filter ? `&filter=${filter}` : ''}`
    );
  },
  
  getTopManga: (page = 1, limit = 25) => {
    if (isElectron()) {
      return window.electronAPI.api.getTopManga(page, limit, '');
    }
    return fallbackFetch(
      `${API_CONFIG.JIKAN_BASE_URL}/top/manga?page=${page}&limit=${limit}`
    );
  },
  
  searchAnime: (query, page = 1, limit = 25) => {
    if (isElectron()) {
      return window.electronAPI.api.searchAnime(query, page, limit);
    }
    return fallbackFetch(
      `${API_CONFIG.JIKAN_BASE_URL}/anime?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
  },
  
  searchManga: (query, page = 1, limit = 25) => {
    if (isElectron()) {
      return window.electronAPI.api.searchManga(query, page, limit);
    }
    return fallbackFetch(
      `${API_CONFIG.JIKAN_BASE_URL}/manga?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
  },
  
  getAnimeById: (id) => {
    if (isElectron()) {
      return window.electronAPI.api.getAnimeById(id);
    }
    return fallbackFetch(`${API_CONFIG.JIKAN_BASE_URL}/anime/${id}/full`);
  },
  
  getMangaById: (id) => {
    if (isElectron()) {
      return window.electronAPI.api.getMangaById(id);
    }
    return fallbackFetch(`${API_CONFIG.JIKAN_BASE_URL}/manga/${id}/full`);
  },
  
  getAnimeCharacters: (id) => {
    if (isElectron()) {
      return window.electronAPI.api.getAnimeCharacters(id);
    }
    return fallbackFetch(`${API_CONFIG.JIKAN_BASE_URL}/anime/${id}/characters`);
  },
  
  getAnimeEpisodes: (id, page = 1) => {
    if (isElectron()) {
      return window.electronAPI.api.getAnimeEpisodes(id, page);
    }
    return fallbackFetch(`${API_CONFIG.JIKAN_BASE_URL}/anime/${id}/episodes?page=${page}`);
  },
  
  getSeasonalAnime: (year, season, page = 1) => {
    if (isElectron()) {
      return window.electronAPI.api.getSeasonalAnime(year, season, page);
    }
    return fallbackFetch(
      `${API_CONFIG.JIKAN_BASE_URL}/seasons/${year}/${season}?page=${page}`
    );
  },
  
  getCurrentSeason: (page = 1) => {
    if (isElectron()) {
      return window.electronAPI.api.getCurrentSeason(page);
    }
    return fallbackFetch(`${API_CONFIG.JIKAN_BASE_URL}/seasons/now?page=${page}`);
  },
  
  getUpcomingAnime: (page = 1) => {
    if (isElectron()) {
      return window.electronAPI.api.getUpcomingAnime(page);
    }
    return fallbackFetch(`${API_CONFIG.JIKAN_BASE_URL}/seasons/upcoming?page=${page}`);
  },
  
  getGenres: (type = 'anime') => {
    if (isElectron()) {
      return window.electronAPI.api.getGenres(type);
    }
    return fallbackFetch(`${API_CONFIG.JIKAN_BASE_URL}/genres/${type}`);
  },
  
  getAnimeRecommendations: (id) => 
    fallbackFetch(`${API_CONFIG.JIKAN_BASE_URL}/anime/${id}/recommendations`),
  
  getSchedule: (day) => 
    fallbackFetch(`${API_CONFIG.JIKAN_BASE_URL}/schedules${day ? `?filter=${day}` : ''}`),
};

// AniList GraphQL API
const ANILIST_QUERY = `
  query ($page: Int, $perPage: Int, $sort: [MediaSort]) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
      }
      media(sort: $sort, type: ANIME) {
        id
        idMal
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          medium
        }
        bannerImage
        description
        episodes
        status
        genres
        averageScore
        popularity
        season
        seasonYear
        format
        studios {
          nodes {
            name
          }
        }
      }
    }
  }
`;

export const anilistApi = {
  getTrending: async (page = 1, perPage = 20) => {
    if (isElectron()) {
      return window.electronAPI.api.getTrendingAnilist(page, perPage);
    }
    // Fallback for browser
    const response = await fetch(API_CONFIG.ANILIST_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: ANILIST_QUERY,
        variables: { page, perPage, sort: ['TRENDING_DESC'] },
      }),
    });
    return response.json();
  },
  
  getPopular: async (page = 1, perPage = 20) => {
    if (isElectron()) {
      return window.electronAPI.api.getPopularAnilist(page, perPage);
    }
    const response = await fetch(API_CONFIG.ANILIST_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: ANILIST_QUERY,
        variables: { page, perPage, sort: ['POPULARITY_DESC'] },
      }),
    });
    return response.json();
  },
  
  search: async (query, page = 1, perPage = 20) => {
    if (isElectron()) {
      return window.electronAPI.api.searchAnilist(query, page, perPage);
    }
    const searchQuery = `
      query ($search: String, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { total currentPage lastPage hasNextPage }
          media(search: $search, type: ANIME) {
            id idMal title { romaji english } coverImage { large medium }
            description episodes status genres averageScore
          }
        }
      }
    `;
    const response = await fetch(API_CONFIG.ANILIST_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery,
        variables: { search: query, page, perPage },
      }),
    });
    return response.json();
  },
};

// Consumet API for streaming (keeping original implementation)
const CONSUMET_BASE = 'https://api.consumet.org';

export const consumetApi = {
  searchAnime: (query, provider = 'gogoanime') => 
    fallbackFetch(`${CONSUMET_BASE}/anime/${provider}/${encodeURIComponent(query)}`),
  
  getAnimeInfo: (id, provider = 'gogoanime') => 
    fallbackFetch(`${CONSUMET_BASE}/anime/${provider}/info/${id}`),
  
  getEpisodeSources: (episodeId, provider = 'gogoanime') => 
    fallbackFetch(`${CONSUMET_BASE}/anime/${provider}/watch/${episodeId}`),
  
  searchManga: (query, provider = 'mangadex') => 
    fallbackFetch(`${CONSUMET_BASE}/manga/${provider}/${encodeURIComponent(query)}`),
  
  getMangaInfo: (id, provider = 'mangadex') => 
    fallbackFetch(`${CONSUMET_BASE}/manga/${provider}/info/${id}`),
  
  getChapterPages: (chapterId, provider = 'mangadex') => 
    fallbackFetch(`${CONSUMET_BASE}/manga/${provider}/read/${chapterId}`),
};

// ============ ANIME STREAMING API (via IPC) ============
// Uses @consumet/extensions on the main process for M3U8 streaming

export const animeStreamingApi = {
  // Get available providers with features
  getProviders: () => {
    if (isElectron()) {
      return window.electronAPI.anime.getProviders();
    }
    return Promise.resolve([]);
  },

  // Search anime
  search: (provider, query, page = 1) => {
    if (isElectron()) {
      return window.electronAPI.anime.search(provider, query, page);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Get anime info with episodes
  getInfo: (provider, animeId) => {
    if (isElectron()) {
      return window.electronAPI.anime.getInfo(provider, animeId);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Get episode sources (streaming URLs)
  getEpisodeSources: (provider, episodeId, server, subOrDub = 'sub') => {
    if (isElectron()) {
      return window.electronAPI.anime.getEpisodeSources(provider, episodeId, server, subOrDub);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Get episode servers
  getEpisodeServers: (provider, episodeId) => {
    if (isElectron()) {
      return window.electronAPI.anime.getEpisodeServers(provider, episodeId);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Spotlight content
  getSpotlight: (provider = 'p1') => {
    if (isElectron()) {
      return window.electronAPI.anime.getSpotlight(provider);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Top airing
  getTopAiring: (provider = 'p1', page = 1) => {
    if (isElectron()) {
      return window.electronAPI.anime.getTopAiring(provider, page);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Most popular
  getMostPopular: (provider = 'p1', page = 1) => {
    if (isElectron()) {
      return window.electronAPI.anime.getMostPopular(provider, page);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Most favorite
  getMostFavorite: (provider = 'p1', page = 1) => {
    if (isElectron()) {
      return window.electronAPI.anime.getMostFavorite(provider, page);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Latest completed
  getLatestCompleted: (provider = 'p1', page = 1) => {
    if (isElectron()) {
      return window.electronAPI.anime.getLatestCompleted(provider, page);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Recently updated
  getRecentlyUpdated: (provider = 'p1', page = 1) => {
    if (isElectron()) {
      return window.electronAPI.anime.getRecentlyUpdated(provider, page);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Recently added
  getRecentlyAdded: (provider = 'p1', page = 1) => {
    if (isElectron()) {
      return window.electronAPI.anime.getRecentlyAdded(provider, page);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Top upcoming
  getTopUpcoming: (provider = 'p1', page = 1) => {
    if (isElectron()) {
      return window.electronAPI.anime.getTopUpcoming(provider, page);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Recent episodes (AnimePahe)
  getRecentEpisodes: (provider = 'p2', page = 1) => {
    if (isElectron()) {
      return window.electronAPI.anime.getRecentEpisodes(provider, page);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Schedule
  getSchedule: (provider = 'p1', date) => {
    if (isElectron()) {
      return window.electronAPI.anime.getSchedule(provider, date);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Genres
  getGenres: (provider = 'p1') => {
    if (isElectron()) {
      return window.electronAPI.anime.getGenres(provider);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Genre search
  genreSearch: (provider, genre, page = 1) => {
    if (isElectron()) {
      return window.electronAPI.anime.genreSearch(provider, genre, page);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Advanced search
  advancedSearch: (provider, options) => {
    if (isElectron()) {
      return window.electronAPI.anime.advancedSearch(provider, options);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Search suggestions
  searchSuggestions: (provider, query) => {
    if (isElectron()) {
      return window.electronAPI.anime.searchSuggestions(provider, query);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // M3U8 proxy
  proxyM3U8: (url, headers) => {
    if (isElectron()) {
      return window.electronAPI.anime.proxyM3U8(url, headers);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Video segment proxy
  proxySegment: (url, headers) => {
    if (isElectron()) {
      return window.electronAPI.anime.proxySegment(url, headers);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Image proxy
  proxyImage: (imageUrl, provider) => {
    if (isElectron()) {
      return window.electronAPI.anime.proxyImage(imageUrl, provider);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Get stream proxy port
  getProxyPort: () => {
    if (isElectron()) {
      return window.electronAPI.anime.getProxyPort();
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },
};

// ============ MOVIE/TV STREAMING API (via IPC) ============
// Uses @consumet/extensions on the main process for M3U8 streaming

export const movieStreamingApi = {
  // Get available providers with features
  getProviders: () => {
    if (isElectron()) {
      return window.electronAPI.movie.getProviders();
    }
    return Promise.resolve([]);
  },

  // Search movies/TV shows
  search: (provider, query, page = 1) => {
    if (isElectron()) {
      return window.electronAPI.movie.search(provider, query, page);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Get movie/TV show info with episodes
  getInfo: (provider, mediaId) => {
    if (isElectron()) {
      return window.electronAPI.movie.getInfo(provider, mediaId);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Get episode sources (streaming URLs)
  getEpisodeSources: (provider, episodeId, mediaId, server) => {
    if (isElectron()) {
      return window.electronAPI.movie.getEpisodeSources(provider, episodeId, mediaId, server);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Get episode servers
  getEpisodeServers: (provider, episodeId, mediaId) => {
    if (isElectron()) {
      return window.electronAPI.movie.getEpisodeServers(provider, episodeId, mediaId);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Spotlight content
  getSpotlight: (provider = 'm1') => {
    if (isElectron()) {
      return window.electronAPI.movie.getSpotlight(provider);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Trending movies
  getTrendingMovies: (provider = 'm1') => {
    if (isElectron()) {
      return window.electronAPI.movie.getTrendingMovies(provider);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Trending TV shows
  getTrendingTvShows: (provider = 'm1') => {
    if (isElectron()) {
      return window.electronAPI.movie.getTrendingTvShows(provider);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Recent movies
  getRecentMovies: (provider = 'm1') => {
    if (isElectron()) {
      return window.electronAPI.movie.getRecentMovies(provider);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Recent TV shows
  getRecentTvShows: (provider = 'm1') => {
    if (isElectron()) {
      return window.electronAPI.movie.getRecentTvShows(provider);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // By country
  getByCountry: (provider, country, page = 1) => {
    if (isElectron()) {
      return window.electronAPI.movie.getByCountry(provider, country, page);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // By genre
  getByGenre: (provider, genre, page = 1) => {
    if (isElectron()) {
      return window.electronAPI.movie.getByGenre(provider, genre, page);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },

  // Image proxy
  proxyImage: (imageUrl, provider) => {
    if (isElectron()) {
      return window.electronAPI.movie.proxyImage(imageUrl, provider);
    }
    return Promise.resolve({ success: false, error: 'Not in Electron' });
  },
};
