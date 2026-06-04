// Argon2id 密码哈希与验证
// v4 设计：m=19MiB, t=2, p=1, salt≥16B（per-user 随机）
// OWASP 2024 推荐参数：m=19MiB, t=2, p=1, hashLen=32, salt=16B（argon2 默认）

import argon2 from 'argon2';

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
  // salt 长度由 argon2 默认生成 16B（v4 §5.1 要求 ≥ 16B）
};

/**
 * 哈希密码。返回完整输出（含算法 + 参数 + salt + hash），
 * 与 bcrypt 一致可存储单字段，verify 时自动解析。
 */
export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, ARGON2_OPTIONS);
}

/**
 * 验证密码。返回 true / false；不抛错（argon2 自身会抛 InvalidPasswordError，
 * 我们统一捕获转 false，让调用方按业务错误处理）。
 */
export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}
