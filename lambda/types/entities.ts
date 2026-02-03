/**
 * Core entity type definitions for WorthWatch
 */

/**
 * Base entity interface with common fields
 */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User entity representing platform users and curators
 */
export interface User extends BaseEntity {
  email: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  isVerified: boolean;
}

/**
 * Watchlist entity representing curated collections
 */
export interface Watchlist extends BaseEntity {
  userId: string;
  title: string;
  description?: string;
  isPublic: boolean;
  tags: string[];
  itemCount: number;
  likeCount: number;
  viewCount: number;
  // Denormalized user data for efficient queries
  creatorUsername?: string;
  creatorAvatarUrl?: string;
}

/**
 * Movie entity representing film content
 */
export interface Movie extends BaseEntity {
  title: string;
  originalTitle?: string;
  releaseYear: number;
  posterUrl?: string;
  backdropUrl?: string;
  overview?: string;
  genres: string[];
  runtime?: number;
  rating?: number;
  tmdbId?: string;
  imdbId?: string;
}

/**
 * Show entity representing TV series content
 */
export interface Show extends BaseEntity {
  title: string;
  originalTitle?: string;
  firstAirDate?: string;
  lastAirDate?: string;
  status: 'Returning' | 'Ended' | 'Cancelled' | 'In Production';
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  posterUrl?: string;
  backdropUrl?: string;
  overview?: string;
  genres: string[];
  rating?: number;
  tmdbId?: string;
  imdbId?: string;
}

/**
 * Union type for content that can be added to watchlists
 */
export type WatchlistContent = Movie | Show;

/**
 * Item type discriminator
 */
export type ItemType = 'MOVIE' | 'SHOW';

/**
 * WatchlistItem entity representing items within a watchlist
 */
export interface WatchlistItem extends BaseEntity {
  watchlistId: string;
  itemId: string;
  itemType: ItemType;
  order: number;
  curatorNote?: string;
  addedAt: string;
  // Denormalized content data for efficient queries
  title?: string;
  posterUrl?: string;
  releaseYear?: number;
}

/**
 * Like entity representing user likes on watchlists
 */
export interface Like extends BaseEntity {
  userId: string;
  watchlistId: string;
}

/**
 * DynamoDB item structure with partition and sort keys
 */
export interface DynamoDBItem {
  PK: string;
  SK: string;
  entityType: string;
  [key: string]: any;
}

/**
 * Entity type enum for type safety
 */
export enum EntityType {
  USER = 'USER',
  WATCHLIST = 'WATCHLIST',
  MOVIE = 'MOVIE',
  SHOW = 'SHOW',
  WATCHLIST_ITEM = 'WATCHLIST_ITEM',
  LIKE = 'LIKE',
}

/**
 * Helper type to extract the entity type from a DynamoDB item
 */
export type EntityFromType<T extends EntityType> = T extends EntityType.USER
  ? User
  : T extends EntityType.WATCHLIST
    ? Watchlist
    : T extends EntityType.MOVIE
      ? Movie
      : T extends EntityType.SHOW
        ? Show
        : T extends EntityType.WATCHLIST_ITEM
          ? WatchlistItem
          : T extends EntityType.LIKE
            ? Like
            : never;
