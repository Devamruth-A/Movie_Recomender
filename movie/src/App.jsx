import React, { useState, useEffect } from "react";
import Search from "./components/Search";
import Spinner from "./components/Spinner";
import MovieCard from "./MovieCard";
import { useDebounce } from "use-debounce";
import { getTrendingMovies, updateSearchCount } from "./appwrite";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

const App = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  const [movieList, setMovieList] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch movies from TMDB
  const fetchMovies = async (query = "") => {
    setIsLoading(true);
    setErrorMessage("");
    let allResults = [];

    try {
      // Fetch first 3 pages
      for (let page = 1; page <= 3; page++) {
        const endpoint = query
          ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=${page}&include_adult=false`
          : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc&language=en-US&page=${page}&include_adult=false`;

        const response = await fetch(endpoint, API_OPTIONS);
        if (!response.ok) throw new Error("Failed to fetch movies");

        const data = await response.json();
        allResults = [...allResults, ...(data.results || [])];
      }

      setMovieList(allResults);

      if (query && allResults.length > 0) {
        await updateSearchCount(query, allResults[0]);
        loadTrendingMovies();
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
      setErrorMessage("Error fetching movies. Please try again later.");
      setMovieList([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load trending movies from Appwrite
  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies || []);
    } catch (error) {
      console.error("Error fetching trending movies:", error);
    }
  };

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadTrendingMovies();
  }, []);

  const trendingTitles = new Set(
    trendingMovies.map((m) => m.searchTerm?.toLowerCase())
  );

  const filteredMovieList = movieList.filter(
    (movie) => !trendingTitles.has(movie.title?.toLowerCase())
  );

  return (
    <main>
      <div className="pattern" />
      <div className="wrapper">
        {/* Header */}
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span> You'll Enjoy
          </h1>

          {/* Search Bar */}
          <div className="relative w-full max-w-3xl mx-auto">
            <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

            {/* Search suggestions */}
            {searchTerm && !isLoading && movieList.length > 0 && (
              <ul className="absolute bg-dark-100 text-white w-full mt-1 rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                {movieList.slice(0, 5).map((movie, index) => (
                  <li
                    key={`${movie.id}-${index}`}
                    className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                    onClick={() => setSelectedMovie(movie)}
                  >
                    {movie.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </header>

        {/* Trending Movies */}
        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>
            <ul className="flex gap-4 overflow-x-auto">
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id} className="flex-shrink-0">
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.searchTerm} />
                  <span>{movie.searchTerm}</span>
                  <small>({movie.count} searches)</small>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* All Movies */}
        <section className="all-movies relative">
          <h2>All Movies</h2>
          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {filteredMovieList.map((movie, index) => (
                <MovieCard
                  key={`${movie.id}-${index}`}
                  movie={movie}
                  onClick={() => setSelectedMovie(movie)}
                  isSelected={selectedMovie?.id === movie.id}
                />
              ))}
            </ul>
          )}

          {/* Movie Modal */}
          {selectedMovie && (
            <div
              className="fixed inset-0 bg-black/90 text-white z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedMovie(null)} // click outside closes
            >
              <div
                className="relative max-w-lg w-full"
                onClick={(e) => e.stopPropagation()} // stop closing when clicking modal
              >
                <img
                  src={`https://image.tmdb.org/t/p/w400${selectedMovie.poster_path}`}
                  alt={selectedMovie.title}
                  className="rounded-lg mb-4 max-h-[400px] object-contain mx-auto"
                />
                <h3 className="text-xl font-bold mb-2 text-center">{selectedMovie.title}</h3>
                <p className="text-gray-300 text-center text-sm">
                  {selectedMovie.overview || "No description available."}
                </p>
                <div className="flex gap-4 mt-2 text-gray-400 text-xs justify-center">
                  <span>⭐ {selectedMovie.vote_average?.toFixed(1) || "N/A"}</span>
                  <span>📅 {selectedMovie.release_date?.slice(0, 4) || "—"}</span>
                  <span>🌐 {selectedMovie.original_language || "N/A"}</span>
                </div>
                <button
                  className="mt-4 px-3 py-1 bg-white text-black rounded mx-auto block"
                  onClick={() => setSelectedMovie(null)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default App;
