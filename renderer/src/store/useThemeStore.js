import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Default theme configuration
const defaultTheme = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  accent: '#ec4899',
  background: '#0f0f23',
  surface: '#1a1a2e',
  text: '#ffffff',
  textSecondary: '#a1a1aa',
};

const defaultCustomCSS = `/* Add your custom CSS here */
/* Example:
.onboarding-container {
  border-radius: 20px;
}
*/`;

// Curated color palettes with themes
export const colorPalettes = [
  // Original themes
  {
    name: 'Midnight Purple',
    category: 'default',
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#ec4899',
      background: '#0f0f23',
      surface: '#1a1a2e',
    },
    backgroundImage: null,
  },
  {
    name: 'Ocean Breeze',
    category: 'default',
    colors: {
      primary: '#06b6d4',
      secondary: '#0ea5e9',
      accent: '#22d3d1',
      background: '#0c1222',
      surface: '#162032',
    },
    backgroundImage: null,
  },
  
  // Cyberpunk themes - Neon futuristic aesthetics
  {
    name: 'Cyberpunk Neon',
    category: 'cyberpunk',
    colors: {
      primary: '#ff00ff',
      secondary: '#00ffff',
      accent: '#ffff00',
      background: '#0d0d0d',
      surface: '#1a1a2e',
    },
    backgroundImage: 'linear-gradient(135deg, #0d0d0d 0%, #1a0a2e 50%, #0a1a2e 100%)',
  },
  {
    name: 'Night City',
    category: 'cyberpunk',
    colors: {
      primary: '#f706cf',
      secondary: '#03d8f3',
      accent: '#fcee0a',
      background: '#120318',
      surface: '#1f0a2e',
    },
    backgroundImage: 'radial-gradient(ellipse at bottom, #1f0a2e 0%, #120318 100%)',
  },
  {
    name: 'Blade Runner',
    category: 'cyberpunk',
    colors: {
      primary: '#ff6b35',
      secondary: '#f72585',
      accent: '#4cc9f0',
      background: '#10002b',
      surface: '#240046',
    },
    backgroundImage: 'linear-gradient(180deg, #10002b 0%, #240046 50%, #3c096c 100%)',
  },
  {
    name: 'Synthwave',
    category: 'cyberpunk',
    colors: {
      primary: '#ff6ec7',
      secondary: '#7b68ee',
      accent: '#00ced1',
      background: '#1a0533',
      surface: '#2d1b4e',
    },
    backgroundImage: 'linear-gradient(to bottom, #1a0533, #2d1b4e, #1a0533)',
  },
  
  // Anime themes - Japanese animation aesthetics
  {
    name: 'Pastel Dream',
    category: 'anime',
    colors: {
      primary: '#ffc8dd',
      secondary: '#bde0fe',
      accent: '#a2d2ff',
      background: '#1a1625',
      surface: '#2a2438',
    },
    backgroundImage: 'linear-gradient(135deg, #1a1625 0%, #2a2438 100%)',
  },
  {
    name: 'Studio Ghibli',
    category: 'anime',
    colors: {
      primary: '#87ceeb',
      secondary: '#98fb98',
      accent: '#f0e68c',
      background: '#1e2d3d',
      surface: '#2a3f54',
    },
    backgroundImage: 'linear-gradient(180deg, #1e2d3d 0%, #2a3f54 100%)',
  },
  {
    name: 'Sakura Blossom',
    category: 'anime',
    colors: {
      primary: '#ffb7c5',
      secondary: '#ff69b4',
      accent: '#ffc0cb',
      background: '#1a1520',
      surface: '#2d2535',
    },
    backgroundImage: 'radial-gradient(circle at 50% 0%, #3d2540 0%, #1a1520 70%)',
  },
  {
    name: 'Akira Red',
    category: 'anime',
    colors: {
      primary: '#e63946',
      secondary: '#f4a261',
      accent: '#2a9d8f',
      background: '#1d1d1d',
      surface: '#2d2d2d',
    },
    backgroundImage: 'linear-gradient(135deg, #1d1d1d 0%, #2d2d2d 100%)',
  },
  {
    name: 'Evangelion',
    category: 'anime',
    colors: {
      primary: '#9b59b6',
      secondary: '#2ecc71',
      accent: '#e74c3c',
      background: '#0a0a0f',
      surface: '#1a1a25',
    },
    backgroundImage: 'linear-gradient(180deg, #0a0a0f 0%, #1a1025 50%, #0a0f0a 100%)',
  },
  // Naruto Character Themes
  {
    name: 'Naruto Uzumaki',
    category: 'anime',
    colors: {
      primary: '#ff7b00',
      secondary: '#ffa500',
      accent: '#ffcc00',
      background: '#1a1008',
      surface: '#2d1a10',
    },
    backgroundImage: 'linear-gradient(135deg, #1a1008 0%, #3d2510 50%, #1a1008 100%)',
    characterGradient: 'linear-gradient(135deg, #ff7b00 0%, #ffa500 50%, #ffcc00 100%)',
  },
  {
    name: 'Sasuke Uchiha',
    category: 'anime',
    colors: {
      primary: '#3d0066',
      secondary: '#6600cc',
      accent: '#ff0000',
      background: '#0d0d1a',
      surface: '#1a1a2e',
    },
    backgroundImage: 'linear-gradient(180deg, #0d0d1a 0%, #1a0d2e 50%, #0d0d1a 100%)',
    characterGradient: 'linear-gradient(135deg, #3d0066 0%, #6600cc 50%, #ff0000 100%)',
  },
  {
    name: 'Itachi Uchiha',
    category: 'anime',
    colors: {
      primary: '#cc0000',
      secondary: '#800000',
      accent: '#ff3333',
      background: '#0d0808',
      surface: '#1a1010',
    },
    backgroundImage: 'radial-gradient(ellipse at top, #2d1010 0%, #0d0808 70%)',
    characterGradient: 'radial-gradient(circle, #cc0000 0%, #800000 50%, #330000 100%)',
  },
  {
    name: 'Kakashi Hatake',
    category: 'anime',
    colors: {
      primary: '#4a6fa5',
      secondary: '#7393b3',
      accent: '#e8e8e8',
      background: '#0f1419',
      surface: '#1c2833',
    },
    backgroundImage: 'linear-gradient(135deg, #0f1419 0%, #1c2833 100%)',
    characterGradient: 'linear-gradient(135deg, #4a6fa5 0%, #7393b3 50%, #e8e8e8 100%)',
  },
  {
    name: 'Sakura Haruno',
    category: 'anime',
    colors: {
      primary: '#ff69b4',
      secondary: '#ffb6c1',
      accent: '#98fb98',
      background: '#1a0f14',
      surface: '#2d1a22',
    },
    backgroundImage: 'linear-gradient(180deg, #1a0f14 0%, #2d1a22 100%)',
    characterGradient: 'linear-gradient(135deg, #ff69b4 0%, #ffb6c1 50%, #ffc0cb 100%)',
  },
  {
    name: 'Hinata Hyuga',
    category: 'anime',
    colors: {
      primary: '#e6e6fa',
      secondary: '#b0c4de',
      accent: '#dda0dd',
      background: '#0f0f1a',
      surface: '#1a1a2e',
    },
    backgroundImage: 'radial-gradient(circle at 30% 30%, #2a2040 0%, #0f0f1a 70%)',
    characterGradient: 'linear-gradient(135deg, #e6e6fa 0%, #b0c4de 50%, #dda0dd 100%)',
  },
  {
    name: 'Gaara',
    category: 'anime',
    colors: {
      primary: '#c2b280',
      secondary: '#a0522d',
      accent: '#dc143c',
      background: '#1a1610',
      surface: '#2d2820',
    },
    backgroundImage: 'linear-gradient(135deg, #1a1610 0%, #2d2510 50%, #1a1610 100%)',
    characterGradient: 'linear-gradient(135deg, #c2b280 0%, #a0522d 50%, #dc143c 100%)',
  },
  {
    name: 'Jiraiya',
    category: 'anime',
    colors: {
      primary: '#ff4500',
      secondary: '#228b22',
      accent: '#ffffff',
      background: '#0d1a0d',
      surface: '#1a2e1a',
    },
    backgroundImage: 'linear-gradient(180deg, #0d1a0d 0%, #1a2e1a 100%)',
    characterGradient: 'linear-gradient(135deg, #ff4500 0%, #228b22 100%)',
  },
  {
    name: 'Minato Namikaze',
    category: 'anime',
    colors: {
      primary: '#ffd700',
      secondary: '#4169e1',
      accent: '#ffffff',
      background: '#0a1628',
      surface: '#152238',
    },
    backgroundImage: 'linear-gradient(135deg, #0a1628 0%, #1a2838 50%, #0a1628 100%)',
    characterGradient: 'linear-gradient(135deg, #ffd700 0%, #4169e1 100%)',
  },
  {
    name: 'Akatsuki',
    category: 'anime',
    colors: {
      primary: '#cc0000',
      secondary: '#1a1a1a',
      accent: '#ffffff',
      background: '#0d0d0d',
      surface: '#1a1a1a',
    },
    backgroundImage: 'radial-gradient(ellipse at center, #2d0000 0%, #0d0d0d 70%)',
    characterGradient: 'repeating-linear-gradient(45deg, #cc0000, #cc0000 10px, #1a1a1a 10px, #1a1a1a 20px)',
  },
  
  // Matrix themes - Digital rain aesthetics
  {
    name: 'Matrix Green',
    category: 'matrix',
    colors: {
      primary: '#00ff41',
      secondary: '#008f11',
      accent: '#00ff41',
      background: '#0d0d0d',
      surface: '#0a1a0a',
    },
    backgroundImage: 'linear-gradient(180deg, #0d0d0d 0%, #0a1a0a 100%)',
  },
  {
    name: 'Digital Rain',
    category: 'matrix',
    colors: {
      primary: '#00ff00',
      secondary: '#003b00',
      accent: '#39ff14',
      background: '#000000',
      surface: '#001100',
    },
    backgroundImage: 'radial-gradient(ellipse at center, #001a00 0%, #000000 100%)',
  },
  {
    name: 'Neo Terminal',
    category: 'matrix',
    colors: {
      primary: '#20c20e',
      secondary: '#0abdc6',
      accent: '#ea00d9',
      background: '#091833',
      surface: '#0d2137',
    },
    backgroundImage: 'linear-gradient(135deg, #091833 0%, #0d2137 100%)',
  },
  {
    name: 'Hacker Mode',
    category: 'matrix',
    colors: {
      primary: '#0f0',
      secondary: '#0a0',
      accent: '#0ff',
      background: '#000',
      surface: '#111',
    },
    backgroundImage: null,
  },
  
  // Additional themes
  {
    name: 'Sunset Vibes',
    category: 'default',
    colors: {
      primary: '#f97316',
      secondary: '#fb923c',
      accent: '#fbbf24',
      background: '#1c1917',
      surface: '#292524',
    },
    backgroundImage: 'linear-gradient(135deg, #1c1917 0%, #292524 100%)',
  },
  {
    name: 'Forest Green',
    category: 'default',
    colors: {
      primary: '#22c55e',
      secondary: '#10b981',
      accent: '#84cc16',
      background: '#0f1a0f',
      surface: '#1a2e1a',
    },
    backgroundImage: null,
  },
  {
    name: 'Rose Gold',
    category: 'default',
    colors: {
      primary: '#f43f5e',
      secondary: '#e11d48',
      accent: '#fb7185',
      background: '#1a0f14',
      surface: '#2e1a22',
    },
    backgroundImage: null,
  },
  {
    name: 'Arctic Ice',
    category: 'default',
    colors: {
      primary: '#38bdf8',
      secondary: '#7dd3fc',
      accent: '#e0f2fe',
      background: '#0c1929',
      surface: '#1e3a5f',
    },
    backgroundImage: null,
  },
];

