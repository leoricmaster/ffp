// AuditLog append-only 写入
// v4 §5.4：记录 REGISTER / LOGIN_SUCCESS / LOGIN_FAIL / LOGOUT / REFRESH / TOKEN_REUSED 等
// 不记录 accessToken / refreshToken / 原始密码 / 密码哈希

import { v4 as uuidv4 } from 'uuid';
import { db } from '../../shared/database';
import type { AuditEventStatus, AuditEventType, AuditLog } from '../../shared/types';

export interface RecordAuditInput {
  userId: string | null;
  eventType: AuditEventType;
  eventStatus: AuditEventStatus;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

export class AuditRepository {
  /** 追加写入。失败不抛错（审计失败不应阻塞业务）。 */
  record(input: RecordAuditInput): AuditLog {
    const log: AuditLog = {
      id: uuidv4(),
      userId: input.userId,
      eventType: input.eventType,
      eventStatus: input.eventStatus,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      metadata: input.metadata ?? null,
      createdAt: new Date(),
    };
    db.auditLogs.set(log.id, log);
    return log;
  }

  /** 查询：按用户 */
  findByUserId(userId: string): AuditLog[] {
    return Array.from(db.auditLogs.values())
      .filter((log) => log.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const auditRepository = new AuditRepository();
