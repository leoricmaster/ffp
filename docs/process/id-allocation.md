---
name: id-allocation
description: 全局 ID 分配脚本使用说明（已 Skill 化，Agent 应调用 Skill `id-allocation`）
---

# ID 分配（已 Skill 化）

> **Agent 指引**：调用 Skill `id-allocation`，不要直接跑脚本。

本脚本用于分配 Feature / Tech Debt / Bug ID。

## 调用方式

**Agent**（自动调用）：

```bash
Skill "id-allocation"
```

**人类**（直接运行）：

```bash
node scripts/allocate-id.js <type> <slug>
```

| 类型 | 命令 | 示例输出 |
|------|------|----------|
| Feature | `ft <slug>` | `ft-008-create-income` |
| Tech Debt | `td <slug>` | `td-035-openapi-categories` |
| Bug | `bg <slug>` | `bg-003-login-error` |

## 脚本行为

脚本自动完成：

1. 读取 `docs/backlog/Product-Backlog.md` 注册表
2. 计算下一个序号
3. grep 全仓库冲突检查
4. 更新注册表
5. 输出完整 ID

## 冲突处理

注册表写 `ft` 最大 003，但仓库里已有 `ft-004` 引用 → 脚本报错，要求人工修正注册表后重试。

## 单人使用说明

单人 + 单实例无并发冲突。若未来并行多 session，需加文件锁。
