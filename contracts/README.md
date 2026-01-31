# @worthwatch/contracts

Type-safe API contracts for WorthWatch, shared between backend and frontend.

## Overview

This package contains ts-rest contracts and Zod schemas that define the WorthWatch API. It enables end-to-end type safety between the backend API and frontend clients.

## Installation

```bash
npm install @worthwatch/contracts
```

### Peer Dependencies

This package requires:
- `@ts-rest/core` (^3.52.0)
- `zod` (^3.25.0)

## Usage

### Frontend Client

```typescript
import { initClient } from '@ts-rest/core';
import { watchlistsContract } from '@worthwatch/contracts';

// Initialize type-safe client
const client = initClient(watchlistsContract, {
  baseUrl: 'https://api.worthwatch.com',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Type-safe API calls with full autocomplete
const watchlists = await client.listWatchlists();
// Type: Watchlist[]

const newWatchlist = await client.createWatchlist({
  body: {
    name: 'My Watchlist',
    description: 'Great movies',
  },
});
// Type: Watchlist
```

### Backend Server

```typescript
import { watchlistsContract } from '@worthwatch/contracts';
import { createLambdaHandler } from '@ts-rest/serverless/aws';

const router = {
  listWatchlists: async () => {
    // Implementation
    return { status: 200, body: watchlists };
  },
  // ... other handlers
};

export const handler = createLambdaHandler(watchlistsContract, router);
```

## Available Contracts

### Watchlists Contract

```typescript
import { watchlistsContract } from '@worthwatch/contracts/watchlists';
```

**Endpoints:**
- `GET /watchlists` - List all watchlists
- `POST /watchlists` - Create a new watchlist
- `GET /watchlists/:id` - Get a single watchlist
- `PUT /watchlists/:id` - Update a watchlist
- `DELETE /watchlists/:id` - Delete a watchlist

## Schemas

All Zod schemas are exported for validation:

```typescript
import { 
  WatchlistSchema, 
  CreateWatchlistSchema, 
  UpdateWatchlistSchema,
  type Watchlist,
  type CreateWatchlistDto,
  type UpdateWatchlistDto
} from '@worthwatch/contracts';

// Validate data
const result = WatchlistSchema.parse(data);

// Use TypeScript types
const watchlist: Watchlist = {
  id: '123',
  name: 'Action Movies',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};
```

## Benefits

- **Type Safety**: Full type safety from client to server
- **Runtime Validation**: Zod schemas validate data at runtime
- **Single Source of Truth**: One contract definition for both ends
- **Auto-complete**: Full IDE support with intelligent suggestions
- **OpenAPI Compatible**: Can generate OpenAPI specs from contracts

## Development

This package is part of the WorthWatch backend monorepo. To modify contracts:

1. Edit files in `contracts/` or `schemas/`
2. Rebuild: `npm run build`
3. Test changes in both backend and frontend

## License

ISC
