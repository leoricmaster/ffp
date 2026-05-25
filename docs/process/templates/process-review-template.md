# Process Review 模板

> 有真实流程教训才写，正常跑通则省略。

位置：`docs/process/reviews/<feature-id>-process-review.md`

---

## 基本信息

| 字段 | 值 |
|------|-----|
| feature_id | ft-XXX-slug |
| 设计审批轮数 | N |
| PR review 轮数 | N |
| P0 失败次数 | N |
| Draft → Done 实际耗时 | X 天 / 小时 |
| 是否按时交付 | 是 / 否 |

## 流程健康度

### 设计阶段

- [ ] 需求在 Draft 阶段已充分澄清，无后续变更
- [ ] design.md 无需重大修正即可进入 Implementing
- [ ] 架构评审（如有）一次性通过

### 实现阶段

- [ ] 编码按 design.md 执行，无设计偏离
- [ ] PR 一次性通过 review
- [ ] P0 测试一次性通过

### 验收阶段

- [ ] 用户验收一次性通过
- [ ] main CI 一次性通过

## 问题与教训

| 阶段 | 问题 | 根因 | 改进措施 |
|------|------|------|---------|
| | | | |

## 可复用资产

- [ ] 新组件 / 工具函数可复用（列出）
- [ ] 新 pattern 值得推广（列出）

## 新增技术债务

- [ ] 无
- [ ] 有（登记到 GitHub Issues，标签 `type:tech-debt` + `debt:active`）
