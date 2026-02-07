/**
 * User entity model
 */

export interface User {
  // DynamoDB keys
  PK: string; // USER#<userId>
  SK: string; // PROFILE
  entityType: 'USER';

  // User attributes
  userId: string;
  email: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  isCurator: boolean;
  curatorStatus?: 'pending' | 'approved' | 'suspended';

  // Timestamps
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface CreateUserInput {
  userId: string;
  email: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  isCurator?: boolean;
}

export interface UpdateUserInput {
  username?: string;
  bio?: string;
  avatarUrl?: string;
  curatorStatus?: 'pending' | 'approved' | 'suspended';
}

/**
 * Helper function to construct User PK
 */
export function getUserPK(userId: string): string {
  return `USER#${userId}`;
}

/**
 * Helper function to construct User SK
 */
export function getUserSK(): string {
  return 'PROFILE';
}

/**
 * Helper to extract userId from PK
 */
export function extractUserIdFromPK(pk: string): string {
  return pk.replace('USER#', '');
}
