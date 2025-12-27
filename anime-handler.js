// Anime Handler - Uses @consumet/extensions for anime streaming
// All requests made server-side, M3U8 streams proxied with correct headers
// Provider names and URLs are hidden for security

import { ANIME } from '@consumet/extensions';
import http from 'http';
import https from 'https';
import { URL } from 'url';

// Create persistent provider instances
const PROVIDER_INSTANCES = {
  p1: new ANIME.Hianime(),
  p2: new ANIME.AnimePahe(),
  p3: new ANIME.AnimeKai(),
  p4: new ANIME.KickAssAnime(),
  p5: new ANIME.AnimeSaturn(),
  p6: new ANIME.AnimeUnity(),
  p7: new ANIME.AnimeSama(),
};

// Provider metadata - features available per provider
const PROVIDER_META = {
  p1: {
    name: 'Server 1',
    hasSpotlight: true,
    hasSchedule: true,
    hasTopAiring: true,
    hasMostPopular: true,
    hasMostFavorite: true,
    hasLatestCompleted: true,
    hasRecentlyUpdated: true,
    hasRecentlyAdded: true,
    hasTopUpcoming: true,
    hasGenres: true,
    hasAdvancedSearch: true,
    language: 'en',
    supportsSubDub: true,
  },
  p2: {
    name: 'Server 2',
    hasSpotlight: false,
    hasSchedule: false,
    hasTopAiring: false,
    hasMostPopular: false,
    hasMostFavorite: false,
    hasLatestCompleted: false,
    hasRecentlyUpdated: false,
    hasRecentlyAdded: false,
    hasTopUpcoming: false,
    hasGenres: false,
    hasAdvancedSearch: false,
    hasRecentEpisodes: true,
    language: 'en',
    supportsSubDub: false,
  },
  p3: {
    name: 'Server 3',
    hasSpotlight: true,
    hasSchedule: true,
    hasTopAiring: false,
    hasMostPopular: false,
    hasMostFavorite: false,
    hasLatestCompleted: true,
    hasRecentlyUpdated: true,
    hasRecentlyAdded: true,
    hasTopUpcoming: false,
    hasGenres: true,
    hasAdvancedSearch: false,
    language: 'en',
    supportsSubDub: true,
  },
  p4: {
    name: 'Server 4',
    hasSpotlight: false,
    hasSchedule: false,
    hasTopAiring: false,
    hasMostPopular: false,
    hasMostFavorite: false,
    hasLatestCompleted: false,
    hasRecentlyUpdated: false,
    hasRecentlyAdded: false,
    hasTopUpcoming: false,
    hasGenres: false,
    hasAdvancedSearch: false,
    language: 'en',
    supportsSubDub: true,
  },
  p5: {
    name: 'Server 5',
    hasSpotlight: false,
    hasSchedule: false,
    hasTopAiring: false,
    hasMostPopular: false,
    hasMostFavorite: false,
    hasLatestCompleted: false,
    hasRecentlyUpdated: false,
    hasRecentlyAdded: false,
    hasTopUpcoming: false,
    hasGenres: false,
    hasAdvancedSearch: false,
    language: 'it',
    supportsSubDub: false,
  },
  p6: {
    name: 'Server 6',
    hasSpotlight: false,
    hasSchedule: false,
    hasTopAiring: false,
    hasMostPopular: false,
    hasMostFavorite: false,
    hasLatestCompleted: false,
    hasRecentlyUpdated: false,
    hasRecentlyAdded: false,
    hasTopUpcoming: false,
    hasGenres: false,
    hasAdvancedSearch: false,
    language: 'it',
    supportsSubDub: true,
  },
  p7: {
    name: 'Server 7',
    hasSpotlight: false,
    hasSchedule: false,
    hasTopAiring: false,
    hasMostPopular: false,
    hasMostFavorite: false,
    hasLatestCompleted: false,
    hasRecentlyUpdated: false,
    hasRecentlyAdded: false,
    hasTopUpcoming: false,
    hasGenres: false,
    hasAdvancedSearch: false,
    language: 'fr',
    supportsSubDub: true,
  },
};

// Referer URLs for streaming
const REFERER_URLS = {
  p1: 'https://hianime.to/',
  p2: 'https://animepahe.si/',
  p3: 'https://anikai.to/',
  p4: 'https://kickass-anime.ru/',
  p5: 'https://www.animesaturn.cx/',
  p6: 'https://www.animeunity.to/',
  p7: 'https://anime-sama.org/',
};

