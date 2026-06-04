---
type: architecture-review
feature_id: ft-001-user-onboarding
reviewer: reviewer
review_date: 2026-06-04
change_level: T3
conclusion: Approved
---

# Architecture Review: ft-001 用户注册与家庭创建

## 评审历史

| 版本 | 日期 | 结论 | 主要问题 |
|------|------|------|----------|
| v1 | 2026-06-04 | Changes Requested | scn-001 系统性冲突（B1）、OpenAPI 偏差（B4）、JWT/HKDF/CORS/可观测性等基线缺失（B5-B8） |
| v2 | 2026-06-04 | Changes Requested | 9 项 TD 中含「ft 内必做」误分类；username 强制必填违反 B4-b；多项契约不一致 |
| v3 | 2026-06-04 | **Changes Requested** | OpenAPI `AuthResponse` 缺 accessToken/expiresIn；CORS 启动 fail-fast 表述不完整；scn-001 Cookie Path 等遗留不一致（详见下） |
| v4 | 2026-06-04 | **Approved** | 4 项必做（V3-01/02 + SUG-V3-03/04）+ 3 项可选（V3-01/02 + CONCERN-V3-03/04 → td-007）全部落实；ft 内部不一致项 = 0；7 条 TD 全部「ft 外延后」 |

> v1/v2 评审过程未独立成文（结论与用户决策 B1-a、B4-b 已沉淀至 v3 设计中）。本文件以 v3 复评为主体，按新流程规范（feature-design `ft 完整性原则` + design-review 第 6 维度 minor 三段式）评估。

---

## v3 评审范围

- `feature.md`（v3）— 4 US / 24 AC + 需求变更记录
- `design.md`（v3）— 11 节设计详设
- `docs/api/openapi.yaml`（v3 已修订）— `RegisterRequest` / `AuthResponse` / `LoginResponse` / `LogoutRequest` / `RefreshTokenRequest` / `ErrorResponse` 等 schema
- `docs/data/data-model.md`（v3 已修订）— `User` / `Family` / `FamilyMember` / `RefreshToken` / `AuditLog` 等实体
- `docs/architecture/scenarios/scn-001-first-time-setup.md`（未修订）
- Designer v3 `.last-action-summary.md` 自检结论

变更分级判定：**T3**（OpenAPI 新增 2 个端点、ErrorResponse 枚举大量补全、data-model 新增 2 个实体 + User 3 字段）。完整逐项评审。

---

## A. v3 流程规范合规性核查

| 检查项 | 结果 | 备注 |
|--------|------|------|
| ft 完整性：v2 的 9 项 TD 是否减到 5-7 项内且全为「ft 外延后」 | ✅ | 6 项（td-001 ~ td-006），全部「ft 外延后」并标注分类理由 |
| TD 分类：每条 TD 是否给出分类理由 | ✅ | 详见 `.last-action-summary.md`「Tech Debt 登记」 |
| OpenAPI / data-model / scenario 三者一致 | ⚠️ | 仍有 1 项 ft 内必做不一致（`AuthResponse` 缺 token）+ 2 项 scn-001 遗留不一致 |
| 不留下「已知不一致」尾巴 | ❌ | `AuthResponse` 缺 accessToken/expiresIn 是 ft 内必做不一致，违反"消除已知不一致"原则 |
| 「ft 内必做」类是否合并入本 ft | ⚠️ | 7 项已合并；但 `AuthResponse` token 字段、CORS 启动 fail-fast 这 2 项仍待 v3 内补齐 |
| 是否存在 Designer 把 ft 内必做误登记为 TD | ✅ | 6 条 TD 均为合理的 ft 外延后 |

**A 部分小结**：v3 在结构上已基本合规（TD 数量降下、分类合理、绝大多数 ft 内必做项已合并），但 v3 设计内部仍存在「AuthResponse 缺 token」「CORS fail-fast 不完整」两处 ft 内必做不一致，未被 Designer 自检捕获，需打回。

---

## B. v1/v2 评审问题是否真的解决

