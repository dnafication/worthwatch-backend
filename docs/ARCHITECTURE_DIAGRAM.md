# Data Model Architecture Overview

## Entity Relationship Diagram

```
┌─────────────────┐
│      User       │
├─────────────────┤
│ id (PK)         │
│ email           │
│ username        │
│ bio             │
│ avatarUrl       │
│ isVerified      │
│ createdAt       │
│ updatedAt       │
└────────┬────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────┐        N:M        ┌─────────────────┐
│   Watchlist     │◄───────────────────│      Like       │
├─────────────────┤                    ├─────────────────┤
│ id (PK)         │                    │ id (PK)         │
│ userId (FK)     │                    │ userId (FK)     │
│ title           │                    │ watchlistId(FK) │
│ description     │                    │ createdAt       │
│ isPublic        │                    └─────────────────┘
│ tags[]          │
│ itemCount       │
│ likeCount       │
│ viewCount       │
│ createdAt       │
│ updatedAt       │
└────────┬────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────┐
│ WatchlistItem   │
├─────────────────┤
│ id (PK)         │
│ watchlistId(FK) │
│ itemId (FK)     │───┐
│ itemType        │   │
│ order           │   │
│ curatorNote     │   │
│ addedAt         │   │
│ createdAt       │   │
│ updatedAt       │   │
└─────────────────┘   │
                      │
         ┌────────────┴───────────┐
         │                        │
         ▼                        ▼
┌─────────────────┐      ┌─────────────────┐
│      Movie      │      │      Show       │
├─────────────────┤      ├─────────────────┤
│ id (PK)         │      │ id (PK)         │
│ title           │      │ title           │
│ originalTitle   │      │ originalTitle   │
│ releaseYear     │      │ firstAirDate    │
│ posterUrl       │      │ lastAirDate     │
│ backdropUrl     │      │ status          │
│ overview        │      │ numberOfSeasons │
│ genres[]        │      │ numberOfEpisodes│
│ runtime         │      │ posterUrl       │
│ rating          │      │ backdropUrl     │
│ tmdbId          │      │ overview        │
│ imdbId          │      │ genres[]        │
│ createdAt       │      │ rating          │
│ updatedAt       │      │ tmdbId          │
└─────────────────┘      │ imdbId          │
                         │ createdAt       │
                         │ updatedAt       │
                         └─────────────────┘
```

## DynamoDB Single-Table Structure

