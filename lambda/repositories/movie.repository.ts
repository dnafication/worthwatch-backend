/**
 * Movie repository for DynamoDB operations
 */

import { BaseRepository } from './base.repository';
import {
  Movie,
  CreateMovieInput,
  UpdateMovieInput,
  getMoviePK,
  getMovieSK,
} from '../models/movie.model';

export class MovieRepository extends BaseRepository {
  /**
   * Create a new movie
   */
  async createMovie(input: CreateMovieInput): Promise<Movie> {
    const timestamp = this.getCurrentTimestamp();

    const movie: Movie = {
      PK: getMoviePK(input.movieId),
      SK: getMovieSK(),
      entityType: 'MOVIE',
      movieId: input.movieId,
      title: input.title,
      releaseYear: input.releaseYear,
      genres: input.genres || [],
      directors: input.directors || [],
      cast: input.cast || [],
      synopsis: input.synopsis,
      posterUrl: input.posterUrl,
      runtime: input.runtime,
      tmdbId: input.tmdbId,
      imdbId: input.imdbId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.putItem(movie);
    return movie;
  }

  /**
   * Get movie by ID
   */
  async getMovieById(movieId: string): Promise<Movie | null> {
    const item = await this.getItem(getMoviePK(movieId), getMovieSK());
    return item as Movie | null;
  }

  /**
   * Update movie
   */
  async updateMovie(
    movieId: string,
    input: UpdateMovieInput
  ): Promise<Movie | null> {
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

    if (input.releaseYear !== undefined) {
      updateParts.push('#releaseYear = :releaseYear');
      attributeNames['#releaseYear'] = 'releaseYear';
      attributeValues[':releaseYear'] = input.releaseYear;
    }

    if (input.genres !== undefined) {
      updateParts.push('#genres = :genres');
      attributeNames['#genres'] = 'genres';
      attributeValues[':genres'] = input.genres;
    }

    if (input.directors !== undefined) {
      updateParts.push('#directors = :directors');
      attributeNames['#directors'] = 'directors';
      attributeValues[':directors'] = input.directors;
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

    if (input.runtime !== undefined) {
      updateParts.push('#runtime = :runtime');
      attributeNames['#runtime'] = 'runtime';
      attributeValues[':runtime'] = input.runtime;
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
      getMoviePK(movieId),
      getMovieSK(),
      updateExpression,
      attributeNames,
      attributeValues
    );

    return result as Movie;
  }

  /**
   * Delete movie
   */
  async deleteMovie(movieId: string): Promise<void> {
    await this.deleteItem(getMoviePK(movieId), getMovieSK());
  }

  /**
   * Get all movies using GSI4
   */
  async getAllMovies(limit: number = 50): Promise<Movie[]> {
    const items = await this.query({
      IndexName: 'GSI4',
      KeyConditionExpression: 'entityType = :entityType',
      ExpressionAttributeValues: {
        ':entityType': 'MOVIE',
      },
      Limit: limit,
      ScanIndexForward: false, // Most recent first
    });

    return items as Movie[];
  }
}
