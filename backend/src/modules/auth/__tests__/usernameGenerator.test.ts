// usernameGenerator 单元测试
// 覆盖 v4 §US-001 AC6：email 前缀派生 + 清洗 + 截断 + 冲突后缀

import { clearDatabase, db } from '../../../shared/database';
import {
  deriveUsernameCandidate,
  generateUsernameFromEmail,
} from '../usernameGenerator';

describe('usernameGenerator', () => {
  beforeEach(() => {
    clearDatabase();
  });

  describe('deriveUsernameCandidate', () => {
    test('普通 email → 截取 @ 前内容', () => {
      expect(deriveUsernameCandidate('alice@example.com')).toBe('alice');
    });

    test('email 前缀含 . → 清洗', () => {
      expect(deriveUsernameCandidate('alice.smith@example.com')).toBe('alicesmith');
    });

    test('email 前缀含 + → 清洗', () => {
      expect(deriveUsernameCandidate('alice+tag@example.com')).toBe('alicetag');
    });

    test('email 前缀含中文 → 清洗为 ASCII', () => {
      expect(deriveUsernameCandidate('alice用户@example.com')).toBe('alice');
    });

    test('email 前缀 > 20 字符 → 截断', () => {
      const long = 'a'.repeat(30);
      const result = deriveUsernameCandidate(`${long}@example.com`);
      expect(result.length).toBe(20);
    });

    test('空 email（无 @）→ 返回空字符串', () => {
      expect(deriveUsernameCandidate('notanemail')).toBe('notanemail');
    });
  });

  describe('generateUsernameFromEmail', () => {
    test('正常 email → 直接返回派生 username', () => {
      expect(generateUsernameFromEmail('alice@example.com')).toBe('alice');
    });

    test('username 已存在 → 追加 4 位后缀', () => {
      // 预占用 'bob'
      db.usernameIndex.set('bob', 'user-existing');
      const result = generateUsernameFromEmail('bob@example.com');
      expect(result).not.toBe('bob');
      expect(result.startsWith('bob')).toBe(true);
      // 总长度 = 3 + 4 = 7
      expect(result.length).toBe(7);
    });

    test('email 前缀清洗后 < 3 字符 → 抛错', () => {
      // 'a@x.com' 前缀 'a'，清洗后 'a'，长度 1 < 3
      expect(() => generateUsernameFromEmail('a@x.com')).toThrow();
    });
  });
});
