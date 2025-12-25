// Manga Handler - Uses @consumet/extensions for manga
// All requests made server-side, images proxied with correct referrer
// Provider names and URLs are hidden for security

import { MANGA } from '@consumet/extensions';

// Create persistent provider instances (like Consumet API does)
const PROVIDER_INSTANCES = {
  s1: new MANGA.MangaDex(),
  // s2: new MANGA.ComicK(),
  s3: new MANGA.MangaHere(),
  s4: new MANGA.MangaPill(),
  s5: new MANGA.MangaReader(),
  s6: new MANGA.AsuraScans(),
  s7: new MANGA.WeebCentral(),
};

// Referer URLs for image proxying
const REFERER_URLS = {
  s1: 'https://mangadex.org/',
  // s2: 'https://comick.io/',
  s3: 'https://www.mangahere.cc/',
  s4: 'https://mangapill.com/',
  s5: 'https://mangareader.to/',
  s6: 'https://asuracomic.net/',
  s7: 'https://weebcentral.com/',
};

// Public server names (what frontend sees)
const SERVER_NAMES = {
  s1: 'Server 1',
  // s2: 'Server 2',
  s3: 'Server 3',
  s4: 'Server 4',
  s5: 'Server 5',
  s6: 'Server 6',
  s7: 'Server 7',
};

// Get provider instance by server ID (returns persistent instance)
const getProvider = (serverId = 's1') => {
  const provider = PROVIDER_INSTANCES[serverId.toLowerCase()];
  if (!provider) {
    throw new Error(`Invalid server: ${serverId}`);
  }
  return provider;
};

// Get referer for a server
const getReferer = (serverId = 's1') => {
  return REFERER_URLS[serverId.toLowerCase()] || REFERER_URLS.s1;
};

// ============ IMAGE PROXY FOR MANGA ============
const mangaImageCache = new Map();
const MAX_CACHE = 500;
const pendingImageRequests = new Map(); // Dedupe concurrent requests

