# WorthWatch Backend

WorthWatch is a spec-driven, cloud-native platform designed to help users make confident viewing decisions through curator-led watchlists. This repository contains the backend infrastructure and APIs built on AWS.

## Architecture

The backend is implemented using:

- **AWS CDK** - Infrastructure as Code for reproducible deployments
- **API Gateway (HTTP APIs)** - Low-latency REST API entry point with JWT authorization
- **AWS Cognito** - User authentication and identity management
- **AWS Lambda** - Serverless compute with Node.js 24.x runtime
- **Amazon DynamoDB** - NoSQL database for scalable data storage
- **TypeScript** - Type-safe development throughout the stack

## Prerequisites

- Node.js 24.x or later
- AWS CLI configured with valid credentials
- AWS account with appropriate permissions

## Getting Started

### Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Bootstrap CDK (first time only)
npx cdk bootstrap

# Deploy to AWS
npx cdk deploy --all
```

For detailed deployment instructions, CI/CD setup, and troubleshooting, see **[docs/DEPLOY.md](docs/DEPLOY.md)**.

### Basic Commands

### Testing the API

Once deployed, test the public health endpoint:

```bash
curl https://<api-gateway-url>/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2024-01-31T03:30:00.000Z"
}
```

For authenticated endpoints, you'll need a valid JWT token from Cognito. See [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md) for details.

## Project Structure

```
.
├── bin/
│   └── app.ts                        # CDK app entry point
├── lib/
│   ├── worthwatch-stack.ts           # Main application infrastructure
├── lambda/
│   └── index.ts                      # Lambda handler
├── .github/
│   └── workflows/
│       └── deploy.yml                # CI/CD deployment workflow
├── docs/
│   └── DEPLOY.md                     # Deployment and CI/CD guide
├── README.md                         # Project overview (this file)
├── cdk.json                          # CDK configuration
├── tsconfig.json                     # TypeScript configuration
└── package.json                      # Dependencies and scripts
```

## Stacks

This project deploys one CDK stack:

### 1. WorthWatchStack

Main application infrastructure including API Gateway, Lambda, and DynamoDB.

## Infrastructure Details

### Authentication

- **Type**: AWS Cognito User Pool with passwordless support
- **JWT Verification**: Done by API Gateway JWT Authorizer
- **Public endpoints**: `/health`, `/ping` - no authentication required
- **Protected endpoints**: `/watchlists/*` - require valid JWT token
- See [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md) for complete guide

### API Gateway

- **Type**: HTTP API (API Gateway v2)
- **Features**: CORS enabled, CloudWatch logging
- **Routes**: Catch-all route forwards all requests to Lambda

### Lambda Function

- **Runtime**: Node.js 24.x
- **Handler**: Processes API Gateway proxy events
- **Permissions**: Automatic DynamoDB access via Solutions Construct

### DynamoDB Table

- **Partition Key**: `id` (String)
- **Billing**: On-demand (pay-per-request)
- **Encryption**: AWS managed keys
- **Backups**: Point-in-time recovery configurable

## Development

### Local Development

Run and test the API locally using AWS SAM CLI without deploying for every change.

```bash
# Quick start
npm run dev
```

This starts a local API server on `http://localhost:3000` that connects to your deployed DynamoDB table.

**For complete setup instructions, troubleshooting, and best practices, see [docs/LOCAL_DEV.md](docs/LOCAL_DEV.md).**

### Modifying Infrastructure

1. Edit files in `lib/` or `bin/`
2. Run `npm run build` to compile
3. Run `npm run synth` to preview changes
4. Run `npm run deploy` to apply changes

### Modifying Lambda Code

1. Edit `lambda/index.ts`
2. Run `npm run build` to compile
3. Run `npm run deploy` to update the function

## Cleanup

To remove all AWS resources and avoid charges:

```bash
npm run destroy
```

Confirm the deletion when prompted. Note: This will delete the DynamoDB table and all data.

## Key Principles

- **Infrastructure as Code** - All resources defined in CDK
- **Type Safety** - TypeScript throughout for compile-time safety
- **Serverless** - Low-ops execution model with automatic scaling
- **Secure CI/CD** - Uses AWS credentials configured in your environment

## Deployment

For comprehensive deployment instructions including:

- Manual deployment steps
- CI/CD setup with GitHub Actions
- Environment configuration
- Troubleshooting guide

See **[docs/DEPLOY.md](docs/DEPLOY.md)**

## Next Steps

- Configure Cognito for passwordless authentication flows (OTP, Magic Link)
- Integrate OpenAPI specifications for API contract validation
- Implement business logic endpoints (watchlists, curators, ratings)
- Add user profile management endpoints

## License

ISC
