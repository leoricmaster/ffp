---
name: developer-precommit
description: Developer的Pre-commit Hook参考文档
depends_on: [engineering]
human_doc: docs/process/common.md#developer
---

# Developer - Pre-commit Hook 参考

本文件是 `developer.md` 的补充，提供 Pre-commit Hook 的详细参考信息。

---

## 项目已配置的 Hooks

在 `.husky/` 目录下配置了以下 hooks：

| Hook | 检查内容 | 失败处理 |
|------|----------|----------|
| `pre-commit` | lint-staged（lint + format） | 提交被拒绝 |
| `commit-msg` | Commit message 格式 | 提交被拒绝 |

## 手动触发 Pre-commit 检查

在提交代码前，建议手动运行检查：

```bash
# 后端
cd backend
npm run lint      # ESLint 检查
npm run format    # Prettier 格式化
npm run typecheck # TypeScript 类型检查
npm test          # 单元测试

# 前端
cd frontend/web
npm run lint
npm run format
npm run typecheck
npm test
```

## 如果 Hook 未生效

```bash
# 重新安装 husky
cd backend && npx husky install
cd frontend/web && npx husky install
```

## 依赖安装

**后端**：

```bash
cd backend
npm install
# 如果使用 Docker：
docker exec <container_name> npm install
```

**前端**：

```bash
cd frontend/web
npm install
```

## 后端服务验证

```bash
# 方式 A：本地启动（如果直接运行后端）
cd backend && npm run dev

# 方式 B：检查 Docker 容器健康状态
docker ps | grep <container_name>
docker logs <container_name> --tail 20

# 方式 C：调用健康检查接口
curl -s http://localhost:8080/api/v1/health
```

**如果后端启动失败**：

1. 查看错误日志：`docker logs <container_name>`
2. 识别问题类型：
   - 依赖缺失 → 安装依赖
   - 代码错误 → 修复代码
   - 数据库连接 → 检查数据库
3. 修复后重新验证
