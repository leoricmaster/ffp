---
name: core-fragments
description: FFP Agent 核心约束——所有 Agent 共享的硬规则（L2 项目宪章）
---

# FFP Agent 核心约束

FFP 是单人 + AI + GitHub Issues 协作的家庭财务规划工具。

## 硬约束

**所有代码修改走 PR，不准直接 push main。**

**新建 ft/td/bg ID 必须先跑脚本：**

```bash
node scripts/allocate-id.js <type> <slug>
```

**`gh issue create` body 必须带类型标签：**

- Feature: `Feature: ft-xxx`
- Bug: `Bug: bg-xxx`（额外带 `severity:` 和 `area:`）
- TechDebt: `TechDebt: td-xxx`

**PR-scoped 任务必须写分支锁：**

1. `git checkout -b` 后：`echo "<branch>" > .git/claude-agent-branch`
2. 每次关键 git 操作前校验：`git rev-parse --abbrev-ref HEAD`
3. 任务结束（PR 开完）：`rm -f .git/claude-agent-branch`

**错误分两级：**

- L1：自行修复（lint / typecheck / 单测失败等）
- L2：上报用户或 Reviewer（契约矛盾、架构改动、P0 门禁被迫绕过等）

**结束工作前确认 `state.md` 已更新。**

## 规范分层

| 层级 | 位置 | 核心问题 |
|------|------|---------|
| **L1 工具强制** | CI、Lint、GitHub Settings | 机器能自动检查并阻断什么？ |
| **L2 项目级流程** | 本文档 | 所有 Agent 共同遵守的最小硬约束 |
| **L3 Agent 级职责** | Agent Prompt | 每个角色的方法论和行为边界 |
| **L4 任务级技术** | Skill | 特定任务的标准操作流程和模板 |

**单点来源原则**：同一约束只在一个地方定义，其他地方引用。

## 引用索引

| 场景 | 文件 |
|------|------|
| 开 GitHub Issue | `_contracts/issue-template.md` |
| 分支锁协议 | `_contracts/branch-lock.md` |
| ID 分配详情 | `_contracts/id-allocation.md` |
| 错误升级流程 | `_contracts/error-escalation.md` |
| state.md 格式 | `_contracts/state-schema.md` |
| 完成信号格式 | `_contracts/orchestration-interface.md` |
| 主 Agent 编排逻辑 | `orchestrator.md` |
| 完整流程与 Skill 索引 | `docs/process/README.md` |