| 问题 | v3 解决情况 | 评估 |
|------|------------|------|
| B1 — scn-001 系统性冲突 | ✅ 已按 B1-a 全面对齐（Argon2id / Top 100k 黑名单 / privacy 必填 / refreshToken httpOnly Cookie / Rotation + 重放检测 / 180d 审计） | 通过 |
| B2/B3/C1 — 必填字段初始化 | ✅ design §3 / §6 / §4.1 序列图完整列出 user/family/family_member/14 条默认分类 | 通过 |
| B4 — OpenAPI 偏差 | ✅ 已直接修订 openapi.yaml（privacyPolicyAccepted / 5 个错误码 / expiresIn=900 / logout & refresh body 改空） | 通过 |
| B5 — JWT Secret / HKDF | ✅ design §5.2 明确 JWT_SECRET ≥ 256 bit 启动校验；HKDF-SHA256 输入 = JWT_SECRET + token_family_id | 通过 |
| B6 — CORS 启动 fail-fast | ⚠️ §11.1 ALLOWED_ORIGINS 标"是"（必填）但**未明确"启动时校验"**（JWT_SECRET 已写明），形成不对称 | **部分通过，需补全** |
| B7 — 前端 token 存储 | ✅ design §1.2 + §5.2 + Zustand 仅内存 + httpOnly Cookie 由浏览器管理；新增 useSilentRefresh hook 处理刷新恢复 | 通过 |
| B8 — 可观测性 + 回滚 | ✅ design §7（业务/技术指标 + 告警规则）+ §8（部署/数据/前端回滚 + 双验过渡期） | 通过 |

**B 部分小结**：B1-B5、B7-B8 均完整解决，**B6 仅部分解决**（环境变量必填已声明，但缺"启动校验"措辞，与 JWT_SECRET 不对称）。

---

## C. v3 新发现（minor 项三段式）

### [CONCERN-V3-01] `AuthResponse` 缺 accessToken / expiresIn 字段

- **业务影响**：scn-001 步骤 7 明确"`200 {accessToken} + Set-Cookie refreshToken`"，design.md §4.1 序列图也显示注册成功时 API 签发 accessToken 并写 Zustand，但当前 `openapi.yaml` 的 `AuthResponse.data` 仅 `userId/username/email/familyId`，**无 accessToken / expiresIn**。Developer 接此契约会陷入二义性：(a) 实现成"注册仅返回身份信息，需用户再走 /login"——则前端流程多一次跳转，违反 scn-001 60s 闭环且与 design 序列图冲突；(b) 实现成"注册返回 token"——则后端必须在 OpenAPI 之外加字段，破坏契约-代码一致性。这是典型的"已知不一致"尾巴。
- **处理成本**：≤ 30 分钟（OpenAPI `AuthResponse.data` 增 `accessToken` + `expiresIn` 字段 + 必填项；feature.md US-001 AC 增"AC7 — 注册成功响应包含 accessToken（900s）+ Set-Cookie refreshToken（7d）"；design.md §4.1 序列图末尾"AuthResponse"明确含 accessToken）。
- **推荐处置**：
  - [x] **ft 内必做**（与本 ft 决策直接相关，不做会破坏 ft 内部一致性 + 与 scn-001 冲突）
  - [ ] ft 外延后
  - [ ] 不处理
- **结论**：**ft 内必做**——Designer 应在 OpenAPI / feature.md / design.md 三处同步修正，并在自检"OpenAPI / data-model / scenario 三者完全一致"项重新核实。

---

### [CONCERN-V3-02] CORS / 关键环境变量"启动 fail-fast"措辞不完整

- **业务影响**：B6 在 v1/v2 已识别，v3 §11.1 把 `ALLOWED_ORIGINS` 标为"是"（必填），但**未写"启动时校验"**——与同表 `JWT_SECRET` 的"启动时校验"措辞形成不对称。若 Developer 据此实现"仅声明 env，运行时按需读取"，则在 ALLOWED_ORIGINS 缺失/空值时会出现以下两类隐患：(1) 默认 `origin: undefined` → 浏览器拒绝所有跨域请求，故障表现为前端"接口全部失败"，难定位；(2) 误设 `origin: '*'` → 安全基线裸奔。v3 §5.6 仅写"MVP 用 cors({ origin: env.ALLOWED_ORIGINS })"，未声明启动校验逻辑。
- **处理成本**：≤ 15 分钟（§11.1 在 ALLOWED_ORIGINS 行追加"启动时校验非空 + 形如 `https?://host[:port]` 列表"；§5.6 在 CORS 行末尾追加"启动时 env 加载阶段校验 ALLOWED_ORIGINS 必须非空，否则进程退出"）。
- **推荐处置**：
  - [x] **ft 内必做**（属本 ft 安全基线项，与 JWT_SECRET 同级，1 行声明即可消除不对称）
  - [ ] ft 外延后
  - [ ] 不处理
