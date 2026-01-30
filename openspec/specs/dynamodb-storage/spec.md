# DynamoDB Storage

## Purpose

This capability defines the DynamoDB table provisioning, configuration, and integration with Lambda functions for persistent data storage in the WorthWatch backend platform.

## Requirements

### Requirement: DynamoDB Table Provisioning
The system SHALL provision a DynamoDB table using AWS Solutions Constructs best practices.

#### Scenario: Table created via Solutions Construct
- **WHEN** CDK stack is deployed
- **THEN** a DynamoDB table SHALL be created using `@aws-solutions-constructs/aws-lambda-dynamodb`

#### Scenario: Table name available
- **WHEN** the stack is deployed
- **THEN** the DynamoDB table name SHALL be available as a stack output or environment variable

### Requirement: Table Key Schema
The system SHALL define a primary key structure for the DynamoDB table.

#### Scenario: Partition key defined
- **WHEN** the table is created
- **THEN** it SHALL have a partition key named `id` of type String

#### Scenario: No sort key required
- **WHEN** the table schema is examined
- **THEN** it SHALL NOT include a sort key (simple key schema)

### Requirement: Lambda-DynamoDB Integration
The system SHALL automatically configure IAM permissions for Lambda to access the DynamoDB table.

#### Scenario: Read permissions granted
- **WHEN** Lambda attempts to read items from DynamoDB
- **THEN** it SHALL have GetItem and Query permissions

#### Scenario: Write permissions granted
- **WHEN** Lambda attempts to write items to DynamoDB
- **THEN** it SHALL have PutItem and UpdateItem permissions

#### Scenario: Environment variable injected
- **WHEN** Lambda function is deployed
- **THEN** the DynamoDB table name SHALL be available as an environment variable

### Requirement: Table Billing Mode
The system SHALL configure DynamoDB billing for cost optimization.

#### Scenario: Pay-per-request billing
- **WHEN** the table is created
- **THEN** it SHALL use on-demand (pay-per-request) billing mode by default

### Requirement: Table Encryption
The system SHALL enable encryption at rest for the DynamoDB table.

#### Scenario: Encryption enabled
- **WHEN** the table is created
- **THEN** it SHALL have encryption enabled using AWS managed keys

### Requirement: Point-in-Time Recovery
The system SHALL support backup and recovery capabilities for the DynamoDB table.

#### Scenario: PITR configurable
- **WHEN** the table is provisioned
- **THEN** point-in-time recovery SHALL be configurable (can be enabled post-deployment)

### Requirement: Table Deletion Protection
The system SHALL protect against accidental table deletion in production environments.

#### Scenario: Deletion policy applied
- **WHEN** CDK stack is destroyed
- **THEN** the table deletion behavior SHALL be configurable via CDK removal policy

#### Scenario: Retain option available
- **WHEN** removal policy is set to RETAIN
- **THEN** the table SHALL NOT be deleted when stack is destroyed
