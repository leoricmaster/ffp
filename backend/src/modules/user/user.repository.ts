// User 仓储层
// v4 数据模型：User 含 privacy_policy_accepted_at / failed_login_count / locked_until 字段

import { v4 as uuidv4 } from 'uuid';
import { db } from '../../shared/database';
import type { User } from '../../shared/types';

export interface CreateUserInput {
  email: string;
  username: string;
  passwordHash: string;
  phone?: string | null;
  privacyPolicyAcceptedAt: Date;
  defaultFamilyId: string;
}

export class UserRepository {
  findById(id: string): User | undefined {
    return db.users.get(id);
  }

  findByEmail(email: string): User | undefined {
    const userId = db.emailIndex.get(email.toLowerCase());
    return userId ? db.users.get(userId) : undefined;
  }

  findByUsername(username: string): User | undefined {
    const userId = db.usernameIndex.get(username);
    return userId ? db.users.get(userId) : undefined;
  }

  /**
   * 创建 user 并建立 email/username 索引。
   * 若 email 或 username 已存在则抛错（DB unique 约束兜底）。
   */
  create(input: CreateUserInput): User {
    const email = input.email.toLowerCase();
    if (db.emailIndex.has(email)) {
      throw new Error(`email already exists: ${email}`);
    }
    if (db.usernameIndex.has(input.username)) {
      throw new Error(`username already exists: ${input.username}`);
    }
    const now = new Date();
    const user: User = {
      id: uuidv4(),
      email,
      username: input.username,
      passwordHash: input.passwordHash,
      phone: input.phone ?? null,
      avatar: null,
      status: 'active',
      role: 'user',
      currentFamilyId: input.defaultFamilyId,
      defaultFamilyId: input.defaultFamilyId,
      privacyPolicyAcceptedAt: input.privacyPolicyAcceptedAt,
      failedLoginCount: 0,
      lockedUntil: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    db.users.set(user.id, user);
    db.emailIndex.set(email, user.id);
    db.usernameIndex.set(user.username, user.id);
    return user;
  }

  deleteById(id: string): void {
    const user = db.users.get(id);
    if (!user) return;
    db.users.delete(id);
    db.emailIndex.delete(user.email);
    db.usernameIndex.delete(user.username);
  }
}

export const userRepository = new UserRepository();
