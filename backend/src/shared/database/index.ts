// In-memory database for MVP phase
// Will be replaced with real database (Prisma/Raw SQL) in future iterations
// v4：新增 refreshTokens、auditLogs、idempotencyKeys 三个 Map

import type {
  User,
  Family,
  FamilyMember,
  TransactionCategory,
  AccountType,
  RefreshToken,
  AuditLog,
} from '../types';

interface Database {
  users: Map<string, User>;
  families: Map<string, Family>;
  familyMembers: Map<string, FamilyMember>;
  transactionCategories: Map<string, TransactionCategory>;
  accountTypes: Map<string, AccountType>;
  refreshTokens: Map<string, RefreshToken>;
  auditLogs: Map<string, AuditLog>;
  /** email (lowercased) -> userId */
  emailIndex: Map<string, string>;
  /** username -> userId */
  usernameIndex: Map<string, string>;
  /** token_hash -> refreshTokenId */
  refreshTokenHashIndex: Map<string, string>;
}

export const db: Database = {
  users: new Map(),
  families: new Map(),
  familyMembers: new Map(),
  transactionCategories: new Map(),
  accountTypes: new Map(),
  refreshTokens: new Map(),
  auditLogs: new Map(),
  emailIndex: new Map(),
  usernameIndex: new Map(),
  refreshTokenHashIndex: new Map(),
};

export function clearDatabase(): void {
  db.users.clear();
  db.families.clear();
  db.familyMembers.clear();
  db.transactionCategories.clear();
  db.accountTypes.clear();
  db.refreshTokens.clear();
  db.auditLogs.clear();
  db.emailIndex.clear();
  db.usernameIndex.clear();
  db.refreshTokenHashIndex.clear();
}
