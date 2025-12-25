import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeStore } from '../../store';
import { useTopAnime, useSearchAnime } from '../../hooks/useAnime';

// Transform API data to our card format
const transformAnimeData = (data) => {
  if (!data?.data) return [];
  return data.data.map(item => ({
    id: item.mal_id,
    title: item.title || item.title_english,
    image: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
    rating: item.score || 0,
    year: item.year || (item.aired?.prop?.from?.year) || 'N/A',
    genre: item.genres?.[0]?.name || 'Anime',
    episodes: item.episodes,
    synopsis: item.synopsis,
    status: item.status,
    type: 'anime',
  }));
};

// Media Card Component
const MediaCard = ({ item, index }) => {
  const { theme } = useThemeStore();
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="relative rounded-xl overflow-hidden"
        animate={{
          scale: isHovered ? 1.03 : 1,
          y: isHovered ? -5 : 0,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        style={{
          boxShadow: isHovered 
            ? `0 15px 30px -10px ${theme.primary}50` 
            : '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <div className="relative aspect-[2/3]">
          {/* Image or fallback */}
          {item.image && !imageError ? (
            <img 
              src={item.image} 
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${theme.primary}60 0%, ${theme.accent}60 100%)` }}
            >
              <span className="text-4xl font-black text-white/40">
                {item.title?.charAt(0) || '?'}
              </span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Rating */}
          {item.rating > 0 && (
            <div 
              className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-bold"
              style={{ background: 'rgba(0,0,0,0.6)', color: '#fbbf24' }}
            >
              ★ {item.rating.toFixed(1)}
            </div>
          )}

          {/* Info */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="font-bold text-white text-sm leading-tight line-clamp-2 mb-1">
              {item.title}
            </h3>
            <div className="flex items-center gap-1 text-xs text-gray-300">
              {item.episodes && <span>{item.episodes} ep</span>}
              {item.episodes && item.year !== 'N/A' && <span>•</span>}
              {item.year !== 'N/A' && <span>{item.year}</span>}
            </div>
          </div>

          {/* Hover actions */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 flex items-center justify-center"
              >
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: theme.primary }}
                >
                  <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Loading Skeleton
const LoadingSkeleton = ({ count = 12 }) => {
  const { theme } = useThemeStore();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array(count).fill(0).map((_, i) => (
        <div 
          key={i} 
          className="aspect-[2/3] rounded-xl animate-pulse"
          style={{ background: theme.surface }}
        />
      ))}
    </div>
  );
};

const AnimeScreen = () => {
  const { theme } = useThemeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [page, setPage] = useState(1);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data - use search API if query exists, otherwise top anime
  const { data: topAnimeData, loading: topLoading, error: topError } = useTopAnime(page, 24, sortBy);
  const { data: searchData, loading: searchLoading, error: searchError } = useSearchAnime(debouncedQuery, page);

  // Choose which data to display
  const isSearching = debouncedQuery.length >= 2;
  const displayData = isSearching ? searchData : topAnimeData;
  const loading = isSearching ? searchLoading : topLoading;
  const error = isSearching ? searchError : topError;

  // Transform data
  const animeList = transformAnimeData(displayData);

  // Client-side sorting for title
  const sortedAnime = useMemo(() => {
    let result = [...animeList];
    if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }
    return result;
  }, [animeList, sortBy]);

  // Pagination info
  const pagination = displayData?.pagination;
  const hasNextPage = pagination?.has_next_page;
  const totalItems = pagination?.items?.total || sortedAnime.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-20 px-8 pb-12"
      style={{ background: theme.background }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-black mb-1" style={{ color: theme.text }}>
            Anime Library
          </h1>
          <p className="text-sm" style={{ color: theme.textSecondary }}>
            Discover the best anime series from around the world
          </p>
        </div>

        {/* Search & Filters */}
        <div
          className="rounded-xl p-4 mb-6"
          style={{ 
            background: theme.surface,
            border: `1px solid ${theme.textSecondary}20`,
          }}
        >
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[250px] relative">
              <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: theme.textSecondary }}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search anime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg text-sm outline-none"
                style={{
                  background: theme.background,
                  color: theme.text,
                  border: `1px solid ${theme.textSecondary}30`,
                }}
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="h-10 px-3 rounded-lg text-sm outline-none cursor-pointer"
              style={{
                background: theme.background,
                color: theme.text,
                border: `1px solid ${theme.textSecondary}30`,
              }}
            >
              <option value="score">Top Rated</option>
              <option value="popularity">Most Popular</option>
              <option value="airing">Currently Airing</option>
              <option value="upcoming">Upcoming</option>
              <option value="title">A-Z</option>
            </select>
          </div>
        </div>

        {/* Results count & Pagination */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm" style={{ color: theme.textSecondary }}>
            {loading ? 'Loading...' : `${totalItems} anime found`}
            {isSearching && ` for "${debouncedQuery}"`}
          </span>
          
          {!loading && pagination && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded text-sm font-medium transition-opacity disabled:opacity-30"
                style={{ background: theme.surface, color: theme.text }}
              >
                ← Prev
              </button>
              <span className="text-sm" style={{ color: theme.textSecondary }}>
                Page {page}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!hasNextPage}
                className="px-3 py-1 rounded text-sm font-medium transition-opacity disabled:opacity-30"
                style={{ background: theme.surface, color: theme.text }}
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && <LoadingSkeleton />}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-lg font-bold mb-1" style={{ color: theme.text }}>
              Failed to load anime
            </h3>
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              {error}
            </p>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && sortedAnime.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {sortedAnime.map((anime, index) => (
              <MediaCard key={anime.id} item={anime} index={index} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && sortedAnime.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-bold mb-1" style={{ color: theme.text }}>
              No anime found
            </h3>
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              {isSearching ? 'Try a different search term' : 'Try different filters'}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AnimeScreen;
