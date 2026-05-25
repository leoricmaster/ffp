---
type: adr
id: ADR-003
title: Feature 与 User Story 命名规范
status: accepted
date: 2026-04-16
author: AI(Solution Designer)
tags: [adr]
---

# ADR-003: Feature 与 User Story 命名规范

## 状态

已通过（accepted）

## 日期

2026-04-16

## 上下文

随着 FFP 项目 Feature 和 User Story 数量增长，需要明确的命名规范来：

1. 避免 ID 歧义（不同 Epic 下可能有同名 US）
2. 建立代码、文档、流程中的统一引用方式
3. 支持快速定位和追溯

## 决策

### 1. Feature ID（ft）全局唯一

**格式**: `ft-{序号}-{简述}`

**规则**:

- `ft` 前缀表示 Feature
- 序号从 001 开始，全局递增，不在 Epic 间复用
- 简述用 kebab-case，尽量简洁

**示例**:

```text
ft-001-create   # 新增收入记录
ft-002-list     # 查看收入列表
ft-006-expense  # 新增支出记录（属于另一个 Epic）
```

**为什么不用 FFP 前缀**:

- `FFP-001-create` 比 `ft-001-create` 更冗长
- `ft` 与 `epic-` 风格统一，更简洁
- `ft` 已是业界常见缩写（feature）

### 2. User Story ID 引用必须带 Feature 前缀

**格式**: `ft-{ft-id}-us-{us-id}`

**规则**:

- 引用 US 时必须写成 `ft-{ft-id}-us-{us-id}` 形式
- 禁止单独使用 `us-001` 等形式，避免歧义
- US 序号在 Feature 内从 001 开始递增

**示例**:

```text
ft-001-us-001   # ft-001-create 的第 1 个 US
ft-001-us-002   # ft-001-create 的第 2 个 US（如果存在）
ft-002-us-001   # ft-002-list 的第 1 个 US
```

**使用场景**:

```typescript
// 代码注释
// ref: ft-001-us-001 AC1 - 基础信息录入

// 文档引用
// 详见 ft-001-us-001 的 AC2 金额验证

// Git 提交
// feat(ft-001-us-001): 实现基础信息录入
```

### 3. Tech Debt ID（td）全局唯一

**格式**: `td-{序号}-{简述}`

**规则**:

- `td` 前缀表示 Tech Debt
- 序号从 001 开始，全局递增，不与 ft / bg 复用
- 简述用 kebab-case

**示例**:

```text
td-001-openapi-categories   # OpenAPI paths 缺 /categories 定义
td-010-generator-version    # OpenAPI generator 版本漂移
```

**承载位置**: GitHub Issues（标签 `type:tech-debt` + `debt:active`）。活跃债务在 Issues 中追踪，已偿还债务关闭后自然归档。

### 4. Bug ID（bg）全局唯一

**格式**: `bg-{序号}-{简述}`

**规则**:

- `bg` 前缀表示 Bug
- 序号从 001 开始，全局递增，不与 ft / td 复用
- 简述用 kebab-case

**示例**:

```text
bg-001-login-redirect-loop   # 登录后重定向死循环
bg-002-pagination-offset     # 列表分页 offset 计算错误
```

**承载位置**: GitHub Issues 是事实源；代码注释中用 `bg-xxx` 引用。关闭的 Issue 自然归档，不额外维护历史文档。

### 5. 统一 ID 注册表

三类 ID 共享一个全局递增空间，**一经分配永不复用**。在 `docs/backlog/Product-Backlog.md` 末尾维护「已分配最大序号」注册表，避免冲突。

| 前缀 | 类型 | 当前最大序号（示例） |
|------|------|---------------------|
| `ft` | Feature | 003 |
| `td` | Tech Debt | 034 |
| `bg` | Bug | — |

> 新增任一类型 ID 时，先查表确认序号不冲突，再更新表。

### 6. 目录结构

```text
docs/backlog/
├── Product-Backlog.md           # 全局索引 + ID 注册表
├── epic-001-income-record/
│   ├── epic.md
│   └── ft-001-create/           # Feature 目录
│       ├── feature.md
│       └── us-001.md            # US 文件，ID 为 ft-001-us-001
```

Tech Debt 和 Bug 不创建独立目录，其生命周期短于 Feature，由 GitHub Issues 承载。

## 后果

### 正面

- 三类 ID 全局唯一，无歧义，跨类型也不会碰撞
- 引用简洁清晰，代码注释 / git log / Issue 中统一
- 便于代码追溯和文档检索

### 负面

- ID 较长（如 `ft-001-us-001`），但清晰度更重要
- 需要维护全局序号注册表，单人项目成本可忽略

## 维护

此 ADR 由 Knowledge Keeper 维护，更新时需通知相关开发者。新增 `td` / `bg` 编号时同步更新注册表。
