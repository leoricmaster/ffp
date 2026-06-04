// env 配置 fail-fast 单元测试
// v4 §11.1：JWT_SECRET / ALLOWED_ORIGINS 缺失或格式不合法时进程退出

import { loadEnv, resetEnvCache, getEnv } from '../env';

describe('env config - fail-fast', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    resetEnvCache();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
    resetEnvCache();
  });

  describe('JWT_SECRET', () => {
    test('JWT_SECRET 缺失 → process.exit(1)', () => {
      delete process.env.JWT_SECRET;
      const spy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
        throw new Error(`process.exit called with ${code}`);
      }) as never);
      expect(() => loadEnv()).toThrow(/process\.exit/);
      spy.mockRestore();
    });

    test('JWT_SECRET 长度 < 32 → process.exit(1)', () => {
      process.env.JWT_SECRET = 'short';
      process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
      const spy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
        throw new Error(`process.exit called with ${code}`);
      }) as never);
      expect(() => loadEnv()).toThrow(/process\.exit/);
      spy.mockRestore();
    });

    test('JWT_SECRET ≥ 32 字节 → 加载成功', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
      const env = loadEnv();
      expect(env.JWT_SECRET).toBe('a'.repeat(32));
    });
  });

  describe('ALLOWED_ORIGINS', () => {
    test('缺失 → process.exit(1)', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      delete process.env.ALLOWED_ORIGINS;
      const spy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
        throw new Error(`process.exit called with ${code}`);
      }) as never);
      expect(() => loadEnv()).toThrow(/process\.exit/);
      spy.mockRestore();
    });

    test('格式不合法（如 * ） → process.exit(1)', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.ALLOWED_ORIGINS = '*';
      const spy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
        throw new Error(`process.exit called with ${code}`);
      }) as never);
      expect(() => loadEnv()).toThrow(/process\.exit/);
      spy.mockRestore();
    });

    test('合法 origin → 加载成功', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.ALLOWED_ORIGINS = 'http://localhost:53000,https://app.ffp.com';
      const env = loadEnv();
      expect(env.ALLOWED_ORIGINS).toContain('http://localhost:53000');
    });
  });

  describe('默认值', () => {
    test('JWT_ACCESS_EXPIRATION 默认 900', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
      delete process.env.JWT_ACCESS_EXPIRATION;
      const env = loadEnv();
      expect(env.JWT_ACCESS_EXPIRATION).toBe('900');
    });

    test('JWT_REFRESH_EXPIRATION 默认 604800', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
      delete process.env.JWT_REFRESH_EXPIRATION;
      const env = loadEnv();
      expect(env.JWT_REFRESH_EXPIRATION).toBe('604800');
    });

    test('RATE_LIMIT_REGISTER_IP 默认 20', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
      delete process.env.RATE_LIMIT_REGISTER_IP;
      const env = loadEnv();
      expect(env.RATE_LIMIT_REGISTER_IP).toBe('20');
    });

    test('IDEMPOTENCY_WINDOW_MS 默认 300000', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
      delete process.env.IDEMPOTENCY_WINDOW_MS;
      const env = loadEnv();
      expect(env.IDEMPOTENCY_WINDOW_MS).toBe('300000');
    });
  });

  describe('getEnv 缓存', () => {
    test('多次调用返回同一对象', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
      const a = getEnv();
      const b = getEnv();
      expect(a).toBe(b);
    });
  });
});
