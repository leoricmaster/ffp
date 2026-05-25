---
name: core-fragments
description: FFP Agent 核心约束——所有 Agent 共享的硬规则（L2 项目宪章）
---

# FFP Agent 核心约束

FFP 是单人 + AI + GitHub Issues 协作的家庭财务规划工具。

## 自报家门

每次向用户汇报时第一行：

```text
【{Agent名称}】
[你的问题或汇报内容]
```

## 硬约束（不遵守 = 流程破坏）

- [ ] 所有代码修改走 PR，不准直接 push main
- [ ] 新建 ft/td/bg ID 必须先跑 `node scripts/allocate-id.js <type> <slug>`
- [ ] `gh issue create` body 必须带类型标签（`Feature: ft-xxx` / `Bug: bg-xxx` / `TechDebt: td-xxx`）；Bug 类 Issue 额外带 `severity:` 和 `area:`
- [ ] PR-scoped 任务必须写分支锁 `.git/claude-agent-branch`
- [ ] 错误分两级：L1 自行修复 / L2 上报用户或 Reviewer
- [ ] 结束工作前确认 `state.md` 已更新

## 规范分层（L1-L4）

| 层级 | 位置 | 核心问题 | 内容 |
|------|------|---------|------|
| **L1 工具强制** | CI 脚本、Lint、GitHub Settings | 机器能自动检查并阻断什么？ | 违反即阻断，无需记忆 |
| **L2 项目级流程** | 本文档 | 所有 Agent 必须共同遵守的最小硬约束是什么？ | PR 必须走 main、ID 分配、Issue 标签、分支锁、错误分级 |
| **L3 Agent 级职责** | Agent Prompt | 每个角色的方法论和行为边界是什么？ | US 拆分原则、RGR 流程、独立性原则 |
| **L4 任务级技术** | Skill | 特定任务的标准操作流程和模板是什么？ | PR 模板、E2E 策略、ADR schema、技术栈代码规范 |

**单点来源原则**：同一约束只在一个地方定义，其他地方引用。

## 按需引用

| 场景 | 读取 |
|------|------|
| 开 GitHub Issue | `_contracts/issue-template.md` |
| 分支锁协议 | `_contracts/branch-lock.md` |
| ID 分配详情 | `_contracts/id-allocation.md` |
| 错误升级流程 | `_contracts/error-escalation.md` |
| state.md 格式 | `_contracts/state-schema.md` |
| Agent 编排接口标准 | `_contracts/orchestration-interface.md` |
| 主 Agent 编排 | `.claude/agents/prompts/orchestrator.md` |
| 完整流程 | `docs/process/README.md` |
| Feature 设计 | `feature-design` Skill |
| 架构评审 | `design-review` Skill |
| PR 规范 | `feature-pr-flow` Skill |
| 代码规范 | `engineering` Skill |
| 代码评审 | `code-review` Skill |
| 测试设计 | `test-design-rubric` Skill |
| 测试执行 | `test-execution` Skill |
| E2E 规范 | `e2e-playwright` Skill |
| ADR 写作 | `adr-writing` Skill |
| Storybook | `storybook-authoring` Skill |
| 质量管道策略 | `docs/architecture/quality-pipeline.md` |
| 测试资产注册表 | `docs/architecture/test-registry.md` |
