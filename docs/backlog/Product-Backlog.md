# Product Backlog

本文档是项目的全局产品 Backlog，维护 Themes / Epics / Features 三级索引。

> ID 命名与生命周期规则见 [ADR-003](../decisions/ADR-003-naming-convention.md)。
> **核心规则**：所有层级 ID（TH / Epic / Feature / US / UC）一经分配永不复用，被废弃的标记 `(retired)` 留 tombstone。

---

## Themes 注册表

Theme 是业务领域的最高聚合层，多个 Epic 围绕同一 Theme 共同推进某项产品能力。

| ID | 主题 | 描述 | 关联 Epic |
|----|------|------|-----------|
| TH-01 | 财务记录管理 | 收入 / 支出 / 资产 / 负债的记录与展示 | epic-001, epic-004, epic-005, epic-006 |
| TH-02 | 认证与家庭权限 | 用户身份、会话、家庭成员权限管理 | epic-002, epic-010 |
| TH-03 | 分类体系 | 收入 / 支出 / 资产 / 负债的分类配置 | epic-003 |
| TH-04 | 数据分析与可视化 | 财务数据分析、仪表盘、报表 | epic-007, epic-011 |
| TH-05 | 财务规划 | 预算设置、资金分配、目标追踪 | epic-008 |
| TH-06 | 智能助手 | AI 辅助记录、分析、建议 | epic-009 |

> 新增 / 废弃 Theme 时同步更新本表。废弃 Theme 用 `(retired)` 标记保留行，不删除。

---

## Backlog 索引

```text
# 按 Theme → Epic → Feature 层级展开
```

> `📋 future` = 已确认方向，尚未创建 epic 目录；`📋 planned` = 已规划待启动；`✅ completed` = 已完成；`📋 active` = 有 Feature 已规划或进行中

---

## Epic 列表

| ID | 名称 | 状态 | 所属主题 | 最后更新 |
|----|------|------|----------|----------|

---

## Feature 列表

| ID | 名称 | 状态 | 所属 Epic | 最后更新 |
|----|------|------|-----------|----------|

---

## 变更日志

| 日期 | 变更内容 | 操作人 |
|------|----------|--------|
