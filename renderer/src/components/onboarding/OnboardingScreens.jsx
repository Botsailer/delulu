import { motion, AnimatePresence } from 'motion/react';

// Store
import { useThemeStore } from '../../store';

// Animation components
import { 
  WaterToMusicAnimation, 
  MusicVisualization, 
  FloatingIcons,
  Sparkles 
} from '../animations';

const OnboardingScreen1 = ({ theme }) => (
  <motion.div
    className="flex flex-col items-center justify-center h-full px-4 sm:px-8 text-center"
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -50 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
  >
    <Sparkles color={theme.accent} count={15} />
    
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <WaterToMusicAnimation color={theme.primary} />
    </motion.div>
    
    <motion.h1
      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-clip-text text-transparent"
      style={{
        backgroundImage: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      Welcome to Delulu
    </motion.h1>
    
    <motion.p
      className="text-base sm:text-lg md:text-xl max-w-md sm:max-w-lg md:max-w-2xl mx-auto leading-relaxed"
      style={{ color: theme.textSecondary }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
    >
      Your gateway to endless entertainment. Experience movies, music, and moments 
      like never before — all in one beautifully crafted space.
    </motion.p>
    
    <motion.div
      className="mt-6 sm:mt-8 flex gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
    >
      {[theme.primary, theme.secondary, theme.accent].map((color, i) => (
        <motion.div
          key={i}
          className="w-2 h-2 sm:w-3 sm:h-3 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </motion.div>
  </motion.div>
);

const OnboardingScreen2 = ({ theme }) => (
  <motion.div
    className="flex flex-col items-center justify-center h-full px-4 sm:px-8 text-center"
    initial={{ opacity: 0, x: 100 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -100 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
  >
    <Sparkles color={theme.secondary} count={15} />
    
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <MusicVisualization color={theme.secondary} />
    </motion.div>
    
    <motion.h2
      className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6"
      style={{ color: theme.text }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      Why Entertainment Matters
    </motion.h2>
    
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto mt-4 sm:mt-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
    >
      {[
        { 
          icon: "🧠", 
          title: "Mental Wellness", 
          desc: "Reduces stress and boosts mood through immersive experiences" 
        },
        { 
          icon: "🤝", 
          title: "Connection", 
          desc: "Brings people together through shared stories and experiences" 
        },
        { 
          icon: "✨", 
          title: "Creativity", 
          desc: "Inspires imagination and fuels creative thinking" 
        },
      ].map((item, i) => (
        <motion.div
          key={i}
          className="p-4 sm:p-6 rounded-2xl backdrop-blur-sm"
          style={{ 
            backgroundColor: `${theme.surface}90`,
            border: `1px solid ${theme.primary}30`,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 + i * 0.15, duration: 0.4 }}
          whileHover={{ 
            scale: 1.05, 
            borderColor: theme.primary,
            transition: { duration: 0.2 }
          }}
        >
          <span className="text-3xl sm:text-4xl mb-2 sm:mb-3 block">{item.icon}</span>
          <h3 
            className="text-lg sm:text-xl font-semibold mb-2" 
            style={{ color: theme.primary }}
          >
            {item.title}
          </h3>
          <p 
            className="text-sm sm:text-base" 
            style={{ color: theme.textSecondary }}
          >
            {item.desc}
          </p>
        </motion.div>
      ))}
    </motion.div>
  </motion.div>
);

const OnboardingScreen3 = ({ theme }) => (
  <motion.div
    className="flex flex-col items-center justify-center h-full px-4 sm:px-8 text-center"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.1 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
  >
    <Sparkles color={theme.accent} count={25} />
    
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <FloatingIcons color={theme.accent} />
    </motion.div>
    
    <motion.h2
      className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6"
      style={{ color: theme.text }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      Ready to Begin?
    </motion.h2>
    
    <motion.p
      className="text-base sm:text-lg md:text-xl max-w-md sm:max-w-lg mx-auto mb-6 sm:mb-8"
      style={{ color: theme.textSecondary }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
    >
      Customize your experience, set your preferences, and dive into 
      a world of unlimited entertainment.
    </motion.p>
    
    <motion.div
      className="flex flex-col sm:flex-row gap-3 sm:gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.5 }}
    >
      <motion.div
        className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full"
        style={{ 
          backgroundColor: `${theme.primary}20`,
          border: `1px solid ${theme.primary}`,
        }}
        whileHover={{ scale: 1.05 }}
      >
        <span className="text-lg sm:text-xl">🎬</span>
        <span style={{ color: theme.text }} className="text-sm sm:text-base">Movies</span>
      </motion.div>
      
      <motion.div
        className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full"
        style={{ 
          backgroundColor: `${theme.secondary}20`,
          border: `1px solid ${theme.secondary}`,
        }}
        whileHover={{ scale: 1.05 }}
      >
        <span className="text-lg sm:text-xl">🎵</span>
        <span style={{ color: theme.text }} className="text-sm sm:text-base">Music</span>
      </motion.div>
      
      <motion.div
        className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full"
        style={{ 
          backgroundColor: `${theme.accent}20`,
          border: `1px solid ${theme.accent}`,
        }}
        whileHover={{ scale: 1.05 }}
      >
        <span className="text-lg sm:text-xl">📺</span>
        <span style={{ color: theme.text }} className="text-sm sm:text-base">Shows</span>
      </motion.div>
    </motion.div>
  </motion.div>
);

const screens = [OnboardingScreen1, OnboardingScreen2, OnboardingScreen3];

export const OnboardingScreens = () => {
  const { 
    theme, 
    currentStep, 
    nextStep, 
    prevStep, 
    setCurrentStep,
    completeOnboarding 
  } = useThemeStore();
  
  const CurrentScreen = screens[currentStep];
  
  const handleNext = () => {
    if (currentStep < screens.length - 1) {
      nextStep();
    } else {
      completeOnboarding();
    }
  };
  
  const handlePrev = () => {
    if (currentStep > 0) {
      prevStep();
    }
  };

  return (
    <div 
      className="onboarding-container relative w-full h-screen overflow-hidden"
      style={{ backgroundColor: theme.background }}
    >
      {/* Background gradient effects */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at 20% 80%, ${theme.primary}40, transparent 40%),
                       radial-gradient(circle at 80% 20%, ${theme.secondary}40, transparent 40%),
                       radial-gradient(circle at 50% 50%, ${theme.accent}20, transparent 60%)`,
        }}
      />
      
      {/* Main content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Screen content */}
        <div className="flex-1 flex items-center justify-center overflow-auto py-8 sm:py-12">
          <AnimatePresence mode="wait">
            <CurrentScreen key={currentStep} theme={theme} />
          </AnimatePresence>
        </div>
        
        {/* Navigation */}
        <div className="p-4 sm:p-6 md:p-8">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            {screens.map((_, i) => (
              <motion.button
                key={i}
                className="w-2 h-2 sm:w-3 sm:h-3 rounded-full cursor-pointer transition-colors"
                style={{
                  backgroundColor: i === currentStep ? theme.primary : `${theme.text}30`,
                }}
                onClick={() => setCurrentStep(i)}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.9 }}
                animate={{
                  scale: i === currentStep ? 1.2 : 1,
                }}
              />
            ))}
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-between items-center max-w-md mx-auto">
            <motion.button
              className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium text-sm sm:text-base"
              style={{
                color: theme.textSecondary,
                visibility: currentStep === 0 ? 'hidden' : 'visible',
              }}
              onClick={handlePrev}
              whileHover={{ scale: 1.05, color: theme.text }}
              whileTap={{ scale: 0.95 }}
            >
              ← Back
            </motion.button>
            
            <motion.button
              className="px-6 sm:px-8 py-2 sm:py-3 rounded-xl font-semibold text-sm sm:text-base"
              style={{
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                color: 'white',
                boxShadow: `0 4px 20px ${theme.primary}50`,
              }}
              onClick={handleNext}
              whileHover={{ scale: 1.05, boxShadow: `0 6px 30px ${theme.primary}70` }}
              whileTap={{ scale: 0.95 }}
            >
              {currentStep === screens.length - 1 ? "Get Started →" : "Next →"}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};
