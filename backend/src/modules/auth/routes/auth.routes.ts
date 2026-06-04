// Auth 路由
// v4 §2.1：register / login / refresh / logout 四个端点
// 本 PR 仅落地 register + login + logout（MVP 占位），refresh 由 US-003 PR 补全

import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { registerIpLimiter, registerEmailLimiter } from '../../../shared/middleware/rateLimiter';

const router = Router();

/**
 * POST /api/v1/auth/register
 * 三级限流：IP 20/h + email 5/day
 */
router.post(
  '/register',
  registerIpLimiter(),
  registerEmailLimiter(),
  (req, res, next) => authController.register(req, res, next)
);

/**
 * POST /api/v1/auth/login（MVP 占位）
 */
router.post('/login', (req, res, next) => authController.login(req, res, next));

/**
 * POST /api/v1/auth/refresh（占位）
 */
router.post('/refresh', (_req, res) => {
  res.status(501).json({
    success: false,
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'US-003 待实现' },
  });
});

/**
 * POST /api/v1/auth/logout（占位）
 */
router.post('/logout', (req, res, next) => authController.logout(req, res, next));

export default router;
