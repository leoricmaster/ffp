// passwordHasher 单元测试
// v4 §5.1：Argon2id m=19MiB, t=2, p=1

import { hashPassword, verifyPassword } from '../passwordHasher';

describe('Argon2id passwordHasher', () => {
  test('hash 输出以 $argon2id$ 开头', async () => {
    const hash = await hashPassword('Test@123456');
    expect(hash).toMatch(/^\$argon2id\$/);
  });

  test('hash 包含 v=19 / m=19456 / t=2 / p=1', async () => {
    const hash = await hashPassword('Test@123456');
    expect(hash).toMatch(/v=19/);
    expect(hash).toMatch(/m=19456/);
    expect(hash).toMatch(/t=2/);
    expect(hash).toMatch(/p=1/);
  });

  test('verify 正确密码返回 true', async () => {
    const hash = await hashPassword('Test@123456');
    expect(await verifyPassword(hash, 'Test@123456')).toBe(true);
  });

  test('verify 错误密码返回 false', async () => {
    const hash = await hashPassword('Test@123456');
    expect(await verifyPassword(hash, 'WrongP@ss99')).toBe(false);
  });

  test('相同密码两次 hash 输出不同（per-user salt）', async () => {
    const h1 = await hashPassword('Test@123456');
    const h2 = await hashPassword('Test@123456');
    expect(h1).not.toBe(h2);
    // 但两个 hash 都能验证
    expect(await verifyPassword(h1, 'Test@123456')).toBe(true);
    expect(await verifyPassword(h2, 'Test@123456')).toBe(true);
  });

  test('盐长度 ≥ 16B（v4 §5.1 要求）', async () => {
    const hash = await hashPassword('Test@123456');
    // 提取 salt 段（base64 编码）
    const parts = hash.split('$');
    const saltB64 = parts[4];
    const saltBytes = Buffer.from(saltB64, 'base64');
    expect(saltBytes.length).toBeGreaterThanOrEqual(16);
  });
});
