---
name: design-review
agent: Reviewer
triggers:
  - 评审 design.md 时
description: 架构评审规范——评审维度、设计一致性检查清单、触发/跳过规则。
depends_on: [feature-design]
---

# Design Review Skill

Reviewer 执行架构评审时的快速参考。

## 何时执行 / 跳过

| 场景 | 处理 |
|------|------|
| 引入新技术 / 新模块 / 新表 | 必审 |
| 改现有路由 / API 契约 | 必审 |
| 复用既有模式 + 纯页面拼装 | 可跳过，Designer 自审 |
| 用户问"架构靠谱吗" | 必审 |

## 评审维度

### 1. 一致性

数据模型 / API / 组件分层是否符合现有约定。

检查清单：

- [ ] 数据模型命名与现有表一致
- [ ] API 路径风格与 OpenAPI 现有端点一致
- [ ] 组件分层符合 CDD（Component Driven Development）
- [ ] 错误码 / 响应格式与现有 API 一致

### 2. 可行性 & 风险

新依赖有充分理由；风险可量化 + 有缓解。

检查清单：

- [ ] 新依赖的必要性已说明
- [ ] 技术选型有对比（至少两个选项）
- [ ] 风险已识别并有缓解方案
- [ ] 性能影响已评估（如有）

### 3. 复用

该复用的复用了没有（ft-002 `level2Category` 漏筛就是在这步抓到的）。

检查清单：

- [ ] 已有组件 / 工具函数已检索
- [ ] 相似功能已检查是否可复用
- [ ] 新组件的必要性已说明（不是已有组件的变体）

## 结论

| 结论 | 处理 |
|------|------|
| **Approved** | Designer 可进入设计方案审批 |
| **Approved with minor** | 建议记录，Designer 在 Plan 里展示 |
| **Changes Requested** | Designer 返工 |

**不要因为评审意见就拉用户**。只有需要用户决策的架构层面改动（新技术选型 / 改路由 / 改 API 契约）才上报，触发架构审批 Gate。

## 架构评审报告（可选）

位置：`docs/backlog/{epic-id}/{feature-id}/architecture-review.md`

- 评审结论
- 发现的问题（阻塞 / 非阻塞）
- 决策 / 建议（引用具体段落 / commit）
- 风险 & 缓解

**ft-003 教训**：给了 changes 但没登记"每项修改吸收在哪个 commit"——后续无从追溯。请在报告里标出"吸收于 commit abc123"。
