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
    return result.Items && result.Items.length > 0 ? (result.Items[0] as Movie) : null;
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
    return result.Items && result.Items.length > 0 ? (result.Items[0] as Movie) : null;
  }

  /**
   * Search movies by title (partial match)
   */
  async searchByTitle(titleQuery: string, limit?: number): Promise<Movie[]> {
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
    return (result.Items || []) as Movie[];
  }

  /**
   * Find movies by genre
   */
  async findByGenre(genre: string, limit?: number): Promise<Movie[]> {
    const command = new QueryCommand({
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
