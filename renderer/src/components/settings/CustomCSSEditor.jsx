import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Store
import { useThemeStore } from '../../store';

export const CustomCSSEditor = () => {
  const { theme, customCSS, setCustomCSS, resetCustomCSS } = useThemeStore();
  const [localCSS, setLocalCSS] = useState(customCSS);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    setLocalCSS(customCSS);
  }, [customCSS]);
  
  useEffect(() => {
    setIsSaved(localCSS === customCSS);
  }, [localCSS, customCSS]);
  
  const validateCSS = (css) => {
    try {
      // Basic CSS validation - check for balanced braces
      const openBraces = (css.match(/{/g) || []).length;
      const closeBraces = (css.match(/}/g) || []).length;
      
      if (openBraces !== closeBraces) {
        return { valid: false, error: 'Unbalanced braces in CSS' };
      }
      
      return { valid: true };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  };
  
  const handleSave = () => {
    const validation = validateCSS(localCSS);
    
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    
    setError(null);
    setCustomCSS(localCSS);
    setIsSaved(true);
  };
  
  const handleHardReset = () => {
    resetCustomCSS();
    setLocalCSS('/* Add your custom CSS here */\n/* Example:\n.onboarding-container {\n  border-radius: 20px;\n}\n*/');
    setShowConfirmReset(false);
    setError(null);
  };

  // CSS code snippets for quick insertion
  const snippets = [
    {
      name: 'Rounded Corners',
      code: `.onboarding-container {
  border-radius: 24px;
  overflow: hidden;
}`,
    },
    {
      name: 'Glass Effect',
      code: `.settings-container {
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.1) !important;
}`,
    },
    {
      name: 'Neon Glow',
      code: `button {
  box-shadow: 0 0 20px currentColor;
  transition: box-shadow 0.3s ease;
}
button:hover {
  box-shadow: 0 0 40px currentColor;
}`,
    },
    {
      name: 'Smooth Animations',
      code: `* {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}`,
    },
  ];
  
  const insertSnippet = (code) => {
    setLocalCSS((prev) => prev + '\n\n' + code);
    setIsSaved(false);
  };

  return (
    <motion.div
      className="p-4 sm:p-6 rounded-2xl"
      style={{ backgroundColor: theme.surface }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h2 
            className="text-xl sm:text-2xl font-bold"
            style={{ color: theme.text }}
          >
            💻 Custom CSS
          </h2>
          <p 
            className="text-xs sm:text-sm mt-1"
            style={{ color: theme.textSecondary }}
          >
            Add your own styles to customize the app
          </p>
        </div>
        
        <div className="flex gap-2">
          {!isSaved && (
            <motion.span
              className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium"
              style={{ 
                backgroundColor: theme.accent + '20',
                color: theme.accent,
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              Unsaved
            </motion.span>
          )}
          
          <motion.button
            className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium"
            style={{ 
              backgroundColor: '#ef4444' + '20',
              color: '#ef4444',
            }}
            onClick={() => setShowConfirmReset(true)}
            whileHover={{ scale: 1.02, backgroundColor: '#ef4444' + '40' }}
            whileTap={{ scale: 0.98 }}
          >
            ⚠️ Hard Reset
          </motion.button>
        </div>
      </div>
      
      {/* Quick Snippets */}
      <div className="mb-4">
        <p 
          className="text-xs sm:text-sm font-medium mb-2"
          style={{ color: theme.textSecondary }}
        >
          Quick Snippets
        </p>
        <div className="flex flex-wrap gap-2">
          {snippets.map((snippet, i) => (
            <motion.button
              key={i}
              className="px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm"
              style={{ 
                backgroundColor: theme.background,
                color: theme.text,
              }}
              onClick={() => insertSnippet(snippet.code)}
              whileHover={{ scale: 1.05, backgroundColor: theme.primary + '30' }}
              whileTap={{ scale: 0.95 }}
            >
              + {snippet.name}
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="mb-4 p-3 rounded-lg text-xs sm:text-sm"
            style={{ 
              backgroundColor: '#ef4444' + '20',
              color: '#ef4444',
              border: `1px solid #ef4444`,
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            ⚠️ {error}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* CSS Editor */}
      <div className="relative mb-4">
        <textarea
          value={localCSS}
          onChange={(e) => {
            setLocalCSS(e.target.value);
            setError(null);
          }}
          className="w-full h-48 sm:h-64 p-3 sm:p-4 rounded-xl font-mono text-xs sm:text-sm resize-y"
          style={{ 
            backgroundColor: theme.background,
            color: theme.text,
            border: `1px solid ${error ? '#ef4444' : theme.text + '20'}`,
          }}
          placeholder="/* Enter your custom CSS here */"
          spellCheck={false}
        />
        
        {/* Line numbers indicator */}
        <div 
          className="absolute top-2 right-2 px-2 py-1 rounded text-xs"
          style={{ 
            backgroundColor: theme.surface,
            color: theme.textSecondary,
          }}
        >
          {localCSS.split('\n').length} lines
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-3">
        <motion.button
          className="flex-1 py-2 sm:py-3 rounded-xl font-medium text-sm sm:text-base"
          style={{ 
            backgroundColor: theme.background,
            color: theme.textSecondary,
          }}
          onClick={() => {
            setLocalCSS(customCSS);
            setError(null);
          }}
          disabled={isSaved}
          whileHover={!isSaved ? { scale: 1.02 } : {}}
          whileTap={!isSaved ? { scale: 0.98 } : {}}
        >
          Discard Changes
        </motion.button>
        
        <motion.button
          className="flex-1 py-2 sm:py-3 rounded-xl font-semibold text-sm sm:text-base"
          style={{ 
            backgroundColor: isSaved ? theme.primary + '50' : theme.primary,
            color: 'white',
          }}
          onClick={handleSave}
          disabled={isSaved}
          whileHover={!isSaved ? { scale: 1.02 } : {}}
          whileTap={!isSaved ? { scale: 0.98 } : {}}
        >
          {isSaved ? '✓ Saved' : 'Save Changes'}
        </motion.button>
      </div>
      
      {/* Hard Reset Confirmation Modal */}
      <AnimatePresence>
        {showConfirmReset && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirmReset(false)}
          >
            <motion.div
              className="p-4 sm:p-6 rounded-2xl w-full max-w-sm"
              style={{ backgroundColor: theme.surface }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 
                className="text-lg sm:text-xl font-bold mb-3"
                style={{ color: theme.text }}
              >
                ⚠️ Hard Reset CSS
              </h3>
              <p 
                className="mb-4 sm:mb-6 text-sm sm:text-base"
                style={{ color: theme.textSecondary }}
              >
                This will permanently delete all your custom CSS and restore defaults. 
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <motion.button
                  className="flex-1 py-2 rounded-lg font-medium text-sm sm:text-base"
                  style={{ 
                    backgroundColor: theme.background,
                    color: theme.textSecondary,
                  }}
                  onClick={() => setShowConfirmReset(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  className="flex-1 py-2 rounded-lg font-medium text-sm sm:text-base"
                  style={{ 
                    backgroundColor: '#ef4444',
                    color: 'white',
                  }}
                  onClick={handleHardReset}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Reset Everything
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
