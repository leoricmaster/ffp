// PasswordBlacklist 单元测试

import { passwordBlacklist } from '../passwordBlacklist';

describe('PasswordBlacklist', () => {
  beforeEach(() => {
    passwordBlacklist.reset();
    passwordBlacklist.load();
  });

  test('加载后 size > 0', () => {
    expect(passwordBlacklist.size()).toBeGreaterThan(0);
  });

  test('常见密码 123456 命中黑名单', () => {
    expect(passwordBlacklist.contains('123456')).toBe(true);
  });

  test('常见密码 password 命中黑名单', () => {
    expect(passwordBlacklist.contains('password')).toBe(true);
  });

  test('大小写不敏感', () => {
    expect(passwordBlacklist.contains('PASSWORD')).toBe(true);
    expect(passwordBlacklist.contains('Password')).toBe(true);
  });

  test('强密码不命中', () => {
    expect(passwordBlacklist.contains('MyStr0ngP@ss!XYZ')).toBe(false);
  });

  test('不阻塞启动：黑名单文件不存在时 contains 返回 false（降级为不检查）', () => {
    passwordBlacklist.reset();
    // 显式传入不存在的路径 → load 失败 → set 为空 → contains 返回 false
    expect(passwordBlacklist.contains('123456', '/non/existent/path.txt')).toBe(false);
  });
});
