// US-001 注册 AuthService 单元测试
// 覆盖 v4 §US-001 全部 7 条 AC

// 必须在 import 之前设置 process.env，因为 auth.service 顶层 `export const authService = new AuthService()`
// 会在 import 时调用 getEnv() 触发 loadEnv() 校验
process.env.JWT_SECRET = 'test-secret-key-must-be-at-least-32-bytes-long!!';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
process.env.NODE_ENV = 'test';

import { AuthService } from '../auth.service';
import { clearDatabase, db } from '../../../../shared/database';
import {
  EmailAlreadyExistsError,
  InvalidPrivacyConsentError,
  UnauthorizedError,
  WeakPasswordError,
} from '../../../../shared/errors';
import { resetEnvCache, loadEnv } from '../../../../config/env';
import { passwordBlacklist } from '../../passwordBlacklist';

// 在所有测试前加载一次 env（确保 fail-fast 校验通过）
beforeAll(() => {
  resetEnvCache();
  process.env.JWT_SECRET = 'test-secret-key-must-be-at-least-32-bytes-long!!';
  process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
  process.env.NODE_ENV = 'test';
  loadEnv();
  passwordBlacklist.load();
});

describe('AuthService - US-001 注册', () => {
  let authService: AuthService;

  beforeEach(() => {
    clearDatabase();
    authService = new AuthService();
    authService.clearIdempotencyStore();
  });

  const baseDto = {
    email: 'zhangsan@example.com',
    password: 'Test@123456',
    privacyPolicyAccepted: true as const,
  };

  // ----------------------------------------------------------------
  // AC1 — 必填字段验证
  // ----------------------------------------------------------------
  describe('AC1 必填字段验证', () => {
    test('缺少 email → ZodError', async () => {
      const { z } = await import('zod');
      const { RegisterRequestSchema } = await import('../../schemas/auth.schema');
      const result = RegisterRequestSchema.safeParse({
        password: 'Test@123456',
        privacyPolicyAccepted: true,
      });
      expect(result.success).toBe(false);
      // 验证 Zod 自身抛错由 errorHandler 翻译
      expect(() => RegisterRequestSchema.parse({
        password: 'Test@123456',
        privacyPolicyAccepted: true,
      })).toThrow(z.ZodError);
    });

    test('缺少 password → ZodError', async () => {
      const { RegisterRequestSchema } = await import('../../schemas/auth.schema');
      const result = RegisterRequestSchema.safeParse({
        email: 'test@example.com',
        privacyPolicyAccepted: true,
      });
      expect(result.success).toBe(false);
    });
  });

  // ----------------------------------------------------------------
  // AC2 — 邮箱格式 + 密码强度
  // ----------------------------------------------------------------
  describe('AC2 邮箱格式 + 密码强度', () => {
    test('邮箱格式不合法 → ZodError', async () => {
      const { RegisterRequestSchema } = await import('../../schemas/auth.schema');
      const result = RegisterRequestSchema.safeParse({
        email: 'not-an-email',
        password: 'Test@123456',
        privacyPolicyAccepted: true,
      });
      expect(result.success).toBe(false);
    });

    test('密码 < 8 位 → ZodError', async () => {
      const { RegisterRequestSchema } = await import('../../schemas/auth.schema');
      const result = RegisterRequestSchema.safeParse({
        email: 'a@b.com',
        password: 'short',
        privacyPolicyAccepted: true,
      });
      expect(result.success).toBe(false);
    });

    test('命中黑名单 → WeakPasswordError', async () => {
      await expect(
        authService.register({
          ...baseDto,
          email: 'weak1@example.com',
          password: '123456',
        })
      ).rejects.toThrow(WeakPasswordError);
    });

    test('密码强（非黑名单）→ 通过', async () => {
      const result = await authService.register({
        ...baseDto,
        email: 'strong@example.com',
        password: 'MyStr0ngP@ss!',
      });
      expect(result.userId).toBeDefined();
    });
  });

  // ----------------------------------------------------------------
  // AC3 — 隐私政策强制勾选
  // ----------------------------------------------------------------
  describe('AC3 隐私政策', () => {
    test('privacyPolicyAccepted = false → ZodError', async () => {
      const { RegisterRequestSchema } = await import('../../schemas/auth.schema');
      const result = RegisterRequestSchema.safeParse({
        email: 'test@example.com',
        password: 'Test@123456',
        privacyPolicyAccepted: false,
      });
      expect(result.success).toBe(false);
    });

    test('privacyPolicyAccepted 缺失 → ZodError', async () => {
      const { RegisterRequestSchema } = await import('../../schemas/auth.schema');
      const result = RegisterRequestSchema.safeParse({
        email: 'test@example.com',
        password: 'Test@123456',
      });
      expect(result.success).toBe(false);
    });

    test('privacyPolicyAccepted = null → ZodError', async () => {
      const { RegisterRequestSchema } = await import('../../schemas/auth.schema');
      const result = RegisterRequestSchema.safeParse({
        email: 'test@example.com',
        password: 'Test@123456',
        privacyPolicyAccepted: null,
      });
      expect(result.success).toBe(false);
    });

    test('service 层防御性：手动传非 true → InvalidPrivacyConsentError', async () => {
      await expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        authService.register({ ...baseDto, privacyPolicyAccepted: false as any })
      ).rejects.toThrow(InvalidPrivacyConsentError);
    });
  });

  // ----------------------------------------------------------------
  // AC4 — 幂等性（5min）
  // ----------------------------------------------------------------
  describe('AC4 5min 幂等', () => {
    test('5min 内同邮箱重复注册 → 返回与首次完全相同的 userId/familyId/username', async () => {
      const dto = { ...baseDto, email: 'idem@example.com' };
      const r1 = await authService.register(dto);
      const r2 = await authService.register(dto);
      const r3 = await authService.register({ ...dto, password: 'DifferentP@ss99' });

      expect(r2.userId).toBe(r1.userId);
      expect(r2.familyId).toBe(r1.familyId);
      expect(r2.username).toBe(r1.username);
      expect(r3.userId).toBe(r1.userId);

      // 验证 DB 中只有一个 user
      expect(Array.from(db.users.values()).filter((u) => u.email === 'idem@example.com')).toHaveLength(1);
    });
  });

  // ----------------------------------------------------------------
  // AC5 — 事务原子性（user + family + member + 14 分类）
  // ----------------------------------------------------------------
  describe('AC5 事务原子性', () => {
    test('注册成功 → user + family + familyMember + 14 categories 全部落库', async () => {
      const r = await authService.register({
        ...baseDto,
        email: 'atomic@example.com',
      });

      // user
      const user = db.users.get(r.userId);
      expect(user).toBeDefined();
      expect(user?.email).toBe('atomic@example.com');

      // family
      const family = db.families.get(r.familyId);
      expect(family).toBeDefined();
      expect(family?.name).toBe('我的家庭');
      expect(family?.currency).toBe('CNY');
      expect(family?.timezone).toBe('Asia/Shanghai');
      expect(family?.language).toBe('zh-CN');

      // family_member
      const fm = Array.from(db.familyMembers.values()).find(
        (m) => m.userId === r.userId && m.familyId === r.familyId
      );
      expect(fm).toBeDefined();
      expect(fm?.role).toBe('ADMIN');

      // 14 categories (6 INCOME + 8 EXPENSE)
      const cats = Array.from(db.transactionCategories.values()).filter(
        (c) => c.familyId === r.familyId
      );
      expect(cats).toHaveLength(14);
      const incomes = cats.filter((c) => c.type === 'INCOME');
      const expenses = cats.filter((c) => c.type === 'EXPENSE');
      expect(incomes).toHaveLength(6);
      expect(expenses).toHaveLength(8);

      // refreshToken
      const rt = Array.from(db.refreshTokens.values()).find((t) => t.userId === r.userId);
      expect(rt).toBeDefined();
      expect(rt?.revokedAt).toBeNull();

      // auditLog
      const al = Array.from(db.auditLogs.values()).find(
        (l) => l.userId === r.userId && l.eventType === 'REGISTER'
      );
      expect(al).toBeDefined();
      expect(al?.eventStatus).toBe('SUCCESS');

      // accessToken JWT
      expect(r.accessToken).toBeDefined();
      expect(r.accessToken.length).toBeGreaterThan(20);
      expect(r.expiresIn).toBe(900);
    });
  });

  // ----------------------------------------------------------------
  // AC6 — username 派生 + 默认家庭
  // ----------------------------------------------------------------
  describe('AC6 username 派生 + 默认家庭', () => {
    test('未传 username → 从 email 前缀派生', async () => {
      const r = await authService.register({
        ...baseDto,
        email: 'alice@example.com',
      });
      expect(r.username).toBe('alice');
    });

    test('email 前缀含特殊字符 → 清洗非法字符后派生', async () => {
      const r = await authService.register({
        ...baseDto,
        email: 'alice.smith+tag@example.com',
      });
      // 全部非法字符 (. / +) 均被清洗 → alicesmithtag
      expect(r.username).toBe('alicesmithtag');
    });

    test('email 前缀 > 20 字符 → 截断到 20', async () => {
      const longPrefix = 'a'.repeat(30);
      const r = await authService.register({
        ...baseDto,
        email: `${longPrefix}@example.com`,
      });
      expect(r.username.length).toBeLessThanOrEqual(20);
      expect(r.username.startsWith('a'.repeat(20))).toBe(true);
    });

    test('username 冲突 → 追加 4 位后缀', async () => {
      const r1 = await authService.register({
        ...baseDto,
        email: 'alice@x.com',
      });
      const r2 = await authService.register({
        ...baseDto,
        email: 'alice@y.com',
      });
      expect(r1.username).toBe('alice');
      expect(r2.username).not.toBe('alice');
      expect(r2.username.startsWith('alice')).toBe(true);
      // 4 位后缀 → 长度 = 5 + 4 = 9
      expect(r2.username.length).toBe(9);
    });

    test('默认家庭字段 = 我的家庭 / CNY / Asia/Shanghai / zh-CN / active', async () => {
      const r = await authService.register({ ...baseDto, email: 'family@example.com' });
      const family = db.families.get(r.familyId);
      expect(family?.name).toBe('我的家庭');
      expect(family?.currency).toBe('CNY');
      expect(family?.timezone).toBe('Asia/Shanghai');
      expect(family?.language).toBe('zh-CN');
      expect(family?.status).toBe('active');
    });
  });

  // ----------------------------------------------------------------
  // AC7 — 注册响应含 accessToken + Set-Cookie refreshToken
  // ----------------------------------------------------------------
  describe('AC7 注册成功响应', () => {
    test('响应含 accessToken（JWT，900s）+ expiresIn=900', async () => {
      const r = await authService.register({ ...baseDto, email: 'ac7@example.com' });
      expect(r.accessToken).toBeDefined();
      expect(typeof r.accessToken).toBe('string');
      expect(r.accessToken.split('.').length).toBe(3); // JWT 三段
      expect(r.expiresIn).toBe(900);

      // 解析 JWT payload 验证
      const payload = JSON.parse(Buffer.from(r.accessToken.split('.')[1], 'base64url').toString());
      expect(payload.sub).toBe(r.userId);
      expect(payload.familyId).toBe(r.familyId);
    });

    test('返回 refreshToken 原始值（供 Set-Cookie 用）', async () => {
      const r = await authService.register({ ...baseDto, email: 'ac7b@example.com' });
      expect(r.refreshToken).toBeDefined();
      expect(r.refreshToken.length).toBeGreaterThanOrEqual(32);
      expect(r.refreshTokenExpiresAt.getTime()).toBeGreaterThan(Date.now() + 6 * 24 * 60 * 60 * 1000);
    });
  });

  // ----------------------------------------------------------------
  // 辅助：错误码映射
  // ----------------------------------------------------------------
  describe('错误码映射', () => {
    test('邮箱已存在（5min 幂等窗口外）→ EmailAlreadyExistsError', async () => {
      // 先用 service 直接写一条记录到 db 绕过幂等键
      await authService.register({ ...baseDto, email: 'dup@example.com' });
      // 清空幂等键模拟 5min 后
      authService.clearIdempotencyStore();
      // 通过 service 调用，但要先让幂等键失效
      // （实际 5min 后由 IdempotencyStore TTL 失效）
      // 这里改用更直接的方式：手动注入冲突的 email
      db.emailIndex.set('dup2@example.com', 'fake-user-id');
      await expect(
        authService.register({ ...baseDto, email: 'dup2@example.com' })
      ).rejects.toThrow(EmailAlreadyExistsError);
    });
  });
});

