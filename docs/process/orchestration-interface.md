---
name: orchestration-interface
description: .last-action-summary.md 的 YAML frontmatter + 正文格式标准，供主 Agent 统一解析完成信号。
---

# .last-action-summary.md 格式标准

每个 Agent 完成后必须写入同目录下的 `.last-action-summary.md`，供 Orchestrator 读取完成信号。

## 格式

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

## 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `agent` | 是 | 本 Agent 名称 |
| `feature_id` | 是 | 关联 feature |
| `status` | 是 | Orchestrator 据此判断流转：`success` → 推进；`failed` → escalate；`blocked` → 追加 blockers；`needs_human_gate` → 停止等用户 |
| `needs_human_gate` | 否 | 在 frontmatter 或正文中标记，Orchestrator 收到后停止并通知用户 |

## 完成信号语义

| status | Orchestrator 动作 |
|--------|-----------------|
| `success` | 读取 `suggested_state`（如有）推进 state；若无 human gate，唤起下一个 Agent |
| `failed` | 读取 `blockers` 写入 state.md；escalate 给用户 |
| `blocked` | 追加 `blockers`，跳过该 US |
| `needs_human_gate` | 停止，通知用户决策 |

**长度约束**：正文不超过 20 行，总计不超过 300 tokens。
