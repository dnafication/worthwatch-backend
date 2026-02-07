# Single-Table vs Multi-Table Design Decision

## Executive Summary

**Recommendation**: Use a **single-table design** for WorthWatch's DynamoDB implementation.

## Design Analysis

### The Four Entities

The problem statement identified these logical entities:

- **User**: Platform users and curators
- **Watchlist**: Curated collections of content
- **Movie**: Film content
- **Show**: TV series content

### Single-Table Design (Recommended)

**Structure**: All entities stored in one DynamoDB table with composite keys.

#### Advantages for WorthWatch

1. **Access Pattern Alignment**
   - Watchlists and their items are frequently queried together → single query
   - Users and their watchlists are often fetched together → efficient joins
   - Related data lives in the same partition for fast access

2. **Cost Efficiency**
   - Lower total RCU/WCU consumption
   - Fewer network round trips
   - Single table = simpler billing and monitoring

3. **Transactional Operations**
   - Easier to implement atomic operations across entity types
   - Better support for consistency (e.g., incrementing like counts)
   - Simplified rollback scenarios

4. **Simplified Operations**
   - One table to backup, restore, and monitor
   - Simpler infrastructure code
   - Easier to manage capacity and scaling

5. **Flexible Relationships**
   - Can model complex relationships using composite keys
   - Easy to add new entity types without new tables
   - Better support for hierarchical data (watchlist → items)

#### Key Access Patterns Supported

```
1. Get user profile
   PK: USER#<user-id>

2. Get user's watchlists
   GSI: userId (PK) + createdAt (SK)

3. Get watchlist with all items
   PK: WATCHLIST#<watchlist-id>
   SK: begins_with("ITEM#")

4. Get public watchlists
   GSI: entityType#isPublic (PK) + popularity (SK)

5. Check if user liked watchlist
   PK: USER#<user-id>#LIKE#WATCHLIST#<watchlist-id>
```

#### Schema Example

```typescript
// Users
PK: USER#123-456
SK: METADATA
attributes: { email, username, bio, ... }

// Watchlists
PK: WATCHLIST#789-012
SK: METADATA
attributes: { userId, title, description, ... }

// Watchlist Items (hierarchical)
PK: WATCHLIST#789-012
SK: ITEM#MOVIE#27205
attributes: { order, curatorNote, ... }

// Movies/Shows
PK: MOVIE#27205
SK: METADATA
attributes: { title, releaseYear, ... }

// Likes (junction table pattern)
PK: USER#123-456#LIKE#WATCHLIST#789-012
SK: METADATA
attributes: { createdAt, ... }
```

### Multi-Table Design (Alternative)

**Structure**: Separate tables for Users, Watchlists, Movies, Shows.

#### When Multi-Table Makes Sense

1. **Vastly Different Access Patterns**
   - If Movies/Shows are queried at 1000x the rate of Users
   - If different entities need different scaling strategies
   - Not applicable to WorthWatch

2. **Compliance/Security Requirements**
   - If user data must be physically isolated
   - If different encryption keys are required per entity
   - Not a requirement for WorthWatch

3. **Team Boundaries**
   - If separate teams own different entity types
   - If you need fine-grained IAM permissions per entity
   - Not necessary for WorthWatch's size

4. **Extreme Scale Differentiation**
   - If one entity will have billions of items
   - If partition hot-spotting is a concern
   - Not expected for WorthWatch

#### Disadvantages for WorthWatch

1. **More Complex Queries**
   - Need multiple queries to fetch related data
   - Higher latency for common operations
   - More application code to join data

2. **Higher Costs**
   - More tables = more RCU/WCU overall
   - More network calls
   - Potentially more reserved capacity needed

3. **Transactional Limitations**
   - DynamoDB transactions limited to 25 items
   - Cross-table transactions more complex
   - Harder to maintain consistency

4. **Infrastructure Complexity**
   - More tables to manage and monitor
   - More CDK code to maintain
   - More complex backup/restore procedures

## Implementation Recommendation

### Phase 1: Single Table (Current)

✅ Implement single-table design with:

- Current simple partition key `id`
- Add Global Secondary Indexes as access patterns emerge:
  - GSI1: `userId` + `createdAt` (user's watchlists)
  - GSI2: `entityType` + `popularity` (public content)
  - GSI3: `searchCategory` + `title` (search/filter)

### Phase 2: Optimize (Future)

If specific issues arise:

- Add composite sort keys for hierarchical queries
- Implement sparse indexes for specific queries
- Add DynamoDB Streams for denormalization
- Consider ElasticSearch for complex search

### Phase 3: Re-evaluate (If Needed)

Consider multi-table only if:

- One entity exceeds 10M items while others stay small
- Regulatory requirements mandate physical separation
- Access patterns diverge significantly (>100x difference)

## Migration Path

If we need to move to multi-table later:

1. Use DynamoDB Streams to dual-write to new tables
2. Backfill historical data using Scan + BatchWrite
3. Gradually migrate application code
4. Switch over and deprecate old table

This is feasible but unnecessary upfront given WorthWatch's requirements.

## Conclusion

**Single-table design is the correct choice** because:

- ✅ Fits WorthWatch's access patterns naturally
- ✅ Lower cost and complexity
- ✅ Better performance for common queries
- ✅ Easier to maintain and scale
- ✅ Standard best practice for DynamoDB applications

The entities (User, Watchlist, Movie, Show) are **logically distinct but operationally related**, making them perfect candidates for single-table design with proper key prefixing and GSIs.
