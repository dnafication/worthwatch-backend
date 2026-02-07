# WorthWatch DynamoDB Data Model Design

## Overview

This document describes the DynamoDB data model for the WorthWatch platform, a curator-led watchlist service that helps users make confident viewing decisions.

## Design Philosophy

### Single-Table Design

We use a **single-table design** approach for DynamoDB, which is the recommended best practice for most DynamoDB applications. This approach:

- Reduces costs by minimizing the number of tables
- Improves performance through co-location of related data
- Simplifies transactions (all items in same table)
- Enables complex access patterns with GSIs (Global Secondary Indexes)

### Key Structure

**Primary Key:**
- **Partition Key (PK)**: Entity type + ID (e.g., `USER#123`, `WATCHLIST#456`)
- **Sort Key (SK)**: Relationship or metadata (e.g., `PROFILE`, `ITEM#MOVIE#789`)

This allows us to:
1. Store multiple entity types in one table
2. Query relationships efficiently
3. Support hierarchical data structures

## Entities

### 1. User

Represents a user account in the WorthWatch platform.

**Attributes:**
- `PK`: `USER#<userId>`
- `SK`: `PROFILE`
- `entityType`: `USER`
- `userId`: Unique user identifier (UUID)
- `email`: User's email address (required, unique)
- `username`: Display name (required)
- `createdAt`: ISO 8601 timestamp
- `updatedAt`: ISO 8601 timestamp
- `bio`: Optional user biography
- `avatarUrl`: Optional profile picture URL
- `isCurator`: Boolean indicating if user is a curator
- `curatorStatus`: If curator: `pending`, `approved`, `suspended`

**Access Patterns:**
- Get user by ID: Query `PK = USER#<userId>` AND `SK = PROFILE`
- Get user by email: GSI on email (GSI1)

### 2. Watchlist

Represents a curated collection of movies/shows created by a curator.

**Attributes:**
- `PK`: `WATCHLIST#<watchlistId>`
- `SK`: `METADATA`
- `entityType`: `WATCHLIST`
- `watchlistId`: Unique watchlist identifier (UUID)
- `curatorId`: ID of the curator who created it
- `title`: Watchlist title (required)
- `description`: Watchlist description
- `coverImageUrl`: Optional cover image
- `isPublic`: Boolean (default: true)
- `isPublicStr`: String representation of isPublic ('true' or 'false') for GSI3
- `tags`: Array of tags/categories
- `itemCount`: Number of items in the watchlist (denormalized)
- `createdAt`: ISO 8601 timestamp
- `updatedAt`: ISO 8601 timestamp

**Access Patterns:**
- Get watchlist by ID: Query `PK = WATCHLIST#<watchlistId>` AND `SK = METADATA`
- Get watchlists by curator: GSI on curatorId (GSI2)
- List all public watchlists: GSI on isPublicStr + createdAt (GSI3)

### 3. Watchlist Items (Movie/Show references)

Represents the relationship between a watchlist and a movie/show.

**Attributes:**
- `PK`: `WATCHLIST#<watchlistId>`
- `SK`: `ITEM#<contentType>#<contentId>` (e.g., `ITEM#MOVIE#123` or `ITEM#SHOW#456`)
- `entityType`: `WATCHLIST_ITEM`
- `contentType`: `MOVIE` or `SHOW`
- `contentId`: ID of the movie or show
- `position`: Integer for ordering items in the watchlist
- `curatorNote`: Optional curator's note about this item
- `addedAt`: ISO 8601 timestamp

**Access Patterns:**
- Get all items in a watchlist: Query `PK = WATCHLIST#<watchlistId>` AND `SK BEGINS_WITH ITEM#`
- Get specific item: Query `PK = WATCHLIST#<watchlistId>` AND `SK = ITEM#<type>#<id>`

### 4. Movie

Represents a movie in the platform.

**Attributes:**
- `PK`: `MOVIE#<movieId>`
- `SK`: `METADATA`
- `entityType`: `MOVIE`
- `movieId`: Unique identifier (could be TMDB ID or UUID)
- `title`: Movie title (required)
- `releaseYear`: Year of release
- `genres`: Array of genres
- `directors`: Array of director names
- `cast`: Array of main cast members
- `synopsis`: Movie description
- `posterUrl`: Movie poster image URL
- `runtime`: Runtime in minutes
- `rating`: Average rating (if we support ratings)
- `tmdbId`: The Movie Database (TMDB) ID for external reference
- `imdbId`: IMDB ID for external reference
- `createdAt`: ISO 8601 timestamp
- `updatedAt`: ISO 8601 timestamp

