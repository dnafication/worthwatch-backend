## Context

WorthWatch is a greenfield TypeScript backend on AWS, requiring foundational infrastructure before any API endpoints can be implemented. The platform follows a spec-driven approach where OpenAPI defines contracts. This design establishes the CDK project structure and core AWS resources.

Current state: Empty repository with OpenSpec configuration only.

Constraints:
- Must use TypeScript throughout (CDK and Lambda runtime)
- OpenAPI specs will drive API contracts (future work)
- Low-ops execution model required (serverless)

## Goals / Non-Goals

**Goals:**
- Initialize a working CDK TypeScript project with proper tooling
- Deploy API Gateway (HTTP APIs) as the entry point for REST APIs
- Create Lambda compute layer with a simple "hello world" handler
- Provision DynamoDB table using AWS Solutions Constructs for best practices
- Establish reusable patterns for future infrastructure additions

**Non-Goals:**
- OpenAPI integration (handled in future changes)
- Authentication/authorization (Cognito setup is separate)
- Multiple Lambda functions or API routes (just foundation)
- Production-grade observability (basic CloudWatch only for now)

## Decisions

### 1. CDK Project Structure
**Decision**: Use standard CDK app layout with separate `bin/`, `lib/`, and `lambda/` directories.

**Rationale**:
- `bin/`: CDK app entry point (defines stacks)
- `lib/`: Infrastructure construct definitions
- `lambda/`: Lambda handler source code (separate from infrastructure)

**Alternatives considered**: Co-locating Lambda code with constructs—rejected because it mixes infrastructure and application concerns.

### 2. AWS Solutions Constructs for Lambda-DynamoDB
**Decision**: Use `@aws-solutions-constructs/aws-lambda-dynamodb` instead of manually wiring resources.

**Rationale**:
- Provides vetted patterns with proper IAM permissions
- Handles DynamoDB stream setup if needed later
- Reduces boilerplate and configuration errors
- Official AWS library with maintained best practices

**Alternatives considered**: Manual CDK resources—rejected due to higher complexity and maintenance burden.

### 3. HTTP APIs (API Gateway v2)
**Decision**: Use API Gateway HTTP APIs instead of REST APIs.

**Rationale**:
- Lower cost (~71% cheaper)
- Lower latency
- Simpler configuration
- Modern JWT authorizer support (for future Cognito integration)
- Better match for OpenAPI-driven design

**Alternatives considered**: REST APIs—rejected due to higher cost and unnecessary features.

### 4. TypeScript Lambda Runtime
**Decision**: Use Node.js 24.x runtime with TypeScript compiled to JavaScript.

**Rationale**:
- Consistency with CDK tooling
- Fast cold starts
- Native AWS SDK v3 support
- Team expertise

**Alternatives considered**: Python—rejected to maintain single-language stack.

### 5. Hello World Handler
**Decision**: Implement minimal Lambda that returns `{ message: "hello" }` as JSON.

**Rationale**:
- Validates full request/response flow
- Establishes handler pattern for future endpoints
- Simple enough to verify deployment

## Risks / Trade-offs

**[Risk]** CDK deployment requires AWS credentials and proper permissions
→ **Mitigation**: Document required IAM permissions; use CDK bootstrap

**[Risk]** DynamoDB table schema not defined yet
→ **Mitigation**: Start with generic table; partition key can be adjusted in future changes

**[Risk]** No request validation at API Gateway layer
→ **Mitigation**: Intentional—validation will be added when OpenAPI integration is implemented

**[Trade-off]** Using Solutions Constructs adds dependency
→ **Benefit**: Reduced maintenance and built-in best practices outweigh dependency cost

**[Trade-off]** Single Lambda for "hello world" is over-engineered for the response
→ **Benefit**: Establishes working pattern for real API endpoints coming next

## Migration Plan

**Deployment Steps**:
1. Install dependencies: `npm install`
2. Bootstrap CDK (first time): `cdk bootstrap`
3. Deploy stack: `cdk deploy`
4. Test endpoint: `curl <api-gateway-url>/hello`

**Rollback Strategy**:
- `cdk destroy` removes all resources
- No data loss risk (no production data yet)

## Open Questions

- What AWS region should be the default? ap-southeast-2 for now
- What should the DynamoDB table's partition key be? (Using generic `id` for now)
- Should CloudWatch Logs retention be configured? (Defaulting to never expire for now)
