/**
 * Base DynamoDB repository with common CRUD operations
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { BaseEntity } from '../types/entities';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Base repository class with common DynamoDB operations
 */
export abstract class BaseRepository<T extends BaseEntity> {
  protected tableName: string;
  protected entityPrefix: string;

  constructor(tableName: string, entityPrefix: string) {
    this.tableName = tableName;
    this.entityPrefix = entityPrefix;
  }

  /**
   * Generate a new ID with entity prefix
   */
  protected generateId(): string {
    return `${this.entityPrefix}#${randomUUID()}`;
  }

  /**
   * Get current timestamp in ISO format
   */
  protected getTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Get an item by ID
   */
  async getById(id: string): Promise<T | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { id },
    });

    const result = await docClient.send(command);
    return result.Item ? (result.Item as T) : null;
  }

  /**
   * Create a new item
   */
  async create(data: Omit<T, keyof BaseEntity>): Promise<T> {
    const now = this.getTimestamp();
    const item: T = {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    } as T;

    const command = new PutCommand({
      TableName: this.tableName,
      Item: item,
    });

    await docClient.send(command);
    return item;
  }

  /**
   * Update an existing item
   */
  async update(id: string, updates: Partial<Omit<T, keyof BaseEntity>>): Promise<T | null> {
    // Build update expression
    const updateExpressionParts: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value], index) => {
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      updateExpressionParts.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = value;
    });

    // Always update the updatedAt timestamp
    updateExpressionParts.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = this.getTimestamp();

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { id },
      UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const result = await docClient.send(command);
    return result.Attributes ? (result.Attributes as T) : null;
  }

  /**
   * Delete an item by ID
   */
  async delete(id: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { id },
    });

    await docClient.send(command);
  }

  /**
   * Scan all items (use with caution - prefer query when possible)
   */
  async scan(limit?: number): Promise<T[]> {
    const command = new ScanCommand({
      TableName: this.tableName,
      Limit: limit,
    });

    const result = await docClient.send(command);
    return (result.Items || []) as T[];
  }
}

/**
 * Get the DynamoDB table name from environment variable
 */
export function getTableName(): string {
  const tableName = process.env.DDB_TABLE_NAME;
  if (!tableName) {
    throw new Error('DDB_TABLE_NAME environment variable is not set');
  }
  return tableName;
}

/**
 * Export the document client for custom queries
 */
export { docClient };
