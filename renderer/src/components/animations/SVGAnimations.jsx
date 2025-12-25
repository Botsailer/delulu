import { motion } from 'motion/react';

// Water droplet morphing into music player animation
export const WaterToMusicAnimation = ({ color = '#6366f1' }) => {
  return (
    <div className="w-full h-64 flex items-center justify-center">
      <svg viewBox="0 0 200 200" className="w-48 h-48 md:w-64 md:h-64">
        {/* Water droplet morphing to music player */}
        <motion.path
          initial={{
            d: "M100 20 C100 20 140 60 140 100 C140 140 120 160 100 180 C80 160 60 140 60 100 C60 60 100 20 100 20",
            fill: `${color}40`,
          }}
          animate={{
            d: [
              "M100 20 C100 20 140 60 140 100 C140 140 120 160 100 180 C80 160 60 140 60 100 C60 60 100 20 100 20",
              "M40 50 L160 50 L160 150 L40 150 Z",
              "M30 40 L170 40 L170 160 L30 160 Z",
            ],
            fill: [`${color}40`, `${color}60`, `${color}80`],
          }}
          transition={{
            duration: 3,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
          }}
          stroke={color}
          strokeWidth="2"
        />
        
        {/* Play button that appears */}
        <motion.path
          d="M85 70 L85 130 L130 100 Z"
          fill="white"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 0, 1, 1],
            scale: [0, 0, 1, 1],
          }}
          transition={{
            duration: 3,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        
        {/* Sound waves */}
        {[0, 1, 2].map((i) => (
          <motion.circle
            key={i}
            cx="100"
            cy="100"
            r={60 + i * 20}
            fill="none"
            stroke={color}
            strokeWidth="1"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: [0, 0, 0.5, 0],
              scale: [0.8, 0.8, 1.2, 1.5],
            }}
            transition={{
              duration: 3,
              ease: "easeOut",
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </svg>
    </div>
  );
};

// Flowing music visualization
export const MusicVisualization = ({ color = '#8b5cf6' }) => {
  const bars = 12;
  
  return (
    <div className="w-full h-64 flex items-center justify-center">
      <div className="flex items-end gap-1 md:gap-2 h-32">
        {Array.from({ length: bars }).map((_, i) => (
          <motion.div
            key={i}
            className="w-3 md:w-4 rounded-full"
            style={{ backgroundColor: color }}
            initial={{ height: 20 }}
            animate={{
              height: [20, 60 + Math.random() * 60, 30, 80 + Math.random() * 40, 20],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Floating entertainment icons
export const FloatingIcons = ({ color = '#ec4899' }) => {
  const icons = [
    { path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z", x: -60, y: -40 }, // Checkmark circle
    { path: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z", x: 60, y: -30 }, // Music note
    { path: "M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z", x: -50, y: 50 }, // TV
    { path: "M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z", x: 70, y: 40 }, // Movie
    { path: "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z", x: 0, y: -60 }, // Clock
  ];

  return (
    <div className="w-full h-64 flex items-center justify-center relative">
      <svg viewBox="-100 -100 200 200" className="w-64 h-64 md:w-80 md:h-80">
        {icons.map((icon, i) => (
          <motion.g
            key={i}
            initial={{ x: icon.x, y: icon.y, opacity: 0 }}
            animate={{
              y: [icon.y, icon.y - 15, icon.y],
              opacity: 1,
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          >
            <motion.path
              d={icon.path}
              fill={color}
              transform={`translate(${icon.x - 12}, ${icon.y - 12})`}
            />
          </motion.g>
        ))}
        
        {/* Central glow */}
        <motion.circle
          cx="0"
          cy="0"
          r="25"
          fill={`${color}30`}
          animate={{
            r: [25, 35, 25],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </svg>
    </div>
  );
};

// Pulsing gradient orb
export const GradientOrb = ({ primaryColor = '#6366f1', secondaryColor = '#ec4899' }) => {
  return (
    <div className="w-full h-64 flex items-center justify-center">
      <motion.div
        className="w-40 h-40 md:w-56 md:h-56 rounded-full relative"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${primaryColor}, ${secondaryColor})`,
          boxShadow: `0 0 60px ${primaryColor}50, 0 0 120px ${secondaryColor}30`,
        }}
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {/* Inner glow rings */}
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: `${primaryColor}40` }}
            animate={{
              scale: [1, 1.5 + i * 0.2],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeOut",
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

// Sparkle effect component
export const Sparkles = ({ color = '#fbbf24', count = 20 }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            backgroundColor: color,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};