**Access Patterns:**
- Get movie by ID: Query `PK = MOVIE#<movieId>` AND `SK = METADATA`
- Search movies: Consider using OpenSearch/ElasticSearch for full-text search

### 5. Show (TV Series)

Represents a TV show/series in the platform.

**Attributes:**
- `PK`: `SHOW#<showId>`
- `SK`: `METADATA`
- `entityType`: `SHOW`
- `showId`: Unique identifier (could be TMDB ID or UUID)
- `title`: Show title (required)
- `startYear`: Year the show started
- `endYear`: Year the show ended (null if ongoing)
- `genres`: Array of genres
- `creators`: Array of creator names
- `cast`: Array of main cast members
- `synopsis`: Show description
- `posterUrl`: Show poster image URL
- `numberOfSeasons`: Total number of seasons
- `numberOfEpisodes`: Total number of episodes
- `status`: `ongoing`, `ended`, `cancelled`
- `rating`: Average rating (if we support ratings)
- `tmdbId`: The Movie Database (TMDB) ID
- `imdbId`: IMDB ID
- `createdAt`: ISO 8601 timestamp
- `updatedAt`: ISO 8601 timestamp

**Access Patterns:**
- Get show by ID: Query `PK = SHOW#<showId>` AND `SK = METADATA`
- Search shows: Consider using OpenSearch/ElasticSearch for full-text search

## Global Secondary Indexes (GSIs)

### GSI1: Email Index
- **Partition Key**: `email`
- **Sort Key**: None
- **Purpose**: Look up users by email address
- **Projection**: ALL or KEYS_ONLY + specific attributes

### GSI2: Curator Watchlists Index
- **Partition Key**: `curatorId`
- **Sort Key**: `createdAt`
- **Purpose**: Get all watchlists created by a curator, sorted by creation date
- **Projection**: ALL

### GSI3: Public Watchlists Index
- **Partition Key**: `isPublicStr` (string representation: 'true' or 'false')
- **Sort Key**: `createdAt`
- **Purpose**: List all public watchlists, sorted by creation date (for discovery)
- **Projection**: ALL
- **Note**: We use a string representation because DynamoDB GSIs work better with string partition keys

### GSI4: Entity Type Index (Optional)
- **Partition Key**: `entityType`
- **Sort Key**: `createdAt`
- **Purpose**: Query all entities of a specific type
- **Projection**: KEYS_ONLY

## Additional Considerations

### User Watchlist Relationships (Future)

To track which watchlists a user has saved/followed:

**Attributes:**
- `PK`: `USER#<userId>`
- `SK`: `SAVED#WATCHLIST#<watchlistId>`
- `entityType`: `USER_SAVED_WATCHLIST`
- `savedAt`: ISO 8601 timestamp

**Access Pattern:**
- Get user's saved watchlists: Query `PK = USER#<userId>` AND `SK BEGINS_WITH SAVED#WATCHLIST#`

### Ratings (Future)

If users can rate movies/shows:

**Attributes:**
- `PK`: `USER#<userId>`
- `SK`: `RATING#<contentType>#<contentId>`
- `entityType`: `RATING`
- `contentType`: `MOVIE` or `SHOW`
- `contentId`: ID of the content
- `rating`: Numeric rating (e.g., 1-5 or 1-10)
- `review`: Optional text review
- `ratedAt`: ISO 8601 timestamp

### Comments (Future)

If users can comment on watchlists:

**Attributes:**
- `PK`: `WATCHLIST#<watchlistId>`
- `SK`: `COMMENT#<timestamp>#<userId>`
- `entityType`: `COMMENT`
- `userId`: ID of the commenter
- `commentText`: The comment content
- `createdAt`: ISO 8601 timestamp

## Table Configuration

### Primary Table

**Table Name**: Configured via CDK (currently auto-generated)

**Billing Mode**: PAY_PER_REQUEST (on-demand)
- Best for unpredictable or spiky workloads
- No need to manage capacity units

**Encryption**: AWS managed keys (SSE)

