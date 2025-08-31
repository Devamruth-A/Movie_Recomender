const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT;
const COLLECTION_METRICES_ID = import.meta.env.VITE_APPWRITE_COLLECTION_METRICES_ID;
const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY; // Add your TMDB API key

import { Client, Databases, ID, Query } from "appwrite";

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID);
const databases = new Databases(client);

// API options for TMDB
const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

export const updateSearchCount = async (searchTerm, movie) => {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_METRICES_ID, [
      Query.equal("searchTerm", searchTerm),
    ]);

    if (result.documents.length > 0) {
      const doc = result.documents[0];
      await databases.updateDocument(DATABASE_ID, COLLECTION_METRICES_ID, doc.$id, {
        count: doc.count + 1,
      });
    } else {
      await databases.createDocument(DATABASE_ID, COLLECTION_METRICES_ID, ID.unique(), {
        searchTerm,
        count: 1,
        movie_id: movie.id,
        poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      });
    }
  } catch (error) {
    console.error("Error updating search count:", error);
  }
};

export const getTrendingMovies = async () => {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_METRICES_ID,
      [Query.orderDesc("count"), Query.limit(20)]
    );

    const seen = new Set();
    const uniqueMovies = [];

    for (const movie of result.documents) {
      if (!seen.has(movie.movie_id)) {
        seen.add(movie.movie_id);
        uniqueMovies.push(movie);
      }
      if (uniqueMovies.length === 5) break;
    }

    return uniqueMovies;
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    return [];
  }
};

// Fetch watch providers for a movie
export const getWatchProviders = async (movieId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/movie/${movieId}/watch/providers`, API_OPTIONS);
    if (!res.ok) throw new Error("Failed to fetch providers");

    const data = await res.json();
    const providers = data.results?.US?.flatrate || [];
    return providers; // array of {provider_id, provider_name, logo_path}
  } catch (err) {
    console.error("Error fetching watch providers:", err);
    return [];
  }
};
