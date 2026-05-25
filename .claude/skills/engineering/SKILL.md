---
name: engineering
agent: Developer
triggers:
  - 编码实现时
  - 本地自检时
  - 编写单元测试时
description: Developer 编码实现时的技术栈规范与标准操作流程——后端模块边界、Controller/Service 分工、前端目录组织、安全基线、data-testid 命名、自检命令、单元测试模板。
depends_on: []
human_doc: docs/architecture/quality-pipeline.md#l1-unit-tests
---

# Engineering

后端（NestJS/Express + Prisma）与前端（React + Vite + Tailwind）的编码标准操作流程。

## 目录

- [后端规范](#后端规范)
- [前端规范](#前端规范)
- [自检流程](#自检流程)
- [单元测试模板](#单元测试模板)

---

## 后端规范

### 模块边界（规划结构）

> 以下为规划中的后端目录结构，实现阶段确定。

```text
backend/src/                    # 待创建
├── modules/
│   ├── family/                 # 家庭 / 用户 / 认证 / 分类
│   └── finance/                # Transaction / Account
├── shared/
│   ├── database/               # ORM 客户端封装
│   ├── security/               # 密码 / JWT
│   ├── middleware/             # 认证、验证、错误处理
│   └── utils/                  # 日志、响应格式
├── config/
├── app.ts                      # Express 应用配置
└── server.ts                   # 启动入口
```

### Controller / Service 分工

| 层 | 职责 |
|----|------|
| **Controller** | HTTP 参数解析、Zod/express-validator 校验、调 Service、格式化响应、错误转 HTTP code |
| **Service** | 业务规则、数据访问（直接 Prisma 或封装）、事务 |

收入/支出等 feature 复用 `modules/finance/transaction.service.ts`，不新建独立表。

### 安全基线检查点

编码完成后自检：

- [ ] 敏感信息走环境变量（`process.env.*`），不硬编码
- [ ] 错误信息外露脱敏（不抛 DB 连接串）
- [ ] Prisma 参数化查询（SQL 注入防护）
- [ ] 输入验证（Zod / express-validator）
- [ ] 软删除（不物理删除）

### 路径别名

```ts
// ✅
import { DatabaseService } from '@shared/database/database.service';
import { UserService } from '@modules/family/user.service';
```

直跑 TS 时带 `-r tsconfig-paths/register`。

---

## 前端规范

### 目录组织（混合模式，规划结构）

> 以下为规划中的前端目录结构，实现阶段确定。

```text
frontend/web/src/            # 待创建
├── components/              # 跨功能复用
│   ├── ui/                  # Shadcn/ui 原子层
│   ├── common/              # 通用组合组件
│   ├── layouts/             # AppLayout / TopNav
│   └── forms/
├── features/                # 功能特有
│   ├── auth/
│   ├── records/
│   ├── transactions/
│   └── accounts/
├── pages/                   # 页面组件（route target）
├── hooks/                   # 跨功能通用 React Hooks
├── services/                # HTTP 客户端层
├── lib/                   # cn() 等工具
├── utils/ types/ constants/
└── mocks/                 # Storybook + 开发期 Mock 数据
```

### features/ vs components/ 判据

这段代码**是否至少被两个 feature 用到**？是 → `components/`；否 → `features/`。

### 前端 service 边界

- 前端 `src/services/` = HTTP 客户端（axios 封装、DTO 映射、错误处理）
- **不要**在前端 service 里塞业务逻辑——那是后端的事

### 路径别名

```tsx
// ✅
import { StatCard } from '@/components/common/StatCard'
import { useAuth } from '@/features/auth/hooks/useAuth'
```

Vite `resolve.alias` 与 `tsconfig.json` 必须同步。

### data-testid 命名

所有可交互元素加 `data-testid`，命名：`{page}-{field}-{type}`

例：`data-testid="login-email-input"`

---

## 自检流程

代码提交前必须本地全绿：

```bash
# 后端
cd backend
npm run lint
npm run format
npm run typecheck
npm test

# 前端
cd frontend/web
npm run lint
npm run format
npm run typecheck
npm test
```

---

## 单元测试模板

### 覆盖目标

**必须覆盖**：

- 所有 AC 正面路径
- 所有验证函数
- 所有权限检查
- 所有错误分支（400 / 401 / 403 / 404 / 500）

**不强制**：

- 简单 getter / setter / 路由参数解析 / 简单数据转换

### 编写约定

- **隔离外部依赖**：Prisma / JWT / Logger / 加密通过 Mock 注入，单测不碰真实 DB
- **AAA 模式**：Arrange / Act / Assert
- **命名**：`describe('ServiceName', () => describe('methodName', () => test('应该[预期行为]')))`
- **Mock 清理**：`beforeEach(() => jest.clearAllMocks())`

### 覆盖率门槛

| 环境 | 门槛 | 配置位置 |
|------|------|---------|
| 本地开发 + CI PR | ≥ 60% line coverage | 测试框架配置文件中配置 |
| CI main push | ≥ 80% line coverage | `.github/workflows/ci.yml` 动态覆盖 |
| 开发者目标 | ≥ 80% line coverage | 追求目标，不强制阻断 |

```bash
# 后端
cd backend && npm run test:coverage

# 前端
cd frontend/web && npm run test:unit:coverage
```
