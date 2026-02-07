# DynamoDB Access Patterns and Examples

This document provides practical examples of using the WorthWatch data access layer.

## Repository Usage

### User Operations

```typescript
import { UserRepository } from './repositories';

const userRepo = new UserRepository();

// Create a new user
const newUser = await userRepo.create({
  email: 'curator@example.com',
  username: 'movielover',
  bio: 'Film enthusiast and curator',
  avatarUrl: 'https://example.com/avatar.jpg',
  isVerified: false,
});

// Get user by ID
const user = await userRepo.getById('USER#123-456');

// Find user by email
const userByEmail = await userRepo.findByEmail('curator@example.com');

// Update user profile
const updatedUser = await userRepo.update('USER#123-456', {
  bio: 'Updated bio',
  isVerified: true,
});

// List verified curators
const curators = await userRepo.listVerifiedCurators(10);
```

### Watchlist Operations

```typescript
import { WatchlistRepository } from './repositories';

const watchlistRepo = new WatchlistRepository();

// Create a new watchlist
const newWatchlist = await watchlistRepo.create({
  userId: 'USER#123-456',
  title: 'Best Sci-Fi Movies of All Time',
  description: 'A curated collection of must-watch science fiction films',
  isPublic: true,
  tags: ['sci-fi', 'classics', 'mind-bending'],
  itemCount: 0,
  likeCount: 0,
  viewCount: 0,
  creatorUsername: 'movielover',
});

// Get watchlist by ID
const watchlist = await watchlistRepo.getById('WATCHLIST#789-012');

// Get user's watchlists
const userWatchlists = await watchlistRepo.findByUserId('USER#123-456');

// List public watchlists
const publicWatchlists = await watchlistRepo.listPublic(20);

// Find watchlists by tag
const sciFiLists = await watchlistRepo.findByTag('sci-fi');

// Update watchlist
const updated = await watchlistRepo.update('WATCHLIST#789-012', {
  title: 'Updated Title',
  tags: ['sci-fi', 'classics', 'mind-bending', 'space'],
});

// Increment view count
await watchlistRepo.incrementViewCount('WATCHLIST#789-012');

// Delete watchlist
await watchlistRepo.delete('WATCHLIST#789-012');
```

### Movie Operations

```typescript
import { MovieRepository } from './repositories';

const movieRepo = new MovieRepository();

// Create a new movie
const newMovie = await movieRepo.create({
  title: 'Inception',
  originalTitle: 'Inception',
  releaseYear: 2010,
  posterUrl: 'https://example.com/inception-poster.jpg',
  backdropUrl: 'https://example.com/inception-backdrop.jpg',
  overview: 'A thief who steals corporate secrets...',
  genres: ['Science Fiction', 'Action', 'Thriller'],
  runtime: 148,
  rating: 8.8,
  tmdbId: '27205',
  imdbId: 'tt1375666',
});

// Get movie by ID
const movie = await movieRepo.getById('MOVIE#27205');

// Find by TMDB ID
const movieByTmdb = await movieRepo.findByTmdbId('27205');

// Find by IMDB ID
const movieByImdb = await movieRepo.findByImdbId('tt1375666');

// Search movies by title
const movies = await movieRepo.searchByTitle('Inception');

// Find movies by genre
const actionMovies = await movieRepo.findByGenre('Action', 20);
```

### Show Operations

```typescript
import { ShowRepository } from './repositories';

const showRepo = new ShowRepository();

// Create a new show
const newShow = await showRepo.create({
  title: 'Breaking Bad',
  originalTitle: 'Breaking Bad',
  firstAirDate: '2008-01-20',
  lastAirDate: '2013-09-29',
  status: 'Ended',
  numberOfSeasons: 5,
  numberOfEpisodes: 62,
  posterUrl: 'https://example.com/bb-poster.jpg',
  overview: 'A high school chemistry teacher turned meth cook...',
  genres: ['Drama', 'Crime', 'Thriller'],
  rating: 9.5,
  tmdbId: '1396',
  imdbId: 'tt0903747',
});

// Get show by ID
const show = await showRepo.getById('SHOW#1396');

// Find by TMDB ID
const showByTmdb = await showRepo.findByTmdbId('1396');

// Search shows by title
const shows = await showRepo.searchByTitle('Breaking');

// Find shows by status
const returningShows = await showRepo.findByStatus('Returning', 10);
```

### WatchlistItem Operations

