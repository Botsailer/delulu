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
