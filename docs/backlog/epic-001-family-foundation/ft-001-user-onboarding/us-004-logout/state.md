---
type: state
level: us
epic: epic-001
feature: ft-001
us: us-004
current: Designed
history:
  - { timestamp: "2026-06-04T03:30:00Z", from: "*", to: Designed, reason: "v3 设计完成：4 US / 24 AC，由 Designer 写入" }
blockers: []
---

# US-004 用户登出

详细 AC 见 [feature.md §US-004](../../feature.md#us-004-用户登出)。
设计详设见 [design.md §3 数据模型（RefreshToken.revoked_reason）](../../design.md#3-数据模型变更)。

**关键设计要点**：

- DB 撤销 refreshToken：revoked_at=NOW()、revoked_reason=USER_LOGOUT
- 响应 Set-Cookie：Max-Age=0 立即清除浏览器 Cookie
- 兜底清理：即使 logout API 失败，前端必须清空 Zustand + 删除 Cookie
- 登出后该 token 调用 refresh 必须返回 401 TOKEN_REUSED（验证撤销已生效）
- 审计：LOGOUT 事件写入 AuditLog（SUCCESS/FAIL），不记录 token 明文
- 不限流（已认证；MVP 暂不限制登出频次）
