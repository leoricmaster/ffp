---
type: feature
id: ft-001
epic: epic-001
title: 用户注册与家庭创建
priority: P0
owner: designer
created: 2026-06-04
---

# ft-001 用户注册与家庭创建

## 目标

新用户能在 60 秒内完成「邮箱+密码注册 → 默认家庭创建 → 登录」全流程，并能在刷新页面后自动恢复会话。

## 背景

FFP 的核心价值假设是"家庭愿意协作记录和分析财务数据"，ft-001 是该假设的入口——没有身份与家庭基础设施，后续 ft-002（记录支出）等功能无法运行。

本 ft 严格对齐 [scn-001 注册登录并录入首笔收入](../../architecture/scenarios/scn-001-first-time-setup.md) 的步骤 1~8（注册 + 登录 + 令牌分发）+ Alternative 路径的"刷新恢复会话"分支。

## 范围

### 包含

- 邮箱+密码注册（带隐私政策勾选）
- 注册时自动创建默认家庭 + 默认分类（INCOME/EXPENSE 预置）
- 邮箱+密码登录（含 rememberMe）
- accessToken / refreshToken 颁发 + Cookie 下发
- Refresh Token Rotation + family 重放检测
- 用户登出（撤销 refreshToken + 清除 Cookie）
- 页面刷新后通过 `/api/v1/auth/refresh` 静默恢复登录态
- 基础密码黑名单（Top 100k，ft 内必做）
- 三级限流（IP / 邮箱 / 账户）
- 审计日志（注册/登录/登出/刷新/重放 180 天保留）

### 不包含

- 邮箱验证（PENDING → ACTIVE 状态机简化，注册即 ACTIVE）
- 家庭成员邀请与多家庭切换
- 找回密码 / 修改密码
- 第三方登录（OAuth）
- 2FA / MFA
- 设备指纹 / 异地登录检测

## 用户角色

- **新用户**：未注册、首次访问
- **已登录用户**：已注册、未操作中

## User Stories

### US-001 用户注册

**As** 新用户，**I want** 用邮箱+密码注册账户，**so that** 我能开始使用 FFP 记录家庭财务。

**AC**：

- [ ] AC1 — 必填字段验证：注册请求必须包含 `email`、`password`、`privacyPolicyAccepted=true`，否则 400 MISSING_REQUIRED_FIELD（2026-06-04）
- [ ] AC2 — 邮箱格式 + 密码强度：email 必须符合 RFC 5322 且长度 5-100（400 INVALID_FORMAT）；password 长度 8-128 且不在 Top 100k 常见密码黑名单中（400 WEAK_PASSWORD）（2026-06-04）
- [ ] AC3 — 隐私政策强制勾选：privacyPolicyAccepted 必须为 `true`（不接受 `false` / `null` / 缺失），否则 400 INVALID_PRIVACY_CONSENT（2026-06-04）
- [ ] AC4 — 幂等性：5 分钟内同邮箱重复注册返回与首次完全相同的响应（userId/familyId/username 保持一致），不创建重复账户（2026-06-04）
- [ ] AC5 — 事务原子性：user + family + family_member + 默认分类（INCOME 6 条 + EXPENSE 8 条）必须在单个数据库事务（READ COMMITTED）中落库，任一失败整体回滚（2026-06-04）
- [ ] AC6 — username 派生 + 默认家庭：未传 username 时由 email 前缀生成（去 `@` 及其后内容，截断到 20 字符，清除非 `^[a-zA-Z0-9_]+$` 字符，重复追加 4 位随机后缀）；默认家庭字段为 name="我的家庭"、currency=CNY、timezone=Asia/Shanghai、language=zh-CN、status=active（2026-06-04）
- [ ] AC7 — 注册成功响应含 accessToken：响应 body 包含 `data.accessToken`（JWT，900s / 15min）与 `data.expiresIn=900`；同时 Set-Cookie 下发 refreshToken（httpOnly; Secure; SameSite=Lax; Path=/api/v1/auth; Max-Age=604800），前端可立即进入登录态，无需再走 `/login`（2026-06-04 v4 新增）

### US-002 用户登录

**As** 已注册用户，**I want** 用邮箱+密码登录，**so that** 我能恢复会话并访问家庭数据。

