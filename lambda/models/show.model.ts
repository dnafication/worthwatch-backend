/**
 * Show (TV Series) entity model
 */

export interface Show {
  // DynamoDB keys
  PK: string; // SHOW#<showId>
  SK: string; // METADATA
  entityType: 'SHOW';

  // Show attributes
  showId: string;
  title: string;
  startYear?: number;
  endYear?: number | null; // null if ongoing
  genres: string[];
  creators: string[];
  cast: string[];
  synopsis?: string;
  posterUrl?: string;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  status: 'ongoing' | 'ended' | 'cancelled';
  rating?: number;
  tmdbId?: string; // The Movie Database ID
  imdbId?: string; // IMDB ID

  // Timestamps
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface CreateShowInput {
  showId: string;
  title: string;
  startYear?: number;
  endYear?: number | null;
  genres?: string[];
  creators?: string[];
  cast?: string[];
  synopsis?: string;
  posterUrl?: string;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  status?: 'ongoing' | 'ended' | 'cancelled';
  tmdbId?: string;
  imdbId?: string;
}

export interface UpdateShowInput {
  title?: string;
  startYear?: number;
  endYear?: number | null;
  genres?: string[];
  creators?: string[];
  cast?: string[];
  synopsis?: string;
  posterUrl?: string;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  status?: 'ongoing' | 'ended' | 'cancelled';
  rating?: number;
  tmdbId?: string;
  imdbId?: string;
}

/**
 * Helper function to construct Show PK
 */
export function getShowPK(showId: string): string {
  return `SHOW#${showId}`;
}

/**
 * Helper function to construct Show SK
 */
export function getShowSK(): string {
  return 'METADATA';
}

/**
 * Helper to extract showId from PK
 */
export function extractShowIdFromPK(pk: string): string {
  return pk.replace('SHOW#', '');
}