- **结论**：**ft 内必做**——保持与 JWT_SECRET 同级别的严格表述，避免 Developer 实现遗漏。

---

### [CONCERN-V3-03] scn-001 Cookie Path 与 design / openapi / feature 不一致

- **业务影响**：scn-001 §Business rules 写明 refreshToken Cookie `Path=/api/v1/auth/refresh`；但 design.md §5.2、feature.md US-002 AC6、openapi.yaml `/auth/login` description 全部使用 `Path=/api/v1/auth`。**design 用的 `/api/v1/auth` 才是技术上正确的**——若 Cookie Path 限定到 `/api/v1/auth/refresh`，则 `/api/v1/auth/logout` 请求不会自动携带 refreshToken，违反 US-004 AC1 的"DB 中对应 refreshToken 记录设置 revoked_at=NOW()"前提（后端读不到 cookie，无法定位记录）。Designer 在 design §9 声称"未修改 scn-001 任何字段"，但实际产生了未标注的事实偏差。
- **处理成本**：5 分钟修订 scn-001 一处字段；或在 design §9 显式列出"scn-001 Cookie Path 修正：/api/v1/auth/refresh → /api/v1/auth（覆盖 logout）"作为已知偏差。
- **推荐处置**：
  - [ ] ft 内必做
  - [x] **ft 外延后**（scn-001 是 evergreen 文档，跨多个 ft 引用，修订属于 scenario 维护类）
  - [ ] 不处理
- **结论**：**ft 外延后**——建议 TD 草案 `td-007-scn-001-cookie-path-correction`（scenario 文档维护类，与 td-006 同性质）。或由 Designer 在 design §9 显式补一行"scn-001 Cookie Path 与本 ft 偏差说明"也可接受。

---

### [CONCERN-V3-04] scn-001 `related-features` 引用过时

- **业务影响**：scn-001 frontmatter 写 `related-features: [ft-003-auth, ft-001-create]`，文末"关联 Features"段也写"ft-003-auth、ft-001-create"。而当前 epic-001 内的 feature 实际是 `ft-001-user-onboarding`，未来记录支出会是 `ft-002`。引用过时会导致后续 feature 检索 / scenario→feature 反向追溯失效，影响维护性，但不直接影响 ft-001 上线。
- **处理成本**：≤ 10 分钟（scn-001 frontmatter + "关联 Features"段同步更新到 `ft-001-user-onboarding` + `ft-002-*`）。
- **推荐处置**：
  - [ ] ft 内必做
  - [x] **ft 外延后**（scenario 维护类，与 V3-03 性质相同）
  - [ ] 不处理
- **结论**：**ft 外延后**——建议与 V3-03 合并为单条 TD `td-007-scn-001-maintenance`（一次修订 Cookie Path + related-features 两处）。

---

### [SUGGESTION-V3-01] `EMAIL_ALREADY_EXISTS` 5 分钟窗口外暴露邮箱已注册状态

- **业务影响**：scn-001 Alternative path 步骤 4 要求"不得暴露邮箱是否已注册"，v3 设计在 5 分钟幂等窗口外返回 `409 EMAIL_ALREADY_EXISTS`（OpenAPI `/auth/register` 已声明），明确告诉攻击者目标邮箱已注册，与 scn-001 alternative 路径冲突。但 MVP 无邮箱验证（无法走"已发送确认邮件"友好响应），且业界 register 端点常见做法即返回 409，属于"安全 vs 友好性"的接受 trade-off。
- **处理成本**：彻底符合 scn-001 需引入邮箱异步发送 + 注册响应均匀化，估算 1-2 天，超出 ft-001 范围。
- **推荐处置**：
  - [ ] ft 内必做
  - [ ] ft 外延后
  - [x] **不处理**（MVP 阶段接受 trade-off；scn-001 该条 alternative 描述本就有"产品决策后统一"的伏笔。建议在 design §5.5 隐私合规小节追加 1 行"MVP 接受 trade-off：5min 幂等窗口外返回 409 EMAIL_ALREADY_EXISTS，待引入邮箱验证后再统一为均匀响应"以留痕）
