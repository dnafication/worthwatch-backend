import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2'
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import * as logs from 'aws-cdk-lib/aws-logs'
import { LambdaToDynamoDB } from '@aws-solutions-constructs/aws-lambda-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as path from 'path'

export class WorthWatchStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Create Lambda and DynamoDB using Solutions Construct
    const lambdaToDynamoDB = new LambdaToDynamoDB(this, 'ApiLambdaDynamoDB', {
      lambdaFunctionProps: {
        runtime: lambda.Runtime.NODEJS_24_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(path.join(__dirname, '../dist/lambda')),
        environment: {
          // TABLE_NAME will be automatically added by Solutions Construct
        }
      },
      dynamoTableProps: {
        partitionKey: {
          name: 'id',
          type: dynamodb.AttributeType.STRING
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        removalPolicy: cdk.RemovalPolicy.DESTROY // For development - change for production
      }
    })

    // Create CloudWatch Log Group for API Gateway
    const apiLogGroup = new logs.LogGroup(this, 'ApiGatewayLogs', {
      logGroupName: `/aws/apigateway/worthwatch-api`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    })

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
          apigatewayv2.CorsHttpMethod.OPTIONS
        ],
        allowHeaders: ['Content-Type', 'Authorization'],
        maxAge: cdk.Duration.days(1)
      }
    })

    // Create Lambda integration
    const lambdaIntegration =
      new apigatewayv2Integrations.HttpLambdaIntegration(
        'LambdaIntegration',
        lambdaToDynamoDB.lambdaFunction
      )

    // Add default route (catch-all)
    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: lambdaIntegration
    })

    // Add root path route
    httpApi.addRoutes({
      path: '/',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: lambdaIntegration
    })

    // Enable access logging for the default stage
    const defaultStage = httpApi.defaultStage?.node
      .defaultChild as apigatewayv2.CfnStage
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
          responseLength: '$context.responseLength'
        })
      }
    }

    // Output the API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: httpApi.url || 'undefined',
      description: 'HTTP API Gateway URL',
      exportName: 'WorthWatchApiUrl'
    })

    // Output the DynamoDB table name
    new cdk.CfnOutput(this, 'TableName', {
      value: lambdaToDynamoDB.dynamoTable.tableName,
      description: 'DynamoDB table name',
      exportName: 'WorthWatchTableName'
    })
  }
}
