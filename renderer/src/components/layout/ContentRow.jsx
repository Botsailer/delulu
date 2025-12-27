import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeStore, useNavigationStore } from '../../store';

// Media Info Modal Component
const MediaInfoModal = ({ item, isOpen, onClose, theme }) => {
  const { navigateToManga, navigateToAnime, navigateToMovies } = useNavigationStore();

  const handleReadWatch = () => {
    onClose();
    if (item?.type === 'manga') {
      navigateToManga(item);
    } else if (item?.type === 'movie') {
      navigateToMovies(item);
    } else {
      navigateToAnime(item);
    }
  };
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

  if (!isOpen || !item) return null;

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
            className="fixed inset-4 sm:inset-8 md:inset-16 lg:inset-24 z-[201] overflow-hidden rounded-2xl flex flex-col"
            style={{
              background: theme.surface,
              border: `1px solid ${theme.textSecondary}30`,
              boxShadow: `0 25px 50px -12px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Header with image or gradient */}
            <div 
              className="relative h-40 sm:h-48 md:h-56 flex-shrink-0"
              style={{ 
                background: item.image 
                  ? `url(${item.image}) center/cover` 
                  : item.gradient || `linear-gradient(135deg, ${theme.primary}60 0%, ${theme.accent}60 100%)`
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{
                  background: `${theme.background}cc`,
                  color: theme.text,
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Overlay for readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              {/* Title */}
              <div className="absolute bottom-4 left-4 sm:left-6 right-16">
                <h2 
                  className="text-2xl sm:text-3xl font-black"
                  style={{ color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
                >
                  {item.title}
                </h2>
              </div>
            </div>

            {/* Action buttons */}
            <div 
              className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b flex-shrink-0"
              style={{ borderColor: `${theme.textSecondary}20` }}
            >
              <button
                onClick={handleReadWatch}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm hover:scale-105 transition-transform"
                style={{ background: theme.primary, color: '#fff' }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                {item.type === 'manga' ? 'Read Now' : 'Watch Now'}
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm hover:scale-105 transition-transform"
                style={{
                  background: theme.background,
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* Meta */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {item.rating > 0 && (
                  <span 
                    className="px-2 py-1 rounded font-bold text-sm"
                    style={{ background: theme.primary, color: '#fff' }}
                  >
                    ★ {typeof item.rating === 'number' ? item.rating.toFixed(1) : item.rating}
                  </span>
                )}
                {item.year && item.year !== 'N/A' && (
                  <span style={{ color: theme.text }}>{item.year}</span>
                )}
                {item.episodes && (
                  <>
                    <span style={{ color: theme.textSecondary }}>•</span>
                    <span style={{ color: theme.text }}>{item.episodes} episodes</span>
                  </>
                )}
                {item.chapters && (
                  <>
                    <span style={{ color: theme.textSecondary }}>•</span>
                    <span style={{ color: theme.text }}>{item.chapters} chapters</span>
                  </>
                )}
                {item.genre && (
                  <>
                    <span style={{ color: theme.textSecondary }}>•</span>
                    <span 
                      className="px-2 py-0.5 rounded text-xs"
                      style={{ background: `${theme.accent}30`, color: theme.accent }}
                    >
                      {item.genre}
                    </span>
                  </>
                )}
                {item.status && (
                  <span 
                    className="px-2 py-0.5 rounded text-xs"
                    style={{ background: `${theme.primary}30`, color: theme.primary }}
                  >
                    {item.status}
                  </span>
                )}
              </div>

              {/* Synopsis */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-2" style={{ color: theme.text }}>Synopsis</h3>
                <p className="text-sm leading-relaxed" style={{ color: theme.textSecondary }}>
                  {item.synopsis || `${item.title} is an amazing ${item.type || 'anime'} series.`}
                </p>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {item.year && item.year !== 'N/A' && (
                  <div className="p-4 rounded-xl" style={{ background: theme.background }}>
                    <h4 className="text-sm font-semibold mb-1" style={{ color: theme.textSecondary }}>Release Year</h4>
                    <p className="font-medium" style={{ color: theme.text }}>{item.year}</p>
                  </div>
                )}
                {item.genre && (
                  <div className="p-4 rounded-xl" style={{ background: theme.background }}>
                    <h4 className="text-sm font-semibold mb-1" style={{ color: theme.textSecondary }}>Genre</h4>
                    <p className="font-medium" style={{ color: theme.text }}>{item.genre}</p>
                  </div>
                )}
                {item.rating > 0 && (
                  <div className="p-4 rounded-xl" style={{ background: theme.background }}>
                    <h4 className="text-sm font-semibold mb-1" style={{ color: theme.textSecondary }}>Rating</h4>
                    <p className="font-medium" style={{ color: theme.text }}>⭐ {typeof item.rating === 'number' ? item.rating.toFixed(1) : item.rating}/10</p>
                  </div>
                )}
                {item.status && (
                  <div className="p-4 rounded-xl" style={{ background: theme.background }}>
                    <h4 className="text-sm font-semibold mb-1" style={{ color: theme.textSecondary }}>Status</h4>
                    <p className="font-medium" style={{ color: theme.text }}>{item.status}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer hint */}
            <div 
              className="flex-shrink-0 px-4 py-3 border-t text-center"
              style={{ borderColor: `${theme.textSecondary}20` }}
            >
              <span className="text-xs" style={{ color: theme.textSecondary }}>
                Press <kbd className="px-1.5 py-0.5 rounded" style={{ background: theme.background }}>ESC</kbd> to close
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const MediaCard = ({ item, index, onMoreInfo, onPlay }) => {
  const { theme } = useThemeStore();
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.2) }}
      className="relative flex-shrink-0 cursor-pointer w-24 xs:w-28 sm:w-32 md:w-36 lg:w-40"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPlay?.(item)}
    >
      <motion.div
        className="relative rounded-lg sm:rounded-xl overflow-hidden"
        animate={{
          scale: isHovered ? 1.05 : 1,
          y: isHovered ? -5 : 0,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        style={{
          boxShadow: isHovered 
            ? `0 15px 30px -10px ${theme.primary}60` 
            : '0 4px 12px rgba(0,0,0,0.2)',
        }}
      >
        {/* Card with image or gradient fallback */}
        <div className="relative aspect-[2/3]">
          {/* Loading skeleton */}
          {imageLoading && !imageError && (
            <div 
              className="absolute inset-0 animate-pulse"
              style={{ background: theme.surface }}
            />
          )}
          
          {/* Image or fallback gradient */}
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
              style={{ 
                background: item.gradient || `linear-gradient(135deg, ${theme.primary}60 0%, ${theme.accent}60 100%)` 
              }}
            >
              <span className="text-3xl sm:text-4xl md:text-5xl font-black text-white/30">
                {item.title?.charAt(0) || '?'}
              </span>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Rating Badge */}
          {item.rating > 0 && (
            <div
              className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold"
              style={{
                background: 'rgba(0,0,0,0.6)',
                color: '#fbbf24',
              }}
            >
              ★ {typeof item.rating === 'number' ? item.rating.toFixed(1) : item.rating}
            </div>
          )}

          {/* Title at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
            <h3 className="font-bold text-white text-xs sm:text-sm leading-tight line-clamp-2">
              {item.title}
            </h3>
            <div className="flex items-center gap-1 mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-gray-300">
              {item.year && item.year !== 'N/A' && <span>{item.year}</span>}
              {item.year && item.year !== 'N/A' && item.genre && <span>•</span>}
              {item.genre && <span className="truncate">{item.genre}</span>}
            </div>
          </div>

          {/* Hover overlay with buttons */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                style={{ background: 'rgba(0,0,0,0.5)' }}
              >
                {/* Play Button */}
                <motion.button
                  initial={{ scale: 0, y: -10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0, y: -10 }}
                  transition={{ delay: 0.05 }}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                  style={{ background: theme.primary }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onPlay) onPlay(item);
                  }}
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </motion.button>

                {/* More Info Button */}
                <motion.button
                  initial={{ scale: 0, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0, y: 10 }}
                  transition={{ delay: 0.1 }}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1 hover:scale-105 transition-transform"
                  style={{ 
                    background: `${theme.surface}ee`,
                    color: theme.text,
                    border: `1px solid ${theme.textSecondary}40`
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onMoreInfo) onMoreInfo(item);
                  }}
                >
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden xs:inline">More Info</span>
                  <span className="xs:hidden">Info</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ContentRow = ({ title, items, onClick }) => {
  const { theme } = useThemeStore();
  const { navigateToManga, navigateToAnime, navigateToMovies } = useNavigationStore();
  const scrollRef = useRef(null);
  const [selectedItem, setSelectedItem] = useState(null);
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

  const handlePlay = (item) => {
    // If onClick prop is provided, use it (for custom navigation logic)
    if (onClick) {
      onClick(item);
      return;
    }
    // Default navigation based on item type
    if (item?.type === 'manga') {
      navigateToManga(item);
    } else if (item?.type === 'movie') {
      navigateToMovies(item);
    } else {
      navigateToAnime(item);
    }
  };

  return (
    <>
      <div className="mb-6 sm:mb-8 group/row">
        {/* Row Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 mb-2 sm:mb-3">
          <h2 
            className="text-sm sm:text-base md:text-lg font-bold"
            style={{ color: theme.text }}
          >
            {title}
          </h2>
          <button
            className="text-xs sm:text-sm opacity-0 group-hover/row:opacity-100 transition-opacity"
            style={{ color: theme.primary }}
          >
            See all →
          </button>
        </div>

        {/* Scrollable Row */}
        <div className="relative">
          {/* Left Arrow */}
          <motion.button
            initial={false}
            animate={{ opacity: showLeftArrow ? 1 : 0, pointerEvents: showLeftArrow ? 'auto' : 'none' }}
            className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
            style={{ 
              background: `${theme.surface}ee`,
              color: theme.text,
            }}
            onClick={() => scroll('left')}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>

          {/* Content */}
          <div
            ref={scrollRef}
            className="flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2 scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {items.map((item, index) => (
              <MediaCard 
                key={item.id || index} 
                item={item} 
                index={index} 
                onMoreInfo={(item) => setSelectedItem(item)}
                onPlay={handlePlay}
              />
            ))}
          </div>

          {/* Right Arrow */}
          <motion.button
            initial={false}
            animate={{ opacity: showRightArrow ? 1 : 0, pointerEvents: showRightArrow ? 'auto' : 'none' }}
            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
            style={{ 
              background: `${theme.surface}ee`,
              color: theme.text,
            }}
            onClick={() => scroll('right')}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* More Info Modal */}
      <MediaInfoModal 
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        theme={theme}
      />
    </>
  );
};

export { MediaCard, ContentRow, MediaInfoModal };
export default ContentRow;