**AC**：

- [ ] AC1 — 凭据校验：email + password 验证通过后返回 accessToken + Set-Cookie refreshToken，accessToken 有效期 900s（15 分钟）（2026-06-04）
- [ ] AC2 — 凭据错误：邮箱不存在或密码错误统一返回 401 INVALID_CREDENTIALS（不暴露邮箱是否已注册）（2026-06-04）
- [ ] AC3 — 账户锁定：连续 5 次失败后锁定 15 分钟，期间返回 423 ACCOUNT_LOCKED；locked_until 通过 `error.details[]` 承载（`field=lockedUntil, value=ISO8601 时间戳`），前端据此展示「请于 X 时间后重试」（2026-06-04，v4 明确承载方式）
- [ ] AC4 — 锁定恢复：锁定到期后下一次登录请求正常处理（无论成功失败均重置 failed_login_count 为 0 或递增）（2026-06-04）
- [ ] AC5 — rememberMe：true 时 refreshToken Max-Age 仍为 604800（7 天），false 时行为一致（MVP 简化，行为对齐 B1-a 决策）（2026-06-04）
- [ ] AC6 — Set-Cookie 属性：refreshToken Cookie 标记 `httpOnly; Secure; SameSite=Lax; Path=/api/v1/auth; Max-Age=604800`，前端 JavaScript 不可读（2026-06-04）

### US-003 刷新令牌

**As** 已登录用户，**I want** 在 accessToken 过期后自动续期，**so that** 我不感知过期、无需重新登录。

**AC**：

- [ ] AC1 — 成功续期：携带有效 refreshToken 调用 `/api/v1/auth/refresh` 返回新 accessToken（900s）+ 新 refreshToken Set-Cookie；旧 refreshToken 立即失效（2026-06-04）
- [ ] AC2 — Refresh Token Rotation：新 refreshToken 通过 HKDF-SHA256 派生（输入：用户主密钥 + token_family_id），与旧 token 共享 family_id；DB 中旧 token 标记 revoked_at（2026-06-04）
- [ ] AC3 — 重放检测：已撤销的 refreshToken 再次出现时撤销整个 token family（所有未到期 token）+ 写 ALERT 级审计日志 + 401 TOKEN_REUSED，强制重新登录（2026-06-04）
- [ ] AC4 — 过期拒绝：refreshToken 超过 7 天有效期 → 401 TOKEN_EXPIRED，前端跳 `/login`（2026-06-04）
- [ ] AC5 — 不存在拒绝：DB 中找不到对应 token_hash → 401 INVALID_TOKEN（区分于过期与重放，便于排查）（2026-06-04）
- [ ] AC6 — 限流：同一 refreshToken 每小时最多 10 次刷新，超出返回 429 RATE_LIMIT_EXCEEDED（2026-06-04）

### US-004 用户登出

**As** 已登录用户，**I want** 主动登出账户，**so that** 我的会话在他处不可用。

**AC**：

- [ ] AC1 — 撤销 refreshToken：DB 中对应 refreshToken 记录设置 revoked_at=NOW()、revoked_reason=USER_LOGOUT；返回 200（2026-06-04）
- [ ] AC2 — 清除 Cookie：响应 Set-Cookie 头中 refreshToken 标记 `Max-Age=0`，浏览器立即删除（2026-06-04）
- [ ] AC3 — 重放检测：登出后使用该 refreshToken 调用 `/api/v1/auth/refresh` 必须返回 401 TOKEN_REUSED（验证撤销已生效）（2026-06-04）
- [ ] AC4 — accessToken 不可再访问受保护资源：登出后前端从内存清除 accessToken；若仍持有（如其他标签页），后端对已撤销 refreshToken 关联的 accessToken 同样拒绝（2026-06-04）
- [ ] AC5 — 兜底清理：即使 `/api/v1/auth/logout` 调用失败（401/网络错误），前端必须清理内存中的 accessToken 与浏览器中的 refreshToken Cookie（兜底）（2026-06-04）
- [ ] AC6 — 审计：登出动作写入 AuditLog（event_type=LOGOUT, event_status=SUCCESS/FAIL），不记录 token 明文（2026-06-04）

