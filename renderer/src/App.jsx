import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';

// Store
import { useThemeStore, useNavigationStore } from './store';

// Hooks
import { useNetworkStatus } from './hooks/useNetworkStatus';

// Components
import { 
  OnboardingScreens, 
  Navbar, 
  SettingsModal,
  HomeScreen,
  AnimeScreen,
  MangaScreen,
} from './components';
import OfflinePage from './components/layout/OfflinePage';
import NetworkIndicator from './components/layout/NetworkIndicator';

// Styles
import './App.css';

// Uninstall Confirmation Modal
const UninstallModal = ({ onClose, onConfirm }) => {
  const { theme } = useThemeStore();
  const [countdown, setCountdown] = useState(5);
  
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md p-6 rounded-2xl shadow-2xl border border-white/10"
        style={{ background: theme.surface }}
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: theme.text }}>Uninstall Delulu?</h2>
          <p className="text-sm opacity-70" style={{ color: theme.text }}>
            This will remove the application from your system. This action cannot be undone.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-medium transition-colors hover:bg-white/10"
            style={{ color: theme.text }}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            disabled={countdown > 0}
            className="flex-1 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              background: countdown > 0 ? theme.surface : '#ef4444', 
              color: countdown > 0 ? theme.text : '#fff',
              border: countdown > 0 ? '1px solid rgba(255,255,255,0.1)' : 'none'
            }}
          >
            {countdown > 0 ? `Wait ${countdown}s` : 'Uninstall'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Tab configuration - easily extendable
const TABS = [
  { id: 'home', label: 'Home', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg> },
  { id: 'anime', label: 'Anime', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" /></svg> },
  { id: 'manga', label: 'Manga', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg> },
];

function App() {
  const { hasCompletedOnboarding, theme, customCSS, backgroundImage, completeOnboarding } = useThemeStore();
  const { activeTab, setActiveTab } = useNavigationStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [uninstallOpen, setUninstallOpen] = useState(false);
  const isOnline = useNetworkStatus();

  // Listen for uninstall request from main process
  useEffect(() => {
    if (window.electronAPI?.system?.onUninstallRequest) {
      const cleanup = window.electronAPI.system.onUninstallRequest(() => {
        setUninstallOpen(true);
      });
      return () => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      };
    }
  }, []);

  const handleUninstallConfirm = () => {
    if (window.electronAPI?.system?.confirmUninstall) {
      window.electronAPI.system.confirmUninstall();
    }
    setUninstallOpen(false);
  };

  // Check if onboarding was completed before (fallback check)
  useEffect(() => {
    const stored = localStorage.getItem('delulu-theme-storage');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.state?.hasCompletedOnboarding && !hasCompletedOnboarding) {
          completeOnboarding();
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);
  
  // Apply custom CSS
  useEffect(() => {
    const styleId = 'custom-user-css';
    let styleElement = document.getElementById(styleId);
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = customCSS;
    
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, [customCSS]);
  
  // Apply CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-secondary', theme.secondary);
    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--color-background', theme.background);
    root.style.setProperty('--color-surface', theme.surface);
    root.style.setProperty('--color-text', theme.text);
    root.style.setProperty('--color-text-secondary', theme.textSecondary);
  }, [theme]);

  // Render active screen
  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen key="home" />;
      case 'anime':
        return <AnimeScreen key="anime" />;
      case 'manga':
        return <MangaScreen key="manga" />;
      default:
        return <HomeScreen key="home" />;
    }
  };

  // Show onboarding only if not completed
  if (!hasCompletedOnboarding) {
    return (
      <div 
        className="app-container min-h-screen w-full"
        style={{ backgroundColor: theme.background, color: theme.text }}
      >
        <OnboardingScreens />
      </div>
    );
  }

  // Show offline page if no internet
  if (!isOnline) {
    return <OfflinePage />;
  }

  // Main app
  return (
    <div 
      className="app-container min-h-screen w-full relative overflow-x-hidden"
      style={{
        backgroundColor: theme.background,
        color: theme.text,
      }}
    >
      {/* Background layer */}
      {backgroundImage && (
        <div 
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            background: backgroundImage.startsWith('linear') || backgroundImage.startsWith('radial')
              ? backgroundImage
              : `url(${backgroundImage}) center/cover no-repeat fixed`,
            opacity: 0.2,
          }}
        />
      )}
      
      {/* Main content */}
      <div className="relative z-10">
        {/* Network status indicator */}
        <NetworkIndicator />

        {/* Navbar */}
        <Navbar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={TABS}
          onSettingsClick={() => setSettingsOpen(true)}
        />

        {/* Screen content */}
        <AnimatePresence mode="wait">
          {renderScreen()}
        </AnimatePresence>

        {/* Settings modal - only when user clicks */}
        <SettingsModal 
          isOpen={settingsOpen} 
          onClose={() => setSettingsOpen(false)} 
        />
        
        {/* Uninstall Confirmation Modal */}
        {uninstallOpen && (
          <UninstallModal 
            onClose={() => setUninstallOpen(false)} 
            onConfirm={handleUninstallConfirm} 
          />
        )}
      </div>
    </div>
  );
}

export default App;
