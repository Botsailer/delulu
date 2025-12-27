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
import { useTrendingMovies, useSpotlightMovies } from '../../hooks/useMovies';

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

// Transform movie data to our card format
const transformMovieData = (data) => {
  if (!data) return [];
  // Handle both array and object with results property
  const items = Array.isArray(data) ? data : (data.results || []);
  return items.slice(0, 15).map(item => ({
    id: item.id,
    title: item.title,
    // Try multiple image fields - spotlight may use cover/poster instead of image
    image: item.image || item.cover || item.poster || item.thumbnail || item.banner,
    rating: item.rating || 0,
    year: item.releaseDate || 'N/A',
    genre: item.type === 'Movie' ? 'Movie' : 'TV Series',
    episodes: item.type === 'Movie' ? null : 'Series',
    synopsis: item.description,
    status: item.status,
    type: 'movie',
    mediaType: item.type, // 'Movie' or 'TV Series'
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
    <div className="flex gap-2 sm:gap-3 md:gap-4 overflow-hidden px-3 sm:px-4 md:px-6 lg:px-8">
      {Array(count).fill(0).map((_, i) => (
        <div 
          key={i} 
          className="flex-shrink-0 w-24 xs:w-28 sm:w-32 md:w-36 lg:w-40 aspect-[2/3] rounded-lg sm:rounded-xl animate-pulse"
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
    <div className="flex gap-2 sm:gap-3 md:gap-4 overflow-hidden px-3 sm:px-4 md:px-6 lg:px-8">
      {Array(10).fill(0).map((_, i) => (
        <div 
          key={i} 
          className="flex-shrink-0 w-24 xs:w-28 sm:w-32 md:w-36 lg:w-40 aspect-[2/3] rounded-lg sm:rounded-xl animate-pulse"
          style={{ background: theme.surface }}
        />
      ))}
    </div>
  );
};

const HomeScreen = () => {
  const { theme } = useThemeStore();
  const { navigateToAnime, navigateToManga, navigateToMovies } = useNavigationStore();

  // Default provider for home screen (Hianime = p1 - has all features)
  const defaultAnimeProvider = 'p1';
  // HiMovies = m1 (default), FlixHQ = m2 (has spotlight)
  const defaultMovieProvider = 'm1';
  const movieProviderWithSpotlight = 'm2'; // FlixHQ

  // Fetch anime data from streaming providers
  const { data: topAiringData, loading: topAiringLoading, error: topAiringError } = useTopAiring(defaultAnimeProvider, 1);
  const { data: popularData, loading: popularLoading, error: popularError } = useMostPopularAnime(defaultAnimeProvider, 1);
  const { data: recentlyUpdatedData, loading: recentlyUpdatedLoading, error: recentlyUpdatedError } = useRecentlyUpdatedAnime(defaultAnimeProvider, 1);
  
  // Fetch manga data
  const { data: popularMangaData, loading: topMangaLoading, error: topMangaError } = usePopularManga(1, 15);
  const { data: trendingMangaData, loading: trendingMangaLoading, error: trendingMangaError } = useTrendingManga(1, 15);

  // Fetch movie data
  const { data: trendingMoviesData, loading: trendingMoviesLoading, error: trendingMoviesError } = useTrendingMovies(defaultMovieProvider, 1);
  const { data: spotlightMoviesData, loading: spotlightMoviesLoading, error: spotlightMoviesError } = useSpotlightMovies(movieProviderWithSpotlight);

  // Transform API responses
  const topAiringAnime = transformStreamingAnimeData(topAiringData);
  const popularAnime = transformStreamingAnimeData(popularData);
  const recentlyUpdated = transformStreamingAnimeData(recentlyUpdatedData);
  const topManga = transformMangaData(popularMangaData);
  const trendingManga = transformMangaData(trendingMangaData);
  const trendingMovies = transformMovieData(trendingMoviesData);
  const spotlightMovies = transformMovieData(spotlightMoviesData);

  // Handle clicking on cards - navigate with the selected item
  const handleAnimeClick = (item) => {
    // Pass the item to navigate and open its info modal
    navigateToAnime(item, defaultAnimeProvider);
  };

  const handleMangaClick = (item) => {
    // Pass the item to navigate and open its info modal
    navigateToManga(item);
  };

  const handleMovieClick = (item) => {
    // Pass the item to navigate and open its info modal
    // Use the provider that the item came from
    const provider = spotlightMovies.some(m => m.id === item.id) ? movieProviderWithSpotlight : defaultMovieProvider;
    navigateToMovies(item, provider);
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

        {/* Trending Movies */}
        <div className="mb-2">
          <h2 className="text-base sm:text-lg font-bold mb-3 px-4 sm:px-6 md:px-8" style={{ color: theme.text }}>
            🎬 Trending Movies
          </h2>
          {trendingMoviesLoading ? (
            <LoadingSkeleton />
          ) : trendingMoviesError ? (
            <ErrorMessage />
          ) : (
            <ContentRow items={trendingMovies} onClick={handleMovieClick} />
          )}
        </div>

        {/* Spotlight Movies */}
        {spotlightMovies.length > 0 && (
          <div className="mb-2">
            <h2 className="text-base sm:text-lg font-bold mb-3 px-4 sm:px-6 md:px-8" style={{ color: theme.text }}>
              ⭐ Spotlight Movies & Shows
            </h2>
            {spotlightMoviesLoading ? (
              <LoadingSkeleton />
            ) : spotlightMoviesError ? (
              <ErrorMessage />
            ) : (
              <ContentRow items={spotlightMovies} onClick={handleMovieClick} />
            )}
          </div>
        )}

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
