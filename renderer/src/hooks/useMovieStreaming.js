// Movie streaming hooks - Uses @consumet/extensions providers
import { useState, useEffect, useRef, useCallback } from 'react';
import { movieStreamingApi } from '../services/api';

// Simple in-memory cache
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

// Retry helper with exponential backoff
const withRetry = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fn();
      // Check if result indicates an error (for API responses)
      if (result && result.success === false && attempt < maxRetries - 1) {
        throw new Error(result.error || 'Request failed');
      }
      return result;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
};

// ============ PROVIDERS ============

// Get available providers with features
export const useMovieProviders = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const cached = getCached('movie-providers');
        if (cached) {
          setProviders(cached);
          setLoading(false);
          return;
        }

        const data = await movieStreamingApi.getProviders();
        if (Array.isArray(data)) {
          setProviders(data);
          setCache('movie-providers', data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  return { providers, loading, error };
};

// ============ SPOTLIGHT ============

export const useMovieSpotlight = (provider = 'm1') => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  const [retryCount, setRetryCount] = useState(0);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const cacheKey = `movie-spotlight-${provider}`;
    
    if (!forceRefresh) {
      const cached = getCached(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await withRetry(() => movieStreamingApi.getSpotlight(provider), 3);
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
  }, [provider]);

  useEffect(() => {
    isMounted.current = true;
    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, [provider, retryCount, fetchData]);

  const retry = useCallback(() => {
    setRetryCount(c => c + 1);
  }, []);

  return { data, loading, error, retry, refetch: () => fetchData(true) };
};

// ============ TRENDING MOVIES ============

export const useTrendingMovies = (provider = 'm1') => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  const [retryCount, setRetryCount] = useState(0);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const cacheKey = `movie-trending-movies-${provider}`;
    
    if (!forceRefresh) {
      const cached = getCached(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await withRetry(() => movieStreamingApi.getTrendingMovies(provider), 3);
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
  }, [provider]);

  useEffect(() => {
    isMounted.current = true;
    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, [provider, retryCount, fetchData]);

  const retry = useCallback(() => setRetryCount(c => c + 1), []);

  return { data, loading, error, retry, refetch: () => fetchData(true) };
};

// ============ TRENDING TV SHOWS ============

export const useTrendingTvShows = (provider = 'm1') => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  const [retryCount, setRetryCount] = useState(0);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const cacheKey = `movie-trending-tv-${provider}`;
    
    if (!forceRefresh) {
      const cached = getCached(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await withRetry(() => movieStreamingApi.getTrendingTvShows(provider), 3);
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
  }, [provider]);

  useEffect(() => {
    isMounted.current = true;
    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, [provider, retryCount, fetchData]);

  const retry = useCallback(() => setRetryCount(c => c + 1), []);

  return { data, loading, error, retry, refetch: () => fetchData(true) };
};

// ============ RECENT MOVIES ============

export const useRecentMovies = (provider = 'm1') => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  const [retryCount, setRetryCount] = useState(0);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const cacheKey = `movie-recent-movies-${provider}`;
    
    if (!forceRefresh) {
      const cached = getCached(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await withRetry(() => movieStreamingApi.getRecentMovies(provider), 3);
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
  }, [provider]);

  useEffect(() => {
    isMounted.current = true;
    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, [provider, retryCount, fetchData]);

  const retry = useCallback(() => setRetryCount(c => c + 1), []);

  return { data, loading, error, retry, refetch: () => fetchData(true) };
};

// ============ RECENT TV SHOWS ============

export const useRecentTvShows = (provider = 'm1') => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  const [retryCount, setRetryCount] = useState(0);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const cacheKey = `movie-recent-tv-${provider}`;
    
    if (!forceRefresh) {
      const cached = getCached(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await withRetry(() => movieStreamingApi.getRecentTvShows(provider), 3);
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
  }, [provider]);

  useEffect(() => {
    isMounted.current = true;
    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, [provider, retryCount, fetchData]);

  const retry = useCallback(() => setRetryCount(c => c + 1), []);

  return { data, loading, error, retry, refetch: () => fetchData(true) };
};

// ============ SEARCH ============

export const useMovieSearch = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (provider, query, page = 1) => {
    if (!query?.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await withRetry(() => movieStreamingApi.search(provider, query, page), 2);
      if (result.success) {
        setResults(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

  return { results, loading, error, search, clearResults };
};

// ============ MOVIE/TV INFO ============

export const useMovieInfo = (provider, mediaId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    if (!mediaId) {
      setLoading(false);
      return;
    }

    const cacheKey = `movie-info-${provider}-${mediaId}`;

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
        const result = await withRetry(() => movieStreamingApi.getInfo(provider, mediaId), 3);
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

    return () => {
      isMounted.current = false;
    };
  }, [provider, mediaId]);

  return { data, loading, error };
};

// ============ EPISODE SOURCES ============

export const useMovieEpisodeSources = () => {
  const [sources, setSources] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSources = useCallback(async (provider, episodeId, mediaId, server) => {
    if (!episodeId || !mediaId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await withRetry(
        () => movieStreamingApi.getEpisodeSources(provider, episodeId, mediaId, server),
        3,
        1500
      );
      if (result.success) {
        setSources(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSources = useCallback(() => {
    setSources(null);
    setError(null);
  }, []);

  return { sources, loading, error, fetchSources, clearSources };
};

// ============ EPISODE SERVERS ============

export const useMovieEpisodeServers = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchServers = useCallback(async (provider, episodeId, mediaId) => {
    if (!episodeId || !mediaId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await withRetry(
        () => movieStreamingApi.getEpisodeServers(provider, episodeId, mediaId),
        2
      );
      if (result.success) {
        setServers(result.data || []);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { servers, loading, error, fetchServers };
};

// ============ BY GENRE ============

export const useMoviesByGenre = (provider = 'm1', genre, page = 1) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    if (!genre) {
      setLoading(false);
      return;
    }

    const cacheKey = `movie-genre-${provider}-${genre}-${page}`;

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
        const result = await movieStreamingApi.getByGenre(provider, genre, page);
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

    return () => {
      isMounted.current = false;
    };
  }, [provider, genre, page]);

  return { data, loading, error };
};

// ============ BY COUNTRY ============

export const useMoviesByCountry = (provider = 'm1', country, page = 1) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    if (!country) {
      setLoading(false);
      return;
    }

    const cacheKey = `movie-country-${provider}-${country}-${page}`;

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
        const result = await movieStreamingApi.getByCountry(provider, country, page);
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

    return () => {
      isMounted.current = false;
    };
  }, [provider, country, page]);

  return { data, loading, error };
};