// =================================================================
// US-002 登录（最小骨架）
// =================================================================
describe('AuthService - US-002 登录（MVP 占位）', () => {
  let authService: AuthService;

  beforeEach(() => {
    clearDatabase();
    authService = new AuthService();
    authService.clearIdempotencyStore();
  });

  test('正确凭证 → 返回 accessToken + 当前家庭信息', async () => {
    await authService.register({
      email: 'login@example.com',
      password: 'Test@123456',
      privacyPolicyAccepted: true,
    });
    const r = await authService.login({
      email: 'login@example.com',
      password: 'Test@123456',
    });
    expect(r.accessToken).toBeDefined();
    expect(r.accessToken.split('.').length).toBe(3);
    expect(r.expiresIn).toBe(900);
    expect(r.user.email).toBe('login@example.com');
    expect(r.currentFamily).not.toBeNull();
    expect(r.currentFamily?.role).toBe('ADMIN');
  });

  test('密码错误 → UnauthorizedError', async () => {
    await authService.register({
      email: 'wrong@example.com',
      password: 'Test@123456',
      privacyPolicyAccepted: true,
    });
    await expect(
      authService.login({ email: 'wrong@example.com', password: 'WrongP@ss99' })
    ).rejects.toThrow(UnauthorizedError);
  });

  test('邮箱不存在 → UnauthorizedError（不区分错误）', async () => {
    await expect(
      authService.login({ email: 'noone@example.com', password: 'Anything12' })
    ).rejects.toThrow(UnauthorizedError);
  });
});
