---
name: id-allocation
description: 全局 ID 分配脚本使用说明
---

# ID 分配脚本

**任何时候新建 ft/td/bg ID，必须先调用脚本**，禁止手填序号。

```bash
# 分配 Feature ID
node scripts/allocate-id.js ft <slug>
# 输出: ft-008-create-income

# 分配 Tech Debt ID
node scripts/allocate-id.js td <slug>
# 输出: td-035-openapi-categories

# 分配 Bug ID
node scripts/allocate-id.js bg <slug>
# 输出: bg-003-login-error
```

脚本自动完成：读取注册表 → 计算下一个序号 → grep 仓库冲突检查 → 更新 `Product-Backlog.md` 注册表 → 输出完整 ID。

**冲突报错示例**：注册表写 ft 最大 003，但仓库里已有 ft-004 引用 → 脚本报错，要求人工修正注册表后重试。

**单人 + 单实例无并发冲突**。若未来并行多 session，需加文件锁。
