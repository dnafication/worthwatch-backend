import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  WatchlistSchema,
  CreateWatchlistSchema,
  UpdateWatchlistSchema,
} from './schemas/watchlist.schema';

const c = initContract();

/**
 * Watchlists API Contract
 * 
 * Defines the type-safe contract for Watchlist CRUD operations.
 * This contract is shared between the server and client for end-to-end type safety.
 */
export const watchlistsContract = c.router({
  /**
   * List all watchlists
   * GET /watchlists
   */
  listWatchlists: {
    method: 'GET',
    path: '/watchlists',
    responses: {
      200: z.array(WatchlistSchema),
    },
    summary: 'Get all watchlists',
  },

  /**
   * Create a new watchlist
   * POST /watchlists
   */
  createWatchlist: {
    method: 'POST',
    path: '/watchlists',
    body: CreateWatchlistSchema,
    responses: {
      201: WatchlistSchema,
      400: z.object({
        error: z.string(),
        message: z.string(),
      }),
    },
    summary: 'Create a new watchlist',
  },

  /**
   * Get a single watchlist by ID
   * GET /watchlists/:id
   */
  getWatchlist: {
    method: 'GET',
    path: '/watchlists/:id',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      200: WatchlistSchema,
      404: z.object({
        error: z.string(),
        message: z.string(),
      }),
    },
    summary: 'Get a watchlist by ID',
  },

  /**
   * Update a watchlist
   * PUT /watchlists/:id
   */
  updateWatchlist: {
    method: 'PUT',
    path: '/watchlists/:id',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    body: UpdateWatchlistSchema,
    responses: {
      200: WatchlistSchema,
      400: z.object({
        error: z.string(),
        message: z.string(),
      }),
      404: z.object({
        error: z.string(),
        message: z.string(),
      }),
    },
    summary: 'Update a watchlist',
  },

  /**
   * Delete a watchlist
   * DELETE /watchlists/:id
   */
  deleteWatchlist: {
    method: 'DELETE',
    path: '/watchlists/:id',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      204: z.void(),
      404: z.object({
        error: z.string(),
        message: z.string(),
      }),
    },
    summary: 'Delete a watchlist',
  },
});
