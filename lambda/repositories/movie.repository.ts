/**
 * Movie repository for movie-related database operations
 */
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Movie } from '../types/entities';
import { BaseRepository, docClient, getTableName } from './base.repository';

export class MovieRepository extends BaseRepository<Movie> {
  constructor() {
    super(getTableName(), 'MOVIE');
  }

  /**
   * Find movie by TMDB ID
   */
  async findByTmdbId(tmdbId: string): Promise<Movie | null> {
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
      ? (result.Items[0] as Movie)
      : null;
  }

  /**
   * Find movie by IMDB ID
   */
  async findByImdbId(imdbId: string): Promise<Movie | null> {
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
      ? (result.Items[0] as Movie)
      : null;
  }

  /**
   * Search movies by title (partial match)
   * Note: This requires a GSI with title as sort key for efficient queries.
   * Current implementation uses FilterExpression which performs a scan.
   */
  async searchByTitle(titleQuery: string, limit?: number): Promise<Movie[]> {
    const { ScanCommand } = await import('@aws-sdk/lib-dynamodb');
    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: 'begins_with(title, :title)',
      ExpressionAttributeValues: {
        ':title': titleQuery,
      },
      Limit: limit,
    });

    const result = await docClient.send(command);
    return (result.Items || []) as Movie[];
  }

  /**
   * Find movies by genre
   * Note: This uses FilterExpression which performs a scan.
   * For production, consider creating a GSI with genre as partition key.
   */
  async findByGenre(genre: string, limit?: number): Promise<Movie[]> {
    const { ScanCommand } = await import('@aws-sdk/lib-dynamodb');
    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: 'contains(genres, :genre)',
      ExpressionAttributeValues: {
        ':genre': genre,
      },
      Limit: limit,
    });

    const result = await docClient.send(command);
    return (result.Items || []) as Movie[];
  }
}
