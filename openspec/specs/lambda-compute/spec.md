# Lambda Compute

## Purpose

This capability defines the AWS Lambda function configuration, handler implementation, and runtime behavior for executing backend application logic in response to API Gateway requests.

## Requirements

### Requirement: Lambda Function Provisioning
The system SHALL provision an AWS Lambda function with Node.js runtime for executing application code.

#### Scenario: Lambda function created
- **WHEN** CDK stack is deployed
- **THEN** a Lambda function SHALL be created in AWS

#### Scenario: Node.js 20.x runtime configured
- **WHEN** Lambda function is examined
- **THEN** it SHALL use Node.js 20.x runtime

### Requirement: Lambda Handler Implementation
The system SHALL implement a Lambda handler that processes API Gateway proxy events.

#### Scenario: Handler file exists
- **WHEN** the lambda directory is examined
- **THEN** a handler file SHALL exist with exported handler function

#### Scenario: API Gateway event processed
- **WHEN** the Lambda function is invoked with an API Gateway proxy event
- **THEN** it SHALL return a valid API Gateway proxy response format

### Requirement: Hello World Response
The system SHALL return a hello world message as the initial response.

#### Scenario: Hello message returned
- **WHEN** the Lambda handler is invoked
- **THEN** it SHALL return a JSON response with `{ "message": "hello" }`

#### Scenario: Status code 200
- **WHEN** the Lambda handler completes successfully
- **THEN** it SHALL return HTTP status code 200

#### Scenario: Content-Type header set
- **WHEN** the Lambda handler returns a response
- **THEN** the Content-Type header SHALL be set to `application/json`

### Requirement: Lambda Environment Configuration
The system SHALL provide environment variables for Lambda runtime configuration.

#### Scenario: DynamoDB table name available
- **WHEN** Lambda function is initialized
- **THEN** the DynamoDB table name SHALL be available as an environment variable

#### Scenario: AWS region available
- **WHEN** Lambda function executes
- **THEN** the AWS region SHALL be available from environment or context

### Requirement: Lambda Permissions
The system SHALL configure IAM permissions for Lambda to access required AWS services.

#### Scenario: DynamoDB access granted
- **WHEN** Lambda attempts to read/write to DynamoDB
- **THEN** it SHALL have sufficient IAM permissions

#### Scenario: CloudWatch Logs access granted
- **WHEN** Lambda function executes
- **THEN** it SHALL have permissions to write logs to CloudWatch

### Requirement: Lambda Error Handling
The system SHALL handle Lambda execution errors gracefully.

#### Scenario: Unhandled error caught
- **WHEN** an unhandled error occurs in the handler
- **THEN** Lambda SHALL return a 500 status code with error details logged

#### Scenario: Error logged to CloudWatch
- **WHEN** an error occurs
- **THEN** the error stack trace SHALL be written to CloudWatch Logs
