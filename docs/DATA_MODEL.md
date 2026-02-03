# WorthWatch Data Model Design

## Overview

This document outlines the data modeling strategy for WorthWatch's DynamoDB backend, including design decisions, access patterns, and entity relationships.

## Design Philosophy: Single-Table Design

After careful consideration, we recommend a **single-table design** for WorthWatch. This approach is optimal for DynamoDB because:

1. **Cost Efficiency**: Single table = fewer RCUs/WCUs overall
2. **Performance**: Related data can be fetched in single queries using composite keys
3. **Transactional Support**: Easier to perform atomic operations across entity types
4. **Scalability**: Simpler to manage partition distribution

### Alternative: Multi-Table Design

A multi-table approach (separate tables for Users, Watchlists, Movies, Shows) could be considered if:

- Entities have vastly different access patterns or scaling needs
- Strong isolation between entity types is required for security/compliance
- Team structure benefits from separated ownership

**Decision**: We proceed with **single-table design** as it best fits WorthWatch's access patterns.

## Primary Entities

### 1. User

Represents a platform user who can create watchlists and curate content.

**Attributes:**

- `id` (PK): Unique user identifier (e.g., `USER#<uuid>`)
- `email`: User's email address
- `username`: Display name
- `bio`: User biography/description
- `avatarUrl`: Profile picture URL
- `isVerified`: Curator verification status
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

**Access Patterns:**

- Get user by ID
- Get user by email
- List all verified curators
- Update user profile

### 2. Watchlist

A curated collection of movies/shows created by users.

**Attributes:**

- `id` (PK): Unique watchlist identifier (e.g., `WATCHLIST#<uuid>`)
- `userId` (GSI PK): Creator's user ID
- `title`: Watchlist title
- `description`: Watchlist description
- `isPublic`: Visibility flag
- `tags`: Array of category tags
- `itemCount`: Number of items in the list
- `likeCount`: Number of likes
- `viewCount`: Number of views
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Access Patterns:**

- Get watchlist by ID
- List watchlists by user
- List public watchlists (trending, recent)
- Search watchlists by tags
- Get user's private watchlists

### 3. Movie

Represents a movie that can be added to watchlists.

**Attributes:**

- `id` (PK): Unique movie identifier (e.g., `MOVIE#<tmdb-id>`)
- `title`: Movie title
- `originalTitle`: Original language title
- `releaseYear`: Release year
- `posterUrl`: Poster image URL
- `backdropUrl`: Backdrop image URL
- `overview`: Plot summary
- `genres`: Array of genre tags
- `runtime`: Duration in minutes
- `rating`: Average rating
- `tmdbId`: TMDB API identifier
- `imdbId`: IMDB identifier
- `createdAt`: Entry creation timestamp
- `updatedAt`: Last update timestamp

**Access Patterns:**

- Get movie by ID
- Search movies by title
- Get movies by genre
- Get movie metadata for watchlist items

### 4. Show (TV Series)

Represents a TV show that can be added to watchlists.

**Attributes:**

- `id` (PK): Unique show identifier (e.g., `SHOW#<tmdb-id>`)
- `title`: Show title
- `originalTitle`: Original language title
- `firstAirDate`: First episode air date
- `lastAirDate`: Last episode air date
- `status`: Status (Returning, Ended, Cancelled)
- `numberOfSeasons`: Total seasons
- `numberOfEpisodes`: Total episodes
- `posterUrl`: Poster image URL
- `backdropUrl`: Backdrop image URL
- `overview`: Plot summary
- `genres`: Array of genre tags
- `rating`: Average rating
- `tmdbId`: TMDB API identifier
- `imdbId`: IMDB identifier
- `createdAt`: Entry creation timestamp
- `updatedAt`: Last update timestamp

**Access Patterns:**

- Get show by ID
- Search shows by title
- Get shows by genre
- Get show metadata for watchlist items

## Additional Entities

### 5. WatchlistItem

Represents an item (Movie or Show) in a watchlist with user notes.

**Attributes:**

- `id` (PK): Composite key `WATCHLIST#<watchlist-id>#ITEM#<item-id>`
- `watchlistId`: Parent watchlist ID
- `itemId`: Movie or Show ID
- `itemType`: "MOVIE" or "SHOW"
- `order`: Position in the watchlist
- `curatorNote`: Curator's commentary
- `addedAt`: When item was added

**Access Patterns:**

- Get all items in a watchlist
- Add/remove item from watchlist
- Reorder items in watchlist

### 6. Like

Represents a user liking a watchlist.

**Attributes:**

- `id` (PK): Composite key `USER#<user-id>#LIKE#WATCHLIST#<watchlist-id>`
- `userId`: User who liked
- `watchlistId`: Watchlist that was liked
- `createdAt`: Like timestamp

**Access Patterns:**

- Check if user liked a watchlist
- Get all watchlists liked by user
- Count likes for a watchlist

## DynamoDB Table Structure

### Primary Table: `WorthWatch`

**Primary Key:**

- Partition Key (PK): `id` (String)
- Sort Key (SK): `type` (String) - Optional, for composite entities

**Global Secondary Indexes (GSI):**

#### GSI1: User's Watchlists Index

- PK: `userId` (String)
- SK: `createdAt` (String)
- Purpose: Query all watchlists by a specific user

#### GSI2: Public Content Index

- PK: `entityType` (String) - e.g., "WATCHLIST", "USER"
- SK: `createdAt` or `popularity` (String)
- Purpose: List public watchlists, trending content

#### GSI3: Search Index

- PK: `searchCategory` (String) - e.g., "GENRE#Action", "TAG#Thriller"
- SK: `title` (String)
- Purpose: Search and filter content by categories

## Key Design Patterns

### 1. Composite Keys

Use prefixed IDs to namespace entities:

- Users: `USER#<uuid>`
- Watchlists: `WATCHLIST#<uuid>`
- Movies: `MOVIE#<external-id>`
- Shows: `SHOW#<external-id>`

### 2. Hierarchical Data

For parent-child relationships (Watchlist → Items):

```
PK: WATCHLIST#123
SK: METADATA

PK: WATCHLIST#123
SK: ITEM#MOVIE#456

PK: WATCHLIST#123
SK: ITEM#SHOW#789
```

### 3. Many-to-Many Relationships

For likes, follows, etc., create junction items:

```
PK: USER#123#LIKE#WATCHLIST#456
SK: METADATA
```

### 4. Denormalization

Store frequently accessed data together:

- Store user summary (username, avatar) in watchlist items
- Cache item counts in parent entities
- Duplicate popular search fields

## Data Access Layer

All DynamoDB operations should go through a data access layer that:

1. Abstracts table structure from business logic
2. Provides type-safe interfaces
3. Handles errors and retries
4. Implements consistent patterns for CRUD operations

## Next Steps

1. Implement TypeScript types for all entities
2. Create DynamoDB DocumentClient wrapper
3. Implement repository pattern for each entity type
4. Add validation schemas with Zod
5. Create migration/seeding utilities
6. Document query patterns with examples
