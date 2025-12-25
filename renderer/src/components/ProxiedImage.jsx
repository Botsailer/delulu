// ProxiedImage - Loads all images through Node.js server
// No external URLs are exposed to the browser

import { useState, useEffect, memo } from 'react';

// Check if running in Electron
const isElectron = () => typeof window !== 'undefined' && window.electronAPI;

// Global image cache to avoid re-fetching
const imageCache = new Map();

// Hook to load a proxied image
export const useProxiedImage = (imageUrl, placeholder = null) => {
  const [src, setSrc] = useState(placeholder);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!imageUrl) {
      setLoading(false);
      return;
    }

    // Check local cache first
    if (imageCache.has(imageUrl)) {
      setSrc(imageCache.get(imageUrl));
      setLoading(false);
      return;
    }

    // In non-Electron, just use the URL directly
    if (!isElectron()) {
      setSrc(imageUrl);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadImage = async () => {
      try {
        const result = await window.electronAPI.images.proxy(imageUrl);
        if (cancelled) return;
        
        if (result.success && result.data) {
          imageCache.set(imageUrl, result.data);
          setSrc(result.data);
        } else {
          // Fallback to original URL if proxy fails
          setSrc(imageUrl);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err.message);
        // Fallback to original URL
        setSrc(imageUrl);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadImage();

    return () => { cancelled = true; };
  }, [imageUrl, placeholder]);

  return { src, loading, error };
};

// Batch load multiple images
export const useProxiedImages = (imageUrls = []) => {
  const [images, setImages] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!imageUrls || imageUrls.length === 0) {
      setLoading(false);
      return;
    }

    // Filter out already cached images
    const uncached = imageUrls.filter(url => url && !imageCache.has(url));
    const cached = {};
    imageUrls.forEach(url => {
      if (url && imageCache.has(url)) {
        cached[url] = imageCache.get(url);
      }
    });

    if (uncached.length === 0) {
      setImages(cached);
      setLoading(false);
      return;
    }

    if (!isElectron()) {
      const directUrls = {};
      imageUrls.forEach(url => { if (url) directUrls[url] = url; });
      setImages(directUrls);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadImages = async () => {
      try {
        const result = await window.electronAPI.images.proxyBatch(uncached);
        if (cancelled) return;

        const newImages = { ...cached };
        if (result.success && result.data) {
          result.data.forEach(({ url, data, success }) => {
            if (success && data) {
              imageCache.set(url, data);
              newImages[url] = data;
            } else {
              newImages[url] = url; // Fallback
            }
          });
        }
        setImages(newImages);
      } catch (err) {
        if (cancelled) return;
        // Fallback to original URLs
        const fallback = { ...cached };
        uncached.forEach(url => { fallback[url] = url; });
        setImages(fallback);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadImages();

    return () => { cancelled = true; };
  }, [imageUrls.join(',')]);

  return { images, loading };
};

// ProxiedImage Component
const ProxiedImage = memo(({ 
  src: imageUrl, 
  alt = '', 
  className = '', 
  style = {},
  placeholder = null,
  onLoad,
  onError,
  ...props 
}) => {
  const { src, loading, error } = useProxiedImage(imageUrl, placeholder);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleLoad = (e) => {
    setImgLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e) => {
    onError?.(e);
  };

  // Show placeholder or loading state
  if (loading && placeholder) {
    return (
      <img
        src={placeholder}
        alt={alt}
        className={className}
        style={style}
        {...props}
      />
    );
  }

  if (loading) {
    return (
      <div 
        className={className}
        style={{
          ...style,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        {...props}
      >
        <div className="animate-pulse w-8 h-8 rounded-full bg-white/10" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{
        ...style,
        opacity: imgLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
});

ProxiedImage.displayName = 'ProxiedImage';

export default ProxiedImage;
