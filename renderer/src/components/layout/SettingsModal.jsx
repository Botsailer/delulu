import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeStore } from '../../store';
import { ThemeCustomizer, BackgroundCustomizer, CustomCSSEditor } from '../settings';

const SettingsModal = ({ isOpen, onClose }) => {
  const { theme } = useThemeStore();
  const [activeTab, setActiveTab] = useState('theme');

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [onClose, isOpen]);

  const tabs = [
    { id: 'theme', label: 'Themes', icon: '🎨' },
    { id: 'background', label: 'Background', icon: '🖼️' },
    { id: 'css', label: 'Custom CSS', icon: '💅' },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />

      {/* Modal Container - proper centering */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-3xl max-h-[80vh] rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: theme.surface,
            border: `1px solid ${theme.textSecondary}30`,
            boxShadow: `0 25px 50px -12px rgba(0,0,0,0.5)`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4 border-b flex-shrink-0"
            style={{ borderColor: `${theme.textSecondary}20` }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">⚙️</span>
              <h2 className="text-xl font-bold" style={{ color: theme.text }}>
                Settings
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ color: theme.textSecondary }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div 
            className="flex items-center gap-1 p-3 border-b flex-shrink-0"
            style={{ borderColor: `${theme.textSecondary}20` }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  color: activeTab === tab.id ? theme.text : theme.textSecondary,
                  background: activeTab === tab.id ? `${theme.primary}25` : 'transparent',
                }}
              >
                <span className="flex items-center gap-2">
                  <span>{tab.icon}</span>
                  {tab.label}
                </span>
              </button>
            ))}
          </div>

          {/* Content - scrollable */}
          <div 
            className="flex-1 overflow-y-auto p-4"
            style={{ minHeight: 0 }}
          >
            {activeTab === 'theme' && <ThemeCustomizer />}
            {activeTab === 'background' && <BackgroundCustomizer />}
            {activeTab === 'css' && <CustomCSSEditor />}
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default SettingsModal;
