// Environment configuration with fail-fast validation
// v4 明确：JWT_SECRET / ALLOWED_ORIGINS 缺失或格式不合法时进程退出（fail-fast）

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().regex(/^\d+$/).default('8080'),

  /**
   * JWT 签名密钥。v4 要求 ≥ 256 bit（即 32 字节）。
   * 缺值 / 长度不足 → fail-fast 退出。
   */
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET 长度必须 ≥ 32 字节（256 bit），请使用 openssl rand -hex 32 生成'),

  /** accessToken 过期秒数。v4 固定 900s（15min） */
  JWT_ACCESS_EXPIRATION: z
    .string()
    .regex(/^\d+$/)
    .default('900'),

  /** refreshToken 过期秒数。v4 固定 7d = 604800s */
  JWT_REFRESH_EXPIRATION: z
    .string()
    .regex(/^\d+$/)
    .default('604800'),

  /**
   * CORS 白名单。v4 fail-fast：非空 + 形如 `https?://host[:port]` 列表。
   * 缺值 / 格式不合法 → fail-fast 退出。
   * 多个 origin 用逗号分隔。
   */
  ALLOWED_ORIGINS: z
    .string()
    .min(1, 'ALLOWED_ORIGINS 不能为空（如 http://localhost:53000）')
    .refine(
      (val) =>
        val
          .split(',')
          .map((s) => s.trim())
          .every((s) => /^https?:\/\/[\w.-]+(:\d+)?$/.test(s)),
      'ALLOWED_ORIGINS 必须为形如 https?://host[:port] 的合法 origin，多个用逗号分隔'
    ),

  /**
   * Cookie Secure flag。生产必须 true，开发可 false（便于 HTTP 联调）。
   * v4 允许通过环境变量配置。
   */
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

  /** 限流参数（可选） */
  RATE_LIMIT_REGISTER_IP: z.string().regex(/^\d+$/).default('20'),
  RATE_LIMIT_REGISTER_EMAIL: z.string().regex(/^\d+$/).default('5'),
  RATE_LIMIT_LOGIN_IP: z.string().regex(/^\d+$/).default('60'),
  RATE_LIMIT_REFRESH_TOKEN: z.string().regex(/^\d+$/).default('10'),

  /** 账户锁定参数（US-002） */
  ACCOUNT_LOCK_THRESHOLD: z.string().regex(/^\d+$/).default('5'),
  ACCOUNT_LOCK_DURATION_MIN: z.string().regex(/^\d+$/).default('15'),

  /** 5min 幂等键 TTL（毫秒） */
  IDEMPOTENCY_WINDOW_MS: z.string().regex(/^\d+$/).default('300000'),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

/**
 * 加载并校验环境变量。缺值 / 格式不合法时进程直接退出（fail-fast），
 * 避免运行时因 env 缺失或误设产生"接口全失败"或安全裸奔。
 *
 * v4 显式要求与 JWT_SECRET 同级严格度。
 */
export function loadEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('❌ 环境变量校验失败（fail-fast）：');
    for (const issue of parsed.error.issues) {
      // eslint-disable-next-line no-console
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

/** 获取已加载的 env（须先调用 loadEnv） */
export function getEnv(): Env {
  if (!cachedEnv) return loadEnv();
  return cachedEnv;
}

/** 测试场景下重置缓存 */
export function resetEnvCache(): void {
  cachedEnv = null;
}
