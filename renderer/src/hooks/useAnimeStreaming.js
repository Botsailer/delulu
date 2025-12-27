// Anime streaming hooks - Uses @consumet/extensions providers
import { useState, useEffect, useRef, useCallback } from 'react';
import { animeStreamingApi } from '../services/api';

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

// ============ PROVIDERS ============

// Get available providers with features
export const useAnimeProviders = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const cached = getCached('anime-providers');
        if (cached) {
          setProviders(cached);
          setLoading(false);
          return;
        }

        const data = await animeStreamingApi.getProviders();
        if (Array.isArray(data)) {
          setProviders(data);
          setCache('anime-providers', data);
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

export const useAnimeSpotlight = (provider = 'p1') => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const cacheKey = `anime-spotlight-${provider}`;

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
        const result = await animeStreamingApi.getSpotlight(provider);
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
  }, [provider]);

  return { data, loading, error };
};

// ============ TOP AIRING ============

export const useTopAiring = (provider = 'p1', page = 1) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const cacheKey = `anime-top-airing-${provider}-${page}`;

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
        const result = await animeStreamingApi.getTopAiring(provider, page);
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
  }, [provider, page]);

  return { data, loading, error };
};

// ============ MOST POPULAR ============

export const useMostPopularAnime = (provider = 'p1', page = 1) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const cacheKey = `anime-popular-${provider}-${page}`;

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
        const result = await animeStreamingApi.getMostPopular(provider, page);
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
  }, [provider, page]);

  return { data, loading, error };
};

// ============ RECENTLY UPDATED ============

export const useRecentlyUpdatedAnime = (provider = 'p1', page = 1) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const cacheKey = `anime-recently-updated-${provider}-${page}`;

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
        const result = await animeStreamingApi.getRecentlyUpdated(provider, page);
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
  }, [provider, page]);

  return { data, loading, error };
};

// ============ RECENTLY ADDED ============

export const useRecentlyAddedAnime = (provider = 'p1', page = 1) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const cacheKey = `anime-recently-added-${provider}-${page}`;

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
        const result = await animeStreamingApi.getRecentlyAdded(provider, page);
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
  }, [provider, page]);

  return { data, loading, error };
};

// ============ SEARCH ============

export const useAnimeStreamingSearch = (provider = 'p1', query, page = 1) => {
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

    const cacheKey = `anime-search-${provider}-${query}-${page}`;

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
        const result = await animeStreamingApi.search(provider, query, page);
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
  }, [provider, query, page]);

  return { data, loading, error };
};

// ============ ANIME INFO ============

export const useAnimeInfo = (provider = 'p1', animeId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    if (!animeId) {
      setLoading(false);
      return;
    }

    const cacheKey = `anime-info-${provider}-${animeId}`;

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
        const result = await animeStreamingApi.getInfo(provider, animeId);
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
  }, [provider, animeId]);

  return { data, loading, error };
};

// ============ EPISODE SOURCES ============

export const useEpisodeSources = () => {
  const [sources, setSources] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSources = useCallback(async (provider, episodeId, server, subOrDub = 'sub') => {
    if (!episodeId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await animeStreamingApi.getEpisodeSources(provider, episodeId, server, subOrDub);
      if (result.success) {
        // Sources now contain proxy URLs pointing to http://127.0.0.1:PORT/proxy
        // HLS.js can directly use these URLs without needing custom headers
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

export const useEpisodeServers = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchServers = useCallback(async (provider, episodeId) => {
    if (!episodeId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await animeStreamingApi.getEpisodeServers(provider, episodeId);
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

// ============ GENRES ============

export const useAnimeGenres = (provider = 'p1') => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cacheKey = `anime-genres-${provider}`;

    const fetchData = async () => {
      const cached = getCached(cacheKey);
      if (cached) {
        setGenres(cached);
        setLoading(false);
        return;
      }

      try {
        const result = await animeStreamingApi.getGenres(provider);
        if (result.success) {
          setGenres(result.data || []);
          setCache(cacheKey, result.data || []);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [provider]);

  return { genres, loading, error };
};

// ============ GENRE SEARCH ============

export const useAnimeByGenre = (provider = 'p1', genre, page = 1) => {
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

    const cacheKey = `anime-genre-${provider}-${genre}-${page}`;

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
        const result = await animeStreamingApi.genreSearch(provider, genre, page);
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

// ============ SCHEDULE ============

export const useAnimeSchedule = (provider = 'p1', date) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const cacheKey = `anime-schedule-${provider}-${date || 'today'}`;

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
        const result = await animeStreamingApi.getSchedule(provider, date);
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
  }, [provider, date]);

  return { data, loading, error };
};

// ============ TOP UPCOMING ============

export const useTopUpcoming = (provider = 'p1', page = 1) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const cacheKey = `anime-upcoming-${provider}-${page}`;

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
        const result = await animeStreamingApi.getTopUpcoming(provider, page);
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
  }, [provider, page]);

  return { data, loading, error };
};

// ============ LATEST COMPLETED ============

export const useLatestCompleted = (provider = 'p1', page = 1) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const cacheKey = `anime-completed-${provider}-${page}`;

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
        const result = await animeStreamingApi.getLatestCompleted(provider, page);
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
  }, [provider, page]);

  return { data, loading, error };
};
