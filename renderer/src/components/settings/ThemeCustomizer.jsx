import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HexColorPicker } from 'react-colorful';
import { 
  useThemeStore, 
  colorPalettes, 
  getCategories, 
  getPalettesByCategory 
} from '../../store/useThemeStore';

const ColorPickerModal = ({ colorKey, isOpen, onClose }) => {
  const { theme, setThemeColor } = useThemeStore();
  const [tempColor, setTempColor] = useState(theme[colorKey]);
  
  const handleSave = () => {
    setThemeColor(colorKey, tempColor);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="p-4 sm:p-6 rounded-2xl w-full max-w-xs sm:max-w-sm"
        style={{ backgroundColor: theme.surface }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 
          className="text-lg sm:text-xl font-semibold mb-4 capitalize"
          style={{ color: theme.text }}
        >
          Select {colorKey} Color
        </h3>
        
        <div className="flex justify-center mb-4">
          <HexColorPicker 
            color={tempColor} 
            onChange={setTempColor}
            style={{ width: '100%', maxWidth: '200px' }}
          />
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2"
            style={{ backgroundColor: tempColor, borderColor: theme.text + '30' }}
          />
          <input
            type="text"
            value={tempColor}
            onChange={(e) => setTempColor(e.target.value)}
            className="flex-1 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base"
            style={{ 
              backgroundColor: theme.background, 
              color: theme.text,
              border: `1px solid ${theme.text}30`,
            }}
          />
        </div>
        
        <div className="flex gap-3">
          <motion.button
            className="flex-1 py-2 rounded-lg font-medium text-sm sm:text-base"
            style={{ 
              backgroundColor: theme.background, 
              color: theme.textSecondary,
            }}
            onClick={onClose}
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
            onClick={handleSave}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Apply
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const ThemeCustomizer = () => {
  const { theme, applyPalette, resetTheme } = useThemeStore();
  const [activeColorPicker, setActiveColorPicker] = useState(null);
  const [showPalettes, setShowPalettes] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  
  const categories = getCategories();
  const filteredPalettes = getPalettesByCategory(activeCategory);
  
  const colorKeys = ['primary', 'secondary', 'accent', 'background', 'surface', 'text', 'textSecondary'];
  
  const colorLabels = {
    primary: 'Primary',
    secondary: 'Secondary', 
    accent: 'Accent',
    background: 'Background',
    surface: 'Surface',
    text: 'Text',
    textSecondary: 'Text Secondary',
  };
  
  const categoryIcons = {
    all: '🎨',
    default: '✨',
    cyberpunk: '🌃',
    anime: '🌸',
    matrix: '💚',
  };

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
          🎨 Theme Colors
        </h2>
        
        <div className="flex gap-2">
          <motion.button
            className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium"
            style={{ 
              backgroundColor: theme.background,
              color: theme.textSecondary,
            }}
            onClick={() => setShowPalettes(!showPalettes)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {showPalettes ? 'Hide Palettes' : 'Show Palettes'}
          </motion.button>
          
          <motion.button
            className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium"
            style={{ 
              backgroundColor: theme.accent + '20',
              color: theme.accent,
            }}
            onClick={resetTheme}
            whileHover={{ scale: 1.02, backgroundColor: theme.accent + '40' }}
            whileTap={{ scale: 0.98 }}
          >
            Reset
          </motion.button>
        </div>
      </div>
      
      {/* Preset Palettes */}
      <AnimatePresence>
        {showPalettes && (
          <motion.div
            className="mb-4 sm:mb-6"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((category) => (
                <motion.button
                  key={category}
                  className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium capitalize"
                  style={{
                    backgroundColor: activeCategory === category ? theme.primary : theme.background,
                    color: activeCategory === category ? 'white' : theme.textSecondary,
                  }}
                  onClick={() => setActiveCategory(category)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {categoryIcons[category]} {category}
                </motion.button>
              ))}
            </div>
            
            <h3 
              className="text-base sm:text-lg font-semibold mb-3"
              style={{ color: theme.text }}
            >
              {activeCategory === 'all' ? 'All Themes' : `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Themes`}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {filteredPalettes.map((palette, i) => (
                <motion.button
                  key={i}
                  className="p-2 sm:p-3 rounded-xl text-left relative overflow-hidden group"
                  style={{ backgroundColor: theme.background }}
                  onClick={() => applyPalette(palette)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {/* Character gradient preview - shown prominently for anime themes */}
                  {palette.characterGradient && (
                    <div 
                      className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 rounded-bl-3xl opacity-60 group-hover:opacity-100 transition-opacity"
                      style={{ background: palette.characterGradient }}
                    />
                  )}
                  {/* Background gradient preview if available */}
                  {palette.backgroundImage && !palette.characterGradient && (
                    <div 
                      className="absolute inset-0 opacity-30"
                      style={{ background: palette.backgroundImage }}
                    />
                  )}
                  <div className="relative z-10">
                    <div className="flex gap-1 mb-2">
                      {Object.values(palette.colors).slice(0, 3).map((color, j) => (
                        <div
                          key={j}
                          className="w-4 h-4 sm:w-6 sm:h-6 rounded-full border border-white/20"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span 
                      className="text-xs sm:text-sm font-medium block truncate"
                      style={{ color: theme.text }}
                    >
                      {palette.name}
                    </span>
                    <span 
                      className="block text-xs capitalize opacity-60"
                      style={{ color: theme.textSecondary }}
                    >
                      {palette.category}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Individual Color Pickers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {colorKeys.map((key) => (
          <motion.button
            key={key}
            className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl"
            style={{ backgroundColor: theme.background }}
            onClick={() => setActiveColorPicker(key)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 flex-shrink-0"
              style={{ 
                backgroundColor: theme[key],
                borderColor: theme.text + '20',
              }}
            />
            <div className="text-left min-w-0">
              <p 
                className="text-xs sm:text-sm font-medium truncate"
                style={{ color: theme.text }}
              >
                {colorLabels[key]}
              </p>
              <p 
                className="text-xs truncate"
                style={{ color: theme.textSecondary }}
              >
                {theme[key]}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
      
      {/* Color Picker Modal */}
      <AnimatePresence>
        {activeColorPicker && (
          <ColorPickerModal
            colorKey={activeColorPicker}
            isOpen={!!activeColorPicker}
            onClose={() => setActiveColorPicker(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
