# 多智能体状态机定义

> 所有 Agent 共享的规范。各 Agent Prompt 中涉及状态、Schema、信号定义时，引用此文件而非重复内联。

---

## 1. 状态层级

| 层级 | 路径模式 | Orchestrator 维护字段 | Agent 维护字段 |
|------|---------|----------------------|---------------|
| Feature | `docs/backlog/{epic}/{ft}/state.md` | `current` | `history`, `blockers` |
| US | `docs/backlog/{epic}/{ft}/{us}/state.md` | `current` | `history`, `blockers`, `test_status`, `ci_status` |
| Tech Debt | `docs/backlog/{td}/state.md` | `current` | `history`, `blockers`, `ci_status` |
| Defect | `docs/backlog/{de}/state.md` | `current` | `history`, `blockers`, `test_status`, `ci_status` |

---

## 2. 状态定义

### 2.1 Feature 状态机

```
Draft → Designed → Implementing → Testing → Verified → Done
```

| 状态 | 进入条件 | 退出条件 |
|------|---------|---------|
| `Draft` | feature 创建 | Designer 完成，`status: success` |
| `Designed` | Designer 自检通过 | 用户审批通过 |
| `Implementing` | 用户 approve 设计方案 | Developer PR CI 全绿 |
| `Testing` | PR CI 绿 | Reviewer `Approved` + Tester P0 PASS |
| `Verified` | P0 全 PASS | 用户 PR approve |
| `Done` | 用户验收通过 | 终结态 |

**异常转移**：

- `Implementing` ↔ `Testing` 往返超过 3 次 → escalate 给用户
- 任意状态 `blockers` 非空 → 停止编排

### 2.2 Tech Debt 状态机（简化）

```
Backlog → InProgress → Done
```

| 状态 | 进入条件 | 退出条件 |
|------|---------|---------|
| `Backlog` | Tech Debt 登记 | 用户说"开始 td-XXX" |
| `InProgress` | 唤起 Developer | Developer PR CI 绿 + Reviewer `Approved` + 用户 approve |
| `Done` | 用户 approve | 终结态 |

### 2.3 Defect 状态机（简化）

```
New/Backlog → InProgress → Testing → Done
```

| 状态 | 进入条件 | 退出条件 |
|------|---------|---------|
| `New` | 缺陷发现（P0 立即唤起 Developer） | P0 唤起 Developer；P1/P2 用户确认后排期 |
| `Backlog` | P1/P2 用户确认排期 | 用户说"开始 de-XXX" |
| `InProgress` | 唤起 Developer | Developer 修复 + PR CI 绿 |
| `Testing` | 唤起 Tester 验证 | Tester PASS + Reviewer `Approved` + 用户 approve |
| `Done` | 用户 approve | 终结态 |

---

## 3. Schema 定义

### 3.1 共享字段（所有 state.md）

```yaml
type: state
history:
  - { timestamp: "2026-05-20T10:00:00Z", from: "*", to: Draft, reason: "..." }
blockers: []
```

### 3.2 Feature 级 state.md

```yaml
---
type: state
level: feature
epic: epic-XXX-slug
feature: ft-XXX-slug
current: Draft
history:
  - { timestamp: "2026-05-20T10:00:00Z", from: "*", to: Draft, reason: "feature 创建" }
blockers: []
---
```

增量字段：`level: feature` | `current: Draft|Designed`

### 3.3 US 级 state.md

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
  - { timestamp: "2026-05-20T10:00:00Z", from: "*", to: Designed, reason: "feature 设计完成" }
test_status.p0: N/A
test_status.p1: N/A
test_status.p2: N/A
ci_status.pr_checks: N/A
ci_status.main_checks: N/A
---
```

增量字段：`level: us` | `us` | `test_status.p0/p1/p2: N/A|PENDING|PASS|FAILED` | `ci_status.pr_checks|main_checks: N/A|PENDING|PASS|FAILED`

### 3.4 Tech Debt 级 state.md

```yaml
---
type: state
level: tech-debt
tech_debt: td-XXX-slug
current: Backlog
history:
  - { timestamp: "2026-05-20T10:00:00Z", from: "*", to: Backlog, reason: "tech debt 登记" }
