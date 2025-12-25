import { useState, useRef } from 'react';
import { motion } from 'motion/react';

// Store
import { useThemeStore } from '../../store';

export const BackgroundCustomizer = () => {
  const { theme, backgroundImage, setBackgroundImage, removeBackgroundImage } = useThemeStore();
  const [previewUrl, setPreviewUrl] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef(null);
  
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          setPreviewUrl(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      setPreviewUrl(urlInput.trim());
    }
  };
  
  const handleApply = () => {
    if (previewUrl) {
      setBackgroundImage(previewUrl);
      setPreviewUrl('');
      setUrlInput('');
    }
  };
  
  const handleRemove = () => {
    removeBackgroundImage();
    setPreviewUrl('');
    setUrlInput('');
  };

  // Sample background patterns/gradients
  const presetBackgrounds = [
    { 
      name: 'Gradient Purple', 
      value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
    },
    { 
      name: 'Gradient Sunset', 
      value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' 
    },
    { 
      name: 'Gradient Ocean', 
      value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' 
    },
    { 
      name: 'Gradient Forest', 
      value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' 
    },
    { 
      name: 'Mesh Gradient', 
      value: 'radial-gradient(at 40% 20%, #1a1a2e 0px, transparent 50%), radial-gradient(at 80% 0%, #6366f1 0px, transparent 50%), radial-gradient(at 0% 50%, #8b5cf6 0px, transparent 50%), radial-gradient(at 80% 50%, #ec4899 0px, transparent 50%), radial-gradient(at 0% 100%, #0f0f23 0px, transparent 50%)' 
    },
    { 
      name: 'Dark Mesh', 
      value: 'radial-gradient(at 100% 100%, #1a1a2e 0px, transparent 50%), radial-gradient(at 0% 0%, #2d1b4e 0px, transparent 50%), #0f0f23' 
    },
  ];

  return (
    <motion.div
      className="p-4 sm:p-6 rounded-2xl"
      style={{ backgroundColor: theme.surface }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <h2 
          className="text-xl sm:text-2xl font-bold"
          style={{ color: theme.text }}
        >
          🖼️ Background
        </h2>
        
        {backgroundImage && (
          <motion.button
            className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium"
            style={{ 
              backgroundColor: theme.accent + '20',
              color: theme.accent,
            }}
            onClick={handleRemove}
            whileHover={{ scale: 1.02, backgroundColor: theme.accent + '40' }}
            whileTap={{ scale: 0.98 }}
          >
            Remove Background
          </motion.button>
        )}
      </div>
      
      {/* Current Background Preview */}
      {backgroundImage && (
        <div className="mb-4 sm:mb-6">
          <p 
            className="text-xs sm:text-sm font-medium mb-2"
            style={{ color: theme.textSecondary }}
          >
            Current Background
          </p>
          <div 
            className="w-full h-24 sm:h-32 rounded-xl bg-cover bg-center border-2"
            style={{ 
              background: backgroundImage.startsWith('linear') || backgroundImage.startsWith('radial') 
                ? backgroundImage 
                : `url(${backgroundImage}) center/cover`,
              borderColor: theme.primary + '50',
            }}
          />
        </div>
      )}
      
      {/* Preset Gradients */}
      <div className="mb-4 sm:mb-6">
        <p 
          className="text-xs sm:text-sm font-medium mb-2 sm:mb-3"
          style={{ color: theme.textSecondary }}
        >
          Preset Gradients
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          {presetBackgrounds.map((preset, i) => (
            <motion.button
              key={i}
              className="aspect-video rounded-lg border-2 relative overflow-hidden group"
              style={{ 
                background: preset.value,
                borderColor: backgroundImage === preset.value ? theme.primary : 'transparent',
              }}
              onClick={() => setBackgroundImage(preset.value)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={preset.name}
            >
              <div 
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <span className="text-white text-xs font-medium text-center px-1">
                  {preset.name}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* Upload from File */}
      <div className="mb-4 sm:mb-6">
        <p 
          className="text-xs sm:text-sm font-medium mb-2 sm:mb-3"
          style={{ color: theme.textSecondary }}
        >
          Upload Image
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <motion.button
          className="w-full p-4 sm:p-6 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2"
          style={{ 
            borderColor: theme.primary + '50',
            backgroundColor: theme.background,
          }}
          onClick={() => fileInputRef.current?.click()}
          whileHover={{ borderColor: theme.primary, backgroundColor: theme.primary + '10' }}
          whileTap={{ scale: 0.99 }}
        >
          <span className="text-2xl sm:text-3xl">📁</span>
          <span 
            className="text-xs sm:text-sm font-medium"
            style={{ color: theme.textSecondary }}
          >
            Click to upload or drag & drop
          </span>
        </motion.button>
      </div>
      
      {/* URL Input */}
      <div className="mb-4 sm:mb-6">
        <p 
          className="text-xs sm:text-sm font-medium mb-2 sm:mb-3"
          style={{ color: theme.textSecondary }}
        >
          Or paste image URL
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-sm sm:text-base"
            style={{ 
              backgroundColor: theme.background,
              color: theme.text,
              border: `1px solid ${theme.text}20`,
            }}
          />
          <motion.button
            className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium text-sm sm:text-base"
            style={{ 
              backgroundColor: theme.primary,
              color: 'white',
            }}
            onClick={handleUrlSubmit}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Preview
          </motion.button>
        </div>
      </div>
      
      {/* Preview */}
      {previewUrl && (
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p 
            className="text-xs sm:text-sm font-medium mb-2"
            style={{ color: theme.textSecondary }}
          >
            Preview
          </p>
          <div 
            className="w-full h-32 sm:h-40 rounded-xl bg-cover bg-center mb-3"
            style={{ 
              backgroundImage: `url(${previewUrl})`,
            }}
          />
          <div className="flex gap-3">
            <motion.button
              className="flex-1 py-2 rounded-lg font-medium text-sm sm:text-base"
              style={{ 
                backgroundColor: theme.background,
                color: theme.textSecondary,
              }}
              onClick={() => {
                setPreviewUrl('');
                setUrlInput('');
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
            <motion.button
              className="flex-1 py-2 rounded-lg font-medium text-sm sm:text-base"
              style={{ 
                backgroundColor: theme.primary,
                color: 'white',
              }}
              onClick={handleApply}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Apply Background
            </motion.button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
