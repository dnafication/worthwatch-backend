# WorthWatch Backend

WorthWatch is a spec-driven, cloud-native platform designed to help users make confident viewing decisions through curator-led watchlists. This repository contains the backend infrastructure and APIs built on AWS.

## Architecture

The backend is implemented using:

- **AWS CDK** - Infrastructure as Code for reproducible deployments
- **API Gateway (HTTP APIs)** - Low-latency REST API entry point
- **AWS Lambda** - Serverless compute with Node.js 24.x runtime
- **Amazon DynamoDB** - NoSQL database for scalable data storage
- **TypeScript** - Type-safe development throughout the stack
- **GitHub Actions OIDC** - Secure, credential-free CI/CD deployments

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

Once deployed, test the hello endpoint:

```bash
curl https://<api-gateway-url>/hello
```

Expected response:

```json
{
  "message": "hello"
}
```

## Project Structure

```
.
├── bin/
│   └── app.ts                        # CDK app entry point
├── lib/
│   ├── worthwatch-stack.ts           # Main application infrastructure
│   └── github-actions-role-stack.ts  # GitHub Actions OIDC role
├── lambda/
│   └── index.ts                      # Lambda handler code
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

This project deploys two CDK stacks:

### 1. WorthwatchGithubActionsRoleStack

Infrastructure for secure GitHub Actions deployments using OIDC authentication.
**Note**: The GitHub OIDC provider has already been created manually in IAM.

**Resources**:

- OIDC identity provider for GitHub Actions
- IAM role with restricted trust policy (only `dnafication/worthwatch-backend` repo, `main` branch)
- Minimal permissions leveraging CDK bootstrap roles

**Purpose**: Enables GitHub Actions to deploy infrastructure without long-lived AWS credentials.

### 2. WorthWatchStack

Main application infrastructure including API Gateway, Lambda, and DynamoDB.

## Infrastructure Details

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

For detailed deployment instructions, CI/CD setup, and troubleshooting, see **[docs/DEPLOY.md](docs/DEPLOY.md)**.

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

- **OpenAPI is the source of truth** - APIs are spec-driven (to be added in future work)
- **Infrastructure as Code** - All resources defined in CDK
- **Type Safety** - TypeScript throughout for compile-time safety
- **Serverless** - Low-ops execution model with automatic scaling
- **Secure CI/CD** - OIDC-based GitHub Actions deployment (no long-lived credentials)

## Deployment

For comprehensive deployment instructions including:

- Manual deployment steps
- CI/CD setup with GitHub Actions
- Environment configuration
- Troubleshooting guide

See **[docs/DEPLOY.md](docs/DEPLOY.md)**

## Next Steps

- Integrate OpenAPI specifications for API contract validation
- Add Amazon Cognito for authentication
- Implement business logic endpoints (watchlists, curators, ratings)

## License

ISC
