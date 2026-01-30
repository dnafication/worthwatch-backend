# WorthWatch Backend

WorthWatch is a spec-driven, cloud-native platform designed to help users make confident viewing decisions through curator-led watchlists. This repository contains the backend infrastructure and APIs built on AWS.

## Architecture

The backend is implemented using:

- **AWS CDK** - Infrastructure as Code for reproducible deployments
- **API Gateway (HTTP APIs)** - Low-latency REST API entry point
- **AWS Lambda** - Serverless compute with Node.js 24.x runtime
- **Amazon DynamoDB** - NoSQL database for scalable data storage
- **TypeScript** - Type-safe development throughout the stack

## Prerequisites

- Node.js 24.x or later
- AWS CLI configured with valid credentials
- AWS account with appropriate permissions

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Project

Compile TypeScript code:

```bash
npm run build
```

### 3. Bootstrap CDK (First Time Only)

If this is your first time using CDK in your AWS account/region:

```bash
npx cdk bootstrap
```

This creates the necessary staging resources for CDK deployments.

### 4. Synthesize CloudFormation Template

Preview the infrastructure that will be created:

```bash
npm run synth
```

The generated CloudFormation template will be in `cdk.out/WorthWatchStack.template.json`.

### 5. Deploy to AWS

Deploy the stack to your AWS account:

```bash
npm run deploy
```

After deployment completes, note the API Gateway URL in the outputs.

## Testing the API

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

## Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch mode for TypeScript compilation
- `npm run synth` - Synthesize CDK stack to CloudFormation
- `npm run deploy` - Deploy stack to AWS
- `npm run destroy` - Remove all AWS resources
- `npm run cdk` - Run CDK CLI commands directly

## Project Structure

```
.
├── bin/
│   └── app.ts              # CDK app entry point
├── lib/
│   └── worthwatch-stack.ts # Infrastructure definitions
├── lambda/
│   └── index.ts            # Lambda handler code
├── cdk.json                # CDK configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

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

## Cleanup

To remove all AWS resources and avoid charges:

```bash
npm run destroy
```

Confirm the deletion when prompted. Note: This will delete the DynamoDB table and all data.

## Development

### Modifying Infrastructure

1. Edit files in `lib/` or `bin/`
2. Run `npm run build` to compile
3. Run `npm run synth` to preview changes
4. Run `npm run deploy` to apply changes

### Modifying Lambda Code

1. Edit `lambda/index.ts`
2. Run `npm run build` to compile
3. Run `npm run deploy` to update the function

## Key Principles

- **OpenAPI is the source of truth** - APIs are spec-driven (to be added in future work)
- **Infrastructure as Code** - All resources defined in CDK
- **Type Safety** - TypeScript throughout for compile-time safety
- **Serverless** - Low-ops execution model with automatic scaling

## Next Steps

- Integrate OpenAPI specifications for API contract validation
- Add Amazon Cognito for authentication
- Implement business logic endpoints (watchlists, curators, ratings)
- Set up CI/CD pipeline for automated deployments

## License

ISC
