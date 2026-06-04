---
name: e2e-playwright
description: Playwright E2E 测试设计规范——selector 策略、data-testid 命名、等待策略、测试模板、数据准备。
---

# Playwright E2E 测试设计

> Tester 写 E2E 用例、前端 Developer 加 data-testid 时按需加载。

---

## 0. 测试分层边界（Storybook play / E2E / 单元测试）

| 层级 | 工具 | 职责边界 | 禁止越界 |
|------|------|---------|---------|
| **单元测试** | Jest / Vitest | 纯函数、验证逻辑、权限判断、错误分支 | 不测 UI 渲染、不测跨组件交互 |
| **Storybook play** | `@storybook/test` | 组件级交互（表单验证触发、按钮状态切换、模态框开闭） | **不**测跨页面导航、**不**测真实 API 调用、**不**测完整用户旅程 |
| **E2E（本 Skill）** | Playwright | 完整用户旅程（登录 → 操作 → 断言 → 登出）、跨页面流程、真实 API 端到端 | 不重复测组件内部状态（已在 Storybook / 单测覆盖） |

**判定标准**：如果测试需要 `page.goto()` 到多个不同路由，或需要验证后端数据持久化 → 归属 E2E；如果只在单个组件内点击/输入/断言 → 归属 Storybook `play`。

## 1. Selector 策略（稳定性从高到低）

| 优先级 | 选择器 | 示例 | 说明 |
|-------|-------|------|------|
| 1 | `data-testid` | `[data-testid="email-input"]` | **项目强制；首选** |
| 2 | `getByRole` | `getByRole('button', { name: '登录' })` | 语义化 + aria-label |
| 3 | `getByLabel` | `getByLabel('邮箱地址')` | 表单字段 |
| 4 | `id` | `#email` | 已稳定使用的 id 属性 |

## 2. 禁用的模式

```typescript
// ❌ 固定等待（导致 flaky tests）
await page.waitForTimeout(1000)

// ❌ 宽泛选择器（容易被 toast 干扰）
page.locator('p.text-red-600')

// ❌ 复杂 DOM 路径
page.locator('div > div > form > div:nth-child(2) > input')
```

## 3. 推荐等待策略

```typescript
// 条件等待
await page.locator('[data-testid="form"]').waitFor({ state: 'visible' })

// 网络空闲（适合 SPA）
await page.goto(url, { waitUntil: 'networkidle' })

// 显式断言等待（带 timeout）
await expect(page.getByText('提交成功')).toBeVisible({ timeout: 5000 })
```

## 4. data-testid 命名约定（前端配合）

**所有 E2E 可交互元素必须加 `data-testid`**。格式：`{page}-{field}-{type}`

```tsx
<input id="email" type="email" data-testid="register-email-input" />
<button type="submit" data-testid="register-submit-button">注册</button>
<div data-testid="register-form">...</div>
<p data-testid="register-email-error" className="text-red-600">{err}</p>
```

示例：`register-email-input` / `login-password-input` / `transaction-submit-button` / `login-form` / `login-email-error` / `records-amount-input`。

## 5. 测试文件模板

```typescript
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.E2E_API_URL || 'http://localhost:8080/api/v1';

describe('ft-001-create: 新增收入记录', () => {
  // 测试隔离：每个测试前清状态
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('load');
    await page.evaluate(() => localStorage.clear());
    await page.context().clearCookies();
  });

  // ===== AT (Acceptance) =====
  test('AT-001: 正常创建收入记录', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="login-email-input"]').fill('test@example.com');
    await page.locator('[data-testid="login-password-input"]').fill('password123');
    await page.locator('[data-testid="login-submit-button"]').click();

    await page.goto(`${BASE_URL}/records/income/new`);
    await page.locator('[data-testid="record-form"]').waitFor({ state: 'visible' });
    await page.locator('[data-testid="records-amount-input"]').fill('5000');
    await page.locator('[data-testid="records-date-input"]').fill('2026-04-16');
    await page.locator('[data-testid="records-submit-button"]').click();

    await expect(page.getByText('提交成功')).toBeVisible({ timeout: 5000 });
  });

});
```

## 5.5 Page Object Model（POM）

**所有跨测试复用的页面操作必须封装为 Page Object**，禁止在多个测试中内联重复选择器。

```typescript
// pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(`${BASE_URL}/login`);
    await this.page.waitForLoadState('networkidle');
  }

  async fillEmail(email: string) {
    await this.page.locator('[data-testid="login-email-input"]').fill(email);
  }

  async fillPassword(password: string) {
    await this.page.locator('[data-testid="login-password-input"]').fill(password);
  }

  async submit() {
    await this.page.locator('[data-testid="login-submit-button"]').click();
  }

  async login(email: string, password: string) {
    await this.goto();
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
    // 等待登录完成——断言具体元素，不用 networkidle
    await this.page.locator('[data-testid="dashboard-header"]').waitFor({ state: 'visible' });
  }
}

// 测试中使用
test('AT-001: 正常创建收入记录', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('test@example.com', 'password123');

  await page.goto(`${BASE_URL}/records/income/new`);
  // ...
});
```

**POM 判定信号**：同一个页面有 ≥2 个测试用例 → 必须封装。

