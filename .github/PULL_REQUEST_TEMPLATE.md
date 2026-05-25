## Summary

<!-- 1-3 句话说这个 PR 做了什么 -->

## Why

<!-- 为什么现在做 / 关联的 issue 或 feature -->

## Test plan

- [ ] 单元测试通过
- [ ] Contract / Acceptance / Integration 测试通过（如适用）
- [ ] CI 绿
- [ ] 手测的用户流程

## 测试影响自检（如适用）

<!-- 以下勾选项帮助 review 快速判断测试覆盖是否充分 -->

- [ ] 本次改动不涉及测试变更
- [ ] 本次改动涉及测试新增/修改，且：
  - [ ] Backend Unit：新增/修改的模块已有 `@baseline` / `@ft-xxx` 标记的测试
  - [ ] Frontend Unit：新增/修改的组件/hook 已有测试
  - [ ] Contract：如涉及 API 变更，OpenAPI 已更新且 contract 测试通过
  - [ ] Integration：如涉及跨模块业务流，`workflow-definitions.ts` 中已新增对应 workflow
  - [ ] E2E：新增/修改的 spec 文件名带 feature ID（如 `ffp-NNN-*.spec.ts`）

## Flow impact（必选二选一）

<!-- docs/architecture/flows/ 是产品级业务流程视图。若改动触及某 flow 的步骤 / API 契约 / 路由 / 权限模型 / 维护触发器列出的任一项，flows/ 必须在本 PR 内一并更新。 -->

- [ ] 本 PR 触及某 flow 的步骤 / 契约 / Actor → `flows/flow-XXX.md` 已同步更新，`feature.md ## 关联 Flow` 已对齐
- [ ] 本 PR 不触及任何 flow 的维护触发器

## Non-goals（可选）

<!-- 明确这个 PR 不做什么，避免 review 跑题 -->

## Related

<!-- Closes #xxx -->
<!-- Feature: ft-xxx-<slug> -->
