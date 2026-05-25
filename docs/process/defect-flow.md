# Defect 修复流程

## 1.1 协作时序

```mermaid
sequenceDiagram
  autonumber
  participant U as 用户
  participant T as Tester
  participant D as Developer
  participant R as Reviewer

  alt 外环 Bug（生产环境/跨 Feature）
    T->>U: 提交缺陷报告（GitHub Issue）
    U->>U: 定级 + 指派 [Gate: 建立/定级]
    alt P0 缺陷
      U->>D: 立即触发 [state: New → InProgress]
    else P1/P2 缺陷
      Note over U,D: 等待用户触发 [state: New → Backlog]
    end
  else 内环 Bug（Feature 开发中）
    T->>D: 直接在 PR 内报告
    D->>D: 修复
    T->>T: 回归验证
  end

  D->>D: 编写修复代码 + 单元测试
  D->>D: PR 开启
  D->>D: 等待 PR CI 全绿
  D->>R: 请求代码评审（外环）
  R-->>D: 评审通过
  D->>T: 重新提测（外环）
  T->>T: 验证修复
  T-->>D: 缺陷关闭
  T->>T: 判断是否为 Feature 测试遗漏，补充至对应 test-plan.md
  D->>D: PR 合并 [state: InProgress → Done]
  D->>D: 等待 main CI 全绿
```

## 1.2 状态机

```mermaid
stateDiagram-v2
  [*] --> New : 发现缺陷
  New --> Backlog : P1/P2 定级
  New --> InProgress : P0 立即处理
  Backlog --> InProgress : 用户触发修复
  InProgress --> Done : PR 合并 + 验证通过
  Done --> [*]

  New --> Duplicate : 重复缺陷
  New --> Won'tFix : 不修复
```

## 1.3 Gate

| Gate | 触发时机 | 状态影响 | 说明 |
|------|---------|---------|------|
| **建立/定级** | 发现缺陷 | `New → Backlog` 或 `New → InProgress` | P0 立即处理，P1/P2 进 Backlog |
| **关闭** | PR 合并 + 验证通过 | `InProgress → Done` | — |

**缺陷根因分析（外环缺陷）**：

外环缺陷关闭前，执行者必须填写轻量级根因分析，写入 GitHub Issue comment：

- **测试遗漏**：测试用例未覆盖该场景 → 补充对应 `test-plan.md` 用例
- **设计遗漏**：`design.md` 未考虑该边界 → 更新设计文档并反思拆分粒度
- **实现偏差**：Developer 理解设计与实现不符 → 检查编码输入是否充分
- **环境差异**：本地/CI 与生产环境行为不一致 → 检查 CI 仿真度
- **回归失效**：修改引入新缺陷，现有测试未拦截 → 检查测试层级覆盖
