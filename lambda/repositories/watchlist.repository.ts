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
   * Note: This uses FilterExpression which performs a scan operation.
   * For production, consider creating a separate tag mapping table or GSI.
   */
  async findByTag(tag: string, limit?: number): Promise<Watchlist[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      FilterExpression: 'contains(tags, :tag)',
      ExpressionAttributeValues: {
        ':tag': tag,
      },
      Limit: limit,
    });

    const result = await docClient.send(command);
    return (result.Items || []) as Watchlist[];
  }

  /**
   * Increment view count (atomic operation)
   */
  async incrementViewCount(id: string): Promise<void> {
    const { UpdateCommand } = await import('@aws-sdk/lib-dynamodb');
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { id },
      UpdateExpression: 'ADD viewCount :inc',
      ExpressionAttributeValues: {
        ':inc': 1,
      },
    });
    await docClient.send(command);
  }

  /**
   * Increment like count (atomic operation)
   */
  async incrementLikeCount(id: string): Promise<void> {
    const { UpdateCommand } = await import('@aws-sdk/lib-dynamodb');
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { id },
      UpdateExpression: 'ADD likeCount :inc',
      ExpressionAttributeValues: {
        ':inc': 1,
      },
    });
    await docClient.send(command);
  }

  /**
   * Decrement like count (atomic operation)
   */
  async decrementLikeCount(id: string): Promise<void> {
    const { UpdateCommand } = await import('@aws-sdk/lib-dynamodb');
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { id },
      UpdateExpression: 'ADD likeCount :dec',
      ExpressionAttributeValues: {
        ':dec': -1,
      },
    });
    await docClient.send(command);
  }
}
