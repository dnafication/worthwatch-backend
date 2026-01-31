/**
 * WorthWatch API Contracts
 * 
 * Type-safe API contracts shared between backend and frontend.
 * Use these contracts with @ts-rest/core for end-to-end type safety.
 * 
 * @example
 * ```typescript
 * import { watchlistsContract } from '@worthwatch/contracts';
 * import { initClient } from '@ts-rest/core';
 * 
 * const client = initClient(watchlistsContract, {
 *   baseUrl: 'https://api.worthwatch.com'
 * });
 * 
 * const watchlists = await client.listWatchlists();
 * ```
 */

export * from './watchlists.contract';
export * from './schemas/watchlist.schema';
