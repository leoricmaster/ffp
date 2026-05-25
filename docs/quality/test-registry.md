---
type: registry
lifecycle: evergreen
owner: Tester
reviewed_at: 2026-05-20
tags: [testing, smoke, registry]
---

# 测试资产注册表

全局 smoke 用例与关键测试资产的索引视图。本文件由 Tester 维护，每次 smoke 用例变更后更新。

## Smoke 用例清单

| 用例名 | 覆盖路径 | 归属 Feature | 标记方式 | 状态 |
|--------|----------|-------------|---------|------|
| — | — | — | — | — |

> **说明**：当前项目早期阶段，smoke 用例随 feature 开发逐步积累。Tester 在每个 feature 的 P0 门禁通过后，将核心路径用例登记到本表。

## 维护规则

| 动作 | 触发者 | 时机 |
|------|--------|-----|
| 新增 | Tester | Feature Testing 阶段，核心路径用例产出时 |
| 审查 | Tester | 每 5 个 Feature Done 后 |
| 变更审批 | Reviewer | PR 中确认 |

## 关联文档

- 详细规范见 [`test-execution`](../../.claude/skills/test-execution/SKILL.md) Skill §Smoke 测试规范
- 质量管道策略见 [`quality-pipeline.md`](docs/architecture/quality-pipeline.md) §2.3 L3 E2E