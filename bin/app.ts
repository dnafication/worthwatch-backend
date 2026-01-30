#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { WorthWatchStack } from '../lib/worthwatch-stack';

const app = new cdk.App();

new WorthWatchStack(app, 'WorthWatchStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'WorthWatch backend infrastructure',
});

app.synth();
