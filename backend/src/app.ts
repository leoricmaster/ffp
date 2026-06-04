import express from 'express';
import authRoutes from './modules/auth/routes/auth.routes';
import { errorHandler } from './shared/middleware/errorHandler';

const app = express();

// Body 解析；refreshToken 走 Cookie 不读 body
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/v1/auth', authRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// 404 兜底
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'RECORD_NOT_FOUND', message: '资源不存在' },
  });
});

// 统一错误处理（AppError / ZodError / 未处理异常）
app.use(errorHandler);

export default app;
