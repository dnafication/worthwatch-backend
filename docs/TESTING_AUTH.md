# Testing Authentication

This guide provides examples for testing the authentication system locally and after deployment.

## Prerequisites

After deploying the stack, you'll need:
- API Gateway URL (from CDK output: `ApiUrl`)
- Cognito User Pool ID (from CDK output: `UserPoolId`)
- Cognito User Pool Client ID (from CDK output: `UserPoolClientId`)
- AWS Region (default: `ap-southeast-2`)

## Testing Public Endpoints

Public endpoints don't require authentication:

```bash
# Health check
curl https://your-api-url.amazonaws.com/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2024-01-31T03:30:00.000Z"
# }

# Ping
curl https://your-api-url.amazonaws.com/ping

# Expected response:
# {
#   "message": "pong"
# }
```

## Testing Protected Endpoints

### Step 1: Create a Test User

Use AWS CLI to create a test user in Cognito:

```bash
# Set your values
USER_POOL_ID="your-user-pool-id"
EMAIL="test@example.com"
PASSWORD="TestPassword123!"

# Create user
aws cognito-idp sign-up \
  --client-id $USER_POOL_CLIENT_ID \
  --username $EMAIL \
  --password $PASSWORD \
  --user-attributes Name=email,Value=$EMAIL \
  --region ap-southeast-2

# Confirm the user (admin command - skip email verification for testing)
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id $USER_POOL_ID \
  --username $EMAIL \
  --region ap-southeast-2
```

### Step 2: Authenticate and Get JWT Token

```bash
# Authenticate with username and password
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id $USER_POOL_CLIENT_ID \
  --auth-parameters USERNAME=$EMAIL,PASSWORD=$PASSWORD \
  --region ap-southeast-2
```

This will return a JSON response containing:
- `AccessToken` - Use this for API calls
- `IdToken` - Contains user profile information
- `RefreshToken` - Use to get new access tokens

Save the `AccessToken` to a variable:

```bash
# Extract access token (requires jq)
ACCESS_TOKEN=$(aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id $USER_POOL_CLIENT_ID \
  --auth-parameters USERNAME=$EMAIL,PASSWORD=$PASSWORD \
  --region ap-southeast-2 \
  --query 'AuthenticationResult.AccessToken' \
  --output text)

echo "Access Token: $ACCESS_TOKEN"
```

### Step 3: Call Protected Endpoints

```bash
# List watchlists (protected endpoint)
curl https://your-api-url.amazonaws.com/watchlists \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Expected response (200):
# [
#   {
#     "id": "550e8400-e29b-41d4-a716-446655440001",
#     "name": "Action Movies",
#     "description": "Best action films from the last decade",
#     "createdAt": "2024-01-01T00:00:00.000Z",
#     "updatedAt": "2024-01-01T00:00:00.000Z"
#   }
# ]

# Create a watchlist
curl -X POST https://your-api-url.amazonaws.com/watchlists \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Test Watchlist",
    "description": "Testing authentication"
  }'

# Expected response (201):
# {
#   "id": "550e8400-e29b-41d4-a716-123456789012",
#   "name": "My Test Watchlist",
#   "description": "Testing authentication",
#   "createdAt": "2024-01-31T03:30:00.000Z",
#   "updatedAt": "2024-01-31T03:30:00.000Z"
# }
```

### Step 4: Test Invalid Token

Try calling a protected endpoint without a token:

```bash
# No Authorization header
curl https://your-api-url.amazonaws.com/watchlists

# Expected response (401):
# {
#   "message": "Unauthorized"
# }

# Invalid token
curl https://your-api-url.amazonaws.com/watchlists \
  -H "Authorization: Bearer invalid-token"

# Expected response (401):
# {
#   "message": "Unauthorized"
# }
```

## Using Node.js/TypeScript

Create a test script to authenticate and call the API:

```typescript
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';

async function testAuth() {
  const client = new CognitoIdentityProviderClient({ region: 'ap-southeast-2' });
  
  // Authenticate
  const authCommand = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: process.env.USER_POOL_CLIENT_ID,
    AuthParameters: {
      USERNAME: 'test@example.com',
      PASSWORD: 'TestPassword123!',
    },
  });
  
  const authResponse = await client.send(authCommand);
  const accessToken = authResponse.AuthenticationResult?.AccessToken;
  
  console.log('Access Token:', accessToken);
  
  // Call protected endpoint
  const apiUrl = process.env.API_URL || 'https://your-api-url.amazonaws.com';
  const response = await fetch(`${apiUrl}/watchlists`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  
  const data = await response.json();
  console.log('Watchlists:', data);
}

testAuth().catch(console.error);
```

## Using Postman

1. **Create a new request** in Postman
2. **Set the URL**: `https://your-api-url.amazonaws.com/watchlists`
3. **Go to Authorization tab**:
   - Type: `Bearer Token`
   - Token: Paste your JWT access token
4. **Send the request**

## Token Inspection

To inspect the JWT token and see its contents:

1. Go to [https://jwt.io/](https://jwt.io/)
2. Paste your access token in the "Encoded" section
3. View the decoded payload with user claims

Example payload:
```json
{
  "sub": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "test@example.com",
  "email_verified": true,
  "cognito:username": "test@example.com",
  "token_use": "access",
  "auth_time": 1706672400,
  "iss": "https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_XXXXXXXXX",
  "exp": 1706676000,
  "iat": 1706672400,
  "client_id": "your-client-id"
}
```

## Troubleshooting

### "User is not confirmed" Error

If you get this error when authenticating:

```bash
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id $USER_POOL_ID \
  --username $EMAIL \
  --region ap-southeast-2
```

### "NotAuthorizedException: Incorrect username or password"

- Verify the email and password are correct
- Check that USER_PASSWORD_AUTH flow is enabled in your User Pool Client
- Ensure the user exists and is confirmed

### "Unauthorized" from API Gateway

- Check that the token hasn't expired (default: 1 hour)
- Verify the `Authorization` header format: `Bearer <token>`
- Ensure you're using the `AccessToken`, not the `IdToken`
- Check that the API Gateway JWT Authorizer is configured correctly

### Token Expired

Access tokens expire after 1 hour. Get a new token by:
1. Re-authenticating with username/password, or
2. Using the refresh token to get new tokens:

```bash
aws cognito-idp initiate-auth \
  --auth-flow REFRESH_TOKEN_AUTH \
  --client-id $USER_POOL_CLIENT_ID \
  --auth-parameters REFRESH_TOKEN=$REFRESH_TOKEN \
  --region ap-southeast-2
```

## Automated Testing

Create an integration test script:

```bash
#!/bin/bash
set -e

echo "🧪 Testing WorthWatch Authentication..."

# Test public endpoint
echo "Testing /health endpoint..."
curl -s https://your-api-url.amazonaws.com/health | jq .

# Authenticate
echo "Authenticating..."
ACCESS_TOKEN=$(aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id $USER_POOL_CLIENT_ID \
  --auth-parameters USERNAME=$EMAIL,PASSWORD=$PASSWORD \
  --region ap-southeast-2 \
  --query 'AuthenticationResult.AccessToken' \
  --output text)

# Test protected endpoint
echo "Testing /watchlists endpoint..."
curl -s https://your-api-url.amazonaws.com/watchlists \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

echo "✅ All tests passed!"
```

## Next Steps

- Implement token refresh logic in your client
- Add integration tests for authentication flows
- Configure Cognito for passwordless authentication (OTP, Magic Link)
- Set up custom authentication challenges
- Implement user profile management endpoints
