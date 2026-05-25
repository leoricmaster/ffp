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

```
docs/backlog/{epic-id}/{feature-id}/
├── state.md                    # feature 级状态
├── feature.md
├── design.md
├── us-001-<slug>/
│   ├── state.md                # US 级状态
│   ├── us-001-<slug>.md
│   └── test-cases/
├── us-002-<slug>/
│   ├── state.md
│   └── ...
└── ...
```

---

## Feature 级 state.md

位于 `docs/backlog/{epic-id}/{feature-id}/state.md`。只在设计阶段使用，Designer 完成后不再更新。

### Frontmatter

```yaml
---
type: state
level: feature
epic: epic-XXX-slug
feature_id: ft-XXX-slug
current: Draft        # Draft | Designed
history:
  - { timestamp: "2026-05-20T10:00:00Z", from: "*", to: Draft, reason: "feature 创建" }
  - { timestamp: "2026-05-21T14:00:00Z", from: Draft, to: Designed, reason: "设计方案审批通过" }
---
```

### 字段语义

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 是 | 固定值 `state` |
| `level` | string | 是 | 固定值 `feature` |
| `epic` | string | 是 | 格式 `epic-XXX-slug` |
| `feature_id` | string | 是 | 格式 `ft-XXX-slug` |
| `current` | enum | 是 | `Draft` 或 `Designed` |
| `history` | object[] | 是 | 状态变更历史，通常只有 1~2 条 |

---

## US 级 state.md

位于 `docs/backlog/{epic-id}/{feature-id}/{us-id}/state.md`。是 Developer / Tester 的主要工作板。

### Frontmatter

```yaml
---
type: state
level: us
epic: epic-XXX-slug
feature_id: ft-XXX-slug
us_id: us-XXX-slug
current: Designed       # Designed | Implementing | Testing | Verified | Done
confirmedBy: ""         # 用户验收时填写
confirmedAt: ""         # ISO 8601 格式
blockers: []            # 字符串数组
pending_reviews: []     # 字符串数组
code_paths: []          # 本 US 涉及的关键代码路径
history:
  - { timestamp: "2026-05-20T10:00:00Z", from: "*", to: Designed, reason: "feature 设计完成，US 就绪" }
  - { timestamp: "2026-05-22T09:00:00Z", from: Designed, to: Implementing, reason: "开始编码" }
  - { timestamp: "2026-05-23T16:00:00Z", from: Implementing, to: Testing, reason: "PR #42 已开，CI 全绿" }
  - { timestamp: "2026-05-24T11:00:00Z", from: Testing, to: Verified, reason: "P0 全绿，用户验收通过" }
  - { timestamp: "2026-05-24T12:00:00Z", from: Verified, to: Done, reason: "已合并到 main" }
test_status:
  p0: N/A               # N/A | PENDING | PASS | FAIL
  p1: N/A
  p2: N/A
ci_status:
  pr_checks: N/A        # N/A | PENDING | PASS | FAIL
  main_checks: N/A
---
```

### 字段语义

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 是 | 固定值 `state` |
| `level` | string | 是 | 固定值 `us` |
| `epic` | string | 是 | 格式 `epic-XXX-slug` |
| `feature_id` | string | 是 | 格式 `ft-XXX-slug` |
| `us_id` | string | 是 | 格式 `us-XXX-slug` |
| `current` | enum | 是 | `Designed \| Implementing \| Testing \| Verified \| Done` |
| `confirmedBy` | string | 否 | 用户验收时填写 |
| `confirmedAt` | string | 否 | ISO 8601 时间戳 |
| `blockers` | string[] | 是 | 空数组表示无阻塞 |
| `pending_reviews` | string[] | 是 | 待评审项 |
| `code_paths` | string[] | 是 | 关键代码路径 |
| `history` | object[] | 是 | 状态变更历史 |
| `test_status.p0` | enum | 是 | P0 门禁状态 |
| `test_status.p1` | enum | 是 | P1 用例状态 |
| `test_status.p2` | enum | 是 | P2 用例状态 |
| `ci_status.pr_checks` | enum | 是 | PR CI 状态 |
| `ci_status.main_checks` | enum | 是 | main CI 状态 |

### history 条目格式

```yaml
- timestamp: "2026-05-20T10:00:00Z"
  from: Designed
  to: Implementing
  reason: "开始编码"
```

| 字段 | 说明 |
|------|------|
| `timestamp` | ISO 8601 格式 |
| `from` | 原状态 |
| `to` | 新状态 |
| `reason` | 变更原因，简短描述 |

---

## 状态转换时必填更新

### Feature 级

| 转换 | 必须更新字段 |
|------|-------------|
| `*` → Draft | `current`, `history`（追加） |
| Draft → Designed | `current`, `history`（追加） |

### US 级

| 转换 | 必须更新字段 |
|------|-------------|
| `*` → Designed | `current`, `history`（追加） |
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
| Verified → Done | `current`, `history`（追加） |

---

## 主 Agent 读取规则

主 Agent 编排时按以下优先级读取：

### Step 1：读 Feature 级状态

```bash
cat docs/backlog/{epic}/{ft}/state.md
```

提取 `current`：

| `current` | 动作 |
|-----------|------|
| `Draft` | 唤起 Designer |
| `Designed` | 进入 Step 2，扫描 US |

### Step 2：扫描 US 级状态（仅 feature 为 Designed 时）

```bash
ls docs/backlog/{epic}/{ft}/us-*/state.md
```

读取每个 US 的 `state.md` frontmatter，提取 `current`、`blockers`、`pending_reviews`、`ci_status`。

### Step 3：按优先级调度 US

对每个 US 执行异常检查：

| 条件 | 动作 |
|------|------|
| `blockers` 非空 | 跳过该 US，记录阻塞；如所有 US 均阻塞，escalate 给用户 |
| `ci_status.pr_checks === PENDING` | 跳过该 US，等待 CI |
| `.last-action-summary.md` 中 `status: failed` | 跳过该 US，记录失败原因 |

按以下优先级选择可推进的 US：

| US `current` | 调度 Agent | 说明 |
|-------------|-----------|------|
| `Designed` | Developer | 未开始实现，优先级最高 |
| `Implementing` | Developer | 编码中，继续推进 |
| `Testing` | Tester | 等待测试执行 |
| `Verified` | Tester | 收尾仪式（Wrap-up） |
| `Done` | — | 跳过 |

### Step 4：Escalate 规则

以下情况必须停止并请示用户：

1. **所有 US 均阻塞**：没有可推进的 US
2. **需人类 Gate**：用户验收（`Verified → Done`）
3. **未知异常**：未在状态机中定义的分支
4. **CI 失败**：PR CI 或 main CI 为 `FAIL` 状态
5. **sub-agent 返回 failed 状态**

---

## US 间依赖（可选）

若 US 之间存在技术依赖，在 `us-*.md` 正文中显式声明：

```markdown
## 依赖

- `us-001-login`：JWT 接口（阻塞本 US 的前端开发）
```

Developer 在开始实现前检查依赖 US 的 `state.md`，若依赖 US 未 `Done`，更新本 US `blockers`：

```yaml
blockers:
  - "等待 us-001-login Done（JWT 接口）"
```