**Point-in-Time Recovery**: Enable for production

**DynamoDB Streams**: Consider enabling for:
- Trigger notifications when watchlists are updated
- Maintain search indexes in OpenSearch
- Analytics and auditing

## Implementation Strategy

### Phase 1: Core Entities (Current Focus)
1. Define TypeScript types for all entities
2. Update CDK stack if GSIs are needed
3. Create data access layer (repository pattern)
4. Implement CRUD operations for User, Watchlist, Movie, Show

### Phase 2: Relationships
1. Implement watchlist items management
2. User-watchlist relationships (saved/followed)

### Phase 3: Enhancements
1. Add ratings and reviews
2. Add comments on watchlists
3. Implement search with OpenSearch/ElasticSearch

## Code Organization

```
lambda/
├── models/
│   ├── user.model.ts          # User entity type definitions
│   ├── watchlist.model.ts     # Watchlist entity type definitions
│   ├── movie.model.ts         # Movie entity type definitions
│   ├── show.model.ts          # Show entity type definitions
│   └── index.ts               # Export all models
├── repositories/
│   ├── base.repository.ts     # Base repository with common DynamoDB operations
│   ├── user.repository.ts     # User data access
│   ├── watchlist.repository.ts
│   ├── movie.repository.ts
│   ├── show.repository.ts
│   └── index.ts
├── services/                  # Business logic layer
└── routes/                    # API route handlers
```

## Example Items in DynamoDB

### User Item
```json
{
  "PK": "USER#123e4567-e89b-12d3-a456-426614174000",
  "SK": "PROFILE",
  "entityType": "USER",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "email": "john@example.com",
  "username": "johndoe",
  "isCurator": true,
  "curatorStatus": "approved",
  "createdAt": "2026-01-15T10:30:00Z",
  "updatedAt": "2026-01-15T10:30:00Z"
}
```

### Watchlist Item
```json
{
  "PK": "WATCHLIST#abc12345-6789-0def-ghij-klmnopqrstuv",
  "SK": "METADATA",
  "entityType": "WATCHLIST",
  "watchlistId": "abc12345-6789-0def-ghij-klmnopqrstuv",
  "curatorId": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Best Sci-Fi Movies of 2025",
  "description": "A curated list of must-watch science fiction films",
  "isPublic": true,
  "isPublicStr": "true",
  "tags": ["sci-fi", "2025", "must-watch"],
  "itemCount": 10,
  "createdAt": "2026-01-20T14:00:00Z",
  "updatedAt": "2026-01-20T14:00:00Z"
}
```

### Watchlist Item (Movie Reference)
```json
{
  "PK": "WATCHLIST#abc12345-6789-0def-ghij-klmnopqrstuv",
  "SK": "ITEM#MOVIE#tt1234567",
  "entityType": "WATCHLIST_ITEM",
  "contentType": "MOVIE",
  "contentId": "tt1234567",
  "position": 1,
  "curatorNote": "A masterpiece of modern sci-fi cinema",
  "addedAt": "2026-01-20T14:05:00Z"
}
```

### Movie Item
```json
{
  "PK": "MOVIE#tt1234567",
  "SK": "METADATA",
  "entityType": "MOVIE",
  "movieId": "tt1234567",
  "title": "Inception",
  "releaseYear": 2010,
  "genres": ["Action", "Sci-Fi", "Thriller"],
  "directors": ["Christopher Nolan"],
  "synopsis": "A thief who steals corporate secrets...",
  "runtime": 148,
  "tmdbId": "27205",
  "imdbId": "tt1375666",
  "createdAt": "2026-01-10T08:00:00Z",
  "updatedAt": "2026-01-10T08:00:00Z"
}
```

## Migration Path

Since we currently have a simple table with `id` as the partition key:

1. **Option A: Migrate existing table** (if there's data)
   - Use DynamoDB Streams + Lambda to transform data
   - Write migration scripts

2. **Option B: Create new table with proper schema** (recommended for early stage)
   - Update CDK to create table with PK/SK structure
   - Configure GSIs
   - Deploy as new table

## Conclusion

This single-table design provides:
- ✅ Efficient access patterns for all entities
- ✅ Scalable structure that can grow with the platform
- ✅ Cost-effective (one table, pay-per-request)
- ✅ Flexible schema for future features
- ✅ Follows DynamoDB best practices
