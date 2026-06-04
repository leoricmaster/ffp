// 在所有测试文件加载前设置兜底环境变量
// 真实环境配置由各测试的 beforeAll 覆盖
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-must-be-at-least-32-bytes-long!!';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
// 测试环境下放宽限流，避免大量测试用例触发 429
process.env.RATE_LIMIT_REGISTER_IP = '10000';
process.env.RATE_LIMIT_REGISTER_EMAIL = '10000';
