---
name: storybook-authoring
description: Storybook stories 编写规范——文件位置、必写 stories（Default/Filled/Loading/WithErrors/Empty）、CDD 分层、Mock 数据（含 MSW）、Decorators、A11y、评审检查清单。
---

# Storybook Stories 编写

> 本 Skill 是 agent 写 stories 时的紧凑参考。

---

## 1. 适用范围

只对 `feature.md` 声明 `has_storybook: yes` 的 feature 适用——即引入**新可复用组件**的场景。纯页面拼装 / 仅复用已有组件的 feature 不需要写 stories。

## 2. 文件位置

```
frontend/web/src/          # 待创建
├── components/common/[Component]/[Component].stories.tsx     # Components 层（通用）
├── components/layouts/[Layout]/[Layout].stories.tsx          # Layouts 层
├── features/{domain}/[Feature].stories.tsx                   # Features 层 ⭐ 评审重点
└── pages/[Page]/[Page].stories.tsx                           # Pages 层
```

CDD 五层：UI（Shadcn 提供，不新建）→ Components → Layouts → Features ⭐ → Pages。

## 3. Story 结构模板

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { fn, within, userEvent } from '@storybook/test';
import { IncomeForm } from './IncomeForm';

const meta = {
  title: 'Features/Income/IncomeForm',
  component: IncomeForm,
  tags: ['autodocs'],
  args: {
    onSubmit: fn(),
  },
} satisfies Meta<typeof IncomeForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { initialValues: { amount: '', date: new Date() } },
};

export const WithValue: Story = {
  args: {
    initialValues: {
      amount: '5000',
      date: new Date('2026-03-25'),
      memberId: 'member-1',
      categoryId: 'cat-2',
      note: '3月份工资',
    },
  },
};

export const Loading: Story = {
  args: {
    initialValues: {
      amount: '5000',
      date: new Date('2026-03-25'),
      memberId: 'member-1',
      categoryId: 'cat-2',
      note: '3月份工资',
    },
    isSubmitting: true,
  },
};

export const WithErrors: Story = {
  args: { ...WithValue.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const submitButton = canvas.getByRole('button', { name: /提交/i });
    await userEvent.click(submitButton);
  },
};
```

## 4. 必写 Stories 清单

| Story | 用途 |
|-------|------|
| **Default** | 初始空状态 |
| **WithValue** | 填充数据 |
| **Loading** | 加载/提交中 |
| **WithErrors** | 验证错误（用 `play` 函数触发） |
| **Empty** | 空数据状态（列表/表格组件） |

**响应式测试**：不单独写 Mobile story。所有 story 必须在 Viewport 插件的 Mobile preset 下正常展示（见 §6 自检与 `.storybook/preview.ts` viewport 配置）。

## 5. Mock 数据规范

- **静态数据**：从 `@/mocks` 导入；不在 stories 里硬编码
- **API 请求**：有数据获取的组件必须配置 MSW（Mock Service Worker）
  - Storybook 专用 handler 写在 `src/mocks/handlers.ts`（按领域拆分，如 `handlers/auth.ts`）
  - 在 `.storybook/preview.ts` 中通过 `initialize()` 注册
  - 每个 story 通过 `parameters.msw.handlers` 覆盖特定接口
- **复用**：现有 mock 数据仓库优先
- **检查**：查看 `@/mocks` 目录中已有 mock 数据，避免重复创建

## 5.5 Controls 驱动探索

Storybook 的核心价值是**通过 Controls 面板实时探索 prop 组合**。每个 story 的 `args` 应覆盖关键 prop 的边界值，便于设计师和产品在 UI 上直接验证：

```typescript
export const Default: Story = {
  args: {
    amount: '',
    date: new Date(),
    disabled: false,
    maxAmount: 999999.99,
  },
};
```

编写时自检：打开 Controls 面板，手动修改各 prop 为边界值（`amount={-1}`、`date={null}`、`disabled={true}`），组件是否仍正确渲染且不报错。

## 5.6 render 函数使用场景

当组件需要 wrapper state、context 覆盖或复杂 setup 时，使用 `render` 替代纯 `args`：

```typescript
export const WithModalOpen: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true);
    return <IncomeForm {...args} modalOpen={open} onClose={() => setOpen(false)} />;
  },
};
```

使用 `render` 的信号：

- 需要 `useState` 管理组件内部状态以展示特定场景
- 需要覆盖局部 Context/Provider（全局 Decorator 已在 preview.ts 中注册，勿重复）
- 需要模拟子组件回调或事件流

**不要**在 render 里写业务逻辑——只用于展示组件状态。

## 6. Decorators 与 Viewport 配置

### 6.1 Decorators

组件依赖上下文（Provider）时，在 `.storybook/preview.ts` 的 `decorators` 中全局注册：

| 上下文 | Decorator 位置 |
|--------|---------------|
| Theme / Dark Mode | `.storybook/preview.ts` decorators |
| React Router | `.storybook/preview.ts` decorators |
| React Query / SWR | `.storybook/preview.ts` decorators |
| 特定 Feature 状态 | 该 story 的 `decorators` 字段 |

禁止在每个 story 文件里重复包裹 Provider；统一走 preview 全局配置。

### 6.2 Viewport Preset 配置

在 `.storybook/preview.ts` 中预设常用视口，确保所有 story 一键切换验证：

```typescript
import type { Preview } from '@storybook/react';
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';

const preview: Preview = {
  parameters: {
    viewport: {
      viewports: {
        ...INITIAL_VIEWPORTS,
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '812px' },
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1440px', height: '900px' },
        },
      },
      defaultViewport: 'desktop',
    },
  },
};

export default preview;
```

自检时必须在 Mobile / Tablet / Desktop 三个 preset 下各过一遍所有 stories。

## 7. 启动验证

```bash
cd frontend/web && npm run storybook
# 浏览器开 http://localhost:6006
```

**自检**：

- 所有 stories 无 TS 错误
- Default / WithValue / Loading / WithErrors / Empty 五种状态可视
- 响应式（Viewport 插件切换 Mobile / Tablet / Desktop）
- Mock 数据来自 `@/mocks` 或 MSW handler
- A11y 面板无严重可访问性错误（`@storybook/addon-a11y`）
- `play` 函数交互测试在 Test 面板通过（如写了交互）
- Controls 面板修改各 prop 边界值后组件仍正确渲染

## 8. 评审展示模板（Plan mode 里给用户）

```
【Designer / Storybook 评审】

交互设计已就绪：
👉 http://localhost:6006
评审入口: Stories > Features > Income > IncomeForm

重点验证：
1. 默认值（金额空、日期为今天）
2. 验证错误（金额 ≤ 0 提示）
3. 提交中状态（按钮 loading）
4. Controls 面板探索边界 prop（负数金额、null 日期、超长备注）
5. 响应式布局（Viewport 插件切换 Mobile / Tablet / Desktop）
6. A11y 面板无严重可访问性问题
```

## 9. 不要做

- 在 stories 里写大量 mock 逻辑（保持简洁）
- 在 story 中写跨页面流程或真实 API 调用（那是 E2E 的范围）
- Storybook 没评审就开始写页面集成
- 声称"做了 Storybook 评审"但零新增 `.stories.tsx`

## 相关

- `docs/process/storybook-guide.md` — 详细中文指南 + 评审流程图
- `.claude/agents/prompts/designer.md` §阶段 1: 交互设计
