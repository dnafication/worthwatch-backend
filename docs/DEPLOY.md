# Deployment Guide

This guide covers deployment strategies for the WorthWatch backend infrastructure.

## Table of Contents

- [Prerequisites](#prerequisites)
- [CDK Stacks Overview](#cdk-stacks-overview)
- [Initial Setup](#initial-setup)
- [Manual Deployment](#manual-deployment)
- [CI/CD with GitHub Actions](#cicd-with-github-actions)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- Node.js 24.x or later installed
- AWS CLI configured with valid credentials
- AWS account with appropriate permissions
- CDK CLI installed (`npm install -g aws-cdk`)

## CDK Stacks Overview

This project deploys two CDK stacks:

### 1. WorthwatchGithubActionsRoleStack

Infrastructure for secure GitHub Actions deployments using OIDC authentication.

**Resources**:

- OIDC identity provider for GitHub Actions
- IAM role with restricted trust policy (only `dnafication/worthwatch-backend` repo, `main` branch)
- Minimal permissions leveraging CDK bootstrap roles

**Purpose**: Enables GitHub Actions to deploy infrastructure without long-lived AWS credentials.

**When to deploy**: Once per AWS account, before setting up CI/CD automation.

### 2. WorthWatchStack

Main application infrastructure including API Gateway, Lambda, and DynamoDB.

**Resources**:

- HTTP API Gateway with CORS and logging
- Lambda function (Node.js 24.x runtime)
- DynamoDB table (on-demand billing)
- CloudWatch log groups

**Purpose**: The actual backend application infrastructure.

**When to deploy**: Every time you make infrastructure or application changes.

## Initial Setup

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

This creates the necessary staging resources for CDK deployments, including:

- S3 bucket for CDK assets
- ECR repository for container images
- IAM roles (DeploymentActionRole, CloudFormationExecutionRole, etc.)
- SSM parameters for version tracking

**Note**: You only need to bootstrap once per AWS account/region combination.

### 4. Synthesize CloudFormation Templates

Preview the infrastructure that will be created:

```bash
npm run synth
```

This generates CloudFormation templates in `cdk.out/` directory:

- `WorthwatchGithubActionsRoleStack.template.json`
- `WorthWatchStack.template.json`

Review these templates to understand what resources will be created.

## Manual Deployment

### Deploy GitHub Actions Role Stack (One-Time Setup)

Before setting up CI/CD, deploy the IAM role for GitHub Actions:

```bash
npx cdk deploy WorthwatchGithubActionsRoleStack
```

After deployment, retrieve the role ARN:

```bash
aws cloudformation describe-stacks \
  --stack-name WorthwatchGithubActionsRoleStack \
  --query "Stacks[0].Outputs[?OutputKey=='GitHubActionsRoleArn'].OutputValue" \
  --output text
```

Save this ARN - you'll need it for GitHub Actions configuration.

### Deploy Application Stack

Deploy the main application stack:

```bash
npm run deploy
# Or specifically:
npx cdk deploy WorthWatchStack
```

After deployment completes, note the API Gateway URL in the outputs.

### Deploy All Stacks at Once

To deploy both stacks together:

```bash
npx cdk deploy --all
```

Use `--require-approval never` to skip approval prompts (useful for automation).

### Verify Deployment

Test the deployed API:

```bash
# Get API URL from outputs
API_URL=$(aws cloudformation describe-stacks \
  --stack-name WorthWatchStack \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text)

# Test the endpoint
curl ${API_URL}/hello
```

Expected response:

```json
{
  "message": "hello"
}
```

### Destroy Resources

To remove all AWS resources and avoid charges:

```bash
npm run destroy
# Or specifically:
npx cdk destroy --all
```

Confirm the deletion when prompted. **Warning**: This will delete the DynamoDB table and all data.

## CI/CD with GitHub Actions

This project includes automated deployment via GitHub Actions using OIDC authentication (no long-lived credentials required).

### Architecture

The GitHub Actions workflow uses a secure, credential-free deployment model:

1. **OIDC Authentication**: GitHub Actions authenticates to AWS using OIDC tokens (no secrets)
2. **IAM Role Assumption**: Workflow assumes the `WorthwatchGithubActionsDeployRole`
3. **CDK Bootstrap Roles**: The role triggers CDK, which uses pre-provisioned bootstrap roles
4. **Resource Creation**: CloudFormationExecutionRole creates actual AWS resources

### Setup Instructions

#### Step 1: Deploy the GitHub Actions Role Stack

First, deploy the `WorthwatchGithubActionsRoleStack` to create the OIDC provider and IAM role:

```bash
npx cdk deploy WorthwatchGithubActionsRoleStack
```

This creates:

- GitHub OIDC provider in AWS IAM (if not already present)
- IAM role: `WorthwatchGithubActionsDeployRole`
- Trust policy restricting to `dnafication/worthwatch-backend` repo, `main` branch

#### Step 2: Retrieve the Role ARN

Get the role ARN from the stack outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name WorthwatchGithubActionsRoleStack \
  --query "Stacks[0].Outputs[?OutputKey=='GitHubActionsRoleArn'].OutputValue" \
  --output text
```

Example output: `arn:aws:iam::123456789012:role/WorthwatchGithubActionsDeployRole`

#### Step 3: Configure GitHub Environments

In your GitHub repository settings:

1. Navigate to **Settings** → **Environments**
2. Create two environments: `dev` and `prod`
3. For the `prod` environment, configure protection rules:
   - Go to environment settings
   - Enable "Required reviewers"
   - Add team members as reviewers

This ensures production deployments require manual approval.

#### Step 4: Configure GitHub Secrets

Add the following secrets to **both** `dev` and `prod` environments:

| Secret Name           | Example Value                                                      | Description                    |
| --------------------- | ------------------------------------------------------------------ | ------------------------------ |
| `AWS_ROLE_ARN`        | `arn:aws:iam::123456789012:role/WorthwatchGithubActionsDeployRole` | IAM role ARN from Step 2       |
| `AWS_REGION`          | `us-east-1`                                                        | AWS region for deployment      |
| `CDK_DEFAULT_ACCOUNT` | `123456789012`                                                     | (Optional) Your AWS account ID |
| `CDK_DEFAULT_REGION`  | `us-east-1`                                                        | (Optional) Default CDK region  |

**To add environment secrets**:

1. Go to **Settings** → **Environments** → Select environment (dev or prod)
2. Click **Add secret**
3. Enter secret name and value
4. Click **Add secret** to save

Repeat for all required secrets in both environments.

#### Step 5: Trigger Deployment

The workflow automatically deploys when you push to the `main` branch:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

**Deployment flow**:

- **Dev environment**: Deploys automatically (no approval required)
- **Prod environment**: Waits for manual approval if protection rules are configured

To manually trigger a deployment without pushing:

1. Go to **Actions** tab in GitHub
2. Select "CDK Deploy" workflow
3. Click "Run workflow"
4. Select branch and confirm

### How It Works

The GitHub Actions workflow (`.github/workflows/deploy.yml`):

1. **Checkout**: Pulls the latest code from the repository
2. **Setup Node.js**: Installs Node.js 24.x with npm caching
3. **Configure AWS Credentials**: Uses OIDC to authenticate (no credentials stored)
4. **Install Dependencies**: Runs `npm ci` to install packages
5. **Build Project**: Compiles TypeScript code
6. **Synthesize**: Generates CloudFormation templates
7. **Deploy**: Runs `cdk deploy --all` to deploy both stacks

**Security Features**:

The IAM role trust policy restricts authentication to:

- **Repository**: `dnafication/worthwatch-backend` only
- **Branch**: `main` branch only
- **Authentication Method**: GitHub OIDC only (no long-lived credentials)

This ensures only authorized workflows from your repository can deploy.

### Permissions Model

The deployment uses a layered permissions model following AWS best practices:

**Layer 1: GitHub Actions Role**

- Minimal permissions to trigger deployments
- Can assume CDK DeploymentActionRole
- Can call CloudFormation APIs
- Can read from S3 staging bucket
- Can read SSM parameters
- Can pass CloudFormationExecutionRole

**Layer 2: CDK DeploymentActionRole** (Created during bootstrap)

- Orchestrates CDK deployments
- Manages CloudFormation stacks
- Uploads assets to S3/ECR

**Layer 3: CloudFormationExecutionRole** (Created during bootstrap)

- Actually creates AWS resources
- Has permissions for Lambda, DynamoDB, API Gateway, etc.
- Used by CloudFormation service

This separation ensures the GitHub Actions role has minimal permissions, while the powerful resource-creation permissions are isolated to the CloudFormation execution role.

### Monitoring Deployments

**View workflow runs**:

1. Go to **Actions** tab in GitHub
2. Click on "CDK Deploy" workflow
3. Select a specific run to view logs

**View AWS CloudFormation events**:

```bash
aws cloudformation describe-stack-events \
  --stack-name WorthWatchStack \
  --max-items 20
```

**View stack outputs**:

```bash
aws cloudformation describe-stacks \
  --stack-name WorthWatchStack \
  --query "Stacks[0].Outputs"
```

## Troubleshooting

### CDK Bootstrap Issues

**Error: "SSM parameter /cdk-bootstrap/\*/version not found"**

**Solution**: Your AWS environment hasn't been bootstrapped yet:

```bash
npx cdk bootstrap aws://ACCOUNT-ID/REGION
```

**Error: "Cannot find bucket cdk-_-assets-_"**

**Solution**: CDK bootstrap assets bucket is missing. Re-run bootstrap:

```bash
npx cdk bootstrap --force
```

### GitHub Actions Deployment Issues

**Error: "not authorized to perform: sts:AssumeRole"**

**Possible causes**:

1. Role ARN in GitHub secrets doesn't match the deployed role
2. Workflow is running from a different branch (not `main`)
3. OIDC provider doesn't exist in AWS IAM

**Solutions**:

```bash
# Verify role exists
aws iam get-role --role-name WorthwatchGithubActionsDeployRole

# Verify OIDC provider exists
aws iam list-open-id-connect-providers

# Check role trust policy
aws iam get-role --role-name WorthwatchGithubActionsDeployRole \
  --query "Role.AssumeRolePolicyDocument"
```

**Error: "User is not authorized to perform: cloudformation:CreateChangeSet"**

**Solution**: The GitHub Actions role might be missing permissions. Check the role's policies:

```bash
aws iam list-attached-role-policies \
  --role-name WorthwatchGithubActionsDeployRole

aws iam list-role-policies \
  --role-name WorthwatchGithubActionsDeployRole
```

**Error: "No changes to deploy"**

**Solution**: This is informational, not an error. CDK detected no infrastructure changes.

### Stack Deployment Issues

**Error: "Resource already exists"**

**Solution**: A resource with the same name exists. Either:

1. Delete the conflicting resource manually
2. Import it into CDK (advanced)
3. Change the resource name in your CDK code

**Error: "Rate exceeded" from AWS APIs**

**Solution**: AWS API throttling. Wait a few minutes and retry:

```bash
npx cdk deploy --all
```

**Error: "Insufficient permissions"**

**Solution**: Your AWS credentials lack required permissions. Ensure you have:

- CloudFormation permissions
- Permissions for all resources being created (Lambda, DynamoDB, API Gateway, etc.)
- IAM permissions if creating roles

### Application Issues

**API returns 403 or 500 errors**

**Solutions**:

1. Check Lambda function logs:

```bash
aws logs tail /aws/lambda/WorthWatchStack-ApiLambdaDynamoDBLambdaFunction* --follow
```

2. Verify DynamoDB table exists:

```bash
aws dynamodb list-tables
```

3. Check API Gateway logs:

```bash
aws logs tail /aws/apigateway/worthwatch-api --follow
```

**Lambda function timeout**

**Solution**: Increase timeout in `lib/worthwatch-stack.ts`:

```typescript
lambdaFunctionProps: {
  timeout: cdk.Duration.seconds(30), // Increase from default
  // ... other props
}
```

### Rollback

If a deployment fails or causes issues, you can rollback:

**Manual rollback via AWS Console**:

1. Go to CloudFormation in AWS Console
2. Select the stack
3. Click "Stack actions" → "Roll back"

**Redeploy previous version**:

```bash
git checkout <previous-commit>
npm run build
npx cdk deploy --all
```

### Getting Help

**View CDK documentation**:

```bash
npx cdk docs
```

**View AWS CloudFormation stack events**:

```bash
aws cloudformation describe-stack-events --stack-name WorthWatchStack
```

**Enable CDK debug output**:

```bash
npx cdk deploy --verbose --all
```

**Check AWS service limits**:
Some errors occur due to AWS service quotas. Check your limits in the AWS Console under "Service Quotas".

## Best Practices

### Development Workflow

1. **Make changes locally**
2. **Build and test**: `npm run build && npm run synth`
3. **Deploy to dev manually**: `npx cdk deploy --all` (for testing)
4. **Commit and push**: Triggers CI/CD to deploy to dev/prod environments
5. **Monitor deployment**: Watch GitHub Actions and CloudFormation events

### Security

- **Never commit AWS credentials** to the repository
- **Use environment-specific secrets** for dev and prod
- **Enable MFA** for production environment approvals
- **Review IAM policies** regularly for least privilege
- **Enable CloudTrail** for audit logging

### Cost Optimization

- Use **on-demand billing** for DynamoDB during development
- Consider **provisioned capacity** for production with predictable traffic
- Set **log retention** policies to avoid excessive CloudWatch costs
- Use **CDK destroy** to tear down dev environments when not needed

### Monitoring

- Enable **X-Ray tracing** for Lambda functions
- Set up **CloudWatch alarms** for key metrics
- Configure **SNS notifications** for deployment failures
- Review **cost allocation tags** for resource tracking
