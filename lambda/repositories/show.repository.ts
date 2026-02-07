/**
 * Show repository for DynamoDB operations
 */

import { BaseRepository } from './base.repository';
import {
  Show,
  CreateShowInput,
  UpdateShowInput,
  getShowPK,
  getShowSK,
} from '../models/show.model';

export class ShowRepository extends BaseRepository {
  /**
   * Create a new show
   */
  async createShow(input: CreateShowInput): Promise<Show> {
    const timestamp = this.getCurrentTimestamp();

    const show: Show = {
      PK: getShowPK(input.showId),
      SK: getShowSK(),
      entityType: 'SHOW',
      showId: input.showId,
      title: input.title,
      startYear: input.startYear,
      endYear: input.endYear,
      genres: input.genres || [],
      creators: input.creators || [],
      cast: input.cast || [],
      synopsis: input.synopsis,
      posterUrl: input.posterUrl,
      numberOfSeasons: input.numberOfSeasons,
      numberOfEpisodes: input.numberOfEpisodes,
      status: input.status || 'ongoing',
      tmdbId: input.tmdbId,
      imdbId: input.imdbId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.putItem(show);
    return show;
  }

  /**
   * Get show by ID
   */
  async getShowById(showId: string): Promise<Show | null> {
    const item = await this.getItem(getShowPK(showId), getShowSK());
    return item as Show | null;
  }

  /**
   * Update show
   */
  async updateShow(
    showId: string,
    input: UpdateShowInput
  ): Promise<Show | null> {
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

    if (input.startYear !== undefined) {
      updateParts.push('#startYear = :startYear');
      attributeNames['#startYear'] = 'startYear';
      attributeValues[':startYear'] = input.startYear;
    }

    if (input.endYear !== undefined) {
      updateParts.push('#endYear = :endYear');
      attributeNames['#endYear'] = 'endYear';
      attributeValues[':endYear'] = input.endYear;
    }

    if (input.genres !== undefined) {
      updateParts.push('#genres = :genres');
      attributeNames['#genres'] = 'genres';
      attributeValues[':genres'] = input.genres;
    }

    if (input.creators !== undefined) {
      updateParts.push('#creators = :creators');
      attributeNames['#creators'] = 'creators';
      attributeValues[':creators'] = input.creators;
    }

    if (input.cast !== undefined) {
      updateParts.push('#cast = :cast');
      attributeNames['#cast'] = 'cast';
      attributeValues[':cast'] = input.cast;
    }

    if (input.synopsis !== undefined) {
      updateParts.push('#synopsis = :synopsis');
      attributeNames['#synopsis'] = 'synopsis';
      attributeValues[':synopsis'] = input.synopsis;
    }

    if (input.posterUrl !== undefined) {
      updateParts.push('#posterUrl = :posterUrl');
      attributeNames['#posterUrl'] = 'posterUrl';
      attributeValues[':posterUrl'] = input.posterUrl;
    }

    if (input.numberOfSeasons !== undefined) {
      updateParts.push('#numberOfSeasons = :numberOfSeasons');
      attributeNames['#numberOfSeasons'] = 'numberOfSeasons';
      attributeValues[':numberOfSeasons'] = input.numberOfSeasons;
    }

    if (input.numberOfEpisodes !== undefined) {
      updateParts.push('#numberOfEpisodes = :numberOfEpisodes');
      attributeNames['#numberOfEpisodes'] = 'numberOfEpisodes';
      attributeValues[':numberOfEpisodes'] = input.numberOfEpisodes;
    }

    if (input.status !== undefined) {
      updateParts.push('#status = :status');
      attributeNames['#status'] = 'status';
      attributeValues[':status'] = input.status;
    }

    if (input.rating !== undefined) {
      updateParts.push('#rating = :rating');
      attributeNames['#rating'] = 'rating';
      attributeValues[':rating'] = input.rating;
    }

    if (input.tmdbId !== undefined) {
      updateParts.push('#tmdbId = :tmdbId');
      attributeNames['#tmdbId'] = 'tmdbId';
      attributeValues[':tmdbId'] = input.tmdbId;
    }

    if (input.imdbId !== undefined) {
      updateParts.push('#imdbId = :imdbId');
      attributeNames['#imdbId'] = 'imdbId';
      attributeValues[':imdbId'] = input.imdbId;
    }

    const updateExpression = 'SET ' + updateParts.join(', ');

    const result = await this.updateItem(
      getShowPK(showId),
      getShowSK(),
      updateExpression,
      attributeNames,
      attributeValues
    );

    return result as Show;
  }

  /**
   * Delete show
   */
  async deleteShow(showId: string): Promise<void> {
    await this.deleteItem(getShowPK(showId), getShowSK());
  }

  /**
   * Get all shows using GSI4
   */
  async getAllShows(limit: number = 50): Promise<Show[]> {
    const items = await this.query({
      IndexName: 'GSI4',
      KeyConditionExpression: 'entityType = :entityType',
      ExpressionAttributeValues: {
        ':entityType': 'SHOW',
      },
      Limit: limit,
      ScanIndexForward: false, // Most recent first
    });

    return items as Show[];
  }
}
