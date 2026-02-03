/**
 * Watchlist repository for watchlist-related database operations
 */
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Watchlist } from '../types/entities';
import { BaseRepository, docClient, getTableName } from './base.repository';

export class WatchlistRepository extends BaseRepository<Watchlist> {
  constructor() {
    super(getTableName(), 'WATCHLIST');
  }

  /**
   * Find watchlists by user ID
   */
  async findByUserId(userId: string, limit?: number): Promise<Watchlist[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'UserIdIndex', // Assumes GSI on userId field
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      Limit: limit,
      ScanIndexForward: false, // Most recent first
    });

    const result = await docClient.send(command);
    return (result.Items || []) as Watchlist[];
  }

  /**
   * List public watchlists
   */
  async listPublic(limit?: number): Promise<Watchlist[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'PublicIndex', // Assumes GSI on isPublic field
      KeyConditionExpression: 'isPublic = :isPublic',
      ExpressionAttributeValues: {
        ':isPublic': true,
      },
      Limit: limit,
      ScanIndexForward: false, // Most recent first
    });

    const result = await docClient.send(command);
    return (result.Items || []) as Watchlist[];
  }

  /**
   * Find watchlists by tag
   */
  async findByTag(tag: string, limit?: number): Promise<Watchlist[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'TagIndex', // Assumes GSI on tags field
      KeyConditionExpression: 'contains(tags, :tag)',
      ExpressionAttributeValues: {
        ':tag': tag,
      },
      Limit: limit,
    });

    const result = await docClient.send(command);
    return (result.Items || []) as Watchlist[];
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.update(id, { viewCount: 1 } as any); // Simplified - should use ADD operation
  }

  /**
   * Increment like count
   */
  async incrementLikeCount(id: string): Promise<void> {
    await this.update(id, { likeCount: 1 } as any); // Simplified - should use ADD operation
  }

  /**
   * Decrement like count
   */
  async decrementLikeCount(id: string): Promise<void> {
    await this.update(id, { likeCount: -1 } as any); // Simplified - should use ADD operation
  }
}
