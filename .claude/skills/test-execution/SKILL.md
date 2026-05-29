---
name: test-execution
agent: Tester
triggers:
  - 进入 Testing 阶段时
  - 执行 P0 门禁时
  - 编写 test-report.md 时
  - P0 失败后回归验证时
description: Tester 测试执行阶段的标准操作流程与模板——执行顺序、优先级规则、状态定义、test-report.md 编写规范、P0 失败处理流程、state.md 更新规则。
depends_on: [test-design-rubric]
human_doc: docs/architecture/quality-pipeline.md#test-layering
---

# Test Execution

Tester 在 `Testing` 阶段执行测试的标准操作流程。

## 目录

- [执行顺序与优先级规则](#执行顺序与优先级规则)
- [测试结果状态定义](#测试结果状态定义)
- [test-report.md 编写规范](#test-reportmd-编写规范)
- [P0 失败处理流程](#p0-失败处理流程)
- [state.md 更新规则](#statemd-更新规则)

---

## 执行顺序与优先级规则

```
Acceptance → Integration（顺序执行）
```

| 优先级 | 规则 |
|--------|------|
| **P0** | FAILED → **停止** → 通知 Developer 修 → **重新跑一遍** |
| **P1 / P2** | FAILED → 记录到 test-report.md，继续 |

---

## Smoke 测试规范

**定位**：PR 阶段的 E2E 快速验证，阻止明显破坏核心流程的代码合入。

**标记方式**：Playwright 测试中用 `test('@smoke', ...)` 或文件名 `*.smoke.spec.ts`。

**筛选命令**：`npx playwright test --grep '@smoke'`。

**维护职责**：

| 动作 | 时机 | 责任人 |
|------|------|--------|
| 新增 smoke 标记 | Feature 开发中，核心路径用例产出时 | Tester |
| 审查 smoke 用例集 | 每 5 个 Feature Done 后 | Tester |
| 注册表变更审批 | 每次变更 | Reviewer（PR 中确认） |

**注册表位置**：`docs/architecture/test-registry.md` —— 维护 smoke 用例清单（用例名 + 覆盖路径 + 归属 Feature）。

---

## Flaky 测试处理

**定义**：同一测试在相同代码下，无代码变更时连续 3 次运行出现通过/失败交替。

**发现后必做**：

1. **立即标记**：Playwright 中使用 `test.fixme()` 跳过
2. **登记债务**：在 GitHub Issues（标签 `type:tech-debt` + `debt:active`）记录（测试名 + 失败模式 + 首次发现时间）
3. **优先修复**：下一个 Tech Debt 清理周期内修复
4. **强制下线**：连续 2 周未修复 → 删除或重写

---

## 测试结果状态定义

| 状态 | 定义 | 算通过 |
|------|------|--------|
| PASS | 跑了且断言通过 | 是 |
| FAILED | 跑了但断言失败 | 否 |
| BLOCKED | 依赖未就绪 | 否 |
| SKIP | 明确不跑 | 否 |

**BLOCKED ≠ PASS**。

---

## test-report.md 编写规范

### 必备 frontmatter

```yaml
---
type: test-report
feature_id: ft-XXX-slug
test_date: YYYY-MM-DD
tester: Agent
---
```

### 结构

1. **执行摘要**：P0 / P1 / P2 统计（总数 / PASS / FAILED / BLOCKED / SKIP）
2. **P0 结果**：逐条列出，每条含 {ID, 类型, 结果, 备注}
3. **P1 / P2 结果**：同上
4. **阻塞项**：BLOCKED 项及原因、预计解决时间
5. **回归测试记录**：修后重跑结果（如有）

### 判定规则

- P0 全部 PASS = 通过门禁
- P0 任一 FAILED = 门禁失败
- BLOCKED 项必须在 test-report.md 中说明原因和预计解决时间

---

## P0 失败处理流程

### 1. 通知 Developer

```markdown
【Developer】— P0 修复请求

### 失败用例
| ID | 类型 | 失败原因 |

### 复现
[步骤 / payload / 日志]

### 要求
1. 修代码
2. 修完通知我重跑（不要直接合）
```

### 2. 等待修复

- Developer 说"修好了" ≠ 修好了
- 只有 Tester 重新跑验证过才算

### 3. 回归验证

- 修完后**重新跑一遍** P0，不是只看 diff
- 更新 test-report.md 的"回归测试记录"段
- 更新 state.md：`Testing → Implementing → Testing`，history 追加 regression

---

## state.md 更新规则

Tester 是 `test_status` / `history`（测试相关记录）在测试阶段的主维护人；`current` 字段由 Orchestrator 统一写入，Tester 通过 `.last-action-summary.md` 汇报建议状态：

| 事件 | state.md 变化（Orchestrator 执行） | Tester 动作 |
|------|-----------------------------------|------------|
| Developer 代码 push 完，PR CI 全绿 | `current: Testing`，history 追加 | 更新 `test_status.p0: PENDING` |
| 全部 P0 PASS + PR review 通过 | `current: Verified`，history 追加 | `.last-action-summary.md` 标记 `suggested_state: "Verified"` |
| 用户 PR approve + 合并 + main CI 全绿 | `current: Done`，history 追加 | 执行收尾仪式 |
| P0 失败打回 | `current: Implementing`，history 追加 regression | `.last-action-summary.md` 标记 `suggested_state: "Implementing"` |
