/**
 * Watchlist repository for DynamoDB operations
 */

import { BaseRepository } from './base.repository';
import {
  Watchlist,
  WatchlistItem,
  CreateWatchlistInput,
  UpdateWatchlistInput,
  AddWatchlistItemInput,
  getWatchlistPK,
  getWatchlistMetadataSK,
  getWatchlistItemSK,
} from '../models/watchlist.model';

export class WatchlistRepository extends BaseRepository {
  /**
   * Create a new watchlist
   */
  async createWatchlist(input: CreateWatchlistInput): Promise<Watchlist> {
    const timestamp = this.getCurrentTimestamp();

    const watchlist: Watchlist = {
      PK: getWatchlistPK(input.watchlistId),
      SK: getWatchlistMetadataSK(),
      entityType: 'WATCHLIST',
      watchlistId: input.watchlistId,
      curatorId: input.curatorId,
      title: input.title,
      description: input.description,
      coverImageUrl: input.coverImageUrl,
      isPublic: input.isPublic ?? true,
      tags: input.tags || [],
      itemCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.putItem(watchlist);
    return watchlist;
  }

  /**
   * Get watchlist by ID
   */
  async getWatchlistById(watchlistId: string): Promise<Watchlist | null> {
    const item = await this.getItem(
      getWatchlistPK(watchlistId),
      getWatchlistMetadataSK()
    );
    return item as Watchlist | null;
  }

  /**
   * Get watchlists by curator using GSI2
   */
  async getWatchlistsByCurator(curatorId: string): Promise<Watchlist[]> {
    const items = await this.query({
      IndexName: 'GSI2',
      KeyConditionExpression: 'curatorId = :curatorId',
      ExpressionAttributeValues: {
        ':curatorId': curatorId,
      },
      ScanIndexForward: false, // Most recent first
    });

    return items as Watchlist[];
  }

  /**
   * Get public watchlists using GSI3
   */
  async getPublicWatchlists(limit: number = 20): Promise<Watchlist[]> {
    const items = await this.query({
      IndexName: 'GSI3',
      KeyConditionExpression: 'isPublic = :isPublic',
      ExpressionAttributeValues: {
        ':isPublic': 'true', // DynamoDB stores boolean as string in GSI
      },
      Limit: limit,
      ScanIndexForward: false, // Most recent first
    });

    return items as Watchlist[];
  }

  /**
   * Update watchlist
   */
  async updateWatchlist(
    watchlistId: string,
    input: UpdateWatchlistInput
  ): Promise<Watchlist | null> {
    const updateParts: string[] = ['#updatedAt = :updatedAt'];
    const attributeNames: Record<string, string> = {
      '#updatedAt': 'updatedAt',
    };
    const attributeValues: Record<string, any> = {
      ':updatedAt': this.getCurrentTimestamp(),
    };

    if (input.title !== undefined) {
      updateParts.push('#title = :title');
      attributeNames['#title'] = 'title';
      attributeValues[':title'] = input.title;
    }

    if (input.description !== undefined) {
      updateParts.push('#description = :description');
      attributeNames['#description'] = 'description';
      attributeValues[':description'] = input.description;
    }

    if (input.coverImageUrl !== undefined) {
      updateParts.push('#coverImageUrl = :coverImageUrl');
      attributeNames['#coverImageUrl'] = 'coverImageUrl';
      attributeValues[':coverImageUrl'] = input.coverImageUrl;
    }

    if (input.isPublic !== undefined) {
      updateParts.push('#isPublic = :isPublic');
      attributeNames['#isPublic'] = 'isPublic';
      attributeValues[':isPublic'] = input.isPublic;
    }

    if (input.tags !== undefined) {
      updateParts.push('#tags = :tags');
      attributeNames['#tags'] = 'tags';
      attributeValues[':tags'] = input.tags;
    }

    const updateExpression = 'SET ' + updateParts.join(', ');

    const result = await this.updateItem(
      getWatchlistPK(watchlistId),
      getWatchlistMetadataSK(),
      updateExpression,
      attributeNames,
      attributeValues
    );

    return result as Watchlist;
  }

  /**
   * Delete watchlist
   */
  async deleteWatchlist(watchlistId: string): Promise<void> {
    // First, get all items in the watchlist
    const items = await this.getWatchlistItems(watchlistId);

    // Delete all items
    for (const item of items) {
      await this.deleteItem(item.PK, item.SK);
    }

    // Delete the watchlist metadata
    await this.deleteItem(
      getWatchlistPK(watchlistId),
      getWatchlistMetadataSK()
    );
  }

  /**
   * Add item to watchlist
   */
  async addWatchlistItem(input: AddWatchlistItemInput): Promise<WatchlistItem> {
    const item: WatchlistItem = {
      PK: getWatchlistPK(input.watchlistId),
      SK: getWatchlistItemSK(input.contentType, input.contentId),
      entityType: 'WATCHLIST_ITEM',
      contentType: input.contentType,
      contentId: input.contentId,
      position: input.position,
      curatorNote: input.curatorNote,
      addedAt: this.getCurrentTimestamp(),
    };

    await this.putItem(item);

    // Increment item count
    await this.updateItem(
      getWatchlistPK(input.watchlistId),
      getWatchlistMetadataSK(),
      'ADD #itemCount :inc',
      { '#itemCount': 'itemCount' },
      { ':inc': 1 }
    );

    return item;
  }

  /**
   * Get all items in a watchlist
   */
  async getWatchlistItems(watchlistId: string): Promise<WatchlistItem[]> {
    const items = await this.query({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': getWatchlistPK(watchlistId),
        ':sk': 'ITEM#',
      },
    });

    return items as WatchlistItem[];
  }

  /**
   * Remove item from watchlist
   */
  async removeWatchlistItem(
    watchlistId: string,
    contentType: 'MOVIE' | 'SHOW',
    contentId: string
  ): Promise<void> {
    await this.deleteItem(
      getWatchlistPK(watchlistId),
      getWatchlistItemSK(contentType, contentId)
    );

    // Decrement item count
    await this.updateItem(
      getWatchlistPK(watchlistId),
      getWatchlistMetadataSK(),
      'ADD #itemCount :dec',
      { '#itemCount': 'itemCount' },
      { ':dec': -1 }
    );
  }
}
