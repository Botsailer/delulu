import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeStore } from '../../store';

export default function NetworkIndicator() {
  const theme = useThemeStore((state) => state.theme);
  const [ping, setPing] = useState(null);
  const [status, setStatus] = useState('checking'); // checking, online, offline

  useEffect(() => {
    const checkConnection = async () => {
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        await fetch('https://www.google.com/favicon.ico', {
          mode: 'no-cors',
          cache: 'no-cache',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const latency = Date.now() - start;
        setPing(latency);
        setStatus('online');
      } catch (error) {
        setPing(null);
        setStatus('offline');
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000); // Check every 10s

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (status === 'offline') return '#ef4444';
    if (ping === null || ping > 500) return '#f59e0b';
    if (ping > 200) return '#10b981';
    return '#22c55e';
  };

  const getStatusText = () => {
    if (status === 'offline') return 'Offline';
    if (status === 'checking') return 'Checking...';
    if (ping === null) return 'Online';
    return `${ping}ms`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="fixed top-4 right-4 z-50"
      >
        <div 
          className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl shadow-lg border"
          style={{ 
            background: `${theme.surface}dd`,
            borderColor: `${theme.primary}40`
          }}
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-2 h-2 rounded-full"
            style={{ background: getStatusColor() }}
          />
          <span 
            className="text-sm font-medium"
            style={{ color: theme.text }}
          >
            {getStatusText()}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
