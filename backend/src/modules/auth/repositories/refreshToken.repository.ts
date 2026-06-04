// RefreshToken 仓储层
// v4 §5.2：HKDF-SHA256 派生 token_hash 后存 DB；重放检测时按 token_family_id 级联撤销

import { v4 as uuidv4 } from 'uuid';
import { db } from '../../../shared/database';
import type { RefreshToken, RevokedReason } from '../../../shared/types';

export interface CreateRefreshTokenInput {
  userId: string;
  tokenFamilyId: string;
  parentId: string | null;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export class RefreshTokenRepository {
  create(input: CreateRefreshTokenInput): RefreshToken {
    const now = new Date();
    const token: RefreshToken = {
      id: uuidv4(),
      userId: input.userId,
      tokenFamilyId: input.tokenFamilyId,
      parentId: input.parentId,
      tokenHash: input.tokenHash,
      issuedAt: now,
      expiresAt: input.expiresAt,
      revokedAt: null,
      revokedReason: null,
      userAgent: input.userAgent ?? null,
      ipAddress: input.ipAddress ?? null,
    };
    db.refreshTokens.set(token.id, token);
    db.refreshTokenHashIndex.set(token.tokenHash, token.id);
    return token;
  }

  findByTokenHash(tokenHash: string): RefreshToken | undefined {
    const id = db.refreshTokenHashIndex.get(tokenHash);
    return id ? db.refreshTokens.get(id) : undefined;
  }

  findById(id: string): RefreshToken | undefined {
    return db.refreshTokens.get(id);
  }

  /** 按 tokenFamilyId 查找所有未撤销记录 */
  findActiveByFamilyId(tokenFamilyId: string): RefreshToken[] {
    return Array.from(db.refreshTokens.values()).filter(
      (t) => t.tokenFamilyId === tokenFamilyId && t.revokedAt === null
    );
  }

  /** 撤销单条记录 */
  revokeById(id: string, reason: RevokedReason): RefreshToken | undefined {
    const token = db.refreshTokens.get(id);
    if (!token || token.revokedAt !== null) return token;
    token.revokedAt = new Date();
    token.revokedReason = reason;
    return token;
  }

  /**
   * 撤销整个 token family 中所有未到期 token（family replay detection）
   * 返回被撤销的记录列表
   */
  revokeFamily(tokenFamilyId: string, reason: RevokedReason): RefreshToken[] {
    const revoked: RefreshToken[] = [];
    for (const token of db.refreshTokens.values()) {
      if (token.tokenFamilyId === tokenFamilyId && token.revokedAt === null) {
        token.revokedAt = new Date();
        token.revokedReason = reason;
        revoked.push(token);
      }
    }
    return revoked;
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
