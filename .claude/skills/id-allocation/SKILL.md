---
name: id-allocation
agent: all
triggers:
  - 新建 ft/td/bg ID 时
description: 全局 ID 分配脚本使用说明——分配 Feature / Tech Debt / Bug ID。
---

# ID 分配

**任何时候新建 ft/td/bg ID，必须先调用本 Skill**，禁止手填序号。

## 脚本调用

```bash
# 分配 Feature ID
node scripts/allocate-id.js ft <slug>

# 分配 Tech Debt ID
node scripts/allocate-id.js td <slug>

# 分配 Bug ID
node scripts/allocate-id.js bg <slug>
```

## 脚本行为

脚本自动完成：

1. 读取 `docs/backlog/Product-Backlog.md` 注册表
2. 计算下一个序号
3. grep 全仓库冲突检查
4. 更新注册表
5. 输出完整 ID（如 `ft-008-create-income`）

## 冲突处理

注册表写 `ft` 最大 003，但仓库里已有 `ft-004` 引用 → 脚本报错，要求人工修正注册表后重试。

## 单人使用说明

单人 + 单实例无并发冲突。若未来并行多 session，需加文件锁。

## GitHub Issue 标签规则

分配 ID 后创建 Issue 时，body 必须带类型标签：

| 类型 | 标签格式 |
|------|----------|
| Feature | `Feature: ft-xxx` |
| Bug | `Bug: bg-xxx`（额外带 `severity:` 和 `area:`） |
| Tech Debt | `TechDebt: td-xxx` |
