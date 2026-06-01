---
type: adr
id: ADR-XXX
title: {简短标题}
status: accepted      # proposed | accepted | superseded | deprecated
date: YYYY-MM-DD
author: AI(Designer)
# supersededBy: ADR-YYY | path/to/successor.md   # 仅当 status: superseded 时必填
# relatedFeature: ft-xxx-slug                    # 可选
tags: [adr]
# Lifecycle: ADR 本身就是 frozen——status 字段已承担生命周期角色，不需要额外 lifecycle: 字段
---

# ADR-XXX: {简短标题}

## 状态

- [ ] proposed（提议中）
- [x] accepted（已接受）
- [ ] deprecated（已弃用）
- [ ] superseded（已被取代，见 `supersededBy`）

## 背景

{为什么需要做这项决策？上下文是什么？}

## 决策

{我们决定做什么？}

## 选项对比

| 选项 | 优点 | 缺点 | 选择 |
|------|------|------|------|
| 选项A | - | - | ❌ |
| 选项B | - | - | ✅ |

## 理由

{为什么选择这个选项？}

## 影响

### 积极影响

- {影响1}

### 消极影响

- {影响1}

### 需要更新的文档

- [ ] {文档路径}

## 相关决策

- 依赖: {ADR-XXX}
- 被依赖: {ADR-XXX}

## 备注

{其他信息}

---

**决策日期**: YYYY-MM-DD
**决策影响**: {Feature IDs}
**决策记录者**: {name}
