# Authentication Guide

This guide explains how authentication works in the WorthWatch backend using AWS Cognito with passwordless authentication.

## Overview

The WorthWatch backend uses AWS Cognito User Pool for authentication with a passwordless approach:

- **Client-side authentication**: The client (web/mobile app) handles all authentication challenge flows (SRP, OTP, Magic Link)
- **JWT tokens**: After successful authentication, the client receives an Access Token (JWT)
- **Protected routes**: The client includes the JWT in the `Authorization` header for protected API calls
- **Public routes**: Some routes like `/health` and `/ping` don't require authentication

## Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌────────────────┐      ┌────────────────┐
│   Client    │─────▶│  AWS Cognito     │      │  API Gateway   │      │   Lambda API   │
│  (Web/App)  │      │  User Pool       │      │ JWT Authorizer │      │                │
└─────────────┘      └──────────────────┘      └────────────────┘      └────────────────┘
       │                      │                        │                        │
       │  1. Auth Challenge   │                        │                        │
       │◀─────────────────────┤                        │                        │
       │                      │                        │                        │
       │  2. Complete Auth    │                        │                        │
       ├─────────────────────▶│                        │                        │
       │                      │                        │                        │
       │  3. Receive JWT      │                        │                        │
       │◀─────────────────────┤                        │                        │
       │                      │                        │                        │
       │  4. API Request + JWT                         │                        │
       ├───────────────────────────────────────────────▶                        │
       │                      │                        │                        │
       │                      │  5. Verify JWT         │                        │
       │                      │◀───────────────────────┤                        │
       │                      │                        │                        │
       │                      │                        │  6. Forward w/ user    │
       │                      │                        ├───────────────────────▶│
       │                      │                        │                        │
       │  7. API Response     │                        │  7. Process & respond  │
       │◀───────────────────────────────────────────────┴───────────────────────┤
```

## Infrastructure Components

### Cognito User Pool

- **Purpose**: Manages user identities and authentication
- **Sign-in**: Email-based (no username)
- **Auto-verify**: Email addresses are automatically verified
- **Password policy**: Flexible (8 char min) - can be configured for passwordless flows
- **Account recovery**: Email-only

### Cognito User Pool Client

- **Type**: Public client (web/mobile apps)
- **Auth flows enabled**:
  - USER_PASSWORD_AUTH
  - USER_SRP_AUTH (Secure Remote Password)
  - CUSTOM_AUTH (for magic links, OTP)
- **No client secret**: Suitable for public clients

### API Gateway JWT Authorizer

- **Purpose**: Verifies JWT tokens before reaching Lambda
- **Token source**: `Authorization` header
- **Verification**: Validates signature using Cognito's public keys (JWKS)
- **Claims**: Passes validated user claims to Lambda in request context
- **Performance**: Offloads authentication from Lambda, reducing execution time

## Endpoints

### Public Endpoints (No Authentication Required)

These endpoints can be called without an `Authorization` header:

- `GET /health` - Health check
- `GET /ping` - Ping/pong test

**Example:**
```bash
curl https://your-api-url.amazonaws.com/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-31T03:30:00.000Z"
}
```

### Protected Endpoints (Authentication Required)

All other endpoints require authentication. The watchlist endpoints are examples of protected routes:

- `GET /watchlists` - List all watchlists
- `POST /watchlists` - Create a new watchlist
- `GET /watchlists/:id` - Get a specific watchlist
- `PUT /watchlists/:id` - Update a watchlist
- `DELETE /watchlists/:id` - Delete a watchlist

**Example:**
```bash
curl https://your-api-url.amazonaws.com/watchlists \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Success Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Action Movies",
    "description": "Best action films from the last decade",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized",
  "message": "No Authorization header provided"
}
```

## How to Use Authentication

### 1. Deploy the Stack

Deploy the CDK stack to create the Cognito User Pool:

```bash
npm run build
npm run deploy
```

After deployment, note the outputs:
- `UserPoolId` - Your Cognito User Pool ID
- `UserPoolClientId` - Your Cognito User Pool Client ID
- `ApiUrl` - Your API Gateway URL

### 2. Client-Side Authentication

The client application is responsible for:

1. **Initiating authentication** with Cognito
2. **Handling authentication challenges** (SRP, OTP, Magic Link)
3. **Obtaining the JWT Access Token**
4. **Including the token in API requests**

#### Using AWS Amplify (Recommended)

```typescript
import { Amplify, Auth } from 'aws-amplify';

// Configure Amplify
Amplify.configure({
  Auth: {
    region: 'ap-southeast-2',
    userPoolId: 'your-user-pool-id',
    userPoolWebClientId: 'your-client-id',
  }
});

// Sign in with email/password (or use custom auth)
const user = await Auth.signIn(email, password);

// Get the current session
const session = await Auth.currentSession();
const accessToken = session.getAccessToken().getJwtToken();

