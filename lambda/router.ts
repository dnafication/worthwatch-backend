import { initContract } from '@ts-rest/core';
import { healthContract } from '../contracts/health.contract';
import { watchlistsContract } from '../contracts/watchlists.contract';
import { healthRoutes } from './routes/health.routes';
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
  health: healthContract,
  watchlists: watchlistsContract,
});

/**
 * Combined route implementation
 */
export const apiRoutes = {
  health: healthRoutes,
  watchlists: watchlistsRoutes,
};
