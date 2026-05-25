---
name: feature-design
agent: Designer
triggers:
  - 起草 feature.md 时
  - 起草 design.md 时
  - 变更 API 契约时
description: feature.md 与 design.md 编写规范——模板、US 拆分原则、API 契约变更流程。
depends_on: [adr-writing]
human_doc: docs/process/common.md#designer
---

# Feature Design Skill

Designer 编写 `feature.md` / `design.md` 时的快速参考。

## feature.md 模板

位置：`docs/backlog/{epic-id}/{feature-id}/feature.md`

Frontmatter 必填：`type/id/epic/title/priority/owner/created`，禁止 `status`。

```markdown
# <Feature 标题>

## 目标
## 背景
## 范围（包含 / 不包含）
## User Stories
### US-001 <标题>
**As** <角色>, **I want** <意图>, **so that** <价值>
**AC**:
- [ ] AC1 #ft-XXX 📅 YYYY-MM-DD
## 设计概要（> 150 行拆 design.md）
## 关联 Flow（无则 —）
## 架构依赖 & 与现有功能关系
## Storybook 声明（has_storybook: yes/no）
```

## US 拆分原则

### 垂直切片

每个 US 必须是能独立交付价值的垂直切片（UI → 逻辑 → 数据）。

- `US-001: 家庭管理员能手动录入一条收入`
- `US-001: 后端实现 POST /records`（按技术层拆，无独立价值）

### 渐进明细

| 阶段 | feature.md 该有什么 |
|------|---------------------|
| **Draft** | 目标 / 背景 / 范围 / US 骨架 |
| **设计审批前** | 补全 AC；设计概要；Storybook 声明；API 契约 |
| **Designed 后** | 遇新分支场景 → 补 `uc-*.md`；遇 OpenAPI 变更 → 走变更记录 |

## design.md 结构

设计段 > 150 行时从 feature.md 拆分：

```markdown
# <Feature> 设计详设

## 组件分层
## API Inventory
## 数据模型变更
## 关键交互（mermaid 序列图）
## 错误处理 & 边界场景
## Flow 影响（如有）
```

## API 契约变更流程

1. 先更新 `docs/architecture/api/openapi.yaml`
2. 评估向后兼容性：
   - 新增可选字段 / 新增枚举值
   - 新增必填 / 删字段 / 改类型 / 删枚举值（必须触发架构审批 Gate）
3. Plan 里附 Swagger UI 链接

## 架构审批触发信号

design.md 涉及以下修改时触发架构审批 Gate：

- OpenAPI 新增/删除/修改端点
- data-model.md 新增/修改表或字段
- CI/CD 流程变更
- 新增外部依赖
- 跨越已有系统边界