blockers: []
ci_status.pr_checks: N/A
ci_status.main_checks: N/A
---
```

增量字段：`level: tech-debt` | `tech_debt` | `current: Backlog|InProgress|Done` | `ci_status`

### 3.5 Defect 级 state.md

```yaml
---
type: state
level: defect
defect: de-XXX-slug
current: New
severity: P0
history:
  - { timestamp: "2026-05-20T10:00:00Z", from: "*", to: New, reason: "defect 登记" }
blockers: []
test_status.p0: N/A
ci_status.pr_checks: N/A
ci_status.main_checks: N/A
---
```

增量字段：`level: defect` | `defect` | `severity: P0|P1|P2` | `current: New|Backlog|InProgress|Testing|Done` | `test_status.p0` | `ci_status`

---

## 4. `.last-action-summary.md` 规范

### 4.1 文件位置

| Agent | 路径 |
|-------|------|
| Designer | `docs/backlog/{epic-id}/{ft-id}/.last-action-summary.md`（feature 级） |
| Developer / Tester / Reviewer | `docs/backlog/{epic-id}/{ft-id}/{us-id}/.last-action-summary.md`（US 级） |

### 4.2 Frontmatter

```yaml
---
agent: designer          # designer | developer | tester | reviewer
feature_id: ft-XXX-slug
status: success          # success | failed | blocked | needs_human_gate | error
suggested_state: ""      # 当 status: success 时，建议的下一状态（如 "Testing", "Implementing"）
---
```

Tester / Developer / Reviewer 增量字段：`us: us-XXX-slug`

正文约束：不超过 6 个 bullet 点，每点不超过 2 行。

### 4.3 完成信号语义

| status | 含义 | Orchestrator 动作 |
|--------|------|------------------|
| `success` | Agent 完成本职工作，建议推进 | 读取 `suggested_state`，推进状态，继续编排 |
| `failed` | 不可修复的阻塞问题 | 读取 blockers，escalate 给用户 |
| `blocked` | 外部依赖阻塞 | 追加 blockers，跳过该 US；全部阻塞则 escalate |
| `needs_human_gate` | 需用户审批/决策 | 停止，按场景向用户提交请求 |
| `error` | Agent 工具链故障/产出物异常 | 停止，通知用户，不猜测推进 |

### 4.4 写入校验（Orchestrator 执行）

| 检查项 | 异常处理 |
|--------|---------|
| `agent` 字段与当前唤起 Agent 不一致 | `status: error`，停止编排 |
| state.md 中被修改的字段不属于该 Agent 维护范围 | 停止编排 |
| Designer 写入 US 级 `.last-action-summary.md` | 停止编排（Designer 只写 feature 级） |
| Developer/Tester/Reviewer 写入 feature 级 `.last-action-summary.md` | 停止编排（只写 US 级） |

---

## 5. Agent 唤起条件速查

| Agent | 状态条件 | 其他条件 |
|-------|---------|---------|
| Designer | `feature.current === Draft` | — |
| Developer (Feature) | `us.current === Designed` | 用户已 approve 设计方案；`blockers === []` |
| Developer (Tech Debt) | `tech_debt.current === InProgress` | — |
| Developer (Defect) | `defect.current === InProgress` | P0 立即；P1/P2 用户确认后 |
| Tester (Phase A) | `feature.current === Designed` | 与 Developer 并行 |
| Tester (Phase B) | `us.current === Testing` | PR CI 绿 |
| Tester (Phase C) | `us.current === Verified` | 用户 PR approve 后 |
| Reviewer | `us.current === Testing` | Developer PR CI 绿后串行唤起 |

---

## 6. 循环评审上限

同一 US 的 `Implementing → Testing → Implementing` 往返超过 **3 次** → 自动 escalate 给用户，汇报历史回归记录，请求人工决策（继续修复 / 重新设计 / 降级范围）。
