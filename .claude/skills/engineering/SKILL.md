---
name: engineering
description: Developer 编码实现时的技术栈规范与标准操作流程——基于实际已落地的 Express + Zod + React + Vite 技术栈。
---

# Engineering

后端（Express + Zod）与前端（React + Vite + Tailwind）的编码标准操作流程。

## 当前技术栈

| 端 | 框架/库 | 状态 |
|----|---------|------|
| 后端 | Express 4.x + Zod 4.x | 已安装 |
| 后端测试 | Jest + ts-jest + Supertest | 已配置 |
| 前端 | React 18 + Vite + Tailwind + shadcn/ui | 已安装 |
| 前端测试 | Vitest + @testing-library/react | 已配置 |

## 目录组织原则

> 当前 `backend/src/` 与 `frontend/web/src/` 尚未创建。Agent 编码前须确认实际目录结构，按业务模块组织，不预设具体路径。

### 后端原则

- 按业务模块分组（如 `modules/finance/`、`modules/family/`）
- 共享代码放 `shared/`（数据库客户端、安全、中间件、工具）
- 配置集中放 `config/`
- 入口文件：`app.ts`（Express 实例配置）+ `server.ts`（启动监听）

### 前端原则

- `components/`：跨功能复用的 UI 组件
- `features/`：功能内聚代码（路由、页面、专属组件、Hooks）
- `services/`：HTTP 客户端封装（axios 实例、请求/响应拦截、DTO 类型）
- `hooks/`：通用 React Hooks
- `lib/utils/types/constants/`：工具函数、类型、常量

**components/ vs features/ 判据**：这段代码是否至少被两个 feature 用到？是 → `components/`；否 → `features/`。

## Controller / Service 分工

| 层 | 职责 |
|----|------|
| **Controller** | HTTP 参数解析、Zod schema 校验、调用 Service、格式化响应、错误转 HTTP status code |
| **Service** | 业务规则、数据访问、事务控制 |

同一业务域的 Service 应复用，不重复建表或重复逻辑。

## 数据访问模式

当前阶段（无 ORM）：Service 中直接管理数据访问。

引入 ORM 后的分层建议：

| 场景 | 做法 |
|------|------|
| 简单 CRUD | Service 直接调用 ORM |
| 复杂查询 / 聚合 / 多表 Join | 抽离 Repository 层，Service 只关注业务编排 |
| 跨 Service 事务 | 由调用方 Service 控制事务边界，被调 Service 接收 `tx` 参数 |

Repository 层职责（如引入）：封装 ORM 查询细节，对外暴露领域方法（如 `findByEmailWithFamily`），Service 不直接写原始查询。

## 前端 Service 边界

- `src/services/` 仅做 HTTP 客户端封装（axios 配置、请求拦截、错误处理、DTO 映射）
- **不要**在前端 Service 里写业务逻辑——业务规则在后端

## 前端状态管理

当前技术选型：待定（React Context / Zustand / TanStack Query）。

决策原则：

- **服务端状态**（API 数据）：优先用 TanStack Query 管理缓存、重试、去重、后台刷新
- **客户端全局状态**（用户认证、主题、UI 状态）：用 Zustand 或 React Context
- **组件局部状态**：`useState` / `useReducer`

## API 错误处理标准

后端统一错误响应格式：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数校验失败",
    "details": [{ "field": "email", "message": "邮箱格式不正确" }]
  }
}
```

前端 `src/services/` 封装层职责：

1. 拦截 HTTP 错误，统一转换为业务错误对象
2. 401 自动触发登出 / refresh token 流程
3. 网络错误自动重试（最多 3 次，指数退避）
4. **不**将原始错误直接抛给 UI 组件——返回结构化的错误对象，由调用方决定展示方式

## 前后端类型共享

全栈 TypeScript 项目，DTO 类型单向共享：

```
design.md API 契约
  → 后端定义 Zod schema（运行时校验 + 类型推导）
  → 前端通过 import type 复用推导类型
