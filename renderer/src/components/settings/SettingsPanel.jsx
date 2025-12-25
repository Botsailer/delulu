import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Store
import { useThemeStore } from '../../store';

// Settings components
import { ThemeCustomizer } from './ThemeCustomizer';
import { BackgroundCustomizer } from './BackgroundCustomizer';
import { CustomCSSEditor } from './CustomCSSEditor';

export const SettingsPanel = () => {
  const { theme, hardReset, resetOnboarding } = useThemeStore();
  const [activeTab, setActiveTab] = useState('theme');
  const [showHardResetConfirm, setShowHardResetConfirm] = useState(false);
  
  const tabs = [
    { id: 'theme', label: '🎨 Theme', icon: '🎨' },
    { id: 'background', label: '🖼️ Background', icon: '🖼️' },
    { id: 'css', label: '💻 CSS', icon: '💻' },
  ];

  return (
    <motion.div
      className="settings-container min-h-screen p-4 sm:p-6 md:p-8"
      style={{ backgroundColor: theme.background }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <motion.h1
              className="text-2xl sm:text-3xl md:text-4xl font-bold"
              style={{ color: theme.text }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              ⚙️ Settings
            </motion.h1>
            <p 
              className="text-sm sm:text-base mt-1"
              style={{ color: theme.textSecondary }}
            >
              Customize your experience
            </p>
          </div>
          
          <div className="flex gap-2 sm:gap-3">
            <motion.button
              className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium"
              style={{ 
                backgroundColor: theme.surface,
                color: theme.textSecondary,
              }}
              onClick={() => resetOnboarding()}
              whileHover={{ scale: 1.02, color: theme.text }}
              whileTap={{ scale: 0.98 }}
            >
              Replay Onboarding
            </motion.button>
            
            <motion.button
              className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium"
              style={{ 
                backgroundColor: '#ef4444' + '20',
                color: '#ef4444',
              }}
              onClick={() => setShowHardResetConfirm(true)}
              whileHover={{ scale: 1.02, backgroundColor: '#ef4444' + '40' }}
              whileTap={{ scale: 0.98 }}
            >
              Reset All
            </motion.button>
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="max-w-4xl mx-auto mb-4 sm:mb-6">
        <div 
          className="flex rounded-xl p-1 overflow-x-auto"
          style={{ backgroundColor: theme.surface }}
        >
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              className="flex-1 min-w-max px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap"
              style={{
                backgroundColor: activeTab === tab.id ? theme.primary : 'transparent',
                color: activeTab === tab.id ? 'white' : theme.textSecondary,
              }}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.icon} {tab.label.split(' ')[1]}</span>
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'theme' && (
            <motion.div
              key="theme"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <ThemeCustomizer />
            </motion.div>
          )}
          
          {activeTab === 'background' && (
            <motion.div
              key="background"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <BackgroundCustomizer />
            </motion.div>
          )}
          
          {activeTab === 'css' && (
            <motion.div
              key="css"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <CustomCSSEditor />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Hard Reset Confirmation */}
      <AnimatePresence>
        {showHardResetConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHardResetConfirm(false)}
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
                🔄 Reset Everything?
              </h3>
              <p 
                className="mb-4 sm:mb-6 text-sm sm:text-base"
                style={{ color: theme.textSecondary }}
              >
                This will reset all settings including theme colors, background, 
                custom CSS, and replay the onboarding. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <motion.button
                  className="flex-1 py-2 rounded-lg font-medium text-sm sm:text-base"
                  style={{ 
                    backgroundColor: theme.background,
                    color: theme.textSecondary,
                  }}
                  onClick={() => setShowHardResetConfirm(false)}
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
                  onClick={() => {
                    hardReset();
                    setShowHardResetConfirm(false);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Reset All
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
