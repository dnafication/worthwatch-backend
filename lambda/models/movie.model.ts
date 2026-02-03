/**
 * Movie entity model
 */

export interface Movie {
  // DynamoDB keys
  PK: string; // MOVIE#<movieId>
  SK: string; // METADATA
  entityType: 'MOVIE';

  // Movie attributes
  movieId: string;
  title: string;
  releaseYear?: number;
  genres: string[];
  directors: string[];
  cast: string[];
  synopsis?: string;
  posterUrl?: string;
  runtime?: number; // in minutes
  rating?: number;
  tmdbId?: string; // The Movie Database ID
  imdbId?: string; // IMDB ID

  // Timestamps
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface CreateMovieInput {
  movieId: string;
  title: string;
  releaseYear?: number;
  genres?: string[];
  directors?: string[];
  cast?: string[];
  synopsis?: string;
  posterUrl?: string;
  runtime?: number;
  tmdbId?: string;
  imdbId?: string;
}

export interface UpdateMovieInput {
  title?: string;
  releaseYear?: number;
  genres?: string[];
  directors?: string[];
  cast?: string[];
  synopsis?: string;
  posterUrl?: string;
  runtime?: number;
  rating?: number;
  tmdbId?: string;
  imdbId?: string;
}

/**
 * Helper function to construct Movie PK
 */
export function getMoviePK(movieId: string): string {
  return `MOVIE#${movieId}`;
}

/**
 * Helper function to construct Movie SK
 */
export function getMovieSK(): string {
  return 'METADATA';
}

/**
 * Helper to extract movieId from PK
 */
export function extractMovieIdFromPK(pk: string): string {
  return pk.replace('MOVIE#', '');
}
