---
name: l1-guardrails
description: L1 工具级强制清单——机器自动检查并阻断的规则，Agent 无需在 Prompt 中重复。
---

# L1 工具级强制清单

> 本清单由 CI / 脚本自动执行，Agent 无需手动检查。
> 若 CI 报红，按对应失败路径处理。

## 状态与流程

| 规则 | 工具 / 脚本 | 阻断时机 |
|------|------------|---------|
| state.md schema 合法性 | `scripts/check-feature-flow.js` | PR 阶段 |
| feature.md ID 已注册 | `scripts/check-feature-flow.js` | PR 阶段 |
| 状态守卫一致性 | `scripts/check-feature-flow.js` | PR 阶段 |
| 状态机流转推荐 | `scripts/orchestrator-state-machine.js` | Orchestrator 决策时 |

## 代码安全

| 规则 | 工具 | 阻断时机 |
|------|------|---------|
| 用户输入未校验 / 直接拼接 SQL / shell / HTML | ESLint security 规则 | commit |
| 敏感信息泄露（密码 / token / API key） | CI secret scan | PR 阶段 |

## PR 规范

| 规则 | 工具 | 阻断时机 |
|------|------|---------|
| Code Review 前合并 | branch protection | push |
| 一个 PR 解决多个独立问题 | PR 模板检查脚本 | PR 创建 |
| PR diff > 800 行未拆分 | PR check script | PR 更新 |
| 对已有 open PR force-push | branch protection + hook | push |

## 测试

| 规则 | 工具 | 阻断时机 |
|------|------|---------|
| P0 测试失败 | CI workflow | PR 合并前 |
| L1 覆盖率 < 80% | CI coverage check | PR 合并前 |
| Playwright 使用 waitForTimeout | ESLint 规则 | commit |
| test-plan.md 每个 AC 至少 1 个 P0 | 解析脚本 | PR 阶段 |
| test-report.md BLOCKED 标为 PASS | 解析脚本 | 测试报告生成 |
| Flaky 测试超 2 周未修复 | GitHub Action | 每日检查 |

## Storybook

| 规则 | 工具 | 阻断时机 |
|------|------|---------|
| has_storybook: yes 但零新增 stories | stories 扫描脚本 | PR 阶段 |
