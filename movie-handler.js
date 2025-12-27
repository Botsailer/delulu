// Movie Handler - Uses @consumet/extensions for movie/TV streaming
// All requests made server-side, M3U8 streams proxied with correct headers
// Reuses the stream proxy from anime-handler

import { MOVIES } from '@consumet/extensions';
import { getStreamProxyPort } from './anime-handler.js';

// Create persistent provider instances
const PROVIDER_INSTANCES = {
  m1: new MOVIES.HiMovies(),
  m2: new MOVIES.FlixHQ(),
  m3: new MOVIES.Goku(),
  m4: new MOVIES.SFlix(),
};

// Provider metadata - features available per provider
const PROVIDER_META = {
  m1: {
    name: 'Server 1',
    hasSpotlight: false,
    hasTrendingMovies: true,
    hasTrendingTvShows: true,
    hasRecentMovies: true,
    hasRecentTvShows: true,
    hasByCountry: true,
    hasByGenre: true,
    language: 'en',
  },
  m2: {
    name: 'Server 2',
    hasSpotlight: true,
    hasTrendingMovies: true,
    hasTrendingTvShows: true,
    hasRecentMovies: true,
    hasRecentTvShows: true,
    hasByCountry: true,
    hasByGenre: true,
    language: 'en',
  },
  m3: {
    name: 'Server 3',
    hasSpotlight: false,
    hasTrendingMovies: true,
    hasTrendingTvShows: true,
    hasRecentMovies: true,
    hasRecentTvShows: true,
    hasByCountry: true,
    hasByGenre: true,
    language: 'en',
  },
  m4: {
    name: 'Server 4',
    hasSpotlight: true,
    hasTrendingMovies: true,
    hasTrendingTvShows: true,
    hasRecentMovies: true,
    hasRecentTvShows: true,
    hasByCountry: true,
    hasByGenre: true,
    language: 'en',
  },
};

// Referer URLs for streaming
const REFERER_URLS = {
  m1: 'https://himovies.sx/',
  m2: 'https://flixhq.to/',
  m3: 'https://goku.sx/',
  m4: 'https://sflix.ps/',
};

// Image host specific referers
const IMAGE_HOST_REFERERS = {
  'img.flixhq.to': ['https://flixhq.to/'],
  'img.himovies.sx': ['https://himovies.sx/'],
  'img.goku.sx': ['https://goku.sx/'],
  'img.sflix.to': ['https://sflix.ps/', 'https://sflix.to/'],
  'img.sflix.ps': ['https://sflix.ps/'],
};

// Get provider instance
const getProvider = (providerId = 'm1') => {
  const provider = PROVIDER_INSTANCES[providerId.toLowerCase()];
  if (!provider) {
    throw new Error(`Invalid provider: ${providerId}`);
  }
  return provider;
};

// Get referer for provider
const getReferer = (providerId = 'm1') => {
  return REFERER_URLS[providerId.toLowerCase()] || REFERER_URLS.m1;
};

// ============ IMAGE PROXY FOR MOVIES ============
const movieImageCache = new Map();
const MAX_CACHE = 500;
const pendingImageRequests = new Map();

const proxyMovieImage = async (imageUrl, provider = 'm1') => {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  if (imageUrl.startsWith('data:')) return imageUrl;

  // Check cache
  if (movieImageCache.has(imageUrl)) {
    return movieImageCache.get(imageUrl);
  }

  // Dedupe concurrent requests
  if (pendingImageRequests.has(imageUrl)) {
    return pendingImageRequests.get(imageUrl);
  }

  const requestPromise = (async () => {
    try {
      // Extract hostname for host-specific referers
      let hostname = '';
      try {
        hostname = new URL(imageUrl).hostname;
      } catch (e) {}
      
      // Get host-specific referers if available
      const hostReferers = IMAGE_HOST_REFERERS[hostname] || [];
      
      const refererCandidates = [
        ...hostReferers,
        getReferer(provider),
        'https://flixhq.to/',
        '',
      ];
      
      // Deduplicate
      const uniqueReferers = [...new Set(refererCandidates)];
      
      let response = null;
      let success = false;
      
      for (const referer of uniqueReferers) {
        try {
          const fetchOptions = {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
              'Sec-Fetch-Dest': 'image',
              'Sec-Fetch-Mode': 'no-cors',
              'Sec-Fetch-Site': 'cross-site',
            },
          };
          
          if (referer) {
            fetchOptions.headers['Referer'] = referer;
            fetchOptions.headers['Origin'] = referer.replace(/\/$/, '');
          }
          
          response = await fetch(imageUrl, fetchOptions);
          
          if (response.ok) {
            success = true;
            break;
          }
        } catch (err) {
          // Continue to next referer
        }
      }
      
      if (!success || !response) {
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const dataUrl = `data:${contentType};base64,${base64}`;

      // Cache with limit
      if (movieImageCache.size >= MAX_CACHE) {
        const firstKey = movieImageCache.keys().next().value;
        movieImageCache.delete(firstKey);
      }
      movieImageCache.set(imageUrl, dataUrl);

      return dataUrl;
    } catch (error) {
      return null;
    } finally {
      pendingImageRequests.delete(imageUrl);
    }
  })();

  pendingImageRequests.set(imageUrl, requestPromise);
  return requestPromise;
};

