# 多智能体研发流程

本文档是研发流程的**入口**。Feature、Tech Debt、Defect 三类工作共享一套通用规范（设计原则、Agent 定义、工件体系、协调机制），但执行流程各有侧重。

---

## 流程速查

| 工作类型 | 触发条件 | 涉及角色 | 关键 Gate | 流程文档 |
|---------|---------|---------|----------|---------|
| **Feature** | Product Backlog 选中 | Designer / Developer / Tester / Reviewer | 设计方案审批、用户验收 | [`feature-flow.md`](./feature-flow.md) |
| **Tech Debt** | 代码扫描 / 人工识别 | Developer / Reviewer | 建立（用户排期）、关闭 | [`tech-debt-flow.md`](./tech-debt-flow.md) |
| **Defect** | 测试发现 / 生产事件 | Tester / Developer / Reviewer | 定级（P0 立即 / P1P2 排队） | [`defect-flow.md`](./defect-flow.md) |

三类流程的差异一览：

| 维度 | Feature | Tech Debt | Defect |
|------|---------|-----------|--------|
| 需要 Designer？ | 是（完整设计） | 否 | 否 |
| 需要 Tester？ | 是（P0/P1/P2） | 否（收尾扫描） | 是（验证修复） |
| 设计方案审批 Gate | 有 | 无 | 无 |
| 状态机复杂度 | 6 状态 + 多循环 | 3 状态 | 5 状态 + 终结态 |
| 产出 feature.md/design.md | 是 | 否 | 否 |

---

## 变更记录

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2026-05-24 | — | 将 monolithic 流程文档拆分为 `feature-flow.md`、`tech-debt-flow.md`、`defect-flow.md`、`common.md`，`README.md` 重写为入口导航 |
| 2026-06-01 | — | 删除 `common.md`，其内容已分散到各自流程文档和 Skill 定义中 |
