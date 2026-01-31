import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';

/**
 * Properties for the GithubActionsRoleStack
 */
export interface GithubActionsRoleStackProps extends cdk.StackProps {
  /**
   * GitHub organization name (e.g., 'dnafication')
   */
  readonly githubOrg: string;

  /**
   * GitHub repository name (e.g., 'worthwatch-backend')
   */
  readonly githubRepo: string;

  /**
   * Optional branch/ref restriction (e.g., 'main')
   * If provided, only this branch can assume the role
   */
  readonly githubRef?: string;
}

/**
 * CDK Stack that creates IAM resources for GitHub Actions OIDC authentication.
 *
 * This stack provisions:
 * - IAM role that GitHub Actions can assume via OIDC (OIDC provider is pre-created)

 * - Minimal permissions leveraging CDK bootstrap roles
 *
 * The role follows AWS CDK best practices by granting permission to assume
 * the CDK DeploymentActionRole rather than direct resource permissions.
 *
 * ## Usage
 *
 * After deploying this stack:
 * 1. Retrieve the role ARN from CloudFormation outputs
 * 2. Configure it in GitHub repository secrets as AWS_ROLE_ARN
 * 3. Use aws-actions/configure-aws-credentials@v4 in workflows with role-to-assume
 *
 * ## Security
 *
 * Trust policy restricts authentication to:
 * - Specific GitHub organization and repository
 * - Optional branch restriction (recommended: main)
 * - OIDC authentication only (no long-lived credentials)
 *
 * ## Permissions Model
 *
 * This role has minimal permissions and leverages CDK bootstrap roles:
 * - sts:AssumeRole → Assumes CDK DeploymentActionRole
 * - CloudFormation → Creates/updates stacks (which use CloudFormationExecutionRole)
 * - S3 → Reads from CDK staging bucket
 * - SSM → Reads bootstrap version parameter
 * - iam:PassRole → Passes CloudFormationExecutionRole to CloudFormation
 *
 * The CDK bootstrap roles (CloudFormationExecutionRole) actually create AWS resources.
 */
export class GithubActionsRoleStack extends cdk.Stack {
  public readonly role: iam.Role;

  constructor(
    scope: Construct,
    id: string,
    props: GithubActionsRoleStackProps
  ) {
    super(scope, id, props);

    const { githubOrg, githubRepo, githubRef } = props;

    // GitHub OIDC provider URL and thumbprint
    const githubOidcUrl = 'token.actions.githubusercontent.com';
    const githubThumbprint = '6938fd4d98bab03faadb97b34396831e3780aea1';

    // Use existing OIDC provider (created manually in IAM)
    const oidcProvider = iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
      this,
      'GithubOidcProvider',
      `arn:aws:iam::${this.account}:oidc-provider/${githubOidcUrl}`
    );

    // Build trust policy conditions
    const allowedSubs = githubRef
      ? [
          // When a specific branch/ref is provided, restrict assumption to that ref only
          `repo:${githubOrg}/${githubRepo}:ref:refs/heads/${githubRef}`,
        ]
      : [`repo:${githubOrg}/${githubRepo}:*`];

    const trustConditions: { [key: string]: any } = {
      StringEquals: {
        [`${githubOidcUrl}:aud`]: 'sts.amazonaws.com',
      },
      StringLike: {
        [`${githubOidcUrl}:sub`]: allowedSubs,
      },
    };

    // Create IAM role for GitHub Actions
    this.role = new iam.Role(this, 'GithubActionsDeployRole', {
      roleName: 'WorthwatchGithubActionsDeployRole',
      description:
        'Role assumed by GitHub Actions for CDK deployments via OIDC',
      assumedBy: new iam.WebIdentityPrincipal(
        oidcProvider.openIdConnectProviderArn,
        trustConditions
      ),
      maxSessionDuration: cdk.Duration.hours(1),
    });

    // Add minimal permissions for CDK deployment
    // These permissions allow GitHub Actions to trigger CDK deployment,
    // which then uses the bootstrap roles to actually create resources

    // 1. Permission to assume CDK bootstrap roles
    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sts:AssumeRole'],
        resources: [
          `arn:aws:iam::${this.account}:role/cdk-*-deploy-role-*`,
          `arn:aws:iam::${this.account}:role/cdk-*-file-publishing-role-*`,
          `arn:aws:iam::${this.account}:role/cdk-*-image-publishing-role-*`,
        ],
      })
    );

    // 2. CloudFormation permissions (CDK orchestration)
    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudformation:CreateChangeSet',
          'cloudformation:DeleteChangeSet',
          'cloudformation:DescribeChangeSet',
          'cloudformation:DescribeStacks',
          'cloudformation:DescribeStackEvents',
          'cloudformation:ExecuteChangeSet',
          'cloudformation:GetTemplate',
        ],
        resources: ['*'],
      })
    );

    // 3. S3 permissions for CDK staging bucket (read/write for asset uploads)
    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject*',
          's3:GetBucket*',
          's3:List*',
          's3:DeleteObject*',
          's3:PutObject*',
          's3:Abort*',
        ],
        resources: [
          `arn:aws:s3:::cdk-*-assets-${this.account}-${this.region}`,
          `arn:aws:s3:::cdk-*-assets-${this.account}-${this.region}/*`,
        ],
      })
    );

    // 4. ECR permissions for Docker image publishing (CDK bootstrap)
    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ecr:PutImage',
          'ecr:InitiateLayerUpload',
          'ecr:UploadLayerPart',
          'ecr:CompleteLayerUpload',
          'ecr:BatchCheckLayerAvailability',
          'ecr:DescribeRepositories',
          'ecr:DescribeImages',
          'ecr:BatchGetImage',
          'ecr:GetDownloadUrlForLayer',
        ],
        resources: [`arn:aws:ecr:${this.region}:${this.account}:repository/cdk-*`],
      })
    );

    // 5. ECR authorization token (required for Docker login)
    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ecr:GetAuthorizationToken'],
        resources: ['*'],
      })
    );

    // 6. SSM parameter read for CDK bootstrap version check
    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ssm:GetParameter'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/cdk-bootstrap/*/version`,
        ],
      })
    );

    // 7. IAM PassRole for CloudFormation execution role
    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['iam:PassRole'],
        resources: [`arn:aws:iam::${this.account}:role/cdk-*-cfn-exec-role-*`],
      })
    );

    // Export role ARN for GitHub Actions configuration
    new cdk.CfnOutput(this, 'GitHubActionsRoleArn', {
      value: this.role.roleArn,
      description:
        'IAM role ARN for GitHub Actions OIDC authentication. Configure this in GitHub repository secrets as AWS_ROLE_ARN.',
      exportName: 'WorthwatchGithubActionsRoleArn',
    });
  }
}