// Proxy all images in movie results
const proxyMovieResults = async (data, provider = 'm1') => {
  if (!data) return data;

  // Helper to proxy all image fields on an item
  const proxyItemImages = async (item) => {
    const imageFields = ['image', 'cover', 'poster', 'banner', 'thumbnail', 'img', 'backdrop'];
    for (const field of imageFields) {
      if (item[field]) {
        item[field] = await proxyMovieImage(item[field], provider);
      }
    }
    return item;
  };

  // Handle results array
  if (data.results && Array.isArray(data.results)) {
    data.results = await Promise.all(data.results.map(proxyItemImages));
  }

  // Handle single item
  await proxyItemImages(data);

  // Handle episodes array (for TV series)
  if (data.episodes && Array.isArray(data.episodes)) {
    data.episodes = await Promise.all(data.episodes.map(proxyItemImages));
  }

  // Handle recommendations array
  if (data.recommendations && Array.isArray(data.recommendations)) {
    data.recommendations = await Promise.all(data.recommendations.map(proxyItemImages));
  }

  return data;
};

// Create proxy URL using anime-handler's proxy server
const createProxyUrl = (targetUrl, referer, origin) => {
  const streamProxyPort = getStreamProxyPort();
  const params = new URLSearchParams();
  params.set('url', targetUrl);
  if (referer) params.set('referer', referer);
  if (origin) params.set('origin', origin);
  return `http://127.0.0.1:${streamProxyPort}/proxy?${params.toString()}`;
};

