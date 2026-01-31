import { APIGatewayProxyEvent } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

/**
 * JWT verification middleware for Cognito access tokens
 *
 * Verifies JWT tokens from AWS Cognito User Pool.
 * Caches JWKS for performance.
 */

// Initialize JWKS client for verifying Cognito tokens
const jwksClientInstance = jwksClient({
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
  jwksUri: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.USER_POOL_ID}/.well-known/jwks.json`,
});

/**
 * Get signing key from JWKS
 */
function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  jwksClientInstance.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

/**
 * Decoded JWT payload from Cognito
 */
export interface CognitoTokenPayload {
  sub: string; // User ID
  email?: string;
  email_verified?: boolean;
  'cognito:username'?: string;
  token_use: 'access' | 'id';
  auth_time: number;
  iss: string;
  exp: number;
  iat: number;
  client_id: string;
}

/**
 * Extract and verify JWT token from Authorization header
 *
 * @param event - API Gateway proxy event
 * @returns Decoded token payload if valid
 * @throws Error if token is invalid or missing
 */
export async function verifyToken(
  event: APIGatewayProxyEvent
): Promise<CognitoTokenPayload> {
  // Extract token from Authorization header
  const authHeader = event.headers?.Authorization || event.headers?.authorization;

  if (!authHeader) {
    throw new Error('No Authorization header provided');
  }

  // Extract Bearer token
  const tokenMatch = authHeader.match(/^Bearer (.+)$/);
  if (!tokenMatch) {
    throw new Error('Invalid Authorization header format. Expected: Bearer <token>');
  }

  const token = tokenMatch[1];

  // Verify token using JWKS
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        issuer: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.USER_POOL_ID}`,
        audience: process.env.USER_POOL_CLIENT_ID,
      },
      (err, decoded) => {
        if (err) {
          reject(new Error(`Token verification failed: ${err.message}`));
          return;
        }
        resolve(decoded as CognitoTokenPayload);
      }
    );
  });
}

/**
 * Check if a route is public (doesn't require authentication)
 */
export function isPublicRoute(path: string, method: string): boolean {
  const publicRoutes = [
    { path: '/health', method: 'GET' },
    { path: '/ping', method: 'GET' },
    { path: '/', method: 'GET' },
  ];

  return publicRoutes.some(
    route => path === route.path && method.toUpperCase() === route.method
  );
}