```

- 后端 export Zod schema 的 `z.infer<typeof Schema>` 类型
- 前端用 `import type` 引用，避免把后端运行时依赖打包到前端
- API 契约变更时，先改后端 Zod schema，前端在编译期自动获得类型检查

## 安全基线

编码完成后逐项自检：

- [ ] 敏感信息走环境变量（`process.env.*`），不硬编码
- [ ] 错误响应脱敏（不暴露 DB 连接串、堆栈详情）
- [ ] 输入验证：所有接口入口用 Zod schema 校验
- [ ] 参数化查询：如后续引入 ORM，禁止字符串拼接 SQL
- [ ] 软删除优先于物理删除
- [ ] CORS 限制来源（不开放 `*`）
- [ ] Rate Limiting 已配置（Express 用 `express-rate-limit`）
- [ ] JWT Secret 长度 ≥ 256 bit，access token 过期 ≤ 1h，refresh token 支持轮换
- [ ] 密码哈希使用 bcrypt（rounds ≥ 12）或 Argon2id
- [ ] 前端输出转义用户输入（防御 XSS），禁止 `dangerouslySetInnerHTML` 直接渲染未过滤内容
- [ ] 敏感操作（登录、注册、修改密码）独立 Rate Limiting

## data-testid 命名

所有可交互元素加 `data-testid`，格式：`{page}-{field}-{type}`

例：`data-testid="login-email-input"`

参考 `.claude/skills/e2e-playwright/SKILL.md` 中的 selector 策略。

## 自检流程

提交前本地全绿：

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
npm run type-check
npm test
```

## 单元测试模板

### 覆盖目标

**必须覆盖**：

- 所有 AC 正面路径对应的业务逻辑
- 所有 Zod 验证函数
- 所有权限检查
- 所有错误分支（400 / 401 / 403 / 404 / 500）

**不强制**：

- 简单 getter / setter / 纯路由转发 / 无分支的数据转换

### 编写约定

- **隔离外部依赖**：DB / JWT / 加密 / 日志通过 Mock 注入，单测不碰真实数据库
- **AAA 模式**：Arrange / Act / Assert
- **命名**：`describe('ServiceName', () => describe('methodName', () => test('应该[预期行为]')))`
- **Mock 清理**：
  - 后端 Jest：`beforeEach(() => jest.clearAllMocks())`
  - 前端 Vitest：`beforeEach(() => vi.clearAllMocks())`

### 测试框架

| 端 | 框架 | 配置文件 |
|----|------|---------|
| 后端 | Jest + ts-jest | `backend/jest.config.js` |
| 前端 | Vitest | `frontend/web/vitest.config.ts` |

### 测试数据工厂

禁止在测试中硬编码魔法值。统一用工厂函数生成测试数据：

```ts
// backend/src/test/factories/user.factory.ts
export const createUserFixture = (overrides?: Partial<User>) => ({
  id: 'usr-test-001',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

// 使用
const user = createUserFixture({ email: 'admin@example.com' });
```

工厂文件位置：

- 后端：`backend/src/test/factories/`
- 前端：`frontend/web/src/test/factories/`

### 覆盖率门槛

| 环境 | 门槛 |
|------|------|
| 本地开发 + CI PR | ≥ 80% line coverage |
| CI main push | ≥ 80% line coverage |

```bash
# 后端
cd backend && npm run test:coverage

# 前端
cd frontend/web && npm run test:unit:coverage
```

## 路径别名（待启用）

当前 `tsconfig.json` 与 `vite.config.ts` **未配置**路径别名。shadcn/ui 的 `components.json` 中已定义别名（`@/components`、`@/lib` 等），待 `src/` 结构确定后须同步配置到 TS/Vite：

```ts
// 后端（示例，待启用）
import { DatabaseService } from '@shared/database/database.service';

// 前端（示例，待启用）
import { StatCard } from '@/components/common/StatCard';
```

配置时需同步更新：

- 后端：`tsconfig.json` paths + `tsconfig-paths/register`（如用）
- 前端：`tsconfig.json` paths + `vite.config.ts` resolve.alias
