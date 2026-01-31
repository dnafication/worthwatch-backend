import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { createLambdaHandler } from '@ts-rest/serverless/aws';
import { apiContract, apiRoutes } from './router';

/**
 * User information from JWT authorizer context
 */
export interface AuthorizedUser {
  sub: string; // User ID from Cognito
  email?: string;
  'cognito:username'?: string;
}

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
 * JWT verification is done by API Gateway JWT Authorizer.
 * User information is extracted from the authorizer context.
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Context:', JSON.stringify(context, null, 2));

  try {
    // Extract user information from authorizer context (if present)
    // API Gateway JWT Authorizer populates this for protected routes
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    
    if (claims) {
      const user: AuthorizedUser = {
        sub: claims.sub as string,
        email: claims.email as string,
        'cognito:username': claims['cognito:username'] as string,
      };
      
      console.log('Authenticated user:', user.sub);
      
      // Attach user info to event for downstream handlers
      (event as any).user = user;
    } else {
      console.log('Public route - no user context');
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