// Register movie IPC handlers
export function registerMovieHandlers(ipcMain) {
  // Get available providers with their features
  ipcMain.handle('movie:getProviders', async () => {
    return Object.entries(PROVIDER_META).map(([id, meta]) => ({
      id,
      ...meta,
    }));
  });

  // Search movies/TV shows
  ipcMain.handle('movie:search', async (event, { provider = 'm1', query, page = 1 }) => {
    try {
      const movie = getProvider(provider);
      const results = await movie.search(query, page);
      const proxied = await proxyMovieResults(results, provider);
      return { success: true, data: proxied, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // Get movie/TV show info with episodes
  ipcMain.handle('movie:getInfo', async (event, { provider = 'm1', mediaId }) => {
    try {
      if (!mediaId) {
        return { success: false, error: 'No media ID provided' };
      }
      const movie = getProvider(provider);
      const info = await movie.fetchMediaInfo(mediaId);
      const proxied = await proxyMovieResults(info, provider);
      return { success: true, data: proxied, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // Get episode sources (streaming URLs)
  ipcMain.handle('movie:getEpisodeSources', async (event, { provider = 'm1', episodeId, mediaId, server }) => {
    try {
      if (!episodeId || !mediaId) {
        return { success: false, error: 'Invalid episode or media id' };
      }
      
      const movie = getProvider(provider);
      
      let sources;
      try {
        sources = await movie.fetchEpisodeSources(episodeId, mediaId, server);
      } catch (fetchErr) {
        // Try without server as fallback
        try {
          sources = await movie.fetchEpisodeSources(episodeId, mediaId);
        } catch (fallbackErr) {
          return { success: false, error: `Failed to fetch sources: ${fetchErr.message}` };
        }
      }

      if (!sources || (!sources.sources && !sources.source)) {
        return { success: false, error: 'No streaming sources available' };
      }

      // CRITICAL: Use the embed URL as referer, not the provider base URL
      // The headers.Referer from consumet is the embed URL (e.g., https://vidcloud.pro/embed-xxx)
      // This is the URL that the streaming server expects to see as referer
      const referer = sources.headers?.Referer || getReferer(provider);
      
      // Extract origin from referer if not provided
      let origin = sources.headers?.Origin;
      if (!origin && referer) {
        try {
          const refererUrl = new URL(referer);
          origin = `${refererUrl.protocol}//${refererUrl.host}`;
        } catch (e) {
          origin = getReferer(provider).replace(/\/$/, '');
        }
      }

      // Convert all source URLs to proxy URLs
      if (sources.sources && Array.isArray(sources.sources)) {
        sources.sources = sources.sources.map(source => ({
          ...source,
          url: createProxyUrl(source.url, referer, origin),
          originalUrl: source.url,
        }));
      }
      
      // Handle single source field
      if (sources.source) {
        sources.source = createProxyUrl(sources.source, referer, origin);
      }

      // Store the proxy port in the response
      sources.proxyPort = getStreamProxyPort();

      return { success: true, data: sources, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // Get episode servers
  ipcMain.handle('movie:getEpisodeServers', async (event, { provider = 'm1', episodeId, mediaId }) => {
    try {
      if (!episodeId || !mediaId) {
        return { success: false, error: 'No episode/media ID provided' };
      }
      const movie = getProvider(provider);
      
      if (typeof movie.fetchEpisodeServers !== 'function') {
        return { success: false, error: 'Server selection not supported by this provider' };
      }
      
      const servers = await movie.fetchEpisodeServers(episodeId, mediaId);
      return { success: true, data: servers, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // ============ FEATURED CONTENT ============

  // Get spotlight (FlixHQ, SFlix)
  ipcMain.handle('movie:getSpotlight', async (event, { provider = 'm1' }) => {
    try {
      const movie = getProvider(provider);
      if (!PROVIDER_META[provider]?.hasSpotlight || !movie.fetchSpotlight) {
        return { success: false, error: 'Spotlight not supported by this provider' };
      }
      const results = await movie.fetchSpotlight();
      // Wrap in object for consistent structure and proxyMovieResults
      const wrapped = { results: Array.isArray(results) ? results : (results?.results || []) };
      const proxied = await proxyMovieResults(wrapped, provider);
      // Return wrapped in results for consistency
      return { success: true, data: { results: proxied.results }, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // Get trending movies
  ipcMain.handle('movie:getTrendingMovies', async (event, { provider = 'm1' }) => {
    try {
      const movie = getProvider(provider);
      if (!PROVIDER_META[provider]?.hasTrendingMovies || !movie.fetchTrendingMovies) {
        return { success: false, error: 'Trending movies not supported by this provider' };
      }
      const results = await movie.fetchTrendingMovies();
      // Wrap in object for proxyMovieResults
      const wrapped = { results: Array.isArray(results) ? results : [] };
      const proxied = await proxyMovieResults(wrapped, provider);
      // Return wrapped in results for consistency with search/info endpoints
      return { success: true, data: { results: proxied.results }, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // Get trending TV shows
  ipcMain.handle('movie:getTrendingTvShows', async (event, { provider = 'm1' }) => {
    try {
      const movie = getProvider(provider);
      if (!PROVIDER_META[provider]?.hasTrendingTvShows || !movie.fetchTrendingTvShows) {
        return { success: false, error: 'Trending TV shows not supported by this provider' };
      }
      const results = await movie.fetchTrendingTvShows();
      // Wrap in object for proxyMovieResults
      const wrapped = { results: Array.isArray(results) ? results : [] };
      const proxied = await proxyMovieResults(wrapped, provider);
      // Return wrapped in results for consistency with search/info endpoints
      return { success: true, data: { results: proxied.results }, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // Get recent movies
  ipcMain.handle('movie:getRecentMovies', async (event, { provider = 'm1' }) => {
    try {
      const movie = getProvider(provider);
      if (!PROVIDER_META[provider]?.hasRecentMovies || !movie.fetchRecentMovies) {
        return { success: false, error: 'Recent movies not supported by this provider' };
      }
      const results = await movie.fetchRecentMovies();
      // Wrap in object for proxyMovieResults
      const wrapped = { results: Array.isArray(results) ? results : [] };
      const proxied = await proxyMovieResults(wrapped, provider);
      // Return wrapped in results for consistency with search/info endpoints
      return { success: true, data: { results: proxied.results }, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // Get recent TV shows
  ipcMain.handle('movie:getRecentTvShows', async (event, { provider = 'm1' }) => {
    try {
      const movie = getProvider(provider);
      if (!PROVIDER_META[provider]?.hasRecentTvShows || !movie.fetchRecentTvShows) {
        return { success: false, error: 'Recent TV shows not supported by this provider' };
      }
      const results = await movie.fetchRecentTvShows();
      // Wrap in object for proxyMovieResults
      const wrapped = { results: Array.isArray(results) ? results : [] };
      const proxied = await proxyMovieResults(wrapped, provider);
      // Return wrapped in results for consistency with search/info endpoints
      return { success: true, data: { results: proxied.results }, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // Get by country
  ipcMain.handle('movie:getByCountry', async (event, { provider = 'm1', country, page = 1 }) => {
    try {
      const movie = getProvider(provider);
      if (!PROVIDER_META[provider]?.hasByCountry || !movie.fetchByCountry) {
        return { success: false, error: 'By country not supported by this provider' };
      }
      const results = await movie.fetchByCountry(country, page);
      const proxied = await proxyMovieResults(results, provider);
      return { success: true, data: proxied, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // Get by genre
  ipcMain.handle('movie:getByGenre', async (event, { provider = 'm1', genre, page = 1 }) => {
    try {
      const movie = getProvider(provider);
      if (!PROVIDER_META[provider]?.hasByGenre || !movie.fetchByGenre) {
        return { success: false, error: 'By genre not supported by this provider' };
      }
      const results = await movie.fetchByGenre(genre, page);
      const proxied = await proxyMovieResults(results, provider);
      return { success: true, data: proxied, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // ============ PROXY HANDLERS ============

  // Proxy image
  ipcMain.handle('movie:proxyImage', async (event, { imageUrl, provider = 'm1' }) => {
    try {
      const dataUrl = await proxyMovieImage(imageUrl, provider);
      return { success: true, data: dataUrl };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
