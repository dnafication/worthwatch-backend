/**
 * WatchlistItem repository for managing items within watchlists
 */
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { WatchlistItem } from '../types/entities';
import { BaseRepository, docClient, getTableName } from './base.repository';

export class WatchlistItemRepository extends BaseRepository<WatchlistItem> {
  constructor() {
    super(getTableName(), 'WATCHLIST_ITEM');
  }

  /**
   * Find all items in a watchlist
   */
  async findByWatchlistId(watchlistId: string, limit?: number): Promise<WatchlistItem[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'WatchlistIdIndex', // Assumes GSI on watchlistId field
      KeyConditionExpression: 'watchlistId = :watchlistId',
      ExpressionAttributeValues: {
        ':watchlistId': watchlistId,
      },
      Limit: limit,
    });

    const result = await docClient.send(command);
    const items = (result.Items || []) as WatchlistItem[];
    
    // Sort by order
    return items.sort((a, b) => a.order - b.order);
  }

  /**
   * Find a specific item in a watchlist
   */
  async findByWatchlistAndItemId(
    watchlistId: string,
    itemId: string
  ): Promise<WatchlistItem | null> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'WatchlistIdIndex',
      KeyConditionExpression: 'watchlistId = :watchlistId',
      FilterExpression: 'itemId = :itemId',
      ExpressionAttributeValues: {
        ':watchlistId': watchlistId,
        ':itemId': itemId,
      },
      Limit: 1,
    });

    const result = await docClient.send(command);
    return result.Items && result.Items.length > 0 ? (result.Items[0] as WatchlistItem) : null;
  }

  /**
   * Count items in a watchlist
   */
  async countByWatchlistId(watchlistId: string): Promise<number> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'WatchlistIdIndex',
      KeyConditionExpression: 'watchlistId = :watchlistId',
      ExpressionAttributeValues: {
        ':watchlistId': watchlistId,
      },
      Select: 'COUNT',
    });

    const result = await docClient.send(command);
    return result.Count || 0;
  }

  /**
   * Reorder items in a watchlist
   */
  async reorder(items: Array<{ id: string; order: number }>): Promise<void> {
    // In production, this should use batch operations
    for (const item of items) {
      await this.update(item.id, { order: item.order } as any);
    }
  }
}
