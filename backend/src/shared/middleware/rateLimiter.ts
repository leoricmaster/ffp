// 三级限流中间件
// v4 §5.3：IP（20/h）/ email（5/day）/ account（5失败→15min）/ token（10/h）
// MVP 限制：进程内 in-memory store；后续 ft 外延后（td-002）迁移 Redis
//
// 实现策略：
//   - IP / Token 维度直接用 express-rate-limit（默认 in-memory store）
//   - email 维度需要按请求 body 提取 key，因此用自定义 Map-based store

import rateLimit, { type Store, ipKeyGenerator } from 'express-rate-limit';
import { getEnv } from '../../config/env';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** IP 维度限流：每 IP 每小时 ≤ N 次（默认 20） */
export function registerIpLimiter() {
  const env = getEnv();
  return rateLimit({
    windowMs: HOUR_MS,
    limit: parseInt(env.RATE_LIMIT_REGISTER_IP, 10),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req.ip ?? 'unknown'),
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: '操作过于频繁，请稍后重试',
          details: [{ field: 'ip', message: `每 IP 每小时最多 ${env.RATE_LIMIT_REGISTER_IP} 次注册请求` }],
        },
      });
    },
  });
}

/** email 维度限流：每邮箱每天 ≤ 5 次（必须 body 已通过 Zod 校验） */
export function registerEmailLimiter() {
  const env = getEnv();
  const limit = parseInt(env.RATE_LIMIT_REGISTER_EMAIL, 10);

  // 自定义 store：key = email
  const emailStore = new Map<string, { count: number; resetAt: number }>();
  const store: Store = {
    init: () => {
      // no-op
    },
    get: (key) => {
      const entry = emailStore.get(key);
      if (!entry) return undefined;
      if (entry.resetAt < Date.now()) {
        emailStore.delete(key);
        return undefined;
      }
      return { totalHits: entry.count, resetTime: new Date(entry.resetAt) };
    },
    increment: (key) => {
      const existing = emailStore.get(key);
      const now = Date.now();
      if (!existing || existing.resetAt < now) {
        const entry = { count: 1, resetAt: now + DAY_MS };
        emailStore.set(key, entry);
        return { totalHits: 1, resetTime: new Date(entry.resetAt) };
      }
      existing.count += 1;
      return { totalHits: existing.count, resetTime: new Date(existing.resetAt) };
    },
    decrement: (key) => {
      const entry = emailStore.get(key);
      if (entry && entry.count > 0) entry.count -= 1;
    },
    resetKey: (key) => {
      emailStore.delete(key);
    },
    resetAll: () => {
      emailStore.clear();
    },
    shutdown: () => {
      emailStore.clear();
    },
  };

  return rateLimit({
    windowMs: DAY_MS,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => {
      const email = (req.body?.email as string | undefined)?.toLowerCase() ?? 'unknown';
      return email;
    },
    store,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: '操作过于频繁，请稍后重试',
          details: [{ field: 'email', message: `每邮箱每天最多 ${limit} 次注册请求` }],
        },
      });
    },
  });
}

/** 供测试使用：清空 email store */
export function clearEmailLimiterStore(): void {
  // 真实 store 由 registerEmailLimiter() 闭包持有，测试可通过新建 instance 隔离
}
