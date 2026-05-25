---
name: test-design-rubric
agent: Tester
triggers:
  - Designed 后设计测试用例时
  - 评审用例覆盖度时
description: 测试用例设计 rubric——P0/P1/P2 优先级标准、AC→AT 覆盖矩阵、边界值清单、契约一致性检查、AT/CT/IT 三视角分工。
depends_on: []
human_doc: docs/architecture/quality-pipeline.md#test-layering
---

# 测试用例设计 Rubric

> Wave 5-5 起作为 Skill。Tester 在 `Designed` 后设计用例时按需加载；具体执行细节见 `.claude/agents/prompts/tester.md`。

---

## 1. 三视角分工

| 视角 | 依据 | 关注 | 不关注 | 对应测试层 |
|------|------|------|--------|-----------|
| **Acceptance** | feature.md / us-*.md 的 AC | 用户行为是否符合 AC | 代码内部实现 | L3 E2E |
| **Contract** | OpenAPI + design.md API 段 | 请求 / 响应 / 状态码 / schema | 业务计算正确性 | L2 集成（API 契约验证） |
| **Integration** | design.md 端到端流程 + AC | 完整用户旅程（前端 → API → DB → 返回） | 单元逻辑 | L2 集成（完整流程） |

**与质量管道分层对应**：Acceptance + Integration 视角的用例主要落入 L2/L3；L1 单元测试由 Developer 在编码阶段覆盖，不在本 Skill 范围内。

## 2. P0 / P1 / P2 优先级

### 决策树

```
这个用例失败时，用户能否完成核心任务？
  ├─ 否 → P0（核心功能）
  └─ 是 → 这个用例失败时，功能是否受限？
          ├─ 是 → P1（重要功能）
          └─ 否 → P2（边界 / 异常）
```

### 分类定义

| 优先级 | 定义 | 必须覆盖 | 失败处理 |
|-------|------|---------|---------|
| **P0** | 核心 AC，失败 = 功能不可用 | ✅ 强制 | 测试停止，必须修复（README §4.3 P0 门禁） |
| **P1** | 重要 AC，失败 = 功能受限 | ✅ 应该 | 记录 + 继续 |
| **P2** | 边界 / 异常，失败 = UX 不佳 | 尽量 | 记录 + 继续 |

### P0 必覆盖场景（每个 feature）

1. **正面路径**：每个 AC 的主要成功场景
2. **核心字段验证**：AC 中明确的必填 / 格式
3. **最常见错误路径**：用户最可能犯的错（如密码错、必填空）

## 3. AC → 用例覆盖矩阵

每个 feature 的测试报告必须有：

```markdown
## AC 覆盖矩阵

| AC | 用例 ID | 覆盖状态 | 优先级 |
|----|---------|---------|-------|
| AC1 | AT-001 | ✅ | P0 |
| AC2 | AT-002, AT-003 | ✅ | P0, P1 |
| AC3 | AT-004 | ⚠️ 部分（缺边界） | P1 |
```

无覆盖的 AC 必须在报告里说明理由（"延后到下版本"不算理由——登记 tech-debt）。

## 4. 从 US/UC 到 Test Case 的转化检查

Tester 基于 `us-*.md` 和 `uc-*.md` 设计用例时，必须完成以下检查：

- [ ] 每个 AC 至少对应 1 个 P0 测试用例
- [ ] 每个 UC Error Path 至少对应 1 个 P1 测试用例
- [ ] 边界值（金额 0/null/负数/极大值、空列表、单条记录）有独立用例
- [ ] 权限边界（管理员 vs 成员）有独立用例
- [ ] 并发/竞态条件（如重复提交）有独立用例

**转化路径**：
```
us-*.md AC (Given/When/Then)
  → 正面路径 → P0 AT（E2E）
  → 负面路径 → P1 AT / P2 CT（集成）
  → 边界值 → 专用边界用例

uc-*.md Error Path
  → 技术异常 → P1 CT（集成契约）
  → 权限异常 → P1 AT（E2E）
  → 状态不一致 → P1 IT（集成流程）
```