## 需求变更记录

| 日期 | 版本 | 变更 | 原因 | 确认 |
|------|------|------|------|------|
| 2026-06-04 | v2 → v3 | 恢复 `username` 为可选（邮箱前缀派生） | v2 把 username 改为必填导致注册门槛提升，与 B4-b 用户决策冲突 | 用户确认 |
| 2026-06-04 | v2 → v3 | 保留 `rememberMe` 字段 | v2 评估为多余，实际 MVP 简化为不影响行为，保留以便后续差异化 | 用户确认 |
| 2026-06-04 | v2 → v3 | OpenAPI `RegisterRequest` 必填 `privacyPolicyAccepted` | scn-001 Privacy & Compliance 明确要求"未勾选无法提交"，v2 误登记为 TD-A | ft 内必做 |
| 2026-06-04 | v2 → v3 | OpenAPI 错误码补 `WEAK_PASSWORD` / `INVALID_PRIVACY_CONSENT` / `RATE_LIMIT_EXCEEDED` / `TOKEN_REUSED` / `EMAIL_ALREADY_EXISTS` | v2 误登记为 TD-B | ft 内必做 |
| 2026-06-04 | v2 → v3 | `expiresIn` 默认值 3600 → 900（15 分钟） | scn-001 明确"有效期 15 分钟"，v2 与 scn-001 不一致 | ft 内必做 |
| 2026-06-04 | v2 → v3 | `LogoutRequest` / `RefreshTokenRequest` 不再要求 body 中传 refreshToken | scn-001 明确 refreshToken 从 httpOnly Cookie 读取，v2 body 仍必填与描述矛盾 | ft 内必做 |
| 2026-06-04 | v2 → v3 | data-model `User.password_hash` 字段说明由 bcrypt 改为 Argon2id | B1-a 用户决策 | ft 内必做 |
| 2026-06-04 | v2 → v3 | data-model 新增 `RefreshToken` / `AuditLog` 实体 | scn-001 隐含需求，v2 缺失会导致 schema 设计与 API 契约脱节 | ft 内必做 |
| 2026-06-04 | v2 → v3 | data-model `User` 新增 `privacy_policy_accepted_at` / `failed_login_count` / `locked_until` | US-001/002 直接依赖的字段 | ft 内必做 |
| 2026-06-04 | v3 → v4 | OpenAPI `AuthResponse.data` 必填新增 `accessToken` + `expiresIn` 字段 | v3 复评 CONCERN-V3-01：scn-001 步骤 7 + design §4.1 序列图均要求注册成功响应同时下发 accessToken，v3 OpenAPI 缺字段是"已知不一致"尾巴 | ft 内必做 |
| 2026-06-04 | v3 → v4 | US-001 增 AC7 — 注册成功响应含 `data.accessToken`（900s）+ Set-Cookie refreshToken（7d），前端可立即进入登录态 | v3 复评 CONCERN-V3-01 | ft 内必做 |
| 2026-06-04 | v3 → v4 | design §4.1 序列图末尾"201 AuthResponse"备注含 `data.accessToken + data.expiresIn=900` | v3 复评 CONCERN-V3-01 | ft 内必做 |
| 2026-06-04 | v3 → v4 | design §11.1 / §5.6 `ALLOWED_ORIGINS` 启动 fail-fast 校验（与 `JWT_SECRET` 同级） | v3 复评 CONCERN-V3-02：避免运行时因 env 缺失/误设 `*` 产生"接口全失败"或安全裸奔 | ft 内必做 |
| 2026-06-04 | v3 → v4 | OpenAPI `/auth/login` 423 + design §5.3 + US-002 AC3 明确 `locked_until` 通过 `error.details[]` 承载（`field=lockedUntil, value=ISO8601`） | v3 复评 SUGGESTION-V3-04：消除 Developer 实现的 3 种歧义 | ft 内必做 |
| 2026-06-04 | v3 → v4 | design §5.5 隐私合规追加 1 行 EMAIL_ALREADY_EXISTS 已知 trade-off 备注 | v3 复评 SUGGESTION-V3-01：MVP 主动接受 trade-off，待邮箱验证 epic 统一为均匀响应 | 不处理（文档化） |
| 2026-06-04 | v3 → v4 | design §1.2 关键设计决策追加 AuthForm MVP 隐藏 rememberMe 复选框 | v3 复评 SUGGESTION-V3-02：避免"勾选/不勾选无差别"的 UX 信任偏差 | 不处理（文档化） |
| 2026-06-04 | v3 → v4 | 登记 `td-007-scn-001-maintenance`（合并 V3-03 Cookie Path + V3-04 related-features） | v3 复评 CONCERN-V3-03/04：scn-001 文档维护类，单点修订 | ft 外延后 |

