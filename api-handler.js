// API Handler - Runs in Main Process (Hidden from users)
// All network requests are made here, completely hidden from DevTools
// Images are proxied and converted to base64 - no external URLs exposed

const API_CONFIG = {
  JIKAN_BASE: 'https://api.jikan.moe/v4',
  ANILIST_BASE: 'https://graphql.anilist.co',
  REQUEST_DELAY: 350,
};

// Rate limiting
let lastRequestTime = 0;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ============ IMAGE CACHING AND PROXYING ============
const imageCache = new Map();
const MAX_CACHE_SIZE = 1000;
const pendingRequests = new Map(); // Deduplicate concurrent requests

// Proxy a single image URL to base64
const proxyImageUrl = async (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') return imageUrl;
  if (imageUrl.startsWith('data:')) return imageUrl; // Already proxied
  
  // Check cache
  if (imageCache.has(imageUrl)) {
    return imageCache.get(imageUrl);
  }
  
  // Check if request is already pending
  if (pendingRequests.has(imageUrl)) {
    return pendingRequests.get(imageUrl);
  }
  
  const requestPromise = (async () => {
    try {
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        },
      });
      
      if (!response.ok) return imageUrl; // Return original on failure
      
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const dataUrl = `data:${contentType};base64,${base64}`;
      
      // Cache with size limit
      if (imageCache.size >= MAX_CACHE_SIZE) {
        const firstKey = imageCache.keys().next().value;
        imageCache.delete(firstKey);
      }
      imageCache.set(imageUrl, dataUrl);
      
      return dataUrl;
    } catch (error) {
      return imageUrl; // Return original on error
    } finally {
      pendingRequests.delete(imageUrl);
    }
  })();
  
  pendingRequests.set(imageUrl, requestPromise);
  return requestPromise;
};

// Recursively find and proxy all image URLs in an object
const proxyAllImages = async (obj, depth = 0) => {
  if (depth > 10) return obj; // Prevent infinite recursion
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return Promise.all(obj.map(item => proxyAllImages(item, depth + 1)));
  }
  
  const result = { ...obj };
  const imagePromises = [];
  
  for (const [key, value] of Object.entries(result)) {
    // Check if this looks like an image URL field
    const isImageField = key.includes('image') || key.includes('Image') || 
                         key.includes('cover') || key.includes('Cover') ||
                         key.includes('banner') || key.includes('Banner') ||
                         key.includes('poster') || key.includes('Poster') ||
                         key === 'jpg' || key === 'webp' || key === 'png';
    
    if (typeof value === 'string' && 
        (value.includes('http') && (value.includes('.jpg') || value.includes('.png') || 
         value.includes('.webp') || value.includes('.gif') || value.includes('/images/')))) {
      // This is likely an image URL
      imagePromises.push(
        proxyImageUrl(value).then(proxied => { result[key] = proxied; })
      );
    } else if (typeof value === 'object' && value !== null) {
      imagePromises.push(
        proxyAllImages(value, depth + 1).then(proxied => { result[key] = proxied; })
      );
    }
  }
  
  await Promise.all(imagePromises);
  return result;
};

// Hidden fetch - users cannot see these requests
// proxyImages: if true, all image URLs in response will be converted to base64
const hiddenFetch = async (url, options = {}, retries = 3, proxyImages = true) => {
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
        'User-Agent': 'DeluluApp/1.0',
        ...options.headers,
      },
    });
    
    if (response.status === 429 && retries > 0) {
      await sleep(1000);
      return hiddenFetch(url, options, retries - 1, proxyImages);
    }
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Proxy all images in the response
    if (proxyImages) {
      return proxyAllImages(data);
    }
    
    return data;
  } catch (error) {
    if (retries > 0 && error.name !== 'AbortError') {
      await sleep(500 * (4 - retries));
      return hiddenFetch(url, options, retries - 1, proxyImages);
    }
    throw error;
  }
};

