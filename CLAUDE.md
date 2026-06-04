# CLAUDE

我是单人使用基于多智能体研发流程进行产品开发。

## 工作类型速查

| 工作类型 | 触发条件 | 涉及角色 | 关键 Gate | 流程文档 |
|---------|---------|---------|----------|---------|
| **Feature** | Product Backlog 选中 | Orchestrator / Designer / Developer / Tester / Reviewer | 设计方案审批、用户验收 | [feature-flow.md](docs/process/feature-flow.md) |
| **Tech Debt** | 代码扫描 / 人工识别 | Orchestrator / Developer / Reviewer | 建立、关闭 | [tech-debt-flow.md](docs/process/tech-debt-flow.md) |
| **Defect** | 测试发现 / 生产事件 | Orchestrator / Tester / Developer / Reviewer | 定级 | [defect-flow.md](docs/process/defect-flow.md) |

差异一览：

| 维度 | Feature | Tech Debt | Defect |
|------|---------|-----------|--------|
| 需要 Designer？ | 是（完整设计） | 否 | 否 |
| 需要 Tester 完整流程？ | 是（P0/P1/P2） | 否（收尾扫描） | 是（验证修复） |
| 设计方案审批 Gate | 有 | 无 | 无 |
| 状态机复杂度 | 6 状态 + 多循环 | 3 状态 | 5 状态 + 终结态 |
| 产出 feature.md/design.md | 是 | 否 | 否 |

## 系统组件

### Agent / Skill

| 类型 | 位置 |
|------|------|
| **Orchestrator** | `.claude/agents/prompts/orchestrator.md` |
| **Sub-Agent** | Designer / Developer / Tester / Reviewer — `.claude/agents/prompts/` |
| **10 个 Skill** | `.claude/skills/` |

> **Agent Prompt 自包含原则**：Claude Code 的 `Agent` 工具不会自动解析 markdown 链接或加载依赖文件。所有 agent prompt 均已内联硬约束、状态 Schema 和编排完成信号，无需也不应依赖外部文件自动注入。引用 Skill 时使用完整路径（如 `.claude/skills/engineering/SKILL.md`），由 agent 按需主动读取。

### 协作工件

| 工件 | 位置 |
|---------|--------|
| **Product Backlog** | `docs/backlog/Product-Backlog.md` |
| **架构决策** | `docs/decisions/` |
| **C4 架构图** | `docs/architecture/c4/` |
| **数据模型** | `docs/data/data-model.md` |
| **OpenAPI 规范** | `docs/api/openapi.yaml` |
| **测试资产注册表** | `docs/quality/test-registry.md` |

### 质量管道

质量分层与门禁定义见 [docs/architecture/quality-pipeline.md](docs/architecture/quality-pipeline.md)。