// Image host specific referers
const IMAGE_HOST_REFERERS = {
  'cdn.noitatnemucod.net': ['https://hianime.to/', 'https://aniwatch.to/'],
  'gogocdn.net': ['https://gogoanime.gg/', 'https://anitaku.to/'],
  'i.animepahe.ru': ['https://animepahe.si/', 'https://animepahe.com/'],
  'i.animepahe.com': ['https://animepahe.si/', 'https://animepahe.com/'],
};

// Get provider instance
const getProvider = (providerId = 'p1') => {
  const provider = PROVIDER_INSTANCES[providerId.toLowerCase()];
  if (!provider) {
    throw new Error(`Invalid provider: ${providerId}`);
  }
  return provider;
};

// Get referer for provider
const getReferer = (providerId = 'p1') => {
  return REFERER_URLS[providerId.toLowerCase()] || REFERER_URLS.p1;
};

// ============ IMAGE PROXY FOR ANIME ============
const animeImageCache = new Map();
const MAX_CACHE = 500;
const pendingImageRequests = new Map();

const proxyAnimeImage = async (imageUrl, provider = 'p1') => {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  if (imageUrl.startsWith('data:')) return imageUrl;

  // Check cache
  if (animeImageCache.has(imageUrl)) {
    return animeImageCache.get(imageUrl);
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
        ...hostReferers, // Host-specific first (highest priority)
        getReferer(provider),
        'https://hianime.to/',
        'https://aniwatch.to/',
        '' // Empty referer as last resort
      ];
      
      // Deduplicate
      const uniqueReferers = [...new Set(refererCandidates)];
      
      // Proxying image with host-specific referers
      
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
        // Image fetch failed after all referers
        return null; // Return null, NOT original URL
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const dataUrl = `data:${contentType};base64,${base64}`;

      // Cache with limit
      if (animeImageCache.size >= MAX_CACHE) {
        const firstKey = animeImageCache.keys().next().value;
        animeImageCache.delete(firstKey);
      }
      animeImageCache.set(imageUrl, dataUrl);

      return dataUrl;
    } catch (error) {
      // Image proxy error - returning null
      return null; // Return null on error, NOT original URL
    } finally {
      pendingImageRequests.delete(imageUrl);
    }
  })();

  pendingImageRequests.set(imageUrl, requestPromise);
  return requestPromise;
};

