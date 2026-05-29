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

## 通用规范索引

以下规范被三类流程共享，集中定义在 [`common.md`](./common.md)：

| 主题 | 说明 | 位置 |
|------|------|------|
| 设计原则与元规范 | 关注点分离、最小人类介入、状态外化、轻量优先 | [`common.md` §1](./common.md#1-设计原则与元规范) |
| 文档与工件体系 | 全局 evergreen 工件、Feature 快照、目录结构 | [`common.md` §2](./common.md#2-文档与工件体系) |
| 核心智能体定义 | Designer / Developer / Tester / Reviewer 职责与触发时机 | [`common.md` §3](./common.md#3-核心智能体定义) |
| Sub-agent 协调机制 | 共享 Board、state.md 规范、Agent 更新规则 | [`common.md` §4](./common.md#4-sub-agent-协调机制) |
| 技能体系（Skill） | 判定标准、维护规范、现有 Skill 列表 | [`common.md` §5](./common.md#5-技能体系skill) |
| 参考资源 | 按读者分类的文档导航 | [`common.md` §6](./common.md#6-参考资源) |
| **L2 硬约束** | 所有 Agent 共享的最小流程规则 | [`l2-constraints.md`](./l2-constraints.md) |
| **state.md Schema** | YAML frontmatter 标准、两级状态模型 | [`state-schema.md`](./state-schema.md) |
| **编排完成信号** | `.last-action-summary.md` 格式标准 | [`orchestration-interface.md`](./orchestration-interface.md) |
| **ID 分配** | ft/td/bg ID 分配脚本使用说明 | [`id-allocation.md`](./id-allocation.md) |

---

## 变更记录

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2026-05-24 | — | 将 monolithic 流程文档拆分为 `feature-flow.md`、`tech-debt-flow.md`、`defect-flow.md`、`common.md`，`README.md` 重写为入口导航 |