```typescript
import { WatchlistItemRepository } from './repositories';

const itemRepo = new WatchlistItemRepository();

// Add item to watchlist
const newItem = await itemRepo.create({
  watchlistId: 'WATCHLIST#789-012',
  itemId: 'MOVIE#27205',
  itemType: 'MOVIE',
  order: 0,
  curatorNote: 'A masterpiece of modern cinema',
  addedAt: new Date().toISOString(),
  title: 'Inception',
  posterUrl: 'https://example.com/inception-poster.jpg',
  releaseYear: 2010,
});

// Get all items in a watchlist
const items = await itemRepo.findByWatchlistId('WATCHLIST#789-012');

// Find specific item in watchlist
const item = await itemRepo.findByWatchlistAndItemId(
  'WATCHLIST#789-012',
  'MOVIE#27205'
);

// Count items in watchlist
const count = await itemRepo.countByWatchlistId('WATCHLIST#789-012');

// Reorder items
await itemRepo.reorder([
  { id: 'WATCHLIST_ITEM#1', order: 0 },
  { id: 'WATCHLIST_ITEM#2', order: 1 },
  { id: 'WATCHLIST_ITEM#3', order: 2 },
]);

// Remove item from watchlist
await itemRepo.delete('WATCHLIST_ITEM#123');
```

### Like Operations

```typescript
import { LikeRepository } from './repositories';

const likeRepo = new LikeRepository();

// Like a watchlist
const like = await likeRepo.createLike('USER#123-456', 'WATCHLIST#789-012');

// Check if user has liked a watchlist
const hasLiked = await likeRepo.hasLiked('USER#123-456', 'WATCHLIST#789-012');

// Get all watchlists liked by user
const likedWatchlists = await likeRepo.findByUserId('USER#123-456');

// Get all likes for a watchlist
const likes = await likeRepo.findByWatchlistId('WATCHLIST#789-012');

// Unlike a watchlist
await likeRepo.unlike('USER#123-456', 'WATCHLIST#789-012');
```

## Validation with Zod

All input should be validated using Zod schemas before creating or updating entities:

```typescript
import { createUserSchema, createWatchlistSchema } from './schemas/validation';

// Validate user input
const userInput = {
  email: 'curator@example.com',
  username: 'movielover',
  bio: 'Film enthusiast',
};

const validatedUser = createUserSchema.parse(userInput);
// If validation fails, it will throw a ZodError

// Safe parsing (returns result object)
const result = createUserSchema.safeParse(userInput);
if (result.success) {
  const user = await userRepo.create(result.data);
} else {
  console.error('Validation errors:', result.error.format());
}
```

## Common Patterns

### Creating a Complete Watchlist with Items

```typescript
import {
  WatchlistRepository,
  WatchlistItemRepository,
  MovieRepository,
} from './repositories';

async function createWatchlistWithItems(
  userId: string,
  title: string,
  movieIds: string[]
) {
  const watchlistRepo = new WatchlistRepository();
  const itemRepo = new WatchlistItemRepository();
  const movieRepo = new MovieRepository();

  // Create the watchlist
  const watchlist = await watchlistRepo.create({
    userId,
    title,
    description: '',
    isPublic: true,
    tags: [],
    itemCount: 0,
    likeCount: 0,
    viewCount: 0,
  });

  // Add movies to watchlist
  for (let i = 0; i < movieIds.length; i++) {
    const movie = await movieRepo.getById(movieIds[i]);
    if (movie) {
      await itemRepo.create({
        watchlistId: watchlist.id,
        itemId: movie.id,
        itemType: 'MOVIE',
        order: i,
        title: movie.title,
        posterUrl: movie.posterUrl,
        releaseYear: movie.releaseYear,
        addedAt: new Date().toISOString(),
      });
    }
  }

  // Update item count
  await watchlistRepo.update(watchlist.id, {
    itemCount: movieIds.length,
  } as any);

  return watchlist;
}
```

### Handling Likes with Counts

```typescript
import { LikeRepository, WatchlistRepository } from './repositories';

async function toggleLike(userId: string, watchlistId: string) {
  const likeRepo = new LikeRepository();
  const watchlistRepo = new WatchlistRepository();

  const hasLiked = await likeRepo.hasLiked(userId, watchlistId);

  if (hasLiked) {
    // Unlike
    await likeRepo.unlike(userId, watchlistId);
    await watchlistRepo.decrementLikeCount(watchlistId);
  } else {
    // Like
    await likeRepo.createLike(userId, watchlistId);
    await watchlistRepo.incrementLikeCount(watchlistId);
  }

  return !hasLiked;
}
```

## Error Handling

Always wrap repository operations in try-catch blocks:

```typescript
try {
  const user = await userRepo.getById('USER#123');
  if (!user) {
    // Handle not found
    return { statusCode: 404, body: 'User not found' };
  }
  return { statusCode: 200, body: JSON.stringify(user) };
} catch (error) {
  console.error('Database error:', error);
  return { statusCode: 500, body: 'Internal server error' };
}
```

## Best Practices

1. **Use validation schemas**: Always validate input with Zod before database operations
2. **Handle null results**: Check if `getById` returns null before using the result
3. **Use transactions**: For operations that modify multiple entities, use DynamoDB transactions
4. **Denormalize data**: Store frequently accessed data together to minimize queries
5. **Batch operations**: Use batch read/write operations for multiple items
6. **Paginate results**: Always use limits and implement pagination for lists
7. **Index usage**: Design GSIs based on your query patterns
8. **Cache popular data**: Consider caching frequently accessed data (e.g., trending watchlists)
