/**
 * Like repository for managing watchlist likes
 */
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Like } from '../types/entities';
import { BaseRepository, docClient, getTableName } from './base.repository';

export class LikeRepository extends BaseRepository<Like> {
  constructor() {
    super(getTableName(), 'LIKE');
  }

  /**
   * Override generateId to use composite key
   */
  protected generateId(): string {
    // Likes don't need UUID, they use composite key
    return '';
  }

  /**
   * Create a like with composite key
   */
  async createLike(userId: string, watchlistId: string): Promise<Like> {
    const { PutCommand } = await import('@aws-sdk/lib-dynamodb');
    const now = this.getTimestamp();
    const like: Like = {
      id: `USER#${userId}#LIKE#WATCHLIST#${watchlistId}`,
      userId,
      watchlistId,
      createdAt: now,
      updatedAt: now,
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: like,
    });

    await docClient.send(command);
    return like;
  }

  /**
   * Check if user has liked a watchlist
   */
  async hasLiked(userId: string, watchlistId: string): Promise<boolean> {
    const id = `USER#${userId}#LIKE#WATCHLIST#${watchlistId}`;
    const result = await this.getById(id);
    return result !== null;
  }

  /**
   * Get all watchlists liked by a user
   */
  async findByUserId(userId: string, limit?: number): Promise<Like[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'UserIdIndex', // Assumes GSI on userId field
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      Limit: limit,
    });

    const result = await docClient.send(command);
    return (result.Items || []) as Like[];
  }

  /**
   * Get all likes for a watchlist
   */
  async findByWatchlistId(
    watchlistId: string,
    limit?: number
  ): Promise<Like[]> {
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
    return (result.Items || []) as Like[];
  }

  /**
   * Unlike (delete a like)
   */
  async unlike(userId: string, watchlistId: string): Promise<void> {
    const id = `USER#${userId}#LIKE#WATCHLIST#${watchlistId}`;
    await this.delete(id);
  }
}
