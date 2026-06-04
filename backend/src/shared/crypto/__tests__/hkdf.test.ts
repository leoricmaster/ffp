// hkdf 单元测试

import { hkdfSha256, deriveTokenHash } from '../hkdf';

describe('HKDF-SHA256', () => {
  test('相同输入产生相同派生值（确定性）', () => {
    const a = hkdfSha256('secret-key', 'family-1', 'token-abc', 32);
    const b = hkdfSha256('secret-key', 'family-1', 'token-abc', 32);
    expect(a.equals(b)).toBe(true);
  });

  test('不同 ikm 产生不同派生值', () => {
    const a = hkdfSha256('secret-1', 'family-1', 'token-abc', 32);
    const b = hkdfSha256('secret-2', 'family-1', 'token-abc', 32);
    expect(a.equals(b)).toBe(false);
  });

  test('不同 salt 产生不同派生值', () => {
    const a = hkdfSha256('secret', 'family-1', 'token-abc', 32);
    const b = hkdfSha256('secret', 'family-2', 'token-abc', 32);
    expect(a.equals(b)).toBe(false);
  });

  test('不同 info 产生不同派生值', () => {
    const a = hkdfSha256('secret', 'family-1', 'token-abc', 32);
    const b = hkdfSha256('secret', 'family-1', 'token-xyz', 32);
    expect(a.equals(b)).toBe(false);
  });

  test('deriveTokenHash 返回 64 字符 hex（DB CHAR(64)）', () => {
    const hash = deriveTokenHash('secret', 'family-1', 'token-abc');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  test('deriveTokenHash 与 hkdfSha256 一致', () => {
    const fromHelper = deriveTokenHash('secret', 'fam-1', 'tok-1');
    const fromRaw = hkdfSha256('secret', 'fam-1', 'tok-1', 32).toString('hex');
    expect(fromHelper).toBe(fromRaw);
  });
});
