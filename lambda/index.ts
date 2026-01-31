import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { createLambdaHandler } from '@ts-rest/serverless/aws';
import { apiContract, apiRoutes } from './router';

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
 * Wraps ts-rest handler with logging and error handling
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Context:', JSON.stringify(context, null, 2));

  try {
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
