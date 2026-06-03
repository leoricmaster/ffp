---
name: feature-design
description: feature.md 与 design.md 编写规范——模板、US 拆分原则、API 契约变更流程。
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
- [ ] AC1  （YYYY-MM-DD）
## 设计概要（拆 design.md 条件见下）
## 关联 Scenario（无则 —）
## 与现有功能的关系
## Storybook 声明（has_storybook: yes/no）

- **yes**：本 feature 引入新可复用组件（非纯页面拼装）。必须列出预期 stories 清单，供 Reviewer 代码评审时核对：
  ```markdown
  ## Storybook 声明
  has_storybook: yes
  stories:
    - Default       # 初始空状态
    - WithValue     # 填充数据
    - Loading       # 加载/提交中
    - WithErrors    # 验证错误
    - Empty         # 空数据状态（列表/表格组件）
  ```

- **no**：仅复用已有组件或纯页面拼装

## 需求变更记录（设计审批通过后追加）

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

设计段涉及以下任一情况时，从 feature.md 拆分到 design.md：

- 涉及 ≥2 个 API 端点的新增/修改/删除
- 涉及数据模型变更（新表 / 改字段 / 改关系）
- 涉及 ≥3 个组件/页面的交互设计
- 涉及状态机、权限规则、并发/事务等复杂逻辑
- 需要 mermaid 序列图才能讲清关键交互

```markdown
# <Feature> 设计详设

## 组件分层
## API Inventory
## 数据模型变更
## 关键交互（mermaid 序列图）
## 错误处理 & 边界场景
## Scenario 影响（如有）
```

## API 契约变更流程

1. 先更新 `docs/api/openapi.yaml`
2. 评估向后兼容性：
   - ✅ 向后兼容（无需审批）：新增可选字段、新增枚举值
   - ⚠️ 非兼容变更（必须触发架构审批 Gate）：新增必填字段、删除字段、修改字段类型、删除枚举值
3. Plan 里附 Swagger UI 链接

## 架构审批触发信号

design.md 涉及以下修改时触发架构审批 Gate：

- OpenAPI 新增/删除/修改端点
- data-model.md 新增/修改表或字段
- CI/CD 流程变更
- 新增外部依赖
- 跨越已有系统边界
