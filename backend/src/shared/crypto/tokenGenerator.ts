// 256-bit 安全随机数生成器
// v4：refreshToken = 32 字节 base64url 编码

import { randomBytes } from 'node:crypto';

const REFRESH_TOKEN_BYTES = 32;

/**
 * 生成 base64url 编码的 refreshToken。
 * 客户端收到 Set-Cookie 后凭此值调用 /auth/refresh；
 * 服务端不存明文，仅存 HKDF 派生后的 token_hash。
 */
export function generateRefreshToken(): string {
  return randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
}

/** 通用 16-byte 随机数（用于 token family id 之外的用途） */
export function generateRandomId(bytes = 16): string {
  return randomBytes(bytes).toString('base64url');
}
