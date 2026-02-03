# DynamoDB Data Model Diagram

## Entity Relationship Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                     SINGLE DYNAMODB TABLE                        │
│                    (WorthWatch Platform)                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│       USER           │
├──────────────────────┤
│ PK: USER#<userId>    │
│ SK: PROFILE          │
├──────────────────────┤
│ • userId             │
│ • email              │◄──────── GSI1: email lookup
│ • username           │
│ • isCurator          │
│ • curatorStatus      │
└──────────────────────┘
         │
         │ creates (1:N)
         │
         ▼
┌──────────────────────┐
│     WATCHLIST        │
├──────────────────────┤
│ PK: WATCHLIST#<id>   │
│ SK: METADATA         │
├──────────────────────┤
│ • watchlistId        │
│ • curatorId          │◄──────── GSI2: curator watchlists
│ • title              │
│ • isPublic           │
│ • isPublicStr        │◄──────── GSI3: public watchlists
│ • tags               │
│ • itemCount          │
└──────────────────────┘
         │
         │ contains (1:N)
         │
         ▼
┌──────────────────────┐
│   WATCHLIST_ITEM     │
├──────────────────────┤
│ PK: WATCHLIST#<id>   │
│ SK: ITEM#<type>#<id> │
├──────────────────────┤
│ • contentType        │─────┐
│ • contentId          │     │ references
│ • position           │     │
│ • curatorNote        │     │
└──────────────────────┘     │
                              │
         ┌────────────────────┴────────────────────┐
         │                                          │
         ▼                                          ▼
┌──────────────────────┐                ┌──────────────────────┐
│       MOVIE          │                │       SHOW           │
├──────────────────────┤                ├──────────────────────┤
│ PK: MOVIE#<movieId>  │                │ PK: SHOW#<showId>    │
│ SK: METADATA         │                │ SK: METADATA         │
├──────────────────────┤                ├──────────────────────┤
│ • movieId            │                │ • showId             │
│ • title              │                │ • title              │
│ • releaseYear        │                │ • startYear/endYear  │
│ • genres             │                │ • genres             │
│ • directors          │                │ • creators           │
│ • cast               │                │ • cast               │
│ • synopsis           │                │ • synopsis           │
│ • runtime            │                │ • numberOfSeasons    │
│ • tmdbId/imdbId      │                │ • status             │
│ • entityType         │◄───┐           │ • tmdbId/imdbId      │
└──────────────────────┘    │           │ • entityType         │◄───┐
                             │           └──────────────────────┘    │
                             │                                        │
                             └────────────────┬───────────────────────┘
                                              │
                                    GSI4: entity type queries
```

## Access Patterns

### 1. User Operations
- **Get by ID**: Query `PK = USER#<id>`, `SK = PROFILE`
- **Get by Email**: Query GSI1 with `email = <email>`

### 2. Watchlist Operations
- **Get by ID**: Query `PK = WATCHLIST#<id>`, `SK = METADATA`
- **Get by Curator**: Query GSI2 with `curatorId = <curatorId>`
- **Get Public Watchlists**: Query GSI3 with `isPublicStr = 'true'`
- **Get Items**: Query `PK = WATCHLIST#<id>`, `SK begins_with 'ITEM#'`

### 3. Movie/Show Operations
- **Get by ID**: Query `PK = MOVIE#<id>` or `PK = SHOW#<id>`, `SK = METADATA`
- **List All**: Query GSI4 with `entityType = 'MOVIE'` or `'SHOW'`

## Key Structure Examples

```
User:
  PK: USER#123e4567-e89b-12d3-a456-426614174000
  SK: PROFILE

Watchlist Metadata:
  PK: WATCHLIST#abc12345-6789-0def-ghij-klmnopqrstuv
  SK: METADATA

Watchlist Item (Movie):
  PK: WATCHLIST#abc12345-6789-0def-ghij-klmnopqrstuv
  SK: ITEM#MOVIE#tt1375666

Watchlist Item (Show):
  PK: WATCHLIST#abc12345-6789-0def-ghij-klmnopqrstuv
  SK: ITEM#SHOW#tt0944947

Movie:
  PK: MOVIE#tt1375666
  SK: METADATA

Show:
  PK: SHOW#tt0944947
  SK: METADATA
```

## Global Secondary Indexes

### GSI1: Email Index
```
PK: email
Purpose: User lookup by email address
Example: email = "user@example.com"
```

### GSI2: Curator Watchlists Index
```
PK: curatorId
SK: createdAt
Purpose: Get all watchlists by a curator, sorted by date
Example: curatorId = "USER#123..." AND SK sorted by createdAt
```

### GSI3: Public Watchlists Index
```
PK: isPublicStr
SK: createdAt
Purpose: Discover public watchlists, sorted by date
Example: isPublicStr = "true" AND SK sorted by createdAt
```

### GSI4: Entity Type Index
```
PK: entityType
SK: createdAt
Purpose: Query all entities of a type
Example: entityType = "MOVIE" or "SHOW"
```

## Design Benefits

✅ **Single Table**: All entities in one table for cost efficiency  
✅ **Efficient Queries**: GSIs enable fast lookups for all access patterns  
✅ **Relationships**: PK/SK structure enables hierarchical data (watchlist → items)  
✅ **Scalable**: Design grows with platform needs  
✅ **Type Safety**: TypeScript interfaces ensure correctness  
✅ **Clean Abstractions**: Repository pattern hides DynamoDB complexity  

## Query Cost Comparison

| Operation | Without GSI | With GSI |
|-----------|-------------|----------|
| Get user by email | Scan (expensive) | Query GSI1 (cheap) |
| Get curator's watchlists | Scan (expensive) | Query GSI2 (cheap) |
| Get public watchlists | Scan (expensive) | Query GSI3 (cheap) |
| List all movies | Scan (expensive) | Query GSI4 (cheap) |

## Future Enhancements

The data model supports these future features without schema changes:

- User saved/followed watchlists (add `USER#<id>` / `SAVED#WATCHLIST#<id>` items)
- Ratings and reviews (add `USER#<id>` / `RATING#<type>#<id>` items)
- Comments on watchlists (add `WATCHLIST#<id>` / `COMMENT#<timestamp>#<userId>` items)
- User profiles extended data (use different SK values under `USER#<id>`)
