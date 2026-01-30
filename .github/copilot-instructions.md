# Copilot instructions for WorthWatch Backend

## Big picture

- AWS CDK app (TypeScript) defines infrastructure in [bin/app.ts](bin/app.ts) and [lib/worthwatch-stack.ts](lib/worthwatch-stack.ts).
- Stack creates a Lambda + DynamoDB pair via `LambdaToDynamoDB` and an API Gateway HTTP API with a catch‑all route to the Lambda.
- Lambda handler lives in [lambda/index.ts](lambda/index.ts) and is deployed from compiled output in `dist/lambda` (CDK uses `lambda.Code.fromAsset('../dist/lambda')`).
- API Gateway access logging is enabled to a CloudWatch Log Group; DynamoDB table uses on‑demand billing and `id` string partition key.

## Key conventions & patterns

- Runtime is Node.js 24.x in CDK; keep Lambda code compatible with that runtime.
- Environment variable `DDB_TABLE_NAME` is injected automatically by the Solutions Construct (do not hard‑code table names in Lambda).
- HTTP API routes are `/{proxy+}` and `/` with `ANY` method; handler must accept `APIGatewayProxyEvent` and return `APIGatewayProxyResult`.
- Handler currently returns `{ "message": "hello" }` with JSON content type and logs event/context.

## Specs & documentation

- Behavior is spec‑driven; see OpenSpec docs under [openspec/specs](openspec/specs) (e.g., [lambda-compute/spec.md](openspec/specs/lambda-compute/spec.md)).
- Specs may lag code (e.g., runtime version). Prefer current code as source of truth unless instructed otherwise.

## Developer workflows

- Install: `npm install`
- Build TypeScript: `npm run build` (required before deploy so `dist/` is up to date).
- CDK operations: `npm run synth`, `npm run deploy`, `npm run destroy`.

## Integration points

- AWS services: API Gateway HTTP API, Lambda, DynamoDB, CloudWatch Logs.
- CDK outputs expose API URL and DynamoDB table name (see stack outputs in [lib/worthwatch-stack.ts](lib/worthwatch-stack.ts)).