- **结论**：**不处理 + 加 1 行文档化**（说明非疏漏而是 MVP 主动取舍）。

---

### [SUGGESTION-V3-02] `rememberMe` 字段保留但 true / false 行为相同

- **业务影响**：feature.md US-002 AC5 明确 rememberMe true/false 均同样下发 7 天 Max-Age 的 refreshToken Cookie。前端 UI 若仍展示"记住我"复选框，将给用户错觉：勾选/不勾选都不影响登录期长，构成 UX 信任偏差。但当前 ft-001 范围未要求登录页 UI 实现细节，且字段保留为未来差异化（如 false 时改 sessionToken 或缩短 Max-Age）留接口，属可接受。
- **处理成本**：要么前端不展示该复选框（简单），要么真正实现差异化（中等成本，需新增 token 配置层）。
- **推荐处置**：
  - [ ] ft 内必做
  - [ ] ft 外延后
  - [x] **不处理**（feature.md §需求变更记录已显式说明"保留以便后续差异化"；建议在 design §1.2 前端组件章节补 1 行"AuthForm 登录场景 MVP 隐藏 rememberMe 复选框；待 ft 外引入差异化后再放出"，避免 UI 设计期再引疑问）
- **结论**：**不处理 + 加 1 行 UI 取舍说明**。

---

### [SUGGESTION-V3-03] `td-004 cors-config` 描述边界模糊

- **业务影响**：td-004 标题"CORS 白名单环境化配置 + 多域名支持"——但 v3 §11.1 已落地 `ALLOWED_ORIGINS` env 变量（支持逗号分隔多域名），意味着"环境化配置 + 多域名"在 MVP 已完成。TD 描述未划清"MVP 已做"vs"TD 待做"边界，未来 Orchestrator / 后续 Designer 接到该 TD 会产生"是不是已经做了？"的疑惑。
- **处理成本**：≤ 5 分钟（在 .last-action-summary.md td-004 行追加"MVP 已实现：env 多域名配置；TD 范围：动态白名单热加载 / per-env 策略 / 来源校验日志 / 与 CSRF token 协同"）。
- **推荐处置**：
  - [x] **ft 内必做**（属本 ft 的 TD 登记自身质量问题，与 ft 外延后类 TD 描述清晰度直接相关，1 行修订）
  - [ ] ft 外延后
  - [ ] 不处理
- **结论**：**ft 内必做（描述补全级）**——只需修订 .last-action-summary.md td-004 描述，无需改 design / feature。

---

### [SUGGESTION-V3-04] `423 ACCOUNT_LOCKED` 响应中 locked_until 未指定承载位置

- **业务影响**：feature.md US-002 AC3 要求"423 ACCOUNT_LOCKED（locked_until 时间戳准确）"，但 openapi.yaml `ErrorResponse` 的 `details[]` 字段仅有 `field/message/value`，未规定 locked_until 应如何返回。Developer 可能实现成 (a) 写入 `details[].value`、(b) 加 HTTP header `Retry-After`、(c) 自定义顶级字段——三种方式前端解析逻辑不同，跨端契约不明确。
- **处理成本**：≤ 10 分钟（在 openapi.yaml `/auth/login` 423 响应增 example，或在 design §5.3 限流表后追加 1 行"ACCOUNT_LOCKED 响应通过 `error.details[]` 携带 `field=lockedUntil, value=ISO8601 时间戳`"）。
- **推荐处置**：
  - [x] **ft 内必做**（前后端契约一致性属本 ft，1 行声明即可消除歧义）
  - [ ] ft 外延后
  - [ ] 不处理
- **结论**：**ft 内必做（契约表达级）**——在 design.md §5.3 或 openapi.yaml example 二选一明确即可。

---

## 评审结论与必要修订清单

