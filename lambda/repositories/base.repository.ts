/**
 * Base repository with common DynamoDB operations
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommandInput,
  GetCommandInput,
  PutCommandInput,
  UpdateCommandInput,
  DeleteCommandInput,
} from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Get the table name from environment variable
 */
export function getTableName(): string {
  const tableName = process.env.DDB_TABLE_NAME;
  if (!tableName) {
    throw new Error('DDB_TABLE_NAME environment variable is not set');
  }
  return tableName;
}

/**
 * Base repository class with common DynamoDB operations
 */
export class BaseRepository {
  protected tableName: string;

  constructor() {
    this.tableName = getTableName();
  }

  /**
   * Put an item into DynamoDB
   */
  protected async putItem(item: Record<string, any>): Promise<void> {
    const params: PutCommandInput = {
      TableName: this.tableName,
      Item: item,
    };

    await docClient.send(new PutCommand(params));
  }

  /**
   * Get an item from DynamoDB by PK and SK
   */
  protected async getItem(
    pk: string,
    sk: string
  ): Promise<Record<string, any> | null> {
    const params: GetCommandInput = {
      TableName: this.tableName,
      Key: {
        PK: pk,
        SK: sk,
      },
    };

    const result = await docClient.send(new GetCommand(params));
    return result.Item || null;
  }

  /**
   * Query items from DynamoDB
   */
  protected async query(
    params: Omit<QueryCommandInput, 'TableName'>
  ): Promise<Record<string, any>[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        ...params,
      })
    );

    return result.Items || [];
  }

  /**
   * Update an item in DynamoDB
   */
  protected async updateItem(
    pk: string,
    sk: string,
    updateExpression: string,
    expressionAttributeNames?: Record<string, string>,
    expressionAttributeValues?: Record<string, any>
  ): Promise<Record<string, any>> {
    const params: UpdateCommandInput = {
      TableName: this.tableName,
      Key: {
        PK: pk,
        SK: sk,
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes || {};
  }

  /**
   * Delete an item from DynamoDB
   */
  protected async deleteItem(pk: string, sk: string): Promise<void> {
    const params: DeleteCommandInput = {
      TableName: this.tableName,
      Key: {
        PK: pk,
        SK: sk,
      },
    };

    await docClient.send(new DeleteCommand(params));
  }

  /**
   * Generate ISO timestamp
   */
  protected getCurrentTimestamp(): string {
    return new Date().toISOString();
  }
}
