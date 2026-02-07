/**
 * User repository for DynamoDB operations
 */

import { BaseRepository } from './base.repository';
import {
  User,
  CreateUserInput,
  UpdateUserInput,
  getUserPK,
  getUserSK,
} from '../models/user.model';

export class UserRepository extends BaseRepository {
  /**
   * Create a new user
   */
  async createUser(input: CreateUserInput): Promise<User> {
    const timestamp = this.getCurrentTimestamp();

    const user: User = {
      PK: getUserPK(input.userId),
      SK: getUserSK(),
      entityType: 'USER',
      userId: input.userId,
      email: input.email,
      username: input.username,
      bio: input.bio,
      avatarUrl: input.avatarUrl,
      isCurator: input.isCurator || false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.putItem(user);
    return user;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const item = await this.getItem(getUserPK(userId), getUserSK());
    return item as User | null;
  }

  /**
   * Get user by email using GSI1
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const items = await this.query({
      IndexName: 'GSI1',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
      Limit: 1,
    });

    return items.length > 0 ? (items[0] as User) : null;
  }

  /**
   * Update user
   */
  async updateUser(
    userId: string,
    input: UpdateUserInput
  ): Promise<User | null> {
    const updateParts: string[] = ['#updatedAt = :updatedAt'];
    const attributeNames: Record<string, string> = {
      '#updatedAt': 'updatedAt',
    };
    const attributeValues: Record<string, any> = {
      ':updatedAt': this.getCurrentTimestamp(),
    };

    if (input.username !== undefined) {
      updateParts.push('#username = :username');
      attributeNames['#username'] = 'username';
      attributeValues[':username'] = input.username;
    }

    if (input.bio !== undefined) {
      updateParts.push('#bio = :bio');
      attributeNames['#bio'] = 'bio';
      attributeValues[':bio'] = input.bio;
    }

    if (input.avatarUrl !== undefined) {
      updateParts.push('#avatarUrl = :avatarUrl');
      attributeNames['#avatarUrl'] = 'avatarUrl';
      attributeValues[':avatarUrl'] = input.avatarUrl;
    }

    if (input.curatorStatus !== undefined) {
      updateParts.push('#curatorStatus = :curatorStatus');
      attributeNames['#curatorStatus'] = 'curatorStatus';
      attributeValues[':curatorStatus'] = input.curatorStatus;
    }

    const updateExpression = 'SET ' + updateParts.join(', ');

    const result = await this.updateItem(
      getUserPK(userId),
      getUserSK(),
      updateExpression,
      attributeNames,
      attributeValues
    );

    return result as User;
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    await this.deleteItem(getUserPK(userId), getUserSK());
  }
}