---

## 5.6 Fixtures（自定义测试上下文）

使用 `test.extend` 注入可复用的测试上下文，如已登录页面、测试数据工厂。

```typescript
// fixtures.ts
import { test as base } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

export const test = base.extend<{
  loginPage: LoginPage;
  authenticatedPage: Page;
}>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  // 已登录页面 fixture：每个测试自动完成登录
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.login('test@example.com', 'password123');
    await use(page);
  },
});

// 测试中使用
test('创建收入记录', async ({ authenticatedPage }) => {
  // authenticatedPage 已登录，直接操作
  await authenticatedPage.goto(`${BASE_URL}/records/income/new`);
  // ...
});
```

**Fixture 优于 beforeEach 的场景**：

- 登录态在多个测试文件间复用 → 用 fixture + `storageState`
- 需要按测试覆盖不同的用户角色 → 参数化 fixture

---

## 5.7 API Request（测试数据准备）

Playwright 的 `request` API 用于在**不启动浏览器**的情况下快速准备测试数据。

```typescript
import { test, expect } from '@playwright/test';

test('删除收入记录', async ({ page, request }) => {
  // 1. 用 API 快速创建一条测试数据（比 UI 操作快 10x）
  const response = await request.post(`${API_BASE_URL}/records`, {
    headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    data: {
      type: 'income',
      amount: 5000,
      date: '2026-04-16',
      categoryId: 'cat-1-1',
    },
  });
  expect(response.ok()).toBeTruthy();
  const record = await response.json();

  // 2. 用 UI 验证删除功能
  await page.goto(`${BASE_URL}/records`);
  await page.locator(`[data-testid="record-delete-${record.id}"]`).click();
  await expect(page.getByText('删除成功')).toBeVisible();

  // 3. 用 API 验证数据已清理
  const getResponse = await request.get(`${API_BASE_URL}/records/${record.id}`);
  expect(getResponse.status()).toBe(404);
});
```

**数据准备策略优先级**：

1. **API request**（最快，无浏览器开销）→ 用于 setup
2. **Seed 脚本**（环境初始化）→ 用于基础数据（测试账号、分类）
3. **UI 操作**（最慢但最完整）→ 仅当测试目标本身就是创建流程

---

## 6. Smoke 标记规范

> **权威规范见 `.claude/skills/test-execution/SKILL.md` §Smoke 测试规范**。本节仅保留 Playwright 语法速查。

**标记语法**：

```typescript
// ✅ 标记 smoke
test('@smoke: 用户登录成功', async ({ page }) => {
  // 测试内容
});

// 或使用 grep 友好的 describe
test.describe('@smoke', () => {
  test('登录成功', async ({ page }) => { ... });
  test('创建收入记录', async ({ page }) => { ... });
});
```

**筛选命令**：`npx playwright test --grep '@smoke'`

## 7. 设计用例时的 checklist

- [ ] 用 `data-testid` 选择器
- [ ] 覆盖正面路径 + 前端验证失败 + 边界 + 错误恢复
- [ ] 不用 `waitForTimeout` 固定等待
- [ ] 错误选择器足够具体（不被 toast 干扰）
- [ ] 测试独立；每个测试用唯一数据
- [ ] 核心路径已标记 `@smoke`（如需）

## 8. 测试数据约定

**测试账号**：`test@example.com` / `password123`（seed 提供）
**分类测试 ID**：`cat-1-1`（基本工资）
**禁止**：用生产数据 / 测试间共享状态 / 不验证前置条件

### 数据准备检查

1. 每个用例需要什么初始数据？（账号 / 分类 / 成员 / 已有业务数据）
2. 数据准备自动还是手动？**优先 seed 脚本**，其次 fixture，最后动态创建
3. 测试间数据隔离吗？（避免测试 A 创建的数据被测试 B 依赖）
4. 测试完成清理吗？（幂等 / 或测试后清）

### Seed 命令（待实现阶段配置）

```bash
# 验测试账号
curl -s http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 9. 自动化能力评估

| 测试类型 | 工具 | 可行性 |
|---------|------|--------|
| 前端验证（金额 / 日期 / 必填） | Playwright + API | ✅ |
| UI 布局 | Playwright 截图对比 | ⚠️ 维护成本高 |
| 二级分类联动 | Playwright 点击流程 | ✅ |
| 连续录入模式 | Playwright E2E | ✅ |
| API 验证 | 直接 HTTP 调用 | ✅ |
| 用户完整流程 | Playwright E2E | ✅ |

## 10. 环境配置

| 场景 | 地址 / 命令 |
|------|-----------|
| 后端 API | `http://localhost:8080` |
| 前端 dev | `http://localhost:3000` |
| Prism mock 备选 | `npx prism mock docs/api/openapi.yaml --port 8088` |
| Mock 模式前端 | `.env.mock` 里 `VITE_API_BASE_URL=http://127.0.0.1:4010` |

## 11. Playwright 安装 & 运行

```bash
npx playwright install chromium
cd frontend/web && npx playwright test --ui    # 调试
cd frontend/web && npx playwright test         # CI 模式
```

## 相关

- `.claude/agents/prompts/tester.md` §Integration（视角）
