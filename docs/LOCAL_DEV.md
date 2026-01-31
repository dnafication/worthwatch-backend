# Local Development Guide

This guide explains how to run and test the WorthWatch API locally using AWS SAM CLI without deploying to AWS for every change.

## Overview

The local development setup uses:
- **AWS SAM CLI** - Runs Lambda functions locally in Docker containers
- **API Gateway Emulation** - Local HTTP server that mimics API Gateway
- **Real AWS DynamoDB** - Connects to your deployed DynamoDB table (no local DB needed)

## Prerequisites

### 1. AWS SAM CLI

Install SAM CLI from [aws.amazon.com/serverless/sam](https://aws.amazon.com/serverless/sam/):

```bash
# macOS (Homebrew)
brew install aws-sam-cli

# Verify installation
sam --version
```

For other platforms, see [AWS SAM CLI installation guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html).

### 2. Docker

SAM CLI requires Docker to run Lambda containers locally:

```bash
# Verify Docker is installed and running
docker --version
docker ps
```

If not installed:
- **macOS**: [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
- **Linux**: Follow [Docker Engine installation](https://docs.docker.com/engine/install/)
- **Windows**: [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)

### 3. AWS Credentials

Configure AWS CLI with credentials that have access to your DynamoDB table:

```bash
# Configure default profile
aws configure

# Verify credentials work
aws sts get-caller-identity
```

Alternatively, use a named profile:
```bash
export AWS_PROFILE=worthwatch
```

### 4. Deploy Stack (One-Time)

You need to deploy the stack once to create the DynamoDB table that local development will use:

```bash
npm run deploy
```

This creates the DynamoDB table and other infrastructure. SAM Local will connect to this deployed table.

## Setup

### Get DynamoDB Table Name

After deploying, get your table name:

```bash
aws cloudformation describe-stacks \
  --stack-name WorthWatchStack \
  --query 'Stacks[0].Outputs[?OutputKey==`TableName`].OutputValue' \
  --output text
```

### Configure Environment (Optional)

If you need custom environment variables, create `.env.local`:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set:
```bash
DDB_TABLE_NAME=your-table-name-here
AWS_REGION=us-east-1
```

> **Note**: SAM Local will automatically use your deployed table via the synthesized CDK template, so `.env.local` is optional unless you need custom overrides.

## Running Locally

### Start Local API Server

```bash
# Quick start (recommended)
npm run dev
```

This command:
1. Compiles TypeScript (`npm run build`)
2. Synthesizes CDK template (`npm run synth`)
3. Starts SAM Local API on `http://localhost:3000`
4. Uses warm containers for faster reloads

You'll see output like:
```
Mounting ApiLambdaDynamoDBLambdaFunction26DAE23A at http://127.0.0.1:3000/ [GET, POST, PUT, DELETE, OPTIONS]
Mounting ApiLambdaDynamoDBLambdaFunction26DAE23A at http://127.0.0.1:3000/{proxy+} [GET, POST, PUT, DELETE, OPTIONS]
```

### Test Local Endpoints

In another terminal:

```bash
# Test root endpoint
curl http://localhost:3000/

# Test watchlists endpoints
curl http://localhost:3000/watchlists

# Create a watchlist
curl -X POST http://localhost:3000/watchlists \
  -H "Content-Type: application/json" \
  -d '{"name":"My Watchlist","description":"Test watchlist"}'

# Get specific watchlist
curl http://localhost:3000/watchlists/123
```

### Alternative: Invoke Function Directly

To test a Lambda function directly without API Gateway:

```bash
npm run local:invoke
```

## Development Workflow

### Iterative Development

1. **Terminal 1 - Start server:**
   ```bash
   npm run dev
   ```

2. **Terminal 2 - Edit and rebuild:**
   ```bash
   # Make changes to lambda/index.ts or lambda/routes/*.ts
   npm run build
   
   # SAM will automatically reload the changes
   ```

3. **Test your changes:**
   ```bash
   curl http://localhost:3000/your-endpoint
   ```

### Hot Reload

SAM Local supports warm containers, which means:
- First request may be slow (cold start)
- Subsequent requests are fast
- When you rebuild, SAM detects changes and reloads

For true hot reload, consider using `tsc --watch` in a separate terminal:

```bash
# Terminal 1
npm run watch

# Terminal 2
npm run local:start

# Edit files, tsc auto-compiles, SAM auto-reloads
```

## Configuration Files

### samconfig.toml

The SAM configuration file points to the CDK-synthesized template:

```toml
[default.local_start_api.parameters]
template_file = "cdk.out/WorthWatchStack.template.json"
skip_pull_image = true
parameter_overrides = ""
```

### NPM Scripts

Available scripts in `package.json`:

```json
{
  "dev": "npm run local:start",
  "local:build": "npm run build && npm run synth",
  "local:start": "npm run local:build && sam local start-api --warm-containers EAGER",
  "local:invoke": "npm run local:build && sam local invoke <FunctionLogicalId>"
}
```

## Troubleshooting

### SAM CLI Not Found

**Error:** `command not found: sam`

**Solution:**
```bash
# macOS
brew install aws-sam-cli

# Other platforms
# See: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html
```

### Docker Not Running

**Error:** `Cannot connect to the Docker daemon`

**Solution:**
```bash
# Start Docker Desktop or Docker daemon
# Verify with:
docker ps
```

### Cannot Access DynamoDB

**Error:** `ResourceNotFoundException: Requested resource not found`

**Solution:**
1. Verify AWS credentials:
   ```bash
   aws sts get-caller-identity
   ```

2. Check table exists:
   ```bash
   aws dynamodb list-tables
   ```

3. Ensure correct region:
   ```bash
   export AWS_REGION=us-east-1
   ```

4. Verify IAM permissions include DynamoDB access

### Code Changes Not Reflected

**Problem:** Changes to Lambda code don't appear

**Solution:**
1. Rebuild TypeScript:
   ```bash
   npm run build
   ```

2. Restart SAM:
   ```bash
   # Stop with Ctrl+C, then:
   npm run dev
   ```

3. Check warm containers are enabled in `samconfig.toml`

### Port Already in Use

**Error:** `Address already in use`

**Solution:**
```bash
# Use a different port
sam local start-api --port 3001
```

### Template Not Found

**Error:** `Template file not found`

**Solution:**
```bash
# Synthesize CDK template
npm run synth

# Verify file exists
ls -la cdk.out/WorthWatchStack.template.json
```

### Lambda Handler Not Found

**Error:** `Cannot find module 'index'`

**Solution:**

Check that:
1. TypeScript is compiled: `npm run build`
2. `dist/lambda/index.js` exists
3. Handler path in template is correct: `index.handler`

### CORS Issues

If you're testing from a browser and hit CORS errors, note that SAM Local inherits CORS settings from your CDK stack. The template includes:

```yaml
Cors:
  AllowOrigins: ['*']
  AllowMethods: [GET, POST, PUT, DELETE, OPTIONS]
  AllowHeaders: [Content-Type, Authorization]
```

## Best Practices

### 1. Use Warm Containers

Always use `--warm-containers EAGER` for development (already in `npm run dev`):
```bash
sam local start-api --warm-containers EAGER
```

### 2. Use Watch Mode

For fastest iteration, keep TypeScript in watch mode:
```bash
npm run watch  # Terminal 1
npm run local:start  # Terminal 2
```

### 3. Separate Dev and Prod Tables

Consider using different DynamoDB tables for local development vs production:

```bash
# Deploy a dev stack
cdk deploy --context environment=dev

# Use dev table locally
DDB_TABLE_NAME=WorthWatchStack-Dev-Table npm run dev
```

### 4. Check Lambda Logs

SAM Local outputs Lambda logs to console. Look for:
- Initialization errors
- Runtime errors
- Your console.log statements

### 5. Test Before Deploying

Always test locally before deploying:
```bash
# Local testing
npm run dev
# Run tests

# Deploy only when tests pass
npm run deploy
```

## Limitations

### What SAM Local Does

- ✅ Runs Lambda function in Docker container
- ✅ Emulates API Gateway HTTP API
- ✅ Connects to real AWS services (DynamoDB, S3, etc.)
- ✅ Uses IAM credentials from your AWS CLI config
- ✅ Supports environment variables

### What SAM Local Doesn't Do

- ❌ Emulate DynamoDB locally (uses real AWS DynamoDB)
- ❌ Emulate CloudWatch Logs (logs output to console)
- ❌ Emulate IAM policies exactly (uses your credentials)
- ❌ Emulate Lambda concurrency limits
- ❌ Emulate API Gateway throttling

## Advanced Usage

### Custom SAM Commands

```bash
# List available functions
sam local list resources

# Invoke with custom event
sam local invoke -e event.json

# Start API on different port
sam local start-api --port 8080

# Debug with breakpoints
sam local start-api --debug-port 5858
```

### Environment Variables

Pass environment variables at runtime:

```bash
sam local start-api \
  --parameter-overrides "ParameterKey=DDBTableName,ParameterValue=MyTable"
```

### Using Local DynamoDB (Alternative)

If you prefer not to use the deployed table:

1. Run DynamoDB Local:
   ```bash
   docker run -p 8000:8000 amazon/dynamodb-local
   ```

2. Override endpoint in Lambda code:
   ```typescript
   const ddb = new DynamoDBClient({
     endpoint: process.env.LOCAL_DYNAMODB_ENDPOINT || undefined
   });
   ```

3. Set environment variable:
   ```bash
   LOCAL_DYNAMODB_ENDPOINT=http://host.docker.internal:8000 npm run dev
   ```

## Next Steps

- Set up automated testing with Jest
- Add request validation and error handling
- Implement authentication with Cognito
- Add more endpoints for watchlists, curators, ratings

## Additional Resources

- [AWS SAM CLI Documentation](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)
- [Testing CDK Applications Locally](https://docs.aws.amazon.com/cdk/v2/guide/testing-locally-with-sam-cli.html)
- [SAM Local Examples](https://github.com/aws/aws-sam-cli/tree/develop/samcli/local)
