---
name: e2e-playwright
agent: Tester + Developer
triggers:
  - 设计 E2E 用例时
  - 添加 data-testid 时
description: Playwright E2E 测试设计规范——selector 策略、data-testid 命名、等待策略、测试模板、数据准备。
depends_on: [test-design-rubric]
human_doc: docs/architecture/quality-pipeline.md#l3-e2e
---

# Playwright E2E 测试设计

> Wave 5-5 起从旧 `.claude/agents/prompts/integration-tester-e2e-guide.md` 迁入此 Skill。Tester 写 E2E 用例、前端 Developer 加 data-testid 时按需加载。

---

## 1. 命名规范

```
{feature-id}-{short-description}.spec.ts
示例：ft-001-income-record.spec.ts
```

## 2. Selector 策略（稳定性从高到低）

| 优先级 | 选择器 | 示例 | 说明 |
|-------|-------|------|------|
| 1 | `data-testid` | `[data-testid="email-input"]` | **项目强制；首选** |
| 2 | `getByRole` | `getByRole('button', { name: '登录' })` | 语义化 + aria-label |
| 3 | `getByLabel` | `getByLabel('邮箱地址')` | 表单字段 |
| 4 | `id` | `#email` | 已稳定使用的 id 属性 |

## 3. 禁用的模式

```typescript
// ❌ 固定等待（导致 flaky tests）
await page.waitForTimeout(1000)

// ❌ 宽泛选择器（容易被 toast 干扰）
page.locator('p.text-red-600')

// ❌ 复杂 DOM 路径
page.locator('div > div > form > div:nth-child(2) > input')
```

## 4. 推荐等待策略

```typescript
// 条件等待
await page.waitForSelector('[data-testid="form"]', { state: 'visible' })

// 网络空闲（适合 SPA）
await page.goto(url, { waitUntil: 'networkidle' })

// 显式断言等待（带 timeout）
await expect(page.getByText('提交成功')).toBeVisible({ timeout: 5000 })
```

## 5. data-testid 命名约定（前端配合）

**所有 E2E 可交互元素必须加 `data-testid`**。格式：`{page}-{field}-{type}`

```tsx
<input id="email" type="email" data-testid="register-email-input" />
<button type="submit" data-testid="register-submit-button">注册</button>
<div data-testid="register-form">...</div>
<p data-testid="register-email-error" className="text-red-600">{err}</p>
```

示例：`register-email-input` / `login-password-input` / `transaction-submit-button` / `login-form` / `login-email-error` / `amount-input`。

## 6. 测试文件模板

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
    await page.fill('[data-testid="login-email-input"]', 'test@example.com');
    await page.fill('[data-testid="login-password-input"]', 'password123');
    await page.click('[data-testid="login-submit-button"]');

    await page.goto(`${BASE_URL}/records/income/new`);
    await page.waitForSelector('[data-testid="record-form"]', { state: 'visible' });
    await page.fill('[data-testid="amount-input"]', '5000');
    await page.fill('[data-testid="date-input"]', '2026-04-16');
    await page.click('[data-testid="submit-button"]');

    await expect(page.getByText('提交成功')).toBeVisible({ timeout: 5000 });
  });

  // ===== CT (Contract) =====
  test('CT-001: API 契约验证', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/transactions`, {
      data: {
        type: 'INCOME',
        amount: 5000,
        transactionDate: '2026-04-16',
        categoryId: 'cat-1-1'
      }
    });
    expect(response.status()).toBe(201);
  });
});
```

## 7. Smoke 标记规范

**标记方式**：核心路径用例必须标记 `@smoke`，供 PR 阶段快速筛选。

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

**什么该标 smoke**：

- 用户最核心路径（登录、主功能 CRUD）
- 其他 feature 高度依赖的前置流程
- 历史上曾 regression 的路径

**不该标 smoke**：

- 边界/异常场景
- 次要功能
- 新 feature 未稳定前

## 8. 设计用例时的 checklist

- [ ] 用 `data-testid` 选择器
- [ ] 覆盖正面路径 + 前端验证失败 + 边界 + 错误恢复
- [ ] 不用 `waitForTimeout` 固定等待
- [ ] 错误选择器足够具体（不被 toast 干扰）
- [ ] 测试独立；每个测试用唯一数据
- [ ] 核心路径已标记 `@smoke`（如需）

## 8. 优先级定义

| 优先级 | 定义 | 必须覆盖？ |
|-------|------|----------|
| P0 | 核心 CRUD 流程 | ✅ 必须 |
| P1 | 重要边界验证（金额、日期） | ✅ 应该 |
| P2 | 异常（网络断、并发） | 尽量 |

## 9. 测试数据约定

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

## 10. 自动化能力评估

| 测试类型 | 工具 | 可行性 |
|---------|------|--------|
| 前端验证（金额 / 日期 / 必填） | Playwright + API | ✅ |
| UI 布局 | Playwright 截图对比 | ⚠️ 维护成本高 |
| 二级分类联动 | Playwright 点击流程 | ✅ |
| 连续录入模式 | Playwright E2E | ✅ |
| API 契约 | 直接 HTTP 调用 | ✅ |
| 用户完整流程 | Playwright E2E | ✅ |

## 11. 环境配置

| 场景 | 地址 / 命令 |
|------|-----------|
| 后端 API | `http://localhost:8080` |
| 前端 dev | `http://localhost:3000` |
| Prism mock 备选 | `npx prism mock docs/architecture/api/openapi.yaml --port 8088` |
| Mock 模式前端 | `.env.mock` 里 `VITE_API_BASE_URL=http://127.0.0.1:4010` |

## 12. Playwright 安装 & 运行

```bash
npx playwright install chromium
cd frontend/web && npx playwright test --ui    # 调试
cd frontend/web && npx playwright test         # CI 模式
```

## 相关

- `docs/process/common.md §6` — 人类入口指针（PR-5 之后仅指向本 Skill；事实源在此）
- `.claude/agents/prompts/tester.md` §Integration（视角）
