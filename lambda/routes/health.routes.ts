/**
 * Health Check Route Handlers
 *
 * Public endpoints for health checks and monitoring.
 * These routes don't require authentication.
 */
export const healthRoutes = {
  /**
   * Health check endpoint
   */
  health: async () => {
    console.log('Health check requested');

    return {
      status: 200 as const,
      body: {
        status: 'ok' as const,
        timestamp: new Date().toISOString(),
      },
    };
  },

  /**
   * Ping endpoint
   */
  ping: async () => {
    console.log('Ping requested');

    return {
      status: 200 as const,
      body: {
        message: 'pong' as const,
      },
    };
  },
};
