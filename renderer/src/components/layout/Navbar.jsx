import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeStore } from '../../store';

const Navbar = ({ activeTab, setActiveTab, tabs, onSettingsClick }) => {
  const { theme } = useThemeStore();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled 
          ? `${theme.background}ee` 
          : `linear-gradient(to bottom, ${theme.background}dd, transparent)`,
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
      }}
    >
      <div className="flex items-center justify-between px-8 py-4">
        {/* Logo */}
        <motion.div 
          className="flex items-center gap-4"
          whileHover={{ scale: 1.02 }}
        >
          <span 
            className="text-3xl font-black tracking-tight"
            style={{ 
              color: theme.primary,
            }}
          >
            DELULU
          </span>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative px-5 py-2 rounded-full font-medium text-sm transition-colors"
              style={{
                color: activeTab === tab.id ? theme.text : theme.textSecondary,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-full"
                  style={{ 
                    background: `linear-gradient(135deg, ${theme.primary}40, ${theme.accent}40)`,
                    border: `1px solid ${theme.primary}60`,
                  }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {tab.icon}
                {tab.label}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Right Section - Search & Settings */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <AnimatePresence>
              {searchOpen && (
                <motion.input
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 250, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  type="text"
                  placeholder="Search anime, movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="absolute right-10 top-1/2 -translate-y-1/2 h-10 px-4 rounded-full text-sm outline-none"
                  style={{
                    background: `${theme.surface}`,
                    border: `1px solid ${theme.primary}40`,
                    color: theme.text,
                  }}
                  autoFocus
                />
              )}
            </AnimatePresence>
            <motion.button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2.5 rounded-full transition-colors"
              style={{ 
                background: searchOpen ? `${theme.primary}20` : 'transparent',
                color: theme.text 
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </motion.button>
          </div>

          {/* Settings Button */}
          <motion.button
            onClick={onSettingsClick}
            className="p-2.5 rounded-full transition-colors"
            style={{ color: theme.text }}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </motion.button>

          {/* Profile Avatar */}
          <motion.div
            className="w-9 h-9 rounded-full cursor-pointer overflow-hidden"
            style={{ 
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
              U
            </div>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
