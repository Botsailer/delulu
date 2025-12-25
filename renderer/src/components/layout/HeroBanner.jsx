import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeStore } from '../../store';
import { jikanApi } from '../../services/api';

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
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [featuredAnime, setFeaturedAnime] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch a featured anime on mount
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        // Get top anime and pick one randomly from top 10
        const data = await jikanApi.getTopAnime(1, 10, 'score');
        if (data?.data?.length > 0) {
          const randomIndex = Math.floor(Math.random() * Math.min(data.data.length, 10));
          setFeaturedAnime(data.data[randomIndex]);
        }
      } catch (err) {
        console.error('Failed to fetch featured anime:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div 
        className="relative h-[45vh] min-h-[320px] w-full overflow-hidden pb-16 mb-8 animate-pulse"
        style={{ background: theme.surface }}
      />
    );
  }

  return (
    <>
      <div className="relative h-[45vh] min-h-[320px] w-full overflow-hidden pb-16 mb-8">
        {/* Background Image or Gradient */}
        {featuredAnime?.images?.jpg?.large_image_url ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${featuredAnime.images.jpg.large_image_url})`,
              }}
            />
            <div 
              className="absolute inset-0"
              style={{ background: `linear-gradient(90deg, ${theme.background}ee 0%, ${theme.background}aa 50%, transparent 100%)` }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${theme.primary}50 0%, ${theme.background} 60%, ${theme.accent}40 100%)`,
            }}
          />
        )}
        
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
          className="absolute bottom-0 left-0 right-0 h-40"
          style={{
            background: `linear-gradient(to top, ${theme.background}, transparent)`,
          }}
        />

        {/* Content */}
        <div className="absolute inset-x-0 top-0 bottom-16 flex items-center pt-16">
          <div className="px-4 sm:px-8 max-w-2xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3"
              style={{
                background: `${theme.primary}40`,
                border: `1px solid ${theme.primary}60`,
              }}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-semibold" style={{ color: theme.text }}>
                Top Rated
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl md:text-4xl font-black mb-2"
              style={{ 
                color: theme.text,
                textShadow: '0 2px 20px rgba(0,0,0,0.5)',
              }}
            >
              {featuredAnime?.title || 'Loading...'}
            </motion.h1>

            {/* Meta */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center gap-2 mb-3 text-sm"
            >
              {featuredAnime?.score && (
                <span 
                  className="px-2 py-0.5 rounded font-bold"
                  style={{ background: theme.primary, color: '#fff' }}
                >
                  ★ {featuredAnime.score}
                </span>
              )}
              {featuredAnime?.year && (
                <span style={{ color: theme.text }}>{featuredAnime.year}</span>
              )}
              {featuredAnime?.episodes && (
                <>
                  <span style={{ color: theme.textSecondary }}>•</span>
                  <span style={{ color: theme.text }}>{featuredAnime.episodes} Episodes</span>
                </>
              )}
              {featuredAnime?.rating && (
                <>
                  <span style={{ color: theme.textSecondary }}>•</span>
                  <span 
                    className="px-2 py-0.5 rounded text-xs"
                    style={{ border: `1px solid ${theme.text}50`, color: theme.text }}
                  >
                    {featuredAnime.rating}
                  </span>
                </>
              )}
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm mb-4 line-clamp-2"
              style={{ color: theme.text, opacity: 0.85 }}
            >
              {featuredAnime?.synopsis?.slice(0, 200) || 'Discover amazing anime content...'}
              {featuredAnime?.synopsis?.length > 200 ? '...' : ''}
            </motion.p>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap items-center gap-2"
            >
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-transform hover:scale-105 active:scale-95"
                style={{
                  background: theme.primary,
                  color: '#fff',
                }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                <span className="hidden sm:inline">Watch Now</span>
                <span className="sm:hidden">Play</span>
              </button>

              <button
                onClick={() => setShowInfoModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-transform hover:scale-105 active:scale-95"
                style={{
                  background: `${theme.surface}cc`,
                  color: theme.text,
                  border: `1px solid ${theme.textSecondary}50`,
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                More Info
              </button>

              <button
                className="p-2 rounded-full transition-transform hover:scale-110 active:scale-95"
                style={{
                  background: `${theme.surface}cc`,
                  color: theme.text,
                  border: `1px solid ${theme.textSecondary}50`,
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* More Info Modal */}
      <AnimeInfoModal 
        anime={featuredAnime}
        isOpen={showInfoModal} 
        onClose={() => setShowInfoModal(false)} 
        theme={theme}
      />
    </>
  );
};

export default HeroBanner;
