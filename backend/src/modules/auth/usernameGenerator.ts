// username 派生器
// v4 US-001 AC6：
//   - email 前缀去 `@` 及其后内容
//   - 截断到 20 字符
//   - 清洗非法字符（仅保留 ^[a-zA-Z0-9_]+$）
//   - 冲突追加 4 位随机后缀

import { randomBytes } from 'node:crypto';
import { db } from '../../shared/database';

const USERNAME_MAX_LENGTH = 20;
const USERNAME_MIN_LENGTH = 3;
const SUFFIX_LENGTH = 4;
const SUFFIX_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

function randomSuffix(): string {
  const bytes = randomBytes(SUFFIX_LENGTH);
  let out = '';
  for (let i = 0; i < SUFFIX_LENGTH; i++) {
    // eslint-disable-next-line no-bitwise
    out += SUFFIX_CHARS[bytes[i] % SUFFIX_CHARS.length];
  }
  return out;
}

/**
 * 从 email 提取 username 候选。
 * - "zhang.san+tag@example.com" -> "zhang.san+tag" -> 清洗后 "zhangsan" (非法字符剥除后)
 * - 截断到 20 字符
 */
export function deriveUsernameCandidate(email: string): string {
  const prefix = email.split('@')[0] ?? '';
  // 仅保留字母 / 数字 / 下划线
  const sanitized = prefix.replace(/[^a-zA-Z0-9_]/g, '');
  return sanitized.slice(0, USERNAME_MAX_LENGTH);
}

/**
 * 在候选 username 已被占用时追加 4 位随机后缀。
 * 若冲突仍存在（极小概率），最多重试 5 次。
 */
function ensureUnique(candidate: string): string {
  if (!db.usernameIndex.has(candidate)) return candidate;
  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = randomSuffix();
    const base = candidate.slice(0, USERNAME_MAX_LENGTH - SUFFIX_LENGTH);
    const next = `${base}${suffix}`;
    if (!db.usernameIndex.has(next)) return next;
  }
  // 兜底：使用 uuid 末 4 位
  return `${candidate.slice(0, USERNAME_MAX_LENGTH - 4)}${randomSuffix()}`;
}

/**
 * 公开 API：从 email 派生一个未被占用的 username。
 * 当清洗后长度 < 3 时抛出业务错误（极小概率，预留防呆）。
 */
export function generateUsernameFromEmail(email: string): string {
  const candidate = deriveUsernameCandidate(email);
  if (candidate.length < USERNAME_MIN_LENGTH) {
    throw new Error(
      `email 前缀清洗后长度 < ${USERNAME_MIN_LENGTH}，无法派生 username: ${email} -> "${candidate}"`
    );
  }
  return ensureUnique(candidate);
}
