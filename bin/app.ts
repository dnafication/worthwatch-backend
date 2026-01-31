#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { WorthWatchStack } from '../lib/worthwatch-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'ap-southeast-2', // Default to Sydney if not set
};

// Main application stack
new WorthWatchStack(app, 'WorthWatchStack', {
  env,
  description: 'WorthWatch backend infrastructure',
});

app.synth();
