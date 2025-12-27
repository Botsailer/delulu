import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeStore, useNavigationStore } from '../../store';
import { 
  usePopularManga, 
  useLatestManga, 
  useSearchManga, 
  useMangaProviders,
  useMangaInfo,
  useChapterPages,
  useProxiedImage 
} from '../../hooks/useManga';

// ============ SIMPLE IMAGE WITH FALLBACK ============
// Accepts base64 data URLs (proxied) or MangaDex URLs (public CORS)
const SimpleImage = ({ src, alt, className, style }) => {
  const { theme } = useThemeStore();
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Accept data URLs (proxied), blob URLs, or MangaDex URLs (they have CORS)
  // Also allow http/https URLs for other providers (MangaKakalot etc) even if they might fail CORS
  // This fixes the issue where images from other servers weren't rendering
  const isValidSrc = src && (
    src.startsWith('data:') || 
    src.startsWith('blob:') || 
    src.startsWith('http')
  );
  
  if (error || !src || !isValidSrc) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ ...style, background: `linear-gradient(135deg, ${theme.primary}30 0%, ${theme.accent}30 100%)` }}
      >
        <span className="text-4xl font-black text-white/40">
          {alt?.charAt(0) || '?'}
        </span>
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div 
          className={`animate-pulse ${className}`}
          style={{ ...style, background: theme.surface, position: 'absolute', inset: 0 }}
        />
      )}
      <img 
        src={src} 
        alt={alt}
        className={className}
        style={{ ...style, opacity: loaded ? 1 : 0, transition: 'opacity 0.3s' }}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </>
  );
};

// ============ PROXIED IMAGE WITH RETRY (for chapter pages) ============
const ProxiedImage = ({ src, alt, provider = 's1', className, style, onLoad, retryCount = 3 }) => {
  const { src: proxiedSrc, loading, error: proxyError } = useProxiedImage(src, provider);
  const [imgError, setImgError] = useState(false);
  const [retries, setRetries] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const { theme } = useThemeStore();

  const handleRetry = useCallback(() => {
    if (retries < retryCount) {
      setRetrying(true);
      setImgError(false);
      setTimeout(() => {
        setRetries(r => r + 1);
        setRetrying(false);
      }, 1000);
    }
  }, [retries, retryCount]);

  if (loading || retrying) {
    return (
      <div 
        className={`animate-pulse flex items-center justify-center ${className}`}
        style={{ ...style, background: theme.surface }}
      >
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: `${theme.primary} transparent ${theme.primary} ${theme.primary}` }} />
          {retrying && <p className="text-xs mt-2 opacity-60" style={{ color: theme.text }}>Retrying...</p>}
        </div>
      </div>
    );
  }

  if ((imgError || proxyError || !proxiedSrc) && retries >= retryCount) {
    // In dev mode, just show placeholder without error UI
    return (
      <div 
        className={`flex flex-col items-center justify-center ${className}`}
        style={{ ...style, background: `linear-gradient(135deg, ${theme.primary}30 0%, ${theme.accent}30 100%)` }}
      >
        <span className="text-4xl font-black text-white/40">
          {alt?.charAt(0) || '?'}
        </span>
      </div>
    );
  }

  if ((imgError || !proxiedSrc) && retries < retryCount) {
    handleRetry();
    return (
      <div 
        className={`animate-pulse flex items-center justify-center ${className}`}
        style={{ ...style, background: theme.surface }}
      />
    );
  }

  return (
    <img 
      src={proxiedSrc} 
      alt={alt}
      className={className}
      style={style}
      onLoad={onLoad}
      onError={() => setImgError(true)}
    />
  );
};

