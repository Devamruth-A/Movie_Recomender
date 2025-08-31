const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT;
const COLLECTION_METRICES_ID = import.meta.env.VITE_APPWRITE_COLLECTION_METRICES_ID;

import { Client, Databases, ID, Query } from "appwrite";

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID);

const databases = new Databases(client);

export const updateSearchCount = async (searchTerm, movie) => {
  try {
    // 1. Check if search term already exists
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_METRICES_ID, [
      Query.equal("searchTerm", searchTerm),
    ]);

    if (result.documents.length > 0) {
      // 2. If exists → update count
      const doc = result.documents[0];
      await databases.updateDocument(DATABASE_ID, COLLECTION_METRICES_ID, doc.$id, {
        count: doc.count + 1,
      });
    } else {
      // 3. If new → create document
      await databases.createDocument(DATABASE_ID, COLLECTION_METRICES_ID, ID.unique(), {
        searchTerm,
        count: 1,
        movie_id: movie.id, // ✅ required
        poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`, // ✅ required
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
      [Query.orderDesc("count"), Query.limit(20)] // fetch a bit more to allow filtering
    );

    // Deduplicate by movie_id
    const seen = new Set();
    const uniqueMovies = [];

    for (const movie of result.documents) {
      if (!seen.has(movie.movie_id)) {
        seen.add(movie.movie_id);
        uniqueMovies.push(movie);
      }
      if (uniqueMovies.length === 5) break; // only keep top 5 unique
    }

    return uniqueMovies;
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    return [];
  }
};