// Get palettes by category
export const getPalettesByCategory = (category) => {
  if (category === 'all') return colorPalettes;
  return colorPalettes.filter((p) => p.category === category);
};

// Get all categories
export const getCategories = () => {
  const categories = [...new Set(colorPalettes.map((p) => p.category))];
  return ['all', ...categories];
};

// Zustand store
export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: defaultTheme,
      customCSS: defaultCustomCSS,
      backgroundImage: null,
      hasCompletedOnboarding: false,
      currentStep: 0,

      // Theme actions
      setThemeColor: (key, value) =>
        set((state) => ({
          theme: { ...state.theme, [key]: value },
        })),

      setTheme: (newTheme) => set({ theme: { ...defaultTheme, ...newTheme } }),

      applyPalette: (palette) =>
        set({
          theme: { ...get().theme, ...palette.colors },
          backgroundImage: palette.backgroundImage || get().backgroundImage,
        }),

      resetTheme: () => set({ theme: defaultTheme }),

      // Custom CSS actions
      setCustomCSS: (css) => set({ customCSS: css }),

      resetCustomCSS: () => set({ customCSS: defaultCustomCSS }),

      // Background image actions
      setBackgroundImage: (imageUrl) => set({ backgroundImage: imageUrl }),

      removeBackgroundImage: () => set({ backgroundImage: null }),

      // Onboarding actions
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      resetOnboarding: () => set({ hasCompletedOnboarding: false, currentStep: 0 }),

      setCurrentStep: (step) => set({ currentStep: step }),

      nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),

      prevStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),

      // Hard reset everything
      hardReset: () =>
        set({
          theme: defaultTheme,
          customCSS: defaultCustomCSS,
          backgroundImage: null,
          hasCompletedOnboarding: false,
          currentStep: 0,
        }),
    }),
    {
      name: 'delulu-theme-storage',
    }
  )
);