**结论**：**Changes Requested**

**触发原因**：

- 2 项 ft 内必做 [CONCERN]：V3-01（AuthResponse 缺 token）、V3-02（CORS fail-fast 措辞不全）
- 2 项 ft 内必做 [SUGGESTION]：V3-03（td-004 描述边界）、V3-04（locked_until 承载位置）

**Designer 返工 checklist（按修订顺序）**：

1. **[必] openapi.yaml `AuthResponse.data`** 增 `accessToken: string` + `expiresIn: integer (default 900)`；`required` 加入这两个字段
2. **[必] feature.md US-001** 增 `AC7 — 注册成功响应同时下发 accessToken（900s）+ Set-Cookie refreshToken（7d），用户立即登录态可用`
3. **[必] design.md §4.1 序列图** 末尾"201 AuthResponse"备注"含 accessToken + expiresIn"
4. **[必] design.md §11.1** ALLOWED_ORIGINS 行追加"启动时校验非空，否则进程退出"
5. **[必] design.md §5.6** CORS 行追加"启动 env 加载阶段对 ALLOWED_ORIGINS 做非空校验"
6. **[必] design.md §5.3 或 openapi.yaml `/auth/login` 423 响应** 明确 locked_until 通过 `error.details[]` 承载（建议 `field=lockedUntil, value=ISO8601`）
7. **[必] .last-action-summary.md td-004** 条目追加"MVP 已落地 env 多域名 / TD 范围：动态白名单 + per-env 策略 + 来源校验日志"
8. **[选] design.md §5.5** 隐私合规追加 1 行说明 5min 外 EMAIL_ALREADY_EXISTS 是 MVP 主动 trade-off（SUGGESTION-V3-01）
9. **[选] design.md §1.2** 追加 1 行 AuthForm MVP 隐藏 rememberMe 复选框的 UI 取舍（SUGGESTION-V3-02）
10. **[选] 登记 `td-007-scn-001-maintenance`** 处理 Cookie Path + related-features 两处 scn-001 维护（CONCERN-V3-03 / V3-04 合并）

修订完成后重新提交复评。预计 Designer 修订工作量 **30-60 分钟**，复评工作量 **15 分钟**。

---

## 风险 & 缓解汇总

| 风险 | 等级 | 缓解方案 | 负责 |
|------|------|---------|------|
| AuthResponse 缺 token 字段，Developer 接契约二义性 | 中 | 修订 OpenAPI + feature.md + design 序列图三处对齐 | Designer |
| CORS 启动未 fail-fast，生产配置失误难定位 | 中 | §11.1 / §5.6 明确"启动校验，缺值进程退出" | Designer |
| EMAIL_ALREADY_EXISTS 暴露邮箱状态 | 低 | 文档化为 MVP trade-off，待邮箱验证 epic 统一 | Designer + 产品 |
| scn-001 Cookie Path 不一致，长期影响 scenario 可读性 | 低 | 登记 td-007 单点修订 | 后续 ft |
| rememberMe UI 信任偏差 | 低 | MVP 隐藏复选框；保留字段为差异化预留 | Developer（UI 阶段） |

---

## 评审耗时

约 35 分钟（含读取 feature.md / design.md / openapi.yaml / data-model.md / scn-001 / design-review skill / feature-design skill / ADR-002 / state files 等共 ~5500 行文本，三组核查 + 6 项 minor 三段式拟写 + 报告产出）。

---

## v4 评审范围

- `feature.md`（v4）— 4 US / 25 AC（含 v4 新增 AC7）+ 需求变更记录（v3 → v4 新增 8 条）
- `design.md`（v4）— 11 节设计详设（§1.2 / §4.1 / §5.3 / §5.5 / §5.6 / §11.1 v4 已修订）
- `docs/api/openapi.yaml`（v4 已修订）— `AuthResponse.data` 必填 `accessToken` + `expiresIn`；`/auth/login` 423 增 example
- `docs/data/data-model.md`（v4 未变动，仅验证一致性）— `User` / `RefreshToken` / `AuditLog` 等实体
- `scn-001`（未修订；v3-03/04 偏差已登记 td-007）
- Designer v4 `.last-action-summary.md` 自检结论 + 7 条 TD 登记

