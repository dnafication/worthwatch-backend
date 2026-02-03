import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as logs from 'aws-cdk-lib/aws-logs';
import { LambdaToDynamoDB } from '@aws-solutions-constructs/aws-lambda-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, SourceMapMode } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';

export class WorthWatchStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const nodejsLambda = new NodejsFunction(this, 'ApiLambda', {
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: 'handler',
      entry: path.join(__dirname, '..', 'lambda', 'index.ts'),
      bundling: {
        sourceMap: true,
        sourceMapMode: SourceMapMode.INLINE,
      },
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
      },
    });

    // Create Lambda and DynamoDB using Solutions Construct
    const lambdaToDynamoDB = new LambdaToDynamoDB(this, 'ApiLambdaDynamoDB', {
      existingLambdaObj: nodejsLambda,
      dynamoTableProps: {
        partitionKey: {
          name: 'PK',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'SK',
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        removalPolicy: cdk.RemovalPolicy.DESTROY, // For development - change for production
        pointInTimeRecovery: false, // Enable for production
      },
    });

    // Add Global Secondary Indexes (GSIs)
    
    // GSI1: Email Index - for looking up users by email
    lambdaToDynamoDB.dynamoTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: {
        name: 'email',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI2: Curator Watchlists Index - for getting watchlists by curator
    lambdaToDynamoDB.dynamoTable.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: {
        name: 'curatorId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI3: Public Watchlists Index - for listing public watchlists
    lambdaToDynamoDB.dynamoTable.addGlobalSecondaryIndex({
      indexName: 'GSI3',
      partitionKey: {
        name: 'isPublicStr',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI4: Entity Type Index - for querying by entity type
    lambdaToDynamoDB.dynamoTable.addGlobalSecondaryIndex({
      indexName: 'GSI4',
      partitionKey: {
        name: 'entityType',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.KEYS_ONLY,
    });

    // Create CloudWatch Log Group for API Gateway
    const apiLogGroup = new logs.LogGroup(this, 'ApiGatewayLogs', {
      logGroupName: `/aws/apigateway/worthwatch-api`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create HTTP API Gateway
    const httpApi = new apigatewayv2.HttpApi(this, 'WorthWatchHttpApi', {
      apiName: 'WorthWatchApi',
      description: 'WorthWatch HTTP API',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [
          apigatewayv2.CorsHttpMethod.GET,
          apigatewayv2.CorsHttpMethod.POST,
          apigatewayv2.CorsHttpMethod.PUT,
          apigatewayv2.CorsHttpMethod.DELETE,
          apigatewayv2.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ['Content-Type', 'Authorization'],
        maxAge: cdk.Duration.days(1),
      },
    });

    // Create Lambda integration
    const lambdaIntegration =
      new apigatewayv2Integrations.HttpLambdaIntegration(
        'LambdaIntegration',
        lambdaToDynamoDB.lambdaFunction
      );

    // Add default route (catch-all)
    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: lambdaIntegration,
    });

    // Add root path route
    httpApi.addRoutes({
      path: '/',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: lambdaIntegration,
    });

    // Enable access logging for the default stage
    const defaultStage = httpApi.defaultStage?.node
      .defaultChild as apigatewayv2.CfnStage;
    if (defaultStage) {
      defaultStage.accessLogSettings = {
        destinationArn: apiLogGroup.logGroupArn,
        format: JSON.stringify({
          requestId: '$context.requestId',
          ip: '$context.identity.sourceIp',
          requestTime: '$context.requestTime',
          httpMethod: '$context.httpMethod',
          routeKey: '$context.routeKey',
          status: '$context.status',
          protocol: '$context.protocol',
          responseLength: '$context.responseLength',
        }),
      };
    }

    // Output the API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: httpApi.url || 'undefined',
      description: 'HTTP API Gateway URL',
      exportName: 'WorthWatchApiUrl',
    });

    // Output the DynamoDB table name
    new cdk.CfnOutput(this, 'TableName', {
      value: lambdaToDynamoDB.dynamoTable.tableName,
      description: 'DynamoDB table name',
      exportName: 'WorthWatchTableName',
    });
  }
}
