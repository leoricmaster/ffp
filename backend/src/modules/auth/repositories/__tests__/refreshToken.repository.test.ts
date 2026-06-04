// refreshToken.repository 单元测试
// v4 §5.2：HKDF 派生 + family replay detection

import { clearDatabase, db } from '../../../../shared/database';
import { refreshTokenRepository } from '../refreshToken.repository';

const sampleInput = (overrides: Partial<Parameters<typeof refreshTokenRepository.create>[0]> = {}) => ({
  userId: 'usr-1',
  tokenFamilyId: 'fam-A',
  parentId: null,
  tokenHash: 'a'.repeat(64),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  ...overrides,
});

describe('refreshTokenRepository', () => {
  beforeEach(() => {
    clearDatabase();
  });

  test('create 后 findByTokenHash 返回记录', () => {
    const t = refreshTokenRepository.create(sampleInput({ tokenHash: 'b'.repeat(64) }));
    expect(refreshTokenRepository.findByTokenHash('b'.repeat(64))?.id).toBe(t.id);
  });

  test('findActiveByFamilyId 只返回未撤销', () => {
    const t1 = refreshTokenRepository.create(sampleInput({ tokenHash: 'c1' }));
    refreshTokenRepository.create(sampleInput({ tokenHash: 'c2' }));
    refreshTokenRepository.revokeById(t1.id, 'USER_LOGOUT');
    const active = refreshTokenRepository.findActiveByFamilyId('fam-A');
    expect(active).toHaveLength(1);
    expect(active[0].tokenHash).toBe('c2');
  });

  test('revokeFamily 撤销整个 family', () => {
    refreshTokenRepository.create(sampleInput({ tokenHash: 'd1' }));
    refreshTokenRepository.create(sampleInput({ tokenHash: 'd2' }));
    refreshTokenRepository.create(sampleInput({ tokenHash: 'd3', tokenFamilyId: 'fam-B' }));
    const revoked = refreshTokenRepository.revokeFamily('fam-A', 'TOKEN_REUSED');
    expect(revoked).toHaveLength(2);
    // fam-B 不受影响
    expect(refreshTokenRepository.findActiveByFamilyId('fam-B')).toHaveLength(1);
  });

  test('重复 revoke 同一条记录不会重复设置 revokedAt', () => {
    const t = refreshTokenRepository.create(sampleInput({ tokenHash: 'e1' }));
    const first = refreshTokenRepository.revokeById(t.id, 'USER_LOGOUT');
    const second = refreshTokenRepository.revokeById(t.id, 'USER_LOGOUT');
    expect(first?.revokedAt).toBeDefined();
    // 第二次 revoke 不覆盖 revokedAt
    expect(second?.revokedAt).toEqual(first?.revokedAt);
  });

  test('has refresh token records in db.refreshTokens map', () => {
    const t = refreshTokenRepository.create(sampleInput({ tokenHash: 'f1' }));
    const fetched = db.refreshTokens.get(t.id);
    expect(fetched).toBeDefined();
    expect(fetched?.id).toBe(t.id);
  });
});