变更分级维持 **T3**（沿用 v3 判定：OpenAPI 新增 2 个端点、ErrorResponse 枚举大量补全、data-model 新增 2 个实体 + User 3 字段）。v4 是对 v3 4 项 ft 内必做的修补，**不引入新架构决策**。

---

## A. v3 必做 4 大类核查（v4 复评重点）

| v3 编号 | v4 期望修复位置 | 核查结果 | 引用 |
|---------|----------------|---------|------|
| **CONCERN-V3-01** AuthResponse 缺 token | openapi.yaml `AuthResponse.data` 必填 `accessToken`/`expiresIn` / feature.md US-001 AC7 / design.md §4.1 序列图 | ✅ **三处全部对齐** | `openapi.yaml:1331-1404`（required + properties + example）/ `feature.md:66`（AC7）/ `design.md:211`（序列图末"含 data.accessToken + data.expiresIn=900"） |
| **CONCERN-V3-02** CORS 启动 fail-fast | design.md §11.1 + §5.6 ALLOWED_ORIGINS 启动校验 | ✅ **两处全部对齐** | `design.md:505`（§11.1"启动时校验非空 + 形如 `https?://host[:port]` 列表，缺值/格式不合法时进程退出（fail-fast）"）/ `design.md:333`（§5.6"启动 env 加载阶段对 `ALLOWED_ORIGINS` 做非空 + 形如 `https?://host[:port]` 列表的校验，缺值/格式不合法时进程退出（fail-fast），与 `JWT_SECRET` 同级严格度"） |
| **SUGGESTION-V3-03** td-004 描述边界 | .last-action-summary.md td-004 行 | ✅ **边界已划清** | `.last-action-summary.md:87` td-004 = "**MVP 已落地**：`ALLOWED_ORIGINS` env 多域名（逗号分隔）+ 启动 fail-fast 校验；**TD 范围**：动态白名单热加载 / per-env 策略（dev / staging / prod 差异化）/ 来源校验日志 / 与 CSRF token 协同" |
| **SUGGESTION-V3-04** locked_until 承载 | openapi.yaml /auth/login 423 example / feature.md US-002 AC3 / design.md §5.3 | ✅ **三处全部对齐** | `openapi.yaml:146-154`（423 响应 example：`error.details[]` 含 `field=lockedUntil, value=ISO8601`）/ `feature.md:76`（AC3 "locked_until 通过 `error.details[]` 承载（`field=lockedUntil, value=ISO8601`）"）/ `design.md:311`（§5.3 "**423 ACCOUNT_LOCKED 响应约定**"小节，明确不通过 Retry-After header、不通过顶级字段） |

**A 部分小结**：v3 必做 4 大类在 v4 已**全部落实且对齐三处（OpenAPI / feature.md / design.md）**。"已知不一致"尾巴已消除。

---

## B. v3 可选 3 项核查

| 编号 | v4 期望 | 核查结果 | 引用 |
|------|--------|---------|------|
| SUGGESTION-V3-01 EMAIL_ALREADY_EXISTS | design.md §5.5 文档化 trade-off | ✅ **已文档化** | `design.md:326` "**已知 trade-off（2026-06-04 v4 备注）**：MVP 5min 幂等窗口外返回 `409 EMAIL_ALREADY_EXISTS`，会明确告诉攻击者目标邮箱已注册，与 scn-001 Alternative 步骤 4"不暴露邮箱是否已注册"存在偏差。MVP 阶段主动接受此 trade-off（无邮箱验证无法走"已发送确认邮件"友好响应，彻底符合需引入异步邮件 + 响应均匀化，估算 1-2 天超出 ft-001 范围）；待后续引入邮箱验证 epic 统一为均匀响应" |
| SUGGESTION-V3-02 rememberMe UI 隐藏 | design.md §1.2 决策备注 | ✅ **已文档化** | `design.md:99` "**rememberMe 复选框（MVP 隐藏）**：当前 US-002 AC5 明确 rememberMe=true / false 均下发相同 7d Max-Age 的 Cookie，若 UI 展示该复选框将给用户"勾选/不勾选无差别"的错觉。AuthForm 登录场景在 MVP 阶段**隐藏** rememberMe 复选框，字段保留为后续差异化（如 false 时改 sessionToken 或缩短 Max-Age）留接口（2026-06-04 v4 备注）" |
| CONCERN-V3-03/04 scn-001 维护 | .last-action-summary.md 新增 td-007 | ✅ **已登记** | `.last-action-summary.md:90` "**td-007** | **scn-001 文档维护（Cookie Path + related-features）** | **ft 外延后** | scn-001 是 evergreen 文档，跨多个 ft 引用；V3-03 Cookie Path 修正（`/api/v1/auth/refresh` → `/api/v1/auth`，覆盖 logout 撤销场景）+ V3-04 `related-features` 同步（`ft-003-auth / ft-001-create` → `ft-001-user-onboarding` / `ft-002-*`）属于 scenario 维护类" |

