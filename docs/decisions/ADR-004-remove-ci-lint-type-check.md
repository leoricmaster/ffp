---
type: adr
id: ADR-004
title: 单人开发模式下 CI lint/type-check 的必要性
status: proposed
date: 2026-05-16
author: Zhang Yunfeng
tags: [adr, ci, hooks]
supersedes: null
---

# ADR-004: 单人开发模式下 CI lint/type-check 的必要性

## 状态

**Proposed**（待讨论后确认）

---

## 上下文

FFP 目前是**单人 + AI**开发模式。GitHub Actions CI 中跑了 lint 和 type-check 两个 job，本地 Husky pre-commit 也会跑相同的检查。存在重复。

关于这一点的讨论记录在 `docs/process/ci-analysis-and-improvement-plan.md`。

---

## 决策

**单人开发模式下，考虑移除 CI lint/type-check，仅依赖本地 Husky hooks**。

---

## 分析

### 当前架构

```
本地 commit ──→ Husky pre-commit (lint + type-check)
     │
     └── push ──→ CI (lint + type-check + test)
```

lint 和 type-check 在 CI 和本地 hooks 中完全重复。

### 节省的时间

| 方案 | CI 耗时 | PR feedback |
|------|---------|-------------|
| Hooks + CI lint/type-check | ~5-6min | lint/type-check ~90s |
| **只有 Hooks** | **~4min** | lint/type-check 在本地即时 |

**节省约 1.5min/PR（约 20-25%）**

### 单人 + AI 场景的特殊性

AI 生成代码时：

- 本地 lint 失败 → AI 看到报错并自动修正 → 修完再 commit
- 体验与"CI 失败 → 本地修 → push"相同，只是反馈更即时

### 风险

| 风险 | 缓解 |
|------|------|
| `git commit --no-verify` 绕过 hooks | 单人项目，主动权在自己 |
| 工具版本 drift | Node.js version 在 `actions/setup-node@v6` 中固定；本地用 nvm 保证同版本 |
| 忘记装 hooks（新人） | Husky 在 `npm ci` 时自动配置 |

---

## 替代方案

### 方案 A: CI lint/type-check + hooks 并存（现状）

- 优点：双重保险
- 缺点：重复，CI 多了 2 个 job

### 方案 B: 只用 hooks，CI 移除 lint/type-check

- 优点：省 CI 时间，维护更简单
- 缺点：依赖开发者不跳过 hooks

### 方案 C: hooks 可选，CI 必须跑 lint/type-check

- 中间方案
- 实际意义不大，hooks 应该是强制性的

---

## 结论

**推荐方案 B**——单人 + AI 模式下，只用 hooks 是合理的。

---

## 待实施条件

1. 确认 Husky hook 在所有 commit 时都跑（未使用 `--no-verify`）
2. 确认本地 Node.js 版本与 CI 一致（都用 v22）
3. CI improvement plan 讨论完毕后的综合修改（见 `docs/process/ci-analysis-and-improvement-plan.md` Phase 3 末期）

---

## 相关文档

- CI 分析与改进计划（`docs/process/ci-analysis-and-improvement-plan.md`，待创建）
- [ADR-001 使用 UUID 作为实体标识](./ADR-001-use-uuid.md)