// Proxy all images in anime results
const proxyAnimeResults = async (data, provider = 'p1') => {
  if (!data) return data;

  // Helper to proxy all image fields on an item
  const proxyItemImages = async (item) => {
    const imageFields = ['image', 'cover', 'poster', 'banner', 'thumbnail', 'img', 'backdrop'];
    for (const field of imageFields) {
      if (item[field]) {
        item[field] = await proxyAnimeImage(item[field], provider);
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

  // Handle episodes array
  if (data.episodes && Array.isArray(data.episodes)) {
    data.episodes = await Promise.all(data.episodes.map(proxyItemImages));
  }

  return data;
};

// ============ M3U8 STREAMING PROXY SERVER ============
// Creates a local HTTP server that proxies M3U8 and segment requests
// This allows HLS.js to make requests to localhost, and we forward them with correct headers

let streamProxyServer = null;
let streamProxyPort = 0;

// Start the stream proxy server
export const startStreamProxy = () => {
  return new Promise((resolve, reject) => {
    if (streamProxyServer) {
      resolve(streamProxyPort);
      return;
    }

    streamProxyServer = http.createServer(async (req, res) => {
      // Set CORS headers for all responses
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', '*');
      
      // Handle preflight
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      try {
        const reqUrl = new URL(req.url, `http://localhost:${streamProxyPort}`);
        const targetUrl = reqUrl.searchParams.get('url');
        const referer = reqUrl.searchParams.get('referer') || '';
        const origin = reqUrl.searchParams.get('origin') || '';

        if (!targetUrl) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Missing url parameter');
          return;
        }

        // Parse the target URL
        const parsedTarget = new URL(targetUrl);
        const isHttps = parsedTarget.protocol === 'https:';
        const httpModule = isHttps ? https : http;

        // Determine if this is an M3U8 file
        const isM3U8 = targetUrl.includes('.m3u8') || targetUrl.includes('/master') || targetUrl.includes('/index');

        // Build request headers
        const proxyHeaders = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'identity', // Don't accept gzip for easier handling
          'Host': parsedTarget.host,
        };

        if (referer) {
          proxyHeaders['Referer'] = referer;
        }
        if (origin) {
          proxyHeaders['Origin'] = origin;
        }

        // Forward the request
        const proxyReq = httpModule.request(
          targetUrl,
          {
            method: 'GET',
            headers: proxyHeaders,
          },
          (proxyRes) => {
            const responseContentType = proxyRes.headers['content-type'] || 'application/octet-stream';
            
            // Determine content type based on URL or response
            let contentType = responseContentType;
            const isM3U8Content = isM3U8 || responseContentType.includes('mpegurl') || responseContentType.includes('m3u8');
            
            if (isM3U8Content) {
              contentType = 'application/vnd.apple.mpegurl';
            } else if (targetUrl.includes('.ts') || responseContentType.includes('mp2t')) {
              contentType = 'video/mp2t';
            } else if (targetUrl.includes('.mp4')) {
              contentType = 'video/mp4';
            }
            // For segments, keep the original content type but log it

            // For M3U8 playlists, we need to rewrite URLs to go through our proxy
            if (isM3U8Content) {
              let data = '';
              proxyRes.on('data', chunk => data += chunk);
              proxyRes.on('end', () => {
                // Rewrite relative and absolute URLs in the M3U8
                const rewritten = rewriteM3U8(data, targetUrl, referer, origin);
                res.writeHead(proxyRes.statusCode, {
                  'Content-Type': contentType,
                  'Cache-Control': 'no-cache',
                });
                res.end(rewritten);
              });
            } else {
              // For segments, just pipe through
              const headers = {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache',
              };
              // Only add Content-Length if it exists
              if (proxyRes.headers['content-length']) {
                headers['Content-Length'] = proxyRes.headers['content-length'];
              }
              res.writeHead(proxyRes.statusCode, headers);
              proxyRes.pipe(res);
            }
          }
        );

        proxyReq.on('error', (err) => {
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end(`Proxy error: ${err.message}`);
          }
        });

        // Set timeout
        proxyReq.setTimeout(30000, () => {
          proxyReq.destroy();
          if (!res.headersSent) {
            res.writeHead(504, { 'Content-Type': 'text/plain' });
            res.end('Proxy timeout');
          }
        });

        proxyReq.end();
      } catch (err) {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end(`Server error: ${err.message}`);
        }
      }
    });

    // Find an available port
    streamProxyServer.listen(0, '127.0.0.1', () => {
      streamProxyPort = streamProxyServer.address().port;
      resolve(streamProxyPort);
    });

    streamProxyServer.on('error', reject);
  });
};

// Rewrite URLs in M3U8 content to go through our proxy
const rewriteM3U8 = (content, baseUrl, referer, origin) => {
  const lines = content.split('\n');
  const baseUrlObj = new URL(baseUrl);
  const basePath = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
  
  // For segments, use the M3U8 URL as the referer (not the original embed page referer)
  // This is important because CDNs often check that segments are requested from the playlist
  const segmentReferer = baseUrl;
  const segmentOrigin = `${baseUrlObj.protocol}//${baseUrlObj.host}`;
  
  let rewriteCount = 0;
  
  const result = lines.map(line => {
    const trimmed = line.trim();
    
    // Skip empty lines
    if (!trimmed) {
      return line;
    }
    
    // Handle #EXT-X-KEY lines with URI
    if (trimmed.includes('URI="')) {
      return rewriteKeyLine(trimmed, basePath, segmentReferer, segmentOrigin);
    }
    
    // Skip other directives (lines starting with #)
    if (trimmed.startsWith('#')) {
      return line;
    }
    
    // This is a URL line - rewrite it
    let absoluteUrl;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      absoluteUrl = trimmed;
    } else if (trimmed.startsWith('/')) {
      // Absolute path
      absoluteUrl = `${baseUrlObj.protocol}//${baseUrlObj.host}${trimmed}`;
    } else {
      // Relative path
      absoluteUrl = basePath + trimmed;
    }
    
    rewriteCount++;
    // Return proxy URL - use the M3U8 URL as referer for segments
    return createProxyUrl(absoluteUrl, segmentReferer, segmentOrigin);
  }).join('\n');
  
  return result;
};