```
┌────────────────────────────────────────────────────────────────┐
│                     WorthWatch Table                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Primary Key: id (Partition Key)                              │
│                                                                │
│  Entity Patterns:                                             │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ USER#<uuid>           → User entity                       │ │
│  │ WATCHLIST#<uuid>      → Watchlist entity                  │ │
│  │ MOVIE#<tmdb-id>       → Movie entity                      │ │
│  │ SHOW#<tmdb-id>        → Show entity                       │ │
│  │ WATCHLIST_ITEM#<uuid> → WatchlistItem entity              │ │
│  │ USER#<id>#LIKE#WATCHLIST#<id> → Like entity               │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Global Secondary Indexes:                                    │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ GSI1: userId (PK) + createdAt (SK)                       │ │
│  │   → Query user's watchlists                              │ │
│  │   → Query user's likes                                   │ │
│  │                                                            │ │
│  │ GSI2: entityType (PK) + popularity (SK)                  │ │
│  │   → List public watchlists                               │ │
│  │   → List verified curators                               │ │
│  │                                                            │ │
│  │ GSI3: searchCategory (PK) + title (SK)                   │ │
│  │   → Search by genre/tag                                  │ │
│  │   → Filter content                                       │ │
│  │                                                            │ │
│  │ GSI4: watchlistId (PK) + order (SK)                      │ │
│  │   → Query watchlist items in order                       │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

## Access Patterns

### 1. User Patterns

```
┌─────────────────────────────────────┐
│ Get user by ID                      │
│ → GetItem(PK: USER#<id>)            │
├─────────────────────────────────────┤
│ Get user by email                   │
│ → Query(GSI: email = ?)             │
├─────────────────────────────────────┤
│ List verified curators              │
│ → Query(GSI2: entityType=USER,      │
│          isVerified=true)           │
└─────────────────────────────────────┘
```

### 2. Watchlist Patterns

```
┌─────────────────────────────────────┐
│ Get watchlist by ID                 │
│ → GetItem(PK: WATCHLIST#<id>)       │
├─────────────────────────────────────┤
│ Get user's watchlists               │
│ → Query(GSI1: userId = ?)           │
├─────────────────────────────────────┤
│ List public watchlists              │
│ → Query(GSI2: entityType=WATCHLIST, │
│          isPublic=true)             │
├─────────────────────────────────────┤
│ Get watchlist with items            │
│ → Query(GSI4: watchlistId = ?)      │
└─────────────────────────────────────┘
```

### 3. Content Patterns

```
┌─────────────────────────────────────┐
│ Get movie/show by ID                │
│ → GetItem(PK: MOVIE#<id>)           │
├─────────────────────────────────────┤
│ Search content by genre             │
│ → Query(GSI3: searchCategory =      │
│          GENRE#Action)              │
├─────────────────────────────────────┤
│ Get content for watchlist item      │
│ → BatchGetItem([MOVIE#1, SHOW#2])   │
└─────────────────────────────────────┘
```

### 4. Interaction Patterns

```
┌─────────────────────────────────────┐
│ Like watchlist                      │
│ → PutItem(PK: USER#<id>#LIKE#       │
│            WATCHLIST#<id>)          │
│ → UpdateItem(WATCHLIST#<id>,        │
│              ADD likeCount 1)       │
├─────────────────────────────────────┤
│ Check if user liked watchlist       │
│ → GetItem(PK: USER#<id>#LIKE#       │
│           WATCHLIST#<id>)           │
├─────────────────────────────────────┤
│ Get user's liked watchlists         │
│ → Query(GSI1: userId = ?)           │
└─────────────────────────────────────┘
```

## Data Flow Example: Creating a Watchlist

```
1. Validate Input
   ┌─────────────────┐
   │ Zod Schema      │
   │ Validation      │
   └────────┬────────┘
            │
            ▼
2. Create Watchlist
   ┌─────────────────┐
   │ WatchlistRepo   │
   │ .create()       │
   └────────┬────────┘
            │
            ▼
3. Add Items
   ┌─────────────────┐
   │ For each movie: │
   │ WatchlistItem   │
   │ Repo.create()   │
   └────────┬────────┘
            │
            ▼
4. Update Counts
   ┌─────────────────┐
   │ Watchlist       │
   │ .update()       │
   │ itemCount++     │
   └────────┬────────┘
            │
            ▼
5. Return Result
   ┌─────────────────┐
   │ Complete        │
   │ Watchlist       │
   └─────────────────┘
```

## Repository Layer Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Application Layer                    │
│          (Lambda Handlers, Business Logic)             │
└──────────────────────┬─────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│                 Repository Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ UserRepo     │  │WatchlistRepo │  │  MovieRepo  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘  │
│         │                 │                  │         │
│         └─────────────────┴──────────────────┘         │
│                           │                            │
│                  ┌────────▼────────┐                   │
│                  │  BaseRepository │                   │
│                  └────────┬────────┘                   │
└───────────────────────────┼────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│              AWS SDK Layer                             │
│  ┌─────────────────────────────────────────────────┐  │
│  │  DynamoDB Document Client                       │  │
│  │  (GetItem, PutItem, Query, UpdateItem, etc.)    │  │
│  └─────────────────────────────────────────────────┘  │
└──────────────────────┬─────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│                  DynamoDB Service                      │
│                  (AWS Managed)                         │
└────────────────────────────────────────────────────────┘
```

## Type Safety Flow

```
1. API Request
   └→ APIGatewayProxyEvent

2. Validation Layer
   └→ Zod Schemas
      └→ UserInput | WatchlistInput | etc.

3. Repository Layer
   └→ BaseEntity interfaces
      └→ User | Watchlist | Movie | Show

4. Database Layer
   └→ DynamoDB Document Client
      └→ Record<string, any>

5. Response
   └→ Validated Entity Types
      └→ APIGatewayProxyResult
```

## Key Design Principles

1. **Single Source of Truth**: One table, multiple views via GSIs
2. **Type Safety**: TypeScript types + Zod validation
3. **Encapsulation**: Repository pattern abstracts DynamoDB details
4. **Scalability**: Partition keys designed to distribute load
5. **Flexibility**: Easy to add new entities and relationships
6. **Performance**: Co-location of related data for efficient queries
7. **Maintainability**: Clear separation of concerns

## Future Enhancements

1. **Caching Layer**: Add ElastiCache for frequently accessed data
2. **Search**: Integrate OpenSearch for full-text search
3. **Streams**: Add DynamoDB Streams for real-time updates
4. **Analytics**: Add queries to track trends and popular content
5. **Recommendations**: ML-based recommendations using item data
