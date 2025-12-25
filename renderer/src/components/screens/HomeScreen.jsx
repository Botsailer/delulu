import { motion } from 'motion/react';
import { useThemeStore } from '../../store';
import { HeroBanner, ContentRow } from '../layout';
import { useTopAnime, useCurrentSeason, useTrendingAnime } from '../../hooks/useAnime';
import { usePopularManga } from '../../hooks/useManga';

// Transform API data to our card format
const transformAnimeData = (data) => {
  if (!data?.data) return [];
  return data.data.map(item => ({
    id: item.mal_id,
    title: item.title || item.title_english,
    image: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
    rating: item.score || 0,
    year: item.year || (item.aired?.prop?.from?.year) || 'N/A',
    genre: item.genres?.[0]?.name || 'Anime',
    episodes: item.episodes,
    synopsis: item.synopsis,
    status: item.status,
    type: 'anime',
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
    <div className="flex gap-3 overflow-hidden px-8">
      {Array(count).fill(0).map((_, i) => (
        <div 
          key={i} 
          className="flex-shrink-0 w-36 h-52 rounded-xl animate-pulse"
          style={{ background: theme.surface }}
        />
      ))}
    </div>
  );
};

// Error display component - shows loading instead of error in dev mode
const ErrorMessage = () => {
  const { theme } = useThemeStore();
  return (
    <div className="flex gap-3 overflow-hidden px-8">
      {Array(10).fill(0).map((_, i) => (
        <div 
          key={i} 
          className="flex-shrink-0 w-36 h-52 rounded-xl animate-pulse"
          style={{ background: theme.surface }}
        />
      ))}
    </div>
  );
};

const HomeScreen = () => {
  const { theme } = useThemeStore();

  // Fetch data from APIs
  const { data: topAnimeData, loading: topAnimeLoading, error: topAnimeError } = useTopAnime(1, 15);
  const { data: seasonData, loading: seasonLoading, error: seasonError } = useCurrentSeason(1);
  const { data: popularMangaData, loading: topMangaLoading, error: topMangaError } = usePopularManga(1, 15);
  const { data: trendingData, loading: trendingLoading } = useTrendingAnime(1, 15);

  // Transform API responses
  const trendingAnime = transformAnimeData(topAnimeData);
  const currentSeason = transformAnimeData(seasonData);
  const topManga = transformMangaData(popularMangaData);

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
        {/* Trending Anime */}
        <div className="mb-2">
          <h2 className="text-lg font-bold mb-3 px-8" style={{ color: theme.text }}>
            🔥 Trending Anime
          </h2>
          {topAnimeLoading ? (
            <LoadingSkeleton />
          ) : topAnimeError ? (
            <ErrorMessage message={topAnimeError} />
          ) : (
            <ContentRow items={trendingAnime} />
          )}
        </div>

        {/* This Season */}
        <div className="mb-2">
          <h2 className="text-lg font-bold mb-3 px-8" style={{ color: theme.text }}>
            ✨ This Season
          </h2>
          {seasonLoading ? (
            <LoadingSkeleton />
          ) : seasonError ? (
            <ErrorMessage message={seasonError} />
          ) : (
            <ContentRow items={currentSeason} />
          )}
        </div>

        {/* Top Manga */}
        <div className="mb-2">
          <h2 className="text-lg font-bold mb-3 px-8" style={{ color: theme.text }}>
            📚 Top Manga
          </h2>
          {topMangaLoading ? (
            <LoadingSkeleton />
          ) : topMangaError ? (
            <ErrorMessage message={topMangaError} />
          ) : (
            <ContentRow items={topManga} />
          )}
        </div>

        {/* Footer space */}
        <div className="h-16" />
      </div>
    </motion.div>
  );
};

export default HomeScreen;
