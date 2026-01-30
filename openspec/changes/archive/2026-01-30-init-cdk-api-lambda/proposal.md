## Why

WorthWatch needs foundational infrastructure to serve its spec-driven REST APIs. This initializes the CDK TypeScript project with API Gateway (HTTP APIs), Lambda compute, and DynamoDB storage—the core execution model for the platform. Without this, no backend services can be deployed.

## What Changes

- Initialize AWS CDK TypeScript project with proper structure and dependencies
- Create API Gateway (HTTP APIs) resource with Lambda integration
- Set up aws-lambda-dynamodb construct from AWS Solutions Constructs library
- Implement a "hello world" Lambda handler as foundation for future API endpoints
- Configure TypeScript compilation and CDK tooling
- Establish IaC patterns for the rest of the platform

## Capabilities

### New Capabilities
- `cdk-infrastructure`: CDK project setup, configuration, and deployment scripts
- `api-gateway-integration`: HTTP API Gateway resource with Lambda proxy integration
- `lambda-compute`: Lambda function configuration and execution runtime
- `dynamodb-storage`: DynamoDB table provisioning using aws-lambda-dynamodb construct

### Modified Capabilities
<!-- No existing capabilities to modify - this is a greenfield initialization -->

## Impact

- **New Dependencies**: aws-cdk-lib, @aws-solutions-constructs/aws-lambda-dynamodb, AWS CDK CLI
- **New Files**: CDK app structure (bin/, lib/, lambda/), cdk.json, tsconfig.json
- **Infrastructure**: Creates AWS resources in target account (API Gateway, Lambda, DynamoDB)
- **Foundation**: All future backend capabilities will build on this infrastructure pattern
