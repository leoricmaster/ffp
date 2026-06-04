// HKDF-SHA256 派生
// v4 §5.2：DB 存 token_hash = HKDF(JWT_SECRET, token_family_id, info=base64url(token))
// 即使 DB 泄露也不直接暴露 token

import { hkdfSync } from 'node:crypto';

const DIGEST = 'sha256';
const HASH_LENGTH = 32; // 256-bit output

/**
 * HKDF-SHA256 同步派生。
 * - ikm: 输入密钥材料（JWT_SECRET，作为盐）
 * - salt: 盐（此处为 token_family_id）
 * - info: 上下文信息（base64url token）
 * - length: 派生字节数
 */
export function hkdfSha256(ikm: string, salt: string, info: string, length: number = HASH_LENGTH): Buffer {
  // hkdfSync 返回 Buffer[]
  const derived = hkdfSync(DIGEST, ikm, salt, info, length);
  return Buffer.from(derived);
}

/**
 * 派生 refreshToken 的 token_hash。
 * 与 v4 design §5.2 一致：HKDF(JWT_SECRET, token_family_id, info=base64url(token))。
 * 输出 hex 字符串（64 字符），与 DB CHAR(64) 匹配。
 */
export function deriveTokenHash(jwtSecret: string, tokenFamilyId: string, refreshToken: string): string {
  return hkdfSha256(jwtSecret, tokenFamilyId, refreshToken).toString('hex');
}