// Make authenticated API call
const response = await fetch('https://your-api-url/watchlists', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
```

#### Using AWS SDK for JavaScript v3

```typescript
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const client = new CognitoIdentityProviderClient({ region: 'ap-southeast-2' });

const command = new InitiateAuthCommand({
  AuthFlow: 'USER_PASSWORD_AUTH',
  ClientId: 'your-client-id',
  AuthParameters: {
    USERNAME: email,
    PASSWORD: password,
  },
});

const response = await client.send(command);
const accessToken = response.AuthenticationResult?.AccessToken;

// Use the access token in API requests
```

### 3. JWT Token Format

The JWT Access Token contains:

**Header:**
```json
{
  "kid": "key-id",
  "alg": "RS256"
}
```

**Payload:**
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "email_verified": true,
  "cognito:username": "user@example.com",
  "token_use": "access",
  "auth_time": 1706672400,
  "iss": "https://cognito-idp.ap-southeast-2.amazonaws.com/user-pool-id",
  "exp": 1706676000,
  "iat": 1706672400,
  "client_id": "your-client-id"
}
```

### 4. Backend JWT Verification

JWT verification is handled by **API Gateway's JWT Authorizer**, not in Lambda code:

1. **API Gateway** receives the request with `Authorization: Bearer <token>` header
2. **JWT Authorizer** extracts and verifies the JWT:
   - Validates signature using Cognito's public keys (JWKS)
   - Checks issuer matches the Cognito User Pool
   - Validates audience matches the User Pool Client ID
   - Ensures token hasn't expired
3. **If valid**: Forwards request to Lambda with user claims in `event.requestContext.authorizer.jwt.claims`
4. **If invalid**: Returns 401 Unauthorized immediately (Lambda never invoked)

The Lambda function then extracts user information from the authorizer context:

```typescript
const claims = event.requestContext?.authorizer?.jwt?.claims;
const userId = claims.sub;
const email = claims.email;
```

## Security Considerations

### Token Expiration

- Access tokens expire after 1 hour by default
- Implement token refresh in your client using refresh tokens
- Handle 401 responses by refreshing the token and retrying

### HTTPS Only

- Always use HTTPS in production
- Never send tokens over unencrypted connections

### Token Storage

- Store tokens securely (e.g., httpOnly cookies, secure storage)
- Never expose tokens in URLs or logs

### CORS Configuration

The API Gateway is configured to allow:
- Origins: `*` (configure specific origins in production)
- Headers: `Content-Type`, `Authorization`
- Methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`

## Adding New Protected Routes

To add a new protected route:

1. **Define the contract** in `contracts/`:

```typescript
export const myContract = c.router({
  myProtectedRoute: {
    method: 'GET',
    path: '/my-protected-resource',
    responses: {
      200: z.object({ data: z.string() }),
      401: z.object({ error: z.string(), message: z.string() }),
    },
    summary: 'My protected route',
  },
});
```

2. **Create route handlers** in `lambda/routes/`:

```typescript
export const myRoutes = {
  myProtectedRoute: async ({ event }: any) => {
    // Access authenticated user info from API Gateway authorizer context
    const user = event.user;
    console.log('User ID:', user.sub);
    console.log('Email:', user.email);

    return {
      status: 200 as const,
      body: { data: 'Protected data for ' + user.sub },
    };
  },
};
```

3. **Register in router** (`lambda/router.ts`):

```typescript
export const apiContract = c.router({
  health: healthContract,
  watchlists: watchlistsContract,
  my: myContract, // Add your contract
});

export const apiRoutes = {
  health: healthRoutes,
  watchlists: watchlistsRoutes,
  my: myRoutes, // Add your routes
};
```

4. **Add protected route in CDK** (`lib/worthwatch-stack.ts`):

```typescript
// Protected route for your new resource
new apigatewayv2.CfnRoute(this, 'MyProtectedRoute', {
  apiId: httpApi.apiId,
  routeKey: 'GET /my-protected-resource',
  target: `integrations/${protectedIntegration.ref}`,
  authorizationType: 'JWT',
  authorizerId: jwtAuthorizer.ref,
});
```

The route will automatically require JWT authentication via API Gateway.

## Adding New Public Routes

To make a route public (no authentication required), add it without authorization in the CDK stack (`lib/worthwatch-stack.ts`):

```typescript
// Add your public route
httpApi.addRoutes({
  path: '/my-public-route',
  methods: [apigatewayv2.HttpMethod.GET],
  integration: lambdaIntegration, // Uses the public integration
});
```

Public routes use the standard Lambda integration without the JWT authorizer.

## Troubleshooting

### "No Authorization header provided"

**Problem**: Missing or incorrectly formatted Authorization header.

**Solution**: Ensure the client sends:
```
Authorization: Bearer <your-jwt-token>
```

### "Token verification failed"

**Problem**: Invalid, expired, or malformed JWT token.

**Solutions**:
- Check token expiration and refresh if needed
- Verify the token is from the correct Cognito User Pool
- Ensure the client is using the correct User Pool Client ID

### "Invalid Authorization header format"

**Problem**: Authorization header doesn't match the expected format.

**Solution**: Must be exactly `Bearer <token>`, with a space between "Bearer" and the token.

## Environment Variables

The Lambda function uses these environment variables (automatically set by CDK):

- `USER_POOL_ID` - Cognito User Pool ID
- `USER_POOL_CLIENT_ID` - Cognito User Pool Client ID
- `AWS_REGION` - AWS region where Cognito is deployed
- `DDB_TABLE_NAME` - DynamoDB table name (from Solutions Construct)

## Next Steps

- Configure custom authentication flows (magic links, OTP)
- Implement token refresh logic in clients
- Add user profile endpoints
- Implement role-based access control (RBAC)
- Add API rate limiting per user
- Configure Cognito triggers for custom logic

## Resources

- [AWS Cognito Developer Guide](https://docs.aws.amazon.com/cognito/latest/developerguide/)
- [AWS Amplify Authentication](https://docs.amplify.aws/lib/auth/getting-started/q/platform/js/)
- [JWT.io - Token Inspector](https://jwt.io/)
- [ts-rest Documentation](https://ts-rest.com/)