// ============ MANGA CARD ============
const MangaCard = ({ item, index, onSelect }) => {
  const { theme } = useThemeStore();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.5) }}
      className="cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect?.(item)}
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
          <SimpleImage
            src={item.image}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {item.status && (
            <div 
              className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold capitalize"
              style={{
                background: item.status.toLowerCase().includes('ongoing') ? '#22c55e' : 
                           item.status.toLowerCase().includes('completed') ? '#3b82f6' : '#6b7280',
                color: 'white',
              }}
            >
              {item.status}
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="font-bold text-white text-sm leading-tight line-clamp-2 mb-1">
              {item.title}
            </h3>
            {item.releaseDate && (
              <span className="text-xs text-gray-300">{item.releaseDate}</span>
            )}
          </div>

          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.5)' }}
              >
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="px-4 py-2 rounded-lg font-bold text-sm"
                  style={{ background: theme.primary, color: theme.background }}
                >
                  View Details
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============ MANGA DETAIL MODAL ============
// Helper to extract description (MangaDex returns object like {en: "..."})
const getDescription = (desc) => {
  if (!desc) return 'No description available.';
  if (typeof desc === 'string') return desc.replace(/<[^>]*>/g, '');
  // If object, try to get English or first available
  if (typeof desc === 'object') {
    const text = desc.en || desc.english || Object.values(desc)[0] || '';
    return typeof text === 'string' ? text.replace(/<[^>]*>/g, '') : 'No description available.';
  }
  return 'No description available.';
};

const MangaDetailModal = ({ manga, provider, onClose, onReadChapter, setAllChapters }) => {
  const { theme } = useThemeStore();
  
  const { data: mangaInfo, loading, error } = useMangaInfo(provider, manga?.id);

  useEffect(() => {
    if (mangaInfo?.chapters) {
      setAllChapters(mangaInfo.chapters);
    }
  }, [mangaInfo, setAllChapters]);

  if (!manga) return null;

  // Merge mangaInfo with original manga data (fallback for missing fields)
  const info = {
    ...manga,
    ...mangaInfo,
    title: mangaInfo?.title || manga?.title,
    image: mangaInfo?.image || manga?.image,
  };
  const chapters = info.chapters || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: theme.background }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 p-4">
            <SimpleImage
              src={info.image}
              alt={info.title}
              className="w-full rounded-xl aspect-[2/3] object-cover"
            />
          </div>

          <div className="md:w-2/3 p-6">
            <h2 className="text-2xl font-bold mb-2" style={{ color: theme.text }}>
              {info.title}
            </h2>

            {info.altTitles && info.altTitles.length > 0 && (
              <p className="text-sm opacity-60 mb-4" style={{ color: theme.text }}>
                {info.altTitles.slice(0, 2).map(t => typeof t === 'object' ? Object.values(t)[0] : t).join(' • ')}
              </p>
            )}

            {info.genres && (
              <div className="flex flex-wrap gap-2 mb-4">
                {info.genres.slice(0, 6).map((genre, i) => (
                  <span 
                    key={i}
                    className="px-2 py-1 rounded-full text-xs"
                    style={{ background: `${theme.primary}30`, color: theme.primary }}
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            <p className="text-sm opacity-80 mb-4 line-clamp-4" style={{ color: theme.text }}>
              {getDescription(info.description)}
            </p>

            {loading ? (
              <div className="flex items-center gap-2" style={{ color: theme.text }}>
                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: `${theme.primary} transparent ${theme.primary} ${theme.primary}` }} />
                <span className="text-sm">Loading chapters...</span>
              </div>
            ) : chapters.length > 0 ? (
              <div>
                <h3 className="font-bold mb-2" style={{ color: theme.text }}>
                  Chapters ({chapters.length})
                </h3>
                <div className="max-h-60 overflow-y-auto space-y-1 pr-2">
                  {chapters.map((chapter, i) => (
                    <button
                      key={chapter.id || i}
                      onClick={() => onReadChapter(chapter, i)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm hover:opacity-80 transition-all flex justify-between items-center group"
                      style={{ background: theme.surface, color: theme.text }}
                    >
                      <span className="truncate flex-1">
                        <span className="opacity-50 mr-2">#{chapters.length - i}</span>
                        {chapter.title || `Chapter ${chapter.chapterNumber || chapter.chapter || chapters.length - i}`}
                      </span>
                      <span className="opacity-0 group-hover:opacity-100 ml-2 text-xs" style={{ color: theme.primary }}>
                        Read →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm opacity-60" style={{ color: theme.text }}>
                No chapters available
              </p>
            )}

            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 rounded-lg"
              style={{ background: theme.surface, color: theme.text }}
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============ CHAPTER READER ============
const ChapterReader = ({ chapter, chapterIndex, allChapters, provider, onClose, onChangeChapter }) => {
  const { theme } = useThemeStore();
  const { pages, loading, error } = useChapterPages(provider, chapter?.id);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [readingMode, setReadingMode] = useState('vertical');
  const [showControls, setShowControls] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [autoScroll, setAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef(null);
  const autoScrollRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (autoScroll && readingMode === 'vertical' && containerRef.current) {
      const scrollContainer = containerRef.current.querySelector('.reader-content');
      if (!scrollContainer) return;

      let lastTime = performance.now();
      const scroll = (currentTime) => {
        const delta = (currentTime - lastTime) / 1000;
        lastTime = currentTime;
        scrollContainer.scrollTop += scrollSpeed * delta;
        
        if (scrollContainer.scrollTop >= scrollContainer.scrollHeight - scrollContainer.clientHeight) {
          setAutoScroll(false);
          return;
        }
        autoScrollRef.current = requestAnimationFrame(scroll);
      };
      
      autoScrollRef.current = requestAnimationFrame(scroll);
      return () => cancelAnimationFrame(autoScrollRef.current);
    }
  }, [autoScroll, scrollSpeed, readingMode]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (!isDragging) setShowControls(false);
    }, 3000);
  }, [isDragging]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (readingMode === 'horizontal') {
        if (e.key === 'ArrowRight') setCurrentPage(p => Math.min(pages.length - 1, p + 1));
        if (e.key === 'ArrowLeft') setCurrentPage(p => Math.max(0, p - 1));
      }
      if (e.key === 'f') toggleFullscreen();
      if (e.key === 'Escape' && isFullscreen) document.exitFullscreen();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readingMode, pages.length, toggleFullscreen, isFullscreen]);

  const goToPrevChapter = () => {
    if (chapterIndex < allChapters.length - 1) {
      onChangeChapter(allChapters[chapterIndex + 1], chapterIndex + 1);
    }
  };

  const goToNextChapter = () => {
    if (chapterIndex > 0) {
      onChangeChapter(allChapters[chapterIndex - 1], chapterIndex - 1);
    }
  };

  const hasPrevChapter = chapterIndex < allChapters.length - 1;
  const hasNextChapter = chapterIndex > 0;

  if (!chapter) return null;

  const chapterNum = chapter.chapterNumber || chapter.chapter || (allChapters.length - chapterIndex);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#000' }}
      onMouseMove={handleMouseMove}
    >
      {/* Header */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, transparent 100%)' }}
          >
            <div className="flex items-center gap-4">
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h3 className="font-bold text-white text-sm md:text-base truncate max-w-[200px] md:max-w-none">
                  Chapter {chapterNum}
                </h3>
                <p className="text-xs text-gray-400 truncate max-w-[200px] md:max-w-none">
                  {chapter.title || `Chapter ${chapterNum}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setReadingMode(m => m === 'vertical' ? 'horizontal' : 'vertical')}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title={readingMode === 'vertical' ? 'Horizontal Mode' : 'Vertical Mode'}
              >
                {readingMode === 'vertical' ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>

              <button onClick={toggleFullscreen} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Fullscreen (F)">
                {isFullscreen ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0v5m0-5h5m6 5l5-5m0 0v5m0-5h-5m-6 11l-5 5m0 0v-5m0 5h5m6-5l5 5m0 0v-5m0 5h-5" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5" />
                  </svg>
                )}
              </button>

              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-scroll Controls (Vertical Mode) */}
      <AnimatePresence>
        {showControls && readingMode === 'vertical' && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-3 p-3 rounded-xl"
            style={{ background: 'rgba(0,0,0,0.8)' }}
          >
            <span className="text-xs text-gray-400 rotate-180" style={{ writingMode: 'vertical-rl' }}>
              Auto Scroll
            </span>
            
            <div 
              className="relative h-32 w-6 rounded-full cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.1)' }}
              onMouseDown={(e) => {
                setIsDragging(true);
                const rect = e.currentTarget.getBoundingClientRect();
                const updateSpeed = (clientY) => {
                  const y = Math.max(0, Math.min(rect.height, rect.bottom - clientY));
                  setScrollSpeed(Math.round((y / rect.height) * 200) + 10);
                };
                updateSpeed(e.clientY);
                
                const handleMove = (ev) => updateSpeed(ev.clientY);
                const handleUp = () => {
                  setIsDragging(false);
                  window.removeEventListener('mousemove', handleMove);
                  window.removeEventListener('mouseup', handleUp);
                };
                window.addEventListener('mousemove', handleMove);
                window.addEventListener('mouseup', handleUp);
              }}
            >
              <div 
                className="absolute bottom-0 left-0 right-0 rounded-full transition-all"
                style={{ 
                  height: `${((scrollSpeed - 10) / 200) * 100}%`,
                  background: autoScroll ? theme.primary : 'rgba(255,255,255,0.3)'
                }}
              />
              <div 
                className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full shadow-lg transition-all"
                style={{ 
                  bottom: `calc(${((scrollSpeed - 10) / 200) * 100}% - 8px)`,
                  background: autoScroll ? theme.primary : '#fff'
                }}
              />
            </div>
            
            <span className="text-xs text-white font-mono">{scrollSpeed}</span>
            
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className="p-2 rounded-full transition-colors"
              style={{ background: autoScroll ? theme.primary : 'rgba(255,255,255,0.1)' }}
            >
              {autoScroll ? (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between p-4"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)' }}
          >
            <button
              onClick={goToPrevChapter}
              disabled={!hasPrevChapter}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${hasPrevChapter ? 'hover:bg-white/10' : 'opacity-30 cursor-not-allowed'}`}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-white text-sm hidden sm:inline">Prev Chapter</span>
            </button>

            {readingMode === 'horizontal' && pages.length > 0 && (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-white text-sm font-mono">{currentPage + 1} / {pages.length}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
                  disabled={currentPage === pages.length - 1}
                  className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            {readingMode === 'vertical' && pages.length > 0 && (
              <span className="text-white text-sm font-mono">{pages.length} pages</span>
            )}

            <button
              onClick={goToNextChapter}
              disabled={!hasNextChapter}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${hasNextChapter ? 'hover:bg-white/10' : 'opacity-30 cursor-not-allowed'}`}
            >
              <span className="text-white text-sm hidden sm:inline">Next Chapter</span>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 overflow-hidden reader-content" style={{ overflowY: readingMode === 'vertical' ? 'auto' : 'hidden' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full mx-auto mb-4"
                style={{ borderColor: `${theme.primary} transparent ${theme.primary} ${theme.primary}` }} />
              <p className="text-white">Loading chapter...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full mx-auto mb-4"
                style={{ borderColor: `${theme.primary} transparent ${theme.primary} ${theme.primary}` }} />
              <p className="text-white opacity-60">Loading...</p>
            </div>
          </div>
        ) : readingMode === 'vertical' ? (
          <div className="max-w-4xl mx-auto py-16">
            {pages.map((page, index) => (
              <div key={page.page || index} className="relative flex flex-col">
                {page.success ? (
                  <img src={page.data} alt={`Page ${index + 1}`} className="w-full block" loading="lazy" />
                ) : (
                  <div className="w-full aspect-[2/3] flex items-center justify-center rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <span className="text-4xl font-black text-white/20">{index + 1}</span>
                  </div>
                )}
                <div className="absolute bottom-2 right-2 px-2 py-1 rounded text-xs text-white/60 bg-black/50 pointer-events-none">{index + 1}</div>
              </div>
            ))}
            
            <div className="py-16 text-center">
              <p className="text-gray-400 mb-4">End of Chapter {chapterNum}</p>
              <div className="flex gap-4 justify-center">
                {hasPrevChapter && (
                  <button onClick={goToPrevChapter} className="px-6 py-3 rounded-lg" style={{ background: theme.surface, color: theme.text }}>
                    ← Previous Chapter
                  </button>
                )}
                {hasNextChapter && (
                  <button onClick={goToNextChapter} className="px-6 py-3 rounded-lg" style={{ background: theme.primary, color: '#fff' }}>
                    Next Chapter →
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center relative">
            {pages[currentPage]?.success ? (
              <img src={pages[currentPage].data} alt={`Page ${currentPage + 1}`} className="max-h-full max-w-full object-contain" />
            ) : (
              <div className="w-64 h-96 flex items-center justify-center rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <span className="text-4xl font-black text-white/20">{currentPage + 1}</span>
              </div>
            )}
            <div className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} />
            <div className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer" onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ============ LOADING SKELETON ============
const LoadingSkeleton = ({ count = 12 }) => {
  const { theme } = useThemeStore();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className="aspect-[2/3] rounded-xl animate-pulse" style={{ background: theme.surface }} />
      ))}
    </div>
  );
};

// ============ MAIN COMPONENT ============
const MangaScreen = () => {
  const { theme } = useThemeStore();
  const { selectedManga: preSelectedManga, clearSelected } = useNavigationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchProvider, setSearchProvider] = useState('s1'); // Provider for searching
  const [view, setView] = useState('popular');
  const [page, setPage] = useState(1);
  const [selectedManga, setSelectedManga] = useState(null);
  const [selectedMangaProvider, setSelectedMangaProvider] = useState('s1'); // Provider for selected manga
  const [readingChapter, setReadingChapter] = useState(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [allChapters, setAllChapters] = useState([]);

  const { providers } = useMangaProviders();
  const { data: popularData, loading: popularLoading } = usePopularManga(page, 24);
  const { data: latestData, loading: latestLoading } = useLatestManga(page, 24);
  const { data: searchData, loading: searchLoading } = useSearchManga(searchProvider, debouncedQuery, page);

  // Handle pre-selected manga from navigation (e.g., clicking "Read Now" from HomeScreen)
  useEffect(() => {
    if (preSelectedManga) {
      setSelectedManga(preSelectedManga);
      // Pre-selected manga from home screen is from MangaDex
      setSelectedMangaProvider('s1');
      clearSelected();
    }
  }, [preSelectedManga, clearSelected]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      if (searchQuery.length >= 2) {
        setView('search');
      } else if (view === 'search') {
        setView('popular');
      }
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getData = () => {
    switch (view) {
      case 'latest': return { data: latestData, loading: latestLoading };
      case 'search': return { data: searchData, loading: searchLoading };
      default: return { data: popularData, loading: popularLoading };
    }
  };

  const { data, loading } = getData();
  const mangaList = data?.results || [];

  // Handler for selecting a manga - track which provider it came from
  const handleSelectManga = (manga) => {
    setSelectedManga(manga);
    // If we're viewing search results, use the search provider
    // Otherwise use s1 (MangaDex) for popular/latest
    setSelectedMangaProvider(view === 'search' ? searchProvider : 's1');
  };

  const handleReadChapter = (chapter, index) => {
    setReadingChapter(chapter);
    setCurrentChapterIndex(index);
  };

  const handleChangeChapter = (chapter, index) => {
    setReadingChapter(chapter);
    setCurrentChapterIndex(index);
  };

  return (
    <div className="min-h-screen pt-24 pb-8 px-6" style={{ background: theme.background }}>
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-black mb-1" style={{ color: theme.text }}>Manga Library</h1>
        <p className="text-sm opacity-60" style={{ color: theme.text }}>Browse manga from multiple sources</p>
      </div>

      <div className="max-w-7xl mx-auto mb-6 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search manga..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl outline-none transition-all text-sm"
            style={{ background: theme.surface, color: theme.text, border: '2px solid transparent' }}
            onFocus={(e) => e.target.style.borderColor = theme.primary}
            onBlur={(e) => e.target.style.borderColor = 'transparent'}
          />
        </div>

        <select
          value={searchProvider}
          onChange={(e) => {
            setSearchProvider(e.target.value);
            // Reset to search view when changing to non-MangaDex server
            if (e.target.value !== 's1' && view !== 'search') {
              setView('search');
              setSearchQuery('');
              setDebouncedQuery('');
            }
          }}
          className="px-4 py-2.5 rounded-xl outline-none cursor-pointer text-sm"
          style={{ background: theme.surface, color: theme.text }}
        >
          {providers.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
        </select>

        <div className="flex gap-2">
          {['popular', 'latest'].map(v => (
            <button
              key={v}
              onClick={() => { setView(v); setPage(1); setSearchProvider('s1'); }}
              disabled={searchProvider !== 's1'}
              className="px-4 py-2.5 rounded-xl font-medium transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                background: view === v && searchProvider === 's1' ? theme.primary : theme.surface, 
                color: view === v && searchProvider === 's1' ? '#fff' : theme.text 
              }}
              title={searchProvider !== 's1' ? 'Only available for Server 1' : ''}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Show prompt when non-MangaDex server selected but no search */}
        {searchProvider !== 's1' && !debouncedQuery ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div 
              className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ background: `${theme.primary}20` }}
            >
              <svg className="w-10 h-10" style={{ color: theme.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: theme.text }}>
              Search {providers.find(p => p.id === searchProvider)?.name || 'this server'}
            </h3>
            <p className="opacity-60 max-w-md mx-auto" style={{ color: theme.text }}>
              Popular and Latest are only available for Server 1. 
              Use the search box above to find manga on this server.
            </p>
          </motion.div>
        ) : loading ? (
          <LoadingSkeleton count={24} />
        ) : mangaList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {mangaList.map((manga, index) => (
              <MangaCard 
                key={manga.id} 
                item={manga} 
                index={index} 
                onSelect={handleSelectManga} 
                provider={view === 'search' ? searchProvider : 's1'}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 opacity-60" style={{ color: theme.text }}>
            {view === 'search' ? 'No results found' : 'No manga available'}
          </div>
        )}

        {(mangaList.length > 0 || page > 1) && (
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-6 py-2.5 rounded-xl font-medium disabled:opacity-50 text-sm"
              style={{ background: theme.surface, color: theme.text }}
            >Previous</button>
            <span className="px-4 py-2.5 text-sm" style={{ color: theme.text }}>Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={mangaList.length === 0}
              className="px-6 py-2.5 rounded-xl font-medium disabled:opacity-50 text-sm"
              style={{ background: theme.primary, color: '#fff' }}
            >Next</button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedManga && !readingChapter && (
          <MangaDetailModal
            manga={selectedManga}
            provider={selectedMangaProvider}
            onClose={() => setSelectedManga(null)}
            onReadChapter={handleReadChapter}
            setAllChapters={setAllChapters}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {readingChapter && (
          <ChapterReader
            chapter={readingChapter}
            chapterIndex={currentChapterIndex}
            allChapters={allChapters}
            provider={selectedMangaProvider}
            onClose={() => setReadingChapter(null)}
            onChangeChapter={handleChangeChapter}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MangaScreen;
