import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

/**
 * Health Check API Contract
 * 
 * Public endpoints that don't require authentication.
 * Used for monitoring, health checks, and service status.
 */
export const healthContract = c.router({
  /**
   * Health check endpoint
   * GET /health
   */
  health: {
    method: 'GET',
    path: '/health',
    responses: {
      200: z.object({
        status: z.literal('ok'),
        timestamp: z.string(),
      }),
    },
    summary: 'Health check endpoint',
  },

  /**
   * Ping endpoint
   * GET /ping
   */
  ping: {
    method: 'GET',
    path: '/ping',
    responses: {
      200: z.object({
        message: z.literal('pong'),
      }),
    },
    summary: 'Ping endpoint',
  },
});
