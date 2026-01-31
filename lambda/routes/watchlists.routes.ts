import { ServerInferRequest } from '@ts-rest/core';
import { Watchlist } from '../../contracts/schemas/watchlist.schema';
import { watchlistsContract } from '../../contracts/watchlists.contract';

/**
 * Stub data for testing
 * Replace with DynamoDB operations in production
 */
const STUB_WATCHLISTS: Watchlist[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Action Movies',
    description: 'Best action films from the last decade',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Sci-Fi Classics',
    description: 'Must-watch science fiction movies',
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];

/**
 * Watchlists Route Handlers
 *
 * These are stub implementations returning hardcoded data.
 * Replace with actual DynamoDB operations for production.
 */
export const watchlistsRoutes = {
  /**
   * List all watchlists
   */
  listWatchlists: async () => {
    console.log('Fetching all watchlists (stub)');

    return {
      status: 200 as const,
      body: STUB_WATCHLISTS,
    };
  },

  /**
   * Create a new watchlist
   */
  createWatchlist: async ({
    body,
  }: ServerInferRequest<typeof watchlistsContract.createWatchlist>) => {
    console.log('Creating watchlist (stub):', body);

    // Generate stub ID and timestamps
    const newWatchlist: Watchlist = {
      id: `550e8400-e29b-41d4-a716-${Date.now().toString().slice(-12)}`,
      name: body.name,
      description: body.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      status: 201 as const,
      body: newWatchlist,
    };
  },

  /**
   * Get a single watchlist by ID
   */
  getWatchlist: async ({
    params,
  }: ServerInferRequest<typeof watchlistsContract.getWatchlist>) => {
    console.log('Fetching watchlist (stub):', params.id);

    const watchlist = STUB_WATCHLISTS.find(w => w.id === params.id);

    if (!watchlist) {
      return {
        status: 404 as const,
        body: {
          error: 'Not Found',
          message: `Watchlist with id ${params.id} not found`,
        },
      };
    }

    return {
      status: 200 as const,
      body: watchlist,
    };
  },

  /**
   * Update a watchlist
   */
  updateWatchlist: async ({
    params,
    body,
  }: ServerInferRequest<typeof watchlistsContract.updateWatchlist>) => {
    console.log('Updating watchlist (stub):', params.id, body);

    const watchlist = STUB_WATCHLISTS.find(w => w.id === params.id);

    if (!watchlist) {
      return {
        status: 404 as const,
        body: {
          error: 'Not Found',
          message: `Watchlist with id ${params.id} not found`,
        },
      };
    }

    // Stub update - merge with existing data
    const updatedWatchlist: Watchlist = {
      ...watchlist,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return {
      status: 200 as const,
      body: updatedWatchlist,
    };
  },

  /**
   * Delete a watchlist
   */
  deleteWatchlist: async ({
    params,
  }: ServerInferRequest<typeof watchlistsContract.deleteWatchlist>) => {
    console.log('Deleting watchlist (stub):', params.id);

    const watchlist = STUB_WATCHLISTS.find(w => w.id === params.id);

    if (!watchlist) {
      return {
        status: 404 as const,
        body: {
          error: 'Not Found',
          message: `Watchlist with id ${params.id} not found`,
        },
      };
    }

    return {
      status: 204 as const,
      body: undefined,
    };
  },
};
