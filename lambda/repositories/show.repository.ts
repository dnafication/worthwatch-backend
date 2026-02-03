/**
 * Show repository for TV show-related database operations
 */
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Show } from '../types/entities';
import { BaseRepository, docClient, getTableName } from './base.repository';

export class ShowRepository extends BaseRepository<Show> {
  constructor() {
    super(getTableName(), 'SHOW');
  }

  /**
   * Find show by TMDB ID
   */
  async findByTmdbId(tmdbId: string): Promise<Show | null> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'TmdbIdIndex', // Assumes GSI on tmdbId field
      KeyConditionExpression: 'tmdbId = :tmdbId',
      ExpressionAttributeValues: {
        ':tmdbId': tmdbId,
      },
      Limit: 1,
    });

    const result = await docClient.send(command);
    return result.Items && result.Items.length > 0
      ? (result.Items[0] as Show)
      : null;
  }

  /**
   * Find show by IMDB ID
   */
  async findByImdbId(imdbId: string): Promise<Show | null> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'ImdbIdIndex', // Assumes GSI on imdbId field
      KeyConditionExpression: 'imdbId = :imdbId',
      ExpressionAttributeValues: {
        ':imdbId': imdbId,
      },
      Limit: 1,
    });

    const result = await docClient.send(command);
    return result.Items && result.Items.length > 0
      ? (result.Items[0] as Show)
      : null;
  }

  /**
   * Search shows by title (partial match)
   */
  async searchByTitle(titleQuery: string, limit?: number): Promise<Show[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'TitleIndex', // Assumes GSI on title field
      KeyConditionExpression: 'begins_with(title, :title)',
      ExpressionAttributeValues: {
        ':title': titleQuery,
      },
      Limit: limit,
    });

    const result = await docClient.send(command);
    return (result.Items || []) as Show[];
  }

  /**
   * Find shows by genre
   */
  async findByGenre(genre: string, limit?: number): Promise<Show[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      FilterExpression: 'contains(genres, :genre)',
      ExpressionAttributeValues: {
        ':genre': genre,
      },
      Limit: limit,
    });

    const result = await docClient.send(command);
    return (result.Items || []) as Show[];
  }

  /**
   * Find shows by status
   */
  async findByStatus(status: Show['status'], limit?: number): Promise<Show[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'StatusIndex', // Assumes GSI on status field
      KeyConditionExpression: 'status = :status',
      ExpressionAttributeValues: {
        ':status': status,
      },
      Limit: limit,
    });

    const result = await docClient.send(command);
    return (result.Items || []) as Show[];
  }
}
