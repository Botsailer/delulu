import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeStore, useNavigationStore } from '../../store';
import { useAnimeSpotlight } from '../../hooks/useAnimeStreaming';
import { useMovieSpotlight } from '../../hooks/useMovieStreaming';
import ProxiedImage from '../ProxiedImage';

// More Info Modal Component
const AnimeInfoModal = ({ anime, isOpen, onClose, theme }) => {
  // Handle keyboard events
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' || e.key === 'Backspace') {
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

  if (!isOpen || !anime) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 sm:inset-8 md:inset-12 lg:inset-20 z-[201] overflow-hidden rounded-2xl flex flex-col"
            style={{
              background: theme.surface,
              border: `1px solid ${theme.textSecondary}30`,
              boxShadow: `0 25px 50px -12px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Header with gradient background */}
            <div 
              className="relative h-48 sm:h-56 md:h-64 flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${theme.primary}60 0%, ${theme.background} 50%, ${theme.accent}40 100%)`,
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                style={{
                  background: `${theme.background}cc`,
                  color: theme.text,
                  border: `1px solid ${theme.textSecondary}30`,
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Gradient fade at bottom */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-24"
                style={{ background: `linear-gradient(to top, ${theme.surface}, transparent)` }}
              />

              {/* Title overlay */}
              <div className="absolute bottom-4 left-4 sm:left-6 right-16">
                <h2 
                  className="text-2xl sm:text-3xl md:text-4xl font-black mb-1"
                  style={{ color: theme.text, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
                >
                  {anime.title}
                </h2>
                {anime.title_japanese && (
                  <p 
                    className="text-sm opacity-80"
                    style={{ color: theme.textSecondary }}
                  >
                    {anime.title_japanese}
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons below title */}
            <div 
              className="flex flex-wrap items-center gap-2 sm:gap-3 px-4 sm:px-6 py-4 border-b flex-shrink-0"
              style={{ borderColor: `${theme.textSecondary}20` }}
            >
              <button
                className="flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-lg font-bold text-sm transition-transform hover:scale-105 active:scale-95"
                style={{ background: theme.primary, color: '#fff' }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                Watch Now
              </button>

              <button
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-transform hover:scale-105 active:scale-95"
                style={{
                  background: `${theme.background}`,
                  color: theme.text,
                  border: `1px solid ${theme.textSecondary}40`,
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add to List
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                {anime.score && (
                  <span 
                    className="px-2 py-1 rounded font-bold text-sm"
                    style={{ background: theme.primary, color: '#fff' }}
                  >
                    ★ {anime.score}
                  </span>
                )}
                {anime.year && <span style={{ color: theme.text }}>{anime.year}</span>}
                {anime.episodes && (
                  <>
                    <span style={{ color: theme.textSecondary }}>•</span>
                    <span style={{ color: theme.text }}>{anime.episodes} Episodes</span>
                  </>
                )}
                {anime.rating && (
                  <span 
                    className="px-2 py-0.5 rounded text-xs"
                    style={{ border: `1px solid ${theme.text}50`, color: theme.text }}
                  >
                    {anime.rating}
                  </span>
                )}
                {anime.status && (
                  <span 
                    className="px-2 py-0.5 rounded text-xs"
                    style={{ background: `${theme.accent}30`, color: theme.accent }}
                  >
                    {anime.status}
                  </span>
                )}
              </div>

              {/* Genres */}
              {anime.genres?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {anime.genres.map((genre, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{ background: `${theme.primary}20`, color: theme.primary }}
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              {anime.synopsis && (
                <div className="mb-6">
                  <h3 
                    className="text-lg font-bold mb-2"
                    style={{ color: theme.text }}
                  >
                    Synopsis
                  </h3>
                  <p 
                    className="text-sm leading-relaxed whitespace-pre-line"
                    style={{ color: theme.textSecondary }}
                  >
                    {anime.synopsis}
                  </p>
                </div>
              )}

              {/* Details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {anime.studios?.length > 0 && (
                  <div 
                    className="p-4 rounded-xl"
                    style={{ background: theme.background }}
                  >
                    <h4 className="text-sm font-semibold mb-2" style={{ color: theme.textSecondary }}>
                      Studio
                    </h4>
                    <p className="font-medium" style={{ color: theme.text }}>
                      {anime.studios.map(s => s.name).join(', ')}
                    </p>
                  </div>
                )}
                {anime.source && (
                  <div 
                    className="p-4 rounded-xl"
                    style={{ background: theme.background }}
                  >
                    <h4 className="text-sm font-semibold mb-2" style={{ color: theme.textSecondary }}>
                      Source
                    </h4>
                    <p className="font-medium" style={{ color: theme.text }}>{anime.source}</p>
                  </div>
                )}
              </div>

              {/* Producers */}
              {anime.producers?.length > 0 && (
                <div>
                  <h3 
                    className="text-lg font-bold mb-3"
                    style={{ color: theme.text }}
                  >
                    Producers
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {anime.producers.slice(0, 5).map((producer, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm"
                        style={{ background: `${theme.accent}20`, color: theme.accent }}
                      >
                        {producer.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Keyboard hint */}
            <div 
              className="flex-shrink-0 px-4 sm:px-6 py-3 border-t text-center"
              style={{ borderColor: `${theme.textSecondary}20` }}
            >
              <span className="text-xs" style={{ color: theme.textSecondary }}>
                Press <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background: theme.background }}>ESC</kbd> or <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background: theme.background }}>Backspace</kbd> to close
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const HeroBanner = () => {
  const { theme } = useThemeStore();
  const { navigateToAnime, navigateToMovies } = useNavigationStore();
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState({});

  // Fetch spotlight data from both anime and movie providers
  const { data: animeSpotlightData, loading: animeLoading } = useAnimeSpotlight('p1');
  const { data: movieSpotlightData, loading: movieLoading } = useMovieSpotlight('m2');
  
  // Merge and shuffle anime and movie spotlight items
  const spotlightItems = useMemo(() => {
    const animeItems = (animeSpotlightData?.results || []).slice(0, 5).map(item => ({
      ...item,
      contentType: 'anime',
      // Ensure image fields are properly set
      displayImage: item.cover || item.image || item.poster || item.banner,
    }));
    
    const movieItems = (movieSpotlightData?.results || movieSpotlightData || []).slice(0, 5).map(item => ({
      ...item,
      contentType: 'movie',
      // Ensure image fields are properly set - movies may use different field names
      displayImage: item.cover || item.image || item.poster || item.banner || item.thumbnail,
    }));
    
    // Merge both arrays
    const merged = [...animeItems, ...movieItems];
    
    // Shuffle the array using Fisher-Yates algorithm with a seeded approach for consistency
    const shuffled = [...merged];
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Use a deterministic shuffle based on item ids for consistency
      const j = Math.floor((i * 7 + 3) % (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }, [animeSpotlightData, movieSpotlightData]);

  const featuredItem = spotlightItems[currentIndex];
  const loading = animeLoading && movieLoading && spotlightItems.length === 0;

  // Auto-rotate featured item
  useEffect(() => {
    if (spotlightItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.min(spotlightItems.length, 10));
    }, 10000);
    return () => clearInterval(interval);
  }, [spotlightItems.length]);

  // Handle image error for current item
  const handleImageError = useCallback((itemId) => {
    setImageError(prev => ({ ...prev, [itemId]: true }));
  }, []);

  // Handle watch/play action based on content type
  const handleWatch = useCallback(() => {
    if (!featuredItem) return;
    if (featuredItem.contentType === 'movie') {
      navigateToMovies(featuredItem, 'm2');
    } else {
      navigateToAnime(featuredItem, 'p1');
    }
  }, [featuredItem, navigateToAnime, navigateToMovies]);

  // Transform spotlight data to modal format
  const getModalData = (item) => {
    if (!item) return null;
    return {
      title: item.title,
      title_japanese: item.japaneseTitle,
      synopsis: item.description?.replace(/<[^>]*>/g, ''),
      score: item.rating,
      year: item.releaseDate,
      episodes: item.totalEpisodes || item.episodes,
      rating: item.type,
      status: item.status,
      genres: item.genres?.map(g => typeof g === 'string' ? { name: g } : g) || [],
      studios: [],
      producers: [],
      source: item.subOrDub || item.contentType,
      contentType: item.contentType,
    };
  };

  // Get the best available image for an item
  const getItemImage = (item) => {
    if (!item) return null;
    if (imageError[item.id]) return null;
    return item.displayImage || item.cover || item.image || item.poster || item.banner || item.thumbnail;
  };

  // Loading state
  if (loading) {
    return (
      <div 
        className="relative h-[40vh] xs:h-[42vh] sm:h-[48vh] md:h-[52vh] lg:h-[55vh] min-h-[260px] max-h-[600px] w-full overflow-hidden pb-12 sm:pb-16 mb-6 sm:mb-8 animate-pulse"
        style={{ background: theme.surface }}
      />
    );
  }

  const currentImage = getItemImage(featuredItem);

  return (
    <>
      <div className="relative h-[40vh] xs:h-[42vh] sm:h-[48vh] md:h-[52vh] lg:h-[55vh] min-h-[260px] max-h-[600px] w-full overflow-hidden pb-12 sm:pb-16 mb-6 sm:mb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            {/* Background Image or Gradient */}
            {currentImage && !imageError[featuredItem?.id] ? (
              <>
                <ProxiedImage
                  src={currentImage}
                  alt={featuredItem?.title || 'Featured'}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  onError={() => handleImageError(featuredItem?.id)}
                  style={{ objectPosition: 'center 20%' }}
                />
                {/* Gradient overlays for text readability */}
                <div 
                  className="absolute inset-0"
                  style={{ 
                    background: `linear-gradient(90deg, ${theme.background}f0 0%, ${theme.background}cc 30%, ${theme.background}80 50%, transparent 70%)` 
                  }}
                />
                <div 
                  className="absolute inset-0"
                  style={{ 
                    background: `linear-gradient(to top, ${theme.background} 0%, transparent 40%)` 
                  }}
                />
              </>
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}50 0%, ${theme.background} 50%, ${theme.accent}40 100%)`,
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
        
        {/* Animated gradient overlay */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 20% 50%, ${theme.primary}40 0%, transparent 60%)`,
          }}
          animate={{
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Bottom gradient fade */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 md:h-40"
          style={{
            background: `linear-gradient(to top, ${theme.background}, transparent)`,
          }}
        />

        {/* Content */}
        <div className="absolute inset-x-0 top-0 bottom-12 sm:bottom-16 flex items-center pt-14 sm:pt-16">
          <div className="px-3 xs:px-4 sm:px-6 md:px-8 w-full max-w-[90%] xs:max-w-[85%] sm:max-w-xl md:max-w-2xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-1.5 xs:gap-2 px-2 xs:px-3 py-1 xs:py-1.5 rounded-full mb-2 xs:mb-3"
              style={{
                background: `${theme.primary}30`,
                border: `1px solid ${theme.primary}50`,
              }}
            >
              <span 
                className="w-1.5 xs:w-2 h-1.5 xs:h-2 rounded-full animate-pulse" 
                style={{ background: theme.primary }}
              />
              <span className="text-[10px] xs:text-xs sm:text-sm font-semibold" style={{ color: theme.text }}>
                {featuredItem?.rank ? `#${featuredItem.rank} Spotlight` : 'Featured'}
              </span>
              {featuredItem?.contentType && (
                <span 
                  className="px-1.5 xs:px-2 py-0.5 rounded text-[9px] xs:text-[10px] uppercase font-bold ml-1"
                  style={{ 
                    background: `${theme.primary}90`, 
                    color: theme.text,
                    border: `1px solid ${theme.primary}`,
                  }}
                >
                  {featuredItem.contentType === 'movie' ? '🎬 Movie' : '📺 Anime'}
                </span>
              )}
            </motion.div>

            {/* Title */}
            <motion.h1
              key={`title-${currentIndex}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-1.5 xs:mb-2 line-clamp-2"
              style={{ 
                color: theme.text,
                textShadow: '0 2px 20px rgba(0,0,0,0.5)',
              }}
            >
              {featuredItem?.title || 'Loading...'}
            </motion.h1>

            {/* Meta */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center gap-1 xs:gap-1.5 sm:gap-2 mb-2 xs:mb-3 text-[10px] xs:text-xs sm:text-sm"
            >
              {featuredItem?.rating && (
                <span 
                  className="px-1 xs:px-1.5 sm:px-2 py-0.5 rounded font-bold"
                  style={{ background: `${theme.primary}90`, color: theme.text, border: `1px solid ${theme.primary}` }}
                >
                  ★ {featuredItem.rating}
                </span>
              )}
              {featuredItem?.releaseDate && (
                <span style={{ color: theme.text }}>{featuredItem.releaseDate}</span>
              )}
              {(featuredItem?.totalEpisodes || featuredItem?.episodes) && (
                <>
                  <span style={{ color: theme.textSecondary }}>•</span>
                  <span style={{ color: theme.text }}>
                    {featuredItem.totalEpisodes || featuredItem.episodes} Episodes
                  </span>
                </>
              )}
              {featuredItem?.type && (
                <>
                  <span style={{ color: theme.textSecondary }}>•</span>
                  <span 
                    className="px-1 xs:px-1.5 sm:px-2 py-0.5 rounded text-[9px] xs:text-xs"
                    style={{ border: `1px solid ${theme.primary}50`, color: theme.text }}
                  >
                    {featuredItem.type}
                  </span>
                </>
              )}
              {featuredItem?.duration && (
                <>
                  <span className="hidden xs:inline" style={{ color: theme.textSecondary }}>•</span>
                  <span className="hidden xs:inline" style={{ color: theme.textSecondary }}>{featuredItem.duration}</span>
                </>
              )}
            </motion.div>

            {/* Genres */}
            {featuredItem?.genres?.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="flex flex-wrap gap-1 xs:gap-1.5 mb-2 xs:mb-3"
              >
                {featuredItem.genres.slice(0, 3).map((genre, i) => (
                  <span
                    key={i}
                    className="px-1.5 xs:px-2 py-0.5 rounded-full text-[9px] xs:text-[10px] sm:text-xs font-medium"
                    style={{ background: `${theme.primary}30`, color: theme.primary }}
                  >
                    {typeof genre === 'string' ? genre : genre.name || genre}
                  </span>
                ))}
              </motion.div>
            )}

            {/* Description */}
            <motion.p
              key={`desc-${currentIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-[10px] xs:text-xs sm:text-sm mb-3 xs:mb-4 line-clamp-2 xs:line-clamp-2 sm:line-clamp-3"
              style={{ color: theme.text, opacity: 0.85 }}
            >
              {featuredItem?.description?.replace(/<[^>]*>/g, '').slice(0, 200) || 'Discover amazing content...'}
              {featuredItem?.description?.length > 200 ? '...' : ''}
            </motion.p>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap items-center gap-1.5 xs:gap-2"
            >
              <button
                onClick={handleWatch}
                className="flex items-center gap-1 xs:gap-2 px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 rounded-lg font-bold text-xs xs:text-sm transition-transform hover:scale-105 active:scale-95"
                style={{
                  background: featuredItem?.contentType === 'movie' ? theme.accent : theme.primary,
                  color: '#fff',
                }}
              >
                <svg className="w-3 h-3 xs:w-4 xs:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                <span className="hidden xs:inline">Watch Now</span>
                <span className="xs:hidden">Play</span>
              </button>

              <button
                onClick={() => setShowInfoModal(true)}
                className="flex items-center gap-1 xs:gap-2 px-2 xs:px-3 py-1.5 xs:py-2 rounded-lg font-medium text-xs xs:text-sm transition-transform hover:scale-105 active:scale-95"
                style={{
                  background: `${theme.surface}cc`,
                  color: theme.text,
                  border: `1px solid ${theme.textSecondary}50`,
                }}
              >
                <svg className="w-3 h-3 xs:w-4 xs:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden xs:inline">More Info</span>
                <span className="xs:hidden">Info</span>
              </button>

              <button
                className="p-1.5 xs:p-2 rounded-full transition-transform hover:scale-110 active:scale-95"
                style={{
                  background: `${theme.surface}cc`,
                  color: theme.text,
                  border: `1px solid ${theme.textSecondary}50`,
                }}
              >
                <svg className="w-3 h-3 xs:w-4 xs:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </motion.div>
          </div>
        </div>

        {/* Dots indicator */}
        {spotlightItems.length > 1 && (
          <div className="absolute bottom-14 xs:bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 flex gap-1 xs:gap-1.5 sm:gap-2">
            {spotlightItems.slice(0, 10).map((item, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-1 xs:h-1.5 sm:h-2 rounded-full transition-all ${
                  i === currentIndex ? 'w-3 xs:w-4 sm:w-6' : 'w-1 xs:w-1.5 sm:w-2 opacity-50 hover:opacity-75'
                }`}
                style={{ 
                  background: i === currentIndex 
                    ? (item.contentType === 'movie' ? theme.accent : theme.primary) 
                    : '#fff' 
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* More Info Modal */}
      <AnimeInfoModal 
        anime={getModalData(featuredItem)}
        isOpen={showInfoModal} 
        onClose={() => setShowInfoModal(false)} 
        theme={theme}
      />
    </>
  );
};

export default HeroBanner;
