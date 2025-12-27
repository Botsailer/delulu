// Manga hooks using Consumet providers via IPC
import { useState, useEffect, useRef, useCallback } from 'react';

// Check if we're in Electron
const isElectron = () => typeof window !== 'undefined' && window.electronAPI?.manga;

// Simple cache
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCached = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Get available manga providers
export const useMangaProviders = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isElectron()) {
      setProviders([{ id: 's1', name: 'Server 1' }]);
      setLoading(false);
      return;
    }

    window.electronAPI.manga.getProviders()
      .then(setProviders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { providers, loading };
};

// Search manga
export const useSearchManga = (provider = 's1', query, page = 1) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    if (!query || query.trim().length < 2) {
      setData(null);
      setLoading(false);
      return;
    }

    if (!isElectron()) {
      setError('Manga search requires Electron');
      return;
    }

    const cacheKey = `manga-search-${provider}-${query}-${page}`;
    
    const fetchData = async () => {
      const cached = getCached(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await window.electronAPI.manga.search(provider, query, page);
        if (isMounted.current) {
          if (result.success) {
            setData(result.data);
            setCache(cacheKey, result.data);
          } else {
            setError(result.error);
          }
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err.message);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => { isMounted.current = false; };
  }, [provider, query, page]);

  return { data, loading, error };
};

// Get popular manga (MangaDex)
export const usePopularManga = (page = 1, limit = 20) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    if (!isElectron()) {
      setError('Manga requires Electron');
      setLoading(false);
      return;
    }

    const cacheKey = `manga-popular-${page}-${limit}`;
    
    const fetchData = async () => {
      const cached = getCached(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const result = await window.electronAPI.manga.getPopular(page, limit);
        if (isMounted.current) {
          if (result.success) {
            setData(result.data);
            setCache(cacheKey, result.data);
          } else {
            setError(result.error);
          }
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err.message);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => { isMounted.current = false; };
  }, [page, limit]);

  return { data, loading, error };
};

// Get latest updates (MangaDex)
export const useLatestManga = (page = 1, limit = 20) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    if (!isElectron()) {
      setError('Manga requires Electron');
      setLoading(false);
      return;
    }

    const cacheKey = `manga-latest-${page}-${limit}`;
    
    const fetchData = async () => {
      const cached = getCached(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const result = await window.electronAPI.manga.getLatestUpdates(page, limit);
        if (isMounted.current) {
          if (result.success) {
            setData(result.data);
            setCache(cacheKey, result.data);
          } else {
            setError(result.error);
          }
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err.message);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    // Slight delay to stagger requests
    const timer = setTimeout(fetchData, 300);

    return () => { 
      isMounted.current = false; 
      clearTimeout(timer);
    };
  }, [page, limit]);

  return { data, loading, error };
};

// Get manga info with chapters
export const useMangaInfo = (provider = 's1', mangaId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    if (!mangaId) {
      setLoading(false);
      return;
    }

    isMounted.current = true;
    
    if (!isElectron()) {
      setError('Manga requires Electron');
      setLoading(false);
      return;
    }

    const cacheKey = `manga-info-${provider}-${mangaId}`;
    
    const fetchData = async () => {
      const cached = getCached(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const result = await window.electronAPI.manga.getInfo(provider, mangaId);
        if (isMounted.current) {
          if (result.success) {
            setData(result.data);
            setCache(cacheKey, result.data);
          } else {
            setError(result.error);
          }
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err.message);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => { isMounted.current = false; };
  }, [provider, mangaId]);

  return { data, loading, error };
};

// Get chapter pages with proxied images
export const useChapterPages = (provider = 's1', chapterId) => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    if (!chapterId) {
      setLoading(false);
      return;
    }

    isMounted.current = true;
    
    if (!isElectron()) {
      setError('Manga requires Electron');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // First get the page URLs
        const pagesResult = await window.electronAPI.manga.getChapterPages(provider, chapterId);
        
        if (!pagesResult.success) {
          throw new Error(pagesResult.error);
        }

        // Then proxy all images
        const proxiedResult = await window.electronAPI.manga.proxyImages(
          pagesResult.data, 
          pagesResult.provider || provider
        );

        if (isMounted.current) {
          if (proxiedResult.success) {
            setPages(proxiedResult.data);
          } else {
            setError(proxiedResult.error);
          }
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err.message);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => { isMounted.current = false; };
  }, [provider, chapterId]);

  return { pages, loading, error };
};

// Proxy single image
export const useProxiedImage = (imageUrl, provider = 's1') => {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!imageUrl) {
      setLoading(false);
      return;
    }

    if (!isElectron()) {
      // Fallback: try direct URL
      setSrc(imageUrl);
      setLoading(false);
      return;
    }

    const cacheKey = `proxy-${provider}-${imageUrl}`;
    const cached = getCached(cacheKey);
    if (cached) {
      setSrc(cached);
      setLoading(false);
      return;
    }

    window.electronAPI.manga.proxyImage(imageUrl, provider)
      .then(result => {
        if (result.success) {
          setSrc(result.data);
          setCache(cacheKey, result.data);
        } else {
          setError(result.error);
          setSrc(imageUrl); // Fallback to original
        }
      })
      .catch(err => {
        setError(err.message);
        setSrc(imageUrl);
      })
      .finally(() => setLoading(false));
  }, [imageUrl, provider]);

  return { src, loading, error };
};

// Get trending manga
export const useTrendingManga = (page = 1) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    if (!isElectron()) {
      setError('Manga requires Electron');
      setLoading(false);
      return;
    }

    const cacheKey = `manga-trending-${page}`;
    
    const fetchData = async () => {
      const cached = getCached(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const result = await window.electronAPI.manga.getTrending(page);
        if (isMounted.current) {
          if (result.success) {
            setData(result.data);
            setCache(cacheKey, result.data);
          } else {
            setError(result.error);
          }
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err.message);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(fetchData, 500);

    return () => { 
      isMounted.current = false; 
      clearTimeout(timer);
    };
  }, [page]);

  return { data, loading, error };
};
