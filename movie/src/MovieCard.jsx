import React from "react";

const MovieCard = ({ movie }) => {
  if (!movie) {
    return <li className="movie-card">No movie data available</li>;
  }

  const { title, poster_path, vote_average, release_date, original_language } =
    movie;

  return (
    <li className="movie-card">
      <img
        src={
          poster_path
            ? `https://image.tmdb.org/t/p/w200${poster_path}`
            : "/placeholder.png"
        }
        alt={title || "Untitled"}
      />
      <h3>{title || "Untitled"}</h3>
      <div className="content">
        <div className="rating">
          <img src="/star.svg" alt="Star" />
          <p>
            {typeof vote_average === "number"
              ? vote_average.toFixed(1)
              : "N/A"}
          </p>
        </div>
        <span className="year">{release_date ? release_date.slice(0, 4) : "—"}</span>
        <span className="lang">{original_language || "N/A"}</span>
      </div>
    </li>
  );
};

export default MovieCard;