**B 部分小结**：v3 可选 3 项在 v4 已**全部处理**。td-007 合并了 V3-03 + V3-04，1 条 TD 解决两处 scn-001 维护，避免碎片化登记。

---

## C. v4 流程规范合规性

| 检查项 | 结果 | 备注 |
|--------|------|------|
| ft 完整性：v3 的 4 项 ft 内必做是否完全消除 | ✅ | 4 项全部在三处文档对齐（openapi + feature + design），ft 内部不一致项 = 0 |
| TD 分类：7 条 TD（td-001~td-007）是否全部「ft 外延后」 | ✅ | 6 + 1 = 7 条全部「ft 外延后」；td-007 虽新增但属 scenario 维护类，未污染 ft 完整性 |
| TD 分类理由：每条是否标注 | ✅ | 7 条全部附分类理由，td-004 进一步细化 MVP 边界 |
| OpenAPI / data-model / scenario 三者完全一致 | ✅ | AuthResponse 增 token 字段（openapi + feature + design）、423 响应承载方式（openapi example + feature AC3 + design §5.3）、CORS fail-fast（design §5.6 + §11.1）三处对齐；data-model 未变动，scn-001 偏差已登记 td-007 |
| 不留下"已知不一致"尾巴 | ✅ | 4 项 v3 必做全部消除，未发现 v4 新增"ft 内必做"类不一致 |
| 是否存在 Designer 把 ft 内必做误登记为 TD | ✅ | 7 条 TD 均为合理的 ft 外延后，无 ft 内必做混入 |
| 需求变更记录 | ✅ | feature.md 新增 8 条 v3 → v4 变更条目（CONCERN-V3-01/02 + SUGGESTION-V3-01/02/03/04 + 1 条登记 td-007 + 1 条 EMAIL_ALREADY_EXISTS） |
| state.md history 追加 | ✅ | state.md v4 history 已追加（"v4 返工完成...待 Orchestrator 提交用户审批 Gate 后由 Orchestrator 推进至 Designed"） |

**C 部分小结**：v4 在 ft 完整性 / TD 分类 / 三者一致 / 不留尾巴 4 项核心合规性上**全部通过**。本 ft 进入 v4 后已无任何"ft 内必做"类待办。

---

## v4 新发现

**结论：v4 未发现需要三段式 minor 项的问题。**

逐项核查后未发现：

- 任何"ft 内必做"类 [CONCERN]（v3 4 项已全部消除，v4 无新引入）
- 任何"ft 外延后"类 [CONCERN]（v3 3 项已分别处理 / 登记为 td-007）
- 任何值得记录为 [SUGGESTION] 的优化点（v3 6 条 SUGGESTION/CONCERN 在 v4 已全部落实，三方文档一致性达 100%）

**典型核验点**（已逐项确认）：

