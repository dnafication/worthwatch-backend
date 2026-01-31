import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';

/**
 * User information from JWT authorizer context
 */
interface AuthorizedUser {
  sub: string;
  email?: string;
  'cognito:username'?: string;
}

/**
 * Main Lambda handler
 * Routes requests to public or private handlers based on path
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Context:', JSON.stringify(context, null, 2));

  const path = event.path || '/';
  const method = event.httpMethod || 'GET';

  // Route to appropriate handler
  if (path === '/public' && method === 'GET') {
    return handlePublicRoute(event);
  }

  if (path === '/private' && method === 'GET') {
    return handlePrivateRoute(event);
  }

  // Health check endpoint (public)
  if (path === '/health' && method === 'GET') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
      }),
    };
  }

  // Ping endpoint (public)
  if (path === '/ping' && method === 'GET') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'pong',
      }),
    };
  }

  // Default response for unmatched routes
  return {
    statusCode: 404,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      error: 'Not Found',
      message: `Route ${method} ${path} not found`,
    }),
  };
};

/**
 * Public route handler
 * Accessible without authentication
 */
function handlePublicRoute(event: APIGatewayProxyEvent): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'This is a public route',
      path: event.path,
      method: event.httpMethod,
      timestamp: new Date().toISOString(),
      requiresAuth: false,
    }),
  };
}

/**
 * Private route handler
 * Requires JWT authentication - extracts user info from authorizer context
 */
function handlePrivateRoute(event: APIGatewayProxyEvent): APIGatewayProxyResult {
  // Extract user information from JWT authorizer context
  const claims = event.requestContext?.authorizer?.jwt?.claims;

  if (!claims) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Unauthorized',
        message: 'No valid JWT token found',
      }),
    };
  }

  const user: AuthorizedUser = {
    sub: claims.sub as string,
    email: claims.email as string,
    'cognito:username': claims['cognito:username'] as string,
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'This is a private route',
      path: event.path,
      method: event.httpMethod,
      timestamp: new Date().toISOString(),
      requiresAuth: true,
      user: {
        id: user.sub,
        email: user.email,
        username: user['cognito:username'],
      },
    }),
  };
}
