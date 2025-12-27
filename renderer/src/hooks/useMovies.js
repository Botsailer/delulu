import { useState, useEffect } from 'react';
import { movieStreamingApi } from '../services/api';

// Use movie API for fetching movie data
export const useTrendingMovies = (provider = 'm1', page = 1) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await movieStreamingApi.getTrendingMovies(provider);

        if (!mounted) return;

        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch trending movies');
        }
      } catch (err) {
        if (mounted) {
          setError(err);
          console.error('[useTrendingMovies] Error:', err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [provider, page]);

  return { data, loading, error };
};

export const useTrendingTvShows = (provider = 'm1', page = 1) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await movieStreamingApi.getTrendingTvShows(provider);

        if (!mounted) return;

        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch trending TV shows');
        }
      } catch (err) {
        if (mounted) {
          setError(err);
          console.error('[useTrendingTvShows] Error:', err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [provider, page]);

  return { data, loading, error };
};

export const useRecentMovies = (provider = 'm1') => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await movieStreamingApi.getRecentMovies(provider);

        if (!mounted) return;

        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch recent movies');
        }
      } catch (err) {
        if (mounted) {
          setError(err);
          console.error('[useRecentMovies] Error:', err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [provider]);

  return { data, loading, error };
};

export const useSpotlightMovies = (provider = 'm2') => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // FlixHQ (m2) and SFlix (m4) support spotlight
        const result = await movieStreamingApi.getSpotlight(provider);

        if (!mounted) return;

        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch spotlight movies');
        }
      } catch (err) {
        if (mounted) {
          setError(err);
          console.error('[useSpotlightMovies] Error:', err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [provider]);

  return { data, loading, error };
};
