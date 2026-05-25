---
type: adr
id: ADR-001
title: 使用 UUID 作为实体标识
status: accepted
date: 2026-03-24
author: AI(Solution Designer)
tags: [adr]
---

# ADR-001: 使用UUID作为实体标识

## 状态
- **状态**: 已接受（accepted）
- **日期**: 2026-03-24
- **作者**: AI(Solution Designer)

## 上下文

FFP系统需要为所有实体（用户、记录、分类等）选择标识符策略。

## 决策

使用UUID v4作为所有实体的主键标识符。

## 原因

1. **安全性**: 不暴露数据库记录数量（自增ID可推测）
2. **分布式**: 支持未来可能的分布式部署
3. **批量导入**: 前端可预生成ID，便于乐观更新
4. **合并方便**: 多数据源合并时ID不会冲突

## 替代方案

- **自增ID**: 性能更好，但不满足安全和分布式需求
- **雪花ID**: 有序，但复杂度更高

## 后果

- 所有实体表使用 `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- 外键关联也使用UUID类型
- 查询性能略低于自增ID，但在FFP规模下可忽略
