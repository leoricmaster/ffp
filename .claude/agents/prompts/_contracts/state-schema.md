---
name: state-schema
description: state.md 的 YAML frontmatter schema 标准，供所有 Agent 与主 Agent 编排时统一读写。支持两级状态模型：feature 级（设计阶段）+ US 级（交付阶段）。
---

# state.md Schema 标准

state.md 是流程状态的事实源。采用**两级状态模型**：

- **Feature 级**：只追踪 `Draft → Designed`，由 Designer 维护
- **US 级**：追踪完整生命周期 `Designed → Implementing → Testing → Verified → Done`，由 Developer / Tester 维护

所有 Agent 必须按此 schema 读写。

---

## 文件位置

- Feature 级：`docs/backlog/{epic-id}/{feature-id}/state.md`
- US 级：`docs/backlog/{epic-id}/{feature-id}/{us-id}/state.md`

---

## 共享字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 是 | 固定值 `state` |
| `level` | string | 是 | `feature` 或 `us` |
| `epic` | string | 是 | 格式 `epic-XXX-slug` |
| `feature` | string | 是 | 格式 `ft-XXX-slug` |
| `current` | enum | 是 | 见下表 |
| `history` | object[] | 是 | `{timestamp: ISO8601, from, to, reason}[]` |

### 各 level 的 `current` 取值

| level | `current` 可选值 |
|-------|-----------------|
| `feature` | `Draft` → `Designed` |
| `us` | `Designed` → `Implementing` → `Testing` → `Verified` → `Done` |

---

## Feature 级 state.md

只在设计阶段使用，Designer 完成后不再更新。

```yaml
---
type: state
level: feature
epic: epic-XXX-slug
feature: ft-XXX-slug
current: Draft
history:
  - { timestamp: "2026-05-20T10:00:00Z", from: "*", to: Draft, reason: "feature 创建" }
  - { timestamp: "2026-05-21T14:00:00Z", from: Draft, to: Designed, reason: "设计方案审批通过" }
---
```

---

## US 级 state.md

Developer / Tester 的主要工作板。

```yaml
---
type: state
level: us
epic: epic-XXX-slug
feature: ft-XXX-slug
us: us-XXX-slug
current: Designed
blockers: []
history:
  - { timestamp: "2026-05-20T10:00:00Z", from: "*", to: Designed, reason: "feature 设计完成，US 就绪" }
  - { timestamp: "2026-05-22T09:00:00Z", from: Designed, to: Implementing, reason: "开始编码" }
  - { timestamp: "2026-05-23T16:00:00Z", from: Implementing, to: Testing, reason: "PR #42 已开，CI 全绿" }
  - { timestamp: "2026-05-24T11:00:00Z", from: Testing, to: Verified, reason: "P0 全绿，用户验收通过" }
  - { timestamp: "2026-05-24T12:00:00Z", from: Verified, to: Done, reason: "已合并到 main" }
test_status:
  p0: N/A
  p1: N/A
  p2: N/A
ci_status:
  pr_checks: N/A
  main_checks: N/A
---
```

### US 级特有字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `us` | string | 是 | 格式 `us-XXX-slug` |
| `blockers` | string[] | 是 | 空数组表示无阻塞 |
| `test_status.p0` | enum | 是 | `N/A \| PENDING \| PASS \| FAIL` |
| `test_status.p1` | enum | 是 | 同上 |
| `test_status.p2` | enum | 是 | 同上 |
| `ci_status.pr_checks` | enum | 是 | `N/A \| PENDING \| PASS \| FAIL` |
| `ci_status.main_checks` | enum | 是 | 同上 |

---

## 状态更新规则

任何状态转换必须追加 `history` 条目。涉及阻塞、CI 或测试的状态变化同步更新对应字段。

---

## 参考

- 编排逻辑、状态机执行表及 Escalate 规则见 [orchestrator.md](../orchestrator.md)。
- Agent 完成信号格式见 [orchestration-interface.md](./orchestration-interface.md)。
