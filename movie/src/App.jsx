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

  const fetchMovies = async (query = "") => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=1&include_adult=false`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc&language=en-US&page=1&include_adult=false`;

      const response = await fetch(endpoint, API_OPTIONS);
      if (!response.ok) throw new Error("Failed to fetch movies");

      const data = await response.json();
      setMovieList(data.results || []);

      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
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
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span> You'll Enjoy
          </h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.searchTerm} />
                  <span>{movie.searchTerm}</span>
                  <small>({movie.count} searches)</small>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="all-movies relative">
          <h2>All Movies</h2>
          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {filteredMovieList.map((movie) => (
                <li
                  key={movie.id}
                  className={`relative transition-all duration-300 ${
                    selectedMovie && selectedMovie.id !== movie.id
                      ? "blur-sm opacity-50 pointer-events-none"
                      : ""
                  }`}
                  onClick={() => setSelectedMovie(movie)}
                >
                  <MovieCard movie={movie} />

                  {selectedMovie && selectedMovie.id === movie.id && (
                    <div className="absolute inset-0 bg-black/90 text-white p-4 rounded-xl z-50 flex flex-col items-center justify-center">
                      <img
                        src={`https://image.tmdb.org/t/p/w400${selectedMovie.poster_path}`}
                        alt={selectedMovie.title}
                        className="rounded-lg mb-4 max-h-[300px] object-contain"
                      />
                      <h3 className="text-xl font-bold mb-2">{selectedMovie.title}</h3>
                      <p className="text-gray-300 text-center text-sm">
                        {selectedMovie.overview || "No description available."}
                      </p>
                      <div className="flex gap-4 mt-2 text-gray-400 text-xs">
                        <span>⭐ {selectedMovie.vote_average?.toFixed(1) || "N/A"}</span>
                        <span>📅 {selectedMovie.release_date?.slice(0, 4) || "—"}</span>
                        <span>🌐 {selectedMovie.original_language || "N/A"}</span>
                      </div>
                      <button
                        className="mt-4 px-3 py-1 bg-white text-black rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMovie(null);
                        }}
                      >
                        Close
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
};

export default App;