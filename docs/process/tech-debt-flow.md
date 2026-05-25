# Tech Debt 清理流程

## 1.1 协作时序

```mermaid
sequenceDiagram
  autonumber
  participant U as 用户
  participant D as Developer
  participant R as Reviewer

  U->>D: 提出 tech-debt item [Gate: 建立]
  D->>D: 分析影响，更新 tech-debt.md
  D->>U: 提交候选（用户决定排期）

  Note over U,D: 等待用户触发

  U->>D: 启动清理 [state: Backlog → InProgress]
  D->>D: 分析影响范围，声明回归测试范围
  D->>D: 重构代码 + 单元测试 + 回归测试
  D->>D: PR 开启（描述含影响面 + 回归测试范围）
  D->>D: 等待 PR CI 全绿
  D->>R: 请求代码评审
  R-->>D: 评审通过（确认回归测试充分）
  D->>D: PR 合并 [state: InProgress → Done]
  D->>D: 等待 main CI 全绿
  D->>U: 通知完成
```

## 1.2 状态机

```mermaid
stateDiagram-v2
  [*] --> Backlog : 识别债务
  Backlog --> InProgress : 用户触发清理
  InProgress --> Done : PR 合并
  Done --> [*]
```

## 1.3 Gate

| Gate | 触发时机 | 状态影响 | 说明 |
|------|---------|---------|------|
| **建立** | Tech Debt 登记，提供影响面和修复成本评估 | — | 用户确认是否纳入 Backlog |
| **关闭** | PR 合并后 | `InProgress → Done` | 用户确认完成（可选，可自动化） |

Tech Debt 清理不需要设计方案审批，直接走 PR 流程。

## 1.4 检测规则

Tester 在 Done 收尾仪式扫描以下信号，登记新债务到 GitHub Issues：

**代码层面**

- `TODO` / `FIXME` / `HACK` / `XXX` 注释
- 过长函数（> 100 行）或文件（> 500 行）
- 重复代码（可抽取为公共函数）
- 硬编码的配置值

**架构层面**

- OpenAPI 与实现不一致
- Schema 约束缺失或不一致
- 错误处理不统一

**测试层面**

- 覆盖率低于 70% 的模块
- 长期存在的 FAILED 集成测试
