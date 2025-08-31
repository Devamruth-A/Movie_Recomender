import React from "react";

const MovieCard = ({ movie, onClick, isSelected }) => {
  if (!movie) return <li className="movie-card">No movie data available</li>;

  const { title, poster_path, vote_average, release_date, original_language } = movie;

  return (
    <li
      className={`movie-card relative cursor-pointer transition-all duration-300 ${
        isSelected ? "scale-105 z-10" : ""
      }`}
      onClick={onClick}
    >
      <img
        src={poster_path ? `https://image.tmdb.org/t/p/w200${poster_path}` : "/placeholder.png"}
        alt={title || "Untitled"}
        className="rounded-lg brightness-110 contrast-125 saturate-150"
      />
      <h3 className="text-white font-bold mt-2">{title || "Untitled"}</h3>
      <div className="content text-gray-300 text-sm">
        <div className="rating flex items-center gap-1">
          <img src="/star.svg" alt="Star" className="w-4 h-4" />
          <p>{typeof vote_average === "number" ? vote_average.toFixed(1) : "N/A"}</p>
        </div>
        <span className="year">{release_date ? release_date.slice(0, 4) : "—"}</span>
        <span className="lang">{original_language || "N/A"}</span>
      </div>
    </li>
  );
};

export default MovieCard;
