---
type: adr
id: ADR-002
title: 数据库软删除策略
status: accepted
date: 2026-03-24
author: AI(Solution Designer)
tags: [adr]
---

# ADR-002: 数据库软删除策略

## 状态
- **状态**: 已接受（accepted）
- **日期**: 2026-03-24
- **作者**: AI(Solution Designer)

## 上下文

财务数据敏感，删除操作需要支持恢复能力。

## 决策

所有业务实体表统一使用软删除机制，添加 `deletedAt` 字段。

## 实现

```sql
-- 通用软删除字段
deletedAt TIMESTAMP NULL DEFAULT NULL

-- 查询时过滤软删除记录
WHERE deletedAt IS NULL

-- 软删除操作（而非物理删除）
UPDATE table SET deletedAt = NOW() WHERE id = ?
```

## 原因

1. **数据安全**: 误删可恢复
2. **审计需求**: 财务数据需要保留历史
3. **关联完整性**: 避免外键约束冲突

## 例外

以下情况可考虑物理删除：
- 临时数据（如会话token）
- 明确用户要求彻底删除（需二次确认）

## 后果

- 所有查询需要添加 `deletedAt IS NULL` 条件
- 需要维护 `deletedAt` 索引
- 存储成本略增（保留已删除记录）
