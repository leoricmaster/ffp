import type { User, Family, FamilyMember, TransactionCategory, AccountType, RefreshToken, AuditLog } from '../../shared/types';

export const createUserFixture = (overrides?: Partial<User>): User => ({
  id: 'usr-test-001',
  email: 'test@example.com',
  username: 'TestUser',
  passwordHash: '$argon2id$v=19$m=19456,t=2,p=1$abcdefghijklmnop$abcdefghijklmnopqrstuvwxyz012345', // fake argon2 hash
  phone: null,
  avatar: null,
  status: 'active',
  role: 'user',
  currentFamilyId: null,
  defaultFamilyId: null,
  privacyPolicyAcceptedAt: new Date('2024-01-01'),
  failedLoginCount: 0,
  lockedUntil: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
  ...overrides,
});

export const createFamilyFixture = (overrides?: Partial<Family>): Family => ({
  id: 'fam-test-001',
  name: '我的家庭',
  description: null,
  avatar: null,
  currency: 'CNY',
  timezone: 'Asia/Shanghai',
  language: 'zh-CN',
  status: 'active',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
  ...overrides,
});

export const createFamilyMemberFixture = (overrides?: Partial<FamilyMember>): FamilyMember => ({
  id: 'fm-test-001',
  userId: 'usr-test-001',
  familyId: 'fam-test-001',
  role: 'ADMIN',
  status: 'active',
  joinedAt: new Date('2024-01-01'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
  ...overrides,
});

export const createTransactionCategoryFixture = (
  overrides?: Partial<TransactionCategory>
): TransactionCategory => ({
  id: 'tc-test-001',
  familyId: 'fam-test-001',
  name: '餐饮',
  type: 'EXPENSE',
  icon: null,
  color: null,
  parentId: null,
  sortOrder: 1,
  systemDefault: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
  ...overrides,
});

export const createAccountTypeFixture = (overrides?: Partial<AccountType>): AccountType => ({
  id: 'at-test-001',
  familyId: 'fam-test-001',
  name: '现金',
  type: 'ASSET',
  icon: null,
  color: null,
  sortOrder: 1,
  systemDefault: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
  ...overrides,
});

export const createRefreshTokenFixture = (overrides?: Partial<RefreshToken>): RefreshToken => ({
  id: 'rt-test-001',
  userId: 'usr-test-001',
  tokenFamilyId: 'tf-test-001',
  parentId: null,
  tokenHash: 'a'.repeat(64),
  issuedAt: new Date('2024-01-01'),
  expiresAt: new Date('2024-01-08'),
  revokedAt: null,
  revokedReason: null,
  userAgent: null,
  ipAddress: null,
  ...overrides,
});

export const createAuditLogFixture = (overrides?: Partial<AuditLog>): AuditLog => ({
  id: 'al-test-001',
  userId: 'usr-test-001',
  eventType: 'REGISTER',
  eventStatus: 'SUCCESS',
  ipAddress: null,
  userAgent: null,
  metadata: null,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});
