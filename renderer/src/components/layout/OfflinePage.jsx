import { motion } from 'motion/react';
import { useThemeStore } from '../../store';

export default function OfflinePage() {
  const theme = useThemeStore((state) => state.theme);

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-8"
      style={{ background: theme.background }}
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div 
          className="w-32 h-32 mx-auto mb-8 rounded-full flex items-center justify-center"
          style={{ background: `${theme.primary}20` }}
        >
          <svg 
            className="w-16 h-16"
            style={{ color: theme.primary }}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" 
            />
          </svg>
        </div>
        
        <h1 
          className="text-3xl font-bold mb-4"
          style={{ color: theme.text }}
        >
          No Internet Connection
        </h1>
        
        <p 
          className="text-lg mb-8 opacity-70"
          style={{ color: theme.text }}
        >
          Please check your network connection and try again.
        </p>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.reload()}
          className="px-8 py-3 rounded-xl font-semibold"
          style={{ 
            background: theme.primary,
            color: '#fff'
          }}
        >
          Retry Connection
        </motion.button>
      </motion.div>
    </div>
  );
}
