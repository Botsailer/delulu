// Anime data fetching hooks
import { useState, useEffect, useRef } from 'react';
import { jikanApi, anilistApi } from '../services/api';

// Simple in-memory cache to prevent duplicate requests
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

// Get top anime
export const useTopAnime = (page = 1, limit = 25, filter = '') => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const cacheKey = `topAnime-${page}-${limit}-${filter}`;
    
    const fetchData = async () => {
      // Check cache first
      const cached = getCached(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const result = await jikanApi.getTopAnime(page, limit, filter);
        if (isMounted.current) {
          setData(result);
          setCache(cacheKey, result);
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
    
    return () => {
      isMounted.current = false;
    };
  }, [page, limit, filter]);

  return { data, loading, error };
};

// Get current season anime
export const useCurrentSeason = (page = 1) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const cacheKey = `currentSeason-${page}`;
    
    const fetchData = async () => {
      const cached = getCached(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        const result = await jikanApi.getCurrentSeason(page);
        if (isMounted.current) {
          setData(result);
          setCache(cacheKey, result);
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

    // Delay this call to avoid rate limiting when HomeScreen mounts
    const timer = setTimeout(fetchData, 400);
    
    return () => {
      isMounted.current = false;
      clearTimeout(timer);
    };
  }, [page]);

  return { data, loading, error };
};

// Get trending anime from AniList (doesn't have rate limiting issues)
export const useTrendingAnime = (page = 1, perPage = 20) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const cacheKey = `trendingAnime-${page}-${perPage}`;
    
    const fetchData = async () => {
      const cached = getCached(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        const result = await anilistApi.getTrending(page, perPage);
        if (isMounted.current) {
          setData(result);
          setCache(cacheKey, result);
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

    // Delay to stagger requests
    const timer = setTimeout(fetchData, 800);
    
    return () => {
      isMounted.current = false;
      clearTimeout(timer);
    };
  }, [page, perPage]);

  return { data, loading, error };
};

// Search anime - only fires when query changes (with debounce in component)
export const useSearchAnime = (query, page = 1) => {
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

    const cacheKey = `searchAnime-${query}-${page}`;
    
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
        const result = await jikanApi.searchAnime(query, page);
        if (isMounted.current) {
          setData(result);
          setCache(cacheKey, result);
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
    
    return () => {
      isMounted.current = false;
    };
  }, [query, page]);

  return { data, loading, error };
};

// Get anime by ID with full details
export const useAnimeDetails = (id) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    
    isMounted.current = true;
    const cacheKey = `animeDetails-${id}`;
    
    const fetchData = async () => {
      const cached = getCached(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        const result = await jikanApi.getAnimeById(id);
        if (isMounted.current) {
          setData(result);
          setCache(cacheKey, result);
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
    
    return () => {
      isMounted.current = false;
    };
  }, [id]);

  return { data, loading, error };
};

// Get anime genres (cached indefinitely)
export const useAnimeGenres = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cacheKey = 'animeGenres';
    const cached = getCached(cacheKey);
    
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const result = await jikanApi.getGenres();
        setData(result);
        setCache(cacheKey, result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};
