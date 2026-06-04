---
type: state
level: us
epic: epic-001
feature: ft-001
us: us-003
current: Designed
history:
  - { timestamp: "2026-06-04T03:30:00Z", from: "*", to: Designed, reason: "v3 设计完成：4 US / 24 AC，由 Designer 写入" }
blockers: []
---

# US-003 刷新令牌

详细 AC 见 [feature.md §US-003](../../feature.md#us-003-刷新令牌)。
设计详设见 [design.md §4.2 刷新令牌（Rotation + 重放检测）](../../design.md#42-刷新令牌rotation--重放检测) + [§4.3 页面刷新恢复会话](../../design.md#43-页面刷新恢复会话)。

**关键设计要点**：

- Refresh Token Rotation：每次刷新颁发新 token，DB 撤销旧 token
- HKDF-SHA256 派生：DB 存 token_hash = HKDF(JWT_SECRET, token_family_id, info=base64url(token))
- Family 重放检测：已撤销 token 再次出现 → 撤销整个 family + 写 ALERT 审计 + 401 TOKEN_REUSED
- 区分错误码：TOKEN_EXPIRED（过期）/ INVALID_TOKEN（不存在）/ TOKEN_REUSED（重放）
- 限流：同 token_hash 每小时 ≤ 10 次
- 前端 useSilentRefresh hook：应用启动时静默调用，恢复登录态