## 设计概要（详见 design.md）

- **后端分层**：Controller（Zod 校验 + HTTP 错误映射）+ Service（业务规则 + 事务控制）
- **认证实现**：JWT 签名 accessToken（HS256，15min）；DB 存 refreshToken SHA-256 哈希；HKDF-SHA256 派生
- **密码哈希**：Argon2id（m=19MiB, t=2, p=1, salt≥16B），per-user 随机 salt，hash 含完整参数
- **密码黑名单**：基础实现（不引入 Bloom filter），ft 内必做
- **限流中间件**：基于 `express-rate-limit`，in-memory store（MVP）
- **Cookie 策略**：refreshToken Cookie `httpOnly; Secure; SameSite=Lax; Path=/api/v1/auth`
- **审计日志**：append-only 表，180 天后由定时 job 物理删除（job 本身为 ft 外延后）
- **前端状态**：accessToken 存 Zustand 内存（**不** 存 localStorage），refreshToken 由浏览器自动管理
- **可观测性**：注册/登录/刷新 P99 延迟、4xx/5xx 比例、限流触发次数、refresh 失败率

## 关联 Scenario

- [scn-001 注册登录并录入首笔收入](../../architecture/scenarios/scn-001-first-time-setup.md)（步骤 1~8 + 步骤 8 后"刷新恢复会话"分支）

## 与现有功能的关系

- **类型**：独立（无既有认证功能可复用）
- **依赖组件**：无（项目尚无后端/前端代码）
- **依赖 API**：无
- **依赖数据模型**：本 ft 落地的 `User` / `Family` / `FamilyMember` / `RefreshToken` / `AuditLog` 是 ft-002（记录支出）等后续 feature 的前置依赖
- **影响范围**：注册流程涉及隐私政策 URL，文档站需提供 `/legal/privacy` 与 `/legal/terms` 静态页面（独立 TD-001）
- **架构信号**：本 ft 涉及 OpenAPI 新增 2 个端点（已在 v3 直接落地）、data-model 新增 2 个表 + 3 个字段（已在 v3 直接落地），均为 T3 变更。Designer 已直接修订上游文档，无需额外触发架构审批 Gate（按 ft 完整性原则处理）

## Storybook 声明

has_storybook: yes

本 ft 引入新可复用组件：

```markdown
## Storybook 声明
has_storybook: yes
stories:
  - Default       # 注册/登录表单初始空状态
  - WithValue     # 表单已填写
  - Loading       # 提交中（按钮 loading + 禁用）
  - WithErrors    # 字段级错误（如密码强度不通过）
  - Empty         # 无（auth 表单不涉及列表空态）
```

- `AuthForm`（复用，register/login 共享布局 + 字段级错误展示）
- `PasswordStrength`（纯展示，5 段强度条）
- `PrivacyConsentCheckbox`（带链接的勾选框，未勾选阻止提交）

---

## 备注

### v3 与 v2 的核心差异

| 维度 | v2 做法 | v3 做法 | 改进点 |
|------|---------|---------|--------|
| OpenAPI 契约 | 9 项 TD 延后 | 直接修订（privacyPolicyAccepted / 错误码 / expiresIn / logout/refresh 契约） | 消除"已知不一致"尾巴 |
| 密码哈希 | bcrypt（与 data-model 一致） | Argon2id（与 B1-a 一致） | 与 scn-001 + 用户决策对齐 |
| 密码黑名单 | TD-I 延后 | ft 内必做（基础实现） | 不做则安全基线不达标 |
| TD 数量 | 9 项 | 仅 ft 外延后（ADR/Redis/OTel/审计 job） | ft 内部不一致项 = 0 |