| 核验点 | 结果 |
|--------|------|
| openapi.yaml `AuthResponse.data.required` 必填是否含 `accessToken` + `expiresIn` | ✅（`openapi.yaml:1349-1355`） |
| openapi.yaml `AuthResponse.data` properties 是否同时定义 `accessToken` + `expiresIn` | ✅（`openapi.yaml:1381-1394`，含 HS256 / 15min description） |
| openapi.yaml `AuthResponse.data.example` 是否同时含 `accessToken` + `expiresIn` | ✅（`openapi.yaml:1403-1404`） |
| feature.md US-001 AC7 是否存在并明确"accessToken（900s）" | ✅（`feature.md:66`） |
| design.md §4.1 序列图末尾"201 AuthResponse"是否含 `data.accessToken + data.expiresIn=900` | ✅（`design.md:211`） |
| design.md §11.1 `ALLOWED_ORIGINS` 行是否含"启动时校验非空 + 形如 `https?://host[:port]` 列表 + 缺值进程退出" | ✅（`design.md:505`） |
| design.md §5.6 CORS 行是否含"启动 env 加载阶段对 `ALLOWED_ORIGINS` 做非空 + 格式校验 + 缺值进程退出" | ✅（`design.md:333`） |
| .last-action-summary.md td-004 是否同时含 "MVP 已落地" + "TD 范围" | ✅（`.last-action-summary.md:87`） |
| openapi.yaml `/auth/login` 423 example 是否含 `error.details[]` 含 `field=lockedUntil, value=ISO8601` | ✅（`openapi.yaml:146-154`） |
| feature.md US-002 AC3 是否含 "locked_until 通过 `error.details[]` 承载" | ✅（`feature.md:76`） |
| design.md §5.3 是否含 "423 ACCOUNT_LOCKED 响应约定" 小节 | ✅（`design.md:311`） |
| design.md §5.5 是否含 EMAIL_ALREADY_EXISTS 已知 trade-off 备注 | ✅（`design.md:326`） |
| design.md §1.2 是否含 rememberMe 复选框 MVP 隐藏说明 | ✅（`design.md:99`） |
| .last-action-summary.md 是否登记 td-007（合并 V3-03 + V3-04） | ✅（`.last-action-summary.md:90`） |

---

## 评审结论

**结论**：**Approved**

**触发原因**：

- v3 必做 4 大类（CONCERN-V3-01/02 + SUGGESTION-V3-03/04）在 v4 全部落实，三处文档（openapi + feature + design）100% 对齐
- v3 可选 3 项（SUGGESTION-V3-01/02 + CONCERN-V3-03/04 → td-007）全部处理完毕
- v4 流程规范合规性 8 项检查全部通过
- v4 未发现新的"ft 内必做"或"ft 外延后"类 [CONCERN] / [SUGGESTION]
- 7 条 TD（td-001 ~ td-007）全部「ft 外延后」并附分类理由，ft 完整性原则保持

**Orchestrator 下一步**：

- ft-001 当前处于 `Draft` 状态，可推进至 `Designed` 后提交用户审批 Gate
- 按新模板：摆出 7 条 TD（ft 外延后）+ 0 条 ft 内必做 + 0 条 minor 业务影响
- 用户决策后进入 Developer 开发阶段

---

## v4 风险 & 缓解汇总（沿用 v3 风险，新增项 0）

| 风险 | 等级 | 缓解方案 | 负责 |
|------|------|---------|------|
| AuthResponse 缺 token 字段 | 中 | ✅ v4 已消除 | — |
| CORS 启动未 fail-fast | 中 | ✅ v4 已消除 | — |
| EMAIL_ALREADY_EXISTS 暴露邮箱状态 | 低 | design §5.5 文档化为 MVP trade-off，待邮箱验证 epic 统一 | 产品 |
| scn-001 Cookie Path 不一致 | 低 | td-007 单点修订 | 后续 ft |
| rememberMe UI 信任偏差 | 低 | design §1.2 文档化 MVP 隐藏，字段保留为差异化预留 | Developer（UI 阶段） |

---

## v4 评审耗时

约 **20 分钟**（含读取 v3 architecture-review.md（228 行）/ v4 feature.md（182 行）/ v4 design.md（552 行）/ openapi.yaml（2 处定位 grep）/ data-model.md（472 行，仅一致性核验）/ .last-action-summary.md（138 行）/ state.md（14 行）；核查 v3 必做 4 大类 + v3 可选 3 项 + v4 流程规范 8 项 + 14 个典型核验点 + 报告产出）。

**v4 评审效率高于 v3 复评**（v3 35min → v4 20min，节省 43%），主因：v4 已无新发现项，三段式 minor 数量 = 0，输出聚焦 Approved 论证而非问题清单。
