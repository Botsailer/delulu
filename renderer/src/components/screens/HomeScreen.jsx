import { motion } from 'motion/react';
import { useThemeStore, useNavigationStore } from '../../store';
import { HeroBanner, ContentRow } from '../layout';
import { 
  useAnimeSpotlight,
  useTopAiring, 
  useMostPopularAnime, 
  useRecentlyUpdatedAnime 
} from '../../hooks/useAnimeStreaming';
import { usePopularManga, useTrendingManga } from '../../hooks/useManga';

// Transform streaming anime data to our card format
const transformStreamingAnimeData = (data) => {
  if (!data?.results) return [];
  return data.results.slice(0, 15).map(item => ({
    id: item.id,
    title: item.title,
    image: item.image,
    rating: item.rating || item.score || 0,
    year: item.releaseDate || 'N/A',
    genre: item.genres?.[0] || 'Anime',
    episodes: item.totalEpisodes || item.episodes,
    synopsis: item.description,
    status: item.status,
    type: 'anime',
    subOrDub: item.subOrDub,
    sub: item.sub,
    dub: item.dub,
  }));
};

// Transform Consumet manga data to our card format
const transformMangaData = (data) => {
  if (!data?.results) return [];
  return data.results.map(item => ({
    id: item.id,
    title: item.title,
    image: item.image,
    rating: item.rating || 0,
    year: item.releaseDate || 'N/A',
    genre: item.genres?.[0] || 'Manga',
    status: item.status,
    type: 'manga',
  }));
};

// Loading skeleton component
const LoadingSkeleton = ({ count = 10 }) => {
  const { theme } = useThemeStore();
  return (
    <div className="flex gap-3 overflow-hidden px-4 sm:px-6 md:px-8">
      {Array(count).fill(0).map((_, i) => (
        <div 
          key={i} 
          className="flex-shrink-0 w-28 sm:w-32 md:w-36 lg:w-40 aspect-[2/3] rounded-xl animate-pulse"
          style={{ background: theme.surface }}
        />
      ))}
    </div>
  );
};

// Error display component - shows loading skeleton on error
const ErrorMessage = () => {
  const { theme } = useThemeStore();
  return (
    <div className="flex gap-3 overflow-hidden px-4 sm:px-6 md:px-8">
      {Array(10).fill(0).map((_, i) => (
        <div 
          key={i} 
          className="flex-shrink-0 w-28 sm:w-32 md:w-36 lg:w-40 aspect-[2/3] rounded-xl animate-pulse"
          style={{ background: theme.surface }}
        />
      ))}
    </div>
  );
};

const HomeScreen = () => {
  const { theme } = useThemeStore();
  const { navigateToAnime, navigateToManga } = useNavigationStore();

  // Default provider for home screen (Hianime = p1 - has all features)
  const defaultProvider = 'p1';

  // Fetch anime data from streaming providers
  const { data: topAiringData, loading: topAiringLoading, error: topAiringError } = useTopAiring(defaultProvider, 1);
  const { data: popularData, loading: popularLoading, error: popularError } = useMostPopularAnime(defaultProvider, 1);
  const { data: recentlyUpdatedData, loading: recentlyUpdatedLoading, error: recentlyUpdatedError } = useRecentlyUpdatedAnime(defaultProvider, 1);
  
  // Fetch manga data
  const { data: popularMangaData, loading: topMangaLoading, error: topMangaError } = usePopularManga(1, 15);
  const { data: trendingMangaData, loading: trendingMangaLoading, error: trendingMangaError } = useTrendingManga(1, 15);

  // Transform API responses
  const topAiringAnime = transformStreamingAnimeData(topAiringData);
  const popularAnime = transformStreamingAnimeData(popularData);
  const recentlyUpdated = transformStreamingAnimeData(recentlyUpdatedData);
  const topManga = transformMangaData(popularMangaData);
  const trendingManga = transformMangaData(trendingMangaData);

  // Handle clicking on cards - navigate with the selected item
  const handleAnimeClick = (item) => {
    // Pass the item to navigate and open its info modal
    navigateToAnime(item, defaultProvider);
  };

  const handleMangaClick = (item) => {
    // Pass the item to navigate and open its info modal
    navigateToManga(item);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
      style={{ background: theme.background }}
    >
      {/* Hero */}
      <HeroBanner />

      {/* Content Rows with real API data */}
      <div className="relative z-10">
        {/* Top Airing Anime */}
        <div className="mb-2">
          <h2 className="text-base sm:text-lg font-bold mb-3 px-4 sm:px-6 md:px-8" style={{ color: theme.text }}>
            🔥 Top Airing Anime
          </h2>
          {topAiringLoading ? (
            <LoadingSkeleton />
          ) : topAiringError ? (
            <ErrorMessage />
          ) : (
            <ContentRow items={topAiringAnime} onClick={handleAnimeClick} />
          )}
        </div>

           {/* Popular Manga */}
        <div className="mb-2">
          <h2 className="text-base sm:text-lg font-bold mb-3 px-4 sm:px-6 md:px-8" style={{ color: theme.text }}>
            📚 Popular Manga
          </h2>
          {topMangaLoading ? (
            <LoadingSkeleton />
          ) : topMangaError ? (
            <ErrorMessage />
          ) : (
            <ContentRow items={topManga} onClick={handleMangaClick} />
          )}
        </div>

        {/* Most Popular Anime */}
        <div className="mb-2">
          <h2 className="text-base sm:text-lg font-bold mb-3 px-4 sm:px-6 md:px-8" style={{ color: theme.text }}>
            ⭐ Most Popular Anime
          </h2>
          {popularLoading ? (
            <LoadingSkeleton />
          ) : popularError ? (
            <ErrorMessage />
          ) : (
            <ContentRow items={popularAnime} onClick={handleAnimeClick} />
          )}
        </div>

          {/* Trending Manga */}
        <div className="mb-2">
          <h2 className="text-base sm:text-lg font-bold mb-3 px-4 sm:px-6 md:px-8" style={{ color: theme.text }}>
            📖 Trending Manga
          </h2>
          {trendingMangaLoading ? (
            <LoadingSkeleton />
          ) : trendingMangaError ? (
            <ErrorMessage />
          ) : (
            <ContentRow items={trendingManga} onClick={handleMangaClick} />
          )}
        </div>

        {/* Recently Updated */}
        <div className="mb-2">
          <h2 className="text-base sm:text-lg font-bold mb-3 px-4 sm:px-6 md:px-8" style={{ color: theme.text }}>
            ✨ Recently Updated
          </h2>
          {recentlyUpdatedLoading ? (
            <LoadingSkeleton />
          ) : recentlyUpdatedError ? (
            <ErrorMessage />
          ) : (
            <ContentRow items={recentlyUpdated} onClick={handleAnimeClick} />
          )}
        </div>

     

      

        {/* Footer space */}
        <div className="h-16" />
      </div>
    </motion.div>
  );
};

export default HomeScreen;