// GraphQL fetch for AniList (with image proxying)
const graphqlFetch = async (query, variables = {}, proxyImages = true) => {
  const response = await fetch(API_CONFIG.ANILIST_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  
  if (!response.ok) {
    throw new Error(`AniList API Error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (proxyImages) {
    return proxyAllImages(data);
  }
  
  return data;
};

// AniList GraphQL Queries
const ANILIST_QUERIES = {
  trending: `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(sort: TRENDING_DESC, type: ANIME) {
          id idMal title { romaji english native }
          coverImage { large medium }
          bannerImage description episodes status
          genres averageScore popularity season seasonYear
          format studios { nodes { name } }
        }
      }
    }
  `,
  popular: `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(sort: POPULARITY_DESC, type: ANIME) {
          id idMal title { romaji english native }
          coverImage { large medium }
          bannerImage description episodes status
          genres averageScore popularity season seasonYear
        }
      }
    }
  `,
  search: `
    query ($search: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(search: $search, type: ANIME) {
          id idMal title { romaji english native }
          coverImage { large medium }
          description episodes status genres averageScore
        }
      }
    }
  `,
};

// Register all IPC handlers
export function registerAPIHandlers(ipcMain) {
  // ============ JIKAN API HANDLERS ============
  
  ipcMain.handle('api:getTopAnime', async (event, { page = 1, limit = 25, filter = '' }) => {
    const url = `${API_CONFIG.JIKAN_BASE}/top/anime?page=${page}&limit=${limit}${filter ? `&filter=${filter}` : ''}`;
    return hiddenFetch(url);
  });
  
  ipcMain.handle('api:getTopManga', async (event, { page = 1, limit = 25, filter = '' }) => {
    const url = `${API_CONFIG.JIKAN_BASE}/top/manga?page=${page}&limit=${limit}${filter ? `&filter=${filter}` : ''}`;
    return hiddenFetch(url);
  });
  
  ipcMain.handle('api:searchAnime', async (event, { query, page = 1, limit = 25 }) => {
    const url = `${API_CONFIG.JIKAN_BASE}/anime?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
    return hiddenFetch(url);
  });
  
  ipcMain.handle('api:searchManga', async (event, { query, page = 1, limit = 25 }) => {
    const url = `${API_CONFIG.JIKAN_BASE}/manga?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
    return hiddenFetch(url);
  });
  
  ipcMain.handle('api:getAnimeById', async (event, { id }) => {
    const url = `${API_CONFIG.JIKAN_BASE}/anime/${id}/full`;
    return hiddenFetch(url);
  });
  
  ipcMain.handle('api:getMangaById', async (event, { id }) => {
    const url = `${API_CONFIG.JIKAN_BASE}/manga/${id}/full`;
    return hiddenFetch(url);
  });
  
  ipcMain.handle('api:getCurrentSeason', async (event, { page = 1 }) => {
    const url = `${API_CONFIG.JIKAN_BASE}/seasons/now?page=${page}`;
    return hiddenFetch(url);
  });
  
  ipcMain.handle('api:getUpcomingAnime', async (event, { page = 1 }) => {
    const url = `${API_CONFIG.JIKAN_BASE}/seasons/upcoming?page=${page}`;
    return hiddenFetch(url);
  });
  
  ipcMain.handle('api:getSeasonalAnime', async (event, { year, season, page = 1 }) => {
    const url = `${API_CONFIG.JIKAN_BASE}/seasons/${year}/${season}?page=${page}`;
    return hiddenFetch(url);
  });
  
  ipcMain.handle('api:getAnimeCharacters', async (event, { id }) => {
    const url = `${API_CONFIG.JIKAN_BASE}/anime/${id}/characters`;
    return hiddenFetch(url);
  });
  
  ipcMain.handle('api:getAnimeEpisodes', async (event, { id, page = 1 }) => {
    const url = `${API_CONFIG.JIKAN_BASE}/anime/${id}/episodes?page=${page}`;
    return hiddenFetch(url);
  });
  
  ipcMain.handle('api:getGenres', async (event, { type = 'anime' }) => {
    const url = `${API_CONFIG.JIKAN_BASE}/genres/${type}`;
    return hiddenFetch(url);
  });
  
  // ============ ANILIST API HANDLERS ============
  
  ipcMain.handle('api:getTrendingAnilist', async (event, { page = 1, perPage = 20 }) => {
    return graphqlFetch(ANILIST_QUERIES.trending, { page, perPage });
  });
  
  ipcMain.handle('api:getPopularAnilist', async (event, { page = 1, perPage = 20 }) => {
    return graphqlFetch(ANILIST_QUERIES.popular, { page, perPage });
  });
  
  ipcMain.handle('api:searchAnilist', async (event, { query, page = 1, perPage = 20 }) => {
    return graphqlFetch(ANILIST_QUERIES.search, { search: query, page, perPage });
  });

  // ============ IMAGE PROXY - All images loaded server-side ============
  
  // Memory cache for images (with LRU-like behavior)
  const imageCache = new Map();
  const MAX_CACHE_SIZE = 500;
  
  const proxyImage = async (imageUrl) => {
    if (!imageUrl) return null;
    
    // Check cache first
    if (imageCache.has(imageUrl)) {
      return imageCache.get(imageUrl);
    }
    
    try {
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Referer': new URL(imageUrl).origin,
        },
      });
      
      if (!response.ok) {
        return null;
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const dataUrl = `data:${contentType};base64,${base64}`;
      
      // Add to cache (with size limit)
      if (imageCache.size >= MAX_CACHE_SIZE) {
        // Remove oldest entry
        const firstKey = imageCache.keys().next().value;
        imageCache.delete(firstKey);
      }
      imageCache.set(imageUrl, dataUrl);
      
      return dataUrl;
    } catch (error) {
      return null;
    }
  };
  
  // Proxy single image
  ipcMain.handle('api:proxyImage', async (event, { imageUrl }) => {
    const result = await proxyImage(imageUrl);
    return { success: !!result, data: result };
  });
  
  // Proxy multiple images in parallel (for batch loading)
  ipcMain.handle('api:proxyImages', async (event, { imageUrls }) => {
    const results = await Promise.all(
      imageUrls.map(async (url) => {
        const data = await proxyImage(url);
        return { url, data, success: !!data };
      })
    );
    return { success: true, data: results };
  });
}
