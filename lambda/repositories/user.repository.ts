/**
 * User repository for user-related database operations
 */
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { User } from '../types/entities';
import { BaseRepository, docClient, getTableName } from './base.repository';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(getTableName(), 'USER');
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'EmailIndex', // Assumes GSI on email field
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
      Limit: 1,
    });

    const result = await docClient.send(command);
    return result.Items && result.Items.length > 0 ? (result.Items[0] as User) : null;
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'UsernameIndex', // Assumes GSI on username field
      KeyConditionExpression: 'username = :username',
      ExpressionAttributeValues: {
        ':username': username,
      },
      Limit: 1,
    });

    const result = await docClient.send(command);
    return result.Items && result.Items.length > 0 ? (result.Items[0] as User) : null;
  }

  /**
   * List all verified curators
   */
  async listVerifiedCurators(limit?: number): Promise<User[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'VerifiedIndex', // Assumes GSI on isVerified field
      KeyConditionExpression: 'isVerified = :verified',
      ExpressionAttributeValues: {
        ':verified': true,
      },
      Limit: limit,
    });

    const result = await docClient.send(command);
    return (result.Items || []) as User[];
  }
}
