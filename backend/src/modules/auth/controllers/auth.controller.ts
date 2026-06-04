// AuthController v4
// 注册响应含 accessToken + Set-Cookie refreshToken
// v4 §5.2 Cookie 属性：httpOnly; Secure; SameSite=Lax; Path=/api/v1/auth; Max-Age=604800

import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { RegisterRequestSchema, LoginRequestSchema } from '../schemas/auth.schema';
import { authService } from '../services/auth.service';
import { getEnv } from '../../../config/env';
import {
  InvalidFormatError,
  InvalidPrivacyConsentError,
  MissingRequiredFieldError,
  WeakPasswordError,
} from '../../../shared/errors';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_PATH = '/api/v1/auth';

function buildRefreshCookie(refreshToken: string, maxAgeSeconds: number, secure: boolean): string {
  const parts = [
    `${REFRESH_COOKIE_NAME}=${refreshToken}`,
    'HttpOnly',
    `SameSite=Lax`,
    `Path=${REFRESH_COOKIE_PATH}`,
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

function clearRefreshCookie(secure: boolean): string {
  const parts = [
    `${REFRESH_COOKIE_NAME}=`,
    'HttpOnly',
    'SameSite=Lax',
    `Path=${REFRESH_COOKIE_PATH}`,
    'Max-Age=0',
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

function buildClientIp(req: Request): string | undefined {
  // Express trust proxy 默认为 false，直接用 req.ip
  return req.ip || undefined;
}

function buildUserAgent(req: Request): string | undefined {
  const ua = req.headers['user-agent'];
  return Array.isArray(ua) ? ua[0] : ua;
}

export class AuthController {
  /**
   * POST /api/v1/auth/register
   * 必填：email / password / privacyPolicyAccepted=true
   * 响应：201 + AuthResponse（含 accessToken）+ Set-Cookie refreshToken
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = RegisterRequestSchema.parse(req.body);
      const env = getEnv();

      const result = await authService.register(dto, {
        ipAddress: buildClientIp(req),
        userAgent: buildUserAgent(req),
      });

      // Set-Cookie refreshToken
      const maxAgeSeconds = Math.floor(
        (result.refreshTokenExpiresAt.getTime() - Date.now()) / 1000
      );
      const cookie = buildRefreshCookie(result.refreshToken, maxAgeSeconds, env.COOKIE_SECURE);
      res.setHeader('Set-Cookie', cookie);

      res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          userId: result.userId,
          username: result.username,
          email: result.email,
          familyId: result.familyId,
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        next(translateZodError(error));
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/login
   * MVP 占位（US-001 提交保证可登录联调）
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = LoginRequestSchema.parse(req.body);
      const result = await authService.login(dto, {
        ipAddress: buildClientIp(req),
        userAgent: buildUserAgent(req),
      });
      res.status(200).json({
        success: true,
        message: '登录成功',
        data: result,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        next(translateZodError(error));
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   * MVP 占位（US-001 范围内未实现完整 token 撤销，仅清 Cookie + 200）。
   * 完整实现由后续 US-004 PR 补全。
   */
  async logout(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const env = getEnv();
    res.setHeader('Set-Cookie', clearRefreshCookie(env.COOKIE_SECURE));
    res.status(200).json({
      success: true,
      message: '登出成功',
    });
  }
}

/**
 * 将 Zod 错误映射为业务错误码。
 * v4 §2.2：错误码 = MISSING_REQUIRED_FIELD / INVALID_FORMAT / WEAK_PASSWORD / INVALID_PRIVACY_CONSENT
 *
 * 映射规则（基于 Zod 4 issue code + 字段名）：
 *   - 任意字段 code='invalid_type' → MISSING_REQUIRED_FIELD
 *   - privacyPolicyAccepted → INVALID_PRIVACY_CONSENT
 *   - email 格式 / 长度错误 → INVALID_FORMAT
 *   - password 长度错误 → WEAK_PASSWORD
 *   - 其他 → MISSING_REQUIRED_FIELD（兜底）
 */
function translateZodError(error: ZodError): Error {
  const first = error.issues[0];
  if (!first) {
    return new Error('请求参数校验失败');
  }
  const field = first.path.join('.') || 'body';
  const message = first.message;
  const details = error.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message,
  }));

  // 字段缺失（Zod 4 invalid_type）→ MISSING_REQUIRED_FIELD
  if (first.code === 'invalid_type') {
    return new MissingRequiredFieldError(message, details);
  }

  // privacyPolicyAccepted 错误 → INVALID_PRIVACY_CONSENT
  if (field === 'privacyPolicyAccepted') {
    return new InvalidPrivacyConsentError(message);
  }
  // password 长度 / 复杂度错误 → WEAK_PASSWORD
  if (field === 'password') {
    return new WeakPasswordError(message, details);
  }
  // 邮箱格式 / 长度错误 → INVALID_FORMAT
  if (field === 'email') {
    return new InvalidFormatError(message, details);
  }
  // 其他兜底
  return new MissingRequiredFieldError(message, details);
}

export const authController = new AuthController();
