# CDK Infrastructure

## Purpose

This capability defines the AWS CDK TypeScript project structure, configuration, and deployment capabilities that enable infrastructure-as-code for the WorthWatch backend platform.

## Requirements

### Requirement: CDK Project Initialization

The system SHALL provide a valid CDK TypeScript project with all required dependencies and configuration files.

#### Scenario: CDK app structure exists

- **WHEN** the project is initialized
- **THEN** the following directories SHALL exist: `bin/`, `lib/`, `lambda/`

#### Scenario: CDK dependencies installed

- **WHEN** package.json is examined
- **THEN** it SHALL include `aws-cdk-lib` and `@aws-solutions-constructs/aws-lambda-dynamodb` as dependencies

#### Scenario: CDK configuration present

- **WHEN** the project root is checked
- **THEN** a valid `cdk.json` file SHALL exist with app entry point defined

### Requirement: TypeScript Configuration

The system SHALL provide TypeScript compilation configuration for both CDK infrastructure and Lambda code.

#### Scenario: Root TypeScript config exists

- **WHEN** the project is initialized
- **THEN** a `tsconfig.json` file SHALL exist at project root

#### Scenario: TypeScript compiles successfully

- **WHEN** `npm run build` is executed
- **THEN** all TypeScript code SHALL compile without errors

### Requirement: CDK Synthesis

The system SHALL allow CDK stack synthesis to CloudFormation templates.

#### Scenario: CDK synth succeeds

- **WHEN** `cdk synth` command is executed
- **THEN** a CloudFormation template SHALL be generated without errors

#### Scenario: Stack outputs defined

- **WHEN** CDK synth completes
- **THEN** the template SHALL include necessary stack outputs for API Gateway URL

### Requirement: CDK Deployment

The system SHALL support deployment to AWS accounts with proper bootstrapping.

#### Scenario: Bootstrap command available

- **WHEN** `cdk bootstrap` is executed for the first time
- **THEN** it SHALL create necessary CDK staging resources in the target AWS account

#### Scenario: Deploy command succeeds

- **WHEN** `cdk deploy` is executed
- **THEN** all infrastructure resources SHALL be created in AWS without errors

#### Scenario: Destroy command available

- **WHEN** `cdk destroy` is executed
- **THEN** all infrastructure resources SHALL be removed from AWS
