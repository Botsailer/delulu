import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeStore, useNavigationStore } from '../../store';
import VideoPlayer from '../VideoPlayer';
import {
  useMovieProviders,
  useMovieSpotlight,
  useTrendingMovies,
  useTrendingTvShows,
  useRecentMovies,
  useRecentTvShows,
  useMovieSearch,
  useMovieInfo,
  useMovieEpisodeSources,
  useMovieEpisodeServers,
  useMoviesByGenre,
} from '../../hooks/useMovieStreaming';

// ============ MEDIA CARD COMPONENT ============
const MediaCard = ({ item, index, provider, onPlay, onInfo }) => {
  const { theme } = useThemeStore();
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleClick = () => {
    if (onInfo) onInfo(item, provider);
  };

  const handlePlay = (e) => {
    e.stopPropagation();
    if (onPlay) onPlay(item, provider);
  };

  const isMovie = item.type === 'Movie' || item.id?.includes('movie');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.2) }}
      className="cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <motion.div
        className="relative rounded-lg sm:rounded-xl overflow-hidden"
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
          {/* Loading skeleton */}
          {imageLoading && !imageError && (
            <div 
              className="absolute inset-0 animate-pulse"
              style={{ background: theme.surface }}
            />
          )}
          
          {item.image && !imageError ? (
            <img 
              src={item.image} 
              alt={item.title}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
              loading="lazy"
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
            />
          ) : (
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${theme.primary}60 0%, ${theme.accent}60 100%)` }}
            >
              <span className="text-2xl sm:text-3xl md:text-4xl font-black text-white/40">
                {item.title?.charAt(0) || '?'}
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Rating badge */}
          {item.rating && (
            <div 
              className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold"
              style={{ background: 'rgba(0,0,0,0.6)', color: '#fbbf24' }}
            >
              ★ {typeof item.rating === 'number' ? item.rating.toFixed(1) : item.rating}
            </div>
          )}

          {/* Type badge */}
          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex gap-1">
            <span 
              className="px-1 sm:px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] font-bold uppercase"
              style={{ 
                background: isMovie ? '#3b82f6' : '#10b981',
                color: '#fff'
              }}
            >
              {isMovie ? 'Movie' : 'TV'}
            </span>
          </div>

          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
            <h3 className="font-bold text-white text-xs sm:text-sm leading-tight line-clamp-2 mb-0.5 sm:mb-1">
              {item.title}
            </h3>
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-300 flex-wrap">
              {item.releaseDate && <span>{item.releaseDate}</span>}
              {item.duration && <span className="hidden xs:inline">• {item.duration}</span>}
              {item.seasons && <span>• S{item.seasons}</span>}
            </div>
          </div>

          {/* Hover play button */}
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
                  onClick={handlePlay}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                  style={{ background: theme.primary }}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
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

// ============ LOADING SKELETON ============
const LoadingSkeleton = ({ count = 12 }) => {
  const { theme } = useThemeStore();
  return (
    <div className="grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 sm:gap-3 md:gap-4">
      {Array(count).fill(0).map((_, i) => (
        <div 
          key={i} 
          className="aspect-[2/3] rounded-lg sm:rounded-xl animate-pulse"
          style={{ background: theme.surface }}
        />
      ))}
    </div>
  );
};

// ============ ROW SKELETON ============
const RowSkeleton = ({ count = 8 }) => {
  const { theme } = useThemeStore();
  return (
    <div className="flex gap-2 sm:gap-3 overflow-hidden">
      {Array(count).fill(0).map((_, i) => (
        <div 
          key={i} 
          className="flex-shrink-0 w-24 xs:w-28 sm:w-32 md:w-36 lg:w-40 aspect-[2/3] rounded-lg sm:rounded-xl animate-pulse"
          style={{ background: theme.surface }}
        />
      ))}
    </div>
  );
};

// ============ HORIZONTAL SCROLL ROW ============
const MovieRow = ({ title, items = [], loading, error, provider, onPlay, onInfo }) => {
  const { theme } = useThemeStore();
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Update arrow visibility on scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      handleScroll();
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [items, handleScroll]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (error) return null;

  return (
    <div className="mb-4 sm:mb-6 group/row">
      <h2 className="text-sm sm:text-base md:text-lg font-bold mb-2 sm:mb-3 px-3 sm:px-4 md:px-6 lg:px-8" style={{ color: theme.text }}>
        {title}
      </h2>
      {loading ? (
        <div className="px-3 sm:px-4 md:px-6 lg:px-8">
          <RowSkeleton />
        </div>
      ) : items.length > 0 ? (
        <div className="relative">
          {/* Left Arrow */}
          <motion.button
            initial={false}
            animate={{ opacity: showLeftArrow ? 1 : 0, pointerEvents: showLeftArrow ? 'auto' : 'none' }}
            className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
            style={{ background: `${theme.surface}ee`, color: theme.text }}
            onClick={() => scroll('left')}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>

          <div 
            ref={scrollRef}
            className="overflow-x-auto scrollbar-hide px-3 sm:px-4 md:px-6 lg:px-8 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex gap-2 sm:gap-3 pb-2">
              {items.map((item, index) => (
                <div key={item.id || index} className="flex-shrink-0 w-24 xs:w-28 sm:w-32 md:w-36 lg:w-40">
                  <MediaCard 
                    item={item} 
                    index={index} 
                    provider={provider}
                    onPlay={onPlay}
                    onInfo={onInfo}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right Arrow */}
          <motion.button
            initial={false}
            animate={{ opacity: showRightArrow ? 1 : 0, pointerEvents: showRightArrow ? 'auto' : 'none' }}
            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
            style={{ background: `${theme.surface}ee`, color: theme.text }}
            onClick={() => scroll('right')}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        </div>
      ) : null}
    </div>
  );
};

// ============ SPOTLIGHT BANNER ============
const SpotlightBanner = ({ items = [], loading, provider, onPlay, onInfo }) => {
  const { theme } = useThemeStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [items.length]);

  if (loading) {
    return (
      <div 
        className="w-full h-[50vh] sm:h-[60vh] md:h-[70vh] animate-pulse"
        style={{ background: theme.surface }}
      />
    );
  }

  if (items.length === 0) return null;

  const current = items[currentIndex];
  const isMovie = current.type === 'Movie' || current.id?.includes('movie');

  return (
    <div className="relative w-full h-[50vh] sm:h-[60vh] md:h-[70vh] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          {(current.cover || current.image || current.banner) && (
            <img
              src={current.cover || current.banner || current.image}
              alt={current.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

          <div className="absolute inset-0 flex items-end pb-16 sm:pb-20 md:pb-24 px-4 sm:px-6 md:px-8">
            <div className="max-w-2xl">
              {current.rank && (
                <span 
                  className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3"
                  style={{ background: theme.primary, color: '#fff' }}
                >
                  #{current.rank} Spotlight
                </span>
              )}

              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 leading-tight">
                {current.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                {current.rating && (
                  <span className="px-2 py-1 rounded text-xs font-bold" style={{ background: '#fbbf24', color: '#000' }}>
                    ★ {current.rating}
                  </span>
                )}
                <span 
                  className="px-2 py-1 rounded text-xs font-bold"
                  style={{ background: isMovie ? '#3b82f6' : '#10b981', color: '#fff' }}
                >
                  {isMovie ? 'Movie' : 'TV Series'}
                </span>
                {current.releaseDate && (
                  <span className="text-sm text-gray-300">{current.releaseDate}</span>
                )}
                {current.duration && (
                  <span className="text-sm text-gray-300">• {current.duration}</span>
                )}
              </div>

              {current.description && (
                <p className="text-sm sm:text-base text-gray-300 line-clamp-2 sm:line-clamp-3 mb-4">
                  {current.description.replace(/<[^>]*>/g, '')}
                </p>
              )}

              {current.genres?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {current.genres.slice(0, 4).map((genre, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded-full text-xs"
                      style={{ background: `${theme.primary}40`, color: theme.primary }}
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onPlay?.(current, provider)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm hover:scale-105 transition-transform"
                  style={{ background: theme.primary, color: '#fff' }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  Watch Now
                </button>
                <button
                  onClick={() => onInfo?.(current, provider)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm hover:scale-105 transition-transform"
                  style={{ 
                    background: 'rgba(255,255,255,0.1)', 
                    color: '#fff',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  More Info
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {items.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {items.slice(0, 8).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex ? 'w-6' : 'opacity-50 hover:opacity-75'
              }`}
              style={{ background: i === currentIndex ? theme.primary : '#fff' }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============ MOVIE INFO MODAL ============
const MovieInfoModal = ({ media, provider, isOpen, onClose, onPlay }) => {
  const { theme } = useThemeStore();
  const { data: mediaInfo, loading } = useMovieInfo(provider, isOpen ? media?.id : null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(1);

  const info = mediaInfo || media;
  const isMovie = info?.type === 'Movie' || info?.id?.includes('movie');

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !media) return null;

  // For TV shows, group episodes by season
  const episodes = info?.episodes || [];
  const seasons = [...new Set(episodes.map(ep => ep.season || 1))].sort((a, b) => a - b);
  const currentSeasonEpisodes = episodes.filter(ep => (ep.season || 1) === selectedSeason);

  return (
    <AnimatePresence>
      <motion.div
        key="movie-info-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
        onClick={onClose}
      />
      <motion.div
        key="movie-info-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-2 sm:inset-4 md:inset-8 lg:inset-16 z-[201] overflow-hidden rounded-2xl flex flex-col"
        style={{
          background: theme.surface,
          border: `1px solid ${theme.textSecondary}30`,
        }}
      >
        {/* Header */}
        <div 
          className="relative h-40 sm:h-48 md:h-56 flex-shrink-0"
          style={{ 
            background: info.image || info.cover
              ? `url(${info.cover || info.image}) center/cover`
              : `linear-gradient(135deg, ${theme.primary}60 0%, ${theme.accent}60 100%)`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            style={{ background: `${theme.background}cc`, color: theme.text }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="absolute bottom-4 left-4 right-16">
            <div className="flex items-center gap-2 mb-2">
              <span 
                className="px-2 py-0.5 rounded text-xs font-bold"
                style={{ background: isMovie ? '#3b82f6' : '#10b981', color: '#fff' }}
              >
                {isMovie ? 'Movie' : 'TV Series'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white">
              {info.title}
            </h2>
          </div>
        </div>

        {/* Actions */}
        <div 
          className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: `${theme.textSecondary}20` }}
        >
          <button
            onClick={() => {
              if (isMovie) {
                // For movies, play directly with the movie ID
                const movieEpisode = episodes[0] || { id: info.id };
                onPlay?.(media, provider, movieEpisode, episodes);
              } else if (currentSeasonEpisodes.length > 0) {
                // For TV shows, play first episode of current season
                onPlay?.(media, provider, currentSeasonEpisodes[0], episodes);
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm hover:scale-105 transition-transform"
            style={{ background: theme.primary, color: '#fff' }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            Watch Now
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {info.rating && (
              <span className="px-2 py-1 rounded text-sm font-bold" style={{ background: theme.primary, color: '#fff' }}>
                ★ {info.rating}
              </span>
            )}
            {info.releaseDate && (
              <span style={{ color: theme.textSecondary }}>{info.releaseDate}</span>
            )}
            {info.duration && (
              <span style={{ color: theme.textSecondary }}>• {info.duration}</span>
            )}
            {info.country && (
              <span style={{ color: theme.textSecondary }}>• {info.country}</span>
            )}
          </div>

          {/* Genres */}
          {info.genres?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {info.genres.map((genre, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded-full text-xs"
                  style={{ background: `${theme.primary}20`, color: theme.primary }}
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* Cast */}
          {info.casts?.length > 0 && (
            <div className="mb-4">
              <span className="font-medium" style={{ color: theme.text }}>Cast: </span>
              <span style={{ color: theme.textSecondary }}>{info.casts.slice(0, 5).join(', ')}</span>
            </div>
          )}

          {/* Description */}
          {info.description && (
            <div className="mb-6">
              <h3 className="font-bold mb-2" style={{ color: theme.text }}>Synopsis</h3>
              <p className="text-sm leading-relaxed" style={{ color: theme.textSecondary }}>
                {info.description.replace(/<[^>]*>/g, '')}
              </p>
            </div>
          )}

          {/* Episodes (for TV shows) */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: theme.primary }} />
            </div>
          ) : !isMovie && episodes.length > 0 ? (
            <div>
              {/* Season selector */}
              {seasons.length > 1 && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-bold" style={{ color: theme.text }}>Season:</span>
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-lg text-sm outline-none cursor-pointer"
                    style={{
                      background: theme.background,
                      color: theme.text,
                      border: `1px solid ${theme.textSecondary}40`,
                    }}
                  >
                    {seasons.map((season) => (
                      <option key={season} value={season}>
                        Season {season}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <h3 className="font-bold mb-3" style={{ color: theme.text }}>
                Episodes ({currentSeasonEpisodes.length})
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {currentSeasonEpisodes.map((ep, index) => (
                  <button
                    key={ep.id || index}
                    onClick={() => {
                      setSelectedEpisode(ep);
                      onPlay?.(media, provider, ep, episodes);
                    }}
                    className="py-2 px-3 rounded text-sm font-medium transition-all hover:scale-105"
                    style={{ 
                      background: selectedEpisode?.id === ep.id ? theme.primary : theme.background,
                      color: selectedEpisode?.id === ep.id ? '#fff' : theme.text,
                      border: `1px solid ${theme.textSecondary}30`,
                    }}
                  >
                    {ep.number || ep.episode || index + 1}
                  </button>
                ))}
              </div>
            </div>
          ) : isMovie ? (
            <div className="text-center py-8">
              <p style={{ color: theme.textSecondary }}>Click "Watch Now" to start streaming</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p style={{ color: theme.textSecondary }}>No episodes available</p>
            </div>
          )}

          {/* Recommendations */}
          {info.recommendations?.length > 0 && (
            <div className="mt-8">
              <h3 className="font-bold mb-3" style={{ color: theme.text }}>
                You May Also Like
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {info.recommendations.slice(0, 6).map((rec, index) => (
                  <div
                    key={rec.id || index}
                    className="aspect-[2/3] rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform relative"
                    onClick={() => {
                      onClose();
                      setTimeout(() => onPlay?.(rec, provider), 100);
                    }}
                  >
                    {rec.image ? (
                      <img src={rec.image} alt={rec.title} className="w-full h-full object-cover" />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: theme.background }}
                      >
                        <span className="text-2xl font-bold text-white/30">{rec.title?.charAt(0)}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-xs text-white font-medium line-clamp-2">{rec.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============ VIDEO PLAYER MODAL ============
const VideoPlayerModal = ({ isOpen, onClose, media, episode, provider, onNextEpisode, onPrevEpisode, episodes = [] }) => {
  const { theme } = useThemeStore();
  const { sources, loading, error, fetchSources, clearSources } = useMovieEpisodeSources();
  const { servers, fetchServers } = useMovieEpisodeServers();
  const [selectedServer, setSelectedServer] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [failedServers, setFailedServers] = useState(new Set());
  const [autoSwitching, setAutoSwitching] = useState(false);
  const errorCountRef = useRef(0);
  const lastErrorTimeRef = useRef(0);
  
  const isMovie = media?.type === 'Movie' || media?.id?.includes('movie');
  const mediaId = media?.id;

  // Memoize video source URL
  const videoSourceUrl = useMemo(() => {
    const source = sources?.sources?.find(s => s.quality === 'auto' || s.quality === 'default')
      || sources?.sources?.find(s => s.quality === '1080p')
      || sources?.sources?.find(s => s.quality === '720p')
      || sources?.sources?.[0];
    return source?.url || null;
  }, [sources?.sources]);

  // Memoize subtitles
  const subtitles = useMemo(() => sources?.subtitles || [], [sources?.subtitles]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setVideoReady(false);
      setVideoError(false);
      setFailedServers(new Set());
      setAutoSwitching(false);
      errorCountRef.current = 0;
    }
  }, [isOpen, episode?.id]);

  // Auto-select first available server when servers load
  useEffect(() => {
    if (servers.length > 0 && !selectedServer) {
      // Select first server by default
      setSelectedServer(servers[0]?.name || null);
    }
  }, [servers, selectedServer]);

  // Get next available server that hasn't failed
  const getNextServer = useCallback(() => {
    const availableServers = servers.filter(s => !failedServers.has(s.name));
    if (availableServers.length === 0) return null;
    
    const currentIdx = availableServers.findIndex(s => s.name === selectedServer);
    const nextIdx = (currentIdx + 1) % availableServers.length;
    return availableServers[nextIdx]?.name || availableServers[0]?.name;
  }, [servers, selectedServer, failedServers]);

  // Auto-switch server on error
  useEffect(() => {
    if (error && !autoSwitching && servers.length > 1) {
      const now = Date.now();
      // Prevent rapid switching (wait at least 2 seconds between switches)
      if (now - lastErrorTimeRef.current < 2000) return;
      
      errorCountRef.current += 1;
      lastErrorTimeRef.current = now;
      
      // After 2 consecutive errors on same server, switch to next
      if (errorCountRef.current >= 2) {
        const nextServer = getNextServer();
        if (nextServer && nextServer !== selectedServer) {
          setAutoSwitching(true);
          setFailedServers(prev => new Set([...prev, selectedServer]));
          
          setTimeout(() => {
            setSelectedServer(nextServer);
            errorCountRef.current = 0;
            setAutoSwitching(false);
          }, 1000);
        }
      }
    }
  }, [error, servers, selectedServer, autoSwitching, getNextServer]);

  // Handle video ready
  const handleVideoReady = useCallback(() => {
    setVideoReady(true);
    setVideoError(false);
    errorCountRef.current = 0;
  }, []);

  // Handle video error - auto switch server
  const handleVideoError = useCallback(() => {
    setVideoError(true);
    const now = Date.now();
    
    if (now - lastErrorTimeRef.current > 2000 && servers.length > 1) {
      lastErrorTimeRef.current = now;
      const nextServer = getNextServer();
      if (nextServer && nextServer !== selectedServer) {
        setAutoSwitching(true);
        setFailedServers(prev => new Set([...prev, selectedServer]));
        
        setTimeout(() => {
          setSelectedServer(nextServer);
          setAutoSwitching(false);
          setVideoError(false);
        }, 1500);
      }
    }
  }, [servers, selectedServer, getNextServer]);

  useEffect(() => {
    if (isOpen && episode?.id && mediaId) {
      setVideoReady(false);
      fetchSources(provider, episode.id, mediaId, selectedServer);
      fetchServers(provider, episode.id, mediaId);
    }
    return () => clearSources();
  }, [isOpen, episode?.id, mediaId, provider, selectedServer]);

  // Auto-hide controls
  useEffect(() => {
    if (!isOpen) return;
    
    let timeout;
    const hideControls = () => {
      timeout = setTimeout(() => setShowControls(false), 3000);
    };
    
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      hideControls();
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    hideControls();
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isOpen]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  // Find current episode index for prev/next navigation
  const currentEpisodeIndex = episodes.findIndex(ep => ep.id === episode?.id);
  const hasPrevEpisode = currentEpisodeIndex > 0;
  const hasNextEpisode = currentEpisodeIndex < episodes.length - 1 && currentEpisodeIndex !== -1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-[300]"
      >
        {/* Top controls bar */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: showControls ? 0 : -100, opacity: showControls ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute top-0 left-0 right-0 z-20 p-4"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }}
        >
          <div className="flex items-center justify-between">
            {/* Left: Title and episode */}
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white truncate">{media?.title}</h2>
              {!isMovie && episode && (
                <p className="text-xs sm:text-sm text-gray-300">
                  {episode.season ? `S${episode.season} ` : ''}Episode {episode.number || episode.episode || 1}
                  {episode.title && ` - ${episode.title}`}
                </p>
              )}
            </div>

            {/* Center: Server controls */}
            <div className="hidden sm:flex items-center gap-3 px-4">
              {servers.length > 0 && (
                <select
                  value={selectedServer || ''}
                  onChange={(e) => setSelectedServer(e.target.value || null)}
                  className="px-3 py-1.5 rounded-lg text-sm bg-white/10 text-white backdrop-blur outline-none border border-white/20 cursor-pointer"
                >
                  <option value="" className="bg-gray-900">Auto Server</option>
                  {servers.map((server, i) => (
                    <option key={i} value={server.name} className="bg-gray-900">
                      {server.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Right: Close button */}
            <button
              onClick={onClose}
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile controls row */}
          <div className="sm:hidden flex items-center gap-2 mt-3">
            {servers.length > 0 && (
              <select
                value={selectedServer || ''}
                onChange={(e) => setSelectedServer(e.target.value || null)}
                className="flex-1 px-2 py-1.5 rounded text-xs bg-white/10 text-white outline-none"
              >
                <option value="">Auto</option>
                {servers.map((server, i) => (
                  <option key={i} value={server.name}>{server.name}</option>
                ))}
              </select>
            )}
          </div>
        </motion.div>

        {/* Episode navigation buttons (for TV shows) */}
        {!isMovie && episodes.length > 1 && (
          <>
            {hasPrevEpisode && (
              <motion.button
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: showControls ? 0 : -100, opacity: showControls ? 1 : 0 }}
                onClick={() => onPrevEpisode?.(episodes[currentEpisodeIndex - 1])}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full hover:scale-110 transition-transform"
                style={{ background: 'rgba(0,0,0,0.6)' }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>
            )}

            {hasNextEpisode && (
              <motion.button
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: showControls ? 0 : 100, opacity: showControls ? 1 : 0 }}
                onClick={() => onNextEpisode?.(episodes[currentEpisodeIndex + 1])}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full hover:scale-110 transition-transform"
                style={{ background: 'rgba(0,0,0,0.6)' }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            )}
          </>
        )}

        {/* Video content */}
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          {(loading || autoSwitching || (!videoReady && videoSourceUrl && !error)) ? (
            <div className="flex flex-col items-center gap-4">
              <div 
                className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: `${theme.primary} transparent transparent transparent` }}
              />
              <p className="text-white text-base font-medium">
                {autoSwitching ? 'Switching server...' : loading ? 'Loading video sources...' : 'Initializing player...'}
              </p>
              <p className="text-gray-500 text-sm">
                {selectedServer || 'Selecting best server...'}
                {failedServers.size > 0 && ` (${failedServers.size} server${failedServers.size > 1 ? 's' : ''} failed)`}
              </p>
              {/* Refresh button while loading */}
              {!autoSwitching && (
                <button
                  onClick={() => {
                    setVideoReady(false);
                    fetchSources(provider, episode?.id, mediaId, selectedServer);
                  }}
                  className="mt-2 px-4 py-2 rounded-lg font-medium text-sm hover:scale-105 transition-transform flex items-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              )}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4 text-center px-4">
              <div className="text-5xl">⚠️</div>
              <h3 className="text-lg font-bold text-white">Failed to load video</h3>
              <p className="text-gray-400 max-w-md text-sm">{error}</p>
              {failedServers.size > 0 && (
                <p className="text-gray-500 text-xs">
                  Failed servers: {[...failedServers].join(', ')}
                </p>
              )}
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                <button
                  onClick={() => {
                    setVideoReady(false);
                    setFailedServers(new Set());
                    errorCountRef.current = 0;
                    fetchSources(provider, episode?.id, mediaId, selectedServer);
                  }}
                  className="px-5 py-2.5 rounded-lg font-medium hover:scale-105 transition-transform flex items-center gap-2"
                  style={{ background: theme.primary, color: '#fff' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Retry
                </button>
                {servers.length > 1 && (
                  <button
                    onClick={() => {
                      // Try next available server
                      const nextServer = getNextServer();
                      if (nextServer) {
                        setSelectedServer(nextServer);
                        setVideoReady(false);
                      }
                    }}
                    className="px-5 py-2.5 rounded-lg font-medium hover:scale-105 transition-transform"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                  >
                    Try Another Server
                  </button>
                )}
              </div>
            </div>
          ) : videoSourceUrl ? (
            <VideoPlayer
              src={videoSourceUrl}
              title={isMovie ? media?.title : `${media?.title} - Episode ${episode?.number || 1}`}
              poster={null}
              subtitles={subtitles}
              autoPlay={true}
              onReady={handleVideoReady}
              onEnded={() => {
                if (!isMovie && hasNextEpisode) {
                  onNextEpisode?.(episodes[currentEpisodeIndex + 1]);
                }
              }}
              onError={handleVideoError}
              className="w-full h-full"
            />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="text-5xl">📺</div>
              <p className="text-gray-400">No video sources available</p>
              {servers.length > 1 && (
                <p className="text-gray-500 text-xs">
                  Try switching to a different server
                </p>
              )}
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                <button
                  onClick={() => {
                    setVideoReady(false);
                    fetchSources(provider, episode?.id, mediaId, selectedServer);
                  }}
                  className="px-5 py-2.5 rounded-lg font-medium hover:scale-105 transition-transform flex items-center gap-2"
                  style={{ background: theme.primary, color: '#fff' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Retry
                </button>
                {servers.length > 1 && (
                  <button
                    onClick={() => {
                      const nextServer = getNextServer();
                      if (nextServer) {
                        setSelectedServer(nextServer);
                        setVideoReady(false);
                      }
                    }}
                    className="px-5 py-2.5 rounded-lg font-medium hover:scale-105 transition-transform"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                  >
                    Try Another Server
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============ MAIN MOVIES SCREEN ============
const MoviesScreen = () => {
  const { theme } = useThemeStore();
  const { selectedMovie, selectedMovieProvider: navProvider, clearSelected } = useNavigationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(navProvider || 'm1');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('home');

  // Modal states
  const [infoModal, setInfoModal] = useState({ isOpen: false, media: null, provider: null });
  const [playerModal, setPlayerModal] = useState({ isOpen: false, media: null, episode: null, provider: null, episodes: [] });

  // Check if we have a pre-selected movie from navigation
  useEffect(() => {
    if (selectedMovie) {
      setInfoModal({ isOpen: true, media: selectedMovie, provider: navProvider || 'm1' });
      clearSelected();
    }
  }, [selectedMovie, navProvider, clearSelected]);

  // Fetch providers
  const { providers } = useMovieProviders();

  // Get current provider meta
  const currentProvider = providers.find(p => p.id === selectedProvider) || {};

  // Fetch data based on provider
  const { data: spotlightData, loading: spotlightLoading } = useMovieSpotlight(selectedProvider);
  const { data: trendingMoviesData, loading: trendingMoviesLoading, error: trendingMoviesError } = useTrendingMovies(selectedProvider);
  const { data: trendingTvData, loading: trendingTvLoading, error: trendingTvError } = useTrendingTvShows(selectedProvider);
  const { data: recentMoviesData, loading: recentMoviesLoading, error: recentMoviesError } = useRecentMovies(selectedProvider);
  const { data: recentTvData, loading: recentTvLoading, error: recentTvError } = useRecentTvShows(selectedProvider);
  const { results: searchData, loading: searchLoading, error: searchError, search, clearResults } = useMovieSearch();
  const { data: genreData, loading: genreLoading, error: genreError } = useMoviesByGenre(selectedProvider, selectedGenre, page);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      if (searchQuery.trim().length >= 2) {
        search(selectedProvider, searchQuery, page);
        setViewMode('search');
      } else if (searchQuery.trim().length === 0 && viewMode === 'search') {
        clearResults();
        setViewMode('home');
      }
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedProvider]);

  // Get items from results
  const getItems = (data) => data?.results || [];

  // Available genres for movies
  const movieGenres = [
    'action', 'adventure', 'animation', 'biography', 'comedy', 'crime', 'documentary',
    'drama', 'family', 'fantasy', 'history', 'horror', 'musical', 'mystery', 'romance',
    'sci-fi', 'sport', 'thriller', 'war', 'western'
  ];

  // Handlers
  const handlePlay = (media, provider, episode, episodes = []) => {
    if (episode) {
      setPlayerModal({ isOpen: true, media, episode, provider, episodes });
    } else {
      setInfoModal({ isOpen: true, media, provider });
    }
  };

  const handleInfo = (media, provider) => {
    setInfoModal({ isOpen: true, media, provider });
  };

  const handleGenreSelect = (genre) => {
    setSelectedGenre(genre);
    setViewMode('genre');
    setPage(1);
  };

  // Render content based on view mode
  const renderContent = () => {
    if (viewMode === 'search' && debouncedQuery) {
      return (
        <div className="px-4 sm:px-6 md:px-8 pb-8 pt-32">
          <h2 className="text-lg font-bold mb-4" style={{ color: theme.text }}>
            Search Results for "{debouncedQuery}"
          </h2>
          {searchLoading ? (
            <LoadingSkeleton />
          ) : searchError ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">⚠️</div>
              <p style={{ color: theme.textSecondary }}>{searchError}</p>
            </div>
          ) : getItems(searchData).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4">
              {getItems(searchData).map((item, index) => (
                <MediaCard
                  key={item.id || index}
                  item={item}
                  index={index}
                  provider={selectedProvider}
                  onPlay={handlePlay}
                  onInfo={handleInfo}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="font-bold mb-2" style={{ color: theme.text }}>No results found</h3>
              <p style={{ color: theme.textSecondary }}>Try a different search term</p>
            </div>
          )}
        </div>
      );
    }

    if (viewMode === 'genre' && selectedGenre) {
      return (
        <div className="px-4 sm:px-6 md:px-8 pb-8 pt-32">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => {
                setViewMode('home');
                setSelectedGenre('');
              }}
              className="p-2 rounded-lg hover:scale-105 transition-transform"
              style={{ background: theme.surface }}
            >
              <svg className="w-5 h-5" style={{ color: theme.text }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-bold" style={{ color: theme.text }}>
              {selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1)} Movies & TV
            </h2>
          </div>
          {genreLoading ? (
            <LoadingSkeleton />
          ) : genreError ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">⚠️</div>
              <p style={{ color: theme.textSecondary }}>{genreError}</p>
            </div>
          ) : getItems(genreData).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4">
              {getItems(genreData).map((item, index) => (
                <MediaCard
                  key={item.id || index}
                  item={item}
                  index={index}
                  provider={selectedProvider}
                  onPlay={handlePlay}
                  onInfo={handleInfo}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🎬</div>
              <p style={{ color: theme.textSecondary }}>No content found for this genre</p>
            </div>
          )}
        </div>
      );
    }

    // Home view
    return (
      <>
        {/* Spotlight - only if provider supports it */}
        {currentProvider.hasSpotlight && (
          <SpotlightBanner
            items={getItems(spotlightData)}
            loading={spotlightLoading}
            provider={selectedProvider}
            onPlay={handlePlay}
            onInfo={handleInfo}
          />
        )}

        {/* Content rows */}
        <div className={currentProvider.hasSpotlight ? 'mt-[-4rem] relative z-10' : 'pt-32'}>
          {currentProvider.hasTrendingMovies && (
            <MovieRow
              title="🔥 Trending Movies"
              items={getItems(trendingMoviesData)}
              loading={trendingMoviesLoading}
              error={trendingMoviesError}
              provider={selectedProvider}
              onPlay={handlePlay}
              onInfo={handleInfo}
            />
          )}

          {currentProvider.hasTrendingTvShows && (
            <MovieRow
              title="📺 Trending TV Shows"
              items={getItems(trendingTvData)}
              loading={trendingTvLoading}
              error={trendingTvError}
              provider={selectedProvider}
              onPlay={handlePlay}
              onInfo={handleInfo}
            />
          )}

          {currentProvider.hasRecentMovies && (
            <MovieRow
              title="🎬 Latest Movies"
              items={getItems(recentMoviesData)}
              loading={recentMoviesLoading}
              error={recentMoviesError}
              provider={selectedProvider}
              onPlay={handlePlay}
              onInfo={handleInfo}
            />
          )}

          {currentProvider.hasRecentTvShows && (
            <MovieRow
              title="✨ Latest TV Shows"
              items={getItems(recentTvData)}
              loading={recentTvLoading}
              error={recentTvError}
              provider={selectedProvider}
              onPlay={handlePlay}
              onInfo={handleInfo}
            />
          )}

          {/* Genres */}
          {currentProvider.hasByGenre && (
            <div className="mb-6 px-4 sm:px-6 md:px-8">
              <h2 className="text-base sm:text-lg font-bold mb-3" style={{ color: theme.text }}>
                🎭 Browse by Genre
              </h2>
              <div className="flex flex-wrap gap-2">
                {movieGenres.map((genre, i) => (
                  <button
                    key={i}
                    onClick={() => handleGenreSelect(genre)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium hover:scale-105 transition-transform"
                    style={{ 
                      background: `${theme.primary}20`, 
                      color: theme.primary,
                      border: `1px solid ${theme.primary}40`,
                    }}
                  >
                    {genre.charAt(0).toUpperCase() + genre.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer space */}
          <div className="h-16" />
        </div>
      </>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
      style={{ background: theme.background }}
    >
      {/* Fixed header with search */}
      <div 
        className="fixed top-14 left-0 right-0 z-40 pt-4"
        style={{ 
          background: viewMode === 'home' && currentProvider.hasSpotlight 
            ? 'transparent' 
            : `linear-gradient(to bottom, ${theme.background} 60%, transparent)`,
        }}
      >
        <div className="px-4 sm:px-6 md:px-8 pb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-7xl mx-auto">
            {/* Search */}
            <div className="flex-1 relative">
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
                placeholder="Search movies & TV shows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg text-sm outline-none"
                style={{
                  background: `${theme.surface}dd`,
                  color: theme.text,
                  border: `1px solid ${theme.textSecondary}30`,
                  backdropFilter: 'blur(10px)',
                }}
              />
            </div>

            {/* Provider selector */}
            <select
              value={selectedProvider}
              onChange={(e) => {
                // Preserve scroll position when changing provider
                const scrollY = window.scrollY;
                setSelectedProvider(e.target.value);
                setViewMode('home');
                setSearchQuery('');
                setSelectedGenre('');
                clearResults();
                // Restore scroll position after state updates
                requestAnimationFrame(() => {
                  window.scrollTo(0, scrollY);
                });
              }}
              className="h-10 px-3 rounded-lg text-sm outline-none cursor-pointer min-w-[120px] flex-shrink-0"
              style={{
                background: `${theme.surface}dd`,
                color: theme.text,
                border: `1px solid ${theme.textSecondary}30`,
                backdropFilter: 'blur(10px)',
              }}
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main content */}
      {renderContent()}

      {/* Modals */}
      <MovieInfoModal
        media={infoModal.media}
        provider={infoModal.provider}
        isOpen={infoModal.isOpen}
        onClose={() => setInfoModal({ isOpen: false, media: null, provider: null })}
        onPlay={(media, provider, episode, episodes) => {
          setInfoModal({ isOpen: false, media: null, provider: null });
          handlePlay(media, provider, episode, episodes);
        }}
      />

      <VideoPlayerModal
        isOpen={playerModal.isOpen}
        onClose={() => setPlayerModal({ isOpen: false, media: null, episode: null, provider: null, episodes: [] })}
        media={playerModal.media}
        episode={playerModal.episode}
        provider={playerModal.provider}
        episodes={playerModal.episodes}
        onNextEpisode={(nextEp) => {
          setPlayerModal(prev => ({ ...prev, episode: nextEp }));
        }}
        onPrevEpisode={(prevEp) => {
          setPlayerModal(prev => ({ ...prev, episode: prevEp }));
        }}
      />
    </motion.div>
  );
};

export default MoviesScreen;
