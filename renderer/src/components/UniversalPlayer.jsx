import { useEffect, useRef, useState, useCallback, memo } from 'react';
import Hls from 'hls.js';
import { useThemeStore } from '../store';

/**
 * Universal Video Player - Supports HLS, DASH, MP4, WebM
 * Optimized for fast startup with low latency HLS configuration
 */

// Detect video type from URL
const getVideoType = (url) => {
  if (!url) return 'unknown';
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('.m3u8') || lowerUrl.includes('m3u8')) return 'hls';
  if (lowerUrl.includes('.mpd')) return 'dash';
  if (lowerUrl.includes('.mp4')) return 'mp4';
  if (lowerUrl.includes('.webm')) return 'webm';
  if (lowerUrl.includes('/proxy')) return 'hls'; // Assume proxy URLs are HLS
  return 'native';
};

// Format time helper
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const STALL_TIMEOUT = 15000; // 15 seconds

const UniversalPlayer = ({
  src,
  poster,
  title,
  subtitles = [],
  autoPlay = true,
  onError,
  onReady,
  onTimeUpdate,
  onEnded,
  onStalled, // Called when buffering takes too long
  className = '',
}) => {
  const { theme } = useThemeStore();
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const stallTimeoutRef = useRef(null);
  const lastSrcRef = useRef(null);
  
  // Callbacks ref to prevent re-initialization
  const callbacksRef = useRef({ onError, onReady, onTimeUpdate, onEnded, onStalled });
  callbacksRef.current = { onError, onReady, onTimeUpdate, onEnded, onStalled };

  // Core state
  const [playerState, setPlayerState] = useState({
    isReady: false,
    isPlaying: false,
    isBuffering: true,
    isStalled: false, // True when buffering takes too long
    isMuted: false,
    volume: 1,
    currentTime: 0,
    duration: 0,
    buffered: 0,
    isFullscreen: false,
    showControls: true,
    error: null,
    currentQuality: 'Auto',
    availableQualities: [],
    playbackRate: 1,
    activeSubtitle: -1,
  });

  const [showSettings, setShowSettings] = useState(false);
  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  // Update state helper
  const updateState = useCallback((updates) => {
    setPlayerState(prev => ({ ...prev, ...updates }));
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (stallTimeoutRef.current) {
      clearTimeout(stallTimeoutRef.current);
      stallTimeoutRef.current = null;
    }
  }, []);

  // Stall detection - start/reset timeout when buffering
  const startStallTimer = useCallback(() => {
    if (stallTimeoutRef.current) {
      clearTimeout(stallTimeoutRef.current);
    }
    stallTimeoutRef.current = setTimeout(() => {
      updateState({ isStalled: true });
      callbacksRef.current.onStalled?.();
    }, STALL_TIMEOUT);
  }, [updateState]);

  const clearStallTimer = useCallback(() => {
    if (stallTimeoutRef.current) {
      clearTimeout(stallTimeoutRef.current);
      stallTimeoutRef.current = null;
    }
    updateState({ isStalled: false });
  }, [updateState]);

  // Initialize player based on source type
  useEffect(() => {
    if (!videoRef.current || !src) return;
    if (lastSrcRef.current === src) return;
    
    lastSrcRef.current = src;
    cleanup();
    
    // Start stall timer on load
    startStallTimer();
    
    updateState({ 
      isReady: false, 
      isBuffering: true,
      isStalled: false,
      error: null,
      currentTime: 0,
      duration: 0,
      availableQualities: [],
      currentQuality: 'Auto'
    });

    const video = videoRef.current;
    const videoType = getVideoType(src);

    // HLS Stream
    if (videoType === 'hls' && Hls.isSupported()) {
      const hls = new Hls({
        // Fast startup config
        enableWorker: true,
        lowLatencyMode: true,
        
        // Minimal initial buffer for fast start
        maxBufferLength: 10,
        maxMaxBufferLength: 30,
        maxBufferSize: 10 * 1000 * 1000,
        maxBufferHole: 0.5,
        
        // Start from lowest quality, let ABR adjust
        startLevel: 0,
        autoStartLoad: true,
        
        // Fast fragment loading
        fragLoadingTimeOut: 10000,
        manifestLoadingTimeOut: 10000,
        levelLoadingTimeOut: 10000,
        
        // Quick retries
        fragLoadingMaxRetry: 3,
        manifestLoadingMaxRetry: 2,
        levelLoadingMaxRetry: 2,
        fragLoadingRetryDelay: 500,
        
        // ABR settings - quick adaptation
        abrEwmaDefaultEstimate: 500000,
        abrBandWidthFactor: 0.95,
        abrBandWidthUpFactor: 0.7,
        abrMaxWithRealBitrate: true,
        
        // Buffer tweaks
        backBufferLength: 30,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 6,
        
        // Don't stall on small gaps
        nudgeOffset: 0.1,
        nudgeMaxRetry: 5,
        maxFragLookUpTolerance: 0.25,
        
        // Progressive loading
        progressive: true,
        testBandwidth: false,
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const qualities = [
          { label: 'Auto', value: -1 },
          ...data.levels
            .map((level, index) => ({
              label: `${level.height}p`,
              value: index,
              height: level.height,
            }))
            .sort((a, b) => b.height - a.height),
        ];
        updateState({ availableQualities: qualities, isReady: true });
        callbacksRef.current.onReady?.();
        
        if (autoPlay) {
          video.play().catch(() => {});
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        const level = hls.levels[data.level];
        if (level) {
          updateState({ currentQuality: `${level.height}p` });
        }
      });

      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        updateState({ isBuffering: false });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.warn('HLS Error:', data.type, data.details);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              updateState({ error: 'Playback failed' });
              callbacksRef.current.onError?.(data);
          }
        }
      });

      hlsRef.current = hls;
    }
    // Native HLS (Safari)
    else if (videoType === 'hls' && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      updateState({ isReady: true });
      callbacksRef.current.onReady?.();
      if (autoPlay) video.play().catch(() => {});
    }
    // DASH - fallback to native (dashjs not bundled to reduce size)
    else if (videoType === 'dash') {
      // Try native DASH support first
      if (video.canPlayType('application/dash+xml')) {
        video.src = src;
        updateState({ isReady: true });
        callbacksRef.current.onReady?.();
        if (autoPlay) video.play().catch(() => {});
      } else {
        updateState({ error: 'DASH format not supported' });
        callbacksRef.current.onError?.({ message: 'DASH not supported' });
      }
    }
    // Native video (MP4, WebM, etc.)
    else {
      video.src = src;
      updateState({ isReady: true });
      callbacksRef.current.onReady?.();
      if (autoPlay) video.play().catch(() => {});
    }

    return cleanup;
  }, [src, autoPlay, cleanup, updateState, startStallTimer]);

  // Setup subtitles
  useEffect(() => {
    if (!videoRef.current) return;
    
    // Remove existing tracks
    const existingTracks = videoRef.current.querySelectorAll('track');
    existingTracks.forEach(track => track.remove());

    // Add new tracks
    subtitles.forEach((sub, index) => {
      if (sub.url) {
        const track = document.createElement('track');
        track.kind = 'captions';
        track.label = sub.lang || sub.language || `Subtitle ${index + 1}`;
        track.srclang = sub.lang?.substring(0, 2) || 'en';
        track.src = sub.url;
        videoRef.current.appendChild(track);
      }
    });
  }, [subtitles]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlers = {
      play: () => {
        clearStallTimer();
        updateState({ isPlaying: true, isBuffering: false });
      },
      pause: () => updateState({ isPlaying: false }),
      ended: () => {
        clearStallTimer();
        updateState({ isPlaying: false });
        callbacksRef.current.onEnded?.();
      },
      waiting: () => {
        startStallTimer();
        updateState({ isBuffering: true });
      },
      playing: () => {
        clearStallTimer();
        updateState({ isBuffering: false, isPlaying: true });
      },
      canplay: () => {
        clearStallTimer();
        updateState({ isBuffering: false, isReady: true });
      },
      canplaythrough: () => {
        clearStallTimer();
        updateState({ isBuffering: false });
      },
      seeking: () => {
        startStallTimer();
        updateState({ isBuffering: true });
      },
      seeked: () => {
        clearStallTimer();
        updateState({ isBuffering: false });
      },
      loadedmetadata: () => {
        updateState({ duration: video.duration || 0 });
      },
      timeupdate: () => {
        const time = video.currentTime;
        const dur = video.duration || 0;
        let bufferedPercent = 0;
        
        if (video.buffered.length > 0) {
          const bufferedEnd = video.buffered.end(video.buffered.length - 1);
          bufferedPercent = (bufferedEnd / dur) * 100;
        }
        
        // Clear stall timer on progress
        if (time > 0) {
          clearStallTimer();
        }
        
        updateState({
          currentTime: time,
          duration: dur,
          buffered: bufferedPercent,
        });
        
        callbacksRef.current.onTimeUpdate?.({
          currentTime: time,
          duration: dur,
          percentage: dur ? (time / dur) * 100 : 0,
        });
      },
      error: (e) => {
        clearStallTimer();
        console.error('Video error:', e);
        updateState({ error: 'Video playback error' });
        callbacksRef.current.onError?.(e);
      },
      volumechange: () => {
        updateState({
          volume: video.volume,
          isMuted: video.muted,
        });
      },
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      video.addEventListener(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        video.removeEventListener(event, handler);
      });
    };
  }, [updateState, startStallTimer, clearStallTimer]);

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreen = () => {
      updateState({ isFullscreen: !!document.fullscreenElement });
    };
    document.addEventListener('fullscreenchange', handleFullscreen);
    return () => document.removeEventListener('fullscreenchange', handleFullscreen);
  }, [updateState]);

  // Pause video when app loses focus or goes to background
  useEffect(() => {
    const video = videoRef.current;
    
    const handleVisibilityChange = () => {
      if (document.hidden && video && !video.paused) {
        video.pause();
      }
    };
    
    const handleBlur = () => {
      if (video && !video.paused) {
        video.pause();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    updateState({ showControls: true });
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (playerState.isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        updateState({ showControls: false });
      }, 3000);
    }
  }, [playerState.isPlaying, updateState]);

  // Control functions
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play().catch(() => {}) : video.pause();
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }, []);

  const handleVolumeChange = useCallback((e) => {
    const video = videoRef.current;
    if (!video) return;
    const value = parseFloat(e.target.value);
    video.volume = value;
    video.muted = value === 0;
  }, []);

  const handleSeek = useCallback((e) => {
    const video = videoRef.current;
    if (!video || !playerState.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = percent * playerState.duration;
  }, [playerState.duration]);

  const seek = useCallback((seconds) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, playerState.duration));
  }, [playerState.duration]);

  const handleQualityChange = useCallback((quality) => {
    if (!hlsRef.current) return;
    const hls = hlsRef.current;
    
    if (quality === -1) {
      hls.currentLevel = -1;
      updateState({ currentQuality: 'Auto' });
    } else {
      hls.nextLevel = quality;
      const level = hls.levels[quality];
      if (level) updateState({ currentQuality: `${level.height}p` });
    }
    setShowSettings(false);
  }, [updateState]);

  const handlePlaybackRateChange = useCallback((rate) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    updateState({ playbackRate: rate });
    setShowSettings(false);
  }, [updateState]);

  const toggleSubtitle = useCallback((index) => {
    const video = videoRef.current;
    if (!video) return;
    
    // Disable all tracks first
    for (let i = 0; i < video.textTracks.length; i++) {
      video.textTracks[i].mode = 'disabled';
    }
    
    // Enable selected track
    if (index >= 0 && video.textTracks[index]) {
      video.textTracks[index].mode = 'showing';
    }
    
    updateState({ activeSubtitle: index });
    setShowSettings(false);
  }, [updateState]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    document.fullscreenElement 
      ? document.exitFullscreen() 
      : containerRef.current.requestFullscreen();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (!containerRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;
      
      const key = e.key.toLowerCase();
      const handlers = {
        ' ': togglePlay,
        'k': togglePlay,
        'f': toggleFullscreen,
        'm': toggleMute,
        'arrowleft': () => seek(-10),
        'arrowright': () => seek(10),
        'arrowup': () => {
          if (videoRef.current) {
            videoRef.current.volume = Math.min(1, videoRef.current.volume + 0.1);
          }
        },
        'arrowdown': () => {
          if (videoRef.current) {
            videoRef.current.volume = Math.max(0, videoRef.current.volume - 0.1);
          }
        },
        'c': () => {
          // Toggle captions
          const nextSub = playerState.activeSubtitle < 0 && subtitles.length > 0 
            ? 0 
            : -1;
          toggleSubtitle(nextSub);
        },
      };
      
      if (handlers[key]) {
        e.preventDefault();
        handlers[key]();
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [togglePlay, toggleFullscreen, toggleMute, seek, toggleSubtitle, playerState.activeSubtitle, subtitles.length]);

  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-black ${className}`}>
        <p className="text-gray-400">No video source</p>
      </div>
    );
  }

  const { 
    isReady, isPlaying, isBuffering, isStalled, isMuted, volume, currentTime, 
    duration, buffered, isFullscreen, showControls, error, 
    currentQuality, availableQualities, playbackRate, activeSubtitle 
  } = playerState;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-black select-none ${className}`}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => isPlaying && updateState({ showControls: false })}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full cursor-pointer"
        poster={poster}
        playsInline
        crossOrigin="anonymous"
        onClick={togglePlay}
        style={{ objectFit: 'contain' }}
      />

      {/* Buffering Indicator */}
      {isBuffering && !error && (
        <div className={`absolute inset-0 flex items-center justify-center z-10 ${isStalled ? '' : 'pointer-events-none'}`}>
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: `${theme.primary} transparent transparent transparent` }}
            />
            <span className="text-white/80 text-sm">
              {isStalled ? 'Taking too long to load...' : 'Buffering...'}
            </span>
            {isStalled && callbacksRef.current.onStalled && (
              <button
                onClick={() => callbacksRef.current.onStalled?.()}
                className="mt-2 px-4 py-2 rounded-lg font-medium text-sm hover:scale-105 transition-transform flex items-center gap-2"
                style={{ background: theme.primary, color: '#fff' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Another Server
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center">
            <p className="text-red-500 text-lg mb-4">{error}</p>
            <button
              onClick={() => {
                updateState({ error: null, isBuffering: true });
                if (videoRef.current) {
                  videoRef.current.load();
                  videoRef.current.play().catch(() => {});
                }
              }}
              className="px-4 py-2 rounded-lg text-white"
              style={{ background: theme.primary }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Title */}
      {title && showControls && (
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10">
          <h3 className="text-white font-bold text-lg truncate">{title}</h3>
        </div>
      )}

      {/* Center Play Button */}
      {!isPlaying && isReady && !isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <button
            className="w-20 h-20 rounded-full flex items-center justify-center pointer-events-auto hover:scale-110 transition-transform"
            style={{ background: `${theme.primary}dd` }}
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
          className="relative h-1.5 bg-white/30 rounded-full cursor-pointer mb-4 group"
          onClick={handleSeek}
        >
          <div
            className="absolute h-full bg-white/50 rounded-full"
            style={{ width: `${buffered}%` }}
          />
          <div
            className="absolute h-full rounded-full transition-all"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%`, background: theme.primary }}
          />
          <div
            className="absolute top-1/2 w-4 h-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1/2"
            style={{ 
              left: `calc(${duration ? (currentTime / duration) * 100 : 0}% - 8px)`, 
              background: theme.primary 
            }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button onClick={togglePlay} className="text-white hover:scale-110 transition-transform">
              {isPlaying ? (
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Skip buttons */}
            <button onClick={() => seek(-10)} className="text-white hover:scale-110 transition-transform hidden sm:block">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
              </svg>
            </button>
            <button onClick={() => seek(10)} className="text-white hover:scale-110 transition-transform hidden sm:block">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
              </svg>
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 group/vol">
              <button onClick={toggleMute} className="text-white hover:scale-110 transition-transform">
                {isMuted || volume === 0 ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
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
                className="w-0 group-hover/vol:w-20 transition-all h-1 appearance-none bg-white/30 rounded-full cursor-pointer hidden sm:block"
                style={{ accentColor: theme.primary }}
              />
            </div>

            {/* Time */}
            <span className="text-white text-sm font-mono ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Captions Button */}
            {subtitles.length > 0 && (
              <button
                onClick={() => toggleSubtitle(activeSubtitle < 0 ? 0 : -1)}
                className={`text-white hover:scale-110 transition-transform relative ${activeSubtitle >= 0 ? 'text-yellow-400' : ''}`}
                title={activeSubtitle >= 0 ? 'Turn off captions' : 'Turn on captions'}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 4H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-4a1 1 0 011-1h3a1 1 0 011 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1a1 1 0 01-1 1h-3a1 1 0 01-1-1v-4a1 1 0 011-1h3a1 1 0 011 1v1z" />
                </svg>
                {activeSubtitle >= 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-400" />
                )}
              </button>
            )}

            {/* Settings */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-white hover:scale-110 transition-transform"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Settings Menu */}
              {showSettings && (
                <div
                  className="absolute bottom-full right-0 mb-2 min-w-[200px] rounded-lg overflow-hidden shadow-2xl"
                  style={{ background: theme.surface, border: `1px solid ${theme.textSecondary}30` }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Quality */}
                  {availableQualities.length > 1 && (
                    <div className="p-2 border-b" style={{ borderColor: `${theme.textSecondary}20` }}>
                      <p className="text-xs font-semibold mb-2 px-2" style={{ color: theme.textSecondary }}>Quality</p>
                      <div className="max-h-40 overflow-y-auto">
                        {availableQualities.map((q) => (
                          <button
                            key={q.value}
                            onClick={() => handleQualityChange(q.value)}
                            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-white/10 transition flex items-center justify-between"
                            style={{ color: currentQuality === q.label ? theme.primary : theme.text }}
                          >
                            {q.label}
                            {currentQuality === q.label && (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subtitles */}
                  {subtitles.length > 0 && (
                    <div className="p-2 border-b" style={{ borderColor: `${theme.textSecondary}20` }}>
                      <p className="text-xs font-semibold mb-2 px-2" style={{ color: theme.textSecondary }}>Subtitles</p>
                      <div className="max-h-40 overflow-y-auto">
                        <button
                          onClick={() => toggleSubtitle(-1)}
                          className="w-full text-left px-3 py-2 text-sm rounded hover:bg-white/10 transition flex items-center justify-between"
                          style={{ color: activeSubtitle === -1 ? theme.primary : theme.text }}
                        >
                          Off
                          {activeSubtitle === -1 && (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                            </svg>
                          )}
                        </button>
                        {subtitles.map((sub, i) => (
                          <button
                            key={i}
                            onClick={() => toggleSubtitle(i)}
                            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-white/10 transition flex items-center justify-between"
                            style={{ color: activeSubtitle === i ? theme.primary : theme.text }}
                          >
                            {sub.lang || sub.language || `Subtitle ${i + 1}`}
                            {activeSubtitle === i && (
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
                    <p className="text-xs font-semibold mb-2 px-2" style={{ color: theme.textSecondary }}>Speed</p>
                    <div className="flex flex-wrap gap-1 px-1">
                      {playbackRates.map((rate) => (
                        <button
                          key={rate}
                          onClick={() => handlePlaybackRateChange(rate)}
                          className="px-3 py-1.5 text-sm rounded transition"
                          style={{
                            color: playbackRate === rate ? '#fff' : theme.text,
                            background: playbackRate === rate ? theme.primary : 'rgba(255,255,255,0.1)',
                          }}
                        >
                          {rate === 1 ? '1x' : `${rate}x`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="text-white hover:scale-110 transition-transform">
              {isFullscreen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(UniversalPlayer, (prev, next) => {
  return (
    prev.src === next.src &&
    prev.autoPlay === next.autoPlay &&
    prev.poster === next.poster &&
    prev.title === next.title &&
    prev.className === next.className &&
    JSON.stringify(prev.subtitles) === JSON.stringify(next.subtitles)
  );
});