// Rewrite #EXT-X-KEY lines
const rewriteKeyLine = (line, basePath, referer, origin) => {
  return line.replace(/URI="([^"]+)"/, (match, uri) => {
    let absoluteUrl;
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      absoluteUrl = uri;
    } else if (uri.startsWith('/')) {
      const baseUrlObj = new URL(basePath);
      absoluteUrl = `${baseUrlObj.protocol}//${baseUrlObj.host}${uri}`;
    } else {
      absoluteUrl = basePath + uri;
    }
    return `URI="${createProxyUrl(absoluteUrl, referer, origin)}"`;
  });
};

// Create a proxy URL for a given target
const createProxyUrl = (targetUrl, referer, origin) => {
  const params = new URLSearchParams();
  params.set('url', targetUrl);
  if (referer) params.set('referer', referer);
  if (origin) params.set('origin', origin);
  return `http://127.0.0.1:${streamProxyPort}/proxy?${params.toString()}`;
};

// Get the proxy port (for generating proxy URLs)
export const getStreamProxyPort = () => streamProxyPort;

// Register anime IPC handlers
export function registerAnimeHandlers(ipcMain) {
  // Get available providers with their features
  ipcMain.handle('anime:getProviders', async () => {
    return Object.entries(PROVIDER_META).map(([id, meta]) => ({
      id,
      ...meta,
    }));
  });

  // Search anime
  ipcMain.handle('anime:search', async (event, { provider = 'p1', query, page = 1 }) => {
    try {
      const anime = getProvider(provider);
      const results = await anime.search(query, page);
      const proxied = await proxyAnimeResults(results, provider);
      return { success: true, data: proxied, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // Get anime info with episodes
  ipcMain.handle('anime:getInfo', async (event, { provider = 'p1', animeId }) => {
    try {
      if (!animeId) {
        return { success: false, error: 'No anime ID provided' };
      }
      const anime = getProvider(provider);
      const info = await anime.fetchAnimeInfo(animeId);
      const proxied = await proxyAnimeResults(info, provider);
      return { success: true, data: proxied, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // Get episode sources (streaming URLs)
  ipcMain.handle('anime:getEpisodeSources', async (event, { provider = 'p1', episodeId, server, subOrDub = 'sub' }) => {
    try {
      if (!episodeId) {
        return { success: false, error: 'Invalid episode id' };
      }
      
      const anime = getProvider(provider);
      
      // Different providers have different method signatures
      let sources;
      try {
        if (provider === 'p1' || provider === 'p3') {
          // Hianime and AnimeKai support server and subOrDub
          sources = await anime.fetchEpisodeSources(episodeId, server, subOrDub);
        } else if (provider === 'p4') {
          // KickAssAnime supports server
          sources = await anime.fetchEpisodeSources(episodeId, server);
        } else {
          // Others just need episodeId
          sources = await anime.fetchEpisodeSources(episodeId);
        }
      } catch (fetchErr) {
        // Try without server/subOrDub as fallback
        try {
          sources = await anime.fetchEpisodeSources(episodeId);
        } catch (fallbackErr) {
          return { success: false, error: `Failed to fetch sources: ${fetchErr.message}` };
        }
      }

      if (!sources || (!sources.sources && !sources.source)) {
        return { success: false, error: 'No streaming sources available' };
      }

      // IMPORTANT: Use the headers that consumet provides (they include the correct Referer)
      const providerReferer = getReferer(provider);
      const referer = sources.headers?.Referer || providerReferer;
      const origin = sources.headers?.Origin || providerReferer.replace(/\/$/, '');

      // Convert all source URLs to proxy URLs
      // This ensures HLS.js requests go through our local proxy with correct headers
      if (sources.sources && Array.isArray(sources.sources)) {
        sources.sources = sources.sources.map(source => ({
          ...source,
          url: createProxyUrl(source.url, referer, origin),
          originalUrl: source.url, // Keep original for debugging
        }));
      }
      
      // Handle single source field (some providers use this)
      if (sources.source) {
        sources.source = createProxyUrl(sources.source, referer, origin);
      }

      // Store the proxy port in the response so renderer knows where to connect
      sources.proxyPort = streamProxyPort;

      return { success: true, data: sources, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // Get episode servers
  ipcMain.handle('anime:getEpisodeServers', async (event, { provider = 'p1', episodeId }) => {
    try {
      if (!episodeId) {
        return { success: false, error: 'No episode ID provided' };
      }
      const anime = getProvider(provider);
      
      if (typeof anime.fetchEpisodeServers !== 'function') {
        return { success: false, error: 'Server selection not supported by this provider' };
      }
      
      const servers = await anime.fetchEpisodeServers(episodeId);
      return { success: true, data: servers, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // ============ SPOTLIGHT & FEATURED CONTENT ============

  // Get spotlight (Hianime, AnimeKai)
  ipcMain.handle('anime:getSpotlight', async (event, { provider = 'p1' }) => {
    try {
      const anime = getProvider(provider);
      if (!PROVIDER_META[provider]?.hasSpotlight || !anime.fetchSpotlight) {
        return { success: false, error: 'Spotlight not supported by this provider' };
      }
      const results = await anime.fetchSpotlight();
      const proxied = await proxyAnimeResults(results, provider);
      return { success: true, data: proxied, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // Get top airing (Hianime)
  ipcMain.handle('anime:getTopAiring', async (event, { provider = 'p1', page = 1 }) => {
    try {
      const anime = getProvider(provider);
      if (!PROVIDER_META[provider]?.hasTopAiring || !anime.fetchTopAiring) {
        return { success: false, error: 'Top airing not supported by this provider' };
      }
      const results = await anime.fetchTopAiring(page);
      const proxied = await proxyAnimeResults(results, provider);
      return { success: true, data: proxied, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // Get most popular (Hianime)
  ipcMain.handle('anime:getMostPopular', async (event, { provider = 'p1', page = 1 }) => {
    try {
      const anime = getProvider(provider);
      if (!PROVIDER_META[provider]?.hasMostPopular || !anime.fetchMostPopular) {
        return { success: false, error: 'Most popular not supported by this provider' };
      }
      const results = await anime.fetchMostPopular(page);
      const proxied = await proxyAnimeResults(results, provider);
      return { success: true, data: proxied, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // Get most favorite (Hianime)
  ipcMain.handle('anime:getMostFavorite', async (event, { provider = 'p1', page = 1 }) => {
    try {
      const anime = getProvider(provider);
      if (!PROVIDER_META[provider]?.hasMostFavorite || !anime.fetchMostFavorite) {
        return { success: false, error: 'Most favorite not supported by this provider' };
      }
      const results = await anime.fetchMostFavorite(page);
      const proxied = await proxyAnimeResults(results, provider);
      return { success: true, data: proxied, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // Get latest completed (Hianime, AnimeKai)
  ipcMain.handle('anime:getLatestCompleted', async (event, { provider = 'p1', page = 1 }) => {
    try {
      const anime = getProvider(provider);
      if (!PROVIDER_META[provider]?.hasLatestCompleted || !anime.fetchLatestCompleted) {
        return { success: false, error: 'Latest completed not supported by this provider' };
      }
      const results = await anime.fetchLatestCompleted(page);
      const proxied = await proxyAnimeResults(results, provider);
      return { success: true, data: proxied, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // Get recently updated (Hianime, AnimeKai)
  ipcMain.handle('anime:getRecentlyUpdated', async (event, { provider = 'p1', page = 1 }) => {
    try {
      const anime = getProvider(provider);
      if (!PROVIDER_META[provider]?.hasRecentlyUpdated || !anime.fetchRecentlyUpdated) {
        return { success: false, error: 'Recently updated not supported by this provider' };
      }
      const results = await anime.fetchRecentlyUpdated(page);
      const proxied = await proxyAnimeResults(results, provider);
      return { success: true, data: proxied, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // Get recently added (Hianime, AnimeKai)
  ipcMain.handle('anime:getRecentlyAdded', async (event, { provider = 'p1', page = 1 }) => {
    try {
      const anime = getProvider(provider);
      if (!PROVIDER_META[provider]?.hasRecentlyAdded || !anime.fetchRecentlyAdded) {
        return { success: false, error: 'Recently added not supported by this provider' };
      }
      const results = await anime.fetchRecentlyAdded(page);
      const proxied = await proxyAnimeResults(results, provider);
      return { success: true, data: proxied, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // Get top upcoming (Hianime)
  ipcMain.handle('anime:getTopUpcoming', async (event, { provider = 'p1', page = 1 }) => {
    try {
      const anime = getProvider(provider);
      if (!PROVIDER_META[provider]?.hasTopUpcoming || !anime.fetchTopUpcoming) {
        return { success: false, error: 'Top upcoming not supported by this provider' };
      }
      const results = await anime.fetchTopUpcoming(page);
      const proxied = await proxyAnimeResults(results, provider);
      return { success: true, data: proxied, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // Get recent episodes (AnimePahe)
  ipcMain.handle('anime:getRecentEpisodes', async (event, { provider = 'p2', page = 1 }) => {
    try {
      const anime = getProvider(provider);
      if (!PROVIDER_META[provider]?.hasRecentEpisodes || !anime.fetchRecentEpisodes) {
        return { success: false, error: 'Recent episodes not supported by this provider' };
      }
      const results = await anime.fetchRecentEpisodes(page);
      const proxied = await proxyAnimeResults(results, provider);
      return { success: true, data: proxied, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // Get schedule (Hianime, AnimeKai)
  ipcMain.handle('anime:getSchedule', async (event, { provider = 'p1', date }) => {
    try {
      const anime = getProvider(provider);
      if (!PROVIDER_META[provider]?.hasSchedule || !anime.fetchSchedule) {
        return { success: false, error: 'Schedule not supported by this provider' };
      }
      const results = await anime.fetchSchedule(date);
      const proxied = await proxyAnimeResults(results, provider);
      return { success: true, data: proxied, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // Get genres (Hianime, AnimeKai)
  ipcMain.handle('anime:getGenres', async (event, { provider = 'p1' }) => {
    try {
      const anime = getProvider(provider);
      if (!PROVIDER_META[provider]?.hasGenres || !anime.fetchGenres) {
        return { success: false, error: 'Genres not supported by this provider' };
      }
      const results = await anime.fetchGenres();
      return { success: true, data: results, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // Genre search (Hianime, AnimeKai)
  ipcMain.handle('anime:genreSearch', async (event, { provider = 'p1', genre, page = 1 }) => {
    try {
      const anime = getProvider(provider);
      if (!PROVIDER_META[provider]?.hasGenres || !anime.genreSearch) {
        return { success: false, error: 'Genre search not supported by this provider' };
      }
      const results = await anime.genreSearch(genre, page);
      const proxied = await proxyAnimeResults(results, provider);
      return { success: true, data: proxied, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // Advanced search (Hianime)
  ipcMain.handle('anime:advancedSearch', async (event, { provider = 'p1', options = {} }) => {
    try {
      const anime = getProvider(provider);
      if (!PROVIDER_META[provider]?.hasAdvancedSearch || !anime.fetchAdvancedSearch) {
        return { success: false, error: 'Advanced search not supported by this provider' };
      }
      const { page, type, status, rated, score, season, language, startDate, endDate, sort, genres } = options;
      const results = await anime.fetchAdvancedSearch(page, type, status, rated, score, season, language, startDate, endDate, sort, genres);
      const proxied = await proxyAnimeResults(results, provider);
      return { success: true, data: proxied, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });

  // ============ PROXY HANDLERS ============

  // Get stream proxy port (so renderer knows where to connect if needed)
  ipcMain.handle('anime:getProxyPort', async () => {
    return { success: true, port: streamProxyPort };
  });

  // Proxy image
  ipcMain.handle('anime:proxyImage', async (event, { imageUrl, provider = 'p1' }) => {
    try {
      const dataUrl = await proxyAnimeImage(imageUrl, provider);
      return { success: true, data: dataUrl };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Search suggestions (Hianime, AnimeKai)
  ipcMain.handle('anime:searchSuggestions', async (event, { provider = 'p1', query }) => {
    try {
      const anime = getProvider(provider);
      if (!anime.fetchSearchSuggestions) {
        return { success: false, error: 'Search suggestions not supported' };
      }
      const results = await anime.fetchSearchSuggestions(query);
      const proxied = await proxyAnimeResults(results, provider);
      return { success: true, data: proxied, provider };
    } catch (error) {
      return { success: false, error: error.message, provider };
    }
  });
}
