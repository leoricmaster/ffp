---
name: state-schema
description: state.md 的 YAML frontmatter schema 标准，供所有 Agent 与主 Agent 编排时统一读写。
---

# state.md Schema 标准

state.md 是流程状态的事实源。所有 Agent 必须按此 schema 读写。

## 文件位置

`docs/backlog/{epic-id}/{feature-id}/state.md`

## Frontmatter 格式（YAML）

```yaml
---
type: state
feature_id: ft-XXX-slug
epic: epic-XXX-slug
current: Draft        # Draft | Designed | Implementing | Testing | Verified | Done
confirmedBy: ""       # 用户验收时填写
confirmedAt: ""       # ISO 8601 格式，如 2026-05-20T10:00:00Z
blockers: []          # 字符串数组，每个元素说明阻塞原因
pending_reviews: []   # 字符串数组，待评审项
code_paths: []        # 字符串数组，本次 feature 涉及的关键代码路径
history:
  - { timestamp: "2026-05-20T10:00:00Z", from: Draft, to: Designed, reason: "设计方案审批通过" }
ci_status:
  pr_checks: N/A      # N/A | PENDING | PASS | FAIL
  main_checks: N/A    # N/A | PENDING | PASS | FAIL
test_status:
  p0: N/A             # N/A | PENDING | PASS | FAIL
  p1: N/A             # N/A | PENDING | PASS | FAIL
  p2: N/A             # N/A | PENDING | PASS | FAIL
---
```

## 字段语义

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 是 | 固定值 `state` |
| `feature_id` | string | 是 | 格式 `ft-XXX-slug` |
| `epic` | string | 是 | 格式 `epic-XXX-slug` |
| `current` | enum | 是 | 当前状态，见状态机定义 |
| `confirmedBy` | string | 否 | 用户验收时填写，如 `"用户"` |
| `confirmedAt` | string | 否 | ISO 8601 时间戳 |
| `blockers` | string[] | 是 | 空数组表示无阻塞；有阻塞时主 Agent 必须 escalate 给用户 |
| `pending_reviews` | string[] | 是 | 待评审项列表，如 `["Reviewer 架构评审", "用户设计方案审批"]` |
| `code_paths` | string[] | 是 | 关键代码路径，用于追踪影响范围 |
| `history` | object[] | 是 | 状态变更历史，按时间升序排列 |
| `ci_status.pr_checks` | enum | 是 | PR CI 状态 |
| `ci_status.main_checks` | enum | 是 | main CI 状态 |
| `test_status.p0` | enum | 是 | P0 门禁状态 |
| `test_status.p1` | enum | 是 | P1 用例状态 |
| `test_status.p2` | enum | 是 | P2 用例状态 |

## history 条目格式

```yaml
- timestamp: "2026-05-20T10:00:00Z"
  from: Draft
  to: Designed
  reason: "设计方案审批通过"
```

| 字段 | 说明 |
|------|------|
| `timestamp` | ISO 8601 格式 |
| `from` | 原状态 |
| `to` | 新状态 |
| `reason` | 变更原因，简短描述 |

## 状态转换时必填更新

| 转换 | 必须更新字段 |
|------|-------------|
| 任意状态变更 | `current`, `history`（追加） |
| Designed → Implementing | `current`, `history`（追加） |
| 发现阻塞 | `blockers`（追加） |
| 阻塞解除 | `blockers`（移除对应项） |
| PR 开启 | `ci_status.pr_checks: PENDING` |
| PR CI 完成 | `ci_status.pr_checks: PASS / FAIL` |
| 合并到 main | `ci_status.main_checks: PENDING` |
| main CI 完成 | `ci_status.main_checks: PASS / FAIL` |
| 用户验收 | `confirmedBy`, `confirmedAt` |
| P0 测试开始 | `test_status.p0: PENDING` |
| P0 测试完成 | `test_status.p0: PASS / FAIL` |
| P1/P2 测试完成 | `test_status.p1`, `test_status.p2: PASS / FAIL` |

## 主 Agent 读取规则

主 Agent 编排时按以下优先级读取：

1. 先读 `state.md` frontmatter 获取当前状态
2. 若 `blockers` 非空 → 停止，escalate 给用户
3. 若 `pending_reviews` 非空 → 按列表唤起对应 reviewer
4. 根据 `current` 查状态机规则表决定下一步动作
5. 若 `ci_status.pr_checks === PENDING` → 等待（通知用户）
6. 若 `test_status.p0 === FAIL` → 停止，唤起 Developer 修复
