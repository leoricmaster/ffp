# CLAUDE

我是单人使用基于多智能体的研发流程进行产品开发：

其中涉及到以下 Agent / Skill：

| 类型 | 位置 |
|------|------|
| **Orchestrator** | `.claude/agents/prompts/orchestrator.md` |
| **Sub-Agent** | Designer / Developer / Tester / Reviewer — `.claude/agents/prompts/` |
| **共享规范** | `.claude/agents/prompts/_fragments/`（含 state-schema、orchestration-interface） |
| **10 个 Skill** | `.claude/skills/` |

它们会根据以下文档进行协作：

| 工件 | 位置 |
|---------|--------|
| **Product Backlog** | `docs/backlog/Product-Backlog.md` |
| **架构决策** | `docs/decisions/` |
| **C4 架构图** | `docs/architecture/c4/` |
| **数据模型** | `docs/data/data-model.md` |
| **OpenAPI 规范** | `docs/api/openapi.yaml` |
| **测试资产注册表** | `docs/quality/test-registry.md` |

产品研发工作可以分为三大类，feature、tech debt 和 defect，研发流程如下：

| 工件 | 位置 |
|---------|--------|
| **研发流程** | `docs/process/README.md` |
| **质量管道** | `docs/architecture/quality-pipeline.md` |