## 5. 边界值设计清单

| 字段类型 | 边界值 |
|---------|--------|
| **金额** | 0 / 0.01 / 上限 / 负数 / 超大数（`Number.MAX_SAFE_INTEGER`） |
| **日期** | 今天 / 昨天 / 未来（如允许）/ 最早允许日期 / 跨时区 |
| **字符串** | 空字符串 / 1 字符 / 最大长度 / 超长 / 特殊字符（`<>'"&;`） / emoji / RTL 字符 |
| **枚举** | 每个值 / 非法值 / 大小写敏感性 |
| **数组** | 空 / 单元素 / 100+ 元素 / 重复元素 |
| **布尔** | 真 / 假 / null / undefined / 字符串 "true" |

**特别提醒**（ft-002 教训）：字符串匹配逻辑必须设计**重叠 / 前缀冲突**场景（如 `category.startsWith()` 在 "工资" 和 "工资-基本" 同时存在时）。

## 5. Contract 测试 checklist

### 设计前必做（一致性检查）

- [ ] OpenAPI 内部自洽：`required` / `nullable` / `optional` 不矛盾
- [ ] OpenAPI 约束（`minimum` / `maxLength` / `pattern`）在 schema 与 description 两处一致
- [ ] 枚举值 in description == enum definition
- [ ] OpenAPI vs design.md 字段必填 / 可选 / 约束一致

### 兼容性矩阵（改现有 API 时）

| 变更 | 兼容 | 处理 |
|------|------|------|
| 新增可选字段 | ✅ | 直接改 |
| 新增枚举值 | ✅ | 直接改 |
| 改字段约束（minLength: 5→3） | ⚠️ | 视情况上报 Reviewer |
| 新增必填字段 | ❌ | 必须上报 |
| 删字段 | ❌ | 必须上报 |
| 改字段类型 | ❌ | 必须上报 |
| 删枚举值 | ❌ | 必须上报 |

发现矛盾或不兼容 → 立即上报 Reviewer 裁决（见 tester.md §契约矛盾上报模板）。

### Schema 验证清单

每个 endpoint 至少：

- [ ] 200/201 正面响应符合 schema
- [ ] 400 字段验证错误符合 Error schema
- [ ] 401 / 403（如有权限） 符合 Error schema
- [ ] 404（如 GET 单条） 符合 Error schema
- [ ] 必填缺失 / 类型错 / 约束违反各一条用例

## 6. Integration 测试设计

每个 feature 至少：

- **IT-001**：完整正面流程（前端操作 → API 调用 → 后端处理 → 前端响应）
- **IT-00X**：错误恢复（失败后用户能重试）
- 数据需求表：每个用例标注依赖数据 / 来源 / 准备 / 清理

参考：详细 E2E 写法见 `e2e-playwright` Skill。

## 7. 测试结果判定

| 状态 | 算通过吗 |
|------|---------|
| ✅ PASS | ✅ |
| ❌ FAILED | ❌ |
| ⏸️ BLOCKED | ❌ |
| ⏭️ SKIP | ❌ |

**BLOCKED ≠ PASS**。ft-003 的 AT 0/25 全挂被 manual acceptance 兜底——这条通道只在写出"AT 无法自动化的 root cause"时才合规（README §3.2.1）。

## 8. 反模式

❌ **不要**：

- 看代码实现后倒推用例
- 假设"开发者应该会测试这个"
- 用例描述笼统（"用户体验良好"）
- BLOCKED 报成 PASS
- 边界场景"等 PR 再补"

✅ **要做**：

- 只基于 feature.md / OpenAPI / design.md 设计
- 每个 AC 至少一正面 + 一负面用例
- 字符串匹配必设计前缀冲突场景
- 与 Contract / Integration 视角沟通避免重复

## 相关

- `.claude/agents/prompts/tester.md` — Tester 全流程
- `.claude/skills/e2e-playwright` — Integration 视角的 Playwright 细节
- `docs/process/common.md §6` — E2E 规范人类入口（事实源在 `e2e-playwright` Skill）
