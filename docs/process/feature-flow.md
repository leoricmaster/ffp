# Feature 开发全流程

## 协作模型

参与者：用户、Orchestrator、Designer、Developer、Tester、Reviewer。

**原则**：Gate 最小化（阻塞点），80% 工作由子 Agent 自主完成，Gate 处为二元决策。

## 协作时序

```mermaid
sequenceDiagram
  autonumber
  participant U as 用户
  participant O as Orchestrator
  participant DS as Designer
  participant D as Developer
  participant T as Tester
  participant R as Reviewer

  U->>O: 描述需求 / 推进 ft-XXX
  O->>DS: 唤起 Designer
  DS->>DS: 需求澄清 + 探索代码库
  DS->>DS: 编写 feature.md + design.md
  DS->>R: 提交评审
  R-->>DS: Approved / Changes Requested

  alt 循环至 Approved
    DS->>R: 重新评审
  end

  DS-->>O: 设计完成
  O->>U: 提交设计方案审批 [Gate]
  alt 通过
    U-->>O: approve
    O->>O: 更新 state.md → Designed
  else 驳回
    O->>DS: 反馈修改意见
  end

  O->>O: 扫描 us-*/state.md
  par Tester 设计用例
    O->>T: 唤起 Tester
    T->>T: 编写 test-plan.md（P0/P1/P2）
    T->>D: 提交 P0 用例
  and Developer 编码
    O->>D: 唤起 Developer
    D->>D: 实现代码 + 单元测试
    D->>D: PR 开启 + PR CI 全绿
  end

  alt 设计偏差
    D->>R: 提交设计变更申请
    alt 小修
      R-->>D: 批准，更新 design.md 版本号
    else 大修（架构信号）
      R-->>O: 提交审批请求
      O->>U: 提交审批请求
      U-->>O: 批准
    end
  end

  D->>R: 请求代码评审
  R-->>D: Approved / Changes Requested

  alt 不通过
    D->>D: 修复 → 重新评审
  end

  D-->>O: 通知测试执行
  O->>T: 通知测试执行
  T->>T: 执行 P0 门禁

  alt P0 失败
    T->>D: 提交缺陷报告
    D->>D: 修复 → 重新评审 → 重新提测
  end

  T-->>O: P0 门禁通过
  O->>U: 提交 PR 验收请求 [Gate]
  O->>T: 继续执行 P1/P2

  T->>T: 更新 test-report.md（含 P0+P1+P2）

  alt 用户验收通过
    U-->>O: PR approve
    O->>O: 更新 state.md → Done
    O->>T: 合并到 main
    T->>T: 合并 + main CI 全绿
  else 验收驳回
    O->>D: 反馈问题
    D->>D: 修复 → 重新提测
  end
```

## 状态模型

采用两级状态模型：feature 级（设计阶段）+ US 级（交付阶段）。

### Feature 级状态机

```mermaid
stateDiagram-v2
  [*] --> Draft : 创建 Feature
  Draft --> Designed : 设计方案审批通过（用户 Gate）
  Designed --> [*] : US 子目录创建完成
```

### US 级状态机

```mermaid
stateDiagram-v2
  [*] --> Designed : feature 设计完成，US 就绪
  Designed --> Implementing : Developer 开始编码
  Implementing --> Testing : PR 开启 + PR CI 全绿
  Testing --> Verified : P0 全绿 + PR review 通过
  Verified --> Done : PR approve + main CI 全绿（用户 Gate）

  Testing --> Implementing : P0 失败 / Code Review 不通过
  Verified --> Implementing : 用户验收驳回 / P1/P2 发现严重问题
  Implementing --> Designed : 设计修正（大修）
  Designed --> Implementing : 修正后继续编码
```

**状态语义**：

| 状态 | 含义 | 进入条件 | 离开条件 |
|------|------|----------|---------|
| `Designed` | US 设计就绪，等待实现 | feature 设计完成，US 子目录创建 | Developer 开始编码 |
| `Implementing` | US 开发中 | Developer 开始写代码 | PR CI 全绿 |
| `Testing` | 代码完成，测试执行中 | PR CI 全绿 | P0 全过 + Reviewer 通过 |
| `Verified` | P0 全绿 + PR review 通过 | P0 全过 + Reviewer 通过 | PR approve + main CI 全绿 |
| `Done` | 用户验收通过 | main CI 全绿 | — |

**设计修正规则**（`Implementing → Designed → Implementing`）：

- **小修**（字段增减、接口参数调整）：Reviewer 直接批准，更新 `design.md` 版本号
- **大修**（系统边界、数据模型、外部依赖）：转设计方案审批 Gate
- **修正上限**：同一 feature 累计 ≥ 3 次大修，停止推进，escalate 给用户

**Feature 完成条件**：所有 US 均达到 `Done`。

## Gate 模型

| Gate | 触发时机 | 通过条件 |
|------|---------|---------|
| **设计方案审批** | Designer 提交 feature.md + design.md | 用户 approve |
| **验收通过** | P0 全绿 + PR review 通过 + PR CI 全绿 | PR approve |

**架构信号**（设计方案审批时一并审查）：OpenAPI 变更、data-model 变更、CI/CD 变更、新增外部依赖、跨越系统边界。

## 编排规则

用户说「推进 ft-XXX」时，Orchestrator 读取 feature/state.md，若为 `Designed` 则扫描所有 us-*/state.md，按优先级（`Designed → Implementing → Testing → Verified → Done`）选择可推进的 US 并唤起对应 Agent。完整执行表与异常处理规则见 [orchestrator.md](../../.claude/agents/prompts/orchestrator.md)。