---
name: code-review
agent: Reviewer
triggers:
  - PR 代码评审时
description: 代码评审规范——checklist、flow 一致性、4 条红线。
depends_on: [engineering]
---

# Code Review Skill

Reviewer 执行代码评审时的快速参考。

## 评审 checklist

### 1. 代码规范

- TypeScript 严格模式
- 命名一致 / 无硬编码配置 / 错误处理完整 / 日志适当

### 2. 设计一致性

- [ ] 实现与 feature.md / design.md 一致
- [ ] API 与 OpenAPI 一致
- [ ] 组件分层符合 CDD
- [ ] 无范围蔓延
- [ ] **流程视图一致性**：本 PR 触及的代码路径是否出现在任一 `flows/flow-*.md` 的"维护触发器"里？若是，flows/ 是否已同步更新？

### 3. 测试覆盖

- [ ] 业务验证 / 权限检查 / 错误分支都有单测
- [ ] 关键逻辑覆盖 > 70%

### 4. 安全

- [ ] 无敏感信息（密码 / token / API key）
- [ ] 输入验证在位
- [ ] SQL 注入 / XSS 风险已处理

## 结论

| 结论 | 处理 |
|------|------|
| **Approved** | 留 PR comment，用户可验收 |
| **Approved with comments** | 非阻塞建议，Developer 视情况处理 |
| **Changes Requested** | 列出严重问题；Developer 修完 re-request review |
| **Blocked** | P0 安全 / P0 测试失败 / 设计严重偏离 → 阻止合并 |

## 必须拒绝合并（4 条红线）

1. P0 测试失败或覆盖率不达标
2. 发现安全漏洞
3. 设计与实现严重偏离且无合理解释
4. 关键逻辑无测试覆盖

## 评审输出

不写独立 `.md` 文件。结论直接作为 PR review comment。

评论格式：

- 必须修改：标注 `[MUST]` + 具体文件/行号 + 修改建议
- 建议修改：标注 `[SUGGESTION]` + 理由
- 问题澄清：标注 `[QUESTION]`
