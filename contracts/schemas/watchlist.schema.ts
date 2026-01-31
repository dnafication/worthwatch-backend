import { z } from 'zod';

/**
 * Base Watchlist schema with all fields
 */
export const WatchlistSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Schema for creating a new watchlist (no id or timestamps)
 */
export const CreateWatchlistSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

/**
 * Schema for updating a watchlist (all fields optional except at least one required)
 */
export const UpdateWatchlistSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
  })
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    message: 'At least one field must be provided for update',
  });

/**
 * TypeScript types inferred from Zod schemas
 */
export type Watchlist = z.infer<typeof WatchlistSchema>;
export type CreateWatchlistDto = z.infer<typeof CreateWatchlistSchema>;
export type UpdateWatchlistDto = z.infer<typeof UpdateWatchlistSchema>;