// Proxy a single image to base64 - NEVER return original URL to prevent direct browser loading
const proxyMangaImage = async (imageUrl, provider = 's1') => {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  if (imageUrl.startsWith('data:')) return imageUrl;
  
  // Check cache
  if (mangaImageCache.has(imageUrl)) {
    return mangaImageCache.get(imageUrl);
  }
  
  // Dedupe concurrent requests for same image
  if (pendingImageRequests.has(imageUrl)) {
    return pendingImageRequests.get(imageUrl);
  }
  
  const requestPromise = (async () => {
    try {
      const referer = getReferer(provider);
      // Extract origin from referer for the Origin header
      const origin = referer.replace(/\/$/, '');
      
      const response = await fetch(imageUrl, {
        headers: {
          'Referer': referer,
          'Origin': origin,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Sec-Fetch-Dest': 'image',
          'Sec-Fetch-Mode': 'no-cors',
          'Sec-Fetch-Site': 'cross-site',
        },
      });
      
      if (!response.ok) {
        return null; // Return null, not original URL!
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const dataUrl = `data:${contentType};base64,${base64}`;
      
      // Cache with limit
      if (mangaImageCache.size >= MAX_CACHE) {
        const firstKey = mangaImageCache.keys().next().value;
        mangaImageCache.delete(firstKey);
      }
      mangaImageCache.set(imageUrl, dataUrl);
      
      return dataUrl;
    } catch (error) {
      return null; // Return null on error, not original URL!
    } finally {
      pendingImageRequests.delete(imageUrl);
    }
  })();
  
  pendingImageRequests.set(imageUrl, requestPromise);
  return requestPromise;
};

// Proxy all images in manga results
const proxyMangaResults = async (data, provider = 's1') => {
  if (!data) return data;
  
  // Handle results array
  if (data.results && Array.isArray(data.results)) {
    data.results = await Promise.all(
      data.results.map(async (item) => {
        if (item.image) {
          item.image = await proxyMangaImage(item.image, provider);
        }
        return item;
      })
    );
  }
  
  // Handle single item with image
  if (data.image) {
    data.image = await proxyMangaImage(data.image, provider);
  }
  
  return data;
};

// Register manga IPC handlers
export function registerMangaHandlers(ipcMain) {
  
  // Get list of available servers (hidden provider names)
  ipcMain.handle('manga:getProviders', async () => {
    return Object.keys(SERVER_NAMES).map(key => ({
      id: key,
      name: SERVER_NAMES[key],
    }));
  });

  // Search manga - NOW USES SELECTED PROVIDER
  ipcMain.handle('manga:search', async (event, { provider = 's1', query, page = 1 }) => {
    try {
      const manga = getProvider(provider);
      const results = await manga.search(query, page);
      
      // Proxy images
      const proxied = await proxyMangaResults(results, provider);
      
      return { success: true, data: proxied };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Get manga info with chapters - NOW USES SELECTED PROVIDER
  ipcMain.handle('manga:getInfo', async (event, { provider = 's1', mangaId }) => {
    try {
      if (!mangaId) {
        return { success: false, error: 'No manga ID provided' };
      }
      const manga = getProvider(provider);
      const info = await manga.fetchMangaInfo(mangaId);
      
      // Proxy image
      if (info?.image) {
        info.image = await proxyMangaImage(info.image, provider);
      }
      
      return { success: true, data: info };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Get chapter pages - NOW USES SELECTED PROVIDER
  ipcMain.handle('manga:getChapterPages', async (event, { provider = 's1', chapterId }) => {
    try {
      if (!chapterId) {
        return { success: false, error: 'No chapter ID provided' };
      }
      
      const manga = getProvider(provider);
      
      // Add  to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out after 30 seconds')), 30000)
      );
      
      const pages = await Promise.race([
        manga.fetchChapterPages(chapterId),
        timeoutPromise
      ]);
      
      // Validate pages array
      if (!pages || !Array.isArray(pages) || pages.length === 0) {
        return { 
          success: false, 
          error: 'No pages found for this chapter. The chapter may be unavailable or the server is having issues.',
          provider 
        };
      }
      
      return { success: true, data: pages, provider };
    } catch (error) {
      // Provide more helpful error messages for common issues
      let userMessage = error.message;
      if (error.message.includes('split') || error.message.includes('undefined')) {
        userMessage = 'This chapter is currently unavailable. The manga server may be blocking this content or the chapter format is not supported. Try a different server.';
      } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        userMessage = 'Request timed out. The server may be slow or unavailable. Please try again.';
      } else if (error.message.includes('blocked') || error.message.includes('copyright')) {
        userMessage = 'This content is blocked due to copyright restrictions.';
      }
      
      return { success: false, error: userMessage, provider };
    }
  });

  // MangaDex specific: Popular - WITH PROXIED IMAGES
  ipcMain.handle('manga:getPopular', async (event, { page = 1, limit = 20 }) => {
    try {
      const manga = getProvider('s1');
      const results = await manga.fetchPopular(page, limit);
      const proxied = await proxyMangaResults(results, 's1');
      return { success: true, data: proxied };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // MangaDex specific: Latest Updates - WITH PROXIED IMAGES
  ipcMain.handle('manga:getLatestUpdates', async (event, { page = 1, limit = 20 }) => {
    try {
      const manga = getProvider('s1');
      const results = await manga.fetchLatestUpdates(page, limit);
      const proxied = await proxyMangaResults(results, 's1');
      return { success: true, data: proxied };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // MangaDex specific: Recently Added
  ipcMain.handle('manga:getRecentlyAdded', async (event, { page = 1, limit = 20 }) => {
    try {
      const manga = getProvider('s1');
      const results = await manga.fetchRecentlyAdded(page, limit);
      const proxied = await proxyMangaResults(results, 's1');
      return { success: true, data: proxied };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // MangaDex specific: Random manga
  ipcMain.handle('manga:getRandom', async () => {
    try {
      const manga = getProvider('s1');
      const results = await manga.fetchRandom();
      const proxied = await proxyMangaResults(results, 's1');
      return { success: true, data: proxied };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // MangaHere specific: Trending
  ipcMain.handle('manga:getTrending', async (event, { page = 1 }) => {
    try {
      const manga = getProvider('s3');
      if (manga.fetchMangaTrending) {
        const results = await manga.fetchMangaTrending(page);
        return { success: true, data: results };
      }
      // Fallback to MangaDex popular
      const mangadex = getProvider('s1');
      const results = await mangadex.fetchPopular(page);
      return { success: true, data: results };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Image proxy - fetches image with correct referrer and returns as base64
  ipcMain.handle('manga:proxyImage', async (event, { imageUrl, provider = 's1', headers = {} }) => {
    try {
      const referer = getReferer(provider);
      const origin = referer.replace(/\/$/, '');
      
      const response = await fetch(imageUrl, {
        headers: {
          'Referer': referer,
          'Origin': origin,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Sec-Fetch-Dest': 'image',
          'Sec-Fetch-Mode': 'no-cors',
          'Sec-Fetch-Site': 'cross-site',
          ...headers,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      return { 
        success: true, 
        data: `data:${contentType};base64,${base64}` 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Batch proxy images (for chapter reading)
  ipcMain.handle('manga:proxyImages', async (event, { images, provider = 's1' }) => {
    try {
      const referer = getReferer(provider);
      const origin = referer.replace(/\/$/, '');
      
      const results = await Promise.all(
        images.map(async (img, index) => {
          try {
            const imageUrl = img.img || img;
            const response = await fetch(imageUrl, {
              headers: {
                'Referer': referer,
                'Origin': origin,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Sec-Fetch-Dest': 'image',
                'Sec-Fetch-Mode': 'no-cors',
                'Sec-Fetch-Site': 'cross-site',
                ...(img.headers || {}),
              },
            });

            if (!response.ok) {
              return { page: img.page || index + 1, success: false };
            }

            const arrayBuffer = await response.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            const contentType = response.headers.get('content-type') || 'image/jpeg';
            
            return { 
              page: img.page || index + 1, 
              success: true,
              data: `data:${contentType};base64,${base64}` 
            };
          } catch (err) {
            return { page: img.page || index + 1, success: false, error: err.message };
          }
        })
      );

      return { success: true, data: results };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
