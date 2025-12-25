import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';

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
  const isOnline = useNetworkStatus();

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
      </div>
    </div>
  );
}

export default App;
