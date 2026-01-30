#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { WorthWatchStack } from '../lib/worthwatch-stack'
import { GithubActionsRoleStack } from '../lib/github-actions-role-stack'

const app = new cdk.App()

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'ap-southeast-2' // Default to Sydney if not set
}

// GitHub Actions OIDC role stack
new GithubActionsRoleStack(app, 'WorthwatchGithubActionsRoleStack', {
  env,
  description:
    'IAM role for GitHub Actions OIDC authentication and CDK deployments',
  githubOrg: 'dnafication',
  githubRepo: 'worthwatch-backend',
  githubRef: 'main'
})

// Main application stack
new WorthWatchStack(app, 'WorthWatchStack', {
  env,
  description: 'WorthWatch backend infrastructure'
})

app.synth()
