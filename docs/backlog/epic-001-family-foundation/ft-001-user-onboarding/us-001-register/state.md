---
type: state
level: us
epic: epic-001
feature: ft-001
us: us-001
current: Implementing
history:
  - { timestamp: "2026-06-04T03:30:00Z", from: "*", to: Designed, reason: "v3 设计完成：4 US / 24 AC，由 Designer 写入" }
  - { timestamp: "2026-06-04T05:00:00Z", from: Designed, to: Implementing, reason: "用户审批通过 ft-001 设计方案；Orchestrator 唤起 Developer" }
blockers: []
test_status.p0: N/A
test_status.p1: N/A
test_status.p2: N/A
ci_status.pr_checks: N/A
ci_status.main_checks: N/A
---

# US-001 用户注册

详细 AC 见 [feature.md §US-001](../../feature.md#us-001-用户注册)。
设计详设见 [design.md §4.1](../../design.md#41-注册流程)。

**关键设计要点**：

- 事务原子性（READ COMMITTED）：user + family + family_member + 14 条默认分类一次落库
- 5 分钟幂等键（缓存层 / DB unique 约束双保险）
- Argon2id 哈希（m=19MiB, t=2, p=1, salt≥16B）
- Top 100k 密码黑名单（ft 内必做，基础 Set<string> 实现）
- privacyPolicyAccepted 必须为 true（false / null / 缺失 → 400）
- username 派生规则：email 前缀去 `@`、截断 20、清洗非法字符、冲突追加 4 位随机后缀
