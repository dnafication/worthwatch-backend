import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { createLambdaHandler } from '@ts-rest/serverless/aws';
import { apiContract, apiRoutes } from './router';
import { verifyToken, isPublicRoute } from './middleware/auth.middleware';

/**
 * ts-rest Lambda Handler
 *
 * Uses @ts-rest/serverless to handle routing and validation.
 * Requests are validated against the contract and routed to appropriate handlers.
 */
const tsRestHandler = createLambdaHandler(apiContract, apiRoutes, {
  jsonQuery: true,
  responseValidation: true,
});

/**
 * Main Lambda handler
 * Wraps ts-rest handler with authentication and error handling
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Context:', JSON.stringify(context, null, 2));

  try {
    const path = event.path || '/';
    const method = event.httpMethod || 'GET';

    // Check if route is public
    if (!isPublicRoute(path, method)) {
      // Protected route - verify JWT token
      try {
        const tokenPayload = await verifyToken(event);
        console.log('Authenticated user:', tokenPayload.sub);

        // Add user info to event for downstream handlers
        (event as any).user = tokenPayload;
      } catch (authError) {
        console.error('Authentication error:', authError);
        return {
          statusCode: 401,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: 'Unauthorized',
            message: authError instanceof Error ? authError.message : 'Authentication failed',
          }),
        };
      }
    } else {
      console.log('Public route - skipping authentication');
    }

    // Delegate to ts-rest handler
    const result = await tsRestHandler(event, context);
    return result as APIGatewayProxyResult;
  } catch (error) {
    console.error('Error:', error);

    // Fallback error response
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
