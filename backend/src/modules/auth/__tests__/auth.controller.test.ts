// AuthController HTTP 集成测试
// 使用 Supertest 验证 Set-Cookie + 错误码 + 响应体结构
// 覆盖 v4 §US-001 全部 7 条 AC 的 HTTP 行为

import request from 'supertest';
import { clearDatabase, db } from '../../../shared/database';
import app from '../../../app';
import { authService as moduleAuthService, AuthService } from '../services/auth.service';
import { loadEnv, resetEnvCache } from '../../../config/env';

// 在所有测试前加载 env（auth.service 顶层 new AuthService() 依赖 env）
beforeAll(() => {
  resetEnvCache();
  process.env.JWT_SECRET = 'test-secret-key-must-be-at-least-32-bytes-long!!';
  process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
  process.env.NODE_ENV = 'test';
  loadEnv();
});

describe('POST /api/v1/auth/register - v4 §US-001', () => {
  let authService: AuthService;

  beforeEach(() => {
    clearDatabase();
    // 清空模块级 authService 的幂等键缓存（route 引用的是模块级实例）
    moduleAuthService.clearIdempotencyStore();
    authService = new AuthService();
    authService.clearIdempotencyStore();
  });

  const validBody = {
    email: 'test@example.com',
    password: 'MyStr0ngP@ss!',
    privacyPolicyAccepted: true,
  };

  // ----------------------------------------------------------------
  // AC1
  // ----------------------------------------------------------------
  describe('AC1 必填字段', () => {
    test('缺少 email → 400 + MISSING_REQUIRED_FIELD', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ password: validBody.password, privacyPolicyAccepted: true });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MISSING_REQUIRED_FIELD');
    });

    test('缺少 password → 400 + MISSING_REQUIRED_FIELD', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: validBody.email, privacyPolicyAccepted: true });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MISSING_REQUIRED_FIELD');
    });

    test('缺少 privacyPolicyAccepted → 400 + INVALID_PRIVACY_CONSENT', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: validBody.email, password: validBody.password });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_PRIVACY_CONSENT');
    });
  });

  // ----------------------------------------------------------------
  // AC2
  // ----------------------------------------------------------------
  describe('AC2 邮箱格式 + 密码强度', () => {
    test('邮箱格式非法 → 400 + INVALID_FORMAT', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validBody, email: 'not-an-email' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_FORMAT');
    });

    test('密码 < 8 位 → 400 + WEAK_PASSWORD', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validBody, password: 'short' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('WEAK_PASSWORD');
    });

    test('命中黑名单 → 400 + WEAK_PASSWORD', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validBody, password: '123456' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('WEAK_PASSWORD');
    });
  });

  // ----------------------------------------------------------------
  // AC3
  // ----------------------------------------------------------------
  describe('AC3 隐私政策', () => {
    test('privacyPolicyAccepted=false → 400 + INVALID_PRIVACY_CONSENT', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validBody, privacyPolicyAccepted: false });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_PRIVACY_CONSENT');
    });

    test('privacyPolicyAccepted=null → 400 + INVALID_PRIVACY_CONSENT', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validBody, privacyPolicyAccepted: null });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_PRIVACY_CONSENT');
    });
  });

  // ----------------------------------------------------------------
  // AC4 — 幂等
  // ----------------------------------------------------------------
  describe('AC4 5min 幂等', () => {
    test('5min 内同邮箱重复注册 → userId 一致', async () => {
      const r1 = await request(app).post('/api/v1/auth/register').send(validBody);
      const r2 = await request(app).post('/api/v1/auth/register').send(validBody);
      expect(r1.status).toBe(201);
      expect(r2.status).toBe(201);
      expect(r2.body.data.userId).toBe(r1.body.data.userId);
      expect(r2.body.data.familyId).toBe(r1.body.data.familyId);
      expect(r2.body.data.username).toBe(r1.body.data.username);
    });
  });

  // ----------------------------------------------------------------
  // AC5 — 事务原子性
  // ----------------------------------------------------------------
  describe('AC5 事务原子性', () => {
    test('成功注册 → DB 含 1 user + 1 family + 1 family_member + 14 categories', async () => {
      const r = await request(app).post('/api/v1/auth/register').send(validBody);
      expect(r.status).toBe(201);
      expect(r.body.data.userId).toBeDefined();

      // user
      const userCount = Array.from(db.users.values()).filter(
        (u) => u.email === validBody.email
      ).length;
      expect(userCount).toBe(1);

      // familyMember
      const fms = Array.from(db.familyMembers.values()).filter(
        (fm) => fm.userId === r.body.data.userId
      );
      expect(fms).toHaveLength(1);
      expect(fms[0].role).toBe('ADMIN');

      // 14 categories
      const cats = Array.from(db.transactionCategories.values()).filter(
        (c) => c.familyId === r.body.data.familyId
      );
      expect(cats).toHaveLength(14);
    });
  });

  // ----------------------------------------------------------------
  // AC6 — username 派生
  // ----------------------------------------------------------------
  describe('AC6 username 派生', () => {
    test('未传 username → 从 email 前缀派生', async () => {
      const r = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validBody, email: 'alice@example.com' });
      expect(r.status).toBe(201);
      expect(r.body.data.username).toBe('alice');
    });

    test('默认家庭 = 我的家庭 / CNY / Asia/Shanghai / zh-CN / active', async () => {
      const r = await request(app).post('/api/v1/auth/register').send(validBody);
      const family = db.families.get(r.body.data.familyId);
      expect(family?.name).toBe('我的家庭');
      expect(family?.currency).toBe('CNY');
      expect(family?.timezone).toBe('Asia/Shanghai');
      expect(family?.language).toBe('zh-CN');
      expect(family?.status).toBe('active');
    });
  });

  // ----------------------------------------------------------------
  // AC7 — accessToken + Set-Cookie
  // ----------------------------------------------------------------
  describe('AC7 注册成功响应', () => {
    test('201 + data.accessToken (JWT) + data.expiresIn=900', async () => {
      const r = await request(app).post('/api/v1/auth/register').send(validBody);
      expect(r.status).toBe(201);
      expect(r.body.success).toBe(true);
      expect(r.body.data.accessToken).toBeDefined();
      expect(r.body.data.accessToken.split('.').length).toBe(3);
      expect(r.body.data.expiresIn).toBe(900);
    });

    test('Set-Cookie: refreshToken=...; HttpOnly; SameSite=Lax; Path=/api/v1/auth; Max-Age≈604800', async () => {
      const r = await request(app).post('/api/v1/auth/register').send(validBody);
      expect(r.status).toBe(201);
      const cookies = r.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const setCookie = Array.isArray(cookies) ? cookies[0] : cookies;
      expect(setCookie).toMatch(/^refreshToken=/);
      expect(setCookie).toMatch(/HttpOnly/);
      expect(setCookie).toMatch(/SameSite=Lax/);
      expect(setCookie).toMatch(/Path=\/api\/v1\/auth/);
      const m = setCookie?.match(/Max-Age=(\d+)/);
      expect(m).not.toBeNull();
      const maxAge = parseInt(m![1], 10);
      expect(maxAge).toBeGreaterThan(604000);
      expect(maxAge).toBeLessThanOrEqual(604800);
    });
  });

  // ----------------------------------------------------------------
  // 辅助
  // ----------------------------------------------------------------
  describe('错误响应格式', () => {
    test('错误响应格式符合 engineering skill §API 错误处理标准', async () => {
      const r = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validBody, email: 'bad' });
      expect(r.body).toMatchObject({
        success: false,
        error: {
          code: expect.any(String),
          message: expect.any(String),
        },
      });
    });

    test('注册成功后 privacy_policy_accepted_at 已写入 user', async () => {
      const r = await request(app).post('/api/v1/auth/register').send(validBody);
      const user = db.users.get(r.body.data.userId);
      expect(user?.privacyPolicyAcceptedAt).toBeInstanceOf(Date);
    });

    test('注册成功后 failed_login_count=0, locked_until=null', async () => {
      const r = await request(app).post('/api/v1/auth/register').send(validBody);
      const user = db.users.get(r.body.data.userId);
      expect(user?.failedLoginCount).toBe(0);
      expect(user?.lockedUntil).toBeNull();
    });

    test('注册成功后 auditLog 已写入 REGISTER/SUCCESS', async () => {
      const r = await request(app).post('/api/v1/auth/register').send(validBody);
      const al = Array.from(db.auditLogs.values()).find(
        (l) => l.userId === r.body.data.userId && l.eventType === 'REGISTER'
      );
      expect(al).toBeDefined();
      expect(al?.eventStatus).toBe('SUCCESS');
    });
  });
});
