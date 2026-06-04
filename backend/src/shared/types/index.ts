// Shared domain types for FFP backend
// v4 设计（2026-06-04）：User 新增隐私/锁定字段；新增 RefreshToken / AuditLog / TransactionCategory

export type UserStatus = 'active' | 'inactive' | 'locked';
export type UserRole = 'user' | 'admin' | 'super_admin';
export type FamilyStatus = 'active' | 'inactive';
export type MemberRole = 'ADMIN' | 'MEMBER' | 'VIEWER';
export type TransactionCategoryType = 'INCOME' | 'EXPENSE';
export type AccountTypeCategory = 'ASSET' | 'LIABILITY';

/** RefreshToken 撤销原因 */
export type RevokedReason = 'USER_LOGOUT' | 'TOKEN_REUSED' | 'ADMIN_REVOKE' | 'EXPIRED' | 'ROTATION';

/** AuditLog 事件类型 */
export type AuditEventType =
  | 'REGISTER'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAIL'
  | 'LOGOUT'
  | 'REFRESH'
  | 'TOKEN_REUSED'
  | 'PASSWORD_CHANGE';

/** AuditLog 事件状态 */
export type AuditEventStatus = 'SUCCESS' | 'FAIL' | 'BLOCKED';

export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  phone: string | null;
  avatar: string | null;
  status: UserStatus;
  role: UserRole;
  currentFamilyId: string | null;
  defaultFamilyId: string | null;
  /** v4 新增：协议同意时间戳，注册时必填 */
  privacyPolicyAcceptedAt: Date;
  /** v4 新增：连续登录失败计数（US-002 登录锁定使用） */
  failedLoginCount: number;
  /** v4 新增：账户锁定解除时间（US-002 登录锁定使用） */
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Family {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  currency: string;
  timezone: string;
  language: string;
  status: FamilyStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface FamilyMember {
  id: string;
  userId: string;
  familyId: string;
  role: MemberRole;
  status: string;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TransactionCategory {
  id: string;
  familyId: string;
  name: string;
  type: TransactionCategoryType;
  icon: string | null;
  color: string | null;
  parentId: string | null;
  sortOrder: number;
  systemDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface AccountType {
  id: string;
  familyId: string;
  name: string;
  type: AccountTypeCategory;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  systemDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/** v4 新增：刷新令牌（Refresh Token Rotation 链） */
export interface RefreshToken {
  id: string;
  userId: string;
  /** Token 链族 ID（同一登录会话共享 family） */
  tokenFamilyId: string;
  /** 父令牌 ID（轮换链上的上一个 token） */
  parentId: string | null;
  /** token_hash = HKDF(JWT_SECRET, tokenFamilyId, info=base64url(token)) */
  tokenHash: string;
  issuedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  revokedReason: RevokedReason | null;
  userAgent: string | null;
  ipAddress: string | null;
}

/** v4 新增：审计日志 */
export interface AuditLog {
  id: string;
  userId: string | null;
  eventType: AuditEventType;
  eventStatus: AuditEventStatus;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}
