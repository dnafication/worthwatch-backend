/**
 * Zod validation schemas for WorthWatch entities
 */
import { z } from 'zod';

/**
 * Base entity schema with common fields
 */
export const baseEntitySchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * User validation schema
 */
export const userSchema = baseEntitySchema.extend({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  isVerified: z.boolean().default(false),
});

/**
 * User creation input schema (without generated fields)
 */
export const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
});

/**
 * User update input schema (partial fields)
 */
export const updateUserSchema = createUserSchema.partial();

/**
 * Watchlist validation schema
 */
export const watchlistSchema = baseEntitySchema.extend({
  userId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string().max(50)).default([]),
  itemCount: z.number().int().min(0).default(0),
  likeCount: z.number().int().min(0).default(0),
  viewCount: z.number().int().min(0).default(0),
  creatorUsername: z.string().optional(),
  creatorAvatarUrl: z.string().url().optional(),
});

/**
 * Watchlist creation input schema
 */
export const createWatchlistSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string().max(50)).default([]),
});

/**
 * Watchlist update input schema
 */
export const updateWatchlistSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string().max(50)).optional(),
});

/**
 * Movie validation schema
 */
export const movieSchema = baseEntitySchema.extend({
  title: z.string().min(1).max(200),
  originalTitle: z.string().max(200).optional(),
  releaseYear: z.number().int().min(1800).max(2100),
  posterUrl: z.string().url().optional(),
  backdropUrl: z.string().url().optional(),
  overview: z.string().max(2000).optional(),
  genres: z.array(z.string().max(50)).default([]),
  runtime: z.number().int().min(0).optional(),
  rating: z.number().min(0).max(10).optional(),
  tmdbId: z.string().optional(),
  imdbId: z.string().optional(),
});

/**
 * Movie creation input schema
 */
export const createMovieSchema = z.object({
  title: z.string().min(1).max(200),
  originalTitle: z.string().max(200).optional(),
  releaseYear: z.number().int().min(1800).max(2100),
  posterUrl: z.string().url().optional(),
  backdropUrl: z.string().url().optional(),
  overview: z.string().max(2000).optional(),
  genres: z.array(z.string().max(50)).default([]),
  runtime: z.number().int().min(0).optional(),
  rating: z.number().min(0).max(10).optional(),
  tmdbId: z.string().optional(),
  imdbId: z.string().optional(),
});

/**
 * Show validation schema
 */
export const showSchema = baseEntitySchema.extend({
  title: z.string().min(1).max(200),
  originalTitle: z.string().max(200).optional(),
  firstAirDate: z.string().optional(),
  lastAirDate: z.string().optional(),
  status: z.enum(['Returning', 'Ended', 'Cancelled', 'In Production']),
  numberOfSeasons: z.number().int().min(0).optional(),
  numberOfEpisodes: z.number().int().min(0).optional(),
  posterUrl: z.string().url().optional(),
  backdropUrl: z.string().url().optional(),
  overview: z.string().max(2000).optional(),
  genres: z.array(z.string().max(50)).default([]),
  rating: z.number().min(0).max(10).optional(),
  tmdbId: z.string().optional(),
  imdbId: z.string().optional(),
});

/**
 * Show creation input schema
 */
export const createShowSchema = z.object({
  title: z.string().min(1).max(200),
  originalTitle: z.string().max(200).optional(),
  firstAirDate: z.string().optional(),
  lastAirDate: z.string().optional(),
  status: z.enum(['Returning', 'Ended', 'Cancelled', 'In Production']),
  numberOfSeasons: z.number().int().min(0).optional(),
  numberOfEpisodes: z.number().int().min(0).optional(),
  posterUrl: z.string().url().optional(),
  backdropUrl: z.string().url().optional(),
  overview: z.string().max(2000).optional(),
  genres: z.array(z.string().max(50)).default([]),
  rating: z.number().min(0).max(10).optional(),
  tmdbId: z.string().optional(),
  imdbId: z.string().optional(),
});

/**
 * WatchlistItem validation schema
 */
export const watchlistItemSchema = baseEntitySchema.extend({
  watchlistId: z.string().min(1),
  itemId: z.string().min(1),
  itemType: z.enum(['MOVIE', 'SHOW']),
  order: z.number().int().min(0),
  curatorNote: z.string().max(1000).optional(),
  addedAt: z.string().datetime(),
  title: z.string().optional(),
  posterUrl: z.string().url().optional(),
  releaseYear: z.number().int().optional(),
});

/**
 * WatchlistItem creation input schema
 */
export const createWatchlistItemSchema = z.object({
  watchlistId: z.string().min(1),
  itemId: z.string().min(1),
  itemType: z.enum(['MOVIE', 'SHOW']),
  order: z.number().int().min(0),
  curatorNote: z.string().max(1000).optional(),
});

/**
 * Like validation schema
 */
export const likeSchema = baseEntitySchema.extend({
  userId: z.string().min(1),
  watchlistId: z.string().min(1),
});

/**
 * Like creation input schema
 */
export const createLikeSchema = z.object({
  userId: z.string().min(1),
  watchlistId: z.string().min(1),
});

/**
 * Type inference helpers
 */
export type UserInput = z.infer<typeof createUserSchema>;
export type UserUpdateInput = z.infer<typeof updateUserSchema>;
export type WatchlistInput = z.infer<typeof createWatchlistSchema>;
export type WatchlistUpdateInput = z.infer<typeof updateWatchlistSchema>;
export type MovieInput = z.infer<typeof createMovieSchema>;
export type ShowInput = z.infer<typeof createShowSchema>;
export type WatchlistItemInput = z.infer<typeof createWatchlistItemSchema>;
export type LikeInput = z.infer<typeof createLikeSchema>;
