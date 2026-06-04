// Auth Zod schemas
// v4 §openapi.yaml RegisterRequest 必填：email / password / privacyPolicyAccepted=true
// v4 §openapi.yaml LoginRequest 必填：email / password
// 错误码映射：MISSING_REQUIRED_FIELD / INVALID_FORMAT / WEAK_PASSWORD / INVALID_PRIVACY_CONSENT

import { z } from 'zod';

// RFC 5322 简化版（Zod 4 内置 email 已覆盖常见场景）
const emailSchema = z
  .string()
  .min(5, '邮箱长度至少5个字符')
  .max(100, '邮箱长度最多100个字符')
  .email('邮箱格式不正确');

const passwordSchema = z
  .string()
  .min(8, '密码长度至少8位')
  .max(128, '密码长度最多128个字符');

const usernameSchema = z
  .string()
  .min(3, '昵称长度至少3个字符')
  .max(20, '昵称长度最多20个字符')
  .regex(/^[a-zA-Z0-9_]+$/, '昵称只能包含字母、数字和下划线')
  .optional();

const phoneSchema = z
  .string()
  .regex(/^1[3-9]\d{9}$/, '手机号格式不正确')
  .length(11, '手机号必须为11位')
  .nullable()
  .optional();

/**
 * privacyPolicyAccepted 必须为字面量 true。
 * v4 AC3：false / null / 缺失均视为未勾选。
 * Zod 通过 literal(true) 强制，配合 optional? 默认 undefined → 校验失败。
 */
const privacyConsentSchema = z.literal(true, {
  message: '请勾选《用户协议》与《隐私政策》',
});

export const RegisterRequestSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
  privacyPolicyAccepted: privacyConsentSchema,
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  rememberMe: z.boolean().optional(),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

// ----- 响应类型 -----

export interface AuthData {
  userId: string;
  username: string;
  email: string;
  familyId: string;
  /** v4 新增：accessToken（JWT），注册/登录成功立即下发 */
  accessToken: string;
  /** v4 新增：accessToken 过期秒数（固定 900） */
  expiresIn: number;
}

export interface AuthResponse {
  success: true;
  message: string;
  data: AuthData;
}

export interface LoginData {
  user: {
    id: string;
    username: string;
    email: string;
    status: string;
    role: string;
  };
  accessToken: string;
  expiresIn: number;
  currentFamily: {
    familyId: string;
    name: string;
    role: string;
  } | null;
}

export interface LoginResponse {
  success: true;
  message: string;
  data: LoginData;
}
