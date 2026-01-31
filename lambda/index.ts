import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { z } from 'zod';

const querySchema = z.object({
  name: z.string(),
});

/**
 * Main Lambda handler
 * Simple handler with Zod validation
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Context:', JSON.stringify(context, null, 2));

  const parsedQuery = querySchema.safeParse(event.queryStringParameters ?? {});
  if (!parsedQuery.success) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Bad Request',
        issues: parsedQuery.error.format(),
      }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'ok',
      name: parsedQuery.data.name ?? null,
      path: event.path,
      method: event.httpMethod,
    }),
  };
};
