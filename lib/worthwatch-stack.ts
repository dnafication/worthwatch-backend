import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as logs from 'aws-cdk-lib/aws-logs';
import { LambdaToDynamoDB } from '@aws-solutions-constructs/aws-lambda-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as path from 'path';

export class WorthWatchStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create Cognito User Pool for passwordless authentication
    const userPool = new cognito.UserPool(this, 'WorthWatchUserPool', {
      userPoolName: 'worthwatch-users',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: false,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: false,
        requireUppercase: false,
        requireDigits: false,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development - change for production
    });

    // Create Cognito User Pool Client
    const userPoolClient = userPool.addClient('WorthWatchWebClient', {
      userPoolClientName: 'worthwatch-web-client',
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: false,
          implicitCodeGrant: false,
        },
      },
      generateSecret: false, // Public client (web/mobile apps)
    });

    // Create Lambda and DynamoDB using Solutions Construct
    const lambdaToDynamoDB = new LambdaToDynamoDB(this, 'ApiLambdaDynamoDB', {
      lambdaFunctionProps: {
        runtime: lambda.Runtime.NODEJS_24_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(path.join(__dirname, '../dist/lambda')),
        environment: {
          // DDB_TABLE_NAME will be automatically added by Solutions Construct
          USER_POOL_ID: userPool.userPoolId,
          USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
          AWS_REGION: cdk.Stack.of(this).region,
        },
      },
      dynamoTableProps: {
        partitionKey: {
          name: 'id',
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        removalPolicy: cdk.RemovalPolicy.DESTROY, // For development - change for production
      },
    });

    // Create CloudWatch Log Group for API Gateway
    const apiLogGroup = new logs.LogGroup(this, 'ApiGatewayLogs', {
      logGroupName: `/aws/apigateway/worthwatch-api`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create JWT Authorizer for Cognito
    const jwtAuthorizer = new apigatewayv2.CfnAuthorizer(this, 'JwtAuthorizer', {
      apiId: '', // Will be set after API creation
      authorizerType: 'JWT',
      identitySource: ['$request.header.Authorization'],
      name: 'CognitoJwtAuthorizer',
      jwtConfiguration: {
        audience: [userPoolClient.userPoolClientId],
        issuer: `https://cognito-idp.${cdk.Stack.of(this).region}.amazonaws.com/${userPool.userPoolId}`,
      },
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

    // Set the API ID for the authorizer
    jwtAuthorizer.apiId = httpApi.apiId;

    // Create Lambda integration
    const lambdaIntegration =
      new apigatewayv2Integrations.HttpLambdaIntegration(
        'LambdaIntegration',
        lambdaToDynamoDB.lambdaFunction
      );

    // Add public routes (no authorization required)
    httpApi.addRoutes({
      path: '/health',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: lambdaIntegration,
    });

    httpApi.addRoutes({
      path: '/ping',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: lambdaIntegration,
    });

    // Add catch-all route for unmatched public paths (no auth)
    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: lambdaIntegration,
    });

    // Create protected routes using L1 constructs with JWT authorizer
    // We need to create a separate integration and routes for protected paths
    const protectedIntegration = new apigatewayv2.CfnIntegration(this, 'ProtectedIntegration', {
      apiId: httpApi.apiId,
      integrationType: 'AWS_PROXY',
      integrationUri: lambdaToDynamoDB.lambdaFunction.functionArn,
      payloadFormatVersion: '2.0',
    });

    // Protected route for watchlists collection
    new apigatewayv2.CfnRoute(this, 'WatchlistsRoute', {
      apiId: httpApi.apiId,
      routeKey: 'ANY /watchlists',
      target: `integrations/${protectedIntegration.ref}`,
      authorizationType: 'JWT',
      authorizerId: jwtAuthorizer.ref,
    });

    // Protected route for watchlists items
    new apigatewayv2.CfnRoute(this, 'WatchlistsItemRoute', {
      apiId: httpApi.apiId,
      routeKey: 'ANY /watchlists/{proxy+}',
      target: `integrations/${protectedIntegration.ref}`,
      authorizationType: 'JWT',
      authorizerId: jwtAuthorizer.ref,
    });

    // Grant API Gateway permission to invoke Lambda
    lambdaToDynamoDB.lambdaFunction.grantInvoke(
      new cdk.aws_iam.ServicePrincipal('apigateway.amazonaws.com')
    );

    // Enable access logging for the default stage
    const apiStage = httpApi.defaultStage?.node
      .defaultChild as apigatewayv2.CfnStage;
    if (apiStage) {
      apiStage.accessLogSettings = {
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

    // Output the Cognito User Pool ID
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: 'WorthWatchUserPoolId',
    });

    // Output the Cognito User Pool Client ID
    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: 'WorthWatchUserPoolClientId',
    });
  }
}
