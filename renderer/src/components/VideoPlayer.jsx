import { useEffect, useRef, useState, useCallback, memo } from 'react';
import Hls from 'hls.js';
import { useThemeStore } from '../store';

/**
 * Custom Video Player with HLS.js support
 * Features: Quality selector, subtitles, custom controls
 */

const VideoPlayer = ({
  src,
  poster,
  title,
  subtitles = [],
  autoPlay = false,
  onError,
  onReady,
  onTimeUpdate,
  onEnded,
  onQualityChange,
  className = '',
}) => {
  const { theme } = useThemeStore();
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const containerRef = useRef(null);
  const currentSrcRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  
  // Use refs for callbacks to prevent re-initialization
  const callbacksRef = useRef({ onError, onReady, onTimeUpdate, onEnded, onQualityChange });
  callbacksRef.current = { onError, onReady, onTimeUpdate, onEnded, onQualityChange };

  // State
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [availableQualities, setAvailableQualities] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSwitchingQuality, setIsSwitchingQuality] = useState(false);

  const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // Initialize HLS - only depends on src and autoPlay
  useEffect(() => {
    if (!videoRef.current || !src) return;

    // Skip if same source and HLS instance exists
    if (currentSrcRef.current === src && hlsRef.current) {
      return;
    }

    currentSrcRef.current = src;
    setLoading(true);
    setError(null);

    const isHls = src.includes('.m3u8') || src.includes('/proxy?');

    if (isHls && Hls.isSupported()) {
      // Destroy existing HLS instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      const hls = new Hls({
        debug: false,
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
        maxBufferLength: 60,
        maxMaxBufferLength: 600,
        maxBufferSize: 60 * 1000 * 1000,
        maxBufferHole: 1,
        fragLoadingTimeOut: 30000,
        manifestLoadingTimeOut: 30000,
        levelLoadingTimeOut: 30000,
        startLevel: -1,
        autoStartLoad: true,
        fragLoadingMaxRetry: 6,
        manifestLoadingMaxRetry: 4,
        levelLoadingMaxRetry: 4,
        // Seamless quality switching - don't flush buffer on level switch
        capLevelToPlayerSize: false,
        // Keep buffer when switching levels for seamless transition
        abrEwmaDefaultEstimate: 500000,
      });

      hls.loadSource(src);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setLoading(false);
        setIsReady(true);

        // Get available qualities
        const qualities = [
          { label: 'Auto', value: 'auto' },
          ...data.levels.map((level, index) => ({
            label: `${level.height}p`,
            value: index,
            height: level.height,
          })),
        ];
        setAvailableQualities(qualities);

        if (autoPlay) {
          videoRef.current?.play().catch(() => {});
        }

        callbacksRef.current.onReady?.();
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const level = hls.levels[data.level];
        if (level) {
          setCurrentQuality(level.height + 'p');
          callbacksRef.current.onQualityChange?.(level.height);
        }
        setIsSwitchingQuality(false);
      });

      hls.on(Hls.Events.LEVEL_SWITCHING, () => {
        // Don't show loading during seamless switch, only update state
      });

      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        // Fragment buffered successfully
        setIsSwitchingQuality(false);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError('Network error - retrying...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError('Media error - recovering...');
              hls.recoverMediaError();
              break;
            default:
              setError('Playback error');
              callbacksRef.current.onError?.(data);
              break;
          }
        }
      });

      hlsRef.current = hls;

      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
        currentSrcRef.current = null;
      };
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = src;
      setLoading(false);
      setIsReady(true);
      if (autoPlay) videoRef.current.play().catch(() => {});
      callbacksRef.current.onReady?.();
    } else {
      videoRef.current.src = src;
      setLoading(false);
      setIsReady(true);
      if (autoPlay) videoRef.current.play().catch(() => {});
      callbacksRef.current.onReady?.();
    }
  }, [src, autoPlay]); // Only re-run when src or autoPlay changes

  // Add subtitles
  useEffect(() => {
    if (!videoRef.current || !subtitles?.length) return;

    const existingTracks = videoRef.current.querySelectorAll('track');
    existingTracks.forEach((track) => track.remove());

    subtitles.forEach((sub, index) => {
      if (sub.url) {
        const track = document.createElement('track');
        track.kind = 'captions';
        track.label = sub.lang || sub.language || `Subtitle ${index + 1}`;
        track.srclang = sub.lang?.substring(0, 2) || 'en';
        track.src = sub.url;
        if (index === 0) track.default = true;
        videoRef.current.appendChild(track);
      }
    });
  }, [subtitles]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying]);

  // Video event handlers
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(time);
    setDuration(dur);

    // Update buffered
    if (videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setBuffered((bufferedEnd / dur) * 100);
    }

    callbacksRef.current.onTimeUpdate?.({ currentTime: time, duration: dur, percentage: (time / dur) * 100 });
  }, []);

  // Control handlers
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  }, []);

  const handleVolumeChange = useCallback((e) => {
    const value = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = value;
      setVolume(value);
      setIsMuted(value === 0);
    }
  }, []);

  const handleSeek = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    if (videoRef.current && duration) {
      videoRef.current.currentTime = percent * duration;
    }
  }, [duration]);

  const handleQualityChange = useCallback((quality) => {
    if (!hlsRef.current || !videoRef.current) return;
    
    const hls = hlsRef.current;
    const video = videoRef.current;
    
    // Store current state before switching
    const wasPlaying = !video.paused;
    const currentPos = video.currentTime;
    
    setIsSwitchingQuality(true);
    
    if (quality === 'auto') {
      // Enable ABR (Automatic Bitrate)
      hls.currentLevel = -1;
      setCurrentQuality('Auto');
    } else {
      // Switch to specific level - use nextLevel for seamless switching
      // nextLevel will switch at next segment boundary without interruption
      hls.nextLevel = quality;
      const level = hls.levels[quality];
      if (level) setCurrentQuality(level.height + 'p');
    }
    
    // Ensure playback continues from the same position
    // Small delay to let HLS.js process the level switch
    setTimeout(() => {
      if (videoRef.current && Math.abs(videoRef.current.currentTime - currentPos) > 1) {
        videoRef.current.currentTime = currentPos;
      }
      if (wasPlaying && videoRef.current?.paused) {
        videoRef.current.play().catch(() => {});
      }
      setIsSwitchingQuality(false);
    }, 100);
    
    setShowSettings(false);
  }, []);

  const handlePlaybackRateChange = useCallback((rate) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
    setShowSettings(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  }, []);

  const seek = useCallback((seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration));
    }
  }, [duration]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!containerRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'arrowleft':
          e.preventDefault();
          seek(-10);
          break;
        case 'arrowright':
          e.preventDefault();
          seek(10);
          break;
        case 'arrowup':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.volume = Math.min(1, videoRef.current.volume + 0.1);
            setVolume(videoRef.current.volume);
          }
          break;
        case 'arrowdown':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.volume = Math.max(0, videoRef.current.volume - 0.1);
            setVolume(videoRef.current.volume);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleFullscreen, toggleMute, seek]);

  // Format time
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-black ${className}`}>
        <p className="text-gray-400">No video source</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-black group ${className}`}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onClick={(e) => {
        if (e.target === e.currentTarget || e.target === videoRef.current) {
          togglePlay();
        }
      }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        playsInline
        crossOrigin="anonymous"
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => { setIsPlaying(false); callbacksRef.current.onEnded?.(); }}
        onLoadedData={() => setLoading(false)}
        onCanPlay={() => { setLoading(false); setIsReady(true); }}
        onError={(e) => { setError('Video error'); callbacksRef.current.onError?.(e); }}
        style={{ objectFit: 'contain' }}
      />

      {/* Loading Overlay */}
      {loading && !isSwitchingQuality && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: `${theme.primary} transparent transparent transparent` }}
            />
            <p className="text-white text-sm">Loading...</p>
          </div>
        </div>
      )}

      {/* Quality Switching Indicator (subtle) */}
      {isSwitchingQuality && (
        <div className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-lg bg-black/70 text-white text-xs flex items-center gap-2">
          <div
            className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: `${theme.primary} transparent transparent transparent` }}
          />
          Switching quality...
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-lg bg-red-600/90 text-white text-sm">
          {error}
        </div>
      )}

      {/* Title Overlay */}
      {title && showControls && (
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none transition-opacity duration-300">
          <h3 className="text-white font-bold text-lg drop-shadow-lg">{title}</h3>
        </div>
      )}

      {/* Center Play Button (when paused) */}
      {!isPlaying && !loading && isReady && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <button
            className="w-20 h-20 rounded-full flex items-center justify-center pointer-events-auto hover:scale-110 transition-transform"
            style={{ background: `${theme.primary}cc` }}
            onClick={togglePlay}
          >
            <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </button>
        </div>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 z-20 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Bar */}
        <div
          className="relative h-1 bg-white/30 rounded-full cursor-pointer mb-3 group/progress"
          onClick={handleSeek}
        >
          {/* Buffered */}
          <div
            className="absolute h-full bg-white/50 rounded-full"
            style={{ width: `${buffered}%` }}
          />
          {/* Progress */}
          <div
            className="absolute h-full rounded-full"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%`, background: theme.primary }}
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity"
            style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%`, background: theme.primary, transform: 'translate(-50%, -50%)' }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play/Pause */}
            <button onClick={togglePlay} className="text-white hover:scale-110 transition-transform p-1">
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
              )}
            </button>

            {/* Skip buttons */}
            <button onClick={() => seek(-10)} className="text-white hover:scale-110 transition-transform p-1 hidden sm:block">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
            </button>
            <button onClick={() => seek(10)} className="text-white hover:scale-110 transition-transform p-1 hidden sm:block">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
              </svg>
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1 group/volume">
              <button onClick={toggleMute} className="text-white hover:scale-110 transition-transform p-1">
                {isMuted || volume === 0 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" />
                  </svg>
                ) : volume < 0.5 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 7.757a4 4 0 010 4.486.75.75 0 01-1.263-.814 2.5 2.5 0 000-2.858.75.75 0 011.263-.814z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 5.255a6 6 0 010 9.49.75.75 0 01-1.06-1.06 4.5 4.5 0 000-7.37.75.75 0 011.06-1.06z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-16 transition-all duration-200 h-1 appearance-none bg-white/30 rounded-full cursor-pointer hidden sm:block"
                style={{ accentColor: theme.primary }}
              />
            </div>

            {/* Time */}
            <span className="text-white text-xs sm:text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Settings */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-white hover:scale-110 transition-transform p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Settings Menu */}
              {showSettings && (
                <div
                  className="absolute bottom-full right-0 mb-2 min-w-[180px] rounded-lg overflow-hidden shadow-xl"
                  style={{ background: theme.surface, border: `1px solid ${theme.textSecondary}30` }}
                >
                  {/* Quality */}
                  {availableQualities.length > 1 && (
                    <div className="p-2 border-b" style={{ borderColor: `${theme.textSecondary}20` }}>
                      <p className="text-xs font-semibold mb-1 px-2" style={{ color: theme.textSecondary }}>Quality</p>
                      <div className="max-h-32 overflow-y-auto">
                        {availableQualities.map((q) => (
                          <button
                            key={q.value}
                            onClick={() => handleQualityChange(q.value)}
                            className="w-full text-left px-2 py-1.5 text-sm rounded hover:opacity-80 transition-opacity flex items-center justify-between"
                            style={{
                              color: currentQuality === q.label || (q.value === 'auto' && currentQuality === 'Auto') ? theme.primary : theme.text,
                              background: currentQuality === q.label ? `${theme.primary}20` : 'transparent',
                            }}
                          >
                            {q.label}
                            {(currentQuality === q.label || (q.value === 'auto' && currentQuality === 'Auto')) && (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Speed */}
                  <div className="p-2">
                    <p className="text-xs font-semibold mb-1 px-2" style={{ color: theme.textSecondary }}>Speed</p>
                    <div className="max-h-32 overflow-y-auto">
                      {playbackRates.map((rate) => (
                        <button
                          key={rate}
                          onClick={() => handlePlaybackRateChange(rate)}
                          className="w-full text-left px-2 py-1.5 text-sm rounded hover:opacity-80 transition-opacity flex items-center justify-between"
                          style={{
                            color: playbackRate === rate ? theme.primary : theme.text,
                            background: playbackRate === rate ? `${theme.primary}20` : 'transparent',
                          }}
                        >
                          {rate === 1 ? 'Normal' : `${rate}x`}
                          {playbackRate === rate && (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="text-white hover:scale-110 transition-transform p-1">
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoize to prevent re-renders from parent state changes
export default memo(VideoPlayer, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.src === nextProps.src &&
    prevProps.autoPlay === nextProps.autoPlay &&
    prevProps.poster === nextProps.poster &&
    prevProps.title === nextProps.title &&
    prevProps.className === nextProps.className &&
    JSON.stringify(prevProps.subtitles) === JSON.stringify(nextProps.subtitles)
  );
});
