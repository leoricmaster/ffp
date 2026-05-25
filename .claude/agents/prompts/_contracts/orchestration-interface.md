---
name: orchestration-interface
description: 各 Agent Prompt 中"编排接口"章节的标准模板，确保主 Agent 能统一解析触发条件、输入输出和完成信号。
---

# 编排接口标准模板

每个 Agent Prompt 必须包含此章节，供主 Agent（编排器）读取后决定何时唤起本 Agent、传入什么、期待什么产出。

## 章节结构

```markdown
## 编排接口（供主 Agent 使用）

### 触发条件

| 条件类型 | 表达式 | 说明 |
|---------|--------|------|
| 状态条件 | `state.current === "XXX"` | 必须满足 |
| 前置文件 | `feature.md` 存在 | 必须满足 |
| 前置条件 | `state.blockers === []` | 必须满足 |
| 可选条件 | `state.pending_reviews 包含 "YYY"` | 有则优先处理 |

### 输入（主 Agent 提供）

| 资源 | 路径/说明 | 用途 |
|------|----------|------|
| state.md | `docs/backlog/{epic}/{ft}/state.md` | 读取当前状态 |
| feature.md | 同目录 | 读取需求 |
| ... | ... | ... |

### 输出（本 Agent 产出）

| 文件 | 必写 | 用途 |
|------|------|------|
| `xxx.md` | 是 | 详细产出 |
| `.last-action-summary.md` | 是 | 供主 Agent 快速读取 |
| `state.md` | 是 | 更新 current + history |

### 完成信号

- **成功**：`.last-action-summary.md` 中 `status: success`，标记 `suggested_state: "XXX"`；Orchestrator 校验后统一更新 `state.current`
- **失败**：`.last-action-summary.md` 中 `status: failed`，原因写入 `blockers`
- **需人类决策**：`.last-action-summary.md` 中 `needs_human_gate: true`，`pending_reviews` 追加对应项

### 下一步（主 Agent 自动执行）

- 成功且无人类 Gate → 唤起 [下一个 Agent]
- 成功且需人类 Gate → 停止，通知用户
- 失败 → escalate 给用户
```

## .last-action-summary.md 标准格式

每个 Agent 完成后必须写入同目录下的 `.last-action-summary.md`：

```yaml
---
agent: designer          # designer | developer | tester | reviewer
feature_id: ft-XXX-slug
status: success          # success | failed | blocked | needs_human_gate
---

## 完成内容
- [要点 1]
- [要点 2]

## 关键决策
- [决策 1：理由]

## 已知风险
- [风险 1]

## 下一步建议
- [建议 1]
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `agent` | 是 | 本 Agent 名称 |
| `feature_id` | 是 | 关联 feature |
| `status` | 是 | 主 Agent 据此判断流转 |
| `needs_human_gate` | 否 | 在 frontmatter 或正文中标记 |

**长度约束**：正文不超过 20 行，总计不超过 300 tokens。主 Agent 每次必读本文件。
