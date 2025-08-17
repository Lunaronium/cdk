#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';
import { EC2Stack } from '../lib/ec2-stack';

const app = new cdk.App();

const vpcStack = new CdkStack(app, 'CdkStack');

new EC2Stack(app, 'MyEC2Stack', {
  vpc: vpcStack.vpc
});

app.synth();
