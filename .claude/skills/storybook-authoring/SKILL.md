---
name: storybook-authoring
agent: Designer
triggers:
  - has_storybook: yes，编写 stories 时
  - 评审 stories 时
description: Storybook stories 编写规范——文件位置、必写 stories（Default/Filled/Loading/WithErrors）、CDD 分层、Mock 数据、评审检查清单。
depends_on: [feature-design]
human_doc: docs/process/common.md#designer
---

# Storybook Stories 编写

> Wave 5-5 起作为 Skill；详细人类可读版仍在 `docs/process/storybook-guide.md`。本 Skill 是 agent 写 stories 时的紧凑参考。

---

## 1. 适用范围

只对 `feature.md` 声明 `has_storybook: yes` 的 feature 适用——即引入**新可复用组件**的场景（TD-016 后规则）。纯页面拼装 / 仅复用已有组件的 feature 不需要写 stories。

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
import { IncomeForm } from './IncomeForm';

const meta = {
  title: 'Features/Income/IncomeForm',
  component: IncomeForm,
  tags: ['autodocs'],
  argTypes: {
    onSubmit: { action: 'submitted' },
  },
} satisfies Meta<typeof IncomeForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { initialValues: { amount: '', date: new Date() } },
};

export const Filled: Story = {
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
  args: { ...Filled.args, isSubmitting: true },
};

export const WithErrors: Story = {
  args: { ...Filled.args },
  play: async ({ canvasElement }) => { /* 触发错误状态 */ },
};
```

## 4. 必写 Stories 清单

| Story | 用途 |
|-------|------|
| **Default** | 初始空状态 |
| **Filled** | 填充数据 |
| **Loading** | 加载/提交中 |
| **WithErrors** | 验证错误 |
| **Empty** | 空数据状态（列表组件） |
| **Mobile** | 移动端适配（如适用） |

## 5. Mock 数据规范

- **必须**：从 `@/mocks` 导入；不在 stories 里硬编码
- **复用**：现有 mock 数据仓库优先
- **检查**：查看 `@/mocks` 目录中已有 mock 数据，避免重复创建

## 6. 启动验证

```bash
cd frontend/web && npm run storybook
# 浏览器开 http://localhost:6006
```

**自检**：

- 所有 stories 无 TS 错误
- Default / Loading / Error / Empty 四种状态可视
- 响应式（Viewport 插件试 Mobile / Tablet / Desktop）
- Mock 数据来自 `@/mocks`

## 7. 评审展示模板（Plan mode 里给用户）

```
【Designer / Storybook 评审】

交互设计已就绪：
👉 http://localhost:6006
评审入口: Stories > Features > Income > IncomeForm

重点验证：
1. 默认值（金额空、日期为今天）
2. 验证错误（金额 ≤ 0 提示）
3. 提交中状态（按钮 loading）
4. 移动端布局
```

## 8. 不要做

- 在 stories 里写大量 mock 逻辑（保持简洁）
- 忽略移动端 story（如产品需要）
- Storybook 没评审就开始写页面集成
- 声称"做了 Storybook 评审"但零新增 `.stories.tsx`（TD-016 反模式）

## 相关

- `docs/process/storybook-guide.md` — 详细中文指南 + 评审流程图
- `.claude/agents/prompts/designer.md` §阶段 1: 交互设计
