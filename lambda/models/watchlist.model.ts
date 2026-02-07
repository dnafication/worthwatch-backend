/**
 * Watchlist entity model
 */

export interface Watchlist {
  // DynamoDB keys
  PK: string; // WATCHLIST#<watchlistId>
  SK: string; // METADATA
  entityType: 'WATCHLIST';

  // Watchlist attributes
  watchlistId: string;
  curatorId: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  isPublic: boolean;
  isPublicStr: string; // String representation for GSI3 ('true' or 'false')
  tags: string[];
  itemCount: number;

  // Timestamps
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface WatchlistItem {
  // DynamoDB keys
  PK: string; // WATCHLIST#<watchlistId>
  SK: string; // ITEM#<contentType>#<contentId>
  entityType: 'WATCHLIST_ITEM';

  // Item attributes
  contentType: 'MOVIE' | 'SHOW';
  contentId: string;
  position: number;
  curatorNote?: string;
  addedAt: string; // ISO 8601
}

export interface CreateWatchlistInput {
  watchlistId: string;
  curatorId: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface UpdateWatchlistInput {
  title?: string;
  description?: string;
  coverImageUrl?: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface AddWatchlistItemInput {
  watchlistId: string;
  contentType: 'MOVIE' | 'SHOW';
  contentId: string;
  position: number;
  curatorNote?: string;
}

/**
 * Helper function to construct Watchlist PK
 */
export function getWatchlistPK(watchlistId: string): string {
  return `WATCHLIST#${watchlistId}`;
}

/**
 * Helper function to construct Watchlist SK for metadata
 */
export function getWatchlistMetadataSK(): string {
  return 'METADATA';
}

/**
 * Helper function to construct Watchlist Item SK
 */
export function getWatchlistItemSK(
  contentType: 'MOVIE' | 'SHOW',
  contentId: string
): string {
  return `ITEM#${contentType}#${contentId}`;
}

/**
 * Helper to extract watchlistId from PK
 */
export function extractWatchlistIdFromPK(pk: string): string {
  return pk.replace('WATCHLIST#', '');
}

/**
 * Helper to parse content info from SK
 */
export function parseWatchlistItemSK(sk: string): {
  contentType: 'MOVIE' | 'SHOW';
  contentId: string;
} | null {
  const match = sk.match(/^ITEM#(MOVIE|SHOW)#(.+)$/);
  if (!match) return null;
  return {
    contentType: match[1] as 'MOVIE' | 'SHOW',
    contentId: match[2],
  };
}
