import { initContract } from '@ts-rest/core';
import { watchlistsContract } from '../contracts/watchlists.contract';
import { watchlistsRoutes } from './routes/watchlists.routes';
import { RouterImplementationOrFluentRouter } from '@ts-rest/serverless/src/lib/types';

/**
 * Main API Router
 *
 * Aggregates all route modules and creates the ts-rest server.
 * Add new route modules here as they are created.
 */
const c = initContract();

/**
 * Combined API contract
 */
export const apiContract = c.router({
  watchlists: watchlistsContract,
});

/**
 * Combined route implementation
 */
export const apiRoutes = {
  watchlists: watchlistsRoutes,
};
