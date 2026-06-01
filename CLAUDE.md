# CLAUDE

我是单人使用基于多智能体的研发流程进行产品开发：

其中涉及到以下 Agent / Skill：

| 类型 | 位置 |
|------|------|
| **Orchestrator** | `.claude/agents/prompts/orchestrator.md` |
| **Sub-Agent** | Designer / Developer / Tester / Reviewer — `.claude/agents/prompts/` |
| **共享规范** | `.claude/agents/prompts/_contracts/`（orchestration-interface 等；已由各 agent prompt 内联，无自动 include） |
| **10 个 Skill** | `.claude/skills/` |

> **Agent Prompt 自包含原则**：Claude Code 的 `Agent` 工具不会自动解析 markdown 链接或加载依赖文件。所有 agent prompt（`orchestrator.md` / `designer.md` / `developer.md` / `reviewer.md` / `tester.md`）均已内联硬约束、状态 Schema 和编排完成信号，无需也不应依赖外部文件自动注入。引用 Skill 时使用完整路径（如 `.claude/skills/engineering/SKILL.md`），由 agent 按需主动读取。

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
