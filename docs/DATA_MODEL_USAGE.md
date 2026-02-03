# Data Model Usage Examples

This document provides examples of how to use the DynamoDB data model and repositories in the WorthWatch backend.

## Table of Contents

- [Initialization](#initialization)
- [User Operations](#user-operations)
- [Watchlist Operations](#watchlist-operations)
- [Movie Operations](#movie-operations)
- [Show Operations](#show-operations)
- [Integration Examples](#integration-examples)

## Initialization

The repositories automatically use the `DDB_TABLE_NAME` environment variable set by CDK.

```typescript
import {
  UserRepository,
  WatchlistRepository,
  MovieRepository,
  ShowRepository,
} from './repositories';

// Instantiate repositories
const userRepo = new UserRepository();
const watchlistRepo = new WatchlistRepository();
const movieRepo = new MovieRepository();
const showRepo = new ShowRepository();
```

## User Operations

### Create a User

```typescript
import { randomUUID } from 'crypto';

const newUser = await userRepo.createUser({
  userId: randomUUID(),
  email: 'curator@example.com',
  username: 'John Curator',
  bio: 'I love sci-fi movies and TV shows',
  isCurator: true,
});

console.log('Created user:', newUser);
```

### Get User by ID

```typescript
const userId = '123e4567-e89b-12d3-a456-426614174000';
const user = await userRepo.getUserById(userId);

if (user) {
  console.log('Found user:', user.username);
} else {
  console.log('User not found');
}
```

### Get User by Email

```typescript
const user = await userRepo.getUserByEmail('curator@example.com');

if (user) {
  console.log('Found user:', user.username);
}
```

### Update User

```typescript
const userId = '123e4567-e89b-12d3-a456-426614174000';

const updatedUser = await userRepo.updateUser(userId, {
  bio: 'Updated biography',
  curatorStatus: 'approved',
});

console.log('Updated user:', updatedUser);
```

### Delete User

```typescript
const userId = '123e4567-e89b-12d3-a456-426614174000';
await userRepo.deleteUser(userId);
console.log('User deleted');
```

## Watchlist Operations

### Create a Watchlist

```typescript
import { randomUUID } from 'crypto';

const newWatchlist = await watchlistRepo.createWatchlist({
  watchlistId: randomUUID(),
  curatorId: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Best Sci-Fi Movies of 2025',
  description: 'A curated list of must-watch science fiction films',
  isPublic: true,
  tags: ['sci-fi', '2025', 'must-watch'],
});

console.log('Created watchlist:', newWatchlist);
```

### Get Watchlist by ID

```typescript
const watchlistId = 'abc12345-6789-0def-ghij-klmnopqrstuv';
const watchlist = await watchlistRepo.getWatchlistById(watchlistId);

if (watchlist) {
  console.log('Found watchlist:', watchlist.title);
  console.log('Items count:', watchlist.itemCount);
}
```

### Get Watchlists by Curator

```typescript
const curatorId = '123e4567-e89b-12d3-a456-426614174000';
const watchlists = await watchlistRepo.getWatchlistsByCurator(curatorId);

console.log(`Found ${watchlists.length} watchlists by curator`);
watchlists.forEach((wl) => console.log('-', wl.title));
```

### Get Public Watchlists

```typescript
const publicWatchlists = await watchlistRepo.getPublicWatchlists(10);

console.log(`Found ${publicWatchlists.length} public watchlists`);
publicWatchlists.forEach((wl) => console.log('-', wl.title));
```

### Update Watchlist

```typescript
const watchlistId = 'abc12345-6789-0def-ghij-klmnopqrstuv';

const updated = await watchlistRepo.updateWatchlist(watchlistId, {
  title: 'Best Sci-Fi Movies of 2025 (Updated)',
  description: 'Updated description',
  tags: ['sci-fi', '2025', 'must-watch', 'updated'],
});

console.log('Updated watchlist:', updated);
```

### Add Item to Watchlist

```typescript
const watchlistId = 'abc12345-6789-0def-ghij-klmnopqrstuv';

// Add a movie to the watchlist
const item = await watchlistRepo.addWatchlistItem({
  watchlistId,
  contentType: 'MOVIE',
  contentId: 'tt1375666', // Inception IMDB ID
  position: 1,
  curatorNote: 'A masterpiece of modern sci-fi cinema',
});

console.log('Added item to watchlist:', item);
```

### Get Watchlist Items

```typescript
const watchlistId = 'abc12345-6789-0def-ghij-klmnopqrstuv';
const items = await watchlistRepo.getWatchlistItems(watchlistId);

console.log(`Watchlist has ${items.length} items`);
items.forEach((item) => {
  console.log(
    `-`,
    item.contentType,
    item.contentId,
    item.curatorNote || '(no note)'
  );
});
```

### Remove Item from Watchlist

```typescript
const watchlistId = 'abc12345-6789-0def-ghij-klmnopqrstuv';

await watchlistRepo.removeWatchlistItem(watchlistId, 'MOVIE', 'tt1375666');

console.log('Item removed from watchlist');
```

### Delete Watchlist

```typescript
const watchlistId = 'abc12345-6789-0def-ghij-klmnopqrstuv';

// This will delete the watchlist and all its items
await watchlistRepo.deleteWatchlist(watchlistId);

console.log('Watchlist and all items deleted');
```

## Movie Operations

### Create a Movie

```typescript
const newMovie = await movieRepo.createMovie({
  movieId: 'tt1375666', // IMDB ID
  title: 'Inception',
  releaseYear: 2010,
  genres: ['Action', 'Sci-Fi', 'Thriller'],
  directors: ['Christopher Nolan'],
  cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page'],
  synopsis:
    'A thief who steals corporate secrets through the use of dream-sharing technology...',
  runtime: 148,
  posterUrl: 'https://example.com/posters/inception.jpg',
  tmdbId: '27205',
  imdbId: 'tt1375666',
});

console.log('Created movie:', newMovie);
```

### Get Movie by ID

```typescript
const movieId = 'tt1375666';
const movie = await movieRepo.getMovieById(movieId);

if (movie) {
  console.log('Found movie:', movie.title);
  console.log('Year:', movie.releaseYear);
  console.log('Genres:', movie.genres.join(', '));
}
```

### Update Movie

```typescript
const movieId = 'tt1375666';

const updated = await movieRepo.updateMovie(movieId, {
  rating: 8.8,
  synopsis: 'Updated synopsis...',
});

console.log('Updated movie:', updated);
```

### Get All Movies

```typescript
const movies = await movieRepo.getAllMovies(20);

console.log(`Found ${movies.length} movies`);
movies.forEach((movie) => console.log('-', movie.title, `(${movie.releaseYear})`));
```

### Delete Movie

```typescript
const movieId = 'tt1375666';
await movieRepo.deleteMovie(movieId);
console.log('Movie deleted');
```

## Show Operations

### Create a Show

```typescript
const newShow = await showRepo.createShow({
  showId: 'tt0944947', // Game of Thrones IMDB ID
  title: 'Game of Thrones',
  startYear: 2011,
  endYear: 2019,
  genres: ['Action', 'Adventure', 'Drama'],
  creators: ['David Benioff', 'D.B. Weiss'],
  cast: ['Emilia Clarke', 'Peter Dinklage', 'Kit Harington'],
  synopsis: 'Nine noble families fight for control over the lands of Westeros...',
  numberOfSeasons: 8,
  numberOfEpisodes: 73,
  status: 'ended',
  posterUrl: 'https://example.com/posters/got.jpg',
  tmdbId: '1399',
  imdbId: 'tt0944947',
});

console.log('Created show:', newShow);
```

### Get Show by ID

```typescript
const showId = 'tt0944947';
const show = await showRepo.getShowById(showId);

if (show) {
  console.log('Found show:', show.title);
  console.log('Seasons:', show.numberOfSeasons);
  console.log('Status:', show.status);
}
```

### Update Show

```typescript
const showId = 'tt0944947';

const updated = await showRepo.updateShow(showId, {
  rating: 9.2,
  synopsis: 'Updated synopsis...',
});

console.log('Updated show:', updated);
```

### Get All Shows

```typescript
const shows = await showRepo.getAllShows(20);

console.log(`Found ${shows.length} shows`);
shows.forEach((show) =>
  console.log('-', show.title, `(${show.startYear}-${show.endYear || 'Present'})`)
);
```

### Delete Show

```typescript
const showId = 'tt0944947';
await showRepo.deleteShow(showId);
console.log('Show deleted');
```

## Integration Examples

### Complete Workflow: Create Curator and Watchlist

```typescript
import { randomUUID } from 'crypto';

// 1. Create a curator user
const curator = await userRepo.createUser({
  userId: randomUUID(),
  email: 'sarah@example.com',
  username: 'Sarah the Curator',
  isCurator: true,
  bio: 'Sci-fi enthusiast and movie buff',
});

// 2. Create a watchlist
const watchlist = await watchlistRepo.createWatchlist({
  watchlistId: randomUUID(),
  curatorId: curator.userId,
  title: 'Mind-Bending Sci-Fi',
  description: 'Movies that will make you question reality',
  isPublic: true,
  tags: ['sci-fi', 'mind-bending', 'thriller'],
});

// 3. Add some movies
const movie1 = await movieRepo.createMovie({
  movieId: 'tt0133093',
  title: 'The Matrix',
  releaseYear: 1999,
  genres: ['Action', 'Sci-Fi'],
  directors: ['Lana Wachowski', 'Lilly Wachowski'],
  imdbId: 'tt0133093',
});

const movie2 = await movieRepo.createMovie({
  movieId: 'tt1375666',
  title: 'Inception',
  releaseYear: 2010,
  genres: ['Action', 'Sci-Fi', 'Thriller'],
  directors: ['Christopher Nolan'],
  imdbId: 'tt1375666',
});

// 4. Add movies to watchlist
await watchlistRepo.addWatchlistItem({
  watchlistId: watchlist.watchlistId,
  contentType: 'MOVIE',
  contentId: movie1.movieId,
  position: 1,
  curatorNote: 'The movie that started it all',
});

await watchlistRepo.addWatchlistItem({
  watchlistId: watchlist.watchlistId,
  contentType: 'MOVIE',
  contentId: movie2.movieId,
  position: 2,
  curatorNote: 'Dreams within dreams',
});

console.log('Watchlist created with 2 movies!');

// 5. Retrieve the complete watchlist
const fullWatchlist = await watchlistRepo.getWatchlistById(watchlist.watchlistId);
const items = await watchlistRepo.getWatchlistItems(watchlist.watchlistId);

console.log(`Watchlist: ${fullWatchlist?.title}`);
console.log(`Curator: ${curator.username}`);
console.log(`Items: ${items.length}`);
items.forEach((item) => console.log(`- ${item.contentType} ${item.contentId}`));
```

### API Handler Example

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { WatchlistRepository } from './repositories';

const watchlistRepo = new WatchlistRepository();

export const getPublicWatchlistsHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit)
      : 20;

    const watchlists = await watchlistRepo.getPublicWatchlists(limit);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        count: watchlists.length,
        watchlists,
      }),
    };
  } catch (error) {
    console.error('Error fetching public watchlists:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Internal server error',
      }),
    };
  }
};
```

## Error Handling

All repository methods will throw errors if DynamoDB operations fail. You should wrap calls in try-catch blocks:

```typescript
try {
  const user = await userRepo.getUserById(userId);
  if (!user) {
    // User not found
    console.log('User not found');
  }
} catch (error) {
  console.error('Error fetching user:', error);
  // Handle error appropriately
}
```

## Best Practices

1. **Use UUIDs for IDs**: Generate unique IDs using `randomUUID()` from the `crypto` module
2. **Validate input**: Use Zod or similar validation library before calling repository methods
3. **Handle not found**: Check for null return values when using `get*` methods
4. **Atomic operations**: The repositories handle atomic updates with proper timestamps
5. **Batch operations**: For bulk operations, consider using DynamoDB batch write operations
6. **Pagination**: Use the limit parameter and implement pagination for large result sets
7. **Error handling**: Always wrap repository calls in try-catch blocks

## Next Steps

- Add validation layer using Zod schemas
- Implement API routes using these repositories
- Add authentication and authorization
- Implement full-text search with OpenSearch
- Add caching layer with ElastiCache
