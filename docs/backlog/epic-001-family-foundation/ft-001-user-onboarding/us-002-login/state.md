---
type: state
level: us
epic: epic-001
feature: ft-001
us: us-002
current: Designed
history:
  - { timestamp: "2026-06-04T03:30:00Z", from: "*", to: Designed, reason: "v3 设计完成：4 US / 24 AC，由 Designer 写入" }
blockers: []
---

# US-002 用户登录

详细 AC 见 [feature.md §US-002](../../feature.md#us-002-用户登录)。
设计详设见 [design.md §3 数据模型（User.failed_login_count / User.locked_until）](../../design.md#3-数据模型变更)。

**关键设计要点**：

- 凭据错误统一返回 401 INVALID_CREDENTIALS（不暴露邮箱是否已注册）
- 连续 5 次失败 → 423 ACCOUNT_LOCKED，locked_until = NOW() + 15min
- 锁定到期后下次请求正常处理
- rememberMe=true 与 false 行为对齐（MVP 简化，B1-a 决策）
- Set-Cookie 属性：`httpOnly; Secure; SameSite=Lax; Path=/api/v1/auth; Max-Age=604800`
- 限流：IP 60/h（express-rate-limit）+ 账户级失败计数（DB 字段）
